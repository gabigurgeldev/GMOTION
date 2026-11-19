import {clamp} from '@gmotion/core';
import {ease, type EasingName} from '@gmotion/presets';

/**
 * Cálculos puros do text engine (Fase 11) — sem hooks, sem DOM.
 */

export type TextUnit = {
  text: string;
  /** Índice da unidade ANIMÁVEL (espaços não contam — não recebem stagger). */
  animIndex: number;
  isSpace: boolean;
};

/**
 * Quebra a string em unidades animáveis.
 * - 'chars': cada caractere é uma unidade; espaços viram unidades não animadas
 *   (preservam layout, não entram no stagger).
 * - 'words': cada palavra é uma unidade; espaços preservados como unidades próprias.
 */
export const splitUnits = (text: string, by: 'chars' | 'words'): TextUnit[] => {
  const parts =
    by === 'chars' ? [...text] : text.split(/(\s+)/).filter((p) => p.length > 0);
  const units: TextUnit[] = [];
  let animIndex = 0;
  for (const part of parts) {
    const isSpace = /^\s+$/.test(part);
    units.push({text: part, animIndex: isSpace ? -1 : animIndex, isSpace});
    if (!isSpace) animIndex++;
  }
  return units;
};

/** Delay em frames da unidade `animIndex` com stagger fixo. */
export const staggerDelay = (animIndex: number, staggerFrames: number): number => {
  return Math.max(0, animIndex) * Math.max(0, staggerFrames);
};

/**
 * startOffset (em % do path) do <textPath> num frame — texto "andando" pelo path.
 * from/to em porcentagem (0-100). durationInFrames 0 = estático em `to`.
 */
export const pathTextOffset = (params: {
  frame: number;
  durationInFrames: number;
  from?: number;
  to?: number;
  easing?: EasingName;
}): number => {
  const {frame, durationInFrames, from = 0, to = 0, easing = 'out-cubic'} = params;
  if (durationInFrames <= 0) return to;
  const progress = clamp(frame / durationInFrames, 0, 1);
  return from + (to - from) * ease(easing, progress);
};

/** Delay do run `index` do MixedTypeText: explícito vence, senão stagger. */
export const runDelay = (
  index: number,
  staggerFrames: number,
  explicitDelay?: number,
): number => {
  if (explicitDelay !== undefined) return Math.max(0, explicitDelay);
  return index * Math.max(0, staggerFrames);
};
