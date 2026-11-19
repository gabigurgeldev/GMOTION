import type {CSSProperties} from 'react';

export type GlowBeamProps = {
  /** Orientação da barra. Default: 'vertical'. */
  orientation?: 'vertical' | 'horizontal';
  /** Espessura do núcleo em px. Default: 14. */
  thickness?: number;
  /** Comprimento (CSS). Default: '100%'. */
  length?: number | string;
  color?: string;
  /** Raio do glow em px. Default: 40. */
  glowRadius?: number;
  /** Posição via style (left/top/transform). */
  style?: CSSProperties;
};

/**
 * Feixe de luz neon GEOMÉTRICO (barra reta com gradiente nas pontas + glow) —
 * elemento de destaque/transição da referência. Distinto do light-leak do
 * packages/effects (orgânico/textura); este é uma barra dura.
 *
 * @example
 * <GlowBeam color="#7df9ff" style={{left: '30%', top: 0, height: '100%'}} />
 */
export const GlowBeam = ({
  orientation = 'vertical',
  thickness = 14,
  length = '100%',
  color = '#7df9ff',
  glowRadius = 40,
  style,
}: GlowBeamProps) => {
  const vertical = orientation === 'vertical';
  const gradient = `linear-gradient(${vertical ? '180deg' : '90deg'}, transparent, ${color} 12%, ${color} 88%, transparent)`;
  return (
    <div
      style={{
        position: 'absolute',
        width: vertical ? thickness : length,
        height: vertical ? length : thickness,
        background: gradient,
        borderRadius: thickness,
        boxShadow: `0 0 ${glowRadius}px ${glowRadius / 3}px ${color}`,
        ...style,
      }}
    />
  );
};
