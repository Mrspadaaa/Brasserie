import type { HopDescription, HopProductForm, HopSource, HopVariety } from '../../../functions/src/hopIndexSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { compareHopMaterials } from '../../domain/hopDecision/measurements';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type {
  HopDecisionMaterial,
  HopDecisionProgram,
  HopMaterialComparison,
  HopReplacementBasis,
  HopUse,
} from '../../domain/hopDecision/types';
import {
  extractBrewingSensoryDocumentaryEvidence,
  type BrewingSensoryDimension,
  type BrewingSensoryDocumentaryMention,
  type BrewingSensoryLexicalRule,
} from '../../domain/brewingSensory';
import type {
  HopV55DecisionProgramPreparationV1,
  HopV55ProgramOperationV1,
} from '../../services/hopV55/decisionProgramPreparation';
import { HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT } from '../../services/hopV55/explorationTrialPreparation';
import type { HopV55ExplorationTrialEntryV1 } from '../../services/hopV55/explorationTrialPreparation';
import type { HopV55Intent } from '../../services/hopV55/contracts';

export { HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT } from '../../services/hopV55/explorationTrialPreparation';
export type { HopV55ExplorationTrialEntryV1 } from '../../services/hopV55/explorationTrialPreparation';
import {
  HOP_V55_EXPLORATION_PROFILE_FORMAT,
  createHopV55ExplorationProfile,
  hopV55ExplorationProfileDraftErrors,
  hopV55ExplorationProfileHistory,
  readHopV55ExplorationProfile,
} from '../../services/hopV55/explorationProfiles';
import type {
  HopV55ConfrontationDirection,
  HopV55ExplorationProfileCriterionV1,
  HopV55ExplorationProfileDraft,
  HopV55ExplorationProfileHistory,
  HopV55ExplorationProfileRead,
  HopV55ExplorationProfileStatus,
  HopV55ExplorationProfileV1,
} from '../../services/hopV55/explorationProfiles';

export {
  HOP_V55_EXPLORATION_PROFILE_FORMAT,
  createHopV55ExplorationProfile,
  hopV55ExplorationProfileDraftErrors,
  hopV55ExplorationProfileHistory,
  readHopV55ExplorationProfile,
} from '../../services/hopV55/explorationProfiles';
export type {
  HopV55ConfrontationDirection,
  HopV55ExplorationProfileCriterionV1,
  HopV55ExplorationProfileDraft,
  HopV55ExplorationProfileHistory,
  HopV55ExplorationProfileRead,
  HopV55ExplorationProfileStatus,
  HopV55ExplorationProfileV1,
} from '../../services/hopV55/explorationProfiles';

/*
 * Pure read model for the contextual exploration. It only arranges canonical
 * outputs (compareHopMaterials, the sensory lexical extractor and the program
 * preparation service); it never estimates a level, a centre or a gain.
 */

export const HOP_V55_FORM_LABELS: Record<HopProductForm, string> = {
  pelletT90: 'Granulés T-90',
  pelletT45: 'Granulés T-45',
  cryo: 'Cryo',
  cone: 'Cônes',
  extract: 'Extrait',
  unknown: 'Forme inconnue',
};

export const HOP_V55_USE_OPTIONS: Array<{ value: HopUse; label: string }> = [
  { value: 'firstWort', label: 'Premier moût' },
  { value: 'boil', label: 'Ébullition' },
  { value: 'whirlpool', label: 'Whirlpool' },
  { value: 'fermentation', label: 'Fermentation' },
  { value: 'postFermentation', label: 'Après fermentation' },
];

export function hopV55UseLabel(use: HopUse | undefined): string {
  return HOP_V55_USE_OPTIONS.find((row) => row.value === use)?.label ?? 'emploi non choisi';
}

export function hopV55MaterialLabel(material: HopDecisionMaterial): string {
  const form = HOP_V55_FORM_LABELS[material.form] ?? 'Forme inconnue';
  return [material.name, form, material.lot?.lotNumber ? `lot ${material.lot.lotNumber}` : ''].filter(Boolean).join(' · ');
}

