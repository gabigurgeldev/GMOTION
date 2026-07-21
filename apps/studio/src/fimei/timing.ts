import timingJson from './fimei-timing.json';

/**
 * Timing do FimeiPromo. Fonte: fimei-timing.json.
 * Sem áudio gerado: estimativas do roteiro. Depois de rodar
 * scripts/fimei-narration.mjs, o JSON traz as durações reais e as
 * cenas se ajustam sozinhas.
 */
export const FPS = 30;

const toFrames = (s: number): number => Math.round(s * FPS);

export const HAS_AUDIO: boolean = timingJson.hasAudio;

/** SFX/música sintetizados via scripts/fimei-sfx.mjs.
 * public/audio/fimei/sfx/{bass-hit,whoosh,tick}.wav, public/audio/fimei/music.wav */
export const HAS_SFX = true;
export const HAS_MUSIC = true;

export const BLOCK_FRAMES = {
  hook: toFrames(timingJson.blocks.hook.seconds),
  agitacao: toFrames(timingJson.blocks.agitacao.seconds),
  solucao: toFrames(timingJson.blocks.solucao.seconds),
  prova: toFrames(timingJson.blocks.prova.seconds),
  cta: toFrames(timingJson.blocks.cta.seconds),
} as const;

/** Tela final travada além da narração do CTA (decisão do espectador). */
export const CTA_FREEZE = toFrames(4);

/** Frames de cada transição entre blocos (4 transições). */
export const TRANSITION_FRAMES = 10;

const ORDER = ['hook', 'agitacao', 'solucao', 'prova', 'cta'] as const;

/** Frame absoluto em que cada bloco começa (desconta overlap das transições). */
export const BLOCK_START: Record<(typeof ORDER)[number], number> = (() => {
  const starts = {} as Record<(typeof ORDER)[number], number>;
  let acc = 0;
  ORDER.forEach((name, i) => {
    starts[name] = acc - i * TRANSITION_FRAMES;
    acc += BLOCK_FRAMES[name];
  });
  return starts;
})();

export const FIMEI_PROMO_DURATION =
  BLOCK_FRAMES.hook +
  BLOCK_FRAMES.agitacao +
  BLOCK_FRAMES.solucao +
  BLOCK_FRAMES.prova +
  BLOCK_FRAMES.cta +
  CTA_FREEZE -
  4 * TRANSITION_FRAMES;

/** Paleta FiMEI (fintech/confiança). Trocar pelos tokens do tailwind do app quando disponível. */
export const COLORS = {
  bg: '#0a0f0d',
  bgDeep: '#060a08',
  green: '#10b981',
  greenDark: '#059669',
  red: '#ef4444',
  amber: '#f59e0b',
  white: '#ffffff',
  muted: '#94a3b8',
} as const;
