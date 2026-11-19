# @gmotion/compositing

Compositing real estilo AE: adjustment layers, blend modes, masks, pre-compose.

- **`<AdjustmentLayer>`** — afeta tudo pintado ABAIXO dela (coloque depois das
  camadas): `filter` via backdrop-filter + `color`/`blend`/`colorOpacity` como
  solid composta por cima. Caso de uso nº 1: color grade (Fase 13 compõe com ela).
- **`<BlendLayer mode="screen">`** — mix-blend-mode tipado (`BlendMode`, sem
  string solta; `isBlendMode()` valida dados de JSON/IA).
- **`<MaskLayer mask={<circle cx={0.5} cy={0.5} r={r} />}>`** — recorta o filho
  via clip-path SVG; `units="fraction"` (0-1) ou `"px"`. Mask animado: calcule
  os atributos com `useCurrentFrame()` no pai — determinístico.
- **`<LayerGroup>`** — "pre-compose": transform/opacity/blend aplicados uma vez
  ao grupo; `isolation: isolate` impede blend interno de vazar pro fundo.

Tudo CSS puro — nenhum canvas/estado; anima-se passando valores calculados de
`useCurrentFrame()` nas props.

Demo: composição `CompositingShowcase` no studio (3 camadas + adjustment de
grade + partículas em screen + máscara circular revelando).

```sh
pnpm --filter @gmotion/compositing test
```
