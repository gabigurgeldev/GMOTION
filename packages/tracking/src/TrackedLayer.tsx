import type {CSSProperties, ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {interpolateTrack} from './tracker';
import {useTrackData} from './use-track-data';

export type TrackedLayerProps = {
  children: ReactNode;
  /** URL do track.json (staticFile). */
  trackUrl: string;
  /** Deslocamento fixo em px do vídeo, relativo ao ponto trackeado. */
  offsetX?: number;
  offsetY?: number;
  /** O conteúdo é centrado no ponto (transform -50%). Default: true. */
  centered?: boolean;
  style?: CSSProperties;
};

/**
 * Posiciona o conteúdo filho seguindo o ponto trackeado por frame,
 * interpolando entre amostras (tracker roda em fps menor que a composição).
 * Coordenadas do track são px do vídeo original — o componente assume que o
 * vídeo preenche o frame da composição (objectFit cover/1:1; escala interna).
 */
export const TrackedLayer = ({
  children,
  trackUrl,
  offsetX = 0,
  offsetY = 0,
  centered = true,
  style,
}: TrackedLayerProps) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const data = useTrackData(trackUrl);

  if (!data || data.frames.length === 0) return null;

  // Frame da composição → frame do tracker.
  const t = (frame / fps) * data.fps;
  const point = interpolateTrack(data.frames, t);

  // Escala px do vídeo → px da composição.
  const scaleX = width / data.width;
  const scaleY = height / data.height;
  const x = (point.x + offsetX) * scaleX;
  const y = (point.y + offsetY) * scaleY;

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: [
          centered ? 'translate(-50%, -50%)' : '',
          point.scale !== 1 ? `scale(${point.scale})` : '',
          point.rotation !== 0 ? `rotate(${point.rotation}deg)` : '',
        ]
          .filter(Boolean)
          .join(' '),
        ...style,
      }}
    >
      {children}
    </div>
  );
};
