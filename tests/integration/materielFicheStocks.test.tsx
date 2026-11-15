// @vitest-environment jsdom
// Port za3 (c1, 15.11) : la fiche ouverte à 390 par StocksTab reçoit les mêmes données et rappels que le panneau 1280 (P1 à P3 du test d'écran).
// Valeurs de test, simulées ; aucune donnée réelle.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { seedQa } from '../qa/hop-recipe/repo';
import type { Batch, EquipmentItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));
vi.mock('../../src/ui/finance/ExpenseSheet', () => ({
  ExpenseSheet: (p: { existingEquipmentId?: string; initialIntent?: string }) => <div data-testid="depense" data-materiel={p.existingEquipmentId ?? ''} data-intent={p.initialIntent ?? ''} />,
}));

const ph: EquipmentItem = {
  id: 'EQ-ph', ref: 'EQ-ph', name: 'pH-mètre', category: 'Mesure', state: 'Bon', purchaseDate: '2025-01-10',
  calibration: { unit: 'pH', tolerance: 0.1, points: [{ label: 'pH 7,00', expected: 7 }, { label: 'pH 4,00', expected: 4 }] },
  rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-11',
  history: [{ date: '2026-10-11', kind: 'etalonnage', readings: [{ label: 'pH 7,00', expected: 7, read: 7.02 }, { label: 'pH 4,00', expected: 4, read: 4.03 }] }],
};
const tx = (id: string, date: string, lines: object[]) => ({
  id, date, description: id, category: 'materiel', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, proofFileName: '', proofType: '',
  finance: { version: 1, kind: 'expense', amountCents: 0, lines },
});
const transactions = [
  tx('T1', '2026-10-08', [{ id: 'l1', description: 'Tampons pH 4 et 7', kind: 'service', amountCents: 2490, equipmentRef: 'EQ-ph' }]),
  tx('T2', '2026-05-22', [{ id: 'l2', description: 'Solution KCl', kind: 'service', amountCents: 1250, equipmentRef: 'EQ-ph' }]),
];
const brassins = ['2026-09-01', '2026-09-20', '2026-10-05'].map((d, i) => ({ id: `B${i}`, name: `Bière ${i}`, style: 'IPA', status: 'Terminé', brewDate: d })) as unknown as Batch[];

const monter = () => {
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue(transactions as never);
  const maj = vi.spyOn(StorageService, 'updateEquipment').mockImplementation(() => undefined as never);
  render(
    <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
      <StocksTab stocks={{ rawMaterials: [], cleaning: [], equipment: [ph], kegs: [] }} batches={brassins} onOpenQuickAction={() => {}} />
    </VirtuosoMockContext.Provider>,
  );
  fireEvent.click(screen.getAllByText('Matériel')[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir pH-mètre' }));
  return maj;
};

beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); seedQa({ stockItems: [] }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Fiche matériel à 390 (feuille) — mêmes données et rappels que le panneau 1280', () => {
  it('P1 : les dépenses reliées et les brassins sont dits (37,40 CHF · 2 prix connus), pas « aucun prix connu »', () => {
    monter();
    expect(screen.getByText('37,40 CHF · 2 prix connus')).toBeInTheDocument();
    expect(screen.queryByText('aucun prix connu')).toBeNull();
    expect(screen.getByText('Tampons pH 4 et 7')).toBeInTheDocument();
    expect(screen.getByText(/utilisé dans/)).toBeInTheDocument();
  });

  it('P2 : Étalonné annonce « Étalonné · à jour jusqu’au 11.12 » avec Annuler, qui rétablit l’appareil d’avant', () => {
    const maj = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Étalonné' }));
    expect(maj).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(/Étalonné · à jour jusqu'au \d\d\.\d\d/);
    expect(screen.queryByText('pH-mètre enregistré.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(maj).toHaveBeenLastCalledWith(expect.objectContaining({ ref: 'EQ-ph', lastDone: '2026-10-11' }));
  });

  it('P3 : « Payer un entretien » ouvre la Dépense sur l’appareil', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: /Payer un entretien/ }));
    const depense = screen.getByTestId('depense');
    expect(depense).toHaveAttribute('data-materiel', 'EQ-ph');
    expect(depense).toHaveAttribute('data-intent', 'expense');
  });
});
