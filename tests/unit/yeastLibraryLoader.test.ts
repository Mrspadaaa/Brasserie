import { describe, expect, it, vi } from 'vitest';

// Voie l3 : la bibliothèque de levures (1,4 Mo) se charge par import() à la demande ; avant, le calcul synchrone lève au lieu de rendre
// un résultat réduit ; après, il rend exactement ce que rendait yeastReferences().
describe('chargement paresseux de la bibliothèque de levures', () => {
  it('avant chargement : le calcul avec catalogue lève, le noyau seul répond', async () => {
    vi.resetModules();
    const core = await import('../../src/domain/yeastReferencesCore');
    const porte = await import('../../src/domain/yeastLibraryPorte');
    expect(porte.bibliothequeLevuresChargee()).toBe(false);
    expect(() => core.yeastReferencesChargees([])).toThrow(/Bibliothèque de levures non chargée/);
    expect(core.yeastReferencesNoyau().length).toBeGreaterThan(0);
  });

  it('après chargement : même résultat que yeastReferences(), une seule promesse partagée', async () => {
    vi.resetModules();
    const core = await import('../../src/domain/yeastReferencesCore');
    const { chargerBibliothequeLevures } = await import('../../src/domain/yeastLibraryLoader');
    const premiere = chargerBibliothequeLevures();
    expect(chargerBibliothequeLevures()).toBe(premiere);
    await premiere;
    expect((await import('../../src/domain/yeastLibraryPorte')).bibliothequeLevuresChargee()).toBe(true);
    const { yeastReferences } = await import('../../src/domain/yeastReferences');
    const chargees = core.yeastReferencesChargees([]);
    expect(chargees).toBe(yeastReferences([]));
    expect(chargees.length).toBeGreaterThan(core.yeastReferencesNoyau().length);
    await expect(chargerBibliothequeLevures()).resolves.toBeUndefined();
  });

  it('le moteur synchrone (predictionReferences) ne change pas : mêmes lignes qu’avec la bibliothèque statique', async () => {
    vi.resetModules();
    const { chargerBibliothequeLevures } = await import('../../src/domain/yeastLibraryLoader');
    const { guidePredictionKnowledge } = await import('../../src/domain/hopIndex/predictionReferences');
    expect(() => guidePredictionKnowledge([])).toThrow(/Bibliothèque de levures non chargée/);
    await chargerBibliothequeLevures();
    const { yeastReferences } = await import('../../src/domain/yeastReferences');
    const { storedPredictionKnowledge } = await import('../../src/domain/hopIndex/predictionReferences');
    // Une levure enregistrée (sans fiche documentaire) reçoit la fiche de la bibliothèque : le calcul lit bien la bibliothèque chargée.
    const brute = yeastReferences([]).find(row => row.id === 'fermentis-us05')!;
    const { catalogue: _fiche, ...sansFiche } = storedPredictionKnowledge(brute) as typeof brute;
    const enregistree = [sansFiche] as never[];
    const attendu = storedPredictionKnowledge(yeastReferences(enregistree).find(row => row.id === 'fermentis-us05')!);
    const obtenu = guidePredictionKnowledge(enregistree).find(row => row.id === 'fermentis-us05');
    expect(obtenu).toEqual(attendu);
  });
});
