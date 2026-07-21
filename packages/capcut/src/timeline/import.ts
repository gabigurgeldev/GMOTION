import {loadDraft, type NormalizedDraft} from '../draft/reader';
import {usToFrames, normPosToPx} from '../convert/units';
import {toKeyframeTracks} from '../convert/keyframes';
import {capcutColorFromContent, parseTextContent} from './text';
import {resolveClipEffects, type ClipEffectFields} from './effects';
import {parseCapcutTimeline, type CapTrack, type ClipSpec, type CapcutTimeline, type Transform} from './schema';
import type {Clip, DraftContent, Segment, Track, VideoMaterial} from '../draft/types';

/**
 * Importer: pasta de draft CapCut → CapcutTimeline (track-based, frames+px).
 * Prioriza vídeo/imagem/texto/áudio + transform + keyframes, achata compound
 * clips (materials.drafts inline) e resolve máscara/chroma/efeitos best-effort.
 */

const IDENTITY: Transform = {
  scaleX: 1, scaleY: 1, rotation: 0, posX: 0, posY: 0, alpha: 1, flipH: false, flipV: false,
};

const canvasOf = (content: DraftContent) => content.canvas_config;

const transformFromClip = (
  clip: Clip | undefined,
  canvas: {width: number; height: number},
): Transform => {
  if (!clip) {
    return {...IDENTITY, posX: canvas.width / 2, posY: canvas.height / 2};
  }
  const px = normPosToPx(clip.transform.x, clip.transform.y, canvas);
  return {
    scaleX: clip.scale.x,
    scaleY: clip.scale.y,
    rotation: clip.rotation,
    posX: px.x,
    posY: px.y,
    alpha: clip.alpha,
    flipH: clip.flip.horizontal,
    flipV: clip.flip.vertical,
  };
};

/** Compõe o transform do pai (compound) sobre o do filho. */
const composeTransform = (
  parent: Transform,
  child: Transform,
  canvas: {width: number; height: number},
): Transform => {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  return {
    scaleX: parent.scaleX * child.scaleX,
    scaleY: parent.scaleY * child.scaleY,
    rotation: parent.rotation + child.rotation,
    alpha: parent.alpha * child.alpha,
    posX: cx + (child.posX - cx) * parent.scaleX + (parent.posX - cx),
    posY: cy + (child.posY - cy) * parent.scaleY + (parent.posY - cy),
    flipH: parent.flipH !== child.flipH,
    flipV: parent.flipV !== child.flipV,
  };
};

/** Contexto de composição de tempo/transform ao descer em compounds. */
interface Ctx {
  baseStartF: number; // onde o tempo 0 do nested cai na timeline final
  srcStartF: number; // início do source_timerange do pai (frames)
  timeScale: number;
  windowStartF: number;
  windowEndF: number;
  parent: Transform;
  depth: number;
  visited: Set<string>;
}

const rootCtx = (): Ctx => ({
  baseStartF: 0, srcStartF: 0, timeScale: 1,
  windowStartF: 0, windowEndF: Number.POSITIVE_INFINITY,
  parent: IDENTITY, depth: 0, visited: new Set(),
});

const isCompound = (mat: VideoMaterial, draft: NormalizedDraft): boolean =>
  (!mat.path || mat.path === '') &&
  typeof mat.material_name === 'string' &&
  draft.draftsByName.has(mat.material_name);

const videoSrc = (draft: NormalizedDraft, mat: VideoMaterial): string =>
  draft.assetMap.get(mat.id) ?? draft.resolveAssetPath(mat.path);

const isImageMaterial = (mat: VideoMaterial): boolean =>
  mat.type === 'photo' || (mat.has_audio === false && mat.type !== 'video');

