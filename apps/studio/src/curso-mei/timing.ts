import timingJson from './curso-mei-timing.json';

/**
 * Timing do CursoMeiPromo (anúncio de curso de gestão financeira para MEI).
 * Fonte: curso-mei-timing.json.
 * Sem áudio gerado: estimativas do roteiro. Depois de rodar
 * scripts/curso-mei-narration.mjs, o JSON traz as durações reais e as
 * cenas se ajustam sozinhas ao áudio.
 */
export const FPS = 30;

const toFrames = (s: number): number => Math.round(s * FPS);

export const HAS_AUDIO: boolean = timingJson.hasAudio;

/** SFX/música reusados do FimeiPromo (scripts/fimei-sfx.mjs):
 * public/audio/fimei/sfx/{bass-hit,whoosh,tick}.wav, public/audio/fimei/music.wav */
export const HAS_SFX = true;
export const HAS_MUSIC = true;

export const BLOCK_FRAMES = {
  gancho: toFrames(timingJson.blocks.gancho.seconds),
  dor: toFrames(timingJson.blocks.dor.seconds),
  agitacao: toFrames(timingJson.blocks.agitacao.seconds),
  virada: toFrames(timingJson.blocks.virada.seconds),
  prova: toFrames(timingJson.blocks.prova.seconds),
  oferta: toFrames(timingJson.blocks.oferta.seconds),
  cta: toFrames(timingJson.blocks.cta.seconds),
} as const;

/** Tela final travada além da narração do CTA (freeze frame com CTA). */
export const CTA_FREEZE = toFrames(4);

/** Frames de cada transição entre blocos (6 transições). */
export const TRANSITION_FRAMES = 10;

const ORDER = [
  'gancho',
  'dor',
  'agitacao',
  'virada',
  'prova',
  'oferta',
  'cta',
] as const;

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

export const CURSO_MEI_DURATION =
  BLOCK_FRAMES.gancho +
  BLOCK_FRAMES.dor +
  BLOCK_FRAMES.agitacao +
  BLOCK_FRAMES.virada +
  BLOCK_FRAMES.prova +
  BLOCK_FRAMES.oferta +
  BLOCK_FRAMES.cta +
  CTA_FREEZE -
  6 * TRANSITION_FRAMES;

/**
 * Paleta fintech (Nubank/Stone/Inter): roxo/violeta escuro + verde-limão
 * (crescimento) + dourado (dinheiro). Vermelho/âmbar para alerta.
 */
export const COLORS = {
  bg: '#1a0b2e',
  bgDeep: '#0f0620',
  violet: '#7c3aed',
  violetLight: '#a78bfa',
  lime: '#a3e635',
  limeDark: '#65a30d',
  gold: '#fbbf24',
  red: '#ef4444',
  amber: '#f59e0b',
  white: '#ffffff',
  muted: '#94a3b8',
} as const;

/** Stack de fonte: Poppins/Montserrat se disponíveis, senão Segoe UI/Arial. */
export const FONT = 'Poppins, Montserrat, "Segoe UI", Arial, sans-serif';
