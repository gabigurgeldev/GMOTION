import {AbsoluteFill} from 'remotion';
import type {CapcutTimeline} from '../timeline/schema';
import {CapcutClip} from './CapcutClip';

/**
 * Compilador: CapcutTimeline → JSX Remotion. Empilha as tracks por `renderIndex`
 * (menor = fundo), cada track renderiza seus clips na linha do tempo absoluta.
 */
export const capcutToComposition = (timeline: CapcutTimeline) => {
  const tracks = [...timeline.tracks].sort((a, b) => a.renderIndex - b.renderIndex);
  return (
    <AbsoluteFill style={{backgroundColor: 'black'}}>
      {tracks.map((track) => (
        <AbsoluteFill key={track.id}>
          {track.clips.map((clip) => (
            <CapcutClip key={clip.id} clip={clip} />
          ))}
        </AbsoluteFill>
      ))}
    </AbsoluteFill>
  );
};

/** Componente pronto para uma <Composition>. */
export const CapcutComposition = ({timeline}: {timeline: CapcutTimeline}) => (
  <>{capcutToComposition(timeline)}</>
);
