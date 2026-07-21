/**
 * Sintetiza os efeitos sonoros do FimeiPromo via DSP puro (Node, zero deps).
 * Sem samples baixados — evita qualquer questão de licença. Determinístico:
 * mesma seed, mesmo áudio, sempre (mesmo espírito do seededNoise do @gmotion/core).
 *
 * Uso: node scripts/fimei-sfx.mjs
 *
 * Saída:
 *   apps/studio/public/audio/fimei/sfx/{bass-hit,whoosh,tick}.wav
 *   apps/studio/public/audio/fimei/music.wav
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SFX_DIR = path.join(ROOT, 'apps', 'studio', 'public', 'audio', 'fimei', 'sfx');
const MUSIC_PATH = path.join(ROOT, 'apps', 'studio', 'public', 'audio', 'fimei', 'music.wav');

const SR = 44100;
const TWO_PI = Math.PI * 2;

/** Ruído determinístico (mesmo algoritmo de seededNoise em @gmotion/core). */
const noise = (seed, x) => {
  const s = Math.sin(seed * 127.1 + x * 311.7) * 43758.5453123;
  return (s - Math.floor(s)) * 2 - 1;
};

const samples = (durationSec) => new Float64Array(Math.round(durationSec * SR));

const expDecay = (t, tau) => Math.exp(-t / tau);

const normalize = (buf, peak = 0.92) => {
  let max = 0;
  for (const v of buf) max = Math.max(max, Math.abs(v));
  if (max === 0) return buf;
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] *= g;
  return buf;
};

const mix = (target, source, offsetSec = 0, gain = 1) => {
  const offset = Math.round(offsetSec * SR);
  for (let i = 0; i < source.length; i++) {
    const j = offset + i;
    if (j >= 0 && j < target.length) target[j] += source[i] * gain;
  }
};

