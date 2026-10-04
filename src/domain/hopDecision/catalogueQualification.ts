import { hopMeasurementError, type HopAnalyte, type HopMeasurement, type HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopDecisionMaterial } from './types';

/** Qualification is a projection over raw catalogue variants; it never mutates a seed or saved row. */
export const HOP_CATALOGUE_QUALIFICATION_VERSION = 'hop-catalogue-qualification-v1' as const;

export type HopCatalogueRecordScope = 'variety' | 'lot' | 'product' | 'assignment';
export type HopCatalogueOriginKind = 'seed' | 'saved' | 'backupImport' | 'assignment';
export type HopCatalogueObservationLocation = 'declaredAnalysis' | 'lot.analysis' | 'variety.analysis';
export type HopQualificationBasis = Exclude<HopMeasurement['basis'], 'unknown'>;
export type HopBasisDenominator = 'sampleMass' | 'sampleWetMass' | 'sampleDryMass' | 'productMass' | 'alphaAcids' | 'totalOil' | 'beerVolume';

export interface HopCatalogueImportFingerprint {
  packPath: string;
  packSha256: string;
  importerPath: string;
  importerSha256: string;
  recordId: string;
  /** Content references computed before the old importer-assigned basis was removed. */
  observationFingerprints: string[];
}

export interface HopCatalogueOrigin {
  kind: HopCatalogueOriginKind;
  packPath?: string;
  packSha256?: string;
  importerPath?: string;
  importerSha256?: string;
  importFingerprint?: HopCatalogueImportFingerprint;
  recordedAt?: string;
}

export interface HopCatalogueVariant {
  /** Unique source version in this supplied snapshot; never derived from its display name. */
  variantId: string;
  scope: HopCatalogueRecordScope;
  recordId: string;
  origin: HopCatalogueOrigin;
  material: HopDecisionMaterial;
  /** Unmapped scientific facts stay raw and are never promoted into HopMeasurement here. */
  supplementalFacts?: HopCatalogueSupplementalFact[];
}

export interface HopCatalogueSupplementalFact {
  factId: string;
  analyteId: string;
  rawLabel: string;
  rawValue: string | number | null;
  rawUnit?: string | null;
  rawDenominator?: string | null;
  source: HopSource;
  locator?: string;
}

export interface HopBasisEvidence {
  evidenceId: string;
  variantId: string;
  scope: HopCatalogueRecordScope | 'declaration';
  recordId: string;
  location: HopCatalogueObservationLocation;
  observationFingerprint: string;
  basis: HopQualificationBasis;
  denominator: HopBasisDenominator;
  evidenceType: 'sourceStatement' | 'userChoice';
  /** Must reference the same primary source as the raw observation; no source kind is trusted alone. */
  sourceReference: string;
  sourceLocator: string;
  /** Required for a user choice; this is structured intent, not a keyword search in notes. */
  declarationId?: string;
  declaredBy?: string;
  declaredAt?: string;
  reason?: string;
}

export type HopObservationQualification =
  | 'qualifiedPhysical'
  | 'qualifiedDocumentary'
  | 'legacyMechanicalDefault'
  | 'unqualifiedAsIs'
  | 'unknownBasis'
  | 'unqualifiedBasis'
  | 'basisConflict'
  | 'invalidObservation';

export interface HopAlphaModelCandidate {
  analyte: 'alpha';
  rawRange?: { min: number; max: number };
  rawValue?: number;
  basis: HopMeasurement['basis'];
  source: HopSource;
  selected: false;
  requiresSelection: true;
  reason: string;
  recordKey: string;
  variantId: string;
  observationFingerprint: string;
  qualification: HopObservationQualification;
}

export interface HopQualifiedObservation {
  variantId: string;
  recordScope: HopCatalogueRecordScope | 'declaration';
  recordId: string;
  location: HopCatalogueObservationLocation;
  locationIndex: number;
  observationFingerprint: string;
  raw: HopMeasurement;
  qualification: HopObservationQualification;
  effectiveBasis: HopMeasurement['basis'];
  calculationDisposition: 'qualifiedBasisView' | 'documentaryOnly' | 'modelExplorationOnly' | 'notPassedToCalculationView';
  /** Safe copy only. An unqualified raw asIs measurement is rewritten to unknown or omitted. */
  calculationMeasurement?: HopMeasurement;
  modelCandidate?: HopAlphaModelCandidate;
  /** Linked declarations and source statements are retained even when they fail qualification. */
  evidence: HopBasisEvidence[];
  evidenceIds: string[];
  reasons: string[];
}

export interface HopFallbackBlockReason {
  analyte: HopAnalyte;
  variantId: string;
  location: 'declaredAnalysis' | 'lot.analysis';
  recordId: string;
  reason: string;
}

export interface HopQualifiedCalculationProjection {
  material: HopDecisionMaterial;
  /** Exclude these analytes from any lower-scope join after this projection. */
  fallbackBlockedAnalytes: HopAnalyte[];
  fallbackBlockReasons: HopFallbackBlockReason[];
}

