/**
 * CLI do ai-director.
 *
 * Gerar:    pnpm --filter @gmotion/ai-director generate "reel sobre café, 3 cenas"
 * Refinar:  pnpm --filter @gmotion/ai-director generate --refine "deixa o zoom mais forte"
 * Opções:   --out <path>   (default: apps/studio/src/generated/ai-timeline.json)
 *           --model <id>   (default: claude-opus-4-8)
 *
 * Provider (env GMOTION_AI_PROVIDER):
 *   (default/unset) -> Anthropic SDK direto, requer ANTHROPIC_API_KEY.
 *   "openrouter"    -> requer OPENROUTER_API_KEY (opcional OPENROUTER_MODEL).
 *   "claude-cli"    -> usa o binário `claude` já autenticado (opcional CLAUDE_CLI_PATH).
 *
 * Depois: pnpm dev -> composition "AiDirected" (reinicie o Studio para recarregar o JSON).
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {z} from 'zod';
import {parseTimeline, timelineDuration, timelineSchema} from './schema';
import {buildSystemPrompt, generateUserMessage, refineUserMessage} from './prompts';
import {runStructured, providerFromEnv} from './providers';

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = path.resolve(
  here,
  '../../../apps/studio/src/generated/ai-timeline.json',
);

const parseArgs = (argv: string[]) => {
  const args = {refine: false, out: DEFAULT_OUT, model: 'claude-opus-4-8', text: ''};
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--refine') {
      args.refine = true;
    } else if (a === '--out' && argv[i + 1]) {
      args.out = path.resolve(String(argv[++i]));
    } else if (a === '--model' && argv[i + 1]) {
      args.model = String(argv[++i]);
    } else if (a !== undefined) {
      rest.push(a);
    }
  }
  args.text = rest.join(' ').trim();
  return args;
};

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (!args.text) {
    console.error(
      'Uso: generate "descrição do vídeo"  |  generate --refine "instrução de ajuste"',
    );
    process.exit(1);
  }

  let userMessage: string;
  if (args.refine) {
    if (!fs.existsSync(args.out)) {
      console.error(`--refine precisa de uma timeline existente em ${args.out}`);
      process.exit(1);
    }
    const current = parseTimeline(JSON.parse(fs.readFileSync(args.out, 'utf8')));
    userMessage = refineUserMessage(current, args.text);
  } else {
    userMessage = generateUserMessage(args.text);
  }

  const provider = providerFromEnv();
  console.error(`Chamando ${args.model} (provider: ${provider})...`);

  const {output, costUsd} = await runStructured({
    provider,
    systemPrompt: buildSystemPrompt(),
    userMessage,
    jsonSchema: z.toJSONSchema(timelineSchema) as Record<string, unknown>,
    model: provider === 'openrouter' ? (process.env.OPENROUTER_MODEL ?? args.model) : args.model,
    cliPath: process.env.CLAUDE_CLI_PATH,
  });

  const timeline = parseTimeline(output);
  fs.mkdirSync(path.dirname(args.out), {recursive: true});
  fs.writeFileSync(args.out, JSON.stringify(timeline, null, 2), 'utf8');

  const frames = timelineDuration(timeline);
  console.error(
    `OK: ${timeline.scenes.length} cenas, ${frames} frames (${(frames / timeline.fps).toFixed(1)}s) — custo ~$${costUsd.toFixed(4)} -> ${args.out}`,
  );
  console.error('Abra o Studio (pnpm dev) e selecione "AiDirected". Se já estava aberto, reinicie.');
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
