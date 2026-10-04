import { describe, expect, it } from 'vitest';
import { buildHopPropertyAdviceV3 } from '../../src/domain/hopDecision/propertyAdvice';
import { assertHopPropertyAdviceRequestV3, type HopPropertyAdviceIntentV3,
  type HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';
import { prepareBrewingScenarioContext } from '../../src/domain/brewingScenarioContext';
import { makeHopV55FixtureContext } from '../../src/services/hopV55/fixtureRuntime';
import { readHopV55Question } from '../../src/services/hopV55/decision';
import { createHopV55DecisionReadingArchiveV2 } from '../../src/services/hopV55/decisionArchive';
import { scopeHopV55PropertyAdviceMaterials } from '../../src/services/hopV55/propertyAdvicePreparation';
import { prepareHopV55PropertyAdviceRequestDraftV3,
  hopV55PropertyAdviceRequestDraftReferenceV3 } from '../../src/services/hopV55/propertyAdvicePreparationV3';
import { hopV55PropertyAdvicePreparedReferenceV4 } from '../../src/services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV3, readHopV55PropertyAdviceAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';
import {
  createHopV55PropertyAdviceAnswerRecordV4,
  createHopV55PropertyAdviceDossierRecordV4,
  HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT,
  HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT,
  readHopV55PropertyAdviceAnswerRecordV4,
  readHopV55PropertyAdviceAnnotationLedgerV1,
  readHopV55PropertyAdviceDossierRecordV4,
  sealHopV55PropertyAdviceAnnotationLedgerV1,
  sealHopV55PropertyAdviceLedgerEntryV1,
  hopV55PropertyAdviceAnnotationLedgerReferenceV1,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnnotationLedgerV1,
  type HopV55PropertyAdviceCorrectionV4Draft,
  type HopV55PropertyAdviceLedgerEntryV1,
  type HopV55PropertyAdviceV4ReadingContext,
  type HopV55PropertyAdviceV4Transition,
} from '../../src/services/hopV55/propertyAdviceRecordsV4';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import type { HopV55Workspace } from '../../src/services/hopV55/contracts';
import { createHopV55WorkspaceRepository, type HopV55WorkspaceDatabaseAdapter,
  type HopV55WorkspaceEnvelopeV1, type HopV55WorkspaceTable } from '../../src/services/hopV55/workspaceRepository';
import { readHopV55DocumentaryAnswerRecord, readHopV55DocumentaryDossierRecord } from '../../src/services/hopV55/documentaryRecords';
import { HopV55DocumentaryAnswerRecordV3 } from '../../src/services/hopV55/propertyAdviceRecordsV3';

const question = 'Ma bière est trop sucrée. Comment compenser avec mon houblon de jardin, tout en gardant la poire ?';
const candidatePolicy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’est encore choisie.' };
const ownerKey = 'owner-property-v4-ledger';
const workspaceId = 'workspace-property-v4-ledger';

class MemoryTable implements HopV55WorkspaceTable<HopV55WorkspaceEnvelopeV1> {
  rows = new Map<string, HopV55WorkspaceEnvelopeV1>();
  private key(value: unknown) { return JSON.stringify(Array.isArray(value) ? value : [
    (value as HopV55WorkspaceEnvelopeV1).ownerKey, (value as HopV55WorkspaceEnvelopeV1).workspaceId,
  ]); }
  async get(key: unknown) { const row = this.rows.get(this.key(key)); return row && structuredClone(row); }
  async add(row: HopV55WorkspaceEnvelopeV1) {
    const key = this.key(row); if (this.rows.has(key)) throw new Error('ConstraintError');
    this.rows.set(key, structuredClone(row));
  }
  async put(row: HopV55WorkspaceEnvelopeV1) { this.rows.set(this.key(row), structuredClone(row)); }
  where(index: string) { return { equals: (key: unknown) => ({ toArray: async () => [...this.rows.values()]
    .filter(row => index === 'ownerKey' && row.ownerKey === key).map(row => structuredClone(row)) }) }; }
}

class MemoryDatabase implements HopV55WorkspaceDatabaseAdapter {
  workspaces = new MemoryTable();
  async transaction<T>(_mode: 'r' | 'rw', ...tablesAndWork: unknown[]): Promise<T> {
    const work = tablesAndWork.at(-1) as () => Promise<T>;
    const snapshot = new Map([...this.workspaces.rows].map(([key, row]) => [key, structuredClone(row)]));
    try { return await work(); } catch (error) { this.workspaces.rows = snapshot; throw error; }
  }
  close() { /* Fixture only. */ }
}

function createJourney() {
  const sourceContext = makeHopV55FixtureContext('planning');
  const prepared = prepareBrewingScenarioContext(sourceContext);
  const reading = readHopV55Question(question, prepared);
  const sourceRecipeId = sourceContext.recipe?.id;
  if (!sourceRecipeId) throw new Error('Source de recette planning synthétique attendue.');
  const archive = createHopV55DecisionReadingArchiveV2({ id: 'reading-property-v4-ledger', ownerKey, workspaceId,
    recordedAt: '2026-10-03T18:00:00.000Z', reading, source: { kind: 'recipe', id: sourceRecipeId }, runtimeReference: 'runtime-property-v4-ledger' });
  const v3Draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading, prepared, requestId: 'request-property-v3-source',
    ownerKey, workspaceId, sourceReadingReference: archive.contentReference, candidatePolicy });
  const v3Answer = buildHopPropertyAdviceV3(v3Draft.requestSnapshot);
  const v3Record = createHopV55PropertyAdviceAnswerRecordV3({ draft: v3Draft, prepared, answerSnapshot: v3Answer,
    answerRecordId: 'answer-property-v3-source' });
  const workspace: HopV55Workspace = { format: 'hop-v55-workspace-v1', id: workspaceId, ownerKey, revision: 0,
    title: 'Ledger V4 de fixture', sourceRecipeId,
    intent: { question, criteria: [] }, decisionReadings: [archive], scenarioIds: [], referenceHypotheses: [],
    copies: [], updatedAt: '2026-10-03T18:00:00.000Z' };
  return { prepared, reading, archive, v3Draft, v3Answer, v3Record, workspace };
}

