import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

// VB-2 (10.11, en ligne) : ouvrir Mesurer depuis une case « ? » envoyait POST saveBrewSession sans aucun Enregistrer.
// Ici la session est « en ligne » (utilisateur connecté), l'appel serveur est espionné : seul Enregistrer a le droit d'écrire.
const mock = vi.hoisted(() => ({ call: vi.fn(), waitForDocument: vi.fn() }));
vi.mock('../../src/services/firebase', () => ({ auth: { currentUser: { uid: 'vb2' } }, functions: {} }));
vi.mock('firebase/functions', () => ({ httpsCallable: (_f: unknown, name: string) => (data: unknown) => mock.call(name, data) }));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
    waitForDocument: mock.waitForDocument,
    all: () => [],
    subscribe: () => () => {},
    put: vi.fn(),
    remove: vi.fn(),
    consumeError: () => null,
    isReady: () => true,
    startSync: vi.fn(),
    stopSync: vi.fn()
  } }));
vi.mock('../../src/services/brewClock', () => ({ brewNow: () => Date.now(), setBrewClock: vi.fn() }));
vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import type { Batch } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

function lot(stepMatch: RegExp): Batch {
  const r = recipe();
  const base = brewState(r, { revision: 3 });
  const index = Math.max(0, base.steps.findIndex((s) => stepMatch.test(s.id)));
  const state = {
    ...base,
    currentIndex: index,
    startedAt: Date.now() - 600_000,
    steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: Date.now() - 300_000 } : s))
  };
  return { id: 'LOT-VB2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
}
const ecritures = () => mock.call.mock.calls.filter(([name]) => name === 'saveBrewSession');

beforeEach(() => {
  localStorage.clear();
  mock.call.mockReset();
  mock.waitForDocument.mockReset().mockResolvedValue({ id: 'LOT-VB2' });
});
afterEach(() => cleanup());

// Cause établie (10.11) : aucune écriture ne part du geste ; un POST à l'ouverture venait d'un brouillon resté dans la file locale
// (« brew-outbox-… »), renvoyé au montage de la page par `refresh()` puis `pump()`. Ce test documente le mécanisme : le POST part au
// montage, avant tout toucher, et n'est pas causé par la case « ? ».
describe('VB-2 : un brouillon resté en file local est renvoyé au montage, pas au toucher', () => {
  it('le POST précède le premier clic', async () => {
    const b = lot(/^mash/);
    const ancien = { ...b.brewDay!, revision: 1, currentIndex: 0 };
    localStorage.setItem('brew-outbox-vb2-LOT-VB2', JSON.stringify([{ operationId: 'op-ancien', state: ancien, clientNow: 1, baseRevision: 1 }]));
    mock.call.mockImplementation(async () => ({ data: { state: b.brewDay, serverNow: Date.now() } }));
    render(<BrewDayPage batch={b} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    await waitFor(() => expect(ecritures().length).toBeGreaterThan(0));
    expect(screen.queryAllByRole('button', { name: /Relever / }).length).toBeGreaterThan(0);
  });
});

describe('VB-2 : ouvrir Mesurer n’écrit rien', () => {
  for (const [nom, etape] of [['empâtage', /^mash/], ['ensemencement', /^ensemencement/], ['préébullition', /^preboil/]] as const) {
    it(`${nom} : case « ? », piste, × : aucun saveBrewSession`, async () => {
      const b = lot(etape);
      mock.call.mockImplementation(async (name: string) =>
        name === 'getBrewSession' ? { data: { state: b.brewDay, serverNow: Date.now() } } : { data: { state: b.brewDay, serverNow: Date.now() } }
      );
      render(<BrewDayPage batch={b} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
      await waitFor(() => expect(mock.call.mock.calls.some(([n]) => n === 'getBrewSession')).toBe(true));
      await new Promise((r) => setTimeout(r, 50));
      expect(ecritures()).toHaveLength(0);
      const cases = screen.queryAllByRole('button', { name: /^Relever / });
      expect(cases.length).toBeGreaterThan(0);
      fireEvent.click(cases[0]);
      await new Promise((r) => setTimeout(r, 100));
      const piste = document.querySelector<HTMLElement>('.bz-mesure [role="slider"], .bz-mesure input[type="range"]');
      if (piste) fireEvent.pointerDown(piste);
      const fermer = screen.queryAllByRole('button', { name: /Fermer la saisie/ })[0];
      if (fermer) fireEvent.click(fermer);
      await new Promise((r) => setTimeout(r, 100));
      expect(ecritures()).toHaveLength(0);
      expect(localStorage.getItem('brew-outbox-vb2-LOT-VB2')).toBeNull();
    });
  }
});
