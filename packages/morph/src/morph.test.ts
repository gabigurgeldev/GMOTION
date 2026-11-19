import {describe, expect, it} from 'vitest';
import {morphPath, morphSequence, sequenceSegment} from './morph';

const SQUARE = 'M 10 10 L 90 10 L 90 90 L 10 90 Z';
const SQUARE_SHIFTED = 'M 20 10 L 100 10 L 100 90 L 20 90 Z';
const TRIANGLE = 'M 50 10 L 90 90 L 10 90 Z';

describe('morphPath', () => {
  it('progress 0 e 1 devolvem os paths originais exatos', () => {
    expect(morphPath(SQUARE, TRIANGLE, 0)).toBe(SQUARE);
    expect(morphPath(SQUARE, TRIANGLE, 1)).toBe(TRIANGLE);
  });

  it('clampa progress fora de 0-1', () => {
    expect(morphPath(SQUARE, TRIANGLE, -2)).toBe(SQUARE);
    expect(morphPath(SQUARE, TRIANGLE, 5)).toBe(TRIANGLE);
  });

  it('meio do morph de quadrado deslocado fica no meio do caminho', () => {
    const mid = morphPath(SQUARE, SQUARE_SHIFTED, 0.5);
    // Primeiro ponto deve estar em x=15 (entre 10 e 20).
    const match = mid.match(/M\s*([\d.]+)/);
    expect(match).not.toBeNull();
    expect(Number(match?.[1])).toBeCloseTo(15, 1);
  });

  it('determinístico: mesma entrada, mesma saída', () => {
    expect(morphPath(SQUARE, TRIANGLE, 0.37)).toBe(morphPath(SQUARE, TRIANGLE, 0.37));
  });
});

describe('sequenceSegment', () => {
  it('divide o progresso em N-1 segmentos iguais', () => {
    expect(sequenceSegment(3, 0)).toEqual({index: 0, local: 0});
    expect(sequenceSegment(3, 0.25)).toEqual({index: 0, local: 0.5});
    expect(sequenceSegment(3, 0.5)).toEqual({index: 1, local: 0});
    expect(sequenceSegment(3, 1)).toEqual({index: 1, local: 1});
  });

  it('2 paths = 1 segmento direto', () => {
    expect(sequenceSegment(2, 0.7)).toEqual({index: 0, local: 0.7});
  });
});

describe('morphSequence', () => {
  const paths = [SQUARE, TRIANGLE, SQUARE_SHIFTED];

  it('extremos exatos', () => {
    expect(morphSequence(paths, 0)).toBe(SQUARE);
    expect(morphSequence(paths, 1)).toBe(SQUARE_SHIFTED);
  });

  it('fronteira de segmento cai no shape intermediário', () => {
    expect(morphSequence(paths, 0.5)).toBe(TRIANGLE);
  });

  it('1 path só = sempre ele; vazio = string vazia', () => {
    expect(morphSequence([SQUARE], 0.5)).toBe(SQUARE);
    expect(morphSequence([], 0.5)).toBe('');
  });
});
