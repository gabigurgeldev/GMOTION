import {AbsoluteFill} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {
  filmBurn,
  lightLeak,
  rgbSplitWipe,
  shakeCut,
  whipPan,
  zoomGlitch,
} from '@gmotion/transitions';
import {AnimatedLayer} from '@gmotion/presets';

/**
 * Demo da Fase 3: 7 cenas ligadas pelas 6 transições do pacote.
 */

const SCENE_FRAMES = 55;
const TRANSITION_FRAMES = 14;

const Scene = ({label, hue}: {label: string; hue: number}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(160deg, hsl(${hue}, 60%, 16%), hsl(${hue + 40}, 70%, 8%))`,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <AnimatedLayer enter="pop-in" enterFrames={12}>
      <div
        style={{
          background: `hsl(${hue}, 80%, 55%)`,
          borderRadius: 32,
          padding: '60px 90px',
        }}
      >
        <span
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 72,
            fontWeight: 900,
            color: 'white',
          }}
        >
          {label}
        </span>
      </div>
    </AnimatedLayer>
  </AbsoluteFill>
);

const timing = linearTiming({durationInFrames: TRANSITION_FRAMES});

export const TRANSITION_SHOWCASE_DURATION =
  SCENE_FRAMES * 7 - TRANSITION_FRAMES * 6;

export const TransitionShowcase = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="zoom-glitch →" hue={260} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={zoomGlitch()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="rgb-split-wipe →" hue={200} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={rgbSplitWipe({direction: 'right'})}
        timing={timing}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="shake-cut →" hue={140} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={shakeCut()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="whip-pan →" hue={40} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={whipPan({direction: 'left'})}
        timing={timing}
      />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="light-leak →" hue={330} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={lightLeak()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="film-burn →" hue={20} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={filmBurn()} timing={timing} />

      <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene label="fim" hue={280} />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
