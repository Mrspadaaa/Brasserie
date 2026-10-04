import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { HopSource } from '../../../functions/src/hopIndexSchema';
import type { HopAdviceAssertion } from '../../domain/hopDecision/adviceSchema';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopPropertyAdviceIntentV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopV55AdoptedContextBindingV1 } from '../../services/hopV55/adoptedContextResolution';
import {
  HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
  readHopV55PropertyAdviceReexaminationPreviewV1,
  type HopV55PropertyAdviceLedgerActionV4,
  type HopV55PropertyAdviceReexaminationBindingChoiceV1,
  type HopV55PropertyAdviceReexaminationLinkDiagnosticV1,
  type HopV55PropertyAdviceReexaminationPreviewV1,
} from '../../services/hopV55/propertyAdvicePreparationV4';
import {
  readHopV55PropertyAdviceAnnotationLedgerV1,
  readHopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnswerRecordV4,
  type HopV55PropertyAdviceAnnotationLedgerV1,
  type HopV55PropertyAdviceLedgerEntryV1,
  type HopV55PropertyAdviceV4ReadingContext,
} from '../../services/hopV55/propertyAdviceRecordsV4';
import type {
  HopV55PropertyAdviceReexaminationPanelV4Props,
  HopV55PropertyAdviceReexaminationPrepareV4Request,
  HopV55PropertyAdviceReexaminationConfirmV4Request,
} from './propertyAdviceV4UiContracts';
import { Input, Textarea } from '../Input';
import './property-advice-reexamination-panel-v4.css';

type AnswerRecord = HopV55PropertyAdviceAnswerRecordV4;
type ReexaminationPreview = HopV55PropertyAdviceReexaminationPreviewV1;
type PrepareRequest = HopV55PropertyAdviceReexaminationPrepareV4Request;
type ConfirmRequest = HopV55PropertyAdviceReexaminationConfirmV4Request;
type BindingChoice = HopV55PropertyAdviceReexaminationBindingChoiceV1;
type LedgerAction = HopV55PropertyAdviceLedgerActionV4;
type Scope = 'bulkBeer' | 'sampling' | 'separatePortion';
type AccessState = 'yes' | 'no';
type AnnotationMode = 'keep' | 'reject' | 'restore';
type AccessDraft = { state: AccessState; reason: string };

const ACCESS_SCOPES: readonly Scope[] = ['bulkBeer', 'sampling', 'separatePortion'];
const accessLabels: Record<Scope, string> = {
  bulkBeer: 'Lot de bière', sampling: 'Échantillon', separatePortion: 'Portion séparée',
};
const accessStateLabels: Record<'yes' | 'no' | 'unknown', string> = { yes: 'Oui', no: 'Non', unknown: 'Inconnu' };
const assertionStateLabels: Record<HopAdviceAssertion['state'], string> = {
  reported: 'Déclaré', measured: 'Mesuré', planned: 'Prévu', performed: 'Réalisé', unknown: 'Inconnu',
};
const stageLabels: Record<string, string> = {
  planning: 'Préparation de la recette', hotSide: 'Côté chaud', fermenting: 'Fermentation',
  conditioning: 'Garde', packaged: 'Conditionnement terminé',
};
const roleLabels: Record<HopPropertyAdviceIntentV3['role'], string> = {
  target: 'Cible', reportedObservation: 'Constat', measurement: 'Mesure', investigation: 'Question',
  preference: 'Préférence', constraint: 'Garde',
};
const directionLabels: Record<Exclude<HopPropertyAdviceIntentV3['direction'], null>, string> = {
  increase: 'À augmenter', decrease: 'À réduire', keep: 'À préserver', exclude: 'À exclure', investigate: 'À explorer',
};
const propertyLabels: Record<HopPropertyAdviceIntentV3['property'], string> = {
  aroma: 'Arôme', bitterness: 'Amertume', sweetness: 'Douceur', acidity: 'Acidité',
  bioContribution: 'Apport de culture', materialCharacter: 'Caractère de la matière', unresolved: 'À qualifier',
};
const sourceKindLabels: Record<string, string> = {
  recipe: 'Recette', batch: 'Brassin', exploration: 'Exploration', localRecipeCopy: 'Copie locale', localFutureDraft: 'Brouillon futur',
};

const same = (left: unknown, right: unknown): boolean => hopAdviceContentReference('hop-v55-reexamination-ui-equality-v1', left)
  === hopAdviceContentReference('hop-v55-reexamination-ui-equality-v1', right);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const formatNumber = (value: number) => new Intl.NumberFormat('fr-CH', { maximumSignificantDigits: 21 }).format(value);
const assertionValue = (assertion: HopAdviceAssertion): string => assertion.value === null ? 'valeur non fournie'
  : typeof assertion.value === 'boolean' ? (assertion.value ? 'oui' : 'non')
    : `${typeof assertion.value === 'number' ? formatNumber(assertion.value) : assertion.value}${assertion.unit ? ` ${assertion.unit}` : ''}`;
const formatDate = (value: string) => Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('fr-CH', { dateStyle: 'medium', timeStyle: 'short' }) : 'date non précisée';
const scopeKey = (annotationId: string, assertionId: string) => `${annotationId}\u0000${assertionId}`;

function intentRoleLine(intent: HopPropertyAdviceIntentV3): string {
  return `${roleLabels[intent.role]} · ${propertyLabels[intent.property]}${intent.direction ? ` · ${directionLabels[intent.direction]}` : ''}`;
}

function sourceLabel(source: ReexaminationPreview['source']): string {
  const kind = sourceKindLabels[source.kind] ?? 'Source';
  if (source.kind === 'recipe' || source.kind === 'batch') return `${kind} liée à cette lecture`;
  if (source.kind === 'localRecipeCopy') return `${kind} liée à cette lecture`;
  if (source.kind === 'localFutureDraft') return `${kind} lié à cette lecture`;
  return kind;
}

function exactSourceReference(source: ReexaminationPreview['source']): Array<{ label: string; value: string }> {
  switch (source.kind) {
    case 'recipe': return [{ label: 'Recette', value: source.id }];
    case 'batch': return [{ label: 'Brassin', value: source.id }];
    case 'exploration': return [];
    case 'localRecipeCopy': return [
      { label: 'Espace de travail', value: source.workspaceId }, { label: 'Copie', value: source.copyId },
      { label: 'Recette', value: source.recipeId }, { label: 'Référence de recette', value: source.recipeReference },
    ];
    case 'localFutureDraft': return [
      { label: 'Espace de travail', value: source.workspaceId }, { label: 'Brouillon', value: source.draftId },
      { label: 'Révision', value: String(source.revision) }, { label: 'Référence de contenu', value: source.contentReference },
    ];
  }
}

function recordIdentityKey(record: AnswerRecord): string {
  return JSON.stringify({ ownerKey: record.ownerKey, workspaceId: record.workspaceId, recordId: record.id,
    recordReference: record.reference, sourceReadingReference: record.sourceReadingReference, ledgerReference: record.ledger.reference });
}

function ledgerRead(record: AnswerRecord) {
  return readHopV55PropertyAdviceAnnotationLedgerV1(record.ledger, record.originalQuestion);
}

function latestEntry(ledger: HopV55PropertyAdviceAnnotationLedgerV1, annotationId: string): HopV55PropertyAdviceLedgerEntryV1 | undefined {
  return [...ledger.entries].reverse().find(entry => entry.annotationId === annotationId);
}

function lastActiveIntent(ledger: HopV55PropertyAdviceAnnotationLedgerV1, annotationId: string): HopPropertyAdviceIntentV3 | undefined {
  return [...ledger.entries].reverse().find(entry => entry.annotationId === annotationId
    && entry.disposition === 'active' && entry.activeIntent)?.activeIntent;
}

function canDetach(intent: HopPropertyAdviceIntentV3): boolean {
  return intent.role !== 'measurement' && !['keep', 'decrease'].includes(String(intent.direction));
}

function bindingSemantics(intent: HopPropertyAdviceIntentV3): unknown {
  const { comparisonBasis: _comparisonBasis, basis: _basis, interpretationOrigin: _origin, ...semantic } = intent;
  return semantic;
}

function parentActiveIntents(ledger: HopV55PropertyAdviceAnnotationLedgerV1): HopPropertyAdviceIntentV3[] {
  const latest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of ledger.entries) latest.set(entry.annotationId, entry);
  return ledger.sourceAnnotations.flatMap(source => {
    const entry = latest.get(source.id);
    return entry?.disposition === 'active' && entry.activeIntent ? [entry.activeIntent] : [];
  });
}

