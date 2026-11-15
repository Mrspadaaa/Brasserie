import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage, dosePrevueLevure, texteDoseLevure, tuilesDuBilan } from '../../src/pages/BrewDayPage';
import { BrewCapturePanel } from '../../src/ui/BrewCapturePanel';
import { relevesDuJour } from '../../src/domain/brewDayBilan';
import { defaultConfig } from '../../src/services/storage';
import type { Batch, BrewDayReading } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

/** Lot K4 (test d'écran c6 sur p2c) : règles de texte et de comportement des n° 19, 22, 23, 24, 25 ; le rendu est capturé par la voie de vision. */
vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const css = readFileSync('src/pages/brew-day.css', 'utf8') + readFileSync('src/ui/brew-ingredients-ajouts.css', 'utf8');
const lecture = (x: Partial<BrewDayReading>): BrewDayReading => ({ id: String(Math.random()), at: 1000, stepId: 'preboil', kind: 'volume', value: 1, unit: 'L', ...x }) as BrewDayReading;

describe('n° 25 : la dose de levure prévue sur la tuile Ensemencement', () => {
  const sachet = { produitId: 'x', grammes: 11.5 };
  it('la dose de la recette, sinon « 1 sachet » d’une sèche au poids connu, sinon rien', () => {
    expect(dosePrevueLevure(recipe(), null)).toEqual({ amount: 1, unit: 'sachet' });
    const sansDose = { ...recipe(), yeast: { name: 'US-05', form: 'sèche' as const } };
    expect(dosePrevueLevure(sansDose, sachet as never)).toEqual({ amount: 1, unit: 'sachet' });
    expect(dosePrevueLevure(sansDose, null)).toBeUndefined();
    expect(dosePrevueLevure({ ...sansDose, yeast: { name: 'WLP001', form: 'liquide' as never } }, sachet as never)).toBeUndefined();
  });
  it('la dite : « 1 sachet », « 2 sachets », « 11,5 g »', () => {
    expect(texteDoseLevure({ amount: 1, unit: 'sachet' })).toBe('1 sachet');
    expect(texteDoseLevure({ amount: 2, unit: 'sachet' })).toBe('2 sachets');
    expect(texteDoseLevure({ amount: 11.5, unit: 'g' })).toBe('11,5 g');
  });
  it('la tuile Ensemencement porte « · 1 sachet » (p2c : cible 18 °C · 1 sachet)', () => {
    const r = recipe();
    const s = brewState(r);
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'ensemencement');
    expect(t).toBeTruthy();
    expect(t!.cible).toMatch(/1 sachet$/);
  });
  it('sans levure nommée, la tuile ne dit pas de dose', () => {
    const r = { ...recipe(), yeast: undefined };
    const s = brewState(r);
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'ensemencement');
    expect(t?.cible ?? '').not.toMatch(/sachet/);
  });
});

describe('n° 25 : « OG projetée » sur Avant ébullition hors cible', () => {
  // Le scénario unifié de p2c (même que tests/unit/brewDayCalculs.test.ts) : 27,9 L à 1,048 pour 28,5 L visés, OG 1,061, évaporation lue 4,5 L/h.
  const scenario = () => {
    const r = recipe({
      volumeL: 22, ogTarget: 1.061, totalGristKg: 8.6, preBoilL: 28.5, preBoilHotL: 28.5, boilMin: 60,
      fermentables: [
        { name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 6.6, potentialPpg: 37 },
        { name: 'Flocons', kind: 'grain', use: 'empatage', weightKg: 2, potentialPpg: 33 }
      ],
      brewhouse: { equipment: { kettleCapacityL: 50, kettleWorkingL: 40, spargeCapacityL: 30, fermenterCapacityL: 30, fermenterHeadspacePct: 20, roPackL: 20, boilOffLPerHour: 4.2, grainAbsorptionLPerKg: 1, grainDisplacementLPerKg: 0.7, coolingShrinkagePct: 0, heatingRateCPerMin: 1 } } as never
    });
    r.waterPlan!.mashWaterL = 18.5;
    const t = Date.UTC(2026, 10, 12, 14, 0);
    const s = brewState(r, { boilOffLPerHour: 4.5, readings: [lecture({ kind: 'volume', value: 27.9, at: t, roomTemp: true }), lecture({ kind: 'densite', value: 1.048, unit: 'SG', at: t + 60000, roomTemp: true })] });
    return { r, s };
  };
  it('hors cible et rien d’accepté : la ligne du bas dit l’OG sans correction, ou rien (jamais inventée)', () => {
    const { r, s } = scenario();
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'avant');
    expect(t!.etat).toBe('ecart');
    expect(t!.quand).toBe('OG projetée ≈ 1,057 sans correction');
  });
  it('une correction acceptée remplace la ligne (pas de « OG projetée »)', () => {
    const { r, s } = scenario();
    const pris = { ...s, boilCorrection: { id: 'accepter', at: 1, readingAt: 2, options: [], note: '' } } as never;
    const t = tuilesDuBilan(relevesDuJour(pris, r, Date.now()), r, pris).find((x) => x.id === 'avant');
    expect(t!.quand).not.toMatch(/OG projetée/);
  });
  it('à la clôture (mode « reel ») la tuile garde « relevé à … »', () => {
    const { r, s } = scenario();
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s, 'reel').find((x) => x.id === 'avant');
    expect(t!.quand).toMatch(/^relevé à /);
  });
  it('dans la cible : pas de « OG projetée »', () => {
    const r = recipe();
    const s = brewState(r);
    const t = tuilesDuBilan(relevesDuJour(s, r, Date.now()), r, s).find((x) => x.id === 'avant');
    expect(t?.quand ?? '').not.toMatch(/OG projetée/);
  });
});

