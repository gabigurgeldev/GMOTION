/**
 * Tabela de preço aproximada (USD por 1M tokens) para estimar custo quando o
 * provider não devolve custo direto (caso do Anthropic SDK). OpenRouter e o
 * claude CLI reportam custo real; aqui é só fallback/estimativa.
 */
export interface ModelPrice {
  inputPerMTok: number;
  outputPerMTok: number;
}

const PRICES: Record<string, ModelPrice> = {
  'claude-opus-4-8': {inputPerMTok: 5, outputPerMTok: 25},
  'claude-sonnet-5': {inputPerMTok: 3, outputPerMTok: 15},
  'claude-haiku-4-5': {inputPerMTok: 1, outputPerMTok: 5},
};

const DEFAULT_PRICE: ModelPrice = {inputPerMTok: 5, outputPerMTok: 25};

export const priceFor = (model: string): ModelPrice => {
  // Aceita nomes com sufixo de data (claude-opus-4-8-20260101) por prefixo.
  const hit = Object.keys(PRICES).find((k) => model.startsWith(k));
  return (hit && PRICES[hit]) || DEFAULT_PRICE;
};

export const estimateCostUsd = (
  model: string,
  inputTokens: number,
  outputTokens: number,
): number => {
  const p = priceFor(model);
  return (
    (inputTokens / 1_000_000) * p.inputPerMTok +
    (outputTokens / 1_000_000) * p.outputPerMTok
  );
};
