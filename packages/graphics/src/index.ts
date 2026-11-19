export {
  counterValue,
  formatCounter,
  strokeDrawOffset,
  barProgress,
} from './calc';

export {LowerThird, type LowerThirdProps} from './LowerThird';
export {Callout, type CalloutProps} from './Callout';
export {AnimatedCounter, type AnimatedCounterProps} from './AnimatedCounter';
export {ProgressBar, type ProgressBarProps} from './ProgressBar';
export {Badge, type BadgeProps} from './Badge';
export {LottieLayer, type LottieLayerProps} from './LottieLayer';

export {
  splitUnits,
  staggerDelay,
  pathTextOffset,
  runDelay,
  type TextUnit,
} from './text-calc';
export {SplitText, type SplitTextProps} from './SplitText';
export {PathText, type PathTextProps} from './PathText';
export {AnimatedStroke, type AnimatedStrokeProps} from './AnimatedStroke';
export {MixedTypeText, type MixedTypeTextProps, type TextRun} from './MixedTypeText';

/** Catálogo — consumido pelo ai-director (Fase 8). */
export const allGraphicNames = [
  'lower-third',
  'callout',
  'animated-counter',
  'progress-bar',
  'badge',
  'lottie',
] as const;

export type GraphicName = (typeof allGraphicNames)[number];
