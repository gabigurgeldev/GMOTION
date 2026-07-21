# @gmotion/graphics

Elementos gráficos de motion design. Todos determinísticos (função do frame).

## Componentes

### `<LowerThird>`
Nome + cargo com barra de destaque; entra/sai sozinho pela duração da Sequence.

```tsx
<Sequence from={30} durationInFrames={120}>
  <LowerThird name="Gabriel" role="Motion Designer" accentColor="#ec4899" />
</Sequence>
```

### `<Callout>`
Linha curva desenhando até o alvo + ponta de seta + rótulo pop-in. Coordenadas absolutas.

```tsx
<Callout label="Olha isso!" origin={{x: 250, y: 480}} target={{x: 540, y: 900}} />
```

### `<AnimatedCounter>`
Número subindo de `from` a `to` com easing. Formatação pt-BR por default.

```tsx
<AnimatedCounter to={15000} prefix="R$ " durationInFrames={50} style={{fontSize: 120, color: 'white'}} />
<AnimatedCounter to={99.9} decimals={1} suffix="%" />
```

### `<ProgressBar>`
Barra enchendo até `target` (0-1). `gradient={['#6366f1', '#ec4899']}` opcional.

### `<Badge>`
Chip com borda conic-gradient girando. `borderColors`, `borderSpeed`.

### `<LottieLayer>`
Lottie sincronizado com o playhead via `@remotion/lottie` (tempo derivado de `useCurrentFrame`).

```tsx
<LottieLayer src={staticFile('confetti.json')} loop={false} />
// ou com dados já carregados:
<LottieLayer animationData={confettiJson} />
```

`src` usa `delayRender`/`continueRender` durante o fetch — o render espera o JSON.

## Funções puras

`counterValue`, `formatCounter`, `strokeDrawOffset`, `barProgress` — exportadas para uso direto e testes.

## Testes

```sh
pnpm --filter @gmotion/graphics test
```
