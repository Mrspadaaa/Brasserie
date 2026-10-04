import { hopSourceError, validHopRange, type HopRange, type HopSource, type HopVariety } from '../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';

export const BREWING_SENSORY_CONTRACT_VERSION = 'brewing-sensory-v1' as const;
export const BREWING_SENSORY_REFERENCE_VERSION = 'brewing-sensory-reference-v1' as const;

export interface BrewingSensoryIdentity {
  id: string;
  version: string;
}

/** A semantic facet; family membership is classification and carries no amount. */
export interface BrewingSensoryDimension extends BrewingSensoryIdentity {
  name: string;
  definition: string;
  sourceRefs: HopSource[];
  familyRefs?: Array<{
    family: BrewingSensoryIdentity;
    relation: 'memberOf';
    sourceRefs: HopSource[];
  }>;
  /** Optional source vocabulary, never a score or intensity. */
  terms?: string[];
}

export type BrewingSensoryMetricKind = 'ordinalNote' | 'modelIndex' | 'measurement';

/** The quantity's meaning and unit are distinct from its chosen scale. */
export interface BrewingSensoryMetric extends BrewingSensoryIdentity {
  kind: BrewingSensoryMetricKind;
  name: string;
  meaning: string;
  unit: string | null;
  sourceRefs: HopSource[];
}

export interface BrewingSensoryScale extends BrewingSensoryIdentity {
  metricRef: BrewingSensoryIdentity;
  domain: HopRange | null;
  labels?: Array<{ value: number; label: string }>;
  sourceRefs: HopSource[];
}

/** Frozen definition and exact metric/scale pair used for a comparison. */
export interface BrewingSensoryDefinitionReference {
  version: typeof BREWING_SENSORY_REFERENCE_VERSION;
  dimension: BrewingSensoryDimension;
  metric: BrewingSensoryMetric | null;
  scale: BrewingSensoryScale | null;
  dimensionReference: string;
  contentReference: string;
}

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isFinite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const safeId = (value: unknown): value is string => isText(value) && value.length <= 120
  && !/[\\/]/.test(value) && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);
const onlyKeys = (value: Row, allowed: readonly string[]) => Object.keys(value).every(key => allowed.includes(key));
const identityError = (value: unknown): string | null => !isRow(value) || !safeId(value.id) || !safeId(value.version)
  ? 'Identité sémantique invalide.' : null;
const sourceRefsError = (value: unknown): string | null => !Array.isArray(value) || value.some(source => !!hopSourceError(source))
  ? 'Provenance sensorielle invalide.' : null;
const uniqueTexts = (value: unknown): value is string[] => Array.isArray(value) && value.every(isText) && new Set(value).size === value.length;

export function brewingSensoryDimensionError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['id', 'version', 'name', 'definition', 'sourceRefs', 'familyRefs', 'terms'])
    || identityError(value) || !isText(value.name) || !isText(value.definition) || sourceRefsError(value.sourceRefs)) return 'Définition de nuance invalide.';
  if (value.terms !== undefined && (!uniqueTexts(value.terms) || value.terms.length === 0)) return 'Lexique de nuance invalide.';
  if (value.familyRefs !== undefined) {
    if (!Array.isArray(value.familyRefs)) return 'Classification familiale invalide.';
    for (const item of value.familyRefs) {
      if (!isRow(item) || !onlyKeys(item, ['family', 'relation', 'sourceRefs']) || identityError(item.family)
        || item.relation !== 'memberOf' || sourceRefsError(item.sourceRefs)) return 'Classification familiale invalide.';
      const family = item.family as BrewingSensoryIdentity;
      if (family.id === value.id && family.version === value.version) return 'Une nuance ne peut se classer elle-même.';
    }
  }
  return null;
}

export function assertBrewingSensoryDimension(value: unknown): asserts value is BrewingSensoryDimension {
  const error = brewingSensoryDimensionError(value);
  if (error) throw Error(error);
}

export function brewingSensoryMetricError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['id', 'version', 'kind', 'name', 'meaning', 'unit', 'sourceRefs'])
    || identityError(value) || !['ordinalNote', 'modelIndex', 'measurement'].includes(String(value.kind))
    || !isText(value.name) || !isText(value.meaning) || (value.unit !== null && !isText(value.unit))
    || (value.kind === 'measurement' && !isText(value.unit)) || (value.kind === 'modelIndex' && !isText(value.unit))
    || sourceRefsError(value.sourceRefs)) return 'Métrique sensorielle invalide.';
  return null;
}

export function assertBrewingSensoryMetric(value: unknown): asserts value is BrewingSensoryMetric {
  const error = brewingSensoryMetricError(value);
  if (error) throw Error(error);
}

