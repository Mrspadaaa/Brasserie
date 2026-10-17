// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { brewerJobs } from '../../src/services/brewerJobs';
import { readRecipeDraft, serializeRecipeDraft, writeRecipeDraft, type RecipeWizardDraft } from '../../src/services/recipeDraft';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { brewingStyles } from '../../src/domain/brewingStyles';
import { STYLE_WATERS, styleWaterForReference } from '../../src/domain/waterStyles';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import type { AppConfig, Recipe, StockItem, WaterIons, WaterPlan, WaterSource, YeastSpec } from '../../src/types';
import { allerEtape } from '../helpers/wizard';

/*
 * First save of the real BrewWizard: the Recipe it hands to onSave, then the same document read back as JSON
 * (local/offline copy) and reopened. Every value is synthetic; none reuses the observed fixture names.
 * Local stand-ins only: the AI transport; an explicit FG/ABV projection where a test needs an exact estimate;
 * and presentation pilots (water workshop, yeast choice and stock picker) that call the Wizard's own callbacks.
 * No provider, account, service or real data is used.
 */
const ai = vi.hoisted(() => vi.fn());
const projection = vi.hoisted(() => ({ exact: undefined as undefined | { fg: number; abv: number } }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: (...args: unknown[]) => ai(...args) } }));
vi.mock('../../src/domain/yeastProjection', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/domain/yeastProjection')>();
  return { ...actual, projectYeastRecipe: (...args: Parameters<typeof actual.projectYeastRecipe>) => {
    const real = actual.projectYeastRecipe(...args);
    const exact = projection.exact;
    return exact ? { ...real, fg: { ...real.fg, range: { min: exact.fg, max: exact.fg } },
      abv: { ...real.abv, range: { min: exact.abv, max: exact.abv } } } : real;
  } };
});
// Water workshop pilot: one button per profile, emitting the Wizard's own onChange exactly like a profile pick; a
// commit of the current profile with the workshop's intent; and an unrelated dose edit. `workshop.real` renders the
// real SaltSolver instead, so that a real Combobox commit is the gesture.
const workshop = vi.hoisted(() => ({ real: false }));
vi.mock('../../src/ui/SaltSolver', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/ui/SaltSolver')>();
  const { createElement } = await import('react');
  const { STYLE_WATERS: profiles } = await import('../../src/domain/waterStyles');
  type PilotProps = { state: { styleCode: string; doses: Record<string, number> }; onChange: (next: unknown, intent?: string) => void };
  const Pilot = (props: PilotProps) =>
    createElement('div', { 'aria-label': 'Atelier d’eau (pilote de test)' },
      createElement('p', null, `Profil en cours : ${props.state.styleCode}`),
      createElement('button', { type: 'button', onClick: () => props.onChange({ ...props.state }, 'profile-choice') },
        'Garder le profil en cours'),
      createElement('button', { type: 'button', onClick: () => props.onChange({ ...props.state,
        doses: { ...props.state.doses, gypse: (props.state.doses.gypse ?? 0) + 1 } }) }, 'Modifier une dose'),
      ...profiles.map(profile => createElement('button', { key: profile.code, type: 'button',
        onClick: () => props.onChange({ ...props.state, styleCode: profile.code }) }, `Choisir le profil ${profile.code}`)));
  return { ...actual, SaltSolver: (props: PilotProps) =>
    workshop.real ? createElement(actual.SaltSolver, props as never) : createElement(Pilot, props) };
});
// Yeast step pilots: the real identity editor callback (selectYeast) receives a stock article.
vi.mock('../../src/ui/YeastRecipeChoice', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/ui/YeastRecipeChoice')>();
  const { createElement } = await import('react');
  return { ...actual, YeastRecipeChoice: (props: { identityEditor?: unknown }) =>
    createElement('section', { 'aria-label': 'Choix de levure (pilote de test)' }, props.identityEditor as never) };
});
vi.mock('../../src/ui/YeastIngredientPicker', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/ui/YeastIngredientPicker')>();
  const { createElement } = await import('react');
  return { ...actual, YeastIngredientPicker: (props: { items: Array<{ ref: string; name: string; category: string }>;
    onStock: (name: string, item: unknown) => void }) =>
    createElement('div', null, ...props.items.filter(item => item.category === 'Levure').map(item =>
      createElement('button', { key: item.ref, type: 'button', onClick: () => props.onStock(item.name, item) },
        `Associer l’article ${item.ref}`))) };
});

beforeEach(() => { localStorage.clear(); ai.mockReset(); projection.exact = undefined; workshop.real = false; });
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); localStorage.clear(); projection.exact = undefined; workshop.real = false; });

const hasOwn = (value: unknown, key: string) => !!value && Object.prototype.hasOwnProperty.call(value, key);
const json = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const DRAFT_KEY = 'compte-synthetique:premier-save';

const RECIPE_WATER: WaterSource = { id: 'analyse-figee-synthetique', name: 'Analyse figée synthétique',
  ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120, ph: 7.2 };
const ACTIVE_WATER: WaterSource = { id: 'eau-active-du-jour', name: 'Eau active du jour',
  ca: 140, mg: 25, na: 60, so4: 180, cl: 160, hco3: 300, ph: 7.8 };
const CONFIG: AppConfig = { ...defaultConfig, waterSources: [ACTIVE_WATER], activeWaterSourceId: ACTIVE_WATER.id };

const MINIMAL_YEAST: YeastSpec = { name: 'Levure sèche synthétique', form: 'sèche', qty: 1, unit: 'sachet' };
const LOT_YEAST: YeastSpec = { name: 'Levure du lot synthétique', stockItemRef: 'stock-levure-synthetique', form: 'sèche', qty: 1, unit: 'sachet' };
const stockItem = (ref: string, name: string): StockItem =>
  ({ id: ref, ref, name, category: 'Levure', unit: 'sachet', currentStock: 3, minStock: 0, reorder: false });
const RENAMED_LOT = stockItem(LOT_YEAST.stockItemRef!, 'Levure du lot synthétique — article renommé');
const OTHER_LOT = stockItem('stock-autre-levure-synthetique', 'Autre levure du stock synthétique');
const SHEET = 'https://fiche.example.invalid/levure-seche-synthetique';
/** The same yeast once a catalogue sheet is read: identity resolved, sourced ranges and fermentation facts added. */
const DOCUMENTED_YEAST = {
  ...MINIMAL_YEAST,
  hopIndexId: 'catalogue-levure-synthetique',
  lab: 'Laboratoire synthétique',
  technicalSource: SHEET,
  fermTempMinC: 16,
  fermTempMaxC: 24,
  technicalFacts: [
    { key: 'temperature', reported: '16-24 °C', origin: 'manufacturer', range: { min: 16, max: 24 }, unit: '°C', qualifier: 'range',
      source: `Fiche synthétique · ${SHEET}`, sourceUrl: SHEET, retrievedAt: '2026-09-08T10:00:00.000Z' },
    { key: 'attenuation', reported: '74-80%', origin: 'manufacturer', range: { min: 74, max: 80 }, unit: '%', qualifier: 'range',
      source: `Fiche synthétique · ${SHEET}`, sourceUrl: SHEET, retrievedAt: '2026-09-08T10:00:00.000Z' }
  ],
  fermentationFacts: { version: 1, strainName: 'Levure sèche synthétique (Laboratoire synthétique)',
    source: { title: 'Fiche synthétique', author: 'Laboratoire synthétique', year: null, kind: 'manufacturer', reference: SHEET },
    retrievedAt: '2026-09-08', conditions: `Fiche de souche synthétique : aucune assimilation non publiée déduite. ${SHEET}`,
    sugars: {}, pof: 'unknown', hydrolysis: 'unknown', pitchGL: { min: 0.5, max: 0.8 }, temperatureC: { min: 16, max: 24 } }
} as YeastSpec;

