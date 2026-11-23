import { afterEach, describe, expect, it, vi } from 'vitest';
import type { BrewerContext } from '../../functions/src/companionTypes';
import * as propertyAdviceDomain from '../../src/domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceIntentV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { hopV55ScenarioRuntimeReference } from '../../src/services/hopV55/scenarioCommit';
import { readHopV55QuestionWithScopesV1, createHopV55QuestionScopeLedgerV1 } from '../../src/services/hopV55/questionScopeReading';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import * as decisionService from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV3, type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource } from '../../src/services/hopV55/decisionArchive';
import { createHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import { createHopV55PropertyAdviceAnswerRecordV4, readHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4 } from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { createHopV55PropertyAdviceControllerV4, type HopV55PropertyAdviceHostV4,
  type HopV55PropertyAdviceLedgerActionV4, type HopV55PropertyAdviceV4ConfirmationCommand,
  type HopV55PropertyAdviceV4Pending } from '../../src/services/hopV55/propertyAdviceControllerV4';
import { HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  type HopV55PropertyAdviceReexaminationBindingChoiceV1 } from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { ensureHopV55ReferenceJournal, adoptHopV55ReferenceHypothesis, getHopV55ReferenceHypotheses,
  getHopV55ReferenceProjection } from '../../src/services/hopV55/referenceWorkspace';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { readHopV55PropertyAdviceReexaminationCommandReceipt,
  readHopV55PropertyAdviceReexaminationCommandStaging } from '../../src/services/hopV55/propertyAdviceReexaminationCommand';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { hopV55Workspace } from '../fixtures/hopV55';

const ownerKey = 'fixture:property-advice-reconciliation-controller-v4';
const workspaceId = 'workspace:property-advice-reconciliation-controller-v4';
const recordedAt = '2026-10-03T19:00:00.000Z';
const question = 'Ma bière est trop sucrée, comment compenser ça avec mon houblon ? Quand avec ma levure utiliser les houblons et lesquels ? La mesure pH est 4,15.';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière cible n’est présélectionnée dans cette fixture.' };
const syntheticReason = 'Mesure pH synthétique de fixture; distincte d’une mesure de bière réelle.';

type Row = HopV55WorkspaceEnvelopeV1;

class MemoryTable implements HopV55WorkspaceTable<Row> {
  rows = new Map<string, Row>();
  private key(value: unknown): string {
    return JSON.stringify(Array.isArray(value) ? value : [
      (value as Row).ownerKey, (value as Row).workspaceId,
    ]);
  }
  async get(key: unknown) {
    const row = this.rows.get(this.key(key));
    return row && structuredClone(row);
  }
  async add(row: Row) {
    const key = this.key(row);
    if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: Row) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) {
    return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
      .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) };
  }
}

class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  private tail: Promise<void> = Promise.resolve();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const operation = this.tail.then(async () => {
      const before = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
      try { return await work(); }
      catch (error) { this.workspaces.rows = before; throw error; }
    });
    this.tail = operation.then(() => undefined, () => undefined);
    return operation;
  }
  close() { /* DAO mémoire, sans effet externe. */ }
}

type SaveMode = 'normal' | 'staleOnce' | 'staleCas2Once' | 'commitThenLoseFirstReply';

interface FixtureJourney {
  context: BrewerContext;
  prepared: PreparedBrewingScenarioContext;
  archive: HopV55DecisionReadingArchive;
  sourceRecord: ReturnType<typeof createHopV55PropertyAdviceAnswerRecordV3>;
  workspace: HopV55Workspace;
  measurementIntent: HopPropertyAdviceIntentV3;
}

function contextWithMeasurement(value: number): BrewerContext {
  const context = makeHopV55FixtureContext('planning');
  context.journal = { readings: [{ kind: 'pH', value, unit: 'pH', at: Date.parse(recordedAt) }] };
  return context;
}

function questionSpan(text: string) {
  const start = question.indexOf(text);
  if (start < 0 || question.indexOf(text, start + text.length) >= 0) throw new Error('Fragment de mesure absent ou ambigu.');
  return { start, end: start + text.length, text };
}

