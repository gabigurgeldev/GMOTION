import {seededNoise} from '@gmotion/core';

/**
 * Cálculos puros dos efeitos — determinísticos, testáveis sem React.
 */

/**
 * Seed inteiro do grain para um frame — troca `grainFps` vezes por segundo
 * (grain de cinema real não muda a cada frame de 30/60fps).
 */
export const grainSeed = (params: {
  frame: number;
  fps: number;
  /** Trocas de padrão por segundo. Default: 12. */
  grainFps?: number;
  seed?: number;
}): number => {
  const {frame, fps, grainFps = 12, seed = 0} = params;
  return seed * 1000 + Math.floor((frame / fps) * grainFps);
};

export type ShakeTransform = {x: number; y: number; rotation: number};

/**
 * Deslocamento de screen shake num frame.
 * `decayFrames` > 0 faz o tremor amortecer até zero nesse intervalo
 * (impacto); 0 = tremor constante (handheld).
 */
export const screenShakeAt = (params: {
  frame: number;
  fps: number;
  /** Deslocamento máximo em px. Default: 15. */
  intensity?: number;
  /** "Saltos" por segundo. Default: 18. */
  stepsPerSecond?: number;
  /** Rotação máxima em graus. Default: 0.8. */
  rotation?: number;
  /** Frames até amortecer a zero (0 = constante). Default: 0. */
  decayFrames?: number;
  seed?: number;
}): ShakeTransform => {
  const {
    frame,
    fps,
    intensity = 15,
    stepsPerSecond = 18,
    rotation = 0.8,
    decayFrames = 0,
    seed = 3,
  } = params;

  const envelope =
    decayFrames > 0 ? Math.max(0, 1 - frame / decayFrames) : 1;
  const step = Math.floor((frame / fps) * stepsPerSecond);

  return {
    x: seededNoise(seed, step) * intensity * envelope,
    y: seededNoise(seed + 17, step) * intensity * envelope,
    rotation: seededNoise(seed + 34, step) * rotation * envelope,
  };
};

export type LeakBlob = {
  cx: number;
  cy: number;
  radius: number;
  opacity: number;
  hue: number;
};

/**
 * Posições dos "vazamentos de luz" num frame — derivam lentamente pela tela.
 * Retorna `count` blobs em coordenadas percentuais (0-100).
 */
export const lightLeakBlobs = (params: {
  frame: number;
  fps: number;
  count?: number;
  seed?: number;
  /** Velocidade da deriva. Default: 0.05. */
  driftSpeed?: number;
}): LeakBlob[] => {
  const {frame, fps, count = 3, seed = 9, driftSpeed = 0.05} = params;
  const t = (frame / fps) * driftSpeed;

  const blobs: LeakBlob[] = [];
  for (let i = 0; i < count; i++) {
    const nx = seededNoise(seed, i * 5);
    const ny = seededNoise(seed, i * 5 + 1);
    const phase = (nx + ny) * Math.PI;
    blobs.push({
      cx: 50 + nx * 45 + Math.sin(t * Math.PI * 2 + phase) * 20,
      cy: 50 + ny * 45 + Math.cos(t * Math.PI * 2 * 0.7 + phase) * 15,
      radius: 35 + seededNoise(seed, i * 5 + 2) * 15,
      opacity: 0.25 + (seededNoise(seed, i * 5 + 3) + 1) * 0.15,
      hue: 20 + (seededNoise(seed, i * 5 + 4) + 1) * 25,
    });
  }
  return blobs;
};

/**
 * Offset do RGB shift num frame — jitter glitchado com flicker.
 */
export const rgbShiftAt = (params: {
  frame: number;
  fps: number;
  /** Offset máximo em px. Default: 6. */
  intensity?: number;
  /** Trocas por segundo. Default: 12. */
  stepsPerSecond?: number;
  seed?: number;
}): number => {
  const {frame, fps, intensity = 6, stepsPerSecond = 12, seed = 5} = params;
  const step = Math.floor((frame / fps) * stepsPerSecond);
  const n = seededNoise(seed, step);
  // Flicker: às vezes quase zero, às vezes forte
  return Math.abs(n) > 0.35 ? n * intensity : n * intensity * 0.15;
};
