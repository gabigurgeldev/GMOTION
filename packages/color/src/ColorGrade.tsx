import {useId} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {channelTable, type Curves, type HslAdjust} from './curves';
import {lutToTransferTables, type CubeLut} from './cube';

export type ColorGradeProps = {
  children: ReactNode;
  /** Curvas por pontos de controle ([in, out] em 0-1). */
  curves?: Curves;
  /** Ajuste HSL determinístico. */
  hsl?: HslAdjust;
  /**
   * LUT .cube parseada (via useCubeLut/parseCubeLut) — aplicada como
   * APROXIMAÇÃO 1D por canal no filtro SVG (perde termos cruzados).
   * Pra LUT 3D fiel em vídeo use <LutVideo>.
   */
  lut?: CubeLut;
  /** Ocupa o frame todo. Default: false (envolve só o conteúdo). */
  fill?: boolean;
  style?: CSSProperties;
};

const toTableValues = (table: number[]): string =>
  table.map((v) => v.toFixed(4)).join(' ');

/**
 * Color grade sobre o conteúdo filho via filtro SVG:
 * curvas (feComponentTransfer) → saturação/hue/lightness (feColorMatrix).
 * Mesmo papel do <AdjustmentLayer> da Fase 12, mas envolvendo o conteúdo —
 * pra afetar "tudo abaixo", ponha o conteúdo inteiro dentro dela.
 * Tudo puro: props calculáveis por frame no chamador.
 *
 * @example
 * <ColorGrade curves={{rgb: [[0, 0.05], [0.5, 0.55], [1, 0.95]]}} hsl={{saturation: 1.3}}>
 *   <OffthreadVideo src={...} />
 * </ColorGrade>
 */
export const ColorGrade = ({children, curves, hsl, lut, fill = false, style}: ColorGradeProps) => {
  const id = useId();
  const filterId = `gmotion-grade-${id}`;

  const lutTables = lut ? lutToTransferTables(lut) : null;
  const rTable = lutTables ? lutTables.r : channelTable(curves?.rgb, curves?.r);
  const gTable = lutTables ? lutTables.g : channelTable(curves?.rgb, curves?.g);
  const bTable = lutTables ? lutTables.b : channelTable(curves?.rgb, curves?.b);

  const {hue = 0, saturation = 1, lightness = 1} = hsl ?? {};

  return (
    <div
      style={{
        ...(fill ? {position: 'absolute', inset: 0} : {}),
        filter: `url(#${filterId})`,
        ...style,
      }}
    >
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="table" tableValues={toTableValues(rTable)} />
              <feFuncG type="table" tableValues={toTableValues(gTable)} />
              <feFuncB type="table" tableValues={toTableValues(bTable)} />
            </feComponentTransfer>
            <feColorMatrix type="saturate" values={String(saturation)} />
            <feColorMatrix type="hueRotate" values={String(hue)} />
            <feComponentTransfer>
              <feFuncR type="linear" slope={lightness} />
              <feFuncG type="linear" slope={lightness} />
              <feFuncB type="linear" slope={lightness} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      {children}
    </div>
  );
};
