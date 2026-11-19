import type {CSSProperties, ReactNode} from 'react';
import type {BlendMode} from './blend';

export type BlendLayerProps = {
  children: ReactNode;
  /** Blend mode tipado (mix-blend-mode). */
  mode: BlendMode;
  /** Opacidade da camada. Default: 1. */
  opacity?: number;
  /** Ocupa o frame todo (position absolute inset 0). Default: true. */
  fill?: boolean;
  style?: CSSProperties;
};

/**
 * Wrapper tipado de mix-blend-mode — camada de partículas em 'screen',
 * textura em 'multiply', etc.
 *
 * @example
 * <BlendLayer mode="screen"><Particles /></BlendLayer>
 */
export const BlendLayer = ({
  children,
  mode,
  opacity = 1,
  fill = true,
  style,
}: BlendLayerProps) => {
  return (
    <div
      style={{
        ...(fill ? {position: 'absolute', inset: 0} : {}),
        mixBlendMode: mode,
        opacity,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
