import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, BrewDayState, BrewDayStep, RecipeSnapshot, YeastSpec } from '../../src/types';

/**
 * Voie p3 (11.11) : les cinq choix du jour de brassage portés tels que dessinés (page v3 : 1C, 2B/2C, 3C, 4C, 5C).
 * Chaque test échoue sur le tag en-ligne/2026-11-10-rapide avant sa correction (L13).
 */
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/brewAlarms', () => ({ enableBrewAlerts: vi.fn(), syncBrewAlerts: vi.fn() }));
vi.mock('../../src/services/brewTimer', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/services/brewTimer')>()),
  armAudio: () => true,
  isAudioArmed: () => true,
  beep: () => {}
}));

const racine = process.cwd();
const css = () => readFileSync(`${racine}/src/pages/brew-day.css`, 'utf8');

const SECHE_SANS_QUANTITE: YeastSpec = { name: 'SafAle US-05', lab: 'Fermentis', strain: 'US-05', form: 'sèche' } as YeastSpec;
const ETAPES: BrewDayStep[] = [
  { id: 'refroidissement', label: 'Refroidissement', durationMin: 0 },
  { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 }
];
function lot(yeast: YeastSpec, index = 1, state?: Partial<BrewDayState>): Batch {
  const recipe = yeastFlowRecipe() as RecipeSnapshot;
  recipe.yeast = yeast;
  recipe.volumeL = 19;
  recipe.ogTarget = 1.061;
  const brewDay: BrewDayState = { currentIndex: index, startedAt: 10, steps: ETAPES.map((s) => ({ ...s })), readings: [], ...state };
  return { id: 'B-P3', name: 'Brassin p3', style: recipe.style, volumeL: 19, status: 'planifie', brewDate: '27.09.2026', plannedBrewDate: '27.09.2026', recipeSnapshot: recipe, brewDay } as Batch;
}
const monter = (batch: Batch, onFinish = vi.fn()) =>
  render(<BrewDayPage batch={batch} config={defaultConfig} onSave={vi.fn()} onFinish={onFinish} onClose={vi.fn()} />);
const ligneIngredients = () => within(screen.getByRole('region', { name: 'Ingrédients à ajouter' }));

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
});

describe('5C : les chiffres du jour de brassage en police du texte, tabulaires, plus de chasse fixe', () => {
  it('brew-day.css ne nomme plus IBM Plex Mono et les chiffres gardent tabular-nums', () => {
    const source = css();
    expect(source).not.toMatch(/IBM Plex Mono/);
    expect(source).toMatch(/\.bz \.bz-m\s*\{[^}]*font-variant-numeric:\s*tabular-nums/);
    expect(source).toMatch(/\.bz-dose strong\s*\{[^}]*tabular-nums/);
  });
});

describe('1C : la dose de la levure dite en grammes et en g/hL, avec la source du poids ; la pastille suit la quantité', () => {
  const jauge = () => within(screen.getByRole('group', { name: 'Dose de la levure pour le volume' }));
  const ouvrir = (yeast: YeastSpec = SECHE_SANS_QUANTITE) => {
    monter(lot(yeast));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
  };
  it('avant tout choix : « à choisir », la plage du fabricant pour 19 L et la source du poids, aucun jour ni dose inventés', () => {
    ouvrir();
    expect(jauge().getByText('à choisir')).toBeInTheDocument();
    expect(jauge().getByText(/Pour 19 L prévus/)).toBeInTheDocument();
    expect(jauge().getByText('sachet 11,5 g · Fermentis · vu le 27.09.2026')).toBeInTheDocument();
    expect(screen.getByText('Plage du fabricant pour ce volume : 9,5 à 15,2 g.')).toBeInTheDocument();
  });
  it('« 1 sachet » : 11,5 g, 61 g/hL, dans la plage ; un sachet de plus : « 2 sachets » enfoncé, 23,0 g, 121 g/hL, au-dessus de la plage', () => {
    ouvrir();
    fireEvent.click(ligneIngredients().getByRole('radio', { name: '1 sachet' }));
    expect(jauge().getByText('11,5 g')).toBeInTheDocument();
    expect(jauge().getByText('61 g/hL')).toBeInTheDocument();
    expect(jauge().getByText('dans la plage')).toBeInTheDocument();
    fireEvent.click(ligneIngredients().getByRole('button', { name: /Augmenter/ }));
    expect(ligneIngredients().getByRole('radio', { name: '2 sachets' })).toHaveAttribute('aria-checked', 'true');
    expect(ligneIngredients().queryByRole('radio', { name: '1 sachet' })).not.toBeInTheDocument();
    expect(jauge().getByText('23,0 g')).toBeInTheDocument();
    expect(jauge().getByText('121 g/hL')).toBeInTheDocument();
    expect(jauge().getByText('au-dessus de la plage')).toBeInTheDocument();
  });
  it('une levure sans produit sûr au catalogue : aucun poids, aucune jauge', () => {
    ouvrir({ name: 'Levure maison', form: 'sèche' });
    expect(screen.queryByRole('group', { name: 'Dose de la levure pour le volume' })).not.toBeInTheDocument();
    expect(screen.queryByText(/sachet 11/)).not.toBeInTheDocument();
  });
});
