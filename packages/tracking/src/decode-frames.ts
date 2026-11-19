import {execFile, spawn} from 'node:child_process';
import {promisify} from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import type {GrayFrame} from './tracker.ts';

const execFileAsync = promisify(execFile);

export type VideoInfo = {width: number; height: number; fps: number; duration: number};

export const probeVideo = async (filePath: string): Promise<VideoInfo> => {
  const {stdout} = await execFileAsync(ffprobeStatic.path, [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height,r_frame_rate:format=duration',
    '-print_format', 'json',
    filePath,
  ]);
  const parsed = JSON.parse(stdout) as {
    streams?: {width?: number; height?: number; r_frame_rate?: string}[];
    format?: {duration?: string};
  };
  const stream = parsed.streams?.[0];
  const [num, den] = (stream?.r_frame_rate ?? '30/1').split('/').map(Number);
  return {
    width: stream?.width ?? 0,
    height: stream?.height ?? 0,
    fps: (num ?? 30) / (den ?? 1),
    duration: Number(parsed.format?.duration ?? 0),
  };
};

/**
 * Decodifica o vídeo em frames GRAYSCALE reduzidos (largura `analysisWidth`),
 * amostrados a `sampleFps` — via ffmpeg rawvideo no stdout, sem arquivos
 * intermediários. Só roda offline (CLI).
 */
export const decodeGrayFrames = (
  filePath: string,
  analysisWidth: number,
  analysisHeight: number,
  sampleFps: number,
): Promise<GrayFrame[]> => {
  if (!ffmpegPath) {
    return Promise.reject(new Error('ffmpeg-static não encontrou binário.'));
  }
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath as string, [
      '-hide_banner', '-loglevel', 'error',
      '-i', filePath,
      '-vf', `fps=${sampleFps},scale=${analysisWidth}:${analysisHeight}`,
      '-f', 'rawvideo',
      '-pix_fmt', 'gray',
      'pipe:1',
    ]);
    const chunks: Buffer[] = [];
    const errors: Buffer[] = [];
    child.stdout.on('data', (c: Buffer) => chunks.push(c));
    child.stderr.on('data', (c: Buffer) => errors.push(c));
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg saiu com ${code}: ${Buffer.concat(errors).toString()}`));
        return;
      }
      const buffer = Buffer.concat(chunks);
      const frameSize = analysisWidth * analysisHeight;
      const count = Math.floor(buffer.length / frameSize);
      const frames: GrayFrame[] = [];
      for (let i = 0; i < count; i++) {
        frames.push({
          data: new Uint8Array(buffer.subarray(i * frameSize, (i + 1) * frameSize)),
          width: analysisWidth,
          height: analysisHeight,
        });
      }
      resolve(frames);
    });
  });
};
