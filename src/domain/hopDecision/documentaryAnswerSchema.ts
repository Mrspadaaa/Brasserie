import { HOP_FORMS, assertHopDocument, hopMeasurementError, hopSourceError, validHopRange, type HopDescription, type HopProductForm, type HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAdviceAssertion, HopAdviceDimension, HopAdviceEvidenceSource } from './adviceSchema';
import { hopAdviceContentReference } from './adviceContentReference';
import type { HopIntentEvidenceCriterion, HopIntentEvidenceEvaluation, HopIntentEvidencePartner, HopIntentEvidenceStatus } from './intentEvidence';
import type { HopDecisionMaterial, HopProcessStage, HopUse } from './types';

export const HOP_DOCUMENTARY_REQUEST_VERSION = 'hop-documentary-request-v1' as const;
export const HOP_DOCUMENTARY_CORPUS_VERSION = 'hop-documentary-corpus-v1' as const;
export const HOP_DOCUMENTARY_ANSWER_VERSION = 'hop-documentary-answer-v1' as const;

export type HopDocumentaryNeedKind = 'balancePerceivedSweetness' | 'aromaPairing' | 'lowAlcoholCharacter' | 'unresolved';
export type HopDocumentaryIntervention = 'none' | 'changeBitterness' | 'changeAroma' | 'involveCulture';
export type HopDocumentaryScope = 'bulkBeer' | 'sampling' | 'separatePortion' | 'futureBrew' | 'documentation';
export interface HopDocumentaryAccess {
  state: 'yes' | 'no' | 'unknown';
  basis: string;
  assertionIds: string[];
}
export interface HopDocumentaryRequest {
  format: typeof HOP_DOCUMENTARY_REQUEST_VERSION;
  id: string;
  originalQuestion: string;
  interpretation: { id: string; version: string; text: string; origin: 'user' | 'proposal' };
  criteria: HopIntentEvidenceCriterion[];
  needs: Array<{ id: string; kind: HopDocumentaryNeedKind; criterionIds: string[]; explanation: string; candidateIds?: string[] }>;
  context: {
    stage: HopProcessStage | 'unknown';
    stageBasis: string;
    assertions: HopAdviceAssertion[];
    access: { bulkBeer: HopDocumentaryAccess; sampling: HopDocumentaryAccess; separatePortion: HopDocumentaryAccess };
  };
  exclusions: Array<{ id: string; intervention: Exclude<HopDocumentaryIntervention, 'none'>;
    certainty: 'certain' | 'possible' | 'unknown'; criterionIds: string[]; reason: string }>;
  /** Explicitly supplied documentary candidates, never a complete catalogue claim. */
  materials: HopDecisionMaterial[];
}

export interface HopDocumentarySource {
  id: string;
  nature: 'manufacturerClaim' | 'research' | 'brewerInterview' | 'editorialMapping';
  source: HopSource;
  locator: string;
  readingLevel: HopAdviceEvidenceSource['readingLevel'];
  domain: string;
  limits: string[];
}
export interface HopDocumentaryClaim {
  id: string;
  version: string;
  statement: string;
  sourceIds: string[];
  role: 'support' | 'limit' | 'context';
  domain: string;
  transferConditions: string[];
  forbiddenInferences: string[];
}
export interface HopDocumentaryCorpus {
  format: typeof HOP_DOCUMENTARY_CORPUS_VERSION;
  version: string;
  sources: HopDocumentarySource[];
  claims: HopDocumentaryClaim[];
  reference: string;
}
export interface HopDocumentaryArgument {
  id: string;
  kind: 'userFact' | 'userGoal' | 'proposedReading' | 'documentaryFact' | 'adviceInference' | 'trialHypothesis';
  text: string;
  criterionIds: string[];
  assertionIds: string[];
  claimIds: string[];
  materialEvidence: Array<{ materialId: string; criterionId: string; evaluation: HopIntentEvidenceEvaluation }>;
}
export interface HopDocumentaryCondition {
  id: string;
  state: 'met' | 'unmet' | 'unknown';
  description: string;
  assertionIds: string[];
  criterionIds: string[];
}
export interface HopDocumentaryPreparation {
  documentaryDossier: { status: 'available'; kind: 'choice' | 'trialToQualify' | 'futureStudy'; label: string };
  operational: { status: 'notProvided' | 'requiresReceivedAdapter'; adapterId: string | null; reason: string };
  missingRequirements: string[];
  refusalReasons: string[];
}
export interface HopDocumentaryRoute {
  id: string;
  needIds: string[];
  criterionIds: string[];
  title: string;
  purpose: string;
  scope: HopDocumentaryScope;
  intervention: HopDocumentaryIntervention;
  argumentIds: string[];
  materialIds: string[];
  /** Source-bound product identity only, not a HopDecisionMaterial or stock record. */
  documentaryProductRefs: Array<{ id: string; name: string; claimIds: string[] }>;
  applicability: { status: 'conditionsMet' | 'missingConditions' | 'incompatible' | 'notEvaluated'; conditions: HopDocumentaryCondition[] };
  preparation: HopDocumentaryPreparation;
  reference: string;
}
export interface HopDocumentaryAnswer {
  format: typeof HOP_DOCUMENTARY_ANSWER_VERSION;
  requestSnapshot: HopDocumentaryRequest;
  corpusSnapshot: HopDocumentaryCorpus;
  inputReference: string;
  interpretationReference: string;
  coverage: {
    status: 'answered' | 'partial' | 'outOfScope';
    domain: string;
    points: Array<{ needId: string; status: 'answered' | 'partial' | 'unresolved'; reason: string; argumentIds: string[]; routeIds: string[] }>;
    unresolvedCriteria: Array<{ criterionId: string; reason: string }>;
  };
  body: Array<{ id: string; text: string; argumentIds: string[] }>;
  arguments: HopDocumentaryArgument[];
  routes: HopDocumentaryRoute[];
  limits: string[];
  reference: string;
}
export interface HopDocumentaryDossier {
  format: 'hop-documentary-dossier-v1';
  id: string;
  answerSnapshot: HopDocumentaryAnswer;
  answerReference: string;
  interpretationReference: string;
  routeId: string;
  routeReference: string;
  motive: string;
  createdAt: string;
  createdBy: { origin: 'user' | 'proposal' | 'fixture'; label: string };
  preparation: HopDocumentaryPreparation;
  reference: string;
}

export type HopDocumentaryAnswerReadResult =
  | { status: 'readOnly'; answer: HopDocumentaryAnswer }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };
export type HopDocumentaryDossierReadResult =
  | { status: 'readOnly'; dossier: HopDocumentaryDossier }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string };

export interface CreateHopDocumentaryCorpusInput {
  version: string;
  sources: HopDocumentarySource[];
  claims: HopDocumentaryClaim[];
}

export interface CreateHopDocumentaryDossierInput {
  id: string;
  answer: HopDocumentaryAnswer;
  expectedAnswerReference: string;
  expectedInterpretationReference: string;
  routeId: string;
  expectedRouteReference: string;
  motive: string;
  createdAt: string;
  createdBy: HopDocumentaryDossier['createdBy'];
}