export function brewingSensoryScaleError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['id', 'version', 'metricRef', 'domain', 'labels', 'sourceRefs'])
    || identityError(value) || identityError(value.metricRef) || (value.domain !== null && !validHopRange(value.domain))
    || sourceRefsError(value.sourceRefs)) return 'Échelle sensorielle invalide.';
  if (value.labels !== undefined) {
    if (!Array.isArray(value.labels)) return 'Libellés d’échelle invalides.';
    const seen = new Set<number>();
    const domain = value.domain as HopRange | null;
    for (const label of value.labels) {
      if (!isRow(label) || !onlyKeys(label, ['value', 'label']) || !isFinite(label.value) || !isText(label.label)) return 'Libellés d’échelle invalides.';
      const labelValue = label.value as number;
      if (seen.has(labelValue) || (domain && (labelValue < domain.min || labelValue > domain.max))) return 'Libellés d’échelle invalides.';
      seen.add(labelValue);
    }
  }
  return null;
}

export function assertBrewingSensoryScale(value: unknown): asserts value is BrewingSensoryScale {
  const error = brewingSensoryScaleError(value);
  if (error) throw Error(error);
}

export function brewingSensoryContentReference(
  dimension: BrewingSensoryDimension,
  metric: BrewingSensoryMetric | null,
  scale: BrewingSensoryScale | null,
): string {
  assertBrewingSensoryDimension(dimension);
  if (metric !== null) assertBrewingSensoryMetric(metric);
  if (scale !== null) assertBrewingSensoryScale(scale);
  if ((metric === null) !== (scale === null)) throw Error('Une définition chiffrée exige la métrique et son échelle exactes.');
  if (metric && scale && (metric.id !== scale.metricRef.id || metric.version !== scale.metricRef.version)) {
    throw Error('L’échelle ne référence pas la métrique fournie.');
  }
  return hopAdviceContentReference('brewing-sensory-reference-v1', { dimension, metric, scale });
}

export function createBrewingSensoryDefinitionReference(
  dimension: BrewingSensoryDimension,
  metric: BrewingSensoryMetric | null = null,
  scale: BrewingSensoryScale | null = null,
): BrewingSensoryDefinitionReference {
  const definition = {
    version: BREWING_SENSORY_REFERENCE_VERSION,
    dimension: structuredClone(dimension),
    metric: metric === null ? null : structuredClone(metric),
    scale: scale === null ? null : structuredClone(scale),
    dimensionReference: hopAdviceContentReference('brewing-sensory-dimension-v1', dimension),
    contentReference: brewingSensoryContentReference(dimension, metric, scale),
  } satisfies BrewingSensoryDefinitionReference;
  assertBrewingSensoryDefinitionReference(definition);
  return definition;
}

export function brewingSensoryDefinitionReferenceError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['version', 'dimension', 'metric', 'scale', 'dimensionReference', 'contentReference'])
    || value.version !== BREWING_SENSORY_REFERENCE_VERSION || brewingSensoryDimensionError(value.dimension)
    || (value.metric !== null && brewingSensoryMetricError(value.metric)) || (value.scale !== null && brewingSensoryScaleError(value.scale))
    || !isText(value.dimensionReference) || !isText(value.contentReference)) return 'Référence de définition sensorielle invalide.';
  const dimension = value.dimension as BrewingSensoryDimension;
  const metric = value.metric as BrewingSensoryMetric | null;
  const scale = value.scale as BrewingSensoryScale | null;
  if ((metric === null) !== (scale === null)) return 'Métrique et échelle doivent être conservées ensemble.';
  if (metric && scale && (metric.id !== scale.metricRef.id || metric.version !== scale.metricRef.version)) return 'Métrique et échelle incompatibles.';
  try {
    if (value.dimensionReference !== hopAdviceContentReference('brewing-sensory-dimension-v1', dimension)
      || value.contentReference !== brewingSensoryContentReference(dimension, metric, scale)) return 'Empreinte de définition sensorielle périmée.';
  } catch { return 'Référence de définition sensorielle non sérialisable.'; }
  return null;
}

export function assertBrewingSensoryDefinitionReference(value: unknown): asserts value is BrewingSensoryDefinitionReference {
  const error = brewingSensoryDefinitionReferenceError(value);
  if (error) throw Error(error);
}

export interface BrewingSensoryLexicalRule extends BrewingSensoryIdentity {
  dimensionRef: BrewingSensoryIdentity;
  terms: string[];
  negationPrefixes?: string[];
  qualifierTerms?: string[];
  sourceRefs: HopSource[];
}

export type BrewingSensoryDocumentQualification = 'affirmed' | 'qualified' | 'negated';

