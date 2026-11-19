#!/usr/bin/env node
/**
 * Batch export — Fase 16.
 *   node scripts/batch-render.mjs <CompId> [--formats 1080x1920,1080x1080,1920x1080]
 *     [--overrides scripts/batch-overrides.example.json] [--frames 0-59] [--parallel 2]
 *
 * Bundla o studio UMA vez e renderiza todos os formatos com pool de renders
 * paralelos, dividindo os cores (os.cpus) entre eles. Props por formato via
 * arquivo de overrides: { "<WxH>": { ...props } } (mesclado nos defaultProps).
 * Output: out/<CompId>/<WxH>.mp4
 */
import {cpus} from 'node:os';
import {mkdirSync, readFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const studioDir = resolve(repoRoot, 'apps/studio');
// Resolve @remotion/* a partir do studio (pnpm isola node_modules por pacote).
const studioRequire = createRequire(pathToFileURL(resolve(studioDir, 'package.json')));
const {bundle} = studioRequire('@remotion/bundler');
const {renderMedia, selectComposition} = studioRequire('@remotion/renderer');

const args = process.argv.slice(2);
const compId = args.find((a) => !a.startsWith('--'));
const flagValue = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};

if (!compId) {
  console.error('Uso: node scripts/batch-render.mjs <CompId> [--formats WxH,WxH,...] [--overrides file.json] [--frames a-b] [--parallel N]');
  process.exit(1);
}

const formats = (flagValue('formats') ?? '1080x1920,1080x1080,1920x1080')
  .split(',')
  .map((f) => {
    const [w, h] = f.trim().split('x').map(Number);
    if (!Number.isFinite(w) || !Number.isFinite(h)) {
      console.error(`Formato inválido: "${f}" (use WxH, ex. 1080x1920)`);
      process.exit(1);
    }
    return {name: `${w}x${h}`, width: w, height: h};
  });

const overridesPath = flagValue('overrides');
const formatOverrides = overridesPath
  ? JSON.parse(readFileSync(resolve(overridesPath), 'utf8'))
  : {};

const framesArg = flagValue('frames');
const frameRange = framesArg ? framesArg.split('-').map(Number) : null;

const totalCpus = cpus().length;
const parallel = Math.max(1, Number(flagValue('parallel') ?? Math.min(formats.length, 3)));
const concurrencyPerRender = Math.max(1, Math.floor(totalCpus / parallel));

console.log(`Bundle do studio (1x)...`);
const serveUrl = await bundle({
  entryPoint: resolve(studioDir, 'src/index.ts'),
  onProgress: () => {},
});

const outDir = process.env.GMOTION_RENDER_OUTPUT
  ? resolve(process.env.GMOTION_RENDER_OUTPUT, compId)
  : resolve(repoRoot, 'out', compId);
mkdirSync(outDir, {recursive: true});

console.log(`${formats.length} formatos, ${parallel} em paralelo, ${concurrencyPerRender} threads cada (${totalCpus} cpus).`);

const renderFormat = async ({name, width, height}) => {
  const inputProps = formatOverrides[name] ?? {};
  const composition = await selectComposition({serveUrl, id: compId, inputProps});
  const outputLocation = resolve(outDir, `${name}.mp4`);
  const started = Date.now();
  await renderMedia({
    serveUrl,
    codec: 'h264',
    composition: {...composition, width, height},
    inputProps,
    outputLocation,
    concurrency: concurrencyPerRender,
    ...(frameRange ? {frameRange: [frameRange[0], frameRange[1]]} : {}),
    onProgress: ({progress}) => {
      if (progress === 1) return;
    },
  });
  console.log(`  ✔ ${name} (${((Date.now() - started) / 1000).toFixed(1)}s) → ${outputLocation}`);
};

// Pool simples: `parallel` renders simultâneos.
const queue = [...formats];
const workers = Array.from({length: parallel}, async () => {
  while (queue.length > 0) {
    const format = queue.shift();
    if (!format) return;
    await renderFormat(format);
  }
});

const results = await Promise.allSettled(workers);
const failed = results.filter((r) => r.status === 'rejected');
if (failed.length > 0) {
  for (const f of failed) console.error(f.reason);
  process.exit(1);
}
console.log('Batch completo.');
