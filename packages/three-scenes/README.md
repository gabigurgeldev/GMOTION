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
