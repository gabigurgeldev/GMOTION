import type {CSSProperties} from 'react';
import {useCurrentFrame} from 'remotion';
import type {EasingName} from '@gmotion/presets';
import {counterValue, formatCounter} from './calc';

export type AnimatedCounterProps = {
  /** Valor final. */
  to: number;
  /** Valor inicial. Default: 0. */
  from?: number;
  /** Frames até chegar em `to`. Default: 45. */
  durationInFrames?: number;
  /** Frame em que começa. Default: 0. */
  startFrame?: number;
  easing?: EasingName;
  /** Casas decimais. Default: 0. */
  decimals?: number;
  /** Separador de milhar. Default: '.'. */
  separator?: string;
  decimalSeparator?: string;
  prefix?: string;
  suffix?: string;
  style?: CSSProperties;
};

/**
 * Contador numérico animado (0 até X com easing).
 *
 * @example
 * <AnimatedCounter to={15000} prefix="R$ " durationInFrames={50} />
 * <AnimatedCounter to={99.9} decimals={1} suffix="%" />
 */
export const AnimatedCounter = ({
  to,
  from = 0,
  durationInFrames = 45,
  startFrame = 0,
  easing = 'out-cubic',
  decimals = 0,
  separator = '.',
  decimalSeparator = ',',
  prefix = '',
  suffix = '',
  style,
}: AnimatedCounterProps) => {
  const frame = useCurrentFrame();

  const value = counterValue({frame, durationInFrames, from, to, easing, startFrame});
  const text = formatCounter(value, {
    decimals,
    separator,
    decimalSeparator,
    prefix,
    suffix,
  });

  return (
    <span
      style={{
        fontFamily: 'Arial, sans-serif',
        fontWeight: 900,
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
    >
      {text}
    </span>
  );
};
