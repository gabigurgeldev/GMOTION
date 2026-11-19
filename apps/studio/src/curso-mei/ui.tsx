import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {seededNoise} from '@gmotion/core';
import {ease} from '@gmotion/presets';
import {COLORS, FONT} from './timing';

/**
 * Peças visuais do CursoMeiPromo: kinetic typography, cards 3D, fundo com
 * profundidade, ícones SVG inline (fintech) e layout responsivo 9:16 / 16:9.
 * Tudo função pura do frame.
 */

/* ------------------------------------------------------------------ */
/* Layout responsivo — reflow entre vertical (9:16) e horizontal (16:9). */
export const useLayout = () => {
  const {width, height} = useVideoConfig();
  const isWide = width > height;
  // No 16:9 a tela é mais baixa: reduz fonte e prefere linhas.
  const scale = isWide ? 0.82 : 1;
  return {isWide, scale, width, height};
};

/** Progresso 0-1 dentro de uma janela de frames — helper local. */
export const windowProgress = (
  frame: number,
  start: number,
  duration: number,
): number => Math.min(1, Math.max(0, (frame - start) / duration));

/* ------------------------------------------------------------------ */
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
          background: 'linear-gradient(150deg, #2a1650, #170a2e)',
          border: '1px solid rgba(167,139,250,0.28)',
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
  accent = COLORS.violet,
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

/** Citação de fonte de dado (rodapé) — restrição: só texto, sem logos de terceiros. */
export const SourceNote = ({children}: {children: ReactNode}) => (
  <div
    style={{
      position: 'absolute',
      bottom: 70,
      width: '100%',
      textAlign: 'center',
      fontFamily: FONT,
      fontWeight: 600,
      fontSize: 26,
      color: COLORS.muted,
      opacity: 0.8,
      letterSpacing: 0.5,
    }}
  >
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Ícones SVG inline (não há asset-library populada). */

/** Ícone de CNPJ/empresa — cartão de registro. */
export const CnpjIcon = ({size = 80, color = COLORS.violetLight}: {size?: number; color?: string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: 'visible'}}>
    <rect x="14" y="20" width="72" height="60" rx="8" fill="none" stroke={color} strokeWidth="5" />
    <circle cx="34" cy="42" r="9" fill={color} />
    <rect x="50" y="36" width="26" height="6" rx="3" fill={color} />
    <rect x="50" y="48" width="20" height="6" rx="3" fill={color} />
    <rect x="24" y="62" width="52" height="6" rx="3" fill={color} opacity="0.6" />
  </svg>
);

/** Carimbo "MEI". */
export const CarimboMei = ({size = 120, color = COLORS.lime}: {size?: number; color?: string}) => (
  <svg width={size} height={size} viewBox="0 0 120 120" style={{overflow: 'visible'}}>
    <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="6" />
    <circle cx="60" cy="60" r="40" fill="none" stroke={color} strokeWidth="3" opacity="0.6" />
    <text
      x="60"
      y="60"
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily={FONT}
      fontWeight={900}
      fontSize="34"
      fill={color}
      transform="rotate(-12 60 60)"
    >
      MEI
    </text>
  </svg>
);

