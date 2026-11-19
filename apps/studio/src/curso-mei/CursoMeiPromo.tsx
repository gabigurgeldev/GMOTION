import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {whipPan, zoomGlitch} from '@gmotion/transitions';
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
import {
  AgitacaoScene,
  CtaScene,
  DorScene,
  GanchoScene,
  OfertaScene,
  ProvaScene,
  ViradaScene,
} from './scenes';

/**
 * CursoMeiPromo — anúncio de curso de gestão financeira para MEI (≈54s, 1080x1920).
 * Briefing: gancho, dor, agitação, virada, prova, oferta, CTA (7 cenas).
 * Cenas dimensionadas pela duração real de cada bloco de áudio (curso-mei-timing.json).
 * Renderizar 9:16 e 16:9 via scripts/batch-render.mjs (layout reflui em useLayout()).
 *
 * @prop courseName substitui "[NOME DO CURSO]" — preencher antes de renderizar.
 */

const timing = linearTiming({durationInFrames: TRANSITION_FRAMES});
const narration = (name: string) => staticFile(`audio/curso-mei/${name}.mp3`);
// SFX e música reusados do FimeiPromo (scripts/fimei-sfx.mjs).
const music = () => staticFile('audio/fimei/music.wav');
const sfx = (name: string) => staticFile(`audio/fimei/sfx/${name}.wav`);

const NarrationTrack = () => (
  <>
    <Sequence from={BLOCK_START.gancho}>
      <Audio src={narration('gancho')} />
    </Sequence>
    <Sequence from={BLOCK_START.dor}>
      <Audio src={narration('dor')} />
    </Sequence>
    <Sequence from={BLOCK_START.agitacao}>
      <Audio src={narration('agitacao')} />
    </Sequence>
    <Sequence from={BLOCK_START.virada}>
      <Audio src={narration('virada')} />
    </Sequence>
    <Sequence from={BLOCK_START.prova}>
      <Audio src={narration('prova')} />
    </Sequence>
    <Sequence from={BLOCK_START.oferta}>
      <Audio src={narration('oferta')} />
    </Sequence>
    <Sequence from={BLOCK_START.cta}>
      <Audio src={narration('cta')} />
    </Sequence>
  </>
);

/** Bass no gancho/virada/CTA, whoosh antes de cada troca, tick nos bullets da oferta. */
const SfxTrack = () => {
  const ofertaIntro = Math.round(BLOCK_FRAMES.oferta * 0.28);
  const bulletBeat = Math.floor((BLOCK_FRAMES.oferta - ofertaIntro) / 5);
  const whooshAt = [
    BLOCK_START.dor,
    BLOCK_START.agitacao,
    BLOCK_START.virada,
    BLOCK_START.prova,
    BLOCK_START.oferta,
    BLOCK_START.cta,
  ];
  const ticksAt = [0, 1, 2, 3].map(
    (i) => BLOCK_START.oferta + ofertaIntro + i * bulletBeat,
  );
  return (
    <>
      <Sequence from={0}>
        <Audio src={sfx('bass-hit')} volume={0.8} />
      </Sequence>
      <Sequence from={BLOCK_START.virada}>
        <Audio src={sfx('bass-hit')} volume={0.85} />
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

export const CursoMeiPromo = ({
  courseName = '[NOME DO CURSO]',
}: {
  courseName?: string;
}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#0f0620'}}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.gancho}>
          <GanchoScene durationInFrames={BLOCK_FRAMES.gancho} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whipPan({direction: 'left'})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.dor}>
          <DorScene durationInFrames={BLOCK_FRAMES.dor} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomGlitch({strength: 0.4})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.agitacao}>
          <AgitacaoScene durationInFrames={BLOCK_FRAMES.agitacao} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomGlitch({strength: 0.5})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.virada}>
          <ViradaScene durationInFrames={BLOCK_FRAMES.virada} courseName={courseName} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whipPan({direction: 'right'})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.prova}>
          <ProvaScene durationInFrames={BLOCK_FRAMES.prova} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={whipPan({direction: 'left'})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.oferta}>
          <OfertaScene durationInFrames={BLOCK_FRAMES.oferta} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={zoomGlitch({strength: 0.45})} timing={timing} />

        <TransitionSeries.Sequence durationInFrames={BLOCK_FRAMES.cta + CTA_FREEZE}>
          <CtaScene narrationFrames={BLOCK_FRAMES.cta} courseName={courseName} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {HAS_AUDIO ? <NarrationTrack /> : null}
      {HAS_SFX ? <SfxTrack /> : null}
      {HAS_MUSIC ? <Audio src={music()} volume={0.2} /> : null}

      <FilmGrain intensity={0.08} />
    </AbsoluteFill>
  );
};
