import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {BeatSync, useAudioData} from '@gmotion/audio';

/**
 * Demo da Fase 9: timeline reagindo ao áudio.
 * Requer o JSON de análise gerado offline:
 *   pnpm --filter @gmotion/audio run analyze <path>/apps/studio/public/capcut/trilha.MP3
 */
export const AUDIO_SYNC_DURATION = 450; // 15s @ 30fps (trilha tem 15.23s)

const AUDIO_SRC = 'capcut/trilha.MP3';
const ANALYSIS_SRC = 'capcut/trilha.MP3.analysis.json';

const AmplitudeBars = () => {
  const frame = useCurrentFrame();
  const data = useAudioData(staticFile(ANALYSIS_SRC));
  if (!data) return null;

  const barCount = 24;
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 200,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 12,
        height: 300,
      }}
    >
      {Array.from({length: barCount}, (_, i) => {
        // Cada barra mostra a amplitude de um frame recente (histórico deslizante).
        const amplitude = data.getAmplitudeAtFrame(frame - (barCount - 1 - i));
        return (
          <div
            key={i}
            style={{
              width: 24,
              height: 20 + amplitude * 280,
              borderRadius: 12,
              background: i === barCount - 1 ? '#ff3355' : '#3355ff',
              opacity: 0.4 + amplitude * 0.6,
            }}
          />
        );
      })}
    </div>
  );
};

const BeatFlash = () => {
  const frame = useCurrentFrame();
  const data = useAudioData(staticFile(ANALYSIS_SRC));
  if (!data) return null;

  const beatFrame = data.lastBeatFrameAtOrBefore(frame);
  const sinceBeat = beatFrame === null ? Infinity : frame - beatFrame;
  const intensity = sinceBeat < 6 ? 1 - sinceBeat / 6 : 0;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 40%, rgba(255,51,85,${intensity * 0.25}), transparent 60%)`,
      }}
    />
  );
};

export const AudioSyncShowcase = () => {
  return (
    <AbsoluteFill style={{background: '#0b0b12', fontFamily: 'Arial, sans-serif'}}>
      <Audio src={staticFile(AUDIO_SRC)} />
      <BeatFlash />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <BeatSync
          analysisUrl={staticFile(ANALYSIS_SRC)}
          preset="pulse"
          decayFrames={8}
        >
          <div
            style={{
              color: 'white',
              fontSize: 140,
              fontWeight: 900,
              letterSpacing: 8,
              textShadow: '0 0 60px rgba(51,85,255,0.8)',
            }}
          >
            GMOTION
          </div>
        </BeatSync>
        <div style={{color: '#8899ff', fontSize: 40, marginTop: 24}}>
          pulsando no beat — 129 BPM detectado
        </div>
      </AbsoluteFill>
      <AmplitudeBars />
    </AbsoluteFill>
  );
};