type Row = Record<string, any>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const nonempty = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const stages: readonly HopProcessStage[] = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'];
const uses: readonly HopUse[] = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'];
const adviceDimensions: readonly HopAdviceDimension[] = [
  'aroma', 'acidity', 'alcohol', 'bioInteraction', 'hopCreep', 'matrixTransfer', 'process', 'stock', 'documentation', 'other',
];
const readingLevels: readonly HopAdviceEvidenceSource['readingLevel'][] = [
  'primaryFullText', 'primaryAbstract', 'primaryExcerpt', 'secondary', 'dossierSummary', 'providedMaterialSource', 'curatedMapping',
];
const evidenceStatuses: readonly HopIntentEvidenceStatus[] = [
  'documentedSupport', 'documentedTension', 'documentedAgainst', 'documentedOverlap', 'candidateOnly', 'partnerOnly',
  'observationToPreserve', 'notDocumented', 'unknown', 'ambiguous', 'notApplicable',
];

function invalid(message: string): never { throw Error(message); }
function onlyKeys(value: Row, allowed: readonly string[], label: string): void {
  if (Object.keys(value).some(key => !allowed.includes(key))) invalid(`${label}: champ non pris en charge.`);
}
function assertText(value: unknown, label: string): asserts value is string {
  if (!nonempty(value)) invalid(`${label}: texte requis.`);
}
function assertId(value: unknown, label: string): asserts value is string {
  if (!nonempty(value) || value.trim() !== value) invalid(`${label}: identifiant exact requis.`);
}
function assertStringArray(value: unknown, label: string, unique = false): asserts value is string[] {
  if (!Array.isArray(value) || !value.every(nonempty) || (unique && new Set(value).size !== value.length)) {
    invalid(`${label}: liste de textes invalide${unique ? ' ou répétée' : ''}.`);
  }
}
function assertSerializable(value: unknown, label: string, ancestors = new Set<object>()): void {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid(`${label}: valeur numérique non finie.`);
    return;
  }
  if (typeof value !== 'object' || value === undefined) invalid(`${label}: valeur non JSON.`);
  if (ancestors.has(value)) invalid(`${label}: cycle JSON.`);
  ancestors.add(value);
  if (Array.isArray(value)) value.forEach(item => assertSerializable(item, label, ancestors));
  else {
    if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) invalid(`${label}: objet JSON simple requis.`);
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) invalid(`${label}: champ présent sans valeur JSON (${key}).`);
      assertSerializable(item, label, ancestors);
    }
  }
  ancestors.delete(value);
}
function sameJson(a: unknown, b: unknown): boolean {
  return hopAdviceContentReference('hop-documentary-equality-v1', a) === hopAdviceContentReference('hop-documentary-equality-v1', b);
}
function validInstant(value: unknown): value is string {
  return nonempty(value) && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
    && Number.isFinite(Date.parse(value));
}
function assertSource(value: unknown, label: string): asserts value is HopSource {
  const error = hopSourceError(value);
  if (error) invalid(`${label}: ${error}`);
}
function assertDescription(value: unknown, label: string): asserts value is HopDescription {
  if (!isRow(value)) invalid(`${label}: description absente.`);
  onlyKeys(value, ['text', 'context', 'source'], label);
  assertText(value.text, `${label}.text`);
  if (!['rawHop', 'infusion', 'beer', 'unspecified'].includes(value.context)) invalid(`${label}: contexte de description inconnu.`);
  assertSource(value.source, `${label}.source`);
}
function assertUniqueIds(rows: readonly Row[], label: string): void {
  const ids = rows.map(row => row.id);
  ids.forEach(id => assertId(id, `${label}.id`));
  if (new Set(ids).size !== ids.length) invalid(`${label}: identifiant répété.`);
}
function assertReferences(values: unknown, known: ReadonlySet<string>, label: string, allowEmpty = true): asserts values is string[] {
  assertStringArray(values, label, true);
  if (!allowEmpty && values.length === 0) invalid(`${label}: au moins une référence est requise.`);
  for (const value of values) {
    assertId(value, label);
    if (!known.has(value)) invalid(`${label}: référence orpheline « ${value} ».`);
  }
}
function assertSet(values: readonly string[], known: ReadonlySet<string>, label: string): void {
  for (const value of values) if (!known.has(value)) invalid(`${label}: référence orpheline « ${value} ».`);
}

function assertCriterion(value: unknown): asserts value is HopIntentEvidenceCriterion {
  if (!isRow(value)) invalid('Critère documentaire absent.');
  onlyKeys(value, ['id', 'description', 'role', 'origin', 'familyId', 'partner'], 'Critère documentaire');
  assertText(value.id, 'Critère.id'); assertText(value.description, 'Critère.description');
  if (!['seek', 'preserve', 'avoid', 'pairWith', 'observation', 'constraint'].includes(value.role)
    || !['user', 'proposal'].includes(value.origin)) invalid('Rôle ou origine de critère inconnus.');
  if (value.familyId !== undefined) assertId(value.familyId, 'Critère.familyId');
  if (value.partner === undefined) return;
  if (!isRow(value.partner)) invalid('Partenaire de critère invalide.');
  if (value.partner.kind === 'material') {
    onlyKeys(value.partner, ['kind', 'id', 'additionId'], 'Partenaire matière');
    assertText(value.partner.id, 'Partenaire.id');
    if (value.partner.additionId !== undefined) assertText(value.partner.additionId, 'Partenaire.additionId');
  } else if (value.partner.kind === 'observation') {
    onlyKeys(value.partner, ['kind', 'id', 'descriptions'], 'Partenaire observation');
    assertText(value.partner.id, 'Observation.id');
    if (value.partner.descriptions !== undefined) {
      if (!Array.isArray(value.partner.descriptions)) invalid('Descriptions de partenaire invalides.');
      value.partner.descriptions.forEach((description: unknown) => assertDescription(description, 'Description partenaire'));
    }
  } else if (value.partner.kind === 'freeContext') {
    onlyKeys(value.partner, ['kind', 'text', 'context', 'source'], 'Contexte partenaire libre');
    assertText(value.partner.text, 'Partenaire.text');
    if (value.partner.context !== undefined && typeof value.partner.context !== 'string') invalid('Partenaire.context invalide.');
    if (value.partner.source !== undefined) assertSource(value.partner.source, 'Partenaire.source');
  } else invalid('Type de partenaire inconnu.');
}

function assertAssertion(value: unknown): asserts value is HopAdviceAssertion {
  if (!isRow(value)) invalid('Assertion documentaire absente.');
  onlyKeys(value, ['id', 'subject', 'statement', 'state', 'value', 'unit', 'dimension', 'source'], 'Assertion documentaire');
  assertText(value.id, 'Assertion.id'); assertText(value.subject, 'Assertion.subject'); assertText(value.statement, 'Assertion.statement');
  if (!['reported', 'measured', 'planned', 'performed', 'unknown'].includes(value.state)) invalid('État d’assertion inconnu.');
  if (!(value.value === null || typeof value.value === 'string' || typeof value.value === 'boolean' || finite(value.value))) invalid('Valeur d’assertion non JSON fini.');
  if (value.unit !== undefined) assertText(value.unit, 'Assertion.unit');
  if (value.dimension !== undefined && !adviceDimensions.includes(value.dimension)) invalid('Dimension d’assertion inconnue.');
  if (value.source !== undefined) assertSource(value.source, 'Assertion.source');
}

