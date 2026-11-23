import { HOP_FORMS, hopSourceError, type HopSource } from '../../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from './adviceContentReference';
import type { HopIntentEvidenceCriterion } from './intentEvidence';
import type { HopDecisionMaterial, HopDecisionProgram, HopProcessStage, HopUse } from './types';

/** Schema version for documentary strategy advice; this is not a program operation. */
export const HOP_ADVICE_VERSION = 'hop-strategy-advice-v1' as const;

export interface HopAdviceIntent {
  originalQuestion: string;
  interpretation?: string;
  assumptions?: string[];
  criteria?: HopIntentEvidenceCriterion[];
}

export interface HopAdviceAssertion {
  id: string;
  /** Caller-supplied semantic key; only structural keys such as dimension/state/value are read. */
  subject: string;
  statement: string;
  state: 'reported' | 'measured' | 'planned' | 'performed' | 'unknown';
  value: string | number | boolean | null;
  unit?: string;
  /** Explicit semantic link; prose in `statement` is never parsed for a dimension. */
  dimension?: HopAdviceDimension;
  source?: HopSource;
}

export interface HopAdviceCriterionDimension {
  criterionId: string;
  dimension: HopAdviceDimension;
  /** Optional curated family key; still no family is inferred from prose. */
  familyId?: string;
}

export type HopAdviceConstraintCheck =
  | { criterionId: string; kind: 'preservePerformed'; additionIds: string[] }
  | { criterionId: string; kind: 'excludeMaterials'; materialIds: string[] }
  | { criterionId: string; kind: 'stageUse'; materialId: string; use: HopUse };

export interface HopAdviceExclusion {
  materialId: string;
  reason: string;
  certainty: 'certain' | 'possible' | 'unknown';
}

/** Program may be absent; its absence must never be replaced by an empty program implicitly. */
export interface HopAdviceSituation {
  stage: HopProcessStage;
  program: HopDecisionProgram | null;
  /** Explicit material scope; absent means every material explicitly supplied to this call. */
  materialIds?: string[];
  assertions: HopAdviceAssertion[];
  /** Explicit mappings only. An empty list leaves criterion dimensions unknown. */
  criterionDimensions: HopAdviceCriterionDimension[];
  /** Categorical checks are only evaluated when their exact structural predicate is supplied. */
  constraintChecks?: HopAdviceConstraintCheck[];
  exclusions: HopAdviceExclusion[];
}

export type HopAdviceProgramScope =
  | { kind: 'none' }
  | { kind: 'removePlanned'; additionIds: string[] }
  | { kind: 'addOrReplace'; materialIds: string[]; uses: HopUse[]; additionIds: string[]; allowAppend: boolean };

export type HopAdviceCriterionStatus =
  | 'documentedSupport'
  | 'documentedTension'
  | 'constraintSatisfied'
  | 'constraintViolated'
  | 'constraintUnverified'
  | 'unknown'
  | 'notApplicable';

export interface HopAdviceCriterionEffect {
  criterionId: string;
  status: HopAdviceCriterionStatus;
  reason: string;
  evidenceIds: string[];
}

export type HopAdviceDimension =
  | 'aroma'
  | 'acidity'
  | 'alcohol'
  | 'bioInteraction'
  | 'hopCreep'
  | 'matrixTransfer'
  | 'process'
  | 'stock'
  | 'documentation'
  | 'other';

export interface HopAdviceDimensionEffect {
  dimension: HopAdviceDimension;
  status: 'documentarySupport' | 'documentaryTension' | 'conditional' | 'unknown' | 'structuralChange' | 'notApplicable';
  statement: string;
  reason: string;
  evidenceIds: string[];
  assertionIds: string[];
  criterionIds: string[];
}

export interface HopAdviceOptionExclusion {
  materialId: string;
  status: 'excluded' | 'retained' | 'possible' | 'unknown';
  reason: string;
}

