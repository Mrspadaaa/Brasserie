// @vitest-environment jsdom
// Port za3 (c1, c2, 15.11) : la fiche ouverte à 390 par StocksTab reçoit les mêmes données et rappels que le panneau 1280 (P1 à P3 du test d'écran),
// et la liste garde la trace d'un geste fait dans la fiche (N1, N2, N5 du 2e test d'écran).
// Valeurs de test, simulées ; aucune donnée réelle.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { seedQa } from '../qa/hop-recipe/repo';
import type { Batch, EquipmentItem } from '../../src/types';

vi.mock('../../src/services/firestoreRepo', () => import('../qa/hop-recipe/repo'));
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));
vi.mock('../../src/ui/finance/ExpenseSheet', () => ({
  ExpenseSheet: (p: { existingEquipmentId?: string; existingEquipmentName?: string; initialIntent?: string }) => <div data-testid="depense" data-materiel={p.existingEquipmentId ?? ''} data-nom={p.existingEquipmentName ?? ''} data-intent={p.initialIntent ?? ''} />,
}));

const ph: EquipmentItem = {
  id: 'EQ-ph', ref: 'EQ-ph', name: 'pH-mètre', category: 'Mesure', state: 'Bon', purchaseDate: '2025-01-10',
  calibration: { unit: 'pH', tolerance: 0.1, points: [{ label: 'pH 7,00', expected: 7 }, { label: 'pH 4,00', expected: 4 }] },
  rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-11',
  history: [{ date: '2026-10-11', kind: 'etalonnage', readings: [{ label: 'pH 7,00', expected: 7, read: 7.02 }, { label: 'pH 4,00', expected: 4, read: 4.03 }] }],
};
const pompe: EquipmentItem = { id: 'EQ-pompe', ref: 'EQ-pompe', name: 'Pompe de recirculation', category: 'Brassage', state: 'À réparer', brokenSince: '2026-11-05', brokenNote: 'fuit au raccord' };
const tx = (id: string, date: string, lines: object[]) => ({
  id, date, description: id, category: 'materiel', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, proofFileName: '', proofType: '',
  finance: { version: 1, kind: 'expense', amountCents: 0, lines },
});
const transactions = [
  tx('T1', '2026-10-08', [{ id: 'l1', description: 'Tampons pH 4 et 7', kind: 'service', amountCents: 2490, equipmentRef: 'EQ-ph' }]),
  tx('T2', '2026-05-22', [{ id: 'l2', description: 'Solution KCl', kind: 'service', amountCents: 1250, equipmentRef: 'EQ-ph' }]),
];
const brassins = ['2026-09-01', '2026-09-20', '2026-10-05'].map((d, i) => ({ id: `B${i}`, name: `Bière ${i}`, style: 'IPA', status: 'Terminé', brewDate: d })) as unknown as Batch[];

const monter = (equipment: EquipmentItem[] = [ph]) => {
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue(transactions as never);
  const maj = vi.spyOn(StorageService, 'updateEquipment').mockImplementation(() => undefined as never);
  const vue = (eq: EquipmentItem[]) => (
    <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
      <StocksTab stocks={{ rawMaterials: [], cleaning: [], equipment: eq, kegs: [] }} batches={brassins} onOpenQuickAction={() => {}} />
    </VirtuosoMockContext.Provider>
  );
  const rendu = render(vue(equipment));
  fireEvent.click(screen.getAllByText('Matériel')[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir pH-mètre' }));
  return { maj, rerender: (eq: EquipmentItem[]) => rendu.rerender(vue(eq)) };
};

beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); seedQa({ stockItems: [] }); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('Fiche matériel à 390 (feuille) — mêmes données et rappels que le panneau 1280', () => {
  it('P1 : les dépenses reliées et les brassins sont dits (37,40 CHF · 2 prix connus), pas « aucun prix connu »', () => {
    monter();
    expect(screen.getByText('37,40 CHF · 2 prix connus')).toBeInTheDocument();
    expect(screen.queryByText('aucun prix connu')).toBeNull();
    expect(screen.getByText('Tampons pH 4 et 7')).toBeInTheDocument();
    expect(screen.getByText(/utilisé dans/)).toBeInTheDocument();
  });

  it('P2 + N5 : Étalonné annonce « Étalonné · à jour jusqu’au JJ.MM » (verbe en gras) avec ↶ Annuler, qui rétablit l’appareil d’avant', () => {
    const { maj } = monter();
    fireEvent.click(screen.getByRole('button', { name: 'Étalonné' }));
    expect(maj).toHaveBeenCalledTimes(1);
    const toast = screen.getByRole('status');
    expect(toast).toHaveTextContent(/Étalonné · à jour jusqu'au \d\d\.\d\d/);
    expect(toast.querySelector('b')).toHaveTextContent('Étalonné');
    expect(within(toast).getByRole('button', { name: 'Annuler' }).querySelector('svg')).not.toBeNull();
    expect(screen.queryByText('pH-mètre enregistré.')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(maj).toHaveBeenLastCalledWith(expect.objectContaining({ ref: 'EQ-ph', lastDone: '2026-10-11' }));
  });

  it('P3 + N2 : « Payer un entretien » ouvre la Dépense sur l’appareil et lui donne son nom', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: /Payer un entretien/ }));
    const depense = screen.getByTestId('depense');
    expect(depense).toHaveAttribute('data-materiel', 'EQ-ph');
    expect(depense).toHaveAttribute('data-nom', 'pH-mètre');
    expect(depense).toHaveAttribute('data-intent', 'expense');
  });

  it('N1 (d8a) : après « Étalonné » dans la fiche, la ligne du parc ne porte plus « étalonner · prévu le 11.11 » : la frise et sa note ont quitté la liste', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 15, 12));
    const { maj, rerender } = monter([pompe, ph]);
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 7,00'), { target: { value: '7,01' } });
    fireEvent.change(screen.getByLabelText('Valeur lue pour pH 4,00'), { target: { value: '4,02' } });
    fireEvent.click(screen.getByRole('button', { name: 'Étalonné' }));
    const ecrit = maj.mock.calls[0][0] as EquipmentItem;
    rerender([pompe, ecrit]); // le stockage a écrit : la liste reçoit l'appareil d'après

    // la ligne reste au parc, sans l'échéance dépassée ; plus de note « à jour jusqu'au » ni de surlignage dans la liste
    const ligne = screen.getByRole('button', { name: 'Ouvrir pH-mètre' });
    expect(ligne).not.toHaveTextContent(/prévu le 11\.11/);
    expect(screen.queryByText(/pH-mètre à jour jusqu'au/)).toBeNull();
    expect(ligne.className).not.toContain('mt-flash');
  });
});
