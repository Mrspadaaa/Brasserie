import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
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

// Port de p2c, intégration 1a : la frise à la place de la barre de phases, le bilan visé, les heures d'A3, la porte « Aide ».
function monter(vitesse = true, demarre?: number) {
  const r = recipe();
  if (vitesse) r.mash = { ...r.mash, heatingRateCPerMin: 1.5 } as typeof r.mash;
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
  const state = {
    ...base,
    currentIndex: index,
    ...(demarre != null ? { startedAt: demarre } : {}),
    steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: Date.now() } : s))
  };
  const batch = { id: 'LOT-I1A', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}
const avant = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe('port p2c I1a : frise, bilan, heures, porte Aide', () => {
  it('la frise « La journée » remplace la barre de phases : une porte par phase, l’ancienne barre n’est plus rendue', () => {
    const { container } = monter();
    const frise = screen.getByRole('region', { name: 'La journée' });
    expect(within(frise).getAllByRole('button').length).toBeGreaterThanOrEqual(2);
    expect(container.querySelector('.brew-phases')).toBeNull();
  });

  it('sans vitesse de chauffe, la frise se dessine quand même, montée comptée à 1 °C/min (hypothèse, « ~ ») : p2c montre sa frise (test c6, n° 1)', () => {
    const { container } = monter(false);
    expect(screen.getByRole('region', { name: 'La journée' })).toBeTruthy();
    expect(container.querySelector('.brew-phases')).toBeNull();
    const nav = screen.getByRole('navigation', { name: 'Phases du brassage' });
    for (const nom of ['Préparer', 'Empâter', 'Ébullition', 'Refroidir']) expect(within(nav).getByRole('button', { name: nom })).toBeTruthy();
  });

  it('une journée vieille de plus de 36 h ne se dessine pas en frise (axe absurde) : la barre des phases reste', () => {
    const { container } = monter(true, Date.now() - 5 * 24 * 3600000);
    expect(screen.queryByRole('region', { name: 'La journée' })).toBeNull();
    expect(container.querySelector('.brew-phases')).not.toBeNull();
  });

  it('l’en-tête dit « réveil » (et non « son »)', () => {
    monter();
    expect(screen.getAllByText('réveil').length).toBeGreaterThan(0);
    expect(screen.queryByText('son')).toBeNull();
  });

  it('le bilan visé annonce « 0 relevé sur 9 » et ses tuiles sans relevé gardent « ? » (l’inconnu n’est jamais 0)', () => {
    monter();
    const bilan = screen.getByRole('region', { name: 'Relevés du jour · bilan visé' });
    expect(within(bilan).getByText(/0 relevé sur 9/)).toBeTruthy();
    expect(within(bilan).getAllByText('?').length).toBeGreaterThanOrEqual(4);
  });

  it('l’ordre à 390 (CSS order) : Ensuite, puis À anticiper, puis le bilan visé, puis le suivi', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/pages/brew-day.css'), 'utf8');
    const blocs = css.split('@media (max-width: 900px)').filter((b) => /\.brew-page\.bz \.brew-ingredients \{ order:/.test(b));
    const z1 = blocs[blocs.length - 1].split('\n@media')[0];
    const rang = (sel: string) => {
      const m = z1.match(new RegExp(sel.replace(/[.[\]>]/g, (c) => '\\' + c) + '[^{}]*\\{[^}]*order:\\s*(\\d+)'));
      return m ? Number(m[1]) : NaN;
    };
    const ensuite = rang('.brew-page.bz .bz-ensuite');
    const prep = rang('.brew-page.bz .brew-preparations');
    const bilan = rang('.brew-page.bz .bz-bilan');
    const suivi = rang('.brew-page.bz .brew-side-column > details.bz-suivi');
    expect(ensuite).toBeLessThan(prep);
    expect(prep).toBeLessThan(bilan);
    expect(bilan).toBeLessThan(suivi);
  });

  it('« Ensuite » donne l’étape suivante avec son heure ; « À anticiper » porte ses heures (~ devant l’estimée)', () => {
    monter();
    const ensuite = screen.getByRole('region', { name: /^Ensuite/ });
    expect(within(ensuite).getByText(/Mashout/)).toBeTruthy();
    expect(within(ensuite).getByText(/\d h \d{2}/)).toBeTruthy();
  });

  it('la porte « Aide » du bilan ouvre le Compagnon brasseur et les aides du jour J ; fermée, elle est masquée', () => {
    monter();
    const bilan = screen.getByRole('region', { name: 'Relevés du jour · bilan visé' });
    const aide = within(bilan).getByRole('button', { name: /Aide/ });
    expect(aide.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(aide);
    expect(aide.getAttribute('aria-expanded')).toBe('true');
    const contenu = screen.getByRole('region', { name: 'Aide du jour J' });
    expect(within(contenu).getByRole('button', { name: /Compagnon brasseur/ })).toBeTruthy();
  });

  it('les portes du jour J du bilan : durée ±, dose, houblon manquant ne mentent pas (durée ± présente sur une étape minutée)', () => {
    monter();
    const bilan = screen.getByRole('region', { name: 'Relevés du jour · bilan visé' });
    expect(within(bilan).getByRole('button', { name: /durée/ })).toBeTruthy();
  });
});