function recipeWaterPlan(extra: Partial<WaterPlan> = {}): WaterPlan {
  return { sourceId: RECIPE_WATER.id, sourceSnapshot: RECIPE_WATER, treatmentVersion: 2, diRatioPct: 0,
    mashWaterL: 20, spargeWaterL: 10, mash: { cacl2: 2 }, sparge: {}, allSaltsInMash: true,
    acid: { id: 'lactique', mash: 1, sparge: 0.5 }, acidOverride: { mash: 1, sparge: 0.5 }, disabled: [], targetPh: 5.4, ...extra };
}

/** A complete source recipe with author targets; its water plan follows the style unless a test says otherwise. */
function sourceRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'recette-source-synthetique', name: 'Recette source synthétique', style: NO_PROFILE_STYLE,
    volumeL: 20, boilMin: 60, ogTarget: 1.05, fgTarget: 1.012, abvTarget: 4.9, efficiencyPct: 72, totalGristKg: 5,
    fermentables: [{ name: 'Malt pâle synthétique', kind: 'grain', use: 'empatage', weightKg: 5, colorEbc: 6, potentialPpg: 36 }],
    hops: [], yeast: MINIMAL_YEAST,
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], spargeType: 'batch' },
    waterPlan: recipeWaterPlan(),
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 }],
    steps: [], notes: [],
    ...overrides
  };
}

function mount(recipe: Recipe | undefined, options: { draftKey?: string; config?: AppConfig; stockItems?: StockItem[] } = {}) {
  const save = vi.fn();
  const view = render(<BrewWizard localOnly draftKey={options.draftKey} seed={recipe ? { recipe } : undefined}
    config={options.config ?? CONFIG} stockItems={options.stockItems ?? []} knownStyles={[]} onClose={vi.fn()} onSave={save}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
  return { save, view };
}

const saveButton = () => screen.queryByRole('button', { name: 'Enregistrer la recette' });
/** The exact Recipe the Wizard hands to onSave on this click. */
function saveFromRecap(save: ReturnType<typeof vi.fn>): Recipe {
  if (!saveButton()) allerEtape(/^Récapitulatif$/);
  const before = save.mock.calls.length;
  fireEvent.click(saveButton()!);
  expect(save.mock.calls.length, 'L’enregistrement atteint onSave sans demande de correction.').toBe(before + 1);
  return save.mock.calls[before][0] as Recipe;
}

/** The recap's own text export, as copied to the clipboard. */
function copyRecipeText(): string {
  if (!saveButton()) allerEtape(/^Récapitulatif$/);
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  fireEvent.click(screen.getAllByRole('button', { name: /^Copier la recette en texte$/ })[0]);
  expect(clipboard).toHaveBeenCalledTimes(1);
  return clipboard.mock.calls[0][0] as string;
}

/** A local draft as the Wizard writes it: details keep the source, the built recipe carries the yeast now edited. */
function restoreDraft(sourceYeast: YeastSpec, currentYeast: YeastSpec, options: { source?: Recipe; waterProfileAuto?: boolean } = {}) {
  const source = options.source ?? sourceRecipe();
  const details = { ...source, yeast: sourceYeast };
  const draft: RecipeWizardDraft = {
    recipe: { ...source, yeast: currentYeast }, details, step: 'recap',
    water: { diRatioPct: 0, styleCode: source.waterPlan?.targetProfileId ?? '—', doses: { cacl2: 2 }, disabled: [], acidId: 'lactique',
      acidOverride: { mash: 1, sparge: 0.5 }, mashWaterL: 20, spargeWaterL: 10, allSaltsInMash: true } as RecipeWizardDraft['water'],
    volumesEdited: true, waterProfileAuto: options.waterProfileAuto ?? true, mashRatioOverride: null, candidateSheets: {},
    targetBasis: JSON.stringify([details.volumeL, details.boilMin, details.fermentables, details.hops, sourceYeast, details.efficiencyPct, 'unspecified'])
  };
  writeRecipeDraft(DRAFT_KEY, serializeRecipeDraft(draft));
}

// --- Water styles, read from the registry the Wizard itself uses -------------------------------
const NO_PROFILE_STYLE = 'Style maison sans repère d’eau';
const registry = () => brewingStyles(StorageService.getHopKnowledge());
const suggestion = (name: string) => styleWaterForReference(name).code;
/** Two catalogued styles whose water suggestions differ from each other and from the neutral reference. */
function stylesWithDistinctSuggestions() {
  const found: Array<[string, string]> = [];
  for (const name of registry().map(entry => entry.name)) {
    const code = suggestion(name);
    if (code !== '—' && !found.some(([, seen]) => seen === code)) found.push([name, code]);
    if (found.length === 2) return { first: found[0][0], firstCode: found[0][1], second: found[1][0], secondCode: found[1][1] };
  }
  throw new Error('Le registre ne propose pas deux profils d’eau distincts : contre-exemple impossible à construire.');
}
const otherProfile = (avoid: string[]) => {
  const code = STYLE_WATERS.map(entry => entry.code).find(candidate => candidate !== '—' && !avoid.includes(candidate));
  if (!code) throw new Error('Aucun profil distinct disponible.');
  return code;
};

/** Free text read by the local AI transport; the data object is what the reader returns. */
async function importFromText(data: Record<string, unknown>) {
  ai.mockResolvedValue({ ok: true, data: { fermentables: [], hops: [], mashSteps: [], fermentation: [], ...data } });
  if (!screen.queryByRole('button', { name: /Coller une recette trouvée/ })) allerEtape(/^Identité$/);
  fireEvent.click(screen.getAllByRole('button', { name: /Coller une recette/ })[0]);
  fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: 'Même recette, autre style synthétique.' } });
  fireEvent.click(screen.getAllByRole('button', { name: /^Lire la recette$/ })[0]);
  fireEvent.click(await screen.findByRole('button', { name: 'Reprendre' }));
}
const importStyleFromText = (style: string) => importFromText({ style });

/** The application's own text: a complete import, read locally. */
function importOwnText(recipe: Recipe) {
  if (!screen.queryByRole('button', { name: /Coller une recette trouvée/ })) allerEtape(/^Identité$/);
  fireEvent.click(screen.getAllByRole('button', { name: /Coller une recette/ })[0]);
  fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: writeRecipeText(recipe) } });
  const aiCallsBeforeLocalImport = ai.mock.calls.length;
  fireEvent.click(screen.getAllByRole('button', { name: /^Lire la recette$/ })[0]);
  expect(ai, 'Le texte de l’application se relit sans appel IA supplémentaire.').toHaveBeenCalledTimes(aiCallsBeforeLocalImport);
  fireEvent.click(screen.getAllByRole('button', { name: /^Reprendre$/ })[0]);
}

