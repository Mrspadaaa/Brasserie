import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import type { HopPropertyAdviceIntentV3, HopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import {
  hopV55PropertyAdviceCurrentAssertionIds,
  hopV55PropertyAdviceMaterialsNamedInSpan,
  hopV55PropertyAdviceMetricForTerm,
} from './propertyAdvicePreparation';
import { sealHopV55PropertyAdviceRequestDraftV3FromIntents, type HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3';
import { assertHopV55SemanticQuestionReadingV1 } from './decisionSemanticProjection';
import type { HopV55SemanticAnnotationV1, HopV55SemanticQuestionReadingV1 } from './questionSemanticReading';

/**
 * Direct adapter from typed semantic annotations to the existing PropertyAdviceV3
 * request. Role, direction, engagement and relations come from the reading; the
 * question is never rescanned and no reader note is decoded into a role. A
 * material identity is bound only from the subject fragment already attached
 * to the annotation; otherwise it stays unknown.
 */

type Property = HopPropertyAdviceIntentV3['property'];
type RoleDirection = Pick<HopPropertyAdviceIntentV3, 'role' | 'direction' | 'required'> & {
  basisKind: HopPropertyAdviceIntentV3['comparisonBasis']['kind'];
};

const PROPERTY_BY_LEXICON_KEY: Readonly<Record<string, Property>> = {
  acidity: 'acidity', biotransformation: 'bioContribution', 'aroma-expression': 'aroma', bitterness: 'bitterness', sweetness: 'sweetness',
};

function lexiconKey(annotation: HopV55SemanticAnnotationV1): string | undefined {
  return annotation.lexicon.status === 'lexicon' || annotation.lexicon.status === 'proposedAlias' ? annotation.lexicon.key : undefined;
}

function plainTerm(value: string): string {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
}

function propertyOf(annotation: HopV55SemanticAnnotationV1): Property {
  if (annotation.inquiry === 'characterization') return 'materialCharacter';
  if (annotation.sense === 'reportedObservation' && annotation.subject?.kind === 'material') return 'materialCharacter';
  if (annotation.familyId || annotation.dimension === 'aroma' || annotation.mentionKind === 'partnerPreference') return 'aroma';
  const key = lexiconKey(annotation);
  if (key && PROPERTY_BY_LEXICON_KEY[key]) return PROPERTY_BY_LEXICON_KEY[key];
  if (annotation.dimension === 'bioInteraction') return 'bioContribution';
  if (annotation.dimension === 'acidity') return 'acidity';
  if (/^aromatis/u.test(plainTerm(annotation.term))) return 'aroma';
  return 'unresolved';
}

function roleOf(annotation: HopV55SemanticAnnotationV1): RoleDirection {
  switch (annotation.sense) {
    // Canonical sense, high or low level alike: the strategy-service convention `targetAsIncrease` never reaches PropertyV3.
    case 'qualitativeTarget': return { role: 'target', direction: null, required: true, basisKind: 'qualitativeTarget' };
    case 'directedChange': return annotation.direction === 'increase'
      ? { role: 'target', direction: 'increase', required: true, basisKind: 'qualitativeTarget' }
      : { role: 'target', direction: 'decrease', required: true, basisKind: 'current' };
    case 'guard': return { role: annotation.guard === 'preserve' ? 'target' : 'constraint', direction: 'keep', required: true, basisKind: 'current' };
    case 'exclusion': return { role: 'constraint', direction: 'exclude', required: true, basisKind: 'none' };
    case 'reportedObservation': return { role: 'reportedObservation', direction: null, required: false, basisKind: 'current' };
    case 'investigation': return { role: 'investigation', direction: 'investigate', required: true, basisKind: 'none' };
    case 'nonDecision': return { role: 'investigation', direction: 'investigate', required: false, basisKind: 'none' };
    case 'mention': return annotation.mentionKind === 'contextNote'
      ? { role: 'reportedObservation', direction: null, required: false, basisKind: 'current' }
      : { role: 'preference', direction: null, required: false, basisKind: 'none' };
  }
}

function basisText(annotation: HopV55SemanticAnnotationV1, linked: boolean): string {
  if (annotation.origin === 'brasseur') return 'Annotation corrigée par le brasseur; source et qualificatif exacts sont conservés.';
  switch (annotation.sense) {
    case 'qualitativeTarget':
      return 'Cible qualitative engagée par la question; qualificatif exact conservé (niveau visé), sans valeur actuelle, échelle ni changement déduit.';
    case 'directedChange': return 'Changement choisi dans la question; sa direction exacte est conservée.';
    case 'guard': return 'Garde formulée dans la question; aucune hausse ni baisse n’en est déduite.';
    case 'exclusion': return 'Exclusion formulée dans la question.';
    case 'reportedObservation': return 'Constat rapporté conservé dans son contexte; aucune mesure ni demande de changement n’est déduite.';
    case 'nonDecision': return 'Aucun changement n’a été décidé; aucune cible ou mesure n’est posée.';
    case 'mention': return annotation.mentionKind === 'partnerPreference' ? 'Préférence de partenaire conservée; elle n’est pas une cible de changement.'
      : annotation.mentionKind === 'contextNote' ? 'Note de contexte citée; ni cible ni mesure n’est déduite.'
        : 'Mention facultative conservée; elle n’est pas une cible.';
    case 'investigation':
      if (annotation.inquiry === 'compensation') return linked
        ? 'La demande de compensation reste une investigation reliée au constat source; aucun levier ni résultat de goût n’est choisi.'
        : 'La demande de compensation reste une investigation; son objet et son levier demeurent à qualifier.';
      if (annotation.inquiry === 'characterization') return 'Caractérisation de la matière demandée avant son choix; aucune identité ni analyse n’est attribuée.';
      return 'Question d’investigation conservée; elle ne devient pas une observation ni un effet.';
  }
}

/** The exact qualifier only; a reader note is never copied into a domain qualification. */
function qualifierOf(annotation: HopV55SemanticAnnotationV1): string | null {
  return annotation.qualification ?? null;
}

function subjectOf(annotation: HopV55SemanticAnnotationV1, property: Property, role: RoleDirection,
  prepared: PreparedBrewingScenarioContext): HopPropertyAdviceIntentV3['subject'] {
  if (annotation.inquiry === 'characterization') {
    return { kind: 'material', label: annotation.subject?.source?.text ?? annotation.term, materialId: null, sensoryContext: 'unspecified' };
  }
  if (property === 'materialCharacter') {
    const subject = annotation.subject?.source;
    // Only the attached subject fragment can name an identity; a nearby material never fills an unknown subject.
    const matches = subject ? hopV55PropertyAdviceMaterialsNamedInSpan(subject, prepared) : [];
    return { kind: 'material', label: subject?.text ?? 'Matière citée; identité non liée à une matière chargée.',
      materialId: matches.length === 1 ? matches[0].id : null,
      sensoryContext: subject && /\b(?:houblons?|hops?)\b/iu.test(subject.text) ? 'rawHop' : 'unspecified' };
  }
  if (property === 'bioContribution') return { kind: 'culture', label: prepared.runtime.current?.culture
    ? 'Culture de fermentation du contexte préparé' : 'Culture de fermentation citée; identité non résolue',
  materialId: null, sensoryContext: 'unspecified' };
  if (property === 'unresolved') return ['target', 'preference', 'constraint', 'reportedObservation'].includes(role.role)
    ? { kind: 'beer', label: 'Bière visée; propriété à préciser.', materialId: null, sensoryContext: 'beer' }
    : { kind: 'unspecified', label: 'Sujet à qualifier depuis la question; aucune bière ou matière assignée.', materialId: null, sensoryContext: 'unspecified' };
  return { kind: 'beer', label: 'Bière visée', materialId: null, sensoryContext: 'beer' };
}

/** Builds one V3 intent per semantic annotation, in reading order, with typed relations only. */
export function hopV55PropertyIntentsFromSemanticReadingV1(reading: HopV55SemanticQuestionReadingV1,
  prepared: PreparedBrewingScenarioContext): HopPropertyAdviceIntentV3[] {
  const byId = new Map(reading.annotations.map(row => [row.id, row]));
  const built = new Map<string, HopPropertyAdviceIntentV3>();
  // Observations first so that a compensation can take its referent's exact property and subject.
  const ordered = [...reading.annotations].sort((left, right) =>
    Number(left.inquiry === 'compensation') - Number(right.inquiry === 'compensation'));
  for (const annotation of ordered) {
    const role = roleOf(annotation);
    const related = annotation.relatedAnnotationIds.filter(id => byId.has(id));
    const referents = annotation.inquiry === 'compensation' ? related.map(id => built.get(id)).filter((row): row is HopPropertyAdviceIntentV3 => !!row) : [];
    const shared = referents.length && referents.every(row => row.property === referents[0].property && row.metric === referents[0].metric)
      ? referents[0] : undefined;
    const property = annotation.inquiry === 'compensation' ? shared?.property ?? 'unresolved' : propertyOf(annotation);
    const subject = annotation.inquiry === 'compensation'
      ? shared ? structuredClone(shared.subject) : { kind: 'unspecified' as const, label: 'Objet de la compensation à préciser depuis la demande exacte.',
        materialId: null, sensoryContext: 'unspecified' as const }
      : subjectOf(annotation, property, role, prepared);
    const metric = annotation.inquiry === 'compensation' ? shared?.metric ?? 'unspecified' : hopV55PropertyAdviceMetricForTerm(property, annotation.term);
    const partnerNote = annotation.partner ? ` Relation d’accord conservée avec le contexte exact « ${annotation.partner.text} ».` : '';
    const intent: HopPropertyAdviceIntentV3 = {
      id: annotation.id, property, label: annotation.term,
      ...(annotation.familyId ? { familyId: annotation.familyId } : {}),
      ...(annotation.partner ? { partner: { kind: 'freeContext' as const, text: annotation.partner.text } } : {}),
      role: role.role, direction: role.direction, qualification: qualifierOf(annotation), required: role.required,
      comparisonBasis: { kind: role.basisKind, assertionIds: role.basisKind === 'current' ? hopV55PropertyAdviceCurrentAssertionIds(prepared, property) : [] },
      metric, subject, sourceSpans: [structuredClone(annotation.source)],
      interpretationOrigin: annotation.origin === 'brasseur' ? 'user' : 'proposal',
      basis: basisText(annotation, !!shared) + partnerNote,
      relatedIntentIds: related,
    };
    built.set(annotation.id, intent);
  }
  // A compensation is a typed perceptual comparison only when every link is a sensory reported observation.
  for (const annotation of reading.annotations) {
    if (annotation.inquiry !== 'compensation') continue;
    const intent = built.get(annotation.id)!;
    const observations = intent.relatedIntentIds.map(id => built.get(id));
    if (observations.length && observations.every(row => row?.role === 'reportedObservation' && row.metric === 'sensory')
      && ['sensory', 'unspecified'].includes(intent.metric)) {
      intent.investigation = { kind: 'comparePerceptualCompensation', observationIntentIds: [...intent.relatedIntentIds] };
    }
  }
  return reading.annotations.map(row => built.get(row.id)!);
}

export interface PrepareHopV55PropertyAdviceFromSemanticReadingV1Input {
  reading: HopV55SemanticQuestionReadingV1;
  prepared: PreparedBrewingScenarioContext;
  sourceReadingReference: string;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  candidatePolicy: HopPropertyAdviceRequestV3['candidatePolicy'];
}

/** Existing V3 request draft from a sealed semantic reading; no fallback to the historical wording mapper. */
export function prepareHopV55PropertyAdviceFromSemanticReadingV1(
  input: PrepareHopV55PropertyAdviceFromSemanticReadingV1Input,
): HopV55PropertyAdviceRequestDraftV3 {
  assertHopV55SemanticQuestionReadingV1(input.reading);
  return sealHopV55PropertyAdviceRequestDraftV3FromIntents({
    question: input.reading.intent.question,
    sourceAnnotations: input.reading.annotations.map(row => ({ id: row.id, source: row.source })),
    propertyIntents: hopV55PropertyIntentsFromSemanticReadingV1(input.reading, input.prepared),
    prepared: input.prepared, requestId: input.requestId, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    sourceReadingReference: input.sourceReadingReference, candidatePolicy: input.candidatePolicy,
  });
}