function readingContext(request: HopPropertyAdviceRequestV3): HopV55PropertyAdviceV4ReadingContext {
  return { interpretation: structuredClone(request.interpretation), candidatePolicy: structuredClone(request.candidatePolicy),
    context: structuredClone(request.context), exclusions: structuredClone(request.exclusions) };
}

function initialLedger(intents: HopPropertyAdviceIntentV3[], actId: string, recordedAt: string,
  questionText = question): HopV55PropertyAdviceAnnotationLedgerV1 {
  const entries = intents.map(sourceAnnotation => sealHopV55PropertyAdviceLedgerEntryV1({
    entryId: `entry-initial:${sourceAnnotation.id}`, annotationId: sourceAnnotation.id,
    sourceAnnotation: structuredClone(sourceAnnotation), sourceKind: 'initial', disposition: 'active',
    activeIntent: structuredClone(sourceAnnotation),
    decision: { kind: 'initialize', actId, reason: 'Initialisation explicite depuis l’annotation source exacte.',
      recordedAt, recordedBy: { origin: 'user', label: 'Brasseur fixture' } },
  }));
  return sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: structuredClone(intents), entries, originalQuestion: questionText });
}

function rejectAll(ledger: HopV55PropertyAdviceAnnotationLedgerV1, actId: string, recordedAt: string): HopV55PropertyAdviceAnnotationLedgerV1 {
  const entries = [...ledger.entries];
  for (const sourceAnnotation of ledger.sourceAnnotations) {
    const prior = [...entries].reverse().find(entry => entry.annotationId === sourceAnnotation.id);
    if (!prior || prior.disposition !== 'active') throw new Error(`Annotation active attendue : ${sourceAnnotation.id}.`);
    entries.push(sealHopV55PropertyAdviceLedgerEntryV1({ entryId: `entry-reject:${sourceAnnotation.id}`,
      annotationId: sourceAnnotation.id, sourceAnnotation: structuredClone(sourceAnnotation),
      sourceKind: prior.sourceKind, ...(prior.additionActId ? { additionActId: prior.additionActId } : {}),
      ...(prior.sourceQuestionReference ? { sourceQuestionReference: prior.sourceQuestionReference } : {}),
      disposition: 'rejected', decision: { kind: 'reject', actId, reason: `Rejet explicite de fixture : ${sourceAnnotation.label}.`,
        recordedAt, recordedBy: { origin: 'user', label: 'Brasseur fixture' }, predecessorEntryReference: prior.reference } }));
  }
  return sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: ledger.sourceAnnotations, entries, originalQuestion: question });
}

