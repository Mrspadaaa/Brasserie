import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { Batch } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => cleanup());

// Voie port-K, lot K5 : n° 15 (le ⏸ de p2c à chaque minuteur), n° 21 (pas de carte grise « Fin d'ébullition »), n° 28 (p2c à la lettre : le sachet prévu).
const monter = (r: ReturnType<typeof recipe>, state: ReturnType<typeof brewState>, onSave = vi.fn()) => {
  const batch = { id: 'LOT-K5', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={onSave} onFinish={vi.fn()} />);
};

describe('n° 15 : le ⏸ garde sa place à l’ébullition', () => {
  it('ébullition en marche : ⏸ actif ; un toucher met en pause (▶ « Reprendre »), un second reprend', () => {
    const r = recipe();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => /^boil-|^hop-/.test(s.id) || s.boilElapsedMin != null));
    const state = { ...base, currentIndex: index, startedAt: Date.now() - 3 * 3600000, boilStartedAt: Date.now() - 10 * 60000 };
    monter(r, state);
    const pause = screen.getByRole('button', { name: 'Mettre le minuteur en pause' });
    expect(pause).not.toBeDisabled();
    expect(pause.getBoundingClientRect).toBeTruthy();
    fireEvent.click(pause);
    const reprise = screen.getByRole('button', { name: 'Reprendre le minuteur' });
    expect(document.querySelector('[data-booster="horloge"]')?.getAttribute('data-etat')).toBe('pause');
    fireEvent.click(reprise);
    expect(screen.getByRole('button', { name: 'Mettre le minuteur en pause' })).toBeTruthy();
  });

  it('palier non lancé : le ⏸ est là, éteint (le lancement est le bouton du pied)', () => {
    const r = recipe();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
    monter(r, { ...base, currentIndex: index });
    const pause = screen.getByRole('button', { name: 'Mettre le minuteur en pause' });
    expect(pause).toBeDisabled();
  });
});

describe('n° 28 : p2c à la lettre, le sachet prévu se dit ; la dose réelle reste « à choisir » (1C)', () => {
  const levure = () => ({ ...recipe(), yeast: { name: 'SafAle US-05', form: 'sèche' as const } } as ReturnType<typeof recipe>);
  it('à l’ensemencement, avant le geste : la tuile dit « cible … · 1 sachet » et la ligne Levure « à choisir » ; rien n’est posé dans l’état', () => {
    const r = levure();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => s.id === 'ensemencement'));
    const onSave = vi.fn();
    monter(r, { ...base, currentIndex: index, startedAt: Date.now() - 5 * 3600000, steps: base.steps.map((s, i) => (i < index ? { ...s, doneAt: Date.now() - 60000 } : s)) }, onSave);
    expect(document.body.textContent).toMatch(/Ensemencement\?1 sachet/); // la tuile (sans température de recette : « 1 sachet » seul ; avec : « cible 18 °C · 1 sachet »)
    expect(screen.getAllByText('à choisir').length).toBeGreaterThan(0);
    const posees = onSave.mock.calls.map((c) => (c[0] as Batch).brewDay?.additions?.yeast).filter(Boolean);
    expect(posees).toEqual([]);
  });
});