function baseJourney(options: { value?: number; withNr?: boolean } = {}): FixtureJourney {
  const context = contextWithMeasurement(options.value ?? 4.15);
  const prepared = prepareBrewingScenarioContext(context);
  const acidityFact = prepared.runtime.current?.beerContext?.facts.find(row => row.id === 'reading-0');
  if (!acidityFact || acidityFact.status !== 'observed' || acidityFact.value !== (options.value ?? 4.15)) {
    throw Error('La fixture doit charger son fait pH exact dans le contexte courant.');
  }
  const parsed = readHopV55QuestionWithScopesV1(question, prepared);
  if (!parsed.reading.response || parsed.scopeDrafts.length !== 2) {
    throw Error('La fixture exige une lecture typée et ses portées documentaires.');
  }
  const source = context.recipe?.id ? { kind: 'recipe' as const, id: context.recipe.id } : { kind: 'exploration' as const };
  const runtimeReference = hopV55ScenarioRuntimeReference(prepared.runtime);
  const transition = { actId: 'reading:create:reconciliation-controller-v4', kind: 'create' as const,
    reason: 'Lecture source synthétique de la contre-épreuve.', recordedAt,
    actor: { origin: 'proposal' as const, label: 'Lecteur fixture' } };
  const scopeLedger = createHopV55QuestionScopeLedgerV1({ question, reading: parsed.reading,
    scopeDrafts: parsed.scopeDrafts, transition });
  const archive = createHopV55DecisionReadingArchiveV3({ id: 'reading:reconciliation-controller-v4-source',
    ownerKey, workspaceId, recordedAt, reading: parsed.reading, source, runtimeReference, scopeLedger, transition });
  const baseDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: parsed.reading, prepared,
    requestId: 'request:reconciliation-controller-v4-source', ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, candidatePolicy });
  const span = questionSpan('pH est 4,15');
  const measurementIntent: HopPropertyAdviceIntentV3 = {
    id: 'intent:measurement-ph-controller-v4', property: 'acidity', label: span.text,
    role: 'measurement', direction: null, qualification: null, required: true,
    comparisonBasis: { kind: 'current', assertionIds: ['context-reading-0'] }, metric: 'pH',
    subject: { kind: 'beer', label: 'Bière synthétique de fixture', materialId: null, sensoryContext: 'beer' },
    sourceSpans: [span], interpretationOrigin: 'user', basis: syntheticReason, relatedIntentIds: [],
  };
  const draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: parsed.reading, prepared,
    requestId: 'request:reconciliation-controller-v4-source', ownerKey, workspaceId,
    sourceReadingReference: archive.contentReference, candidatePolicy,
    propertyIntents: [...baseDraft.requestSnapshot.propertyIntents, measurementIntent] });
  const answerSnapshot = propertyAdviceDomain.buildHopPropertyAdviceV3(draft.requestSnapshot);
  const sourceRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot,
    answerRecordId: 'answer:reconciliation-controller-v4-source' });
  const workspace: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'V4 · réconciliation synthétique', intent: structuredClone(archive.reading.intent),
    ...(context.recipe?.id ? { sourceRecipeId: context.recipe.id } : {}),
    scenarioIds: [], referenceHypotheses: [], copies: [],
    decisionReadings: [archive], documentaryAnswers: [sourceRecord], updatedAt: recordedAt,
  };
  if (options.withNr) {
    const seed = hopV55Workspace(ownerKey, workspaceId).referenceHypotheses[0];
    if (!seed) throw Error('Hypothèse NR de fixture attendue.');
    workspace.referenceHypotheses = [structuredClone(seed)];
    Object.assign(workspace, ensureHopV55ReferenceJournal(workspace, context, prepared));
    if (!getHopV55ReferenceProjection(workspace)?.currentReference) throw Error('La référence NR A de fixture doit être adoptée.');
  }
  return { context, prepared, archive, sourceRecord, workspace, measurementIntent };
}

function activeIntent(record: HopV55PropertyAdviceAnswerRecordV4, annotationId: string): HopPropertyAdviceIntentV3 {
  const entry = [...record.ledger.entries].reverse().find(row => row.annotationId === annotationId
    && row.disposition === 'active' && row.activeIntent);
  if (!entry?.activeIntent) throw Error('Projection active V4 introuvable pour ' + annotationId);
  return structuredClone(entry.activeIntent);
}

function reviseMeasurement(record: HopV55PropertyAdviceAnswerRecordV4, intent: HopPropertyAdviceIntentV3,
  basis = intent.comparisonBasis): HopV55PropertyAdviceLedgerActionV4 {
  return { kind: 'revise', annotationId: intent.id,
    activeIntent: { ...structuredClone(intent), comparisonBasis: structuredClone(basis), interpretationOrigin: 'user' },
    reason: 'Geste explicite de réconciliation de fixture.' };
}

function confirmation(input: {
  record: HopV55PropertyAdviceAnswerRecordV4;
  preview: Awaited<ReturnType<ReturnType<typeof createHopV55PropertyAdviceControllerV4>['prepareReexamination']>>;
  commandId: string;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  bindingChoices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
}) : HopV55PropertyAdviceV4ConfirmationCommand {
  return { commandId: input.commandId, expectedRecordReference: input.record.reference,
    expectedLedgerReference: input.record.ledger.reference, previewId: input.preview.previewId,
    expectedPreviewReference: input.preview.reference, actions: input.actions,
    readingContext: structuredClone(input.preview.readingContext), bindingChoices: input.bindingChoices,
    reason: 'Réexamen synthétique explicite à partir du preview exact.' };
}

