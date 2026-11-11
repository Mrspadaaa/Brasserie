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
    expect(jauge().getByText('dans la plage fabricant')).toBeInTheDocument();
    fireEvent.click(ligneIngredients().getByRole('button', { name: /Augmenter/ }));
    expect(ligneIngredients().getByRole('radio', { name: '2 sachets' })).toHaveAttribute('aria-checked', 'true');
    expect(ligneIngredients().queryByRole('radio', { name: '1 sachet' })).not.toBeInTheDocument();
    expect(jauge().getByText('23,0 g')).toBeInTheDocument();
    expect(jauge().getByText('121 g/hL')).toBeInTheDocument();
    expect(jauge().getByText('au-dessus de la plage')).toBeInTheDocument();
  });
  // 11.11, « C'est vraiment bien, implémente comme telle » : c1c-repos / c1c-apres / c1c-deux n'ont ni « Unité réelle », ni « Pas de dose prévue », et les trois boutons tiennent sur une ligne.
  it('c1c-repos : avant tout choix, l’éditeur n’affiche ni « Unité réelle : À choisir » ni « Pas de dose prévue » (la pastille « à choisir » le dit)', () => {
    ouvrir();
    expect(ligneIngredients().queryByLabelText('Unité de la quantité réelle de levure')).not.toBeInTheDocument();
    expect(ligneIngredients().queryByText(/Pas de dose prévue/)).not.toBeInTheDocument();
    fireEvent.click(ligneIngredients().getByRole('radio', { name: '1 sachet' }));
    expect(ligneIngredients().queryByLabelText('Unité de la quantité réelle de levure')).not.toBeInTheDocument();
    expect(ligneIngredients().queryByText(/Pas de dose prévue/)).not.toBeInTheDocument();
  });
  it('c1c : la pastille de la ligne dit « à choisir » puis « 1 sachet » puis « 2 sachets » (pluriel), le pas « ? sachet » avant le choix', () => {
    ouvrir();
    const ligne = ligneIngredients();
    expect(ligne.getByRole('button', { name: /Modifier la quantité de SafAle US-05/ })).toHaveTextContent('à choisir');
    expect(ligne.getByLabelText(/Quantité réelle de SafAle/)).toHaveAttribute('placeholder', '?');
    fireEvent.click(ligne.getByRole('radio', { name: '1 sachet' }));
    expect(ligne.getByRole('button', { name: /Modifier la quantité de SafAle US-05/ })).toHaveTextContent('1 sachet');
    fireEvent.click(ligne.getByRole('button', { name: /Augmenter/ }));
    expect(ligne.getByRole('button', { name: /Modifier la quantité de SafAle US-05/ })).toHaveTextContent('2 sachets');
  });
  it('« Mesurée » : l’unité reste à choisir (c’est elle qui donne le sens de la mesure)', () => {
    ouvrir();
    fireEvent.click(ligneIngredients().getByRole('radio', { name: 'Mesurée' }));
    expect(ligneIngredients().getByLabelText('Unité de la quantité réelle de levure')).toBeInTheDocument();
  });
  it('la ligne Levure sans choix garde « Pas de dose prévue » quand l’éditeur est fermé (le test C3 le demande)', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    expect(ligneIngredients().getByText(/Pas de dose prévue/)).toBeInTheDocument();
  });
  it('c1c : les boutons de quantité sur une seule ligne (flex qui passe à la ligne, plus une grille à 2 colonnes), la jauge sur toute la largeur', () => {
    const source = css();
    const choix = source.match(/\.bz-levure-choix\s*\{[^}]*\}/)![0];
    expect(choix).toMatch(/display:\s*flex/);
    expect(choix).not.toMatch(/grid-template-columns/);
    expect(source.match(/\.bz-jauge\s*\{[^}]*\}/)![0]).toMatch(/flex:\s*1 1 100%|flex-basis:\s*100%/);
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