describe('premier enregistrement — cibles de l’auteur et levure', () => {
  it('garde FG et ABV de l’auteur quand la même levure reçoit seulement des faits sourcés, puis les relit hors ligne', () => {
    restoreDraft(MINIMAL_YEAST, DOCUMENTED_YEAST);
    const first = mount(undefined, { draftKey: DRAFT_KEY });
    const saved = saveFromRecap(first.save);
    expect(saved).toMatchObject({ ogTarget: 1.05, fgTarget: 1.012, abvTarget: 4.9 });
    // The documentary facts are kept as such: nothing is stripped to make the targets survive.
    expect(saved.yeast).toMatchObject(json(DOCUMENTED_YEAST));
    first.view.unmount();

    const reread = mount(json(saved));
    const again = saveFromRecap(reread.save);
    expect(again).toMatchObject({ ogTarget: 1.05, fgTarget: 1.012, abvTarget: 4.9 });
    expect(again.yeast).toEqual(json(saved.yeast));
  });

  it('témoin du banc : sans changement de levure, la base des cibles du brouillon correspond', () => {
    restoreDraft(MINIMAL_YEAST, MINIMAL_YEAST);
    const { save } = mount(undefined, { draftKey: DRAFT_KEY });
    expect(saveFromRecap(save)).toMatchObject({ fgTarget: 1.012, abvTarget: 4.9 });
  });

  it('garde une atténuation annoncée par le fabricant comme fait documentaire, sans effacer les cibles', () => {
    restoreDraft(MINIMAL_YEAST, { ...MINIMAL_YEAST, attenuationPct: 78, attenuationBasis: 'declared' });
    const { save } = mount(undefined, { draftKey: DRAFT_KEY });
    expect(saveFromRecap(save)).toMatchObject({ fgTarget: 1.012, abvTarget: 4.9 });
  });

  it('garde les cibles quand seule l’étiquette change sous la même identité catalogue', () => {
    const catalogued = { ...MINIMAL_YEAST, hopIndexId: 'catalogue-levure-synthetique' };
    restoreDraft(catalogued, { ...catalogued, name: 'Nom catalogue de la levure synthétique' });
    const { save } = mount(undefined, { draftKey: DRAFT_KEY });
    expect(saveFromRecap(save)).toMatchObject({ fgTarget: 1.012, abvTarget: 4.9 });
  });

  it.each<[string, YeastSpec, YeastSpec]>([
    ['une autre souche', MINIMAL_YEAST, { name: 'Autre levure synthétique', form: 'liquide', qty: 1, unit: 'sachet' }],
    ['un nom changé sans identité stable', MINIMAL_YEAST, { ...MINIMAL_YEAST, name: 'Autre nom synthétique' }],
    ['un nom changé avec une identité seulement nouvelle', MINIMAL_YEAST, { ...MINIMAL_YEAST, name: 'Nom du catalogue', hopIndexId: 'catalogue-nouveau' }],
    ['une identité catalogue remplacée', { ...MINIMAL_YEAST, hopIndexId: 'catalogue-a' }, { ...MINIMAL_YEAST, hopIndexId: 'catalogue-b' }],
    ['le même lot renommé dont l’identité catalogue change', { ...LOT_YEAST, hopIndexId: 'catalogue-a' }, { ...LOT_YEAST, name: 'Lot renommé', hopIndexId: 'catalogue-b' }],
    ['une autre quantité ensemencée', MINIMAL_YEAST, { ...MINIMAL_YEAST, qty: 2 }],
    ['le même lot avec une autre quantité', LOT_YEAST, { ...LOT_YEAST, qty: 2 }],
    ['le même lot avec une autre température d’ensemencement', LOT_YEAST, { ...LOT_YEAST, pitchTempC: 16 }],
    ['une hypothèse d’atténuation de recette', MINIMAL_YEAST, { ...MINIMAL_YEAST, attenuationPct: 82, attenuationBasis: 'recipe' }]
  ])('rend les cibles périmées pour %s (dépendance réelle conservée)', (_label, sourceYeast, currentYeast) => {
    restoreDraft(sourceYeast, currentYeast);
    const { save } = mount(undefined, { draftKey: DRAFT_KEY });
    const saved = saveFromRecap(save);
    expect(saved.fgTarget).not.toBe(1.012);
    expect(saved.abvTarget).not.toBe(4.9);
    expect(saved.ogTarget, 'Une levure ne change jamais une OG fournie.').toBe(1.05);
  });
});

describe('premier enregistrement — renommage documentaire du même lot (vrai chemin selectYeast)', () => {
  it('le même article de stock renommé garde les cibles et les paramètres ensemencés', () => {
    const { save } = mount(json(sourceRecipe({ yeast: LOT_YEAST })), { stockItems: [RENAMED_LOT, OTHER_LOT] });
    allerEtape(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: `Associer l’article ${RENAMED_LOT.ref}` }));
    const saved = saveFromRecap(save);
    expect(saved.yeast).toMatchObject({ name: RENAMED_LOT.name, stockItemRef: LOT_YEAST.stockItemRef, qty: 1, unit: 'sachet', form: 'sèche' });
    expect(saved).toMatchObject({ ogTarget: 1.05, fgTarget: 1.012, abvTarget: 4.9 });
  });

  it('un autre article de stock reste une vraie souche remplacée : les cibles deviennent périmées', () => {
    const { view } = mount(json(sourceRecipe({ yeast: LOT_YEAST })), { draftKey: DRAFT_KEY, stockItems: [RENAMED_LOT, OTHER_LOT] });
    allerEtape(/^Levure$/);
    fireEvent.click(screen.getByRole('button', { name: `Associer l’article ${OTHER_LOT.ref}` }));
    view.unmount();
    const built = readRecipeDraft(DRAFT_KEY)!.recipe;
    expect(built.yeast).toMatchObject({ name: OTHER_LOT.name, stockItemRef: OTHER_LOT.ref });
    expect(built.fgTarget).not.toBe(1.012);
    expect(built.abvTarget).not.toBe(4.9);
  });
});

describe('premier enregistrement — cible nulle, zéro ou absente face à une projection exacte', () => {
  it('une FG et un ABV cibles nuls restent nuls ; l’estimation exacte reste à part dans l’export', () => {
    projection.exact = { fg: 1.009, abv: 5.4 };
    const { save } = mount(json(sourceRecipe({ fgTarget: null, abvTarget: null })));
    const text = copyRecipeText();
    expect(text).toContain('FG cible : null');
    expect(text).toContain('FG estimée : 1.009');
    const saved = saveFromRecap(save);
    expect(saved.fgTarget).toBeNull();
    expect(saved.abvTarget).toBeNull();
    expect(saved.ogTarget).toBe(1.05);
  });

  it('un ABV cible à 0 reste 0 à côté d’une FG nulle', () => {
    projection.exact = { fg: 1.009, abv: 5.4 };
    const { save } = mount(json(sourceRecipe({ fgTarget: null, abvTarget: 0 })));
    expect(saveFromRecap(save)).toMatchObject({ fgTarget: null, abvTarget: 0 });
  });

  it('une OG cible nulle reste nulle quand les potentiels rendent une OG calculable', () => {
    const { save } = mount(json(sourceRecipe({ ogTarget: null })));
    expect(saveFromRecap(save).ogTarget).toBeNull();
  });

  it('écart connu, inchangé : une cible absente reçoit l’estimation exacte (règle des recettes neuves)', () => {
    projection.exact = { fg: 1.009, abv: 5.4 };
    const { ogTarget: _og, fgTarget: _fg, abvTarget: _abv, ...absent } = sourceRecipe();
    const { save } = mount(json(absent as Recipe));
    const saved = saveFromRecap(save);
    expect(saved).toMatchObject({ fgTarget: 1.009, abvTarget: 5.4 });
    expect(saved.ogTarget).toBeGreaterThan(1);
  });

  it('une cible périmée par une autre souche suit la règle existante de l’estimation', () => {
    projection.exact = { fg: 1.009, abv: 5.4 };
    restoreDraft(MINIMAL_YEAST, { name: 'Autre levure synthétique', form: 'liquide', qty: 1, unit: 'sachet' });
    const { save } = mount(undefined, { draftKey: DRAFT_KEY });
    expect(saveFromRecap(save)).toMatchObject({ fgTarget: 1.009, abvTarget: 5.4 });
  });
});

