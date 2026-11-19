#!/usr/bin/env node
/**
 * Cutout/rotoscope OFFLINE (Fase 18): remove o fundo UMA vez, o render só
 * consome o resultado (determinismo — nada de segmentação ao vivo).
 *
 *   node scripts/cutout.mjs <imagem.png|jpg> [saida.png]
 *
 * Usa @imgly/background-removal-node (instalar sob demanda — pesado, onnx):
 *   pnpm add -w -D @imgly/background-removal-node
 *
 * Pra VÍDEO: extrair frames, rodar em cada um e remontar webm com alpha:
 *   ffmpeg -i in.mp4 frames/%04d.png
 *   for f in frames/*.png; do node scripts/cutout.mjs "$f"; done
 *   ffmpeg -framerate 30 -i frames/%04d.cutout.png -c:v libvpx-vp9 -pix_fmt yuva420p out.webm
 * Alternativa: rembg (python) — rembg i in.png out.png
 */
import {existsSync, writeFileSync} from 'node:fs';
import process from 'node:process';

const [input, output] = process.argv.slice(2);
if (!input || !existsSync(input)) {
  console.error('Uso: node scripts/cutout.mjs <imagem> [saida.png]');
  process.exit(1);
}
const outputPath = output ?? input.replace(/\.[^.]+$/, '') + '.cutout.png';

let removeBackground;
try {
  ({removeBackground} = await import('@imgly/background-removal-node'));
} catch {
  console.error(
    '@imgly/background-removal-node não instalado.\n' +
      'Instale: pnpm add -w -D @imgly/background-removal-node\n' +
      'Ou use rembg (python): rembg i entrada.png saida.png',
  );
  process.exit(1);
}

console.log(`Removendo fundo de ${input}...`);
const blob = await removeBackground(input);
writeFileSync(outputPath, Buffer.from(await blob.arrayBuffer()));
console.log(`Cutout gravado: ${outputPath}`);
