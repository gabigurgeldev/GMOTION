import {useEnterExit, lerp} from '@gmotion/core';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Composição de exemplo da Fase 1: valida o pipeline
 * monorepo -> @gmotion/core -> Remotion Studio.
 */
export const HelloGmotion = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrada/saída via helper do core
  const {combined} = useEnterExit({enterFrames: 20, exitFrames: 15});

  // Pop-in com spring do Remotion
  const scale = spring({
    frame,
    fps,
    config: {damping: 12, stiffness: 120},
  });

  // Fundo desliza de tom conforme o tempo
  const hue = interpolate(frame, [0, 120], [230, 280]);
  const glow = lerp(20, 60, combined);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `hsl(${hue}, 70%, 12%)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <h1
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 140,
          fontWeight: 900,
          color: 'white',
          opacity: combined,
          transform: `scale(${scale})`,
          textShadow: `0 0 ${glow}px hsl(${hue + 60}, 90%, 60%)`,
          margin: 0,
        }}
      >
        Gmotion
      </h1>
    </AbsoluteFill>
  );
};
