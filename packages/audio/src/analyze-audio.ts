import {existsSync, statSync, readFileSync, writeFileSync} from 'node:fs';
import {
  computeRmsEnvelope,
  detectOnsets,
  estimateBpm,
  pickBeats,
} from './analysis.ts';
import {decodeToMonoPcm} from './decode.ts';
import type {AudioAnalysis} from './types.ts';

export type AnalyzeOptions = {
  /** FPS do envelope pré-calculado. Default: 30. */
  fps?: number;
  /** Sample rate da decodificação. Default: 44100. */
  sampleRate?: number;
};

/** Caminho canônico do cache JSON ao lado do asset. */
export const analysisPathFor = (filePath: string): string => `${filePath}.analysis.json`;

/** Analisa o arquivo do zero (sempre decodifica). */
export const analyzeAudio = async (
  filePath: string,
  {fps = 30, sampleRate = 44100}: AnalyzeOptions = {},
): Promise<AudioAnalysis> => {
  const {samples} = await decodeToMonoPcm(filePath, sampleRate);
  const durationInSeconds = samples.length / sampleRate;
  const onsets = detectOnsets(samples, sampleRate);
  const bpm = estimateBpm(onsets);
  return {
    version: 1,
    sourceFile: filePath,
    sampleRate,
    durationInSeconds,
    fps,
    bpm,
    beats: pickBeats(onsets, bpm, durationInSeconds),
    onsets,
    amplitudeEnvelope: computeRmsEnvelope(samples, sampleRate, fps),
  };
};

export type AnalyzeAndCacheResult = {
  analysis: AudioAnalysis;
  /** true quando veio do cache (JSON mais novo que o áudio). */
  cached: boolean;
  outputPath: string;
};

/** Analisa com cache: pula se o JSON existir e for mais novo que o áudio. */
export const analyzeAndCache = async (
  filePath: string,
  {force = false, ...options}: AnalyzeOptions & {force?: boolean} = {},
): Promise<AnalyzeAndCacheResult> => {
  const outputPath = analysisPathFor(filePath);

  if (!force && existsSync(outputPath)) {
    const sourceMtime = statSync(filePath).mtimeMs;
    const cacheMtime = statSync(outputPath).mtimeMs;
    if (cacheMtime >= sourceMtime) {
      const analysis = JSON.parse(readFileSync(outputPath, 'utf8')) as AudioAnalysis;
      return {analysis, cached: true, outputPath};
    }
  }

  const analysis = await analyzeAudio(filePath, options);
  writeFileSync(outputPath, JSON.stringify(analysis));
  return {analysis, cached: false, outputPath};
};
