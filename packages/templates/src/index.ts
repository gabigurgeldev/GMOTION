export {
  ViralReel,
  viralReelDuration,
  type ViralReelProps,
  type ViralReelScene,
} from './ViralReel';
export {Ad15s, AD_15S_DURATION, type Ad15sProps} from './Ad15s';
export {
  ChannelIntro,
  CHANNEL_INTRO_DURATION,
  type ChannelIntroProps,
} from './ChannelIntro';

/** Catálogo — consumido pelo ai-director (Fase 8). */
export const allTemplateNames = [
  'viral-reel',
  'ad-15s',
  'channel-intro',
] as const;

export type TemplateName = (typeof allTemplateNames)[number];
