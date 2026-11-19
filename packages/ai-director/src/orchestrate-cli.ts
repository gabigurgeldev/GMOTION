/**
 * CLI node-only do pipeline de agentes. Emite eventos NDJSON no stdout (uma
 * linha JSON por evento) e grava a timeline final em <project-dir>/timeline.json.
 * O app Electron faz spawn deste script e encaminha cada linha ao renderer.
 *
 * Uso:
 *   node orchestrate-cli.ts --project-dir <dir> --type GM --brief '<json>'
 *   node orchestrate-cli.ts --project-dir <dir> --type GM --refine "muda a cor pra azul"
 *
 * Provider/keys vêm das env vars: GMOTION_AI_PROVIDER, OPENROUTER_API_KEY,
 * OPENROUTER_MODEL, CLAUDE_CLI_PATH, ANTHROPIC_API_KEY.
 */
import fs from 'node:fs';
import path from 'node:path';
import {parseCapcutTimeline} from '@gmotion/capcut/render';
import {orchestrate, orchestrateEv, refine, refineEv} from './orchestrator';
import {providerFromEnv} from './providers';
import {parseTimeline} from './schema';
import type {SourceVideoInfo} from './agents/ev';
import {planSchema, type Brief, type CallConfig, type AgentEvent} from './agents/types';
import type {AssetManifest} from '@gmotion/asset-library';

/** Lê duração e dimensões do vídeo-fonte (modo EV). */
async function probeVideo(videoPath: string): Promise<SourceVideoInfo> {
  const {parseMedia} = await import('@remotion/media-parser');
  const {nodeReader} = await import('@remotion/media-parser/node');
  const parsed = await parseMedia({
    src: videoPath,
    reader: nodeReader,
    fields: {durationInSeconds: true, dimensions: true},
    acknowledgeRemotionLicense: true,
  });
  return {
    path: videoPath,
    durationSeconds: parsed.durationInSeconds ?? 0,
    width: parsed.dimensions?.width ?? 0,
    height: parsed.dimensions?.height ?? 0,
  };
}

const emit = (evt: AgentEvent) => process.stdout.write(JSON.stringify(evt) + '\n');

const flag = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

/** Lê o manifesto de assets, se a flag apontar pra um arquivo válido; falha graciosamente. */
const readAssetManifest = (manifestPath: string | undefined): AssetManifest | undefined => {
  if (!manifestPath) return undefined;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as AssetManifest;
  } catch {
    return undefined;
  }
};

const main = async () => {
  const projectDir = flag('project-dir');
  const type = (flag('type') as 'EV' | 'GM') ?? 'GM';
  if (!projectDir) throw new Error('--project-dir é obrigatório');
  fs.mkdirSync(projectDir, {recursive: true});

  const cfg: CallConfig = {
    provider: providerFromEnv(),
    model:
      process.env.GMOTION_AI_PROVIDER === 'openrouter'
        ? (process.env.OPENROUTER_MODEL ?? 'anthropic/claude-opus-4-8')
        : (process.env.GMOTION_AI_MODEL ?? 'claude-opus-4-8'),
    cliPath: process.env.CLAUDE_CLI_PATH,
    openRouterApiKey: process.env.OPENROUTER_API_KEY,
  };

  const timelinePath = path.join(projectDir, 'timeline.json');
  const planPath = path.join(projectDir, 'plan.json');
  const refineInstruction = flag('refine');
  const assetManifest = readAssetManifest(flag('assets-manifest'));

  if (refineInstruction) {
    // Refine: precisa da timeline e do plano já gravados.
    const rawTimeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
    const plan = planSchema.parse(JSON.parse(fs.readFileSync(planPath, 'utf8')));
    const brief: Brief = {
      projectName: flag('name') ?? 'Projeto',
      type,
      answers: {},
      sourceVideoPath: flag('video'),
      projectDir,
      assetManifest,
    };
    const result =
      type === 'EV'
        ? await refineEv(
            parseCapcutTimeline(rawTimeline),
            plan,
            brief,
            cfg,
            refineInstruction,
            emit,
          )
        : await refine(
            parseTimeline(rawTimeline),
            plan,
            brief,
            cfg,
            refineInstruction,
            emit,
          );
    fs.writeFileSync(timelinePath, JSON.stringify(result.timeline, null, 2));
    emit({type: 'done', timelinePath, cumCostUsd: result.totalCostUsd});
    return;
  }

  const briefRaw = flag('brief');
  const answers = briefRaw ? (JSON.parse(briefRaw) as Record<string, string>) : {};
  const brief: Brief = {
    projectName: flag('name') ?? 'Projeto',
    type,
    answers,
    sourceVideoPath: flag('video'),
    projectDir,
    assetManifest,
  };

  let result;
  if (type === 'EV') {
    if (!brief.sourceVideoPath) throw new Error('Modo EV exige --video <path>');
    const video = await probeVideo(brief.sourceVideoPath);
    if (video.durationSeconds > 60.5) {
      throw new Error(
        `Vídeo-fonte tem ${video.durationSeconds.toFixed(0)}s — máximo 60s.`,
      );
    }
    result = await orchestrateEv(brief, video, cfg, emit);
  } else {
    result = await orchestrate(brief, cfg, emit);
  }
  fs.writeFileSync(timelinePath, JSON.stringify(result.timeline, null, 2));
  fs.writeFileSync(planPath, JSON.stringify(result.plan, null, 2));
  emit({type: 'done', timelinePath, cumCostUsd: result.totalCostUsd});
};

main().catch((err: unknown) => {
  emit({type: 'error', message: err instanceof Error ? err.message : String(err)});
  process.exit(1);
});
