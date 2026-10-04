import { hopMeasurementError, type HopMeasurement } from '../../../functions/src/hopIndexSchema';
import { HOP_DECISION_VERSION, type HopCommercialProduct, type HopDecisionMaterial } from './types';
import type { HopClassicDecisionAction as HopDecisionAction, HopClassicDecisionKind, HopDecisionIntent, HopDecisionResponse, HopDecisionResults } from './service';
import type { HopPlannerRequest, HopPlannerResult, HopPlannerSelection } from './planner';
import type { HopRecipeDraftResult, HopRecipeLike } from './recipeAdapter';
import type { HopPlannedRecipePreview } from './plannerRecipe';
import type { HopCatalogueQualificationInput } from './catalogueQualification';
import { hopDecisionReference } from './measurements';
import { readHopAdviceDossier, readHopAdviceEvent,
  type HopAdviceDossierRead, type HopAdviceEventRead, type HopAdviceEventV3 } from './adviceDossier';

export type HopDecisionContext =
  | { kind: 'recipe'; recipeId: string; recipeReference: string }
  | { kind: 'batch'; batchId: string; recipeId?: string; recipeSnapshotReference: string;
      brewDayRevision: number; programFingerprint: string; stage: string };

export type HopDecisionPublicInput<A extends HopDecisionAction = HopDecisionAction> = {
  intent: HopDecisionIntent;
  action: A;
  materials: HopDecisionMaterial[];
  products?: HopCommercialProduct[];
};

export interface HopDecisionObservationSnapshot {
  /** Stable identifier within this dossier; distinct from a content reference or a source URL. */
  observationId: string;
  materialId: string;
  origin: 'declared' | 'lot' | 'variety';
  observationRef: string;
  snapshot: HopMeasurement;
}

export interface HopDecisionStudySnapshot<K extends HopClassicDecisionKind = HopClassicDecisionKind> {
  actionKind: K;
  /** Exact public call input, including the original intent, action, catalogue, and optional products. */
  request: HopDecisionPublicInput<Extract<HopDecisionAction, { kind: K }>>;
  /** Exact public response. This preserves its answer, qualified criteria, evidence, sources, and J1 result. */
  responseSnapshot: HopDecisionResponse<K>;
  /** Material context is optional. null means an explicitly standalone study. */
  context: HopDecisionContext | null;
  /** Index only: full measurement snapshots remain unchanged in input.materials. */
  observations: HopDecisionObservationSnapshot[];
}

export type AnyHopDecisionStudySnapshot = {
  [K in HopClassicDecisionKind]: HopDecisionStudySnapshot<K>;
}[HopClassicDecisionKind];

/** Loader provenance is retained opaquely except for this versioned notice contract. */
export interface HopCatalogueAssemblyNoticeV1 {
  materialId: string;
  relatedRecordKey: string;
  reason: string;
}

export interface HopCatalogueAssemblyV1 {
  version: 'hop-catalogue-assembly-v1';
  sources: unknown[];
  links: unknown[];
  evidenceBindings: unknown[];
  notices: HopCatalogueAssemblyNoticeV1[];
  limitations: unknown[];
}

/** Unknown loader versions remain byte-for-byte data in a read-only v2 envelope. */
export type HopDecisionQualificationInput = HopCatalogueQualificationInput & {
  assembly?: HopCatalogueAssemblyV1 | { version: string; [key: string]: unknown };
};

export interface HopDecisionQualifiedRequest<A extends HopDecisionAction = HopDecisionAction> {
  intent: HopDecisionIntent;
  action: A;
  qualificationInput: HopDecisionQualificationInput;
  products?: HopCommercialProduct[];
}

export interface HopDecisionQualificationSnapshot {
  version: string;
  result: unknown;
}

export interface HopDecisionResolutionIssue {
  code: string;
  reason: string;
  materialId?: string;
  role?: 'indispensable' | 'candidate' | 'support';
  recordKeys?: string[];
}

export interface HopDecisionSkippedCandidate {
  materialId: string;
  recordKeys: string[];
  disposition: 'missing' | 'ambiguous' | 'collisionNeedsSelection' | 'selectionInvalid' | 'archivedTombstone' | 'noSafeProjection' | 'searchLimit' | 'stockAliasConflict';
  reasons: string[];
}

export interface HopDecisionEvaluatedRecord {
  recordKey: string;
  status: 'ready' | 'equivalentVariants' | 'collisionNeedsSelection' | 'selectionInvalid' | 'archivedTombstone';
  role: 'indispensable' | 'candidate' | 'support';
  /** One record can serve the current program and remain a candidate for another addition. */
  roles: Array<'indispensable' | 'candidate' | 'support'>;
  materialIds: string[];
  projection: 'calculation' | 'commonCalculation' | 'unavailable';
  reasons: string[];
}

interface HopDecisionStudySnapshotV2Base<K extends HopClassicDecisionKind> {
  readonly formatVersion: 2;
  readonly actionKind: K;
  /** Exact original intent, action, products, evidence, variants, choices and assembly receipt. */
  readonly request: HopDecisionQualifiedRequest<Extract<HopDecisionAction, { kind: K }>>;
  /** Result of the one explicit qualification performed for this new calculation. */
  readonly qualificationSnapshot: HopDecisionQualificationSnapshot;
  readonly context: HopDecisionContext | null;
  readonly evaluatedRecords: HopDecisionEvaluatedRecord[];
  readonly partialRecordKeys: string[];
  readonly reasons: string[];
  readonly skippedCandidates: HopDecisionSkippedCandidate[];
  readonly blockingIssues: HopDecisionResolutionIssue[];
}

export interface HopDecisionCalculatedStudySnapshotV2<K extends HopClassicDecisionKind = HopClassicDecisionKind>
  extends HopDecisionStudySnapshotV2Base<K> {
  readonly kind: 'calculated';
  /** The exact safe projection/action actually passed to answerHopDecision. */
  readonly calculationInput: HopDecisionPublicInput<Extract<HopDecisionAction, { kind: K }>>;
  /** Integral, actual J1 response. It may be conditional or have no applicable option. */
  readonly responseSnapshot: HopDecisionResponse<K>;
  readonly resolutionCoverage: 'complete' | 'partial';
}

export interface HopDecisionResolutionRequiredStudySnapshotV2<K extends HopClassicDecisionKind = HopClassicDecisionKind>
  extends HopDecisionStudySnapshotV2Base<K> {
  readonly kind: 'resolutionRequired';
  readonly calculationInput: null;
  readonly responseSnapshot: null;
  readonly resolutionCoverage: 'partial';
}

export type HopDecisionStudySnapshotV2<K extends HopClassicDecisionKind = HopClassicDecisionKind> =
  | HopDecisionCalculatedStudySnapshotV2<K>
  | HopDecisionResolutionRequiredStudySnapshotV2<K>;

export type AnyHopDecisionStudySnapshotV2 = {
  [K in HopClassicDecisionKind]: HopDecisionStudySnapshotV2<K>;
}[HopClassicDecisionKind];

export type HopPlannedRecipeOutcome<T extends HopRecipeLike = HopRecipeLike> =
  | HopPlannedRecipePreview<T>
  | (Extract<HopRecipeDraftResult<T>, { status: 'needsAlphaSelection' }> & {
      requestReference: string;
      selection: HopPlannerSelection;
    });

export type HopDecisionDossierState =
  | 'studySaved'
  | 'optionRetained'
  | 'programPrepared'
  | 'correctionRecorded'
  | 'supersededBy';

