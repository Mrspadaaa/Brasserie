// Voie d2-import-bm (#180) : le cache des sources se lit hors ligne sans jamais toucher au réseau ni écrire dans le cache.
import { mkdtempSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error module .mjs sans déclaration
import { digest, readHopSource } from '../../../scripts/hop-source-cache.mjs';

const URL_X = 'https://beermaverick.com/hop/essai/';
let dossier: string;
let fetchEspion: ReturnType<typeof vi.fn>;
beforeEach(() => {
  dossier = mkdtempSync(join(tmpdir(), 'affinee-cache-'));
  fetchEspion = vi.fn(async () => { throw new Error('fetch appelé'); });
  vi.stubGlobal('fetch', fetchEspion);
});
afterEach(() => { vi.unstubAllGlobals(); rmSync(dossier, { recursive: true, force: true }); });
const poser = (url: string, contenu: string, sha = digest(contenu)) => {
  writeFileSync(join(dossier, digest(url)), contenu);
  writeFileSync(join(dossier, digest(url) + '.json'), JSON.stringify({ url, retrievedAt: '2026-09-08T00:00:00.000Z', sha256: sha }));
};

describe('hop-source-cache --offline', () => {
  it('sans le cache : une erreur, aucun fetch, aucun dossier créé', async () => {
    const absent = join(dossier, 'inexistant');
    await expect(readHopSource(URL_X, { offline: true, cache: absent })).rejects.toThrow(/Hors ligne : source absente/);
    expect(fetchEspion).not.toHaveBeenCalled();
    expect(readdirSync(dossier)).toEqual([]);
  });
  it('une page absente d\'un cache existant : erreur, aucun fetch, rien d\'écrit', async () => {
    mkdirSync(join(dossier, 'sous'));
    await expect(readHopSource(URL_X, { offline: true, cache: join(dossier, 'sous') })).rejects.toThrow(/absente du cache/);
    expect(fetchEspion).not.toHaveBeenCalled();
    expect(readdirSync(join(dossier, 'sous'))).toEqual([]);
  });
  it('un reçu sha256 qui ne correspond pas au contenu : erreur, aucun fetch', async () => {
    poser(URL_X, '<html>x</html>', 'f'.repeat(64));
    await expect(readHopSource(URL_X, { offline: true, cache: dossier })).rejects.toThrow(/sha256/);
    expect(fetchEspion).not.toHaveBeenCalled();
  });
  it('--refresh hors ligne est refusé (jamais de téléchargement)', async () => {
    poser(URL_X, '<html>x</html>');
    await expect(readHopSource(URL_X, { offline: true, refresh: true, cache: dossier })).rejects.toThrow(/s’excluent/);
    expect(fetchEspion).not.toHaveBeenCalled();
  });
  it('une page en cache avec un bon reçu : contenu et date de relevé, sans fetch', async () => {
    poser(URL_X, '<html>x</html>');
    const r = await readHopSource(URL_X, { offline: true, cache: dossier });
    expect(r.content).toBe('<html>x</html>');
    expect(r.retrievedAt).toBe('2026-09-08T00:00:00.000Z');
    expect(fetchEspion).not.toHaveBeenCalled();
  });
  it('HOP_SOURCE_CACHE règle le dossier lu par défaut', async () => {
    poser(URL_X, '<html>y</html>');
    vi.resetModules();
    process.env.HOP_SOURCE_CACHE = dossier;
    try {
      // @ts-expect-error module .mjs sans déclaration
      const m = await import('../../../scripts/hop-source-cache.mjs?env');
      expect(m.sourceCache).toBe(dossier);
      expect((await m.readHopSource(URL_X, { offline: true })).content).toBe('<html>y</html>');
    } finally { delete process.env.HOP_SOURCE_CACHE; }
  });
  it('en ligne (sans --offline), une page absente appelle fetch : le mode hors ligne est donc bien ce qui l\'empêche', async () => {
    await expect(readHopSource(URL_X, { offline: false, cache: dossier })).rejects.toThrow('fetch appelé');
    expect(fetchEspion).toHaveBeenCalledTimes(1);
  });
});
