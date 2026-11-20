// @vitest-environment jsdom
// CT4-B-3 (le Récap valide un sous-ensemencement sans le dire) et CT4-B-7 (texte technique de la conduite de levure au premier plan).
import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const wizard = (yeast: Record<string, unknown>) => {
  const base = yeastFlowRecipe();
  const sec = { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', pitching: undefined };
  return render(<BrewWizard draftKey="fixture-owner:REC-CT4A" seed={{ recipe: { ...base, id: 'REC-CT4A', yeast: { ...base.yeast, ...sec, ...yeast } } }}
    config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()} onSave={vi.fn()} onCreateStockItem={vi.fn()}
    onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
};
const rangeeLevure = () => screen.getByRole('list', { name: 'Étapes de la recette' }).querySelector<HTMLElement>('[data-rangee="levure"]')!;

afterEach(() => { cleanup(); localStorage.clear(); });

describe('CT4-B-3 : la rangée Levure du Récap dit la part du besoin couverte', () => {
  it('1 sachet pour un besoin de 2 : « N % du besoin » à côté de la quantité', () => {
    wizard({ qty: 1, unit: 'sachet' });
    allerEtape(/^Récap/);
    const t = rangeeLevure().querySelector('summary')!.textContent ?? '';
    expect(t).toMatch(/1 sachet/);
    expect(t).toMatch(/\d+ % du besoin/);
    expect(Number(/(\d+) % du besoin/.exec(t)![1])).toBeLessThan(100);
  });
  it('une dose qui couvre le besoin ne porte aucune mention', () => {
    wizard({ qty: 5, unit: 'sachet' });
    allerEtape(/^Récap/);
    expect(rangeeLevure().querySelector('summary')!.textContent ?? '').not.toMatch(/du besoin/);
  });
});

describe('CT4-B-7 : la conduite de levure parle en mots de brasseur', () => {
  const plan = readFileSync('src/ui/YeastRecipePlan.tsx', 'utf8');
  it('plus de « Vide = inconnu, distinct de 0 j. » au premier plan', () => {
    expect(plan).not.toContain('Vide = inconnu, distinct de 0 j.');
  });
  it('« Pas une fin de fermentation attestée » et le décalage des jours sont repliés dans un <details>', () => {
    for (const phrase of ['Pas une fin de fermentation attestée', 'data-following-shift']) {
      const i = plan.indexOf(phrase);
      expect(i, phrase).toBeGreaterThan(-1);
      const avant = plan.slice(Math.max(0, i - 700), i);
      expect(avant.lastIndexOf('<details'), phrase).toBeGreaterThan(avant.lastIndexOf('</details>'));
    }
  });
  it('l’alerte « Quantité de levure sèche à renseigner » ne double pas la carte de dose', () => {
    expect(plan).toMatch(/startsWith\('Quantité de levure sèche à renseigner'\)/);
  });
});
