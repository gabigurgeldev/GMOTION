import {seededNoise} from '@gmotion/core';

/**
 * Cálculos puros das cenas 3D — posição de câmera e partículas
 * como função do frame. Nada de física em tempo real do R3F.
 */

const TWO_PI = Math.PI * 2;

export type Vec3 = {x: number; y: number; z: number};

/**
 * Posição de câmera orbitando a origem.
 * speed em voltas por segundo.
 */
export const orbitPosition = (params: {
  frame: number;
  fps: number;
  radius: number;
  /** Voltas por segundo. Default: 0.1. */
  speed?: number;
  /** Altura fixa da câmera. Default: 0. */
  height?: number;
  /** Ângulo inicial em radianos. Default: 0. */
  phase?: number;
}): Vec3 => {
  const {frame, fps, radius, speed = 0.1, height = 0, phase = 0} = params;
  const angle = (frame / fps) * speed * TWO_PI + phase;
  return {
    x: Math.sin(angle) * radius,
    y: height,
    z: Math.cos(angle) * radius,
  };
};

export type ParticleState = Vec3 & {scale: number};

/**
 * Estado de uma partícula num dado frame.
 * Posição base espalhada por seed; deriva para cima + ondula lateral.
 * Loop suave: partícula que sai por cima reentra por baixo (modulo).
 */
export const particleState = (params: {
  seed: number;
  index: number;
  frame: number;
  fps: number;
  /** Raio da nuvem. Default: 6. */
  spread?: number;
  /** Subida em unidades/segundo. Default: 0.5. */
  riseSpeed?: number;
  /** Amplitude da ondulação lateral. Default: 0.4. */
  wobble?: number;
  /** Escala base. Default: 1. */
  baseScale?: number;
}): ParticleState => {
  const {
    seed,
    index,
    frame,
    fps,
    spread = 6,
    riseSpeed = 0.5,
    wobble = 0.4,
    baseScale = 1,
  } = params;

  const t = frame / fps;
  const nx = seededNoise(seed, index * 3);
  const ny = seededNoise(seed, index * 3 + 1);
  const nz = seededNoise(seed, index * 3 + 2);

  const range = spread * 2;
  // Sobe e faz wrap dentro de [-spread, +spread]
  const rawY = ny * spread + t * riseSpeed;
  const y = ((((rawY + spread) % range) + range) % range) - spread;

  const wobblePhase = (nx + nz) * Math.PI;
  const x = nx * spread + Math.sin(t * 1.3 + wobblePhase) * wobble;
  const z = nz * spread + Math.cos(t * 1.1 + wobblePhase) * wobble;

  // Escala pulsa levemente, dessincronizada por partícula
  const scale =
    baseScale * (0.6 + 0.4 * ((Math.sin(t * 2 + index * 1.7) + 1) / 2));

  return {x, y, z, scale};
};

/** Flutuação suave (para logo/imagem no espaço 3D). */
export const floatOffset = (params: {
  frame: number;
  fps: number;
  /** Amplitude em unidades. Default: 0.15. */
  amplitude?: number;
  /** Ciclos por segundo. Default: 0.4. */
  speed?: number;
  phase?: number;
}): {y: number; rotX: number; rotY: number} => {
  const {frame, fps, amplitude = 0.15, speed = 0.4, phase = 0} = params;
  const t = (frame / fps) * speed * TWO_PI + phase;
  return {
    y: Math.sin(t) * amplitude,
    rotX: Math.sin(t * 0.7) * 0.06,
    rotY: Math.cos(t * 0.5) * 0.12,
  };
};
