import {useId} from 'react';
import {useCurrentFrame} from 'remotion';
import type {EasingName} from '@gmotion/presets';
import {pathTextOffset} from './text-calc';

export type PathTextProps = {
  text: string;
  /** Path SVG (atributo `d`) que o texto segue. */
  path: string;
  /** ViewBox do SVG. Default: '0 0 1000 400'. */
  viewBox?: string;
  width?: number | string;
  height?: number | string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fill?: string;
  /** startOffset inicial em % do path. Default: 0. */
  offsetFrom?: number;
  /** startOffset final em % do path. Default: igual a offsetFrom (estático). */
  offsetTo?: number;
  /** Frames da animação de offset. 0 = estático. Default: 0. */
  durationInFrames?: number;
  easing?: EasingName;
  /** Mostra o path como guia (debug). Default: false. */
  showPath?: boolean;
};

/**
 * Texto ao longo de um path SVG via <textPath> nativo — posição e rotação
 * seguem a tangente do path automaticamente (estilo texto curvo do CapCut).
 * `offsetFrom`/`offsetTo` + durationInFrames fazem o texto "andar" pelo path,
 * puro em useCurrentFrame().
 *
 * @example
 * <PathText text="texto curvo" path="M 50 300 Q 500 50 950 300" durationInFrames={60} offsetFrom={0} offsetTo={30} />
 */
export const PathText = ({
  text,
  path,
  viewBox = '0 0 1000 400',
  width = '100%',
  height,
  fontSize = 60,
  fontFamily = 'Arial, sans-serif',
  fontWeight = 700,
  fill = 'white',
  offsetFrom = 0,
  offsetTo,
  durationInFrames = 0,
  easing = 'out-cubic',
  showPath = false,
}: PathTextProps) => {
  const frame = useCurrentFrame();
  const id = useId();
  const pathId = `gmotion-pathtext-${id}`;

  const offset = pathTextOffset({
    frame,
    durationInFrames,
    from: offsetFrom,
    to: offsetTo ?? offsetFrom,
    easing,
  });

  return (
    <svg viewBox={viewBox} width={width} height={height} style={{overflow: 'visible'}}>
      <path
        id={pathId}
        d={path}
        fill="none"
        stroke={showPath ? 'rgba(255,255,255,0.25)' : 'none'}
        strokeWidth={2}
      />
      <text fontSize={fontSize} fontFamily={fontFamily} fontWeight={fontWeight} fill={fill}>
        <textPath href={`#${pathId}`} startOffset={`${offset}%`}>
          {text}
        </textPath>
      </text>
    </svg>
  );
};
