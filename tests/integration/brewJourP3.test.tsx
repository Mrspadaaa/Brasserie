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
function lot(yeast: YeastSpec, index = 1, state?: Partial<BrewDayState>, hops?: RecipeSnapshot['hops']): Batch {
  const recipe = yeastFlowRecipe() as RecipeSnapshot;
  if (hops) recipe.hops = hops;
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

describe('4C : « Sortir la levure … » dans À anticiper, à l’ébullition (là où la maquette z1 la place), avec le poids seulement s’il vient du catalogue', () => {
  const EBU: BrewDayStep = { id: 'boil-0', label: 'Ébullition', durationMin: 60, boilElapsedMin: 0 };
  const surEbullition = (yeast: YeastSpec) => monter(lot(yeast, 0, { steps: [EBU, ...ETAPES].map((s) => ({ ...s })) }));
  it('US-05 : la ligne et sa sous-ligne « quantité choisie à l’ensemencement · 1 sachet = 11,5 g », cochable', () => {
    surEbullition(SECHE_SANS_QUANTITE);
    const anticiper = within(screen.getByRole('region', { name: 'Préparations' }));
    expect(anticiper.getByText('Sortir la levure SafAle US-05')).toBeInTheDocument();
    expect(anticiper.getByText('quantité choisie à l’ensemencement · 1 sachet = 11,5 g')).toBeInTheDocument();
    const case_ = anticiper.getByRole('checkbox', { name: /Sortir la levure SafAle US-05/ });
    fireEvent.click(case_);
    expect(case_).toBeChecked();
  });
  it('une levure sans produit sûr : la ligne, mais aucune sous-ligne de poids', () => {
    surEbullition({ name: 'Levure maison', form: 'sèche' });
    const anticiper = within(screen.getByRole('region', { name: 'Préparations' }));
    expect(anticiper.getByText('Sortir la levure Levure maison')).toBeInTheDocument();
    expect(anticiper.queryByText(/1 sachet =/)).not.toBeInTheDocument();
  });
  it('à l’ensemencement, la levure est déjà là : plus de rappel', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    expect(screen.queryByText(/Sortir la levure/)).not.toBeInTheDocument();
  });
});

describe('2B et 2C : plus de panneau Houblons dans Aides à l’ébullition ; à l’ensemencement, une ligne « À cru » (g, g/L, phase, aucun jour inventé)', () => {
  const EBU: BrewDayStep = { id: 'boil-0', label: 'Ébullition', durationMin: 60, boilElapsedMin: 0 };
  const A_CRU = [
    { name: 'Hallertau', stage: 'boil', weightG: 20, alpha: 4, timeMin: 60 },
    { name: 'Citra', stage: 'dryHop', weightG: 85, alpha: 0 },
    { name: 'Galaxy', stage: 'dryHop', weightG: 43, alpha: 0 },
    { name: 'Mosaic', stage: 'dryHop', weightG: 43, alpha: 0 }
  ] as unknown as RecipeSnapshot['hops'];
  const ouvrirAides = () => {
    const resume = screen.getByText('Aides et repères');
    fireEvent.click(resume);
    return within(resume.closest('details') as HTMLElement);
  };
  it('2B : à l’ébullition, le panneau « Houblons — vigilances et potentiel » a disparu des Aides ; l’aide à cette étape reste', () => {
    monter(lot(SECHE_SANS_QUANTITE, 0, { steps: [EBU, ...ETAPES].map((s) => ({ ...s })) }, A_CRU));
    const aides = ouvrirAides();
    expect(aides.queryByText('vigilances et potentiel')).not.toBeInTheDocument();
    expect(aides.getByText('Aide à cette étape')).toBeInTheDocument();
  });
  it('2C : à l’ensemencement, « À cru · 171 g · 9 g/L », trois puces, « phase ? » et aucun jour ; Aides ouvert d’emblée', () => {
    monter(lot(SECHE_SANS_QUANTITE, 1, undefined, A_CRU));
    const ligne = screen.getByRole('group', { name: 'À cru' });
    const l = within(ligne);
    expect(l.getByText('171 g · 9 g/L')).toBeInTheDocument();
    for (const puce of ['Citra 85', 'Galaxy 43', 'Mosaic 43']) expect(l.getByText(puce)).toBeInTheDocument();
    expect(l.getByText('phase ?')).toBeInTheDocument();
    expect(ligne.textContent).not.toMatch(/\bJ\+|\bjour/i);
    expect(screen.queryByText('vigilances et potentiel')).not.toBeInTheDocument();
    expect((screen.getByText('Aides et repères').closest('details') as HTMLDetailsElement).open).toBe(true);
  });
  it('2C : dépliée, une ligne par houblon avec ses g, ses g/L et sa phase ; sans dry hop, aucune ligne', () => {
    monter(lot(SECHE_SANS_QUANTITE, 1, undefined, A_CRU));
    const ligne = screen.getByRole('group', { name: 'À cru' });
    fireEvent.click(within(ligne).getByText('À cru'));
    expect(within(ligne).getByText('Citra · 85 g · 4,5 g/L · phase ?')).toBeInTheDocument();
    cleanup();
    monter(lot(SECHE_SANS_QUANTITE, 1, undefined, [{ name: 'Hallertau', stage: 'boil', weightG: 20, alpha: 4, timeMin: 60 }] as unknown as RecipeSnapshot['hops']));
    expect(screen.queryByRole('group', { name: 'À cru' })).not.toBeInTheDocument();
  });
});
