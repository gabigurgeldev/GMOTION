import {blurIn, fadeIn, glitchIn, popIn, slideIn, zoomInBounce} from './enter';
import {float, glowPulse, pulse, rotateLoop, shake} from './emphasis';
import {blurOut, fadeOut, shrinkOut, slideOut, zoomOut} from './exit';
import type {PresetFn} from './types';

/**
 * Registro central de presets por nome.
 * O ai-director (Fase 8) usa estas chaves como catálogo para a IA.
 */

export const enterPresets = {
  'fade-in': fadeIn,
  'slide-in': slideIn,
  'zoom-in-bounce': zoomInBounce,
  'blur-in': blurIn,
  'pop-in': popIn,
  'glitch-in': glitchIn,
} as const;

export const loopPresets = {
  pulse,
  shake,
  float,
  'rotate-loop': rotateLoop,
  'glow-pulse': glowPulse,
} as const;

export const exitPresets = {
  'fade-out': fadeOut,
  'slide-out': slideOut,
  'zoom-out': zoomOut,
  'blur-out': blurOut,
  'shrink-out': shrinkOut,
} as const;

export type EnterPresetName = keyof typeof enterPresets;
export type LoopPresetName = keyof typeof loopPresets;
export type ExitPresetName = keyof typeof exitPresets;

/** Factory genérica: cada preset aceita seu próprio objeto de opções. */
type AnyPresetFactory = (options?: never) => PresetFn;

/** Resolve preset por nome com opções não tipadas (uso interno do AnimatedLayer). */
export const resolvePreset = (
  registry: Record<string, AnyPresetFactory>,
  name: string,
  options?: object,
): PresetFn => {
  const factory = registry[name];
  if (!factory) {
    throw new Error(
      `Preset "${name}" não existe. Disponíveis: ${Object.keys(registry).join(', ')}`,
    );
  }
  return (factory as (options?: object) => PresetFn)(options);
};

/** Lista completa de nomes — consumida pelo ai-director para montar o catálogo. */
export const allPresetNames = {
  enter: Object.keys(enterPresets) as EnterPresetName[],
  loop: Object.keys(loopPresets) as LoopPresetName[],
  exit: Object.keys(exitPresets) as ExitPresetName[],
};
