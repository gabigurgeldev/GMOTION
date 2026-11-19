# SUPER PROMPT — Gmotion Fase 2: Nível Profissional (CapCut/AE real)

> Continuação do `gmotion-super-prompt.md` (Fases 1-8 já concluídas: monorepo, presets, transições, 3D, efeitos, gráficos, templates, ai-director existem). Cole este prompt inteiro na IA que vai codar. Execute fase por fase, uma de cada vez — pare ao final de cada uma e peça confirmação antes de avançar.

---

## CONTEXTO

O Gmotion já tem a fundação (Fases 1-8 do prompt original). Mas comparado a edições reais de CapCut/After Effects (ver pasta `EXEMPLO DE EDIT/`), falta um conjunto de capacidades que fazem a diferença entre "anima bonito" e "edição de nível profissional real". Esta fase 2 fecha esse gap.

Não quebre nada que já existe. Todo pacote novo é aditivo (`workspace:*` nas dependências, sem reescrever pacotes prontos a menos que a fase exija).

### Restrição inegociável (não muda)
Toda animação continua função pura de `useCurrentFrame()`, `fps`, `durationInFrames`. Nada de `requestAnimationFrame`, `setTimeout`, `Math.random()` sem seed, estado em tempo real.

---

## GAPS A FECHAR (visão geral)

1. Audio sync (beat detection, timeline reagindo a áudio)
2. Asset library (catalogar `EFEITOS ASSETS`, busca, integração no studio)
3. Text engine avançado (per-character keyframes, path text, stroke animado)
4. Adjustment layers / blend modes / masks (compositing real)
5. Color correction (curves, HSL, LUT)
6. SVG/shape morphing
7. Motion tracking (colar UI em objeto que se move no vídeo de fundo)
8. Batch export (múltiplas resoluções/formatos em paralelo)
9. Real-time preview performático (LOD para cenas 3D pesadas)
10. Estilo editorial cinético (duotone/halftone, cutout compositing, tipografia mista, flat shadow, UI mockup overlay) — ver Fase 18, evidência direta de `EXEMPLO DE EDIT/`

### Evidência de referência (`EXEMPLO DE EDIT/`)

Análise frame-a-frame de um edit real na pasta (300 frames, vídeo tutorial "Cortar seus Vídeos" / "4 tipos de cortes") revelou um estilo bem específico, mais editorial/cinético do que "zoom bounce genérico de Reels". Técnicas confirmadas visualmente:

- **Duotone/halftone**: fotos em preto-e-branco com textura de trama pontilhada (efeito jornal impresso), não é filtro grayscale simples.
- **Cutout/rotoscope compositing**: pessoa recortada do fundo original, "flutuando" sozinha sobre cor sólida de fundo (branco / vermelho puro / preto).
- **Color-block hard cut**: fundo muda de cor solid em corte seco (branco → vermelho → preto), sem fade gradual entre eles.
- **Tipografia cinética mista**: dentro da mesma frase, mistura peso/família de fonte diferente por palavra (ex. "**Cortar**" bold sans grande + "*seus*" serif itálica fina pequena), texto entra em blocos por linha, não a frase toda de uma vez.
- **Flat hard-shadow**: formas (ex. estrela) com sombra sólida deslocada (offset duro), não blur suave — visual "sticker"/flat design, não drop-shadow realista de AE.
- **UI mockup overlay**: elementos falsos de interface de app de edição (botão "FX" com cursor apontando) compostos por cima, simulando screen recording — comum em conteúdo de tutorial.
- **Dashed animated path**: linha tracejada curva, animada (stroke-dashoffset), usada como elemento gráfico de transição entre seções.
- **Glow/light beam vertical**: barra de luz neon vertical como elemento de destaque/transição, não um glow difuso genérico.

Essas técnicas são endereçadas pela **Fase 18** abaixo, além de reforçar a Fase 11 (tipografia) e a Fase 13 (color).

---

## ESPECIFICAÇÃO DETALHADA POR FASE

