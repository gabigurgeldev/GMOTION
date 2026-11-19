import React from 'react';
import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {FONT, ORANGE} from './fonts';
import type {Overlay} from './types';

/* ---------------------------------------------------------------- helpers */

const useEnterExit = (dur: number, exitLen = 8) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 13, stiffness: 190, mass: 0.7}});
  const exit = interpolate(frame, [dur - exitLen, dur], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  return {frame, fps, enter, exit};
};

const POS: Record<string, React.CSSProperties> = {
  tl: {left: 96, top: 84, alignItems: 'flex-start', textAlign: 'left'},
  tr: {right: 96, top: 84, alignItems: 'flex-end', textAlign: 'right'},
  tc: {left: 0, right: 0, top: 70, alignItems: 'center', textAlign: 'center'},
  bl: {left: 96, bottom: 120, alignItems: 'flex-start', textAlign: 'left'},
  br: {right: 96, bottom: 120, alignItems: 'flex-end', textAlign: 'right'},
  c: {left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', textAlign: 'center'},
};

const shadow = '0 0 30px rgba(0,0,0,0.55), 0 6px 24px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.8)';

/** véu escuro suave na borda do quadro onde o texto está (contraste em céu/parede clara) */
const Scrim = ({side, o}: {side: 'top' | 'bottom' | null; o: number}) =>
  side ? (
    <AbsoluteFill
      style={{
        background: `linear-gradient(to ${side === 'top' ? 'bottom' : 'top'}, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.22) 18%, transparent 36%)`,
        opacity: o,
      }}
    />
  ) : null;
const sideOf = (pos?: string): 'top' | 'bottom' | null => (pos === 'bl' || pos === 'br' ? 'bottom' : pos === 'c' ? null : 'top');

const Check = ({ok, size = 44}: {ok: boolean; size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 44 44" style={{flex: 'none'}}>
    <circle cx="22" cy="22" r="21" fill={ok ? ORANGE : '#E5484D'} />
    {ok ? (
      <path d="M12 22.5l6.5 6.5L32 15.5" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="M14 14l16 16M30 14L14 30" stroke="#fff" strokeWidth="5" strokeLinecap="round" />
    )}
  </svg>
);

const Pin = ({size = 40}: {size?: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
    <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7z" fill="#fff" />
    <circle cx="12" cy="9" r="2.8" fill={ORANGE} />
  </svg>
);

const ClockIcon = ({size = 38, frame}: {size?: number; frame: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: 'none'}}>
    <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="2.4" fill="none" />
    <path d="M12 12V6.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
    <path
      d="M12 12l4 2.5"
      stroke={ORANGE}
      strokeWidth="2.4"
      strokeLinecap="round"
      transform={`rotate(${frame * 6} 12 12)`}
    />
  </svg>
);

/* ---------------------------------------------------------------- KW */

const Keyword = ({o}: {o: Extract<Overlay, {type: 'kw'}>}) => {
  const {frame, enter, exit} = useEnterExit(o.dur);
  const size = o.size ?? 86;
  const text = o.text.toUpperCase();
  const hl = o.hl?.toUpperCase();
  const parts = hl && text.includes(hl) ? text.split(hl) : [text];
  const marker = interpolate(frame, [4, 14], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const y = interpolate(enter, [0, 1], [size * 0.6, 0]);
  return (
    <AbsoluteFill>
    <Scrim side={sideOf(o.pos ?? 'tl')} o={Math.min(1, enter * 1.4) * (1 - exit)} />
    <AbsoluteFill style={{...POS[o.pos ?? 'tl'], position: 'absolute', display: 'flex', flexDirection: 'column'}}>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: size,
          lineHeight: 1.02,
          color: '#fff',
          letterSpacing: -1,
          textShadow: shadow,
          transform: `translateY(${y}px) scale(${1 - exit * 0.15})`,
          opacity: Math.min(1, enter * 1.4) * (1 - exit),
          maxWidth: 1100,
        }}
      >
        {parts.length === 2 ? (
          <>
            {parts[0]}
            <span style={{position: 'relative', display: 'inline-block', color: '#111', textShadow: 'none', padding: '0 14px'}}>
              <span
                style={{
                  position: 'absolute',
                  inset: '6% 0 2% 0',
                  background: ORANGE,
                  transform: `scaleX(${marker}) skewX(-6deg)`,
                  transformOrigin: 'left center',
                  borderRadius: 8,
                  zIndex: -1,
                }}
              />
              {hl}
            </span>
            {parts[1]}
          </>
        ) : (
          text
        )}
      </div>
    </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- LIST */

const List = ({o}: {o: Extract<Overlay, {type: 'list'}>}) => {
  const {frame, fps, enter, exit} = useEnterExit(o.dur);
  const right = o.pos === 'tr';
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          top: 84,
          [right ? 'right' : 'left']: 90,
          background: 'rgba(12,12,14,0.72)',
          backdropFilter: 'blur(10px)',
          borderRadius: 26,
          padding: '28px 36px 30px',
          minWidth: 520,
          transform: `translateX(${(right ? 1 : -1) * (1 - enter) * 120}px)`,
          opacity: enter * (1 - exit),
          boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
          borderLeft: right ? undefined : `8px solid ${ORANGE}`,
          borderRight: right ? `8px solid ${ORANGE}` : undefined,
        }}
      >
        {o.title ? (
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 34, color: ORANGE, letterSpacing: 2, marginBottom: 14}}>
            {o.title.toUpperCase()}
          </div>
        ) : null}
        {o.items.map((it, i) => {
          const p = spring({frame: frame - it.at, fps, config: {damping: 12, stiffness: 200}});
          const strike = interpolate(frame - it.at, [8, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                margin: '10px 0',
                opacity: p,
                transform: `translateY(${(1 - p) * 30}px) scale(${0.85 + 0.15 * p})`,
                transformOrigin: 'left center',
              }}
            >
              <Check ok={it.ok} />
              <span style={{position: 'relative', fontFamily: FONT, fontWeight: 600, fontSize: 46, color: '#fff'}}>
                {it.text}
                {!it.ok ? (
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: '54%',
                      height: 5,
                      background: '#E5484D',
                      transform: `scaleX(${strike})`,
                      transformOrigin: 'left',
                      borderRadius: 3,
                    }}
                  />
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- LOC / CLOCK */

const Pill = ({
  dur,
  side,
  top,
  bottom,
  children,
}: {
  dur: number;
  side: 'left' | 'right';
  top?: number;
  bottom?: number;
  children: React.ReactNode;
}) => {
  const {enter, exit} = useEnterExit(dur);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          [side]: 80,
          top,
          bottom,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '14px 30px 14px 22px',
          borderRadius: 999,
          background: ORANGE,
          boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
          transform: `translateX(${(side === 'left' ? -1 : 1) * (1 - enter) * 160}px)`,
          opacity: enter * (1 - exit),
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

const Loc = ({o}: {o: Extract<Overlay, {type: 'loc'}>}) => (
  <Pill dur={o.dur} side="left" bottom={110}>
    <Pin />
    <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 42, color: '#fff', letterSpacing: 1}}>{o.text.toUpperCase()}</span>
  </Pill>
);

const Clock = ({o}: {o: Extract<Overlay, {type: 'clock'}>}) => {
  const frame = useCurrentFrame();
  return (
    <Pill dur={o.dur} side="right" top={70}>
      <ClockIcon frame={frame} />
      <span style={{fontFamily: FONT, fontWeight: 600, fontSize: 44, color: '#fff'}}>{o.text}</span>
    </Pill>
  );
};

/* ---------------------------------------------------------------- LOWER THIRD */

const Lower = ({o}: {o: Extract<Overlay, {type: 'lower'}>}) => {
  const {frame, enter, exit} = useEnterExit(o.dur, 10);
  const bar = interpolate(frame, [0, 12], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 96, bottom: 120, opacity: 1 - exit}}>
        <div style={{width: 10, height: 120, background: ORANGE, position: 'absolute', left: -26, top: 0, transform: `scaleY(${bar})`, transformOrigin: 'top'}} />
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 64,
            color: '#fff',
            textShadow: shadow,
            transform: `translateX(${(1 - enter) * -60}px)`,
            opacity: enter,
          }}
        >
          {o.title}
        </div>
        {o.sub ? (
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 500,
              fontSize: 36,
              color: '#fff',
              background: 'rgba(0,0,0,0.55)',
              padding: '6px 16px',
              borderRadius: 8,
              marginTop: 6,
              display: 'inline-block',
              opacity: interpolate(frame, [6, 16], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
            }}
          >
            {o.sub}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- LESSON */

const Lesson = ({o}: {o: Extract<Overlay, {type: 'lesson'}>}) => {
  const {enter, exit} = useEnterExit(o.dur, 10);
  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end'}}>
      <div
        style={{
          marginBottom: 80,
          background: 'rgba(10,10,12,0.78)',
          backdropFilter: 'blur(8px)',
          borderRadius: 24,
          padding: '20px 44px 26px',
          textAlign: 'center',
          transform: `translateY(${(1 - enter) * 80}px) scale(${1 - exit * 0.1})`,
          opacity: enter * (1 - exit),
          borderBottom: `6px solid ${ORANGE}`,
          maxWidth: 1300,
        }}
      >
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 32, color: ORANGE, letterSpacing: 4}}>LIÇÃO #{o.num}</div>
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 60, color: '#fff', lineHeight: 1.05, marginTop: 4}}>{o.text}</div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- BIG */

