import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Recipe } from '../../src/types';

// Only the network/persistence boundary is replaced. The real guide, catalogues,
// matching, documentary ranking, source validation and import path stay in use.
const memory = vi.hoisted(() => ({
  docs: new Map<string, any>(), listeners: new Set<() => void>(),
  writes: vi.fn(), attempts: vi.fn(), failure: null as Error | null, delay: null as Promise<void> | null,
}));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/'))
    .map(([key, value]) => ({ ...structuredClone(value), __docId: key.split('/')[1] })),
  isReady: () => true,
  subscribe: (callback: () => void) => { memory.listeners.add(callback); return () => memory.listeners.delete(callback); },
  put: (name: string, id: string, value: any) => {
    if (memory.failure) throw memory.failure;
    memory.writes(name, id, value); memory.docs.set(`${name}/${id}`, structuredClone(value));
    memory.listeners.forEach(callback => callback());
  },
  bulkWrite: async (entries: any[]) => {
    memory.attempts(entries);
    if (memory.delay) await memory.delay;
    if (memory.failure) throw memory.failure;
    for (const { name, id, data } of entries) {
      memory.writes(name, id, data); memory.docs.set(`${name}/${id}`, structuredClone(data));
    }
    memory.listeners.forEach(callback => callback());
  },
} }));
import { StorageService } from '../../src/services/storage';
import { HopRecipeGuide } from '../../src/ui/hopIndex/HopRecipeGuide';

const recipe = (patch: Partial<Recipe> = {}): Recipe => ({
  id: 'guide-test', name: 'Recette témoin', style: 'IPA', volumeL: 20,
  ogTarget: 1.055, fgTarget: 1.01, abvTarget: 5.9, totalGristKg: 5,
  fermentables: [], hops: [], steps: [], notes: [],
  yeast: { name: 'LalBrew Verdant IPA', form: 'sèche', qty: 1, unit: 'sachet' },
  ...patch,
});
function mount(initial: Recipe, chooseYeast = false, onBusyChange?: (busy: boolean) => void) {
  let current = initial;
  const changes = vi.fn();
  function Host() {
    const [value, setValue] = useState(initial);
    current = value;
    return <HopRecipeGuide recipe={value} onChange={next => {
      changes(next); setValue(next as Recipe);
    }} onChooseYeast={chooseYeast ? () => setValue(previous => ({
      ...previous, yeast: { ...previous.yeast, name: 'LalBrew Verdant IPA' },
    })) : undefined} onBusyChange={onBusyChange} />;
  }
  render(<Host />);
  return { read: () => current, changes };
}
async function loadedReference(index: number) {
  const select = screen.getByRole('combobox', { name: `Référence documentaire de l’ajout ${index}` });
  await waitFor(() => expect(select).toBeEnabled());
  return select;
}
async function showLeads() {
  const button = await screen.findByRole('button', { name: 'Trouver des houblons pour ce profil' });
  await waitFor(() => expect(button).toBeEnabled());
  fireEvent.click(button);
  const article = (await screen.findAllByRole('article'))[0];
  const name = within(article).getByRole('heading', { level: 4 }).textContent!;
  return { article, name, add: within(article).getByRole('button', { name: `Ajouter ${name} à la recette` }) };
}

beforeEach(() => {
  memory.docs.clear(); memory.listeners.clear(); memory.writes.mockClear(); memory.attempts.mockClear(); memory.failure = null; memory.delay = null;
});
afterEach(cleanup);

