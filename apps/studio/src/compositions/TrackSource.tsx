import {AbsoluteFill, useCurrentFrame} from 'remotion';

/**
 * Fonte sintética pro demo de tracking (Fase 15): bola laranja se movendo
 * suave sobre fundo com textura. Renderizada UMA vez pra
 * public/track-demo/source.mp4 e trackeada offline pelo CLI — ground truth
 * conhecido: ballPosition() abaixo.
 */
export const TRACK_SOURCE_DURATION = 180; // 6s @ 30fps

export const ballPosition = (frame: number): {x: number; y: number} => {
  const t = frame / 30;
  return {
    x: 540 + Math.sin(t * 0.9) * 320,
    y: 760 + Math.sin(t * 0.55 + 1.2) * 420,
  };
};

export const TrackSource = () => {
  const frame = useCurrentFrame();
  const {x, y} = ballPosition(frame);

  return (
    <AbsoluteFill style={{background: '#101018'}}>
      {/* textura de fundo estática (linhas diagonais) */}
      <AbsoluteFill
        style={{
          background:
            'repeating-linear-gradient(45deg, #181828 0 40px, #101018 40px 80px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 60,
          top: y - 60,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #ffb347, #e2611b 70%)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        }}
      />
    </AbsoluteFill>
  );
};
