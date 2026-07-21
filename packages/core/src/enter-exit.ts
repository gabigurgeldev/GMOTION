/**
 * Funções puras de progresso de entrada/saída.
 * Tudo aqui é função pura do frame — sem hooks, sem estado —
 * para manter o determinismo exigido pelo Remotion e permitir teste isolado.
 */

export type EnterExitParams = {
  /** Frame atual (0-based, relativo à Sequence). */
  frame: number;
  /** Duração total da camada em frames. */
  durationInFrames: number;
  /** Quantos frames dura a animação de entrada. */
  enterFrames: number;
  /** Quantos frames dura a animação de saída (0 = sem saída). */
  exitFrames?: number;
};

export type EnterExitProgress = {
  /** 0 → 1 durante a entrada; 1 depois. */
  enter: number;
  /** 1 antes da saída; 1 → 0 durante os últimos `exitFrames`. */
  exit: number;
  /**
   * Progresso combinado: enter * exit.
   * Útil como opacidade/escala única quando entrada e saída usam o mesmo canal.
   */
  combined: number;
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

/**
 * Calcula progresso de entrada e saída de uma camada.
 *
 * @example
 * calcEnterExit({frame: 0, durationInFrames: 60, enterFrames: 15, exitFrames: 10})
 * // => {enter: 0, exit: 1, combined: 0}
 * calcEnterExit({frame: 60, durationInFrames: 60, enterFrames: 15, exitFrames: 10})
 * // => {enter: 1, exit: 0, combined: 0}
 */
export const calcEnterExit = ({
  frame,
  durationInFrames,
  enterFrames,
  exitFrames = 0,
}: EnterExitParams): EnterExitProgress => {
  if (durationInFrames <= 0) {
    throw new Error('durationInFrames deve ser > 0');
  }

  const enter = enterFrames <= 0 ? 1 : clamp01(frame / enterFrames);

  const exitStart = durationInFrames - exitFrames;
  const exit =
    exitFrames <= 0 ? 1 : 1 - clamp01((frame - exitStart) / exitFrames);

  return {enter, exit, combined: enter * exit};
};