describe('premier enregistrement — provenance du mode du profil d’eau', () => {
  it('suivi automatique et choix manuel du MÊME code : après save et réouverture, seul le suivi change avec le style', async () => {
    const { first, firstCode, second, secondCode } = stylesWithDistinctSuggestions();
    const seed = sourceRecipe({ style: first });
    const auto = mount(json(seed));
    const autoSaved = json(saveFromRecap(auto.save));
    expect(autoSaved.waterPlan).toMatchObject({ targetProfileId: firstCode, targetProfileOrigin: 'style' });
    auto.view.unmount();

    const manual = mount(json(seed));
    allerEtape(/^Eau et sels$/);
    fireEvent.click(screen.getByRole('button', { name: `Choisir le profil ${otherProfile([firstCode, secondCode])}` }));
    fireEvent.click(screen.getByRole('button', { name: `Choisir le profil ${firstCode}` }));
    const manualSaved = json(saveFromRecap(manual.save));
    expect(manualSaved.waterPlan).toMatchObject({ targetProfileId: firstCode, targetProfileOrigin: 'choice' });
    manual.view.unmount();

    for (const [saved, expected] of [[autoSaved, secondCode], [manualSaved, firstCode]] as const) {
      const reopened = mount(saved);
      await importStyleFromText(second);
      expect(saveFromRecap(reopened.save).waterPlan!.targetProfileId).toBe(expected);
      reopened.view.unmount();
    }
  });

  it('un style sans repère d’eau, enregistré puis rouvert, suit encore le style importé ensuite', async () => {
    const { first, firstCode } = stylesWithDistinctSuggestions();
    expect(suggestion(NO_PROFILE_STYLE)).toBe('—');
    const initial = mount(sourceRecipe());
    const saved = saveFromRecap(initial.save);
    expect(saved.waterPlan).toMatchObject({ targetProfileId: '—', targetProfileOrigin: 'style' });
    initial.view.unmount();

    const reopened = mount(json(saved));
    await importStyleFromText(first);
    const again = saveFromRecap(reopened.save);
    expect(again.style).toBe(first);
    expect(again.waterPlan!.targetProfileId, 'Le profil suit le style tant qu’aucun choix n’a été fait.').toBe(firstCode);
  });

  it('le brouillon local d’une recette rouverte garde le mode automatique', () => {
    const initial = mount(sourceRecipe());
    const saved = json(saveFromRecap(initial.save));
    initial.view.unmount();

    const reopened = mount(saved, { draftKey: DRAFT_KEY });
    const title = document.getElementById('wz-title') as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'Recette source synthétique reprise' } });
    fireEvent.blur(title);
    reopened.view.unmount();
    const draft = readRecipeDraft(DRAFT_KEY)!;
    expect(draft.waterProfileAuto).toBe(true);
    expect(draft.recipe.waterPlan!.targetProfileOrigin).toBe('style');
  });

  it('un profil hérité sans provenance, même égal à la suggestion, reste gardé et n’est pas déclaré choisi', async () => {
    const { first, firstCode, second } = stylesWithDistinctSuggestions();
    const { save } = mount(json(sourceRecipe({ style: first, waterPlan: recipeWaterPlan({ targetProfileId: firstCode }) })));
    await importStyleFromText(second);
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.targetProfileId).toBe(firstCode);
    expect(hasOwn(plan, 'targetProfileOrigin'), 'Une provenance inconnue reste inconnue.').toBe(false);
  });

  it.each([[undefined], ['choice']] as const)('une cible chiffrée (origine %s) reste la cible après changement de style', async origin => {
    const { first, firstCode, second } = stylesWithDistinctSuggestions();
    const targetIons = { so4: 150, cl: 50 };
    const { save } = mount(json(sourceRecipe({ style: first, waterPlan: recipeWaterPlan({ targetProfileId: firstCode, targetIons,
      targetName: 'Cible de l’auteur', ...(origin ? { targetProfileOrigin: origin } : {}) }) })));
    await importStyleFromText(second);
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan).toMatchObject({ targetProfileId: firstCode, targetIons, targetName: 'Cible de l’auteur' });
    expect(plan.targetProfileOrigin).toBe(origin);
  });

  it.each([[false], [true]])('un ancien brouillon local (suivi %s, sans provenance) garde son propre mode', async waterProfileAuto => {
    const { first, firstCode, second, secondCode } = stylesWithDistinctSuggestions();
    restoreDraft(MINIMAL_YEAST, MINIMAL_YEAST, { waterProfileAuto,
      source: sourceRecipe({ style: first, waterPlan: recipeWaterPlan({ targetProfileId: firstCode }) }) });
    const { save } = mount(undefined, { draftKey: DRAFT_KEY });
    await importStyleFromText(second);
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.targetProfileId).toBe(waterProfileAuto ? secondCode : firstCode);
    expect(plan.targetProfileOrigin).toBe(waterProfileAuto ? 'style' : undefined);
  });

  it('exporte et relit la provenance ; un texte sans provenance reste gardé ; une valeur inconnue est refusée', async () => {
    const { first, firstCode, second, secondCode } = stylesWithDistinctSuggestions();
    const followed = sourceRecipe({ style: first, waterPlan: recipeWaterPlan({ targetProfileId: firstCode, targetProfileOrigin: 'style' }) });
    const chosen = sourceRecipe({ style: first, waterPlan: recipeWaterPlan({ targetProfileId: firstCode, targetProfileOrigin: 'choice' }) });
    const legacy = sourceRecipe({ style: first, waterPlan: recipeWaterPlan({ targetProfileId: firstCode }) });
    const followedText = writeRecipeText(followed);
    expect(followedText).toContain('Origine du profil cible : "Suit le style de bière"');
    expect(readRecipeText(followedText)!.waterPlan!.targetProfileOrigin).toBe('style');
    expect(readRecipeText(writeRecipeText(chosen))!.waterPlan!.targetProfileOrigin).toBe('choice');
    expect(writeRecipeText(legacy)).not.toContain('Origine du profil cible');
    expect(readRecipeText(writeRecipeText(legacy))!.waterPlan).not.toHaveProperty('targetProfileOrigin');
    expect(() => readRecipeText(followedText.replace('"Suit le style de bière"', '"deviné"'))).toThrow();

    for (const [recipe, expectedCode, expectedOrigin] of [
      [followed, secondCode, 'style'], [chosen, firstCode, 'choice'], [legacy, firstCode, undefined]
    ] as const) {
      const host = mount(json(sourceRecipe({ id: 'recette-hote-synthetique', name: 'Recette hôte synthétique' })));
      importOwnText(recipe);
      await importStyleFromText(second);
      const plan = saveFromRecap(host.save).waterPlan!;
      expect(plan.targetProfileId).toBe(expectedCode);
      expect(plan.targetProfileOrigin).toBe(expectedOrigin);
      host.view.unmount();
    }
  });

  it('un import partiel ne prouve aucune provenance : son profil est gardé sans être déclaré suivi ni choisi', async () => {
    const { firstCode, second } = stylesWithDistinctSuggestions();
    const { save } = mount(json(sourceRecipe()));
    await importFromText({ style: second, waterPlan: { targetProfileId: firstCode, targetProfileOrigin: 'style' } });
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.targetProfileId).toBe(firstCode);
    expect(hasOwn(plan, 'targetProfileOrigin')).toBe(false);
  });
});

