export {
  grainSeed,
  screenShakeAt,
  lightLeakBlobs,
  rgbShiftAt,
  type ShakeTransform,
  type LeakBlob,
} from './calc';

export {FilmGrain, type FilmGrainProps} from './FilmGrain';
export {
  ChromaticAberration,
  type ChromaticAberrationProps,
} from './ChromaticAberration';
export {RgbShift, type RgbShiftProps} from './RgbShift';
export {Glow, type GlowProps} from './Glow';
export {Vignette, type VignetteProps} from './Vignette';
export {LightLeaks, type LightLeaksProps} from './LightLeaks';
export {ScreenShake, type ScreenShakeProps} from './ScreenShake';

/** Catálogo — consumido pelo ai-director (Fase 8). */
export const allEffectNames = [
  'film-grain',
  'chromatic-aberration',
  'rgb-shift',
  'glow',
  'vignette',
  'light-leaks',
  'screen-shake',
] as const;

export type EffectName = (typeof allEffectNames)[number];
