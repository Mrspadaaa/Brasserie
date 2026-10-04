import { HOP_DECISION_VERSION, type HopDecisionMaterial, type HopDecisionProgram, type HopProgramApplication, type HopProgramProposal } from './types';
import type { HopDecisionResponse } from './service';
import type { HopDecisionContext, HopDecisionQualificationInput } from './dossier';
import type { HopProgramAnalysis } from './programAnalysis';
import type { restoreHopProgramDraft } from './programs';
import { hopDecisionReference } from './measurements';
import {
  assertHopAdviceSituation, assertHopStrategyAdviceResult, HOP_ADVICE_VERSION,
  hopAdviceCanonicalReference, hopAdviceInputReference, hopAdviceOptionReference,
  hopAdviceResultReference as schemaHopAdviceResultReference,
  type HopAdviceInput, type HopAdviceIntent, type HopAdviceOption, type HopAdviceProgramScope, type HopAdviceSituation,
} from './adviceSchema';

export const HOP_ADVICE_DOSSIER_FORMAT_VERSION = 3 as const;
export const HOP_ADVICE_EVENT_FORMAT_VERSION = 3 as const;

export interface HopAdviceOriginalAction {
  kind: 'exploreStrategies';
  situation: HopAdviceSituation;
}

export type HopAdviceQualificationMetadata = NonNullable<HopAdviceInput['qualification']>;

export interface HopAdviceServiceAction extends HopAdviceOriginalAction {
  /** Derived coverage notes; these never promote omitted materials into calculations. */
  qualification?: HopAdviceQualificationMetadata;
}

export interface HopAdviceRequestSnapshot {
  intent: HopAdviceIntent;
  /** Original public action, without service-derived qualification metadata. */
  action: HopAdviceOriginalAction;
  qualificationInput: HopDecisionQualificationInput;
}

export interface HopAdviceServiceInput {
  intent: HopAdviceIntent;
  /** Exact action and situation passed to the real advice service. */
  action: HopAdviceServiceAction;
  materials: HopDecisionMaterial[];
}

export interface HopAdviceQualificationSnapshot {
  version: string;
  result: unknown;
}

export type HopAdvicePublicResponse = HopDecisionResponse<'exploreStrategies'>;

export interface HopAdviceStudyV3 {
  readonly formatVersion: 3;
  readonly kind: 'advice';
  readonly reference: string;
  readonly requestSnapshot: HopAdviceRequestSnapshot;
  readonly qualificationSnapshot: HopAdviceQualificationSnapshot;
  readonly serviceInput: HopAdviceServiceInput;
  /** Full response from the real advice service, not a copied answer string. */
  readonly responseSnapshot: HopAdvicePublicResponse;
  readonly context: HopDecisionContext | null;
}

export type HopAdviceProgramPreviewReceipt = {
  format: 'hop-advice-program-preview-v1';
  reference: string;
  studyReference: string;
  preferenceId: string;
  preferenceReference: string;
  optionId: string;
  optionReference: string;
  origin: 'existingProgram' | 'newScenario';
  /** Always the actual baseline used for the preview; never manufactured from program:null. */
  before: HopDecisionProgram;
  proposal: HopProgramProposal;
  materials: HopDecisionMaterial[];
  qualificationInput: HopDecisionQualificationInput;
  qualificationSnapshot: HopAdviceQualificationSnapshot;
  analysis: { before: HopProgramAnalysis; after: HopProgramAnalysis };
  declaration: { origin: 'explicitUserInput'; reason: string };
};

export type HopAdviceProgramApplicationReceipt = {
  format: 'hop-advice-local-application-v1';
  reference: string;
  studyReference: string;
  preferenceId: string;
  preferenceReference: string;
  previewReference: string;
  application: HopProgramApplication;
};

export type HopAdviceDraftRestorationReceipt = {
  format: 'hop-advice-draft-restoration-v1';
  reference: string;
  studyReference: string;
  preferenceId: string;
  preferenceReference: string;
  applicationReference: string;
  currentProgram: HopDecisionProgram;
  draft: ReturnType<typeof restoreHopProgramDraft>;
};

export type HopAdviceDossierStateV3 = 'studySaved' | 'strategyPreferred' | 'programPreviewed'
  | 'programAppliedLocally' | 'draftRestored' | 'correctionRecorded' | 'supersededBy';

export interface HopAdviceDossierV3 {
  readonly formatVersion: 3;
  readonly dossierId: string;
  readonly ownerKey: string;
  readonly revision: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastEventId: string;
  readonly state: HopAdviceDossierStateV3;
  /** Immutable advice study; preferences and previews remain in append-only events. */
  readonly study: HopAdviceStudyV3;
  readonly supersedesDossierId?: string;
  readonly supersededByDossierId?: string;
}

export interface HopAdvicePreferenceContent {
  preferenceId: string;
  studyReference: string;
  resultReference: string;
  optionId: string;
  optionReference: string;
  programScope: HopAdviceProgramScope;
  /** The interpretation and its reference stay textual/qualitative; no dose field exists here. */
  interpretation: string;
  interpretationReference: string;
  reason: string;
}

export type HopAdviceEventPayloadV3 = {
  studySaved: { snapshotFormatVersion: 3; supersedesDossierId?: string };
  strategyPreferred: HopAdvicePreferenceContent & { preferenceReference: string };
  programPreviewed: { preferenceId: string; previewId: string; receipt: HopAdviceProgramPreviewReceipt };
  programAppliedLocally: { preferenceId: string; previewId: string; applicationId: string; receipt: HopAdviceProgramApplicationReceipt };
  draftRestored: { preferenceId: string; applicationId: string; restorationId: string; receipt: HopAdviceDraftRestorationReceipt };
  correctionRecorded: { successorDossierId: string; reason: string; correctedAssertionIds: string[] };
  supersededBy: { successorDossierId: string; reason: string };
};

type HopAdviceEventKindV3 = keyof HopAdviceEventPayloadV3;
type HopAdviceEventForV3<K extends HopAdviceEventKindV3> = {
  readonly eventFormatVersion: 3;
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly eventId: string;
  readonly expectedRevision: number;
  readonly resultingRevision: number;
  readonly recordedAt: string;
  readonly kind: K;
  readonly payload: HopAdviceEventPayloadV3[K];
};

export type HopAdviceEventV3 = { [K in HopAdviceEventKindV3]: HopAdviceEventForV3<K> }[HopAdviceEventKindV3];