export interface HopDecisionDossierV1 {
  readonly formatVersion: 1;
  readonly dossierId: string;
  readonly ownerKey: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastEventId: string;
  readonly state: HopDecisionDossierState;
  readonly lastDecisionId?: string;
  readonly lastPreparationId?: string;
  readonly preparationStatus?: HopPlannedRecipeOutcome['status'];
  /** Write-once exact public study. Events may change the projection, never this snapshot. */
  readonly study: AnyHopDecisionStudySnapshot;
  readonly supersedesDossierId?: string;
  readonly supersededByDossierId?: string;
}

export interface HopDecisionDossierV2 {
  readonly formatVersion: 2;
  readonly dossierId: string;
  readonly ownerKey: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastEventId: string;
  readonly state: HopDecisionDossierState;
  readonly lastDecisionId?: string;
  readonly lastPreparationId?: string;
  readonly preparationStatus?: HopPlannedRecipeOutcome['status'];
  /** The exact study is immutable; the event stream only changes its projection. */
  readonly study: AnyHopDecisionStudySnapshotV2;
  readonly supersedesDossierId?: string;
  readonly supersededByDossierId?: string;
}

export interface HopDecisionEventPayloadV1 {
  studySaved: { snapshotFormatVersion: 1; supersedesDossierId?: string };
  optionRetained: {
    decisionId: string;
    optionId: string;
    selection: HopPlannerSelection;
    reason: string;
  };
  programPrepared: {
    decisionId: string;
    optionId: string;
    preparationId: string;
    /** Full previewHopPlannedRecipe result, including request/selection/conventions and recipePreview. */
    preview: HopPlannedRecipeOutcome;
  };
  correctionRecorded: {
    successorDossierId: string;
    reason: string;
    correctedObservationIds: string[];
  };
  supersededBy: {
    successorDossierId: string;
    reason: string;
  };
}

type HopDecisionEventKindV1 = keyof HopDecisionEventPayloadV1;
type HopDecisionEventFor<K extends HopDecisionEventKindV1> = {
  readonly eventFormatVersion: 1;
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly eventId: string;
  readonly expectedRevision: number;
  readonly resultingRevision: number;
  readonly recordedAt: string;
  readonly kind: K;
  readonly payload: HopDecisionEventPayloadV1[K];
};

export type HopDecisionEventV1 = {
  [K in HopDecisionEventKindV1]: HopDecisionEventFor<K>;
}[HopDecisionEventKindV1];

type HopDecisionEventKindV2 = HopDecisionEventKindV1;
type HopDecisionEventForV2<K extends HopDecisionEventKindV2> = {
  readonly eventFormatVersion: 2;
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly eventId: string;
  readonly expectedRevision: number;
  readonly resultingRevision: number;
  readonly recordedAt: string;
  readonly kind: K;
  readonly payload: K extends 'studySaved' ? { snapshotFormatVersion: 2; supersedesDossierId?: string } : HopDecisionEventPayloadV1[K];
};

export type HopDecisionEventV2 = {
  [K in HopDecisionEventKindV2]: HopDecisionEventForV2<K>;
}[HopDecisionEventKindV2];

export type HopDecisionWritableEvent = HopDecisionEventV1 | HopDecisionEventV2 | HopAdviceEventV3;

export type HopDecisionEventCommand<K extends HopDecisionEventKindV1 = HopDecisionEventKindV1> = {
  [P in K]: Omit<HopDecisionEventFor<P>, 'eventFormatVersion' | 'resultingRevision'>;
}[K];

export type HopDecisionEventCommandV2<K extends HopDecisionEventKindV2 = HopDecisionEventKindV2> = {
  [P in K]: Omit<HopDecisionEventForV2<P>, 'eventFormatVersion' | 'resultingRevision'>;
}[K];

export interface CreateHopDecisionDossierInput {
  ownerKey: string;
  dossierId: string;
  eventId: string;
  recordedAt: string;
  study: AnyHopDecisionStudySnapshot;
  supersedesDossierId?: string;
}

export interface CreateHopDecisionDossierV2Input extends Omit<CreateHopDecisionDossierInput, 'study'> {
  study: AnyHopDecisionStudySnapshotV2;
}

export interface CreatedHopDecisionDossier {
  dossier: HopDecisionDossierV1;
  event: HopDecisionEventV1;
}

export interface CreatedHopDecisionDossierV2 {
  dossier: HopDecisionDossierV2;
  event: HopDecisionEventV2;
}

export interface HopDecisionUnsupportedDossier {
  readonly status: 'unsupportedFormat';
  readonly reason: 'formatVersion' | 'calculationVersion' | 'qualificationVersion' | 'assemblyVersion';
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly formatVersion: number;
  /** Exact stored value, returned without upcasting, editing, or recalculation. */
  readonly raw: unknown;
}

export type HopDecisionDossierRead = HopDecisionDossierV1 | HopDecisionDossierV2 | HopDecisionUnsupportedDossier | HopAdviceDossierRead;

export interface HopDecisionUnsupportedEvent {
  readonly status: 'unsupportedEventFormat';
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly eventId: string;
  readonly eventFormatVersion: number;
  readonly raw: unknown;
}

export type HopDecisionEventRead = HopDecisionEventV1 | HopDecisionEventV2 | HopDecisionUnsupportedEvent | HopAdviceEventRead;

export class HopDecisionDossierError extends Error {
  constructor(readonly code: 'invalidInput' | 'unsupportedFormat' | 'staleRevision' | 'invalidTransition', message: string) {
    super(message);
    this.name = 'HopDecisionDossierError';
  }
}

/** A successor may retain an older source snapshot, never downgrade away its qualification contract. */
export function assertHopDecisionSupersedesFormatCompatible(successorFormatVersion: number, sourceFormatVersion: number): void {
  if (sourceFormatVersion === 3 && successorFormatVersion < 3) {
    throw new HopDecisionDossierError('invalidTransition', 'Un successeur ne peut pas retirer le contrat de conseil/préférence v3 de son origine.');
  }
  if (successorFormatVersion === 1 && sourceFormatVersion === 2) {
    throw new HopDecisionDossierError('invalidTransition', 'Un successeur v1 ne peut pas remplacer une étude qualifiée v2 et effacer ce contrat.');
  }
}

const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isoDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const clone = <T>(value: T): T => structuredClone(value);
const invalid = (message: string): never => { throw new HopDecisionDossierError('invalidInput', message); };
const SUPPORTED_QUALIFICATION_VERSION = 'hop-catalogue-qualification-v1';
const SUPPORTED_ASSEMBLY_VERSION = 'hop-catalogue-assembly-v1';

function measurementList(material: HopDecisionMaterial, origin: HopDecisionObservationSnapshot['origin']): HopMeasurement[] {
  if (origin === 'declared') return material.declaredAnalysis ?? [];
  if (origin === 'lot') return material.lot?.analysis ?? [];
  return material.variety?.analysis ?? [];
}

