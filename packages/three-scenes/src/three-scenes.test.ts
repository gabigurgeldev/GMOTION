import {describe, expect, it} from 'vitest';
import {floatOffset, orbitPosition, particleState} from './calc';

describe('orbitPosition', () => {
  it('frame 0 sem phase: câmera em (0, height, radius)', () => {
    const p = orbitPosition({frame: 0, fps: 30, radius: 8, height: 2});
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBe(2);
    expect(p.z).toBeCloseTo(8);
  });

  it('meia volta: z inverte', () => {
    // speed 0.5 voltas/s a 30fps -> meia volta em 30 frames
    const p = orbitPosition({frame: 30, fps: 30, radius: 8, speed: 0.5});
    expect(p.x).toBeCloseTo(0, 5);
    expect(p.z).toBeCloseTo(-8, 5);
  });

  it('raio preservado em qualquer frame', () => {
    const p = orbitPosition({frame: 17, fps: 30, radius: 5, speed: 0.13});
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(5);
  });

  it('determinístico', () => {
    const a = orbitPosition({frame: 42, fps: 30, radius: 8, speed: 0.1});
    const b = orbitPosition({frame: 42, fps: 30, radius: 8, speed: 0.1});
    expect(a).toEqual(b);
  });
});

describe('particleState', () => {
  const base = {seed: 42, fps: 30, spread: 6};

  it('determinístico por (seed, index, frame)', () => {
    const a = particleState({...base, index: 3, frame: 100});
    const b = particleState({...base, index: 3, frame: 100});
    expect(a).toEqual(b);
  });

  it('índices diferentes: posições diferentes', () => {
    const a = particleState({...base, index: 1, frame: 0});
    const b = particleState({...base, index: 2, frame: 0});
    expect(a).not.toEqual(b);
  });

  it('y sempre dentro de [-spread, spread] (wrap)', () => {
    for (const frame of [0, 100, 1000, 10000]) {
      const p = particleState({...base, index: 5, frame});
      expect(p.y).toBeGreaterThanOrEqual(-6);
      expect(p.y).toBeLessThanOrEqual(6);
    }
  });

  it('escala positiva e limitada', () => {
    const p = particleState({...base, index: 9, frame: 33, baseScale: 2});
    expect(p.scale).toBeGreaterThan(0);
    expect(p.scale).toBeLessThanOrEqual(2);
  });
});

describe('floatOffset', () => {
  it('frame 0 sem phase: offset zero', () => {
    const f = floatOffset({frame: 0, fps: 30});
    expect(f.y).toBeCloseTo(0);
  });

  it('pico no quarto de ciclo', () => {
    // speed 0.4 ciclos/s -> quarto de ciclo em 30/0.4/4 = 18.75 frames
    const f = floatOffset({frame: 18.75, fps: 30, amplitude: 0.2});
    expect(f.y).toBeCloseTo(0.2, 3);
  });

  it('determinístico', () => {
    const a = floatOffset({frame: 55, fps: 30});
    const b = floatOffset({frame: 55, fps: 30});
    expect(a).toEqual(b);
  });
});
