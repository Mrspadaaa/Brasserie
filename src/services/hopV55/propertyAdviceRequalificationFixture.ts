import type { BrewerContext } from '../../../functions/src/companionTypes';
import { buildHopPropertyAdviceV3 } from '../../domain/hopDecision/propertyAdvice';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { readHopV55DecisionReadingArchive, createHopV55DecisionReadingArchiveV2 } from './decisionArchive';
import { readHopV55DocumentaryAnswerRecord } from './documentaryRecords';
import { readHopV55Question } from './decision';
import { hopV55ScenarioRuntimeReference } from './scenarioCommit';
import { prepareHopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';
import { readHopV55PropertyAdviceAnswerRecordV4, createHopV55PropertyAdviceAnswerRecordV4 } from './propertyAdviceRecordsV4';
import { createHopV55PropertyAdviceAnswerRecordV3 } from './propertyAdviceRecordsV3';
import { upgradeV3ToV4 } from './propertyAdvicePreparationV4';
import { ensureHopV55ReferenceJournal } from './referenceWorkspace';
import type { HopV55Workspace, HopV55WorkspaceRepository } from './contracts';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';

export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_FIXTURE_SEED = 'requalificationContext' as const;
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID = 'workspace:property-advice-requalification-v4';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID = 'hop-v55-fixture-recipe-planning';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_READING_ID = 'reading:requalification-parent';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_SOURCE_ANSWER_ID = 'answer:requalification-parent-v3';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_ANSWER_ID = 'answer:requalification-parent-v4';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION = 'Ma bière est trop sucrée, comment compenser ça avec le houblon ?';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE = 2.5;
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_CURRENT_VALUE = 3.25;
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT = 'point-fixture';
export const HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE =
  'Fixture synthétique · requalification d’une baseline historique point-fixture';

const recordedAt = '2026-10-03T18:00:00.000Z';
const parentJournalRevision = 1;
const currentJournalRevision = 2;
const policy = { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière choisie dans cette fixture synthétique.' };

export interface HopV55PropertyAdviceRequalificationFixtureSeedResult {
  workspace: HopV55Workspace;
  /** The active planning source: exact same Recipe ID, with only the fixture reading updated. */
  currentContext: BrewerContext;
  sourceRecipeId: string;
  created: boolean;
}

export function makeHopV55PropertyAdviceRequalificationCurrentContext(baseContext: BrewerContext): BrewerContext {
  if (baseContext.recipe?.id !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID) {
    throw new Error(`Le seed de requalification exige la recette fixture exacte ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID}.`);
  }
  const context = structuredClone(baseContext);
  context.journal = { ...(context.journal ?? {}), revision: currentJournalRevision,
    readings: [{ kind: 'sweetness', value: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_CURRENT_VALUE,
      unit: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT }] };
  context.provenance = [...context.provenance,
    `Fixture synthétique de requalification : source courante ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_CURRENT_VALUE} ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT}; le parent historique garde ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE} ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT}.`];
  return context;
}

function makeParentContext(baseContext: BrewerContext): BrewerContext {
  const context = makeHopV55PropertyAdviceRequalificationCurrentContext(baseContext);
  context.journal = { ...(context.journal ?? {}), revision: parentJournalRevision,
    readings: [{ kind: 'sweetness', value: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE,
      unit: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT }] };
  context.provenance = [...context.provenance,
    `Parent historique de fixture; la valeur ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE} ${HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT} est synthétique et n’est pas une mesure de brasseur.`];
  return context;
}

function sourceRecipeId(context: BrewerContext): string {
  const recipeId = context.recipe?.id;
  if (typeof recipeId !== 'string' || recipeId !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_RECIPE_ID) {
    throw new Error('Le seed ne substitue jamais une autre identité de recette fixture.');
  }
  return recipeId;
}

function completeSeed(workspace: HopV55Workspace, ownerKey: string, workspaceId: string, recipeId: string): boolean {
  if (workspace.format !== 'hop-v55-workspace-v1' || workspace.id !== workspaceId || workspace.ownerKey !== ownerKey
    || workspace.sourceRecipeId !== recipeId || workspace.title !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE
    || workspace.intent.question !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION) return false;
  const archiveRaw = workspace.decisionReadings?.find(row => row.id === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_READING_ID);
  const archiveRead = archiveRaw && readHopV55DecisionReadingArchive(archiveRaw);
  if (!archiveRead || archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2'
    || archiveRead.archive.source.kind !== 'recipe' || archiveRead.archive.source.id !== recipeId
    || archiveRead.archive.reading.intent.question !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION) return false;
  const sourceRaw = workspace.documentaryAnswers?.find(row => row.id === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_SOURCE_ANSWER_ID);
  const sourceRead = sourceRaw && readHopV55DocumentaryAnswerRecord(sourceRaw);
  if (!sourceRead || sourceRead.status !== 'readOnly' || sourceRead.record.format !== 'hop-v55-documentary-answer-record-v3'
    || sourceRead.record.sourceReadingReference !== archiveRead.archive.contentReference) return false;
  const parentRaw = workspace.documentaryAnswers?.find(row => row.id === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_ANSWER_ID);
  const parentRead = parentRaw && readHopV55PropertyAdviceAnswerRecordV4(parentRaw);
  if (!parentRead || parentRead.status !== 'readOnly' || parentRead.record.sourceReadingReference !== archiveRead.archive.contentReference
    || parentRead.record.transition.parentRecordReference !== sourceRead.record.reference) return false;
  const answer = parentRead.record.outcome.kind === 'domainAnswer' ? parentRead.record.outcome.answerSnapshot : undefined;
  const linked = answer?.requestSnapshot.propertyIntents.find(row => row.role === 'reportedObservation' && row.property === 'sweetness');
  const parentFact = answer?.requestSnapshot.context.assertions.find(row => row.id === 'context-reading-0');
  return !!linked && linked.comparisonBasis.kind === 'current'
    && linked.comparisonBasis.assertionIds.includes('context-reading-0')
    && parentFact?.value === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_VALUE
    && parentFact.unit === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_UNIT;
}

async function readExisting(workspaces: HopV55WorkspaceRepository, ownerKey: string, workspaceId: string): Promise<HopV55Workspace | null> {
  return workspaces.read(ownerKey, workspaceId);
}

async function createBaseWorkspace(input: { ownerKey: string; workspaceId: string; currentContext: BrewerContext;
  currentPrepared: PreparedBrewingScenarioContext; workspaces: HopV55WorkspaceRepository }): Promise<HopV55Workspace> {
  const recipeId = sourceRecipeId(input.currentContext);
  const base: HopV55Workspace = {
    format: 'hop-v55-workspace-v1', id: input.workspaceId, ownerKey: input.ownerKey, revision: 0,
    title: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE,
    intent: { question: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION, criteria: [] },
    sourceRecipeId: recipeId, scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: recordedAt,
  };
  const journalled = ensureHopV55ReferenceJournal(base, input.currentContext, input.currentPrepared);
  try { return await input.workspaces.save(journalled, null); }
  catch (error) {
    if ((error as { code?: string }).code !== 'staleRevision') throw error;
    const raced = await readExisting(input.workspaces, input.ownerKey, input.workspaceId);
    if (raced) return raced;
    throw error;
  }
}

async function updateWorkspace(workspaces: HopV55WorkspaceRepository, ownerKey: string, workspaceId: string,
  update: (workspace: HopV55Workspace) => HopV55Workspace): Promise<HopV55Workspace> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readExisting(workspaces, ownerKey, workspaceId);
    if (!current) throw new Error('Le workspace de requalification a disparu pendant le seed.');
    const next = update(structuredClone(current));
    if (hopDecisionReference(next) === hopDecisionReference(current)) return current;
    try { return await workspaces.save({ ...next, revision: current.revision, updatedAt: recordedAt }, current.revision); }
    catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 3) throw error; }
  }
  throw new Error('Le seed attend une reprise de CAS du workspace fixture.');
}

