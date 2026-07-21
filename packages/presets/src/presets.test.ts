import {describe, expect, it} from 'vitest';
import {blurIn, fadeIn, glitchIn, popIn, slideIn, zoomInBounce} from './enter';
import {float, glowPulse, pulse, rotateLoop, shake} from './emphasis';
import {blurOut, fadeOut, shrinkOut, slideOut, zoomOut} from './exit';
import {mergePresetStyles} from './merge';
import {ease} from './easings';
import {allPresetNames, enterPresets, resolvePreset} from './registry';
import {typewriterVisibleChars} from './TypewriterText';
import type {PresetParams} from './types';

const at = (frame: number, durationInFrames = 15, fps = 30): PresetParams => ({
  frame,
  fps,
  durationInFrames,
  progress: Math.min(1, Math.max(0, frame / durationInFrames)),
});

describe('presets de entrada', () => {
  it('fade-in: 0 no início, 1 no fim', () => {
    expect(fadeIn()(at(0)).opacity).toBe(0);
    expect(fadeIn()(at(15)).opacity).toBeCloseTo(1);
  });

  it('slide-in left: deslocado no início, zero no fim', () => {
    const start = slideIn({direction: 'left', distance: 200})(at(0));
    const end = slideIn({direction: 'left', distance: 200})(at(15));
    expect(start.transform).toContain('-200px');
    expect(start.opacity).toBe(0);
    expect(end.transform).toContain('translate(0px, 0px)');
    expect(end.opacity).toBeCloseTo(1);
  });

  it('slide-in: 4 direções produzem vetores distintos', () => {
    const dirs = (['left', 'right', 'up', 'down'] as const).map(
      (direction) => slideIn({direction, fade: false})(at(0)).transform,
    );
    expect(new Set(dirs).size).toBe(4);
  });

  it('zoom-in-bounce: começa pequeno, assenta em 1', () => {
    const start = zoomInBounce({from: 0.3})(at(0, 20));
    const end = zoomInBounce({from: 0.3})(at(20, 20));
    expect(start.transform).toContain('scale(0.3');
    const endScale = Number(/scale\(([\d.]+)\)/.exec(end.transform ?? '')?.[1]);
    expect(endScale).toBeGreaterThan(0.95);
    expect(endScale).toBeLessThan(1.1);
  });

  it('blur-in: blur máximo no início, 0 no fim', () => {
    expect(blurIn({maxBlur: 20})(at(0)).filter).toBe('blur(20px)');
    expect(blurIn({maxBlur: 20})(at(15)).filter).toBe('blur(0px)');
  });

  it('pop-in: invisível no frame 0, escala ~1 no fim', () => {
    expect(popIn()(at(0, 15)).opacity).toBe(0);
    const end = popIn()(at(15, 15));
    const endScale = Number(/scale\(([\d.]+)\)/.exec(end.transform ?? '')?.[1]);
    expect(endScale).toBeGreaterThan(0.9);
  });

  it('glitch-in: determinístico e estável no fim', () => {
    const a = glitchIn({seed: 3})(at(4, 12));
    const b = glitchIn({seed: 3})(at(4, 12));
    expect(a).toEqual(b);
    const end = glitchIn({seed: 3})(at(12, 12));
    expect(end.opacity).toBe(1);
    expect(end.transform).toBe('translate(0px, 0px)');
  });
});

describe('presets de loop', () => {
  it('pulse: escala oscila em torno de 1', () => {
    const s0 = pulse({speed: 1, intensity: 0.1})(at(0, 60));
    expect(s0.transform).toBe('scale(1)');
    const sQuarter = pulse({speed: 1, intensity: 0.1})({...at(0, 60), frame: 7.5});
    const scale = Number(/scale\(([\d.]+)\)/.exec(sQuarter.transform ?? '')?.[1]);
    expect(scale).toBeCloseTo(1.1, 1);
  });

  it('shake: determinístico, limitado à intensidade', () => {
    const a = shake({seed: 5, intensity: 8})(at(10, 60));
    const b = shake({seed: 5, intensity: 8})(at(10, 60));
    expect(a).toEqual(b);
    const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\)/.exec(a.transform ?? '');
    expect(Math.abs(Number(match?.[1]))).toBeLessThanOrEqual(8);
    expect(Math.abs(Number(match?.[2]))).toBeLessThanOrEqual(8);
  });

  it('float: retorna à origem a cada ciclo completo', () => {
    // speed 0.5 -> ciclo de 2s = 60 frames a 30fps
    const s = float({speed: 0.5, amplitude: 10})(at(60, 120));
    const y = Number(/translateY\((-?[\d.e-]+)px\)/.exec(s.transform ?? '')?.[1]);
    expect(y).toBeCloseTo(0, 5);
  });

  it('rotate-loop: 60rpm = 360° em 1s', () => {
    const s = rotateLoop({rpm: 60})(at(30, 60));
    expect(s.transform).toBe('rotate(360deg)');
  });

  it('glow-pulse: sempre emite drop-shadow', () => {
    expect(glowPulse()(at(0, 60)).filter).toContain('drop-shadow');
  });
});

