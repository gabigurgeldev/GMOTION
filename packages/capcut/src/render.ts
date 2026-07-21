/**
 * Entry BROWSER-SAFE — só render + schema (sem node:fs).
 * O Remotion Studio/render importa daqui (`@gmotion/capcut/render`); o entry
 * principal (`@gmotion/capcut`) tem os módulos Node (reader/export/cli/bake).
 */
export * from './timeline/schema';
export {capcutToComposition, CapcutComposition} from './render/compose';
export {CapcutClip, CAPCUT_FONT_SIZE_TO_PX} from './render/CapcutClip';
export {renderNative} from './render/native';
export {resolveTransformAtFrame, toCssTransform, type Canvas} from './render/transform';
export {maskToCss, videoEffectsToFilter, animEnvelope, hasEffects} from './render/apply-effects';
