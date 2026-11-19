import {describe, expect, it} from 'vitest';
import {lutToTransferTables, parseCubeLut, sampleLutTrilinear} from './cube';
import {channelTable, cssColorFilter, curveTable, evalCurve} from './curves';

/** LUT identidade N=2 no formato .cube (R varia mais rápido). */
const identityCube = `# comentário
TITLE "identidade"
LUT_3D_SIZE 2
0 0 0
1 0 0
0 1 0
1 1 0
0 0 1
1 0 1
0 1 1
1 1 1
`;

describe('parseCubeLut', () => {
  it('parseia size, title e dados', () => {
    const lut = parseCubeLut(identityCube);
    expect(lut.size).toBe(2);
    expect(lut.title).toBe('identidade');
    expect(lut.data.length).toBe(24);
    expect(lut.domainMin).toEqual([0, 0, 0]);
    expect(lut.domainMax).toEqual([1, 1, 1]);
  });

  it('erro em .cube inválido', () => {
    expect(() => parseCubeLut('LUT_3D_SIZE 2\n0 0 0')).toThrow(/entradas/);
    expect(() => parseCubeLut('0 0 0')).toThrow(/LUT_3D_SIZE/);
    expect(() => parseCubeLut('LUT_1D_SIZE 4')).toThrow(/1D/);
  });
});

describe('sampleLutTrilinear', () => {
  const identity = parseCubeLut(identityCube);

  it('LUT identidade devolve a própria cor (cantos e meio)', () => {
    for (const rgb of [[0, 0, 0], [1, 1, 1], [0.5, 0.5, 0.5], [0.25, 0.75, 0.5]] as const) {
      const out = sampleLutTrilinear(identity, [...rgb] as [number, number, number]);
      expect(out[0]).toBeCloseTo(rgb[0], 5);
      expect(out[1]).toBeCloseTo(rgb[1], 5);
      expect(out[2]).toBeCloseTo(rgb[2], 5);
    }
  });

  it('clampa fora do domínio', () => {
    const out = sampleLutTrilinear(identity, [-1, 2, 0.5]);
    expect(out[0]).toBe(0);
    expect(out[1]).toBe(1);
    expect(out[2]).toBeCloseTo(0.5, 5);
  });

  it('lutToTransferTables da identidade é rampa linear', () => {
    const {r} = lutToTransferTables(identity, 5);
    expect(r).toEqual([0, 0.25, 0.5, 0.75, 1]);
  });
});

describe('curvas', () => {
  it('sem pontos = identidade', () => {
    expect(evalCurve(undefined, 0.3)).toBeCloseTo(0.3, 10);
    expect(curveTable(undefined, 3)).toEqual([0, 0.5, 1]);
  });

  it('interpola entre pontos de controle e clampa nas pontas', () => {
    const points: [number, number][] = [[0, 0.1], [0.5, 0.5], [1, 0.9]];
    expect(evalCurve(points, 0)).toBeCloseTo(0.1, 10);
    expect(evalCurve(points, 0.25)).toBeCloseTo(0.3, 10);
    expect(evalCurve(points, 1)).toBeCloseTo(0.9, 10);
    expect(evalCurve(points, -5)).toBeCloseTo(0.1, 10);
    expect(evalCurve(points, 5)).toBeCloseTo(0.9, 10);
  });

  it('channelTable compõe master + canal', () => {
    const master: [number, number][] = [[0, 0], [1, 0.5]]; // escurece 50%
    const channel: [number, number][] = [[0, 0], [0.5, 1], [1, 1]]; // dobra
    const table = channelTable(master, channel, 3);
    expect(table[0]).toBeCloseTo(0, 10);
    expect(table[2]).toBeCloseTo(1, 10); // canal(0.5) = 1
  });
});

describe('cssColorFilter', () => {
  it('monta só o que difere do neutro', () => {
    expect(cssColorFilter({})).toBe('none');
    expect(cssColorFilter({hue: 20, saturation: 1.4})).toBe('hue-rotate(20deg) saturate(1.4)');
    expect(cssColorFilter({lightness: 1.1, contrast: 1.2})).toBe('brightness(1.1) contrast(1.2)');
  });
});
