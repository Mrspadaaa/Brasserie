import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Recipe } from '../../src/types';

// The real panel, guide, catalogue and validated import path stay in use.
// Only the Firestore boundary is replaced, with an explicitly delayed write.
const memory = vi.hoisted(() => ({
  docs: new Map<string, any>(), listeners: new Set<() => void>(),
  writes: vi.fn(), attempts: vi.fn(),
  writeBarrier: null as Promise<void> | null,
  releaseWrite: null as (() => void) | null,
}));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/'))
    .map(([key, value]) => ({ ...structuredClone(value), __docId: key.split('/')[1] })),
  isReady: () => true,
  subscribe: (callback: () => void) => { memory.listeners.add(callback); return () => memory.listeners.delete(callback); },
  put: (name: string, id: string, value: any) => {
    memory.writes(name, id, value); memory.docs.set(`${name}/${id}`, structuredClone(value));
    memory.listeners.forEach(callback => callback());
  },
  bulkWrite: async (entries: any[]) => {
    memory.attempts(entries);
    if (memory.writeBarrier) await memory.writeBarrier;
    for (const { name, id, data } of entries) {
      memory.writes(name, id, data); memory.docs.set(`${name}/${id}`, structuredClone(data));
    }
    memory.listeners.forEach(callback => callback());
  },
} }));
import { StorageService } from '../../src/services/storage';
import { HopRecipePanel } from '../../src/ui/hopIndex/HopRecipePanel';

const recipe = (): Recipe => ({
  id: 'panel-test', name: 'Recette témoin', style: 'IPA', volumeL: 20,
  ogTarget: 1.055, fgTarget: 1.01, abvTarget: 5.9, totalGristKg: 5,
  fermentables: [], steps: [], notes: [],
  hops: [{ name: 'Citra', weightG: 75, alpha: 0, stage: 'dryHop', dayOffset: 3 }],
  yeast: { name: 'US-05', form: 'sèche', qty: 2, unit: 'sachet', fermTempMinC: 18, fermTempMaxC: 21 },
});

beforeEach(() => {
  memory.docs.clear(); memory.listeners.clear(); memory.writes.mockClear(); memory.attempts.mockClear();
  memory.writeBarrier = null; memory.releaseWrite = null;
});
afterEach(async () => {
  await act(async () => { memory.releaseWrite?.(); });
  cleanup();
});

describe('Édition aromatique depuis la fiche recette', () => {
  it('attend la persistance de US-05 avant de fermer ou enregistrer, puis conserve son association', async () => {
    const initial = recipe(), before = structuredClone(initial), onSave = vi.fn();
    memory.writeBarrier = new Promise<void>(resolve => { memory.releaseWrite = resolve; });
    render(<HopRecipePanel recipe={initial} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choisir le profil et les références' }));
    const dialog = screen.getByRole('dialog', { name: 'Profil aromatique et ajouts' });
    const save = within(dialog).getByRole('button', { name: 'Enregistrer le profil et les références' });
    expect(save).toBeEnabled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Relier SafAle US-05 (Fermentis)' }));
    await waitFor(() => expect(memory.attempts).toHaveBeenCalledTimes(1));
    expect(save).toBeDisabled();
    expect(within(dialog).getByRole('status')).toHaveTextContent('Enregistrement des références…');
    expect(StorageService.getHopKnowledge()).toEqual([]);
    expect(memory.writes).not.toHaveBeenCalled();

    fireEvent.click(save);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fermer' }));
    expect(screen.getByRole('dialog', { name: 'Profil aromatique et ajouts' })).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();

    await act(async () => { memory.releaseWrite!(); await memory.writeBarrier; });
    await waitFor(() => expect(within(dialog).getByText('Référence associée : SafAle US-05 (Fermentis)')).toBeInTheDocument());
    expect(save).toBeEnabled();
    expect(StorageService.getHopKnowledge()).toHaveLength(1);
    expect(StorageService.getHopKnowledge()[0]).toMatchObject({ id: 'fermentis-us05', kind: 'yeast', betaLyase: 'unknown' });
    expect(memory.writes).toHaveBeenCalledTimes(1);

    fireEvent.click(save);
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ ...before, yeast: { ...before.yeast, hopIndexId: 'fermentis-us05' } });
    expect(initial).toEqual(before);
  });

  it('affiche la levure nommée de la recette même sans référence associée, sans proposer de figer un résultat vide', () => {
    const initial = recipe(), onSave = vi.fn();
    render(<HopRecipePanel recipe={initial} onSave={onSave} />);
    fireEvent.click(screen.getByText('Ajout 1 · Citra · 75 g'));

    expect(screen.getByText(/Citra US-05/)).toHaveTextContent('Citra × US-05');
    expect(screen.getByText('Levure non associée à l’index')).toBeInTheDocument();
    expect(screen.queryByText('Levure non renseignée')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Figer ces prédictions' })).not.toBeInTheDocument();
    expect(StorageService.getHopKnowledge()).toEqual([]);
    expect(StorageService.getHopPredictions()).toEqual([]);
    expect(onSave).not.toHaveBeenCalled();
  });
});