export interface HopQualifiedCatalogueGroup {
  key: string;
  scope: HopCatalogueRecordScope;
  recordId: string;
  status: 'ready' | 'equivalentVariants' | 'collisionNeedsSelection' | 'selectionInvalid' | 'archivedTombstone';
  selectedVariantId: string | null;
  equivalentVariantIds: string[];
  /** Every original version and source survives, including losing/archived versions. */
  rawVariants: HopCatalogueVariant[];
  observations: HopQualifiedObservation[];
  supplementalFacts: Array<{ variantId: string; recordId: string; fact: HopCatalogueSupplementalFact; disposition: 'rawOnlyNotMapped' }>;
  /** Non-null only for one explicit choice or strictly equivalent calculation facts. */
  calculationMaterial: HopDecisionMaterial | null;
  calculationProjection: HopQualifiedCalculationProjection | null;
  /** Safe per-version projections; unresolved versions are alternatives, never an implicit winner. */
  calculationVariants: Array<{ variantId: string; material: HopDecisionMaterial; disposition: 'selected' | 'equivalent' | 'conditional' | 'archivedOnly'; fallbackBlockedAnalytes: HopAnalyte[]; fallbackBlockReasons: HopFallbackBlockReason[] }>;
  /** Intersection of safe facts when physical identity agrees; supports alpha-independent actions. */
  commonCalculationMaterial: HopDecisionMaterial | null;
  commonCalculationProjection: HopQualifiedCalculationProjection | null;
  commonCalculationReasons: string[];
  /** Block list for calculationProjection, or for the common view when no version was selected. */
  fallbackBlockedAnalytes: HopAnalyte[];
  fallbackBlockReasons: HopFallbackBlockReason[];
  blockers: string[];
}

export interface HopCatalogueQualificationInput {
  variants: HopCatalogueVariant[];
  basisEvidence?: HopBasisEvidence[];
  /** Explicit source-version choices, keyed by hopCatalogueRecordKey(). */
  selectedVariantByRecord?: Record<string, string>;
}

export interface HopCatalogueQualificationResult {
  version: typeof HOP_CATALOGUE_QUALIFICATION_VERSION;
  groups: HopQualifiedCatalogueGroup[];
  /** Model exploration is kept separate from physical observations and is never auto-selected here. */
  modelCandidates: HopAlphaModelCandidate[];
  limitations: string[];
}

/** The raw observation ref is stable across a basis edit; it is a content reference, not a security token. */
export function hopRawObservationReference(observation: HopMeasurement): string {
  const { basis: _basis, ...content } = observation;
  return `hop-raw-observation-v1:${JSON.stringify(canonical(content))}`;
}

export function hopCatalogueRecordKey(scope: HopCatalogueRecordScope, recordId: string): string {
  return JSON.stringify([scope, recordId]);
}

function canonical(value: any): any {
  return Array.isArray(value) ? value.map(canonical)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
      : value;
}

const denominatorByBasis: Record<HopQualificationBasis, HopBasisDenominator[]> = {
  asIs: ['sampleWetMass', 'productMass'],
  dryMatter: ['sampleDryMass'],
  oil: ['totalOil'],
  beer: ['beerVolume'],
};

/** Known mappings in the pre-correction source snapshot. These identify a mechanical default only. */
export const LEGACY_MECHANICAL_ASIS_RULES = [
  {
    id: 'hopsteiner-percent-asIs-v1', packPath: 'src/data/hopManufacturerBootstrap.json',
    packSha256: '090131a26e48d9e821e818b0c86a8e25f6e79518134c6033b8481d62177612c9',
    importerPath: 'scripts/scrape-hopsteiner.mjs',
    importerSha256: '94f5d0d9637e06d1c4a80a76fc4a1c8cc7a48258ff5a0782c16729060e970c4c',
    analytes: { alpha: 'percentMass', beta: 'percentMass', totalOil: 'ml100g' }, host: 'www.hopsteiner.de',
  },
  {
    id: 'beermaverick-percent-asIs-v1', packPath: 'src/data/hopBeerMaverickBootstrap.json',
    packSha256: 'e84a9e25f9ba8a8043ae0462894d5f8fb9353cfa2efb4dd355537d36ed639895',
    importerPath: 'scripts/scrape-hop-community.mjs',
    importerSha256: '92352492cfb24c4b7e4db42ca7f04526ea62fbc41bbdef0307c3ef82709f5601',
    analytes: { alpha: 'percentMass', beta: 'percentMass', totalOil: 'ml100g' }, host: 'beermaverick.com',
  },
] as const;

interface ObservationSlot {
  recordScope: HopCatalogueRecordScope | 'declaration';
  recordId: string;
  location: HopCatalogueObservationLocation;
  locationIndex: number;
  observation: HopMeasurement;
}

function observationSlots(variant: HopCatalogueVariant): ObservationSlot[] {
  const material = variant.material;
  return [
    ...(material.declaredAnalysis ?? []).map((observation, locationIndex) => ({
      recordScope: 'declaration' as const, recordId: material.id, location: 'declaredAnalysis' as const, locationIndex, observation,
    })),
    ...(material.lot?.analysis ?? []).map((observation, locationIndex) => ({
      recordScope: 'lot' as const, recordId: material.lot!.id, location: 'lot.analysis' as const, locationIndex, observation,
    })),
    ...(material.variety?.analysis ?? []).map((observation, locationIndex) => ({
      recordScope: 'variety' as const, recordId: material.variety!.id, location: 'variety.analysis' as const, locationIndex, observation,
    })),
  ];
}

