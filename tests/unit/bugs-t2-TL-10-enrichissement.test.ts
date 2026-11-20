import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * TL-10 (07.11), branchement 1 : la procédure d'enrichissement des fiches remplit un malt de la table Weyermann (EBC et PPG) par le catalogue du dépôt,
 * sans recherche en ligne, avec sa source et sa règle de déduction. Un malt hors table reste « à saisir » (jamais 0). Gemini jamais appelé.
 */
vi.mock('../../src/services/storage', async () => (await import('./depense/enrichir/aide')).storageSimule);
vi.mock('../../src/services/firestoreRepo', async () => (await import('./depense/enrichir/aide')).firestoreSimule);
vi.mock('../../src/services/financeService', async () => (await import('./depense/enrichir/aide')).financeSimule);
vi.mock('../../src/services/financeDocuments', async () => (await import('./depense/enrichir/aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { lu, remettre } from './depense/enrichir/aide';
import { confirmer, demonter, ligne, monter, saisie, type Banc } from './depense/enrichir/montage';
import { valeursDeCatalogueMalt } from '../../src/services/enrichissementCatalogues';

let banc: Banc;
beforeEach(() => { remettre(); ia.run.mockClear(); });
afterEach(() => demonter());

describe('TL-10 : valeursDeCatalogueMalt (service)', () => {
  it('Pilsner Malz : la forme de ValeursTrouvees, source Weyermann, règle de déduction dite', () => {
    const v = valeursDeCatalogueMalt('Pilsner Malz');
    expect(v?.valeurs).toMatchObject({ colorEbc: 3.5, potentialPpg: 35.2 });
    expect(v?.source).toMatch(/Weyermann/);
    expect(v?.deduit.potentialPpg).toMatch(/80,5 %/);
  });
  it('un malt hors table : rien (inconnu, jamais 0)', () => {
    expect(valeursDeCatalogueMalt('Castle Chateau Pilsen')).toBeUndefined();
    expect(valeursDeCatalogueMalt('Cascade')).toBeUndefined();
  });
  it('un malt d\'un autre malteur écrit dans le nom ne reçoit pas la référence de Weyermann', () => {
    expect(valeursDeCatalogueMalt('Castle Pilsner Malz')).toBeUndefined();
    expect(valeursDeCatalogueMalt('Weyermann Pilsner Malz')?.valeurs.colorEbc).toBe(3.5);
  });
});

describe('TL-10 : la procédure remplit un malt de la table par le catalogue', () => {
  it('Pilsner Malz acheté : EBC 3,5 et PPG 35,2 sur la fiche, par « catalogue », sans recherche', async () => {
    banc = monter();
    const d = saisie([ligne('l1', 'Pilsner Malz', 'kg', 25, { stockCategory: 'Malt' })]);
    await confirmer(d);
    const malt = lu(`MP-${d.submissionId}-0`)!;
    expect(banc.recherche).not.toHaveBeenCalled();
    expect(malt.colorEbc).toBe(3.5);
    expect(malt.potentialPpg).toBe(35.2);
    expect(malt.fiche.remplis.colorEbc).toMatchObject({ par: 'catalogue', source: expect.stringMatching(/Weyermann/), valeur: 3.5, deduit: expect.stringMatching(/2,5 à 4,5/) });
    expect(malt.fiche.remplis.potentialPpg).toMatchObject({ par: 'catalogue', valeur: 35.2 });
  });
  it('un malt hors table (Castle Chateau Pilsen) : rien d\'écrit, ni 0 ni valeur de Weyermann', async () => {
    banc = monter();
    const d = saisie([ligne('l1', 'Castle Chateau Pilsen', 'kg', 25, { stockCategory: 'Malt' })]);
    await confirmer(d);
    const malt = lu(`MP-${d.submissionId}-0`)!;
    expect(malt.colorEbc).toBeUndefined();
    expect(malt.potentialPpg).toBeUndefined();
  });
  it('une valeur saisie prime : un EBC lu sur la facture n\'est pas écrasé', async () => {
    banc = monter();
    const d = saisie([ligne('l1', 'Pilsner Malz 4 EBC', 'kg', 25, { stockCategory: 'Malt' })]);
    await confirmer(d);
    const malt = lu(`MP-${d.submissionId}-0`)!;
    expect(malt.colorEbc).toBe(4);
  });
});
