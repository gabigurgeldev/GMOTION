import type {CSSProperties} from 'react';
import {Sequence} from 'remotion';
import {AnimatedLayer, type EnterPresetName} from '@gmotion/presets';
import {runDelay} from './text-calc';

export type TextRun = {
  text: string;
  fontFamily?: string;
  fontWeight?: CSSProperties['fontWeight'];
  fontStyle?: CSSProperties['fontStyle'];
  fontSize?: number;
  color?: string;
  /** Preset de entrada deste run (senão usa o default do componente). */
  enter?: EnterPresetName;
  /** Delay explícito em frames (senão stagger automático). */
  delayFrames?: number;
};

export type MixedTypeTextProps = {
  runs: TextRun[];
  /** Preset default de entrada. Default: 'slide-in'. */
  enter?: EnterPresetName;
  enterOptions?: object;
  /** Duração da entrada de cada run. Default: 14. */
  enterFrames?: number;
  /** Stagger automático entre runs. Default: 6. */
  staggerFrames?: number;
  style?: CSSProperties;
};

/**
 * Frase com pesos/famílias diferentes por trecho, cada run entrando com delay
 * independente — o padrão de `EXEMPLO DE EDIT/`: "**Cortar** *seus* **Vídeos**"
 * (bold sans grande + serif itálica fina na mesma frase).
 *
 * @example
 * <MixedTypeText runs={[
 *   {text: 'Cortar', fontWeight: 900, fontSize: 130},
 *   {text: ' seus ', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 300, fontSize: 80},
 *   {text: 'Vídeos', fontWeight: 900, fontSize: 130},
 * ]} />
 */
export const MixedTypeText = ({
  runs,
  enter = 'slide-in',
  enterOptions,
  enterFrames = 14,
  staggerFrames = 6,
  style,
}: MixedTypeTextProps) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        whiteSpace: 'pre',
        ...style,
      }}
    >
      {runs.map((run, i) => (
        <Sequence key={i} from={runDelay(i, staggerFrames, run.delayFrames)} layout="none">
          <AnimatedLayer
            enter={run.enter ?? enter}
            enterOptions={enterOptions}
            enterFrames={enterFrames}
            style={{
              display: 'inline-block',
              fontFamily: run.fontFamily,
              fontWeight: run.fontWeight,
              fontStyle: run.fontStyle,
              fontSize: run.fontSize,
              color: run.color,
            }}
          >
            {run.text}
          </AnimatedLayer>
        </Sequence>
      ))}
    </div>
  );
};