export type HopAdviceEventCommand<K extends HopAdviceEventKindV3 = HopAdviceEventKindV3> = {
  [P in K]: Omit<HopAdviceEventForV3<P>, 'eventFormatVersion' | 'resultingRevision'>;
}[K];

export interface CreateHopAdviceDossierInput {
  ownerKey: string;
  dossierId: string;
  eventId: string;
  recordedAt: string;
  study: HopAdviceStudyV3;
  supersedesDossierId?: string;
}

export interface CreatedHopAdviceDossier {
  dossier: HopAdviceDossierV3;
  event: HopAdviceEventV3;
}

export interface HopAdviceUnsupportedDossier {
  readonly status: 'unsupportedFormat';
  readonly reason: 'formatVersion' | 'adviceVersion' | 'qualificationVersion' | 'assemblyVersion' | 'calculationVersion';
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly formatVersion: number;
  readonly raw: unknown;
}

export type HopAdviceDossierRead = HopAdviceDossierV3 | HopAdviceUnsupportedDossier;

export interface HopAdviceUnsupportedEvent {
  readonly status: 'unsupportedEventFormat';
  readonly ownerKey: string;
  readonly dossierId: string;
  readonly eventId: string;
  readonly eventFormatVersion: number;
  readonly raw: unknown;
}

export type HopAdviceEventRead = HopAdviceEventV3 | HopAdviceUnsupportedEvent;

export class HopAdviceDossierError extends Error {
  constructor(readonly code: 'invalidInput' | 'unsupportedFormat' | 'staleRevision' | 'invalidTransition', message: string) {
    super(message);
    this.name = 'HopAdviceDossierError';
  }
}

const record = (value: unknown): value is Record<string, any> => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const clone = <T>(value: T): T => structuredClone(value);
function invalid(message: string): never { throw new HopAdviceDossierError('invalidInput', message); }
const SUPPORTED_QUALIFICATION_VERSION = 'hop-catalogue-qualification-v1';
const SUPPORTED_ASSEMBLY_VERSION = 'hop-catalogue-assembly-v1';

function omitReference<T extends { reference: string }>(value: T): Omit<T, 'reference'> {
  const { reference: _reference, ...content } = value;
  return content;
}

export function hopAdviceStudyReference(study: Omit<HopAdviceStudyV3, 'reference'> | HopAdviceStudyV3): string {
  const content = 'reference' in study ? omitReference(study as HopAdviceStudyV3) : study;
  return hopAdviceCanonicalReference('hop-advice-study-v3', content);
}

export function hopAdvicePreferenceReference(preference: HopAdvicePreferenceContent): string {
  return hopAdviceCanonicalReference('hop-advice-preference-v1', preference);
}

export function hopAdviceProgramPreviewReference(receipt: Omit<HopAdviceProgramPreviewReceipt, 'reference'> | HopAdviceProgramPreviewReceipt): string {
  const content = 'reference' in receipt ? omitReference(receipt as HopAdviceProgramPreviewReceipt) : receipt;
  return hopAdviceCanonicalReference('hop-advice-program-preview-v1', content);
}

export function hopAdviceProgramApplicationReference(receipt: Omit<HopAdviceProgramApplicationReceipt, 'reference'> | HopAdviceProgramApplicationReceipt): string {
  const content = 'reference' in receipt ? omitReference(receipt as HopAdviceProgramApplicationReceipt) : receipt;
  return hopAdviceCanonicalReference('hop-advice-local-application-v1', content);
}

export function hopAdviceDraftRestorationReference(receipt: Omit<HopAdviceDraftRestorationReceipt, 'reference'> | HopAdviceDraftRestorationReceipt): string {
  const content = 'reference' in receipt ? omitReference(receipt as HopAdviceDraftRestorationReceipt) : receipt;
  return hopAdviceCanonicalReference('hop-advice-draft-restoration-v1', content);
}

export function hopAdviceInterpretationReference(input: {
  studyReference: string; resultReference: string; optionId: string; optionReference: string; interpretation: string;
}): string {
  return hopAdviceCanonicalReference('hop-advice-interpretation-v1', input);
}

function exactKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  if (Object.keys(value).sort().join('\u0000') !== [...keys].sort().join('\u0000')) invalid(`${label} contient des champs inconnus ou manquants.`);
}

function allowedKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  if (Object.keys(value).some(key => !keys.includes(key))) invalid(`${label} contient un champ inconnu.`);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function assertAdviceIntent(value: unknown): asserts value is HopAdviceIntent {
  if (!record(value) || !nonempty(value.originalQuestion) || value.interpretation !== undefined && typeof value.interpretation !== 'string'
    || value.assumptions !== undefined && (!Array.isArray(value.assumptions) || !value.assumptions.every(row => typeof row === 'string'))
    || value.criteria !== undefined && !Array.isArray(value.criteria)) invalid('Intention de conseil mal formée.');
}

