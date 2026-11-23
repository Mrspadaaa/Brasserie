import type {
  HopPropertyAdviceIntentV3,
  HopPropertyAdviceMetric,
} from '../../domain/hopDecision/propertyAdviceSchema';

/**
 * Garde frontend de la question V3 « comparer des compensations perceptives ».
 * Pur, sans React. Elle nomme ce qui est incompatible et propose des corrections explicites;
 * elle ne corrige, ne normalise et ne retire jamais rien d’elle-même. Les formats restent ceux du schéma.
 * Ce n’est ni une baisse ni un choix d’amertume : seule la nature de la question est décrite ici.
 */
export const COMPENSATION_KIND = 'comparePerceptualCompensation' as const;
/** Métriques qui ne peuvent pas qualifier la question elle-même (sensory et unspecified restent recevables). */
export const COMPENSATION_FORBIDDEN_METRICS: readonly HopPropertyAdviceMetric[] = ['pH', 'analyticalBU', 'titratableAcidity'];

type Intent = HopPropertyAdviceIntentV3;

export type CompensationFix =
  | { kind: 'setQuestionMetric'; metric: 'sensory' | 'unspecified' }
  | { kind: 'setQuestionRole' }
  | { kind: 'setQuestionDirection' }
  | { kind: 'clearQuestion' }
  | { kind: 'linkObservation'; observationId: string }
  | { kind: 'dropObservation'; observationId: string }
  | { kind: 'restoreObservation'; observationId: string }
  | { kind: 'dedupeObservations' };

export type CompensationIssueCode = 'empty' | 'duplicate' | 'selfReference' | 'missingObservation' | 'notObservation'
  | 'notSensory' | 'observationDirection' | 'notRelated' | 'questionMetric' | 'questionRole' | 'questionDirection';

export interface CompensationIssue {
  /** Intention qui porte la question de comparaison. */
  intentId: string;
  code: CompensationIssueCode;
  /** Bloquant : la nouvelle lecture n’est pas envoyée tant que le point reste ouvert. */
  blocking: boolean;
  message: string;
  fixes: Array<{ label: string; fix: CompensationFix }>;
}

const metricWords: Record<HopPropertyAdviceMetric, string> = {
  sensory: 'perception sensorielle', pH: 'pH', titratableAcidity: 'acidité titrable',
  analyticalBU: 'amertume analytique (BU)', unspecified: 'métrique non précisée',
};
const roleWords: Record<Intent['role'], string> = {
  target: 'ce que je veux obtenir', reportedObservation: 'ce que je constate', measurement: 'une valeur mesurée',
  investigation: 'une question à examiner', preference: 'une préférence', constraint: 'une limite à respecter',
};

export const isCompensationQuestion = (intent: Intent): boolean => intent.investigation?.kind === COMPENSATION_KIND;
export const isForbiddenCompensationMetric = (metric: HopPropertyAdviceMetric): boolean => COMPENSATION_FORBIDDEN_METRICS.includes(metric);
/** Constat comparable : observation rapportée, perception sensorielle et aucune direction d’objectif. */
export const isAdmissibleCompensationObservation = (intent: Intent): boolean => intent.role === 'reportedObservation'
  && intent.metric === 'sensory' && intent.direction === null;

export function admissibleCompensationObservations(intents: readonly Intent[], ownerId: string | null): Intent[] {
  return intents.filter((row) => row.id !== ownerId && isAdmissibleCompensationObservation(row));
}

const quoted = (intent: Intent | undefined, id: string): string => intent ? `« ${intent.label || 'terme sans libellé'} »` : `la référence ${id}`;

