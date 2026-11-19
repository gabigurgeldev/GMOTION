import type {TrackFrame} from './types.ts';

/**
 * Tracker por template matching (correlação cruzada normalizada — NCC).
 * TS puro, determinístico, testável com frames sintéticos.
 * Simples de propósito: translação apenas (scale=1, rotation=0).
 */

export type GrayFrame = {
  data: Uint8Array | Float32Array;
  width: number;
  height: number;
};

/** Recorta patch quadrado (side x side) centrado em (cx, cy), com clamp na borda. */
export const extractPatch = (frame: GrayFrame, cx: number, cy: number, side: number): Float32Array => {
  const half = Math.floor(side / 2);
  const out = new Float32Array(side * side);
  for (let dy = 0; dy < side; dy++) {
    for (let dx = 0; dx < side; dx++) {
      const x = Math.min(frame.width - 1, Math.max(0, cx - half + dx));
      const y = Math.min(frame.height - 1, Math.max(0, cy - half + dy));
      out[dy * side + dx] = frame.data[y * frame.width + x] ?? 0;
    }
  }
  return out;
};

/** Correlação cruzada normalizada entre dois patches do mesmo tamanho (-1..1). */
export const ncc = (a: Float32Array, b: Float32Array): number => {
  const n = a.length;
  let meanA = 0;
  let meanB = 0;
  for (let i = 0; i < n; i++) {
    meanA += a[i] ?? 0;
    meanB += b[i] ?? 0;
  }
  meanA /= n;
  meanB /= n;
  let num = 0;
  let varA = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const da = (a[i] ?? 0) - meanA;
    const db = (b[i] ?? 0) - meanB;
    num += da * db;
    varA += da * da;
    varB += db * db;
  }
  const denom = Math.sqrt(varA * varB);
  if (denom === 0) return 0; // patch uniforme — sem informação
  return num / denom;
};

export type MatchResult = {x: number; y: number; score: number};

/**
 * Busca o patch (template) na vizinhança ±searchRadius de (cx, cy).
 * Varredura exaustiva — janelas pequenas mantêm barato e determinístico.
 */
export const bestMatch = (
  frame: GrayFrame,
  template: Float32Array,
  side: number,
  cx: number,
  cy: number,
  searchRadius: number,
): MatchResult => {
  let best: MatchResult = {x: cx, y: cy, score: -Infinity};
  for (let dy = -searchRadius; dy <= searchRadius; dy++) {
    for (let dx = -searchRadius; dx <= searchRadius; dx++) {
      const candidate = extractPatch(frame, cx + dx, cy + dy, side);
      const score = ncc(template, candidate);
      if (score > best.score) {
        best = {x: cx + dx, y: cy + dy, score};
      }
    }
  }
  return best;
};

export type TrackOptions = {
  /** Lado do template em px (na resolução de análise). Default: 24. */
  patchSide?: number;
  /** Raio de busca por frame em px. Default: 24. */
  searchRadius?: number;
  /** Re-amostra o template a cada match (adapta a mudanças lentas). Default: true. */
  updateTemplate?: boolean;
};

/**
 * Trackeia (startX, startY) do primeiro frame através da sequência.
 * Retorna um TrackFrame por frame de entrada (coordenadas da resolução dada).
 */
export const trackSequence = (
  frames: GrayFrame[],
  startX: number,
  startY: number,
  {patchSide = 24, searchRadius = 24, updateTemplate = true}: TrackOptions = {},
): TrackFrame[] => {
  const first = frames[0];
  if (!first) return [];
  let template = extractPatch(first, startX, startY, patchSide);
  let cx = startX;
  let cy = startY;
  const result: TrackFrame[] = [
    {frame: 0, x: startX, y: startY, scale: 1, rotation: 0, confidence: 1},
  ];

  for (let i = 1; i < frames.length; i++) {
    const frame = frames[i];
    if (!frame) break;
    const match = bestMatch(frame, template, patchSide, cx, cy, searchRadius);
    cx = match.x;
    cy = match.y;
    if (updateTemplate && match.score > 0.6) {
      template = extractPatch(frame, cx, cy, patchSide);
    }
    result.push({
      frame: i,
      x: cx,
      y: cy,
      scale: 1,
      rotation: 0,
      confidence: Math.max(0, match.score),
    });
  }
  return result;
};

/**
 * Interpola a trilha num instante contínuo `t` (em frames DO TRACKER).
 * Linear entre amostras; clampa fora do range. Pura — usada pelo <TrackedLayer>
 * pra converter fps da composição em fps do tracker.
 */
export const interpolateTrack = (
  frames: TrackFrame[],
  t: number,
): {x: number; y: number; scale: number; rotation: number} => {
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (!first || !last) return {x: 0, y: 0, scale: 1, rotation: 0};
  if (t <= first.frame) return {x: first.x, y: first.y, scale: first.scale, rotation: first.rotation};
  if (t >= last.frame) return {x: last.x, y: last.y, scale: last.scale, rotation: last.rotation};

  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1];
    const b = frames[i];
    if (!a || !b) break;
    if (t <= b.frame) {
      const span = b.frame - a.frame || 1;
      const local = (t - a.frame) / span;
      return {
        x: a.x + (b.x - a.x) * local,
        y: a.y + (b.y - a.y) * local,
        scale: a.scale + (b.scale - a.scale) * local,
        rotation: a.rotation + (b.rotation - a.rotation) * local,
      };
    }
  }
  return {x: last.x, y: last.y, scale: last.scale, rotation: last.rotation};
};
