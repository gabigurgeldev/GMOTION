import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {seededNoise} from '@gmotion/core';
import {hardCutVisible, shakeCutEnvelope} from './calc';

export type ShakeCutProps = {
  /** Deslocamento máximo em px no pico do corte. Default: 25. */
  intensity?: number;
  /** Rotação máxima em graus. Default: 2. */
  rotation?: number;
  seed?: number;
};

const ShakeCutPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<ShakeCutProps>) => {
  const frame = useCurrentFrame();
  const {intensity = 25, rotation = 2, seed = 21} = passedProps;

  const visible = hardCutVisible(presentationProgress, presentationDirection);
  if (!visible) {
    return null;
  }

  const envelope = shakeCutEnvelope(presentationProgress);
  const x = seededNoise(seed, frame) * intensity * envelope;
  const y = seededNoise(seed + 33, frame) * intensity * envelope;
  const r = seededNoise(seed + 66, frame) * rotation * envelope;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${r}deg) scale(${1 + envelope * 0.04})`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/**
 * Corte seco com tremor de câmera no impacto (estilo edit viral).
 * @example
 * <TransitionSeries.Transition
 *   presentation={shakeCut({intensity: 30})}
 *   timing={linearTiming({durationInFrames: 10})}
 * />
 */
export const shakeCut = (
  props: ShakeCutProps = {},
): TransitionPresentation<ShakeCutProps> => ({
  component: ShakeCutPresentation,
  props,
});
