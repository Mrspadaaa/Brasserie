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

// pm1 (mission port-simplicité, 20.11) remplace la carte « Maintenant » d'une seule mesure par la carte d'appel du palier :
// la température et le pH au curseur, « Relever » et « Plus tard ». L'intention de I1b reste : le relevé dû est en tête de la conduite,
// rien n'est noté sans le toucher du brasseur, aucun champ numérique natif, et un relevé fait se lit « ✓ ».
describe('port p2c I1b : le relevé dû au palier (E1, repris par pm1)', () => {
  it('un palier lancé : la carte d’appel est en tête, la température est « à relever » (proposée, à confirmer), rien n’est noté avant « Relever »', () => {
    monterPalier();
    const carte = document.querySelector('[data-appel="ouvert"]') as HTMLElement;
    expect(carte).toBeTruthy();
    expect(document.querySelector('.bm-now')).toBeNull();
    const temperature = carte.querySelector('[data-carte="temperature"]') as HTMLElement;
    expect(within(temperature).getByText(/à relever/)).toBeTruthy();
    expect(within(temperature).getByText('proposé, à confirmer')).toBeTruthy();
    expect(within(carte).getByRole('button', { name: 'Relever' })).toBeEnabled();
    expect(within(carte).getByRole('button', { name: 'Plus tard' })).toBeTruthy();
    // « Plus tard » n'écrit rien : la carte se replie et « reste à relever ».
    fireEvent.click(within(carte).getByRole('button', { name: 'Plus tard' }));
    const replie = document.querySelector('[data-appel="replie"]') as HTMLElement;
    expect(replie.textContent).toMatch(/à relever/);
    expect(screen.queryByText(/✓ Relevé/)).toBeNull();
    // aucun champ numérique natif : le curseur porte le geste.
    expect(document.querySelector('[data-appel] input[type="number"]')).toBeNull();
  });

  it('poser les curseurs puis « Relever » : les relevés entrent, la carte devient la ligne « ✓ Relevé » avec leurs valeurs', () => {
    monterPalier();
    const carte = document.querySelector('[data-appel="ouvert"]') as HTMLElement;
    const [temp, ph] = within(carte).getAllByRole('slider');
    fireEvent.change(temp, { target: { value: '67.4' } });
    fireEvent.change(ph, { target: { value: '5.32' } });
    fireEvent.click(within(carte).getByRole('button', { name: 'Relever' }));
    const fait = document.querySelector('[data-appel="fait"]') as HTMLElement;
    expect(fait).toBeTruthy();
    expect(fait.textContent).toMatch(/✓ Relevé/);
    expect(within(fait).getByText(/67,4/)).toBeTruthy();
    expect(within(fait).getByText(/5,32/)).toBeTruthy();
    expect(within(fait).queryByRole('button')).toBeNull();
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