function expectedActiveIntents(parent: HopV55PropertyAdviceAnnotationLedgerV1, actions: readonly LedgerAction[]): HopPropertyAdviceIntentV3[] {
  const actionsById = new Map<string, LedgerAction>();
  for (const action of actions) actionsById.set(action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId, action);
  const latest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of parent.entries) latest.set(entry.annotationId, entry);
  const active = parent.sourceAnnotations.flatMap(source => {
    const action = actionsById.get(source.id);
    if (action?.kind === 'reject') return [];
    if (action && action.kind !== 'add') return [action.activeIntent];
    if (action?.kind === 'add') return [action.activeIntent];
    const entry = latest.get(source.id);
    return entry?.disposition === 'active' && entry.activeIntent ? [entry.activeIntent] : [];
  });
  for (const action of actions) if (action.kind === 'add') active.push(action.activeIntent);
  return active;
}

function verifyBindingChoices(parentLedger: HopV55PropertyAdviceAnnotationLedgerV1, preview: ReexaminationPreview,
  request: ConfirmRequest): string | null {
  const choiceByLink = new Map<string, BindingChoice>();
  for (const choice of request.bindingChoices) {
    if (choice.previewReference !== preview.reference || !isText(choice.annotationId) || !isText(choice.previousAssertionId)) {
      return 'Un choix de liaison cite un autre aperçu ou une autre annotation.';
    }
    const key = scopeKey(choice.annotationId, choice.previousAssertionId);
    if (choiceByLink.has(key)) return 'Un lien périmé reçoit plusieurs choix.';
    choiceByLink.set(key, choice);
  }
  const actionsById = new Map<string, LedgerAction>();
  for (const action of request.actions) {
    const id = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
    if (actionsById.has(id)) return `L’annotation « ${id} » reçoit plusieurs actions.`;
    actionsById.set(id, action);
  }
  const diagnosticsById = new Map<string, HopV55PropertyAdviceReexaminationLinkDiagnosticV1[]>();
  for (const diagnostic of preview.diagnostics) {
    const rows = diagnosticsById.get(diagnostic.annotationId) ?? [];
    rows.push(diagnostic);
    diagnosticsById.set(diagnostic.annotationId, rows);
  }
  const consumed = new Set<string>();
  for (const [annotationId, diagnostics] of diagnosticsById) {
    const action = actionsById.get(annotationId);
    const latest = latestEntry(parentLedger, annotationId);
    if (!latest) return `L’annotation « ${annotationId} » est absente du ledger parent.`;
    if (action?.kind === 'reject' || latest.disposition === 'rejected' && action?.kind !== 'restore') continue;
    if (latest.disposition === 'active' && !action) return `L’annotation « ${annotationId} » doit être résolue ou écartée.`;
    if (action?.kind !== 'revise' && action?.kind !== 'restore') {
      return `L’annotation « ${annotationId} » doit recevoir une révision/restauration ou être écartée.`;
    }
    const priorIntent = lastActiveIntent(parentLedger, annotationId);
    if (!priorIntent || action.activeIntent.interpretationOrigin !== 'user'
      || !same(bindingSemantics(priorIntent), bindingSemantics(action.activeIntent))) {
      return `La réconciliation de « ${annotationId} » ne conserve pas son sens et sa trace d’origine.`;
    }
    const expectedIds = [...priorIntent.comparisonBasis.assertionIds];
    for (const diagnostic of diagnostics) {
      const key = scopeKey(annotationId, diagnostic.previousAssertionId);
      const choice = choiceByLink.get(key);
      if (!choice) return `Choisis un fait frais compatible ou un détachement permis pour « ${diagnostic.previousAssertion.statement} ».`;
      consumed.add(key);
      const index = expectedIds.indexOf(diagnostic.previousAssertionId);
      if (index < 0) return `Le lien « ${diagnostic.previousAssertionId} » ne fait plus partie de l’intention.`;
      expectedIds.splice(index, 1);
      if (choice.kind === 'bind') {
        const candidate = diagnostic.compatibleFreshAssertions.find(row => row.assertionId === choice.freshAssertionId);
        if (!candidate) return `Le fait choisi pour « ${diagnostic.previousAssertion.statement} » n’est pas compatible avec l’aperçu.`;
        expectedIds.splice(index, 0, candidate.assertionId);
      } else if (choice.kind === 'detach') {
        if (!canDetach(priorIntent)) return `Le lien de « ${priorIntent.label} » ne peut pas être détaché pour son rôle ou sa direction.`;
      }
    }
    if (new Set(expectedIds).size !== expectedIds.length) return `La requalification de « ${annotationId} » duplique un fait frais.`;
    const expectedBasis = { kind: expectedIds.length ? 'current' as const : 'none' as const, assertionIds: expectedIds };
    if (!same(action.activeIntent.comparisonBasis, expectedBasis)) return `Les liens actifs de « ${annotationId} » diffèrent des choix affichés.`;
  }
  if (consumed.size !== choiceByLink.size) return 'Un choix de liaison ne correspond pas à un lien périmé actif de l’aperçu.';
  for (const action of request.actions) {
    if (action.kind === 'revise' && !diagnosticsById.has(action.annotationId)) {
      return `La révision de « ${action.annotationId} » n’est liée à aucun diagnostic de cet aperçu.`;
    }
  }
  return null;
}

function verifyRecordLedger(parent: AnswerRecord, record: AnswerRecord, request: ConfirmRequest, preview: ReexaminationPreview): string | null {
  const beforeRead = ledgerRead(parent), afterRead = ledgerRead(record);
  if (beforeRead.status !== 'readOnly' || afterRead.status !== 'readOnly') return 'Le registre d’annotations de la version d’origine ou de la nouvelle version est illisible.';
  const before = beforeRead.ledger, after = afterRead.ledger;
  if (after.entries.length !== before.entries.length + request.actions.length
    || before.entries.some((entry, index) => !same(entry, after.entries[index]))) {
    return 'Le nouveau registre ne conserve pas exactement le préfixe de la version d’origine.';
  }
  const additions = request.actions.filter(action => action.kind === 'add');
  if (after.sourceAnnotations.length !== before.sourceAnnotations.length + additions.length
    || before.sourceAnnotations.some((row, index) => !same(row, after.sourceAnnotations[index]))) {
    return 'Les annotations source ou leurs fragments ne sont pas conservés exactement.';
  }
  const previousEntries = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  const previousLatest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  for (const entry of before.entries) { previousEntries.set(entry.annotationId, entry); previousLatest.set(entry.annotationId, entry); }
  const appended = after.entries.slice(before.entries.length);
  for (const action of request.actions) {
    const annotationId = action.kind === 'add' ? action.sourceAnnotation.id : action.annotationId;
    const previousState = previousLatest.get(annotationId);
    if (action.kind === 'reject' && previousState?.disposition !== 'active') return `L’annotation « ${annotationId} » ne peut pas être écartée depuis cet état.`;
    if (action.kind === 'revise' && previousState?.disposition !== 'active') return `L’annotation « ${annotationId} » ne peut pas être révisée depuis cet état.`;
    if (action.kind === 'restore' && previousState?.disposition !== 'rejected') return `L’annotation « ${annotationId} » ne peut pas être restaurée depuis cet état.`;
    const entry = appended.find(row => row.annotationId === annotationId);
    if (!entry || entry.decision.actId !== request.commandId || entry.decision.kind !== action.kind || entry.decision.reason !== action.reason) {
      return `L’action enregistrée sur « ${annotationId} » diffère de la confirmation.`;
    }
    if (entry.decision.recordedAt !== record.transition.recordedAt
      || !same(entry.decision.recordedBy, record.transition.actor)) {
      return `La date ou l’acteur de l’action sur « ${annotationId} » ne correspond pas à la transition scellée.`;
    }
    if (action.kind === 'reject') {
      if (entry.disposition !== 'rejected' || entry.activeIntent !== undefined) return `Le rejet de « ${annotationId} » n’est pas exact.`;
    } else if (entry.disposition !== 'active' || !same(entry.activeIntent, action.activeIntent)) {
      return `L’intention active de « ${annotationId} » diffère de celle confirmée.`;
    }
    if (action.kind === 'add') {
      const source = after.sourceAnnotations.find(row => row.id === annotationId);
      if (entry.sourceKind !== 'added' || entry.additionActId !== request.commandId
        || entry.decision.predecessorEntryReference !== undefined || !same(entry.sourceAnnotation, action.sourceAnnotation)
        || !same(source, action.sourceAnnotation)) return `L’ajout de « ${annotationId} » ne conserve pas sa source exacte.`;
    } else {
      const previous = previousEntries.get(annotationId);
      if (!previous || entry.decision.predecessorEntryReference !== previous.reference
        || entry.sourceKind !== previous.sourceKind || !same(entry.sourceAnnotation, previous.sourceAnnotation)) {
        return `L’action sur « ${annotationId} » ne prolonge pas sa trace exacte.`;
      }
      if (action.kind === 'restore' && !preview.diagnostics.some(row => row.annotationId === annotationId)) {
        const restored = lastActiveIntent(before, annotationId);
        if (!same(action.activeIntent, restored)) return `La restauration de « ${annotationId} » ne reprend pas exactement sa dernière projection active.`;
      }
    }
  }
  return null;
}

