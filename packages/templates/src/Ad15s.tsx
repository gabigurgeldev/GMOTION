import {AbsoluteFill, Img, Sequence} from 'remotion';
import {AnimatedLayer, TypewriterText} from '@gmotion/presets';
import {AnimatedCounter, Badge, ProgressBar} from '@gmotion/graphics';
import {FilmGrain, LightLeaks, ScreenShake, Vignette} from '@gmotion/effects';

export type Ad15sProps = {
  productName: string;
  /** Preço final. */
  price: number;
  /** Preço "de" riscado (opcional). */
  oldPrice?: number;
  /** Texto do call-to-action. Default: 'COMPRE AGORA'. */
  cta?: string;
  /** Chamada de abertura. Default: 'CHEGOU'. */
  hook?: string;
  /** Imagem do produto (opcional). */
  productImage?: string;
  /** Cor da marca. Default: '#6366f1'. */
  brandColor?: string;
  /** Cor secundária. Default: '#ec4899'. */
  secondaryColor?: string;
};

/** 15s a 30fps. */
export const AD_15S_DURATION = 450;

const HOOK_END = 90;
const PRODUCT_END = 330;

/**
 * Template "Anúncio 15s": hook (0-3s) -> produto + preço (3-11s) -> CTA (11-15s).
 * Troque texto/preço/imagem e está pronto.
 *
 * @example
 * <Ad15s productName="Fone XYZ" price={199.9} oldPrice={349.9} cta="SÓ HOJE" />
 */
export const Ad15s = ({
  productName,
  price,
  oldPrice,
  cta = 'COMPRE AGORA',
  hook = 'CHEGOU',
  productImage,
  brandColor = '#6366f1',
  secondaryColor = '#ec4899',
}: Ad15sProps) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#08080f'}}>
      {/* Cena 1: hook */}
      <Sequence durationInFrames={HOOK_END}>
        <AbsoluteFill
          style={{
            background: `linear-gradient(160deg, ${brandColor}33, #08080f 70%)`,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <AnimatedLayer
            enter="zoom-in-bounce"
            enterOptions={{damping: 8}}
            enterFrames={15}
            exit="zoom-out"
            exitFrames={12}
          >
            <div
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: 160,
                fontWeight: 900,
                color: 'white',
                textTransform: 'uppercase',
              }}
            >
              {hook}
            </div>
          </AnimatedLayer>
        </AbsoluteFill>
      </Sequence>

      {/* Cena 2: produto + preço */}
      <Sequence from={HOOK_END} durationInFrames={PRODUCT_END - HOOK_END}>
        <AbsoluteFill
          style={{justifyContent: 'center', alignItems: 'center', gap: 50}}
        >
          {productImage ? (
            <AnimatedLayer enter="pop-in" enterFrames={14} loop="float">
              <Img
                src={productImage}
                style={{
                  width: 620,
                  height: 620,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))',
                }}
              />
            </AnimatedLayer>
          ) : (
            <AnimatedLayer enter="pop-in" enterFrames={14} loop="float">
              <div
                style={{
                  width: 540,
                  height: 540,
                  borderRadius: 60,
                  background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})`,
                  boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
                }}
              />
            </AnimatedLayer>
          )}

          <AnimatedLayer enter="slide-in" enterOptions={{direction: 'up'}} enterFrames={14}>
            <div
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: 76,
                fontWeight: 900,
                color: 'white',
                textAlign: 'center',
                padding: '0 60px',
              }}
            >
              {productName}
            </div>
          </AnimatedLayer>

          <div style={{display: 'flex', alignItems: 'baseline', gap: 30}}>
            {oldPrice ? (
              <AnimatedLayer enter="fade-in" enterFrames={20}>
                <span
                  style={{
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 54,
                    fontWeight: 700,
                    color: '#9a9ab8',
                    textDecoration: 'line-through',
                  }}
                >
                  R$ {oldPrice.toFixed(2).replace('.', ',')}
                </span>
              </AnimatedLayer>
            ) : null}
            <AnimatedCounter
              to={price}
              decimals={2}
              prefix="R$ "
              durationInFrames={40}
              startFrame={15}
              style={{fontSize: 120, color: '#4ade80'}}
            />
          </div>

          <ProgressBar
            target={0.9}
            durationInFrames={60}
            startFrame={40}
            gradient={[brandColor, secondaryColor]}
            width={560}
            height={20}
          />
          <span
            style={{
              fontFamily: 'Arial, sans-serif',
              fontSize: 34,
              color: '#9a9ab8',
              marginTop: -30,
            }}
          >
            90% já vendido
          </span>
        </AbsoluteFill>
      </Sequence>

      {/* Cena 3: CTA */}
      <Sequence from={PRODUCT_END}>
        <ScreenShake intensity={22} decayFrames={18}>
          <AbsoluteFill
            style={{
              background: `linear-gradient(160deg, ${secondaryColor}44, #08080f 65%)`,
              justifyContent: 'center',
              alignItems: 'center',
              gap: 60,
            }}
          >
            <AnimatedLayer enter="zoom-in-bounce" enterOptions={{damping: 8}} enterFrames={12}>
              <Badge
                borderColors={[brandColor, secondaryColor]}
                borderSpeed={1}
                fontSize={64}
              >
                {cta}
              </Badge>
            </AnimatedLayer>
            <TypewriterText
              text="Link na bio ↑"
              charsPerSecond={20}
              startFrame={20}
              style={{
                fontFamily: 'Arial, sans-serif',
                fontSize: 54,
                fontWeight: 700,
                color: 'white',
              }}
            />
          </AbsoluteFill>
        </ScreenShake>
      </Sequence>

      <LightLeaks intensity={0.5} />
      <FilmGrain intensity={0.1} />
      <Vignette intensity={0.5} />
    </AbsoluteFill>
  );
};
