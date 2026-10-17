// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import { HOP_ADVICE_PROTOCOL_V1, type HopAdviceV1PublicJob, type HopAdviceV1PublicTurn,
  type HopAdviceV1WizardWireInputV1 } from '../../functions/src/brewerHopAdviceTransportV1';
import { createBrewerHopAdviceProposalEnvelopeV6ForWizardV1 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { createBrewerHopAdviceWizardSourceV1, mapBrewerHopAdviceWizardSourceToScopeV1 } from '../../functions/src/brewerHopAdviceWizardSourceV1';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { assertHopPropertyAdviceRequestV3, hopPropertyAdviceAnswerReferenceV3,
  type HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import type { Recipe } from '../../src/types';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55Services } from '../../src/services/hopV55/runtime';
import { createHopV55WizardSourceSnapshotV1, createHopV55WizardWorkspaceOriginV1, createHopV55WorkspaceRepository,
  type HopV55WorkspaceDatabaseAdapter, type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { BrewingScenarioLocalDatabaseAdapter, BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { createHopV55AssistedAdviceWizardTicketV1,
  readHopV55AssistedAdviceWizardTicketV1 } from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { buildHopV55AssistedSemanticAdviceRequestForWizardV1 } from '../../src/services/hopV55/assistedSemanticAdviceRequestV3';
import { createHopV55DecisionReadingArchiveV4ForWizardV1, readHopV55DecisionReadingArchive } from '../../src/services/hopV55/decisionArchive';
import { readHopV55QuestionSemanticV1 } from '../../src/services/hopV55/questionSemanticReading';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { readHopV55SemanticAdoptionCommitV1 } from '../../src/services/hopV55/semanticAdoptionController';
import { prepareCorrectionV4ForWizardV1, prepareInitialPropertyAdviceV4ForWizardV1,
  type HopV55PropertyAdviceAdditionV4 } from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV4ForWizardV1, readHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  type HopV55PropertyAdviceAnswerRecordV4ForWizardV1 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { canonicalizeHopV55RecipeDraft, type HopV55RecipeStepStorage } from '../../src/services/hopV55/recipeStepContext';
import { createHopV55SemanticAdoptionApplicationHostV1, HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1,
  type HopV55SemanticWizardJobSnapshotV1 } from '../../src/services/hopV55/semanticAdoptionApplicationHost';
import type { HopV55SemanticWizardJobReadInputV1, HopV55SemanticWizardJobSendInputV1 } from '../../src/services/brewerJobs';
import { createBrewerHopAdviceSemanticRuntimeV3, createBrewerHopAdviceSemanticRuntimeWizardV1 } from '../../src/services/brewerHopAdviceRuntime';
import { StorageService } from '../../src/services/storage';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
import { HopV55SemanticAdviceCapabilityContext, type HopV55SemanticAdviceCapabilityV3 } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import { HopV55Host } from '../../src/ui/hopV55/Host';
import { HopV55Page } from '../../src/ui/hopV55/Page';
import { HopV55RecipeStep } from '../../src/ui/hopV55/RecipeStep';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

/*
 * Setup reduced from hopV55SemanticCompanion39 (#88): memory adapters only; the real RecipeStep, Wizard lane, V6
 * reception, confirmation, Host, Page, correction panel, repository and V4 guards run unchanged. The linked V4 answer
 * is produced by that real flow from the A39 question; owner and target are read from its ledger, never named here.
 * That flow yields one compensation with a single compared observation and no observation partner. The two other
 * branches of Délier (a comparison kept with a remaining observation, an internal observation partner) are proved on
 * fixture dossiers sealed by the public Wizard constructors of contract 87 (COVERAGE.md).
 */
const memory = vi.hoisted(() => ({ workspaceDatabase: undefined as unknown, scenarioDatabase: undefined as unknown }));
const recipeSaves = vi.hoisted(() => ({ calls: [] as unknown[] }));

vi.mock('../../src/services/hopV55/runtime', async importOriginal => {
  const actual = await importOriginal<typeof import('../../src/services/hopV55/runtime')>();
  const scenarioRepository = await import('../../src/services/brewingScenarioLocalRepository');
  return { ...actual, createHopV55Services: (options: import('../../src/services/hopV55/runtime').CreateHopV55ServicesOptions) => ({
    ...actual.createHopV55Services({ ...options,
      workspaceDatabase: memory.workspaceDatabase as import('../../src/services/hopV55/workspaceRepository').HopV55WorkspaceDatabaseAdapter }),
    scenarios: scenarioRepository.createBrewingScenarioLocalRepository({
      database: memory.scenarioDatabase as import('../../src/services/brewingScenarioLocalRepository').BrewingScenarioLocalDatabaseAdapter }),
  }) };
});
vi.mock('../../src/services/recipeSave', () => ({
  saveRecipeConfirmed: async (recipe: unknown) => {
    recipeSaves.calls.push(structuredClone(recipe));
    throw new Error('Ce banc n’enregistre aucune recette.');
  },
}));
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

const OWNER = 'owner:wizard-correction-relations';
const DRAFT_ID = 'wizard-correction-relations-draft';
const QUESTION = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const WIZARD_OPEN = 'Ouvrir un dossier assisté pour ce brouillon';
const SEND = 'Envoyer la lecture assistée';
const CHOICE = /Retenir « Documenter la piste »/;
const MOTIVE = 'Ce constat ne décrit pas ce brouillon; je garde la question de compensation sans ce lien.';
const SLOW = { timeout: 10000 };
const evidence: BrewerEvidence = {
  id: 'E1', name: 'lookup_style_reference', label: 'Source fixture locale relations',
  facts: ['Document fixture de test.'], limits: ['Ne prouve aucun fait de brassin.'], data: { origin: 'test-fixture-relations' },
};

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  writes = 0;
  private key(value: unknown): string { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.writes++; this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.writes++; this.rows.set(this.key(row), structuredClone(row)); }
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
  close() { /* Memory-only adapter. */ }
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

function syntheticVariety(): HopVariety {
  return { id: 'relations-synthetic-hop', name: 'Houblon synthétique sans analyse', aliases: [], form: 'unknown', descriptions: [], analysis: [] };
}

const saved = { recipes: [] as Recipe[] };

function fixtureIntent(fragment: string, id: string) {
  const start = QUESTION.indexOf(fragment);
  if (start < 0) throw new Error('Fragment V6 fixture absent de la question exacte.');
  return { id, property: 'aroma' as const, label: fragment, role: 'preference' as const, direction: null,
    qualification: null, required: false, comparisonBasis: { kind: 'none' as const, assertionIds: [] as string[] },
    metric: 'sensory' as const, subject: { kind: 'beer' as const, label: 'Bière fixture', materialId: null, sensoryContext: 'beer' as const },
    sourceSpans: [{ start, end: start + fragment.length, text: fragment }], basis: 'Proposition V6 synthétique.', relatedIntentIds: [] as string[] };
}

/** Same deterministic V6 proposal as the A39 Wizard fixture: one preference and one option to document it. */
function fixtureRaw() {
  return {
    annotationReviews: [],
    propertyIntentProposals: [{ proposalId: 'assist-proposal-resin-note', kind: 'add', sourceAnnotationIds: [],
      intent: fixtureIntent('odeur résineuse', 'assist-intent-resin-note'), motive: 'Piste fixture explicite, à confirmer.' }],
    semanticRevisionProposals: [], openQuestions: [], materials: [],
    answer: { summary: 'Piste de démonstration locale.', readingNote: 'Fixture V6; aucune conclusion brassicole réelle.',
      options: [{ id: 'assist-option-document', kind: 'investigation', title: 'Documenter la piste',
        rationale: 'Source de test sans affirmation physique.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [evidence.id] }],
      unknowns: [{ id: 'assist-unknown-alpha', question: 'Alpha réel du houblon maison ?', changesChoice: 'Change la dose éventuelle.', relatedIds: [] }],
      program: { kind: 'none', note: 'Aucun programme appliqué par cette fixture.' }, refusals: [] },
    optionProposalLinks: [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-resin-note', evidenceIds: [evidence.id] }],
  };
}

/** Wizard server: the draft comes only from the Wizard wire; a saved Recipe of the same ID is never consulted. */
function fixtureWizardPublicTurn(wire: HopAdviceV1WizardWireInputV1): { job: HopAdviceV1PublicJob; turn: HopAdviceV1PublicTurn } {
  if (wire.scope.kind !== 'draft' || !wire.draft || typeof wire.draft !== 'object') throw new Error('Fixture serveur : brouillon Wizard absent du wire.');
  const context = { recipe: structuredClone(wire.draft) as Recipe,
    hopIndex: { varieties: [], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] },
    inventory: [], stockReservations: { complete: false, batches: [], source: 'localCache' }, material: [], waterSources: [],
    now: Date.now(), phase: 'Brouillon de recette en cours d’écriture', provenance: ['Brouillon transporté dans le wire Wizard.'],
    editableTargets: [] } as unknown as BrewerContext;
  const envelope = createBrewerHopAdviceProposalEnvelopeV6ForWizardV1({ request: wire.hopAdvice, prepared: prepareBrewingScenarioContext(context),
    raw: fixtureRaw(), evidence: [evidence], serverContext: { phase: context.phase, provenance: [...(context.provenance ?? [])],
      loadedAt: context.now, binding: structuredClone(wire.hopAdvice.contextLaunch.expected) } });
  const at = Date.parse('2026-10-05T12:00:00.000Z');
  const job: HopAdviceV1PublicJob = { id: 'job:' + wire.operationId, operationId: wire.operationId,
    scope: structuredClone(wire.scope), generation: wire.generation ?? 0, question: wire.question,
    label: 'Fixture Wizard V6 relations', status: 'done', stage: 'saving', createdAt: at, updatedAt: at, finishedAt: at, attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const turn: HopAdviceV1PublicTurn = { id: job.id, operationId: job.operationId, question: job.question,
    advice: { level: 'info', summary: 'Piste de démonstration du brouillon.', action: '', why: '', watch: '', question: '',
      evidenceIds: [evidence.id] }, evidence: [structuredClone(evidence)], createdAt: at,
    model: 'V6 fixture Wizard relations', reviewed: true, mode: wire.analysisMode, contextLabel: 'Fixture · brouillon Wizard',
    protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: envelope };
  return { job, turn };
}

function workspaceRepository() {
  return createHopV55WorkspaceRepository({ ownerKey: OWNER, database: memory.workspaceDatabase as HopV55WorkspaceDatabaseAdapter });
}
async function storedWorkspace(): Promise<HopV55Workspace | undefined> { return (await workspaceRepository().list(OWNER))[0]; }
async function wizardWorkspace(): Promise<HopV55Workspace | undefined> {
  return (await workspaceRepository().list(OWNER)).find(row => row.wizardOrigin !== undefined);
}
function workspaceTable() { return (memory.workspaceDatabase as MemoryWorkspaceDatabase).workspaces; }

/** Explicit local Wizard provider: emits only under the exact durable ticket; the classic lane is never used here. */
function wizardFixture() {
  const server = { wizardEmissions: [] as HopAdviceV1WizardWireInputV1[], snapshots: new Map<string, HopV55SemanticWizardJobSnapshotV1>() };
  const ticketDurable = async (send: HopV55SemanticWizardJobSendInputV1) => {
    const workspace = await workspaceRepository().read(OWNER, send.wire.hopAdvice.contextLaunch.workspaceId);
    const raw = (workspace?.assistedSemanticAdviceTickets ?? []).find(row => !!row && typeof row === 'object'
      && (row as { reference?: unknown }).reference === send.ticketReference);
    const read = raw ? readHopV55AssistedAdviceWizardTicketV1(raw) : undefined;
    return read?.status === 'readOnly' && read.ticket.references.wireReference === send.wireReference
      && JSON.stringify(read.ticket.wire) === JSON.stringify(send.wire);
  };
  const receive = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1> => {
    if (!await ticketDurable(send)) throw new Error('Fixture serveur : le ticket Wizard exact n’était pas durable avant l’émission.');
    server.wizardEmissions.push(structuredClone(send.wire));
    const generated = fixtureWizardPublicTurn(send.wire);
    const snapshot: HopV55SemanticWizardJobSnapshotV1 = { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1, operationId: send.operationId,
      generation: send.generation, ticketReference: send.ticketReference, wireReference: send.wireReference,
      status: 'received', job: generated.job, turn: generated.turn };
    server.snapshots.set(send.operationId, snapshot);
    return structuredClone(snapshot);
  };
  const refuseClassic = async (): Promise<never> => { throw new Error('Voie classique hors de ce test.'); };
  const capability: HopV55SemanticAdviceCapabilityV3 = { kind: 'fixture',
    createRuntimeForScope: input => createBrewerHopAdviceSemanticRuntimeV3({ ownerKey: input.ownerKey, workspaceId: input.workspaceId,
      scope: input.scope, providerKind: 'fixture', readGeneration: async () => 0,
      transport: { submit: refuseClassic, retry: refuseClassic, read: async () => null } }),
    createWizardRuntimeForScope: input => createBrewerHopAdviceSemanticRuntimeWizardV1({ ownerKey: input.ownerKey,
      workspaceId: input.workspaceId, scope: input.scope, providerKind: 'fixture', readGeneration: async () => 0,
      transport: { submit: receive, retry: receive, read: async (query: HopV55SemanticWizardJobReadInputV1) => {
        const snapshot = server.snapshots.get(query.operationId);
        return snapshot && snapshot.ticketReference === query.ticketReference ? structuredClone(snapshot) : null;
      } } }) };
  return { server, capability };
}

beforeEach(() => {
  memory.workspaceDatabase = new MemoryWorkspaceDatabase();
  memory.scenarioDatabase = new MemoryScenarioDatabase();
  recipeSaves.calls.length = 0;
  saved.recipes = [{ ...fixtureRecipe(), id: DRAFT_ID, name: 'Recette enregistrée homonyme', volumeL: 999 } as Recipe];
  vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockImplementation(async () => ({ varieties: [syntheticVariety()], knowledge: [] }));
  vi.spyOn(FirebaseAuthService, 'getCurrentUser').mockImplementation(() => ({ uid: OWNER, displayName: 'Brasseur fixture' }) as unknown as User);
  vi.spyOn(StorageService, 'getRecipes').mockImplementation(() => structuredClone(saved.recipes) as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getHopVarieties').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getHopLots').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getHopKnowledge').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [] }) as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const stores: HopV55RecipeStepStorage = {
  getHopVarieties: () => [], getHopLots: () => [], getHopKnowledge: () => [],
  getStocks: () => ({ rawMaterials: [] }), getBatches: () => [],
};
/** Live Wizard draft B, unsaved, same ID as the saved Recipe A. */
function draftB(): Recipe {
  return { ...fixtureRecipe(), id: DRAFT_ID, name: 'Brouillon non enregistré', hops: [], abvTarget: Number.NaN, ogTarget: 0 } as Recipe;
}

/** Real creator up to one confirmed Wizard V4 answer, then the creator is closed. */
async function confirmWizardAnswer(capability: HopV55SemanticAdviceCapabilityV3): Promise<HopV55PropertyAdviceAnswerRecordV4ForWizardV1> {
  const Provider = HopV55SemanticAdviceCapabilityContext.Provider;
  const view = render(<Provider value={capability}><HopV55RecipeStep ownerKey={OWNER} recipe={draftB()} storage={stores} onApply={vi.fn()} /></Provider>);
  fireEvent.change(await screen.findByRole('textbox', { name: 'Question au brasseur' }, SLOW), { target: { value: QUESTION } });
  fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
  await waitFor(async () => expect((await storedWorkspace())?.decisionReadings?.length).toBe(1), SLOW);
  expect(readHopV55DecisionReadingArchive((await storedWorkspace())!.decisionReadings![0]).status).toBe('available');
  fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
  fireEvent.click(await screen.findByRole('button', { name: SEND }, SLOW));
  await screen.findByTestId('semantic-v6-turn', {}, SLOW);
  const choice = await screen.findByRole('checkbox', { name: CHOICE }, SLOW);
  if (!(choice as HTMLInputElement).checked) fireEvent.click(choice);
  fireEvent.change(screen.getByRole('textbox', { name: 'Motif de ton choix' }), { target: { value: 'Motif de l’adoption à corriger ensuite.' } });
  fireEvent.click(screen.getByRole('button', { name: 'Prévisualiser ce choix' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Confirmer ce choix' }, SLOW));
  await screen.findByText('Choix confirmé dans la réponse documentaire', {}, SLOW);
  const dossier = (await wizardWorkspace())!;
  const commitRead = readHopV55SemanticAdoptionCommitV1(dossier.semanticAdoptionCommits![0]);
  if (commitRead.status !== 'readOnly') throw new Error('Reçu Wizard attendu.');
  const answerRead = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(dossier.documentaryAnswers?.find(raw =>
    (raw as { reference?: string }).reference === commitRead.commit.receipt.record.reference));
  if (answerRead.status !== 'readOnly') throw new Error('Réponse V4 Wizard attendue.');
  view.unmount();
  return answerRead.record;
}

function latestEntries(record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1) {
  const latest = new Map<string, HopV55PropertyAdviceAnswerRecordV4ForWizardV1['ledger']['entries'][number]>();
  for (const entry of record.ledger.entries) latest.set(entry.annotationId, entry);
  return latest;
}

/** First active edge of the confirmed version whose owner and target labels are unique; generic, no fixture name. */
function linkedPair(record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1): { owner: HopPropertyAdviceIntentV3; target: HopPropertyAdviceIntentV3 } {
  const active = [...latestEntries(record).values()].flatMap(entry => entry.disposition === 'active' && entry.activeIntent ? [entry.activeIntent] : []);
  const unique = (label: string) => active.filter(intent => intent.label === label).length === 1;
  for (const owner of active) {
    for (const targetId of [...owner.relatedIntentIds, ...(owner.investigation?.observationIntentIds ?? [])]) {
      const target = active.find(intent => intent.id === targetId);
      if (target && unique(owner.label) && unique(target.label)) return { owner, target };
    }
  }
  throw new Error('La réponse V4 confirmée par le vrai flux ne porte aucun lien actif entre deux termes de libellé unique.');
}

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function rowCells(table: HTMLElement, name: string | RegExp): Array<string | null> {
  return within(within(table).getByRole('rowheader', { name }).closest('tr')!).getAllByRole('cell').map(cell => cell.textContent);
}
/** Text that describes a gesture button (aria-describedby): its consequence, shown beside it. */
function describedBy(button: HTMLElement): HTMLElement {
  const id = button.getAttribute('aria-describedby');
  const element = id ? document.getElementById(id) : null;
  if (!element) throw new Error('Le geste ne décrit aucune conséquence.');
  return element;
}
/** One projection without the named fields, to compare everything a correction must keep. */
function without(intent: HopPropertyAdviceIntentV3, fields: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(intent).filter(([field]) => !fields.includes(field)));
}

/** Opens the real closed Host history and the correction panel of the confirmed answer. */
async function openCorrection() {
  render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} />);
  const history = await screen.findByTestId('wizard-semantic-history', {}, SLOW);
  fireEvent.click(await within(history).findByRole('button', { name: 'Corriger cette réponse' }, SLOW));
  const panelElement = await screen.findByTestId('wizard-answer-correction', {}, SLOW);
  return { history, panel: within(panelElement), relations: within(within(panelElement).getByTestId('wizard-answer-correction-relations')) };
}

/** Sets the target aside alone: the panel refuses readably, names owner and target by label and writes nothing. */
async function refuseTargetAlone(panel: ReturnType<typeof within>, owner: HopPropertyAdviceIntentV3, target: HopPropertyAdviceIntentV3) {
  fireEvent.click(panel.getByRole('checkbox', { name: `Écarter « ${target.label} »` }));
  fireEvent.change(panel.getByRole('textbox', { name: 'Motif de la correction' }), { target: { value: MOTIVE } });
  fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
  const refusal = await panel.findByRole('alert', {}, SLOW);
  expect(refusal).toHaveTextContent(`« ${owner.label} » reste relié à « ${target.label} »`);
  expect(refusal).toHaveTextContent(/rien n’est enregistré/i);
  expect(refusal.textContent).not.toContain(owner.id);
  expect(refusal.textContent).not.toContain(target.id);
  expect(screen.queryByTestId('wizard-answer-correction-preview')).toBeNull();
}

describe('Correction d’une réponse Wizard fermée · relations entre termes', () => {
  it('refuse lisiblement une cible liée seule, délie son dernier constat comparé en montrant la comparaison retirée, prévisualise et enregistre une nouvelle version', async () => {
    const fixture = wizardFixture();
    const savedBefore = structuredClone(saved.recipes);
    const answer = await confirmWizardAnswer(fixture.capability);
    const { owner, target } = linkedPair(answer);
    // The A39 real flow links a compensation to its only compared observation: unlinking it empties the comparison.
    expect(owner.investigation?.observationIntentIds).toEqual([target.id]);
    const emissions = fixture.server.wizardEmissions.length;
    const { history, panel, relations } = await openCorrection();
    const before = structuredClone((await wizardWorkspace())!);
    const writesBefore = workspaceTable().writes;

    // The relation is visible with readable labels, roles and kind, without raw identifiers.
    const relation = relations.getByText(new RegExp(`^« ${escape(owner.label)} » \\(.+\\) → « ${escape(target.label)} » \\(.+\\) · `));
    expect(relation).toHaveTextContent(/ · lien, constat comparé$/);
    expect(relation.textContent).not.toContain(target.id);

    // (1) The target alone is refused before any preparation; nothing is written.
    await refuseTargetAlone(panel, owner, target);
    expect(relations.getByRole('status')).toHaveTextContent(/À résoudre avant l’aperçu · 1/);
    expect(relations.getByRole('status')).toHaveFocus();
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);

    // (2) Explicit unlink of the last compared observation. The consequence beside the button is read before the gesture
    // and asserted after the domain check, so that a Request3 refusal stays the first failure against an older Page.
    const unlinkButton = relations.getByRole('button', { name: `Délier « ${target.label} » de « ${owner.label} »` });
    const consequenceBefore = document.getElementById(unlinkButton.getAttribute('aria-describedby') ?? '')?.textContent ?? null;
    fireEvent.click(unlinkButton);
    expect(panel.queryByRole('alert')).toBeNull();
    expect(relations.getByRole('status')).toHaveTextContent('Aucun lien à résoudre pour cette correction.');
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    await waitFor(() => expect(screen.queryByTestId('wizard-answer-correction-preview') ?? panel.queryByRole('alert')).not.toBeNull(), SLOW);
    // A projection keeping an empty investigation is refused here by Request3 (« Investigation.observationIntentIds invalide. »).
    expect(panel.queryByRole('alert')).toBeNull();
    let preview = screen.getByTestId('wizard-answer-correction-preview');

    // (3) The consequence was named before the gesture, in labels only, and stays shown once applied.
    expect(consequenceBefore).toBe(`Conséquence si tu délies : la comparaison de compensation de « ${owner.label} » est retirée, car « ${target.label} » en est le dernier constat comparé; « ${owner.label} » reste retenu comme question ouverte, sans comparaison.`);
    expect(consequenceBefore).not.toContain(owner.id);
    expect(consequenceBefore).not.toContain(target.id);
    expect(describedBy(relations.getByRole('button', { name: `Rétablir le lien de « ${owner.label} » vers « ${target.label} »` })))
      .toHaveTextContent(`Conséquence de ce déliement : la comparaison de compensation de « ${owner.label} » est retirée`);
    // The preview keeps the owner, shows the link removed and the comparison removed with it.
    expect(rowCells(within(preview).getByRole('table', { name: /Termes avant et après/ }), target.label)).toEqual(['retenu', 'écarté · modifié']);
    expect(rowCells(within(preview).getByRole('table', { name: /Termes avant et après/ }), owner.label)).toEqual(['retenu', 'retenu · liens modifiés']);
    expect(preview).toHaveTextContent('2 modifications');
    expect(rowCells(within(preview).getByRole('table', { name: /Liens avant et après/ }),
      new RegExp(`^« ${escape(owner.label)} » → « ${escape(target.label)} »`))).toEqual(['actif', 'retiré · délié']);
    expect(rowCells(within(preview).getByRole('table', { name: 'Comparaisons et partenaires avant et après' }),
      `« ${owner.label} » · comparaison de compensation`)).toEqual([`avec « ${target.label} »`, 'retirée · question ouverte sans comparaison']);
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);

    // A link change invalidates the preview; the explicit gesture is needed again.
    fireEvent.click(relations.getByRole('button', { name: `Rétablir le lien de « ${owner.label} » vers « ${target.label} »` }));
    await waitFor(() => expect(screen.queryByTestId('wizard-answer-correction-preview')).toBeNull());
    expect(relations.getByRole('status')).toHaveTextContent(/À résoudre avant l’aperçu · 1/);
    const unlinkAgain = relations.getByRole('button', { name: `Délier « ${target.label} » de « ${owner.label} »` });
    expect(describedBy(unlinkAgain)).toHaveTextContent(consequenceBefore!);
    fireEvent.click(unlinkAgain);
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    preview = await screen.findByTestId('wizard-answer-correction-preview', {}, SLOW);

    // (4) Confirmation appends a new version; the earlier one, its source and acts stay exact.
    fireEvent.click(within(preview).getByRole('button', { name: 'Enregistrer cette correction' }));
    await screen.findByText(/Correction enregistrée comme nouvelle version/, {}, SLOW);
    const corrected = (await wizardWorkspace())!;
    expect(corrected.documentaryAnswers).toHaveLength((before.documentaryAnswers ?? []).length + 1);
    expect(corrected.documentaryAnswers!.slice(0, -1)).toEqual(before.documentaryAnswers);
    const revisionRead = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(corrected.documentaryAnswers!.at(-1));
    if (revisionRead.status !== 'readOnly') throw new Error('Révision V4 Wizard attendue.');
    const revision = revisionRead.record;
    expect(revision.transition).toMatchObject({ kind: 'revise', parentRecordReference: answer.reference,
      parentReadingReference: answer.sourceReadingReference, reason: MOTIVE, actor: { origin: 'user' } });
    expect(revision.sourceReadingReference).toBe(answer.sourceReadingReference);
    expect(revision.preparation.source).toEqual(answer.preparation.source);
    expect(revision.ledger.sourceAnnotations).toEqual(answer.ledger.sourceAnnotations);
    const latest = latestEntries(revision);
    expect(latest.get(target.id)).toMatchObject({ disposition: 'rejected', decision: { kind: 'reject', reason: MOTIVE } });
    const ownerEntry = latest.get(owner.id)!;
    expect(ownerEntry).toMatchObject({ disposition: 'active', decision: { kind: 'revise', reason: MOTIVE } });
    // (5) Request3 discriminant rather than parity with unlinkV4: an investigation names at least one compared observation
    // (propertyAdviceSchema.ts:657, allowEmpty=false, checked by buildHopPropertyAdviceV3). unlinkV4 keeps an empty list,
    // a known limit of the general editor that this domain refuses, so the last observation takes the comparison with it,
    // as the fix « Garder une question ouverte, sans comparaison ». Every other field of the owner is kept, none invented.
    const projection = ownerEntry.activeIntent!;
    expect(projection).not.toHaveProperty('investigation');
    expect(projection.relatedIntentIds).toEqual(owner.relatedIntentIds.filter(id => id !== target.id));
    expect(projection.interpretationOrigin).toBe('user');
    const partnerOnTarget = owner.partner?.kind === 'observation' && owner.partner.id === target.id;
    expect(without(projection, ['relatedIntentIds', 'interpretationOrigin'])).toEqual(
      without(owner, ['investigation', 'relatedIntentIds', 'interpretationOrigin', ...(partnerOnTarget ? ['partner'] : [])]));
    expect(revision.outcome.kind).toBe('domainAnswer');
    // The earlier version keeps its comparison exactly: stored row, ledger entries and source annotations.
    expect(revision.ledger.entries.slice(0, answer.ledger.entries.length)).toEqual(answer.ledger.entries);
    const parentRead = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(corrected.documentaryAnswers!.find(raw =>
      (raw as { reference?: string }).reference === answer.reference));
    if (parentRead.status !== 'readOnly') throw new Error('Version antérieure V4 Wizard attendue.');
    expect(latestEntries(parentRead.record).get(owner.id)?.activeIntent).toEqual(owner);
    for (const [id, entry] of latestEntries(answer)) if (id !== owner.id && id !== target.id) expect(latest.get(id)).toEqual(entry);
    expect(corrected.semanticAdoptionCommits).toEqual(before.semanticAdoptionCommits);
    expect(corrected.wizardSourceSnapshots).toEqual(before.wizardSourceSnapshots);
    expect(corrected.decisionReadings).toEqual(before.decisionReadings);
    expect(corrected.assistedSemanticAdviceTickets).toEqual(before.assistedSemanticAdviceTickets);

    // Both versions stay listed in the closed history; no provider, recipe or emission is involved.
    await waitFor(() => expect(history).toHaveTextContent(revision.reference), SLOW);
    expect(history).toHaveTextContent(answer.reference);
    expect(screen.queryByTestId('wizard-answer-correction')).toBeNull();
    expect(fixture.server.wizardEmissions).toHaveLength(emissions);
    expect(saved.recipes).toEqual(savedBefore);
    expect(recipeSaves.calls).toEqual([]);
  }, 120000);

  it('écarte aussi le propriétaire par un choix explicite, montre le lien retiré, puis abandonne sans rien écrire', async () => {
    const fixture = wizardFixture();
    const answer = await confirmWizardAnswer(fixture.capability);
    const { owner, target } = linkedPair(answer);
    const { panel, relations } = await openCorrection();
    const before = structuredClone((await wizardWorkspace())!);
    const writesBefore = workspaceTable().writes;

    await refuseTargetAlone(panel, owner, target);
    fireEvent.click(relations.getByRole('button', { name: `Écarter aussi « ${owner.label} »` }));
    expect(panel.getByRole('checkbox', { name: `Écarter « ${owner.label} »` })).toBeChecked();
    expect(relations.getByRole('status')).toHaveTextContent('Aucun lien à résoudre pour cette correction.');
    expect(relations.getByRole('status')).toHaveFocus();
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    const preview = await screen.findByTestId('wizard-answer-correction-preview', {}, SLOW);
    const terms = within(preview).getByRole('table', { name: /Termes avant et après/ });
    expect(rowCells(terms, target.label)).toEqual(['retenu', 'écarté · modifié']);
    expect(rowCells(terms, owner.label)).toEqual(['retenu', 'écarté · modifié']);
    expect(rowCells(within(preview).getByRole('table', { name: /Liens avant et après/ }),
      new RegExp(`^« ${escape(owner.label)} » → « ${escape(target.label)} »`))).toEqual(['actif', `retiré · « ${owner.label} » écarté`]);

    // Keeping the target instead is also explicit, and invalidates the preview.
    fireEvent.click(panel.getByRole('checkbox', { name: `Écarter « ${owner.label} »` }));
    await waitFor(() => expect(screen.queryByTestId('wizard-answer-correction-preview')).toBeNull());
    fireEvent.click(relations.getByRole('button', { name: `Ne pas écarter « ${target.label} »` }));
    expect(panel.getByRole('checkbox', { name: `Écarter « ${target.label} »` })).not.toBeChecked();

    fireEvent.click(panel.getByRole('button', { name: 'Abandonner la correction' }));
    await waitFor(() => expect(screen.queryByTestId('wizard-answer-correction')).toBeNull());
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);
    expect(recipeSaves.calls).toEqual([]);
  }, 120000);
});

/* ---------- Fixture dossiers for the two other branches of Délier ---------- */

/** Phase of the creator's draft context; the Page prepares an archived draft version again under it. */
const FIXTURE_PHASE = 'Brouillon de recette en cours d’écriture';
const FIXTURE_AT = '2026-10-06T09:00:00.000Z';
const FIXTURE_POLICY = { kind: 'explicit' as const, materialIds: [] as string[], basis: 'Aucune matière choisie explicitement.' };
const FIXTURE_ACTOR = { origin: 'user' as const, label: 'Brasseur fixture' };
const EXTERNAL_OBSERVATION = 'fixture:observation-externe';
const KEPT_QUESTION = 'Fixture relations un : je relève la note alpha et la note bêta, puis je compare ces deux notes.';
const PARTNER_QUESTION = 'Fixture relations deux : je relève la note gamma ; le profil pi la prend pour repère ; le profil epsilon suit un repère externe.';

/** Typed synthetic term anchored on an exact fragment of its own fixture question; it carries no measured value. */
function anchoredIntent(question: string, id: string, fragment: string, patch: Partial<HopPropertyAdviceIntentV3>): HopPropertyAdviceIntentV3 {
  const start = question.indexOf(fragment);
  if (start < 0) throw new Error('Fragment absent de la question de fixture.');
  return { id, property: 'unresolved', label: fragment, role: 'preference', direction: null, qualification: null, required: false,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'sensory',
    subject: { kind: 'beer', label: 'Bière fixture relations', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [{ start, end: start + fragment.length, text: fragment }], interpretationOrigin: 'proposal',
    basis: `Terme synthétique de fixture, lu dans « ${fragment} ».`, relatedIntentIds: [], ...patch };
}
/** A and B: two perceived observations; Q compares both for a perceptual compensation (Request3: non-empty, related). */
function keptTerms() {
  const observation = { role: 'reportedObservation' as const, direction: null, metric: 'sensory' as const };
  const a = anchoredIntent(KEPT_QUESTION, 'fixture-relations:note-alpha', 'la note alpha', { ...observation, property: 'sweetness' });
  const b = anchoredIntent(KEPT_QUESTION, 'fixture-relations:note-beta', 'la note bêta', { ...observation, property: 'acidity' });
  const q = anchoredIntent(KEPT_QUESTION, 'fixture-relations:comparaison', 'je compare ces deux notes', { property: 'sweetness',
    role: 'investigation', direction: 'investigate', required: true, relatedIntentIds: [a.id, b.id],
    investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [a.id, b.id] } });
  return { a, b, q };
}
/** A: a perceived observation; P takes A as internal observation partner and has no other link; E keeps an external one. */
function partnerTerms() {
  const a = anchoredIntent(PARTNER_QUESTION, 'fixture-relations:note-gamma', 'la note gamma', { role: 'reportedObservation', property: 'aroma' });
  const p = anchoredIntent(PARTNER_QUESTION, 'fixture-relations:profil-pi', 'le profil pi', { property: 'aroma',
    partner: { kind: 'observation', id: a.id } });
  const e = anchoredIntent(PARTNER_QUESTION, 'fixture-relations:profil-epsilon', 'le profil epsilon', { property: 'aroma',
    partner: { kind: 'observation', id: EXTERNAL_OBSERVATION } });
  return { a, p, e };
}

/**
 * Fixture dossier sealed by the public constructors of contract 87 (consumer87 createWizardJourney): canonical draft
 * snapshot, Wizard source and V4 reading archive, durable Wizard ticket, then the parent answer from the initial Wizard
 * preparation with explicitly confirmed additions, the V3 builder, the Wizard writer and the strict reader. Its frame is
 * the one the Page rebuilds for an archived draft version (local catalogue of these same services, archived draft,
 * creator phase), so the real correction path accepts it as is. No record is altered or resealed by hand.
 */
async function seedRelationsFixture(key: string, question: string, terms: readonly HopPropertyAdviceIntentV3[]) {
  const workspaceId = `workspace:relations-${key}`;
  const draftId = `draft:relations-${key}`;
  const origin = { ownerKey: OWNER, workspaceId, draftId };
  const draft = { ...fixtureRecipe(), id: draftId, name: `Brouillon fixture relations ${key}`, hops: [] } as Recipe;
  const services = createHopV55Services({ ownerKey: OWNER, context: async () => ({ recipe: structuredClone(draft),
    hopIndex: { varieties: [syntheticVariety()], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] },
    inventory: [], stockReservations: { complete: false, batches: [], source: 'localCache' }, material: [], waterSources: [],
    now: Date.parse(FIXTURE_AT), phase: FIXTURE_PHASE, provenance: ['Catalogue local de la fixture relations.'],
    editableTargets: [] }) as unknown as BrewerContext });
  const catalogue: Record<string, unknown> = { ...(await services.loadContext(undefined, { kind: 'exploration' })) };
  delete catalogue.batch; delete catalogue.journal;
  const snapshot = canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId, draft });
  const context = { ...catalogue, recipe: structuredClone(snapshot.recipe), phase: FIXTURE_PHASE,
    provenance: [`Version archivée du brouillon de fixture ${draftId}.`] } as unknown as BrewerContext;
  const prepared = prepareBrewingScenarioContext(context);
  const source = createBrewerHopAdviceWizardSourceV1({ origin, snapshot });
  const archive = createHopV55DecisionReadingArchiveV4ForWizardV1({ id: `reading:relations-${key}`, ownerKey: OWNER, workspaceId,
    recordedAt: FIXTURE_AT, reading: readHopV55QuestionSemanticV1(question, prepared), source,
    runtimeReference: hopV55ScenarioRuntimeReference(prepared.runtime) });
  const wizardOrigin = createHopV55WizardWorkspaceOriginV1(origin);
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey: OWNER, revision: 0,
    title: `Dossier fixture relations ${key}`, intent: { question, criteria: [] }, wizardOrigin,
    wizardSourceSnapshots: [createHopV55WizardSourceSnapshotV1({ origin: wizardOrigin, snapshot })], decisionReadings: [archive],
    scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: FIXTURE_AT };
  // Durable ticket of this reading: the Page's authority check rereads it before any correction.
  const scope = mapBrewerHopAdviceWizardSourceToScopeV1(source);
  const built = buildHopV55AssistedSemanticAdviceRequestForWizardV1({ current: { archiveWizard: archive, workspace, origin, snapshot,
    scopeAtPageLaunch: scope, context, livePrepared: prepared }, operationId: `operation:relations-${key}`, generation: 0, analysisMode: 'auto' });
  if (built.status !== 'ready') throw new Error(`Request Wizard de fixture refusée : ${built.status}.`);
  const captured = createHopV55AssistedAdviceWizardTicketV1({ id: `ticket:relations-${key}`, createdAt: FIXTURE_AT,
    principal: { principalId: OWNER, ownerKey: OWNER, workspaceId, scope, label: 'Brasseur fixture' },
    sourceArchive: built.sourceArchive, request: built.request, wire: built.wire, candidatePolicy: FIXTURE_POLICY });
  if (captured.status !== 'ready') throw new Error(`Ticket Wizard de fixture refusé : ${captured.status}.`);
  const created = prepareInitialPropertyAdviceV4ForWizardV1({ sourceReadingArchive: archive, origin, snapshot, ownerKey: OWNER,
    workspaceId, prepared, recordId: `answer:relations-${key}`, requestId: `request:relations-${key}`, candidatePolicy: FIXTURE_POLICY,
    cultureBinding: null, transition: { actId: `act:relations-${key}-create`, kind: 'create',
      reason: 'Termes de fixture confirmés explicitement.', actor: FIXTURE_ACTOR, recordedAt: FIXTURE_AT },
    additions: terms.map((term): HopV55PropertyAdviceAdditionV4 => ({ kind: 'add', sourceAnnotation: term,
      activeIntent: { ...term, interpretationOrigin: 'user' }, reason: `Terme « ${term.label} » confirmé pour cette fixture.` })) });
  if (created.status !== 'ready') throw new Error(`Parent de fixture non préparé : ${created.status}.`);
  expect(() => assertHopPropertyAdviceRequestV3(created.requestDraftV3.requestSnapshot)).not.toThrow();
  const answerSnapshot = buildHopPropertyAdviceV3(created.requestDraftV3.requestSnapshot);
  const parentRead = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(createHopV55PropertyAdviceAnswerRecordV4ForWizardV1({
    draft: created.recordDraft, outcome: { kind: 'domainAnswer', requestDraftReference: created.requestDraftV3.reference,
      answerSnapshot, answerReference: hopPropertyAdviceAnswerReferenceV3(answerSnapshot) } }));
  if (parentRead.status !== 'readOnly') throw new Error('Parent V4 Wizard de fixture non relu par le lecteur strict.');
  const parent = parentRead.record;
  // Two setup CAS through the real repository of these services, in its order: the new dossier with its source snapshot
  // and reading first (a semantic closure needs a reading already persisted by CAS); then, on the revision read back,
  // the ticket and the parent answer. The tests take their zero-write baseline only after these two writes.
  const writesBeforeSetup = workspaceTable().writes;
  const sourceSaved = await services.workspaces.save(workspace, null);
  const persisted = await services.workspaces.read(OWNER, workspaceId);
  if (!persisted || persisted.revision !== sourceSaved.revision) throw new Error('Dossier source de fixture non relu à sa révision persistée.');
  const installed = await services.workspaces.save({ ...persisted,
    assistedSemanticAdviceTickets: [...(persisted.assistedSemanticAdviceTickets ?? []), captured.ticket],
    documentaryAnswers: [...(persisted.documentaryAnswers ?? []), parent] }, persisted.revision);
  expect([sourceSaved.revision, installed.revision, workspaceTable().writes - writesBeforeSetup]).toEqual([1, 2, 2]);
  // Real application host as local history reader (consumer87 createWizardHost); no provider or runtime is involved.
  let clock = Date.parse(FIXTURE_AT), ids = 0;
  const historyHost = createHopV55SemanticAdoptionApplicationHostV1({
    services: { ownerKey: OWNER, workspaces: services.workspaces },
    readActor: () => ({ uid: OWNER, displayName: 'Brasseur fixture' }),
    readCurrentContext: async () => structuredClone(context),
    readCurrentWizardContext: async ({ origin: current }) => ({ snapshot: canonicalizeHopV55RecipeDraft({ ownerKey: current.ownerKey,
      draftId: current.draftId, draft }), context: structuredClone(context), livePrepared: prepareBrewingScenarioContext(context) }),
    now: () => new Date(++clock).toISOString(),
    makeId: (kind, operationId) => `${kind}:${operationId ?? 'relations'}:${++ids}`,
  });
  return { services, historyHost, parent, archive, origin, snapshot, prepared };
}

