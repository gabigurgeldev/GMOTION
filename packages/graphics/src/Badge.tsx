import type {CSSProperties, ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

export type BadgeProps = {
  children: ReactNode;
  /** Cores da borda animada. Default: roxo/rosa. */
  borderColors?: [string, string];
  /** Rotações da borda por segundo. Default: 0.5. */
  borderSpeed?: number;
  /** Espessura da borda em px. Default: 4. */
  borderWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
  style?: CSSProperties;
};

/**
 * Badge/chip com borda em conic-gradient girando (função do frame).
 *
 * @example
 * <Badge borderColors={['#22d3ee', '#a78bfa']}>NOVO</Badge>
 */
export const Badge = ({
  children,
  borderColors = ['#6366f1', '#ec4899'],
  borderSpeed = 0.5,
  borderWidth = 4,
  backgroundColor = '#0b0b14',
  textColor = 'white',
  fontSize = 36,
  style,
}: BadgeProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const angle = ((frame / fps) * borderSpeed * 360) % 360;
  const [c1, c2] = borderColors;

  return (
    <div
      style={{
        display: 'inline-block',
        padding: borderWidth,
        borderRadius: 999,
        background: `conic-gradient(from ${angle}deg, ${c1}, ${c2}, ${c1})`,
        ...style,
      }}
    >
      <div
        style={{
          borderRadius: 999,
          backgroundColor,
          padding: '14px 36px',
          fontFamily: 'Arial, sans-serif',
          fontWeight: 800,
          fontSize,
          color: textColor,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
    </div>
  );
};
