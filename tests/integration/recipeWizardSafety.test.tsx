import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { readRecipeDraft } from '../../src/services/recipeDraft';
import { defaultConfig } from '../../src/services/storage';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { allerEtape } from '../helpers/wizard';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

type Save = React.ComponentProps<typeof BrewWizard>['onSave'];

function wizard({ recipe = structuredClone(fullRecipe), draftKey, save, reportedWriteError }: {
  recipe?: Recipe;
  draftKey?: string;
  save?: Save;
  reportedWriteError?: string;
} = {}) {
  const onSave = vi.fn(save ?? (() => {}));
  const onClose = vi.fn();
  const onDismissWriteError = vi.fn();
  function Host() {
    const [open, setOpen] = useState(true);
    const [writeError, setWriteError] = useState<string | null>(null);
    const saveAndReport: Save = async (value, thenBrew) => {
      try { await onSave(value, thenBrew); }
      catch (error) { setWriteError(reportedWriteError!); throw error; }
    };
    return <>
      <button onClick={() => setOpen(true)}>Ouvrir l’éditeur</button>
      {open && <BrewWizard
        seed={{ recipe }}
        draftKey={draftKey}
        stockItems={[]}
        config={defaultConfig}
        knownStyles={[]}
        onClose={() => { onClose(); setOpen(false); }}
        onSave={reportedWriteError ? saveAndReport : onSave}
        writeError={writeError}
        onDismissWriteError={() => { onDismissWriteError(); setWriteError(null); }}
        onCreateStockItem={vi.fn()}
        onLearnIngredient={vi.fn()}
        onSaveWaterSource={vi.fn()}
      />}
    </>;
  }
  return { ...render(<Host />), onSave, onClose, onDismissWriteError };
}

