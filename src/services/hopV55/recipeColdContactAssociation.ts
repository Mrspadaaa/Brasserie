import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import {
  compareHopColdContactEvidenceSourceV1,
  readHopColdContactEvidenceV1,
  type HopColdContactEvidenceExpectedSourceV1,
  type HopColdContactEvidenceV1,
} from '../../domain/hopDecision/coldContactEvidence';
import { readHopV55RecipeApplication, hopV55RecipeApplicationValueReference } from './recipeDraftApplication';
import { HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES, HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH } from './qualifiedColdContactEvidence';
import { measureBrewerHopAdviceSemanticJsonWire } from '../../../functions/src/brewerHopAdviceSemanticV3';
import type { Recipe } from '../../types';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { pitchedYeastSource } from '../../domain/wizardSourceValues';

export const HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT = 'hop-v55-recipe-cold-evidence-association-v1' as const;
const FORMAT_PREFIX = 'hop-v55-recipe-cold-evidence-association-';

type RecordValue = Record<string, unknown>;
const isRecord = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && value.trim() === value && value.length > 0;
const exactKeys = (value: RecordValue, keys: readonly string[]) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const clone = <T,>(value: T): T => structuredClone(value);

/** Rule 1, for associations conserved before decision n°22: the whole recipe except the append-only evidence log. */
function wholeRecipeColdSourceReference(recipe: Recipe): string {
  const sourceRecipe = { ...recipe };
  delete sourceRecipe.hopV55ColdEvidenceAssociations;
  return hopDecisionReference(sourceRecipe);
}

/**
 * Canonical source reference of a recipe for a new cold proof (decision n°22): the recipe without the evidence log, its yeast
 * read only as pitched (`pitchedYeastSource`), so the Recap completion of catalogue identity and documentary facts keeps it.
 * A J4-linked association would compare this reference with the receipt's, which reads the whole recipe; no host creates one.
 */
export function hopV55RecipeColdSourceReference(recipe: Recipe): string {
  const sourceRecipe = { ...recipe };
  delete sourceRecipe.hopV55ColdEvidenceAssociations;
  if (recipe.yeast) Object.assign(sourceRecipe, { yeast: pitchedYeastSource(recipe.yeast) });
  return hopDecisionReference(sourceRecipe);
}

/** Current reference of `recipe` under the rule a conserved association was sealed with (rule 1, else the current rule). */
export function hopV55RecipeColdSourceReferenceFor(stored: string, recipe: Recipe): string {
  const whole = wholeRecipeColdSourceReference(recipe);
  return stored === whole ? whole : hopV55RecipeColdSourceReference(recipe);
}

/** Origin is host supplied. Local calculations never carry a fabricated turn evidence ID. */
export type HopV55RecipeColdContactOriginV1 =
  | { kind: 'localCalculation' }
  | { kind: 'assistedTurn'; evidenceId: string };

/** Compact witness resolved by the host from the actual J4 receipt and its canonical branch/program sources. */
export interface HopV55RecipeColdContactApplicationWitnessV1 {
  applicationRecordReference: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  copyPreviewReference: string;
  recipePreviewReference: string;
  dossierReference: string;
  programApplicationReference: string;
  scopeReference: string;
  programReference: string;
  qualificationReference: string;
  contextReference: string;
  contactReference: string;
}

export interface HopV55RecipeColdContactAssociationV1 {
  format: typeof HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT;
  id: string;
  ownerKey: string;
  recipeId: string;
  /** Documentary reference of the origin recipe snapshot; the host computes it before appending this trace. */
  sourceRecipeReference: string;
  /** Full immutable closure, including program/contact/qualification/context snapshots and protocol limitations. */
  evidenceSnapshot: HopColdContactEvidenceV1;
  evidenceReference: string;
  origin: HopV55RecipeColdContactOriginV1;
  /** Null while only conserving a proof; otherwise points to a J4 receipt validated with its host witness. */
  applicationRecordReference: string | null;
  applicationWitness: HopV55RecipeColdContactApplicationWitnessV1 | null;
  recordedAt: string;
  reference: string;
}

