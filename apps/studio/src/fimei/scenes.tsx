import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {AnimatedLayer} from '@gmotion/presets';
import {AnimatedCounter, Badge, ProgressBar} from '@gmotion/graphics';
import {Glow, LightLeaks, ScreenShake, Vignette} from '@gmotion/effects';
import {COLORS} from './timing';
import {Card3D, DepthBackground, KineticText, windowProgress} from './ui';

/**
 * Cenas do FimeiPromo — uma por bloco do roteiro (docs/fimei-roteiro.md).
 * Cada cena recebe a duração real do bloco (medida do áudio quando houver).
 */

const LOGO = staticFile('logo-fimei.png');
const FONT = '"Segoe UI", Arial, sans-serif';

/* ------------------------------------------------------------------ */
/* BLOCO 1 — HOOK: "Você é MEI e não sabe se tá no lucro ou no prejuízo?" */
export const HookScene = ({durationInFrames}: {durationInFrames: number}) => {
  const frame = useCurrentFrame();
  // Zoom punch no último meio segundo
  const punch = windowProgress(frame, durationInFrames - 12, 12);
  return (
    <AbsoluteFill style={{transform: `scale(${1 + punch * 0.18})`}}>
      <DepthBackground accent={COLORS.green} seed={3} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
        <KineticText
          words={['Você', 'é', 'MEI', 'e', 'não', 'sabe', 'se', 'tá', 'no', 'LUCRO', 'ou', 'no', 'PREJUÍZO?']}
          framesPerWord={5}
          fontSize={104}
          highlight={{2: COLORS.amber, 9: COLORS.green, 12: COLORS.red}}
        />
      </AbsoluteFill>
      <div style={{position: 'absolute', top: 90, right: 70}}>
        <AnimatedLayer enter="fade-in" enterFrames={10}>
          <Img src={LOGO} style={{width: 110, borderRadius: 24, opacity: 0.9}} />
        </AnimatedLayer>
      </div>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* BLOCO 2 — AGITAÇÃO: planilha caótica -> dinheiro sumiu -> DAS vencido */
export const AgitacaoScene = ({durationInFrames}: {durationInFrames: number}) => {
  const beat = Math.floor(durationInFrames / 3);
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.red} seed={11} />

      {/* Batida 1: planilha bagunçada */}
      <Sequence durationInFrames={beat} layout="none">
        <ScreenShake intensity={7} stepsPerSecond={14} seed={4}>
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 46}}>
            <Card3D seed={2} tilt={9}>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 40,
                  color: COLORS.red,
                  lineHeight: 1.7,
                  whiteSpace: 'pre',
                }}
              >
                {'=SOMA(B2:B99)??\n-R$ 1.240,00\npessoal?? empresa??\n#REF!  #VALOR!'}
              </div>
            </Card3D>
            <KineticText
              words={['Planilha', 'bagunçada.', 'Conta', 'MISTURADA.']}
              fontSize={78}
              highlight={{1: COLORS.red, 3: COLORS.red}}
            />
          </AbsoluteFill>
        </ScreenShake>
      </Sequence>

      {/* Batida 2: dinheiro sumiu */}
      <Sequence from={beat} durationInFrames={beat} layout="none">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40}}>
          <AnimatedCounter
            from={3400}
            to={0}
            prefix="R$ "
            decimals={2}
            durationInFrames={Math.round(beat * 0.7)}
            easing="in-cubic"
            style={{fontSize: 150, color: COLORS.red}}
          />
          <KineticText
            words={['O', 'dinheiro…', 'SUMIU.']}
            fontSize={86}
            highlight={{2: COLORS.red}}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Batida 3: DAS vencido */}
      <Sequence from={beat * 2} layout="none">
        <ScreenShake intensity={14} stepsPerSecond={18} seed={9}>
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 50}}>
            <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 8}} enterFrames={10} loop="pulse" loopOptions={{intensity: 0.06, speed: 2}}>
              <Badge borderColors={[COLORS.red, '#7f1d1d']} borderSpeed={1.4} fontSize={64} textColor={COLORS.red}>
                ⚠ DAS VENCIDO
              </Badge>
            </AnimatedLayer>
            <KineticText
              words={['Você', 'só', 'lembra', 'quando', 'JÁ', 'VENCEU.']}
              fontSize={76}
              highlight={{4: COLORS.red, 5: COLORS.red}}
            />
          </AbsoluteFill>
        </ScreenShake>
      </Sequence>

      <Vignette intensity={0.7} size={48} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* BLOCO 3 — SOLUÇÃO: logo + 4 benefícios em batidas */
