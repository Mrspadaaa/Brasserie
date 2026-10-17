// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { StorageService, defaultConfig } from '../../src/services/storage';
import * as hopV55Runtime from '../../src/services/hopV55/runtime';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('BrewWizard face à un brouillon V5.5 futur et opaque', () => {
  it('conserve les octets, reste en lecture seule pendant la navigation et ne lance aucun runtime V5.5', () => {
    const draftKey = 'qa-owner:future-recipe-envelope';
    const storageKey = 'laffinee_recipe_draft_v1:' + draftKey;
    const rawEnvelope = JSON.stringify({
      version: 2,
      format: 'recipe-wizard-draft-v2',
      draft: {
        recipe: { id: 'future-recipe-id', name: 'Contenu futur à conserver', volumeL: { unknown: true } },
        nestedFutureField: { bytes: ['opaque', null, 17] },
      },
      futureHeaderField: { retained: true },
    });
    localStorage.setItem(storageKey, rawEnvelope);

    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const removeItem = vi.spyOn(Storage.prototype, 'removeItem');
    const onSave = vi.fn();
    const onClose = vi.fn();
    const createServices = vi.spyOn(hopV55Runtime, 'createHopV55Services');
    vi.spyOn(StorageService, 'getHopKnowledge').mockReturnValue([] as never);
    vi.spyOn(StorageService, 'getHopVarieties').mockReturnValue([] as never);
    vi.spyOn(StorageService, 'getHopLots').mockReturnValue([] as never);
    vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [] } as never);

    const seed = structuredClone(fullRecipe) as Recipe;
    seed.name = 'Graine future doit rester ignorée';
    render(<BrewWizard
      seed={{ recipe: seed }}
      draftKey={draftKey}
      localOnly
      stockItems={[]}
      config={defaultConfig}
      knownStyles={[]}
      onClose={onClose}
      onCreateStockItem={vi.fn()}
      onLearnIngredient={vi.fn()}
      onSaveWaterSource={vi.fn()}
      onSave={onSave}
    />);

    expect(screen.getByRole('alert', { name: 'Brouillon conservé en lecture seule' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Nom de la bière' })).not.toBeInTheDocument();
    expect.soft(screen.queryByText(/Graine future doit rester ignorée/u)).not.toBeInTheDocument();
    expect(localStorage.getItem(storageKey)).toBe(rawEnvelope);

    fireEvent.click(screen.getByText('Lire le contenu conservé', { exact: true }));
    expect(screen.getByText(rawEnvelope, { exact: true })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Houblons' })[0]);
    expect(screen.getByRole('alert', { name: 'Brouillon conservé en lecture seule' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: 'Nom de la bière' })).not.toBeInTheDocument();
    expect(createServices).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe(rawEnvelope);

    fireEvent.click(screen.getAllByRole('button', { name: 'Récapitulatif' })[0]);
    const save = screen.getByRole('button', { name: 'Enregistrer la recette' });
    const saveAndBrew = screen.getByRole('button', { name: 'Enregistrer et préparer un brassin' });
    expect.soft(save).toBeDisabled();
    expect.soft(saveAndBrew).toBeDisabled();
    fireEvent.click(save);
    fireEvent.click(saveAndBrew);
    expect(onSave).not.toHaveBeenCalled();

    act(() => { window.dispatchEvent(new Event('pagehide')); });
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
    expect(localStorage.getItem(storageKey)).toBe(rawEnvelope);

    fireEvent.click(screen.getByRole('button', { name: 'Revenir aux recettes' }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(localStorage.getItem(storageKey)).toBe(rawEnvelope);
    expect(setItem).not.toHaveBeenCalled();
    expect(removeItem).not.toHaveBeenCalled();
  });
});