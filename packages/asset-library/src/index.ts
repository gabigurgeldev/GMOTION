/**
 * Entrada BROWSER-SAFE (busca pura + tipos).
 * Indexação/probe/servidor ficam fora — são só Node (CLI).
 */
export type {AssetEntry, AssetManifest, AssetType} from './types';
export {searchAssets, type AssetQuery} from './search';
export {inferTags, idFromPath} from './tags';