function verifyAccessFrame(preview: ReexaminationPreview, frame: HopV55PropertyAdviceV4ReadingContext): string | null {
  const base = preview.readingContext.context, current = frame.context;
  if (current.stage !== base.stage || current.stageBasis !== base.stageBasis) return 'Le stade actuel de l’aperçu a été modifié.';
  const baseById = new Map(base.assertions.map(assertion => [assertion.id, assertion]));
  const currentById = new Map(current.assertions.map(assertion => [assertion.id, assertion]));
  if (currentById.size !== current.assertions.length) return 'Le cadre confirmé répète une identité de fait.';
  for (const assertion of base.assertions) if (!same(assertion, currentById.get(assertion.id))) return 'Un fait de l’aperçu a été modifié ou retiré.';
  const extra = current.assertions.filter(assertion => !baseById.has(assertion.id));
  const claimed = new Set<string>();
  for (const scope of ACCESS_SCOPES) {
    const before = base.access[scope], after = current.access[scope];
    const updates = extra.filter(assertion => assertion.subject === scope);
    if (same(before, after) && !updates.length) continue;
    if (after.state === 'unknown' || !isText(after.basis) || updates.length === 0
      || after.assertionIds.length !== updates.length || after.assertionIds.some(id => !updates.some(row => row.id === id))) {
      return `L’accès « ${accessLabels[scope]} » doit garder l’aperçu ou recevoir une attestation nouvelle et sourcée.`;
    }
    const value = after.state === 'yes';
    for (const assertion of updates) {
      if (assertion.state !== 'reported' || assertion.dimension !== 'process' || assertion.value !== value || !assertion.source) {
        return `L’attestation « ${accessLabels[scope]} » ne correspond pas à l’accès déclaré.`;
      }
      claimed.add(assertion.id);
    }
  }
  if (claimed.size !== extra.length) return 'Une assertion ajoutée n’est pas une attestation d’accès fraîche.';
  return null;
}

/** Structural publication guard used by Page before announcing a confirmed reexamination. */
export function verifyReexaminationConfirmationResultV4(input: {
  parentRecord: AnswerRecord;
  preview: ReexaminationPreview;
  request: ConfirmRequest;
  result: unknown;
}): string | null {
  const { parentRecord, request } = input;
  const previewRead = readHopV55PropertyAdviceReexaminationPreviewV1(input.preview);
  if (previewRead.status !== 'readOnly') return `L’aperçu n’est pas relisible : ${previewRead.reason}`;
  const preview = previewRead.preview;
  let parentRead: ReturnType<typeof readHopV55PropertyAdviceAnswerRecordV4>;
  let resultRead: ReturnType<typeof readHopV55PropertyAdviceAnswerRecordV4>;
  try {
    parentRead = readHopV55PropertyAdviceAnswerRecordV4(parentRecord);
    resultRead = readHopV55PropertyAdviceAnswerRecordV4(input.result);
  } catch (error) { return error instanceof Error ? `La version reçue ne peut pas être vérifiée : ${error.message}` : 'La version reçue est illisible.'; }
  if (parentRead.status !== 'readOnly' || resultRead.status !== 'readOnly') return 'La version d’origine ou la nouvelle version n’est pas strictement relisible.';
  const parent = parentRead.record, result = resultRead.record;
  if (preview.parentRecordReference !== parent.reference || preview.parentLedgerReference !== parent.ledger.reference
    || preview.parentReadingReference !== parent.sourceReadingReference || preview.parentReadingArchiveReference !== parent.sourceReadingReference
    || preview.ownerKey !== parent.ownerKey || preview.workspaceId !== parent.workspaceId
    || preview.originalQuestion !== parent.originalQuestion
    || !same(preview.source, parent.preparation.source)) return 'L’aperçu ne cite pas exactement la version d’origine, sa lecture et sa source.';
  if (request.previewId !== preview.previewId || request.expectedPreviewReference !== preview.reference
    || request.expectedRecordReference !== parent.reference || request.expectedLedgerReference !== parent.ledger.reference
    || !isText(request.commandId) || !isText(request.reason)) return 'La confirmation ne cite pas l’aperçu ou la version d’origine exacte.';
  if (result.id === parent.id || result.reference === parent.reference || result.ownerKey !== parent.ownerKey || result.workspaceId !== parent.workspaceId
    || result.originalQuestion !== parent.originalQuestion || result.sourceReadingReference !== preview.sourceReadingReference
    || !same(result.preparation.source, preview.source)
    || (result.preparation.cultureBinding?.bindingReference ?? null) !== preview.cultureBindingReference) {
    return 'La nouvelle version ne prolonge pas la source actuelle et immuable de l’aperçu.';
  }
  const transition = result.transition;
  if (transition.kind !== 'reexamine' || transition.actId !== request.commandId || transition.reason !== request.reason
    || transition.actor.origin !== 'user' || transition.parentRecordReference !== parent.reference
    || transition.parentReadingReference !== parent.sourceReadingReference || !Number.isFinite(Date.parse(transition.recordedAt))) {
    return 'La filiation, l’acte, le motif ou la date de confirmation diffère de la demande.';
  }
  if (!same(result.readingContext, request.readingContext)
    || !same(result.readingContext.interpretation, preview.readingContext.interpretation)
    || !same(result.readingContext.candidatePolicy, preview.readingContext.candidatePolicy)
    || !same(result.readingContext.exclusions, preview.readingContext.exclusions)) {
    return 'Le cadre confirmé diffère du brouillon actuel ou de l’aperçu immuable.';
  }
  const frameIssue = verifyAccessFrame(preview, request.readingContext);
  if (frameIssue) return frameIssue;
  const parentLedgerRead = ledgerRead(parent);
  if (parentLedgerRead.status !== 'readOnly') return 'Le registre parent ne se relit plus.';
  const choiceIssue = verifyBindingChoices(parentLedgerRead.ledger, preview, request);
  if (choiceIssue) return choiceIssue;
  const ledgerIssue = verifyRecordLedger(parent, result, request, preview);
  if (ledgerIssue) return ledgerIssue;
  const expectedActive = expectedActiveIntents(parentLedgerRead.ledger, request.actions);
  if (expectedActive.length === 0) {
    if (result.outcome.kind !== 'allRejected') return 'Le rejet total doit rester sans réponse de domaine.';
    return null;
  }
  if (result.outcome.kind !== 'domainAnswer') return 'Les annotations actives exigent une réponse de domaine.';
  const answer = result.outcome.answerSnapshot;
  if (answer.reference !== result.outcome.answerReference || answer.requestSnapshot.originalQuestion !== result.originalQuestion
    || !same(answer.requestSnapshot.propertyIntents, expectedActive)
    || !same(answer.requestSnapshot.context, result.readingContext.context)
    || !same(answer.requestSnapshot.interpretation, result.readingContext.interpretation)
    || !same(answer.requestSnapshot.candidatePolicy, result.readingContext.candidatePolicy)
    || !same(answer.requestSnapshot.exclusions, result.readingContext.exclusions)) {
    return 'La réponse de domaine ne porte pas exactement le ledger actif et le cadre frais confirmés.';
  }
  return null;
}

interface AnnotationRowV4 {
  source: HopPropertyAdviceIntentV3;
  status: 'active' | 'rejected';
  activeIntent?: HopPropertyAdviceIntentV3;
  previousActiveIntent?: HopPropertyAdviceIntentV3;
  diagnostics: HopV55PropertyAdviceReexaminationLinkDiagnosticV1[];
}

function annotationRowsV4(ledger: HopV55PropertyAdviceAnnotationLedgerV1,
  diagnostics: readonly HopV55PropertyAdviceReexaminationLinkDiagnosticV1[]): AnnotationRowV4[] {
  const latest = new Map<string, HopV55PropertyAdviceLedgerEntryV1>();
  const active = new Map<string, HopPropertyAdviceIntentV3>();
  for (const entry of ledger.entries) {
    latest.set(entry.annotationId, entry);
    if (entry.disposition === 'active' && entry.activeIntent) active.set(entry.annotationId, entry.activeIntent);
  }
  const diagnosticsById = new Map<string, HopV55PropertyAdviceReexaminationLinkDiagnosticV1[]>();
  for (const diagnostic of diagnostics) {
    const rows = diagnosticsById.get(diagnostic.annotationId) ?? [];
    rows.push(diagnostic);
    diagnosticsById.set(diagnostic.annotationId, rows);
  }
  return ledger.sourceAnnotations.map(source => ({ source,
    status: latest.get(source.id)?.disposition ?? 'rejected',
    ...(latest.get(source.id)?.disposition === 'active' && latest.get(source.id)?.activeIntent
      ? { activeIntent: latest.get(source.id)!.activeIntent } : {}),
    ...(active.get(source.id) ? { previousActiveIntent: active.get(source.id) } : {}),
    diagnostics: diagnosticsById.get(source.id) ?? [],
  }));
}