/** Shared documentary convention; NuanceExplorer reuses it so a word is read the same way everywhere. */
export const HOP_V55_LEXICAL_NEGATION_PREFIXES: readonly string[] = ['no', 'not', 'non', 'sans', 'pas de'];
export const HOP_V55_LEXICAL_RULE_SOURCE: HopSource = {
  title: 'Convention lexicale documentaire v1',
  author: 'L’Affinée · règle de correspondance textuelle',
  year: 2026,
  kind: 'judgment',
  reference: 'local-rule:brewing-sensory-lexical-v1',
  locator: 'Correspondance exacte de mots/expressions avec frontières; préfixes de négation configurés : no, not, non, sans, pas de. Les citations originales restent la référence; aucune fréquence ne devient une intensité.',
};

export interface HopV55ExplorationFamily {
  key: string;
  axisId: string;
  version: string;
  name: string;
  terms: readonly string[];
  sources: readonly HopSource[];
}

export type HopV55DocumentarySubject = Pick<HopVariety, 'id' | 'name' | 'descriptions'>;

export type HopV55DocumentarySideStatus = 'documented' | 'negated' | 'mixed' | 'nonDocumented' | 'noDescriptions' | 'unresolved';

export interface HopV55DocumentarySide {
  status: HopV55DocumentarySideStatus;
  mentions: BrewingSensoryDocumentaryMention[];
  /** Contexts of every cited mention, including negations; raw hop text is not a beer observation. */
  contexts: Array<HopDescription['context']>;
  reason?: string;
}

/** Documentary displacement only: no amount, loss or gain is measured. */
export type HopV55DocumentaryShift = 'shared' | 'sourceOnly' | 'alternativeOnly' | 'neither' | 'unknown';

export const HOP_V55_CONFRONTATION_DIRECTIONS: Array<{ value: HopV55ConfrontationDirection; label: string }> = [
  { value: 'seek', label: 'Rechercher' },
  { value: 'reduce', label: 'Réduire' },
  { value: 'avoid', label: 'Éviter' },
  { value: 'keep', label: 'Préserver' },
  { value: 'investigate', label: 'Examiner sans cible' },
];

export function hopV55DirectionLabel(direction: HopV55ConfrontationDirection): string {
  return HOP_V55_CONFRONTATION_DIRECTIONS.find((row) => row.value === direction)?.label ?? direction;
}

export type HopV55ConfrontationOrigin =
  | { kind: 'intent'; question: string }
  | { kind: 'profile'; profileReference: string | null; label: string; status: HopV55ExplorationProfileStatus; persisted: boolean };

export interface HopV55ConfrontationCriterion {
  id: string;
  origin: HopV55ConfrontationOrigin;
  direction: HopV55ConfrontationDirection;
  label: string;
  /** Exact family key when known; an axis alone is resolved only if exactly one lexicon is loaded. */
  family?: { key?: string; axisId: string; version?: string };
  freeTerm?: string;
}

export type HopV55CriterionReadingKind =
  | 'documentedSupport' | 'documentedTension' | 'possibleLoss' | 'shared'
  | 'notMentioned' | 'unknown' | 'informational' | 'notEvaluated';

export interface HopV55CriterionReading {
  criterion: HopV55ConfrontationCriterion;
  kind: HopV55CriterionReadingKind;
  family?: HopV55ExplorationFamily;
  source?: HopV55DocumentarySide;
  alternative?: HopV55DocumentarySide;
  reason: string;
}

export interface HopV55FamilyComparisonRow {
  family: HopV55ExplorationFamily;
  source: HopV55DocumentarySide;
  alternative: HopV55DocumentarySide;
  shift: HopV55DocumentaryShift;
}

export interface HopV55ContextualComparison {
  version: 'hop-v55-contextual-comparison-v1';
  sourceId: string;
  alternativeId: string;
  identityNotes: string[];
  /** Canonical comparison kept intact for its limits, scopes and sources. */
  material: HopMaterialComparison;
  analytical: {
    readable: HopMaterialComparison['analytical'];
    conflicts: string[];
    unknownBoth: string[];
  };
  families: HopV55FamilyComparisonRow[];
  confrontation: HopV55CriterionReading[];
  nonConclusions: string[];
}

export const HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT = 'hop-v55-contextual-comparison-snapshot-v1' as const;

