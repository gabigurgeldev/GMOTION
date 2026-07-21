import {useMemo} from 'react';
import * as THREE from 'three';
import {useLoader} from '@react-three/fiber';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';

export type GltfModelProps = {
  /** URL do .glb/.gltf (use staticFile() para assets locais). */
  src: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** Escala uniforme ou por eixo. Default: 1. */
  scale?: number | [number, number, number];
  /** Sobrescreve a cor de todos os materiais do modelo (opcional). */
  color?: string;
};

/**
 * Importador genérico de modelos glTF/GLB via useLoader.
 * Anime position/rotation por fora com valores derivados do frame.
 *
 * @example
 * const frame = useCurrentFrame();
 * <GltfModel
 *   src={staticFile('robot.glb')}
 *   rotation={[0, frame * 0.02, 0]}
 *   scale={1.5}
 *   color="#ff5577"
 * />
 */
export const GltfModel = ({
  src,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  color,
}: GltfModelProps) => {
  const gltf = useLoader(GLTFLoader, src);

  // Clona a cena para permitir múltiplas instâncias e override de material
  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    if (color) {
      cloned.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const recolor = (m: THREE.Material): THREE.Material => {
            const copy = m.clone();
            if ('color' in copy && copy.color instanceof THREE.Color) {
              copy.color.set(color);
            }
            return copy;
          };
          obj.material = Array.isArray(obj.material)
            ? obj.material.map(recolor)
            : recolor(obj.material);
        }
      });
    }
    return cloned;
  }, [gltf, color]);

  const scaleVec: [number, number, number] =
    typeof scale === 'number' ? [scale, scale, scale] : scale;

  return (
    <primitive
      object={scene}
      position={position}
      rotation={rotation}
      scale={scaleVec}
    />
  );
};
