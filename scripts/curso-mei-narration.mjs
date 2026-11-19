/**
 * Gera a narração do CursoMeiPromo por bloco via ElevenLabs.
 *
 * Uso:
 *   node scripts/curso-mei-narration.mjs        (lê ELEVENLABS_API_KEY do .env na raiz)
 *   ELEVENLABS_API_KEY=... node scripts/curso-mei-narration.mjs
 *   (opcional) CURSO_MEI_VOICE_ID=<voice_id de narrador PT-BR da sua conta>
 *
 * Saída:
 *   apps/studio/public/audio/curso-mei/{gancho,dor,agitacao,virada,prova,oferta,cta}.mp3
 *   apps/studio/src/curso-mei/curso-mei-timing.json  (durações medidas, hasAudio: true)
 *
 * O Remotion lê o timing.json e dimensiona cada cena pela duração real do áudio.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseMedia} from '@remotion/media-parser';
import {nodeReader} from '@remotion/media-parser/node';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIO_DIR = path.join(ROOT, 'apps', 'studio', 'public', 'audio', 'curso-mei');
const TIMING_PATH = path.join(
  ROOT,
  'apps',
  'studio',
  'src',
  'curso-mei',
  'curso-mei-timing.json',
);

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

// Voz: defina CURSO_MEI_VOICE_ID com um narrador PT-BR da sua conta/voice library.
const VOICE_ID = process.env.CURSO_MEI_VOICE_ID ?? 'pNInz6obpgDQGcFmaJgB';
const MODEL_ID = process.env.CURSO_MEI_TTS_MODEL ?? 'eleven_multilingual_v2';

// Blocos do roteiro (briefing do curso MEI). Pausas com "…" e pontuação guiam o ritmo.
// Tom confiante, direto, sem jargão. Frases curtas, pausas nos números.
const BLOCKS = {
  gancho:
    '78 por cento das novas empresas abertas no Brasil este ano são MEIs. Mas só em 2024, mais de 570 mil perderam o MEI por descontrole no faturamento.',
  dor:
    'Você sabe exatamente quanto pode faturar sem perder o MEI? São 81 mil reais por ano… perto de 6.750 por mês. Passou de 20 por cento, e você está fora.',
  agitacao:
    'DAS atrasado. Multa. Juros. E o dinheiro da empresa… misturado com o seu. Parece pouco. Mas some rápido, sem controle.',
  virada:
    'O curso organiza as finanças do seu MEI em poucas semanas. Separar o pessoal da empresa. Fluxo de caixa simples. Precificação correta. E como não estourar o limite.',
  prova:
    'São mais de 11 milhões e meio de MEIs ativos no Brasil. Formalizar foi o primeiro passo. Agora é hora de profissionalizar a gestão.',
  oferta:
    'Cem por cento online, linguagem simples, sem economês. Com planilha de fluxo de caixa, calculadora de limite, suporte pro DAS e certificado.',
  cta: 'Garanta sua vaga agora. Feito pra quem é MEI.',
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

fs.writeFileSync(
  TIMING_PATH,
  JSON.stringify({hasAudio: true, voiceId: VOICE_ID, blocks}, null, 2),
);

const total = Object.values(blocks).reduce((s, b) => s + b.seconds, 0);
console.error(`\nOK: ${total.toFixed(1)}s de narração -> ${TIMING_PATH}`);
console.error('Reinicie o Studio (pnpm dev) para as cenas se ajustarem ao áudio real.');
