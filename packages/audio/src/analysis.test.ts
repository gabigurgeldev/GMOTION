import {describe, expect, it} from 'vitest';
import {
  amplitudeAtFrame,
  computeRmsEnvelope,
  detectOnsets,
  estimateBpm,
  isBeatAt,
  lastBeatAtOrBefore,
  pickBeats,
} from './analysis';

const SAMPLE_RATE = 44100;

/** Trilha sintética: cliques de 5ms a cada 60/bpm segundos, silêncio no resto. */
const makeClickTrack = (bpm: number, seconds: number): Float32Array => {
  const samples = new Float32Array(Math.floor(seconds * SAMPLE_RATE));
  const period = 60 / bpm;
  const clickLength = Math.floor(0.005 * SAMPLE_RATE);
  for (let t = 0; t < seconds; t += period) {
    const start = Math.floor(t * SAMPLE_RATE);
    for (let s = 0; s < clickLength && start + s < samples.length; s++) {
      samples[start + s] = 0.8;
    }
  }
  return samples;
};

describe('detectOnsets', () => {
  it('acha os cliques de um click-track de 120 BPM', () => {
    const track = makeClickTrack(120, 8); // beat a cada 0.5s → 16 cliques
    const onsets = detectOnsets(track, SAMPLE_RATE);
    expect(onsets.length).toBeGreaterThanOrEqual(14);
    expect(onsets.length).toBeLessThanOrEqual(17);
    for (const onset of onsets) {
      const nearest = Math.round(onset / 0.5) * 0.5;
      expect(Math.abs(onset - nearest)).toBeLessThanOrEqual(0.05);
    }
  });

  it('silêncio não tem onset nem NaN', () => {
    const silence = new Float32Array(SAMPLE_RATE * 2);
    const onsets = detectOnsets(silence, SAMPLE_RATE);
    expect(onsets).toEqual([]);
  });

  it('áudio mais curto que 3 janelas retorna vazio', () => {
    expect(detectOnsets(new Float32Array(100), SAMPLE_RATE)).toEqual([]);
  });
});

describe('estimateBpm', () => {
  it('estima 120 BPM do click-track', () => {
    const track = makeClickTrack(120, 8);
    const bpm = estimateBpm(detectOnsets(track, SAMPLE_RATE));
    expect(Math.abs(bpm - 120)).toBeLessThanOrEqual(3);
  });

  it('estima 90 BPM do click-track', () => {
    const track = makeClickTrack(90, 8);
    const bpm = estimateBpm(detectOnsets(track, SAMPLE_RATE));
    expect(Math.abs(bpm - 90)).toBeLessThanOrEqual(3);
  });

  it('poucos onsets → 0 (sem NaN)', () => {
    expect(estimateBpm([])).toBe(0);
    expect(estimateBpm([1, 2])).toBe(0);
  });
});

describe('pickBeats', () => {
  it('grade alinhada aos onsets do click-track', () => {
    const track = makeClickTrack(120, 8);
    const onsets = detectOnsets(track, SAMPLE_RATE);
    const bpm = estimateBpm(onsets);
    const beats = pickBeats(onsets, bpm, 8);
    expect(beats.length).toBeGreaterThanOrEqual(15);
    const first = beats[0] ?? 0;
    const offset = first % 0.5;
    expect(Math.min(offset, 0.5 - offset)).toBeLessThanOrEqual(0.06);
    // Grade estritamente crescente.
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i] ?? 0).toBeGreaterThan(beats[i - 1] ?? 0);
    }
  });

  it('bpm 0 → sem beats', () => {
    expect(pickBeats([], 0, 10)).toEqual([]);
  });
});

describe('computeRmsEnvelope', () => {
  it('1 valor por frame, normalizado 0-1', () => {
    const track = makeClickTrack(120, 2);
    const envelope = computeRmsEnvelope(track, SAMPLE_RATE, 30);
    expect(envelope.length).toBe(60);
    const peak = Math.max(...envelope);
    expect(peak).toBeCloseTo(1, 5);
    for (const v of envelope) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(Number.isNaN(v)).toBe(false);
    }
  });

  it('silêncio → tudo 0, sem NaN', () => {
    const envelope = computeRmsEnvelope(new Float32Array(SAMPLE_RATE), SAMPLE_RATE, 30);
    expect(envelope.length).toBe(30);
    expect(envelope.every((v) => v === 0)).toBe(true);
  });
});

describe('amplitudeAtFrame', () => {
  const envelope = [0.1, 0.5, 0.9];

  it('frame 0 e frame final', () => {
    expect(amplitudeAtFrame(envelope, 0)).toBe(0.1);
    expect(amplitudeAtFrame(envelope, 2)).toBe(0.9);
  });

  it('fora do range → 0', () => {
    expect(amplitudeAtFrame(envelope, -1)).toBe(0);
    expect(amplitudeAtFrame(envelope, 3)).toBe(0);
    expect(amplitudeAtFrame(envelope, 999)).toBe(0);
  });
});

describe('isBeatAt / lastBeatAtOrBefore', () => {
  const beats = [0.5, 1.0, 1.5];

  it('tolerância respeitada', () => {
    expect(isBeatAt(beats, 1.0, 0.05)).toBe(true);
    expect(isBeatAt(beats, 1.04, 0.05)).toBe(true);
    expect(isBeatAt(beats, 1.1, 0.05)).toBe(false);
  });

  it('último beat ≤ t', () => {
    expect(lastBeatAtOrBefore(beats, 0.4)).toBeNull();
    expect(lastBeatAtOrBefore(beats, 0.5)).toBe(0.5);
    expect(lastBeatAtOrBefore(beats, 1.2)).toBe(1.0);
    expect(lastBeatAtOrBefore(beats, 99)).toBe(1.5);
  });
});
