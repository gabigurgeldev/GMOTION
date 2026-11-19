/**
 * Provider Anthropic (SDK direto). Requer ANTHROPIC_API_KEY no ambiente.
 * Structured output via zodOutputFormat não é usado aqui porque os agentes
 * passam JSON Schema puro — usamos tool-use forçado com o schema como input_schema
 * pra obter saída estruturada de forma provider-agnóstica.
 */
import Anthropic from '@anthropic-ai/sdk';
import {estimateCostUsd} from './pricing';
import type {StructuredResult} from './types';

export interface AnthropicOptions {
  systemPrompt: string;
  userMessage: string;
  jsonSchema: Record<string, unknown>;
  model: string;
  maxTokens?: number;
}

export async function generateWithAnthropic(
  opts: AnthropicOptions,
): Promise<StructuredResult> {
  const client = new Anthropic();
  const response = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 16000,
    system: opts.systemPrompt,
    messages: [{role: 'user', content: opts.userMessage}],
    tools: [
      {
        name: 'emit',
        description: 'Emite o resultado estruturado exigido.',
        input_schema: opts.jsonSchema as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: {type: 'tool', name: 'emit'},
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    throw new Error('Anthropic não retornou tool_use com o resultado.');
  }

  const usage = response.usage;
  const costUsd = estimateCostUsd(
    opts.model,
    usage.input_tokens,
    usage.output_tokens,
  );

  return {
    output: toolUse.input,
    costUsd,
    usage: {inputTokens: usage.input_tokens, outputTokens: usage.output_tokens},
  };
}
