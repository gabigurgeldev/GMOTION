// Draft (formato interno CapCut)
export * from './draft/types';
export {
  loadDraft,
  loadSubdraft,
  compoundClipMaterials,
  resolvePlaceholder,
  type NormalizedDraft,
} from './draft/reader';

// Conversores
export * from './convert/units';
export * from './convert/keyframes';

// Timeline track-based do Gmotion
export * from './timeline/schema';
export {parseTextContent, capcutColorFromContent, buildTextContent} from './timeline/text';
export {resolveClipEffects, type ClipEffectFields} from './timeline/effects';
export {capcutToTimeline, draftToTimeline} from './timeline/import';
export {maskToCss, videoEffectsToFilter, animEnvelope, hasEffects} from './render/apply-effects';
export {externalizeAssets} from './timeline/assets';
export {
  attachNativeLayers,
  makeNativeClip,
  collectNativeClips,
  type NativeClipInput,
} from './timeline/native-attach';
export {exportTimeline, EXPORT_PLACEHOLDER, type ExportResult} from './timeline/export';
export {
  emptyTimeline,
  fromDraft,
  addTrack,
  addClip,
  imageClip,
  textClip,
  trim,
  withNativeLayers,
  addEffectToTrack,
  type TimelineOpts,
} from './timeline/author';

// Render (Remotion)
export {resolveTransformAtFrame, toCssTransform, type Canvas} from './render/transform';
export {CapcutClip, CAPCUT_FONT_SIZE_TO_PX} from './render/CapcutClip';
export {capcutToComposition, CapcutComposition} from './render/compose';
export {renderNative} from './render/native';
