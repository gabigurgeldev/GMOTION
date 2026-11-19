import {describe, it, expect, vi, beforeEach} from 'vitest';

// Mock do provider: runStructured decide a saída pelo formato do jsonSchema pedido.
vi.mock('./providers', () => {
  const plan = {
    keyMessage: 'Teste',
    palette: ['#000000', '#ffffff'],
    targetSeconds: 12,
    cta: null,
    scenes: [{intent: 'hook', copy: 'Olá'}],
  };
  const timeline = {
    fps: 30,
    width: 1080,
    height: 1920,
    scenes: [{durationInFrames: 60, layers: [{type: 'text', text: 'Olá'}]}],
  };
  const narration = {narration: 'Olá mundo.', sfx: ['whoosh']};
  const route = {agent: 'cor', reason: 'muda cor'};
  const cuts = {
    cuts: [
      {sourceStartSec: 2, durationSec: 3, label: 'abertura'},
      {sourceStartSec: 10, durationSec: 4, label: 'demo'},
    ],
  };
  const overlays = {
    overlays: [
      {text: 'OLHA ISSO', startSec: 0, durationSec: 2, fontSizePx: 100, color: '#fff', yPercent: 25},
    ],
  };
  const grade = {effect: 'vivid', intensity: 0.6};

  return {
    providerFromEnv: () => 'anthropic',
    runStructured: vi.fn(async (opts: {jsonSchema: Record<string, unknown>}) => {
      const props = (opts.jsonSchema.properties ?? {}) as Record<string, unknown>;
      let output: unknown;
      if ('keyMessage' in props) output = plan;
      else if ('cuts' in props) output = cuts;
      else if ('overlays' in props) output = overlays;
      else if ('effect' in props) output = grade;
      else if ('scenes' in props) output = timeline;
      else if ('narration' in props) output = narration;
      else if ('agent' in props) output = route;
      else throw new Error('schema inesperado no mock');
      return {output, costUsd: 0.01, usage: {}};
    }),
  };
});

import {orchestrate, orchestrateEv, refine} from './orchestrator';
import {parseTimeline} from './schema';
import {parseCapcutTimeline} from '@gmotion/capcut/render';
import type {AgentEvent, Brief, CallConfig, Plan} from './agents/types';

const cfg: CallConfig = {provider: 'anthropic', model: 'claude-opus-4-8'};
const brief: Brief = {
  projectName: 'P',
  type: 'GM',
  answers: {tema: 'café'},
  projectDir: '/tmp/gmotion-test',
};

describe('orchestrate', () => {
  let events: AgentEvent[];
  const emit = (e: AgentEvent) => events.push(e);
  beforeEach(() => {
    events = [];
  });

  it('roda os 6 agentes em ordem e acumula custo', async () => {
    const result = await orchestrate(brief, cfg, emit);

    // Timeline final é válida.
    expect(() => parseTimeline(result.timeline)).not.toThrow();

    // Custo = roteiro+estrutura+texto+cor+audio = 5 * 0.01.
    expect(result.totalCostUsd).toBeCloseTo(0.05, 5);

    // Ordem dos agentes (start inicial de cada passo, sem contar eventos de subfase).
    const agentsInOrder = events
      .filter((e) => e.type === 'agent' && e.status === 'start' && !e.phase)
      .map((e) => e.agent);
    expect(agentsInOrder).toEqual(['roteiro', 'estrutura', 'texto', 'cor', 'audio']);

    // Evento de plano emitido.
    expect(events.some((e) => e.type === 'plan')).toBe(true);

    // Orquestrador valida no fim.
    expect(events.at(-1)?.agent).toBe('orquestrador');

    // Custo acumulado é monotônico.
    const cums = events
      .filter((e) => typeof e.cumCostUsd === 'number' && e.status === 'ok')
      .map((e) => e.cumCostUsd as number);
    for (let i = 1; i < cums.length; i++) {
      expect(cums[i] as number).toBeGreaterThanOrEqual(cums[i - 1] as number);
    }
  });
});

describe('orchestrateEv', () => {
  it('gera timeline CapCut com cortes reais, overlays e filtro', async () => {
    const events: AgentEvent[] = [];
    const video = {path: 'E:\\videos\\fonte.mp4', durationSeconds: 30, width: 1920, height: 1080};
    const result = await orchestrateEv(
      {...brief, type: 'EV', sourceVideoPath: video.path},
      video,
      cfg,
      (e) => events.push(e),
    );

    const tl = parseCapcutTimeline(result.timeline);
    // 2 cortes de 3s+4s a 30fps = 210 frames.
    expect(tl.durationInFrames).toBe(210);

    const videoTrack = tl.tracks.find((t) => t.type === 'video');
    expect(videoTrack?.clips).toHaveLength(2);
    // Corte 2 começa onde o 1 termina e recorta o fonte a partir de 10s.
    expect(videoTrack?.clips[1]?.start).toBe(90);
    expect(videoTrack?.clips[1]?.sourceStart).toBe(300);
    // Escala cover: fonte 1920x1080 num quadro 1080x1920 → scale 1920/1080.
    expect(videoTrack?.clips[0]?.transform.scaleX).toBeCloseTo(1920 / 1080, 5);
    // Filtro do colorista aplicado na track de vídeo.
    expect(videoTrack?.clips[0]?.effects.some((ef) => ef.name === 'vivid')).toBe(true);

    const textTrack = tl.tracks.find((t) => t.type === 'text');
    expect(textTrack?.clips).toHaveLength(1);

    // Ordem dos agentes igual ao GM (start inicial, sem eventos de subfase).
    const order = events
      .filter((e) => e.type === 'agent' && e.status === 'start' && !e.phase)
      .map((e) => e.agent);
    expect(order).toEqual(['roteiro', 'estrutura', 'texto', 'cor', 'audio']);
    expect(result.totalCostUsd).toBeCloseTo(0.05, 5);
  });
});

describe('refine', () => {
  it('roteia e re-roda o agente escolhido', async () => {
    const events: AgentEvent[] = [];
    const plan: Plan = {
      keyMessage: 'x',
      palette: ['#000000', '#ffffff'],
      targetSeconds: 10,
      cta: null,
      scenes: [{intent: 'a', copy: 'b'}],
    };
    const current = parseTimeline({
      fps: 30,
      width: 1080,
      height: 1920,
      scenes: [{durationInFrames: 60, layers: [{type: 'text', text: 'Olá'}]}],
    });
    const result = await refine(
      current,
      plan,
      brief,
      cfg,
      'deixa o fundo azul',
      (e) => events.push(e),
    );
    expect(() => parseTimeline(result.timeline)).not.toThrow();
    // orquestrador roteia + agente 'cor' executa (mock retorna agent:'cor').
    const ran = events
      .filter((e) => e.type === 'agent' && e.status === 'start' && !e.phase)
      .map((e) => e.agent);
    expect(ran).toEqual(['orquestrador', 'cor']);
  });
});
