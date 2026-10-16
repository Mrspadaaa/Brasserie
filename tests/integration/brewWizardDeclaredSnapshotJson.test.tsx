// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { brewerJobs, type HopV55SemanticWizardJobReadInputV1, type HopV55SemanticWizardJobSendInputV1 } from '../../src/services/brewerJobs';
import { BrewingMath } from '../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import type { BrewhouseProfile, Recipe } from '../../src/types';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter,
  type BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { canonicalizeHopV55RecipeDraft } from '../../src/services/hopV55/recipeStepContext';
import { HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT,
  readHopV55AssistedAdviceWizardTicketV1 } from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1,
  type HopV55SemanticWizardJobSnapshotV1 } from '../../src/services/hopV55/semanticAdoptionApplicationHost';
import { createBrewerHopAdviceSemanticRuntimeV3, createBrewerHopAdviceSemanticRuntimeWizardV1 } from '../../src/services/brewerHopAdviceRuntime';
import { HopV55SemanticAdviceCapabilityContext, type HopV55SemanticAdviceCapabilityV3 } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';
import { allerEtape } from '../helpers/wizard';

/*
 * The real BrewWizard builds the draft and hands it to the real hop step; the real canonical projection, Request3,
 * ticket writer and strict ticket reader then run unchanged. Only storage engines (memory adapters, as in
 * brewWizardHopV55 and hopV55SemanticCompanion39), presentation-heavy panels and the provider transport are local.
 */
const runtimeState = vi.hoisted(() => ({ workspaceDatabase: undefined as unknown, scenarios: undefined as unknown }));
const stepProps = vi.hoisted(() => ({ recipes: [] as unknown[] }));
const recipeSaves = vi.hoisted(() => ({ calls: [] as unknown[] }));

vi.mock('../../src/services/hopV55/runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/services/hopV55/runtime')>();
  return { ...actual, createHopV55Services: (options: Parameters<typeof actual.createHopV55Services>[0]) => ({
    ...actual.createHopV55Services({ ...options, workspaceDatabase: runtimeState.workspaceDatabase as never }),
    scenarios: runtimeState.scenarios as never }) };
});
// Observation only: the real hop step renders unchanged; the wrapper records the exact recipe the wizard declares to it.
vi.mock('../../src/ui/hopV55/RecipeStep', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/ui/hopV55/RecipeStep')>();
  const ReactModule = await import('react');
  return { ...actual, HopV55RecipeStep: (props: import('../../src/ui/hopV55/RecipeStep').HopV55RecipeStepProps) => {
    stepProps.recipes.push(props.recipe);
    return ReactModule.createElement(actual.HopV55RecipeStep, props);
  } };
});
vi.mock('../../src/services/recipeSave', () => ({
  saveRecipeConfirmed: async (recipe: unknown) => {
    recipeSaves.calls.push(recipe);
    throw new Error('Ce banc n’enregistre aucune recette.');
  },
}));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/ui/hopV55/ReferencePanel', () => ({ HopV55ReferencePanel: () => null }));
vi.mock('../../src/ui/hopV55/Comparison', () => ({ HopV55Comparison: () => null }));
vi.mock('../../src/ui/hopV55/ProgramEditor', async importOriginal => ({
  ...(await importOriginal<typeof import('../../src/ui/hopV55/ProgramEditor')>()), HopV55ProgramEditor: () => null,
}));
vi.mock('../../src/ui/hopV55/PlanningEditor', () => ({ HopV55PlanningEditor: () => null }));
vi.mock('../../src/ui/hopV55/Explorer', () => ({ HopV55Explorer: () => null }));
vi.mock('../../src/ui/hopV55/HypothesisEditor', () => ({ HopV55HypothesisEditor: () => null }));
vi.mock('../../src/ui/hopV55/BiologicalInputsEditor', () => ({ BiologicalInputsEditor: () => null }));
vi.mock('../../src/ui/hopV55/SensoryComparison', () => ({ HopV55SensoryComparison: () => null }));
vi.mock('../../src/ui/hopV55/NuanceExplorer', () => ({ HopV55NuanceExplorer: () => null }));
vi.mock('../../src/ui/hopV55/AssistedAdvicePanel', () => ({ AssistedAdvicePanel: () => null }));

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown): string { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryWorkspaceDatabase implements HopV55WorkspaceDatabaseAdapter {
  readonly workspaces = new MemoryWorkspaceTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const snapshot = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); } catch (error) {
        this.workspaces.rows.clear(); for (const [key, row] of snapshot) this.workspaces.rows.set(key, row); throw error;
      }
    });
    this.tail = operation.then(() => undefined, () => undefined); return operation;
  }
  close() {}
}

