import {describe, it, expect} from 'vitest';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {capcutToTimeline} from './import';

const here = dirname(fileURLToPath(import.meta.url));
const compoundDir = join(here, '..', '..', 'fixtures', 'compound-draft');

describe('flatten de compound clips', () => {
  const tl = capcutToTimeline(compoundDir);
  const clips = tl.tracks.flatMap((t) => t.clips);

  it('expande o compound na folha real (imagem com src)', () => {
    expect(clips).toHaveLength(1);
    const leaf = clips[0]!;
    expect(leaf.kind).toBe('image');
    if (leaf.kind !== 'image') throw new Error('esperava imagem');
    expect(leaf.src.replace(/\\/g, '/').endsWith('Resources/leaf.png')).toBe(true);
    expect(leaf.start).toBe(0);
    expect(leaf.duration).toBe(60); // 2_000_000µs @30
  });

  it('resolve máscara e efeito do segmento-folha', () => {
    const leaf = clips[0]!;
    expect(leaf.mask?.kind).toBe('circle');
    expect(leaf.effects.some((e) => e.name === 'Blur' && e.kind === 'video_effect')).toBe(true);
  });
});