function denominatorMatchesBasis(basis: HopQualificationBasis, denominator: HopBasisDenominator): boolean {
  return denominatorByBasis[basis].includes(denominator);
}

function evidenceMatchesVariant(evidence: HopBasisEvidence, variant: HopCatalogueVariant, slot: ObservationSlot, observationFingerprint: string): boolean {
  return evidence.variantId === variant.variantId && evidence.scope === slot.recordScope && evidence.recordId === slot.recordId
    && evidence.location === slot.location && evidence.observationFingerprint === observationFingerprint
    && evidence.sourceReference === slot.observation.source.reference;
}

function validEvidence(evidence: HopBasisEvidence, slot: ObservationSlot): boolean {
  if (!evidence.evidenceId.trim() || !['asIs', 'dryMatter', 'oil', 'beer'].includes(String(evidence.basis))
    || !evidence.sourceLocator.trim()
    || !denominatorMatchesBasis(evidence.basis, evidence.denominator)) return false;
  if (evidence.evidenceType === 'userChoice') {
    return !!evidence.declarationId?.trim() && !!evidence.declaredBy?.trim() && !!evidence.reason?.trim()
      && !!evidence.declaredAt && Number.isFinite(Date.parse(evidence.declaredAt));
  }
  return evidence.evidenceType === 'sourceStatement';
}

function legacyMechanicalRule(variant: HopCatalogueVariant, slot: ObservationSlot, fingerprint: string) {
  const provenance = variant.origin.importFingerprint;
  if (!provenance || !['saved', 'backupImport'].includes(variant.origin.kind)
    || provenance.recordId !== slot.recordId || !provenance.observationFingerprints.includes(fingerprint)) return null;
  for (const rule of LEGACY_MECHANICAL_ASIS_RULES) {
    const expectedUnit = rule.analytes[slot.observation.analyte as keyof typeof rule.analytes];
    if (provenance.packPath !== rule.packPath || provenance.packSha256 !== rule.packSha256
      || provenance.importerPath !== rule.importerPath || provenance.importerSha256 !== rule.importerSha256
      || !expectedUnit || expectedUnit !== slot.observation.unit || slot.observation.basis !== 'asIs') continue;
    try { if (new URL(slot.observation.source.reference).hostname !== rule.host) continue; } catch { continue; }
    return rule;
  }
  return null;
}

function isArchived(variant: HopCatalogueVariant): boolean {
  return !!variant.material.variety?.archived || !!variant.material.lot?.archived;
}

function identityMatchesScope(variant: HopCatalogueVariant): boolean {
  const identity = variant.scope === 'variety' ? variant.material.variety?.id
    : variant.scope === 'lot' ? variant.material.lot?.id
      : variant.scope === 'product' ? variant.material.product?.id
        : variant.material.id;
  return identity === variant.recordId;
}

function safeUnknownBasisCopy(observation: HopMeasurement): HopMeasurement | null {
  const copy = { ...structuredClone(observation), basis: 'unknown' as const };
  return hopMeasurementError(copy) ? null : copy;
}

function makeModelCandidate(variant: HopCatalogueVariant, slot: ObservationSlot, fingerprint: string, qualification: HopObservationQualification) {
  const observation = slot.observation;
  if (hopMeasurementError(observation) || observation.analyte !== 'alpha' || observation.unit !== 'percentMass'
    || !['point', 'range'].includes(observation.kind)) return undefined;
  const rawRange = observation.range ? { ...observation.range } : undefined;
  return {
    analyte: 'alpha' as const,
    ...(rawRange ? { rawRange } : {}),
    ...(observation.kind === 'point' && observation.value !== undefined ? { rawValue: observation.value } : {}),
    basis: observation.basis,
    source: structuredClone(observation.source),
    selected: false as const,
    requiresSelection: true as const,
    reason: `Entrée alpha documentaire candidate (${qualification}); choisir explicitement un alphaForModel avant de la retenir.`,
    recordKey: hopCatalogueRecordKey(variant.scope, variant.recordId), variantId: variant.variantId, observationFingerprint: fingerprint,
    qualification,
  };
}

