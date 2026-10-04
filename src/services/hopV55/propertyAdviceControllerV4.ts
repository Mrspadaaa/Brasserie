import type { BrewerContext } from '../../../functions/src/companionTypes';
import { buildHopPropertyAdviceV3 } from '../../domain/hopDecision/propertyAdvice';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { BrewingReferenceIdentityV1 } from '../../domain/brewingReference';
import type { HopV55Services, HopV55Workspace } from './contracts';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchive, type HopV55DecisionReadingSource } from './decisionArchive';
import { createHopV55DecisionReadingSuccessorArchiveV1, isHopV55StructuredDecisionReadingArchive } from './decisionReadingAccessors';
import { readHopV55DocumentaryAnswerRecord } from './documentaryRecords';
import type { HopV55PropertyAdviceAnswerRecordV3 } from './propertyAdviceRecordsV3';
import { buildHopV55PropertyAdviceRequestContext } from './propertyAdvicePreparation';
import { prepareCorrectionV4, resumeV4, prepareReexaminationPreviewV1, prepareVerifiedReexaminationV4,
  type HopV55PropertyAdviceReexaminationPreviewV1, type HopV55PropertyAdviceReexaminationBindingChoiceV1,
  type HopV55PropertyAdviceLedgerActionV4 } from './propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV4, createHopV55PropertyAdviceDossierRecordV4,
  readHopV55PropertyAdviceDossierRecordV4, type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceDossierRecordV4, type HopV55PropertyAdviceV4ReadingContext } from './propertyAdviceRecordsV4';
import { prepareHopV55AdoptedContext } from './adoptedContextPreparation';
import type { HopV55AdoptedContextBindingV1 } from './adoptedContextResolution';
import { createHopV55PropertyAdviceReexaminationCommandStagingV1,
  createHopV55PropertyAdviceReexaminationCommandReceiptV1,
  appendHopV55PropertyAdviceReexaminationCommandStaging,
  appendHopV55PropertyAdviceReexaminationCommandReceipt,
  lookupStoredHopV55PropertyAdviceReexaminationCommand,
  type HopV55PropertyAdviceReexaminationCommandStagingV1 } from './propertyAdviceReexaminationCommand';

/** Command payload type shared with Page and tests; the ledger action itself is owned by the V4 preparation. */
export type { HopV55PropertyAdviceLedgerActionV4 } from './propertyAdvicePreparationV4';

