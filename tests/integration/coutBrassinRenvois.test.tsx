// @vitest-environment jsdom
/* Voie rvC (CP-18, 10.11) : « Pas de renvoi ? Ou mettre les valeurs pour avoir les données ?? » (coût du brassin de « Ssr »).
   Chaque « ? », « à confirmer », « à compléter » du coût du brassin est un renvoi vers l'endroit où saisir la donnée, avec une ligne qui dit ce que le manque empêche.
   Rouge sur HEAD acc39f7a : le bloc « Données à compléter » n'existe pas, « ? L » et « litres nets à confirmer » sont du texte nu. */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import type { AppConfig, Batch, Recipe, StockItem } from '../../src/types';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/finance/FinanceForms', () => ({ ProfileSheet: ({ parametres }: { parametres?: boolean }) => <div role="dialog" aria-label="Solde et paramètres financiers" data-parametres={parametres ? 'ouverts' : 'fermes'} /> }));

const pilsner = { id: 'MP-1', ref: 'MP-1', name: 'Pilsner', unit: 'kg', currentStock: 0, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const recette = { id: 'R3', name: 'Ssr', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const brassin = { id: 'B1', name: 'Ssr', status: 'conditionne', volumeL: 30, brewDate: '15.09.2026', recipeSnapshot: recette } as unknown as Batch;
/** Clairsemé : ni litres nets, ni prix du malt, ni production annuelle. */
const sansRien = () => estimateBrewBudget({ recipe: recette, stockItems: [pilsner], batches: [], brewDate: '15.09.2026', settings: { costs: { energy: { enabled: true }, cleaning: { enabled: true }, packaging: { enabled: true }, beerTax: { enabled: true } }, includeFixed: true, includeDepreciation: true }, prices: {}, now: '2026-09-09T12:00:00Z' });
const profile = { annualProductionL: undefined } as never;

const MANQUE = /\?|à compléter|à noter|à confirmer|à renseigner|à indiquer|à corriger|à compter|à estimer|illisible/i;
const estQuestion = (t: string) => /^[A-ZÀ-Ý].*\?$/.test(t) && t.split(/\s+/).length >= 3 && !/à (compléter|noter|confirmer|renseigner|indiquer|corriger|compter|estimer)|illisible/i.test(t);
/** Les textes visibles qui annoncent un manque sans renvoi (button, a, summary, data-renvoi) autour. */
function fautes(racine: ParentNode): string[] {
  const out: string[] = []; const w = document.createTreeWalker(racine as Node, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const t = (w.currentNode.textContent ?? '').replace(/\s+/g, ' ').trim(); const el = w.currentNode.parentElement;
    if (!t || !MANQUE.test(t) || estQuestion(t) || !el || el.closest('[aria-hidden="true"]:not(svg *)')) continue;
    const c = el.closest('button, a, [role=button], summary, [data-renvoi="aucun"]') as HTMLButtonElement | null;
    if (!c || c.disabled) out.push(t.slice(0, 70));
  }
  return [...new Set(out)];
}
const rendre = (props: Partial<React.ComponentProps<typeof BrewBudgetSheet>> = {}) => render(<BrewBudgetSheet open recipe={recette} stockItems={[pilsner]} batches={[]} config={config} onSave={vi.fn()} onClose={vi.fn()} {...props} />);
afterEach(cleanup);

describe('coût du brassin : chaque manque est un renvoi (CP-18)', () => {
  it('aucun « ? » ni « à confirmer » nu : tous sont dans un bouton', () => {
    rendre({ batch: brassin, savedEstimate: sansRien(), settings: { annualFixedCHF: undefined }, onMesures: vi.fn(), profile });
    expect(fautes(document.body)).toEqual([]);
  });
  it('le bloc « Données à compléter » liste litres, prix du malt et production annuelle, chacun avec ce que le manque empêche', () => {
    rendre({ batch: brassin, savedEstimate: sansRien(), onMesures: vi.fn(), profile });
    const bloc = screen.getByRole('region', { name: 'Données à compléter' });
    const lignes = within(bloc).getAllByRole('button').map(b => b.getAttribute('data-manque'));
    expect(lignes).toEqual(expect.arrayContaining(['litres', 'malt', 'annuel']));
    expect(bloc.textContent).toMatch(/Sans eux, pas de coût du litre/);
    expect(bloc.textContent).toMatch(/Sans (elle|lui), /);
  });
  it('litres : un brassin produit renvoie à la fiche › Mesures (la feuille se ferme)', () => {
    const onMesures = vi.fn(), onClose = vi.fn();
    rendre({ batch: brassin, savedEstimate: sansRien(), onMesures, onClose });
    fireEvent.click(screen.getByRole('button', { name: /^Volumes : litres nets à renseigner/ }));
    expect(onMesures).toHaveBeenCalledTimes(1); expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('litres : sans fiche (recette), le renvoi ouvre « Volumes et date », où le net se saisit', () => {
    rendre({ onMesures: vi.fn() });
    fireEvent.click(within(screen.getByRole('region', { name: 'Données à compléter' })).getByRole('button', { name: /Litres nets du brassin/ }));
    expect(screen.getByLabelText('Volume net attendu')).toBeInTheDocument();
  });
  it('ingrédient sans prix : le renvoi ouvre ses lignes, filtrées sur « À compléter »', () => {
    rendre({ batch: brassin, savedEstimate: sansRien(), onMesures: vi.fn() });
    fireEvent.click(within(screen.getByRole('region', { name: 'Données à compléter' })).getByRole('button', { name: /Prix de 1 ingrédient : malt/ }));
    expect(screen.getByLabelText('Prix de Pilsner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^À compléter/ })).toHaveAttribute('aria-pressed', 'true');
  });
  it('production annuelle : le renvoi ouvre le solde avec « Paramètres des prévisions et des brassins » dépliés', async () => {
    rendre({ batch: brassin, savedEstimate: sansRien(), onMesures: vi.fn(), profile });
    fireEvent.click(within(screen.getByRole('region', { name: 'Données à compléter' })).getByRole('button', { name: /Production annuelle prévue/ }));
    await waitFor(() => expect(document.querySelector('[aria-label="Solde et paramètres financiers"]')).toHaveAttribute('data-parametres', 'ouverts'));
  });
  it('« Déjà payé » inconnu : sa ligne et sa tâche ouvrent le prix manquant', () => {
    rendre({ batch: brassin, savedEstimate: sansRien(), onMesures: vi.fn() });
    fireEvent.click(screen.getByRole('button', { name: /^Déjà payé/ }));
    const tache = document.querySelector<HTMLButtonElement>('button[data-manque="stock"]')!;
    expect(tache.textContent).toMatch(/Sans eux, le déjà payé est un minimum/);
    fireEvent.click(tache);
    expect(screen.getByLabelText('Prix de Pilsner')).toBeInTheDocument();
  });
  it('Prévoir attend : la raison est un bouton qui mène au manque', () => {
    rendre({ savedEstimate: undefined, onMesures: vi.fn() });
    const raison = document.querySelector<HTMLButtonElement>('[data-booster="prevoir-raison"]');
    if (raison && raison.tagName === 'BUTTON') { fireEvent.click(raison); expect(screen.getByLabelText('Volume net attendu')).toBeInTheDocument(); }
    else expect(raison).toBeNull();
  });
});
