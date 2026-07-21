import {describe, it, expect} from 'vitest';
import {resolveTransformAtFrame, toCssTransform} from './transform';
import type {ClipSpec} from '../timeline/schema';

const canvas = {width: 1080, height: 1920};

const baseClip = (over: Partial<ClipSpec> = {}): ClipSpec =>
  ({
    kind: 'image',
    id: 'c',
    src: 'x.png',
    start: 0,
    duration: 30,
    sourceStart: 0,
    transform: {scaleX: 1, scaleY: 1, rotation: 0, posX: 540, posY: 960, alpha: 1, flipH: false, flipV: false},
    keyframes: [],
    ...over,
  }) as ClipSpec;

describe('resolveTransformAtFrame', () => {
  it('returns static transform without keyframes', () => {
    const t = resolveTransformAtFrame(baseClip(), 10, canvas);
    expect(t.posX).toBe(540);
    expect(t.scaleX).toBe(1);
  });

  it('scaleX keyframe overrides across frames', () => {
    const clip = baseClip({
      keyframes: [{property: 'scaleX', points: [{frame: 0, value: 1}, {frame: 30, value: 2}]}],
    });
    expect(resolveTransformAtFrame(clip, 0, canvas).scaleX).toBeCloseTo(1, 5);
    expect(resolveTransformAtFrame(clip, 30, canvas).scaleX).toBeCloseTo(2, 5);
    expect(resolveTransformAtFrame(clip, 15, canvas).scaleX).toBeGreaterThan(1);
  });

  it('posX keyframe (normalized) converts to px', () => {
    const clip = baseClip({
      keyframes: [{property: 'posX', points: [{frame: 0, value: 0}, {frame: 30, value: 1}]}],
    });
    expect(resolveTransformAtFrame(clip, 0, canvas).posX).toBeCloseTo(540, 3);
    expect(resolveTransformAtFrame(clip, 30, canvas).posX).toBeCloseTo(1080, 3);
  });
});

describe('toCssTransform', () => {
  it('encodes flip as negative scale', () => {
    const css = toCssTransform({scaleX: 1, scaleY: 1, rotation: 0, posX: 0, posY: 0, alpha: 1, flipH: true, flipV: false});
    expect(css).toContain('scale(-1, 1)');
    expect(css).toContain('translate(-50%, -50%)');
  });
});
