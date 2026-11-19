import {AbsoluteFill, Loop, OffthreadVideo, Sequence, staticFile} from 'remotion';
import {ColorGrade, LutVideo} from '@gmotion/color';

/**
 * Demo da Fase 13 — color correction:
 * blocos 1-3: mesma cena com 3 LUTs .cube diferentes via <LutVideo> (shader 3D real)
 * bloco 4: <ColorGrade> com curvas + HSL (filtro SVG) sobre conteúdo DOM
 * LUTs geradas por scripts/make-demo-luts.mjs.
 */
export const COLOR_DURATION = 300; // 10s @ 30fps: 3×75 (LUTs) + 75 (curves)

const label = (t: string) => (
  <div
    style={{
      position: 'absolute',
      top: 140,
      width: '100%',
      textAlign: 'center',
      color: 'white',
      fontSize: 42,
      fontFamily: 'Arial',
      textShadow: '0 2px 12px black',
    }}
  >
    {t}
  </div>
);

const BG = 'asset-demo/bg-grid.mp4';

export const ColorShowcase = () => {
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Sequence durationInFrames={75}>
        <LutVideo src={staticFile(BG)} lutSrc={staticFile('luts/warm.cube')} />
        {label('LUT warm.cube — shader 3D')}
      </Sequence>
      <Sequence from={75} durationInFrames={75}>
        <LutVideo src={staticFile(BG)} lutSrc={staticFile('luts/cool.cube')} />
        {label('LUT cool.cube — shader 3D')}
      </Sequence>
      <Sequence from={150} durationInFrames={75}>
        <LutVideo src={staticFile(BG)} lutSrc={staticFile('luts/noir.cube')} />
        {label('LUT noir.cube — shader 3D')}
      </Sequence>
      <Sequence from={225} durationInFrames={75}>
        <ColorGrade
          fill
          curves={{rgb: [[0, 0.06], [0.45, 0.5], [1, 0.98]], b: [[0, 0.1], [1, 0.9]]}}
          hsl={{hue: -12, saturation: 1.45, lightness: 1.05}}
        >
          <Loop durationInFrames={75}>
            <OffthreadVideo
              src={staticFile(BG)}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
              muted
            />
          </Loop>
        </ColorGrade>
        {label('ColorGrade — curvas + HSL (filtro SVG)')}
      </Sequence>
    </AbsoluteFill>
  );
};
