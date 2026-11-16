import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { bandeDuBudget, groupesDuBudget } from '../../src/ui/finance/budget/piles';
import { BrewBudgetSheet } from '../../src/ui/finance/BrewBudgetSheet';
import { ChoixBrassin } from '../../src/ui/finance/budget/ChoixBrassin';
import { coutLitre, troisNotions } from '../../src/domain/finance/chaineLitre';
import { demandKey, estimateBrewBudget, type BrewBudgetSettings, type BrewBudgetSnapshot } from '../../src/domain/finance/brewBudget';
import type { AppConfig, Batch, Recipe, StockItem } from '../../src/types';

vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
afterEach(cleanup);

/** La Pale Ale de la maquette m4bb-a : 20,94 payé, 64,26 à payer, 117,57 l'année = 202,77 ; un ingrédient (acide lactique) sans prix. */
const ligne = (key: string, name: string, stockCost: number, purchaseCost: number, consumedCost: number | null) => ({ key, name, kind: 'ingredient', quantity: 1, unit: 'kg', stockCost, purchaseCost, consumedCost, issues: consumedCost === null ? ['prix'] : [], missing: 0, purchaseQuantity: purchaseCost > 0 ? 1 : 0 });
const snap = (extra: Partial<BrewBudgetSnapshot> = {}) => ({
  totalCost: 202.77, dejaPaye: 20.94, aPayer: 64.26, annee: 117.57, fixedAllocation: 104.67, depreciationAllocation: 12.9, complete: false, issues: [], netVolumeSource: 'saisi',
  settings: { annualVolumeL: 6000, annualFixedCHF: 6978, annualDepreciationCHF: 860, includeFixed: true, includeDepreciation: true },
  recipeSnapshot: { fermentables: [{ name: 'Pilsner' }, { name: 'Munich' }], hops: [{ name: 'Citra' }], yeast: { name: 'US-05' } },
  lines: [ligne('a', 'Pilsner', 11.44, 0, 11.44), ligne('b', 'Munich', 0, 3.2, 3.2), ligne('c', 'Citra', 0, 9.8, 9.8), ligne('d', 'US-05', 4.6, 0, 4.6), ligne('e', 'Acide lactique', 0, 0, null)],
  fraisParPoste: { energy: { cout: 9.5, cash: 9.5 }, cleaning: { cout: 4.2, cash: 4.2 }, packaging: { cout: 30.72, cash: 30.72 }, beerTax: { cout: 6.84, cash: 6.84 } },
  ...extra
}) as unknown as BrewBudgetSnapshot;

describe('budget d’un brassin m4bb-a : piles et rangées', () => {
  it('les trois piles sont les trois notions du brassin, au centime, et leur somme est le coût', () => {
    const s = snap(), notions = troisNotions(s);
    const { piles, litre } = bandeDuBudget(s, notions, coutLitre({ notions, litres: 27 }), 27);
    expect(piles.map(p => p.cents)).toEqual([2094, 6426, 11757]);
    expect(piles.map(p => p.texte)).toEqual(['20,94', '64,26', '117,57']);
    expect(piles.reduce((n, p) => n + p.cents, 0)).toBe(Math.round(s.totalCost * 100));
    expect(piles[2].ratio).toBe(1);
    expect(litre.etat).toBe('minimum'); // un ingrédient sans prix : « au moins »
    expect(litre.texte).toBe('7,51');
    expect(litre.division).toBe('202,77 ÷ 27 L');
  });
  it('litres nets inconnus : le litre est « — », jamais calculé sur le volume à brasser', () => {
    const s = snap(), { litre } = bandeDuBudget(s, troisNotions(s), null, null);
    expect(litre).toEqual({ etat: 'inconnu', texte: '—', division: null });
  });
  it('une pile inconnue et nulle s’écrit « ? », pas « 0,00 »', () => {
    const s = snap({ dejaPaye: 0, aPayer: 0, annee: 0, totalCost: 0, settings: { includeFixed: true, annualFixedCHF: 6978 } as never });
    expect(bandeDuBudget(s, null, null, 27).piles[2].texte).toBe('?');
  });
  it('les rangées : état de chaque ingrédient, frais à payer, part de l’année répartie ; l’inconnu reste « ? »', () => {
    const groupes = groupesDuBudget(snap(), { ener: true, net: true, emb: true, imp: true }, { quantite: l => `${l.quantity} ${l.unit}`, og: 1.048 });
    const par = Object.fromEntries(groupes.map(g => [g.id, g]));
    expect(par.malt.total).toBe(14.64);
    expect(par.malt.rangees.map(r => r.etat)).toEqual(['stock', 'acheter']);
    expect(par.q.rangees.map(r => r.etat)).toEqual(['acheter', 'stock']);
    expect(par.autres.total).toBeNull();
    expect(par.autres.rangees[0]).toMatchObject({ nom: 'Acide lactique', montant: null, etat: 'inconnu' });
    expect(par.frais.total).toBe(51.26);
    expect(par.frais.rangees.find(r => r.noeud === 'imp')).toMatchObject({ detail: '1,048', etat: 'payer', estime: true });
    expect(par.annee.total).toBe(117.57);
    expect(par.annee.rangees.map(r => r.detail)).toEqual(['6 978 / an', '860 / an']);
  });
});

