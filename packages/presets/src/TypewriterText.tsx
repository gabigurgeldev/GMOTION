import type {CSSProperties} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Quantos caracteres estão visíveis num dado frame — função pura, testável.
 */
export const typewriterVisibleChars = (params: {
  frame: number;
  fps: number;
  textLength: number;
  charsPerSecond: number;
  startFrame?: number;
}): number => {
  const {frame, fps, textLength, charsPerSecond, startFrame = 0} = params;
  const elapsed = Math.max(0, frame - startFrame);
  return Math.min(textLength, Math.floor((elapsed / fps) * charsPerSecond));
};

export type TypewriterTextProps = {
  text: string;
  /** Velocidade de digitação. Default: 20 chars/s. */
  charsPerSecond?: number;
  /** Frame (relativo à Sequence) em que começa a digitar. Default: 0. */
  startFrame?: number;
  /** Mostra cursor piscando enquanto digita. Default: true. */
  cursor?: boolean;
  style?: CSSProperties;
};

/**
 * Texto estilo máquina de escrever, sincronizado com useCurrentFrame.
 *
 * @example
 * <TypewriterText text="Olá, mundo!" charsPerSecond={25} />
 */
export const TypewriterText = ({
  text,
  charsPerSecond = 20,
  startFrame = 0,
  cursor = true,
  style,
}: TypewriterTextProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const visible = typewriterVisibleChars({
    frame,
    fps,
    textLength: text.length,
    charsPerSecond,
    startFrame,
  });

  const done = visible >= text.length;
  // Cursor pisca a 2Hz, determinístico por frame
  const cursorOn = Math.floor((frame / fps) * 2) % 2 === 0;

  return (
    <span style={style}>
      {text.slice(0, visible)}
      {cursor && !done ? (
        <span style={{opacity: cursorOn ? 1 : 0}}>|</span>
      ) : null}
    </span>
  );
};
