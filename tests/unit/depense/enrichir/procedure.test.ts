import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie f4-enrichir, la procédure de bout en bout (PLAN § 8.2 `procedure.test.ts`) : la vraie `savePurchase`, puis `planifierEnrichissement`, puis la
 * file. Stock et Firestore simulés (`aide.ts`), Gemini jamais appelé (recherche rejouée ; `AiClient.run` espionné), aucune donnée réelle.
 */
vi.mock('../../../../src/services/storage', async () => (await import('./aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { etat, lu, putsF4, remettre } from './aide';
import { confirmer, demonter, ligne, monter, saisie, travail, SOURCE_AMBRE, URL_AMBRE, type Banc } from './montage';
import { DEDUIT_PPG } from '../../../../src/services/enrichissementCatalogues';
import { niveauxDeFiche } from '../../../../src/domain/stock/ficheValeurs';

let banc: Banc;
beforeEach(() => { remettre(); banc = monter(); ia.run.mockClear(); });
afterEach(() => demonter());

const INTERDITS = ['currentStock', 'name', 'unit', 'category', 'alphaPct', 'yeastLot', 'yeastNotes', 'supplier', 'origin', 'minStock'];
const aucunChampInterdit = () => { for (const [, , patch] of putsF4()) for (const k of INTERDITS) expect(Object.keys(patch), k).not.toContain(k); };

describe('T2 après la procédure : levure du catalogue, houblon lié, malt rempli en ligne', () => {
  it('Windsor `levure:lalbrew-windsor` (catalogue, sûr), Target lié à sa variété, l’ambre rempli en ligne (repris, peut être calculé, source et URL)', async () => {
    const d = saisie([
      ligne('l1', 'LALLEMAND Windsor 11g', 'Stk', 2, { stockCategory: 'Levure' }),
      ligne('l2', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' }),
      ligne('l3', 'Target 11.3%', 'g', 100, { stockCategory: 'Houblon' }),
    ]);
    await confirmer(d);
    const sub = d.submissionId;
    const windsor = lu(`MP-${sub}-0`)!, ambre = lu(`MP-${sub}-1`)!, target = lu(`MP-${sub}-2`)!;
    expect(windsor.fiche).toMatchObject({ id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue' });
    expect(windsor.yeastLab).toBeTruthy();
    expect(windsor.fiche.remplis.yeastLab).toMatchObject({ par: 'catalogue', niveau: 'sur' });
    expect(windsor.yeastLot).toBeUndefined(); expect(windsor.yeastNotes).toBeUndefined();
    expect(target.fiche).toMatchObject({ par: 'catalogue' });
    expect(target.fiche.id).toMatch(/target/);
    expect(target.alphaPct).toBe(11.3);
    expect(ambre.potentialPpg).toBe(33);
    expect(ambre.fiche).toMatchObject({ par: 'en-ligne', approchee: false });
    expect(ambre.fiche.id).toMatch(/^cle:malt\|/);
    expect(ambre.fiche.remplis.potentialPpg).toMatchObject({ par: 'en-ligne', niveau: 'repris', source: SOURCE_AMBRE, url: URL_AMBRE, deduit: DEDUIT_PPG, valeur: 33 });
    expect(niveauxDeFiche(ambre, 'malt').potentialPpg).toMatchObject({ niveau: 'repris', motif: 'deduit' });
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect(ia.run).not.toHaveBeenCalled();
    aucunChampInterdit();
    expect((await travail(banc, `MP-${sub}-0`))!.etat).toBe('fait');
    expect((await travail(banc, `MP-${sub}-1`))!.etat).toBe('fait');
  });
  it('la requête ne porte ni montant ni adresse : produit, fournisseur, code imprimé, champs manquants', async () => {
    await confirmer(saisie([ligne('l2', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' })]));
    const req = banc.recherche.mock.calls[0][0];
    expect(req).toMatchObject({ kind: 'malt', context: { kind: 'malt', type: 'grain', supplier: 'Fournisseur du Banc', reference: 'MB-A60' } });
    expect(req.context.manquant).toContain('potentiel PPG');
    expect(JSON.stringify(req)).not.toMatch(/amount|montant|CHF|adresse/i);
  });
});

describe('T3 : deux saisies du même produit absent des catalogues : un appel, une fiche', () => {
  it('le premier renommé par lui, la même ligne crée un second article : il reprend la fiche du premier, `par: retenue`', async () => {
    const a = saisie([ligne('l1', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' })]);
    await confirmer(a);
    // `savePurchase` refuse de créer un article qui existe déjà (« relie la ligne ») : le vrai second travail vient d'un article renommé.
    const i = etat.stocks.findIndex(s => s.ref === `MP-${a.submissionId}-0`);
    etat.stocks[i] = { ...etat.stocks[i], name: 'Sac entamé (atelier)' } as any;
    const b = saisie([ligne('l1', 'Malterie du Banc Ambre 60', 'kg', 3, { stockCategory: 'Malt', sourceReference: 'MB-A60' })]);
    await confirmer(b);
    const premier = lu(`MP-${a.submissionId}-0`)!, second = lu(`MP-${b.submissionId}-0`)!;
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect(second.fiche.cle).toBe(premier.fiche.cle);
    expect(second.fiche.par).toBe('retenue');
    expect(second.potentialPpg).toBe(33);
    expect(second.fiche.remplis.potentialPpg).toMatchObject({ par: 'retenue', niveau: 'repris', source: SOURCE_AMBRE });
  });
  it('les deux dans la même saisie : un appel (le cache d’un tour, puis la réponse gardée)', async () => {
    const d = saisie([ligne('l1', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' }),
      ligne('l2', 'Malterie du Banc Ambre 60', 'kg', 2, { stockCategory: 'Malt', sourceReference: 'MB-A60' })]);
    await confirmer(d);
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect(lu(`MP-${d.submissionId}-1`)!.potentialPpg).toBe(33);
  });
});

describe('T3b (D215) : « Münchner Malz » 20 EBC puis la ligne « Münchner Malz 15 EBC » (son « bis »)', () => {
  it('une fiche, un appel au plus ; chacun son EBC lu ; le potentiel du bis en `repris` ; l’écart d’EBC au journal, jamais écrit', async () => {
    const a = saisie([ligne('m1', 'Münchner Malz 20 EBC', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MM-20' })]);
    await confirmer(a);
    const b = saisie([ligne('m1', 'Münchner Malz 15 EBC', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MM-20' })]);
    await confirmer(b);
    const premier = lu(`MP-${a.submissionId}-0`)!, bis = lu(`MP-${b.submissionId}-0`)!;
    expect(bis.name).toBe('Münchner Malz bis');
    expect(banc.recherche.mock.calls.length).toBeLessThanOrEqual(1);
    expect(premier.colorEbc).toBe(20); expect(bis.colorEbc).toBe(15);
    expect(bis.fiche.cle).toBe(premier.fiche.cle);
    expect(bis.fiche.id).toBe('munich-malt');
    expect(bis.potentialPpg).toBe(37);
    expect(bis.fiche.remplis.potentialPpg).toMatchObject({ par: 'retenue', niveau: 'repris' });
    expect(bis.fiche.remplis.colorEbc).toBeUndefined();
    expect(etat.journal.some(e => /Écart non écrit : colorEbc lu 20, trouvé 22/.test(String(e[4])))).toBe(true);
  });
});

describe('« Cascade US » puis « Cascade CH » : une fiche de variété, 0 appel', () => {
  it('même clé, la variété du catalogue, aucune recherche', async () => {
    const a = saisie([ligne('h1', 'Cascade US', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(a);
    const b = saisie([ligne('h1', 'Cascade CH', 'g', 100, { stockCategory: 'Houblon' })]);
    await confirmer(b);
    const us = lu(`MP-${a.submissionId}-0`)!, ch = lu(`MP-${b.submissionId}-0`)!;
    expect(banc.recherche).not.toHaveBeenCalled();
    expect(us.fiche.cle).toBe(ch.fiche.cle);
    expect(us.fiche.id).toMatch(/cascade/); expect(ch.fiche.id).toMatch(/cascade/);
    expect(ch.origin).toBe('CH');
  });
});

describe('Une fiche s6 approchée est gardée : f4 propose, il n’applique jamais seul', () => {
  it('`id` et `approchee` intacts, `propose` posé, `aControler`', async () => {
    const d = saisie([ligne('h1', 'Cascade CH', 'g', 100, { stockCategory: 'Houblon' })]);
    const { tenirEnrichissement, enrichissementAuRepos } = await import('../../../../src/services/enrichissement');
    const tenue = tenirEnrichissement();
    await confirmer(d, { tourner: false });
    // La fiche s6 « ancienne » est posée à la main (le lien d'une version d'avant du catalogue) pendant que la feuille tient la file.
    const ref = `MP-${d.submissionId}-0`;
    const i = etat.stocks.findIndex(s => s.ref === ref);
    etat.stocks[i] = { ...etat.stocks[i], fiche: { id: 'fiche-ancienne', approchee: true } } as any;
    expect((await travail(banc, ref))!.etat).toBe('attend');
    tenue();
    await enrichissementAuRepos();
    const item = lu(ref)!;
    expect(item.fiche).toMatchObject({ id: 'fiche-ancienne', approchee: true, aControler: true });
    expect(item.fiche.propose).toMatch(/cascade/);
    expect(item.fiche.par).toBeUndefined();
    expect((await travail(banc, ref))).toMatchObject({ etat: 'aControler', raison: 'propose' });
  });
});

describe('Un article renommé après la confirmation garde le rapprochement de sa ligne', () => {
  it('« Ma levure anglaise » reçoit quand même la fiche de LALLEMAND Windsor', async () => {
    const d = saisie([ligne('l1', 'LALLEMAND Windsor 11g', 'Stk', 2, { stockCategory: 'Levure' })]);
    const tenue = (await import('../../../../src/services/enrichissement')).tenirEnrichissement();
    await confirmer(d, { tourner: false });
    const ref = `MP-${d.submissionId}-0`;
    const i = etat.stocks.findIndex(s => s.ref === ref);
    etat.stocks[i] = { ...etat.stocks[i], name: 'Ma levure anglaise' } as any;
    tenue();
    const { enrichissementAuRepos } = await import('../../../../src/services/enrichissement');
    await enrichissementAuRepos();
    expect(lu(ref)!.fiche).toMatchObject({ id: 'levure:lalbrew-windsor', par: 'catalogue' });
    expect(lu(ref)!.name).toBe('Ma levure anglaise');
  });
});
