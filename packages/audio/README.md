# @gmotion/audio

Timeline reagindo a áudio: beat detection **offline** + hook + `<BeatSync>`.

A análise nunca roda no render (determinismo). O fluxo é:

1. **Analisar (CLI, uma vez):**

   ```sh
   pnpm --filter @gmotion/audio run analyze apps/studio/public/capcut/trilha.MP3
   # gera trilha.MP3.analysis.json ao lado do arquivo (cache por mtime; --force refaz)
   ```

   Decodifica via `ffmpeg-static` (PCM mono) e extrai em TS puro:
   `bpm`, `beats[]` (grade alinhada ao BPM), `onsets[]` (transientes) e
   `amplitudeEnvelope[]` (RMS por frame, normalizado 0-1).

2. **Consumir na composição:**

   ```tsx
   import {staticFile, Audio} from 'remotion';
   import {BeatSync, useAudioData} from '@gmotion/audio';

   const url = staticFile('capcut/trilha.MP3.analysis.json');

   // Preset em cada batida, sem cravar frames:
   <BeatSync analysisUrl={url} preset="pulse" decayFrames={8}>
     <Logo />
   </BeatSync>

   // Ou acesso direto:
   const data = useAudioData(url);
   data?.getAmplitudeAtFrame(frame);      // 0-1
   data?.isBeatAtFrame(frame, 2);         // beat a ±2 frames?
   data?.lastBeatFrameAtOrBefore(frame);  // frame do último beat
   ```

`useAudioData` usa `delayRender`/`continueRender` — o Remotion espera o JSON
antes de renderizar. `frame` sempre no fps da composição (conversão interna).

## Limitações

- Detector de onsets por novidade de energia — funciona bem com material
  percussivo/eletrônico; música muito legato pode render grade menos precisa.
- BPM estimado na faixa 60–200 (intervalos dobrados/divididos até cair nela).
- `*.analysis.json` é derivado — não commitar (ignorado no `.gitignore` raiz);
  rode o CLI localmente após clonar.

## Testes

```sh
pnpm --filter @gmotion/audio test
```

Cobrem click-track sintético (120/90 BPM), silêncio, frame 0/final/fora do range.
