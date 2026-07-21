import {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender} from 'remotion';
import {Lottie, type LottieAnimationData} from '@remotion/lottie';

export type LottieLayerProps = {
  /** URL do JSON do Lottie (use staticFile() para assets locais). */
  src?: string;
  /** Alternativa: dados da animação já carregados. */
  animationData?: LottieAnimationData;
  /** Loop da animação. Default: true. */
  loop?: boolean;
  /** Velocidade de reprodução. Default: 1. */
  playbackRate?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Camada Lottie sincronizada com o playhead do Remotion via @remotion/lottie
 * (o componente oficial já deriva o tempo de useCurrentFrame — determinístico).
 * Passe `src` (fetch com delayRender) ou `animationData` direto.
 *
 * @example
 * <LottieLayer src={staticFile('confetti.json')} loop={false} />
 */
export const LottieLayer = ({
  src,
  animationData,
  loop = true,
  playbackRate = 1,
  className,
  style,
}: LottieLayerProps) => {
  const [data, setData] = useState<LottieAnimationData | null>(
    animationData ?? null,
  );
  const [handle] = useState(() =>
    animationData ? null : delayRender('Carregando Lottie JSON'),
  );

  useEffect(() => {
    if (!src || handle === null) {
      return;
    }
    let cancelled = false;
    fetch(src)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Lottie fetch falhou: ${res.status} ${src}`);
        }
        return res.json();
      })
      .then((json: LottieAnimationData) => {
        if (!cancelled) {
          setData(json);
          continueRender(handle);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          cancelRender(err);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [src, handle]);

  if (!data) {
    return null;
  }

  return (
    <Lottie
      animationData={data}
      loop={loop}
      playbackRate={playbackRate}
      className={className}
      style={style}
    />
  );
};
