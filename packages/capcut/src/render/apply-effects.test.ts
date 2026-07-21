import {describe, it, expect} from 'vitest';
import {maskToCss, videoEffectsToFilter, animEnvelope} from './apply-effects';
import type {CapEffectSpec} from '../timeline/schema';

describe('maskToCss', () => {
  it('circle vira clip-path circle', () => {
    const css = maskToCss({kind: 'circle', centerX: 0.5, centerY: 0.5, width: 1, height: 1, rotation: 0, feather: 0, invert: false});
    expect(String(css.WebkitClipPath)).toContain('circle(');
  });
  it('rect vira inset', () => {
    const css = maskToCss({kind: 'rect', centerX: 0.5, centerY: 0.5, width: 0.5, height: 0.5, rotation: 0, feather: 0, invert: false});
    expect(String(css.clipPath)).toContain('inset(');
  });
});

describe('videoEffectsToFilter', () => {
  it('Blur vira filtro blur', () => {
    const fx: CapEffectSpec[] = [{name: 'Blur', kind: 'video_effect', intensity: 0.5, frames: null}];
    expect(videoEffectsToFilter(fx)).toContain('blur(');
  });
  it('sem video_effect retorna undefined', () => {
    expect(videoEffectsToFilter([])).toBeUndefined();
  });
});

describe('animEnvelope', () => {
  const inAnim: CapEffectSpec[] = [{name: 'in', kind: 'anim_in', intensity: null, frames: 15}];
  it('opacidade sobe de 0 no in', () => {
    expect(animEnvelope(inAnim, 0, 60).opacity).toBeLessThan(0.2);
    expect(animEnvelope(inAnim, 15, 60).opacity).toBeCloseTo(1, 1);
  });
  it('sem animação = envelope neutro', () => {
    expect(animEnvelope([], 10, 60)).toEqual({opacity: 1, scale: 1});
  });
});
