# @gmotion/ai-director

Você descreve o vídeo em texto; a IA monta a timeline JSON usando o catálogo dos outros pacotes; o compilador vira componentes Remotion. Nada de keyframe manual.

## Fluxo

```
descrição em texto
   └─> Claude (claude-opus-4-8, structured outputs)
         └─> TimelineSchema (JSON validado por zod)
               └─> jsonToComposition() -> JSX Remotion
                     └─> remotion render
```

## Gerar um vídeo

```sh
export ANTHROPIC_API_KEY=sk-ant-...   # ou `ant auth login`

pnpm --filter @gmotion/ai-director generate "reel viral sobre café: hook forte, 3 cenas rápidas, preço R$ 19,90 no final com CTA"
```

Escreve `apps/studio/src/generated/ai-timeline.json`. Abra o Studio (`pnpm dev`) e selecione **AiDirected** (reinicie o Studio se já estava aberto). Render:

```sh
cd apps/studio && pnpm exec remotion render AiDirected out/ai.mp4
```

## Refinar (loop de ajuste)

A IA edita só o trecho relevante do JSON, mantendo o resto idêntico:

```sh
pnpm --filter @gmotion/ai-director generate --refine "deixa o zoom da cena 1 mais forte e troca a transição da cena 2 por film-burn"
```

Opções: `--out <path>`, `--model <id>` (default `claude-opus-4-8`).

## Schema da timeline

- `scenes[]`: `durationInFrames`, `background` (cor ou gradiente), `layers[]`.
- Layers: `text`, `image`, `shape`, `counter`, `progress-bar`, `badge`, `lower-third`, `typewriter` — todas com `enter`/`exit`/`loop` (nomes validados contra o registry real), `position` em %, `startFrame`.
- `transitions[]`: `{after: índice da cena, transitionType, durationInFrames, direction}`.
- `effects[]`: overlays (`film-grain`, `vignette`, `light-leaks`) e wrappers (`screen-shake`, `rgb-shift`, `chromatic-aberration`).

O catálogo no prompt de sistema é gerado dinamicamente de `allPresetNames`/`allTransitionNames`/etc — preset novo entra no vocabulário da IA sozinho.

## Uso programático

```ts
import {parseTimeline, jsonToComposition, timelineDuration} from '@gmotion/ai-director';

const timeline = parseTimeline(json);      // valida (zod)
const jsx = jsonToComposition(timeline);   // JSX Remotion
const frames = timelineDuration(timeline); // para durationInFrames da Composition
```

## Testes

```sh
pnpm --filter @gmotion/ai-director test
```
