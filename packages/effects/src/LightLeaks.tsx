import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {lightLeakBlobs} from './calc';

export type LightLeaksProps = {
  /** Intensidade global (multiplica a opacidade dos blobs). Default: 1. */
  intensity?: number;
  /** Quantidade de vazamentos. Default: 3. */
  count?: number;
  /** Velocidade da deriva. Default: 0.05. */
  driftSpeed?: number;
  seed?: number;
};

/**
 * Vazamentos de luz analógicos derivando lentamente pela tela (screen blend).
 * Overlay: coloque por cima da cena.
 *
 * @example
 * <AbsoluteFill>
 *   <MinhaCena />
 *   <LightLeaks intensity={0.8} />
 * </AbsoluteFill>
 */
export const LightLeaks = ({
  intensity = 1,
  count = 3,
  driftSpeed = 0.05,
  seed = 9,
}: LightLeaksProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const blobs = lightLeakBlobs({frame, fps, count, seed, driftSpeed});

  const background = blobs
    .map(
      (b) =>
        `radial-gradient(circle at ${b.cx}% ${b.cy}%, hsla(${b.hue}, 100%, 65%, ${b.opacity * intensity}), transparent ${b.radius}%)`,
    )
    .join(', ');

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        background,
      }}
    />
  );
};