/** Exact comparison inputs and rendered result, frozen for an explicit trial. */
export interface HopV55ContextualComparisonSnapshotV1 {
  format: typeof HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT;
  sourceId: string;
  alternativeId: string;
  sourceMaterial: HopDecisionMaterial;
  alternativeMaterial: HopDecisionMaterial;
  sourceMaterialReference: string;
  alternativeMaterialReference: string;
  readingReference: string | null;
  profileSnapshotReference: string | null;
  sourceSubject?: HopV55DocumentarySubject;
  alternativeSubject?: HopV55DocumentarySubject;
  families: HopV55ExplorationFamily[];
  criteria: HopV55ConfrontationCriterion[];
  comparison: HopV55ContextualComparison;
  reference: string;
}

export type HopV55ContextualComparisonSnapshotRead =
  | { status: 'current'; sourceId: string; alternativeId: string; sourceMaterialReference: string; alternativeMaterialReference: string;
      readingReference: string | null; profileSnapshotReference: string | null; reference: string }
  | { status: 'invalid' | 'unsupported'; reason: string };

type HopV55ContextualComparisonSnapshotBody = Omit<HopV55ContextualComparisonSnapshotV1, 'reference'>;

function isSnapshotRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function hopV55ContextualMaterialReference(material: HopDecisionMaterial): string {
  return hopAdviceContentReference('hop-v55-contextual-material-v1', material);
}

function contextualComparisonReference(comparison: HopV55ContextualComparison): string {
  return hopAdviceContentReference('hop-v55-contextual-comparison-result-v1', comparison);
}

function contextualComparisonSnapshotReference(body: HopV55ContextualComparisonSnapshotBody): string {
  return hopAdviceContentReference(HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT, body);
}

export function createHopV55ContextualComparisonSnapshot(input: {
  source: HopDecisionMaterial;
  alternative: HopDecisionMaterial;
  sourceSubject?: HopV55DocumentarySubject;
  alternativeSubject?: HopV55DocumentarySubject;
  readingReference?: string | null;
  profileSnapshotReference?: string | null;
  families: readonly HopV55ExplorationFamily[];
  criteria: readonly HopV55ConfrontationCriterion[];
}): HopV55ContextualComparisonSnapshotV1 {
  if (input.source.id === input.alternative.id) throw Error('La source et l’alternative désignent la même identité exacte.');
  const body: HopV55ContextualComparisonSnapshotBody = {
    format: HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT,
    sourceId: input.source.id,
    alternativeId: input.alternative.id,
    sourceMaterial: structuredClone(input.source),
    alternativeMaterial: structuredClone(input.alternative),
    sourceMaterialReference: hopV55ContextualMaterialReference(input.source),
    alternativeMaterialReference: hopV55ContextualMaterialReference(input.alternative),
    readingReference: input.readingReference ?? null,
    profileSnapshotReference: input.profileSnapshotReference ?? null,
    ...(input.sourceSubject ? { sourceSubject: structuredClone(input.sourceSubject) } : {}),
    ...(input.alternativeSubject ? { alternativeSubject: structuredClone(input.alternativeSubject) } : {}),
    families: structuredClone([...input.families]),
    criteria: structuredClone([...input.criteria]),
    comparison: buildHopV55ContextualComparison({
      source: input.source,
      alternative: input.alternative,
      sourceSubject: input.sourceSubject,
      alternativeSubject: input.alternativeSubject,
      families: input.families,
      criteria: input.criteria,
    }),
  };
  return { ...body, reference: contextualComparisonSnapshotReference(body) };
}