interface AccessDraftMap { [scope: string]: AccessDraft | undefined; }

interface ConfirmationDraftV4 {
  readingContext: HopV55PropertyAdviceV4ReadingContext;
  actions: LedgerAction[];
  bindingChoices: BindingChoice[];
  issues: string[];
  changes: Array<{ label: string; before: string; after: string; reason: string;
    references?: Array<{ beforeId: string; afterId: string | null }> }>;
}

function buildAccessFrameV4(preview: ReexaminationPreview, drafts: AccessDraftMap): {
  readingContext: HopV55PropertyAdviceV4ReadingContext; issues: string[]; changes: ConfirmationDraftV4['changes'];
} {
  const readingContext = structuredClone(preview.readingContext);
  const issues: string[] = [];
  const changes: ConfirmationDraftV4['changes'] = [];
  for (const scope of ACCESS_SCOPES) {
    const draft = drafts[scope];
    if (!draft) continue;
    const reason = draft.reason.trim();
    if (!reason) {
      issues.push(`Donne le motif de la déclaration « ${accessLabels[scope]} ».`);
      continue;
    }
    const assertionId = `reexamination-access:${preview.previewId}:${scope}`;
    const value = draft.state === 'yes';
    const assertion: HopAdviceAssertion = {
      id: assertionId, subject: scope,
      statement: draft.state === 'yes'
        ? `Le brasseur déclare qu’un accès « ${accessLabels[scope].toLocaleLowerCase('fr-CH')} » est possible.`
        : `Le brasseur déclare qu’un accès « ${accessLabels[scope].toLocaleLowerCase('fr-CH')} » n’est pas possible.`,
      state: 'reported', value, dimension: 'process',
      source: { title: 'Déclaration d’accès du brasseur', author: 'Brasseur', year: null, kind: 'observation',
        reference: `local-declaration:${preview.previewId}:${scope}`, locator: `Motif déclaré : ${reason}` },
    };
    readingContext.context.assertions.push(assertion);
    readingContext.context.access[scope] = { state: draft.state, basis: reason, assertionIds: [assertion.id] };
    changes.push({ label: `Accès · ${accessLabels[scope]}`, before: accessStateLabels[preview.readingContext.context.access[scope].state],
      after: accessStateLabels[draft.state], reason });
  }
  return { readingContext, issues, changes };
}

function buildConfirmationDraftV4(input: {
  parentLedger: HopV55PropertyAdviceAnnotationLedgerV1;
  preview: ReexaminationPreview;
  modes: Record<string, AnnotationMode | undefined>;
  reasons: Record<string, string | undefined>;
  linkSelections: Record<string, string | undefined>;
  accessDrafts: AccessDraftMap;
}): ConfirmationDraftV4 {
  const { parentLedger, preview, modes, reasons, linkSelections } = input;
  const rows = annotationRowsV4(parentLedger, preview.diagnostics);
  const actions: LedgerAction[] = [];
  const bindingChoices: BindingChoice[] = [];
  const issues: string[] = [];
  const changes: ConfirmationDraftV4['changes'] = [];

  for (const row of rows) {
    const mode = modes[row.source.id] ?? 'keep';
    const reason = reasons[row.source.id]?.trim() ?? '';
    const diagnostics = row.diagnostics;
    if (mode === 'reject') {
      if (row.status !== 'active') { issues.push(`« ${row.source.label} » n’est pas actif dans la version d’origine.`); continue; }
      if (!reason) { issues.push(`Donne le motif pour écarter « ${row.source.label} ».`); continue; }
      actions.push({ kind: 'reject', annotationId: row.source.id, reason });
      changes.push({ label: row.source.label, before: 'Retenu dans la version d’origine', after: 'Écarté dans la nouvelle version', reason });
      continue;
    }

    const restoring = mode === 'restore';
    if (restoring && row.status !== 'rejected') { issues.push(`« ${row.source.label} » est déjà actif dans la version d’origine.`); continue; }
    if (restoring && !row.previousActiveIntent) { issues.push(`La projection précédente de « ${row.source.label} » est absente; aucune restauration n’est possible.`); continue; }
    if (!restoring && row.status === 'rejected') continue;

    if (!diagnostics.length) {
      if (restoring) {
        if (!reason) { issues.push(`Donne le motif pour restaurer « ${row.source.label} ».`); continue; }
        actions.push({ kind: 'restore', annotationId: row.source.id, activeIntent: structuredClone(row.previousActiveIntent!), reason });
        changes.push({ label: row.source.label, before: 'Écarté dans la version d’origine', after: 'Restauré sans changer ses liens', reason });
      }
      continue;
    }

    const priorIntent = restoring ? row.previousActiveIntent : row.activeIntent;
    if (!priorIntent) { issues.push(`L’intention active de « ${row.source.label} » est absente.`); continue; }
    if (!reason) { issues.push(`Donne le motif pour réconcilier les faits de « ${row.source.label} ».`); continue; }
    const assertionIds = [...priorIntent.comparisonBasis.assertionIds];
    let resolved = true;
    for (const diagnostic of diagnostics) {
      const key = scopeKey(row.source.id, diagnostic.previousAssertionId);
      const choice = linkSelections[key];
      if (!choice) {
        issues.push(`Choisis un fait frais compatible ou un détachement permis pour « ${diagnostic.previousAssertion.statement} ».`);
        resolved = false;
        continue;
      }
      const index = assertionIds.indexOf(diagnostic.previousAssertionId);
      if (index < 0) {
        issues.push(`Le fait « ${diagnostic.previousAssertionId} » n’est plus lié à « ${row.source.label} ».`);
        resolved = false;
        continue;
      }
      assertionIds.splice(index, 1);
      if (choice === 'detach') {
        if (!canDetach(priorIntent)) {
          issues.push(`« ${row.source.label} » exige une base courante; ce lien ne peut pas être détaché.`);
          resolved = false;
          continue;
        }
        bindingChoices.push({ format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
          kind: 'detach', previewReference: preview.reference, annotationId: row.source.id,
          previousAssertionId: diagnostic.previousAssertionId });
      } else if (choice.startsWith('bind:')) {
        const freshAssertionId = choice.slice('bind:'.length);
        const candidate = diagnostic.compatibleFreshAssertions.find(item => item.assertionId === freshAssertionId);
        if (!candidate) {
          issues.push(`Le fait choisi pour « ${row.source.label} » n’est pas compatible avec l’aperçu.`);
          resolved = false;
          continue;
        }
        assertionIds.splice(index, 0, candidate.assertionId);
        bindingChoices.push({ format: HOP_V55_PROPERTY_ADVICE_REEXAMINATION_BINDING_CHOICE_V1_FORMAT,
          kind: 'bind', previewReference: preview.reference, annotationId: row.source.id,
          previousAssertionId: diagnostic.previousAssertionId, freshAssertionId: candidate.assertionId });
      } else {
        issues.push(`Le choix de lien pour « ${row.source.label} » est illisible.`);
        resolved = false;
      }
    }
    if (!resolved) continue;
    if (new Set(assertionIds).size !== assertionIds.length) {
      issues.push(`Les liens choisis pour « ${row.source.label} » répètent un fait frais.`);
      continue;
    }
    const activeIntent: HopPropertyAdviceIntentV3 = { ...structuredClone(priorIntent),
      comparisonBasis: { kind: assertionIds.length ? 'current' : 'none', assertionIds },
      interpretationOrigin: 'user', basis: reason };
    actions.push({ kind: restoring ? 'restore' : 'revise', annotationId: row.source.id, activeIntent, reason });
    const resolvedLinks = diagnostics.map(diagnostic => {
      const choice = linkSelections[scopeKey(row.source.id, diagnostic.previousAssertionId)];
      if (choice === 'detach') return { before: assertionValue(diagnostic.previousAssertion), after: 'Base inconnue · aucun fait lié',
        beforeId: diagnostic.previousAssertionId, afterId: null };
      const freshId = choice?.startsWith('bind:') ? choice.slice('bind:'.length) : '';
      const fresh = diagnostic.compatibleFreshAssertions.find(candidate => candidate.assertionId === freshId);
      return { before: assertionValue(diagnostic.previousAssertion), after: fresh ? assertionValue(fresh.assertion) : 'Fait frais introuvable',
        beforeId: diagnostic.previousAssertionId, afterId: fresh?.assertionId ?? null };
    });
    changes.push({ label: row.source.label, before: resolvedLinks.map(link => link.before).join(' · '),
      after: resolvedLinks.map(link => link.after).join(' · '), reason,
      references: resolvedLinks.map(({ beforeId, afterId }) => ({ beforeId, afterId })) });
  }

  const access = buildAccessFrameV4(preview, input.accessDrafts);
  return { readingContext: access.readingContext, actions, bindingChoices, issues: [...issues, ...access.issues],
    changes: [...changes, ...access.changes] };
}

