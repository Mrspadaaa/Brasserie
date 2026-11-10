import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie n1 (mission parcours-complet) : EN-1 (α du catalogue sur un houblon neuf), EN-2 (malt non reconnu : la fiche le dit),
 * EN-3 (levure complétée, atténuation vide). Stock et Firestore simulés, Gemini jamais appelé (réponses rejouées).
 */
vi.mock('../../../../src/services/storage', async () => (await import('./aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { etat, lu, putsF4, remettre } from './aide';
import { confirmer, demonter, ligne, monter, saisie, travail, type Banc } from './montage';
import * as f4 from '../../../../src/services/enrichissement';
import { DONNEES_FIXTURE, type CatalogueHop } from '../../../../src/domain/hopIndex/v4/data';
import { niveauxDeFiche } from '../../../../src/domain/stock/ficheValeurs';

let banc: Banc;
beforeEach(() => { remettre(); banc = monter(); ia.run.mockClear(); });
afterEach(() => { demonter(); vi.unstubAllGlobals(); });

/** Un houblon du catalogue plein, au format réel (Nelson Sauvin, Beer Maverick : α 10 à 13 %). */
const modele = DONNEES_FIXTURE.catalogue.find(h => /target/.test(h.id))!;
const houblon = (id: string, name: string, origin: string, alpha: [number, number] | null): CatalogueHop => ({ ...modele, id, name, aliases: [], origin, alpha, hs: null });
const NELSON = houblon('beermaverick-nelson-sauvin', 'Nelson Sauvin', 'Nouvelle-Zélande', [10, 13]);
function avecCatalogue(...hops: CatalogueHop[]) {
  f4.setCataloguesFiche(async () => ({ ...(await import('../../../../src/services/enrichissementCatalogues')), cataloguePleinHoublons: async () => [...DONNEES_FIXTURE.catalogue.filter(h => !hops.some(x => x.id === h.id)), ...hops] }));
}
const journal = () => etat.journal.map(a => a.join(' | ')).join('\n');

describe('EN-1 : un houblon lié au catalogue prend son α (champ vide seulement, avec sa source)', () => {
  it('« Nelson Sauvin ZZ » lié à « Nelson Sauvin NZ » : α = milieu de la plage 10 à 13 %, dit comme déduit, source citée', async () => {
    avecCatalogue(NELSON);
    const d = saisie([ligne('h1', 'Nelson Sauvin ZZ', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    const item = lu(ref)!;
    expect(item.fiche).toMatchObject({ id: 'beermaverick-nelson-sauvin', par: 'catalogue' });
    expect(item.alphaPct).toBe(11.5);
    expect(item.fiche.remplis.alphaPct).toMatchObject({ par: 'catalogue', niveau: 'repris', valeur: 11.5 });
    expect(item.fiche.remplis.alphaPct.deduit).toMatch(/milieu.*10.*13/);
    expect(item.fiche.remplis.alphaPct.source).toMatch(/Nelson Sauvin/);
    expect(niveauxDeFiche(item, 'houblon').alphaPct).toMatchObject({ niveau: 'repris', motif: 'deduit' });
    expect(await travail(banc, ref)).toMatchObject({ etat: 'fait', remplis: ['alphaPct'] });
    expect(banc.recherche).not.toHaveBeenCalled();
    expect(journal()).toMatch(/alphaPct/);
  });
  it('une valeur publiée sans plage (point) : α = ce point, sans « milieu »', async () => {
    avecCatalogue(houblon('beermaverick-point-zz', 'Pointzz', 'Allemagne', [9.8, 9.8]));
    const d = saisie([ligne('h1', 'Pointzz', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    const item = lu(`MP-${d.submissionId}-0`)!;
    expect(item.alphaPct).toBe(9.8);
    expect(item.fiche.remplis.alphaPct.deduit).toBeUndefined();
  });
  it('l’α lu sur la facture (« 12% ») n’est jamais écrasé', async () => {
    avecCatalogue(NELSON);
    const d = saisie([ligne('h1', 'Nelson Sauvin 12%', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    const item = lu(`MP-${d.submissionId}-0`)!;
    expect(item.alphaPct).toBe(12);
    expect(item.fiche.remplis?.alphaPct).toBeUndefined();
  });
  it('l’α tapé par le brasseur entre-temps n’est jamais écrasé', async () => {
    avecCatalogue(NELSON);
    const d = saisie([ligne('h1', 'Nelson Sauvin ZZ', 'g', 100, { stockCategory: 'Houblon' })]);
    const tenue = f4.tenirEnrichissement();
    await confirmer(d, { tourner: false });
    const ref = `MP-${d.submissionId}-0`;
    lu(ref)!.alphaPct = 10.4;
    tenue(); await f4.enrichissementAuRepos();
    expect(lu(ref)!.alphaPct).toBe(10.4);
    expect(lu(ref)!.fiche.remplis?.alphaPct).toBeUndefined();
  });
  it('catalogue sans α : rien écrit (jamais 0), la fiche le dit', async () => {
    avecCatalogue(houblon('beermaverick-sans-alpha-zz', 'Sansalphazz', 'Allemagne', null));
    const d = saisie([ligne('h1', 'Sansalphazz', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    expect(lu(ref)!.alphaPct).toBeUndefined();
    expect(await f4.champsASaisir(ref)).toEqual(['alphaPct']);
  });
  it('une variété d’une autre origine (fiche approchée) : pas d’α d’une autre région', async () => {
    avecCatalogue(NELSON);
    const d = saisie([ligne('h1', 'Nelson Sauvin DE', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    const item = lu(`MP-${d.submissionId}-0`)!;
    expect(item.fiche).toMatchObject({ id: 'beermaverick-nelson-sauvin', approchee: true });
    expect(item.alphaPct).toBeUndefined();
    expect(await f4.champsASaisir(`MP-${d.submissionId}-0`)).toEqual(['alphaPct']);
  });
});

describe('EN-2 : un malt non reconnu', () => {
  it('« Maris Otter ZZ » : aucune recherche, rien d’inventé, la fiche dit « à saisir » pour EBC et PPG', async () => {
    const d = saisie([ligne('m1', 'Maris Otter ZZ', 'kg', 25, { stockCategory: 'Malt' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    expect(await travail(banc, ref)).toMatchObject({ etat: 'aSaisir', raison: 'nonIdentifiable' });
    expect(banc.recherche).not.toHaveBeenCalled();
    expect(putsF4()).toHaveLength(0);
    expect(lu(ref)!.colorEbc).toBeUndefined();
    expect(lu(ref)!.potentialPpg).toBeUndefined();
    expect(await f4.champsASaisir(ref)).toEqual(['colorEbc', 'potentialPpg']);
    expect(f4.MOT_A_SAISIR).toBe('à saisir');
    expect(journal()).toMatch(/Maris Otter ZZ.*non reconnu|non reconnu.*Maris Otter ZZ/);
  });
  it('le malt reconnu par la table (« Maris Otter ») et le même nom avec un suffixe inconnu se traitent pareil : aucun n’est cherché en ligne', async () => {
    const d = saisie([ligne('m1', 'Maris Otter', 'kg', 25, { stockCategory: 'Malt' }), ligne('m2', 'Maris Otter ZZ', 'kg', 25, { stockCategory: 'Malt' })]);
    await confirmer(d);
    expect(await travail(banc, `MP-${d.submissionId}-0`)).toMatchObject({ etat: 'aSaisir', raison: 'nonIdentifiable' });
    expect(await travail(banc, `MP-${d.submissionId}-1`)).toMatchObject({ etat: 'aSaisir', raison: 'nonIdentifiable' });
    expect(banc.recherche).not.toHaveBeenCalled();
  });
  it('un malt trouvé en ligne n’a rien « à saisir »', async () => {
    const d = saisie([ligne('m1', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' })]);
    await confirmer(d);
    expect(await f4.champsASaisir(`MP-${d.submissionId}-0`)).toEqual([]);
  });
});

describe('EN-3 : levure complétée, atténuation vide', () => {
  const reponse = (extra: Record<string, unknown>) => async () => ({ ok: true as const, model: 'rejeu-n1', data: {
    found: true, name: 'Levure du Banc ZZ', source: 'Fiche du fabricant du Banc', sourceUrl: 'https://levures-du-banc.test/zz', lab: 'Levures du Banc', form: 'sèche', tempMinC: 18, tempMaxC: 26, ...extra } as any });
  it('la réponse donne un point : atténuation reprise, avec sa source', async () => {
    banc = monter({ recherche: reponse({ attenuationPct: 81 }) });
    const d = saisie([ligne('l1', 'Levure du Banc ZZ', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    const item = lu(ref)!;
    expect(item.yeastAttenuationPct).toBe(81);
    expect(item.fiche.remplis.yeastAttenuationPct).toMatchObject({ par: 'en-ligne', source: 'Fiche du fabricant du Banc', valeur: 81 });
    expect(await f4.champsASaisir(ref)).toEqual([]);
  });
  it('la réponse ne donne qu’une plage (78 à 82 %) : pas de point inventé, ni 0 ; la fiche dit « à saisir » et le journal cite la plage', async () => {
    banc = monter({ recherche: reponse({ technicalFacts: [{ key: 'attenuation', reported: '78-82%', origin: 'manufacturer', range: { min: 78, max: 82 }, unit: '%', qualifier: 'range', source: 'Fiche du fabricant du Banc' }] }) });
    const d = saisie([ligne('l1', 'Levure du Banc ZZ', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    const item = lu(ref)!;
    expect(item.yeastLab).toBe('Levures du Banc');
    expect(item.yeastAttenuationPct).toBeUndefined();
    expect(await f4.champsASaisir(ref)).toEqual(['yeastAttenuationPct']);
    expect(journal()).toMatch(/atténuation.*78.*82/i);
  });
  it('la réponse ne dit rien de l’atténuation : « à saisir », jamais 0', async () => {
    banc = monter({ recherche: reponse({}) });
    const d = saisie([ligne('l1', 'Levure du Banc ZZ', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    expect(lu(ref)!.yeastAttenuationPct).toBeUndefined();
    expect(await f4.champsASaisir(ref)).toEqual(['yeastAttenuationPct']);
  });
  it('une levure du catalogue (« Safale US-05 ») : l’atténuation du catalogue n’est qu’une plage, la fiche le dit', async () => {
    const d = saisie([ligne('l1', 'Safale US-05 11,5 g', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const ref = `MP-${d.submissionId}-0`;
    expect(lu(ref)!.fiche).toMatchObject({ id: 'levure:fermentis-us05' });
    expect(lu(ref)!.yeastAttenuationPct).toBeUndefined();
    expect(await f4.champsASaisir(ref)).toContain('yeastAttenuationPct');
  });
});