const recap = () => allerEtape(/^Récapitulatif$/);
const saveButton = () => screen.getByRole('button', { name: /^(Enregistrer la recette|Enregistrement…)$/ });
const titleField = () => screen.getByRole('textbox', { name: 'Nom de la bière', exact: true });
const volumeField = () => screen.getByRole('textbox', { name: 'Volume en fermenteur', exact: true });
const validationAlert = () => screen.getByText(/^(Une valeur|\d+ valeurs) à corriger$/).closest('[role="alert"]');
const close = () => fireEvent.click(screen.getAllByRole('button', { name: 'Fermer', exact: true })[0]);
const reopen = () => fireEvent.click(screen.getByRole('button', { name: 'Ouvrir l’éditeur' }));
const replace = (field: HTMLElement, value: string) => {
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

async function erase(field: HTMLElement) {
  await userEvent.clear(field);
  fireEvent.blur(field);
  expect(field).toHaveValue('');
}

describe('Recipe wizard submission safeguards', () => {
  it.each([
    ['Enregistrer la recette', false],
    ['Lancer le brassin', true]
  ] as const)('refuses %s after jumping to recap with no name, then accepts a corrected recipe', async (action, thenBrew) => {
    const recipe = { ...structuredClone(fullRecipe), name: '' };
    const { onSave } = wizard({ recipe });
    recap();
    const submit = screen.getByRole('button', { name: action, exact: true });
    expect(submit).toBeEnabled();
    fireEvent.click(submit);

    expect(onSave).not.toHaveBeenCalled();
    expect(validationAlert()).toHaveTextContent('Donne un nom à la recette');
    expect(titleField()).toHaveValue('');
    expect(titleField()).toHaveAttribute('aria-invalid', 'true');
    expect(titleField()).toHaveAccessibleDescription(/Donne un nom à la recette/);
    await waitFor(() => expect(titleField()).toHaveFocus());

    replace(titleField(), 'Pale de septembre');
    recap();
    fireEvent.click(screen.getByRole('button', { name: action, exact: true }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'Pale de septembre' }), thenBrew);
  });

  it.each(['ctrlKey', 'metaKey'] as const)('cannot bypass the missing name with %s + Enter', async modifier => {
    const { onSave } = wizard({ recipe: { ...structuredClone(fullRecipe), name: '' } });
    titleField().focus();
    fireEvent.keyDown(titleField(), { key: 'Enter', [modifier]: true });
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('main', { name: 'Identité' })).toBeInTheDocument();
    expect(validationAlert()).toHaveTextContent('Donne un nom à la recette');
    await waitFor(() => expect(titleField()).toHaveFocus());

    replace(titleField(), 'Recette au clavier');
    fireEvent.keyDown(titleField(), { key: 'Enter', [modifier]: true });
    expect(screen.getByRole('main', { name: 'Fermentescibles' })).toBeInTheDocument();
    recap();
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'Recette au clavier' }), false);
  });

  it('keeps erased volume missing through blur and reopening, refuses save, and accepts its correction', async () => {
    const draftKey = 'safety:missing-volume';
    const { onSave } = wizard({ draftKey });
    await erase(volumeField());
    expect(readRecipeDraft(draftKey)?.recipe.volumeL).toBeNaN();
    close();
    reopen();
    expect(volumeField()).toHaveValue('');

    recap();
    fireEvent.click(saveButton());
    expect(onSave).not.toHaveBeenCalled();
    expect(validationAlert()).toHaveTextContent('Volume en fermenteur : renseigne une valeur.');
    expect(volumeField()).toHaveValue('');
    expect(volumeField()).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(volumeField()).toHaveFocus());

    replace(volumeField(), '23,5');
    recap();
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ volumeL: 23.5 }), false);
  });

  it.each([
    { title: 'mash temperature', step: /^Paliers$/, label: /^Température du palier 1/, issue: 'Température du palier 1', correction: '65,5', value: (r: Recipe) => r.mash!.steps[0].tempC, expected: 65.5 },
    { title: 'mash duration', step: /^Paliers$/, label: /^Durée du palier 1/, issue: 'Durée du palier 1', correction: '60', value: (r: Recipe) => r.mash!.steps[0].durationMin, expected: 60 },
    { title: 'ingredient quantity', step: /^Fermentescibles$/, label: /^Quantité en kg$/, issue: 'Quantité de Pilsner', correction: '4,5', value: (r: Recipe) => r.fermentables![0].weightKg, expected: 4.5 }
  ])('refuses an erased $title and returns to the missing field for correction', async scenario => {
    const draftKey = `safety:${scenario.title}`;
    const { onSave } = wizard({ draftKey });
    allerEtape(scenario.step);
    await erase(screen.getAllByRole('textbox', { name: scenario.label })[0]);
    expect(scenario.value(readRecipeDraft(draftKey)!.recipe)).toBeNaN();
    recap();
    fireEvent.click(saveButton());
    expect(onSave).not.toHaveBeenCalled();
    expect(validationAlert()).toHaveTextContent(scenario.issue);
    const field = screen.getAllByRole('textbox', { name: scenario.label })[0];
    expect(field).toHaveValue('');
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field).toHaveFocus());

    replace(field, scenario.correction);
    recap();
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(scenario.value(onSave.mock.calls[0][0])).toBe(scenario.expected);
  });

  it('preserves explicit zero durations for instant transitions instead of treating them as missing', () => {
    const { onSave } = wizard();
    recap();
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledTimes(1);
    const saved = onSave.mock.calls[0][0];
    expect(saved.boilMin).toBe(0);
    expect(saved.mash?.steps[1].durationMin).toBe(0);
    expect(saved.fermentation?.[1].days).toBe(0);
  });
});

