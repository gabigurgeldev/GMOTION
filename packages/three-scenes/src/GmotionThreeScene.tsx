import type {ReactNode} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, useVideoConfig} from 'remotion';

export type GmotionThreeSceneProps = {
  children: ReactNode;
  /** Cor de fundo (CSS). Default: preto azulado. */
  background?: string;
  /** Posição inicial da câmera. Default: [0, 1.5, 8]. */
  cameraPosition?: [number, number, number];
  /** Field of view. Default: 45. */
  fov?: number;
  /** Adiciona iluminação padrão (ambient + key + rim). Default: true. */
  defaultLights?: boolean;
};

/** Iluminação padrão: ambiente fraca + key quente + rim fria. */
export const DefaultLights = () => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 8, 5]} intensity={2.2} color="#fff5e6" />
    <directionalLight position={[-6, 3, -4]} intensity={1.2} color="#7aa2ff" />
    <pointLight position={[0, -3, 4]} intensity={0.6} color="#ff7ad9" />
  </>
);

/**
 * Wrapper do ThreeCanvas com tamanho da composição e luzes padrão.
 *
 * @example
 * <GmotionThreeScene background="#05050c">
 *   <ExtrudedText text="GMOTION" />
 *   <OrbitingCamera radius={9} />
 * </GmotionThreeScene>
 */
export const GmotionThreeScene = ({
  children,
  background = '#05050c',
  cameraPosition = [0, 1.5, 8],
  fov = 45,
  defaultLights = true,
}: GmotionThreeSceneProps) => {
  const {width, height} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: background}}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{position: cameraPosition, fov}}
      >
        {defaultLights ? <DefaultLights /> : null}
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