function assertMaterial(value: unknown): asserts value is HopDecisionMaterial {
  if (!isRow(value)) invalid('Candidat documentaire matière absent.');
  onlyKeys(value, ['id', 'name', 'form', 'variety', 'lot', 'product', 'declaredAnalysis', 'alphaForModel', 'stockItemRef', 'availableGrams'], 'Candidat matière');
  assertText(value.id, 'Matière.id'); assertText(value.name, 'Matière.name');
  if (!HOP_FORMS.includes(value.form)) invalid('Forme de matière inconnue.');
  if (value.variety !== undefined) assertHopDocument('hopVarieties', value.variety);
  if (value.lot !== undefined) assertHopDocument('hopLots', value.lot);
  if (value.declaredAnalysis !== undefined) {
    if (!Array.isArray(value.declaredAnalysis)) invalid('Mesures documentaires invalides.');
    for (const measurement of value.declaredAnalysis) {
      const error = hopMeasurementError(measurement);
      if (error) invalid(`Mesure documentaire invalide : ${error}`);
    }
  }
  if (value.stockItemRef !== undefined) assertText(value.stockItemRef, 'Matière.stockItemRef');
  if (value.availableGrams !== undefined && value.availableGrams !== null && (!finite(value.availableGrams) || value.availableGrams < 0)) {
    invalid('Disponibilité documentaire invalide.');
  }
  if (value.product !== undefined) assertProduct(value.product);
  if (value.alphaForModel !== undefined) assertAlphaForModel(value.alphaForModel);
}

function assertProduct(value: unknown): void {
  if (!isRow(value)) invalid('Produit documentaire invalide.');
  onlyKeys(value, ['id', 'name', 'manufacturer', 'form', 'supportedUses', 'source', 'reviewedOn', 'cautions', 'replacement'], 'Produit documentaire');
  assertText(value.id, 'Produit.id'); assertText(value.name, 'Produit.name'); assertText(value.manufacturer, 'Produit.manufacturer');
  if (!HOP_FORMS.includes(value.form)) invalid('Forme de produit inconnue.');
  assertStringArray(value.supportedUses, 'Produit.supportedUses', true);
  if (value.supportedUses.some(use => !uses.includes(use as HopUse))) invalid('Capacité de produit inconnue.');
  assertSource(value.source, 'Produit.source'); assertText(value.reviewedOn, 'Produit.reviewedOn');
  assertStringArray(value.cautions, 'Produit.cautions');
  if (value.replacement !== undefined) {
    const replacement = value.replacement;
    if (!isRow(replacement)) invalid('Convention de remplacement invalide.');
    onlyKeys(replacement, ['referenceForm', 'uses', 'basis', 'gramsPerGram', 'source', 'limitations', 'maxEquivalentFraction', 'maxDoseGL'], 'Convention de remplacement');
    if (!HOP_FORMS.includes(replacement.referenceForm) || replacement.basis !== 'manufacturerMassRatio') invalid('Base de remplacement inconnue.');
    assertStringArray(replacement.uses, 'Remplacement.uses', true);
    if (replacement.uses.some(use => !uses.includes(use as HopUse))) invalid('Usage de remplacement inconnu.');
    if (!validHopRange(replacement.gramsPerGram) || replacement.gramsPerGram.min < 0) invalid('Rapport de remplacement invalide.');
    assertSource(replacement.source, 'Remplacement.source'); assertStringArray(replacement.limitations, 'Remplacement.limitations');
    if (replacement.maxEquivalentFraction !== undefined && (!finite(replacement.maxEquivalentFraction) || replacement.maxEquivalentFraction < 0 || replacement.maxEquivalentFraction > 1)) invalid('Fraction de remplacement invalide.');
    if (replacement.maxDoseGL !== undefined && (!finite(replacement.maxDoseGL) || replacement.maxDoseGL < 0)) invalid('Dose maximale documentaire invalide.');
  }
}

function assertAlphaForModel(value: unknown): void {
  if (!isRow(value)) invalid('Choix alpha de modèle invalide.');
  onlyKeys(value, ['analyte', 'unit', 'kind', 'value', 'range', 'analyticalBasis', 'origin', 'source', 'selectionReason', 'observationRef'], 'Choix alpha de modèle');
  if (value.analyte !== 'alpha' || value.unit !== 'percentAlpha' || !['point', 'range'].includes(value.kind)
    || !['asIs', 'dryMatter', 'unknown'].includes(value.analyticalBasis) || !['recipe', 'selectedObservation', 'workingHypothesis'].includes(value.origin)) invalid('Choix alpha de modèle hors contrat.');
  assertSource(value.source, 'Alpha.source'); assertText(value.selectionReason, 'Alpha.selectionReason');
  if (value.observationRef !== undefined) assertText(value.observationRef, 'Alpha.observationRef');
  if (value.kind === 'point' && (!finite(value.value) || value.value < 0 || value.value > 100 || value.range !== undefined)) invalid('Valeur alpha ponctuelle invalide.');
  if (value.kind === 'range' && (!validHopRange(value.range) || value.range.min < 0 || value.range.max > 100 || value.value !== undefined)) invalid('Plage alpha invalide.');
}

export function assertHopDocumentaryRequest(value: unknown): asserts value is HopDocumentaryRequest {
  if (!isRow(value) || value.format !== HOP_DOCUMENTARY_REQUEST_VERSION) invalid('Demande documentaire invalide.');
  assertSerializable(value, 'Demande documentaire');
  onlyKeys(value, ['format', 'id', 'originalQuestion', 'interpretation', 'criteria', 'needs', 'context', 'exclusions', 'materials'], 'Demande documentaire');
  assertId(value.id, 'Demande.id'); assertText(value.originalQuestion, 'Demande.originalQuestion');
  if (!isRow(value.interpretation)) invalid('Interprétation de demande invalide.');
  onlyKeys(value.interpretation, ['id', 'version', 'text', 'origin'], 'Interprétation de demande');
  assertId(value.interpretation.id, 'Interprétation.id'); assertText(value.interpretation.version, 'Interprétation.version');
  assertText(value.interpretation.text, 'Interprétation.text');
  if (!['user', 'proposal'].includes(value.interpretation.origin)) invalid('Origine d’interprétation inconnue.');

  if (!Array.isArray(value.criteria)) invalid('Critères documentaires absents.');
  value.criteria.forEach(assertCriterion); assertUniqueIds(value.criteria, 'Critères');
  const criteriaIds = new Set<string>(value.criteria.map((criterion: HopIntentEvidenceCriterion) => criterion.id));
  if (!Array.isArray(value.needs) || value.needs.length === 0) invalid('La demande doit conserver au moins un besoin identifié ou unresolved.');
  for (const need of value.needs) {
    if (!isRow(need)) invalid('Besoin documentaire invalide.');
    onlyKeys(need, ['id', 'kind', 'criterionIds', 'explanation', 'candidateIds'], 'Besoin documentaire');
    assertId(need.id, 'Besoin.id'); assertText(need.explanation, 'Besoin.explanation');
    if (!['balancePerceivedSweetness', 'aromaPairing', 'lowAlcoholCharacter', 'unresolved'].includes(need.kind)) invalid('Type de besoin documentaire inconnu.');
    assertReferences(need.criterionIds, criteriaIds, 'Besoin.criterionIds');
    if (need.candidateIds !== undefined) {
      assertStringArray(need.candidateIds, 'Besoin.candidateIds', true);
      need.candidateIds.forEach((id: string) => assertId(id, 'Besoin.candidateId'));
    }
  }
  assertUniqueIds(value.needs, 'Besoins');

  if (!isRow(value.context)) invalid('Contexte documentaire absent.');
  onlyKeys(value.context, ['stage', 'stageBasis', 'assertions', 'access'], 'Contexte documentaire');
  if (value.context.stage !== 'unknown' && !stages.includes(value.context.stage)) invalid('Stade documentaire inconnu.');
  assertText(value.context.stageBasis, 'Contexte.stageBasis');
  if (!Array.isArray(value.context.assertions)) invalid('Assertions contextuelles absentes.');
  value.context.assertions.forEach(assertAssertion); assertUniqueIds(value.context.assertions, 'Assertions');
  const assertionIds = new Set<string>(value.context.assertions.map((assertion: HopAdviceAssertion) => assertion.id));
  if (!isRow(value.context.access)) invalid('Accès physique documentaire absent.');
  onlyKeys(value.context.access, ['bulkBeer', 'sampling', 'separatePortion'], 'Accès physique');
  for (const key of ['bulkBeer', 'sampling', 'separatePortion'] as const) {
    const access = value.context.access[key];
    if (!isRow(access)) invalid(`Accès ${key} invalide.`);
    onlyKeys(access, ['state', 'basis', 'assertionIds'], `Accès ${key}`);
    if (!['yes', 'no', 'unknown'].includes(access.state)) invalid(`État d’accès ${key} inconnu.`);
    assertText(access.basis, `Accès ${key}.basis`);
    assertReferences(access.assertionIds, assertionIds, `Accès ${key}.assertionIds`);
    if (access.state !== 'unknown' && access.assertionIds.length === 0) invalid(`Accès ${key} affirmé sans assertion source.`);
  }

  if (!Array.isArray(value.exclusions)) invalid('Exclusions documentaires absentes.');
  for (const exclusion of value.exclusions) {
    if (!isRow(exclusion)) invalid('Exclusion documentaire invalide.');
    onlyKeys(exclusion, ['id', 'intervention', 'certainty', 'criterionIds', 'reason'], 'Exclusion documentaire');
    assertText(exclusion.id, 'Exclusion.id'); assertText(exclusion.reason, 'Exclusion.reason');
    if (!['changeBitterness', 'changeAroma', 'involveCulture'].includes(exclusion.intervention)
      || !['certain', 'possible', 'unknown'].includes(exclusion.certainty)) invalid('Type ou certitude d’exclusion inconnus.');
    assertReferences(exclusion.criterionIds, criteriaIds, 'Exclusion.criterionIds');
  }
  assertUniqueIds(value.exclusions, 'Exclusions');

  if (!Array.isArray(value.materials)) invalid('Candidats documentaires absents.');
  value.materials.forEach(assertMaterial); assertUniqueIds(value.materials, 'Candidats matière');
}

