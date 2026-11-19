import {describe, expect, it} from 'vitest';
import {blendModes, isBlendMode} from './blend';

describe('blendModes', () => {
  it('contém os modos essenciais de mix-blend-mode', () => {
    for (const mode of ['normal', 'multiply', 'screen', 'overlay', 'difference']) {
      expect(blendModes).toContain(mode);
    }
  });

  it('isBlendMode valida strings de fora (JSON/IA)', () => {
    expect(isBlendMode('screen')).toBe(true);
    expect(isBlendMode('luminosity')).toBe(true);
    expect(isBlendMode('plus-lighter')).toBe(false);
    expect(isBlendMode('')).toBe(false);
    expect(isBlendMode('Screen')).toBe(false); // case-sensitive como o CSS
  });
});
