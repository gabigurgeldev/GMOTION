/** Tipos compartilhados do pipeline de agentes. */
import {z} from 'zod';
import type {TimelineSchema} from '../schema';
import type {ProviderName} from '../providers';
import type {AssetManifest} from '@gmotion/asset-library';

export type {TimelineSchema} from '../schema';

export type AgentName =
  | 'roteiro'
  | 'estrutura'
  | 'texto'
  | 'cor'
  | 'audio'
  | 'orquestrador';

export const AGENT_LABELS: Record<AgentName, string> = {
  roteiro: 'Roteiro',
  estrutura: 'Corte / Edição',
  texto: 'Textos e animação',
  cor: 'Cor e filtros',
  audio: 'Áudio (narração/SFX)',
  orquestrador: 'Orquestrador',
};

/** Briefing montado a partir das perguntas de pré-produção. */
export interface Brief {
  projectName: string;
  type: 'EV' | 'GM';
  answers: Record<string, string>;
  /** EV: caminho absoluto do vídeo-fonte (≤60s). */
  sourceVideoPath?: string;
  /** Pasta do projeto (userData) para gravar áudio etc. */
  projectDir: string;
  /** Manifesto de assets cadastrados pelo usuário (imagens/áudios/vídeos), se indexado. */
  assetManifest?: AssetManifest;
}

/** Config de chamada compartilhada por todos os agentes (paridade de providers). */
export interface CallConfig {
  provider: ProviderName;
  model: string;
  cliPath?: string;
  openRouterApiKey?: string;
}

/** Plano produzido pelo agente de roteiro. */
export const planSchema = z.object({
  keyMessage: z.string().describe('Mensagem central do vídeo em uma frase'),
  palette: z.array(z.string()).min(2).describe('2-4 cores CSS que definem o clima'),
  targetSeconds: z.number().describe('Duração alvo em segundos (<= 60)'),
  cta: z.string().nullish().describe('Chamada para ação, se houver'),
  scenes: z
    .array(
      z.object({
        intent: z.string().describe('Objetivo narrativo da cena'),
        copy: z.string().describe('Texto/fala principal da cena'),
      }),
    )
    .min(1),
});
export type Plan = z.infer<typeof planSchema>;

/** Evento emitido pelo orquestrador (vira NDJSON no stdout do CLI). */
export interface AgentEvent {
  type: 'agent' | 'plan' | 'done' | 'error';
  agent?: AgentName;
  status?: 'start' | 'ok' | 'error';
  message?: string;
  /** Custo deste passo (USD). */
  costUsd?: number;
  /** Custo acumulado até agora (USD). */
  cumCostUsd?: number;
  /** done: caminho da timeline final gravada. */
  timelinePath?: string;
  /** plan: o plano estruturado. */
  plan?: Plan;
  /** Rótulo da subfase em andamento (ex.: "Escrevendo narração…"), presente só em status 'start'. */
  phase?: string;
  /** Date.now() no instante da emissão — usado pelo ticker de tempo decorrido na UI. */
  ts?: number;
}

export type Emit = (evt: AgentEvent) => void;

/** Reporta o rótulo da subfase em andamento dentro de um agente. */
export type OnPhase = (label: string) => void;

/** Resultado de um agente que muta a timeline. */
export interface TimelineStep {
  timeline: TimelineSchema;
  costUsd: number;
  summary: string;
}