function corpusBody(value: Row): Omit<HopDocumentaryCorpus, 'reference'> {
  const { reference: _reference, ...body } = value;
  return body as Omit<HopDocumentaryCorpus, 'reference'>;
}

export function hopDocumentaryCorpusReference(corpus: Omit<HopDocumentaryCorpus, 'reference'> | HopDocumentaryCorpus): string {
  if (!isRow(corpus)) invalid('Corpus documentaire absent pour son empreinte.');
  const content = 'reference' in corpus ? corpusBody(corpus as Row) : corpus;
  assertSerializable(content, 'Corpus documentaire');
  return hopAdviceContentReference('hop-documentary-corpus-v1', content);
}

function assertHopDocumentaryCorpusBody(value: unknown): asserts value is Omit<HopDocumentaryCorpus, 'reference'> {
  if (!isRow(value) || value.format !== HOP_DOCUMENTARY_CORPUS_VERSION) invalid('Corpus documentaire invalide.');
  onlyKeys(value, ['format', 'version', 'sources', 'claims'], 'Corpus documentaire');
  assertText(value.version, 'Corpus.version');
  if (!Array.isArray(value.sources) || !Array.isArray(value.claims)) invalid('Sources ou claims documentaires absents.');
  for (const source of value.sources) {
    if (!isRow(source)) invalid('Source documentaire invalide.');
    onlyKeys(source, ['id', 'nature', 'source', 'locator', 'readingLevel', 'domain', 'limits'], 'Source documentaire');
    assertText(source.id, 'Source.id'); assertSource(source.source, 'Source.source');
    assertText(source.locator, 'Source.locator'); assertText(source.domain, 'Source.domain');
    if (!['manufacturerClaim', 'research', 'brewerInterview', 'editorialMapping'].includes(source.nature)
      || !readingLevels.includes(source.readingLevel)) invalid('Nature ou niveau de lecture documentaire inconnu.');
    assertStringArray(source.limits, 'Source.limits');
  }
  assertUniqueIds(value.sources, 'Sources');
  const sourceIds = new Set<string>(value.sources.map((source: HopDocumentarySource) => source.id));
  for (const claim of value.claims) {
    if (!isRow(claim)) invalid('Claim documentaire invalide.');
    onlyKeys(claim, ['id', 'version', 'statement', 'sourceIds', 'role', 'domain', 'transferConditions', 'forbiddenInferences'], 'Claim documentaire');
    assertText(claim.id, 'Claim.id'); assertText(claim.version, 'Claim.version'); assertText(claim.statement, 'Claim.statement'); assertText(claim.domain, 'Claim.domain');
    if (!['support', 'limit', 'context'].includes(claim.role)) invalid('Rôle de claim inconnu.');
    assertReferences(claim.sourceIds, sourceIds, 'Claim.sourceIds', false);
    assertStringArray(claim.transferConditions, 'Claim.transferConditions');
    assertStringArray(claim.forbiddenInferences, 'Claim.forbiddenInferences');
  }
  // Claims are referenced by id in answers, so a duplicated id cannot be resolved exactly.
  assertUniqueIds(value.claims, 'Claims');
}

export function assertHopDocumentaryCorpus(value: unknown): asserts value is HopDocumentaryCorpus {
  if (!isRow(value) || !nonempty(value.reference)) invalid('Référence de corpus documentaire absente.');
  assertSerializable(value, 'Corpus documentaire');
  onlyKeys(value, ['format', 'version', 'sources', 'claims', 'reference'], 'Corpus documentaire');
  const { reference, ...body } = value;
  assertHopDocumentaryCorpusBody(body);
  if (hopDocumentaryCorpusReference(body) !== reference) invalid('Empreinte du corpus documentaire incorrecte.');
}

export function createHopDocumentaryCorpus(input: CreateHopDocumentaryCorpusInput): HopDocumentaryCorpus {
  if (!isRow(input)) invalid('Entrée de création du corpus absente.');
  onlyKeys(input, ['version', 'sources', 'claims'], 'Création du corpus documentaire');
  const body = { format: HOP_DOCUMENTARY_CORPUS_VERSION, version: input.version,
    sources: structuredClone(input.sources), claims: structuredClone(input.claims) };
  assertHopDocumentaryCorpusBody(body);
  const corpus = { ...body, reference: hopDocumentaryCorpusReference(body) };
  assertHopDocumentaryCorpus(corpus);
  return structuredClone(corpus);
}

export function hopDocumentaryInputReference(request: HopDocumentaryRequest, corpus: HopDocumentaryCorpus): string {
  assertHopDocumentaryRequest(request); assertHopDocumentaryCorpus(corpus);
  return hopAdviceContentReference('hop-documentary-input-v1', { request, corpusReference: corpus.reference });
}

export function hopDocumentaryInterpretationReference(request: HopDocumentaryRequest): string {
  assertHopDocumentaryRequest(request);
  return hopAdviceContentReference('hop-documentary-interpretation-v1', {
    interpretation: request.interpretation, criteria: request.criteria, needs: request.needs,
  });
}