describe('n° 23 : la saisie flottante a son voile à 1280', () => {
  const grandEcran = () => vi.stubGlobal('matchMedia', (q: string) => ({ matches: !/max-width/.test(q), media: q, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {} }));
  it('ouverte : un voile, qui la ferme au toucher ; fermée : pas de voile', () => {
    grandEcran();
    const fermer = vi.fn();
    const { container, rerender } = render(<BrewCapturePanel title="Mesurer" context="Empâtage" open={false} onClose={fermer}><p>champs</p></BrewCapturePanel>);
    expect(container.querySelector('.brew-capture-voile')).toBeNull();
    rerender(<BrewCapturePanel title="Mesurer" context="Empâtage" open onClose={fermer}><p>champs</p></BrewCapturePanel>);
    const voile = container.querySelector('.brew-capture-voile') as HTMLElement;
    expect(voile).toBeTruthy();
    fireEvent.click(voile);
    expect(fermer).toHaveBeenCalledTimes(1);
  });
  it('le voile passe derrière la saisie (z-index 29 contre 30) et couvre la page', () => {
    expect(css).toMatch(/\.brew-capture-voile\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*z-index:\s*29/);
    expect(css).toMatch(/\.brew-capture\.is-inline\[data-open\]\s*\{[^}]*z-index:\s*30/);
  });
});

describe('n° 19 : la ligne d’ajout ne se casse pas', () => {
  it('l’heure ne se coupe pas', () => expect(css).toMatch(/\.bz-quand\s*\{\s*white-space:\s*nowrap/));
});

describe('n° 22 : « houblon manquant » à toute étape', () => {
  it('à l’empâtage (aucun houblon à poser) la porte est là et dit où se remplace un houblon', () => {
    const r = recipe();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
    const state = { ...base, currentIndex: index, steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: Date.now() } : s)) };
    const batch = { id: 'LOT-K4', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'houblon manquant' }));
    expect(screen.getByText(/Pas de houblon à poser à cette étape/)).toBeInTheDocument();
  });
});

describe('n° 24 : la clôture est « Clôture », avec sa durée estimée', () => {
  it('titre « Clôture » (numéro d’étape + 1), « ensuite fermentation », pas de « Terminé · Annuler », « estimé » dit', () => {
    const r = recipe();
    const base = brewState(r);
    const t0 = Date.now() - 5.5 * 3600000;
    const state = {
      ...base,
      currentIndex: base.steps.length - 1,
      startedAt: t0,
      pitchedAt: Date.now() - 60000,
      pitchQuantityConfirmation: 'planned' as const,
      additions: { ...base.additions, yeast: { amount: 1, unit: 'sachet', doneAt: Date.now() - 60000 } }
    };
    const batch = { id: 'LOT-K4', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    const station = document.querySelector('.bz-etape') as HTMLElement;
    expect(station.querySelector('h2')?.textContent).toBe('Clôture');
    // Le numéro est celui de la dernière étape du parcours + 1 (p2c : « 12 Clôture »).
    expect(Number(station.querySelector('.bz-m')?.textContent)).toBeGreaterThan(1);
    expect(station.textContent).toMatch(/ensuite fermentation/);
    expect(screen.queryByText('Terminé · Annuler')).toBeNull();
    expect(screen.getByRole('region', { name: 'Heure de fin' })).toHaveTextContent(/estimé/);
  });
});
