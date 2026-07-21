export {
  orbitPosition,
  particleState,
  floatOffset,
  type Vec3,
  type ParticleState,
} from './calc';

export {
  GmotionThreeScene,
  DefaultLights,
  type GmotionThreeSceneProps,
} from './GmotionThreeScene';
export {OrbitingCamera, type OrbitingCameraProps} from './OrbitingCamera';
export {
  ExtrudedText,
  type ExtrudedTextProps,
  type ExtrudedTextMaterial,
} from './ExtrudedText';
export {Particles, type ParticlesProps} from './Particles';
export {FloatingImage, type FloatingImageProps} from './FloatingImage';
export {GltfModel, type GltfModelProps} from './GltfModel';

/** Catálogo — consumido pelo ai-director (Fase 8). */
export const allThreeSceneNames = [
  'extruded-text',
  'particles',
  'floating-image',
  'gltf-model',
] as const;

export type ThreeSceneName = (typeof allThreeSceneNames)[number];
