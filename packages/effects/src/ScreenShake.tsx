import type {ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {screenShakeAt} from './calc';

export type ScreenShakeProps = {
  children: ReactNode;
  /** Deslocamento máximo em px. Default: 15. */
  intensity?: number;
  /** "Saltos" por segundo. Default: 18. */
  stepsPerSecond?: number;
  /** Rotação máxima em graus. Default: 0.8. */
  rotation?: number;
  /** Frames até o tremor amortecer a zero (0 = constante). Default: 0. */
  decayFrames?: number;
  seed?: number;
  /** Zoom extra para esconder as bordas expostas pelo tremor. Default: auto. */
  overscan?: number;
};

/**
 * Screen shake determinístico (ruído com seed — nunca Math.random()).
 * `decayFrames` > 0 = impacto que amortece; 0 = câmera handheld constante.
 *
 * @example
 * <ScreenShake intensity={20} decayFrames={20}>
 *   <MinhaCena />
 * </ScreenShake>
 */
export const ScreenShake = ({
  children,
  intensity = 15,
  stepsPerSecond = 18,
  rotation = 0.8,
  decayFrames = 0,
  seed = 3,
  overscan,
}: ScreenShakeProps) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  const {x, y, rotation: rot} = screenShakeAt({
    frame,
    fps,
    intensity,
    stepsPerSecond,
    rotation,
    decayFrames,
    seed,
  });

  // Zoom suficiente para o deslocamento máximo não expor a borda
  const scale = overscan ?? 1 + (intensity * 2) / width;

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translate(${x}px, ${y}px) rotate(${rot}deg)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
