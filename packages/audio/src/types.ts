/**
 * Resultado da análise offline de um arquivo de áudio.
 * Gerado pelo CLI (`pnpm --filter @gmotion/audio run analyze <arquivo>`),
 * persistido como `<arquivo>.analysis.json` e consumido no render via
 * `useAudioData` — a análise NUNCA roda dentro do render (determinismo).
 */
export type AudioAnalysis = {
  version: 1;
  /** Caminho do arquivo de origem (relativo a onde o CLI rodou). */
  sourceFile: string;
  /** Sample rate usado na análise (mono). */
  sampleRate: number;
  durationInSeconds: number;
  /** FPS usado para pré-calcular o envelope (1 valor por frame). */
  fps: number;
  /** BPM estimado (0 quando não há onsets suficientes). */
  bpm: number;
  /** Timestamps (segundos) de cada batida na grade alinhada ao BPM. */
  beats: number[];
  /** Timestamps (segundos) de transientes/picos detectados. */
  onsets: number[];
  /** RMS por frame (índice = frame no fps da análise), normalizado 0-1. */
  amplitudeEnvelope: number[];
};
