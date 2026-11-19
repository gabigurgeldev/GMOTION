import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {seededNoise} from '@gmotion/core';
import {FilmGrain, LightLeaks, Vignette} from '@gmotion/effects';
import {ensureFonts, FONT, ORANGE} from './fonts';
import {OverlayView} from './overlays';
import type {ArollBlock, CardBlock, MusicCue, Plan} from './types';

/**
 * YoutubeTakes — vlog "A Estrada do Empreendedor" montado a partir de 14 takes de celular.
 * A-roll concatenado (aroll.mp4) + cards Blender + overlays + SFX do pack EditClass + trilha com ducking.
 * Plano: E:/VIDEO YOUTUBE/pipeline/make_plan.py -> edit-plan.json (passado via --props).
 */

ensureFonts();

/* ---------------------------------------------------------------- A-roll */

/** mídia pesada (A-roll/voz) vem de servidor HTTP local fora do bundle quando `assetBase` existe */
const asset = (base: string | undefined, p: string) => (base ? `${base}/${p}` : staticFile(p));

const ArollView = ({b, aroll, base}: {b: ArollBlock; aroll: string; base?: string}) => {
  const frame = useCurrentFrame();
  // corte ativo
  let idx = 0;
  for (let i = 0; i < b.cuts.length; i++) if ((b.cuts[i]?.at ?? 0) <= frame) idx = i;
  const cut = b.cuts[idx] ?? {at: 0, zoom: {from: 1, to: 1, x: 50, y: 40}};
  const nextAt = b.cuts[idx + 1]?.at ?? b.dur;
  const local = frame - cut.at;
  const len = Math.max(1, nextAt - cut.at);
  let scale = interpolate(local, [0, len], [cut.zoom.from, cut.zoom.to], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.sin),
  });
  let tx = 0;
  let ty = 0;
  let flash = 0;
  if (cut.accent === 'flash' && local < 8) {
    scale *= 1 + 0.07 * (1 - local / 8);
    flash = 0.45 * (1 - local / 6);
  }
  if (cut.accent === 'shake' && local < 10) {
    const amp = 18 * (1 - local / 10);
    tx = seededNoise(frame, 11) * amp;
    ty = seededNoise(frame, 23) * amp;
  }
  const blooper = b.look === 'blooper';
  return (
    <AbsoluteFill style={{backgroundColor: '#000', overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: `${cut.zoom.x}% ${cut.zoom.y}%`,
          filter: blooper ? 'saturate(0.55) contrast(1.12) sepia(0.15)' : undefined,
        }}
      >
        <OffthreadVideo
          src={asset(base, b.src ?? aroll)}
          trimBefore={b.src ? 0 : b.srcFrom}
          muted
          style={{width: '100%', height: '100%'}}
        />
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{backgroundColor: '#fff', opacity: Math.max(0, flash)}} /> : null}
      {blooper ? <FilmGrain intensity={0.22} grainFps={24} /> : null}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- Cards */

