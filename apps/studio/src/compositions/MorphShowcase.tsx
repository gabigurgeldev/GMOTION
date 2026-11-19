import {AbsoluteFill} from 'remotion';
import {MorphShape} from '@gmotion/morph';

/**
 * Demo da Fase 14 — logo/ícone morfando entre 3 formas:
 * estrela → círculo → raio, com easing por segmento.
 */
export const MORPH_DURATION = 180; // 6s @ 30fps

const STAR =
  'M 50 5 L 61 35 L 95 35 L 68 55 L 78 90 L 50 70 L 22 90 L 32 55 L 5 35 L 39 35 Z';
// Círculo como 4 arcos cúbicos (path fechado de 1 subpath).
const CIRCLE =
  'M 50 10 C 72 10 90 28 90 50 C 90 72 72 90 50 90 C 28 90 10 72 10 50 C 10 28 28 10 50 10 Z';
const BOLT = 'M 55 5 L 25 55 L 45 55 L 40 95 L 75 40 L 52 40 Z';

export const MorphShowcase = () => {
  return (
    <AbsoluteFill
      style={{background: '#0b0b12', justifyContent: 'center', alignItems: 'center'}}
    >
      <div style={{width: 700}}>
        <MorphShape
          paths={[STAR, CIRCLE, BOLT]}
          durationInFrames={MORPH_DURATION}
          viewBox="0 0 100 100"
          fill="#ffcc33"
          stroke="#fff"
          strokeWidth={0.8}
        />
      </div>
      <div style={{color: '#667', fontSize: 36, fontFamily: 'Arial', marginTop: 40}}>
        estrela → círculo → raio (morphSequence)
      </div>
    </AbsoluteFill>
  );
};
