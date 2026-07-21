import {AbsoluteFill, Img} from 'remotion';
import {
  TransitionSeries,
  linearTiming,
  type TransitionPresentation,
} from '@remotion/transitions';
import {AnimatedLayer} from '@gmotion/presets';
import {shakeCut, whipPan, zoomGlitch} from '@gmotion/transitions';
import {FilmGrain, Vignette} from '@gmotion/effects';

export type ViralReelScene = {
  /** Texto grande estilo CapCut. */
  text: string;
  /** Linha menor opcional. */
  subtext?: string;
  /** Imagem de fundo opcional (staticFile ou URL). */
  media?: string;
  /** Matiz do fundo quando sem mídia. Default: varia por cena. */
  hue?: number;
};

export type ViralReelProps = {
  scenes: ViralReelScene[];
  /** Frames por cena. Default: 45. */
  sceneFrames?: number;
  /** Frames por transição. Default: 10. */
  transitionFrames?: number;
  /** Cor de destaque do texto. Default: '#facc15'. */
  accentColor?: string;
  /** Grain + vinheta por cima. Default: true. */
  filmLook?: boolean;
};

/** Duração total do template dado o número de cenas. */
export const viralReelDuration = (params: {
  sceneCount: number;
  sceneFrames?: number;
  transitionFrames?: number;
}): number => {
  const {sceneCount, sceneFrames = 45, transitionFrames = 10} = params;
  if (sceneCount <= 0) {
    return 0;
  }
  return sceneCount * sceneFrames - (sceneCount - 1) * transitionFrames;
};

// Normaliza o tipo genérico das presentations para poder alternar num array
type AnyPresentation = TransitionPresentation<Record<string, unknown>>;

const TRANSITION_ROTATION: ReadonlyArray<() => AnyPresentation> = [
  () => zoomGlitch() as unknown as AnyPresentation,
  () => shakeCut() as unknown as AnyPresentation,
  () => whipPan() as unknown as AnyPresentation,
];

const SceneView = ({
  scene,
  index,
  accentColor,
}: {
  scene: ViralReelScene;
  index: number;
  accentColor: string;
}) => {
  const hue = scene.hue ?? (index * 55) % 360;
  return (
    <AbsoluteFill
      style={{
        background: scene.media
          ? '#000'
          : `linear-gradient(160deg, hsl(${hue}, 60%, 18%), hsl(${hue + 45}, 70%, 7%))`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {scene.media ? (
        <AbsoluteFill>
          <Img
            src={scene.media}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
          <AbsoluteFill style={{backgroundColor: 'rgba(0,0,0,0.35)'}} />
        </AbsoluteFill>
      ) : null}

      <AnimatedLayer
        enter="zoom-in-bounce"
        enterOptions={{damping: 9, stiffness: 150}}
        enterFrames={12}
        loop="pulse"
        loopOptions={{intensity: 0.02, speed: 1.4}}
        style={{padding: '0 60px'}}
      >
        <div
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: 110,
            fontWeight: 900,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.05,
            textTransform: 'uppercase',
            textShadow: '0 8px 30px rgba(0,0,0,0.6)',
            WebkitTextStroke: '3px rgba(0,0,0,0.25)',
          }}
        >
          {scene.text}
        </div>
      </AnimatedLayer>

      {scene.subtext ? (
        <AnimatedLayer enter="slide-in" enterOptions={{direction: 'down'}} enterFrames={14}>
          <div
            style={{
              marginTop: 40,
              fontFamily: 'Arial, sans-serif',
              fontSize: 54,
              fontWeight: 800,
              color: accentColor,
              textAlign: 'center',
            }}
          >
            {scene.subtext}
          </div>
        </AnimatedLayer>
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * Template "Reel Viral": cortes rápidos, zoom bounce, texto grande estilo
 * CapCut, transições agressivas alternando (zoom-glitch/shake-cut/whip-pan).
 *
 * @example
 * <ViralReel scenes={[{text: 'Você sabia?'}, {text: 'Isso muda tudo', subtext: 'segue aí'}]} />
 */
export const ViralReel = ({
  scenes,
  sceneFrames = 45,
  transitionFrames = 10,
  accentColor = '#facc15',
  filmLook = true,
}: ViralReelProps) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <TransitionSeries>
        {scenes.flatMap((scene, i) => {
          const factory = TRANSITION_ROTATION[i % TRANSITION_ROTATION.length];
          const items = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={sceneFrames}>
              <SceneView scene={scene} index={i} accentColor={accentColor} />
            </TransitionSeries.Sequence>,
          ];
          if (i < scenes.length - 1 && factory) {
            items.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={factory()}
                timing={linearTiming({durationInFrames: transitionFrames})}
              />,
            );
          }
          return items;
        })}
      </TransitionSeries>

      {filmLook ? (
        <>
          <FilmGrain intensity={0.12} />
          <Vignette intensity={0.55} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
