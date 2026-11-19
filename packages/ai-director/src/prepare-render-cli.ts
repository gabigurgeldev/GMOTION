/**
 * Prepara o render de um projeto gerado pelos agentes:
 *  - EV: externaliza assets absolutos (vídeo-fonte, narração) para
 *    apps/studio/public/ai-ev e grava generated/capcut-timeline.json.
 *  - GM: copia mp3s de áudio para apps/studio/public/ai-audio, reescreve os
 *    srcs relativos e grava generated/ai-timeline.json.
 *
 * Uso: node prepare-render-cli.ts --project-dir <dir> --type EV|GM --studio <apps/studio>
 */
import fs from 'node:fs';
import path from 'node:path';
import {externalizeAssets, parseCapcutTimeline} from '@gmotion/capcut';
import {parseTimeline} from './schema';

const flag = (name: string): string | undefined => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

const main = () => {
  const projectDir = flag('project-dir');
  const studioDir = flag('studio');
  const type = (flag('type') as 'EV' | 'GM') ?? 'GM';
  if (!projectDir || !studioDir) {
    throw new Error('--project-dir e --studio são obrigatórios');
  }

  const timelinePath = path.join(projectDir, 'timeline.json');
  const raw = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
  const genDir = path.join(studioDir, 'src', 'generated');
  const publicDir = path.join(studioDir, 'public');
  fs.mkdirSync(genDir, {recursive: true});

  if (type === 'EV') {
    const timeline = parseCapcutTimeline(raw);
    const externalized = externalizeAssets(timeline, publicDir, 'ai-ev');
    fs.writeFileSync(
      path.join(genDir, 'capcut-timeline.json'),
      JSON.stringify(externalized, null, 2),
    );
    console.log('OK: generated/capcut-timeline.json (assets em public/ai-ev)');
    return;
  }

  const timeline = parseTimeline(raw);
  const audio = timeline.audio ?? [];
  const outAudioDir = path.join(publicDir, 'ai-audio');
  const rewritten = audio.map((track) => {
    if (!path.isAbsolute(track.src)) return track;
    if (!fs.existsSync(track.src)) return track;
    fs.mkdirSync(outAudioDir, {recursive: true});
    const name = path.basename(track.src);
    fs.copyFileSync(track.src, path.join(outAudioDir, name));
    return {...track, src: `ai-audio/${name}`};
  });
  fs.writeFileSync(
    path.join(genDir, 'ai-timeline.json'),
    JSON.stringify({...timeline, audio: rewritten.length ? rewritten : undefined}, null, 2),
  );
  console.log('OK: generated/ai-timeline.json');
};

main();
