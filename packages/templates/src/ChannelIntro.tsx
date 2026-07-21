import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {AnimatedLayer, TypewriterText} from '@gmotion/presets';
import {
  ExtrudedText,
  GmotionThreeScene,
  OrbitingCamera,
  Particles,
} from '@gmotion/three-scenes';
import {FilmGrain, Glow, Vignette} from '@gmotion/effects';

export type ChannelIntroProps = {
  /** Nome do canal (vira logo 3D). */
  channelName: string;
  slogan?: string;
  /** Cor do texto 3D. Default: '#d8dcff'. */
  color?: string;
  /** Cor das partículas. Default: '#8be9fd'. */
  particleColor?: string;
  /** Material do logo 3D. Default: 'metal'. */
  material?: 'metal' | 'glass' | 'neon';
};

/** 8s a 30fps. */
export const CHANNEL_INTRO_DURATION = 240;

const LOGO_END = 165;

const Logo3D = ({
  channelName,
  color,
  particleColor,
  material,
}: Required<Pick<ChannelIntroProps, 'channelName' | 'color' | 'particleColor' | 'material'>>) => {
  const frame = useCurrentFrame();
  // Zoom-in suave da câmera ao longo da cena (formato retrato: começa longe)
  const radius = 15 - Math.min(1, frame / LOGO_END) * 3;
  return (
    <GmotionThreeScene cameraPosition={[0, 1.5, radius]}>
      <ExtrudedText
        text={channelName}
        material={material}
        color={color}
        size={0.9}
      />
      <Particles count={250} spread={7} riseSpeed={0.6} size={0.04} color={particleColor} glow={2} />
      {/* Arco frontal: velocidade baixa + phase negativa, nunca fica de lado */}
      <OrbitingCamera radius={radius} speed={0.035} height={1.6} phase={-0.35} />
    </GmotionThreeScene>
  );
};

/**
 * Template "Intro de canal": logo 3D orbitado com partículas -> slogan.
 *
 * @example
 * <ChannelIntro channelName="GMOTION" slogan="motion em código" material="neon" />
 */
export const ChannelIntro = ({
  channelName,
  slogan,
  color = '#d8dcff',
  particleColor = '#8be9fd',
  material = 'metal',
}: ChannelIntroProps) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#05050c'}}>
      {/* Cena 1: logo 3D */}
      <Sequence durationInFrames={LOGO_END}>
        <AnimatedLayer enter="fade-in" enterFrames={12} exit="blur-out" exitFrames={14}>
          <AbsoluteFill>
            <Logo3D
              channelName={channelName}
              color={color}
              particleColor={particleColor}
              material={material}
            />
          </AbsoluteFill>
        </AnimatedLayer>
      </Sequence>

      {/* Cena 2: slogan */}
      <Sequence from={LOGO_END}>
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40}}>
          <Glow intensity={24} color={`${particleColor}cc`}>
            <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
              <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 10}} enterFrames={14}>
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 130,
                    fontWeight: 900,
                    color: 'white',
                    letterSpacing: 6,
                  }}
                >
                  {channelName}
                </div>
              </AnimatedLayer>
            </AbsoluteFill>
          </Glow>
          {slogan ? (
            <div style={{position: 'absolute', bottom: 700}}>
              <TypewriterText
                text={slogan}
                charsPerSecond={22}
                startFrame={12}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 52,
                  color: particleColor,
                }}
              />
            </div>
          ) : null}
        </AbsoluteFill>
      </Sequence>

      <FilmGrain intensity={0.1} />
      <Vignette intensity={0.6} />
    </AbsoluteFill>
  );
};
