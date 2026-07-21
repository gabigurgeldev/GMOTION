import {describe, expect, it} from 'vitest';
import {parseTimeline, timelineDuration, timelineSchema} from './schema';
import {buildCatalog, catalogAsText} from './catalog';
import {buildSystemPrompt, generateUserMessage, refineUserMessage} from './prompts';

const validTimeline = {
  fps: 30,
  width: 1080,
  height: 1920,
  scenes: [
    {
      durationInFrames: 60,
      background: {gradient: ['#1a1a2e', '#0f0f1a']},
      layers: [
        {
          type: 'text',
          text: 'Você sabia?',
          enter: 'zoom-in-bounce',
          exit: 'fade-out',
        },
      ],
    },
    {
      durationInFrames: 90,
      layers: [
        {type: 'counter', to: 15000, prefix: 'R$ ', enter: 'pop-in'},
        {type: 'progress-bar', target: 0.9, position: {x: 50, y: 70}},
      ],
    },
  ],
  transitions: [{after: 0, transitionType: 'whip-pan', durationInFrames: 10}],
  effects: [{effectType: 'film-grain', intensity: 0.12}],
};

describe('timelineSchema', () => {
  it('aceita timeline válida', () => {
    const t = parseTimeline(validTimeline);
    expect(t.scenes).toHaveLength(2);
    expect(t.transitions?.[0]?.transitionType).toBe('whip-pan');
  });

  it('rejeita preset inexistente', () => {
    const bad = structuredClone(validTimeline) as Record<string, unknown>;
    (bad.scenes as {layers: {enter: string}[]}[])[0]!.layers[0]!.enter = 'mega-zoom';
    expect(() => parseTimeline(bad)).toThrow(/Timeline inválida/);
  });

  it('rejeita transição desconhecida', () => {
    const bad = structuredClone(validTimeline) as Record<string, unknown>;
    (bad.transitions as {transitionType: string}[])[0]!.transitionType = 'explode';
    expect(() => parseTimeline(bad)).toThrow();
  });

  it('rejeita timeline sem cenas', () => {
    expect(() =>
      parseTimeline({fps: 30, width: 1080, height: 1920, scenes: []}),
    ).toThrow();
  });

  it('camadas discriminadas por type', () => {
    const result = timelineSchema.safeParse({
      ...validTimeline,
      scenes: [{durationInFrames: 30, layers: [{type: 'badge', text: 'GO'}]}],
      transitions: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe('timelineDuration', () => {
  it('soma cenas menos overlap de transições', () => {
    // 60 + 90 - 10 = 140
    expect(timelineDuration(parseTimeline(validTimeline))).toBe(140);
  });

  it('sem transições: soma simples', () => {
    const t = parseTimeline({...validTimeline, transitions: undefined});
    expect(timelineDuration(t)).toBe(150);
  });
});

describe('catalog', () => {
  it('agrega catálogos de todos os pacotes', () => {
    const c = buildCatalog();
    expect(c.presets.enter).toContain('zoom-in-bounce');
    expect(c.transitions).toContain('whip-pan');
    expect(c.effects).toContain('film-grain');
    expect(c.graphics).toContain('lower-third');
    expect(c.templates).toContain('viral-reel');
  });

  it('catalogAsText lista os nomes para o prompt', () => {
    const text = catalogAsText();
    expect(text).toContain('zoom-in-bounce');
    expect(text).toContain('whip-pan');
  });
});

describe('prompts', () => {
  it('system prompt embute o catálogo dinâmico', () => {
    const p = buildSystemPrompt();
    expect(p).toContain('zoom-in-bounce');
    expect(p).toContain('1080x1920');
  });

  it('refine envia a timeline atual + instrução', () => {
    const t = parseTimeline(validTimeline);
    const msg = refineUserMessage(t, 'deixa o zoom mais forte');
    expect(msg).toContain('"whip-pan"');
    expect(msg).toContain('deixa o zoom mais forte');
  });

  it('generate embute a descrição', () => {
    expect(generateUserMessage('reel de café')).toContain('reel de café');
  });
});
