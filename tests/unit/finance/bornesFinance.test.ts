import { describe, expect, it } from 'vitest';
import { validateFinanceTransaction, todayISO } from '../../../src/domain/finance/ledger';
import { BORNES_FINANCE, messageDateHorsBornes, messageMontantHorsBornes } from '../../../src/domain/finance/bornesFinance';
import type { Transaction } from '../../../src/types';

// MV-38 / MV-41 : une vente ou une dépense de 999 999 CHF ne s'enregistre plus ; AM-57 : une date de pièce en 2062 ou 1999 non plus.

const tx = (kind: 'income' | 'expense', cents: number, date = todayISO()): Transaction => ({
  id: 'T-1', date, description: 'Test', category: kind === 'income' ? 'recettes' : 'divers',
  amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0,
  finance: { version: 1, kind, amountCents: cents, lines: [], paymentStatus: 'unpaid', recordedAt: '2026-11-08T10:00:00.000Z' },
} as Transaction);

describe('bornes des écritures', () => {
  it('une vente de 999 999 CHF est refusée avec un message qui dit la borne', () => {
    expect(() => validateFinanceTransaction(tx('income', 99_999_900))).toThrow(/50.000 CHF/);
  });
  it('une dépense de 999 999 CHF est refusée', () => {
    expect(() => validateFinanceTransaction(tx('expense', 99_999_900))).toThrow(/250.000 CHF/);
  });
  it('les montants usuels passent, la borne comprise', () => {
    expect(() => validateFinanceTransaction(tx('income', 12_345))).not.toThrow();
    expect(() => validateFinanceTransaction(tx('income', BORNES_FINANCE.venteCents.valeur))).not.toThrow();
    expect(() => validateFinanceTransaction(tx('expense', 8_050_000))).not.toThrow();
  });
  it('une date de pièce en 2062 ou 1999 est refusée', () => {
    expect(() => validateFinanceTransaction(tx('expense', 1000, '2062-03-01'))).toThrow(/plus d’un an/);
    expect(() => validateFinanceTransaction(tx('expense', 1000, '1999-03-01'))).toThrow(/antérieure à 2000/);
  });
  it('une pièce d’hier, de l’an dernier ou du mois prochain passe', () => {
    expect(messageDateHorsBornes('2025-06-01', '2026-11-08')).toBeNull();
    expect(messageDateHorsBornes('2026-12-08', '2026-11-08')).toBeNull();
    expect(messageDateHorsBornes('2027-11-08', '2026-11-08')).toBeNull();
    expect(messageDateHorsBornes('2027-11-10', '2026-11-08')).not.toBeNull();
  });
  it('l’inconnu et le zéro ne sont pas des montants hors bornes', () => {
    expect(messageMontantHorsBornes(0)).toBeNull();
    expect(messageMontantHorsBornes(NaN)).toBeNull();
  });
});
