import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { ajoutsEnvoyables } from '../../src/domain/brewDay';
import type { Batch, BrewDayState } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

// PC-2 : « Quantité invalide. Réessayer · Recharger le serveur » (400, saveBrewSession) dès l'ensemencement. Cause lue en ligne :
// la coche « Ajouté : » d'une levure sans quantité écrit { doneAt } sans `amount` ; le serveur exige un `amount` fini (brewSessionCore l.222).
// Un inconnu n'est pas un 0 : la coche n'envoie rien, elle ouvre la saisie de la quantité.
const recipeZZ = () => ({
  name: 'ZZ TEST', style: 'American Pale Ale', totalGristKg: 5, volumeL: 24, ogTarget: 1.05,
  fermentables: [{ name: 'ZZ malt', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [],
  yeast: { name: '', form: 'sèche', qty: 0, unit: '' }
});

describe('PC-2 : la coche « Ajouté » d’une levure sans quantité ne produit pas un envoi invalide', () => {
  it('aucun état enregistré ne porte un ajout sans quantité finie, et la saisie de quantité s’ouvre', () => {
    const b = { id: 'LOT-ZZ', name: 'ZZ', status: 'brassage', volumeL: 24, recipeSnapshot: recipeZZ(),
      brewDay: { currentIndex: 1, startedAt: Date.now() - 3600_000, readings: [], steps: [
        { id: 'mash-0', label: 'Empâtage', durationMin: 60, tempC: 67, doneAt: Date.now() - 1800_000 },
        { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }
      ] } } as unknown as Batch;
    const save = vi.fn();
    render(<BrewDayPage batch={b} config={defaultConfig} onClose={() => {}} onSave={save} onFinish={() => {}} />);
    const caseLevure = screen.getAllByRole('checkbox').find((c) => /levure/i.test(c.getAttribute('aria-label') ?? '') || /Ajouté : $/.test(c.getAttribute('aria-label') ?? '')) as HTMLInputElement;
    expect(caseLevure, 'case de la levure').toBeTruthy();
    fireEvent.click(caseLevure);
    for (const [batch] of save.mock.calls) {
      for (const [id, a] of Object.entries((batch as Batch).brewDay?.additions ?? {})) {
        expect(Number.isFinite((a as { amount?: number }).amount), `ajout ${id} sans quantité finie : ${JSON.stringify(a)}`).toBe(true);
      }
    }
    expect(caseLevure.checked).toBe(false);
    expect(screen.queryAllByLabelText(/^Quantité réelle de/).length + screen.queryAllByRole('radio').length).toBeGreaterThan(0);
  });

  it('ajoutsEnvoyables retire un ajout sans quantité finie (brouillon déjà enregistré) et garde le 0', () => {
    const s = { additions: { yeast: { doneAt: 5 }, 'grain-0': { amount: 0, doneAt: 6 }, 'hop-0': { amount: 12, unit: 'g' }, nan: { amount: Number.NaN } } } as unknown as BrewDayState;
    const out = ajoutsEnvoyables(s);
    expect(Object.keys(out.additions ?? {}).sort()).toEqual(['grain-0', 'hop-0']);
    expect(out.additions!['grain-0'].amount).toBe(0);
    expect(s.additions!.yeast).toBeTruthy(); // l'état local n'est pas modifié
  });
});
