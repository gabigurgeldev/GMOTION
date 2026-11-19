import type {CSSProperties, ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {
  loopPresets,
  resolvePreset,
  type LoopPresetName,
  type PresetStyle,
} from '@gmotion/presets';
import {useAudioData} from './use-audio-data';

export type BeatSyncProps = {
  children: ReactNode;
  /** URL do JSON de análise (via `staticFile`). */
  analysisUrl: string;
  /** Preset de ênfase de @gmotion/presets disparado em cada beat. Default: pulse. */
  preset?: LoopPresetName;
  /** Opções do preset (ver factories em @gmotion/presets). */
  presetOptions?: object;
  /** Janela do efeito após cada beat, em frames. Default: 8. */
  decayFrames?: number;
  style?: CSSProperties;
};

/**
 * Aplica um preset automaticamente em cada batida detectada — sem cravar
 * frames na mão. A cada beat, o preset roda por `decayFrames` frames.
 *
 * @example
 * <BeatSync analysisUrl={staticFile('trilha.MP3.analysis.json')} preset="pulse">
 *   <Logo />
 * </BeatSync>
 */
export const BeatSync = ({
  children,
  analysisUrl,
  preset = 'pulse',
  presetOptions,
  decayFrames = 8,
  style,
}: BeatSyncProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const data = useAudioData(analysisUrl);

  let presetStyle: PresetStyle | undefined;
  if (data) {
    const beatFrame = data.lastBeatFrameAtOrBefore(frame);
    if (beatFrame !== null) {
      const sinceBeat = frame - beatFrame;
      if (sinceBeat < decayFrames) {
        // Para o pulse: 1 ciclo completo exatamente dentro da janela do beat.
        const options =
          preset === 'pulse' && !presetOptions
            ? {speed: fps / decayFrames, intensity: 0.12}
            : presetOptions;
        presetStyle = resolvePreset(loopPresets, preset, options)({
          frame: sinceBeat,
          fps,
          durationInFrames: decayFrames,
          progress: sinceBeat / decayFrames,
        });
      }
    }
  }

  return <div style={{...style, ...presetStyle}}>{children}</div>;
};
