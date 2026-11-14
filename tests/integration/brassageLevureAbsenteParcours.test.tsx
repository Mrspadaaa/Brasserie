import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { terminerLaJournee } from '../fixtures/brewTerminer';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import type { Batch } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); });

// PC-1 : le jour de brassage d'une recette « malt seul » (ni houblon ni levure précisée), vu par le brasseur :
// il coche le malt, puis la levure, puis touche « J'ai ajouté la levure » ; il doit pouvoir arriver à la confirmation.
const recipeZZ = () => ({
  name: 'ZZ TEST', style: 'American Pale Ale', totalGristKg: 5, volumeL: 24, ogTarget: 1.05,
  fermentables: [{ name: 'ZZ malt', weightKg: 5, kind: 'grain', use: 'empatage' }], hops: [],
  yeast: { name: '', form: 'sèche', qty: 0, unit: '' }
});
function monter() {
  const b = { id: 'LOT-ZZ', name: 'ZZ', status: 'brassage', volumeL: 24, recipeSnapshot: recipeZZ(),
    brewDay: { currentIndex: 1, startedAt: Date.now() - 3600_000, readings: [], steps: [
      { id: 'mash-0', label: 'Empâtage', durationMin: 60, tempC: 67, doneAt: Date.now() - 1800_000 },
      { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }
    ] } } as unknown as Batch;
  const save = vi.fn(); const finish = vi.fn();
  render(<BrewDayPage batch={b} config={defaultConfig} onClose={() => {}} onSave={save} onFinish={finish} />);
  return { save, finish };
}

describe('PC-1 : la clôture du jour de brassage est atteignable avec une recette sans levure', () => {
  it('cocher la levure puis « J’ai ajouté la levure » mène à la confirmation, sans impasse', async () => {
    const { finish } = monter();

    for (const c of screen.queryAllByRole('checkbox')) if (!(c as HTMLInputElement).checked && !(c as HTMLInputElement).disabled) fireEvent.click(c);
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    const sans = screen.queryByRole('radio', { name: /Sans mesure|non mesurée/ });
    expect(sans).toBeTruthy();
    fireEvent.click(sans!);
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmer la levure ajoutée' }));
    // p2c E4 : la levure confirmée, la page reste sur la clôture et le bilan ; rien n'est fermé avant « Terminer ».
    await screen.findByRole('region', { name: 'Heure de fin' });
    expect(screen.getByRole('region', { name: 'Levure' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Synchroniser et clôturer' })).toHaveTextContent(/Terminer · \d+ h \d{2}/);
    expect(finish).not.toHaveBeenCalled();
    await terminerLaJournee();
    await waitFor(() => expect(finish).toHaveBeenCalledTimes(1));
    expect(finish.mock.calls[0][0]).toMatchObject({ status: 'fermentation' });
    expect(finish.mock.calls[0][0].brewDay.pitchQuantityConfirmation).toBe('unmeasured');
  });
});
