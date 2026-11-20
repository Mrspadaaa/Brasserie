// @vitest-environment jsdom
/**
 * T3B-11 et T3B-12 (en ligne, 20.11, tag tour3) : la fiche de la recette « Milk Stout » du brasseur.
 *  - T3B-12 : Lactose 300 g et Whirlfloc 1 g rangés sous Houblons (« α ? ») ; IBU « — » (« ajouts de houblon à vérifier ») malgré Target 35 g α 11,3
 *    et East Kent Goldings 20 g α 5,5 à 60′ ; noms « Rstgerste (orge torrfie) », « Caramnch Typ 2 » (accents perdus dans la donnée).
 *  - T3B-11 : la feuille dit « brassée 1 fois », la fiche « Brassins : aucun brassin ».
 * Données comme celles du brasseur (recette importée, vrais noms), pas une fixture qui évite le cas. Rouge avant : chaque test échoue sur la fiche du 19.11.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { recetteLue, reparerNomAbime, separerAjoutsDesHoublons } from '../../src/domain/recipeIngredientsAbimes';
import { ibuListe } from '../../src/domain/recipeMetrics';
import { brassinsDeLaRecette } from '../../src/domain/recipeBrassins';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, Recipe } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const NOMS_DU_STOCK = ['Maris Otter', 'Röstgerste (orge torréfiée)', 'Caramünch Typ 2', 'Target', 'East Kent Goldings'];

/** Milk Stout 30 L du brasseur : accents perdus dans la donnée, lactose et Whirlfloc rangés parmi les houblons, aucune durée d'ébullition enregistrée. */
const milkStout = (): Recipe => {
  const r = yeastFlowRecipe();
  delete (r as { boilMin?: number }).boilMin;
  return { ...r, id: 'rec-ms', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30, ogTarget: 1.062, batchRef: 'LOT-001', adjuncts: [],
    fermentables: [
      { name: 'Maris Otter', weightKg: 5.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 },
      { name: 'Rstgerste (orge torrfie)', weightKg: 0.4, kind: 'grain', use: 'empatage', potentialPpg: 30, colorEbc: 1100 },
      { name: 'Caramnch Typ 2', weightKg: 0.6, kind: 'grain', use: 'empatage', potentialPpg: 33, colorEbc: 120 },
    ],
    hops: [
      { name: 'Target', weightG: 35, alpha: 11.3, stage: 'boil', timeMin: 60 },
      { name: 'East Kent Goldings', weightG: 20, alpha: 5.5, stage: 'boil', timeMin: 60 },
      { name: 'Lactose', weightG: 300, stage: 'boil', timeMin: 15 },
      { name: 'Whirlfloc', weightG: 1, stage: 'boil', timeMin: 15 },
    ] } as unknown as Recipe;
};
const monter = (recipe: Recipe, batches: Batch[] = []) => {
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: NOMS_DU_STOCK.map((name, i) => ({ id: `s${i}`, ref: `S${i}`, name, category: 'Malt' })), cleaning: [], equipment: [], kegs: [] } as never);
  const actions = { onClose: vi.fn(), onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onBrew: vi.fn(), onOpenBatch: vi.fn() };
  return render(<RecipePage recipe={recipe} batches={batches} config={defaultConfig} {...actions} />);
};

describe('T3B-12 : lactose et Whirlfloc ne sont pas des houblons', () => {
  it('séparer : les ajouts sortent des houblons, un houblon sans α reste un houblon', () => {
    const { houblons, ajouts } = separerAjoutsDesHoublons([...milkStout().hops, { name: 'Citra', weightG: 10, stage: 'boil', timeMin: 10 } as never]);
    expect(houblons.map(h => h.name)).toEqual(['Target', 'East Kent Goldings', 'Citra']);
    expect(ajouts).toEqual([
      { name: 'Lactose', amount: 300, unit: 'g', step: 'Ébullition, 15′' },
      { name: 'Whirlfloc', amount: 1, unit: 'g', step: 'Ébullition, 15′' },
    ]);
  });
  it('la liste : l’IBU est celui de Target et d’East Kent Goldings, pas un inconnu', () => {
    const ibu = ibuListe(recetteLue(milkStout(), NOMS_DU_STOCK), 75);
    expect(ibu).toBeGreaterThan(20);
    expect(ibu).toBeLessThan(60);
  });
  it('la fiche : Houblons ne cite que Target et East Kent Goldings ; lactose et Whirlfloc sont dans Additifs ; l’IBU a un chiffre', () => {
    const { container } = monter(milkStout());
    const houblons = container.querySelector('details[data-recipe-section="Houblons"]') as HTMLElement;
    expect(houblons.textContent).toMatch(/Target/);
    expect(houblons.textContent).not.toMatch(/Lactose|Whirlfloc/);
    expect(container.textContent).not.toMatch(/ajouts de houblon à vérifier/);
    const bandeau = container.querySelector('[data-element="r1-bandeau"]') as HTMLElement;
    expect(within(bandeau).getByText('IBU').parentElement?.textContent).toMatch(/\d/);
    expect(container.textContent).toMatch(/Additifs/);
    expect(container.textContent).toMatch(/Whirlfloc/);
  });
});

