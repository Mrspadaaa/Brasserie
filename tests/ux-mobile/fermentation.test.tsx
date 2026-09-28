import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YeastRecipePlan } from '../../src/ui/YeastRecipePlan';
import { FermentationTemperatureChart, positionFermentationSteps } from '../../src/ui/FermentationTemperatureChart';
import type { TrialRecipe } from '../../src/domain/hopIndex/trials';
import { fermentationUxRecipe, fermentationUxRefs } from './fermentation.fixture-data';

afterEach(cleanup);

function RecipeHost({ initial, onApply, startedSnapshot }: {
  initial: TrialRecipe; onApply: (next: TrialRecipe) => void; startedSnapshot: TrialRecipe;
}) {
  const [recipe, setRecipe] = useState(initial);
  return <div className="yeast-choice">
    <YeastRecipePlan recipe={recipe} refs={fermentationUxRefs}
      onChange={next => { onApply(next); setRecipe(next); return next; }}
      onCompare={() => undefined} onGoal={() => undefined} />
    <output aria-label="Snapshot du brassin déjà lancé">{(startedSnapshot.fermentation ?? []).map(step => `${step.name}: ${step.days} j`).join(' · ')}</output>
  </div>;
}

const selectSecondPhaseByKeyboard = async (user: ReturnType<typeof userEvent.setup>) => {
  const phase = screen.getByRole('button', { name: /Sélectionner le palier 2 : Repos diacétyle/ });
  phase.focus();
  await user.keyboard('{Enter}');
  await waitFor(() => expect(screen.getByRole('textbox', { name: /Durée du palier 2/ })).toHaveFocus());
};
const change = (field: HTMLElement, value: string) => {
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

describe('POC UX mobile fermentation', () => {
  it('sélectionne le deuxième palier, montre le décalage, garde la durée effacée inconnue puis annule et rouvre', async () => {
    const user = userEvent.setup();
    const initial = fermentationUxRecipe();
    const onApply = vi.fn();
    render(<RecipeHost initial={initial} onApply={onApply} startedSnapshot={structuredClone(initial)} />);

    await selectSecondPhaseByKeyboard(user);
    const editor = screen.getByRole('region', { name: 'Modifier le palier sélectionné' });
    expect(editor).toHaveTextContent('J début 10 · J fin 12');
    const duration = screen.getByRole('textbox', { name: /Durée du palier 2 · Repos diacétyle/ });
    expect(duration).toHaveValue('2');
    expect(screen.getByRole('textbox', { name: /Température du palier 2 · Repos diacétyle/ })).toHaveValue('20');

    change(duration, '3');
    expect(editor).toHaveTextContent('J début 10 · J fin 13');
    expect(editor).toHaveTextContent('Garde : J12 → J13 (+1 j)');
    expect(screen.getByRole('button', { name: /Palier 3 · Garde/ })).toHaveTextContent('J début 13 · J fin 20 · Décalé +1 j vs brouillon');
    expect(onApply).not.toHaveBeenCalled();

    change(duration, '');
    expect(duration).toHaveValue('');
    expect(duration).toHaveAttribute('aria-invalid', 'true');
    expect(editor).toHaveTextContent('J début 10 · J fin inconnue');
    expect(editor).toHaveTextContent('Garde : jour de début inconnu');
    expect(screen.getByText('Durée totale inconnue')).toBeVisible();
    expect(screen.getByRole('button', { name: /Palier 3 · Garde/ })).toHaveTextContent('J début inconnu · J fin inconnue');
    const visibleCharts = screen.getAllByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(visibleCharts.at(-1)?.querySelector('[data-phase-select="2"]')).toBeNull();

    change(duration, '2');
    expect(duration).toHaveValue('2');
    expect(editor).toHaveTextContent('J début 10 · J fin 12');
    expect(screen.getByRole('button', { name: /Palier 3 · Garde/ })).toHaveTextContent('J début 12 · J fin 19');

    await user.click(screen.getByRole('button', { name: 'Annuler l’essai' }));
    expect(screen.getByText('Essai annulé. Le brouillon reste inchangé.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: /Durée du palier 2 · Repos diacétyle/ })).toHaveValue('2');
    expect(onApply).not.toHaveBeenCalled();
  });

  it('applique la conduite à la recette par son callback et laisse le snapshot du brassin lancé intact', async () => {
    const user = userEvent.setup();
    const initial = fermentationUxRecipe();
    const startedSnapshot = structuredClone(initial);
    const onApply = vi.fn();
    render(<RecipeHost initial={initial} onApply={onApply} startedSnapshot={startedSnapshot} />);

    await selectSecondPhaseByKeyboard(user);
    const duration = screen.getByRole('textbox', { name: /Durée du palier 2 · Repos diacétyle/ });
    change(duration, '4');
    await user.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));

    await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
    const savedRecipe = onApply.mock.calls[0][0] as TrialRecipe;
    expect(savedRecipe.fermentation?.map(phase => phase.days)).toEqual([10, 4, 7]);
    expect(savedRecipe.yeastDesign?.applied.fermentation).toEqual(savedRecipe.fermentation);
    expect(initial.fermentation?.map(phase => phase.days)).toEqual([10, 2, 7]);
    expect(startedSnapshot.fermentation?.map(phase => phase.days)).toEqual([10, 2, 7]);
    expect(screen.getByLabelText('Snapshot du brassin déjà lancé')).toHaveTextContent('Repos diacétyle: 2 j');

    expect(screen.getByRole('textbox', { name: /Durée du palier 2 · Repos diacétyle/ })).toHaveValue('4');
    expect(screen.getByRole('button', { name: /Palier 3 · Garde/ })).toHaveTextContent('J début 14 · J fin 21');
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it('énonce chaque décalage cumulé après deux durées modifiées', () => {
    const initial = fermentationUxRecipe();
    render(<RecipeHost initial={initial} onApply={vi.fn()} startedSnapshot={structuredClone(initial)} />);
    const programme = screen.getByRole('region', { name: 'Programme proposé' });
    change(screen.getByRole('textbox', { name: /Durée du palier 1 ·/ }), '11');
    fireEvent.click(programme.querySelector('[data-phase-choice="1"]')!);
    change(screen.getByRole('textbox', { name: /Durée du palier 2 ·/ }), '3');
    fireEvent.click(programme.querySelector('[data-phase-choice="0"]')!);
    const downstream = screen.getByRole('region', { name: 'Modifier le palier sélectionné' }).querySelector('[data-following-shift]');
    expect(downstream).toHaveTextContent('Repos diacétyle : J10 → J11 (+1 j)');
    expect(downstream).toHaveTextContent('Garde : J12 → J14 (+2 j)');
  });

  it('interrompt le calcul des jours après une durée inconnue', () => {
    const positions = positionFermentationSteps([
      { name: 'Primaire', kind: 'primaire', tempC: 18, days: 10 },
      { name: 'Repos diacétyle', kind: 'reposDiacetyle', tempC: 20, days: undefined },
      { name: 'Garde', kind: 'garde', tempC: 4, days: 7 },
    ]);
    expect(positions.map(({ start, end }) => [start, end])).toEqual([[0, 10], [10, null], [null, null]]);
  });

  it('écarte une échelle illisible sous valeur extrême sans masquer le programme exact', () => {
    render(<FermentationTemperatureChart steps={[{ name: 'Primaire', kind: 'primaire', tempC: 18, days: 10 }]} pitchTempC={1e30} />);
    expect(screen.getByRole('status')).toHaveTextContent('Échelle de température non lisible');
    expect(screen.queryByRole('figure', { name: 'Calendrier des températures de fermentation' })).not.toBeInTheDocument();
  });
});