/** WAV PCM 16-bit mono. */
const toWav = (buf) => {
  const header = Buffer.alloc(44);
  const dataSize = buf.length * 2;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const data = Buffer.alloc(dataSize);
  for (let i = 0; i < buf.length; i++) {
    const v = Math.max(-1, Math.min(1, buf[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  return Buffer.concat([header, data]);
};

/* ------------------------------------------------------------------ */
/* BASS HIT — thump grave para hook/solução/CTA */
const renderBassHit = () => {
  const dur = 0.5;
  const buf = samples(dur);
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const env = t < 0.004 ? t / 0.004 : expDecay(t - 0.004, 0.14);
    // Pitch cai de 120Hz -> 45Hz nos primeiros 80ms (thump clássico)
    const freq = 45 + 75 * expDecay(t, 0.05);
    const phase = TWO_PI * freq * t;
    const click = t < 0.006 ? (1 - t / 0.006) * noise(1, i) * 0.5 : 0;
    buf[i] = (Math.sin(phase) * env + click) * 0.95;
  }
  return normalize(buf);
};

/* ------------------------------------------------------------------ */
/* WHOOSH — corte de cena, ruído filtrado varrendo de agudo pra grave */
const renderWhoosh = () => {
  const dur = 0.38;
  const buf = samples(dur);
  let lp = 0; // estado do filtro passa-baixa (one-pole)
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const p = t / dur;
    const env = Math.sin(Math.PI * p) ** 1.3; // sobe e desce suave
    // Cutoff varre de ~3500Hz pra ~300Hz — simulado por one-pole lowpass
    const cutoff = 3500 * expDecay(t, 0.12) + 250;
    const alpha = Math.min(1, cutoff / SR);
    const n = noise(2, i * 0.7);
    lp += alpha * (n - lp);
    buf[i] = lp * env;
  }
  return normalize(buf, 0.8);
};

/* ------------------------------------------------------------------ */
/* TICK — clique curto e seco pra cada benefício listado */
const renderTick = () => {
  const dur = 0.05;
  const buf = samples(dur);
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const env = expDecay(t, 0.012);
    const ping = Math.sin(TWO_PI * 2800 * t) * 0.6;
    const click = noise(3, i) * 0.5;
    buf[i] = (ping + click) * env;
  }
  return normalize(buf, 0.75);
};

/* ------------------------------------------------------------------ */
/* MÚSICA — build-up sutil: kick + pad + riser final. Fica atrás da narração. */
const renderMusic = (durationSec) => {
  const buf = samples(durationSec);
  const bpm = 100;
  const beatSec = 60 / bpm;

  // Pad sustentado (Em9-ish): E2, G2, B2, D3 — sobe de volume conforme o vídeo avança
  const chord = [82.41, 98.0, 123.47, 146.83];
  for (let i = 0; i < buf.length; i++) {
    const t = i / SR;
    const progress = t / durationSec;
    const padGain = 0.02 + progress * 0.05;
    let s = 0;
    for (const f of chord) {
      s += Math.sin(TWO_PI * f * t + Math.sin(t * 0.3) * 0.02);
    }
    s = (s / chord.length) * padGain;
    // Trêmulo lento pra não ficar estático
    s *= 1 + 0.08 * Math.sin(TWO_PI * 0.25 * t);
    buf[i] += s;
  }

  // Kick a cada batida, ganho crescendo com o progresso (energia subindo)
  const kick = renderBassHit();
  const beats = Math.floor(durationSec / beatSec);
  for (let b = 0; b < beats; b++) {
    const t = b * beatSec;
    const progress = t / durationSec;
    const gain = 0.12 + progress * 0.22;
    mix(buf, kick, t, gain);
  }

  // Hi-hat determinístico na segunda metade (mais denso perto do fim)
  const tick = renderTick();
  const halfStart = durationSec * 0.5;
  let hatT = halfStart;
  let hatIndex = 0;
  while (hatT < durationSec - 0.2) {
    const progress = hatT / durationSec;
    const density = 0.5 - progress * 0.3; // intervalo diminui = mais denso
    mix(buf, tick, hatT, 0.05 + progress * 0.08);
    hatT += Math.max(0.14, density);
    hatIndex++;
  }

  // Riser nos últimos 2.5s: ruído subindo de volume e brilho, leva ao CTA
  const riserDur = 2.5;
  const riserStart = durationSec - riserDur;
  let lp = 0;
  for (let i = 0; i < Math.round(riserDur * SR); i++) {
    const t = i / SR;
    const p = t / riserDur;
    const cutoff = 400 + p * p * 6000;
    const alpha = Math.min(1, cutoff / SR);
    const n = noise(5, i * 0.9);
    lp += alpha * (n - lp);
    const env = p * p * 0.22;
    const idx = Math.round((riserStart + t) * SR);
    if (idx < buf.length) buf[idx] += lp * env;
  }

  return normalize(buf, 0.85);
};

/* ------------------------------------------------------------------ */
fs.mkdirSync(SFX_DIR, {recursive: true});

const writeWav = (file, buf) => {
  fs.writeFileSync(file, toWav(buf));
  console.error(`OK: ${file} (${(buf.length / SR).toFixed(2)}s)`);
};

writeWav(path.join(SFX_DIR, 'bass-hit.wav'), renderBassHit());
writeWav(path.join(SFX_DIR, 'whoosh.wav'), renderWhoosh());
writeWav(path.join(SFX_DIR, 'tick.wav'), renderTick());

// Duração do vídeo: soma dos blocos de narração + freeze do CTA - overlap das transições.
// Mantido em sincronia manual com apps/studio/src/fimei/timing.ts.
let timingBlocks;
try {
  timingBlocks = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, 'apps', 'studio', 'src', 'fimei', 'fimei-timing.json'),
      'utf8',
    ),
  ).blocks;
} catch {
  timingBlocks = {hook: {seconds: 4}, agitacao: {seconds: 8}, solucao: {seconds: 14}, prova: {seconds: 8}, cta: {seconds: 4}};
}
const CTA_FREEZE_SEC = 4;
const TRANSITION_SEC = (10 / 30) * 4;
const totalSec =
  Object.values(timingBlocks).reduce((s, b) => s + b.seconds, 0) +
  CTA_FREEZE_SEC -
  TRANSITION_SEC;

writeWav(MUSIC_PATH, renderMusic(totalSec));

console.error(`\nSFX prontos. Ative em apps/studio/src/fimei/timing.ts: HAS_SFX = true, HAS_MUSIC = true.`);
