import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {shakeCut, whipPan, zoomGlitch, lightLeak} from '@gmotion/transitions';
import {FilmGrain} from '@gmotion/effects';
import {
  BLOCK_FRAMES,
  BLOCK_START,
  CTA_FREEZE,
  HAS_AUDIO,
  HAS_MUSIC,
  HAS_SFX,
  TRANSITION_FRAMES,
} from './timing';
import {AgitacaoScene, CtaScene, HookScene, ProvaScene, SolucaoScene} from './scenes';

/**
 * FimeiPromo — vídeo de divulgação do FiMEI (42s, 1080x1920).
 * Roteiro: docs/fimei-roteiro.md. Narração: scripts/fimei-narration.mjs.
 * Cenas dimensionadas pela duração real de cada bloco de áudio (fimei-timing.json).
 */

const timing = linearTiming({durationInFrames: TRANSITION_FRAMES});
const audio = (name: string) => staticFile(`audio/fimei/${name}.mp3`);
const music = () => staticFile('audio/fimei/music.wav');
const sfx = (name: string) => staticFile(`audio/fimei/sfx/${name}.wav`);

const NarrationTrack = () => (
  <>
    <Sequence from={BLOCK_START.hook}>
      <Audio src={audio('hook')} />
    </Sequence>
    <Sequence from={BLOCK_START.agitacao}>
      <Audio src={audio('agitacao')} />
    </Sequence>
    <Sequence from={BLOCK_START.solucao}>
      <Audio src={audio('solucao')} />
    </Sequence>
    <Sequence from={BLOCK_START.prova}>
      <Audio src={audio('prova')} />
    </Sequence>
    <Sequence from={BLOCK_START.cta}>
      <Audio src={audio('cta')} />
    </Sequence>
  </>
);

/** Bass hits no hook/solução/CTA, whoosh nas transições, tick nos benefícios. */
const SfxTrack = () => {
  const solucaoIntro = Math.round(BLOCK_FRAMES.solucao * 0.24);
  const benefitBeat = Math.floor((BLOCK_FRAMES.solucao - solucaoIntro) / 4);
  const whooshAt = [
    BLOCK_START.agitacao,
    BLOCK_START.solucao,
    BLOCK_START.prova,
    BLOCK_START.cta,
  ];
  const ticksAt = [0, 1, 2, 3].map(
    (i) => BLOCK_START.solucao + solucaoIntro + i * benefitBeat,
  );
  return (
    <>
      <Sequence from={0}>
        <Audio src={sfx('bass-hit')} volume={0.8} />
      </Sequence>
      <Sequence from={BLOCK_START.solucao}>
        <Audio src={sfx('bass-hit')} volume={0.8} />
      </Sequence>
      <Sequence from={BLOCK_START.cta}>
        <Audio src={sfx('bass-hit')} volume={0.9} />
      </Sequence>
      {whooshAt.map((f, i) => (
        <Sequence key={`w${i}`} from={f - 4}>
          <Audio src={sfx('whoosh')} volume={0.5} />
        </Sequence>
      ))}
      {ticksAt.map((f, i) => (
        <Sequence key={`t${i}`} from={f}>
          <Audio src={sfx('tick')} volume={0.6} />
        </Sequence>
      ))}
    </>
  );
};

export const FimeiPromo = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#060a08'}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.hook}>
          <HookScene durationInFrames={BLOCK_FRAMES.hook} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={shakeCut({intensity: 28})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.agitacao}>
          <AgitacaoScene durationInFrames={BLOCK_FRAMES.agitacao} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whipPan({direction: 'left'})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.solucao}>
          <SolucaoScene durationInFrames={BLOCK_FRAMES.solucao} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomGlitch({strength: 0.45})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.prova}>
          <ProvaScene durationInFrames={BLOCK_FRAMES.prova} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={lightLeak()} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.cta + CTA_FREEZE}>
          <CtaScene narrationFrames={BLOCK_FRAMES.cta} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {HAS_AUDIO ? <NarrationTrack /> : null}
      {HAS_SFX ? <SfxTrack /> : null}
      {HAS_MUSIC ? <Audio src={music()} volume={0.22} /> : null}

      <FilmGrain intensity={0.09} />
    </AbsoluteFill>
  );
};
