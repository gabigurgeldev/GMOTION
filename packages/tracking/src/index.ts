/**
 * Entrada BROWSER-SAFE. Pipeline offline (decode/CLI) fica fora — use:
 * pnpm --filter @gmotion/tracking run track <video> --point x,y
 */
export type {TrackData, TrackFrame} from './types';
export {
  ncc,
  extractPatch,
  bestMatch,
  trackSequence,
  interpolateTrack,
  type GrayFrame,
  type TrackOptions,
  type MatchResult,
} from './tracker';
export {useTrackData} from './use-track-data';
export {TrackedLayer, type TrackedLayerProps} from './TrackedLayer';
