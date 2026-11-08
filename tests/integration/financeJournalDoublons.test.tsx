import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

/**
 * AM n° 7 : B-001 à B-026 « Cmd 686863 » et la facture 372765 (commande Onlinebestellung-686863) sont le même achat inscrit deux fois.
 * Le journal le dit, sans rien supprimer : un bandeau, une puce « Doublons possibles » et le filtre qui montre les 27 écritures.
 */
const today = todayISO();
const facture = (): Transaction => ({
  id: 'TX-FACTURE', description: 'Brau- und Rauchshop GmbH · 372765', date: today, category: 'brassage', subcategory: '',
  amountHT: 110.4, amountTTC: 110.4, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 11040, paymentStatus: 'paid', recordedAt: `${today}T12:00:00Z`, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '372765',
    sourceOrderNumber: 'Onlinebestellung-686863', lines: [] },
});
const ancien = (i: number): Transaction => ({
  id: `B-${String(i).padStart(3, '0')}`, description: `Cmd 686863 Brau-Rauchshop ${i}`, date: today, category: 'brassage', subcategory: '',
  amountHT: 4, amountTTC: 4, tvaAmount: 0, tvaRate: 0,
});
const rendre = (transactions: Transaction[]) => render(<TransactionJournal transactions={transactions} payments={[]} archives={[]}
  renderRow={t => <span data-testid="ligne">{t.id}</span>} onManageArchives={() => {}} onPrivateMovement={() => {}} />);
afterEach(cleanup);

describe('Journal : les doublons déjà inscrits sont signalés', () => {
  it('bandeau et puce avec le compte ; le filtre garde les 27 écritures et dit pourquoi', () => {
    rendre([facture(), ...Array.from({ length: 26 }, (_, i) => ancien(i + 1))]);
    expect(screen.getByTestId('journal-duplicates').textContent).toMatch(/27 écritures possiblement en double/);
    expect(screen.getByTestId('journal-duplicates').textContent).toMatch(/Rien n’est supprimé/);
    const puce = screen.getByRole('button', { name: /Doublons possibles/ });
    expect(puce.textContent).toMatch(/27/);
    fireEvent.click(puce);
    expect(screen.getAllByTestId('ligne')).toHaveLength(27);
    expect(screen.getByTestId('journal-duplicates').textContent).toMatch(/Même commande 686863/);
  });
  it('rien d’anormal : ni bandeau ni puce', () => {
    rendre([facture(), ancien(1)].map(t => t.id === 'B-001' ? { ...t, description: 'Cmd 111111 autre' } : t));
    expect(screen.queryByTestId('journal-duplicates')).toBeNull();
    expect(screen.queryByRole('button', { name: /Doublons possibles/ })).toBeNull();
  });
});
