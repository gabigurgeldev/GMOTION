/** Helpers comuns aos agentes. */
import {z} from 'zod';
import {parseTimeline, timelineSchema, type TimelineSchema} from '../schema';
import {runStructured} from '../providers';
import type {Brief, CallConfig, Plan} from './types';

const timelineJsonSchema = () =>
  z.toJSONSchema(timelineSchema) as Record<string, unknown>;

/** Chama um agente que produz/muta uma timeline completa e valida a saída. */
export async function callTimelineAgent(
  cfg: CallConfig,
  systemPrompt: string,
  userMessage: string,
): Promise<{timeline: TimelineSchema; costUsd: number}> {
  const {output, costUsd} = await runStructured({
    provider: cfg.provider,
    systemPrompt,
    userMessage,
    jsonSchema: timelineJsonSchema(),
    model: cfg.model,
    cliPath: cfg.cliPath,
    openRouterApiKey: cfg.openRouterApiKey,
  });
  return {timeline: parseTimeline(output), costUsd};
}

/** Chama um agente com um JSON Schema arbitrário (ex.: plano). */
export async function callStructuredAgent<T>(
  cfg: CallConfig,
  systemPrompt: string,
  userMessage: string,
  jsonSchema: Record<string, unknown>,
): Promise<{output: T; costUsd: number}> {
  const {output, costUsd} = await runStructured({
    provider: cfg.provider,
    systemPrompt,
    userMessage,
    jsonSchema,
    model: cfg.model,
    cliPath: cfg.cliPath,
    openRouterApiKey: cfg.openRouterApiKey,
  });
  return {output: output as T, costUsd};
}

/** Serializa o brief das perguntas de pré-produção em texto legível. */
export function briefText(brief: Brief): string {
  const lines = [
    `Projeto: ${brief.projectName}`,
    `Tipo: ${brief.type === 'EV' ? 'Edição de vídeo' : 'Graphics Motion'}`,
  ];
  if (brief.sourceVideoPath) lines.push(`Vídeo-fonte: ${brief.sourceVideoPath}`);
  for (const [k, v] of Object.entries(brief.answers)) lines.push(`- ${k}: ${v}`);
  return lines.join('\n');
}

/** Serializa o plano em texto para alimentar os agentes seguintes. */
export function planText(plan: Plan): string {
  const scenes = plan.scenes
    .map((s, i) => `  Cena ${i + 1} — ${s.intent}: "${s.copy}"`)
    .join('\n');
  return [
    `Mensagem-chave: ${plan.keyMessage}`,
    `Paleta: ${plan.palette.join(', ')}`,
    `Duração alvo: ${plan.targetSeconds}s`,
    plan.cta ? `CTA: ${plan.cta}` : '',
    `Cenas:\n${scenes}`,
  ]
    .filter(Boolean)
    .join('\n');
}
