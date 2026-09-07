import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { Batch, BrewDayState } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';
import * as sessionModule from '../../src/ui/useBrewSession';

vi.mock('../../src/services/brewAlarms', () => ({
  enableBrewAlerts: vi.fn(),
  syncBrewAlerts: vi.fn()
}));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mount(r = recipe(), over: Partial<BrewDayState> = {}) {
  const save = vi.fn();
  const state = brewState(r, over);
  const batch = {
    id: 'LOT-UX',
    name: r.name,
    recipeSnapshot: r,
    brewDay: state
  } as Batch;
  const view = render(
    <BrewDayPage
      batch={batch}
      config={defaultConfig}
      onClose={vi.fn()}
      onSave={save}
      onFinish={vi.fn()}
    />
  );
  return {
    ...view,
    save,
    state,
    latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState
  };
}
const phase = (name: string) =>
  fireEvent.click(
    within(
      screen.getByRole('navigation', {
        name: ['Recette', 'Journal', 'Conduite'].includes(name)
          ? 'Vues du brassin'
          : 'Phases du brassage'
      })
    ).getByRole('button', {
      name,
      exact: true
    })
  );
const ingredients = () => within(screen.getByRole('region', { name: 'Ingrédients à ajouter' }));

const chooseStep = (label: string) => {
  fireEvent.click(screen.getByRole('button', { name: 'Choisir une étape' }));
  fireEvent.click(
    within(screen.getByRole('dialog', { name: 'Choisir une étape' })).getByRole('button', {
      name: label,
      exact: true
    })
  );
};
const editDose = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