/** Real Page over the fixture dossier, with its real services and the real application host as local history reader. */
async function openFixtureCorrection(fixture: Awaited<ReturnType<typeof seedRelationsFixture>>) {
  render(<HopV55Page services={fixture.services} semanticHistoryHost={fixture.historyHost} />);
  const history = await screen.findByTestId('wizard-semantic-history', {}, SLOW);
  const correct = () => within(history).getByRole('button', { name: 'Corriger cette réponse' });
  await waitFor(() => expect(correct()).toBeEnabled(), SLOW);
  fireEvent.click(correct());
  const panelElement = await screen.findByTestId('wizard-answer-correction', {}, SLOW);
  return { history, panel: within(panelElement), relations: within(within(panelElement).getByTestId('wizard-answer-correction-relations')) };
}

/** Asks for the preview; a refusal of the real correction path fails here with the panel's own alert. */
async function previewOrAlert(panel: ReturnType<typeof within>) {
  fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
  await waitFor(() => expect(screen.queryByTestId('wizard-answer-correction-preview') ?? panel.queryByRole('alert')).not.toBeNull(), SLOW);
  expect(panel.queryByRole('alert')).toBeNull();
  return screen.getByTestId('wizard-answer-correction-preview');
}

/** The appended version, read back; the parent row, identity, provenance and every other dossier member stay exact. */
async function savedRevision(before: HopV55Workspace, parent: HopV55PropertyAdviceAnswerRecordV4ForWizardV1, motive: string) {
  const corrected = (await wizardWorkspace())!;
  expect(corrected.documentaryAnswers).toHaveLength((before.documentaryAnswers ?? []).length + 1);
  expect(corrected.documentaryAnswers!.slice(0, -1)).toEqual(before.documentaryAnswers);
  for (const member of ['wizardOrigin', 'wizardSourceSnapshots', 'decisionReadings', 'assistedSemanticAdviceTickets',
    'assistedSemanticAdviceRecords', 'semanticAdoptionCommits'] as const) expect(corrected[member]).toEqual(before[member]);
  const parentRow = corrected.documentaryAnswers!.find(raw => (raw as { reference?: string }).reference === parent.reference);
  expect(readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(parentRow)).toEqual({ status: 'readOnly', record: parent });
  const read = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(corrected.documentaryAnswers!.at(-1));
  if (read.status !== 'readOnly') throw new Error('Révision V4 Wizard attendue.');
  const revision = read.record;
  expect(revision.transition).toMatchObject({ kind: 'revise', parentRecordReference: parent.reference,
    parentReadingReference: parent.sourceReadingReference, reason: motive, actor: { origin: 'user' } });
  expect([revision.ownerKey, revision.workspaceId, revision.sourceReadingReference, revision.originalQuestion])
    .toEqual([parent.ownerKey, parent.workspaceId, parent.sourceReadingReference, parent.originalQuestion]);
  expect(revision.preparation.source).toEqual(parent.preparation.source);
  expect(revision.readingContext.candidatePolicy).toEqual(parent.readingContext.candidatePolicy);
  expect(revision.ledger.sourceAnnotations).toEqual(parent.ledger.sourceAnnotations);
  expect(revision.ledger.entries.slice(0, parent.ledger.entries.length)).toEqual(parent.ledger.entries);
  const outcome = revision.outcome;
  if (outcome.kind !== 'domainAnswer') throw new Error('Réponse documentaire attendue pour la version corrigée.');
  const request = outcome.answerSnapshot.requestSnapshot;
  expect(() => assertHopPropertyAdviceRequestV3(request)).not.toThrow();
  return { revision, request };
}

