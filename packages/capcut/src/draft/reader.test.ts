import {describe, it, expect} from 'vitest';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import {loadDraft, resolvePlaceholder} from './reader';

const here = dirname(fileURLToPath(import.meta.url));
const miniDir = join(here, '..', '..', 'fixtures', 'mini-draft');

describe('resolvePlaceholder', () => {
  it('replaces the draftpath token with the draft dir', () => {
    const out = resolvePlaceholder(
      '##_draftpath_placeholder_AAAA-BBBB_##/Resources/bg.png',
      '/tmp/draft',
    );
    expect(out.replace(/\\/g, '/')).toBe('/tmp/draft/Resources/bg.png');
  });

  it('resolves ./relative against the dir', () => {
    const out = resolvePlaceholder('./Resources/x.png', '/tmp/draft');
    expect(out.replace(/\\/g, '/')).toBe('/tmp/draft/Resources/x.png');
  });
});

describe('loadDraft (mini fixture)', () => {
  const draft = loadDraft(miniDir);

  it('reads tracks and segments', () => {
    expect(draft.content.fps).toBe(30);
    expect(draft.content.tracks).toHaveLength(2);
    const types = draft.content.tracks.map((t) => t.type).sort();
    expect(types).toEqual(['text', 'video']);
  });

  it('builds the asset map for existing files', () => {
    expect(draft.assetMap.get('vid-mat-1')).toBeDefined();
    expect(draft.assetMap.get('vid-mat-1')!.endsWith('bg.png')).toBe(true);
  });

  it('loads meta info', () => {
    expect(draft.meta?.draft_id).toBe('MINI-DRAFT-0001');
  });
});
