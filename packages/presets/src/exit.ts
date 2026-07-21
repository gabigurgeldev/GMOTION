import {lerp} from '@gmotion/core';
import {ease, type EasingName} from './easings';
import type {Direction, PresetFn} from './types';

/**
 * Presets de SAÍDA.
 * progress vai de 0 (ainda em cena) a 1 (fora/invisível).
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

export type FadeOutOptions = {
  /** Opacidade final. Default: 0. */
  to?: number;
  easing?: EasingName;
};

/**
 * Fade de saída.
 * @example <AnimatedLayer exit="fade-out" exitFrames={10}>...</AnimatedLayer>
 */
export const fadeOut = ({to = 0, easing = 'in-cubic'}: FadeOutOptions = {}): PresetFn => {
  return ({progress}) => ({opacity: lerp(1, to, ease(easing, progress))});
};

export type SlideOutOptions = {
  direction?: Direction;
  distance?: number;
  easing?: EasingName;
  fade?: boolean;
};

/**
 * Desliza para fora numa das 4 direções.
 * @example <AnimatedLayer exit="slide-out" exitOptions={{direction: 'right'}}>...</AnimatedLayer>
 */
export const slideOut = ({
  direction = 'right',
  distance = 200,
  easing = 'in-cubic',
  fade = true,
}: SlideOutOptions = {}): PresetFn => {
  return ({progress}) => {
    const t = ease(easing, progress);
    const {x, y} = directionVector(direction, distance);
    return {
      transform: `translate(${lerp(0, x, t)}px, ${lerp(0, y, t)}px)`,
      ...(fade ? {opacity: 1 - t} : {}),
    };
  };
};

export type ZoomOutOptions = {
  /** Escala final (>1 = estoura pra frente). Default: 1.6. */
  to?: number;
  easing?: EasingName;
};

/**
 * Zoom estourando para frente enquanto some.
 * @example <AnimatedLayer exit="zoom-out" exitFrames={12}>...</AnimatedLayer>
 */
export const zoomOut = ({to = 1.6, easing = 'in-cubic'}: ZoomOutOptions = {}): PresetFn => {
  return ({progress}) => {
    const t = ease(easing, progress);
    return {
      transform: `scale(${lerp(1, to, t)})`,
      opacity: 1 - t,
    };
  };
};

export type BlurOutOptions = {
  maxBlur?: number;
  easing?: EasingName;
  fade?: boolean;
};

/**
 * Sai desfocando.
 * @example <AnimatedLayer exit="blur-out" exitFrames={12}>...</AnimatedLayer>
 */
export const blurOut = ({
  maxBlur = 20,
  easing = 'in-cubic',
  fade = true,
}: BlurOutOptions = {}): PresetFn => {
  return ({progress}) => {
    const t = ease(easing, progress);
    return {
      filter: `blur(${lerp(0, maxBlur, t)}px)`,
      ...(fade ? {opacity: 1 - t} : {}),
    };
  };
};

export type ShrinkOutOptions = {
  /** Escala final. Default: 0. */
  to?: number;
  easing?: EasingName;
};

/**
 * Encolhe até sumir.
 * @example <AnimatedLayer exit="shrink-out" exitFrames={10}>...</AnimatedLayer>
 */
export const shrinkOut = ({to = 0, easing = 'in-cubic'}: ShrinkOutOptions = {}): PresetFn => {
  return ({progress}) => {
    const t = ease(easing, progress);
    return {
      transform: `scale(${lerp(1, to, t)})`,
      opacity: 1 - t,
    };
  };
};