describe('T3B-12 : les noms aux accents perdus', () => {
  it('un nom abîmé retrouve le nom du stock quand un seul y correspond', () => {
    expect(reparerNomAbime('Rstgerste (orge torrfie)', NOMS_DU_STOCK)).toBe('Röstgerste (orge torréfiée)');
    expect(reparerNomAbime('Caramnch Typ 2', NOMS_DU_STOCK)).toBe('Caramünch Typ 2');
  });
  it('jamais deviné : sans correspondance, plusieurs correspondances, ou nom déjà juste, le nom reste', () => {
    // T4-4 (r3) : sans le stock, le catalogue des noms de malts rend « Röstgerste (orge torréfiée) » ; un nom que ni l'un ni l'autre ne connaît reste.
    expect(reparerNomAbime('Xyzstgerste (abc)', [])).toBe('Xyzstgerste (abc)');
    expect(reparerNomAbime('Caramnch', ['Caramünch', 'Caramônch'])).toBe('Caramnch');
    expect(reparerNomAbime('Pilsner Malz', ['Pilsner Malz'])).toBe('Pilsner Malz');
    expect(reparerNomAbime('Röstgerste', NOMS_DU_STOCK)).toBe('Röstgerste');
  });
  it('la fiche écrit « Röstgerste (orge torréfiée) » et « Caramünch Typ 2 »', () => {
    const { container } = monter(milkStout());
    expect(container.textContent).toMatch(/Röstgerste \(orge torréfiée\)/);
    expect(container.textContent).toMatch(/Caramünch Typ 2/);
    expect(container.textContent).not.toMatch(/Rstgerste|Caramnch/);
  });
});

describe('T3B-11 : la fiche et la feuille comptent les mêmes brassins', () => {
  const lot = (extra: Partial<Batch>): Batch => ({ id: 'LOT-001', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30, status: 'termine', brewDate: '01.05.2026', og: '1.062', ...extra }) as Batch;
  it('un brassin lié par `recipe.batchRef` (sans recipeRef) est un brassin de la recette', () => {
    const recette = milkStout();
    expect(brassinsDeLaRecette(recette, [lot({})]).map(b => b.id)).toEqual(['LOT-001']);
    const { container } = monter(recette, [lot({})]);
    expect(container.textContent).not.toMatch(/aucun brassin/);
    expect(screen.getAllByText(/LOT-001/).length).toBeGreaterThan(0);
  });
  it('un brassin d’une autre version de la même lignée compte aussi (la feuille compte la lignée)', () => {
    const v2 = { ...milkStout(), id: 'rec-ms-v2', version: 2, parentRecipeId: 'rec-ms', batchRef: undefined } as Recipe;
    const v1 = { ...milkStout(), id: 'rec-ms', version: 1 } as Recipe;
    const surV1 = lot({ id: 'LOT-009', recipeRef: 'rec-ms' });
    expect(brassinsDeLaRecette(v2, [surV1], [v1, v2]).map(b => b.id)).toEqual(['LOT-009']);
    expect(brassinsDeLaRecette(v2, [lot({ id: 'LOT-010', recipeRef: 'autre' })], [v1, v2])).toEqual([]);
  });
  it('sans brassin lié, la fiche dit toujours « aucun brassin »', () => {
    const { container } = monter({ ...milkStout(), batchRef: undefined });
    expect(container.textContent).toMatch(/aucun brassin/);
  });
});