function qualifySlot(variant: HopCatalogueVariant, slot: ObservationSlot, evidenceRows: HopBasisEvidence[]): HopQualifiedObservation {
  const raw = structuredClone(slot.observation);
  const fingerprint = hopRawObservationReference(raw);
  const evidence = evidenceRows.filter(row => evidenceMatchesVariant(row, variant, slot, fingerprint));
  const valid = evidence.filter(row => validEvidence(row, slot));
  const uniqueEvidence = new Map(valid.map(row => [`${row.basis}:${row.denominator}`, row]));
  let qualification: HopObservationQualification;
  let effectiveBasis: HopMeasurement['basis'] = 'unknown';
  let calculationMeasurement: HopMeasurement | undefined;
  let evidenceIds: string[] = [];
  let reasons: string[] = [];

  if (hopMeasurementError(raw)) {
    qualification = 'invalidObservation';
    reasons = ['Observation brute invalide selon le contrat analytique; sa valeur reste archivée mais ne passe pas en calcul.'];
  } else if (evidence.length && (!valid.length || uniqueEvidence.size > 1)) {
    qualification = 'basisConflict';
    reasons = ['Une déclaration de base est liée à cette observation mais sa portée, son dénominateur ou ses preuves ne concordent pas.'];
  } else if (valid.length) {
    const accepted = valid[0];
    if (raw.basis !== 'unknown' && raw.basis !== accepted.basis) {
      qualification = 'basisConflict';
      reasons = ['La base déclarée en preuve contredit la base déjà inscrite dans le fait brut; conserver les deux versions.'];
    } else if (hopMeasurementError({ ...raw, basis: accepted.basis })) {
      qualification = 'basisConflict';
      reasons = ['La base attestée ne satisfait pas le contrat de l’unité observée.'];
    } else {
      effectiveBasis = accepted.basis;
      calculationMeasurement = { ...raw, basis: accepted.basis };
      qualification = accepted.basis === 'asIs' ? 'qualifiedPhysical' : 'qualifiedDocumentary';
      evidenceIds = valid.map(row => row.evidenceId).sort();
      reasons = [valid.some(row => row.evidenceType === 'userChoice')
        ? 'Choix de base explicite, attaché à cette version exacte de l’observation et à sa provenance.'
        : 'Base déclarée depuis la référence et le localisateur exacts de cette observation.'];
    }
  } else {
    const legacyRule = legacyMechanicalRule(variant, slot, fingerprint);
    if (legacyRule) {
      qualification = 'legacyMechanicalDefault';
      reasons = [`Correspond à l’ancienne règle mécanique documentée ${legacyRule.id}; cette règle n’atteste pas la base du produit.`];
    } else if (raw.basis === 'unknown') {
      qualification = 'unknownBasis';
      reasons = ['La source ne fournit pas de base exploitable; garder la valeur brute et ne pas la convertir en charge physique.'];
    } else if (raw.basis === 'asIs') {
      qualification = 'unqualifiedAsIs';
      reasons = ['Le champ asIs seul ne dit pas si la base a été mesurée, saisie ou ajoutée par un importeur; aucune histoire n’est inférée.'];
    } else {
      qualification = 'unqualifiedBasis';
      reasons = [`La base ${raw.basis} est inscrite mais aucune preuve liée à cette version du fait ne l’explique.`];
    }
  }

  if (!calculationMeasurement && qualification !== 'invalidObservation') calculationMeasurement = safeUnknownBasisCopy(raw) ?? undefined;
  const disposition = qualification === 'qualifiedPhysical' ? 'qualifiedBasisView'
    : qualification === 'qualifiedDocumentary' ? 'documentaryOnly'
      : calculationMeasurement ? raw.analyte === 'alpha' ? 'modelExplorationOnly' : 'documentaryOnly'
        : 'notPassedToCalculationView';
  return {
    variantId: variant.variantId, recordScope: slot.recordScope, recordId: slot.recordId,
    location: slot.location, locationIndex: slot.locationIndex, observationFingerprint: fingerprint, raw,
    qualification, effectiveBasis, calculationDisposition: disposition, calculationMeasurement,
    modelCandidate: makeModelCandidate(variant, slot, fingerprint, qualification),
    evidence: evidence.map(row => structuredClone(row)), evidenceIds, reasons,
  };
}

function withoutAnalytes(material: HopDecisionMaterial, analytes: HopAnalyte[]): HopDecisionMaterial {
  if (!analytes.length) return material;
  const blocked = new Set(analytes);
  const copy = structuredClone(material);
  copy.declaredAnalysis = (copy.declaredAnalysis ?? []).filter(row => !blocked.has(row.analyte));
  if (copy.lot) copy.lot.analysis = copy.lot.analysis.filter(row => !blocked.has(row.analyte));
  if (copy.variety) copy.variety.analysis = copy.variety.analysis.filter(row => !blocked.has(row.analyte));
  // Preserve alphaForModel: a separately recorded working hypothesis is not an analytical fallback.
  return copy;
}

