import { describe, expect, it } from 'vitest';
import { apportsDePeriode } from '../../src/ui/finance/operations/calculs';
import type { Transaction } from '../../src/types';

/** T3-8 : la barre « Apports » doit valoir le total de la section « Apports et prélèvements » (800 + 3 890 + 3 600). */
const base = { description: 'x', tvaAmount: 0, tvaRate: 0, subcategory: '' };
const avecKind = (id: string, cents: number, kind: 'contribution' | 'withdrawal'): Transaction => ({
  ...base, id, date: '2026-11-02', amountHT: cents / 100, amountTTC: cents / 100, category: 'apports',
  finance: { version: 1, kind, amountCents: cents },
} as unknown as Transaction);
const ancien = (id: string, cents: number, date = '2026-11-03'): Transaction => ({
  ...base, id, date, amountHT: cents / 100, amountTTC: cents / 100, category: 'apports',
} as unknown as Transaction);
const ligne = (transaction: Transaction) => ({ transaction, date: transaction.date });

describe('T3-8 apports de la période', () => {
  it('compte les apports sans bloc finance comme la section (800 + 3 890 + 3 600)', () => {
    const lignes = [avecKind('a', 80000, 'contribution'), ancien('b', 389000), ancien('c', 360000)].map(ligne);
    expect(apportsDePeriode(lignes, null, null)).toBe(829000);
  });
  it('un prélèvement se retranche ; une écriture annulée ou sans date est ignorée ; aucune écriture : null (inconnu, pas 0)', () => {
    const annule = { ...avecKind('v', 10000, 'contribution'), finance: { version: 1, kind: 'contribution', amountCents: 10000, voidedAt: '2026-11-04' } } as unknown as Transaction;
    expect(apportsDePeriode([avecKind('a', 80000, 'contribution'), avecKind('w', 30000, 'withdrawal'), annule, ancien('z', 5000, '')].map(ligne), null, null)).toBe(50000);
    expect(apportsDePeriode([], null, null)).toBeNull();
  });
  it('respecte les bornes de la période', () => {
    expect(apportsDePeriode([ancien('a', 1000, '2026-10-31'), ancien('b', 2000, '2026-11-05')].map(ligne), '2026-11-01', '2026-11-30')).toBe(2000);
  });
});