describe('Poste de brassage : les bons gestes au bon moment', () => {
  it.each([
    { ph: 5.4, cold: false, corrected: false, feedback: 'à confirmer à froid' },
    { ph: 5.7, cold: true, corrected: true, feedback: 'à remesurer' }
  ])(
    'le résumé pH indique « $feedback » au lieu de valider une mesure inexploitable',
    ({ ph, cold, corrected, feedback }) => {
      mount(recipe(), {
        readings: [
          { id: 'ph', at: 1000, stepId: 'mash-0', kind: 'ph', value: ph, unit: '', roomTemp: cold }
        ],
        acidCorrections: corrected
          ? [{ id: 'fix', at: 2000, stepId: 'mash-0', acid: 'lactique', amount: 1 }]
          : []
      });
      phase('Empâter');
      const summary = screen.getByRole('region', { name: 'Relevés de cette étape' });
      expect(summary).toHaveTextContent(feedback);
      expect(summary).not.toHaveTextContent('rien à ajouter');
      expect(
        within(summary).queryByRole('button', { name: /J’ai ajouté/ })
      ).not.toBeInTheDocument();
    }
  );

  it('conserve une mesure inachevée pendant la consultation et dans son palier d’origine', () => {
    const v = mount();
    phase('Empâter');
    fireEvent.change(screen.getByRole('textbox', { name: /pH de maische/ }), {
      target: { value: '5,' }
    });
    expect(
      within(screen.getByRole('region', { name: 'Mesures de cette étape' })).getByRole('button', {
        name: 'Noter'
      })
    ).toBeDisabled();
    expect(screen.queryByText(/Maische déjà acide/)).not.toBeInTheDocument();
    phase('Recette');
    phase('Conduite');
    expect(screen.getByRole('textbox', { name: /pH de maische/ })).toHaveValue('5,');
    chooseStep('Mashout');
    expect(screen.getByLabelText('Température (°C)')).toHaveValue('');
    chooseStep('Saccharification');
    expect(screen.getByRole('textbox', { name: /pH de maische/ })).toHaveValue('5,');
    expect(v.latest().readings).toEqual([]);
  });

  it('rattache une note commencée avant un changement de phase à son étape d’origine', () => {
    const v = mount();
    fireEvent.change(screen.getByLabelText('Observation'), { target: { value: 'Pompe amorcée' } });
    phase('Empâter');
    expect(screen.getByLabelText('Observation')).toHaveValue('Pompe amorcée');
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Notes et conseil' })).getByRole('button', {
        name: 'Noter'
      })
    );
    expect(v.latest().notes?.[0]).toMatchObject({ stepId: 'eau', text: 'Pompe amorcée' });
  });

  it('demande confirmation avant de terminer un minuteur encore actif', () => {
    const v = mount();
    phase('Empâter');
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    const started = v.latest().steps.find((s) => s.id === 'mash-0')!;
    fireEvent.click(screen.getByRole('button', { name: 'Terminer le palier' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Il reste');
    expect(v.latest().steps.find((s) => s.id === 'mash-0')?.doneAt).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler', exact: true }));
    expect(v.latest().steps.find((s) => s.id === 'mash-0')).toEqual(started);
    fireEvent.click(screen.getByRole('button', { name: 'Terminer le palier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Terminer maintenant' }));
    expect(v.latest().steps.find((s) => s.id === 'mash-0')?.doneAt).toEqual(expect.any(Number));
    expect(v.latest().steps.find((s) => s.label === 'Mashout')).toMatchObject({ label: 'Mashout' });
    expect(v.latest().steps.find((s) => s.label === 'Mashout')?.startedAt).toBeUndefined();
  });

  it('vider une dose pour la retaper ne remplace pas la dose confirmée par zéro', () => {
    const v = mount();
    fireEvent.click(screen.getByLabelText('Ajouté : Chlorure de calcium'));
    editDose(/Modifier la quantité de Chlorure de calcium/);
    const input = screen.getByLabelText(/Quantité réelle de Chlorure de calcium/);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.blur(input);
    expect(v.latest().additions?.['salt-mash-cacl2']).toMatchObject({
      amount: 2,
      doneAt: expect.any(Number)
    });
    fireEvent.change(input, { target: { value: '2,5' } });
    expect(v.latest().additions?.['salt-mash-cacl2'].amount).toBe(2.5);
  });

  it('sépare la préparation des eaux du concassage sans perdre les quantités', () => {
    const v = mount();
    expect(
      ingredients().getByRole('button', { name: 'Modifier la quantité de Eau d’empâtage au mash' })
    ).toHaveTextContent('20 L');
    editDose('Modifier la quantité de Eau d’empâtage au mash');
    expect(ingredients().queryByLabelText('Ajouté : Pale')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Quantité réelle de Eau d’empâtage au mash'), {
      target: { value: '21' }
    });
    chooseStep('Concassage');
    expect(ingredients().getByLabelText('Ajouté : Pale')).toBeInTheDocument();
    expect(ingredients().queryByLabelText(/Quantité réelle de Eau/)).not.toBeInTheDocument();
    expect(v.latest().additions?.['water-mash'].amount).toBe(21);
    phase('Recette');
    expect(
      ingredients().getByRole('button', { name: 'Modifier la quantité de Eau d’empâtage au mash' })
    ).toHaveTextContent('21 L');
    expect(ingredients().getByLabelText('Ajouté : Pale')).toBeInTheDocument();
  });

  it('terminer et continuer consigne seulement l’étape quittée et ne démarre aucun palier', () => {
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    expect(v.latest().steps[0].doneAt).toEqual(expect.any(Number));
    expect(v.latest().steps[1].doneAt).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Terminer et continuer' }));
    expect(v.latest().steps[2].id).toBe('mash-0');
    expect(v.latest().steps[2].startedAt).toBeUndefined();
    expect(screen.getByRole('button', { name: 'Démarrer' })).toBeEnabled();
    expect(v.latest().additions).toBeUndefined();
  });

  it('consulter le journal puis revenir garde le palier sélectionné et son horloge', () => {
    const v = mount();
    phase('Empâter');
    chooseStep('Mashout');
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    const before = v.latest();
    phase('Journal');
    expect(screen.queryByLabelText('Temps restant')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Revenir au brassage' }));
    expect(
      within(screen.getByRole('region', { name: 'Étape consultée' })).getByRole('heading', {
        name: 'Mashout'
      })
    ).toBeInTheDocument();
    expect(v.latest().steps).toEqual(before.steps);
    expect(v.latest().currentIndex).toBe(before.currentIndex);
    expect(screen.getByRole('button', { name: 'Mettre le minuteur en pause' })).toBeEnabled();
  });

  it('regroupe les ajouts simultanés et distingue l’ébullition, le premier moût et le whirlpool', () => {
    const r = recipe({
      hops: [
        { name: 'FWH', stage: 'firstWort', weightG: 12, alpha: 10 },
        { name: 'Citra', stage: 'boil', weightG: 20, alpha: 12, timeMin: 10 },
        { name: 'Galaxy', stage: 'boil', weightG: 30, alpha: 13, timeMin: 10 },
        {
          name: 'Mosaic',
          stage: 'whirlpool',
          weightG: 40,
          alpha: 12,
          timeMin: 20,
          tempC: 80
        }
      ]
    });
    mount(r, { boilStartedAt: Date.now() - 51 * 60000 });
    phase('Empâter');
    expect(ingredients().queryByLabelText('Ajouté : FWH')).not.toBeInTheDocument();
    const fwhStep = brewState(r).steps.find((s) => s.id === 'fwh')!;
    chooseStep(fwhStep.label);
    expect(ingredients().getByLabelText('Ajouté : FWH')).toBeInTheDocument();
    phase('Ébullition');
    const group = screen
      .getByRole('heading', { name: '10 min avant la fin' })
      .closest('.brew-ingredient-group')!;
    expect(within(group).getAllByRole('checkbox')).toHaveLength(2);
    expect(group).toHaveTextContent('Maintenant');
    fireEvent.click(screen.getByLabelText('Ajouté : Citra'));
    expect(group).toHaveTextContent('Maintenant');
    fireEvent.click(screen.getByLabelText('Ajouté : Galaxy'));
    expect(group).not.toHaveTextContent('Maintenant');
    expect(ingredients().queryByLabelText('Ajouté : Mosaic')).not.toBeInTheDocument();
    const whirlpool = brewState(r).steps.find((s) => s.id === 'whirlpool')!;
    chooseStep(whirlpool.label);
    expect(ingredients().getByLabelText('Ajouté : Mosaic')).toBeInTheDocument();
    expect(ingredients().queryByLabelText('Ajouté : Citra')).not.toBeInTheDocument();
  });

  it('la levure apparaît à l’ensemencement et le refroidissement demande une mesure', () => {
    mount();
    phase('Refroidir');
    expect(ingredients().queryByLabelText('Ajouté : US-05')).not.toBeInTheDocument();
    chooseStep('Ensemencement');
    expect(ingredients().getByLabelText('Ajouté : US-05')).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Bilan du brassage' })).toHaveTextContent(
      'Relève les valeurs manquantes'
    );
  });

  it('le journal réunit ajouts réels, mesures, notes et étapes, avec des filtres sans mutation', () => {
    const r = recipe();
    const initial = brewState(r);
    initial.steps[0].doneAt = 4000;
    const v = mount(r, {
      ...initial,
      additions: { 'salt-mash-cacl2': { amount: 3, doneAt: 3000 } },
      readings: [
        {
          id: 'r',
          at: 2000,
          stepId: 'mash-0',
          kind: 'ph',
          value: 5.4,
          unit: '',
          roomTemp: true
        }
      ],
      notes: [{ id: 'n', at: 1000, text: 'Pompe réglée', stepId: 'eau' }]
    });
    phase('Journal');
    const journal = within(screen.getByRole('region', { name: 'Journal modifiable' }));
    expect(journal.getAllByRole('article')).toHaveLength(4);
    expect(journal.getAllByRole('article')[0]).toHaveTextContent('Étape terminée');
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Filtrer le journal' })).getByRole('button', {
        name: /Ajouts/
      })
    );
    expect(journal.getAllByRole('article')).toHaveLength(1);
    expect(journal.getByRole('article')).toHaveTextContent('Chlorure de calcium');
    expect(journal.getByRole('article')).toHaveTextContent('prévu 2 g');
    expect(v.save).not.toHaveBeenCalled();
  });

  it('garde les reprises de connexion accessibles sans laisser consigner dans un onglet en lecture seule', () => {
    const state = brewState(),
      retry = vi.fn();
    vi.spyOn(sessionModule, 'useBrewSession').mockReturnValue({
      state,
      latest: { current: state },
      update: vi.fn(),
      status: 'Ouvert dans un autre onglet',
      error: 'Ferme l’autre onglet pour reprendre ici.',
      retry,
      reload: vi.fn(),
      flush: vi.fn(),
      canStart: false,
      pending: false,
      live: true
    });
    mount();
    expect(screen.getByRole('group', { name: 'Conduite du brassage' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Relever une mesure' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Ajouter une note' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Recharger le serveur' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Recette', exact: true })).toBeEnabled();
  });

  it('repart des dates absolues et des doses enregistrées après remontage de la page', () => {
    const r = recipe();
    const initial = brewState(r);
    initial.currentIndex = initial.steps.findIndex((s) => s.id === 'mash-0');
    initial.steps[initial.currentIndex].startedAt = Date.now() - 10 * 60000;
    const v = mount(r, initial);
    fireEvent.click(screen.getByLabelText('Ajouté : Pale'));
    const saved = v.latest();
    v.unmount();
    mount(r, JSON.parse(JSON.stringify(saved)));
    expect(screen.getByLabelText('Ajouté : Pale')).toBeChecked();
    expect(screen.getByLabelText('Temps restant').textContent).toMatch(/^(49:5\d|50:00)$/);
    expect(screen.getByRole('button', { name: 'Mettre le minuteur en pause' })).toBeEnabled();
  });
});
