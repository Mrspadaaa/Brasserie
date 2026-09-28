import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { YeastRecipePlan } from '../../src/ui/YeastRecipePlan';
import type { TrialRecipe } from '../../src/domain/hopIndex/trials';
import { yeastReferences } from '../../src/domain/yeastReferences';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';

afterEach(cleanup);

const refs = yeastReferences([]);
const recipe = (changes: Partial<Recipe> = {}): Recipe => ({
  ...structuredClone(fullRecipe),
  name: 'Pale de test',
  style: 'Pale Ale',
  styleRef: undefined,
  volumeL: 20,
  ogTarget: 1.05,
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', form: 'sèche', qty: 10, unit: 'g' },
  fermentation: [
    { name: 'Primaire', kind: 'primaire', tempC: 19, days: 10, note: 'Contrôle à J3.' },
    { name: 'Garde', kind: 'garde', tempC: 4, days: 6, note: 'Descente progressive.' },
  ],
  mash: { ...fullRecipe.mash, steps: [{ name: 'Saccharification', tempC: 66, durationMin: 60 }] },
  hops: [],
  ...changes,
});

const callbacks = () => ({ onChange: vi.fn((next: TrialRecipe) => next), onCompare: vi.fn(), onGoal: vi.fn() });
const renderPlan = (value: Recipe, props: ReturnType<typeof callbacks> = callbacks(), extra: { initialGoal?: 'clean'; initialProgramme?: Recipe['fermentation'] } = {}) => {
  const view = render(<YeastRecipePlan recipe={value} refs={refs} {...props} {...extra} />);
  return { ...view, ...props };
};
const openConduct = () => {
  const button = screen.getByRole('button', { name: /Conduite · température × jours/ });
  if (button.getAttribute('aria-expanded') !== 'true') fireEvent.click(button);
  expect(button).toHaveAttribute('aria-expanded', 'true');
};
const openObjectives = () => {
  const button = document.querySelector('[data-station-toggle="objectives"]')!;
  if (button.getAttribute('aria-expanded') !== 'true') fireEvent.click(button);
  expect(button).toHaveAttribute('aria-expanded', 'true');
};
const change = (label: string, value: string) => {
  const input = screen.getByLabelText(label);
  fireEvent.change(input, { target: { value } });
  fireEvent.blur(input);
};

