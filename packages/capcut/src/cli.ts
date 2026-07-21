import {readFileSync, writeFileSync, mkdirSync} from 'node:fs';
import {dirname, resolve, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadDraft} from './draft/reader';
import {draftToTimeline} from './timeline/import';
import {externalizeAssets} from './timeline/assets';
import {parseCapcutTimeline} from './timeline/schema';
import {exportTimeline} from './timeline/export';
import {fromDraft, trim, withNativeLayers} from './timeline/author';

/**
 * CLI da ponte CapCut ⇆ Gmotion.
 *
 *   tsx src/cli.ts import <draftDir> --out <file.json> [--assets <publicDir>]
 *   tsx src/cli.ts export <timeline.json> --out <draftDir>
 *   tsx src/cli.ts demo [<draftDir>] [--seconds 6] [--no-native]
 *
 * import: draft CapCut → CapcutTimeline JSON (com --assets copia mídias p/ studio).
 * export: CapcutTimeline JSON → pasta de draft CapCut (draft_content.json + Resources).
 * demo:   importa o PACK, recorta, injeta 3D + partículas e grava o JSON do studio.
 */
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFAULT_PACK = join(repoRoot, 'PACK EDITCLASS', 'EditAssets - STOP!', 'PROJETO', 'EditAssets - STOP!(1)');
const STUDIO_PUBLIC = join(repoRoot, 'apps', 'studio', 'public');
const STUDIO_GENERATED = join(repoRoot, 'apps', 'studio', 'src', 'generated', 'capcut-timeline.json');
const argv = process.argv.slice(2);
const cmd = argv[0];

const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

const fail = (msg: string): never => {
  console.error(msg);
  process.exit(1);
};

if (cmd === 'import') {
  const draftDir = argv[1] ?? fail('Faltou <draftDir>.');
  const outFile = resolve(flag('out') ?? 'capcut-timeline.json');
  const assetsDir = flag('assets');

  let timeline = draftToTimeline(loadDraft(resolve(draftDir)));
  if (assetsDir) timeline = externalizeAssets(timeline, resolve(assetsDir));

  mkdirSync(dirname(outFile), {recursive: true});
  writeFileSync(outFile, JSON.stringify(timeline, null, 2), 'utf-8');
  const clips = timeline.tracks.reduce((n, t) => n + t.clips.length, 0);
  console.log(`OK import: ${timeline.tracks.length} tracks, ${clips} clips, ${timeline.durationInFrames} frames → ${outFile}`);
} else if (cmd === 'export') {
  const jsonFile = argv[1] ?? fail('Faltou <timeline.json>.');
  const outDir = resolve(flag('out') ?? 'capcut-draft-out');
  const timeline = parseCapcutTimeline(JSON.parse(readFileSync(resolve(jsonFile), 'utf-8')));
  const {dir} = exportTimeline(timeline, outDir);
  console.log(`OK export → ${dir}`);
} else if (cmd === 'demo') {
  const draftDir = argv[1] && !argv[1].startsWith('--') ? resolve(argv[1]) : DEFAULT_PACK;
  const seconds = Number(flag('seconds') ?? 6);
  const noNative = argv.includes('--no-native');

  console.log(`Importando PACK: ${draftDir}`);
  let tl = fromDraft(draftDir);
  tl = trim(tl, seconds);

  if (!noNative) {
    // As camadas "impossíveis no CapCut": texto 3D + partículas por cima do edit.
    tl = withNativeLayers(tl, [
      {native: 'particle', component: 'particles', props: {count: 500}, start: 0, duration: Math.round(seconds * tl.fps)},
      {native: 'three', component: 'extruded-text', props: {text: 'GMOTION'}, start: Math.round(tl.fps * 0.5), duration: Math.round(seconds * tl.fps) - Math.round(tl.fps * 0.5)},
    ]);
  }

  tl = externalizeAssets(tl, STUDIO_PUBLIC);
  mkdirSync(dirname(STUDIO_GENERATED), {recursive: true});
  writeFileSync(STUDIO_GENERATED, JSON.stringify(tl, null, 2), 'utf-8');

  const clips = tl.tracks.reduce((n, t) => n + t.clips.length, 0);
  console.log(`OK demo: ${tl.tracks.length} tracks, ${clips} clips, ${tl.durationInFrames} frames (${seconds}s)`);
  console.log(`JSON → ${STUDIO_GENERATED}`);
  console.log('Render: cd apps/studio && npx remotion render CapcutImported out/gmotion-capcut-demo.mp4 --gl=angle');
} else if (cmd === 'pro') {
  buildProVideo();
} else {
  fail(
    'Uso:\n  cli.ts import <draftDir> --out <file.json> [--assets <publicDir>]\n  cli.ts export <timeline.json> --out <draftDir>\n  cli.ts demo [<draftDir>] [--seconds 6] [--no-native]\n  cli.ts pro',
  );
}