function restoreAll(ledger: HopV55PropertyAdviceAnnotationLedgerV1, actId: string, recordedAt: string): HopV55PropertyAdviceAnnotationLedgerV1 {
  const entries = [...ledger.entries];
  for (const sourceAnnotation of ledger.sourceAnnotations) {
    const prior = [...entries].reverse().find(entry => entry.annotationId === sourceAnnotation.id);
    if (!prior || prior.disposition !== 'rejected') throw new Error(`Annotation rejetée attendue : ${sourceAnnotation.id}.`);
    entries.push(sealHopV55PropertyAdviceLedgerEntryV1({ entryId: `entry-restore:${sourceAnnotation.id}`,
      annotationId: sourceAnnotation.id, sourceAnnotation: structuredClone(sourceAnnotation),
      sourceKind: prior.sourceKind, ...(prior.additionActId ? { additionActId: prior.additionActId } : {}),
      ...(prior.sourceQuestionReference ? { sourceQuestionReference: prior.sourceQuestionReference } : {}),
      disposition: 'active', activeIntent: { ...structuredClone(sourceAnnotation), interpretationOrigin: 'user',
        basis: 'Restauration explicite de la lecture source; aucun fait ni mesure n’est ajouté.' },
      decision: { kind: 'restore', actId, reason: `Restauration explicite de fixture : ${sourceAnnotation.label}.`,
        recordedAt, recordedBy: { origin: 'user', label: 'Brasseur fixture' }, predecessorEntryReference: prior.reference } }));
  }
  return sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: ledger.sourceAnnotations, entries, originalQuestion: question });
}

function draftV4Record(input: {
  journey: ReturnType<typeof createJourney>;
  ledger: HopV55PropertyAdviceAnnotationLedgerV1;
  actId: string;
  kind: HopV55PropertyAdviceV4Transition['kind'];
  parent?: HopV55PropertyAdviceAnswerRecordV4 | ReturnType<typeof createHopV55PropertyAdviceAnswerRecordV3>;
  id: string;
  readingContext?: HopV55PropertyAdviceV4ReadingContext;
}): HopV55PropertyAdviceCorrectionV4Draft {
  const context = input.readingContext ?? readingContext(input.journey.v3Draft.requestSnapshot);
  const preparationReference = hopV55PropertyAdvicePreparedReferenceV4({ prepared: input.journey.prepared,
    readingContext: context, ledger: input.ledger });
  return {
    format: HOP_V55_PROPERTY_ADVICE_ANSWER_RECORD_V4_FORMAT,
    id: input.id, ownerKey, workspaceId, sourceReadingReference: input.journey.archive.contentReference,
    originalQuestion: question,
    transition: { actId: input.actId, kind: input.kind,
      ...(input.parent ? { parentRecordReference: input.parent.reference, parentReadingReference: input.parent.sourceReadingReference } : {}),
      reason: `Transition ${input.kind} explicite de fixture.`, actor: { origin: 'user', label: 'Brasseur fixture' },
      recordedAt: '2026-10-03T18:02:00.000Z' },
    ledger: input.ledger,
    preparation: { preparedReference: preparationReference, source: structuredClone(input.journey.archive.source) },
    readingContext: context,
  };
}

function buildV3AnswerForLedger(journey: ReturnType<typeof createJourney>, ledger: HopV55PropertyAdviceAnnotationLedgerV1,
  context: HopV55PropertyAdviceV4ReadingContext, requestId: string) {
  const latest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of ledger.entries) latest.set(entry.annotationId, entry);
  const propertyIntents = ledger.sourceAnnotations.flatMap(annotation => {
    const entry = latest.get(annotation.id);
    return entry?.disposition === 'active' && entry.activeIntent ? [structuredClone(entry.activeIntent)] : [];
  });
  if (!propertyIntents.length) throw new Error('Une réponse V3 exige des annotations actives.');
  const materials = scopeHopV55PropertyAdviceMaterials(journey.prepared, context.candidatePolicy, propertyIntents);
  const requestSnapshot: HopPropertyAdviceRequestV3 = { format: 'hop-documentary-request-v3', id: requestId,
    originalQuestion: question, interpretation: structuredClone(context.interpretation), propertyIntents,
    candidatePolicy: structuredClone(context.candidatePolicy), context: structuredClone(context.context),
    exclusions: structuredClone(context.exclusions), materials };
  assertHopPropertyAdviceRequestV3(requestSnapshot);
  const preparedReference = hopV55PropertyAdvicePreparedReferenceV4({ prepared: journey.prepared,
    readingContext: context, ledger });
  const draftBody = { format: 'hop-v55-property-advice-request-draft-v3' as const, id: requestId,
    ownerKey, workspaceId, sourceReadingReference: journey.archive.contentReference,
    preparedReference, requestSnapshot };
  const requestDraftReference = hopV55PropertyAdviceRequestDraftReferenceV3(draftBody);
  const answerSnapshot = buildHopPropertyAdviceV3(requestSnapshot);
  return { preparedReference, requestDraftReference, answerSnapshot, answerReference: answerSnapshot.reference };
}

