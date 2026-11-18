// @vitest-environment jsdom
/**
 * Brasseur, 18.11 : « Parfois j'ai des entrée sans justificatif, je veux juste une coche que je puisse coché pour ces cas là pour ne pas être
 * flaggé comme dans justificatif. C'est normal ». La fiche (m5fo-a) porte une coche « c'est normal » dans sa case « Sans justificatif » ;
 * cochée, la pièce ne compte plus comme sans justificatif nulle part (ligne, filtre, compteur, Annuel, export), et se décoche.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children }: any) => open ? <div role="dialog" aria-label={title}>{children}</div> : null }));
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { sansJustificatif } from '../../src/ui/finance/TransactionJournal';
import { pieceDe } from '../../src/ui/finance/operations/calculs';
import { justificatifs } from '../../src/ui/finance/annuel/calculs';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { buildAnnualReport } from '../../src/domain/finance/annual';
import { summarizeLedger } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

const depense = (id: string, normal?: boolean): Transaction => ({
  id, date: '15.11.2026', description: `ZZ TEST — ${id}`, category: 'divers',
  amountHT: 5, tvaRate: 0, tvaAmount: 0, amountTTC: 5, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: 500, lines: [], paymentStatus: 'paid', ...(normal ? { proofNotNeeded: true } : {}) }
} as Transaction);
const profil = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified' } as const;

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('« Sans justificatif, c’est normal » (18.11)', () => {
  it('cochée, la pièce sort de « Sans justificatif » : ligne, filtre, compteur, Annuel', () => {
    const a = depense('A'), b = depense('B', true);
    expect(sansJustificatif(a)).toBe(true);
    expect(sansJustificatif(b)).toBe(false);
    expect(pieceDe(a).manque).toBe(true);
    expect(pieceDe(b)).toEqual({ texte: 'sans pièce', manque: false });
    expect(summarizeLedger([a, b], [], profil as any, '2026-12-31').missingProofCount).toBe(1);
    const r = buildAnnualReport({ year: 2026, transactions: [a, b], payments: [], assets: [], profile: profil as any });
    expect(r.missing.filter(m => m.startsWith('Justificatif manquant'))).toHaveLength(1);
    expect(r.missing.some(m => m.includes('ZZ TEST — B'))).toBe(false);
    expect(justificatifs(r.documents)).toEqual({ avec: 0, requis: 1 });
    expect(r.documents.find(d => d.id === 'B')?.proofNotNeeded).toBe(true);
  });

  it('la fiche coche et décoche « c’est normal », écrit sur la pièce', () => {
    StorageService.addTransaction(depense('T-SANS'));
    const ouvrir = () => render(<TransactionDetails transaction={StorageService.getTransactions().find(t => t.id === 'T-SANS')!} transactions={StorageService.getTransactions()}
      payments={FinanceService.getPayments()} plans={[]} onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} />);
    ouvrir();
    const coche = screen.getByRole('checkbox', { name: /c’est normal/ });
    expect(coche).not.toBeChecked();
    fireEvent.click(coche);
    expect(StorageService.getTransactions().find(t => t.id === 'T-SANS')?.finance?.proofNotNeeded).toBe(true);
    cleanup(); ouvrir();
    expect(screen.getByRole('checkbox', { name: /c’est normal/ })).toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /c’est normal/ }));
    expect(StorageService.getTransactions().find(t => t.id === 'T-SANS')?.finance?.proofNotNeeded).toBe(false);
  });

  it('une pièce avec justificatif n’a pas de coche', () => {
    StorageService.addTransaction({ ...depense('T-AVEC'), finance: { ...depense('T-AVEC').finance!, proofDocumentId: 'DOC-1' } } as Transaction);
    render(<TransactionDetails transaction={StorageService.getTransactions().find(t => t.id === 'T-AVEC')!} transactions={StorageService.getTransactions()}
      payments={FinanceService.getPayments()} plans={[]} onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} />);
    expect(screen.queryByRole('checkbox', { name: /c’est normal/ })).toBeNull();
  });
});
