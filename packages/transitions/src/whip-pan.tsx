import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {AbsoluteFill} from 'remotion';
import {bell, whipPanOffset, type TransitionDirection} from './calc';

export type WhipPanProps = {
  direction?: TransitionDirection;
  /** Blur máximo de movimento em px no pico. Default: 30. */
  maxBlur?: number;
};

const WhipPanPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<WhipPanProps>) => {
  const {direction = 'left', maxBlur = 30} = passedProps;

  const {x, y} = whipPanOffset({
    progress: presentationProgress,
    direction,
    phase: presentationDirection,
  });

  const blur = bell(presentationProgress) * maxBlur;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}%, ${y}%)`,
        filter: blur > 0.5 ? `blur(${blur}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/**
 * Câmera "chicoteando" — cena sai voando, a próxima entra do lado oposto.
 * @example
 * <TransitionSeries.Transition
 *   presentation={whipPan({direction: 'left'})}
 *   timing={linearTiming({durationInFrames: 10})}
 * />
 */
export const whipPan = (
  props: WhipPanProps = {},
): TransitionPresentation<WhipPanProps> => ({
  component: WhipPanPresentation,
  props,
});
