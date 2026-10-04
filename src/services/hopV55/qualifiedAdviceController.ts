import type { BrewerContext } from '../../../functions/src/companionTypes';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopCatalogueLoaderInput } from '../../domain/hopDecision/catalogueLoader';
import type { HopDecisionContext } from '../../domain/hopDecision/dossier';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { hopAdviceStudyReference, readHopAdviceDossier,
  type HopAdviceDossierV3, type HopAdviceEventV3, type HopAdviceStudyV3 } from '../../domain/hopDecision/adviceDossier';
import { captureHopAdvicePreference } from '../../domain/hopDecision/adviceProgramAdapter';
import type { HopAdviceAction } from '../../domain/hopDecision/qualifiedAdvice';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Services, HopV55Workspace } from './contracts';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource } from './decisionArchive';
import { isHopV55StructuredDecisionReadingArchive } from './decisionReadingAccessors';
import { inspectHopV55QualifiedAdvicePreparedReferenceV1, prepareHopV55QualifiedAdviceStudyV1,
  type HopV55QualifiedAdviceFutureStageV1, type HopV55QualifiedAdviceStudyPreparation } from './qualifiedStudyPreparation';
import { appendHopV55QualifiedStudyPreference, createHopV55QualifiedStudyPreferenceCommandV1,
  readHopV55QualifiedStudyPreferenceCommand, type HopV55QualifiedStudyPreferenceCommandV1,
  type PersistHopV55QualifiedStudyPreferenceResult } from './qualifiedStudyPreference';
import { appendHopV55QualifiedStudyPreparationRecord, readHopV55QualifiedStudyPreparation,
  readHopV55QualifiedStudyLink, saveHopV55QualifiedStudy,
  createHopV55QualifiedStudyPreparationV2, type HopV55QualifiedStudyFreshnessInput,
  type HopV55QualifiedStudyPreparationRecord,
  type PersistHopV55QualifiedStudyResult } from './qualifiedStudyWorkspace';

export interface HopV55QualifiedAdvicePrepareRequest {
  /** Caller supplies the complete typed situation, including `materialIds: []` and `program: null` when intended. */
  action: Omit<HopAdviceAction, 'qualification'>;
  explicitFutureStage?: HopV55QualifiedAdviceFutureStageV1;
}

export interface HopV55QualifiedAdviceSaveRequest {
  kind: 'advice';
  study: HopAdviceStudyV3;
  sourceReadingReference: string;
  studyReference: string;
  expectedStudyReference: string;
}

export interface HopV55QualifiedAdvicePreferenceRequest {
  expectedLinkReference: string;
  expectedDossierId: string;
  expectedDossierRevision: number;
  expectedStudyReference: string;
  expectedOptionId: string;
  expectedOptionReference: string;
  reason: string;
}

export interface HopV55QualifiedAdvicePreferenceUpdate {
  dossier: HopAdviceDossierV3;
  event: Extract<HopAdviceEventV3, { kind: 'strategyPreferred' }>;
  events: readonly HopAdviceEventV3[];
  freshContext: { status: 'current' } | { status: 'historical'; reason: string };
}

export interface HopV55QualifiedAdviceControllerHost {
  services: Pick<HopV55Services, 'ownerKey' | 'workspaces' | 'qualifiedStudies'>;
  enabled(): boolean;
  historical(): boolean;
  reading(): HopV55DecisionReadingArchive | undefined;
  context(): Promise<BrewerContext>;
  workspace(): Promise<HopV55Workspace>;
  save(workspace: HopV55Workspace): Promise<HopV55Workspace>;
  source(workspace: HopV55Workspace): HopV55DecisionReadingSource;
  runtimeReference(prepared: PreparedBrewingScenarioContext): string;
  sourceContext(context: BrewerContext, prepared: PreparedBrewingScenarioContext,
    workspace: HopV55Workspace): HopDecisionContext | null;
  catalogueInput(context: BrewerContext): HopCatalogueLoaderInput;
  selected(preparation: HopV55QualifiedStudyPreparationRecord): void;
  received(result: PersistHopV55QualifiedStudyResult): void;
  preferenceReceived?(result: PersistHopV55QualifiedStudyPreferenceResult): void;
  /** Page-owned per-owner/workspace cache survives controller factory recreation until CAS persistence succeeds. */
  pendingPreparations?: Map<string, HopV55QualifiedStudyPreparationRecord>;
  now?(): string;
}