const Benefit = ({
  from,
  duration,
  children,
}: {
  from: number;
  duration: number;
  children: React.ReactNode;
}) => (
  <Sequence from={from} durationInFrames={duration} layout="none">
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 44}}>
      {children}
    </AbsoluteFill>
  </Sequence>
);

export const SolucaoScene = ({durationInFrames}: {durationInFrames: number}) => {
  // Intro do logo ~25% do bloco, resto dividido em 4 benefícios
  const intro = Math.round(durationInFrames * 0.24);
  const beat = Math.floor((durationInFrames - intro) / 4);
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.green} seed={21} />

      {/* Intro: "Respira. Conhece o FiMEI." */}
      <Sequence durationInFrames={intro} layout="none">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 52}}>
          <Glow intensity={30} color="rgba(16,185,129,0.75)">
            <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
              <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 9, stiffness: 140}} enterFrames={14} loop="float" loopOptions={{amplitude: 10}}>
                <Img src={LOGO} style={{width: 380, borderRadius: 80}} />
              </AnimatedLayer>
            </AbsoluteFill>
          </Glow>
          <div style={{position: 'absolute', bottom: 420}}>
            <KineticText words={['Respira.', 'Conhece', 'o', 'FiMEI.']} startFrame={4} fontSize={82} highlight={{3: COLORS.green}} />
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Benefício 1: lançamentos */}
      <Benefit from={intro} duration={beat}>
        <Card3D seed={5}>
          <AnimatedCounter
            to={4750}
            prefix="R$ "
            decimals={2}
            durationInFrames={Math.round(beat * 0.75)}
            style={{fontSize: 110, color: COLORS.green}}
          />
        </Card3D>
        <KineticText words={['Receita', 'e', 'despesa', 'em', 'SEGUNDOS.']} fontSize={70} highlight={{4: COLORS.green}} />
      </Benefit>

      {/* Benefício 2: separa pessoal/empresa */}
      <Benefit from={intro + beat} duration={beat}>
        <div style={{display: 'flex', gap: 40}}>
          <AnimatedLayer enter="slide-in" enterOptions={{direction: 'left', distance: 260}} enterFrames={12}>
            <Card3D seed={6} style={{padding: '34px 40px'}}>
              <span style={{fontFamily: FONT, fontSize: 44, fontWeight: 800, color: COLORS.muted}}>🏠 Pessoal</span>
            </Card3D>
          </AnimatedLayer>
          <AnimatedLayer enter="slide-in" enterOptions={{direction: 'right', distance: 260}} enterFrames={12}>
            <Card3D seed={7} style={{padding: '34px 40px', borderColor: 'rgba(16,185,129,0.5)'}}>
              <span style={{fontFamily: FONT, fontSize: 44, fontWeight: 800, color: COLORS.green}}>💼 Empresa</span>
            </Card3D>
          </AnimatedLayer>
        </div>
        <KineticText words={['Teu', 'negócio', 'SEPARADO', 'do', 'teu', 'bolso.']} fontSize={70} highlight={{2: COLORS.green}} />
      </Benefit>

      {/* Benefício 3: DAS em dia */}
      <Benefit from={intro + beat * 2} duration={beat}>
        <AnimatedLayer enter="pop-in" enterFrames={10} loop="glow-pulse" loopOptions={{color: 'rgba(16,185,129,0.8)', intensity: 30}}>
          <Badge borderColors={[COLORS.green, COLORS.greenDark]} borderSpeed={0.9} fontSize={62} textColor={COLORS.green}>
            🔔 DAS em dia ✓
          </Badge>
        </AnimatedLayer>
        <KineticText words={['Te', 'avisa', 'ANTES', 'de', 'vencer.', 'Sempre.']} fontSize={70} highlight={{2: COLORS.green}} />
      </Benefit>

      {/* Benefício 4: lucro real */}
      <Benefit from={intro + beat * 3} duration={durationInFrames - intro - beat * 3}>
        <ProgressBar target={0.82} durationInFrames={Math.round(beat * 0.7)} gradient={[COLORS.greenDark, COLORS.green]} width={640} height={30} />
        <KineticText words={['Teu', 'LUCRO', 'REAL,', 'na', 'hora.']} fontSize={82} highlight={{1: COLORS.green, 2: COLORS.green}} />
      </Benefit>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* BLOCO 4 — PROVA: não é planilha, não é ERP; é pra MEI */