/** Validates a stored snapshot against exact current materials and recomputes its displayed comparison. */
export function readHopV55ContextualComparisonSnapshot(value: unknown, expected: {
  sourceMaterial: HopDecisionMaterial;
  alternativeMaterial: HopDecisionMaterial;
}): HopV55ContextualComparisonSnapshotRead {
  if (!isSnapshotRecord(value)) return { status: 'invalid', reason: 'Instantané de comparaison illisible.' };
  if (value.format !== HOP_V55_CONTEXTUAL_COMPARISON_SNAPSHOT_FORMAT) {
    return { status: 'unsupported', reason: `Format de comparaison non pris en charge : ${String(value.format ?? 'inconnu')}.` };
  }
  const keys = ['format', 'sourceId', 'alternativeId', 'sourceMaterial', 'alternativeMaterial', 'sourceMaterialReference',
    'alternativeMaterialReference', 'readingReference', 'profileSnapshotReference', 'sourceSubject', 'alternativeSubject', 'families', 'criteria', 'comparison', 'reference'];
  if (Object.keys(value).some((key) => !keys.includes(key)) || !Array.isArray(value.families) || !Array.isArray(value.criteria)
    || !isSnapshotRecord(value.sourceMaterial) || !isSnapshotRecord(value.alternativeMaterial) || !isSnapshotRecord(value.comparison)
    || typeof value.sourceId !== 'string' || typeof value.alternativeId !== 'string'
    || typeof value.sourceMaterialReference !== 'string' || typeof value.alternativeMaterialReference !== 'string'
    || (value.readingReference !== null && typeof value.readingReference !== 'string')
    || (value.profileSnapshotReference !== null && typeof value.profileSnapshotReference !== 'string')
    || typeof value.reference !== 'string') {
    return { status: 'invalid', reason: 'Instantané de comparaison incomplet ou contenant des champs inconnus.' };
  }
  try {
    const sourceMaterial = value.sourceMaterial as unknown as HopDecisionMaterial;
    const alternativeMaterial = value.alternativeMaterial as unknown as HopDecisionMaterial;
    if (value.sourceId !== sourceMaterial.id || value.alternativeId !== alternativeMaterial.id || value.sourceId === value.alternativeId
      || value.sourceId !== expected.sourceMaterial.id || value.alternativeId !== expected.alternativeMaterial.id
      || value.sourceMaterialReference !== hopV55ContextualMaterialReference(sourceMaterial)
      || value.alternativeMaterialReference !== hopV55ContextualMaterialReference(alternativeMaterial)
      || value.sourceMaterialReference !== hopV55ContextualMaterialReference(expected.sourceMaterial)
      || value.alternativeMaterialReference !== hopV55ContextualMaterialReference(expected.alternativeMaterial)) {
      return { status: 'invalid', reason: 'Les identités exactes ou les matières ont changé depuis la comparaison.' };
    }
    const { reference: _reference, ...body } = value;
    if (contextualComparisonSnapshotReference(body as unknown as HopV55ContextualComparisonSnapshotBody) !== value.reference) {
      return { status: 'invalid', reason: 'L’empreinte de l’instantané de comparaison ne correspond plus à son contenu.' };
    }
    const recomputed = buildHopV55ContextualComparison({
      source: sourceMaterial,
      alternative: alternativeMaterial,
      sourceSubject: value.sourceSubject as HopV55DocumentarySubject | undefined,
      alternativeSubject: value.alternativeSubject as HopV55DocumentarySubject | undefined,
      families: value.families as HopV55ExplorationFamily[],
      criteria: value.criteria as HopV55ConfrontationCriterion[],
    });
    if (contextualComparisonReference(recomputed) !== contextualComparisonReference(value.comparison as unknown as HopV55ContextualComparison)) {
      return { status: 'invalid', reason: 'Le résultat archivé ne correspond pas aux entrées documentaires et critères gelés.' };
    }
    return { status: 'current', sourceId: value.sourceId, alternativeId: value.alternativeId,
      sourceMaterialReference: value.sourceMaterialReference, alternativeMaterialReference: value.alternativeMaterialReference,
      readingReference: value.readingReference as string | null, profileSnapshotReference: value.profileSnapshotReference as string | null,
      reference: value.reference };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Comparaison archivée illisible.' };
  }
}

function uniqueSources(sources: ReadonlyArray<HopSource | undefined>): HopSource[] {
  const seen = new Set<string>();
  return sources.flatMap((source) => {
    if (!source) return [];
    const key = JSON.stringify(source);
    if (seen.has(key)) return [];
    seen.add(key);
    return [structuredClone(source)];
  });
}

function uniqueTerms(terms: readonly string[]): string[] {
  return [...new Set(terms.map((term) => term.trim()).filter(Boolean))];
}

function positive(side: HopV55DocumentarySide): boolean {
  return side.status === 'documented' || side.status === 'mixed';
}

