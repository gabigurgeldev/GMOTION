export type TrackFrame = {
  /** Frame no fps de AMOSTRAGEM do tracker (não da composição). */
  frame: number;
  /** Posição em px do vídeo ORIGINAL. */
  x: number;
  y: number;
  /** Escala relativa ao frame inicial (tracker atual: sempre 1). */
  scale: number;
  /** Rotação em graus (tracker atual: sempre 0). */
  rotation: number;
  /** Confiança 0-1 do match (correlação NCC). */
  confidence: number;
};

export type TrackData = {
  version: 1;
  sourceFile: string;
  /** Dimensões do vídeo original. */
  width: number;
  height: number;
  /** FPS de amostragem do tracker. */
  fps: number;
  frames: TrackFrame[];
};
