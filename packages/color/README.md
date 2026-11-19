# @gmotion/color

Color correction determinística: curvas, HSL e LUT `.cube`.

## Três caminhos, do mais barato ao mais fiel

1. **`cssColorFilter({hue, saturation, lightness, contrast})`** — string pra
   `filter:` CSS. Barato, sem LUT/curvas.
2. **`<ColorGrade curves hsl lut>`** — filtro SVG sobre qualquer conteúdo DOM:
   curvas por pontos de controle (`feComponentTransfer`, master RGB + por canal)
   e HSL (`feColorMatrix`). `lut` aqui é **aproximação 1D por canal**
   (`lutToTransferTables`) — perde termos cruzados.
3. **`<LutVideo src lutSrc>`** — LUT 3D **fiel** em vídeo via shader GLSL
   (three + `@remotion/three`): DataTexture 2D empacotada (fatias de B) +
   trilinear no fragment. Preview usa `useVideoTexture`, render usa
   `useOffthreadVideoTexture`.

## Puro/testável

`parseCubeLut`, `sampleLutTrilinear` (mesmo algoritmo do shader),
`lutToTransferTables`, `evalCurve`/`curveTable`/`channelTable`, `cssColorFilter`.

## Uso

```tsx
import {staticFile} from 'remotion';
import {ColorGrade, LutVideo, useCubeLut} from '@gmotion/color';

<LutVideo src={staticFile('clip.mp4')} lutSrc={staticFile('luts/warm.cube')} intensity={0.8} />

<ColorGrade curves={{rgb: [[0, 0.06], [1, 0.98]]}} hsl={{saturation: 1.4, hue: -12}}>
  <OffthreadVideo src={...} />
</ColorGrade>
```

LUTs de demo: `node scripts/make-demo-luts.mjs` gera warm/cool/noir em
`apps/studio/public/luts/` (com termos cruzados de propósito).

## Pegadinhas descobertas (não repetir)

- DataTexture float + `LinearFilter` sem `OES_texture_float_linear` = sampler
  devolve **preto** silenciosamente → LUT empacotada em 8 bits.
- Em render, `frameloop="never"`: textura de vídeo chega depois do `advance`
  do frame — o `<LutPlane>` chama `advance()` num effect próprio, senão o
  canvas congela vazio.

```sh
pnpm --filter @gmotion/color test
```
