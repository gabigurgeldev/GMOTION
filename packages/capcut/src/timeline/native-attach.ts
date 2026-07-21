import type {CapcutTimeline, CapTrack, ClipSpec} from './schema';

/**
 * API para anexar layers "nativas" (3D/shader/partícula) sobre um edit CapCut
 * importado — o que o CapCut não consegue criar. Função pura: devolve uma nova
 * timeline com uma track de vídeo dedicada por cima (maior renderIndex).
 */
export interface NativeClipInput {
  id?: string;
  native: 'three' | 'shader' | 'particle';
  component: string;
  props?: Record<string, unknown>;
  start: number; // frame
  duration: number; // frames
  posX?: number;
  posY?: number;
}

const nextRenderIndex = (tl: CapcutTimeline): number =>
  tl.tracks.reduce((m, t) => Math.max(m, t.renderIndex), -1) + 1;

export const makeNativeClip = (
  input: NativeClipInput,
  canvas: {width: number; height: number},
  index = 0,
): ClipSpec => ({
  kind: 'native',
  native: input.native,
  component: input.component,
  props: input.props ?? {},
  id: input.id ?? `native-${index}`,
  start: input.start,
  duration: input.duration,
  sourceStart: 0,
  transform: {
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    posX: input.posX ?? canvas.width / 2,
    posY: input.posY ?? canvas.height / 2,
    alpha: 1,
    flipH: false,
    flipV: false,
  },
  keyframes: [],
  effects: [],
});

/** Adiciona uma track de layers nativas por cima do edit importado. */
export const attachNativeLayers = (
  timeline: CapcutTimeline,
  inputs: NativeClipInput[],
): CapcutTimeline => {
  if (inputs.length === 0) return timeline;
  const canvas = {width: timeline.width, height: timeline.height};
  const track: CapTrack = {
    id: 'gmotion-native',
    type: 'video',
    renderIndex: nextRenderIndex(timeline),
    clips: inputs.map((inp, i) => makeNativeClip(inp, canvas, i)),
  };
  return {...timeline, tracks: [...timeline.tracks, track]};
};

/** Todos os clips nativos da timeline (para assar no export). */
export const collectNativeClips = (
  timeline: CapcutTimeline,
): Extract<ClipSpec, {kind: 'native'}>[] =>
  timeline.tracks.flatMap((t) =>
    t.clips.filter((c): c is Extract<ClipSpec, {kind: 'native'}> => c.kind === 'native'),
  );
