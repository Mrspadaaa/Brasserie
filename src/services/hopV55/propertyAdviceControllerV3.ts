import type { BrewerContext } from '../../../functions/src/companionTypes';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { buildHopPropertyAdviceV3 } from '../../domain/hopDecision/propertyAdvice';
import type { HopPropertyAdviceAnswerV3, HopPropertyAdviceDossierV3, HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55Services, HopV55Workspace } from './contracts';
import { hopV55DecisionReadingForDisplay, readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingArchive, type HopV55DecisionReadingSource } from './decisionArchive';
import { createHopV55DecisionReadingSuccessorArchiveV1, hopV55SuccessorPreservesParentV1, hopV55SuccessorReadingV1,
  isHopV55StructuredDecisionReadingArchive, type HopV55StructuredDecisionReadingArchive } from './decisionReadingAccessors';
import { prepareHopV55PropertyAdviceFromSemanticReadingV1 } from './propertyAdviceSemanticPreparationV3';
import { readHopV55DocumentaryAnswerRecord } from './documentaryRecords';
import type { HopV55PropertyAdviceAnswerRecordV2 } from './propertyAdviceRecords';
import { createHopV55PropertyAdviceAnswerRecordV3, createHopV55PropertyAdviceDossierRecordV3,
  readHopV55PropertyAdviceDossierRecordV3, type HopV55PropertyAdviceAnswerRecordV3 } from './propertyAdviceRecordsV3';
