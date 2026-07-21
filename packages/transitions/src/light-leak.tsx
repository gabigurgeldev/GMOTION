import type {
  TransitionPresentation,
  TransitionPresentationComponentProps,
} from '@remotion/transitions';
import {AbsoluteFill} from 'remotion';
import {bell} from './calc';

export type LightLeakProps = {
  /** Cor do vazamento de luz. Default: laranja quente. */
  color?: string;
  /** Cor secundária do gradiente. Default: rosa. */
  secondaryColor?: string;
  /** Intensidade máxima do flash (0-1). Default: 1. */
  intensity?: number;
};

const LightLeakPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}: TransitionPresentationComponentProps<LightLeakProps>) => {
  const {
    color = 'rgba(255,160,60,0.95)',
    secondaryColor = 'rgba(255,80,120,0.7)',
    intensity = 1,
  } = passedProps;

  const flash = bell(presentationProgress) * intensity;

  const opacity =
    presentationDirection === 'exiting'
      ? 1 - presentationProgress
      : presentationProgress;

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity}}>{children}</AbsoluteFill>
      {/* Overlay só uma vez (na cena que entra, que renderiza por cima) */}
      {presentationDirection === 'entering' ? (
        <AbsoluteFill
          style={{
            opacity: flash,
            mixBlendMode: 'screen',
            background: `
              radial-gradient(120% 80% at ${20 + presentationProgress * 60}% 30%, ${color}, transparent 60%),
              radial-gradient(80% 120% at 80% ${70 - presentationProgress * 40}%, ${secondaryColor}, transparent 55%)
            `,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Crossfade com vazamento de luz analógico varrendo a tela no pico.
 * @example
 * <TransitionSeries.Transition
 *   presentation={lightLeak()}
 *   timing={linearTiming({durationInFrames: 20})}
 * />
 */
export const lightLeak = (
  props: LightLeakProps = {},
): TransitionPresentation<LightLeakProps> => ({
  component: LightLeakPresentation,
  props,
});
