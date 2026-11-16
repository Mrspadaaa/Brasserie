// @vitest-environment jsdom
// Jeu en ligne 16.11 après-midi : 36, « Supprimer » dans la fiche du carnet et dans l'éditeur, avec la même feuille de confirmation ;
// 37, la liste et la fiche disent la même chose (un manque sûr passe avant un stock inconnu).
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Recipe, StockItem } from '../../src/types';
import { etatDe } from '../../src/ui/production/recettes/recettesModel';
import { declarationPlusAssistant } from '../../src/pages/wizardPlus';

vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: <T,>(read: () => T) => read() }));
const stockCourant: { items: StockItem[] } = { items: [] };
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    getStocks: () => ({ rawMaterials: stockCourant.items, cleaning: [] }),
    getConfig: () => ({ brewhouses: [{ id: 'b', efficiencyPct: 75 }], activeBrewhouseId: 'b' }),
    getBatches: () => [],
    getUiState: (_k: string, d: unknown) => d,
    setUiState: () => undefined,
    subscribe: () => () => undefined
  }
}));
import { CarnetRecettes } from '../../src/ui/production/recettes/CarnetRecettes';

afterEach(cleanup);

const article = (ref: string, name: string, category: string, currentStock: number, unit = 'g'): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock, minStock: 0, reorder: false }) as StockItem;

/** Trois manques sûrs (malt, Citra, levure) et un houblon sans article de stock (inconnu). */
const zz = {
  id: 'zz1',
  name: 'ZZ TEST — Recette',
  style: 'American IPA',
  volumeL: 20,
  ogTarget: 1.06,
  fermentables: [{ name: 'ZZ Pale', stockItemRef: 'ZZ-PALE', weightKg: 5 }],
  hops: [
    { name: 'ZZ Citra', stockItemRef: 'ZZ-CITRA', weightG: 200, stage: 'dryHop' },
    { name: 'ZZ Mystère', weightG: 50, stage: 'dryHop' }
  ],
  yeast: { name: 'ZZ US-05', stockItemRef: 'ZZ-US05', qty: 2, unit: 'sachet' },
  adjuncts: []
} as unknown as Recipe;
const stockCourt = [article('ZZ-PALE', 'ZZ Pale', 'Malt', 1, 'kg'), article('ZZ-CITRA', 'ZZ Citra', 'Houblon', 20), article('ZZ-US05', 'ZZ US-05', 'Levure', 1, 'sachet')];

const props = () => ({ onOpenRecipe: vi.fn(), onEditRecipe: vi.fn(), onOpenBatch: vi.fn(), onBrew: vi.fn(), onNewRecipe: vi.fn(), onDeleteRecipe: vi.fn() });

describe('37 : un manque sûr passe avant un stock inconnu', () => {
  it('etatDe', () => {
    expect(etatDe(3, 1)).toBe('loin');
    expect(etatDe(1, 2)).toBe('presque');
    expect(etatDe(0, 1)).toBe('inconnu');
    expect(etatDe(0, 0)).toBe('pret');
  });
  it('la liste range la recette en « Plus loin · 3 achats », comme sa fiche (« il manque … »), et la fiche dit aussi l’inconnu', () => {
    stockCourant.items = stockCourt;
    render(<CarnetRecettes recipes={[zz]} batches={[]} {...props()} />);
    expect(screen.queryByText('À vérifier')).toBeNull();
    expect(screen.getByText('Plus loin')).toBeTruthy();
    expect(screen.getByText('3 achats')).toBeTruthy();
    fireEvent.click(screen.getByText('ZZ TEST — Recette'));
    expect(screen.getByText(/Pour la rebrasser, il manque/)).toBeTruthy();
    expect(screen.getByText(/est aussi à vérifier/)).toBeTruthy();
  });
});

describe('36 : Supprimer dans la fiche du carnet, même confirmation que la page', () => {
  it('la fiche porte « Supprimer la recette » ; la feuille de confirmation commune supprime', () => {
    stockCourant.items = stockCourt;
    const p = props();
    render(<CarnetRecettes recipes={[zz]} batches={[]} {...p} />);
    fireEvent.click(screen.getByText('ZZ TEST — Recette'));
    fireEvent.click(screen.getByRole('button', { name: /Supprimer la recette/ }));
    expect(screen.getAllByText('Supprimer cette recette ?').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/La recette quitte le catalogue/).length).toBeGreaterThan(0);
    expect(p.onDeleteRecipe).not.toHaveBeenCalled();
    const boutons = screen.getAllByRole('button', { name: /Supprimer la recette/ });
    fireEvent.click(boutons[boutons.length - 1]);
    expect(p.onDeleteRecipe).toHaveBeenCalledWith(zz);
  });
  it('sans onDeleteRecipe, la fiche ne propose pas de supprimer', () => {
    stockCourant.items = stockCourt;
    const { onDeleteRecipe: _, ...sans } = props();
    render(<CarnetRecettes recipes={[zz]} batches={[]} {...sans} />);
    fireEvent.click(screen.getByText('ZZ TEST — Recette'));
    expect(screen.queryByRole('button', { name: /Supprimer la recette/ })).toBeNull();
  });
});

describe('36 : Supprimer dans le menu du « + » de l’éditeur', () => {
  const base = { steps: [{ id: 'identite', label: 'Identité' }], step: 'identite', enregistrable: true, enregistrer: () => undefined, exporter: () => undefined };
  it('une recette enregistrée : « Supprimer la recette » en dernier, genre supprimer', () => {
    const supprimer = vi.fn();
    const d = declarationPlusAssistant({ ...base, supprimer });
    const derniere = d.actions[d.actions.length - 1];
    expect(derniere).toMatchObject({ id: 'supprimer', label: 'Supprimer la recette', genre: 'supprimer' });
    derniere.lancer();
    expect(supprimer).toHaveBeenCalled();
  });
  it('une nouvelle recette ou une copie : rien à supprimer', () => {
    expect(declarationPlusAssistant(base).actions.some((a) => a.id === 'supprimer')).toBe(false);
  });
});
