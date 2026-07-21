# Gmotion

Camada de extensão sobre o [Remotion](https://www.remotion.dev) para motion graphics programático nível After Effects / CapCut, com **ponte bidirecional para o formato interno do CapCut** (`draft_content.json`) e camadas 3D / shaders / partículas que o CapCut não faz.

## Estrutura

```
gmotion/
├── apps/
│   └── studio/          # projeto Remotion (composições + CapcutImported)
├── packages/
│   ├── core/            # helpers (useEnterExit, math determinístico)
│   ├── presets/         # animações estilo CapCut + <AnimatedLayer>
│   ├── transitions/     # zoom-glitch, whip-pan, shake-cut, light-leak...
│   ├── three-scenes/    # texto 3D, partículas, glb importer, câmera orbital
│   ├── effects/         # grain, glow, chromatic aberration, screen shake
│   ├── graphics/        # lower-thirds, callouts, contadores, Lottie
│   ├── templates/       # Reel Viral, Anúncio 15s, Intro de canal
│   ├── ai-director/     # descrição em texto -> timeline JSON -> Remotion
│   └── capcut/          # ponte CapCut ⇆ Gmotion (import/export/flatten/bake)
```

---

## Baixar e rodar no Windows (PowerShell)

### 1. Pré-requisitos (instale uma vez)

Abra o **PowerShell** e instale Git + Node LTS via `winget`:

```powershell
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
```

Feche e reabra o PowerShell (pra atualizar o PATH). Habilite o pnpm (vem junto do Node via corepack):

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

Confira as versões:

```powershell
git --version ; node --version ; pnpm --version
```

### 2. Clonar o repositório

```powershell
cd $HOME\Documents
git clone https://github.com/gabigurgeldev/GMOTION.git
cd GMOTION
```

### 3. Instalar dependências

```powershell
pnpm install
```

### 4. Abrir o Remotion Studio (preview)

```powershell
pnpm dev
```

Abre o navegador no Studio. Selecione uma composição (ex.: `HelloGmotion`, `CapcutImported`).

### 5. Renderizar um vídeo

```powershell
cd apps\studio
npx remotion render HelloGmotion out\hello.mp4
```

Para o vídeo com texto 3D + partículas (usa WebGL headless):

```powershell
npx remotion render CapcutImported out\gmotion-pro.mp4 --gl=angle
```

> **Assets do CapCut não vêm no repositório** (material de curso / arquivos pesados de 12 GB ficam de fora por tamanho e copyright). A composição `CapcutImported` usa mídias que você regenera localmente — veja abaixo.

---

## Ponte CapCut (pacote `@gmotion/capcut`)

Importar um projeto CapCut e montar/renderizar no Gmotion:

```powershell
# monta a peça "pro" a partir de um draft CapCut local (se você tiver um)
pnpm --filter "@gmotion/capcut" run pro

# depois renderiza
cd apps\studio
npx remotion render CapcutImported out\gmotion-pro.mp4 --gl=angle
```

Outros comandos:

```powershell
# importar um draft CapCut -> timeline JSON (+ copiar mídias pro studio)
pnpm --filter "@gmotion/capcut" run import-draft "C:\caminho\do\draft" --out apps\studio\src\generated\capcut-timeline.json --assets apps\studio\public

# exportar uma timeline -> pasta de draft CapCut
pnpm --filter "@gmotion/capcut" run export-draft timeline.json --out out\draft
```

Detalhes em [`packages/capcut/README.md`](packages/capcut/README.md).

---

## Testes

```powershell
pnpm test
```

## Regra de ouro (Remotion)

Toda animação é função pura de `useCurrentFrame()`, `fps` e `durationInFrames`. Nunca `requestAnimationFrame`, `setTimeout`, `Math.random()` sem seed, ou estado em tempo real — quebra o render determinístico.
