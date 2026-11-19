import {DataTexture, LinearFilter, ClampToEdgeWrapping, RGBAFormat, UnsignedByteType} from 'three';
import type {CubeLut} from './cube';

/**
 * Empacota a LUT 3D (N×N×N) numa DataTexture 2D de N*N × N:
 * fatias de B lado a lado no eixo X; R dentro da fatia; G no eixo Y.
 * O shader do <LutVideo> faz bilinear em R/G via hardware e mistura
 * as duas fatias de B manualmente (trilinear completo).
 */
export const lutToDataTexture = (lut: CubeLut): DataTexture => {
  const n = lut.size;
  // 8-bit: float + LinearFilter exigiria OES_texture_float_linear (nem sempre
  // disponível — sampler devolve preto quando falta). 8 bits basta pra LUT.
  const data = new Uint8Array(n * n * n * 4);
  const to8 = (v: number): number => Math.round(Math.max(0, Math.min(1, v)) * 255);
  for (let b = 0; b < n; b++) {
    for (let g = 0; g < n; g++) {
      for (let r = 0; r < n; r++) {
        const src = (r + g * n + b * n * n) * 3;
        const x = b * n + r;
        const y = g;
        const dst = (y * n * n + x) * 4;
        data[dst] = to8(lut.data[src] ?? 0);
        data[dst + 1] = to8(lut.data[src + 1] ?? 0);
        data[dst + 2] = to8(lut.data[src + 2] ?? 0);
        data[dst + 3] = 255;
      }
    }
  }
  const texture = new DataTexture(data, n * n, n, RGBAFormat, UnsignedByteType);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
};

export const LUT_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const LUT_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform sampler2D map;
uniform sampler2D lutTex;
uniform float lutSize;
uniform float intensity;
varying vec2 vUv;

vec2 sliceUv(float slice, vec2 rg) {
  float n = lutSize - 1.0;
  float x = (slice * lutSize + rg.x * n + 0.5) / (lutSize * lutSize);
  float y = (rg.y * n + 0.5) / lutSize;
  return vec2(x, y);
}

void main() {
  vec4 src = texture2D(map, vUv);
  vec3 c = clamp(src.rgb, 0.0, 1.0);
  float bF = c.b * (lutSize - 1.0);
  float b0 = floor(bF);
  float b1 = min(lutSize - 1.0, b0 + 1.0);
  vec3 s0 = texture2D(lutTex, sliceUv(b0, c.rg)).rgb;
  vec3 s1 = texture2D(lutTex, sliceUv(b1, c.rg)).rgb;
  vec3 graded = mix(s0, s1, bF - b0);
  gl_FragColor = vec4(mix(c, graded, intensity), src.a);
}
`;