class MemoryScenarioTable implements BrewingScenarioLocalTable<any> {
  readonly rows = new Map<string, any>();
  constructor(private readonly secondKey: 'scenarioId' | 'eventId') {}
  private key(value: unknown) {
    if (Array.isArray(value)) return JSON.stringify(value);
    const row = value as Record<string, unknown>;
    return JSON.stringify([row.ownerKey, row[this.secondKey]]);
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: any) { const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError'); this.rows.set(key, structuredClone(row)); }
  async put(row: any) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()].filter(row => {
    if (index === 'ownerKey') return row.ownerKey === key;
    if (index === '[ownerKey+scenarioId]') return JSON.stringify([row.ownerKey, row.scenarioId]) === JSON.stringify(key);
    return false;
  }).map(row => structuredClone(row)) }) }; }
}

class MemoryScenarioDatabase implements BrewingScenarioLocalDatabaseAdapter {
  readonly dossiers = new MemoryScenarioTable('scenarioId');
  readonly events = new MemoryScenarioTable('eventId');
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(work);
    this.tail = operation.then(() => undefined, () => undefined); return operation;
  }
  close() {}
}

const OWNER = 'owner:wizard-declared-snapshot';
const QUESTION = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const WIZARD_OPEN = 'Ouvrir un dossier assisté pour ce brouillon';
const SEND = 'Envoyer la lecture assistée';
const RETRY = 'Réessayer le même ticket';
const SLOW = { timeout: 10000 };
/** Every refusal wording of the strict JSON guard of the archive codec. */
const JSON_REFUSAL = /n’est pas un snapshot JSON sérialisable|doit être un objet JSON simple|contient un nombre non fini|contient une référence cyclique/;
/** The Wizard ticket reader checks JSON first, then structure: reaching this message means the JSON guard accepted. */
const STRUCTURE_AFTER_JSON = /^Structure ou identité du ticket Wizard invalide/;
/** Fields that BrewWizard.build() can only take from the edited Recipe itself. */
const BASE_ONLY_OPTIONALS = ['version', 'parentRecipeId', 'favorite', 'archivedAt'] as const;

function recipeStepCatalogueReferences() {
  const variety: HopVariety = { id: 'wizard-declared-synthetic-hop', name: 'Houblon synthétique sans analyse',
    aliases: [], form: 'unknown', descriptions: [], analysis: [] };
  return { varieties: [variety], knowledge: [] };
}

beforeEach(() => {
  localStorage.clear();
  stepProps.recipes.length = 0;
  recipeSaves.calls.length = 0;
  runtimeState.workspaceDatabase = new MemoryWorkspaceDatabase();
  runtimeState.scenarios = createBrewingScenarioLocalRepository({ database: new MemoryScenarioDatabase() });
  vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockImplementation(async () => recipeStepCatalogueReferences());
  vi.spyOn(FirebaseAuthService, 'getCurrentUser').mockImplementation(() => ({ uid: OWNER, displayName: 'Brasseur fixture' }) as unknown as User);
});
afterEach(() => { cleanup(); brewerJobs.stop(); vi.restoreAllMocks(); localStorage.clear(); });

/** A valid saved Recipe without version, parent or other optional fields (brewWizardHopV55 fixture shape). */
function savedRecipe(): Recipe {
  const profile: BrewhouseProfile = { id: 'my-rig', name: 'Cuve personnelle', volumeL: 26, efficiencyPct: 75,
    boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment },
    preferences: { ...practicalBrewingPreferences } };
  const water = BrewingMath.waterVolumes(2.5, 26, profile, 'batch', 60, 0);
  const fixture = fixtureRecipe();
  return { ...fixture, id: 'recipe-wizard-declared-snapshot', name: 'Pale enregistrée', brewhouse: profile, volumeL: 26, totalGristKg: 2.5,
    installation: { manualWaterSplit: false, fermenterHeadspacePct: 10, spargeExceptionAccepted: false },
    hops: [], fermentables: [{ ...fixture.fermentables[0], weightKg: 2.5 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], ratioLPerKg: water.mashWaterL / 2.5, spargeType: 'batch' },
    preBoilL: water.preBoilVolumeL, preBoilHotL: water.preBoilHotL,
    waterPlan: { ...fixture.waterPlan!, sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE,
      mashWaterL: water.mashWaterL, spargeWaterL: water.spargeWaterL },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
}

