/**
 * Entrada BROWSER-SAFE do pacote (o que o Remotion bundla).
 * O lado Node (decode/analyze/cli) fica fora daqui de propósito —
 * use o CLI: `pnpm --filter @gmotion/audio run analyze <arquivo>`.
 */
export type {AudioAnalysis} from './types';
export {
  computeRmsEnvelope,
  detectOnsets,
  estimateBpm,
  pickBeats,
  amplitudeAtFrame,
  isBeatAt,
  lastBeatAtOrBefore,
  type OnsetOptions,
  type BpmOptions,
} from './analysis';
export {useAudioData, type AudioDataHandle} from './use-audio-data';
export {BeatSync, type BeatSyncProps} from './BeatSync';
