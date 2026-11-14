import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { Batch, BrewDayState } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({
  enableBrewAlerts: vi.fn(),
  syncBrewAlerts: vi.fn()
}));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));

const release = vi.fn(async () => undefined);
const request = vi.fn(async () => ({ release, released: false }));
beforeEach(() => {
  release.mockClear();
  request.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete (navigator as unknown as { wakeLock?: unknown }).wakeLock;
});

function mount(over: Partial<BrewDayState> = {}) {
  const r = recipe();
  const save = vi.fn();
  const batch = { id: 'LOT-D', name: r.name, recipeSnapshot: r, brewDay: brewState(r, over) } as Batch;
  render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={save} onFinish={vi.fn()} />);
  return { latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState };
}
const phase = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Phases du brassage' })).getByRole('button', { name, exact: true })
  );
const feuille = () => document.querySelector('.brew-measure-capture') as HTMLElement;
const demarrerPalier = () => {
  phase('Empâter');
  fireEvent.click(screen.getByRole('button', { name: 'Commencer la montée' }));
  fireEvent.click(screen.getByRole('button', { name: 'Démarrer le maintien' }));
};

describe('v1 lot D : Mesurer (8), onglets (10), écran allumé (12)', () => {
  it('8 : au palier, Mesurer s’ouvre sur la Maische °C (avant le pH), sans onglet Densité ; l’enregistrement ferme la feuille et le journal le dit', () => {
    mount();
    demarrerPalier();
    fireEvent.click(screen.getByRole('button', { name: 'Relever une mesure' }));
    const types = within(feuille()).getByRole('group', { name: 'Type de mesure' });
    expect(within(types).getByRole('button', { name: 'Température' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(types).queryByRole('button', { name: 'Densité' })).toBeNull();
    expect(feuille().hasAttribute('data-open')).toBe(true);
    fireEvent.change(document.getElementById('brew-reading') as HTMLInputElement, { target: { value: '66,5' } });
    fireEvent.click(within(feuille()).getByRole('button', { name: 'Enregistrer' }));
    expect(feuille().hasAttribute('data-open')).toBe(false);
    expect(document.querySelector('.brew-toast')?.textContent).toMatch(/Température 66,5 °C ajoutée au journal/);
  });

  it('10 : la feuille de l’eau n’a pas d’onglet Densité (pas de moût)', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Relever une mesure' }));
    const types = within(feuille()).getByRole('group', { name: 'Type de mesure' });
    expect(within(types).queryByRole('button', { name: 'Densité' })).toBeNull();
    expect(within(types).getByRole('button', { name: 'pH' })).toBeTruthy();
  });

  it('10 : « Étalonner le pH-mètre » est à Préparer, pas à l’Empâtage', () => {
    mount();
    expect(screen.getByText(/Étalonner le pH-mètre/)).toBeTruthy();
    phase('Empâter');
    expect(screen.queryByText(/Étalonner le pH-mètre/)).toBeNull();
  });

  it('12 : une horloge qui tourne garde l’écran allumé ; l’icône « écran » le montre et l’arrête', async () => {
    (navigator as unknown as { wakeLock: unknown }).wakeLock = { request };
    mount();
    const icone = () => screen.getByRole('button', { name: 'Garder l’écran allumé' });
    expect(request).not.toHaveBeenCalled();
    expect(icone()).toHaveAttribute('aria-pressed', 'false');
    demarrerPalier();
    await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(icone()).toHaveAttribute('aria-pressed', 'true'));
    fireEvent.click(icone());
    await waitFor(() => expect(icone()).toHaveAttribute('aria-pressed', 'false'));
    expect(release).toHaveBeenCalled();
    // arrêté à la main : l'horloge qui tourne encore ne le rallume pas
    await new Promise((r) => setTimeout(r, 30));
    expect(request).toHaveBeenCalledTimes(1);
  });
});