function bindingIntentRows(binding: HopV55AdoptedContextBindingV1): React.ReactNode {
  const culture = binding.culture.status === 'declared' ? binding.culture.value : undefined;
  return <div className="hv-reex-v4__binding-card">
    <strong>Cadre de culture adopté dans cette version</strong>
    <p>{binding.origin.description}</p>
    <dl>
      <div><dt>Proposé par</dt><dd>{binding.author.label} · {formatDate(binding.createdAt)}</dd></div>
      <div><dt>Adoptée par</dt><dd>{binding.adoption.adoptedBy.label} · {formatDate(binding.adoption.adoptedAt)}</dd></div>
      <div><dt>Culture</dt><dd>{!culture ? 'Aucune culture renseignée dans cette version NR.'
        : culture.state === 'single' ? 'Une souche déclarée' : culture.state === 'mixed' ? 'Culture mixte déclarée' : 'Culture inconnue déclarée'}</dd></div>
    </dl>
    {culture?.explanation ? <p>{culture.explanation}</p> : null}
    {culture?.members.length ? <ul>{culture.members.map((member, index) => <li key={`${member.yeastId ?? member.name ?? 'member'}-${index}`}>
      <span>{member.name ?? 'Nom non renseigné'}</span>
      {member.proportion ? <small>Répartition déclarée · {formatNumber(member.proportion.min)}–{formatNumber(member.proportion.max)}</small> : null}
      {member.source ? <details><summary>Source de cette identité</summary><span>{member.source.title}{member.source.author ? ` · ${member.source.author}` : ''}</span>
        {member.source.locator ? <span>{member.source.locator}</span> : null}<code>{member.source.reference}</code></details> : null}
      <details><summary>Identité de la souche</summary><code>{member.yeastId ?? 'Aucun ID de catalogue déclaré'}</code></details>
    </li>)}</ul> : null}
    {binding.hypotheses.length ? <details><summary>Hypothèses déclarées ({binding.hypotheses.length})</summary>
      <ul>{binding.hypotheses.map((hypothesis, index) => <li key={`${index}-${hypothesis}`}>{hypothesis}</li>)}</ul></details> : null}
    <details><summary>Origine et références exactes</summary>
      <p>{binding.versionSnapshot.origin.description}{binding.versionSnapshot.origin.sourceReference ? ` · ${binding.versionSnapshot.origin.sourceReference}` : ''}</p>
      <p>Auteur d’origine : {binding.versionSnapshot.author.label} · {formatDate(binding.versionSnapshot.createdAt)}</p>
      {binding.versionSnapshot.predecessor ? <p>Version précédente · {binding.versionSnapshot.predecessor.version}</p> : <p>Première version de cette référence.</p>}
      {binding.activations.map(activation => <p key={activation.eventReference}>Activée par {activation.activatedBy.label} · {formatDate(activation.activatedAt)} · {activation.reason}</p>)}
      <code>{binding.reference.id} · {binding.reference.version} · {binding.reference.contentReference}</code>
      <code>Référence du cadre de culture · {binding.bindingReference}</code>
    </details>
  </div>;
}

function ContextAssertion({ assertion, freshCultureReference }: { assertion: HopAdviceAssertion; freshCultureReference?: string | null }) {
  if (assertion.id === 'adopted-context-culture') return <article className="hv-reex-v4__assertion is-hypothesis">
    <b>Culture adoptée comme hypothèse</b><span>{assertionStateLabels[assertion.state]} · les membres et la provenance restent liés au cadre adopté.</span>
    <details><summary>Référence du cadre de culture adopté</summary><code>{freshCultureReference ?? 'Aucun cadre de culture adopté dans l’aperçu'}</code></details>
  </article>;
  return <article className="hv-reex-v4__assertion">
    <b>{assertion.statement}</b><span>{assertionStateLabels[assertion.state]} · {assertionValue(assertion)}</span>
    {assertion.source ? <details><summary>Source</summary><span>{assertion.source.title}{assertion.source.author ? ` · ${assertion.source.author}` : ''}</span>
      {assertion.source.locator ? <span>{assertion.source.locator}</span> : null}<code>{assertion.source.reference}</code></details>
      : <small>Aucune source jointe à ce fait.</small>}
    <details><summary>Identité du fait</summary><code>{assertion.id}</code>{assertion.dimension ? <span> · {assertion.dimension}</span> : null}</details>
  </article>;
}

