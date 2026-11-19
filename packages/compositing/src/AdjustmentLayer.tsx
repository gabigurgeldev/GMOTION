import type {CSSProperties, ReactNode} from 'react';
import type {BlendMode} from './blend';

export type AdjustmentLayerProps = {
  /**
   * Filtro CSS aplicado a TUDO que está abaixo desta camada na composição
   * (via backdrop-filter). Ex.: 'hue-rotate(40deg) saturate(1.4) contrast(1.1)'.
   */
  filter?: string;
  /**
   * Cor sólida composta por cima com o blend mode dado — o combo clássico de
   * "adjustment layer com solid" do AE (ex.: teal + 'overlay' pra color grade).
   */
  color?: string;
  /** Blend mode da cor. Default: 'overlay'. */
  blend?: BlendMode;
  /** Opacidade da camada de cor (0-1). Default: 1. */
  colorOpacity?: number;
  /** Conteúdo opcional renderizado dentro da camada (raro — normalmente vazia). */
  children?: ReactNode;
  style?: CSSProperties;
};

/**
 * Adjustment layer: afeta tudo que já foi pintado abaixo dela, não o próprio
 * conteúdo — igual AE. Coloque DEPOIS das camadas que quer afetar:
 *
 * <AbsoluteFill>
 *   <Video ... />
 *   <Particles ... />
 *   <AdjustmentLayer filter="saturate(1.5) contrast(1.1)" color="#0af" blend="overlay" colorOpacity={0.25} />
 * </AbsoluteFill>
 *
 * `filter` usa backdrop-filter (pega o que está atrás); `color`+`blend` compõem
 * uma solid por cima. Ambos determinísticos — pode animar via useCurrentFrame()
 * no chamador.
 */
export const AdjustmentLayer = ({
  filter,
  color,
  blend = 'overlay',
  colorOpacity = 1,
  children,
  style,
}: AdjustmentLayerProps) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backdropFilter: filter,
        WebkitBackdropFilter: filter,
        ...style,
      }}
    >
      {color ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color,
            mixBlendMode: blend,
            opacity: colorOpacity,
          }}
        />
      ) : null}
      {children}
    </div>
  );
};
