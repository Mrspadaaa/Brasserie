// @vitest-environment jsdom
/**
 * BR-5 (08.11), lecture étroite (b) : la température de saccharification ne change ni FG ni alcool (yeastProjection intact),
 * mais l'étape Paliers dit, d'un mot, que 63 °C ou 69 °C écartent la FG du repère de 66,5 °C (BrewingMath.attenuationForMashTemp).
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { avisSaccharification } from '../../src/ui/paliers/modele';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); localStorage.clear(); });

const pas = (tempC: number, durationMin = 60, name = 'Saccharification') => ({ name, tempC, durationMin });

describe('avisSaccharification : l’écart de FG annoncé', () => {
  it('63 °C : FG plus basse, en points de densité (OG 1,075 → environ 4 points)', () => {
    const a = avisSaccharification([pas(63)], 1.075);
    expect(a?.texte).toBe('63 °C : FG plus basse d’environ 4 points (repère : 66,5 °C).');
  });
  it('69 °C : FG plus haute, corps plus rond', () => {
    expect(avisSaccharification([pas(69)], 1.05)?.texte).toBe('69 °C : FG plus haute d’environ 2 points (repère : 66,5 °C).');
  });
  it('au repère, ou presque : aucun avis', () => {
    expect(avisSaccharification([pas(66.5)], 1.075)).toBeNull();
    expect(avisSaccharification([pas(66)], 1.05)).toBeNull();
  });
  it('sans OG connue : dit le sens, jamais un chiffre inventé', () => {
    expect(avisSaccharification([pas(63)], null)?.texte).toBe('63 °C : FG plus basse que vers 66,5 °C (atténuation environ 5 points plus haute).');
  });
  it('prend le palier de saccharification le plus long, pas le repos protéique ni le mash-out', () => {
    const a = avisSaccharification([pas(52, 15, 'Repos protéique'), pas(63, 75), pas(76, 10, 'Mash-out')], 1.05);
    expect(a?.texte).toMatch(/^63 °C : FG plus basse/);
  });
  it('sans palier de saccharification (62–72 °C) : rien', () => {
    expect(avisSaccharification([pas(52, 15, 'Repos protéique')], 1.05)).toBeNull();
    expect(avisSaccharification([], 1.05)).toBeNull();
  });
});

describe('BR-5 : l’étape Paliers montre l’avis, et le tait au repère', () => {
  const ouvrir = (tempC: number) => {
    const recipe = { ...yeastFlowRecipe(), id: 'REC-X1', mash: { steps: [pas(tempC)] } };
    render(<BrewWizard draftKey="fixture-owner:REC-X1" seed={{ recipe }} config={defaultConfig} stockItems={[]} knownStyles={[]} onClose={vi.fn()}
      onSave={vi.fn()} onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    allerEtape(/^Paliers$/);
  };
  it('63 °C : un avis court sous la courbe', () => {
    ouvrir(63);
    expect(screen.getByRole('note', { name: 'Effet de l’empâtage sur la FG' })).toHaveTextContent(/63 °C : FG plus basse d’environ \d points/);
  });
  it('66,5 °C : pas d’avis', () => {
    ouvrir(66.5);
    expect(screen.queryByRole('note', { name: 'Effet de l’empâtage sur la FG' })).toBeNull();
  });
});
