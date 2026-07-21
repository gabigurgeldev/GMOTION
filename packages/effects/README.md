# @gmotion/effects

Efeitos visuais estilo AE via CSS/SVG filters — barato de renderizar e 100% determinístico (todo ruído é `seededNoise`, nunca `Math.random()`). Shader WebGL fica como upgrade futuro para quando o filtro CSS não bastar.

## Efeitos

Dois padrões de uso:

**Wrappers** (envolvem a cena):

| Componente | Efeito | Props principais |
| --- | --- | --- |
| `<ChromaticAberration>` | Canais R/B deslocados (estático) | `intensity`, `angle` |
| `<RgbShift>` | Aberração animada com flicker glitch | `intensity`, `stepsPerSecond`, `seed` |
| `<Glow>` | Bloom via drop-shadow empilhado | `intensity`, `color`, `layers` |
| `<ScreenShake>` | Tremor de câmera com overscan automático | `intensity`, `decayFrames` (0 = constante), `seed` |

**Overlays** (colocam-se por cima da cena):

| Componente | Efeito | Props principais |
| --- | --- | --- |
| `<FilmGrain>` | Grão de filme (feTurbulence, muda `grainFps`×/s) | `intensity`, `frequency`, `grainFps` |
| `<Vignette>` | Vinheta radial | `intensity`, `size`, `color` |
| `<LightLeaks>` | Vazamentos de luz derivando (screen blend) | `intensity`, `count`, `driftSpeed` |

## Exemplo combinado

```tsx
<AbsoluteFill>
  <ScreenShake intensity={8}>
    <RgbShift intensity={5}>
      <MinhaCena />
    </RgbShift>
  </ScreenShake>
  <LightLeaks intensity={0.7} />
  <FilmGrain intensity={0.14} />
  <Vignette intensity={0.65} />
</AbsoluteFill>
```

`allEffectNames` expõe o catálogo para o ai-director (Fase 8).

## Testes

```sh
pnpm --filter @gmotion/effects test
```
