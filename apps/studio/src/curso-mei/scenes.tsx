import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {AnimatedLayer} from '@gmotion/presets';
import {AnimatedCounter, AnimatedStroke, Badge, ProgressBar} from '@gmotion/graphics';
import {Glow, LightLeaks, ScreenShake, Vignette} from '@gmotion/effects';
import {COLORS, FONT} from './timing';
import {
  BrasilMap,
  Card3D,
  ChatCard,
  CheckBullet,
  CofrinhoIcon,
  DepthBackground,
  IconCrowd,
  KineticText,
  ModuleCard,
  SourceNote,
  useLayout,
  windowProgress,
} from './ui';

/**
 * Cenas do CursoMeiPromo — uma por bloco do roteiro (briefing do curso MEI).
 * Cada cena recebe a duração real do bloco (medida do áudio quando houver).
 * Dados reais citados como texto; sem logos/rostos de terceiros (restrição).
 */

/* ================================================================== */
/* CENA 1 — GANCHO/PROBLEMA: 78% das novas empresas são MEIs; 570k caíram */
export const GanchoScene = ({durationInFrames}: {durationInFrames: number}) => {
  const frame = useCurrentFrame();
  const {scale} = useLayout();
  const punch = windowProgress(frame, durationInFrames - 12, 12);
  return (
    <AbsoluteFill style={{transform: `scale(${1 + punch * 0.14})`}}>
      <DepthBackground accent={COLORS.violet} seed={3} />
      <IconCrowd fallStart={Math.round(durationInFrames * 0.45)} fallDuration={40} />
      <AbsoluteFill
        style={{justifyContent: 'center', alignItems: 'center', gap: 30 * scale}}
      >
        <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 9}} enterFrames={12}>
          <AnimatedCounter
            to={78}
            suffix="%"
            durationInFrames={40}
            style={{fontSize: 230 * scale, color: COLORS.lime, fontFamily: FONT}}
          />
        </AnimatedLayer>
        <KineticText
          words={['das', 'novas', 'empresas', 'abertas', 'em', '2026', 'são', 'MEIs.']}
          startFrame={10}
          fontSize={70 * scale}
          highlight={{7: COLORS.gold}}
        />
        <div style={{marginTop: 20 * scale}}>
          <KineticText
            words={['Mas', '570', 'mil', 'foram', 'DESENQUADRADOS', 'em', '2024.']}
            startFrame={28}
            fontSize={52 * scale}
            highlight={{1: COLORS.red, 4: COLORS.red}}
          />
        </div>
      </AbsoluteFill>
      <SourceNote>Fonte: Sebrae / Receita Federal (2024)</SourceNote>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* CENA 2 — DOR: quanto dá pra faturar sem perder o MEI? teto quase estoura */
export const DorScene = ({durationInFrames}: {durationInFrames: number}) => {
  const {scale, isWide} = useLayout();
  const half = Math.floor(durationInFrames / 2);
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.amber} seed={11} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 50 * scale}}>
        <KineticText
          words={['Sabe', 'quanto', 'pode', 'faturar', 'sem', 'PERDER', 'o', 'MEI?']}
          fontSize={68 * scale}
          highlight={{5: COLORS.amber, 7: COLORS.gold}}
        />

        <div
          style={{
            display: 'flex',
            flexDirection: isWide ? 'row' : 'column',
            alignItems: 'center',
            gap: 30 * scale,
          }}
        >
          <Card3D seed={4} style={{padding: '28px 44px'}}>
            <AnimatedCounter
              to={81000}
              prefix="R$ "
              durationInFrames={Math.round(half * 0.7)}
              style={{fontSize: 120 * scale, color: COLORS.lime, fontFamily: FONT}}
            />
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 34 * scale, color: COLORS.muted, textAlign: 'center'}}>
              por ano
            </div>
          </Card3D>
          <Card3D seed={6} style={{padding: '28px 44px'}}>
            <AnimatedCounter
              to={6750}
              prefix="R$ "
              startFrame={12}
              durationInFrames={Math.round(half * 0.7)}
              style={{fontSize: 120 * scale, color: COLORS.white, fontFamily: FONT}}
            />
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 34 * scale, color: COLORS.muted, textAlign: 'center'}}>
              por mês (média)
            </div>
          </Card3D>
        </div>

        {/* Barra de faturamento enchendo até quase estourar o teto de tolerância */}
        <Sequence from={half} layout="none">
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 24 * scale}}>
            <div style={{position: 'relative'}}>
              <ProgressBar
                target={0.95}
                durationInFrames={Math.round(half * 0.8)}
                gradient={[COLORS.lime, COLORS.red]}
                width={760 * scale}
                height={44 * scale}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: -46 * scale,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 30 * scale,
                  color: COLORS.red,
                }}
              >
                ⚠ TETO R$ 97.200
              </div>
            </div>
            <KineticText
              words={['20%', 'de', 'tolerância', 'e', 'você', 'está', 'FORA.']}
              fontSize={52 * scale}
              highlight={{6: COLORS.red}}
            />
          </AbsoluteFill>
        </Sequence>
      </AbsoluteFill>
      <SourceNote>Fonte: Portal do Empreendedor / Receita Federal</SourceNote>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* CENA 3 — AGITAÇÃO: DAS, multa, juros; cofrinho vazando */
