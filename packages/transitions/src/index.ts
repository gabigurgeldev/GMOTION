export {
  bell,
  whipPanOffset,
  shakeCutEnvelope,
  hardCutVisible,
  zoomGlitchScale,
  wipeInset,
  type TransitionDirection,
} from './calc';

export {zoomGlitch, type ZoomGlitchProps} from './zoom-glitch';
export {rgbSplitWipe, type RgbSplitWipeProps} from './rgb-split-wipe';
export {shakeCut, type ShakeCutProps} from './shake-cut';
export {whipPan, type WhipPanProps} from './whip-pan';
export {lightLeak, type LightLeakProps} from './light-leak';
export {filmBurn, type FilmBurnProps} from './film-burn';

/** Catálogo de nomes — consumido pelo ai-director (Fase 8). */
export const allTransitionNames = [
  'zoom-glitch',
  'rgb-split-wipe',
  'shake-cut',
  'whip-pan',
  'light-leak',
  'film-burn',
] as const;

export type TransitionName = (typeof allTransitionNames)[number];
