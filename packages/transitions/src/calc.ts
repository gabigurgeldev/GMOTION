/**
 * Cálculos puros das transições — testáveis sem React.
 * progress sempre 0 -> 1 ao longo da transição.
 */

export type TransitionDirection = 'left' | 'right' | 'up' | 'down';

/** Envelope em sino: 0 nas pontas, 1 no meio. */
export const bell = (progress: number): number =>
  Math.sin(Math.PI * Math.min(1, Math.max(0, progress)));

/**
 * Deslocamento (em % da tela) das duas cenas num whip-pan.
 * Cena que sai vai de 0% a -100% na direção; a que entra vem de +100% a 0%.
 */
export const whipPanOffset = (params: {
  progress: number;
  direction: TransitionDirection;
  phase: 'exiting' | 'entering';
}): {x: number; y: number} => {
  const {progress, direction, phase} = params;
  // Easing agressivo (in-out quintic) para o efeito "chicote"
  const t =
    progress < 0.5
      ? 16 * progress ** 5
      : 1 - (-2 * progress + 2) ** 5 / 2;

  const travel = phase === 'exiting' ? -t : 1 - t;
  const sign = direction === 'left' || direction === 'up' ? 1 : -1;
  const horizontal = direction === 'left' || direction === 'right';

  // + 0 normaliza -0 para 0
  return {
    x: horizontal ? travel * 100 * sign + 0 : 0,
    y: horizontal ? 0 : travel * 100 * sign + 0,
  };
};

/**
 * Amplitude do shake num shake-cut: pico no corte (progress 0.5), zero nas pontas.
 */
export const shakeCutEnvelope = (progress: number): number =>
  1 - Math.min(1, Math.abs(progress - 0.5) * 2);

/**
 * Qual cena aparece num corte seco em progress 0.5.
 */
export const hardCutVisible = (
  progress: number,
  phase: 'exiting' | 'entering',
): boolean => (phase === 'exiting' ? progress < 0.5 : progress >= 0.5);

/**
 * Escala do zoom-glitch: cena que sai infla, a que entra desinfla até 1.
 */
export const zoomGlitchScale = (params: {
  progress: number;
  phase: 'exiting' | 'entering';
  strength: number;
}): number => {
  const {progress, phase, strength} = params;
  if (phase === 'exiting') {
    return 1 + progress * strength;
  }
  return 1 + (1 - progress) * strength;
};

/**
 * Avanço do wipe (inset em %) do rgb-split-wipe para a cena que entra.
 * Devolve o clip-path inset conforme a direção.
 */
export const wipeInset = (params: {
  progress: number;
  direction: TransitionDirection;
}): string => {
  const {progress, direction} = params;
  const remaining = (1 - Math.min(1, Math.max(0, progress))) * 100;
  switch (direction) {
    case 'left':
      return `inset(0 ${remaining}% 0 0)`;
    case 'right':
      return `inset(0 0 0 ${remaining}%)`;
    case 'up':
      return `inset(0 0 ${remaining}% 0)`;
    case 'down':
      return `inset(${remaining}% 0 0 0)`;
  }
};
