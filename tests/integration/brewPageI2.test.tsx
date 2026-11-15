import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { phraseCorrection } from '../../src/ui/BrewJournal';
import { defaultConfig } from '../../src/services/storage';
import { Batch, BrewDayState } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';
import type { RecipeSnapshot } from '../../src/types';

// Le scénario unifié de p2c (celui de tests/unit/brewDayCalculs) : 27,9 L à 1,048 pour 28,5 L à 1,052 visés.
const equipment = {
  kettleCapacityL: 50, kettleWorkingL: 40, spargeCapacityL: 30, fermenterCapacityL: 30, fermenterHeadspacePct: 20,
  roPackL: 20, boilOffLPerHour: 4.2, grainAbsorptionLPerKg: 1, grainDisplacementLPerKg: 0.7, coolingShrinkagePct: 0, heatingRateCPerMin: 1
};
const recetteP2c = () => {
  const r = recipe({
    volumeL: 22, ogTarget: 1.061, totalGristKg: 8.6, preBoilL: 28.5, preBoilHotL: 28.5, boilMin: 60,
    fermentables: [
      { name: 'Pilsner', kind: 'grain', use: 'empatage', weightKg: 6.6, potentialPpg: 37 },
      { name: 'Flocons', kind: 'grain', use: 'empatage', weightKg: 2, potentialPpg: 33 }
    ],
    brewhouse: { equipment } as RecipeSnapshot['brewhouse']
  });
  r.waterPlan!.mashWaterL = 18.5;
  return r;
};

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => {
  cleanup();
  window.history.replaceState({}, '', '/');
});

// Port de p2c, intégration 2 : le choix d'E3 écrit, la clôture E4, l'adresse de la notification (G2).
const monter = (etat: (base: BrewDayState) => BrewDayState, id = 'LOT-I2') => {
  const r = recipe();
  r.ogTarget = 1.061;
  const batch = { id, name: r.name, recipeSnapshot: r, brewDay: etat(brewState(r)) } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
};
const avantEbullition = (b: BrewDayState): BrewDayState => {
  const i = Math.max(0, b.steps.findIndex((s) => s.id === 'preboil'));
  const at = Date.now() - 120000;
  return {
    ...b,
    currentIndex: i,
    readings: [
      { id: 'v', at, stepId: 'preboil', kind: 'volume', value: 27.9, unit: 'L', roomTemp: true, volumeBasis: 'cold' },
      { id: 'd', at, stepId: 'preboil', kind: 'densite', value: 1.048, unit: 'SG', roomTemp: true }
    ] as BrewDayState['readings']
  };
};

