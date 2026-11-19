/**
 * Parser e sampling de LUT 3D (.cube) — TS puro, determinístico, testável.
 */

export type CubeLut = {
  title?: string;
  size: number;
  domainMin: [number, number, number];
  domainMax: [number, number, number];
  /** Flat RGB, ordem padrão .cube: R varia mais rápido, depois G, depois B. */
  data: Float32Array;
};

/** Parseia o conteúdo de um arquivo .cube (LUT_3D_SIZE). */
export const parseCubeLut = (content: string): CubeLut => {
  let title: string | undefined;
  let size = 0;
  let domainMin: [number, number, number] = [0, 0, 0];
  let domainMax: [number, number, number] = [1, 1, 1];
  const values: number[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) continue;

    if (line.startsWith('TITLE')) {
      title = line.slice(5).trim().replace(/^"|"$/g, '');
      continue;
    }
    if (line.startsWith('LUT_3D_SIZE')) {
      size = Number(line.split(/\s+/)[1]);
      continue;
    }
    if (line.startsWith('DOMAIN_MIN')) {
      const [, a, b, c] = line.split(/\s+/);
      domainMin = [Number(a), Number(b), Number(c)];
      continue;
    }
    if (line.startsWith('DOMAIN_MAX')) {
      const [, a, b, c] = line.split(/\s+/);
      domainMax = [Number(a), Number(b), Number(c)];
      continue;
    }
    if (line.startsWith('LUT_1D_SIZE')) {
      throw new Error('LUT 1D não suportada — use LUT_3D_SIZE.');
    }

    const parts = line.split(/\s+/).map(Number);
    if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
      values.push(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0);
    }
  }

  if (size <= 1) throw new Error('.cube sem LUT_3D_SIZE válido.');
  const expected = size * size * size * 3;
  if (values.length !== expected) {
    throw new Error(`.cube com ${values.length / 3} entradas, esperado ${expected / 3} (size ${size}).`);
  }

  return {title, size, domainMin, domainMax, data: Float32Array.from(values)};
};

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const lutAt = (lut: CubeLut, r: number, g: number, b: number): [number, number, number] => {
  const i = (r + g * lut.size + b * lut.size * lut.size) * 3;
  return [lut.data[i] ?? 0, lut.data[i + 1] ?? 0, lut.data[i + 2] ?? 0];
};

/**
 * Sampling trilinear da LUT — o mesmo algoritmo do shader GLSL do <LutVideo>,
 * usável offline (testes, thumbnails, aproximações).
 */
export const sampleLutTrilinear = (
  lut: CubeLut,
  rgb: [number, number, number],
): [number, number, number] => {
  const n = lut.size - 1;
  const coords = rgb.map((v, axis) => {
    const min = lut.domainMin[axis] ?? 0;
    const max = lut.domainMax[axis] ?? 1;
    const t = clamp01((v - min) / (max - min || 1));
    return t * n;
  }) as [number, number, number];

  const [rf, gf, bf] = coords;
  const r0 = Math.floor(rf), g0 = Math.floor(gf), b0 = Math.floor(bf);
  const r1 = Math.min(n, r0 + 1), g1 = Math.min(n, g0 + 1), b1 = Math.min(n, b0 + 1);
  const tr = rf - r0, tg = gf - g0, tb = bf - b0;

  const mix = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];

  const c000 = lutAt(lut, r0, g0, b0), c100 = lutAt(lut, r1, g0, b0);
  const c010 = lutAt(lut, r0, g1, b0), c110 = lutAt(lut, r1, g1, b0);
  const c001 = lutAt(lut, r0, g0, b1), c101 = lutAt(lut, r1, g0, b1);
  const c011 = lutAt(lut, r0, g1, b1), c111 = lutAt(lut, r1, g1, b1);

  const c00 = mix(c000, c100, tr), c10 = mix(c010, c110, tr);
  const c01 = mix(c001, c101, tr), c11 = mix(c011, c111, tr);
  const c0 = mix(c00, c10, tg), c1 = mix(c01, c11, tg);
  return mix(c0, c1, tb);
};

/**
 * Aproxima a LUT 3D em 3 curvas 1D (por canal, demais canais neutros) —
 * usável no filtro SVG do <ColorGrade>. Perde termos cruzados (ex. teal
 * nas sombras que depende de R e B juntos) — pra LUT fiel use <LutVideo>.
 */
export const lutToTransferTables = (lut: CubeLut, steps = 33): {
  r: number[];
  g: number[];
  b: number[];
} => {
  const r: number[] = [], g: number[] = [], b: number[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    r.push(clamp01(sampleLutTrilinear(lut, [t, t, t])[0]));
    g.push(clamp01(sampleLutTrilinear(lut, [t, t, t])[1]));
    b.push(clamp01(sampleLutTrilinear(lut, [t, t, t])[2]));
  }
  return {r, g, b};
};