const Big = ({o}: {o: Extract<Overlay, {type: 'big'}>}) => {
  const {frame, enter, exit} = useEnterExit(o.dur, 10);
  const ring = interpolate(frame, [0, 22], [0, 1], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
      <AbsoluteFill
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, transparent 70%)',
          opacity: Math.min(1, enter) * (1 - exit),
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          width: 900,
          height: 900,
          marginBottom: -380,
          borderRadius: '50%',
          border: `6px solid ${o.color ?? ORANGE}`,
          transform: `scale(${0.2 + ring * 1.1})`,
          opacity: (1 - ring) * 0.8,
        }}
      />
      <div
        style={{
          position: 'relative',
          marginBottom: 150,
          textAlign: 'center',
          transform: `scale(${0.6 + 0.4 * enter}) translateY(${exit * 40}px)`,
          opacity: Math.min(1, enter * 1.3) * (1 - exit),
        }}
      >
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 150, lineHeight: 0.95, color: o.color ?? ORANGE, textShadow: shadow, letterSpacing: -2}}>
          {o.text.toUpperCase()}
        </div>
        {o.sub ? (
          <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 48, color: '#fff', textShadow: shadow, marginTop: 10}}>{o.sub}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- COUNTER */

const Counter = ({o}: {o: Extract<Overlay, {type: 'counter'}>}) => {
  const {frame, enter, exit} = useEnterExit(o.dur);
  const v = Math.round(
    interpolate(frame, [4, 40], [0, o.to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)}),
  );
  const right = o.pos === 'tr';
  return (
    <AbsoluteFill>
      <Scrim side="top" o={enter * (1 - exit)} />
      <div
        style={{
          position: 'absolute',
          top: 84,
          [right ? 'right' : 'left']: 96,
          textAlign: right ? 'right' : 'left',
          transform: `scale(${0.7 + 0.3 * enter})`,
          transformOrigin: right ? 'right top' : 'left top',
          opacity: enter * (1 - exit),
        }}
      >
        <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 150, lineHeight: 0.9, color: '#fff', textShadow: shadow}}>
          {o.prefix ?? ''}
          <span style={{color: ORANGE}}>{v}</span>
          {o.suffix ?? ''}
        </div>
        {o.label ? (
          <div style={{fontFamily: FONT, fontWeight: 600, fontSize: 44, color: '#fff', textShadow: shadow, marginTop: 6}}>{o.label.toUpperCase()}</div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- SUBSCRIBE */

const Subscribe = ({o}: {o: Extract<Overlay, {type: 'subscribe'}>}) => {
  const {frame, fps, enter, exit} = useEnterExit(o.dur, 10);
  const click = Math.round(o.dur * 0.42);
  const done = frame >= click;
  const press = spring({frame: frame - click, fps, config: {damping: 10, stiffness: 300}});
  const cx = interpolate(frame, [6, click - 2], [520, 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  const cy = interpolate(frame, [6, click - 2], [260, 30], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
      <div style={{position: 'relative', marginBottom: 130, transform: `scale(${(0.7 + 0.3 * enter) * (done ? 1 - 0.08 * (1 - press) : 1)})`, opacity: enter * (1 - exit)}}>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 58,
            padding: '20px 56px',
            borderRadius: 18,
            color: '#fff',
            background: done ? '#3a3a3a' : '#E62117',
            boxShadow: '0 16px 50px rgba(0,0,0,0.5)',
            letterSpacing: 1,
          }}
        >
          {done ? 'INSCRITO ✓' : 'INSCREVA-SE'}
        </div>
        <svg width="70" height="70" viewBox="0 0 24 24" style={{position: 'absolute', left: '50%', top: '50%', transform: `translate(${cx}px, ${cy}px)`}}>
          <path d="M5 2l14 10-6.5 1.2L16 21l-3 1.3-3.4-7.8L5 19z" fill="#fff" stroke="#111" strokeWidth="1.2" />
        </svg>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- LINE (alpha do pack) */

const Line = ({o}: {o: Extract<Overlay, {type: 'line'}>}) => {
  const {exit} = useEnterExit(o.dur, 6);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: o.x, top: o.y, width: o.w, height: o.w, opacity: 1 - exit}}>
        <OffthreadVideo src={staticFile(o.src)} transparent muted style={{width: '100%', height: '100%'}} />
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- REC */

const Rec = () => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 15) % 2 === 0;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 70, top: 60, display: 'flex', alignItems: 'center', gap: 14}}>
        <div style={{width: 30, height: 30, borderRadius: '50%', background: '#ff2a2a', opacity: on ? 1 : 0.15}} />
        <span style={{fontFamily: 'Consolas, monospace', fontSize: 44, color: '#fff', textShadow: shadow}}>REC</span>
      </div>
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- dispatcher */

export const OverlayView = ({o}: {o: Overlay}) => {
  switch (o.type) {
    case 'kw':
      return <Keyword o={o} />;
    case 'list':
      return <List o={o} />;
    case 'loc':
      return <Loc o={o} />;
    case 'clock':
      return <Clock o={o} />;
    case 'lower':
      return <Lower o={o} />;
    case 'lesson':
      return <Lesson o={o} />;
    case 'big':
      return <Big o={o} />;
    case 'counter':
      return <Counter o={o} />;
    case 'subscribe':
      return <Subscribe o={o} />;
    case 'line':
      return <Line o={o} />;
    case 'rec':
      return <Rec />;
    default:
      return null;
  }
};
