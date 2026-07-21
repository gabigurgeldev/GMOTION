import {clamp} from '@gmotion/core';
import {ease, type EasingName} from '@gmotion/presets';

/**
 * Cálculos puros dos elementos gráficos.
 */

/**
 * Valor de um contador animado num frame.
 * Sobe de `from` até `to` em `durationInFrames` com easing.
 */
export const counterValue = (params: {
  frame: number;
  durationInFrames: number;
  from?: number;
  to: number;
  easing?: EasingName;
  /** Frame em que começa a contar. Default: 0. */
  startFrame?: number;
}): number => {
  const {
    frame,
    durationInFrames,
    from = 0,
    to,
    easing = 'out-cubic',
    startFrame = 0,
  } = params;
  const progress = clamp((frame - startFrame) / durationInFrames, 0, 1);
  return from + (to - from) * ease(easing, progress);
};

/**
 * Formata número com separador de milhar, decimais e prefixo/sufixo.
 * formatCounter(1234.5, {decimals: 1, separator: '.', prefix: 'R$ '}) => "R$ 1.234,5"
 */
export const formatCounter = (
  value: number,
  options: {
    decimals?: number;
    /** Separador de milhar. Default: '.'. */
    separator?: string;
    /** Separador decimal. Default: ','. */
    decimalSeparator?: string;
    prefix?: string;
    suffix?: string;
  } = {},
): string => {
  const {
    decimals = 0,
    separator = '.',
    decimalSeparator = ',',
    prefix = '',
    suffix = '',
  } = options;

  const fixed = Math.abs(value).toFixed(decimals);
  const [intPart = '0', decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  const sign = value < 0 ? '-' : '';
  const dec = decPart ? `${decimalSeparator}${decPart}` : '';
  return `${prefix}${sign}${grouped}${dec}${suffix}`;
};

/**
 * Progresso do traço de um caminho SVG (callout/seta desenhando).
 * Retorna strokeDashoffset dado o comprimento total.
 */
export const strokeDrawOffset = (params: {
  frame: number;
  durationInFrames: number;
  pathLength: number;
  easing?: EasingName;
  startFrame?: number;
}): number => {
  const {
    frame,
    durationInFrames,
    pathLength,
    easing = 'out-cubic',
    startFrame = 0,
  } = params;
  const progress = clamp((frame - startFrame) / durationInFrames, 0, 1);
  return pathLength * (1 - ease(easing, progress));
};

/**
 * Progresso animado de barra (0-1) até `target`.
 */
export const barProgress = (params: {
  frame: number;
  durationInFrames: number;
  /** Alvo final (0-1). */
  target: number;
  easing?: EasingName;
  startFrame?: number;
}): number => {
  const {frame, durationInFrames, target, easing = 'out-cubic', startFrame = 0} = params;
  const progress = clamp((frame - startFrame) / durationInFrames, 0, 1);
  return clamp(target, 0, 1) * ease(easing, progress);
};
