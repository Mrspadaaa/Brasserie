import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopCatalogueLoaderInput } from '../../domain/hopDecision/catalogueLoader';
import type { HopDecisionContext, HopDecisionStudySnapshotV2 } from '../../domain/hopDecision/dossier';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopV55Services, HopV55Workspace } from './contracts';
import { readHopV55DecisionReadingArchive, type HopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource } from './decisionArchive';
import { prepareHopV55ProductStudyV1, prepareHopV55ProductStudyV2, inspectHopV55ProductStudyPreparedReferenceV1,
  inspectHopV55ProductStudyPreparedReferenceV2 } from './productStudyPreparation';
import { isHopV55StructuredDecisionReadingArchive } from './decisionReadingAccessors';
import { appendHopV55QualifiedStudyPreparationRecord, readHopV55QualifiedStudyPreparation,
  saveHopV55QualifiedStudy, type HopV55QualifiedStudyPreparationV1,
  type HopV55QualifiedStudyFreshnessInput, type PersistHopV55QualifiedStudyResult } from './qualifiedStudyWorkspace';

export interface HopV55QualifiedStudyHost {
  services: Pick<HopV55Services, 'scope' | 'ownerKey' | 'workspaces' | 'qualifiedStudies'>;
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
  selected(preparation: HopV55QualifiedStudyPreparationV1): void;
  received(result: PersistHopV55QualifiedStudyResult): void;
}

export interface HopV55QualifiedProductStudySaveRequest {
  kind: 'products';
  study: HopDecisionStudySnapshotV2<'understandProducts'>;
  sourceReadingReference: string;
  studyReference: string;
  expectedStudyReference: string;
}

const uid = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;
const same = (a: unknown, b: unknown) => hopDecisionReference(a) === hopDecisionReference(b);