async function appendExact<T>(input: {
  workspaces: HopV55WorkspaceRepository; ownerKey: string; workspaceId: string; field: 'decisionReadings' | 'documentaryAnswers';
  row: T; rowId: string; rowReference: string;
}): Promise<HopV55Workspace> {
  return updateWorkspace(input.workspaces, input.ownerKey, input.workspaceId, workspace => {
    const rows = (workspace[input.field] ?? []) as Array<{ id: string; reference?: string; contentReference?: string }>;
    const byId = rows.find(row => row.id === input.rowId);
    if (byId) {
      const storedReference = input.field === 'decisionReadings' ? byId.contentReference : byId.reference;
      const stored = storedReference === input.rowReference;
      const samePayload = hopDecisionReference(byId) === hopDecisionReference(input.row);
      if (!stored || !samePayload) throw new Error(`Le seed de requalification a trouvé une identité ${input.rowId} déjà utilisée pour un autre contenu.`);
      return workspace;
    }
    const sameReference = rows.find(row => (input.field === 'decisionReadings' ? row.contentReference : row.reference) === input.rowReference);
    if (sameReference) throw new Error(`La référence ${input.rowReference} appartient déjà à une autre identité.`);
    return { ...workspace, [input.field]: [...rows, structuredClone(input.row)] } as HopV55Workspace;
  });
}

