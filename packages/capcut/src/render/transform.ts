import {sampleTrack} from '../convert/keyframes';
import type {ClipSpec, Transform} from '../timeline/schema';

/**
 * Resolve o transform efetivo de um clip num frame LOCAL (0 = início do clip),
 * combinando o transform estático com as trilhas de keyframe. Função pura.
 *
 * Keyframes de posição (`posX`/`posY`) chegam em espaço NORMALIZADO do CapCut
 * (centro 0, Y para cima) e são convertidos para px aqui; `scaleX/scaleY/
 * rotation/alpha` são absolutos e sobrescrevem o canal correspondente.
 */
export interface Canvas {
  width: number;
  height: number;
}

const hasProp = (clip: ClipSpec, p: string) =>
  clip.keyframes.some((k) => k.property === p);

const sampleProp = (clip: ClipSpec, p: string, frame: number): number => {
  const track = clip.keyframes.find((k) => k.property === p)!;
  return sampleTrack(track, frame);
};

export const resolveTransformAtFrame = (
  clip: ClipSpec,
  localFrame: number,
  canvas: Canvas,
): Transform => {
  const t = {...clip.transform};

  if (hasProp(clip, 'posX')) {
    t.posX = canvas.width / 2 + sampleProp(clip, 'posX', localFrame) * (canvas.width / 2);
  }
  if (hasProp(clip, 'posY')) {
    t.posY = canvas.height / 2 - sampleProp(clip, 'posY', localFrame) * (canvas.height / 2);
  }
  if (hasProp(clip, 'scaleX')) t.scaleX = sampleProp(clip, 'scaleX', localFrame);
  if (hasProp(clip, 'scaleY')) t.scaleY = sampleProp(clip, 'scaleY', localFrame);
  if (hasProp(clip, 'rotation')) t.rotation = sampleProp(clip, 'rotation', localFrame);
  if (hasProp(clip, 'alpha')) t.alpha = sampleProp(clip, 'alpha', localFrame);

  return t;
};

/** CSS transform que ancora o elemento pelo centro em (posX,posY). */
export const toCssTransform = (t: Transform): string => {
  const sx = t.scaleX * (t.flipH ? -1 : 1);
  const sy = t.scaleY * (t.flipV ? -1 : 1);
  return [
    'translate(-50%, -50%)',
    `rotate(${t.rotation}deg)`,
    `scale(${sx}, ${sy})`,
  ].join(' ');
};
