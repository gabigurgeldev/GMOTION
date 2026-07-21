import {
  TimelineComposition,
  parseTimeline,
  timelineDuration,
} from '@gmotion/ai-director';
import rawTimeline from '../generated/ai-timeline.json';

/**
 * Composição alimentada pelo ai-director.
 * O CLI (`pnpm --filter @gmotion/ai-director generate "..."`) sobrescreve
 * src/generated/ai-timeline.json; o compilador transforma o JSON em JSX.
 */
export const aiTimeline = parseTimeline(rawTimeline);
export const AI_DIRECTED_DURATION = timelineDuration(aiTimeline);
export const AI_DIRECTED_FPS = aiTimeline.fps;
export const AI_DIRECTED_WIDTH = aiTimeline.width;
export const AI_DIRECTED_HEIGHT = aiTimeline.height;

export const AiDirected = () => <TimelineComposition timeline={aiTimeline} />;