type SourceRecord = HopV55PropertyAdviceAnswerRecordV3 | HopV55PropertyAdviceAnswerRecordV4;
export interface HopV55PropertyAdviceV4Command {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  actions: readonly HopV55PropertyAdviceLedgerActionV4[];
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  reason: string;
}
export interface HopV55PropertyAdviceV4ReexaminationCommand {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  reason: string;
}
export interface HopV55PropertyAdviceV4DossierCommand {
  commandId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  strategyId: string;
  expectedStrategyReference: string;
  motive: string;
}
export interface HopV55PropertyAdviceV4Pending {
  fingerprint: string;
  record: HopV55PropertyAdviceAnswerRecordV4;
  archive?: HopV55DecisionReadingArchive;
  /** Local continuity of a freshly confirmed reexamination; never an input from the UI. */
  reexaminationPreviewReference?: string;
}
export interface HopV55PropertyAdviceV4PreviewCommand {
  previewId: string;
  expectedRecordReference: string;
  expectedLedgerReference: string;
}
export interface HopV55PropertyAdviceV4ConfirmationCommand extends HopV55PropertyAdviceV4Command {
  previewId: string;
  expectedPreviewReference: string;
  bindingChoices: readonly HopV55PropertyAdviceReexaminationBindingChoiceV1[];
}
export interface HopV55PropertyAdviceHostV4 {
  services: Pick<HopV55Services, 'ownerKey' | 'scope'>;
  enabled(): boolean;
  historical(): boolean;
  reading(): HopV55DecisionReadingArchive | undefined;
  context(): Promise<BrewerContext>;
  workspace(): Promise<HopV55Workspace>;
  save(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  source(workspace: HopV55Workspace): HopV55DecisionReadingSource;
  runtimeReference(prepared: PreparedBrewingScenarioContext): string;
  adoptedIdentity(workspace: HopV55Workspace): BrewingReferenceIdentityV1 | null;
  /** Shared by successive callback invocations; no builder is rerun for a pending command. */
  pending: Map<string, HopV55PropertyAdviceV4Pending>;
  /** Transient preview cache; does not by itself promise recovery after reload. */
  previews?: Map<string, HopV55PropertyAdviceReexaminationPreviewV1>;
  selected(record: HopV55PropertyAdviceAnswerRecordV4, workspace: HopV55Workspace, historical: boolean): void;
  activated(archive: HopV55DecisionReadingArchive, record: HopV55PropertyAdviceAnswerRecordV4, workspace: HopV55Workspace): void;
}

const clone = <T,>(value: T): T => structuredClone(value);
const same = (a: unknown, b: unknown) => hopDecisionReference(a) === hopDecisionReference(b);
const iso = () => new Date().toISOString();

/** Commands use exact record/ledger heads. allRejected is a head without any domain request. */
export function createHopV55PropertyAdviceControllerV4(host: HopV55PropertyAdviceHostV4) {
  const previews = host.previews ?? new Map<string, HopV55PropertyAdviceReexaminationPreviewV1>();
  function enabled() { if (!host.enabled()) throw Error('La lecture V4 attend ses vérifications intégrées.'); }
  function scope(workspace: HopV55Workspace, expectedId?: string) {
    if (workspace.ownerKey !== host.services.ownerKey || expectedId && workspace.id !== expectedId) throw Error('Le dossier ou son propriétaire a changé.');
  }
  function archive(workspace: HopV55Workspace, reference: string) {
    const raw = workspace.decisionReadings?.find(row => row.contentReference === reference);
    const read = raw && readHopV55DecisionReadingArchive(raw);
    if (!read || read.status !== 'available') throw Error('La lecture exacte de cette correction n’est plus disponible.');
    return read.archive;
  }
  function record(workspace: HopV55Workspace, reference: string): SourceRecord {
    const raw = workspace.documentaryAnswers?.find(row => row.reference === reference);
    const read = raw && readHopV55DocumentaryAnswerRecord(raw);
    if (!read || read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v3'
      && read.record.format !== 'hop-v55-documentary-answer-record-v4') throw Error('Le record exact de cette lecture est absent ou non pris en charge.');
    return read.record;
  }
  function head(workspace: HopV55Workspace, source: SourceRecord) {
    const latest = [...(workspace.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === source.sourceReadingReference);
    if (!latest || latest.reference !== source.reference) throw Error('Cette lecture n’est plus la tête exacte; relis la version courante.');
  }
  async function prepared(workspace: HopV55Workspace, expected = host.adoptedIdentity(workspace)) {
    const resolved = prepareHopV55AdoptedContext({ context: await host.context(), workspace, expected });
    if (resolved.resolution.status !== 'absent' && resolved.resolution.status !== 'resolved') {
      throw Error('La référence de comparaison a changé ou n’est pas lisible; choisis explicitement une source avant de poursuivre.');
    }
    return { sourcePrepared: resolved.sourcePrepared,
      cultureBinding: 'cultureBinding' in resolved ? resolved.cultureBinding : undefined };
  }
  function refreshedArchive(previous: HopV55DecisionReadingArchive, workspace: HopV55Workspace,
    sourcePrepared: PreparedBrewingScenarioContext, id: string, recordedAt: string) {
    if (!isHopV55StructuredDecisionReadingArchive(previous)) {
      throw Error('La nouvelle lecture requiert une source structurée V2, V3 ou V4 exacte.');
    }
    // Same format as the parent: V3 scopes and V4 semantics, scopes and lineage are kept, never downgraded.
    return createHopV55DecisionReadingSuccessorArchiveV1({ previous, id, ownerKey: host.services.ownerKey, workspaceId: workspace.id,
      recordedAt, source: host.source(workspace), runtimeReference: host.runtimeReference(sourcePrepared) });
  }
  async function fresh(recordV4: HopV55PropertyAdviceAnswerRecordV4, workspace: HopV55Workspace,
    readingArchive: HopV55DecisionReadingArchive) {
    if (!same(readingArchive.source, host.source(workspace))) throw Error('La source de cette correction a changé.');
    const expected = recordV4.preparation.cultureBinding?.reference ?? null;
    const resolved = await prepared(workspace, expected);
    if ((resolved.cultureBinding?.bindingReference ?? null) !== (recordV4.preparation.cultureBinding?.bindingReference ?? null)) {
      throw Error('La référence de comparaison n’est plus celle de cette préparation.');
    }
    const resumed = resumeV4({ record: recordV4, sourceReadingArchive: readingArchive, prepared: resolved.sourcePrepared });
    if (resumed.status !== 'ready' && resumed.status !== 'allRejected') throw Error(resumed.reason);
  }
  function commandFingerprint(kind: string, input: unknown) { return hopDecisionReference({ kind, input }); }
  function cached(commandId: string, fingerprint: string) {
    const item = host.pending.get(commandId);
    if (item && item.fingerprint !== fingerprint) throw Error('Cette commande identifie déjà une autre correction.');
    return item;
  }
  async function recover(workspace: HopV55Workspace, commandId: string, parent: string,
    fingerprint: string, reason: string, requestedContext?: HopV55PropertyAdviceV4ReadingContext,
    requestedActions?: readonly HopV55PropertyAdviceLedgerActionV4[]) {
    const recovered = (workspace.documentaryAnswers ?? []).flatMap(raw => {
      const read = readHopV55DocumentaryAnswerRecord(raw);
      return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4'
        && read.record.transition.actId === commandId ? [read.record] : [];
    })[0];
    if (!recovered) return undefined;
    if (recovered.format !== 'hop-v55-documentary-answer-record-v4' || recovered.transition.parentRecordReference !== parent
      || recovered.transition.reason !== reason) {
      throw Error('Cette commande est déjà liée à une autre lecture.');
    }
    const pending = cached(commandId, fingerprint);
    if (pending && pending.record.reference !== recovered.reference) throw Error('Le reçu de cette commande diffère du record préparé.');
    if (requestedContext && !same(recovered.readingContext, requestedContext)) {
      const parentRecord = record(workspace, parent);
      // A proposal summary is rebuilt from the active projection when the user
      // leaves the common frame unchanged. Other fields stay exact on replay.
      const summaryRegenerated = parentRecord.format === 'hop-v55-documentary-answer-record-v4'
        && same(parentRecord.readingContext, requestedContext)
        && requestedContext.interpretation.origin === 'proposal'
        && recovered.readingContext.interpretation.origin === 'proposal'
        && same({ ...recovered.readingContext, interpretation: requestedContext.interpretation }, requestedContext);
      if (!summaryRegenerated) throw Error('La lecture corrigée ne correspond pas au reçu de cette commande.');
    }
    if (requestedActions) {
      const decisions = recovered.ledger.entries.filter(entry => entry.decision.actId === commandId);
      if (decisions.length !== requestedActions.length) throw Error('Le reçu contient une autre liste de décisions.');
      for (const action of requestedActions) {
        const id = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
        const entry = decisions.find(row => row.annotationId === id);
        if (!entry || entry.decision.kind !== action.kind || entry.decision.reason !== action.reason
          || action.kind !== 'reject' && !same(entry.activeIntent, action.activeIntent)
          || action.kind === 'add' && !same(entry.sourceAnnotation, action.sourceAnnotation)) {
          throw Error('Le reçu ne conserve pas exactement les décisions de cette commande.');
        }
      }
    }
    const latest = [...(workspace.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === recovered.sourceReadingReference);
    let historical = host.historical() || latest?.reference !== recovered.reference
      || host.reading()?.contentReference !== recovered.sourceReadingReference;
    if (!historical) {
      try { await fresh(recovered, workspace, archive(workspace, recovered.sourceReadingReference)); }
      catch { historical = true; }
    }
    host.selected(recovered, workspace, historical);
    return recovered;
  }
  async function persist(pending: HopV55PropertyAdviceV4Pending, source: SourceRecord) {
    const created = pending.record;
    if (pending.archive) {
      // The workspace requires a committed reading before a record can cite it.
      // Keep the same archive and command on retries; activate only after both receipts.
      const staged = pending.archive;
      for (let attempt = 0; attempt < 3; attempt++) {
        const latest = await host.workspace(); scope(latest, created.workspaceId);
        const present = latest.decisionReadings?.find(row => row.contentReference === staged.contentReference);
        if (present) {
          const read = readHopV55DecisionReadingArchive(present);
          if (read.status !== 'available' || !same(read.archive, staged)) throw Error('Le reçu de lecture diffère du réexamen préparé.');
          break;
        }
        if (latest.decisionReadings?.some(row => row.id === staged.id)) throw Error('Cette identité de lecture appartient à un autre contenu.');
        await fresh(created, latest, staged);
        try {
          await host.save({ ...latest, decisionReadings: [...(latest.decisionReadings ?? []), staged], updatedAt: iso() });
          break;
        } catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error; }
      }
    }
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); scope(latest, created.workspaceId);
      const present = latest.documentaryAnswers?.find(row => row.reference === created.reference);
      if (present) {
        const read = record(latest, created.reference);
        if (read.format !== 'hop-v55-documentary-answer-record-v4') throw Error('La commande possède un reçu incompatible.');
        let historical = false;
        try { await fresh(read, latest, archive(latest, read.sourceReadingReference)); } catch { historical = true; }
        if (pending.archive && !historical) host.activated(pending.archive, read, latest); else host.selected(read, latest, historical);
        return read;
      }
      if (!pending.archive) head(latest, source);
      const exactReading = pending.archive ?? archive(latest, created.sourceReadingReference);
      await fresh(created, latest, exactReading);
      const next = { ...latest, documentaryAnswers: [...(latest.documentaryAnswers ?? []), created], updatedAt: iso(),
        ...(pending.archive ? { intent: pending.archive.reading.intent } : {}) };
      try {
        const saved = await host.save(next);
        if (pending.archive) host.activated(pending.archive, created, saved); else host.selected(created, saved, false);
        return created;
      } catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error; }
    }
    throw Error('La correction attend une reprise de sauvegarde.');
  }
  function build(source: SourceRecord, readingArchive: HopV55DecisionReadingArchive,
    preparedContext: PreparedBrewingScenarioContext, commandId: string, kind: 'upgradeV3' | 'revise' | 'reexamine',
    reason: string, actions: readonly HopV55PropertyAdviceLedgerActionV4[], readingContext?: HopV55PropertyAdviceV4ReadingContext,
    binding?: HopV55AdoptedContextBindingV1) {
    const draft = prepareCorrectionV4({ sourceRecord: source, sourceReadingArchive: readingArchive, prepared: preparedContext,
      recordId: `property-answer-v4:${commandId}`, requestId: `property-request-v4:${commandId}`,
      transition: { actId: commandId, kind, parentRecordReference: source.reference, parentReadingReference: source.sourceReadingReference,
        reason, actor: { origin: 'user', label: 'Brasseur' }, recordedAt: iso() }, actions,
      ...(readingContext ? { readingContext } : {}), cultureBinding: binding ?? null });
    if (draft.status === 'allRejected') return createHopV55PropertyAdviceAnswerRecordV4({ draft: draft.recordDraft, outcome: { kind: 'allRejected' } });
    const answer = buildHopPropertyAdviceV3(draft.requestDraftV3.requestSnapshot);
    return createHopV55PropertyAdviceAnswerRecordV4({ draft: draft.recordDraft,
      outcome: { kind: 'domainAnswer', requestDraftReference: draft.requestDraftV3.reference,
        answerSnapshot: answer, answerReference: answer.reference } });
  }
  async function upgradeV3(reference: string, commandId: string, reason: string) {
    enabled(); const workspace = await host.workspace(); scope(workspace);
    const fingerprint = commandFingerprint('upgradeV3', { reference, commandId, reason });
    const existing = await recover(workspace, commandId, reference, fingerprint, reason); if (existing) return existing;
    if (host.historical()) throw Error('La lecture est figée; reprends explicitement la lecture courante avant de la corriger.');
    const source = record(workspace, reference); head(workspace, source);
    if (source.format !== 'hop-v55-documentary-answer-record-v3') throw Error('Cette étape reprend une réponse V3 exacte.');
    if (host.reading()?.contentReference !== source.sourceReadingReference) throw Error('La lecture active a changé.');
    let pending = cached(commandId, fingerprint);
    if (!pending) {
      const resolved = await prepared(workspace);
      const created = build(source, archive(workspace, source.sourceReadingReference), resolved.sourcePrepared,
        commandId, 'upgradeV3', reason, [], undefined, resolved.cultureBinding);
      pending = { fingerprint, record: created }; host.pending.set(commandId, pending);
    }
    return persist(pending, source);
  }
  async function correct(input: HopV55PropertyAdviceV4Command) {
    enabled(); const workspace = await host.workspace(); scope(workspace);
    const fingerprint = commandFingerprint('revise', input);
    const existing = await recover(workspace, input.commandId, input.expectedRecordReference, fingerprint, input.reason, input.readingContext, input.actions);
    if (existing) return existing;
    if (host.historical()) throw Error('Cette version est figée; réexamine-la avant une nouvelle correction.');
    const source = record(workspace, input.expectedRecordReference); head(workspace, source);
    if (source.format !== 'hop-v55-documentary-answer-record-v4' || source.ledger.reference !== input.expectedLedgerReference
      || host.reading()?.contentReference !== source.sourceReadingReference) throw Error('La lecture ou le registre a changé depuis cette correction.');
    let pending = cached(input.commandId, fingerprint);
    if (!pending) {
      const resolved = await prepared(workspace, source.preparation.cultureBinding?.reference ?? null);
      const updatedContext = same(input.readingContext, source.readingContext) ? undefined : input.readingContext;
      const created = build(source, archive(workspace, source.sourceReadingReference), resolved.sourcePrepared,
        input.commandId, 'revise', input.reason, input.actions, updatedContext, resolved.cultureBinding);
      pending = { fingerprint, record: created }; host.pending.set(input.commandId, pending);
    }
    return persist(pending, source);
  }
  async function reexamine(input: HopV55PropertyAdviceV4ReexaminationCommand) {
    enabled(); const workspace = await host.workspace(); scope(workspace);
    const fingerprint = commandFingerprint('reexamine', input);
    const existing = await recover(workspace, input.commandId, input.expectedRecordReference, fingerprint, input.reason); if (existing) return existing;
    const source = record(workspace, input.expectedRecordReference);
    if (source.format !== 'hop-v55-documentary-answer-record-v4' || source.ledger.reference !== input.expectedLedgerReference) throw Error('Le registre source exact n’est plus disponible.');
    let pending = cached(input.commandId, fingerprint);
    if (!pending) {
      const resolved = await prepared(workspace);
      const previous = archive(workspace, source.sourceReadingReference);
      const nextArchive = refreshedArchive(previous, workspace, resolved.sourcePrepared, `reading-v4:${input.commandId}`, iso());
      const context = { ...clone(source.readingContext), context: buildHopV55PropertyAdviceRequestContext(resolved.sourcePrepared) };
      const created = build(source, nextArchive, resolved.sourcePrepared, input.commandId, 'reexamine', input.reason, [], context, resolved.cultureBinding);
      pending = { fingerprint, record: created, archive: nextArchive }; host.pending.set(input.commandId, pending);
    }
    return persist(pending, source);
  }
  async function prepareReexamination(input: HopV55PropertyAdviceV4PreviewCommand) {
    enabled(); const workspace = await host.workspace(); scope(workspace);
    const source = record(workspace, input.expectedRecordReference);
    if (source.format !== 'hop-v55-documentary-answer-record-v4' || source.ledger.reference !== input.expectedLedgerReference) {
      throw Error('La version et le registre exacts sont requis pour préparer cette nouvelle lecture.');
    }
    const existing = previews.get(input.previewId);
    if (existing && (existing.parentRecordReference !== source.reference || existing.ownerKey !== workspace.ownerKey
      || existing.workspaceId !== workspace.id)) throw Error('Cet aperçu appartient à une autre version.');
    const resolved = await prepared(workspace);
    const previous = archive(workspace, source.sourceReadingReference);
    const nextArchive = existing?.sourceReadingArchive
      ?? refreshedArchive(previous, workspace, resolved.sourcePrepared, `reading-preview:${input.previewId}`, iso());
    const result = prepareReexaminationPreviewV1({ sourceRecord: source, parentReadingArchive: previous,
      sourceReadingArchive: nextArchive, prepared: resolved.sourcePrepared,
      cultureBinding: resolved.cultureBinding ?? null, currentSource: host.source(workspace),
      currentRuntimeReference: host.runtimeReference(resolved.sourcePrepared), previewId: input.previewId });
    if (result.status !== 'ready') throw Error(result.reason);
    if (existing && existing.reference !== result.preview.reference) throw Error('La source de cet aperçu a changé. Prépare un nouvel aperçu.');
    previews.set(input.previewId, result.preview);
    return clone(result.preview);
  }
  async function confirmReexamination(input: HopV55PropertyAdviceV4ConfirmationCommand) {
    enabled(); const workspace = await host.workspace(); scope(workspace);
    const fingerprint = commandFingerprint('confirmReexamination', input);
    const durable = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace, confirmation: input });
    if (durable.status === 'conflict' || durable.status === 'unsupportedReadOnly') throw Error(durable.reason);
    if (durable.status === 'committed') {
      await publishConfirmedReexamination(durable.staging, durable.record, workspace, input);
      return durable.record;
    }
    if (durable.status === 'pending') return persistConfirmedReexamination(durable.staging, input);
    const source = record(workspace, input.expectedRecordReference);
    if (source.format !== 'hop-v55-documentary-answer-record-v4' || source.ledger.reference !== input.expectedLedgerReference) {
      throw Error('Le parent et son registre ont changé depuis cet aperçu.');
    }
    let pending = cached(input.commandId, fingerprint);
    if (!pending) {
      const preview = previews.get(input.previewId);
      if (!preview || preview.reference !== input.expectedPreviewReference || preview.parentRecordReference !== source.reference) {
        throw Error('L’aperçu exact n’est plus disponible. Prépare une nouvelle lecture avant de confirmer.');
      }
      const currentIdentity = host.adoptedIdentity(workspace);
      const resolved = await prepared(workspace, preview.cultureBindingReference ? currentIdentity : null);
      if ((resolved.cultureBinding?.bindingReference ?? null) !== preview.cultureBindingReference) {
        throw Error('La référence de comparaison a changé depuis cet aperçu. Prépare une nouvelle lecture.');
      }
      const result = prepareVerifiedReexaminationV4({ preview, expectedPreviewReference: input.expectedPreviewReference,
        sourceRecord: source, parentReadingArchive: archive(workspace, source.sourceReadingReference),
        sourceReadingArchive: preview.sourceReadingArchive, prepared: resolved.sourcePrepared,
        readingContext: input.readingContext, cultureBinding: resolved.cultureBinding ?? null,
        currentSource: host.source(workspace), currentRuntimeReference: host.runtimeReference(resolved.sourcePrepared), previewId: input.previewId,
        recordId: `property-answer-v4:${input.commandId}`, requestId: `property-request-v4:${input.commandId}`,
        transition: { actId: input.commandId, kind: 'reexamine', parentRecordReference: source.reference,
          parentReadingReference: source.sourceReadingReference, reason: input.reason, actor: { origin: 'user', label: 'Brasseur' }, recordedAt: iso() },
        actions: input.actions, bindingChoices: input.bindingChoices });
      if (result.status === 'blocked') throw Error(result.reason);
      const outcome = result.status === 'allRejected' ? { kind: 'allRejected' as const } : (() => {
        const answer = buildHopPropertyAdviceV3(result.requestDraftV3.requestSnapshot);
        return { kind: 'domainAnswer' as const, requestDraftReference: result.requestDraftV3.reference,
          answerSnapshot: answer, answerReference: answer.reference };
      })();
      const created = createHopV55PropertyAdviceAnswerRecordV4({ draft: result.recordDraft, outcome });
      pending = { fingerprint, record: created, archive: preview.sourceReadingArchive,
        reexaminationPreviewReference: preview.reference }; host.pending.set(input.commandId, pending);
    }
    const preview = previews.get(input.previewId);
    if (!preview || preview.reference !== input.expectedPreviewReference) throw Error('L’aperçu exact de cette confirmation n’est plus disponible.');
    const staging = createHopV55PropertyAdviceReexaminationCommandStagingV1({ preview, confirmation: input, preparedRecord: pending.record });
    return persistConfirmedReexamination(staging, input);
  }
  async function persistConfirmedReexamination(staging: HopV55PropertyAdviceReexaminationCommandStagingV1,
    input: HopV55PropertyAdviceV4ConfirmationCommand) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); scope(latest, staging.workspaceId);
      const current = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: latest, confirmation: input });
      if (current.status === 'conflict' || current.status === 'unsupportedReadOnly') throw Error(current.reason);
      if (current.status === 'committed') {
        await publishConfirmedReexamination(current.staging, current.record, latest, input); return current.record;
      }
      if (current.status === 'pending') break;
      await fresh(staging.preparedRecord, latest, staging.preview.sourceReadingArchive);
      try { await host.save(appendHopV55PropertyAdviceReexaminationCommandStaging(latest, staging)); break; }
      catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error; }
    }
    const receipt = createHopV55PropertyAdviceReexaminationCommandReceiptV1({ staging, committedAt: iso() });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); scope(latest, staging.workspaceId);
      const current = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: latest, confirmation: input });
      if (current.status === 'conflict' || current.status === 'unsupportedReadOnly') throw Error(current.reason);
      if (current.status === 'committed') {
        await publishConfirmedReexamination(current.staging, current.record, latest, input); return current.record;
      }
      if (current.status !== 'pending' || current.staging.reference !== staging.reference) throw Error('La préparation durable de cette confirmation n’est plus disponible.');
      try {
        const saved = await host.save(appendHopV55PropertyAdviceReexaminationCommandReceipt(latest, receipt));
        await publishConfirmedReexamination(staging, staging.preparedRecord, saved, input);
        return staging.preparedRecord;
      } catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error; }
    }
    throw Error('La confirmation durable attend une reprise de rattachement.');
  }
  async function publishConfirmedReexamination(staging: HopV55PropertyAdviceReexaminationCommandStagingV1,
    confirmed: HopV55PropertyAdviceAnswerRecordV4, workspace: HopV55Workspace,
    input: HopV55PropertyAdviceV4ConfirmationCommand) {
    const local = cached(input.commandId, commandFingerprint('confirmReexamination', input));
    const live = local?.record.reference === confirmed.reference
      && local.reexaminationPreviewReference === staging.preview.reference
      && local.archive?.contentReference === staging.sourceReadingReference;
    let current = false;
    if (live) {
      try { await fresh(confirmed, workspace, staging.preview.sourceReadingArchive); current = true; }
      catch { /* The durable result remains historical when its prepared frame changed. */ }
    }
    if (current) host.activated(staging.preview.sourceReadingArchive, confirmed, workspace);
    else host.selected(confirmed, workspace, true);
  }
  async function dossier(input: HopV55PropertyAdviceV4DossierCommand): Promise<HopV55PropertyAdviceDossierRecordV4> {
    enabled(); const workspace = await host.workspace(); scope(workspace);
    const duplicateRaw = workspace.documentaryDossiers?.find(row => row.id === input.commandId);
    if (duplicateRaw) {
      const read = readHopV55PropertyAdviceDossierRecordV4(duplicateRaw);
      if (read.status !== 'readOnly' || read.record.answerRecordReference !== input.expectedRecordReference
        || read.record.ledgerReference !== input.expectedLedgerReference || read.record.strategyReference !== input.expectedStrategyReference
        || read.record.answerReference !== input.expectedAnswerReference
        || read.record.dossierSnapshot.interpretationReference !== input.expectedInterpretationReference
        || read.record.strategyId !== input.strategyId
        || read.record.dossierSnapshot.motive !== input.motive) throw Error('Cette commande identifie déjà un autre dossier.');
      return read.record;
    }
    if (host.historical()) throw Error('Cette réponse est figée; le dossier reste consultable dans son histoire.');
    const source = record(workspace, input.expectedRecordReference); head(workspace, source);
    if (source.format !== 'hop-v55-documentary-answer-record-v4' || source.ledger.reference !== input.expectedLedgerReference
      || source.outcome.kind !== 'domainAnswer') throw Error('Un dossier nécessite la réponse et le registre actifs exacts.');
    await fresh(source, workspace, archive(workspace, source.sourceReadingReference));
    const created = createHopV55PropertyAdviceDossierRecordV4({ answerRecord: source, dossierId: input.commandId,
      ...input, createdAt: iso(), createdBy: { origin: 'user', label: 'Brasseur' } });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); scope(latest, source.workspaceId);
      const present = latest.documentaryDossiers?.find(row => row.id === created.id);
      if (present) {
        const read = readHopV55PropertyAdviceDossierRecordV4(present);
        if (read.status !== 'readOnly' || read.record.reference !== created.reference) throw Error('Cette identité de dossier porte un autre reçu.');
        return read.record;
      }
      head(latest, source);
      await fresh(source, latest, archive(latest, source.sourceReadingReference));
      try {
        await host.save({ ...latest, documentaryDossiers: [...(latest.documentaryDossiers ?? []), created], updatedAt: iso() });
        return created;
      } catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error; }
    }
    throw Error('Le dossier attend une reprise de sauvegarde.');
  }
  return { upgradeV3, correct, reexamine, prepareReexamination, confirmReexamination, dossier };
}
