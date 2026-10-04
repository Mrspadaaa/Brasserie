import Dexie, { type Table } from 'dexie';
import { sha256 } from '@noble/hashes/sha2.js';
import {
  applyBrewerCatalogueCommand,
  canonicalBrewerCatalogueFingerprintInput,
  projectBrewerCatalogueEntity,
  stampBrewerCatalogueFingerprint,
} from '../../../functions/src/brewerCatalogueCore.js';
import {
  assertBrewerCatalogueCommand,
  brewerCatalogueIdentityKeys,
  normalizeBrewerCatalogueIdentity,
  type BrewerCatalogueCommand,
  type BrewerCatalogueEntity,
  type BrewerCatalogueIdentityCandidate,
  type BrewerCatalogueKind,
} from '../../../functions/src/brewerCatalogueSchema.js';
import type { BrewerCatalogueLookupRecord, BrewerCatalogueReceipt, BrewerCatalogueWriteResult } from '../../../functions/src/brewerCatalogueStore.js';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopVariety, HopSource } from '../../../functions/src/hopIndexSchema.js';
import type { HopKnowledge, HopYeast } from '../../../functions/src/hopPredictionSchema.js';
import type { BrewingStyleGuide } from '../../../functions/src/brewingStyleSchema.js';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction.js';
import { readBrewingReferenceRecord } from '../../domain/brewingReference';
import { brewingObservationFactReference } from '../../domain/brewingObservationNumerics';
import { loadBrewingCatalogueReferences } from '../../domain/brewingCatalogueReferences';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition } from '../../domain/hopDecision/types';
import { prepareBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { newNoloConfig } from '../../domain/nolo';
import { createBrewingScenarioLocalRepository, type BrewingScenarioLocalDatabaseAdapter } from '../brewingScenarioLocalRepository';
import { createHopDecisionLocalRepository } from '../hopDecisionLocalRepository';
import type { Recipe, RecipeSnapshot } from '../../types';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter } from './workspaceRepository';
import { readHopV55FutureRecipeDraft } from './futureRecipeDraft';
import { adoptHopV55ReferenceHypothesis, ensureHopV55ReferenceJournal, getHopV55ReferenceHypotheses,
  hopV55ReferenceContextId } from './referenceWorkspace';
import { appendHopV55ObservationAnchor, prepareHopV55ObservationAnchor,
  appendHopV55CurrentPreparationRecord, prepareHopV55CurrentPreparationRecord, readHopV55ObservationAnchorRecord,
  type HopV55ObservationReferenceCommand } from './observationSession';
import { appendHopV55ObservationSupportRecord, createHopV55ObservationSupportArithmeticRecord,
  createHopV55ObservationSupportHopScopeRecord, createHopV55ObservationSupportProtocolNoteRecord,
  createHopV55ObservationSupportDefinition, readHopV55ObservationSupportRecord, readHopV55ObservationSupportSelection,
  resolveHopV55ObservationSupport, selectHopV55ObservationSupport } from './observationSupport';
import { makeHopV55PropertyAdviceRequalificationCurrentContext,
  seedHopV55PropertyAdviceRequalificationFixture,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID,
  HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED } from './propertyAdviceRequalificationFixture';
import { loadHopV55CanonicalObservationFixture, HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS,
  type HopV55CanonicalObservationFixtureV1 } from './canonicalObservationFixture';
import { createHopV55AssistedAdviceBackendContractV1, createHopV55AssistedAdviceWorkspaceClient } from './assistedAdviceWorkspace';
import type { HopV55CatalogueClient, HopV55ContextSource, HopV55LocalFutureDraftSource,
  HopV55LocalRecipeCopySource, HopV55Services, HopV55Workspace, HopV55WorkspaceRepository } from './contracts';

export const HOP_V55_FIXTURE_DATABASE_PREFIX = 'laffinee-hop-v55-fixture-';
export type HopV55FixtureMode = 'planning' | 'fermenting' | 'unknown' | 'unknownCulture' | 'nolo' | 'sour';

export interface HopV55FixtureServicesOptions {
  mode?: HopV55FixtureMode;
  /** Explicit synthetic dossiers; canonicalContextOnly exposes physical fixture context without persisting a dossier. */
  seed?: 'unknownMassFuture' | 'canonicalObservation' | 'canonicalContextOnly' | typeof HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED;
  /** @internal Deterministic test seam; normal previews always use Dexie. */
  catalogueDatabase?: HopV55FixtureCatalogueDatabaseAdapter;
  /** @internal Deterministic test seam; normal previews always use the isolated Dexie scenario store. */
  scenarioDatabase?: BrewingScenarioLocalDatabaseAdapter;
  /** @internal Deterministic test seam; normal previews always use the isolated Dexie workspace. */
  workspaceDatabase?: HopV55WorkspaceDatabaseAdapter;
  /** @internal Deterministic test seam; normal previews load the real references. */
  loadReferences?: () => Promise<HopV55FixtureReferences>;
}

const FIXTURE_SOURCE: HopSource = {
  title: 'Donnée synthétique de démonstration', author: 'Fixture locale', year: null,
  kind: 'judgment', reference: 'fixture://hop-v55/synthetic',
};

export interface HopV55FixtureReferences {
  varieties: HopVariety[];
  knowledge: HopKnowledge[];
}

function fictionalVarieties(): HopVariety[] {
  return [
    { id: 'hop-v55-fixture-identity-a', name: 'Identité fictive A', aliases: [], form: 'unknown', descriptions: [], analysis: [] },
    { id: 'hop-v55-fixture-identity-b', name: 'Identité fictive B', aliases: [], form: 'unknown', descriptions: [], analysis: [] },
    { id: 'hop-v55-fixture-identity-c', name: 'Identité fictive C', aliases: [], form: 'unknown', descriptions: [], analysis: [] },
  ];
}

function fictionalYeast(): HopYeast {
  return { id: 'hop-v55-fixture-culture-neutral', kind: 'yeast', name: 'Culture fictive neutre', betaLyase: 'unknown', source: FIXTURE_SOURCE };
}

/** Three neutral, unsupported identities exercise selection without naming a
 * commercial product or assigning a chemical coefficient from its name. */
export function makeHopV55FixtureReferences(): HopV55FixtureReferences {
  return { varieties: fictionalVarieties(), knowledge: [fictionalYeast()] };
}

function fixtureRecipe(mode: HopV55FixtureMode = 'planning'): Recipe {
  const recipe: Recipe = {
    id: `hop-v55-fixture-recipe-${mode}`,
    name: mode === 'sour' ? 'Recette acide synthétique' : mode === 'unknownCulture' ? 'Recette à culture inconnue' : 'Recette synthétique avant brassage',
    style: mode === 'sour' ? 'Style acide de démonstration' : 'Style non renseigné',
    volumeL: 20,
    ogTarget: null,
    fgTarget: null,
    abvTarget: null,
    fermentables: [],
    totalGristKg: 0,
    // Recipe.alpha is a required legacy number. V5.5 does not consume it; zero
    // is called out as a schema filler and is never presented as an assay.
    // Aroma timing/contact/temperature below are explicit synthetic plan inputs,
    // not journal facts or measurements.
    hops: [
      { name: 'Identité fictive A', hopVarietyId: 'hop-v55-fixture-identity-a', alpha: 0, weightG: 40, stage: 'boil', timeMin: 5 },
      { name: 'Identité fictive B', hopVarietyId: 'hop-v55-fixture-identity-b', alpha: 0, weightG: 30, stage: 'dryHop', dayOffset: 3,
        aromaTiming: 'fermentation', aromaContactHours: 48, aromaTemperatureC: 19 },
    ],
    yeast: mode === 'unknownCulture' ? { name: 'Culture inconnue pour la fixture' }
      : { name: 'Culture fictive neutre', hopIndexId: 'hop-v55-fixture-culture-neutral' },
    steps: [], notes: [],
    notesCreation: 'Fixture synthétique. Les quantités, le timing à cru, le contact 48 h et la cible 19 °C décrivent un plan d’exercice; alpha=0 remplit le champ historique requis et n’est pas une mesure.',
    fermentation: mode === 'sour'
      ? [{ kind: 'primaire', name: 'Phase synthétique', tempC: 19, days: 5 }]
      : [{ kind: 'primaire', name: 'Phase synthétique', tempC: 19, days: 7 }],
  };
  if (mode === 'nolo') recipe.nolo = { ...newNoloConfig(), enabled: true };
  return recipe;
}

