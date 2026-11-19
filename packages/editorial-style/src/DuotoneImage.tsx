import {useId} from 'react';
import type {CSSProperties, ReactNode} from 'react';
import {duotoneTables} from './calc';

export type DuotoneImageProps = {
  /** Imagem/vídeo/qualquer conteúdo a duotonizar. */
  children: ReactNode;
  /** Tom das sombras. Default: '#111111'. */
  colorDark?: string;
  /** Tom das luzes. Default: '#ffffff'. */
  colorLight?: string;
  /** Trama halftone (pontos estilo jornal impresso). Default: true. */
  halftone?: boolean;
  /** Espaçamento dos pontos em px. Default: 7. */
  dotSize?: number;
  /** Ângulo da trama em graus. Default: 25. */
  angle?: number;
  /** Opacidade da trama (0-1). Default: 0.5. */
  dotOpacity?: number;
  style?: CSSProperties;
};

/**
 * Duotone/halftone editorial — foto P&B com trama pontilhada (efeito jornal),
 * como observado em EXEMPLO DE EDIT/. Duotone REAL via filtro SVG:
 * luminância → mapa colorDark→colorLight por canal (não é grayscale simples).
 * Halftone: trama de pontos rotacionada composta em multiply por cima.
 * Fallback barato: halftone={false} + colorDark/Light default ≈ grayscale.
 */
export const DuotoneImage = ({
  children,
  colorDark = '#111111',
  colorLight = '#ffffff',
  halftone = true,
  dotSize = 7,
  angle = 25,
  dotOpacity = 0.5,
  style,
}: DuotoneImageProps) => {
  const id = useId();
  const filterId = `gmotion-duotone-${id}`;
  const {r, g, b} = duotoneTables(colorDark, colorLight);
  const toValues = (t: number[]): string => t.map((v) => v.toFixed(4)).join(' ');

  return (
    <div style={{position: 'relative', overflow: 'hidden', ...style}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            {/* luminância (Rec. 601) em todos os canais */}
            <feColorMatrix
              type="matrix"
              values="0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0.299 0.587 0.114 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="table" tableValues={toValues(r)} />
              <feFuncG type="table" tableValues={toValues(g)} />
              <feFuncB type="table" tableValues={toValues(b)} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <div style={{filter: `url(#${filterId})`}}>{children}</div>
      {halftone ? (
        <div
          style={{
            position: 'absolute',
            inset: '-50%',
            backgroundImage: `radial-gradient(circle, rgba(0,0,0,${dotOpacity}) ${dotSize * 0.22}px, transparent ${dotSize * 0.24}px)`,
            backgroundSize: `${dotSize}px ${dotSize}px`,
            transform: `rotate(${angle}deg)`,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
          }}
        />
      ) : null}
    </div>
  );
};