// La fixture de c3a (celle de brewBudgetSheet.test) : 22,41 déjà payé + 64,26 à payer + 116,10 de l'année = 202,77 pour 27 L nets.
const pilsner = { id: 'MP-1', ref: 'MP-1', name: 'Pilsner', unit: 'kg', currentStock: 6, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const pale = { id: 'MP-2', ref: 'MP-2', name: 'Pale', unit: 'kg', currentStock: 0, category: 'Malt', minStock: 0, reorder: false } as StockItem;
const recette = { id: 'R3', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: '15.09.2026', ogTarget: 1.048, hops: [], yeast: { name: '', qty: 0, unit: 'sachet', form: 'dry' },
  fermentables: [{ name: 'Pilsner', weightKg: 5.6025, kind: 'grain', use: 'empatage' }, { name: 'Pale', weightKg: 5.605, kind: 'grain', use: 'empatage' }] } as unknown as Recipe;
const reglages: BrewBudgetSettings = { costs: { energy: { enabled: true, amountTTC: 8 }, cleaning: { enabled: true, amountTTC: 3 }, packaging: { enabled: true, amountTTC: 24 }, beerTax: { enabled: true } },
  includeFixed: true, includeDepreciation: true, annualVolumeL: 1200, annualFixedCHF: 4800, annualDepreciationCHF: 360 };
const p4 = { amount: 4, quantity: 1, unit: 'kg', basis: 'TTC', tvaRate: 0, source: 'manual', date: '09.09.2026' } as const;
const enregistre = estimateBrewBudget({ recipe: recette, stockItems: [pilsner, pale], batches: [], brewDate: '15.09.2026', netVolumeL: 27, og: '1.048', settings: reglages, prices: { [demandKey('Pilsner', 'kg')]: p4, [demandKey('Pale', 'kg')]: p4 }, now: '2026-09-09T12:00:00Z' });
const config = { fiscal: { isTvaRegistered: false }, brewhouses: [] } as unknown as AppConfig;
const feuille = () => render(<BrewBudgetSheet open recipe={recette} stockItems={[pilsner, pale]} batches={[]} config={config} savedEstimate={enregistre} onSave={vi.fn()} onClose={vi.fn()} />);
const fr = (v: number) => new Intl.NumberFormat('fr-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v).replace(/[  ]/g, ' ');

describe('la feuille m4bb-a : les piles sont celles de brewBudget, le flux c3a reste à un toucher', () => {
  it('à l’ouverture : trois piles = déjà payé, à payer, année du snapshot ; litre 7,51 ; rangées par groupe', () => {
    feuille();
    const piles = [...document.querySelectorAll('.bbx-p b')].map(b => b.textContent);
    expect(piles).toEqual([fr(enregistre.dejaPaye!), fr(enregistre.aPayer!), fr(enregistre.annee!)]);
    expect(piles).toEqual(['22,41', '64,26', '116,10']);
    expect(document.querySelector('.bbx-lit')).toHaveTextContent('7,51');
    expect(document.querySelector('.bbx-base')).toHaveTextContent('202,77 ÷ 27 L');
    expect(screen.getByRole('button', { name: /^Volumes : 27 L nets/ })).toBeInTheDocument();
    for (const groupe of ['Malt', 'Frais', "Part de l'année"]) expect(screen.getByRole('region', { name: groupe })).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Malt' })).getAllByRole('button').map(b => b.getAttribute('data-etat'))).toEqual(['stock', 'acheter']);
    expect(document.querySelector('.cbf-src')).toBeNull(); // le flux c3a n'est plus à l'ouverture
  });
  it('« Détail du litre » ouvre le flux c3a inchangé ; un nœud ouvert depuis c3a revient à c3a, puis « Retour au budget »', () => {
    feuille();
    fireEvent.click(screen.getByRole('button', { name: 'Détail du litre' }));
    expect(document.querySelector('[data-s="stock"]')).toHaveTextContent('22,41');
    expect(document.querySelector('[data-s="now"]')).toHaveTextContent('64,26');
    expect(document.querySelector('[data-s="an"]')).toHaveTextContent('116,10');
    fireEvent.click(screen.getByRole('button', { name: /^Charges fixes :/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Retour au détail du litre/ }));
    expect(document.querySelector('[data-s="stock"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /^Retour au budget/ }));
    expect(document.querySelector('.bbx-band')).not.toBeNull();
  });
  it('toucher une rangée ouvre le détail existant, Retour ramène au budget', () => {
    feuille();
    fireEvent.click(within(screen.getByRole('region', { name: 'Frais' })).getAllByRole('button')[0]);
    expect(screen.getByRole('heading', { name: 'Frais du brassin' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Retour au budget/ }));
    expect(document.querySelector('.bbx-band')).not.toBeNull();
  });
});

describe('le choix du brassin m4bb-a', () => {
  const lot = { id: 'B-2025-014', name: 'Pale Ale', status: 'planifie', volumeL: 30, recipeRef: 'R1', brewDate: '20.11.2026' } as unknown as Batch;
  const recettes = [{ id: 'R1', name: 'Pale Ale', volumeL: 30 }, { id: 'R2', name: 'Saison des vignes', volumeL: 25 }] as unknown as Recipe[];
  it('Prévus puis Recettes ; une recette déjà prévue n’est listée qu’une fois', () => {
    const onBatch = vi.fn(), onRecipe = vi.fn();
    render(<ChoixBrassin batches={[lot]} recipes={recettes} onBatch={onBatch} onRecipe={onRecipe} />);
    expect(screen.getAllByText('Pale Ale')).toHaveLength(1);
    expect(screen.getByText(/B-2025-014 · brassage 20 nov\./)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Pale Ale/ })); expect(onBatch).toHaveBeenCalledWith(lot);
    fireEvent.click(screen.getByRole('button', { name: /Saison des vignes/ })); expect(onRecipe).toHaveBeenCalledWith(recettes[1]);
  });
  it('rien à estimer : le message dit où créer une recette', () => {
    render(<ChoixBrassin batches={[]} recipes={[]} onBatch={vi.fn()} onRecipe={vi.fn()} />);
    expect(screen.getByText(/Crée d’abord une recette/)).toBeInTheDocument();
  });
});
