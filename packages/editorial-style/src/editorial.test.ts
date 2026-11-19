import {describe, expect, it} from 'vitest';
import {cursorAt, duotoneTables, hexToRgb, slideDashOffset} from './calc';

describe('hexToRgb', () => {
  it('converte hex 6 e 3 dígitos', () => {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1]);
    expect(hexToRgb('#000')).toEqual([0, 0, 0]);
    const [r, g, b] = hexToRgb('#e2231a');
    expect(r).toBeCloseTo(0.886, 2);
    expect(g).toBeCloseTo(0.137, 2);
    expect(b).toBeCloseTo(0.102, 2);
  });
});

describe('duotoneTables', () => {
  it('extremos = colorDark e colorLight, meio interpolado', () => {
    const {r, g, b} = duotoneTables('#000000', '#ff0000', 3);
    expect(r).toEqual([0, 0.5, 1]);
    expect(g).toEqual([0, 0, 0]);
    expect(b).toEqual([0, 0, 0]);
  });
});

describe('cursorAt', () => {
  const params = {
    from: {x: 0, y: 0},
    to: {x: 100, y: 50},
    startFrame: 10,
    durationInFrames: 20,
    easing: 'linear' as const,
  };

  it('antes do início = from, depois do fim = to', () => {
    expect(cursorAt({frame: 0, ...params})).toEqual({x: 0, y: 0});
    expect(cursorAt({frame: 30, ...params})).toEqual({x: 100, y: 50});
    expect(cursorAt({frame: 999, ...params})).toEqual({x: 100, y: 50});
  });

  it('meio do caminho (linear)', () => {
    expect(cursorAt({frame: 20, ...params})).toEqual({x: 50, y: 25});
  });
});

describe('slideDashOffset', () => {
  it('desliza proporcional ao tempo, frame 0 = 0', () => {
    expect(slideDashOffset(0, 30, 60)).toBe(0);
    expect(slideDashOffset(30, 30, 60)).toBe(-60);
    expect(slideDashOffset(15, 30, -60)).toBe(30);
  });
});