export interface BrewingSensoryDocumentaryMention {
  dimensionRef: BrewingSensoryIdentity;
  lexicalRuleRef: BrewingSensoryIdentity;
  term: string;
  context: HopVariety['descriptions'][number]['context'];
  text: string;
  source: HopSource;
  qualification: BrewingSensoryDocumentQualification;
  qualifierTerm?: string;
}

export type BrewingSensoryDocumentaryStatus = 'documented' | 'negated' | 'mixed' | 'nonDocumented' | 'unresolved';

export interface BrewingSensoryDocumentaryDimension {
  dimension: BrewingSensoryDimension;
  status: BrewingSensoryDocumentaryStatus;
  ruleRefs: BrewingSensoryIdentity[];
  mentions: BrewingSensoryDocumentaryMention[];
}

export interface BrewingSensoryDocumentaryExtraction {
  version: 'brewing-sensory-documentary-v1';
  subject: { id: string; name: string };
  lexicalRules: BrewingSensoryLexicalRule[];
  /** Every original source description is kept, including rows with no match. */
  descriptions: HopVariety['descriptions'];
  dimensions: BrewingSensoryDocumentaryDimension[];
}

export interface BrewingSensoryUnresolvedLabel {
  status: 'unresolved';
  rawLabel: string;
  sourceRefs: HopSource[];
  context?: HopVariety['descriptions'][number]['context'];
  text?: string;
}

function lexicalRuleError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['id', 'version', 'dimensionRef', 'terms', 'negationPrefixes', 'qualifierTerms', 'sourceRefs'])
    || identityError(value) || identityError(value.dimensionRef) || !uniqueTexts(value.terms) || value.terms.length === 0
    || (value.negationPrefixes !== undefined && !uniqueTexts(value.negationPrefixes))
    || (value.qualifierTerms !== undefined && !uniqueTexts(value.qualifierTerms)) || sourceRefsError(value.sourceRefs)) return 'Règle lexicale sensorielle invalide.';
  return null;
}

function normalizedLexeme(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr-CH').trim().replace(/\s+/g, ' ');
}

function phraseMatchIndices(value: string, phrase: string): number[] {
  const normalized = normalizedLexeme(phrase);
  if (!normalized) return [];
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
  const expression = new RegExp(`(^|[^\\p{L}\\p{N}])(${escaped})(?=$|[^\\p{L}\\p{N}])`, 'gu');
  const indices: number[] = [];
  for (const match of value.matchAll(expression)) indices.push(match.index! + match[1].length);
  return indices;
}

function matchingTerms(text: string, terms: string[]): string[] {
  const normalized = normalizedLexeme(text);
  return terms.filter(term => phraseMatchIndices(normalized, term).length > 0);
}

function precedingConfiguredTerm(textBeforeMatch: string, terms: string[] | undefined): string | undefined {
  if (!terms) return undefined;
  const before = textBeforeMatch.trimEnd();
  return [...terms].sort((a, b) => normalizedLexeme(b).length - normalizedLexeme(a).length)
    .find(term => {
      const normalized = normalizedLexeme(term);
      return before === normalized || before.endsWith(` ${normalized}`);
    });
}

function mentionsForDescription(
  description: HopVariety['descriptions'][number],
  dimensionRef: BrewingSensoryIdentity,
  rules: BrewingSensoryLexicalRule[],
): BrewingSensoryDocumentaryMention[] {
  const normalizedText = normalizedLexeme(description.text);
  const mentions: BrewingSensoryDocumentaryMention[] = [];
  for (const rule of rules) {
    for (const term of matchingTerms(description.text, rule.terms)) {
      const emitted = new Set<string>();
      for (const termIndex of phraseMatchIndices(normalizedText, term)) {
        const negation = precedingConfiguredTerm(normalizedText.slice(0, termIndex), rule.negationPrefixes);
        const qualifier = precedingConfiguredTerm(normalizedText.slice(0, termIndex), rule.qualifierTerms);
        const qualification = negation ? 'negated' : qualifier ? 'qualified' : 'affirmed';
        const mentionKey = `${qualification}\u0000${normalizedLexeme(qualifier ?? '')}`;
        // Repeated words stay in the preserved original text; their frequency is never a score.
        if (emitted.has(mentionKey)) continue;
        emitted.add(mentionKey);
        mentions.push({
          dimensionRef: structuredClone(dimensionRef), lexicalRuleRef: { id: rule.id, version: rule.version }, term,
          context: description.context, text: description.text, source: structuredClone(description.source),
          qualification,
          ...(qualifier && !negation ? { qualifierTerm: qualifier } : {}),
        });
      }
    }
  }
  return mentions;
}

