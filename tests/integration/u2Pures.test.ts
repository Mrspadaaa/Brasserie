// @vitest-environment jsdom
/**
 * Voie u2 (jeu en ligne de nuit du 16.11), parties pures : 21 et 27 (le service supprime), 24 (« Prix de 4 ingrédients »),
 * 25 (étiquettes de mois de la frise du solde), 26 (le nom du projet reste tel quel, raccourci par la fin).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { supprimerPlan } from '../../src/ui/finance/prevision/supprimerPlan';
import { titrePrixManquant } from '../../src/ui/finance/budget/libelles';
import { etiquettesAxe } from '../../src/ui/finance/profil/ProfilEffets';
import { nomProjet } from '../../src/ui/finance/previsions/escalier';
import { texteEtiquette, texteLot } from '../../src/ui/finance/previsions/EscalierSvg';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import type { FinancialPlan } from '../../src/domain/finance/types';

afterEach(() => vi.restoreAllMocks());

describe('24 : « Prix de 4 ingrédients », une espace après « de », « 1 ingrédient » au singulier', () => {
  it('pluriel, singulier, noms', () => {
    expect(titrePrixManquant(4, ['Pilsner', 'Saaz', 'Citra', 'S-04'])).toBe('Prix de 4 ingrédients : Pilsner, Saaz…');
    expect(titrePrixManquant(1, ['Saaz'])).toBe('Prix d’1 ingrédient : Saaz'); // m4bb-a (maquette choisie) : « Prix d'1 ingrédient : acide lactique »
    expect(titrePrixManquant(2, ['Saaz', 'Citra'])).toBe('Prix de 2 ingrédients : Saaz, Citra');
    expect(titrePrixManquant(5, [])).not.toMatch(/de5/);
  });
});

describe('25 : la frise du solde dit chaque mois une seule fois', () => {
  const lues = (debut: string, fin: string, long = false) => etiquettesAxe(debut, fin, long);
  it('août au 16 novembre : août, sept., oct., nov. sans répétition (« août août sept. oct. oct. nov. » avant)', () => {
    const e = lues('2026-08-01', '2026-11-16');
    expect(e.map(x => x.texte)).toEqual(['août', 'sept.', 'oct.', 'nov.']);
  });
  it('un début en fin de mois ne colle pas deux étiquettes', () => {
    const e = lues('2026-08-28', '2026-11-16');
    expect(new Set(e.map(x => x.texte)).size).toBe(e.length);
    for (let i = 1; i < e.length; i++) expect(e[i].ratio - e[i - 1].ratio).toBeGreaterThanOrEqual(0.1);
  });
  it('plus d’un an : au plus six étiquettes, l’année en deux chiffres, uniques et dans l’ordre', () => {
    const e = lues('2025-03-01', '2026-11-16', true);
    expect(e.length).toBeLessThanOrEqual(6);
    expect(new Set(e.map(x => x.texte)).size).toBe(e.length);
    expect(e.every(x => /\d\d$/.test(x.texte))).toBe(true);
    expect([...e].sort((a, b) => a.ratio - b.ratio)).toEqual(e);
  });
  it('quelques jours seulement : une seule étiquette, jamais un mois deux fois', () => {
    expect(lues('2026-11-03', '2026-11-16').map(x => x.texte)).toEqual(['nov.']);
  });
});

describe('26 : le projet garde son nom tel quel, raccourci par la fin', () => {
  const projet = (label: string, over: Partial<ForecastItem> = {}): ForecastItem => ({ id: 'p', date: '2026-12-01', label, amountCents: 11_000, direction: 'out', source: 'equipment', category: 'materiel', planId: 'UP', ...over });
  it('nomProjet : entier jusqu’à la limite, sinon la fin remplacée par « … »', () => {
    expect(nomProjet('Hotte', 14)).toBe('Hotte');
    expect(nomProjet('ZZ TEST - Projet materiel', 14)).toBe('ZZ TEST - Pro…');
    expect(nomProjet('  Frigo  ')).toBe('Frigo');
  });
  it('l’étiquette garde « ZZ » et la casse', () => {
    const t = texteEtiquette(projet('ZZ TEST - Projet materiel'));
    expect(t.startsWith('ZZ TEST')).toBe(true);
    expect(t).toContain('…');
    expect(t).toContain('−110');
    expect(texteEtiquette(projet('Hotte inox'))).toBe('Hotte inox −110, 01.12');
  });
  it('le lot de plusieurs sorties du même projet garde aussi sa casse', () => {
    expect(texteLot([projet('Hotte inox', { id: 'a' }), projet('Hotte inox', { id: 'b' })])).toMatch(/^Hotte inox/);
  });
  it('les autres sorties gardent leur mot-clé en minuscules (p5b)', () => {
    expect(texteEtiquette(projet('Loyer de l’atelier', { source: 'recurring' }))).toBe('loyer −110, 01.12');
  });
});

describe('21 et 27 : supprimerPlan', () => {
  const plan = (id: string, over: Partial<FinancialPlan> = {}): FinancialPlan => ({ id, title: 'ZZ TEST — Prévision', date: '2026-12-01', amountCents: 700, direction: 'out', category: 'chargesFixes', source: 'manual', status: 'active', createdAt: '2026-11-16T00:00:00Z', ...over });
  const preparer = (plans: FinancialPlan[], transactions: unknown[] = []) => {
    vi.spyOn(FirestoreRepo, 'all').mockImplementation(((name: string) => name === 'financialPlans' ? plans : []) as never);
    vi.spyOn(StorageService, 'getTransactions').mockReturnValue(transactions as never);
    return vi.spyOn(FirestoreRepo, 'remove').mockImplementation(() => {});
  };
  it('retire le document de la prévision (financialPlans)', () => {
    const remove = preparer([plan('PREV-1')]);
    supprimerPlan('PREV-1');
    expect(remove).toHaveBeenCalledWith('financialPlans', 'PREV-1');
  });
  it('un projet de matériel se supprime de même', () => {
    const remove = preparer([plan('UPGRADE-1', { source: 'equipment', category: 'materiel', upgrade: { version: 1, timing: 'later', stage: 'idea', budgetKnown: true, datePrecision: 'month', estimateSource: 'estimate', purchaseCents: 700 } })]);
    supprimerPlan('UPGRADE-1');
    expect(remove).toHaveBeenCalledWith('financialPlans', 'UPGRADE-1');
  });
  it('une pièce liée à la prévision : refus net, rien n’est retiré (une pièce ne se supprime jamais)', () => {
    const remove = preparer([plan('PREV-2')], [{ id: 'T1', date: '2026-11-10', amountCents: 700, type: 'expense', status: 'active', finance: { planId: 'PREV-2' } }]);
    expect(() => supprimerPlan('PREV-2')).toThrow(/pièce|écriture/i);
    expect(remove).not.toHaveBeenCalled();
  });
  it('un id inconnu ne retire rien', () => {
    const remove = preparer([plan('PREV-1')]);
    supprimerPlan('AUTRE');
    expect(remove).not.toHaveBeenCalled();
  });
});