function known(side: HopV55DocumentarySide): boolean {
  return side.status !== 'noDescriptions' && side.status !== 'unresolved';
}

/** Reads one subject through an exact lexicon with the shared negation convention. */
export function readHopV55DocumentarySide(
  subject: HopV55DocumentarySubject | undefined,
  lens: { id: string; name: string; terms: readonly string[]; sources: readonly HopSource[] },
): HopV55DocumentarySide {
  if (!subject) return { status: 'noDescriptions', mentions: [], contexts: [], reason: 'Aucune fiche de variété liée à cette matière.' };
  if (!subject.descriptions.length) {
    return { status: 'noDescriptions', mentions: [], contexts: [], reason: 'Aucune description documentaire chargée pour cette variété.' };
  }
  const terms = uniqueTerms(lens.terms);
  if (!terms.length) return { status: 'unresolved', mentions: [], contexts: [], reason: 'Lexique vide : aucun terme exact à rechercher.' };
  const dimension: BrewingSensoryDimension = {
    id: lens.id,
    version: '1',
    name: lens.name,
    definition: 'Repère lexical d’exploration; une occurrence ne mesure ni intensité ni présence dans la bière.',
    sourceRefs: uniqueSources([...lens.sources, HOP_V55_LEXICAL_RULE_SOURCE]),
    terms,
  };
  const rule: BrewingSensoryLexicalRule = {
    id: `${lens.id}-rule`,
    version: '1',
    dimensionRef: { id: dimension.id, version: dimension.version },
    terms,
    negationPrefixes: [...HOP_V55_LEXICAL_NEGATION_PREFIXES],
    sourceRefs: [structuredClone(HOP_V55_LEXICAL_RULE_SOURCE)],
  };
  try {
    const extracted = extractBrewingSensoryDocumentaryEvidence(subject, [dimension], [rule]).dimensions[0];
    const status: HopV55DocumentarySideStatus = extracted.status === 'unresolved' ? 'unresolved' : extracted.status;
    const contexts = [...new Set(extracted.mentions.map((mention) => mention.context))];
    return { status, mentions: extracted.mentions, contexts };
  } catch (error) {
    return { status: 'unresolved', mentions: [], contexts: [],
      reason: error instanceof Error ? error.message : 'Lecture documentaire impossible; aucune valeur n’est supposée.' };
  }
}

export function hopV55DocumentaryShift(source: HopV55DocumentarySide, alternative: HopV55DocumentarySide): HopV55DocumentaryShift {
  if (!known(source) || !known(alternative)) return 'unknown';
  if (positive(source) && positive(alternative)) return 'shared';
  if (positive(source)) return 'sourceOnly';
  if (positive(alternative)) return 'alternativeOnly';
  return 'neither';
}

function intentDirection(direction: HopV55Intent['criteria'][number]['direction']): HopV55ConfrontationDirection {
  switch (direction) {
    case 'increase': return 'seek';
    case 'decrease': return 'reduce';
    case 'exclude': return 'avoid';
    case 'keep': return 'keep';
    default: return 'investigate';
  }
}

/** Intent criteria keep their own status: a question is neither a profile nor a style. */
export function hopV55IntentCriteria(intent: HopV55Intent): HopV55ConfrontationCriterion[] {
  return intent.criteria.map((criterion) => {
    const axisId = criterion.axisId ?? criterion.familyId;
    return {
      id: `intent:${criterion.id}`,
      origin: { kind: 'intent', question: intent.question },
      direction: intentDirection(criterion.direction),
      label: criterion.label,
      ...(axisId ? { family: { axisId } } : {}),
    };
  });
}

function resolveCriterionFamily(criterion: HopV55ConfrontationCriterion, families: readonly HopV55ExplorationFamily[]):
  { family?: HopV55ExplorationFamily; reason?: string } {
  const ref = criterion.family;
  if (!ref) return {};
  if (ref.key) {
    const exact = families.find((family) => family.key === ref.key);
    return exact ? { family: exact } : { reason: 'La famille exacte de ce critère n’est pas chargée dans ce contexte.' };
  }
  const matches = families.filter((family) => family.axisId === ref.axisId && (ref.version === undefined || family.version === ref.version));
  if (matches.length === 1) return { family: matches[0] };
  return { reason: matches.length
    ? 'Plusieurs lexiques chargés portent cet axe; choisir une famille exacte avant de confronter.'
    : 'Aucune famille chargée ne correspond à cet axe; le critère reste à examiner.' };
}