async function makeHarness(options: { withNr?: boolean; value?: number } = {}) {
  const base = baseJourney(options);
  const database = new MemoryDatabase();
  const repository = createHopV55WorkspaceRepository({ ownerKey, database });
  const initialWorkspace = await repository.save(structuredClone(base.workspace), null);
  let context = structuredClone(base.context);
  let activeArchive: HopV55DecisionReadingArchive = base.archive;
  let saveMode: SaveMode = 'normal';
  let saveInvocations = 0;
  let isHistorical = false;
  let concurrentWrites = 0;
  const save = vi.fn(async (next: HopV55Workspace) => {
    saveInvocations++;
    const observed = await repository.read(ownerKey, next.id);
    if (!observed) throw Error('Workspace fixture introuvable avant CAS.');
    if (saveMode === 'staleCas2Once' && saveInvocations === 2) {
      saveMode = 'normal'; concurrentWrites++;
      await repository.save({ ...observed, title: 'Écriture concurrente ' + concurrentWrites }, observed.revision);
      return repository.save(next, observed.revision);
    }
    if (saveMode === 'staleOnce') {
      saveMode = 'normal'; concurrentWrites++;
      await repository.save({ ...observed, title: 'Écriture concurrente ' + concurrentWrites }, observed.revision);
      return repository.save(next, observed.revision);
    }
    if (saveMode === 'commitThenLoseFirstReply') {
      saveMode = 'normal';
      await repository.save(next, observed.revision);
      throw Error('Réponse perdue après CAS fixture.');
    }
    return repository.save(next, observed.revision);
  });
  const selected = vi.fn((_record: HopV55PropertyAdviceAnswerRecordV4, _workspace: HopV55Workspace, _historical: boolean) => undefined);
  const activated = vi.fn((_archive: HopV55DecisionReadingArchive, _record: HopV55PropertyAdviceAnswerRecordV4,
    _workspace: HopV55Workspace) => { activeArchive = structuredClone(_archive); });
  const pending = new Map<string, HopV55PropertyAdviceV4Pending>();
  const previews = new Map();
  let currentSource: HopV55DecisionReadingSource | undefined;
  const host: HopV55PropertyAdviceHostV4 = {
    services: { ownerKey, scope: 'fixture' },
    enabled: () => true, historical: () => isHistorical,
    reading: () => structuredClone(activeArchive),
    context: async () => structuredClone(context),
    workspace: async () => {
      const workspace = await repository.read(ownerKey, workspaceId);
      if (!workspace) throw Error('Workspace fixture introuvable.');
      return workspace;
    },
    save,
    source: workspace => structuredClone(currentSource
      ?? (workspace.sourceRecipeId ? { kind: 'recipe', id: workspace.sourceRecipeId } : { kind: 'exploration' })),
    runtimeReference: prepared => hopV55ScenarioRuntimeReference(prepared.runtime),
    adoptedIdentity: workspace => getHopV55ReferenceProjection(workspace)?.currentReference ?? null,
    pending, previews, selected, activated,
  };
  const controller = createHopV55PropertyAdviceControllerV4(host);
  const upgraded = await controller.upgradeV3(base.sourceRecord.reference, 'act:upgrade-reconciliation-v4',
    'Promotion V3 explicite de la fixture avant réconciliation.');
  return {
    ...base, database, repository, host, controller, save, selected, activated, pending, previews,
    initialWorkspace, upgraded,
    setContext(next: BrewerContext) { context = structuredClone(next); },
    setSaveMode(mode: SaveMode) { saveMode = mode; saveInvocations = 0; },
    setHistorical(value: boolean) { isHistorical = value; },
    setCurrentSource(source: HopV55DecisionReadingSource | undefined) { currentSource = structuredClone(source); },
    recreateController() {
      // A new controller instance models app reload; its only recovery inputs are the repository records.
      pending.clear(); previews.clear();
      return createHopV55PropertyAdviceControllerV4(host);
    },
    async stored() {
      const workspace = await repository.read(ownerKey, workspaceId);
      if (!workspace) throw Error('Workspace fixture introuvable.');
      return workspace;
    },
    async updateWorkspace(next: HopV55Workspace) {
      const current = await repository.read(ownerKey, workspaceId);
      if (!current) throw Error('Workspace fixture introuvable avant mise à jour directe.');
      return repository.save(next, current.revision);
    },
  };
}

async function preview(harness: Awaited<ReturnType<typeof makeHarness>>, id: string) {
  return harness.controller.prepareReexamination({ previewId: id,
    expectedRecordReference: harness.upgraded.reference, expectedLedgerReference: harness.upgraded.ledger.reference });
}

afterEach(() => { vi.restoreAllMocks(); });