import { resumeHopV55PropertyAdviceRequestDraft } from './propertyAdvicePreparation';
import { hopV55PropertyAdvicePreparedReferenceV3, prepareHopV55PropertyAdviceRequestDraftV3,
  reconcileHopV55PropertyAdviceRequestDraftV3, reexamineHopV55PropertyAdviceRequestDraftV3,
  resumeHopV55PropertyAdviceRequestDraftV3, reviseHopV55PropertyAdviceRequestDraftV3,
  upgradeHopV55PropertyAdviceRequestDraftV2ToV3, type HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';

export interface HopV55PropertyAdviceReinterpretRequestV3 {
  request: HopPropertyAdviceRequestV3;
  reason: string;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
}
export interface HopV55PropertyAdviceDossierSaveRequestV3 {
  commandId: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
  expectedAnswerRecordReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
}
export type HopV55PropertyAdviceAnswerUpdateV3 = {
  kind: 'revision'; answer: HopPropertyAdviceAnswerV3; answerRecordReference: string;
} | {
  kind: 'reexamination'; answer: HopPropertyAdviceAnswerV3; answerRecordReference: string;
  source: { answerRecordReference: string; answerReference: string; interpretationReference: string; requestId: string };
};

/** The host owns navigation, generation checks and the concrete workspace DAO. */
export interface HopV55PropertyAdviceHostV3 {
  services: Pick<HopV55Services, 'ownerKey' | 'scope'>;
  enabled(): boolean;
  historical(): boolean;
  reading(): HopV55DecisionReadingArchive | undefined;
  context(): Promise<BrewerContext>;
  workspace(): Promise<HopV55Workspace>;
  save(next: HopV55Workspace): Promise<HopV55Workspace>;
  source(workspace: HopV55Workspace): HopV55DecisionReadingSource;
  runtimeReference(prepared: PreparedBrewingScenarioContext): string;
  selected(record: HopV55PropertyAdviceAnswerRecordV3): void;
  activated(archive: HopV55StructuredDecisionReadingArchive, record: HopV55PropertyAdviceAnswerRecordV3): void;
}

const clone = <T,>(value: T): T => structuredClone(value);
const uid = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;
const now = () => new Date().toISOString();
const same = (a: unknown, b: unknown) => hopDecisionReference(a) === hopDecisionReference(b);
const stale = (error: unknown) => (error as { code?: string }).code === 'staleRevision';

/** V3 actions build once, then persist the same sealed object during CAS retries. */
export function createHopV55PropertyAdviceControllerV3(host: HopV55PropertyAdviceHostV3) {
  const actor = () => ({ origin: host.services.scope === 'fixture' ? 'fixture' as const : 'user' as const, label: 'Brasseur' });
  function enabled() {
    if (!host.enabled()) throw Error('Le conseil par propriétés V3 attend sa réception.');
  }
  function workspaceScope(workspace: HopV55Workspace, expectedId?: string) {
    if (workspace.ownerKey !== host.services.ownerKey || (expectedId && workspace.id !== expectedId)) {
      throw Error('Le dossier ou son profil a changé pendant cette action.');
    }
  }
  function reading(workspace: HopV55Workspace, reference: string) {
    const raw = workspace.decisionReadings?.find(row => row.contentReference === reference);
    const decoded = raw && readHopV55DecisionReadingArchive(raw);
    if (!decoded || decoded.status !== 'available') {
      throw Error('La lecture structurée exacte doit rester disponible (V2/V3/V4).');
    }
    if (isHopV55StructuredDecisionReadingArchive(decoded.archive)) return decoded.archive;
    throw Error('La lecture structurée exacte doit rester disponible (V2/V3/V4).');
  }
  async function persist(record: HopV55PropertyAdviceAnswerRecordV3) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); workspaceScope(latest, record.workspaceId);
      const existing = latest.documentaryAnswers?.find(row => row.id === record.id);
      if (existing) {
        const decoded = readHopV55DocumentaryAnswerRecord(existing);
        if (decoded.status !== 'readOnly' || decoded.record.reference !== record.reference) {
          throw Error('Cette identité de réponse contient un autre contenu.');
        }
        host.selected(record); return;
      }
      const prepared = prepareBrewingScenarioContext(await host.context());
      if (record.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(prepared, record.answerSnapshot.requestSnapshot)
        || !same(reading(latest, record.sourceReadingReference).source, host.source(latest))) {
        throw Error('La source ou sa préparation a changé avant la sauvegarde. Réexamine la demande.');
      }
      try {
        await host.save({ ...latest, documentaryAnswers: [...(latest.documentaryAnswers ?? []), record], updatedAt: now() });
        host.selected(record); return;
      } catch (error) { if (!stale(error) || attempt === 2) throw error; }
    }
  }
  async function current(expectedRecord: string, expectedAnswer: string, expectedInterpretation: string) {
    enabled();
    if (host.historical()) throw Error('Cette réponse est en lecture seule. Réexamine sa demande avant de la corriger.');
    const workspace = await host.workspace(); workspaceScope(workspace);
    const archive = host.reading();
    const raw = [...(workspace.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === archive?.contentReference);
    const decoded = raw && readHopV55DocumentaryAnswerRecord(raw);
    if (!decoded || decoded.status !== 'readOnly' || decoded.record.format !== 'hop-v55-documentary-answer-record-v3'
      || decoded.record.reference !== expectedRecord || decoded.record.answerReference !== expectedAnswer
      || decoded.record.answerSnapshot.interpretationReference !== expectedInterpretation) {
      throw Error('Cette réponse V3 ou son interprétation n’est plus la tête exacte de la lecture.');
    }
    return { workspace, record: decoded.record };
  }
  async function prepare(archive: HopV55DecisionReadingArchive, prepared: PreparedBrewingScenarioContext) {
    enabled();
    const workspace = await host.workspace(); workspaceScope(workspace);
    if (!isHopV55StructuredDecisionReadingArchive(archive)) {
      throw Error('Une lecture structurée V2/V3/V4 est nécessaire.');
    }
    const stored = reading(workspace, archive.contentReference);
    if (stored.runtimeReference !== host.runtimeReference(prepared) || !same(stored.source, host.source(workspace))) {
      throw Error('La lecture n’appartient plus à la préparation active.');
    }
    const identity = { requestId: uid('property-request-v3'), ownerKey: host.services.ownerKey, workspaceId: workspace.id,
      sourceReadingReference: stored.contentReference,
      candidatePolicy: { kind: 'explicit' as const, materialIds: [], basis: 'Aucune matière n’a encore été choisie. La recherche reste un geste explicite.' } };
    // A semantic reading goes through its typed adapter; historical readings keep their mapper.
    const draft = stored.format === 'hop-v55-decision-reading-v4'
      ? prepareHopV55PropertyAdviceFromSemanticReadingV1({ reading: stored.reading, prepared, ...identity })
      : prepareHopV55PropertyAdviceRequestDraftV3({ reading: hopV55DecisionReadingForDisplay(stored), prepared, ...identity });
    const record = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot: buildHopPropertyAdviceV3(draft.requestSnapshot),
      answerRecordId: uid('property-answer-v3') });
    await persist(record); return record;
  }
  async function reexamine(recordId: string, expectedReference: string, reconciliation?: HopV55PropertyAdviceReinterpretRequestV3): Promise<HopV55PropertyAdviceAnswerUpdateV3> {
    enabled();
    const workspace = await host.workspace(); workspaceScope(workspace);
    const raw = workspace.documentaryAnswers?.find(row => row.id === recordId);
    const decoded = raw && readHopV55DocumentaryAnswerRecord(raw);
    if (!decoded || decoded.status !== 'readOnly' || decoded.record.format !== 'hop-v55-documentary-answer-record-v3'
      || decoded.record.reference !== expectedReference) throw Error('La réponse source n’est plus disponible sous sa référence exacte.');
    const source = decoded.record;
    const oldArchive = reading(workspace, source.sourceReadingReference);
    const prepared = prepareBrewingScenarioContext(await host.context());
    const nextReading = hopV55SuccessorReadingV1(oldArchive);
    const nextSource = host.source(workspace);
    const runtimeReference = host.runtimeReference(prepared);
    const archiveId = hopAdviceContentReference('hop-v55-property-advice-reexamination-reading-id-v1', {
      sourceAnswerRecordReference: source.reference, sourceReadingReference: oldArchive.contentReference,
      runtimeReference, source: nextSource, reading: nextReading,
    });
    const existingArchiveRaw = workspace.decisionReadings?.find(row => row.id === archiveId);
    const existingArchiveRead = existingArchiveRaw && readHopV55DecisionReadingArchive(existingArchiveRaw);
    let archive: HopV55StructuredDecisionReadingArchive;
    if (existingArchiveRead?.status === 'available') {
      archive = isHopV55StructuredDecisionReadingArchive(existingArchiveRead.archive) ? existingArchiveRead.archive
        : (() => { throw Error('L’archive successorale réutilisée n’est pas une lecture structurée.'); })();
      // The successor keeps the parent format, scopes and lineage; a V3 or V4 parent never yields a downgraded successor.
      if (archive.id !== archiveId || archive.ownerKey !== host.services.ownerKey || archive.workspaceId !== workspace.id
        || archive.runtimeReference !== runtimeReference || !same(archive.source, nextSource) || !same(archive.reading, nextReading)
        || !hopV55SuccessorPreservesParentV1(archive, oldArchive)) {
        throw Error('L’archive successorale persistée ne correspond plus à cette reprise exacte.');
      }
    } else if (existingArchiveRaw) throw Error('L’archive successorale persistée est invalide ou future; elle reste en lecture seule.');
    else {
      archive = createHopV55DecisionReadingSuccessorArchiveV1({ previous: oldArchive, id: archiveId, ownerKey: host.services.ownerKey,
        workspaceId: workspace.id, recordedAt: now(), source: nextSource, runtimeReference, keepProgramPreparation: true });
    }
    const prior: HopV55PropertyAdviceRequestDraftV3 = { format: 'hop-v55-property-advice-request-draft-v3',
      id: source.answerSnapshot.requestSnapshot.id, ownerKey: source.ownerKey, workspaceId: source.workspaceId,
      sourceReadingReference: source.sourceReadingReference, preparedReference: source.preparedReference,
      requestSnapshot: clone(source.answerSnapshot.requestSnapshot), reference: source.requestDraftReference };
    const reason = reconciliation?.reason ?? 'Réexamen explicite des annotations et de leur périmètre dans le contexte actif.';
    const recordedAt = archive.recordedAt;
    const recordedBy = reconciliation ? { origin: 'user' as const, label: 'Brasseur' } : actor();
    const operationKey = hopAdviceContentReference('hop-v55-property-advice-reexamination-record-id-v1', {
      sourceAnswerRecordReference: source.reference, sourceReadingReference: archive.contentReference,
      reconciliation: reconciliation ? { request: reconciliation.request, reason: reconciliation.reason } : null,
    });
    const identity = { requestId: operationKey, sourceReadingReference: archive.contentReference };
    const draft = reconciliation ? reconcileHopV55PropertyAdviceRequestDraftV3({ draft: prior, reading: nextReading, prepared, ...identity,
      propertyIntents: reconciliation.request.propertyIntents, candidatePolicy: reconciliation.request.candidatePolicy,
      interpretation: reconciliation.request.interpretation, reexaminationContext: { reason, recordedAt, recordedBy } })
      : reexamineHopV55PropertyAdviceRequestDraftV3({ draft: prior, reading: nextReading, prepared, ...identity,
        reexaminationContext: { reason, recordedAt, recordedBy } });
    const record = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot: buildHopPropertyAdviceV3(draft.requestSnapshot),
      answerRecordId: operationKey, reexaminationContext: { sourceAnswerRecordReference: source.reference,
        sourceAnswerReference: source.answerReference, sourceReadingReference: source.sourceReadingReference, reason,
        recordedAt: archive.recordedAt, recordedBy } });
    // The reading reference is committed first; the answer record uses a second CAS.
    let archiveStored = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); workspaceScope(latest, record.workspaceId);
      const existingArchiveRaw = latest.decisionReadings?.find(row => row.contentReference === archive.contentReference);
      if (existingArchiveRaw) {
        const read = readHopV55DecisionReadingArchive(existingArchiveRaw);
        if (read.status !== 'available' || read.archive.format !== archive.format || !same(read.archive, archive)) {
          throw Error('La lecture successorale existe sous un contenu différent.');
        }
      } else {
        const fresh = prepareBrewingScenarioContext(await host.context());
        if (record.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(fresh, record.answerSnapshot.requestSnapshot)
          || !same(archive.source, host.source(latest))) throw Error('Le contexte a changé avant le staging de la nouvelle archive.');
        try {
          await host.save({ ...latest, intent: nextReading.intent,
            decisionReadings: [...(latest.decisionReadings ?? []), archive], updatedAt: now() });
          archiveStored = true;
          break;
        } catch (error) { if (stale(error) && attempt < 2) continue; throw error; }
      }
      archiveStored = true;
      break;
    }
    if (!archiveStored) throw Error('La nouvelle archive attend une reprise de sauvegarde.');
    await persist(record);
    host.activated(archive, record);
    return { kind: 'reexamination', answer: record.answerSnapshot, answerRecordReference: record.reference,
      source: { answerRecordReference: source.reference, answerReference: source.answerReference,
        interpretationReference: source.answerSnapshot.interpretationReference, requestId: source.answerSnapshot.requestSnapshot.id } };
  }
  async function reinterpret(request: HopV55PropertyAdviceReinterpretRequestV3): Promise<HopV55PropertyAdviceAnswerUpdateV3> {
    const { record } = await current(request.expectedAnswerRecordReference, request.expectedAnswerReference, request.expectedInterpretationReference);
    const prior = record.answerSnapshot.requestSnapshot;
    if (request.request.id !== prior.id || request.request.originalQuestion !== prior.originalQuestion
      || request.request.context.stage !== prior.context.stage || request.request.context.stageBasis !== prior.context.stageBasis
      || !same(request.request.exclusions, prior.exclusions)
      || !same(request.request.context.assertions.slice(0, prior.context.assertions.length), prior.context.assertions)) {
      throw Error('La question, le stade fourni et les assertions antérieures restent figés.');
    }
    const prepared = prepareBrewingScenarioContext(await host.context());
    if (record.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(prepared, prior)) return reexamine(record.id, record.reference, request);
    const draft = resumeHopV55PropertyAdviceRequestDraftV3({ source: { ownerKey: record.ownerKey, workspaceId: record.workspaceId,
      sourceReadingReference: record.sourceReadingReference, preparedReference: record.preparedReference,
      requestDraftReference: record.requestDraftReference, requestSnapshot: prior }, prepared });
    const added = request.request.context.assertions.slice(prior.context.assertions.length);
    const accessUpdates = (Object.keys(prior.context.access) as Array<keyof typeof prior.context.access>).flatMap(scope =>
      same(prior.context.access[scope], request.request.context.access[scope]) ? [] : [{ scope, access: request.request.context.access[scope],
        assertions: added.filter(assertion => request.request.context.access[scope].assertionIds.includes(assertion.id)) }]);
    if (added.some(assertion => !accessUpdates.some(update => update.assertions.some(row => row.id === assertion.id)))) {
      throw Error('Chaque nouvelle attestation doit être liée à son accès déclaré.');
    }
    const recordedAt = now(); const recordedBy = actor();
    const revised = reviseHopV55PropertyAdviceRequestDraftV3({ draft, prepared, propertyIntents: request.request.propertyIntents,
      candidatePolicy: request.request.candidatePolicy, interpretation: request.request.interpretation, accessUpdates,
      revisionContext: { reason: request.reason, recordedAt, recordedBy } });
    const next = createHopV55PropertyAdviceAnswerRecordV3({ draft: revised, prepared,
      answerSnapshot: buildHopPropertyAdviceV3(revised.requestSnapshot), answerRecordId: uid('property-answer-v3'),
      revisionContext: { sourceAnswerRecordReference: record.reference, sourceAnswerReference: record.answerReference,
        reason: request.reason, recordedAt, recordedBy } });
    await persist(next); return { kind: 'revision', answer: next.answerSnapshot, answerRecordReference: next.reference };
  }
  async function upgrade(source: HopV55PropertyAdviceAnswerRecordV2) {
    enabled();
    const workspace = await host.workspace(); workspaceScope(workspace);
    const head = [...(workspace.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === source.sourceReadingReference);
    const decoded = head && readHopV55DocumentaryAnswerRecord(head);
    if (!decoded || decoded.status !== 'readOnly' || decoded.record.reference !== source.reference) throw Error('Cette réponse n’est plus la tête de sa lecture.');
    const archive = reading(workspace, source.sourceReadingReference);
    // A V2 answer can only cite a historical reading; a semantic V4 reading starts in V3 through its own adapter.
    if (archive.format === 'hop-v55-decision-reading-v4') throw Error('Une réponse V2 ne peut pas citer une lecture sémantique V4.');
    const prepared = prepareBrewingScenarioContext(await host.context());
    if (!same(archive.source, host.source(workspace))) throw Error('La source de cette lecture a changé.');
    const prior = resumeHopV55PropertyAdviceRequestDraft({ source: { ownerKey: source.ownerKey, workspaceId: source.workspaceId,
      sourceReadingReference: source.sourceReadingReference, preparedReference: source.preparedReference,
      requestDraftReference: source.requestDraftReference, requestSnapshot: source.answerSnapshot.requestSnapshot }, prepared });
    const reason = 'Passage explicite à la lecture V3, avec les annotations, choix et déclarations conservés.';
    const recordedAt = now(); const recordedBy = { origin: 'user' as const, label: 'Brasseur' };
    const draft = upgradeHopV55PropertyAdviceRequestDraftV2ToV3({ draft: prior, reading: archive.reading, prepared,
      requestId: uid('property-request-v3'), sourceReadingReference: source.sourceReadingReference,
      revisionContext: { reason, recordedAt, recordedBy } });
    const record = createHopV55PropertyAdviceAnswerRecordV3({ draft, prepared, answerSnapshot: buildHopPropertyAdviceV3(draft.requestSnapshot),
      answerRecordId: uid('property-answer-v3'), revisionContext: { sourceAnswerRecordReference: source.reference,
        sourceAnswerReference: source.answerReference, reason, recordedAt, recordedBy } });
    await persist(record); return record;
  }
  async function dossier(request: HopV55PropertyAdviceDossierSaveRequestV3): Promise<HopPropertyAdviceDossierV3> {
    const { record } = await current(request.expectedAnswerRecordReference, request.expectedAnswerReference, request.expectedInterpretationReference);
    const prepared = prepareBrewingScenarioContext(await host.context());
    if (record.preparedReference !== hopV55PropertyAdvicePreparedReferenceV3(prepared, record.answerSnapshot.requestSnapshot)) {
      throw Error('La préparation a changé. Réexamine la réponse avant de conserver ce choix.');
    }
    const created = createHopV55PropertyAdviceDossierRecordV3({ answerRecord: record, dossierId: request.commandId,
      ...request, createdAt: now(), createdBy: actor() });
    for (let attempt = 0; attempt < 3; attempt++) {
      await current(request.expectedAnswerRecordReference, request.expectedAnswerReference, request.expectedInterpretationReference);
      const latest = await host.workspace(); workspaceScope(latest, created.workspaceId);
      const present = latest.documentaryDossiers?.find(row => row.id === created.id);
      if (present) {
        const read = readHopV55PropertyAdviceDossierRecordV3(present);
        if (read.status !== 'readOnly' || read.record.answerRecordReference !== record.reference
          || read.record.strategyReference !== request.expectedStrategyReference || read.record.dossierSnapshot.motive !== request.motive) {
          throw Error('Cette commande identifie déjà un autre choix documentaire.');
        }
        return read.record.dossierSnapshot;
      }
      try {
        await host.save({ ...latest, documentaryDossiers: [...(latest.documentaryDossiers ?? []), created], updatedAt: now() });
        return created.dossierSnapshot;
      } catch (error) { if (!stale(error) || attempt === 2) throw error; }
    }
    throw Error('Le choix documentaire n’a pas pu être conservé.');
  }
  async function materials(record: HopV55PropertyAdviceAnswerRecordV3, ids: readonly string[], query?: string) {
    await current(record.reference, record.answerReference, record.answerSnapshot.interpretationReference);
    const prepared = prepareBrewingScenarioContext(await host.context());
    const scope = new Set(ids);
    const normalized = query?.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
    if (query !== undefined && (!normalized || normalized.length < 2)) return [];
    return prepared.runtime.materials.filter(material => scope.has(material.id) && (!normalized
      || `${material.name} ${material.id} ${JSON.stringify(material.variety ?? material)}`.normalize('NFKD')
        .replace(/\p{M}/gu, '').toLocaleLowerCase('fr').includes(normalized))).map(clone);
  }
  return { prepare, reinterpret, reexamine, upgrade, dossier, materials };
}
