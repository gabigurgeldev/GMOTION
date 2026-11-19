import {describe, it, expect} from 'vitest';
import {assetsAsText, pickMusicAsset, resolveAssetPath} from './assets';
import type {AssetManifest} from '@gmotion/asset-library';
import type {Plan} from './agents/types';

const plan: Plan = {
  keyMessage: 'café energia manhã',
  palette: ['#000000', '#ffffff'],
  targetSeconds: 20,
  cta: null,
  scenes: [{intent: 'hook energético', copy: 'Bom dia!'}],
};

const manifest: AssetManifest = {
  version: 1,
  root: '/assets',
  entries: [
    {id: 'a1', path: 'audio/upbeat.mp3', type: 'audio', tags: ['energia', 'manha']},
    {id: 'a2', path: 'audio/calmo.mp3', type: 'audio', tags: ['calmo', 'noite']},
    {id: 'i1', path: 'img/logo.png', type: 'image', tags: ['logo'], width: 200, height: 200},
  ],
};

describe('resolveAssetPath', () => {
  it('junta root + path', () => {
    expect(resolveAssetPath(manifest, manifest.entries[0]!)).toContain('upbeat.mp3');
  });
});

describe('assetsAsText', () => {
  it('lista só as entradas do tipo pedido', () => {
    const text = assetsAsText(manifest, 'image');
    expect(text).toContain('logo.png');
    expect(text).not.toContain('upbeat.mp3');
  });

  it('retorna string vazia sem manifest ou sem entradas do tipo', () => {
    expect(assetsAsText(undefined, 'image')).toBe('');
    expect(assetsAsText({version: 1, root: '/x', entries: []}, 'image')).toBe('');
  });
});

describe('pickMusicAsset', () => {
  it('escolhe o áudio com mais tags em comum com o plano', () => {
    const picked = pickMusicAsset(manifest, plan);
    expect(picked?.id).toBe('a1');
  });

  it('retorna null sem manifest', () => {
    expect(pickMusicAsset(undefined, plan)).toBeNull();
  });

  it('retorna null quando nenhuma tag bate', () => {
    const noMatch: Plan = {...plan, keyMessage: 'xyz', scenes: [{intent: 'qwe', copy: 'x'}]};
    const onlyUnrelated: AssetManifest = {
      version: 1,
      root: '/assets',
      entries: [{id: 'a3', path: 'audio/foo.mp3', type: 'audio', tags: ['jazz']}],
    };
    expect(pickMusicAsset(onlyUnrelated, noMatch)).toBeNull();
  });
});
