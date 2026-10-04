import { hopDecisionReference } from './measurements';
import { analyzeHopProgram } from './programAnalysis';
import { deriveHopProgramDraft, previewHopProgramChanges, applyHopProgramProposal, restoreHopProgramDraft } from './programs';
import { answerQualifiedHopDecision, type HopQualifiedAssemblyInput } from './qualifiedDecision';
import { answerQualifiedHopAdvice } from './qualifiedAdvice';
import { hopAdviceResultReference } from './adviceSchema';
import {
  createHopAdviceEvent, hopAdviceStudyReference, hopAdvicePreferenceReference, hopAdviceInterpretationReference,
  hopAdviceProgramPreviewReference, hopAdviceProgramApplicationReference, hopAdviceDraftRestorationReference,
  type HopAdviceStudyV3, type HopAdviceEventCommand, type HopAdviceEventPayloadV3,
  type HopAdviceProgramPreviewReceipt, type HopAdviceProgramApplicationReceipt, type HopAdviceDraftRestorationReceipt,
} from './adviceDossier';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramChange } from './types';

type Preference = HopAdviceEventPayloadV3['strategyPreferred'];
type EventIdentity = Pick<HopAdviceEventCommand, 'ownerKey' | 'dossierId' | 'eventId' | 'expectedRevision' | 'recordedAt'>;
const equal = (left: unknown, right: unknown) => hopDecisionReference(left) === hopDecisionReference(right);
const requireReason = (reason: string) => { if (typeof reason !== 'string' || !reason.trim()) throw Error('Conserver le motif explicite de ce geste.'); };

function assertCurrentStudy(study: HopAdviceStudyV3, currentStudy: HopAdviceStudyV3, qualificationInput: HopQualifiedAssemblyInput) {
  if (study.reference !== hopAdviceStudyReference(study) || currentStudy.reference !== hopAdviceStudyReference(currentStudy)
    || study.reference !== currentStudy.reference || !equal(qualificationInput, currentStudy.requestSnapshot.qualificationInput)) {
    throw Error('La lecture, la situation ou ses données ont changé ; conserver l’ancien conseil et produire une nouvelle étude explicite.');
  }
  // This explicit command checks a new decision; historical reads never execute this adapter.
  const fresh = answerQualifiedHopAdvice({ ...currentStudy.requestSnapshot, context: currentStudy.context });
  if (fresh.reference !== currentStudy.reference) throw Error('Le conseil ne correspond plus à la version courante du service ; créer une nouvelle étude.');
}

function optionForPreference(study: HopAdviceStudyV3, preference: Preference) {
  const option = study.responseSnapshot.result.options.find(row => row.id === preference.optionId);
  const resultReference = hopAdviceResultReference(study.responseSnapshot.result);
  const interpretation = study.requestSnapshot.intent.interpretation ?? '';
  const { preferenceReference, ...content } = preference;
  if (!option || preference.studyReference !== study.reference || preference.resultReference !== resultReference
    || preference.optionReference !== option.reference || !equal(preference.programScope, option.programScope)
    || preference.interpretation !== interpretation
    || preference.interpretationReference !== hopAdviceInterpretationReference({ studyReference: study.reference,
      resultReference, optionId: option.id, optionReference: option.reference, interpretation })
    || preferenceReference !== hopAdvicePreferenceReference(content)) {
    throw Error('La préférence ne vise pas exactement une option et la lecture de cette étude.');
  }
  requireReason(preference.reason);
  return option;
}

/** A preference has no quantity and performs no program or inventory operation. */
export function captureHopAdvicePreference(input: {
  identity: EventIdentity; study: HopAdviceStudyV3; currentStudy: HopAdviceStudyV3;
  qualificationInput: HopQualifiedAssemblyInput; preferenceId: string; optionId: string; reason: string;
}) {
  assertCurrentStudy(input.study, input.currentStudy, input.qualificationInput); requireReason(input.reason);
  const option = input.study.responseSnapshot.result.options.find(row => row.id === input.optionId);
  if (!option) throw Error('La piste préférée ne figure pas dans ce conseil.');
  const resultReference = hopAdviceResultReference(input.study.responseSnapshot.result);
  const interpretation = input.study.requestSnapshot.intent.interpretation ?? '';
  const content = { preferenceId: input.preferenceId, studyReference: input.study.reference, resultReference,
    optionId: option.id, optionReference: option.reference, programScope: structuredClone(option.programScope), interpretation,
    interpretationReference: hopAdviceInterpretationReference({ studyReference: input.study.reference, resultReference,
      optionId: option.id, optionReference: option.reference, interpretation }), reason: input.reason };
  return createHopAdviceEvent({ ...input.identity, kind: 'strategyPreferred',
    payload: { ...content, preferenceReference: hopAdvicePreferenceReference(content) } });
}