function readCriterion(
  criterion: HopV55ConfrontationCriterion,
  index: number,
  families: readonly HopV55ExplorationFamily[],
  familyRows: readonly HopV55FamilyComparisonRow[],
  subjects: { source?: HopV55DocumentarySubject; alternative?: HopV55DocumentarySubject },
): HopV55CriterionReading {
  let source: HopV55DocumentarySide;
  let alternative: HopV55DocumentarySide;
  let family: HopV55ExplorationFamily | undefined;
  if (criterion.family) {
    const resolved = resolveCriterionFamily(criterion, families);
    if (!resolved.family) return { criterion, kind: 'notEvaluated', reason: resolved.reason ?? 'Famille non résolue.' };
    family = resolved.family;
    const row = familyRows.find((candidate) => candidate.family.key === resolved.family!.key);
    if (!row) return { criterion, kind: 'notEvaluated', family, reason: 'Famille non lue pour ces deux matières.' };
    source = row.source;
    alternative = row.alternative;
  } else if (criterion.freeTerm?.trim()) {
    const lens = { id: `exploration-term-${index}`, name: criterion.freeTerm.trim(), terms: [criterion.freeTerm.trim()], sources: [] };
    source = readHopV55DocumentarySide(subjects.source, lens);
    alternative = readHopV55DocumentarySide(subjects.alternative, lens);
  } else {
    return { criterion, kind: 'notEvaluated',
      reason: 'Critère sans famille documentaire ni terme exact : il reste lisible, sans lecture documentaire automatique.' };
  }
  const base = { criterion, ...(family ? { family } : {}), source, alternative };
  if (criterion.direction === 'investigate') {
    return { ...base, kind: 'informational', reason: 'Critère à examiner : les citations sont montrées sans conclusion.' };
  }
  if (!known(alternative)) {
    return { ...base, kind: 'unknown', reason: alternative.reason ?? 'Documentation de l’alternative indisponible : inconnu, pas zéro.' };
  }
  if (criterion.direction === 'avoid' || criterion.direction === 'reduce') {
    if (positive(alternative)) {
      return { ...base, kind: 'documentedTension', reason: 'L’alternative est décrite avec ce terme : tension documentaire, sans intensité mesurée.' };
    }
    return { ...base, kind: 'notMentioned', reason: positive(source)
      ? 'La source le mentionne, l’alternative non (ou par négation) : ce n’est pas une garantie d’absence dans la bière.'
      : 'Aucune mention affirmative pour l’alternative : ce n’est pas une garantie d’absence.' };
  }
  if (positive(alternative) && positive(source)) {
    return { ...base, kind: criterion.direction === 'keep' ? 'shared' : 'documentedSupport',
      reason: 'Les deux matières sont décrites avec ce terme; la proportion dans la bière reste inconnue.' };
  }
  if (positive(alternative)) {
    return { ...base, kind: 'documentedSupport', reason: 'Seule l’alternative est décrite avec ce terme : appui documentaire, pas une mesure.' };
  }
  if (positive(source)) {
    return { ...base, kind: 'possibleLoss', reason: 'Seule la source est décrite avec ce terme : perte possible à vérifier, non mesurée.' };
  }
  return { ...base, kind: 'notMentioned', reason: 'Aucune des deux descriptions ne porte ce terme : inconnu, pas absent.' };
}

const ANALYTE_UNKNOWN = (row: HopMaterialComparison['analytical'][number]) =>
  row.left.status === 'unknown' && row.right.status === 'unknown' && row.difference.status === 'unknown';

