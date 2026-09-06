import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within, act, waitFor } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { BrewAlarmSettings } from '../../src/ui/BrewAlarmSettings';
import { enableBrewAlerts, syncBrewAlerts } from '../../src/services/brewAlarms';
import { defaultConfig } from '../../src/services/storage';
import { Batch, BrewDayState, StockItem } from '../../src/types';
import { recipe, brewState, malt } from '../fixtures/brewCompanion';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/brewAlarms', () => ({
  enableBrewAlerts: vi.fn(),
  syncBrewAlerts: vi.fn()
}));
vi.mock('../../src/services/brewTimer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  localStorage.clear();
});
function mount(over: Partial<BrewDayState> = {}, stock: StockItem[] = []) {
  const r = recipe();
  const save = vi.fn();
  const s = brewState(r, over);
  const batch = { id: 'LOT-TEST', name: r.name, recipeSnapshot: r, brewDay: s } as Batch;
  const view = render(
    <BrewDayPage
      batch={batch}
      config={defaultConfig}
      stockItems={stock}
      onClose={() => {}}
      onFinish={() => {}}
      onSave={save}
    />
  );
  return { ...view, latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState, save };
}
const phase = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Phases du brassage' })).getByRole('button', {
      name,
      exact: true
    })
  );
describe('Gestes à la cuve', () => {
  it('préparation sans minuteur, navigation libre sans validation ni départ implicite', () => {
    const v = mount();
    expect(screen.queryByLabelText('Temps restant')).not.toBeInTheDocument();
    phase('Empâter');
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer' }));
    const at = v.latest().steps.find((x) => x.id === 'mash-0')!.startedAt;
    phase('Préparer');
    fireEvent.click(screen.getByLabelText('Vérifier la balance et peser les ajouts'));
    expect(v.latest().preparations?.balance).toBe(true);
    expect(v.latest().steps.find((x) => x.id === 'mash-0')!.startedAt).toBe(at);
    expect(v.latest().steps.every((x) => x.doneAt == null)).toBe(true);
    phase('Ébullition');
    expect(screen.getByRole('button', { name: 'Ébullition atteinte' })).toBeEnabled();
    expect(v.latest().boilStartedAt).toBeUndefined();
    expect(screen.getByLabelText('Minuteurs actifs')).toHaveTextContent('Saccharification');
  });
  it('la quantité réellement versée est persistée, corrigible, avec impact immédiat', () => {
    const v = mount();
    const dose = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/);
    fireEvent.change(dose, { target: { value: '15' } });
    expect(
      screen.getByRole('complementary', { name: 'Impact des quantités réelles' })
    ).toHaveTextContent('Magnésium');
    fireEvent.click(screen.getByLabelText('Ajouté : Sel d’Epsom'));
    expect(v.latest().additions!['salt-mash-epsom']).toMatchObject({
      amount: 15,
      doneAt: expect.any(Number)
    });
    expect(screen.getByText(/Dilution théorique/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Diminuer Sel d’Epsom' }));
    expect(v.latest().additions!['salt-mash-epsom'].amount).toBe(14.9);
    fireEvent.click(screen.getByLabelText('Ajouté : Sel d’Epsom'));
    expect(v.latest().additions!['salt-mash-epsom'].doneAt).toBeUndefined();
    expect(screen.queryByText(/Dilution théorique/)).not.toBeInTheDocument();
  });
  it('modifier les acides sans clavier et consigner un sel initialement absent', () => {
    const v = mount();
    fireEvent.click(screen.getAllByRole('button', { name: /Augmenter Acide lactique/ })[0]);
    expect(v.latest().additions!['acid-mash'].amount).toBe(1.1);
    fireEvent.change(screen.getByLabelText('Autre sel ou acide à consigner'), {
      target: { value: 'salt-mash-kcl' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Augmenter Chlorure de potassium' }));
    expect(v.latest().additions!['salt-mash-kcl'].amount).toBe(0.1);
  });
  it('substitution en stock sans écraser la recette ni hériter d’un potentiel inconnu', () => {
    const v = mount({}, [malt('Pale', 1), malt('Pils', 10, 4)]);
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer ce malt' }));
    fireEvent.click(screen.getByRole('button', { name: /Pils · 5 kg/ }));
    expect(v.latest().additions!['grain-0'].replacement).toEqual({ name: 'Pils', colorEbc: 4 });
    expect(screen.getByLabelText('Ajouté : Pils')).toBeInTheDocument();
    phase('Recette');
    expect(screen.getByLabelText('Quantité réelle de Pils')).toHaveValue('5');
  });
  it('le journal corrige, supprime et restaure sans perte des autres infos', () => {
    const v = mount({
      readings: [
        { id: 'r', at: 1000, stepId: 'mash-0', kind: 'temperature', value: 67, unit: '°C' }
      ],
      notes: [{ id: 'n', at: 2000, stepId: 'eau', text: 'Pompe coupée' }]
    });
    phase('Journal');
    let row = screen.getByText('Température', { exact: true }).closest('article')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Modifier' }));
    fireEvent.change(screen.getByLabelText('Corriger Température'), { target: { value: '-5' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(v.latest().readings![0]).toMatchObject({ at: 1000, value: -5 });
    row = screen.getByText('Température', { exact: true }).closest('article')!;
    fireEvent.click(within(row).getByRole('button', { name: 'Supprimer' }));
    expect(v.latest().readings).toEqual([]);
    expect(v.latest().notes).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler la suppression' }));
    expect(v.latest().readings![0].value).toBe(-5);
    const note = screen.getByText('Note', { exact: true }).closest('article')!;
    fireEvent.click(within(note).getByRole('button', { name: 'Modifier' }));
    fireEvent.change(screen.getByLabelText('Corriger Note'), {
      target: { value: 'Pompe rétablie\nFiltre rincé' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(v.latest().notes![0].text).toContain('\n');
  });
  it('volume et densité à froid produisent un rendement, persisté après navigation', () => {
    const v = mount();
    phase('Empâter');
    fireEvent.click(screen.getByRole('button', { name: 'Contrôle avant ébullition' }));
    const region = within(screen.getByRole('region', { name: 'Mesures de cette étape' }));
    fireEvent.change(screen.getByLabelText('Densité (SG)'), { target: { value: '1040' } });
    fireEvent.click(screen.getByLabelText('Densité refroidie ou corrigée à l’étalonnage'));
    fireEvent.click(region.getByRole('button', { name: 'Noter' }));
    fireEvent.click(region.getByRole('button', { name: 'Volume', exact: true }));
    expect(screen.getByLabelText('Volume ramené à 20 °C')).not.toBeChecked();
    fireEvent.change(screen.getByLabelText('Volume (L)'), { target: { value: '25' } });
    fireEvent.click(screen.getByLabelText('Volume ramené à 20 °C'));
    fireEvent.click(region.getByRole('button', { name: 'Noter' }));
    expect(screen.getByLabelText('Rendement mesuré')).toHaveTextContent('66.6 %');
    expect(v.latest().readings!.every((r) => r.roomTemp)).toBe(true);
  });
  it('fuzz de quantité : les saisies hostiles ne cassent ni l’écran ni les doses des autres lignes', () => {
    const v = mount();
    const input = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/);
    for (const raw of [
      '',
      '-',
      ',',
      'NaN',
      'Infinity',
      '1e99',
      '-10',
      '999999999999',
      '5g',
      '<img>',
      '2,5'
    ]) {
      fireEvent.change(input, { target: { value: raw } });
      fireEvent.blur(input);
      expect(screen.getByRole('region', { name: 'Ingrédients à ajouter' }).textContent).not.toMatch(
        /NaN|Infinity|undefined/
      );
      expect(screen.getByLabelText(/Quantité réelle de Chlorure de calcium/)).toHaveValue('2');
      const n = v.latest()?.additions?.['salt-mash-epsom']?.amount;
      if (n != null) expect(Number.isFinite(n) && n >= 0 && n <= 100000).toBe(true);
    }
  });
});
describe('Alertes à distance : confirmation réelle et annulation', () => {
  it('fermer la fiche avant le debounce envoie quand même le dernier horaire', async () => {
    localStorage.setItem('brew-push-LOT', 'true');
    vi.mocked(syncBrewAlerts).mockResolvedValue(undefined);
    const a = { id: 'hop', at: Date.now() + 600000, title: 'Citra', body: '20 g', stepId: 'hop-0' };
    const v = render(<BrewAlarmSettings batchId="LOT" alarms={[a]} />);
    v.unmount();
    await waitFor(() => expect(syncBrewAlerts).toHaveBeenCalledWith('LOT', [a]));
  });
  it('ne prétend pas être synchronisé avant la réponse du serveur ; reprogramme après modification', async () => {
    vi.mocked(enableBrewAlerts).mockResolvedValue(undefined);
    let resolve!: () => void;
    vi.mocked(syncBrewAlerts)
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          })
      )
      .mockResolvedValue(undefined);
    const a = { id: 'hop', at: Date.now() + 600000, title: 'Citra', body: '20 g', stepId: 'hop-0' };
    const v = render(<BrewAlarmSettings batchId="LOT" alarms={[a]} />);
    fireEvent.click(screen.getByText(/Alertes Android/));
    fireEvent.click(screen.getByRole('button', { name: 'Activer sur cet appareil' }));
    await waitFor(() => expect(syncBrewAlerts).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Synchronisées')).not.toBeInTheDocument();
    await act(async () => resolve());
    expect(screen.getByText(/Synchronisées/)).toBeInTheDocument();
    v.rerender(<BrewAlarmSettings batchId="LOT" alarms={[{ ...a, at: a.at + 300000 }]} />);
    await waitFor(() => expect(syncBrewAlerts).toHaveBeenCalledTimes(2));
    expect(vi.mocked(syncBrewAlerts).mock.calls[1][1][0].at).toBe(a.at + 300000);
  });
  it('annuler attend l’envoi courant, interdit les resynchronisations concurrentes puis efface la file', async () => {
    localStorage.setItem('brew-push-LOT', 'true');
    let resolve!: () => void;
    vi.mocked(syncBrewAlerts)
      .mockImplementationOnce(
        () =>
          new Promise((r) => {
            resolve = r;
          })
      )
      .mockResolvedValue(undefined);
    const a = { id: 'hop', at: Date.now() + 600000, title: 'Citra', body: '20 g', stepId: 'hop-0' };
    const v = render(<BrewAlarmSettings batchId="LOT" alarms={[a]} />);
    fireEvent.click(screen.getByText(/Alertes Android/));
    await waitFor(() => expect(syncBrewAlerts).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Désactiver sur cet appareil' }));
    v.rerender(<BrewAlarmSettings batchId="LOT" alarms={[{ ...a, at: a.at + 60000 }]} />);
    window.dispatchEvent(new Event('online'));
    await act(async () => resolve());
    await waitFor(() => expect(screen.getByText(/Inactives/)).toBeInTheDocument());
    expect(vi.mocked(syncBrewAlerts).mock.calls.at(-1)![1]).toEqual([]);
    expect(syncBrewAlerts).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem('brew-push-LOT')).toBeNull();
  });
  it('un refus de permission ne programme rien et ne bloque pas l’interface', async () => {
    vi.mocked(enableBrewAlerts).mockRejectedValueOnce(new Error('Notifications refusées'));
    render(<BrewAlarmSettings batchId="LOT" alarms={[]} />);
    fireEvent.click(screen.getByText(/Alertes Android/));
    fireEvent.click(screen.getByRole('button', { name: 'Activer sur cet appareil' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Notifications refusées')
    );
    expect(syncBrewAlerts).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Activer sur cet appareil' })).toBeEnabled();
  });
});
