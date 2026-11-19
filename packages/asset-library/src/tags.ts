/**
 * Inferência de tags a partir do caminho relativo do asset.
 * Puro e determinístico — testável sem filesystem.
 */

/** Sufixo de export do Google Takeout: `-20260720T200424Z-1-004`. */
const TAKEOUT_SUFFIX = /-\d{8}T\d{6}Z-\d+-\d+$/;

/** Diacríticos combinantes (pós-NFD) — construído por escape pra não depender do encoding do arquivo. */
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Palavras sem valor de busca. */
const STOPWORDS = new Set(['de', 'da', 'do', 'e', 'com', 'para', 'the', 'of', 'and', 'a', 'o']);

const stripAccents = (value: string): string => {
  return value.normalize('NFD').replace(COMBINING_MARKS, '');
};

const normalizeSegment = (segment: string): string[] => {
  return stripAccents(segment.replace(TAKEOUT_SUFFIX, ''))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word) && !/^\d+$/.test(word));
};

/**
 * Tags = palavras de cada pasta do caminho + palavras do nome do arquivo
 * (sem extensão), normalizadas (minúsculas, sem acento), sem duplicata,
 * sem números soltos ("42.mp4" não vira tag).
 */
export const inferTags = (relativePath: string): string[] => {
  const segments = relativePath.replace(/\\/g, '/').split('/').filter(Boolean);
  const tags = new Set<string>();
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i] ?? '';
    const isFile = i === segments.length - 1;
    const base = isFile ? segment.replace(/\.[^.]+$/, '') : segment;
    for (const word of normalizeSegment(base)) {
      tags.add(word);
    }
  }
  return [...tags];
};

/** ID estável derivado do caminho: `2d/2d-emojis/emoji-bravo-2` etc. */
export const idFromPath = (relativePath: string): string => {
  return relativePath
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .split('/')
    .map((segment) =>
      stripAccents(segment.replace(TAKEOUT_SUFFIX, ''))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .filter(Boolean)
    .join('/');
};