describe('Guide aromatique dans la recette', () => {
  it('propose un objectif sur une base vide et conserve distinctement présence moyenne et forte', async () => {
    const host = mount(recipe());
    expect(screen.getByRole('region', { name: 'Guide aromatique de la recette' })).toBeInTheDocument();
    const citrus = screen.getByRole('button', { name: 'Agrumes', exact: true });
    expect(citrus).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Fruits tropicaux', exact: true })).toBeEnabled();
    expect(memory.writes).not.toHaveBeenCalled();
    expect(host.changes).not.toHaveBeenCalled();

    fireEvent.click(citrus);
    await waitFor(() => expect(host.read().hopAromaTarget).toEqual({ citrus: { min: 33, max: 66 } }));
    const group = screen.getByRole('group', { name: 'Présence souhaitée : Agrumes' });
    expect(within(group).getByRole('button', { name: 'Moyenne' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(group).getByRole('button', { name: 'Forte' }));
    await waitFor(() => expect(host.read().hopAromaTarget).toEqual({ citrus: { min: 66, max: 100 } }));
    expect(within(group).getByRole('button', { name: 'Forte' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(group).getByRole('button', { name: 'Moyenne' }));
    await waitFor(() => expect(host.read().hopAromaTarget).toEqual({ citrus: { min: 33, max: 66 } }));
    expect(StorageService.getHopKnowledge().map(row => row.id)).toEqual(['citrus']);
    expect(memory.writes).toHaveBeenCalledTimes(1);
    expect(StorageService.getHopVarieties()).toEqual([]);
    expect(StorageService.getHopPredictions()).toEqual([]);
    fireEvent.click(citrus);
    await waitFor(() => expect(host.read().hopAromaTarget).toEqual({}));
    expect(citrus).toHaveAttribute('aria-pressed', 'false');
  });

  it('associe Cascade et Idaho 7 sans changer les noms, doses ou alpha inconnus', async () => {
    const initial = recipe({ hops: [
      { name: 'Houblon Cascade 5.5%', weightG: 15, alpha: 6.2, stage: 'boil', timeMin: 60 },
      { name: 'Houblon Idaho 7 12.7%', weightG: 75, alpha: 0, stage: 'dryHop', dayOffset: 3 },
    ] });
    const before = structuredClone(initial);
    const host = mount(initial);
    const cascade = await loadedReference(1);
    const idaho = await loadedReference(2);
    expect(cascade).toHaveValue(''); expect(idaho).toHaveValue('');
    expect(host.changes).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.change(cascade, { target: { value: 'hopsteiner-cas' } });
    await waitFor(() => expect(host.read().hops[0].hopVarietyId).toBe('hopsteiner-cas'));
    fireEvent.change(idaho, { target: { value: 'ych-idaho7' } });
    await waitFor(() => expect(host.read().hops[1].hopVarietyId).toBe('ych-idaho7'));
    expect(host.read().hops.map(({ hopVarietyId, hopLotId, ...hop }) => hop)).toEqual(before.hops);
    expect(host.read().hops[1].alpha).toBe(0);
    expect(host.read().yeast).toEqual(before.yeast);
    expect(initial).toEqual(before);
    expect(StorageService.getHopVarieties().map(row => row.id).sort()).toEqual(['hopsteiner-cas', 'ych-idaho7']);
    expect(StorageService.getHopLots()).toEqual([]);
    expect(StorageService.getHopKnowledge()).toEqual([]);
  });

  it('garde J+3 indépendant de la phase de fermentation choisie explicitement', async () => {
    const initial = recipe({ hops: [{ name: 'Houblon Idaho 7 12.7%', weightG: 75, alpha: 0, stage: 'dryHop', dayOffset: 3 }] });
    const host = mount(initial);
    await loadedReference(1);
    const phase = screen.getByRole('combobox', { name: 'Phase du houblonnage à cru 1' });
    expect(phase).toHaveValue(''); expect(host.read().hops[0].aromaTiming).toBeUndefined();
    expect(screen.getByText('J+3 indique un jour, pas l’état de la fermentation.')).toBeInTheDocument();
    fireEvent.change(phase, { target: { value: 'postFermentation' } });
    expect(host.read().hops[0]).toEqual({ ...initial.hops[0], aromaTiming: 'postFermentation' });
    expect(host.read().hops[0].dayOffset).toBe(3);
    fireEvent.change(phase, { target: { value: '' } });
    expect(host.read().hops[0].aromaTiming).toBeUndefined();
    expect(host.read().hops[0].dayOffset).toBe(3);
    expect(memory.writes).not.toHaveBeenCalled();
  });

  it('ajoute une piste avec levure et moment explicites, sans inventer une dose ni des conditions', async () => {
    const initial = recipe({ hopAromaTarget: { citrus: { min: 66, max: 100 } }, yeast: { name: '', form: 'sèche', qty: 1, unit: 'sachet' } });
    const host = mount(initial, true);
    const lead = await showLeads();
    expect(screen.getByText(/sans estimer leur intensité dans ta bière/)).toBeInTheDocument();
    expect(lead.add).toBeDisabled();
    fireEvent.click(lead.add);
    expect(host.read().hops).toEqual([]); expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Moment envisagé pour une nouvelle piste' }), { target: { value: 'fermentation' } });
    expect(lead.add).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Choisir la levure' }));
    expect(lead.add).toBeEnabled();
    expect(within(lead.article).getByText('Avec LalBrew Verdant IPA · Pendant la fermentation')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('combobox', { name: 'Moment envisagé pour une nouvelle piste' }), { target: { value: '' } });
    expect(lead.add).toBeDisabled();
    fireEvent.change(screen.getByRole('combobox', { name: 'Moment envisagé pour une nouvelle piste' }), { target: { value: 'fermentation' } });
    expect(lead.add).toBeEnabled();
    fireEvent.click(within(lead.article).getByText('Lire la description et sa source'));
    expect(within(lead.article).getAllByRole('link', { name: 'Source' }).length).toBeGreaterThan(0);
    fireEvent.click(lead.add);
    await waitFor(() => expect(host.read().hops).toHaveLength(1));
    const added = host.read().hops[0];
    expect(added).toEqual({ name: lead.name, weightG: 0, alpha: 0, stage: 'dryHop', hopVarietyId: expect.any(String), aromaTiming: 'fermentation' });
    expect(added.dayOffset).toBeUndefined(); expect(added.aromaContactHours).toBeUndefined(); expect(added.aromaTemperatureC).toBeUndefined();
    expect(host.read().yeast.name).toBe('LalBrew Verdant IPA');
    expect(StorageService.getHopVarieties().map(row => row.id)).toEqual([added.hopVarietyId]);
    expect(StorageService.getHopPredictions()).toEqual([]);
    expect(screen.getByRole('status')).toHaveTextContent('renseigne sa quantité');
  });

  it('relie une souche seulement après confirmation et conserve ses paramètres de recette', async () => {
    const initial = recipe({ yeast: { name: 'LalBrew Verdant IPA', form: 'sèche', qty: 2, unit: 'sachet', fermTempMinC: 18, fermTempMaxC: 21 } });
    const host = mount(initial);
    expect(host.read().yeast.hopIndexId).toBeUndefined(); expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Relier LalBrew Verdant IPA' }));
    await waitFor(() => expect(host.read().yeast.hopIndexId).toBe('lalbrew-verdant-ipa'));
    expect(host.read().yeast).toEqual({ ...initial.yeast, hopIndexId: 'lalbrew-verdant-ipa' });
    expect(screen.getByText('Référence associée : LalBrew Verdant IPA')).toBeInTheDocument();
    expect(StorageService.getHopKnowledge().map(row => row.id)).toEqual(['lalbrew-verdant-ipa']);
  });

  it('propose US-05 par une variante explicite sans enregistrer les alias ni inventer une capacité enzymatique', async () => {
    const initial = recipe({ yeast: { name: 'Fermentis Levure SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet', fermTempMinC: 18 } });
    const host = mount(initial);
    expect(host.read().yeast.hopIndexId).toBeUndefined(); expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Relier SafAle US-05 (Fermentis)' }));
    await waitFor(() => expect(host.read().yeast.hopIndexId).toBe('fermentis-us05'));
    expect(host.read().yeast).toEqual({ ...initial.yeast, hopIndexId: 'fermentis-us05' });
    const saved = StorageService.getHopKnowledge();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ id: 'fermentis-us05', kind: 'yeast', betaLyase: 'unknown' });
    expect(saved[0]).not.toHaveProperty('aliases');
  });

  it('ignore un modèle incomplet et permet de retirer un ancien protocole devenu indisponible', async () => {
    const malformed = { id: 'broken-model', kind: 'model', name: 'Modèle sans scope' };
    memory.docs.set('hopKnowledge/broken-model', malformed);
    const initial = recipe({ hopMatrixId: 'ancien-protocole' });
    const host = mount(initial);
    expect(screen.getByRole('region', { name: 'Guide aromatique de la recette' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Étalonnage expérimental disponible'));
    const protocol = screen.getByRole('combobox', { name: 'Protocole de référence' });
    expect(protocol).toHaveValue('ancien-protocole');
    expect(within(protocol).getByRole('option', { selected: true })).toHaveTextContent('Protocole enregistré · référence indisponible');
    expect(within(protocol).queryByRole('option', { name: 'Modèle sans scope' })).not.toBeInTheDocument();
    expect(host.changes).not.toHaveBeenCalled();
    fireEvent.change(protocol, { target: { value: '' } });
    expect(host.read()).toEqual({ ...initial, hopMatrixId: undefined });
    expect(screen.queryByRole('combobox', { name: 'Protocole de référence' })).not.toBeInTheDocument();
    expect(memory.docs.get('hopKnowledge/broken-model')).toEqual(malformed);
    expect(memory.writes).not.toHaveBeenCalled();
  });

  it.each(['documentaire', 'disparu'] as const)('conserve un lot déjà associé visible et retirable : %s', async situation => {
    if (situation === 'documentaire') memory.docs.set('hopLots/ancien-lot', {
      id: 'ancien-lot', varietyId: 'hopsteiner-cas', name: 'Échantillon publié',
      form: 'cone', referenceOnly: true, analysis: [],
    });
    const initial = recipe({ hops: [{ name: 'Cascade', weightG: 25, alpha: 0, stage: 'dryHop', dayOffset: 3,
      hopVarietyId: 'hopsteiner-cas', hopLotId: 'ancien-lot' }] });
    const host = mount(initial);
    await loadedReference(1);
    const lot = screen.getByRole('combobox', { name: 'Lot de l’ajout 1' });
    expect(lot).toHaveValue('ancien-lot');
    expect(within(lot).getByRole('option', { selected: true })).toHaveTextContent(situation === 'documentaire'
      ? 'Échantillon publié · référence documentaire' : 'Lot enregistré indisponible');
    expect(host.read()).toEqual(initial); expect(host.changes).not.toHaveBeenCalled();
    fireEvent.change(lot, { target: { value: '' } });
    expect(host.read().hops[0]).toEqual({ ...initial.hops[0], hopLotId: undefined });
    expect(host.read().hops[0].hopVarietyId).toBe('hopsteiner-cas');
    expect(memory.writes).not.toHaveBeenCalled();
    if (situation === 'documentaire') expect(memory.docs.get('hopLots/ancien-lot').referenceOnly).toBe(true);
  });

  it('permet de corriger manuellement puis dissocier une référence de levure en conservant la recette', async () => {
    const initial = recipe({ yeast: { name: 'Nom personnel de la levure', form: 'sèche', qty: 3, unit: 'sachet',
      fermTempMinC: 18, fermTempMaxC: 20, hopIndexId: 'ancienne-souche' } });
    const host = mount(initial);
    fireEvent.click(screen.getByText('Choisir ou corriger la référence de levure'));
    const yeast = screen.getByRole('combobox', { name: 'Référence de la levure' });
    expect(yeast).toHaveValue('ancienne-souche');
    expect(within(yeast).getByRole('option', { selected: true })).toHaveTextContent('Référence enregistrée indisponible');
    expect(host.changes).not.toHaveBeenCalled();
    fireEvent.change(yeast, { target: { value: 'fermentis-us05' } });
    await waitFor(() => expect(host.read().yeast.hopIndexId).toBe('fermentis-us05'));
    expect(host.read().yeast).toEqual({ ...initial.yeast, hopIndexId: 'fermentis-us05' });
    expect(screen.getByText('Référence associée : SafAle US-05 (Fermentis)')).toBeInTheDocument();
    fireEvent.change(yeast, { target: { value: '' } });
    await waitFor(() => expect(host.read().yeast.hopIndexId).toBeUndefined());
    expect(yeast).toHaveValue('');
    expect(host.read().yeast).toEqual({ ...initial.yeast, hopIndexId: undefined });
    expect(StorageService.getHopKnowledge().map(row => row.id)).toEqual(['fermentis-us05']);
    expect(memory.writes).toHaveBeenCalledTimes(1);
  });

  it.each([false, true])('signale un import différé au parent et libère son état occupé, échec=%s', async fails => {
    const initial = recipe();
    const onBusyChange = vi.fn();
    const host = mount(initial, false, onBusyChange);
    let release!: () => void;
    memory.delay = new Promise<void>(resolve => { release = resolve; });
    if (fails) memory.failure = new Error('Import différé refusé.');
    fireEvent.click(screen.getByRole('button', { name: 'Agrumes', exact: true }));
    try {
      await waitFor(() => expect(memory.attempts).toHaveBeenCalledTimes(1));
      expect(onBusyChange).toHaveBeenLastCalledWith(true);
      expect(screen.getByRole('status')).toHaveTextContent('Enregistrement des références');
      expect(screen.getByRole('button', { name: 'Agrumes', exact: true })).toBeDisabled();
      expect(host.changes).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
    } finally {
      await act(async () => { release(); });
    }
    await waitFor(() => expect(onBusyChange).toHaveBeenLastCalledWith(false));
    expect(onBusyChange.mock.calls.map(([busy]) => busy)).toEqual([true, false]);
    expect(screen.getByRole('button', { name: 'Agrumes', exact: true })).toBeEnabled();
    if (fails) {
      expect(screen.getByRole('alert')).toHaveTextContent('Import différé refusé.');
      expect(host.read()).toEqual(initial); expect(memory.writes).not.toHaveBeenCalled();
    } else {
      expect(host.read().hopAromaTarget).toEqual({ citrus: { min: 33, max: 66 } });
      expect(memory.writes).toHaveBeenCalledTimes(1);
    }
  });

  it('installe les vigilances uniquement après action explicite, sans ajouter un modèle ou changer la recette', async () => {
    const initial = recipe();
    const host = mount(initial);
    expect(screen.getByText(/L’absence d’alerte ne signifie pas l’absence de risque/)).toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter les vigilances documentées manquantes' }));
    await waitFor(() => expect(StorageService.getHopKnowledge()).toHaveLength(3));
    expect(StorageService.getHopKnowledge().every(row => row.kind === 'risk')).toBe(true);
    expect(screen.getByRole('status')).toHaveTextContent('Références de vigilance ajoutées');
    expect(host.read()).toEqual(initial); expect(host.changes).not.toHaveBeenCalled();
    expect(StorageService.getHopVarieties()).toEqual([]); expect(StorageService.getHopPredictions()).toEqual([]);
  });

  it.each(['objectif', 'association', 'piste'] as const)('un échec d’import laisse la recette intacte : %s', async action => {
    const initial = recipe({
      ...(action === 'piste' ? { hopAromaTarget: { citrus: { min: 33, max: 66 } } } : {}),
      hops: action === 'association' ? [{ name: 'Houblon Idaho 7 12.7%', weightG: 75, alpha: 0, stage: 'dryHop', dayOffset: 3 }] : [],
    });
    const before = structuredClone(initial);
    const host = mount(initial);
    memory.failure = new Error('Import indisponible pour ce test.');
    if (action === 'objectif') fireEvent.click(screen.getByRole('button', { name: 'Agrumes', exact: true }));
    else if (action === 'association') fireEvent.change(await loadedReference(1), { target: { value: 'ych-idaho7' } });
    else {
      const lead = await showLeads();
      fireEvent.change(screen.getByRole('combobox', { name: 'Moment envisagé pour une nouvelle piste' }), { target: { value: 'whirlpool' } });
      fireEvent.click(lead.add);
    }
    expect(await screen.findByRole('alert')).toHaveTextContent('Import indisponible pour ce test.');
    expect(host.read()).toEqual(before); expect(initial).toEqual(before);
    expect(host.changes).not.toHaveBeenCalled();
    expect(memory.attempts).toHaveBeenCalledTimes(1);
    expect(memory.writes).not.toHaveBeenCalled(); expect(memory.docs.size).toBe(0);
  });
});
