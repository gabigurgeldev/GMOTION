/**
 * Tracker offline:
 *   pnpm --filter @gmotion/tracking run track <video> --point 540,960 [--fps 15] [--width 320] [--patch 24] [--search 24]
 * `--point` em px do VÍDEO ORIGINAL (frame inicial). Gera `<video>.track.json`.
 */
import {existsSync, writeFileSync} from 'node:fs';
import process from 'node:process';
import {decodeGrayFrames, probeVideo} from './decode-frames.ts';
import {trackSequence} from './tracker.ts';
import type {TrackData} from './types.ts';

const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
const filePath = positional[0];

const flagValue = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? undefined : args[index + 1];
};

const pointArg = flagValue('point');
if (!filePath || !existsSync(filePath) || !pointArg) {
  console.error('Uso: pnpm --filter @gmotion/tracking run track <video> --point x,y [--fps 15] [--width 320]');
  process.exit(1);
}
const [pointX, pointY] = pointArg.split(',').map(Number);
if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
  console.error('--point inválido, use: --point 540,960');
  process.exit(1);
}

const sampleFps = Number(flagValue('fps') ?? 15);
const analysisWidth = Number(flagValue('width') ?? 320);
const patchSide = Number(flagValue('patch') ?? 24);
const searchRadius = Number(flagValue('search') ?? 24);

const info = await probeVideo(filePath);
const scale = analysisWidth / info.width;
const analysisHeight = Math.round((info.height * scale) / 2) * 2;

console.log(`Vídeo ${info.width}x${info.height} @ ${info.fps.toFixed(1)}fps, ${info.duration.toFixed(1)}s`);
console.log(`Análise em ${analysisWidth}x${analysisHeight} @ ${sampleFps}fps...`);

const frames = await decodeGrayFrames(filePath, analysisWidth, analysisHeight, sampleFps);
console.log(`${frames.length} frames decodificados.`);

const track = trackSequence(
  frames,
  Math.round((pointX as number) * scale),
  Math.round((pointY as number) * scale),
  {patchSide, searchRadius},
);

// Converte de volta pra coordenadas do vídeo original.
const data: TrackData = {
  version: 1,
  sourceFile: filePath,
  width: info.width,
  height: info.height,
  fps: sampleFps,
  frames: track.map((f) => ({
    ...f,
    x: Math.round(f.x / scale),
    y: Math.round(f.y / scale),
  })),
};

const outputPath = `${filePath}.track.json`;
writeFileSync(outputPath, JSON.stringify(data));

const low = data.frames.filter((f) => f.confidence < 0.5).length;
console.log(`Track gravado: ${outputPath}`);
console.log(`  amostras: ${data.frames.length}`);
console.log(`  confiança < 0.5: ${low} (${((low / data.frames.length) * 100).toFixed(0)}%)`);
console.log(`  primeira: (${data.frames[0]?.x}, ${data.frames[0]?.y})  última: (${data.frames.at(-1)?.x}, ${data.frames.at(-1)?.y})`);
