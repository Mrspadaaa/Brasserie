import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

// Voie port-K, lot K1 (test d'écran c6 : n° 3 piste de l'horloge, n° 4 horloge au contrôle avant ébullition).
function monter(etape: 'mash' | 'preboil') {
  const r = recipe();
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => (etape === 'mash' ? /^mash/.test(s.id) : s.id === 'preboil')));
  const maintenant = Date.now();
  const state = {
    ...base,
    currentIndex: index,
    startedAt: maintenant - 3600000,
    steps: base.steps.map((s, i) => (i === index && etape === 'mash' ? { ...s, startedAt: maintenant - 60000 } : i < index ? { ...s, doneAt: maintenant - 120000 } : s))
  };
  const batch = { id: 'LOT-K1', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}

describe('port p2c K1 : l’horloge et sa piste', () => {
  it('au palier : « fin … » puis « tenir … °C · couvercle », et la piste pose le pH et la fin', () => {
    const { container } = monter('mash');
    const horloge = container.querySelector('.bz-horloge') as HTMLElement;
    expect(horloge.textContent).toMatch(/fin\s*~?\d+ h \d{2}/);
    expect(horloge.textContent).toMatch(/tenir\s*\d+(,\d)? °C · couvercle/);
    const piste = within(horloge).getByRole('group', { name: 'Rendez-vous du palier' });
    expect(piste.textContent).toMatch(/pH · \d+ h \d{2} · dans \d+ min/);
    expect(piste.textContent).toContain('fin');
    expect(piste.querySelector('[data-point="fin"]')).not.toBeNull();
  });

  it('au contrôle avant ébullition : l’horloge de l’ébullition (« 60:00 ») avec « au premier bouillon » et ses ajouts', () => {
    const { container } = monter('preboil');
    const horloge = container.querySelector('[data-avant-ebullition]') as HTMLElement;
    expect(horloge).not.toBeNull();
    expect(within(horloge).getByLabelText('Durée de l’ébullition').textContent).toMatch(/^\d{2,3}:00$/);
    expect(horloge.textContent).toMatch(/au premier bouillon\s*~?(\d+ h \d{2}|\?)/);
    expect(within(horloge).getByRole('group', { name: 'Ajouts de l’ébullition à venir' })).toBeTruthy();
  });

  it('+5 sur l’horloge de l’ébullition à venir allonge la durée de 5 min (l’horloge suit)', () => {
    const { container } = monter('preboil');
    const horloge = container.querySelector('[data-avant-ebullition]') as HTMLElement;
    const lire = () => Number(within(horloge).getByLabelText('Durée de l’ébullition').textContent!.split(':')[0]);
    const avant = lire();
    fireEvent.click(within(horloge).getByRole('button', { name: 'Ajouter 5 minutes d’ébullition' }));
    expect(lire()).toBe(avant + 5);
    fireEvent.click(within(horloge).getByRole('button', { name: 'Retirer 1 minutes d’ébullition' }));
    expect(lire()).toBe(avant + 4);
  });

  it('ailleurs qu’au contrôle avant ébullition, pas d’horloge d’ébullition à venir', () => {
    const { container } = monter('mash');
    expect(container.querySelector('[data-avant-ebullition]')).toBeNull();
  });
});