const CardView = ({b, bg}: {b: CardBlock; bg?: string}) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 7], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const outP = interpolate(frame, [b.dur - 7, b.dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
  const scale = (1.25 - 0.25 * inP) * (1 + 0.2 * outP);
  const blur = 14 * (1 - inP) + 10 * outP;
  const pngFrame = Math.min((b.pngFrames ?? b.dur) - 1, frame);
  const glowX = 50 + Math.sin(frame / 25) * 12;
  return (
    <AbsoluteFill style={{backgroundColor: '#0b0b0d', overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${scale})`, filter: `blur(${blur}px)`, opacity: 1 - outP * 0.6}}>
        {bg ? (
          <AbsoluteFill style={{opacity: 0.22}}>
            <OffthreadVideo src={staticFile(bg)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </AbsoluteFill>
        ) : null}
        <AbsoluteFill
          style={{
            background: `radial-gradient(60% 55% at ${glowX}% 55%, rgba(255,122,51,0.42), transparent 70%), radial-gradient(90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.85) 100%)`,
          }}
        />
        {b.png ? (
          // AbsoluteFill: sem posicionamento o <img> seria pintado ABAIXO das camadas absolutas (fundo/glow)
          <AbsoluteFill>
            <Img src={staticFile(`${b.png}${String(pngFrame + 1).padStart(4, '0')}.png`)} style={{width: '100%', height: '100%'}} />
          </AbsoluteFill>
        ) : (
          <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
            <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 130, color: '#fff', textAlign: 'center', lineHeight: 1}}>
              {b.num ? <div style={{color: ORANGE, fontSize: 180}}>{b.num}</div> : null}
              {b.line1}
              {b.line2 ? <div style={{fontSize: 70, color: ORANGE, marginTop: 10}}>{b.line2}</div> : null}
            </div>
          </AbsoluteFill>
        )}
      </AbsoluteFill>
      <LightLeaks intensity={0.45} count={2} seed={b.from % 97} />
      <AbsoluteFill style={{backgroundColor: '#fff', opacity: Math.max(0, 0.5 * (1 - frame / 5))}} />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- Áudio */

const musicVolume = (cue: MusicCue, boosts: [number, number][], f: number) => {
  const abs = cue.from + f;
  const ramp = 15;
  let w = 0;
  for (const [a, z] of boosts) {
    if (abs >= a - ramp && abs <= z + ramp) {
      const up = interpolate(abs, [a - ramp, a], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const down = interpolate(abs, [z, z + ramp], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      w = Math.max(w, Math.min(up, down));
    }
  }
  const v = cue.base + (cue.boost - cue.base) * w;
  const fin = interpolate(f, [0, cue.fadeIn], [0, 1], {extrapolateRight: 'clamp'});
  const fout = interpolate(f, [cue.dur - cue.fadeOut, cue.dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return v * Math.min(fin, fout);
};

/* ---------------------------------------------------------------- Raiz */

export const YoutubeTakes: React.FC<Plan> = (plan) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      {plan.blocks.map((b, i) => (
        <Sequence key={`b${i}`} from={b.from} durationInFrames={b.dur} name={`${b.kind}-${i}`}>
          {b.kind === 'aroll' ? (
            <>
              <ArollView b={b} aroll={plan.aroll} base={plan.assetBase} />
              {/* voz tratada (DeepFilterNet + cadeia) separada do vídeo: WAV sem perda, alinhada ao A-roll */}
              {plan.voice ? <Audio src={asset(plan.assetBase, plan.voice)} trimBefore={b.srcFrom} /> : null}
            </>
          ) : (
            <CardView b={b} bg={plan.bg} />
          )}
        </Sequence>
      ))}

      <Vignette intensity={0.32} size={62} />

      {plan.overlays.map((o, i) => (
        <Sequence key={`o${i}`} from={o.from} durationInFrames={o.dur} name={`ov-${o.type}-${i}`}>
          <OverlayView o={o} />
        </Sequence>
      ))}

      {plan.sfx.map((s, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, s.from)} name={`sfx-${i}`}>
          <Audio src={staticFile(s.src)} volume={s.volume} />
        </Sequence>
      ))}

      {plan.music.map((m, i) => (
        <Sequence key={`m${i}`} from={m.from} durationInFrames={m.dur} name={`music-${i}`}>
          <Audio
            src={staticFile(m.src)}
            trimBefore={m.trimBefore ?? 0}
            loop={m.loop}
            volume={(f) => musicVolume(m, plan.boosts, f)}
          />
        </Sequence>
      ))}

      {/* grão global removido: feTurbulence 1080p por frame triplicava o tempo de render e a 5% era invisível */}
    </AbsoluteFill>
  );
};

export const defaultPlan: Plan = {
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 150,
  aroll: 'aroll.mp4',
  blocks: [
    {kind: 'card', from: 0, dur: 150, style: 'title', line1: 'A ESTRADA', line2: 'DO EMPREENDEDOR'},
  ],
  overlays: [],
  sfx: [],
  music: [],
  boosts: [],
};