export interface HopAdviceOption {
  id: string;
  reference: string;
  title: string;
  /** Material IDs considered by this option; these do not imply an operation. */
  materialIds: string[];
  relevance: 'supportsCriteria' | 'conditional' | 'mixed' | 'unknown' | 'notAligned';
  programScope: HopAdviceProgramScope;
  criterionEffects: HopAdviceCriterionEffect[];
  dimensionEffects: HopAdviceDimensionEffect[];
  exclusions: HopAdviceOptionExclusion[];
  conditions: string[];
  nonConclusions: string[];
  informationRequestIds: string[];
}

export interface HopAdviceInformationRequest {
  id: string;
  question: string;
  whyDecisionChanging: string;
  optionIds: string[];
}

export interface HopAdviceEvidenceSource {
  id: string;
  source: HopSource;
  /** Exact section, table, figure or page locator from the already-read dossier. */
  locator: string;
  readingLevel: 'primaryFullText' | 'primaryAbstract' | 'primaryExcerpt' | 'secondary' | 'dossierSummary' | 'providedMaterialSource' | 'curatedMapping';
  domain: string;
  established: string;
  limits: string[];
}

export interface HopAdviceCoverage {
  status: 'completeWithinSuppliedScope' | 'bounded' | 'partial';
  consideredMaterialIds: string[];
  excludedMaterialIds: string[];
  contextOnlyMaterialIds: string[];
  omittedMaterials: Array<{ materialId: string; recordKeys: string[]; reason: string }>;
  conditionalMaterials: Array<{ materialId: string; recordKeys: string[]; reason: string }>;
  limits: string[];
}

export interface HopAdviceQualificationContext {
  omitted: Array<{ materialId: string; recordKeys: string[]; reason: string }>;
  conditional: Array<{ materialId: string; recordKeys: string[]; reason: string }>;
  limitations: string[];
}

export interface HopStrategyAdviceResult {
  version: typeof HOP_ADVICE_VERSION;
  inputReference: string;
  reference: string;
  stage: HopProcessStage;
  status: 'answered' | 'conditional' | 'noApplicableOption';
  options: HopAdviceOption[];
  informationRequests: HopAdviceInformationRequest[];
  evidenceSources: HopAdviceEvidenceSource[];
  coverage: HopAdviceCoverage;
  limitations: string[];
}

export interface HopAdviceInput {
  intent: HopAdviceIntent;
  situation: HopAdviceSituation;
  materials: readonly HopDecisionMaterial[];
  qualification?: HopAdviceQualificationContext;
}

const stages: readonly HopProcessStage[] = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'];
const uses: readonly HopUse[] = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
const adviceDimensions: readonly HopAdviceDimension[] = [
  'aroma', 'acidity', 'alcohol', 'bioInteraction', 'hopCreep', 'matrixTransfer', 'process', 'stock', 'documentation', 'other',
];
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const nonEmpty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const uniqueStrings = (rows: unknown[]): rows is string[] => rows.every(nonEmpty) && new Set(rows).size === rows.length;
function check(condition: unknown, reason: string): asserts condition {
  if (!condition) throw Error(reason);
}

/** Stable exact-content reference; deliberately not an authorization or security token. */
export function hopAdviceCanonicalReference(prefix: string, value: unknown): string {
  return hopAdviceContentReference(prefix, value);
}

export function hopAdviceInputReference(input: HopAdviceInput): string {
  return hopAdviceCanonicalReference('hop-advice-input-v1', input);
}

export function hopAdviceResultReference(
  result: Omit<HopStrategyAdviceResult, 'reference'> | HopStrategyAdviceResult,
): string {
  const { reference: _reference, ...content } = result as HopStrategyAdviceResult;
  return hopAdviceCanonicalReference('hop-advice-result-v1', content);
}