function baseContext(mode: HopV55FixtureMode): BrewerContext {
  const context: BrewerContext = {
    recipe: mode === 'unknown' ? undefined : fixtureRecipe(mode),
    hopIndex: {
      varieties: fictionalVarieties(), lots: [], knowledge: [fictionalYeast()], predictions: [], tastings: [], truncated: [],
    },
    inventory: [], material: [], waterSources: [], phase: `Fixture V5.5 · ${mode}`,
    now: Date.parse('2026-10-02T08:00:00.000Z'),
    provenance: ['Contexte synthétique local; aucune donnée de brasseur ni mesure réelle.'],
  };
  context.provenance.push('Le champ alpha=0 est un remplissage du type Recipe historique, pas une mesure; le moteur V5.5 ne déduit aucun coefficient du nom fictif.');

  if (mode === 'fermenting') {
    const recipe = fixtureRecipe(mode);
    const recipeSnapshot: RecipeSnapshot = {
      ...structuredClone(recipe), capturedAt: '2026-10-01T09:00:00.000Z', sourceRecipeId: recipe.id,
    };
    delete (recipeSnapshot as Partial<Recipe>).id;
    delete (recipeSnapshot as Partial<Recipe>).favorite;
    delete (recipeSnapshot as Partial<Recipe>).batchRef;
    delete (recipeSnapshot as Partial<Recipe>).archivedAt;
    // The default host context and explicit batch source both use this exact
    // immutable snapshot. The live source recipe remains separately addressable
    // through the batch's recipeRef branch below.
    context.recipe = structuredClone(recipeSnapshot) as unknown as Recipe;
    context.batch = {
      id: 'hop-v55-fixture-batch-fermenting', brewDate: '2026-10-01', name: 'Brassin synthétique en fermentation',
      style: recipe.style, volumeL: recipe.volumeL, status: 'fermentation', recipeRef: recipe.id,
      recipeSnapshot,
    };
    context.journal = {
      revision: 1,
      startedAt: Date.parse('2026-10-01T09:00:00.000Z'),
      pitchedAt: Date.parse('2026-10-01T15:00:00.000Z'),
      additions: { 'hop-0': { amount: 40, unit: 'g', doneAt: Date.parse('2026-10-01T10:30:00.000Z') } },
    };
    context.provenance.push('Un ajout déjà effectué est consigné; le houblonnage à cru reste planifié dans la recette.');
  }

  if (mode === 'unknown') context.provenance.push('Recette, journal et passé du brassin absents; ils restent inconnus.');
  if (mode === 'unknownCulture') context.provenance.push('La recette synthétique ne porte pas d’identité de culture; aucun profil de levure n’est déduit de son nom.');
  if (mode === 'nolo') context.provenance.push('La cible Nolo par défaut de cette recette est synthétique et reste un objectif, pas une mesure.');
  if (mode === 'sour') context.provenance.push('Exemple de processus acide synthétique; aucun résultat de fermentation n’est attesté.');
  return context;
}

/** Only test/preview contexts use these modes; none is a product setting. */
export function makeHopV55FixtureContext(mode: HopV55FixtureMode): BrewerContext {
  if (!['planning', 'fermenting', 'unknown', 'unknownCulture', 'nolo', 'sour'].includes(mode)) throw new Error('Mode de fixture V5.5 invalide.');
  return structuredClone(baseContext(mode));
}

export const HOP_V55_UNKNOWN_MASS_FUTURE_SEED_WORKSPACE_ID = 'workspace:m01-unknown-mass-future';
export const HOP_V55_UNKNOWN_MASS_FUTURE_SEED_REFERENCE_ID = 'reference:m01-unknown-mass-future';
export const HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS = [
  'm01-addition-unknown-mass', 'm01-addition-known-3-75g',
] as const;
const UNKNOWN_MASS_FUTURE_SEED_RECORDED_AT = '2026-10-02T08:00:00.000Z';
export const HOP_V55_CANONICAL_OBSERVATION_SEED_WORKSPACE_ID = HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.workspaceId;
const CANONICAL_OBSERVATION_SEED_RECORDED_AT = '2026-10-02T07:00:00.000Z';
const sharedFixtureSeedPromises = new Map<string, Promise<void>>();

function isUnknownMassFutureSeed(workspace: HopV55Workspace): boolean {
  const hypothesis = getHopV55ReferenceHypotheses(workspace).find(row =>
    row.id === HOP_V55_UNKNOWN_MASS_FUTURE_SEED_REFERENCE_ID && row.version === 1);
  if (!hypothesis || hypothesis.baseline.kind !== 'hypothetical') return false;
  const program = hypothesis.baseline.program;
  const additions = hypothesis.baseline.input.additions;
  return program?.volumeL === 8 && program.additions.length === 2
    && program.additions[0].id === HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[0]
    && program.additions[0].grams === null && program.additions[0].use === 'fermentation'
    && program.additions[1].id === HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[1]
    && program.additions[1].grams === 3.75 && program.additions[1].use === 'fermentation'
    && additions.length === 2 && additions[0].triplet.doseGL === null
    && additions[1].triplet.doseGL === 3.75 / 8;
}

async function seedUnknownMassFutureWorkspace(ownerKey: string, workspaces: HopV55WorkspaceRepository): Promise<void> {
  const workspaceId = HOP_V55_UNKNOWN_MASS_FUTURE_SEED_WORKSPACE_ID;
  const existing = await workspaces.read(ownerKey, workspaceId);
  if (existing) {
    if (!isUnknownMassFutureSeed(existing)) {
      throw new Error('Le workspace réservé au seed M01 existe avec une autre origine; aucune donnée n’a été remplacée.');
    }
    return;
  }

  const context = makeHopV55FixtureContext('unknown');
  const prepared = prepareBrewingScenarioContext(context);
  if (prepared.runtime.current) throw new Error('Le seed M01 exige un contexte sans recette ni brassin physique.');
  const materialA = prepared.runtime.materials.find(row => row.variety?.id === 'hop-v55-fixture-identity-a');
  const materialB = prepared.runtime.materials.find(row => row.variety?.id === 'hop-v55-fixture-identity-b');
  if (!materialA || !materialB || materialA.variety!.analysis.length || materialB.variety!.analysis.length) {
    throw new Error('Le seed M01 exige les deux identités fictives avec analyses inconnues.');
  }

  const additions: HopProgramAddition[] = [
    { id: HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[0], materialId: materialA.id, grams: null,
      use: 'fermentation', status: 'planned', temperatureC: 14, contactHours: 36 },
    { id: HOP_V55_UNKNOWN_MASS_FUTURE_SEED_ADDITION_IDS[1], materialId: materialB.id, grams: 3.75,
      use: 'fermentation', status: 'planned', temperatureC: 14, contactHours: 36 },
  ];
  const materials: HopDecisionMaterial[] = [structuredClone(materialA), structuredClone(materialB)];
  const program: HopDecisionProgram = { id: 'program:m01-unknown-mass-future', revision: 1, stage: 'planning',
    volumeL: 8, wortGravity: null, additions: structuredClone(additions) };
  const input: HopRecipeInput = { volumeL: 8, yeastId: null, fermentation: [], additions: [
    { id: additions[0].id, name: materialA.name, triplet: { varietyId: materialA.variety!.id,
      lotId: materialA.lot?.id ?? null, yeastId: null, timing: 'fermentation', doseGL: null,
      temperatureC: 14, contactHours: 36, matrixId: null } },
    { id: additions[1].id, name: materialB.name, triplet: { varietyId: materialB.variety!.id,
      lotId: materialB.lot?.id ?? null, yeastId: null, timing: 'fermentation', doseGL: 3.75 / 8,
      temperatureC: 14, contactHours: 36, matrixId: null } },
  ] };
  const label = 'Base hypothétique M01 · deux ajouts à froid, une masse inconnue';
  const hypothesis: HopV55Workspace['referenceHypotheses'][number] = {
    id: HOP_V55_UNKNOWN_MASS_FUTURE_SEED_REFERENCE_ID,
    version: 1,
    label,
    baseline: { kind: 'hypothetical', label, input, program, materials: { hops: materials } },
    recordedAt: '2026-10-02T08:01:00.000Z',
  };
  const draft: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'M01 · masse d’un ajout à préciser',
    intent: { question: 'Préparer une base hypothétique de 8 L avec deux ajouts à froid; préciser la masse inconnue sans la traiter comme zéro.',
      criteria: [{ id: 'm01-find-unknown-mass', label: 'Conserver puis préciser la première masse', direction: 'investigate' }] },
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: UNKNOWN_MASS_FUTURE_SEED_RECORDED_AT,
  };
  const opened = ensureHopV55ReferenceJournal(draft, context, prepared);
  const adopted = adoptHopV55ReferenceHypothesis(opened, hypothesis, context, prepared);
  try {
    await workspaces.save(adopted, null);
  } catch (error) {
    const raced = await workspaces.read(ownerKey, workspaceId);
    if (raced && isUnknownMassFutureSeed(raced)) return;
    throw error;
  }
}

