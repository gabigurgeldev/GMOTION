import {AbsoluteFill, Sequence} from 'remotion';
import {
  AnimatedStroke,
  MixedTypeText,
  PathText,
  SplitText,
} from '@gmotion/graphics';

/**
 * Demo da Fase 11 — text engine avançado:
 * 1. SplitText com stagger por caractere
 * 2. PathText curvo andando pelo path
 * 3. AnimatedStroke desenhando o contorno
 * 4. MixedTypeText — padrão "Cortar seus Vídeos" de EXEMPLO DE EDIT/
 */
export const TEXT_ENGINE_DURATION = 360; // 12s @ 30fps, 4 blocos de 90

const label = (t: string) => (
  <div style={{position: 'absolute', top: 140, width: '100%', textAlign: 'center', color: '#667', fontSize: 34, fontFamily: 'Arial'}}>
    {t}
  </div>
);

export const TextEngineShowcase = () => {
  return (
    <AbsoluteFill style={{background: '#0b0b12', fontFamily: 'Arial, sans-serif', color: 'white'}}>
      <Sequence durationInFrames={90}>
        {label('SplitText — stagger por caractere')}
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <SplitText
            text="GMOTION"
            enter="pop-in"
            staggerFrames={4}
            enterFrames={14}
            style={{fontSize: 150, fontWeight: 900, letterSpacing: 6}}
          />
          <SplitText
            text="palavra por palavra também"
            by="words"
            enter="slide-in"
            staggerFrames={8}
            style={{fontSize: 48, color: '#8899ff', marginTop: 30}}
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={90} durationInFrames={90}>
        {label('PathText — texto seguindo path curvo')}
        <AbsoluteFill style={{justifyContent: 'center'}}>
          <PathText
            text="texto curvo estilo CapCut ~~~"
            path="M 50 320 Q 500 40 950 320"
            fontSize={64}
            fill="#ffcc33"
            offsetFrom={0}
            offsetTo={18}
            durationInFrames={80}
            showPath
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={180} durationInFrames={90}>
        {label('AnimatedStroke — traço se desenhando')}
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40}}>
          <AnimatedStroke
            text="GMOTION"
            fontSize={150}
            stroke="#33ffee"
            strokeWidth={3}
            fill="#33ffee"
            durationInFrames={55}
          />
          <AnimatedStroke
            path="M 20 200 C 250 20 750 380 980 200"
            stroke="#ff3355"
            strokeWidth={6}
            durationInFrames={60}
            height={200}
          />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={270} durationInFrames={90}>
        {label('MixedTypeText — padrão EXEMPLO DE EDIT')}
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <MixedTypeText
            staggerFrames={8}
            runs={[
              {text: 'Cortar', fontWeight: 900, fontSize: 130},
              {
                text: ' seus ',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 84,
                color: '#ffcc33',
              },
              {text: 'Vídeos', fontWeight: 900, fontSize: 130},
            ]}
          />
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