### Fase 9 — `packages/audio` (Audio sync)

Objetivo: a timeline reage ao áudio em vez de tudo ser cravado manualmente em frames.

- Função `analyzeAudio(filePath: string): Promise<AudioAnalysis>` que roda **offline** (build-time/CLI, nunca no render do frame — precisa ser determinístico) usando `web-audio-api`/`essentia.js` ou biblioteca Node equivalente para extrair:
  - `beats: number[]` (timestamps em segundos de cada batida detectada)
  - `bpm: number`
  - `amplitudeEnvelope: number[]` (RMS por janela, ex. a cada 1/fps segundos, já pré-calculado por frame)
  - `onsets: number[]` (transientes/picos, útil pra cortes automáticos)
- Persistir o resultado em JSON ao lado do asset de áudio (cache — não re-analisar toda vez).
- Hook `useAudioData(analysisPath: string)` que carrega o JSON (via `staticFile` + `fetch` no Remotion, síncrono o suficiente para render) e expõe `getAmplitudeAtFrame(frame)`, `isBeatAtFrame(frame, toleranceFrames)`.
- Componente `<BeatSync preset="pulse" analysisPath="...">` que aplica um preset do `packages/presets` automaticamente em cada batida detectada, sem o usuário precisar cravar frames manualmente.
- CLI `pnpm --filter "@gmotion/audio" run analyze <arquivo.mp3>` que gera o JSON de análise.

Demo: composição no `apps/studio` com um áudio de exemplo, texto/logo pulsando exatamente no beat.

### Fase 10 — `packages/asset-library`

Objetivo: os 12GB de `EFEITOS ASSETS` e o `PACK EDITCLASS` param de ser pastas soltas e viram um catálogo pesquisável.

- Script `scripts/index-assets.mjs` que varre um diretório de assets (vídeos, PNGs com alpha, Lottie, sons) e gera `asset-manifest.json`:
  ```ts
  type AssetEntry = {
    id: string;
    path: string;
    type: "video" | "image" | "lottie" | "audio";
    tags: string[];       // inferidas do nome da pasta/arquivo
    duration?: number;     // para vídeo/áudio
    hasAlpha?: boolean;    // para vídeo/png (checagem via ffprobe)
    thumbnailPath?: string;
    width?: number;
    height?: number;
  };
  ```
  Gerar thumbnail (frame do meio) para vídeos via `ffmpeg`/`@remotion/renderer` `extractFrames`.
- Pacote `packages/asset-library` expõe `searchAssets(manifest, query: {tags?, type?, minDuration?})`.
- UI simples dentro do `apps/studio` (painel React fora da composição, só no modo dev — ex. rota separada ou overlay) para buscar por tag e copiar o `id`/`path` a usar na composição. Não precisa ser bonito, precisa ser funcional (input de busca + grid de thumbnails).
- Assets nunca commitados (já ignorados no `.gitignore`); o manifesto também não é commitado — script roda localmente.

Demo: rodar o indexador contra `EFEITOS ASSETS/`, mostrar manifesto gerado e uma composição usando 2-3 assets encontrados via busca por tag.

### Fase 11 — Text engine avançado (extensão de `packages/graphics`)

- `<SplitText>`: quebra uma string em caracteres/palavras, cada unidade vira uma `<AnimatedLayer>` independente com `delayFrames` escalonado (stagger), reaproveitando presets existentes de `packages/presets`.
- `<PathText>`: texto posicionado ao longo de um path SVG (`getPointAtLength`), com rotação seguindo a tangente do path — útil para texto curvo estilo CapCut.
- `<AnimatedStroke>`: SVG `<text>` ou `<path>` com `stroke-dasharray`/`stroke-dashoffset` animado por `useCurrentFrame()` (efeito "desenhando" o traço).
- `<MixedTypeText>`: componente que recebe um array de "runs" (`{ text, fontFamily, fontWeight, fontStyle, fontSize, color }[]`) e renderiza a frase com pesos/famílias diferentes por trecho, cada run entrando com delay independente via `<AnimatedLayer>` — cobre o padrão observado em `EXEMPLO DE EDIT/` de misturar bold sans + serif itálica fina na mesma frase (ex. "**Cortar** *seus*").
- Todas puras, testáveis com `vitest` (frame 0 = estado inicial, frame final = estado final).

