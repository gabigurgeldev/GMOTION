import {AbsoluteFill, Series} from 'remotion';
import {
  AnimatedLayer,
  TypewriterText,
  allPresetNames,
  type EnterPresetName,
  type ExitPresetName,
  type LoopPresetName,
} from '@gmotion/presets';

/**
 * Demo da Fase 2: percorre o registry inteiro em sequência.
 * Cada cena mostra o nome do preset + um cartão animado com ele.
 */

const SCENE_FRAMES = 50;

const Card = ({label}: {label: string}) => (
  <div
    style={{
      background: 'linear-gradient(135deg, #6366f1, #ec4899)',
      borderRadius: 40,
      padding: '80px 100px',
      boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    }}
  >
    <span
      style={{
        fontFamily: 'Arial, sans-serif',
        fontSize: 90,
        fontWeight: 900,
        color: 'white',
      }}
    >
      {label}
    </span>
  </div>
);

const Scene = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: '#0b0b14',
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <span
      style={{
        position: 'absolute',
        top: 120,
        fontFamily: 'monospace',
        fontSize: 54,
        color: '#8b8ba7',
      }}
    >
      {title}
    </span>
    {children}
  </AbsoluteFill>
);

export const PRESET_SHOWCASE_DURATION =
  (allPresetNames.enter.length +
    allPresetNames.loop.length +
    allPresetNames.exit.length +
    1) *
  SCENE_FRAMES;

export const PresetShowcase = () => {
  return (
    <Series>
      {allPresetNames.enter.map((name: EnterPresetName) => (
        <Series.Sequence key={name} durationInFrames={SCENE_FRAMES}>
          <Scene title={`enter: ${name}`}>
            <AnimatedLayer enter={name} enterFrames={20} exit="fade-out" exitFrames={8}>
              <Card label={name} />
            </AnimatedLayer>
          </Scene>
        </Series.Sequence>
      ))}

      {allPresetNames.loop.map((name: LoopPresetName) => (
        <Series.Sequence key={name} durationInFrames={SCENE_FRAMES}>
          <Scene title={`loop: ${name}`}>
            <AnimatedLayer enter="fade-in" enterFrames={8} loop={name} exit="fade-out" exitFrames={8}>
              <Card label={name} />
            </AnimatedLayer>
          </Scene>
        </Series.Sequence>
      ))}

      {allPresetNames.exit.map((name: ExitPresetName) => (
        <Series.Sequence key={name} durationInFrames={SCENE_FRAMES}>
          <Scene title={`exit: ${name}`}>
            <AnimatedLayer enter="fade-in" enterFrames={8} exit={name} exitFrames={18}>
              <Card label={name} />
            </AnimatedLayer>
          </Scene>
        </Series.Sequence>
      ))}

      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <Scene title="text: typewriter">
          <TypewriterText
            text="Gmotion digita isso."
            charsPerSecond={18}
            style={{
              fontFamily: 'monospace',
              fontSize: 80,
              fontWeight: 700,
              color: 'white',
            }}
          />
        </Scene>
      </Series.Sequence>
    </Series>
  );
};
