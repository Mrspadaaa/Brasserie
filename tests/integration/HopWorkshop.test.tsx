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
import { HopWorkshop } from '../../src/ui/hopIndex/HopWorkshop';
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
  function Host() { const [r, setR] = useState(initial); current = r; return <HopWorkshop recipe={r} onChange={next => { changes(next); setR(next as Recipe); }} />; }
  render(<Host />); return { current: () => current, changes };
}
describe('Atelier de formulation sur des essais connus', () => {
  it('fournit immédiatement des programmes avec résultat, source et graphique dans une base vide, sans écrire', () => {
    mount();
    expect(within(screen.getByRole('group', { name: 'Programmes documentés' })).getAllByRole('button')).toHaveLength(6);
    fireEvent.change(screen.getByLabelText('Rechercher un essai'), { target: { value: 'Nottingham' } });
    expect(screen.getByLabelText('Protocole sélectionné')).toHaveTextContent('LalBrew Nottingham');
    expect(screen.getByLabelText('Protocole sélectionné')).not.toHaveTextContent('LalBrew Verdant IPA');
    fireEvent.change(screen.getByLabelText('Rechercher un essai'), { target: { value: 'introuvable' } });
    expect(screen.queryByLabelText('Protocole sélectionné')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Rechercher un essai'), { target: { value: '' } });
    expect(screen.getByRole('figure', { name: 'Graphique du programme de houblonnage' })).toBeInTheDocument();
    expect(screen.getByText('Résultat observé dans la source')).toBeInTheDocument();
    expect(screen.queryByText('Adéquation au profil recherché')).not.toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Rechercher un essai'), { target: { value: 'Cascade' } });
    expect(within(screen.getByRole('group', { name: 'Programmes documentés' })).getAllByRole('button')).toHaveLength(6);
  });
  it('ne remplace rien avant l’aperçu explicite et la persistance des références ; permet ensuite une adaptation US-05 sans chiffre aromatique', async () => {
    const host = mount(); const before = structuredClone(host.current());
    await waitFor(() => expect(screen.getByRole('button', { name: 'Préparer ce programme pour 20 L' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Préparer ce programme pour 20 L' }));
    expect(screen.getByLabelText('Aperçu du programme')).toHaveTextContent('80 g');
    expect(host.changes).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
    let release: () => void;
    memory.delay = new Promise<void>(r => { release = r; });
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer le houblonnage et la levure' }));
    await waitFor(() => expect(memory.attempts).toHaveBeenCalledOnce());
    expect(host.current()).toEqual(before);
    await act(async () => { release!(); await memory.delay; }); memory.delay = null;
    await waitFor(() => expect(host.current().hopTrialId).toBe('trial-split-verdant-2026'));
    expect(host.current().hops.map(h => h.weightG)).toEqual([40, 40, 80]);
    expect(host.current().hops.every(h => h.alpha === 0 && h.timeMin === undefined && h.tempC === undefined)).toBe(true);
    expect(StorageService.getHopVarieties()).toHaveLength(3);
    fireEvent.change(screen.getByLabelText('Levure pour mon adaptation'), { target: { value: 'fermentis-us05' } });
    await waitFor(() => expect(host.current().yeast.hopIndexId).toBe('fermentis-us05'));
    expect(host.current().hopTrialId).toBe('trial-split-verdant-2026');
    expect(screen.getByLabelText('Écarts au programme documenté')).toHaveTextContent('Diffère');
    expect(host.current().hopMatrixId).toBeUndefined();
    expect(screen.queryByText('Adéquation au profil recherché')).not.toBeInTheDocument();
  });
  it('conserve toute la recette après une écriture refusée et permet une nouvelle tentative', async () => {
    const host = mount(); const before = structuredClone(host.current()); memory.failure = Error('Écriture indisponible');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Préparer ce programme pour 20 L' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Préparer ce programme pour 20 L' }));
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer le houblonnage et la levure' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Écriture indisponible'));
    expect(host.current()).toEqual(before); expect(host.changes).not.toHaveBeenCalled();
    memory.failure = null;
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer le houblonnage et la levure' }));
    await waitFor(() => expect(host.current().hops).toHaveLength(3));
  });
  it('recherche Cascade sans stock puis ajoute seulement sa référence, sans article de stock inventé', async () => {
    const onReference = vi.fn(), onCreate = vi.fn(), onChange = vi.fn();
    render(<HopIngredientPicker items={[]} onReference={onReference} onCreate={onCreate} onChange={onChange} placeholder="Chercher" ariaLabel="Houblon à ajouter" />);
    const input = screen.getByRole('combobox', { name: 'Houblon à ajouter' });
    fireEvent.focus(input); fireEvent.change(input, { target: { value: 'Cascade' } });
    const option = await screen.findByRole('option', { name: /Cascade.*Hopsteiner/ });
    fireEvent.click(option);
    await waitFor(() => expect(onReference).toHaveBeenCalledOnce());
    expect(onReference.mock.calls[0][0].id).toBe('hopsteiner-cas');
    expect(StorageService.getHopVarieties()).toHaveLength(1);
    expect(onCreate).not.toHaveBeenCalled(); expect(onChange).not.toHaveBeenCalled();
  });
});
