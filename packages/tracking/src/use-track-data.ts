import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import type {TrackData} from './types';

/** Carrega o track.json gerado offline (padrão do useAudioData). */
export const useTrackData = (trackUrl: string): TrackData | null => {
  const [data, setData] = useState<TrackData | null>(null);
  const [handle] = useState(() => delayRender(`Carregando track: ${trackUrl}`));

  useEffect(() => {
    let cancelled = false;
    fetch(trackUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar ${trackUrl}`);
        return response.json() as Promise<TrackData>;
      })
      .then((json) => {
        if (cancelled) return;
        setData(json);
        continueRender(handle);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        cancelRender(error);
      });
    return () => {
      cancelled = true;
    };
  }, [trackUrl, handle]);

  return data;
};
