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
import { HopExtrapolationPanel } from '../../src/ui/hopIndex/HopExtrapolationPanel';
import { HopIngredientPicker } from '../../src/ui/hopIndex/HopIngredientPicker';

const recipe = (patch: Partial<Recipe> = {}): Recipe => ({
  id: 'guide-test', name: 'Recette témoin', style: 'IPA', volumeL: 20,
  ogTarget: 1.055, fgTarget: 1.01, abvTarget: 5.9, totalGristKg: 5,
  fermentables: [], hops: [], steps: [], notes: [],
  yeast: { name: 'LalBrew Verdant IPA', form: 'sèche', qty: 1, unit: 'sachet' },
  ...patch,
});
beforeEach(() => { memory.docs.clear(); memory.listeners.clear(); memory.writes.mockClear(); memory.attempts.mockClear(); memory.delay = null; memory.failure = null; });
afterEach(cleanup);
function mount(initial = recipe()) {
  let current = initial; const changes = vi.fn();
  function Host() { const [r, setR] = useState(initial); current = r; return <HopExtrapolationPanel recipe={r} onChange={next => { changes(next); setR(next as Recipe); }} target={{citrus:{min:66,max:100}}} />; }
  render(<Host />); return { current: () => current, changes };
}

describe('Atelier expérimental utilisé pendant la formulation', () => {
  it('simule sans écrire puis attend la persistance avant d’appliquer et conserve une prédiction rejouable', async () => {
    const host = mount();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Levure à simuler'), { target: { value: 'lalbrew-pomona' } });
    fireEvent.change(screen.getByLabelText('Dose (g/L)'), { target: { value: '3' } });
    fireEvent.blur(screen.getByLabelText('Dose (g/L)'));
    expect(host.changes).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
    let release!: () => void; memory.delay = new Promise<void>(resolve => { release = resolve; });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' }));
    await waitFor(() => expect(memory.attempts).toHaveBeenCalledOnce()); expect(host.current().hops).toHaveLength(0);
    await act(async () => { release(); await memory.delay; }); memory.delay = null;
    await waitFor(() => expect(host.current().hops).toHaveLength(1));
    expect(host.current().hops[0].weightG).toBe(60); expect(host.current().yeast.hopIndexId).toBe('lalbrew-pomona');
    fireEvent.click(screen.getByRole('button', { name: 'Conserver pour une dégustation' }));
    await waitFor(() => expect(StorageService.getHopPredictions()).toHaveLength(1));
    const snapshot = StorageService.getHopPredictions()[0];
    expect(snapshot.engineVersion).toBe('hop-experimental-v3'); expect(snapshot.prediction.profile.citrus.central).toBeDefined();
    expect(snapshot.evidence.knowledge.some(k => k.kind === 'extrapolation')).toBe(true);
  });
  it('conserve la recette après une erreur et permet de reprendre exactement le scénario', async () => {
    const host = mount(), before = structuredClone(host.current());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' })).toBeEnabled());
    memory.failure = Error('Import indisponible');
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Import indisponible'));
    expect(host.current()).toEqual(before); memory.failure = null;
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' }));
    await waitFor(() => expect(host.current().hops).toHaveLength(1));
    expect(host.current().hops[0].hopVarietyId).toBe('hopsteiner-cas');
  });
  it('accepte une souche hors catalogue sans lui inventer de capacité enzymatique ni écrire pendant la simulation', async () => {
    mount();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Levure à simuler'), { target: { value: '__new' } });
    fireEvent.change(screen.getByLabelText('Nom de la souche hors catalogue'), { target: { value: 'Souche témoin du brasseur' } });
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette souche' }));
    expect(screen.getByText('Cascade × Souche témoin du brasseur')).toBeInTheDocument();
    expect(screen.getByLabelText('Graphe de la prédiction expérimentale')).toHaveTextContent('Plage');
    expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer ce scénario à la recette' }));
    await waitFor(() => expect(StorageService.getHopKnowledge().find(k => k.name === 'Souche témoin du brasseur')).toBeDefined());
    expect(StorageService.getHopKnowledge().find(k => k.name === 'Souche témoin du brasseur')).toMatchObject({ kind: 'yeast', betaLyase: 'unknown' });
  });
  it('la consultation et la comparaison d’une variante ne changent jamais une recette enregistrée', async () => {
    const r = recipe({ hops: [{ name: 'Cascade', hopVarietyId: 'hopsteiner-cas', alpha: 6.5, weightG: 60, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 24, aromaTemperatureC: 18 }], yeast: { name: 'US-05', hopIndexId: 'fermentis-us05', qty: 1, unit: 'sachet', form: 'sèche' } });
    const before = structuredClone(r);
    render(<HopExtrapolationPanel recipe={r} readOnly />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Appliquer ce scénario à la recette' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Explorer une variante sans modifier la recette' }));
    fireEvent.change(screen.getByLabelText('Levure à simuler'), { target: { value: 'lalbrew-verdant-ipa' } });
    expect(r).toEqual(before); expect(memory.writes).not.toHaveBeenCalled();
  });
  it('classe des associations en conservant dose et contact, sans modifier la recette', async () => {
    const host = mount();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Comparer aussi les levures' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Comparer aussi les levures' }));
    await waitFor(() => expect(screen.getByText(/Associations comparées à dose/)).toBeInTheDocument(), { timeout: 15000 });
    expect(host.changes).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Dose (g/L)')).toHaveValue('4');
  }, 20000);
});
