import {AbsoluteFill, Composition, registerRoot} from 'remotion';
import {renderNative} from '../render/native';
import type {ClipSpec} from '../timeline/schema';

/**
 * Entry Remotion dedicado a "assar" uma única layer nativa (3D/shader/partícula)
 * em vídeo com canal alpha. Fundo transparente para o CapCut receber só o
 * elemento. Consumido por bake/impossible.ts via bundle().
 */
export interface BakeInput {
  clip: Extract<ClipSpec, {kind: 'native'}>;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

const BakeNative = ({clip}: {clip: BakeInput['clip']}) => (
  <AbsoluteFill>{renderNative(clip)}</AbsoluteFill>
);

const defaultClip: BakeInput['clip'] = {
  kind: 'native',
  native: 'three',
  component: 'extruded-text',
  props: {},
  id: 'bake',
  start: 0,
  duration: 60,
  sourceStart: 0,
  transform: {scaleX: 1, scaleY: 1, rotation: 0, posX: 540, posY: 960, alpha: 1, flipH: false, flipV: false},
  keyframes: [],
  effects: [],
};

export const BakeRoot = () => (
  <Composition
    id="BakeNative"
    component={BakeNative}
    durationInFrames={60}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{clip: defaultClip}}
    calculateMetadata={({props}: {props: {clip: BakeInput['clip']} & Partial<BakeInput>}) => ({
      durationInFrames: props.durationInFrames ?? props.clip.duration,
      fps: props.fps ?? 30,
      width: props.width ?? 1080,
      height: props.height ?? 1920,
    })}
  />
);

registerRoot(BakeRoot);
