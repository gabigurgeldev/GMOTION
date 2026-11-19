import {useCurrentFrame} from 'remotion';
import type {EasingName} from '@gmotion/presets';
import {strokeDrawOffset} from './calc';

export type AnimatedStrokeProps = {
  /** Path SVG (`d`) a desenhar. Ou use `text`. */
  path?: string;
  /** Texto a desenhar em contorno. Ou use `path`. */
  text?: string;
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  stroke?: string;
  strokeWidth?: number;
  /** Preenchimento que aparece após o traço desenhado (fade). Default: 'none'. */
  fill?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  /** Comprimento total do traço (dasharray). Paths usam pathLength normalizado = 1000. */
  strokeLength?: number;
  /** Frames pra desenhar o traço todo. Default: 45. */
  durationInFrames?: number;
  easing?: EasingName;
  /** Frame em que começa. Default: 0. */
  startFrame?: number;
};

/**
 * Traço se "desenhando" via stroke-dasharray/dashoffset animado por
 * useCurrentFrame() — reusa strokeDrawOffset() (puro) do calc.
 * Com `fill`, o preenchimento entra em fade nos últimos 30% da animação.
 *
 * @example
 * <AnimatedStroke text="GMOTION" fontSize={140} stroke="#0ff" durationInFrames={50} />
 * <AnimatedStroke path="M 20 200 C 200 20 600 380 980 200" stroke="white" />
 */
export const AnimatedStroke = ({
  path,
  text,
  viewBox = '0 0 1000 400',
  width = '100%',
  height,
  stroke = 'white',
  strokeWidth = 3,
  fill = 'none',
  fontSize = 120,
  fontFamily = 'Arial, sans-serif',
  fontWeight = 900,
  strokeLength = 1000,
  durationInFrames = 45,
  easing = 'out-cubic',
  startFrame = 0,
}: AnimatedStrokeProps) => {
  const frame = useCurrentFrame();

  const dashOffset = strokeDrawOffset({
    frame,
    durationInFrames,
    pathLength: strokeLength,
    easing,
    startFrame,
  });
  const progress = 1 - dashOffset / strokeLength;
  // Fill entra suave nos últimos 30% do desenho.
  const fillOpacity = fill === 'none' ? 0 : Math.max(0, (progress - 0.7) / 0.3);

  const common = {
    stroke,
    strokeWidth,
    strokeDasharray: strokeLength,
    strokeDashoffset: dashOffset,
    fill: fill === 'none' ? 'none' : fill,
    fillOpacity,
  } as const;

  return (
    <svg viewBox={viewBox} width={width} height={height} style={{overflow: 'visible'}}>
      {path ? (
        <path d={path} pathLength={strokeLength} {...common} />
      ) : (
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontWeight={fontWeight}
          {...common}
        >
          {text}
        </text>
      )}
    </svg>
  );
};
