/** @vitest-environment jsdom */
// Voie p1g (12.11) : « Maximum update depth exceeded » sur l'onglet Stocks quand on le rouvre (sous-onglet Articles mémorisé).
// Cause : `useStorageValue(() => StorageService.getStockMovements())` écrit dans le rendu — `read` change à chaque rendu, donc l'effet
// se rejoue, et `FirestoreRepo.all('movements')` rend un tableau NEUF tant que la collection est absente : setState, rendu, effet, à l'infini.
// Le dépôt simulé de QA mémoïse la collection vide et masquerait la boucle : on rejoue ici le comportement réel (`cache[name] ?? []`).
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { VirtuosoMockContext } from 'react-virtuoso';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import type { StockItem } from '../../src/types';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { within } from '@testing-library/react';
import { fixturePlanRealise, fixturePlans } from '../../src/domain/carnets/fixture';
import { BARRE_MATERIEL, BARRE_SUR_DEFILEMENT, COLONNE_MATERIEL } from '../../src/ui/finance/UpgradeWorkspace';

vi.mock('../../src/services/firestoreRepo', async () => {
  const qa = await import('../qa/hop-recipe/repo');
  // Comme le vrai `all` : une collection absente rend un tableau neuf à chaque lecture.
  return { ...qa, FirestoreRepo: { ...qa.FirestoreRepo, all: (name: string) => name === 'movements' ? [] : qa.FirestoreRepo.all(name) } };
});
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

const item = (ref: string, name: string, quantity: number): StockItem => ({ id: ref, ref, name, currentStock: quantity, minStock: 5, unit: 'kg', category: 'Malt', reorder: false });
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}>
    <StocksTab stocks={stocks} batches={[]}/>
  </VirtuosoMockContext.Provider>;
}

beforeEach(() => {
  localStorage.clear(); StorageService.clearMemoryCache();
  seedQa({ stockItems: [item('pale', 'Malt Pale Ale', 18), item('pils', 'Malt Pilsner', 2)].map(row => ({ ...row, kind: 'rawMaterials' })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('onglet Stocks rouvert sur Articles, sans mouvement enregistré', () => {
  it('ne boucle pas : aucun « Maximum update depth exceeded »', async () => {
    StorageService.setUiState('stocks_subtab', 'stock');
    const erreurs = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<Catalogue/>);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    expect(await screen.findByRole('button', { name: 'Ouvrir Malt Pale Ale' })).toBeInTheDocument();
    const boucle = erreurs.mock.calls.filter(appel => /Maximum update depth/.test(appel.map(String).join(' ')));
    expect(boucle).toHaveLength(0);
  });
});

/* corr. 2, L3 : le segment « À venir · Carnets · Réalisés » de Stocks › Matériel (R08). Données « ZZ TEST — … » de la fixture du banc. */
describe('Stocks › Matériel : le compte d’À venir et la colonne d’À venir', () => {
  const { items, plans, transactions, payments } = fixturePlanRealise();
  const annule = { ...fixturePlans()[0], id: 'ZZ-PLAN-ANNULE', title: 'ZZ TEST — plan annulé', status: 'cancelled' as const };
  /* Une idée de matériel de l'ancien Atelier : `mergeUpgradePlans` en fait un plan « idée » qu'À venir montre (c'est ce que la
     première ouverture sème : CR-001 et CR-002 de `defaultCreativeItems`, d'où « À venir 2 » sur un émulateur vide, L4-6). */
  const ancienne = { id: 'ZZ-CR-ATELIER', type: 'equipment', title: 'ZZ TEST — idée de l’ancien Atelier', status: 'research' };
  const monterMateriel = (segment: string) => {
    seedQa({ creativeItems: [...items, ancienne], financialPlans: [...plans, annule], transactions, financialPayments: payments });
    StorageService.setUiState('stocks_subtab', 'materiel');
    StorageService.setUiState('stocks_materiel', segment);
    return render(<Catalogue/>);
  };
  const segment = (nom: string) => screen.getByRole('navigation', { name: 'Vue du matériel' }).querySelector(`button:nth-child(${['Parc', 'À venir', 'Carnets', 'Réalisés'].indexOf(nom) + 1})`) as HTMLElement;

  it('« À venir n » compte les plans non réalisés (`estRealise`) et ce qu’À venir montre ; ni le payé, ni l’annulé', async () => {
    monterMateriel('avenir');
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    // Frigo (envoyé dans À venir, pas payé) + l'idée de l'ancien Atelier ; l'Embouteillage payé va dans Réalisés ; l'annulé nulle part.
    expect(segment('À venir').textContent).toBe('À venir2');
    expect(segment('Réalisés').textContent).toBe('Réalisés1');
    const colonne = document.querySelector('[data-colonne-materiel]') as HTMLElement;
    expect(colonne.textContent).toContain('ZZ TEST — Frigo de garde pour fûts');
    expect(colonne.textContent).toContain('ZZ TEST — idée de l’ancien Atelier');
    expect(colonne.textContent).not.toContain('ZZ TEST — Embouteillage');
    expect(colonne.textContent).not.toContain('plan annulé');
  });

  it('À venir est dans la colonne des cartes de Carnets : mêmes marges que `.cn-page` (carnets.css), le + volant porte « Ajouter un besoin », pas de « + Besoin » dedans (d1280-4, P39)', async () => {
    monterMateriel('avenir');
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 50)); });
    const colonne = document.querySelector('[data-colonne-materiel]') as HTMLElement;
    expect(colonne.className).toBe(COLONNE_MATERIEL);
    // P39 (h05-9, R28) : un seul + (le + volant, qui demande « Ajouter un besoin ») ; aucun « + Besoin » dans la colonne.
    expect(within(colonne).queryByRole('button', { name: 'Ajouter un besoin' })).toBeNull();
    // `.cn-page` : padding 8 px 12 px 16 px ; dès 900 px, 760 px de large et centrée. La colonne d'À venir dit la même chose en Tailwind.
    const css = readFileSync(resolve(__dirname, '../../src/ui/carnets/carnets.css'), 'utf8');
    expect(css).toMatch(/\.cn-page \{[^}]*padding: 8px 12px 16px;/);
    expect(css).toMatch(/@media \(min-width: 900px\) \{\s*\.cn-page \{ max-width: 760px; margin: 0 auto; \}/);
    expect(COLONNE_MATERIEL.split(' ').sort()).toEqual(['min-[900px]:max-w-[760px]', 'min-[900px]:mx-auto', 'pb-4', 'pt-2', 'px-3'].sort());
  });

  it('la barre de segments est opaque et porte l’ombre des barres qui flottent (m390-6)', async () => {
    monterMateriel('carnets');
    const barre = screen.getByRole('navigation', { name: 'Vue du matériel' });
    // Sur Carnets (et À venir, Réalisés), la liste qui défile commence au bord bas de la barre, sous son ombre (`-mb-1` reprend le gap-1).
    expect(barre.className).toBe(`${BARRE_MATERIEL} ${BARRE_SUR_DEFILEMENT}`);
    for (const c of ['bg-cave-900', 'shadow-lift', 'relative', 'z-10', '-mb-1']) expect(barre.classList.contains(c)).toBe(true);
  });
});
