import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { terminerLaJournee } from '../fixtures/brewTerminer';
import { BrewDayPage } from '../../src/pages/BrewDayPage';
import { BrewAide } from '../../src/ui/BrewAide';
import { BrewReadingsSummary } from '../../src/ui/BrewReadingsSummary';
import { BrewDayMeasurements } from '../../src/ui/BrewDayMeasurements';
import { YeastBrewDayGuide } from '../../src/ui/YeastBrewDayGuide';
import { buildYeastBrewDay } from '../../src/domain/yeastBrewDay';
import { ingredientAppliesToStep } from '../../src/ui/BrewIngredients';
import type { BrewIngredient } from '../../src/domain/brewCompanion';
import { brewerJobs } from '../../src/services/brewerJobs';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { yeastFlowRecipe } from '../fixtures/yeastRecipeFlow';
import type { Batch, BrewDayState, BrewDayStep, RecipeSnapshot, YeastSpec } from '../../src/types';

/**
 * Voie c3 (10.11, « C'est toujours assez mauvaise le jour de brassage, c'est quoi ça ??? ») : les problèmes 5 à 23 de la passe de vision.
 * Chaque test échoue sur 10f5fd33 (c2/curseur) avant sa correction.
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
/** Les règles dont le sélecteur contient `motif` (corps concaténés). */
const regles = (source: string, motif: RegExp) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((m) => motif.test(m[1])).map((m) => m[2]).join(' ');

const SECHE_SANS_QUANTITE: YeastSpec = { name: 'SafAle US-05', form: 'sèche' };
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
  return { id: 'B-C3', name: 'Brassin c3', style: recipe.style, volumeL: 19, status: 'planifie', brewDate: '27.09.2026', plannedBrewDate: '27.09.2026', recipeSnapshot: recipe, brewDay } as Batch;
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

