import type {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';

export type GlowProps = {
  children: ReactNode;
  /** Raio do glow em px. Default: 20. */
  intensity?: number;
  /** Cor do glow. Default: branco. */
  color?: string;
  /** Camadas de drop-shadow (mais = halo mais denso). Default: 2. */
  layers?: number;
  /** Boost de brilho da fonte (1 = sem boost). Default: 1.1. */
  brightness?: number;
};

/**
 * Glow/bloom barato via drop-shadow empilhado + brightness.
 * Aplique em elementos brilhantes sobre fundo escuro (neon, título).
 *
 * @example
 * <Glow intensity={30} color="#0ff">
 *   <h1 style={{color: '#0ff'}}>NEON</h1>
 * </Glow>
 */
export const Glow = ({
  children,
  intensity = 20,
  color = 'rgba(255,255,255,0.9)',
  layers = 2,
  brightness = 1.1,
}: GlowProps) => {
  const shadows = Array.from({length: layers}, (_, i) => {
    const radius = intensity * (1 + i);
    return `drop-shadow(0 0 ${radius}px ${color})`;
  }).join(' ');

  return (
    <AbsoluteFill style={{filter: `${shadows} brightness(${brightness})`}}>
      {children}
    </AbsoluteFill>
  );
};
