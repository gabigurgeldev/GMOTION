export type ProjectType = "EV" | "GM";

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  createdAt: number;
  thumbColor: string;
}

export interface NewProjectInput {
  name?: string;
  type: ProjectType;
}

export type AiProvider = "openrouter" | "claude-cli";

export interface Settings {
  assetsFolder: string | null;
  renderOutputFolder: string | null;
  aiProvider: AiProvider;
  openRouterApiKey: string | null;
  openRouterModel: string | null;
  claudeCliPath: string | null;
}

export type FolderKind = "assets" | "renderOutput";

export interface ReindexResult {
  ok: boolean;
  log: string;
}

// --- Fluxo de geração por agentes ---

export type AgentName =
  | "roteiro"
  | "estrutura"
  | "texto"
  | "cor"
  | "audio"
  | "orquestrador";

/** Evento de progresso emitido pelo pipeline (espelha ai-director/agents). */
export interface AgentEvent {
  type: "agent" | "plan" | "done" | "error" | "log";
  agent?: AgentName;
  status?: "start" | "ok" | "error";
  message?: string;
  costUsd?: number;
  cumCostUsd?: number;
  timelinePath?: string;
  plan?: unknown;
  /** Rótulo da subfase em andamento (ex.: "Escrevendo narração…"), presente só em status 'start'. */
  phase?: string;
  /** Date.now() no instante da emissão — usado pelo ticker de tempo decorrido na UI. */
  ts?: number;
}

/** Briefing montado a partir das perguntas de pré-produção. */
export interface GenerateBrief {
  answers: Record<string, string>;
  sourceVideoPath?: string;
}

export interface PickedVideo {
  path: string;
  durationSeconds: number;
}

export interface RenderResult {
  ok: boolean;
  outputDir: string | null;
  log: string;
}

export interface GmotionApi {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: NewProjectInput): Promise<Project>;
  getSettings(): Promise<Settings>;
  updateSettings(partial: Partial<Settings>): Promise<Settings>;
  pickFolder(kind: FolderKind): Promise<string | null>;
  reindexAssets(): Promise<ReindexResult>;
  // Geração / preview / render
  pickVideo(): Promise<PickedVideo | null>;
  startGenerate(projectId: string, brief: GenerateBrief): Promise<void>;
  refineGenerate(projectId: string, instruction: string): Promise<void>;
  readTimeline(projectId: string): Promise<unknown | null>;
  startRender(projectId: string): Promise<RenderResult>;
  openPath(path: string): Promise<void>;
  /** Assina eventos de progresso; retorna função de unsubscribe. */
  onProgress(cb: (evt: AgentEvent) => void): () => void;
}