describe('3C : la fenêtre de clôture porte les curseurs densité et volume (crayon, étalonnage, aide, Pourquoi maintenant)', () => {
  const ouvrirCloture = (fini = vi.fn()) => {
    monter(lot(SECHE_SANS_QUANTITE), fini);
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    fireEvent.click(ligneIngredients().getByRole('radio', { name: '1 sachet' }));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    const fenetre = screen.getByRole('dialog');
    return { fini, fenetre: within(fenetre), noeud: fenetre };
  };
  const densite = () => within(screen.getByRole('group', { name: 'Densité initiale' }));
  const volume = () => within(screen.getByRole('group', { name: 'Au fermenteur' }));
  it('deux blocs : valeur « ? » (jamais 0), crayon, pas, case, curseur, cible ou repère, aide', () => {
    const { fenetre } = ouvrirCloture();
    expect(fenetre.getAllByText('Confirmer l’ajout de levure ?').length).toBeGreaterThan(0);
    expect(densite().getByText('moût refroidi')).toBeInTheDocument();
    expect(densite().getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('?');
    expect(densite().getByRole('button', { name: 'moins 0,001' })).toBeInTheDocument();
    expect(densite().getByRole('button', { name: 'plus 0,001' })).toBeInTheDocument();
    expect(densite().getByRole('checkbox', { name: 'Densité refroidie ou corrigée à l’étalonnage' })).not.toBeChecked();
    expect(densite().getByRole('slider', { name: 'Densité, curseur' })).toBeInTheDocument();
    expect(densite().getByText('1,059–1,063').closest('p')).toHaveTextContent('cible 1,059–1,063');
    expect(densite().getByText('Densité sur échantillon refroidi ; 1056 est accepté pour 1,056.')).toBeInTheDocument();
    expect(volume().getByText('au transfert')).toBeInTheDocument();
    expect(volume().getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('?');
    expect(volume().getByRole('button', { name: 'moins 0,1' })).toBeInTheDocument();
    expect(volume().getByRole('checkbox', { name: 'Volume ramené à 20 °C' })).not.toBeChecked();
    expect(volume().getByRole('slider', { name: 'Volume, curseur' })).toBeInTheDocument();
    expect(volume().getByText('repère', { exact: false })).toHaveTextContent('repère 19,0 L');
  });
  it('« Pourquoi maintenant » dit les deux raisons ; la phrase « Densité initiale pas relevée » ne se lit plus qu’aux lecteurs d’écran', () => {
    const { fenetre, noeud } = ouvrirCloture();
    expect(fenetre.queryByText(/Moût refroidi, avant l’ensemencement/)).not.toBeInTheDocument();
    fireEvent.click(fenetre.getByRole('button', { name: /Pourquoi maintenant/ }));
    expect(fenetre.getByText(/Moût refroidi, avant l’ensemencement/)).toBeInTheDocument();
    expect(fenetre.getByText(/Au transfert : le volume au fermenteur/)).toBeInTheDocument();
    const dites = [...noeud.querySelectorAll('p')].filter((p) => /pas relevée/.test(p.textContent ?? ''));
    expect(dites.length).toBeGreaterThan(0);
    for (const p of dites) expect(p.className).toMatch(/sr-only/);
    expect(fenetre.getByText(/1\/\d+ ajouts cochés/)).toBeInTheDocument();
  });
  it('un pas pose la valeur, le verdict dit l’écart à la cible ; la clôture écrit les deux relevés avant la levure et qualifie l’OG et le volume cochés', async () => {
    const { fini, fenetre } = ouvrirCloture();
    fireEvent.click(densite().getByRole('button', { name: 'plus 0,001' }));
    expect(densite().getByRole('button', { name: 'Taper la valeur' })).toHaveTextContent('1,062');
    fireEvent.click(densite().getByRole('checkbox'));
    fireEvent.click(volume().getByRole('button', { name: 'plus 0,1' }));
    fireEvent.click(volume().getByRole('checkbox'));
    expect(volume().getByText('au repère')).toBeInTheDocument();
    fireEvent.click(fenetre.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await vi.waitFor(() => expect(fini).toHaveBeenCalledOnce());
    const lotFini = fini.mock.calls[0][0] as Batch;
    expect(lotFini).toMatchObject({ og: '1.062', volumeBrewedL: 19.1, status: 'fermentation' });
    const releves = lotFini.brewDay!.readings!;
    expect(releves.find((r) => r.kind === 'densite')).toMatchObject({ stepId: 'ensemencement', value: 1.062, unit: 'SG', roomTemp: true });
    expect(releves.find((r) => r.kind === 'volume')).toMatchObject({ stepId: 'ensemencement', value: 19.1, unit: 'L', volumeBasis: 'cold' });
    for (const r of releves) expect(r.at).toBeLessThanOrEqual(lotFini.brewDay!.pitchedAt!);
  });
  it('sans la case « refroidie » : le relevé reste au journal, mais l’OG n’est pas qualifiée ; sans rien saisi, aucun relevé écrit', async () => {
    const a = ouvrirCloture();
    fireEvent.click(densite().getByRole('button', { name: 'plus 0,001' }));
    fireEvent.click(a.fenetre.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await vi.waitFor(() => expect(a.fini).toHaveBeenCalledOnce());
    const sans = a.fini.mock.calls[0][0] as Batch;
    expect(sans.og).toBeUndefined();
    expect(sans.brewDay!.readings).toHaveLength(1);
    cleanup();
    const b = ouvrirCloture();
    fireEvent.click(b.fenetre.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await vi.waitFor(() => expect(b.fini).toHaveBeenCalledOnce());
    expect((b.fini.mock.calls[0][0] as Batch).brewDay!.readings).toHaveLength(0);
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
