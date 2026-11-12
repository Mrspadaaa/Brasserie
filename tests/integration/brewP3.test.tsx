import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { terminerLaJournee } from '../fixtures/brewTerminer';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, BrewDayState, RecipeSnapshot, YeastSpec } from '../../src/types';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
const audio = vi.hoisted(() => ({ armed: true }));
vi.mock('../../src/services/brewTimer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => true,
  isAudioArmed: () => audio.armed,
  beep: () => {}
}));

function brewDayBatch(yeast: YeastSpec, state?: Partial<BrewDayState>): Batch {
  const recipe = yeastFlowRecipe() as RecipeSnapshot;
  recipe.yeast = yeast;
  const brewDay: BrewDayState = { currentIndex: 0, startedAt: 10, steps: [{ id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }], readings: [], ...state };
  return { id: 'B-P3', name: 'Brassin p3', style: recipe.style, volumeL: recipe.volumeL, status: 'planifie', brewDate: '27.09.2026', plannedBrewDate: '27.09.2026', recipeSnapshot: recipe, brewDay } as Batch;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-27T12:00:00.000Z'));
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(StorageService, 'updateBatch').mockImplementation(() => {});
  vi.spyOn(StorageService, 'adjustInventory').mockReturnValue({ delta: -1 });
});
afterEach(() => {
  cleanup();
  brewerJobs.stop();
  vi.restoreAllMocks();
  vi.useRealTimers();
  localStorage.clear();
  audio.armed = true;
});

describe('p3 n° 1 et 2 : les bandeaux d’alerte restent collés en haut du conteneur qui défile', () => {
  it('`.bz-alerte` est sticky (top 0) dans brew-day.css (« Je veux pas louper un timing !! », 10.11)', () => {
    const racine = process.cwd();
    for (const f of ['src/pages/brew-day.css']) {
      const css = readFileSync(`${racine}/${f}`, 'utf8');
      const regle = css.match(/\.brew-page\.bz \.bz-alerte \{([^}]*)\}/g) ?? [];
      expect(regle.length, f).toBeGreaterThan(0);
      const corps = regle.join(' ');
      expect(corps, f).toMatch(/position:\s*sticky/);
      expect(corps, f).toMatch(/top:\s*0/);
      expect(corps, f).toMatch(/z-index:\s*\d+/);
    }
  });
});

