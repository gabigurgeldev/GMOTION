import {useEffect, useMemo, useState} from 'react';
import {cancelRender, continueRender, delayRender, useVideoConfig} from 'remotion';
import {amplitudeAtFrame, isBeatAt, lastBeatAtOrBefore} from './analysis';
import type {AudioAnalysis} from './types';

export type AudioDataHandle = {
  analysis: AudioAnalysis;
  /** Amplitude (0-1) no frame da COMPOSIÇÃO (converte fps internamente). */
  getAmplitudeAtFrame: (frame: number) => number;
  /** Há beat a até `toleranceFrames` do frame da composição? Default: 2. */
  isBeatAtFrame: (frame: number, toleranceFrames?: number) => boolean;
  /** Frame (da composição) do último beat ≤ frame, ou null. */
  lastBeatFrameAtOrBefore: (frame: number) => number | null;
};

/**
 * Carrega o JSON de análise gerado offline pelo CLI.
 * `analysisUrl` deve vir de `staticFile('...analysis.json')`.
 * Usa delayRender: o Remotion espera o fetch antes de renderizar o frame —
 * o resultado é determinístico porque o JSON é fixo.
 */
export const useAudioData = (analysisUrl: string): AudioDataHandle | null => {
  const {fps} = useVideoConfig();
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [handle] = useState(() => delayRender(`Carregando análise de áudio: ${analysisUrl}`));

  useEffect(() => {
    let cancelled = false;
    fetch(analysisUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ao buscar ${analysisUrl}`);
        }
        return response.json() as Promise<AudioAnalysis>;
      })
      .then((data) => {
        if (cancelled) return;
        setAnalysis(data);
        continueRender(handle);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        cancelRender(error);
      });
    return () => {
      cancelled = true;
    };
  }, [analysisUrl, handle]);

  return useMemo(() => {
    if (!analysis) return null;
    return {
      analysis,
      getAmplitudeAtFrame: (frame: number) => {
        const envelopeFrame = Math.round((frame / fps) * analysis.fps);
        return amplitudeAtFrame(analysis.amplitudeEnvelope, envelopeFrame);
      },
      isBeatAtFrame: (frame: number, toleranceFrames = 2) => {
        return isBeatAt(analysis.beats, frame / fps, toleranceFrames / fps);
      },
      lastBeatFrameAtOrBefore: (frame: number) => {
        const beat = lastBeatAtOrBefore(analysis.beats, frame / fps);
        return beat === null ? null : Math.round(beat * fps);
      },
    };
  }, [analysis, fps]);
};