/** Append-only, idempotent fixture seed. A complete reload reads sealed records only; it never reparses or rebuilds them. */
export async function seedHopV55PropertyAdviceRequalificationFixture(input: {
  ownerKey: string;
  workspaces: HopV55WorkspaceRepository;
  baseContext: BrewerContext;
  workspaceId?: string;
}): Promise<HopV55PropertyAdviceRequalificationFixtureSeedResult> {
  const workspaceId = input.workspaceId ?? HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_WORKSPACE_ID;
  const recipeId = sourceRecipeId(input.baseContext);
  const currentContext = makeHopV55PropertyAdviceRequalificationCurrentContext(input.baseContext);
  let workspace = await readExisting(input.workspaces, input.ownerKey, workspaceId);
  if (workspace && workspace.sourceRecipeId !== recipeId) {
    throw new Error(`Le workspace fixture source ${workspace.sourceRecipeId ?? '(absent)'} diffère de Recipe ${recipeId}; aucune substitution n’est faite.`);
  }
  if (workspace && completeSeed(workspace, input.ownerKey, workspaceId, recipeId)) {
    return { workspace, currentContext, sourceRecipeId: recipeId, created: false };
  }

  const currentPrepared = prepareBrewingScenarioContext(currentContext);
  if (!workspace) workspace = await createBaseWorkspace({ ownerKey: input.ownerKey, workspaceId,
    currentContext, currentPrepared, workspaces: input.workspaces });
  if (workspace.ownerKey !== input.ownerKey || workspace.id !== workspaceId
    || workspace.sourceRecipeId !== recipeId) throw new Error('L’identité de workspace/Recipe diffère du seed réservé.');
  if (workspace.intent.question && workspace.intent.question !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION) {
    throw new Error('Le seed ne remplace pas une autre question déjà conservée dans ce workspace.');
  }
  workspace = await updateWorkspace(input.workspaces, input.ownerKey, workspaceId, current => ensureHopV55ReferenceJournal({
    ...current, title: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_TITLE,
    intent: { question: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION, criteria: [] }, sourceRecipeId: recipeId,
  }, currentContext, currentPrepared));

  let archive = workspace.decisionReadings?.find(row => row.id === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_READING_ID);
  let sourceRecord = workspace.documentaryAnswers?.find(row => row.id === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_SOURCE_ANSWER_ID);
  let parentRecord = workspace.documentaryAnswers?.find(row => row.id === HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_ANSWER_ID);

  // When a prefix already exists, reuse its exact archive/records. Only missing
  // suffix entries are constructed, then appended under repository CAS.
  if (!archive) {
    const parentContext = makeParentContext(input.baseContext);
    const parentPrepared = prepareBrewingScenarioContext(parentContext);
    const reading = readHopV55Question(HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION, parentPrepared);
    archive = createHopV55DecisionReadingArchiveV2({ id: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_READING_ID,
      ownerKey: input.ownerKey, workspaceId, recordedAt, reading, source: { kind: 'recipe', id: recipeId },
      runtimeReference: hopV55ScenarioRuntimeReference(parentPrepared.runtime) });
    workspace = await appendExact({ workspaces: input.workspaces, ownerKey: input.ownerKey, workspaceId,
      field: 'decisionReadings', row: archive, rowId: archive.id, rowReference: archive.contentReference });
  } else {
    const read = readHopV55DecisionReadingArchive(archive);
    if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v2'
      || read.archive.reading.intent.question !== HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_QUESTION
      || read.archive.source.kind !== 'recipe' || read.archive.source.id !== recipeId) {
      throw new Error('L’archive parent partielle du seed ne correspond pas à la Recipe fixture exacte.');
    }
  }
  if (!sourceRecord) {
    const parentContext = makeParentContext(input.baseContext);
    const parentPrepared = prepareBrewingScenarioContext(parentContext);
    const archiveRead = readHopV55DecisionReadingArchive(archive);
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw new Error('L’archive V2 de parent n’est pas relisible avant la réponse source.');
    }
    const readingDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: archiveRead.archive.reading,
      prepared: parentPrepared, requestId: 'request:requalification-parent-v3', ownerKey: input.ownerKey, workspaceId,
      sourceReadingReference: archiveRead.archive.contentReference, candidatePolicy: policy });
    const intents = structuredClone(readingDraft.requestSnapshot.propertyIntents);
    const observation = intents.find(row => row.property === 'sweetness' && row.role === 'reportedObservation');
    if (!observation) throw new Error('Le lecteur doit conserver le constat de douceur dans la fixture.');
    observation.comparisonBasis = { kind: 'current', assertionIds: ['context-reading-0'] };
    const linkedDraft = prepareHopV55PropertyAdviceRequestDraftV3({ reading: archiveRead.archive.reading,
      prepared: parentPrepared, requestId: 'request:requalification-parent-v3-linked', ownerKey: input.ownerKey, workspaceId,
      sourceReadingReference: archiveRead.archive.contentReference, candidatePolicy: policy, propertyIntents: intents });
    const answer = buildHopPropertyAdviceV3(linkedDraft.requestSnapshot);
    sourceRecord = createHopV55PropertyAdviceAnswerRecordV3({ draft: linkedDraft, prepared: parentPrepared,
      answerSnapshot: answer, answerRecordId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_SOURCE_ANSWER_ID });
    workspace = await appendExact({ workspaces: input.workspaces, ownerKey: input.ownerKey, workspaceId,
      field: 'documentaryAnswers', row: sourceRecord, rowId: sourceRecord.id, rowReference: sourceRecord.reference });
  } else {
    const read = readHopV55DocumentaryAnswerRecord(sourceRecord);
    if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v3'
      || read.record.sourceReadingReference !== archive.contentReference) {
      throw new Error('La réponse V3 existante du seed ne cite pas l’archive parent exacte.');
    }
  }
  if (!parentRecord) {
    const sourceRead = readHopV55DocumentaryAnswerRecord(sourceRecord);
    if (sourceRead.status !== 'readOnly' || sourceRead.record.format !== 'hop-v55-documentary-answer-record-v3') {
      throw new Error('Le parent V3 exact n’est pas disponible pour créer le record historique V4.');
    }
    const parentContext = makeParentContext(input.baseContext);
    const parentPrepared = prepareBrewingScenarioContext(parentContext);
    const archiveRead = readHopV55DecisionReadingArchive(archive);
    if (archiveRead.status !== 'available' || archiveRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw new Error('L’archive V2 parent exacte n’est pas relisible pour l’upgrade V4.');
    }
    const upgraded = upgradeV3ToV4({ sourceRecord: sourceRead.record, sourceReadingArchive: archiveRead.archive,
      prepared: parentPrepared, recordId: HOP_V55_PROPERTY_ADVICE_REQUALIFICATION_PARENT_ANSWER_ID,
      requestId: 'request:requalification-parent-v4', cultureBinding: null,
      transition: { kind: 'upgradeV3', actId: 'act:requalification-parent-upgrade',
        parentRecordReference: sourceRead.record.reference, parentReadingReference: archiveRead.archive.contentReference,
        reason: 'Version V4 conservée comme parent historique du test de réconciliation.',
        actor: { origin: 'user', label: 'Brasseur fixture' }, recordedAt } });
    if (upgraded.status !== 'ready') throw new Error('La fixture V4 doit conserver la réponse source active.');
    const answer = buildHopPropertyAdviceV3(upgraded.requestDraftV3.requestSnapshot);
    parentRecord = createHopV55PropertyAdviceAnswerRecordV4({ draft: upgraded.recordDraft, outcome: {
      kind: 'domainAnswer', requestDraftReference: upgraded.requestDraftV3.reference,
      answerSnapshot: answer, answerReference: answer.reference,
    } });
    workspace = await appendExact({ workspaces: input.workspaces, ownerKey: input.ownerKey, workspaceId,
      field: 'documentaryAnswers', row: parentRecord, rowId: parentRecord.id, rowReference: parentRecord.reference });
  } else {
    const read = readHopV55PropertyAdviceAnswerRecordV4(parentRecord);
    if (read.status !== 'readOnly' || read.record.sourceReadingReference !== archive.contentReference) {
      throw new Error('La réponse parent V4 existante du seed ne cite pas l’archive exacte.');
    }
  }

  workspace = (await readExisting(input.workspaces, input.ownerKey, workspaceId)) ?? workspace;
  if (!completeSeed(workspace, input.ownerKey, workspaceId, recipeId)) {
    throw new Error('Le workspace de requalification n’a pas atteint son préfixe append-only complet.');
  }
  return { workspace, currentContext, sourceRecipeId: recipeId, created: true };
}
