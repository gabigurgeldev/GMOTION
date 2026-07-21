/**
 * Tipos base dos presets.
 * Preset = função pura (frame, fps, durationInFrames, progress) -> estilo.
 * Nunca hooks aqui — determinismo total.
 */

export type PresetParams = {
  /** Frame atual, relativo à janela do preset (0-based). */
  frame: number;
  /** Frames por segundo da composição. */
  fps: number;
  /** Duração da janela do preset em frames. */
  durationInFrames: number;
  /** Progresso 0 → 1 dentro da janela (sem easing — o preset aplica o seu). */
  progress: number;
};

export type PresetStyle = {
  transform?: string;
  opacity?: number;
  filter?: string;
};

export type PresetFn = (params: PresetParams) => PresetStyle;

export type Direction = 'left' | 'right' | 'up' | 'down';
