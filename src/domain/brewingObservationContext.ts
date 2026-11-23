import type { BrewerContext } from '../../functions/src/companionTypes';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import { Units } from '../services/units';
import type { HopDecisionMaterial } from './hopDecision/types';
import type { RecipeSnapshot } from '../types';
import {
  BREWING_OBSERVED_STATE_INPUT_VERSION,
  createBrewingObservedStateInput,
  resolveBrewingObservedState,
  type BrewingObservedContactV1,
  type BrewingObservedCoverageV1,
  type BrewingObservedFactV1,
  type BrewingObservedIdentityV1,
  type BrewingObservedKnownReferenceV1,
  type BrewingObservedProvenanceV1,
  type BrewingObservedSampleContinuityV1,
  type BrewingObservedQuantityV1,
  type BrewingObservedStateInputV1,
  type BrewingObservedStateV1,
  type BrewingObservedTimeEvidenceV1,
} from './brewingObservedState';
import {
  buildBrewingObservedHopInput,
  type BrewingObservationModelContext,
  type BrewingObservedHopBinding,
  type BrewingObservedHopInput,
  type BrewingObservedHopScope,
} from './brewingObservationInputs';

export interface BrewingObservedBatchSourceV1 {
  kind: 'batch';
  id: string;
}

export interface BrewingObservedContactAttestationV1 {
  /** Exact journal key, for example `hop-0`; never resolved from an ingredient name. */
  additionKey: string;
  kind: 'activeThrough' | 'ended';
  evidence: BrewingObservedTimeEvidenceV1;
  epistemicStatus: 'observed' | 'reported';
}

export type BrewingObservedCoverageAttestationV1 = Omit<BrewingObservedCoverageV1, 'subjectReference'>;

export interface BrewingObservedSampleAttestationV1 {
  id: string;
  version: string;
  sourceBatchId: string;
  collection: BrewingObservedTimeEvidenceV1;
  continuity?: Array<Omit<BrewingObservedSampleContinuityV1, 'sampleReference'>>;
}

export interface BrewingObservedLegacyHopUnitQualificationV1 {
  /** Apply only to these exact journal keys. */
  additionKeys: string[];
  unit: 'g';
  reason: string;
  provenance: BrewingObservedProvenanceV1;
}

export interface PrepareBrewingObservedContextOptions {
  /** Must name the same canonical batch as `context.batch.id`. */
  source: BrewingObservedBatchSourceV1;
  /** Physical-state cutoff. For a sample this equals its collection effectiveAt. */
  asOf: string;
  /** Requested knowledge cutoff, distinct from the BrewerContext read instant. */
  knowledgeAsOf: string;
  contactAttestations?: BrewingObservedContactAttestationV1[];
  coverageAttestations?: BrewingObservedCoverageAttestationV1[];
  sample?: BrewingObservedSampleAttestationV1;
  legacyHopUnitQualification?: BrewingObservedLegacyHopUnitQualificationV1;
  /** Model scope is explicit; it is never inferred from an empty journal. */
  hopScope?: BrewingObservedHopScope;
  /** Optional, already-qualified catalogue materials. Matching uses exact IDs only. */
  materials?: HopDecisionMaterial[];
}

export interface BrewingObservedContextUnmappedV1 {
  sourceKey: string;
  code: string;
  reason: string;
  raw: unknown;
}

export interface PreparedBrewingObservedContextV1 {
  format: 'brewing-observed-context-v1';
  status: 'prepared' | 'refused';
  source: BrewingObservedBatchSourceV1 | null;
  observedBatchId: string | null;
  sourceSnapshot: RecipeSnapshot | null;
  sourceSnapshotReference: string | null;
  sourceJournal: unknown | null;
  sourceJournalReference: string | null;
  /** Kept only on source refusal; explicitly never used as a substitute snapshot. */
  mutableContextRecipePreserved?: unknown;
  stateInput: BrewingObservedStateInputV1 | null;
  state: BrewingObservedStateV1 | null;
  modelContext: BrewingObservationModelContext | null;
  hopScope: BrewingObservedHopScope | null;
  materials: HopDecisionMaterial[];
  proposedBindings: BrewingObservedHopBinding[];
  observedHopInput: BrewingObservedHopInput | null;
  unmapped: BrewingObservedContextUnmappedV1[];
  limitations: string[];
  refusal?: { code: string; message: string };
  reference: string;
}

type PlainRecord = Record<string, any>;
const record = (value: unknown): value is PlainRecord => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const instant = (value: unknown): value is string => text(value) && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
const clone = <T>(value: T): T => structuredClone(value);
const hash = (label: string, value: unknown): string => hopAdviceContentReference(label, value);
const withoutReference = (value: { reference: string }) => { const { reference: _reference, ...body } = value; return body; };
const exactKeys = (value: PlainRecord, allowed: string[]) => Object.keys(value).every(key => allowed.includes(key));