function validateObservations(input: HopDecisionPublicInput, observations: HopDecisionObservationSnapshot[]): void {
  if (!Array.isArray(observations)) invalid('Le registre d’observations doit être une liste, vide si aucune observation n’existe.');
  const materialById = new Map(input.materials.map(material => [material.id, material]));
  const ids = new Set<string>();
  const unused = observations.map((observation, index) => ({ observation, index, used: false }));
  for (const row of unused) {
    const observation = row.observation;
    if (!record(observation) || !nonempty(observation.observationId) || ids.has(observation.observationId)
      || !nonempty(observation.materialId) || !['declared', 'lot', 'variety'].includes(observation.origin)
      || !nonempty(observation.observationRef) || !record(observation.snapshot)) invalid('Référence d’observation incomplète ou répétée.');
    ids.add(observation.observationId);
    if (hopMeasurementError(observation.snapshot)) invalid(`Observation invalide : ${observation.observationId}.`);
    if (hopDecisionReference(observation.snapshot) !== observation.observationRef) invalid(`La référence canonique de l’observation ${observation.observationId} ne correspond pas à son instantané.`);
    const material = materialById.get(observation.materialId);
    if (!material || !measurementList(material, observation.origin).some(measurement =>
      hopDecisionReference(measurement) === observation.observationRef
      && hopDecisionReference(measurement) === hopDecisionReference(observation.snapshot))) {
      invalid(`L’observation ${observation.observationId} ne correspond pas à l’analyse exacte de sa matière et de son origine.`);
    }
  }
  for (const material of input.materials) {
    for (const origin of ['declared', 'lot', 'variety'] as const) {
      for (const measurement of measurementList(material, origin)) {
        const match = unused.find(row => !row.used && row.observation.materialId === material.id
          && row.observation.origin === origin && row.observation.observationRef === hopDecisionReference(measurement));
        if (!match) invalid(`L’observation ${origin} de ${material.id} n’est pas indexée dans le dossier.`);
        match.used = true;
      }
    }
  }
  if (unused.some(row => !row.used)) invalid('Le registre contient une observation qui ne fait pas partie de l’entrée publique figée.');
}

function validateContext(context: HopDecisionContext | null): void {
  if (context === null) return;
  if (!record(context)) invalid('Contexte de décision invalide.');
  if (context.kind === 'recipe') {
    if (!nonempty(context.recipeId) || !nonempty(context.recipeReference)) invalid('Référence recette incomplète.');
    return;
  }
  if (context.kind === 'batch') {
    if (!nonempty(context.batchId) || context.recipeId !== undefined && !nonempty(context.recipeId)
      || !nonempty(context.recipeSnapshotReference) || !Number.isSafeInteger(context.brewDayRevision)
      || context.brewDayRevision < 0 || !nonempty(context.programFingerprint) || !nonempty(context.stage)) invalid('Référence de brassin incomplète.');
    return;
  }
  invalid('Nature de contexte inconnue.');
}

function plannerRequestFromInput(input: HopDecisionPublicInput<Extract<HopDecisionAction, { kind: 'planReplacement' }>>): HopPlannerRequest {
  const action = input.action;
  return {
    question: input.intent.originalQuestion,
    interpretation: input.intent.interpretation ?? '',
    criteria: input.intent.criteria ?? [],
    program: action.program,
    unavailable: action.unavailable,
    materials: input.materials,
    exclusions: action.exclusions,
    basisByUse: action.basisByUse,
    candidateMaterialIds: action.candidateMaterialIds,
    limits: action.limits,
  };
}

function validateStudySnapshot(study: AnyHopDecisionStudySnapshot): void {
  if ((study?.actionKind as string) === 'exploreStrategies') invalid('Le conseil exige un dossier de format 3 ; le format 1 conserve son contrat historique.');
  if (!record(study) || !nonempty(study.actionKind) || !record(study.request) || !record(study.responseSnapshot)
    || !record(study.request.intent) || !record(study.request.action) || !Array.isArray(study.request.materials)) invalid('Étude publique houblon invalide.');
  const input = study.request as HopDecisionPublicInput;
  const response = study.responseSnapshot as HopDecisionResponse;
  if (input.action.kind !== study.actionKind || response.actionKind !== study.actionKind || response.version !== HOP_DECISION_VERSION
    || hopDecisionReference(response.intent) !== hopDecisionReference(input.intent)) invalid('L’entrée publique et sa réponse ne décrivent pas la même action J1.');
  if (!Array.isArray(input.materials) || input.materials.some(material => !record(material) || !nonempty(material.id))
    || new Set(input.materials.map(material => material.id)).size !== input.materials.length) invalid('Identifiants de matières invalides ou répétés dans le snapshot.');
  validateContext(study.context);
  validateObservations(input, study.observations);
  if (study.actionKind === 'planReplacement') {
    const planInput = input as HopDecisionPublicInput<Extract<HopDecisionAction, { kind: 'planReplacement' }>>;
    const plannerResponse = response as HopDecisionResponse<'planReplacement'>;
    const expectedRequest = plannerRequestFromInput(planInput);
    const requestReference = `hop-planner-request-v1:${hopDecisionReference(expectedRequest)}`;
    if (hopDecisionReference(plannerResponse.result.request) !== hopDecisionReference(expectedRequest)
      || plannerResponse.result.plan.requestReference !== requestReference) invalid('La réponse planReplacement ne correspond pas à l’entrée publique figée.');
  }
}

/** Structural only: this reader deliberately has no runtime dependency on the service or qualifier. */
function validateStudySnapshotV2(study: AnyHopDecisionStudySnapshotV2): void {
  if ((study?.actionKind as string) === 'exploreStrategies') invalid('Le conseil exige un dossier de format 3 ; le format 2 conserve son contrat historique.');
  if (!record(study) || study.formatVersion !== 2 || !['calculated', 'resolutionRequired'].includes(study.kind)
    || !nonempty(study.actionKind) || !record(study.request) || !record(study.request.intent)
    || !record(study.request.action) || !record(study.request.qualificationInput)
    || !Array.isArray(study.request.qualificationInput.variants)
    || !record(study.qualificationSnapshot) || !nonempty(study.qualificationSnapshot.version)
    || !Object.prototype.hasOwnProperty.call(study.qualificationSnapshot, 'result')
    || !Array.isArray(study.evaluatedRecords) || !Array.isArray(study.partialRecordKeys)
    || !Array.isArray(study.reasons) || !Array.isArray(study.skippedCandidates) || !Array.isArray(study.blockingIssues)) {
    invalid('Étude qualifiée v2 mal formée.');
  }
  if (study.request.action.kind !== study.actionKind || typeof study.request.intent.originalQuestion !== 'string'
    || !study.request.intent.originalQuestion.trim()) invalid('La demande originale ne correspond pas à l’action qualifiée.');
  const assembly = study.request.qualificationInput.assembly;
  if (assembly !== undefined && (!record(assembly) || !nonempty(assembly.version))) invalid('Bloc d’assemblage mal formé.');
  if (study.kind === 'calculated') {
    if (!record(study.calculationInput) || !record(study.calculationInput.intent) || !record(study.calculationInput.action)
      || !Array.isArray(study.calculationInput.materials) || !record(study.responseSnapshot)
      || study.calculationInput.action.kind !== study.actionKind || study.responseSnapshot.actionKind !== study.actionKind
      || !nonempty(study.responseSnapshot.version) || !['complete', 'partial'].includes(study.resolutionCoverage)) {
      invalid('Étude qualifiée calculée sans entrée réellement consommée ni réponse structurée.');
    }
  } else if (study.calculationInput !== null || study.responseSnapshot !== null || study.resolutionCoverage !== 'partial'
    || !study.blockingIssues.length) {
    invalid('Étude nécessitant une résolution : garder entrée/réponse nulles et les blocages structurés.');
  }
  validateContext(study.context);
}