Demo: composição mostrando split-text com stagger, path-text curvo, stroke se desenhando, e uma frase com `<MixedTypeText>` reproduzindo o padrão bold+serif observado na referência.

### Fase 12 — `packages/compositing` (Adjustment layers, blend modes, masks)

- `<AdjustmentLayer>`: componente que aplica um efeito (ex. do `packages/effects`) a **tudo abaixo dele** na composição, não só ao próprio conteúdo — implementar via `mix-blend-mode` CSS + camada `position: absolute` cobrindo o frame, ou via composição de `<OffthreadVideo>`/canvas quando CSS não bastar.
- `<BlendLayer mode="screen" | "multiply" | "overlay" | ...>`: wrapper que aplica `mix-blend-mode` de forma tipada (evitar strings soltas).
- `<MaskLayer mask={<svg>...</svg>}>`: usa `mask`/`clip-path` CSS para recortar o conteúdo filho pela forma do mask, com suporte a mask animado (o próprio SVG do mask pode ter `useCurrentFrame()` dentro).
- `<LayerGroup>`: agrupa camadas para aplicar transform/opacity/blend uma vez só ao grupo inteiro (equivalente a "pre-compose" do AE).

Demo: composição com 3 camadas de vídeo/imagem, uma adjustment layer de color grade por cima de tudo, um blend mode "screen" numa camada de partículas, e uma máscara circular revelando conteúdo.

### Fase 13 — `packages/color` (Color correction)

- Shader GLSL (via `@remotion/shaders` ou `three.js` `ShaderMaterial` reaproveitando a infra de `packages/effects`) implementando:
  - Curves (RGB + luminância) parametrizadas por pontos de controle.
  - HSL adjustment (hue shift, saturation, lightness) determinístico.
  - Aplicação de **LUT** (`.cube` file) — parser de arquivo `.cube` + sampling 3D no shader.
- Componente `<ColorGrade lut="..." curves={...} hsl={...}>` que envolve o conteúdo filho (mesmo padrão de `<AdjustmentLayer>` da Fase 12 — de fato, um color-grade é o caso de uso mais comum de adjustment layer, então deve compor com ela).
- Fallback CSS-only (`filter: hue-rotate() saturate() brightness()`) para os casos que não precisam de LUT, mais barato de renderizar.

Demo: mesma cena renderizada com 3 LUTs diferentes lado a lado (ou em sequência), mostrando o antes/depois.

### Fase 14 — `packages/morph` (Shape/SVG morphing)

- Função pura `morphPath(pathA: string, pathB: string, progress: number): string` fazendo interpolação de path SVG (portar/adaptar algoritmo tipo `flubber` ou `d3-interpolate-path` para função determinística sem estado).
- Componente `<MorphShape from="M0 0..." to="M10 10..." >` usando `useCurrentFrame()` para calcular `progress` e aplicar via `morphPath`.
- Suporte a morph de múltiplos shapes em sequência (array de paths, progress mapeado por segmento).

Demo: logo/ícone morfando entre 2-3 formas diferentes ao longo da composição.

### Fase 15 — `packages/tracking` (Motion tracking)

Esta é a mais experimental — escopo reduzido de propósito.

- Pipeline **offline** (não no render): script que roda um tracker simples (ex. `OpenCV.js` via Node com `opencv4nodejs`, ou tracker de feature points mais simples tipo Lucas-Kanade) sobre um vídeo de fundo e exporta `trackData.json`:
  ```ts
  type TrackFrame = { frame: number; x: number; y: number; scale: number; rotation: number };
  ```
