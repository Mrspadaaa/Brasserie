// Recette en ligne 15.11, constats moyens RL-1 à RL-4 (RL-5 : voir RESULTAT de la voie). Rouge sur e743d2de : chaque test décrit ce que la recette a vu en ligne.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { RecipePage } from '../../src/pages/RecipePage';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';
import type { Recipe } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); });

/** La levure choisie au catalogue : le nom porte déjà le fabricant et le code (RL-1, RL-3). */
const WYEAST = { name: 'Wyeast · 1056 American Ale®', lab: 'Wyeast', strain: '1056', form: 'liquide' as const, qty: 1, unit: 'sachet',
  notes: 'Référence fabricant : Wyeast 1056. Quantité et conduite à définir pour le moût.' };

const KEY = 'fixture-owner:REC-RL';
const recap = () => {
  render(<BrewWizard draftKey={KEY} seed={{ recipe: { ...yeastFlowRecipe(), id: 'REC-RL', style: '21A', yeastDesign: undefined, yeast: { ...WYEAST } } }}
    config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
    onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
  allerEtape(/^Récap/);
  const rangee = document.querySelector<HTMLElement>('[data-rangee="levure"]')!;
  rangee.querySelector('details')!.open = true;
  return rangee;
};
const occurrences = (texte: string, motif: string) => texte.split(motif).length - 1;

describe('Récap m2, rangée Levure dépliée', () => {
  it('RL-1 : le nom de la souche n’est dit qu’une fois (résumé de la rangée), pas trois', () => {
    const rangee = recap();
    expect(occurrences(rangee.textContent ?? '', 'American Ale')).toBe(1);
  });

  it('RL-2 : la quantité se règle une seule fois (le curseur de la maquette), et l’unité d’une levure liquide n’est pas le gramme', () => {
    const rangee = recap();
    expect(within(rangee).queryByLabelText('Quantité de levure')).toBeNull();
    expect(within(rangee).getByLabelText('Curseur de quantité de levure')).toBeInTheDocument();
    const unite = within(rangee).getByRole('radiogroup', { name: 'Unité de la levure' });
    expect(within(unite).getAllByRole('radio').map(r => r.textContent)).toEqual(['sachet', 'mL']);
    expect(within(unite).getByRole('radio', { name: 'sachet' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(within(unite).getByRole('radio', { name: 'mL' }));
    expect(within(unite).getByRole('radio', { name: 'mL' })).toHaveAttribute('aria-checked', 'true');
  });
});

const page = (extra: Partial<Recipe> = {}) => {
  const recipe = { ...yeastFlowRecipe(), yeastDesign: undefined, yeast: { ...WYEAST }, ...extra } as Recipe;
  const actions = { onClose: vi.fn(), onEdit: vi.fn(), onDuplicate: vi.fn(), onDelete: vi.fn(), onBrew: vi.fn(), onOpenBatch: vi.fn() };
  return render(<RecipePage recipe={recipe} batches={[]} config={defaultConfig} {...actions} />);
};

describe('Page de la recette r1', () => {
  it('RL-3 : le bloc Levure ne double ni le fabricant ni le code, dit le primaire réglé, et n’affiche plus « à définir » une fois tout saisi', () => {
    const { container } = page({ fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 19, days: 10 }] } as Partial<Recipe>);
    const levure = container.querySelector('[data-element="r1-levure"]') as HTMLElement;
    const texte = levure.textContent ?? '';
    expect(texte).not.toContain('Wyeast Wyeast');
    expect(texte).not.toMatch(/· 1056 American Ale® · 1056/);
    expect(texte).not.toContain('Ensemencement–');
    expect(texte).not.toContain('Ensemencement —');
    expect(texte).toMatch(/Primaire\s*19(,0)? °C/);
    expect(texte).not.toContain('Quantité et conduite à définir');
  });

  it('RL-4 : la densité en début d’ébullition est sous l’OG quand le volume avant ébullition est connu, absente sinon (jamais l’OG)', () => {
    const equipement = { boilOffLPerHour: 5.7, coolingShrinkagePct: 4 };
    const GRAIN = [{ ...yeastFlowRecipe().fermentables[0], weightKg: 4.32, potentialPpg: 37, kind: 'grain' }] as Recipe['fermentables']; // ≈ 1,050 pour 20 L à 75 %
    const { container } = page({ fermentables: GRAIN, efficiencyPct: 75, preBoilL: 31.7, preBoilHotL: 33, boilMin: 60, brewhouse: { ...defaultConfig.brewhouses[0], equipment: equipement } } as unknown as Partial<Recipe>);
    const note = (container.querySelector('[data-element="r1-ebullition"]') as HTMLElement).textContent ?? '';
    const m = /densité en début d’ébullition (\d[.,]\d{3})/.exec(note);
    expect(m, note).not.toBeNull();
    const debut = Number(m![1].replace(',', '.'));
    cleanup();
    const { container: sans } = page({ preBoilL: undefined, preBoilHotL: undefined, brewhouse: { ...defaultConfig.brewhouses[0], equipment: undefined } } as unknown as Partial<Recipe>);
    expect((sans.querySelector('[data-element="r1-ebullition"]') as HTMLElement).textContent).not.toContain('début d’ébullition');
    expect(debut).toBeGreaterThan(1);
    expect(debut).toBeLessThan(1.05); // l'OG de la fixture est 1,050 : le moût était plus dilué avant l'ébullition
  });
});