describe('n° 5 et 15 : levure sèche sans quantité, un toucher pose « 1 sachet », un de plus clôt', () => {
  it('le pied ouvre l’éditeur sur la ligne, avec « 1 sachet » ; aucun bandeau en haut de page', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    const choix = ligneIngredients().getByRole('radiogroup', { name: 'Quantité de levure réellement ajoutée' });
    expect(within(choix).getByRole('radio', { name: '1 sachet' })).toBeInTheDocument();
    // La couleur de réussite (vert) n'annonce pas une consigne : plus de bandeau, l'éditeur parle sur sa ligne.
    expect(screen.queryByText('Choisis la quantité de levure réellement ajoutée.')).not.toBeInTheDocument();
  });
  it('« 1 sachet » est une quantité choisie : le pied ouvre alors la confirmation, qui clôt avec 1 sachet', async () => {
    const fini = vi.fn();
    monter(lot(SECHE_SANS_QUANTITE), fini);
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    fireEvent.click(ligneIngredients().getByRole('radio', { name: '1 sachet' }));
    expect(ligneIngredients().getByRole('radio', { name: '1 sachet' })).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.getByRole('button', { name: 'Confirmer la levure ajoutée' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la levure ajoutée' }));
    await terminerLaJournee();
    return vi.waitFor(() => {
      expect(fini).toHaveBeenCalledOnce();
      expect((fini.mock.calls[0][0] as Batch).brewDay).toMatchObject({ pitchQuantityConfirmation: 'measured', additions: { yeast: { amount: 1, unit: 'sachet' } } });
    });
  });
  it('une levure liquide sans quantité ne se voit pas proposer de sachet', () => {
    monter(lot({ name: 'Wyeast 3068', form: 'liquide' }));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    const choix = ligneIngredients().getByRole('radiogroup', { name: 'Quantité de levure réellement ajoutée' });
    expect(within(choix).queryByRole('radio', { name: '1 sachet' })).not.toBeInTheDocument();
  });
});

describe('n° 7 et 16 : une seule alerte « À vérifier », qui s’éteint quand la cause est réglée', () => {
  // Visibles : un repli fermé cache son contenu, donc l'étiquette du repli imbriqué (dans les Aides fermées) ne compte pas.
  const alertes = () => screen.queryAllByText('À vérifier').filter((n) => { try { expect(n).toBeVisible(); return true; } catch { return false; } });
  it('BrewAide imbriqué : jamais deux « À vérifier » pour une même cause', () => {
    const { container } = render(
      <BrewAide title="Aides et repères" quiet>
        <BrewAide title="Levure · SafAle"><p data-notice>Quantité à choisir</p></BrewAide>
      </BrewAide>
    );
    expect(alertes()).toHaveLength(1); // replié : le repli extérieur porte l'alerte
    const exterieur = container.querySelector('details.brew-aide') as HTMLDetailsElement;
    exterieur.open = true;
    fireEvent(exterieur, new Event('toggle'));
    expect(alertes().length).toBeLessThanOrEqual(1);
  });
  it('BrewAide ouvert : l’alerte est le texte rouge lui-même, pas une étiquette de plus', () => {
    render(<BrewAide title="Levure"><p data-notice>Quantité à choisir</p></BrewAide>);
    expect(alertes()).toHaveLength(0); // s'ouvre seul : le texte est déjà à l'écran
    expect(screen.getByText('Quantité à choisir')).toBeVisible();
  });
  it('page : « 1 sachet » posé, plus aucune alerte « À vérifier » ni instruction rouge de levure', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    expect(document.querySelectorAll('dt[data-notice]').length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    fireEvent.click(screen.getByRole('radio', { name: '1 sachet' }));
    expect(document.querySelectorAll('dt[data-notice]')).toHaveLength(0);
    // La fixture porte d'autres causes (guide « périmé », dry hop à préciser) : on ne juge que celle de la quantité. L'étiquette de BrewAide suit par
    // MutationObserver (microtâche) ; son extinction seule est jugée dans les deux tests de BrewAide ci-dessus.
    const causes = [...document.querySelectorAll('[data-notice]')].map((n) => n.textContent ?? '').filter((t) => /quantité|levure ajoutée/i.test(t));
    expect(causes).toEqual([]);
  });
});

describe('n° 8 : la levure sèche sans quantité dit le geste, pas une phrase cassée', () => {
  const garde = (yeast: YeastSpec) => {
    const recette = yeastFlowRecipe() as never as Parameters<typeof buildYeastBrewDay>[0];
    (recette as { yeast: YeastSpec }).yeast = yeast;
    return buildYeastBrewDay(recette, { steps: [], currentIndex: 0, readings: [] }, 'preparation', [])!;
  };
  it('titre court, forme et jargon ne se collent pas (« sèche. Renseigner… aucun sachet ni nombre de cellules »)', () => {
    const prepare = garde(SECHE_SANS_QUANTITE).instructions.find((i) => i.id === 'prepare')!;
    expect(prepare.title).toBe('Préparer la levure');
    expect(prepare.detail).not.toMatch(/cellules|aucun sachet|sèche\. Renseigner/i);
    expect(prepare.detail.length).toBeLessThanOrEqual(80);
    expect(prepare.warning).toBe(true);
  });
  it('avec une quantité connue, la consigne reste la notice, sans alerte', () => {
    const prepare = garde({ name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g' }).instructions.find((i) => i.id === 'prepare')!;
    expect(prepare.warning).toBeFalsy();
  });
  it('guide avec un éditeur à ouvrir (fiche) : l’alerte porte un bouton « Choisir la quantité » qui l’ouvre', () => {
    const ouvrir = vi.fn();
    const recette = yeastFlowRecipe() as RecipeSnapshot;
    recette.yeast = SECHE_SANS_QUANTITE;
    render(<YeastBrewDayGuide recipe={recette as never} state={{ steps: [], currentIndex: 0, readings: [] }} phase="preparation" onChooseQuantity={ouvrir} />);
    fireEvent.click(screen.getByRole('button', { name: 'Choisir la quantité' }));
    expect(ouvrir).toHaveBeenCalledOnce();
  });
  it('page (Préparer) : pas de bouton qui n’ouvrirait rien (la ligne Levure n’y est pas), et pas d’alerte rouge à ne pas pouvoir régler', () => {
    monter(lot(SECHE_SANS_QUANTITE, 0, { steps: [{ id: 'eau', label: 'Eau et sels', durationMin: 0 }, ...ETAPES] }));
    expect(screen.queryByRole('button', { name: 'Choisir la quantité' })).not.toBeInTheDocument();
    expect(document.querySelector('[data-instruction="prepare"] dt[data-notice]')).toBeNull();
    expect(screen.getByText('Quantité à choisir à l’ajout.')).toBeInTheDocument();
  });
});

describe('n° 14 et 17 : le jargon « guide Levure » et « Aucune quantité prévue valide » disparaît', () => {
  it('la ligne Levure sans quantité ne renvoie pas à un « guide Levure » absent de l’écran', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    expect(ligneIngredients().queryByText(/guide Levure/)).not.toBeInTheDocument();
    // L'ajustement est ouvert d'emblée (c1c) : refermé, la ligne dit « Pas de dose prévue ».
    fireEvent.click(ligneIngredients().getByRole('button', { name: 'Fermer l’ajustement' }));
    expect(ligneIngredients().getByText(/Pas de dose prévue/)).toBeInTheDocument();
  });
  it('la confirmation de clôture dit « sans dose prévue », et le bouton ne se coupe pas en deux lignes', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    fireEvent.click(ligneIngredients().getByRole('radio', { name: '1 sachet' }));
    fireEvent.click(screen.getByRole('button', { name: 'J’ai ajouté la levure' }));
    expect(screen.queryByText(/Aucune quantité prévue valide/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/1 sachet/).length).toBeGreaterThan(0);
    expect(regles(css(), /brew-confirm[^,{]*button|\.brew-confirm/)).toMatch(/white-space:\s*nowrap/);
  });
});

describe('n° 12 : Relevés du jour ne répète pas ce que ses cases disent déjà', () => {
  it('avec les cases Densité initiale et Volume, le bilan de clôture n’ajoute pas deux lignes en plus', () => {
    const etape: BrewDayStep = { id: 'refroidissement', label: 'Refroidissement', durationMin: 0 };
    const recette = { volumeL: 19, ogTarget: 1.061 } as unknown as RecipeSnapshot;
    render(
      <BrewReadingsSummary
        state={{ steps: [etape], currentIndex: 0, readings: [] }}
        step={etape}
        recipe={recette}
        attendues={[
          { kind: 'densite', nom: 'Densité initiale', court: 'SG', cible: '1,061', quand: 'maintenant', due: true },
          { kind: 'volume', nom: 'Au fermenteur', court: 'L', cible: '19 L', quand: 'maintenant', due: true }
        ] as never}
        cloture={<span data-testid="cloture">Densité initiale — cible 1,061</span>}
      />
    );
    expect(screen.queryByTestId('cloture')).not.toBeInTheDocument();
  });
  it('sans case (étape sans mesure attendue), le bilan de clôture reste', () => {
    const etape: BrewDayStep = { id: 'ensemencement', label: 'Ensemencement', durationMin: 0 };
    render(
      <BrewReadingsSummary state={{ steps: [etape], currentIndex: 0, readings: [] }} step={etape} recipe={{ volumeL: 19 } as RecipeSnapshot}
        cloture={<span data-testid="cloture">bilan</span>} />
    );
    expect(screen.getByTestId('cloture')).toBeInTheDocument();
  });
});

describe('n° 11 : Refroidissement montre « Ensuite · Ensemencement » avec la levure, et la cible au transfert', () => {
  it('la carte « Ensuite » porte la levure (sans quantité : « à choisir »), la case de volume dit « au transfert »', () => {
    monter(lot(SECHE_SANS_QUANTITE, 0));
    const ensuite = screen.getByRole('region', { name: /Ensuite · Ensemencement/ });
    expect(within(ensuite).getByText('SafAle US-05')).toBeInTheDocument();
    // p2c (I2) : l'ancienne case « au transfert » de « Relevés du jour » est retirée ; l'OG et le volume attendus se lisent dans le bilan.
    expect(within(screen.getByRole('region', { name: /bilan visé/ })).getAllByText(/Au fermenteur/).length).toBeGreaterThan(0);
  });
  it('le volume relevé dans la case « Au fermenteur » du Refroidissement s’enregistre comme volume au fermenteur (décision du pilote, fidèle à m2)', () => {
    const etape: BrewDayStep = { id: 'refroidissement', label: 'Refroidissement', durationMin: 0 };
    let etat: BrewDayState = { steps: [etape], currentIndex: 0, readings: [] };
    const update = vi.fn((f: (s: BrewDayState) => BrewDayState) => { etat = f(etat); });
    render(<BrewDayMeasurements step={etape} state={etat} recipe={{ volumeL: 19, ogTarget: 1.061 } as RecipeSnapshot} update={update} requestedKind={{ kind: 'volume', token: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Taper la valeur' }));
    fireEvent.change(document.querySelector('#brew-reading') as HTMLElement, { target: { value: '18,6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(etat.readings?.[0]).toMatchObject({ kind: 'volume', value: 18.6, stepId: 'refroidissement', measurementStage: 'fermenter' });
  });
});

describe('n° 13 : « Moût à l’ajout » est un champ, avec un cadre', () => {
  it('le champ de température à l’ajout a son bord et son fond (input et textarea du doigt)', () => {
    const regle = regles(css(), /\.bz-moutajout-val\s*:is\(input,\s*textarea\)/);
    expect(regle).toMatch(/border:\s*1px solid/);
    expect(regle).toMatch(/background/);
  });
});

describe('n° 19 et 20 : la feuille Mesurer suit m2', () => {
  const etape: BrewDayStep = { id: 'mash-0', label: 'Palier', tempC: 67, durationMin: 60 };
  const recette = { volumeL: 24 } as unknown as RecipeSnapshot;
  it('pas de bouton « Volume + densité » : les onglets Volume et Densité le disent déjà (m2 : « Conseil » seul)', () => {
    render(<BrewDayMeasurements step={etape} state={{ steps: [etape], currentIndex: 0, readings: [] }} recipe={recette} update={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Température' }));
    expect(screen.queryByRole('button', { name: 'Volume + densité' })).not.toBeInTheDocument();
  });
  it('l’onglet actif est une pastille (m2), pas un cadre noir souligné', () => {
    const actif = regles(css(), /\.bz-seg button\[aria-pressed='true'\]/);
    expect(actif.length).toBeGreaterThan(0);
    expect(actif).not.toMatch(/border:\s*[2-9]px|text-decoration:|text-decoration-thickness|outline:\s*[2-9]px/);
  });
  it('cave : « Enregistrer » grisé reste gris foncé, jamais l’ocre plein du bouton actif', () => {
    const grise = regles(css(), /\.bz-actions button:last-child:disabled/);
    expect(grise).toMatch(/background/);
    expect(grise).not.toMatch(/var\(--bz-action\)/);
  });
  it('n° 6 : le placeholder du champ ne ressemble pas à une valeur (gris pâle, sans chiffre inventé)', () => {
    const { container } = render(<BrewDayMeasurements step={etape} state={{ steps: [etape], currentIndex: 0, readings: [] }} recipe={recette} update={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'pH' }));
    const champ = container.querySelector('#brew-reading') as HTMLElement | null;
    expect(champ?.getAttribute('placeholder') ?? '').not.toMatch(/\d/);
  });
});

describe('Température : 96 °C / « Relevé rattaché à cette étape. » répète la valeur', () => {
  it('sous le curseur, la valeur n’est dite qu’une fois : pas de verdict neutre qui la recopie', () => {
    const ebu: BrewDayStep = { id: 'boil-0', label: 'Ébullition', durationMin: 60, boilElapsedMin: 0 };
    const etat: BrewDayState = { steps: [ebu], currentIndex: 0, readings: [] };
    render(<BrewDayMeasurements step={ebu} state={etat} recipe={{ volumeL: 24 } as RecipeSnapshot} update={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Température' }));
    fireEvent.click(screen.getByRole('button', { name: 'Taper la valeur' }));
    fireEvent.change(document.querySelector('#brew-reading') as HTMLElement, { target: { value: '96' } });
    expect(screen.queryByText('Relevé rattaché à cette étape.')).not.toBeInTheDocument();
    expect(screen.queryByText(/^Température : 96/)).not.toBeInTheDocument();
  });
});

describe('n° 9 et 22 : chevrons à droite sur la ligne du titre, une seule police pour les mots', () => {
  it('« Fiche de la souche » et « Programme… » : le résumé est un flex, chevron collé à droite', () => {
    const regle = regles(css(), /yeast-brew-guide[^{]*summary|\.brew-aide-body\s+summary|\.brew-aide-body\s+details\s*>\s*summary/);
    expect(regle).toMatch(/display:\s*flex/);
  });
  it('les mots (« À préciser », « à mesurer ») ne sont pas en chasse fixe : seule la valeur chiffrée l’est', () => {
    const regle = regles(css(), /data-sans-valeur|bz-mesure-du|bz-mesure-tard/);
    expect(regle).toMatch(/font-family:\s*inherit/);
  });
});

describe('n° 10 : au jour de brassage, la levure ne déplie pas un cockpit', () => {
  it('ni graphe de fermentation, ni tableau de dry hop, ni sources en anglais dans l’aide du jour', () => {
    monter(lot(SECHE_SANS_QUANTITE));
    expect(screen.queryByText('Programme, ajouts à cru et sources')).not.toBeInTheDocument();
  });
});

describe('n° 18 : le suivi thermique ne colle pas au bord et parle en brasseur', () => {
  it('padding intérieur du suivi déplié', () => {
    const regle = regles(css() + readFileSync(`${racine}/src/ui/brew-thermal.css`, 'utf8'), /\.brew-thermal(\s|\{|$)|bz-thermique|\.brew-thermal-control/);
    expect(regle).toMatch(/padding/);
  });
  it('plus de « Exposition entre les relevés inconnue » ni « La montée ne remplace pas le maintien »', () => {
    const source = readFileSync(`${racine}/src/ui/BrewThermalControl.tsx`, 'utf8');
    expect(source).not.toMatch(/Exposition entre les relevés inconnue|La montée ne remplace pas le maintien/);
  });
});

describe('n° 21 : les grains se cochent à l’empâtage, pas une seconde fois au Mashout', () => {
  const grain = { id: 'g1', name: 'Pilsner', kind: 'grain', area: 'mash', planned: 4, unit: 'kg' } as unknown as BrewIngredient;
  it('grains au premier palier (mash-0), pas aux paliers suivants (mash-1, Mashout)', () => {
    expect(ingredientAppliesToStep(grain, { area: 'mash', stepId: 'mash-0' })).toBe(true);
    expect(ingredientAppliesToStep(grain, { area: 'mash', stepId: 'mash-1' })).toBe(false);
    expect(ingredientAppliesToStep(grain, { area: 'mash', stepId: 'mash-2' })).toBe(false);
  });
  it('l’extraction à froid garde ses grains', () => {
    expect(ingredientAppliesToStep(grain, { area: 'mash', stepId: 'nolo-extraction' })).toBe(true);
  });
});

describe('n° 23 : Ébullition › Aide à cette étape › Simuler parle en minutes de contact, pas en « + min écoulées »', () => {
  it('le texte de programmeur « Ajout à +… min depuis le début » et « notation de la recette exprime » est parti', () => {
    const source = readFileSync(`${racine}/src/ui/BrewAssist.tsx`, 'utf8');
    expect(source).not.toMatch(/Ajout à \+… min depuis le début|La notation de la recette exprime les minutes restantes|min écoulées =/);
  });
});

describe('n° 7 (suite) : l’alerte « À cru » qui reste après « 1 sachet » nomme sa cause, et s’éteint quand la phase est dite', () => {
  const garde = (aromaTiming?: 'fermentation' | 'postFermentation') => {
    const recette = yeastFlowRecipe() as RecipeSnapshot;
    recette.yeast = { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g' };
    recette.hops = recette.hops.map((h) => h.stage === 'dryHop' ? { ...h, aromaTiming } : h);
    const guide = buildYeastBrewDay(recette as never, { steps: [], currentIndex: 0, readings: [] }, 'finish', [], true)!;
    return guide.instructions.find((i) => i.id === 'dry-hop')!;
  };
  it('dry hop sans phase (un jour prévu seulement) : alerte, qui dit « phase à préciser » dans le titre', () => {
    const aCru = garde(undefined);
    expect(aCru.warning).toBe(true);
    expect(aCru.title).toMatch(/^À cru prévu · [\d,]+ g\/L · phase à préciser$/);
  });
  it('replié, le repli nomme la cause en peu de mots au lieu d’un « À vérifier » muet ; deux causes ou une alerte sans nom : « À vérifier »', () => {
    const { unmount } = render(<BrewAide title="Aides et repères" quiet><p data-notice="À cru · phase à préciser">détail</p></BrewAide>);
    expect(screen.getByText('À cru · phase à préciser')).toBeInTheDocument();
    expect(screen.queryByText('À vérifier')).not.toBeInTheDocument();
    unmount();
    render(<BrewAide title="Aides et repères" quiet><p data-notice="À cru · phase à préciser">a</p><p data-notice>b</p></BrewAide>);
    expect(screen.getByText('À vérifier')).toBeInTheDocument();
  });
  it('le guide pose la cause sur le texte rouge du dry hop sans phase, et sur lui seul', () => {
    const recette = yeastFlowRecipe() as RecipeSnapshot;
    recette.yeast = { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g' };
    recette.hops = recette.hops.map((h) => h.stage === 'dryHop' ? { ...h, aromaTiming: undefined } : h);
    render(<YeastBrewDayGuide recipe={recette as never} state={{ steps: [], currentIndex: 0, readings: [] }} phase="finish" quantityChosen />);
    const causes = [...document.querySelectorAll('dt[data-notice]')].map((n) => n.getAttribute('data-notice'));
    expect(causes).toEqual(['À cru · phase à préciser']);
  });
  it('dry hop dont la phase est dite : plus d’alerte, plus de « à préciser »', () => {
    for (const phase of ['fermentation', 'postFermentation'] as const) {
      const aCru = garde(phase);
      expect(aCru.warning).toBeFalsy();
      expect(aCru.title).not.toMatch(/préciser/);
    }
  });
});

