import { beforeEach, describe, expect, it, vi } from 'vitest';
/** Plan § D-e (voie n1-nom-fr) : la clé de fiche f4 reste celle du nom imprimé ; le nom français ne la change pas. */
vi.mock('../../../../src/services/storage', async () => (await import('./ecriture-aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./ecriture-aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./ecriture-aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./ecriture-aide')).documentsSimules);
import { travauxDeLaSaisie } from '../../../../src/services/enrichissement';
import { remettre, saisie } from './ecriture-aide';
import { brouillon } from './aide';

beforeEach(remettre);

describe('la clé f4 sur l\'imprimé', () => {
  it('avec et sans nameFr : cle, nomPropre et verdict s6 identiques', () => {
    const sans = travauxDeLaSaisie(saisie([brouillon('l1', 'Wiener Malz', { nomLu: 'Wiener Malz' })]), [], 'uid', 0)[0];
    const avec = travauxDeLaSaisie(saisie([brouillon('l1', 'Wiener Malz', { nomLu: 'Wiener Malz', nameFr: 'Malt de Vienne' })]), [], 'uid', 0)[0];
    expect(sans.cle).toBe('malt||malz wiener');
    expect(avec.cle).toBe(sans.cle);
    expect(avec.ligne.nomPropre).toBe(sans.ligne.nomPropre);
    expect(avec.s6.cas).toBe(sans.s6.cas);
  });
});