/** Qualification and persistence are explicit gestures; historical renderers never call this controller. */
export function createHopV55QualifiedStudyController(host: HopV55QualifiedStudyHost) {
  function enabled() {
    if (!host.enabled()) throw Error('Le raccord d’étude produit attend ses vérifications.');
  }
  function workspaceScope(workspace: HopV55Workspace, expectedId?: string) {
    if (workspace.ownerKey !== host.services.ownerKey || expectedId && workspace.id !== expectedId) {
      throw Error('Le propriétaire ou le dossier de cette étude a changé.');
    }
  }
  function exactArchive(workspace: HopV55Workspace, reference: string) {
    const raw = workspace.decisionReadings?.find(row => row.contentReference === reference);
    const read = raw && readHopV55DecisionReadingArchive(raw);
    if (!read || read.status !== 'available' || !isHopV55StructuredDecisionReadingArchive(read.archive)) {
      throw Error('La lecture structurée exacte de cette étude doit rester disponible.');
    }
    return read.archive;
  }
  /** Product study DTO by source capability: V1 for a historical V2/V3 reading, V2 for a semantic V4 reading. */
  const inspectProducts = (archiveFormat: string, input: Parameters<typeof inspectHopV55ProductStudyPreparedReferenceV1>[0]) =>
    archiveFormat === 'hop-v55-decision-reading-v4' ? inspectHopV55ProductStudyPreparedReferenceV2(input)
      : inspectHopV55ProductStudyPreparedReferenceV1(input);
  async function freshness(input: HopV55QualifiedStudyFreshnessInput) {
    const { preparation } = input;
    const workspace = await host.workspace(); workspaceScope(workspace, preparation.workspaceId);
    const archive = exactArchive(workspace, preparation.sourceReadingReference);
    if (host.historical() || host.reading()?.contentReference !== archive.contentReference
      || !same(archive.source, host.source(workspace))) {
      return { status: 'historical' as const, reason: 'La lecture ou la source active a changé; cette étude reste liée à son ancienne lecture.' };
    }
    if (preparation.kind !== 'products' || preparation.createCommand.kind !== 'products') {
      throw Error('Cette commande ne correspond pas à une étude produit.');
    }
    const context = await host.context();
    const prepared = prepareBrewingScenarioContext(context);
    const action = preparation.createCommand.study.request.action;
    if (action.kind !== 'understandProducts') throw Error('La commande conservée n’examine pas des fiches produit.');
    const ids = action.productIds;
    if (!ids?.length) throw Error('Le périmètre produit exact est absent de la commande conservée.');
    const inspected = await inspectProducts(archive.format, { workspace,
      ownerKey: host.services.ownerKey, workspaceId: workspace.id, sourceReadingReference: archive.contentReference,
      expectedRuntimeReference: host.runtimeReference(prepared), requestedProductIds: ids,
      sourceContext: host.sourceContext(context, prepared, workspace), catalogueInput: host.catalogueInput(context) });
    if (inspected.status !== 'ready' || inspected.preparedReference !== preparation.preparedReference) {
      return { status: 'historical' as const, reason: inspected.status === 'refused' ? inspected.reason
        : 'Les données qualifiées ou le contexte de cette étude ont changé; prépare une nouvelle étude.' };
    }
    // Recheck the displayed reading after the asynchronous catalogue load.
    const latest = await host.workspace(); workspaceScope(latest, preparation.workspaceId);
    if (host.historical() || host.reading()?.contentReference !== archive.contentReference
      || !same(exactArchive(latest, archive.contentReference).source, host.source(latest))) {
      return { status: 'historical' as const, reason: 'La source a changé pendant la vérification de cette étude.' };
    }
    return { status: 'current' as const };
  }
  async function prepareProducts(requestedProductIds: readonly string[]) {
    enabled();
    if (host.historical()) throw Error('Cette lecture est figée; réexamine sa demande avant de préparer une étude actuelle.');
    const archive = host.reading();
    if (!isHopV55StructuredDecisionReadingArchive(archive)) {
      throw Error('Conserve une lecture de produits avant de préparer son étude.');
    }
    const workspace = await host.workspace(); workspaceScope(workspace);
    exactArchive(workspace, archive.contentReference);
    if (!same(archive.source, host.source(workspace))) throw Error('La source de cette lecture a changé.');
    const context = await host.context();
    const prepared = prepareBrewingScenarioContext(context);
    const prepareProductStudy = archive.format === 'hop-v55-decision-reading-v4' ? prepareHopV55ProductStudyV2 : prepareHopV55ProductStudyV1;
    const created = await prepareProductStudy({ workspace, ownerKey: host.services.ownerKey,
      workspaceId: workspace.id, sourceReadingReference: archive.contentReference,
      expectedRuntimeReference: host.runtimeReference(prepared), requestedProductIds,
      sourceContext: host.sourceContext(context, prepared, workspace), catalogueInput: host.catalogueInput(context),
      identity: { preparationId: uid('qualified-product-preparation'), dossierId: uid('qualified-product-study'),
        eventId: uid('qualified-product-saved'), recordedAt: new Date().toISOString() } });
    if (created.status !== 'ready') throw Error(created.reason);
    const preparation = created.result.preparation;
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await host.workspace(); workspaceScope(latest, workspace.id);
      const current = await freshness({ preparation, phase: 'beforeCreate' });
      if (current.status !== 'current') throw Error(current.reason);
      try {
        await host.save(appendHopV55QualifiedStudyPreparationRecord(latest, preparation));
        host.selected(preparation); return preparation;
      } catch (error) { if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error; }
    }
    throw Error('La préparation de cette étude attend une reprise de sauvegarde.');
  }
  async function saveProducts(preparationReference: string, request: HopV55QualifiedProductStudySaveRequest) {
    enabled();
    const workspace = await host.workspace(); workspaceScope(workspace);
    const raw = workspace.qualifiedStudyPreparations?.find(row => row.reference === preparationReference);
    const read = raw && readHopV55QualifiedStudyPreparation(raw);
    if (!read || read.status !== 'available' || read.preparation.kind !== 'products'
      || read.preparation.createCommand.kind !== 'products') throw Error('La préparation produit exacte n’est plus disponible.');
    const preparation = read.preparation;
    if (request.sourceReadingReference !== preparation.sourceReadingReference
      || request.expectedStudyReference !== preparation.studyReference || request.studyReference !== preparation.studyReference
      || !same(request.study, preparation.createCommand.study)) throw Error('La confirmation vise une autre lecture ou étude.');
    const saved = await saveHopV55QualifiedStudy({ workspaces: host.services.workspaces,
      qualifiedStudies: host.services.qualifiedStudies, preparation, validateFreshness: freshness });
    host.received(saved); return saved;
  }
  return { prepareProducts, saveProducts, freshness };
}
