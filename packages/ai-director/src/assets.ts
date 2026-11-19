/**
 * Ponte entre o manifesto de assets cadastrados pelo usuário
 * (packages/asset-library) e os agentes de IA: contexto textual pro prompt
 * (imagens) e matching determinístico de trilha sonora (sem chamada de LLM).
 */
import {join} from 'node:path';
import type {AssetEntry, AssetManifest, AssetType} from '@gmotion/asset-library';
import type {Plan} from './agents/types';

const MAX_ENTRIES = 40;

/** Caminho absoluto de um asset, resolvido contra a raiz indexada. */
export const resolveAssetPath = (manifest: AssetManifest, entry: AssetEntry): string =>
  join(manifest.root, entry.path);

/** Lista os assets de um tipo como texto pro prompt (path + tags + metadados). */
export const assetsAsText = (
  manifest: AssetManifest | undefined,
  type: AssetType,
): string => {
  if (!manifest) return '';
  const entries = manifest.entries.filter((e) => e.type === type).slice(0, MAX_ENTRIES);
  if (entries.length === 0) return '';
  return entries
    .map((e) => {
      const meta = [
        e.tags.length ? `tags: ${e.tags.join(', ')}` : null,
        e.duration ? `${e.duration.toFixed(1)}s` : null,
        e.width && e.height ? `${e.width}x${e.height}` : null,
      ]
        .filter((v): v is string => v !== null)
        .join(', ');
      return `- ${resolveAssetPath(manifest, e)}${meta ? ` (${meta})` : ''}`;
    })
    .join('\n');
};

const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

const normalize = (s: string): string[] =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

const planKeywords = (plan: Plan): Set<string> =>
  new Set(
    [plan.keyMessage, ...plan.scenes.map((s) => s.intent), ...plan.palette].flatMap(
      normalize,
    ),
  );

/**
 * Escolhe a trilha sonora cadastrada com mais palavras-chave em comum com o
 * plano (tags do asset vs. mensagem-chave/intenções de cena/paleta).
 * Retorna null se não houver manifest, não houver áudio, ou nenhum match.
 */
export const pickMusicAsset = (
  manifest: AssetManifest | undefined,
  plan: Plan,
): AssetEntry | null => {
  if (!manifest) return null;
  const audioEntries = manifest.entries.filter((e) => e.type === 'audio');
  if (audioEntries.length === 0) return null;

  const keywords = planKeywords(plan);
  let best: {entry: AssetEntry; score: number} | null = null;
  for (const entry of audioEntries) {
    const tagWords = entry.tags.flatMap(normalize);
    const score = tagWords.reduce((s, w) => s + (keywords.has(w) ? 1 : 0), 0);
    if (!best || score > best.score) best = {entry, score};
  }
  return best && best.score > 0 ? best.entry : null;
};
