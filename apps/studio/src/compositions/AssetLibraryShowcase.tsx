import {AbsoluteFill, Loop, OffthreadVideo, staticFile} from 'remotion';
import {AnimatedLayer} from '@gmotion/presets';
/**
 * Demo da Fase 10: 3 assets do catálogo `EFEITOS ASSETS`, achados via
 * searchAssets no asset-manifest.json e copiados pra public/asset-demo/:
 *   - {tags:['backgrounds','grid']}            → bg-grid.mp4
 *   - {tags:['emoji'], type:'video', hasAlpha:true} → emoji-bravo.webm, emoji-fofo.webm
 * Regenerar: node scripts/index-assets.mjs "EFEITOS ASSETS" + copiar os paths.
 */
export const ASSET_LIBRARY_DURATION = 240; // 8s @ 30fps
export const AssetLibraryShowcase = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Loop durationInFrames={150}>
        <OffthreadVideo
          src={staticFile('asset-demo/bg-grid.mp4')}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
          muted
        />
      </Loop>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 40}}>
        <AnimatedLayer enter="zoom-in-bounce" enterFrames={18} loop="float">
          <Loop durationInFrames={60} layout="none">
            <OffthreadVideo
              transparent
              src={staticFile('asset-demo/emoji-bravo.webm')}
              muted
              style={{width: 420}}
            />
          </Loop>
        </AnimatedLayer>
        <AnimatedLayer enter="slide-in" enterFrames={20} loop="pulse">
          <Loop durationInFrames={60} layout="none">
            <OffthreadVideo
              transparent
              src={staticFile('asset-demo/emoji-fofo.webm')}
              muted
              style={{width: 420}}
            />
          </Loop>
        </AnimatedLayer>
      </AbsoluteFill>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
        <div
          style={{
            color: 'white',
            fontFamily: 'Arial, sans-serif',
            fontSize: 36,
            marginBottom: 120,
            background: 'rgba(0,0,0,0.55)',
            padding: '12px 28px',
            borderRadius: 12,
          }}
        >
          3 assets via searchAssets — tags: grid / emoji+alpha
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
