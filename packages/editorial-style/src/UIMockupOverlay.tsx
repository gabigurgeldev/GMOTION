import type {CSSProperties, ReactNode} from 'react';
import {useCurrentFrame} from 'remotion';
import type {EasingName} from '@gmotion/presets';
import {cursorAt, type CursorKeyframe} from './calc';

/** Botão retangular fake de app de edição (estilo screen recording). */
export const MockButton = ({
  label,
  active = false,
  style,
}: {
  label: string;
  /** Estado "pressionado/destacado". */
  active?: boolean;
  style?: CSSProperties;
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '14px 30px',
      borderRadius: 10,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 700,
      fontSize: 30,
      background: active ? '#2b6bff' : '#1e1e26',
      color: active ? '#fff' : '#c8c8d4',
      border: '2px solid ' + (active ? '#5b8bff' : '#3a3a46'),
      boxShadow: active ? '0 0 24px rgba(43,107,255,0.55)' : 'none',
      ...style,
    }}
  >
    {label}
  </div>
);

/** Badge "FX" (ou qualquer sigla) — o chip de efeito da referência. */
export const FxBadge = ({label = 'FX', style}: {label?: string; style?: CSSProperties}) => (
  <MockButton label={label} active style={{padding: '12px 22px', borderRadius: 12, ...style}} />
);

export type MockCursorProps = {
  /** Posição inicial (px do frame). */
  from: CursorKeyframe;
  /** Posição de destino. */
  to: CursorKeyframe;
  startFrame?: number;
  durationInFrames?: number;
  easing?: EasingName;
  /** Tamanho do cursor em px. Default: 56. */
  size?: number;
  color?: string;
};

/** Cursor de mouse animado por frame (puro — cursorAt). */
export const MockCursor = ({
  from,
  to,
  startFrame = 0,
  durationInFrames = 30,
  easing = 'in-out-cubic',
  size = 56,
  color = '#fff',
}: MockCursorProps) => {
  const frame = useCurrentFrame();
  const {x, y} = cursorAt({frame, from, to, startFrame, durationInFrames, easing});
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{position: 'absolute', left: x, top: y, pointerEvents: 'none'}}
    >
      <path
        d="M4 2 L20 12 L12.5 13.5 L16 21 L13 22.4 L9.6 15 L4 20 Z"
        fill={color}
        stroke="#000"
        strokeWidth={1.4}
      />
    </svg>
  );
};

/** Contêiner do overlay de UI fake — z-index alto, sem interação. */
export const UIMockupOverlay = ({children, style}: {children: ReactNode; style?: CSSProperties}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, ...style}}>
    {children}
  </div>
);
