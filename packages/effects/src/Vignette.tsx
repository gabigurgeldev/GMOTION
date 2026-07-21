import {AbsoluteFill} from 'remotion';

export type VignetteProps = {
  /** Escuridão nas bordas (0-1). Default: 0.6. */
  intensity?: number;
  /** Tamanho do miolo claro em % (menor = vinheta mais fechada). Default: 55. */
  size?: number;
  /** Cor da vinheta. Default: preto. */
  color?: string;
};

/**
 * Vinheta clássica — overlay radial. Coloque por cima da cena.
 *
 * @example
 * <AbsoluteFill>
 *   <MinhaCena />
 *   <Vignette intensity={0.7} />
 * </AbsoluteFill>
 */
export const Vignette = ({
  intensity = 0.6,
  size = 55,
  color = '#000000',
}: VignetteProps) => {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at center, transparent ${size}%, ${color} 130%)`,
        opacity: intensity,
      }}
    />
  );
};