describe('Recipe drafts survive leaving the editor', () => {
  it.each(['close', 'unmount'] as const)('restores the current step and edited values after %s', mode => {
    const draftKey = `safety:resume:${mode}`;
    const view = wizard({ draftKey });
    replace(titleField(), 'Brouillon du dimanche');
    replace(volumeField(), '24,5');
    allerEtape(/^Paliers$/);
    replace(screen.getByRole('textbox', { name: /^Température du palier 1/ }), '66,5');

    if (mode === 'close') {
      close();
      expect(view.onClose).toHaveBeenCalledOnce();
      expect(screen.queryByRole('main')).toBeNull();
      reopen();
    } else {
      view.unmount();
      wizard({ draftKey });
    }

    expect(screen.getByRole('main', { name: 'Paliers' })).toBeInTheDocument();
    expect(screen.getByText(/Brouillon repris/)).toBeVisible();
    expect(screen.getByRole('textbox', { name: /^Température du palier 1/ })).toHaveValue('66,5');
    allerEtape(/^Identité$/);
    expect(titleField()).toHaveValue('Brouillon du dimanche');
    expect(volumeField()).toHaveValue('24,5');
  });

  it('clears the draft only after a successful save settles, without recreating it on unmount', async () => {
    const draftKey = 'safety:saved';
    let resolve!: () => void;
    const pending = new Promise<void>(done => { resolve = done; });
    const view = wizard({ draftKey, save: () => pending });
    replace(titleField(), 'Recette enregistrée');
    recap();
    fireEvent.click(saveButton());
    expect(view.onSave).toHaveBeenCalledOnce();
    expect(saveButton()).toBeDisabled();
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Recette enregistrée');

    await act(async () => resolve());
    expect(readRecipeDraft(draftKey)).toBeUndefined();
    view.unmount();
    expect(readRecipeDraft(draftKey)).toBeUndefined();
    wizard({ draftKey });
    expect(titleField()).toHaveValue(fullRecipe.name);
    expect(screen.queryByText(/Brouillon repris/)).toBeNull();
  });

  it('keeps a draft until explicit abandonment is confirmed, then does not restore it', () => {
    const draftKey = 'safety:discard';
    const { onClose } = wizard({ draftKey });
    replace(titleField(), 'Brouillon à abandonner');
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner le brouillon' }));
    expect(screen.getByText('Supprimer ce brouillon ?')).toBeVisible();
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Brouillon à abandonner');
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Garder', exact: true }));
    expect(readRecipeDraft(draftKey)).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Abandonner le brouillon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner', exact: true }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(readRecipeDraft(draftKey)).toBeUndefined();
    reopen();
    expect(titleField()).toHaveValue(fullRecipe.name);
    expect(screen.queryByText(/Brouillon repris/)).toBeNull();
  });

  it('announces a rejected save, reenables retry and preserves the draft across closing and reopening', async () => {
    const draftKey = 'safety:failed-save';
    let reject!: (error: Error) => void;
    const pending = new Promise<void>((_done, fail) => { reject = fail; });
    const { onSave } = wizard({ draftKey, save: () => pending });
    replace(titleField(), 'Recette hors connexion');
    recap();
    fireEvent.click(saveButton());
    expect(saveButton()).toBeDisabled();
    await act(async () => reject(new Error('Écriture refusée : réessaie après reconnexion.')));

    expect(onSave).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toHaveTextContent('Écriture refusée : réessaie après reconnexion.');
    expect(saveButton()).toBeEnabled();
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Recette hors connexion');
    close();
    reopen();
    expect(screen.getByRole('main', { name: 'Récapitulatif' })).toBeInTheDocument();
    allerEtape(/^Identité$/);
    expect(titleField()).toHaveValue('Recette hors connexion');
  });

  it.each([
    ['the same storage error', 'Connexion perdue pendant la sauvegarde.'],
    ['a distinct storage error', 'Synchronisation du stock interrompue.']
  ])('owns %s inside the wizard, focuses it and dismisses it without losing the draft', async (_scenario, reportedWriteError) => {
    const localError = 'Connexion perdue pendant la sauvegarde.';
    const draftKey = 'safety:owned-write-error';
    const scrolled = vi.spyOn(Element.prototype, 'scrollIntoView');
    const { onSave, onDismissWriteError } = wizard({
      draftKey,
      reportedWriteError,
      save: () => Promise.reject(new Error(localError))
    });
    replace(titleField(), 'Recette à reprendre');
    recap();
    fireEvent.click(saveButton());

    const alert = await screen.findByRole('alert');
    expect(screen.getAllByRole('alert')).toHaveLength(1);
    expect(within(screen.getByRole('main', { name: 'Récapitulatif' })).getByRole('alert')).toBe(alert);
    expect(alert).toHaveTextContent(localError);
    expect(alert).toHaveTextContent(reportedWriteError);
    expect(alert.textContent?.split(localError)).toHaveLength(2);
    await waitFor(() => expect(alert).toHaveFocus());
    expect(scrolled.mock.contexts).toContain(alert);
    expect(saveButton()).toBeEnabled();
    expect(onSave).toHaveBeenCalledOnce();

    await userEvent.click(within(alert).getByRole('button', { name: 'Fermer l’erreur' }));
    expect(onDismissWriteError).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('main', { name: 'Récapitulatif' })).toBeInTheDocument();
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Recette à reprendre');
    close();
    reopen();
    allerEtape(/^Identité$/);
    expect(titleField()).toHaveValue('Recette à reprendre');
  });
});

