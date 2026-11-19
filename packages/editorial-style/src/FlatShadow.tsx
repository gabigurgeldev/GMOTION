import type {CSSProperties, ReactNode} from 'react';

export type FlatShadowProps = {
  children: ReactNode;
  /** Deslocamento horizontal da sombra em px. Default: 10. */
  offsetX?: number;
  /** Deslocamento vertical em px. Default: 10. */
  offsetY?: number;
  /** Cor da sombra sólida. Default: '#000'. */
  color?: string;
  style?: CSSProperties;
};

/**
 * Sombra SÓLIDA deslocada (offset duro, blur zero) — visual "sticker"/flat
 * design da referência, não o drop-shadow suave/glow do packages/effects.
 * Funciona em texto, SVG e imagens com alpha (segue o contorno).
 *
 * @example
 * <FlatShadow offsetX={12} offsetY={12} color="#1a1a1a"><Star /></FlatShadow>
 */
export const FlatShadow = ({
  children,
  offsetX = 10,
  offsetY = 10,
  color = '#000',
  style,
}: FlatShadowProps) => (
  <div style={{filter: `drop-shadow(${offsetX}px ${offsetY}px 0 ${color})`, ...style}}>
    {children}
  </div>
);
