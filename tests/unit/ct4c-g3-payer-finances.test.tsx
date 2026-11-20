// @vitest-environment jsdom
/**
 * CT4C-8, chemin Finances (onglet Opérations › ligne › fiche › « Confirmer le paiement ») : même attendu que ct4c-g3-payer-seule.test.tsx.
 * La mise en œuvre de ce chemin est la prop `seule` posée dans FinancesTab (voie F1, fichier occupé) ; ce test l'épingle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import type { Transaction } from '../../src/types';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';

const tx = (id: string, description: string, cents: number, dueDate: string): Transaction => ({
  id, date: '2026-11-19', description, category: 'chargesFixes', subcategory: '', amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', dueDate, vendor: 'Atelier' }
}) as Transaction;
const jeu = [tx('SOLDE', 'Solde atelier · ancienne année', 6000, '2025-12-20'), tx('LOYER', 'Loyer de l’atelier', 40000, '2026-11-25')];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-19T10:00:00'));
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('CT4C-8 (Finances) : « Confirmer le paiement » du loyer ouvre 400,00, le solde reste proposé non coché', () => {
  it('fiche du loyer › Confirmer le paiement', () => {
    StorageService.setUiState('finances_workspace', 'journal');
    render(<FinancesTab transactions={jeu} config={defaultConfig} budgetLines={[]} globalTimeFilter={{ genre: 'mois', annee: 2026, mois: 11 }} onChangeGlobalTimeFilter={() => undefined} />);
    fireEvent.click(screen.getAllByText(/Loyer de l’atelier/)[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('400,00');
    expect(screen.getByRole('checkbox', { name: 'Inclure Loyer de l’atelier dans le virement' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Inclure Solde atelier · ancienne année dans le virement' })).toHaveAttribute('aria-checked', 'false');
    expect(FinanceService.getPayments()).toHaveLength(0);
  });
});