function sanitizedMaterial(variant: HopCatalogueVariant, facts: HopQualifiedObservation[], fallbackBlockedAnalytes: HopAnalyte[] = []): HopDecisionMaterial {
  const copy = structuredClone(variant.material);
  const retained = new Map(facts.filter(fact => fact.variantId === variant.variantId && fact.calculationMeasurement)
    .map(fact => [`${fact.location}:${fact.locationIndex}`, fact.calculationMeasurement!]));
  copy.declaredAnalysis = (copy.declaredAnalysis ?? []).flatMap((_item, index) => {
    const value = retained.get(`declaredAnalysis:${index}`); return value ? [structuredClone(value)] : [];
  });
  if (copy.lot) copy.lot.analysis = copy.lot.analysis.flatMap((_item, index) => {
    const value = retained.get(`lot.analysis:${index}`); return value ? [structuredClone(value)] : [];
  });
  if (copy.variety) copy.variety.analysis = copy.variety.analysis.flatMap((_item, index) => {
    const value = retained.get(`variety.analysis:${index}`); return value ? [structuredClone(value)] : [];
  });
  return withoutAnalytes(copy, fallbackBlockedAnalytes);
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function fallbackBlockReasonsForVariants(
  variants: HopCatalogueVariant[], facts: HopQualifiedObservation[], common: boolean,
): HopFallbackBlockReason[] {
  const shared = common && variants.length > 1 ? sharedMeasurementFacts(variants, facts) : null;
  const output: HopFallbackBlockReason[] = [];
  for (const variant of variants) {
    for (const fact of facts.filter(row => row.variantId === variant.variantId)) {
      if (fact.location === 'variety.analysis') continue;
      const declaredCanMaskLowerScopes = fact.location === 'declaredAnalysis';
      const lotCanMaskVariety = fact.location === 'lot.analysis'
        && (hopMeasurementError(fact.raw) !== null || fact.raw.kind !== 'unknown');
      if (!declaredCanMaskLowerScopes && !lotCanMaskVariety) continue;
      const commonObservation = shared?.get(`${fact.location}:${fact.locationIndex}`)
        ?.some(measurement => !!fact.calculationMeasurement && sameValue(measurement, fact.calculationMeasurement));
      const retained = shared ? !!commonObservation : !!fact.calculationMeasurement;
      if (retained) continue;
      const reason = shared && fact.calculationMeasurement
        ? 'Cette observation supérieure n’est pas commune à toutes les variantes; ne pas réintroduire le même analyte depuis une portée inférieure.'
        : fact.location === 'declaredAnalysis'
          ? 'Une déclaration brute a été écartée; elle aurait empêché un repli sûr vers le lot ou la variété.'
          : hopMeasurementError(fact.raw)
            ? 'Une observation brute de lot est invalide; le lecteur original bloque cet analyte au lieu de retomber sur la variété.'
            : 'Une observation de lot non inconnue ne peut pas être projetée; ne pas la remplacer par une mesure variétale.';
      output.push({ analyte: fact.raw.analyte, variantId: variant.variantId, location: fact.location,
        recordId: fact.recordId, reason });
    }
  }
  const unique = new Map(output.map(row => [`${row.analyte}:${row.variantId}:${row.location}:${row.recordId}:${row.reason}`, row]));
  return [...unique.values()];
}

function projection(material: HopDecisionMaterial | null, fallbackBlockReasons: HopFallbackBlockReason[]): HopQualifiedCalculationProjection | null {
  if (!material) return null;
  return {
    material: withoutAnalytes(material, [...new Set(fallbackBlockReasons.map(row => row.analyte))]),
    fallbackBlockedAnalytes: [...new Set(fallbackBlockReasons.map(row => row.analyte))].sort(),
    fallbackBlockReasons,
  };
}

function observationCalculationSignature(fact: HopQualifiedObservation): string {
  const evidence = fact.evidence.map(({ evidenceId: _evidenceId, variantId: _variantId, ...row }) => row)
    .sort((left, right) => JSON.stringify(canonical(left)).localeCompare(JSON.stringify(canonical(right))));
  return JSON.stringify(canonical({
    recordScope: fact.recordScope, recordId: fact.recordId, location: fact.location, locationIndex: fact.locationIndex,
    observationFingerprint: fact.observationFingerprint, raw: fact.raw, qualification: fact.qualification,
    effectiveBasis: fact.effectiveBasis, calculationDisposition: fact.calculationDisposition,
    calculationMeasurement: fact.calculationMeasurement, evidence,
  }));
}

function variantCalculationSignature(variant: HopCatalogueVariant, facts: HopQualifiedObservation[]): string {
  const supplementalFacts = [...(variant.supplementalFacts ?? [])]
    .sort((left, right) => JSON.stringify(canonical(left)).localeCompare(JSON.stringify(canonical(right))));
  return JSON.stringify(canonical({
    material: sanitizedMaterial(variant, facts),
    observations: facts.filter(fact => fact.variantId === variant.variantId).map(observationCalculationSignature).sort(),
    supplementalFacts,
  }));
}

function sharedMeasurements(variants: HopCatalogueVariant[], facts: HopQualifiedObservation[]): Map<string, HopMeasurement[]> {
  if (variants.length < 2) return new Map();
  const perVariant = variants.map(variant => facts.filter(fact => fact.variantId === variant.variantId && fact.calculationMeasurement));
  const signatures = perVariant.map(rows => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const signature = observationCalculationSignature(row);
      counts.set(signature, (counts.get(signature) ?? 0) + 1);
    }
    return counts;
  });
  const firstRows = perVariant[0];
  const output = new Map<string, HopMeasurement[]>();
  const remaining = new Map<string, number>();
  for (const [signature, count] of signatures[0]) {
    remaining.set(signature, Math.min(count, ...signatures.slice(1).map(counts => counts.get(signature) ?? 0)));
  }
  for (const fact of firstRows) {
    const signature = observationCalculationSignature(fact);
    const count = remaining.get(signature) ?? 0;
    if (count < 1 || !fact.calculationMeasurement) continue;
    remaining.set(signature, count - 1);
    const key = `${fact.location}:${fact.locationIndex}`;
    output.set(key, [...(output.get(key) ?? []), structuredClone(fact.calculationMeasurement)]);
  }
  return output;
}

function sharedMeasurementFacts(variants: HopCatalogueVariant[], facts: HopQualifiedObservation[]): Map<string, HopMeasurement[]> {
  // Intersect each scope independently. Higher-scope conflicts are then blocked by
  // fallbackBlockReasonsForVariants; lower-scope differences must not erase a valid lot.
  return sharedMeasurements(variants, facts);
}

