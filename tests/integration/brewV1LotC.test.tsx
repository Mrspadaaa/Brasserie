import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mount(over: Partial<BrewDayState> = {}) {
  const r = recipe();
  const save = vi.fn();
  const batch = { id: 'LOT-C', name: r.name, recipeSnapshot: r, brewDay: brewState(r, over) } as Batch;
  render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={save} onFinish={vi.fn()} />);
  return { latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState };
}
const phase = (name: string) =>
  fireEvent.click(
    within(screen.getByRole('navigation', { name: 'Phases du brassage' })).getByRole('button', { name, exact: true })
  );
const pied = () => document.querySelector('[data-booster=action]') as HTMLElement;

describe('v1 lot C : pied « Action · heure », fin de minuteur, note', () => {
  it('un palier en marche dit « Fin du palier · heure » ; son nom d’action reste Terminer le palier', () => {
    mount();
    phase('Empâter');
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la montée' }));
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le maintien' }));
    expect(pied().textContent).toMatch(/^Fin du palier\s*·\s*\d{1,2} h \d{2}$/);
    expect(pied().getAttribute('aria-label')).toBe('Terminer le palier');
    expect(document.querySelector('.bz-fin')?.textContent).not.toContain('à vérifier');
  });

  it('une échéance dépassée se dit « En retard de … / Ce palier devait finir à … », en mots de brasseur, sans « Reprise du journal »', () => {
    const now = Date.now();
    const v = mount();
    phase('Empâter');
    fireEvent.click(screen.getByRole('button', { name: 'Commencer la montée' }));
    fireEvent.click(screen.getByRole('button', { name: 'Démarrer le maintien' }));
    cleanup();
    const started = v.latest();
    const steps = started.steps.map((s) => (s.startedAt != null && s.doneAt == null ? { ...s, startedAt: now - (s.durationMin + 40) * 60000 } : s));
    mount({ ...started, steps });
    phase('Empâter');
    expect(document.querySelector('.bz-fin')?.textContent).toContain('palier à vérifier');
    expect(document.querySelector('.brew-recovery')?.textContent).toMatch(/^En retard de \d+ min.*Ce palier devait finir à \d{1,2} h \d{2}/);
    expect(screen.queryByText('Reprise du journal')).toBeNull();
    expect(pied().textContent).toMatch(/^Fin du palier\s*·/);
  });

  it('la note se ferme à « Noter », le pied redevient « Note » et la feuille porte l’étape en cours', () => {
    mount();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une note' }));
    expect(document.querySelector('.brew-note-capture')?.textContent).toContain('Eau et sels');
    fireEvent.change(screen.getByLabelText('Observation'), { target: { value: 'Pompe amorcée' } });
    expect(screen.getByRole('button', { name: 'Ajouter une note' }).textContent).toContain('Brouillon');
    fireEvent.click(within(screen.getByRole('region', { name: 'Notes et conseil' })).getByRole('button', { name: 'Noter' }));
    expect(screen.getByRole('button', { name: 'Ajouter une note' }).textContent).toContain('Note');
    expect(screen.getByRole('button', { name: 'Ajouter une note' }).textContent).not.toContain('Brouillon');
    expect(screen.getByText('Note ajoutée au journal.')).toBeTruthy();
    expect(screen.getByLabelText('Observation')).toHaveValue('');
  });
});
