/**
 * Easings puros (t em [0,1] -> [0,1], exceto overshoots como out-back).
 */

export type EasingName =
  | 'linear'
  | 'in-quad'
  | 'out-quad'
  | 'in-out-quad'
  | 'in-cubic'
  | 'out-cubic'
  | 'in-out-cubic'
  | 'out-expo'
  | 'out-back';

export const easings: Record<EasingName, (t: number) => number> = {
  linear: (t) => t,
  'in-quad': (t) => t * t,
  'out-quad': (t) => 1 - (1 - t) * (1 - t),
  'in-out-quad': (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2),
  'in-cubic': (t) => t ** 3,
  'out-cubic': (t) => 1 - (1 - t) ** 3,
  'in-out-cubic': (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  'out-expo': (t) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t)),
  'out-back': (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
  },
};

export const ease = (name: EasingName, t: number): number => easings[name](t);