function validateStudySnapshotV2ForCreate(study: AnyHopDecisionStudySnapshotV2): void {
  validateStudySnapshotV2(study);
  if (study.kind !== 'calculated') return;
  if (study.qualificationSnapshot.version !== SUPPORTED_QUALIFICATION_VERSION
    || study.request.qualificationInput.assembly !== undefined && study.request.qualificationInput.assembly.version !== SUPPORTED_ASSEMBLY_VERSION
    || study.responseSnapshot.version !== HOP_DECISION_VERSION) {
    invalid('Une étude calculée ne peut être créée que depuis les versions de qualification, assembly et calcul reconnues.');
  }
  const calculationInput = study.calculationInput;
  if (hopDecisionReference(study.request.intent) !== hopDecisionReference(calculationInput.intent)
    || hopDecisionReference(study.request.intent) !== hopDecisionReference(study.responseSnapshot.intent)
    || study.responseSnapshot.actionKind !== study.actionKind) invalid('La réponse calculée ne correspond pas à l’intention originale.');

  const qualification = study.qualificationSnapshot.result as Record<string, any>;
  if (!record(qualification) || qualification.version !== SUPPORTED_QUALIFICATION_VERSION || !Array.isArray(qualification.groups)) {
    invalid('Le résultat de qualification reconnu manque au snapshot v2.');
  }
  const sourceVariants = study.request.qualificationInput.variants;
  const allSourceMaterialIds = [...new Set(sourceVariants.map(row => row.material.id))];
  const resultVariants = qualification.groups.flatMap((group: any) => Array.isArray(group?.rawVariants) ? group.rawVariants : []);
  const sourceById = [...sourceVariants].sort((a, b) => a.variantId.localeCompare(b.variantId));
  const resultById = resultVariants.sort((a: any, b: any) => String(a?.variantId ?? '').localeCompare(String(b?.variantId ?? '')));
  if (hopDecisionReference(sourceById) !== hopDecisionReference(resultById)) invalid('Les variantes brutes de la qualification ne correspondent pas à la demande archivée.');

  const groupByKey = new Map<string, Record<string, any>>();
  for (const group of qualification.groups) {
    if (!record(group) || !nonempty(group.key) || groupByKey.has(group.key)) invalid('Le résultat de qualification contient un recordKey absent ou répété.');
    groupByKey.set(group.key, group);
  }
  const evaluated = new Map<string, { group: Record<string, any>; material: HopDecisionMaterial | null }>();
  for (const row of study.evaluatedRecords) {
    const roles: unknown[] = row?.roles ?? [row?.role];
    if (!record(row) || !nonempty(row.recordKey) || evaluated.has(row.recordKey) || !Array.isArray(row.materialIds)
      || !Array.isArray(roles) || !roles.length || !roles.includes(row.role)
      || roles.some((role: unknown) => !['indispensable', 'candidate', 'support'].includes(String(role)))
      || new Set(roles).size !== roles.length) invalid('Record qualifié évalué incomplet ou répété.');
    const group = groupByKey.get(row.recordKey);
    if (!group || group.status !== row.status) invalid('Le record évalué ne correspond pas au résultat de qualification archivé.');
    const rawIds = [...new Set(group.rawVariants.map((variant: any) => variant.material?.id).filter(nonempty))].sort();
    if (hopDecisionReference([...row.materialIds].sort()) !== hopDecisionReference(rawIds)) invalid('Les identités matière du record évalué ont changé.');
    let material: HopDecisionMaterial | null = null;
    if (row.projection === 'calculation') {
      if (group.status !== 'ready' && group.status !== 'equivalentVariants') invalid('Projection calculatoire incohérente avec le statut du groupe.');
      material = group.calculationProjection?.material ?? null;
    } else if (row.projection === 'commonCalculation') {
      if (group.status !== 'collisionNeedsSelection') invalid('Projection commune incohérente avec le statut du groupe.');
      material = group.commonCalculationProjection?.material ?? null;
    } else if (row.projection !== 'unavailable') invalid('Nature de projection inconnue dans le record évalué.');
    if (row.projection !== 'unavailable' && (!material || !row.materialIds.includes(material.id))) invalid('Projection évaluée absente ou étrangère au groupe.');
    evaluated.set(row.recordKey, { group, material });
  }

  const calculationMaterials = calculationInput.materials;
  if (new Set(calculationMaterials.map(material => material.id)).size !== calculationMaterials.length) invalid('La projection calculatoire contient des identités matière répétées.');
  for (const material of calculationMaterials) {
    const matches = [...evaluated.values()].filter(({ material: projection }) =>
      projection?.id === material.id && hopDecisionReference(projection) === hopDecisionReference(material));
    const rawScopes = qualification.groups.filter((group: any) => group.rawVariants.some((variant: any) => variant.material?.id === material.id));
    if (matches.length !== 1 || rawScopes.length !== 1) invalid(`La matière calculatoire ${material.id} n’est pas la projection sûre exacte d’un seul record évalué.`);
  }

  const originalAction = study.request.action as HopDecisionAction;
  const executedAction = calculationInput.action as HopDecisionAction;
  const excludedForStockConflict = new Set(study.skippedCandidates.filter(row => row.disposition === 'stockAliasConflict').map(row => row.materialId));
  const evaluatedCandidateIds = new Set(study.evaluatedRecords.filter(row => (row.roles ?? [row.role]).includes('candidate'))
    .flatMap(row => row.materialIds).filter(id => calculationMaterials.some(material => material.id === id)));
  for (const materialId of excludedForStockConflict) evaluatedCandidateIds.delete(materialId);

  if (originalAction.kind === 'substitute' && executedAction.kind === 'substitute') {
    const sourceMaterialId = originalAction.program.additions.find(row => row.id === originalAction.additionId)?.materialId;
    const expectedSource = (originalAction.candidateIds ?? allSourceMaterialIds).filter(id => id !== sourceMaterialId && evaluatedCandidateIds.has(id));
    const { candidateIds: _original, ...originalRest } = originalAction;
    const { candidateIds: executed, ...executedRest } = executedAction;
    if (hopDecisionReference(originalRest) !== hopDecisionReference(executedRest)
      || hopDecisionReference(executed ?? []) !== hopDecisionReference(expectedSource)) invalid('La liste de substitution exécutée ne correspond pas aux candidats explicités et qualifiés.');
  } else if (originalAction.kind === 'planReplacement' && executedAction.kind === 'planReplacement') {
    const expectedSource = (originalAction.candidateMaterialIds ?? allSourceMaterialIds).filter(id => evaluatedCandidateIds.has(id));
    const { candidateMaterialIds: _original, ...originalRest } = originalAction;
    const { candidateMaterialIds: executed, ...executedRest } = executedAction;
    if (hopDecisionReference(originalRest) !== hopDecisionReference(executedRest)
      || hopDecisionReference(executed ?? []) !== hopDecisionReference(expectedSource)) invalid('La liste du planificateur exécutée ne correspond pas aux candidats explicités et qualifiés.');
  } else if (originalAction.kind === 'understandProducts' && executedAction.kind === 'understandProducts') {
    const { productIds: originalIds, ...originalRest } = originalAction;
    const { productIds: executedIds, ...executedRest } = executedAction;
    if (hopDecisionReference(originalRest) !== hopDecisionReference(executedRest)) invalid('La demande produit a changé avant son calcul.');
    if (originalIds !== undefined && hopDecisionReference(originalIds) !== hopDecisionReference(executedIds)
      || originalIds === undefined && study.request.products === undefined
        && hopDecisionReference(executedIds ?? []) !== hopDecisionReference((calculationInput.products ?? []).map(product => product.id))) invalid('La sélection des produits exécutée ne correspond pas au snapshot qualifié.');
  } else if (hopDecisionReference(originalAction) !== hopDecisionReference(executedAction)) {
    invalid('L’action calculée diffère de l’action originale hors projection de candidats prévue.');
  }

  if (study.request.products !== undefined) {
    if (hopDecisionReference(study.request.products) !== hopDecisionReference(calculationInput.products)) invalid('Les produits consommés ne correspondent pas à la demande originale.');
  } else if (originalAction.kind === 'understandProducts') {
    for (const product of calculationInput.products ?? []) {
      const matches = [...evaluated.values()].filter(({ group, material }) => group.scope === 'product' && material?.product?.id === product.id
        && hopDecisionReference(material.product) === hopDecisionReference(product));
      if (matches.length !== 1) invalid(`Le produit ${product.id} n’est pas une projection produit sûre et retenue.`);
    }
  } else if (Object.prototype.hasOwnProperty.call(calculationInput, 'products')) invalid('Un produit non demandé a été ajouté à l’entrée calculatoire.');

  if (study.actionKind === 'planReplacement') {
    if (calculationInput.action.kind !== 'planReplacement' || study.responseSnapshot.actionKind !== 'planReplacement') invalid('Le plan calculé ne correspond pas à l’action originale.');
    const response = study.responseSnapshot as HopDecisionResponse<'planReplacement'>;
    const expectedRequest = plannerRequestFromInput(calculationInput as HopDecisionPublicInput<Extract<HopDecisionAction, { kind: 'planReplacement' }>>);
    const requestReference = `hop-planner-request-v1:${hopDecisionReference(expectedRequest)}`;
    if (hopDecisionReference(response.result.request) !== hopDecisionReference(expectedRequest)
      || response.result.plan.requestReference !== requestReference) invalid('La réponse/plan J1 ne correspond pas aux matières réellement projetées.');
  }
}