export interface PreviewPreferredHopAdviceInput {
  study: HopAdviceStudyV3;
  currentStudy: HopAdviceStudyV3;
  preference: Preference;
  qualificationInput: HopQualifiedAssemblyInput;
  origin: 'existingProgram' | 'newScenario';
  program: HopDecisionProgram;
  changes: HopProgramChange[];
  reason: string;
}

function assertChangesWithinPreference(input: PreviewPreferredHopAdviceInput) {
  const option = optionForPreference(input.study, input.preference);
  const scope = option.programScope;
  if (scope.kind === 'none') throw Error('Cette piste est une observation ou une investigation ; elle ne permet pas de fabriquer un changement de programme.');
  if (scope.kind === 'addOrReplace' && option.criterionEffects.some(effect => effect.status === 'constraintViolated')) {
    throw Error('Une contrainte connue est violée par cette piste ; elle ne peut pas être concrétisée comme conforme.');
  }
  const excluded = new Set(input.study.requestSnapshot.action.situation.exclusions.filter(row => row.certainty === 'certain').map(row => row.materialId));
  for (const change of input.changes) {
    if (scope.kind === 'removePlanned') {
      if (change.kind !== 'remove' || !scope.additionIds.includes(change.additionId)) throw Error('Le retrait ne correspond pas à la piste préférée.');
      continue;
    }
    if (change.kind === 'remove') throw Error('La piste préférée ne représente pas un retrait.');
    if (change.kind === 'append' && !scope.allowAppend) throw Error('Cette piste ne permet pas un ajout supplémentaire.');
    if (change.kind === 'replace' && !scope.additionIds.includes(change.additionId)) throw Error('Le remplacement cible une autre ligne que la piste préférée.');
    const additions = change.kind === 'append' ? [change.addition] : change.additions;
    if (additions.some(row => excluded.has(row.materialId))) throw Error('Une matière explicitement exclue ne peut être ajoutée sous cette préférence.');
    if (additions.some(row => !scope.materialIds.includes(row.materialId) || !scope.uses.includes(row.use))) {
      throw Error('La matière ou l’emploi concrétisés ne correspondent pas à cette préférence.');
    }
  }
}

function qualifiedProgramMaterials(input: PreviewPreferredHopAdviceInput, after: HopDecisionProgram) {
  const intent = input.currentStudy.requestSnapshot.intent;
  const comparison = answerQualifiedHopDecision({ intent, qualificationInput: input.qualificationInput,
    action: { kind: 'comparePrograms', before: input.program, after } });
  const assessed = answerQualifiedHopDecision({ intent, qualificationInput: input.qualificationInput,
    action: { kind: 'assessProgram', program: after } });
  if (comparison.kind !== 'calculated' || assessed.kind !== 'calculated') {
    const issues = [comparison, assessed].flatMap(study => study.blockingIssues.map(row => row.reason));
    throw Error(`Le conseil reste conservable, mais cette concrétisation demande de résoudre ses matières : ${[...new Set(issues)].join(' ')}`);
  }
  const byId = new Map<string, HopDecisionMaterial>();
  for (const material of [...comparison.calculationInput.materials, ...assessed.calculationInput.materials]) {
    const existing = byId.get(material.id);
    if (existing && !equal(existing, material)) throw Error('Les projections nécessaires à la concrétisation ne sont pas cohérentes.');
    byId.set(material.id, material);
  }
  return { materials: [...byId.values()], qualificationSnapshot: assessed.qualificationSnapshot };
}

/** Values are supplied explicitly in program/changes. No advice option imputes a dose. */
export function previewPreferredHopAdvice(input: PreviewPreferredHopAdviceInput): HopAdviceProgramPreviewReceipt {
  assertCurrentStudy(input.study, input.currentStudy, input.qualificationInput); requireReason(input.reason);
  assertChangesWithinPreference(input);
  const situation = input.study.requestSnapshot.action.situation;
  if (input.origin === 'existingProgram') {
    if (situation.program === null || !equal(situation.program, input.program)) throw Error('Le programme existant diffère du conseil ; actualiser explicitement l’étude.');
  } else if (input.origin === 'newScenario') {
    if (situation.program !== null || situation.stage !== 'planning' || input.program.stage !== 'planning'
      || input.program.additions.some(row => row.status !== 'planned')) {
      throw Error('Un scénario nouveau doit être fourni explicitement depuis une planification sans programme ; aucun passé effectué n’est inventé.');
    }
  } else throw Error('Préciser si la base est le programme existant ou un scénario nouveau explicitement fourni.');
  const after = deriveHopProgramDraft(input.program, input.changes);
  const { materials, qualificationSnapshot } = qualifiedProgramMaterials(input, after);
  const proposal = previewHopProgramChanges(input.program, input.changes, materials);
  const payload = { format: 'hop-advice-program-preview-v1' as const,
    studyReference: input.study.reference, preferenceId: input.preference.preferenceId, preferenceReference: input.preference.preferenceReference,
    optionId: input.preference.optionId, optionReference: input.preference.optionReference,
    origin: input.origin, before: structuredClone(input.program), proposal, materials: structuredClone(materials),
    qualificationInput: structuredClone(input.qualificationInput), qualificationSnapshot,
    analysis: { before: analyzeHopProgram(input.program, materials), after: analyzeHopProgram(proposal.program, materials) },
    declaration: { origin: 'explicitUserInput' as const, reason: input.reason } };
  return { ...payload, reference: hopAdviceProgramPreviewReference(payload) };
}

