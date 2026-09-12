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

describe('Bilan aromatique en lecture seule', () => {
  it('affiche la levure et le programme existants sans écrire, et délègue toute modification au parcours de recette', async () => {
    const initial=recipe(), before=structuredClone(initial), onEdit=vi.fn();
    render(<HopRecipePanel recipe={initial} onEdit={onEdit} />);
    expect(screen.getByText('US-05 · lecture seule')).toBeInTheDocument();
    expect(screen.getByText(/À cru · phase à préciser/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByText('Adéquation au profil recherché')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Composition, thiols et phénols'));
    fireEvent.click(await screen.findByRole('button', {name:'Phénols et polyphénols'}));
    expect(screen.getByText(/Phénols de levure/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name:'Modifier dans l’atelier de recette'}));
    expect(onEdit).toHaveBeenCalledOnce();
    expect(initial).toEqual(before); expect(memory.writes).not.toHaveBeenCalled();
    expect(StorageService.getHopPredictions()).toEqual([]);
  });
  it('un brassin sans route d’édition reste consultable sans contrôle de modification', () => {
    render(<HopRecipePanel recipe={recipe()} batchId="b" />);
    expect(screen.queryByRole('button', {name:/Modifier/})).not.toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled();
  });
});
