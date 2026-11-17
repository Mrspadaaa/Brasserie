import { describe, expect, it } from 'vitest';
import type { Batch } from '../../src/types';
import type { FinanceTransaction, FinancialPlan, FinancialProfile } from '../../src/domain/finance/types';
import { buildForecast } from '../../src/domain/finance/forecast';
import { brassinsHabituels, echeancesProposees } from '../../src/domain/calendrierPropositions';
import * as module from '../../src/domain/calendrierPropositions';
import { texteDuree } from '../../src/domain/calendrier';

const lot = (id: string, brewDate: string, p: Partial<Batch> = {}) =>
  ({ id, name: 'IPA maison', style: 'IPA', volumeL: 30, brewDate, status: 'termine', recipeRef: 'R-IPA', ...p }) as Batch;
/** Brassée les 6 janv., 3 mars et 28 avr. 2026 : des écarts de 56 j. */
const TROIS = [lot('LOT-1', '2026-01-06'), lot('LOT-2', '2026-03-03'), lot('LOT-3', '2026-04-28')];
const JOUR = '2026-05-15';

describe('A14 : brassins habituels (E47 b)', () => {
  it('trois brassages à 56 j : une proposition probable, la semaine du lundi 2026-06-22 (28 avr. + 56 j = 23 juin)', () => {
    const sortie = brassinsHabituels(TROIS, JOUR);
    expect(sortie).toHaveLength(1);
    expect(sortie[0]).toMatchObject({ proposition: 'brassin-habituel', recipeRef: 'R-IPA', probable: true, rangee: 'brassins', debut: '2026-06-22', titre: 'IPA maison' });
    expect(sortie[0].detail).toContain('tous les 56 j');
  });

  it('CRITIQUE-2 n° 2 : la durée vient de la recette figée du dernier brassin ; sans elle, ni « J0 » ni « prête »', () => {
    expect(texteDuree(brassinsHabituels(TROIS, JOUR)[0])).toBeNull();
    const recette = { fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 14 }, { kind: 'garde', name: 'Garde', tempC: 4, days: 14 }] } as unknown as Batch['recipeSnapshot'];
    const avec = brassinsHabituels([TROIS[0], TROIS[1], lot('LOT-3', '2026-04-28', { recipeSnapshot: recette })], JOUR)[0];
    expect(avec).toMatchObject({ debut: '2026-06-22', preteLe: '2026-07-20', fin: '2026-07-20' });
    expect(texteDuree(avec)).toBe('J0 / 28 · prête 20 juil.');
  });
  it('une recette brassée une seule fois ne rend rien (liste vide, jamais un intervalle de 0) ; deux brassages le même jour non plus', () => {
    expect(brassinsHabituels([TROIS[0]], JOUR)).toEqual([]);
    expect(brassinsHabituels([lot('A', '2026-01-06'), lot('B', '2026-01-06')], JOUR)).toEqual([]);
    expect(brassinsHabituels([], JOUR)).toEqual([]);
  });
  it('un Batch de la même recette planifié après le dernier brassage : rien', () => {
    const planifie = lot('LOT-4', '', { status: 'planifie', plannedBrewDate: '2026-06-01' });
    expect(brassinsHabituels([...TROIS, planifie], JOUR)).toEqual([]);
    // planifié AVANT le dernier brassage : ne bloque pas
    expect(brassinsHabituels([...TROIS, lot('LOT-5', '', { status: 'planifie', plannedBrewDate: '2026-04-01' })], JOUR)).toHaveLength(1);
  });
  it('un brassin archivé ou annulé ne compte pas', () => {
    expect(brassinsHabituels([TROIS[0], TROIS[1], lot('LOT-3', '2026-04-28', { archivedAt: '2026-05-01' })], JOUR)).toHaveLength(1); // 6 janv. + 3 mars : 56 j, depuis le 3 mars → 28 avr.
    expect(brassinsHabituels([TROIS[0], lot('LOT-2', '2026-03-03', { archivedAt: '2026-05-01' }), lot('LOT-3', '2026-04-28', { status: 'annule' })], JOUR)).toEqual([]);
  });
  it('une date déjà passée se pose cette semaine, jamais dans le passé', () => {
    const sortie = brassinsHabituels(TROIS, '2026-08-10');
    expect(sortie[0].debut).toBe('2026-08-10');
  });
  it('chaque recette a sa proposition ; aucune proposition « frigo » ni « saison » n’existe dans le module', () => {
    const autre = [lot('S-1', '2026-02-02', { recipeRef: 'R-STOUT', name: 'Stout' }), lot('S-2', '2026-03-02', { recipeRef: 'R-STOUT', name: 'Stout' })];
    expect(brassinsHabituels([...TROIS, ...autre], JOUR).map(p => p.recipeRef)).toEqual(['R-IPA', 'R-STOUT']);
    expect(Object.keys(module).join(' ')).not.toMatch(/frigo|saison/i);
    expect(JSON.stringify(brassinsHabituels([...TROIS, ...autre], JOUR))).not.toMatch(/frigo|saison/i);
  });
});

const profile: FinancialProfile = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-06-01' };
const expense = (id: string, date: string): FinanceTransaction => ({ id, date, description: 'Loyer', category: 'chargesFixes', subcategory: 'Local', amountHT: 50, amountTTC: 50, tvaAmount: 0, tvaRate: 0, finance: { version: 1, kind: 'expense', amountCents: 5000, lines: [], paymentStatus: 'unknown' } });
const loyer: FinancialPlan = { id: 'PLAN', date: '2026-09-01', title: 'Loyer', direction: 'out', amountCents: 5000, status: 'active', category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' }, createdAt: '2026-09-01T00:00:00Z' };

describe('A14 : échéances (E47 c)', () => {
  it('l’occurrence du mois payé quitte la prévision ; celle du mois suivant est marquée « echeance », pas les factures ni les plans', () => {
    const payee = expense('CURRENT', '2026-09-01'); payee.finance!.planId = 'PLAN'; payee.finance!.occurrenceId = 'PLAN:2026-09-01';
    const facture = expense('FACT', '2026-09-03'); facture.finance!.paymentStatus = 'unpaid'; facture.finance!.dueDate = '2026-09-20';
    const ponctuel: FinancialPlan = { ...loyer, id: 'UNIQUE', title: 'Machine', recurrence: undefined, source: 'manual', category: 'materiel', date: '2026-09-25' };
    const prevision = buildForecast({
      transactions: [payee, facture], plans: [loyer, ponctuel], profile, asOf: '2026-09-09', months: 3,
      payments: [{ id: 'PAY', transactionId: payee.id, date: '2026-09-02', amountCents: 5000, direction: 'out', method: 'bank', recordedAt: '2026-09-02T10:00:00Z' }]
    });
    const marquees = echeancesProposees(prevision.items);
    const loyers = marquees.filter(i => i.planId === 'PLAN');
    expect(loyers.map(i => i.date.slice(0, 7))).toEqual(['2026-10', '2026-11']);
    expect(loyers.every(i => i.proposition === 'echeance')).toBe(true);
    expect(marquees.some(i => i.id === 'PLAN:2026-09-01')).toBe(false);
    const autres = marquees.filter(i => i.source === 'invoice' || i.source === 'plan');
    expect(autres.length).toBeGreaterThanOrEqual(2);
    expect(autres.every(i => i.proposition === undefined)).toBe(true);
  });
});