export const AgitacaoScene = ({durationInFrames}: {durationInFrames: number}) => {
  const {scale} = useLayout();
  const half = Math.floor(durationInFrames / 2);
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.red} seed={21} />

      <Sequence durationInFrames={half} layout="none">
        <ScreenShake intensity={8} stepsPerSecond={14} seed={4}>
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40 * scale}}>
            <div style={{display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 * scale}}>
              {['DAS NÃO PAGO', 'MULTA', 'JUROS'].map((t, i) => (
                <AnimatedLayer key={t} enter="pop-in" enterFrames={9 + i * 4} loop="pulse" loopOptions={{intensity: 0.05, speed: 2}}>
                  <Badge borderColors={[COLORS.red, '#7f1d1d']} borderSpeed={1.4} fontSize={44 * scale} textColor={COLORS.red}>
                    ⚠ {t}
                  </Badge>
                </AnimatedLayer>
              ))}
            </div>
            <KineticText
              words={['E', 'o', 'dinheiro', 'da', 'empresa', 'MISTURADO', 'com', 'o', 'seu.']}
              startFrame={14}
              fontSize={58 * scale}
              highlight={{5: COLORS.red}}
            />
          </AbsoluteFill>
        </ScreenShake>
      </Sequence>

      <Sequence from={half} layout="none">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 30 * scale}}>
          <CofrinhoIcon size={300 * scale} />
          <AnimatedCounter
            from={82.05}
            to={87.05}
            prefix="R$ "
            suffix=" /mês"
            decimals={2}
            durationInFrames={Math.round(half * 0.7)}
            style={{fontSize: 110 * scale, color: COLORS.gold, fontFamily: FONT}}
          />
          <KineticText
            words={['Pequeno,', 'mas', 'SOME', 'rápido', 'sem', 'controle.']}
            fontSize={52 * scale}
            highlight={{2: COLORS.gold}}
          />
        </AbsoluteFill>
      </Sequence>

      <Vignette intensity={0.7} size={48} />
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* CENA 4 — VIRADA/SOLUÇÃO: caos -> dashboard; módulos do curso */
const CHAOS_PATH = 'M 20 200 L 120 90 L 200 330 L 300 60 L 400 350 L 500 120 L 600 300 L 700 80 L 780 270';
const CLEAN_PATH = 'M 20 350 C 200 330 360 230 540 140 S 740 40 780 26';

export const ViradaScene = ({
  durationInFrames,
  courseName,
}: {
  durationInFrames: number;
  courseName: string;
}) => {
  const {scale} = useLayout();
  const intro = Math.round(durationInFrames * 0.42);
  const modules = [
    'Separação PF x PJ',
    'Fluxo de caixa simples',
    'Precificação correta',
    'Não estourar o limite do MEI',
    'Crescer para ME',
  ];
  const beat = Math.floor((durationInFrames - intro) / modules.length);
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.lime} seed={31} />

      {/* Intro: gráfico caótico vermelho -> linha limpa lime */}
      <Sequence durationInFrames={intro} layout="none">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40 * scale}}>
          <div style={{width: 820 * scale, height: 420 * scale, position: 'relative'}}>
            <div style={{position: 'absolute', inset: 0}}>
              <ScreenShake intensity={6} stepsPerSecond={16} seed={2}>
                <AnimatedStroke
                  path={CHAOS_PATH}
                  viewBox="0 0 800 400"
                  stroke={COLORS.red}
                  strokeWidth={7}
                  durationInFrames={Math.round(intro * 0.4)}
                />
              </ScreenShake>
            </div>
            <div style={{position: 'absolute', inset: 0}}>
              <AnimatedStroke
                path={CLEAN_PATH}
                viewBox="0 0 800 400"
                stroke={COLORS.lime}
                strokeWidth={9}
                durationInFrames={Math.round(intro * 0.45)}
                startFrame={Math.round(intro * 0.4)}
              />
            </div>
          </div>
          <KineticText
            words={['O', 'curso', courseName, 'ORGANIZA', 'seu', 'MEI.']}
            fontSize={62 * scale}
            highlight={{2: COLORS.gold, 3: COLORS.lime}}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Módulos entrando em cards */}
      {modules.map((label, i) => (
        <Sequence key={label} from={intro + i * beat} layout="none">
          <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 20 * scale, width: 760 * scale}}>
              {modules.slice(0, i + 1).map((m, j) => (
                <ModuleCard key={m} label={m} delay={0} index={j} />
              ))}
            </div>
          </AbsoluteFill>
        </Sequence>
      ))}

      <Glow intensity={20} color="rgba(163,230,53,0.4)">
        <AbsoluteFill />
      </Glow>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* CENA 5 — PROVA/AUTORIDADE: 11,5 mi de MEIs, mapa, depoimentos */
