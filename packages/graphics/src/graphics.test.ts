import {describe, expect, it} from 'vitest';
import {barProgress, counterValue, formatCounter, strokeDrawOffset} from './calc';

describe('counterValue', () => {
  it('frame 0: from; frame final: to', () => {
    expect(counterValue({frame: 0, durationInFrames: 45, to: 100})).toBe(0);
    expect(counterValue({frame: 45, durationInFrames: 45, to: 100})).toBeCloseTo(100);
  });

  it('respeita from e startFrame', () => {
    expect(
      counterValue({frame: 5, durationInFrames: 30, from: 50, to: 100, startFrame: 10}),
    ).toBe(50);
    expect(
      counterValue({frame: 40, durationInFrames: 30, from: 50, to: 100, startFrame: 10}),
    ).toBeCloseTo(100);
  });

  it('não passa do alvo em frames altos', () => {
    expect(counterValue({frame: 500, durationInFrames: 45, to: 77})).toBeCloseTo(77);
  });

  it('easing linear: metade do caminho na metade do tempo', () => {
    expect(
      counterValue({frame: 15, durationInFrames: 30, to: 100, easing: 'linear'}),
    ).toBeCloseTo(50);
  });
});

describe('formatCounter', () => {
  it('separador de milhar pt-BR', () => {
    expect(formatCounter(1234567)).toBe('1.234.567');
  });

  it('decimais com vírgula', () => {
    expect(formatCounter(1234.56, {decimals: 1})).toBe('1.234,6');
  });

  it('prefixo e sufixo', () => {
    expect(formatCounter(99.9, {decimals: 1, suffix: '%'})).toBe('99,9%');
    expect(formatCounter(15000, {prefix: 'R$ '})).toBe('R$ 15.000');
  });

  it('negativo mantém sinal antes do agrupamento', () => {
    expect(formatCounter(-1234)).toBe('-1.234');
  });

  it('estilo en-US configurável', () => {
    expect(
      formatCounter(1234.5, {decimals: 1, separator: ',', decimalSeparator: '.'}),
    ).toBe('1,234.5');
  });
});

describe('strokeDrawOffset', () => {
  it('frame 0: offset total (nada desenhado); fim: 0 (tudo)', () => {
    expect(
      strokeDrawOffset({frame: 0, durationInFrames: 18, pathLength: 500}),
    ).toBe(500);
    expect(
      strokeDrawOffset({frame: 18, durationInFrames: 18, pathLength: 500}),
    ).toBeCloseTo(0);
  });

  it('monotônico decrescente', () => {
    let prev = Infinity;
    for (const frame of [0, 4, 9, 14, 18]) {
      const off = strokeDrawOffset({frame, durationInFrames: 18, pathLength: 500});
      expect(off).toBeLessThanOrEqual(prev);
      prev = off;
    }
  });
});

describe('barProgress', () => {
  it('0 no início, target no fim', () => {
    expect(barProgress({frame: 0, durationInFrames: 40, target: 0.85})).toBe(0);
    expect(barProgress({frame: 40, durationInFrames: 40, target: 0.85})).toBeCloseTo(0.85);
  });

  it('target clampado a [0,1]', () => {
    expect(barProgress({frame: 40, durationInFrames: 40, target: 1.5})).toBeCloseTo(1);
    expect(barProgress({frame: 40, durationInFrames: 40, target: -0.5})).toBe(0);
  });
});
