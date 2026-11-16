// Fournisseurs (maquette fournisseur/v1), de bout en bout dans la page : la liste, la fiche, réunir des noms avec leur preuve, annuler, raisons.
// Fixtures simulées ; les réglages vivent dans l'état d'interface de l'appareil.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PageFournisseurs } from '../../src/ui/fournisseurs/PageFournisseurs';
import { StorageService } from '../../src/services/storage';
import type { StockItem, Transaction } from '../../src/types';

const ligne = (ref: string, desc: string, prix: number, unite = 'kg') =>
  ({ id: `${ref}-${prix}`, description: desc, kind: 'ingredient', amountCents: prix * 10, quantity: 10, unit: unite, unitPriceCents: prix, stockItemRef: ref });
const depense = (id: string, date: string, vendor: string, cents: number, lignes: unknown[] = []): Transaction => ({
  id, date, description: `Achat ${vendor}`, amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, category: 'matieres', subcategory: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: lignes, vendor }
} as unknown as Transaction);
const art = (ref: string, name: string, category: string, supplier?: string): StockItem =>
  ({ id: ref, ref, name, category, unit: 'kg', currentStock: 1, reorder: false, supplier } as StockItem);

const TX = [
  depense('t1', '14.01.2026', 'Brouwland', 34020, [ligne('pils', 'Pilsner', 3650)]),
  depense('t2', '08.06.2026', 'Brouwland', 73190, [ligne('pils', 'Pilsner', 3780)]),
  depense('t4', '08.11.2026', 'brouwland.com', 38460, [ligne('pils', 'Pilsner', 3890)]),
  depense('t5', '30.05.2025', 'Brouwland Belgique', 20510)
];
const STOCKS = { rawMaterials: [art('pils', 'Malt Pilsner', 'Malt', 'Brouwland'), art('lac', 'Malt du Lac', 'Malt', 'Malterie du Lac')], cleaning: [] as StockItem[] };

const monter = (onBack = vi.fn(), onScanner = vi.fn()) => {
  render(<PageFournisseurs transactions={TX} stocks={STOCKS} onBack={onBack} onScanner={onScanner} />);
  return { onBack, onScanner };
};

beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); window.scrollTo = vi.fn() as never; });
afterEach(cleanup);

describe('Fournisseurs', () => {
  it('la liste dit les factures, les noms à réunir et le délai inconnu ; le fournisseur du stock se dit sans facture', () => {
    monter();
    const brouwland = screen.getAllByRole('button').find(b => b.textContent?.startsWith('Brouwland') && b.textContent.includes('2 factures'))!;
    expect(brouwland.textContent).toContain('3 noms');
    expect(brouwland.textContent).toContain('? j');
    expect(screen.getByText('aucune facture encore')).toBeTruthy();
  });

  it('la fiche : le délai inconnu, le dernier prix et son écart, la courbe ouvre l\'historique', () => {
    monter();
    fireEvent.click(screen.getByText('2 factures · 3 noms').closest('button')!);
    expect(screen.getByRole('heading', { name: 'Brouwland' })).toBeTruthy();
    expect(screen.getByText(/Inconnu : l’app ne note pas encore/)).toBeTruthy();
    const art = screen.getByText('Malt Pilsner').closest('button')!;
    expect(art.textContent).toContain('37,80');
    expect(art.textContent).toContain('+1,30 ↑');
    expect(art.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(art);
    expect(art.getAttribute('aria-expanded')).toBe('true');
  });

  it('réunir : la feuille montre chaque nom avec sa preuve et « Après », puis le message permet d\'annuler', () => {
    monter();
    fireEvent.click(screen.getByText('2 factures · 3 noms').closest('button')!);
    fireEvent.click(screen.getByText('Voir et réunir').closest('button')!);
    const feuille = screen.getByRole('dialog');
    expect(within(feuille).getByText('Un seul fournisseur ?')).toBeTruthy();
    expect(within(feuille).getByText('même nom, un mot en plus')).toBeTruthy();
    expect(within(feuille).getByText('même nom, écrit comme une adresse web')).toBeTruthy();
    expect(within(feuille).getByText(/1 fiche · 4 factures/)).toBeTruthy();
    // décocher un nom
    fireEvent.click(within(feuille).getByText('Brouwland Belgique').closest('button')!);
    expect(within(feuille).getByText(/1 fiche · 3 factures/)).toBeTruthy();
    fireEvent.click(within(feuille).getByText('Réunir 2 noms'));
    expect(screen.getByRole('status').textContent).toContain('2 noms réunis sous Brouwland');
    expect(screen.getByText('aussi écrit brouwland.com')).toBeTruthy();
    expect(screen.getByText('Factures').closest('button')!.textContent).toContain('3 ·');
    const stocke = JSON.stringify(StorageService.getUiState('fournisseurs_reglages', null));
    expect(stocke).toContain('"reunis"');
    // annuler : la fiche retrouve ses 2 factures, la proposition revient
    fireEvent.click(within(screen.getByRole('status')).getByText('Annuler'));
    expect(screen.getByText('Factures').closest('button')!.textContent).toContain('2 ·');
    expect(screen.getByText('Voir et réunir')).toBeTruthy();
  });

  it('« Pas maintenant » range la proposition en une ligne', () => {
    monter();
    fireEvent.click(screen.getByText('2 factures · 3 noms').closest('button')!);
    fireEvent.click(screen.getByText('Voir et réunir').closest('button')!);
    fireEvent.click(within(screen.getByRole('dialog')).getByText('Pas maintenant'));
    expect(screen.getByText(/2 autres noms à réunir · plus tard/)).toBeTruthy();
  });

  it('les raisons se touchent puis se gardent sur la fiche ; annulables', () => {
    monter();
    fireEvent.click(screen.getByText('2 factures · 3 noms').closest('button')!);
    const garder = screen.getByText('Garder ces raisons').closest('button')!;
    expect(garder.hasAttribute('disabled')).toBe(true);
    fireEvent.click(screen.getByText('moins cher'));
    fireEvent.click(screen.getByText('livre vite'));
    fireEvent.click(screen.getByText('Garder 2 raisons'));
    expect(screen.getByRole('status').textContent).toContain('Raisons gardées');
    expect(screen.getByText('Tes raisons')).toBeTruthy();
    fireEvent.click(within(screen.getByRole('status')).getByText('Annuler'));
    expect(screen.getByText('Garder ces raisons')).toBeTruthy();
  });

  it('la fiche vide : le fournisseur du stock invite à scanner une facture ; la flèche revient à la liste puis à Plus', () => {
    const { onBack, onScanner } = monter();
    fireEvent.click(screen.getByText('Malterie du Lac').closest('button')!);
    expect(screen.getByText('ajouté depuis le stock')).toBeTruthy();
    fireEvent.click(screen.getByText('Scanner une facture').closest('button')!);
    expect(onScanner).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Fournisseurs').closest('button')!);
    expect(screen.getByRole('heading', { name: 'Fournisseurs' })).toBeTruthy();
    fireEvent.click(screen.getByText('Plus').closest('button')!);
    expect(onBack).toHaveBeenCalled();
  });
});