function isCanonicalObservationSeed(workspace: HopV55Workspace, fixture: HopV55CanonicalObservationFixtureV1): boolean {
  if (workspace.id !== HOP_V55_CANONICAL_OBSERVATION_SEED_WORKSPACE_ID || !workspace.referenceJournal
    || workspace.sourceBatchId !== HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId
    || !workspace.nuancePlans?.some(plan => plan.planId === fixture.plan.planId && plan.reference === fixture.plan.reference)) return false;
  const journal = readBrewingReferenceRecord(workspace.referenceJournal.record, workspace.referenceJournal.events);
  if ('status' in journal) return false;
  const recorded = journal.projection.observations.find(row => row.id === fixture.note.id && row.version === fixture.note.version);
  const records = (workspace.observationAnchors ?? []).map(readHopV55ObservationAnchorRecord)
    .filter((row): row is Extract<typeof row, { status: 'readOnly' }> => row.status === 'readOnly');
  const anchor = records.find(row => row.record.id === fixture.anchor.id
    && (row.record.recordKind ?? 'observationAnchor') === 'observationAnchor');
  const current = records.find(row => row.record.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.currentPreparationId
    && row.record.recordKind === 'currentPreparation');
  if (!recorded || !anchor || !current) return false;
  const supportRows = workspace.observationSupportRecords ?? [];
  const protocolRaw = supportRows.find(row => row.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.protocolSupportId);
  const scopeRaw = supportRows.find(row => row.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.scopeSupportId);
  const arithmeticRaw = supportRows.find(row => row.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.arithmeticSupportId);
  const protocol = protocolRaw && readHopV55ObservationSupportRecord(protocolRaw);
  const scope = scopeRaw && readHopV55ObservationSupportRecord(scopeRaw);
  const arithmetic = arithmeticRaw && readHopV55ObservationSupportRecord(arithmeticRaw);
  const selectionRaw = workspace.observationSupportSelections?.find(row => row.id === HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.supportSelectionId);
  const selection = selectionRaw && readHopV55ObservationSupportSelection(selectionRaw);
  if (!protocol || protocol.status !== 'readOnly' || protocol.record.recordKind !== 'protocolNote'
    || !scope || scope.status !== 'readOnly' || scope.record.recordKind !== 'hopScope'
    || !arithmetic || arithmetic.status !== 'readOnly' || arithmetic.record.recordKind !== 'arithmetic'
    || !selection || selection.status !== 'readOnly') return false;
  return brewingObservationFactReference(recorded) === brewingObservationFactReference(fixture.note)
    && recorded.observedAt === fixture.note.observedAt && recorded.sense.kind === 'sensoryRating'
    && recorded.sense.value === 37
    && anchor.record.workspaceId === workspace.id && anchor.record.anchor?.reference === fixture.anchor.reference
    && anchor.record.observationReference?.id === fixture.note.id && anchor.record.observationReference.version === fixture.note.version
    && anchor.record.preparation.reference === fixture.prepared.reference
    && anchor.record.preparation.observedHopInput?.used[0]?.grams === 80
    && anchor.record.preparation.observedHopInput.used[0].elapsedHours === 6
    && current.record.workspaceId === workspace.id && current.record.anchor === null && current.record.observationReference === null
    && current.record.preparation.reference === fixture.prepared.reference
    && current.record.preparationOptions.asOf === fixture.options.asOf
    && current.record.preparationOptions.knowledgeAsOf === fixture.options.knowledgeAsOf
    && current.record.preparation.observedHopInput?.used[0]?.grams === 80
    && current.record.preparation.observedHopInput.used[0].elapsedHours === 6
    && protocol.record.definition.contentReference === fixture.noteDefinition.contentReference
    && protocol.record.meaning.kind === 'intensity' && protocol.record.meaning.orientation === 'increasing'
    && hopDecisionReference(scope.record.scope) === hopDecisionReference(fixture.options.hopScope)
    && hopDecisionReference(arithmetic.record.contract) === hopDecisionReference(fixture.arithmetic)
    && selection.selection.dimensionReference === fixture.noteDefinition.contentReference
    && selection.selection.hopScopeReference === scope.record.reference
    && hopDecisionReference(selection.selection.frameReferences) === hopDecisionReference([fixture.plan.reference])
    && selection.selection.arithmeticReference === arithmetic.record.reference;
}

