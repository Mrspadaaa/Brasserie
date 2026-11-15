import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

// Port de p2c, intégration 1b : la carte « Maintenant » (E1) et l'appel d'un ajout échu (E2).
function monterPalier() {
  const r = recipe();
  r.mash = { ...r.mash, heatingRateCPerMin: 1.5 } as typeof r.mash;
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
  const state = { ...base, currentIndex: index, steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: Date.now() } : s)) };
  const batch = { id: 'LOT-I1B', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}
function monterEbullition(minutesRestantes = 4) {
  const r = recipe();
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => /^boil/.test(s.id)));
  const duree = r.boilMin ?? 60;
  const state = { ...base, currentIndex: index, boilDurationMin: duree, boilStartedAt: Date.now() - (duree - minutesRestantes) * 60000 };
  const batch = { id: 'LOT-I1B', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}

describe('port p2c I1b : Maintenant (E1)', () => {
  it('un palier lancé : la carte « Maintenant · relevé dû » est en tête, la grande valeur est « ? », Enregistrer attend la pose', () => {
    monterPalier();
    const carte = document.querySelector('.bm-now') as HTMLElement;
    expect(carte).toBeTruthy();
    expect(within(carte).getByText(/Maintenant · relevé dû/)).toBeTruthy();
    expect(within(carte).getByText('?')).toBeTruthy();
    expect(within(carte).getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    // aucun champ numérique natif : le curseur et les pas portent le geste.
    expect(carte.querySelector('input[type="number"]')).toBeNull();
  });

  it('poser par ±0,1 puis Enregistrer : le relevé entre, la carte devient « ✓ … relevé à … » et dit le prochain relevé', () => {
    monterPalier();
    const carte = document.querySelector('.bm-now') as HTMLElement;
    fireEvent.click(within(carte).getByRole('button', { name: 'plus 0,1' }));
    const enregistrer = within(carte).getByRole('button', { name: 'Enregistrer' });
    expect(enregistrer).toBeEnabled();
    fireEvent.click(enregistrer);
    expect(screen.getByText(/✓ .* relevée? à \d+ h \d{2}/)).toBeTruthy();
    expect(screen.getByText(/Enregistré · /)).toBeTruthy();
    expect(within(document.querySelector('.bm-now') as HTMLElement).queryByRole('button', { name: 'Enregistrer' })).toBeNull();
  });
});

describe('port p2c I1b : appel d’un ajout échu (E2)', () => {
  it('l’ajout échu : la carte rouge dit « Ajouté », « Dans 1 min », « Sauter »', () => {
    monterEbullition();
    const bouton = screen.queryByRole('button', { name: /Ajouté ·/ });
    expect(bouton).toBeTruthy();
    expect(screen.getByRole('button', { name: /Dans 1 min/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Sauter/ })).toBeTruthy();
    // le bandeau « À faire » du haut de page cède la place à la carte pour l'ajout échu.
    expect(document.querySelector('.brew-alarm, [data-alarme-entete]')).toBeNull();
  });

  it('« Ajouté » coche l’ajout, la carte montre « Annuler » ; annuler remet l’ajout à faire (10 s)', () => {
    monterEbullition();
    fireEvent.click(screen.getByRole('button', { name: /Ajouté ·/ }));
    const annuler = screen.getByRole('button', { name: /Annuler/ });
    fireEvent.click(annuler);
    expect(screen.queryByRole('button', { name: /Annuler/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Ajouté ·/ })).toBeTruthy();
  });

  it('« Dans 1 min » ne coche rien : la carte se retire une minute, l’ajout reste à faire', () => {
    monterEbullition();
    fireEvent.click(screen.getByRole('button', { name: /Dans 1 min/ }));
    expect(screen.queryByRole('button', { name: /Ajouté ·/ })).toBeNull();
    act(() => undefined);
  });
});
