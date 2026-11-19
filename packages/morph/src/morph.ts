import {interpolatePath} from '@remotion/paths';
import {clamp} from '@gmotion/core';
import {ease, type EasingName} from '@gmotion/presets';

/**
 * Interpolação de path SVG — função pura, sem estado, sem DOM.
 * Baseada em interpolatePath do @remotion/paths (determinística),
 * com clamp + easing + morph em sequência por cima.
 */

/** Morpha pathA → pathB em progress 0-1 (clampado). */
export const morphPath = (pathA: string, pathB: string, progress: number): string => {
  const t = clamp(progress, 0, 1);
  if (t === 0) return pathA;
  if (t === 1) return pathB;
  return interpolatePath(t, pathA, pathB);
};

/**
 * Mapeia progress global 0-1 numa sequência de shapes:
 * N paths = N-1 segmentos de morph, cada um com fatia igual do progresso.
 * Retorna o segmento ativo e o progresso local dentro dele.
 */
export const sequenceSegment = (
  pathCount: number,
  progress: number,
): {index: number; local: number} => {
  const segments = Math.max(1, pathCount - 1);
  const t = clamp(progress, 0, 1) * segments;
  const index = Math.min(segments - 1, Math.floor(t));
  return {index, local: t - index};
};

/**
 * Morph através de vários shapes em sequência (A→B→C...).
 * `easing` aplicado por segmento (cada transição acelera/desacelera sozinha).
 */
export const morphSequence = (
  paths: string[],
  progress: number,
  easing: EasingName = 'in-out-cubic',
): string => {
  const first = paths[0];
  if (first === undefined) return '';
  if (paths.length === 1) return first;
  const {index, local} = sequenceSegment(paths.length, progress);
  const from = paths[index] ?? first;
  const to = paths[index + 1] ?? from;
  return morphPath(from, to, ease(easing, local));
};
