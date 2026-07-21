# Gmotion

Camada de extensão sobre o [Remotion](https://www.remotion.dev) para motion graphics programático nível After Effects / CapCut, com IA para gerar cenas sob demanda.

## Estrutura

```
gmotion/
├── apps/
│   └── studio/          # projeto Remotion principal (composições finais)
├── packages/
│   ├── core/            # helpers genéricos (useEnterExit, math determinístico)
│   ├── presets/         # animações estilo CapCut + <AnimatedLayer>
│   ├── transitions/     # zoom-glitch, whip-pan, shake-cut, light-leak...
│   ├── three-scenes/    # texto 3D, partículas, glb importer, câmera orbital
│   ├── effects/         # grain, glow, chromatic aberration, screen shake
│   ├── graphics/        # lower-thirds, callouts, contadores, Lottie
│   ├── templates/       # Reel Viral, Anúncio 15s, Intro de canal
│   └── ai-director/     # descrição em texto -> timeline JSON -> Remotion
```

## Rodar

```sh
pnpm install
pnpm dev          # abre o Remotion Studio (apps/studio)
pnpm test         # testes das funções puras (100+ testes)
```

## Gerar vídeo com IA

```sh
export ANTHROPIC_API_KEY=sk-ant-...
pnpm --filter @gmotion/ai-director generate "reel viral sobre café, 3 cenas, preço no final"
pnpm --filter @gmotion/ai-director generate --refine "troca a transição da cena 2 por film-burn"
# depois: pnpm dev -> composition "AiDirected"
```

Render de exemplo:

```sh
cd apps/studio
pnpm render HelloGmotion out/hello.mp4
```

## Regra de ouro

Toda animação é função pura de `useCurrentFrame()`, `fps` e `durationInFrames`. Nunca `requestAnimationFrame`, `setTimeout`, `Math.random()` sem seed, ou estado em tempo real — quebra o render determinístico.
