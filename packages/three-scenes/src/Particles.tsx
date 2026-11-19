import {useLayoutEffect, useMemo, useRef} from 'react';
import * as THREE from 'three';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {particleState} from './calc';
import {byQuality, scaledCount, useSceneQuality, type PreviewQuality} from './quality';

export type ParticlesProps = {
  /** Quantidade de partículas. Default: 200. */
  count?: number;
  /** Seed do layout. Default: 42. */
  seed?: number;
  /** Raio da nuvem. Default: 6. */
  spread?: number;
  /** Velocidade de subida (unidades/s). Default: 0.5. */
  riseSpeed?: number;
  /** Tamanho de cada partícula. Default: 0.05. */
  size?: number;
  color?: string;
  /** Intensidade emissiva (brilho). Default: 1.2. */
  glow?: number;
  /** LOD. Default: herda da cena / auto — low corta pra ~35% das partículas. */
  previewQuality?: PreviewQuality;
};

/**
 * Nuvem de partículas instanciadas — posição de cada uma é função pura
 * de (seed, index, frame). Referência: remotion-dev/three-particles.
 *
 * @example
 * <Particles count={300} color="#8be9fd" spread={7} />
 */
export const Particles = ({
  count: requestedCount = 200,
  seed = 42,
  spread = 6,
  riseSpeed = 0.5,
  size = 0.05,
  color = '#ffffff',
  glow = 1.2,
  previewQuality,
}: ParticlesProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const quality = useSceneQuality(previewQuality);
  const count = scaledCount(requestedCount, quality);
  const sphereDetail = byQuality(quality, 4, 8);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) {
      return;
    }
    for (let i = 0; i < count; i++) {
      const p = particleState({seed, index: i, frame, fps, spread, riseSpeed});
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, seed, frame, fps, spread, riseSpeed, dummy]);

  return (
    <instancedMesh key={count} ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[size, sphereDetail, sphereDetail]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={glow}
      />
    </instancedMesh>
  );
};
