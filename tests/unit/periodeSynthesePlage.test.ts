import { describe, expect, it } from 'vitest';
import type { FinanceTransaction, FinancialPayment } from '../../src/domain/finance/types';
import { dansPeriode, periodeSynthese } from '../../src/domain/finance/periodeSynthese';

// CP-9 (10.11) : la Synthèse choisit une plage de mois [mois, jusqua], bornes incluses. Une vente de 100,00 CHF par mois, de déc. 2025 à nov. 2026.
const AUJOURDHUI = '2026-11-09';
const vente = (mois: string, cents = 10000): FinanceTransaction => ({
  id: `V-${mois}`, description: `Vente ${mois}`, date: `${mois}-10`, category: 'recettes' as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'income', amountCents: cents, lines: [], paymentStatus: 'paid' },
});
const depense = (mois: string, cents: number): FinanceTransaction => ({
  id: `D-${mois}`, description: `Achat ${mois}`, date: `${mois}-20`, category: 'brassage' as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'paid' },
});
const MOIS = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
const transactions = [...MOIS.map(m => vente(m)), ...MOIS.map(m => depense(m, 2500))];
const payments: FinancialPayment[] = transactions.map(t => ({
  id: `P-${t.id}`, transactionId: t.id, date: t.date as string, amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: `${t.date}T10:00:00Z`,
}));
const calcul = (mois: string | null, jusqua?: string) => periodeSynthese({ transactions, payments, mois, jusqua, aujourdhui: AUJOURDHUI });

describe('dansPeriode', () => {
  it('sans jusqua : le seul mois ; mois nul : toutes les dates', () => {
    expect(dansPeriode('2026-06-30', '2026-06')).toBe(true);
    expect(dansPeriode('2026-07-01', '2026-06')).toBe(false);
    expect(dansPeriode('1999-01-01', null, '2026-06')).toBe(true);
  });
  it('avec jusqua : bornes incluses, un jour de plus ou de moins sort', () => {
    expect(dansPeriode('2026-06-01', '2026-06', '2026-11')).toBe(true);
    expect(dansPeriode('2026-11-30', '2026-06', '2026-11')).toBe(true);
    expect(dansPeriode('2026-05-31', '2026-06', '2026-11')).toBe(false);
    expect(dansPeriode('2026-12-01', '2026-06', '2026-11')).toBe(false);
  });
  it('une plage inversée ne contient rien', () => {
    expect(dansPeriode('2026-08-15', '2026-11', '2026-06')).toBe(false);
  });
});

describe('periodeSynthese : plage de mois', () => {
  it('sans jusqua, le résultat est identique à avant (un seul mois)', () => {
    const p = calcul('2026-06');
    expect(p.entreCents).toBe(10000);
    expect(p.depenseCents).toBe(2500);
    expect(p.lignes).toBe(2);
    expect(calcul('2026-06', undefined)).toEqual(p);
  });
  it('jusqua égal à mois : le mois seul', () => {
    expect(calcul('2026-06', '2026-06')).toEqual(calcul('2026-06'));
  });
  it('4 mois (août à nov.) : 4 ventes, 4 achats, bornes incluses', () => {
    const p = calcul('2026-08', '2026-11');
    expect(p.entreCents).toBe(40000);
    expect(p.depenseCents).toBe(10000);
    expect(p.gainCents).toBe(30000);
    expect(p.lignes).toBe(8);
  });
  it('6 mois (juin à nov.) : 6 ventes, 6 achats ; juin et novembre comptent, mai non', () => {
    const p = calcul('2026-06', '2026-11');
    expect(p.entreCents).toBe(60000);
    expect(p.depenseCents).toBe(15000);
    expect(p.gainCents).toBe(45000);
    expect(p.ventes).toEqual({ nombre: 6, libelle: '6 ventes' });
  });
  it('à cheval sur deux années (déc. 2025 à mars 2026) : 4 mois', () => {
    const p = calcul('2025-12', '2026-03');
    expect(p.entreCents).toBe(40000);
    expect(p.depenseCents).toBe(10000);
    expect(p.lignes).toBe(8);
  });
  it('toute la plage est la somme des mois : 3 + 3 mois = 6 mois, au centime', () => {
    const a = calcul('2026-06', '2026-08'), b = calcul('2026-09', '2026-11'), tout = calcul('2026-06', '2026-11');
    expect(a.entreCents + b.entreCents).toBe(tout.entreCents);
    expect(a.depenseCents + b.depenseCents).toBe(tout.depenseCents);
  });
  it('mois nul avec jusqua : toutes les dates (le « tout » l’emporte)', () => {
    expect(calcul(null, '2026-06')).toEqual(calcul(null));
    expect(calcul(null).entreCents).toBe(120000);
  });
  it('une plage inversée ne compte rien et ne lève pas', () => {
    const p = calcul('2026-11', '2026-06');
    expect(p.lignes).toBe(0);
    expect(p.entreCents).toBe(0);
  });
});