function intersectRows<T>(rows: T[][]): T[] {
  if (!rows.length) return [];
  const counts = rows.map(values => {
    const map = new Map<string, number>();
    for (const value of values) {
      const key = JSON.stringify(canonical(value));
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return map;
  });
  const remaining = new Map<string, number>();
  for (const [key, count] of counts[0]) remaining.set(key, Math.min(count, ...counts.slice(1).map(row => row.get(key) ?? 0)));
  const output: T[] = [];
  for (const value of rows[0]) {
    const key = JSON.stringify(canonical(value));
    const count = remaining.get(key) ?? 0;
    if (count < 1) continue;
    remaining.set(key, count - 1);
    output.push(structuredClone(value));
  }
  return output;
}

function sameOptionalIdentity(values: unknown[]): boolean {
  return values.every(value => sameValue(value, values[0]));
}

function productDecisionConstraints(product: HopDecisionMaterial['product']) {
  if (!product) return null;
  const replacement = product.replacement;
  return {
    id: product.id,
    form: product.form,
    supportedUses: [...product.supportedUses].sort(),
    cautions: [...product.cautions].sort(),
    replacement: replacement ? {
      referenceForm: replacement.referenceForm,
      uses: [...replacement.uses].sort(),
      basis: replacement.basis,
      gramsPerGram: replacement.gramsPerGram,
      limitations: [...replacement.limitations].sort(),
      maxEquivalentFraction: replacement.maxEquivalentFraction,
      maxDoseGL: replacement.maxDoseGL,
    } : null,
  };
}

function commonCalculationMaterial(variants: HopCatalogueVariant[], facts: HopQualifiedObservation[]): {
  material: HopDecisionMaterial | null;
  reasons: string[];
  fallbackBlockReasons: HopFallbackBlockReason[];
} {
  if (!variants.length) return { material: null, reasons: ['Aucune variante ne permet de construire une vue commune.'], fallbackBlockReasons: [] };
  if (variants.length === 1) {
    const fallbackBlockReasons = fallbackBlockReasonsForVariants(variants, facts, false);
    return { material: sanitizedMaterial(variants[0], facts, [...new Set(fallbackBlockReasons.map(row => row.analyte))]),
      reasons: ['Une seule variante source est présente.'], fallbackBlockReasons };
  }
  const materials = variants.map(variant => variant.material);
  const first = materials[0];
  const sameShape = sameOptionalIdentity(materials.map(item => item.id)) && sameOptionalIdentity(materials.map(item => item.form))
    && sameOptionalIdentity(materials.map(item => item.stockItemRef))
    && sameOptionalIdentity(materials.map(item => item.variety ? [item.variety.id, item.variety.form] : null))
    && sameOptionalIdentity(materials.map(item => item.lot ? [item.lot.id, item.lot.varietyId, item.lot.form, item.lot.stockItemRef, item.lot.referenceOnly] : null))
    && sameOptionalIdentity(materials.map(item => item.product ? [item.product.id, item.product.form] : null));
  if (!sameShape) return { material: null,
    reasons: ['Les variantes divergent sur l’identité, la forme, le lot, le produit ou la référence de stock; aucune vue physique commune n’est sûre.'],
    fallbackBlockReasons: fallbackBlockReasonsForVariants(variants, facts, true) };

  const productRows = materials.map(item => item.product);
  if (!sameOptionalIdentity(productRows.map(productDecisionConstraints))) {
    return { material: null,
      reasons: ['Les usages, précautions, ratios ou plafonds du produit divergent entre variantes; aucune vue commune ne doit perdre ces contraintes.'],
      fallbackBlockReasons: fallbackBlockReasonsForVariants(variants, facts, true) };
  }
  if (!sameOptionalIdentity(productRows)) {
    return { material: null,
      reasons: ['Les contraintes produit concordent, mais les libellés ou provenances diffèrent et le contrat produit ne peut porter plusieurs sources sans en choisir une.'],
      fallbackBlockReasons: fallbackBlockReasonsForVariants(variants, facts, true) };
  }

  const common = sharedMeasurementFacts(variants, facts);
  const withShared = (location: HopCatalogueObservationLocation, rows: HopMeasurement[] | undefined) =>
    (rows ?? []).flatMap((_row, index) => common.get(`${location}:${index}`) ?? []);
  const commonVarietyAnalysis = withShared('variety.analysis', first.variety?.analysis);
  const commonLotAnalysis = withShared('lot.analysis', first.lot?.analysis);
  const commonDeclared = withShared('declaredAnalysis', first.declaredAnalysis);
  const sameAlphaModel = sameOptionalIdentity(materials.map(item => item.alphaForModel));
  const result: HopDecisionMaterial = {
    id: first.id,
    name: materials.every(item => item.name === first.name) ? first.name : first.id,
    form: first.form,
    ...(first.stockItemRef ? { stockItemRef: first.stockItemRef } : {}),
    availableGrams: materials.every(item => item.availableGrams === first.availableGrams) ? first.availableGrams : null,
    ...(sameAlphaModel && first.alphaForModel ? { alphaForModel: structuredClone(first.alphaForModel) } : {}),
    declaredAnalysis: commonDeclared,
    ...(first.variety ? { variety: {
      id: first.variety.id,
      name: materials.every(item => item.variety!.name === first.variety!.name) ? first.variety.name : first.variety.id,
      aliases: intersectRows(materials.map(item => item.variety!.aliases)),
      ...(sameOptionalIdentity(materials.map(item => item.variety!.origin)) && first.variety.origin ? { origin: first.variety.origin } : {}),
      form: first.variety.form,
      descriptions: intersectRows(materials.map(item => item.variety!.descriptions)),
      analysis: commonVarietyAnalysis,
      ...(materials.every(item => item.variety!.archived === first.variety!.archived) && first.variety.archived ? { archived: true } : {}),
    } } : {}),
    ...(first.lot ? { lot: {
      id: first.lot.id,
      varietyId: first.lot.varietyId,
      name: materials.every(item => item.lot!.name === first.lot!.name) ? first.lot.name : first.lot.id,
      ...(sameOptionalIdentity(materials.map(item => item.lot!.lotNumber)) && first.lot.lotNumber ? { lotNumber: first.lot.lotNumber } : {}),
      ...(sameOptionalIdentity(materials.map(item => item.lot!.harvestYear)) && first.lot.harvestYear ? { harvestYear: first.lot.harvestYear } : {}),
      ...(sameOptionalIdentity(materials.map(item => item.lot!.growingRegion)) && first.lot.growingRegion ? { growingRegion: first.lot.growingRegion } : {}),
      ...(sameOptionalIdentity(materials.map(item => item.lot!.grower)) && first.lot.grower ? { grower: first.lot.grower } : {}),
      ...(sameOptionalIdentity(materials.map(item => item.lot!.storageNotes)) && first.lot.storageNotes ? { storageNotes: first.lot.storageNotes } : {}),
      ...(first.lot.referenceOnly ? { referenceOnly: true } : {}),
      form: first.lot.form,
      ...(first.lot.stockItemRef ? { stockItemRef: first.lot.stockItemRef } : {}),
      analysis: commonLotAnalysis,
      ...(sameOptionalIdentity(materials.map(item => item.lot!.notes)) && first.lot.notes ? { notes: first.lot.notes } : {}),
      ...(materials.every(item => item.lot!.archived === first.lot!.archived) && first.lot.archived ? { archived: true } : {}),
    } } : {}),
    ...(materials.every(item => sameValue(item.product, first.product)) && first.product ? { product: structuredClone(first.product) } : {}),
  };
  const droppedAvailability = !materials.every(item => item.availableGrams === first.availableGrams);
  const fallbackBlockReasons = fallbackBlockReasonsForVariants(variants, facts, true);
  return { material: withoutAnalytes(result, [...new Set(fallbackBlockReasons.map(row => row.analyte))]), reasons: [
    'Identités physiques communes seulement; les observations non identiques ou non pareillement qualifiées ont été exclues de cette vue.',
    ...(droppedAvailability ? ['Les quantités de stock divergent; la disponibilité commune est inconnue.'] : []),
    ...(!sameAlphaModel && materials.some(item => item.alphaForModel) ? ['Les alphaForModel diffèrent; aucun paramètre de modèle n’est choisi pour la vue commune.'] : []),
    'Les variantes brutes et leurs vues calculatoires conditionnelles restent séparées.',
  ], fallbackBlockReasons };
}

/** Preserve raw same-ID variants; only an explicit variant choice creates a calculation material. */
export function qualifyHopCatalogueVariants(input: {
  variants: HopCatalogueVariant[];
  basisEvidence?: HopBasisEvidence[];
  selectedVariantByRecord?: Record<string, string>;
}): HopCatalogueQualificationResult {
  if (!Array.isArray(input.variants)) throw new Error('Fournir les variantes brutes du catalogue.');
  const variantIds = input.variants.map(variant => variant.variantId);
  if (variantIds.some(id => typeof id !== 'string' || !id.trim()) || new Set(variantIds).size !== variantIds.length) {
    throw new Error('Chaque variante brute doit avoir un variantId distinct.');
  }
  const groups = new Map<string, HopCatalogueVariant[]>();
  for (const variant of input.variants) {
    if (!variant.recordId.trim() || !variant.material.id.trim() || !['variety', 'lot', 'product', 'assignment'].includes(variant.scope)
      || !identityMatchesScope(variant)) {
      throw new Error('Identité/scope invalide dans une variante brute.');
    }
    const key = hopCatalogueRecordKey(variant.scope, variant.recordId);
    groups.set(key, [...(groups.get(key) ?? []), variant]);
  }

  const output: HopQualifiedCatalogueGroup[] = [];
  const modelCandidates: HopAlphaModelCandidate[] = [];
  for (const [key, variants] of groups) {
    const archived = variants.some(isArchived);
    const hasRequestedSelection = !!input.selectedVariantByRecord && Object.prototype.hasOwnProperty.call(input.selectedVariantByRecord, key);
    const requestedVariantId = hasRequestedSelection ? input.selectedVariantByRecord![key] : undefined;
    const selected = hasRequestedSelection ? variants.find(variant => variant.variantId === requestedVariantId)
      : variants.length === 1 ? variants[0] : undefined;
    const observations = variants.flatMap(variant => observationSlots(variant).map(slot => qualifySlot(variant, slot, input.basisEvidence ?? [])));
    modelCandidates.push(...observations.flatMap(observation => observation.modelCandidate ? [observation.modelCandidate] : []));
    const calculationVariants = variants.map(variant => {
      const fallbackBlockReasons = fallbackBlockReasonsForVariants([variant], observations, false);
      const fallbackBlockedAnalytes = [...new Set(fallbackBlockReasons.map(row => row.analyte))].sort();
      return { variantId: variant.variantId,
        material: sanitizedMaterial(variant, observations, fallbackBlockedAnalytes), fallbackBlockedAnalytes, fallbackBlockReasons };
    });
    const equivalent = variants.length > 1 && calculationVariants.every(row =>
      variantCalculationSignature(variants.find(variant => variant.variantId === row.variantId)!, observations)
        === variantCalculationSignature(variants[0], observations));
    const status: HopQualifiedCatalogueGroup['status'] = archived ? 'archivedTombstone'
      : hasRequestedSelection && !selected ? 'selectionInvalid'
        : selected ? 'ready'
          : equivalent ? 'equivalentVariants' : 'collisionNeedsSelection';
    const equivalentVariantIds = status === 'equivalentVariants' ? variants.map(variant => variant.variantId) : [];
    const shared = archived ? { material: null,
      reasons: ['Un état archivé est présent; résoudre explicitement le groupe avant tout calcul actif. Cet état ne suffit pas à reconstruire l’ordre historique des variantes.'],
      fallbackBlockReasons: fallbackBlockReasonsForVariants(variants, observations, true) }
      : commonCalculationMaterial(variants, observations);
    const calculationMaterial = status === 'ready' && selected ? calculationVariants.find(row => row.variantId === selected.variantId)!.material
      : status === 'equivalentVariants' ? shared.material : null;
    const calculationFallbackReasons = status === 'ready' && selected
      ? calculationVariants.find(row => row.variantId === selected.variantId)!.fallbackBlockReasons
      : status === 'equivalentVariants' ? shared.fallbackBlockReasons : [];
    const calculationProjection = projection(calculationMaterial, calculationFallbackReasons);
    const commonCalculationProjection = projection(shared.material, shared.fallbackBlockReasons);
    const groupFallbackReasons = calculationProjection?.fallbackBlockReasons ?? shared.fallbackBlockReasons;
    const calculationVariantDisposition = (variantId: string) => status === 'archivedTombstone' ? 'archivedOnly' as const
      : status === 'equivalentVariants' ? 'equivalent' as const
        : status === 'ready' && selected?.variantId === variantId ? 'selected' as const : 'conditional' as const;
    output.push({ key, scope: variants[0].scope, recordId: variants[0].recordId, status,
      selectedVariantId: status === 'ready' ? selected?.variantId ?? null : null, equivalentVariantIds,
      rawVariants: variants.map(variant => structuredClone(variant)), observations,
      supplementalFacts: variants.flatMap(variant => (variant.supplementalFacts ?? []).map(fact => ({
        variantId: variant.variantId, recordId: variant.recordId, fact: structuredClone(fact), disposition: 'rawOnlyNotMapped' as const }))),
      calculationMaterial: calculationProjection?.material ?? null,
      calculationProjection,
      calculationVariants: calculationVariants.map(row => ({ ...row, disposition: calculationVariantDisposition(row.variantId) })),
      commonCalculationMaterial: commonCalculationProjection?.material ?? null,
      commonCalculationProjection,
      commonCalculationReasons: shared.reasons,
      fallbackBlockedAnalytes: [...new Set(groupFallbackReasons.map(row => row.analyte))].sort(),
      fallbackBlockReasons: groupFallbackReasons,
      blockers: status === 'archivedTombstone' ? ['Un état archivé figure dans les variantes de cet ID; aucun seed ne le réactive silencieusement. Résoudre le groupe sans prétendre à une chronologie absente.']
        : status === 'equivalentVariants' ? ['Variantes conservées séparément; leurs faits et qualifications calculatoires sont strictement équivalents, aucun gagnant de source n’est choisi.']
          : status === 'collisionNeedsSelection' ? ['Plusieurs variantes du même scope/ID divergent; les vues conditionnelles et la vue commune sûre sont exposées sans sélection implicite.']
          : status === 'selectionInvalid' ? ['La variante sélectionnée ne fait pas partie de ce groupe.']
            : observations.filter(row => ['legacyMechanicalDefault', 'unqualifiedAsIs', 'unknownBasis', 'unqualifiedBasis', 'basisConflict', 'invalidObservation'].includes(row.qualification))
              .map(row => `${row.location}[${row.locationIndex}] ${row.raw.analyte}: ${row.qualification}`) });
  }
  return { version: HOP_CATALOGUE_QUALIFICATION_VERSION, groups: output, modelCandidates,
     limitations: ['Le calcul actif utilise calculationMaterial pour ready/equivalent; sur collision, commonCalculationMaterial ne convient qu’aux actions qui ne dépendent pas des faits analytiques écartés. Résoudre explicitement toute variante conditionnelle avant de l’employer.',
       'Ne jamais passer rawVariants aux fonctions HopDecision : cela réintroduirait une base non qualifiée par un autre chemin analytique.',
      'Les alpha modèle documentaires sont des candidats non sélectionnés; ce module ne crée pas alphaForModel.',
       'Cette projection ne vérifie pas le contenu scientifique des sources fournies comme preuves; elle vérifie seulement leurs liaisons structurées.',
       'Les attributs supplémentaires hors HopMeasurement restent raw-only jusqu’à extension de schéma validée.'] };
}
