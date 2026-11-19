/**
 * Provider Claude Code CLI: usa o binário `claude` já autenticado na máquina
 * do usuário (assinatura Claude, não API key). Roda em modo não-interativo
 * (`-p`/--print) com saída estruturada via --json-schema.
 *
 * O prompt do usuário vai por STDIN (não argv): no Windows a linha de comando
 * inteira é limitada a ~32k chars e o refine embute a timeline completa no
 * prompt — via argv o spawn estourava e o "modo Claude" falhava.
 * `total_cost_usd` da saída JSON vira o custo real do passo.
 */
import {spawn} from 'node:child_process';
import type {StructuredResult} from './types';

export interface ClaudeCliOptions {
  systemPrompt: string;
  userMessage: string;
  jsonSchema: Record<string, unknown>;
  cliPath?: string;
}

export async function generateWithClaudeCli(
  opts: ClaudeCliOptions,
): Promise<StructuredResult> {
  const bin = opts.cliPath || process.env.CLAUDE_CLI_PATH || 'claude';

  return new Promise((resolvePromise, reject) => {
    const child = spawn(
      bin,
      [
        '-p',
        '--output-format',
        'json',
        '--system-prompt',
        opts.systemPrompt,
        '--json-schema',
        JSON.stringify(opts.jsonSchema),
      ],
      {stdio: ['pipe', 'pipe', 'pipe']},
    );

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      reject(new Error(`Não foi possível executar "${bin}": ${err.message}`));
    });
    child.on('close', (code) => {
      if (code !== 0) {
        try {
          const parsed = JSON.parse(stdout);
          reject(new Error(`claude CLI retornou erro: ${parsed.result ?? stderr ?? stdout}`));
        } catch {
          reject(new Error(`claude CLI saiu com código ${code}: ${stderr || stdout}`));
        }
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        if (parsed.is_error) {
          reject(new Error(`claude CLI retornou erro: ${parsed.result ?? stderr}`));
          return;
        }
        const costUsd = typeof parsed.total_cost_usd === 'number' ? parsed.total_cost_usd : 0;
        const usage = {
          inputTokens: parsed.usage?.input_tokens ?? 0,
          outputTokens: parsed.usage?.output_tokens ?? 0,
        };
        const output =
          parsed.structured_output !== undefined
            ? parsed.structured_output
            : JSON.parse(parsed.result);
        resolvePromise({output, costUsd, usage});
      } catch (err) {
        reject(
          new Error(`Falha ao interpretar saída do claude CLI: ${(err as Error).message}`),
        );
      }
    });

    child.stdin.write(opts.userMessage);
    child.stdin.end();
  });
}
