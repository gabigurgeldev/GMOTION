# @gmotion/core

Helpers genéricos sobre a API do Remotion. Tudo determinístico: função pura do frame.

## API

### `useEnterExit(options?)`

Hook que calcula progresso de entrada/saída da camada atual.

| Opção | Tipo | Default | Descrição |
| --- | --- | --- | --- |
| `enterFrames` | `number` | `15` | Duração da entrada em frames |
| `exitFrames` | `number` | `0` | Duração da saída em frames (0 = sem saída) |
| `durationInFrames` | `number` | duração da Sequence atual | Override manual |

Retorna `{enter, exit, combined}` — cada um de 0 a 1.

```tsx
import {useEnterExit} from '@gmotion/core';

const FadeCard = () => {
  const {combined} = useEnterExit({enterFrames: 15, exitFrames: 10});
  return <div style={{opacity: combined}}>Olá</div>;
};
```

### `calcEnterExit(params)`

Versão pura do hook (sem React). Usada internamente e nos testes.

```ts
calcEnterExit({frame: 30, durationInFrames: 60, enterFrames: 15, exitFrames: 10});
// => {enter: 1, exit: 1, combined: 1}
```

### Math

- `lerp(a, b, t)` — interpolação linear.
- `clamp(v, min, max)` — restringe intervalo.
- `normalize(v, inMin, inMax)` — remapeia para [0, 1] com clamp.
- `seededNoise(seed, x)` — ruído determinístico em [-1, 1]; substituto de `Math.random()` para shake/glitch.

## Testes

```sh
pnpm --filter @gmotion/core test
```
