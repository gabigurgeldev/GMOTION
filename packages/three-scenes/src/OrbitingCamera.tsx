import {useLayoutEffect} from 'react';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {orbitPosition} from './calc';

export type OrbitingCameraProps = {
  /** Raio da órbita. Default: 8. */
  radius?: number;
  /** Voltas por segundo. Default: 0.08. */
  speed?: number;
  /** Altura da câmera. Default: 1.5. */
  height?: number;
  /** Ângulo inicial em radianos. Default: 0. */
  phase?: number;
  /** Ponto para onde a câmera olha. Default: origem. */
  lookAt?: [number, number, number];
};

/**
 * Câmera orbitando a origem — posição 100% derivada do frame (determinística).
 *
 * @example
 * <OrbitingCamera radius={9} speed={0.1} height={2} />
 */
export const OrbitingCamera = ({
  radius = 8,
  speed = 0.08,
  height = 1.5,
  phase = 0,
  lookAt = [0, 0, 0],
}: OrbitingCameraProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const camera = useThree((state) => state.camera);

  const pos = orbitPosition({frame, fps, radius, speed, height, phase});
  const [lx, ly, lz] = lookAt;

  useLayoutEffect(() => {
    camera.position.set(pos.x, pos.y, pos.z);
    camera.lookAt(lx, ly, lz);
    camera.updateProjectionMatrix();
  }, [camera, pos.x, pos.y, pos.z, lx, ly, lz]);

  return null;
};