export function extractBrewingSensoryDocumentaryEvidence(
  variety: Pick<HopVariety, 'id' | 'name' | 'descriptions'>,
  dimensions: BrewingSensoryDimension[],
  lexicalRules: BrewingSensoryLexicalRule[],
): BrewingSensoryDocumentaryExtraction {
  if (!safeId(variety.id) || !isText(variety.name) || !Array.isArray(variety.descriptions)) throw Error('Sujet documentaire sensoriel invalide.');
  dimensions.forEach(assertBrewingSensoryDimension);
  const dimensionIds = new Set<string>();
  for (const dimension of dimensions) {
    const key = `${dimension.id}\u0000${dimension.version}`;
    if (dimensionIds.has(key)) throw Error('Définition sensorielle répétée; les versions doivent rester distinctes.');
    dimensionIds.add(key);
  }
  const ruleIds = new Set<string>();
  for (const rule of lexicalRules) {
    const error = lexicalRuleError(rule);
    if (error) throw Error(error);
    const key = `${rule.id}\u0000${rule.version}\u0000${rule.dimensionRef.id}\u0000${rule.dimensionRef.version}`;
    if (ruleIds.has(key)) throw Error('Version de règle lexicale répétée.');
    ruleIds.add(key);
    if (!dimensions.some(dimension => dimension.id === rule.dimensionRef.id && dimension.version === rule.dimensionRef.version)) {
      throw Error('La règle lexicale référence une définition inconnue.');
    }
  }
  const descriptions = structuredClone(variety.descriptions);
  for (const description of descriptions) {
    if (!isRow(description) || !isText(description.text) || !['rawHop', 'infusion', 'beer', 'unspecified'].includes(description.context)
      || hopSourceError(description.source)) throw Error('Description source invalide; aucun texte n’a été écarté.');
  }
  const results = dimensions.map(dimension => {
    const rules = lexicalRules.filter(rule => rule.dimensionRef.id === dimension.id && rule.dimensionRef.version === dimension.version);
    const mentions = descriptions.flatMap(description => rules.length ? mentionsForDescription(description, dimension, rules) : []);
    const positive = mentions.some(mention => mention.qualification !== 'negated');
    const negative = mentions.some(mention => mention.qualification === 'negated');
    const status: BrewingSensoryDocumentaryStatus = !rules.length || !descriptions.length ? 'unresolved'
      : positive && negative ? 'mixed' : positive ? 'documented' : negative ? 'negated' : 'nonDocumented';
    return { dimension: structuredClone(dimension), status, ruleRefs: rules.map(({ id, version }) => ({ id, version })), mentions };
  });
  const extraction: BrewingSensoryDocumentaryExtraction = {
    version: 'brewing-sensory-documentary-v1',
    subject: { id: variety.id, name: variety.name },
    lexicalRules: structuredClone(lexicalRules), descriptions,
    dimensions: results,
  };
  assertBrewingSensoryDocumentaryExtraction(extraction);
  return extraction;
}

export function brewingSensoryUnresolvedLabelError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['status', 'rawLabel', 'sourceRefs', 'context', 'text']) || value.status !== 'unresolved'
    || !isText(value.rawLabel) || sourceRefsError(value.sourceRefs)
    || (value.context !== undefined && !['rawHop', 'infusion', 'beer', 'unspecified'].includes(String(value.context)))
    || (value.text !== undefined && !isText(value.text))) return 'Libellé sensoriel non résolu invalide.';
  return null;
}

export function assertBrewingSensoryUnresolvedLabel(value: unknown): asserts value is BrewingSensoryUnresolvedLabel {
  const error = brewingSensoryUnresolvedLabelError(value);
  if (error) throw Error(error);
}

export const BREWING_SENSORY_COMPARISON_VERSION = 'brewing-sensory-comparison-v1' as const;
export interface BrewingSensoryComparisonContext extends BrewingSensoryIdentity {
  kind: string;
  contentReference: string;
  label: string;
  sourceRefs: HopSource[];
}

export interface BrewingSensoryComparisonReference extends BrewingSensoryIdentity {
  kind: string;
  contentReference: string;
  sourceRefs: HopSource[];
}

export interface BrewingSensoryComparisonCandidate {
  /** Stable series identity; variants and independent observations use distinct IDs. */
  id: string;
  name: string;
}

/** Validates candidate IDs exactly as supplied; it never trims or normalizes them. */
export function brewingSensoryCandidatesError(value: unknown): string | null {
  if (!Array.isArray(value)) return 'Liste de séries sensorielles invalide.';
  const ids = new Set<string>();
  for (const candidate of value) {
    if (!isRow(candidate) || !onlyKeys(candidate, ['id', 'name']) || !safeId(candidate.id) || !isText(candidate.name)
      || ids.has(candidate.id)) return 'Candidat sensoriel invalide.';
    ids.add(candidate.id);
  }
  return null;
}

export function assertBrewingSensoryCandidates(value: unknown): asserts value is BrewingSensoryComparisonCandidate[] {
  const error = brewingSensoryCandidatesError(value);
  if (error) throw Error(error);
}

