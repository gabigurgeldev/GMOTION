import type {AssetEntry, AssetManifest, AssetType} from './types';

export type AssetQuery = {
  /** Todas as tags precisam bater (match por prefixo: "emoji" acha "emojis"). */
  tags?: string[];
  type?: AssetType;
  /** Duração mínima em segundos (exclui entries sem duração). */
  minDuration?: number;
  /** Só assets com canal alpha. */
  hasAlpha?: boolean;
};

const matchesTag = (entryTags: string[], wanted: string): boolean => {
  const normalized = wanted.toLowerCase();
  return entryTags.some((tag) => tag.startsWith(normalized));
};

/** Busca pura no manifesto — sem I/O. */
export const searchAssets = (
  manifest: AssetManifest,
  query: AssetQuery = {},
): AssetEntry[] => {
  return manifest.entries.filter((entry) => {
    if (query.type && entry.type !== query.type) return false;
    if (query.minDuration !== undefined) {
      if (entry.duration === undefined || entry.duration < query.minDuration) return false;
    }
    if (query.hasAlpha !== undefined && (entry.hasAlpha ?? false) !== query.hasAlpha) return false;
    if (query.tags && query.tags.length > 0) {
      if (!query.tags.every((tag) => matchesTag(entry.tags, tag))) return false;
    }
    return true;
  });
};