function mountWizard(recipe: Recipe, options: { ownerKey?: string; capability?: HopV55SemanticAdviceCapabilityV3 } = {}) {
  const save = vi.fn();
  const wizard = <BrewWizard localOnly={!options.capability} ownerKey={options.ownerKey} seed={{ recipe }}
    config={{ ...defaultConfig, brewhouses: [recipe.brewhouse!], activeBrewhouseId: recipe.brewhouse!.id }}
    stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={save}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />;
  const view = render(options.capability
    ? <HopV55SemanticAdviceCapabilityContext.Provider value={options.capability}>{wizard}</HopV55SemanticAdviceCapabilityContext.Provider>
    : wizard);
  return { save, view };
}

/**
 * The exact recipe the real wizard declares to its real hop step. Without an explicit owner the step stays closed
 * (no dossier and no asynchronous load); its `recipe` prop is still the live build() of the draft.
 */
async function declaredStepRecipe(seed: Recipe, edit?: () => void): Promise<Recipe> {
  stepProps.recipes.length = 0;
  const { save, view } = mountWizard(seed);
  edit?.();
  allerEtape(/^Houblons$/);
  await screen.findByText(/Le profil propriétaire de ce brouillon n’est pas fourni explicitement/, {}, SLOW);
  const declared = stepProps.recipes.at(-1);
  expect(save).not.toHaveBeenCalled();
  view.unmount();
  if (!declared) throw new Error('Le vrai HopV55RecipeStep n’a reçu aucun brouillon du Wizard.');
  return declared as Recipe;
}

/** Wire draft exactly as the hop step forwards it: the real canonical projection of the declared recipe. */
function wireDraftOf(recipe: Recipe) {
  return canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: recipe.id, draft: recipe }).recipe;
}
const canonicalReferenceOf = (recipe: Recipe) => canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: recipe.id, draft: recipe }).reference;

/** Verdict of the real strict JSON guard of the Wizard ticket reader, which runs before any structural check. */
function ticketJsonGuard(draft: unknown): string {
  const read = readHopV55AssistedAdviceWizardTicketV1({ format: HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT, wire: { draft } });
  return read.status === 'invalid' ? read.reason : `lecture ${read.status}`;
}

/** Every own property or array item holding `undefined` (holes are not items), as a readable path. */
function ownUndefinedPaths(value: unknown, path = 'recipe', ancestors: object[] = []): string[] {
  if (!value || typeof value !== 'object' || ancestors.includes(value)) return [];
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return [];
  const nested = [...ancestors, value];
  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? Object.keys(value).map(index => [`${path}[${index}]`, value[Number(index)]])
    : Object.entries(value).map(([key, child]) => [`${path}.${key}`, child]);
  return entries.flatMap(([childPath, child]) => child === undefined ? [childPath] : ownUndefinedPaths(child, childPath, nested));
}

const hasOwn = (value: unknown, key: string) => Object.prototype.hasOwnProperty.call(value, key);

