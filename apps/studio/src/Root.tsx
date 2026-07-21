import {Composition} from 'remotion';
import {HelloGmotion} from './compositions/HelloGmotion';
import {
  PresetShowcase,
  PRESET_SHOWCASE_DURATION,
} from './compositions/PresetShowcase';
import {
  TransitionShowcase,
  TRANSITION_SHOWCASE_DURATION,
} from './compositions/TransitionShowcase';
import {
  ThreeShowcase,
  THREE_SHOWCASE_DURATION,
} from './compositions/ThreeShowcase';
import {
  EffectsShowcase,
  EFFECTS_SHOWCASE_DURATION,
} from './compositions/EffectsShowcase';
import {
  GraphicsShowcase,
  GRAPHICS_SHOWCASE_DURATION,
} from './compositions/GraphicsShowcase';
import {
  Ad15s,
  AD_15S_DURATION,
  ChannelIntro,
  CHANNEL_INTRO_DURATION,
  ViralReel,
  viralReelDuration,
} from '@gmotion/templates';
import {
  AiDirected,
  AI_DIRECTED_DURATION,
  AI_DIRECTED_FPS,
  AI_DIRECTED_HEIGHT,
  AI_DIRECTED_WIDTH,
} from './compositions/AiDirected';
import {
  CapcutImported,
  CAPCUT_DURATION,
  CAPCUT_FPS,
  CAPCUT_WIDTH,
  CAPCUT_HEIGHT,
} from './compositions/CapcutImported';
import {FimeiPromo} from './fimei/FimeiPromo';
import {FIMEI_PROMO_DURATION, FPS as FIMEI_FPS} from './fimei/timing';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HelloGmotion"
        component={HelloGmotion}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PresetShowcase"
        component={PresetShowcase}
        durationInFrames={PRESET_SHOWCASE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TransitionShowcase"
        component={TransitionShowcase}
        durationInFrames={TRANSITION_SHOWCASE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ThreeShowcase"
        component={ThreeShowcase}
        durationInFrames={THREE_SHOWCASE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="EffectsShowcase"
        component={EffectsShowcase}
        durationInFrames={EFFECTS_SHOWCASE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="GraphicsShowcase"
        component={GraphicsShowcase}
        durationInFrames={GRAPHICS_SHOWCASE_DURATION}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TemplateViralReel"
        component={ViralReel}
        durationInFrames={viralReelDuration({sceneCount: 4})}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          scenes: [
            {text: 'Você sabia?'},
            {text: 'Dá pra editar vídeo', subtext: 'só com código'},
            {text: 'Sem After Effects'},
            {text: 'Segue o canal', subtext: '@gmotion'},
          ],
        }}
      />
      <Composition
        id="TemplateAd15s"
        component={Ad15s}
        durationInFrames={AD_15S_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          productName: 'Fone XYZ Pro',
          price: 199.9,
          oldPrice: 349.9,
          cta: 'SÓ HOJE',
        }}
      />
      <Composition
        id="TemplateChannelIntro"
        component={ChannelIntro}
        durationInFrames={CHANNEL_INTRO_DURATION}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          channelName: 'GMOTION',
          slogan: 'motion em código',
          material: 'metal' as const,
        }}
      />
      <Composition
        id="AiDirected"
        component={AiDirected}
        durationInFrames={AI_DIRECTED_DURATION}
        fps={AI_DIRECTED_FPS}
        width={AI_DIRECTED_WIDTH}
        height={AI_DIRECTED_HEIGHT}
      />
      <Composition
        id="CapcutImported"
        component={CapcutImported}
        durationInFrames={CAPCUT_DURATION}
        fps={CAPCUT_FPS}
        width={CAPCUT_WIDTH}
        height={CAPCUT_HEIGHT}
      />
      <Composition
        id="FimeiPromo"
        component={FimeiPromo}
        durationInFrames={FIMEI_PROMO_DURATION}
        fps={FIMEI_FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