export function hopAdviceOptionReference(
  inputReference: string,
  option: Omit<HopAdviceOption, 'id' | 'reference'>,
): string {
  return hopAdviceCanonicalReference('hop-advice-option-v1', { inputReference, option });
}

export function assertHopAdviceSituation(value: unknown): asserts value is HopAdviceSituation {
  check(isRecord(value) && stages.includes(value.stage as HopProcessStage), 'Situation de stratégie invalide.');
  check(value.program === null || isRecord(value.program), 'Programme de situation invalide.');
  if (value.program !== null) {
    const program = value.program as unknown as HopDecisionProgram;
    check(nonEmpty(program.id) && Number.isSafeInteger(program.revision) && program.revision >= 0
      && stages.includes(program.stage) && program.stage === value.stage && Array.isArray(program.additions)
      && (program.volumeL === null || finite(program.volumeL)) && (program.wortGravity === null || finite(program.wortGravity)), 'Programme de situation incomplet ou hors stade.');
    const additionIds = new Set<string>();
    for (const addition of program.additions) {
      check(isRecord(addition) && nonEmpty(addition.id) && nonEmpty(addition.materialId)
        && !additionIds.has(addition.id as string) && (addition.grams === null || (finite(addition.grams) && addition.grams >= 0))
        && uses.includes(addition.use as HopUse) && ['planned', 'performed'].includes(addition.status as string), 'Addition de situation invalide.');
      additionIds.add(addition.id as string);
      for (const field of ['boilMinutes', 'contactHours', 'dayOffset']) {
        const value = addition[field];
        check(value === undefined || value === null || (finite(value) && value >= 0), `Paramètre de temps invalide : ${field}.`);
      }
      const temperature = addition.temperatureC;
      check(temperature === undefined || temperature === null || finite(temperature), 'Température d’addition invalide.');
    }
  }
  check(value.materialIds === undefined || (Array.isArray(value.materialIds) && uniqueStrings(value.materialIds)), 'Portée de matières de situation invalide.');
  check(Array.isArray(value.assertions), 'Assertions de situation absentes.');
  const assertionIds = new Set<string>();
  for (const assertion of value.assertions) {
    check(isRecord(assertion) && nonEmpty(assertion.id) && nonEmpty(assertion.subject) && nonEmpty(assertion.statement)
      && ['reported', 'measured', 'planned', 'performed', 'unknown'].includes(assertion.state as string), 'Assertion de situation invalide.');
    check(assertion.value === null || ['string', 'boolean'].includes(typeof assertion.value) || finite(assertion.value), 'Valeur d’assertion invalide.');
    check(assertion.unit === undefined || nonEmpty(assertion.unit), 'Unité d’assertion invalide.');
    check(assertion.dimension === undefined || adviceDimensions.includes(assertion.dimension as HopAdviceDimension), 'Dimension d’assertion inconnue.');
    if (assertion.source !== undefined) check(!hopSourceError(assertion.source), 'Source d’assertion invalide.');
    check(!assertionIds.has(assertion.id as string), 'ID d’assertion répété.'); assertionIds.add(assertion.id as string);
  }
  check(Array.isArray(value.criterionDimensions), 'Mapping de dimensions de critères absent.');
  const criterionDimensionRefs = new Set<string>();
  for (const link of value.criterionDimensions) {
    check(isRecord(link) && nonEmpty(link.criterionId) && adviceDimensions.includes(link.dimension as HopAdviceDimension)
      && (link.familyId === undefined || nonEmpty(link.familyId)), 'Mapping de dimension de critère invalide.');
    const reference = `${link.criterionId}:${link.dimension}:${link.familyId ?? ''}`;
    check(!criterionDimensionRefs.has(reference), 'Mapping de dimension de critère répété.'); criterionDimensionRefs.add(reference);
  }
  const checks = value.constraintChecks ?? [];
  check(Array.isArray(checks), 'Contrôles structurels de contraintes invalides.');
  for (const constraint of checks) {
    check(isRecord(constraint) && nonEmpty(constraint.criterionId), 'Contrôle structurel de contrainte invalide.');
    if (constraint.kind === 'preservePerformed') check(Array.isArray(constraint.additionIds)
      && constraint.additionIds.length > 0 && uniqueStrings(constraint.additionIds), 'Contrôle performed incomplet.');
    else if (constraint.kind === 'excludeMaterials') check(Array.isArray(constraint.materialIds)
      && constraint.materialIds.length > 0 && uniqueStrings(constraint.materialIds), 'Contrôle d’exclusion matière incomplet.');
    else if (constraint.kind === 'stageUse') check(nonEmpty(constraint.materialId) && uses.includes(constraint.use as HopUse), 'Contrôle de stade/emploi invalide.');
    else check(false, 'Type de contrôle structurel inconnu.');
  }
  check(Array.isArray(value.exclusions), 'Exclusions de situation absentes.');
  const excludedIds = new Set<string>();
  for (const exclusion of value.exclusions) {
    check(isRecord(exclusion) && nonEmpty(exclusion.materialId) && nonEmpty(exclusion.reason)
      && ['certain', 'possible', 'unknown'].includes(exclusion.certainty as string), 'Exclusion de situation invalide.');
    check(!excludedIds.has(exclusion.materialId as string), 'Exclusion de matière répétée.'); excludedIds.add(exclusion.materialId as string);
  }
}

