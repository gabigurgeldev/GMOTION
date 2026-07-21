import {describe, it, expect} from 'vitest';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {capcutToTimeline} from './import';

const here = dirname(fileURLToPath(import.meta.url));
const miniDir = join(here, '..', '..', 'fixtures', 'mini-draft');

describe('capcutToTimeline (mini fixture)', () => {
  const tl = capcutToTimeline(miniDir);

  it('carries canvas + fps + duration in frames', () => {
    expect(tl.fps).toBe(30);
    expect(tl.width).toBe(1080);
    expect(tl.height).toBe(1920);
    expect(tl.durationInFrames).toBe(90); // 3_000_000µs @30
  });

  it('maps the image clip with center transform', () => {
    const videoTrack = tl.tracks.find((t) => t.type === 'video')!;
    const clip = videoTrack.clips[0]!;
    expect(clip.kind).toBe('image');
    expect(clip.start).toBe(0);
    expect(clip.duration).toBe(90);
    expect(clip.transform.posX).toBeCloseTo(540, 3);
    expect(clip.transform.posY).toBeCloseTo(960, 3);
    expect(clip.keyframes[0]?.property).toBe('scaleX');
  });

  it('maps the text clip: content, color, offset up', () => {
    const textTrack = tl.tracks.find((t) => t.type === 'text')!;
    const clip = textTrack.clips[0]!;
    if (clip.kind !== 'text') throw new Error('expected text clip');
    expect(clip.text).toBe('OI');
    expect(clip.color).toBe('#ffffff');
    expect(clip.start).toBe(15); // 500_000µs @30
    // transform.y = -0.5 → abaixo do centro (Y invertido): 960 + 0.5*960 = 1440
    expect(clip.transform.posY).toBeCloseTo(1440, 3);
  });
});
