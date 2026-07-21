import {copyFileSync, existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {framesToUs, pxToNormPos, US_PER_SECOND} from '../convert/units';
import {fromKeyframeTracks} from '../convert/keyframes';
import {buildTextContent} from './text';
import type {CapcutTimeline, ClipSpec} from './schema';
import {
  defaultClip,
  emptyMaterials,
  genId,
  makeAnimationMaterial,
  makeAudioMaterial,
  makeChromaMaterial,
  makeDraftContent,
  makeMaskMaterial,
  makeSegment,
  makeTextMaterial,
  makeTrack,
  makeVideoEffectMaterial,
  makeVideoMaterial,
  timerange,
  type ExportMaterials,
} from '../draft/skeleton';
import type {Clip, CommonKeyframe, DraftContent, TrackType} from '../draft/types';

/** Token de placeholder de path usado nos drafts exportados pelo Gmotion. */
export const EXPORT_PLACEHOLDER = '##_draftpath_placeholder_GMOTION_##';

export interface ExportResult {
  dir: string;
  content: DraftContent;
}

const clipToCapClip = (clip: ClipSpec, canvas: {width: number; height: number}): Clip => {
  const t = clip.transform;
  const norm = pxToNormPos(t.posX, t.posY, canvas);
  const base = defaultClip();
  return {
    ...base,
    scale: {x: t.scaleX, y: t.scaleY},
    rotation: t.rotation,
    transform: {x: norm.x, y: norm.y},
    flip: {horizontal: t.flipH, vertical: t.flipV},
    alpha: t.alpha,
  };
};

const keyframesFor = (clip: ClipSpec, fps: number): CommonKeyframe[] =>
  fromKeyframeTracks(clip.keyframes, fps, (p, i) => genId(`K${i}`)).map((kf) => ({
    ...kf,
    id: genId('KF'),
  }));

/**
 * Constrói um `draft_content.json` a partir de uma CapcutTimeline e escreve a
 * pasta do draft (com assets em Resources/). Clips nativos devem ser assados
 * antes (ver bake/impossible.ts); se algum sobrar, é ignorado.
 */
export const exportTimeline = (
  timeline: CapcutTimeline,
  outDir: string,
): ExportResult => {
  const dir = resolve(outDir);
  const resourcesDir = join(dir, 'Resources');
  mkdirSync(resourcesDir, {recursive: true});

  const canvas = {width: timeline.width, height: timeline.height};
  const fps = timeline.fps;
  const materials = emptyMaterials();
  const metaFiles: {id: string; rel: string}[] = [];
  const copied = new Map<string, string>();

  const importAsset = (src: string, id: string): string => {
    if (!src) return src;
    const cached = copied.get(src);
    if (cached) return cached;
    const name = basename(src);
    const rel = `${EXPORT_PLACEHOLDER}/Resources/${name}`;
    if (existsSync(src)) copyFileSync(src, join(resourcesDir, name));
    copied.set(src, rel);
    metaFiles.push({id, rel: `./Resources/${name}`});
    return rel;
  };

  let skippedNative = 0;

  // Reconstrói materiais de máscara/chroma/efeito e devolve os extra_material_refs.
  const effectRefs = (clip: ClipSpec): string[] => {
    const refs: string[] = [];
    if (clip.mask) {
      const id = genId('MSK');
      materials.common_mask!.push(makeMaskMaterial(id, clip.mask.kind));
      refs.push(id);
    }
    if (clip.chroma) {
      const id = genId('CHR');
      materials.chromas!.push(makeChromaMaterial(id, clip.chroma.color, clip.chroma.intensity));
      refs.push(id);
    }
    const videoFx = clip.effects.filter((e) => e.kind === 'video_effect');
    for (const fx of videoFx) {
      const id = genId('VFX');
      materials.video_effects!.push(makeVideoEffectMaterial(id, fx.name));
      refs.push(id);
    }
    const anims = clip.effects.filter((e) => e.kind !== 'video_effect');
    if (anims.length > 0) {
      const id = genId('ANM');
      materials.material_animations!.push(
        makeAnimationMaterial(id, anims.map((a) => ({
          type: a.kind === 'anim_out' ? 'out' : a.kind === 'anim_loop' ? 'loop' : 'in',
          duration: framesToUs(a.frames ?? 15, fps),
        }))),
      );
      refs.push(id);
    }
    return refs;
  };

  const tracks = timeline.tracks.map((track) => {
    const segments = track.clips
      .map((clip) => {
        const target = timerange(framesToUs(clip.start, fps), framesToUs(clip.duration, fps));
        const capClip = clipToCapClip(clip, canvas);
        const kfs = keyframesFor(clip, fps);
        const durUs = framesToUs(clip.duration, fps);
        const srcUs = framesToUs(clip.sourceStart, fps);

        if (clip.kind === 'native') {
          skippedNative += 1;
          return null;
        }

        const matId = genId('M');
        if (clip.kind === 'image' || clip.kind === 'video') {
          const path = importAsset(clip.src, matId);
          const isImage = clip.kind === 'image';
          materials.videos!.push(
            makeVideoMaterial(matId, path, canvas.width, canvas.height, isImage ? US_PER_SECOND : durUs, isImage),
          );
          return makeSegment({
            id: genId('S'),
            material_id: matId,
            target,
            source: timerange(srcUs, durUs),
            render_index: track.renderIndex,
            clip: capClip,
            keyframes: kfs,
            volume: clip.kind === 'video' ? clip.volume : 1,
            extra_material_refs: effectRefs(clip),
          });
        }
        if (clip.kind === 'audio') {
          const path = importAsset(clip.src, matId);
          materials.audios!.push(makeAudioMaterial(matId, path, durUs));
          return makeSegment({
            id: genId('S'),
            material_id: matId,
            target,
            source: timerange(srcUs, durUs),
            render_index: track.renderIndex,
            volume: clip.volume,
            extra_material_refs: effectRefs(clip),
          });
        }
        // text
        const fontRel = clip.fontPath ? importAsset(clip.fontPath, matId) : null;
        const content = buildTextContent(clip.text, clip.color, clip.fontSize, fontRel);
        materials.texts!.push(makeTextMaterial(matId, content));
        return makeSegment({
          id: genId('S'),
          material_id: matId,
          target,
          source: null,
          render_index: track.renderIndex,
          clip: capClip,
          keyframes: kfs,
          extra_material_refs: effectRefs(clip),
        });
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);

    return makeTrack(track.id, track.type as TrackType, segments);
  });

  const content = makeDraftContent({
    id: genId('DRAFT'),
    fps,
    width: canvas.width,
    height: canvas.height,
    duration: framesToUs(timeline.durationInFrames, fps),
    tracks,
    materials: materials as ExportMaterials,
  });

  writeFileSync(join(dir, 'draft_content.json'), JSON.stringify(content, null, 2), 'utf-8');
  writeFileSync(
    join(dir, 'draft_meta_info.json'),
    JSON.stringify(
      {
        draft_id: content.id,
        draft_fold_path: dir,
        draft_root_path: dir,
        draft_materials: [{type: 0, value: metaFiles.map((m) => ({id: m.id, file_Path: m.rel}))}],
      },
      null,
      2,
    ),
    'utf-8',
  );

  if (skippedNative > 0) {
    console.warn(`Aviso: ${skippedNative} clip(s) nativo(s) ignorado(s) — asse antes com bakeNativeClips().`);
  }

  return {dir, content};
};
