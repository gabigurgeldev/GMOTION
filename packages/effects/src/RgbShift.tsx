import type {ReactNode} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {rgbShiftAt} from './calc';
import {ChromaticAberration} from './ChromaticAberration';

export type RgbShiftProps = {
  children: ReactNode;
  /** Offset máximo em px. Default: 6. */
  intensity?: number;
  /** Trocas de offset por segundo. Default: 12. */
  stepsPerSecond?: number;
  seed?: number;
  /** Ângulo do deslocamento em graus. Default: 0. */
  angle?: number;
};

/**
 * Aberração cromática animada (glitch): offset flickando com ruído
 * determinístico — a versão "viva" do <ChromaticAberration>.
 *
 * @example
 * <RgbShift intensity={8}>
 *   <MinhaCena />
 * </RgbShift>
 */
export const RgbShift = ({
  children,
  intensity = 6,
  stepsPerSecond = 12,
  seed = 5,
  angle = 0,
}: RgbShiftProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const offset = rgbShiftAt({frame, fps, intensity, stepsPerSecond, seed});

  return (
    <ChromaticAberration intensity={offset} angle={angle}>
      {children}
    </ChromaticAberration>
  );
};
