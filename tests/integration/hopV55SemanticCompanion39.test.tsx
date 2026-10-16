// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { User } from 'firebase/auth';
import type { BrewerContext, BrewerEvidence } from '../../functions/src/companionTypes';
import {
  HOP_ADVICE_PROTOCOL_V1,
  type HopAdviceV1PublicJob, type HopAdviceV1PublicTurn, type HopAdviceV1WireInputV3, type HopAdviceV1WizardWireInputV1,
} from '../../functions/src/brewerHopAdviceTransportV1';
import { mapBrewerHopAdviceLaunchSourceToScopeV1 } from '../../functions/src/brewerHopAdviceContextBinding';
import { mapBrewerHopAdviceWizardSourceToScopeV1 } from '../../functions/src/brewerHopAdviceWizardSourceV1';
import { createBrewerHopAdviceProposalEnvelopeV6,
  createBrewerHopAdviceProposalEnvelopeV6ForWizardV1 } from '../../functions/src/brewerHopAdviceSemanticV6';
import { brewerAdviceFromSemanticProposalV5 } from '../../functions/src/brewerHopAdviceSemanticAdapter';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import * as catalogueReferences from '../../src/domain/brewingCatalogueReferences';
import * as propertyAdvice from '../../src/domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import type { Recipe } from '../../src/types';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55Services } from '../../src/services/hopV55/runtime';
import { createHopV55WorkspaceRepository, createHopV55WizardWorkspaceOriginV1, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import type { BrewingScenarioLocalDatabaseAdapter, BrewingScenarioLocalTable } from '../../src/services/brewingScenarioLocalRepository';
import { readHopV55AssistedAdviceTicketV2, readHopV55AssistedAdviceWizardArchiveV1,
  readHopV55AssistedAdviceWizardTicketV1 } from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { readHopV55DecisionReadingArchive, readHopV55DecisionReadingArchiveForWizardV1 } from '../../src/services/hopV55/decisionArchive';
import { readHopV55DocumentaryAnswerRecord, readHopV55DocumentaryAnswerRecordWithWizardV1 } from '../../src/services/hopV55/documentaryRecords';
import { readHopV55SemanticAdoptionCommitV1 } from '../../src/services/hopV55/semanticAdoptionController';
import { readHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  type HopV55PropertyAdviceAnswerRecordV4ForWizardV1 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { canonicalizeHopV55RecipeDraft, type HopV55RecipeStepStorage } from '../../src/services/hopV55/recipeStepContext';
import { HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1,
  type HopV55SemanticAdoptionApplicationHostV1, type HopV55SemanticJobSnapshotV3,
  type HopV55SemanticWizardJobSnapshotV1 } from '../../src/services/hopV55/semanticAdoptionApplicationHost';
import { brewerJobs, type HopV55SemanticJobSendInputV3, type HopV55SemanticWizardJobReadInputV1,
  type HopV55SemanticWizardJobSendInputV1 } from '../../src/services/brewerJobs';
import { createBrewerHopAdviceSemanticRuntimeV3, createBrewerHopAdviceSemanticRuntimeWizardV1,
  hopAdviceWizardClientPartitionKey } from '../../src/services/brewerHopAdviceRuntime';
import { createBrewerHopAdviceApiForWizardV1 } from '../../src/services/brewerHopAdviceApi';
import { StorageService } from '../../src/services/storage';
import { FirebaseAuthService } from '../../src/services/firebaseAuth';
import * as uiContracts from '../../src/ui/hopV55/assistedAdviceUiContracts';
import type { HopV55SemanticAdviceCapabilityV3 } from '../../src/ui/hopV55/assistedAdviceUiContracts';
import { createHopV55SemanticWizardRuntimeFactoryFromApiV1, HopV55Host } from '../../src/ui/hopV55/Host';
import { HopV55Page } from '../../src/ui/hopV55/Page';
import { HopV55RecipeStep } from '../../src/ui/hopV55/RecipeStep';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

// Memory adapters only: the real #67 repository, Host, Page, RecipeStep and BrewerChat run unchanged.
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
    throw new Error('Le banc #39 n’enregistre aucune recette.');
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

const OWNER = 'owner:semantic-companion-39-fixture';
const DRAFT_ID = 'semantic-companion-39-draft';
const QUESTION = 'Ma bière est trop sucrée. Comment envisager une compensation avec le houblon ? Je veux une faible amertume et garder la poire. Mon houblon maison sans analyse a une odeur résineuse.';
const LAUNCH = 'Ouvrir le compagnon pour cette lecture';
const WIZARD_OPEN = 'Ouvrir un dossier assisté pour ce brouillon';
const UNSUPPORTED_V4 = /n’accepte pas encore cette lecture sémantique V4/;
const SEND = 'Envoyer la lecture assistée';
const RETRY = 'Réessayer le même ticket';
const CHOICE = /Retenir « Documenter la piste »/;
const SLOW = { timeout: 10000 };
const evidence: BrewerEvidence = {
  id: 'E1', name: 'lookup_style_reference', label: 'Source fixture locale #39',
  facts: ['Document fixture de test.'], limits: ['Ne prouve aucun fait de brassin.'], data: { origin: 'test-fixture-39' },
};

class MemoryWorkspaceTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  readonly rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  writes = 0;
  rejectTicketRows = false;
  private key(value: unknown): string { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId]); }
  private guard(row: HopV55WorkspaceEnvelopeV1) {
    this.writes++;
    if (this.rejectTicketRows && (row.workspace.assistedSemanticAdviceTickets?.length ?? 0) > 0) throw new Error('fixture-ticket-cas-refused');
  }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.guard(row); this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.guard(row); this.rows.set(this.key(row), structuredClone(row)); }
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
  close() { /* Memory-only adapter; Dexie remains #67's received proof. */ }
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
  return { id: 'semantic-39-synthetic-hop', name: 'Houblon synthétique #39 sans analyse', aliases: [], form: 'unknown', descriptions: [], analysis: [] };
}

/** Saved Recipes as the server and Host storage see them; the wizard draft never enters this list. */
const saved = { recipes: [] as Recipe[] };
const auth: { user: { uid: string; displayName: string } | null } = { user: null };

function hostLikeContext(recipe: Recipe, provenance: string): BrewerContext {
  return { recipe: structuredClone(recipe),
    hopIndex: { varieties: [syntheticVariety()], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] },
    inventory: [], stockReservations: { complete: false, batches: [], source: 'localCache' }, material: [], waterSources: [],
    now: Date.now(), phase: 'Recette source explicitement choisie', provenance: [provenance], editableTargets: [] } as unknown as BrewerContext;
}

function fixtureIntent(fragment: string, id: string) {
  const start = QUESTION.indexOf(fragment);
  if (start < 0) throw new Error('Fragment V6 fixture absent de la question exacte.');
  return { id, property: 'aroma' as const, label: fragment, role: 'preference' as const, direction: null,
    qualification: null, required: false, comparisonBasis: { kind: 'none' as const, assertionIds: [] as string[] },
    metric: 'sensory' as const, subject: { kind: 'beer' as const, label: 'Bière fixture', materialId: null, sensoryContext: 'beer' as const },
    sourceSpans: [{ start, end: start + fragment.length, text: fragment }], basis: 'Proposition V6 synthétique #39.', relatedIntentIds: [] as string[] };
}

/** One deterministic V6 proposal: a preference read from the question's own span and an option to document it. */
function fixtureRaw() {
  return {
    annotationReviews: [],
    propertyIntentProposals: [{ proposalId: 'assist-proposal-resin-note', kind: 'add', sourceAnnotationIds: [],
      intent: fixtureIntent('odeur résineuse', 'assist-intent-resin-note'), motive: 'Piste fixture explicite, à confirmer.' }],
    semanticRevisionProposals: [], openQuestions: [], materials: [],
    answer: { summary: 'Piste de démonstration locale #39.', readingNote: 'Fixture V6; aucune conclusion brassicole réelle.',
      options: [{ id: 'assist-option-document', kind: 'investigation', title: 'Documenter la piste',
        rationale: 'Source de test sans affirmation physique.', conditions: [], tradeoffs: [], relatedIds: [], evidenceIds: [evidence.id] }],
      unknowns: [{ id: 'assist-unknown-alpha', question: 'Alpha réel du houblon maison ?', changesChoice: 'Change la dose éventuelle.', relatedIds: [] }],
      program: { kind: 'none', note: 'Aucun programme appliqué par cette fixture.' }, refusals: [] },
    optionProposalLinks: [{ optionId: 'assist-option-document', proposalId: 'assist-proposal-resin-note', evidenceIds: [evidence.id] }],
  };
}

/**
 * Fixture server: it resolves its context from the wire's scope alone (a saved Recipe by ID, or the draft carried
 * in a draft-scoped wire). No closure hands it the client draft, so a wrong scope cannot be hidden.
 */
function serverContextForWire(wire: HopAdviceV1WireInputV3): BrewerContext {
  const launch = wire.hopAdvice.contextLaunch;
  if (wire.scope.kind !== launch.scope.kind || wire.scope.id !== launch.scope.id) throw new Error('Fixture serveur : scope du wire ≠ scope du lancement.');
  if (wire.scope.kind === 'recipe') {
    const recipe = saved.recipes.find(row => row.id === wire.scope.id);
    if (!recipe) throw new Error('Fixture serveur : aucune recette enregistrée pour ce scope.');
    return hostLikeContext(recipe, 'Recette enregistrée relue par le serveur fixture.');
  }
  const draft = (wire as { draft?: unknown }).draft;
  if (wire.scope.kind === 'draft' && draft && typeof draft === 'object') {
    return hostLikeContext(structuredClone(draft) as Recipe, 'Brouillon transporté dans le wire.');
  }
  throw new Error(`Fixture serveur : scope ${wire.scope.kind} hors banc #39.`);
}

/** Wizard server: the draft comes only from the Wizard wire; a saved Recipe of the same ID is never consulted. */
function serverContextForWizardWire(wire: HopAdviceV1WizardWireInputV1): BrewerContext {
  const launch = wire.hopAdvice.contextLaunch;
  if (wire.scope.kind !== 'draft' || launch.scope.id !== wire.scope.id) throw new Error('Fixture serveur : scope Wizard ≠ scope du lancement.');
  if (!wire.draft || typeof wire.draft !== 'object') throw new Error('Fixture serveur : brouillon Wizard absent du wire.');
  return { recipe: structuredClone(wire.draft) as Recipe,
    hopIndex: { varieties: [], lots: [], knowledge: [], predictions: [], tastings: [], truncated: [] },
    inventory: [], stockReservations: { complete: false, batches: [], source: 'localCache' }, material: [], waterSources: [],
    now: Date.now(), phase: 'Brouillon de recette en cours d’écriture', provenance: ['Brouillon transporté dans le wire Wizard.'],
    editableTargets: [] } as unknown as BrewerContext;
}

