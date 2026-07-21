import {allPresetNames} from '@gmotion/presets';
import {allTransitionNames} from '@gmotion/transitions';
import {allEffectNames} from '@gmotion/effects';
import {allGraphicNames} from '@gmotion/graphics';
import {allTemplateNames} from '@gmotion/templates';

/**
 * Catálogo dinâmico do que os pacotes expõem — vira contexto para a IA.
 * Cresce sozinho quando novos presets/efeitos são registrados.
 */
export const buildCatalog = () => ({
  presets: allPresetNames,
  transitions: allTransitionNames,
  effects: allEffectNames,
  graphics: allGraphicNames,
  templates: allTemplateNames,
});

export type Catalog = ReturnType<typeof buildCatalog>;

export const catalogAsText = (catalog: Catalog = buildCatalog()): string =>
  [
    `Enter presets: ${catalog.presets.enter.join(', ')}`,
    `Loop/emphasis presets: ${catalog.presets.loop.join(', ')}`,
    `Exit presets: ${catalog.presets.exit.join(', ')}`,
    `Scene transitions: ${catalog.transitions.join(', ')}`,
    `Global effects: film-grain, vignette, light-leaks (overlays); screen-shake, rgb-shift, chromatic-aberration (wrappers)`,
    `Layer types: text, image, shape, counter, progress-bar, badge, lower-third, typewriter`,
  ].join('\n');
