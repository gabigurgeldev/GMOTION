export {
  timelineSchema,
  parseTimeline,
  timelineDuration,
  type TimelineSchema,
  type SceneSpec,
  type LayerSpec,
  type TransitionSpec,
  type EffectSpec,
} from './schema';
export {jsonToComposition, TimelineComposition} from './compiler';
export {buildCatalog, catalogAsText, type Catalog} from './catalog';
export {
  buildSystemPrompt,
  generateUserMessage,
  refineUserMessage,
} from './prompts';