export function captureHopAdvicePreviewEvent(input: {
  identity: EventIdentity; previewId: string; receipt: HopAdviceProgramPreviewReceipt;
}) {
  if (input.receipt.reference !== hopAdviceProgramPreviewReference(input.receipt)) throw Error('Reçu d’aperçu altéré.');
  return createHopAdviceEvent({ ...input.identity, kind: 'programPreviewed', payload: {
    preferenceId: input.receipt.preferenceId, previewId: input.previewId, receipt: input.receipt } });
}

/** Apply only a fresh, unchanged receipt to a local program; it reserves no stock. */
export function applyPreferredHopAdvice(input: {
  study: HopAdviceStudyV3; currentStudy: HopAdviceStudyV3; preference: Preference;
  qualificationInput: HopQualifiedAssemblyInput; currentProgram: HopDecisionProgram; preview: HopAdviceProgramPreviewReceipt;
}): HopAdviceProgramApplicationReceipt {
  const preview = input.preview;
  if (preview.reference !== hopAdviceProgramPreviewReference(preview) || !equal(input.currentProgram, preview.before)) throw Error('L’aperçu ou le programme courant a changé.');
  const fresh = previewPreferredHopAdvice({ study: input.study, currentStudy: input.currentStudy, preference: input.preference,
    qualificationInput: input.qualificationInput, origin: preview.origin, program: input.currentProgram,
    changes: preview.proposal.changes, reason: preview.declaration.reason });
  if (fresh.reference !== preview.reference) throw Error('Les données de l’aperçu ne sont plus courantes ; préparer un nouveau reçu.');
  const application = applyHopProgramProposal(input.currentProgram, preview.proposal, fresh.materials);
  const payload = { format: 'hop-advice-local-application-v1' as const, studyReference: input.study.reference,
    preferenceId: input.preference.preferenceId, preferenceReference: input.preference.preferenceReference,
    previewReference: preview.reference, application };
  return { ...payload, reference: hopAdviceProgramApplicationReference(payload) };
}

/** An explicit local undo may restore an incomplete draft; it never replays a brewing operation. */
export function restorePreferredHopAdviceDraft(input: {
  study: HopAdviceStudyV3; preference: Preference; currentProgram: HopDecisionProgram;
  application: HopAdviceProgramApplicationReceipt; qualificationInput: HopQualifiedAssemblyInput;
}): HopAdviceDraftRestorationReceipt {
  optionForPreference(input.study, input.preference);
  const receipt = input.application;
  if (receipt.reference !== hopAdviceProgramApplicationReference(receipt) || receipt.studyReference !== input.study.reference
    || receipt.preferenceReference !== input.preference.preferenceReference) throw Error('Reçu d’application étranger ou altéré.');
  const before = receipt.application.before;
  const context = { study: input.study, currentStudy: input.study, preference: input.preference, qualificationInput: input.qualificationInput,
    origin: 'existingProgram' as const, program: input.currentProgram, changes: receipt.application.proposal.changes, reason: 'Retour local explicite.' };
  // The restored draft's future needs, not only the currently applied draft,
  // decide which stock aliases must remain in the feasibility assessment.
  const { materials } = qualifiedProgramMaterials(context, before);
  const draft = restoreHopProgramDraft(input.currentProgram, receipt.application, materials);
  const payload = { format: 'hop-advice-draft-restoration-v1' as const, studyReference: input.study.reference,
    preferenceId: input.preference.preferenceId, preferenceReference: input.preference.preferenceReference,
    applicationReference: receipt.reference, currentProgram: structuredClone(input.currentProgram), draft };
  return { ...payload, reference: hopAdviceDraftRestorationReference(payload) };
}
