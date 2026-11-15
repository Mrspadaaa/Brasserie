// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { Batch } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
// La sonnerie « joue » : useBrewSound passe en ringing, donc l'appel s'ouvre en plein écran.
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => true,
  playBrewAlarm: () => true,
  stopBrewAlarm: () => undefined
}));
afterEach(() => {
  cleanup();
  window.localStorage.removeItem('laffinee.brew.son');
});

// Port p2c I2 (6) : sous le plein écran de l'appel, l'en-tête et le pied de la coque ne sont plus actifs ; ils le redeviennent à la fin.
describe('port p2c I2 : inert sous le plein écran de l’appel', () => {
  it('header et footer de .page-shell reçoivent inert pendant la sonnerie, et le perdent à « Ajouté »', async () => {
    window.localStorage.setItem('laffinee.brew.son', 'on');
    const r = recipe();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => /^boil/.test(s.id)));
    // L'ébullition vient de commencer : l'ajout du départ est échu depuis 30 s (dans la fenêtre de sonnerie de 5 min).
    const etat = { ...base, currentIndex: index, boilDurationMin: r.boilMin ?? 60, boilStartedAt: Date.now() - 30000 };
    const batch = { id: 'LOT-I2-INERT', name: r.name, recipeSnapshot: r, brewDay: etat } as Batch;
    const { container } = render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    // L'en-tête et le pied sont ceux de la vraie coque (PageShell) de la page.
    const coque = () => container.querySelector('.page-shell') as HTMLElement;
    const autour = () => [...coque().children].filter((el) => el.tagName === 'HEADER' || el.tagName === 'FOOTER');
    expect(autour().length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('alertdialog')).toBeTruthy();
    expect(autour().every((el) => el.hasAttribute('inert'))).toBe(true);
    const ajoute = [...container.querySelectorAll('button')].find((b) => /^Ajouté ·/.test(b.textContent ?? ''));
    expect(ajoute).toBeTruthy();
    await act(async () => { ajoute!.click(); });
    expect(document.querySelector('.bap-plein')).toBeNull();
    expect(autour().some((el) => el.hasAttribute('inert'))).toBe(false);
  });
});