/** Constrói os clips de um segmento (pode expandir compound em vários). */
const segmentClips = (
  draft: NormalizedDraft,
  content: DraftContent,
  trackType: string,
  seg: Segment,
  ctx: Ctx,
): ClipSpec[] => {
  const fps = draft.content.fps;
  const canvas = canvasOf(draft.content);

  const segStartF = usToFrames(seg.target_timerange.start, fps);
  const segDurF = Math.max(1, usToFrames(seg.target_timerange.duration, fps));
  const startF = Math.round(ctx.baseStartF + (segStartF - ctx.srcStartF) * ctx.timeScale);
  const durF = Math.max(1, Math.round(segDurF * ctx.timeScale));
  const clampedStart = Math.max(startF, ctx.windowStartF);
  const clampedEnd = Math.min(startF + durF, ctx.windowEndF);
  const finalDur = Math.max(1, clampedEnd - clampedStart);
  if (clampedEnd <= ctx.windowStartF) return [];

  const localTransform = transformFromClip(seg.clip, canvas);
  const transform = ctx.depth === 0 ? localTransform : composeTransform(ctx.parent, localTransform, canvas);
  const keyframes = toKeyframeTracks(seg.common_keyframes ?? [], fps);
  const effects: ClipEffectFields = resolveClipEffects(content, seg, fps);
  const base = {id: seg.id, start: clampedStart, duration: finalDur, transform, keyframes, ...effects};

  if (trackType === 'video' || trackType === 'sticker') {
    const mat = content.materials.videos.find((v) => v.id === seg.material_id);
    if (!mat) return [];

    // Compound clip → expande a timeline aninhada.
    if (isCompound(mat, draft) && ctx.depth < 8) {
      const name = mat.material_name!;
      if (ctx.visited.has(name)) return [];
      const nested = draft.draftsByName.get(name)!;
      const nestedDurUs = nested.duration || seg.source_timerange?.duration || seg.target_timerange.duration;
      const childCtx: Ctx = {
        // O source_timerange do pai recorta o nested; mapeia essa janela na do pai.
        baseStartF: clampedStart,
        srcStartF: usToFrames(seg.source_timerange?.start ?? 0, fps),
        timeScale: finalDur / Math.max(1, usToFrames(nestedDurUs, fps)),
        windowStartF: clampedStart,
        windowEndF: clampedEnd,
        parent: transform,
        depth: ctx.depth + 1,
        visited: new Set([...ctx.visited, name]),
      };
      return nested.tracks.flatMap((tr) =>
        tr.segments.flatMap((s) => segmentClips(draft, nested, tr.type, s, childCtx)),
      );
    }

    const src = videoSrc(draft, mat);
    if (!src) return [];
    return [
      isImageMaterial(mat)
        ? {kind: 'image', src, sourceStart: 0, ...base}
        : {kind: 'video', src, volume: seg.volume ?? 1, sourceStart: usToFrames(seg.source_timerange?.start ?? 0, fps), ...base},
    ];
  }

  if (trackType === 'audio') {
    const mat = content.materials.audios.find((a) => a.id === seg.material_id);
    if (!mat) return [];
    const src = draft.assetMap.get(mat.id) ?? draft.resolveAssetPath(mat.path);
    if (!src) return [];
    return [{kind: 'audio', src, volume: seg.volume ?? 1, sourceStart: usToFrames(seg.source_timerange?.start ?? 0, fps), ...base}];
  }

  if (trackType === 'text') {
    const mat = content.materials.texts.find((tx) => tx.id === seg.material_id);
    if (!mat) return [];
    const parsed = parseTextContent(mat.content);
    return [{
      kind: 'text',
      text: parsed.text,
      color: capcutColorFromContent(parsed),
      fontSize: parsed.styles[0]?.size ?? 15,
      fontPath: parsed.styles[0]?.font?.path ? draft.resolveAssetPath(parsed.styles[0]!.font!.path!) : null,
      sourceStart: 0,
      ...base,
    }];
  }

  return []; // effect/filter tracks: sem clip renderável direto
};

export const draftToTimeline = (draft: NormalizedDraft): CapcutTimeline => {
  const {content} = draft;
  const fps = content.fps;

  const tracks: CapTrack[] = content.tracks.map((track, i) => {
    const clips = track.segments.flatMap((seg) =>
      segmentClips(draft, content, track.type, seg, rootCtx()),
    );
    const renderIndex = track.segments[0]?.render_index ?? i;
    return {id: track.id, type: track.type, renderIndex, clips};
  });

  const raw = {
    fps,
    width: content.canvas_config.width,
    height: content.canvas_config.height,
    durationInFrames: Math.max(1, usToFrames(content.duration, fps)),
    tracks,
  };
  return parseCapcutTimeline(raw);
};

/** Atalho: importa direto da pasta do draft. */
export const capcutToTimeline = (draftDir: string): CapcutTimeline =>
  draftToTimeline(loadDraft(draftDir));

export type {Track};
