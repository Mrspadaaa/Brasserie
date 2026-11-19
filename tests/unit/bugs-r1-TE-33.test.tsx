// @vitest-environment jsdom
/**
 * TE-33 : « Amertume 0 IBU » pour un houblon sans dose. La liste (ibuListe) ne l'écrit plus ; la fiche écrivait encore « IBU 0 ».
 * L'inconnu n'est jamais 0 : sans ajout à chaud dosé, la fiche écrit « — » (ou l'IBU annoncé, comme la liste).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RecipePage } from '../../src/pages/RecipePage';
import { defaultConfig } from '../../src/services/storage';
import { ibuListe } from '../../src/domain/recipeMetrics';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const hefe = (): Recipe => ({
  ...structuredClone(fullRecipe), name: 'Hefe', style: 'Hefeweizen', styleRef: undefined, nolo: undefined, yeastDesign: undefined,
  yeastGuide: undefined, waterPlan: undefined, volumeL: 20, boilMin: 60, ogTarget: undefined, ibuTarget: undefined,
  fermentables: [{ name: 'Weizen', weightKg: 4.5, kind: 'grain', use: 'empatage', potentialPpg: 37, colorEbc: 7 }] as Recipe['fermentables'],
  hops: [{ name: 'Hallertau', stage: 'boil', weightG: 0, alpha: 4, timeMin: 60 }]
});
const monter = (r: Recipe) => render(<RecipePage recipe={r} batches={[]} config={defaultConfig} onClose={vi.fn()} onEdit={vi.fn()} onDuplicate={vi.fn()} onDelete={vi.fn()} onBrew={vi.fn()} onOpenBatch={vi.fn()} />);
const ibuFiche = () => screen.getByText('IBU').closest('div')?.querySelector('.reading')?.textContent ?? null;

describe('TE-33 : jamais 0 IBU pour un houblon sans dose', () => {
  it('la fiche ne montre pas « 0 » sans ajout à chaud dosé', () => {
    const r = hefe();
    expect(ibuListe(r, 75)).toBeUndefined();
    monter(r);
    expect(ibuFiche()).not.toBe('0');
  });

  it('avec un IBU annoncé, la fiche dit comme la liste', () => {
    const r = hefe(); r.ibuTarget = 14;
    monter(r);
    expect(ibuFiche()).toBe(String(ibuListe(r, 75)));
  });
});
