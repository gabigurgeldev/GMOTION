import type {CSSProperties} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {slideDashOffset} from './calc';

export type DashedPathProps = {
  /** Path SVG (d) da linha. */
  path: string;
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  stroke?: string;
  strokeWidth?: number;
  /** Comprimento do traço e do vão: "18 14". Default: '18 14'. */
  dashArray?: string;
  /** Velocidade do deslize em px/s (negativo inverte). Default: 60. */
  speed?: number;
  style?: CSSProperties;
};

/**
 * Linha TRACEJADA curva animada (dashoffset deslizando) — elemento gráfico de
 * transição da referência. Diferente do <AnimatedStroke> do graphics: lá o
 * traço contínuo se DESENHA; aqui já nasce tracejado e desliza.
 *
 * @example
 * <DashedPath path="M 40 200 C 300 40 700 360 1040 160" stroke="#111" strokeWidth={6} />
 */
export const DashedPath = ({
  path,
  viewBox = '0 0 1080 400',
  width = '100%',
  height,
  stroke = '#111',
  strokeWidth = 6,
  dashArray = '18 14',
  speed = 60,
  style,
}: DashedPathProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <svg viewBox={viewBox} width={width} height={height} style={{overflow: 'visible', ...style}}>
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={dashArray}
        strokeDashoffset={slideDashOffset(frame, fps, speed)}
      />
    </svg>
  );
};