function v4AllRejected(journey: ReturnType<typeof createJourney>) {
  const transition: HopV55PropertyAdviceV4Transition = { actId: 'act-v4-upgrade-reject', kind: 'upgradeV3',
    parentRecordReference: journey.v3Record.reference, parentReadingReference: journey.v3Record.sourceReadingReference,
    reason: 'Upgrade explicite de fixture et rejet individuel des annotations.',
    actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt: '2026-10-03T18:02:00.000Z' };
  const ledger = rejectAll(initialLedger(journey.v3Draft.requestSnapshot.propertyIntents, transition.actId, transition.recordedAt),
    transition.actId, '2026-10-03T18:02:00.000Z');
  const draft = draftV4Record({ journey, ledger, actId: transition.actId, kind: 'upgradeV3', parent: journey.v3Record, id: 'answer-v4-all-rejected' });
  const record = createHopV55PropertyAdviceAnswerRecordV4({ draft, outcome: { kind: 'allRejected' } });
  return { record, transition, ledger };
}

function v4WithExplicitAddition(journey: ReturnType<typeof createJourney>) {
  const actId = 'act-v4-explicit-addition';
  const base = initialLedger(journey.v3Draft.requestSnapshot.propertyIntents, actId, '2026-10-03T18:02:00.000Z');
  const start = question.indexOf('houblon de jardin');
  const added: HopPropertyAdviceIntentV3 = { id: 'annotation-v4-garden-character', property: 'materialCharacter',
    label: 'houblon de jardin', role: 'investigation', direction: 'investigate', qualification: null, required: true,
    comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
    subject: { kind: 'material', label: 'houblon de jardin', materialId: null, sensoryContext: 'unspecified' },
    sourceSpans: [{ start, end: start + 'houblon de jardin'.length, text: 'houblon de jardin' }],
    interpretationOrigin: 'user', basis: 'Caractérisation ajoutée explicitement; aucune identité ou analyse n’est postulée.', relatedIntentIds: [] };
  const entry = sealHopV55PropertyAdviceLedgerEntryV1({ entryId: 'entry-v4-garden-add', annotationId: added.id,
    sourceAnnotation: added, sourceKind: 'added', additionActId: actId, sourceQuestionReference: journey.archive.contentReference,
    disposition: 'active', activeIntent: added,
    decision: { kind: 'add', actId, reason: 'Ajout explicite de la caractérisation du houblon personnel.',
      recordedAt: '2026-10-03T18:02:00.000Z', recordedBy: { origin: 'user', label: 'Brasseur fixture' } } });
  const ledger = sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: [...base.sourceAnnotations, added],
    entries: [...base.entries, entry], originalQuestion: question });
  return v4DomainAnswerFromLedger(journey, ledger, { id: 'answer-v4-explicit-addition', actId, kind: 'create' }).record;
}

function v4DomainAnswerFromLedger(journey: ReturnType<typeof createJourney>, ledger: HopV55PropertyAdviceAnnotationLedgerV1,
  input: { id: string; actId: string; kind: HopV55PropertyAdviceV4Transition['kind']; parent?: HopV55PropertyAdviceAnswerRecordV4 | ReturnType<typeof createHopV55PropertyAdviceAnswerRecordV3> }) {
  const context = readingContext(journey.v3Draft.requestSnapshot);
  const built = buildV3AnswerForLedger(journey, ledger, context, `request-${input.id}`);
  const draft = draftV4Record({ journey, ledger, actId: input.actId, kind: input.kind, parent: input.parent,
    id: input.id, readingContext: context });
  const record = createHopV55PropertyAdviceAnswerRecordV4({ draft, outcome: { kind: 'domainAnswer',
    requestDraftReference: built.requestDraftReference, answerSnapshot: built.answerSnapshot,
    answerReference: built.answerReference } });
  return { record, answer: built.answerSnapshot };
}

