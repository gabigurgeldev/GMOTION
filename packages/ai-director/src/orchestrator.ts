/**
 * Orquestrador do pipeline de 6 agentes. Roda os agentes em ordem de
 * dependência, acumula custo e emite eventos de progresso. O mesmo código serve
 * aos três providers (paridade OpenRouter/Claude CLI/Anthropic).
 */
import {type TimelineSchema} from './schema';
import {callTimelineAgent} from './agents/shared';
import {parseCapcutTimeline, type CapcutTimeline} from '@gmotion/capcut/render';
import {runRoteiro} from './agents/roteiro';
import {runEstrutura, SYSTEM_ESTRUTURA} from './agents/estrutura';
import {runTexto, SYSTEM_TEXTO} from './agents/texto';
import {runCor, SYSTEM_COR} from './agents/cor';
import {runAudio} from './agents/audio';
import {
  capcutRefineJsonSchema,
  runAudioEv,
  runCorEv,
  runCortesEv,
  runTextoEv,
  type SourceVideoInfo,
} from './agents/ev';
import {runStructured} from './providers';
import {routeRefine, validateFinal} from './agents/orquestrador';
import type {AgentName, Brief, CallConfig, Emit, OnPhase, Plan} from './agents/types';

export interface OrchestrationResult {
  timeline: TimelineSchema;
  plan: Plan;
  totalCostUsd: number;
}

/** Roda um passo emitindo start/ok e acumulando custo. */
async function step<T extends {costUsd: number; summary: string}>(
  agent: AgentName,
  emit: Emit,
  cum: {cost: number},
  fn: (onPhase: OnPhase) => Promise<T>,
): Promise<T> {
  emit({type: 'agent', agent, status: 'start', cumCostUsd: cum.cost, ts: Date.now()});
  const onPhase: OnPhase = (phase) =>
    emit({type: 'agent', agent, status: 'start', phase, cumCostUsd: cum.cost, ts: Date.now()});
  try {
    const res = await fn(onPhase);
    cum.cost += res.costUsd;
    emit({
      type: 'agent',
      agent,
      status: 'ok',
      message: res.summary,
      costUsd: res.costUsd,
      cumCostUsd: cum.cost,
      ts: Date.now(),
    });
    return res;
  } catch (err) {
    emit({
      type: 'agent',
      agent,
      status: 'error',
      message: (err as Error).message,
      cumCostUsd: cum.cost,
      ts: Date.now(),
    });
    throw err;
  }
}

/** Pipeline completo: brief → plano → estrutura → texto → cor → áudio → validação. */
export async function orchestrate(
  brief: Brief,
  cfg: CallConfig,
  emit: Emit,
): Promise<OrchestrationResult> {
  const cum = {cost: 0};

  const {plan} = await step('roteiro', emit, cum, (onPhase) => runRoteiro(brief, cfg, onPhase));
  emit({type: 'plan', plan});

  const estrutura = await step('estrutura', emit, cum, (onPhase) =>
    runEstrutura(brief, plan, cfg, onPhase),
  );
  const texto = await step('texto', emit, cum, (onPhase) =>
    runTexto(estrutura.timeline, plan, cfg, onPhase),
  );
  const cor = await step('cor', emit, cum, (onPhase) => runCor(texto.timeline, plan, cfg, onPhase));
  const audio = await step('audio', emit, cum, (onPhase) =>
    runAudio(cor.timeline, plan, brief, cfg, onPhase),
  );

  const timeline = audio.timeline;
  const issues = validateFinal(timeline);
  emit({
    type: 'agent',
    agent: 'orquestrador',
    status: issues.length ? 'error' : 'ok',
    message: issues.length ? `Avisos: ${issues.join('; ')}` : 'Timeline válida',
    cumCostUsd: cum.cost,
    ts: Date.now(),
  });

  return {timeline, plan, totalCostUsd: cum.cost};
}

export interface EvOrchestrationResult {
  timeline: CapcutTimeline;
  plan: Plan;
  totalCostUsd: number;
}

