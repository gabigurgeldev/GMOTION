import {AbsoluteFill, Series, useCurrentFrame} from 'remotion';
import {
  ExtrudedText,
  FloatingImage,
  GmotionThreeScene,
  OrbitingCamera,
  Particles,
} from '@gmotion/three-scenes';

/**
 * Demo da Fase 4: texto 3D orbitado, partículas e imagem flutuante.
 * (GltfModel documentado no README — precisa de um .glb em public/.)
 */

const SCENE_FRAMES = 90;

// Logo de exemplo como SVG inline — sem asset externo
const LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="1" stop-color="#ec4899"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#g)"/>
  <text x="256" y="330" text-anchor="middle" font-family="Arial" font-size="220" font-weight="900" fill="white">G</text>
</svg>`)}`;

const Label = ({text}: {text: string}) => (
  <AbsoluteFill style={{justifyContent: 'flex-start', alignItems: 'center'}}>
    <span
      style={{
        marginTop: 120,
        fontFamily: 'monospace',
        fontSize: 54,
        color: '#8b8ba7',
      }}
    >
      {text}
    </span>
  </AbsoluteFill>
);

const TextScene = () => (
  <>
    <GmotionThreeScene cameraPosition={[0, 1.5, 9]}>
      <ExtrudedText text="GMOTION" material="metal" color="#d8dcff" size={1.4} />
      <Particles count={80} spread={5} size={0.03} color="#8be9fd" glow={2} />
      <OrbitingCamera radius={9} speed={0.12} height={1.8} />
    </GmotionThreeScene>
    <Label text="3d: extruded-text (metal) + orbit" />
  </>
);

const ParticleScene = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <GmotionThreeScene cameraPosition={[0, 0, 10]}>
        <ExtrudedText
          text="3D"
          material="neon"
          color="#ff2d95"
          size={2}
          rotation={[0, frame * 0.015, 0]}
        />
        <Particles count={350} spread={7} riseSpeed={0.8} color="#ffd166" glow={1.8} />
      </GmotionThreeScene>
      <Label text="3d: particles (350, seeded)" />
    </>
  );
};

const FloatingScene = () => (
  <>
    <GmotionThreeScene cameraPosition={[0, 0.6, 6]}>
      <FloatingImage src={LOGO_SVG} width={3} amplitude={0.25} shadowY={-2} />
      <Particles count={60} spread={4} size={0.025} color="#c4b5fd" glow={1.5} />
      <OrbitingCamera radius={6} speed={0.05} height={0.6} />
    </GmotionThreeScene>
    <Label text="3d: floating-image + sombra" />
  </>
);

export const THREE_SHOWCASE_DURATION = SCENE_FRAMES * 3;

export const ThreeShowcase = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <TextScene />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <ParticleScene />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_FRAMES}>
        <FloatingScene />
      </Series.Sequence>
    </Series>
  );
};
