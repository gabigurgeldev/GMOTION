import {AbsoluteFill, Sequence, staticFile} from 'remotion';
import {MixedTypeText} from '@gmotion/graphics';
import {
  CutoutSubject,
  DashedPath,
  DuotoneImage,
  FlatShadow,
  FxBadge,
  GlowBeam,
  MockCursor,
  SolidColorBackdrop,
  UIMockupOverlay,
} from '@gmotion/editorial-style';

/**
 * Demo da Fase 18 — recriação do trecho de EXEMPLO DE EDIT/ (~9s):
 * 1. branco: "Cortar seus Vídeos" tipografia mista + DashedPath
 * 2. CORTE SECO pra vermelho: cutout em duotone + estrela FlatShadow
 * 3. CORTE SECO pra preto: UI mockup (cursor até o botão FX) + GlowBeam
 */
export const EDITORIAL_DURATION = 270;

const Star = ({size = 220, color = '#ffd400'}: {size?: number; color?: string}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <path
      d="M 50 5 L 61 35 L 95 35 L 68 55 L 78 90 L 50 70 L 22 90 L 32 55 L 5 35 L 39 35 Z"
      fill={color}
    />
  </svg>
);

export const EditorialShowcase = () => {
  return (
    <AbsoluteFill style={{fontFamily: 'Arial, sans-serif'}}>
      {/* 1 — branco, tipografia mista */}
      <Sequence durationInFrames={90}>
        <SolidColorBackdrop color="#f4f1ea">
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <MixedTypeText
              staggerFrames={8}
              runs={[
                {text: 'Cortar', fontWeight: 900, fontSize: 150, color: '#111'},
                {
                  text: ' seus ',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 92,
                  color: '#c22417',
                },
                {text: 'Vídeos', fontWeight: 900, fontSize: 150, color: '#111'},
              ]}
              style={{maxWidth: 900, justifyContent: 'center'}}
            />
          </AbsoluteFill>
          <div style={{position: 'absolute', bottom: 320, left: 0, right: 0}}>
            <DashedPath
              path="M 20 200 C 300 40 780 360 1060 120"
              stroke="#111"
              strokeWidth={7}
              speed={90}
            />
          </div>
        </SolidColorBackdrop>
      </Sequence>

      {/* 2 — CORTE SECO: vermelho + cutout duotone + estrela flat shadow */}
      <Sequence from={90} durationInFrames={90}>
        <SolidColorBackdrop color="#e2231a">
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <DuotoneImage colorDark="#1a0505" colorLight="#ffe8dd" dotSize={9} angle={25}>
              <CutoutSubject
                src={staticFile('asset-demo/emoji-bravo.webm')}
                loopDurationInFrames={60}
                style={{width: 760}}
              />
            </DuotoneImage>
          </AbsoluteFill>
          <div style={{position: 'absolute', top: 260, right: 120}}>
            <FlatShadow offsetX={14} offsetY={14} color="#7a0f08">
              <Star />
            </FlatShadow>
          </div>
        </SolidColorBackdrop>
      </Sequence>

      {/* 3 — CORTE SECO: preto + UI mockup + glow beam */}
      <Sequence from={180} durationInFrames={90}>
        <SolidColorBackdrop color="#0c0c0e">
          <GlowBeam
            color="#7df9ff"
            thickness={16}
            style={{left: 180, top: 0, height: '100%', opacity: 0.85}}
          />
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div style={{color: '#fff', fontWeight: 900, fontSize: 90, marginBottom: 60}}>
              aplica o efeito
            </div>
            <FxBadge label="FX" style={{fontSize: 44, padding: '20px 40px'}} />
          </AbsoluteFill>
          <UIMockupOverlay>
            <MockCursor
              from={{x: 200, y: 1500}}
              to={{x: 530, y: 1075}}
              startFrame={195 - 180}
              durationInFrames={35}
            />
          </UIMockupOverlay>
        </SolidColorBackdrop>
      </Sequence>
    </AbsoluteFill>
  );
};
