/**
 * CLI de análise offline:
 *   pnpm --filter @gmotion/audio run analyze <arquivo> [--fps 30] [--force]
 * Gera `<arquivo>.analysis.json` ao lado do asset (cache por mtime).
 * Requer Node >= 23 (type stripping nativo).
 */
import {existsSync} from 'node:fs';
import process from 'node:process';
import {analyzeAndCache} from './analyze-audio.ts';

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith('--'));
const filePath = positional[0];

const flagValue = (name: string): string | undefined => {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return undefined;
  return args[index + 1];
};

if (!filePath) {
  console.error('Uso: pnpm --filter @gmotion/audio run analyze <arquivo> [--fps 30] [--force]');
  process.exit(1);
}
if (!existsSync(filePath)) {
  console.error(`Arquivo não encontrado: ${filePath}`);
  process.exit(1);
}

const fps = Number(flagValue('fps') ?? 30);
const force = args.includes('--force');

const {analysis, cached, outputPath} = await analyzeAndCache(filePath, {fps, force});

console.log(cached ? `Cache válido: ${outputPath}` : `Análise gravada: ${outputPath}`);
console.log(`  duração:  ${analysis.durationInSeconds.toFixed(2)}s`);
console.log(`  bpm:      ${analysis.bpm.toFixed(1)}`);
console.log(`  beats:    ${analysis.beats.length}`);
console.log(`  onsets:   ${analysis.onsets.length}`);
console.log(`  envelope: ${analysis.amplitudeEnvelope.length} frames @ ${analysis.fps}fps`);
console.log(`  primeiros beats: ${analysis.beats.slice(0, 8).map((b) => b.toFixed(2)).join(', ')}`);
