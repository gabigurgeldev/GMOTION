import {execFile} from 'node:child_process';
import {mkdirSync, existsSync, readdirSync, readFileSync} from 'node:fs';
import {join, relative, extname} from 'node:path';
import {promisify} from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import {idFromPath, inferTags} from './tags.ts';
import {probeMedia, probePng} from './probe.ts';
import type {AssetEntry, AssetManifest, AssetType} from './types.ts';

const execFileAsync = promisify(execFile);

const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.mkv', '.avi', '.gif']);
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const AUDIO_EXT = new Set(['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac']);

const THUMBS_DIR = '.gmotion-thumbs';

const typeForFile = (filePath: string): AssetType | null => {
  const ext = extname(filePath).toLowerCase();
  if (VIDEO_EXT.has(ext)) return 'video';
  if (IMAGE_EXT.has(ext)) return 'image';
  if (AUDIO_EXT.has(ext)) return 'audio';
  if (ext === '.json') {
    // Lottie: JSON com layers + frame rate.
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as Record<string, unknown>;
      if (Array.isArray(parsed['layers']) && typeof parsed['fr'] === 'number') return 'lottie';
    } catch {
      return null;
    }
  }
  return null;
};

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    if (entry.name === THUMBS_DIR) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
};

const makeThumbnail = async (
  root: string,
  filePath: string,
  id: string,
  duration: number | undefined,
): Promise<string | undefined> => {
  if (!ffmpegPath) return undefined;
  const thumbName = `${id.replace(/\//g, '__')}.jpg`;
  const thumbAbs = join(root, THUMBS_DIR, thumbName);
  const thumbRel = `${THUMBS_DIR}/${thumbName}`;
  if (existsSync(thumbAbs)) return thumbRel;
  const middle = duration && duration > 0.2 ? duration / 2 : 0;
  try {
    await execFileAsync(ffmpegPath as string, [
      '-hide_banner', '-loglevel', 'error',
      '-ss', middle.toFixed(3),
      '-i', filePath,
      '-frames:v', '1',
      '-vf', 'scale=320:-2',
      '-y', thumbAbs,
    ]);
    return existsSync(thumbAbs) ? thumbRel : undefined;
  } catch {
    return undefined; // thumbnail é best-effort, não derruba a indexação
  }
};

export type IndexOptions = {
  thumbnails?: boolean;
  concurrency?: number;
  onProgress?: (done: number, total: number, path: string) => void;
};

/** Varre `root` e monta o manifesto. Roda só offline — nunca no render. */
export const indexDirectory = async (
  root: string,
  {thumbnails = true, concurrency = 4, onProgress}: IndexOptions = {},
): Promise<AssetManifest> => {
  const files = walk(root)
    .map((abs) => ({abs, rel: relative(root, abs).replace(/\\/g, '/')}))
    .filter(({abs}) => typeForFile(abs) !== null)
    .sort((a, b) => a.rel.localeCompare(b.rel)); // ordem estável

  if (thumbnails) mkdirSync(join(root, THUMBS_DIR), {recursive: true});

  const entries: AssetEntry[] = new Array<AssetEntry>(files.length);
  let cursor = 0;
  let done = 0;

  const worker = async (): Promise<void> => {
    while (cursor < files.length) {
      const index = cursor++;
      const file = files[index];
      if (!file) return;
      const type = typeForFile(file.abs) as AssetType;
      const id = idFromPath(file.rel);

      let probe = {};
      try {
        probe =
          type === 'image' && extname(file.abs).toLowerCase() === '.png'
            ? probePng(file.abs)
            : type === 'lottie'
              ? {}
              : await probeMedia(file.abs);
      } catch {
        // arquivo corrompido: entra no manifesto sem metadados
      }
      const {duration, width, height, hasAlpha} = probe as {
        duration?: number; width?: number; height?: number; hasAlpha?: boolean;
      };

      let thumbnailPath: string | undefined;
      if (thumbnails) {
        if (type === 'video') {
          thumbnailPath = await makeThumbnail(root, file.abs, id, duration);
        } else if (type === 'image') {
          thumbnailPath = file.rel; // imagem é o próprio thumbnail
        }
      }

      entries[index] = {
        id,
        path: file.rel,
        type,
        tags: inferTags(file.rel),
        ...(duration !== undefined ? {duration} : {}),
        ...(hasAlpha !== undefined ? {hasAlpha} : {}),
        ...(thumbnailPath ? {thumbnailPath} : {}),
        ...(width !== undefined ? {width} : {}),
        ...(height !== undefined ? {height} : {}),
      };
      done++;
      onProgress?.(done, files.length, file.rel);
    }
  };

  await Promise.all(Array.from({length: Math.max(1, concurrency)}, () => worker()));

  return {version: 1, root: root.replace(/\\/g, '/'), entries};
};
