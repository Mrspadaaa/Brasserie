// @vitest-environment jsdom
/**
 * TE-12 / PD-8 : une recette en SafAle US-05 montrait « FG — », « ABV — » et « plage dans la conduite de levure » : l'inconnu honnête,
 * mais jamais dit. La levure documentée donne une plage d'atténuation sourcée : la fiche l'écrit (« 1,008–1,012 »), marquée « plage »,
 * et ne renvoie plus à la conduite de levure pour un chiffre qu'elle a. Sans projection possible, la raison se lit au toucher.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { defaultConfig } from '../../src/services/storage';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

export const recetteUs05 = (): Recipe => ({
  ...structuredClone(fullRecipe), name: 'Pale US-05', style: 'Pale Ale', styleRef: undefined, nolo: undefined, yeastDesign: undefined,
  yeastGuide: undefined, waterPlan: undefined, volumeL: 20, boilMin: 60, ogTarget: undefined, fgTarget: undefined, abvTarget: undefined,
  ibuTarget: undefined, colorEbc: undefined,
  fermentables: [{ name: 'Pale Ale', weightKg: 4.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 7 },
    { name: 'Crystal 150', weightKg: 0.4, kind: 'grain', use: 'empatage', potentialPpg: 34, colorEbc: 150 }] as Recipe['fermentables'],
  yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g', pitchTempC: 18 } as Recipe['yeast'],
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 18, days: 10 }],
  hops: [{ name: 'Galaxy', stage: 'boil', weightG: 20, alpha: 17.2, timeMin: 60 }]
});

const monter = (r: Recipe) => render(<RecipePage recipe={r} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
const pastille = (cle: 'plage-fg' | 'plage-abv') => (document.querySelector(`[data-booster="${cle}"]`)?.textContent ?? '').replace(/\s+/g, ' ');

describe('TE-12 / PD-8 : la plage de la levure s\'écrit', () => {
  it('FG et ABV de l\'US-05 : une plage à la virgule, marquée « plage »', () => {
    monter(recetteUs05());
    expect(pastille('plage-fg')).toMatch(/FG\s*1,0\d\d\s*–\s*1,0\d\d/);
    expect(pastille('plage-abv')).toMatch(/ABV\s*\d,\d\s*–\s*\d,\d\s*%/);
    expect(pastille('plage-fg')).toContain('plage');
    expect(pastille('plage-fg')).not.toMatch(/\d\.\d/);
  });

  it('ne renvoie plus à la conduite de levure pour des chiffres qu\'elle écrit', () => {
    monter(recetteUs05());
    const reperes = (document.querySelector('[aria-label="Repères de la recette"]')?.textContent ?? '');
    expect(reperes).not.toContain('plage dans la conduite de levure');
  });

  it('une cible retenue reste la valeur écrite, jamais remplacée par la plage', () => {
    const r = recetteUs05();
    r.fgTarget = 1.012; r.abvTarget = 5.2;
    monter(r);
    expect(pastille('plage-fg')).toContain('1,012');
    expect(pastille('plage-fg')).not.toContain('–');
    expect(pastille('plage-abv')).toContain('5,2 %');
  });
});