function validateSelection(study: AnyHopDecisionStudySnapshot, decisionId: string, optionId: string, selection: HopPlannerSelection): void {
  if (!nonempty(decisionId) || !nonempty(optionId) || !record(selection)) invalid('Identité de décision ou de voie absente.');
  if (study.actionKind !== 'planReplacement') invalid('Cette action publique ne produit pas de sélection de voies J1.');
  const response = study.responseSnapshot as HopDecisionResponse<'planReplacement'>;
  if (selection.requestReference !== response.result.plan.requestReference || selection.pathId !== optionId
    || !response.result.plan.paths.some(path => path.pathId === optionId && path.complete)) invalid('La sélection ne correspond pas à une voie complète de la réponse figée.');
  if (!Array.isArray(selection.selectedDoses) || !selection.selectedDoses.length
    || new Set(selection.selectedDoses.map(dose => dose.additionId)).size !== selection.selectedDoses.length) invalid('Les doses retenues sont absentes ou répétées.');
}

function previewSelection(preview: HopPlannedRecipeOutcome): HopPlannerSelection {
  return preview.selection;
}

function validatePreview(preview: HopPlannedRecipeOutcome, optionId: string): void {
  if (!record(preview) || !nonempty(optionId)) invalid('Reçu final de préparation absent.');
  const selection = previewSelection(preview);
  if (selection.pathId !== optionId || preview.requestReference !== selection.requestReference) invalid('Le reçu final ne correspond pas à la voie et à la requête sélectionnées.');
  if (preview.status === 'needsAlphaSelection') {
    if (!Array.isArray(preview.materialIds) || !Array.isArray(preview.reasons)) invalid('État de préparation incomplet.');
    return;
  }
  if (preview.format !== 'hop-planned-recipe-v1' || !['ready', 'conventionMismatch', 'conventionUnresolved'].includes(preview.status)
    || !nonempty(preview.reference) || !record(preview.recipePreview)) invalid('Reçu hop-planned-recipe incomplet ou non reconnu.');
  const { reference, ...payload } = preview;
  if (hopDecisionReference(payload) !== reference) invalid('Le reçu de préparation a été modifié après sa création.');
  const recipePreview = preview.recipePreview;
  const { reference: recipeReference, ...recipePayload } = recipePreview;
  if (!nonempty(recipeReference) || hopDecisionReference(recipePayload) !== recipeReference) invalid('Le reçu recipePreview a été modifié après sa création.');
}

export function createHopDecisionEvent<K extends HopDecisionEventKindV1>(command: HopDecisionEventCommand<K>): HopDecisionEventFor<K> {
  if (!record(command) || !nonempty(command.ownerKey) || !nonempty(command.dossierId) || !nonempty(command.eventId)
    || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0 || !isoDate(command.recordedAt)
    || !Object.prototype.hasOwnProperty.call(command, 'payload')) invalid('Commande d’événement incomplète ou horodatée de façon invalide.');
  if (command.expectedRevision >= Number.MAX_SAFE_INTEGER) invalid('Révision de dossier hors limites.');
  const resultingRevision = command.expectedRevision + 1;
  const event = { ...clone(command), eventFormatVersion: 1 as const, resultingRevision } as HopDecisionEventFor<K>;
  validateEventShape(event as HopDecisionEventV1);
  return event;
}

function validateEventShape(event: HopDecisionEventV1): void {
  if (!record(event) || event.eventFormatVersion !== 1 || !nonempty(event.ownerKey) || !nonempty(event.dossierId)
    || !nonempty(event.eventId) || !isoDate(event.recordedAt) || !Number.isSafeInteger(event.expectedRevision)
    || !Number.isSafeInteger(event.resultingRevision) || event.resultingRevision !== event.expectedRevision + 1 || !record(event.payload)) invalid('Événement de dossier mal formé.');
  const payload = event.payload as Record<string, any>;
  switch (event.kind) {
    case 'studySaved':
      if (payload.snapshotFormatVersion !== 1 || payload.supersedesDossierId !== undefined && !nonempty(payload.supersedesDossierId)) invalid('Événement initial de sauvegarde incomplet.');
      return;
    case 'optionRetained':
      if (!nonempty(payload.decisionId) || !nonempty(payload.optionId) || !nonempty(payload.reason)
        || !record(payload.selection)) invalid('Événement de rétention incomplet.');
      return;
    case 'programPrepared':
      if (!nonempty(payload.decisionId) || !nonempty(payload.optionId) || !nonempty(payload.preparationId)
        || !record(payload.preview)) invalid('Événement de préparation incomplet.');
      return;
    case 'correctionRecorded':
      if (!nonempty(payload.successorDossierId) || !nonempty(payload.reason) || !Array.isArray(payload.correctedObservationIds)
        || payload.correctedObservationIds.some((id: unknown) => !nonempty(id))) invalid('Événement de correction incomplet.');
      return;
    case 'supersededBy':
      if (!nonempty(payload.successorDossierId) || !nonempty(payload.reason)) invalid('Événement de supersession incomplet.');
      return;
    default:
      invalid('Nature d’événement inconnue.');
  }
}

