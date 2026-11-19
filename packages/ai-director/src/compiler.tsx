import type {CSSProperties, ReactNode} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, Series, staticFile} from 'remotion';
import {
  TransitionSeries,
  linearTiming,
  type TransitionPresentation,
} from '@remotion/transitions';
import {
  AnimatedLayer,
  TypewriterText,
  type EnterPresetName,
  type ExitPresetName,
  type LoopPresetName,
} from '@gmotion/presets';
import {
  filmBurn,
  lightLeak,
  rgbSplitWipe,
  shakeCut,
  whipPan,
  zoomGlitch,
  type TransitionDirection,
} from '@gmotion/transitions';
import {
  ChromaticAberration,
  FilmGrain,
  LightLeaks,
  RgbShift,
  ScreenShake,
  Vignette,
} from '@gmotion/effects';
import {
  AnimatedCounter,
  Badge,
  LowerThird,
  ProgressBar,
} from '@gmotion/graphics';
import type {
  EffectSpec,
  LayerSpec,
  SceneSpec,
  TimelineSchema,
  TransitionSpec,
} from './schema';

/**
 * Compilador: TimelineSchema (JSON) -> componentes Remotion reais.
 * jsonToComposition(timeline) devolve o JSX pronto para uma <Composition>.
 */

type AnyPresentation = TransitionPresentation<Record<string, unknown>>;

const presentationFor = (t: TransitionSpec): AnyPresentation => {
  const direction = (t.direction ?? 'left') as TransitionDirection;
  switch (t.transitionType) {
    case 'zoom-glitch':
      return zoomGlitch() as unknown as AnyPresentation;
    case 'rgb-split-wipe':
      return rgbSplitWipe({direction}) as unknown as AnyPresentation;
    case 'shake-cut':
      return shakeCut() as unknown as AnyPresentation;
    case 'whip-pan':
      return whipPan({direction}) as unknown as AnyPresentation;
    case 'light-leak':
      return lightLeak() as unknown as AnyPresentation;
    case 'film-burn':
      return filmBurn() as unknown as AnyPresentation;
    default:
      throw new Error(`Transição desconhecida: ${t.transitionType}`);
  }
};

const layerContent = (layer: LayerSpec): ReactNode => {
  switch (layer.type) {
    case 'text':
      return (
        <div
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: layer.fontSize ?? 90,
            fontWeight: layer.fontWeight ?? 900,
            color: layer.color ?? 'white',
            textAlign: 'center',
            lineHeight: 1.1,
            whiteSpace: 'pre-wrap',
          }}
        >
          {layer.text}
        </div>
      );
    case 'image':
      return (
        <Img
          src={layer.src}
          style={{
            width: layer.width ?? 600,
            borderRadius: layer.borderRadius ?? 0,
          }}
        />
      );
    case 'shape': {
      const background = layer.gradient
        ? `linear-gradient(135deg, ${layer.gradient[0]}, ${layer.gradient[1]})`
        : (layer.color ?? '#6366f1');
      return (
        <div
          style={{
            width: layer.width,
            height: layer.height,
            background,
            borderRadius:
              layer.shape === 'circle' ? '50%' : (layer.borderRadius ?? 24),
          }}
        />
      );
    }
    case 'counter':
      return (
        <AnimatedCounter
          to={layer.to}
          from={layer.from ?? 0}
          prefix={layer.prefix ?? ''}
          suffix={layer.suffix ?? ''}
          decimals={layer.decimals ?? 0}
          durationInFrames={layer.countFrames ?? 45}
          style={{fontSize: layer.fontSize ?? 120, color: layer.color ?? 'white'}}
        />
      );
    case 'progress-bar':
      return (
        <ProgressBar
          target={layer.target}
          width={layer.width ?? 600}
          height={layer.height ?? 24}
          gradient={
            layer.gradient ? [layer.gradient[0] ?? '#6366f1', layer.gradient[1] ?? '#ec4899'] : undefined
          }
          color={layer.color ?? '#6366f1'}
        />
      );
    case 'badge':
      return (
        <Badge
          borderColors={
            layer.borderColors
              ? [layer.borderColors[0] ?? '#6366f1', layer.borderColors[1] ?? '#ec4899']
              : undefined
          }
          fontSize={layer.fontSize ?? 36}
        >
          {layer.text}
        </Badge>
      );
    case 'typewriter':
      return (
        <TypewriterText
          text={layer.text}
          charsPerSecond={layer.charsPerSecond ?? 20}
          style={{
            fontFamily: 'monospace',
            fontSize: layer.fontSize ?? 60,
            color: layer.color ?? 'white',
          }}
        />
      );
    case 'lower-third':
      // Renderizado fora do posicionamento genérico (tem layout próprio)
      return null;
  }
};