function validateContext(context: HopDecisionContext | null): void {
  if (context === null) return;
  if (!record(context)) invalid('Contexte de conseil invalide.');
  if (context.kind === 'recipe') {
    if (!nonempty(context.recipeId) || !nonempty(context.recipeReference)) invalid('Référence de recette incomplète.');
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

function adviceInputReferenceFromServiceInput(input: HopAdviceServiceInput): string {
  const payload: Record<string, unknown> = { intent: input.intent, situation: input.action.situation, materials: input.materials };
  if (input.action.qualification !== undefined) payload.qualification = input.action.qualification;
  return hopAdviceInputReference(payload as unknown as HopAdviceInput);
}

function validateQualificationMetadata(value: unknown): void {
  if (value === undefined) return;
  if (!record(value) || !Array.isArray(value.omitted) || !Array.isArray(value.conditional)
    || !Array.isArray(value.limitations) || !value.limitations.every(nonempty)) invalid('Métadonnées de couverture du conseil mal formées.');
  for (const item of [...value.omitted, ...value.conditional]) {
    if (!record(item) || !nonempty(item.materialId) || !Array.isArray(item.recordKeys)
      || !item.recordKeys.every(nonempty) || !nonempty(item.reason)) invalid('Métadonnée de matière omise ou conditionnelle mal formée.');
  }
}

function flattenedRawVariants(qualification: Record<string, any>): unknown[] {
  return qualification.groups.flatMap((group: any) => Array.isArray(group?.rawVariants) ? group.rawVariants : [])
    .sort((a: any, b: any) => String(a?.variantId ?? '').localeCompare(String(b?.variantId ?? '')));
}

function validateStudyV3Structure(study: HopAdviceStudyV3): void {
  if (!record(study) || study.formatVersion !== 3 || study.kind !== 'advice' || !nonempty(study.reference)
    || !record(study.requestSnapshot) || !record(study.requestSnapshot.action)
    || study.requestSnapshot.action.kind !== 'exploreStrategies' || !record(study.requestSnapshot.qualificationInput)
    || !Array.isArray(study.requestSnapshot.qualificationInput.variants)
    || !record(study.qualificationSnapshot) || !nonempty(study.qualificationSnapshot.version)
    || !Object.prototype.hasOwnProperty.call(study.qualificationSnapshot, 'result')
    || !record(study.serviceInput) || !record(study.serviceInput.action)
    || study.serviceInput.action.kind !== 'exploreStrategies' || !Array.isArray(study.serviceInput.materials)
    || !record(study.responseSnapshot)) invalid('Étude de conseil v3 mal formée.');
  assertAdviceIntent(study.requestSnapshot.intent);
  assertAdviceIntent(study.serviceInput.intent);
  assertHopAdviceSituation(study.requestSnapshot.action.situation);
  assertHopAdviceSituation(study.serviceInput.action.situation);
  if (Object.prototype.hasOwnProperty.call(study.requestSnapshot.action, 'qualification')) invalid('La requête originale ne doit pas contenir les métadonnées dérivées du service.');
  validateQualificationMetadata(study.serviceInput.action.qualification);
  if (typeof study.responseSnapshot.version !== 'string' || !nonempty(study.responseSnapshot.version)
    || typeof (study.responseSnapshot as any).actionKind !== 'string'
    || typeof study.responseSnapshot.answer !== 'string'
    || !['answered', 'conditional', 'noApplicableOption'].includes(study.responseSnapshot.status)
    || !Array.isArray(study.responseSnapshot.criteria) || !Array.isArray(study.responseSnapshot.missingInformation)
    || !Array.isArray(study.responseSnapshot.sources) || !record(study.responseSnapshot.boundaries)) invalid('Réponse publique de conseil mal formée.');
  assertHopStrategyAdviceResult(study.responseSnapshot.result);
  if (study.reference !== hopAdviceStudyReference(study)) invalid('Référence de l’étude de conseil incohérente.');
  validateContext(study.context);
}

function validateStudyV3ForCreate(study: HopAdviceStudyV3): void {
  validateStudyV3Structure(study);
  if (study.qualificationSnapshot.version !== SUPPORTED_QUALIFICATION_VERSION
    || study.responseSnapshot.version !== HOP_DECISION_VERSION || study.responseSnapshot.result.version !== HOP_ADVICE_VERSION) {
    invalid('L’étude de conseil utilise une version de qualification, calcul ou conseil non reconnue.');
  }
  if (study.requestSnapshot.intent && hopAdviceCanonicalReference('hop-advice-intent-v1', study.requestSnapshot.intent)
    !== hopAdviceCanonicalReference('hop-advice-intent-v1', study.serviceInput.intent)
    || hopAdviceCanonicalReference('hop-advice-situation-v1', study.requestSnapshot.action.situation)
      !== hopAdviceCanonicalReference('hop-advice-situation-v1', study.serviceInput.action.situation)
    || hopAdviceCanonicalReference('hop-advice-intent-v1', study.requestSnapshot.intent)
      !== hopAdviceCanonicalReference('hop-advice-intent-v1', study.responseSnapshot.intent)) invalid('L’entrée de service/réponse ne correspond pas à l’intention et à la situation originales.');
  const assembly = study.requestSnapshot.qualificationInput.assembly;
  if (assembly !== undefined && (!record(assembly) || assembly.version !== SUPPORTED_ASSEMBLY_VERSION)) {
    invalid('Une nouvelle étude ne peut pas interpréter une version assembly inconnue.');
  }

  const qualification = study.qualificationSnapshot.result as Record<string, any>;
  if (!record(qualification) || qualification.version !== SUPPORTED_QUALIFICATION_VERSION || !Array.isArray(qualification.groups)) {
    invalid('Snapshot de qualification incomplet ou d’une autre version.');
  }
  const sourceVariants = [...study.requestSnapshot.qualificationInput.variants]
    .sort((a, b) => a.variantId.localeCompare(b.variantId));
  if (hopAdviceCanonicalReference('hop-raw-variants-v1', sourceVariants)
    !== hopAdviceCanonicalReference('hop-raw-variants-v1', flattenedRawVariants(qualification))) {
    invalid('Les variantes brutes qualifiées ne correspondent pas à la requête originale.');
  }
  const groupByMaterialId = new Map<string, Array<Record<string, any>>>();
  for (const group of qualification.groups) for (const variant of group.rawVariants ?? []) {
    const materialId = variant.material?.id;
    if (typeof materialId !== 'string' || !materialId.trim()) invalid('Identité matière absente d’une variante qualifiée.');
    const rows = groupByMaterialId.get(materialId) ?? [];
    if (!rows.some(row => row.key === group.key)) rows.push(group);
    groupByMaterialId.set(materialId, rows);
  }
  if (new Set(study.serviceInput.materials.map(material => material.id)).size !== study.serviceInput.materials.length) {
    invalid('L’entrée de conseil contient des identités matière répétées.');
  }
  for (const material of study.serviceInput.materials) {
    const groups = groupByMaterialId.get(material.id) ?? [];
    if (groups.length !== 1) invalid(`La matière ${material.id} ne correspond pas à un seul record qualifié.`);
    const group = groups[0];
    const projection: HopDecisionMaterial | null = group.status === 'ready' || group.status === 'equivalentVariants'
      ? group.calculationProjection?.material ?? null
      : group.status === 'collisionNeedsSelection' ? group.commonCalculationProjection?.material ?? null : null;
    if (!projection || projection.id !== material.id
      || hopAdviceCanonicalReference('hop-material-projection-v1', projection)
        !== hopAdviceCanonicalReference('hop-material-projection-v1', material)) {
      invalid(`La matière ${material.id} de l’entrée de conseil n’est pas la projection qualifiée exacte.`);
    }
  }
  const adviceResult = study.responseSnapshot.result;
  if ((study.responseSnapshot as any).actionKind !== 'exploreStrategies'
    || adviceResult.inputReference !== adviceInputReferenceFromServiceInput(study.serviceInput)
    || adviceResult.stage !== study.serviceInput.action.situation.stage) invalid('La réponse de conseil ne correspond pas à l’entrée réellement exécutée.');
  if (adviceResult.reference !== schemaHopAdviceResultReference(omitReference(adviceResult))) invalid('Référence du résultat de conseil incohérente.');
}

function assertProgram(value: unknown): asserts value is HopDecisionProgram {
  if (!record(value) || !nonempty(value.id) || !Number.isSafeInteger(value.revision) || value.revision < 0
    || !['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'].includes(value.stage)
    || value.volumeL !== null && (typeof value.volumeL !== 'number' || !Number.isFinite(value.volumeL))
    || value.wortGravity !== null && (typeof value.wortGravity !== 'number' || !Number.isFinite(value.wortGravity))
    || !Array.isArray(value.additions)) invalid('Programme de conseil invalide.');
  const ids = new Set<string>();
  for (const addition of value.additions) {
    if (!record(addition) || !nonempty(addition.id) || ids.has(addition.id) || !nonempty(addition.materialId)
      || !['planned', 'performed'].includes(addition.status) || !['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'].includes(addition.use)
      || addition.grams !== null && (typeof addition.grams !== 'number' || !Number.isFinite(addition.grams))) invalid('Ajout du programme invalide.');
    ids.add(addition.id);
  }
}

function assertProgramProposal(value: unknown): asserts value is HopProgramProposal {
  if (!record(value) || value.version !== HOP_DECISION_VERSION || !nonempty(value.baseline) || !record(value.materialReferences)
    || !Array.isArray(value.changes) || !Array.isArray(value.stock) || !Array.isArray(value.conditions)
    || !value.conditions.every(nonempty) || !['available', 'conditional', 'unavailable'].includes(value.applicability)) invalid('Reçu HopProgramProposal invalide.');
  assertProgram(value.program);
  if (!Object.entries(value.materialReferences).every(([id, reference]) => nonempty(id) && nonempty(reference))) invalid('Références de matière du preview invalides.');
}

function assertAnalysis(value: unknown): asserts value is HopProgramAnalysis {
  if (!record(value) || !Array.isArray(value.additions) || !record(value.documentedSubtotals) || !Array.isArray(value.limits)) invalid('Analyse du programme dans le reçu invalide.');
}

function sameContent(left: unknown, right: unknown, prefix: string): boolean {
  return hopAdviceCanonicalReference(prefix, left) === hopAdviceCanonicalReference(prefix, right);
}

function assertPreviewReceipt(value: unknown): asserts value is HopAdviceProgramPreviewReceipt {
  if (!record(value) || value.format !== 'hop-advice-program-preview-v1' || !nonempty(value.reference)
    || !nonempty(value.studyReference) || !nonempty(value.preferenceId) || !nonempty(value.preferenceReference)
    || !nonempty(value.optionId) || !nonempty(value.optionReference) || !['existingProgram', 'newScenario'].includes(value.origin)
    || !Array.isArray(value.materials) || !record(value.qualificationInput) || !record(value.qualificationSnapshot)
    || !record(value.analysis) || !record(value.declaration) || value.declaration.origin !== 'explicitUserInput'
    || !nonempty(value.declaration.reason)) invalid('Reçu d’aperçu de stratégie incomplet.');
  exactKeys(value, ['format', 'reference', 'studyReference', 'preferenceId', 'preferenceReference', 'optionId', 'optionReference',
    'origin', 'before', 'proposal', 'materials', 'qualificationInput', 'qualificationSnapshot', 'analysis', 'declaration'], 'Reçu de preview');
  assertProgram(value.before);
  assertProgramProposal(value.proposal);
  assertAnalysis(value.analysis.before);
  assertAnalysis(value.analysis.after);
  if (!Array.isArray(value.qualificationInput.variants) || !nonempty(value.qualificationSnapshot.version)
    || !Object.prototype.hasOwnProperty.call(value.qualificationSnapshot, 'result')) invalid('Qualification du reçu de programme absente.');
  const { reference: _reference, ...content } = value as HopAdviceProgramPreviewReceipt;
  if (value.reference !== hopAdviceProgramPreviewReference(content)) invalid('Référence du preview de conseil incohérente.');
  if (!sameContent(value.proposal.program.additions.filter((row: any) => row.status === 'performed'),
    value.before.additions.filter(row => row.status === 'performed'), 'hop-performed-preservation-v1')) {
    invalid('Le preview modifie ou perd un ajout effectué.');
  }
}

function assertApplicationReceipt(value: unknown): asserts value is HopAdviceProgramApplicationReceipt {
  if (!record(value) || value.format !== 'hop-advice-local-application-v1' || !nonempty(value.reference)
    || !nonempty(value.studyReference) || !nonempty(value.preferenceId) || !nonempty(value.preferenceReference)
    || !nonempty(value.previewReference) || !record(value.application)) invalid('Reçu d’application locale incomplet.');
  exactKeys(value, ['format', 'reference', 'studyReference', 'preferenceId', 'preferenceReference', 'previewReference', 'application'], 'Reçu d’application');
  const application = value.application as HopProgramApplication;
  if (application.version !== HOP_DECISION_VERSION) invalid('Version d’application locale inconnue.');
  assertProgram(application.before); assertProgram(application.after); assertProgramProposal(application.proposal);
  const { reference: _reference, ...content } = value as HopAdviceProgramApplicationReceipt;
  if (value.reference !== hopAdviceProgramApplicationReference(content)) invalid('Référence d’application locale incohérente.');
  if (!sameContent(application.proposal.program, application.after, 'hop-advice-application-after-v1')
    || !sameContent(application.before.additions.filter(row => row.status === 'performed'),
      application.after.additions.filter(row => row.status === 'performed'), 'hop-performed-preservation-v1')) {
    invalid('L’application ne conserve pas le reçu et les ajouts effectués.');
  }
}

function assertRestorationReceipt(value: unknown): asserts value is HopAdviceDraftRestorationReceipt {
  if (!record(value) || value.format !== 'hop-advice-draft-restoration-v1' || !nonempty(value.reference)
    || !nonempty(value.studyReference) || !nonempty(value.preferenceId) || !nonempty(value.preferenceReference)
    || !nonempty(value.applicationReference) || !record(value.draft)) invalid('Reçu de restauration de brouillon incomplet.');
  exactKeys(value, ['format', 'reference', 'studyReference', 'preferenceId', 'preferenceReference', 'applicationReference', 'currentProgram', 'draft'], 'Reçu de restauration');
  assertProgram(value.currentProgram);
  const draft = value.draft as ReturnType<typeof restoreHopProgramDraft>;
  if (draft.format !== 'hop-program-draft-restoration-v1' || draft.scope !== 'localDraft' || !nonempty(draft.restoredFrom)
    || !record(draft.effects) || draft.effects.writesRecipe !== false || draft.effects.writesBrewDay !== false
    || draft.effects.writesStock !== false || !Array.isArray(draft.conditions)) invalid('Restauration qui ressemble à une écriture opérationnelle ou incomplète.');
  assertProgram(draft.program);
  const { reference: _reference, ...content } = value as HopAdviceDraftRestorationReceipt;
  if (value.reference !== hopAdviceDraftRestorationReference(content)) invalid('Référence de restauration incohérente.');
}

function preferenceContent(payload: HopAdviceEventPayloadV3['strategyPreferred']): HopAdvicePreferenceContent {
  const { preferenceReference: _reference, ...content } = payload;
  return content;
}

function assertPreferencePayload(value: unknown): asserts value is HopAdviceEventPayloadV3['strategyPreferred'] {
  if (!record(value) || !nonempty(value.preferenceId) || !nonempty(value.studyReference) || !nonempty(value.resultReference)
    || !nonempty(value.optionId) || !nonempty(value.optionReference) || !record(value.programScope)
    || typeof value.interpretation !== 'string' || !nonempty(value.interpretationReference) || !nonempty(value.reason)
    || !nonempty(value.preferenceReference)) invalid('Préférence qualitative incomplète.');
  if (value.preferenceReference !== hopAdvicePreferenceReference(preferenceContent(value as any))) invalid('Référence de préférence incohérente.');
  if (value.interpretationReference !== hopAdviceInterpretationReference({ studyReference: value.studyReference,
    resultReference: value.resultReference, optionId: value.optionId, optionReference: value.optionReference,
    interpretation: value.interpretation })) invalid('Référence de la lecture qualitative incohérente.');
}

function assertStudyPreference(study: HopAdviceStudyV3, preference: HopAdviceEventPayloadV3['strategyPreferred']): HopAdviceOption {
  if (preference.studyReference !== study.reference
    || preference.resultReference !== schemaHopAdviceResultReference(omitReference(study.responseSnapshot.result))
    || preference.interpretation !== (study.requestSnapshot.intent.interpretation ?? '')) {
    invalid('La préférence ne référence pas cette étude et son résultat exacts.');
  }
  const option = study.responseSnapshot.result.options.find(row => row.id === preference.optionId);
  if (!option || option.reference !== preference.optionReference
    || !sameContent(option.programScope, preference.programScope, 'hop-advice-program-scope-v1')) {
    invalid('La préférence ne référence pas une option exacte du résultat.');
  }
  return option;
}

function assertProposalMatchesScope(option: HopAdviceOption, proposal: HopProgramProposal): void {
  const scope = option.programScope;
  if (scope.kind === 'none') invalid('Une option sans portée de programme ne peut porter un preview d’application.');
  if (scope.kind === 'removePlanned') {
    const ids = proposal.changes.filter((change: any) => change.kind === 'remove').map((change: any) => change.additionId);
    if (proposal.changes.length !== ids.length || !ids.length
      || ids.some((id: string) => !scope.additionIds.includes(id))) {
      invalid('Le retrait aperçu dépasse ou contredit la portée de l’option préférée.');
    }
    return;
  }
  if (scope.kind !== 'addOrReplace') invalid('Portée de programme de l’option inconnue.');
  if (proposal.changes.some(change => change.kind !== 'append' && change.kind !== 'replace')) invalid('Cette portée ne permet que des ajouts ou remplacements.');
  if (!proposal.changes.length) invalid('La portée addOrReplace exige un vrai changement de programme.');
  const changedAdditions = proposal.changes.flatMap((change: any) => change.kind === 'append' ? [change.addition] : change.additions ?? []);
  const replacedIds = proposal.changes.filter((change: any) => change.kind === 'replace').map((change: any) => change.additionId);
  const appended = proposal.changes.some((change: any) => change.kind === 'append');
  if (!changedAdditions.length || appended && !scope.allowAppend
    || replacedIds.some((id: string) => !scope.additionIds.includes(id))
    || changedAdditions.some((addition: any) => !scope.materialIds.includes(addition.materialId) || !scope.uses.includes(addition.use))) {
    invalid('Le changement aperçu dépasse ou contredit la portée addOrReplace de l’option préférée.');
  }
}

function validateReceiptQualification(input: HopDecisionQualificationInput, snapshot: HopAdviceQualificationSnapshot): void {
  if (snapshot.version !== SUPPORTED_QUALIFICATION_VERSION || !record(snapshot.result) || snapshot.result.version !== SUPPORTED_QUALIFICATION_VERSION
    || !Array.isArray(snapshot.result.groups) || !Array.isArray(input.variants)) invalid('Qualification du reçu de programme inconnue ou incomplète.');
  const before = [...input.variants].sort((a, b) => a.variantId.localeCompare(b.variantId));
  const fromQualification = flattenedRawVariants(snapshot.result).sort((a: any, b: any) => String(a?.variantId ?? '').localeCompare(String(b?.variantId ?? '')));
  if (!sameContent(before, fromQualification, 'hop-advice-preview-raw-variants-v1')) invalid('Les variantes du reçu de programme ne correspondent pas à son snapshot de qualification.');
}

function validatePreviewLinkedToPreference(
  study: HopAdviceStudyV3,
  preference: HopAdviceEventPayloadV3['strategyPreferred'],
  receipt: HopAdviceProgramPreviewReceipt,
): void {
  assertPreviewReceipt(receipt);
  const option = assertStudyPreference(study, preference);
  if (receipt.studyReference !== study.reference || receipt.preferenceId !== preference.preferenceId
    || receipt.preferenceReference !== preference.preferenceReference || receipt.optionId !== preference.optionId
    || receipt.optionReference !== preference.optionReference) invalid('Le reçu d’aperçu ne suit pas la préférence qualitative exacte.');
  assertProposalMatchesScope(option, receipt.proposal);
  if (receipt.origin === 'existingProgram') {
    const originalProgram = study.requestSnapshot.action.situation.program;
    if (!originalProgram || !sameContent(receipt.before, originalProgram, 'hop-advice-existing-program-v1')) {
      invalid('L’origine existingProgram doit référencer le programme original exact.');
    }
  } else if (receipt.declaration.origin !== 'explicitUserInput' || study.requestSnapshot.action.situation.program !== null
    || study.requestSnapshot.action.situation.stage !== 'planning' || receipt.before.stage !== 'planning'
    || receipt.before.additions.some(row => row.status !== 'planned')) invalid('Un nouveau scénario exige une planification sans programme et aucun passé inventé.');
  if (receipt.proposal.baseline !== `${HOP_DECISION_VERSION}:${hopDecisionReference(receipt.before)}`
    || receipt.proposal.program.id !== receipt.before.id || receipt.proposal.program.stage !== receipt.before.stage
    || receipt.proposal.program.revision !== receipt.before.revision + 1
    || !sameContent(receipt.before.additions.filter(row => row.status === 'performed'),
      receipt.proposal.program.additions.filter(row => row.status === 'performed'), 'hop-performed-preservation-v1')) {
    invalid('Le reçu ne conserve pas sa base, son identité, sa révision ou les ajouts effectués.');
  }
  validateReceiptQualification(receipt.qualificationInput, receipt.qualificationSnapshot);
}

function validateApplicationLinkedToPreview(
  preference: HopAdviceEventPayloadV3['strategyPreferred'],
  preview: HopAdviceEventPayloadV3['programPreviewed'],
  receipt: HopAdviceProgramApplicationReceipt,
): void {
  assertApplicationReceipt(receipt);
  if (receipt.studyReference !== preview.receipt.studyReference || receipt.preferenceId !== preference.preferenceId
    || receipt.preferenceReference !== preference.preferenceReference || receipt.previewReference !== preview.receipt.reference
    || receipt.application.before.id !== preview.receipt.before.id
    || !sameContent(receipt.application.before, preview.receipt.before, 'hop-advice-application-before-v1')
    || !sameContent(receipt.application.proposal, preview.receipt.proposal, 'hop-advice-application-proposal-v1')
    || !sameContent(receipt.application.after, preview.receipt.proposal.program, 'hop-advice-application-after-v1')) {
    invalid('L’application locale ne correspond pas à son aperçu et à sa préférence.');
  }
}

function validateRestorationLinkedToApplication(
  preference: HopAdviceEventPayloadV3['strategyPreferred'],
  applicationEvent: HopAdviceEventPayloadV3['programAppliedLocally'],
  receipt: HopAdviceDraftRestorationReceipt,
): void {
  assertRestorationReceipt(receipt);
  const application = applicationEvent.receipt.application;
  if (receipt.studyReference !== applicationEvent.receipt.studyReference || receipt.preferenceId !== preference.preferenceId
    || receipt.preferenceReference !== preference.preferenceReference || receipt.applicationReference !== applicationEvent.receipt.reference
    || !sameContent(receipt.currentProgram, application.after, 'hop-advice-restored-current-program-v1')
    || !sameContent(receipt.draft.program, { ...application.before, revision: receipt.currentProgram.revision + 1 }, 'hop-restored-draft-v1')) {
    invalid('Le retour de brouillon ne référence pas l’application exacte ou ne préserve pas les ajouts effectués.');
  }
}

export function hopAdviceEventContentReference(event: HopAdviceEventV3): string {
  return hopAdviceCanonicalReference('hop-advice-event-content-v3', {
    ownerKey: event.ownerKey, dossierId: event.dossierId, eventId: event.eventId,
    eventFormatVersion: event.eventFormatVersion, kind: event.kind, payload: event.payload,
  });
}

export function createHopAdviceEvent<K extends HopAdviceEventKindV3>(command: HopAdviceEventCommand<K>): HopAdviceEventForV3<K> {
  if (!record(command) || !nonempty(command.ownerKey) || !nonempty(command.dossierId) || !nonempty(command.eventId)
    || !Number.isSafeInteger(command.expectedRevision) || command.expectedRevision < 0 || !isIsoDate(command.recordedAt)
    || !Object.prototype.hasOwnProperty.call(command, 'payload')) invalid('Commande d’événement de conseil incomplète.');
  if (command.expectedRevision >= Number.MAX_SAFE_INTEGER) invalid('Révision de dossier de conseil hors limites.');
  const event = { ...clone(command), eventFormatVersion: 3 as const, resultingRevision: command.expectedRevision + 1 } as HopAdviceEventForV3<K>;
  validateHopAdviceEventShape(event as HopAdviceEventV3);
  return event;
}

function validateHopAdviceEventShape(event: HopAdviceEventV3): void {
  if (!record(event) || event.eventFormatVersion !== 3 || !nonempty(event.ownerKey) || !nonempty(event.dossierId)
    || !nonempty(event.eventId) || !isIsoDate(event.recordedAt) || !Number.isSafeInteger(event.expectedRevision)
    || event.expectedRevision < 0 || !Number.isSafeInteger(event.resultingRevision)
    || event.resultingRevision !== event.expectedRevision + 1 || !record(event.payload)) invalid('Événement de conseil v3 mal formé.');
  const payload = event.payload as Record<string, any>;
  switch (event.kind) {
    case 'studySaved':
      allowedKeys(payload, ['snapshotFormatVersion', 'supersedesDossierId'], 'studySaved v3');
      if (payload.snapshotFormatVersion !== 3 || payload.supersedesDossierId !== undefined && !nonempty(payload.supersedesDossierId)) invalid('studySaved v3 invalide.');
      return;
    case 'strategyPreferred':
      exactKeys(payload, ['preferenceId', 'studyReference', 'resultReference', 'optionId', 'optionReference', 'programScope',
        'interpretation', 'interpretationReference', 'reason', 'preferenceReference'], 'strategyPreferred v3');
      assertPreferencePayload(payload);
      return;
    case 'programPreviewed':
      exactKeys(payload, ['preferenceId', 'previewId', 'receipt'], 'programPreviewed v3');
      if (!nonempty(payload.preferenceId) || !nonempty(payload.previewId)) invalid('Identité de preview v3 absente.');
      assertPreviewReceipt(payload.receipt);
      return;
    case 'programAppliedLocally':
      exactKeys(payload, ['preferenceId', 'previewId', 'applicationId', 'receipt'], 'programAppliedLocally v3');
      if (!nonempty(payload.preferenceId) || !nonempty(payload.previewId) || !nonempty(payload.applicationId)) invalid('Identité d’application locale v3 absente.');
      assertApplicationReceipt(payload.receipt);
      return;
    case 'draftRestored':
      exactKeys(payload, ['preferenceId', 'applicationId', 'restorationId', 'receipt'], 'draftRestored v3');
      if (!nonempty(payload.preferenceId) || !nonempty(payload.applicationId) || !nonempty(payload.restorationId)) invalid('Identité de restauration v3 absente.');
      assertRestorationReceipt(payload.receipt);
      return;
    case 'correctionRecorded':
      exactKeys(payload, ['successorDossierId', 'reason', 'correctedAssertionIds'], 'correctionRecorded v3');
      if (!nonempty(payload.successorDossierId) || !nonempty(payload.reason) || !Array.isArray(payload.correctedAssertionIds)
        || payload.correctedAssertionIds.some((id: unknown) => !nonempty(id)) || new Set(payload.correctedAssertionIds).size !== payload.correctedAssertionIds.length) invalid('correctionRecorded v3 invalide.');
      return;
    case 'supersededBy':
      exactKeys(payload, ['successorDossierId', 'reason'], 'supersededBy v3');
      if (!nonempty(payload.successorDossierId) || !nonempty(payload.reason)) invalid('supersededBy v3 invalide.');
      return;
    default:
      invalid('Nature d’événement de conseil v3 inconnue.');
  }
}

function validateDossierV3(dossier: HopAdviceDossierV3): void {
  if (!record(dossier) || dossier.formatVersion !== 3 || !nonempty(dossier.ownerKey) || !nonempty(dossier.dossierId)
    || !Number.isSafeInteger(dossier.revision) || dossier.revision < 1 || !isIsoDate(dossier.createdAt) || !isIsoDate(dossier.updatedAt)
    || !nonempty(dossier.lastEventId) || !['studySaved', 'strategyPreferred', 'programPreviewed', 'programAppliedLocally', 'draftRestored', 'correctionRecorded', 'supersededBy'].includes(dossier.state)) {
    invalid('Dossier de conseil v3 mal formé.');
  }
  if (dossier.supersedesDossierId !== undefined && (!nonempty(dossier.supersedesDossierId) || dossier.supersedesDossierId === dossier.dossierId)
    || dossier.supersededByDossierId !== undefined && (!nonempty(dossier.supersededByDossierId) || dossier.supersededByDossierId === dossier.dossierId)) {
    invalid('Lien de supersession du conseil invalide.');
  }
  if (dossier.state === 'supersededBy' && !nonempty(dossier.supersededByDossierId)) invalid('La projection v3 de supersession doit pointer vers son successeur.');
  validateStudyV3Structure(dossier.study);
}

export function createHopAdviceDossier(input: CreateHopAdviceDossierInput): CreatedHopAdviceDossier {
  if (!record(input) || !nonempty(input.ownerKey) || !nonempty(input.dossierId) || !nonempty(input.eventId)
    || !isIsoDate(input.recordedAt) || input.supersedesDossierId !== undefined
      && (!nonempty(input.supersedesDossierId) || input.supersedesDossierId === input.dossierId)) invalid('Identité ou horodatage de dossier conseil invalide.');
  validateStudyV3ForCreate(input.study);
  const study = clone(input.study);
  const event = createHopAdviceEvent({ ownerKey: input.ownerKey, dossierId: input.dossierId, eventId: input.eventId,
    expectedRevision: 0, recordedAt: input.recordedAt, kind: 'studySaved',
    payload: { snapshotFormatVersion: 3, ...(input.supersedesDossierId ? { supersedesDossierId: input.supersedesDossierId } : {}) } });
  return {
    dossier: { formatVersion: 3, ownerKey: input.ownerKey, dossierId: input.dossierId, revision: 1,
      createdAt: input.recordedAt, updatedAt: input.recordedAt, lastEventId: input.eventId, state: 'studySaved', study,
      ...(input.supersedesDossierId ? { supersedesDossierId: input.supersedesDossierId } : {}) },
    event,
  };
}

function validateHopAdviceEventHistory(dossier: HopAdviceDossierV3, events: readonly HopAdviceEventV3[]): void {
  if (!Array.isArray(events) || events.length !== dossier.revision) invalid('L’historique de conseil v3 ne contient pas toutes les révisions.');
  const ids = new Set<string>();
  let revision = 0;
  for (const event of events) {
    validateHopAdviceEventShape(event);
    if (event.ownerKey !== dossier.ownerKey || event.dossierId !== dossier.dossierId || ids.has(event.eventId)
      || event.expectedRevision !== revision || event.resultingRevision !== revision + 1) invalid('L’historique v3 contient une identité ou une révision incohérente.');
    if (revision === 0 && event.kind !== 'studySaved') {
      invalid('La première révision doit conserver le studySaved v3.');
    }
    if (revision > 0 && event.kind === 'studySaved') invalid('Une étude ne peut être réécrite dans l’historique v3.');
    ids.add(event.eventId);
    revision = event.resultingRevision;
  }
  const last = events.at(-1);
  const first = events[0];
  const supersessionEvents = events.filter((event): event is Extract<HopAdviceEventV3, { kind: 'supersededBy' }> => event.kind === 'supersededBy');
  const recordedSupersession = supersessionEvents[0]?.payload.successorDossierId;
  if (revision !== dossier.revision || last?.eventId !== dossier.lastEventId || last?.kind !== dossier.state
    || first?.recordedAt !== dossier.createdAt || last?.recordedAt !== dossier.updatedAt
    || first?.kind !== 'studySaved' || first.payload.supersedesDossierId !== dossier.supersedesDossierId
    || supersessionEvents.length > 1 || supersessionEvents.length === 1 && last?.kind !== 'supersededBy'
    || recordedSupersession !== dossier.supersededByDossierId) {
    invalid('La projection v3 ne correspond pas à l’historique append-only et à ses liens explicites.');
  }
}

function findPreferenceEvent(events: readonly HopAdviceEventV3[], preferenceId: string) {
  return events.find((event): event is Extract<HopAdviceEventV3, { kind: 'strategyPreferred' }> =>
    event.kind === 'strategyPreferred' && event.payload.preferenceId === preferenceId);
}

function findPreviewEvent(events: readonly HopAdviceEventV3[], preferenceId: string, previewId: string) {
  return events.find((event): event is Extract<HopAdviceEventV3, { kind: 'programPreviewed' }> =>
    event.kind === 'programPreviewed' && event.payload.preferenceId === preferenceId && event.payload.previewId === previewId);
}

function findApplicationEvent(events: readonly HopAdviceEventV3[], preferenceId: string, applicationId: string) {
  return events.find((event): event is Extract<HopAdviceEventV3, { kind: 'programAppliedLocally' }> =>
    event.kind === 'programAppliedLocally' && event.payload.preferenceId === preferenceId && event.payload.applicationId === applicationId);
}

export function applyHopAdviceEvent(
  dossier: HopAdviceDossierV3,
  event: HopAdviceEventV3,
  previousEvents: readonly HopAdviceEventV3[] = [],
): HopAdviceDossierV3 {
  validateDossierV3(dossier);
  validateHopAdviceEventShape(event);
  if (event.ownerKey !== dossier.ownerKey || event.dossierId !== dossier.dossierId) invalid('L’événement de conseil appartient à un autre owner/dossier.');
  if (event.kind === 'studySaved') invalid('studySaved v3 est créé avec le dossier et ne peut pas remplacer l’étude.');
  if (dossier.supersededByDossierId) throw new HopAdviceDossierError('invalidTransition', 'Un dossier supersédé reste lisible mais n’accepte plus d’événement.');
  validateHopAdviceEventHistory(dossier, previousEvents);
  if (event.expectedRevision !== dossier.revision) throw new HopAdviceDossierError('staleRevision', 'La révision du dossier conseil est périmée.');

  if (event.kind === 'strategyPreferred') {
    assertStudyPreference(dossier.study, event.payload);
    if (previousEvents.some(row => row.kind === 'strategyPreferred' && row.payload.preferenceId === event.payload.preferenceId)) {
      invalid('Ce preferenceId existe déjà dans l’historique; une nouvelle préférence exige un identifiant distinct.');
    }
  }
  if (event.kind === 'programPreviewed') {
    const preferred = findPreferenceEvent(previousEvents, event.payload.preferenceId);
    if (!preferred) invalid('Un aperçu exige une préférence déjà conservée dans ce dossier.');
    validatePreviewLinkedToPreference(dossier.study, preferred.payload, event.payload.receipt);
    if (previousEvents.some(row => row.kind === 'programPreviewed' && row.payload.previewId === event.payload.previewId)) invalid('Ce previewId existe déjà dans l’historique.');
  }
  if (event.kind === 'programAppliedLocally') {
    const preferred = findPreferenceEvent(previousEvents, event.payload.preferenceId);
    const preview = findPreviewEvent(previousEvents, event.payload.preferenceId, event.payload.previewId);
    if (!preferred || !preview) invalid('Une application locale exige le preview exact de sa préférence.');
    validateApplicationLinkedToPreview(preferred.payload, preview.payload, event.payload.receipt);
    if (previousEvents.some(row => row.kind === 'programAppliedLocally' && row.payload.applicationId === event.payload.applicationId)) invalid('Cet applicationId existe déjà dans l’historique.');
  }
  if (event.kind === 'draftRestored') {
    const preferred = findPreferenceEvent(previousEvents, event.payload.preferenceId);
    const application = findApplicationEvent(previousEvents, event.payload.preferenceId, event.payload.applicationId);
    if (!preferred || !application) invalid('Une restauration exige l’application locale exacte de sa préférence.');
    validateRestorationLinkedToApplication(preferred.payload, application.payload, event.payload.receipt);
    if (previousEvents.some(row => row.kind === 'draftRestored' && row.payload.restorationId === event.payload.restorationId)) invalid('Cet identifiant de restauration existe déjà.');
  }
  if ((event.kind === 'correctionRecorded' || event.kind === 'supersededBy') && event.payload.successorDossierId === dossier.dossierId) invalid('Un dossier de conseil ne peut pas se corriger ou se superséder lui-même.');

  return { ...dossier, revision: event.resultingRevision, updatedAt: event.recordedAt, lastEventId: event.eventId,
    state: event.kind, ...(event.kind === 'supersededBy' ? { supersededByDossierId: event.payload.successorDossierId } : {}) };
}

export function readHopAdviceDossier(value: unknown): HopAdviceDossierRead {
  if (!record(value) || !nonempty(value.ownerKey) || !nonempty(value.dossierId)
    || !Number.isSafeInteger(value.formatVersion) || value.formatVersion < 1) invalid('Enveloppe de dossier conseil persistée mal formée.');
  if (value.formatVersion !== 3) return { status: 'unsupportedFormat', reason: 'formatVersion', ownerKey: value.ownerKey,
    dossierId: value.dossierId, formatVersion: value.formatVersion, raw: clone(value) };
  const study = record(value.study) ? value.study : null;
  if (!study) invalid('Étude de dossier conseil absente.');
  const snapshot = record(study.qualificationSnapshot) ? study.qualificationSnapshot : null;
  if (snapshot && snapshot.version !== SUPPORTED_QUALIFICATION_VERSION) return { status: 'unsupportedFormat', reason: 'qualificationVersion',
    ownerKey: value.ownerKey, dossierId: value.dossierId, formatVersion: 3, raw: clone(value) };
  const qualificationResult = snapshot && record(snapshot.result) ? snapshot.result : null;
  if (qualificationResult && qualificationResult.version !== SUPPORTED_QUALIFICATION_VERSION) return { status: 'unsupportedFormat', reason: 'qualificationVersion',
    ownerKey: value.ownerKey, dossierId: value.dossierId, formatVersion: 3, raw: clone(value) };
  const assembly = record(study.requestSnapshot) && record(study.requestSnapshot.qualificationInput)
    ? study.requestSnapshot.qualificationInput.assembly : undefined;
  if (assembly !== undefined && (!record(assembly) || assembly.version !== SUPPORTED_ASSEMBLY_VERSION)) return { status: 'unsupportedFormat', reason: 'assemblyVersion',
    ownerKey: value.ownerKey, dossierId: value.dossierId, formatVersion: 3, raw: clone(value) };
  const response = record(study.responseSnapshot) ? study.responseSnapshot : null;
  if (response && response.version !== HOP_DECISION_VERSION) return { status: 'unsupportedFormat', reason: 'calculationVersion',
    ownerKey: value.ownerKey, dossierId: value.dossierId, formatVersion: 3, raw: clone(value) };
  const result = response && record(response.result) ? response.result : null;
  if (result && result.version !== HOP_ADVICE_VERSION) return { status: 'unsupportedFormat', reason: 'adviceVersion',
    ownerKey: value.ownerKey, dossierId: value.dossierId, formatVersion: 3, raw: clone(value) };
  validateDossierV3(value as HopAdviceDossierV3);
  return clone(value as HopAdviceDossierV3);
}

export function readHopAdviceEvent(value: unknown): HopAdviceEventRead {
  if (!record(value) || !nonempty(value.ownerKey) || !nonempty(value.dossierId) || !nonempty(value.eventId)
    || !Number.isSafeInteger(value.eventFormatVersion) || value.eventFormatVersion < 1) invalid('Enveloppe d’événement conseil persistée mal formée.');
  if (value.eventFormatVersion !== 3) return { status: 'unsupportedEventFormat', ownerKey: value.ownerKey, dossierId: value.dossierId,
    eventId: value.eventId, eventFormatVersion: value.eventFormatVersion, raw: clone(value) };
  validateHopAdviceEventShape(value as HopAdviceEventV3);
  return clone(value as HopAdviceEventV3);
}