export function createHopDecisionEventV2<K extends HopDecisionEventKindV2>(command: HopDecisionEventCommandV2<K>): HopDecisionEventForV2<K> {
  if (!record(command) || !nonempty(command.ownerKey) || !nonempty(command.dossierId) || !nonempty(command.eventId)
    || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0 || !isoDate(command.recordedAt)
    || !Object.prototype.hasOwnProperty.call(command, 'payload')) invalid('Commande d’événement v2 incomplète ou horodatée de façon invalide.');
  if (command.expectedRevision >= Number.MAX_SAFE_INTEGER) invalid('Révision de dossier hors limites.');
  const event = { ...clone(command), eventFormatVersion: 2 as const, resultingRevision: command.expectedRevision + 1 } as HopDecisionEventForV2<K>;
  validateEventShapeV2(event as HopDecisionEventV2);
  return event;
}

function validateEventShapeV2(event: HopDecisionEventV2): void {
  if (!record(event) || event.eventFormatVersion !== 2 || !nonempty(event.ownerKey) || !nonempty(event.dossierId)
    || !nonempty(event.eventId) || !isoDate(event.recordedAt) || !Number.isSafeInteger(event.expectedRevision)
    || !Number.isSafeInteger(event.resultingRevision) || event.resultingRevision !== event.expectedRevision + 1 || !record(event.payload)) invalid('Événement de dossier v2 mal formé.');
  const payload = event.payload as Record<string, any>;
  switch (event.kind) {
    case 'studySaved':
      if (payload.snapshotFormatVersion !== 2 || payload.supersedesDossierId !== undefined && !nonempty(payload.supersedesDossierId)) invalid('Événement initial de sauvegarde v2 incomplet.');
      return;
    case 'optionRetained':
      if (!nonempty(payload.decisionId) || !nonempty(payload.optionId) || !nonempty(payload.reason) || !record(payload.selection)) invalid('Événement de rétention v2 incomplet.');
      return;
    case 'programPrepared':
      if (!nonempty(payload.decisionId) || !nonempty(payload.optionId) || !nonempty(payload.preparationId) || !record(payload.preview)) invalid('Événement de préparation v2 incomplet.');
      return;
    case 'correctionRecorded':
      if (!nonempty(payload.successorDossierId) || !nonempty(payload.reason) || !Array.isArray(payload.correctedObservationIds)
        || payload.correctedObservationIds.some((id: unknown) => !nonempty(id))) invalid('Événement de correction v2 incomplet.');
      return;
    case 'supersededBy':
      if (!nonempty(payload.successorDossierId) || !nonempty(payload.reason)) invalid('Événement de supersession v2 incomplet.');
      return;
    default:
      invalid('Nature d’événement v2 inconnue.');
  }
}

export function createHopDecisionDossier(input: CreateHopDecisionDossierInput): CreatedHopDecisionDossier {
  if (!record(input) || !nonempty(input.ownerKey) || !nonempty(input.dossierId) || !nonempty(input.eventId)
    || !isoDate(input.recordedAt) || input.supersedesDossierId !== undefined && (!nonempty(input.supersedesDossierId) || input.supersedesDossierId === input.dossierId)) invalid('Identité ou horodatage du dossier invalide.');
  validateStudySnapshot(input.study);
  const study = clone(input.study);
  const event = createHopDecisionEvent({ ownerKey: input.ownerKey, dossierId: input.dossierId, eventId: input.eventId,
    expectedRevision: 0, recordedAt: input.recordedAt, kind: 'studySaved',
    payload: { snapshotFormatVersion: 1, ...(input.supersedesDossierId ? { supersedesDossierId: input.supersedesDossierId } : {}) } });
  return {
    dossier: {
      formatVersion: 1,
      dossierId: input.dossierId,
      ownerKey: input.ownerKey,
      revision: 1,
      createdAt: input.recordedAt,
      updatedAt: input.recordedAt,
      lastEventId: input.eventId,
      state: 'studySaved',
      study,
      ...(input.supersedesDossierId ? { supersedesDossierId: input.supersedesDossierId } : {}),
    },
    event,
  };
}

export function createHopDecisionDossierV2(input: CreateHopDecisionDossierV2Input): CreatedHopDecisionDossierV2 {
  if (!record(input) || !nonempty(input.ownerKey) || !nonempty(input.dossierId) || !nonempty(input.eventId)
    || !isoDate(input.recordedAt) || input.supersedesDossierId !== undefined && (!nonempty(input.supersedesDossierId) || input.supersedesDossierId === input.dossierId)) invalid('Identité ou horodatage du dossier v2 invalide.');
  validateStudySnapshotV2ForCreate(input.study);
  const study = clone(input.study);
  const event = createHopDecisionEventV2({ ownerKey: input.ownerKey, dossierId: input.dossierId, eventId: input.eventId,
    expectedRevision: 0, recordedAt: input.recordedAt, kind: 'studySaved',
    payload: { snapshotFormatVersion: 2, ...(input.supersedesDossierId ? { supersedesDossierId: input.supersedesDossierId } : {}) } });
  return {
    dossier: {
      formatVersion: 2, dossierId: input.dossierId, ownerKey: input.ownerKey, revision: 1,
      createdAt: input.recordedAt, updatedAt: input.recordedAt, lastEventId: input.eventId,
      state: 'studySaved', study,
      ...(input.supersedesDossierId ? { supersedesDossierId: input.supersedesDossierId } : {}),
    },
    event,
  };
}

export function applyHopDecisionEvent(
  dossier: HopDecisionDossierV1,
  event: HopDecisionEventV1,
  previousEvents: readonly HopDecisionEventV1[] = [],
): HopDecisionDossierV1 {
  validateDossier(dossier);
  validateEventShape(event);
  if (event.ownerKey !== dossier.ownerKey || event.dossierId !== dossier.dossierId) invalid('L’événement appartient à un autre compte ou dossier.');
  if (event.kind === 'studySaved') invalid('La sauvegarde initiale se crée avec le dossier ; elle ne peut pas remplacer son instantané.');
  if (dossier.supersededByDossierId) invalid('Un dossier supersédé reste lisible, mais n’accepte plus de nouvel événement.');
  validateEventHistory(dossier, previousEvents);
  if (event.expectedRevision !== dossier.revision) throw new HopDecisionDossierError('staleRevision', 'La révision attendue du dossier est périmée.');

  const payload = event.payload as Record<string, any>;
  if (event.kind === 'optionRetained') validateSelection(dossier.study, payload.decisionId, payload.optionId, payload.selection);
  if (previousEvents.some(item => item.ownerKey !== dossier.ownerKey || item.dossierId !== dossier.dossierId)) {
    invalid('L’historique fourni contient un événement d’un autre compte ou dossier.');
  }
  if (event.kind === 'programPrepared') {
    const preview = payload.preview as HopPlannedRecipeOutcome;
    validatePreview(preview, payload.optionId);
    const prior = previousEvents.find(item => item.kind === 'optionRetained'
      && item.payload.decisionId === payload.decisionId && item.payload.optionId === payload.optionId);
    if (!prior || prior.kind !== 'optionRetained' || hopDecisionReference(prior.payload.selection) !== hopDecisionReference(previewSelection(preview))) {
      invalid('La préparation doit conserver la même sélection explicitement retenue.');
    }
  }
  if ((event.kind === 'correctionRecorded' || event.kind === 'supersededBy')
    && payload.successorDossierId === dossier.dossierId) invalid('Un dossier ne peut pas se corriger ou se remplacer lui-même.');
  return {
    ...dossier,
    revision: event.resultingRevision,
    updatedAt: event.recordedAt,
    lastEventId: event.eventId,
    state: event.kind,
    ...(event.kind === 'optionRetained' ? { lastDecisionId: payload.decisionId, lastPreparationId: undefined, preparationStatus: undefined } : {}),
    ...(event.kind === 'programPrepared' ? { lastDecisionId: payload.decisionId, lastPreparationId: payload.preparationId,
      preparationStatus: payload.preview.status as HopPlannedRecipeOutcome['status'] } : {}),
    ...(event.kind === 'supersededBy' ? { supersededByDossierId: payload.successorDossierId } : {}),
  };
}

