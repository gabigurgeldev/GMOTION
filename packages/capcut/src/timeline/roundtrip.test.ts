import {describe, it, expect} from 'vitest';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {capcutToTimeline} from './import';
import {exportTimeline} from './export';
import {loadDraft} from '../draft/reader';

const here = dirname(fileURLToPath(import.meta.url));
const miniDir = join(here, '..', '..', 'fixtures', 'mini-draft');

describe('roundtrip import → export → import', () => {
  const original = capcutToTimeline(miniDir);
  const out = mkdtempSync(join(tmpdir(), 'gmotion-capcut-'));
  exportTimeline(original, out);
  const reloaded = capcutToTimeline(out);

  it('preserves fps, canvas and duration', () => {
    expect(reloaded.fps).toBe(original.fps);
    expect(reloaded.width).toBe(original.width);
    expect(reloaded.height).toBe(original.height);
    expect(reloaded.durationInFrames).toBe(original.durationInFrames);
  });

  it('preserves track + clip counts', () => {
    expect(reloaded.tracks.length).toBe(original.tracks.length);
    const count = (t: typeof original) =>
      t.tracks.reduce((n, tr) => n + tr.clips.length, 0);
    expect(count(reloaded)).toBe(count(original));
  });

  it('preserves the text clip content and position (± tolerance)', () => {
    const txt = reloaded.tracks.flatMap((t) => t.clips).find((c) => c.kind === 'text');
    if (!txt || txt.kind !== 'text') throw new Error('text clip lost');
    expect(txt.text).toBe('OI');
    expect(txt.color).toBe('#ffffff');
    expect(txt.transform.posY).toBeCloseTo(1440, 0);
  });

  it('preserves the scaleX keyframe endpoints', () => {
    const img = reloaded.tracks.flatMap((t) => t.clips).find((c) => c.kind === 'image');
    const kf = img?.keyframes.find((k) => k.property === 'scaleX');
    expect(kf).toBeDefined();
    expect(kf!.points[0]!.value).toBeCloseTo(1, 5);
    expect(kf!.points[kf!.points.length - 1]!.value).toBeCloseTo(1.5, 5);
  });
});