async function seedCanonicalObservationWorkspace(ownerKey: string, workspaces: HopV55WorkspaceRepository,
  fixture: HopV55CanonicalObservationFixtureV1): Promise<void> {
  const workspaceId = HOP_V55_CANONICAL_OBSERVATION_SEED_WORKSPACE_ID;
  const existing = await workspaces.read(ownerKey, workspaceId);
  if (existing) {
    if (!isCanonicalObservationSeed(existing, fixture)) {
      throw new Error('Le workspace réservé à l’observation canonique existe avec une autre origine; aucune donnée n’a été remplacée.');
    }
    return;
  }

  const context = structuredClone(fixture.context);
  const preparedScenario = prepareBrewingScenarioContext(context);
  const draft: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Observation canonique · fixture synthétique',
    intent: { question: 'Relire puis, si souhaité, saisir une observation de fixture ancrée au snapshot canonique. Elle ne décrit aucune dégustation réelle.', criteria: [] },
    sourceBatchId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId,
    scenarioIds: [], referenceHypotheses: [], copies: [],
    nuancePlans: [structuredClone(fixture.plan)], updatedAt: CANONICAL_OBSERVATION_SEED_RECORDED_AT,
  };
  const opened = ensureHopV55ReferenceJournal(draft, context, preparedScenario);
  if (!opened.referenceJournal) throw new Error('Le journal fixture canonique n’a pas pu être ouvert.');
  const preparedCurrent = prepareHopV55CurrentPreparationRecord({ workspace: opened,
    id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.currentPreparationId, context, options: fixture.options });
  if (preparedCurrent.status !== 'ready') {
    throw new Error(preparedCurrent.status === 'refused' ? preparedCurrent.reasons.join(' ') : preparedCurrent.requirements.join(' '));
  }
  const command: HopV55ObservationReferenceCommand = {
    ownerKey, contextId: hopV55ReferenceContextId(workspaceId), commandId: 'canonical-observation-record:v1',
    expectedRevision: opened.referenceJournal.record.revision, recordedAt: CANONICAL_OBSERVATION_SEED_RECORDED_AT,
    kind: 'observationRecorded', payload: { observation: structuredClone(fixture.note) },
  };
  const preparedAnchor = prepareHopV55ObservationAnchor({ workspace: opened, id: fixture.anchor.id, source: structuredClone(fixture.source),
    referenceCommand: command, anchor: { subjectRelation: fixture.anchor.subjectRelation, explanation: fixture.anchor.explanation,
      createdAt: fixture.anchor.createdAt, createdBy: structuredClone(fixture.anchor.createdBy) } });
  if (preparedAnchor.status !== 'ready' || !preparedAnchor.referenceJournalPatch) {
    throw new Error(preparedAnchor.status === 'refused' ? preparedAnchor.reasons.join(' ') : preparedAnchor.status === 'needs'
      ? preparedAnchor.requirements.join(' ') : 'L’ancre canonique de fixture n’a pas été préparée.');
  }
  const withCurrentPreparation = appendHopV55CurrentPreparationRecord(opened, preparedCurrent.record);
  let seeded = appendHopV55ObservationAnchor(withCurrentPreparation, preparedAnchor.record, preparedAnchor.referenceJournalPatch);
  const supportActor = structuredClone(fixture.plan.proposedBy);
  const recordBase = (id: string, supportId: string) => ({ workspace: seeded, id, supportId, revision: 1,
    predecessorReference: null, recordedAt: CANONICAL_OBSERVATION_SEED_RECORDED_AT, recordedBy: supportActor });
  const protocol = createHopV55ObservationSupportProtocolNoteRecord({
    ...recordBase(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.protocolSupportId, HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.protocolSupportId),
    definition: createHopV55ObservationSupportDefinition({ dimension: fixture.noteDefinition.dimension,
      metric: fixture.noteDefinition.metric, scale: fixture.noteDefinition.scale }),
    meaning: { kind: 'intensity', orientation: 'increasing' },
  });
  seeded = appendHopV55ObservationSupportRecord(seeded, protocol);
  const scope = createHopV55ObservationSupportHopScopeRecord({
    ...recordBase(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.scopeSupportId, HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.scopeSupportId),
    scope: structuredClone(fixture.options.hopScope!),
  });
  seeded = appendHopV55ObservationSupportRecord(seeded, scope);
  const arithmetic = createHopV55ObservationSupportArithmeticRecord({
    ...recordBase(HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.arithmeticSupportId, HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.arithmeticSupportId),
    contract: structuredClone(fixture.arithmetic),
  });
  seeded = appendHopV55ObservationSupportRecord(seeded, arithmetic);
  seeded = selectHopV55ObservationSupport(seeded, {
    id: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.supportSelectionId,
    recordedAt: CANONICAL_OBSERVATION_SEED_RECORDED_AT, recordedBy: supportActor,
    dimensionReference: fixture.noteDefinition.contentReference,
    hopScopeReference: scope.reference, frameReferences: [fixture.plan.reference], arithmeticReference: arithmetic.reference,
  });
  try {
    await workspaces.save(seeded, null);
  } catch (error) {
    const raced = await workspaces.read(ownerKey, workspaceId);
    if (raced && isCanonicalObservationSeed(raced, fixture)) return;
    throw error;
  }
}

function getSharedFixtureSeedPromise(ownerKey: string, workspaceId: string, seed: () => Promise<void>): Promise<void> {
  const key = `${ownerKey}\0${workspaceId}`;
  const existing = sharedFixtureSeedPromises.get(key);
  if (existing) return existing;
  let task: Promise<void>;
  task = seed().catch(error => {
    if (sharedFixtureSeedPromises.get(key) === task) sharedFixtureSeedPromises.delete(key);
    throw error;
  });
  sharedFixtureSeedPromises.set(key, task);
  return task;
}

interface FixtureCatalogueRow {
  kind: BrewerCatalogueKind;
  id: string;
  record: BrewerCatalogueEntity;
}

interface FixtureOperationRow {
  operationId: string;
  commandFingerprint: string;
  kind: BrewerCatalogueKind;
  targetId: string;
  receipt: BrewerCatalogueReceipt;
}

export interface HopV55FixtureCatalogueDatabaseAdapter {
  records: {
    get(key: unknown): Promise<FixtureCatalogueRow | undefined>;
    add(row: FixtureCatalogueRow): Promise<unknown>;
    put(row: FixtureCatalogueRow): Promise<unknown>;
    toArray(): Promise<FixtureCatalogueRow[]>;
  };
  operations: {
    get(key: unknown): Promise<FixtureOperationRow | undefined>;
    add(row: FixtureOperationRow): Promise<unknown>;
  };
  transaction<T>(mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T>;
  close(): void;
}

class FixtureCatalogueDatabase extends Dexie {
  records!: Table<FixtureCatalogueRow, [BrewerCatalogueKind, string]>;
  operations!: Table<FixtureOperationRow, string>;

  constructor(databaseName: string) {
    super(databaseName);
    this.version(1).stores({
      records: '[kind+id], kind, id',
      operations: 'operationId',
    });
  }
}

interface ScannedCatalogueRow {
  kind: BrewerCatalogueKind;
  id: string;
  record: BrewerCatalogueEntity;
  revision: number;
  fingerprint: string;
  origin: 'persisted' | 'bundled';
  keys: Map<string, Array<BrewerCatalogueIdentityCandidate>>;
}

function digest(value: string): string {
  return Array.from(sha256(new TextEncoder().encode(value)), byte => byte.toString(16).padStart(2, '0')).join('');
}

function canonical(value: unknown): string {
  const sort = (node: any): any => {
    if (Array.isArray(node)) return node.map(sort);
    if (!node || typeof node !== 'object') return node;
    return Object.fromEntries(Object.entries(node).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => [key, sort(child)]));
  };
  return JSON.stringify(sort(value));
}

function entityKind(record: BrewerCatalogueEntity): BrewerCatalogueKind {
  if ('kind' in record) return record.kind === 'yeast' ? 'yeastStrain' : record.kind === 'styleGuide' ? 'brewingStyle' : 'yeastStrain';
  return 'hopVariety';
}

function fingerprint(record: BrewerCatalogueEntity): string {
  return digest(canonicalBrewerCatalogueFingerprintInput(record));
}

function keysByOwner(record: BrewerCatalogueEntity, kind: BrewerCatalogueKind, hash: string): Map<string, Array<BrewerCatalogueIdentityCandidate>> {
  const keys = new Map<string, Array<BrewerCatalogueIdentityCandidate>>();
  const add = (key: string, styleId?: string) => {
    const candidate: BrewerCatalogueIdentityCandidate = { kind, id: record.id, fingerprint: hash, ...(styleId ? { styleId } : {}) };
    const rows = keys.get(key) ?? [];
    if (!rows.some(row => row.styleId === candidate.styleId)) rows.push(candidate);
    keys.set(key, rows);
  };
  const allKeys = brewerCatalogueIdentityKeys(record);
  if (kind === 'brewingStyle' && 'kind' in record && record.kind === 'styleGuide') {
    const styleOwned = new Set<string>();
    for (const style of record.styles) {
      const ownKeys = brewerCatalogueIdentityKeys({ ...record, catalogueMeta: undefined, styles: [style] } as BrewerCatalogueEntity);
      for (const key of ownKeys) { styleOwned.add(key); add(key, style.id); }
    }
    for (const key of allKeys) if (!styleOwned.has(key)) add(key);
  } else for (const key of allKeys) add(key);
  return keys;
}

