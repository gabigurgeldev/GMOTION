import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {seededNoise} from '@gmotion/core';
import {bell, zoomGlitchScale} from './calc';

export type ZoomGlitchProps = {
  /** Quanto o zoom estoura (0.5 = até 150%). Default: 0.5. */
  strength?: number;
  /** Jitter máximo em px no pico. Default: 14. */
  jitter?: number;
  /** Seed do ruído. Default: 11. */
  seed?: number;
};

const ZoomGlitchPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<ZoomGlitchProps>) => {
  const frame = useCurrentFrame();
  const {strength = 0.5, jitter = 14, seed = 11} = passedProps;

  const scale = zoomGlitchScale({
    progress: presentationProgress,
    phase: presentationDirection,
    strength,
  });

  // Jitter forte no meio da transição, zero nas pontas
  const envelope = bell(presentationProgress);
  const jx = seededNoise(seed, frame) * jitter * envelope;
  const jy = seededNoise(seed + 40, frame) * jitter * envelope;
  const flicker = seededNoise(seed + 80, frame) > 0.5 ? 1 : 0.85;

  const opacity =
    presentationDirection === 'exiting'
      ? 1 - presentationProgress
      : presentationProgress;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${jx}px, ${jy}px)`,
          opacity: opacity * flicker,
          filter:
            envelope > 0.05
              ? `hue-rotate(${jx * 4}deg) contrast(${1 + envelope * 0.3})`
              : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Zoom estourando com glitch no pico do corte.
 * @example
 * <TransitionSeries.Transition
 *   presentation={zoomGlitch({strength: 0.6})}
 *   timing={linearTiming({durationInFrames: 12})}
 * />
 */
export const zoomGlitch = (
  props: ZoomGlitchProps = {},
): TransitionPresentation<ZoomGlitchProps> => ({
  component: ZoomGlitchPresentation,
  props,
});