/** Cofrinho com furos vazando moedas — moedas caem em função do frame. */
export const CofrinhoIcon = ({
  size = 320,
  color = COLORS.violetLight,
  coin = COLORS.gold,
}: {
  size?: number;
  color?: string;
  coin?: string;
}) => {
  const frame = useCurrentFrame();
  const coins = [0, 1, 2, 3, 4];
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: 'visible'}}>
      {/* corpo do porquinho */}
      <ellipse cx="100" cy="95" rx="66" ry="50" fill="none" stroke={color} strokeWidth="6" />
      <circle cx="150" cy="82" r="6" fill={color} />
      <path d="M 40 120 L 40 150 M 70 128 L 70 158 M 130 128 L 130 158 M 160 120 L 160 150" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <rect x="86" y="44" width="28" height="7" rx="3" fill={color} />
      {/* furos */}
      <circle cx="80" cy="120" r="5" fill={COLORS.bgDeep} stroke={color} strokeWidth="2" />
      <circle cx="118" cy="126" r="5" fill={COLORS.bgDeep} stroke={color} strokeWidth="2" />
      {/* moedas vazando (loop) */}
      {coins.map((c) => {
        const phase = ((frame + c * 13) % 40) / 40;
        const x = c % 2 === 0 ? 80 : 118;
        const y = 128 + phase * 60;
        return (
          <circle
            key={c}
            cx={x}
            cy={y}
            r="7"
            fill={coin}
            opacity={1 - phase}
          />
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/** Multidão de ícones CNPJ; um subconjunto "cai" com X vermelho ao longo do bloco. */
export const IconCrowd = ({
  cols = 7,
  rows = 6,
  fallStart = 30,
  fallDuration = 40,
  fallRatio = 0.18,
}: {
  cols?: number;
  rows?: number;
  fallStart?: number;
  fallDuration?: number;
  fallRatio?: number;
}) => {
  const frame = useCurrentFrame();
  const {width} = useVideoConfig();
  const total = cols * rows;
  const gap = width / (cols + 1);
  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: gap * 0.35,
        }}
      >
        {Array.from({length: total}, (_, i) => {
          const appear = windowProgress(frame, (i % cols) * 1.2 + Math.floor(i / cols) * 2, 10);
          // determinístico: quais caem
          const falls = (seededNoise(3, i) + 1) / 2 < fallRatio;
          const fp = falls ? windowProgress(frame, fallStart + (i % 5) * 3, fallDuration) : 0;
          return (
            <div
              key={i}
              style={{
                opacity: appear * (falls ? 1 - fp * 0.7 : 1),
                transform: `scale(${0.6 + appear * 0.4}) translateY(${fp * 220}px) rotate(${fp * 40}deg)`,
                position: 'relative',
              }}
            >
              <CnpjIcon size={64} color={falls && fp > 0.2 ? COLORS.red : COLORS.violetLight} />
              {falls && fp > 0.15 ? (
                <svg
                  width={40}
                  height={40}
                  viewBox="0 0 40 40"
                  style={{position: 'absolute', top: -6, right: -6, opacity: Math.min(1, fp * 3)}}
                >
                  <line x1="8" y1="8" x2="32" y2="32" stroke={COLORS.red} strokeWidth="6" strokeLinecap="round" />
                  <line x1="32" y1="8" x2="8" y2="32" stroke={COLORS.red} strokeWidth="6" strokeLinecap="round" />
                </svg>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/** Mapa do Brasil (silhueta aproximada) com pontos de luz surgindo. */
const BRASIL_PATH =
  'M 300 40 L 340 60 L 360 55 L 380 80 L 410 90 L 430 130 L 470 150 L 480 200 L 460 250 L 470 300 L 440 360 L 420 430 L 380 470 L 340 480 L 300 460 L 270 470 L 240 440 L 210 450 L 180 410 L 170 360 L 130 330 L 120 290 L 150 250 L 140 200 L 170 160 L 190 120 L 230 90 L 260 60 Z';

export const BrasilMap = ({
  size = 620,
  dotCount = 60,
  color = COLORS.lime,
}: {
  size?: number;
  dotCount?: number;
  color?: string;
}) => {
  const frame = useCurrentFrame();
  return (
    <svg width={size} height={size} viewBox="0 0 600 520" style={{overflow: 'visible'}}>
      <path d={BRASIL_PATH} fill="rgba(124,58,237,0.18)" stroke={COLORS.violetLight} strokeWidth="3" />
      {Array.from({length: dotCount}, (_, i) => {
        // pontos dentro da bounding box (aproximado)
        const x = 140 + ((seededNoise(9, i) + 1) / 2) * 320;
        const y = 70 + ((seededNoise(9, i + 500) + 1) / 2) * 380;
        const appear = windowProgress(frame, 10 + i * 1.4, 8);
        const pulse = 0.6 + 0.4 * Math.sin(frame / 6 + i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4 + appear * 3}
            fill={color}
            opacity={appear * pulse}
            style={{filter: 'drop-shadow(0 0 6px ' + color + ')'}}
          />
        );
      })}
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/** Card estilo "print de WhatsApp" — texto genérico, sem nomes/fotos reais. */
export const ChatCard = ({
  text,
  seed = 1,
  delay = 0,
}: {
  text: string;
  seed?: number;
  delay?: number;
}) => {
  const frame = useCurrentFrame();
  const p = windowProgress(frame, delay, 12);
  const eased = ease('out-back', p);
  return (
    <div
      style={{
        opacity: Math.min(1, p * 2),
        transform: `translateY(${(1 - eased) * 40}px) scale(${0.9 + eased * 0.1})`,
      }}
    >
      <div
        style={{
          maxWidth: 640,
          background: '#0e3a2f',
          border: '1px solid rgba(163,230,53,0.3)',
          borderRadius: '20px 20px 20px 6px',
          padding: '22px 28px',
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 38,
          color: COLORS.white,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        {text}
        <div style={{textAlign: 'right', fontSize: 22, color: COLORS.lime, marginTop: 8}}>
          ✓✓ 09:4{seed} {'  '}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/** Card de módulo do curso (cena da virada). */
export const ModuleCard = ({
  label,
  delay,
  index = 0,
}: {
  label: string;
  delay: number;
  index?: number;
}) => {
  const frame = useCurrentFrame();
  const p = windowProgress(frame, delay, 10);
  const eased = ease('out-back', p);
  return (
    <div
      style={{
        opacity: Math.min(1, p * 2),
        transform: `translateX(${(1 - eased) * (index % 2 === 0 ? -180 : 180)}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        background: 'linear-gradient(120deg, #1e0f3a, #15092b)',
        border: '1px solid rgba(163,230,53,0.35)',
        borderRadius: 18,
        padding: '20px 30px',
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 40,
        color: COLORS.white,
      }}
    >
      <span style={{color: COLORS.lime, fontSize: 34}}>▸</span>
      {label}
    </div>
  );
};

/** Bullet ✓ que sobe em stagger (cena da oferta). */
export const CheckBullet = ({
  label,
  delay,
}: {
  label: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const p = windowProgress(frame, delay, 10);
  const eased = ease('out-back', p);
  return (
    <div
      style={{
        opacity: Math.min(1, p * 2),
        transform: `translateY(${(1 - eased) * 50}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: 56,
        color: COLORS.white,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 62,
          height: 62,
          borderRadius: '50%',
          background: COLORS.lime,
          color: COLORS.bgDeep,
          fontSize: 40,
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        ✓
      </span>
      {label}
    </div>
  );
};