function isoFromMillis(value: unknown): string | null {
  if (!finite(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function physicalIdentity(kind: 'batch' | 'sample' | 'lot' | 'stock' | 'variety', id: string, version = 'identity-v1'): BrewingObservedIdentityV1 {
  return { id: `${kind}:${id}`, version, contentReference: hash('brewing-observed-physical-identity-v1', { kind, id }) };
}

function validateTimeEvidence(value: unknown): value is BrewingObservedTimeEvidenceV1 {
  return record(value) && exactKeys(value, ['effectiveAt', 'recordedAt', 'provenance'])
    && instant(value.effectiveAt) && instant(value.recordedAt) && record(value.provenance)
    && exactKeys(value.provenance, ['kind', 'reference', 'description', 'author'])
    && text(value.provenance.kind) && text(value.provenance.reference) && text(value.provenance.description)
    && (value.provenance.author === undefined || text(value.provenance.author));
}

function validateSource(value: unknown): value is BrewingObservedBatchSourceV1 {
  return record(value) && exactKeys(value, ['kind', 'id']) && value.kind === 'batch' && text(value.id);
}

function snapshotIsUsable(value: unknown): value is RecipeSnapshot {
  return record(value) && instant(value.capturedAt) && Array.isArray(value.hops);
}

function factMaterialIdentity(hop: PlainRecord, actual: PlainRecord): {
  material: BrewingObservedKnownReferenceV1;
  lot: BrewingObservedKnownReferenceV1;
  materialId: string | null;
  identityKind: 'lot' | 'stock' | 'variety' | null;
  identityValue: string | null;
  reason?: string;
} {
  const replacement = record(actual.replacement) ? actual.replacement : null;
  if (actual.replacement !== undefined && actual.replacement !== null) {
    const label = replacement && text(replacement.name) ? replacement.name : 'Remplacement journalisé sans identité';
    const reason = 'Le journal indique un remplacement par libellé sans identifiant stable ; l’identité du snapshot d’origine n’est pas conservée.';
    const unresolved = { status: 'unresolved' as const, label, reason };
    return { material: unresolved, lot: clone(unresolved), materialId: null, identityKind: null, identityValue: null, reason };
  }
  if (text(hop.hopLotId)) {
    const id = `lot:${hop.hopLotId}`;
    const reference = physicalIdentity('lot', hop.hopLotId, 'snapshot-id-v1');
    return { material: { status: 'identified', reference }, lot: { status: 'identified', reference: clone(reference) },
      materialId: id, identityKind: 'lot', identityValue: hop.hopLotId };
  }
  if (text(hop.stockItemRef)) {
    const reference = physicalIdentity('stock', hop.stockItemRef, 'snapshot-id-v1');
    const unresolved = { status: 'unresolved' as const, label: text(hop.name) ? hop.name : hop.stockItemRef,
      reason: 'Le snapshot relie un stock exact, mais ne désigne pas un lot explicite.' };
    return { material: { status: 'identified', reference }, lot: unresolved, materialId: `stock:${hop.stockItemRef}`,
      identityKind: 'stock', identityValue: hop.stockItemRef };
  }
  if (text(hop.hopVarietyId)) {
    const reference = physicalIdentity('variety', hop.hopVarietyId, 'snapshot-id-v1');
    const unresolved = { status: 'unresolved' as const, label: text(hop.name) ? hop.name : hop.hopVarietyId,
      reason: 'Le snapshot identifie la variété mais pas le lot physique.' };
    return { material: { status: 'identified', reference }, lot: unresolved, materialId: `variety:${hop.hopVarietyId}`,
      identityKind: 'variety', identityValue: hop.hopVarietyId };
  }
  const label = text(hop.name) ? hop.name : 'Houblon du snapshot';
  const reason = 'Le snapshot ne fournit aucun identifiant stable de matière ; le nom seul ne qualifie pas l’identité physique.';
  const unresolved = { status: 'unresolved' as const, label, reason };
  return { material: unresolved, lot: clone(unresolved), materialId: null, identityKind: null, identityValue: null, reason };
}

function candidateMatches(candidate: HopDecisionMaterial, identity: ReturnType<typeof factMaterialIdentity>, hop: PlainRecord): boolean {
  if (!identity.materialId || !identity.identityValue) return false;
  const candidateVarietyId = candidate.variety?.id ?? candidate.lot?.varietyId;
  if (text(hop.hopVarietyId) && candidateVarietyId && candidateVarietyId !== hop.hopVarietyId) return false;
  if (identity.identityKind === 'lot') {
    if (candidate.lot?.id !== identity.identityValue && candidate.id !== identity.materialId) return false;
    if (text(hop.stockItemRef)) {
      const candidateStock = candidate.stockItemRef ?? candidate.lot?.stockItemRef;
      if (candidateStock && candidateStock !== hop.stockItemRef) return false;
    }
    return true;
  }
  if (identity.identityKind === 'stock') {
    const candidateStock = candidate.stockItemRef ?? candidate.lot?.stockItemRef;
    return candidate.id === identity.materialId || candidateStock === identity.identityValue;
  }
  if (identity.identityKind === 'variety') {
    const candidateVariety = candidate.variety?.id ?? candidate.lot?.varietyId;
    return candidate.id === identity.materialId || candidateVariety === identity.identityValue;
  }
  return false;
}

function modelMaterialSignature(material: HopDecisionMaterial): string {
  const { id: _id, name: _name, availableGrams: _availableGrams, ...facts } = material;
  return hash('brewing-observed-model-material-v1', facts);
}

function modelMaterialFor(hop: PlainRecord, identity: ReturnType<typeof factMaterialIdentity>, candidates: HopDecisionMaterial[]): HopDecisionMaterial | null {
  if (!identity.materialId || !identity.identityValue) return null;
  const matches = candidates.filter(row => candidateMatches(row, identity, hop));
  const distinct = [...new Map(matches.map(row => [modelMaterialSignature(row), row])).values()];
  if (distinct.length === 1) return { ...clone(distinct[0]), id: identity.materialId };
  // A stable source ID remains usable as evidence, while missing/ambiguous catalogue facts stay unresolved for calculation.
  if (matches.length > 1) return { id: identity.materialId, name: text(hop.name) ? hop.name : identity.identityValue, form: 'unknown' };
  return { id: identity.materialId, name: text(hop.name) ? hop.name : identity.identityValue, form: 'unknown' };
}

function contextMaterials(context: BrewerContext, supplied: HopDecisionMaterial[] | undefined): HopDecisionMaterial[] {
  const rows: HopDecisionMaterial[] = [];
  if (Array.isArray(supplied)) rows.push(...clone(supplied));
  const index = context.hopIndex;
  if (index && Array.isArray(index.varieties) && Array.isArray(index.lots)) {
    const validVarieties = index.varieties.filter(row => record(row) && text(row.id) && text(row.name));
    const validLots = index.lots.filter(row => record(row) && text(row.id) && text(row.name) && text(row.varietyId));
    const varieties = new Map(validVarieties.map(row => [row.id, row]));
    for (const variety of validVarieties) rows.push({ id: `variety:${variety.id}`, name: variety.name, form: variety.form, variety: clone(variety) });
    for (const lot of validLots) rows.push({ id: `lot:${lot.id}`, name: lot.name, form: lot.form, lot: clone(lot),
      ...(varieties.has(lot.varietyId) ? { variety: clone(varieties.get(lot.varietyId)!) } : {}),
      ...(lot.stockItemRef ? { stockItemRef: lot.stockItemRef } : {}) });
  }
  return rows;
}

function modelContextFromSnapshot(snapshot: RecipeSnapshot, sourceSnapshotReference: string): BrewingObservationModelContext | null {
  if (!finite(snapshot.volumeL) || snapshot.volumeL <= 0 || snapshot.nolo?.enabled) return null;
  const yeast: PlainRecord = record(snapshot.yeast) ? snapshot.yeast : {};
  const fermentation = Array.isArray(snapshot.fermentation) ? snapshot.fermentation.filter(record).map(step => ({
    ...(text(step.kind) ? { kind: step.kind } : {}), ...(text(step.name) ? { name: step.name } : {}),
    ...(text(step.note) ? { note: step.note } : {}), ...(finite(step.tempC) ? { tempC: step.tempC } : {}),
    ...(finite(step.days) && step.days >= 0 ? { days: step.days } : {}),
  })) : [];
  const source = { title: 'Snapshot de recette du batch', author: 'Recette figée au lancement', year: null,
    kind: 'judgment' as const, reference: sourceSnapshotReference,
    locator: 'Hypothèses de formulation du snapshot; elles ne sont pas des mesures réalisées.' };
  return { input: { volumeL: snapshot.volumeL, yeastId: text(yeast.hopIndexId) ? yeast.hopIndexId : null,
    ...(finite(yeast.pitchTempC) ? { pitchTempC: yeast.pitchTempC } : {}), fermentation }, origin: 'declaredHypothesis', source,
    explanation: 'Volume, souche, température d’ensemencement et paliers viennent du snapshot de recette comme hypothèses de calcul, jamais comme faits historiques réalisés.' };
}

function timingFromSnapshot(hop: PlainRecord): BrewingObservedHopBinding['timing'] | null {
  if (hop.stage === 'firstWort' || hop.stage === 'boil' || hop.stage === 'whirlpool') return hop.stage;
  if (hop.stage === 'dryHop' && ['fermentation', 'postFermentation'].includes(hop.aromaTiming)) return hop.aromaTiming;
  return null;
}

function quantityFromJournal(actual: PlainRecord, additionKey: string, qualification: BrewingObservedLegacyHopUnitQualificationV1 | undefined): {
  quantity: BrewingObservedQuantityV1;
  epistemicStatus: 'observed' | 'reported';
  provenanceSuffix?: string;
  reason?: string;
} {
  const value = actual.amount;
  if (!finite(value) || value < 0) return { quantity: { status: 'unknown', reason: 'Le relevé journalisé ne fournit pas une quantité réelle finie et non négative.' }, epistemicStatus: 'reported', reason: 'Quantité absente ou invalide; aucune masse prévue ne la remplace.' };
  if (typeof actual.unit === 'string' && actual.unit.length > 0) {
    let convertible = false;
    try { convertible = Units.convert(value, actual.unit, 'g') !== null; } catch { convertible = false; }
    return convertible
      ? { quantity: { status: 'known', value, unit: actual.unit }, epistemicStatus: 'reported' }
      : { quantity: { status: 'unitUnknown', value, rawUnit: actual.unit, reason: 'L’unité brute du journal n’est pas convertible en masse.' }, epistemicStatus: 'reported', reason: 'Valeur et unité brute conservées sans conversion.' };
  }
  if (typeof actual.unit === 'string') {
    return { quantity: { status: 'unitUnknown', value, rawUnit: actual.unit, reason: 'Le champ d’unité journalisé est vide.' },
      epistemicStatus: 'reported', reason: 'Unité vide conservée comme inconnue.' };
  }
  if (actual.unit === undefined && qualification?.unit === 'g' && qualification.additionKeys.includes(additionKey)) {
    return { quantity: { status: 'known', value, unit: 'g' }, epistemicStatus: 'reported',
      provenanceSuffix: `Convention explicitement qualifiée: ${qualification.reason}` };
  }
  return { quantity: { status: 'unitUnknown', value, rawUnit: actual.unit === undefined ? '(unité absente)' : String(actual.unit),
    reason: 'Le journal historique ne porte pas d’unité; aucune conversion automatique en grammes.' }, epistemicStatus: 'reported',
    reason: 'Quantité brute conservée avec unité inconnue.' };
}

function refusalResult(context: BrewerContext, source: BrewingObservedBatchSourceV1 | null, code: string, message: string,
  sourceSnapshot: RecipeSnapshot | null = null, sourceSnapshotReference: string | null = null,
  sourceSnapshotRaw?: unknown): PreparedBrewingObservedContextV1 {
  const sourceJournal = context?.journal === undefined || context?.journal === null ? null : clone(context.journal);
  const result: Omit<PreparedBrewingObservedContextV1, 'reference'> = {
    format: 'brewing-observed-context-v1', status: 'refused', source,
    observedBatchId: text(context?.batch?.id) ? context.batch.id : null, sourceSnapshot, sourceSnapshotReference,
    sourceJournal, sourceJournalReference: sourceJournal ? hash('brewing-observed-journal-source-v1', sourceJournal) : null,
    ...(sourceSnapshotRaw !== undefined ? { mutableContextRecipePreserved: clone(sourceSnapshotRaw) } : {}),
    stateInput: null, state: null, modelContext: null, hopScope: null, materials: [], proposedBindings: [], observedHopInput: null,
    unmapped: [], limitations: [], refusal: { code, message },
  };
  return { ...result, reference: hash('brewing-observed-context-v1', result) };
}

/** Derives a historical physical-state input only from a canonical batch snapshot and its journal. */
export function prepareBrewingObservedContext(context: BrewerContext, options: PrepareBrewingObservedContextOptions): PreparedBrewingObservedContextV1 {
  if (!record(context) || !record(options) || !exactKeys(options, ['source', 'asOf', 'knowledgeAsOf', 'contactAttestations', 'coverageAttestations', 'sample', 'legacyHopUnitQualification', 'hopScope', 'materials'])) {
    return refusalResult(context as BrewerContext, null, 'invalidRequest', 'Contexte ou options d’ancrage invalides.');
  }
  if (!validateSource(options.source)) return refusalResult(context, null, 'invalidSourceScope', 'La source doit désigner explicitement un batch par son identifiant.');
  const source = clone(options.source);
  const actualBatchId = text(context.batch?.id) ? context.batch.id : null;
  if (!actualBatchId) return refusalResult(context, source, 'batchRequired', 'Aucun batch canonique identifié dans BrewerContext; une recette seule ne crée pas une identité de bière.',
    null, null, context.recipe);
  const snapshotRaw = context.batch?.recipeSnapshot;
  if (actualBatchId !== source.id) {
    const preservedSnapshot = snapshotIsUsable(snapshotRaw) ? clone(snapshotRaw) : null;
    return refusalResult(context, source, 'sourceBatchMismatch', `La source demandée ${source.id} ne correspond pas au batch chargé ${actualBatchId}.`,
      preservedSnapshot, preservedSnapshot ? hash('brewing-observed-recipe-snapshot-v1', preservedSnapshot) : null, context.recipe);
  }
  if (!snapshotIsUsable(snapshotRaw)) return refusalResult(context, source, 'recipeSnapshotRequired', 'Le batch ne porte pas de recipeSnapshot immuable exploitable; la recette mutable ou recipeRef ne peut pas le remplacer.', null, null, context.recipe);
  if (!instant(options.asOf) || !instant(options.knowledgeAsOf)) return refusalResult(context, source, 'invalidCutoff', 'Les coupures asOf et knowledgeAsOf doivent être des instants ISO explicites.', snapshotRaw, hash('brewing-observed-recipe-snapshot-v1', snapshotRaw));
  const readAt = isoFromMillis(context.now);
  if (!readAt) return refusalResult(context, source, 'invalidReadTime', 'BrewerContext.now ne fournit pas un instant de lecture valide.', snapshotRaw, hash('brewing-observed-recipe-snapshot-v1', snapshotRaw));
  if (Date.parse(options.asOf) > Date.parse(readAt)) return refusalResult(context, source, 'futurePhysicalCutoff', 'La coupure physique est postérieure à la lecture disponible; une projection future doit utiliser son contrat séparé.', snapshotRaw, hash('brewing-observed-recipe-snapshot-v1', snapshotRaw));

  const sourceSnapshot = clone(snapshotRaw);
  const sourceSnapshotReference = hash('brewing-observed-recipe-snapshot-v1', sourceSnapshot);
  const sourceJournal = context.journal === undefined || context.journal === null ? null : clone(context.journal);
  const sourceJournalReference = sourceJournal ? hash('brewing-observed-journal-source-v1', sourceJournal) : null;
  const sourceReadAfterKnowledgeCutoff = Date.parse(readAt) > Date.parse(options.knowledgeAsOf);
  if (options.sample && (!record(options.sample) || !exactKeys(options.sample, ['id', 'version', 'sourceBatchId', 'collection', 'continuity'])
    || !text(options.sample.id) || !text(options.sample.version) || options.sample.sourceBatchId !== actualBatchId
    || !validateTimeEvidence(options.sample.collection) || options.asOf !== options.sample.collection.effectiveAt
    || options.sample.continuity !== undefined && !Array.isArray(options.sample.continuity))) {
    return refusalResult(context, source, 'sampleSourceMismatch', 'Le prélèvement doit porter une identité et une filiation explicite vers ce batch; asOf doit être son instant de collecte.', sourceSnapshot, sourceSnapshotReference);
  }
  if (options.contactAttestations !== undefined && !Array.isArray(options.contactAttestations)) {
    return refusalResult(context, source, 'invalidContactAttestation', 'Les attestations de contact doivent être fournies dans une liste.', sourceSnapshot, sourceSnapshotReference);
  }
  if (options.coverageAttestations !== undefined && !Array.isArray(options.coverageAttestations)) {
    return refusalResult(context, source, 'invalidCoverageAttestation', 'Les attestations de complétude doivent être fournies dans une liste.', sourceSnapshot, sourceSnapshotReference);
  }
  if (options.materials !== undefined && (!Array.isArray(options.materials) || options.materials.some(row => !record(row) || !text(row.id) || !text(row.name)))) {
    return refusalResult(context, source, 'invalidMaterials', 'Les matières de modèle doivent avoir des identifiants exacts et des libellés.', sourceSnapshot, sourceSnapshotReference);
  }
  const beerIdentity = physicalIdentity('batch', actualBatchId, 'batch-identity-v1');
  const subject = options.sample
    ? { kind: 'sample' as const, identity: { id: `sample:${options.sample.id}`, version: options.sample.version,
        contentReference: hash('brewing-observed-sample-identity-v1', { sourceBatchId: actualBatchId, id: options.sample.id,
          version: options.sample.version, collectedAt: options.sample.collection?.effectiveAt }) },
      sourceBeer: beerIdentity, collection: clone(options.sample.collection) }
    : { kind: 'beer' as const, identity: beerIdentity };
  const limitations: string[] = [
    'Le journal ne conserve pas une date originale d’écriture par ajout; recordedAt des faits dérivés est la lecture BrewerContext.now.',
    'Les versions source par ajout ne sont pas fournies; version 1 désigne cette représentation dérivée, non un compteur historique du journal.',
  ];
  if (context.localJournal) limitations.push('Le journal local non confirmé est conservé hors source physique et ignoré pour cette résolution.');
  if (Date.parse(options.knowledgeAsOf) < Date.parse(readAt)) limitations.push('knowledgeAsOf précède le snapshot lu; les faits dont recordedAt vaut context.now restent notYetKnown à cette coupe faute d’historique d’écriture.');
  if (Date.parse(options.knowledgeAsOf) > Date.parse(readAt)) limitations.push('knowledgeAsOf dépasse la dernière lecture BrewerContext; les corrections postérieures au snapshot ne sont pas connues faute d’historique d’écriture.');
  if (!sourceJournal) limitations.push('Journal absent; aucun ajout n’est déduit du snapshot de recette. La portée passée reste inconnue.');
  if (!Array.isArray(sourceSnapshot.hops)) return refusalResult(context, source, 'snapshotHopsMissing', 'Le recipeSnapshot ne contient pas une liste d’ajouts exploitable.', sourceSnapshot, sourceSnapshotReference);

  const qualification = options.legacyHopUnitQualification;
  const qualifiedKeys = new Set<string>();
  if (qualification) {
    if (!record(qualification) || !exactKeys(qualification, ['additionKeys', 'unit', 'reason', 'provenance']) || qualification.unit !== 'g'
      || !Array.isArray(qualification.additionKeys) || !qualification.additionKeys.every(text) || !text(qualification.reason)
      || !record(qualification.provenance) || !exactKeys(qualification.provenance, ['kind', 'reference', 'description', 'author'])
      || !text(qualification.provenance.kind) || !text(qualification.provenance.reference) || !text(qualification.provenance.description)
      || qualification.provenance.author !== undefined && !text(qualification.provenance.author)) {
      return refusalResult(context, source, 'invalidLegacyUnitQualification', 'La convention historique d’unité doit être explicite, sourcée et limitée à des clés de journal.', sourceSnapshot, sourceSnapshotReference);
    }
    for (const key of qualification.additionKeys) qualifiedKeys.add(key);
  }
  const attestationByKey = new Map<string, BrewingObservedContactAttestationV1>();
  for (const value of options.contactAttestations ?? []) {
    if (!record(value) || !exactKeys(value, ['additionKey', 'kind', 'evidence', 'epistemicStatus']) || !text(value.additionKey)
      || !['activeThrough', 'ended'].includes(value.kind) || !validateTimeEvidence(value.evidence)
      || !['observed', 'reported'].includes(value.epistemicStatus) || attestationByKey.has(value.additionKey)) {
      return refusalResult(context, source, 'invalidContactAttestation', 'Une attestation de contact est invalide ou répétée; la continuité n’est pas inférée.', sourceSnapshot, sourceSnapshotReference);
    }
    attestationByKey.set(value.additionKey, clone(value));
  }

  const unmapped: BrewingObservedContextUnmappedV1[] = [];
  const addUnmapped = (sourceKey: string, code: string, reason: string, raw: unknown) => unmapped.push({ sourceKey, code, reason, raw: clone(raw) });
  const facts: BrewingObservedFactV1[] = [];
  const contacts: BrewingObservedContactV1[] = [];
  const proposedBindings: BrewingObservedHopBinding[] = [];
  const contactAttestationsUsed = new Set<string>();
  const additionsByKey = new Map<string, PlainRecord>();
  const invalidJournalRows: Array<[string, unknown]> = [];
  if (record(sourceJournal?.additions)) {
    for (const [key, raw] of Object.entries(sourceJournal.additions)) if (key.startsWith('hop-')) {
      if (record(raw)) additionsByKey.set(key, raw);
      else invalidJournalRows.push([key, raw]);
    }
  } else if (sourceJournal) limitations.push('Le journal ne contient pas de map additions exploitable; aucune absence n’est interprétée comme zéro.');
  for (const [key, raw] of invalidJournalRows) addUnmapped(key, 'invalidJournalAddition', 'La ligne du journal est conservée mais ne peut pas fournir un relevé de houblon structuré.', raw);

  const catalogCandidates = contextMaterials(context, options.materials);
  const outputMaterials = new Map<string, HopDecisionMaterial>();
  const journalReadProvenance = (additionKey: string, suffix?: string): BrewingObservedProvenanceV1 => ({
    kind: 'brewerContextDerivedRead', reference: hash('brewing-observed-journal-event-read-v1', {
      batchId: actualBatchId, additionKey, sourceSnapshotReference, sourceJournalReference, readAt,
    }),
    description: `Ajout effectif dérivé de ${additionKey}; doneAt fournit effectiveAt. ${suffix ? `${suffix}. ` : ''}La date originale d’écriture est absente; recordedAt est la lecture contextuelle ${readAt}.`,
    author: 'BrewerContext batch',
  });

  for (const [key, actual] of additionsByKey) {
    const match = /^hop-(0|[1-9]\d*)$/.exec(key);
    if (!match) { addUnmapped(key, 'invalidHopJournalKey', 'Clé de houblon non canonique; aucune association par libellé.', actual); continue; }
    const index = Number(match[1]);
    const sourceHop = sourceSnapshot.hops[index];
    if (!record(sourceHop)) { addUnmapped(key, 'snapshotHopMissing', 'La clé du journal ne désigne pas une ligne du recipeSnapshot du batch.', actual); continue; }
    const effectiveAt = isoFromMillis(actual.doneAt);
    if (!effectiveAt) { addUnmapped(key, 'additionNotEffectivelyDated', 'La ligne de journal ne porte pas un doneAt valide; amount et poids prévu ne prouvent pas une réalisation.', actual); continue; }
    const factId = `batch:${actualBatchId}:addition:${key}`;
    const identity = factMaterialIdentity(sourceHop, actual);
    const mass = quantityFromJournal(actual, key, qualification);
    const derivedProvenance = journalReadProvenance(key, mass.provenanceSuffix);
    facts.push({ kind: 'materialAdded', id: factId, version: 1, supersedesVersion: null, subjectReference: beerIdentity,
      dependencyId: 'hopMaterials', effectiveAt, recordedAt: readAt, epistemicStatus: mass.epistemicStatus, provenance: derivedProvenance,
      material: identity.material, lot: identity.lot, quantity: mass.quantity });
    if (mass.reason) limitations.push(`${key}: ${mass.reason}`);
    if (identity.reason) {
      limitations.push(`${key}: ${identity.reason}`);
      addUnmapped(key, 'materialIdentityUnresolved', identity.reason, actual);
    }
    if (!mass.provenanceSuffix && actual.unit === undefined && mass.quantity.status === 'unitUnknown') {
      limitations.push(`${key}: unité absente conservée comme inconnue; aucune interprétation en grammes sans qualification explicite.`);
    }

    const contactId = `batch:${actualBatchId}:contact:${key}`;
    const attestation = attestationByKey.get(key);
    if (attestation) contactAttestationsUsed.add(key);
    const contact: BrewingObservedContactV1 = { id: contactId, version: 1, supersedesVersion: null, subjectReference: beerIdentity,
      dependencyId: 'hopContact', material: clone(identity.material), lot: clone(identity.lot),
      started: { effectiveAt, recordedAt: readAt, provenance: journalReadProvenance(key) },
      ...(attestation ? { [attestation.kind]: clone(attestation.evidence) } : {}), epistemicStatus: attestation?.epistemicStatus ?? 'reported' };
    contacts.push(contact);
    if (!attestation) limitations.push(`${key}: doneAt établit le début de contact, pas sa continuité; contact conservé comme inconnu sans attestation activeThrough/ended.`);

    const materialId = identity.materialId;
    const timing = timingFromSnapshot(sourceHop);
    if (identity.material.status === 'identified' && materialId && timing) {
      const material = modelMaterialFor(sourceHop, identity, catalogCandidates);
      if (material) {
        const prior = outputMaterials.get(materialId);
        if (prior && modelMaterialSignature(prior) !== modelMaterialSignature(material)) {
          outputMaterials.set(materialId, { id: materialId, name: text(sourceHop.name) ? sourceHop.name : materialId, form: 'unknown' });
          limitations.push(`${key}: références de catalogue contradictoires pour ${materialId}; matière gardée sans paramètres calculables.`);
        } else if (!prior) outputMaterials.set(materialId, material);
        // References are finalized after resolve; this binding is completed below.
        proposedBindings.push({ additionId: key, factReference: factId, contactReference: contactId, materialId,
          timing, temperatureC: finite(sourceHop.aromaTemperatureC) ? sourceHop.aromaTemperatureC
            : finite(sourceHop.tempC) ? sourceHop.tempC : null,
          matrixId: text(sourceSnapshot.hopMatrixId) ? sourceSnapshot.hopMatrixId : null,
          explanation: 'Timing, température et matrice proposés depuis le snapshot de recette; paramètres de calcul hypothétiques, pas des conditions réalisées.' });
      }
    } else if (identity.material.status === 'identified' && !timing) {
      addUnmapped(key, 'modelTimingUnresolved', 'Identité réalisée conservée, mais le timing du modèle est absent du snapshot; aucune phase n’est inventée.', actual);
    }
  }

  for (let index = 0; index < sourceSnapshot.hops.length; index++) {
    const key = `hop-${index}`;
    if (!additionsByKey.has(key)) addUnmapped(key, 'noRealizedJournalRow', 'Le snapshot contient une ligne prévue sans relevé journalisé daté; elle ne devient pas un fait réalisé.', sourceSnapshot.hops[index]);
  }
  for (const [key, value] of attestationByKey) if (!contactAttestationsUsed.has(key)) {
    addUnmapped(key, 'orphanContactAttestation', 'L’attestation ne cible pas une ligne de journal effectivement datée de ce batch.', value);
  }

  const coverage: BrewingObservedCoverageV1[] = [];
  const hopJournalHasUnresolvedRows = !record(sourceJournal?.additions) || unmapped.some(row =>
    ['invalidHopJournalKey', 'invalidJournalAddition', 'snapshotHopMissing', 'additionNotEffectivelyDated'].includes(row.code));
  for (const row of options.coverageAttestations ?? []) {
    if (!record(row) || !exactKeys(row, ['id', 'version', 'supersedesVersion', 'dependencyId', 'fromAt', 'throughAt', 'status', 'recordedAt', 'provenance'])) {
      addUnmapped('coverage', 'invalidCoverageAttestation', 'Déclaration de complétude ignorée car sa structure ne respecte pas le contrat.', row); continue;
    }
    if (sourceReadAfterKnowledgeCutoff) {
      addUnmapped('coverage', 'coverageNotAppliedToOlderKnowledgeCutoff', 'La complétude ne peut pas qualifier le contenu d’un journal lu après knowledgeAsOf sans historique des écritures.', row);
      continue;
    }
    if (row.dependencyId === 'hopMaterials' && hopJournalHasUnresolvedRows) {
      addUnmapped('coverage', 'coverageNotAppliedToUnresolvedJournal', 'La portée matière ne rend pas exploitable une ligne de journal non datée, mal formée ou sans ligne de snapshot correspondante.', row);
      continue;
    }
    coverage.push({ ...clone(row), subjectReference: beerIdentity });
  }

  const sampleIdentity = subject.kind === 'sample' ? subject.identity : null;
  const sampleContinuity = options.sample?.continuity?.map(row => ({ ...clone(row), sampleReference: sampleIdentity! })) ?? [];
  const knowledgeReference: BrewingObservedIdentityV1 = {
    id: `brewer-context:batch:${actualBatchId}`, version: `derived-read:${readAt}`,
    contentReference: hash('brewing-observed-knowledge-read-v1', {
      batchId: actualBatchId, readAt, sourceSnapshotReference, sourceJournalReference,
      contactAttestations: options.contactAttestations ?? [], coverageAttestations: options.coverageAttestations ?? [],
      sample: options.sample ?? null, legacyHopUnitQualification: options.legacyHopUnitQualification ?? null,
    }),
  };
  const candidateInput: BrewingObservedStateInputV1 = {
    format: BREWING_OBSERVED_STATE_INPUT_VERSION, subject: clone(subject), asOf: options.asOf, knowledgeAsOf: options.knowledgeAsOf,
    knowledgeReference, facts, contacts, coverage, sampleContinuity,
  };
  let stateInput: BrewingObservedStateInputV1, state: BrewingObservedStateV1;
  try {
    stateInput = createBrewingObservedStateInput(candidateInput);
    state = resolveBrewingObservedState(stateInput);
  } catch (error) {
    return refusalResult(context, source, 'sourceEvidenceInvalid', `Les faits source ne forment pas une entrée d’état valide : ${(error as Error).message}`,
      sourceSnapshot, sourceSnapshotReference);
  }

  const factReferences = new Map(state.factDispositions.map(row => [`${row.id}@${row.version}`, row]));
  const contactReferences = new Map(state.contactDispositions.map(row => [`${row.id}@${row.version}`, row]));
  const bound = proposedBindings.flatMap(binding => {
    const fact = factReferences.get(`${binding.factReference}@1`);
    const contactId = binding.contactReference;
    const contact = contactReferences.get(`${contactId}@1`);
    if (!fact || fact.disposition !== 'effective' || !contact || contact.disposition !== 'effective') return [];
    return [{ ...binding, factReference: fact.reference, contactReference: contact.reference }];
  });
  const modelContext = modelContextFromSnapshot(sourceSnapshot, sourceSnapshotReference);
  if (!modelContext) limitations.push(sourceSnapshot.nolo?.enabled
    ? 'Contexte modèle NOLO absent ou hors de ce raccord; l’état physique reste résolu sans entrée modèle.'
    : 'Volume cible du snapshot absent ou invalide; aucune entrée de modèle ne reçoit un zéro de remplacement.');
  let observedHopInput: BrewingObservedHopInput | null = null;
  let hopScope: BrewingObservedHopScope | null = options.hopScope ? clone(options.hopScope) : null;
  if (sourceReadAfterKnowledgeCutoff) {
    // The current snapshot has no per-row write history; the resolver marks its derived events notYetKnown.
    // Do not hand an empty realized prefix to the model as if the old cutoff were complete.
    limitations.push('Le snapshot courant est postérieur à knowledgeAsOf et le journal ne fournit pas son historique d’écriture; aucune entrée de modèle à cette coupe n’est préparée.');
  } else if (hopScope && modelContext) {
    try {
      observedHopInput = buildBrewingObservedHopInput({ state, scope: hopScope, context: modelContext, bindings: bound,
        materials: [...outputMaterials.values()] });
      if (observedHopInput.status === 'unknown') limitations.push(...observedHopInput.issues.map(issue => issue.message));
    } catch (error) {
      limitations.push(`Liaison vers l’entrée de modèle non préparée : ${(error as Error).message}`);
      hopScope = null;
    }
  } else if (!hopScope) limitations.push('Portée de dépendances du modèle absente; aucune complétude n’est supposée.');

  const result: Omit<PreparedBrewingObservedContextV1, 'reference'> = {
    format: 'brewing-observed-context-v1', status: 'prepared', source, observedBatchId: actualBatchId,
    sourceSnapshot, sourceSnapshotReference, sourceJournal, sourceJournalReference, stateInput, state, modelContext, hopScope,
    materials: [...outputMaterials.values()], proposedBindings: bound, observedHopInput, unmapped, limitations: [...new Set(limitations)],
  };
  return { ...result, reference: hash('brewing-observed-context-v1', result) };
}
