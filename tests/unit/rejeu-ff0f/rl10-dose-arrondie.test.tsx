// @vitest-environment jsdom
// Rejeu en ligne ff0f822e (08.11), RL-10 : une dose réelle de sel « 1,23456 » était acceptée avec 5 décimales. Elle s'arrondit à la précision de l'unité
// (g : 0,01 — la balance de précision d'une micro-brasserie ; kg : 0,001) et s'affiche arrondie.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../../src/pages/BrewDayPage';
import { defaultConfig } from '../../../src/services/storage';
import type { Batch, BrewDayState } from '../../../src/types';
import { recipe, brewState } from '../../fixtures/brewCompanion';
import { actualQuantityRounded } from '../../../src/domain/brewQuantityBounds';

vi.mock('../../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../../src/services/brewTimer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../src/services/brewTimer')>()),
  armAudio: () => false,
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

describe('actualQuantityRounded', () => {
  it('g, mL, L : 2 décimales ; kg : 3 ; les valeurs rondes ne bougent pas', () => {
    expect(actualQuantityRounded(1.23456, 'g')).toBe(1.23);
    expect(actualQuantityRounded(1.23556, 'mL')).toBe(1.24);
    expect(actualQuantityRounded(1.23456, 'kg')).toBe(1.235);
    expect(actualQuantityRounded(15, 'g')).toBe(15);
  });
});

describe('RL-10 — la dose réelle d’un sel s’arrondit', () => {
  it('« 1,23456 » g est retenu 1,23 g, et le champ l’affiche ainsi à la sortie', () => {
    const r = recipe();
    const save = vi.fn();
    const batch = { id: 'LOT-TEST', name: r.name, recipeSnapshot: r, brewDay: brewState(r, {}) } as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} stockItems={[]} onClose={() => {}} onFinish={() => {}} onSave={save} />);
    fireEvent.click(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ }));
    const dose = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/) as HTMLInputElement;
    dose.focus();
    fireEvent.change(dose, { target: { value: '1,23456' } });
    fireEvent.blur(dose);
    const state = save.mock.calls.at(-1)?.[0].brewDay as BrewDayState;
    expect(state.additions!['salt-mash-epsom'].amount).toBe(1.23);
    expect(dose.value).toBe('1,23');
  });
});
