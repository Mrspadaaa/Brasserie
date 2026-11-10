import React from 'react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { summarizeLedger, todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

/**
 * Test en ligne du 07.11, n° 35 : « 27 opérations · − 220,79 CHF » pour une facture de 110,40 CHF à 26 lignes.
 * Question : le CODE compte-t-il une dépense deux fois (l'écriture ET ses lignes) ? Ce test dit non : une facture à 26 lignes
 * est UNE opération au montant de la facture. Le « 27 » et le « 220,79 » ne s'obtiennent qu'avec 26 écritures DISTINCTES
 * en plus de la facture, c'est-à-dire un doublon dans les données (lignes saisies une à une avant la facture).
 */
const today = todayISO();
const DEBUT = [1380, 60, 240, 100, 200, 300, 150, 250, 500, 120, 80, 90, 700, 160, 220, 130, 140, 110, 170, 180, 190, 210, 230, 260, 270];
/** 26 lignes (fixture du test : 25 montants + le solde), 110,40 CHF au total comme la facture 372765. */
const CENTS = [...DEBUT, 11040 - DEBUT.reduce((a, b) => a + b, 0)];
const sommeLignes = CENTS.reduce((a, b) => a + b, 0);
const facture = (): Transaction => ({
  id: 'TX-FACTURE', description: 'Brau- und Rauchshop GmbH · 372765', date: today, category: 'brassage', subcategory: '',
  amountHT: sommeLignes / 100, amountTTC: sommeLignes / 100, tvaAmount: 0, tvaRate: 0,
  finance: {
    version: 1, kind: 'expense', amountCents: sommeLignes, paymentStatus: 'paid', recordedAt: `${today}T12:00:00Z`, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '372765',
    lines: CENTS.map((c, i) => ({ id: `L${i}`, description: `Ligne ${i}`, kind: 'ingredient' as const, amountCents: c })),
  },
});
const ligneSeule = (c: number, i: number): Transaction => ({
  id: `TX-ANCIEN-${i}`, description: `Cmd 686863 Brau-Rauchshop ${i}`, date: today, category: 'brassage', subcategory: '',
  amountHT: c / 100, amountTTC: c / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: c, recordedAt: `${today}T12:00:00Z`, lines: [] },
});
const rendu = (transactions: Transaction[]) => {
  const { container } = render(<TransactionJournal transactions={transactions} payments={[]} archives={[]} renderRow={t => <span>{t.description}</span>} onManageArchives={() => {}} onPrivateMovement={() => {}} />);
  return (container.textContent ?? '').replace(/\s+/g, ' ').replace(/[  ]/g, ' ');
};
afterEach(cleanup);

describe('Journal : une facture à lignes ne se compte qu\'une fois', () => {
  it('la facture seule : 1 opération, − 110,40 (ses 26 lignes ne s\'ajoutent pas)', () => {
    expect(sommeLignes).toBe(11040);
    const texte = rendu([facture()]);
    expect(texte).toMatch(/1 opération/);
    expect(texte).toMatch(/110[.,]40/);
    expect(texte).not.toMatch(/220[.,]/);
    const ledger = summarizeLedger([facture()], [], { openingCash: undefined } as never, today);
    expect(ledger.expenseCents).toBe(11040);
  });

  it('27 opérations et − 220,80 n\'apparaissent que si 26 écritures distinctes existent déjà en données', () => {
    const doublons = CENTS.map(ligneSeule);
    const texte = rendu([facture(), ...doublons]);
    expect(texte).toMatch(/27 opérations/);
    expect(texte).toMatch(/220[.,]80/);
    const ledger = summarizeLedger([facture(), ...doublons], [], { openingCash: undefined } as never, today);
    expect(ledger.expenseCents).toBe(22080);
  });
});