function routeBody(route: Row): Omit<HopDocumentaryRoute, 'reference'> {
  const { reference: _reference, ...body } = route;
  return body as Omit<HopDocumentaryRoute, 'reference'>;
}

export function hopDocumentaryRouteReference(route: Omit<HopDocumentaryRoute, 'reference'> | HopDocumentaryRoute): string {
  if (!isRow(route)) invalid('Voie documentaire absente pour son empreinte.');
  const content = 'reference' in route ? routeBody(route as Row) : route;
  assertSerializable(content, 'Voie documentaire');
  return hopAdviceContentReference('hop-documentary-route-v1', content);
}

function answerBody(answer: Row): Omit<HopDocumentaryAnswer, 'reference'> {
  const { reference: _reference, ...body } = answer;
  return body as Omit<HopDocumentaryAnswer, 'reference'>;
}

export function hopDocumentaryAnswerReference(answer: Omit<HopDocumentaryAnswer, 'reference'> | HopDocumentaryAnswer): string {
  if (!isRow(answer)) invalid('Réponse documentaire absente pour son empreinte.');
  const content = 'reference' in answer ? answerBody(answer as Row) : answer;
  assertSerializable(content, 'Réponse documentaire');
  return hopAdviceContentReference('hop-documentary-answer-v1', content);
}

function assertPreparation(value: unknown): asserts value is HopDocumentaryPreparation {
  if (!isRow(value)) invalid('Préparation documentaire absente.');
  onlyKeys(value, ['documentaryDossier', 'operational', 'missingRequirements', 'refusalReasons'], 'Préparation documentaire');
  if (!isRow(value.documentaryDossier)) invalid('Dossier documentaire de préparation absent.');
  onlyKeys(value.documentaryDossier, ['status', 'kind', 'label'], 'Dossier documentaire');
  if (value.documentaryDossier.status !== 'available' || !['choice', 'trialToQualify', 'futureStudy'].includes(value.documentaryDossier.kind)) invalid('Type de dossier documentaire invalide.');
  assertText(value.documentaryDossier.label, 'Dossier.label');
  if (!isRow(value.operational)) invalid('Qualification opérationnelle absente.');
  onlyKeys(value.operational, ['status', 'adapterId', 'reason'], 'Qualification opérationnelle');
  assertText(value.operational.reason, 'Opération.reason');
  if (value.operational.status === 'notProvided') {
    if (value.operational.adapterId !== null) invalid('Une suite opérationnelle absente ne porte pas d’adapterId.');
  } else if (value.operational.status === 'requiresReceivedAdapter') {
    assertText(value.operational.adapterId, 'Opération.adapterId');
  } else invalid('Statut opérationnel inconnu.');
  assertStringArray(value.missingRequirements, 'Prérequis manquants');
  assertStringArray(value.refusalReasons, 'Motifs de refus');
}

function assertCondition(value: unknown, criterionIds: ReadonlySet<string>, assertionIds: ReadonlySet<string>): asserts value is HopDocumentaryCondition {
  if (!isRow(value)) invalid('Condition d’applicabilité absente.');
  onlyKeys(value, ['id', 'state', 'description', 'assertionIds', 'criterionIds'], 'Condition d’applicabilité');
  assertText(value.id, 'Condition.id'); assertText(value.description, 'Condition.description');
  if (!['met', 'unmet', 'unknown'].includes(value.state)) invalid('État de condition inconnu.');
  assertReferences(value.assertionIds, assertionIds, 'Condition.assertionIds');
  assertReferences(value.criterionIds, criterionIds, 'Condition.criterionIds');
}

function assertDocumentaryRoute(route: unknown, request: HopDocumentaryRequest, corpus: HopDocumentaryCorpus,
  argumentIds: ReadonlySet<string>): asserts route is HopDocumentaryRoute {
  if (!isRow(route) || !nonempty(route.reference)) invalid('Voie documentaire sans référence.');
  onlyKeys(route, ['id', 'needIds', 'criterionIds', 'title', 'purpose', 'scope', 'intervention', 'argumentIds', 'materialIds',
    'documentaryProductRefs', 'applicability', 'preparation', 'reference'], 'Voie documentaire');
  assertText(route.id, 'Voie.id'); assertText(route.title, 'Voie.title'); assertText(route.purpose, 'Voie.purpose');
  if (!['bulkBeer', 'sampling', 'separatePortion', 'futureBrew', 'documentation'].includes(route.scope)
    || !['none', 'changeBitterness', 'changeAroma', 'involveCulture'].includes(route.intervention)) invalid('Portée ou intervention documentaire inconnue.');
  const needIds = new Set<string>(request.needs.map(need => need.id));
  const criterionIds = new Set<string>(request.criteria.map(criterion => criterion.id));
  const materialIds = new Set<string>(request.materials.map(material => material.id));
  const assertionIds = new Set<string>(request.context.assertions.map(assertion => assertion.id));
  const claimIds = new Set<string>(corpus.claims.map(claim => claim.id));
  assertReferences(route.needIds, needIds, 'Voie.needIds', false);
  assertReferences(route.criterionIds, criterionIds, 'Voie.criterionIds');
  const routeNeedCriteria = new Set<string>(request.needs.filter(need => route.needIds.includes(need.id)).flatMap(need => need.criterionIds));
  assertSet(route.criterionIds, routeNeedCriteria, 'Voie.criterionIds de ses besoins');
  assertReferences(route.argumentIds, argumentIds, 'Voie.argumentIds', false);
  assertReferences(route.materialIds, materialIds, 'Voie.materialIds');
  if (!Array.isArray(route.documentaryProductRefs)) invalid('Références de produits documentaires absentes.');
  for (const product of route.documentaryProductRefs) {
    if (!isRow(product)) invalid('Référence de produit documentaire invalide.');
    onlyKeys(product, ['id', 'name', 'claimIds'], 'Produit documentaire référencé');
    assertText(product.id, 'Produit.id'); assertText(product.name, 'Produit.name');
    assertReferences(product.claimIds, claimIds, 'Produit.claimIds', false);
  }
  assertUniqueIds(route.documentaryProductRefs, 'Produits documentaires référencés');
  if (!isRow(route.applicability)) invalid('Applicabilité de voie absente.');
  onlyKeys(route.applicability, ['status', 'conditions'], 'Applicabilité de voie');
  if (!['conditionsMet', 'missingConditions', 'incompatible', 'notEvaluated'].includes(route.applicability.status)
    || !Array.isArray(route.applicability.conditions)) invalid('Statut ou conditions de voie invalides.');
  route.applicability.conditions.forEach((condition: unknown) => assertCondition(condition, criterionIds, assertionIds));
  assertUniqueIds(route.applicability.conditions, 'Conditions de voie');
  const conditionStates = route.applicability.conditions.map((condition: HopDocumentaryCondition) => condition.state);
  if (route.applicability.status === 'conditionsMet' && (!conditionStates.length || conditionStates.some(status => status !== 'met'))) invalid('Conditions non toutes satisfaites pour cette voie.');
  if (route.applicability.status === 'incompatible' && !conditionStates.includes('unmet')) invalid('Incompatibilité connue sans condition unmet.');
  if (route.applicability.status === 'missingConditions' && (!conditionStates.includes('unknown') || conditionStates.includes('unmet'))) invalid('Applicabilité missingConditions incohérente avec ses conditions.');
  if (route.applicability.status === 'notEvaluated' && conditionStates.length > 0) invalid('Applicabilité notEvaluated ne porte pas de conditions évaluées.');
  assertPreparation(route.preparation);
  if (hopDocumentaryRouteReference(routeBody(route)) !== route.reference) invalid('Empreinte de voie documentaire incorrecte.');
}

