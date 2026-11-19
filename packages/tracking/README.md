# @gmotion/tracking

Motion tracking offline + `<TrackedLayer>` — colar UI/texto em objeto que se
move no vídeo de fundo.

## Pipeline (offline, nunca no render)

```sh
pnpm --filter @gmotion/tracking run track <video> --point 540,880 [--fps 15] [--width 320] [--patch 24] [--search 24]
# gera <video>.track.json: {width, height, fps, frames: [{frame, x, y, scale, rotation, confidence}]}
```

Tracker: template matching por **correlação cruzada normalizada (NCC)** em TS
puro — frames grayscale reduzidos extraídos via `ffmpeg-static` (rawvideo no
stdout), busca exaustiva ±raio, template re-amostrado quando confiança > 0.6.
Determinístico: mesmo vídeo, mesmo ponto, mesma trilha.

## Na composição

```tsx
<TrackedLayer trackUrl={staticFile('clip.mp4.track.json')} offsetY={-110}>
  <Label />
</TrackedLayer>
```

Interpola entre amostras (tracker roda a 15fps, composição a 30fps) e converte
px do vídeo → px da composição (assume vídeo preenchendo o frame).

## Limitações (de propósito — não é Mocha/AE)

- Translação apenas: `scale`/`rotation` sempre 1/0 nos dados atuais (campos
  existem pro futuro; `interpolateTrack` já os interpola).
- Objeto precisa manter aparência (sem oclusão longa, rotação forte ou blur).
- `confidence` baixa no JSON = revisar; fallback: editar o JSON na mão com
  keyframes manuais (o formato é simples de escrever).

## Validação real

Vídeo sintético (`TrackSource` no studio, bola com trajetória conhecida):
tracker recuperou a posição final com erro ~2px e 0% de amostras com
confiança < 0.5.

```sh
pnpm --filter @gmotion/tracking test
```