describe('premier enregistrement — analyse d’eau introuvable', () => {
  const ORPHAN = 'analyse-retiree-du-carnet';
  const RETAINED_START: WaterIons = { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 };
  const RETAINED_WORT: WaterIons = { ca: 40.9, mg: 2, na: 5, so4: 10, cl: 34.3, hco3: 104 };
  const ORPHAN_SNAPSHOT: WaterSource = { id: ORPHAN, name: 'Analyse retirée du carnet', ...RETAINED_START, ph: 7.1 };
  /** A v2 plan whose analysis was neither frozen nor kept in the configuration. */
  function orphanPlan(extra: Partial<WaterPlan> = {}): WaterPlan {
    return { sourceId: ORPHAN, treatmentVersion: 2, diRatioPct: 0, mashWaterL: 20, spargeWaterL: 10, mash: { cacl2: 2 }, sparge: {},
      allSaltsInMash: true, acid: { id: 'lactique', mash: 0.8, sparge: 0.3 }, startIons: RETAINED_START, wortIons: RETAINED_WORT,
      disabled: [], targetPh: 5.4, ...extra };
  }
  const orphanRecipe = (plan: WaterPlan = orphanPlan()) => json(sourceRecipe({ waterPlan: plan }));
  const adopt = () => screen.queryByRole('button', { name: `Retenir « ${ACTIVE_WATER.name} » pour cette recette` });

  it('garde la référence et ses valeurs retenues, sans analyse empruntée à la source active, ni dans l’export', () => {
    const { save } = mount(orphanRecipe());
    allerEtape(/^Récapitulatif$/);
    expect(screen.getByText(new RegExp(`L’analyse d’eau « ${ORPHAN} » de cette recette est introuvable`))).toBeInTheDocument();
    expect(adopt()).not.toBeNull();
    const text = copyRecipeText();
    expect(text).not.toContain(ACTIVE_WATER.name);
    expect(text).not.toContain(ACTIVE_WATER.id);
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.sourceId).toBe(ORPHAN);
    expect(hasOwn(plan, 'sourceSnapshot'), 'Aucune analyse n’est inventée pour une source inconnue.').toBe(false);
    expect(plan).toMatchObject({ treatmentVersion: 2, startIons: RETAINED_START, wortIons: RETAINED_WORT,
      acid: { id: 'lactique', mash: 0.8, sparge: 0.3 }, mash: { cacl2: 2 } });
    expect(JSON.stringify(plan)).not.toContain(ACTIVE_WATER.id);
  });

  it('retient la source active seulement sur geste explicite ; les valeurs dérivées suivent alors cette analyse', () => {
    const { save } = mount(orphanRecipe());
    allerEtape(/^Récapitulatif$/);
    fireEvent.click(adopt()!);
    expect(adopt()).toBeNull();
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.sourceId).toBe(ACTIVE_WATER.id);
    expect(plan.sourceSnapshot).toEqual(ACTIVE_WATER);
    expect(plan.startIons).not.toEqual(RETAINED_START);
  });

  it('relue hors ligne puis rouverte, la recette garde la même référence et les mêmes valeurs', () => {
    const first = mount(orphanRecipe());
    const saved = json(saveFromRecap(first.save));
    first.view.unmount();
    const reread = mount(saved);
    expect(saveFromRecap(reread.save).waterPlan).toEqual(saved.waterPlan);
  });

  it('un plan historique inchangé garde son cache sans recevoir de version de traitement inventée', () => {
    const { treatmentVersion: _version, wortIons: _wort, ...legacy } = orphanPlan();
    const { save } = mount(orphanRecipe(legacy as WaterPlan));
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.sourceId).toBe(ORPHAN);
    expect(plan.startIons).toEqual(RETAINED_START);
    expect(hasOwn(plan, 'treatmentVersion')).toBe(false);
    expect(hasOwn(plan, 'wortIons')).toBe(false);
  });

  it('un volume modifié rend inconnues les valeurs calculées au lieu de les recalculer sur une autre eau', () => {
    const { save } = mount(orphanRecipe());
    allerEtape(/^Récapitulatif$/);
    const mashWater = screen.getByLabelText('Eau d’empâtage');
    fireEvent.change(mashWater, { target: { value: '18' } });
    fireEvent.blur(mashWater);
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan).toMatchObject({ sourceId: ORPHAN, mashWaterL: 18, treatmentVersion: 2 });
    expect(hasOwn(plan, 'startIons')).toBe(false);
    expect(hasOwn(plan, 'wortIons')).toBe(false);
    expect(hasOwn(plan, 'sourceSnapshot')).toBe(false);
  });

  it.each<[string, Partial<WaterPlan>, WaterSource]>([
    ['une analyse figée', { sourceSnapshot: ORPHAN_SNAPSHOT }, ORPHAN_SNAPSHOT],
    ['une source configurée', { sourceId: ACTIVE_WATER.id }, ACTIVE_WATER],
    ['la source intégrée par défaut', { sourceId: DEFAULT_WATER_SOURCE.id }, DEFAULT_WATER_SOURCE]
  ])('%s reste l’analyse de la recette, sans avis ni substitution', (_label, extra, expected) => {
    const { save } = mount(orphanRecipe(orphanPlan(extra)));
    allerEtape(/^Récapitulatif$/);
    expect(screen.queryByText(/de cette recette est introuvable/)).toBeNull();
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.sourceId).toBe(expected.id);
    expect(plan.sourceSnapshot).toEqual(expected);
  });
});

/*
 * FIRSTSAVE-SOURCE-EMPTY-01. A declared blank reference (empty or whitespace-only) names no analysis. It is kept
 * exactly and unresolved: neither the seed's analysis (source A, frozen in the recipe) nor the active configured
 * source (B) may replace it, its snapshot or the values calculated from it, until the explicit « Retenir » gesture.
 */
describe('premier enregistrement — référence d’analyse vide ou blanche', () => {
  const A_START: WaterIons = { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 };
  const A_WORT: WaterIons = { ca: 40.9, mg: 2, na: 5, so4: 10, cl: 34.3, hco3: 104 };
  /** Seed plan frozen on analysis A, with values calculated from A. */
  const SEED_PLAN = recipeWaterPlan({ startIons: A_START, wortIons: A_WORT });
  /** A plan that declares `sourceId` without any frozen analysis. */
  const planDeclaring = (sourceId: string, extra: Partial<WaterPlan> = {}) => {
    const { sourceSnapshot: _snapshot, ...plan } = recipeWaterPlan(extra);
    return { ...plan, sourceId } as WaterPlan;
  };
  const adoptActive = () => screen.queryByRole('button', { name: `Retenir « ${ACTIVE_WATER.name} » pour cette recette` });
  /** The saved plan keeps exactly the declared reference, without A or B, their snapshot or their calculated water. */
  function expectKeptWithoutBorrowing(plan: WaterPlan, sourceId: string) {
    expect(plan.sourceId, 'La référence déclarée est conservée telle quelle.').toBe(sourceId);
    expect(hasOwn(plan, 'sourceSnapshot'), 'Aucune analyse n’est empruntée.').toBe(false);
    expect(hasOwn(plan, 'startIons'), 'Aucun calcul d’une autre analyse ne survit.').toBe(false);
    expect(hasOwn(plan, 'wortIons')).toBe(false);
    const serialized = JSON.stringify(plan);
    expect(serialized).not.toContain(RECIPE_WATER.id);
    expect(serialized).not.toContain(ACTIVE_WATER.id);
  }

  it.each([['vide', ''], ['blanche', '   ']])('import partiel d’une référence %s sur une recette à analyse A, source active B : conservée sans emprunt', async (_label, blank) => {
    const { save } = mount(json(sourceRecipe({ waterPlan: SEED_PLAN })));
    await importFromText({ waterPlan: { sourceId: blank } });
    expectKeptWithoutBorrowing(saveFromRecap(save).waterPlan!, blank);
    expect(screen.getByText(/La référence d’analyse d’eau de cette recette est vide/)).toBeInTheDocument();
    const text = copyRecipeText();
    expect(text).toContain(`Référence de source : ${JSON.stringify(blank)}`);
    expect(text).not.toContain(RECIPE_WATER.id);
    expect(text).not.toContain(ACTIVE_WATER.id);
  });

  it('import complet d’une recette à référence vide dans un éditeur à analyse A : conservée sans emprunt', () => {
    const imported = sourceRecipe({ id: 'recette-importee-synthetique', name: 'Recette importée synthétique', waterPlan: planDeclaring('') });
    const { save } = mount(json(sourceRecipe({ waterPlan: SEED_PLAN })));
    importOwnText(imported);
    expectKeptWithoutBorrowing(saveFromRecap(save).waterPlan!, '');
  });

  it.each([
    ['vide', '', false],
    ['blanche', ' \t ', false],
    ['vide, à côté d’une analyse figée d’une autre identité', '', true]
  ] as const)('recette relue avec une référence %s : conservée, sans source active ni analyse étrangère', (_label, sourceId, foreignSnapshot) => {
    const plan = { ...planDeclaring(sourceId, { startIons: A_START, wortIons: A_WORT }), ...(foreignSnapshot ? { sourceSnapshot: RECIPE_WATER } : {}) };
    const { save } = mount(json(sourceRecipe({ waterPlan: plan })));
    expectKeptWithoutBorrowing(saveFromRecap(save).waterPlan!, sourceId);
  });

  it('une analyse figée d’une autre identité ne résout pas une référence non vide', () => {
    const plan = { ...planDeclaring('analyse-sans-fiche-synthetique', { startIons: A_START, wortIons: A_WORT }), sourceSnapshot: RECIPE_WATER };
    const { save } = mount(json(sourceRecipe({ waterPlan: plan })));
    expectKeptWithoutBorrowing(saveFromRecap(save).waterPlan!, 'analyse-sans-fiche-synthetique');
  });

  it('brouillon local à référence vide : repris sans emprunt, puis relu hors ligne à l’identique', () => {
    restoreDraft(MINIMAL_YEAST, MINIMAL_YEAST, { source: sourceRecipe({ waterPlan: planDeclaring('') }) });
    const first = mount(undefined, { draftKey: DRAFT_KEY });
    const saved = json(saveFromRecap(first.save));
    expectKeptWithoutBorrowing(saved.waterPlan!, '');
    first.view.unmount();
    const reread = mount(saved);
    expect(saveFromRecap(reread.save).waterPlan).toEqual(saved.waterPlan);
  });

  it('après une référence vide, seul le geste « Retenir » enregistre la source active et recalcule ses valeurs', () => {
    const { save } = mount(json(sourceRecipe({ waterPlan: planDeclaring('', { startIons: A_START }) })));
    allerEtape(/^Récapitulatif$/);
    expect(adoptActive(), 'Le geste d’adoption est proposé.').not.toBeNull();
    fireEvent.click(adoptActive()!);
    expect(adoptActive()).toBeNull();
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.sourceId).toBe(ACTIVE_WATER.id);
    expect(plan.sourceSnapshot).toEqual(ACTIVE_WATER);
    expect(plan.startIons).not.toEqual(A_START);
  });

  it('témoins d’omission : un plan ancien sans référence et un import partiel qui l’omet gardent leur comportement acquis', async () => {
    const { sourceId: _id, sourceSnapshot: _snapshot, ...omitted } = recipeWaterPlan();
    const legacy = mount(json(sourceRecipe({ waterPlan: omitted as WaterPlan })));
    const legacyPlan = saveFromRecap(legacy.save).waterPlan!;
    expect(legacyPlan, 'Sans référence, la recette reçoit la source configurée comme une recette neuve.')
      .toMatchObject({ sourceId: ACTIVE_WATER.id, sourceSnapshot: ACTIVE_WATER });
    legacy.view.unmount();

    const partial = mount(json(sourceRecipe({ waterPlan: SEED_PLAN })));
    await importFromText({ waterPlan: { targetPh: 5.3 } });
    expect(saveFromRecap(partial.save).waterPlan, 'Une référence omise garde celle de la recette.')
      .toMatchObject({ sourceId: RECIPE_WATER.id, sourceSnapshot: RECIPE_WATER, targetPh: 5.3 });
  });
});

