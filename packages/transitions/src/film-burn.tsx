import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {seededNoise} from '@gmotion/core';
import {bell} from './calc';

export type FilmBurnProps = {
  /** Cor da queima. Default: laranja fogo. */
  burnColor?: string;
  seed?: number;
};

const FilmBurnPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<FilmBurnProps>) => {
  const frame = useCurrentFrame();
  const {burnColor = 'rgba(255,120,20,0.9)', seed = 31} = passedProps;

  const p = presentationProgress;
  const burn = bell(p);
  // Tremor orgânico do filme queimando
  const wobble = seededNoise(seed, frame) * burn * 6;

  const opacity = presentationDirection === 'exiting' ? 1 - p : p;
  // Cena que sai superexpõe antes de sumir; a que entra chega estourada e assenta
  const exposure =
    presentationDirection === 'exiting' ? 1 + p * 1.5 : 1 + (1 - p) * 1.5;

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity,
          transform: `translateY(${wobble}px) scale(${1 + burn * 0.03})`,
          filter: `brightness(${exposure}) sepia(${burn * 0.5})`,
        }}
      >
        {children}
      </AbsoluteFill>
      {presentationDirection === 'entering' ? (
        <AbsoluteFill
          style={{
            opacity: burn,
            mixBlendMode: 'screen',
            background: `
              radial-gradient(140% 100% at ${50 + seededNoise(seed + 7, Math.floor(frame / 2)) * 20}% 110%, ${burnColor}, transparent 65%),
              radial-gradient(100% 60% at 50% -10%, rgba(255,220,150,0.6), transparent 50%)
            `,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Filme queimando: superexposição, tom sépia e labareda subindo no corte.
 * @example
 * <TransitionSeries.Transition
 *   presentation={filmBurn()}
 *   timing={linearTiming({durationInFrames: 18})}
 * />
 */
export const filmBurn = (
  props: FilmBurnProps = {},
): TransitionPresentation<FilmBurnProps> => ({
  component: FilmBurnPresentation,
  props,
});