function scanRecord(record: BrewerCatalogueEntity, origin: 'persisted' | 'bundled'): ScannedCatalogueRow {
  const kind = entityKind(record);
  const hash = fingerprint(record);
  return {
    kind, id: record.id, record: structuredClone(record), revision: record.catalogueMeta?.revision ?? 0,
    fingerprint: hash, origin, keys: keysByOwner(record, kind, hash),
  };
}

function referenceRows(references: HopV55FixtureReferences, kind: BrewerCatalogueKind): BrewerCatalogueEntity[] {
  if (kind === 'hopVariety') return references.varieties;
  return references.knowledge.filter((record): record is HopKnowledge & BrewerCatalogueEntity => kind === 'yeastStrain'
    ? 'kind' in record && record.kind === 'yeast'
    : 'kind' in record && record.kind === 'styleGuide');
}

function sameIdentityKey(candidate: BrewerCatalogueIdentityCandidate): string {
  return `${candidate.kind}\0${candidate.id}\0${candidate.styleId ?? ''}`;
}

function candidatesForKeys(rows: ScannedCatalogueRow[], keys: string[]): BrewerCatalogueIdentityCandidate[] {
  const requested = new Set(keys);
  const byIdentity = new Map<string, BrewerCatalogueIdentityCandidate>();
  for (const row of rows) for (const [key, candidates] of row.keys) {
    if (!requested.has(key)) continue;
    for (const candidate of candidates) byIdentity.set(sameIdentityKey(candidate), candidate);
  }
  return [...byIdentity.values()].sort((a, b) => sameIdentityKey(a).localeCompare(sameIdentityKey(b)));
}

function mergedRows(references: HopV55FixtureReferences, persisted: FixtureCatalogueRow[], kind: BrewerCatalogueKind): ScannedCatalogueRow[] {
  const byIdentity = new Map<string, ScannedCatalogueRow>();
  for (const record of referenceRows(references, kind)) {
    try { byIdentity.set(`${kind}\0${record.id}`, scanRecord(record, 'bundled')); }
    catch (error) { throw new Error(`Référence ${kind}/${record.id} invalide; scan d’identité incomplet : ${(error as Error).message}`); }
  }
  for (const row of persisted) {
    if (row.kind !== kind) continue;
    if (!row.id || row.record.id !== row.id || entityKind(row.record) !== row.kind) {
      throw new Error('Fiche catalogue fixture incohérente; scan d’identité incomplet.');
    }
    try {
      const scanned = scanRecord(row.record, 'persisted');
      if (row.record.catalogueMeta?.fingerprint && row.record.catalogueMeta.fingerprint.toLowerCase() !== scanned.fingerprint) {
        throw new Error('Empreinte enregistrée incohérente.');
      }
      byIdentity.set(`${row.kind}\0${row.id}`, scanned);
    }
    catch (error) { throw new Error(`Fiche fixture ${row.kind}/${row.id} invalide; scan d’identité incomplet : ${(error as Error).message}`); }
  }
  return [...byIdentity.values()];
}

function asConflict(error: unknown, identityCandidates?: BrewerCatalogueIdentityCandidate[]): BrewerCatalogueWriteResult & { scope: 'fixture' } {
  return { status: 'conflict', reason: error instanceof Error ? error.message : 'Scan d’identité fixture incomplet.',
    ...(identityCandidates?.length ? { identityCandidates } : {}), scope: 'fixture' };
}

function asInvalid(reason: string): BrewerCatalogueWriteResult & { scope: 'fixture' } {
  return { status: 'invalid', reason, scope: 'fixture' };
}

function fixtureId(kind: BrewerCatalogueKind, operationId: string): string {
  return `fixture-${kind}-${digest(operationId).slice(0, 32)}`;
}

function styleIds(operationId: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `fixture-style-${digest(`${operationId}\0${index}`).slice(0, 32)}`);
}

function targetKind(command: BrewerCatalogueCommand): BrewerCatalogueKind {
  return command.operation === 'create' ? command.entity.kind : command.target.kind;
}