const Strike = ({label, delay}: {label: string; delay: number}) => {
  const frame = useCurrentFrame();
  const p = windowProgress(frame, delay, 10);
  return (
    <div style={{position: 'relative', display: 'inline-block'}}>
      <span style={{fontFamily: FONT, fontSize: 84, fontWeight: 900, color: COLORS.muted}}>
        {label}
      </span>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: '52%',
          width: `${p * 105}%`,
          height: 10,
          background: COLORS.red,
          borderRadius: 6,
          transform: 'rotate(-4deg)',
        }}
      />
    </div>
  );
};

export const ProvaScene = ({durationInFrames}: {durationInFrames: number}) => {
  const half = Math.floor(durationInFrames / 2);
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.amber} seed={31} />

      <Sequence durationInFrames={half} layout="none">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 60}}>
          <Strike label="PLANILHA" delay={4} />
          <Strike label="SISTEMA DE EMPRESÃO" delay={14} />
        </AbsoluteFill>
      </Sequence>

      <Sequence from={half} layout="none">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 56}}>
          <KineticText
            words={['FEITO', 'PRA', 'QUEM', 'TOCA', 'SOZINHO:', 'VOCÊ.']}
            fontSize={96}
            highlight={{0: COLORS.green, 5: COLORS.green}}
          />
          <AnimatedLayer enter="fade-in" enterFrames={10} loop="float" loopOptions={{amplitude: 14, speed: 0.5}}>
            <Img src={LOGO} style={{width: 240, borderRadius: 52, boxShadow: '0 40px 90px rgba(0,0,0,0.6)'}} />
          </AnimatedLayer>
        </AbsoluteFill>
      </Sequence>

      <LightLeaks intensity={0.55} seed={13} />
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* BLOCO 5 — CTA + freeze final */
export const CtaScene = ({narrationFrames}: {narrationFrames: number}) => {
  const frame = useCurrentFrame();
  const inNarration = frame < narrationFrames;
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.green} seed={41} />
      <ScreenShake intensity={inNarration ? 6 : 0} stepsPerSecond={12} seed={17}>
        <Glow intensity={24} color="rgba(16,185,129,0.6)">
          <AbsoluteFill
            style={{
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 70,
            }}
          >
            <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 9}} enterFrames={12} loop="float" loopOptions={{amplitude: 8}}>
              <Img src={LOGO} style={{width: 300, borderRadius: 64}} />
            </AnimatedLayer>
            <KineticText
              words={['Organiza', 'teu', 'MEI', 'HOJE.']}
              fontSize={88}
              highlight={{2: COLORS.amber, 3: COLORS.green}}
            />
            <AnimatedLayer enter="pop-in" enterFrames={12} loop="pulse" loopOptions={{intensity: 0.045, speed: 1.2}}>
              <Badge borderColors={[COLORS.green, COLORS.amber]} borderSpeed={1.1} fontSize={40}>
                👆 COMEÇAR AGORA — leva 2 min
              </Badge>
            </AnimatedLayer>
          </AbsoluteFill>
        </Glow>
      </ScreenShake>
      <Vignette intensity={0.55} />
    </AbsoluteFill>
  );
};
