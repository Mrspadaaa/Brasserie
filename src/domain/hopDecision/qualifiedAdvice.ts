import { answerHopDecision, type HopDecisionAction, type HopDecisionIntent } from './service';
import { qualifyHopCatalogueVariants } from './catalogueQualification';
import type { HopQualifiedAssemblyInput } from './qualifiedDecision';
import type { HopDecisionContext } from './dossier';
import type { HopDecisionMaterial } from './types';
import type { HopAdviceInput } from './adviceSchema';
import { hopAdviceStudyReference, type HopAdviceStudyV3 } from './adviceDossier';

export type HopAdviceAction = Extract<HopDecisionAction, { kind: 'exploreStrategies' }>;
export interface AnswerQualifiedHopAdviceInput {
  intent: HopDecisionIntent;
  action: Omit<HopAdviceAction, 'qualification'>;
  qualificationInput: HopQualifiedAssemblyInput;
  context?: HopDecisionContext | null;
}

/**
 * A documentary identity may remain unresolved without suppressing the advice.
 * Only genuine safe projections enter the executed service's material list;
 * omitted identities and conditional sources enter its explicit coverage.
 */
export function answerQualifiedHopAdvice(input: AnswerQualifiedHopAdviceInput): HopAdviceStudyV3 {
  if (input.action?.kind !== 'exploreStrategies' || !input.intent?.originalQuestion?.trim()) {
    throw Error('Le conseil exige sa question originale et une action exploreStrategies.');
  }
  if (input.qualificationInput.assembly && input.qualificationInput.assembly.version !== 'hop-catalogue-assembly-v1') {
    throw Error('Version d’assemblage non prise en charge pour un nouveau conseil ; conserver l’archive sans l’interpréter.');
  }
  const qualification = qualifyHopCatalogueVariants(input.qualificationInput);
  const byId = new Map<string, typeof qualification.groups>();
  for (const group of qualification.groups) for (const variant of group.rawVariants) {
    const groups = byId.get(variant.material.id) ?? [];
    if (!groups.some(row => row.key === group.key)) groups.push(group);
    byId.set(variant.material.id, groups);
  }
  const requestedIds = new Set([
    ...(input.action.situation.materialIds ?? [...byId.keys()]),
    ...(input.action.situation.program?.additions.map(row => row.materialId) ?? []),
  ]);
  const materials: HopDecisionMaterial[] = [];
  const scope: NonNullable<HopAdviceInput['qualification']> = { omitted: [], conditional: [], limitations: [] };
  for (const materialId of requestedIds) {
    const groups = byId.get(materialId) ?? [];
    const recordKeys = groups.map(group => group.key).sort();
    if (groups.length !== 1) {
      scope.omitted.push({ materialId, recordKeys, reason: groups.length
        ? 'Identité portée par plusieurs groupes de catalogue ; aucune portée n’est choisie par ordre.'
        : 'Matière absente du snapshot fourni ; aucune identité, analyse ou disponibilité de remplacement inventée.' });
      continue;
    }
    const group = groups[0];
    const projection = group.status === 'ready' || group.status === 'equivalentVariants' ? group.calculationProjection
      : group.status === 'collisionNeedsSelection' ? group.commonCalculationProjection : null;
    if (!projection || projection.material.id !== materialId) {
      scope.omitted.push({ materialId, recordKeys, reason: group.blockers.join(' ') || 'Aucune projection sûre pour cette identité ; les variantes restent dans le dossier.' });
      continue;
    }
    materials.push(structuredClone(projection.material));
    if (group.status === 'collisionNeedsSelection') scope.conditional.push({ materialId, recordKeys,
      reason: group.commonCalculationReasons.join(' ') || 'Vue commune seulement ; les faits divergents restent non choisis.' });
  }
  const notices = input.qualificationInput.assembly?.notices;
  if (input.qualificationInput.assembly && !Array.isArray(notices)) throw Error('Notices de l’assemblage v1 mal formées.');
  for (const notice of Array.isArray(notices) ? notices : []) {
    if (!notice || typeof notice.materialId !== 'string' || typeof notice.reason !== 'string') throw Error('Notice de provenance mal formée.');
    if (requestedIds.has(notice.materialId)) scope.limitations.push(notice.reason);
  }
  scope.limitations.push('Les matières non projetées restent des identités documentaires ; leur présence ne permet aucune action chiffrée implicite.');
  if (input.action.situation.materialIds) scope.limitations.push('Le conseil porte sur les matières explicitement désignées et le contexte du programme ; les autres fiches chargées restent dans le snapshot, sans être automatiquement des options.');
  const serviceInput = { intent: structuredClone(input.intent), action: { ...structuredClone(input.action), qualification: scope }, materials };
  const responseSnapshot = answerHopDecision(serviceInput);
  const payload = {
    formatVersion: 3 as const, kind: 'advice' as const,
    requestSnapshot: { intent: structuredClone(input.intent), action: structuredClone(input.action), qualificationInput: structuredClone(input.qualificationInput) },
    qualificationSnapshot: { version: qualification.version, result: structuredClone(qualification) },
    serviceInput, responseSnapshot, context: structuredClone(input.context ?? null),
  };
  return { ...payload, reference: hopAdviceStudyReference(payload) };
}
