import {capcutToTimeline} from './import';
import {attachNativeLayers, type NativeClipInput} from './native-attach';
import type {CapcutTimeline, CapTrack, ClipSpec, Transform} from './schema';

/**
 * API de autoria de alto nível — o que o Claude Code (com acesso ao disco do
 * usuário) usa para montar/editar uma timeline sem escrever JSON à mão. Tudo
 * puro; tempos em SEGUNDOS por conveniência (convertidos com o fps da timeline).
 */

const centeredTransform = (tl: {width: number; height: number}, over: Partial<Transform> = {}): Transform => ({
  scaleX: 1, scaleY: 1, rotation: 0,
  posX: tl.width / 2, posY: tl.height / 2,
  alpha: 1, flipH: false, flipV: false,
  ...over,
});

export interface TimelineOpts {
  fps?: number;
  width?: number;
  height?: number;
  durationInSeconds?: number;
}

export const emptyTimeline = (opts: TimelineOpts = {}): CapcutTimeline => {
  const fps = opts.fps ?? 30;
  return {
    fps,
    width: opts.width ?? 1080,
    height: opts.height ?? 1920,
    durationInFrames: Math.round((opts.durationInSeconds ?? 10) * fps),
    tracks: [],
  };
};

/** Importa um draft CapCut existente para editar (base do "editar um vídeo"). */
export const fromDraft = (draftDir: string): CapcutTimeline => capcutToTimeline(draftDir);

let trackSeq = 0;
export const addTrack = (tl: CapcutTimeline, type: CapTrack['type'] = 'video'): CapcutTimeline => {
  trackSeq += 1;
  const track: CapTrack = {
    id: `authored-${trackSeq}`,
    type,
    renderIndex: tl.tracks.reduce((m, t) => Math.max(m, t.renderIndex), -1) + 1,
    clips: [],
  };
  return {...tl, tracks: [...tl.tracks, track]};
};

/** Adiciona um clip numa track existente (por índice) ou na última. */
export const addClip = (tl: CapcutTimeline, clip: ClipSpec, trackIndex = tl.tracks.length - 1): CapcutTimeline => {
  const tracks = tl.tracks.map((t, i) => (i === trackIndex ? {...t, clips: [...t.clips, clip]} : t));
  return {...tl, tracks};
};

interface ClipCommon {
  id: string;
  startSec: number;
  durationSec: number;
}

const timing = (tl: CapcutTimeline, c: ClipCommon) => ({
  id: c.id,
  start: Math.round(c.startSec * tl.fps),
  duration: Math.max(1, Math.round(c.durationSec * tl.fps)),
  sourceStart: 0,
  keyframes: [],
  effects: [],
});

export const imageClip = (tl: CapcutTimeline, c: ClipCommon & {src: string; pos?: {x: number; y: number}}): ClipSpec => ({
  kind: 'image', src: c.src, transform: centeredTransform(tl, c.pos ? {posX: c.pos.x, posY: c.pos.y} : {}), ...timing(tl, c),
});

export const textClip = (tl: CapcutTimeline, c: ClipCommon & {text: string; color?: string; fontSize?: number; pos?: {x: number; y: number}}): ClipSpec => ({
  kind: 'text', text: c.text, color: c.color ?? '#ffffff', fontSize: c.fontSize ?? 12, fontPath: null,
  transform: centeredTransform(tl, c.pos ? {posX: c.pos.x, posY: c.pos.y} : {}), ...timing(tl, c),
});

/** Recorta a timeline aos primeiros `seconds` (mantém render viável). */
export const trim = (tl: CapcutTimeline, seconds: number): CapcutTimeline => {
  const maxF = Math.round(seconds * tl.fps);
  const tracks = tl.tracks
    .map((t) => ({
      ...t,
      clips: t.clips
        .filter((c) => c.start < maxF)
        .map((c) => ({...c, duration: Math.min(c.duration, maxF - c.start)}))
        .filter((c) => c.duration > 0),
    }))
    .filter((t) => t.clips.length > 0);
  return {...tl, durationInFrames: maxF, tracks};
};

/** Injeta as layers "impossíveis no CapCut" (3D/partícula/shader). */
export const withNativeLayers = (tl: CapcutTimeline, inputs: NativeClipInput[]): CapcutTimeline =>
  attachNativeLayers(tl, inputs);

/** Adiciona um efeito CSS/AE (video_effect) a todos os clips de uma track. */
export const addEffectToTrack = (tl: CapcutTimeline, trackIndex: number, name: string, intensity = 0.5): CapcutTimeline => {
  const tracks = tl.tracks.map((t, i) =>
    i === trackIndex
      ? {...t, clips: t.clips.map((c) => ({...c, effects: [...c.effects, {name, kind: 'video_effect' as const, intensity, frames: null}]}))}
      : t,
  );
  return {...tl, tracks};
};