function fixturePublicTurn(wire: HopAdviceV1WireInputV3): { job: HopAdviceV1PublicJob; turn: HopAdviceV1PublicTurn } {
  const context = serverContextForWire(wire);
  const prepared = prepareBrewingScenarioContext(context);
  const serverContext = { phase: context.phase, provenance: [...(context.provenance ?? [])], loadedAt: context.now,
    binding: structuredClone(wire.hopAdvice.contextLaunch.expected) };
  const envelope = createBrewerHopAdviceProposalEnvelopeV6({ request: wire.hopAdvice, prepared, raw: fixtureRaw(), evidence: [evidence], serverContext });
  const at = Date.parse('2026-10-05T12:00:00.000Z');
  const job: HopAdviceV1PublicJob = { id: 'job:' + wire.operationId, operationId: wire.operationId,
    scope: structuredClone(wire.scope), generation: wire.generation ?? 0, question: wire.question,
    label: 'Fixture V6 locale #39', status: 'done', stage: 'saving', createdAt: at, updatedAt: at, finishedAt: at, attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const turn: HopAdviceV1PublicTurn = { id: job.id, operationId: job.operationId, question: job.question,
    advice: brewerAdviceFromSemanticProposalV5(envelope.proposal), evidence: [structuredClone(evidence)], createdAt: at,
    model: 'V6 fixture locale #39', reviewed: true, mode: wire.analysisMode, contextLabel: 'Fixture · V6 sémantique',
    protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: envelope };
  return { job, turn };
}

function fixtureWizardPublicTurn(wire: HopAdviceV1WizardWireInputV1): { job: HopAdviceV1PublicJob; turn: HopAdviceV1PublicTurn } {
  const context = serverContextForWizardWire(wire);
  const prepared = prepareBrewingScenarioContext(context);
  const serverContext = { phase: context.phase, provenance: [...(context.provenance ?? [])], loadedAt: context.now,
    binding: structuredClone(wire.hopAdvice.contextLaunch.expected) };
  const envelope = createBrewerHopAdviceProposalEnvelopeV6ForWizardV1({ request: wire.hopAdvice, prepared, raw: fixtureRaw(),
    evidence: [evidence], serverContext });
  const at = Date.parse('2026-10-05T12:00:00.000Z');
  const job: HopAdviceV1PublicJob = { id: 'job:' + wire.operationId, operationId: wire.operationId,
    scope: structuredClone(wire.scope), generation: wire.generation ?? 0, question: wire.question,
    label: 'Fixture Wizard V6 #39', status: 'done', stage: 'saving', createdAt: at, updatedAt: at, finishedAt: at, attempt: 1,
    protocol: HOP_ADVICE_PROTOCOL_V1.name };
  const turn: HopAdviceV1PublicTurn = { id: job.id, operationId: job.operationId, question: job.question,
    advice: { level: 'info', summary: 'Piste de démonstration du brouillon #39.', action: '', why: '', watch: '', question: '',
      evidenceIds: [evidence.id] }, evidence: [structuredClone(evidence)], createdAt: at,
    model: 'V6 fixture Wizard #39', reviewed: true, mode: wire.analysisMode, contextLabel: 'Fixture · brouillon Wizard',
    protocol: HOP_ADVICE_PROTOCOL_V1.name, hopAdviceProposal: envelope };
  return { job, turn };
}

function workspaceRepository() {
  return createHopV55WorkspaceRepository({ ownerKey: OWNER, database: memory.workspaceDatabase as HopV55WorkspaceDatabaseAdapter });
}
async function storedWorkspace(): Promise<HopV55Workspace | undefined> {
  return (await workspaceRepository().list(OWNER))[0];
}
/** The local workshop dossier of the Page (never a Wizard origin). */
async function classicWorkspace(): Promise<HopV55Workspace | undefined> {
  return (await workspaceRepository().list(OWNER)).find(row => row.wizardOrigin === undefined);
}
/** The assisted dossier of the creator draft. */
async function wizardWorkspace(): Promise<HopV55Workspace | undefined> {
  return (await workspaceRepository().list(OWNER)).find(row => row.wizardOrigin !== undefined);
}
function workspaceTable() { return (memory.workspaceDatabase as MemoryWorkspaceDatabase).workspaces; }

/** Explicit local QA provider: identified as fixture, no callable, model or network. */
function fixtureServer(options: { wizard?: boolean } = {}) {
  const server = {
    emissions: [] as HopAdviceV1WireInputV3[],
    ticketDurableAtEmission: [] as boolean[],
    runtimes: [] as Array<{ ownerKey: string; workspaceId: string; scope: { kind: string; id: string } }>,
    /** When set, the server conversation advances to this generation once a ticket is durable. */
    generationAfterTicket: undefined as number | undefined,
    snapshots: new Map<string, HopV55SemanticJobSnapshotV3>(),
    wizardEmissions: [] as HopAdviceV1WizardWireInputV1[],
    wizardRetries: [] as HopAdviceV1WizardWireInputV1[],
    wizardTicketDurableAtEmission: [] as boolean[],
    wizardRuntimes: [] as Array<{ ownerKey: string; workspaceId: string; scope: { kind: string; id: string } }>,
    /** The first Wizard emission is answered by a failed job; the retry of the same ticket receives the turn. */
    failFirstWizardEmission: false,
    wizardGenerationAfterTicket: undefined as number | undefined,
    wizardSnapshots: new Map<string, HopV55SemanticWizardJobSnapshotV1>(),
  };
  const readGeneration = async () => {
    if (server.generationAfterTicket === undefined) return 0;
    return ((await storedWorkspace())?.assistedSemanticAdviceTickets?.length ?? 0) > 0 ? server.generationAfterTicket : 0;
  };
  const emit = async (send: HopV55SemanticJobSendInputV3): Promise<HopV55SemanticJobSnapshotV3> => {
    const launch = send.wire.hopAdvice.contextLaunch;
    const workspace = await workspaceRepository().read(OWNER, launch.workspaceId);
    const raw = (workspace?.assistedSemanticAdviceTickets ?? []).find(row => !!row && typeof row === 'object'
      && (row as { reference?: unknown }).reference === send.ticketReference);
    const read = raw ? readHopV55AssistedAdviceTicketV2(raw) : undefined;
    const durable = read?.status === 'readOnly' && read.ticket.format === 'hop-v55-assisted-advice-ticket-v3'
      && read.ticket.references.wireReference === send.wireReference && JSON.stringify(read.ticket.wire) === JSON.stringify(send.wire);
    server.ticketDurableAtEmission.push(durable);
    if (!durable) throw new Error('Fixture serveur : le ticket V3 exact n’était pas durable avant l’émission.');
    server.emissions.push(structuredClone(send.wire));
    const generated = fixturePublicTurn(send.wire);
    const snapshot: HopV55SemanticJobSnapshotV3 = { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_V3_FORMAT, operationId: send.operationId,
      generation: send.generation, ticketReference: send.ticketReference, wireReference: send.wireReference,
      status: 'received', job: generated.job, turn: generated.turn };
    server.snapshots.set(send.operationId, snapshot);
    return structuredClone(snapshot);
  };
  const wizardTicketDurable = async (send: HopV55SemanticWizardJobSendInputV1) => {
    const workspace = await workspaceRepository().read(OWNER, send.wire.hopAdvice.contextLaunch.workspaceId);
    const raw = (workspace?.assistedSemanticAdviceTickets ?? []).find(row => !!row && typeof row === 'object'
      && (row as { reference?: unknown }).reference === send.ticketReference);
    const read = raw ? readHopV55AssistedAdviceWizardTicketV1(raw) : undefined;
    return read?.status === 'readOnly' && read.ticket.references.wireReference === send.wireReference
      && JSON.stringify(read.ticket.wire) === JSON.stringify(send.wire);
  };
  const wizardReceived = (send: HopV55SemanticWizardJobSendInputV1): HopV55SemanticWizardJobSnapshotV1 => {
    const generated = fixtureWizardPublicTurn(send.wire);
    const snapshot: HopV55SemanticWizardJobSnapshotV1 = { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1, operationId: send.operationId,
      generation: send.generation, ticketReference: send.ticketReference, wireReference: send.wireReference,
      status: 'received', job: generated.job, turn: generated.turn };
    server.wizardSnapshots.set(send.operationId, snapshot);
    return structuredClone(snapshot);
  };
  const wizardSubmit = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1> => {
    const durable = await wizardTicketDurable(send);
    server.wizardTicketDurableAtEmission.push(durable);
    if (!durable) throw new Error('Fixture serveur : le ticket Wizard exact n’était pas durable avant l’émission.');
    server.wizardEmissions.push(structuredClone(send.wire));
    if (server.failFirstWizardEmission && server.wizardEmissions.length === 1) {
      const failed: HopV55SemanticWizardJobSnapshotV1 = { format: HOP_V55_SEMANTIC_JOB_SNAPSHOT_WIZARD_V1, operationId: send.operationId,
        generation: send.generation, ticketReference: send.ticketReference, wireReference: send.wireReference,
        status: 'failed', reason: 'Réessai déterministe du fournisseur fixture.' };
      server.wizardSnapshots.set(send.operationId, failed);
      return structuredClone(failed);
    }
    return wizardReceived(send);
  };
  const wizardRetry = async (send: HopV55SemanticWizardJobSendInputV1): Promise<HopV55SemanticWizardJobSnapshotV1> => {
    if (!await wizardTicketDurable(send)) throw new Error('Fixture serveur : retry sans ticket Wizard durable exact.');
    server.wizardRetries.push(structuredClone(send.wire));
    return wizardReceived(send);
  };
  const wizardRead = async (input: HopV55SemanticWizardJobReadInputV1) => {
    const snapshot = server.wizardSnapshots.get(input.operationId);
    return snapshot && snapshot.ticketReference === input.ticketReference ? structuredClone(snapshot) : null;
  };
  const wizardReadGeneration = async () => {
    if (server.wizardGenerationAfterTicket === undefined) return 0;
    return ((await wizardWorkspace())?.assistedSemanticAdviceTickets?.length ?? 0) > 0 ? server.wizardGenerationAfterTicket : 0;
  };
  const capability: HopV55SemanticAdviceCapabilityV3 = { kind: 'fixture', createRuntimeForScope: input => {
    server.runtimes.push(structuredClone({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: input.scope }));
    return createBrewerHopAdviceSemanticRuntimeV3({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: input.scope,
      providerKind: 'fixture', readGeneration,
      transport: {
        submit: emit,
        retry: emit,
        read: async (query: { operationId: string }) => {
          const snapshot = server.snapshots.get(query.operationId);
          const ticketReference = (query as { ticketReference?: string }).ticketReference;
          return snapshot && (ticketReference === undefined || snapshot.ticketReference === ticketReference) ? structuredClone(snapshot) : null;
        },
      } });
  }, ...(options.wizard ? { createWizardRuntimeForScope: input => {
    server.wizardRuntimes.push(structuredClone({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: input.scope }));
    return createBrewerHopAdviceSemanticRuntimeWizardV1({ ownerKey: input.ownerKey, workspaceId: input.workspaceId, scope: input.scope,
      providerKind: 'fixture', readGeneration: wizardReadGeneration,
      transport: { submit: wizardSubmit, retry: wizardRetry, read: wizardRead } });
  } } : {}) };
  return { server, capability };
}

function savedRecipe(): Recipe {
  return { ...fixtureRecipe(), id: 'recipe-semantic-companion-39-saved', name: 'Recette enregistrée #39' };
}

beforeEach(() => {
  memory.workspaceDatabase = new MemoryWorkspaceDatabase();
  memory.scenarioDatabase = new MemoryScenarioDatabase();
  recipeSaves.calls.length = 0;
  saved.recipes = [savedRecipe()];
  auth.user = { uid: OWNER, displayName: 'Brasseur fixture #39' };
  vi.spyOn(catalogueReferences, 'loadBrewingCatalogueReferences').mockImplementation(async () => ({ varieties: [syntheticVariety()], knowledge: [] }));
  vi.spyOn(FirebaseAuthService, 'getCurrentUser').mockImplementation(() => auth.user as unknown as User | null);
  vi.spyOn(StorageService, 'getRecipes').mockImplementation(() => structuredClone(saved.recipes) as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getHopVarieties').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getHopLots').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getHopKnowledge').mockImplementation(() => [] as never);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [] }) as never);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

async function readQuestionInPage() {
  fireEvent.change(await screen.findByRole('textbox', { name: 'Question au brasseur' }, SLOW), { target: { value: QUESTION } });
  fireEvent.click(screen.getByRole('button', { name: 'Lire ma question' }));
  await waitFor(async () => expect((await storedWorkspace())?.decisionReadings?.length).toBe(1), SLOW);
  const workspace = (await storedWorkspace())!;
  const read = readHopV55DecisionReadingArchive(workspace.decisionReadings![0]);
  if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v4') throw new Error('Archive V4 attendue.');
  return { workspace, archive: read.archive };
}

/** Real Host + Page: V4 reading, then the V4 launch must exist (RED on the pre-#39 base). */
async function openCompanionFromV4(capability: HopV55SemanticAdviceCapabilityV3) {
  const view = render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} semanticAdviceCapability={capability} />);
  const { workspace, archive } = await readQuestionInPage();
  await waitFor(() => expect(screen.queryByRole('button', { name: LAUNCH }) ?? screen.queryByText(UNSUPPORTED_V4)).not.toBeNull(), SLOW);
  // Pre-#39 base: even with an explicit fixture capability the V4 archive stays announced as unsupported.
  expect(screen.queryByText(UNSUPPORTED_V4)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: LAUNCH }));
  await screen.findByRole('button', { name: SEND }, SLOW);
  return { view, workspace, archive };
}