- Componente `<TrackedLayer trackDataPath="...">` que lê o JSON (mesmo padrão de `useAudioData`) e posiciona o conteúdo filho na posição trackeada por frame, com interpolação entre pontos quando o tracker amostrou em framerate menor.
- Documentar claramente as limitações (tracker simples, não é nível Mocha/AE — serve para logos/textos colados em superfícies com movimento suave, não tracking de câmera 3D complexo).

Demo: um texto/logo "colado" seguindo um objeto simples se movendo no vídeo de fundo (ex. um ponto de referência manual como fallback caso o tracker automático não converja bem).

### Fase 16 — Batch export (extensão de `apps/studio` + scripts)

- Script `scripts/batch-render.mjs` que recebe uma composição e uma lista de formatos/resoluções (`1080x1920`, `1080x1080`, `1920x1080`) e dispara renders em paralelo via `@remotion/renderer` (worker pool, respeitando `os.cpus().length`).
- Suporte a overrides de props por formato (ex. reposicionar texto quando muda de vertical para horizontal) via um `formatOverrides` opcional por composição.
- Output organizado em `out/<nome-da-composicao>/<formato>.mp4`.

Demo: rodar o batch contra uma composição existente (ex. um template da Fase 7) e gerar os 3 formatos de uma vez.

### Fase 17 — Preview performático (Real-time LOD)

- Nas cenas 3D (`packages/three-scenes`), adicionar prop `previewQuality?: "low" | "high"` que reduz segment count de geometrias, desliga post-processing pesado e reduz contagem de partículas quando `previewQuality === "low"`.
- Detectar automaticamente se está rodando no Remotion Studio (preview interativo) vs. `remotion render` (final) — Remotion expõe isso via `useVideoConfig()`/env; usar essa detecção para default `low` no studio e `high` no render final, sem o usuário precisar setar manualmente.
- Medir e documentar o ganho de FPS no preview antes/depois no `README.md` do pacote.

Demo: mesma composição 3D pesada, abrir no studio (deve rodar fluido) e depois renderizar em `high` (deve manter a qualidade final).

### Fase 18 — `packages/editorial-style` (Estilo cinético observado na referência)

Objetivo: reproduzir especificamente o que foi visto em `EXEMPLO DE EDIT/` — um estilo editorial/cinético (cutout + duotone + tipografia + UI mockup), distinto do estilo "3D/glow/partículas" já coberto nas Fases 1-8.

- **`<DuotoneImage>`**: componente que aplica efeito duotone/halftone a uma imagem/vídeo via shader (reaproveitar infra GLSL do `packages/effects`/`packages/color`):
  - Converter para luminância.
  - Aplicar padrão de trama (halftone dots) via shader com frequência/ângulo parametrizáveis (`dotSize`, `angle`).
  - Mapear os dois tons finais (`colorDark`, `colorLight`) — duotone de verdade, não so grayscale.
  - Fallback CSS (`filter: grayscale(1) contrast(1.2)`) para prévia rápida quando o shader não é necessário.

- **Pipeline de cutout/rotoscope**: como remoção de fundo em tempo real está fora de escopo determinístico (modelos de segmentação não são triviais de rodar frame-a-frame com garantia de reprodutibilidade), o pipeline é **offline**:
  - Documentar/gerar via script (`scripts/cutout.mjs`) usando uma lib de remoção de fundo (ex. `rembg`/`@imgly/background-removal-node`) rodando **uma vez** sobre o vídeo/imagem de origem, exportando um `.webm`/PNG sequence com alpha.
  - Componente `<CutoutSubject src="video-com-alpha.webm">` só consome o resultado já processado (via `<OffthreadVideo>` com canal alpha) — no render determinístico não há segmentação ao vivo.
  - Documentar essa limitação claramente no README do pacote.

- **`<SolidColorBackdrop color="..." >`**: camada de fundo cor sólida full-frame, pensada para compor com `<TransitionSeries>` do `packages/transitions` — a troca de cor de fundo deve ser um **corte seco** entre cenas (sem cross-fade), então usar transição tipo `none`/`cut` do Remotion entre `<Sequence>`s, não uma transição suave.