export function buildHopV55ContextualComparison(input: {
  source: HopDecisionMaterial;
  alternative: HopDecisionMaterial;
  sourceSubject?: HopV55DocumentarySubject;
  alternativeSubject?: HopV55DocumentarySubject;
  families: readonly HopV55ExplorationFamily[];
  criteria?: readonly HopV55ConfrontationCriterion[];
}): HopV55ContextualComparison {
  const { source, alternative } = input;
  if (source.id === alternative.id) throw Error('La source et l’alternative désignent la même identité exacte.');
  const material = compareHopMaterials(source, alternative);
  const identityNotes: string[] = [];
  const sourceVarietyId = source.variety?.id ?? source.lot?.varietyId;
  const alternativeVarietyId = alternative.variety?.id ?? alternative.lot?.varietyId;
  if (sourceVarietyId && sourceVarietyId === alternativeVarietyId) {
    identityNotes.push('Même variété, identités distinctes (forme, lot ou produit) : la comparaison porte sur la matière, pas sur la variété.');
  }
  if (source.form !== alternative.form) {
    identityNotes.push(`Formes différentes (${HOP_V55_FORM_LABELS[source.form]} → ${HOP_V55_FORM_LABELS[alternative.form]}) : aucun ratio de forme n’est déduit.`);
  }
  if (source.form === 'unknown' || alternative.form === 'unknown') {
    identityNotes.push('Une forme est inconnue : les lectures analytiques restent documentaires et conditionnelles.');
  }
  if (!input.sourceSubject || !input.alternativeSubject) {
    identityNotes.push('Une matière n’a pas de fiche de variété liée : ses descriptions restent inconnues.');
  }
  const families = input.families.map((family, index) => {
    const lens = { id: `exploration-family-${index}`, name: family.name, terms: family.terms, sources: family.sources };
    const sourceSide = readHopV55DocumentarySide(input.sourceSubject, lens);
    const alternativeSide = readHopV55DocumentarySide(input.alternativeSubject, lens);
    return { family, source: sourceSide, alternative: alternativeSide, shift: hopV55DocumentaryShift(sourceSide, alternativeSide) };
  });
  const confrontation = (input.criteria ?? []).map((criterion, index) => readCriterion(criterion, index, input.families, families,
    { source: input.sourceSubject, alternative: input.alternativeSubject }));
  return {
    version: 'hop-v55-contextual-comparison-v1',
    sourceId: source.id,
    alternativeId: alternative.id,
    identityNotes,
    material,
    analytical: {
      readable: material.analytical.filter((row) => !ANALYTE_UNKNOWN(row)),
      conflicts: material.analytical.filter((row) => row.left.status === 'conflict' || row.right.status === 'conflict').map((row) => row.analyte),
      unknownBoth: material.analytical.filter(ANALYTE_UNKNOWN).map((row) => row.analyte),
    },
    families,
    confrontation,
    nonConclusions: [
      'Aucun gain ni perte sensoriels ne sont chiffrés : une mention documentaire n’est pas une intensité dans la bière.',
      'Une plage rapportée n’a pas de centre; aucune moyenne ni valeur probable n’est affichée.',
      'Aucune masse n’est proposée : une convention de dose reste un choix explicite de l’essai.',
      'Une projection fine n’existe qu’après prévision J5 et adoption d’un plan de nuances, sous hypothèses sourcées.',
    ],
  };
}

/* ---------- Free beer profile: a declared lens, never a style guide or a batch fact ---------- */

/* Profile persistence, validation and history are owned by the shared service. */

export function hopV55ProfileCriteria(profile: HopV55ExplorationProfileV1, persisted: boolean): HopV55ConfrontationCriterion[] {
  return profile.criteria.map((criterion) => ({
    id: `profile:${profile.profileId}:${criterion.id}`,
    origin: { kind: 'profile', profileReference: persisted ? profile.reference : null, label: profile.label, status: profile.status, persisted },
    direction: criterion.direction,
    label: criterion.label,
    ...(criterion.family ? { family: { key: criterion.family.key, axisId: criterion.family.axisId, version: criterion.family.version } } : {}),
    ...(criterion.freeTerm ? { freeTerm: criterion.freeTerm } : {}),
  }));
}

/* ---------- Trial: explicit lines resolved only by the canonical program preparation ---------- */