describe('Records documentaire V4 : ledger, issue et tête source', () => {
  it('archive allRejected avec contexte de lecture mais sans snapshot domaine ni dossier', () => {
    const journey = createJourney();
    const { record } = v4AllRejected(journey);
    const read = readHopV55PropertyAdviceAnswerRecordV4(record);
    expect(read).toMatchObject({ status: 'readOnly', record: { outcome: { kind: 'allRejected' } } });
    if (read.status !== 'readOnly') throw new Error('Record V4 courant attendu.');
    expect(read.record).toHaveProperty('readingContext.context');
    expect(read.record).not.toHaveProperty('answerSnapshot');
    expect(read.record).not.toHaveProperty('requestSnapshot');
    expect(() => createHopV55PropertyAdviceDossierRecordV4({ answerRecord: record, dossierId: 'dossier-v4-none',
      expectedAnswerReference: 'none', expectedInterpretationReference: 'none', strategyId: 'none', expectedStrategyReference: 'none',
      motive: 'Aucune issue domainAnswer.', createdAt: '2026-10-03T18:03:00.000Z', createdBy: { origin: 'user', label: 'Fixture' } }))
      .toThrow(/allRejected/i);
    expect(readHopV55DocumentaryAnswerRecord(record)).toMatchObject({ status: 'readOnly', version: 'v4' });
    expect(readHopV55PropertyAdviceAnswerRecordV3(record)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: record });
  });

  it('ne laisse pas un outcome domainAnswer diverger de la projection active du ledger ni du readingContext', () => {
    const journey = createJourney();
    const ledger = initialLedger(journey.v3Draft.requestSnapshot.propertyIntents, 'act-v4-create', '2026-10-03T18:02:00.000Z');
    const { record, answer } = v4DomainAnswerFromLedger(journey, ledger, { id: 'answer-v4-domain', actId: 'act-v4-create', kind: 'create' });
    const read = readHopV55PropertyAdviceAnswerRecordV4(record);
    expect(read).toMatchObject({ status: 'readOnly' });
    expect(answer.requestSnapshot.propertyIntents).toEqual(ledger.sourceAnnotations);

    const tampered = structuredClone(record);
    if (tampered.outcome.kind !== 'domainAnswer') throw new Error('Issue domainAnswer attendue.');
    tampered.outcome.answerSnapshot.requestSnapshot.propertyIntents[0].label = 'correction sans entrée ledger';
    expect(() => readHopV55PropertyAdviceAnswerRecordV4(tampered)).toThrow();
    const readingContextTamper = structuredClone(record);
    readingContextTamper.readingContext.interpretation.text = 'Interpretation modifiée sans journal.';
    expect(() => readHopV55PropertyAdviceAnswerRecordV4(readingContextTamper)).toThrow();
  });

  it('refuse les pertes, IDs/span altérés, ajout non tracé et liens actifs vers des dispositions rejetées', () => {
    const journey = createJourney();
    const intents = journey.v3Draft.requestSnapshot.propertyIntents;
    const ledger = initialLedger(intents, 'act-ledger-test', '2026-10-03T18:02:00.000Z');
    const missing = { ...ledger, sourceAnnotations: ledger.sourceAnnotations.slice(1) };
    expect(() => readHopV55PropertyAdviceAnnotationLedgerV1(missing, question)).toThrow();

    const spanTamper = structuredClone(ledger);
    spanTamper.sourceAnnotations[0].sourceSpans[0].start += 1;
    expect(() => readHopV55PropertyAdviceAnnotationLedgerV1(spanTamper, question)).toThrow();

    const forgedAdd = initialLedger([{ ...intents[0], id: 'added-without-act' }], 'different-act', '2026-10-03T18:02:00.000Z');
    const forged = structuredClone(forgedAdd);
    forged.entries[0].sourceKind = 'added';
    forged.entries[0].additionActId = 'other-act';
    forged.entries[0].sourceQuestionReference = 'reading:wrong';
    expect(() => readHopV55PropertyAdviceAnnotationLedgerV1(forged, question)).toThrow();

    const sweetness = intents.find(intent => intent.property === 'sweetness');
    const compensation = intents.find(intent => intent.investigation?.kind === 'comparePerceptualCompensation');
    if (sweetness && compensation) {
      const linkedActive = structuredClone(compensation);
      linkedActive.relatedIntentIds = [sweetness.id];
      linkedActive.investigation = { kind: 'comparePerceptualCompensation', observationIntentIds: [sweetness.id] };
      const sourceAnnotations = [sweetness, linkedActive];
      const initial = initialLedger(sourceAnnotations, 'act-link-test', '2026-10-03T18:02:00.000Z');
      const firstEntries = initial.entries;
      const rejectedSweetness = sealHopV55PropertyAdviceLedgerEntryV1({ entryId: 'entry-reject-sweet', annotationId: sweetness.id,
        sourceAnnotation: sweetness, sourceKind: 'initial', disposition: 'rejected', decision: { kind: 'reject', actId: 'act-link-test',
          reason: 'Constat retiré explicitement.', recordedAt: '2026-10-03T18:03:00.000Z',
          recordedBy: { origin: 'user', label: 'Fixture' }, predecessorEntryReference: firstEntries.find(entry => entry.annotationId === sweetness.id)!.reference } });
      const badLedgerBody = { format: HOP_V55_PROPERTY_ADVICE_ANNOTATION_LEDGER_V1_FORMAT, sourceAnnotations,
        entries: [...firstEntries, rejectedSweetness], reference: '' };
      const badLedger = { ...badLedgerBody, reference: hopV55PropertyAdviceAnnotationLedgerReferenceV1(badLedgerBody) };
      expect(() => readHopV55PropertyAdviceAnnotationLedgerV1(badLedger, question)).toThrow(/rejetée|absente/i);
    }
  });

  it('conserve explicitement les additions et distingue les formats V4 futurs', async () => {
    const journey = createJourney();
    const base = journey.v3Draft.requestSnapshot.propertyIntents[0];
    const additionStart = question.indexOf('houblon de jardin');
    const added: HopPropertyAdviceIntentV3 = { id: 'explicit-added-annotation', property: 'materialCharacter', label: 'houblon de jardin',
      role: 'investigation', direction: 'investigate', qualification: null, required: true,
      comparisonBasis: { kind: 'none', assertionIds: [] }, metric: 'unspecified',
      subject: { kind: 'material', label: 'houblon de jardin', materialId: null, sensoryContext: 'unspecified' },
      sourceSpans: [{ start: additionStart, end: additionStart + 'houblon de jardin'.length, text: 'houblon de jardin' }],
      interpretationOrigin: 'user', basis: 'Caractérisation explicitement ajoutée depuis le fragment exact, sans identité ni analyse.', relatedIntentIds: [] };
    const transition: HopV55PropertyAdviceV4Transition = { actId: 'act-add', kind: 'create', reason: 'Ajout explicite de fixture.',
      actor: { origin: 'user', label: 'Fixture' }, recordedAt: '2026-10-03T18:02:00.000Z' };
    const active = initialLedger([base], transition.actId, transition.recordedAt);
    const addEntry = sealHopV55PropertyAdviceLedgerEntryV1({ entryId: 'entry-explicit-add', annotationId: added.id,
      sourceAnnotation: added, sourceKind: 'added', additionActId: transition.actId,
      sourceQuestionReference: journey.archive.contentReference, disposition: 'active', activeIntent: added,
      decision: { kind: 'add', actId: transition.actId, reason: 'Ajout d’une annotation explicite.',
        recordedAt: transition.recordedAt, recordedBy: transition.actor } });
    const ledger = sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: [...active.sourceAnnotations, added],
      entries: [...active.entries, addEntry], originalQuestion: question });
    expect(readHopV55PropertyAdviceAnnotationLedgerV1(ledger, question)).toMatchObject({ status: 'readOnly' });
    const bad = structuredClone(ledger);
    bad.entries.at(-1)!.sourceQuestionReference = 'reading:foreign';
    expect(() => readHopV55PropertyAdviceAnnotationLedgerV1(bad, question)).toThrow();

    const goodRecord = v4DomainAnswerFromLedger(journey, ledger, { id: 'answer-v4-added', actId: transition.actId, kind: 'create' }).record;
    const goodDatabase = new MemoryDatabase();
    const goodRepository = createHopV55WorkspaceRepository({ ownerKey, database: goodDatabase });
    await goodRepository.save(journey.workspace, null);
    const archiveCas = await goodRepository.read(ownerKey, workspaceId);
    if (!archiveCas) throw new Error('Archive source enregistrée attendue.');
    const goodSaved = await goodRepository.save({ ...archiveCas, documentaryAnswers: [goodRecord] }, archiveCas.revision);
    expect(readHopV55DocumentaryAnswerRecord(goodSaved.documentaryAnswers?.[0])).toMatchObject({ status: 'readOnly', version: 'v4' });

    const badEntry = sealHopV55PropertyAdviceLedgerEntryV1({ ...addEntry, reference: undefined,
      sourceQuestionReference: 'reading:foreign' } as unknown as Omit<HopV55PropertyAdviceLedgerEntryV1, 'reference'>);
    const badLedger = sealHopV55PropertyAdviceAnnotationLedgerV1({ sourceAnnotations: [...active.sourceAnnotations, added],
      entries: [...active.entries, badEntry], originalQuestion: question });
    const badRecord = v4DomainAnswerFromLedger(journey, badLedger, { id: 'answer-v4-add-foreign-source', actId: transition.actId,
      kind: 'create' }).record;
    const badDatabase = new MemoryDatabase();
    const badRepository = createHopV55WorkspaceRepository({ ownerKey, database: badDatabase });
    await badRepository.save(journey.workspace, null);
    const badArchiveCas = await badRepository.read(ownerKey, workspaceId);
    if (!badArchiveCas) throw new Error('Archive source enregistrée attendue.');
    await expect(badRepository.save({ ...badArchiveCas, documentaryAnswers: [badRecord] }, badArchiveCas.revision))
      .rejects.toMatchObject({ code: 'invalidInput' });

    const future = { ...v4AllRejected(journey).record, format: 'hop-v55-documentary-answer-record-v5' };
    const futureRead = readHopV55PropertyAdviceAnswerRecordV4(future);
    expect(futureRead).toMatchObject({ status: 'unsupportedReadOnly', snapshot: future });
    expect(readHopV55DocumentaryAnswerRecord(future)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: future });
  });

  it('réexamine sur une autre archive de lecture sans réancrer l’acte d’ajout antérieur', async () => {
    const journey = createJourney();
    const recordA = v4WithExplicitAddition(journey);
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const opened = await repository.save(journey.workspace, null);
    const withA = await repository.save({ ...opened, documentaryAnswers: [recordA] }, opened.revision);
    const archiveB = createHopV55DecisionReadingArchiveV2({ id: 'reading-property-v4-reexamine-b', ownerKey, workspaceId,
      recordedAt: '2026-10-03T18:06:00.000Z', reading: journey.reading,
      source: structuredClone(journey.archive.source), runtimeReference: 'runtime-property-v4-reexamine-b' });
    const withArchiveB = await repository.save({ ...withA, decisionReadings: [...(withA.decisionReadings ?? []), archiveB] }, withA.revision);
    const journeyB = { ...journey, archive: archiveB };
    const transition: HopV55PropertyAdviceV4Transition = { actId: 'act-v4-reexamine-b', kind: 'reexamine',
      parentRecordReference: recordA.reference, parentReadingReference: journey.archive.contentReference,
      reason: 'Réexamen explicite sur une archive de lecture distincte.', actor: { origin: 'user', label: 'Brasseur fixture' },
      recordedAt: '2026-10-03T18:07:00.000Z' };
    const reexamined = v4DomainAnswerFromLedger(journeyB, recordA.ledger,
      { id: 'answer-v4-reexamined-b', actId: transition.actId, kind: 'reexamine', parent: recordA });
    const sourceAddition = recordA.ledger.entries.find(entry => entry.sourceKind === 'added');
    const retainedAddition = reexamined.record.ledger.entries.find(entry => entry.sourceKind === 'added');
    expect(sourceAddition?.sourceQuestionReference).toBe(journey.archive.contentReference);
    expect(retainedAddition?.sourceQuestionReference).toBe(journey.archive.contentReference);
    expect(reexamined.record.sourceReadingReference).toBe(archiveB.contentReference);
    expect(reexamined.record.transition.parentRecordReference).toBe(recordA.reference);
    expect(await repository.save({ ...withArchiveB, documentaryAnswers: [...(withArchiveB.documentaryAnswers ?? []), reexamined.record] },
      withArchiveB.revision)).toMatchObject({ documentaryAnswers: [recordA, reexamined.record] });
  });

  it('persiste V3→allRejected comme tête, restaure par nouvelle révision V4 et lie le dossier V4 au ledger exact', async () => {
    const journey = createJourney();
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const opened = await repository.save(journey.workspace, null);
    const withV3 = await repository.save({ ...opened, documentaryAnswers: [journey.v3Record] }, opened.revision);
    const rejected = v4AllRejected(journey);
    const withRejected = await repository.save({ ...withV3, documentaryAnswers: [journey.v3Record, rejected.record] }, withV3.revision);
    expect(withRejected.documentaryAnswers).toHaveLength(2);
    expect(readHopV55DocumentaryAnswerRecord(withRejected.documentaryAnswers![1])).toMatchObject({ status: 'readOnly', version: 'v4',
      record: { outcome: { kind: 'allRejected' } } });
    expect(readHopV55PropertyAdviceAnswerRecordV3(withRejected.documentaryAnswers![0])).toMatchObject({ status: 'readOnly', record: journey.v3Record });

    const nextV3Draft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: journey.reading, prepared: journey.prepared,
      requestId: 'request-v3-after-all-rejected', ownerKey, workspaceId,
      sourceReadingReference: journey.archive.contentReference, candidatePolicy });
    const nextV3 = createHopV55PropertyAdviceAnswerRecordV3({ draft: nextV3Draft, prepared: journey.prepared,
      answerSnapshot: buildHopPropertyAdviceV3(nextV3Draft.requestSnapshot), answerRecordId: 'answer-v3-after-all-rejected' });
    await expect(repository.save({ ...withRejected, documentaryAnswers: [...withRejected.documentaryAnswers!, nextV3] }, withRejected.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });

    const restoredLedger = restoreAll(rejected.record.ledger, 'act-v4-restore-all', '2026-10-03T18:04:00.000Z');
    const restored = v4DomainAnswerFromLedger(journey, restoredLedger, { id: 'answer-v4-restored', actId: 'act-v4-restore-all',
      kind: 'revise', parent: rejected.record });
    const withRestored = await repository.save({ ...withRejected,
      documentaryAnswers: [...withRejected.documentaryAnswers!, restored.record] }, withRejected.revision);
    expect(withRestored.documentaryAnswers).toHaveLength(3);
    expect((withRestored.documentaryAnswers![1] as HopV55PropertyAdviceAnswerRecordV4).outcome.kind).toBe('allRejected');
    expect((withRestored.documentaryAnswers![2] as HopV55PropertyAdviceAnswerRecordV4).outcome.kind).toBe('domainAnswer');
    expect(withRestored.documentaryAnswers![1]).toEqual(rejected.record);

    if (restored.record.outcome.kind !== 'domainAnswer') throw new Error('Réponse domaine V4 restaurée attendue.');
    const strategy = restored.record.outcome.answerSnapshot.strategies[0];
    if (!strategy) throw new Error('Stratégie exacte requise pour le dossier documentaire V4.');
    const dossier = createHopV55PropertyAdviceDossierRecordV4({ answerRecord: restored.record, dossierId: 'dossier-v4-restored',
      expectedAnswerReference: restored.record.outcome.answerReference,
      expectedInterpretationReference: restored.record.outcome.answerSnapshot.interpretationReference,
      strategyId: strategy.id, expectedStrategyReference: strategy.reference,
      motive: 'Choix synthétique d’une stratégie de la réponse V4 restaurée.',
      createdAt: '2026-10-03T18:05:00.000Z', createdBy: { origin: 'user', label: 'Brasseur fixture' } });
    const completed = await repository.save({ ...withRestored, documentaryDossiers: [dossier] }, withRestored.revision);
    const dossierRead = readHopV55DocumentaryDossierRecord(completed.documentaryDossiers?.[0]);
    expect(dossierRead).toMatchObject({ status: 'readOnly', version: 'v4', record: {
      answerRecordReference: restored.record.reference, answerReference: restored.record.outcome.answerReference,
      ledgerReference: restored.record.ledger.reference, strategyId: strategy.id,
    } });
  });

  it('préserve une enveloppe V5 brute et bloque tout ancien writer après cette tête future', async () => {
    const journey = createJourney();
    const database = new MemoryDatabase();
    const repository = createHopV55WorkspaceRepository({ ownerKey, database });
    const opened = await repository.save(journey.workspace, null);
    const withV3 = await repository.save({ ...opened, documentaryAnswers: [journey.v3Record] }, opened.revision);
    const rejected = v4AllRejected(journey);
    const withV4 = await repository.save({ ...withV3, documentaryAnswers: [journey.v3Record, rejected.record] }, withV3.revision);
    const future = { format: 'hop-v55-documentary-answer-record-v5', id: 'answer-v5-future', ownerKey, workspaceId,
      sourceReadingReference: journey.archive.contentReference, reference: 'opaque-v5-reference', payload: { unchanged: ['v5', null] } };
    const stored = { ...withV4, revision: withV4.revision + 1,
      documentaryAnswers: [...withV4.documentaryAnswers!, future] };
    const row: HopV55WorkspaceEnvelopeV1 = { format: 'hop-v55-workspace-envelope-v1', ownerKey, workspaceId,
      revision: stored.revision, workspace: stored };
    database.workspaces.rows.set(JSON.stringify([ownerKey, workspaceId]), structuredClone(row));
    const read = await repository.read(ownerKey, workspaceId);
    if (!read) throw new Error('Workspace historique V5 seedé attendu.');
    expect(read.documentaryAnswers?.at(-1)).toEqual(future);
    expect(readHopV55DocumentaryAnswerRecord(future)).toMatchObject({ status: 'unsupportedReadOnly', snapshot: future,
      reason: expect.any(String) });
    const unrelated = await repository.save({ ...read, title: 'Édition sans interpréter V5' }, read.revision);
    expect(unrelated.documentaryAnswers?.at(-1)).toEqual(future);
    await expect(repository.save({ ...unrelated, documentaryAnswers: [...(unrelated.documentaryAnswers ?? []), journey.v3Record] }, unrelated.revision))
      .rejects.toMatchObject({ code: 'unsupportedFormat' });
  });
});
