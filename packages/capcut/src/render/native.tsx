import type {ReactNode} from 'react';
import {
  GmotionThreeScene,
  ExtrudedText,
  Particles,
  FloatingImage,
  GltfModel,
} from '@gmotion/three-scenes';
import {
  Glow,
  ChromaticAberration,
  RgbShift,
  FilmGrain,
  Vignette,
  LightLeaks,
  ScreenShake,
} from '@gmotion/effects';
import type {ClipSpec} from '../timeline/schema';

/**
 * Registry das layers "nativas" — o que o CapCut NÃO consegue criar:
 * texto 3D, partículas, modelos .glb, shaders/efeitos AE. Reaproveita os
 * pacotes @gmotion/three-scenes e @gmotion/effects como matéria-prima.
 */

type Props = Record<string, unknown>;
const num = (p: Props, k: string, d: number) =>
  typeof p[k] === 'number' ? (p[k] as number) : d;
const str = (p: Props, k: string, d?: string) =>
  typeof p[k] === 'string' ? (p[k] as string) : d;

const renderThree = (component: string, p: Props): ReactNode => {
  // Fundo transparente: as layers nativas compõem sobre o edit do CapCut.
  switch (component) {
    case 'extruded-text':
      return (
        <GmotionThreeScene background="transparent">
          <ExtrudedText text={str(p, 'text', 'GMOTION')!} {...p} />
        </GmotionThreeScene>
      );
    case 'particles':
      return (
        <GmotionThreeScene background="transparent">
          <Particles count={num(p, 'count', 400)} {...p} />
        </GmotionThreeScene>
      );
    case 'floating-image':
      return (
        <GmotionThreeScene background="transparent">
          <FloatingImage src={str(p, 'src', '')!} {...p} />
        </GmotionThreeScene>
      );
    case 'gltf-model':
      return (
        <GmotionThreeScene background="transparent">
          <GltfModel src={str(p, 'src', '')!} {...p} />
        </GmotionThreeScene>
      );
    default:
      throw new Error(`Componente three desconhecido: ${component}`);
  }
};

const renderShader = (component: string, p: Props, children?: ReactNode): ReactNode => {
  switch (component) {
    case 'glow':
      return <Glow intensity={num(p, 'intensity', 20)}>{children}</Glow>;
    case 'chromatic-aberration':
      return <ChromaticAberration intensity={num(p, 'intensity', 4)}>{children}</ChromaticAberration>;
    case 'rgb-shift':
      return <RgbShift intensity={num(p, 'intensity', 6)}>{children}</RgbShift>;
    case 'screen-shake':
      return <ScreenShake intensity={num(p, 'intensity', 15)}>{children}</ScreenShake>;
    case 'film-grain':
      return <FilmGrain intensity={num(p, 'intensity', 0.12)} />;
    case 'vignette':
      return <Vignette intensity={num(p, 'intensity', 0.6)} />;
    case 'light-leaks':
      return <LightLeaks intensity={num(p, 'intensity', 0.8)} />;
    default:
      throw new Error(`Efeito/shader desconhecido: ${component}`);
  }
};

export const renderNative = (clip: Extract<ClipSpec, {kind: 'native'}>): ReactNode => {
  if (clip.native === 'three' || clip.native === 'particle') {
    return renderThree(clip.component, clip.props);
  }
  return renderShader(clip.component, clip.props);
};
