import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {parseCubeLut, type CubeLut} from './cube';

/**
 * Carrega e parseia um arquivo .cube (via staticFile). Usa delayRender —
 * o Remotion espera a LUT antes de renderizar. Determinístico (arquivo fixo).
 */
export const useCubeLut = (url: string): CubeLut | null => {
  const [lut, setLut] = useState<CubeLut | null>(null);
  const [handle] = useState(() => delayRender(`Carregando LUT: ${url}`));

  useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar ${url}`);
        return response.text();
      })
      .then((text) => {
        if (cancelled) return;
        setLut(parseCubeLut(text));
        continueRender(handle);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        cancelRender(error);
      });
    return () => {
      cancelled = true;
    };
  }, [url, handle]);

  return lut;
};
