import {useCurrentFrame, useVideoConfig} from 'remotion';
import {calcEnterExit, type EnterExitProgress} from './enter-exit';

export type UseEnterExitOptions = {
  /** Frames de entrada. Default: 15. */
  enterFrames?: number;
  /** Frames de saída. Default: 0 (sem saída). */
  exitFrames?: number;
  /**
   * Duração da camada. Default: durationInFrames da composição/Sequence atual
   * (via useVideoConfig).
   */
  durationInFrames?: number;
};

/**
 * Hook que calcula progresso de entrada/saída da camada atual.
 * Wrapper fino sobre a função pura `calcEnterExit` — a lógica fica testável
 * fora do React.
 *
 * @example
 * const {enter, exit, combined} = useEnterExit({enterFrames: 15, exitFrames: 10});
 * return <div style={{opacity: combined}} />;
 */
export const useEnterExit = ({
  enterFrames = 15,
  exitFrames = 0,
  durationInFrames,
}: UseEnterExitOptions = {}): EnterExitProgress => {
  const frame = useCurrentFrame();
  const config = useVideoConfig();

  return calcEnterExit({
    frame,
    durationInFrames: durationInFrames ?? config.durationInFrames,
    enterFrames,
    exitFrames,
  });
};
