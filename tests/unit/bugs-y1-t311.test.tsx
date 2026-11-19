// @vitest-environment jsdom
// Voie y1, T3-11 (en ligne, 19.11) : une recette NEUVE, enregistrée par l'assistant, doit naître sur le matériel ACTUEL (celui de la brasserie
// active), figé dans `brewhouse.equipment` : sinon « Planifier » la refuse (« matériel pas figé », T2B-1).
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { recipeInstallationAdoptionIssue } from '../../src/domain/recipeInstallation';
import type { BrewhouseProfile, Recipe } from '../../src/types';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); vi.clearAllMocks(); });

/** La brasserie active du brasseur : Royal Catering, cuve 45 L, matériel renseigné (Réglages › Brasserie). */
const royal: BrewhouseProfile = { id: 'bh-30', name: 'Royal Catering · cuve 45 L', volumeL: 24, efficiencyPct: 75, boilOffRatePct: 10, deadSpaceL: 1.5,
  mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment, kettleCapacityL: 45 }, preferences: { ...practicalBrewingPreferences } };

describe('T3-11 : une recette neuve naît sur le matériel actuel', () => {
  it('enregistrée sans retouche, elle porte le matériel de la brasserie active et peut être planifiée', () => {
    const save = vi.fn();
    render(<BrewWizard localOnly config={{ ...defaultConfig, brewhouses: [royal], activeBrewhouseId: royal.id }} stockItems={[]} knownStyles={['Pale Ale']}
      onClose={vi.fn()} onSave={save} onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nom de la bière'), { target: { value: 'ZZ TEST — neuve' } });
    allerEtape(/^Récapitulatif$/);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la recette', exact: true }));
    expect(save).toHaveBeenCalledTimes(1);
    const saved = save.mock.calls[0][0] as Recipe;
    expect(saved.brewhouse?.name, 'la recette est née sur la brasserie active').toBe('Royal Catering · cuve 45 L');
    expect(saved.brewhouse?.equipment?.kettleCapacityL).toBe(45);
    expect(recipeInstallationAdoptionIssue(saved, royal), 'aucun « matériel pas figé »').toBeUndefined();
  });
});
