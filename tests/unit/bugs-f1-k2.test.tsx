// @vitest-environment jsdom
/**
 * Voie f1, tour 2 (critique k2, 20.11) : les redites et le format de la fiche « Milk Stout ».
 *  - 12 : « Ébullition 60′ » suivi de « Ébullition de 60 min. » ; titre « Fermentation » suivi du sous-titre « Fermentation » ;
 *    pastilles « Primaire » et « Garde » qui répètent le mot juste à côté.
 *  - 13 : la densité du brassin s'écrit « 1.062 » (point) quand le bandeau dit « 1,062 ».
 *  - 14 : le Déroulé finit par « FIN DE RECETTE » après une ligne vide (reste de l'import).
 *  - lactose : passé en « Additifs », il reste compté dans l'OG (sucre non fermentescible : OG oui, atténuation non).
 * Rouge avant : chaque test échoue sur la fiche du tour 1.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { instructionsAffichees } from '../../src/domain/recipeInstructions';
import { projectYeastRecipe, yeastRecipeComputedOg } from '../../src/domain/yeastProjection';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, Fermentable, Recipe } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const milkStout = (extra: Partial<Recipe> = {}): Recipe => {
  const r = yeastFlowRecipe();
  delete (r as { boilMin?: number }).boilMin;
  return { ...r, id: 'rec-ms', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30, ogTarget: 1.062, batchRef: 'LOT-001', adjuncts: [],
    instructions: 'Préparer l’eau.\n\nPuis concasser : 1 mm.\n\nFIN DE RECETTE',
    fermentables: [{ name: 'Maris Otter', weightKg: 5.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 5 }],
    hops: [{ name: 'Target', weightG: 35, alpha: 11.3, stage: 'boil', timeMin: 60 }],
    ...extra } as unknown as Recipe;
};
const lot = { id: 'LOT-001', name: 'Milk Stout', style: 'Milk Stout', volumeL: 30, status: 'termine', brewDate: '01.05.2026', og: '1.062' } as Batch;
const monter = (recipe: Recipe, batches: Batch[] = []) => {
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as never);
  const actions = { onClose: vi.fn(), onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onBrew: vi.fn(), onOpenBatch: vi.fn() };
  return render(<RecipePage recipe={recipe} batches={batches} config={defaultConfig} {...actions} />);
};
const section = (c: HTMLElement, element: string) => c.querySelector(`[data-element="${element}"]`) as HTMLElement;

describe('12 : la fiche ne se répète pas', () => {
  it('Ébullition : sans densité de début d’ébullition, pas de phrase qui redit « Ébullition de 60 min »', () => {
    const { container } = monter(milkStout());
    const eb = section(container, 'r1-ebullition');
    expect(eb.textContent).toMatch(/60′/);
    expect(eb.textContent).not.toMatch(/Ébullition de 60 min/);
  });
  it('Fermentation : le titre n’est pas répété en sous-titre', () => {
    const { container } = monter(milkStout());
    const ferm = section(container, 'r1-fermentation');
    const titres = [...ferm.querySelectorAll('h3')].map(h => h.textContent?.trim());
    expect(titres).not.toContain('Fermentation');
  });
  it('Fermentation : une pastille qui répète le nom de la phase (« Primaire », « Garde ») n’est pas écrite', () => {
    const { container } = monter(milkStout());
    const ferm = section(container, 'r1-fermentation');
    const pastilles = [...ferm.querySelectorAll('li span.rounded-full')].map(p => p.textContent?.trim());
    expect(pastilles).toEqual([]);
  });
  it('Fermentation : la pastille reste quand le nom de la phase ne dit pas son type', () => {
    const fermentation = [{ name: 'Fermentation principale', kind: 'primaire', tempC: 18, days: 10 }, { name: 'Maturation au froid', kind: 'garde', tempC: 4, days: 7 }] as Recipe['fermentation'];
    const { container } = monter(milkStout({ fermentation }));
    const pastilles = [...section(container, 'r1-fermentation').querySelectorAll('li span.rounded-full')].map(p => p.textContent?.trim());
    expect(pastilles).toEqual(['Primaire', 'Garde']);
  });
});

describe('13 : la densité du brassin s’écrit à la française', () => {
  it('« 1,062 » dans la liste des brassins, jamais « 1.062 »', () => {
    const { container } = monter(milkStout(), [lot]);
    const brassins = section(container, 'r1-brassins');
    expect(brassins.textContent).toMatch(/1,062/);
    expect(brassins.textContent).not.toMatch(/1\.062/);
  });
  it('une valeur déjà à virgule ou illisible reste telle quelle (jamais un 0)', () => {
    const { container } = monter(milkStout(), [{ ...lot, og: '1,048' } as Batch]);
    expect(section(container, 'r1-brassins').textContent).toMatch(/1,048/);
    cleanup();
    const { container: autre } = monter(milkStout(), [{ ...lot, og: 'à mesurer' } as Batch]);
    expect(section(autre, 'r1-brassins').textContent).toMatch(/à mesurer/);
  });
});

describe('14 : le Déroulé finit sur la dernière étape', () => {
  it('instructionsAffichees retire « FIN DE RECETTE » et les lignes vides de la fin, garde le reste', () => {
    expect(instructionsAffichees('Préparer l’eau.\n\nPuis concasser : 1 mm.\n\nFIN DE RECETTE')).toBe('Préparer l’eau.\n\nPuis concasser : 1 mm.');
    expect(instructionsAffichees('A\nfin de recette  \n\n')).toBe('A');
    expect(instructionsAffichees('Étape 1.\n\nÉtape 2.')).toBe('Étape 1.\n\nÉtape 2.');
    expect(instructionsAffichees('FIN DE RECETTE')).toBe('');
    expect(instructionsAffichees(undefined)).toBe('');
  });
  it('la fiche n’écrit pas « FIN DE RECETTE »', () => {
    const { container } = monter(milkStout());
    expect(container.textContent).toMatch(/Puis concasser/);
    expect(container.textContent).not.toMatch(/FIN DE RECETTE/i);
  });
  it('un Déroulé qui ne contenait que le marqueur n’ouvre pas de section vide', () => {
    const { container } = monter(milkStout({ instructions: 'FIN DE RECETTE' }));
    expect(container.querySelector('details[data-recipe-section="Déroulé"]')).toBeNull();
  });
});

describe('Lactose : rangé en Additifs, il compte dans l’OG et pas dans l’atténuation', () => {
  const malt: Fermentable = { name: 'Maris Otter', weightKg: 5.5, kind: 'grain', use: 'empatage', potentialPpg: 37 } as Fermentable;
  const lactose: Fermentable = { name: 'Lactose', weightKg: 0.3, kind: 'lactose', use: 'ebullition', potentialPpg: 41, fermentabilityPct: 0 } as Fermentable;
  it('l’OG calculée monte du lactose (≈ 3 points pour 300 g dans 30 L)', () => {
    const sans = yeastRecipeComputedOg({ fermentables: [malt], volumeL: 30, efficiencyPct: 75 })!;
    const avec = yeastRecipeComputedOg({ fermentables: [malt, lactose], volumeL: 30, efficiencyPct: 75 })!;
    expect((avec - sans) * 1000).toBeGreaterThan(2.5);
    expect((avec - sans) * 1000).toBeLessThan(3.5);
  });
  it('la projection garde ces points dans l’extrait non fermentescible : la FG monte du lactose, l’atténuation ne le consomme pas', () => {
    const base = milkStout({ ogTarget: undefined, fgTarget: undefined, abvTarget: undefined, fermentables: [malt], efficiencyPct: 75 } as Partial<Recipe>);
    const avecLactose = { ...base, fermentables: [malt, lactose] } as Recipe;
    const att = { attenuationPct: 75, attenuationBasis: 'recipe' as const };
    const p0 = projectYeastRecipe(base, { og: yeastRecipeComputedOg({ fermentables: [malt], volumeL: 30, efficiencyPct: 75 }), ...att });
    const p1 = projectYeastRecipe(avecLactose, { og: yeastRecipeComputedOg({ fermentables: [malt, lactose], volumeL: 30, efficiencyPct: 75 }), ...att });
    // La FG : le lactose reste dans le verre (0 % fermentescible), l'atténuation ne s'applique qu'au reste.
    expect(p1.fg.range!.min).toBeGreaterThan(p0.fg.range!.min + 0.0025);
    expect(p1.extract?.unfermentablePoints ?? 0).toBeGreaterThan((p0.extract?.unfermentablePoints ?? 0) + 2.5);
    expect(p1.extract?.totalPoints ?? 0).toBeGreaterThan((p0.extract?.totalPoints ?? 0) + 2.5);
  });
  it('la fiche, lactose rangé parmi les houblons de la donnée abîmée : l’OG retenue (1,062) ne bouge pas, le lactose est dans Additifs', () => {
    const abime = milkStout({ hops: [{ name: 'Target', weightG: 35, alpha: 11.3, stage: 'boil', timeMin: 60 }, { name: 'Lactose', weightG: 300, stage: 'boil', timeMin: 15 }] as Recipe['hops'] });
    const { container } = monter(abime);
    expect(section(container, 'r1-bandeau').textContent).toMatch(/OG\s*1,062/);
    expect(section(container, 'r1-ebullition').textContent).toMatch(/Lactose[\s\S]*300 g/);
  });
});
