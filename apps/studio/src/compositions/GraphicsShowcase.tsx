import {AbsoluteFill, Series} from 'remotion';
import {
  AnimatedCounter,
  Badge,
  Callout,
  LowerThird,
  ProgressBar,
} from '@gmotion/graphics';
import {AnimatedLayer} from '@gmotion/presets';

/**
 * Demo da Fase 6: lower-third, callout, contador, barras + badges.
 * (LottieLayer documentado no README — precisa de um JSON em public/.)
 */

const SCENE_FRAMES = 75;

const Bg = ({hue}: {hue: number}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(170deg, hsl(${hue}, 45%, 16%), hsl(${hue + 40}, 55%, 7%))`,
    }}
  />
);

const Label = ({text}: {text: string}) => (
  <AbsoluteFill style={{alignItems: 'center', pointerEvents: 'none'}}>
    <span
      style={{
        marginTop: 120,
        fontFamily: 'monospace',
        fontSize: 50,
        color: '#9a9ab8',
      }}
    >
      {text}
    </span>
  </AbsoluteFill>
);

export const GRAPHICS_SHOWCASE_DURATION = SCENE_FRAMES * 4;

export const GraphicsShowcase = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Bg hue={250} />
        <Label text="gfx: lower-third" />
        <LowerThird
          name="Gabriel Gurgel"
          role="Motion Designer"
          accentColor="#ec4899"
          bottom={300}
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Bg hue={190} />
        <Label text="gfx: callout" />
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22d3ee, #6366f1)',
              transform: 'translateY(300px)',
            }}
          />
        </AbsoluteFill>
        <Callout
          label="Olha isso!"
          origin={{x: 320, y: 620}}
          target={{x: 520, y: 1180}}
          color="#facc15"
        />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Bg hue={140} />
        <Label text="gfx: animated-counter" />
        <AbsoluteFill
          style={{justifyContent: 'center', alignItems: 'center', gap: 40}}
        >
          <AnimatedCounter
            to={15000}
            prefix="R$ "
            durationInFrames={50}
            style={{fontSize: 150, color: 'white'}}
          />
          <AnimatedCounter
            to={99.9}
            decimals={1}
            suffix="%"
            durationInFrames={55}
            style={{fontSize: 90, color: '#4ade80'}}
          />
        </AbsoluteFill>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Bg hue={300} />
        <Label text="gfx: progress-bar + badge" />
        <AbsoluteFill
          style={{justifyContent: 'center', alignItems: 'center', gap: 60}}
        >
          <AnimatedLayer enter="pop-in" enterFrames={12}>
            <Badge borderColors={['#22d3ee', '#a78bfa']} borderSpeed={0.8}>
              OFERTA LIMITADA
            </Badge>
          </AnimatedLayer>
          <ProgressBar target={0.85} gradient={['#6366f1', '#ec4899']} width={700} height={30} />
          <ProgressBar target={0.55} color="#4ade80" width={700} height={30} startFrame={10} />
          <ProgressBar target={0.95} gradient={['#f59e0b', '#ef4444']} width={700} height={30} startFrame={20} />
        </AbsoluteFill>
      </Series.Sequence>
    </Series>
  );
};
