import type {CSSProperties} from 'react';
import {calcEnterExit} from '@gmotion/core';
import type {CapEffectSpec, ClipSpec, MaskSpec} from '../timeline/schema';

/**
 * Aplicação best-effort de máscara / efeitos / animações do CapCut no render.
 * Tudo determinístico (função pura do frame), sem shader novo nesta fase.
 */

/** Máscara → clip-path / mask CSS. Geometria relativa ao box do elemento. */
export const maskToCss = (mask: MaskSpec): CSSProperties => {
  const cx = `${mask.centerX * 100}%`;
  const cy = `${mask.centerY * 100}%`;
  if (mask.kind === 'circle') {
    const r = `${Math.max(mask.width, mask.height) * 50}%`;
    const shape = `circle(${r} at ${cx} ${cy})`;
    return {clipPath: mask.invert ? undefined : shape, WebkitClipPath: shape};
  }
  if (mask.kind === 'linear') {
    const grad = `linear-gradient(${mask.rotation}deg, #000 0%, transparent 100%)`;
    return {maskImage: grad, WebkitMaskImage: grad};
  }
  // rect
  const w = mask.width * 100;
  const h = mask.height * 100;
  const left = mask.centerX * 100 - w / 2;
  const top = mask.centerY * 100 - h / 2;
  const shape = `inset(${top}% ${100 - (left + w)}% ${100 - (top + h)}% ${left}%)`;
  return {clipPath: shape, WebkitClipPath: shape};
};

/** Nomes de video_effect conhecidos → filtro CSS. */
export const videoEffectsToFilter = (effects: CapEffectSpec[]): string | undefined => {
  const parts: string[] = [];
  for (const e of effects) {
    if (e.kind !== 'video_effect') continue;
    const n = e.name.toLowerCase();
    const i = e.intensity ?? 0.5;
    if (n.includes('blur')) parts.push(`blur(${Math.round(4 + i * 8)}px)`);
    else if (n.includes('bright')) parts.push(`brightness(${1 + i * 0.6})`);
    else if (n.includes('contrast')) parts.push(`contrast(${1 + i * 0.6})`);
    else if (n.includes('saturat') || n.includes('vivid')) parts.push(`saturate(${1 + i})`);
    else if (n.includes('b&w') || n.includes('mono') || n.includes('gray') || n.includes('grey')) parts.push('grayscale(1)');
    else if (n.includes('sepia') || n.includes('vintage') || n.includes('retro')) parts.push('sepia(0.6)');
  }
  return parts.length ? parts.join(' ') : undefined;
};

export interface AnimEnvelope {
  opacity: number;
  scale: number;
}

/** anim_in/out/loop → envelope determinístico de opacidade+escala. */
export const animEnvelope = (
  effects: CapEffectSpec[],
  frame: number,
  durationInFrames: number,
): AnimEnvelope => {
  const enter = effects.find((e) => e.kind === 'anim_in');
  const exit = effects.find((e) => e.kind === 'anim_out');
  const loop = effects.find((e) => e.kind === 'anim_loop');
  if (!enter && !exit && !loop) return {opacity: 1, scale: 1};

  const {enter: e, exit: x} = calcEnterExit({
    frame,
    durationInFrames,
    enterFrames: enter?.frames ?? 0,
    exitFrames: exit?.frames ?? 0,
  });
  const env = e * x; // 0..1
  let scale = 1;
  if (loop) scale = 1 + 0.03 * Math.sin((frame / Math.max(1, loop.frames ?? 30)) * Math.PI * 2);
  return {opacity: env, scale};
};

/** True se o clip tem alguma máscara/efeito/animação a aplicar. */
export const hasEffects = (clip: ClipSpec): boolean =>
  Boolean(clip.mask) || clip.effects.length > 0;
