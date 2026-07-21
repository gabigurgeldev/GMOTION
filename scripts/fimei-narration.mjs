/**
 * Gera a narração do vídeo FiMEI por bloco via ElevenLabs.
 *
 * Uso:
 *   node scripts/fimei-narration.mjs        (lê ELEVENLABS_API_KEY do .env na raiz)
 *   ELEVENLABS_API_KEY=... node scripts/fimei-narration.mjs
 *   (opcional) FIMEI_VOICE_ID=<voice_id de narrador PT-BR da sua conta>
 *
 * Saída:
 *   apps/studio/public/audio/fimei/{hook,agitacao,solucao,prova,cta}.mp3
 *   apps/studio/src/fimei/fimei-timing.json  (durações medidas, hasAudio: true)
 *
 * O Remotion lê o timing.json e dimensiona cada cena pela duração real do áudio.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseMedia} from '@remotion/media-parser';
import {nodeReader} from '@remotion/media-parser/node';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = path.join(ROOT, 'apps', 'studio', 'public', 'audio', 'fimei');
const TIMING_PATH = path.join(ROOT, 'apps', 'studio', 'src', 'fimei', 'fimei-timing.json');

// Carrega .env da raiz do monorepo se ELEVENLABS_API_KEY ainda não estiver no ambiente
if (!process.env.ELEVENLABS_API_KEY) {
  const envPath = path.join(ROOT, '.env');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m) process.env[m[1]] = m[2];
    }
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('ELEVENLABS_API_KEY não definida. Exporte a chave e rode de novo.');
  process.exit(1);
}

// Voz: defina FIMEI_VOICE_ID com um narrador PT-BR da sua conta/voice library.
// Fallback: "Adam" (premade multilingual) — funciona em PT-BR mas prefira uma voz BR nativa.
const VOICE_ID = process.env.FIMEI_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';
const MODEL_ID = process.env.FIMEI_TTS_MODEL ?? 'eleven_multilingual_v2';

// Blocos do roteiro (docs/fimei-roteiro.md). Pausas com "…" e pontuação guiam o ritmo.
const BLOCKS = {
  hook: 'Você é MEI… e não sabe se tá no lucro ou no prejuízo?',
  agitacao:
    'Planilha bagunçada. Conta pessoal misturada com a da empresa. E aquele susto no fim do mês, quando o dinheiro simplesmente… sumiu. Sem falar no DAS, que você só lembra quando já venceu.',
  solucao:
    'Respira. Conhece o FiMEI. Lança receita e despesa em segundos. Separa o dinheiro do teu negócio, do teu bolso. Te avisa do DAS antes de vencer. Sempre. E mostra teu lucro de verdade, na hora.',
  prova:
    'Não é planilha. Não é sistema de empresa grande. É feito pra quem toca o negócio sozinho: você.',
  cta: 'Clica no link e organiza teu MEI hoje. Leva dois minutos.',
};

// Entonação expressiva: stability baixa = mais variação; style dá ênfase.
const VOICE_SETTINGS = {
  stability: 0.38,
  similarity_boost: 0.8,
  style: 0.45,
  use_speaker_boost: true,
};

const tts = async (text) => {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: {'xi-api-key': API_KEY, 'content-type': 'application/json'},
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: VOICE_SETTINGS,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
};

const durationOf = async (file) => {
  const {durationInSeconds} = await parseMedia({
    src: file,
    reader: nodeReader,
    fields: {durationInSeconds: true},
    acknowledgeRemotionLicense: true,
  });
  return durationInSeconds ?? 0;
};

fs.mkdirSync(AUDIO_DIR, {recursive: true});

const blocks = {};
for (const [name, text] of Object.entries(BLOCKS)) {
  process.stderr.write(`Gerando ${name}... `);
  const audio = await tts(text);
  const file = path.join(AUDIO_DIR, `${name}.mp3`);
  fs.writeFileSync(file, audio);
  const seconds = await durationOf(file);
  blocks[name] = {seconds: Number(seconds.toFixed(3))};
  console.error(`${seconds.toFixed(2)}s`);
}

fs.mkdirSync(path.dirname(TIMING_PATH), {recursive: true});
fs.writeFileSync(
  TIMING_PATH,
  JSON.stringify({hasAudio: true, voiceId: VOICE_ID, blocks}, null, 2),
);

const total = Object.values(blocks).reduce((s, b) => s + b.seconds, 0);
console.error(`\nOK: ${total.toFixed(1)}s de narração -> ${TIMING_PATH}`);
console.error('Reinicie o Studio (pnpm dev) para as cenas se ajustarem ao áudio real.');
