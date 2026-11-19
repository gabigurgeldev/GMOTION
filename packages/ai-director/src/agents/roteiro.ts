/** Agente 4 — Roteiro. Brief das perguntas → plano estruturado. */
import {z} from 'zod';
import {callStructuredAgent, briefText} from './shared';
import {planSchema, type Brief, type CallConfig, type OnPhase, type Plan} from './types';

const SYSTEM = `Você é o roteirista de uma equipe que produz vídeos verticais curtos (Reels/Shorts) em motion graphics.
A partir do briefing, defina a mensagem central, a paleta de cores, a duração alvo (máximo 60s), o CTA e a lista de cenas com objetivo e copy.
Priorize um gancho forte na primeira cena e ritmo de viral. Responda SOMENTE com o JSON do plano.`;

export async function runRoteiro(
  brief: Brief,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<{plan: Plan; costUsd: number; summary: string}> {
  onPhase?.('Consultando IA (roteiro)…');
  const {output, costUsd} = await callStructuredAgent<Plan>(
    cfg,
    SYSTEM,
    `Briefing:\n\n${briefText(brief)}`,
    z.toJSONSchema(planSchema) as Record<string, unknown>,
  );
  const plan = planSchema.parse(output);
  return {
    plan,
    costUsd,
    summary: `Plano: ${plan.scenes.length} cenas, ${plan.targetSeconds}s — "${plan.keyMessage}"`,
  };
}