describe('presets de saída', () => {
  it('fade-out: 1 no início, 0 no fim', () => {
    expect(fadeOut()(at(0, 10)).opacity).toBe(1);
    expect(fadeOut()(at(10, 10)).opacity).toBeCloseTo(0);
  });

  it('slide-out: origem no início, deslocado e invisível no fim', () => {
    const end = slideOut({direction: 'right', distance: 300})(at(10, 10));
    expect(end.transform).toContain('300px');
    expect(end.opacity).toBeCloseTo(0);
  });

  it('zoom-out: escala 1 -> to', () => {
    expect(zoomOut({to: 2})(at(0, 10)).transform).toBe('scale(1)');
    expect(zoomOut({to: 2})(at(10, 10)).transform).toBe('scale(2)');
  });

  it('blur-out: 0 -> maxBlur', () => {
    expect(blurOut({maxBlur: 15})(at(0, 10)).filter).toBe('blur(0px)');
    expect(blurOut({maxBlur: 15})(at(10, 10)).filter).toBe('blur(15px)');
  });

  it('shrink-out: 1 -> 0', () => {
    expect(shrinkOut()(at(10, 10)).transform).toBe('scale(0)');
  });
});

describe('mergePresetStyles', () => {
  it('concatena transforms, multiplica opacities, junta filters', () => {
    const merged = mergePresetStyles(
      {transform: 'scale(2)', opacity: 0.5, filter: 'blur(2px)'},
      {transform: 'rotate(10deg)', opacity: 0.5},
      undefined,
      {filter: 'contrast(1.2)'},
    );
    expect(merged.transform).toBe('scale(2) rotate(10deg)');
    expect(merged.opacity).toBe(0.25);
    expect(merged.filter).toBe('blur(2px) contrast(1.2)');
  });

  it('vazio quando nada definido', () => {
    expect(mergePresetStyles(undefined, {})).toEqual({});
  });
});

describe('registry', () => {
  it('resolvePreset resolve por nome', () => {
    const fn = resolvePreset(enterPresets, 'fade-in');
    expect(fn(at(15)).opacity).toBeCloseTo(1);
  });

  it('nome inválido lança erro com lista', () => {
    expect(() => resolvePreset(enterPresets, 'nope')).toThrow(/Disponíveis/);
  });

  it('catálogo cobre todas as categorias', () => {
    expect(allPresetNames.enter.length).toBeGreaterThanOrEqual(6);
    expect(allPresetNames.loop.length).toBeGreaterThanOrEqual(5);
    expect(allPresetNames.exit.length).toBeGreaterThanOrEqual(5);
  });
});

describe('typewriter', () => {
  it('0 chars no frame 0, todos no fim', () => {
    const base = {fps: 30, textLength: 10, charsPerSecond: 20};
    expect(typewriterVisibleChars({...base, frame: 0})).toBe(0);
    // 10 chars a 20cps = 0.5s = 15 frames
    expect(typewriterVisibleChars({...base, frame: 15})).toBe(10);
    // Nunca passa do tamanho do texto
    expect(typewriterVisibleChars({...base, frame: 300})).toBe(10);
  });

  it('respeita startFrame', () => {
    const base = {fps: 30, textLength: 10, charsPerSecond: 30};
    expect(typewriterVisibleChars({...base, frame: 5, startFrame: 10})).toBe(0);
    expect(typewriterVisibleChars({...base, frame: 20, startFrame: 10})).toBe(10);
  });
});

describe('easings', () => {
  it('todos começam em 0 e terminam em 1', () => {
    const names = [
      'linear',
      'in-quad',
      'out-quad',
      'in-out-quad',
      'in-cubic',
      'out-cubic',
      'in-out-cubic',
      'out-expo',
      'out-back',
    ] as const;
    for (const name of names) {
      expect(ease(name, 0)).toBeCloseTo(0);
      expect(ease(name, 1)).toBeCloseTo(1);
    }
  });
});
