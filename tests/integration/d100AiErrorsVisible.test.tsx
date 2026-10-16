import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
const mocked = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => mocked.call }));
vi.mock('../../src/services/firebase', () => ({ functions: {} }));
import { RecipeReview } from '../../src/ui/RecipeReview';
import { RecipeImportSheet } from '../../src/ui/RecipeImportSheet';
import { AiAssist } from '../../src/ui/AiAssist';
import { YeastSheetAssistant } from '../../src/ui/RecipeAutoComplete';
import { GEMINI_UNUSABLE_MESSAGES } from '../../functions/src/geminiResponse';
import { sanitizeRecipeImport } from '../../functions/src/recipeImportResult';

/** #100 : textes visibles nouveaux ou modifiés, rendus dans les vrais composants (jsdom), Gemini simulé. */
afterEach(() => { cleanup(); mocked.call.mockReset(); });
const functionsError = (code: string, message = code) => Object.assign(new Error(message), { code: `functions/${code}` });

describe('Messages d’erreur IA visibles', () => {
  it('relecture : une erreur sans corps (« unknown ») s’affiche en français', async () => {
    mocked.call.mockRejectedValue(functionsError('unknown'));
    render(<RecipeReview buildText={() => 'Recette de test'} data={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Le serveur IA a répondu sans détail exploitable');
    expect(alert).not.toHaveTextContent(/^unknown$/);
  });

  it('relecture : un dépassement côté client dit que l’appel a pu être compté, sans parler de niveau', async () => {
    mocked.call.mockRejectedValue(functionsError('deadline-exceeded'));
    render(<RecipeReview buildText={() => 'Recette de test'} data={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Le serveur IA n’a pas répondu à temps');
    expect(alert).not.toHaveTextContent('niveau Rapide');
  });

  it('import : les nombres écartés par le serveur sont annoncés en français de brasseur, sans durée inventée', async () => {
    // The real server rule (recipeImportResult.ts) writes the warning, as aiTask does.
    mocked.call.mockResolvedValue({ data: { ok: true, model: 'gemini-3.8-flash', tier: 'fast', data: sanitizeRecipeImport({
      name: 'Brown ale', style: 'English Brown', volumeL: 20,
      fermentables: [{ name: 'Maris Otter', weightKg: 4, kind: 'grain', use: 'empatage' }],
      hops: [{ name: 'Fuggle', weightG: 30, stage: 'boil', timeMin: 6e-323 }, { name: 'EKG', weightG: 20, stage: 'boil', timeMin: 15 }]
    }) } });
    render(<RecipeImportSheet open onClose={vi.fn()} onApply={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: 'Brown ale, 20 L, Maris Otter 4 kg, Fuggle 30 g à 60 min.' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^Lire la recette$/ })[0]);
    expect(await screen.findByText('Fuggle : durée d’ajout impossible, valeur écartée. À compléter.')).toBeInTheDocument();
    expect(screen.queryByText(/timeMin|6e-323/)).toBeNull();
    // V2 Chrome (D100): an absent boil time read « Ébullition 0 min » and contradicted the warning.
    expect(screen.getByText(/^durée à préciser/)).toBeInTheDocument();
    expect(screen.getByText(/^15 min/)).toBeInTheDocument();
    expect(screen.queryByText(/^0 min/)).toBeNull();
    expect(mocked.call.mock.calls[0][0]).toMatchObject({ task: 'importRecipe', tier: 'fast' });
  });

  it.each([
    ['refus du serveur', { data: { ok: false, tier: 'fast', error: 'L’IA n’a pas abouti dans le délai de 2 minutes. L’appel a pu être compté dans le budget IA ; réessaie plus tard.' } }, /L’appel a pu être compté/],
    ['dépassement client', functionsError('deadline-exceeded'), /Le serveur IA n’a pas répondu à temps/]
  ])('import d’un texte collé : l’erreur IA (%s) reste affichée au-dessus de la lecture locale', async (_case, outcome, said) => {
    if (outcome instanceof Error) mocked.call.mockRejectedValue(outcome); else mocked.call.mockResolvedValue(outcome);
    const onApply = vi.fn();
    render(<RecipeImportSheet open onClose={vi.fn()} onApply={onApply} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: 'Brown ale\n20 L\nMaris Otter 4 kg\nFuggle 30 g à 60 min' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^Lire la recette$/ })[0]);
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(said);
    const local = screen.getByText(/^Lecture locale :/);
    expect(alert.compareDocumentPosition(local) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(alert.compareDocumentPosition(screen.getByRole('heading', { level: 3, name: /Brown ale|Sans nom/ })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it('fiche levure : la sortie dégénérée refusée par le serveur s’affiche telle quelle', async () => {
    mocked.call.mockResolvedValue({ data: { ok: false, tier: 'fast', error: GEMINI_UNUSABLE_MESSAGES.degenerate } });
    render(<AiAssist kind="levure" name="SafAle S-04" missing={['températures']} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Compléter avec l’IA/ }));
    const shown = await screen.findByText(/nombre répété sans fin/);
    // V3 m10: do not resend the same request; the fiche screen adds the manual way out, as a sentence of its own
    // (supervisor: « … relance la demande. — à saisir à la main. » read as a glued fragment).
    expect(shown).toHaveTextContent(/modifie-la avant de relancer\. À saisir à la main\.$/);
    expect(shown).not.toHaveTextContent('relance la demande');
    expect(shown).not.toHaveTextContent('— à saisir');
  });

  it('fiche levure de la recette : même phrase, sans fragment accolé', () => {
    render(<YeastSheetAssistant {...({ subject: 'SafAle S-04', yeast: { name: 'SafAle S-04' }, entry: { status: 'error', error: GEMINI_UNUSABLE_MESSAGES.degenerate },
      onEntry: vi.fn(), onAccept: vi.fn(), scopeText: '' } as any)} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/modifie-la avant de relancer\. À saisir à la main\.$/);
    expect(alert).not.toHaveTextContent('— à saisir');
  });

  it('relecture : la demande part au réglage Rapide', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, data: { verdict: 'Relecture simulée', findings: [] } } });
    render(<RecipeReview buildText={() => 'Recette de test'} data={{}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Faire relire la recette' }));
    await screen.findByText('Relecture simulée');
    expect(mocked.call.mock.calls[0][0]).toMatchObject({ task: 'reviewRecipe', tier: 'fast' });
  });
});
