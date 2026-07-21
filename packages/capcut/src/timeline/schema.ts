import {z} from 'zod';

/**
 * Modelo de timeline TRACK-BASED do Gmotion — espelha o CapCut (tempo absoluto,
 * clips sobrepostos em tracks empilhadas), diferente do schema cena-a-cena que a
 * IA usa. Tempo em FRAMES; posição em PIXELS (centro do elemento).
 */

export const transformSchema = z.object({
  scaleX: z.number().default(1),
  scaleY: z.number().default(1),
  rotation: z.number().default(0), // graus
  posX: z.number(), // px, centro do elemento
  posY: z.number(), // px, centro do elemento
  alpha: z.number().default(1),
  flipH: z.boolean().default(false),
  flipV: z.boolean().default(false),
});

export const keyPointSchema = z.object({
  frame: z.number(),
  value: z.number(),
  outHandle: z.object({x: z.number(), y: z.number()}).optional(),
  inHandle: z.object({x: z.number(), y: z.number()}).optional(),
});

export const keyframeTrackSchema = z.object({
  property: z.string(), // posX | posY | scaleX | scaleY | rotation | alpha | volume
  points: z.array(keyPointSchema),
});

/** Máscara do CapCut mapeada para render CSS best-effort. */
export const maskSchema = z.object({
  kind: z.enum(['circle', 'rect', 'linear']),
  centerX: z.number().default(0.5), // 0..1 relativo ao clip
  centerY: z.number().default(0.5),
  width: z.number().default(1),
  height: z.number().default(1),
  rotation: z.number().default(0),
  feather: z.number().default(0),
  invert: z.boolean().default(false),
});

/** Chroma key (best-effort). */
export const chromaSchema = z.object({
  color: z.string(),
  intensity: z.number().default(0.5),
  shadow: z.number().default(0),
});

/** Efeito/animação nativa do CapCut resolvido do draft. */
export const capEffectSchema = z.object({
  name: z.string(),
  kind: z.enum(['video_effect', 'anim_in', 'anim_out', 'anim_loop']).default('video_effect'),
  intensity: z.number().nullish(),
  /** Frames de duração da animação (anim_in/out/loop). */
  frames: z.number().int().nullish(),
});

const clipBase = {
  id: z.string(),
  start: z.number().int(), // frame de início na timeline
  duration: z.number().int().positive(), // frames
  sourceStart: z.number().int().default(0), // frame inicial dentro da mídia
  transform: transformSchema,
  keyframes: z.array(keyframeTrackSchema).default([]),
  mask: maskSchema.nullish(),
  chroma: chromaSchema.nullish(),
  effects: z.array(capEffectSchema).default([]),
};

export const videoClipSchema = z.object({
  kind: z.literal('video'),
  src: z.string(), // caminho absoluto resolvido
  volume: z.number().default(1),
  ...clipBase,
});

export const imageClipSchema = z.object({
  kind: z.literal('image'),
  src: z.string(),
  ...clipBase,
});

export const audioClipSchema = z.object({
  kind: z.literal('audio'),
  src: z.string(),
  volume: z.number().default(1),
  ...clipBase,
});

export const textClipSchema = z.object({
  kind: z.literal('text'),
  text: z.string(),
  color: z.string().default('#ffffff'),
  fontSize: z.number().default(60),
  fontPath: z.string().nullish(),
  ...clipBase,
});

/** Clip "nativo" do Gmotion: o que o CapCut NÃO faz (3D/shader/partícula). */
export const nativeClipSchema = z.object({
  kind: z.literal('native'),
  native: z.enum(['three', 'shader', 'particle']),
  component: z.string(), // nome no catálogo (ex.: 'extruded-text', 'particles', 'glow')
  props: z.record(z.string(), z.unknown()).default({}),
  ...clipBase,
});

export const clipSchema = z.discriminatedUnion('kind', [
  videoClipSchema,
  imageClipSchema,
  audioClipSchema,
  textClipSchema,
  nativeClipSchema,
]);

export const capTrackSchema = z.object({
  id: z.string(),
  type: z.enum(['video', 'audio', 'text', 'sticker', 'effect', 'filter']),
  renderIndex: z.number().int().default(0),
  clips: z.array(clipSchema),
});

export const capcutTimelineSchema = z.object({
  fps: z.number().int().default(30),
  width: z.number().int().default(1080),
  height: z.number().int().default(1920),
  durationInFrames: z.number().int().positive(),
  tracks: z.array(capTrackSchema),
});

export type Transform = z.infer<typeof transformSchema>;
export type KeyframeTrackSpec = z.infer<typeof keyframeTrackSchema>;
export type MaskSpec = z.infer<typeof maskSchema>;
export type ChromaSpec = z.infer<typeof chromaSchema>;
export type CapEffectSpec = z.infer<typeof capEffectSchema>;
export type ClipSpec = z.infer<typeof clipSchema>;
export type CapTrack = z.infer<typeof capTrackSchema>;
export type CapcutTimeline = z.infer<typeof capcutTimelineSchema>;

export const parseCapcutTimeline = (data: unknown): CapcutTimeline => {
  const r = capcutTimelineSchema.safeParse(data);
  if (!r.success) {
    throw new Error(`CapcutTimeline inválida: ${r.error.message}`);
  }
  return r.data;
};
