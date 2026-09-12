import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { practicalEquipment } from '../../src/domain/brewEquipment';
import { writeRecipeText } from '../../src/domain/recipeTransfer';
import type { Recipe } from '../../src/types';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const recipe: Recipe = {
  id: 'water-case', name: 'Maris Otter', style: '', volumeL: 24,
  ogTarget: 1.029, fgTarget: 1.004843, abvTarget: 3.2, ibuTarget: 11,
  totalGristKg: 3, boilMin: 115, preBoilL: 31.1, preBoilHotL: 32.4,
  brewhouse: { id: 'bh-30', name: 'Royal Catering · cuve 45 L', volumeL: 24,
    efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5, mashRatioLPerKg: 3.5,
    equipment: { ...practicalEquipment } },
  fermentables: [{ name: 'Malt Maris Otter', weightKg: 3, kind: 'grain', use: 'empatage',
    colorEbc: 5, potentialPpg: 37, fermentabilityPct: 100 }],
  hops: [{ name: 'Cascade', weightG: 14, alpha: 6.5, stage: 'boil', timeMin: 115 }],
  yeast: { name: 'Levure Safale BE-256 (Abbaye)', form: 'sèche', qty: 1, unit: 'sachet', attenuationPct: 84 },
  mash: { ratioLPerKg: 3.5, spargeType: 'batch', spargeTempC: 76,
    steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }] },
  waterPlan: { sourceId: 'reseau', targetPh: 5.4, diRatioPct: 45,
    targetProfileId: '05D', treatmentVersion: 2, allSaltsInMash: true,
    mashWaterL: 10.5, spargeWaterL: 23.5, mash: { gypse: 2.8, kcl: 1.2 }, sparge: {},
    acid: { id: 'lactique', mash: 2.4, sparge: 4.7 } },
  steps: [], notes: [],
};

const mashInput = () => screen.getByRole('textbox', { name: 'Volume d’eau d’empâtage, en litres' });
const spargeInput = () => screen.getByRole('textbox', { name: 'Volume d’eau de rinçage, en litres' });
function mount(seed?: Recipe) {
  const save = vi.fn();
  // The active installation differs from the recipe's saved calibration.
  const config = { ...defaultConfig, activeBrewhouseId: 'other', brewhouses: [{
    ...recipe.brewhouse!, id: 'other', name: 'Autre installation',
    equipment: { ...practicalEquipment, boilOffLPerHour: 1 },
  }] };
  render(<BrewWizard seed={seed ? { recipe: structuredClone(seed) } : undefined}
    config={config} stockItems={[]} knownStyles={[]} onSave={save} onClose={vi.fn()}
    onSaveWaterSource={vi.fn()} onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} />);
  return save;
}

describe('Comprendre et ajuster le partage d’eau sans changer de matériel en silence', () => {
  it('explique le cas signalé et ne change les volumes qu’après une action du brasseur', () => {
    const save = mount(recipe);
    allerEtape('Eau et sels');
    expect(mashInput()).toHaveValue('10,5');
    expect(spargeInput()).toHaveValue('23,5');
    const explanation = screen.getByText('Pourquoi plus d’eau au rinçage ?').closest('details')!;
    expect(explanation).not.toHaveAttribute('open');
    expect(explanation).toHaveTextContent('31,1 L de moût');
    expect(explanation).toHaveTextContent('34 L d’eau');
    expect(explanation).toHaveTextContent('115 min : 5,5 L évaporés');
    expect(screen.getByText(/17,4 \+ 6,1 L à froid/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider', { name: 'Épaisseur de maische' }), { target: { value: '6' } });
    expect(mashInput()).toHaveValue('18');
    expect(spargeInput()).toHaveValue('16');
    expect(screen.queryByText(/Rinçage : 2 chauffes/)).not.toBeInTheDocument();
    expect(screen.queryByText('Pourquoi plus d’eau au rinçage ?')).not.toBeInTheDocument();
    expect(screen.getByText('Comprendre les volumes')).toBeInTheDocument();
    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    expect(save).toHaveBeenCalledOnce();
    expect(save.mock.calls[0][0]).toMatchObject({ preBoilL: 31.1, preBoilHotL: 32.4,
      brewhouse: { id: 'bh-30', equipment: practicalEquipment },
      waterPlan: { mashWaterL: 18, spargeWaterL: 16 } });
  });

  it('préserve la calibration importée et permet une adaptation explicite au matériel actuel', () => {
    const save = mount();
    fireEvent.click(screen.getByText('Coller une recette trouvée', { exact: true }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: writeRecipeText(recipe) } });
    fireEvent.click(screen.getByRole('button', { name: 'Lire la recette', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre', exact: true }));
    allerEtape('Eau et sels');
    expect(screen.getByText('Pourquoi plus d’eau au rinçage ?').closest('details')).toHaveTextContent('115 min : 5,5 L évaporés');
    allerEtape('Identité');
    fireEvent.click(screen.getByRole('button', { name: 'Adapter à mon matériel actuel · Autre installation', exact: true }));
    allerEtape('Récapitulatif');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    expect(save.mock.calls[0][0]).toMatchObject({ brewhouse: { id: 'other', equipment: { boilOffLPerHour: 1 } } });
  });

  it('signale que le plein volume ne tient pas et restaure le rinçage sans perdre de litres', () => {
    mount(recipe);
    allerEtape('Eau et sels');
    fireEvent.click(screen.getByRole('switch', { name: /Eau de rinçage/ }));
    expect(mashInput()).toHaveValue('34');
    expect(screen.queryByRole('textbox', { name: 'Volume d’eau de rinçage, en litres' })).not.toBeInTheDocument();
    expect(screen.getByText(/Empâtage trop volumineux/)).toBeInTheDocument();
    expect(screen.queryByText(/Rinçage : 2 chauffes/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: /Eau de rinçage/ }));
    expect(mashInput()).toHaveValue('10,5');
    expect(spargeInput()).toHaveValue('23,5');
    expect(screen.queryByText(/Empâtage trop volumineux/)).not.toBeInTheDocument();
  });
});