/*
 * MANUAL-SUGGESTED-SAME-01. Committing the profile already suggested by the beer style is a choice. The pilot proves
 * the producer honours the workshop's intent; the real workshop proves a real Combobox commit carries it, while
 * opening the list alone does not.
 */
describe('premier enregistrement — garder le profil suggéré par un geste explicite', () => {
  function openProfileList() {
    const input = document.getElementById('w-style');
    if (!input) throw new Error('Champ « Cible » de l’atelier d’eau introuvable.');
    fireEvent.click(input);
    const list = document.getElementById('w-style-list');
    if (!list) throw new Error('La liste des profils ne s’est pas ouverte.');
    return { input, list };
  }
  function selectCheckedProfile(code: string) {
    const { list } = openProfileList();
    const checked = within(list).getAllByRole('option').filter(option => option.getAttribute('aria-selected') === 'true');
    expect(checked, 'Une seule option cochée : le profil en cours.').toHaveLength(1);
    expect(checked[0].textContent).toContain(code);
    fireEvent.click(checked[0]);
    expect(document.getElementById('w-style-list'), 'La sélection referme la liste.').toBeNull();
  }
  async function reopenWithOtherStyle(saved: Recipe, style: string) {
    const reopened = mount(saved);
    await importStyleFromText(style);
    return saveFromRecap(reopened.save).waterPlan!.targetProfileId;
  }

  it('pilote : engager le profil en cours sans changer sa valeur enregistre un choix que le style ne déplace plus', async () => {
    const { first, firstCode, second } = stylesWithDistinctSuggestions();
    const { save, view } = mount(json(sourceRecipe({ style: first })));
    allerEtape(/^Eau et sels$/);
    fireEvent.click(screen.getByRole('button', { name: 'Garder le profil en cours' }));
    const saved = json(saveFromRecap(save));
    expect(saved.waterPlan).toMatchObject({ targetProfileId: firstCode, targetProfileOrigin: 'choice' });
    view.unmount();
    expect(await reopenWithOtherStyle(saved, second)).toBe(firstCode);
  });

  it('pilote, témoin : un autre réglage d’eau ne devient pas un choix de profil', async () => {
    const { first, firstCode, second, secondCode } = stylesWithDistinctSuggestions();
    const { save, view } = mount(json(sourceRecipe({ style: first })));
    allerEtape(/^Eau et sels$/);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier une dose' }));
    const saved = json(saveFromRecap(save));
    expect(saved.waterPlan).toMatchObject({ targetProfileId: firstCode, targetProfileOrigin: 'style' });
    view.unmount();
    expect(await reopenWithOtherStyle(saved, second)).toBe(secondCode);
  });

  it('atelier réel : sélectionner l’option déjà cochée du profil suggéré le garde après réouverture et changement de style', async () => {
    workshop.real = true;
    const { first, firstCode, second } = stylesWithDistinctSuggestions();
    const { save, view } = mount(json(sourceRecipe({ style: first })));
    allerEtape(/^Eau et sels$/);
    selectCheckedProfile(firstCode);
    const saved = json(saveFromRecap(save));
    expect(saved.waterPlan).toMatchObject({ targetProfileId: firstCode, targetProfileOrigin: 'choice' });
    view.unmount();
    expect(await reopenWithOtherStyle(saved, second)).toBe(firstCode);
  });

  it('atelier réel, témoin : ouvrir puis fermer la liste sans sélectionner laisse le profil suivre le style', async () => {
    workshop.real = true;
    const { first, firstCode, second, secondCode } = stylesWithDistinctSuggestions();
    const { save, view } = mount(json(sourceRecipe({ style: first })));
    allerEtape(/^Eau et sels$/);
    const { input } = openProfileList();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(document.getElementById('w-style-list')).toBeNull();
    const saved = json(saveFromRecap(save));
    expect(saved.waterPlan).toMatchObject({ targetProfileId: firstCode, targetProfileOrigin: 'style' });
    view.unmount();
    expect(await reopenWithOtherStyle(saved, second)).toBe(secondCode);
  });

  it('atelier réel : le mode du profil est lisible et passe de « suivi » à « choisi » après la sélection', () => {
    workshop.real = true;
    const { first, firstCode } = stylesWithDistinctSuggestions();
    mount(json(sourceRecipe({ style: first })));
    allerEtape(/^Eau et sels$/);
    const mode = () => document.querySelector('[data-water-profile-mode]');
    expect(mode()?.getAttribute('data-water-profile-mode')).toBe('style');
    selectCheckedProfile(firstCode);
    expect(mode()?.getAttribute('data-water-profile-mode')).toBe('choice');
    expect(mode()?.textContent).toMatch(/reste en place si le style de bière change/);
  });
});

/*
 * C04. A legacy Recipe omits `sourceId` while its own snapshot carries an empty or whitespace-only id: an anonymous
 * analysis, distinct from the recipe's frozen analysis A and from the active configured source B. It stays the recipe's
 * analysis across reopen/save cycles; its blank id never becomes a declared reference. A declared blank reference keeps
 * the C03 contract and never resolves to such a snapshot.
 */
