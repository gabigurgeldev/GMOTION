#!/usr/bin/env node
/**
 * Wrapper do orquestrador de agentes. Encaminha argv para o CLI TS via `node
 * --import tsx` (os imports internos do ai-director são sem extensão, então o
 * type stripping nativo do Node não basta; tsx resolve). O Electron embute Node
 * 20 e não roda .ts, por isso este wrapper chama o `node` do sistema.
 * O stdout do filho (NDJSON) flui direto para o pai via stdio: 'inherit'.
 *   node scripts/ai-orchestrate.mjs --project-dir <dir> --type GM --brief '<json>'
 */
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve, dirname} from 'node:path';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const aiDir = resolve(repoRoot, 'packages/ai-director');
const cli = resolve(aiDir, 'src/orchestrate-cli.ts');

// cwd no pacote ai-director para que 'tsx' e as workspace deps resolvam.
const child = spawn('node', ['--import', 'tsx', cli, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: aiDir,
  env: process.env,
});
child.on('close', (code) => process.exit(code ?? 1));
child.on('error', (err) => {
  process.stderr.write(String(err) + '\n');
  process.exit(1);
});
