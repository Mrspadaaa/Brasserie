// @vitest-environment jsdom
/**
 * Voie v2, problème 3 du test d'écran 8b9e1732 (constat 20 du rejeu de nuit) : « Mouvement enregistré. Fermer » restait en tête d'Opérations
 * après l'annulation de ce même mouvement. L'avis dit ce qui vient d'être fait : une annulation le retire (il ne parle plus d'un mouvement
 * qui n'existe plus). Parcours sur les vrais services (?dev-local), aucune donnée réelle.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { useStorageValue } from '../../src/hooks/useLiveData';

const read = () => StorageService.getTransactions();
function Workspace() {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={() => {}}/>;
}
beforeEach(() => {
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'journal');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('3 : l’avis d’un mouvement ne survit pas à son annulation', () => {
  it('« Mouvement enregistré » apparaît à l’enregistrement, puis disparaît quand l’écriture est annulée', async () => {
    render(<Workspace/>);
    fireEvent.click(screen.getByRole('button', { name: 'Apport ou prélèvement privé' }));
    const montant = screen.getByLabelText('Montant (CHF)');
    fireEvent.change(montant, { target: { value: '5' } }); fireEvent.blur(montant);
    fireEvent.change(screen.getByLabelText('Motif'), { target: { value: 'ZZ TEST — Apport' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’apport' }));
    await waitFor(() => expect(screen.getByText('Mouvement enregistré.')).toBeInTheDocument());
    fireEvent.click(await screen.findByRole('button', { name: /ZZ TEST — Apport/ }));
    fireEvent.click(await screen.findByRole('button', { name: 'Corriger ce paiement saisi par erreur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la correction' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Annuler cette écriture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la correction' }));
    await waitFor(() => expect(screen.getByText(/Écriture annulée\./)).toBeInTheDocument());
    expect(screen.queryByText('Mouvement enregistré.')).not.toBeInTheDocument();
  });
});
