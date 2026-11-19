#!/usr/bin/env node
/**
 * Atalho da raiz pro indexador do @gmotion/asset-library:
 *   node scripts/index-assets.mjs "EFEITOS ASSETS" [--out asset-manifest.json] [--no-thumbs]
 * Requer Node >= 23 (type stripping nativo).
 */
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cli = resolve(repoRoot, 'packages/asset-library/src/cli.ts');

const result = spawnSync('node', [cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: repoRoot,
});
process.exit(result.status ?? 1);
