// @vitest-environment jsdom
/**
 * CT4-A-12 (critique tour 4) : toucher un jalon de Papiers (Loyer de l'atelier) dans le Calendrier ouvre la fiche sur Finances ; la fermer
 * laissait sur Finances. Lecture étroite : le retour. Une fiche ouverte DEPUIS le calendrier, une fois fermée, ramène au calendrier ; une
 * fiche ouverte depuis Finances reste sur Finances. Fixtures « ZZ TEST », aucun réseau.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import type { Transaction } from '../../src/types';
import type { Periode } from '../../src/components/periode/periode';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';

const loyer: Transaction = {
  id: 'ZZ-LOYER', date: '2026-11-20', description: 'ZZ TEST — Loyer de l’atelier', category: 'divers', subcategory: '', amountHT: 400, tvaRate: 0, tvaAmount: 0, amountTTC: 400, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: 40000, lines: [], paymentStatus: 'unpaid', dueDate: '2026-11-25' }
} as Transaction;
const NOV: Periode = { genre: 'mois', annee: 2026, mois: 11 };

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-20T10:00:00')); localStorage.clear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const fermerFiche = () => fireEvent.click(document.querySelector('button.fiche-x') as HTMLElement);
const monter = (props: Record<string, unknown>) => {
  StorageService.setUiState('finances_workspace', 'journal');
  return render(<FinancesTab transactions={[loyer]} config={defaultConfig} budgetLines={[]} globalTimeFilter={NOV} onChangeGlobalTimeFilter={() => undefined} {...props} />);
};

describe('CT4-A-12 : la fiche ouverte depuis le calendrier ramène au calendrier', () => {
  it('fermer par × (Fermer) rend la main au calendrier, une seule fois', () => {
    const onRetour = vi.fn();
    monter({ openTransactionRequest: { id: 'ZZ-LOYER', at: 1, retour: 'calendrier' }, onRetour });
    expect(screen.getAllByText(/ZZ TEST — Loyer de l’atelier/).length).toBeGreaterThan(0);
    fermerFiche();
    expect(onRetour).toHaveBeenCalledTimes(1);
    expect(onRetour).toHaveBeenCalledWith('calendrier');
  });
  it('une fiche ouverte depuis Finances (sans « retour ») reste sur Finances', () => {
    const onRetour = vi.fn();
    monter({ openTransactionRequest: { id: 'ZZ-LOYER', at: 2 }, onRetour });
    fermerFiche();
    expect(onRetour).not.toHaveBeenCalled();
  });
  it('« Confirmer le paiement » depuis la fiche continue dans Finances : pas de retour au calendrier sous la feuille de paiement', () => {
    const onRetour = vi.fn();
    monter({ openTransactionRequest: { id: 'ZZ-LOYER', at: 3, retour: 'calendrier' }, onRetour });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));
    expect(onRetour).not.toHaveBeenCalled();
  });
});
