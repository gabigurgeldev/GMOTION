#!/usr/bin/env node
/**
 * Gera 3 LUTs .cube de demo (warm, cool, noir) em apps/studio/public/luts/.
 * LUTs com termos cruzados de verdade (não só curva por canal) pra
 * evidenciar o sampling 3D do <LutVideo>.
 */
import {mkdirSync, writeFileSync} from 'node:fs';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../apps/studio/public/luts');
mkdirSync(outDir, {recursive: true});

const SIZE = 17;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

const makeCube = (title, transform) => {
  const lines = [`TITLE "${title}"`, `LUT_3D_SIZE ${SIZE}`];
  for (let b = 0; b < SIZE; b++) {
    for (let g = 0; g < SIZE; g++) {
      for (let r = 0; r < SIZE; r++) {
        const rgb = transform(r / (SIZE - 1), g / (SIZE - 1), b / (SIZE - 1));
        lines.push(rgb.map((v) => clamp01(v).toFixed(6)).join(' '));
      }
    }
  }
  return lines.join('\n') + '\n';
};

const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// warm: sombras puxam teal, altas luzes puxam laranja (cross-channel clássico).
const warm = (r, g, b) => {
  const l = luma(r, g, b);
  const shadow = 1 - l;
  return [r * 1.08 + l * 0.08, g * 1.0 + shadow * 0.02, b * 0.85 + shadow * 0.12];
};

// cool: tudo pro azul, verdes segurados, contraste leve.
const cool = (r, g, b) => {
  const l = luma(r, g, b);
  const c = (v) => (v - 0.5) * 1.1 + 0.5;
  return [c(r) * 0.9, c(g) * 0.98 + l * 0.02, c(b) * 1.1 + 0.04];
};

// noir: dessatura forte + contraste alto + leve tom sépia nas médias.
const noir = (r, g, b) => {
  const l = (luma(r, g, b) - 0.5) * 1.35 + 0.5;
  const mid = 1 - Math.abs(l - 0.5) * 2;
  return [l + mid * 0.05, l + mid * 0.02, l - mid * 0.03];
};

writeFileSync(resolve(outDir, 'warm.cube'), makeCube('gmotion warm', warm));
writeFileSync(resolve(outDir, 'cool.cube'), makeCube('gmotion cool', cool));
writeFileSync(resolve(outDir, 'noir.cube'), makeCube('gmotion noir', noir));
console.log(`3 LUTs geradas em ${outDir} (size ${SIZE})`);
