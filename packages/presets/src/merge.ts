import type {PresetStyle} from './types';

/**
 * Combina vários estilos de preset em um só:
 * - transforms concatenam (ordem importa: primeiro da lista aplica primeiro)
 * - opacities multiplicam
 * - filters concatenam
 */
export const mergePresetStyles = (
  ...styles: (PresetStyle | undefined)[]
): PresetStyle => {
  const transforms: string[] = [];
  const filters: string[] = [];
  let opacity = 1;
  let hasOpacity = false;

  for (const s of styles) {
    if (!s) {
      continue;
    }
    if (s.transform) {
      transforms.push(s.transform);
    }
    if (s.filter) {
      filters.push(s.filter);
    }
    if (s.opacity !== undefined) {
      opacity *= s.opacity;
      hasOpacity = true;
    }
  }

  return {
    ...(transforms.length > 0 ? {transform: transforms.join(' ')} : {}),
    ...(filters.length > 0 ? {filter: filters.join(' ')} : {}),
    ...(hasOpacity ? {opacity} : {}),
  };
};