export type HopV55TrialLineDraft =
  | { key: string; originProgramReference: string | null; originContextReference: string | null;
      kind: 'add'; additionId: string; materialId: string; grams?: number; use?: HopUse;
      boilMinutes?: number; contactHours?: number; temperatureC?: number; dayOffset?: number }
  | { key: string; originProgramReference: string | null; originContextReference: string | null;
      kind: 'replace'; sourceAdditionId?: string; materialId: string; dose: '' | 'explicit' | 'basis';
      grams?: number; basis?: HopReplacementBasis }
  | { key: string; originProgramReference: string | null; originContextReference: string | null;
      kind: 'setDose'; sourceAdditionId?: string; mode: '' | 'target' | 'increase' | 'decrease'; grams?: number }
  | { key: string; originProgramReference: string | null; originContextReference: string | null; kind: 'remove'; sourceAdditionId?: string };

export interface HopV55TrialOperationsResult {
  operations: HopV55ProgramOperationV1[];
  /** Choices the service would otherwise resolve implicitly (e.g. a single program line). */
  localNeeds: Array<{ key: string; reason: string }>;
}

export function hopV55TrialOperations(lines: readonly HopV55TrialLineDraft[], label: (line: HopV55TrialLineDraft) => string): HopV55TrialOperationsResult {
  const operations: HopV55ProgramOperationV1[] = [];
  const localNeeds: HopV55TrialOperationsResult['localNeeds'] = [];
  for (const line of lines) {
    const id = `exploration-operation:${line.key}`;
    if (line.kind === 'add') {
      const conditions = {
        ...(line.boilMinutes !== undefined ? { boilMinutes: line.boilMinutes } : {}),
        ...(line.contactHours !== undefined ? { contactHours: line.contactHours } : {}),
        ...(line.temperatureC !== undefined ? { temperatureC: line.temperatureC } : {}),
        ...(line.dayOffset !== undefined ? { dayOffset: line.dayOffset } : {}),
      };
      operations.push({ id, label: label(line), kind: 'add', additionId: line.additionId, materialId: line.materialId,
        grams: line.grams ?? null, ...(line.use ? { use: line.use } : {}), ...(Object.keys(conditions).length ? { conditions } : {}) });
      continue;
    }
    if (!line.sourceAdditionId) {
      localNeeds.push({ key: line.key, reason: 'Choisis explicitement la ligne du programme concernée; aucune ligne n’est retenue par défaut.' });
      continue;
    }
    if (line.kind === 'replace') {
      if (line.dose === 'basis' && !line.basis) {
        localNeeds.push({ key: line.key, reason: 'Choisis la convention de dose; aucune n’est appliquée implicitement.' });
        continue;
      }
      const dose = line.dose === 'explicit' ? { kind: 'explicit' as const, grams: line.grams ?? null }
        : line.dose === 'basis' && line.basis ? { kind: 'basis' as const, basis: line.basis, ...(line.grams !== undefined ? { chosenGrams: line.grams } : {}) }
          : undefined;
      operations.push({ id, label: label(line), kind: 'replace', additionId: line.sourceAdditionId, materialId: line.materialId, ...(dose ? { dose } : {}) });
    } else if (line.kind === 'setDose') {
      const quantity = line.mode === 'target' ? { kind: 'target' as const, grams: line.grams ?? null }
        : line.mode === 'increase' || line.mode === 'decrease' ? { kind: 'delta' as const, grams: line.grams ?? null, direction: line.mode }
          : undefined;
      operations.push({ id, label: label(line), kind: 'setDose', additionId: line.sourceAdditionId, ...(quantity ? { quantity } : {}) });
    } else {
      operations.push({ id, label: label(line), kind: 'remove', additionId: line.sourceAdditionId, quantity: { kind: 'entire' } });
    }
  }
  return { operations, localNeeds };
}

export type HopV55TrialFreshness = 'fresh' | 'stale' | 'noProgram';

/** A preparation sealed against program A is never sent for program B. */
export function hopV55TrialFreshness(preparation: Pick<HopV55DecisionProgramPreparationV1, 'programReference'>,
  program: HopDecisionProgram | null | undefined): HopV55TrialFreshness {
  if (!program) return 'noProgram';
  try {
    return programFingerprint(program) === preparation.programReference ? 'fresh' : 'stale';
  } catch {
    return 'stale';
  }
}

export const HOP_V55_EXPLORATION_TRIAL_FORMAT = HOP_V55_EXPLORATION_TRIAL_ENTRY_V1_FORMAT;
export type HopV55ExplorationTrialRequestV1 = HopV55ExplorationTrialEntryV1;
