# @gmotion/presets

Animações estilo CapCut/AE como funções puras do frame. Motor físico: `spring()` do Remotion.

## Catálogo

| Categoria | Presets |
| --- | --- |
| Entrada | `fade-in`, `slide-in` (4 direções), `zoom-in-bounce`, `blur-in`, `pop-in`, `glitch-in` |
| Ênfase/loop | `pulse`, `shake`, `float`, `rotate-loop`, `glow-pulse` |
| Saída | `fade-out`, `slide-out`, `zoom-out`, `blur-out`, `shrink-out` |
| Texto | `<TypewriterText />` |

Todos aceitam opções (duração via `enterFrames`/`exitFrames`, easing, intensidade, direção). Ver JSDoc de cada factory em `src/enter.ts`, `src/emphasis.ts`, `src/exit.ts`.

## `<AnimatedLayer>`

Aplica entrada + saída + loop automaticamente com base na duração da Sequence pai:

```tsx
import {AnimatedLayer} from '@gmotion/presets';

<Sequence from={30} durationInFrames={90}>
  <AnimatedLayer
    enter="zoom-in-bounce"
    enterFrames={15}
    loop="float"
    exit="fade-out"
    exitFrames={10}
  >
    <h1>Título</h1>
  </AnimatedLayer>
</Sequence>
```

Estilos combinam: transforms concatenam, opacities multiplicam, filters juntam (`mergePresetStyles`).

## `<TypewriterText>`

```tsx
<TypewriterText text="Digitando..." charsPerSecond={25} cursor />
```

## Uso direto (sem wrapper)

Cada preset é factory que devolve `PresetFn`:

```tsx
import {slideIn} from '@gmotion/presets';

const fn = slideIn({direction: 'up', distance: 300, easing: 'out-back'});
const style = fn({frame, fps, durationInFrames: 15, progress: frame / 15});
```

## Registry (para o ai-director)

`allPresetNames` expõe `{enter, loop, exit}` com todos os nomes — catálogo dinâmico para a IA.

## Testes

```sh
pnpm --filter @gmotion/presets test
```