describe('YeastRecipePlan — garde-fous en situation', () => {
  it('rend la source corroborante comme changement documentaire sans remplacer la plage personnelle', () => {
    const retained: YeastTechnicalFact = { key: 'attenuation', reported: '70–75 %', range: { min: 70, max: 75 },
      qualifier: 'range', unit: '%', origin: 'personal', source: 'Mes références documentées' };
    const corroborating: YeastTechnicalFact = { ...retained, origin: 'manufacturer', source: 'Publication complémentaire',
      sourceUrl: 'https://example.test/corroboration', retrievedAt: '2026-09-27', context: 'Même milieu et mêmes conditions' };
    const original = recipe({ yeast: { ...recipe().yeast, technicalFacts: [retained], technicalSelections: { attenuation: retained } } });
    const spies = callbacks();
    render(<YeastRecipePlan recipe={original} refs={refs} {...spies} initialYeastId="fermentis-us05"
      trialYeast={{ ...original.yeast, technicalFacts: [retained, corroborating] }} />);
    expect(screen.getByText('Observations documentaires').closest('li')).toHaveTextContent('1 ajoutée · 0 retirées');
    fireEvent.click(screen.getByText('Observations et sources modifiées'));
    const changed = screen.getByRole('list', { name: 'Observations documentaires retenues' });
    expect(changed).toHaveTextContent('plage 70–75 %');
    expect(changed).toHaveTextContent('Même milieu et mêmes conditions');
    expect(within(changed).getByRole('link', { name: 'Publication complémentaire' })).toHaveAttribute('href', corroborating.sourceUrl);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    const applied = spies.onChange.mock.calls[0][0] as Recipe;
    expect(applied.yeast.technicalSelections?.attenuation).toEqual(retained);
    expect(applied.yeast.technicalFacts).toEqual([retained, corroborating]);
    expect(applied.yeast.attenuationPct).toBe(original.yeast.attenuationPct);
    expect(applied.yeastDesign?.applied.yeast.technicalFacts).toEqual([retained, corroborating]);
  });

  it('montre un changement de provenance seul et conserve les notes de conduite à l’application', () => {
    const original = recipe();
    original.yeast.notes = 'Ne pas secouer ce lot.';
    original.yeast.documentaryNotes = [{ text: 'Profil neutre.', origin: 'ai', source: 'Ancienne fiche' }];
    const revised = { ...original.yeast, documentaryNotes: [{ text: 'Profil neutre.', origin: 'manufacturer' as const,
      source: 'Fiche fabricant révisée', sourceUrl: 'https://example.test/fiche', retrievedAt: '2026-09-26', context: 'Moût standard' }] };
    const spies = callbacks();
    render(<YeastRecipePlan recipe={original} refs={refs} {...spies} initialYeastId="fermentis-us05" trialYeast={revised} />);
    const row = screen.getByText('Notes documentaires').closest('li')!;
    expect(row).toHaveTextContent('Ancienne fiche');
    expect(row).toHaveTextContent('Fiche fabricant révisée');
    expect(row).toHaveTextContent('https://example.test/fiche');
    expect(row).toHaveTextContent('Moût standard');
    expect(row).toHaveTextContent('2026-09-26');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(spies.onChange).toHaveBeenCalledTimes(1);
    const applied = spies.onChange.mock.calls[0][0] as Recipe;
    expect(applied.yeast.documentaryNotes).toEqual(revised.documentaryNotes);
    expect(applied.yeast.notes).toBe(original.yeast.notes);
    expect(applied.yeastDesign?.applied.yeast.documentaryNotes).toEqual(revised.documentaryNotes);
  });

  it.each([[null, 'inconnues'], [[], 'aucune note retenue']] as const)('rend la décision documentaire %j sans ressusciter les notes supprimées', (notes, wording) => {
    const original = recipe();
    original.yeast.documentaryNotes = [{ text: 'Ancienne information.', origin: 'ai' }];
    const spies = callbacks();
    render(<YeastRecipePlan recipe={original} refs={refs} {...spies} initialYeastId="fermentis-us05"
      trialYeast={{ ...original.yeast, documentaryNotes: notes === null ? null : [] }} />);
    expect(screen.getByText('Notes documentaires').closest('li')).toHaveTextContent(`Ancienne information. · IA → ${wording}`);
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect((spies.onChange.mock.calls[0][0] as Recipe).yeast.documentaryNotes).toEqual(notes);
  });

  it('garde un essai périmé isolé jusqu’à reprise explicite des nouvelles données', () => {
    const original = recipe(), spies = callbacks();
    const view = renderPlan(original, spies, { initialGoal: 'clean' });
    openObjectives();
    openConduct();

    change('Durée du palier 1 · Primaire', '9');
    fireEvent.click(screen.getByRole('button', { name: 'Proposer une conduite' }));
    expect(screen.getByRole('region', { name: 'Proposition de conduite' })).toBeInTheDocument();

    const current = recipe({ volumeL: 23, fermentation: [
      { ...original.fermentation![0], days: 12 }, original.fermentation![1],
    ] });
    view.rerender(<YeastRecipePlan recipe={current} refs={refs} {...spies} initialGoal="clean" />);
    const staleNotice = () => screen.getAllByRole('alert').find(alert => alert.textContent?.includes('La recette ou la fiche de la souche a changé'));
    expect(staleNotice()).toBeDefined();
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Proposer une conduite' })).toBeDisabled();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();

    // Stale controls are actually disabled: do not dispatch synthetic input
    // events that a brewer could not send to a disabled field.
    const staleDuration = screen.getByLabelText('Durée du palier 1 · Primaire');
    expect(staleDuration).toBeDisabled();
    expect(screen.getByLabelText('Profil recherché')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Rétablir ce palier' })).toBeDisabled();
    expect(staleDuration).toHaveValue('9');
    expect(document.querySelector('li[data-phase-days="9"]')).not.toBeNull();
    expect(staleNotice()).toBeDefined();
    expect(spies.onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Reprendre les données actuelles' }));
    expect(screen.queryByText(/La recette ou la fiche de la souche a changé/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Durée du palier 1 · Primaire')).toHaveValue('12');
    expect(screen.getByLabelText('Durée du palier 1 · Primaire')).toBeEnabled();
    expect(screen.getByRole('slider', { name: 'Température du palier 1 · Primaire' })).toHaveAttribute('data-handle-axis', 'temperature');
    expect(screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' })).toHaveAttribute('data-handle-axis', 'duration');
    expect(spies.onChange).not.toHaveBeenCalled();

    change('Durée du palier 1 · Primaire', '13');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(spies.onChange).toHaveBeenCalledTimes(1);
    const applied = spies.onChange.mock.calls[0][0] as Recipe;
    expect(applied.volumeL).toBe(23);
    expect(applied.fermentation?.[0].days).toBe(13);
  });

  it('supprime la primaire sans la recréer, puis applique seulement une primaire explicitement ajoutée et complétée', () => {
    const original = recipe(), spies = callbacks();
    renderPlan(original, spies);
    openConduct();

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le palier 1 · Primaire' }));
    const programme = screen.getByRole('region', { name: 'Programme proposé' });
    expect(within(programme).queryByText(/Palier \d+ · Primaire/)).not.toBeInTheDocument();
    expect(within(programme).getByText(/Palier 1 · Garde/)).toBeInTheDocument();
    expect(screen.getByText(/Aucune primaire dans le programme de l’essai/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    expect(spies.onChange).not.toHaveBeenCalled();

    const missingPrimary = document.querySelector('[data-programme-incomplete]')!;
    fireEvent.click(within(missingPrimary).getByRole('button', { name: 'Ajouter une primaire à J0' }));
    const temperature = screen.getByLabelText('Température du palier 1 · Fermentation principale');
    const duration = screen.getByLabelText('Durée du palier 1 · Fermentation principale');
    expect(temperature).toHaveValue('');
    expect(duration).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    expect(programme.querySelector('li[data-phase-days="6"]')).not.toBeNull();
    expect(spies.onChange).not.toHaveBeenCalled();

    change('Température du palier 1 · Fermentation principale', '18');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeDisabled();
    change('Durée du palier 1 · Fermentation principale', '0');
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));

    expect(spies.onChange).toHaveBeenCalledTimes(1);
    const applied = spies.onChange.mock.calls[0][0] as Recipe;
    expect(applied.fermentation).toHaveLength(2);
    expect(applied.fermentation?.[0]).toMatchObject({ kind: 'primaire', tempC: 18, days: 0 });
    expect(applied.fermentation?.[1]).toEqual(original.fermentation?.[1]);
    expect(applied.yeastDesign?.applied.fermentation).toEqual(applied.fermentation);
  });

  it('rebase explicitement les autres données tout en gardant le programme local demandé', () => {
    const original = recipe(), spies = callbacks();
    const view = renderPlan(original, spies);
    openConduct();
    change('Durée du palier 1 · Primaire', '9');
    expect(document.querySelector('li[data-phase-days="9"]')).not.toBeNull();
    expect(spies.onChange).not.toHaveBeenCalled();

    const changedParent = recipe({ volumeL: 23, fermentation: [
      { ...original.fermentation![0], days: 12 }, original.fermentation![1],
    ] });
    view.rerender(<YeastRecipePlan recipe={changedParent} refs={refs} {...spies} />);
    const staleAction = document.querySelector('[data-stale-near-chart]')!;
    fireEvent.click(within(staleAction).getByRole('button', { name: 'Reprendre en gardant ces paliers' }));

    expect(screen.queryByText(/La recette ou la fiche de la souche a changé/)).not.toBeInTheDocument();
    expect(screen.getByLabelText('Durée du palier 1 · Primaire')).toHaveValue('9');
    expect(screen.getByLabelText('Durée du palier 1 · Primaire')).toBeEnabled();
    expect(screen.getByRole('slider', { name: 'Température du palier 1 · Primaire' })).toBeVisible();
    expect(screen.getByRole('slider', { name: 'Durée du palier 1 · Primaire, poignée de fin' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Appliquer au brouillon' })).toBeEnabled();
    expect(spies.onChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Appliquer au brouillon' }));
    expect(spies.onChange).toHaveBeenCalledTimes(1);
    const applied = spies.onChange.mock.calls[0][0] as Recipe;
    expect(applied.volumeL).toBe(23);
    expect(applied.fermentation?.[0].days).toBe(9);
    expect(applied.fermentation?.[1]).toEqual(original.fermentation?.[1]);
  });

  it('montre le froid documenté de Wyeast 2124 sans déduire un protocole de lagering', () => {
    const current = recipe({ style: 'Recette libre', yeast: {
      name: 'Wyeast 2124 Bohemian Lager', hopIndexId: 'wyeast-2124', form: 'liquide',
    }, fermentation: [
      { name: 'Primaire', kind: 'primaire', tempC: 10, days: 2 },
      { name: 'Garde froide', kind: 'garde', tempC: 7, days: 5 },
    ] });
    const spies = callbacks();
    renderPlan(current, spies, { initialProgramme: current.fermentation });
    openConduct();

    const chart = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    expect(chart.querySelectorAll('[data-band="temperature"]')).toHaveLength(1);
    expect(Array.from(chart.querySelectorAll('g[data-step]'), phase => phase.getAttribute('data-temp'))).toEqual(['10', '7']);
    fireEvent.click(screen.getByRole('button', { name: /Sélectionner le palier 2 : Garde froide/ }));
    expect(screen.getByRole('slider', { name: 'Température du palier 2 · Garde froide' })).toHaveAttribute('aria-valuetext', '7 °C');
    expect(screen.getByRole('slider', { name: 'Durée du palier 2 · Garde froide, poignée de fin' })).toHaveAttribute('aria-valuetext', '5 j · fin J7');
    expect(spies.onChange).not.toHaveBeenCalled();
  });

  it('ouvre le réglage replié et focalise le nom de la culture signalée', async () => {
    const spies = callbacks();
    renderPlan(recipe(), spies, { initialGoal: 'clean' });
    openConduct();
    fireEvent.change(screen.getByLabelText('Procédé de fermentation'), { target: { value: 'mixed-culture' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une culture' }));

    const name = screen.getByLabelText('Culture 1');
    expect(name).toHaveValue('');
    const preparation = name.closest('details.yc-adjustments')!;
    preparation.open = false;
    expect(preparation).not.toHaveAttribute('open');

    fireEvent.click(screen.getByRole('button', { name: 'Corriger la culture 1 · nom' }));
    await waitFor(() => expect(name).toHaveFocus());
    expect(preparation).toHaveAttribute('open');

    fireEvent.change(name, { target: { value: 'Culture complémentaire' } });
    expect(screen.queryByRole('button', { name: 'Corriger la culture 1 · nom' })).not.toBeInTheDocument();
    expect(spies.onChange).not.toHaveBeenCalled();
  });

  it.each([
    ['reportedPoint', '18 °C', false],
    ['greaterThan', '> 18 °C', false],
    ['lessThan', '< 18 °C', false],
    ['range', '18–22 °C', true],
  ] as const)('%s reste fidèle dans la frise : bande seulement pour une plage', (qualifier, reported, hasBand) => {
    const range = qualifier === 'range' ? { min: 18, max: 22 } : { min: 18, max: 18 };
    const fact: YeastTechnicalFact = { key: 'temperature', reported, range, unit: '°C', qualifier,
      origin: 'manufacturer', source: 'Fiche synthétique de test' };
    const current = recipe({ yeast: { ...recipe().yeast, fermTempMinC: undefined, fermTempMaxC: undefined,
      technicalFacts: [fact], technicalSelections: { temperature: fact } } });
    renderPlan(current, callbacks(), { initialProgramme: current.fermentation });

    const figure = screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' });
    const rectangleBand = figure.querySelector('[data-band="temperature"]');
    const pointBand = figure.querySelector('line[class*="text-ebc-straw/40"]');
    if (hasBand) expect(rectangleBand).not.toBeNull();
    else {
      expect(rectangleBand).toBeNull();
      expect(pointBand).toBeNull();
    }
    fireEvent.click(within(figure).getByText('Jours de bascule et légende'));
    const legend = within(figure).getByText(/Trait : consigne prévue/);
    expect(legend.textContent?.includes('bande :')).toBe(hasBand);
  });
});
