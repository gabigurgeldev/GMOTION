import {clamp} from '@gmotion/core';

/**
 * Curvas de cor (estilo AE/Lightroom) — pontos de controle → tabela de
 * transferência 1D usada no feComponentTransfer do filtro SVG. TS puro.
 */

/** Ponto de controle: entrada/saída em 0-1. */
export type CurvePoint = [number, number];

export type Curves = {
  /** Curva master aplicada aos 3 canais (luminância). */
  rgb?: CurvePoint[];
  r?: CurvePoint[];
  g?: CurvePoint[];
  b?: CurvePoint[];
};

export type HslAdjust = {
  /** Rotação de matiz em graus (-180..180). Default: 0. */
  hue?: number;
  /** Multiplicador de saturação (1 = neutro). Default: 1. */
  saturation?: number;
  /** Multiplicador de luminosidade (1 = neutro). Default: 1. */
  lightness?: number;
};

/**
 * Avalia a curva num ponto t (0-1) — interpolação linear por partes entre
 * pontos de controle ordenados. Sem pontos = identidade.
 */
export const evalCurve = (points: CurvePoint[] | undefined, t: number): number => {
  if (!points || points.length === 0) return clamp(t, 0, 1);
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return clamp(t, 0, 1);
  if (t <= first[0]) return clamp(first[1], 0, 1);
  if (t >= last[0]) return clamp(last[1], 0, 1);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (!a || !b) continue;
    if (t <= b[0]) {
      const span = b[0] - a[0] || 1;
      const local = (t - a[0]) / span;
      return clamp(a[1] + (b[1] - a[1]) * local, 0, 1);
    }
  }
  return clamp(t, 0, 1);
};

/** Tabela de transferência (tableValues) de `size` amostras da curva. */
export const curveTable = (points: CurvePoint[] | undefined, size = 33): number[] => {
  return Array.from({length: size}, (_, i) => evalCurve(points, i / (size - 1)));
};

/**
 * Compõe master rgb + curva do canal numa tabela só (canal(master(t))).
 */
export const channelTable = (
  master: CurvePoint[] | undefined,
  channel: CurvePoint[] | undefined,
  size = 33,
): number[] => {
  return Array.from({length: size}, (_, i) =>
    evalCurve(channel, evalCurve(master, i / (size - 1))),
  );
};

/** Fallback CSS-only barato — sem LUT/curvas, só hue/sat/brightness/contrast. */
export const cssColorFilter = (adjust: HslAdjust & {contrast?: number}): string => {
  const {hue = 0, saturation = 1, lightness = 1, contrast = 1} = adjust;
  const parts: string[] = [];
  if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`);
  if (saturation !== 1) parts.push(`saturate(${saturation})`);
  if (lightness !== 1) parts.push(`brightness(${lightness})`);
  if (contrast !== 1) parts.push(`contrast(${contrast})`);
  return parts.join(' ') || 'none';
};