describe('port p2c I2 : le choix d’E3 s’écrit', () => {
  it('phraseCorrection : les trois choix se disent comme au journal de p2c', () => {
    const options = [
      { id: 'bouillir' as const, titre: 'Bouillir +20 min', detail: '≈ 22 L à 1,061 · fin ~16 h 40', minutesEbullition: 80 },
      { id: 'extrait' as const, titre: 'Extrait sec ≈ 250 g', detail: '≈ 23,4 L à 1,061 · au premier bouillon' },
      { id: 'accepter' as const, titre: 'Accepter', detail: 'OG ≈ 1,057 · ≈ 23,4 L' }
    ];
    expect(phraseCorrection({ choix: 'accepter', options })).toBe('accepté : OG ≈ 1,057');
    expect(phraseCorrection({ choix: 'bouillir', options })).toBe('bouilli +20 min : ≈ 22 L à 1,061');
    expect(phraseCorrection({ choix: 'extrait', options })).toBe('extrait sec ≈ 250 g : ≈ 23,4 L à 1,061');
  });

  it('un choix écrit pour la paire de même heure : la carte le montre appuyé, une autre paire l’annule', () => {
    const options = [{ id: 'accepter' as const, titre: 'Accepter', detail: 'OG ≈ 1,057 · ≈ 23,4 L' }];
    monter((b) => {
      const s = avantEbullition(b);
      const at = Math.max(...s.readings!.map((r) => r.at));
      return { ...s, boilCorrection: { choix: 'accepter', at: at + 1000, readingAt: at, options } };
    });
    const carte = document.querySelector('.bm-now') as HTMLElement;
    expect(carte).toBeTruthy();
    expect(within(carte).getByRole('button', { name: /Accepter/ })).toHaveAttribute('aria-pressed', 'true');
    cleanup();
    monter((b) => ({ ...avantEbullition(b), boilCorrection: { choix: 'accepter', at: 1, readingAt: 1, options } }));
    const autre = document.querySelector('.bm-now') as HTMLElement | null;
    if (autre) expect(within(autre).queryByRole('button', { pressed: true })).toBeNull();
  });

  it('toucher « Accepter » sur la carte écrit le choix dans l’état et au journal', () => {
    const r = recetteP2c();
    const batch = { id: 'LOT-I2', name: r.name, recipeSnapshot: r, brewDay: avantEbullition({ ...brewState(r), boilOffLPerHour: 4.5 }) } as Batch;
    render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    const carte = document.querySelector('.bm-now') as HTMLElement | null;
    // La fixture doit produire la carte paire hors cible avec ses choix ; sinon le test le dit au lieu de passer.
    expect(carte, 'carte paire absente : la fixture ne donne pas de moût hors cible').toBeTruthy();
    fireEvent.click(within(carte!).getByRole('button', { name: /Accepter/ }));
    expect(within(document.querySelector('.bm-now') as HTMLElement).getByRole('button', { name: /Accepter/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Journal' }));
    expect(screen.getByText(/accepté : OG ≈/)).toBeTruthy();
  });

  it('le journal de cuve dit « accepté : OG ≈ 1,057 »', () => {
    const options = [{ id: 'accepter' as const, titre: 'Accepter', detail: 'OG ≈ 1,057 · ≈ 23,4 L' }];
    monter((b) => {
      const s = avantEbullition(b);
      const at = Math.max(...s.readings!.map((r) => r.at));
      return { ...s, boilCorrection: { choix: 'accepter', at: at + 1000, readingAt: at, options } };
    });
    fireEvent.click(screen.getByRole('button', { name: 'Journal' }));
    expect(screen.getByText(/accepté : OG ≈ 1,057/)).toBeTruthy();
    expect(screen.getByText('Avant ébullition hors cible')).toBeTruthy();
  });
});

describe('port p2c I2 : la clôture (E4)', () => {
  it('levure ajoutée, dernière étape : bilan contre la cible, Levure, Au journal, pied « Terminer · heure »', () => {
    const t0 = Date.now() - 5.5 * 3600000;
    monter((b) => ({
      ...b,
      currentIndex: b.steps.length - 1,
      startedAt: t0,
      pitchedAt: Date.now() - 60000,
      pitchQuantityConfirmation: 'planned',
      additions: { ...b.additions, yeast: { amount: 1, unit: 'sachet', doneAt: Date.now() - 60000 } }
    }));
    expect(screen.getByRole('region', { name: 'Relevés du jour · bilan contre la cible' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Heure de fin' })).toHaveTextContent(/5 h 3\d/);
    expect(screen.getByRole('region', { name: 'Levure' })).toBeTruthy();
    expect(screen.getByText('Au journal')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Synchroniser et clôturer' })).toHaveTextContent(/Terminer · \d+ h \d{2}/);
    // l'ancien bilan visé et « À anticiper » ne sont plus là.
    expect(screen.queryByRole('region', { name: 'Relevés du jour · bilan visé' })).toBeNull();
    expect(screen.queryByRole('region', { name: 'Préparations' })).toBeNull();
  });
});

describe('port p2c I2 : « Ajouté » venu de la notification (G2)', () => {
  it('?brewday=…&ajoute=…&a=… coche à l’heure du toucher et nettoie l’adresse', () => {
    const toucher = Date.now() - 3 * 60000;
    const id = 'LOT-I2';
    window.history.replaceState({}, '', `/?brewday=${id}&ajoute=hop-0,hop-1,hop-2,hop-3&a=${toucher}`);
    const r = recipe();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => /^boil/.test(s.id)));
    const duree = r.boilMin ?? 60;
    const etat = { ...base, currentIndex: index, boilDurationMin: duree, boilStartedAt: Date.now() - (duree - 4) * 60000 };
    const onSave = vi.fn();
    act(() => {
      render(<BrewDayPage batch={{ id, name: r.name, recipeSnapshot: r, brewDay: etat } as Batch} config={defaultConfig} onClose={vi.fn()} onSave={onSave} onFinish={vi.fn()} />);
    });
    // l'ajout échu est coché : plus de bouton « Ajouté · heure » à toucher dans la carte d'appel.
    expect(screen.queryByRole('button', { name: /^Ajouté · \d/ })).toBeNull();
    expect(window.location.search).not.toContain('ajoute');
    expect(window.location.search).toContain('brewday=');
  });
});
