import {useId} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {grainSeed} from './calc';

export type FilmGrainProps = {
  /** Opacidade do grain (0-1). Default: 0.12. */
  intensity?: number;
  /** Trocas de padrão por segundo. Default: 12. */
  grainFps?: number;
  /** Granulometria (maior = grão mais fino). Default: 0.9. */
  frequency?: number;
  seed?: number;
};

/**
 * Film grain via feTurbulence (SVG) — seed muda `grainFps` vezes/s,
 * determinístico por frame. Overlay: coloque por cima da cena.
 *
 * @example
 * <AbsoluteFill>
 *   <MinhaCena />
 *   <FilmGrain intensity={0.15} />
 * </AbsoluteFill>
 */
export const FilmGrain = ({
  intensity = 0.12,
  grainFps = 12,
  frequency = 0.9,
  seed = 0,
}: FilmGrainProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const id = useId();

  const turbulenceSeed = grainSeed({frame, fps, grainFps, seed});

  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={id}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves={2}
            seed={turbulenceSeed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#${id})`}
          opacity={intensity}
          style={{mixBlendMode: 'overlay'}}
        />
      </svg>
    </AbsoluteFill>
  );
};
