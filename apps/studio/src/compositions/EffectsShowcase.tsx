import type {ReactNode} from 'react';
import {AbsoluteFill, Series} from 'remotion';
import {AnimatedLayer} from '@gmotion/presets';
import {
  ChromaticAberration,
  FilmGrain,
  Glow,
  LightLeaks,
  RgbShift,
  ScreenShake,
  Vignette,
} from '@gmotion/effects';

/**
 * Demo da Fase 5: mesma cena base, um efeito por vez, e o combo no final.
 * Combina com os presets da Fase 2 (AnimatedLayer na cena base).
 */

const SCENE_FRAMES = 55;

const BaseScene = ({hue = 260}: {hue?: number}) => (
  <AbsoluteFill
    style={{
      background: `linear-gradient(160deg, hsl(${hue}, 55%, 18%), hsl(${hue + 50}, 65%, 8%))`,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <AnimatedLayer enter="zoom-in-bounce" enterFrames={14} loop="float">
      <div
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 85%, 60%), hsl(${hue + 70}, 85%, 55%))`,
          borderRadius: 36,
          padding: '70px 90px',
        }}
      >
        <span
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 84,
            fontWeight: 900,
            color: 'white',
          }}
        >
          GMOTION
        </span>
      </div>
    </AnimatedLayer>
  </AbsoluteFill>
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

const Slide = ({label, children}: {label: string; children: ReactNode}) => (
  <AbsoluteFill>
    {children}
    <Label text={label} />
  </AbsoluteFill>
);

export const EFFECTS_SHOWCASE_DURATION = SCENE_FRAMES * 8;

export const EffectsShowcase = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: film-grain">
          <BaseScene />
          <FilmGrain intensity={0.22} />
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: chromatic-aberration">
          <ChromaticAberration intensity={7}>
            <BaseScene hue={200} />
          </ChromaticAberration>
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: rgb-shift (animado)">
          <RgbShift intensity={10}>
            <BaseScene hue={330} />
          </RgbShift>
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: glow">
          <AbsoluteFill style={{backgroundColor: '#05050c'}}>
            <Glow intensity={28} color="rgba(120,220,255,0.8)">
              <BaseScene hue={190} />
            </Glow>
          </AbsoluteFill>
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: vignette">
          <BaseScene hue={40} />
          <Vignette intensity={0.85} size={45} />
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: light-leaks">
          <BaseScene hue={20} />
          <LightLeaks intensity={1} />
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: screen-shake (decay)">
          <ScreenShake intensity={26} decayFrames={35}>
            <BaseScene hue={0} />
          </ScreenShake>
        </Slide>
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Slide label="fx: combo">
          <ScreenShake intensity={6}>
            <RgbShift intensity={4}>
              <BaseScene hue={280} />
            </RgbShift>
          </ScreenShake>
          <LightLeaks intensity={0.7} />
          <FilmGrain intensity={0.15} />
          <Vignette intensity={0.6} />
        </Slide>
      </Series.Sequence>
    </Series>
  );
};
