import {describe, it, expect} from 'vitest';
import {
  usToFrames,
  framesToUs,
  normPosToPx,
  pxToNormPos,
  capColorToHex,
  capColorToCss,
  cssToCapColor,
} from './units';
import {toKeyframeTracks, sampleTrack} from './keyframes';
import type {CommonKeyframe} from '../draft/types';

describe('units', () => {
  it('µs↔frames roundtrip at 30fps', () => {
    expect(usToFrames(1_000_000, 30)).toBe(30);
    expect(framesToUs(30, 30)).toBe(1_000_000);
    expect(usToFrames(framesToUs(45, 30), 30)).toBe(45);
  });

  const canvas = {width: 1080, height: 1920};

  it('center maps to canvas center', () => {
    expect(normPosToPx(0, 0, canvas)).toEqual({x: 540, y: 960});
  });

  it('Y axis is inverted (positive = up)', () => {
    expect(normPosToPx(0, 1, canvas).y).toBe(0);
    expect(normPosToPx(0, -1, canvas).y).toBe(1920);
  });

  it('pos px↔norm roundtrip', () => {
    const p = normPosToPx(0.5, -0.5, canvas);
    const n = pxToNormPos(p.x, p.y, canvas);
    expect(n.x).toBeCloseTo(0.5, 6);
    expect(n.y).toBeCloseTo(-0.5, 6);
  });
});

describe('color', () => {
  it('white/black conversion', () => {
    expect(capColorToHex([1, 1, 1])).toBe('#ffffff');
    expect(capColorToHex([0, 0, 0])).toBe('#000000');
    expect(capColorToCss([1, 0, 0])).toBe('rgb(255, 0, 0)');
  });

  it('css↔cap roundtrip', () => {
    const c = cssToCapColor('#3366cc');
    expect(capColorToHex(c)).toBe('#3366cc');
    expect(cssToCapColor('rgb(255, 0, 0)')).toEqual([1, 0, 0]);
  });
});

describe('keyframes', () => {
  const kfs: CommonKeyframe[] = [
    {
      id: 'kf',
      material_id: '',
      property_type: 'KFTypeScaleX',
      keyframe_list: [
        {id: 'a', time_offset: 0, values: [1], left_control: {x: 0, y: 0}, right_control: {x: 1, y: 1}},
        {id: 'b', time_offset: 1_000_000, values: [2], left_control: {x: 0, y: 0}, right_control: {x: 1, y: 1}},
      ],
    },
  ];

  it('maps property + samples endpoints and midpoint', () => {
    const [track] = toKeyframeTracks(kfs, 30);
    expect(track!.property).toBe('scaleX');
    expect(sampleTrack(track!, 0)).toBeCloseTo(1, 6);
    expect(sampleTrack(track!, 30)).toBeCloseTo(2, 6);
    // linear (handles fora de [0,1] cairia em linear; aqui 1,1/0,0 → ~linear)
    const mid = sampleTrack(track!, 15);
    expect(mid).toBeGreaterThan(1);
    expect(mid).toBeLessThan(2);
  });

  it('clamps before first and after last keyframe', () => {
    const [track] = toKeyframeTracks(kfs, 30);
    expect(sampleTrack(track!, -5)).toBe(1);
    expect(sampleTrack(track!, 999)).toBe(2);
  });
});
