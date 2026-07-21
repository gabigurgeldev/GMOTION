import type {CSSProperties} from 'react';
import {AbsoluteFill} from 'remotion';
import {AnimatedLayer, type EnterPresetName} from '@gmotion/presets';

export type LowerThirdProps = {
  /** Nome principal. */
  name: string;
  /** Cargo/descrição (linha menor). */
  role?: string;
  /** Preset de entrada. Default: 'slide-in'. */
  enter?: EnterPresetName;
  enterFrames?: number;
  /** Sai automaticamente no fim da Sequence. Default: true. */
  autoExit?: boolean;
  exitFrames?: number;
  /** Cor da barra de destaque. Default: '#6366f1'. */
  accentColor?: string;
  /** Cor do fundo do cartão. Default: rgba escuro. */
  backgroundColor?: string;
  textColor?: string;
  /** Posição vertical a partir da base, em px. Default: 160. */
  bottom?: number;
  /** Posição horizontal a partir da esquerda, em px. Default: 80. */
  left?: number;
  style?: CSSProperties;
};

/**
 * Lower-third clássico: barra de destaque + nome + cargo,
 * entrada/saída automáticas pela duração da Sequence.
 *
 * @example
 * <Sequence from={30} durationInFrames={120}>
 *   <LowerThird name="Gabriel" role="Motion Designer" accentColor="#ec4899" />
 * </Sequence>
 */
export const LowerThird = ({
  name,
  role,
  enter = 'slide-in',
  enterFrames = 14,
  autoExit = true,
  exitFrames = 10,
  accentColor = '#6366f1',
  backgroundColor = 'rgba(10, 10, 20, 0.85)',
  textColor = 'white',
  bottom = 160,
  left = 80,
  style,
}: LowerThirdProps) => {
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div style={{position: 'absolute', bottom, left}}>
        <AnimatedLayer
          enter={enter}
          enterOptions={{direction: 'left'}}
          enterFrames={enterFrames}
          exit={autoExit ? 'slide-out' : undefined}
          exitOptions={{direction: 'left'}}
          exitFrames={exitFrames}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              backgroundColor,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
              ...style,
            }}
          >
            <div style={{width: 12, backgroundColor: accentColor}} />
            <div style={{padding: '24px 44px 24px 28px'}}>
              <div
                style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 52,
                  fontWeight: 800,
                  color: textColor,
                  lineHeight: 1.15,
                }}
              >
                {name}
              </div>
              {role ? (
                <div
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 32,
                    fontWeight: 500,
                    color: accentColor,
                    marginTop: 4,
                  }}
                >
                  {role}
                </div>
              ) : null}
            </div>
          </div>
        </AnimatedLayer>
      </div>
    </AbsoluteFill>
  );
};
