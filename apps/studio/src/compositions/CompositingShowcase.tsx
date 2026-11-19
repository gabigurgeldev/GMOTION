import {AbsoluteFill, interpolate, Loop, OffthreadVideo, staticFile, useCurrentFrame} from 'remotion';
import {AdjustmentLayer, BlendLayer, LayerGroup, MaskLayer} from '@gmotion/compositing';
import {seededNoise} from '@gmotion/core';

/**
 * Demo da Fase 12 — compositing:
 * camada 1: vídeo de fundo (bg-grid.mp4 do asset-demo)
 * camada 2: gradiente diagonal
 * camada 3: partículas determinísticas em blend "screen"
 * por cima de tudo: <AdjustmentLayer> de color grade (warm + saturação)
 * e uma <MaskLayer> circular revelando um "clipe" interno agrupado em <LayerGroup>.
 */
export const COMPOSITING_DURATION = 210; // 7s @ 30fps

const Particles = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: 40}, (_, i) => {
        const x = (seededNoise(11, i) + 1) * 540;
        const drift = seededNoise(23, i) * 60;
        const y = ((seededNoise(17, i) + 1) * 960 + frame * (2 + i * 0.05)) % 1920;
        const size = 6 + (seededNoise(29, i) + 1) * 10;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin((frame / 30 + i) * 0.8) * drift,
              top: 1920 - y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'white',
              boxShadow: '0 0 18px 6px rgba(255,255,255,0.7)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const CompositingShowcase = () => {
  const frame = useCurrentFrame();
  // Máscara circular cresce de 0 até cobrir bem mais que o frame (revela tudo).
  const radius = interpolate(frame, [60, 150], [0.05, 0.9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{background: '#05050a'}}>
      {/* camada 1 — vídeo */}
      <Loop durationInFrames={150}>
        <OffthreadVideo
          src={staticFile('asset-demo/bg-grid.mp4')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          muted
        />
      </Loop>

      {/* camada 2 — gradiente */}
      <AbsoluteFill
        style={{
          background: 'linear-gradient(135deg, rgba(255,0,80,0.35), transparent 60%)',
        }}
      />

      {/* camada 3 — partículas em screen */}
      <BlendLayer mode="screen" opacity={0.9}>
        <Particles />
      </BlendLayer>

      {/* adjustment layer: color grade em TUDO acima — warm + saturação */}
      <AdjustmentLayer
        filter="saturate(1.5) contrast(1.15) hue-rotate(-10deg)"
        color="#ff8830"
        blend="overlay"
        colorOpacity={0.18}
      />

      {/* máscara circular revelando um "clipe" pre-composto */}
      <MaskLayer mask={<circle cx={0.5} cy={0.5} r={radius} />}>
        <LayerGroup transform={`scale(${1 + Math.sin(frame / 20) * 0.02})`}>
          <AbsoluteFill
            style={{
              background: 'radial-gradient(circle at 50% 45%, #16163a, #05050a 75%)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                color: 'white',
                fontFamily: 'Arial, sans-serif',
                fontWeight: 900,
                fontSize: 110,
                letterSpacing: 4,
              }}
            >
              MASK + GROUP
            </div>
          </AbsoluteFill>
          <BlendLayer mode="screen" opacity={0.5}>
            <Particles />
          </BlendLayer>
        </LayerGroup>
      </MaskLayer>
    </AbsoluteFill>
  );
};
