import {useId} from 'react';
import type {CSSProperties, ReactNode} from 'react';

export type MaskLayerProps = {
  children: ReactNode;
  /**
   * Formas SVG do recorte (conteúdo de um <clipPath>): <circle>, <rect>,
   * <path>... Pode usar useCurrentFrame() no chamador pra animar os atributos.
   * Coordenadas em objectBoundingBox quando `units="fraction"` (0-1) ou em px
   * do frame quando `units="px"`.
   */
  mask: ReactNode;
  /**
   * 'fraction': coordenadas 0-1 relativas ao conteúdo (objectBoundingBox) —
   * atenção: em elemento não-quadrado, formas escalam por eixo (círculo vira
   * elipse). Pra círculo perfeito use 'px' com coordenadas do frame.
   * Default: 'fraction'.
   */
  units?: 'fraction' | 'px';
  /** Ocupa o frame todo. Default: true. */
  fill?: boolean;
  style?: CSSProperties;
};

/**
 * Recorta o conteúdo filho pela forma do mask via clip-path SVG.
 * Mask animado: os atributos das formas podem vir de useCurrentFrame()
 * (calculados no componente pai) — determinístico por frame.
 *
 * @example — círculo revelando, crescendo com o frame:
 * const r = interpolate(frame, [0, 30], [0, 0.75]);
 * <MaskLayer mask={<circle cx={0.5} cy={0.5} r={r} />}>
 *   <OffthreadVideo src={...} />
 * </MaskLayer>
 */
export const MaskLayer = ({
  children,
  mask,
  units = 'fraction',
  fill = true,
  style,
}: MaskLayerProps) => {
  const id = useId();
  const clipId = `gmotion-mask-${id}`;

  return (
    <div
      style={{
        ...(fill ? {position: 'absolute', inset: 0} : {}),
        clipPath: `url(#${clipId})`,
        ...style,
      }}
    >
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <clipPath
            id={clipId}
            clipPathUnits={units === 'fraction' ? 'objectBoundingBox' : 'userSpaceOnUse'}
          >
            {mask}
          </clipPath>
        </defs>
      </svg>
      {children}
    </div>
  );
};