function sourceMatchesCorpus(source: HopSource, corpus: HopDocumentaryCorpus): boolean {
  return corpus.sources.some(row => sameJson(row.source, source));
}

function assertDescriptorEvidence(value: unknown, side: 'candidate' | 'partner', descriptions: readonly HopDescription[], corpus: HopDocumentaryCorpus): void {
  if (!isRow(value)) invalid('Trace de descripteur documentaire absente.');
  onlyKeys(value, ['side', 'familyId', 'familyName', 'term', 'quote', 'context', 'polarity', 'source', 'mappingSource'], 'Trace de descripteur');
  if (value.side !== side) invalid('Côté de trace de descripteur incohérent.');
  for (const key of ['familyId', 'familyName', 'term', 'quote']) assertText(value[key], `Descripteur.${key}`);
  if (!['rawHop', 'infusion', 'beer', 'unspecified'].includes(value.context)
    || !['positiveMention', 'explicitNegation', 'ambiguousMention'].includes(value.polarity)) invalid('Contexte ou polarité de descripteur inconnus.');
  assertSource(value.source, 'Descripteur.source'); assertSource(value.mappingSource, 'Descripteur.mappingSource');
  const citedDescription = descriptions.some(description => description.text === value.quote && description.context === value.context && sameJson(description.source, value.source));
  if (!citedDescription) invalid('Citation de descripteur absente des descriptions source exactes.');
  if (!sourceMatchesCorpus(value.mappingSource, corpus)) invalid('Source de mapping éditoriale absente du corpus versionné.');
}

function assertEvidenceEvaluation(value: unknown, materialId: string, criterion: HopIntentEvidenceCriterion,
  request: HopDocumentaryRequest, corpus: HopDocumentaryCorpus): asserts value is HopIntentEvidenceEvaluation {
  if (!isRow(value)) invalid('Évaluation de matériau absente.');
  onlyKeys(value, ['criterion', 'candidateId', 'partnerReference', 'status', 'candidateDescriptions', 'partnerDescriptions',
    'candidateEvidence', 'partnerEvidence', 'familyIds', 'sharedFamilyIds', 'missingInformation', 'consequence'], 'Évaluation d’évidence matière');
  if (value.candidateId !== materialId || !evidenceStatuses.includes(value.status)) invalid('Identité ou statut d’évaluation matière incohérent.');
  if (!sameJson(value.criterion, criterion)) invalid('Évaluation liée à un snapshot de critère différent.');
  if (!sameJson(value.partnerReference, criterion.partner ?? null)) invalid('Partenaire de l’évaluation différent du critère exact.');
  const material = request.materials.find(row => row.id === materialId);
  if (!material) invalid('Évaluation liée à une matière non fournie dans la demande.');
  const candidateArchived = !!material.variety?.archived || !!material.lot?.archived;
  const allowedCandidateDescriptions = candidateArchived ? [] : material.variety?.descriptions ?? [];
  if (!Array.isArray(value.candidateDescriptions) || !Array.isArray(value.partnerDescriptions)) invalid('Descriptions de l’évaluation absentes.');
  value.candidateDescriptions.forEach((description: unknown) => {
    assertDescription(description, 'Description évaluée candidate');
    if (!allowedCandidateDescriptions.some(sourceDescription => sameJson(sourceDescription, description))) invalid('Description candidate orpheline du matériau exact.');
  });
  let allowedPartnerDescriptions: HopDescription[] = [];
  const partner = criterion.partner;
  if (partner?.kind === 'observation') allowedPartnerDescriptions = [...(partner.descriptions ?? [])];
  else if (partner?.kind === 'material') {
    const partnerMaterial = request.materials.find(row => row.id === partner.id);
    if (partnerMaterial && !partnerMaterial.variety?.archived && !partnerMaterial.lot?.archived) allowedPartnerDescriptions = [...(partnerMaterial.variety?.descriptions ?? [])];
  }
  value.partnerDescriptions.forEach((description: unknown) => {
    assertDescription(description, 'Description évaluée partenaire');
    if (!allowedPartnerDescriptions.some(sourceDescription => sameJson(sourceDescription, description))) invalid('Description partenaire orpheline de son identité source exacte.');
  });
  if (!Array.isArray(value.candidateEvidence) || !Array.isArray(value.partnerEvidence)) invalid('Traces d’évidence matière absentes.');
  value.candidateEvidence.forEach((evidence: unknown) => assertDescriptorEvidence(evidence, 'candidate', value.candidateDescriptions, corpus));
  value.partnerEvidence.forEach((evidence: unknown) => assertDescriptorEvidence(evidence, 'partner', value.partnerDescriptions, corpus));
  assertStringArray(value.familyIds, 'Évaluation.familyIds', true); assertStringArray(value.sharedFamilyIds, 'Évaluation.sharedFamilyIds', true);
  assertSet(value.sharedFamilyIds, new Set(value.familyIds), 'Évaluation.sharedFamilyIds');
  assertSet([...value.candidateEvidence, ...value.partnerEvidence].map((evidence: Row) => evidence.familyId), new Set(value.familyIds), 'Évaluation.evidence.familyIds');
  assertStringArray(value.missingInformation, 'Évaluation.missingInformation'); assertText(value.consequence, 'Évaluation.consequence');
}

function assertDocumentaryArgument(value: unknown, request: HopDocumentaryRequest, corpus: HopDocumentaryCorpus): asserts value is HopDocumentaryArgument {
  if (!isRow(value)) invalid('Argument documentaire absent.');
  onlyKeys(value, ['id', 'kind', 'text', 'criterionIds', 'assertionIds', 'claimIds', 'materialEvidence'], 'Argument documentaire');
  assertText(value.id, 'Argument.id'); assertText(value.text, 'Argument.text');
  if (!['userFact', 'userGoal', 'proposedReading', 'documentaryFact', 'adviceInference', 'trialHypothesis'].includes(value.kind)) invalid('Type d’argument documentaire inconnu.');
  const criterionIds = new Set<string>(request.criteria.map(row => row.id));
  const assertionIds = new Set<string>(request.context.assertions.map(row => row.id));
  const claimIds = new Set<string>(corpus.claims.map(row => row.id));
  assertReferences(value.criterionIds, criterionIds, 'Argument.criterionIds');
  assertReferences(value.assertionIds, assertionIds, 'Argument.assertionIds');
  assertReferences(value.claimIds, claimIds, 'Argument.claimIds');
  if (!Array.isArray(value.materialEvidence)) invalid('Évidences de matière de l’argument absentes.');
  const pairs = new Set<string>();
  for (const evidence of value.materialEvidence) {
    if (!isRow(evidence)) invalid('Évidence de matière invalide.');
    onlyKeys(evidence, ['materialId', 'criterionId', 'evaluation'], 'Évidence de matière');
    assertText(evidence.materialId, 'Évidence.materialId'); assertText(evidence.criterionId, 'Évidence.criterionId');
    if (!request.materials.some(material => material.id === evidence.materialId)) invalid('Évidence de matière liée à un candidat non chargé.');
    const criterion = request.criteria.find(row => row.id === evidence.criterionId);
    if (!criterion) invalid('Évidence de matière liée à un critère absent.');
    if (!value.criterionIds.includes(evidence.criterionId)) invalid('Évaluation matière liée à un critère absent de son argument.');
    const pair = `${evidence.materialId}\u0000${evidence.criterionId}`;
    if (pairs.has(pair)) invalid('Évaluation matière/critère répétée.');
    pairs.add(pair);
    assertEvidenceEvaluation(evidence.evaluation, evidence.materialId, criterion, request, corpus);
  }
  if (value.kind === 'userFact' && value.assertionIds.length === 0) {
    const linkedUserObservations = request.criteria.filter(criterion => value.criterionIds.includes(criterion.id));
    if (!linkedUserObservations.length || linkedUserObservations.some(criterion => criterion.origin !== 'user' || criterion.role !== 'observation')) {
      invalid('Un argument userFact doit pointer une assertion exacte ou une observation explicitement déclarée par l’utilisateur.');
    }
  }
  if (value.kind === 'documentaryFact' && value.claimIds.length === 0 && value.materialEvidence.length === 0) invalid('Un argument documentaryFact doit pointer un claim ou une évaluation sourcée.');
}