export function applyHopDecisionEventV2(
  dossier: HopDecisionDossierV2,
  event: HopDecisionEventV2,
  previousEvents: readonly HopDecisionEventV2[] = [],
): HopDecisionDossierV2 {
  validateDossierV2(dossier);
  validateEventShapeV2(event);
  if (event.ownerKey !== dossier.ownerKey || event.dossierId !== dossier.dossierId) invalid('L’événement v2 appartient à un autre compte ou dossier.');
  if (event.kind === 'studySaved') invalid('La sauvegarde initiale v2 se crée avec le dossier ; elle ne remplace pas son instantané.');
  if (dossier.supersededByDossierId) invalid('Un dossier supersédé reste lisible, mais n’accepte plus de nouvel événement.');
  validateEventHistoryV2(dossier, previousEvents);
  if (event.expectedRevision !== dossier.revision) throw new HopDecisionDossierError('staleRevision', 'La révision attendue du dossier est périmée.');
  if ((event.kind === 'optionRetained' || event.kind === 'programPrepared') && dossier.study.kind !== 'calculated') {
    throw new HopDecisionDossierError('invalidTransition', 'Rétention et préparation exigent une étude v2 réellement calculée.');
  }

  const payload = event.payload as Record<string, any>;
  if (event.kind === 'optionRetained') {
    if (dossier.study.actionKind !== 'planReplacement') invalid('Cette action qualifiée ne produit pas de sélection de voies J1.');
    const response = dossier.study.responseSnapshot as HopDecisionResponse<'planReplacement'>;
    const selection = payload.selection as HopPlannerSelection;
    if (!nonempty(payload.decisionId) || !nonempty(payload.optionId) || selection.requestReference !== response.result.plan.requestReference
      || selection.pathId !== payload.optionId || !response.result.plan.paths.some(path => path.pathId === payload.optionId && path.complete)
      || !Array.isArray(selection.selectedDoses) || !selection.selectedDoses.length
      || new Set(selection.selectedDoses.map(dose => dose.additionId)).size !== selection.selectedDoses.length) {
      invalid('La sélection qualifiée ne correspond pas à une voie complète de la réponse figée.');
    }
  }
  if (previousEvents.some(item => item.ownerKey !== dossier.ownerKey || item.dossierId !== dossier.dossierId)) invalid('L’historique fourni mélange des comptes ou dossiers v2.');
  if (event.kind === 'programPrepared') {
    const preview = payload.preview as HopPlannedRecipeOutcome;
    validatePreview(preview, payload.optionId);
    const prior = previousEvents.find(item => item.kind === 'optionRetained'
      && item.payload.decisionId === payload.decisionId && item.payload.optionId === payload.optionId);
    if (!prior || prior.kind !== 'optionRetained' || hopDecisionReference(prior.payload.selection) !== hopDecisionReference(previewSelection(preview))) {
      invalid('La préparation v2 doit conserver la même sélection explicitement retenue.');
    }
  }
  if ((event.kind === 'correctionRecorded' || event.kind === 'supersededBy') && payload.successorDossierId === dossier.dossierId) invalid('Un dossier ne peut pas se corriger ou se remplacer lui-même.');
  return {
    ...dossier,
    revision: event.resultingRevision,
    updatedAt: event.recordedAt,
    lastEventId: event.eventId,
    state: event.kind,
    ...(event.kind === 'optionRetained' ? { lastDecisionId: payload.decisionId, lastPreparationId: undefined, preparationStatus: undefined } : {}),
    ...(event.kind === 'programPrepared' ? { lastDecisionId: payload.decisionId, lastPreparationId: payload.preparationId,
      preparationStatus: payload.preview.status as HopPlannedRecipeOutcome['status'] } : {}),
    ...(event.kind === 'supersededBy' ? { supersededByDossierId: payload.successorDossierId } : {}),
  };
}

function validateEventHistory(dossier: HopDecisionDossierV1, events: readonly HopDecisionEventV1[]): void {
  if (!Array.isArray(events) || events.length !== dossier.revision) invalid('L’historique append-only ne contient pas toutes les révisions du dossier.');
  let revision = 0;
  const ids = new Set<string>();
  for (const event of events) {
    validateEventShape(event);
    if (event.ownerKey !== dossier.ownerKey || event.dossierId !== dossier.dossierId || ids.has(event.eventId)
      || event.expectedRevision !== revision || event.resultingRevision !== revision + 1) invalid('L’historique du dossier contient une identité ou une révision incohérente.');
    ids.add(event.eventId);
    revision = event.resultingRevision;
  }
  const last = events.at(-1);
  if (revision !== dossier.revision || last?.eventId !== dossier.lastEventId) invalid('La projection ne correspond pas au dernier événement append-only.');
}

function validateEventHistoryV2(dossier: HopDecisionDossierV2, events: readonly HopDecisionEventV2[]): void {
  if (!Array.isArray(events) || events.length !== dossier.revision) invalid('L’historique v2 append-only ne contient pas toutes les révisions.');
  let revision = 0;
  const ids = new Set<string>();
  for (const event of events) {
    validateEventShapeV2(event);
    if (event.ownerKey !== dossier.ownerKey || event.dossierId !== dossier.dossierId || ids.has(event.eventId)
      || event.expectedRevision !== revision || event.resultingRevision !== revision + 1) invalid('L’historique v2 contient une identité ou une révision incohérente.');
    ids.add(event.eventId);
    revision = event.resultingRevision;
  }
  const last = events.at(-1);
  if (revision !== dossier.revision || last?.eventId !== dossier.lastEventId) invalid('La projection v2 ne correspond pas au dernier événement append-only.');
}

export function hopDecisionEventContentReference(event: HopDecisionWritableEvent): string {
  return hopDecisionReference({ ownerKey: event.ownerKey, dossierId: event.dossierId, eventId: event.eventId,
    eventFormatVersion: event.eventFormatVersion, kind: event.kind, payload: event.payload });
}