- **`<FlatShadow>`**: wrapper que aplica sombra **sólida deslocada** (offset duro, sem blur) via `filter: drop-shadow(Xpx Ypx 0 color)` (blur=0) ou via elemento duplicado atrás com `transform: translate()` — visual "sticker"/flat design, distinto do `glow`/drop-shadow suave que já existe em `packages/effects`.

- **`<UIMockupOverlay>`**: conjunto de componentes que simulam elementos de interface de app de edição (botão retangular com label, cursor de mouse/dedo apontando, badge "FX") — usado para conteúdo de tutorial/screen-recording simulado. Cursor com posição animável por frame (`x`, `y`, ponto de destino, easing).

- **`<DashedPath>`**: SVG path com `stroke-dasharray` fixo (traço tracejado, não contínuo) + `stroke-dashoffset` animado por frame — elemento gráfico de transição/decoração, diferente do `<AnimatedStroke>` da Fase 11 (que desenha um traço contínuo; aqui o traço já nasce tracejado e "desliza").

- **`<GlowBeam>`**: barra retangular vertical/horizontal com gradiente de opacidade nas bordas + `box-shadow`/blur simulando neon, parametrizável em espessura, cor, posição — para o efeito de "feixe de luz" de destaque, distinto do `light-leak` já existente em `packages/effects` (que é mais orgânico/textura; este é geométrico).

Demo: recriar 3-4 segundos do trecho observado em `EXEMPLO DE EDIT/` — texto misto entrando ("**Cortar** *seus* **Vídeos**"), corte seco pra fundo vermelho, sujeito cutout em duotone sobreposto, `<UIMockupOverlay>` com cursor apontando pra um botão FX.

---

## PADRÕES DE CÓDIGO (reforço, iguais à Fase 1-8)

- TypeScript estrito, sem `any`.
- Toda lógica de cálculo (audio analysis parsing, morph interpolation, LUT sampling) separada em função pura testável — só o componente React usa hooks.
- Cada pacote novo com `README.md` próprio.
- `vitest` cobrindo casos de borda: frame 0, frame final, frame fora do range de dados (ex. `getAmplitudeAtFrame` além do fim do áudio).
- Scripts de análise offline (`audio`, `tracking`, `asset-library`) nunca entram no caminho de render determinístico — geram JSON cacheado, o componente só lê.

---

## PLANO DE EXECUÇÃO

Ordem sugerida (cada fase entrega algo demonstrável e não depende das seguintes, exceto onde indicado):

**Fase 9** → Audio sync
**Fase 10** → Asset library
**Fase 11** → Text engine avançado
**Fase 12** → Compositing (adjustment layers/blend/mask) — **pré-requisito da Fase 13**
**Fase 13** → Color correction (usa `<AdjustmentLayer>` da Fase 12)
**Fase 14** → Morphing
**Fase 15** → Motion tracking
**Fase 16** → Batch export
**Fase 17** → Preview performático (LOD)
**Fase 18** → Estilo editorial cinético (duotone, cutout, tipografia mista, UI mockup) — usa `<AdjustmentLayer>`/`<MixedTypeText>` das Fases 11-12, pode rodar em paralelo às Fases 14-17 já que não depende delas

Ao final de cada fase: parar, resumir o que foi implementado, mostrar como testar (`pnpm dev`, composição de demo específica), perguntar se segue pra próxima ou ajusta algo antes.

---

## PRIMEIRA TAREFA

Comece pela **Fase 9** (`packages/audio`). Antes de codar, rode o script de análise contra um áudio de exemplo (pode ser qualquer mp3/wav curto disponível no repo ou pedir um ao usuário) para validar que a extração de beats/BPM funciona antes de integrar ao Remotion. Só depois monte o hook `useAudioData` e o componente `<BeatSync>`.