const LayerView = ({layer, sceneDuration}: {layer: LayerSpec; sceneDuration: number}) => {
  if (layer.type === 'lower-third') {
    return (
      <LowerThird
        name={layer.name}
        role={layer.role ?? undefined}
        accentColor={layer.accentColor ?? '#6366f1'}
      />
    );
  }

  const pos = layer.position ?? {x: 50, y: 50};
  const start = layer.startFrame ?? 0;
  const duration = layer.durationInFrames ?? sceneDuration - start;

  const wrapperStyle: CSSProperties = {
    position: 'absolute',
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: 'translate(-50%, -50%)',
  };

  return (
    <Sequence from={start} durationInFrames={Math.max(1, duration)} layout="none">
      <div style={wrapperStyle}>
        <AnimatedLayer
            enter={(layer.enter ?? undefined) as EnterPresetName | undefined}
            enterOptions={layer.enterDirection ? {direction: layer.enterDirection} : undefined}
            enterFrames={layer.enterFrames ?? 15}
            exit={(layer.exit ?? undefined) as ExitPresetName | undefined}
            exitOptions={layer.exitDirection ? {direction: layer.exitDirection} : undefined}
            exitFrames={layer.exitFrames ?? 10}
          loop={(layer.loop ?? undefined) as LoopPresetName | undefined}
        >
          {layerContent(layer)}
        </AnimatedLayer>
      </div>
    </Sequence>
  );
};

const SceneView = ({scene}: {scene: SceneSpec}) => {
  const bg = scene.background;
  const background = bg?.gradient
    ? `linear-gradient(${bg.angle ?? 160}deg, ${bg.gradient[0]}, ${bg.gradient[1]})`
    : (bg?.color ?? '#0b0b14');

  return (
    <AbsoluteFill style={{background}}>
      {scene.layers.map((layer, i) => (
        <LayerView key={i} layer={layer} sceneDuration={scene.durationInFrames} />
      ))}
    </AbsoluteFill>
  );
};

const applyEffects = (node: ReactNode, effects: EffectSpec[]): ReactNode => {
  // Wrappers envolvem; overlays vão por cima, na ordem declarada
  let wrapped = node;
  const overlays: ReactNode[] = [];

  for (const fx of effects) {
    switch (fx.effectType) {
      case 'screen-shake':
        wrapped = <ScreenShake intensity={fx.intensity ?? 10}>{wrapped}</ScreenShake>;
        break;
      case 'rgb-shift':
        wrapped = <RgbShift intensity={fx.intensity ?? 6}>{wrapped}</RgbShift>;
        break;
      case 'chromatic-aberration':
        wrapped = (
          <ChromaticAberration intensity={fx.intensity ?? 4}>{wrapped}</ChromaticAberration>
        );
        break;
      case 'film-grain':
        overlays.push(<FilmGrain key="grain" intensity={fx.intensity ?? 0.12} />);
        break;
      case 'vignette':
        overlays.push(<Vignette key="vignette" intensity={fx.intensity ?? 0.6} />);
        break;
      case 'light-leaks':
        overlays.push(<LightLeaks key="leaks" intensity={fx.intensity ?? 0.8} />);
        break;
    }
  }

  return (
    <AbsoluteFill>
      {wrapped}
      {overlays}
    </AbsoluteFill>
  );
};

/**
 * Transforma a timeline JSON em JSX Remotion.
 *
 * @example
 * const timeline = parseTimeline(json);
 * <Composition id="Ai" component={() => jsonToComposition(timeline)} ... />
 */
export const jsonToComposition = (timeline: TimelineSchema): ReactNode => {
  const transitions = timeline.transitions ?? [];
  const byAfter = new Map(transitions.map((t) => [t.after, t]));

  let scenesNode: ReactNode;

  if (transitions.length > 0) {
    scenesNode = (
      <TransitionSeries>
        {timeline.scenes.flatMap((scene, i) => {
          const items: ReactNode[] = [
            <TransitionSeries.Sequence key={`s${i}`} durationInFrames={scene.durationInFrames}>
              <SceneView scene={scene} />
            </TransitionSeries.Sequence>,
          ];
          const t = byAfter.get(i);
          if (t && i < timeline.scenes.length - 1) {
            items.push(
              <TransitionSeries.Transition
                key={`t${i}`}
                presentation={presentationFor(t)}
                timing={linearTiming({durationInFrames: t.durationInFrames ?? 12})}
              />,
            );
          }
          return items;
        })}
      </TransitionSeries>
    );
  } else {
    scenesNode = (
      <Series>
        {timeline.scenes.map((scene, i) => (
          <Series.Sequence key={i} durationInFrames={scene.durationInFrames}>
            <SceneView scene={scene} />
          </Series.Sequence>
        ))}
      </Series>
    );
  }

  const visuals = applyEffects(scenesNode, timeline.effects ?? []);
  const audio = timeline.audio ?? [];
  if (audio.length === 0) return visuals;

  return (
    <>
      {visuals}
      {audio.map((track, i) => {
        const node = (
          <Audio src={resolveAudioSrc(track.src)} volume={track.volume ?? 1} />
        );
        const from = track.startFrame ?? 0;
        return from > 0 ? (
          <Sequence key={`audio${i}`} from={from}>
            {node}
          </Sequence>
        ) : (
          <Sequence key={`audio${i}`}>{node}</Sequence>
        );
      })}
    </>
  );
};

/** Caminho absoluto/URL passa direto; relativo resolve via staticFile (public/). */
const resolveAudioSrc = (src: string): string => {
  if (/^([a-zA-Z]:[\\/]|[\\/]|https?:|file:)/.test(src)) return src;
  return staticFile(src);
};

/** Componente pronto: <TimelineComposition timeline={...} /> */
export const TimelineComposition = ({timeline}: {timeline: TimelineSchema}) => {
  return <>{jsonToComposition(timeline)}</>;
};
