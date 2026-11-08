import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie EI (08.11) : le garde-fou de coût `PLAFOND_TENTATIVES` de `enrichissementReglages.ts`, le seul des plafonds de l'enrichissement que
 * les tests de f4 ne verrouillaient pas (`PLAFOND_JOUR`, l'écart de 30 min, les trois jours d'échec, les 30 jours d'un « introuvable » et
 * l'interrupteur `etatDe` le sont déjà : file.test.ts et interrupteur.test.ts). Stock et Firestore simulés, Gemini jamais appelé.
 */
vi.mock('../../../../src/services/storage', async () => (await import('./aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { remettre } from './aide';
import { confirmer, demonter, ligne, monter, saisie, travail, type Banc } from './montage';
import * as f4 from '../../../../src/services/enrichissement';
import { PLAFOND_JOUR, PLAFOND_TENTATIVES, jourDeZurich } from '../../../../src/services/enrichissementReglages';

let banc: Banc;
beforeEach(() => { remettre(); banc = monter(); ia.run.mockClear(); });
afterEach(() => { demonter(); vi.unstubAllGlobals(); });

const JOUR = 86_400_000;
const malt = (id: string, nom: string) => ligne(id, nom, 'kg', 1, { stockCategory: 'Malt', sourceReference: `MB-${id}` });
const tourner = async () => { await f4.runEnrichissement('banc'); await f4.enrichissementAuRepos(); };
const compteur = async () => banc.store.compteur.get(jourDeZurich(banc.horloge.ms));

describe('PLAFOND_TENTATIVES : tentatives parties par jour, quelle qu’en soit l’issue', () => {
  it('la valeur est 20, comme les recherches (D378)', () => {
    expect(PLAFOND_TENTATIVES).toBe(20);
    expect(PLAFOND_JOUR).toBe(20);
  });

  it('à 19, la suivante part et porte le compteur à 20 ; la suivante du jour attend le lendemain, puis part', async () => {
    await banc.store.compteur.put({ jour: jourDeZurich(banc.horloge.ms), recherches: 0, tentatives: PLAFOND_TENTATIVES - 1 });
    const d = saisie([malt('l1', 'Malterie du Banc Ambre 60'), malt('l2', 'Weyermann Autre Essai du Banc')]);
    await confirmer(d);
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect((await compteur())!.tentatives).toBe(PLAFOND_TENTATIVES);
    expect(await travail(banc, `MP-${d.submissionId}-0`)).toMatchObject({ etat: 'fait' });
    expect(await travail(banc, `MP-${d.submissionId}-1`)).toMatchObject({ etat: 'plafond' });
    banc.horloge.ms += 60 * 60_000; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    banc.horloge.ms += JOUR; await tourner();
    expect(banc.recherche).toHaveBeenCalledTimes(2);
    expect(await travail(banc, `MP-${d.submissionId}-1`)).toMatchObject({ etat: 'introuvable' });
  });

  it('une tentative sans réponse du serveur (réseau) compte au garde-fou mais pas aux recherches arrivées', async () => {
    banc = monter({ recherche: async () => ({ ok: false, error: 'Service IA momentanément indisponible.' }) });
    await banc.store.compteur.put({ jour: jourDeZurich(banc.horloge.ms), recherches: 0, tentatives: PLAFOND_TENTATIVES - 1 });
    const d = saisie([malt('l1', 'Malterie du Banc Ambre 60'), malt('l2', 'Weyermann Autre Essai du Banc')]);
    await confirmer(d);
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    const c = (await compteur())!;
    expect(c.tentatives).toBe(PLAFOND_TENTATIVES);
    expect(c.recherches).toBe(0);
    expect(await travail(banc, `MP-${d.submissionId}-1`)).toMatchObject({ etat: 'plafond' });
  });

  it('un compteur d’un autre jour ne bloque pas', async () => {
    await banc.store.compteur.put({ jour: jourDeZurich(banc.horloge.ms - JOUR), recherches: PLAFOND_JOUR, tentatives: PLAFOND_TENTATIVES });
    await confirmer(saisie([malt('l1', 'Malterie du Banc Ambre 60')]));
    expect(banc.recherche).toHaveBeenCalledTimes(1);
  });
});