function createFixtureCatalogueClient(options: {
  ownerKey: string;
  namespace: string;
  databaseName: string;
  loadReferences: () => Promise<HopV55FixtureReferences>;
  database?: HopV55FixtureCatalogueDatabaseAdapter;
}): HopV55CatalogueClient & { close(): void; loadOverlay(): Promise<BrewerCatalogueEntity[]> } {
  const database = options.database ?? new FixtureCatalogueDatabase(options.databaseName) as unknown as HopV55FixtureCatalogueDatabaseAdapter;

  const client: HopV55CatalogueClient & { close(): void; loadOverlay(): Promise<BrewerCatalogueEntity[]> } = {
    scope: 'fixture',

    async lookup(kind, query) {
      if (!['hopVariety', 'yeastStrain', 'brewingStyle'].includes(kind) || !query.trim() || query.length > 200) {
        throw new Error('Recherche de catalogue fixture invalide.');
      }
      const references = await options.loadReferences();
      const stored = await database.records.toArray();
      const rows = mergedRows(references, stored, kind);
      const needle = normalizeBrewerCatalogueIdentity(query);
      const records: BrewerCatalogueLookupRecord[] = [];
      for (const row of rows) {
        const projection = projectBrewerCatalogueEntity(row.record);
        const haystack = normalizeBrewerCatalogueIdentity([row.id, ...projection.searchTerms].join('\n'));
        if (!haystack.includes(needle)) continue;
        records.push({ kind: row.kind, id: row.id, record: structuredClone(row.record), revision: row.revision,
          fingerprint: row.fingerprint, origin: row.origin });
        if (kind === 'brewingStyle' && 'kind' in row.record && row.record.kind === 'styleGuide') {
          const guide = row.record as BrewingStyleGuide;
          const match = guide.styles.find(style => normalizeBrewerCatalogueIdentity(`${guide.name} ${guide.edition} ${style.code} ${style.name} ${style.aliases.join(' ')}`).includes(needle));
          if (match) records[records.length - 1].styleId = match.id;
        }
      }
      records.sort((a, b) => a.id.localeCompare(b.id));
      return { records, truncated: false };
    },

    async write(command) {
      try { assertBrewerCatalogueCommand(command); }
      catch (error) { return asInvalid(error instanceof Error ? error.message : 'Commande catalogue fixture invalide.'); }
      const references = await options.loadReferences();
      const commandFingerprint = digest(canonical(command));
      const kind = targetKind(command);
      const committedAt = new Date().toISOString();

      try {
        return await database.transaction('rw', database.records, database.operations, async () => {
          const priorOperation = await database.operations.get(command.operationId);
          if (priorOperation) {
            if (priorOperation.commandFingerprint !== commandFingerprint || priorOperation.kind !== kind) {
              return asConflict(new Error('operationId déjà utilisé avec un contenu différent.'));
            }
            const existingRecord = await database.records.get([kind, priorOperation.targetId]);
            if (!existingRecord) return asConflict(new Error('Reçu fixture trouvé mais fiche absente; relire avant toute reprise.'));
            if (existingRecord.kind !== kind || existingRecord.id !== existingRecord.record.id || entityKind(existingRecord.record) !== kind) {
              return asConflict(new Error('Le reçu fixture pointe vers une fiche incohérente.'));
            }
            const current = scanRecord(existingRecord.record, 'persisted');
            if (existingRecord.record.catalogueMeta?.fingerprint
              && existingRecord.record.catalogueMeta.fingerprint.toLowerCase() !== current.fingerprint) {
              return asConflict(new Error('Empreinte de la fiche fixture incohérente après relecture.'));
            }
            return {
              status: 'duplicate', kind, id: current.id, record: structuredClone(current.record),
              revision: current.revision, fingerprint: current.fingerprint, receipt: structuredClone(priorOperation.receipt), scope: 'fixture',
            };
          }

          const persisted = await database.records.toArray();
          const rows = mergedRows(references, persisted, kind);
          let current: ScannedCatalogueRow | undefined;
          let identityCandidates: BrewerCatalogueIdentityCandidate[] = [];
          let operationKeys: string[];
          if (command.operation === 'create') {
            operationKeys = brewerCatalogueIdentityKeys(command.entity, command.claims, command.projectionChoices);
            identityCandidates = candidatesForKeys(rows, operationKeys);
            current = undefined;
          } else {
            current = rows.find(row => row.id === command.target.id);
            if (!current) return asConflict(new Error('L’identité cible est absente; relire le catalogue fixture.'));
            if (current.revision !== command.target.expectedRevision || current.fingerprint !== command.target.expectedFingerprint.toLowerCase()) {
              return asConflict(new Error('La fiche fixture a changé depuis sa lecture; relire révision et empreinte.'));
            }
            const existingKeys = new Set(current.keys.keys());
            const nextKeys = new Set(brewerCatalogueIdentityKeys(current.record, command.claims, command.projectionChoices));
            operationKeys = [...new Set([...existingKeys, ...nextKeys])].sort();
            const newlyAsserted = [...nextKeys].filter(key => !existingKeys.has(key));
            const collisions = candidatesForKeys(rows, newlyAsserted).filter(candidate => !(candidate.kind === kind && candidate.id === current!.id));
            if (collisions.length) return asConflict(new Error('Cette identité fixture possède déjà un nom ou alias attribué à une autre fiche.'), collisions);
          }
          if (!operationKeys.length) return asConflict(new Error('identity-check-incomplete: aucune clé d’identité à vérifier.'));

          const reduced = applyBrewerCatalogueCommand(current?.record ?? null, structuredClone(command), {
            recordedAt: committedAt,
            ...(command.operation === 'create' ? {
              allocatedId: fixtureId(kind, command.operationId),
              ...(command.operation === 'create' && command.entity.kind === 'brewingStyle'
                ? { allocatedStyleIds: styleIds(command.operationId, command.entity.value.styles.length) } : {}),
              identityCheckComplete: true,
              identityCandidates,
            } : { currentFingerprint: current?.fingerprint ?? null }),
          });
          if (reduced.status !== 'applied') return {
            status: reduced.status, reason: reduced.reason,
            ...(identityCandidates.length ? { identityCandidates } : {}), scope: 'fixture',
          };

          const resultFingerprint = fingerprint(reduced.record);
          const sealed = stampBrewerCatalogueFingerprint(reduced.record, resultFingerprint);
          const receipt: BrewerCatalogueReceipt = {
            schemaVersion: 1, ownerKey: options.ownerKey, namespace: options.namespace,
            operationId: command.operationId, commandFingerprint, kind, targetId: sealed.id,
            status: 'committed', revision: sealed.catalogueMeta?.revision ?? 0,
            fingerprint: resultFingerprint, committedAt,
          };
          const storedRow: FixtureCatalogueRow = { kind, id: sealed.id, record: structuredClone(sealed) };
          const alreadyStored = persisted.some(row => row.kind === kind && row.id === sealed.id);
          if (alreadyStored) await database.records.put(storedRow);
          else await database.records.add(storedRow);
          await database.operations.add({ operationId: command.operationId, commandFingerprint, kind, targetId: sealed.id, receipt });
          return {
            status: 'applied', kind, id: sealed.id, record: structuredClone(sealed),
            revision: sealed.catalogueMeta?.revision ?? 0, fingerprint: resultFingerprint, receipt, scope: 'fixture',
          };
        });
      } catch (error) {
        return asConflict(error);
      }
    },
    close() { database.close(); },
    async loadOverlay() {
      const stored = await database.records.toArray();
      return stored.map(row => {
        if (row.id !== row.record.id || row.kind !== entityKind(row.record)) throw new Error('Fiche catalogue fixture incohérente.');
        const current = scanRecord(row.record, 'persisted');
        if (row.record.catalogueMeta?.fingerprint && row.record.catalogueMeta.fingerprint.toLowerCase() !== current.fingerprint) {
          throw new Error('Empreinte de la fiche fixture incohérente.');
        }
        return structuredClone(current.record);
      });
    },
  };
  return client;
}

function requireNamespace(namespace: string): string {
  if (typeof namespace !== 'string' || !namespace.trim() || namespace.trim() !== namespace || namespace.length > 96) {
    throw new Error('Un namespace fixture explicite et non vide est requis.');
  }
  return namespace;
}

async function fixtureReferences(): Promise<HopV55FixtureReferences> {
  const actual = await loadBrewingCatalogueReferences();
  const synthetic = makeHopV55FixtureReferences();
  return {
    varieties: [...actual.varieties, ...synthetic.varieties],
    knowledge: [...actual.knowledge, ...synthetic.knowledge],
  };
}

/** @internal Adapter seam for deterministic tests; application code uses the
 * one-argument services factory below and therefore always gets Dexie. */
export function createHopV55FixtureCatalogueClientForTests(options: {
  namespace: string;
  database: HopV55FixtureCatalogueDatabaseAdapter;
  loadReferences?: () => Promise<HopV55FixtureReferences>;
}): HopV55CatalogueClient & { close(): void; loadOverlay(): Promise<BrewerCatalogueEntity[]> } {
  const namespace = requireNamespace(options.namespace);
  const encoded = encodeURIComponent(namespace);
  return createFixtureCatalogueClient({
    ownerKey: `fixture:${encoded}`, namespace,
    databaseName: `${HOP_V55_FIXTURE_DATABASE_PREFIX}${encoded}-catalogue-v1`,
    loadReferences: options.loadReferences ?? fixtureReferences,
    database: options.database,
  });
}

function revisionOf(value: { catalogueMeta?: { revision?: number } }): number {
  return Number.isSafeInteger(value.catalogueMeta?.revision) ? value.catalogueMeta!.revision! : 0;
}

function mergeById<T extends { id: string; catalogueMeta?: { revision?: number } }>(references: readonly T[], current: readonly T[] = [], overlay: readonly T[] = []): T[] {
  const byId = new Map<string, T>();
  for (const row of references) byId.set(row.id, structuredClone(row));
  for (const row of current) {
    const prior = byId.get(row.id);
    if (!prior || revisionOf(row) >= revisionOf(prior)) byId.set(row.id, structuredClone(row));
  }
  for (const row of overlay) {
    const prior = byId.get(row.id);
    if (!prior || revisionOf(row) >= revisionOf(prior)) byId.set(row.id, structuredClone(row));
  }
  return [...byId.values()];
}

function mergeFixtureContext(
  context: BrewerContext,
  references: HopV55FixtureReferences,
  overlay: readonly BrewerCatalogueEntity[] = [],
  recipe?: Recipe,
): BrewerContext {
  const copy = structuredClone(context);
  if (recipe) {
    if (copy.batch && copy.batch.status !== 'planifie') {
      throw new Error('La fixture représente un brassin déjà commencé; un chargement de copie ne remplace pas sa recette ni son snapshot.');
    }
    copy.recipe = structuredClone(recipe);
  }
  const index = copy.hopIndex;
  const overlayVarieties = overlay.filter(record => !('kind' in record)) as HopVariety[];
  const overlayKnowledge = overlay.filter((record): record is HopKnowledge & BrewerCatalogueEntity => 'kind' in record) as HopKnowledge[];
  copy.hopIndex = {
    varieties: mergeById(references.varieties, index?.varieties ?? [], overlayVarieties),
    lots: structuredClone(index?.lots ?? []),
    knowledge: mergeById(references.knowledge, index?.knowledge ?? [], overlayKnowledge),
    predictions: structuredClone(index?.predictions ?? []),
    tastings: structuredClone(index?.tastings ?? []),
    truncated: structuredClone(index?.truncated ?? []),
  };
  return copy;
}

