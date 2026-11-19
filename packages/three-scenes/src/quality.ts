import {createContext, useContext} from 'react';
import {getRemotionEnvironment} from 'remotion';

/**
 * LOD das cenas 3D (Fase 17).
 * 'low'  = preview fluido no studio (menos segments/partículas, dpr reduzido)
 * 'high' = qualidade final no `remotion render`
 */
export type PreviewQuality = 'low' | 'high';

/**
 * Resolve a qualidade efetiva — PURA, testável:
 * override explícito vence; senão low no preview interativo, high no render.
 */
export const resolveQuality = (
  override: PreviewQuality | undefined,
  isRendering: boolean,
): PreviewQuality => {
  if (override) return override;
  return isRendering ? 'high' : 'low';
};

/** Escala contagens (partículas etc.) pro modo low. */
export const scaledCount = (
  count: number,
  quality: PreviewQuality,
  lowFactor = 0.35,
): number => {
  if (quality === 'high') return count;
  return Math.max(1, Math.round(count * lowFactor));
};

/** Escolhe valor por qualidade (segments, dpr...). */
export const byQuality = <T,>(quality: PreviewQuality, low: T, high: T): T =>
  quality === 'low' ? low : high;

const SceneQualityContext = createContext<PreviewQuality | undefined>(undefined);
export const SceneQualityProvider = SceneQualityContext.Provider;

/**
 * Qualidade efetiva do componente: prop própria > contexto da cena > auto
 * (low no studio, high no render) — sem o usuário precisar setar nada.
 */
export const useSceneQuality = (override?: PreviewQuality): PreviewQuality => {
  const fromScene = useContext(SceneQualityContext);
  const {isRendering} = getRemotionEnvironment();
  return resolveQuality(override ?? fromScene, isRendering);
};