export interface BrewingSensoryValueProvenance {
  sourceRefs: HopSource[];
  modelRef?: BrewingSensoryIdentity;
  hypothesisRefs?: string[];
  explanation: string;
  limitations: string[];
}

export type BrewingSensoryNumericStatus = 'observed' | 'hypothetical' | 'target';

export type BrewingSensoryComparisonValue =
  | { candidateId: string; status: BrewingSensoryNumericStatus; value: number; provenance: BrewingSensoryValueProvenance }
  | { candidateId: string; status: BrewingSensoryNumericStatus; range: HopRange; central?: number; provenance: BrewingSensoryValueProvenance }
  | { candidateId: string; status: 'documented'; mentions: BrewingSensoryDocumentaryMention[]; provenance: BrewingSensoryValueProvenance }
  | { candidateId: string; status: 'nonDocumented' | 'unknown'; reason: string; provenance: BrewingSensoryValueProvenance };

export interface BrewingSensoryComparisonDimension {
  /** Exact reference key keeps incompatible scales/versions in separate groups. */
  referenceGroupId: string;
  definition: BrewingSensoryDefinitionReference;
  /** Exactly one cell per comparison series; missing cells must be explicit unknown/nonDocumented values. */
  values: BrewingSensoryComparisonValue[];
}

export interface BrewingSensoryComparisonDTO {
  version: typeof BREWING_SENSORY_COMPARISON_VERSION;
  context: BrewingSensoryComparisonContext;
  reference: BrewingSensoryComparisonReference;
  candidateOrder: string[];
  candidates: BrewingSensoryComparisonCandidate[];
  dimensionOrder: string[];
  dimensions: BrewingSensoryComparisonDimension[];
}

/** Validates a set of frozen definitions without collapsing distinct scale groups. */
export function brewingSensoryDefinitionSetError(value: unknown): string | null {
  if (!Array.isArray(value)) return 'Ensemble de définitions sensorielles invalide.';
  const fullReferences = new Set<string>();
  const semanticDefinitions = new Map<string, string>();
  const metricDefinitions = new Map<string, string>();
  const scaleDefinitions = new Map<string, string>();
  for (const item of value) {
    const error = brewingSensoryDefinitionReferenceError(item);
    if (error) return error;
    const definition = item as BrewingSensoryDefinitionReference;
    if (fullReferences.has(definition.contentReference)) return 'Référence de définition sensorielle répétée.';
    fullReferences.add(definition.contentReference);
    const dimensionIdentity = `${definition.dimension.id}\u0000${definition.dimension.version}`;
    const priorDimension = semanticDefinitions.get(dimensionIdentity);
    if (priorDimension && priorDimension !== definition.dimensionReference) return 'Une version de dimension référence deux définitions différentes.';
    semanticDefinitions.set(dimensionIdentity, definition.dimensionReference);
    try {
      if (definition.metric) {
        const metricIdentity = `${definition.metric.id}\u0000${definition.metric.version}`;
        const metricReference = hopAdviceContentReference('brewing-sensory-metric-v1', definition.metric);
        const priorMetric = metricDefinitions.get(metricIdentity);
        if (priorMetric && priorMetric !== metricReference) return 'Une version de métrique référence deux sens ou unités différents.';
        metricDefinitions.set(metricIdentity, metricReference);
      }
      if (definition.scale) {
        const scaleIdentity = `${definition.scale.id}\u0000${definition.scale.version}`;
        const scaleReference = hopAdviceContentReference('brewing-sensory-scale-v1', definition.scale);
        const priorScale = scaleDefinitions.get(scaleIdentity);
        if (priorScale && priorScale !== scaleReference) return 'Une version d’échelle référence deux domaines différents.';
        scaleDefinitions.set(scaleIdentity, scaleReference);
      }
    } catch { return 'Définition ou échelle non sérialisable.'; }
  }
  return null;
}

export function assertBrewingSensoryDefinitionSet(value: unknown): asserts value is BrewingSensoryDefinitionReference[] {
  const error = brewingSensoryDefinitionSetError(value);
  if (error) throw Error(error);
}

function comparisonIdentityError(value: unknown, label: string): string | null {
  return !isRow(value) || !onlyKeys(value, ['id', 'version', 'kind', 'contentReference', ...(label === 'context' ? ['label'] : []), 'sourceRefs'])
    || identityError(value) || !isText(value.kind) || !isText(value.contentReference) || sourceRefsError(value.sourceRefs)
    || (label === 'context' && !isText(value.label)) ? `Référence de ${label} sensorielle invalide.` : null;
}

