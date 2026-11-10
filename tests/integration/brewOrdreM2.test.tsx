import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
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

// Retouche pilote (10.11) : l'ordre de m2 — horloge, Relevés du jour, Grains, À anticiper, Suivi thermique (replié), Aides et repères.
function monter() {
  const r = recipe();
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
  const state = {
    ...base,
    currentIndex: index,
    steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: Date.now() } : s))
  };
  const batch = { id: 'LOT-M2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}
const avant = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('m2 : l’ordre des blocs de l’étape (DOM)', () => {
  it('« Relevés du jour » vient avant Grains', () => {
    monter();
    const releves = screen.getByRole('region', { name: 'Relevés de cette étape' });
    const grains = screen.getByRole('region', { name: 'Ingrédients à ajouter' });
    expect(avant(releves, grains)).toBe(true);
  });
  it('« Suivi thermique » est replié en bas : après À anticiper, avant Aides et repères, hors de l’horloge', () => {
    const { container } = monter();
    const suivi = screen.getByText('Suivi thermique').closest('details') as HTMLElement;
    const prep = screen.getByRole('region', { name: 'Préparations' });
    const aides = screen.getByText('Aides et repères').closest('details') as HTMLElement;
    expect(avant(prep, suivi)).toBe(true);
    expect(avant(suivi, aides)).toBe(true);
    expect(container.querySelector('.brew-station')?.contains(suivi)).toBe(false);
    expect(avant(screen.getByRole('region', { name: 'Ingrédients à ajouter' }), suivi)).toBe(true);
  });
});

describe('m2 : l’ordre des blocs à 390 (CSS `order`, bloc z1 final)', () => {
  const css = fs.readFileSync(path.resolve(__dirname, '../../src/pages/brew-day.css'), 'utf8');
  // Dernier bloc @media (max-width: 900px) qui donne un rang à .brew-ingredients : celui de z1 (.brew-page.bz).
  const blocs = css.split('@media (max-width: 900px)').filter((b) => /\.brew-page\.bz \.brew-ingredients \{ order:/.test(b));
  const z1 = blocs[blocs.length - 1].split('\n@media')[0];
  const rang = (selecteur: string) => {
    const m = z1.match(new RegExp(`${selecteur.replace(/[.[\]>\\]/g, (c) => `\\${c}`)}[^{}]*\\{[^}]*order:\\s*(\\d+)`));
    return m ? Number(m[1]) : NaN;
  };
  it('Relevés du jour (avec mesures attendues) passe avant Grains', () => {
    expect(rang('.brew-page.bz .brew-readings-summary[data-attendues]')).toBeLessThan(rang('.brew-page.bz .brew-ingredients'));
  });
  it('Suivi thermique : après À anticiper, avant Aides et repères', () => {
    const suivi = rang('.brew-page.bz .brew-side-column > details.bz-suivi');
    expect(suivi).toBeGreaterThanOrEqual(rang('.brew-page.bz .brew-preparations'));
    expect(suivi).toBeLessThan(rang('.brew-page.bz .bz-aides'));
  });
});

// Retouche pilote n° 3 : m2 ne dit que le verdict sur la feuille Mesurer ; la phrase d'aide vit dans « Pourquoi maintenant ».
import { fireEvent } from '@testing-library/react';
import { BrewDayMeasurements } from '../../src/ui/BrewDayMeasurements';
import type { BrewDayState, BrewDayStep, RecipeSnapshot } from '../../src/types';

describe('Mesurer : le premier plan ne garde que le verdict (m2)', () => {
  const T0 = 1_700_000_000_000;
  const palier: BrewDayStep = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
  const phrase = /Homogénéise, ajuste doucement puis remesure/;
  const feuille = () => {
    render(<BrewDayMeasurements step={palier} state={{ steps: [palier], currentIndex: 0, readings: [] } as unknown as BrewDayState}
      recipe={{ ogTarget: 1.062, volumeL: 24 } as unknown as RecipeSnapshot} update={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Température' }));
    fireEvent.change(screen.getByRole('slider', { name: /Température/ }), { target: { value: '65.2' } });
  };
  it('« Température sous la consigne. Homogénéise… » n’est pas au premier plan', () => {
    feuille();
    expect(screen.getByText(/sous/)).toBeInTheDocument(); // le verdict reste
    expect(screen.queryByText(phrase)).toBeNull();
  });
  it('elle est dite sous « Pourquoi maintenant »', () => {
    feuille();
    fireEvent.click(screen.getByRole('button', { name: /Pourquoi maintenant/ }));
    expect(screen.getByText(phrase)).toBeInTheDocument();
  });
});
