/**
 * Plano de edição do vlog (gerado por E:/VIDEO YOUTUBE/pipeline/make_plan.py).
 * Todos os tempos em frames da timeline final (30 fps), exceto `srcFrom` (frame do aroll.mp4).
 */

export type Zoom = {
  /** escala no início e no fim do trecho (push-in lento quando to > from) */
  from: number;
  to: number;
  /** âncora da escala em % do quadro */
  x: number;
  y: number;
};

/** Corte interno de um bloco de A-roll (jump cut) — muda o enquadramento. */
export type Cut = {
  at: number; // frame relativo ao início do bloco
  zoom: Zoom;
  accent?: 'flash' | 'shake' | null;
};

export type ArollBlock = {
  kind: 'aroll';
  from: number;
  dur: number;
  srcFrom: number; // frame no A-roll completo (voz)
  /** arquivo de vídeo só deste bloco (começa no frame 0 do bloco) */
  src?: string;
  cuts: Cut[];
  /** look especial (erros de gravação) */
  look?: 'normal' | 'blooper';
};

export type CardBlock = {
  kind: 'card';
  from: number;
  dur: number;
  style: 'title' | 'chapter' | 'bloopers' | 'end';
  /** prefixo da sequência PNG do Blender (staticFile), ex. 'blender/title/f_' */
  png?: string;
  pngFrames?: number;
  num?: string;
  line1?: string;
  line2?: string;
};

export type Block = ArollBlock | CardBlock;

export type Overlay =
  | {type: 'kw'; from: number; dur: number; text: string; hl?: string; pos?: 'tl' | 'tr' | 'tc' | 'bl' | 'br' | 'c'; size?: number}
  | {type: 'list'; from: number; dur: number; title?: string; items: {text: string; ok: boolean; at: number}[]; pos?: 'tl' | 'tr'}
  | {type: 'loc'; from: number; dur: number; text: string}
  | {type: 'clock'; from: number; dur: number; text: string}
  | {type: 'lower'; from: number; dur: number; title: string; sub?: string}
  | {type: 'lesson'; from: number; dur: number; num: number; text: string}
  | {type: 'big'; from: number; dur: number; text: string; sub?: string; color?: string}
  | {type: 'counter'; from: number; dur: number; to: number; prefix?: string; suffix?: string; label?: string; pos?: 'tl' | 'tr'}
  | {type: 'subscribe'; from: number; dur: number}
  | {type: 'line'; from: number; dur: number; src: string; x: number; y: number; w: number}
  | {type: 'rec'; from: number; dur: number};

export type SfxCue = {from: number; src: string; volume: number};

export type MusicCue = {
  from: number;
  dur: number;
  src: string;
  /** trecho inicial pulado no arquivo (frames) */
  trimBefore?: number;
  /** volume sob a fala */
  base: number;
  /** volume nas janelas de destaque (cards, pausas) */
  boost: number;
  fadeIn: number;
  fadeOut: number;
  loop?: boolean;
};

export type Plan = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  aroll: string; // staticFile do A-roll concatenado (vídeo; tocado mudo)
  voice?: string; // voz tratada, mesma timeline do A-roll
  /** base HTTP p/ mídia pesada (aroll/voz) servida fora do bundle; ausente = staticFile */
  assetBase?: string;
  blocks: Block[];
  overlays: Overlay[];
  sfx: SfxCue[];
  music: MusicCue[];
  /** janelas [from, to) onde a música sobe (cards etc.) */
  boosts: [number, number][];
  bg?: string; // fundo animado p/ cards
};