function resolveFixtureContextSource(context: BrewerContext, source: HopV55ContextSource | undefined,
  hasRecipeOverride: boolean): BrewerContext {
  const copy = structuredClone(context);
  if (!source) return copy;
  if (source.kind === 'localFutureDraft') {
    throw new Error('Une fixture de brouillon futur n’est pas une recette source physique; charge son baseline hypothétique.');
  }
  if (source.kind === 'localRecipeCopy') {
    throw new Error('Une fixture de copie locale proposée n’est pas une recette source du mode; charge la copie exacte du workspace.');
  }
  if (source.kind === 'exploration') {
    if (Object.keys(source).length !== 1) throw new Error('Source fixture d’exploration ambiguë.');
    if (hasRecipeOverride) throw new Error('Une recette détachée fixture exige une recette source exacte; l’exploration n’en invente pas.');
    delete copy.recipe; delete copy.batch; delete copy.journal; delete copy.localJournal;
    delete copy.workspace; delete copy.editableTargets;
    copy.phase = 'Fixture V5.5 · exploration sans source';
    copy.provenance = ['Source d’exploration fixture explicitement sélectionnée; recette, batch et passé restent inconnus.'];
    return copy;
  }
  if (source.kind === 'recipe') {
    if (typeof source.recipeId !== 'string' || !source.recipeId.trim() || source.recipeId.trim() !== source.recipeId
      || Object.keys(source).length !== 2) {
      throw new Error(`Recette source fixture « ${source.recipeId ?? ''} » absente du mode et namespace courant; aucune autre entrée n’est substituée.`);
    }
    if (copy.recipe?.id !== source.recipeId && copy.batch?.recipeRef === source.recipeId && copy.batch.recipeSnapshot) {
      // This fixture snapshot is copied from fixtureRecipe with only its live ID
      // removed; restore that exact ID for the explicitly selected recipe route.
      const reconstructed = { ...structuredClone(copy.batch.recipeSnapshot), id: source.recipeId } as unknown as Recipe;
      delete (reconstructed as RecipeSnapshot & { id?: string }).sourceRecipeId;
      delete (reconstructed as RecipeSnapshot & { id?: string }).capturedAt;
      copy.recipe = reconstructed;
    }
    if (copy.recipe?.id !== source.recipeId) {
      throw new Error(`Recette source fixture « ${source.recipeId} » absente du mode et namespace courant; aucune autre entrée n’est substituée.`);
    }
    if (hasRecipeOverride && copy.batch && copy.batch.status !== 'planifie') {
      throw new Error('La fixture contient un brassin déjà commencé; la recette copiée ne remplace pas son snapshot.');
    }
    delete copy.batch; delete copy.journal; delete copy.localJournal;
    copy.provenance = [...copy.provenance, `Recette source fixture exacte : ${source.recipeId}.`];
    return copy;
  }
  if (source.kind === 'batch') {
    if (typeof source.batchId !== 'string' || !source.batchId.trim() || source.batchId.trim() !== source.batchId
      || Object.keys(source).length !== 2 || copy.batch?.id !== source.batchId) {
      throw new Error(`Brassin source fixture « ${source.batchId ?? ''} » absent du mode et namespace courant; aucun autre brassin n’est substitué.`);
    }
    if (!copy.batch.recipeSnapshot) throw new Error(`Snapshot recette absent du brassin fixture « ${source.batchId} »; aucune recette courante n’est substituée.`);
    copy.recipe = structuredClone(copy.batch.recipeSnapshot);
    copy.provenance = [...copy.provenance, `Brassin source fixture exact : ${source.batchId}; recette issue de son snapshot.`];
    return copy;
  }
  throw new Error('Type de source fixture V5.5 inconnu.');
}

/** Isolated browser preview. Scenario, workspace and qualified-study stores are
 * Dexie repositories on fixture-only database names; catalogue rows/receipts
 * stay in a separate browser fixture database. */
