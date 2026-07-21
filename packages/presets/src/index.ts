export type {PresetFn, PresetParams, PresetStyle, Direction} from './types';
export {ease, easings, type EasingName} from './easings';
export {mergePresetStyles} from './merge';

export {
  fadeIn,
  slideIn,
  zoomInBounce,
  blurIn,
  popIn,
  glitchIn,
  type FadeInOptions,
  type SlideInOptions,
  type ZoomInBounceOptions,
  type BlurInOptions,
  type PopInOptions,
  type GlitchInOptions,
} from './enter';

export {
  pulse,
  shake,
  float,
  rotateLoop,
  glowPulse,
  type PulseOptions,
  type ShakeOptions,
  type FloatOptions,
  type RotateLoopOptions,
  type GlowPulseOptions,
} from './emphasis';

export {
  fadeOut,
  slideOut,
  zoomOut,
  blurOut,
  shrinkOut,
  type FadeOutOptions,
  type SlideOutOptions,
  type ZoomOutOptions,
  type BlurOutOptions,
  type ShrinkOutOptions,
} from './exit';

export {
  enterPresets,
  loopPresets,
  exitPresets,
  resolvePreset,
  allPresetNames,
  type EnterPresetName,
  type LoopPresetName,
  type ExitPresetName,
} from './registry';

export {AnimatedLayer, type AnimatedLayerProps} from './AnimatedLayer';
export {
  TypewriterText,
  typewriterVisibleChars,
  type TypewriterTextProps,
} from './TypewriterText';