/** Local Wizard provider: it records an emission only under the exact durable ticket and never produces an answer. */
function wizardFixture() {
  const server = {
    wizardEmissions: [] as unknown[],
    wizardTicketDurableAtEmission: [] as boolean[],
    classicSubmissions: 0,
    snapshots: new Map<string, HopV55SemanticWizardJobSnapshotV1>(),
  };
  const ticketDurable = async (send: HopV55SemanticWizardJobSendInputV1) => {
    const repository = createHopV55WorkspaceRepository({ ownerKey: OWNER, database: runtimeState.workspaceDatabase as HopV55WorkspaceDatabaseAdapter });
    const workspace = await repository.read(OWNER, send.wire.hopAdvice.contextLaunch.workspaceId);
    const raw = (workspace?.assistedSemanticAdviceTickets ?? []).find(row => !!row && typeof row === 'object'
      && (row as { reference?: unknown }).reference === send.ticketReference);
    const read = raw ? readHopV55AssistedAdviceWizardTicketV1(raw) : undefined;
    return read?.status === 'readOnly' && read.ticket.references.wireReference === send.wireReference
      && JSON.stringify(read.ticket.wire) === JSON.stringify(send.wire);
  };
  const receive = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1> => {
    const durable = await ticketDurable(send);
    server.wizardTicketDurableAtEmission.push(durable);
    if (!durable) throw new Error('Fixture : aucun ticket Wizard durable exact avant l’émission.');
    server.wizardEmissions.push(structuredClone(send.wire));
    const snapshot: HopV55SemanticWizardJobSnapshotV1 = { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1, operationId: send.operationId,
      generation: send.generation, ticketReference: send.ticketReference, wireReference: send.wireReference,
      status: 'failed', reason: 'Fixture : émission reçue sous son ticket durable; aucune réponse n’est produite.' };
    server.snapshots.set(send.operationId, snapshot);
    return structuredClone(snapshot);
  };
  const refuseClassic = async (): Promise<never> => {
    server.classicSubmissions++;
    throw new Error('Voie compagnon classique hors de ce test.');
  };
  const capability: HopV55SemanticAdviceCapabilityV3 = {
    kind: 'fixture',
    createRuntimeForScope: input => createBrewerHopAdviceSemanticRuntimeV3({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
      scope: input.scope, providerKind: 'fixture', readGeneration: async () => 0,
      transport: { submit: refuseClassic, retry: refuseClassic, read: async () => null } }),
    createWizardRuntimeForScope: input => createBrewerHopAdviceSemanticRuntimeWizardV1({ ownerKey: input.ownerKey,
      workspaceId: input.workspaceId, scope: input.scope, providerKind: 'fixture', readGeneration: async () => 0,
      transport: { submit: receive, retry: receive, read: async (query: HopV55SemanticWizardJobReadInputV1) => {
        const snapshot = server.snapshots.get(query.operationId);
        return snapshot && snapshot.ticketReference === query.ticketReference ? structuredClone(snapshot) : null;
      } } }),
  };
  return { server, capability };
}

