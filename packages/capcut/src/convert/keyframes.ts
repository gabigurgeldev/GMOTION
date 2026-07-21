import {lerp} from '@gmotion/core';
import {framesToUs, usToFrames} from './units';
import type {CommonKeyframe, Keyframe} from '../draft/types';

/**
 * Conversão de `common_keyframes` (bézier em µs) para trilhas amostráveis por
 * frame, e o inverso para export. A amostragem é determinística (função pura do
 * frame), respeitando a regra de ouro do Gmotion.
 */

export type CanonicalProperty =
  | 'posX'
  | 'posY'
  | 'scaleX'
  | 'scaleY'
  | 'rotation'
  | 'alpha'
  | 'volume'
  | string;

const PROP_TO_CANON: Record<string, CanonicalProperty> = {
  KFTypePositionX: 'posX',
  KFTypePositionY: 'posY',
  KFTypeScaleX: 'scaleX',
  KFTypeScaleY: 'scaleY',
  KFTypeRotation: 'rotation',
  KFTypeAlpha: 'alpha',
  KFTypeVolume: 'volume',
};

const CANON_TO_PROP: Record<string, string> = Object.fromEntries(
  Object.entries(PROP_TO_CANON).map(([k, v]) => [v, k]),
);

export interface KeyPoint {
  frame: number;
  value: number;
  /** Handle de saída deste ponto (normalizado no segmento), se houver. */
  outHandle?: {x: number; y: number};
  /** Handle de entrada deste ponto (normalizado no segmento), se houver. */
  inHandle?: {x: number; y: number};
}

export interface KeyframeTrack {
  property: CanonicalProperty;
  points: KeyPoint[];
}

const inUnit = (n: number) => n >= 0 && n <= 1;

/** common_keyframes[] → trilhas canônicas (frames relativos ao segmento). */
export const toKeyframeTracks = (
  kfs: CommonKeyframe[],
  fps: number,
): KeyframeTrack[] =>
  kfs.map((kf) => ({
    property: PROP_TO_CANON[kf.property_type] ?? kf.property_type,
    points: kf.keyframe_list
      .map((k) => ({
        frame: usToFrames(k.time_offset, fps),
        value: k.values[0] ?? 0,
        outHandle: k.right_control,
        inHandle: k.left_control,
      }))
      .sort((a, b) => a.frame - b.frame),
  }));

/** Solver Newton para easing cubic-bezier(p1x,p1y,p2x,p2y) em t∈[0,1]. */
const cubicBezierEase = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  t: number,
): number => {
  const cx = 3 * p1x;
  const bx = 3 * (p2x - p1x) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * p1y;
  const by = 3 * (p2y - p1y) - cy;
  const ay = 1 - cy - by;
  const fx = (u: number) => ((ax * u + bx) * u + cx) * u;
  const dfx = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = fx(u) - t;
    const d = dfx(u);
    if (Math.abs(x) < 1e-6 || d === 0) break;
    u -= x / d;
  }
  u = Math.min(1, Math.max(0, u));
  return ((ay * u + by) * u + cy) * u;
};

/** Valor da trilha num frame relativo ao início do segmento. */
export const sampleTrack = (track: KeyframeTrack, frame: number): number => {
  const pts = track.points;
  if (pts.length === 0) return 0;
  if (pts.length === 1 || frame <= pts[0]!.frame) return pts[0]!.value;
  const last = pts[pts.length - 1]!;
  if (frame >= last.frame) return last.value;

  let i = 0;
  while (i < pts.length - 1 && pts[i + 1]!.frame <= frame) i++;
  const a = pts[i]!;
  const b = pts[i + 1]!;
  const span = b.frame - a.frame;
  const t = span === 0 ? 0 : (frame - a.frame) / span;

  // Usa bézier só quando os handles parecem normalizados; senão, linear.
  const out = a.outHandle;
  const inn = b.inHandle;
  if (out && inn && inUnit(out.x) && inUnit(inn.x)) {
    const eased = cubicBezierEase(out.x, out.y, inn.x, inn.y, t);
    return lerp(a.value, b.value, eased);
  }
  return lerp(a.value, b.value, t);
};

/** Coleta os valores de todas as trilhas num frame → mapa por propriedade. */
export const sampleAll = (
  tracks: KeyframeTrack[],
  frame: number,
): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const t of tracks) out[t.property] = sampleTrack(t, frame);
  return out;
};

/** Inverso: trilhas canônicas → common_keyframes[] (para export). */
export const fromKeyframeTracks = (
  tracks: KeyframeTrack[],
  fps: number,
  idFor: (property: string, index: number) => string,
): CommonKeyframe[] =>
  tracks.map((track, ti) => ({
    id: idFor(track.property, ti),
    material_id: '',
    property_type: CANON_TO_PROP[track.property] ?? track.property,
    keyframe_list: track.points.map((p, pi): Keyframe => ({
      id: idFor(`${track.property}:${pi}`, pi),
      time_offset: framesToUs(p.frame, fps),
      values: [p.value],
      left_control: p.inHandle ?? {x: 0, y: 0},
      right_control: p.outHandle ?? {x: 1, y: 1},
    })),
  }));
