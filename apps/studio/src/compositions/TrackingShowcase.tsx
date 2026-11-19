import {AbsoluteFill, Loop, OffthreadVideo, staticFile} from 'remotion';
import {TrackedLayer} from '@gmotion/tracking';

/**
 * Demo da Fase 15 — label "colado" na bola em movimento do vídeo de fundo.
 * Preparação (offline, uma vez):
 *   npx remotion render TrackSource public/track-demo/source.mp4
 *   pnpm --filter @gmotion/tracking run track <abs>/public/track-demo/source.mp4 --point 540,880
 */
export const TRACKING_DURATION = 180;

export const TrackingShowcase = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Loop durationInFrames={TRACKING_DURATION}>
        <OffthreadVideo
          src={staticFile('track-demo/source.mp4')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          muted
        />
      </Loop>
      <TrackedLayer trackUrl={staticFile('track-demo/source.mp4.track.json')} offsetY={-110}>
        <div
          style={{
            background: '#fff',
            color: '#111',
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            fontSize: 34,
            padding: '10px 22px',
            borderRadius: 10,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          }}
        >
          TRACKED ⤵
        </div>
      </TrackedLayer>
    </AbsoluteFill>
  );
};