export interface HopV55RecipeColdContactAssociationInputV1 {
  id: string;
  ownerKey: string;
  recipeId: string;
  /** Raw canonical source-recipe reference; it is not the compact hash stored inside the J4 receipt. */
  sourceRecipeReference: string;
  evidence: unknown;
  origin: unknown;
  /** Explicitly null until an actual application exists; a non-null receipt requires a host-resolved witness. */
  applicationRecord: unknown | null;
  applicationWitness: unknown | null;
  recordedAt: string;
}

export type HopV55RecipeColdContactAssociationCreateResultV1 =
  | { status: 'ready'; association: HopV55RecipeColdContactAssociationV1; payload: { utf8Bytes: number; maxDepth: number } }
  /** `mismatches` keeps the exact structured keys behind a French reason. */
  | { status: 'blocked'; reason: string; mismatches?: string[] }
  | { status: 'unsupported'; reason: string; raw: unknown }
  | { status: 'tooLarge'; payload: { utf8Bytes: number; maxDepth: number }; maxBytes: number; maxDepth: number };

export type HopV55RecipeColdContactAssociationReadV1 =
  | { status: 'readOnly'; association: HopV55RecipeColdContactAssociationV1;
      applicationLink: { status: 'notApplicable' } | { status: 'verified'; reference: string } | { status: 'unresolved'; reference: string } }
  | { status: 'unsupportedReadOnly'; reason: string; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

export type HopV55RecipeColdContactAssociationSourceV1 =
  | { status: 'current' }
  | { status: 'historical'; mismatches: string[] };

/** Brewer-facing names of source mismatches. The structured keys stay in comparison results, never in visible prose. */
const MISMATCH_LABELS: Readonly<Record<string, string>> = {
  associationUnreadable: 'association illisible',
  applicationReceiptUnresolved: 'reçu d’application introuvable',
  applicationRecord: 'reçu d’application',
  applicationWitness: 'témoin d’application',
  ownerKey: 'profil',
  recipeId: 'recette',
  sourceRecipeReference: 'contenu du brouillon d’origine',
  'evidence.ownerKey': 'profil de la preuve',
  'evidence.scopeReference': 'portée de la preuve',
  'evidence.programReference': 'programme de houblonnage',
  'evidence.qualificationReference': 'qualification des matières',
  'evidence.contextReference': 'contexte de la bière',
  'evidence.contactReference': 'lignes du contact',
  'application.ownerKey': 'profil de l’application',
  'application.recipeId': 'recette de l’application',
  'application.sourceRecipeReference': 'brouillon d’origine de l’application',
  'application.id': 'identité du reçu d’application',
  'application.scenarioId': 'scénario appliqué',
  'application.snapshotReference': 'instantané du scénario',
  'application.branchId': 'branche appliquée',
  'application.branchReference': 'contenu de la branche',
  'application.copyPreviewReference': 'aperçu de copie',
  'application.recipePreviewReference': 'aperçu de recette',
  'application.dossierReference': 'dossier d’application',
  'application.programApplicationReference': 'programme appliqué',
};

export function describeHopV55RecipeColdContactMismatchesV1(mismatches: readonly string[]): string {
  return [...new Set(mismatches.map(key => Object.prototype.hasOwnProperty.call(MISMATCH_LABELS, key)
    ? MISMATCH_LABELS[key] : 'autre référence de source'))].join(', ');
}

function validOrigin(value: unknown): value is HopV55RecipeColdContactOriginV1 {
  if (!isRecord(value)) return false;
  if (value.kind === 'localCalculation') return exactKeys(value, ['kind']);
  return value.kind === 'assistedTurn' && exactKeys(value, ['kind', 'evidenceId']) && isText(value.evidenceId);
}

function validWitness(value: unknown): value is HopV55RecipeColdContactApplicationWitnessV1 {
  const keys = ['applicationRecordReference', 'scenarioId', 'snapshotReference', 'branchId', 'branchReference',
    'copyPreviewReference', 'recipePreviewReference', 'dossierReference', 'programApplicationReference',
    'scopeReference', 'programReference', 'qualificationReference', 'contextReference', 'contactReference'];
  return isRecord(value) && exactKeys(value, keys) && keys.every(key => isText(value[key]));
}

function validTimestamp(value: unknown): value is string {
  return isText(value) && Number.isFinite(Date.parse(value));
}

function witnessMismatches(input: {
  ownerKey: string;
  recipeId: string;
  sourceRecipeReference: string;
  evidence: HopColdContactEvidenceV1;
  receipt: unknown;
  witness: unknown;
}): string[] | 'unsupported' {
  const read = readHopV55RecipeApplication(input.receipt);
  if (read.status === 'unsupported') return 'unsupported';
  if (read.status === 'invalid') return ['applicationRecord'];
  if (!validWitness(input.witness)) return ['applicationWitness'];
  const record = read.record;
  const witness = input.witness;
  const mismatches: string[] = [];
  if (record.ownerKey !== input.ownerKey) mismatches.push('application.ownerKey');
  if (record.recipeId !== input.recipeId) mismatches.push('application.recipeId');
  // J4 seals a compact source reference. Compare it through the public helper to the raw origin reference.
  if (record.sourceRecipeReference !== hopV55RecipeApplicationValueReference('sourceRecipe', input.sourceRecipeReference)) {
    mismatches.push('application.sourceRecipeReference');
  }
  for (const key of ['id', 'scenarioId', 'snapshotReference', 'branchId', 'branchReference', 'copyPreviewReference',
    'recipePreviewReference'] as const) {
    const witnessKey = key === 'id' ? 'applicationRecordReference' : key;
    const recordValue = key === 'id' ? record.reference : record[key];
    if (witness[witnessKey] !== recordValue) mismatches.push(`application.${key}`);
  }
  if (!record.dossierReference || witness.dossierReference !== record.dossierReference) mismatches.push('application.dossierReference');
  if (!record.programApplicationReference || witness.programApplicationReference !== record.programApplicationReference) {
    mismatches.push('application.programApplicationReference');
  }
  const source = input.evidence.sourceBinding;
  for (const key of ['scopeReference', 'programReference', 'qualificationReference', 'contextReference', 'contactReference'] as const) {
    if (witness[key] !== source[key]) mismatches.push(`evidence.${key}`);
  }
  return mismatches;
}

function validatedApplicationLink(input: {
  ownerKey: string;
  recipeId: string;
  sourceRecipeReference: string;
  evidence: HopColdContactEvidenceV1;
  applicationRecord: unknown | null;
  applicationWitness: unknown | null;
}): { status: 'ready'; reference: string | null; witness: HopV55RecipeColdContactApplicationWitnessV1 | null }
  | { status: 'blocked'; reason: string; mismatches?: string[] }
  | { status: 'unsupported'; reason: string; raw: unknown } {
  if (input.applicationRecord === null) {
    return input.applicationWitness === null ? { status: 'ready', reference: null, witness: null }
      : { status: 'blocked', reason: 'Un témoin d’application est fourni sans reçu J4.' };
  }
  if (!validWitness(input.applicationWitness)) return { status: 'blocked', reason: 'Le reçu J4 exige un témoin exact résolu par l’hôte.' };
  const mismatches = witnessMismatches({ ownerKey: input.ownerKey, recipeId: input.recipeId,
    sourceRecipeReference: input.sourceRecipeReference, evidence: input.evidence,
    receipt: input.applicationRecord, witness: input.applicationWitness });
  if (mismatches === 'unsupported') return { status: 'unsupported', reason: 'Le reçu J4 est futur; son lien reste en lecture seule.', raw: input.applicationRecord };
  if (mismatches.length) {
    return { status: 'blocked', mismatches,
      reason: `Le reçu ou son témoin ne correspond pas à cette association : ${describeHopV55RecipeColdContactMismatchesV1(mismatches)}.` };
  }
  return { status: 'ready', reference: input.applicationWitness.applicationRecordReference, witness: clone(input.applicationWitness) };
}

/**
 * Seals a separate recipe provenance row around the canonical evidence snapshot. It does not apply a recipe,
 * change hops/IBU or recalculate a cold assessment. All current-source checks remain host supplied.
 */
export function createHopV55RecipeColdContactAssociationV1(
  input: HopV55RecipeColdContactAssociationInputV1,
): HopV55RecipeColdContactAssociationCreateResultV1 {
  if (!isText(input.id) || !isText(input.ownerKey) || !isText(input.recipeId) || !isText(input.sourceRecipeReference)
    || !validTimestamp(input.recordedAt) || !validOrigin(input.origin)) {
    return { status: 'blocked', reason: 'Identité, origine ou date de l’association de preuve froide invalide.' };
  }
  const evidenceRead = readHopColdContactEvidenceV1(input.evidence);
  if (evidenceRead.status === 'unsupportedFormat') {
    return { status: 'unsupported', reason: evidenceRead.reason, raw: evidenceRead.raw };
  }
  if (evidenceRead.status === 'invalid') return { status: 'blocked', reason: evidenceRead.reason };
  if (evidenceRead.evidence.sourceBinding.ownerKey !== input.ownerKey) {
    return { status: 'blocked', reason: 'La preuve froide appartient à un autre profil.' };
  }
  const appLink = validatedApplicationLink({ ownerKey: input.ownerKey, recipeId: input.recipeId,
    sourceRecipeReference: input.sourceRecipeReference, evidence: evidenceRead.evidence,
    applicationRecord: input.applicationRecord, applicationWitness: input.applicationWitness });
  if (appLink.status !== 'ready') return appLink;
  const body: Omit<HopV55RecipeColdContactAssociationV1, 'reference'> = {
    format: HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT,
    id: input.id,
    ownerKey: input.ownerKey,
    recipeId: input.recipeId,
    sourceRecipeReference: input.sourceRecipeReference,
    evidenceSnapshot: clone(evidenceRead.evidence),
    evidenceReference: evidenceRead.evidence.reference,
    origin: clone(input.origin),
    applicationRecordReference: appLink.reference,
    applicationWitness: appLink.witness,
    recordedAt: input.recordedAt,
  };
  let association: HopV55RecipeColdContactAssociationV1;
  let payload: { utf8Bytes: number; maxDepth: number };
  try {
    association = { ...body, reference: hopAdviceContentReference(HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT, body) };
    payload = measureBrewerHopAdviceSemanticJsonWire(association);
  } catch (error) {
    return { status: 'blocked', reason: error instanceof Error ? error.message : 'L’association froide n’est pas sérialisable.' };
  }
  if (payload.utf8Bytes > HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES || payload.maxDepth > HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH) {
    return { status: 'tooLarge', payload, maxBytes: HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES, maxDepth: HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH };
  }
  const checked = readHopV55RecipeColdContactAssociationV1(association, input.applicationRecord);
  if (checked.status !== 'readOnly' || checked.applicationLink.status === 'unresolved') {
    return checked.status === 'unsupportedReadOnly'
      ? { status: 'unsupported', reason: checked.reason, raw: checked.raw }
      : { status: 'blocked', reason: checked.status === 'invalid' ? checked.reason : 'Le reçu J4 exact n’a pas été vérifié.' };
  }
  return { status: 'ready', association: checked.association, payload };
}

/** Strict known-format reader. It verifies the association's own seal before dispatching a nested future format. */
export function readHopV55RecipeColdContactAssociationV1(value: unknown, applicationRecord?: unknown): HopV55RecipeColdContactAssociationReadV1 {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Association de preuve froide illisible.', raw: value };
  if (typeof value.format === 'string' && value.format.startsWith(FORMAT_PREFIX)
    && value.format !== HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT) {
    return { status: 'unsupportedReadOnly', reason: `Format d’association froide futur : ${value.format}.`, raw: clone(value) };
  }
  if (value.format !== HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT) {
    return { status: 'invalid', reason: 'Format d’association froide inconnu.', raw: value };
  }
  const keys = ['format', 'id', 'ownerKey', 'recipeId', 'sourceRecipeReference', 'evidenceSnapshot', 'evidenceReference',
    'origin', 'applicationRecordReference', 'applicationWitness', 'recordedAt', 'reference'];
  const applicationRecordReferenceValue = value.applicationRecordReference;
  const applicationWitnessValue = value.applicationWitness;
  if (!exactKeys(value, keys) || !isText(value.id) || !isText(value.ownerKey) || !isText(value.recipeId)
    || !isText(value.sourceRecipeReference) || !isText(value.evidenceReference) || !validOrigin(value.origin)
    || !(applicationRecordReferenceValue === null || isText(applicationRecordReferenceValue))
    || !(applicationWitnessValue === null || validWitness(applicationWitnessValue))
    || !validTimestamp(value.recordedAt) || !isText(value.reference)) {
    return { status: 'invalid', reason: 'Association froide connue incomplète ou étendue.', raw: value };
  }
  // Preserve the runtime narrowing explicitly: Record<string, unknown> fields do not
  // remain narrowed through repeated indexed property access in this validator.
  const applicationRecordReference = applicationRecordReferenceValue as string | null;
  const applicationWitness = applicationWitnessValue as HopV55RecipeColdContactApplicationWitnessV1 | null;
  if ((applicationRecordReference === null) !== (applicationWitness === null)
    || applicationWitness !== null && applicationWitness.applicationRecordReference !== applicationRecordReference) {
    return { status: 'invalid', reason: 'Lien ou témoin J4 incomplet dans l’association froide.', raw: value };
  }
  try {
    const { reference: _reference, ...body } = value;
    if (hopAdviceContentReference(HOP_V55_RECIPE_COLD_CONTACT_ASSOCIATION_FORMAT, body) !== value.reference) {
      return { status: 'invalid', reason: 'Empreinte de l’association froide invalide.', raw: value };
    }
  } catch {
    return { status: 'invalid', reason: 'Association froide connue non sérialisable.', raw: value };
  }
  let payload: { utf8Bytes: number; maxDepth: number };
  try { payload = measureBrewerHopAdviceSemanticJsonWire(value); }
  catch { return { status: 'invalid', reason: 'Association froide impossible à mesurer au format de transmission canonique.', raw: value }; }
  if (payload.utf8Bytes > HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES || payload.maxDepth > HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH) {
    return { status: 'invalid', reason: 'Association froide connue hors des limites de payload reçues.', raw: value };
  }

  const evidenceRead = readHopColdContactEvidenceV1(value.evidenceSnapshot);
  if (evidenceRead.status === 'unsupportedFormat') {
    return { status: 'unsupportedReadOnly', reason: `Snapshot froid imbriqué futur : ${evidenceRead.reason}`, raw: clone(value) };
  }
  if (evidenceRead.status === 'invalid') {
    return { status: 'invalid', reason: `Snapshot froid invalide : ${evidenceRead.reason}`, raw: value };
  }
  if (evidenceRead.evidence.reference !== value.evidenceReference
    || evidenceRead.evidence.sourceBinding.ownerKey !== value.ownerKey) {
    return { status: 'invalid', reason: 'Référence de preuve ou profil détachés de l’association froide.', raw: value };
  }
  if (applicationRecordReference === null) {
    return { status: 'readOnly', association: clone(value as unknown as HopV55RecipeColdContactAssociationV1),
      applicationLink: { status: 'notApplicable' } };
  }
  if (applicationRecord === undefined) {
    return { status: 'readOnly', association: clone(value as unknown as HopV55RecipeColdContactAssociationV1),
      applicationLink: { status: 'unresolved', reference: applicationRecordReference } };
  }
  const app = validatedApplicationLink({ ownerKey: value.ownerKey, recipeId: value.recipeId,
    sourceRecipeReference: value.sourceRecipeReference, evidence: evidenceRead.evidence,
    applicationRecord, applicationWitness });
  if (app.status === 'unsupported') {
    return { status: 'unsupportedReadOnly', reason: app.reason, raw: clone(value) };
  }
  if (app.status !== 'ready' || app.reference !== applicationRecordReference) {
    return { status: 'invalid', reason: app.status === 'blocked' ? app.reason : 'Reçu J4 non lié à cette association froide.', raw: value };
  }
  return { status: 'readOnly', association: clone(value as unknown as HopV55RecipeColdContactAssociationV1),
    applicationLink: { status: 'verified', reference: app.reference! } };
}

/** Freshness is an explicit comparison against host-provided canonical bindings; this never recalculates A. */
export function compareHopV55RecipeColdContactAssociationSourceV1(input: {
  association: HopV55RecipeColdContactAssociationV1;
  applicationRecord?: unknown;
  current: {
    ownerKey: string;
    recipeId: string;
    sourceRecipeReference: string;
    sourceBinding: HopColdContactEvidenceExpectedSourceV1;
  };
}): HopV55RecipeColdContactAssociationSourceV1 {
  const read = readHopV55RecipeColdContactAssociationV1(input.association, input.applicationRecord);
  if (read.status !== 'readOnly') return { status: 'historical', mismatches: ['associationUnreadable'] };
  if (read.applicationLink.status === 'unresolved') return { status: 'historical', mismatches: ['applicationReceiptUnresolved'] };
  const association = read.association;
  const mismatches: string[] = [];
  if (association.ownerKey !== input.current.ownerKey) mismatches.push('ownerKey');
  if (association.recipeId !== input.current.recipeId) mismatches.push('recipeId');
  if (association.sourceRecipeReference !== input.current.sourceRecipeReference) mismatches.push('sourceRecipeReference');
  const source = compareHopColdContactEvidenceSourceV1(association.evidenceSnapshot, input.current.sourceBinding);
  if (source.status === 'stale') mismatches.push(...source.mismatches.map(key => `evidence.${key}`));
  return mismatches.length ? { status: 'historical', mismatches: [...new Set(mismatches)] } : { status: 'current' };
}

/**
 * Safe size of the whole cold journal inside one recipe document. The journal is append-only and travels with the
 * recipe: Firestore refuses a document over 1 MiB and a backup restore refuses one over 950 000 bytes, so the
 * journal keeps room for the rest of the recipe and its other traces.
 */
export const HOP_V55_RECIPE_COLD_JOURNAL_MAX_BYTES = 600_000;
const journalBytes = (rows: unknown[]) => new TextEncoder().encode(JSON.stringify(rows)).length;

/** Append-only local history. Future and invalid prior rows stay byte-for-byte; no recipe or application is written here. */
export function appendHopV55RecipeColdContactAssociation(existing: unknown, association: HopV55RecipeColdContactAssociationV1,
  applicationRecord?: unknown): unknown[] {
  if (existing !== undefined && !Array.isArray(existing)) throw new Error('L’historique de preuves froides est illisible et reste inchangé.');
  const newRead = readHopV55RecipeColdContactAssociationV1(association, applicationRecord);
  if (newRead.status !== 'readOnly' || newRead.applicationLink.status === 'unresolved') {
    throw new Error('L’association froide ou son reçu d’application exact n’est pas validé.');
  }
  const rows = Array.isArray(existing) ? existing : [];
  const previous = rows.find(row => isRecord(row) && row.id === association.id);
  if (previous !== undefined) {
    // The new payload was checked against its exact J4 receipt above. Existing older rows may point at other
    // application records; their immutable seal is enough for idempotent replay and they stay byte-for-byte.
    const oldRead = readHopV55RecipeColdContactAssociationV1(previous);
    if (oldRead.status !== 'readOnly' || oldRead.association.reference !== association.reference) {
      throw new Error('Cet ID d’association froide existe déjà avec un autre contenu; rien n’est remplacé.');
    }
    return clone(rows);
  }
  const next = [...clone(rows), clone(association)];
  const size = journalBytes(next);
  if (size > HOP_V55_RECIPE_COLD_JOURNAL_MAX_BYTES) {
    const ko = (bytes: number) => Math.ceil(bytes / 1000).toLocaleString('fr-CH');
    throw new Error(`Le journal des preuves froides de cette recette atteindrait ${ko(size)} Ko, au-delà de sa taille maximale de `
      + `${ko(HOP_V55_RECIPE_COLD_JOURNAL_MAX_BYTES)} Ko : aucune preuve n’est ajoutée. Les preuves conservées restent inchangées `
      + 'et celle-ci reste exportable en JSON.');
  }
  return next;
}
