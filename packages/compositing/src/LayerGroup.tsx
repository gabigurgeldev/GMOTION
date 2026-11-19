import type {CSSProperties, ReactNode} from 'react';
import type {BlendMode} from './blend';

export type LayerGroupProps = {
  children: ReactNode;
  /** Transform aplicado ao grupo inteiro de uma vez. */
  transform?: string;
  /** Opacidade do grupo (aplicada ao conjunto, não por camada). */
  opacity?: number;
  /** Blend do grupo contra o que está abaixo. */
  blend?: BlendMode;
  /** Ocupa o frame todo. Default: true. */
  fill?: boolean;
  style?: CSSProperties;
};

/**
 * "Pre-compose" do AE: agrupa camadas pra aplicar transform/opacity/blend
 * uma única vez ao conjunto. `isolation: isolate` garante que blends INTERNOS
 * ao grupo não vazem pro fundo de fora.
 *
 * @example
 * <LayerGroup transform={`scale(${s})`} opacity={0.9}>
 *   <Video ... />
 *   <BlendLayer mode="screen"><Glow /></BlendLayer>
 * </LayerGroup>
 */
export const LayerGroup = ({
  children,
  transform,
  opacity,
  blend,
  fill = true,
  style,
}: LayerGroupProps) => {
  return (
    <div
      style={{
        ...(fill ? {position: 'absolute', inset: 0} : {}),
        isolation: 'isolate',
        transform,
        opacity,
        mixBlendMode: blend,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
