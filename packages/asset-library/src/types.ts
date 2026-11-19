export type AssetType = 'video' | 'image' | 'lottie' | 'audio';

export type AssetEntry = {
  id: string;
  /** Caminho relativo à raiz indexada (separador sempre `/`). */
  path: string;
  type: AssetType;
  /** Tags inferidas do nome da pasta/arquivo (minúsculas, sem duplicata). */
  tags: string[];
  /** Segundos — só vídeo/áudio. */
  duration?: number;
  /** Vídeo/PNG com canal alpha (checado via ffprobe/IHDR). */
  hasAlpha?: boolean;
  /** Relativo à raiz indexada, dentro de `.gmotion-thumbs/`. */
  thumbnailPath?: string;
  width?: number;
  height?: number;
};

export type AssetManifest = {
  version: 1;
  /** Raiz absoluta usada na indexação (paths das entries são relativos a ela). */
  root: string;
  entries: AssetEntry[];
};
