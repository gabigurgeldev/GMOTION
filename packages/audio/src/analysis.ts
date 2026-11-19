/**
 * Análise de áudio em TS puro — sem FFT pesada, sem libs nativas.
 * Todas as funções são puras e determinísticas: mesmo PCM de entrada,
 * mesmo resultado, sempre. Nada aqui toca I/O ou hooks.
 */

export type OnsetOptions = {
  /** Janela de energia em samples. Default: 1024. */
  windowSize?: number;
  /** Hop entre janelas em samples. Default: 512. */
  hopSize?: number;
  /** Multiplicador do threshold adaptativo. Default: 1.5. */
  sensitivity?: number;
  /** Gap mínimo entre onsets em segundos. Default: 0.1. */
  minGapSeconds?: number;
};

export type BpmOptions = {
  minBpm?: number;
  maxBpm?: number;
};

/** RMS por janela de 1/fps segundos, normalizado pelo pico (0-1). */
export const computeRmsEnvelope = (
  samples: Float32Array,
  sampleRate: number,
  fps: number,
): number[] => {
  const samplesPerFrame = sampleRate / fps;
  const frameCount = Math.ceil(samples.length / samplesPerFrame);
  const envelope: number[] = new Array<number>(frameCount).fill(0);

  for (let i = 0; i < frameCount; i++) {
    const start = Math.floor(i * samplesPerFrame);
    const end = Math.min(samples.length, Math.floor((i + 1) * samplesPerFrame));
    let sum = 0;
    for (let s = start; s < end; s++) {
      const v = samples[s] ?? 0;
      sum += v * v;
    }
    const count = Math.max(1, end - start);
    envelope[i] = Math.sqrt(sum / count);
  }

  const peak = envelope.reduce((max, v) => Math.max(max, v), 0);
  if (peak > 0) {
    for (let i = 0; i < envelope.length; i++) {
      envelope[i] = (envelope[i] ?? 0) / peak;
    }
  }
  return envelope;
};

/**
 * Detecção de onsets por novidade de energia:
 * energia por janela → derivada positiva → threshold adaptativo (média móvel)
 * → pico local → gap mínimo.
 */
export const detectOnsets = (
  samples: Float32Array,
  sampleRate: number,
  {
    windowSize = 1024,
    hopSize = 512,
    sensitivity = 1.5,
    minGapSeconds = 0.1,
  }: OnsetOptions = {},
): number[] => {
  const windowCount = Math.max(0, Math.floor((samples.length - windowSize) / hopSize) + 1);
  if (windowCount < 3) {
    return [];
  }

  const energies: number[] = new Array<number>(windowCount).fill(0);
  for (let i = 0; i < windowCount; i++) {
    const start = i * hopSize;
    let sum = 0;
    for (let s = start; s < start + windowSize; s++) {
      const v = samples[s] ?? 0;
      sum += v * v;
    }
    energies[i] = sum / windowSize;
  }

  // Novidade: só o aumento de energia importa (ataques, não decaimentos).
  const novelty: number[] = new Array<number>(windowCount).fill(0);
  for (let i = 1; i < windowCount; i++) {
    novelty[i] = Math.max(0, (energies[i] ?? 0) - (energies[i - 1] ?? 0));
  }

  const meanWindow = 10;
  const epsilon = 1e-6;
  const minGapWindows = Math.max(1, Math.round((minGapSeconds * sampleRate) / hopSize));
  const onsets: number[] = [];
  let lastOnsetWindow = -Infinity;

  for (let i = 1; i < windowCount; i++) {
    const lo = Math.max(0, i - meanWindow);
    const hi = Math.min(windowCount - 1, i + meanWindow);
    let sum = 0;
    for (let j = lo; j <= hi; j++) {
      sum += novelty[j] ?? 0;
    }
    const threshold = (sum / (hi - lo + 1)) * sensitivity + epsilon;

    const current = novelty[i] ?? 0;
    if (current <= threshold) continue;

    // Pico local em ±2 janelas.
    let isPeak = true;
    for (let j = Math.max(0, i - 2); j <= Math.min(windowCount - 1, i + 2); j++) {
      if ((novelty[j] ?? 0) > current) {
        isPeak = false;
        break;
      }
    }
    if (!isPeak) continue;

    if (i - lastOnsetWindow < minGapWindows) continue;
    lastOnsetWindow = i;
    onsets.push((i * hopSize) / sampleRate);
  }

  return onsets;
};