describe('contrôleur de réconciliation V4 — preview frais, source et CAS', () => {
  it('prépare un preview frais sans construire ni écrire; la liaison exacte du même ID change lignée par deux CAS', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    const parser = vi.spyOn(decisionService, 'readHopV55Question'); parser.mockClear();
    h.save.mockClear(); h.selected.mockClear(); h.activated.mockClear();
    const parentBefore = structuredClone(h.upgraded);
    const sourceArchiveBefore = structuredClone(h.archive);
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:bind-measurement-v4');
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === h.measurementIntent.id
      && row.previousAssertionId === 'context-reading-0');
    expect(diagnostic).toMatchObject({ status: 'changed', currentAssertion: { id: 'context-reading-0', value: 5.25 } });
    expect(diagnostic?.currentAssertionReference).not.toBe(diagnostic?.previousAssertionReference);
    expect(diagnostic?.compatibleFreshAssertions.map(row => row.assertionId)).toContain('context-reading-0');
    expect(freshPreview.parentRecordReference).toBe(parentBefore.reference);
    expect(freshPreview.parentLedgerReference).toBe(parentBefore.ledger.reference);
    expect(freshPreview.sourceReadingArchive.contentReference).not.toBe(sourceArchiveBefore.contentReference);
    expect(h.save).not.toHaveBeenCalled();
    expect(builder).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(h.selected).not.toHaveBeenCalled();
    expect(h.activated).not.toHaveBeenCalled();

    const intent = activeIntent(parentBefore, h.measurementIntent.id);
    const revise = reviseMeasurement(parentBefore, intent);
    const missingBinding = confirmation({ record: parentBefore, preview: freshPreview,
      commandId: 'act:missing-binding-v4', actions: [revise], bindingChoices: [] });
    await expect(h.controller.confirmReexamination(missingBinding)).rejects.toThrow(/choix|liaison|lien périmé/iu);
    expect(h.save).not.toHaveBeenCalled();
    expect(builder).not.toHaveBeenCalled();

    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: h.measurementIntent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: 'context-reading-0',
    };
    const command = confirmation({ record: parentBefore, preview: freshPreview,
      commandId: 'act:bind-measurement-v4', actions: [revise], bindingChoices: [binding] });
    h.setSaveMode('staleOnce');
    const created = await h.controller.confirmReexamination(command);
    expect(created.outcome.kind).toBe('domainAnswer');
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(3);
    expect(h.selected).not.toHaveBeenCalled();
    expect(h.activated).toHaveBeenCalledTimes(1);
    expect(h.activated.mock.calls[0]?.[0].contentReference).toBe(created.sourceReadingReference);
    const stored = await h.stored();
    expect(stored.title).toBe('Écriture concurrente 1');
    expect(stored.documentaryAnswers?.find(row => row.reference === parentBefore.reference)).toEqual(parentBefore);
    expect(stored.decisionReadings?.find(row => row.contentReference === sourceArchiveBefore.contentReference)).toEqual(sourceArchiveBefore);
    expect(stored.decisionReadings?.some(row => row.contentReference === created.sourceReadingReference)).toBe(true);
    expect(stored.documentaryAnswers?.at(-1)).toEqual(created);
    expect(created.transition).toMatchObject({ actId: 'act:bind-measurement-v4', kind: 'reexamine',
      parentRecordReference: parentBefore.reference, parentReadingReference: parentBefore.sourceReadingReference });
    expect(created.ledger.sourceAnnotations).toEqual(parentBefore.ledger.sourceAnnotations);
    expect(created.outcome.kind === 'domainAnswer'
      && created.outcome.answerSnapshot.requestSnapshot.context.assertions.find(row => row.id === 'context-reading-0')?.value).toBe(5.25);
  });

  it('archive allRejected en tête sans request ni builder, sans fallback vers la réponse parent', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    const parser = vi.spyOn(decisionService, 'readHopV55Question'); parser.mockClear();
    h.save.mockClear(); h.selected.mockClear(); h.activated.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:reject-all-v4');
    const actions = h.upgraded.ledger.sourceAnnotations.map(annotation => ({
      kind: 'reject' as const, annotationId: annotation.id, reason: 'Non retenue dans la réconciliation de fixture.',
    }));
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:reject-all-v4',
      actions, bindingChoices: [] });
    const rejected = await h.controller.confirmReexamination(command);
    expect(rejected.outcome).toEqual({ kind: 'allRejected' });
    expect(builder).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(2);
    expect(h.activated).toHaveBeenCalledTimes(1);
    expect(h.selected).not.toHaveBeenCalled();
    const stored = await h.stored();
    expect(stored.documentaryAnswers?.at(-1)).toEqual(rejected);
    expect(stored.decisionReadings?.find(row => row.contentReference === rejected.sourceReadingReference)).toBeDefined();
    expect('answerSnapshot' in rejected.outcome).toBe(false);
    expect(stored.documentaryAnswers?.[1]).toEqual(h.upgraded);
    await expect(h.controller.correct({ commandId: 'act:old-parent-after-all-rejected-v4',
      expectedRecordReference: h.upgraded.reference, expectedLedgerReference: h.upgraded.ledger.reference,
      actions: [], readingContext: h.upgraded.readingContext, reason: 'Ne pas retomber sur le parent.' }))
      .rejects.toThrow(/tête exacte|courante|registre/i);
    expect(builder).not.toHaveBeenCalled();
  });

  it('refuse le détachement d’un lien de mesure et un preview Prepared périmé avant builder/CAS', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    h.save.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:measurement-detach-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const detachedIntent = { ...intent, comparisonBasis: { kind: 'none' as const, assertionIds: [] }, interpretationOrigin: 'user' as const };
    const action: HopV55PropertyAdviceLedgerActionV4 = { kind: 'revise', annotationId: intent.id,
      activeIntent: detachedIntent, reason: 'Tentative explicite de détachement d’une mesure.' };
    const detach: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'detach',
      previewReference: freshPreview.reference, annotationId: intent.id, previousAssertionId: 'context-reading-0',
    };
    const detachCommand = confirmation({ record: h.upgraded, preview: freshPreview,
      commandId: 'act:detach-measurement-v4', actions: [action], bindingChoices: [detach] });
    await expect(h.controller.confirmReexamination(detachCommand)).rejects.toThrow(/mesure|ne peut pas être détaché|base current/iu);
    expect(h.save).not.toHaveBeenCalled();
    expect(builder).not.toHaveBeenCalled();
    expect(h.activated).not.toHaveBeenCalled();

    const validIntent = activeIntent(h.upgraded, h.measurementIntent.id);
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: validIntent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: 'context-reading-0',
    };
    const validAction = reviseMeasurement(h.upgraded, validIntent);
    const stale = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:stale-preview-v4',
      actions: [validAction], bindingChoices: [binding] });
    h.setContext(contextWithMeasurement(6.25));
    await expect(h.controller.confirmReexamination(stale)).rejects.toThrow(/preview|Prepared|source|changé/iu);
    expect(h.save).not.toHaveBeenCalled();
    expect(builder).not.toHaveBeenCalled();
    expect(h.activated).not.toHaveBeenCalled();
    expect((await h.stored()).decisionReadings).toEqual(h.initialWorkspace.decisionReadings);
    expect((await h.stored()).documentaryAnswers).toEqual([h.sourceRecord, h.upgraded]);
  });

  it('refuse un NR B adopté après le preview A avant builder, CAS ou activation', async () => {
    const h = await makeHarness({ withNr: true });
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    h.save.mockClear();
    const refA = getHopV55ReferenceProjection(await h.stored())?.currentReference;
    expect(refA).toBeDefined();
    const freshPreview = await preview(h, 'preview:nr-a-to-b-v4');
    expect(freshPreview.cultureBindingReference).toBeTruthy();
    const before = await h.stored();
    const adopted = getHopV55ReferenceHypotheses(before)[0];
    if (!adopted) throw Error('La version NR A exacte doit rester lisible.');
    const context = h.context;
    const prepared = prepareBrewingScenarioContext(context);
    const nextReference = adoptHopV55ReferenceHypothesis(before, { ...structuredClone(adopted), version: adopted.version + 1,
      label: 'B · nouvelle hypothèse NR de fixture', recordedAt: '2026-10-03T20:20:00.000Z' },
      context, prepared, { referenceVersion: String(adopted.version + 1) });
    await h.updateWorkspace(nextReference);
    expect(getHopV55ReferenceProjection(await h.stored())?.currentReference).not.toEqual(refA);
    const rejectActions = h.upgraded.ledger.sourceAnnotations.map(annotation => ({
      kind: 'reject' as const, annotationId: annotation.id, reason: 'NR B a remplacé le cadre A avant confirmation.',
    }));
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:nr-a-preview-b-refuse-v4',
      actions: rejectActions, bindingChoices: [] });
    await expect(h.controller.confirmReexamination(command)).rejects.toThrow(/référence de comparaison a changé/iu);
    expect(h.save).not.toHaveBeenCalled();
    expect(builder).not.toHaveBeenCalled();
    expect(h.activated).not.toHaveBeenCalled();
    expect((await h.stored()).documentaryAnswers).toEqual(before.documentaryAnswers);
  });

  it('reprend après reload depuis le staging CAS1 exact et scelle le record+reçu en CAS2 sans builder', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    const parser = vi.spyOn(decisionService, 'readHopV55Question'); parser.mockClear();
    h.save.mockClear(); h.selected.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:cas1-lost-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:lost-cas1-v4',
      actions: [action], bindingChoices: [binding] });
    const parentBefore = structuredClone(h.upgraded);
    const sourceRecordBefore = structuredClone(h.sourceRecord);
    const sourceArchiveBefore = structuredClone(h.archive);
    h.setSaveMode('commitThenLoseFirstReply');
    await expect(h.controller.confirmReexamination(command)).rejects.toThrow(/Réponse perdue après CAS fixture/iu);
    const staged = await h.stored();
    expect(staged.decisionReadings).toHaveLength(2);
    expect(staged.decisionReadings?.some(row => row.contentReference === freshPreview.sourceReadingArchive.contentReference)).toBe(true);
    expect(staged.documentaryAnswers).toHaveLength(2);
    expect(staged.propertyAdviceReexaminationCommandStaging).toHaveLength(1);
    expect(staged.propertyAdviceReexaminationCommandReceipts ?? []).toHaveLength(0);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(h.pending.has(command.commandId)).toBe(true);
    const rawStage = staged.propertyAdviceReexaminationCommandStaging?.[0];
    const stageRead = readHopV55PropertyAdviceReexaminationCommandStaging(rawStage);
    expect(stageRead.status).toBe('available');
    if (stageRead.status !== 'available') throw Error('Le staging V1 exact doit survivre au CAS1.');
    expect(stageRead.staging).toMatchObject({ commandId: command.commandId,
      fingerprint: expect.any(String), sourceReadingReference: freshPreview.sourceReadingArchive.contentReference,
      parentRecordReference: h.upgraded.reference, parentLedgerReference: h.upgraded.ledger.reference,
      confirmation: command, preparedRecord: { transition: { actId: command.commandId, reason: command.reason } } });

    const afterReload = h.recreateController();
    const committed = await afterReload.confirmReexamination(command);
    expect(committed.transition.actId).toBe(command.commandId);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(2);
    expect(h.activated).not.toHaveBeenCalled();
    expect(h.selected).toHaveBeenCalledTimes(1);
    expect(h.selected.mock.calls[0]?.[0]).toEqual(committed);
    expect(h.selected.mock.calls[0]?.[2]).toBe(true);
    const afterCommit = await h.stored();
    expect(afterCommit.documentaryAnswers).toHaveLength(3);
    expect(afterCommit.documentaryAnswers?.[0]).toEqual(sourceRecordBefore);
    expect(afterCommit.documentaryAnswers?.[1]).toEqual(parentBefore);
    expect(afterCommit.decisionReadings).toHaveLength(2);
    expect(afterCommit.decisionReadings?.[0]).toEqual(sourceArchiveBefore);
    expect(afterCommit.propertyAdviceReexaminationCommandStaging).toEqual(staged.propertyAdviceReexaminationCommandStaging);
    expect(afterCommit.documentaryAnswers?.at(-1)).toEqual(stageRead.staging.preparedRecord);
    expect(afterCommit.propertyAdviceReexaminationCommandReceipts).toHaveLength(1);
    const receiptRead = readHopV55PropertyAdviceReexaminationCommandReceipt(afterCommit.propertyAdviceReexaminationCommandReceipts?.[0]);
    expect(receiptRead.status).toBe('available');
    if (receiptRead.status !== 'available') throw Error('Le reçu V1 exact doit fermer le staging en CAS2.');
    expect(receiptRead.receipt).toMatchObject({ commandId: command.commandId,
      fingerprint: stageRead.staging.fingerprint, stagingReference: stageRead.staging.reference,
      answerRecordReference: committed.reference, sourceReadingReference: committed.sourceReadingReference });
    expect(h.selected.mock.calls[0]?.[1]).toEqual(afterCommit);

    const committedAgain = await h.recreateController().confirmReexamination(command);
    expect(committedAgain).toEqual(committed);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(2);
    expect(h.selected).toHaveBeenCalledTimes(2);
    expect((await h.stored()).documentaryAnswers?.at(-1)).toEqual(committed);
  });

  it('finalise le stage exact de A sous la source B en l’archivant, sans reconstruction ni activation', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    h.save.mockClear(); h.selected.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:archive-only-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:archive-only-v4',
      actions: [action], bindingChoices: [binding] });
    h.setSaveMode('commitThenLoseFirstReply');
    await expect(h.controller.confirmReexamination(command)).rejects.toThrow(/Réponse perdue après CAS fixture/iu);
    const staged = await h.stored();
    expect(staged.propertyAdviceReexaminationCommandStaging).toHaveLength(1);
    expect(staged.propertyAdviceReexaminationCommandReceipts ?? []).toHaveLength(0);
    const stagedRead = readHopV55PropertyAdviceReexaminationCommandStaging(staged.propertyAdviceReexaminationCommandStaging?.[0]);
    expect(stagedRead.status).toBe('available');
    if (stagedRead.status !== 'available') throw Error('Le staging durable doit rester lisible après le CAS1.');
    h.setCurrentSource({ kind: 'recipe', id: 'recipe-source-B' });
    const recovered = await h.recreateController().confirmReexamination(command);
    expect(recovered).toEqual(stagedRead.staging.preparedRecord);
    const afterRetry = await h.stored();
    expect(afterRetry.decisionReadings).toEqual(staged.decisionReadings);
    expect(afterRetry.documentaryAnswers).toHaveLength(3);
    expect(afterRetry.propertyAdviceReexaminationCommandStaging).toEqual(staged.propertyAdviceReexaminationCommandStaging);
    expect(afterRetry.propertyAdviceReexaminationCommandReceipts).toHaveLength(1);
    expect(afterRetry.documentaryAnswers?.at(-1)).toEqual(recovered);
    expect(h.save).toHaveBeenCalledTimes(2);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(h.activated).not.toHaveBeenCalled();
    expect(h.selected).toHaveBeenCalledTimes(1);
    expect(h.selected.mock.calls[0]?.[0]).toEqual(recovered);
    expect(h.selected.mock.calls[0]?.[2]).toBe(true);
  });

  it('refuse avant CAS1 une confirmation construite sous A quand la source courante passe à B', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    h.save.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:source-a-to-b-before-cas1-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:source-a-to-b-before-cas1-v4',
      actions: [action], bindingChoices: [binding] });
    h.setCurrentSource({ kind: 'recipe', id: 'recipe-source-B' });
    await expect(h.controller.confirmReexamination(command)).rejects.toThrow(/source|aperçu|lecture|changé/i);
    const after = await h.stored();
    expect(after.decisionReadings).toEqual(h.initialWorkspace.decisionReadings);
    expect(after.propertyAdviceReexaminationCommandStaging ?? []).toHaveLength(0);
    expect(after.propertyAdviceReexaminationCommandReceipts ?? []).toHaveLength(0);
    expect(after.documentaryAnswers).toEqual([h.sourceRecord, h.upgraded]);
    expect(h.save).not.toHaveBeenCalled();
    expect(builder).not.toHaveBeenCalled();
  });

  it('récupère le reçu exact de A sous la source B, sans nouvelle construction ni écriture', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    h.save.mockClear(); h.selected.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:receipt-a-source-b-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:receipt-a-source-b-v4',
      actions: [action], bindingChoices: [binding] });
    const committed = await h.controller.confirmReexamination(command);
    const beforeRecovery = await h.stored();
    expect(beforeRecovery.propertyAdviceReexaminationCommandReceipts).toHaveLength(1);
    expect(h.save).toHaveBeenCalledTimes(2);
    expect(builder).toHaveBeenCalledTimes(1);

    h.setCurrentSource({ kind: 'recipe', id: 'recipe-source-B' });
    const recovered = await h.recreateController().confirmReexamination(command);
    expect(recovered).toEqual(committed);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(h.save).toHaveBeenCalledTimes(2);
    expect(h.selected).toHaveBeenCalledTimes(1);
    expect(h.selected.mock.calls[0]?.[2]).toBe(true);
    expect(await h.stored()).toEqual(beforeRecovery);
  });

  it('refuse de réutiliser le commandId si liaisons ou frame changent malgré raison/actions inchangées', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    h.save.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:fingerprint-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:fingerprint-v4',
      actions: [action], bindingChoices: [binding] });
    h.setSaveMode('commitThenLoseFirstReply');
    await expect(h.controller.confirmReexamination(command)).rejects.toThrow(/Réponse perdue après CAS fixture/iu);
    expect(builder).toHaveBeenCalledTimes(1);
    const resumed = h.recreateController();
    const changedBinding = { ...command, bindingChoices: [{ ...binding, freshAssertionId: 'context-reading-other' }] };
    await expect(resumed.confirmReexamination(changedBinding)).rejects.toThrow(/bindingChoices différents|confirmation.*différents/i);
    const changedFrame = structuredClone(command);
    changedFrame.readingContext.interpretation.text += ' · cadre modifié après stage';
    await expect(resumed.confirmReexamination(changedFrame)).rejects.toThrow(/bindingChoices différents|confirmation.*différents/i);
    expect(changedBinding.reason).toBe(command.reason);
    expect(changedFrame.reason).toBe(command.reason);
    expect(changedBinding.actions).toEqual(command.actions);
    expect(changedFrame.actions).toEqual(command.actions);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(h.save).toHaveBeenCalledTimes(1);
    const after = await h.stored();
    expect(after.propertyAdviceReexaminationCommandStaging).toHaveLength(1);
    expect(after.propertyAdviceReexaminationCommandReceipts ?? []).toHaveLength(0);
    expect(after.documentaryAnswers).toHaveLength(2);
  });

  it('un réexamen explicitement confirmé depuis un parent historique active son enfant après reprise CAS2', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    const parser = vi.spyOn(decisionService, 'readHopV55Question'); parser.mockClear();
    h.save.mockClear(); h.selected.mockClear(); h.activated.mockClear();
    h.setHistorical(true);
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:historical-parent-new-child-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview,
      commandId: 'act:historical-parent-new-child-v4', actions: [action], bindingChoices: [binding] });
    const parentBefore = structuredClone(h.upgraded);
    h.setSaveMode('staleCas2Once');
    const created = await h.controller.confirmReexamination(command);

    expect(created.transition.parentRecordReference).toBe(parentBefore.reference);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).toHaveBeenCalledTimes(3); // CAS1, stale CAS2 attempt, successful CAS2 retry
    expect(h.selected).not.toHaveBeenCalled();
    expect(h.activated).toHaveBeenCalledTimes(1);
    expect(h.activated.mock.calls[0]?.[0].contentReference).toBe(created.sourceReadingReference);
    expect(h.activated.mock.calls[0]?.[1]).toEqual(created);
    expect(h.host.reading()?.contentReference).toBe(created.sourceReadingReference);
    expect(h.pending.get(command.commandId)?.record).toEqual(created);
    expect(h.previews.get(command.previewId)?.reference).toBe(freshPreview.reference);

    const stored = await h.stored();
    expect(stored.documentaryAnswers?.find(row => row.reference === parentBefore.reference)).toEqual(parentBefore);
    expect(stored.documentaryAnswers?.at(-1)).toEqual(created);
    expect(stored.documentaryAnswers).toHaveLength(3);
    expect(stored.decisionReadings?.find(row => row.contentReference === created.sourceReadingReference)).toEqual(freshPreview.sourceReadingArchive);
    expect(stored.propertyAdviceReexaminationCommandStaging).toHaveLength(1);
    expect(stored.propertyAdviceReexaminationCommandReceipts).toHaveLength(1);
    const stage = readHopV55PropertyAdviceReexaminationCommandStaging(stored.propertyAdviceReexaminationCommandStaging?.[0]);
    expect(stage.status).toBe('available');
    if (stage.status !== 'available') throw Error('Le stage du nouveau descendant doit rester lisible.');
    expect(stage.staging).toMatchObject({ parentRecordReference: parentBefore.reference,
      parentLedgerReference: parentBefore.ledger.reference, preparedRecord: created });
  });

  it('un ancien archive-only sans staging durable reste refusé et ne relance pas le builder', async () => {
    const h = await makeHarness();
    const builder = vi.spyOn(propertyAdviceDomain, 'buildHopPropertyAdviceV3'); builder.mockClear();
    const parser = vi.spyOn(decisionService, 'readHopV55Question'); parser.mockClear();
    h.save.mockClear();
    h.setContext(contextWithMeasurement(5.25));
    const freshPreview = await preview(h, 'preview:legacy-archive-only-v4');
    const intent = activeIntent(h.upgraded, h.measurementIntent.id);
    const action = reviseMeasurement(h.upgraded, intent);
    const diagnostic = freshPreview.diagnostics.find(row => row.annotationId === intent.id && row.previousAssertionId === 'context-reading-0');
    const freshAssertion = diagnostic?.compatibleFreshAssertions.find(row => row.assertionId === 'context-reading-0');
    if (!freshAssertion) throw Error('Assertion fraîche compatible du même ID attendue dans le preview.');
    const binding: HopV55PropertyAdviceReexaminationBindingChoiceV1 = {
      format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT, kind: 'bind',
      previewReference: freshPreview.reference, annotationId: intent.id,
      previousAssertionId: 'context-reading-0', freshAssertionId: freshAssertion.assertionId,
    };
    const command = confirmation({ record: h.upgraded, preview: freshPreview, commandId: 'act:legacy-archive-only-v4',
      actions: [action], bindingChoices: [binding] });
    const withLegacyArchive = await h.updateWorkspace({ ...await h.stored(),
      decisionReadings: [...(await h.stored()).decisionReadings ?? [], freshPreview.sourceReadingArchive] });
    expect(withLegacyArchive.decisionReadings?.some(row => row.contentReference === freshPreview.sourceReadingArchive.contentReference)).toBe(true);
    expect(withLegacyArchive.propertyAdviceReexaminationCommandStaging ?? []).toHaveLength(0);
    await expect(h.recreateController().confirmReexamination(command)).rejects.toThrow(/aperçu exact n’est plus disponible/i);
    expect(builder).not.toHaveBeenCalled();
    expect(parser).not.toHaveBeenCalled();
    expect(h.save).not.toHaveBeenCalled();
    const after = await h.stored();
    expect(after.decisionReadings).toEqual(withLegacyArchive.decisionReadings);
    expect(after.propertyAdviceReexaminationCommandStaging ?? []).toHaveLength(0);
    expect(after.documentaryAnswers).toEqual(withLegacyArchive.documentaryAnswers);
  });
});