/** Edição "profissional" curada usando os componentes do Gmotion a favor. */
function buildProVideo(): void {
  const mediaDir = join(DEFAULT_PACK, 'Resources', 'editclass_midias');
  const asset = (name: string) => join(mediaDir, name);
  const W = 1080, H = 1920, FPS = 30;

  type KF = {property: string; points: {frame: number; value: number}[]};
  type FX = {name: string; kind: 'video_effect' | 'anim_in' | 'anim_out' | 'anim_loop'; intensity: number | null; frames: number | null};
  const T = (posX: number, posY: number, scale = 1) => ({scaleX: scale, scaleY: scale, rotation: 0, posX, posY, alpha: 1, flipH: false, flipV: false});
  const animIn = (frames: number): FX => ({name: 'in', kind: 'anim_in', intensity: null, frames});
  const animOut = (frames: number): FX => ({name: 'out', kind: 'anim_out', intensity: null, frames});
  const scaleKF = (from: number, to: number, frames: number): KF[] => [
    {property: 'scaleX', points: [{frame: 0, value: from}, {frame: frames, value: to}]},
    {property: 'scaleY', points: [{frame: 0, value: from}, {frame: frames, value: to}]},
  ];

  const img = (o: {id: string; src: string; start: number; duration: number; transform: ReturnType<typeof T>; keyframes?: KF[]; effects?: FX[]}) =>
    ({kind: 'image', src: o.src, sourceStart: 0, id: o.id, start: o.start, duration: o.duration, transform: o.transform, keyframes: o.keyframes ?? [], effects: o.effects ?? []});
  const vid = (o: {id: string; src: string; start: number; duration: number; transform: ReturnType<typeof T>; effects?: FX[]}) =>
    ({kind: 'video', src: o.src, volume: 0, sourceStart: 0, id: o.id, start: o.start, duration: o.duration, transform: o.transform, keyframes: [], effects: o.effects ?? []});
  const txt = (o: {id: string; text: string; start: number; duration: number; posX: number; posY: number; size: number; color?: string; effects?: FX[]}) =>
    ({kind: 'text', text: o.text, color: o.color ?? '#ffffff', fontSize: o.size, fontPath: null, sourceStart: 0, id: o.id, start: o.start, duration: o.duration, transform: T(o.posX, o.posY, 1), keyframes: [], effects: o.effects ?? []});
  const native = (o: {id: string; nat: 'three' | 'particle' | 'shader'; component: string; props: Record<string, unknown>; start: number; duration: number}) =>
    ({kind: 'native', native: o.nat, component: o.component, props: o.props, id: o.id, start: o.start, duration: o.duration, sourceStart: 0, transform: T(W / 2, H / 2, 1), keyframes: [], effects: []});

  const GOLD = '#ffd45e';
  const track = (id: string, renderIndex: number, clips: unknown[]) => ({id, type: 'video', renderIndex, clips});

  const raw = {
    fps: FPS, width: W, height: H, durationInFrames: 360,
    tracks: [
      // Fundo real do PACK com push-in / pull por keyframe + cor mais rica.
      track('bg', 0, [
        img({id: 'bg-a', src: asset('BG 4.png'), start: 0, duration: 200, transform: T(W / 2, H / 2, 1.16), keyframes: scaleKF(1.16, 1.30, 200), effects: [{name: 'saturate', kind: 'video_effect', intensity: 0.35, frames: null}, {name: 'contrast', kind: 'video_effect', intensity: 0.18, frames: null}, animOut(14)]}),
        img({id: 'bg-b', src: asset('BG 5.png'), start: 186, duration: 174, transform: T(W / 2, H / 2, 1.30), keyframes: scaleKF(1.30, 1.16, 174), effects: [{name: 'saturate', kind: 'video_effect', intensity: 0.35, frames: null}, animIn(16)]}),
      ]),
      // Partículas por trás do texto (o que o CapCut não faz).
      track('particles', 2, [
        native({id: 'parts', nat: 'particle', component: 'particles', props: {count: 240}, start: 0, duration: 360}),
      ]),
      // Título 3D extrudado na abertura (dimensionado para caber inteiro).
      track('title3d', 3, [
        native({id: 'title', nat: 'three', component: 'extruded-text', props: {text: 'GMOTION', size: 0.56, depth: 0.4, material: 'metal', color: '#eef1ff', rotation: [0, -0.1, 0]}, start: 8, duration: 100}),
      ]),
      // Texto cinético com animação de entrada/saída.
      track('text', 4, [
        txt({id: 'h1', text: 'EDITE COMO PRO', start: 118, duration: 120, posX: W / 2, posY: 560, size: 9, effects: [animIn(12), animOut(10)]}),
        txt({id: 'h2', text: 'sem After Effects', start: 142, duration: 96, posX: W / 2, posY: 690, size: 5, color: GOLD, effects: [animIn(12), animOut(8)]}),
        txt({id: 'h3', text: 'só com código', start: 250, duration: 78, posX: W / 2, posY: 600, size: 7, effects: [animIn(12), animOut(8)]}),
        txt({id: 'cta', text: '@gmotion', start: 298, duration: 62, posX: W / 2, posY: 1500, size: 6, effects: [animIn(14)]}),
      ]),
      // Acabamento cinematográfico por cima (overlays de @gmotion/effects).
      track('grade', 5, [
        native({id: 'grain', nat: 'shader', component: 'film-grain', props: {intensity: 0.1}, start: 0, duration: 360}),
        native({id: 'vig', nat: 'shader', component: 'vignette', props: {intensity: 0.55}, start: 0, duration: 360}),
        native({id: 'leak', nat: 'shader', component: 'light-leaks', props: {intensity: 0.9}, start: 232, duration: 70}),
      ]),
    ],
  };

  let tl = parseCapcutTimeline(raw);
  tl = externalizeAssets(tl, STUDIO_PUBLIC);
  mkdirSync(dirname(STUDIO_GENERATED), {recursive: true});
  writeFileSync(STUDIO_GENERATED, JSON.stringify(tl, null, 2), 'utf-8');
  const clips = tl.tracks.reduce((n, t) => n + t.clips.length, 0);
  console.log(`OK pro: ${tl.tracks.length} tracks, ${clips} clips, ${tl.durationInFrames} frames (${(tl.durationInFrames / FPS).toFixed(1)}s)`);
  console.log(`JSON → ${STUDIO_GENERATED}`);
  console.log('Render: cd apps/studio && npx remotion render CapcutImported out/gmotion-pro.mp4 --gl=angle');
}