export function readHopDecisionDossier(value: unknown): HopDecisionDossierRead {
  if (!record(value)) invalid('Enveloppe de dossier persistée mal formée.');
  const stored = value as Record<string, any>;
  if (!nonempty(stored.ownerKey) || !nonempty(stored.dossierId)) invalid('Enveloppe de dossier persistée mal formée.');
  if (!Number.isSafeInteger(stored.formatVersion) || stored.formatVersion < 1) invalid('Version de format de dossier mal formée.');
  if (stored.formatVersion === 3) return readHopAdviceDossier(stored);
  if (stored.formatVersion === 1) {
    const rawStudy = record(stored.study) ? stored.study : null;
    const rawResponse = rawStudy && record(rawStudy.responseSnapshot) ? rawStudy.responseSnapshot : null;
    if (rawResponse && rawResponse.version !== HOP_DECISION_VERSION) return { status: 'unsupportedFormat', ownerKey: stored.ownerKey,
      dossierId: stored.dossierId, formatVersion: stored.formatVersion, reason: 'calculationVersion', raw: clone(stored) };
    validateDossier(stored as unknown as HopDecisionDossierV1);
    return clone(stored as unknown as HopDecisionDossierV1);
  }
  if (stored.formatVersion !== 2) return { status: 'unsupportedFormat', ownerKey: stored.ownerKey, dossierId: stored.dossierId,
    formatVersion: stored.formatVersion, reason: 'formatVersion', raw: clone(stored) };
  const rawStudy = record(stored.study) ? stored.study : null;
  const rawQualification = rawStudy && record(rawStudy.qualificationSnapshot) ? rawStudy.qualificationSnapshot : null;
  if (rawQualification && rawQualification.version !== SUPPORTED_QUALIFICATION_VERSION) return { status: 'unsupportedFormat', ownerKey: stored.ownerKey,
    dossierId: stored.dossierId, formatVersion: stored.formatVersion, reason: 'qualificationVersion', raw: clone(stored) };
  const assembly = rawStudy && record(rawStudy.request) && record(rawStudy.request.qualificationInput)
    ? rawStudy.request.qualificationInput.assembly : undefined;
  if (assembly !== undefined && (!record(assembly) || assembly.version !== SUPPORTED_ASSEMBLY_VERSION)) return { status: 'unsupportedFormat', ownerKey: stored.ownerKey,
    dossierId: stored.dossierId, formatVersion: stored.formatVersion, reason: 'assemblyVersion', raw: clone(stored) };
  const rawResponse = rawStudy && record(rawStudy.responseSnapshot) ? rawStudy.responseSnapshot : null;
  if (rawStudy?.kind === 'calculated' && rawResponse && rawResponse.version !== HOP_DECISION_VERSION) return { status: 'unsupportedFormat', ownerKey: stored.ownerKey,
    dossierId: stored.dossierId, formatVersion: stored.formatVersion, reason: 'calculationVersion', raw: clone(stored) };
  validateDossierV2(stored as unknown as HopDecisionDossierV2);
  return clone(stored as unknown as HopDecisionDossierV2);
}

export function readHopDecisionEvent(value: unknown): HopDecisionEventRead {
  if (!record(value)) invalid('Enveloppe d’événement persistée mal formée.');
  const stored = value as Record<string, any>;
  if (!nonempty(stored.ownerKey) || !nonempty(stored.dossierId) || !nonempty(stored.eventId)) invalid('Enveloppe d’événement persistée mal formée.');
  if (!Number.isSafeInteger(stored.eventFormatVersion) || stored.eventFormatVersion < 1) invalid('Version de format d’événement mal formée.');
  if (stored.eventFormatVersion === 3) return readHopAdviceEvent(stored);
  if (stored.eventFormatVersion === 1) {
    validateEventShape(stored as unknown as HopDecisionEventV1);
    return clone(stored as unknown as HopDecisionEventV1);
  }
  if (stored.eventFormatVersion === 2) {
    validateEventShapeV2(stored as unknown as HopDecisionEventV2);
    return clone(stored as unknown as HopDecisionEventV2);
  }
  return { status: 'unsupportedEventFormat', ownerKey: stored.ownerKey, dossierId: stored.dossierId,
    eventId: stored.eventId, eventFormatVersion: stored.eventFormatVersion, raw: clone(stored) };
}

function validateDossier(dossier: HopDecisionDossierV1): void {
  if (!record(dossier) || dossier.formatVersion !== 1 || !nonempty(dossier.ownerKey) || !nonempty(dossier.dossierId)
    || !Number.isSafeInteger(dossier.revision) || dossier.revision < 1 || !isoDate(dossier.createdAt) || !isoDate(dossier.updatedAt)
    || !nonempty(dossier.lastEventId) || !['studySaved', 'optionRetained', 'programPrepared', 'correctionRecorded', 'supersededBy'].includes(dossier.state)) invalid('Dossier v1 mal formé.');
  if (dossier.supersedesDossierId !== undefined && (!nonempty(dossier.supersedesDossierId) || dossier.supersedesDossierId === dossier.dossierId)
    || dossier.supersededByDossierId !== undefined && (!nonempty(dossier.supersededByDossierId) || dossier.supersededByDossierId === dossier.dossierId)) invalid('Lien de supersession invalide.');
  if (dossier.state === 'supersededBy') {
    if (!nonempty(dossier.supersededByDossierId)) invalid('La projection de correction/supersession doit pointer vers son dossier successeur.');
  }
  if (dossier.lastDecisionId !== undefined && !nonempty(dossier.lastDecisionId)
    || dossier.lastPreparationId !== undefined && !nonempty(dossier.lastPreparationId)) invalid('Identifiant décision/préparation mal formé.');
  if (dossier.state === 'programPrepared' && !['ready', 'conventionMismatch', 'conventionUnresolved', 'needsAlphaSelection'].includes(dossier.preparationStatus ?? '')) invalid('Le statut de la préparation enregistrée est absent.');
  if (dossier.preparationStatus !== undefined && !['ready', 'conventionMismatch', 'conventionUnresolved', 'needsAlphaSelection'].includes(dossier.preparationStatus)) invalid('Statut de préparation inconnu.');
  validateStudySnapshot(dossier.study);
}

function validateDossierV2(dossier: HopDecisionDossierV2): void {
  if (!record(dossier) || dossier.formatVersion !== 2 || !nonempty(dossier.ownerKey) || !nonempty(dossier.dossierId)
    || !Number.isSafeInteger(dossier.revision) || dossier.revision < 1 || !isoDate(dossier.createdAt) || !isoDate(dossier.updatedAt)
    || !nonempty(dossier.lastEventId) || !['studySaved', 'optionRetained', 'programPrepared', 'correctionRecorded', 'supersededBy'].includes(dossier.state)) invalid('Dossier v2 mal formé.');
  if (dossier.supersedesDossierId !== undefined && (!nonempty(dossier.supersedesDossierId) || dossier.supersedesDossierId === dossier.dossierId)
    || dossier.supersededByDossierId !== undefined && (!nonempty(dossier.supersededByDossierId) || dossier.supersededByDossierId === dossier.dossierId)) invalid('Lien de supersession v2 invalide.');
  if (dossier.state === 'supersededBy' && !nonempty(dossier.supersededByDossierId)) invalid('La projection v2 de supersession doit pointer vers son dossier successeur.');
  if (dossier.lastDecisionId !== undefined && !nonempty(dossier.lastDecisionId)
    || dossier.lastPreparationId !== undefined && !nonempty(dossier.lastPreparationId)) invalid('Identifiant décision/préparation v2 mal formé.');
  if (dossier.state === 'programPrepared' && !['ready', 'conventionMismatch', 'conventionUnresolved', 'needsAlphaSelection'].includes(dossier.preparationStatus ?? '')) invalid('Le statut v2 de préparation est absent.');
  if (dossier.preparationStatus !== undefined && !['ready', 'conventionMismatch', 'conventionUnresolved', 'needsAlphaSelection'].includes(dossier.preparationStatus)) invalid('Statut v2 de préparation inconnu.');
  if (dossier.study.kind === 'resolutionRequired' && (dossier.state === 'optionRetained' || dossier.state === 'programPrepared')) invalid('Une étude resolutionRequired ne peut pas porter de rétention ou préparation.');
  validateStudySnapshotV2(dossier.study);
}
