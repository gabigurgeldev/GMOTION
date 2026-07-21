import {describe, expect, it} from 'vitest';
import {
  bell,
  hardCutVisible,
  shakeCutEnvelope,
  whipPanOffset,
  wipeInset,
  zoomGlitchScale,
} from './calc';
import {zoomGlitch} from './zoom-glitch';
import {rgbSplitWipe} from './rgb-split-wipe';
import {shakeCut} from './shake-cut';
import {whipPan} from './whip-pan';
import {lightLeak} from './light-leak';
import {filmBurn} from './film-burn';

describe('bell', () => {
  it('0 nas pontas, 1 no meio', () => {
    expect(bell(0)).toBeCloseTo(0);
    expect(bell(0.5)).toBeCloseTo(1);
    expect(bell(1)).toBeCloseTo(0);
  });
});

describe('whipPanOffset', () => {
  it('exiting: começa em 0, termina fora da tela', () => {
    const start = whipPanOffset({progress: 0, direction: 'left', phase: 'exiting'});
    const end = whipPanOffset({progress: 1, direction: 'left', phase: 'exiting'});
    expect(start).toEqual({x: 0, y: 0});
    expect(end.x).toBeCloseTo(-100);
  });

  it('entering: começa fora, termina em 0', () => {
    const start = whipPanOffset({progress: 0, direction: 'left', phase: 'entering'});
    const end = whipPanOffset({progress: 1, direction: 'left', phase: 'entering'});
    expect(start.x).toBeCloseTo(100);
    expect(end).toEqual({x: 0, y: 0});
  });

  it('right inverte sinal; up/down usam eixo Y', () => {
    expect(
      whipPanOffset({progress: 1, direction: 'right', phase: 'exiting'}).x,
    ).toBeCloseTo(100);
    const up = whipPanOffset({progress: 1, direction: 'up', phase: 'exiting'});
    expect(up.x).toBe(0);
    expect(up.y).toBeCloseTo(-100);
    expect(
      whipPanOffset({progress: 1, direction: 'down', phase: 'exiting'}).y,
    ).toBeCloseTo(100);
  });
});

describe('shakeCutEnvelope / hardCutVisible', () => {
  it('envelope: pico no corte, zero nas pontas', () => {
    expect(shakeCutEnvelope(0)).toBe(0);
    expect(shakeCutEnvelope(0.5)).toBe(1);
    expect(shakeCutEnvelope(1)).toBe(0);
  });

  it('corte em 0.5: só uma cena visível por vez', () => {
    expect(hardCutVisible(0.3, 'exiting')).toBe(true);
    expect(hardCutVisible(0.3, 'entering')).toBe(false);
    expect(hardCutVisible(0.7, 'exiting')).toBe(false);
    expect(hardCutVisible(0.7, 'entering')).toBe(true);
  });
});

describe('zoomGlitchScale', () => {
  it('exiting infla, entering assenta em 1', () => {
    expect(zoomGlitchScale({progress: 0, phase: 'exiting', strength: 0.5})).toBe(1);
    expect(zoomGlitchScale({progress: 1, phase: 'exiting', strength: 0.5})).toBe(1.5);
    expect(zoomGlitchScale({progress: 0, phase: 'entering', strength: 0.5})).toBe(1.5);
    expect(zoomGlitchScale({progress: 1, phase: 'entering', strength: 0.5})).toBe(1);
  });
});

describe('wipeInset', () => {
  it('progress 0: tudo cortado; progress 1: nada cortado', () => {
    expect(wipeInset({progress: 0, direction: 'left'})).toBe('inset(0 100% 0 0)');
    expect(wipeInset({progress: 1, direction: 'left'})).toBe('inset(0 0% 0 0)');
    expect(wipeInset({progress: 0.5, direction: 'down'})).toBe('inset(50% 0 0 0)');
  });
});

describe('factories', () => {
  it('todas devolvem {component, props} para o TransitionSeries', () => {
    for (const t of [
      zoomGlitch(),
      rgbSplitWipe({direction: 'up'}),
      shakeCut({intensity: 30}),
      whipPan(),
      lightLeak(),
      filmBurn(),
    ]) {
      expect(typeof t.component).toBe('function');
      expect(t.props).toBeTypeOf('object');
    }
  });
});
