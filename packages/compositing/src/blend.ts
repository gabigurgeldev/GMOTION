/**
 * Blend modes tipados — nada de string solta.
 * Mapa 1:1 com os valores válidos de `mix-blend-mode`.
 */
export const blendModes = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const;

export type BlendMode = (typeof blendModes)[number];

/** Valida em runtime (útil pra dados vindos de JSON/IA). */
export const isBlendMode = (value: string): value is BlendMode => {
  return (blendModes as readonly string[]).includes(value);
};
