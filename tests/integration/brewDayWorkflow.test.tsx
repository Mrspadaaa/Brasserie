import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within, act } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { AiClient } from '../../src/services/aiClient';
import { Batch, BrewDayState } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
function mount(over: Partial<BrewDayState> = {}) {
  const b = {
    id: 'LOT-test',
    name: 'Test',
    volumeBrewedL: 25,
    og: '1.050',
    recipeSnapshot: {
      name: 'Test',
      totalGristKg: 5,
      fermentables: [],
      hops: [],
      ogTarget: 1.056,
      volumeL: 25,
      waterPlan: {
        mashWaterL: 20,
        spargeWaterL: 10,
        mash: {},
        sparge: {},
        acid: { id: 'lactique', mash: 2, sparge: 1 }
      }
    },
    brewDay: {
      currentIndex: 0,
      steps: [
        { id: 'mash-0', label: 'Empâtage', durationMin: 60, tempC: 67 },
        { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }
      ],
      readings: [],
      ...over
    }
  } as unknown as Batch;
  const save = vi.fn();
  const finish = vi.fn();
  const view = render(
    <BrewDayPage
      batch={b}
      config={defaultConfig}
      onClose={() => {}}
      onSave={save}
      onFinish={finish}
    />
  );
  return {
    ...view,
    save,
    finish,
    b,
    latest: () => save.mock.calls.at(-1)?.[0]?.brewDay as BrewDayState
  };
}
const form = () => within(screen.getByRole('region', { name: 'Mesures de cette étape' }));
const enter = (v: string) =>
  fireEvent.change(screen.getByLabelText(/pH de maische/), {
    target: { value: v }
  });
const notePh = (v = '5,7') => {
  enter(v);
  fireEvent.click(screen.getByLabelText(/Échantillon refroidi/));
  fireEvent.click(form().getByRole('button', { name: 'Noter' }));
};

