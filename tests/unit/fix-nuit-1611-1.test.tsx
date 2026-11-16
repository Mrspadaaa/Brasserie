// @vitest-environment jsdom
// Nuit 16.11, constat 1 : « Prévu le 30.11.2020 » vu en ligne après avoir planifié le 30.11.2026.
// On suit le chemin réel : la feuille d1b (jour choisi, horloge au 16.11.2026) -> planRecipeBatch (vrai StorageService, dépôt simulé)
// -> brassin ouvert à la Conduite (même fusion que BrewDayPage : brewSessionDatePatch) -> BatchSchedule rend « Prévu le … ».
// Fixtures FICTIVES (préfixe ZZ).
import React from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Batch, Recipe } from '../../src/types';

const store = new Map<string, Map<string, Record<string, unknown>>>();
const fakeRepo = {
  all: <T,>(name: string): T[] => Array.from(store.get(name)?.entries() ?? []).map(([__docId, doc]) => ({ ...doc, __docId }) as T),
  put: (name: string, id: string, doc: unknown, options?: { merge?: boolean }) => {
    if (!store.has(name)) store.set(name, new Map());
    const value = options?.merge ? { ...store.get(name)!.get(id), ...(doc as object) } : doc;
    store.get(name)!.set(id, JSON.parse(JSON.stringify(value)));
  },
  adjustNumber: () => undefined, remove: () => undefined, startSync: () => undefined, isReady: () => true,
  subscribe: () => () => undefined, consumeWriteError: () => null, clearMemoryCache: () => store.clear()
};
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: fakeRepo, ALL_COLLECTIONS: [] }));

import { FeuilleBrasser } from '../../src/ui/production/brasser/FeuilleBrasser';
import { BatchSchedule } from '../../src/ui/production/BatchSchedule';
import { brewSessionDatePatch, plannedBrewDate } from '../../src/domain/batchSchedule';

let StorageService: typeof import('../../src/services/storage').StorageService;
beforeAll(async () => { ({ StorageService } = await import('../../src/services/storage')); });
afterEach(() => { cleanup(); vi.useRealTimers(); store.clear(); });

const recette = {
  id: 'zz-r1', name: 'ZZ Blonde de soif', style: 'Blonde', volumeL: 24, ogTarget: null, abvTarget: null,
  fermentables: [{ name: 'ZZ Pils', stockItemRef: 'ZZ-PILS', weightKg: 5 }], hops: [], yeast: { name: 'ZZ US-05', qty: 1, unit: 'sachet' }, adjuncts: []
} as unknown as Recipe;

/** Ce que BrewDayPage fait d'un brassin ouvert : `{ ...batch, ...brewSessionDatePatch(batch, state), brewDay: state }`, la session n'ayant encore rien mesuré. */
const ouvertALaConduite = (batch: Batch): Batch => {
  const state = { steps: [], currentIndex: 0, readings: [] } as unknown as NonNullable<Batch['brewDay']>;
  return { ...batch, ...brewSessionDatePatch(batch, state), brewDay: state };
};
const rendre = (batch: Batch) => render(<BatchSchedule batch={ouvertALaConduite(batch)} onSave={() => undefined} />);

describe('constat 1 : la date prévue suit le jour choisi jusqu\'à la Conduite', () => {
  it('chemin réel : lundi 30 novembre -> « Prévu le 30.11.2026 », jamais 2020', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 9)); // lun. 16.11.2026, sans `maintenant` : l'horloge de l'app
    const onPlanifier = vi.fn();
    render(<FeuilleBrasser recipe={recette} batches={[]} stock={[]} capaciteL={30} onPlanifier={onPlanifier} onAnnuler={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /^lundi 30 novembre/ }));
    fireEvent.click(screen.getByRole('button', { name: /Planifier lun\. 30\.11/ }));
    const jour = onPlanifier.mock.calls[0][0] as string;
    expect(jour).toBe('30.11.2026');
    cleanup();

    const batch = StorageService.planRecipeBatch(recette, 'ZZ-900', jour);
    expect(batch.plannedBrewDate).toBe('30.11.2026');
    const relu = StorageService.getBatches().find(b => b.id === 'ZZ-900')!; // ce que l'app rouvre (dépôt)
    expect(relu.plannedBrewDate).toBe('30.11.2026');

    rendre(relu);
    expect(screen.getByText('Prévu le 30.11.2026')).toBeTruthy();
    expect(document.body.textContent).not.toContain('2020');
  });

  it.each([
    ['suisse', '30.11.2026'],
    ['suisse sans zéro', '5.12.2026'],
    ['ISO', '2026-11-30']
  ])('format stocké %s : l\'année reste 2026', (_nom, stocke) => {
    const base = { id: 'ZZ-901', name: 'ZZ', style: 'x', volumeL: 24, status: 'planifie', gravityLog: [], brewDate: '', plannedBrewDate: stocke } as unknown as Batch;
    rendre(base);
    expect(document.body.textContent).toMatch(/Prévu le \d{2}\.\d{2}\.2026/);
    expect(document.body.textContent).not.toContain('2020');
  });

  it('ancien modèle (un seul champ brewDate, statut planifié) : l\'année reste 2026', () => {
    rendre({ id: 'ZZ-902', name: 'ZZ', style: 'x', volumeL: 24, status: 'planifie', gravityLog: [], brewDate: '30.11.2026' } as unknown as Batch);
    expect(screen.getByText('Prévu le 30.11.2026')).toBeTruthy();
  });

  it('année sur deux chiffres ou horodatage : dit « à corriger », ne devine jamais une année', () => {
    for (const bizarre of ['30.11.20', '30.11.26', '2026-11-30T00:00:00.000Z']) {
      cleanup();
      const batch = { id: 'ZZ-903', name: 'ZZ', style: 'x', volumeL: 24, status: 'planifie', gravityLog: [], brewDate: '', plannedBrewDate: bizarre } as unknown as Batch;
      expect(plannedBrewDate(batch)).toBeUndefined();
      rendre(batch);
      expect(document.body.textContent).not.toMatch(/Prévu le/);
      expect(document.body.textContent).toContain('Date prévue à corriger');
    }
  });

  it('reprogrammation par BatchSchedule : la date écrite garde l\'année saisie', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 16, 9));
    const base = { id: 'ZZ-905', name: 'ZZ', style: 'x', volumeL: 24, status: 'planifie', gravityLog: [], brewDate: '', plannedBrewDate: '' } as unknown as Batch;
    const onSave = vi.fn();
    render(<BatchSchedule batch={ouvertALaConduite(base)} onSave={onSave} />);
    fireEvent.click(screen.getByRole('button', { name: 'Planifier' }));
    fireEvent.click(screen.getByText('Autre date'));
    const champ = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(champ, { target: { value: '2026-11-30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la date' }));
    await vi.waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave.mock.calls[0][0].plannedBrewDate).toBe('30.11.2026');
  });
});
