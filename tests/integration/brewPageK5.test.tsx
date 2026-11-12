import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage, doseDiteLevure } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { Batch } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => cleanup());

// Voie port-K, lot K5 : n° 15 (le ⏸ de p2c à chaque minuteur), n° 21 (pas de carte grise « Fin d'ébullition »), n° 28 (« 1 sachet » prérempli).
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

describe('n° 28 : aucune dose de levure préremplie (1C) ; « 1 sachet » se dit quand il est choisi', () => {
  const levure = () => ({ ...recipe(), yeast: { name: 'SafAle US-05', form: 'sèche' as const } } as ReturnType<typeof recipe>);
  it('règle : sans dose de recette ni choix, aucune dose dite ; choisie, elle se dit', () => {
    const r = levure();
    const base = brewState(r);
    expect(doseDiteLevure(r, base)).toBeUndefined();
    expect(doseDiteLevure(r, { ...base, additions: { ...base.additions, yeast: { amount: 1, unit: 'sachet' } } } as never)).toEqual({ amount: 1, unit: 'sachet' });
  });
  it('avant le geste : ni la tuile Ensemencement ni « Sortir la levure » ne disent « 1 sachet » ; la ligne Levure dit « à choisir »', () => {
    const r = levure();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => s.id === 'ensemencement'));
    monter(r, { ...base, currentIndex: index, startedAt: Date.now() - 5 * 3600000, steps: base.steps.map((s, i) => (i < index ? { ...s, doneAt: Date.now() - 60000 } : s)) });
    const dosesDites = Array.from(document.body.textContent!.matchAll(/(?<![\wé])1\s*sachet(?!\s*(?:11|mou))/g));
    // Les seuls « sachet » restants : le choix « 1 sachet » du sélecteur (à toucher) et la source du poids du fabricant.
    expect(screen.getAllByText('à choisir').length).toBeGreaterThan(0);
    expect(document.body.textContent).not.toMatch(/cible[^]{0,20}· 1 sachet/);
    expect(document.body.textContent).not.toMatch(/SafAle US-05 · 1 sachet/);
    expect(dosesDites.length).toBeLessThanOrEqual(1);
  });
});
