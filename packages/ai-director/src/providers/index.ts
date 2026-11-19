/**
 * Dispatcher unificado de providers. Todos os agentes chamam runStructured;
 * os três providers (anthropic/openrouter/claude-cli) devolvem a MESMA forma
 * (StructuredResult com custo em USD), garantindo paridade de comportamento.
 */
import {generateWithAnthropic} from './anthropic';
import {generateWithOpenRouter} from './openrouter';
import {generateWithClaudeCli} from './claude-cli';
import type {RunStructuredOptions, StructuredResult} from './types';

export type {ProviderName, StructuredResult, RunStructuredOptions} from './types';

/**
 * Sanitiza o JSON Schema para os limites dos providers:
 * - remove `$schema` do topo (o validador --json-schema do claude CLI rejeita
 *   a URL do draft);
 * - remove `minItems`/`maxItems` > 1 recursivamente (a API da Anthropic — e
 *   portanto OpenRouter/Bedrock/Azure roteando pra Claude — só aceita 0 ou 1;
 *   a validação real acontece no Zod parse do nosso lado de qualquer forma);
 * - em todo objeto, coloca TODAS as chaves de `properties` em `required`. O
 *   modo `strict` do JSON Schema (OpenAI/OpenRouter) exige isso — campos
 *   opcionais viram obrigatórios-porém-nuláveis (nosso schema já usa
 *   `.nullish()`, então o tipo já aceita null). Sem isso o OpenRouter rejeita
 *   o schema e a geração via OpenRouter falha sempre.
 */
export function sanitizeJsonSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const walk = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(walk);
    if (node === null || typeof node !== 'object') return node;
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (
        (key === 'minItems' || key === 'maxItems') &&
        typeof value === 'number' &&
        value > 1
      ) {
        continue;
      }
      out[key] = walk(value);
    }
    if (out.type === 'object' && out.properties && typeof out.properties === 'object') {
      out.required = Object.keys(out.properties as Record<string, unknown>);
    }
    return out;
  };
  const {$schema: _drop, ...rest} = schema;
  return walk(rest) as Record<string, unknown>;
}

export async function runStructured(
  rawOpts: RunStructuredOptions,
): Promise<StructuredResult> {
  const opts = {...rawOpts, jsonSchema: sanitizeJsonSchema(rawOpts.jsonSchema)};
  switch (opts.provider) {
    case 'openrouter': {
      const apiKey = opts.openRouterApiKey ?? process.env.OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('OPENROUTER_API_KEY não definida.');
      return generateWithOpenRouter({
        systemPrompt: opts.systemPrompt,
        userMessage: opts.userMessage,
        jsonSchema: opts.jsonSchema,
        apiKey,
        model: opts.model,
      });
    }
    case 'claude-cli':
      return generateWithClaudeCli({
        systemPrompt: opts.systemPrompt,
        userMessage: opts.userMessage,
        jsonSchema: opts.jsonSchema,
        cliPath: opts.cliPath,
      });
    case 'anthropic':
    default:
      return generateWithAnthropic({
        systemPrompt: opts.systemPrompt,
        userMessage: opts.userMessage,
        jsonSchema: opts.jsonSchema,
        model: opts.model,
        maxTokens: opts.maxTokens,
      });
  }
}

/** Resolve o provider a partir das env vars injetadas pelo app. */
export function providerFromEnv(): RunStructuredOptions['provider'] {
  const p = process.env.GMOTION_AI_PROVIDER;
  if (p === 'openrouter' || p === 'claude-cli' || p === 'anthropic') return p;
  return 'anthropic';
}
