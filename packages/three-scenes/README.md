# @gmotion/three-scenes

Cenas 3D prontas sobre `@remotion/three` + React Three Fiber. Toda animação é função do `useCurrentFrame()` — zero física em tempo real do R3F.

## Componentes

### `<GmotionThreeScene>`
Wrapper do `ThreeCanvas` no tamanho da composição, com luzes padrão (`defaultLights`).

### `<ExtrudedText>`
Texto 3D extrudado com bevel (fonte helvetiker embutida do three). Materiais: `metal`, `glass`, `neon`.

```tsx
<GmotionThreeScene>
  <ExtrudedText text="GMOTION" material="metal" color="#d8dcff" />
  <OrbitingCamera radius={9} speed={0.1} height={2} />
</GmotionThreeScene>
```

### `<OrbitingCamera>`
Câmera orbitando a origem. `radius`, `speed` (voltas/s), `height`, `phase`, `lookAt`.

### `<Particles>`
Nuvem instanciada; posição de cada partícula = função pura de `(seed, index, frame)`. Sobe com wrap, ondula, pulsa. Props: `count`, `seed`, `spread`, `riseSpeed`, `size`, `color`, `glow`.

### `<FloatingImage>`
Logo/imagem 2D flutuando no espaço 3D com rotação sutil e sombra estilizada no chão. Props: `src` (use `staticFile()`), `width`, `amplitude`, `speed`, `shadow`.

### `<GltfModel>`
Importador genérico `.glb`/`.gltf` via `useLoader`. Props: `src`, `position`, `rotation`, `scale`, `color` (override de material).

```tsx
const frame = useCurrentFrame();
<GltfModel src={staticFile('robot.glb')} rotation={[0, frame * 0.02, 0]} />
```

## Regra

Nunca `useFrame` do R3F para animar — sempre derive posição/rotação do frame do Remotion.

## Testes

```sh
pnpm --filter @gmotion/three-scenes test
```

## Preview performático (LOD — Fase 17)

`previewQuality?: 'low' | 'high'` em `GmotionThreeScene` (propaga via contexto
pra `Particles`/`ExtrudedText`) ou por componente. **Default automático**:
`low` no Remotion Studio, `high` no `remotion render` — detectado via
`getRemotionEnvironment().isRendering`, sem setar nada.

O que o modo `low` corta:
- `dpr` do canvas: 0.7 (renderiza a ~70% da resolução)
- `Particles`: ~35% da contagem pedida, esfera 4x4 em vez de 8x8 segments
- `ExtrudedText`: `curveSegments` 8→3, `bevelSegments` 3→1

Medição (LodShowcase: 3500 partículas + texto extrudado, 45 frames, mesma
máquina de 12 cores, wall time do `remotion render` incluindo bundle fixo):
`low` 15.6s vs `high` 22.1s. Descontando ~9s de bundle/setup fixos, o tempo
por frame cai ~2x — no preview interativo do studio (sem bundle) o ganho de
FPS é dessa ordem.