export function assertHopAdviceInput(value: unknown): asserts value is HopAdviceInput {
  check(isRecord(value) && isRecord(value.intent) && nonEmpty(value.intent.originalQuestion), 'Demande de conseil absente.');
  check(value.intent.interpretation === undefined || typeof value.intent.interpretation === 'string', 'Interprétation de conseil invalide.');
  check(value.intent.assumptions === undefined || (Array.isArray(value.intent.assumptions) && value.intent.assumptions.every(nonEmpty)), 'Hypothèses de conseil invalides.');
  const criteria = value.intent.criteria === undefined ? [] : value.intent.criteria;
  check(Array.isArray(criteria), 'Critères de conseil invalides.');
  const criteriaById = new Map<string, HopIntentEvidenceCriterion>();
  for (const criterion of criteria) {
    check(isRecord(criterion) && nonEmpty(criterion.id) && nonEmpty(criterion.description)
      && ['seek', 'preserve', 'avoid', 'pairWith', 'observation', 'constraint'].includes(criterion.role as string)
      && ['user', 'proposal'].includes(criterion.origin as string)
      && (criterion.familyId === undefined || nonEmpty(criterion.familyId)), 'Critère de conseil invalide.');
    check(!criteriaById.has(criterion.id as string), 'ID de critère répété.');
    if (criterion.partner !== undefined) {
      check(isRecord(criterion.partner), 'Partenaire de critère invalide.');
      if (criterion.partner.kind === 'material') check(nonEmpty(criterion.partner.id)
        && (criterion.partner.additionId === undefined || nonEmpty(criterion.partner.additionId)), 'Partenaire matière invalide.');
      else if (criterion.partner.kind === 'observation') check(nonEmpty(criterion.partner.id)
        && (criterion.partner.descriptions === undefined || Array.isArray(criterion.partner.descriptions)), 'Observation partenaire invalide.');
      else if (criterion.partner.kind === 'freeContext') check(nonEmpty(criterion.partner.text)
        && (criterion.partner.context === undefined || typeof criterion.partner.context === 'string')
        && (criterion.partner.source === undefined || !hopSourceError(criterion.partner.source)), 'Contexte libre partenaire invalide.');
      else check(false, 'Type de partenaire inconnu.');
    }
    criteriaById.set(criterion.id as string, criterion as unknown as HopIntentEvidenceCriterion);
  }
  assertHopAdviceSituation(value.situation);
  check(Array.isArray(value.materials), 'Matières de conseil absentes.');
  const materialIds = new Set<string>();
  for (const material of value.materials) {
    check(isRecord(material) && nonEmpty(material.id) && nonEmpty(material.name) && HOP_FORMS.includes(material.form as any), 'Matière de conseil invalide.');
    check(material.availableGrams === undefined || material.availableGrams === null || (finite(material.availableGrams) && material.availableGrams >= 0), 'Stock de conseil invalide.');
    if (material.product !== undefined) check(isRecord(material.product) && nonEmpty(material.product.id)
      && HOP_FORMS.includes(material.product.form as any) && Array.isArray(material.product.supportedUses)
      && uniqueStrings(material.product.supportedUses) && material.product.supportedUses.every(use => uses.includes(use as HopUse)), 'Capacités du produit de conseil invalides.');
    check(!materialIds.has(material.id as string), 'ID de matière répété dans le conseil.'); materialIds.add(material.id as string);
  }
  for (const mapping of value.situation.criterionDimensions) {
    const criterion = criteriaById.get(mapping.criterionId);
    check(!!criterion, 'Mapping de dimension lié à un critère absent.');
    check(mapping.familyId === undefined || mapping.dimension === 'aroma', 'Une famille du lexique ne peut être rattachée qu’à une dimension aromatique.');
    check(!criterion!.familyId || mapping.dimension === 'aroma', 'Un critère muni d’une famille doit rester dans la dimension aromatique.');
    check(!criterion!.familyId || !mapping.familyId || criterion!.familyId === mapping.familyId, 'Familles de critère contradictoires.');
  }
  for (const constraint of value.situation.constraintChecks ?? []) check(criteriaById.get(constraint.criterionId)?.role === 'constraint',
    'Contrôle lié à un critère qui n’est pas une contrainte.');
  const qualifiedIds = new Set<string>();
  if (value.qualification !== undefined) {
    check(isRecord(value.qualification) && Array.isArray(value.qualification.omitted)
      && Array.isArray(value.qualification.conditional) && Array.isArray(value.qualification.limitations)
      && value.qualification.limitations.every(nonEmpty), 'Qualification de matières invalide.');
    for (const rows of [value.qualification.omitted, value.qualification.conditional]) {
      const ids = new Set<string>();
      for (const row of rows) {
        check(isRecord(row) && nonEmpty(row.materialId) && !ids.has(row.materialId as string)
          && Array.isArray(row.recordKeys) && uniqueStrings(row.recordKeys) && nonEmpty(row.reason), 'Limitation de matière mal formée.');
        ids.add(row.materialId as string);
        qualifiedIds.add(row.materialId as string);
      }
    }
  }
  if (value.situation.materialIds) for (const id of value.situation.materialIds) {
    const excludedByUser = value.situation.exclusions.some((row: HopAdviceExclusion) => row.materialId === id);
    const referencedInProgram = value.situation.program?.additions.some((addition: { materialId: string }) => addition.materialId === id) ?? false;
    check(materialIds.has(id) || qualifiedIds.has(id) || excludedByUser || referencedInProgram, `Matière explicitement demandée absente des entrées : ${id}.`);
  }
}

