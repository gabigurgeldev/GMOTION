import {describe, expect, it} from 'vitest';
import {viralReelDuration} from './ViralReel';
import {AD_15S_DURATION} from './Ad15s';
import {CHANNEL_INTRO_DURATION} from './ChannelIntro';
import {allTemplateNames} from './index';

describe('viralReelDuration', () => {
  it('1 cena: só sceneFrames', () => {
    expect(viralReelDuration({sceneCount: 1})).toBe(45);
  });

  it('N cenas: desconta overlap das transições', () => {
    // 4 cenas de 45f com 3 transições de 10f: 180 - 30 = 150
    expect(viralReelDuration({sceneCount: 4})).toBe(150);
  });

  it('parâmetros customizados', () => {
    expect(
      viralReelDuration({sceneCount: 3, sceneFrames: 60, transitionFrames: 15}),
    ).toBe(150);
  });

  it('0 cenas: 0', () => {
    expect(viralReelDuration({sceneCount: 0})).toBe(0);
  });
});

describe('durações fixas', () => {
  it('Ad15s: exatamente 15s a 30fps', () => {
    expect(AD_15S_DURATION).toBe(450);
  });

  it('ChannelIntro: 8s a 30fps', () => {
    expect(CHANNEL_INTRO_DURATION).toBe(240);
  });
});

describe('catálogo', () => {
  it('3 templates expostos', () => {
    expect(allTemplateNames).toEqual(['viral-reel', 'ad-15s', 'channel-intro']);
  });
});