function chatDialog() { return screen.getByRole('dialog', { name: 'Compagnon brasseur' }); }

async function receiveV6Turn() {
  fireEvent.click(screen.getByRole('button', { name: SEND }));
  await waitFor(async () => expect((await storedWorkspace())?.assistedSemanticAdviceRecords?.length).toBe(1), SLOW);
  await screen.findByTestId('semantic-v6-turn', {}, SLOW);
}

async function previewChoice(motive = 'Je retiens cette piste pour la documenter.') {
  const choice = await screen.findByRole('checkbox', { name: CHOICE }, SLOW);
  if (!(choice as HTMLInputElement).checked) fireEvent.click(choice);
  fireEvent.change(screen.getByRole('textbox', { name: 'Motif de ton choix' }), { target: { value: motive } });
  fireEvent.click(screen.getByRole('button', { name: 'Prévisualiser ce choix' }));
  return screen.findByRole('button', { name: 'Confirmer ce choix' }, SLOW);
}

/** An active term of the exact V4 ledger whose label is unique, so its correction checkbox is unambiguous. */
function uniqueActiveTerm(record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1): { id: string; label: string } {
  const entries = [...record.ledger.entries].reverse();
  const terms = record.ledger.sourceAnnotations.map(annotation => ({ id: annotation.id,
    label: (entries.find(entry => entry.annotationId === annotation.id && entry.activeIntent)?.activeIntent ?? annotation).label,
    active: entries.find(entry => entry.annotationId === annotation.id)?.disposition === 'active' }));
  const term = terms.filter(row => row.active && terms.filter(other => other.label === row.label).length === 1).at(-1);
  if (!term) throw new Error('Terme actif unique attendu dans la réponse V4 Wizard.');
  return { id: term.id, label: term.label };
}

