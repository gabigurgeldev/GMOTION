import {clamp} from '@gmotion/core';

/**
 * Conversores de unidade entre o mundo CapCut e o mundo Remotion/Gmotion.
 *
 * Tempo: CapCut usa microssegundos (µs); Remotion usa frames.
 * Coordenada: `clip.transform.{x,y}` é normalizado com centro em 0,0, onde
 *   1.0 = deslocar meia-tela. O eixo Y é invertido (positivo = para cima).
 *   Origem de tela: canto superior-esquerdo, elemento ancorado no centro.
 *
 * A convenção exata de `scale` depende de como o CapCut ajusta a mídia ao
 * canvas; por isso `scale` é passado adiante como fator relativo e a calibração
 * fina é feita na Fase 4 comparando com os `draft_cover.jpg` da amostra.
 */

export const US_PER_SECOND = 1_000_000;

export const usToFrames = (us: number, fps: number): number =>
  Math.round((us / US_PER_SECOND) * fps);

export const framesToUs = (frames: number, fps: number): number =>
  Math.round((frames / fps) * US_PER_SECOND);

export interface Canvas {
  width: number;
  height: number;
}

export interface PxPos {
  x: number;
  y: number;
}

/** transform normalizado (centro 0,0, Y para cima) → pixel do centro do elemento. */
export const normPosToPx = (
  tx: number,
  ty: number,
  canvas: Canvas,
): PxPos => ({
  x: canvas.width / 2 + tx * (canvas.width / 2),
  y: canvas.height / 2 - ty * (canvas.height / 2),
});

/** pixel do centro do elemento → transform normalizado do CapCut. */
export const pxToNormPos = (
  px: number,
  py: number,
  canvas: Canvas,
): PxPos => ({
  x: (px - canvas.width / 2) / (canvas.width / 2),
  y: -(py - canvas.height / 2) / (canvas.height / 2),
});

const to255 = (c: number) => Math.round(clamp(c, 0, 1) * 255);

/** cor CapCut [r,g,b] em 0..1 → string CSS `rgb(...)`. */
export const capColorToCss = (rgb: [number, number, number]): string =>
  `rgb(${to255(rgb[0])}, ${to255(rgb[1])}, ${to255(rgb[2])})`;

/** cor CapCut [r,g,b] em 0..1 → hex `#rrggbb`. */
export const capColorToHex = (rgb: [number, number, number]): string => {
  const h = (c: number) => to255(c).toString(16).padStart(2, '0');
  return `#${h(rgb[0])}${h(rgb[1])}${h(rgb[2])}`;
};

/** `#rrggbb` | `rgb(r,g,b)` → cor CapCut [r,g,b] em 0..1. */
export const cssToCapColor = (css: string): [number, number, number] => {
  const s = css.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i.exec(s);
  if (rgb) {
    return [Number(rgb[1]) / 255, Number(rgb[2]) / 255, Number(rgb[3]) / 255];
  }
  throw new Error(`Cor CSS não suportada: ${css}`);
};
