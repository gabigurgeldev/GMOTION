import {CapcutComposition, parseCapcutTimeline} from '@gmotion/capcut/render';
import rawTimeline from '../generated/capcut-timeline.json';

/**
 * Composição alimentada por um draft CapCut importado.
 * Gere o JSON com:
 *   pnpm --filter @gmotion/capcut import "<pastaDoDraft>" \
 *     --out apps/studio/src/generated/capcut-timeline.json \
 *     --assets apps/studio/public
 */
export const capcutTimeline = parseCapcutTimeline(rawTimeline);
export const CAPCUT_DURATION = capcutTimeline.durationInFrames;
export const CAPCUT_FPS = capcutTimeline.fps;
export const CAPCUT_WIDTH = capcutTimeline.width;
export const CAPCUT_HEIGHT = capcutTimeline.height;

export const CapcutImported = () => <CapcutComposition timeline={capcutTimeline} />;
