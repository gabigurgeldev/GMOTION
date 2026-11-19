import {describe, expect, it} from 'vitest';
import {
  bestMatch,
  extractPatch,
  interpolateTrack,
  ncc,
  trackSequence,
  type GrayFrame,
} from './tracker';
import type {TrackFrame} from './types';

/** Frame sintético 120x120 com quadrado branco 16x16 em (x, y). */
const makeFrame = (x: number, y: number): GrayFrame => {
  const width = 120;
  const height = 120;
  const data = new Uint8Array(width * height);
  for (let dy = 0; dy < 16; dy++) {
    for (let dx = 0; dx < 16; dx++) {
      const px = x + dx;
      const py = y + dy;
      if (px < width && py < height) data[py * width + px] = 255;
    }
  }
  return {data, width, height};
};

describe('ncc', () => {
  it('patch idêntico = 1, invertido = -1, uniforme = 0', () => {
    const a = Float32Array.from([0, 100, 200, 50]);
    expect(ncc(a, a)).toBeCloseTo(1, 6);
    const inverted = Float32Array.from([200, 100, 0, 150]);
    expect(ncc(a, inverted)).toBeLessThan(0);
    const flat = new Float32Array(4).fill(7);
    expect(ncc(a, flat)).toBe(0);
  });
});

describe('extractPatch', () => {
  it('clampa na borda sem estourar', () => {
    const frame = makeFrame(0, 0);
    const patch = extractPatch(frame, 0, 0, 8);
    expect(patch.length).toBe(64);
    expect(patch[0]).toBe(255);
  });
});

describe('bestMatch / trackSequence', () => {
  it('acha o quadrado deslocado', () => {
    const f0 = makeFrame(40, 40);
    const f1 = makeFrame(52, 46);
    const template = extractPatch(f0, 48, 48, 24); // centro do quadrado
    const match = bestMatch(f1, template, 24, 48, 48, 20);
    expect(match.x).toBe(60); // 48 + 12
    expect(match.y).toBe(54); // 48 + 6
    expect(match.score).toBeGreaterThan(0.9);
  });

  it('trackeia movimento em vários frames', () => {
    const frames = [0, 1, 2, 3, 4].map((i) => makeFrame(30 + i * 8, 40 + i * 4));
    const track = trackSequence(frames, 38, 48, {patchSide: 20, searchRadius: 16});
    expect(track.length).toBe(5);
    const last = track[4];
    expect(last?.x).toBe(38 + 4 * 8);
    expect(last?.y).toBe(48 + 4 * 4);
    expect(last?.confidence).toBeGreaterThan(0.9);
  });

  it('sem frames = trilha vazia', () => {
    expect(trackSequence([], 0, 0)).toEqual([]);
  });
});

describe('interpolateTrack', () => {
  const frames: TrackFrame[] = [
    {frame: 0, x: 10, y: 20, scale: 1, rotation: 0, confidence: 1},
    {frame: 10, x: 30, y: 40, scale: 1, rotation: 0, confidence: 1},
  ];

  it('interpola linear entre amostras', () => {
    expect(interpolateTrack(frames, 5)).toEqual({x: 20, y: 30, scale: 1, rotation: 0});
  });

  it('clampa fora do range (frame 0, final, além)', () => {
    expect(interpolateTrack(frames, -5).x).toBe(10);
    expect(interpolateTrack(frames, 10).x).toBe(30);
    expect(interpolateTrack(frames, 99).x).toBe(30);
  });

  it('trilha vazia = neutro', () => {
    expect(interpolateTrack([], 3)).toEqual({x: 0, y: 0, scale: 1, rotation: 0});
  });
});
