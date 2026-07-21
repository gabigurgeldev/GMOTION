import type {
  Clip,
  CommonKeyframe,
  DraftContent,
  Materials,
  Segment,
  TimeRange,
  Track,
  TrackType,
} from './types';

/**
 * Builders de um `draft_content.json` mínimo porém estruturalmente válido para
 * o CapCut. Preenche os campos que o app espera com defaults sensatos; o
 * exporter (timeline/export.ts) injeta materiais/tracks/segments reais.
 */

let counter = 0;
/** UUID pseudo-determinístico só para ids de export (não precisa ser real). */
export const genId = (seed = 'X'): string => {
  counter += 1;
  const h = (n: number) => n.toString(16).toUpperCase().padStart(4, '0');
  const a = h((counter * 40503) & 0xffff);
  const b = h((counter * 12289) & 0xffff);
  return `${seed}${a}-${b}-4${a.slice(1)}-8${b.slice(1)}-${a}${b}${a}`;
};

export const timerange = (start: number, duration: number): TimeRange => ({
  start,
  duration,
});

export const defaultClip = (): Clip => ({
  scale: {x: 1, y: 1},
  rotation: 0,
  transform: {x: 0, y: 0},
  flip: {horizontal: false, vertical: false},
  alpha: 1,
});

/** Materials em construção (arrays soltos); vira Materials no draft final. */
export type ExportMaterials = Record<string, unknown[]>;

export const emptyMaterials = (): ExportMaterials => ({
  videos: [],
  audios: [],
  texts: [],
  stickers: [],
  effects: [],
  transitions: [],
  canvases: [],
  material_animations: [],
  common_mask: [],
  chromas: [],
  video_effects: [],
  speeds: [],
  placeholders: [],
  sound_channel_mappings: [],
  vocal_separations: [],
});

export const makeVideoEffectMaterial = (id: string, name: string): Record<string, unknown> => ({
  id,
  type: 'video_effect',
  name,
  effect_id: '',
  resource_id: '',
  apply_target_type: 2,
});

export const makeMaskMaterial = (id: string, kind: string): Record<string, unknown> => ({
  id,
  type: 'mask',
  name: kind,
  resource_id: '',
  config: {},
});

export const makeChromaMaterial = (id: string, color: string, intensity: number): Record<string, unknown> => ({
  id,
  type: 'chroma',
  color,
  intensity_value: intensity,
  shadow_value: 0,
});

export const makeAnimationMaterial = (
  id: string,
  anims: {type: string; duration: number}[],
): Record<string, unknown> => ({
  id,
  type: 'sticker_animation',
  animations: anims.map((a) => ({type: a.type, duration: a.duration, start: 0, name: a.type})),
  multi_language_current: 'none',
});

export const makeVideoMaterial = (
  id: string,
  path: string,
  width: number,
  height: number,
  duration: number,
  isImage: boolean,
): Record<string, unknown> => ({
  id,
  type: isImage ? 'photo' : 'video',
  path,
  material_name: path.split(/[/\\]/).pop() ?? '',
  width,
  height,
  duration,
  has_audio: !isImage,
  crop: {
    upper_left_x: 0, upper_left_y: 0,
    upper_right_x: 1, upper_right_y: 0,
    lower_left_x: 0, lower_left_y: 1,
    lower_right_x: 1, lower_right_y: 1,
  },
  crop_ratio: 'free',
  crop_scale: 1,
});

export const makeAudioMaterial = (
  id: string,
  path: string,
  duration: number,
): Record<string, unknown> => ({
  id,
  type: 'extract_music',
  path,
  name: path.split(/[/\\]/).pop() ?? '',
  duration,
});

export const makeTextMaterial = (
  id: string,
  content: string,
): Record<string, unknown> => ({
  id,
  type: 'text',
  content,
  font_size: 15,
  alignment: 1,
  letter_spacing: 0,
  line_spacing: 0,
});

export const makeSegment = (args: {
  id: string;
  material_id: string;
  target: TimeRange;
  source: TimeRange | null;
  render_index: number;
  clip?: Clip;
  extra_material_refs?: string[];
  keyframes?: CommonKeyframe[];
  volume?: number;
}): Segment => ({
  id: args.id,
  material_id: args.material_id,
  extra_material_refs: args.extra_material_refs ?? [],
  target_timerange: args.target,
  source_timerange: args.source,
  render_index: args.render_index,
  clip: args.clip ?? defaultClip(),
  visible: true,
  volume: args.volume ?? 1,
  speed: 1,
  common_keyframes: args.keyframes ?? [],
  enable_adjust: true,
  uniform_scale: {on: true, value: 1},
});

export const makeTrack = (
  id: string,
  type: TrackType,
  segments: Segment[],
): Track => ({
  id,
  type,
  attribute: 0,
  flag: 0,
  segments,
});

export const makeDraftContent = (args: {
  id: string;
  fps: number;
  width: number;
  height: number;
  duration: number;
  tracks: Track[];
  materials: ExportMaterials;
}): DraftContent => ({
  id: args.id,
  version: 360000,
  new_version: '176.0.0',
  name: '',
  duration: args.duration,
  create_time: 0,
  update_time: 0,
  fps: args.fps,
  canvas_config: {
    width: args.width,
    height: args.height,
    ratio: 'original',
    background: null,
  },
  config: {},
  tracks: args.tracks,
  materials: args.materials as unknown as Materials,
  keyframes: {
    videos: [], audios: [], texts: [], stickers: [],
    filters: [], adjusts: [], handwrites: [], effects: [],
  },
  platform: {},
  color_space: 0,
  draft_type: 'video',
  source: 'default',
});
