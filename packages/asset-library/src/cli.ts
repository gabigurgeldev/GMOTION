/**
 * Indexador offline:
 *   pnpm --filter @gmotion/asset-library run index <dir> [--out manifest.json] [--no-thumbs]
 * Gera asset-manifest.json (NÃO commitado — derivado de assets ignorados).
 */
import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import process from 'node:process';
import {indexDirectory} from './indexer.ts';

const args = process.argv.slice(2);
const positional = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out');
const rootArg = positional[0];

if (!rootArg) {
  console.error('Uso: pnpm --filter @gmotion/asset-library run index <dir> [--out manifest.json] [--no-thumbs]');
  process.exit(1);
}

const root = resolve(rootArg);
const outIndex = args.indexOf('--out');
const outPath = resolve(outIndex !== -1 ? (args[outIndex + 1] ?? 'asset-manifest.json') : 'asset-manifest.json');
const thumbnails = !args.includes('--no-thumbs');

const started = Date.now();
const manifest = await indexDirectory(root, {
  thumbnails,
  onProgress: (done, total, path) => {
    if (done % 25 === 0 || done === total) {
      console.log(`  ${done}/${total} ${path}`);
    }
  },
});

writeFileSync(outPath, JSON.stringify(manifest, null, 1));

const byType = new Map<string, number>();
const tagCount = new Map<string, number>();
for (const entry of manifest.entries) {
  byType.set(entry.type, (byType.get(entry.type) ?? 0) + 1);
  for (const tag of entry.tags) tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
}
const topTags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);

console.log(`\nManifesto: ${outPath} (${((Date.now() - started) / 1000).toFixed(1)}s)`);
console.log(`  entries: ${manifest.entries.length}`);
for (const [type, count] of byType) console.log(`  ${type}: ${count}`);
console.log(`  top tags: ${topTags.map(([tag, count]) => `${tag}(${count})`).join(', ')}`);