export const ProvaScene = ({durationInFrames}: {durationInFrames: number}) => {
  const {scale, isWide} = useLayout();
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.violet} seed={41} />
      <AbsoluteFill
        style={{
          flexDirection: isWide ? 'row' : 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 24 * scale,
          padding: 40,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 * scale}}>
          <AnimatedCounter
            to={11.5}
            decimals={1}
            durationInFrames={45}
            style={{fontSize: 150 * scale, color: COLORS.lime, fontFamily: FONT}}
          />
          <KineticText words={['milhões', 'de', 'MEIs', 'ATIVOS.']} startFrame={12} fontSize={52 * scale} highlight={{3: COLORS.gold}} />
          <BrasilMap size={520 * scale} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', gap: 22 * scale}}>
          <ChatCard text="Parei de misturar as contas e finalmente sei meu lucro real." seed={1} delay={20} />
          <ChatCard text="Nunca mais perdi o prazo do DAS. Valeu demais!" seed={5} delay={38} />
        </div>
      </AbsoluteFill>
      <SourceNote>Fonte: Sebrae — a formalização é a porta de entrada nº1 do empreendedorismo</SourceNote>
      <Glow intensity={18} color="rgba(124,58,237,0.4)">
        <AbsoluteFill />
      </Glow>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* CENA 6 — OFERTA: 100% online + bullets */
export const OfertaScene = ({durationInFrames}: {durationInFrames: number}) => {
  const {scale} = useLayout();
  const bullets = [
    'Planilha de fluxo de caixa inclusa',
    'Calculadora de limite do MEI',
    'Suporte pra dúvidas do DAS',
    'Certificado de conclusão',
  ];
  const start = Math.round(durationInFrames * 0.28);
  const step = Math.floor((durationInFrames - start) / (bullets.length + 1));
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.lime} seed={51} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 50 * scale}}>
        <KineticText
          words={['100%', 'online.', 'Sem', 'ECONOMÊS.']}
          fontSize={72 * scale}
          highlight={{0: COLORS.lime, 3: COLORS.gold}}
        />
        <div style={{display: 'flex', flexDirection: 'column', gap: 30 * scale, alignItems: 'flex-start'}}>
          {bullets.map((b, i) => (
            <CheckBullet key={b} label={b} delay={start + i * step} />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ================================================================== */
/* CENA 7 — CTA FINAL + freeze */
export const CtaScene = ({
  narrationFrames,
  courseName,
}: {
  narrationFrames: number;
  courseName: string;
}) => {
  const frame = useCurrentFrame();
  const {scale} = useLayout();
  const inNarration = frame < narrationFrames;
  return (
    <AbsoluteFill>
      <DepthBackground accent={COLORS.violet} seed={61} />
      <ScreenShake intensity={inNarration ? 5 : 0} stepsPerSecond={12} seed={17}>
        <Glow intensity={26} color="rgba(163,230,53,0.55)">
          <AbsoluteFill
            style={{
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 56 * scale,
            }}
          >
            <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 8}} enterFrames={12} loop="pulse" loopOptions={{intensity: 0.05, speed: 1.4}}>
              <KineticText words={['GARANTA', 'SUA', 'VAGA']} fontSize={110 * scale} highlight={{2: COLORS.lime}} />
            </AnimatedLayer>

            <AnimatedLayer enter="pop-in" enterFrames={12} loop="glow-pulse" loopOptions={{color: 'rgba(163,230,53,0.8)', intensity: 30}}>
              <Badge borderColors={[COLORS.lime, COLORS.gold]} borderSpeed={1.1} fontSize={46 * scale}>
                👆 Inscreva-se agora
              </Badge>
            </AnimatedLayer>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 22 * scale,
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 40 * scale,
                color: COLORS.white,
              }}
            >
              <span style={{color: COLORS.gold}}>{courseName}</span>
              <span
                style={{
                  border: `2px solid ${COLORS.lime}`,
                  borderRadius: 999,
                  padding: '8px 22px',
                  color: COLORS.lime,
                  fontSize: 30 * scale,
                }}
              >
                Feito para MEI
              </span>
            </div>
          </AbsoluteFill>
        </Glow>
      </ScreenShake>
      <LightLeaks intensity={0.4} seed={13} />
      <Vignette intensity={0.5} />
    </AbsoluteFill>
  );
};
