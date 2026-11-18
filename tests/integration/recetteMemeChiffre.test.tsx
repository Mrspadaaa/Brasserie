import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { defaultConfig } from '../../src/services/storage';
import { recipeEntries } from '../../src/domain/productionCatalog';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

/**
 * Test en ligne du 07.11, n° 1 à 3 et 8 : la fiche et la liste disent le même IBU, la fiche écrit ses densités à la virgule.
 * Les cibles retenues (1,085 / 1,024) diffèrent volontairement de ce que le calcul donne : c'est le cas vu en ligne.
 */
const fiche = () => {
  const recipe = yeastFlowRecipe();
  recipe.ogTarget = 1.085; recipe.fgTarget = 1.024; recipe.ibuTarget = 65; recipe.abvTarget = 8.2;
  return recipe;
};
const reperes = () => (screen.getByLabelText('Repères de la recette').textContent ?? '').replace(/\s+/g, ' ');

describe('La fiche écrit comme la liste', () => {
  it('OG et FG à la virgule, ABV à la virgule', () => {
    render(<RecipePage recipe={fiche()} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
    const texte = reperes();
    expect(texte).toContain('1,085');
    expect(texte).toContain('1,024');
    expect(texte).toContain('8,2 %');
    expect(texte).not.toMatch(/1\.0\d\d/);
    expect(texte).not.toMatch(/\d\.\d %/);
  });

  it('l\'IBU de la liste est celui que la fiche écrit sous « IBU »', () => {
    const recipe = fiche();
    recipe.boilMin = 60; recipe.ibuTarget = 80;
    recipe.fermentables = [{ name: 'Maris Otter', weightKg: 8.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 }] as typeof recipe.fermentables;
    recipe.hops = [{ name: 'Nugget', weightG: 60, stage: 'boil', timeMin: 60, alpha: 13 }];
    render(<RecipePage recipe={recipe} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
    const ibuListe = recipeEntries([recipe], [])[0].ibu;
    expect(ibuListe).toBeDefined();
    // La valeur est suivie de sa note (« 80 annoncé ») sans séparateur dans le texte brut : on lit la valeur seule.
    const ibuFiche = screen.getByText('IBU').closest('div')?.querySelector('.reading')?.textContent;
    expect(ibuFiche).toBe(String(ibuListe));
    expect(ibuListe).not.toBe(80);
    expect(reperes()).toContain('80 annoncé');
  });
});
