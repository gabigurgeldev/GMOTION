import type {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import type {EasingName} from '@gmotion/presets';
import {barProgress} from './calc';

export type ProgressBarProps = {
  /** Alvo final (0-1). */
  target: number;
  /** Frames até encher. Default: 40. */
  durationInFrames?: number;
  startFrame?: number;
  easing?: EasingName;
  /** Largura em px. Default: 600. */
  width?: number;
  /** Altura em px. Default: 24. */
  height?: number;
  color?: string;
  trackColor?: string;
  /** Gradiente opcional (sobrepõe color). */
  gradient?: [string, string];
  style?: CSSProperties;
};

/**
 * Barra de progresso animada.
 *
 * @example
 * <ProgressBar target={0.85} gradient={['#6366f1', '#ec4899']} />
 */
export const ProgressBar = ({
  target,
  durationInFrames = 40,
  startFrame = 0,
  easing = 'out-cubic',
  width = 600,
  height = 24,
  color = '#6366f1',
  trackColor = 'rgba(255,255,255,0.12)',
  gradient,
  style,
}: ProgressBarProps) => {
  const frame = useCurrentFrame();
  const progress = barProgress({frame, durationInFrames, target, easing, startFrame});

  return (
    <div
      style={{
        width,
        height,
        borderRadius: height / 2,
        backgroundColor: trackColor,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          background: gradient
            ? `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`
            : color,
        }}
      />
    </div>
  );
};
