/**
 * Agente 6 — Orquestrador. Valida a timeline final e, no refine, decide qual
 * agente deve tratar a instrução do usuário.
 */
import {z} from 'zod';
import {timelineDuration, type TimelineSchema} from '../schema';
import {callStructuredAgent} from './shared';
import type {AgentName, CallConfig} from './types';

/** Checagens determinísticas de sanidade sobre a timeline final. */
export function validateFinal(timeline: TimelineSchema): string[] {
  const issues: string[] = [];
  const seconds = timelineDuration(timeline) / timeline.fps;
  if (seconds > 60) issues.push(`Vídeo com ${seconds.toFixed(1)}s (>60s)`);
  if (timeline.scenes.length === 0) issues.push('Sem cenas');
  timeline.scenes.forEach((s, i) => {
    if (s.layers.length === 0) issues.push(`Cena ${i + 1} sem layers`);
  });
  return issues;
}

const routeSchema = z.object({
  agent: z.enum(['estrutura', 'texto', 'cor', 'audio']),
  reason: z.string(),
});
type Route = z.infer<typeof routeSchema>;

const ROUTE_SYSTEM = `Você é o orquestrador de uma equipe de motion graphics. Dada uma instrução de mudança do usuário, escolha QUAL agente deve executá-la:
- estrutura: cenas, durações, pacing, transições, ordem.
- texto: copy, tipografia, animação de texto.
- cor: paleta, backgrounds, filtros e efeitos globais.
- audio: narração, música, efeitos sonoros.
Responda SOMENTE com o JSON.`;

/** Classifica a instrução de refine para o agente responsável. */
export async function routeRefine(
  instruction: string,
  cfg: CallConfig,
): Promise<{agent: AgentName; costUsd: number; reason: string}> {
  const {output, costUsd} = await callStructuredAgent<Route>(
    cfg,
    ROUTE_SYSTEM,
    `Instrução do usuário: "${instruction}"`,
    z.toJSONSchema(routeSchema) as Record<string, unknown>,
  );
  const route = routeSchema.parse(output);
  return {agent: route.agent, costUsd, reason: route.reason};
}
