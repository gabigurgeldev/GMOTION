#!/usr/bin/env node
/**
 * Wrapper do preparo de render (externaliza assets + grava generated/*.json).
 *   node scripts/ai-prepare-render.mjs --project-dir <dir> --type EV|GM
 * O --studio é resolvido aqui (apps/studio da raiz do repo).
 */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const aiDir = resolve(repoRoot, 'packages/ai-director');
const cli = resolve(aiDir, 'src/prepare-render-cli.ts');
const studio = resolve(repoRoot, 'apps/studio');

const child = spawn(
  'node',
  ['--import', 'tsx', cli, ...process.argv.slice(2), '--studio', studio],
  {stdio: 'inherit', cwd: aiDir, env: process.env},
);
child.on('close', (code) => process.exit(code ?? 1));
child.on('error', (err) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
