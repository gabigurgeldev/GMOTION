/**
 * Agentes do modo EV (edição de vídeo real). Os agentes decidem CORTES,
 * OVERLAYS de texto e FILTRO de cor como JSON pequeno e determinístico; o
 * código converte para a timeline track-based do CapCut (cortes reais com
 * sourceStart/duration sobre o vídeo-fonte).
 */
import {z} from 'zod';
import {
  capcutTimelineSchema,
  CAPCUT_FONT_SIZE_TO_PX,
  type CapcutTimeline,
  type ClipSpec,
} from '@gmotion/capcut/render';
import {
  addClip,
  addEffectToTrack,
  addTrack,
  emptyTimeline,
  textClip,
  trim,
} from '@gmotion/capcut';
import {callStructuredAgent, briefText, planText} from './shared';
import {produceNarration} from './audio';
import {pickMusicAsset, resolveAssetPath} from '../assets';
import type {Brief, CallConfig, OnPhase, Plan} from './types';

export interface SourceVideoInfo {
  path: string;
  durationSeconds: number;
  width: number;
  height: number;
}

export interface EvStep {
  timeline: CapcutTimeline;
  costUsd: number;
  summary: string;
}

// ---------- Agente 1 (EV): cortes ----------

const cutsSchema = z.object({
  cuts: z
    .array(
      z.object({
        sourceStartSec: z.number().min(0).describe('Segundo de início DENTRO do vídeo-fonte'),
        durationSec: z.number().positive().describe('Duração do corte em segundos'),
        label: z.string().describe('O que acontece neste trecho'),
      }),
    )
    .min(1),
});
type Cuts = z.infer<typeof cutsSchema>;

const SYSTEM_CORTES = `Você é o editor de vídeo de uma equipe. Recebe um plano e a duração do vídeo-fonte e decide os CORTES: quais trechos do vídeo entram e em que ordem, com ritmo de retenção (cortes de 1.5-6s, sem tempos mortos).
Regras:
- sourceStartSec + durationSec nunca podem passar da duração do vídeo-fonte.
- A soma dos cortes deve ficar próxima da duração alvo do plano (máx. 60s).
- Ordene os cortes na sequência final desejada (pode reordenar trechos do fonte).
Responda SOMENTE com o JSON.`;

/** Converte os cortes em timeline CapCut com o vídeo-fonte escalado em cover. */
export function buildCutTimeline(
  cuts: Cuts,
  video: SourceVideoInfo,
  fps = 30,
): CapcutTimeline {
  const width = 1080;
  const height = 1920;
  // Escala cover: preenche o quadro vertical a partir das dims reais do fonte.
  const scale =
    video.width > 0 && video.height > 0
      ? Math.max(width / video.width, height / video.height)
      : 1;

  const total = cuts.cuts.reduce((s, c) => s + c.durationSec, 0);
  let tl = emptyTimeline({fps, width, height, durationInSeconds: Math.max(1, total)});
  tl = addTrack(tl, 'video');

  let cursor = 0;
  cuts.cuts.forEach((cut, i) => {
    const clip: ClipSpec = {
      kind: 'video',
      src: video.path,
      volume: 1,
      id: `cut-${i + 1}`,
      start: Math.round(cursor * fps),
      duration: Math.max(1, Math.round(cut.durationSec * fps)),
      sourceStart: Math.round(cut.sourceStartSec * fps),
      transform: {
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
        posX: width / 2,
        posY: height / 2,
        alpha: 1,
        flipH: false,
        flipV: false,
      },
      keyframes: [],
      mask: null,
      chroma: null,
      effects: [],
    };
    tl = addClip(tl, clip, 0);
    cursor += cut.durationSec;
  });

  return trim(tl, Math.min(cursor, 60));
}