export function compensationIssues(intents: readonly Intent[]): CompensationIssue[] {
  const byId = new Map(intents.map((row) => [row.id, row]));
  const issues: CompensationIssue[] = [];
  for (const owner of intents) {
    const investigation = owner.investigation;
    if (!investigation || investigation.kind !== COMPENSATION_KIND) continue;
    const ids = investigation.observationIntentIds;
    const clear = { label: 'Garder une question ouverte, sans comparaison', fix: { kind: 'clearQuestion' } as CompensationFix };
    if (!ids.length) {
      issues.push({ intentId: owner.id, code: 'empty', blocking: true,
        message: 'Choisis au moins un constat perçu à comparer; la comparaison ne peut pas rester vide.', fixes: [clear] });
    }
    if (new Set(ids).size !== ids.length) {
      issues.push({ intentId: owner.id, code: 'duplicate', blocking: true,
        message: 'Un même constat est cité plusieurs fois dans la comparaison.',
        fixes: [{ label: 'Ne garder qu’une fois chaque constat', fix: { kind: 'dedupeObservations' } }] });
    }
    for (const id of [...new Set(ids)]) {
      const drop = { label: 'Le retirer de la comparaison', fix: { kind: 'dropObservation', observationId: id } as CompensationFix };
      const observation = byId.get(id);
      if (id === owner.id) {
        issues.push({ intentId: owner.id, code: 'selfReference', blocking: true,
          message: 'La question ne peut pas se comparer à elle-même.', fixes: [drop] });
        continue;
      }
      if (!observation) {
        issues.push({ intentId: owner.id, code: 'missingObservation', blocking: true,
          message: `${quoted(undefined, id)} n’est plus dans cette lecture; elle reste citée par la comparaison.`, fixes: [drop] });
        continue;
      }
      const restore = { label: 'Le remettre en constat perçu (« ce que je constate », perception)',
        fix: { kind: 'restoreObservation', observationId: id } as CompensationFix };
      if (observation.role !== 'reportedObservation') {
        issues.push({ intentId: owner.id, code: 'notObservation', blocking: true,
          message: `${quoted(observation, id)} est maintenant lu comme ${roleWords[observation.role]}; seuls des constats rapportés sans direction d’objectif se comparent ici.`,
          fixes: [restore, drop] });
      } else if (observation.metric !== 'sensory') {
        issues.push({ intentId: owner.id, code: 'notSensory', blocking: true,
          message: `${quoted(observation, id)} est qualifié par « ${metricWords[observation.metric]} »; seuls des constats perçus (perception sensorielle) sans direction d’objectif se comparent ici.`,
          fixes: [{ label: 'Le qualifier en perception sensorielle', fix: { kind: 'restoreObservation', observationId: id } }, drop] });
      } else if (observation.direction !== null) {
        issues.push({ intentId: owner.id, code: 'observationDirection', blocking: true,
          message: `${quoted(observation, id)} porte aussi une direction d’objectif; un constat rapporté doit garder sa direction nulle pour être comparé.`,
          fixes: [restore, drop] });
      }
      if (!owner.relatedIntentIds.includes(id)) {
        issues.push({ intentId: owner.id, code: 'notRelated', blocking: true,
          message: `${quoted(observation, id)} est comparé mais n’est plus relié à cette question.`,
          fixes: [{ label: 'Le relier de nouveau à cette question', fix: { kind: 'linkObservation', observationId: id } }, drop] });
      }
    }
    if (isForbiddenCompensationMetric(owner.metric)) {
      issues.push({ intentId: owner.id, code: 'questionMetric', blocking: true,
        message: `Cette comparaison porte sur une perception : « ${metricWords[owner.metric]} » ne peut pas qualifier la question. La sélection est conservée telle quelle jusqu’à ton choix.`,
        fixes: [{ label: 'Qualifier la question en perception sensorielle', fix: { kind: 'setQuestionMetric', metric: 'sensory' } },
          { label: 'Laisser la métrique non précisée', fix: { kind: 'setQuestionMetric', metric: 'unspecified' } }, clear] });
    }
    if (owner.role !== 'investigation') {
      issues.push({ intentId: owner.id, code: 'questionRole', blocking: true,
        message: `Cette comparaison est portée par un terme lu comme ${roleWords[owner.role]}; une question de compensation exige « une question à examiner » et la direction « l’examiner ».`,
        fixes: [{ label: 'Le relire comme une question à examiner', fix: { kind: 'setQuestionRole' } }, clear] });
    } else if (owner.direction !== 'investigate') {
      issues.push({ intentId: owner.id, code: 'questionDirection', blocking: true,
        message: 'Une question de compensation doit garder la direction « l’examiner »; le choix reste tel quel jusqu’à ta correction.',
        fixes: [{ label: 'Décrire cette question comme « à examiner »', fix: { kind: 'setQuestionDirection' } }, clear] });
    }
  }
  return issues;
}

export const blockingCompensationIssues = (intents: readonly Intent[]): CompensationIssue[] =>
  compensationIssues(intents).filter((issue) => issue.blocking);

/** Applique UNE correction choisie explicitement; retourne les intentions à remplacer (identités, fragments et origines conservés). */
export function applyCompensationFix(intents: readonly Intent[], ownerId: string, fix: CompensationFix): Intent[] {
  const owner = intents.find((row) => row.id === ownerId);
  if (!owner?.investigation) return [];
  const investigation = owner.investigation;
  switch (fix.kind) {
    case 'setQuestionMetric': return [{ ...owner, metric: fix.metric }];
    case 'setQuestionRole': return [{ ...owner, role: 'investigation', direction: 'investigate' }];
    case 'setQuestionDirection': return [{ ...owner, direction: 'investigate' }];
    case 'clearQuestion': { const { investigation: _removed, ...rest } = owner; return [rest]; }
    case 'linkObservation': return [{ ...owner, relatedIntentIds: [...new Set([...owner.relatedIntentIds, fix.observationId])] }];
    case 'dropObservation': return [{ ...owner, investigation: { ...investigation,
      observationIntentIds: investigation.observationIntentIds.filter((id) => id !== fix.observationId) } }];
    case 'dedupeObservations': return [{ ...owner, investigation: { ...investigation,
      observationIntentIds: [...new Set(investigation.observationIntentIds)] } }];
    case 'restoreObservation': {
      const observation = intents.find((row) => row.id === fix.observationId);
      return observation ? [{ ...observation, role: 'reportedObservation', metric: 'sensory', direction: null }] : [];
    }
  }
}

/** Ouvre une comparaison vide : le problème « vide » reste visible jusqu’au choix d’un constat. */
export function startCompensation(owner: Intent): Intent {
  return { ...owner, role: 'investigation', direction: 'investigate',
    investigation: { kind: COMPENSATION_KIND, observationIntentIds: [] } };
}

/** Cocher relie aussi le constat à la question (dit à l’écran); décocher le retire de la comparaison seulement. */
export function toggleCompensationObservation(owner: Intent, observationId: string, checked: boolean): Intent {
  const investigation = owner.investigation ?? { kind: COMPENSATION_KIND, observationIntentIds: [] };
  if (checked) {
    return { ...owner,
      investigation: { ...investigation, observationIntentIds: [...new Set([...investigation.observationIntentIds, observationId])] },
      relatedIntentIds: [...new Set([...owner.relatedIntentIds, observationId])] };
  }
  return { ...owner, investigation: { ...investigation,
    observationIntentIds: investigation.observationIntentIds.filter((id) => id !== observationId) } };
}
