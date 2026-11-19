import {execFile} from 'node:child_process';
import {openSync, readSync, closeSync} from 'node:fs';
import {promisify} from 'node:util';
import ffprobeStatic from 'ffprobe-static';

const execFileAsync = promisify(execFile);

export type MediaProbe = {
  duration?: number;
  width?: number;
  height?: number;
  hasAlpha?: boolean;
};

const ALPHA_PIX_FMT = /(yuva|rgba|argb|bgra|abgr|gbrap|ya8|ya16)/;

type FfprobeStream = {
  codec_type?: string;
  width?: number;
  height?: number;
  pix_fmt?: string;
};
type FfprobeOutput = {
  format?: {duration?: string};
  streams?: FfprobeStream[];
};

/** Metadados de vídeo/áudio via ffprobe-static (JSON). */
export const probeMedia = async (filePath: string): Promise<MediaProbe> => {
  const {stdout} = await execFileAsync(ffprobeStatic.path, [
    '-v', 'error',
    '-print_format', 'json',
    '-show_format',
    '-show_streams',
    filePath,
  ], {maxBuffer: 10 * 1024 * 1024});

  const parsed = JSON.parse(stdout) as FfprobeOutput;
  const video = parsed.streams?.find((s) => s.codec_type === 'video');
  const duration = parsed.format?.duration ? Number(parsed.format.duration) : undefined;
  return {
    duration: duration !== undefined && Number.isFinite(duration) ? duration : undefined,
    width: video?.width,
    height: video?.height,
    hasAlpha: video?.pix_fmt ? ALPHA_PIX_FMT.test(video.pix_fmt) : undefined,
  };
};

/**
 * PNG: dimensões e alpha direto do IHDR (bytes fixos) — sem processo externo.
 * colorType 4 (gray+alpha) e 6 (rgba) têm alpha. tRNS em paleta não é detectado.
 */
export const probePng = (filePath: string): MediaProbe => {
  const header = Buffer.alloc(26);
  const fd = openSync(filePath, 'r');
  try {
    readSync(fd, header, 0, 26, 0);
  } finally {
    closeSync(fd);
  }
  const isPng = header.readUInt32BE(0) === 0x89504e47;
  if (!isPng) return {};
  const colorType = header.readUInt8(25);
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
    hasAlpha: colorType === 4 || colorType === 6,
  };
};
