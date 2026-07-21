/**
 * Tipos do formato interno do CapCut/JianYing (`draft_content.json` e
 * `draft_meta_info.json`). Cobrem os campos que a ponte lê/escreve; o resto do
 * JSON é preservado via index signature para não perder dados no roundtrip.
 *
 * Convenção de tempo: TUDO em microssegundos (µs). 1 s = 1_000_000 µs.
 */

/** Passthrough: qualquer campo extra do CapCut é mantido intacto. */
export type Extra = Record<string, unknown>;

export interface TimeRange {
  start: number; // µs
  duration: number; // µs
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Flip {
  horizontal: boolean;
  vertical: boolean;
}

/** `segment.clip` — transform visual do clip no canvas. */
export interface Clip {
  scale: Vec2; // relativo (1 = tamanho nativo ajustado ao canvas)
  rotation: number; // graus
  transform: Vec2; // posição normalizada (ver convert/units.ts)
  flip: Flip;
  alpha: number; // 0..1
  [k: string]: unknown;
}

/** Ponto de controle bézier de um keyframe. */
export interface KeyframeControl {
  x: number;
  y: number;
}

export interface Keyframe {
  id: string;
  /** Offset em µs relativo ao início do segmento. */
  time_offset: number;
  values: number[];
  left_control: KeyframeControl;
  right_control: KeyframeControl;
  curveType?: string;
  string_value?: string;
  graphID?: string;
  [k: string]: unknown;
}

/** Ex.: `KFTypeScaleX`, `KFTypePositionX`, `KFTypeAlpha`, `KFTypeRotation`. */
export type KeyframePropertyType = string;

export interface CommonKeyframe {
  id: string;
  material_id: string;
  property_type: KeyframePropertyType;
  keyframe_list: Keyframe[];
  [k: string]: unknown;
}

export interface Segment {
  id: string;
  material_id: string;
  extra_material_refs: string[];
  target_timerange: TimeRange;
  source_timerange: TimeRange | null;
  render_index: number;
  clip?: Clip;
  visible?: boolean;
  volume?: number;
  speed?: number;
  common_keyframes?: CommonKeyframe[];
  group_id?: string;
  [k: string]: unknown;
}

export type TrackType =
  | 'video'
  | 'audio'
  | 'text'
  | 'sticker'
  | 'effect'
  | 'filter';

export interface Track {
  id: string;
  type: TrackType;
  attribute?: number;
  segments: Segment[];
  [k: string]: unknown;
}

/** Material de vídeo/imagem (`materials.videos[]`; imagem tem `type: "photo"`). */
export interface VideoMaterial {
  id: string;
  type: string; // "video" | "photo"
  path: string;
  material_name?: string;
  width: number;
  height: number;
  duration: number; // µs
  has_audio?: boolean;
  [k: string]: unknown;
}

export interface AudioMaterial {
  id: string;
  type: string;
  path: string;
  name?: string;
  duration: number; // µs
  [k: string]: unknown;
}

/** `materials.texts[]` — `content` é uma STRING JSON (ver TextContent). */
export interface TextMaterial {
  id: string;
  type: string;
  content: string;
  font_size?: number;
  text_color?: string;
  [k: string]: unknown;
}

/** Forma do JSON dentro de `TextMaterial.content`. */
export interface TextContent {
  text: string;
  styles: TextStyle[];
}

export interface TextStyle {
  fill?: {
    content?: {
      render_type?: string;
      solid?: { color: [number, number, number] }; // 0..1
    };
  };
  font?: { path?: string; id?: string };
  size?: number;
  range?: [number, number];
  [k: string]: unknown;
}

/** Materiais indexados por tipo. Só tipamos os usados; resto é passthrough. */
export interface Materials {
  videos: VideoMaterial[];
  audios: AudioMaterial[];
  texts: TextMaterial[];
  [k: string]: unknown[];
}

export interface CanvasConfig {
  width: number;
  height: number;
  ratio: string;
  background: unknown;
  [k: string]: unknown;
}

export interface DraftContent {
  id: string;
  duration: number; // µs
  fps: number;
  canvas_config: CanvasConfig;
  tracks: Track[];
  materials: Materials;
  [k: string]: unknown;
}

/** Item dentro de `draft_meta_info.draft_materials[].value[]`. */
export interface MetaMaterialItem {
  id?: string;
  file_Path?: string;
  path?: string;
  metetype?: string;
  [k: string]: unknown;
}

export interface MetaMaterialGroup {
  type: number;
  value: MetaMaterialItem[];
  [k: string]: unknown;
}

export interface DraftMetaInfo {
  draft_fold_path?: string;
  draft_root_path?: string;
  draft_id?: string;
  draft_materials: MetaMaterialGroup[];
  [k: string]: unknown;
}