/**
 * BPM por histograma de intervalos entre onsets adjacentes,
 * dobrando/dividindo cada intervalo até cair na faixa [minBpm, maxBpm].
 * Retorna 0 quando não há onsets suficientes.
 */
export const estimateBpm = (
  onsets: number[],
  {minBpm = 60, maxBpm = 200}: BpmOptions = {},
): number => {
  if (onsets.length < 3) return 0;

  const bpms: number[] = [];
  for (let i = 1; i < onsets.length; i++) {
    const interval = (onsets[i] ?? 0) - (onsets[i - 1] ?? 0);
    if (interval <= 0) continue;
    let bpm = 60 / interval;
    while (bpm < minBpm) bpm *= 2;
    while (bpm > maxBpm) bpm /= 2;
    if (bpm >= minBpm && bpm <= maxBpm) bpms.push(bpm);
  }
  if (bpms.length === 0) return 0;

  // Histograma de 1 BPM com espalhamento ±1 pra tolerar jitter.
  const bins = new Map<number, number>();
  for (const bpm of bpms) {
    const bin = Math.round(bpm);
    for (const offset of [-1, 0, 1]) {
      const weight = offset === 0 ? 1 : 0.5;
      bins.set(bin + offset, (bins.get(bin + offset) ?? 0) + weight);
    }
  }
  let bestBin = 0;
  let bestScore = -1;
  for (const [bin, score] of bins) {
    if (score > bestScore) {
      bestScore = score;
      bestBin = bin;
    }
  }

  // Refina: média dos BPMs brutos perto do bin vencedor.
  const near = bpms.filter((b) => Math.abs(b - bestBin) <= 3);
  if (near.length === 0) return bestBin;
  return near.reduce((sum, b) => sum + b, 0) / near.length;
};

/**
 * Gera a grade de beats: acha a fase que melhor alinha a grade de período
 * 60/bpm com os onsets detectados e projeta a grade na duração toda.
 */
export const pickBeats = (
  onsets: number[],
  bpm: number,
  durationInSeconds: number,
  {toleranceSeconds = 0.07}: {toleranceSeconds?: number} = {},
): number[] => {
  if (bpm <= 0 || durationInSeconds <= 0) return [];
  const period = 60 / bpm;

  const scorePhase = (phase: number): number => {
    let score = 0;
    for (const onset of onsets) {
      const offset = (((onset - phase) % period) + period) % period;
      const distance = Math.min(offset, period - offset);
      if (distance <= toleranceSeconds) score++;
    }
    return score;
  };

  let bestPhase = 0;
  let bestScore = -1;
  const candidates = onsets.slice(0, 64);
  for (const onset of candidates) {
    const phase = ((onset % period) + period) % period;
    const score = scorePhase(phase);
    if (score > bestScore) {
      bestScore = score;
      bestPhase = phase;
    }
  }

  const beats: number[] = [];
  for (let t = bestPhase; t < durationInSeconds; t += period) {
    beats.push(t);
  }
  return beats;
};

/** Amplitude no frame (fps do envelope). Fora do range → 0. */
export const amplitudeAtFrame = (envelope: number[], frame: number): number => {
  if (frame < 0 || frame >= envelope.length) return 0;
  return envelope[Math.floor(frame)] ?? 0;
};

/** Há beat a até `toleranceSeconds` do instante `t`? */
export const isBeatAt = (
  beats: number[],
  t: number,
  toleranceSeconds: number,
): boolean => {
  return beats.some((beat) => Math.abs(beat - t) <= toleranceSeconds);
};

/** Último beat ≤ t (segundos), ou null se nenhum ainda aconteceu. */
export const lastBeatAtOrBefore = (beats: number[], t: number): number | null => {
  let last: number | null = null;
  for (const beat of beats) {
    if (beat > t) break;
    last = beat;
  }
  return last;
};
