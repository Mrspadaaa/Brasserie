// @vitest-environment jsdom
// Rejeu en ligne 649bcc54 (08.11), RL-1 rouvert : fiche recette (neipa v3), les volumes d'eau restaient au point
// (« 25.8 L », « 12.9 L réseau · 12.9 L osmosée », « 5.7 L »).
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { RecipePage } from '../../../src/pages/RecipePage';
import { defaultConfig } from '../../../src/services/storage';
import { yeastFlowRecipe } from '../../fixtures/yeastRecipeFlow';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const fiche = () => {
  const recipe = yeastFlowRecipe();
  recipe.waterPlan = {
    sourceId: 'test', mashWaterL: 25.8, spargeWaterL: 5.7, targetPh: 5.4, diRatioPct: 50, spargeDiRatioPct: 50,
    startIons: { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 },
    mash: { gypse: 3.2, cacl2: 11.2 }, sparge: {}, acid: { id: 'lactique', mash: 5.3, sparge: 0 },
  } as unknown as typeof recipe.waterPlan;
  return recipe;
};

describe('RL-1 rouvert — volumes d’eau de la fiche recette à la virgule', () => {
  it('aucun volume en litres au point, les valeurs sont à la virgule', () => {
    render(<RecipePage recipe={fiche()} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
    const t = (document.body.textContent ?? '').replace(/\s+/g, ' ');
    expect(t).not.toMatch(/\d\.\d+ ?(L\b|%)/);
    expect(t).toContain('25,8 L');
    expect(t).toContain('12,9 L réseau · 12,9 L osmosée');
    expect(t).toContain('5,7 L');
  });
});
