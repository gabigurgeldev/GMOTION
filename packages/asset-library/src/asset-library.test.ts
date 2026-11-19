import {describe, expect, it} from 'vitest';
import {idFromPath, inferTags} from './tags';
import {searchAssets} from './search';
import type {AssetManifest} from './types';

describe('inferTags', () => {
  it('extrai tags de pastas e nome do arquivo', () => {
    const tags = inferTags('2D/2D EMOJIS/Emoji Bravo 2.mov');
    expect(tags).toContain('2d');
    expect(tags).toContain('emojis');
    expect(tags).toContain('emoji');
    expect(tags).toContain('bravo');
    expect(tags).not.toContain('2'); // número solto não é tag
  });

  it('remove sufixo Takeout e acentos', () => {
    const tags = inferTags('ELEMENTOS 3D-20260720T200424Z-1-004/Explosão Neon.mp4');
    expect(tags).toContain('elementos');
    expect(tags).toContain('3d');
    expect(tags).toContain('explosao');
    expect(tags).toContain('neon');
    expect(tags.some((t) => t.includes('20260720'))).toBe(false);
  });

  it('sem duplicatas', () => {
    const tags = inferTags('NEON/NEON/neon.mp4');
    expect(tags).toEqual(['neon']);
  });

  it('arquivo numérico só herda tags das pastas', () => {
    const tags = inferTags('3D-20260720T200136Z-1-001/3D/3D EMOJIS/17.mp4');
    expect(tags).toEqual(['3d', 'emojis']);
  });
});

describe('idFromPath', () => {
  it('id estável, minúsculo, sem extensão nem sufixo Takeout', () => {
    expect(idFromPath('2D/2D EMOJIS/Emoji Bravo 2.mov')).toBe('2d/2d-emojis/emoji-bravo-2');
    expect(idFromPath('3D-20260720T200136Z-1-001/3D/17.mp4')).toBe('3d/3d/17');
  });
});

const manifest: AssetManifest = {
  version: 1,
  root: 'X:/assets',
  entries: [
    {id: 'a', path: 'a.mp4', type: 'video', tags: ['emoji', 'bravo'], duration: 3.2, hasAlpha: true},
    {id: 'b', path: 'b.mp4', type: 'video', tags: ['neon', 'explosao'], duration: 1.1},
    {id: 'c', path: 'c.png', type: 'image', tags: ['emoji', 'fofo'], hasAlpha: true},
    {id: 'd', path: 'd.mp3', type: 'audio', tags: ['trilha'], duration: 60},
  ],
};

describe('searchAssets', () => {
  it('filtra por tag (prefixo) + tipo', () => {
    const hits = searchAssets(manifest, {tags: ['emoji'], type: 'video'});
    expect(hits.map((e) => e.id)).toEqual(['a']);
  });

  it('todas as tags precisam bater', () => {
    expect(searchAssets(manifest, {tags: ['emoji', 'fofo']}).map((e) => e.id)).toEqual(['c']);
    expect(searchAssets(manifest, {tags: ['emoji', 'neon']})).toEqual([]);
  });

  it('minDuration exclui sem duração e mais curtos', () => {
    expect(searchAssets(manifest, {minDuration: 2}).map((e) => e.id)).toEqual(['a', 'd']);
  });

  it('hasAlpha filtra nos dois sentidos', () => {
    expect(searchAssets(manifest, {hasAlpha: true}).map((e) => e.id)).toEqual(['a', 'c']);
    expect(searchAssets(manifest, {hasAlpha: false}).map((e) => e.id)).toEqual(['b', 'd']);
  });

  it('query vazia retorna tudo', () => {
    expect(searchAssets(manifest).length).toBe(4);
  });
});
