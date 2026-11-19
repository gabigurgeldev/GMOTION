# @gmotion/editorial-style

Estilo editorial/cinético observado em `EXEMPLO DE EDIT/` — cutout + duotone +
color-block + tipografia mista + UI mockup. Complementa (não substitui) o
estilo 3D/glow das Fases 1-8.

## Componentes

- **`<DuotoneImage colorDark colorLight dotSize angle>`** — duotone REAL
  (luminância → mapa entre dois tons via filtro SVG, não grayscale) + trama
  halftone de pontos rotacionada em multiply (efeito jornal). Fallback barato:
  `halftone={false}`.
- **`<CutoutSubject src>`** — consome vídeo `.webm` com alpha ou PNG recortado
  JÁ processados offline. Pipeline: `scripts/cutout.mjs` (imgly/rembg, rodado
  UMA vez) — segmentação ao vivo não entra no render determinístico. Para
  vídeo: frames → cutout por frame → remonta VP9 com alpha (comandos no script).
- **`<SolidColorBackdrop color>`** — color-block full-frame; troca de cor é
  **corte seco** entre `<Sequence>`s (sem cross-fade — regra do estilo).
- **`<FlatShadow offsetX offsetY color>`** — sombra sólida deslocada, blur 0
  (`drop-shadow` duro): visual sticker, não o glow suave do effects.
- **`<UIMockupOverlay>` + `<MockButton>` + `<FxBadge>` + `<MockCursor>`** —
  UI fake de app de edição (screen recording simulado); cursor animado por
  frame via `cursorAt` puro (from/to/easing).
- **`<DashedPath>`** — linha tracejada que DESLIZA (`slideDashOffset`),
  diferente do `<AnimatedStroke>` do graphics (que desenha traço contínuo).
- **`<GlowBeam>`** — barra neon geométrica (gradiente nas pontas + glow),
  distinta do light-leak orgânico do effects.

Tudo determinístico: valores por frame calculados de `useCurrentFrame()` no
chamador ou nos próprios componentes via funções puras de `calc.ts`.

## Demo

`EditorialShowcase` no studio recria o trecho da referência: "**Cortar** *seus*
**Vídeos**" em tipografia mista sobre branco → corte seco pra vermelho com
sujeito cutout em duotone + estrela com FlatShadow → preto com UI mockup
(cursor indo até o botão FX), DashedPath e GlowBeam.

```sh
pnpm --filter @gmotion/editorial-style test
```
