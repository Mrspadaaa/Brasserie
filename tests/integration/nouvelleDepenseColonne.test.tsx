// @vitest-environment jsdom
/**
 * Voie u1, constat 18 (jeu en ligne du 16.11) : « Nouvelle dépense » à 1280 prenait toute la largeur (1538 px), en-tête et bande « Joindre des documents »
 * d'un bord à l'autre, et « Total TTC » collé sous l'en-tête. La feuille est une colonne centrée (lg:max-w) qui contient l'en-tête, la bande, les champs et le pied ;
 * « Total TTC » est détaché de la bande par une marge haute. Le rendu se juge sur les captures (cap/depense-*) ; ici, la structure.
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
vi.mock('../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], confirmPendingWrites: async () => undefined } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../src/ui/finance/ExpenseSheet';

beforeEach(() => cleanup());

describe('18 : Nouvelle dépense en colonne centrée', () => {
  it('l’en-tête, la bande des documents, « Total TTC » et le pied sont dans une même colonne de 760 px au plus à partir de lg', () => {
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} />);
    const colonne = document.querySelector<HTMLElement>('[data-dp="colonne"]');
    expect(colonne).not.toBeNull();
    expect(colonne!.className).toMatch(/lg:max-w-\[760px\]/);
    expect(colonne!.className).toMatch(/lg:mx-auto/);
    expect(colonne!.contains(screen.getByText('Nouvelle dépense'))).toBe(true);
    expect(colonne!.contains(screen.getByRole('button', { name: /Joindre des documents/ }))).toBe(true);
    expect(colonne!.contains(screen.getByLabelText('Total TTC en CHF'))).toBe(true);
    expect(colonne!.contains(screen.getByRole('button', { name: /Enregistrer/ }))).toBe(true);
  });
  it('« Total TTC » est détaché de la bande des documents (marge haute de 16 px, au lieu de 6 px)', () => {
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} />);
    const champ = screen.getByLabelText('Total TTC en CHF').closest('fieldset')!;
    expect(champ.className).toMatch(/\bpt-4\b/);
    expect(champ.className).not.toMatch(/\bpt-1\.5\b/);
  });
});
