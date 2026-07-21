/**
 * Helpers matemáticos puros usados pelos presets.
 * Todos determinísticos — mesma entrada, mesma saída, sempre.
 */

/** Interpolação linear entre a e b. */
export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t;

/** Restringe v ao intervalo [min, max]. */
export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** Remapeia v de [inMin, inMax] para [0, 1], com clamp. */
export const normalize = (v: number, inMin: number, inMax: number): number => {
  if (inMin === inMax) {
    return 0;
  }
  return clamp((v - inMin) / (inMax - inMin), 0, 1);
};

/**
 * Ruído determinístico 1D baseado em seed — substituto de Math.random()
 * para efeitos tipo shake. Mesma (seed, x) => mesmo valor em [-1, 1].
 */
export const seededNoise = (seed: number, x: number): number => {
  const s = Math.sin(seed * 127.1 + x * 311.7) * 43758.5453123;
  return (s - Math.floor(s)) * 2 - 1;
};
