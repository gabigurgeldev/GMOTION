import {describe, expect, it} from 'vitest';
import {byQuality, resolveQuality, scaledCount} from './quality';

describe('resolveQuality', () => {
  it('override explícito vence sempre', () => {
    expect(resolveQuality('high', false)).toBe('high');
    expect(resolveQuality('low', true)).toBe('low');
  });

  it('auto: low no preview, high no render', () => {
    expect(resolveQuality(undefined, false)).toBe('low');
    expect(resolveQuality(undefined, true)).toBe('high');
  });
});

describe('scaledCount', () => {
  it('high mantém, low corta pro fator (mínimo 1)', () => {
    expect(scaledCount(1000, 'high')).toBe(1000);
    expect(scaledCount(1000, 'low')).toBe(350);
    expect(scaledCount(2, 'low')).toBe(1);
    expect(scaledCount(100, 'low', 0.5)).toBe(50);
  });
});

describe('byQuality', () => {
  it('escolhe por qualidade', () => {
    expect(byQuality('low', 3, 8)).toBe(3);
    expect(byQuality('high', 3, 8)).toBe(8);
  });
});
