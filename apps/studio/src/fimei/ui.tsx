import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {seededNoise} from '@gmotion/core';
import {ease} from '@gmotion/presets';
import {COLORS} from './timing';

/**
 * Peças visuais do FimeiPromo: kinetic typography, cards 3D com parallax,
 * fundo com profundidade. Tudo função pura do frame.
 */

const FONT = '"Segoe UI", Arial, sans-serif';

/** Palavras entram uma a uma com pop + leve subida. Palavras-chave coloridas. */
export const KineticText = ({
  words,
  startFrame = 0,
  framesPerWord = 4,
  fontSize = 110,
  highlight = {},
  style,
}: {
  words: string[];
  startFrame?: number;
  framesPerWord?: number;
  fontSize?: number;
  /** índice da palavra -> cor */
  highlight?: Record<number, string>;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '0.25em',
        padding: '0 70px',
        textAlign: 'center',
        fontFamily: FONT,
        fontWeight: 900,
        fontSize,
        lineHeight: 1.12,
        color: COLORS.white,
        textShadow: '0 10px 40px rgba(0,0,0,0.55)',
        ...style,
      }}
    >
      {words.map((word, i) => {
        const t = Math.min(1, Math.max(0, (frame - startFrame - i * framesPerWord) / 6));
        const eased = ease('out-back', t);
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              color: highlight[i] ?? undefined,
              opacity: t <= 0 ? 0 : Math.min(1, t * 2),
              transform: `scale(${0.5 + eased * 0.5}) translateY(${(1 - eased) * 40}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

/** Card com tilt 3D contínuo + sombra profunda (float function of frame). */
export const Card3D = ({
  children,
  seed = 1,
  tilt = 6,
  style,
}: {
  children: ReactNode;
  seed?: number;
  tilt?: number;
  style?: CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const rx = Math.sin(t * 0.9 + seed) * tilt;
  const ry = Math.cos(t * 0.7 + seed * 2) * tilt;
  return (
    <div style={{perspective: 900}}>
      <div
        style={{
          transform: `rotateX(${rx}deg) rotateY(${ry}deg)`,
          background: 'linear-gradient(150deg, #111827, #0b1220)',
          border: '1px solid rgba(148,163,184,0.18)',
          borderRadius: 28,
          padding: '44px 52px',
          boxShadow: '0 40px 90px rgba(0,0,0,0.6)',
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Fundo com profundidade: gradiente + blobs desfocados em 3 camadas de parallax. */
export const DepthBackground = ({
  hueA = COLORS.bgDeep,
  hueB = COLORS.bg,
  accent = COLORS.green,
  seed = 7,
}: {
  hueA?: string;
  hueB?: string;
  accent?: string;
  seed?: number;
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;

  // 3 camadas: quanto mais perto, mais rápido (parallax)
  const layers = [
    {speed: 6, size: 90, blur: 8, opacity: 0.5, count: 5},
    {speed: 14, size: 50, blur: 4, opacity: 0.35, count: 6},
    {speed: 26, size: 22, blur: 1, opacity: 0.45, count: 8},
  ];

  return (
    <AbsoluteFill
      style={{background: `linear-gradient(175deg, ${hueB} 0%, ${hueA} 70%)`}}
    >
      {layers.map((layer, li) =>
        Array.from({length: layer.count}, (_, i) => {
          const nx = seededNoise(seed + li * 10, i * 3);
          const ny = seededNoise(seed + li * 10, i * 3 + 1);
          const x = ((nx + 1) / 2) * width;
          const y = ((((ny + 1) / 2) * height + t * layer.speed) % (height + 200)) - 100;
          return (
            <div
              key={`${li}-${i}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: layer.size,
                height: layer.size,
                borderRadius: '50%',
                background: accent,
                opacity: layer.opacity * 0.25,
                filter: `blur(${layer.blur}px)`,
              }}
            />
          );
        }),
      )}
    </AbsoluteFill>
  );
};

/** Progresso 0-1 dentro de uma janela de frames — helper local. */
export const windowProgress = (
  frame: number,
  start: number,
  duration: number,
): number => Math.min(1, Math.max(0, (frame - start) / duration));