describe('Correction d’une réponse Wizard fermée · branches de Délier sur fixtures typées', () => {
  it('délie un constat d’une comparaison à deux constats : la comparaison garde l’autre, le constat délié reste actif, le parent reste exact', async () => {
    const { a, b, q } = keptTerms();
    const fixture = await seedRelationsFixture('kept', KEPT_QUESTION, [a, b, q]);
    const parentLatest = latestEntries(fixture.parent);
    // Valid parent: Q compares A and B, both related; each label is unique in the sealed version.
    expect(parentLatest.get(q.id)?.activeIntent).toMatchObject({ relatedIntentIds: [a.id, b.id],
      investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [a.id, b.id] } });
    for (const term of [a, b, q]) expect(fixture.parent.ledger.sourceAnnotations.filter(row => row.label === term.label)).toHaveLength(1);
    const { history, panel, relations } = await openFixtureCorrection(fixture);
    const before = structuredClone((await wizardWorkspace())!);
    const writesBefore = workspaceTable().writes;
    const motive = 'La note alpha ne se compare pas ici; je garde la comparaison avec la note bêta.';

    // Before the gesture, each row names its consequence on Q: the comparison keeps the other observation.
    expect(relations.getByText(`« ${q.label} » (question) → « ${a.label} » (constat) · lien, constat comparé`)).toBeInTheDocument();
    const unlinkA = relations.getByRole('button', { name: `Délier « ${a.label} » de « ${q.label} »` });
    expect(describedBy(unlinkA).textContent)
      .toBe(`Conséquence si tu délies : la comparaison de compensation de « ${q.label} » est conservée avec « ${b.label} ».`);
    expect(describedBy(relations.getByRole('button', { name: `Délier « ${b.label} » de « ${q.label} »` })).textContent)
      .toBe(`Conséquence si tu délies : la comparaison de compensation de « ${q.label} » est conservée avec « ${a.label} ».`);

    // Pure unlink of A: nothing is set aside, and the consequence on the remaining row follows the draft.
    fireEvent.click(unlinkA);
    expect(relations.getByRole('status')).toHaveTextContent('Aucun lien à résoudre pour cette correction.');
    expect(describedBy(relations.getByRole('button', { name: `Rétablir le lien de « ${q.label} » vers « ${a.label} »` })).textContent)
      .toBe(`Conséquence de ce déliement : la comparaison de compensation de « ${q.label} » est conservée avec « ${b.label} ».`);
    expect(describedBy(relations.getByRole('button', { name: `Délier « ${b.label} » de « ${q.label} »` })).textContent)
      .toBe(`Conséquence si tu délies : la comparaison de compensation de « ${q.label} » est retirée, car « ${b.label} » en est le dernier constat comparé; « ${q.label} » reste retenu comme question ouverte, sans comparaison.`);
    fireEvent.change(panel.getByRole('textbox', { name: 'Motif de la correction' }), { target: { value: motive } });
    const preview = await previewOrAlert(panel);
    const terms = within(preview).getByRole('table', { name: /Termes avant et après/ });
    expect(preview).toHaveTextContent('1 modification');
    expect(rowCells(terms, q.label)).toEqual(['retenu', 'retenu · liens modifiés']);
    expect(rowCells(terms, a.label)).toEqual(['retenu', 'retenu']);
    expect(rowCells(terms, b.label)).toEqual(['retenu', 'retenu']);
    const links = within(preview).getByRole('table', { name: 'Liens avant et après' });
    expect(rowCells(links, new RegExp(`^« ${escape(q.label)} » → « ${escape(a.label)} »`))).toEqual(['actif', 'retiré · délié']);
    expect(rowCells(links, new RegExp(`^« ${escape(q.label)} » → « ${escape(b.label)} »`))).toEqual(['actif', 'actif']);
    expect(rowCells(within(preview).getByRole('table', { name: 'Comparaisons et partenaires avant et après' }),
      `« ${q.label} » · comparaison de compensation`)).toEqual([`avec « ${a.label} », « ${b.label} »`, `avec « ${b.label} »`]);
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);

    fireEvent.click(within(preview).getByRole('button', { name: 'Enregistrer cette correction' }));
    await screen.findByText(/Correction enregistrée comme nouvelle version/, {}, SLOW);
    const { revision, request } = await savedRevision(before, fixture.parent, motive);
    const latest = latestEntries(revision);
    const qEntry = latest.get(q.id)!;
    expect(qEntry).toMatchObject({ disposition: 'active',
      decision: { kind: 'revise', reason: motive, predecessorEntryReference: parentLatest.get(q.id)!.reference } });
    // Only A leaves Q: B stays compared and related, the comparison keeps its kind, every other field is unchanged.
    expect(qEntry.activeIntent!.relatedIntentIds).toEqual([b.id]);
    expect(qEntry.activeIntent!.investigation).toEqual({ kind: 'comparePerceptualCompensation', observationIntentIds: [b.id] });
    expect(without(qEntry.activeIntent!, ['relatedIntentIds', 'investigation']))
      .toEqual(without(parentLatest.get(q.id)!.activeIntent!, ['relatedIntentIds', 'investigation']));
    // A pure unlink sets nothing aside: A, B and every other term keep their exact parent entry.
    for (const [id, entry] of parentLatest) if (id !== q.id) expect(latest.get(id)).toEqual(entry);
    expect(latest.get(a.id)?.disposition).toBe('active');
    expect(request.propertyIntents.find(row => row.id === q.id)?.investigation).toEqual(qEntry.activeIntent!.investigation);
    expect(request.propertyIntents.map(row => row.id)).toEqual(expect.arrayContaining([a.id, b.id, q.id]));
    await waitFor(() => expect(history).toHaveTextContent(revision.reference), SLOW);
    expect(history).toHaveTextContent(fixture.parent.reference);
    expect(recipeSaves.calls).toEqual([]);
  }, 60000);

  it('isole la garde du partenaire interne : écarter A seul est refusé, Délier P→A retire ce seul partenaire et garde le partenaire externe de E', async () => {
    const { a, p, e } = partnerTerms();
    const fixture = await seedRelationsFixture('partner', PARTNER_QUESTION, [a, p, e]);
    const parentLatest = latestEntries(fixture.parent);
    // Valid parent: P's only link is its internal partner A; E's partner is outside the ledger's source annotations.
    expect(parentLatest.get(p.id)?.activeIntent).toMatchObject({ relatedIntentIds: [], partner: { kind: 'observation', id: a.id } });
    expect(parentLatest.get(p.id)?.activeIntent).not.toHaveProperty('investigation');
    expect(parentLatest.get(e.id)?.activeIntent?.partner).toEqual({ kind: 'observation', id: EXTERNAL_OBSERVATION });
    expect(fixture.parent.ledger.sourceAnnotations.some(row => row.id === EXTERNAL_OBSERVATION)).toBe(false);
    for (const term of [a, p, e]) expect(fixture.parent.ledger.sourceAnnotations.filter(row => row.label === term.label)).toHaveLength(1);

    // Real domain counter-proof on the same parent: A alone reaches the partner guard, not a related or compared link.
    let guard: unknown;
    try {
      prepareCorrectionV4ForWizardV1({ sourceRecord: fixture.parent, sourceReadingArchive: fixture.archive, origin: fixture.origin,
        snapshot: fixture.snapshot, prepared: fixture.prepared, recordId: 'answer:relations-partner-guard',
        requestId: 'request:relations-partner-guard', actions: [{ kind: 'reject', annotationId: a.id, reason: 'Contre-épreuve : A seul.' }],
        transition: { actId: 'act:relations-partner-guard', kind: 'revise', parentRecordReference: fixture.parent.reference,
          parentReadingReference: fixture.parent.sourceReadingReference, reason: 'Contre-épreuve : A seul.', actor: FIXTURE_ACTOR,
          recordedAt: FIXTURE_AT } });
    } catch (error) { guard = error; }
    expect(guard instanceof Error ? guard.message : guard).toBe(`Partenaire observation actif ${p.id} vers une annotation rejetée (${a.id}).`);

    const { history, panel, relations } = await openFixtureCorrection(fixture);
    const before = structuredClone((await wizardWorkspace())!);
    const writesBefore = workspaceTable().writes;
    const motive = 'La note gamma ne décrit pas ce brouillon; le profil pi reste sans ce repère.';

    // The internal partner is the only relation; E's external partner is not a link of this version.
    expect(relations.getByText(`« ${p.label} » (préférence) → « ${a.label} » (constat) · partenaire d’observation`)).toBeInTheDocument();
    expect(relations.queryByText(new RegExp(escape(e.label)))).toBeNull();
    const unlink = relations.getByRole('button', { name: `Délier « ${a.label} » de « ${p.label} »` });
    const consequence = `le partenaire d’observation « ${a.label} » de « ${p.label} » est retiré.`;
    expect(describedBy(unlink).textContent).toBe(`Conséquence si tu délies : ${consequence}`);

    // A set aside alone: refused before any preparation, by its partner link and in labels only; nothing is written.
    fireEvent.click(panel.getByRole('checkbox', { name: `Écarter « ${a.label} »` }));
    fireEvent.change(panel.getByRole('textbox', { name: 'Motif de la correction' }), { target: { value: motive } });
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    const refusal = await panel.findByRole('alert', {}, SLOW);
    expect(refusal).toHaveTextContent(`« ${p.label} » reste relié à « ${a.label} » (partenaire d’observation)`);
    expect(refusal).not.toHaveTextContent(/\((lien|constat comparé)/);
    for (const id of [a.id, p.id, e.id]) expect(refusal.textContent).not.toContain(id);
    expect(relations.getByRole('status')).toHaveTextContent(/À résoudre avant l’aperçu · 1/);
    expect(screen.queryByTestId('wizard-answer-correction-preview')).toBeNull();
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);

    // Explicit unlink P→A with the same rejection of A: the real correction path builds the preview.
    fireEvent.click(unlink);
    expect(relations.getByRole('status')).toHaveTextContent('Aucun lien à résoudre pour cette correction.');
    expect(describedBy(relations.getByRole('button', { name: `Rétablir le lien de « ${p.label} » vers « ${a.label} »` })).textContent)
      .toBe(`Conséquence de ce déliement : ${consequence}`);
    const preview = await previewOrAlert(panel);
    const terms = within(preview).getByRole('table', { name: /Termes avant et après/ });
    expect(preview).toHaveTextContent('2 modifications');
    expect(rowCells(terms, a.label)).toEqual(['retenu', 'écarté · modifié']);
    expect(rowCells(terms, p.label)).toEqual(['retenu', 'retenu · liens modifiés']);
    expect(rowCells(terms, e.label)).toEqual(['retenu', 'retenu']);
    expect(rowCells(within(preview).getByRole('table', { name: 'Liens avant et après' }),
      new RegExp(`^« ${escape(p.label)} » → « ${escape(a.label)} »`))).toEqual(['actif', 'retiré · délié']);
    const effects = within(preview).getByRole('table', { name: 'Comparaisons et partenaires avant et après' });
    expect(rowCells(effects, `« ${p.label} » · partenaire d’observation`)).toEqual([`« ${a.label} »`, 'retiré']);
    expect(within(effects).queryByRole('rowheader', { name: new RegExp(escape(e.label)) })).toBeNull();
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);

    fireEvent.click(within(preview).getByRole('button', { name: 'Enregistrer cette correction' }));
    await screen.findByText(/Correction enregistrée comme nouvelle version/, {}, SLOW);
    const { revision, request } = await savedRevision(before, fixture.parent, motive);
    const latest = latestEntries(revision);
    expect(latest.get(a.id)).toMatchObject({ disposition: 'rejected',
      decision: { kind: 'reject', reason: motive, predecessorEntryReference: parentLatest.get(a.id)!.reference } });
    const pEntry = latest.get(p.id)!;
    expect(pEntry).toMatchObject({ disposition: 'active', decision: { kind: 'revise', reason: motive } });
    // P loses only its internal partner, omitted rather than undefined; every other field, empty links included, is kept.
    expect(pEntry.activeIntent).not.toHaveProperty('partner');
    expect(without(pEntry.activeIntent!, [])).toEqual(without(parentLatest.get(p.id)!.activeIntent!, ['partner']));
    // E's external partner is no link of this ledger: its entry, partner included, stays exact; so does every other term.
    for (const [id, entry] of parentLatest) if (id !== a.id && id !== p.id) expect(latest.get(id)).toEqual(entry);
    const requestE = request.propertyIntents.find(row => row.id === e.id);
    const requestP = request.propertyIntents.find(row => row.id === p.id);
    expect(requestE?.partner).toEqual({ kind: 'observation', id: EXTERNAL_OBSERVATION });
    expect(requestP).toBeDefined();
    expect(requestP).not.toHaveProperty('partner');
    expect(request.propertyIntents.some(row => row.id === a.id)).toBe(false);
    await waitFor(() => expect(history).toHaveTextContent(revision.reference), SLOW);
    expect(history).toHaveTextContent(fixture.parent.reference);
    expect(recipeSaves.calls).toEqual([]);
  }, 60000);
});
