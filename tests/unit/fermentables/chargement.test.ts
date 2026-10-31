// Le chargement à la demande de la table (comme t2Typicite pour les houblons) : succès, échec hors ligne, reprise.
import { afterEach, describe, expect, it, vi } from 'vitest';

const JSON_TABLE = '../../../src/data/fermentables/typicite-styles.json';
const MODULE = '../../../src/domain/fermentables/typicite';

afterEach(() => { vi.doUnmock(JSON_TABLE); vi.resetModules(); });

describe('chargerTypicite', () => {
  it('pose la table à son arrivée ; avant, tout est inconnu', async () => {
    vi.resetModules();
    const m = await import(/* @vite-ignore */ MODULE);
    expect(m.typiciteChargee()).toBeNull();
    const t = await m.chargerTypicite();
    expect(m.typiciteChargee()).toBe(t);
    expect(t.source.licence).toBe('CC BY-SA 4.0');
    expect(m.typiciteDe('pilsner-malt', '5D', m.typiciteChargee()).palier).toBe(4);
  });

  it('échec (hors ligne) : la promesse échoue, rien n\'est posé, la règle tourne sans table ; la reprise réussit', async () => {
    vi.resetModules();
    let essai = 0;
    vi.doMock(JSON_TABLE, () => {
      essai++;
      if (essai === 1) throw new Error('hors ligne');
      return { default: { source: { nom: 'essai', licence: 'CC BY-SA 4.0', releve: null }, styles: { '5D': 'German Pils' }, p16: {}, parts: { '5D': { 'pilsner-malt': 0.9 } } } };
    });
    const m = await import(/* @vite-ignore */ MODULE);
    const { proposerFermentables } = await import('../../../src/domain/fermentables/proposition');
    await expect(m.chargerTypicite()).rejects.toThrow();
    expect(m.typiciteChargee()).toBeNull();
    // Sans table posée, la règle ne casse pas : disponible, épinglé, nom.
    const art = (name: string) => ({ id: name, ref: name, name, category: 'Malt', unit: 'kg', currentStock: 1, minStock: 0, reorder: false });
    expect(proposerFermentables({ articles: [art('Pilsner Malz'), art('Carapils')], dejaLa: [], styleCode: '5D' }).map((p) => p.article.name)).toEqual(['Carapils', 'Pilsner Malz']);
    // La reprise ne reste pas bloquée sur l'échec.
    const t = await m.chargerTypicite();
    expect(m.typiciteChargee()).toBe(t);
    expect(t.parts['5D']['pilsner-malt']).toBe(0.9);
  });
});
