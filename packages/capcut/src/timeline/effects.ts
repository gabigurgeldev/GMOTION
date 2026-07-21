import {usToFrames} from '../convert/units';
import type {DraftContent, Segment} from '../draft/types';
import type {CapEffectSpec, ChromaSpec, MaskSpec} from './schema';

/**
 * Resolve `segment.extra_material_refs` contra os materials do CapCut e mapeia
 * máscara / chroma / efeitos / animações para os campos best-effort da timeline.
 */
export interface ClipEffectFields {
  mask?: MaskSpec | null;
  chroma?: ChromaSpec | null;
  effects: CapEffectSpec[];
}

type AnyMat = Record<string, unknown>;

const num = (m: AnyMat, k: string, d: number): number =>
  typeof m[k] === 'number' ? (m[k] as number) : d;

/** "#000000ff" | "#000000" → "#000000". */
const stripAlphaHex = (c: string): string =>
  /^#[0-9a-f]{8}$/i.test(c) ? c.slice(0, 7) : c;

const maskKind = (m: AnyMat): MaskSpec['kind'] => {
  const name = `${m['name'] ?? ''}${m['resource_id'] ?? ''}`.toLowerCase();
  if (name.includes('circle') || name.includes('round') || name.includes('oval')) return 'circle';
  if (name.includes('linear') || name.includes('line') || name.includes('mirror')) return 'linear';
  return 'rect';
};

const toMask = (m: AnyMat): MaskSpec => {
  // Geometria costuma vir em campos soltos ou num sub-config; best-effort.
  const cfg = (m['config'] as AnyMat) ?? m;
  return {
    kind: maskKind(m),
    centerX: num(cfg, 'centerX', num(cfg, 'center_x', 0.5)),
    centerY: num(cfg, 'centerY', num(cfg, 'center_y', 0.5)),
    width: num(cfg, 'width', 1),
    height: num(cfg, 'height', 1),
    rotation: num(cfg, 'rotation', 0),
    feather: num(cfg, 'feather', 0),
    invert: Boolean(cfg['invert']),
  };
};

const toChroma = (m: AnyMat): ChromaSpec => ({
  color: stripAlphaHex(String(m['color'] ?? '#00ff00')),
  intensity: num(m, 'intensity_value', 0.5),
  shadow: num(m, 'shadow_value', 0),
});

export const resolveClipEffects = (
  content: DraftContent,
  seg: Segment,
  fps: number,
): ClipEffectFields => {
  const refs = seg.extra_material_refs ?? [];
  if (refs.length === 0) return {effects: []};

  const byId = new Map<string, {group: string; mat: AnyMat}>();
  const groups = ['common_mask', 'chromas', 'video_effects', 'material_animations'] as const;
  for (const g of groups) {
    for (const mat of (content.materials[g] ?? []) as AnyMat[]) {
      if (typeof mat['id'] === 'string') byId.set(mat['id'] as string, {group: g, mat});
    }
  }

  const out: ClipEffectFields = {effects: []};
  for (const ref of refs) {
    const hit = byId.get(ref);
    if (!hit) continue;
    if (hit.group === 'common_mask') {
      out.mask = toMask(hit.mat);
    } else if (hit.group === 'chromas') {
      out.chroma = toChroma(hit.mat);
    } else if (hit.group === 'video_effects') {
      out.effects.push({name: String(hit.mat['name'] ?? 'effect'), kind: 'video_effect', intensity: null, frames: null});
    } else {
      // material_animations: pode ter várias (in/out/loop).
      const anims = (hit.mat['animations'] as AnyMat[]) ?? [];
      for (const a of anims) {
        const type = String(a['type'] ?? 'in');
        const kind = type === 'out' ? 'anim_out' : type === 'loop' ? 'anim_loop' : 'anim_in';
        out.effects.push({
          name: String(a['name'] ?? type),
          kind,
          intensity: null,
          frames: usToFrames(num(a, 'duration', 0), fps),
        });
      }
    }
  }
  return out;
};