export async function runCortesEv(
  brief: Brief,
  plan: Plan,
  video: SourceVideoInfo,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<EvStep & {cutLabels: string}> {
  onPhase?.('Consultando IA (cortes)…');
  const {output, costUsd} = await callStructuredAgent<Cuts>(
    cfg,
    SYSTEM_CORTES,
    `Briefing:\n${briefText(brief)}\n\nPlano:\n${planText(plan)}\n\nVídeo-fonte: ${video.durationSeconds.toFixed(1)}s, ${video.width}x${video.height}.\n\nDecida os cortes.`,
    z.toJSONSchema(cutsSchema) as Record<string, unknown>,
  );
  const cuts = cutsSchema.parse(output);
  const timeline = buildCutTimeline(cuts, video);
  let cursor = 0;
  const cutLabels = cuts.cuts
    .map((c) => {
      const line = `${cursor.toFixed(1)}s-${(cursor + c.durationSec).toFixed(1)}s: ${c.label}`;
      cursor += c.durationSec;
      return line;
    })
    .join('\n');
  return {
    timeline,
    costUsd,
    cutLabels,
    summary: `${cuts.cuts.length} cortes (${(timeline.durationInFrames / timeline.fps).toFixed(1)}s)`,
  };
}

// ---------- Agente 5 (EV): overlays de texto ----------

const overlaysSchema = z.object({
  overlays: z
    .array(
      z.object({
        text: z.string(),
        startSec: z.number().min(0),
        durationSec: z.number().positive(),
        fontSizePx: z.number().describe('Tamanho em px no quadro 1080x1920 (60-140 típico)'),
        color: z.string().describe('Cor CSS'),
        yPercent: z.number().min(0).max(100).describe('Posição vertical, 50 = centro'),
      }),
    )
    .describe('Textos sobre o vídeo (legendas de impacto, títulos, CTA)'),
});
type Overlays = z.infer<typeof overlaysSchema>;

const SYSTEM_OVERLAYS = `Você é o designer de legendas/títulos de vídeos verticais. Recebe o plano e a lista de cortes (com o que acontece em cada um) e cria os TEXTOS sobre o vídeo: gancho no início, frases de impacto sincronizadas com os cortes e CTA no fim.
Regras:
- Curto e grande: 2-6 palavras por overlay, fontSizePx 60-140.
- Nunca cubra o centro o tempo todo: alterne yPercent (20-35 topo, 65-85 base).
- Os tempos devem caber na duração total do vídeo.
Responda SOMENTE com o JSON.`;

export function applyOverlays(tl: CapcutTimeline, overlays: Overlays): CapcutTimeline {
  if (overlays.overlays.length === 0) return tl;
  let next = addTrack(tl, 'text');
  const trackIndex = next.tracks.length - 1;
  overlays.overlays.forEach((o, i) => {
    const clip = textClip(next, {
      id: `overlay-${i + 1}`,
      startSec: o.startSec,
      durationSec: o.durationSec,
      text: o.text,
      color: o.color,
      fontSize: o.fontSizePx / CAPCUT_FONT_SIZE_TO_PX,
      pos: {x: next.width / 2, y: (o.yPercent / 100) * next.height},
    });
    next = addClip(next, clip, trackIndex);
  });
  return next;
}

export async function runTextoEv(
  current: CapcutTimeline,
  plan: Plan,
  cutLabels: string,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<EvStep> {
  onPhase?.('Consultando IA (overlays de texto)…');
  const {output, costUsd} = await callStructuredAgent<Overlays>(
    cfg,
    SYSTEM_OVERLAYS,
    `Plano:\n${planText(plan)}\n\nDuração total: ${(current.durationInFrames / current.fps).toFixed(1)}s\nCortes:\n${cutLabels}\n\nCrie os overlays.`,
    z.toJSONSchema(overlaysSchema) as Record<string, unknown>,
  );
  const overlays = overlaysSchema.parse(output);
  return {
    timeline: applyOverlays(current, overlays),
    costUsd,
    summary: `${overlays.overlays.length} textos sobre o vídeo`,
  };
}

// ---------- Agente 3 (EV): filtro de cor ----------

const gradeSchema = z.object({
  effect: z
    .enum(['contrast', 'saturate', 'vivid', 'bright', 'sepia', 'mono', 'none'])
    .describe('Filtro aplicado ao vídeo inteiro'),
  intensity: z.number().min(0).max(1).describe('Força do filtro'),
});
type Grade = z.infer<typeof gradeSchema>;

const SYSTEM_GRADE = `Você é o colorista. Escolha UM filtro de cor para o vídeo inteiro coerente com o tom do plano (vivid/saturate para energia, contrast para drama, sepia/mono para estética, bright para leveza, none se o footage já está bom). Responda SOMENTE com o JSON.`;

export async function runCorEv(
  current: CapcutTimeline,
  plan: Plan,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<EvStep> {
  onPhase?.('Consultando IA (filtro de cor)…');
  const {output, costUsd} = await callStructuredAgent<Grade>(
    cfg,
    SYSTEM_GRADE,
    `Plano:\n${planText(plan)}\n\nEscolha o filtro.`,
    z.toJSONSchema(gradeSchema) as Record<string, unknown>,
  );
  const grade = gradeSchema.parse(output);
  const timeline =
    grade.effect === 'none'
      ? current
      : addEffectToTrack(current, 0, grade.effect, grade.intensity);
  return {
    timeline,
    costUsd,
    summary:
      grade.effect === 'none'
        ? 'Sem filtro (footage mantido)'
        : `Filtro ${grade.effect} (${grade.intensity.toFixed(2)})`,
  };
}

// ---------- Agente 2 (EV): narração como track de áudio ----------

const audioClip = (id: string, src: string, volume: number, durationInFrames: number): ClipSpec => ({
  kind: 'audio',
  src,
  volume,
  id,
  start: 0,
  duration: durationInFrames,
  sourceStart: 0,
  transform: {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    posX: 0,
    posY: 0,
    alpha: 1,
    flipH: false,
    flipV: false,
  },
  keyframes: [],
  mask: null,
  chroma: null,
  effects: [],
});

export async function runAudioEv(
  current: CapcutTimeline,
  plan: Plan,
  brief: Brief,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<EvStep> {
  const {file, costUsd, summary} = await produceNarration(plan, brief, cfg, onPhase);

  let tl = current;
  if (file) {
    tl = addTrack(tl, 'audio');
    tl = addClip(tl, audioClip('narration', file, 1, current.durationInFrames), tl.tracks.length - 1);
  }

  let musicSummary = '';
  if (brief.assetManifest) {
    const music = pickMusicAsset(brief.assetManifest, plan);
    if (music) {
      tl = addTrack(tl, 'audio');
      tl = addClip(
        tl,
        audioClip('music', resolveAssetPath(brief.assetManifest, music), 0.25, current.durationInFrames),
        tl.tracks.length - 1,
      );
      musicSummary = `; trilha: ${music.path} (asset cadastrado)`;
    } else {
      musicSummary = '; nenhuma trilha compatível na biblioteca — vídeo sem música';
    }
  }

  return {timeline: tl, costUsd, summary: summary + musicSummary};
}

// ---------- Refine EV: timeline capcut completa via structured output ----------

export const capcutRefineJsonSchema = (): Record<string, unknown> =>
  z.toJSONSchema(capcutTimelineSchema) as Record<string, unknown>;
