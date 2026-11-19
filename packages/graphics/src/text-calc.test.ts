import {describe, expect, it} from 'vitest';
import {pathTextOffset, runDelay, splitUnits, staggerDelay} from './text-calc';
import {strokeDrawOffset} from './calc';

describe('splitUnits', () => {
  it('chars: espaço não anima mas preserva layout', () => {
    const units = splitUnits('ab c', 'chars');
    expect(units.map((u) => u.text)).toEqual(['a', 'b', ' ', 'c']);
    expect(units.map((u) => u.animIndex)).toEqual([0, 1, -1, 2]);
    expect(units[2]?.isSpace).toBe(true);
  });

  it('words: palavras e espaços separados', () => {
    const units = splitUnits('Cortar seus Vídeos', 'words');
    expect(units.map((u) => u.text)).toEqual(['Cortar', ' ', 'seus', ' ', 'Vídeos']);
    expect(units.filter((u) => !u.isSpace).map((u) => u.animIndex)).toEqual([0, 1, 2]);
  });

  it('string vazia → sem unidades', () => {
    expect(splitUnits('', 'chars')).toEqual([]);
    expect(splitUnits('', 'words')).toEqual([]);
  });
});

describe('staggerDelay / runDelay', () => {
  it('stagger linear, espaço (animIndex -1) sem delay negativo', () => {
    expect(staggerDelay(0, 3)).toBe(0);
    expect(staggerDelay(4, 3)).toBe(12);
    expect(staggerDelay(-1, 3)).toBe(0);
  });

  it('runDelay: explícito vence stagger', () => {
    expect(runDelay(2, 6)).toBe(12);
    expect(runDelay(2, 6, 40)).toBe(40);
    expect(runDelay(2, 6, 0)).toBe(0);
  });
});

describe('pathTextOffset', () => {
  it('frame 0 = from, frame final = to', () => {
    const params = {durationInFrames: 30, from: 0, to: 40} as const;
    expect(pathTextOffset({frame: 0, ...params})).toBe(0);
    expect(pathTextOffset({frame: 30, ...params})).toBe(40);
    expect(pathTextOffset({frame: 999, ...params})).toBe(40); // clampa após o fim
  });

  it('durationInFrames 0 = estático em to', () => {
    expect(pathTextOffset({frame: 0, durationInFrames: 0, from: 10, to: 25})).toBe(25);
  });
});

describe('strokeDrawOffset (AnimatedStroke)', () => {
  it('frame 0 = traço todo escondido, frame final = desenhado', () => {
    const params = {durationInFrames: 45, pathLength: 1000} as const;
    expect(strokeDrawOffset({frame: 0, ...params})).toBe(1000);
    expect(strokeDrawOffset({frame: 45, ...params})).toBe(0);
    expect(strokeDrawOffset({frame: 100, ...params})).toBe(0);
  });

  it('startFrame adia o início', () => {
    expect(strokeDrawOffset({frame: 5, durationInFrames: 45, pathLength: 1000, startFrame: 10})).toBe(1000);
  });
});
