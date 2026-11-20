import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { Batch, BrewDayReading } from '../../src/types';
import { brewState, recipe } from '../fixtures/brewCompanion';

vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (original) => ({
  ...(await original<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => false
}));
afterEach(() => cleanup());

// Voie port-K, lot K2 (test d'écran c6 : n° 5 bandes « Et donc » après Enregistrer, n° 7 E3 aux réglages par défaut, « écarts dits deux fois »).
function monterPalier() {
  const r = recipe();
  r.mash = { ...r.mash, heatingRateCPerMin: 1.5 } as typeof r.mash;
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
  const state = { ...base, currentIndex: index, steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: Date.now() } : s)) };
  const batch = { id: 'LOT-K2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}

function monterAvantEbullition(releves: Partial<BrewDayReading>[]) {
  const r = recipe();
  const base = brewState(r);
  const index = Math.max(0, base.steps.findIndex((s) => s.id === 'preboil'));
  const maintenant = Date.now();
  const state = {
    ...base,
    currentIndex: index,
    startedAt: maintenant - 3600000,
    steps: base.steps.map((s, i) => (i < index ? { ...s, doneAt: maintenant - 120000 } : s)),
    readings: releves.map((x, i) => ({ id: `k2-${i}`, at: maintenant - 60000, stepId: 'preboil', ...x }) as BrewDayReading)
  };
  const batch = { id: 'LOT-K2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch;
  return render(<BrewDayPage batch={batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
}

// pm1 remplace la carte « Maintenant » (trois bandes sous · dans · sur) par la carte d'appel du palier. Ce que K2 n° 5 protège — le conseil
// « Et donc » de la bande lue (l'eau à ajouter par °C quand le palier est hors cible) — reste, en une ligne sous la valeur, avant comme
// après « Relever ». Dans la cible, la carte dit « dans la cible » et n'ajoute rien (l'ancienne bande « rien : l'horloge tourne »).
describe('port p2c K2 n° 5 : le « Et donc » de la valeur lue reste après Relever (carte d’appel pm1)', () => {
  it('hors cible, la ligne « Et donc » est dite avant comme après « Relever » ; dans la cible, aucune ligne en plus', () => {
    monterPalier();
    let carte = document.querySelector('[data-appel="ouvert"]') as HTMLElement;
    const [temp] = within(carte).getAllByRole('slider');
    fireEvent.change(temp, { target: { value: '67.1' } });
    expect(within(carte).getByText(/dans la cible 66 à 68/)).toBeTruthy();
    expect(carte.querySelector('[data-etdonc]')).toBeNull();
    fireEvent.change(temp, { target: { value: '65' } });
    carte = document.querySelector('[data-appel="ouvert"]') as HTMLElement;
    const avant = carte.querySelector('[data-etdonc]');
    expect(avant).toBeTruthy();
    expect(avant!.textContent).toMatch(/^Et donc : ≈ .* L d’eau bouillante par °C, remuer$/);
    fireEvent.click(within(carte).getByRole('button', { name: 'Relever' }));
    // la température est relevée, le pH reste à relever : la carte de la température garde sa ligne.
    carte = document.querySelector('[data-appel="ouvert"]') as HTMLElement;
    const apres = carte.querySelector('[data-carte="temperature"] [data-etdonc]');
    expect(apres?.textContent).toBe(avant!.textContent);
  });
});

describe('port p2c K2 n° 7 : E3 aux réglages par défaut', () => {
  it('un relevé sans référence de température ni évaporation : la carte parle, dit pourquoi et garde « Accepter »', () => {
    monterAvantEbullition([
      { kind: 'volume', value: 12, unit: 'L' },
      { kind: 'densite', value: 1.061, unit: 'SG' }
    ]);
    const carte = document.querySelector('.bm-now') as HTMLElement;
    expect(carte).toBeTruthy();
    expect(within(carte).getByTestId('maintenant-volume').textContent).toMatch(/12,0/);
    expect(within(carte).getByTestId('maintenant-densite').textContent).toMatch(/1,061/);
    expect(carte.textContent).toMatch(/Pas de cible calculable/);
    expect(carte.textContent).toMatch(/référence de température/);
    expect(carte.textContent).toMatch(/évaporation inconnue/);
    expect(carte.textContent).toMatch(/cible \?/);
    // Aucun chiffre inventé : ni « Bouillir + », ni extrait sec.
    expect(within(carte).queryByText(/Bouillir \+/)).toBeNull();
    const accepter = within(carte).getByRole('button', { name: /Accepter/ });
    expect(accepter.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(accepter);
    expect((document.querySelector('.bm-now') as HTMLElement).querySelector('[data-choix="accepter"]')?.getAttribute('aria-pressed')).toBe('true');
  });

  it('un couple à froid mais sans évaporation : la carte dit l’évaporation, pas la température', () => {
    monterAvantEbullition([
      { kind: 'volume', value: 12, unit: 'L', roomTemp: true, volumeBasis: 'cold' },
      { kind: 'densite', value: 1.061, unit: 'SG', roomTemp: true }
    ]);
    const carte = document.querySelector('.bm-now') as HTMLElement;
    expect(carte.textContent).toMatch(/évaporation inconnue/);
    expect(carte.textContent).not.toMatch(/sans référence de température/);
  });

  it('une seule grandeur relevée : pas de carte en paire', () => {
    monterAvantEbullition([{ kind: 'volume', value: 12, unit: 'L' }]);
    expect(screen.queryByText(/Pas de cible calculable/)).toBeNull();
  });
});

describe('port p2c K2 n° 8 : le volume au fermenteur relevé n’est plus « non relevé » à la clôture', () => {
  it('un volume noté sans référence de température garde son nombre dans la carte Levure', () => {
    const r = recipe();
    const base = brewState(r);
    const t = Date.now();
    const state = {
      ...base,
      currentIndex: base.steps.length - 1,
      startedAt: t - 5.5 * 3600000,
      pitchedAt: t - 60000,
      pitchQuantityConfirmation: 'planned' as const,
      additions: { ...base.additions, yeast: { amount: 1, unit: 'sachet', doneAt: t - 60000 } },
      readings: [{ id: 'k2-v', at: t - 300000, stepId: 'ensemencement', kind: 'volume', value: 19.7, unit: 'L', measurementStage: 'fermenter' } as BrewDayReading]
    };
    render(<BrewDayPage batch={{ id: 'LOT-K2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    const levure = screen.getByRole('region', { name: 'Levure' });
    expect(levure.textContent).not.toMatch(/volume au fermenteur non relevé/);
  });
});

describe('port p2c K2 : un écart n’est dit qu’une fois', () => {
  it('maische à 70 °C (hors de la bande) : l’écart est dans la tuile du bilan, pas dans une ligne d’avis en plus', () => {
    const r = recipe();
    const base = brewState(r);
    const index = Math.max(0, base.steps.findIndex((s) => /^mash/.test(s.id)));
    const t = Date.now();
    const palier = base.steps[index];
    const state = {
      ...base,
      currentIndex: index,
      steps: base.steps.map((s, i) => (i === index ? { ...s, startedAt: t - 60000 } : s)),
      readings: [{ id: 'k2-t', at: t - 30000, stepId: palier.id, kind: 'temperature', value: (palier.tempC ?? 67) + 3, unit: '°C', medium: 'wort' } as BrewDayReading]
    };
    render(<BrewDayPage batch={{ id: 'LOT-K2', name: r.name, recipeSnapshot: r, brewDay: state } as Batch} config={defaultConfig} onClose={vi.fn()} onSave={vi.fn()} onFinish={vi.fn()} />);
    expect(document.querySelector('.bz-avis-releve')).toBeNull();
    expect(document.body.textContent).not.toMatch(/au-dessus de la cible \d/);
  });
});

// La ligne « ✓ Relevé » (tout est relevé) garde, elle aussi, le « Et donc » d'une température relevée hors cible ; sans consigne, rien n'est dit.
import { AppelMesure, etDoncDe } from '../../src/ui/brassage/AppelMesure';
import { appelPalier } from '../../src/domain/appelMesure';
import type { Zone } from '../../src/domain/brewDayCalculs';

describe('port p2c K2 n° 5 : « Et donc » dans la ligne « ✓ Relevé » (pm1)', () => {
  const T0 = 1_700_000_000_000;
  const palier = { id: 'mash-1', label: 'Saccharification', durationMin: 60, tempC: 67, startedAt: T0 };
  const zones: Zone[] = [
    { borne: 'sous', libelle: 'sous 66', etDonc: '≈ 0,4 L d’eau bouillante par °C, remuer' },
    { borne: 'dans', libelle: '66–68', etDonc: 'rien : l’horloge tourne' },
    { borne: 'sur', libelle: 'sur 68', etDonc: null }
  ];
  const lecture = (id: string, kind: 'temperature' | 'ph', value: number, at: number) => ({ id, at, stepId: 'mash-1', kind, value, unit: kind === 'ph' ? '' : '°C' }) as BrewDayReading;
  const etat = (readings: BrewDayReading[]) => ({ steps: [palier], currentIndex: 0, readings }) as never;

  it('température relevée sous la cible : la ligne verte dit le conseil ; dans la cible ou sans consigne : rien en plus', () => {
    const sous = appelPalier(palier, etat([lecture('a', 'temperature', 64.5, T0 + 3e5), lecture('b', 'ph', 5.3, T0 + 16 * 6e4)]), undefined, T0 + 17 * 6e4)!;
    render(<AppelMesure appel={sous} onReleve={vi.fn()} zones={{ temperature: zones }} />);
    expect(screen.getByText(/Et donc : ≈ 0,4 L d’eau bouillante par °C, remuer/)).toBeTruthy();
    cleanup();
    const dans = appelPalier(palier, etat([lecture('a', 'temperature', 67.2, T0 + 3e5), lecture('b', 'ph', 5.3, T0 + 16 * 6e4)]), undefined, T0 + 17 * 6e4)!;
    render(<AppelMesure appel={dans} onReleve={vi.fn()} zones={{ temperature: zones }} />);
    expect(document.querySelector('[data-etdonc]')).toBeNull();
    // au-dessus, la bande « sur » n'a pas de consigne : rien n'est inventé.
    expect(etDoncDe(dans.temperature, 70, zones)).toBeNull();
    expect(etDoncDe(dans.temperature, 67.2, zones)).toBeNull();
    expect(etDoncDe(dans.temperature, 64.5, undefined)).toBeNull();
  });
});
