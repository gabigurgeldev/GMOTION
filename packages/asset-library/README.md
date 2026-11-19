# @gmotion/asset-library

Os 12GB de `EFEITOS ASSETS` viram catálogo pesquisável.

## Fluxo

1. **Indexar (offline, local — nada disso é commitado):**

   ```sh
   node scripts/index-assets.mjs "EFEITOS ASSETS" --out asset-manifest.json
   # ou: pnpm --filter @gmotion/asset-library run index <dir> [--out ...] [--no-thumbs]
   ```

   Varre vídeos/imagens/Lottie/áudio, infere `tags` do caminho (minúsculas,
   sem acento, sem sufixo Google Takeout), extrai duração/dimensões/`hasAlpha`
   via `ffprobe-static` (PNG: leitura direta do IHDR) e gera thumbnail do
   frame do meio via `ffmpeg-static` em `<root>/.gmotion-thumbs/`.

2. **Buscar (função pura, browser-safe):**

   ```ts
   import {searchAssets} from '@gmotion/asset-library';
   searchAssets(manifest, {tags: ['3d', 'emoji'], type: 'video', minDuration: 2, hasAlpha: true});
   // tags casam por prefixo: "emoji" acha "emojis"; todas precisam bater
   ```

3. **Browser visual (dev-only, fora da composição):**

   ```sh
   pnpm --filter @gmotion/asset-library run browse -- --manifest ../../asset-manifest.json
   # http://localhost:4567 — busca por tag + grid; clique copia o path
   ```

## Não commitado

`asset-manifest.json`, `.gmotion-thumbs/` e os assets em si ficam fora do git
(derivados/pesados/copyright). Regenerar com o comando do passo 1.

## Testes

```sh
pnpm --filter @gmotion/asset-library test
```
