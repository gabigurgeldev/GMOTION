import {describe, expect, it} from 'vitest';
import {calcEnterExit} from './enter-exit';
import {clamp, lerp, normalize, seededNoise} from './math';

describe('calcEnterExit', () => {
  const base = {durationInFrames: 60, enterFrames: 15, exitFrames: 10};

  it('frame 0: entrada em 0, saída em 1', () => {
    const r = calcEnterExit({...base, frame: 0});
    expect(r.enter).toBe(0);
    expect(r.exit).toBe(1);
    expect(r.combined).toBe(0);
  });

  it('meio da entrada: progresso proporcional', () => {
    const r = calcEnterExit({...base, frame: 7.5});
    expect(r.enter).toBeCloseTo(0.5);
    expect(r.exit).toBe(1);
  });

  it('meio da camada: tudo estável em 1', () => {
    const r = calcEnterExit({...base, frame: 30});
    expect(r.enter).toBe(1);
    expect(r.exit).toBe(1);
    expect(r.combined).toBe(1);
  });

  it('frame final: saída em 0', () => {
    const r = calcEnterExit({...base, frame: 60});
    expect(r.enter).toBe(1);
    expect(r.exit).toBe(0);
    expect(r.combined).toBe(0);
  });

  it('sem exitFrames: saída sempre 1', () => {
    const r = calcEnterExit({
      frame: 60,
      durationInFrames: 60,
      enterFrames: 15,
    });
    expect(r.exit).toBe(1);
    expect(r.combined).toBe(1);
  });

  it('enterFrames 0: entrada imediata', () => {
    const r = calcEnterExit({
      frame: 0,
      durationInFrames: 60,
      enterFrames: 0,
    });
    expect(r.enter).toBe(1);
  });

  it('duração inválida lança erro', () => {
    expect(() =>
      calcEnterExit({frame: 0, durationInFrames: 0, enterFrames: 10}),
    ).toThrow();
  });

  it('determinístico: mesma entrada, mesma saída', () => {
    const a = calcEnterExit({...base, frame: 42});
    const b = calcEnterExit({...base, frame: 42});
    expect(a).toEqual(b);
  });
});

describe('math helpers', () => {
  it('lerp interpola linearmente', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
  });

  it('clamp restringe ao intervalo', () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('normalize remapeia com clamp', () => {
    expect(normalize(15, 10, 20)).toBe(0.5);
    expect(normalize(5, 10, 20)).toBe(0);
    expect(normalize(25, 10, 20)).toBe(1);
    expect(normalize(5, 10, 10)).toBe(0);
  });

  it('seededNoise é determinístico e limitado a [-1, 1]', () => {
    const a = seededNoise(7, 42);
    const b = seededNoise(7, 42);
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(-1);
    expect(a).toBeLessThanOrEqual(1);
    expect(seededNoise(8, 42)).not.toBe(a);
  });
});
