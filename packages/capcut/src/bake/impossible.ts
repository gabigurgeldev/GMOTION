import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join, resolve} from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import type {CapcutTimeline, ClipSpec} from '../timeline/schema';
import type {BakeInput} from './BakeRoot';

/**
 * "Assa" cada layer nativa (o que o CapCut não faz) em um vídeo .mov com canal
 * alpha (ProRes 4444) e devolve uma timeline onde cada clip nativo virou um clip
 * de vídeo apontando para o arquivo assado — pronto para o exporter injetar no
 * draft do CapCut. Requer Chromium (Remotion) e roda no Node.
 */
export interface BakeOptions {
  outDir: string;
  /** Entry Remotion; default: o BakeRoot deste pacote. */
  entryPoint?: string;
  onProgress?: (msg: string) => void;
}

const defaultEntry = (): string =>
  join(dirname(fileURLToPath(import.meta.url)), 'BakeRoot.tsx');

export const bakeNativeClips = async (
  timeline: CapcutTimeline,
  opts: BakeOptions,
): Promise<CapcutTimeline> => {
  const outDir = resolve(opts.outDir);
  mkdirSync(outDir, {recursive: true});
  const log = opts.onProgress ?? (() => {});

  const natives = timeline.tracks.flatMap((t) =>
    t.clips.filter((c): c is Extract<ClipSpec, {kind: 'native'}> => c.kind === 'native'),
  );
  if (natives.length === 0) return timeline;

  log(`Bundling Remotion (${natives.length} layers nativas)…`);
  const serveUrl = await bundle({entryPoint: opts.entryPoint ?? defaultEntry()});

  const baked = new Map<string, string>();
  for (const clip of natives) {
    const bakeInput: BakeInput = {
      clip,
      fps: timeline.fps,
      width: timeline.width,
      height: timeline.height,
      durationInFrames: clip.duration,
    };
    const inputProps = bakeInput as unknown as Record<string, unknown>;
    const composition = await selectComposition({serveUrl, id: 'BakeNative', inputProps});
    const outputLocation = join(outDir, `${clip.id}.mov`);
    log(`Renderizando ${clip.component} → ${outputLocation}`);
    await renderMedia({
      composition,
      serveUrl,
      codec: 'prores',
      proResProfile: '4444',
      pixelFormat: 'yuva444p10le', // preserva alpha
      imageFormat: 'png',
      inputProps,
      outputLocation,
    });
    baked.set(clip.id, outputLocation);
  }

  // Substitui cada clip nativo por um clip de vídeo apontando para o .mov assado.
  const tracks = timeline.tracks.map((track) => ({
    ...track,
    clips: track.clips.map((clip): ClipSpec => {
      if (clip.kind !== 'native') return clip;
      const file = baked.get(clip.id)!;
      return {
        kind: 'video',
        id: clip.id,
        src: file,
        volume: 0,
        start: clip.start,
        duration: clip.duration,
        sourceStart: 0,
        transform: clip.transform,
        keyframes: clip.keyframes,
        effects: [],
      };
    }),
  }));

  return {...timeline, tracks};
};
