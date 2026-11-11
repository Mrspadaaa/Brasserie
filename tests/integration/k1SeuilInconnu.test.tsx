import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Batch, StockItem } from '../../src/types';

/**
 * Voie k1 (mission 2026-11-11-stock), R3 : une fiche d'article SANS seuil s'ouvre sans message rouge et s'enregistre ;
 * un seuil vide est « inconnu » (champ absent), jamais 0. Le service d'écriture est simulé ; aucune donnée réelle.
 */
vi.mock('../../src/services/storage', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/storage')>('../../src/services/storage');
  const base: Record<string, unknown> = { getUiState: (_k: string, f: unknown) => f, setUiState: vi.fn(),
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }) };
  return { ...actual, StorageService: new Proxy(base, { get: (cible, nom: string) => nom in cible ? cible[nom] : nom.startsWith('get') ? () => [] : undefined }) };
});

const { StockDetailSheet } = await import('../../src/ui/StockDetailSheet');
const regles = await import('../../src/domain/stock/regles');

/** Un article né d'un achat : aucun champ `minStock` (inconnu). */
const sansSeuil = (): StockItem => {
  const a: Partial<StockItem> = { id: 'RM-9', ref: 'MP-009', name: 'Lactose', category: 'Divers', unit: 'kg', currentStock: 2, reorder: false, supplier: 'Rohstoff AG' };
  return a as StockItem;
};

const props = { batches: [] as Batch[], onClose: () => {}, onDelete: vi.fn(), onCorrectInventory: () => {}, onToggleFavorite: () => {} };

beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); });

describe('K11 / R3 — seuil inconnu', () => {
  it('verifierSeuil : absent, vide ou null = inconnu, accepté ; un texte, un négatif, un excès restent refusés', () => {
    expect(regles.verifierSeuil(undefined, 'kg')).toEqual({ ok: true });
    expect(regles.verifierSeuil(null, 'kg')).toEqual({ ok: true });
    expect(regles.verifierSeuil('', 'kg')).toEqual({ ok: true });
    expect(regles.verifierSeuil('abc', 'kg')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(-1, 'kg')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(999_999, 'kg')).toMatchObject({ ok: false });
    expect(regles.verifierSeuil(0, 'kg')).toEqual({ ok: true });
  });

  it('la fiche sans seuil s’ouvre sans message rouge, et Enregistrer est allumé', () => {
    render(<StockDetailSheet {...props} item={sansSeuil()} onSave={vi.fn()} />);
    expect(screen.queryByText(/nombre positif/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
    expect((document.getElementById('stock-min') as HTMLInputElement).value).toBe('');
  });

  it('changer le fournisseur d’une fiche sans seuil s’enregistre, et le seuil reste inconnu (absent, pas 0)', () => {
    const onSave = vi.fn();
    render(<StockDetailSheet {...props} item={sansSeuil()} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(onSave).toHaveBeenCalledTimes(1);
    const saisie = onSave.mock.calls[0][0] as StockItem;
    expect(saisie.minStock).toBeUndefined();
    expect(saisie.reorder).toBe(false);
  });

  it('vider le seuil d’un article qui en avait un le rend inconnu, pas 0', () => {
    const onSave = vi.fn();
    render(<StockDetailSheet {...props} item={{ ...sansSeuil(), minStock: 5 }} onSave={onSave} />);
    const champ = document.getElementById('stock-min') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '' } });
    fireEvent.blur(champ);
    expect(screen.queryByText(/nombre positif/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect((onSave.mock.calls[0][0] as StockItem).minStock).toBeUndefined();
  });

  it('ficheAEnregistrer : sans seuil, l’article n’est jamais « à commander » par le seuil', () => {
    const vivant = sansSeuil();
    const fiche = regles.ficheAEnregistrer(vivant, vivant, { ...vivant, supplier: 'Autre' });
    expect(fiche.supplier).toBe('Autre');
    expect(fiche.reorder).toBe(false);
    expect('minStock' in fiche && fiche.minStock !== undefined).toBe(false);
  });
});
