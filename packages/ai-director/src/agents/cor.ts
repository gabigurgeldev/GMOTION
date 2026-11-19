/**
 * Agente 3 — Cor e filtros. Recebe a timeline atual e ajusta backgrounds
 * (gradientes) por cena + effects globais (film-grain/vignette/etc), seguindo a
 * paleta do plano. NÃO altera textos nem estrutura.
 */
import {callTimelineAgent, planText} from './shared';
import type {CallConfig, OnPhase, Plan, TimelineSchema, TimelineStep} from './types';

export const SYSTEM_COR = `Você é o colorista/direção de arte de uma equipe de motion graphics. Recebe uma timeline Remotion pronta e ajusta APENAS a paleta: backgrounds das cenas (gradientes de duas cores, geralmente escuros para o texto branco saltar) e a lista "effects" global.

Efeitos globais disponíveis: film-grain (0.08-0.15), vignette (0.5-0.7), light-leaks, screen-shake (5-10, só alta energia), rgb-shift, chromatic-aberration.

Regras:
- Use a paleta do plano. film-grain + vignette dão look de cinema.
- NÃO altere textos, durações, número/ordem de cenas nem transições.
Responda SOMENTE com o JSON completo da timeline.`;

export async function runCor(
  current: TimelineSchema,
  plan: Plan,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<TimelineStep> {
  onPhase?.('Consultando IA (cor)…');
  const {timeline, costUsd} = await callTimelineAgent(
    cfg,
    SYSTEM_COR,
    `Paleta alvo: ${plan.palette.join(', ')}\n\nPlano:\n${planText(
      plan,
    )}\n\nTimeline atual:\n${JSON.stringify(current)}\n\nAplique cor e efeitos.`,
  );
  return {
    timeline,
    costUsd,
    summary: `Cor/efeitos: ${(timeline.effects ?? []).length} efeitos globais`,
  };
}