function provenanceError(value: unknown, status: BrewingSensoryComparisonValue['status']): string | null {
  if (!isRow(value) || !onlyKeys(value, ['sourceRefs', 'modelRef', 'hypothesisRefs', 'explanation', 'limitations'])
    || sourceRefsError(value.sourceRefs) || !isText(value.explanation) || !Array.isArray(value.limitations) || !value.limitations.every(isText)
    || (value.modelRef !== undefined && identityError(value.modelRef))
    || (value.hypothesisRefs !== undefined && !uniqueTexts(value.hypothesisRefs))) return 'Provenance de valeur sensorielle invalide.';
  if (status === 'hypothetical' && !value.modelRef && !(value.hypothesisRefs as string[] | undefined)?.length && !(value.sourceRefs as HopSource[]).length) {
    return 'Une projection hypothétique doit référencer son modèle, ses hypothèses ou ses sources.';
  }
  return null;
}

function mentionError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['dimensionRef', 'lexicalRuleRef', 'term', 'context', 'text', 'source', 'qualification', 'qualifierTerm'])
    || identityError(value.dimensionRef) || identityError(value.lexicalRuleRef) || !isText(value.term) || !isText(value.text)
    || !['rawHop', 'infusion', 'beer', 'unspecified'].includes(String(value.context)) || hopSourceError(value.source)
    || !['affirmed', 'qualified', 'negated'].includes(String(value.qualification))
    || (value.qualifierTerm !== undefined && !isText(value.qualifierTerm))) return 'Mention documentaire sensorielle invalide.';
  return null;
}

export function brewingSensoryDocumentaryMentionError(value: unknown): string | null {
  return mentionError(value);
}

export function assertBrewingSensoryDocumentaryMention(value: unknown): asserts value is BrewingSensoryDocumentaryMention {
  const error = mentionError(value);
  if (error) throw Error(error);
}

function hopDescriptionError(value: unknown): string | null {
  return !isRow(value) || !onlyKeys(value, ['text', 'context', 'source']) || !isText(value.text)
    || !['rawHop', 'infusion', 'beer', 'unspecified'].includes(String(value.context)) || !!hopSourceError(value.source)
    ? 'Description source invalide.' : null;
}

export function brewingSensoryDocumentaryExtractionError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['version', 'subject', 'lexicalRules', 'descriptions', 'dimensions'])
    || value.version !== 'brewing-sensory-documentary-v1' || !isRow(value.subject) || !onlyKeys(value.subject, ['id', 'name'])
    || !safeId(value.subject.id) || !isText(value.subject.name) || !Array.isArray(value.lexicalRules)
    || !Array.isArray(value.descriptions) || !Array.isArray(value.dimensions)) return 'Extraction documentaire sensorielle invalide.';
  const rules = value.lexicalRules as unknown[];
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    const error = lexicalRuleError(rule);
    if (error) return error;
    const typed = rule as BrewingSensoryLexicalRule;
    const key = `${typed.id}\u0000${typed.version}\u0000${typed.dimensionRef.id}\u0000${typed.dimensionRef.version}`;
    if (ruleIds.has(key)) return 'Version de règle lexicale répétée.';
    ruleIds.add(key);
  }
  if (rules.some((rule: any) => !(value.dimensions as any[]).some(row => row?.dimension?.id === rule.dimensionRef.id && row?.dimension?.version === rule.dimensionRef.version))) {
    return 'Règle lexicale sans dimension dans l’extraction.';
  }
  for (const description of value.descriptions) if (hopDescriptionError(description)) return 'Description source invalide.';
  const seenDimensions = new Set<string>();
  for (const dimensionRow of value.dimensions) {
    if (!isRow(dimensionRow) || !onlyKeys(dimensionRow, ['dimension', 'status', 'ruleRefs', 'mentions'])
      || brewingSensoryDimensionError(dimensionRow.dimension) || !['documented', 'negated', 'mixed', 'nonDocumented', 'unresolved'].includes(String(dimensionRow.status))
      || !Array.isArray(dimensionRow.ruleRefs) || !Array.isArray(dimensionRow.mentions)) return 'État documentaire de nuance invalide.';
    const dimension = dimensionRow.dimension as BrewingSensoryDimension;
    const dimensionKey = `${dimension.id}\u0000${dimension.version}`;
    if (seenDimensions.has(dimensionKey)) return 'Dimension documentaire répétée.';
    seenDimensions.add(dimensionKey);
    const expectedRules = rules.filter((rule: any) => rule.dimensionRef.id === dimension.id && rule.dimensionRef.version === dimension.version) as BrewingSensoryLexicalRule[];
    const ruleRefs = dimensionRow.ruleRefs as unknown[];
    const listedRuleKeys = new Set<string>();
    if (ruleRefs.length !== expectedRules.length || ruleRefs.some(ref => {
      if (!isRow(ref) || !onlyKeys(ref, ['id', 'version']) || !safeId(ref.id) || !safeId(ref.version)) return true;
      const key = `${ref.id}\u0000${ref.version}`;
      if (listedRuleKeys.has(key) || !expectedRules.some(rule => rule.id === ref.id && rule.version === ref.version)) return true;
      listedRuleKeys.add(key);
      return false;
    })) return 'Versions de règles de nuance incohérentes.';
    const mentions = dimensionRow.mentions as unknown[];
    for (const mention of mentions) {
      const error = mentionError(mention);
      if (error) return error;
      const typed = mention as BrewingSensoryDocumentaryMention;
      const matchingRule = expectedRules.find(rule => rule.id === typed.lexicalRuleRef.id && rule.version === typed.lexicalRuleRef.version
        && rule.terms.includes(typed.term));
      if (typed.dimensionRef.id !== dimension.id || typed.dimensionRef.version !== dimension.version || !matchingRule) {
        return 'Mention sans définition ou règle lexicale correspondante.';
      }
      const normalizedText = normalizedLexeme(typed.text);
      const validQualification = phraseMatchIndices(normalizedText, typed.term).some(termIndex => {
        const negation = precedingConfiguredTerm(normalizedText.slice(0, termIndex), matchingRule.negationPrefixes);
        const qualifier = precedingConfiguredTerm(normalizedText.slice(0, termIndex), matchingRule.qualifierTerms);
        return (negation ? 'negated' : qualifier ? 'qualified' : 'affirmed') === typed.qualification
          && (typed.qualification !== 'qualified' || qualifier === typed.qualifierTerm);
      });
      if (!validQualification) return 'Qualification lexicale sans appui dans le texte original.';
      const preserved = (value.descriptions as HopVariety['descriptions']).some(description => description.text === typed.text
        && description.context === typed.context && hopAdviceContentReference('brewing-sensory-source-v1', description.source)
          === hopAdviceContentReference('brewing-sensory-source-v1', typed.source));
      if (!preserved) return 'La source originale de la mention n’est pas conservée.';
    }
    const positive = mentions.some((mention: any) => mention.qualification !== 'negated');
    const negative = mentions.some((mention: any) => mention.qualification === 'negated');
    const expectedStatus: BrewingSensoryDocumentaryStatus = !expectedRules.length || !(value.descriptions as unknown[]).length ? 'unresolved'
      : positive && negative ? 'mixed' : positive ? 'documented' : negative ? 'negated' : 'nonDocumented';
    if (dimensionRow.status !== expectedStatus) return 'Statut documentaire incompatible avec les mentions conservées.';
  }
  return null;
}

