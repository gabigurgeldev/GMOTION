import {readFileSync, existsSync, readdirSync} from 'node:fs';
import {join, isAbsolute, resolve, normalize} from 'node:path';
import type {DraftContent, DraftMetaInfo, VideoMaterial} from './types';

/**
 * Leitor da pasta de um draft CapCut. Faz o mínimo determinístico:
 * carrega os JSONs, resolve o token de placeholder de path para caminho real,
 * monta o mapa material→arquivo e lista os subdrafts (compound clips).
 */

/** Ex.: `##_draftpath_placeholder_0E68...EC80_##/Resources/x.ttf`. */
const PLACEHOLDER_RE = /##_draftpath_placeholder_[0-9A-Fa-f-]+_##/g;

export interface NormalizedDraft {
  /** Pasta raiz do draft (onde está o draft_content.json). */
  dir: string;
  content: DraftContent;
  meta: DraftMetaInfo | null;
  /** material_id → caminho absoluto do arquivo em disco (quando resolvível). */
  assetMap: Map<string, string>;
  /** GUIDs de subdrafts presentes em `subdraft/`. */
  subdraftIds: string[];
  /** Nome do compound ("Compound clipN") → timeline aninhada inline. */
  draftsByName: Map<string, DraftContent>;
  /** Resolve um path do draft (token/relativo) para absoluto. */
  resolveAssetPath: (p: string) => string;
}

const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(file, 'utf-8')) as T;

/** Troca o token de placeholder pela pasta do draft e normaliza. */
export const resolvePlaceholder = (p: string, dir: string): string => {
  if (!p) return p;
  let out = p.replace(PLACEHOLDER_RE, dir);
  if (out.startsWith('./') || out.startsWith('.\\')) {
    out = join(dir, out.slice(2));
  } else if (!isAbsolute(out)) {
    out = join(dir, out);
  }
  return normalize(out);
};

/** Caminho "cru" de um material de vídeo/imagem/áudio. */
const materialRawPath = (m: {path?: unknown; media_path?: unknown}): string => {
  const p = (m.path as string) || (m.media_path as string) || '';
  return p;
};

export const loadDraft = (draftDir: string): NormalizedDraft => {
  const dir = resolve(draftDir);
  const contentFile = join(dir, 'draft_content.json');
  if (!existsSync(contentFile)) {
    throw new Error(`draft_content.json não encontrado em: ${dir}`);
  }
  const content = readJson<DraftContent>(contentFile);

  const metaFile = join(dir, 'draft_meta_info.json');
  const meta = existsSync(metaFile) ? readJson<DraftMetaInfo>(metaFile) : null;

  const resolveAssetPath = (p: string): string => resolvePlaceholder(p, dir);

  const assetMap = new Map<string, string>();
  const indexMaterial = (m: {id?: string; path?: unknown; media_path?: unknown}) => {
    if (!m.id) return;
    const raw = materialRawPath(m);
    if (!raw) return;
    const abs = resolveAssetPath(raw);
    if (existsSync(abs)) assetMap.set(m.id, abs);
  };

  // Indexa materiais do draft raiz + de todos os drafts aninhados (compounds),
  // para que as folhas de compound clips também resolvam seus arquivos.
  const draftsByName = new Map<string, DraftContent>();
  const indexDraft = (dc: DraftContent, depth: number) => {
    for (const v of dc.materials.videos ?? []) indexMaterial(v);
    for (const a of dc.materials.audios ?? []) indexMaterial(a);
    if (depth > 16) return;
    const drafts = (dc.materials.drafts ?? []) as {draft?: DraftContent}[];
    for (const entry of drafts) {
      const nested = entry.draft;
      if (!nested) continue;
      const name = String(nested.name ?? '').trim();
      if (name && !draftsByName.has(name)) {
        draftsByName.set(name, nested);
        indexDraft(nested, depth + 1);
      }
    }
  };
  indexDraft(content, 0);

  const subdraftDir = join(dir, 'subdraft');
  const subdraftIds = existsSync(subdraftDir)
    ? readdirSync(subdraftDir, {withFileTypes: true})
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    : [];

  return {dir, content, meta, assetMap, subdraftIds, draftsByName, resolveAssetPath};
};

/** Carrega o draft_content.json de um subdraft (compound clip). */
export const loadSubdraft = (
  parent: NormalizedDraft,
  guid: string,
): DraftContent | null => {
  const file = join(parent.dir, 'subdraft', guid, 'draft_content.json');
  return existsSync(file) ? readJson<DraftContent>(file) : null;
};

/** Materiais de vídeo cujo `path` aponta para um subdraft (compound clip). */
export const compoundClipMaterials = (
  draft: NormalizedDraft,
): VideoMaterial[] =>
  (draft.content.materials.videos ?? []).filter((v) =>
    /subdraft[/\\]/.test(materialRawPath(v)),
  );
