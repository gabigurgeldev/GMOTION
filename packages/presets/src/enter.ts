import {spring} from 'remotion';
import {lerp, seededNoise} from '@gmotion/core';
import {ease, type EasingName} from './easings';
import type {Direction, PresetFn} from './types';

/**
 * Presets de ENTRADA.
 * Cada factory recebe opções e devolve um PresetFn puro.
 * progress vai de 0 (invisível/fora) a 1 (posição final).
 */

const directionVector = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'left':
      return {x: -distance, y: 0};
    case 'right':
      return {x: distance, y: 0};
    case 'up':
      return {x: 0, y: -distance};
    case 'down':
      return {x: 0, y: distance};
  }
};

export type FadeInOptions = {
  /** Opacidade inicial. Default: 0. */
  from?: number;
  easing?: EasingName;
};

/**
 * Fade simples.
 * @example <AnimatedLayer enter="fade-in" enterFrames={15}>...</AnimatedLayer>
 */
export const fadeIn = ({from = 0, easing = 'out-cubic'}: FadeInOptions = {}): PresetFn => {
  return ({progress}) => ({opacity: lerp(from, 1, ease(easing, progress))});
};

export type SlideInOptions = {
  direction?: Direction;
  /** Distância percorrida em px. Default: 200. */
  distance?: number;
  easing?: EasingName;
  /** Se true, também aplica fade durante o slide. Default: true. */
  fade?: boolean;
};

/**
 * Desliza de uma das 4 direções.
 * @example <AnimatedLayer enter="slide-in" enterOptions={{direction: 'up'}}>...</AnimatedLayer>
 */
export const slideIn = ({
  direction = 'left',
  distance = 200,
  easing = 'out-cubic',
  fade = true,
}: SlideInOptions = {}): PresetFn => {
  return ({progress}) => {
    const t = ease(easing, progress);
    const {x, y} = directionVector(direction, distance);
    return {
      transform: `translate(${lerp(x, 0, t)}px, ${lerp(y, 0, t)}px)`,
      ...(fade ? {opacity: t} : {}),
    };
  };
};

export type ZoomInBounceOptions = {
  /** Escala inicial. Default: 0.3. */
  from?: number;
  /** Quanto menor o damping, mais quica. Default: 10. */
  damping?: number;
  stiffness?: number;
};

/**
 * Zoom com bounce físico (spring do Remotion) — o clássico do CapCut.
 * @example <AnimatedLayer enter="zoom-in-bounce" enterFrames={20}>...</AnimatedLayer>
 */
export const zoomInBounce = ({
  from = 0.3,
  damping = 10,
  stiffness = 130,
}: ZoomInBounceOptions = {}): PresetFn => {
  return ({frame, fps, durationInFrames}) => {
    const s = spring({
      frame,
      fps,
      durationInFrames,
      config: {damping, stiffness},
    });
    return {
      transform: `scale(${lerp(from, 1, s)})`,
      opacity: Math.min(1, s * 2),
    };
  };
};

export type BlurInOptions = {
  /** Blur inicial em px. Default: 20. */
  maxBlur?: number;
  easing?: EasingName;
  fade?: boolean;
};

/**
 * Entra desfocado e foca.
 * @example <AnimatedLayer enter="blur-in" enterFrames={18}>...</AnimatedLayer>
 */
export const blurIn = ({
  maxBlur = 20,
  easing = 'out-cubic',
  fade = true,
}: BlurInOptions = {}): PresetFn => {
  return ({progress}) => {
    const t = ease(easing, progress);
    return {
      filter: `blur(${lerp(maxBlur, 0, t)}px)`,
      ...(fade ? {opacity: t} : {}),
    };
  };
};

export type PopInOptions = {
  damping?: number;
  stiffness?: number;
  /** Overshoot inicial invisível abaixo desta escala. Default: 0. */
  from?: number;
};

/**
 * Pop com spring padrão do Remotion (orgânico, sem bounce exagerado).
 * @example <AnimatedLayer enter="pop-in" enterFrames={15}>...</AnimatedLayer>
 */
export const popIn = ({
  damping = 14,
  stiffness = 160,
  from = 0,
}: PopInOptions = {}): PresetFn => {
  return ({frame, fps, durationInFrames}) => {
    const s = spring({
      frame,
      fps,
      durationInFrames,
      config: {damping, stiffness},
    });
    return {
      transform: `scale(${lerp(from, 1, s)})`,
      opacity: Math.min(1, s * 3),
    };
  };
};

export type GlitchInOptions = {
  /** Seed do ruído determinístico. Default: 1. */
  seed?: number;
  /** Deslocamento máximo em px. Default: 12. */
  intensity?: number;
  /** Quantos "saltos" de glitch por segundo. Default: 15. */
  stepsPerSecond?: number;
};

/**
 * Entrada com jitter glitch: posição salta com ruído com seed (determinístico),
 * assentando conforme progress -> 1. RGB shift via filter.
 * @example <AnimatedLayer enter="glitch-in" enterFrames={12}>...</AnimatedLayer>
 */
export const glitchIn = ({
  seed = 1,
  intensity = 12,
  stepsPerSecond = 15,
}: GlitchInOptions = {}): PresetFn => {
  return ({frame, fps, progress}) => {
    const settle = 1 - progress;
    const step = Math.floor((frame / fps) * stepsPerSecond);
    const jx = seededNoise(seed, step) * intensity * settle;
    const jy = seededNoise(seed + 50, step) * intensity * settle;
    const flicker = seededNoise(seed + 99, step) > 0.6 ? 0.55 : 1;
    return {
      transform: `translate(${jx}px, ${jy}px)`,
      opacity: progress >= 1 ? 1 : Math.min(1, progress * 1.5) * flicker,
      filter: settle > 0.01 ? `hue-rotate(${jx * 6}deg) contrast(${1 + settle * 0.4})` : undefined,
    };
  };
};
