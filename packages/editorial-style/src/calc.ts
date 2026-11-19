import {clamp} from '@gmotion/core';
import {ease, type EasingName} from '@gmotion/presets';

/**
 * Cálculos puros do estilo editorial (Fase 18).
 */

/** '#rrggbb' → [r, g, b] 0-1. */
export const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean.padEnd(6, '0');
  return [
    parseInt(full.slice(0, 2), 16) / 255,
    parseInt(full.slice(2, 4), 16) / 255,
    parseInt(full.slice(4, 6), 16) / 255,
  ];
};

/**
 * Tabelas do filtro duotone: luminância 0-1 mapeada de colorDark → colorLight
 * por canal (tableValues do feComponentTransfer, aplicado após conversão
 * pra luminância). Duotone real — não grayscale.
 */
export const duotoneTables = (
  colorDark: string,
  colorLight: string,
  steps = 17,
): {r: number[]; g: number[]; b: number[]} => {
  const dark = hexToRgb(colorDark);
  const light = hexToRgb(colorLight);
  const table = (channel: 0 | 1 | 2): number[] =>
    Array.from({length: steps}, (_, i) => {
      const t = i / (steps - 1);
      return dark[channel] + (light[channel] - dark[channel]) * t;
    });
  return {r: table(0), g: table(1), b: table(2)};
};

export type CursorKeyframe = {x: number; y: number};

/**
 * Posição do cursor do mockup: anda de `from` até `to` entre startFrame e
 * startFrame+durationInFrames, com easing. Clampa fora do range.
 */
export const cursorAt = (params: {
  frame: number;
  from: CursorKeyframe;
  to: CursorKeyframe;
  startFrame?: number;
  durationInFrames?: number;
  easing?: EasingName;
}): CursorKeyframe => {
  const {frame, from, to, startFrame = 0, durationInFrames = 30, easing = 'in-out-cubic'} = params;
  const progress = ease(easing, clamp((frame - startFrame) / Math.max(1, durationInFrames), 0, 1));
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
  };
};

/**
 * Offset do traço tracejado "deslizando": px por segundo constantes.
 * (Diferente do AnimatedStroke — o traço já nasce tracejado e se move.)
 */
export const slideDashOffset = (frame: number, fps: number, speed = 60): number => {
  return 0 - (frame / fps) * speed;
};
