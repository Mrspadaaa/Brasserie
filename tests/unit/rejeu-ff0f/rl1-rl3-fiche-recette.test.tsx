// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), fiche recette (neipa v3) : RL-1 décimales au point (« 3.5 EBC », « SRM 4.9 », « Gypse 3.2 g », « 5.3 mL », « 0.43 °C »),
// RL-2 « 15 % AA » au lieu de « 15 % α » (TE-23), RL-3 « de Acide lactique » au lieu de « d’acide lactique ».
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { RecipePage } from '../../../src/pages/RecipePage';
import { defaultConfig } from '../../../src/services/storage';
import { yeastFlowRecipe } from '../../fixtures/yeastRecipeFlow';
import { deNom } from '../../../src/domain/elision';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const fiche = () => {
  const recipe = yeastFlowRecipe();
  recipe.fermentables = [{ name: 'Pilsner Malz', weightKg: 4.2, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 3.5 }] as typeof recipe.fermentables;
  recipe.hops = [{ name: 'Lotus', weightG: 20, stage: 'boil', timeMin: 10, alpha: 15 }] as typeof recipe.hops;
  recipe.mash = { ...(recipe.mash ?? {}), steps: [{ name: 'Saccharification', tempC: 66.5, durationMin: 60 }], heatingRateCPerMin: 0.43, spargeTempC: 76 } as typeof recipe.mash;
  recipe.water = { sourceName: 'Réseau', diRatioPct: 0, targetPh: 5.4, salts: { gypseG: 3.2, cacl2G: 11.2, mgso4G: 0, acidLacticMl: 5.3 } } as unknown as typeof recipe.water;
  recipe.waterPlan = {
    sourceId: 'test', mashWaterL: 20, spargeWaterL: 10, targetPh: 5.4, diRatioPct: 0, startIons: { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 },
    mash: { gypse: 3.2, cacl2: 11.2 }, sparge: {}, acid: { id: 'lactique', mash: 5.3, sparge: 0 },
  } as unknown as typeof recipe.waterPlan;
  return recipe;
};
const texte = () => (document.body.textContent ?? '').replace(/\s+/g, ' ');

describe('RL-3 — l’élision', () => {
  it('« de » devant une voyelle ou un h muet devient « d’ »', () => {
    expect(deNom('Acide lactique 80 %')).toBe('d’Acide lactique 80 %'.replace('Acide', 'acide'));
    expect(deNom('Gypse')).toBe('de Gypse'.replace('Gypse', 'gypse'));
    expect(deNom('Houblon')).toBe('d’houblon');
    expect(deNom('Écorce')).toBe('d’écorce');
  });
});

describe('RL-1, RL-2, RL-3 — la fiche recette', () => {
  it('aucun nombre décimal au point, « α » et non « AA », « d’acide » et non « de Acide »', () => {
    render(<RecipePage recipe={fiche()} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
    const t = texte();
    expect(t).not.toMatch(/\d\.\d+ ?(EBC|g\b|mL|°C|kg|L\b)/);
    expect(t).not.toMatch(/SRM \d+\.\d/);
    expect(t).toContain('3,5 EBC');
    expect(t).toContain('15 % α');
    expect(t).not.toMatch(/\bAA\b/);
    expect(t).not.toContain('de Acide');
    expect(t).toMatch(/d’acide lactique/);
  });
});
