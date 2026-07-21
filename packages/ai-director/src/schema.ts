import {z} from 'zod';
import {allPresetNames} from '@gmotion/presets';
import {allTransitionNames} from '@gmotion/transitions';

/**
 * Schema JSON da "timeline abstrata" — o que a IA gera.
 * Mais fácil o modelo emitir JSON estruturado do que TSX direto;
 * o compilador (compiler.tsx) transforma isso em componentes Remotion.
 */

const asEnum = (values: readonly string[]) =>
  z.enum(values as [string, ...string[]]);

export const enterPresetEnum = asEnum(allPresetNames.enter);
export const loopPresetEnum = asEnum(allPresetNames.loop);
export const exitPresetEnum = asEnum(allPresetNames.exit);
export const transitionEnum = asEnum(allTransitionNames);
export const directionEnum = z.enum(['left', 'right', 'up', 'down']);

/** Posição em % da composição (50/50 = centro). */
const positionSchema = z
  .object({
    x: z.number().describe('Percent 0-100, 50 = center'),
    y: z.number().describe('Percent 0-100, 50 = center'),
  })
  .describe('Position as percent of composition, anchored at element center');

/** Campos de animação comuns a todas as camadas. */
const animFields = {
  enter: enterPresetEnum.nullish().describe('Enter preset name'),
  enterFrames: z.number().int().nullish().describe('Enter duration in frames (default 15)'),
  enterDirection: directionEnum.nullish().describe('Direction for slide-in'),
  exit: exitPresetEnum.nullish().describe('Exit preset name'),
  exitFrames: z.number().int().nullish().describe('Exit duration in frames (default 10)'),
  exitDirection: directionEnum.nullish().describe('Direction for slide-out'),
  loop: loopPresetEnum.nullish().describe('Continuous emphasis preset'),
  startFrame: z.number().int().nullish().describe('Frame within the scene when the layer appears (default 0)'),
  durationInFrames: z.number().int().nullish().describe('Layer duration (default: until scene end)'),
  position: positionSchema.nullish(),
};

export const textLayerSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  fontSize: z.number().nullish().describe('Default 90'),
  color: z.string().nullish().describe('CSS color, default white'),
  fontWeight: z.number().nullish().describe('Default 900'),
  ...animFields,
});

export const imageLayerSchema = z.object({
  type: z.literal('image'),
  src: z.string().describe('Image URL'),
  width: z.number().nullish().describe('Width in px, default 600'),
  borderRadius: z.number().nullish(),
  ...animFields,
});

export const shapeLayerSchema = z.object({
  type: z.literal('shape'),
  shape: z.enum(['rect', 'circle']),
  color: z.string().nullish(),
  gradient: z.array(z.string()).nullish().describe('Two CSS colors'),
  width: z.number().describe('px'),
  height: z.number().describe('px'),
  borderRadius: z.number().nullish(),
  ...animFields,
});

export const counterLayerSchema = z.object({
  type: z.literal('counter'),
  to: z.number(),
  from: z.number().nullish(),
  prefix: z.string().nullish(),
  suffix: z.string().nullish(),
  decimals: z.number().int().nullish(),
  countFrames: z.number().int().nullish().describe('Frames to reach target, default 45'),
  fontSize: z.number().nullish().describe('Default 120'),
  color: z.string().nullish(),
  ...animFields,
});

export const progressBarLayerSchema = z.object({
  type: z.literal('progress-bar'),
  target: z.number().describe('0 to 1'),
  width: z.number().nullish(),
  height: z.number().nullish(),
  gradient: z.array(z.string()).nullish(),
  color: z.string().nullish(),
  ...animFields,
});

export const badgeLayerSchema = z.object({
  type: z.literal('badge'),
  text: z.string(),
  borderColors: z.array(z.string()).nullish().describe('Two CSS colors'),
  fontSize: z.number().nullish(),
  ...animFields,
});

export const lowerThirdLayerSchema = z.object({
  type: z.literal('lower-third'),
  name: z.string(),
  role: z.string().nullish(),
  accentColor: z.string().nullish(),
  ...animFields,
});

export const typewriterLayerSchema = z.object({
  type: z.literal('typewriter'),
  text: z.string(),
  charsPerSecond: z.number().nullish().describe('Default 20'),
  fontSize: z.number().nullish().describe('Default 60'),
  color: z.string().nullish(),
  ...animFields,
});

export const layerSchema = z.discriminatedUnion('type', [
  textLayerSchema,
  imageLayerSchema,
  shapeLayerSchema,
  counterLayerSchema,
  progressBarLayerSchema,
  badgeLayerSchema,
  lowerThirdLayerSchema,
  typewriterLayerSchema,
]);

export const sceneSchema = z.object({
  id: z.string().nullish().describe('Optional label for refinement edits'),
  durationInFrames: z.number().int().positive(),
  background: z
    .object({
      color: z.string().nullish(),
      gradient: z.array(z.string()).nullish().describe('Two CSS colors'),
      angle: z.number().nullish().describe('Gradient angle deg, default 160'),
    })
    .nullish(),
  layers: z.array(layerSchema),
});

export const transitionSpecSchema = z.object({
  after: z.number().int().min(0).describe('Index of the scene this transition follows'),
  transitionType: transitionEnum,
  durationInFrames: z.number().int().nullish().describe('Default 12'),
  direction: directionEnum.nullish(),
});

export const effectSpecSchema = z.object({
  effectType: z.enum([
    'film-grain',
    'vignette',
    'light-leaks',
    'screen-shake',
    'rgb-shift',
    'chromatic-aberration',
  ]),
  intensity: z.number().nullish().describe('Effect-specific strength'),
});

export const timelineSchema = z.object({
  fps: z.number().int().describe('Use 30 unless told otherwise'),
  width: z.number().int().describe('1080 for vertical'),
  height: z.number().int().describe('1920 for vertical'),
  scenes: z.array(sceneSchema).min(1),
  transitions: z.array(transitionSpecSchema).nullish(),
  effects: z.array(effectSpecSchema).nullish().describe('Global overlays/wrappers'),
});

export type TimelineSchema = z.infer<typeof timelineSchema>;
export type SceneSpec = z.infer<typeof sceneSchema>;
export type LayerSpec = z.infer<typeof layerSchema>;
export type TransitionSpec = z.infer<typeof transitionSpecSchema>;
export type EffectSpec = z.infer<typeof effectSpecSchema>;

/** Valida JSON cru; lança com mensagem legível. */
export const parseTimeline = (data: unknown): TimelineSchema => {
  const result = timelineSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Timeline inválida: ${result.error.message}`);
  }
  return result.data;
};

/** Duração total: soma das cenas menos overlap das transições. */
export const timelineDuration = (timeline: TimelineSchema): number => {
  const scenes = timeline.scenes.reduce((sum, s) => sum + s.durationInFrames, 0);
  const overlap = (timeline.transitions ?? []).reduce(
    (sum, t) => sum + (t.durationInFrames ?? 12),
    0,
  );
  return scenes - overlap;
};
