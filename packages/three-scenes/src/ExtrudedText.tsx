import {useMemo} from 'react';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader.js';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry.js';
// Fonte vendorizada do repo do three.js (MIT) — o pacote npm não inclui mais examples/fonts
import helvetikerBold from './fonts/helvetiker_bold.typeface.json';
import {byQuality, useSceneQuality, type PreviewQuality} from './quality';

export type ExtrudedTextMaterial = 'metal' | 'glass' | 'neon';

export type ExtrudedTextProps = {
  text: string;
  /** Tamanho da fonte em unidades 3D. Default: 1.2. */
  size?: number;
  /** Profundidade da extrusão. Default: 0.35. */
  depth?: number;
  /** Estilo do material. Default: 'metal'. */
  material?: ExtrudedTextMaterial;
  /** Cor base. Default: '#c0c8ff'. */
  color?: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  /** LOD. Default: herda da cena / auto (low no studio, high no render). */
  previewQuality?: PreviewQuality;
};

const MaterialFor = ({
  material,
  color,
}: {
  material: ExtrudedTextMaterial;
  color: string;
}) => {
  switch (material) {
    case 'metal':
      // Sem envmap, metalness alto fica preto — 0.65 mantém brilho com difuso
      return (
        <meshStandardMaterial
          color={color}
          metalness={0.65}
          roughness={0.3}
        />
      );
    case 'glass':
      return (
        <meshPhysicalMaterial
          color={color}
          metalness={0}
          roughness={0.08}
          transparent
          opacity={0.55}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      );
    case 'neon':
      return (
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.6}
          metalness={0.2}
          roughness={0.4}
        />
      );
  }
};

/**
 * Texto 3D extrudado (fonte helvetiker embutida do three), centralizado na origem.
 * Anime rotação/posição por fora (props derivadas do frame) ou orbite com <OrbitingCamera>.
 *
 * @example
 * <ExtrudedText text="GMOTION" material="metal" color="#d8dcff" />
 */
export const ExtrudedText = ({
  text,
  size = 1.2,
  depth = 0.35,
  material = 'metal',
  color = '#c0c8ff',
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  previewQuality,
}: ExtrudedTextProps) => {
  const quality = useSceneQuality(previewQuality);
  const geometry = useMemo(() => {
    const font = new FontLoader().parse(
      helvetikerBold as Parameters<FontLoader['parse']>[0],
    );
    const geo = new TextGeometry(text, {
      font,
      size,
      depth,
      curveSegments: byQuality(quality, 3, 8),
      bevelEnabled: true,
      bevelThickness: depth * 0.12,
      bevelSize: size * 0.03,
      bevelSegments: byQuality(quality, 1, 3),
    });
    geo.center();
    return geo;
  }, [text, size, depth, quality]);

  return (
    <mesh geometry={geometry} position={position} rotation={rotation}>
      <MaterialFor material={material} color={color} />
    </mesh>
  );
};
