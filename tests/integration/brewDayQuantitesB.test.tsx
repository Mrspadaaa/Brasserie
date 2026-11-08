import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import type { Batch, BrewDayState } from '../../src/types';
import { recipe, brewState } from '../fixtures/brewCompanion';
import { brewAlarms } from '../../src/domain/brewCompanion';
import { formatAmount } from '../../functions/src/brewAmount';
import { actualQuantityProblem } from '../../src/domain/brewQuantityBounds';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear(); });

function mount(over: Parameters<typeof recipe>[0] = {}) {
  const r = recipe(over);
  const save = vi.fn();
  const batch = { id: 'LOT-TEST', name: r.name, recipeSnapshot: r, brewDay: brewState(r, {}) } as Batch;
  render(<BrewDayPage batch={batch} config={defaultConfig} stockItems={[]} onClose={() => {}} onFinish={() => {}} onSave={save} />);
  return { latest: () => save.mock.calls.at(-1)?.[0].brewDay as BrewDayState | undefined };
}

describe('BR-50 / BR-53 / BE-31 / BE-34 : quantités réelles bornées, et le refus se dit', () => {
  it('« -1 » et « 99999 » ne s’enregistrent pas et affichent un message ; 15 passe', () => {
    const v = mount();
    fireEvent.click(screen.getByRole('button', { name: /Modifier la quantité de Sel d’Epsom/ }));
    const dose = screen.getByLabelText(/Quantité réelle de Sel d’Epsom/);
    fireEvent.change(dose, { target: { value: '-1' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/ne peut pas être négative/);
    expect(v.latest()?.additions?.['salt-mash-epsom']?.amount).toBeUndefined();
    fireEvent.change(dose, { target: { value: '99999' } });
    expect(screen.getByRole('alert')).toHaveTextContent(/erreur de saisie probable/);
    expect(v.latest()?.additions?.['salt-mash-epsom']?.amount).toBeUndefined();
    fireEvent.change(dose, { target: { value: '15' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(v.latest()!.additions!['salt-mash-epsom'].amount).toBe(15);
  });
});

describe('BR-52 / BE-33 : pas de sélecteur vide', () => {
  it('sans plan d’eau, « Autre sel ou acide » n’ouvre pas une liste vide : une phrase le dit', () => {
    mount({ waterPlan: undefined });
    expect(screen.queryByRole('button', { name: 'Autre sel ou acide à consigner' })).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun autre sel ni acide à ajouter/)).toBeInTheDocument();
  });
  it('avec un plan d’eau, le sélecteur reste', () => {
    mount();
    expect(screen.getByRole('button', { name: 'Autre sel ou acide à consigner' })).toBeInTheDocument();
  });
});

describe('BR-55 / BE-36 : le bandeau d’alarme écrit la quantité lisible', () => {
  it('« Ajout en cuve » dit « 123 g Lactose », pas « 0.12345 kg »', () => {
    const base = recipe();
    const r = { ...base, fermentables: [...(base.fermentables ?? []), { name: 'Lactose', kind: 'sugar', weightKg: 0.12345, use: 'ebullition', colorEbc: 0 }] } as typeof base;
    const alarm = brewAlarms(brewState(r, { boilStartedAt: Date.now() }), r).find((a) => a.title === 'Ajout en cuve' && /Lactose/.test(a.body));
    expect(alarm?.body).toContain('123 g Lactose');
    expect(alarm?.body).not.toMatch(/\d\.\d/);
  });
});

describe('bornes et écriture des quantités (pur)', () => {
  it('plancher par unité et cinq fois le prévu', () => {
    expect(actualQuantityProblem(99999, 3, 'g')).toMatch(/au-delà de 500 g/);
    expect(actualQuantityProblem(400, 3, 'g')).toBeNull();
    expect(actualQuantityProblem(99999, 16, 'L')).toMatch(/au-delà de 200 L/);
    expect(actualQuantityProblem(250, 100, 'g')).toBeNull();
    expect(actualQuantityProblem(0, 100, 'g')).toBeNull();
    expect(actualQuantityProblem(-1, 100, 'g')).toMatch(/négative/);
  });
  it('BR-55 / BR-56 : 0.12345 kg s’écrit « 123 g », jamais de point ni 5 décimales', () => {
    expect(formatAmount(0.12345, 'kg')).toBe('123 g');
    expect(formatAmount(2.5, 'kg')).toBe('2,5 kg');
    expect(formatAmount(16.494, 'L')).toBe('16,5 L');
    expect(formatAmount(1.2371, 'g')).toBe('1,24 g');
    expect(formatAmount(Number.NaN, 'g')).toBe('— g');
  });
});
