import type {CSSProperties} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp} from '@gmotion/core';
import type {EasingName} from '@gmotion/presets';
import {morphSequence} from './morph';

export type MorphShapeProps = {
  /** 2+ paths SVG (atributo d) — morpha em sequência A→B→C... */
  paths: string[];
  /** Frames do morph completo. Default: duração da Sequence inteira. */
  durationInFrames?: number;
  /** Frame em que começa. Default: 0. */
  startFrame?: number;
  /** Easing por segmento. Default: 'in-out-cubic'. */
  easing?: EasingName;
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  style?: CSSProperties;
};

/**
 * Shape morfando entre 2+ paths via useCurrentFrame() — puro, sem estado.
 *
 * @example
 * <MorphShape paths={[STAR, CIRCLE, BOLT]} durationInFrames={90} fill="#ffcc33" />
 */
export const MorphShape = ({
  paths,
  durationInFrames,
  startFrame = 0,
  easing = 'in-out-cubic',
  viewBox = '0 0 100 100',
  width = '100%',
  height,
  fill = 'white',
  stroke,
  strokeWidth,
  style,
}: MorphShapeProps) => {
  const frame = useCurrentFrame();
  const {durationInFrames: seqDuration} = useVideoConfig();
  const total = durationInFrames ?? seqDuration;
  const progress = clamp((frame - startFrame) / Math.max(1, total), 0, 1);

  return (
    <svg viewBox={viewBox} width={width} height={height} style={{overflow: 'visible', ...style}}>
      <path
        d={morphSequence(paths, progress, easing)}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </svg>
  );
};