export function assertBrewingSensoryDocumentaryExtraction(value: unknown): asserts value is BrewingSensoryDocumentaryExtraction {
  const error = brewingSensoryDocumentaryExtractionError(value);
  if (error) throw Error(error);
}

function comparisonValueError(value: unknown, definition: BrewingSensoryDefinitionReference, candidateIds: Set<string>): string | null {
  if (!isRow(value) || !isText(value.candidateId) || !candidateIds.has(value.candidateId)) return 'Valeur sensorielle sans candidat.';
  const status = value.status as BrewingSensoryComparisonValue['status'];
  const provenance = provenanceError(value.provenance, status);
  if (provenance) return provenance;
  if (['observed', 'hypothetical', 'target'].includes(String(status))) {
    if (!definition.metric || !definition.scale) return 'Valeur chiffrée sans métrique et échelle exactes.';
    const hasValue = isFinite(value.value);
    const hasRange = validHopRange(value.range);
    if (hasValue === hasRange || (value.central !== undefined && (!hasRange || !isFinite(value.central)
      || (value.central as number) < (value.range as HopRange).min || (value.central as number) > (value.range as HopRange).max))) return 'Valeur, plage ou point central incohérent.';
    if (value.domain !== undefined || value.unit !== undefined || value.scale !== undefined) return 'Échelle propre à la référence; aucune conversion locale n’est acceptée.';
    const numeric = hasValue ? [value.value as number] : [(value.range as HopRange).min, (value.range as HopRange).max,
      ...(value.central !== undefined ? [value.central as number] : [])];
    const domain = definition.scale.domain;
    if (domain && numeric.some(number => number < domain.min || number > domain.max)) return 'Valeur hors de l’échelle exacte.';
    return onlyKeys(value, ['candidateId', 'status', 'value', 'range', 'central', 'provenance']) ? null : 'Champ de valeur sensorielle inconnu.';
  }
  if (status === 'documented') {
    if (value.value !== undefined || value.range !== undefined || value.central !== undefined || !Array.isArray(value.mentions)
      || value.mentions.length === 0 || value.mentions.some((mention: unknown) => !!mentionError(mention))) return 'Valeur documentaire sans mention source valide.';
    return onlyKeys(value, ['candidateId', 'status', 'mentions', 'provenance']) ? null : 'Champ documentaire sensoriel inconnu.';
  }
  if (status === 'nonDocumented' || status === 'unknown') {
    if (!isText(value.reason) || value.value !== undefined || value.range !== undefined || value.central !== undefined) return 'Une inconnue ou non-mention ne porte pas de valeur.';
    return onlyKeys(value, ['candidateId', 'status', 'reason', 'provenance']) ? null : 'Champ d’inconnue sensorielle inconnu.';
  }
  return 'Statut sensoriel inconnu.';
}

