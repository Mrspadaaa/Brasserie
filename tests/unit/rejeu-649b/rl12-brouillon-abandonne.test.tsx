// @vitest-environment jsdom
// Rejeu en ligne 649bcc54 (08.11), RL-12 : dans l'assistant de recette, « Créer « X » (stock à zéro) » crée AUSSITÔT un article de stock réel,
// qui restait même après « Abandonner » le brouillon. Attendu : un brouillon abandonné ne laisse rien ; un article cité par une recette, reçu en
// stock, ou créé par un brouillon ENREGISTRÉ reste.
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StorageService, defaultConfig } from '../../../src/services/storage';
import { noterArticleCree, oublierArticlesCrees, retirerArticlesDuBrouillon } from '../../../src/services/articlesDuBrouillon';
import type { StockItem } from '../../../src/types';
import { allerEtape } from '../../helpers/wizard';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const { BrewWizard } = await import('../../../src/pages/BrewWizard');

// Un stock en mémoire, simulé : le banc n'écrit nulle part.
let stock: StockItem[] = [];
let citesParUneRecette = new Set<string>();
const article = (ref: string, name: string, currentStock = 0): StockItem => ({ ref, id: name, name, category: 'Malt', unit: 'kg', currentStock, minStock: 0, reorder: false } as StockItem);

beforeEach(() => {
  localStorage.clear();
  stock = [];
  citesParUneRecette = new Set();
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: stock, cleaning: [], equipment: [], kegs: [] }) as never);
  vi.spyOn(StorageService, 'deleteStockItem').mockImplementation((_t, ref) => {
    if (citesParUneRecette.has(ref)) return { ok: false, refus: 'Cité par une recette.' };
    stock = stock.filter((s) => s.ref !== ref);
    return { ok: true };
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

describe('RL-12 — articlesDuBrouillon', () => {
  it('l’abandon retire les articles créés par le brouillon, liés à rien', () => {
    stock = [article('MP-1', 'Abbey Malt'), article('MP-2', 'Autre')];
    noterArticleCree('k', 'MP-1');
    expect(retirerArticlesDuBrouillon('k')).toEqual({ retires: ['MP-1'], gardes: [] });
    expect(stock.map((s) => s.ref)).toEqual(['MP-2']);
  });
  it('un article cité par une recette, ou déjà reçu en stock, reste', () => {
    stock = [article('MP-1', 'Cité'), article('MP-2', 'Reçu', 5)];
    citesParUneRecette.add('MP-1');
    noterArticleCree('k', 'MP-1'); noterArticleCree('k', 'MP-2');
    expect(retirerArticlesDuBrouillon('k')).toEqual({ retires: [], gardes: ['MP-1', 'MP-2'] });
    expect(stock).toHaveLength(2);
  });
  it('une recette enregistrée oublie ses articles : un abandon ultérieur n’y touche pas ; un autre brouillon n’est pas touché', () => {
    stock = [article('MP-1', 'A'), article('MP-2', 'B')];
    noterArticleCree('k', 'MP-1'); noterArticleCree('autre', 'MP-2');
    oublierArticlesCrees('k');
    expect(retirerArticlesDuBrouillon('k')).toEqual({ retires: [], gardes: [] });
    expect(stock).toHaveLength(2);
  });
});

describe('RL-12 — dans l’assistant', () => {
  it('« Créer « Abbey Malt » » puis « Abandonner » le brouillon : l’article n’existe plus', async () => {
    const creer = vi.fn((name: string, category: string, unit: string) => {
      const a = { ...article(`MP-${stock.length + 1}`, name), category, unit };
      stock = [...stock, a];
      return a;
    });
    const onClose = vi.fn();
    render(<BrewWizard draftKey="dev-local:REC-RL12" config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={onClose} onSave={vi.fn()}
      onCreateStockItem={creer} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    fireEvent.change(await screen.findByLabelText('Nom de la bière'), { target: { value: 'Essai RL-12' } });
    allerEtape(/Malts/);
    const champ = await screen.findByRole('combobox', { name: /Ajouter un fermentescible/ });
    fireEvent.focus(champ);
    fireEvent.change(champ, { target: { value: 'Abbey Malt' } });
    fireEvent.click(await screen.findByRole('option', { name: /Créer « Abbey Malt » \(stock à zéro\)/ }));
    await waitFor(() => expect(creer).toHaveBeenCalledTimes(1));
    expect(stock.map((s) => s.name)).toEqual(['Abbey Malt']);
    fireEvent.click(await screen.findByRole('button', { name: 'Abandonner le brouillon' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Abandonner' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(stock).toEqual([]);
  }, 60000);
});
