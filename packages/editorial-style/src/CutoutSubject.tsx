import type {CSSProperties} from 'react';
import {Img, Loop, OffthreadVideo} from 'remotion';

export type CutoutSubjectProps = {
  /** Vídeo com alpha (.webm VP9) OU imagem PNG com alpha, JÁ processados. */
  src: string;
  /** É vídeo? Default: deduz pela extensão (.webm/.mov = vídeo). */
  video?: boolean;
  /** Loop do vídeo em frames (0 = sem loop). Default: 0. */
  loopDurationInFrames?: number;
  style?: CSSProperties;
};

/**
 * Sujeito recortado do fundo ("flutuando" sobre cor sólida) — só CONSOME
 * material já processado offline (scripts/cutout.mjs): remoção de fundo ao
 * vivo não entra no render determinístico. Ver README do pacote.
 */
export const CutoutSubject = ({
  src,
  video,
  loopDurationInFrames = 0,
  style,
}: CutoutSubjectProps) => {
  const isVideo = video ?? /\.(webm|mov|mp4)($|\?)/i.test(src);
  if (!isVideo) {
    return <Img src={src} style={{maxWidth: '100%', ...style}} />;
  }
  const player = (
    <OffthreadVideo src={src} transparent muted style={{maxWidth: '100%', ...style}} />
  );
  return loopDurationInFrames > 0 ? (
    <Loop durationInFrames={loopDurationInFrames} layout="none">
      {player}
    </Loop>
  ) : (
    player
  );
};
