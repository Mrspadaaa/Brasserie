import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProductionTab } from '../../src/components/tabs/ProductionTab';
import { normalizeRecipe } from '../../src/domain/recipeSnapshot';
import { Recipe, BrewhouseProfile } from '../../src/types';

/**
 * La liste des recettes doit s'afficher, y compris pour une recette CRÉÉE PAR
 * L'ASSISTANT.
 *
 * ⚠️ La panne, telle que rencontrée : « quand je clique sur recette celui-ci me
 * fait crash l'app — Cannot read properties of undefined (reading 'reduce') ».
 *
 * `Recipe.malts` est déprécié et facultatif ; `normalizeRecipe` remplit
 * `fermentables` DEPUIS `malts`, jamais l'inverse. Toute recette écrite depuis
 * la refonte n'a donc plus de `malts`, et `r.malts.reduce(...)` jetait pendant
 * le rendu de la liste — écran blanc, plus aucune recette accessible.
 *
 * Ce qui l'a laissé passer : les recettes de démonstration portent ENCORE les
 * deux champs. Le bug n'apparaissait que sur les recettes réelles. Ce test part
 * donc d'une recette moderne, sans `malts`.
 */

afterEach(cleanup);

const BREWHOUSE: BrewhouseProfile = {
  id: 'bh1',
  name: 'Cuve 30 L',
  volumeL: 30,
  efficiencyPct: 75,
  boilOffRatePct: 10,
  deadSpaceL: 2,
  mashRatioLPerKg: 3
} as BrewhouseProfile;

/** Une recette telle que `BrewWizard.build()` l'écrit : pas de `malts`. */
const RECETTE_MODERNE = {
  id: 'REC-1',
  name: 'NEIPA Tropicale',
  style: 'NEIPA',
  volumeL: 30,
  brewDate: '2026-09-04',
  boilMin: 60,
  ogTarget: 1.062,
  fgTarget: 1.012,
  abvTarget: 6.6,
  fermentables: [
    { name: 'Pale Ale', weightKg: 6, kind: 'grain', use: 'empatage', colorEbc: 6 },
    // Le sucre ne compte ni dans la couleur ni dans la facture de grain.
    { name: 'Lactose', weightKg: 0.5, kind: 'lactose', use: 'ebullition', colorEbc: 0 }
  ],
  totalGristKg: 6,
  hops: [{ name: 'Citra', weightG: 100, stage: 'whirlpool', alpha: 12 }],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' },
  fermentation: [],
  steps: [],
  notes: []
} as unknown as Recipe;

function monter(recipes: Recipe[]) {
  return render(
    <ProductionTab
      batches={[]}
      recipes={recipes}
      brewhouses={[BREWHOUSE]}
      activeBrewhouseId="bh1"
      globalTimeFilter="all"
      targetSubTab="recipes"
      onOpenCreateBatch={vi.fn()}
      onOpenQuickAction={vi.fn()}
      onOpenRecipe={vi.fn()}
      onOpenBrewDay={vi.fn()}
      onDraftRecipe={vi.fn()}
    />
  );
}

describe('La liste des recettes', () => {
  it('⚠️ s’affiche pour une recette sans `malts` — celles que crée l’assistant', () => {
    monter([normalizeRecipe(RECETTE_MODERNE)]);
    expect(screen.getByText('NEIPA Tropicale')).toBeInTheDocument();
  });

  it('⚠️ ne compte que le GRAIN dans la facture, pas le lactose', () => {
    monter([normalizeRecipe(RECETTE_MODERNE)]);
    // 6 kg de grain, et non 6.5 : le lactose n'est pas de la facture de grain.
    expect(screen.getByText(/6 kg/)).toBeInTheDocument();
  });

  it('lit encore une ancienne recette qui n’a que `malts`', () => {
    const ancienne = {
      ...RECETTE_MODERNE,
      id: 'REC-0',
      name: 'Stout d’avant',
      fermentables: undefined,
      malts: [{ name: 'Maris Otter', weightKg: 5, colorEbc: 7 }]
    } as unknown as Recipe;

    monter([normalizeRecipe(ancienne)]);
    expect(screen.getByText('Stout d’avant')).toBeInTheDocument();
  });
});
