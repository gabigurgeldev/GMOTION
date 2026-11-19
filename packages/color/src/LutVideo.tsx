import {useEffect, useMemo, useRef} from 'react';
import {useThree} from '@react-three/fiber';
import {
  AbsoluteFill,
  getRemotionEnvironment,
  useVideoConfig,
  Video,
} from 'remotion';
import {ThreeCanvas, useOffthreadVideoTexture, useVideoTexture} from '@remotion/three';
import type {Texture} from 'three';
import {useCubeLut} from './use-cube-lut';
import {lutToDataTexture, LUT_FRAGMENT_SHADER, LUT_VERTEX_SHADER} from './lut-texture';
import type {CubeLut} from './cube';

export type LutVideoProps = {
  /** URL do vídeo (staticFile). */
  src: string;
  /** URL do .cube (staticFile). */
  lutSrc: string;
  /** Mistura 0-1 entre original e graduado. Default: 1. */
  intensity?: number;
  muted?: boolean;
};

const LutPlane = ({texture, lut, intensity}: {texture: Texture; lut: CubeLut; intensity: number}) => {
  const advance = useThree((state) => state.advance);
  const lutTexture = useMemo(() => lutToDataTexture(lut), [lut]);

  // Em render (frameloop "never"), a textura do vídeo chega DEPOIS do advance
  // do frame — sem este advance extra o canvas congela vazio/obsoleto.
  useEffect(() => {
    advance(performance.now());
  }, [advance, texture, lutTexture, intensity]);
  const uniforms = useMemo(
    () => ({
      map: {value: texture},
      lutTex: {value: lutTexture},
      lutSize: {value: lut.size},
      intensity: {value: intensity},
    }),
    [texture, lutTexture, lut.size, intensity],
  );
  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        vertexShader={LUT_VERTEX_SHADER}
        fragmentShader={LUT_FRAGMENT_SHADER}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const RenderTexture = ({src, lut, intensity}: {src: string; lut: CubeLut; intensity: number}) => {
  const texture = useOffthreadVideoTexture({src});
  return texture ? <LutPlane texture={texture} lut={lut} intensity={intensity} /> : null;
};

const PreviewTexture = ({
  videoRef,
  lut,
  intensity,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  lut: CubeLut;
  intensity: number;
}) => {
  const texture = useVideoTexture(videoRef);
  return texture ? <LutPlane texture={texture} lut={lut} intensity={intensity} /> : null;
};

/**
 * LUT 3D (.cube) DE VERDADE aplicada em vídeo via shader GLSL (three):
 * sampling trilinear — termos cruzados preservados (teal/orange etc.),
 * ao contrário da aproximação 1D do <ColorGrade lut>.
 * O vertex shader ignora a câmera (fullscreen quad determinístico).
 *
 * @example
 * <LutVideo src={staticFile('clip.mp4')} lutSrc={staticFile('luts/warm.cube')} />
 */
export const LutVideo = ({src, lutSrc, intensity = 1, muted = true}: LutVideoProps) => {
  const {width, height} = useVideoConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lut = useCubeLut(lutSrc);
  const {isRendering} = getRemotionEnvironment();

  return (
    <AbsoluteFill>
      {isRendering ? null : (
        <Video
          ref={videoRef}
          src={src}
          muted={muted}
          style={{position: 'absolute', opacity: 0, width: 1, height: 1}}
        />
      )}
      {lut ? (
        <ThreeCanvas width={width} height={height}>
          {isRendering ? (
            <RenderTexture src={src} lut={lut} intensity={intensity} />
          ) : (
            <PreviewTexture videoRef={videoRef} lut={lut} intensity={intensity} />
          )}
        </ThreeCanvas>
      ) : null}
    </AbsoluteFill>
  );
};