describe('premier enregistrement — snapshot legacy sans identité utilisable', () => {
  const anonymousSnapshot = (id: string): WaterSource => ({ id, name: 'Analyse legacy anonyme synthétique',
    ca: 84, mg: 12, na: 18, so4: 47, cl: 58, hco3: 126, ph: 6.85, note: 'Snapshot synthétique sans identifiant utilisable',
    updatedAt: '2026-10-01T08:12:00.000Z' });
  const ionsOf = (source: WaterSource): WaterIons => ({ ca: source.ca, mg: source.mg, na: source.na, so4: source.so4, cl: source.cl, hco3: source.hco3 });
  const OLD_START: WaterIons = { ca: 73, mg: 8, na: 13, so4: 36, cl: 44, hco3: 77 };
  const OLD_WORT: WaterIons = { ca: 78, mg: 9, na: 14, so4: 39, cl: 49, hco3: 81 };
  /** The persisted legacy shape: no `sourceId`, an anonymous snapshot, caches and a profile code without origin. */
  function legacyPlan(snapshot: WaterSource, profileCode: string): WaterPlan {
    const { sourceId: _id, sourceSnapshot: _snapshot, acidOverride: _override, ...plan } = recipeWaterPlan({ targetProfileId: profileCode,
      acid: { id: 'lactique', mash: 0.8, sparge: 0.3 }, startIons: OLD_START, wortIons: OLD_WORT });
    return { ...plan, sourceSnapshot: snapshot } as WaterPlan;
  }
  const adoptActive = () => screen.queryByRole('button', { name: `Retenir « ${ACTIVE_WATER.name} » pour cette recette` });
  /** Kept as the recipe's anonymous analysis: reference still omitted, snapshot exact, nothing from A or B. */
  function expectAnonymousKept(plan: WaterPlan, snapshot: WaterSource) {
    expect(hasOwn(plan, 'sourceId'), 'L’omission legacy n’est pas convertie en référence blanche déclarée.').toBe(false);
    expect(plan.sourceSnapshot, 'Le snapshot documentaire reste entier.').toEqual(snapshot);
    const serialized = JSON.stringify(plan);
    expect(serialized).not.toContain(RECIPE_WATER.id);
    expect(serialized).not.toContain(ACTIVE_WATER.id);
  }
  function pasteOwnText(text: string) {
    if (!screen.queryByRole('button', { name: /Coller une recette trouvée/ })) allerEtape(/^Identité$/);
    fireEvent.click(screen.getAllByRole('button', { name: /Coller une recette/ })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: text } });
    const aiCallsBeforeLocalImport = ai.mock.calls.length;
    fireEvent.click(screen.getAllByRole('button', { name: /^Lire la recette$/ })[0]);
    expect(ai).toHaveBeenCalledTimes(aiCallsBeforeLocalImport);
    fireEvent.click(screen.getAllByRole('button', { name: /^Reprendre$/ })[0]);
  }

  it.each([['vide exact', ''], ['composé d’espaces', '   ']])('snapshot d’identifiant %s : conservé au premier save, à la réouverture et au save suivant', (_label, id) => {
    const { first, firstCode } = stylesWithDistinctSuggestions();
    const snapshot = anonymousSnapshot(id);
    const host = mount(json(sourceRecipe({ style: first, waterPlan: legacyPlan(snapshot, firstCode) })));
    allerEtape(/^Récapitulatif$/);
    expect(screen.getByText(/n’a pas d’identifiant : elle reste l’analyse de la recette/)).toBeInTheDocument();
    const firstSave = json(saveFromRecap(host.save));
    expectAnonymousKept(firstSave.waterPlan!, snapshot);
    // Calculated from the values actually present in the snapshot, not from A or B.
    expect(firstSave.waterPlan!.startIons).toEqual(ionsOf(snapshot));
    host.view.unmount();

    const reopened = mount(firstSave);
    const secondSave = json(saveFromRecap(reopened.save));
    expectAnonymousKept(secondSave.waterPlan!, snapshot);
    expect(secondSave.waterPlan!.startIons).toEqual(firstSave.waterPlan!.startIons);
    expect(secondSave.waterPlan!.wortIons).toEqual(firstSave.waterPlan!.wortIons);
    expect(secondSave.waterPlan!.targetProfileId).toBe(firstCode);
    expect(hasOwn(secondSave.waterPlan, 'targetProfileOrigin'), 'Une suggestion égale ne devient pas une provenance.').toBe(false);
  });

  it('seul le geste « Retenir » remplace l’analyse anonyme par la source active, avec ses calculs', () => {
    const { first, firstCode } = stylesWithDistinctSuggestions();
    const snapshot = anonymousSnapshot('');
    const { save } = mount(json(sourceRecipe({ style: first, waterPlan: legacyPlan(snapshot, firstCode) })));
    allerEtape(/^Récapitulatif$/);
    expect(adoptActive(), 'Le remplacement explicite est proposé dès la première lecture.').not.toBeNull();
    fireEvent.click(adoptActive()!);
    expect(adoptActive()).toBeNull();
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan.sourceId).toBe(ACTIVE_WATER.id);
    expect(plan.sourceSnapshot).toEqual(ACTIVE_WATER);
    expect(plan.startIons).toEqual(ionsOf(ACTIVE_WATER));
  });

  it('un changement réel de traitement recalcule les valeurs sans supprimer le snapshot anonyme', () => {
    const { first, firstCode } = stylesWithDistinctSuggestions();
    const snapshot = anonymousSnapshot('   ');
    const { save } = mount(json(sourceRecipe({ style: first, waterPlan: legacyPlan(snapshot, firstCode) })));
    allerEtape(/^Récapitulatif$/);
    const mashWater = screen.getByLabelText('Eau d’empâtage');
    fireEvent.change(mashWater, { target: { value: '18' } });
    fireEvent.blur(mashWater);
    const plan = saveFromRecap(save).waterPlan!;
    expectAnonymousKept(plan, snapshot);
    expect(plan.mashWaterL).toBe(18);
    expect(plan.startIons).toEqual(ionsOf(snapshot));
  });

  it('export puis import complet : l’omission et le snapshot anonyme font l’aller-retour sans emprunter l’analyse de l’éditeur', () => {
    const { first, firstCode } = stylesWithDistinctSuggestions();
    const snapshot = anonymousSnapshot('');
    const source = mount(json(sourceRecipe({ style: first, waterPlan: legacyPlan(snapshot, firstCode) })));
    const text = copyRecipeText();
    expect(text, 'Aucune référence blanche n’est déclarée dans le texte.').not.toContain('Référence de source');
    const read = readRecipeText(text)!;
    expect(hasOwn(read.waterPlan, 'sourceId')).toBe(false);
    expect(read.waterPlan!.sourceSnapshot).toEqual(snapshot);
    source.view.unmount();

    const host = mount(json(sourceRecipe({ id: 'recette-hote-synthetique', name: 'Recette hôte synthétique' })));
    pasteOwnText(text);
    expectAnonymousKept(saveFromRecap(host.save).waterPlan!, snapshot);
  });

  it('témoins C03 : une référence blanche déclarée ne se résout pas par un snapshot de même id blanc, ni après un import partiel', async () => {
    const snapshot = anonymousSnapshot('');
    const declared = { ...legacyPlan(snapshot, '—'), sourceId: '' } as WaterPlan;
    const explicit = mount(json(sourceRecipe({ waterPlan: declared })));
    const explicitPlan = saveFromRecap(explicit.save).waterPlan!;
    expect(explicitPlan.sourceId).toBe('');
    expect(hasOwn(explicitPlan, 'sourceSnapshot'), 'Le contrat C03 reste : aucun snapshot n’est admis pour une référence blanche.').toBe(false);
    expect(hasOwn(explicitPlan, 'startIons')).toBe(false);
    explicit.view.unmount();

    const legacy = mount(json(sourceRecipe({ waterPlan: legacyPlan(snapshot, '—') })));
    await importFromText({ waterPlan: { sourceId: '' } });
    const imported = saveFromRecap(legacy.save).waterPlan!;
    expect(imported.sourceId).toBe('');
    expect(hasOwn(imported, 'sourceSnapshot')).toBe(false);
  });

  it('témoin : un snapshot legacy à identité utilisable fixe cette identité et reste stable', () => {
    const named = { ...anonymousSnapshot('analyse-legacy-nommee-synthetique') };
    const first = mount(json(sourceRecipe({ waterPlan: legacyPlan(named, '—') })));
    const saved = json(saveFromRecap(first.save));
    expect(saved.waterPlan).toMatchObject({ sourceId: named.id, sourceSnapshot: named });
    first.view.unmount();
    const reread = mount(saved);
    expect(saveFromRecap(reread.save).waterPlan).toEqual(saved.waterPlan);
  });
});

