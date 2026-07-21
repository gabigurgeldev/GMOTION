import {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader} from '@react-three/fiber';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {floatOffset} from './calc';

export type FloatingImageProps = {
  /** URL da imagem (use staticFile() para assets locais). */
  src: string;
  /** Largura do plano em unidades 3D. Default: 3. Altura segue o aspect. */
  width?: number;
  /** Amplitude da flutuação. Default: 0.15. */
  amplitude?: number;
  /** Ciclos por segundo. Default: 0.4. */
  speed?: number;
  /** Defasagem para dessincronizar várias imagens. Default: 0. */
  phase?: number;
  position?: [number, number, number];
  /** Mostra sombra estilizada no chão. Default: true. */
  shadow?: boolean;
  /** Y do plano de sombra. Default: -1.6. */
  shadowY?: number;
};

/**
 * Imagem/logo 2D flutuando no espaço 3D com leve rotação e sombra no chão.
 * Flutuação 100% derivada do frame.
 *
 * @example
 * <FloatingImage src={staticFile('logo.png')} width={3.5} />
 */
export const FloatingImage = ({
  src,
  width = 3,
  amplitude = 0.15,
  speed = 0.4,
  phase = 0,
  position = [0, 0, 0],
  shadow = true,
  shadowY = -1.6,
}: FloatingImageProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const texture = useLoader(THREE.TextureLoader, src);

  const aspect = useMemo(() => {
    const img = texture.image as {width?: number; height?: number} | undefined;
    return img?.width && img?.height ? img.height / img.width : 1;
  }, [texture]);

  const {y, rotX, rotY} = floatOffset({frame, fps, amplitude, speed, phase});
  const [px, py, pz] = position;

  // Sombra encolhe/clareia quando a imagem sobe
  const lift = (y + amplitude) / (amplitude * 2 || 1);
  const shadowScale = 1 - lift * 0.15;
  const shadowOpacity = 0.4 - lift * 0.15;

  return (
    <group position={[px, py, pz]}>
      <mesh position={[0, y, 0]} rotation={[rotX, rotY, 0]}>
        <planeGeometry args={[width, width * aspect]} />
        <meshStandardMaterial map={texture} transparent side={THREE.DoubleSide} />
      </mesh>
      {shadow ? (
        <mesh position={[0, shadowY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[(width / 2) * shadowScale, 32]} />
          <meshBasicMaterial color="#000000" transparent opacity={shadowOpacity} />
        </mesh>
      ) : null}
    </group>
  );
};
