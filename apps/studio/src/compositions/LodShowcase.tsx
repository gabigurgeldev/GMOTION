import {useCurrentFrame} from 'remotion';
import {
  ExtrudedText,
  GmotionThreeScene,
  OrbitingCamera,
  Particles,
  type PreviewQuality,
} from '@gmotion/three-scenes';

/**
 * Demo da Fase 17 — cena 3D pesada de propósito (2000 partículas + texto
 * extrudado). Sem prop nenhuma o LOD é automático: low no studio (fluido),
 * high no render final. `quality` nas defaultProps só pra forçar na medição.
 */
export const LOD_DURATION = 150; // 5s @ 30fps

export const LodShowcase = ({quality}: {quality?: PreviewQuality}) => {
  const frame = useCurrentFrame();
  return (
    <GmotionThreeScene background="#05050c" previewQuality={quality}>
      <ExtrudedText
        text="GMOTION"
        material="metal"
        color="#d8dcff"
        rotation={[0, frame / 60, 0]}
      />
      <Particles count={2000} color="#8be9fd" spread={8} />
      <Particles count={1500} color="#ff7ad9" spread={10} seed={99} />
      <OrbitingCamera radius={9} />
    </GmotionThreeScene>
  );
};