/** Pipeline EV: brief → plano → cortes reais → overlays → filtro → narração. */
export async function orchestrateEv(
  brief: Brief,
  video: SourceVideoInfo,
  cfg: CallConfig,
  emit: Emit,
): Promise<EvOrchestrationResult> {
  const cum = {cost: 0};

  const {plan} = await step('roteiro', emit, cum, (onPhase) => runRoteiro(brief, cfg, onPhase));
  emit({type: 'plan', plan});

  const cortes = await step('estrutura', emit, cum, (onPhase) =>
    runCortesEv(brief, plan, video, cfg, onPhase),
  );
  const texto = await step('texto', emit, cum, (onPhase) =>
    runTextoEv(cortes.timeline, plan, cortes.cutLabels, cfg, onPhase),
  );
  const cor = await step('cor', emit, cum, (onPhase) => runCorEv(texto.timeline, plan, cfg, onPhase));
  const audio = await step('audio', emit, cum, (onPhase) =>
    runAudioEv(cor.timeline, plan, brief, cfg, onPhase),
  );

  const timeline = audio.timeline;
  const issues: string[] = [];
  if (timeline.durationInFrames / timeline.fps > 60) issues.push('Vídeo >60s');
  if (!timeline.tracks.some((t) => t.type === 'video')) issues.push('Sem track de vídeo');
  emit({
    type: 'agent',
    agent: 'orquestrador',
    status: issues.length ? 'error' : 'ok',
    message: issues.length ? `Avisos: ${issues.join('; ')}` : 'Timeline válida',
    cumCostUsd: cum.cost,
    ts: Date.now(),
  });

  return {timeline, plan, totalCostUsd: cum.cost};
}

const EV_REFINE_SYSTEM = `Você é o editor de vídeo. Recebe uma timeline track-based (formato CapCut do Gmotion: tempo em frames, posição em pixels, clips de vídeo com sourceStart = frame inicial dentro do vídeo-fonte) e aplica SOMENTE a mudança pedida, mantendo todo o resto idêntico (mesmos ids, mesmos valores). Responda SOMENTE com o JSON completo da timeline.`;

/** Refine EV: roteia e re-executa sobre a timeline CapCut. */
export async function refineEv(
  current: CapcutTimeline,
  plan: Plan,
  brief: Brief,
  cfg: CallConfig,
  instruction: string,
  emit: Emit,
): Promise<EvOrchestrationResult> {
  const cum = {cost: 0};

  const route = await step('orquestrador', emit, cum, async () => {
    const r = await routeRefine(instruction, cfg);
    return {...r, summary: `Encaminhado para ${r.agent}: ${r.reason}`};
  });

  let timeline = current;
  if (route.agent === 'audio') {
    const audio = await step('audio', emit, cum, (onPhase) =>
      runAudioEv(current, plan, brief, cfg, onPhase),
    );
    timeline = audio.timeline;
  } else {
    const res = await step(route.agent, emit, cum, async (onPhase) => {
      onPhase('Aplicando mudança…');
      const {output, costUsd} = await runStructured({
        provider: cfg.provider,
        systemPrompt: EV_REFINE_SYSTEM,
        userMessage: `Timeline atual:\n${JSON.stringify(
          current,
        )}\n\nAplique SOMENTE esta mudança:\n${instruction}`,
        jsonSchema: capcutRefineJsonSchema(),
        model: cfg.model,
        cliPath: cfg.cliPath,
        openRouterApiKey: cfg.openRouterApiKey,
      });
      return {
        timeline: parseCapcutTimeline(output),
        costUsd,
        summary: 'Mudança aplicada',
      };
    });
    timeline = res.timeline;
  }

  return {timeline, plan, totalCostUsd: cum.cost};
}

const REFINE_SYSTEM: Record<'estrutura' | 'texto' | 'cor', string> = {
  estrutura: SYSTEM_ESTRUTURA,
  texto: SYSTEM_TEXTO,
  cor: SYSTEM_COR,
};

/** Refine: orquestrador roteia a instrução e re-roda o agente responsável. */
export async function refine(
  current: TimelineSchema,
  plan: Plan,
  brief: Brief,
  cfg: CallConfig,
  instruction: string,
  emit: Emit,
): Promise<OrchestrationResult> {
  const cum = {cost: 0};

  const route = await step('orquestrador', emit, cum, async () => {
    const r = await routeRefine(instruction, cfg);
    return {...r, summary: `Encaminhado para ${r.agent}: ${r.reason}`};
  });

  let timeline = current;
  if (route.agent === 'audio') {
    const audio = await step('audio', emit, cum, (onPhase) =>
      runAudio(current, plan, brief, cfg, onPhase),
    );
    timeline = audio.timeline;
  } else {
    const sys = REFINE_SYSTEM[route.agent as 'estrutura' | 'texto' | 'cor'];
    const res = await step(route.agent, emit, cum, async (onPhase) => {
      onPhase('Aplicando mudança…');
      const {timeline: t, costUsd} = await callTimelineAgent(
        cfg,
        sys,
        `Timeline atual:\n${JSON.stringify(
          current,
        )}\n\nAplique SOMENTE esta mudança, mantendo o resto idêntico:\n${instruction}`,
      );
      return {timeline: t, costUsd, summary: 'Mudança aplicada'};
    });
    timeline = res.timeline;
  }

  return {timeline, plan, totalCostUsd: cum.cost};
}