function assertProgramScope(value: unknown): asserts value is HopAdviceProgramScope {
  check(isRecord(value) && ['none', 'removePlanned', 'addOrReplace'].includes(value.kind as string), 'Portée de programme de l’option invalide.');
  if (value.kind === 'none') return;
  if (value.kind === 'removePlanned') {
    check(Array.isArray(value.additionIds) && value.additionIds.length > 0 && uniqueStrings(value.additionIds), 'Retrait prévu sans IDs d’ajout uniques.');
    return;
  }
  check(Array.isArray(value.materialIds) && value.materialIds.length > 0 && uniqueStrings(value.materialIds)
    && Array.isArray(value.uses) && value.uses.every(use => uses.includes(use as HopUse))
    && Array.isArray(value.additionIds) && uniqueStrings(value.additionIds)
    && typeof value.allowAppend === 'boolean', 'Portée d’ajout/remplacement incomplète.');
}

/** Structural receipt validation only; it never reruns strategy generation. */
export function assertHopStrategyAdviceResult(value: unknown): asserts value is HopStrategyAdviceResult {
  check(isRecord(value) && value.version === HOP_ADVICE_VERSION && nonEmpty(value.inputReference)
    && value.inputReference.startsWith('hop-advice-input-v1:') && stages.includes(value.stage as HopProcessStage)
    && ['answered', 'conditional', 'noApplicableOption'].includes(value.status as string), 'Résultat de conseil invalide.');
  check(Array.isArray(value.options) && Array.isArray(value.informationRequests) && Array.isArray(value.evidenceSources)
    && Array.isArray(value.limitations), 'Listes du résultat de conseil absentes.');
  const evidenceIds = new Set<string>();
  for (const evidence of value.evidenceSources) {
    check(isRecord(evidence) && nonEmpty(evidence.id) && !evidenceIds.has(evidence.id as string)
      && !hopSourceError(evidence.source) && nonEmpty(evidence.locator) && nonEmpty(evidence.domain)
      && nonEmpty(evidence.established) && Array.isArray(evidence.limits) && evidence.limits.every(nonEmpty)
      && ['primaryFullText', 'primaryAbstract', 'primaryExcerpt', 'secondary', 'dossierSummary', 'providedMaterialSource', 'curatedMapping'].includes(evidence.readingLevel as string), 'Source de preuve du conseil invalide.');
    evidenceIds.add(evidence.id as string);
  }
  const optionIds = new Set<string>(), optionReferences = new Set<string>();
  for (const option of value.options) {
    check(isRecord(option) && nonEmpty(option.id) && !optionIds.has(option.id as string) && nonEmpty(option.title)
      && Array.isArray(option.materialIds) && uniqueStrings(option.materialIds)
      && ['supportsCriteria', 'conditional', 'mixed', 'unknown', 'notAligned'].includes(option.relevance as string), 'Option de conseil invalide.');
    optionIds.add(option.id as string);
    assertProgramScope(option.programScope);
    check(Array.isArray(option.criterionEffects) && Array.isArray(option.dimensionEffects) && Array.isArray(option.exclusions)
      && Array.isArray(option.conditions) && option.conditions.every(nonEmpty)
      && Array.isArray(option.nonConclusions) && option.nonConclusions.every(nonEmpty)
      && Array.isArray(option.informationRequestIds) && uniqueStrings(option.informationRequestIds), 'Raisons et limites de l’option absentes.');
    for (const effect of option.criterionEffects) {
      check(isRecord(effect) && nonEmpty(effect.criterionId) && nonEmpty(effect.reason)
        && ['documentedSupport', 'documentedTension', 'constraintSatisfied', 'constraintViolated', 'constraintUnverified', 'unknown', 'notApplicable'].includes(effect.status as string)
        && Array.isArray(effect.evidenceIds) && uniqueStrings(effect.evidenceIds)
        && effect.evidenceIds.every(id => evidenceIds.has(id)), 'Évaluation de critère invalide.');
    }
    for (const effect of option.dimensionEffects) {
      check(isRecord(effect) && adviceDimensions.includes(effect.dimension as HopAdviceDimension)
        && ['documentarySupport', 'documentaryTension', 'conditional', 'unknown', 'structuralChange', 'notApplicable'].includes(effect.status as string)
        && nonEmpty(effect.statement) && nonEmpty(effect.reason) && Array.isArray(effect.evidenceIds)
        && uniqueStrings(effect.evidenceIds) && effect.evidenceIds.every(id => evidenceIds.has(id))
        && Array.isArray(effect.assertionIds) && uniqueStrings(effect.assertionIds)
        && Array.isArray(effect.criterionIds) && uniqueStrings(effect.criterionIds), 'Effet documentaire de dimension invalide.');
    }
    for (const exclusion of option.exclusions) check(isRecord(exclusion) && nonEmpty(exclusion.materialId)
      && ['excluded', 'retained', 'possible', 'unknown'].includes(exclusion.status as string) && nonEmpty(exclusion.reason), 'Exclusion d’option invalide.');
  }
  const informationRequests = value.informationRequests as Array<{ id: unknown }>;
  for (const option of value.options) {
    check(option.informationRequestIds.every((id: string) => informationRequests.some(request => request.id === id)), 'Demande d’information liée à une option inconnue.');
    check(nonEmpty(option.reference) && !optionReferences.has(option.reference as string), 'Référence d’option absente ou dupliquée.');
    const { id: _id, reference: _reference, ...content } = option as HopAdviceOption;
    check(option.reference === hopAdviceOptionReference(value.inputReference as string, content), 'Référence d’option incohérente avec ses raisons ou sa portée.');
    optionReferences.add(option.reference as string);
  }
  const requestIds = new Set<string>();
  for (const request of value.informationRequests) {
    check(isRecord(request) && nonEmpty(request.id) && !requestIds.has(request.id as string)
      && nonEmpty(request.question) && nonEmpty(request.whyDecisionChanging)
      && Array.isArray(request.optionIds) && uniqueStrings(request.optionIds)
      && request.optionIds.every(id => optionIds.has(id)), 'Demande d’information invalide.');
    requestIds.add(request.id as string);
  }
  check(isRecord(value.coverage) && ['completeWithinSuppliedScope', 'bounded', 'partial'].includes(value.coverage.status as string)
    && Array.isArray(value.coverage.consideredMaterialIds) && uniqueStrings(value.coverage.consideredMaterialIds)
    && Array.isArray(value.coverage.excludedMaterialIds) && uniqueStrings(value.coverage.excludedMaterialIds)
    && Array.isArray(value.coverage.contextOnlyMaterialIds) && uniqueStrings(value.coverage.contextOnlyMaterialIds)
    && Array.isArray(value.coverage.omittedMaterials) && Array.isArray(value.coverage.conditionalMaterials)
    && Array.isArray(value.coverage.limits) && value.coverage.limits.every(nonEmpty), 'Couverture de recherche invalide.');
  for (const rows of [value.coverage.omittedMaterials, value.coverage.conditionalMaterials]) {
    const ids = new Set<string>();
    for (const row of rows) {
      check(isRecord(row) && nonEmpty(row.materialId) && !ids.has(row.materialId as string)
        && Array.isArray(row.recordKeys) && uniqueStrings(row.recordKeys) && nonEmpty(row.reason), 'Limitation de qualification de matière invalide.');
      ids.add(row.materialId as string);
    }
  }
  check(value.coverage.omittedMaterials.length === 0 && value.coverage.conditionalMaterials.length === 0
    && value.coverage.contextOnlyMaterialIds.length === 0 || value.coverage.status === 'partial', 'Une matière omise, conditionnelle ou seulement contextuelle doit rendre la couverture partielle.');
  const nonActiveIds = new Set(value.coverage.omittedMaterials.map((row: any) => row.materialId));
  for (const option of value.options as HopAdviceOption[]) {
    if (option.programScope.kind === 'addOrReplace') {
      check(option.programScope.materialIds.every(id => !nonActiveIds.has(id)), 'Une matière omise/conditionnelle ne peut figurer dans une portée active.');
    }
  }
  check(value.limitations.every(nonEmpty), 'Limitation de conseil invalide.');
  const result = value as unknown as HopStrategyAdviceResult;
  check(nonEmpty(result.reference) && result.reference === hopAdviceResultReference(result), 'Référence du résultat incohérente avec son contenu.');
}
