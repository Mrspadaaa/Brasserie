import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie f4-enrichir, la file (PLAN § 8.2 `file.test.ts`, R1 à R14 et le plafond). Stock et Firestore simulés, Gemini jamais appelé, horloge injectée.
 */
vi.mock('../../../../src/services/storage', async () => (await import('./aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { etat, lu, putsF4, remettre, RejetEcriture } from './aide';
import { confirmer, demonter, ligne, monter, saisie, travail, type Banc } from './montage';
import * as f4 from '../../../../src/services/enrichissement';
import * as entry from '../../../../src/services/purchaseEntry';
import { PLAFOND_JOUR, jourDeZurich } from '../../../../src/services/enrichissementReglages';

let banc: Banc;
beforeEach(() => { remettre(); banc = monter(); ia.run.mockClear(); });
afterEach(() => { demonter(); vi.unstubAllGlobals(); });

const JOUR = 86_400_000;
const ambre = (id = 'l1', more = {}) => ligne(id, 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60', ...more });
const tourner = async () => { await f4.runEnrichissement('banc'); await f4.enrichissementAuRepos(); };
const compteur = async () => banc.store.compteur.get(jourDeZurich(banc.horloge.ms));

describe('R1 : double « Confirmer »', () => {
  it('deux `planifier` de la même saisie → un travail, une recherche', async () => {
    const d = saisie([ambre()]);
    entry.savePurchase(d);
    f4.planifierEnrichissement(d); f4.planifierEnrichissement(d);
    await f4.enrichissementAuRepos(); await tourner();
    expect(banc.store.rows.travaux.size).toBe(1);
    expect(banc.recherche).toHaveBeenCalledTimes(1);
  });
});

describe('R2, R2b : écriture de l’article non confirmée', () => {
  it('R2 : `pending` sans accusé → attend, rien écrit ; accusé reçu → fait', async () => {
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    etat.statuts.set(`stockItems/${ref}`, 'pending');
    etat.attendre = async () => { throw new Error('Confirmation serveur en attente.'); };
    await confirmer(d);
    expect((await travail(banc, ref))!.etat).toBe('attend');
    expect(putsF4()).toHaveLength(0);
    expect(banc.recherche).not.toHaveBeenCalled();
    etat.statuts.set(`stockItems/${ref}`, 'confirmed');
    await tourner();
    expect((await travail(banc, ref))!.etat).toBe('fait');
  });
  it('R2b : redémarrage hors ligne (`unknown`) → attend, aucune attente du serveur, rien compté', async () => {
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    etat.statuts.set(`stockItems/${ref}`, 'unknown');
    vi.stubGlobal('navigator', { onLine: false });
    const attendre = vi.fn(async () => ({}));
    etat.attendre = attendre;
    await confirmer(d);
    expect((await travail(banc, ref))!.etat).toBe('attend');
    expect(attendre).not.toHaveBeenCalled();
    expect(await compteur()).toBeUndefined();
    vi.stubGlobal('navigator', { onLine: true });
    await tourner();
    expect(attendre).toHaveBeenCalled();
    expect((await travail(banc, ref))!.etat).toBe('fait');
  });
});

describe('R3, R4, R13 : article supprimé, dépense rejetée, rejeu', () => {
  it('R3 : article supprimé avant le travail → abandonne, aucun `put`', async () => {
    const d = saisie([ambre()]);
    const tenue = f4.tenirEnrichissement();
    await confirmer(d, { tourner: false });
    etat.stocks = etat.stocks.filter(s => !s.ref.startsWith(`MP-${d.submissionId}`));
    tenue(); await f4.enrichissementAuRepos();
    expect(await travail(banc, `MP-${d.submissionId}-0`)).toMatchObject({ etat: 'abandonne', raison: 'supprime' });
    expect(putsF4()).toHaveLength(0);
    expect(banc.recherche).not.toHaveBeenCalled();
  });
  it('R3 : article supprimé pendant l’attente de l’accusé → abandonne, aucun `put`', async () => {
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    etat.statuts.set(`stockItems/${ref}`, 'pending');
    etat.attendre = async () => { etat.stocks = etat.stocks.filter(s => s.ref !== ref); return {}; };
    await confirmer(d);
    expect(await travail(banc, ref)).toMatchObject({ etat: 'abandonne', raison: 'supprime' });
    expect(putsF4()).toHaveLength(0);
  });
  it('R4 puis R13 : dépense rejetée → abandonne (rejet) ; rejeu réussi → réarmé, fait', async () => {
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    etat.statuts.set(`transactions/TX-${d.submissionId}`, 'pending');
    etat.attendre = async nom => { if (nom === 'transactions') throw new RejetEcriture('refusée'); return {}; };
    await confirmer(d);
    expect(await travail(banc, ref)).toMatchObject({ etat: 'abandonne', raison: 'rejet' });
    expect(putsF4()).toHaveLength(0);
    etat.statuts.set(`transactions/TX-${d.submissionId}`, 'confirmed');
    etat.attendre = async () => ({});
    f4.planifierEnrichissement(d);
    await f4.enrichissementAuRepos(); await tourner();
    expect((await travail(banc, ref))!.etat).toBe('fait');
    expect((await travail(banc, ref))!.raison).toBeUndefined();
  });
  it('un état fini n’est pas réarmé par un second `planifier`', async () => {
    const d = saisie([ambre()]);
    await confirmer(d);
    f4.planifierEnrichissement(d);
    await f4.enrichissementAuRepos(); await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(1);
  });
});

describe('R5 : `found: false`', () => {
  it('introuvable ; le même produit n’est pas re-cherché avant 30 jours, puis l’est', async () => {
    const a = saisie([ligne('l1', 'Weyermann Spezial du Banc', 'kg', 5, { stockCategory: 'Malt' })]);
    await confirmer(a);
    expect((await travail(banc, `MP-${a.submissionId}-0`))!.etat).toBe('introuvable');
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect(lu(`MP-${a.submissionId}-0`)!.potentialPpg).toBeUndefined();
    banc.horloge.ms += 10 * JOUR;
    await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    banc.horloge.ms += 21 * JOUR;
    await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(2);
  });
});

describe('R6 : échecs comptés et non comptés', () => {
  it('trois jours de délai → echec (troisJours), relançable', async () => {
    banc = monter({ recherche: async () => ({ ok: false, error: 'Le serveur IA n’a pas répondu à temps. L’appel a pu être compté dans le budget IA ; réessaie plus tard.' }) });
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    await confirmer(d);
    expect((await travail(banc, ref))!.etat).toBe('attend');
    banc.horloge.ms += JOUR; await tourner();
    expect((await travail(banc, ref))!.etat).toBe('attend');
    banc.horloge.ms += JOUR; await tourner();
    expect(await travail(banc, ref)).toMatchObject({ etat: 'echec', raison: 'troisJours' });
    expect(banc.recherche).toHaveBeenCalledTimes(3);
    expect(await f4.relancerFiche(ref)).toBe(true);
    await f4.enrichissementAuRepos();
    expect((await travail(banc, ref))!.essais.joursEchec).toHaveLength(1);
  });
  it('six échecs réseau sur six jours → toujours attend, 0 au plafond', async () => {
    banc = monter({ recherche: async () => ({ ok: false, error: 'Service IA momentanément indisponible.' }) });
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    await confirmer(d);
    for (let i = 0; i < 5; i++) { banc.horloge.ms += JOUR; await tourner(); }
    expect(banc.recherche).toHaveBeenCalledTimes(6);
    expect((await travail(banc, ref))!.etat).toBe('attend');
    expect((await compteur())!.recherches).toBe(0);
  });
  it('deux essais d’un même travail dans la même vie de page : 30 minutes au moins', async () => {
    banc = monter({ recherche: async () => ({ ok: false, error: 'Service IA momentanément indisponible.' }) });
    await confirmer(saisie([ambre()]));
    banc.horloge.ms += 10 * 60_000; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    banc.horloge.ms += 25 * 60_000; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(2);
  });
  it('R14 : quota → plafond jusqu’au lendemain, puis repris', async () => {
    let n = 0;
    banc = monter({ recherche: async req => (n++ === 0 ? { ok: false, error: 'Quota IA atteint. Réessaie plus tard.' } : (await import('./montage')).reponseSimulee(req)) });
    const d = saisie([ambre()]);
    const ref = `MP-${d.submissionId}-0`;
    await confirmer(d);
    expect(await travail(banc, ref)).toMatchObject({ etat: 'plafond' });
    banc.horloge.ms += 60 * 60_000; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    banc.horloge.ms += JOUR; await tourner();
    expect((await travail(banc, ref))!.etat).toBe('fait');
  });
});

describe(`Plafond : ${PLAFOND_JOUR} recherches arrivées par jour`, () => {
  it('la suivante du jour attend le lendemain', async () => {
    expect(PLAFOND_JOUR).toBe(30);
    const lignes = Array.from({ length: PLAFOND_JOUR + 1 }, (_, i) => ligne(`l${i}`, `Weyermann Essai${i} du Banc`, 'kg', 1, { stockCategory: 'Malt' }));
    const d = saisie(lignes);
    await confirmer(d);
    expect(banc.recherche).toHaveBeenCalledTimes(PLAFOND_JOUR);
    expect(await travail(banc, `MP-${d.submissionId}-${PLAFOND_JOUR}`)).toMatchObject({ etat: 'plafond' });
    banc.horloge.ms += JOUR; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(PLAFOND_JOUR + 1);
  });
});

describe('R7 : import du catalogue en échec', () => {
  it('attend (jamais introuvable), puis fait au réveil suivant', async () => {
    banc = monter({ cataloguesEnEchec: { n: 1 } });
    const d = saisie([ligne('l1', 'LALLEMAND Windsor 11g', 'Stk', 2, { stockCategory: 'Levure' })]);
    const ref = `MP-${d.submissionId}-0`;
    await confirmer(d, { tourner: false });
    expect((await travail(banc, ref))!.etat).toBe('attend');
    await tourner();
    expect(lu(ref)!.fiche).toMatchObject({ id: 'levure:lalbrew-windsor' });
  });
});

describe('R8 : feuille Dépense montée', () => {
  it('tenue → rien ; libérée → fait (la libération est le cleanup de `useEffect`)', async () => {
    const tenue = f4.tenirEnrichissement();
    const d = saisie([ambre()]);
    await confirmer(d);
    expect((await travail(banc, `MP-${d.submissionId}-0`))!.etat).toBe('attend');
    expect(f4.enrichissementTenu()).toBe(true);
    tenue(); tenue();
    expect(f4.enrichissementTenu()).toBe(false);
    await f4.enrichissementAuRepos();
    expect((await travail(banc, `MP-${d.submissionId}-0`))!.etat).toBe('fait');
  });
});

describe('R9 : houblon', () => {
  it('hors catalogue : jamais d’appel, jamais d’α écrit, à saisir (horsCatalogue)', async () => {
    const d = saisie([ligne('h1', 'Houblon du Banc 9.5%', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    expect(banc.recherche).not.toHaveBeenCalled();
    expect(await travail(banc, `MP-${d.submissionId}-0`)).toMatchObject({ etat: 'aSaisir', raison: 'horsCatalogue' });
    for (const [, , patch] of putsF4()) expect(Object.keys(patch)).not.toContain('alphaPct');
  });
});

describe('R10, R11 : levures', () => {
  it('R10 : le nom publié d’une levure du catalogue → lien au catalogue, ses valeurs priment', async () => {
    banc = monter({ recherche: async () => ({ ok: true, data: { found: true, name: 'LalBrew Windsor', source: 'Fiche en ligne', lab: 'Autre labo', tempMinC: 10, tempMaxC: 30 } as any }) });
    const d = saisie([ligne('l1', 'Levure anglaise X 12', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const item = lu(`MP-${d.submissionId}-0`)!;
    expect(item.fiche).toMatchObject({ id: 'levure:lalbrew-windsor', par: 'catalogue' });
    expect(item.fiche.remplis.yeastLab.par).toBe('catalogue');
    expect(item.yeastLab).not.toBe('Autre labo');
  });
  it('une levure absente du catalogue est remplie en ligne (`par: en-ligne`, repris)', async () => {
    const d = saisie([ligne('l1', 'Levure du Banc 7', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const item = lu(`MP-${d.submissionId}-0`)!;
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect(item.fiche).toMatchObject({ par: 'en-ligne' });
    expect(item.yeastLab).toBe('Levures du Banc');
    expect(item.fiche.remplis.yeastLab).toMatchObject({ par: 'en-ligne', niveau: 'repris' });
  });
  it('R11 : levure ambiguë → aucun lien, aucun appel, candidats gardés dans le travail', async () => {
    f4.setCataloguesFiche(async () => {
      const m = await import('../../../../src/services/enrichissementCatalogues');
      const construites = [{ id: 'banc-house-a', name: 'Banc House A', aliases: ['House Ale'] }, { id: 'banc-house-b', name: 'Banc House B', aliases: ['House Ale'] }];
      return { ...m, referencesLevures: async () => [...(await m.referencesLevures()), ...construites] };
    });
    const d = saisie([ligne('l1', 'House Ale', 'Stk', 1, { stockCategory: 'Levure' })]);
    await confirmer(d);
    const t = await travail(banc, `MP-${d.submissionId}-0`);
    expect(t).toMatchObject({ etat: 'aControler', raison: 'ambigu' });
    expect(t!.candidats).toEqual(expect.arrayContaining(['banc-house-a', 'banc-house-b']));
    expect(lu(`MP-${d.submissionId}-0`)!.fiche).toBeUndefined();
    expect(banc.recherche).not.toHaveBeenCalled();
  });
});

describe('M1 (REVUE-code) : un travail qui lève', () => {
  it('ne bloque pas le suivant, et la recherche payante n’est pas refaite', async () => {
    f4.setCataloguesFiche(async () => {
      const m = await import('../../../../src/services/enrichissementCatalogues');
      return { ...m, valeursDeReponse: (famille: any, brute: any) => { if (brute?.name === 'Ambre 60') throw new Error('réponse mal formée (banc)'); return m.valeursDeReponse(famille, brute); } };
    });
    const d = saisie([ambre('l1'), ligne('l2', 'Weyermann Spezial du Banc', 'kg', 5, { stockCategory: 'Malt' })]);
    await confirmer(d);
    expect(await travail(banc, `MP-${d.submissionId}-1`)).toMatchObject({ etat: 'introuvable' });
    const fautif = (await travail(banc, `MP-${d.submissionId}-0`))!;
    expect(fautif.etat).toBe('attend');
    expect(fautif.essais.dernier).toBe(banc.horloge.ms);
    expect(banc.recherche).toHaveBeenCalledTimes(2);
    banc.horloge.ms += JOUR; await tourner();
    banc.horloge.ms += JOUR; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(2);
    expect(await travail(banc, `MP-${d.submissionId}-0`)).toMatchObject({ etat: 'echec', raison: 'troisJours' });
  });
});

describe('D1 (REVUE-code) : hors ligne, rien n’est écrit, même une dépense déjà confirmée', () => {
  it('écritures `confirmed`, réseau coupé → attend, aucun `put`, aucune recherche', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    const d = saisie([ligne('l1', 'LALLEMAND Windsor 11g', 'Stk', 2, { stockCategory: 'Levure' }), ambre('l2')]);
    await confirmer(d);
    expect((await travail(banc, `MP-${d.submissionId}-0`))!.etat).toBe('attend');
    expect(putsF4()).toHaveLength(0);
    expect(banc.recherche).not.toHaveBeenCalled();
  });
});

describe('D2 (REVUE-code) : le catalogue des levures ne se charge que pour une levure', () => {
  it('une saisie de malt et de houblon ne lit pas `referencesLevures`', async () => {
    const espion = vi.fn();
    f4.setCataloguesFiche(async () => {
      const m = await import('../../../../src/services/enrichissementCatalogues');
      const { DONNEES_FIXTURE } = await import('../../../../src/domain/hopIndex/v4/data');
      return { ...m, referencesLevures: () => { espion(); return m.referencesLevures(); }, cataloguePleinHoublons: async () => DONNEES_FIXTURE.catalogue };
    });
    await confirmer(saisie([ambre(), ligne('h1', 'Cascade US', 'g', 100, { stockCategory: 'Houblon' })]));
    expect(espion).not.toHaveBeenCalled();
  });
  it('le module des catalogues n’importe pas statiquement le catalogue des levures (seulement par `import()`)', async () => {
    const fs = await import('node:fs');
    const code = fs.readFileSync(new URL('../../../../src/services/enrichissementCatalogues.ts', import.meta.url), 'utf8');
    expect(code).not.toMatch(/^import [^;]*(yeastReferences|localIngredientFacts)/m);
  });
});

describe('R12 : sans IndexedDB', () => {
  it('`planifier`, `tenir` et `start` sans effet ni erreur', async () => {
    f4.setEnrichissementStore(null);
    const d = saisie([ambre()]);
    entry.savePurchase(d);
    expect(() => f4.planifierEnrichissement(d)).not.toThrow();
    const tenue = f4.tenirEnrichissement(); tenue();
    expect(f4.startEnrichissement()).toBeTypeOf('function');
    await f4.enrichissementAuRepos();
    expect(banc.store.rows.travaux.size).toBe(0);
    expect(putsF4()).toHaveLength(0);
  });
  it('`planifier` ne lève jamais, même sur un brouillon cassé', () => {
    expect(() => f4.planifierEnrichissement(undefined as any)).not.toThrow();
    expect(() => f4.planifierEnrichissement({ lines: [{ stockAction: 'new' }] } as any)).not.toThrow();
  });
});

describe('Résumé et « Vu »', () => {
  it('le résumé compte les travaux finis non annoncés ; `marquerResumeVu` les annonce ; « Vu » rend la valeur sûre', async () => {
    const d = saisie([ambre(), ligne('h1', 'Houblon du Banc', 'g', 50, { stockCategory: 'Houblon' })]);
    await confirmer(d);
    expect(await f4.resumeEnrichissement()).toMatchObject({ remplies: 1, aSaisir: 1 });
    await f4.marquerResumeVu();
    expect(await f4.resumeEnrichissement()).toMatchObject({ remplies: 0, aSaisir: 0 });
    const ref = `MP-${d.submissionId}-0`;
    const { niveauxDeFiche } = await import('../../../../src/domain/stock/ficheValeurs');
    expect(niveauxDeFiche(lu(ref)!, 'malt').potentialPpg.niveau).toBe('repris');
    expect(f4.marquerFicheVue(ref, banc.horloge.ms + 1000)).toBe(true);
    // « peut être calculé » (déduit) reste jaune jusqu'à « Vu », puis devient sûr.
    expect(niveauxDeFiche(lu(ref)!, 'malt').potentialPpg.niveau).toBe('sur');
  });
});
