# @gmotion/transitions

Transições de cena estilo CapCut/AE sobre `@remotion/transitions`. Cada uma é uma *presentation* — funciona direto no `<TransitionSeries>` com qualquer `timing`.

## Catálogo

| Nome | Efeito | Opções principais |
| --- | --- | --- |
| `zoomGlitch` | Zoom estoura + jitter/RGB no pico | `strength`, `jitter`, `seed` |
| `rgbSplitWipe` | Wipe direcional com separação RGB nas bordas | `direction`, `splitAmount` |
| `shakeCut` | Corte seco + tremor de câmera no impacto | `intensity`, `rotation`, `seed` |
| `whipPan` | Câmera chicoteando (4 direções) com motion blur | `direction`, `maxBlur` |
| `lightLeak` | Crossfade com vazamento de luz analógico | `color`, `secondaryColor`, `intensity` |
| `filmBurn` | Filme queimando: superexposição + labareda | `burnColor`, `seed` |

## Uso

```tsx
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {whipPan, zoomGlitch} from '@gmotion/transitions';

<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <CenaA />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={whipPan({direction: 'left'})}
    timing={linearTiming({durationInFrames: 10})}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <CenaB />
  </TransitionSeries.Sequence>

  <TransitionSeries.Transition
    presentation={zoomGlitch({strength: 0.6})}
    timing={linearTiming({durationInFrames: 12})}
  />

  <TransitionSeries.Sequence durationInFrames={60}>
    <CenaC />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Duração controla-se no `timing` (`linearTiming`/`springTiming`); direção via prop `direction` da presentation.

Determinismo: jitter/tremor usam `seededNoise` do `@gmotion/core` — nunca `Math.random()`.

`allTransitionNames` expõe o catálogo para o ai-director (Fase 8).

## Testes

```sh
pnpm --filter @gmotion/transitions test
```
