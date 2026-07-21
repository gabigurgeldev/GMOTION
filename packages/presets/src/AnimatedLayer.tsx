import type {CSSProperties, ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {calcEnterExit} from '@gmotion/core';
import {mergePresetStyles} from './merge';
import {
  enterPresets,
  exitPresets,
  loopPresets,
  resolvePreset,
  type EnterPresetName,
  type ExitPresetName,
  type LoopPresetName,
} from './registry';
import type {PresetStyle} from './types';

export type AnimatedLayerProps = {
  children: ReactNode;
  /** Preset de entrada. */
  enter?: EnterPresetName;
  /** Opções do preset de entrada (ver tipos de cada factory). */
  enterOptions?: object;
  /** Duração da entrada em frames. Default: 15. */
  enterFrames?: number;
  /** Preset de saída (opcional). */
  exit?: ExitPresetName;
  exitOptions?: object;
  /** Duração da saída em frames. Default: 10 quando `exit` definido. */
  exitFrames?: number;
  /** Preset de loop/ênfase rodando a duração toda (opcional). */
  loop?: LoopPresetName;
  loopOptions?: object;
  /** Estilo extra aplicado ao wrapper. */
  style?: CSSProperties;
};

/**
 * Wrapper que aplica presets de entrada/saída/loop a qualquer elemento,
 * baseado na duração da Sequence pai (via useVideoConfig).
 *
 * @example
 * <AnimatedLayer enter="zoom-in-bounce" enterFrames={15} exit="fade-out" exitFrames={10}>
 *   <h1>Texto</h1>
 * </AnimatedLayer>
 */
export const AnimatedLayer = ({
  children,
  enter,
  enterOptions,
  enterFrames = 15,
  exit,
  exitOptions,
  exitFrames = 10,
  loop,
  loopOptions,
  style,
}: AnimatedLayerProps) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const {enter: enterProgress, exit: exitProgress} = calcEnterExit({
    frame,
    durationInFrames,
    enterFrames,
    exitFrames: exit ? exitFrames : 0,
  });

  let enterStyle: PresetStyle | undefined;
  if (enter) {
    enterStyle = resolvePreset(enterPresets, enter, enterOptions)({
      frame,
      fps,
      durationInFrames: enterFrames,
      progress: enterProgress,
    });
  }

  let loopStyle: PresetStyle | undefined;
  if (loop) {
    loopStyle = resolvePreset(loopPresets, loop, loopOptions)({
      frame,
      fps,
      durationInFrames,
      progress: durationInFrames > 0 ? frame / durationInFrames : 0,
    });
  }

  let exitStyle: PresetStyle | undefined;
  if (exit) {
    const exitStart = durationInFrames - exitFrames;
    exitStyle = resolvePreset(exitPresets, exit, exitOptions)({
      frame: Math.max(0, frame - exitStart),
      fps,
      durationInFrames: exitFrames,
      progress: 1 - exitProgress,
    });
  }

  const merged = mergePresetStyles(enterStyle, loopStyle, exitStyle);

  return <div style={{...style, ...merged}}>{children}</div>;
};