export function createHopV55FixtureServices(namespace: string, options: HopV55FixtureServicesOptions = {}): HopV55Services {
  const safeNamespace = requireNamespace(namespace);
  const mode = options.mode ?? 'planning';
  if (!['planning', 'fermenting', 'unknown', 'unknownCulture', 'nolo', 'sour'].includes(mode)) throw new Error('Mode de fixture V5.5 invalide.');
  if (options.seed !== undefined && options.seed !== 'unknownMassFuture' && options.seed !== 'canonicalObservation'
    && options.seed !== 'canonicalContextOnly' && options.seed !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED) {
    throw new Error('Seed fixture V5.5 inconnu.');
  }
  if (options.seed === 'unknownMassFuture' && mode !== 'unknown') {
    throw new Error('Le seed unknownMassFuture exige le mode sans recette/passé inconnu.');
  }
  if ((options.seed === 'canonicalObservation' || options.seed === 'canonicalContextOnly') && mode !== 'fermenting') {
    throw new Error(`Le seed ${options.seed} exige le mode de brassin en fermentation.`);
  }
  if (options.seed === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED && mode !== 'planning') {
    throw new Error('Le seed de requalification exige le mode Recipe avant brassage.');
  }
  const encoded = encodeURIComponent(`${safeNamespace}-${mode}`);
  const prefix = `${HOP_V55_FIXTURE_DATABASE_PREFIX}${encoded}`;
  const ownerKey = `fixture:${encoded}`;
  let referencesPromise: Promise<HopV55FixtureReferences> | undefined;
  const referencesLoader = options.loadReferences ?? fixtureReferences;
  const loadReferences = () => (referencesPromise ??= referencesLoader().catch(error => { referencesPromise = undefined; throw error; }));
  const catalogue = createFixtureCatalogueClient({ ownerKey, namespace: safeNamespace,
    databaseName: `${prefix}-catalogue-v1`, loadReferences, database: options.catalogueDatabase });
  const scenarios = createBrewingScenarioLocalRepository({ databaseName: `${prefix}-scenarios-v1`, database: options.scenarioDatabase });
  const qualifiedStudies = createHopDecisionLocalRepository({ databaseName: `${prefix}-qualified-studies-v1` });
  const assistedAdviceContract = createHopV55AssistedAdviceBackendContractV1();
  const rawWorkspaces = createHopV55WorkspaceRepository({ ownerKey, databaseName: `${prefix}-workspaces-v1`,
    database: options.workspaceDatabase, assistedAdviceContract });
  const assistedAdvice = createHopV55AssistedAdviceWorkspaceClient({ ownerKey, workspaces: rawWorkspaces, contract: assistedAdviceContract });
  let canonicalObservationPromise: Promise<HopV55CanonicalObservationFixtureV1> | undefined;
  const canonicalObservationFixture = () => (canonicalObservationPromise ??= loadHopV55CanonicalObservationFixture()
    .catch(error => { canonicalObservationPromise = undefined; throw error; }));
  const seedReady = options.seed === 'unknownMassFuture'
    ? options.workspaceDatabase
      ? seedUnknownMassFutureWorkspace(ownerKey, rawWorkspaces)
      : getSharedFixtureSeedPromise(ownerKey, HOP_V55_UNKNOWN_MASS_FUTURE_SEED_WORKSPACE_ID,
        () => seedUnknownMassFutureWorkspace(ownerKey, rawWorkspaces))
    : options.seed === 'canonicalObservation'
      ? options.workspaceDatabase
        ? canonicalObservationFixture().then(fixture => seedCanonicalObservationWorkspace(ownerKey, rawWorkspaces, fixture))
        : getSharedFixtureSeedPromise(ownerKey, HOP_V55_CANONICAL_OBSERVATION_SEED_WORKSPACE_ID,
          async () => seedCanonicalObservationWorkspace(ownerKey, rawWorkspaces, await canonicalObservationFixture()))
      : options.seed === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED
        ? options.workspaceDatabase
          ? seedHopV55PropertyAdviceRequalificationFixture({ ownerKey, workspaces: rawWorkspaces,
            baseContext: makeHopV55FixtureContext('planning'), workspaceId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID }).then(() => undefined)
          : getSharedFixtureSeedPromise(ownerKey, HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID,
            async () => { await seedHopV55PropertyAdviceRequalificationFixture({ ownerKey, workspaces: rawWorkspaces,
              baseContext: makeHopV55FixtureContext('planning'), workspaceId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID }); })
    : Promise.resolve();
  const workspaces: HopV55Services['workspaces'] = {
    async list(requestedOwnerKey) { await seedReady; return rawWorkspaces.list(requestedOwnerKey); },
    async read(requestedOwnerKey, workspaceId) { await seedReady; return rawWorkspaces.read(requestedOwnerKey, workspaceId); },
    async save(workspace, expectedRevision) { await seedReady; return rawWorkspaces.save(workspace, expectedRevision); },
    close() {
      if (options.seed === undefined) rawWorkspaces.close();
      else void seedReady.then(() => rawWorkspaces.close(), () => rawWorkspaces.close());
    },
  };
  const loadFutureDraft = async (source: HopV55LocalFutureDraftSource) => {
    if (!source || source.kind !== 'localFutureDraft' || typeof source.workspaceId !== 'string'
      || source.workspaceId.trim() !== source.workspaceId || typeof source.draftId !== 'string'
      || source.draftId.trim() !== source.draftId || !Number.isSafeInteger(source.revision) || source.revision < 1
      || typeof source.contentReference !== 'string' || source.contentReference.trim() !== source.contentReference) {
      throw new Error('Source exacte de brouillon futur fixture invalide.');
    }
    const workspace = await workspaces.read(ownerKey, source.workspaceId);
    if (!workspace || workspace.id !== source.workspaceId || workspace.ownerKey !== ownerKey) {
      throw new Error(`Workspace fixture du brouillon futur « ${source.workspaceId} » indisponible dans ce namespace.`);
    }
    const raw = workspace.futureDrafts?.find(row => row.draftId === source.draftId
      && row.revision === source.revision && row.contentReference === source.contentReference);
    const read = raw && readHopV55FutureRecipeDraft(raw);
    if (!read || read.status !== 'available') throw new Error('La révision exacte du brouillon futur fixture est absente ou illisible.');
    return structuredClone(read.draft);
  };
  const loadLocalRecipeCopy = async (source: HopV55LocalRecipeCopySource) => {
    if (!source || source.kind !== 'localRecipeCopy' || typeof source.workspaceId !== 'string'
      || source.workspaceId.trim() !== source.workspaceId || typeof source.copyId !== 'string'
      || source.copyId.trim() !== source.copyId || typeof source.recipeId !== 'string'
      || source.recipeId.trim() !== source.recipeId || typeof source.recipeReference !== 'string'
      || source.recipeReference.trim() !== source.recipeReference) {
      throw new Error('Source exacte de copie locale fixture invalide.');
    }
    const workspace = await workspaces.read(ownerKey, source.workspaceId);
    if (!workspace || workspace.id !== source.workspaceId || workspace.ownerKey !== ownerKey) {
      throw new Error(`Workspace fixture de la copie locale « ${source.workspaceId} » absent du mode et namespace courant.`);
    }
    const copy = workspace.copies.find(row => row.id === source.copyId && row.recipe.id === source.recipeId);
    if (!copy || hopDecisionReference(copy.recipe) !== source.recipeReference) {
      throw new Error('La copie de recette fixture exacte est absente ou son contenu ne correspond plus à sa référence.');
    }
    return structuredClone(copy);
  };

  return {
    scope: 'fixture', ownerKey, catalogue, scenarios, qualifiedStudies, workspaces, assistedAdvice,
    loadFutureDraft,
    async loadContext(recipe, source) {
      if (options.seed === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED) {
        if (mode !== 'planning') throw new Error('La requalification fixture n’existe qu’avant brassage.');
        if (recipe && recipe.id !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID) {
          throw new Error(`La source Recipe doit rester ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID}.`);
        }
        if (source && (source.kind !== 'recipe' || source.recipeId !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID)) {
          throw new Error(`La requalification fixture exige la source Recipe exacte ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID}.`);
        }
        const base = resolveFixtureContextSource(makeHopV55FixtureContext('planning'), source, recipe !== undefined);
        const current = makeHopV55PropertyAdviceRequalificationCurrentContext(base);
        current.phase = 'Fixture · requalification d’une baseline synthétique';
        current.provenance = [...current.provenance,
          'Parent historique : 2,5 point-fixture; source Recipe courante : 3,25 point-fixture; même identifiant de lecture synthétique.'];
        return mergeFixtureContext(current, await loadReferences(), await catalogue.loadOverlay(), recipe);
      }
      if (options.seed === 'canonicalObservation' || options.seed === 'canonicalContextOnly') {
        if (recipe !== undefined) throw new Error(`Le seed ${options.seed} utilise uniquement le snapshot exact du brassin; aucune recette mutable n’est acceptée.`);
        if (source !== undefined && (source.kind !== 'batch'
          || source.batchId !== HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId)) {
          throw new Error(`Le seed ${options.seed} exige son identifiant de brassin fixture exact.`);
        }
        const fixture = await canonicalObservationFixture();
        const resolved = resolveFixtureContextSource(fixture.context,
          { kind: 'batch', batchId: HOP_V55_CANONICAL_OBSERVATION_FIXTURE_IDS.batchId }, false);
        resolved.phase = options.seed === 'canonicalObservation'
          ? 'Fixture · observation canonique de brassin'
          : 'Fixture · contexte canonique sans dossier préadopté';
        resolved.provenance = [...resolved.provenance, options.seed === 'canonicalObservation'
          ? 'La source active est le snapshot exact du brassin canonique; la recette mutable concurrente est ignorée.'
          : 'La source active est le snapshot exact du brassin canonique; aucun dossier ni support n’est créé au chargement.'];
        return mergeFixtureContext(resolved, { varieties: [], knowledge: [] }, await catalogue.loadOverlay());
      }
      if (source?.kind === 'localFutureDraft') {
        if (recipe) throw new Error('Une copie Recipe ne peut pas remplacer un brouillon futur fixture non matérialisé.');
        const draft = await loadFutureDraft(source);
        const resolved = resolveFixtureContextSource(makeHopV55FixtureContext(mode), { kind: 'exploration' }, false);
        resolved.phase = 'Fixture · exploration d’un brouillon futur hypothétique';
        resolved.provenance = [...resolved.provenance,
          `Brouillon futur fixture exact ${draft.draftId} · révision ${draft.revision}; aucune recette ou brassin physique n’est créé.`];
        return mergeFixtureContext(resolved, await loadReferences(), await catalogue.loadOverlay());
      }
      if (source?.kind === 'localRecipeCopy') {
        const copy = await loadLocalRecipeCopy(source);
        if (recipe && (recipe.id !== copy.recipe.id || hopDecisionReference(recipe) !== source.recipeReference)) {
          throw new Error('La Recipe fournie diffère du contenu exact de copie fixture conservé.');
        }
        const resolved = resolveFixtureContextSource(makeHopV55FixtureContext(mode), { kind: 'exploration' }, false);
        resolved.recipe = structuredClone(copy.recipe);
        resolved.phase = 'Fixture · planification d’une copie locale proposée';
        resolved.provenance = [...resolved.provenance,
          `Copie locale fixture exacte ${copy.id} · recette ${copy.recipe.id}; aucune source recette ou journal hôte n’est reprise.`];
        return mergeFixtureContext(resolved, await loadReferences(), await catalogue.loadOverlay());
      }
      const resolved = resolveFixtureContextSource(makeHopV55FixtureContext(mode), source, recipe !== undefined);
      return mergeFixtureContext(resolved, await loadReferences(), await catalogue.loadOverlay(), recipe);
    },
    close() { scenarios.close(); qualifiedStudies.close(); workspaces.close(); catalogue.close(); },
  };
}

export type { HopV55Services, HopV55CatalogueClient } from './contracts';
