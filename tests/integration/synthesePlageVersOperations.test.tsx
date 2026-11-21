/* 19.11, le brasseur : « Je choisis une range, (déjà petit problème UI, et ensuite je click sur la bare grise, mais sur l'autre vue, ça me renvoie sur le tout... ».
   1) Toucher une barre de la Synthèse ouvre Opérations filtré ET sur la plage choisie, jamais sur « Toutes les dates ».
   2) Les champs « du / au » disent le mois en français (« août 2026 »), jamais la langue du téléphone (« August 2026 »).
   Données simulées (dev-local), aucune écriture réelle. */
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import type { Transaction } from '../../src/types';

afterEach(cleanup);
const tx = (id: string, description: string, cents: number, category: Transaction['category'], date: string): Transaction => ({
  id, description, date, category, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, paymentStatus: 'paid', recordedAt: `${date}T08:00:00Z`, vendor: 'ZZ TEST', lines: [] },
} as Transaction);
const ACHATS = [
  tx('B-04', 'ZZ TEST malt avril', 11_040, 'brassage', '2026-04-27'),
  tx('D-08', 'ZZ TEST vêtements août', 13_200, 'divers', '2026-08-30'),
  tx('D-03', 'ZZ TEST divers mars', 5_000, 'divers', '2026-03-10'),
];
const lire = () => StorageService.getTransactions();
function Ecran() { const transactions = useStorageValue(lire); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" />; }

describe('Synthèse › barre › Opérations : la plage choisie est gardée', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-19T10:00:00Z'));
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
    StorageService.setUiState('finances_workspace', 'overview');
    for (const t of ACHATS) {
      StorageService.addTransaction(t);
      FinanceService.recordPayment({ id: `PAI-${t.id}`, transactionId: t.id, date: t.date as string, amountCents: t.finance!.amountCents, direction: 'out', method: 'bank', recordedAt: `${t.date}T10:00:00Z` } as never);
    }
  });
  afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('août – nov. : la barre « Autres frais » ouvre Opérations sur août – nov., filtré, sans les autres frais de mars', () => {
    render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    fireEvent.change(screen.getByLabelText('Du'), { target: { value: '2026-08-01' } });
    fireEvent.change(screen.getByLabelText('Au'), { target: { value: '2026-11-30' } });
    fireEvent.click(screen.getByRole('button', { name: /^Autres frais .*voir ces opérations/ }));
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByText('Toutes les dates')).toBeNull();
    expect(screen.getByLabelText(/^Plage du 1er août/)).toBeTruthy();
    expect(screen.getByText('ZZ TEST vêtements août')).toBeTruthy();
    expect(screen.queryByText('ZZ TEST divers mars')).toBeNull();
    expect(screen.queryByText('ZZ TEST malt avril')).toBeNull();
  });

  it('PERIODE-PARTOUT : « … » ouvre la frise d’Opérations : aucun champ mois, ni liste', () => {
    render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: 'Autre période' }));
    expect(document.querySelector('input[type="month"]')).toBeNull();
    expect(screen.queryByRole('group', { name: 'Plage de mois' })).toBeNull();
    expect(screen.getByTestId('frise')).toBeTruthy();
  });
});