export function HopV55PropertyAdviceReexaminationPanelV4({ parentRecord, readOnly = false, onPrepare, onConfirm }:
  HopV55PropertyAdviceReexaminationPanelV4Props) {
  const rootId = useId().replace(/:/gu, '');
  const parentKey = recordIdentityKey(parentRecord);
  const parentKeyRef = useRef(parentKey);
  parentKeyRef.current = parentKey;
  const operationRef = useRef(0);
  const lastParentKeyRef = useRef(parentKey);
  const [preview, setPreview] = useState<ReexaminationPreview>();
  const [preparing, setPreparing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [prepareError, setPrepareError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [success, setSuccess] = useState<AnswerRecord>();
  const [failedPrepare, setFailedPrepare] = useState<{ request: PrepareRequest; parentKey: string }>();
  const [failedConfirm, setFailedConfirm] = useState<{ request: ConfirmRequest; parentKey: string; previewReference: string }>();
  const [modes, setModes] = useState<Record<string, AnnotationMode | undefined>>({});
  const [reasons, setReasons] = useState<Record<string, string | undefined>>({});
  const [linkSelections, setLinkSelections] = useState<Record<string, string | undefined>>({});
  const [accessDrafts, setAccessDrafts] = useState<AccessDraftMap>({});
  const [confirmReason, setConfirmReason] = useState('');

  useEffect(() => {
    if (lastParentKeyRef.current === parentKey) return;
    lastParentKeyRef.current = parentKey;
    operationRef.current += 1;
    setPreview(undefined); setPreparing(false); setConfirming(false);
    setPrepareError(''); setConfirmError(''); setSuccess(undefined);
    setFailedPrepare(undefined); setFailedConfirm(undefined);
    setModes({}); setReasons({}); setLinkSelections({}); setAccessDrafts({}); setConfirmReason('');
  }, [parentKey]);

  const parentLedgerRead = useMemo(() => readHopV55PropertyAdviceAnnotationLedgerV1(parentRecord.ledger, parentRecord.originalQuestion),
    [parentRecord.ledger, parentRecord.originalQuestion]);
  const parentLedger = parentLedgerRead.status === 'readOnly' ? parentLedgerRead.ledger : undefined;
  const previewIsForParent = !!preview && preview.ownerKey === parentRecord.ownerKey && preview.workspaceId === parentRecord.workspaceId
    && preview.parentRecordReference === parentRecord.reference && preview.parentLedgerReference === parentRecord.ledger.reference
    && preview.parentReadingReference === parentRecord.sourceReadingReference;
  const activePreview = previewIsForParent ? preview : undefined;
  const rows = useMemo(() => parentLedger && activePreview
    ? annotationRowsV4(parentLedger, activePreview.diagnostics) : [], [parentLedger, activePreview]);
  const draft = useMemo(() => parentLedger && activePreview
    ? buildConfirmationDraftV4({ parentLedger, preview: activePreview, modes, reasons, linkSelections, accessDrafts }) : undefined,
  [parentLedger, activePreview, modes, reasons, linkSelections, accessDrafts]);
  const parentActiveCount = parentLedger ? parentActiveIntents(parentLedger).length : 0;
  const parentRejectedCount = parentLedger ? Math.max(0, parentLedger.sourceAnnotations.length - parentActiveCount) : 0;
  const prospectiveActiveCount = draft && parentLedger ? expectedActiveIntents(parentLedger, draft.actions).length : parentActiveCount;
  const prospectiveRejectedCount = parentLedger ? Math.max(0, parentLedger.sourceAnnotations.length - prospectiveActiveCount) : parentRejectedCount;
  const canConfirm = !!activePreview && !!onConfirm && !confirming && !preparing
    && !!draft && draft.issues.length === 0 && !!confirmReason.trim();

  const clearConfirmationAttempt = () => { setFailedConfirm(undefined); setConfirmError(''); setSuccess(undefined); };
  const prepare = async (request?: PrepareRequest) => {
    if (!onPrepare || preparing || confirming || !parentLedger) return;
    const exactRequest = request ?? (failedPrepare?.parentKey === parentKey ? failedPrepare.request : {
      previewId: `reexamination-preview:${crypto.randomUUID()}`,
      expectedRecordReference: parentRecord.reference,
      expectedLedgerReference: parentRecord.ledger.reference,
    });
    const attempt = ++operationRef.current;
    setPreparing(true); setPrepareError(''); setConfirmError(''); setSuccess(undefined);
    try {
      const result = await onPrepare(exactRequest);
      if (parentKeyRef.current !== parentKey || operationRef.current !== attempt) return;
      const checked = validatePreviewForParent(parentRecord, result);
      if (!checked.preview) throw new Error(checked.reason ?? 'L’aperçu ne correspond pas à cette version.');
      setPreview(checked.preview); setFailedPrepare(undefined); setFailedConfirm(undefined);
      setModes({}); setReasons({}); setLinkSelections({}); setAccessDrafts({}); setConfirmReason('');
    } catch (cause) {
      if (parentKeyRef.current !== parentKey || operationRef.current !== attempt) return;
      const message = cause instanceof Error && cause.message ? cause.message : 'L’aperçu n’a pas pu être préparé.';
      setPrepareError(message); setFailedPrepare({ request: exactRequest, parentKey });
    } finally {
      if (parentKeyRef.current === parentKey && operationRef.current === attempt) setPreparing(false);
    }
  };

  const cancelPreview = () => {
    if (confirming) return;
    operationRef.current += 1;
    setPreview(undefined); setPreparing(false); setPrepareError(''); setConfirmError(''); setSuccess(undefined);
    setFailedPrepare(undefined); setFailedConfirm(undefined);
    setModes({}); setReasons({}); setLinkSelections({}); setAccessDrafts({}); setConfirmReason('');
  };

  const confirmCurrentPreview = async () => {
    if (!activePreview || !draft || !onConfirm || !canConfirm) return;
    const retry = failedConfirm?.parentKey === parentKey && failedConfirm.previewReference === activePreview.reference
      ? failedConfirm.request : undefined;
    const request: ConfirmRequest = retry ?? {
      commandId: `property-advice-v4-reexamination:${crypto.randomUUID()}`,
      previewId: activePreview.previewId, expectedPreviewReference: activePreview.reference,
      expectedRecordReference: parentRecord.reference, expectedLedgerReference: parentRecord.ledger.reference,
      actions: structuredClone(draft.actions), bindingChoices: structuredClone(draft.bindingChoices),
      readingContext: structuredClone(draft.readingContext), reason: confirmReason.trim(),
    };
    const attempt = ++operationRef.current;
    setConfirming(true); setConfirmError(''); setSuccess(undefined);
    try {
      const result = await onConfirm(request);
      if (parentKeyRef.current !== parentKey || operationRef.current !== attempt) return;
      const problem = verifyReexaminationConfirmationResultV4({ parentRecord, preview: activePreview, request, result });
      if (problem) throw new Error(problem);
      setFailedConfirm(undefined); setSuccess(result);
    } catch (cause) {
      if (parentKeyRef.current !== parentKey || operationRef.current !== attempt) return;
      const message = cause instanceof Error && cause.message ? cause.message : 'La nouvelle lecture n’a pas été confirmée.';
      setConfirmError(message); setFailedConfirm({ request, parentKey, previewReference: activePreview.reference });
    } finally {
      if (parentKeyRef.current === parentKey && operationRef.current === attempt) setConfirming(false);
    }
  };

  const parentSourceLabel = sourceKindLabels[parentRecord.preparation.source.kind] ?? 'Source exacte';
  const modeFor = (row: AnnotationRowV4): AnnotationMode => modes[row.source.id] ?? 'keep';
  const showRequalificationInputs = (row: AnnotationRowV4) => row.diagnostics.length > 0
    && (row.status === 'active' && modeFor(row) === 'keep' || row.status === 'rejected' && modeFor(row) === 'restore');

  return <section className="hop-v55 hv-reex-v4" aria-labelledby={`${rootId}-title`}>
    <header className="hv-reex-v4__header">
      <p className="hv-reex-v4__eyebrow">Nouvelle lecture · réexamen</p>
      <h3 id={`${rootId}-title`}>Repartir de cette version dans le contexte actuel</h3>
      <p>Version visée · {formatDate(parentRecord.transition.recordedAt)} · {parentSourceLabel} · {parentActiveCount} termes actifs · {parentRejectedCount} écartés</p>
      <blockquote aria-label="Question originale, mot pour mot">{parentRecord.originalQuestion}</blockquote>
      <p className="hv-reex-v4__boundary">La version d’origine restera intacte. L’aperçu et les choix ci-dessous forment une nouvelle version séparée; rien n’est modifié avant confirmation.</p>
      {readOnly ? <p className="hv-reex-v4__notice" role="note">{onPrepare
        ? 'La version affichée reste intacte. Prépare un aperçu pour repartir de cette version dans le contexte actuel.'
        : 'La version affichée reste intacte. La préparation d’un aperçu n’est pas disponible dans cette vue.'}</p> : null}
    </header>

    {parentLedgerRead.status !== 'readOnly' ? <p className="hv-reex-v4__error" role="alert">Le registre de cette version ne peut pas être relu : {parentLedgerRead.reason}</p> : null}

    <div className="hv-reex-v4__frames">
      <ContextFrameCard title="Cadre conservé dans la version d’origine" context={parentRecord.readingContext.context}
        sourceKind={parentSourceLabel} reference={parentRecord.reference} record={parentRecord}
        cultureBindingReference={parentRecord.preparation.cultureBinding?.bindingReference ?? null} />
      {activePreview ? <ContextFrameCard title="Cadre actuel proposé · lecture seule" context={activePreview.readingContext.context}
        sourceKind={sourceLabel(activePreview.source)} reference={activePreview.sourceReadingReference}
        cultureBindingReference={activePreview.cultureBindingReference} />
        : <section className="hv-reex-v4__frame hv-reex-v4__empty-preview"><h4>Cadre courant à examiner</h4>
          <p>Prépare un aperçu depuis la source active. La lecture d’origine et ses faits ne servent pas de faits actuels.</p>
          {onPrepare ? <>
            {prepareError ? <p className="hv-reex-v4__error" role="alert">{prepareError}</p> : null}
            {failedPrepare?.parentKey === parentKey ? <button type="button" className="hv-reex-v4__secondary" disabled={preparing || confirming}
              onClick={() => void prepare(failedPrepare.request)}>{preparing ? 'Préparation…' : 'Réessayer le même aperçu'}</button>
              : <button type="button" className="hv-reex-v4__primary" disabled={preparing || confirming || !parentLedger}
                onClick={() => void prepare()}>{preparing ? 'Préparation…' : 'Préparer un aperçu du contexte frais'}</button>}
          </> : <p>La page ne fournit pas encore le geste de préparation dans ce contexte.</p>}
        </section>}
    </div>

    {activePreview ? <>
      <section className="hv-reex-v4__preview-status" aria-label="État de l’aperçu">
        <div><strong>Aperçu préparé · aucune réponse ni recette enregistrée</strong>
          <span>{formatDate(activePreview.sourceReadingArchive.recordedAt)} · la source et le cadre sont rattachés à cette référence</span></div>
        <button type="button" className="hv-reex-v4__text-button" disabled={confirming || preparing}
          onClick={cancelPreview}>Annuler ce brouillon</button>
        <details><summary>Détails de la source actuelle</summary>
          <code>Référence de l’aperçu · {activePreview.reference}</code><code>ID de l’aperçu · {activePreview.previewId}</code>
          <code>Archive de lecture · {activePreview.sourceReadingArchive.contentReference}</code><code>Préparation · {activePreview.preparedReference}</code>
          <code>Cadre de culture adopté · {activePreview.cultureBindingReference ?? 'aucun'}</code>
          {exactSourceReference(activePreview.source).map(row => <span key={`${row.label}-${row.value}`}>{row.label} · <code>{row.value}</code></span>)}
        </details>
      </section>

      <section className="hv-reex-v4__scope" aria-label="Cadre repris sans modification">
        <h4>Éléments conservés du cadre d’origine</h4>
        <p>Le résumé, le périmètre des matières et les exclusions se corrigent séparément. Ils restent ceux de la version d’origine dans cette nouvelle lecture.</p>
        <details><summary>Résumé et périmètre exacts</summary>
          <p>{activePreview.readingContext.interpretation.text}</p>
          <p>{activePreview.readingContext.candidatePolicy.kind === 'explicit' ? 'Liste exacte' : 'Découverte sur un périmètre exact'} · {activePreview.readingContext.candidatePolicy.materialIds.length} matières</p>
          <small>{activePreview.readingContext.candidatePolicy.basis}</small>
          {activePreview.readingContext.candidatePolicy.materialIds.length ? <ul>{activePreview.readingContext.candidatePolicy.materialIds.map(id => <li key={id}><code>{id}</code></li>)}</ul> : null}
          {activePreview.readingContext.exclusions.length ? <ul>{activePreview.readingContext.exclusions.map(row => <li key={row.id}>{row.reason}
            <details><summary>Intervention et identité</summary><span>{row.intervention} · {row.certainty}</span><code>{row.id}</code></details></li>)}</ul>
            : <p>Aucune exclusion dans le cadre d’origine.</p>}
        </details>
      </section>

      <section className="hv-reex-v4__annotations" aria-label="Registre des annotations et nouveaux choix">
        <header><div><h4>Annotations et liens de faits</h4>
          <p>Les passages, décisions et rejets restent dans leur trace. Une intention active au lien périmé doit être requalifiée ou écartée.</p></div>
          <span>{rows.length} {rows.length === 1 ? 'annotation' : 'annotations'} · {activePreview.diagnostics.length} {activePreview.diagnostics.length === 1 ? 'lien' : 'liens'} à revoir</span></header>
        {!rows.length ? <p>Aucune annotation dans le registre de cette version.</p> : <div className="hv-reex-v4__annotation-list">
          {rows.map(row => {
            const mode = modeFor(row);
            const active = row.status === 'active';
            const previousIntent = row.activeIntent ?? row.previousActiveIntent;
            const needsReason = mode === 'reject' || mode === 'restore' || active && mode === 'keep' && row.diagnostics.length > 0;
            const requalifies = active && mode === 'keep' && row.diagnostics.length > 0
              || !active && mode === 'restore' && row.diagnostics.length > 0;
            return <article className="hv-reex-v4__annotation" key={row.source.id}>
              <div className="hv-reex-v4__annotation-head">
                <div><strong>{row.source.label}</strong><span>{previousIntent ? intentRoleLine(previousIntent) : 'Annotation source'}</span></div>
                <span className={`hv-reex-v4__ledger-status is-${row.status}`}>{active ? 'Active dans la version d’origine' : 'Écartée dans la version d’origine'}</span>
              </div>
              {row.source.sourceSpans.length ? <div className="hv-reex-v4__spans" aria-label={`Passage exact de ${row.source.label}`}>
                {row.source.sourceSpans.map((span, index) => <blockquote key={`${span.start}-${span.end}-${index}`}>« {span.text} »</blockquote>)}
              </div> : <p>Aucun fragment source attaché à cette annotation.</p>}
              {previousIntent?.qualification ? <p>Précision conservée : {previousIntent.qualification}</p> : null}
              {row.diagnostics.length ? <div className="hv-reex-v4__diagnostics" aria-label={`Liens à revoir pour ${row.source.label}`}>
                {row.diagnostics.map(diagnostic => <PreviewLinkCard key={scopeKey(row.source.id, diagnostic.previousAssertionId)}
                  diagnostic={diagnostic} selection={linkSelections[scopeKey(row.source.id, diagnostic.previousAssertionId)]}
                  canDetach={previousIntent ? canDetach(previousIntent) : false} disabled={confirming || !requalifies}
                  onChange={value => { setLinkSelections(items => ({ ...items, [scopeKey(row.source.id, diagnostic.previousAssertionId)]: value })); clearConfirmationAttempt(); }} />)}
                {!active && mode === 'keep' ? <p>Cette annotation reste écartée; aucun ancien lien n’est réactivé.</p> : null}
                {active && mode === 'reject' ? <p>En l’écartant, aucun de ses liens historiques ne sera reporté dans le nouveau cadre.</p> : null}
              </div> : null}
              {active ? <button type="button" className={mode === 'reject' ? 'hv-reex-v4__secondary' : 'hv-reex-v4__reject'}
                disabled={confirming || mode === 'restore'} onClick={() => { setModes(items => ({ ...items, [row.source.id]: mode === 'reject' ? 'keep' : 'reject' })); clearConfirmationAttempt(); }}>
                {mode === 'reject' ? `Garder « ${row.source.label} »` : `Écarter « ${row.source.label} » dans la nouvelle version`}</button>
                : <button type="button" className={mode === 'restore' ? 'hv-reex-v4__secondary' : 'hv-reex-v4__primary'}
                  disabled={confirming || !row.previousActiveIntent || mode === 'reject'}
                  onClick={() => { setModes(items => ({ ...items, [row.source.id]: mode === 'restore' ? 'keep' : 'restore' })); clearConfirmationAttempt(); }}>
                  {mode === 'restore' ? `Laisser « ${row.source.label} » écarté` : `Restaurer « ${row.source.label} » dans cette lecture`}</button>}
              {needsReason ? <label className="hv-reex-v4__field"><span>{mode === 'reject' ? 'Pourquoi écarter cette annotation ?' : mode === 'restore' ? 'Pourquoi restaurer cette annotation ?' : 'Pourquoi confirmer ces liens dans la nouvelle lecture ?'}</span>
                <Textarea rows={2} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
                  aria-label={`Motif pour ${row.source.label}`} value={reasons[row.source.id] ?? ''} disabled={confirming}
                  onChange={event => { setReasons(items => ({ ...items, [row.source.id]: event.target.value })); clearConfirmationAttempt(); }} /></label> : null}
              <details><summary>Historique de cette annotation</summary><code>{row.source.id}</code>
                {row.previousActiveIntent ? <span>Projection active antérieure · {row.previousActiveIntent.interpretationOrigin} · <code>{row.previousActiveIntent.comparisonBasis.kind}</code></span> : null}
              </details>
            </article>;
          })}
        </div>}
      </section>

      <section className="hv-reex-v4__access" aria-labelledby={`${rootId}-access-title`}>
        <div><h4 id={`${rootId}-access-title`}>Accès déclarés pour ce nouveau cadre</h4>
          <p>Les accès de l’aperçu restent tels quels si tu ne déclares rien. Une déclaration ajoutée ici reçoit une nouvelle attestation locale, avec sa source et son motif.</p></div>
        <div className="hv-reex-v4__access-list">{ACCESS_SCOPES.map(scope => {
          const state = accessDrafts[scope]?.state ?? '';
          return <label className="hv-reex-v4__field" key={scope}>
            <span>{accessLabels[scope]} · aperçu : {accessStateLabels[activePreview.readingContext.context.access[scope].state]}</span>
            <select aria-label={`Déclaration d’accès ${accessLabels[scope]}`} value={state} disabled={confirming} autoComplete="off"
              onChange={event => { const value = event.target.value as AccessState | ''; setAccessDrafts(current => {
                const next = { ...current };
                if (!value) delete next[scope]; else next[scope] = { state: value, reason: current[scope]?.reason ?? '' };
                return next;
              }); clearConfirmationAttempt(); }}>
              <option value="">Garder l’état de l’aperçu</option><option value="yes">Déclarer Oui</option><option value="no">Déclarer Non</option>
            </select>
            {state ? <Textarea rows={2} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
              aria-label={`Motif d’accès ${accessLabels[scope]}`} placeholder="Motif exact de la déclaration"
              value={accessDrafts[scope]?.reason ?? ''} disabled={confirming}
              onChange={event => { setAccessDrafts(current => ({ ...current, [scope]: { state: state as AccessState, reason: event.target.value } })); clearConfirmationAttempt(); }} /> : null}
          </label>;
        })}</div>
      </section>

      {draft ? <section className="hv-reex-v4__before-after" aria-label="Avant et après">
        <h4>Avant et après confirmation</h4>
        <p>Annotations actives · {parentActiveIntents(parentLedger!).length} → {prospectiveActiveCount}</p>
        <p>Annotations écartées · {Math.max(0, parentLedger!.sourceAnnotations.length - parentActiveIntents(parentLedger!).length)} → {prospectiveRejectedCount}</p>
        {draft.changes.length ? <ul>{draft.changes.map((row, index) => <li key={`${row.label}-${index}`}>
          <strong>{row.label}</strong><span>{row.before} → {row.after}</span><small>Motif : {row.reason}</small>
          {row.references?.length ? <details><summary>Identités des faits liés</summary>
            {row.references.map((reference, position) => <div key={`${reference.beforeId}-${position}`}>
              <span>Avant</span><code>{reference.beforeId}</code><span>Après</span><code>{reference.afterId ?? 'Aucun fait lié'}</code>
            </div>)}</details> : null}</li>)}</ul>
          : <p>Aucun changement d’annotation ou d’accès n’est déclaré; une version sera créée avec le cadre frais inchangé.</p>}
        {draft.issues.length ? <div className="hv-reex-v4__todo" role="status"><strong>À compléter avant confirmation</strong><ul>{draft.issues.map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}</ul></div> : null}
      </section> : null}

      <form className="hv-reex-v4__confirm" autoComplete="off" onSubmit={event => { event.preventDefault(); void confirmCurrentPreview(); }}>
        <label className="hv-reex-v4__field"><span>Pourquoi créer cette nouvelle lecture ?</span>
          <Textarea rows={2} autoComplete="off" autoCorrect="off" autoCapitalize="sentences" spellCheck={false}
            aria-label="Motif du réexamen réconcilié" value={confirmReason} disabled={confirming}
            onChange={event => { setConfirmReason(event.target.value); clearConfirmationAttempt(); }} /></label>
        {confirmError ? <p className="hv-reex-v4__error" role="alert">{confirmError}</p> : null}
        {success ? <p className="hv-reex-v4__success" role="status">{success.outcome.kind === 'allRejected'
          ? 'Nouvelle version confirmée. Tous les termes sont écartés; aucun conseil n’a été créé.'
          : 'Nouvelle version confirmée. La version d’origine reste consultable dans l’historique.'}</p> : null}
        {!onConfirm ? <p>La page ne fournit pas encore la confirmation de cet aperçu.</p> : null}
        {failedConfirm?.parentKey === parentKey && failedConfirm.previewReference === activePreview.reference
          ? <><small>Le même acte, le même aperçu, les mêmes liens et le même motif seront renvoyés.</small>
            <button type="button" className="hv-reex-v4__primary" disabled={confirming || !onConfirm}
              onClick={() => void confirmCurrentPreview()}>
              {confirming ? 'Confirmation…' : 'Réessayer la même confirmation'}</button></>
          : <button type="submit" className="hv-reex-v4__primary" disabled={!canConfirm}>
            {confirming ? 'Confirmation…' : 'Confirmer la nouvelle lecture'}</button>}
        <p className="hv-reex-v4__boundary">Aucune recette, aucun brassin, aucun stock et aucune réponse d’origine ne sont modifiés par l’aperçu.</p>
      </form>
    </> : null}
  </section>;
}

function validatePreviewForParent(parent: AnswerRecord, raw: unknown): { preview?: ReexaminationPreview; reason?: string } {
  const read = readHopV55PropertyAdviceReexaminationPreviewV1(raw);
  if (read.status !== 'readOnly') return { reason: read.reason };
  const preview = read.preview;
  const parentAnswerReference = parent.outcome.kind === 'domainAnswer' ? parent.outcome.answerReference : undefined;
  if (preview.ownerKey !== parent.ownerKey || preview.workspaceId !== parent.workspaceId
    || preview.parentRecordReference !== parent.reference || preview.parentLedgerReference !== parent.ledger.reference
    || preview.parentReadingReference !== parent.sourceReadingReference || preview.parentReadingArchiveReference !== parent.sourceReadingReference
    || preview.parentAnswerReference !== parentAnswerReference || preview.originalQuestion !== parent.originalQuestion
    || !same(preview.source, parent.preparation.source)) {
    return { reason: 'L’aperçu ne vise pas la version, le registre, la question et la source exactement affichés.' };
  }
  return { preview };
}

function rowDescription(row: AnnotationRowV4): string {
  const intent = row.activeIntent ?? row.previousActiveIntent ?? row.source;
  return `${intent.label} · ${intentRoleLine(intent)}`;
}

function choiceSummary(diagnostic: HopV55PropertyAdviceReexaminationLinkDiagnosticV1, selection: string | undefined): string {
  if (selection === 'detach') return 'Lien détaché; sa base restera inconnue.';
  if (selection?.startsWith('bind:')) {
    const candidate = diagnostic.compatibleFreshAssertions.find(row => row.assertionId === selection.slice('bind:'.length));
    return candidate ? `Lien explicite vers : ${candidate.assertion.statement}` : 'Fait frais introuvable.';
  }
  return 'Choix nécessaire.';
}

function parentBindingNotice(binding: HopV55AdoptedContextBindingV1 | undefined, freshBindingReference: string | null) {
  return <section className="hv-reex-v4__binding" aria-label="Provenance de culture">
    <h4>Cadre de culture adopté</h4>
    {binding ? bindingIntentRows(binding) : <p>Aucun cadre de culture adopté n’était associé à la version d’origine.</p>}
    <details><summary>Cadre de culture proposé pour l’aperçu</summary>
      {freshBindingReference ? <><p>Référence portée par l’aperçu courant; elle ne constitue pas un fait documentaire ni une nouvelle adoption.</p>
        <code>{freshBindingReference}</code></>
        : <p>Aucun cadre de culture adopté n’est associé au contexte proposé.</p>}
    </details>
  </section>;
}

function ContextFrameCard({ title, context, sourceKind, reference, cultureBindingReference, record }: {
  title: string; context: HopV55PropertyAdviceV4ReadingContext['context']; sourceKind: string; reference: string;
  cultureBindingReference?: string | null; record?: AnswerRecord;
}) {
  return <section className="hv-reex-v4__frame">
    <header><h4>{title}</h4><small>{sourceKind}</small></header>
    <p className="hv-reex-v4__stage"><strong>{stageLabels[context.stage] ?? 'Stade non précisé'}</strong><span>{context.stageBasis}</span></p>
    <div className="hv-reex-v4__access-grid" aria-label={`Accès du cadre ${title.toLocaleLowerCase('fr-CH')}`}>
      {ACCESS_SCOPES.map(scope => {
        const access = context.access[scope];
        const linked = access.assertionIds.map(id => context.assertions.find(assertion => assertion.id === id)).filter(Boolean) as HopAdviceAssertion[];
        return <article key={scope} className={`is-${access.state}`}>
          <strong>{accessLabels[scope]} · {accessStateLabels[access.state]}</strong><span>{access.basis}</span>
          {linked.map(assertion => <details key={assertion.id}><summary>Fait lié</summary><ContextAssertion assertion={assertion} freshCultureReference={cultureBindingReference} />
            <code>{assertion.id}</code></details>)}
        </article>;
      })}
    </div>
    <details className="hv-reex-v4__facts"><summary>Faits du cadre · {context.assertions.length}</summary>
      <div>{context.assertions.map(assertion => <ContextAssertion key={assertion.id} assertion={assertion} freshCultureReference={cultureBindingReference} />)}</div>
    </details>
    {record ? parentBindingNotice(record.preparation.cultureBinding, cultureBindingReference) : null}
    <details className="hv-reex-v4__exact"><summary>Références exactes</summary>
      <code>{reference}</code><code>{record?.reference ?? ''}</code><code>{record?.ledger.reference ?? ''}</code>
    </details>
  </section>;
}

function PreviewLinkCard({ diagnostic, selection, canDetach, disabled, onChange }: {
  diagnostic: HopV55PropertyAdviceReexaminationLinkDiagnosticV1;
  selection?: string;
  canDetach: boolean;
  disabled: boolean;
  onChange(value: string): void;
}) {
  const id = useId();
  return <article className="hv-reex-v4__link-card">
    <div className="hv-reex-v4__link-before-after">
      <div><small>Fait lié dans la version d’origine</small><strong>{diagnostic.previousAssertion.statement}</strong>
        <span>{assertionStateLabels[diagnostic.previousAssertion.state]} · {assertionValue(diagnostic.previousAssertion)}</span>
        <details><summary>Source et identité historiques</summary>
          {diagnostic.previousAssertion.source ? <><span>{diagnostic.previousAssertion.source.title}{diagnostic.previousAssertion.source.author
            ? ` · ${diagnostic.previousAssertion.source.author}` : ''}</span>
            {diagnostic.previousAssertion.source.locator ? <span>{diagnostic.previousAssertion.source.locator}</span> : null}
            <code>{diagnostic.previousAssertion.source.reference}</code></> : <p>Aucune source jointe à ce fait historique.</p>}
          <code>{diagnostic.previousAssertionReference}</code>
        </details>
      </div>
      <div><small>{diagnostic.status === 'changed' ? 'Même identifiant, contenu frais différent' : 'Fait absent du cadre frais'}</small>
        {diagnostic.currentAssertion ? <><strong>{diagnostic.currentAssertion.statement}</strong>
          <span>{assertionStateLabels[diagnostic.currentAssertion.state]} · {assertionValue(diagnostic.currentAssertion)}</span>
          <details><summary>Identité du fait frais</summary><code>{diagnostic.currentAssertionReference}</code></details></>
          : <p>Aucun fait frais ne porte cet identifiant.</p>}
      </div>
    </div>
    <label htmlFor={id}>Choix pour ce lien de base courante</label>
    <select id={id} aria-label={`Choix du fait frais pour ${diagnostic.previousAssertion.statement}`}
      value={selection ?? ''} disabled={disabled} autoComplete="off" onChange={event => onChange(event.target.value)}>
      <option value="">Choisir explicitement…</option>
      {diagnostic.compatibleFreshAssertions.map(candidate => <option key={candidate.assertionId} value={`bind:${candidate.assertionId}`}>
        Relier à : {candidate.assertion.statement} · {assertionStateLabels[candidate.assertion.state]} · {assertionValue(candidate.assertion)}
        {candidate.assertionId === diagnostic.previousAssertionId ? ' · même identifiant, nouveau contenu' : ''}
      </option>)}
      {canDetach ? <option value="detach">Détacher; garder cette base inconnue</option> : null}
    </select>
    <p>{choiceSummary(diagnostic, selection)}</p>
    {!diagnostic.compatibleFreshAssertions.length && !canDetach
      ? <small>Aucun fait frais compatible et ce rôle exige une base courante; écarte l’annotation si elle ne peut plus être soutenue.</small> : null}
  </article>;
}