function validateAnswerStructure(value: unknown): asserts value is HopDocumentaryAnswer {
  if (!isRow(value) || value.format !== HOP_DOCUMENTARY_ANSWER_VERSION || !nonempty(value.reference)) invalid('Réponse documentaire ou empreinte absente.');
  assertSerializable(value, 'Réponse documentaire');
  onlyKeys(value, ['format', 'requestSnapshot', 'corpusSnapshot', 'inputReference', 'interpretationReference', 'coverage', 'body', 'arguments', 'routes', 'limits', 'reference'], 'Réponse documentaire');
  assertHopDocumentaryRequest(value.requestSnapshot); assertHopDocumentaryCorpus(value.corpusSnapshot);
  if (value.inputReference !== hopDocumentaryInputReference(value.requestSnapshot, value.corpusSnapshot)) invalid('Réponse liée à un autre instantané request/corpus.');
  if (value.interpretationReference !== hopDocumentaryInterpretationReference(value.requestSnapshot)) invalid('Réponse liée à une autre interprétation, un autre critère ou besoin.');
  const request = value.requestSnapshot as HopDocumentaryRequest;
  const corpus = value.corpusSnapshot as HopDocumentaryCorpus;
  if (!isRow(value.coverage)) invalid('Couverture de réponse absente.');
  onlyKeys(value.coverage, ['status', 'domain', 'points', 'unresolvedCriteria'], 'Couverture de réponse');
  if (!['answered', 'partial', 'outOfScope'].includes(value.coverage.status)) invalid('Statut de réponse inconnu.');
  assertText(value.coverage.domain, 'Couverture.domain');
  if (!Array.isArray(value.coverage.points) || !Array.isArray(value.coverage.unresolvedCriteria)) invalid('Points ou critères non résolus absents.');
  const needs = new Set<string>(request.needs.map(row => row.id));
  const criteria = new Set<string>(request.criteria.map(row => row.id));
  const pointIds: string[] = [];
  for (const point of value.coverage.points) {
    if (!isRow(point)) invalid('Point de couverture invalide.');
    onlyKeys(point, ['needId', 'status', 'reason', 'argumentIds', 'routeIds'], 'Point de couverture');
    assertText(point.needId, 'Couverture.needId'); assertText(point.reason, 'Couverture.reason');
    if (!['answered', 'partial', 'unresolved'].includes(point.status)) invalid('Statut de point de couverture inconnu.');
    pointIds.push(point.needId);
  }
  if (pointIds.length !== needs.size || new Set(pointIds).size !== pointIds.length) invalid('Chaque besoin doit avoir exactement un point de couverture.');
  assertSet(pointIds, needs, 'Couverture.points');
  for (const unresolved of value.coverage.unresolvedCriteria) {
    if (!isRow(unresolved)) invalid('Lacune de critère invalide.');
    onlyKeys(unresolved, ['criterionId', 'reason'], 'Lacune de critère');
    assertText(unresolved.criterionId, 'Lacune.criterionId'); assertText(unresolved.reason, 'Lacune.reason');
  }
  const unresolvedCriterionIds = value.coverage.unresolvedCriteria.map((row: Row) => row.criterionId);
  if (new Set(unresolvedCriterionIds).size !== unresolvedCriterionIds.length) invalid('Critère non résolu répété.');
  assertSet(unresolvedCriterionIds, criteria, 'Couverture.unresolvedCriteria');

  if (!Array.isArray(value.arguments) || !Array.isArray(value.routes) || !Array.isArray(value.body)) invalid('Arguments, voies ou corps de réponse absents.');
  value.arguments.forEach((argument: unknown) => assertDocumentaryArgument(argument, request, corpus));
  assertUniqueIds(value.arguments, 'Arguments');
  const argumentIds = new Set<string>(value.arguments.map((argument: HopDocumentaryArgument) => argument.id));
  value.routes.forEach((route: unknown) => assertDocumentaryRoute(route, request, corpus, argumentIds));
  assertUniqueIds(value.routes, 'Voies');
  const routeIds = new Set<string>(value.routes.map((route: HopDocumentaryRoute) => route.id));
  for (const point of value.coverage.points) {
    assertReferences(point.argumentIds, argumentIds, 'Couverture.argumentIds');
    assertReferences(point.routeIds, routeIds, 'Couverture.routeIds');
    if (point.status !== 'unresolved' && point.argumentIds.length === 0 && point.routeIds.length === 0) invalid('Point répondu sans argument ni voie liée.');
    for (const routeId of point.routeIds) {
      const route = value.routes.find((row: HopDocumentaryRoute) => row.id === routeId)!;
      if (!route.needIds.includes(point.needId)) invalid('Voie rattachée à un point de couverture d’un autre besoin.');
    }
  }
  for (const block of value.body) {
    if (!isRow(block)) invalid('Bloc de réponse invalide.');
    onlyKeys(block, ['id', 'text', 'argumentIds'], 'Bloc de réponse');
    assertText(block.id, 'Bloc.id'); assertText(block.text, 'Bloc.text');
    assertReferences(block.argumentIds, argumentIds, 'Bloc.argumentIds');
  }
  assertUniqueIds(value.body, 'Blocs de réponse');
  if (value.body.length === 0) invalid('Une réponse archivée doit conserver au moins un bloc utile ou explicatif.');
  assertStringArray(value.limits, 'Limites de réponse');

  const substantivePoints = value.coverage.points.filter((point: Row) => point.status === 'answered' || point.status === 'partial');
  const hasLacuna = value.coverage.points.some((point: Row) => point.status === 'partial' || point.status === 'unresolved')
    || unresolvedCriterionIds.length > 0;
  if (value.coverage.status === 'answered'
    && (value.coverage.points.some((point: Row) => point.status !== 'answered') || unresolvedCriterionIds.length > 0)) invalid('Statut answered malgré une lacune de couverture.');
  if (value.coverage.status === 'partial' && (!substantivePoints.length || !hasLacuna)) invalid('Statut partial sans réponse substantielle et lacune déclarée.');
  if (value.coverage.status === 'outOfScope' && substantivePoints.length > 0) invalid('Statut outOfScope malgré un point substantiellement répondu.');
  const referencedArguments = new Set<string>([
    ...value.body.flatMap((block: Row) => block.argumentIds),
    ...value.routes.flatMap((route: HopDocumentaryRoute) => route.argumentIds),
    ...value.coverage.points.flatMap((point: Row) => point.argumentIds),
  ]);
  for (const id of argumentIds) if (!referencedArguments.has(id)) invalid(`Argument orphelin « ${id} » dans la réponse.`);
  const referencedRoutes = new Set<string>(value.coverage.points.flatMap((point: Row) => point.routeIds));
  for (const id of routeIds) if (!referencedRoutes.has(id)) invalid(`Voie orpheline « ${id} » dans la réponse.`);
  for (const route of value.routes as HopDocumentaryRoute[]) for (const needId of route.needIds) {
    const point = value.coverage.points.find((row: Row) => row.needId === needId);
    if (!point?.routeIds.includes(route.id)) invalid(`Voie « ${route.id} » non reliée à son besoin « ${needId} » dans la couverture.`);
  }
  if (hopDocumentaryAnswerReference(answerBody(value)) !== value.reference) invalid('Empreinte de réponse documentaire incorrecte.');
}