describe('Pending save ownership', () => {
  it('blocks edits while a save is pending and preserves the values when the save is rejected', async () => {
    const draftKey = 'safety:edited-while-saving';
    const user = userEvent.setup();
    let reject!: (error: Error) => void;
    const pending = new Promise<void>((_done, fail) => { reject = fail; });
    const { onSave } = wizard({ draftKey, save: () => pending });
    replace(titleField(), 'Version envoyée');
    recap();
    await user.click(screen.getByText('Identité', { selector: 'summary span' }).closest('summary')!);
    const name = screen.getByRole('textbox', { name: 'Nom de la recette' });
    expect(name).toBeEnabled();
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'Version envoyée' }), false);
    expect(saveButton()).toBeDisabled();
    expect(name).toBeDisabled();
    expect(name).not.toHaveAttribute('disabled'); // Disabled by the containing fieldset.
    const identityStep = screen.getAllByRole('button', { name: 'Identité', exact: true })[0];
    expect(identityStep).toBeDisabled();
    await user.type(name, 'Modification pendant l’attente');
    await user.click(identityStep);
    expect(screen.getByRole('main', { name: 'Récapitulatif' })).toBeInTheDocument();
    expect(name).toHaveValue('Version envoyée');
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Version envoyée');

    await act(async () => reject(new Error('La sauvegarde a été refusée.')));

    expect(screen.getByRole('alert')).toHaveTextContent('La sauvegarde a été refusée.');
    expect(name).toBeEnabled();
    expect(identityStep).toBeEnabled();
    expect(name).toHaveValue('Version envoyée');
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Version envoyée');
    await user.clear(name);
    await user.type(name, 'Correction après le refus');
    close();
    reopen();
    allerEtape(/^Identité$/);
    expect(titleField()).toHaveValue('Correction après le refus');
  });

  it('does not let an earlier session’s successful save erase a reopened session’s newer draft', async () => {
    const draftKey = 'safety:reopened-while-saving';
    let resolve!: () => void;
    const pending = new Promise<void>(done => { resolve = done; });
    const { onSave } = wizard({ draftKey, save: () => pending });
    replace(titleField(), 'Première session');
    recap();
    fireEvent.click(saveButton());
    expect(onSave).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ name: 'Première session' }), false);
    close();
    reopen();
    allerEtape(/^Identité$/);
    replace(titleField(), 'Nouvelle session modifiée');
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Nouvelle session modifiée');

    await act(async () => resolve());

    expect(screen.getByRole('main', { name: 'Identité' })).toBeInTheDocument();
    expect(titleField()).toHaveValue('Nouvelle session modifiée');
    expect(readRecipeDraft(draftKey)?.recipe.name).toBe('Nouvelle session modifiée');
  });
});