describe('BrewWizard — brouillon déclaré JSON avant le ticket Wizard', () => {
  it('ne déclare aucune propriété propre undefined pour une Recipe sans version, parent ni optionnels, sentinelles comprises', async () => {
    const seed = savedRecipe();
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(seed, key), `${key} absent de la Recipe de départ`).toBe(false);
    const before = structuredClone(seed);
    const declared = await declaredStepRecipe(seed, () => {
      const boil = document.getElementById('wz-boil') as HTMLInputElement;
      fireEvent.change(boil, { target: { value: '' } });
      fireEvent.blur(boil);
    });

    expect(ownUndefinedPaths(declared), 'Un champ optionnel non renseigné reste absent, à toute profondeur.').toEqual([]);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(declared, key), `${key} reste absent du brouillon déclaré`).toBe(false);
    // The wizard keeps its raw missing-number sentinel: no JSON round trip happens in the builder.
    expect(Number.isNaN(declared.boilMin)).toBe(true);
    const wire = wireDraftOf(declared);
    expect(wire.boilMin).toBeNull();
    const verdict = ticketJsonGuard(wire);
    expect(verdict).not.toMatch(JSON_REFUSAL);
    expect(verdict).toMatch(STRUCTURE_AFTER_JSON);
    // Same canonical reference as the JSON representation of this draft (saved and local copies are JSON).
    expect(canonicalReferenceOf(declared)).toBe(canonicalReferenceOf(JSON.parse(JSON.stringify(declared)) as Recipe));
    expect(seed).toStrictEqual(before);
  }, 60000);

  it('omet une version ou un parent propres undefined sans muter la Recipe source', async () => {
    const seed = { ...savedRecipe(), version: undefined, parentRecipeId: undefined, favorite: undefined, archivedAt: undefined } as Recipe;
    const before = structuredClone(seed);
    const declared = await declaredStepRecipe(seed);

    expect(ownUndefinedPaths(declared)).toEqual([]);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(declared, key), `${key} undefined devient absent, sans valeur inventée`).toBe(false);
    expect(ticketJsonGuard(wireDraftOf(declared))).toMatch(STRUCTURE_AFTER_JSON);
    expect(seed).toStrictEqual(before);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(seed, key), `${key} reste une propriété de la source`).toBe(true);
  }, 60000);

  it('garde exactement version 0, une version définie, les valeurs 0, false, null, chaîne vide et l’ordre des listes', async () => {
    const base = savedRecipe();
    const hops = [
      { name: 'Zeta amérisant', alpha: 0, weightG: 12, stage: 'boil', timeMin: 60 },
      { name: 'Alpha à cru', alpha: 11, weightG: 30, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 0 },
    ] as Recipe['hops'];
    const zeroes = { ...base, version: 0, parentRecipeId: '', favorite: false, archivedAt: null, colorEbc: 0, notesCreation: '', hops,
      installation: { ...base.installation!, fermenterHeadspacePct: 0, spargeExceptionAccepted: false } } as unknown as Recipe;
    const before = structuredClone(zeroes);
    const declared = await declaredStepRecipe(zeroes);

    expect(ownUndefinedPaths(declared)).toEqual([]);
    expect(declared).toMatchObject({ version: 0, parentRecipeId: '', favorite: false, archivedAt: null, colorEbc: 0, notesCreation: '' });
    expect(declared.hops).toStrictEqual(hops);
    expect(declared.installation).toMatchObject({ fermenterHeadspacePct: 0, spargeExceptionAccepted: false });
    expect(ticketJsonGuard(wireDraftOf(declared))).toMatch(STRUCTURE_AFTER_JSON);
    expect(zeroes).toStrictEqual(before);

    const versioned = { ...base, version: 7, parentRecipeId: 'recipe-parent-fixture' } as Recipe;
    const declaredVersion = await declaredStepRecipe(versioned);
    expect(ownUndefinedPaths(declaredVersion)).toEqual([]);
    expect(declaredVersion).toMatchObject({ version: 7, parentRecipeId: 'recipe-parent-fixture' });
    expect(ticketJsonGuard(wireDraftOf(declaredVersion))).toMatch(STRUCTURE_AFTER_JSON);
  }, 60000);

  it('laisse les valeurs étrangères visibles, refusées par le premier lecteur strict : Date, élément undefined, trou, fonction, instance, infini', async () => {
    const base = savedRecipe();
    const withForeign = (values: Record<string, unknown>) =>
      ({ ...base, installation: { ...base.installation!, ...values } }) as unknown as Recipe;

    // Date and undefined item pass the canonical projection; the strict ticket JSON guard is their first refusal.
    // No function shares this draft: the canonical reference would refuse it first and hide these assertions.
    const date = new Date('2026-10-06T08:00:00.000Z');
    const undefinedItem = ['avant', undefined, 'après'];
    const hole = ['avant', 'milieu', 'après'];
    delete hole[1];
    const declared = await declaredStepRecipe(withForeign({ fixtureDate: date, fixtureUndefinedItem: undefinedItem, fixtureHole: hole }));

    // Nothing foreign is converted, filtered or filled by the producer: same references, same length, same hole.
    const installation = declared.installation as unknown as Record<string, unknown>;
    expect(installation.fixtureDate).toBe(date);
    expect(installation.fixtureUndefinedItem).toBe(undefinedItem);
    expect(installation.fixtureHole).toBe(hole);
    const wireInstallation = (wireDraftOf(declared) as unknown as { installation: Record<string, unknown> }).installation;
    expect(wireInstallation.fixtureDate).toBeInstanceOf(Date);
    expect(ticketJsonGuard({ installation: { fixtureDate: wireInstallation.fixtureDate } }))
      .toMatch(/^ticket Wizard\.wire\.draft\.installation\.fixtureDate doit être un objet JSON simple/);
    expect(ticketJsonGuard({ installation: { fixtureUndefinedItem: wireInstallation.fixtureUndefinedItem } }))
      .toMatch(/^ticket Wizard\.wire\.draft\.installation\.fixtureUndefinedItem\[1\] n’est pas un snapshot JSON sérialisable/);
    expect(ticketJsonGuard(wireDraftOf(declared))).toMatch(JSON_REFUSAL);
    // Documented guard limit: its forEach does not visit holes. The producer keeps the hole as a hole, nothing more.
    const wireHole = wireInstallation.fixtureHole as unknown[];
    expect(wireHole).toHaveLength(3);
    expect(1 in wireHole).toBe(false);

    // Function, class instance and Infinity never reach the ticket guard: the canonical projection of the hop step
    // refuses them first (reference serialization for a function, plain-object and finite-number checks otherwise).
    class FixtureForeign { readonly label = 'instance étrangère'; }
    const callback = () => 'fonction étrangère';
    const earlyRefusals: Array<[string, unknown, RegExp]> = [
      ['fonction', callback, /^Contenu de référence non sérialisable\.$/],
      ['instance', new FixtureForeign(), /^Objet non sérialisable dans le brouillon V5\.5 \(recipe\.installation\.fixtureValue\)\.$/],
      ['infini', Number.POSITIVE_INFINITY, /^Nombre infini interdit dans le brouillon V5\.5 \(recipe\.installation\.fixtureValue\); /],
    ];
    for (const [label, value, refusal] of earlyRefusals) {
      const declaredValue = await declaredStepRecipe(withForeign({ fixtureValue: value }));
      expect((declaredValue.installation as unknown as Record<string, unknown>).fixtureValue, `${label} gardé par référence`).toBe(value);
      expect(() => wireDraftOf(declaredValue), `${label} refusé par la projection canonique`).toThrow(refusal);
    }
  }, 90000);

  it('scelle le ticket Wizard durable du vrai brouillon déclaré puis n’émet qu’une fois sous ce ticket', async () => {
    const { server, capability } = wizardFixture();
    const seed = savedRecipe();
    const before = structuredClone(seed);
    const { save } = mountWizard(seed, { ownerKey: OWNER, capability });
    allerEtape(/^Houblons$/);
    const host = await screen.findByTestId('recipe-hop-v55', {}, SLOW);
    const step = within(host);
    await step.findByTestId('hop-v55', {}, SLOW);
    fireEvent.change(await step.findByRole('textbox', { name: 'Question au brasseur' }, SLOW), { target: { value: QUESTION } });
    fireEvent.click(step.getByRole('button', { name: 'Lire ma question' }));
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    const dialog = await screen.findByRole('dialog', { name: 'Compagnon brasseur' }, SLOW);
    const send = await within(dialog).findByRole('button', { name: SEND }, SLOW);
    const declared = stepProps.recipes.at(-1) as Recipe;
    expect(ownUndefinedPaths(declared)).toEqual([]);
    expect(server.wizardEmissions).toEqual([]);

    fireEvent.click(send);
    await waitFor(() => expect(within(dialog).queryByRole('button', { name: RETRY })
      ?? screen.queryAllByText(JSON_REFUSAL)[0] ?? null).not.toBeNull(), SLOW);
    expect(screen.queryAllByText(JSON_REFUSAL).map(node => node.textContent),
      'La garde JSON stricte ne refuse pas le brouillon déclaré par le vrai Wizard.').toEqual([]);
    expect(within(dialog).getByRole('button', { name: RETRY })).toBeInTheDocument();

    // The ticket was durable before the single emission, and the emitted wire is exactly the sealed one.
    expect(server.wizardTicketDurableAtEmission).toEqual([true]);
    expect(server.wizardEmissions).toHaveLength(1);
    const repository = createHopV55WorkspaceRepository({ ownerKey: OWNER, database: runtimeState.workspaceDatabase as HopV55WorkspaceDatabaseAdapter });
    const dossier = (await repository.list(OWNER)).find(row => row.wizardOrigin !== undefined);
    expect(dossier?.assistedSemanticAdviceTickets).toHaveLength(1);
    const read = readHopV55AssistedAdviceWizardTicketV1(dossier!.assistedSemanticAdviceTickets![0]);
    if (read.status !== 'readOnly') throw new Error(`Ticket Wizard durable attendu : ${read.status === 'invalid' ? read.reason : read.status}`);
    expect(server.wizardEmissions[0]).toEqual(read.ticket.wire);
    const wireDraft = read.ticket.wire.draft as Record<string, unknown>;
    expect(wireDraft).toStrictEqual(wireDraftOf(declared));
    expect(ownUndefinedPaths(wireDraft, 'wire.draft')).toEqual([]);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(wireDraft, key), `${key} absent du wire scellé`).toBe(false);

    expect(server.classicSubmissions).toBe(0);
    expect(save).not.toHaveBeenCalled();
    expect(recipeSaves.calls).toEqual([]);
    expect(seed).toStrictEqual(before);
  }, 120000);
});
