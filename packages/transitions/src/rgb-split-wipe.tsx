import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {AbsoluteFill} from 'remotion';
import {bell, wipeInset, type TransitionDirection} from './calc';

export type RgbSplitWipeProps = {
  direction?: TransitionDirection;
  /** Deslocamento máximo dos canais RGB em px. Default: 12. */
  splitAmount?: number;
};

const RgbSplitWipePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<RgbSplitWipeProps>) => {
  const {direction = 'left', splitAmount = 12} = passedProps;

  // Cena que sai fica parada por baixo; a que entra varre por cima com clip.
  if (presentationDirection === 'exiting') {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const clipPath = wipeInset({progress: presentationProgress, direction});
  const split = bell(presentationProgress) * splitAmount;
  const horizontal = direction === 'left' || direction === 'right';
  const dx = horizontal ? split : 0;
  const dy = horizontal ? 0 : split;

  return (
    <AbsoluteFill>
      {/* Fantasma vermelho e ciano nas bordas do wipe — efeito RGB split */}
      <AbsoluteFill
        style={{
          clipPath,
          transform: `translate(${dx}px, ${dy}px)`,
          opacity: 0.5,
          filter: 'hue-rotate(-60deg) saturate(3)',
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath,
          transform: `translate(${-dx}px, ${-dy}px)`,
          opacity: 0.5,
          filter: 'hue-rotate(120deg) saturate(3)',
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill style={{clipPath}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Wipe direcional com separação de canais RGB nas bordas.
 * @example
 * <TransitionSeries.Transition
 *   presentation={rgbSplitWipe({direction: 'right'})}
 *   timing={linearTiming({durationInFrames: 15})}
 * />
 */
export const rgbSplitWipe = (
  props: RgbSplitWipeProps = {},
): TransitionPresentation<RgbSplitWipeProps> => ({
  component: RgbSplitWipePresentation,
  props,
});
