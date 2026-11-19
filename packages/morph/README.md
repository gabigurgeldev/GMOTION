# @gmotion/morph

Shape/SVG morphing determinístico.

- `morphPath(pathA, pathB, progress)` — interpolação de path pura (em cima do
  `interpolatePath` do `@remotion/paths`), progress clampado, extremos exatos.
- `morphSequence(paths[], progress, easing?)` — morph através de N shapes,
  progresso fatiado em N-1 segmentos com easing por segmento.
- `<MorphShape paths={[A, B, C]} durationInFrames easing fill stroke>` —
  componente puro via `useCurrentFrame()`.

```tsx
<MorphShape
  paths={[STAR, CIRCLE, BOLT]}
  durationInFrames={90}
  viewBox="0 0 100 100"
  fill="#ffcc33"
/>
```

Limite herdado do interpolatePath: melhor resultado entre paths de UM subpath
cada; buracos (subpaths múltiplos) não são pareados de forma esperta.

```sh
pnpm --filter @gmotion/morph test
```