/*
 * C05. A partial import (AI reader, `complete=false`) that omits `sourceId` and brings only a snapshot. Omitting the
 * reference neither removes nor replaces the source the recipe holds: the snapshot is admitted only as an update of
 * the exact usable identity held, or when the recipe holds no reference and no analysis. Otherwise it is left out
 * before any change, with what was calculated from it, and the preview says so before « Reprendre ».
 */
describe('premier enregistrement — snapshot d’un import partiel sans référence', () => {
  const importedSnapshot = (id: string): WaterSource => ({ id, name: 'Analyse importée sans référence synthétique',
    ca: 87, mg: 13, na: 27, so4: 67, cl: 55, hco3: 173, ph: 6.55, note: 'Snapshot importé synthétique', updatedAt: '2026-10-03T10:20:00.000Z' });
  const noWater = ({ waterPlan: _waterPlan, ...recipe }: Recipe) => recipe;
  /** Reads `data` through the real sheet and AI normalizer, returns the admission shown in the preview, then applies. */
  async function previewThenApply(data: Record<string, unknown>) {
    ai.mockResolvedValue({ ok: true, data });
    if (!screen.queryByRole('button', { name: /Coller une recette trouvée/ })) allerEtape(/^Identité$/);
    fireEvent.click(screen.getAllByRole('button', { name: /Coller une recette/ })[0]);
    fireEvent.change(screen.getByRole('textbox', { name: 'Texte de la recette' }), { target: { value: 'Texte synthétique incomplet pour un import partiel.' } });
    fireEvent.click(screen.getAllByRole('button', { name: /^Lire la recette$/ })[0]);
    const resume = await screen.findByRole('button', { name: 'Reprendre' });
    const admission = [...document.querySelectorAll('[data-import-admission]')].map(node => node.textContent ?? '').join(' ');
    fireEvent.click(resume);
    return admission;
  }

  it.each([['vide exact', ''], ['composé d’espaces', '   '], ['d’une autre identité', 'analyse-importee-autre-synthetique']])(
    'snapshot %s sur une recette liée à A : A, son analyse et ses calculs restent ceux du save sans import', async (_label, id) => {
      const original = sourceRecipe({ waterPlan: recipeWaterPlan({ targetProfileId: '—', targetProfileOrigin: 'choice', startIons: A_START_C05, wortIons: A_WORT_C05 }) });
      const control = mount(json(original));
      const noImport = json(saveFromRecap(control.save));
      control.view.unmount();

      const host = mount(json(original));
      const admission = await previewThenApply({ waterPlan: { sourceSnapshot: importedSnapshot(id) } });
      const saved = json(saveFromRecap(host.save));
      expect(saved.waterPlan, 'Omettre sourceId ne retire ni ne remplace A.').toEqual(noImport.waterPlan);
      expect(saved.waterPlan).toMatchObject({ sourceId: RECIPE_WATER.id, sourceSnapshot: RECIPE_WATER, targetProfileOrigin: 'choice' });
      expect(noWater(saved)).toEqual(noWater(noImport));
      expect(admission, 'L’aperçu dit avant « Reprendre » que l’analyse importée n’est pas reprise.').toMatch(/n’est pas reprise/);
      host.view.unmount();

      const reopened = mount(saved);
      allerEtape(/^Récapitulatif$/);
      expect(screen.queryByRole('button', { name: /Retenir .* pour cette recette/ }), 'Aucune adoption n’est proposée : A reste résolue.').toBeNull();
      expect(saveFromRecap(reopened.save).waterPlan).toEqual(saved.waterPlan);
    });

  it('le reste d’un import partiel s’applique : seule l’analyse ambiguë est écartée', async () => {
    const { first } = stylesWithDistinctSuggestions();
    const { save } = mount(json(sourceRecipe()));
    await previewThenApply({ style: first, waterPlan: { sourceSnapshot: importedSnapshot('') } });
    const saved = saveFromRecap(save);
    expect(saved.style).toBe(first);
    expect(saved.waterPlan).toMatchObject({ sourceId: RECIPE_WATER.id, sourceSnapshot: RECIPE_WATER });
  });

  it('une mise à jour documentaire portant exactement l’identité A est admise et annoncée', async () => {
    const updatedA: WaterSource = { ...RECIPE_WATER, name: 'Analyse A mise à jour synthétique', ca: 34, cl: 18, updatedAt: '2026-10-04T11:30:00.000Z' };
    const { save } = mount(json(sourceRecipe({ waterPlan: recipeWaterPlan({ targetProfileId: '—', targetProfileOrigin: 'choice' }) })));
    const admission = await previewThenApply({ waterPlan: { sourceSnapshot: updatedA } });
    expect(admission).toMatch(/même identifiant que celle de la recette/);
    const plan = saveFromRecap(save).waterPlan!;
    expect(plan).toMatchObject({ sourceId: RECIPE_WATER.id, sourceSnapshot: updatedA, targetProfileOrigin: 'choice' });
  });

  it('une recette déjà anonyme garde son propre snapshot devant un autre snapshot anonyme importé', async () => {
    const held: WaterSource = { id: '', name: 'Analyse legacy déjà anonyme synthétique', ca: 84, mg: 12, na: 18, so4: 47, cl: 58, hco3: 126,
      ph: 6.85, note: 'Snapshot historique sans identité', updatedAt: '2026-10-01T08:12:00.000Z' };
    const { sourceId: _id, sourceSnapshot: _snapshot, ...plan } = recipeWaterPlan();
    const { save } = mount(json(sourceRecipe({ waterPlan: { ...plan, sourceSnapshot: held } as WaterPlan })));
    const admission = await previewThenApply({ waterPlan: { sourceSnapshot: importedSnapshot('') } });
    const saved = saveFromRecap(save).waterPlan!;
    expect(hasOwn(saved, 'sourceId')).toBe(false);
    expect(saved.sourceSnapshot, 'Une égalité d’id blanc ne prouve pas une identité.').toEqual(held);
    expect(admission).toMatch(/n’est pas reprise/);
  });

  it('sans référence ni analyse détenues, le snapshot anonyme importé devient l’analyse de la recette, annoncé comme tel', async () => {
    const { sourceId: _id, sourceSnapshot: _snapshot, ...plan } = recipeWaterPlan();
    const { save } = mount(json(sourceRecipe({ waterPlan: plan as WaterPlan })));
    const incoming = importedSnapshot('');
    const admission = await previewThenApply({ waterPlan: { sourceSnapshot: incoming } });
    expect(admission).toMatch(/deviendra l’analyse de cette recette, sans lien avec une source de ton carnet/);
    const saved = saveFromRecap(save).waterPlan!;
    expect(hasOwn(saved, 'sourceId')).toBe(false);
    expect(saved.sourceSnapshot).toEqual(incoming);
  });

  it('témoin C03 : un import partiel qui déclare sa référence et son snapshot cohérent remplace A comme avant', async () => {
    const declared = importedSnapshot('analyse-importee-declaree-synthetique');
    const { save } = mount(json(sourceRecipe()));
    const admission = await previewThenApply({ waterPlan: { sourceId: declared.id, sourceSnapshot: declared } });
    expect(admission).toBe('');
    expect(saveFromRecap(save).waterPlan).toMatchObject({ sourceId: declared.id, sourceSnapshot: declared });
  });
});

const A_START_C05: WaterIons = { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 };
const A_WORT_C05: WaterIons = { ca: 40.9, mg: 2, na: 5, so4: 10, cl: 34.3, hco3: 104 };
