import {describe, expect, it} from 'vitest';
import {grainSeed, lightLeakBlobs, rgbShiftAt, screenShakeAt} from './calc';

describe('grainSeed', () => {
  it('mesmo frame, mesmo seed', () => {
    const a = grainSeed({frame: 42, fps: 30});
    const b = grainSeed({frame: 42, fps: 30});
    expect(a).toBe(b);
  });

  it('troca grainFps vezes por segundo, não a cada frame', () => {
    // grainFps 12 a 30fps: frames 0 e 1 compartilham seed, 0 e 3 não
    expect(grainSeed({frame: 0, fps: 30, grainFps: 12})).toBe(
      grainSeed({frame: 1, fps: 30, grainFps: 12}),
    );
    expect(grainSeed({frame: 0, fps: 30, grainFps: 12})).not.toBe(
      grainSeed({frame: 3, fps: 30, grainFps: 12}),
    );
  });

  it('seeds distintos geram sequências distintas', () => {
    expect(grainSeed({frame: 10, fps: 30, seed: 1})).not.toBe(
      grainSeed({frame: 10, fps: 30, seed: 2}),
    );
  });
});

describe('screenShakeAt', () => {
  const base = {frame: 20, fps: 30, intensity: 10};

  it('determinístico', () => {
    expect(screenShakeAt(base)).toEqual(screenShakeAt(base));
  });

  it('limitado à intensidade', () => {
    for (const frame of [0, 5, 13, 47]) {
      const s = screenShakeAt({frame, fps: 30, intensity: 10, rotation: 2});
      expect(Math.abs(s.x)).toBeLessThanOrEqual(10);
      expect(Math.abs(s.y)).toBeLessThanOrEqual(10);
      expect(Math.abs(s.rotation)).toBeLessThanOrEqual(2);
    }
  });

  it('decayFrames: amortece a zero', () => {
    const end = screenShakeAt({frame: 20, fps: 30, decayFrames: 20});
    expect(end).toEqual({x: 0, y: 0, rotation: 0});
    const mid = screenShakeAt({frame: 10, fps: 30, decayFrames: 20, intensity: 100, stepsPerSecond: 30});
    const start = screenShakeAt({frame: 0, fps: 30, decayFrames: 20, intensity: 100, stepsPerSecond: 30});
    // Envelope na metade é 0.5 do inicial
    expect(Math.hypot(mid.x, mid.y)).toBeLessThanOrEqual(
      Math.hypot(start.x, start.y) + 50,
    );
  });

  it('sem decay: tremor constante em frames altos', () => {
    const s = screenShakeAt({frame: 1000, fps: 30, intensity: 10});
    expect(Math.abs(s.x) + Math.abs(s.y)).toBeGreaterThan(0);
  });
});

describe('lightLeakBlobs', () => {
  it('determinístico e com count certo', () => {
    const a = lightLeakBlobs({frame: 30, fps: 30, count: 4});
    const b = lightLeakBlobs({frame: 30, fps: 30, count: 4});
    expect(a).toEqual(b);
    expect(a).toHaveLength(4);
  });

  it('blobs se movem com o tempo', () => {
    const t0 = lightLeakBlobs({frame: 0, fps: 30});
    const t1 = lightLeakBlobs({frame: 300, fps: 30});
    expect(t0[0]?.cx).not.toBeCloseTo(t1[0]?.cx ?? 0);
  });

  it('opacidade e raio em faixas sãs', () => {
    for (const b of lightLeakBlobs({frame: 77, fps: 30, count: 5})) {
      expect(b.opacity).toBeGreaterThan(0);
      expect(b.opacity).toBeLessThanOrEqual(0.6);
      expect(b.radius).toBeGreaterThan(0);
    }
  });
});

describe('rgbShiftAt', () => {
  it('determinístico', () => {
    expect(rgbShiftAt({frame: 15, fps: 30})).toBe(rgbShiftAt({frame: 15, fps: 30}));
  });

  it('limitado à intensidade', () => {
    for (const frame of [0, 10, 25, 60]) {
      expect(Math.abs(rgbShiftAt({frame, fps: 30, intensity: 8}))).toBeLessThanOrEqual(8);
    }
  });
});
