# @gmotion/capcut

Ponte bidirecional entre o formato interno do **CapCut/JianYing** (`draft_content.json`)
e a timeline **track-based** do Gmotion (Remotion). Importa um edit do CapCut para
renderizar no Gmotion — injetando 3D, shaders e partículas que o CapCut não faz — e
exporta de volta para um draft CapCut, assando os elementos "impossíveis" como overlay
de vídeo com alpha.

## Fluxo

```
CapCut draft ──import──▶ CapcutTimeline (frames/px) ──render──▶ Remotion (+ 3D/shader/partícula)
CapCut draft ◀──export── CapcutTimeline  ◀──bake── layers nativas assadas em .mov alpha
```

## Uso

### Importar um draft e visualizar no Studio
```sh
pnpm --filter @gmotion/capcut run import-draft "<pasta do draft>" \
  --out apps/studio/src/generated/capcut-timeline.json \
  --assets apps/studio/public
pnpm dev            # abra a composição "CapcutImported"
```

### Injetar elementos que o CapCut não faz (código)
```ts
import {capcutToTimeline, attachNativeLayers} from '@gmotion/capcut';

let tl = capcutToTimeline('<pasta do draft>');
tl = attachNativeLayers(tl, [
  {native: 'three', component: 'extruded-text', props: {text: 'GMOTION'}, start: 0, duration: 60},
  {native: 'particle', component: 'particles', props: {count: 600}, start: 30, duration: 90},
]);
```

### Exportar de volta para o CapCut (com bake dos nativos)
```ts
import {bakeNativeClips} from '@gmotion/capcut/src/bake/impossible';
import {exportTimeline} from '@gmotion/capcut';

const baked = await bakeNativeClips(tl, {outDir: 'out/baked'}); // .mov ProRes 4444 alpha
exportTimeline(baked, 'out/meu-draft-capcut');                  // draft_content.json + Resources/
```
Ou via CLI para uma timeline sem nativos:
```sh
pnpm --filter @gmotion/capcut run export-draft timeline.json --out out/draft
```

## Convenções

- **Tempo:** CapCut usa microssegundos; a timeline do Gmotion usa frames.
- **Posição:** `clip.transform` é normalizado (centro 0, Y para cima); a timeline usa px (centro do elemento).
- **Cor:** CapCut usa `[r,g,b]` 0..1; a timeline usa CSS.
- **Calibração:** o fator `CAPCUT_FONT_SIZE_TO_PX` e a escala de mídia são ajustados
  comparando o render com os `draft_cover.jpg` do draft (ver plano, Fase 4).

## Gerar um vídeo (Claude Code / sem API)

```sh
pnpm --filter @gmotion/capcut run demo --seconds 6   # importa o PACK, recorta, injeta 3D + partículas
cd apps/studio && npx remotion render CapcutImported out/gmotion-capcut-demo.mp4 --gl=angle
```
`--gl=angle` habilita WebGL headless para as camadas 3D/partícula. Sem elas: `run demo --no-native`.

## Estado das funcionalidades

- **Compound clips**: achatados recursivamente via `materials.drafts[].draft` (por nome). No PACK real, todas as mídias resolvem o `src`.
- **Máscara / chroma / efeitos / animações**: importados de `extra_material_refs` e renderizados best-effort (clip-path, filtro CSS, envelope in/out). Chroma key é aproximado.
- **Import do `@gmotion/capcut/render`** no browser (studio); os módulos Node ficam no entry `.`.
- O draft exportado é estruturalmente válido; validar abrindo no CapCut desktop.
