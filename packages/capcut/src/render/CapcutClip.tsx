import type {CSSProperties, ReactNode} from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {ClipSpec} from '../timeline/schema';
import {resolveTransformAtFrame, toCssTransform} from './transform';
import {renderNative} from './native';
import {animEnvelope, maskToCss, videoEffectsToFilter} from './apply-effects';

/**
 * Fator de calibração do tamanho de fonte do CapCut → px. O CapCut guarda
 * `size` numa escala relativa; ajustar na Fase 4 comparando com draft_cover.
 */
export const CAPCUT_FONT_SIZE_TO_PX = 10.8; // ~ width(1080)/100

/**
 * Assets absolutos (E:\..., /..., http:, file:) passam direto; caminhos
 * relativos são resolvidos via `staticFile` (servidos de apps/studio/public).
 */
const resolveSrc = (src: string): string =>
  /^([a-zA-Z]+:|\/|[A-Za-z]:[\\/])/.test(src) ? src : staticFile(src);

/** Conteúdo visual de um clip (sem posicionamento). */
const clipVisual = (clip: ClipSpec): ReactNode => {
  switch (clip.kind) {
    case 'image':
      return <Img src={resolveSrc(clip.src)} style={{display: 'block'}} />;
    case 'video':
      return (
        <OffthreadVideo
          src={resolveSrc(clip.src)}
          startFrom={clip.sourceStart}
          volume={clip.volume}
        />
      );
    case 'text':
      return (
        <div
          style={{
            fontSize: clip.fontSize * CAPCUT_FONT_SIZE_TO_PX,
            color: clip.color,
            fontFamily: 'Arial, sans-serif',
            fontWeight: 800,
            whiteSpace: 'pre',
            textAlign: 'center',
            lineHeight: 1.1,
            letterSpacing: '-0.01em',
            // Sombra/contorno para o texto ler em fundo claro OU escuro.
            textShadow:
              '0 2px 10px rgba(0,0,0,0.55), 0 6px 30px rgba(0,0,0,0.45), 0 0 2px rgba(0,0,0,0.6)',
            WebkitTextStroke: '1px rgba(0,0,0,0.28)',
            paintOrder: 'stroke fill',
          }}
        >
          {clip.text}
        </div>
      );
    case 'native':
      return renderNative(clip);
    case 'audio':
      return null;
  }
};

const PositionedClip = ({clip}: {clip: ClipSpec}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const t = resolveTransformAtFrame(clip, frame, {width, height});
  const env = animEnvelope(clip.effects, frame, clip.duration);

  // Layers nativas (three/shader) ocupam o frame inteiro (câmera própria).
  if (clip.kind === 'native') {
    return <AbsoluteFill style={{opacity: t.alpha * env.opacity}}>{clipVisual(clip)}</AbsoluteFill>;
  }

  const withEnv = {...t, scaleX: t.scaleX * env.scale, scaleY: t.scaleY * env.scale};
  const style: CSSProperties = {
    position: 'absolute',
    left: t.posX,
    top: t.posY,
    transform: toCssTransform(withEnv),
    opacity: t.alpha * env.opacity,
    transformOrigin: 'center center',
    filter: videoEffectsToFilter(clip.effects),
    ...(clip.mask ? maskToCss(clip.mask) : {}),
  };
  return <div style={style}>{clipVisual(clip)}</div>;
};

/** Renderiza um clip dentro da sua janela de tempo na track. */
export const CapcutClip = ({clip}: {clip: ClipSpec}) => {
  if (clip.kind === 'audio') {
    return (
      <Sequence from={clip.start} durationInFrames={clip.duration} name={clip.id}>
        <Audio src={resolveSrc(clip.src)} volume={clip.volume} startFrom={clip.sourceStart} />
      </Sequence>
    );
  }
  return (
    <Sequence from={clip.start} durationInFrames={clip.duration} name={clip.id} layout="none">
      <PositionedClip clip={clip} />
    </Sequence>
  );
};
