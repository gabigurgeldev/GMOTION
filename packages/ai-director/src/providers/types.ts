/** Tipos compartilhados entre os providers de IA. */

export type ProviderName = 'anthropic' | 'openrouter' | 'claude-cli';

/** Resultado normalizado de uma chamada estruturada, com custo em USD. */
export interface StructuredResult {
  output: unknown;
  costUsd: number;
  usage: Record<string, unknown>;
}

export interface RunStructuredOptions {
  provider: ProviderName;
  systemPrompt: string;
  userMessage: string;
  jsonSchema: Record<string, unknown>;
  model: string;
  /** Override do caminho do binário claude (só provider claude-cli). */
  cliPath?: string;
  /** Chave OpenRouter (só provider openrouter). */
  openRouterApiKey?: string;
  maxTokens?: number;
}
