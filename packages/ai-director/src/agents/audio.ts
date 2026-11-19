/**
 * Agente 2 — Áudio (narração + SFX). Gera o roteiro de narração e, se houver
 * ELEVENLABS_API_KEY, sintetiza o mp3 e adiciona uma faixa de áudio à timeline.
 * Sem a chave, entrega só o roteiro (a faixa fica de fora, sem quebrar o fluxo).
 */
import fs from 'node:fs';
import path from 'node:path';
import {z} from 'zod';
import {callStructuredAgent, planText} from './shared';
import {pickMusicAsset, resolveAssetPath} from '../assets';
import type {Brief, CallConfig, OnPhase, Plan, TimelineSchema, TimelineStep} from './types';

const narrationSchema = z.object({
  narration: z.string().describe('Texto corrido da narração, com pausas via pontuação'),
  sfx: z.array(z.string()).describe('Sugestões de efeitos sonoros por momento'),
});
type Narration = z.infer<typeof narrationSchema>;

const SYSTEM = `Você é o sound designer/narrador de uma equipe de motion graphics. A partir do plano, escreva a narração (locução) do vídeo em PT-BR, com ritmo de viral e pausas guiadas por pontuação, e sugira efeitos sonoros. Responda SOMENTE com o JSON.`;

const VOICE_ID = process.env.GMOTION_TTS_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';
const MODEL_ID = process.env.GMOTION_TTS_MODEL ?? 'eleven_multilingual_v2';
const VOICE_SETTINGS = {
  stability: 0.38,
  similarity_boost: 0.8,
  style: 0.45,
  use_speaker_boost: true,
};

async function synthesize(text: string, outFile: string): Promise<void> {
  const apiKey = process.env.ELEVENLABS_API_KEY as string;
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {'xi-api-key': apiKey, 'content-type': 'application/json'},
      body: JSON.stringify({text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS}),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  fs.mkdirSync(path.dirname(outFile), {recursive: true});
  fs.writeFileSync(outFile, Buffer.from(await res.arrayBuffer()));
}

/**
 * Núcleo compartilhado GM/EV: escreve o roteiro de narração e tenta o TTS.
 * Retorna o mp3 gerado (ou null) + custo + resumo do que aconteceu.
 */
export async function produceNarration(
  plan: Plan,
  brief: Brief,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<{file: string | null; costUsd: number; summary: string}> {
  onPhase?.('Escrevendo narração…');
  const {output, costUsd} = await callStructuredAgent<Narration>(
    cfg,
    SYSTEM,
    `Plano:\n${planText(plan)}\n\nEscreva a narração e os SFX.`,
    z.toJSONSchema(narrationSchema) as Record<string, unknown>,
  );
  const narration = narrationSchema.parse(output);

  if (!process.env.ELEVENLABS_API_KEY) {
    return {
      file: null,
      costUsd,
      summary: 'Narração escrita (TTS pulado — sem ELEVENLABS_API_KEY)',
    };
  }

  const outFile = path.join(brief.projectDir, 'audio', 'narration.mp3');
  try {
    onPhase?.('Sintetizando voz (TTS)…');
    await synthesize(narration.narration, outFile);
    return {file: outFile, costUsd, summary: `Narração sintetizada → ${outFile}`};
  } catch (err) {
    return {
      file: null,
      costUsd,
      summary: `Narração escrita; TTS falhou: ${(err as Error).message}`,
    };
  }
}

export async function runAudio(
  current: TimelineSchema,
  plan: Plan,
  brief: Brief,
  cfg: CallConfig,
  onPhase?: OnPhase,
): Promise<TimelineStep> {
  const {file, costUsd, summary} = await produceNarration(plan, brief, cfg, onPhase);

  const tracks = [...(current.audio ?? [])];
  if (file) tracks.push({src: file, volume: 1, startFrame: 0, role: 'narration'});

  let musicSummary = '';
  if (brief.assetManifest) {
    const music = pickMusicAsset(brief.assetManifest, plan);
    if (music) {
      tracks.push({
        src: resolveAssetPath(brief.assetManifest, music),
        volume: 0.25,
        startFrame: 0,
        role: 'music',
      });
      musicSummary = `; trilha: ${music.path} (asset cadastrado)`;
    } else {
      musicSummary = '; nenhuma trilha compatível na biblioteca — vídeo sem música';
    }
  }

  const timeline: TimelineSchema =
    tracks.length > 0 ? {...current, audio: tracks} : current;
  return {timeline, costUsd, summary: summary + musicSummary};
}
