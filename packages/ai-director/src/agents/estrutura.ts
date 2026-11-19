/**
 * Agente 1 — Corte / Edição. Plano → primeira timeline (GM): define cenas,
 * durações, pacing e transições. Layers de texto ficam mínimas (o agente de
 * texto refina depois). Em EV este agente geraria a timeline CapCut (fatia 2).
 */
import {catalogAsText} from '../catalog';
import {assetsAsText} from '../assets';
import {callTimelineAgent, briefText, planText} from './shared';
import type {Brief, CallConfig, OnPhase, Plan, TimelineStep} from './types';

export const SYSTEM_ESTRUTURA = `Você é o editor/montador de uma equipe de motion graphics. Recebe um plano e monta a ESTRUTURA da timeline Remotion: número de cenas, durações (frames), backgrounds (gradientes escuros) e transições entre cenas.

Blocos disponíveis (use só estes nomes):
${catalogAsText()}

Regras:
- Formato 1080x1920 @ 30fps. Cenas de 40-90 frames (pacing viral).
- Uma cena por item do plano, na mesma ordem. Cada cena com pelo menos uma layer de texto com a copy do plano (o refinamento de texto vem depois).
- Transições coerentes com o clima (zoom-glitch/shake-cut agressivo, whip-pan movimento, light-leak/film-burn orgânico). O campo "after" é o índice da cena que a transição segue.
- Respeite a duração alvo do plano (soma das cenas ~ targetSeconds * 30).
- Se precisar de uma layer de imagem (logo, foto de fundo), PRIORIZE os assets cadastrados pelo usuário listados abaixo (use o "src" exato da lista). Só use uma URL genérica se nenhum asset da lista servir.
Responda SOMENTE com o JSON da timeline.`;

export async function runEstrutura(
  brief: Brief,
  plan: Plan,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<TimelineStep> {
  onPhase?.('Consultando IA (estrutura)…');
  const imageAssets = assetsAsText(brief.assetManifest, 'image');
  const assetsBlock = imageAssets
    ? `\n\nImagens cadastradas pelo usuário (prefira estas):\n${imageAssets}`
    : '';
  const {timeline, costUsd} = await callTimelineAgent(
    cfg,
    SYSTEM_ESTRUTURA,
    `Briefing:\n${briefText(brief)}\n\nPlano:\n${planText(plan)}${assetsBlock}\n\nMonte a timeline estrutural.`,
  );
  return {
    timeline,
    costUsd,
    summary: `Estrutura: ${timeline.scenes.length} cenas, ${
      (timeline.transitions ?? []).length
    } transições`,
  };
}
