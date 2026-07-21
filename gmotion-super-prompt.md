# SUPER PROMPT — Projeto "Gmotion"

> Cole este prompt inteiro na IA que vai codar (Claude Code, Cursor, etc). Ele foi escrito para ser executado em fases, então você pode colar o prompt inteiro e depois pedir "vamos para a Fase 1", "vamos para a Fase 2" etc.

---

## CONTEXTO DO PROJETO

Você vai atuar como engenheiro de software sênior especializado em motion graphics, WebGL/Three.js, React e renderização de vídeo programática. Vamos construir uma ferramenta chamada **Gmotion**, um fork/camada de extensão sobre o **Remotion** (biblioteca open source que renderiza vídeo com React, https://www.remotion.dev), para uso pessoal do dono do projeto.

O objetivo do Gmotion é levar o Remotion a um nível de qualidade visual comparável ao **After Effects** e ao **CapCut** (estilo de edição dinâmica/viral para Reels e Shorts), mas de forma 100% programática e reutilizável em código, com o menor esforço manual possível — usando IA para gerar cenas, presets e efeitos sob demanda.

Não precisamos manter compatibilidade com nada além do próprio uso pessoal. Priorize simplicidade de manutenção e qualidade visual sobre "arquitetura enterprise".

### Stack base
- Remotion (última versão estável) + TypeScript + React
- `@remotion/three` + `@react-three/fiber` + `three.js` para 3D
- `@remotion/transitions` como base de transições
- Node.js, pnpm como gerenciador de pacotes
- Renderização via CLI (`remotion render`) — não precisa de Lambda/Vercel por enquanto

### Restrição inegociável do Remotion (não pode quebrar)
Toda animação **precisa** ser uma função pura do frame atual (`useCurrentFrame()`), `fps` e `durationInFrames`. Nada de `requestAnimationFrame`, `setTimeout`, listeners de tempo real ou estado que mude "ao vivo" fora do frame — isso quebra a renderização determinística (cada frame precisa dar exatamente o mesmo resultado toda vez que for re-renderizado, em qualquer ordem).

---

## OBJETIVO GERAL

Criar um monorepo chamado `gmotion` estruturado assim:

```
gmotion/
├── apps/
│   └── studio/                 # projeto Remotion principal (composições finais)
├── packages/
│   ├── core/                   # wrappers/helpers genéricos sobre a API do Remotion
│   ├── presets/                # animações prontas estilo CapCut (entrada/ênfase/saída/loop)
│   ├── transitions/            # transições de cena (extensão do @remotion/transitions)
│   ├── three-scenes/           # cenas e elementos 3D prontos (wrapper do @remotion/three)
│   ├── effects/                # shaders, partículas, grain, glow, chromatic aberration
│   ├── graphics/                # elementos gráficos: lower-thirds, callouts, contadores, badges
│   ├── templates/              # composições completas prontas para usar (ex: "Reel Viral", "Ad 15s")
│   └── ai-director/            # camada de IA que monta vídeos a partir de instruções em texto
├── package.json
├── turbo.json (ou nx.json)     # monorepo com pnpm workspaces + turborepo
└── README.md
```

Cada `package` deve ser instalável isoladamente dentro do `apps/studio`, exportando componentes React e funções puras bem tipadas.

---

## ESPECIFICAÇÃO DETALHADA POR PACOTE

### 1. `packages/presets` — Animações estilo CapCut
Crie uma biblioteca de presets de animação aplicáveis a qualquer elemento (texto, imagem, forma, grupo). Cada preset é uma função pura:

```ts
type PresetFn = (params: {
  frame: number;
  fps: number;
  durationInFrames: number;
  progress: number; // 0 a 1, já calculado
}) => React.CSSProperties | { transform: string; opacity: number; filter?: string };
```

Categorias obrigatórias (espelhando o CapCut/AE):
- **Entrada**: fade-in, slide-in (4 direções), zoom-in bounce, blur-in, typewriter (para texto), pop-in com spring, glitch-in.
- **Ênfase/loop**: pulse, shake, float (flutuação suave), rotate-loop, glow-pulse.
- **Saída**: fade-out, slide-out, zoom-out, blur-out, shrink-out.
- Todos devem aceitar parâmetros de customização: duração em frames, easing, intensidade, direção.

Use `spring()` do Remotion como motor físico padrão (mais orgânico que easing linear). Documente cada preset com um exemplo mínimo de uso em comentário JSDoc.

Crie também um componente wrapper genérico:
```tsx
<AnimatedLayer preset="slide-in-bounce" enterFrames={15} exitFrames={10}>
  <MeuElemento />
</AnimatedLayer>
```
que aplica entrada + (opcionalmente) saída automaticamente com base na duração da Sequence pai.

### 2. `packages/transitions` — Transições de cena
Baseie-se em `@remotion/transitions` e adicione:
- Zoom-glitch, RGB-split-wipe, shake-cut, whip-pan (câmera "chicoteando" horizontal/vertical), light-leak-transition, film-burn.
- Cada transição deve funcionar com o `<TransitionSeries>` do Remotion, aceitando `durationInFrames` e `direction`.

### 3. `packages/three-scenes` — Elementos 3D
Sobre `@remotion/three` e React Three Fiber, construa cenas 3D prontas e parametrizáveis:
- Texto 3D extrudado com material metálico/glass, com câmera orbitando.
- Logo/imagem 2D "flutuando" no espaço 3D com profundidade e sombra.
- Sistema de partículas (baseie-se no exemplo oficial `remotion-dev/three-particles` como referência de implementação).
- Importador de modelos `.glb`/`.gltf` genérico via `useLoader`, com props para posição, rotação, escala e cor de material.
- Todas as animações de câmera e objeto devem ser calculadas via `useCurrentFrame()` — nunca com física em tempo real do R3F.

### 4. `packages/effects` — Efeitos visuais estilo AE
- Shaders GLSL customizados para: film grain, chromatic aberration, glow/bloom, vinheta, light leaks, RGB shift.
- Implemente como componentes React que recebem `intensity`, `frame` e aplicam via `<filter>` CSS quando possível (mais barato) ou via shader WebGL (quando precisar de qualidade maior).
- Efeito de "screen shake" reutilizável (aplica pequenas translações/rotations baseadas em ruído determinístico — usar seed fixo por frame, nunca `Math.random()` puro sem seed, para manter determinismo).

### 5. `packages/graphics` — Elementos gráficos motion design
- Lower-thirds animados (nome + cargo aparecendo com preset de entrada).
- Callouts/setas apontando para elementos.
- Contadores numéricos animados (0 até X, com easing).
- Barras de progresso, badges, chips de texto com bordas animadas.
- Suporte a Lottie: componente `<LottieLayer src="..." />` que sincroniza o playhead do Lottie com `useCurrentFrame()` do Remotion (usar `@remotion/lottie` se existir, senão implementar sync manual com `lottie-web`).

### 6. `packages/templates` — Composições prontas
Templates completos (várias camadas + presets + transições já montados), parametrizáveis por JSON/props, no estilo "troque o texto e o vídeo e está pronto":
- "Reel Viral" (cortes rápidos, zoom bounce, texto grande estilo CapCut).
- "Anúncio 15s" (produto + preço + CTA).
- "Intro de canal" (logo 3D + partículas + slogan).

### 7. `packages/ai-director` — Camada de IA (o diferencial do Gmotion)
Esta é a parte que usa IA para acelerar a criação. Objetivo: o usuário descreve o vídeo em texto e a IA gera automaticamente a composição Remotion (JSX/TSX) usando os pacotes acima.

Componentes:
- Um **schema JSON** que descreve uma "timeline abstrata" (camadas, tempo de início/fim, preset de entrada/saída, texto, mídia, transições) — mais fácil da IA gerar JSON estruturado do que TSX direto.
- Um **compilador** que transforma esse JSON em componentes Remotion reais (`jsonToComposition(timeline: TimelineSchema): JSX.Element`).
- Um **prompt de sistema** para o modelo de IA (Claude via API, por exemplo) cuja função é: receber a descrição em linguagem natural do usuário + a lista de presets/efeitos/templates disponíveis (gerada dinamicamente a partir dos pacotes) e devolver **apenas o JSON da timeline**, nada de texto solto.
- Loop de refinamento: o usuário pode pedir ajustes ("deixa o zoom mais forte", "troca a transição da cena 2") e a IA edita apenas o trecho relevante do JSON, sem regerar tudo.

Isso é o que aproxima o Gmotion do "nível After Effects usando IA": em vez de você montar keyframe por keyframe, você descreve o resultado e o `ai-director` monta a timeline usando o catálogo de presets/efeitos que os outros pacotes já expõem.

---

## PADRÕES DE CÓDIGO

- TypeScript estrito (`strict: true`), sem `any`.
- Toda função de animação deve ser pura e testável isoladamente (sem hooks dentro da função de cálculo, só nos componentes React).
- Cada pacote com seu próprio `README.md` documentando props e exemplo de uso.
- Nomes de componentes e props em inglês (padrão da comunidade Remotion), comentários podem ser em português.
- Testes com `vitest` para as funções puras de preset/interpolação (garantir que em frame 0 e frame final os valores batem com o esperado).

---

## PLANO DE EXECUÇÃO EM FASES

Não tente fazer tudo de uma vez. Siga esta ordem, entregando algo funcional e testável no final de cada fase:

**Fase 1 — Fundação**
Criar o monorepo (pnpm workspaces + turborepo), o `apps/studio` com uma composição de exemplo simples, e o `packages/core` com helpers básicos (ex: hook `useEnterExit()` que calcula progresso de entrada/saída dado frames de in/out).

**Fase 2 — Presets**
Implementar `packages/presets` completo com as categorias listadas acima + `<AnimatedLayer>`. Criar uma composição de demonstração no `apps/studio` mostrando todos os presets em sequência.

**Fase 3 — Transições**
Implementar `packages/transitions` e uma composição demo com `<TransitionSeries>` usando 3-4 cenas diferentes.

**Fase 4 — 3D**
Implementar `packages/three-scenes` com pelo menos: texto 3D, partículas e importador de modelo `.glb`. Composição demo.

**Fase 5 — Efeitos**
Implementar `packages/effects` (grain, glow, chromatic aberration, screen shake). Composição demo combinando com os presets da Fase 2.

**Fase 6 — Gráficos**
Implementar `packages/graphics` (lower-thirds, callouts, contadores, Lottie).

**Fase 7 — Templates**
Montar 2-3 templates completos combinando tudo das fases anteriores.

**Fase 8 — AI Director**
Implementar o schema JSON de timeline, o compilador `jsonToComposition`, e o prompt de sistema para gerar/editar timelines via IA. Criar um pequeno CLI ou script (`gmotion generate "descrição do vídeo"`) que chama a API da IA e renderiza o resultado.

Ao final de cada fase, pare e mostre um resumo do que foi implementado, como testar localmente (`pnpm dev` no studio) e pergunte se deve prosseguir para a próxima fase ou ajustar algo antes.

---

## PRIMEIRA TAREFA

Comece pela **Fase 1**. Antes de escrever código, monte a estrutura de pastas do monorepo, configure o `pnpm-workspace.yaml` e o `turbo.json`, crie o `apps/studio` com o boilerplate padrão do Remotion (`npx create-video@latest`), e só então implemente o `packages/core`. Ao terminar, mostre a árvore de arquivos final e as instruções de como rodar (`pnpm install && pnpm dev`).