export function brewingSensoryComparisonError(value: unknown): string | null {
  if (!isRow(value) || !onlyKeys(value, ['version', 'context', 'reference', 'candidateOrder', 'candidates', 'dimensionOrder', 'dimensions'])
    || value.version !== BREWING_SENSORY_COMPARISON_VERSION || comparisonIdentityError(value.context, 'context')
    || comparisonIdentityError(value.reference, 'reference') || !Array.isArray(value.candidateOrder) || !uniqueTexts(value.candidateOrder)
    || !Array.isArray(value.candidates) || !Array.isArray(value.dimensionOrder) || !uniqueTexts(value.dimensionOrder)
    || !Array.isArray(value.dimensions)) return 'Comparaison sensorielle invalide.';
  const candidatesError = brewingSensoryCandidatesError(value.candidates);
  if (candidatesError) return candidatesError;
  for (const dimension of value.dimensions) {
    if (!isRow(dimension) || !onlyKeys(dimension, ['referenceGroupId', 'definition', 'values']) || !Array.isArray(dimension.values)) {
      return 'Groupe de comparaison sensorielle invalide.';
    }
  }
  const definitionsError = brewingSensoryDefinitionSetError(value.dimensions.map((dimension: Row) => dimension.definition));
  if (definitionsError) return definitionsError;
  const candidateIds = new Set((value.candidates as BrewingSensoryComparisonCandidate[]).map(candidate => candidate.id));
  if (candidateIds.size !== value.candidateOrder.length || value.candidateOrder.some((id: string) => !candidateIds.has(id))) return 'Ordre des candidats incomplet ou incohérent.';
  const dimensionRefs = new Set<string>();
  for (const dimension of value.dimensions) {
    if (!isRow(dimension)) return 'Groupe de comparaison sensorielle invalide.';
    const definition = dimension.definition as BrewingSensoryDefinitionReference;
    const referenceGroupId = definition.contentReference;
    if (dimension.referenceGroupId !== referenceGroupId || dimensionRefs.has(referenceGroupId)) return 'Référence incompatible ou groupe dupliqué.';
    dimensionRefs.add(referenceGroupId);
    const seriesWithValues = new Set<string>();
    for (const entry of dimension.values as unknown[]) {
      if (!isRow(entry) || !isText(entry.candidateId) || !candidateIds.has(entry.candidateId)) return 'Valeur sensorielle sans série connue.';
      if (seriesWithValues.has(entry.candidateId)) return 'Une seule valeur/statut est admis par série et groupe.';
      seriesWithValues.add(entry.candidateId);
      const error = comparisonValueError(entry, definition, candidateIds);
      if (error) return error;
    }
    if (seriesWithValues.size !== candidateIds.size || [...candidateIds].some(candidateId => !seriesWithValues.has(candidateId))) {
      return 'Couverture sensorielle incomplète : expliciter unknown ou nonDocumented pour chaque série.';
    }
  }
  if (dimensionRefs.size !== value.dimensionOrder.length || value.dimensionOrder.some((reference: string) => !dimensionRefs.has(reference))) return 'Ordre des dimensions incomplet ou incohérent.';
  return null;
}

export function assertBrewingSensoryComparison(value: unknown): asserts value is BrewingSensoryComparisonDTO {
  const error = brewingSensoryComparisonError(value);
  if (error) throw Error(error);
}

/** Preserves input order and refuses duplicate or missing cells; it never fills an unknown implicitly. */
export function createBrewingSensoryComparison(
  input: Omit<BrewingSensoryComparisonDTO, 'version' | 'dimensions'> & {
    dimensions: Array<Omit<BrewingSensoryComparisonDimension, 'referenceGroupId'>>;
  },
): BrewingSensoryComparisonDTO {
  const comparison: BrewingSensoryComparisonDTO = structuredClone({
    ...input, version: BREWING_SENSORY_COMPARISON_VERSION,
    dimensions: input.dimensions.map(dimension => ({ ...dimension, referenceGroupId: dimension.definition.contentReference })),
  });
  assertBrewingSensoryComparison(comparison);
  return comparison;
}