const uid = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;
const same = (left: unknown, right: unknown) => hopDecisionReference(left) === hopDecisionReference(right);
const stale = (error: unknown) => (error as { code?: unknown })?.code === 'staleRevision';
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;

export function hopV55QualifiedAdvicePreparationPendingKey(input: {
  ownerKey: string; workspaceId: string; sourceReadingReference: string; preparedReference: string;
}): string {
  return hopAdviceContentReference('hop-v55-qualified-advice-controller-prepare-v1', input);
}

/** Host-owned Q09 journey. It prepares advice only from a saved reading and keeps preference as a separate exact event. */
export function createHopV55QualifiedAdviceController(host: HopV55QualifiedAdviceControllerHost) {
  const inFlightPreparations = new Map<string, Promise<HopV55QualifiedStudyPreparationRecord>>();

  function enabled() {
    if (!host.enabled()) throw Error('Le raccord de conseil stratégique qualifié attend sa réception.');
  }

  function workspaceScope(workspace: HopV55Workspace, expectedId?: string) {
    if (workspace.ownerKey !== host.services.ownerKey || (expectedId !== undefined && workspace.id !== expectedId)) {
      throw Error('Le propriétaire ou le workspace du conseil a changé.');
    }
  }

  // Capability, not a closed format list: a structured V2/V3/V4 reading with its exact source and optional scopes.
  function exactArchive(workspace: HopV55Workspace, reference: string) {
    const raw = workspace.decisionReadings?.find(row => row.contentReference === reference);
    const decoded = raw && readHopV55DecisionReadingArchive(raw);
    if (!decoded || decoded.status !== 'available' || !isHopV55StructuredDecisionReadingArchive(decoded.archive)) {
      throw Error('Une archive de lecture structurée V2/V3/V4 exacte doit rester disponible pour ce conseil.');
    }
    if (decoded.archive.ownerKey !== workspace.ownerKey || decoded.archive.workspaceId !== workspace.id
      || decoded.archive.contentReference !== reference) throw Error('L’archive advice ne correspond pas au workspace courant.');
    return decoded.archive;
  }

  function currentArchive(workspace: HopV55Workspace) {
    const active = host.reading();
    if (!isHopV55StructuredDecisionReadingArchive(active)) {
      throw Error('Conserve d’abord une lecture structurée V2/V3/V4 avant de préparer un conseil.');
    }
    const archived = exactArchive(workspace, active.contentReference);
    if (archived.contentReference !== active.contentReference || !same(archived.source, host.source(workspace))) {
      throw Error('La source de la lecture active a changé; recharge avant de préparer le conseil.');
    }
    return archived;
  }

  function advicePreparation(workspace: HopV55Workspace, preparationReference: string): HopV55QualifiedStudyPreparationRecord {
    const raw = workspace.qualifiedStudyPreparations?.find(row => row.reference === preparationReference);
    const decoded = raw && readHopV55QualifiedStudyPreparation(raw);
    if (!decoded || decoded.status !== 'available' || decoded.preparation.kind !== 'advice'
      || decoded.preparation.createCommand.kind !== 'advice' || decoded.preparation.formatVersion !== 3) {
      throw Error('La préparation advice exacte V3 n’est plus disponible dans le workspace.');
    }
    if (decoded.preparation.ownerKey !== host.services.ownerKey || decoded.preparation.workspaceId !== workspace.id) {
      throw Error('La préparation advice ne correspond pas à l’owner ou au workspace courant.');
    }
    return decoded.preparation;
  }

  function actionOf(preparation: HopV55QualifiedStudyPreparationRecord): Omit<HopAdviceAction, 'qualification'> {
    if (preparation.createCommand.kind !== 'advice'
      || preparation.createCommand.study.requestSnapshot.action.kind !== 'exploreStrategies') {
      throw Error('La préparation conservée ne contient pas une action exploreStrategies.');
    }
    return structuredClone(preparation.createCommand.study.requestSnapshot.action);
  }

  async function inspectAgainstCurrent(preparation: HopV55QualifiedStudyPreparationRecord) {
    const workspace = await host.workspace();
    workspaceScope(workspace, preparation.workspaceId);
    const archive = exactArchive(workspace, preparation.sourceReadingReference);
    if (host.historical() || host.reading()?.contentReference !== archive.contentReference
      || !same(archive.source, host.source(workspace))) {
      return { status: 'historical' as const, reason: 'La lecture ou sa source active a changé; l’étude reste liée à son archive exacte.' };
    }
    if (preparation.kind !== 'advice' || preparation.createCommand.kind !== 'advice') {
      throw Error('La validation de fraîcheur reçue ne référence pas une préparation advice.');
    }
    const context = await host.context();
    const prepared = prepareBrewingScenarioContext(context);
    const inspected = await inspectHopV55QualifiedAdvicePreparedReferenceV1({ workspace,
      ownerKey: host.services.ownerKey, workspaceId: workspace.id,
      sourceReadingReference: archive.contentReference,
      expectedRuntimeReference: host.runtimeReference(prepared), sourceContext: host.sourceContext(context, prepared, workspace),
      prepared, action: actionOf(preparation), catalogueInput: host.catalogueInput(context),
      ...(preparation.advicePreparationContext?.explicitFutureStage
        ? { explicitFutureStage: structuredClone(preparation.advicePreparationContext.explicitFutureStage) } : {}) });
    if (inspected.status !== 'ready' || inspected.preparedReference !== preparation.preparedReference) {
      return { status: 'historical' as const, reason: inspected.status === 'refused' ? inspected.reason
        : 'Le contexte, le catalogue ou les choix du conseil ont changé; prépare une nouvelle étude.' };
    }
    const latest = await host.workspace();
    workspaceScope(latest, preparation.workspaceId);
    const latestArchive = exactArchive(latest, archive.contentReference);
    if (host.historical() || host.reading()?.contentReference !== archive.contentReference
      || !same(latestArchive.source, host.source(latest))) {
      return { status: 'historical' as const, reason: 'La lecture ou sa source a changé pendant la vérification sans réponse.' };
    }
    return { status: 'current' as const };
  }

  async function freshness(input: HopV55QualifiedStudyFreshnessInput) {
    if (input.phase !== 'beforeCreate' && input.phase !== 'beforeLink' && input.phase !== 'alreadyLinked') {
      throw Error('Phase de fraîcheur advice inconnue.');
    }
    return inspectAgainstCurrent(input.preparation);
  }

  async function inspectAdvice(request: HopV55QualifiedAdvicePrepareRequest) {
    enabled();
    if (host.historical()) throw Error('Cette lecture est historique; sélectionne la lecture active avant d’inspecter un conseil.');
    const workspace = await host.workspace(); workspaceScope(workspace);
    const archive = currentArchive(workspace);
    const context = await host.context();
    const prepared = prepareBrewingScenarioContext(context);
    return inspectHopV55QualifiedAdvicePreparedReferenceV1({ workspace, ownerKey: host.services.ownerKey, workspaceId: workspace.id,
      sourceReadingReference: archive.contentReference, expectedRuntimeReference: host.runtimeReference(prepared),
      sourceContext: host.sourceContext(context, prepared, workspace), prepared,
      action: structuredClone(request.action), catalogueInput: host.catalogueInput(context),
      ...(request.explicitFutureStage ? { explicitFutureStage: structuredClone(request.explicitFutureStage) } : {}) });
  }

  async function prepareAdvice(request: HopV55QualifiedAdvicePrepareRequest) {
    enabled();
    if (host.historical()) throw Error('Cette lecture est historique; réexamine sa demande avant de préparer un conseil actif.');
    const workspace = await host.workspace(); workspaceScope(workspace);
    const archive = currentArchive(workspace);
    const context = await host.context();
    const prepared = prepareBrewingScenarioContext(context);
    const commonInput = { workspace, ownerKey: host.services.ownerKey, workspaceId: workspace.id,
      sourceReadingReference: archive.contentReference, expectedRuntimeReference: host.runtimeReference(prepared),
      sourceContext: host.sourceContext(context, prepared, workspace), prepared,
      action: structuredClone(request.action), catalogueInput: host.catalogueInput(context),
      ...(request.explicitFutureStage ? { explicitFutureStage: structuredClone(request.explicitFutureStage) } : {}) };
    const inspected = await inspectHopV55QualifiedAdvicePreparedReferenceV1(commonInput);
    if (inspected.status !== 'ready') throw Error(inspected.reason);
    const key = hopV55QualifiedAdvicePreparationPendingKey({
      ownerKey: host.services.ownerKey, workspaceId: workspace.id,
      sourceReadingReference: archive.contentReference, preparedReference: inspected.preparedReference,
    });
    const existing = (workspace.qualifiedStudyPreparations ?? []).flatMap(raw => {
      const decoded = readHopV55QualifiedStudyPreparation(raw);
      return decoded.status === 'available' && decoded.preparation.kind === 'advice'
        && decoded.preparation.sourceReadingReference === archive.contentReference
        && decoded.preparation.preparedReference === inspected.preparedReference ? [decoded.preparation] : [];
    });
    if (existing.length > 1) throw Error('Plusieurs préparations advice correspondent exactement à cette lecture; aucune n’est choisie automatiquement.');
    if (existing.length === 1) { host.selected(existing[0]); return existing[0]; }
    const persistPreparation = async (preparation: HopV55QualifiedStudyPreparationRecord) => {
      if (preparation.ownerKey !== host.services.ownerKey || preparation.workspaceId !== workspace.id
        || preparation.sourceReadingReference !== archive.contentReference || preparation.kind !== 'advice'
        || preparation.preparedReference !== inspected.preparedReference) {
        throw Error('La préparation en attente ne correspond plus à la lecture, au workspace ou au contexte préparé.');
      }
      for (let attempt = 0; attempt < 3; attempt++) {
        const latest = await host.workspace(); workspaceScope(latest, workspace.id);
        const durable = (latest.qualifiedStudyPreparations ?? []).flatMap(raw => {
          const decoded = readHopV55QualifiedStudyPreparation(raw);
          return decoded.status === 'available' && decoded.preparation.id === preparation.id ? [decoded.preparation] : [];
        })[0];
        if (durable) {
          if (durable.reference !== preparation.reference) throw Error('L’ID de préparation en attente porte un autre contenu durable.');
          host.pendingPreparations?.delete(key);
          host.selected(durable);
          return durable;
        }
        const current = await freshness({ preparation, phase: 'beforeCreate' });
        if (current.status !== 'current') throw Error(current.reason);
        const next = appendHopV55QualifiedStudyPreparationRecord(latest, preparation);
        try {
          await host.save(next);
          host.pendingPreparations?.delete(key);
          host.selected(preparation);
          return preparation;
        } catch (error) { if (!stale(error) || attempt === 2) throw error; }
      }
      throw Error('La préparation advice exacte attend une reprise CAS du workspace.');
    };
    const cached = host.pendingPreparations?.get(key);
    if (cached) return persistPreparation(cached);
    const pending = inFlightPreparations.get(key);
    if (pending) return pending;

    const work = (async () => {
      const token = key.slice(key.lastIndexOf(':') + 1);
      const created = await prepareHopV55QualifiedAdviceStudyV1({ ...commonInput,
        identity: { preparationId: `qualified-advice-preparation:${token}`, dossierId: `qualified-advice-study:${token}`,
          eventId: `qualified-advice-saved:${token}`, recordedAt: (host.now?.() ?? new Date().toISOString()) } });
      if (created.status !== 'ready') throw Error(created.reason);
      const preparation = 'scopeCoverage' in created.result
        ? createHopV55QualifiedStudyPreparationV2({ qualifiedPreparation: created.result })
        : created.result.preparation;
      if (created.result.preparedReference !== inspected.preparedReference) {
        throw Error('Le catalogue ou le contexte a changé pendant le calcul; relis avant d’enregistrer cette préparation.');
      }
      host.pendingPreparations?.set(key, preparation);
      return persistPreparation(preparation);
    })();
    inFlightPreparations.set(key, work);
    try { return await work; }
    finally { inFlightPreparations.delete(key); }
  }

  async function preparationForSave(request: HopV55QualifiedAdviceSaveRequest) {
    if (request.kind !== 'advice' || !isText(request.sourceReadingReference)
      || !isText(request.studyReference) || request.expectedStudyReference !== request.studyReference) {
      throw Error('La sauvegarde doit viser exactement la lecture et le studyReference advice affichés.');
    }
    const workspace = await host.workspace(); workspaceScope(workspace);
    const candidates = (workspace.qualifiedStudyPreparations ?? []).flatMap(raw => {
      const decoded = readHopV55QualifiedStudyPreparation(raw);
      return decoded.status === 'available' && decoded.preparation.kind === 'advice'
        && decoded.preparation.sourceReadingReference === request.sourceReadingReference
        && decoded.preparation.studyReference === request.studyReference ? [decoded.preparation] : [];
    });
    if (candidates.length !== 1) throw Error('La préparation advice exacte est absente ou ambiguë dans le workspace.');
    const preparation = candidates[0];
    if (preparation.createCommand.kind !== 'advice' || !same(preparation.createCommand.study, request.study)) {
      throw Error('La confirmation vise une autre étude ou une autre archive.');
    }
    exactArchive(workspace, request.sourceReadingReference);
    return preparation;
  }

  async function saveAdviceStudy(request: HopV55QualifiedAdviceSaveRequest) {
    enabled();
    const preparation = await preparationForSave(request);
    const result = await saveHopV55QualifiedStudy({ workspaces: host.services.workspaces,
      qualifiedStudies: host.services.qualifiedStudies, preparation, validateFreshness: freshness });
    host.received(result);
    return result;
  }

  function linkedPreparation(workspace: HopV55Workspace, request: HopV55QualifiedAdvicePreferenceRequest) {
    if (!isText(request.expectedLinkReference) || !isText(request.expectedDossierId)
      || !Number.isSafeInteger(request.expectedDossierRevision) || request.expectedDossierRevision < 1
      || !isText(request.expectedStudyReference) || !isText(request.expectedOptionId)
      || !isText(request.expectedOptionReference) || !request.reason.trim()) {
      throw Error('La préférence doit conserver ses références, sa révision et son motif exacts.');
    }
    const links = (workspace.qualifiedStudyLinks ?? []).flatMap(raw => {
      const decoded = readHopV55QualifiedStudyLink(raw);
      return decoded.status === 'available' && decoded.link.reference === request.expectedLinkReference ? [decoded.link] : [];
    });
    if (links.length !== 1) throw Error('Le lien exact de l’étude advice n’est plus présent dans le workspace.');
    const link = links[0];
    const preparation = advicePreparation(workspace, link.preparationReference);
    if (link.kind !== 'advice' || link.formatVersion !== 3 || preparation.dossierId !== request.expectedDossierId
      || preparation.studyReference !== request.expectedStudyReference || link.studyReference !== request.expectedStudyReference
      || link.sourceReadingReference !== preparation.sourceReadingReference) {
      throw Error('La préférence ne vise pas le lien advice, le dossier et l’étude exacts.');
    }
    return { link, preparation, study: preparation.createCommand.kind === 'advice'
      ? preparation.createCommand.study : (() => { throw Error('Étude advice attendue.'); })() };
  }

  function commandForPreference(workspace: HopV55Workspace, preparation: HopV55QualifiedStudyPreparationRecord,
    request: HopV55QualifiedAdvicePreferenceRequest): HopV55QualifiedStudyPreferenceCommandV1 | undefined {
    const matches = (workspace.qualifiedStudyPreferenceCommands ?? []).flatMap(raw => {
      const decoded = readHopV55QualifiedStudyPreferenceCommand(raw);
      if (decoded.status !== 'available') return [];
      const command = decoded.command;
      return command.preparationReference === preparation.reference && command.sourceReadingReference === preparation.sourceReadingReference
        && command.dossierId === preparation.dossierId && command.studyReference === preparation.studyReference
        && command.event.expectedRevision === request.expectedDossierRevision && command.event.payload.optionId === request.expectedOptionId
        && command.event.payload.optionReference === request.expectedOptionReference && command.event.payload.reason === request.reason ? [command] : [];
    });
    if (matches.length > 1) throw Error('Plusieurs commandes de préférence portent exactement cette confirmation.');
    return matches[0];
  }

  async function preferAdvice(request: HopV55QualifiedAdvicePreferenceRequest): Promise<HopV55QualifiedAdvicePreferenceUpdate> {
    enabled();
    const workspace = await host.workspace(); workspaceScope(workspace);
    const { preparation, study } = linkedPreparation(workspace, request);
    let command = commandForPreference(workspace, preparation, request);
    if (!command) {
      const current = await inspectAgainstCurrent(preparation);
      if (current.status !== 'current') throw Error(current.reason);
      const rawDossier = await host.services.qualifiedStudies.read(host.services.ownerKey, preparation.dossierId);
      if (!rawDossier) throw Error('Le dossier advice lié n’est plus disponible.');
      const dossier = readHopAdviceDossier(rawDossier);
      if ('status' in dossier || dossier.formatVersion !== 3 || dossier.dossierId !== request.expectedDossierId
        || dossier.revision !== request.expectedDossierRevision || hopAdviceStudyReference(dossier.study) !== preparation.studyReference) {
        throw Error('La révision du dossier a changé; recharge ses options avant de choisir une préférence.');
      }
      const option = study.responseSnapshot.result.options.find(row => row.id === request.expectedOptionId
        && row.reference === request.expectedOptionReference);
      if (!option) throw Error('La voie choisie ne correspond plus à une option de l’étude conservée.');
      const event = captureHopAdvicePreference({ identity: { ownerKey: preparation.ownerKey, dossierId: preparation.dossierId,
        eventId: uid('qualified-advice-preference-event'), expectedRevision: request.expectedDossierRevision,
        recordedAt: host.now?.() ?? new Date().toISOString() }, study, currentStudy: study,
      qualificationInput: study.requestSnapshot.qualificationInput, preferenceId: uid('qualified-advice-preference'),
      optionId: option.id, reason: request.reason });
      command = createHopV55QualifiedStudyPreferenceCommandV1({ preparation, event });
    }
    const result = await appendHopV55QualifiedStudyPreference({ workspaces: host.services.workspaces,
      qualifiedStudies: host.services.qualifiedStudies, command,
      validateFreshness: async () => inspectAgainstCurrent(preparation) });
    host.preferenceReceived?.(result);
    return { dossier: result.dossierAdvice3, event: result.eventAdvice3, events: result.eventsAdvice3,
      freshContext: result.freshContext };
  }

  return { inspectAdvice, prepareAdvice, saveAdviceStudy, preferAdvice, freshness };
}