describe('p3 n° 4 : « J’ai ajouté la levure » amène le choix de la quantité, puis la confirmation de clôture', () => {
  it('sans choix, le pied ouvre l’éditeur de la ligne Levure (colonne principale) ; « Prévue ajoutée » en un toucher ; la clôture se confirme', async () => {
    const finish = vi.fn();
    const yeast: YeastSpec = { name: 'Culture sèche', form: 'sèche', qty: 12, unit: 'g' };
    render(<BrewDayPage batch={brewDayBatch(yeast)} config={defaultConfig} onSave={vi.fn()} onFinish={finish} onClose={vi.fn()} />);
    const ligne = within(screen.getByRole('region', { name: 'Ingrédients à ajouter' }));
    expect(ligne.queryByRole('radiogroup', { name: 'Quantité de levure réellement ajoutée' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    // Rien n'est confirmé sans choix explicite : l'éditeur s'ouvre avec ses choix, pas le guide des Aides.
    expect(screen.queryByRole('button', { name: 'Confirmer la levure ajoutée' })).not.toBeInTheDocument();
    const choix = await within(screen.getByRole('region', { name: 'Ingrédients à ajouter' })).findByRole('radiogroup', { name: 'Quantité de levure réellement ajoutée' });
    expect(within(choix).getAllByRole('radio').map(r => r.textContent)).toEqual(['Prévue ajoutée', 'Mesurée', 'Sans mesure']);
    fireEvent.click(within(choix).getByRole('radio', { name: 'Prévue ajoutée' }));
    expect(within(choix).getByRole('radio', { name: 'Prévue ajoutée' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.getByText(/Quantité prévue explicitement confirmée : 12 g/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await terminerLaJournee();
    await waitFor(() => expect(finish).toHaveBeenCalledOnce());
    expect((finish.mock.calls[0][0] as Batch).brewDay).toMatchObject({ pitchQuantityConfirmation: 'planned', additions: { yeast: { amount: 12, unit: 'g' } } });
  });

  it('« Mesurée » : le champ reste vide (la dose prévue n’est pas présentée comme mesurée) ; la clôture attend une valeur', () => {
    const yeast: YeastSpec = { name: 'Culture sèche', form: 'sèche', qty: 12, unit: 'g' };
    render(<BrewDayPage batch={brewDayBatch(yeast)} config={defaultConfig} onSave={vi.fn()} onFinish={vi.fn()} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    const choix = screen.getByRole('radiogroup', { name: 'Quantité de levure réellement ajoutée' });
    fireEvent.click(within(choix).getByRole('radio', { name: 'Mesurée' }));
    const champ = screen.getAllByLabelText(/Quantité réelle de Culture sèche/)[0] as HTMLInputElement;
    expect(champ.value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.queryByRole('button', { name: 'Confirmer la levure ajoutée' })).not.toBeInTheDocument();
    fireEvent.change(champ, { target: { value: '11,5' } });
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.getByText(/Quantité mesurée : 11,5 g/)).toBeInTheDocument();
  });
});

describe('p3 : le choix du son se garde d’une session à l’autre', () => {
  it('le son choisi au picto est relu au montage ; coupé alors qu’une horloge tourne, le picto est en alerte', () => {
    const yeast: YeastSpec = { name: 'Culture sèche', form: 'sèche', qty: 12, unit: 'g' };
    const marche = { steps: [{ id: 'mash-0', label: 'Palier', tempC: 67, durationMin: 60, startedAt: Date.now() - 60_000, rampStartedAt: Date.now() - 120_000, holdStartedAt: Date.now() - 60_000 }] };
    const monter = () => render(<BrewDayPage batch={brewDayBatch(yeast, marche)} config={defaultConfig} onSave={vi.fn()} onFinish={vi.fn()} onClose={vi.fn()} />);
    const premier = monter();
    const picto = () => document.querySelector('[data-booster="son"]') as HTMLButtonElement;
    expect(picto()).toHaveAttribute('aria-pressed', 'false');
    expect(picto()).toHaveAttribute('data-alerte');
    fireEvent.click(picto());
    expect(picto()).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('laffinee.brew.son')).toBe('on');
    premier.unmount();
    monter();
    expect(picto()).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(picto());
    expect(picto()).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('laffinee.brew.son')).toBe('off');
    expect(picto()).toHaveAttribute('data-alerte');
  });

  it('son gardé mais pas encore armé (rechargement) : le picto est en alerte ; son toucher l’arme sans le couper', () => {
    localStorage.setItem('laffinee.brew.son', 'on');
    audio.armed = false;
    const yeast: YeastSpec = { name: 'Culture sèche', form: 'sèche', qty: 12, unit: 'g' };
    const marche = { steps: [{ id: 'mash-0', label: 'Palier', tempC: 67, durationMin: 60, startedAt: Date.now() - 60_000, rampStartedAt: Date.now() - 120_000, holdStartedAt: Date.now() - 60_000 }] };
    render(<BrewDayPage batch={brewDayBatch(yeast, marche)} config={defaultConfig} onSave={vi.fn()} onFinish={vi.fn()} onClose={vi.fn()} />);
    const picto = document.querySelector('[data-booster="son"]') as HTMLButtonElement;
    expect(picto).toHaveAttribute('aria-pressed', 'true');
    expect(picto).toHaveAttribute('data-alerte');
    fireEvent.click(picto);
    expect(picto).toHaveAttribute('aria-pressed', 'true');
    expect(picto).not.toHaveAttribute('data-alerte');
    expect(localStorage.getItem('laffinee.brew.son')).toBe('on');
  });
});
