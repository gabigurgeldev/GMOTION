import type {ReactNode} from 'react';
import {useId} from 'react';
import {AbsoluteFill} from 'remotion';

export type ChromaticAberrationProps = {
  children: ReactNode;
  /** Offset dos canais R/B em px. Default: 4. */
  intensity?: number;
  /** Ângulo do deslocamento em graus (0 = horizontal). Default: 0. */
  angle?: number;
};

/**
 * Aberração cromática estática via SVG filter: canal R desloca para um lado,
 * B para o oposto, G fica. Para versão animada/glitch use <RgbShift>.
 *
 * @example
 * <ChromaticAberration intensity={5}>
 *   <MinhaCena />
 * </ChromaticAberration>
 */
export const ChromaticAberration = ({
  children,
  intensity = 4,
  angle = 0,
}: ChromaticAberrationProps) => {
  const id = useId();
  const rad = (angle * Math.PI) / 180;
  const dx = Math.cos(rad) * intensity;
  const dy = Math.sin(rad) * intensity;

  return (
    <AbsoluteFill>
      <svg width="0" height="0" style={{position: 'absolute'}}>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="red"
          />
          <feOffset in="red" dx={dx} dy={dy} result="redOff" />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
            result="green"
          />
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
            result="blue"
          />
          <feOffset in="blue" dx={-dx} dy={-dy} result="blueOff" />
          <feBlend in="redOff" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blueOff" mode="screen" />
        </filter>
      </svg>
      <AbsoluteFill style={{filter: `url(#${id})`}}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};
