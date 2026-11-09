// @vitest-environment jsdom
// TA2 : dans « Tout », le compteur ne compte que les opérations actives, comme le total ; les annulées restent listées et se disent à part.
import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal } from '../../../../src/ui/finance/TransactionJournal';
import { todayISO } from '../../../../src/domain/finance/ledger';
import type { Transaction } from '../../../../src/types';
import type { FinancialPayment } from '../../../../src/domain/finance/types';

const today = todayISO();
const purchase = (id: string, voided = false): Transaction => ({
  id, description: `Opération ${id}`, date: today, category: 'brassage', subcategory: '', amountHT: 100, amountTTC: 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 10000, paymentStatus: 'unpaid', recordedAt: `${today}T12:00:00Z`, lines: [], ...(voided ? { voidedAt: `${today}T13:00:00Z` } : {}) },
} as Transaction);
const defaults = {
  payments: [] as FinancialPayment[], archives: [],
  renderRow: (t: Transaction) => <button>{t.description}</button>,
  onManageArchives: () => {}, onSale: () => {}, onPrivateMovement: () => {},
};
/** v6b : le compteur est celui de chaque groupe (nom accessible de sa section) ; les pastilles de filtre ont leurs propres comptes. */
const text = () => [...document.querySelectorAll('section[aria-label]')].map(el => el.getAttribute('aria-label')).join(' | ');
const show = (transactions: Transaction[], request: Record<string, unknown> = {}) =>
  render(<TransactionJournal {...defaults} transactions={transactions} request={{ key: `k-${Math.random()}`, scope: 'all', allDates: true, ...request }}/>);
afterEach(cleanup);

describe('TA2 : compteur du journal', () => {
  it('Tout, 2 actives et 1 annulée : « 2 opérations + 1 annulée », les trois lignes restent listées', () => {
    show([purchase('A'), purchase('B'), purchase('C', true)]);
    expect(text()).toMatch(/2 opérations \+ 1 annulée/);
    expect(text()).not.toMatch(/3 opérations/);
    for (const id of ['A', 'B', 'C']) expect(screen.getByRole('button', { name: `Opération ${id}` })).toBeInTheDocument();
  });

  it('Tout, 1 active et 2 annulées : accord au pluriel', () => {
    show([purchase('A'), purchase('B', true), purchase('C', true)]);
    expect(text()).toMatch(/1 opération \+ 2 annulées/);
  });

  it('filtre « Écritures annulées » : on dit seulement « 1 annulée », jamais « 0 opération »', () => {
    show([purchase('A'), purchase('B', true)], { filter: 'void' });
    expect(text()).toMatch(/1 annulée/);
    expect(text()).not.toMatch(/0 opération/);
  });

  it('aucune annulée : le texte d’avant, sans « annulée » dans l’en-tête', () => {
    show([purchase('A'), purchase('B'), purchase('C')]);
    expect(text()).toMatch(/3 opérations/);
    expect(text()).not.toMatch(/\+ \d+ annulée/);
  });

  it('périmètre courantes : l’annulée n’est pas listée, donc pas comptée', () => {
    show([purchase('A'), purchase('B', true)], { scope: 'current', allDates: false });
    expect(screen.queryByRole('button', { name: 'Opération B' })).not.toBeInTheDocument();
    expect(text()).toMatch(/1 opération/);
    expect(text()).not.toMatch(/\+ \d+ annulée/);
  });

  it('liste vide : « 0 opération »', () => {
    show([]);
    expect(text()).toBe('');
    expect(screen.getByText('Aucune opération enregistrée')).toBeInTheDocument();
  });
});