describe('#39 · compagnon Request3/V6 sur l’archive V4 de la vraie Page', () => {
  it('scelle source/scope/policy, persiste le ticket avant l’émission, puis choix → aperçu → confirmation → historique → rejeu', async () => {
    const { server, capability } = fixtureServer();
    const recipesBefore = structuredClone(saved.recipes);
    const standardJobsBefore = brewerJobs.snapshot().jobs.length;
    const { view, archive } = await openCompanionFromV4(capability);
    expect(server.runtimes).toHaveLength(1);
    expect(server.emissions).toEqual([]);
    expect((await storedWorkspace())?.assistedSemanticAdviceTickets ?? []).toEqual([]);

    await receiveV6Turn();
    const afterTurn = (await storedWorkspace())!;
    const ticketRead = readHopV55AssistedAdviceTicketV2(afterTurn.assistedSemanticAdviceTickets![0]);
    if (ticketRead.status !== 'readOnly' || ticketRead.ticket.format !== 'hop-v55-assisted-advice-ticket-v3') throw new Error('Ticket V3 attendu.');
    const ticket = ticketRead.ticket;
    const scope = mapBrewerHopAdviceLaunchSourceToScopeV1(OWNER, afterTurn.id, archive.source);
    expect(archive.source).toEqual({ kind: 'recipe', id: saved.recipes[0].id });
    expect(ticket.scope).toEqual(scope);
    expect(server.runtimes[0]).toEqual({ ownerKey: OWNER, workspaceId: afterTurn.id, scope });
    expect(ticket.references.sourceReadingReference).toBe(archive.contentReference);
    const linkedV4 = [...(afterTurn.documentaryAnswers ?? [])].reverse().map(raw => readHopV55DocumentaryAnswerRecord(raw))
      .find(read => read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4'
        && read.record.sourceReadingReference === archive.contentReference);
    expect(ticket.candidatePolicy).toEqual(linkedV4?.status === 'readOnly' && linkedV4.record.format === 'hop-v55-documentary-answer-record-v4'
      ? linkedV4.record.readingContext.candidatePolicy
      : { kind: 'explicit', materialIds: [], basis: 'Aucune matière choisie explicitement.' });
    expect(server.ticketDurableAtEmission).toEqual([true]);
    expect(server.emissions).toEqual([ticket.wire]);
    expect(server.emissions[0].hopAdvice).not.toHaveProperty('candidatePolicy');
    expect((server.emissions[0] as { draft?: unknown }).draft).toBeUndefined();

    // The same V6 turn: choices linked to their evidence, unknowns, what is kept.
    const choices = within(screen.getByTestId('semantic-v6-choices'));
    expect(choices.getByText(/Preuves liées : Source fixture locale #39/)).toBeInTheDocument();
    expect(screen.getByText('Ce qui reste inconnu')).toBeInTheDocument();
    expect(screen.getAllByText(/Alpha réel du houblon maison/).length).toBeGreaterThan(0);
    expect(choices.getByText(/Seront conservés/)).toBeInTheDocument();
    await previewChoice();
    // Correcting the choice invalidates the preview; confirming needs a new one.
    fireEvent.click(screen.getByRole('checkbox', { name: CHOICE }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull());
    fireEvent.click(await previewChoice());

    await screen.findByText('Choix confirmé dans la réponse documentaire', {}, SLOW);
    await screen.findByText('Relecture : reçu, plan et version documentaire concordent.', {}, SLOW);
    const afterCommit = (await storedWorkspace())!;
    expect(afterCommit.semanticAdoptionCommits).toHaveLength(1);
    const commitRead = readHopV55SemanticAdoptionCommitV1(afterCommit.semanticAdoptionCommits![0]);
    if (commitRead.status !== 'readOnly') throw new Error('Commit V6 attendu.');
    const receipt = commitRead.commit.receipt;
    expect(receipt.recipeEffect).toBe('none');
    expect(afterCommit.documentaryAnswers?.some(raw => (raw as { reference?: string }).reference === receipt.record.reference)).toBe(true);
    const receiptRegion = screen.getByRole('region', { name: 'Reçu de confirmation' });
    expect(receiptRegion.querySelector('time')?.getAttribute('datetime')).toBe(receipt.effectiveAt);
    expect(within(receiptRegion).getByText(receipt.reference)).toBeInTheDocument(); // provenance detail only

    const writesBeforeReplay = workspaceTable().writes;
    fireEvent.click(screen.getByRole('button', { name: 'Rejouer la même confirmation' }));
    await screen.findByText('Rejeu : même reçu et même instant d’effet, aucun second enregistrement.', {}, SLOW);
    expect(workspaceTable().writes).toBe(writesBeforeReplay);
    expect((await storedWorkspace())?.semanticAdoptionCommits).toHaveLength(1);

    // Close: Page history rereads and replays the exact receipt from storage.
    fireEvent.click(within(chatDialog()).getByRole('button', { name: 'Fermer' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Compagnon brasseur' })).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    const commits = within(await screen.findByTestId('semantic-adoption-history', {}, SLOW));
    fireEvent.click(commits.getByText(/Choix documentaires confirmés · 1/));
    fireEvent.click(commits.getByRole('button', { name: 'Relire ce reçu' }));
    await commits.findByText(/Relecture : reçu, plan et version documentaire concordent\./, {}, SLOW);
    fireEvent.click(commits.getByRole('button', { name: 'Rejouer la même confirmation' }));
    await commits.findByText(/Rejeu : même reçu et même instant d’effet/, {}, SLOW);
    expect(workspaceTable().writes).toBe(writesBeforeReplay);

    // Reload: the exact ticket reopens with its stored V6 record, without a new emission.
    view.unmount();
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} semanticAdviceCapability={capability} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique' }, SLOW));
    const tickets = within(await screen.findByTestId('semantic-assisted-history', {}, SLOW));
    expect(tickets.getByText(/réponse liée à cette lecture conservée/)).toBeInTheDocument();
    fireEvent.click(tickets.getByRole('button', { name: 'Rouvrir ce ticket exact' }));
    await screen.findByTestId('semantic-v6-turn', {}, SLOW);
    expect(server.emissions).toHaveLength(1);

    expect(saved.recipes).toEqual(recipesBefore);
    expect(recipeSaves.calls).toEqual([]);
    expect((await storedWorkspace())?.copies).toEqual([]);
    expect(brewerJobs.snapshot().jobs).toHaveLength(standardJobsBefore);
  }, 90000);

  it('un échec du CAS du ticket produit zéro émission', async () => {
    const { server, capability } = fixtureServer();
    await openCompanionFromV4(capability);
    workspaceTable().rejectTicketRows = true;
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await within(chatDialog()).findByRole('alert', {}, SLOW);
    expect(server.emissions).toEqual([]);
    expect(server.ticketDurableAtEmission).toEqual([]);
    expect((await storedWorkspace())?.assistedSemanticAdviceTickets ?? []).toEqual([]);
    expect((await storedWorkspace())?.assistedSemanticAdviceRecords ?? []).toEqual([]);
  }, 60000);

  it('un changement d’acteur avant l’envoi refuse le ticket et l’émission', async () => {
    const { server, capability } = fixtureServer();
    await openCompanionFromV4(capability);
    auth.user = { uid: 'principal:autre-session-39', displayName: 'Autre session' };
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await within(chatDialog()).findByRole('alert', {}, SLOW);
    expect(server.emissions).toEqual([]);
    expect((await storedWorkspace())?.assistedSemanticAdviceTickets ?? []).toEqual([]);
  }, 60000);

  it('une génération serveur changée avant l’émission garde le ticket mais n’émet rien', async () => {
    const { server, capability } = fixtureServer();
    server.generationAfterTicket = 1;
    await openCompanionFromV4(capability);
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await waitFor(async () => expect((await storedWorkspace())?.assistedSemanticAdviceTickets).toHaveLength(1), SLOW);
    await waitFor(() => expect(within(chatDialog()).queryByRole('alert')
      ?? within(chatDialog()).queryByText(/génération 1/)).not.toBeNull(), SLOW);
    expect(server.emissions).toEqual([]);
    expect((await storedWorkspace())?.assistedSemanticAdviceRecords ?? []).toEqual([]);
  }, 60000);

  it('une source modifiée après l’aperçu refuse la confirmation et invalide l’aperçu', async () => {
    const { capability } = fixtureServer();
    await openCompanionFromV4(capability);
    await receiveV6Turn();
    const confirm = await previewChoice();
    saved.recipes = saved.recipes.map(row => ({ ...row, volumeL: (row.volumeL ?? 20) + 1 }));
    fireEvent.click(confirm);
    await within(chatDialog()).findByRole('alert', {}, SLOW);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull());
    expect((await storedWorkspace())?.semanticAdoptionCommits ?? []).toEqual([]);
    expect(recipeSaves.calls).toEqual([]);
  }, 60000);

  it('sans capability explicite, l’archive V4 reste indisponible avec sa raison, sans ticket', async () => {
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} />);
    await readQuestionInPage();
    expect(await screen.findByText(UNSUPPORTED_V4, {}, SLOW)).toHaveTextContent(uiContracts.HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3.kind === 'unavailable'
      ? uiContracts.HOP_V55_SEMANTIC_ADVICE_UNAVAILABLE_V3.reason : 'unavailable');
    expect(screen.queryByRole('button', { name: LAUNCH })).toBeNull();
    expect((await storedWorkspace())?.assistedSemanticAdviceTickets ?? []).toEqual([]);
  }, 60000);

  it('les tickets et reçus futurs restent en lecture seule dans l’historique', async () => {
    const { capability } = fixtureServer();
    const workspace: HopV55Workspace = {
      format: 'hop-v55-workspace-v1', id: 'workspace:semantic-39-future', ownerKey: OWNER, revision: 1, title: 'Dossier futur #39',
      intent: { question: '', criteria: [] }, sourceRecipeId: saved.recipes[0].id, scenarioIds: [], referenceHypotheses: [], copies: [],
      updatedAt: '2026-10-05T12:00:00.000Z',
      assistedSemanticAdviceTickets: [{ format: 'hop-v55-assisted-advice-ticket-v9', operationId: 'operation:future-39' }],
      semanticAdoptionCommits: [{ format: 'hop-v55-semantic-adoption-commit-v9', id: 'command:future-39' }],
    } as HopV55Workspace;
    await workspaceTable().put({ format: 'hop-v55-workspace-envelope-v1', ownerKey: OWNER, workspaceId: workspace.id,
      revision: 1, workspace } as HopV55WorkspaceEnvelopeV1);
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} semanticAdviceCapability={capability} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Historique' }, SLOW));
    const tickets = within(await screen.findByTestId('semantic-assisted-history', {}, SLOW));
    expect(tickets.getByText('Ticket conservé · format futur')).toBeInTheDocument();
    expect(tickets.queryByRole('button', { name: 'Rouvrir ce ticket exact' })).toBeNull();
    const commits = within(screen.getByTestId('semantic-adoption-history'));
    expect(commits.getByText('Reçu conservé · format futur')).toBeInTheDocument();
    expect(commits.queryByRole('button', { name: 'Relire ce reçu' })).toBeNull();
  }, 60000);
});

describe('#88 · étape Houblons du vrai créateur · brouillon vivant', () => {
  const stores: HopV55RecipeStepStorage = {
    getHopVarieties: () => [], getHopLots: () => [], getHopKnowledge: () => [],
    getStocks: () => ({ rawMaterials: [] }), getBatches: () => [],
  };
  /** Live Wizard draft B: unsaved, incomplete (NaN sentinel, zero), same ID as the saved Recipe A. */
  function draftB(): Recipe {
    return { ...fixtureRecipe(), id: DRAFT_ID, name: 'Brouillon #39 non enregistré', hops: [], abvTarget: Number.NaN, ogTarget: 0 } as Recipe;
  }
  const Provider = uiContracts.HopV55SemanticAdviceCapabilityContext.Provider;
  function renderStep(capability: HopV55SemanticAdviceCapabilityV3, recipe: Recipe, onApply = vi.fn()) {
    const view = render(<Provider value={capability}><HopV55RecipeStep ownerKey={OWNER} recipe={recipe} storage={stores} onApply={onApply} /></Provider>);
    return { view, onApply, rerender: (next: Recipe) => view.rerender(<Provider value={capability}>
      <HopV55RecipeStep ownerKey={OWNER} recipe={next} storage={stores} onApply={onApply} /></Provider>) };
  }

  it('lit le brouillon B vivant face à la Recipe A du même ID, scelle origine/snapshot/archive puis ticket, retry, choix, aperçu, confirmation, histoire et correction sans enregistrer', async () => {
    const { server, capability } = fixtureServer({ wizard: true });
    saved.recipes = [{ ...savedRecipe(), id: DRAFT_ID, name: 'Recette enregistrée homonyme', volumeL: 999 }];
    const savedBefore = structuredClone(saved.recipes);
    const standardJobsBefore = brewerJobs.snapshot().jobs.length;
    const draft = draftB();
    const step = renderStep(capability, draft);
    const { archive: localArchive } = await readQuestionInPage();
    // The local workshop keeps its own classic reading; the creator never addresses Recipe A on the assisted lane.
    expect(localArchive.source).toEqual({ kind: 'recipe', id: DRAFT_ID });
    expect(screen.queryByText(UNSUPPORTED_V4)).toBeNull();
    expect(screen.getByRole('button', { name: 'Demander au compagnon' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: LAUNCH })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);

    // Durable origin, exact canonical snapshot of B and its Wizard V4 reading, all in the assisted dossier.
    const canonical = canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: DRAFT_ID, draft });
    const dossier = (await wizardWorkspace())!;
    expect(dossier.wizardOrigin).toEqual(createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: dossier.id, draftId: DRAFT_ID }));
    expect(dossier.sourceRecipeId).toBeUndefined();
    expect(dossier.wizardSourceSnapshots).toHaveLength(1);
    const storedSnapshot = dossier.wizardSourceSnapshots![0] as { source: { contentReference: string }; draft: Record<string, unknown> };
    expect(storedSnapshot.source.contentReference).toBe(canonical.reference);
    expect(storedSnapshot.draft).toEqual(canonical.recipe);
    expect(storedSnapshot.draft.name).toBe('Brouillon #39 non enregistré');
    expect(storedSnapshot.draft.volumeL).not.toBe(999);
    expect(storedSnapshot.draft.abvTarget).toBeNull();
    expect(storedSnapshot.draft.ogTarget).toBe(0);
    expect(Number.isNaN(draft.abvTarget)).toBe(true);
    expect(dossier.decisionReadings).toHaveLength(1);
    const wizardRead = readHopV55DecisionReadingArchiveForWizardV1(dossier.decisionReadings![0]);
    if (wizardRead.status !== 'available') throw new Error('Archive Wizard V4 attendue.');
    expect(wizardRead.archive.source).toEqual({ format: 'hop-v55-wizard-source-v1', kind: 'wizardDraft', ownerKey: OWNER,
      workspaceId: dossier.id, draftId: DRAFT_ID, contentReference: canonical.reference });
    expect(readHopV55DecisionReadingArchive(dossier.decisionReadings![0]).status).toBe('invalidRecord');
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(wizardRead.archive.source);
    expect(scope.id).not.toBe(DRAFT_ID);
    expect(server.wizardRuntimes).toEqual([{ ownerKey: OWNER, workspaceId: dossier.id, scope }]);
    expect(server.runtimes).toEqual([]);
    expect(server.wizardEmissions).toEqual([]);
    expect(dossier.assistedSemanticAdviceTickets ?? []).toEqual([]);
    const local = (await classicWorkspace())!;
    expect(local.wizardOrigin).toBeUndefined();
    expect(local.decisionReadings?.map(row => row.contentReference)).toEqual([localArchive.contentReference]);

    // Ticket durable before the provider; the failed job is retried on the same ticket and wire, never re-sent.
    server.failFirstWizardEmission = true;
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await within(chatDialog()).findByRole('button', { name: RETRY }, SLOW);
    const afterSend = (await wizardWorkspace())!;
    expect(afterSend.assistedSemanticAdviceTickets).toHaveLength(1);
    const ticketRead = readHopV55AssistedAdviceWizardTicketV1(afterSend.assistedSemanticAdviceTickets![0]);
    if (ticketRead.status !== 'readOnly') throw new Error('Ticket Wizard attendu.');
    const ticket = ticketRead.ticket;
    expect(readHopV55AssistedAdviceTicketV2(afterSend.assistedSemanticAdviceTickets![0]).status).toBe('unsupportedReadOnly');
    expect(server.wizardTicketDurableAtEmission).toEqual([true]);
    expect(server.wizardEmissions).toEqual([ticket.wire]);
    expect(ticket.scope).toEqual(scope);
    expect(ticket.wire.draft).toEqual(canonical.recipe);
    expect((ticket.wire.draft as { name?: string }).name).not.toBe('Recette enregistrée homonyme');
    expect(ticket.references.sourceReadingReference).toBe(wizardRead.archive.contentReference);
    expect(afterSend.assistedSemanticAdviceRecords ?? []).toEqual([]);
    fireEvent.click(within(chatDialog()).getByRole('button', { name: RETRY }));
    await screen.findByTestId('semantic-v6-turn', {}, SLOW);
    expect(server.wizardRetries).toEqual([ticket.wire]);
    expect(server.wizardEmissions).toHaveLength(1);
    const afterTurn = (await wizardWorkspace())!;
    expect(afterTurn.assistedSemanticAdviceRecords).toHaveLength(1);
    expect(readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: afterTurn.assistedSemanticAdviceRecords![0] }))
      .toMatchObject({ status: 'readOnly', record: { semantic: { kind: 'verifiedV6' } } });

    // Options with evidence and tradeoffs; choice and motive corrections each invalidate the preview.
    const choices = within(screen.getByTestId('semantic-v6-choices'));
    expect(choices.getByText(/Preuves liées : Source fixture locale #39/)).toBeInTheDocument();
    expect(choices.getByText(/Seront conservés/)).toBeInTheDocument();
    await previewChoice();
    fireEvent.click(screen.getByRole('checkbox', { name: CHOICE }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull());
    fireEvent.click(screen.getByRole('checkbox', { name: CHOICE }));
    expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull();
    await previewChoice('Première formulation du motif.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif de ton choix' }), { target: { value: 'Motif corrigé avant confirmation.' } });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull());
    fireEvent.click(await previewChoice('Motif corrigé avant confirmation.'));
    await screen.findByText('Choix confirmé dans la réponse documentaire', {}, SLOW);
    await screen.findByText('Relecture : reçu, plan et version documentaire concordent.', {}, SLOW);
    const afterCommit = (await wizardWorkspace())!;
    expect(afterCommit.semanticAdoptionCommits).toHaveLength(1);
    expect(afterCommit.semanticAdoptionCommits![0]).toMatchObject({ plan: { profile: 'wizardV1', reason: 'Motif corrigé avant confirmation.' } });
    const commitRead = readHopV55SemanticAdoptionCommitV1(afterCommit.semanticAdoptionCommits![0]);
    if (commitRead.status !== 'readOnly') throw new Error('Reçu Wizard attendu.');
    const receipt = commitRead.commit.receipt;
    expect(receipt.recipeEffect).toBe('none');
    const answerRaw = afterCommit.documentaryAnswers?.find(raw => (raw as { reference?: string }).reference === receipt.record.reference);
    expect(readHopV55DocumentaryAnswerRecordWithWizardV1(answerRaw)).toMatchObject({ status: 'readOnly', profile: 'wizardV1',
      record: { preparation: { source: wizardRead.archive.source } } });
    expect(afterCommit.wizardSourceSnapshots).toEqual(dossier.wizardSourceSnapshots);

    const writesBeforeReplay = workspaceTable().writes;
    fireEvent.click(screen.getByRole('button', { name: 'Rejouer la même confirmation' }));
    await screen.findByText('Rejeu : même reçu et même instant d’effet, aucun second enregistrement.', {}, SLOW);
    expect(workspaceTable().writes).toBe(writesBeforeReplay);

    // History of the assisted dossier.
    fireEvent.click(within(chatDialog()).getByRole('button', { name: 'Fermer' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Compagnon brasseur' })).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    const wizardHistory = within(await screen.findByTestId('wizard-semantic-history', {}, SLOW));
    fireEvent.click(wizardHistory.getByText(/Choix confirmés du brouillon · 1/));
    fireEvent.click(wizardHistory.getByRole('button', { name: 'Relire ce reçu' }));
    await wizardHistory.findByText(/Relecture : reçu, plan et version documentaire concordent\./, {}, SLOW);

    // Draft edited A→B (here B→C, same ID): history A stays readable and replays its exact receipt, read-only.
    const draftC: Recipe = { ...draft, name: 'Brouillon #39 corrigé', volumeL: (draft.volumeL ?? 20) + 2 };
    step.rerender(draftC);
    const writesBeforeHistory = workspaceTable().writes;
    fireEvent.click(wizardHistory.getByRole('button', { name: 'Rejouer la même confirmation' }));
    await wizardHistory.findByText(/Rejeu : même reçu et même instant d’effet/, {}, SLOW);
    expect(workspaceTable().writes).toBe(writesBeforeHistory);

    // Reopening ticket A under C shows its archived answer; a new adoption of A under C is refused before effect.
    fireEvent.click(wizardHistory.getByText(/Lectures du brouillon relues par le compagnon · 1/));
    fireEvent.click(wizardHistory.getByRole('button', { name: 'Rouvrir ce ticket exact' }));
    await screen.findByTestId('semantic-v6-turn', {}, SLOW);
    const choiceAgain = await screen.findByRole('checkbox', { name: CHOICE }, SLOW);
    if (!(choiceAgain as HTMLInputElement).checked) fireEvent.click(choiceAgain);
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif de ton choix' }), { target: { value: 'Nouvelle adoption sous le brouillon modifié.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Prévisualiser ce choix' }));
    await waitFor(() => expect(within(chatDialog()).queryByRole('alert')
      ?? screen.queryByRole('button', { name: 'Confirmer ce choix' })).not.toBeNull(), SLOW);
    const lateConfirm = screen.queryByRole('button', { name: 'Confirmer ce choix' });
    if (lateConfirm) {
      fireEvent.click(lateConfirm);
      await within(chatDialog()).findByRole('alert', {}, SLOW);
    }
    expect((await wizardWorkspace())!.semanticAdoptionCommits).toHaveLength(1);
    expect(server.wizardEmissions).toHaveLength(1);

    // A new reading of C: same dossier and origin, a second content version; archives A stay byte-identical.
    fireEvent.click(within(chatDialog()).getByRole('button', { name: 'Fermer' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Compagnon brasseur' })).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: 'Décider' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Lire ma question' }, SLOW));
    await waitFor(async () => expect((await classicWorkspace())?.decisionReadings?.length).toBe(2), SLOW);
    fireEvent.click(await screen.findByRole('button', { name: LAUNCH }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);
    const dossierAfterC = (await wizardWorkspace())!;
    expect(dossierAfterC.id).toBe(dossier.id);
    expect(dossierAfterC.wizardOrigin).toEqual(dossier.wizardOrigin);
    expect(dossierAfterC.wizardSourceSnapshots).toHaveLength(2);
    expect(dossierAfterC.wizardSourceSnapshots![0]).toEqual(dossier.wizardSourceSnapshots![0]);
    expect(dossierAfterC.decisionReadings).toHaveLength(2);
    expect(dossierAfterC.decisionReadings![0]).toEqual(dossier.decisionReadings![0]);
    const canonicalC = canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: DRAFT_ID, draft: draftC });
    const readC = readHopV55DecisionReadingArchiveForWizardV1(dossierAfterC.decisionReadings![1]);
    if (readC.status !== 'available') throw new Error('Archive Wizard C attendue.');
    expect(readC.archive.source.contentReference).toBe(canonicalC.reference);
    expect(readC.archive.source.contentReference).not.toBe(canonical.reference);
    expect(mapBrewerHopAdviceWizardSourceToScopeV1(readC.archive.source)).toEqual(scope);
    expect(server.wizardEmissions).toHaveLength(1);

    expect(saved.recipes).toEqual(savedBefore);
    expect(recipeSaves.calls).toEqual([]);
    expect(step.onApply).not.toHaveBeenCalled();
    expect(draft.name).toBe('Brouillon #39 non enregistré');
    expect(Number.isNaN(draft.abvTarget)).toBe(true);
    expect(brewerJobs.snapshot().jobs).toHaveLength(standardJobsBefore);
  }, 120000);

  it('relit le reçu exact du brouillon confirmé après fermeture réelle du créateur, sans provider ni lecteur vivant', async () => {
    const { server, capability } = fixtureServer({ wizard: true });
    saved.recipes = [{ ...savedRecipe(), id: DRAFT_ID, name: 'Recette enregistrée homonyme', volumeL: 999 }];
    const savedBefore = structuredClone(saved.recipes);
    const standardJobsBefore = brewerJobs.snapshot().jobs.length;
    const draft = draftB();
    const step = renderStep(capability, draft);
    const { archive: localArchive } = await readQuestionInPage();
    // The local workshop keeps its own classic reading; the creator never addresses Recipe A on the assisted lane.
    expect(localArchive.source).toEqual({ kind: 'recipe', id: DRAFT_ID });
    expect(screen.queryByText(UNSUPPORTED_V4)).toBeNull();
    expect(screen.getByRole('button', { name: 'Demander au compagnon' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: LAUNCH })).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);

    // Durable origin, exact canonical snapshot of B and its Wizard V4 reading, all in the assisted dossier.
    const canonical = canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: DRAFT_ID, draft });
    const dossier = (await wizardWorkspace())!;
    expect(dossier.wizardOrigin).toEqual(createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: dossier.id, draftId: DRAFT_ID }));
    expect(dossier.sourceRecipeId).toBeUndefined();
    expect(dossier.wizardSourceSnapshots).toHaveLength(1);
    const storedSnapshot = dossier.wizardSourceSnapshots![0] as { source: { contentReference: string }; draft: Record<string, unknown> };
    expect(storedSnapshot.source.contentReference).toBe(canonical.reference);
    expect(storedSnapshot.draft).toEqual(canonical.recipe);
    expect(storedSnapshot.draft.name).toBe('Brouillon #39 non enregistré');
    expect(storedSnapshot.draft.volumeL).not.toBe(999);
    expect(storedSnapshot.draft.abvTarget).toBeNull();
    expect(storedSnapshot.draft.ogTarget).toBe(0);
    expect(Number.isNaN(draft.abvTarget)).toBe(true);
    expect(dossier.decisionReadings).toHaveLength(1);
    const wizardRead = readHopV55DecisionReadingArchiveForWizardV1(dossier.decisionReadings![0]);
    if (wizardRead.status !== 'available') throw new Error('Archive Wizard V4 attendue.');
    expect(wizardRead.archive.source).toEqual({ format: 'hop-v55-wizard-source-v1', kind: 'wizardDraft', ownerKey: OWNER,
      workspaceId: dossier.id, draftId: DRAFT_ID, contentReference: canonical.reference });
    expect(readHopV55DecisionReadingArchive(dossier.decisionReadings![0]).status).toBe('invalidRecord');
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(wizardRead.archive.source);
    expect(scope.id).not.toBe(DRAFT_ID);
    expect(server.wizardRuntimes).toEqual([{ ownerKey: OWNER, workspaceId: dossier.id, scope }]);
    expect(server.runtimes).toEqual([]);
    expect(server.wizardEmissions).toEqual([]);
    expect(dossier.assistedSemanticAdviceTickets ?? []).toEqual([]);
    const local = (await classicWorkspace())!;
    expect(local.wizardOrigin).toBeUndefined();
    expect(local.decisionReadings?.map(row => row.contentReference)).toEqual([localArchive.contentReference]);

    // Ticket durable before the provider; the failed job is retried on the same ticket and wire, never re-sent.
    server.failFirstWizardEmission = true;
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await within(chatDialog()).findByRole('button', { name: RETRY }, SLOW);
    const afterSend = (await wizardWorkspace())!;
    expect(afterSend.assistedSemanticAdviceTickets).toHaveLength(1);
    const ticketRead = readHopV55AssistedAdviceWizardTicketV1(afterSend.assistedSemanticAdviceTickets![0]);
    if (ticketRead.status !== 'readOnly') throw new Error('Ticket Wizard attendu.');
    const ticket = ticketRead.ticket;
    expect(readHopV55AssistedAdviceTicketV2(afterSend.assistedSemanticAdviceTickets![0]).status).toBe('unsupportedReadOnly');
    expect(server.wizardTicketDurableAtEmission).toEqual([true]);
    expect(server.wizardEmissions).toEqual([ticket.wire]);
    expect(ticket.scope).toEqual(scope);
    expect(ticket.wire.draft).toEqual(canonical.recipe);
    expect((ticket.wire.draft as { name?: string }).name).not.toBe('Recette enregistrée homonyme');
    expect(ticket.references.sourceReadingReference).toBe(wizardRead.archive.contentReference);
    expect(afterSend.assistedSemanticAdviceRecords ?? []).toEqual([]);
    fireEvent.click(within(chatDialog()).getByRole('button', { name: RETRY }));
    await screen.findByTestId('semantic-v6-turn', {}, SLOW);
    expect(server.wizardRetries).toEqual([ticket.wire]);
    expect(server.wizardEmissions).toHaveLength(1);
    const afterTurn = (await wizardWorkspace())!;
    expect(afterTurn.assistedSemanticAdviceRecords).toHaveLength(1);
    expect(readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: afterTurn.assistedSemanticAdviceRecords![0] }))
      .toMatchObject({ status: 'readOnly', record: { semantic: { kind: 'verifiedV6' } } });

    // Options with evidence and tradeoffs; choice and motive corrections each invalidate the preview.
    const choices = within(screen.getByTestId('semantic-v6-choices'));
    expect(choices.getByText(/Preuves liées : Source fixture locale #39/)).toBeInTheDocument();
    expect(choices.getByText(/Seront conservés/)).toBeInTheDocument();
    await previewChoice();
    fireEvent.click(screen.getByRole('checkbox', { name: CHOICE }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull());
    fireEvent.click(screen.getByRole('checkbox', { name: CHOICE }));
    expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull();
    await previewChoice('Première formulation du motif.');
    fireEvent.change(screen.getByRole('textbox', { name: 'Motif de ton choix' }), { target: { value: 'Motif corrigé avant confirmation.' } });
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer ce choix' })).toBeNull());
    fireEvent.click(await previewChoice('Motif corrigé avant confirmation.'));
    await screen.findByText('Choix confirmé dans la réponse documentaire', {}, SLOW);
    await screen.findByText('Relecture : reçu, plan et version documentaire concordent.', {}, SLOW);
    const afterCommit = (await wizardWorkspace())!;
    expect(afterCommit.semanticAdoptionCommits).toHaveLength(1);
    expect(afterCommit.semanticAdoptionCommits![0]).toMatchObject({ plan: { profile: 'wizardV1', reason: 'Motif corrigé avant confirmation.' } });
    const commitRead = readHopV55SemanticAdoptionCommitV1(afterCommit.semanticAdoptionCommits![0]);
    if (commitRead.status !== 'readOnly') throw new Error('Reçu Wizard attendu.');
    const receipt = commitRead.commit.receipt;
    expect(receipt.recipeEffect).toBe('none');
    const answerRaw = afterCommit.documentaryAnswers?.find(raw => (raw as { reference?: string }).reference === receipt.record.reference);
    expect(readHopV55DocumentaryAnswerRecordWithWizardV1(answerRaw)).toMatchObject({ status: 'readOnly', profile: 'wizardV1',
      record: { preparation: { source: wizardRead.archive.source } } });
    expect(afterCommit.wizardSourceSnapshots).toEqual(dossier.wizardSourceSnapshots);

    const writesBeforeReplay = workspaceTable().writes;
    fireEvent.click(screen.getByRole('button', { name: 'Rejouer la même confirmation' }));
    await screen.findByText('Rejeu : même reçu et même instant d’effet, aucun second enregistrement.', {}, SLOW);
    expect(workspaceTable().writes).toBe(writesBeforeReplay);

    // Close the real creator, including the capability Provider and its live draft reader.
    // The stored Recipe A still shares the ID but differs from the archived Wizard B.
    const emissionsBeforeClosed = server.wizardEmissions.length;
    const retriesBeforeClosed = server.wizardRetries.length;
    const wizardRuntimesBeforeClosed = server.wizardRuntimes.length;
    const commitsBeforeClosed = structuredClone(afterCommit.semanticAdoptionCommits);
    const answersBeforeClosed = structuredClone(afterCommit.documentaryAnswers);
    const snapshotsBeforeClosed = structuredClone(afterCommit.wizardSourceSnapshots);
    const dossierBeforeClosed = structuredClone((await wizardWorkspace())!);
    step.view.unmount();
    // No capability Provider, no recipeDraftTarget and no readCurrentWizardContext.
    // Real Host/Services/Page use the same owner-partitioned memory repository.
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={() => {}} />);
    await screen.findByText('Atelier Houblons V5.5', {}, SLOW);
    const closedHistory = await screen.findByTestId('wizard-semantic-history', {}, SLOW);
    expect(closedHistory).toHaveTextContent(QUESTION);
    expect(closedHistory).toHaveTextContent('Motif corrigé avant confirmation.');
    fireEvent.click(within(closedHistory).getByRole('button', { name: 'Relire ce reçu' }));
    await screen.findByText('Relecture : reçu, plan et version documentaire concordent.', {}, SLOW);
    expect(screen.getAllByText(receipt.reference).length).toBeGreaterThan(0);
    const afterClosedHistory = (await wizardWorkspace())!;
    expect(afterClosedHistory.semanticAdoptionCommits).toEqual(commitsBeforeClosed);
    expect(afterClosedHistory.documentaryAnswers).toEqual(answersBeforeClosed);
    expect(afterClosedHistory.wizardSourceSnapshots).toEqual(snapshotsBeforeClosed);
    expect(server.wizardEmissions).toHaveLength(emissionsBeforeClosed);
    expect(server.wizardRetries).toHaveLength(retriesBeforeClosed);
    expect(saved.recipes).toEqual(savedBefore);
    expect(recipeSaves.calls).toEqual([]);
    expect(step.onApply).not.toHaveBeenCalled();

    // The archived version names the draft, never Recipe A; no send lane or live reopening exists here.
    const closed = within(closedHistory);
    expect(closedHistory).toHaveTextContent('Brouillon #39 non enregistré');
    expect(closedHistory).not.toHaveTextContent('Recette enregistrée homonyme');
    expect(closed.queryByRole('button', { name: 'Rouvrir ce ticket exact' })).toBeNull();
    expect(screen.queryByRole('button', { name: WIZARD_OPEN })).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Compagnon brasseur' })).toBeNull();
    // Reading, answer, options, unknowns, confirmed choice and motive, from the archived members only.
    fireEvent.click(closed.getByRole('button', { name: 'Relire cette réponse' }));
    const archivedAnswer = within(await screen.findByTestId('wizard-archived-answer', {}, SLOW));
    expect(archivedAnswer.getByText(/Ce n’est ni l’état actuel du créateur, ni la recette enregistrée du même identifiant/)).toBeInTheDocument();
    expect(archivedAnswer.getByText(/Brouillon #39 non enregistré/)).toBeInTheDocument();
    expect(archivedAnswer.getByText('Documenter la piste')).toBeInTheDocument();
    expect(archivedAnswer.getByText(/Preuves liées : Source fixture locale #39/)).toBeInTheDocument();
    expect(archivedAnswer.getAllByText(/Alpha réel du houblon maison/).length).toBeGreaterThan(0);
    expect(archivedAnswer.getByText(/motif : Motif corrigé avant confirmation\./)).toBeInTheDocument();
    expect(archivedAnswer.getAllByText(canonical.reference).length).toBeGreaterThan(0);
    expect(archivedAnswer.queryByRole('checkbox')).toBeNull();
    expect(archivedAnswer.queryByRole('button', { name: 'Prévisualiser ce choix' })).toBeNull();
    // Replay returns only the original receipt: no second CAS, effect or re-anchoring.
    fireEvent.click(closed.getByRole('button', { name: 'Rejouer la même confirmation' }));
    await closed.findByText(/Rejeu : même reçu et même instant d’effet/, {}, SLOW);
    expect((await wizardWorkspace())!).toEqual(dossierBeforeClosed);
    expect(server.wizardRuntimes).toHaveLength(wizardRuntimesBeforeClosed);
    expect(server.runtimes).toEqual([]);
    expect(server.wizardEmissions).toHaveLength(emissionsBeforeClosed);
    expect(brewerJobs.snapshot().jobs).toHaveLength(standardJobsBefore);
    // Another actor is refused by the host's authority check; a UI flag never opens the archive.
    fireEvent.click(archivedAnswer.getByRole('button', { name: 'Fermer cette relecture' }));
    await waitFor(() => expect(screen.queryByTestId('wizard-archived-answer')).toBeNull());
    const alertsBeforeActorChange = screen.queryAllByRole('alert').length;
    auth.user = { uid: 'principal:autre-session-39', displayName: 'Autre session' };
    fireEvent.click(closed.getByRole('button', { name: 'Relire cette réponse' }));
    await waitFor(() => expect(screen.queryAllByRole('alert').length).toBeGreaterThan(alertsBeforeActorChange), SLOW);
    expect(screen.queryByTestId('wizard-archived-answer')).toBeNull();
    expect((await wizardWorkspace())!).toEqual(dossierBeforeClosed);
  }, 120000);

  /** Real creator up to one confirmed Wizard V4 answer: durable ticket, retried turn, preview and confirmation. */
  async function confirmWizardAnswerInCreator(fixture: ReturnType<typeof fixtureServer>, draft: Recipe) {
    const step = renderStep(fixture.capability, draft);
    await readQuestionInPage();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);
    fixture.server.failFirstWizardEmission = true;
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    fireEvent.click(await within(chatDialog()).findByRole('button', { name: RETRY }, SLOW));
    await screen.findByTestId('semantic-v6-turn', {}, SLOW);
    fireEvent.click(await previewChoice('Motif de l’adoption à corriger ensuite.'));
    await screen.findByText('Choix confirmé dans la réponse documentaire', {}, SLOW);
    await screen.findByText('Relecture : reçu, plan et version documentaire concordent.', {}, SLOW);
    const dossier = (await wizardWorkspace())!;
    const commitRead = readHopV55SemanticAdoptionCommitV1(dossier.semanticAdoptionCommits![0]);
    if (commitRead.status !== 'readOnly') throw new Error('Reçu Wizard attendu.');
    const answerRead = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(dossier.documentaryAnswers?.find(raw =>
      (raw as { reference?: string }).reference === commitRead.commit.receipt.record.reference));
    if (answerRead.status !== 'readOnly') throw new Error('Réponse V4 Wizard attendue.');
    return { step, answer: answerRead.record };
  }

  it('retrouve et corrige la réponse V4 du brouillon fermé sous son origine Wizard, face à une Recipe A de même ID et même contenu', async () => {
    const fixture = fixtureServer({ wizard: true });
    const draft = draftB();
    // Recipe A: same ID and same canonical content as draft B, yet a distinct saved identity.
    const recipeA = { ...structuredClone(draft), abvTarget: null } as unknown as Recipe;
    expect(canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: DRAFT_ID, draft: recipeA }).reference)
      .toBe(canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: DRAFT_ID, draft }).reference);
    saved.recipes = [recipeA];
    const savedBefore = structuredClone(saved.recipes);
    const standardJobsBefore = brewerJobs.snapshot().jobs.length;
    const { step, answer } = await confirmWizardAnswerInCreator(fixture, draft);
    step.view.unmount();
    const classicBefore = structuredClone(await classicWorkspace());
    const dossierBefore = structuredClone((await wizardWorkspace())!);
    const emissions = fixture.server.wizardEmissions.length;
    const retries = fixture.server.wizardRetries.length;
    const wizardRuntimes = fixture.server.wizardRuntimes.length;
    const builder = vi.spyOn(propertyAdvice, 'buildHopPropertyAdviceV3');

    // Real Host without capability Provider, recipeDraftTarget or live draft reader.
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} />);
    const history = await screen.findByTestId('wizard-semantic-history', {}, SLOW);
    const closed = within(history);
    expect(history).toHaveTextContent(`Réponses documentaires du brouillon · ${(dossierBefore.documentaryAnswers ?? []).length}`);
    expect(history).toHaveTextContent(answer.reference);
    expect(history).toHaveTextContent(answer.preparation.source.contentReference);
    expect(history).toHaveTextContent('version la plus récente');

    // Simple re-reading: no session, send, generation or write.
    fireEvent.click(closed.getByRole('button', { name: 'Relire cette réponse' }));
    await screen.findByTestId('wizard-archived-answer', {}, SLOW);
    await waitFor(() => expect(closed.getByRole('button', { name: 'Corriger cette réponse' })).toBeEnabled(), SLOW);
    fireEvent.click(closed.getByRole('button', { name: 'Corriger cette réponse' }));
    const panel = within(await screen.findByTestId('wizard-answer-correction'));
    expect((await wizardWorkspace())!).toEqual(dossierBefore);
    expect(builder).not.toHaveBeenCalled();
    expect(fixture.server.wizardEmissions).toHaveLength(emissions);
    expect(fixture.server.wizardRuntimes).toHaveLength(wizardRuntimes);

    // Explicit correction: old and new states, source, scope and motive are shown before any write.
    const term = uniqueActiveTerm(answer);
    const motive = 'Ce terme ne décrit pas ce brouillon; correction explicite.';
    fireEvent.click(panel.getByRole('checkbox', { name: `Écarter « ${term.label} »` }));
    fireEvent.change(panel.getByRole('textbox', { name: 'Motif de la correction' }), { target: { value: motive } });
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    const preview = await screen.findByTestId('wizard-answer-correction-preview', {}, SLOW);
    expect(preview).toHaveTextContent('Version actuelle');
    expect(preview).toHaveTextContent('Version corrigée');
    expect(preview).toHaveTextContent('1 modification');
    expect(preview).toHaveTextContent(`${term.label}retenuécarté · modifié`);
    expect(preview).toHaveTextContent(answer.reference);
    expect(preview).toHaveTextContent(answer.preparation.source.contentReference);
    expect(preview).toHaveTextContent(motive);
    // Aligned comparison table: distinct column headers, one row header per term, exact states kept as text.
    const table = within(preview).getByRole('table', { name: /Termes avant et après/ });
    expect(within(table).getAllByRole('columnheader').map(cell => cell.textContent))
      .toEqual(['Terme', 'Version actuelle', 'Version corrigée']);
    const changedRow = within(table).getByRole('rowheader', { name: term.label }).closest('tr')!;
    expect(within(changedRow).getAllByRole('cell').map(cell => cell.textContent)).toEqual(['retenu', 'écarté · modifié']);
    // Readable source and scope: the Wizard draft version in words, no raw draft ID, hash or operation on these lines.
    const summary = (label: string) => within(preview).getByText(label, { selector: 'dt' }).nextElementSibling as HTMLElement;
    const ticketRead = readHopV55AssistedAdviceWizardTicketV1(dossierBefore.assistedSemanticAdviceTickets![0]);
    if (ticketRead.status !== 'readOnly') throw new Error('Ticket Wizard attendu.');
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(answer.preparation.source);
    expect(summary('Source')).toHaveTextContent(
      /^Brouillon du créateur de recette · version « Brouillon #39 non enregistré » lue le .+\. La recette enregistrée du même identifiant n’en est pas la source\.$/);
    expect(summary('Portée')).toHaveTextContent('Conversation assistée propre à ce brouillon · aucune matière choisie');
    for (const raw of [DRAFT_ID, answer.preparation.source.contentReference, scope.id, ticketRead.ticket.operationId]) {
      expect(summary('Source')).not.toHaveTextContent(raw);
      expect(summary('Portée')).not.toHaveTextContent(raw);
    }
    // Complete traceability stays reachable, untruncated, under « Identités exactes ».
    const identities = within(preview).getByText('Identités exactes').closest('details')!;
    for (const exact of [DRAFT_ID, answer.preparation.source.contentReference, answer.sourceReadingReference,
      ticketRead.ticket.operationId, `génération ${ticketRead.ticket.generation}`, scope.kind, scope.id,
      answer.id, answer.reference, answer.ledger.reference, dossierBefore.id]) {
      expect(identities).toHaveTextContent(exact);
    }
    expect((await wizardWorkspace())!).toEqual(dossierBefore);
    expect(fixture.server.wizardEmissions).toHaveLength(emissions);

    fireEvent.click(within(preview).getByRole('button', { name: 'Enregistrer cette correction' }));
    await screen.findByText(/Correction enregistrée comme nouvelle version/, {}, SLOW);
    const corrected = (await wizardWorkspace())!;
    expect(corrected.id).toBe(dossierBefore.id);
    expect(corrected.wizardOrigin).toEqual(dossierBefore.wizardOrigin);
    expect(corrected.documentaryAnswers).toHaveLength((dossierBefore.documentaryAnswers ?? []).length + 1);
    expect(corrected.documentaryAnswers!.slice(0, -1)).toEqual(dossierBefore.documentaryAnswers);
    const revisionRead = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(corrected.documentaryAnswers!.at(-1));
    if (revisionRead.status !== 'readOnly') throw new Error('Révision V4 Wizard attendue.');
    const revision = revisionRead.record;
    expect(revision.transition).toMatchObject({ kind: 'revise', parentRecordReference: answer.reference,
      parentReadingReference: answer.sourceReadingReference, reason: motive, actor: { origin: 'user' } });
    expect(revision.id).not.toBe(answer.id);
    expect(revision.sourceReadingReference).toBe(answer.sourceReadingReference);
    expect(revision.preparation.source).toEqual(answer.preparation.source);
    expect(revision.preparation.source).toMatchObject({ kind: 'wizardDraft', draftId: DRAFT_ID, workspaceId: dossierBefore.id });
    expect([...revision.ledger.entries].reverse().find(entry => entry.annotationId === term.id))
      .toMatchObject({ disposition: 'rejected', decision: { kind: 'reject', reason: motive } });
    expect(readHopV55DocumentaryAnswerRecord(revision).status).toBe('unsupportedReadOnly');
    expect(corrected.semanticAdoptionCommits).toEqual(dossierBefore.semanticAdoptionCommits);
    expect(corrected.wizardSourceSnapshots).toEqual(dossierBefore.wizardSourceSnapshots);
    expect(corrected.decisionReadings).toEqual(dossierBefore.decisionReadings);
    expect(corrected.assistedSemanticAdviceTickets).toEqual(dossierBefore.assistedSemanticAdviceTickets);
    expect(corrected.assistedSemanticAdviceRecords).toEqual(dossierBefore.assistedSemanticAdviceRecords);

    // Both versions stay in the closed history; only the new head offers a correction.
    await waitFor(() => expect(history).toHaveTextContent(revision.reference), SLOW);
    expect(history).toHaveTextContent(answer.reference);
    expect(history).toHaveTextContent(`Correction · ${QUESTION}`);
    expect(history).toHaveTextContent(`motif : ${motive}`);
    expect(screen.queryByTestId('wizard-answer-correction')).toBeNull();
    expect(closed.getAllByRole('button', { name: 'Corriger cette réponse' })).toHaveLength(1);

    // Recipe A is neither source, display nor target of the Wizard answer; no Recipe is written.
    expect(saved.recipes).toEqual(savedBefore);
    expect(recipeSaves.calls).toEqual([]);
    expect(await classicWorkspace()).toEqual(classicBefore);
    fireEvent.click(screen.getByRole('button', { name: 'Historique' }));
    const classicHistory = screen.getByRole('heading', { name: /Dossiers et prévisions/ }).closest('section')!;
    expect(classicHistory).not.toHaveTextContent(answer.reference);
    expect(classicHistory).not.toHaveTextContent(revision.reference);

    // No provider session or emission for re-reading, preview or correction.
    expect(fixture.server.wizardEmissions).toHaveLength(emissions);
    expect(fixture.server.wizardRetries).toHaveLength(retries);
    expect(fixture.server.wizardRuntimes).toHaveLength(wizardRuntimes);
    expect(fixture.server.runtimes).toEqual([]);
    expect(brewerJobs.snapshot().jobs).toHaveLength(standardJobsBefore);
    expect(builder).toHaveBeenCalled();

    // Without the local history reader, the same versions stay listed read-only: no re-reading or correction.
    cleanup();
    render(<HopV55Page services={createHopV55Services({ ownerKey: OWNER,
      context: async () => hostLikeContext(recipeA, 'Lecteur d’historique absent.') })} />);
    const readOnly = within(await screen.findByTestId('wizard-semantic-history', {}, SLOW));
    expect(readOnly.getByText(/attend l’ouverture du dossier local/)).toBeInTheDocument();
    expect(readOnly.getAllByText(/Réponses documentaires du brouillon/).length).toBeGreaterThan(0);
    expect(readOnly.queryByRole('button', { name: 'Corriger cette réponse' })).toBeNull();
    expect(readOnly.queryByRole('button', { name: 'Relire cette réponse' })).toBeNull();
    expect((await wizardWorkspace())!).toEqual(corrected);
  }, 120000);

  it('refuse la correction avant écriture si l’acteur change ou si une version plus récente non reconnue apparaît, sans perdre l’historique', async () => {
    const fixture = fixtureServer({ wizard: true });
    saved.recipes = [{ ...savedRecipe(), id: DRAFT_ID, name: 'Recette enregistrée homonyme', volumeL: 999 }];
    const savedBefore = structuredClone(saved.recipes);
    const { step, answer } = await confirmWizardAnswerInCreator(fixture, draftB());
    step.view.unmount();
    const emissions = fixture.server.wizardEmissions.length;
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} />);
    const history = await screen.findByTestId('wizard-semantic-history', {}, SLOW);
    const closed = within(history);
    const before = structuredClone((await wizardWorkspace())!);
    const writesBefore = workspaceTable().writes;
    const term = uniqueActiveTerm(answer);
    fireEvent.click(await closed.findByRole('button', { name: 'Corriger cette réponse' }, SLOW));
    const panel = within(await screen.findByTestId('wizard-answer-correction'));
    fireEvent.click(panel.getByRole('checkbox', { name: `Écarter « ${term.label} »` }));
    fireEvent.change(panel.getByRole('textbox', { name: 'Motif de la correction' }), { target: { value: 'Motif refusé avant écriture.' } });
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    const first = within(await screen.findByTestId('wizard-answer-correction-preview', {}, SLOW));

    // Another actor between preview and save: refused by the strict reread, before any CAS; the reason stays visible.
    auth.user = { uid: 'principal:autre-session-39', displayName: 'Autre session' };
    fireEvent.click(first.getByRole('button', { name: 'Enregistrer cette correction' }));
    expect(await panel.findByRole('alert', {}, SLOW)).toHaveTextContent(/Rien n’est enregistré/);
    expect(screen.queryByTestId('wizard-answer-correction-preview')).toBeNull();
    expect((await wizardWorkspace())!).toEqual(before);
    expect(workspaceTable().writes).toBe(writesBefore);

    // A newer head of unrecognized format appears after the preview: it stays raw and blocks the commit.
    auth.user = { uid: OWNER, displayName: 'Brasseur fixture #39' };
    fireEvent.click(panel.getByRole('button', { name: 'Prévisualiser la correction' }));
    const second = within(await screen.findByTestId('wizard-answer-correction-preview', {}, SLOW));
    const envelope = workspaceTable().rows.get(JSON.stringify([OWNER, before.id]))!;
    const futureRow = { format: 'hop-v55-documentary-answer-record-v9', id: 'answer:wizard-future-39',
      sourceReadingReference: answer.sourceReadingReference, reference: 'reference:wizard-future-39' };
    await workspaceTable().put({ ...envelope, workspace: { ...envelope.workspace,
      documentaryAnswers: [...(envelope.workspace.documentaryAnswers ?? []), futureRow] as unknown as HopV55Workspace['documentaryAnswers'] } });
    const withFuture = structuredClone((await wizardWorkspace())!);
    expect(withFuture.documentaryAnswers).toHaveLength((before.documentaryAnswers ?? []).length + 1);
    const writesWithFuture = workspaceTable().writes;
    fireEvent.click(second.getByRole('button', { name: 'Enregistrer cette correction' }));
    expect(await panel.findByRole('alert', {}, SLOW)).toHaveTextContent(/format non reconnu/);
    expect((await wizardWorkspace())!).toEqual(withFuture);
    expect(workspaceTable().writes).toBe(writesWithFuture);

    // The future row is listed raw and read-only; earlier versions stay intact and no correction is offered.
    expect(await closed.findByText(/^Réponse documentaire conservée · (format futur|contenu non validé)$/, {}, SLOW)).toBeInTheDocument();
    expect(closed.queryByRole('button', { name: 'Corriger cette réponse' })).toBeNull();
    expect(history).toHaveTextContent(answer.reference);
    expect(withFuture.documentaryAnswers!.slice(0, -1)).toEqual(before.documentaryAnswers);
    expect(withFuture.semanticAdoptionCommits).toEqual(before.semanticAdoptionCommits);
    expect(saved.recipes).toEqual(savedBefore);
    expect(recipeSaves.calls).toEqual([]);
    expect(fixture.server.wizardEmissions).toHaveLength(emissions);
  }, 120000);

  it('un dossier assisté aux membres futurs reste listé brut dans l’atelier ordinaire, sans relecture ni rejeu', async () => {
    const id = 'workspace:semantic-39-wizard-future';
    const workspace = {
      format: 'hop-v55-workspace-v1', id, ownerKey: OWNER, revision: 1, title: 'Lecture assistée · brouillon futur #39',
      intent: { question: '', criteria: [] }, wizardOrigin: createHopV55WizardWorkspaceOriginV1({ ownerKey: OWNER, workspaceId: id, draftId: DRAFT_ID }),
      wizardSourceSnapshots: [], decisionReadings: [], scenarioIds: [], referenceHypotheses: [], copies: [],
      updatedAt: '2026-10-05T12:00:00.000Z',
      assistedSemanticAdviceTickets: [{ format: 'hop-v55-assisted-advice-ticket-v9', operationId: 'operation:wizard-future-39' }],
      semanticAdoptionCommits: [{ format: 'hop-v55-semantic-adoption-commit-v9', id: 'command:wizard-future-39' }],
    } as unknown as HopV55Workspace;
    await workspaceTable().put({ format: 'hop-v55-workspace-envelope-v1', ownerKey: OWNER, workspaceId: id,
      revision: 1, workspace } as HopV55WorkspaceEnvelopeV1);
    render(<HopV55Host ownerKey={OWNER} recipe={saved.recipes[0]} onClose={vi.fn()} />);
    const history = within(await screen.findByTestId('wizard-semantic-history', {}, SLOW));
    // The Wizard ticket reader classifies the unknown row; either way it stays raw and without action.
    expect(history.getByText(/^Ticket conservé · (format futur|contenu non validé)$/)).toBeInTheDocument();
    expect(history.getByText('Reçu conservé · format futur')).toBeInTheDocument();
    for (const name of ['Rouvrir ce ticket exact', 'Relire cette réponse', 'Relire ce reçu', 'Rejouer la même confirmation']) {
      expect(history.queryByRole('button', { name })).toBeNull();
    }
    const stored = await workspaceRepository().read(OWNER, id);
    expect(stored?.assistedSemanticAdviceTickets).toEqual(workspace.assistedSemanticAdviceTickets);
    expect(stored?.semanticAdoptionCommits).toEqual(workspace.semanticAdoptionCommits);
    expect(recipeSaves.calls).toEqual([]);
  }, 60000);

  it('un acteur changé avant l’envoi refuse ticket et émission Wizard', async () => {
    const { server, capability } = fixtureServer({ wizard: true });
    renderStep(capability, draftB());
    await readQuestionInPage();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);
    auth.user = { uid: 'principal:autre-session-39', displayName: 'Autre session' };
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await within(chatDialog()).findByRole('alert', {}, SLOW);
    expect(server.wizardEmissions).toEqual([]);
    expect((await wizardWorkspace())?.assistedSemanticAdviceTickets ?? []).toEqual([]);
  }, 60000);

  it('un brouillon modifié pendant la session refuse le ticket avant tout effet', async () => {
    const { server, capability } = fixtureServer({ wizard: true });
    const draft = draftB();
    const step = renderStep(capability, draft);
    await readQuestionInPage();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);
    step.rerender({ ...draft, volumeL: (draft.volumeL ?? 20) + 1 });
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await within(chatDialog()).findByRole('alert', {}, SLOW);
    expect(server.wizardEmissions).toEqual([]);
    expect((await wizardWorkspace())?.assistedSemanticAdviceTickets ?? []).toEqual([]);
  }, 60000);

  it('une génération serveur changée garde le ticket Wizard mais n’émet rien', async () => {
    const { server, capability } = fixtureServer({ wizard: true });
    server.wizardGenerationAfterTicket = 1;
    renderStep(capability, draftB());
    await readQuestionInPage();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByRole('button', { name: SEND }, SLOW);
    fireEvent.click(screen.getByRole('button', { name: SEND }));
    await waitFor(async () => expect((await wizardWorkspace())?.assistedSemanticAdviceTickets).toHaveLength(1), SLOW);
    expect((await within(chatDialog()).findAllByText(/génération courante est 1/, {}, SLOW)).length).toBeGreaterThan(0);
    expect(within(chatDialog()).getByRole('button', { name: RETRY })).toBeInTheDocument();
    expect(server.wizardEmissions).toEqual([]);
    expect((await wizardWorkspace())?.assistedSemanticAdviceRecords ?? []).toEqual([]);
  }, 60000);

  it('sans fabrique Wizard déclarée, le créateur garde sa raison, le compagnon habituel et aucun dossier assisté', async () => {
    const { server, capability } = fixtureServer();
    saved.recipes = [{ ...savedRecipe(), id: DRAFT_ID, name: 'Recette enregistrée homonyme', volumeL: 999 }];
    const step = renderStep(capability, draftB());
    await readQuestionInPage();
    expect(await screen.findByText(/ne relit pas encore un brouillon non enregistré/, {}, SLOW)).toBeVisible();
    expect(screen.queryByRole('button', { name: WIZARD_OPEN })).toBeNull();
    expect(screen.queryByRole('button', { name: LAUNCH })).toBeNull();
    expect(screen.getByRole('button', { name: 'Demander au compagnon' })).toBeInTheDocument();
    expect(server.runtimes).toEqual([]);
    expect(server.wizardRuntimes).toEqual([]);
    expect(await wizardWorkspace()).toBeUndefined();
    expect(step.onApply).not.toHaveBeenCalled();
    expect(recipeSaves.calls).toEqual([]);
  }, 60000);

  it('la Page n’ouvre jamais la voie classique pour un brouillon; le dossier assisté s’ouvre sur geste explicite', async () => {
    const draft: Recipe = { ...fixtureRecipe(), id: DRAFT_ID, name: 'Brouillon #39 non enregistré', hops: [] };
    const services = createHopV55Services({ ownerKey: OWNER, context: async () => hostLikeContext(draft, 'Brouillon vivant du créateur.') });
    const host: HopV55SemanticAdoptionApplicationHostV1 = { openSession: vi.fn(), resumeSession: vi.fn(),
      openWizardSession: vi.fn(async () => ({ status: 'unavailable' as const, reason: 'Fixture : lecture vivante du brouillon absente.' })),
      resumeWizardSession: vi.fn() };
    const openSemantic = vi.fn();
    render(<HopV55Page services={services} semanticAdoptionHost={host} onOpenSemanticCompanion={openSemantic}
      recipeDraftTarget={{ ownerKey: OWNER, draftId: DRAFT_ID, onCorrectContext: vi.fn(), apply: vi.fn() }} />);
    await readQuestionInPage();
    expect(await wizardWorkspace()).toBeUndefined();
    fireEvent.click(await screen.findByRole('button', { name: WIZARD_OPEN }, SLOW));
    await screen.findByText(/Fixture : lecture vivante du brouillon absente/, {}, SLOW);
    expect(host.openSession).not.toHaveBeenCalled();
    expect(openSemantic).not.toHaveBeenCalled();
    expect(host.openWizardSession).toHaveBeenCalledTimes(1);
    const dossier = (await wizardWorkspace())!;
    const call = vi.mocked(host.openWizardSession).mock.calls[0][0];
    expect(call.workspaceId).toBe(dossier.id);
    expect(call.scopeAtPageLaunch.kind).toBe('draft');
    expect(call.scopeAtPageLaunch.id).not.toBe(DRAFT_ID);
    expect(call.candidatePolicy).toEqual({ kind: 'explicit', materialIds: [], basis: 'Aucune matière choisie explicitement.' });
  }, 60000);

  it('la fabrique Wizard explicite consomme l’adaptateur API reçu, distingue le fournisseur et n’appelle aucun réseau', () => {
    const calls: string[] = [];
    const transport = { currentUserKey: async () => OWNER,
      invoke: async (name: string) => { calls.push(name); throw new Error('Aucun appel attendu dans ce contrôle.'); } };
    const factory = createHopV55SemanticWizardRuntimeFactoryFromApiV1({ providerKind: 'fixture',
      apiForOwner: ownerKey => createBrewerHopAdviceApiForWizardV1({ ownerKey, transport }) });
    const scope = { kind: 'draft' as const, id: 'hop-v55-wizard-fixture-39' };
    const runtime = factory({ ownerKey: OWNER, workspaceId: 'workspace:wizard-factory-39', scope, providerKind: 'fixture' });
    expect(runtime).toMatchObject({ format: 'hop-v55-semantic-companion-runtime-wizard-v1', protocol: 'hopAdviceWizardRequest3V1',
      providerKind: 'fixture', storeNamespace: hopAdviceWizardClientPartitionKey(OWNER, 'workspace:wizard-factory-39', scope) });
    expect(runtime.jobs.kind).toBe('hopAdviceWizardRequest3V1');
    expect(() => factory({ ownerKey: OWNER, workspaceId: 'workspace:wizard-factory-39', scope, providerKind: 'authorizedRequest3' })).toThrow();
    expect(() => factory({ ownerKey: OWNER, workspaceId: 'workspace:wizard-factory-39', scope: { kind: 'recipe', id: DRAFT_ID },
      providerKind: 'fixture' })).toThrow();
    expect(calls).toEqual([]);
    expect(uiContracts.qualifyHopV55SemanticAdviceCapabilityV3({ kind: 'fixture',
      createRuntimeForScope: undefined as unknown as uiContracts.HopV55SemanticRuntimeFactoryV3 }).kind).toBe('unavailable');
  });
});
