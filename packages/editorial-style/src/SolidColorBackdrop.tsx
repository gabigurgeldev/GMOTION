import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';

export type SolidColorBackdropProps = {
  color: string;
  children?: ReactNode;
  style?: CSSProperties;
};

/**
 * Fundo cor sólida full-frame — o color-block do estilo editorial.
 * A troca de cor entre cenas deve ser CORTE SECO: use <Sequence>s adjacentes
 * (ou <TransitionSeries> sem transição), NUNCA cross-fade entre elas.
 *
 * @example
 * <Sequence durationInFrames={30}><SolidColorBackdrop color="#fff">...</SolidColorBackdrop></Sequence>
 * <Sequence from={30} durationInFrames={30}><SolidColorBackdrop color="#e2231a">...</SolidColorBackdrop></Sequence>
 */
export const SolidColorBackdrop = ({color, children, style}: SolidColorBackdropProps) => (
  <AbsoluteFill style={{backgroundColor: color, ...style}}>{children}</AbsoluteFill>
);
