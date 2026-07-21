import {seededNoise} from '@gmotion/core';
import type {PresetFn} from './types';

/**
 * Presets de ÊNFASE/LOOP.
 * Rodam continuamente — usam frame/fps direto, não progress.
 * Todos periódicos ou com ruído determinístico (seed fixo).
 */

const TWO_PI = Math.PI * 2;

export type PulseOptions = {
  /** Ciclos por segundo. Default: 1. */
  speed?: number;
  /** Variação de escala (0.05 = ±5%). Default: 0.05. */
  intensity?: number;
};

/**
 * Escala pulsando suave.
 * @example <AnimatedLayer loop="pulse" loopOptions={{intensity: 0.08}}>...</AnimatedLayer>
 */
export const pulse = ({speed = 1, intensity = 0.05}: PulseOptions = {}): PresetFn => {
  return ({frame, fps}) => {
    const s = 1 + Math.sin((frame / fps) * speed * TWO_PI) * intensity;
    return {transform: `scale(${s})`};
  };
};

export type ShakeOptions = {
  seed?: number;
  /** Deslocamento máximo em px. Default: 5. */
  intensity?: number;
  /** "Saltos" por segundo. Default: 20. */
  stepsPerSecond?: number;
  /** Rotação máxima em graus. Default: 1. */
  rotation?: number;
};

/**
 * Tremor com ruído determinístico (nunca Math.random()).
 * @example <AnimatedLayer loop="shake" loopOptions={{intensity: 8}}>...</AnimatedLayer>
 */
export const shake = ({
  seed = 7,
  intensity = 5,
  stepsPerSecond = 20,
  rotation = 1,
}: ShakeOptions = {}): PresetFn => {
  return ({frame, fps}) => {
    const step = Math.floor((frame / fps) * stepsPerSecond);
    const x = seededNoise(seed, step) * intensity;
    const y = seededNoise(seed + 31, step) * intensity;
    const r = seededNoise(seed + 62, step) * rotation;
    return {transform: `translate(${x}px, ${y}px) rotate(${r}deg)`};
  };
};

export type FloatOptions = {
  /** Amplitude vertical em px. Default: 12. */
  amplitude?: number;
  /** Ciclos por segundo. Default: 0.4. */
  speed?: number;
  /** Defasagem 0-1 para dessincronizar múltiplos elementos. Default: 0. */
  phase?: number;
};

/**
 * Flutuação suave (idle de logo/personagem).
 * @example <AnimatedLayer loop="float">...</AnimatedLayer>
 */
export const float = ({
  amplitude = 12,
  speed = 0.4,
  phase = 0,
}: FloatOptions = {}): PresetFn => {
  return ({frame, fps}) => {
    const y = Math.sin(((frame / fps) * speed + phase) * TWO_PI) * amplitude;
    return {transform: `translateY(${y}px)`};
  };
};

export type RotateLoopOptions = {
  /** Rotações por minuto. Default: 10. */
  rpm?: number;
  /** Sentido horário? Default: true. */
  clockwise?: boolean;
};

/**
 * Rotação contínua.
 * @example <AnimatedLayer loop="rotate-loop" loopOptions={{rpm: 30}}>...</AnimatedLayer>
 */
export const rotateLoop = ({rpm = 10, clockwise = true}: RotateLoopOptions = {}): PresetFn => {
  return ({frame, fps}) => {
    const deg = (frame / fps) * (rpm / 60) * 360 * (clockwise ? 1 : -1);
    return {transform: `rotate(${deg}deg)`};
  };
};

export type GlowPulseOptions = {
  /** Cor do glow. Default: branco. */
  color?: string;
  /** Raio máximo do glow em px. Default: 25. */
  intensity?: number;
  /** Ciclos por segundo. Default: 0.8. */
  speed?: number;
};

/**
 * Glow pulsante via drop-shadow.
 * @example <AnimatedLayer loop="glow-pulse" loopOptions={{color: '#0ff'}}>...</AnimatedLayer>
 */
export const glowPulse = ({
  color = 'rgba(255,255,255,0.9)',
  intensity = 25,
  speed = 0.8,
}: GlowPulseOptions = {}): PresetFn => {
  return ({frame, fps}) => {
    const t = (Math.sin((frame / fps) * speed * TWO_PI) + 1) / 2;
    const radius = intensity * (0.35 + 0.65 * t);
    return {filter: `drop-shadow(0 0 ${radius}px ${color})`};
  };
};
