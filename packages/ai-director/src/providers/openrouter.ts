/**
 * Provider OpenRouter: endpoint compatível com OpenAI, structured output via json_schema.
 * Requer OPENROUTER_API_KEY. Modelo default aponta pra Claude via OpenRouter.
 * `usage: {include: true}` faz o OpenRouter devolver o custo real em usage.cost.
 */
import {estimateCostUsd} from './pricing';
import type {StructuredResult} from './types';

export interface OpenRouterOptions {
  systemPrompt: string;
  userMessage: string;
  jsonSchema: Record<string, unknown>;
  apiKey: string;
  model?: string;
}

export async function generateWithOpenRouter(
  opts: OpenRouterOptions,
): Promise<StructuredResult> {
  const model = opts.model ?? 'anthropic/claude-opus-4-8';
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      usage: {include: true},
      messages: [
        {role: 'system', content: opts.systemPrompt},
        {role: 'user', content: opts.userMessage},
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {name: 'result', strict: true, schema: opts.jsonSchema},
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter erro ${res.status}: ${text}`);
  }

  const data = (await res.json()) as {
    choices?: {message?: {content?: string}}[];
    usage?: {cost?: number; prompt_tokens?: number; completion_tokens?: number};
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter não retornou conteúdo na resposta.');
  }

  const usage = data.usage ?? {};
  // Prefere o custo real do OpenRouter; se ausente, estima pelos tokens.
  const costUsd =
    typeof usage.cost === 'number'
      ? usage.cost
      : estimateCostUsd(
          model,
          usage.prompt_tokens ?? 0,
          usage.completion_tokens ?? 0,
        );

  return {
    output: JSON.parse(content),
    costUsd,
    usage: {
      inputTokens: usage.prompt_tokens ?? 0,
      outputTokens: usage.completion_tokens ?? 0,
    },
  };
}