describe('Assistant pendant le brassage', () => {
  it('un seul appui suffit pour noter un constat et demander conseil', async () => {
    vi.mocked(AiClient.run).mockResolvedValue({
      ok: true,
      data: { verdict: 'Vérifie le débit de recirculation.' }
    });
    const v = mount();
    fireEvent.change(screen.getByLabelText('Carnet de cuve'), {
      target: { value: 'Le débit ralentit' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Conseil IA' }));
    await waitFor(() =>
      expect(screen.getByText('Vérifie le débit de recirculation.')).toBeInTheDocument()
    );
    expect(v.latest().notes![0].text).toBe('Le débit ralentit');
    expect(AiClient.run).toHaveBeenCalledTimes(1);
  });
  it('retour instantané, ajout au journal et dose réelle au doigt, sans clavier', () => {
    const v = mount();
    enter('5,7');
    expect(screen.getByText(/à confirmer à froid/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /J’ai ajouté/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Échantillon refroidi/));
    expect(screen.getByText(/Au-dessus de la fenêtre/)).toBeInTheDocument();
    fireEvent.click(form().getByRole('button', { name: 'Noter' }));
    expect(v.latest().readings![0]).toMatchObject({
      value: 5.7,
      stepId: 'mash-0',
      roomTemp: true
    });
    const before = Number(
      (screen.getByLabelText('Acide réellement ajouté en mL') as HTMLInputElement).value.replace(
        ',',
        '.'
      )
    );
    fireEvent.click(screen.getByRole('button', { name: 'Retirer 0,1 mL d’acide' }));
    expect(
      Number(
        (screen.getByLabelText('Acide réellement ajouté en mL') as HTMLInputElement).value.replace(
          ',',
          '.'
        )
      )
    ).toBeCloseTo(before - 0.1);
    fireEvent.click(screen.getByRole('button', { name: /J’ai ajouté/ }));
    expect(v.latest().acidCorrections).toHaveLength(1);
    expect(screen.getByText(/Ajout consigné/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /J’ai ajouté/ })).not.toBeInTheDocument();
  });
  it('corriger une faute de frappe ne transforme pas un ancien pH traité en nouvelle mesure', () => {
    const v = mount();
    notePh();
    fireEvent.click(screen.getByRole('button', { name: /J’ai ajouté/ }));
    const at = v.latest().readings![0].at;
    fireEvent.click(screen.getByRole('button', { name: 'Corriger le relevé' }));
    enter('5,8');
    fireEvent.click(form().getByRole('button', { name: 'Corriger' }));
    expect(v.latest().readings).toHaveLength(1);
    expect(v.latest().readings![0].at).toBe(at);
    expect(screen.getByText(/Ajout consigné/)).toBeInTheDocument();
  });
  it('pH ancien sans étape ou à chaud : aucune prescription', () => {
    mount({ readings: [{ at: 10, kind: 'ph', unit: '', value: 5.7 }] });
    expect(screen.queryByText(/Moitié de l’estimation/)).not.toBeInTheDocument();
    enter('5,7');
    fireEvent.click(form().getByRole('button', { name: 'Noter' }));
    expect(screen.getByText(/Refroidis l’échantillon/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /J’ai ajouté/ })).not.toBeInTheDocument();
  });
  it('garde le pH bas sans acide et bloque un pH anormalement haut', () => {
    mount();
    enter('5,1');
    fireEvent.click(screen.getByLabelText(/Échantillon refroidi/));
    expect(screen.getByText(/déjà acide/)).toBeInTheDocument();
    enter('9');
    expect(screen.getByText(/pH inhabituel/)).toBeInTheDocument();
    expect(screen.queryByText(/Moitié de l’estimation/)).not.toBeInTheDocument();
  });
  it('conserve la saisie et son focus pendant les ticks du minuteur', () => {
    vi.useFakeTimers();
    const v = mount();
    const input = screen.getByLabelText(/pH de maische/);
    input.focus();
    enter('5,');
    act(() => vi.advanceTimersByTime(3000));
    expect(input).toHaveFocus();
    expect(input).toHaveValue('5,');
    v.unmount();
    vi.useRealTimers();
  });
  it('monkey : aucun collage invalide ne peut être enregistré ni prescrire de l’acide', () => {
    mount();
    for (const s of [
      '',
      '0',
      '-5',
      'NaN',
      'Infinity',
      '5.7abc',
      '1e99',
      '999999999999',
      '1,2.3',
      '<svg>'
    ]) {
      enter(s);
      expect(form().getByRole('button', { name: 'Noter' })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /J’ai ajouté/ })).not.toBeInTheDocument();
    }
    enter('5,3');
    expect(form().getByRole('button', { name: 'Noter' })).toBeEnabled();
  });
  it('pause et reprise gardent le temps restant, le palier suivant ne démarre pas seul', () => {
    const date = vi.spyOn(Date, 'now').mockReturnValue(1000);
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    date.mockReturnValue(601000);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre le minuteur en pause' }));
    date.mockReturnValue(1801000);
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
    expect(v.latest().steps[0].startedAt).toBe(1201000);
    expect(v.latest().steps[0].pausedAt).toBeUndefined();
  });
  it('note autonome et conseil IA contextualisé ; réponse périmée jamais affichée', async () => {
    let resolve: (r: unknown) => void;
    vi.mocked(AiClient.run).mockImplementation(() => new Promise((r) => (resolve = r)) as never);
    const v = mount();
    fireEvent.change(screen.getByLabelText('Carnet de cuve'), {
      target: { value: 'Recirculation lente' }
    });
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Notes et conseil' })).getByRole('button', {
        name: 'Noter'
      })
    );
    expect(v.latest().notes![0].stepId).toBe('mash-0');
    fireEvent.click(screen.getByRole('button', { name: 'Conseil IA' }));
    expect(AiClient.run).toHaveBeenCalledWith(
      expect.objectContaining({
        tier: 'fast',
        context: expect.objectContaining({
          notes: expect.arrayContaining([expect.objectContaining({ text: 'Recirculation lente' })])
        })
      })
    );
    notePh('5,4');
    await act(async () => resolve!({ ok: true, data: { verdict: 'Conseil périmé' } }));
    expect(screen.queryByText('Conseil périmé')).not.toBeInTheDocument();
    expect(screen.getByText(/mesures ont changé/)).toBeInTheDocument();
  });
  it('erreur IA récupérable, puis conseil valide sans bloquer les mesures', async () => {
    vi.mocked(AiClient.run)
      .mockResolvedValueOnce({ ok: false, error: 'Hors ligne' })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          verdict: 'La température est cohérente.',
          immediateAction: 'Maintiens ce palier.'
        }
      });
    mount();
    notePh('5,4');
    fireEvent.click(screen.getByRole('button', { name: 'Conseil IA' }));
    await waitFor(() => expect(screen.getByText('Hors ligne')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Conseil IA' }));
    await waitFor(() => expect(screen.getByText('Maintiens ce palier.')).toBeInTheDocument());
    expect(screen.getByLabelText(/pH de maische/)).toBeEnabled();
  });
  it('clôture explicite : un relevé pré-ébullition ne remplace pas l’OG', () => {
    const v = mount({
      steps: [
        {
          id: 'ensemencement',
          label: 'Ensemencement',
          durationMin: 0,
          doneAt: 1
        }
      ],
      readings: [
        { at: 2, stepId: 'preboil', kind: 'densite', value: 1.035, unit: 'SG' },
        { at: 3, stepId: 'preboil', kind: 'volume', value: 35, unit: 'L' }
      ]
    });
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer le brassage' }));
    expect(v.finish).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer', exact: true }));
    expect(v.finish).toHaveBeenCalledWith(
      expect.objectContaining({
        og: '1.050',
        volumeBrewedL: 25,
        status: 'fermentation'
      })
    );
  });
});
