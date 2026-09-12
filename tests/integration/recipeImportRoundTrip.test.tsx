import React from 'react';
import { allerEtape } from '../helpers/wizard';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecipeImportSheet } from '../../src/ui/RecipeImportSheet';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { writeRecipeText, readRecipeText } from '../../src/domain/recipeTransfer';
import { fullRecipe } from '../fixtures/fullRecipe';
import { WaterRadar } from '../../src/ui/WaterRadar';
import { styleFromTargetIons } from '../../src/domain/waterStyles';
const ai = vi.fn();
vi.mock('../../src/services/aiClient', () => ({
  AiClient: { run: (...args: any[]) => ai(...args) }
}));
afterEach(() => {
  cleanup();
  ai.mockReset();
  vi.restoreAllMocks();
});
const click = (name: RegExp) => fireEvent.click(screen.getAllByRole('button', { name })[0]);
const paste = (text: string) => {
  fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), {
    target: { value: text }
  });
  click(/^Lire la recette$/);
};

describe('Recipe import through the real UI', () => {
  it('does not erase existing ingredients when a free-text reader recognizes none', async () => {
    ai.mockResolvedValue({
      ok: true,
      data: {
        instructions: 'Nouvelle consigne.',
        fermentables: [],
        hops: [],
        mashSteps: [],
        fermentation: []
      }
    });
    const save = vi.fn();
    render(
      <BrewWizard
        seed={{ recipe: fullRecipe }}
        config={defaultConfig}
        stockItems={[]}
        knownStyles={[]}
        onSave={save}
        onClose={vi.fn()}
        onSaveWaterSource={vi.fn()}
        onCreateStockItem={vi.fn()}
      />
    );
    click(/Coller une recette/);
    paste('Ajouter cette nouvelle consigne au déroulé de la recette.');
    await screen.findByRole('button', { name: 'Reprendre' });
    click(/^Reprendre$/);
    allerEtape(/^Récapitulatif$/);
    click(/^Enregistrer la recette$/);
    expect(save.mock.calls[0][0].fermentables).toEqual(fullRecipe.fermentables);
    expect(save.mock.calls[0][0].hops).toEqual(fullRecipe.hops);
    expect(save.mock.calls[0][0].mash.steps).toEqual(fullRecipe.mash.steps);
    expect(save.mock.calls[0][0].instructions).toBe('Nouvelle consigne.');
  });
  it('keeps a standard salt allocation dynamic when water volumes change after reopening', () => {
    const save = vi.fn();
    const recipe = {
      ...fullRecipe,
      waterPlan: {
        ...fullRecipe.waterPlan,
        mashWaterL: 30,
        spargeWaterL: 10,
        mash: { gypse: 3 },
        sparge: { gypse: 1 }
      }
    };
    render(
      <BrewWizard
        seed={{ recipe }}
        config={defaultConfig}
        stockItems={[]}
        knownStyles={[]}
        onSave={save}
        onClose={vi.fn()}
        onSaveWaterSource={vi.fn()}
        onCreateStockItem={vi.fn()}
      />
    );
    allerEtape(/^Récapitulatif$/);
    fireEvent.change(screen.getByLabelText('Eau d’empâtage'), { target: { value: '10' } });
    fireEvent.blur(screen.getByLabelText('Eau d’empâtage'));
    click(/^Enregistrer la recette$/);
    expect(save.mock.calls[0][0].waterPlan).toMatchObject({
      mash: { gypse: 2 },
      sparge: { gypse: 2 }
    });
  });
  it('draws target sectors only for ions explicitly supplied in a partial target', () => {
    const ions = { ca: 80, mg: 5, na: 0, so4: 75, cl: 150, hco3: 0 };
    const { container } = render(
      <WaterRadar
        start={ions}
        achieved={ions}
        style={styleFromTargetIons({ so4: 75, cl: 150, hco3: 0 })}
      />
    );
    expect(container.querySelectorAll('[data-ion-target]')).toHaveLength(3);
    expect(container.querySelector('[data-ion-target="ca"]')).toBeNull();
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('sans cible renseignée');
  });
  it('previews salts, acids and adjuncts locally and applies complete contents', () => {
    const apply = vi.fn();
    render(<RecipeImportSheet open onApply={apply} onClose={vi.fn()} />);
    paste(writeRecipeText(fullRecipe));
    expect(ai).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Traitement d’eau importé')).toHaveTextContent('0.325');
    expect(screen.getByLabelText('Autres ajouts importés')).toHaveTextContent('Whirlfloc');
    click(/^Reprendre$/);
    expect(apply.mock.calls[0][0].waterPlan).toEqual(fullRecipe.waterPlan);
  });
  it('blocks damaged own text instead of paying AI to invent missing data', () => {
    render(<RecipeImportSheet open onApply={vi.fn()} onClose={vi.fn()} />);
    paste(writeRecipeText(fullRecipe).replace('FIN DE RECETTE\n', '').slice(0, -30));
    expect(screen.getByText(/Fin de recette manquante/)).toBeInTheDocument();
    expect(ai).not.toHaveBeenCalled();
  });
  it('handles a rejected AI request with the local reader and frees the button', async () => {
    ai.mockRejectedValue(new Error('offline'));
    render(<RecipeImportSheet open onApply={vi.fn()} onClose={vi.fn()} />);
    paste('Milk Stout\n20 L\n4 kg Pale malt\n250 g lactose');
    await screen.findByRole('button', { name: 'Reprendre' });
    click(/^Recommencer$/);
    expect(screen.getByRole('button', { name: 'Lire la recette' })).not.toBeDisabled();
  });
  it('imports, saves, reopens and copies every business field, including exact per-water doses', async () => {
    const save = vi.fn();
    const show = (recipe = undefined) =>
      render(
        <BrewWizard
          seed={recipe ? { recipe } : undefined}
          config={defaultConfig}
          stockItems={[]}
          knownStyles={[]}
          onSave={save}
          onClose={vi.fn()}
          onSaveWaterSource={vi.fn()}
          onCreateStockItem={vi.fn()}
        />
      );
    show();
    click(/Coller une recette/);
    paste(writeRecipeText(fullRecipe));
    click(/^Reprendre$/);
    allerEtape(/^Récapitulatif$/);
    click(/^Enregistrer la recette$/);
    const saved = save.mock.calls[0][0];
    const { id, favorite, batchRef, ...imported } = fullRecipe;
    // A zero remains meaningful in override metadata, but is not an addition to weigh.
    // Every nonzero dose must survive with its original mass and water allocation.
    const expected = {
      ...imported,
      waterPlan: {
        ...imported.waterPlan,
        mash: Object.fromEntries(Object.entries(imported.waterPlan.mash).filter(([, grams]) => grams !== 0)),
        sparge: Object.fromEntries(Object.entries(imported.waterPlan.sparge).filter(([, grams]) => grams !== 0))
      }
    };
    expect(saved).toMatchObject(expected);
    for (const side of ['mash', 'sparge'] as const) {
      expect(saved.waterPlan[side]).toEqual(expected.waterPlan[side]);
      expect(Object.values(saved.waterPlan[side])).not.toContain(0);
    }
    expect(saved.id).not.toBe(id);
    expect(saved.batchRef).toBeUndefined();
    cleanup();
    show(JSON.parse(JSON.stringify(saved)));
    allerEtape(/^Récapitulatif$/);
    const clipboard = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: clipboard }
    });
    click(/^Copier la recette en texte$/);
    const copied = readRecipeText(clipboard.mock.calls[0][0]);
    expect(copied).toMatchObject(expected);
    expect(copied.waterPlan).toEqual(saved.waterPlan);
    click(/^Enregistrer la recette$/);
    expect(save.mock.calls[1][0].waterPlan).toEqual(saved.waterPlan);
  });
  it('keeps zero sparge and a partial target from AI, with source notes and custom mash temperatures', async () => {
    ai.mockResolvedValue({
      ok: true,
      data: {
        ...fullRecipe,
        waterPlan: undefined,
        mashWaterL: 20,
        spargeWaterL: 0,
        waterTarget: { so4: 75, cl: 150, hco3: 0 },
        source: 'Fiche fabricant',
        notes: 'Ne pas filtrer.'
      }
    });
    const save = vi.fn();
    render(
      <BrewWizard
        config={defaultConfig}
        stockItems={[]}
        knownStyles={[]}
        onSave={save}
        onClose={vi.fn()}
        onSaveWaterSource={vi.fn()}
        onCreateStockItem={vi.fn()}
      />
    );
    click(/Coller une recette/);
    paste('Une recette à lire : 20 litres de Hazy IPA, liste complète.');
    await screen.findByRole('button', { name: 'Reprendre' });
    click(/^Reprendre$/);
    allerEtape(/^Récapitulatif$/);
    click(/^Enregistrer la recette$/);
    const saved = save.mock.calls[0][0];
    expect(saved.waterPlan.spargeWaterL).toBe(0);
    expect(saved.waterPlan.targetIons).toEqual({ so4: 75, cl: 150, hco3: 0 });
    expect(saved.mash.mashoutTempC).toBe(77.5);
    expect(saved.adjuncts).toEqual(fullRecipe.adjuncts);
    expect(saved.notes).toEqual(['Ne pas filtrer.']);
    expect(saved.notesCreation).toContain('Fiche fabricant');
  });
});
