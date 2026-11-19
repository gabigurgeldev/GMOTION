import type {CSSProperties} from 'react';
import {Sequence} from 'remotion';
import {AnimatedLayer, type EnterPresetName} from '@gmotion/presets';
import {splitUnits, staggerDelay} from './text-calc';

export type SplitTextProps = {
  text: string;
  /** Unidade do split. Default: 'chars'. */
  by?: 'chars' | 'words';
  /** Preset de entrada de cada unidade. Default: 'fade-in'. */
  enter?: EnterPresetName;
  enterOptions?: object;
  /** Duração da entrada de cada unidade. Default: 12. */
  enterFrames?: number;
  /** Frames entre o início de uma unidade e a próxima. Default: 3. */
  staggerFrames?: number;
  /** Estilo do container (fonte, cor, tamanho...). */
  style?: CSSProperties;
  /** Estilo extra por unidade. */
  unitStyle?: CSSProperties;
};

/**
 * Quebra o texto em caracteres/palavras — cada unidade é uma <AnimatedLayer>
 * independente com delay escalonado (stagger), reusando os presets existentes.
 *
 * @example
 * <SplitText text="GMOTION" enter="pop-in" staggerFrames={4} style={{fontSize: 120}} />
 */
export const SplitText = ({
  text,
  by = 'chars',
  enter = 'fade-in',
  enterOptions,
  enterFrames = 12,
  staggerFrames = 3,
  style,
  unitStyle,
}: SplitTextProps) => {
  const units = splitUnits(text, by);
  return (
    <div style={{display: 'inline-block', whiteSpace: 'pre-wrap', ...style}}>
      {units.map((unit, i) =>
        unit.isSpace ? (
          <span key={i}>{unit.text}</span>
        ) : (
          <Sequence
            key={i}
            from={staggerDelay(unit.animIndex, staggerFrames)}
            layout="none"
          >
            <AnimatedLayer
              enter={enter}
              enterOptions={enterOptions}
              enterFrames={enterFrames}
              style={{display: 'inline-block', ...unitStyle}}
            >
              {unit.text}
            </AnimatedLayer>
          </Sequence>
        ),
      )}
    </div>
  );
};
