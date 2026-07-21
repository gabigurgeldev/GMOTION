import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {basename, join} from 'node:path';
import type {CapcutTimeline, ClipSpec} from './schema';

/**
 * Copia os assets absolutos referenciados pela timeline para dentro de um
 * diretório público (apps/studio/public/<subdir>) e reescreve os `src`/`fontPath`
 * para caminhos relativos servíveis via `staticFile`. Necessário porque o
 * Remotion Studio não carrega caminhos absolutos do disco.
 */
export const externalizeAssets = (
  timeline: CapcutTimeline,
  publicDir: string,
  subdir = 'capcut',
): CapcutTimeline => {
  const outDir = join(publicDir, subdir);
  mkdirSync(outDir, {recursive: true});
  const copied = new Map<string, string>();

  const take = (abs: string): string => {
    if (!abs || !existsSync(abs)) return abs;
    const cached = copied.get(abs);
    if (cached) return cached;
    const name = basename(abs);
    copyFileSync(abs, join(outDir, name));
    const rel = `${subdir}/${name}`;
    copied.set(abs, rel);
    return rel;
  };

  const tracks = timeline.tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip): ClipSpec => {
      if (clip.kind === 'video' || clip.kind === 'image' || clip.kind === 'audio') {
        return {...clip, src: take(clip.src)};
      }
      if (clip.kind === 'text' && clip.fontPath) {
        return {...clip, fontPath: take(clip.fontPath)};
      }
      return clip;
    }),
  }));

  return {...timeline, tracks};
};
