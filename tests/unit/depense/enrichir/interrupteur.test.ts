import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie f4-enrichir, P4 : l'interrupteur de la recherche en ligne, lu à l'appel ; l'exécutant réel interdit en test ; la classe de chaque échec
 * verrouillée sur les textes FIXES d'`AiClient.humanize` (le vrai module : seul `run` est espionné, il ne doit jamais partir).
 */
vi.mock('../../../../src/services/storage', async () => (await import('./aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { lu, remettre } from './aide';
import { confirmer, demonter, ligne, monter, saisie, travail, type Banc } from './montage';
import * as f4 from '../../../../src/services/enrichissement';
import { AiClient } from '../../../../src/services/aiClient';
import { classerEchec, etatDe, etatIA, iaPermise, setEnrichissementIA, SUITE_ECHEC } from '../../../../src/services/enrichissementReglages';

let banc: Banc;
beforeEach(() => { remettre(); ia.run.mockClear(); });
afterEach(() => { demonter(); vi.unstubAllEnvs(); });
const ambre = () => ligne('l1', 'Malterie du Banc Ambre 60', 'kg', 5, { stockCategory: 'Malt', sourceReference: 'MB-A60' });

describe('Éteint : le catalogue marche quand même, aucune recherche', () => {
  it('l’ambre → iaEteinte ; Windsor → fait par le catalogue ; 0 appel', async () => {
    banc = monter({ ia: 'eteinte' });
    const d = saisie([ambre(), ligne('l2', 'LALLEMAND Windsor 11g', 'Stk', 2, { stockCategory: 'Levure' })]);
    await confirmer(d);
    expect((await travail(banc, `MP-${d.submissionId}-0`))!.etat).toBe('iaEteinte');
    expect(lu(`MP-${d.submissionId}-1`)!.fiche).toMatchObject({ id: 'levure:lalbrew-windsor' });
    expect(banc.recherche).not.toHaveBeenCalled();
  });
  it('allumé ensuite : `iaEteinte` repasse `attend` au réveil, puis fait', async () => {
    banc = monter({ ia: 'eteinte' });
    const d = saisie([ambre()]);
    await confirmer(d);
    setEnrichissementIA('emulateur');
    await f4.runEnrichissement('banc'); await f4.enrichissementAuRepos();
    expect((await travail(banc, `MP-${d.submissionId}-0`))!.etat).toBe('fait');
    expect(banc.recherche).toHaveBeenCalledTimes(1);
  });
});

describe('La variable de build (Vite la remplace à la transformation : la règle est testée pure)', () => {
  it('absente → éteinte ; `emulateur` sans émulateurs → éteinte ; avec → permise ; `production` → permise ; autre → éteinte', () => {
    expect(etatDe(undefined, 'true', true)).toBe('eteinte');
    expect(etatDe('', 'true', true)).toBe('eteinte');
    expect(etatDe('emulateur', 'false', true)).toBe('eteinte');
    expect(etatDe('emulateur', undefined, true)).toBe('eteinte');
    expect(etatDe('emulateur', 'true', true)).toBe('emulateur');
    expect(etatDe('production', undefined, false)).toBe('production');
    expect(etatDe('oui', 'true', true)).toBe('eteinte');
    // D3 (REVUE-code) : `firebase.ts` ne branche les émulateurs qu'en DEV ; un build de production avec les deux variables viserait le vrai `aiTask`.
    expect(etatDe('emulateur', 'true', false)).toBe('eteinte');
  });
  it('sans forçage, le build de test (variable absente) est éteint ; le forçage est lu à l’appel', () => {
    setEnrichissementIA(null);
    expect(iaPermise()).toBe(false);
    setEnrichissementIA('production');
    expect(etatIA()).toBe('production');
    setEnrichissementIA(null);
    expect(etatIA()).toBe('eteinte');
  });
});

describe('Allumé sans exécutant injecté, en test : il lève, rien ne part', () => {
  it('`ExecutantInterdit`, `AiClient.run` jamais appelé, aucune tentative comptée', async () => {
    banc = monter();
    f4.setRechercheFiche(null);
    expect(() => f4.executantDeRecherche()).toThrow(f4.ExecutantInterdit);
    const tenue = f4.tenirEnrichissement();
    const d = saisie([ambre()]);
    await confirmer(d, { tourner: false });
    tenue();
    await expect(f4.runEnrichissement('banc')).rejects.toThrow(/interdit en test/);
    expect(ia.run).not.toHaveBeenCalled();
    // D5 (REVUE-code) : le magasin du compteur est vide (pas « tous à 0 » sur un magasin vide).
    expect(banc.store.rows.compteur.size).toBe(0);
    expect((await travail(banc, `MP-${d.submissionId}-0`))!.etat).toBe('attend');
  });
});

describe('classerEchec, sur chaque texte d’`AiClient.humanize`', () => {
  const cas: Array<[string, string]> = [
    ['functions/unauthenticated', 'session'], ['functions/permission-denied', 'refus'], ['functions/failed-precondition', 'config'],
    ['functions/resource-exhausted', 'quota'], ['functions/deadline-exceeded', 'delai'], ['functions/unavailable', 'reseau'],
    ['functions/internal', 'reseau'], ['functions/not-found', 'sansDetail'],
  ];
  for (const [code, classe] of cas) it(`${code} → ${classe}`, () => {
    expect(classerEchec(AiClient.humanize({ code }))).toBe(classe);
  });
  it('une fiche de levure refusée par la garde d’`AiClient.run` → inexploitable (introuvable, compte au plafond, pas un jour d’échec)', async () => {
    const { yeastLookupResultError } = await import('../../../../functions/src/yeastLookupResult');
    for (const brut of [{}, { found: true, sourceUrl: 'https://banc.test/fiche' }, { found: true, technicalFacts: [{ acceptedScalarFields: [] }] }]) {
      const texte = yeastLookupResultError(brut);
      expect(texte).toBeTruthy();
      expect(classerEchec(texte)).toBe('inexploitable');
    }
    expect(SUITE_ECHEC.inexploitable).toEqual({ plafond: true, jour: false, etat: 'introuvable' });
  });
  it('un texte inconnu compte (prudence sur le coût) ; le réseau et la session ne comptent pas', () => {
    expect(classerEchec('Autre chose')).toBe('autre');
    expect(SUITE_ECHEC.autre).toMatchObject({ plafond: true, jour: true });
    expect(SUITE_ECHEC.reseau).toMatchObject({ plafond: false, jour: false, etat: 'attend' });
    expect(SUITE_ECHEC.session).toMatchObject({ plafond: false, jour: false, etat: 'attend' });
    expect(SUITE_ECHEC.quota).toMatchObject({ plafond: true, jour: false, etat: 'plafond' });
  });
});