export function assertHopDocumentaryAnswer(value: unknown): asserts value is HopDocumentaryAnswer {
  validateAnswerStructure(value);
}

function hasFutureAnswerSnapshotFormat(value: Row): string | null {
  const request = value.requestSnapshot;
  if (isRow(request) && nonempty(request.format) && request.format.startsWith('hop-documentary-request-')
    && request.format !== HOP_DOCUMENTARY_REQUEST_VERSION) return 'Version de demande documentaire future.';
  const corpus = value.corpusSnapshot;
  if (isRow(corpus) && nonempty(corpus.format) && corpus.format.startsWith('hop-documentary-corpus-')
    && corpus.format !== HOP_DOCUMENTARY_CORPUS_VERSION) return 'Version de corpus documentaire future.';
  return null;
}

export function readHopDocumentaryAnswer(value: unknown): HopDocumentaryAnswerReadResult {
  if (isRow(value) && nonempty(value.format) && value.format.startsWith('hop-documentary-answer-') && value.format !== HOP_DOCUMENTARY_ANSWER_VERSION) {
    return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format de réponse documentaire futur conservé sans recalcul.' };
  }
  if (isRow(value)) {
    const nestedFuture = hasFutureAnswerSnapshotFormat(value);
    if (nestedFuture) return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: `${nestedFuture} Réponse conservée sans recalcul.` };
  }
  assertHopDocumentaryAnswer(value);
  return { status: 'readOnly', answer: structuredClone(value) };
}

function dossierBody(dossier: Row): Omit<HopDocumentaryDossier, 'reference'> {
  const { reference: _reference, ...body } = dossier;
  return body as Omit<HopDocumentaryDossier, 'reference'>;
}

export function hopDocumentaryDossierReference(dossier: Omit<HopDocumentaryDossier, 'reference'> | HopDocumentaryDossier): string {
  if (!isRow(dossier)) invalid('Dossier documentaire absent pour son empreinte.');
  const content = 'reference' in dossier ? dossierBody(dossier as Row) : dossier;
  assertSerializable(content, 'Dossier documentaire');
  return hopAdviceContentReference('hop-documentary-dossier-v1', content);
}

export function assertHopDocumentaryDossier(value: unknown): asserts value is HopDocumentaryDossier {
  if (!isRow(value) || value.format !== 'hop-documentary-dossier-v1' || !nonempty(value.reference)) invalid('Dossier documentaire invalide.');
  assertSerializable(value, 'Dossier documentaire');
  onlyKeys(value, ['format', 'id', 'answerSnapshot', 'answerReference', 'interpretationReference', 'routeId', 'routeReference', 'motive', 'createdAt', 'createdBy', 'preparation', 'reference'], 'Dossier documentaire');
  assertId(value.id, 'Dossier.id'); assertHopDocumentaryAnswer(value.answerSnapshot);
  if (value.answerReference !== value.answerSnapshot.reference || value.interpretationReference !== value.answerSnapshot.interpretationReference) invalid('Dossier lié à une réponse ou interprétation différente.');
  assertText(value.routeId, 'Dossier.routeId'); assertText(value.routeReference, 'Dossier.routeReference');
  const route = value.answerSnapshot.routes.find(row => row.id === value.routeId);
  if (!route || route.reference !== value.routeReference) invalid('Dossier lié à une voie absente ou modifiée.');
  assertText(value.motive, 'Dossier.motive');
  if (!validInstant(value.createdAt)) invalid('Dossier.createdAt invalide.');
  if (!isRow(value.createdBy)) invalid('Dossier.createdBy absent.');
  onlyKeys(value.createdBy, ['origin', 'label'], 'Dossier.createdBy');
  if (!['user', 'proposal', 'fixture'].includes(value.createdBy.origin)) invalid('Origine de création du dossier inconnue.');
  assertText(value.createdBy.label, 'Dossier.createdBy.label'); assertPreparation(value.preparation);
  if (!sameJson(value.preparation, route.preparation)) invalid('Préparation du dossier différente de celle de la voie sélectionnée.');
  if (hopDocumentaryDossierReference(dossierBody(value)) !== value.reference) invalid('Empreinte de dossier documentaire incorrecte.');
}

export function createHopDocumentaryDossier(input: CreateHopDocumentaryDossierInput): HopDocumentaryDossier {
  if (!isRow(input)) invalid('Entrée de dossier documentaire absente.');
  onlyKeys(input, ['id', 'answer', 'expectedAnswerReference', 'expectedInterpretationReference', 'routeId', 'expectedRouteReference', 'motive', 'createdAt', 'createdBy'], 'Création de dossier documentaire');
  assertHopDocumentaryAnswer(input.answer);
  if (input.answer.reference !== input.expectedAnswerReference || input.answer.interpretationReference !== input.expectedInterpretationReference) invalid('Réponse ou interprétation périmée; le choix doit être repris.');
  const route = input.answer.routes.find(item => item.id === input.routeId);
  if (!route || route.reference !== input.expectedRouteReference) invalid('Voie absente ou modifiée; le choix documentaire est périmé.');
  const dossierBodyValue: Omit<HopDocumentaryDossier, 'reference'> = {
    format: 'hop-documentary-dossier-v1', id: input.id, answerSnapshot: structuredClone(input.answer),
    answerReference: input.expectedAnswerReference, interpretationReference: input.expectedInterpretationReference,
    routeId: input.routeId, routeReference: input.expectedRouteReference, motive: input.motive,
    createdAt: input.createdAt, createdBy: structuredClone(input.createdBy), preparation: structuredClone(route.preparation),
  };
  const dossier = { ...dossierBodyValue, reference: hopDocumentaryDossierReference(dossierBodyValue) };
  assertHopDocumentaryDossier(dossier);
  return structuredClone(dossier);
}

export function readHopDocumentaryDossier(value: unknown): HopDocumentaryDossierReadResult {
  if (isRow(value) && nonempty(value.format) && value.format.startsWith('hop-documentary-dossier-') && value.format !== 'hop-documentary-dossier-v1') {
    return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Format de dossier documentaire futur conservé sans recalcul.' };
  }
  if (isRow(value) && isRow(value.answerSnapshot)) {
    const nested = readHopDocumentaryAnswer(value.answerSnapshot);
    if (nested.status === 'unsupportedReadOnly') return { status: 'unsupportedReadOnly', snapshot: structuredClone(value), reason: 'Réponse imbriquée dans un format futur; dossier conservé sans recalcul.' };
  }
  assertHopDocumentaryDossier(value);
  return { status: 'readOnly', dossier: structuredClone(value) };
}
