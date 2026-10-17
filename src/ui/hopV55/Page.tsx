import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Clock3, FlaskConical, RotateCcw } from 'lucide-react';
import type { BrewerChatInput, BrewerContext } from '../../../functions/src/companionTypes';
import { mapBrewerHopAdviceLaunchSourceToScopeV1 } from '../../../functions/src/brewerHopAdviceContextBinding';
import { mapBrewerHopAdviceWizardSourceToScopeV1 } from '../../../functions/src/brewerHopAdviceWizardSourceV1';
import type { HopV55AssistedCompanionSession, HopV55AssistedCompanionTurn,
  HopV55SemanticCompanionSessionAnyV1 } from './assistedAdviceUiContracts';
import type { BrewerCatalogueLookupRecord } from '../../../functions/src/brewerCatalogueStore';
import type { HopAxis } from '../../../functions/src/hopPredictionSchema';
import type { Recipe } from '../../types';
import { hopV55DoseReading, hopV55ExactReading } from './readings';
import type { HopV55ContextSource, HopV55Copy, HopV55Intent, HopV55Services, HopV55Workspace } from '../../services/hopV55/contracts';
import { buildHopV55DecisionCriteria, buildHopV55DecisionSituation, type HopV55QuestionReading } from '../../services/hopV55/decision';
import { readHopV55QuestionSemanticWithScopesV1, createHopV55QuestionScopeLedgerV1,
  reviseHopV55QuestionScopeLedgerV1, type HopV55QuestionScopeV1,
  type HopV55QuestionScopeLedgerEntryV1, type HopV55QuestionScopeDispositionActionV1 } from '../../services/hopV55/questionScopeReading';
import { applyHopV55DecisionCriteriaCorrection, reevaluateHopV55DecisionReading,
  hopV55DecisionReadingMaterialExclusions } from '../../services/hopV55/decisionCorrection';
import { createHopV55DecisionReadingArchiveV2, createHopV55DecisionReadingArchiveV3, readHopV55DecisionReadingArchive, hopV55DecisionReadingForDisplay,
  createHopV55DecisionReadingArchiveV4, type HopV55ArchivedDecisionProgramPreparationV1,
  type HopV55DecisionReadingArchive, type HopV55DecisionReadingArchiveV3, type HopV55DecisionReadingArchiveV4,
  type HopV55DecisionReadingSource, createHopV55DecisionReadingArchiveV4ForWizardV1, readHopV55DecisionReadingArchiveForWizardV1,
  type HopV55WizardDecisionReadingArchiveV4 } from '../../services/hopV55/decisionArchive';
import { createHopV55WizardSourceSnapshotV1, createHopV55WizardWorkspaceOriginV1,
  readHopV55WizardSourceSnapshotForArchiveV1, readHopV55WizardWorkspaceOriginV1 } from '../../services/hopV55/workspaceRepository';
import { HopV55SemanticArchivedAnswerV1 } from '../BrewerChat';
import { archiveHopV55SemanticReadingV1, createHopV55SemanticCorrectionArchiveV1,
  createHopV55SemanticReinterpretationArchiveV1, hopV55DecisionReadingScopesV1 } from '../../services/hopV55/decisionReadingAccessors';
import type { HopV55SemanticQuestionReadingV1 } from '../../services/hopV55/questionSemanticReading';
import { projectHopV55SemanticDecisionV1 } from '../../services/hopV55/decisionSemanticProjection';
import { prepareHopV55DecisionProgram } from '../../services/hopV55/decisionProgramPreparation';
import { appendHopV55ExplorationProfileRecord } from '../../services/hopV55/explorationProfiles';
import { appendHopV55ExplorationTrialPreparationRecord, appendHopV55ExplorationTrialReceiptRecord,
  confirmHopV55ExplorationTrialV1, createHopV55ExplorationTrialOriginContextV1,
  createHopV55ExplorationTrialProgramCopyRebaseV1, createHopV55ExplorationTrialReceiptV1,
  prepareHopV55ExplorationTrialV1, readHopV55ExplorationTrialPreparationV1,
  readHopV55ExplorationTrialReceiptV1,
  type HopV55ExplorationTrialCaptureV1, type HopV55ExplorationTrialEntryV1,
  type HopV55ExplorationTrialOriginContextV1, type HopV55ExplorationTrialPreparationV1,
  type HopV55ExplorationTrialProgramCopyRebaseV1, type HopV55ExplorationTrialProgramOriginV1 } from '../../services/hopV55/explorationTrialPreparation';
import type { HopV55ExplorationProfileV1 } from '../../services/hopV55/explorationProfiles';
import { createHopV55PropertyAdviceControllerV3 } from '../../services/hopV55/propertyAdviceControllerV3';
import { createHopV55PropertyAdviceControllerV4, type HopV55PropertyAdviceV4Pending,
  type HopV55PropertyAdviceV4Command, type HopV55PropertyAdviceV4ReexaminationCommand,
  type HopV55PropertyAdviceV4PreviewCommand, type HopV55PropertyAdviceV4ConfirmationCommand } from '../../services/hopV55/propertyAdviceControllerV4';
import { lookupStoredHopV55PropertyAdviceReexaminationCommand,
  readHopV55PropertyAdviceReexaminationCommandStaging } from '../../services/hopV55/propertyAdviceReexaminationCommand';
import type { HopV55PropertyAdviceAnswerRecordV4 } from '../../services/hopV55/propertyAdviceRecordsV4';
import type { HopV55PropertyAdviceV4Transition } from '../../services/hopV55/propertyAdviceRecordsV4';
import type { HopV55PropertyAdviceReexaminationPreviewV1 } from '../../services/hopV55/propertyAdvicePreparationV4';
import { createHopV55PropertyAdviceAnswerRecordV4ForWizardV1, readHopV55PropertyAdviceAnswerRecordV4ForWizardV1,
  type HopV55PropertyAdviceAnswerRecordV4ForWizardV1 } from '../../services/hopV55/propertyAdviceRecordsV4';
import { prepareCorrectionV4ForWizardV1, resumeV4ForWizardV1, type HopV55PropertyAdviceLedgerActionV4,
  type PrepareHopV55PropertyAdviceCorrectionV4ForWizardV1Input } from '../../services/hopV55/propertyAdvicePreparationV4';
import type { HopV55PropertyAdviceDisplayedRecordIdentityV4 } from './propertyAdviceV4UiContracts';
import { prepareHopV55AdoptedContext, type HopV55AdoptedContextPreparationV1 } from '../../services/hopV55/adoptedContextPreparation';
import { resolveHopV55AdoptedContext, type HopV55AdoptedContextBindingV1 } from '../../services/hopV55/adoptedContextResolution';
import { beforeSubmitHopV55AssistedAdvice, captureHopV55AssistedAdviceTicketV1, confirmHopV55AssistedAdviceSuggestion,
  hopV55AssistedAdviceTicketMatchesInput, prepareHopV55AssistedAdviceLaunchV1, readHopV55AssistedAdviceTicketV1,
  receiveHopV55AssistedAdvice, type HopV55AssistedAdvicePreparedLaunchV1, type HopV55AssistedAdviceTicketV1 } from '../../services/hopV55/assistedAdviceController';
import { readHopV55AssistedAdviceArchiveV1, type HopV55AssistedAdviceRecordV1 } from '../../services/hopV55/assistedAdviceArchive';
import { createHopV55AssistedAdviceBackendContractV1 } from '../../services/hopV55/assistedAdviceWorkspace';
import type { HopV55SemanticAdoptionApplicationHostV1 } from '../../services/hopV55/semanticAdoptionApplicationHost';
import { readHopV55AssistedAdviceArchiveV2, readHopV55AssistedAdviceTicketV2,
  readHopV55AssistedAdviceWizardArchiveV1, readHopV55AssistedAdviceWizardTicketV1,
  type HopV55AssistedAdviceWizardRecordV1 } from '../../services/hopV55/assistedSemanticAdviceArchiveV2';
import { readHopV55SemanticAdoptionCommitV1 } from '../../services/hopV55/semanticAdoptionController';
import type { HopV55SemanticAdoptionHeadV1, HopV55SemanticAdoptionReceiptV1 } from '../../services/hopV55/assistedSemanticAdviceAdoptionV6';
import { propertyAdviceContextProvenance } from './propertyAdviceContextProvenance';
import { createHopV55QualifiedStudyController } from '../../services/hopV55/qualifiedStudyController';
import { createHopV55QualifiedAdviceController, type HopV55QualifiedAdvicePrepareRequest } from '../../services/hopV55/qualifiedAdviceController';
import { readHopV55QualifiedStudyPreparation, readHopV55QualifiedStudyLink,
  type HopV55QualifiedStudyPreparationRecord, type HopV55QualifiedStudyPreparationV2,
  type PersistHopV55QualifiedStudyResult } from '../../services/hopV55/qualifiedStudyWorkspace';
import type { HopDecisionContext, HopDecisionEventV2 } from '../../domain/hopDecision/dossier';
import type { HopAdviceEventV3 } from '../../domain/hopDecision/adviceDossier';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import type { HopV55QualifiedStudyEntry } from './QualifiedStudyPanel';
import { projectHopV55QuestionScopeCoverageV1 } from '../../services/hopV55/questionScopeReading';
import { createHopV55ScenarioRequest } from '../../services/hopV55/scenarioAdapter';
import { applyHopV55ProgramCopy, previewHopV55ProgramCopy, type HopV55ProgramCopyPreview } from '../../services/hopV55/programCopy';
import { programDelta, rebaseHopV55ProgramCopy } from '../../services/hopV55/programOverlay';
import { commitHopV55Scenario, resumeHopV55ScenarioCommit, hopV55ScenarioRuntimeReference, type HopV55ScenarioCommitResult } from '../../services/hopV55/scenarioCommit';
import { createHopV55ReferenceComparison, readHopV55ReferenceComparison, HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID,
  type HopV55ReferenceComparisonDTO } from '../../services/hopV55/referenceComparison';
import { readHopV55FullRecipeCopyReceipt, type HopV55FullRecipeCopyReceipt } from '../../services/hopV55/fullRecipeCopy';
import type { HopV55RecipeApplicationRecordV1, HopV55RecipeDraftTarget } from '../../services/hopV55/recipeDraftApplication';
import { canonicalizeHopV55RecipeDraft } from '../../services/hopV55/recipeStepContext';
import { readHopV55FullRecipeCopyRecomputePayload, type HopV55FullRecipeCopyRecomputePayload } from '../../services/hopV55/candidateScenario';
import type { BrewingReferenceIdentityV1 } from '../../domain/brewingReference';
import type { BrewingSensoryDefinitionReference } from '../../domain/brewingSensory';
import type { HopV55ObservationWorkbenchSupport } from './ObservationWorkbench';
import type { HopV55ObservationTargetChoice } from './ObservationExplorer';
import { BREWING_OBSERVATION_SELECTION_VERSION } from '../../domain/brewingObservationSelection';
import { resolveHopV55ObservationSupport } from '../../services/hopV55/observationSupport';
import { prepareHopV55DocumentaryRequest, resumeHopV55DocumentaryRequestDraft, reviseHopV55DocumentaryRequest,
  buildHopV55DocumentaryAnswerRecord, createHopV55DocumentaryDossierRecord,
  type HopV55DocumentaryAnswerRecordV1 } from '../../services/hopV55/documentaryDecision';
import { readHopV55DocumentaryAnswerRecord, readHopV55DocumentaryDossierRecord, readHopV55DocumentaryAnswerRecordWithWizardV1,
  type HopV55DocumentaryAnswerRecord } from '../../services/hopV55/documentaryRecords';
import { createHopV55PropertyAdviceAnswerRecord, createHopV55PropertyAdviceDossierRecord,
  type HopV55PropertyAdviceAnswerRecordV2 } from '../../services/hopV55/propertyAdviceRecords';
import { prepareHopV55PropertyAdviceRequestDraft, reviseHopV55PropertyAdviceRequestDraft,
  resumeHopV55PropertyAdviceRequestDraft, reexamineHopV55PropertyAdviceRequestDraft,
  reconcileHopV55PropertyAdviceRequestDraft,
  hopV55PropertyAdvicePreparedReference, hopV55PropertyAdviceRequestDraftReference,
  type HopV55PropertyAdviceRequestDraftV2 } from '../../services/hopV55/propertyAdvicePreparation';
import { buildHopPropertyAdvice, buildHopPropertyAdviceV3, isHopProcessContextNoteIntent } from '../../domain/hopDecision/propertyAdvice';
import { hopPropertyAdviceAnswerReferenceV3, type HopPropertyAdviceCandidatePolicy,
  type HopPropertyAdviceIntentV3 } from '../../domain/hopDecision/propertyAdviceSchema';
import type { HopV55PropertyAdviceReinterpretRequest, HopV55PropertyAdviceDossierSaveRequest } from './PropertyAdviceDecision';
import type { HopV55DocumentaryReinterpretRequest, HopV55DocumentaryDossierSaveRequest, HopV55DocumentaryCandidateChoiceRequest } from './DocumentaryDecision';
import { prepareHopV55FutureRecipeMassRecomputeProposal, readHopV55FutureRecipeDraft,
  type HopV55FutureRecipeDraftV1, type HopV55FutureRecipeMaterializationReceiptV1,
  type HopV55FutureRecipeCurrentReferences, type HopV55FutureRecipeMassRecomputeProposalV1 } from '../../services/hopV55/futureRecipeDraft';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { BrewingStyleGuide } from '../../../functions/src/brewingStyleSchema';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../domain/hopDecision/types';
import { ensureHopV55ReferenceJournal, getHopV55AdoptedBaseline, getHopV55ReferenceProjection } from '../../services/hopV55/referenceWorkspace';
import { prepareBrewingScenarioContext, type PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { brewingScenarioCurrentReference, simulateBrewingScenario,
  type BrewingScenarioBranchRequest, type BrewingScenarioResult, type BrewingScenarioRequest } from '../../domain/brewingScenario';
import type { BrewingScenarioRecordRead, BrewingScenarioSnapshotV1 } from '../../domain/brewingScenarioDossier';
import { HopV55Comparison } from './Comparison';
import { HopV55ProgramEditor, hopV55Uses, type HopV55ProgramPrefill } from './ProgramEditor';
import type { HopAdviceOption } from '../../domain/hopDecision/adviceSchema';
import type { HopIntentEvidenceCriterion } from '../../domain/hopDecision/intentEvidence';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { HopV55PlanningStylePrefill } from './PlanningEditor';
import type { HopV55DecisionExploreRequest, HopV55SemanticCorrectionRequestV1 } from './DecisionResponse';
import type { HopV55DecisionCorrectionRequest, HopV55DecisionProgramPreparationRequest, HopV55DecisionProgramComparisonRequest,
  HopV55DecisionProgramResumeRequestV1 } from './DecisionPreparation';
import { programFingerprint } from '../../domain/hopDecision/programs';
import { HopV55Explorer, type HopV55Composition, type HopV55ExplorerSelectionOutcome } from './Explorer';
import { readHopV55ContextualComparisonSnapshot } from './contextualExplorationModel';
import './page.css';
import { Input, Textarea } from '../Input';

const Catalogue = lazy(() => import('./Catalogue').then(module => ({ default: module.HopV55Catalogue })));
const ReferencePanel = lazy(() => import('./ReferencePanel').then(module => ({ default: module.HopV55ReferencePanel })));
const NuanceExplorer = lazy(() => import('./NuanceExplorer').then(module => ({ default: module.HopV55NuanceExplorer })));
const RecipeCopyPanel = lazy(() => import('./RecipeCopyPanel').then(module => ({ default: module.HopV55RecipeCopyPanel })));
const RecipeProgramApplicationPanel = lazy(() => import('./RecipeProgramApplicationPanel').then(module => ({ default: module.HopV55RecipeProgramApplicationPanel })));
const PlanningEditor = lazy(() => import('./PlanningEditor').then(module => ({ default: module.HopV55PlanningEditor })));
const HypothesisEditor = lazy(() => import('./HypothesisEditor').then(module => ({ default: module.HopV55HypothesisEditor })));
const BiologicalInputsEditor = lazy(() => import('./BiologicalInputsEditor').then(module => ({ default: module.BiologicalInputsEditor })));
const SensoryComparison = lazy(() => import('./SensoryComparison').then(module => ({ default: module.HopV55SensoryComparison })));
const DecisionResponse = lazy(() => import('./DecisionResponse').then(module => ({ default: module.HopV55DecisionResponse })));
const FutureRecipeDraftPanel = lazy(() => import('./FutureRecipeDraftPanel').then(module => ({ default: module.HopV55FutureRecipeDraftPanel })));
const ObservationWorkbench = lazy(() => import('./ObservationWorkbench').then(module => ({ default: module.HopV55ObservationWorkbench })));
const ObservationExplorer = lazy(() => import('./ObservationExplorer').then(module => ({ default: module.HopV55ObservationExplorer })));
const ObservationSupportPanel = lazy(() => import('./ObservationSupportPanel').then(module => ({ default: module.HopV55ObservationSupportPanel })));
const AssistedAdvicePanel = lazy(() => import('./AssistedAdvicePanel').then(module => ({ default: module.AssistedAdvicePanel })));
const DocumentaryDecision = lazy(() => import('./DocumentaryDecision').then(module => ({ default: module.HopV55DocumentaryDecision })));
const PropertyAdviceDecision = lazy(() => import('./PropertyAdviceDecision').then(module => ({ default: module.HopV55PropertyAdviceDecision })));
const PropertyAdviceDecisionV3 = lazy(() => import('./PropertyAdviceDecisionV3').then(module => ({ default: module.HopV55PropertyAdviceDecisionV3 })));
// SYNTH03 received; UI/workspace verification remains independent of the domain receipt.
const documentarySynthesisEnabled = true;
// CONSEIL01 has a separate reception: archive readers may be available before
// creation, reinterpretation and choices are enabled in the host.
const propertyAdviceEnabled = false;
// V3 investigation is additive; activation follows its own domain receipt.
const propertyAdviceV3Enabled = true;
const propertyAdviceV4Enabled = true;
const PropertyAdviceDecisionV4 = lazy(() => import('./PropertyAdviceDecisionV4').then(module => ({ default: module.HopV55PropertyAdviceDecisionV4 })));
const PropertyAdviceReexaminationPanelV4 = lazy(() => import('./PropertyAdviceReexaminationPanelV4').then(module => ({ default: module.HopV55PropertyAdviceReexaminationPanelV4 })));
const qualifiedProductStudiesEnabled = true;
const qualifiedAdviceStudiesEnabled = true;
const QualifiedStudyPanel = lazy(() => import('./QualifiedStudyPanel').then(module => ({ default: module.HopV55QualifiedStudyPanel })));
const QuestionScopePanel = lazy(() => import('./QuestionScopePanel').then(module => ({ default: module.HopV55QuestionScopePanel })));
const QualifiedAdvicePreparationControls = lazy(() => import('./QualifiedAdvicePreparationControls').then(module => ({ default: module.HopV55QualifiedAdvicePreparationControls })));
const number = (value: number | null | undefined) => value == null || !Number.isFinite(value) ? '?' : value.toLocaleString('fr-CH', { maximumFractionDigits: 15 });
const uid = (prefix: string) => `${prefix}:${crypto.randomUUID()}`;
const iso = () => new Date().toISOString();
const localDateTime = (value: string) => new Date(value).toLocaleString('fr-CH', { timeZone: 'Europe/Zurich', dateStyle: 'short', timeStyle: 'short' });
const assistedAdviceHistoryContract = createHopV55AssistedAdviceBackendContractV1();
const assistedSourceLabels: Record<HopV55DecisionReadingSource['kind'], string> = {
  recipe: 'Recette', batch: 'Brassin', exploration: 'Exploration', localRecipeCopy: 'Copie locale', localFutureDraft: 'Brouillon futur local',
};
const assistedScopeLabels: Record<HopV55AssistedAdviceTicketV1['scope']['kind'], string> = {
  recipe: 'Recette', batch: 'Brassin', draft: 'Brouillon de recette', app: 'Contexte de l’application',
};
function assistedAdviceContextLabel(ticket: HopV55AssistedAdviceTicketV1): string {
  const source = assistedSourceLabels[ticket.source.kind];
  const recipeName = ticket.launchSnapshot.context.recipe?.name;
  return typeof recipeName === 'string' && recipeName.trim() ? `${source} · ${recipeName}` : source;
}
function localDateTimeFromMillis(value: number): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? localDateTime(date.toISOString()) : 'Date du reçu non reconnue';
}
function readAssistedHistoryReceipt(workspace: HopV55Workspace, raw: unknown) {
  const row = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : undefined;
  const ticketReference = typeof row?.ticketReference === 'string' ? row.ticketReference : undefined;
  const ticketRaw = ticketReference ? (workspace.assistedAdviceTickets ?? []).find(value => value && typeof value === 'object'
    && !Array.isArray(value) && 'reference' in value && value.reference === ticketReference) : undefined;
  const ticketRead = ticketRaw ? readHopV55AssistedAdviceTicketV1(ticketRaw) : undefined;
  const archiveRead = ticketRaw ? readHopV55AssistedAdviceArchiveV1({ ticket: ticketRaw, record: raw }, assistedAdviceHistoryContract) : undefined;
  return { ticketRead, archiveRead };
}
function assistedHistoryTicketDetails(ticket: HopV55AssistedAdviceTicketV1) {
  return <dl>
    <div><dt>Portée</dt><dd>{assistedScopeLabels[ticket.scope.kind]} · <code>{ticket.scope.id}</code></dd></div>
    <div><dt>Lecture source</dt><dd><code>{ticket.sourceReadingReference}</code></dd></div>
    <div><dt>Archive source</dt><dd><code>{ticket.archiveReference}</code></dd></div>
    <div><dt>Ticket</dt><dd><code>{ticket.reference}</code></dd></div>
  </dl>;
}
/** Fallback when the wizard host did not state its own reason; the draft is never addressed as a saved Recipe. */
const recipeDraftSemanticUnavailable = 'Le compagnon assisté du brouillon n’est pas raccordé dans cet écran; aucune recette enregistrée ne remplace ce brouillon.';
/**
 * Assisted dossiers of this exact creator draft: a readable durable origin for this owner, workspace and draft.
 * A classic workspace (sourceRecipeId) is never promoted; a future origin stays outside this list.
 */
function wizardDossiersFor(rows: readonly HopV55Workspace[], target: HopV55RecipeDraftTarget | undefined): HopV55Workspace[] {
  if (!target) return [];
  return rows.filter(row => {
    if (row.ownerKey !== target.ownerKey || row.wizardOrigin === undefined) return false;
    const origin = readHopV55WizardWorkspaceOriginV1(row.wizardOrigin);
    return origin.status === 'available' && origin.value.ownerKey === target.ownerKey
      && origin.value.workspaceId === row.id && origin.value.draftId === target.draftId;
  }).sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
}
/**
 * Every assisted dossier of this owner, read outside the creator. Each keeps its own origin: it never becomes the
 * local Recipe/Batch/exploration dossier, and an unreadable or foreign origin stays listed as a raw read-only row.
 */
function wizardDossiersOfOwner(rows: readonly HopV55Workspace[], ownerKey: string): HopV55Workspace[] {
  return rows.filter(row => row.ownerKey === ownerKey && row.wizardOrigin !== undefined)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
}
/** Name of an archived draft version for display only; an absent or empty name stays explicit. */
function archivedDraftName(recipe: unknown): string {
  const name = recipe && typeof recipe === 'object' ? (recipe as { name?: unknown }).name : undefined;
  return typeof name === 'string' && name.trim() ? name : 'brouillon sans nom';
}
type WizardCorrectionInput = PrepareHopV55PropertyAdviceCorrectionV4ForWizardV1Input;
/** Phase of the creator's draft context (recipeStepContext): an archived draft version is prepared again under it. */
const wizardArchivedDraftPhase = 'Brouillon de recette en cours d’écriture';
const wizardTransitionLabels: Record<HopV55PropertyAdviceV4Transition['kind'], string> = {
  create: 'Première version', upgradeV3: 'Reprise', revise: 'Correction', reexamine: 'Réexamen',
};
const wizardTermRoles: Record<string, string> = { reportedObservation: 'constat', measurement: 'mesure', target: 'cible',
  investigation: 'question', preference: 'préférence', constraint: 'garde' };
type HopV55WizardAnswerVersionV1 =
  | { kind: 'readable'; index: number; raw: unknown; record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1 }
  | { kind: 'opaque'; index: number; raw: unknown; label: string; reason: string; sourceReadingReference?: string };
/**
 * Documentary answers of one assisted dossier, read by the strict Wizard V4 reader only. A future, corrupt, classic
 * or foreign-origin row stays raw and read-only: it is never repaired, converted or used to deduce a new answer.
 */
function wizardAnswerVersions(dossier: HopV55Workspace, origin: { ownerKey: string; draftId: string }): HopV55WizardAnswerVersionV1[] {
  return (dossier.documentaryAnswers ?? []).map((raw: unknown, index): HopV55WizardAnswerVersionV1 => {
    const row = raw && typeof raw === 'object' ? raw as { sourceReadingReference?: unknown } : undefined;
    const sourceReadingReference = typeof row?.sourceReadingReference === 'string' ? row.sourceReadingReference : undefined;
    try {
      const read = readHopV55PropertyAdviceAnswerRecordV4ForWizardV1(raw);
      if (read.status !== 'readOnly') return { kind: 'opaque', index, raw, label: 'format futur', sourceReadingReference,
        reason: 'reason' in read && typeof read.reason === 'string' ? read.reason : 'Version conservée sans lecture.' };
      const record = read.record;
      const source = record.preparation.source;
      if (record.ownerKey !== dossier.ownerKey || record.workspaceId !== dossier.id || source.ownerKey !== origin.ownerKey
        || source.workspaceId !== dossier.id || source.draftId !== origin.draftId) {
        return { kind: 'opaque', index, raw, label: 'autre origine', sourceReadingReference,
          reason: 'Cette réponse ne porte pas l’origine de ce brouillon.' };
      }
      return { kind: 'readable', index, raw, record };
    } catch (cause) {
      return { kind: 'opaque', index, raw, label: 'contenu non validé', sourceReadingReference,
        reason: cause instanceof Error ? cause.message : 'Réponse illisible.' };
    }
  });
}
/** Head of one reading's answers. An unreadable row of that reading, or without reading, blocks rather than being skipped. */
function wizardAnswerHead(versions: readonly HopV55WizardAnswerVersionV1[], sourceReadingReference: string):
  { head: Extract<HopV55WizardAnswerVersionV1, { kind: 'readable' }>; blocked?: undefined } | { head?: undefined; blocked: string } {
  if (versions.some(version => version.kind === 'opaque'
    && (version.sourceReadingReference === undefined || version.sourceReadingReference === sourceReadingReference))) {
    return { blocked: 'Une version conservée dans un format non reconnu concerne peut-être cette lecture; aucune correction n’est proposée et rien n’en est déduit.' };
  }
  const head = [...versions].reverse().find((version): version is Extract<HopV55WizardAnswerVersionV1, { kind: 'readable' }> =>
    version.kind === 'readable' && version.record.sourceReadingReference === sourceReadingReference);
  return head ? { head } : { blocked: 'Aucune version lisible de cette réponse n’est conservée dans ce dossier.' };
}
/** A durable Wizard ticket of the same reading: its strict local reread is the authority check of a correction. */
function wizardTicketOperationFor(dossier: HopV55Workspace, sourceReadingReference: string): string | undefined {
  for (const raw of dossier.assistedSemanticAdviceTickets ?? []) {
    const read = readHopV55AssistedAdviceWizardTicketV1(raw);
    if (read.status === 'readOnly' && read.ticket.references.sourceReadingReference === sourceReadingReference) return read.ticket.operationId;
  }
  return undefined;
}
/** Archived draft version read by one Wizard reading: its name and reading instant, never the saved Recipe of the same ID. */
interface HopV55WizardDraftSourceV1 { draftId: string; name?: string; readAt?: string }
function wizardAnswerDraftSource(dossier: HopV55Workspace, sourceReadingReference: string, draftId: string): HopV55WizardDraftSourceV1 {
  try {
    const row = (dossier.decisionReadings ?? []).find(item => item.contentReference === sourceReadingReference);
    const read = row ? readHopV55DecisionReadingArchiveForWizardV1(row) : undefined;
    if (read?.status !== 'available') return { draftId };
    return { draftId, readAt: read.archive.recordedAt,
      name: archivedDraftName(readHopV55WizardSourceSnapshotForArchiveV1({ workspace: dossier, archive: read.archive }).draft) };
  } catch { return { draftId }; }
}
function wizardDraftVersionText(source: Pick<HopV55WizardDraftSourceV1, 'name'>): string {
  return source.name ? `version « ${source.name} »` : 'version du brouillon non relue';
}
/** Display name of the archived draft version read by one Wizard reading; never the saved Recipe of the same ID. */
function wizardAnswerDraftVersion(dossier: HopV55Workspace, sourceReadingReference: string): string {
  return wizardDraftVersionText(wizardAnswerDraftSource(dossier, sourceReadingReference, ''));
}
/**
 * Before/after comparison kept as an aligned table with distinct column headers; page.css has no table rule and
 * stays outside this component's ownership. Data 14 px, headers and metadata 13 px.
 */
const wizardCompareTable: React.CSSProperties = { borderCollapse: 'collapse', width: '100%', margin: '6px 0 8px', fontSize: 14 };
const wizardCompareCaption: React.CSSProperties = { captionSide: 'top', textAlign: 'left', fontSize: 13, color: 'var(--hv-muted)', padding: '0 0 4px' };
const wizardCompareHead: React.CSSProperties = { textAlign: 'left', verticalAlign: 'bottom', fontSize: 13, fontWeight: 700,
  padding: '4px 14px 4px 0', borderBottom: '1px solid var(--hv-line)' };
const wizardCompareRow: React.CSSProperties = { textAlign: 'left', verticalAlign: 'top', fontWeight: 600,
  padding: '5px 14px 5px 0', borderBottom: '1px solid var(--hv-line)' };
const wizardCompareCell: React.CSSProperties = { textAlign: 'left', verticalAlign: 'top', padding: '5px 14px 5px 0',
  borderBottom: '1px solid var(--hv-line)' };
const wizardSummaryTerm: React.CSSProperties = { fontSize: 13, fontWeight: 700, marginTop: 8 };
const wizardSummaryValue: React.CSSProperties = { margin: '2px 0 0' };
interface HopV55WizardAnswerTermV1 { id: string; label: string; role: string; active: boolean; lastActive: HopPropertyAdviceIntentV3 }
/** Current disposition of each source term of one exact ledger; its full history stays in the record. */
function wizardAnswerTerms(record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1): HopV55WizardAnswerTermV1[] {
  const entries = [...record.ledger.entries].reverse();
  return record.ledger.sourceAnnotations.map(annotation => {
    const latest = entries.find(entry => entry.annotationId === annotation.id);
    const lastActive = entries.find(entry => entry.annotationId === annotation.id && entry.activeIntent)?.activeIntent ?? annotation;
    return { id: annotation.id, label: lastActive.label, role: wizardTermRoles[lastActive.role] ?? lastActive.role,
      active: latest?.disposition === 'active', lastActive };
  });
}
function wizardPolicyLabel(policy: HopPropertyAdviceCandidatePolicy): string {
  if (!policy.materialIds.length) return 'aucune matière choisie';
  return `${policy.kind === 'explicit' ? 'matières choisies' : 'matières explorées'} : ${policy.materialIds.join(', ')}`;
}
function wizardOutcomeLabel(record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1): string {
  return record.outcome.kind === 'domainAnswer' ? 'réponse documentaire' : 'tous les termes écartés, sans réponse';
}
/** A sealed correction shown before saving; the save rebuilds it from a fresh frame and must find the same reference. */
interface HopV55WizardCorrectionPreviewV1 {
  workspaceId: string; operationId: string; sourceReadingReference: string; draftId: string;
  parent: HopV55PropertyAdviceAnswerRecordV4ForWizardV1; record: HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
  snapshot: WizardCorrectionInput['snapshot']; scope: { kind: string; id: string }; generation?: number;
  actions: HopV55PropertyAdviceLedgerActionV4[]; reason: string;
  identity: { actId: string; recordId: string; requestId: string; recordedAt: string };
}
/** Same sealing as a fresh semantic reading, under the explicit Wizard source; no classic builder is widened. */
function createHopV55WizardReadingArchive(input: { reading: HopV55SemanticQuestionReadingV1;
  scopeDrafts: readonly HopV55QuestionScopeV1[] | undefined; id: string; ownerKey: string; workspaceId: string;
  recordedAt: string; source: HopV55WizardDecisionReadingArchiveV4['source']; runtimeReference: string }): HopV55WizardDecisionReadingArchiveV4 {
  const question = input.reading.intent.question;
  const scopes = input.scopeDrafts?.length ? (() => {
    const transition = { actId: `question-scope-create:${input.id}`, kind: 'create' as const,
      reason: 'Portées de question proposées par la lecture sémantique, à confirmer.', recordedAt: input.recordedAt,
      actor: { origin: 'proposal' as const, label: 'Lecture locale' } };
    return { transition, scopeLedger: createHopV55QuestionScopeLedgerV1({ question, reading: input.reading,
      scopeDrafts: input.scopeDrafts!, transition }) };
  })() : undefined;
  return createHopV55DecisionReadingArchiveV4ForWizardV1({ id: input.id, ownerKey: input.ownerKey, workspaceId: input.workspaceId,
    recordedAt: input.recordedAt, reading: structuredClone(input.reading), source: structuredClone(input.source),
    runtimeReference: input.runtimeReference, ...(scopes ?? {}) });
}
function semanticHeadText(head: HopV55SemanticAdoptionHeadV1): string {
  return head.kind === 'none' ? 'aucune version antérieure'
    : head.kind === 'recordV3' ? `V3 ${head.reference}` : `V4 ${head.reference} · registre ${head.ledgerReference}`;
}
function readingForArchive(archive: HopV55DecisionReadingArchive): HopV55QuestionReading | HopV55SemanticQuestionReadingV1 {
  return archive.format === 'hop-v55-decision-reading-v4'
    ? structuredClone(archive.reading) : hopV55DecisionReadingForDisplay(archive);
}
const emptyIntent: HopV55Intent = { question: '', criteria: [] };
class PropertyV4PublicationSelectionChanged extends Error {
  constructor() { super('L’affichage a changé pendant cette confirmation. Le reçu reste dans son historique.'); }
}
const statuses = { available: 'Aperçu possible', conditional: 'Sous conditions', unavailable: 'Indisponible dans ce contexte', hypotheticalOnly: 'Hypothèse, sans application à la recette' };
function observationHistoryEntry(value: unknown, index: number) {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const question = row.question && typeof row.question === 'object' ? row.question as Record<string, unknown> : {};
  return { id: typeof row.id === 'string' ? row.id : `archive-${index + 1}`,
    label: typeof question.text === 'string' && question.text.trim() ? question.text : 'Question d’observation conservée',
    role: row.role === 'documentedAdvance' ? 'Avancement documenté' : row.role === 'targetHorizon' ? 'Horizon cible' : 'Rôle non reconnu' };
}

export interface HopV55PageProps {
  services: HopV55Services;
  onClose?(): void;
  onSaveRecipeCopy?(recipe: Recipe): Promise<Recipe>;
  onOpenRecipe?(recipe: Recipe): void;
  onOpenCompanion?(question: string, context: BrewerContext): void;
  onOpenAssistedCompanion?(session: HopV55AssistedCompanionSession): void;
  /**
   * Request3/V6 lane for an exact V4 archive; the legacy V2/V3 launch keeps onOpenAssistedCompanion. With a
   * recipeDraftTarget the Page hands over only Wizard sessions, built on the assisted dossier of that draft.
   */
  onOpenSemanticCompanion?(session: HopV55SemanticCompanionSessionAnyV1): void;
  /** Application host built over these same services (Host or recipe creator); absent means the V4 lane is unavailable. */
  semanticAdoptionHost?: HopV55SemanticAdoptionApplicationHostV1;
  /**
   * Local reader of archived assisted dossiers: strict resume of a durable Wizard ticket and its history. It needs no
   * provider and no live draft; the Page never opens a runtime, a send, a retry or a new adoption through it. Its
   * reread also checks the actor before an explicit correction of an archived Wizard V4 answer.
   */
  semanticHistoryHost?: Pick<HopV55SemanticAdoptionApplicationHostV1, 'resumeWizardSession'>;
  /** Shown in place of a V4 launch when the capability or the source contract is not qualified. */
  semanticAdviceUnavailableReason?: string;
  onConfirmScenario?(result: BrewingScenarioResult): Promise<NonNullable<HopV55Workspace['serverScenarioReceipts']>[number]>;
  observationDefinitions?: BrewingSensoryDefinitionReference[];
  observationSupport?: HopV55ObservationWorkbenchSupport;
  observationTargetChoices?: readonly HopV55ObservationTargetChoice[];
  /** Persistent host alert remains visible there; suppress only the identical local copy. */
  hostWriteError?: string | null;
  /**
   * Recipe wizard host: the selected program is applied explicitly to this open
   * draft (hop lines only) instead of creating a separate Recipe copy.
   */
  recipeDraftTarget?: HopV55RecipeDraftTarget;
  /** Canonical full-draft source reference; used to refresh this mounted Page after Wizard edits. */
  recipeDraftReference?: string | null;
  /** Native recipe host reads this exact workspace again through the canonical repository. */
  onWorkspaceSelected?(workspaceId: string | null): void;
}

function assertLiveRecipeDraftContext(context: BrewerContext, ownerKey: string, draftId: string,
  expectedReference: string | null): void {
  if (!expectedReference) throw Error('La référence canonique du brouillon est invalide; aucun contexte n’est remplacé.');
  if (context.batch || !context.recipe || context.recipe.id !== draftId) {
    throw Error('La relecture ne correspond plus à la recette du brouillon ouvert; aucune autre source n’est substituée.');
  }
  const actual = canonicalizeHopV55RecipeDraft({ ownerKey, draftId, draft: context.recipe }).reference;
  if (actual !== expectedReference) throw Error('Le brouillon a encore changé pendant la relecture; aucune source périmée n’est appliquée.');
}

function HopV55SemanticScopeDisposition({ archive, readOnly, onConfirm }: {
  archive: HopV55DecisionReadingArchiveV4;
  readOnly: boolean;
  onConfirm(input: { commandId: string; sourceReadingReference: string; expectedScopeLedgerReference: string;
    actions: readonly HopV55QuestionScopeDispositionActionV1[]; reason: string }): Promise<HopV55DecisionReadingArchiveV4>;
}) {
  const [drafts, setDrafts] = useState<Record<string, 'retained' | 'excluded'>>({});
  const [relatedDrafts, setRelatedDrafts] = useState<Record<string, string[]>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const command = useRef<{ fingerprint: string; commandId: string } | undefined>(undefined);
  const latest = new Map<string, HopV55QuestionScopeLedgerEntryV1>();
  for (const entry of archive.scopeLedger?.entries ?? []) latest.set(entry.scopeId, entry);
  const sourceScopes = archive.scopeLedger?.sourceScopes ?? [];
  const baselineScope = (scope: HopV55QuestionScopeV1) => {
    const entry = latest.get(scope.id);
    return entry?.status !== 'excluded' && entry?.activeScope ? entry.activeScope : scope;
  };
  const effectiveStatus = (scope: HopV55QuestionScopeV1) => drafts[scope.id] ?? latest.get(scope.id)?.status ?? 'open';
  const effectiveRelatedScopeIds = (scope: HopV55QuestionScopeV1) => relatedDrafts[scope.id] ?? baselineScope(scope).relatedScopeIds;
  const actions: HopV55QuestionScopeDispositionActionV1[] = (archive.scopeLedger?.sourceScopes ?? []).flatMap(scope => {
    const current = latest.get(scope.id);
    const status = effectiveStatus(scope);
    if (status === 'open') return [];
    const base = baselineScope(scope);
    const relatedScopeIds = effectiveRelatedScopeIds(scope);
    const relationChanged = JSON.stringify(relatedScopeIds) !== JSON.stringify(base.relatedScopeIds);
    if (status === current?.status && !relationChanged) return [];
    const activeScope = status === 'retained' ? { ...structuredClone(base), relatedScopeIds: [...relatedScopeIds], origin: 'brasseur' as const } : undefined;
    return [{ scopeId: scope.id, status, ...(activeScope ? { activeScope } : {}), reason: reason.trim() }];
  });
  const activeScopeIds = new Set(sourceScopes.filter(scope => effectiveStatus(scope) !== 'excluded').map(scope => scope.id));
  const invalidLinks = sourceScopes.flatMap(scope => effectiveStatus(scope) === 'excluded' ? []
    : effectiveRelatedScopeIds(scope).filter(scopeId => !activeScopeIds.has(scopeId)).map(scopeId => ({ scopeId, relatedTo: scope.id })));
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setNotice('');
    if (readOnly || !archive.scopeLedger || !reason.trim() || !actions.length || invalidLinks.length || busy) return;
    const input = { sourceReadingReference: archive.contentReference, expectedScopeLedgerReference: archive.scopeLedger.reference,
      actions, reason: reason.trim() };
    const fingerprint = hopDecisionReference(input);
    if (command.current?.fingerprint !== fingerprint) command.current = { fingerprint, commandId: uid('semantic-scope') };
    setBusy(true);
    try {
      const returned = await onConfirm({ ...input, commandId: command.current.commandId });
      if (returned.format !== 'hop-v55-decision-reading-v4' || returned.ownerKey !== archive.ownerKey
        || returned.workspaceId !== archive.workspaceId || returned.transition?.kind !== 'reviseScopes'
        || returned.transition.parentReadingReference !== archive.contentReference) {
        throw Error('La réponse ne correspond pas à une nouvelle lecture V4 avec ses portées révisées.');
      }
      command.current = undefined; setDrafts({}); setRelatedDrafts({}); setReason('');
      setNotice('Dispositions V4 conservées dans une nouvelle archive; la lecture parent reste intacte.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Les dispositions V4 n’ont pas été conservées.');
    } finally { setBusy(false); }
  }
  if (!archive.scopeLedger) return null;
  return <details className="hv-details" data-testid="hop-v55-semantic-scopes">
    <summary>Portées de la question · V4 · {archive.scopeLedger.sourceScopes.length}</summary>
    <p>Les fragments et liens restent ceux de cette archive. Une disposition produit une nouvelle version; elle ne réécrit pas la lecture parent.</p>
    {sourceScopes.length ? <form autoComplete="off" onSubmit={event => void submit(event)}>
      <ul>{sourceScopes.map(scope => {
        const entry = latest.get(scope.id);
        const status = drafts[scope.id] ?? entry?.status ?? 'open';
        const statusLabel = status === 'retained' ? 'Retenue' : status === 'excluded' ? 'Écartée' : 'À examiner';
        return <li key={scope.id}><strong>{scope.kind === 'employmentTiming' ? 'Quand l’employer' : 'Matière citée'}</strong>
          <blockquote>{scope.sourceSpan.text}</blockquote>
          <small>{statusLabel} · {scope.origin === 'proposal' ? 'portée proposée' : 'portée corrigée'}
            {scope.relatedCriterionIds.length ? ` · critères liés : ${scope.relatedCriterionIds.join(', ')}` : ''}
            {scope.relatedOperationIds.length ? ` · opérations liées : ${scope.relatedOperationIds.join(', ')}` : ''}</small>
          {sourceScopes.length > 1 && status !== 'excluded' ? <fieldset>
            <legend>Liens vers d’autres portées</legend>
            {sourceScopes.filter(target => target.id !== scope.id).map(target => <label key={target.id}>
              <input type="checkbox" aria-label={`Relier « ${scope.sourceSpan.text} » à « ${target.sourceSpan.text} »`}
                checked={effectiveRelatedScopeIds(scope).includes(target.id)} disabled={readOnly || busy}
                onChange={event => { const currentIds = effectiveRelatedScopeIds(scope);
                  const nextIds = event.target.checked ? [...new Set([...currentIds, target.id])] : currentIds.filter(id => id !== target.id);
                  setRelatedDrafts(previous => ({ ...previous, [scope.id]: nextIds })); command.current = undefined; setError(''); setNotice(''); }} />
              <span>{target.sourceSpan.text}</span>
            </label>)}
          </fieldset> : null}
          <label><span>Disposition de « {scope.sourceSpan.text} »</span>
            <select aria-label={`Disposition de ${scope.sourceSpan.text}`} value={drafts[scope.id] ?? ''} disabled={readOnly || busy}
              onChange={event => { const value = event.target.value as '' | 'retained' | 'excluded';
                setDrafts(previous => { const next = { ...previous }; if (!value || value === entry?.status) delete next[scope.id]; else next[scope.id] = value; return next; });
                command.current = undefined; setError(''); setNotice(''); }}>
              <option value="">Conserver le statut actuel</option><option value="retained">Retenir cette portée</option><option value="excluded">Écarter cette portée</option>
            </select></label>
        </li>;
      })}</ul>
      {invalidLinks.length ? <p role="status">Un lien vise une portée écartée; corrige les dispositions ou les liens avant de conserver cette version.</p> : null}
      {!readOnly ? <>
        <label><span>Motif des dispositions V4</span><Textarea rows={2} value={reason} disabled={busy} aria-label="Motif des dispositions V4"
          onChange={event => { setReason(event.target.value); command.current = undefined; setError(''); setNotice(''); }} /></label>
        {error ? <p role="alert">{error}</p> : null}{notice ? <p role="status">{notice}</p> : null}
        <button type="submit" disabled={busy || !reason.trim() || !actions.length || !!invalidLinks.length}>{busy ? 'Enregistrement…' : 'Conserver les dispositions V4'}</button>
      </> : <p role="status">Portées archivées en lecture seule.</p>}
    </form> : <p>Aucune portée de question n’est archivée avec cette lecture.</p>}
    <details><summary>Références du ledger</summary><code>{archive.scopeLedger.reference}</code>
      {archive.transition ? <p>{archive.transition.kind} · {archive.transition.reason}</p> : null}</details>
  </details>;
}

/**
 * Explicit correction of one archived Wizard V4 answer: the brewer chooses terms, sees their relations and unlinks
 * explicitly, gives a motive, sees the current and corrected versions side by side, then confirms. Nothing is written
 * before that confirmation, and no relation is removed on the brewer's behalf.
 */
function HopV55WizardAnswerCorrection({ head, source, busy, onPreview, onSave, onCancel }: {
  head: HopV55PropertyAdviceAnswerRecordV4ForWizardV1;
  /** Archived Wizard draft version; its raw identifiers are shown only under « Identités exactes ». */
  source: HopV55WizardDraftSourceV1;
  busy: boolean;
  onPreview(input: { actions: HopV55PropertyAdviceLedgerActionV4[]; reason: string }): Promise<HopV55WizardCorrectionPreviewV1>;
  onSave(preview: HopV55WizardCorrectionPreviewV1): Promise<void>;
  onCancel(): void;
}) {
  const terms = useMemo(() => wizardAnswerTerms(head), [head]);
  const byId = useMemo(() => new Map(terms.map(term => [term.id, term])), [terms]);
  const termIds = useMemo(() => new Set(terms.map(term => term.id)), [terms]);
  const [selected, setSelected] = useState<string[]>([]);
  /** Explicit unlink gestures, owner ID → targets removed from its projection; nothing is applied before the real save. */
  const [unlinks, setUnlinks] = useState<Record<string, string[]>>({});
  const [reason, setReason] = useState('');
  const [preview, setPreview] = useState<HopV55WizardCorrectionPreviewV1>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<HopV55WizardCorrectionErrorV1>();
  const relationsStatus = useRef<HTMLParagraphElement>(null);
  const [refocus, setRefocus] = useState(0);
  useEffect(() => { if (refocus) relationsStatus.current?.focus(); }, [refocus]);
  const after = useMemo(() => preview ? wizardAnswerTerms(preview.record) : undefined, [preview]);
  const linkRows = useMemo(() => after ? wizardLinkRows(terms, after) : [], [terms, after]);
  const draft = wizardCorrectionDraft({ head, terms, selected, unlinks });
  const disabled = busy || pending;
  function edited() { setPreview(undefined); setError(undefined); }
  function choose(id: string, chosen: boolean) {
    setSelected(ids => chosen ? [...new Set([...ids, id])] : ids.filter(row => row !== id)); edited();
  }
  function unlink(ownerId: string, targetId: string, unlinked: boolean) {
    setUnlinks(previous => {
      const rows = (previous[ownerId] ?? []).filter(id => id !== targetId);
      const next = { ...previous, [ownerId]: unlinked ? [...rows, targetId] : rows };
      if (!next[ownerId].length) delete next[ownerId];
      return next;
    });
    edited();
  }
  async function prepare() {
    const motive = reason.trim();
    if (draft.blockingCount) {
      // Readable refusal before any preparation: the ledger keeps every target of an active link active.
      setPreview(undefined); setError({ text: wizardCorrectionBlockedText(draft, byId) }); setRefocus(count => count + 1);
      return;
    }
    setPending(true); setError(undefined); setPreview(undefined);
    try { setPreview(await onPreview({ actions: draft.actions(motive), reason: motive })); }
    catch (cause) { setError(wizardCorrectionError(cause instanceof Error ? cause.message : 'L’aperçu n’a pas pu être préparé; rien n’est enregistré.', byId)); }
    finally { setPending(false); }
  }
  async function save(shown: HopV55WizardCorrectionPreviewV1) {
    setPending(true); setError(undefined);
    try { await onSave(shown); }
    catch (cause) {
      setPreview(undefined);
      setError(wizardCorrectionError(cause instanceof Error ? cause.message : 'La correction n’a pas été enregistrée.', byId));
    } finally { setPending(false); }
  }
  const changed = after?.filter(term => byId.get(term.id)?.active !== term.active || wizardRelinked(byId.get(term.id), term, termIds)).length ?? 0;
  // Readable Wizard source: version name and reading instant; draft ID and hashes stay under « Identités exactes ».
  const draftVersion = <>{wizardDraftVersionText(source)}{source.readAt ? <> lue le <time dateTime={source.readAt}>
    {localDateTime(source.readAt)}</time></> : null}</>;
  return <section className="hv-copy" aria-label="Correction de la réponse du brouillon" data-testid="wizard-answer-correction">
    <h4>Corriger la réponse conservée</h4>
    <p>Version visée : brouillon du créateur de recette, {draftVersion} · {wizardTransitionLabels[head.transition.kind]} du <time dateTime={head.transition.recordedAt}>
      {localDateTime(head.transition.recordedAt)}</time>. La correction s’ajoute comme nouvelle version sous la même origine; celle-ci reste consultable.</p>
    <fieldset disabled={disabled}>
      <legend>Termes de cette version</legend>
      {terms.map(term => {
        const owners = [...new Set(draft.relations.filter(link => link.targetId === term.id).map(link => wizardTermLabel(byId, link.ownerId)))];
        return <label key={term.id}>
          <input type="checkbox" checked={selected.includes(term.id)} aria-label={`${term.active ? 'Écarter' : 'Restaurer'} « ${term.label} »`}
            onChange={event => choose(term.id, event.target.checked)} />
          <span>{term.active ? 'Écarter' : 'Restaurer'} « {term.label} »</span> <small>{term.role} · {term.active ? 'retenu' : 'écarté'}{owners.length
            ? ` · visé par ${owners.join(', ')}` : ''}</small>
        </label>;
      })}
    </fieldset>
    <HopV55WizardCorrectionRelationsV1 terms={byId} draft={draft} disabled={disabled} statusRef={relationsStatus}
      onChoose={(id, chosen) => { choose(id, chosen); setRefocus(count => count + 1); }} onUnlink={unlink} />
    <label className="hv-field"><span>Motif de la correction</span><Textarea rows={2} aria-label="Motif de la correction" value={reason}
      disabled={disabled} onChange={event => { setReason(event.target.value); edited(); }} /></label>
    {error ? <><p role="alert">{error.text}</p>{error.detail ? <details className="hv-details"><summary>Diagnostic exact du refus</summary>
      <code>{error.detail}</code></details> : null}</> : null}
    <div className="hv-actions">
      <button type="button" disabled={disabled || !draft.hasChange || !reason.trim()} onClick={() => void prepare()}>Prévisualiser la correction</button>
      <button type="button" disabled={pending} onClick={onCancel}>Abandonner la correction</button>
    </div>
    {preview && after ? <div role="region" aria-label="Aperçu de la correction" data-testid="wizard-answer-correction-preview">
      <p role="status">Aperçu seulement : rien n’est enregistré tant que tu ne confirmes pas.</p>
      <table style={wizardCompareTable}>
        <caption style={wizardCompareCaption}>Termes avant et après · {changed} modification{changed > 1 ? 's' : ''}</caption>
        <thead><tr><th scope="col" style={wizardCompareHead}>Terme</th><th scope="col" style={wizardCompareHead}>Version actuelle</th>
          <th scope="col" style={wizardCompareHead}>Version corrigée</th></tr></thead>
        <tbody>{after.map(term => {
          const before = byId.get(term.id);
          const modified = before?.active !== term.active;
          const relinked = !modified && wizardRelinked(before, term, termIds);
          return <tr key={term.id}><th scope="row" style={wizardCompareRow}>{term.label}</th>
            <td style={wizardCompareCell}>{before ? before.active ? 'retenu' : 'écarté' : 'absent'}</td>
            <td style={modified || relinked ? { ...wizardCompareCell, fontWeight: 600 } : wizardCompareCell}>{term.active ? 'retenu' : 'écarté'}{modified
              ? ' · modifié' : relinked ? ' · liens modifiés' : ''}</td></tr>;
        })}</tbody>
      </table>
      <HopV55WizardLinkComparisonV1 rows={linkRows} terms={byId} />
      <HopV55WizardEffectComparisonV1 before={terms} after={after} terms={byId} />
      <dl>
        <div><dt style={wizardSummaryTerm}>Version actuelle</dt><dd style={wizardSummaryValue}>{preview.parent.readingContext.interpretation.text} · {wizardOutcomeLabel(preview.parent)}</dd></div>
        <div><dt style={wizardSummaryTerm}>Version corrigée</dt><dd style={wizardSummaryValue}>{preview.record.readingContext.interpretation.text} · {wizardOutcomeLabel(preview.record)}</dd></div>
        <div><dt style={wizardSummaryTerm}>Source</dt><dd style={wizardSummaryValue}>Brouillon du créateur de recette · {draftVersion}. La recette enregistrée du même identifiant n’en est pas la source.</dd></div>
        <div><dt style={wizardSummaryTerm}>Portée</dt><dd style={wizardSummaryValue}>{preview.scope.kind === 'draft'
          ? 'Conversation assistée propre à ce brouillon' : 'Conversation assistée de cette lecture'} · {wizardPolicyLabel(preview.record.readingContext.candidatePolicy)}</dd></div>
        <div><dt style={wizardSummaryTerm}>Motif</dt><dd style={wizardSummaryValue}>{preview.reason}</dd></div>
      </dl>
      <details className="hv-details"><summary>Identités exactes</summary><dl>
        <div><dt>Brouillon d’origine</dt><dd><code>{preview.draftId}</code></dd></div>
        <div><dt>Version du brouillon</dt><dd><code>{preview.snapshot.reference}</code></dd></div>
        <div><dt>Lecture source</dt><dd><code>{preview.sourceReadingReference}</code></dd></div>
        <div><dt>Opération</dt><dd><code>{preview.operationId}</code>{preview.generation !== undefined ? ` · génération ${preview.generation}` : ''}</dd></div>
        <div><dt>Portée de la conversation</dt><dd><code>{preview.scope.kind}</code> · <code>{preview.scope.id}</code></dd></div>
        <div><dt>Périmètre des matières</dt><dd><code>{JSON.stringify(preview.record.readingContext.candidatePolicy)}</code></dd></div>
        <div><dt>Dossier assisté</dt><dd><code>{preview.workspaceId}</code></dd></div>
        <div><dt>Version actuelle</dt><dd><code>{preview.parent.id}</code> · <code>{preview.parent.reference}</code> · {wizardTransitionLabels[preview.parent.transition.kind]} du <time
          dateTime={preview.parent.transition.recordedAt}>{localDateTime(preview.parent.transition.recordedAt)}</time></dd></div>
        <div><dt>Registre actuel</dt><dd><code>{preview.parent.ledger.reference}</code></dd></div>
        <div><dt>Version corrigée</dt><dd><code>{preview.record.id}</code> · <code>{preview.record.reference}</code></dd></div>
        <div><dt>Registre corrigé</dt><dd><code>{preview.record.ledger.reference}</code></dd></div>
        <div><dt>Acte de correction</dt><dd><code>{preview.identity.actId}</code> · <time dateTime={preview.identity.recordedAt}>{localDateTime(preview.identity.recordedAt)}</time></dd></div>
        {linkRows.some(row => row.before !== row.after) ? <div><dt>Liens retirés ou rétablis</dt><dd>{linkRows.filter(row => row.before !== row.after)
          .map(row => <code key={wizardLinkKey(row.link)}>{row.link.ownerId} → {row.link.targetId} </code>)}</dd></div> : null}
      </dl></details>
      <button type="button" className="hv-primary" disabled={disabled} onClick={() => void save(preview)}>Enregistrer cette correction</button>
    </div> : null}
  </section>;
}

export function HopV55Page({ services, onClose, onSaveRecipeCopy, onOpenRecipe, onOpenCompanion, onOpenAssistedCompanion, onConfirmScenario,
  observationDefinitions, observationSupport, observationTargetChoices, hostWriteError, recipeDraftTarget, recipeDraftReference,
  onWorkspaceSelected, onOpenSemanticCompanion, semanticAdoptionHost, semanticHistoryHost, semanticAdviceUnavailableReason }: HopV55PageProps) {
  const [context, setContext] = useState<BrewerContext>();
  /** Read-only view of one archived Wizard answer, rebuilt only from its durable members (no session kept). */
  const [wizardArchiveView, setWizardArchiveView] = useState<{ workspaceId: string; operationId: string; question: string;
    draftId: string; snapshot: { recipe: unknown; reference: string }; scope: { kind: string; id: string };
    candidatePolicy: HopPropertyAdviceCandidatePolicy; record?: HopV55AssistedAdviceWizardRecordV1 }>();
  /** Explicit correction of one archived Wizard V4 answer: the exact head shown and a ticket of its reading. */
  const [wizardCorrection, setWizardCorrection] = useState<{ workspaceId: string; operationId: string;
    sourceReadingReference: string; head: HopV55PropertyAdviceAnswerRecordV4ForWizardV1 }>();
  const [sourceUnavailable, setSourceUnavailable] = useState('');
  const [prepared, setPrepared] = useState<PreparedBrewingScenarioContext>();
  const recipeDraftReferenceRef = useRef(recipeDraftReference); recipeDraftReferenceRef.current = recipeDraftReference;
  const recipeDraftTargetRef = useRef(recipeDraftTarget); recipeDraftTargetRef.current = recipeDraftTarget;
  const observedRecipeDraftReference = useRef(recipeDraftReference);
  const recipeDraftRefreshGeneration = useRef(0);
  const [workspace, setWorkspace] = useState<HopV55Workspace>();
  const workspaceRef = useRef<HopV55Workspace>(undefined);
  workspaceRef.current = workspace;
  useEffect(() => { onWorkspaceSelected?.(workspace?.id ?? null); }, [workspace?.id, onWorkspaceSelected]);
  const [workspaces, setWorkspaces] = useState<HopV55Workspace[]>([]);
  const [records, setRecords] = useState<BrewingScenarioRecordRead[]>([]);
  const [record, setRecord] = useState<BrewingScenarioRecordRead>();
  const [displayedSnapshot, setDisplayedSnapshot] = useState<BrewingScenarioSnapshotV1>();
  const [historicalView, setHistoricalView] = useState(false);
  const [result, setResult] = useState<BrewingScenarioResult>();
  const resultRef = useRef(result); resultRef.current = result;
  const [intent, setIntent] = useState(emptyIntent);
  const [comparisonTarget, setComparisonTarget] = useState<BrewingScenarioRequest['target']>();
  const targetRef = useRef<BrewingScenarioRequest['target']>(undefined); targetRef.current = comparisonTarget;
  const intentRef = useRef(emptyIntent); intentRef.current = intent;
  const [question, setQuestion] = useState('');
  const questionRef = useRef(question); questionRef.current = question;
  const [reading, setReading] = useState<HopV55QuestionReading | HopV55SemanticQuestionReadingV1>();
  const [readingArchive, setReadingArchive] = useState<HopV55DecisionReadingArchive>();
  const readingArchiveRef = useRef<HopV55DecisionReadingArchive>(undefined); readingArchiveRef.current = readingArchive;
  const [readingHistorical, setReadingHistorical] = useState(false);
  const [semanticCorrectionSaving, setSemanticCorrectionSaving] = useState(false);
  const [semanticCorrectionError, setSemanticCorrectionError] = useState('');
  const semanticCorrectionPending = useRef(new Map<string, { fingerprint: string; archive: HopV55DecisionReadingArchiveV4 }>());
  useEffect(() => { setSemanticCorrectionError(''); }, [readingArchive?.contentReference]);
  const [qualifiedPreparationReference, setQualifiedPreparationReference] = useState<string>();
  const [qualifiedEntry, setQualifiedEntry] = useState<HopV55QualifiedStudyEntry>();
  const readingHistoricalRef = useRef(readingHistorical); readingHistoricalRef.current = readingHistorical;
  const [view, setView] = useState<'beer' | 'decide' | 'explore' | 'history'>('beer');
  const [editorOpen, setEditorOpen] = useState(true);
  const [planningOpen, setPlanningOpen] = useState(false);
  const [stylePrefill, setStylePrefill] = useState<HopV55PlanningStylePrefill>();
  const [catalogueOpen, setCatalogueOpen] = useState(false);
  const [exploreVisited, setExploreVisited] = useState(false);
  const [catalogueVisited, setCatalogueVisited] = useState(false);
  useEffect(() => { if (view === 'explore') setExploreVisited(true); if (catalogueOpen) setCatalogueVisited(true); }, [view, catalogueOpen]);
  const [mode, setMode] = useState<'bars' | 'radar'>('bars');
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [axisIds, setAxisIds] = useState<string[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>();
  const [programPreview, setProgramPreview] = useState<HopV55ProgramCopyPreview>();
  const [draftBranch, setDraftBranch] = useState<BrewingScenarioBranchRequest>();
  const [programPrefill, setProgramPrefill] = useState<HopV55ProgramPrefill>();
  // `scope`: dossier of the gesture; the Explorer never lets the request enter another dossier's trial.
  const [selectionRequest, setSelectionRequest] = useState<{ id: string; materialId?: string; materialIds?: string[]; yeastId?: string; terms?: string[]; scope?: string | null }>();
  // Catalogue hand-offs waiting for the Explorer's answer: the notice states what really happened.
  const catalogueSelectionLabels = useRef(new Map<string, string>());
  const referenceAreaRef = useRef<HTMLElement>(null);
  const [activeRecipe, setActiveRecipe] = useState<Recipe>();
  const activeRecipeRef = useRef<Recipe>(undefined); activeRecipeRef.current = activeRecipe;
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const alive = useRef(true);
  const workspaceGeneration = useRef(0);
  const workspaceInit = useRef<{ ownerKey: string; workspaceId?: string; generation: number; promise: Promise<HopV55Workspace> }>(undefined);
  const [error, setError] = useState('');
  const previousHostWriteError = useRef(hostWriteError);
  useEffect(() => {
    const previous = previousHostWriteError.current;
    previousHostWriteError.current = hostWriteError;
    if (previous && !hostWriteError) setError(local => local === previous ? '' : local);
  }, [hostWriteError]);
  const [notice, setNotice] = useState('');
  const [simulations, setSimulations] = useState(0);
  const [pendingPreparationId, setPendingPreparationId] = useState<string>();
  const [referenceComparison, setReferenceComparison] = useState<HopV55ReferenceComparisonDTO>();
  const [comparisonError, setComparisonError] = useState('');
  const [compareArchiveToCurrentReference, setCompareArchiveToCurrentReference] = useState(false);
  const [showReferenceSeries, setShowReferenceSeries] = useState(true);
  const [copyHandoff, setCopyHandoff] = useState<HopV55FullRecipeCopyRecomputePayload>();
  const recomputeReferenceRef = useRef<BrewingReferenceIdentityV1 | null>(null);
  const [activeFutureDraft, setActiveFutureDraft] = useState<HopV55FutureRecipeDraftV1>();
  const activeFutureDraftRef = useRef<HopV55FutureRecipeDraftV1>(undefined);
  activeFutureDraftRef.current = recipeDraftTarget ? undefined : activeFutureDraft;
  const [savedRecipeIds, setSavedRecipeIds] = useState<string[]>([]);
  const [historicalObservationId, setHistoricalObservationId] = useState<string | null>(null);
  const [observationSetupOpen, setObservationSetupOpen] = useState(false);
  const [documentaryRecordId, setDocumentaryRecordId] = useState<string>();
  const [assistedMaterialIds, setAssistedMaterialIds] = useState<string[]>([]);
  const assistedMaterialIdsRef = useRef(assistedMaterialIds); assistedMaterialIdsRef.current = assistedMaterialIds;
  const [semanticHistory, setSemanticHistory] = useState<{ workspaceId: string; commandId: string;
    receipt: HopV55SemanticAdoptionReceiptV1; mode: 'reread' | 'replay' }>();
  useEffect(() => setSemanticHistory(undefined), [workspace?.id]);
  const [assistedHistoryArchive, setAssistedHistoryArchive] = useState<{
    ticket: HopV55AssistedAdviceTicketV1; record: HopV55AssistedAdviceRecordV1;
  }>();
  const [assistedLiveReceipt, setAssistedLiveReceipt] = useState<{
    sessionId: string; ticket: HopV55AssistedAdviceTicketV1; record: HopV55AssistedAdviceRecordV1;
  }>();
  const assistedLiveReceiptRef = useRef(assistedLiveReceipt); assistedLiveReceiptRef.current = assistedLiveReceipt;
  const assistedLaunches = useRef(new Map<string, { launch: HopV55AssistedAdvicePreparedLaunchV1; workspaceId: string;
    recoveredTicket?: HopV55AssistedAdviceTicketV1 }>());
  const assistedConfirmationTransitions = useRef(new Map<string, HopV55PropertyAdviceV4Transition>());
  useEffect(() => { setAssistedMaterialIds([]); setAssistedHistoryArchive(undefined); setAssistedLiveReceipt(undefined); }, [workspace?.id, readingArchive?.contentReference]);
  const propertyV4Pending = useRef(new Map<string, HopV55PropertyAdviceV4Pending>());
  const propertyV4Previews = useRef(new Map<string, HopV55PropertyAdviceReexaminationPreviewV1>());
  const [propertyV4Recovery, setPropertyV4Recovery] = useState<
    | { kind: 'revise'; workspaceId: string; request: HopV55PropertyAdviceV4Command }
    | { kind: 'reexamine'; workspaceId: string; request: HopV55PropertyAdviceV4ReexaminationCommand }
    | { kind: 'confirmReexamination'; workspaceId: string; request: HopV55PropertyAdviceV4ConfirmationCommand }
  >();
  useEffect(() => { setPropertyV4Recovery(undefined); }, [workspace?.id]);
  const advicePending = useRef(new Map<string, HopV55QualifiedStudyPreparationRecord>());
  const [displayedV4Identity, setDisplayedV4Identity] = useState<HopV55PropertyAdviceDisplayedRecordIdentityV4>();
  const displayedV4IdentityRef = useRef<HopV55PropertyAdviceDisplayedRecordIdentityV4 | undefined>(undefined);
  const propertyV4SelectionEpoch = useRef(0);
  function retainDisplayedV4Identity(next?: HopV55PropertyAdviceDisplayedRecordIdentityV4) {
    const previous = displayedV4IdentityRef.current;
    if (previous?.ownerKey === next?.ownerKey && previous?.workspaceId === next?.workspaceId
      && previous?.recordId === next?.recordId && previous?.recordReference === next?.recordReference
      && previous?.sourceReadingReference === next?.sourceReadingReference && previous?.ledgerReference === next?.ledgerReference) return;
    propertyV4SelectionEpoch.current++;
    displayedV4IdentityRef.current = next; setDisplayedV4Identity(next);
  }
  const [historicalV4Reason, setHistoricalV4Reason] = useState('');
  const historicalV4Command = useRef<{ commandId: string; reference: string; reason: string } | undefined>(undefined);
  useEffect(() => { setHistoricalV4Reason(''); historicalV4Command.current = undefined; }, [documentaryRecordId, readingArchive?.contentReference, displayedV4Identity?.recordReference]);
  const scopePending = useRef(new Map<string, { fingerprint: string; archive: import('../../services/hopV55/decisionArchive').HopV55DecisionReadingArchiveV3 }>());
  const semanticScopePending = useRef(new Map<string, { fingerprint: string; archive: HopV55DecisionReadingArchiveV4 }>());
  useEffect(() => setDocumentaryRecordId(undefined), [workspace?.id]);
  useEffect(() => setHistoricalObservationId(null), [workspace?.id]);
  const observationResolution = useMemo(() => workspace ? resolveHopV55ObservationSupport({ workspace }) : undefined, [workspace]);
  const activeObservationSupport: HopV55ObservationWorkbenchSupport | undefined = observationSupport
    ?? (observationResolution?.status === 'ready' ? { ...observationResolution.support,
      stabilityProposals: observationResolution.choices.stabilities, targetChoices: observationTargetChoices }
      : observationResolution?.status === 'needsSetup' ? observationResolution.support : undefined);
  const activeObservationDefinitions = observationDefinitions ?? observationResolution?.choices.observationDefinitions;

  const refreshRecords = useCallback(async () => {
    const [ws, rows] = await Promise.all([services.workspaces.list(services.ownerKey), services.scenarios.list(services.ownerKey)]);
    if (!alive.current) return;
    setWorkspaces(ws); setRecords(rows.filter(row => row.result.status === 'available').map(row => (row.result as { status: 'available'; record: BrewingScenarioRecordRead }).record));
  }, [services]);
  useEffect(() => {
    alive.current = true;
    const generation = ++workspaceGeneration.current;
    workspaceInit.current = undefined;
    let cancelled = false;
    void Promise.all([services.loadContext(), services.workspaces.list(services.ownerKey), services.scenarios.list(services.ownerKey)]).then(async ([ctx, ws, rows]) => {
      if (cancelled || workspaceGeneration.current !== generation) return;
      setContext(ctx); setPrepared(prepareBrewingScenarioContext(ctx)); setWorkspaces(ws);
      targetRef.current = ctx.recipe?.hopAromaTarget; setComparisonTarget(ctx.recipe?.hopAromaTarget);
      setRecords(rows.filter(row => row.result.status === 'available').map(row => (row.result as { status: 'available'; record: BrewingScenarioRecordRead }).record));
      // Assisted Wizard dossiers keep their own origin; they are never reopened as the local workshop dossier.
      const matching = [...ws].reverse().find(row => row.wizardOrigin === undefined && (ctx.batch?.id ? row.sourceBatchId === ctx.batch.id
        : ctx.recipe?.id ? !row.sourceBatchId && row.sourceRecipeId === ctx.recipe.id : !row.sourceRecipeId && !row.sourceBatchId));
      if (matching && !cancelled && workspaceGeneration.current === generation) {
        workspaceRef.current = matching; setWorkspace(matching); intentRef.current = matching.intent; setIntent(matching.intent); setQuestion(matching.intent.question); restoreReading(matching);
        const copy = activeWorkspaceCopy(matching);
        activeRecipeRef.current = copy?.recipe; setActiveRecipe(copy?.recipe);
        const draftSource = activeWorkspaceFutureDraftSource(matching);
        const draft = draftSource ? await services.loadFutureDraft(draftSource) : undefined;
        if (cancelled || workspaceGeneration.current !== generation) return;
        activeFutureDraftRef.current = draft; setActiveFutureDraft(draft);
        try {
          const restored = await loadExactContext();
          if (!cancelled && workspaceGeneration.current === generation) { setContext(restored); setPrepared(prepareBrewingScenarioContext(restored)); }
        } catch (err) { if (!cancelled && workspaceGeneration.current === generation) setSourceUnavailable((err as Error).message); }
      }
    }).catch(err => { if (!cancelled && workspaceGeneration.current === generation) setError((err as Error).message); });
    return () => { cancelled = true; alive.current = false; };
  }, [services, recipeDraftTarget?.ownerKey, recipeDraftTarget?.draftId]);

  useEffect(() => {
    const previousReference = observedRecipeDraftReference.current;
    observedRecipeDraftReference.current = recipeDraftReference;
    if (!recipeDraftTarget || recipeDraftReference === undefined || previousReference === recipeDraftReference) return;

    const generation = ++recipeDraftRefreshGeneration.current;
    const { ownerKey, draftId } = recipeDraftTarget;
    let cancelled = false;
    const isCurrent = () => !cancelled && generation === recipeDraftRefreshGeneration.current
      && services.ownerKey === ownerKey && recipeDraftTargetRef.current?.ownerKey === ownerKey
      && recipeDraftTargetRef.current?.draftId === draftId && recipeDraftReferenceRef.current === recipeDraftReference;

    setSourceUnavailable('Le brouillon a changé; relecture du contexte exact en cours.');
    if (readingArchiveRef.current) { readingHistoricalRef.current = true; setReadingHistorical(true); }
    if (resultRef.current) setHistoricalView(true);

    void services.loadContext().then(nextContext => {
      if (!isCurrent()) return;
      assertLiveRecipeDraftContext(nextContext, ownerKey, draftId, recipeDraftReference);
      const nextPrepared = prepareBrewingScenarioContext(nextContext);
      if (!isCurrent()) return;

      const previousTarget = context?.recipe?.hopAromaTarget;
      const targetStillFollowsRecipe = hopDecisionReference(targetRef.current ?? null) === hopDecisionReference(previousTarget ?? null);
      setContext(nextContext); setPrepared(nextPrepared);
      if (targetStillFollowsRecipe) {
        const nextTarget = nextContext.recipe?.hopAromaTarget;
        targetRef.current = nextTarget; setComparisonTarget(nextTarget);
      }
      setSourceUnavailable('');
    }).catch(error => {
      if (isCurrent()) setSourceUnavailable((error as Error).message || 'Le nouveau contexte du brouillon est indisponible.');
    });

    return () => { cancelled = true; };
  }, [services, recipeDraftTarget?.ownerKey, recipeDraftTarget?.draftId, recipeDraftReference]);

  async function run(action: () => Promise<void>, propagate = false, reportError = true) {
    if (busyRef.current) {
      if (propagate) throw Error('Une action est déjà en cours. La saisie reste conservée.');
      return;
    }
    busyRef.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (err) {
      if (alive.current && reportError && !(err instanceof PropertyV4PublicationSelectionChanged)) setError((err as Error).message || 'Le changement n’a pas pu être conservé. La saisie reste disponible.');
      if (propagate) throw err;
    }
    finally { busyRef.current = false; if (alive.current) setBusy(false); }
  }
  async function saveWorkspace(update: Partial<HopV55Workspace> = {}) {
    const current = workspaceRef.current;
    const generation = workspaceGeneration.current;
    const next: HopV55Workspace = current ? { ...current, ...update, updatedAt: iso() } : {
      format: 'hop-v55-workspace-v1', id: uid('workspace'), ownerKey: services.ownerKey, revision: 0,
      title: context?.recipe?.name ?? 'Exploration sans recette', intent: intentRef.current, sourceRecipeId: context?.recipe?.id,
      sourceBatchId: context?.batch?.id, scenarioIds: [], referenceHypotheses: [], copies: [], updatedAt: iso(), ...update,
    };
    const saved = await services.workspaces.save(next, current?.revision ?? null);
    assertWorkspaceScope(generation, current?.id);
    if (alive.current) { workspaceRef.current = saved; setWorkspace(saved);
      setWorkspaces(previous => [...previous.filter(row => row.id !== saved.id), saved]); }
    return saved;
  }
  /** Workspace selections are archives while the host owns an open recipe draft. */
  function activeWorkspaceCopy(currentWorkspace: HopV55Workspace) {
    return recipeDraftTarget ? undefined : currentWorkspace.copies.find(row => row.id === currentWorkspace.activeCopyId);
  }
  function activeWorkspaceFutureDraftSource(currentWorkspace: HopV55Workspace) {
    return recipeDraftTarget ? undefined : currentWorkspace.activeFutureDraftSource;
  }
  function activeWorkspaceProgramCopy(currentWorkspace: HopV55Workspace) {
    return recipeDraftTarget ? undefined : currentWorkspace.programCopies?.find(copy => copy.id === currentWorkspace.activeProgramCopyId);
  }
  function workspaceSource(currentWorkspace: HopV55Workspace): HopV55ContextSource {
    const activeFutureDraftSource = activeWorkspaceFutureDraftSource(currentWorkspace);
    if (activeFutureDraftSource) return activeFutureDraftSource;
    const copy = activeWorkspaceCopy(currentWorkspace);
    if (copy) return { kind: 'localRecipeCopy', workspaceId: currentWorkspace.id, copyId: copy.id, recipeId: copy.recipe.id,
      recipeReference: hopDecisionReference(copy.recipe) };
    return currentWorkspace.sourceBatchId
      ? { kind: 'batch', batchId: currentWorkspace.sourceBatchId }
      : currentWorkspace.sourceRecipeId ? { kind: 'recipe', recipeId: currentWorkspace.sourceRecipeId } : { kind: 'exploration' };
  }
  function trialSourceReference(ctx: BrewerContext, currentWorkspace: HopV55Workspace, source: HopV55ContextSource): string | null {
    if (source.kind === 'recipe') return ctx.recipe?.id === source.recipeId ? hopDecisionReference(ctx.recipe) : null;
    if (source.kind === 'batch') {
      const batch = ctx.batch;
      const journal = ctx.journal ?? batch?.brewDay;
      if (!batch || batch.id !== source.batchId || !batch.recipeSnapshot || !journal) return null;
      return hopDecisionReference({ batchId: batch.id, recipeSnapshot: batch.recipeSnapshot, journal });
    }
    if (source.kind === 'localRecipeCopy') return source.recipeReference;
    if (source.kind === 'localFutureDraft') return source.contentReference;
    return null;
  }
  /**
   * Same contract as prepareHopV55AdoptedContext for a `prep` already produced by
   * prepareBrewingScenarioContext(ctx) from the same exact read: the NR journal is
   * still resolved here, only the identical engine reconstruction is not repeated.
   */
  function adoptedContextForPrepared(prep: PreparedBrewingScenarioContext, currentWorkspace: HopV55Workspace,
    expected: BrewingReferenceIdentityV1 | null): HopV55AdoptedContextPreparationV1 {
    const resolution = resolveHopV55AdoptedContext({ workspace: currentWorkspace, expected });
    if (resolution.status !== 'resolved') return { sourcePrepared: prep, resolution };
    return { sourcePrepared: prep, resolution, cultureBinding: resolution.binding,
      comparisonBaseline: structuredClone(resolution.binding.baseline) };
  }
  /** Origin frame and NR binding from a single resolution of this workspace read. */
  function explorationTrialOrigin(ctx: BrewerContext, prep: PreparedBrewingScenarioContext,
    currentWorkspace: HopV55Workspace, currentProgram: HopDecisionProgram | undefined, preparedRuntimeReference?: string):
    { originContext: HopV55ExplorationTrialOriginContextV1; cultureBinding: HopV55AdoptedContextBindingV1 | null } | undefined {
    if (!currentProgram) return undefined;
    try {
      const source = workspaceSource(currentWorkspace);
      const sourceReference = trialSourceReference(ctx, currentWorkspace, source);
      // The physical source is `prep`; its former re-preparation from `ctx` was discarded here.
      const resolution = resolveHopV55AdoptedContext({ workspace: currentWorkspace,
        expected: getHopV55ReferenceProjection(currentWorkspace)?.currentReference ?? null });
      if (resolution.status !== 'absent' && resolution.status !== 'resolved') return undefined;
      const cultureBinding = resolution.status === 'resolved' ? resolution.binding : null;
      const activeCopy = activeWorkspaceProgramCopy(currentWorkspace);
      const activeDraft = activeFutureDraftRef.current;
      let programOrigin: HopV55ExplorationTrialProgramOriginV1;
      if (activeDraft && source.kind === 'localFutureDraft' && activeDraft.draftId === source.draftId
        && activeDraft.revision === source.revision && activeDraft.contentReference === source.contentReference) {
        programOrigin = { kind: 'futureDraft', draftId: activeDraft.draftId, revision: activeDraft.revision,
          reference: activeDraft.contentReference };
      } else if (activeCopy && activeCopy.id === currentWorkspace.activeProgramCopyId) {
        programOrigin = { kind: 'programCopy', id: activeCopy.id, reference: activeCopy.previewReference };
      } else if (!prep.runtime.current?.program && cultureBinding) {
        programOrigin = { kind: 'adoptedReference', identity: structuredClone(cultureBinding.reference) };
      } else if (sourceReference) {
        programOrigin = { kind: 'physicalSource', reference: sourceReference };
      } else return undefined;
      const archive = readingArchiveRef.current;
      const activeArchive = archive && !readingHistoricalRef.current && archive.reading.intent.question === intentRef.current.question
        ? archive : null;
      return { cultureBinding, originContext: createHopV55ExplorationTrialOriginContextV1({ ownerKey: services.ownerKey,
        workspaceId: currentWorkspace.id, source, sourceReference,
        runtimeReference: preparedRuntimeReference ?? runtimeReference(prep),
        cultureBindingReference: cultureBinding?.bindingReference ?? null,
        readingReference: activeArchive?.contentReference ?? null, programOrigin,
        programReference: programFingerprint(currentProgram) }) };
    } catch { return undefined; }
  }
  function makeExplorationTrialOriginContext(ctx: BrewerContext, prep: PreparedBrewingScenarioContext,
    currentWorkspace: HopV55Workspace, currentProgram?: HopDecisionProgram): HopV55ExplorationTrialOriginContextV1 | undefined {
    return explorationTrialOrigin(ctx, prep, currentWorkspace, currentProgram)?.originContext;
  }
  function decisionSource(ws: HopV55Workspace): HopV55DecisionReadingSource {
    const source = workspaceSource(ws);
    return source.kind === 'recipe' ? { kind: 'recipe', id: source.recipeId } : source.kind === 'batch' ? { kind: 'batch', id: source.batchId } : source;
  }
  function restoreReading(ws: HopV55Workspace, reference?: string, historical = true, exactSnapshotLink = false) {
    retainDisplayedV4Identity(undefined);
    setDocumentaryRecordId(undefined);
    setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined);
    const row = reference ? ws.decisionReadings?.find(item => item.contentReference === reference)
      : exactSnapshotLink ? undefined : [...(ws.decisionReadings ?? [])].reverse().find(item => item.reading.intent.question === ws.intent.question);
    const read = row && readHopV55DecisionReadingArchive(row);
    const archive = read?.status === 'available' ? read.archive : undefined;
    readingArchiveRef.current = archive; setReadingArchive(archive); setReading(archive ? readingForArchive(archive) : undefined); setReadingHistorical(historical);
  }
  async function loadExactContext() {
    // In recipe-wizard mode the host's open draft is the live source. Cached
    // V5.5 copy/draft selections remain archives and never become that input.
    if (recipeDraftTarget) return services.loadContext();
    const currentWorkspace = workspaceRef.current;
    const source = currentWorkspace ? workspaceSource(currentWorkspace) : undefined;
    return services.loadContext(activeRecipeRef.current, source);
  }
  async function readExactCurrentContext(): Promise<BrewerContext> {
    const generation = workspaceGeneration.current;
    const draftRefreshGeneration = recipeDraftRefreshGeneration.current;
    const draftReference = recipeDraftReferenceRef.current;
    const draftOwnerKey = recipeDraftTargetRef.current?.ownerKey;
    const draftId = recipeDraftTargetRef.current?.draftId;
    const workspaceId = workspaceRef.current?.id;
    let ctx: BrewerContext;
    try {
      const ws = workspaceRef.current;
      if (ws) {
        const copy = activeWorkspaceCopy(ws);
        const draftSource = activeWorkspaceFutureDraftSource(ws);
        const draft = draftSource ? await services.loadFutureDraft(draftSource) : undefined;
        assertWorkspaceScope(generation, workspaceId);
        activeRecipeRef.current = copy?.recipe; activeFutureDraftRef.current = draft;
        if (alive.current) { setActiveRecipe(copy?.recipe); setActiveFutureDraft(draft); }
      }
      ctx = await loadExactContext();
      assertWorkspaceScope(generation, workspaceId);
      if (draftOwnerKey && draftId && draftReference !== undefined) {
        if (draftRefreshGeneration !== recipeDraftRefreshGeneration.current
          || draftReference !== recipeDraftReferenceRef.current
          || recipeDraftTargetRef.current?.ownerKey !== draftOwnerKey || recipeDraftTargetRef.current?.draftId !== draftId) {
          throw Error('Le brouillon a changé pendant la relecture; relis sa source avant de continuer.');
        }
        assertLiveRecipeDraftContext(ctx, draftOwnerKey, draftId, draftReference);
      }
    }
    catch (err) { if (workspaceGeneration.current === generation) setSourceUnavailable((err as Error).message); throw err; }
    setSourceUnavailable('');
    return ctx;
  }
  async function currentContext() {
    const ctx = await readExactCurrentContext();
    if (alive.current) { setContext(ctx); setPrepared(prepareBrewingScenarioContext(ctx)); }
    return ctx;
  }
  /**
   * One fresh exact read and its single preparation, shared with the screen.
   * Never cached: a frame proves nothing after an await; callers read a new one.
   */
  async function currentContextFrame(): Promise<{ ctx: BrewerContext; prep: PreparedBrewingScenarioContext }> {
    const ctx = await readExactCurrentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    if (alive.current) { setContext(ctx); setPrepared(prep); }
    return { ctx, prep };
  }
  async function saveFullWorkspace(next: HopV55Workspace): Promise<HopV55Workspace> {
    if (next.ownerKey !== services.ownerKey) throw Error('Le dossier ne correspond pas au profil local courant.');
    const generation = workspaceGeneration.current;
    assertWorkspaceScope(generation, next.id);
    const saved = await services.workspaces.save(next, next.revision);
    assertWorkspaceScope(generation, next.id);
    if (alive.current) { workspaceRef.current = saved; setWorkspace(saved);
      setWorkspaces(previous => [...previous.filter(row => row.id !== saved.id), saved]); }
    return saved;
  }
  async function persistExplorationProfile(profile: HopV55ExplorationProfileV1): Promise<void> {
    const generation = workspaceGeneration.current;
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const initial = await getReferenceWorkspace(ctx, prep);
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = attempt === 0 ? initial : await services.workspaces.read(services.ownerKey, initial.id);
      if (!latest || latest.id !== initial.id || latest.ownerKey !== services.ownerKey) {
        throw Error('Le dossier du profil a changé. La déclaration exacte reste disponible pour réessayer.');
      }
      assertWorkspaceScope(generation, initial.id);
      const before = latest.explorationProfiles ?? [];
      const after = appendHopV55ExplorationProfileRecord(before, profile);
      if (after.length === before.length) {
        if (alive.current && workspaceRef.current?.id === latest.id) { workspaceRef.current = latest; setWorkspace(latest); }
        return;
      }
      try {
        const saved = await services.workspaces.save({ ...latest, explorationProfiles: after, updatedAt: iso() }, latest.revision);
        assertWorkspaceScope(generation, initial.id);
        if (alive.current && workspaceRef.current?.id === saved.id) { workspaceRef.current = saved; setWorkspace(saved); }
        setWorkspaces(rows => [...rows.filter(row => row.id !== saved.id), saved]);
        return;
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('La déclaration V1 du profil attend une reprise avec le même contenu.');
  }
  function assertWorkspaceScope(generation: number, workspaceId?: string) {
    if (!alive.current || workspaceGeneration.current !== generation
      || (workspaceId !== undefined && workspaceRef.current?.id !== workspaceId)) {
      throw Error('Le dossier actif a changé pendant cette lecture. Relis le dossier courant avant de reprendre la commande.');
    }
  }
  async function getReferenceWorkspace(ctx = context, prep = prepared): Promise<HopV55Workspace> {
    if (!ctx || !prep) throw Error('Le contexte doit être chargé avant de conserver le dossier.');
    const known = workspaceRef.current;
    const generation = workspaceGeneration.current;
    const pending = workspaceInit.current;
    if (pending?.ownerKey === services.ownerKey && pending.workspaceId === known?.id && pending.generation === generation) return pending.promise;
    const work = async () => {
      const current = known ? await services.workspaces.read(services.ownerKey, known.id) : await saveWorkspace();
      assertWorkspaceScope(generation, known?.id);
      if (!current) throw Error('Le dossier exact n’est plus disponible. La saisie reste conservée; aucun autre dossier ne sera substitué.');
      if (alive.current) { workspaceRef.current = current; setWorkspace(current); }
      if (known && hopDecisionReference(workspaceSource(known)) !== hopDecisionReference(workspaceSource(current))) {
        await currentContext(); assertWorkspaceScope(generation, current.id);
        setHistoricalView(true); setReadingHistorical(true); setProgramPreview(undefined);
        throw Error('La source active du dossier a changé dans une autre vue. Relis la source retrouvée avant de reprendre cette action; les anciennes lectures restent conservées.');
      }
      const withJournal = ensureHopV55ReferenceJournal(current, ctx, prep);
      if (withJournal.referenceJournal?.record.reference === current.referenceJournal?.record.reference) return current;
      return saveFullWorkspace(withJournal);
    };
    const pendingRead = { ownerKey: services.ownerKey, workspaceId: known?.id, generation, promise: work() };
    workspaceInit.current = pendingRead;
    try { return await pendingRead.promise; } finally { if (workspaceInit.current === pendingRead) workspaceInit.current = undefined; }
  }
  function assistedAdviceBaseRecord(ws: HopV55Workspace, archive: HopV55DecisionReadingArchive): unknown | undefined {
    const matching = (ws.documentaryAnswers ?? []).filter(raw => (raw as { sourceReadingReference?: string }).sourceReadingReference === archive.contentReference);
    const selected = documentaryRecordId ? matching.find(raw => (raw as { id?: string }).id === documentaryRecordId) : undefined;
    for (const raw of selected ? [selected, ...matching.filter(row => row !== selected).reverse()] : matching.slice().reverse()) {
      const read = readHopV55DocumentaryAnswerRecord(raw);
      if (read.status === 'readOnly' && (read.record.format === 'hop-v55-documentary-answer-record-v3'
        || read.record.format === 'hop-v55-documentary-answer-record-v4')) return read.record;
    }
    return undefined;
  }
  function assertAssistedTicketMatchesLaunch(ticket: HopV55AssistedAdviceTicketV1,
    launch: HopV55AssistedAdvicePreparedLaunchV1, operationId: string) {
    if (ticket.operationId !== operationId || ticket.ownerKey !== launch.ownerKey || ticket.workspaceId !== launch.workspaceId
      || ticket.sourceReadingReference !== launch.sourceReadingReference
      || hopDecisionReference(ticket.request) !== hopDecisionReference(launch.request)
      || hopDecisionReference(ticket.candidatePolicy) !== hopDecisionReference(launch.candidatePolicy)
      || hopDecisionReference(ticket.adviceBase ?? null) !== hopDecisionReference(launch.adviceBase ?? null)) {
      throw Error('Cette opération possède déjà un ticket différent. La capture d’origine reste intacte.');
    }
  }
  async function freshAssistedCurrent(launch: HopV55AssistedAdvicePreparedLaunchV1) {
    const activeWorkspace = workspaceRef.current;
    const activeArchive = readingArchiveRef.current;
    if (!activeWorkspace || activeWorkspace.id !== launch.workspaceId
      || activeArchive?.contentReference !== launch.sourceReadingReference
      || questionRef.current !== launch.request.question) {
      throw Error('La question, la lecture ou le dossier a changé depuis l’ouverture du compagnon. Relis explicitement la demande.');
    }
    const ctx = await currentContext();
    if (workspaceRef.current?.id !== launch.workspaceId
      || readingArchiveRef.current?.contentReference !== launch.sourceReadingReference
      || questionRef.current !== launch.request.question) {
      throw Error('La lecture ou le dossier a changé pendant la vérification locale. Aucun envoi assisté n’a été lancé.');
    }
    const currentWorkspace = await services.assistedAdvice.readWorkspace(launch.workspaceId);
    if (!currentWorkspace || workspaceRef.current?.id !== launch.workspaceId
      || readingArchiveRef.current?.contentReference !== launch.sourceReadingReference) {
      throw Error('Le dossier local exact a changé ou n’est plus disponible. Le ticket reste conservé sans envoi.');
    }
    const stored = currentWorkspace.decisionReadings?.find(row => row.contentReference === launch.sourceReadingReference);
    const read = stored && readHopV55DecisionReadingArchive(stored);
    if (!read || read.status !== 'available') throw Error('L’archive exacte de la question n’est plus disponible dans le dossier courant.');
    const source = decisionSource(currentWorkspace);
    const scopeAtPageLaunch = mapBrewerHopAdviceLaunchSourceToScopeV1(services.ownerKey, currentWorkspace.id, source);
    return { archive: read.archive, workspace: currentWorkspace, ownerKey: services.ownerKey,
      workspaceId: currentWorkspace.id, scopeAtPageLaunch, context: ctx };
  }
  async function openAssistedCompanion() {
    const archive = readingArchiveRef.current;
    const currentWorkspace = workspaceRef.current;
    const currentQuestion = questionRef.current;
    if (!onOpenAssistedCompanion) throw Error('Le compagnon assisté n’est pas disponible dans cet hôte.');
    if (!archive || !currentWorkspace || (archive.format !== 'hop-v55-decision-reading-v2'
      && archive.format !== 'hop-v55-decision-reading-v3')) throw Error('Une lecture V2/V3 conservée est nécessaire avant d’ouvrir le compagnon.');
    if (!['exploreStrategies', 'understandProducts'].includes(archive.reading.response.actionKind)) {
      throw Error('Cette lecture ne contient pas de demande assistée de houblon prise en charge.');
    }
    if (currentQuestion !== archive.reading.intent.question) throw Error('Relis la question après toute modification avant d’ouvrir le compagnon.');
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const ws = await getReferenceWorkspace(ctx, prep);
    if (readingArchiveRef.current?.contentReference !== archive.contentReference || questionRef.current !== archive.reading.intent.question) {
      throw Error('La lecture affichée a changé pendant la préparation du compagnon.');
    }
    const parent = assistedAdviceBaseRecord(ws, archive);
    const candidatePolicy = parent ? undefined : {
      kind: 'explicit' as const,
      materialIds: [...new Set(assistedMaterialIds)],
      basis: assistedMaterialIds.length ? 'Matières choisies explicitement par le brasseur dans le contexte chargé.'
        : 'Aucune matière choisie explicitement.',
    };
    const preparedLaunch = prepareHopV55AssistedAdviceLaunchV1({ archive, workspace: ws, ownerKey: services.ownerKey,
      workspaceId: ws.id, context: ctx, candidatePolicy, adviceBaseRecord: parent });
    if (preparedLaunch.status !== 'ready') throw Error(preparedLaunch.status === 'unsupportedReadOnly'
      ? `Format futur conservé sans conversion : ${preparedLaunch.reason}` : preparedLaunch.reason);
    const sessionId = uid('assisted-session');
    const launch = preparedLaunch.launch;
    assistedLaunches.current.set(sessionId, { launch, workspaceId: ws.id });
    const session: HopV55AssistedCompanionSession = {
      id: sessionId, request: launch.request, context: structuredClone(launch.launchSnapshot.context),
      label: `Aide houblon · ${archive.reading.intent.question}`,
      onBeforeSend: input => beforeAssistedSend(sessionId, input),
      onAssistedTurn: value => receiveAssistedTurn(sessionId, value),
    };
    onOpenAssistedCompanion(session);
  }
  async function beforeAssistedSend(sessionId: string, input: BrewerChatInput): Promise<void> {
    const savedLaunch = assistedLaunches.current.get(sessionId);
    if (!savedLaunch) throw Error('Cette session assistée n’est plus disponible. Rouvre la lecture exacte.');
    const { launch, workspaceId } = savedLaunch;
    if (questionRef.current !== launch.request.question) throw Error('Le texte de la question a changé. Relis-le avant l’envoi assisté.');
    if (input.question !== launch.request.question || input.operationId.trim() === '') {
      throw Error('La question ou l’identité de l’opération diffère du lancement conservé.');
    }
    let candidate: HopV55AssistedAdviceTicketV1 | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      const found = await services.assistedAdvice.readTicketByOperationId(workspaceId, input.operationId);
      if (found.status === 'unsupportedReadOnly') throw Error(`Ticket futur conservé sans conversion : ${found.reason}`);
      if (found.status === 'invalid') throw Error(found.reason);
      if (found.status === 'available') candidate = found.value;
      else if (!candidate) {
        const captured = captureHopV55AssistedAdviceTicketV1({ id: uid('assisted-ticket'), operationId: input.operationId,
          createdAt: iso(), launch });
        if (captured.status !== 'ready') throw Error(captured.status === 'unsupportedReadOnly' ? captured.reason : captured.reason);
        candidate = captured.ticket;
      }
      assertAssistedTicketMatchesLaunch(candidate, launch, input.operationId);
      if (savedLaunch.recoveredTicket && candidate.reference !== savedLaunch.recoveredTicket.reference) {
        throw Error('Le retry a remplacé le ticket archivé. La capture A originale reste la seule identité recevable.');
      }
      if (!hopV55AssistedAdviceTicketMatchesInput(candidate, input)) {
        throw Error('L’input du compagnon ne porte pas exactement le ticket et sa requête archivés.');
      }
      const current = await freshAssistedCurrent(launch);
      const checked = beforeSubmitHopV55AssistedAdvice({ ticket: candidate, current, input });
      if (checked.status !== 'ready') throw Error(checked.reason);
      if (found.status === 'available') return;
      try {
        const appended = await services.assistedAdvice.appendTicket(workspaceId, candidate, found.revision);
        if (workspaceRef.current?.id === workspaceId
          && readingArchiveRef.current?.contentReference === launch.sourceReadingReference) {
          workspaceRef.current = appended.workspace; setWorkspace(appended.workspace);
          setWorkspaces(rows => [...rows.filter(row => row.id !== appended.workspace.id), appended.workspace]);
        }
        return;
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('Le ticket assisté attend une nouvelle vérification CAS. Aucun envoi n’a été lancé.');
  }
  async function currentAssistedReceptionInput(ticket: HopV55AssistedAdviceTicketV1) {
    let ctx: BrewerContext | undefined;
    try { ctx = await currentContext(); } catch { /* The invalid/missing archive below records applicability as stale. */ }
    const activeWorkspace = workspaceRef.current;
    const currentWorkspace = activeWorkspace
      ? await services.assistedAdvice.readWorkspace(activeWorkspace.id).catch(() => null)
      : null;
    const ws = currentWorkspace ?? ticket.launchSnapshot.workspace as HopV55Workspace;
    const currentArchive = readingArchiveRef.current;
    const stored = currentArchive && ws.decisionReadings?.find(row => row.contentReference === currentArchive.contentReference);
    const parsed = stored && readHopV55DecisionReadingArchive(stored);
    const archive = parsed?.status === 'available' ? parsed.archive : undefined;
    const scopeAtPageLaunch = archive && currentWorkspace
      ? mapBrewerHopAdviceLaunchSourceToScopeV1(services.ownerKey, currentWorkspace.id, decisionSource(currentWorkspace))
      : ticket.scope;
    return { archive, workspace: ws, ownerKey: ws.ownerKey, workspaceId: ws.id, scopeAtPageLaunch,
      context: ctx ?? ticket.launchSnapshot.context };
  }
  async function receiveAssistedTurn(sessionId: string, value: HopV55AssistedCompanionTurn): Promise<void> {
    const savedLaunch = assistedLaunches.current.get(sessionId);
    if (!savedLaunch) throw Error('La session d’origine de cette réponse assistée est introuvable.');
    const { launch, workspaceId } = savedLaunch;
    const prior = await services.assistedAdvice.readRecordByOperationId(workspaceId, value.input.operationId);
    if (prior.status === 'unsupportedReadOnly') throw Error(`Réponse future conservée sans conversion : ${prior.reason}`);
    if (prior.status === 'invalid') throw Error(prior.reason);
    const storedTicket = await services.assistedAdvice.readTicketByOperationId(workspaceId, value.input.operationId);
    if (storedTicket.status !== 'available') throw Error(storedTicket.status === 'absent'
      ? 'Le ticket local n’a pas été conservé avant le transport; la réponse reste sans rattachement.' : storedTicket.status === 'invalid'
        ? storedTicket.reason : storedTicket.reason);
    const ticket = storedTicket.value;
    assertAssistedTicketMatchesLaunch(ticket, launch, value.input.operationId);
    if (prior.status === 'available') {
      if (prior.value.ticketReference !== ticket.reference || hopDecisionReference(prior.value.turn) !== hopDecisionReference(value.turn)
        || hopDecisionReference(prior.value.job) !== hopDecisionReference({ id: value.job.id, operationId: value.job.operationId,
          generation: value.job.generation, scope: value.job.scope, question: value.job.question })) {
        throw Error('Cette opération possède déjà une autre réponse archivée. Le premier reçu reste intact.');
      }
      if (workspaceRef.current?.id === workspaceId) {
        const latestWorkspace = await services.assistedAdvice.readWorkspace(workspaceId);
        if (latestWorkspace) { workspaceRef.current = latestWorkspace; setWorkspace(latestWorkspace); }
        if (readingArchiveRef.current?.contentReference === ticket.sourceReadingReference) {
          const live = { sessionId, ticket, record: prior.value };
          assistedLiveReceiptRef.current = live; setAssistedLiveReceipt(live);
          setView('decide');
        }
      }
      return;
    }
    const current = await currentAssistedReceptionInput(ticket);
    const received = receiveHopV55AssistedAdvice({ ticket, input: value.input,
      job: { operationId: value.job.operationId, input: value.job.input }, turn: value.turn,
      envelope: value.envelope, evidence: value.evidence, current, receivedAt: iso() });
    if (received.status !== 'ready') throw Error(received.status === 'unsupportedReadOnly' ? received.reason : received.reason);
    const job = { id: value.job.id, operationId: value.job.operationId, generation: value.job.generation,
      scope: value.job.scope, question: value.job.question };
    const record = services.assistedAdvice.createRecord({ id: `assisted:${ticket.operationId}:${value.turn.id}`,
      ticket, job, turn: value.turn, payload: received.payload });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await services.assistedAdvice.readRecordByOperationId(workspaceId, value.input.operationId);
      if (latest.status === 'unsupportedReadOnly') throw Error(latest.reason);
      if (latest.status === 'invalid') throw Error(latest.reason);
      if (latest.status === 'available') {
        if (latest.value.reference === record.reference) return;
        throw Error('Une autre réponse a été archivée pour cette opération. Le reçu existant reste intact.');
      }
      try {
        const saved = await services.assistedAdvice.appendRecord(workspaceId, record, latest.revision);
        if (workspaceRef.current?.id === workspaceId) {
          workspaceRef.current = saved.workspace; setWorkspace(saved.workspace);
          setWorkspaces(rows => [...rows.filter(row => row.id !== saved.workspace.id), saved.workspace]);
          if (readingArchiveRef.current?.contentReference === ticket.sourceReadingReference) {
            const live = { sessionId, ticket, record };
            assistedLiveReceiptRef.current = live; setAssistedLiveReceipt(live);
            setView('decide');
            if (!readingHistoricalRef.current) setNotice('Réponse assistée archivée dans le dossier de sa lecture source.');
          }
        }
        return;
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('La réponse assistée reste conservée dans sa session et attend une reprise CAS.');
  }
  async function confirmAssistedSuggestion(sessionId: string, request: {
    suggestion: import('../../services/hopV55/assistedAdviceProposal').HopV55AssistedV4Suggestion;
    confirmation: import('../../services/hopV55/assistedAdviceProposal').HopV55BrewerConfirmation;
    commandId: string;
  }) {
    return runDocumentaryResult(async () => {
      const live = assistedLiveReceiptRef.current;
      if (!live || live.sessionId !== sessionId || live.ticket.sourceReadingReference !== readingArchiveRef.current?.contentReference
        || live.ticket.workspaceId !== workspaceRef.current?.id || readingHistoricalRef.current) {
        throw Error('Cette réponse assistée n’est plus celle de la lecture active. Elle reste archivée sans confirmation.');
      }
      if (live.record.payload.clientResult.status !== 'ready') throw Error('Cette réponse est incomplète ou périmée; elle reste consultable sans confirmation.');
      const generation = workspaceGeneration.current;
      const workspaceId = live.ticket.workspaceId;
      const readingReference = live.ticket.sourceReadingReference;
      const questionAtConfirmation = live.ticket.request.question;
      const selectionEpoch = propertyV4SelectionEpoch.current;
      const displayedIdentity = displayedV4IdentityRef.current;
      const assertLease = () => {
        assertWorkspaceScope(generation, workspaceId);
        if (readingArchiveRef.current?.contentReference !== readingReference || readingHistoricalRef.current
          || assistedLiveReceiptRef.current?.record.reference !== live.record.reference
          || questionRef.current !== questionAtConfirmation || propertyV4SelectionEpoch.current !== selectionEpoch
          || hopDecisionReference(displayedV4IdentityRef.current ?? null) !== hopDecisionReference(displayedIdentity ?? null)) {
          throw new PropertyV4PublicationSelectionChanged();
        }
      };
      const assertFinalPublication = (final: HopV55PropertyAdviceAnswerRecordV4) => {
        assertWorkspaceScope(generation, workspaceId);
        const selected = displayedV4IdentityRef.current;
        if (readingArchiveRef.current?.contentReference !== readingReference || readingHistoricalRef.current
          || questionRef.current !== questionAtConfirmation || assistedLiveReceiptRef.current?.record.reference !== live.record.reference
          || selected?.workspaceId !== workspaceId || selected.sourceReadingReference !== readingReference
          || selected.recordReference !== final.reference || selected.ledgerReference !== final.ledger.reference) {
          throw new PropertyV4PublicationSelectionChanged();
        }
      };
      const current = await freshAssistedCurrent(assistedLaunches.current.get(sessionId)?.launch
        ?? (() => { throw Error('La session de lancement est expirée.'); })());
      assertLease();
      const baseReferences = live.ticket.adviceBase;
      if (!baseReferences) throw Error('Aucun record V3/V4 parent n’a été capturé. Cette proposition ne peut pas être confirmée.');
      const sourceRecordRaw = current.workspace.documentaryAnswers?.find(row => row.reference === baseReferences.recordReference);
      const sourceRead = sourceRecordRaw && readHopV55DocumentaryAnswerRecord(sourceRecordRaw);
      if (!sourceRead || sourceRead.status !== 'readOnly'
        || sourceRead.record.format !== 'hop-v55-documentary-answer-record-v3'
          && sourceRead.record.format !== 'hop-v55-documentary-answer-record-v4') {
        throw Error('Le record parent exact de cette réponse assistée n’est plus disponible.');
      }
      const sourceRecord = sourceRead.record;
      if (sourceRecord.format === 'hop-v55-documentary-answer-record-v4'
        && (displayedV4IdentityRef.current?.workspaceId !== workspaceId
          || displayedV4IdentityRef.current.recordReference !== sourceRecord.reference
          || displayedV4IdentityRef.current.ledgerReference !== sourceRecord.ledger.reference)) {
        throw Error('La version V4 affichée ou son registre a changé depuis cette suggestion. Relis le record parent exact avant de confirmer.');
      }
      const priorTransition = assistedConfirmationTransitions.current.get(request.commandId);
      const transition: HopV55PropertyAdviceV4Transition = priorTransition ?? {
        actId: request.commandId,
        kind: sourceRecord.format === 'hop-v55-documentary-answer-record-v3' ? 'upgradeV3' : 'revise',
        parentRecordReference: sourceRecord.reference, parentReadingReference: readingReference,
        reason: request.confirmation.reason.trim(), actor: { origin: 'user', label: 'Brasseur' }, recordedAt: iso(),
      };
      if (!priorTransition) assistedConfirmationTransitions.current.set(request.commandId, structuredClone(transition));
      const outcome = await confirmHopV55AssistedAdviceSuggestion({ ticket: live.ticket, payload: live.record.payload,
        current, sourceRecord, transition, suggestion: request.suggestion, confirmation: request.confirmation,
        executeV4: async command => {
          assertLease();
          if (command.sourceRecord.format === 'hop-v55-documentary-answer-record-v3') {
            const upgraded = await propertyAdviceV4Controller(true, assertLease).upgradeV3(command.sourceRecord.reference, `${request.commandId}:upgrade-v3`,
              `Reprise V4 explicite avant la correction confirmée : ${request.confirmation.reason.trim()}`);
            assertLease();
            const corrected = await propertyAdviceV4Controller(false, assertLease).correct({ commandId: `${request.commandId}:apply`,
              expectedRecordReference: upgraded.reference, expectedLedgerReference: upgraded.ledger.reference,
              actions: [command.action], readingContext: upgraded.readingContext, reason: request.confirmation.reason.trim() });
            assertFinalPublication(corrected);
            return corrected;
          }
          const corrected = await propertyAdviceV4Controller(false, assertLease).correct({ commandId: request.commandId,
            expectedRecordReference: command.expected.sourceRecordReference,
            expectedLedgerReference: command.expected.ledgerReference ?? command.sourceRecord.ledger.reference,
            actions: [command.action], readingContext: command.sourceRecord.readingContext,
            reason: request.confirmation.reason.trim() });
          assertFinalPublication(corrected);
          return corrected;
        } });
      if (outcome.status !== 'applied') throw Error(outcome.reason);
      assertFinalPublication(outcome.result);
      assistedLiveReceiptRef.current = undefined; setAssistedLiveReceipt(undefined);
      setNotice('Suggestion assistée confirmée et conservée dans une nouvelle version.');
      return outcome.result;
    });
  }
  async function openAssistedArchive(operationId: string) {
    const ws = workspaceRef.current;
    if (!ws) return;
    const archived = await services.assistedAdvice.readArchiveByOperationId(ws.id, operationId);
    if (archived.status === 'unsupportedReadOnly') throw Error(`Archive future conservée sans conversion : ${archived.reason}`);
    if (archived.status !== 'available') throw Error(archived.status === 'invalid' ? archived.reason : 'Cette réponse assistée n’est plus disponible.');
    if (workspaceRef.current?.id !== ws.id) throw Error('Le dossier a changé pendant la relecture.');
    setAssistedHistoryArchive(archived.value);
  }
  async function reopenAssistedTicket(operationId: string) {
    if (!onOpenAssistedCompanion) throw Error('Cet hôte ne peut pas rouvrir une session assistée.');
    const activeWorkspace = workspaceRef.current;
    if (!activeWorkspace) throw Error('Aucun dossier local n’est ouvert pour rechercher ce ticket.');
    const loaded = await services.assistedAdvice.readWorkspace(activeWorkspace.id);
    if (!loaded || loaded.ownerKey !== services.ownerKey || loaded.id !== activeWorkspace.id) {
      throw Error('Le dossier du ticket a changé. Le lancement archivé reste intact.');
    }
    const ticketRead = await services.assistedAdvice.readTicketByOperationId(loaded.id, operationId);
    if (ticketRead.status === 'unsupportedReadOnly') throw Error(`Ticket futur conservé sans conversion : ${ticketRead.reason}`);
    if (ticketRead.status !== 'available') throw Error(ticketRead.status === 'invalid' ? ticketRead.reason : 'Ticket sans reçu introuvable.');
    const receipt = await services.assistedAdvice.readRecordByOperationId(loaded.id, operationId);
    if (receipt.status === 'unsupportedReadOnly') throw Error(`Réponse future conservée sans conversion : ${receipt.reason}`);
    if (receipt.status === 'invalid') throw Error(receipt.reason);
    if (receipt.status === 'available') throw Error('Une réponse exacte existe déjà. Relis son archive plutôt que de rouvrir le lancement.');
    const ticket = ticketRead.value;
    const { format: _format, id: _id, operationId: _operationId, createdAt: _createdAt, reference: _reference, ...body } = ticket;
    const launch: HopV55AssistedAdvicePreparedLaunchV1 = {
      format: 'hop-v55-assisted-advice-prepared-launch-v1', ...structuredClone(body),
    };
    const sessionId = uid('assisted-recovery-session');
    assistedLaunches.current.set(sessionId, { launch, workspaceId: loaded.id,
      recoveredTicket: ticket });
    const session: HopV55AssistedCompanionSession = {
      id: sessionId, request: structuredClone(ticket.request), context: structuredClone(ticket.launchSnapshot.context),
      label: `Reprise du ticket assisté · ${ticket.request.question}`,
      onBeforeSend: input => beforeAssistedSend(sessionId, input),
      onAssistedTurn: value => receiveAssistedTurn(sessionId, value),
    };
    onOpenAssistedCompanion(session);
  }
  /** Head V4 advice record of this exact reading; a V4 launch keeps its sealed policy rather than a new choice. */
  function semanticLinkedV4Record(ws: HopV55Workspace, archive: HopV55DecisionReadingArchive) {
    for (const raw of [...(ws.documentaryAnswers ?? [])].reverse()) {
      if ((raw as { sourceReadingReference?: string }).sourceReadingReference !== archive.contentReference) continue;
      const read = readHopV55DocumentaryAnswerRecord(raw);
      if (read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4') return read.record;
    }
    return undefined;
  }
  /** Policy sealed in the V3 ticket: the linked V4 record's, else the brewer's explicit current choice (empty included). */
  function semanticCandidatePolicy(ws: HopV55Workspace, archive: HopV55DecisionReadingArchive): HopPropertyAdviceCandidatePolicy {
    const linked = semanticLinkedV4Record(ws, archive);
    if (linked) return structuredClone(linked.readingContext.candidatePolicy);
    const materialIds = [...new Set(assistedMaterialIdsRef.current)];
    return { kind: 'explicit', materialIds, basis: materialIds.length
      ? 'Matières choisies explicitement par le brasseur dans le contexte chargé.' : 'Aucune matière choisie explicitement.' };
  }
  /** The host's CAS writes advance the revision; Page rereads it so its own next save is not stale. */
  async function refreshSemanticWorkspace(workspaceId: string) {
    const latest = await services.workspaces.read(services.ownerKey, workspaceId);
    if (!latest || latest.ownerKey !== services.ownerKey || !alive.current || workspaceRef.current?.id !== workspaceId) return;
    workspaceRef.current = latest; setWorkspace(latest);
    setWorkspaces(rows => [...rows.filter(row => row.id !== latest.id), latest]);
  }
  async function openSemanticAssistedCompanion() {
    if (!semanticAdoptionHost || !onOpenSemanticCompanion) {
      throw Error(semanticAdviceUnavailableReason ?? 'Le compagnon assisté n’est pas disponible dans cet hôte.');
    }
    // The wizard's live draft would be sealed as recipe:<draftId>; never launch it under a saved Recipe identity.
    if (recipeDraftTargetRef.current) throw Error(semanticAdviceUnavailableReason ?? recipeDraftSemanticUnavailable);
    const archive = readingArchiveRef.current;
    const active = workspaceRef.current;
    if (!archive || archive.format !== 'hop-v55-decision-reading-v4' || !active) {
      throw Error('Une lecture sémantique V4 conservée est nécessaire avant d’ouvrir le compagnon.');
    }
    const question = archive.reading.intent.question;
    if (questionRef.current !== question) throw Error('Relis la question après toute modification avant d’ouvrir le compagnon.');
    const generation = workspaceGeneration.current;
    const stored = await services.workspaces.read(services.ownerKey, active.id);
    assertWorkspaceScope(generation, active.id);
    if (!stored || stored.ownerKey !== services.ownerKey || stored.id !== active.id) {
      throw Error('Le dossier exact de cette lecture n’est plus disponible; aucun autre dossier n’est substitué.');
    }
    // Scope and policy come from this archive and this workspace read, never from the host's props.
    const scopeAtPageLaunch = mapBrewerHopAdviceLaunchSourceToScopeV1(services.ownerKey, stored.id, archive.source);
    const candidatePolicy = semanticCandidatePolicy(stored, archive);
    const policyReference = hopDecisionReference(candidatePolicy);
    const opened = await semanticAdoptionHost.openSession({ workspaceId: stored.id,
      sourceReadingReference: archive.contentReference, scopeAtPageLaunch, candidatePolicy });
    if (opened.status !== 'ready') throw Error(opened.status === 'unsupportedReadOnly'
      ? `Lecture conservée sans conversion : ${opened.reason}` : opened.reason);
    assertWorkspaceScope(generation, stored.id);
    if (readingArchiveRef.current?.contentReference !== archive.contentReference || questionRef.current !== question
      || recipeDraftTargetRef.current || hopDecisionReference(semanticCandidatePolicy(stored, archive)) !== policyReference) {
      throw Error('La lecture, la question ou le périmètre a changé pendant la préparation. Aucune session n’a été ouverte.');
    }
    const session = opened.session;
    if (session.workspaceId !== stored.id || session.sourceReadingReference !== archive.contentReference
      || hopDecisionReference(session.scope) !== hopDecisionReference(scopeAtPageLaunch)
      || hopDecisionReference(session.candidatePolicy) !== policyReference) {
      throw Error('La session préparée ne porte pas exactement la source, le scope et le périmètre de cette lecture.');
    }
    onOpenSemanticCompanion({ ...session, onDurableChange: () => refreshSemanticWorkspace(stored.id) });
  }
  /** Strict resume from the durable V3 ticket; a V2 or future ticket stays read-only in its reader. */
  async function reopenSemanticTicket(operationId: string) {
    if (!semanticAdoptionHost || !onOpenSemanticCompanion) {
      throw Error(semanticAdviceUnavailableReason ?? 'La reprise du compagnon assisté est indisponible dans cet hôte.');
    }
    // A classic ticket addresses a saved Recipe identity; the creator's draft never reopens it as its own lane.
    if (recipeDraftTargetRef.current) {
      throw Error('Ce ticket vise une recette enregistrée; il reste consultable ici sans être rouvert depuis le brouillon.');
    }
    const active = workspaceRef.current;
    if (!active) throw Error('Aucun dossier local n’est ouvert pour rechercher ce ticket.');
    const generation = workspaceGeneration.current;
    const opened = await semanticAdoptionHost.resumeSession({ workspaceId: active.id, operationId });
    assertWorkspaceScope(generation, active.id);
    if (opened.status !== 'ready') throw Error(opened.status === 'unsupportedReadOnly'
      ? `Ticket conservé en lecture seule : ${opened.reason}` : opened.reason);
    if (opened.session.workspaceId !== active.id) throw Error('Le ticket rouvert appartient à un autre dossier.');
    onOpenSemanticCompanion({ ...opened.session, onDurableChange: () => refreshSemanticWorkspace(active.id) });
  }
  /** Rereads a confirmed receipt through #65/#66/#67; a replay returns that same receipt or is refused. */
  async function readSemanticAdoption(commandId: string, operationId: string, replayPlan?: unknown) {
    if (!semanticAdoptionHost) throw Error(semanticAdviceUnavailableReason ?? 'La relecture du reçu est indisponible dans cet hôte.');
    const active = workspaceRef.current;
    if (!active) throw Error('Aucun dossier local n’est ouvert pour relire ce reçu.');
    const generation = workspaceGeneration.current;
    const opened = await semanticAdoptionHost.resumeSession({ workspaceId: active.id, operationId });
    assertWorkspaceScope(generation, active.id);
    if (opened.status !== 'ready') throw Error(opened.reason);
    const history = await opened.session.readHistory(commandId);
    assertWorkspaceScope(generation, active.id);
    if (history.status !== 'readOnly') throw Error(history.reason);
    if (history.commit.id !== commandId) throw Error('Le reçu relu appartient à une autre commande.');
    let mode: 'reread' | 'replay' = 'reread';
    if (replayPlan !== undefined) {
      const replay = await opened.session.confirm(replayPlan);
      assertWorkspaceScope(generation, active.id);
      if (replay.status !== 'replay') throw Error(replay.status === 'committed'
        ? 'Ce rejeu a produit un nouvel enregistrement au lieu du reçu original.' : replay.reason);
      if (replay.receipt.reference !== history.commit.receipt.reference || replay.receipt.effectiveAt !== history.commit.receipt.effectiveAt) {
        throw Error('Le rejeu n’a pas rendu le reçu original; l’historique reste intact.');
      }
      mode = 'replay';
    }
    await refreshSemanticWorkspace(active.id);
    setSemanticHistory({ workspaceId: active.id, commandId, receipt: history.commit.receipt, mode });
  }
  /** A Wizard launch keeps the policy sealed by a Wizard answer already linked to this exact reading. */
  function wizardCandidatePolicy(ws: HopV55Workspace, archive: HopV55WizardDecisionReadingArchiveV4): HopPropertyAdviceCandidatePolicy {
    for (const raw of [...(ws.documentaryAnswers ?? [])].reverse()) {
      if ((raw as { sourceReadingReference?: string }).sourceReadingReference !== archive.contentReference) continue;
      try {
        const read = readHopV55DocumentaryAnswerRecordWithWizardV1(raw);
        if (read.status === 'readOnly' && read.profile === 'wizardV1' && read.record.format === 'hop-v55-documentary-answer-record-v4') {
          return structuredClone(read.record.readingContext.candidatePolicy);
        }
      } catch { /* A corrupt known row stays refused by the repository; no policy is inferred from it. */ }
    }
    const materialIds = [...new Set(assistedMaterialIdsRef.current)];
    return { kind: 'explicit', materialIds, basis: materialIds.length
      ? 'Matières choisies explicitement par le brasseur dans le contexte chargé.' : 'Aucune matière choisie explicitement.' };
  }
  /** The application host writes the Wizard dossier; Page only rereads it for its history list. */
  async function refreshWizardDossier(workspaceId: string) {
    const latest = await services.workspaces.read(services.ownerKey, workspaceId);
    if (!latest || latest.ownerKey !== services.ownerKey || !alive.current) return;
    setWorkspaces(rows => [...rows.filter(row => row.id !== latest.id), latest]);
  }
  /**
   * One CAS of the assisted dossier: durable origin (at creation only), exact canonical snapshot of the live draft
   * (once per content) and its Wizard V4 reading. A missing dossier is created only by the brewer's explicit gesture.
   */
  async function persistWizardReading(input: { target: HopV55RecipeDraftTarget;
    snapshot: { recipe: unknown; reference: string }; reading: HopV55SemanticQuestionReadingV1;
    scopeDrafts: readonly HopV55QuestionScopeV1[] | undefined; runtimeReference: string; allowNewDossier: boolean; title: string }):
    Promise<{ workspace: HopV55Workspace; archive: HopV55WizardDecisionReadingArchiveV4 }> {
    for (let attempt = 0; attempt < 3; attempt++) {
      const rows = await services.workspaces.list(services.ownerKey);
      const existing = wizardDossiersFor(rows, input.target).at(-1);
      if (!existing && !input.allowNewDossier) {
        throw Error('Aucun dossier assisté n’est ouvert pour ce brouillon. Ouvre-le explicitement; le dossier local actuel reste intact.');
      }
      const id = existing?.id ?? uid('workspace');
      const origin = existing?.wizardOrigin ?? createHopV55WizardWorkspaceOriginV1({ ownerKey: services.ownerKey,
        workspaceId: id, draftId: input.target.draftId });
      const base: HopV55Workspace = existing ?? { format: 'hop-v55-workspace-v1', id, ownerKey: services.ownerKey, revision: 0,
        title: `Lecture assistée · ${input.title.trim() || 'brouillon en cours'}`, intent: structuredClone(input.reading.intent),
        wizardOrigin: origin, wizardSourceSnapshots: [], decisionReadings: [], scenarioIds: [], referenceHypotheses: [], copies: [],
        updatedAt: iso() };
      const stored = createHopV55WizardSourceSnapshotV1({ origin, snapshot: { recipe: input.snapshot.recipe, reference: input.snapshot.reference } });
      const snapshots = base.wizardSourceSnapshots ?? [];
      const hasSnapshot = snapshots.some(row => !!row && typeof row === 'object'
        && (row as { reference?: unknown }).reference === stored.reference);
      const reuse = (base.decisionReadings ?? []).flatMap(row => {
        const read = readHopV55DecisionReadingArchiveForWizardV1(row);
        return read.status === 'available' ? [read.archive] : [];
      }).find(archive => archive.source.contentReference === stored.source.contentReference
        && archive.runtimeReference === input.runtimeReference
        && hopDecisionReference(archive.reading) === hopDecisionReference(input.reading));
      if (reuse && hasSnapshot) return { workspace: base, archive: reuse };
      const archive = reuse ?? createHopV55WizardReadingArchive({ reading: input.reading, scopeDrafts: input.scopeDrafts,
        id: uid('wizard-reading'), ownerKey: services.ownerKey, workspaceId: id, recordedAt: iso(), source: stored.source,
        runtimeReference: input.runtimeReference });
      const next: HopV55Workspace = { ...base, intent: structuredClone(input.reading.intent),
        wizardSourceSnapshots: hasSnapshot ? snapshots : [...snapshots, stored],
        decisionReadings: reuse ? base.decisionReadings : [...(base.decisionReadings ?? []), archive], updatedAt: iso() };
      try {
        const saved = await services.workspaces.save(next, existing ? existing.revision : null);
        if (saved.id !== id || saved.ownerKey !== services.ownerKey) throw Error('Le dossier assisté sauvegardé n’est pas celui de ce brouillon.');
        if (alive.current) setWorkspaces(previous => [...previous.filter(row => row.id !== saved.id), saved]);
        return { workspace: saved, archive };
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('Le dossier assisté attend une reprise de sauvegarde; aucune session n’est ouverte.');
  }
  /**
   * Wizard lane: the displayed V4 reading must be that of the live draft. The question is read again on this exact
   * draft and sealed under its Wizard source; the host then rereads the live draft after each of its awaits.
   */
  async function openWizardSemanticCompanion(allowNewDossier: boolean) {
    const target = recipeDraftTargetRef.current;
    if (!target || target.ownerKey !== services.ownerKey) {
      throw Error('Le brouillon ouvert ne correspond plus au profil local; aucun dossier assisté n’est ouvert.');
    }
    if (!semanticAdoptionHost || !onOpenSemanticCompanion) {
      throw Error(semanticAdviceUnavailableReason ?? recipeDraftSemanticUnavailable);
    }
    const archive = readingArchiveRef.current;
    if (!archive || archive.format !== 'hop-v55-decision-reading-v4' || readingHistoricalRef.current) {
      throw Error('Relis la question sur le brouillon actuel avant d’ouvrir le compagnon.');
    }
    const question = archive.reading.intent.question;
    if (questionRef.current !== question) throw Error('Relis la question après toute modification avant d’ouvrir le compagnon.');
    const generation = workspaceGeneration.current;
    const draftReference = recipeDraftReferenceRef.current;
    if (draftReference === null) throw Error('La référence canonique du brouillon est invalide; aucun dossier assisté n’est ouvert.');
    const assertSameDraft = () => {
      assertWorkspaceScope(generation);
      const current = recipeDraftTargetRef.current;
      if (current?.ownerKey !== target.ownerKey || current.draftId !== target.draftId
        || recipeDraftReferenceRef.current !== draftReference
        || readingArchiveRef.current?.contentReference !== archive.contentReference || readingHistoricalRef.current
        || questionRef.current !== question) {
        throw Error('Le brouillon, la lecture ou la question a changé pendant la préparation. Ce qui est déjà conservé reste dans le dossier assisté; aucune session n’est ouverte.');
      }
    };
    const ctx = await readExactCurrentContext();
    assertSameDraft();
    if (!ctx.recipe || ctx.batch) throw Error('Le contexte relu ne contient pas uniquement le brouillon ouvert; rien n’est préparé.');
    const prep = prepareBrewingScenarioContext(ctx);
    const liveRuntimeReference = runtimeReference(prep);
    if (liveRuntimeReference !== archive.runtimeReference) {
      throw Error('Le brouillon ou ses données ont changé depuis cette lecture. Relis la question sur le brouillon actuel avant de l’envoyer.');
    }
    const snapshot = canonicalizeHopV55RecipeDraft({ ownerKey: target.ownerKey, draftId: target.draftId, draft: ctx.recipe });
    if (draftReference !== undefined && snapshot.reference !== draftReference) {
      throw Error('Le brouillon relu diffère de la version affichée; relis la question avant de l’envoyer.');
    }
    const { reading: parsed, scopeDrafts } = readHopV55QuestionSemanticWithScopesV1(question, prep);
    const saved = await persistWizardReading({ target, snapshot, reading: parsed, scopeDrafts,
      runtimeReference: liveRuntimeReference, allowNewDossier, title: ctx.recipe.name ?? '' });
    assertSameDraft();
    const scope = mapBrewerHopAdviceWizardSourceToScopeV1(saved.archive.source);
    const candidatePolicy = wizardCandidatePolicy(saved.workspace, saved.archive);
    const policyReference = hopDecisionReference(candidatePolicy);
    const opened = await semanticAdoptionHost.openWizardSession({ workspaceId: saved.workspace.id,
      sourceReadingReference: saved.archive.contentReference, scopeAtPageLaunch: scope, candidatePolicy });
    if (opened.status !== 'ready') throw Error(opened.status === 'unsupportedReadOnly'
      ? `Lecture conservée sans conversion : ${opened.reason}` : opened.reason);
    assertSameDraft();
    const session = opened.session;
    if (session.workspaceId !== saved.workspace.id || session.sourceReadingReference !== saved.archive.contentReference
      || hopDecisionReference(session.scope) !== hopDecisionReference(scope)
      || hopDecisionReference(session.candidatePolicy) !== policyReference || session.snapshot.reference !== snapshot.reference) {
      throw Error('La session préparée ne porte pas exactement le brouillon, la lecture et le périmètre attendus.');
    }
    onOpenSemanticCompanion({ ...session, onDurableChange: () => refreshWizardDossier(saved.workspace.id) });
  }
  /** Strict resume of a durable Wizard ticket: its archived draft version, not the editor's current one. */
  async function reopenWizardSemanticTicket(workspaceId: string, operationId: string) {
    if (!semanticAdoptionHost || !onOpenSemanticCompanion) {
      throw Error(semanticAdviceUnavailableReason ?? recipeDraftSemanticUnavailable);
    }
    const target = recipeDraftTargetRef.current;
    if (!target) throw Error('Aucun brouillon n’est ouvert pour reprendre ce ticket.');
    const generation = workspaceGeneration.current;
    const opened = await semanticAdoptionHost.resumeWizardSession({ workspaceId, operationId });
    assertWorkspaceScope(generation);
    if (opened.status !== 'ready') throw Error(opened.status === 'unsupportedReadOnly'
      ? `Ticket conservé en lecture seule : ${opened.reason}` : opened.reason);
    if (opened.session.workspaceId !== workspaceId || recipeDraftTargetRef.current?.draftId !== target.draftId) {
      throw Error('Le ticket rouvert appartient à un autre dossier ou brouillon.');
    }
    onOpenSemanticCompanion({ ...opened.session, onDurableChange: () => refreshWizardDossier(workspaceId) });
  }
  /**
   * Rereads, or replays, a confirmed Wizard receipt from its own dossier; nothing is compared to the live draft. The
   * local history reader suffices: no provider, runtime or live draft. A replay can only return the original receipt.
   */
  async function readWizardSemanticAdoption(workspaceId: string, commandId: string, operationId: string, replayPlan?: unknown) {
    const historyHost = semanticHistoryHost ?? semanticAdoptionHost;
    if (!historyHost) throw Error('La relecture locale des dossiers assistés est indisponible tant que le dossier local n’est pas ouvert.');
    const generation = workspaceGeneration.current;
    const opened = await historyHost.resumeWizardSession({ workspaceId, operationId });
    assertWorkspaceScope(generation);
    if (opened.status !== 'ready') throw Error(opened.reason);
    const history = await opened.session.readHistory(commandId);
    assertWorkspaceScope(generation);
    if (history.status !== 'readOnly') throw Error(history.reason);
    if (history.commit.id !== commandId) throw Error('Le reçu relu appartient à une autre commande.');
    let mode: 'reread' | 'replay' = 'reread';
    if (replayPlan !== undefined) {
      const replay = await opened.session.confirm(replayPlan);
      assertWorkspaceScope(generation);
      if (replay.status !== 'replay') throw Error(replay.status === 'committed'
        ? 'Ce rejeu a produit un nouvel enregistrement au lieu du reçu original.' : replay.reason);
      if (replay.receipt.reference !== history.commit.receipt.reference || replay.receipt.effectiveAt !== history.commit.receipt.effectiveAt) {
        throw Error('Le rejeu n’a pas rendu le reçu original; l’historique reste intact.');
      }
      mode = 'replay';
    }
    await refreshWizardDossier(workspaceId);
    setSemanticHistory({ workspaceId, commandId, receipt: history.commit.receipt, mode });
  }
  /**
   * Read-only reopening of an archived Wizard reading: the strict resume returns its sealed draft version, ticket and
   * record; only these data are kept. No companion, runtime, send or adoption is opened from here.
   */
  async function readWizardArchivedAnswer(workspaceId: string, operationId: string) {
    const historyHost = semanticHistoryHost ?? semanticAdoptionHost;
    if (!historyHost) throw Error('La relecture locale des dossiers assistés est indisponible tant que le dossier local n’est pas ouvert.');
    const generation = workspaceGeneration.current;
    const opened = await historyHost.resumeWizardSession({ workspaceId, operationId });
    assertWorkspaceScope(generation);
    if (opened.status !== 'ready') throw Error(opened.status === 'unsupportedReadOnly'
      ? `Lecture conservée sans conversion : ${opened.reason}` : opened.reason);
    const session = opened.session;
    if (session.workspaceId !== workspaceId || (session.resumedOperationId ?? operationId) !== operationId) {
      throw Error('La relecture appartient à un autre dossier ou à une autre opération.');
    }
    setWizardArchiveView({ workspaceId, operationId, question: session.request.question,
      draftId: session.request.contextLaunch.source.draftId, snapshot: structuredClone(session.snapshot),
      scope: structuredClone(session.scope), candidatePolicy: structuredClone(session.candidatePolicy),
      ...(session.resumedRecord ? { record: structuredClone(session.resumedRecord) } : {}) });
    setNotice(session.resumedRecord ? 'Réponse relue depuis ses éléments archivés; aucun envoi ni nouvelle version.'
      : 'Lecture conservée sans réponse archivée; aucun envoi n’est lancé depuis cette relecture.');
  }
  /**
   * Fresh frame of one archived Wizard V4 answer, read from its own dossier only: actor through the strict local ticket
   * reread, durable origin, head of its reading, archive and stored draft version, then the Prepared rebuilt from that
   * version and the local catalogue. No live draft, provider or saved Recipe of the same ID is read; nothing is written.
   */
  async function readWizardAnswerFrame(target: { workspaceId: string; operationId: string; sourceReadingReference: string;
    headReference: string }) {
    const historyHost = semanticHistoryHost ?? semanticAdoptionHost;
    if (!historyHost) throw Error('La correction attend l’ouverture du dossier local; rien n’est enregistré.');
    const generation = workspaceGeneration.current;
    const opened = await historyHost.resumeWizardSession({ workspaceId: target.workspaceId, operationId: target.operationId });
    assertWorkspaceScope(generation);
    if (opened.status !== 'ready') throw Error(`${opened.reason} Rien n’est enregistré.`);
    const session = opened.session;
    if (session.workspaceId !== target.workspaceId || session.sourceReadingReference !== target.sourceReadingReference) {
      throw Error('Le ticket relu appartient à un autre dossier ou à une autre lecture; rien n’est enregistré.');
    }
    const dossier = await services.workspaces.read(services.ownerKey, target.workspaceId);
    assertWorkspaceScope(generation);
    if (!dossier || dossier.ownerKey !== services.ownerKey || dossier.id !== target.workspaceId) {
      throw Error('Le dossier assisté exact n’est plus disponible; aucun autre dossier ni recette ne le remplace. Rien n’est enregistré.');
    }
    const originRead = readHopV55WizardWorkspaceOriginV1(dossier.wizardOrigin);
    if (originRead.status !== 'available' || originRead.value.ownerKey !== dossier.ownerKey || originRead.value.workspaceId !== dossier.id) {
      throw Error('L’origine de ce dossier assisté n’est plus valide; il reste en lecture seule. Rien n’est enregistré.');
    }
    const origin = { ownerKey: dossier.ownerKey, workspaceId: dossier.id, draftId: originRead.value.draftId };
    const chain = wizardAnswerHead(wizardAnswerVersions(dossier, origin), target.sourceReadingReference);
    if (!chain.head) throw Error(`${chain.blocked} Rien n’est enregistré.`);
    if (chain.head.record.reference !== target.headReference) {
      throw Error('Une autre version de cette réponse a été conservée depuis ta relecture; relis l’historique avant de corriger. Rien n’est enregistré.');
    }
    const head = chain.head.record;
    const readingRows = (dossier.decisionReadings ?? []).filter(row => row.contentReference === head.sourceReadingReference);
    const archiveRead = readingRows.length === 1 ? readHopV55DecisionReadingArchiveForWizardV1(readingRows[0]) : undefined;
    if (archiveRead?.status !== 'available') {
      throw Error('La lecture archivée de cette réponse est absente, multiple ou illisible; rien n’est enregistré.');
    }
    const archive = archiveRead.archive;
    if (archive.source.ownerKey !== origin.ownerKey || archive.source.workspaceId !== origin.workspaceId
      || archive.source.draftId !== origin.draftId) {
      throw Error('La lecture archivée ne porte pas l’origine de ce brouillon; rien n’est enregistré.');
    }
    let stored: ReturnType<typeof readHopV55WizardSourceSnapshotForArchiveV1>;
    try { stored = readHopV55WizardSourceSnapshotForArchiveV1({ workspace: dossier, archive }); }
    catch (cause) {
      throw Error(`${cause instanceof Error ? cause.message : 'La version archivée du brouillon est illisible.'} Rien n’est enregistré.`);
    }
    const snapshot = { recipe: structuredClone(stored.draft), reference: stored.source.contentReference } as unknown as WizardCorrectionInput['snapshot'];
    // Local catalogue and stocks only: the exploration source carries no Recipe, Batch or journal of the Host.
    const catalogue: Record<string, unknown> = { ...(await services.loadContext(undefined, { kind: 'exploration' })) };
    assertWorkspaceScope(generation);
    delete catalogue.batch; delete catalogue.journal;
    const prepared = prepareBrewingScenarioContext({ ...catalogue, recipe: structuredClone(stored.draft),
      phase: wizardArchivedDraftPhase, provenance: [`Version archivée du brouillon ${origin.draftId}; référence ${stored.source.contentReference}.`,
        'Relue depuis son dossier assisté : ni le créateur ouvert, ni une recette enregistrée du même identifiant ne la remplacent.'] } as unknown as BrewerContext);
    const resumed = resumeV4ForWizardV1({ record: chain.head.raw, sourceReadingArchive: archive,
      origin: origin as WizardCorrectionInput['origin'], snapshot, prepared });
    if (resumed.status === 'stale' || resumed.status === 'unsupportedReadOnly') {
      throw Error(`${resumed.reason} Cette version reste consultable; rien n’est enregistré.`);
    }
    return { dossier, origin: origin as WizardCorrectionInput['origin'], head, archive, snapshot, prepared,
      scope: { kind: session.scope.kind, id: session.scope.id }, generation: session.resumedGeneration };
  }
  /** Contract 87 revision of the exact head: same Wizard source, reading and binding; old versions are not rewritten. */
  function buildWizardCorrectionRecord(frame: Awaited<ReturnType<typeof readWizardAnswerFrame>>,
    identity: HopV55WizardCorrectionPreviewV1['identity'], actions: readonly HopV55PropertyAdviceLedgerActionV4[], reason: string) {
    const corrected = prepareCorrectionV4ForWizardV1({ sourceRecord: frame.head, sourceReadingArchive: frame.archive,
      origin: frame.origin, snapshot: frame.snapshot, prepared: frame.prepared,
      recordId: identity.recordId, requestId: identity.requestId, actions,
      transition: { actId: identity.actId, kind: 'revise', parentRecordReference: frame.head.reference,
        parentReadingReference: frame.head.sourceReadingReference, reason, actor: { origin: 'user', label: 'Brasseur' },
        recordedAt: identity.recordedAt } });
    if (corrected.status === 'allRejected') {
      return createHopV55PropertyAdviceAnswerRecordV4ForWizardV1({ draft: corrected.recordDraft, outcome: { kind: 'allRejected' } });
    }
    // The domain answer is built for an explicit correction only, never for a re-reading.
    const answerSnapshot = buildHopPropertyAdviceV3(corrected.requestDraftV3.requestSnapshot);
    return createHopV55PropertyAdviceAnswerRecordV4ForWizardV1({ draft: corrected.recordDraft, outcome: { kind: 'domainAnswer',
      requestDraftReference: corrected.requestDraftV3.reference, answerSnapshot,
      answerReference: hopPropertyAdviceAnswerReferenceV3(answerSnapshot) } });
  }
  /** Preview only: the corrected version is sealed and shown, nothing is written. */
  async function previewWizardAnswerCorrection(target: { workspaceId: string; operationId: string; sourceReadingReference: string;
    head: HopV55PropertyAdviceAnswerRecordV4ForWizardV1 }, input: { actions: HopV55PropertyAdviceLedgerActionV4[]; reason: string }):
    Promise<HopV55WizardCorrectionPreviewV1> {
    const reason = input.reason.trim();
    if (!reason) throw Error('Indique le motif de cette correction; rien n’est préparé sans lui.');
    if (!input.actions.length) throw Error('Choisis au moins un terme à écarter ou à restaurer.');
    const frame = await readWizardAnswerFrame({ workspaceId: target.workspaceId, operationId: target.operationId,
      sourceReadingReference: target.sourceReadingReference, headReference: target.head.reference });
    const identity = { actId: uid('wizard-answer-correction'), recordId: uid('wizard-answer'),
      requestId: uid('wizard-answer-request'), recordedAt: iso() };
    const record = buildWizardCorrectionRecord(frame, identity, input.actions, reason);
    return { workspaceId: target.workspaceId, operationId: target.operationId, sourceReadingReference: target.sourceReadingReference,
      draftId: frame.origin.draftId, parent: frame.head, record, snapshot: frame.snapshot, scope: frame.scope,
      ...(frame.generation !== undefined ? { generation: frame.generation } : {}),
      actions: structuredClone(input.actions), reason, identity };
  }
  /**
   * Appends the previewed version by CAS of its own dossier. Actor, origin, head, draft version and Prepared are read
   * again before each attempt; any difference from the preview refuses the save and keeps every earlier version.
   */
  async function saveWizardAnswerCorrection(preview: HopV55WizardCorrectionPreviewV1) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const frame = await readWizardAnswerFrame({ workspaceId: preview.workspaceId, operationId: preview.operationId,
        sourceReadingReference: preview.sourceReadingReference, headReference: preview.parent.reference });
      if (frame.origin.draftId !== preview.draftId || frame.snapshot.reference !== preview.snapshot.reference
        || frame.scope.kind !== preview.scope.kind || frame.scope.id !== preview.scope.id) {
        throw Error('La version du brouillon, son origine ou sa portée a changé depuis l’aperçu; prépare un nouvel aperçu. Rien n’est enregistré.');
      }
      const record = buildWizardCorrectionRecord(frame, preview.identity, preview.actions, preview.reason);
      if (record.reference !== preview.record.reference) {
        throw Error('Le contexte de cette version a changé depuis l’aperçu; la correction affichée n’est plus exacte. Prépare un nouvel aperçu; rien n’est enregistré.');
      }
      const now = iso();
      const updatedAt = now > frame.dossier.updatedAt ? now : new Date(Date.parse(frame.dossier.updatedAt) + 1).toISOString();
      try {
        const saved = await services.workspaces.save({ ...frame.dossier, updatedAt, documentaryAnswers: [...(frame.dossier.documentaryAnswers ?? []),
          record as unknown as NonNullable<HopV55Workspace['documentaryAnswers']>[number]] }, frame.dossier.revision);
        if (saved.id !== preview.workspaceId || saved.ownerKey !== services.ownerKey) {
          throw Error('Le dossier sauvegardé n’est pas celui de cette réponse.');
        }
        if (alive.current) setWorkspaces(rows => [...rows.filter(row => row.id !== saved.id), saved]);
        return record;
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('La correction attend une reprise de sauvegarde; rien n’est enregistré.');
  }
  /** Runs one correction step under the Page's busy guard; its reason stays in the correction panel. */
  async function runWizardCorrection<T>(action: () => Promise<T>): Promise<T> {
    const box: { done: boolean; value?: T } = { done: false };
    await run(async () => { box.value = await action(); box.done = true; }, true, false);
    if (!box.done) throw Error('Une action est déjà en cours. La saisie reste conservée.');
    return box.value as T;
  }
  /**
   * History of assisted dossiers. `live`: the open creator's own draft (its companion lane may reopen a ticket).
   * `closed`: the ordinary workshop, every dossier of this owner, read only from archived members.
   */
  function renderWizardDossierHistory(dossiers: readonly HopV55Workspace[], mode: 'live' | 'closed') {
    const historyHost = semanticHistoryHost ?? semanticAdoptionHost;
    const liveReopen = mode === 'live' && !!semanticAdoptionHost && !!onOpenSemanticCompanion;
    const group = (label: string, children: React.ReactNode) => mode === 'live'
      ? <details className="hv-details"><summary>{label}</summary>{children}</details>
      : <div className="hv-details"><h4>{label}</h4>{children}</div>;
    return <section className="hv-copy-history" data-testid="wizard-semantic-history">
      <h3>{mode === 'live' ? 'Dossier assisté de ce brouillon' : 'Dossiers assistés de tes brouillons'}</h3>
      <p>{mode === 'live'
        ? 'Chaque version lue du brouillon reste conservée avec son origine. Relire un ticket ou un reçu n’envoie rien et ne modifie ni la recette ni le brouillon.'
        : 'Lectures, réponses, choix et reçus conservés depuis le créateur de recette. Chaque élément est relu tel qu’il a été archivé, avec sa version du brouillon; relire n’envoie rien et ne modifie ni recette ni brouillon.'}</p>
      <p className="hv-muted">Le dossier de stratégie sur une réponse de brouillon n’est pas encore disponible; les choix confirmés restent consultables ici.</p>
      {!historyHost ? <p role="status">La relecture des réponses et des reçus attend l’ouverture du dossier local; les éléments restent listés.</p> : null}
      {dossiers.map(dossier => {
        const originRead = readHopV55WizardWorkspaceOriginV1(dossier.wizardOrigin);
        if (originRead.status !== 'available' || originRead.value.ownerKey !== dossier.ownerKey || originRead.value.workspaceId !== dossier.id) {
          return <article key={dossier.id}>
            <strong>Dossier assisté conservé · {originRead.status === 'unsupportedFormat' ? 'origine de format futur' : 'origine non validée'}</strong>
            <p>{originRead.status === 'invalidRecord' ? originRead.reason : 'Il reste en lecture seule; aucune relecture ni rejeu n’est proposé.'}</p>
            <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(dossier.wizardOrigin, null, 2)}</pre></details>
          </article>;
        }
        const origin = originRead.value;
        const snapshotCount = (dossier.wizardSourceSnapshots ?? []).length;
        const readingCount = (dossier.decisionReadings ?? []).length;
        const commits = (dossier.semanticAdoptionCommits ?? []).map(raw => ({ raw, read: readHopV55SemanticAdoptionCommitV1(raw) }));
        const archived = wizardArchiveView?.workspaceId === dossier.id ? wizardArchiveView : undefined;
        const answers = wizardAnswerVersions(dossier, origin);
        const correction = wizardCorrection?.workspaceId === dossier.id ? wizardCorrection : undefined;
        return <article key={dossier.id}>
          <strong>{dossier.title}</strong>
          <p>Brouillon d’origine <code>{origin.draftId}</code> · {snapshotCount} version{snapshotCount > 1 ? 's' : ''} conservée{snapshotCount > 1 ? 's' : ''} · {readingCount} lecture{readingCount > 1 ? 's' : ''}</p>
          {dossier.assistedSemanticAdviceTickets?.length ? group(`Lectures du brouillon relues par le compagnon · ${dossier.assistedSemanticAdviceTickets.length}`,
            dossier.assistedSemanticAdviceTickets.map((raw, index) => {
              const read = readHopV55AssistedAdviceWizardTicketV1(raw);
              if (read.status !== 'readOnly') return <article key={`wizard-ticket-opaque-${index}`}>
                <strong>{read.status === 'unsupportedReadOnly' ? 'Ticket conservé · format futur' : 'Ticket conservé · contenu non validé'}</strong>
                <p>{read.reason}</p>
                <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(read.status === 'invalid' ? raw : read.snapshot, null, 2)}</pre></details>
              </article>;
              const ticket = read.ticket;
              const recordRaw = (dossier.assistedSemanticAdviceRecords ?? []).find(row => !!row && typeof row === 'object'
                && (row as { ticketReference?: unknown }).ticketReference === ticket.reference);
              const recordRead = recordRaw ? readHopV55AssistedAdviceWizardArchiveV1({ ticket, record: recordRaw }) : undefined;
              const answer = !recordRead ? 'sans réponse conservée' : recordRead.status !== 'readOnly'
                ? recordRead.status === 'invalid' ? 'réponse non validée' : 'réponse conservée sans conversion'
                : recordRead.record.semantic.kind === 'verifiedV6' ? 'réponse liée à cette lecture conservée' : 'réponse conservée en lecture seule';
              let version: string;
              try { version = `version « ${archivedDraftName(readHopV55WizardSourceSnapshotForArchiveV1({ workspace: dossier, archive: ticket.sourceArchive }).draft)} »`; }
              catch { version = 'version du brouillon non relue'; }
              return <article key={`${ticket.reference}:${index}`}>
                <strong>{ticket.question}</strong>
                <p><time dateTime={ticket.createdAt}>{localDateTime(ticket.createdAt)}</time> · brouillon figé · {version} · {answer}</p>
                {liveReopen ? <button disabled={busy}
                  onClick={() => void run(() => reopenWizardSemanticTicket(dossier.id, ticket.operationId))}>Rouvrir ce ticket exact</button>
                  : historyHost ? <button disabled={busy}
                    onClick={() => void run(() => readWizardArchivedAnswer(dossier.id, ticket.operationId))}>Relire cette réponse</button> : null}
                <details className="hv-details"><summary>Identités et références exactes</summary><dl>
                  <div><dt>Opération</dt><dd><code>{ticket.operationId}</code> · génération {ticket.generation}</dd></div>
                  <div><dt>Portée</dt><dd><code>{ticket.scope.kind}:{ticket.scope.id}</code></dd></div>
                  <div><dt>Version du brouillon</dt><dd><code>{ticket.sourceArchive.source.contentReference}</code></dd></div>
                  <div><dt>Lecture source</dt><dd><code>{ticket.references.sourceReadingReference}</code></dd></div>
                  <div><dt>Ticket</dt><dd><code>{ticket.reference}</code></dd></div>
                  <div><dt>Wire</dt><dd><code>{ticket.references.wireReference}</code></dd></div>
                  <div><dt>Périmètre</dt><dd><code>{JSON.stringify(ticket.candidatePolicy)}</code></dd></div>
                  {recordRead?.status === 'readOnly' ? <div><dt>Réponse</dt><dd><code>{recordRead.record.reference}</code></dd></div> : null}
                  {recordRead?.status === 'readOnly' && recordRead.record.semantic.kind === 'verifiedV6'
                    ? <div><dt>Format de la réponse</dt><dd><code>V6 vérifié</code></dd></div> : null}
                </dl></details>
              </article>;
            })) : null}
          {commits.length ? group(`Choix confirmés du brouillon · ${commits.length}`, commits.map(({ raw, read }, index) => {
            if (read.status !== 'readOnly') return <article key={`wizard-commit-opaque-${index}`}>
              <strong>{read.status === 'unsupportedReadOnly' ? 'Reçu conservé · format futur' : 'Reçu conservé · contenu non validé'}</strong>
              <p>{read.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(read.status === 'unsupportedReadOnly' ? read.raw : raw, null, 2)}</pre></details>
            </article>;
            const commit = read.commit;
            const checked = semanticHistory?.workspaceId === dossier.id && semanticHistory.commandId === commit.id ? semanticHistory : undefined;
            return <article key={commit.reference}>
              <strong>{commit.plan.reason}</strong>
              <p>Effectif le <time dateTime={commit.receipt.effectiveAt}>{localDateTime(commit.receipt.effectiveAt)}</time> · {commit.plan.selection
                .map(row => row.activeIntent.label).join(' · ')} · aucun effet sur la recette ni le brouillon</p>
              {historyHost ? <div className="hv-actions">
                <button disabled={busy} onClick={() => void run(() => readWizardSemanticAdoption(dossier.id, commit.id, commit.plan.ticket.operationId))}>Relire ce reçu</button>
                <button disabled={busy} onClick={() => void run(() => readWizardSemanticAdoption(dossier.id, commit.id, commit.plan.ticket.operationId, commit.plan))}>
                  Rejouer la même confirmation</button>
              </div> : null}
              {checked ? <p role="status">{checked.mode === 'replay'
                ? 'Rejeu : même reçu et même instant d’effet, aucun second enregistrement.'
                : 'Relecture : reçu, plan et version documentaire concordent.'} <time dateTime={checked.receipt.effectiveAt}>{localDateTime(checked.receipt.effectiveAt)}</time></p> : null}
              <details className="hv-details"><summary>Provenance et références exactes</summary><dl>
                <div><dt>Commande</dt><dd><code>{commit.id}</code></dd></div>
                <div><dt>Reçu</dt><dd><code>{commit.receipt.reference}</code></dd></div>
                <div><dt>Version documentaire</dt><dd><code>{commit.receipt.record.id}</code> · <code>{commit.receipt.record.reference}</code></dd></div>
                <div><dt>Tête attendue</dt><dd><code>{semanticHeadText(commit.receipt.expectedHead)}</code></dd></div>
                <div><dt>Ticket</dt><dd><code>{commit.sourceTicketReference}</code></dd></div>
                <div><dt>Effet recette</dt><dd><code>{commit.receipt.recipeEffect}</code></dd></div>
              </dl></details>
            </article>;
          })) : null}
          {answers.length ? group(`Réponses documentaires du brouillon · ${answers.length}`, <>
            <p className="hv-muted">Chaque correction s’ajoute comme nouvelle version sous l’origine de ce brouillon; les versions précédentes restent telles qu’elles ont été conservées.</p>
            {answers.map(version => {
              if (version.kind === 'opaque') return <article key={`wizard-answer-opaque-${version.index}`}>
                <strong>Réponse documentaire conservée · {version.label}</strong>
                <p>{version.reason} Elle reste en lecture seule; aucune correction n’en est déduite.</p>
                <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(version.raw, null, 2)}</pre></details>
              </article>;
              const record = version.record;
              const chain = wizardAnswerHead(answers, record.sourceReadingReference);
              const lastOfReading = [...answers].reverse().find(row => row.kind === 'readable'
                && row.record.sourceReadingReference === record.sourceReadingReference) === version;
              const isHead = chain.head === version;
              const operationId = isHead ? wizardTicketOperationFor(dossier, record.sourceReadingReference) : undefined;
              const terms = wizardAnswerTerms(record);
              const kept = terms.filter(term => term.active).map(term => term.label);
              const rejected = terms.filter(term => !term.active).map(term => term.label);
              return <article key={`${record.reference}:${version.index}`}>
                <strong>{wizardTransitionLabels[record.transition.kind]} · {record.originalQuestion}</strong>
                <p><time dateTime={record.transition.recordedAt}>{localDateTime(record.transition.recordedAt)}</time> · {isHead
                  ? 'version la plus récente' : 'version conservée'} · {wizardAnswerDraftVersion(dossier, record.sourceReadingReference)} · motif : {record.transition.reason}</p>
                <p>{record.readingContext.interpretation.text} · {wizardOutcomeLabel(record)}</p>
                <p>Termes retenus : {kept.length ? kept.join(' · ') : 'aucun'}{rejected.length ? ` · écartés : ${rejected.join(' · ')}` : ''}</p>
                {lastOfReading && chain.blocked ? <p role="status">{chain.blocked}</p> : null}
                {isHead && historyHost && !operationId ? <p role="status">Aucun ticket de cette lecture ne permet de vérifier ton accès; la réponse reste consultable sans correction.</p> : null}
                {isHead && historyHost && operationId ? <button disabled={busy || correction?.head.reference === record.reference}
                  onClick={() => setWizardCorrection({ workspaceId: dossier.id, operationId, sourceReadingReference: record.sourceReadingReference, head: record })}>
                  Corriger cette réponse</button> : null}
                <details className="hv-details"><summary>Identité et version exactes</summary><dl>
                  <div><dt>Réponse</dt><dd><code>{record.id}</code> · <code>{record.reference}</code></dd></div>
                  <div><dt>Registre des termes</dt><dd><code>{record.ledger.reference}</code></dd></div>
                  <div><dt>Lecture source</dt><dd><code>{record.sourceReadingReference}</code></dd></div>
                  <div><dt>Version du brouillon</dt><dd><code>{record.preparation.source.contentReference}</code></dd></div>
                  {record.transition.parentRecordReference ? <div><dt>Version précédente</dt><dd><code>{record.transition.parentRecordReference}</code></dd></div> : null}
                  <div><dt>Périmètre des matières</dt><dd>{wizardPolicyLabel(record.readingContext.candidatePolicy)}</dd></div>
                </dl></details>
              </article>;
            })}
          </>) : null}
          {correction ? <HopV55WizardAnswerCorrection key={correction.head.reference} head={correction.head} busy={busy}
            source={wizardAnswerDraftSource(dossier, correction.sourceReadingReference, origin.draftId)}
            onPreview={input => runWizardCorrection(() => previewWizardAnswerCorrection(correction, input))}
            onSave={preview => runWizardCorrection(async () => {
              try { await saveWizardAnswerCorrection(preview); }
              catch (cause) { await refreshWizardDossier(preview.workspaceId).catch(() => undefined); throw cause; }
              setWizardCorrection(undefined);
              setNotice('Correction enregistrée comme nouvelle version de la réponse du brouillon; la version précédente reste consultable.');
            })}
            onCancel={() => setWizardCorrection(undefined)} /> : null}
          {archived ? <section className="hv-copy" aria-label="Réponse conservée du brouillon" data-testid="wizard-archived-answer">
            <strong>Lecture conservée · {archived.question}</strong>
            <p role="status">Contexte figé au moment de cette lecture : version « {archivedDraftName(archived.snapshot.recipe)} » du brouillon <code>{archived.draftId}</code>. Ce n’est ni l’état actuel du créateur, ni la recette enregistrée du même identifiant.</p>
            {archived.record ? <HopV55SemanticArchivedAnswerV1 record={archived.record} />
              : <p>Aucune réponse n’est conservée pour cette lecture; rien n’est envoyé depuis cette relecture.</p>}
            {commits.flatMap(({ read }) => read.status === 'readOnly' && archived.record
              && read.commit.sourceTicketReference === archived.record.ticketReference ? [read.commit] : []).map(commit => <p key={commit.reference}>
                <strong>Choix confirmé</strong> · {commit.plan.selection.map(row => row.activeIntent.label).join(' · ')} · motif : {commit.plan.reason}
              </p>)}
            <details className="hv-details"><summary>Provenance de cette relecture</summary><dl>
              <div><dt>Version du brouillon</dt><dd><code>{archived.snapshot.reference}</code></dd></div>
              <div><dt>Périmètre de la conversation</dt><dd><code>{archived.scope.kind}:{archived.scope.id}</code></dd></div>
              <div><dt>Périmètre des matières</dt><dd><code>{JSON.stringify(archived.candidatePolicy)}</code></dd></div>
              <div><dt>Opération</dt><dd><code>{archived.operationId}</code></dd></div>
              {archived.record ? <div><dt>Réponse</dt><dd><code>{archived.record.reference}</code> · {archived.record.semantic.kind === 'verifiedV6'
                ? 'format V6 vérifié' : 'conservée sans conversion'}</dd></div> : null}
            </dl></details>
            <button type="button" onClick={() => setWizardArchiveView(undefined)}>Fermer cette relecture</button>
          </section> : null}
        </article>;
      })}
    </section>;
  }
  function renderAssistedMaterialPicker(materials: PreparedBrewingScenarioContext['runtime']['materials']) {
    return <>
      <p><strong>Périmètre actuel</strong> · {assistedMaterialIds.length
        ? `${assistedMaterialIds.length} matière${assistedMaterialIds.length > 1 ? 's' : ''} choisie${assistedMaterialIds.length > 1 ? 's' : ''}`
        : 'Aucune matière choisie · périmètre explicite vide'}</p>
      <details className="hv-details"><summary>Explorer les matières chargées et choisir un périmètre</summary>
        <p>La liste provient du contexte déjà chargé. Ouvrir cette liste ne choisit aucune matière.</p>
        <div className="hv-actions">{materials.map(material => {
          const active = assistedMaterialIds.includes(material.id);
          return <button type="button" key={material.id} aria-pressed={active}
            onClick={() => setAssistedMaterialIds(ids => active ? ids.filter(id => id !== material.id) : [...ids, material.id])}>
            {active ? '✓ ' : '+ '}{material.name}<small>{material.id}</small>
          </button>;
        })}</div>
      </details>
    </>;
  }
  function displaySnapshot(ownerRecord: BrewingScenarioRecordRead, snapshot: BrewingScenarioSnapshotV1, historical = false) {
    setRecord(ownerRecord); setDisplayedSnapshot(snapshot); setResult(snapshot.result);
    setHistoricalView(historical);
    setCompareArchiveToCurrentReference(false); setReferenceComparison(undefined);
    if (historical) setEditorOpen(false);
    targetRef.current = snapshot.result.requestSnapshot.target; setComparisonTarget(snapshot.result.requestSnapshot.target);
    const all = [snapshot.result.baseline, ...snapshot.result.branches];
    setBranchIds(all.map(row => row.id));
    setAxisIds([...new Map(all.flatMap(row => row.dependencySnapshot.engineData.knowledge).filter((row): row is HopAxis => row.kind === 'axis').map(row => [row.id, row])).keys()]);
    const archivedChoice = [...ownerRecord.events].reverse().find(event => event.kind === 'branchPreferred' && event.payload.snapshotReference === snapshot.reference);
    setSelectedBranchId(historical && archivedChoice?.kind === 'branchPreferred' ? archivedChoice.payload.branchId : undefined);
    setProgramPreview(undefined); 
    const snapshotIntent = workspaceRef.current?.snapshotIntents?.find(row => row.snapshotReference === snapshot.reference);
    const originalIntent = snapshotIntent?.intent;
    const snapshotDemand = originalIntent ?? emptyIntent;
    intentRef.current = snapshotDemand; setIntent(snapshotDemand); setQuestion(snapshotDemand.question);
    // An older snapshot can lack a reading link. Keep that absence rather than
    // attaching the workspace's newer question to this frozen prediction.
    if (workspaceRef.current) restoreReading(workspaceRef.current, snapshotIntent?.decisionReadingReference, historical, true);
  }
  async function simulate(branches: BrewingScenarioBranchRequest[], reuseScenario = false) {
    if (pendingPreparationId) throw Error('Une prévision attend son rattachement. Termine cette reprise avant de préparer un autre calcul.');
    const ctx = await currentContext();
    let prep = prepareBrewingScenarioContext(ctx);
    const activeProgram = workspaceRef.current ? activeWorkspaceProgramCopy(workspaceRef.current) : undefined;
    if (activeProgram) branches = branches.map(branch => branch.programChanges ? { ...branch, programChanges: rebaseHopV55ProgramCopy(prep, activeProgram, branch.programChanges) } : branch);
    const current = prep.runtime.current;
    const referenceWorkspace = await getReferenceWorkspace(ctx, prep);
    const resolved = prepareHopV55AdoptedContext({ context: ctx, workspace: referenceWorkspace,
      expected: getHopV55ReferenceProjection(referenceWorkspace)?.currentReference ?? null });
    if (resolved.resolution.status !== 'absent' && resolved.resolution.status !== 'resolved') {
      throw Error('La référence adoptée n’est plus disponible sous son identité exacte. Relis-la avant une nouvelle simulation.');
    }
    prep = resolved.sourcePrepared;
    const binding = 'cultureBinding' in resolved ? resolved.cultureBinding : undefined;
    const adoptedBaseline = activeFutureDraftRef.current?.hypotheticalBaseline
      ?? ('comparisonBaseline' in resolved ? resolved.comparisonBaseline : undefined);
    if (!current && !adoptedBaseline) throw Error('Déclare une référence hypothétique avant le calcul. L’absence de programme ne signifie pas zéro houblon.');
    const scenarioId = reuseScenario && result ? result.scenarioId : uid('scenario');
    const previousRead = reuseScenario && result ? await services.scenarios.read(services.ownerKey, scenarioId) : null;
    const previous = previousRead?.status === 'available' ? previousRead.record : undefined;
    const request = createHopV55ScenarioRequest({ prepared: prep, scenarioId, revision: previous ? previous.dossier.currentResultRevision + 1 : 1,
      reference: adoptedBaseline, branches, intent: intentRef.current, target: targetRef.current,
      assumptions: result?.requestSnapshot.assumptions });
    const preparationId = uid('preparation');
    setPendingPreparationId(preparationId);
    try {
      const committed = await commitHopV55Scenario({ services, workspace: referenceWorkspace, ownerKey: services.ownerKey,
        workspaceId: referenceWorkspace.id, id: preparationId, eventId: uid('result-event'), scenarioId,
        operation: previous ? 'reevaluate' : 'create', request, runtimeReference: runtimeReference(prep),
        intent: structuredClone(intentRef.current), reference: binding?.reference ?? null,
        ...(binding ? { cultureBinding: binding } : {}),
        ...(readingArchiveRef.current && readingArchiveRef.current.reading.intent.question === intentRef.current.question ? { decisionReadingReference: readingArchiveRef.current.contentReference } : {}),
        source: workspaceSource(referenceWorkspace), createdAt: iso(),
        ...(previous ? { prior: { scenarioId, snapshotReference: previous.currentSnapshot.reference,
          resultRevision: previous.dossier.currentResultRevision, dossierRevision: previous.dossier.revision } } : {}),
        compute: next => { setSimulations(count => count + 1); return simulateBrewingScenario(next, prep.runtime); } });
      receiveScenario(committed); setPendingPreparationId(undefined);
      setNotice('Prévision conservée localement avec ses paramètres, sources et hypothèses.'); await refreshRecords();
    } catch (err) {
      const savedWorkspace = await services.workspaces.read(services.ownerKey, referenceWorkspace.id);
      if (savedWorkspace) { workspaceRef.current = savedWorkspace; setWorkspace(savedWorkspace); }
      if (!savedWorkspace?.scenarioPreparations?.some(row => row.id === preparationId)) setPendingPreparationId(undefined);
      throw err;
    }
  }
  function explorationTrialIds(commandId: string) {
    const match = /^exploration-command-([0-9a-f-]{20,64})$/iu.exec(commandId);
    if (!match) throw Error('L’identifiant du même essai ne peut pas être repris de façon sûre. Recrée les lignes explicitement.');
    const suffix = match[1].toLowerCase();
    return { scenarioId: `exploration-scenario-${suffix}`,
      scenarioPreparationId: `exploration-preparation-${suffix}`, eventId: `exploration-event-${suffix}` };
  }
  function readExplorationTrialComparison(value: { snapshot: unknown; sourceMaterial: HopDecisionMaterial;
    alternativeMaterial: HopDecisionMaterial }) {
    const read = readHopV55ContextualComparisonSnapshot(value.snapshot, {
      sourceMaterial: value.sourceMaterial, alternativeMaterial: value.alternativeMaterial });
    return read.status === 'current' ? { status: 'current' as const, sourceId: read.sourceId, alternativeId: read.alternativeId,
      sourceMaterialReference: read.sourceMaterialReference, alternativeMaterialReference: read.alternativeMaterialReference,
      readingReference: read.readingReference, profileSnapshotReference: read.profileSnapshotReference, reference: read.reference }
      : { status: read.status === 'unsupported' ? 'unsupported' as const : 'invalid' as const, reason: read.reason };
  }
  function buildExplorationTrialCapture(entry: HopV55ExplorationTrialEntryV1, ctx: BrewerContext,
    prep: PreparedBrewingScenarioContext, ws: HopV55Workspace): HopV55ExplorationTrialCaptureV1 {
    const currentProgram = activeDecisionProgram(prep, ws);
    const preparedRuntimeReference = runtimeReference(prep);
    // A stale or invalid NR resolution yields no origin and is refused by this first check.
    const origin = explorationTrialOrigin(ctx, prep, ws, currentProgram, preparedRuntimeReference);
    if (!origin || origin.originContext.reference !== entry.originContext.reference) {
      throw Error('La source, le runtime, la référence NR ou la lecture diffère du premier geste. Recrée explicitement les lignes sous ce nouveau cadre.');
    }
    const { originContext, cultureBinding } = origin;
    const currentSource = workspaceSource(ws);
    const sourceReference = trialSourceReference(ctx, ws, currentSource);
    const activeArchive = readingArchiveRef.current && !readingHistoricalRef.current
      && readingArchiveRef.current.reading.intent.question === intentRef.current.question ? readingArchiveRef.current : null;
    if ((activeArchive?.contentReference ?? null) !== entry.originContext.readingReference) {
      throw Error('La lecture source a changé depuis le premier geste. Relis la question et recrée les lignes sous cette archive.');
    }
    let j5Branch = structuredClone(entry.branch);
    let programCopyRebase: HopV55ExplorationTrialProgramCopyRebaseV1 | null = null;
    const programOrigin = originContext.programOrigin;
    if (programOrigin.kind === 'programCopy') {
      const copy = ws.programCopies?.find(row => row.id === programOrigin.id);
      const physicalProgram = prep.runtime.current?.program;
      if (!copy || !physicalProgram || !Array.isArray(entry.branch.programChanges)) {
        throw Error('La copie ou le programme physique source de ce rebase n’est plus disponible exactement.');
      }
      const rebasedChanges = rebaseHopV55ProgramCopy(prep, copy, entry.branch.programChanges);
      j5Branch = { ...structuredClone(entry.branch), programChanges: structuredClone(rebasedChanges) };
      programCopyRebase = createHopV55ExplorationTrialProgramCopyRebaseV1({ copy: structuredClone(copy),
        sourceProgram: structuredClone(physicalProgram), sourceProgramReference: programFingerprint(physicalProgram),
        originalBranchReference: hopAdviceContentReference('hop-v55-exploration-trial-j5-branch-v1', entry.branch),
        rebasedChanges: structuredClone(rebasedChanges),
        j5BranchReference: hopAdviceContentReference('hop-v55-exploration-trial-j5-branch-v1', j5Branch) });
    }
    const current = prep.runtime.current;
    const activeIntent = structuredClone(intentRef.current);
    if (activeIntent.question !== entry.preparationInput.intent.question) {
      throw Error('La question utilisée pour l’essai diffère de la question J1 conservée. Relis explicitement cette question.');
    }
    return {
      ownerKey: services.ownerKey, workspaceId: ws.id, source: currentSource, sourceReference,
      runtimeReference: preparedRuntimeReference, cultureBinding, readingArchive: activeArchive ?? null,
      program: structuredClone(currentProgram!), programOrigin: structuredClone(originContext.programOrigin),
      j5Branch, programCopyRebase, intent: activeIntent, target: structuredClone(targetRef.current ?? null),
      materials: structuredClone(prep.runtime.materials),
      yeasts: structuredClone(prep.runtime.engineData.knowledge.filter((row): row is HopYeast => row.kind === 'yeast')),
      input: { reference: current?.inputReference ?? null, volumeL: current?.input.volumeL ?? null,
        yeastId: current?.input.yeastId ?? null }, workspaceProfiles: structuredClone(ws.explorationProfiles ?? []),
    };
  }
  async function persistExplorationTrialPreparation(preparation: HopV55ExplorationTrialPreparationV1,
    initial: HopV55Workspace): Promise<HopV55Workspace> {
    let latest = initial;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) {
        const loaded = await services.workspaces.read(services.ownerKey, preparation.workspaceId);
        if (!loaded || loaded.ownerKey !== services.ownerKey) throw Error('Le dossier exact de cet essai n’est plus disponible.');
        latest = loaded;
      }
      const next = appendHopV55ExplorationTrialPreparationRecord(latest, preparation);
      if ((latest.explorationTrialPreparations ?? []).length === (next.explorationTrialPreparations ?? []).length) return latest;
      try {
        const saved = await services.workspaces.save({ ...next, updatedAt: iso() }, latest.revision);
        if (workspaceRef.current?.id === saved.id) { workspaceRef.current = saved; setWorkspace(saved); }
        setWorkspaces(rows => [...rows.filter(row => row.id !== saved.id), saved]);
        return saved;
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('La préparation exacte reste en attente du même CAS de workspace.');
  }
  async function persistExplorationTrialReceipt(receipt: ReturnType<typeof createHopV55ExplorationTrialReceiptV1>,
    initial: HopV55Workspace): Promise<HopV55Workspace> {
    let latest = initial;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt) {
        const loaded = await services.workspaces.read(services.ownerKey, receipt.workspaceId);
        if (!loaded || loaded.ownerKey !== services.ownerKey) throw Error('Le dossier de la branche calculée n’est plus disponible; son reçu reste à reprendre.');
        latest = loaded;
      }
      const next = appendHopV55ExplorationTrialReceiptRecord(latest, receipt);
      if ((latest.explorationTrialReceipts ?? []).length === (next.explorationTrialReceipts ?? []).length) return latest;
      try {
        const saved = await services.workspaces.save({ ...next, updatedAt: iso() }, latest.revision);
        if (workspaceRef.current?.id === saved.id) { workspaceRef.current = saved; setWorkspace(saved); }
        setWorkspaces(rows => [...rows.filter(row => row.id !== saved.id), saved]);
        return saved;
      } catch (error) {
        if ((error as { code?: string }).code !== 'staleRevision' || attempt === 2) throw error;
      }
    }
    throw Error('Le reçu exact J5 reste en attente du même CAS de workspace.');
  }
  async function publishExplorationTrialIfCurrent(committed: HopV55ScenarioCommitResult, savedWorkspace: HopV55Workspace,
    originReference: string): Promise<void> {
    if (!alive.current || workspaceRef.current?.id !== savedWorkspace.id) return;
    try {
      // Publication boundary: a new exact read decides what the screen may show.
      const { ctx, prep } = await currentContextFrame();
      const ws = workspaceRef.current;
      if (!ws || ws.id !== savedWorkspace.id) return;
      const currentProgram = activeDecisionProgram(prep, ws);
      const frame = makeExplorationTrialOriginContext(ctx, prep, ws, currentProgram);
      if (frame?.reference === originReference) {
        receiveScenario({ ...committed, workspace: savedWorkspace });
        setPendingPreparationId(undefined);
        setNotice('Essai exact conservé et affiché avec sa copie locale distincte.');
      } else {
        workspaceRef.current = savedWorkspace; setWorkspace(savedWorkspace);
        setNotice('L’essai a été conservé sous sa source d’origine; le contexte affiché a changé et aucun résultat ne lui a été substitué.');
      }
    } catch {
      if (alive.current && workspaceRef.current?.id === savedWorkspace.id) {
        workspaceRef.current = savedWorkspace; setWorkspace(savedWorkspace);
      }
    }
    await refreshRecords();
  }
  async function recoverCompletedExplorationTrial(workspaceToCheck: HopV55Workspace,
    preparation: HopV55ExplorationTrialPreparationV1, readOnlyArchive = false): Promise<boolean> {
    const receiptRaw = (workspaceToCheck.explorationTrialReceipts ?? []).find(row =>
      (row as { preparationReference?: string } | null)?.preparationReference === preparation.reference);
    const receiptRead = receiptRaw && readHopV55ExplorationTrialReceiptV1(receiptRaw);
    const recordRead = await services.scenarios.read(services.ownerKey, preparation.scenarioId);
    const archivedSnapshotReference = receiptRead?.status === 'available' ? receiptRead.receipt.snapshotReference : undefined;
    const hasExactResult = recordRead?.status === 'available' && recordRead.record.events.some(event =>
      (event.kind === 'resultSaved' || event.kind === 'resultRevised') && event.eventId === preparation.eventId
      && (archivedSnapshotReference === undefined || event.payload.snapshot.reference === archivedSnapshotReference));
    if (receiptRaw && receiptRead?.status !== 'available') throw Error('Le reçu d’essai conservé est futur ou altéré; aucun recalcul n’est autorisé.');
    if (receiptRead?.status === 'available' && !hasExactResult) throw Error('Le reçu d’essai référence un snapshot J5 indisponible; aucune simulation de remplacement n’est autorisée.');
    if (!hasExactResult) return false;
    const committed = await resumeHopV55ScenarioCommit({ services, ownerKey: services.ownerKey,
      workspaceId: preparation.workspaceId, preparationId: preparation.scenarioPreparationId });
    const receipt = receiptRead?.status === 'available' ? receiptRead.receipt : createHopV55ExplorationTrialReceiptV1({
      preparation, result: { scenarioId: committed.snapshot.result.scenarioId,
        snapshotReference: committed.snapshot.reference, branchId: preparation.j5Branch.id }, recordedAt: preparation.recordedAt });
    const saved = await persistExplorationTrialReceipt(receipt, committed.workspace);
    if (readOnlyArchive && alive.current) {
      if (workspaceRef.current?.id === saved.id) { workspaceRef.current = saved; setWorkspace(saved); }
      setWorkspaces(rows => [...rows.filter(row => row.id !== saved.id), saved]);
      displaySnapshot(committed.record, committed.snapshot, true); setView('decide');
      setNotice('Prévision exacte de l’essai rouverte en lecture historique. Aucun J1, rebase ou J5 n’a été relancé.');
    } else await publishExplorationTrialIfCurrent(committed, saved, preparation.entry.originContext.reference);
    return true;
  }
  async function reopenExplorationTrial(preparationReference: string): Promise<void> {
    const current = workspaceRef.current;
    if (!current) throw Error('Aucun dossier local ne contient cette préparation d’essai.');
    const raw = (current.explorationTrialPreparations ?? []).find(row =>
      (row as { reference?: string } | null)?.reference === preparationReference);
    const read = raw && readHopV55ExplorationTrialPreparationV1(raw);
    if (!read || read.status !== 'available') throw Error('Cette préparation d’essai est future ou illisible; elle reste en lecture seule.');
    if (await recoverCompletedExplorationTrial(current, read.preparation, true)) return;
    if (workspaceRef.current?.id !== read.preparation.workspaceId) throw Error('La préparation appartient à un autre dossier; elle n’est pas reprise sous la source courante.');
    await prepareExplorationTrial(read.preparation.entry);
  }
  async function prepareExplorationTrial(entry: HopV55ExplorationTrialEntryV1): Promise<void> {
    const ids = explorationTrialIds(entry.commandId);
    const initialWorkspace = await services.workspaces.read(services.ownerKey, entry.originContext.workspaceId);
    if (!initialWorkspace || initialWorkspace.ownerKey !== services.ownerKey) throw Error('Le dossier source de cet essai n’est plus disponible.');
    const existingRaw = (initialWorkspace.explorationTrialPreparations ?? []).find(row =>
      (row as { id?: string } | null)?.id === entry.commandId);
    let storedPreparation: HopV55ExplorationTrialPreparationV1 | undefined;
    if (existingRaw) {
      const existingRead = readHopV55ExplorationTrialPreparationV1(existingRaw);
      if (existingRead.status !== 'available') throw Error('Cette commande d’essai est future ou illisible; elle reste conservée en lecture seule.');
      storedPreparation = existingRead.preparation;
      if (hopAdviceContentReference('hop-v55-exploration-trial-entry-identity-v1', storedPreparation.entry)
        !== hopAdviceContentReference('hop-v55-exploration-trial-entry-identity-v1', entry)) {
        throw Error('Cette commande possède déjà une préparation différente; l’archive originale reste intacte.');
      }
      if (await recoverCompletedExplorationTrial(initialWorkspace, storedPreparation)) return;
    }
    if (workspaceRef.current?.id !== entry.originContext.workspaceId) {
      throw Error('Le dossier actif a changé depuis le premier geste. Relis sa source et recrée explicitement les lignes.');
    }

    const generation = workspaceGeneration.current;
    const { ctx, prep } = await currentContextFrame();
    const ws = await getReferenceWorkspace(ctx, prep);
    assertWorkspaceScope(generation, ws.id);
    if (ws.id !== entry.originContext.workspaceId) throw Error('Le dossier actif a changé avant le staging de cet essai.');
    const capture = buildExplorationTrialCapture(entry, ctx, prep, ws);
    let preparation = storedPreparation;
    if (preparation) {
      const current = confirmHopV55ExplorationTrialV1({ preparation, current: { ...capture, entry,
        readComparison: readExplorationTrialComparison } });
      if (current.status !== 'current') throw Error(current.reason);
    } else {
      const created = prepareHopV55ExplorationTrialV1({ ...capture, entry, identity: { id: entry.commandId,
        scenarioId: ids.scenarioId, scenarioPreparationId: ids.scenarioPreparationId, eventId: ids.eventId, recordedAt: iso() },
        readComparison: readExplorationTrialComparison });
      if (created.status !== 'ready') throw Error(created.reason);
      preparation = created.preparation;
      // The pre-await frame proves nothing once this CAS returns. The staged capture is
      // confirmed below against a fresh read, and again inside J5's compute.
      await persistExplorationTrialPreparation(preparation, ws);
    }
    if (!preparation) throw Error('La préparation scellée de cet essai est absente.');
    if (pendingPreparationId && pendingPreparationId !== preparation.scenarioPreparationId) {
      throw Error('Une autre prévision attend son rattachement. Termine-la avant de lancer cet essai.');
    }
    const sealedPreparation: HopV55ExplorationTrialPreparationV1 = preparation;
    setPendingPreparationId(preparation.scenarioPreparationId);
    let j5Started = false;
    try {
      const latest = await currentContextFrame();
      const latestWorkspace = await getReferenceWorkspace(latest.ctx, latest.prep);
      const latestCapture = buildExplorationTrialCapture(entry, latest.ctx, latest.prep, latestWorkspace);
      const confirmed = confirmHopV55ExplorationTrialV1({ preparation, current: { ...latestCapture, entry,
        readComparison: readExplorationTrialComparison } });
      if (confirmed.status !== 'current') throw Error(confirmed.reason);
      // The J5 request and its staged runtime reference come from this confirmed read.
      const resolved = adoptedContextForPrepared(latest.prep, latestWorkspace,
        getHopV55ReferenceProjection(latestWorkspace)?.currentReference ?? null);
      if (resolved.resolution.status !== 'absent' && resolved.resolution.status !== 'resolved') {
        throw Error('La référence NR a changé avant J5; l’essai reste archivé sans calcul.');
      }
      const baseline = activeFutureDraftRef.current?.hypotheticalBaseline
        ?? ('comparisonBaseline' in resolved ? resolved.comparisonBaseline : undefined);
      const request = createHopV55ScenarioRequest({ prepared: resolved.sourcePrepared, scenarioId: preparation.scenarioId,
        revision: 1, reference: baseline, branches: [confirmed.branch], intent: structuredClone(preparation.intent),
        target: preparation.target ?? undefined });
      j5Started = true;
      const committed = await commitHopV55Scenario({ services, workspace: latestWorkspace, ownerKey: services.ownerKey,
        workspaceId: preparation.workspaceId, id: preparation.scenarioPreparationId, eventId: preparation.eventId,
        scenarioId: preparation.scenarioId, operation: 'create', request, runtimeReference: latestCapture.runtimeReference,
        intent: structuredClone(preparation.intent), reference: preparation.cultureBinding?.reference ?? null,
        ...(preparation.cultureBinding ? { cultureBinding: preparation.cultureBinding } : {}),
        ...(preparation.readingReference ? { decisionReadingReference: preparation.readingReference } : {}),
        source: preparation.source, createdAt: preparation.recordedAt,
        compute: async next => {
          // The commit's own workspace reads and CAS are the last DAO awaits before J5, so the
          // read above proves nothing here. The exact source is read again with no await left
          // before the simulation; stock, catalogue, cultures, volume or journal changed meanwhile
          // refuse J5 instead of computing it under the sealed capture.
          const computeContext = await readExactCurrentContext();
          const computePrepared = prepareBrewingScenarioContext(computeContext);
          try {
            const computeCapture = buildExplorationTrialCapture(entry, computeContext, computePrepared, latestWorkspace);
            const fresh = confirmHopV55ExplorationTrialV1({ preparation: sealedPreparation, current: { ...computeCapture, entry,
              readComparison: readExplorationTrialComparison } });
            if (fresh.status !== 'current') throw Error(fresh.reason);
            if (computeCapture.runtimeReference !== latestCapture.runtimeReference) {
              throw Error('Le runtime relu avant J5 diffère de la préparation J5 conservée; aucun calcul n’est lancé.');
            }
          } catch (error) {
            // Refused: the screen shows this newer read; it is never handed to the J5 engine.
            if (alive.current) { setContext(computeContext); setPrepared(computePrepared); }
            throw error;
          }
          setSimulations(count => count + 1);
          return simulateBrewingScenario(next, computePrepared.runtime);
        } });
      const receipt = createHopV55ExplorationTrialReceiptV1({ preparation,
        result: { scenarioId: committed.snapshot.result.scenarioId, snapshotReference: committed.snapshot.reference,
          branchId: confirmed.branch.id }, recordedAt: preparation.recordedAt });
      const savedWorkspace = await persistExplorationTrialReceipt(receipt, committed.workspace);
      await publishExplorationTrialIfCurrent(committed, savedWorkspace, preparation.entry.originContext.reference);
    } catch (error) {
      if (!j5Started) setPendingPreparationId(undefined);
      throw error;
    }
  }
  function runtimeReference(prep: PreparedBrewingScenarioContext) {
    return hopV55ScenarioRuntimeReference(prep.runtime);
  }
  function receiveScenario(committed: HopV55ScenarioCommitResult) {
    if (!alive.current) return;
    workspaceRef.current = committed.workspace; setWorkspace(committed.workspace);
    displaySnapshot(committed.record, committed.snapshot, committed.snapshot.reference !== committed.record.currentSnapshot.reference);
    setEditorOpen(false); setView('decide');
  }
  async function resumeScenario(preparationId: string, permitCompute = false) {
    const ws = workspaceRef.current;
    const preparation = ws?.scenarioPreparations?.find(row => row.id === preparationId);
    if (!ws || !preparation) throw Error('Cette préparation n’est pas disponible dans le dossier.');
    const resolved = permitCompute ? prepareHopV55AdoptedContext({ context: await currentContext(), workspace: await getReferenceWorkspace(),
      expected: preparation.reference }) : undefined;
    if (resolved && resolved.resolution.status !== 'absent' && resolved.resolution.status !== 'resolved') {
      throw Error('La référence a changé depuis cette préparation. Relis son reçu ou prépare explicitement un nouvel essai.');
    }
    const prep = resolved?.sourcePrepared;
    const freshRequest = prep ? createHopV55ScenarioRequest({ prepared: prep, scenarioId: preparation.scenarioId,
      revision: preparation.request.revision, reference: preparation.request.baseline.kind === 'hypothetical' ? preparation.request.baseline : undefined,
      branches: structuredClone(preparation.request.branches), assumptions: structuredClone(preparation.request.assumptions),
      intent: preparation.intent, target: preparation.request.target }) : undefined;
    const committed = await resumeHopV55ScenarioCommit({ services, ownerKey: services.ownerKey, workspaceId: ws.id,
      preparationId, ...(prep && freshRequest ? { freshRequest, freshSource: workspaceSource(ws), freshRuntimeReference: runtimeReference(prep),
        freshCultureBinding: resolved && 'cultureBinding' in resolved ? resolved.cultureBinding : null,
        compute: (next: BrewingScenarioRequest) => { setSimulations(count => count + 1); return simulateBrewingScenario(next, prep.runtime); } } : {}) });
    receiveScenario(committed); setPendingPreparationId(undefined); await refreshRecords();
    setNotice(committed.computed ? 'Calcul repris explicitement puis rattaché à son dossier.' : 'Reçu exact relu et rattaché. Aucun calcul supplémentaire.');
  }
  async function readQuestion(originalQuestion = question) {
    const generation = workspaceGeneration.current;
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const ws = await getReferenceWorkspace(ctx, prep);
    assertWorkspaceScope(generation, ws.id);
    if (questionRef.current !== originalQuestion) throw Error('Le texte de la question a changé pendant sa lecture. Relis explicitement la formulation courante.');
    const { reading: parsed, scopeDrafts } = readHopV55QuestionSemanticWithScopesV1(originalQuestion, prep);
    const archive = archiveHopV55SemanticReadingV1({ reading: parsed, scopeDrafts, id: uid('reading'), ownerKey: services.ownerKey,
      workspaceId: ws.id, recordedAt: iso(), source: decisionSource(ws), runtimeReference: runtimeReference(prep) });
    await persistSemanticDecisionArchive(archive, ws, { question: originalQuestion, generation });
    if (documentarySynthesisEnabled) await prepareDocumentaryAnswer(archive, prep);
    if (parsed.branches.length) { setDraftBranch(parsed.branches[0]); await simulate(parsed.branches); }
    else setView('decide');
  }
  async function rereadDisplayedQuestion() {
    const archive = readingArchiveRef.current;
    if (!archive) return readQuestion();
    const docRow = documentaryRecordId ? workspaceRef.current?.documentaryAnswers?.find(row => row.id === documentaryRecordId)
      : [...(workspaceRef.current?.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === archive.contentReference);
    const docRead = docRow && readHopV55DocumentaryAnswerRecord(docRow);
    if (docRead?.status === 'readOnly' && docRead.record.format === 'hop-v55-documentary-answer-record-v2') {
      await reexaminePropertyAdvice(docRead.record.id, docRead.record.reference);
      return;
    }
    if (archive.format === 'hop-v55-decision-reading-v4') {
      const generation = workspaceGeneration.current;
      const displayedQuestion = questionRef.current;
      const ctx = await currentContext();
      const prep = prepareBrewingScenarioContext(ctx);
      const ws = await getReferenceWorkspace(ctx, prep);
      if (readingArchiveRef.current?.contentReference !== archive.contentReference || readingHistoricalRef.current !== true) {
        throw Error('La lecture affichée a changé pendant la relecture. L’archive consultée reste intacte.');
      }
      const reinterpreted = createHopV55SemanticReinterpretationArchiveV1({ parent: archive, prepared: prep, id: uid('reading-reinterpretation'),
        recordedAt: iso(), source: decisionSource(ws), runtimeReference: runtimeReference(prep),
        reason: 'Même question relue explicitement dans le contexte actif.', actorLabel: 'Brasseur' });
      await persistSemanticDecisionArchive(reinterpreted, ws, { reference: archive.contentReference, historical: true,
        question: displayedQuestion, generation });
      if (documentarySynthesisEnabled) await prepareDocumentaryAnswer(reinterpreted, prep);
      setView('decide');
      setNotice('Nouvelle lecture sémantique V4 conservée avec sa filiation. L’archive consultée reste intacte.');
      return;
    }
    if (archive.format !== 'hop-v55-decision-reading-v2' && archive.format !== 'hop-v55-decision-reading-v3'
      || !['exploreStrategies', 'understandProducts'].includes(archive.reading.response?.actionKind ?? '')) {
      return readQuestion(archive.reading.intent.question);
    }
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const ws = await getReferenceWorkspace(ctx, prep);
    const active = activeDecisionProgram(prep, ws);
    const next = reevaluateHopV55DecisionReading({ reading: archive.reading, prepared: prep, archiveFormat: archive.format,
      ...(active ? { program: active } : {}) });
    const refreshed = await persistDecisionReading(next, ws, prep);
    if (documentarySynthesisEnabled) await prepareDocumentaryAnswer(refreshed, prep);
    setView('decide'); setNotice('Même demande et critères conservés, réponse relue dans le contexte actif. L’ancienne lecture reste intacte.');
  }
  async function persistDecisionReading(nextReading: HopV55QuestionReading, ws: HopV55Workspace,
    prep: PreparedBrewingScenarioContext, programPreparation?: HopV55ArchivedDecisionProgramPreparationV1,
    scopeDrafts?: readonly HopV55QuestionScopeV1[]) {
    setDocumentaryRecordId(undefined);
    retainDisplayedV4Identity(undefined);
    setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined);
    const common = { id: uid('reading'), ownerKey: services.ownerKey, workspaceId: ws.id,
      recordedAt: iso(), reading: nextReading, source: decisionSource(ws), runtimeReference: runtimeReference(prep),
      ...(programPreparation ? { programPreparation } : {}) };
    const previous = readingArchiveRef.current;
    const previousScopes = scopeDrafts === undefined && previous?.format === 'hop-v55-decision-reading-v3'
      && previous.reading.intent.question === nextReading.intent.question ? previous : undefined;
    const transition = { actId: uid('question-scopes'), kind: 'create' as const, reason: 'Portées proposées depuis les fragments exacts de la question.',
      recordedAt: common.recordedAt, actor: { origin: 'proposal' as const, label: 'Lecture proposée' } };
    const archive = previousScopes ? createHopV55DecisionReadingArchiveV3({ ...common,
      scopeLedger: previousScopes.scopeLedger, transition: previousScopes.transition })
      : scopeDrafts?.length ? createHopV55DecisionReadingArchiveV3({ ...common, transition,
        scopeLedger: createHopV55QuestionScopeLedgerV1({ question: nextReading.intent.question, reading: nextReading, scopeDrafts, transition }) })
      : createHopV55DecisionReadingArchiveV2(common);
    await saveFullWorkspace({ ...ws, intent: nextReading.intent, decisionReadings: [...(ws.decisionReadings ?? []), archive] });
    intentRef.current = nextReading.intent; setIntent(nextReading.intent); setQuestion(nextReading.intent.question);
    readingArchiveRef.current = archive; setReadingArchive(archive); setReading(hopV55DecisionReadingForDisplay(archive));
    setReadingHistorical(false); setView('decide');
    return archive;
  }
  async function persistSemanticDecisionArchive(archive: HopV55DecisionReadingArchiveV4, ws: HopV55Workspace,
    expectedSelection?: { reference?: string; historical?: boolean; question?: string; generation?: number }) {
    if (archive.ownerKey !== services.ownerKey || archive.workspaceId !== ws.id || archive.format !== 'hop-v55-decision-reading-v4') {
      throw Error('La lecture sémantique ne correspond pas au dossier local courant.');
    }
    const latest = await getReferenceWorkspace();
    if (latest.id !== ws.id || latest.ownerKey !== services.ownerKey) throw Error('Le dossier a changé pendant la lecture sémantique.');
    if (workspaceRef.current?.id !== ws.id || expectedSelection
      && (expectedSelection.reference !== undefined && readingArchiveRef.current?.contentReference !== expectedSelection.reference
        || expectedSelection.historical !== undefined && readingHistoricalRef.current !== expectedSelection.historical
        || expectedSelection.question !== undefined && questionRef.current !== expectedSelection.question
        || expectedSelection.generation !== undefined && workspaceGeneration.current !== expectedSelection.generation)) {
      throw Error('La sélection affichée a changé pendant cette lecture. L’archive précédente reste intacte.');
    }
    const existing = latest.decisionReadings?.find(row => row.id === archive.id);
    if (existing) {
      const read = readHopV55DecisionReadingArchive(existing);
      if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v4'
        || read.archive.contentReference !== archive.contentReference) throw Error('Cette identité d’archive V4 appartient déjà à un autre contenu.');
      readingArchiveRef.current = read.archive; setReadingArchive(read.archive); setReading(read.archive.reading);
      setReadingHistorical(false); setView('decide'); return read.archive;
    }
    const saved = await saveFullWorkspace({ ...latest, intent: archive.reading.intent,
      decisionReadings: [...(latest.decisionReadings ?? []), archive], updatedAt: iso() });
    if (workspaceRef.current?.id === saved.id) {
      intentRef.current = archive.reading.intent; setIntent(archive.reading.intent); setQuestion(archive.reading.intent.question);
      readingArchiveRef.current = archive; setReadingArchive(archive); setReading(archive.reading);
      setReadingHistorical(false); setView('decide');
    }
    return archive;
  }
  async function currentDecisionReading(expectedReference: string) {
    const archive = readingArchiveRef.current;
    if (readingHistorical || !archive || archive.format !== 'hop-v55-decision-reading-v2'
      && archive.format !== 'hop-v55-decision-reading-v3' && archive.format !== 'hop-v55-decision-reading-v4'
      || archive.contentReference !== expectedReference) {
      throw Error('Cette lecture n’est plus la lecture active. Relis sa source avant de corriger ou préparer un programme.');
    }
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const ws = await getReferenceWorkspace(ctx, prep);
    if (hopDecisionReference(archive.source) !== hopDecisionReference(decisionSource(ws))
      || archive.runtimeReference !== runtimeReference(prep)) {
      throw Error('La source ou les données de cette lecture ont changé. Conserve l’archive puis relis la demande dans ce contexte.');
    }
    return { archive, prep, ws };
  }
  async function persistDocumentaryAnswer(record: HopV55DocumentaryAnswerRecord) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await getReferenceWorkspace();
      if (latest.id !== record.workspaceId || latest.ownerKey !== record.ownerKey) throw Error('La réponse appartient à un autre dossier.');
      const existing = latest.documentaryAnswers?.find(row => row.id === record.id);
      if (existing) {
        const read = readHopV55DocumentaryAnswerRecord(existing);
        if (read.status !== 'readOnly' || read.record.reference !== record.reference) throw Error('L’identité de réponse est déjà utilisée pour un autre contenu.');
        setDocumentaryRecordId(record.id); return;
      }
      try {
        await saveFullWorkspace({ ...latest, documentaryAnswers: [...(latest.documentaryAnswers ?? []), record], updatedAt: iso() });
        setDocumentaryRecordId(record.id); return;
      } catch (err) { if ((err as { code?: string }).code !== 'staleRevision' || attempt === 2) throw err; }
    }
  }
  function propertyAdviceV3Controller() {
    return createHopV55PropertyAdviceControllerV3({ services, enabled: () => propertyAdviceV3Enabled,
      historical: () => readingHistoricalRef.current, reading: () => readingArchiveRef.current,
      context: currentContext, workspace: getReferenceWorkspace, save: saveFullWorkspace,
      source: decisionSource, runtimeReference,
      selected: record => setDocumentaryRecordId(record.id),
      activated: (archive, record) => {
        intentRef.current = archive.reading.intent; setIntent(archive.reading.intent); setQuestion(archive.reading.intent.question);
        readingArchiveRef.current = archive; setReadingArchive(archive); setReading(archive.reading);
        readingHistoricalRef.current = false; setReadingHistorical(false); setDocumentaryRecordId(record.id); setView('decide');
        setNotice('Réexamen conservé avec ses annotations et son périmètre. La réponse précédente reste dans l’historique.');
      } });
  }
  function propertyAdviceV4Controller(suppressPublication = false, additionalPublicationGuard?: () => void) {
    const generation = workspaceGeneration.current;
    const expectedWorkspaceId = workspaceRef.current?.id;
    const publicationLease = { epoch: propertyV4SelectionEpoch.current,
      readingReference: readingArchiveRef.current?.contentReference };
    function assertPublicationLease() {
      assertWorkspaceScope(generation, expectedWorkspaceId);
      if (publicationLease.epoch !== propertyV4SelectionEpoch.current
        || publicationLease.readingReference !== readingArchiveRef.current?.contentReference) {
        throw new PropertyV4PublicationSelectionChanged();
      }
      additionalPublicationGuard?.();
    }
    function select(record: HopV55PropertyAdviceAnswerRecordV4, saved: HopV55Workspace, historical: boolean) {
      assertWorkspaceScope(generation, expectedWorkspaceId);
      workspaceRef.current = saved; setWorkspace(saved); setDocumentaryRecordId(record.id);
      retainDisplayedV4Identity({ ownerKey: record.ownerKey, workspaceId: record.workspaceId, recordId: record.id,
        recordReference: record.reference, sourceReadingReference: record.sourceReadingReference, ledgerReference: record.ledger.reference });
      readingHistoricalRef.current = historical; setReadingHistorical(historical);
      setNotice(historical ? 'Reçu conservé sous sa lecture d’origine. Réexamine avant une nouvelle correction.'
        : record.outcome.kind === 'allRejected' ? 'Les termes écartés et leurs motifs restent conservés.' : 'Nouvelle lecture et décisions conservées.');
    }
    let publication: { record: HopV55PropertyAdviceAnswerRecordV4; workspace: HopV55Workspace;
      historical: boolean; archive?: HopV55DecisionReadingArchive } | undefined;
    const commands = createHopV55PropertyAdviceControllerV4({ services, enabled: () => propertyAdviceV4Enabled,
      historical: () => readingHistoricalRef.current, reading: () => readingArchiveRef.current,
      context: currentContext, workspace: getReferenceWorkspace, save: saveFullWorkspace,
      source: decisionSource, runtimeReference,
      adoptedIdentity: ws => getHopV55ReferenceProjection(ws)?.currentReference ?? null,
      pending: propertyV4Pending.current, previews: propertyV4Previews.current,
      selected: (record, saved, historical) => { publication = { record, workspace: saved, historical }; },
      activated: (archive, record, saved) => {
        publication = { archive, record, workspace: saved, historical: false };
      } });
    function publish(result: HopV55PropertyAdviceAnswerRecordV4) {
      assertPublicationLease();
      const read = readHopV55DocumentaryAnswerRecord(result);
      if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v4'
        || !publication || publication.record.reference !== read.record.reference) {
        throw Error('Le retour de cette lecture ne correspond pas au reçu conservé.');
      }
      if (suppressPublication) return read.record;
      if (publication.archive) {
        const archive = publication.archive;
        intentRef.current = archive.reading.intent; setIntent(archive.reading.intent); setQuestion(archive.reading.intent.question);
        readingArchiveRef.current = archive; setReadingArchive(archive); setReading(readingForArchive(archive));
        setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined); setView('decide');
      }
      select(read.record, publication.workspace, publication.historical);
      if (publication.archive) setNotice('Réexamen conservé avec sa lecture et ses décisions. Les anciennes versions restent dans l’historique.');
      return read.record;
    }
    async function checked(kind: 'revise' | 'reexamine', input: HopV55PropertyAdviceV4Command | HopV55PropertyAdviceV4ReexaminationCommand) {
      const ws = await getReferenceWorkspace();
      const raw = ws.documentaryAnswers?.find(row => row.reference === input.expectedRecordReference);
      const base = raw && readHopV55DocumentaryAnswerRecord(raw);
      if (!base || base.status !== 'readOnly' || base.record.format !== 'hop-v55-documentary-answer-record-v4') {
        throw Error('La version exacte confirmée n’est plus disponible.');
      }
      const result = kind === 'revise' ? await commands.correct(input as HopV55PropertyAdviceV4Command)
        : await commands.reexamine(input);
      const correction = 'readingContext' in input ? input : undefined;
      const { verifyRecordResultV4 } = await import('./PropertyAdviceDecisionV4');
      assertPublicationLease();
      const problem = verifyRecordResultV4({ kind, base: base.record, commandId: input.commandId, reason: input.reason,
        actions: correction?.actions ?? [], expectedReadingContext: correction?.readingContext ?? base.record.readingContext,
        allowProposalRefresh: base.record.readingContext.interpretation.origin === 'proposal'
          && (!correction || hopDecisionReference(correction.readingContext) === hopDecisionReference(base.record.readingContext)) }, result);
      if (problem) {
        assertWorkspaceScope(generation, expectedWorkspaceId);
        setNotice(''); setError(`Le reçu reste conservé, mais cette lecture ne peut pas être affichée comme confirmée : ${problem}`);
        if (publication) setPropertyV4Recovery(kind === 'revise'
          ? { kind, workspaceId: ws.id, request: structuredClone(input as HopV55PropertyAdviceV4Command) }
          : { kind, workspaceId: ws.id, request: structuredClone(input) });
        throw Error(problem);
      }
      try {
        const confirmed = publish(result); setPropertyV4Recovery(undefined); return confirmed;
      } catch (cause) {
        if (cause instanceof PropertyV4PublicationSelectionChanged) throw cause;
        assertWorkspaceScope(generation, expectedWorkspaceId);
        if (publication) {
          setPropertyV4Recovery(kind === 'revise'
            ? { kind, workspaceId: ws.id, request: structuredClone(input as HopV55PropertyAdviceV4Command) }
            : { kind, workspaceId: ws.id, request: structuredClone(input) });
          setNotice(''); setError('Le reçu est conservé; son retour doit être relu avant de présenter la lecture comme confirmée.');
        }
        throw cause;
      }
    }
    async function confirmedReexamination(input: HopV55PropertyAdviceV4ConfirmationCommand) {
      const ws = await getReferenceWorkspace();
      const raw = ws.documentaryAnswers?.find(row => row.reference === input.expectedRecordReference);
      const parent = raw && readHopV55DocumentaryAnswerRecord(raw);
      if (!parent || parent.status !== 'readOnly' || parent.record.format !== 'hop-v55-documentary-answer-record-v4') {
        throw Error('Le parent exact de cette réconciliation n’est plus disponible.');
      }
      const stored = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace: ws, confirmation: input });
      if (stored.status === 'conflict' || stored.status === 'unsupportedReadOnly') throw Error(stored.reason);
      const preview = stored.status === 'pending' || stored.status === 'committed' ? stored.staging.preview
        : propertyV4Previews.current.get(input.previewId);
      if (!preview || preview.reference !== input.expectedPreviewReference) throw Error('L’aperçu exact de cette confirmation n’est plus disponible.');
      const result = await commands.confirmReexamination(input);
      const { verifyReexaminationConfirmationResultV4 } = await import('./PropertyAdviceReexaminationPanelV4');
      assertPublicationLease();
      const problem = verifyReexaminationConfirmationResultV4({ parentRecord: parent.record, preview, request: input, result });
      if (problem) {
        assertWorkspaceScope(generation, expectedWorkspaceId);
        setNotice(''); setError(`Le reçu reste conservé, mais cette confirmation doit être relue : ${problem}`);
        if (publication) setPropertyV4Recovery({ kind: 'confirmReexamination', workspaceId: ws.id, request: structuredClone(input) });
        throw Error(problem);
      }
      try {
        const confirmed = publish(result); setPropertyV4Recovery(undefined); return confirmed;
      } catch (cause) {
        if (cause instanceof PropertyV4PublicationSelectionChanged) throw cause;
        assertWorkspaceScope(generation, expectedWorkspaceId);
        if (publication) {
          setPropertyV4Recovery({ kind: 'confirmReexamination', workspaceId: ws.id, request: structuredClone(input) });
          setNotice(''); setError('Le reçu est conservé; son retour doit être relu avant de présenter la nouvelle lecture comme confirmée.');
        }
        throw cause;
      }
    }
    return {
      upgradeV3: async (reference: string, commandId: string, reason: string) => publish(await commands.upgradeV3(reference, commandId, reason)),
      correct: (input: HopV55PropertyAdviceV4Command) => checked('revise', input),
      reexamine: (input: HopV55PropertyAdviceV4ReexaminationCommand) => checked('reexamine', input),
      prepareReexamination: (input: HopV55PropertyAdviceV4PreviewCommand) => commands.prepareReexamination(input),
      confirmReexamination: confirmedReexamination,
      dossier: commands.dossier,
    };
  }
  async function propertyAdviceV4Materials(record: HopV55PropertyAdviceAnswerRecordV4, ids: readonly string[], query?: string) {
    if (readingHistoricalRef.current || readingArchiveRef.current?.contentReference !== record.sourceReadingReference) {
      throw Error('Cette lecture est figée; réexamine-la avant de rechercher des matières.');
    }
    const ws = await getReferenceWorkspace();
    const head = [...(ws.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === record.sourceReadingReference);
    if (head?.reference !== record.reference) throw Error('Le registre a changé depuis cette recherche.');
    const prep = prepareBrewingScenarioContext(await currentContext());
    const requested = new Set(ids);
    const normalized = query?.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
    if (query !== undefined && (!normalized || normalized.length < 2)) return [];
    return prep.runtime.materials.filter(material => requested.has(material.id)
      && (!normalized || `${material.name} ${material.id} ${material.variety?.aliases.join(' ') ?? ''}`
        .normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').includes(normalized)))
      .map(material => structuredClone(material));
  }
  function qualifiedSourceContext(ctx: BrewerContext, prep: PreparedBrewingScenarioContext, ws: HopV55Workspace): HopDecisionContext | null {
    const source = decisionSource(ws);
    if (source.kind === 'exploration' || source.kind === 'localFutureDraft') return null;
    if (source.kind === 'localRecipeCopy') return { kind: 'recipe', recipeId: source.recipeId, recipeReference: source.recipeReference };
    if (source.kind === 'recipe') {
      if (!ctx.recipe || ctx.recipe.id !== source.id) throw Error('La recette exacte de cette étude n’est plus disponible.');
      return { kind: 'recipe', recipeId: source.id, recipeReference: hopDecisionReference(ctx.recipe) };
    }
    const batch = ctx.batch;
    const program = prep.runtime.current?.program;
    const journal = ctx.journal ?? batch?.brewDay;
    const revision = journal?.revision;
    if (!batch || batch.id !== source.id || !batch.recipeSnapshot || !batch.brewDay || !journal || !program
      || hopDecisionReference(journal) !== hopDecisionReference(batch.brewDay)
      || !Number.isSafeInteger(revision) || revision < 0) {
      throw Error('Le lien au brassin manque de sa révision exacte du jour de brassage; aucune révision n’est inventée pour conserver cette étude.');
    }
    return { kind: 'batch', batchId: source.id, ...(typeof batch.recipeRef === 'string' ? { recipeId: batch.recipeRef } : {}),
      recipeSnapshotReference: hopDecisionReference(batch.recipeSnapshot), brewDayRevision: revision,
      programFingerprint: programFingerprint(program), stage: program.stage };
  }
  function studyEntryFromPreparation(reference: string, ws: HopV55Workspace, historical = false): HopV55QualifiedStudyEntry {
    const raw = ws.qualifiedStudyPreparations?.find(row => row.reference === reference);
    const read = raw && readHopV55QualifiedStudyPreparation(raw);
    if (!read || read.status !== 'available') {
      throw Error('La préparation de cette étude est illisible; son archive reste conservée.');
    }
    const common = { sourceReadingReference: read.preparation.sourceReadingReference,
      studyReference: read.preparation.studyReference, status: historical ? 'historical' as const : 'prepared' as const, readOnly: historical };
    const command = read.preparation.createCommand;
    if (command.kind === 'products' && command.study.actionKind === 'understandProducts') return { ...common, kind: 'products', study: command.study };
    if (command.kind === 'advice') return { ...common, kind: 'advice', study: command.study };
    throw Error('Le format de cette préparation ne correspond pas à la route conservée.');
  }
  function receiveQualifiedProductStudy(saved: PersistHopV55QualifiedStudyResult) {
    if (!('status' in saved.dossier) && saved.dossier.formatVersion === 3) {
      const events = saved.events.map(event => {
        if ('status' in event || event.eventFormatVersion !== 3) throw Error('Le conseil contient un événement non pris en charge.');
        return event;
      });
      workspaceRef.current = saved.workspace; setWorkspace(saved.workspace);
      setWorkspaces(rows => [...rows.filter(row => row.id !== saved.workspace.id), saved.workspace]);
      setQualifiedPreparationReference(saved.preparation.reference);
      setQualifiedEntry({ kind: 'advice', sourceReadingReference: saved.link.sourceReadingReference,
        studyReference: saved.link.studyReference, study: saved.dossier.study, link: saved.link, dossier: saved.dossier, events,
        status: saved.freshContext.status === 'historical' ? 'historical' : 'saved', readOnly: saved.freshContext.status === 'historical',
        ...(saved.freshContext.status === 'historical' ? { recoveryNotice: saved.freshContext.reason } : {}) });
      setNotice(saved.freshContext.status === 'historical' ? 'Conseil conservé pour sa lecture historique.' : 'Étude des emplois et matières conservée avec ses sources exactes.');
      return;
    }
    if ('status' in saved.dossier || saved.dossier.formatVersion !== 2
      || saved.dossier.study.actionKind !== 'understandProducts') throw Error('Le reçu ne contient pas l’étude produit attendue.');
    const events = saved.events.map(event => {
      if ('status' in event || event.eventFormatVersion !== 2) throw Error('L’étude produit contient un événement non pris en charge.');
      return event;
    });
    workspaceRef.current = saved.workspace; setWorkspace(saved.workspace);
    setWorkspaces(rows => [...rows.filter(row => row.id !== saved.workspace.id), saved.workspace]);
    setQualifiedPreparationReference(saved.preparation.reference);
    setQualifiedEntry({ kind: 'products', sourceReadingReference: saved.link.sourceReadingReference,
      studyReference: saved.link.studyReference, study: saved.dossier.study, link: saved.link,
      dossier: saved.dossier, events, status: saved.freshContext.status === 'historical' ? 'historical' : 'saved',
      readOnly: saved.freshContext.status === 'historical',
      ...(saved.freshContext.status === 'historical' ? { recoveryNotice: saved.freshContext.reason } : {}) });
    setNotice(saved.freshContext.status === 'historical' ? 'Étude conservée pour sa lecture historique.' : 'Étude produit conservée avec ses fiches et sources exactes.');
  }
  function qualifiedStudyController() {
    const generation = workspaceGeneration.current;
    const expectedWorkspaceId = workspaceRef.current?.id;
    return createHopV55QualifiedStudyController({ services, enabled: () => qualifiedProductStudiesEnabled,
      historical: () => readingHistoricalRef.current, reading: () => readingArchiveRef.current,
      context: currentContext, workspace: getReferenceWorkspace, save: saveFullWorkspace,
      source: decisionSource, runtimeReference, sourceContext: qualifiedSourceContext,
      catalogueInput: ctx => ({ saved: { varieties: ctx.hopIndex?.varieties ?? [], lots: ctx.hopIndex?.lots ?? [] } }),
      selected: preparation => {
        assertWorkspaceScope(generation, expectedWorkspaceId);
        const ws = workspaceRef.current;
        if (!ws) throw Error('Le dossier de la préparation a changé.');
        setQualifiedPreparationReference(preparation.reference);
        setQualifiedEntry(studyEntryFromPreparation(preparation.reference, ws));
        setNotice('Nouvelle étude qualifiée préparée pour ces fiches. La lecture précédente reste intacte.');
      },
      received: saved => { assertWorkspaceScope(generation, expectedWorkspaceId); receiveQualifiedProductStudy(saved); },
    });
  }
  function qualifiedAdviceController() {
    const generation = workspaceGeneration.current;
    const expectedWorkspaceId = workspaceRef.current?.id;
    return createHopV55QualifiedAdviceController({ services, enabled: () => qualifiedAdviceStudiesEnabled,
      pendingPreparations: advicePending.current,
      historical: () => readingHistoricalRef.current, reading: () => readingArchiveRef.current,
      context: currentContext, workspace: getReferenceWorkspace, save: saveFullWorkspace,
      source: decisionSource, runtimeReference, sourceContext: qualifiedSourceContext,
      catalogueInput: ctx => ({ saved: { varieties: ctx.hopIndex?.varieties ?? [], lots: ctx.hopIndex?.lots ?? [] } }),
      selected: preparation => {
        assertWorkspaceScope(generation, expectedWorkspaceId);
        const ws = workspaceRef.current;
        if (!ws) throw Error('Le dossier de préparation du conseil a changé.');
        setQualifiedPreparationReference(preparation.reference); setQualifiedEntry(studyEntryFromPreparation(preparation.reference, ws));
        setNotice('Étude qualifiée des emplois et matières préparée. Ses limites restent à examiner.');
      },
      received: saved => { assertWorkspaceScope(generation, expectedWorkspaceId); receiveQualifiedProductStudy(saved); },
      preferenceReceived: saved => {
        assertWorkspaceScope(generation, expectedWorkspaceId);
        setQualifiedEntry(previous => previous?.kind === 'advice' && previous.studyReference === saved.command.studyReference
          ? { ...previous, dossier: saved.dossierAdvice3, events: saved.eventsAdvice3,
            readOnly: saved.freshContext.status === 'historical', status: saved.freshContext.status === 'historical' ? 'historical' : 'saved',
            ...(saved.freshContext.status === 'historical' ? { recoveryNotice: saved.freshContext.reason } : {}) } : previous);
        setNotice('Choix documentaire conservé dans l’étude exacte.');
      },
    });
  }
  async function prepareQualifiedAdviceForArchive(archive: HopV55DecisionReadingArchiveV3 | HopV55DecisionReadingArchiveV4,
    expectedScopeLedgerReference: string | undefined, request: HopV55QualifiedAdvicePrepareRequest) {
    const selected = readingArchiveRef.current;
    if (readingHistoricalRef.current || selected?.contentReference !== archive.contentReference) {
      throw Error('La lecture qualifiée affichée a changé; rouvre sa référence exacte avant de préparer l’étude.');
    }
    const latest = await getReferenceWorkspace();
    const raw = latest.decisionReadings?.find(row => row.contentReference === archive.contentReference);
    const checked = raw && readHopV55DecisionReadingArchive(raw);
    if (checked?.status !== 'available' || checked.archive.format !== archive.format
      || checked.archive.contentReference !== archive.contentReference
      || hopDecisionReference(checked.archive.source) !== hopDecisionReference(archive.source)) {
      throw Error('La lecture ou sa source ne correspond plus à l’archive V4/V3 exacte.');
    }
    const currentScopeReference = hopV55DecisionReadingScopesV1(checked.archive)?.scopeLedger.reference;
    if (currentScopeReference !== expectedScopeLedgerReference) {
      throw Error('Le ledger de portées a changé depuis l’ouverture de cette étude. Rouvre la lecture actuelle avant de continuer.');
    }
    const hasNewScopeDisposition = (latest.decisionReadings ?? []).some(row => {
      const read = readHopV55DecisionReadingArchive(row);
      if (read.status !== 'available' || read.archive.contentReference === archive.contentReference
        || read.archive.format !== 'hop-v55-decision-reading-v3' && read.archive.format !== 'hop-v55-decision-reading-v4') return false;
      const scopeTransition = read.archive.transition;
      if (scopeTransition?.kind !== 'reviseScopes' || scopeTransition.parentReadingReference !== archive.contentReference) return false;
      return hopV55DecisionReadingScopesV1(read.archive)?.scopeLedger.reference !== expectedScopeLedgerReference;
    });
    if (hasNewScopeDisposition) throw Error('Une disposition de portée a été archivée après cette lecture. Rouvre le ledger V4 actuel avant de préparer l’étude.');
    if (readingArchiveRef.current?.contentReference !== archive.contentReference || readingHistoricalRef.current) {
      throw Error('La sélection a changé pendant la validation des portées. Aucune étude n’a été préparée.');
    }
    return qualifiedAdviceController().prepareAdvice(request);
  }
  async function openQualifiedStudy(reference: string, ws: HopV55Workspace) {
    const generation = workspaceGeneration.current;
    const entry = studyEntryFromPreparation(reference, ws, true);
    restoreReading(ws, entry.sourceReadingReference, true);
    const raw = ws.qualifiedStudyLinks?.find(row => {
      const read = readHopV55QualifiedStudyLink(row);
      return read.status === 'available' && read.link.preparationReference === reference;
    });
    if (!raw) {
      assertWorkspaceScope(generation, ws.id);
      setQualifiedPreparationReference(reference); setQualifiedEntry(entry); setView('decide');
      setNotice('Préparation d’étude rouverte en lecture figée, sans reconstruire le conseil.'); return;
    }
    const linkRead = readHopV55QualifiedStudyLink(raw);
    if (linkRead.status !== 'available') throw Error(linkRead.reason);
    const link = linkRead.link;
    const [dossier, events] = await Promise.all([
      services.qualifiedStudies.read(services.ownerKey, link.dossierId),
      services.qualifiedStudies.readEvents(services.ownerKey, link.dossierId),
    ]);
    assertWorkspaceScope(generation, ws.id);
    if (!dossier || 'status' in dossier || entry.studyReference !== link.studyReference) {
      throw Error('Le dossier ne correspond pas au lien exact de cette étude.');
    }
    setQualifiedPreparationReference(reference);
    if (entry.kind === 'products' && dossier.formatVersion === 2 && dossier.study.actionKind === 'understandProducts'
      && hopDecisionReference(dossier.study) === link.studyReference
      && events.every(event => !('status' in event) && event.eventFormatVersion === 2)) {
      setQualifiedEntry({ ...entry, study: dossier.study, link, dossier,
        events: events as HopDecisionEventV2[], status: 'historical', readOnly: true });
    } else if (entry.kind === 'advice' && dossier.formatVersion === 3 && dossier.study.reference === link.studyReference
      && events.every(event => !('status' in event) && event.eventFormatVersion === 3)) {
      setQualifiedEntry({ ...entry, study: dossier.study, link, dossier,
        events: events as HopAdviceEventV3[], status: 'historical', readOnly: true });
    } else throw Error('La version, l’étude ou l’historique ne correspondent pas au lien exact.');
    setView('decide'); setNotice('Étude exacte rouverte. Aucun conseil ni calcul relancé.');
  }
  async function prepareDocumentaryAnswer(archive: HopV55DecisionReadingArchive, prep: PreparedBrewingScenarioContext, explicit = false) {
    if (!documentarySynthesisEnabled) throw Error('La synthèse documentaire attend encore sa réception.');
    if (archive.reading.response?.actionKind === 'understandProducts') return;
    if (archive.format === 'hop-v55-decision-reading-v4') {
      if (!propertyAdviceV3Enabled || !archive.reading.annotations.length) {
        if (explicit) throw Error('Cette lecture V4 conserve ses annotations, mais aucun préparateur documentaire compatible n’est disponible pour son contenu.');
        return;
      }
      await propertyAdviceV3Controller().prepare(archive, prep);
      return;
    }
    if (propertyAdviceV3Enabled && (archive.format === 'hop-v55-decision-reading-v2' || archive.format === 'hop-v55-decision-reading-v3')
      && archive.reading.criterionDrafts.length && (explicit || !archive.reading.operationDrafts?.length)) {
      await propertyAdviceV3Controller().prepare(archive, prep); return;
    }
    if (propertyAdviceEnabled && archive.format === 'hop-v55-decision-reading-v2'
      && archive.reading.criterionDrafts.length && (explicit || !archive.reading.operationDrafts?.length)) {
      await preparePropertyAdviceAnswer(archive, prep);
      return;
    }
    const ws = workspaceRef.current;
    if (!ws) throw Error('Conserve une lecture avant de préparer sa réponse documentaire.');
    const draft = prepareHopV55DocumentaryRequest({ reading: hopV55DecisionReadingForDisplay(archive), prepared: prep,
      requestId: uid('documentary-request'), ownerKey: services.ownerKey, workspaceId: ws.id, sourceReadingReference: archive.contentReference });
    if (!explicit && !draft.request.needs.some(need => need.kind !== 'unresolved')) return;
    const record = buildHopV55DocumentaryAnswerRecord({ draft, prepared: prep, answerRecordId: uid('documentary-answer') });
    await persistDocumentaryAnswer(record);
  }
  async function preparePropertyAdviceAnswer(archive: HopV55DecisionReadingArchive, prep: PreparedBrewingScenarioContext) {
    if (!propertyAdviceEnabled) throw Error('Le conseil par propriétés attend sa réception.');
    const ws = workspaceRef.current;
    if (!ws) throw Error('Conserve la lecture avant de préparer ses propriétés.');
    const draft = prepareHopV55PropertyAdviceRequestDraft({ reading: hopV55DecisionReadingForDisplay(archive), prepared: prep,
      requestId: uid('property-request'), ownerKey: services.ownerKey, workspaceId: ws.id,
      sourceReadingReference: archive.contentReference,
      candidatePolicy: { kind: 'explicit', materialIds: [],
        basis: 'Aucune matière n’a encore été choisie pour cette lecture. Une recherche dans le catalogue peut être demandée explicitement.' } });
    const answerSnapshot = buildHopPropertyAdvice(draft.requestSnapshot);
    const record = createHopV55PropertyAdviceAnswerRecord({ draft, prepared: prep, answerSnapshot, answerRecordId: uid('property-answer') });
    await persistDocumentaryAnswer(record);
  }
  async function currentPropertyAdviceAnswer(expectedRecord: string, expectedAnswer: string, expectedInterpretation: string) {
    if (!propertyAdviceEnabled || readingHistorical) throw Error('Cette réponse est en lecture seule; réexamine sa demande avant de modifier ses propriétés.');
    const ws = await getReferenceWorkspace();
    const row = [...(ws.documentaryAnswers ?? [])].reverse().find(value => value.sourceReadingReference === readingArchiveRef.current?.contentReference);
    const read = row && readHopV55DocumentaryAnswerRecord(row);
    if (!read || read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v2'
      || read.record.reference !== expectedRecord || read.record.answerReference !== expectedAnswer
      || read.record.answerSnapshot.interpretationReference !== expectedInterpretation) {
      throw Error('La réponse par propriétés ou son interprétation n’est plus la tête exacte de cette lecture.');
    }
    return { ws, record: read.record };
  }
  async function upgradeDocumentaryAnswer(source: HopV55DocumentaryAnswerRecordV1) {
    if (!propertyAdviceEnabled && !propertyAdviceV3Enabled) throw Error('Le conseil par propriétés attend sa réception.');
    const ws = await getReferenceWorkspace();
    const head = [...(ws.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === source.sourceReadingReference);
    const headRead = head && readHopV55DocumentaryAnswerRecord(head);
    if (!headRead || headRead.status !== 'readOnly' || headRead.record.reference !== source.reference) {
      throw Error('Cette ancienne réponse n’est plus la tête de sa lecture. Relis la version courante avant de reprendre ses propriétés.');
    }
    const readingRow = ws.decisionReadings?.find(row => row.contentReference === source.sourceReadingReference);
    const readingRead = readingRow && readHopV55DecisionReadingArchive(readingRow);
    if (!readingRead || readingRead.status !== 'available' || readingRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw Error('Cette ancienne lecture ne contient pas les annotations nécessaires. Fais une nouvelle lecture explicite; son archive reste intacte.');
    }
    const prep = prepareBrewingScenarioContext(await currentContext());
    if (readingRead.archive.runtimeReference !== runtimeReference(prep)
      || hopDecisionReference(readingRead.archive.source) !== hopDecisionReference(decisionSource(ws))) {
      throw Error('La source de cette lecture a changé. Fais une nouvelle lecture dans le contexte actif avant de reprendre ses propriétés.');
    }
    const ids = [...new Set(source.answerSnapshot.requestSnapshot.needs.flatMap(need => need.candidateIds ?? []))];
    const draft = prepareHopV55PropertyAdviceRequestDraft({ reading: readingRead.archive.reading, prepared: prep,
      requestId: uid('property-request'), ownerKey: services.ownerKey, workspaceId: ws.id,
      sourceReadingReference: source.sourceReadingReference,
      candidatePolicy: { kind: 'explicit', materialIds: ids,
        basis: 'Candidats explicitement présents dans la réponse documentaire reprise; un périmètre vide reste vide.' } });
    const legacy = source.answerSnapshot.requestSnapshot;
    const intentIds = new Set(draft.requestSnapshot.propertyIntents.map(item => item.id));
    if (legacy.exclusions.some(exclusion => exclusion.criterionIds.some(id => !intentIds.has(id)))) {
      throw Error('Une exclusion de cette réponse ne correspond pas encore aux propriétés explicites. Réconcilie ses liens avant la reprise; la réponse et ses choix restent conservés.');
    }
    // These fields have identical V1/V2 structure. Their declarations remain
    // exact; only exclusion links use the new, verified intent-ID vocabulary.
    draft.requestSnapshot.interpretation = structuredClone(legacy.interpretation);
    draft.requestSnapshot.context = structuredClone(legacy.context);
    draft.requestSnapshot.exclusions = legacy.exclusions.map(({ criterionIds, ...exclusion }) => ({
      ...structuredClone(exclusion), intentIds: [...criterionIds],
    }));
    draft.preparedReference = hopV55PropertyAdvicePreparedReference(prep, draft.requestSnapshot);
    draft.reference = hopV55PropertyAdviceRequestDraftReference(draft);
    const next = createHopV55PropertyAdviceAnswerRecord({ draft, prepared: prep,
      answerSnapshot: buildHopPropertyAdvice(draft.requestSnapshot), answerRecordId: uid('property-answer'),
      revisionContext: { sourceAnswerRecordReference: source.reference, sourceAnswerReference: source.answerReference,
        reason: 'Passage explicite au conseil par propriétés, avec la lecture et le périmètre documentaire conservés.',
        recordedAt: iso(), recordedBy: { origin: services.scope === 'fixture' ? 'fixture' : 'user', label: 'Brasseur' } } });
    await persistDocumentaryAnswer(next); setReadingHistorical(false);
    setNotice('Nouvelle réponse par propriétés conservée. La réponse V1 et ses dossiers restent exacts dans l’historique.');
    return next;
  }
  async function reinterpretPropertyAdvice(request: HopV55PropertyAdviceReinterpretRequest) {
    const { record } = await currentPropertyAdviceAnswer(request.expectedAnswerRecordReference,
      request.expectedAnswerReference, request.expectedInterpretationReference);
    const prior = record.answerSnapshot.requestSnapshot;
    if (request.request.id !== prior.id || request.request.originalQuestion !== prior.originalQuestion
      || request.request.context.stage !== prior.context.stage || request.request.context.stageBasis !== prior.context.stageBasis
      || hopDecisionReference(request.request.exclusions) !== hopDecisionReference(prior.exclusions)
      || hopDecisionReference(request.request.context.assertions.slice(0, prior.context.assertions.length)) !== hopDecisionReference(prior.context.assertions)) {
      throw Error('La question, le stade fourni et les assertions antérieures restent figés dans cette correction.');
    }
    const prep = prepareBrewingScenarioContext(await currentContext());
    if (record.preparedReference !== hopV55PropertyAdvicePreparedReference(prep, prior)) {
      return reexaminePropertyAdvice(record.id, record.reference, request);
    }
    const draft = resumeHopV55PropertyAdviceRequestDraft({ source: {
      ownerKey: record.ownerKey, workspaceId: record.workspaceId, sourceReadingReference: record.sourceReadingReference,
      preparedReference: record.preparedReference, requestDraftReference: record.requestDraftReference, requestSnapshot: prior,
    }, prepared: prep });
    const extraAssertions = request.request.context.assertions.slice(prior.context.assertions.length);
    const accessUpdates = (Object.keys(prior.context.access) as Array<keyof typeof prior.context.access>).flatMap(scope =>
      hopDecisionReference(prior.context.access[scope]) === hopDecisionReference(request.request.context.access[scope]) ? [] : [{
        scope, access: request.request.context.access[scope],
        assertions: extraAssertions.filter(assertion => request.request.context.access[scope].assertionIds.includes(assertion.id)),
      }]);
    if (extraAssertions.some(assertion => !accessUpdates.some(update => update.assertions.some(value => value.id === assertion.id)))) {
      throw Error('Chaque nouvelle attestation doit être rattachée explicitement à son accès.');
    }
    const revised = reviseHopV55PropertyAdviceRequestDraft({ draft, prepared: prep,
      propertyIntents: request.request.propertyIntents, candidatePolicy: request.request.candidatePolicy,
      interpretation: request.request.interpretation, accessUpdates,
      revisionContext: { reason: request.reason, recordedAt: iso(), recordedBy: { origin: services.scope === 'fixture' ? 'fixture' : 'user', label: 'Brasseur' } } });
    const answerSnapshot = buildHopPropertyAdvice(revised.requestSnapshot);
    const next = createHopV55PropertyAdviceAnswerRecord({ draft: revised, prepared: prep, answerSnapshot, answerRecordId: uid('property-answer'),
      revisionContext: { sourceAnswerRecordReference: record.reference, sourceAnswerReference: record.answerReference,
        reason: request.reason, recordedAt: iso(), recordedBy: { origin: services.scope === 'fixture' ? 'fixture' : 'user', label: 'Brasseur' } } });
    await persistDocumentaryAnswer(next);
    setNotice('Nouvelle lecture par propriétés conservée. La réponse précédente et ses choix restent intacts.');
    return { kind: 'revision' as const, answer: next.answerSnapshot, answerRecordReference: next.reference };
  }
  async function savePropertyAdviceDossier(request: HopV55PropertyAdviceDossierSaveRequest) {
    const { record } = await currentPropertyAdviceAnswer(request.expectedAnswerRecordReference,
      request.expectedAnswerReference, request.expectedInterpretationReference);
    const existingWorkspace = await getReferenceWorkspace();
    const existing = existingWorkspace.documentaryDossiers?.find(row => row.id === request.commandId);
    if (existing) {
      const read = readHopV55DocumentaryDossierRecord(existing);
      if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-dossier-record-v2'
        || read.record.answerRecordReference !== record.reference || read.record.strategyReference !== request.expectedStrategyReference
        || read.record.dossierSnapshot.motive !== request.motive) throw Error('Cette commande identifie déjà un autre dossier.');
      return read.record.dossierSnapshot;
    }
    const dossier = createHopV55PropertyAdviceDossierRecord({ answerRecord: record, dossierId: request.commandId,
      ...request, createdAt: iso(), createdBy: { origin: services.scope === 'fixture' ? 'fixture' : 'user', label: 'Brasseur' } });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await getReferenceWorkspace();
      if (latest.id !== dossier.workspaceId) throw Error('Le dossier actif a changé.');
      const present = latest.documentaryDossiers?.find(row => row.id === dossier.id);
      if (present) {
        const read = readHopV55DocumentaryDossierRecord(present);
        if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-dossier-record-v2'
          || read.record.reference !== dossier.reference) throw Error('L’identité du choix contient un autre dossier.');
        return read.record.dossierSnapshot;
      }
      try {
        await saveFullWorkspace({ ...latest, documentaryDossiers: [...(latest.documentaryDossiers ?? []), dossier], updatedAt: iso() });
        setNotice('Choix documentaire conservé sous ses références exactes.'); return dossier.dossierSnapshot;
      } catch (err) { if ((err as { code?: string }).code !== 'staleRevision' || attempt === 2) throw err; }
    }
    throw Error('Le choix documentaire n’a pas pu être conservé.');
  }
  async function propertyAdviceMaterials(record: HopV55PropertyAdviceAnswerRecordV2, ids: readonly string[], query?: string) {
    await currentPropertyAdviceAnswer(record.reference, record.answerReference, record.answerSnapshot.interpretationReference);
    const prep = prepareBrewingScenarioContext(await currentContext());
    const requested = new Set(ids);
    const normalized = query?.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
    if (query !== undefined && (!normalized || normalized.length < 2)) return [];
    return prep.runtime.materials.filter(material => requested.has(material.id)
      && (!normalized || `${material.name} ${material.id} ${JSON.stringify(material.variety ?? material)}`
        .normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').includes(normalized)))
      .map(material => structuredClone(material));
  }
  async function reexaminePropertyAdvice(recordId: string, expectedRecordReference: string,
    reconciliation?: HopV55PropertyAdviceReinterpretRequest) {
    if (!propertyAdviceEnabled) throw Error('Le conseil par propriétés attend sa réception.');
    const ws = await getReferenceWorkspace();
    const row = ws.documentaryAnswers?.find(value => value.id === recordId);
    const read = row && readHopV55DocumentaryAnswerRecord(row);
    if (!read || read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v2'
      || read.record.reference !== expectedRecordReference) throw Error('La réponse choisie n’est plus disponible sous sa référence exacte.');
    const source = read.record;
    const sourceRow = ws.decisionReadings?.find(value => value.contentReference === source.sourceReadingReference);
    const readingRead = sourceRow && readHopV55DecisionReadingArchive(sourceRow);
    if (!readingRead || readingRead.status !== 'available' || readingRead.archive.format !== 'hop-v55-decision-reading-v2') {
      throw Error('La lecture structurée d’origine doit rester disponible pour ce réexamen.');
    }
    const prep = prepareBrewingScenarioContext(await currentContext());
    const nextReading = structuredClone(readingRead.archive.reading);
    nextReading.branches = [];
    delete nextReading.response;
    const nextArchive = createHopV55DecisionReadingArchiveV2({ id: uid('reading'), ownerKey: services.ownerKey, workspaceId: ws.id,
      recordedAt: iso(), reading: nextReading, source: decisionSource(ws), runtimeReference: runtimeReference(prep) });
    const storedDraft: HopV55PropertyAdviceRequestDraftV2 = { format: 'hop-v55-property-advice-request-draft-v2',
      id: source.answerSnapshot.requestSnapshot.id, ownerKey: source.ownerKey, workspaceId: source.workspaceId,
      sourceReadingReference: source.sourceReadingReference, preparedReference: source.preparedReference,
      requestSnapshot: structuredClone(source.answerSnapshot.requestSnapshot), reference: source.requestDraftReference };
    const recordedAt = iso();
    const reason = reconciliation?.reason ?? 'Réexamen explicite de cette interprétation dans le contexte actif, avec ses propriétés et son périmètre conservés.';
    const recordedBy = { origin: reconciliation ? 'user' as const : services.scope === 'fixture' ? 'fixture' as const : 'user' as const, label: 'Brasseur' };
    const newIdentity = { requestId: uid('property-request'), sourceReadingReference: nextArchive.contentReference };
    const draft = reconciliation ? reconcileHopV55PropertyAdviceRequestDraft({ draft: storedDraft, reading: nextReading, prepared: prep,
      ...newIdentity, propertyIntents: reconciliation.request.propertyIntents, candidatePolicy: reconciliation.request.candidatePolicy,
      interpretation: reconciliation.request.interpretation, reexaminationContext: { reason, recordedAt, recordedBy } })
      : reexamineHopV55PropertyAdviceRequestDraft({ draft: storedDraft, reading: nextReading, prepared: prep,
        ...newIdentity, reexaminationContext: { reason, recordedAt, recordedBy } });
    const answerSnapshot = buildHopPropertyAdvice(draft.requestSnapshot);
    const next = createHopV55PropertyAdviceAnswerRecord({ draft, prepared: prep, answerSnapshot, answerRecordId: uid('property-answer'),
      reexaminationContext: { sourceAnswerRecordReference: source.reference, sourceAnswerReference: source.answerReference,
        sourceReadingReference: source.sourceReadingReference, reason, recordedAt, recordedBy } });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await getReferenceWorkspace();
      if (latest.id !== next.workspaceId) throw Error('Le dossier actif a changé pendant ce réexamen.');
      const existing = latest.documentaryAnswers?.find(value => value.id === next.id);
      if (existing) {
        const existingRead = readHopV55DocumentaryAnswerRecord(existing);
        if (existingRead.status !== 'readOnly' || existingRead.record.reference !== next.reference) throw Error('L’identité du réexamen contient une autre réponse.');
      } else {
        try {
          await saveFullWorkspace({ ...latest, intent: nextReading.intent,
            decisionReadings: [...(latest.decisionReadings ?? []), nextArchive],
            documentaryAnswers: [...(latest.documentaryAnswers ?? []), next], updatedAt: iso() });
        } catch (err) { if ((err as { code?: string }).code === 'staleRevision' && attempt < 2) continue; throw err; }
      }
      intentRef.current = nextReading.intent; setIntent(nextReading.intent); setQuestion(nextReading.intent.question);
      readingArchiveRef.current = nextArchive; setReadingArchive(nextArchive); setReading(nextReading); setReadingHistorical(false);
      setDocumentaryRecordId(next.id); setView('decide');
      setNotice('Réexamen conservé avec ses propriétés et son périmètre exacts. La réponse précédente reste dans l’historique.');
      return { kind: 'reexamination' as const, answer: next.answerSnapshot, answerRecordReference: next.reference,
        source: { answerRecordReference: source.reference, answerReference: source.answerReference,
          interpretationReference: source.answerSnapshot.interpretationReference, requestId: source.answerSnapshot.requestSnapshot.id } };
    }
    throw Error('Le réexamen n’a pas pu être conservé après les conflits de révision.');
  }
  async function currentDocumentaryAnswer(expectedAnswer: string, expectedInterpretation?: string) {
    if (!documentarySynthesisEnabled || readingHistorical) throw Error('Cette réponse est en lecture seule; reprends d’abord sa demande dans le contexte actif.');
    const ws = await getReferenceWorkspace();
    const row = [...(ws.documentaryAnswers ?? [])].reverse().find(value => value.sourceReadingReference === readingArchiveRef.current?.contentReference);
    const read = row && readHopV55DocumentaryAnswerRecord(row);
    if (!read || read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v1'
      || read.record.answerReference !== expectedAnswer || read.record.sourceReadingReference !== readingArchiveRef.current?.contentReference
      || expectedInterpretation && read.record.answerSnapshot.interpretationReference !== expectedInterpretation) {
      throw Error('La réponse ou son interprétation exacte n’est plus celle de cette lecture.');
    }
    return { ws, record: read.record };
  }
  async function reinterpretDocumentary(request: HopV55DocumentaryReinterpretRequest) {
    const { record } = await currentDocumentaryAnswer(request.expectedAnswerReference, request.expectedInterpretationReference);
    if (!request.reason.trim()) throw Error('Précise le motif de la nouvelle interprétation.');
    const prep = prepareBrewingScenarioContext(await currentContext());
    const draft = reviseHopV55DocumentaryRequest({ draft: resumeHopV55DocumentaryRequestDraft(record), request: request.request });
    const next = buildHopV55DocumentaryAnswerRecord({ draft, prepared: prep, answerRecordId: uid('documentary-answer'),
      revisionContext: { sourceAnswerRecordReference: record.reference, sourceAnswerReference: record.answerReference,
        reason: request.reason.trim(), recordedAt: iso(), recordedBy: { origin: services.scope === 'fixture' ? 'fixture' : 'user', label: 'Brasseur' } } });
    await persistDocumentaryAnswer(next);
    setNotice('Nouvelle réponse documentaire conservée. La précédente et ses dossiers restent intacts.');
    return next.answerSnapshot;
  }
  async function saveDocumentaryDossier(request: HopV55DocumentaryDossierSaveRequest) {
    const { record } = await currentDocumentaryAnswer(request.expectedAnswerReference, request.expectedInterpretationReference);
    const dossier = createHopV55DocumentaryDossierRecord({ answerRecord: record, dossierId: uid('documentary-dossier'),
      ...request, createdAt: iso(), createdBy: { origin: services.scope === 'fixture' ? 'fixture' : 'user', label: 'Brasseur' } });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await getReferenceWorkspace();
      if (latest.id !== dossier.workspaceId) throw Error('Le dossier actif a changé.');
      const existing = latest.documentaryDossiers?.find(row => row.id === dossier.id);
      if (existing) {
        const read = readHopV55DocumentaryDossierRecord(existing);
        if (read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-dossier-record-v1'
          || read.record.reference !== dossier.reference) throw Error('Cette identité de dossier contient déjà un autre choix.');
        return read.record.dossierSnapshot;
      }
      try {
        await saveFullWorkspace({ ...latest, documentaryDossiers: [...(latest.documentaryDossiers ?? []), dossier], updatedAt: iso() });
        setNotice('Dossier documentaire conservé. Les opérations et doses restent à qualifier.'); return dossier.dossierSnapshot;
      } catch (err) { if ((err as { code?: string }).code !== 'staleRevision' || attempt === 2) throw err; }
    }
    throw Error('Le dossier n’a pas pu être conservé.');
  }
  async function chooseDocumentaryCandidates(request: HopV55DocumentaryCandidateChoiceRequest) {
    const { record } = await currentDocumentaryAnswer(request.expectedAnswerReference);
    if (!record.answerSnapshot.requestSnapshot.needs.some(need => need.id === request.needId)) throw Error('Le besoin choisi n’appartient pas à cette réponse.');
    const query = request.query.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
    if (query.length < 2) return [];
    return record.answerSnapshot.requestSnapshot.materials.filter(material =>
      `${material.name} ${material.id} ${material.variety?.aliases.join(' ') ?? ''}`.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').includes(query))
      .map(material => structuredClone(material));
  }
  async function runDocumentaryResult<T>(action: () => Promise<T>): Promise<T> {
    let value!: T;
    // The receiving panel owns the error next to the retained gesture and retry.
    await run(async () => { value = await action(); }, true, false);
    return value;
  }
  async function correctDecision(request: HopV55DecisionCorrectionRequest) {
    const { archive, prep, ws } = await currentDecisionReading(request.sourceReadingReference);
    if (archive.format === 'hop-v55-decision-reading-v4') {
      throw Error('Une lecture V4 se corrige par ses annotations sémantiques; aucun critère V1–V3 n’est reconstruit.');
    }
    const corrected = applyHopV55DecisionCriteriaCorrection({ reading: archive.reading, criterionDrafts: request.criterionDrafts,
      prepared: prep, sourceReadingReference: archive.contentReference, recordedAt: iso() });
    const correctedArchive = await persistDecisionReading(corrected, ws, prep);
    if (documentarySynthesisEnabled) await prepareDocumentaryAnswer(correctedArchive, prep);
    setNotice('Lecture corrigée conservée avec ses fragments. L’ancienne décision reste dans l’historique.');
  }
  async function correctSemanticDecision(request: HopV55SemanticCorrectionRequestV1) {
    setSemanticCorrectionSaving(true); setSemanticCorrectionError('');
    try {
      const fingerprint = hopDecisionReference(request);
      const parent = readingArchiveRef.current;
      const pending = semanticCorrectionPending.current.get(request.commandId);
      if (pending && pending.fingerprint !== fingerprint) throw Error('Cet identifiant de correction désigne déjà d’autres annotations ou un autre motif.');
      if (readingHistoricalRef.current || parent?.format !== 'hop-v55-decision-reading-v4'
        || parent.contentReference !== request.sourceReadingReference) {
        throw Error('La lecture V4 affichée a changé ou est archivée. Rouvre sa version exacte avant de corriger.');
      }
      if (!request.reason.trim()) throw Error('Indique un motif avant de conserver cette correction sémantique.');
      const generation = workspaceGeneration.current;
      const expectedWorkspaceId = workspaceRef.current?.id;
      const ctx = await currentContext();
      const prep = prepareBrewingScenarioContext(ctx);
      const initial = await getReferenceWorkspace(ctx, prep);
      assertWorkspaceScope(generation, expectedWorkspaceId);
      if (initial.id !== parent.workspaceId || initial.ownerKey !== parent.ownerKey
        || readingArchiveRef.current?.contentReference !== parent.contentReference || readingHistoricalRef.current) {
        throw Error('Le dossier ou la lecture a changé pendant la correction. La version V4 reste intacte.');
      }
      if (hopDecisionReference(decisionSource(initial)) !== hopDecisionReference(parent.source)
        || runtimeReference(prep) !== parent.runtimeReference) {
        throw Error('La source ou le contexte de cette lecture V4 a changé. Réexamine-la avant de corriger ses annotations.');
      }
      const created = pending?.archive ?? createHopV55SemanticCorrectionArchiveV1({ parent,
        annotations: request.annotations, reason: request.reason, prepared: prep, id: `semantic-correction:${request.commandId}`,
        recordedAt: iso(), source: decisionSource(initial), runtimeReference: runtimeReference(prep) });
      semanticCorrectionPending.current.set(request.commandId, { fingerprint, archive: created });
      for (let attempt = 0; attempt < 3; attempt++) {
        const latest = await getReferenceWorkspace();
        assertWorkspaceScope(generation, expectedWorkspaceId);
        if (latest.id !== created.workspaceId || latest.ownerKey !== created.ownerKey
          || hopDecisionReference(decisionSource(latest)) !== hopDecisionReference(created.source)
          || readingArchiveRef.current?.contentReference !== parent.contentReference || readingHistoricalRef.current) {
          throw Error('La source ou la lecture affichée a changé pendant la sauvegarde. La correction reste à reprendre depuis sa version exacte.');
        }
        if (!latest.decisionReadings?.some(row => row.contentReference === parent.contentReference)) {
          throw Error('L’archive parent V4 n’est plus dans le dossier courant. Aucune correction n’a été ajoutée.');
        }
        const currentPrep = prepareBrewingScenarioContext(await currentContext());
        assertWorkspaceScope(generation, expectedWorkspaceId);
        if (runtimeReference(currentPrep) !== created.runtimeReference) {
          throw Error('Les données sources ont changé pendant la correction. Relis la question avant de créer sa nouvelle version.');
        }
        const prior = latest.decisionReadings?.find(row => row.id === created.id);
        if (prior) {
          const read = readHopV55DecisionReadingArchive(prior);
          if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v4'
            || read.archive.contentReference !== created.contentReference) throw Error('Cette identité de correction contient déjà un autre contenu.');
          if (readingArchiveRef.current?.contentReference === parent.contentReference && !readingHistoricalRef.current) {
            intentRef.current = read.archive.reading.intent; setIntent(read.archive.reading.intent); setQuestion(read.archive.reading.intent.question);
            readingArchiveRef.current = read.archive; setReadingArchive(read.archive); setReading(read.archive.reading);
            setReadingHistorical(false); setView('decide');
            setNotice('Correction V4 exacte relue après sa sauvegarde. La lecture d’origine reste intacte.');
          }
          return;
        }
        try {
          const saved = await saveFullWorkspace({ ...latest, intent: created.reading.intent,
            decisionReadings: [...(latest.decisionReadings ?? []), created], updatedAt: iso() });
          if (readingArchiveRef.current?.contentReference === parent.contentReference && !readingHistoricalRef.current
            && workspaceRef.current?.id === saved.id) {
            intentRef.current = created.reading.intent; setIntent(created.reading.intent); setQuestion(created.reading.intent.question);
            readingArchiveRef.current = created; setReadingArchive(created); setReading(created.reading);
            setDocumentaryRecordId(undefined); setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined);
            setReadingHistorical(false); setView('decide');
            setNotice('Correction sémantique V4 archivée comme nouvelle version. La lecture d’origine reste intacte.');
          }
          return;
        } catch (cause) {
          if ((cause as { code?: string }).code !== 'staleRevision' || attempt === 2) throw cause;
        }
      }
      throw Error('La correction sémantique attend une reprise avec le même identifiant.');
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'La correction sémantique n’a pas été conservée.';
      setSemanticCorrectionError(message);
      throw cause;
    } finally {
      setSemanticCorrectionSaving(false);
    }
  }
  async function confirmQuestionScopes(request: { commandId: string; sourceReadingReference: string;
    expectedScopeLedgerReference: string; actions: readonly HopV55QuestionScopeDispositionActionV1[]; reason: string }) {
    const fingerprint = hopDecisionReference(request);
    const pending = scopePending.current.get(request.commandId);
    if (pending && pending.fingerprint !== fingerprint) throw Error('Cette commande identifie une autre disposition de question.');
    const initial = await getReferenceWorkspace();
    const received = initial.decisionReadings?.find(row => row.id === `question-scope:${request.commandId}`);
    if (received) {
      const read = readHopV55DecisionReadingArchive(received);
      if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v3'
        || read.archive.transition.parentReadingReference !== request.sourceReadingReference
        || read.archive.transition.reason !== request.reason
        || pending && pending.archive.contentReference !== read.archive.contentReference) throw Error('Le reçu de cette disposition ne correspond pas à la commande.');
      const parentRaw = initial.decisionReadings?.find(row => row.contentReference === request.sourceReadingReference);
      const parent = parentRaw && readHopV55DecisionReadingArchive(parentRaw);
      if (!parent || parent.status !== 'available' || parent.archive.format !== 'hop-v55-decision-reading-v3'
        || parent.archive.scopeLedger.reference !== request.expectedScopeLedgerReference) throw Error('Le parent exact de la disposition n’est plus disponible.');
      const expectedLedger = reviseHopV55QuestionScopeLedgerV1({ ledger: parent.archive.scopeLedger,
        question: parent.archive.reading.intent.question, reading: parent.archive.reading, transition: read.archive.transition,
        expectedParentReadingReference: parent.archive.contentReference, actions: request.actions });
      if (expectedLedger.reference !== read.archive.scopeLedger.reference) throw Error('Le reçu contient d’autres dispositions de question.');
      if (readingArchiveRef.current?.contentReference === request.sourceReadingReference && !readingHistoricalRef.current) {
        readingArchiveRef.current = read.archive; setReadingArchive(read.archive); setReading(hopV55DecisionReadingForDisplay(read.archive));
        setDocumentaryRecordId(undefined); setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined);
        setNotice('Disposition déjà conservée, relue sous ses références exactes.');
      }
      return read.archive;
    }
    const { archive, prep, ws } = await currentDecisionReading(request.sourceReadingReference);
    if (archive.format !== 'hop-v55-decision-reading-v3' || archive.scopeLedger.reference !== request.expectedScopeLedgerReference) {
      throw Error('La portée de cette question a changé depuis la confirmation.');
    }
    const transition = { actId: request.commandId, kind: 'reviseScopes' as const, parentReadingReference: archive.contentReference,
      reason: request.reason, recordedAt: iso(), actor: { origin: 'user' as const, label: 'Brasseur' } };
    const created = pending?.archive ?? createHopV55DecisionReadingArchiveV3({ id: `question-scope:${request.commandId}`,
      ownerKey: services.ownerKey, workspaceId: ws.id, recordedAt: transition.recordedAt, reading: archive.reading,
      source: archive.source, runtimeReference: runtimeReference(prep), transition,
      scopeLedger: reviseHopV55QuestionScopeLedgerV1({ ledger: archive.scopeLedger, question: archive.reading.intent.question,
        reading: archive.reading, transition, expectedParentReadingReference: archive.contentReference, actions: request.actions }),
      ...(archive.programPreparation ? { programPreparation: archive.programPreparation } : {}) });
    scopePending.current.set(request.commandId, { fingerprint, archive: created });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await getReferenceWorkspace();
      if (latest.id !== created.workspaceId || readingArchiveRef.current?.contentReference !== archive.contentReference
        || readingHistoricalRef.current || hopDecisionReference(decisionSource(latest)) !== hopDecisionReference(created.source)) {
        throw Error('La lecture ou la source a changé pendant cette confirmation.');
      }
      const present = latest.decisionReadings?.find(row => row.id === created.id);
      if (present && present.contentReference !== created.contentReference) throw Error('Cette identité de lecture porte un autre contenu.');
      try {
        if (runtimeReference(prepareBrewingScenarioContext(await currentContext())) !== created.runtimeReference) {
          throw Error('Les données sources ont changé pendant cette confirmation. Relis la question avant une nouvelle disposition.');
        }
        if (!present) await saveFullWorkspace({ ...latest, intent: created.reading.intent,
          decisionReadings: [...(latest.decisionReadings ?? []), created], updatedAt: iso() });
        readingArchiveRef.current = created; setReadingArchive(created); setReading(hopV55DecisionReadingForDisplay(created));
        setDocumentaryRecordId(undefined); setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined);
        setNotice('Portées confirmées et motifs conservés. Les anciennes lectures restent consultables.');
        return created;
      } catch (err) { if ((err as { code?: string }).code !== 'staleRevision' || attempt === 2) throw err; }
    }
    throw Error('La disposition attend une reprise de sauvegarde.');
  }
  async function confirmSemanticQuestionScopes(request: { commandId: string; sourceReadingReference: string;
    expectedScopeLedgerReference: string; actions: readonly HopV55QuestionScopeDispositionActionV1[]; reason: string }) {
    const fingerprint = hopDecisionReference(request);
    const pending = semanticScopePending.current.get(request.commandId);
    if (pending && pending.fingerprint !== fingerprint) throw Error('Cette commande de portée V4 désigne d’autres actions.');
    const parent = readingArchiveRef.current;
    if (readingHistoricalRef.current || parent?.format !== 'hop-v55-decision-reading-v4'
      || parent.contentReference !== request.sourceReadingReference || parent.scopeLedger?.reference !== request.expectedScopeLedgerReference) {
      throw Error('La lecture V4 ou son ledger a changé; relis cette version avant de disposer ses portées.');
    }
    if (!request.reason.trim() || !request.actions.length) throw Error('Un motif et au moins une disposition explicite sont nécessaires.');
    const generation = workspaceGeneration.current;
    const expectedWorkspaceId = workspaceRef.current?.id;
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const initial = await getReferenceWorkspace(ctx, prep);
    assertWorkspaceScope(generation, expectedWorkspaceId);
    if (initial.id !== parent.workspaceId || initial.ownerKey !== parent.ownerKey
      || hopDecisionReference(decisionSource(initial)) !== hopDecisionReference(parent.source)
      || runtimeReference(prep) !== parent.runtimeReference || readingArchiveRef.current?.contentReference !== parent.contentReference
      || readingHistoricalRef.current) throw Error('La source ou la lecture V4 a changé pendant les dispositions.');
    const created = pending?.archive ?? (() => {
      const transition = { actId: request.commandId, kind: 'reviseScopes' as const,
        parentReadingReference: parent.contentReference, reason: request.reason.trim(), recordedAt: iso(),
        actor: { origin: 'user' as const, label: 'Brasseur' } };
      const scopeLedger = reviseHopV55QuestionScopeLedgerV1({ ledger: parent.scopeLedger!, question: parent.reading.intent.question,
        reading: parent.reading, transition, expectedParentReadingReference: parent.contentReference, actions: request.actions });
      return createHopV55DecisionReadingArchiveV4({ id: `semantic-scope:${request.commandId}`, ownerKey: parent.ownerKey,
        workspaceId: parent.workspaceId, recordedAt: transition.recordedAt, reading: parent.reading, source: parent.source,
        runtimeReference: runtimeReference(prep), scopeLedger, transition, ...(parent.lineage ? { lineage: parent.lineage } : {}) });
    })();
    semanticScopePending.current.set(request.commandId, { fingerprint, archive: created });
    for (let attempt = 0; attempt < 3; attempt++) {
      const latest = await getReferenceWorkspace();
      assertWorkspaceScope(generation, expectedWorkspaceId);
      if (latest.id !== created.workspaceId || latest.ownerKey !== created.ownerKey
        || hopDecisionReference(decisionSource(latest)) !== hopDecisionReference(created.source)
        || readingArchiveRef.current?.contentReference !== parent.contentReference || readingHistoricalRef.current) {
        throw Error('La source ou la sélection affichée a changé pendant les dispositions.');
      }
      if (!latest.decisionReadings?.some(row => row.contentReference === parent.contentReference)) {
        throw Error('L’archive parent V4 ne figure plus dans le dossier courant.');
      }
      const currentPrep = prepareBrewingScenarioContext(await currentContext());
      assertWorkspaceScope(generation, expectedWorkspaceId);
      if (runtimeReference(currentPrep) !== created.runtimeReference) throw Error('Le contexte source a changé; relis la question avant de confirmer les portées.');
      const existing = latest.decisionReadings?.find(row => row.id === created.id);
      if (existing) {
        const read = readHopV55DecisionReadingArchive(existing);
        if (read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v4'
          || read.archive.contentReference !== created.contentReference) throw Error('Cette identité de portée V4 contient un autre contenu.');
        if (readingArchiveRef.current?.contentReference === parent.contentReference && !readingHistoricalRef.current) {
          readingArchiveRef.current = read.archive; setReadingArchive(read.archive); setReading(read.archive.reading);
          setReadingHistorical(false); setNotice('Dispositions V4 exactes relues depuis leur archive. La lecture parent reste intacte.');
        }
        return read.archive;
      }
      try {
        const saved = await saveFullWorkspace({ ...latest, intent: created.reading.intent,
          decisionReadings: [...(latest.decisionReadings ?? []), created], updatedAt: iso() });
        if (workspaceRef.current?.id === saved.id && readingArchiveRef.current?.contentReference === parent.contentReference
          && !readingHistoricalRef.current) {
          intentRef.current = created.reading.intent; setIntent(created.reading.intent); setQuestion(created.reading.intent.question);
          readingArchiveRef.current = created; setReadingArchive(created); setReading(created.reading);
          setDocumentaryRecordId(undefined); setQualifiedPreparationReference(undefined); setQualifiedEntry(undefined);
          setReadingHistorical(false); setNotice('Dispositions V4 conservées dans une nouvelle archive; la lecture parent reste intacte.');
        }
        return created;
      } catch (cause) {
        if ((cause as { code?: string }).code !== 'staleRevision' || attempt === 2) throw cause;
      }
    }
    throw Error('Les dispositions V4 attendent une reprise avec le même identifiant.');
  }
  function activeDecisionProgram(prep: PreparedBrewingScenarioContext, ws: HopV55Workspace) {
    const copy = activeWorkspaceProgramCopy(ws);
    const baseline = activeFutureDraftRef.current?.hypotheticalBaseline ?? getHopV55AdoptedBaseline(ws);
    return copy?.programAfter ?? prep.runtime.current?.program ?? (baseline?.kind === 'hypothetical' ? baseline.program : undefined);
  }
  async function prepareDecisionProgram(request: HopV55DecisionProgramPreparationRequest) {
    const generation = workspaceGeneration.current;
    const { archive, prep, ws } = await currentDecisionReading(request.sourceReadingReference);
    const activeProgram = activeDecisionProgram(prep, ws);
    if (!activeProgram) throw Error('Déclare un programme de référence avant de préparer ces opérations. Les choix restent distincts d’une recette.');
    const criteria: HopIntentEvidenceCriterion[] = archive.format === 'hop-v55-decision-reading-v4'
      ? projectHopV55SemanticDecisionV1(archive.reading.annotations).domainCriteria
      : buildHopV55DecisionCriteria(archive.reading.criterionDrafts);
    const input = { branch: { id: uid('guided-program'), label: request.branchLabel }, program: structuredClone(activeProgram),
      materials: structuredClone(prep.runtime.materials), intent: { question: archive.reading.intent.question,
        interpretation: archive.reading.interpretation, criteria: structuredClone(criteria) },
      operations: structuredClone(request.operations), expectedProgramReference: programFingerprint(activeProgram) };
    const evaluation = prepareHopV55DecisionProgram(input);
    const programPreparation = { input, result: evaluation };
    if (archive.format === 'hop-v55-decision-reading-v4') {
      const nextReading = structuredClone(archive.reading);
      nextReading.operationDrafts = structuredClone(input.operations);
      nextReading.branches = [];
      const nextArchive = createHopV55DecisionReadingArchiveV4({ id: uid('semantic-program'), ownerKey: archive.ownerKey,
        workspaceId: archive.workspaceId, recordedAt: iso(), reading: nextReading, source: archive.source,
        runtimeReference: runtimeReference(prep), programPreparation,
        ...(archive.scopeLedger ? { scopeLedger: archive.scopeLedger } : {}),
        ...(archive.transition ? { transition: archive.transition } : {}), ...(archive.lineage ? { lineage: archive.lineage } : {}) });
      await persistSemanticDecisionArchive(nextArchive, ws, { reference: archive.contentReference, historical: false, generation });
    } else {
      await persistDecisionReading(archive.reading, ws, prep, programPreparation);
    }
    setNotice(evaluation.status === 'ready' ? 'Proposition entière conservée. Vérifie ses conditions avant de comparer.'
      : 'Préparation conservée avec les choix restant à préciser. Aucun programme n’a été comparé ou appliqué.');
  }
  async function compareDecisionProgram(request: HopV55DecisionProgramComparisonRequest) {
    const { archive, prep, ws } = await currentDecisionReading(request.preparationReference);
    const preparedProgram = archive.programPreparation;
    if (!preparedProgram || preparedProgram.result.status !== 'ready' || !preparedProgram.result.branch) {
      throw Error('La préparation doit être complète avant de comparer son programme.');
    }
    const activeProgram = activeDecisionProgram(prep, ws);
    if (!activeProgram || programFingerprint(activeProgram) !== preparedProgram.result.programReference
      || hopDecisionReference(prep.runtime.materials) !== hopDecisionReference(preparedProgram.input.materials)) {
      throw Error('Le programme ou ses matières ont changé depuis cette préparation. Prépare une nouvelle comparaison.');
    }
    const branch = structuredClone(preparedProgram.result.branch);
    setDraftBranch(branch); await simulate([branch]);
  }
  async function resumeDecisionProgram(request: HopV55DecisionProgramResumeRequestV1) {
    const generation = workspaceGeneration.current;
    const selectedReadingReference = readingArchiveRef.current?.contentReference;
    const selectedHistorical = readingHistoricalRef.current;
    const ws = await getReferenceWorkspace();
    const row = ws.decisionReadings?.find(item => item.contentReference === request.archiveReference);
    const read = row && readHopV55DecisionReadingArchive(row);
    if (!read || read.status !== 'available' || read.archive.format !== 'hop-v55-decision-reading-v2'
      && read.archive.format !== 'hop-v55-decision-reading-v3' && read.archive.format !== 'hop-v55-decision-reading-v4'
      || !read.archive.programPreparation || read.archive.programPreparation.result.status === 'ready') {
      throw Error('Cette préparation incomplète n’est plus disponible sous sa référence exacte.');
    }
    const archive = read.archive;
    if (archive.format === 'hop-v55-decision-reading-v4'
      && (selectedReadingReference !== archive.contentReference || readingArchiveRef.current?.contentReference !== archive.contentReference
        || readingHistoricalRef.current !== selectedHistorical)) {
      throw Error('La préparation V4 n’est plus celle qui est affichée. Rouvre son archive exacte avant de la reprendre.');
    }
    const stored = archive.programPreparation!;
    if (hopDecisionReference(stored) !== hopDecisionReference(request.preparation)) {
      throw Error('Les choix transmis ne correspondent pas à la préparation conservée. Relis son archive.');
    }
    const prep = prepareBrewingScenarioContext(await currentContext());
    const program = activeDecisionProgram(prep, ws);
    if (!program) throw Error('Le programme actif n’est pas établi. Les choix restent conservés dans l’archive.');
    const current = {
      program, materials: prep.runtime.materials,
      runtimeReferences: {
        recipeReference: prep.runtime.current?.recipeReference,
        inputReference: prep.runtime.current?.inputReference,
        stockAvailabilityReference: prep.runtime.current?.stockAvailabilityReference,
        dataRevision: prep.runtime.dataRevision,
      },
    };
    if (hopDecisionReference(current) !== hopDecisionReference(request.expectedContext)) {
      throw Error('Le contexte affiché a changé pendant la reprise. Les choix restent dans l’archive; vérifie le programme actif puis reprends-les.');
    }
    const contextChanged = archive.runtimeReference !== runtimeReference(prep)
      || programFingerprint(stored.input.program) !== programFingerprint(program)
      || hopDecisionReference(stored.input.materials) !== hopDecisionReference(prep.runtime.materials);
    const input = { ...structuredClone(stored.input), program: structuredClone(program),
      materials: structuredClone(prep.runtime.materials), expectedProgramReference: programFingerprint(program) };
    const evaluation = prepareHopV55DecisionProgram(input);
    function updateOperationDrafts<T extends HopV55QuestionReading | HopV55SemanticQuestionReadingV1>(reading: T): T {
      const next = structuredClone(reading);
      next.operationDrafts = structuredClone(input.operations);
      next.branches = [];
      if (contextChanged) {
        // Preserve the requested choices while keeping an old advisory response
        // in its original archive instead of presenting it as current.
        delete next.response;
        next.unresolved = [...new Set([...next.unresolved,
          'Le contexte de la préparation a changé. Les opérations sont reprises avec leurs choix; les compatibilités doivent être vérifiées avant comparaison.'])];
      }
      return next;
    }
    if (archive.format === 'hop-v55-decision-reading-v4') {
      const nextReading = updateOperationDrafts(archive.reading);
      const nextArchive = createHopV55DecisionReadingArchiveV4({ id: uid('semantic-program-resume'), ownerKey: archive.ownerKey,
        workspaceId: archive.workspaceId, recordedAt: iso(), reading: nextReading, source: archive.source,
        runtimeReference: runtimeReference(prep), programPreparation: { input, result: evaluation },
        ...(archive.scopeLedger ? { scopeLedger: archive.scopeLedger } : {}),
        ...(archive.transition ? { transition: archive.transition } : {}), ...(archive.lineage ? { lineage: archive.lineage } : {}) });
      await persistSemanticDecisionArchive(nextArchive, ws, { reference: archive.contentReference,
        historical: selectedHistorical, generation });
    } else {
      const nextReading = updateOperationDrafts(archive.reading);
      await persistDecisionReading(nextReading, ws, prep, { input, result: evaluation });
    }
    setRecord(undefined); setResult(undefined); setDisplayedSnapshot(undefined);
    setSelectedBranchId(undefined); setProgramPreview(undefined); setDraftBranch(undefined); setHistoricalView(false);
    setNotice(contextChanged
      ? 'Choix archivés repris sans calcul. Le contexte a changé; vérifie les compatibilités indiquées avant de comparer.'
      : 'Choix archivés repris sans calcul. Complète seulement les paramètres encore manquants; l’archive reste intacte.');
  }
  async function choose(branchId: string) {
    if (!result || !displayedSnapshot) return;
    const branch = [result.baseline, ...result.branches].find(row => row.id === branchId);
    if (!branch) throw Error('La branche n’est plus dans cette prévision.');
    const latest = await services.scenarios.read(services.ownerKey, result.scenarioId);
    if (latest?.status !== 'available') throw Error('Dossier de prévision indisponible.');
    await services.scenarios.preferBranch({ ownerKey: services.ownerKey, scenarioId: result.scenarioId, eventId: uid('preference'),
      expectedRevision: latest.record.dossier.revision, recordedAt: iso(), preferenceId: uid('choice'),
      snapshotReference: displayedSnapshot.reference, branchId, branchReference: branch.reference,
      reason: 'Choix explicite dans l’atelier, avant aperçu.' });
    await saveWorkspace({ selected: { scenarioId: result.scenarioId, snapshotReference: displayedSnapshot.reference, branchId, branchReference: branch.reference } });
    setSelectedBranchId(branchId); setProgramPreview(undefined); setNotice('Préférence conservée. Le programme reste à prévisualiser.');
    await refreshRecords();
  }
  async function saveCompletedRecipeCopy(copy: HopV55Copy, receipt: HopV55FullRecipeCopyReceipt) {
    const ws = await getReferenceWorkspace();
    await saveFullWorkspace({ ...ws, copies: ws.copies.some(row => row.id === copy.id) ? ws.copies : [...ws.copies, copy],
      fullCopyReceipts: ws.fullCopyReceipts?.some(row => row.copyId === copy.id) ? ws.fullCopyReceipts : [...(ws.fullCopyReceipts ?? []), receipt],
      activeCopyId: copy.id, activeProgramCopyId: undefined, activeFutureDraftSource: undefined });
    activeFutureDraftRef.current = undefined; setActiveFutureDraft(undefined);
    activeRecipeRef.current = copy.recipe; setActiveRecipe(copy.recipe);
    await currentContext(); setView('beer'); setNotice('Nouvelle recette locale conservée avec son plan, sa qualification et ses hypothèses exactes.'); await refreshRecords();
  }
  /** The wizard now holds the applied hop lines; reread its draft so this forecast becomes historical for it. */
  async function afterRecipeDraftApplication(record: HopV55RecipeApplicationRecordV1) {
    await run(async () => {
      await currentContext();
      setNotice(`Programme appliqué au brouillon de recette · branche ${record.branchId}. Seules les lignes de houblon ont changé; enregistre la recette depuis le récapitulatif pour la conserver. Cette prévision reste consultable comme historique du brouillon précédent.`);
      await refreshRecords();
    });
  }
  async function saveFutureDraft(draft: HopV55FutureRecipeDraftV1) {
    const read = readHopV55FutureRecipeDraft(draft);
    if (read.status !== 'available') throw Error(read.reason);
    const ws = await getReferenceWorkspace();
    const source = { kind: 'localFutureDraft' as const, workspaceId: ws.id, draftId: draft.draftId,
      revision: draft.revision, contentReference: draft.contentReference };
    await saveFullWorkspace({ ...ws, futureDrafts: ws.futureDrafts?.some(row => row.contentReference === draft.contentReference) ? ws.futureDrafts : [...(ws.futureDrafts ?? []), read.draft],
      activeFutureDraftSource: source, activeCopyId: undefined, activeProgramCopyId: undefined });
    setActiveRecipe(undefined); activeRecipeRef.current = undefined;
    activeFutureDraftRef.current = read.draft; setActiveFutureDraft(read.draft);
    await currentContext(); setView('beer'); setNotice('Brouillon futur conservé localement. Sa référence hypothétique et le passé réel restent distincts.'); await refreshRecords();
  }
  async function futureReferences(): Promise<HopV55FutureRecipeCurrentReferences> {
    const ctx = await loadExactContext();
    const prep = prepareBrewingScenarioContext(ctx);
    const draft = activeFutureDraftRef.current;
    const sourceResult = draft ? await services.scenarios.read(services.ownerKey, draft.origin.scenarioId) : null;
    const snapshot = draft && sourceResult?.status === 'available'
      ? sourceResult.record.snapshots.find(row => row.reference === draft.origin.snapshotReference) : displayedSnapshot;
    if (!snapshot) throw Error('La prévision d’origine du brouillon n’est plus relisible.');
    return { snapshot, adoptedReference: workspaceRef.current ? getHopV55ReferenceProjection(workspaceRef.current)?.currentReference ?? null : null,
      materials: prep.runtime.materials, styles: ctx.hopIndex?.knowledge.filter((row): row is BrewingStyleGuide => row.kind === 'styleGuide'),
      yeasts: ctx.hopIndex?.knowledge.filter((row): row is HopYeast => row.kind === 'yeast') };
  }
  async function saveFutureMaterialization(recipe: Recipe, receipt: HopV55FutureRecipeMaterializationReceiptV1) {
    const ws = await getReferenceWorkspace();
    await saveFullWorkspace({ ...ws, futureRecipeMaterializations: ws.futureRecipeMaterializations?.some(row => row.receipt.contentReference === receipt.contentReference)
      ? ws.futureRecipeMaterializations : [...(ws.futureRecipeMaterializations ?? []), { recipe, receipt }] });
    setView('beer'); setNotice('Nouvelle recette préparée localement avec son reçu de création. Sa sauvegarde reste une action distincte.'); await refreshRecords();
  }
  async function restoreFutureDraft(source?: HopV55Workspace['activeFutureDraftSource']) {
    const ws = workspaceRef.current;
    if (!ws) throw Error('Ouvre le dossier avant de reprendre un brouillon.');
    const draft = source ? await services.loadFutureDraft(source) : undefined;
    await saveWorkspace({ activeFutureDraftSource: source, activeCopyId: undefined, activeProgramCopyId: undefined });
    activeFutureDraftRef.current = draft; setActiveFutureDraft(draft);
    activeRecipeRef.current = undefined; setActiveRecipe(undefined);
    await currentContext(); setView('beer'); setSelectedBranchId(undefined);
    setNotice(source ? 'Révision du brouillon relue sans recalcul.' : 'Exploration initiale retrouvée ; les brouillons et prévisions restent conservés.');
  }
  async function completeFutureDraft(draft: HopV55FutureRecipeDraftV1) {
    const source = await services.scenarios.read(services.ownerKey, draft.origin.scenarioId);
    if (source?.status !== 'available') throw Error('Le dossier de prévision d’origine n’est pas disponible.');
    const snapshot = source.record.snapshots.find(row => row.reference === draft.origin.snapshotReference);
    if (!snapshot) throw Error('Le snapshot d’origine ne figure plus dans le dossier.');
    displaySnapshot(source.record, snapshot);
    setSelectedBranchId(draft.origin.branchId); setView('decide');
  }
  async function exploreFutureDraft(draft: HopV55FutureRecipeDraftV1, proposedMasses?: HopV55FutureRecipeMassRecomputeProposalV1) {
    const checked = proposedMasses ? prepareHopV55FutureRecipeMassRecomputeProposal(draft) : undefined;
    if (proposedMasses && (checked?.status !== 'ready'
      || hopDecisionReference(checked.proposal) !== hopDecisionReference(proposedMasses))) {
      throw Error('Les masses déclarées ne correspondent plus au brouillon retenu. Relis ses opérations avant la nouvelle prévision.');
    }
    await saveFutureDraft(draft);
    setEditorOpen(true); setView('decide');
    if (checked?.status === 'ready') {
      const branch: BrewingScenarioBranchRequest = {
        id: uid('future-mass-correction'), label: 'Masses déclarées du brouillon futur', assumptions: [],
        programChanges: programDelta(draft.hypotheticalBaseline.program, checked.proposal.proposedBaseline.program),
      };
      setDraftBranch(branch); await simulate([branch]);
    }
  }
  function recomputeIdentity() {
    if (pendingPreparationId) throw Error('Termine le rattachement de la prévision en attente, ou conserve-la dans l’historique avant de préparer un autre essai.');
    recomputeReferenceRef.current = workspaceRef.current ? getHopV55ReferenceProjection(workspaceRef.current)?.currentReference ?? null : null;
    return { scenarioId: uid('scenario'), revision: 1 };
  }
  async function saveRecomputedCandidate(_candidate: Recipe, payload: HopV55FullRecipeCopyRecomputePayload) {
    const read = readHopV55FullRecipeCopyRecomputePayload(payload);
    if (read.status !== 'available') throw Error(read.reason);
    payload = read.payload;
    if (!displayedSnapshot || !result || payload.supersedes.snapshotReference !== displayedSnapshot.reference ||
      payload.supersedes.scenarioId !== result.scenarioId || payload.result.inputReference !==
      (await import('../../domain/brewingScenario')).brewingScenarioInputReference(payload.request)) {
      throw Error('La nouvelle prévision ne correspond pas au scénario actuellement consulté. Les anciennes versions restent intactes.');
    }
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    let ws = await getReferenceWorkspace(ctx, prep);
    const resolved = prepareHopV55AdoptedContext({ context: ctx, workspace: ws, expected: recomputeReferenceRef.current });
    if (resolved.resolution.status !== 'absent' && resolved.resolution.status !== 'resolved') {
      throw Error('La référence de comparaison a changé pendant ce nouvel aperçu. Relis-la avant de confirmer.');
    }
    const binding = 'cultureBinding' in resolved ? resolved.cultureBinding : undefined;
    const current = prep.runtime.current;
    if (payload.request.baseline.kind !== 'recipe' || !current || payload.request.baseline.contextReference !== brewingScenarioCurrentReference(current)) {
      throw Error('La source physique a changé pendant la préparation. Relis-la avant d’enregistrer cette prévision.');
    }
    if (!ws.copyRecomputations?.some(row => row.contentReference === payload.contentReference)) {
      ws = await saveFullWorkspace({ ...ws, copyRecomputations: [...(ws.copyRecomputations ?? []), payload] });
    }
    setCopyHandoff(payload);
    const preparationId = uid('preparation'); setPendingPreparationId(preparationId);
    try {
      const committed = await commitHopV55Scenario({ services, workspace: ws, ownerKey: services.ownerKey, workspaceId: ws.id,
        id: preparationId, eventId: uid('result-event'), scenarioId: payload.result.scenarioId, operation: 'create',
        request: payload.request, runtimeReference: runtimeReference(prep), intent: structuredClone(intentRef.current),
        ...(readingArchiveRef.current && readingArchiveRef.current.reading.intent.question === intentRef.current.question ? { decisionReadingReference: readingArchiveRef.current.contentReference } : {}),
        reference: recomputeReferenceRef.current, ...(binding ? { cultureBinding: binding } : {}), source: workspaceSource(ws), createdAt: iso(),
        compute: () => payload.result });
      receiveScenario(committed); setPendingPreparationId(undefined); setCopyHandoff(payload); setDraftBranch(payload.request.branches.find(branch => branch.id === payload.branchId));
      await refreshRecords(); setNotice('Nouvelle prévision conservée. Le plan de copie et ses choix sont repris pour un nouvel aperçu.');
    } catch (err) {
      const latest = await services.workspaces.read(services.ownerKey, ws.id);
      if (latest) { workspaceRef.current = latest; setWorkspace(latest); }
      if (!latest?.scenarioPreparations?.some(row => row.id === preparationId)) setPendingPreparationId(undefined);
      throw err;
    }
  }
  async function makeProgramPreview() {
    if (!result || !selectedBranchId) throw Error('Choisis une branche avant son aperçu futur.');
    const checked = previewHopV55ProgramCopy({ result, branchId: selectedBranchId, context: await currentContext() });
    if (checked.status === 'blocked') { setProgramPreview(undefined); throw Error(checked.reason); }
    setProgramPreview(checked.preview); setNotice('Aperçu de programme futur prêt. Les opérations effectuées et le journal ne seront pas réécrits.');
  }
  async function applyProgramCopy() {
    if (!programPreview) throw Error('Prépare un aperçu actuel du programme futur.');
    const checked = applyHopV55ProgramCopy({ preview: programPreview, context: await currentContext(), copyId: uid('program-copy'), createdAt: iso() });
    if (checked.status === 'blocked') { setProgramPreview(undefined); throw Error(checked.reason); }
    const ws = await getReferenceWorkspace();
    await saveFullWorkspace({ ...ws, programCopies: [...(ws.programCopies ?? []), checked.copy], activeProgramCopyId: checked.copy.id, activeCopyId: undefined, activeFutureDraftSource: undefined });
    setProgramPreview(undefined); setView('beer'); setNotice('Programme futur conservé comme copie locale ; aucun fait de brassin enregistré.'); await refreshRecords();
  }
  async function restoreProgramCopy(id?: string) {
    await saveWorkspace({ activeProgramCopyId: id, activeCopyId: undefined, activeFutureDraftSource: undefined }); setProgramPreview(undefined); setView('beer');
    activeFutureDraftRef.current = undefined; setActiveFutureDraft(undefined);
    setNotice(id ? 'Programme futur historique relu sans le réaliser.' : 'Journal source relu ; les anciennes copies restent conservées.');
  }
  async function restoreCopy(id?: string) {
    const copy = workspaceRef.current?.copies.find(row => row.id === id);
    await saveWorkspace({ activeCopyId: copy?.id, activeProgramCopyId: undefined, activeFutureDraftSource: undefined });
    activeFutureDraftRef.current = undefined; setActiveFutureDraft(undefined);
    setActiveRecipe(copy?.recipe); activeRecipeRef.current = copy?.recipe;
    await currentContext(); setProgramPreview(undefined); setSelectedBranchId(undefined); setView('beer');
    setNotice(copy ? 'Copie historique rouverte ; anciennes prévisions intactes.' : 'Référence source rouverte ; les copies et prévisions restent dans l’historique.');
  }
  async function openWorkspace(id: string) {
    const generation = ++workspaceGeneration.current;
    workspaceInit.current = undefined;
    const ws = await services.workspaces.read(services.ownerKey, id);
    assertWorkspaceScope(generation);
    if (!ws) throw Error('Ce dossier local n’est pas disponible.');
    workspaceRef.current = ws; intentRef.current = ws.intent; setWorkspace(ws); setIntent(ws.intent); setQuestion(ws.intent.question); restoreReading(ws);
    setResult(undefined); setRecord(undefined); setDisplayedSnapshot(undefined); setSelectedBranchId(undefined); setProgramPreview(undefined);
    setContext(undefined); setPrepared(undefined); setView('history');
    const copy = activeWorkspaceCopy(ws);
    const draftSource = activeWorkspaceFutureDraftSource(ws);
    const draft = draftSource ? await services.loadFutureDraft(draftSource) : undefined;
    assertWorkspaceScope(generation, id);
    activeFutureDraftRef.current = draft; setActiveFutureDraft(draft);
    setActiveRecipe(copy?.recipe); activeRecipeRef.current = copy?.recipe;
    try { await currentContext(); setNotice('Dossier et source exacte relus localement. Aucun calcul relancé.'); }
    catch {
      assertWorkspaceScope(generation, id);
      // The archive remains readable even when its live source is unavailable.
      // Never retain the unrelated host recipe as a substitute.
      const archiveContext = await services.loadContext(undefined, { kind: 'exploration' });
      assertWorkspaceScope(generation, id);
      setContext(archiveContext); setPrepared(prepareBrewingScenarioContext(archiveContext));
      setNotice('Dossier historique relu. Sa source est indisponible ; les prévisions restent consultables.');
    }
  }
  function prepareStrategy(option: HopAdviceOption) {
    if (readingHistorical) { setNotice('Ce conseil est archivé. Relis la demande dans le contexte actif avant de préparer un nouveau programme.'); return; }
    const scope = option.programScope;
    if (scope.kind === 'none') return;
    const baseline = activeFutureDraftRef.current?.hypotheticalBaseline
      ?? (workspaceRef.current ? getHopV55AdoptedBaseline(workspaceRef.current) : undefined);
    const programme = prepared?.runtime.current?.program ?? (baseline?.kind === 'hypothetical' ? baseline.program : undefined);
    if (!programme) { setNotice('La piste est conservée. Déclare son programme de référence avant de préciser les quantités.'); return; }
    if (scope.kind === 'removePlanned') {
      const branch: BrewingScenarioBranchRequest = { id: uid('strategy'), label: option.title,
        programChanges: scope.additionIds.map(additionId => ({ kind: 'remove', additionId })), assumptions: [] };
      setDraftBranch(branch); void run(() => simulate([branch])); return;
    }
    const source = scope.additionIds.length === 1 ? programme.additions.find(row => row.id === scope.additionIds[0]) : undefined;
    setProgramPrefill({ id: uid('strategy-editor'), kind: source ? 'replace' : 'append', additionId: source?.id,
      materialId: scope.materialIds.length === 1 ? scope.materialIds[0] : undefined,
      use: scope.uses.length === 1 ? scope.uses[0] : undefined, label: option.title });
    setEditorOpen(true); setView('decide'); setNotice('Piste transférée à l’éditeur. Les paramètres restent à choisir explicitement avant comparaison.');
  }
  function exploreAdvice(request: HopV55DecisionExploreRequest) {
    if (!request.materialIds.length) return;
    setSelectionRequest({ id: uid('advice-explore'), materialIds: request.materialIds, terms: request.terms, scope: workspaceRef.current?.id ?? null });
    setCatalogueOpen(false); setView('explore');
    setNotice('Matière et demande conservées dans l’exploration. Précise les quantités pour comparer le programme.');
  }
  async function compose(composition: HopV55Composition) {
    const hypothetical = activeFutureDraftRef.current?.hypotheticalBaseline
      ?? (workspaceRef.current ? getHopV55AdoptedBaseline(workspaceRef.current) : undefined);
    const baselineInput = prepared?.runtime.current?.input ?? (hypothetical?.kind === 'hypothetical' ? hypothetical.input : undefined);
    const baselineProgram = prepared?.runtime.current?.program ?? (hypothetical?.kind === 'hypothetical' ? hypothetical.program : undefined);
    if (!baselineInput || !baselineProgram) throw Error('Déclare d’abord une référence. La composition reste une hypothèse hors recette.');
    const branch: BrewingScenarioBranchRequest = { id: uid('mixture'), label: composition.label, assumptions: [],
      programChanges: composition.materials.map(row => ({ kind: 'append' as const, addition: { id: uid('mixture-hop'), materialId: row.materialId,
        grams: row.grams, use: composition.use, status: 'planned' as const,
        contactHours: composition.contactHours ?? null, temperatureC: composition.temperatureC ?? null } })) };
    if (composition.volumeL !== baselineInput.volumeL) {
      branch.inputOverrides = { volumeL: composition.volumeL };
      branch.assumptions.push({ id: uid('volume-hypothesis'), path: 'recipe.volumeL', label: 'Volume du scénario', status: 'selected', origin: 'userHypothesis',
        explanation: 'Volume choisi dans le creuset, distinct du volume enregistré.', value: composition.volumeL, unit: 'L' });
    }
    if (composition.yeastId && composition.yeastId !== baselineInput.yeastId) {
      branch.inputOverrides = { ...branch.inputOverrides, yeastId: composition.yeastId };
      branch.assumptions.push({ id: uid('culture-hypothesis'), path: 'recipe.yeastId', label: 'Souche du scénario', status: 'selected', origin: 'userHypothesis',
        explanation: 'Souche choisie pour la simulation ; cela ne réalise aucun nouvel ensemencement.', value: composition.yeastId });
    }
    setDraftBranch(branch); await simulate([branch]);
  }
  async function useCatalogue(record: BrewerCatalogueLookupRecord) {
    // An explicit catalogue hand-off needs the canonical local origin frame
    // before Explorer receives its identities; no mass or employment is supplied.
    const ws = await getReferenceWorkspace();
    const ctx = await currentContext();
    const prep = prepareBrewingScenarioContext(ctx);
    if (record.kind === 'hopVariety') {
      const material = prep.runtime.materials.find(row => row.variety?.id === record.id && !row.lot && row.id.startsWith('variety:'));
      if (!material) throw Error('La fiche a été enregistrée mais sa projection n’est pas encore chargée ; relis le catalogue avant de composer.');
      const requestId = uid('catalogue-use');
      catalogueSelectionLabels.current.set(requestId, 'name' in record.record ? record.record.name : record.id);
      setSelectionRequest({ id: requestId, materialId: material.id, scope: ws.id });
      setCatalogueOpen(false); setView('explore'); return;
    } else if (record.kind === 'yeastStrain') setSelectionRequest({ id: uid('catalogue-use'), yeastId: record.id });
    else if (record.kind === 'brewingStyle' && 'kind' in record.record && record.record.kind === 'styleGuide') {
      const guide = record.record;
      setStylePrefill({ id: uid('catalogue-style-use'), guideId: guide.id, version: guide.version,
        ...(guide.styles.length === 1 ? { styleId: guide.styles[0].id } : {}) });
      setCatalogueOpen(false); setPlanningOpen(true); setView('decide');
      setNotice('Style relu avec ses sources. Choisis son rôle avant de préparer la nouvelle prévision.'); return;
    }
    setCatalogueOpen(false); setView('explore');
    setNotice(`${'name' in record.record ? record.record.name : record.id} relu pour l’exploration. Son ID et ses sources sont conservés.`);
  }

  function catalogueSelectionHandled(outcome: HopV55ExplorerSelectionOutcome) {
    const label = catalogueSelectionLabels.current.get(outcome.requestId);
    if (!label) return;
    catalogueSelectionLabels.current.delete(outcome.requestId);
    setNotice(outcome.waitingFor === 'reference'
      ? `${label} relu pour l’exploration : en attente d’un programme de référence pour entrer dans l’essai. Rien n’est enregistré avant « Préparer l’essai ».`
      : outcome.waitingFor === 'loading'
        ? `${label} relu pour l’exploration : la fiche attend son chargement avant d’entrer dans l’essai. Rien n’est enregistré avant « Préparer l’essai ».`
        : `${label} relu pour l’exploration. Son ID et ses sources sont conservés dans la ligne d’essai ; « Préparer l’essai » l’enregistre.`);
  }
  function pendingTrialEntered(names: string[]) {
    // Replaces the waiting notice: the line now exists, still unsaved.
    setNotice(names.length > 1
      ? `Les fiches ${names.join(', ')} sont entrées dans l’essai ; « Préparer l’essai » les enregistre.`
      : `La fiche ${names[0]} est entrée dans l’essai ; « Préparer l’essai » l’enregistre.`);
  }
  function openReferenceArea() {
    setView('beer');
    requestAnimationFrame(() => referenceAreaRef.current?.scrollIntoView?.({ block: 'start' }));
  }

  const allBranches = result ? [result.baseline, ...result.branches] : [];
  const selected = allBranches.find(branch => branch.id === selectedBranchId);
  const displayedTrialBranchProfile = useMemo(() => {
    if (!workspace || !displayedSnapshot) return undefined;
    const branchId = selectedBranchId ?? (displayedSnapshot.result.branches.length === 1
      ? displayedSnapshot.result.branches[0].id : undefined);
    if (!branchId) return undefined;
    for (const rawReceipt of workspace.explorationTrialReceipts ?? []) {
      const receiptRead = readHopV55ExplorationTrialReceiptV1(rawReceipt);
      if (receiptRead.status !== 'available' || receiptRead.receipt.snapshotReference !== displayedSnapshot.reference
        || receiptRead.receipt.branchId !== branchId) continue;
      const rawPreparation = (workspace.explorationTrialPreparations ?? []).find(row =>
        (row as { reference?: string } | null)?.reference === receiptRead.receipt.preparationReference);
      const preparationRead = rawPreparation && readHopV55ExplorationTrialPreparationV1(rawPreparation);
      if (preparationRead?.status === 'available') return preparationRead.preparation.entry.profileSnapshot ?? null;
    }
    return undefined;
  }, [workspace, displayedSnapshot?.reference, selectedBranchId]);
  const displayedBaseline = result?.requestSnapshot.baseline;
  const displayingArchive = !!sourceUnavailable || historicalView || !!(displayedBaseline?.kind === 'recipe' && prepared?.runtime.current &&
    displayedBaseline.contextReference !== brewingScenarioCurrentReference(prepared.runtime.current));
  const currentAdoptedBaseline = workspace ? getHopV55AdoptedBaseline(workspace) : undefined;
  const referenceProgram = currentAdoptedBaseline?.kind === 'hypothetical' ? currentAdoptedBaseline.program : undefined;
  const activeProgramCopy = workspace ? activeWorkspaceProgramCopy(workspace) : undefined;
  const activeCopy = workspace ? activeWorkspaceCopy(workspace) : undefined;
  const visibleFutureDraft = recipeDraftTarget ? undefined : activeFutureDraft;
  const program = activeProgramCopy?.programAfter ?? visibleFutureDraft?.hypotheticalBaseline.program ?? prepared?.runtime.current?.program ?? referenceProgram;
  const explorationTrialOriginContext = useMemo(() => context && prepared && workspace && program
    ? makeExplorationTrialOriginContext(context, prepared, workspace, program) : undefined,
  [context, prepared, workspace, program, visibleFutureDraft?.contentReference, readingArchive?.contentReference, readingHistorical,
    intent.question, services.ownerKey]);
  const contextStage = context?.recipe ? prepared?.runtime.current?.program?.stage : undefined;
  const stageLabel = contextStage ? ({ planning: 'Avant brassage', hotSide: 'Brassage', fermenting: 'Fermentation', conditioning: 'Garde et conditionnement', packaged: 'Conditionné' } as Record<string, string>)[contextStage] : context?.recipe ? 'Stade à confirmer' : 'Exploration · stade inconnu';
  const documentaryRow = documentaryRecordId ? workspace?.documentaryAnswers?.find(row => row.id === documentaryRecordId)
    : [...(workspace?.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === readingArchive?.contentReference);
  const documentaryRead = documentaryRow && readHopV55DocumentaryAnswerRecord(documentaryRow);
  const assistedAdviceParent = readingArchive && workspace ? assistedAdviceBaseRecord(workspace, readingArchive) : undefined;
  const assistedAdviceParentRead = assistedAdviceParent && readHopV55DocumentaryAnswerRecord(assistedAdviceParent);
  const assistedAdviceParentPolicy = assistedAdviceParentRead?.status === 'readOnly'
    ? assistedAdviceParentRead.record.format === 'hop-v55-documentary-answer-record-v3'
      ? assistedAdviceParentRead.record.answerSnapshot.requestSnapshot.candidatePolicy
      : assistedAdviceParentRead.record.format === 'hop-v55-documentary-answer-record-v4'
        ? assistedAdviceParentRead.record.readingContext.candidatePolicy : undefined
    : undefined;
  const semanticLinkedPolicy = readingArchive?.format === 'hop-v55-decision-reading-v4' && workspace
    ? semanticLinkedV4Record(workspace, readingArchive)?.readingContext.candidatePolicy : undefined;
  const semanticV4UnavailableReason = recipeDraftTarget ? semanticAdviceUnavailableReason ?? recipeDraftSemanticUnavailable
    : semanticAdviceUnavailableReason;
  const wizardDossiers = wizardDossiersFor(workspaces, recipeDraftTarget);
  const activeWizardDossier = wizardDossiers.at(-1);
  // Outside the creator, the owner's assisted dossiers stay readable from their archived members alone.
  const ownerWizardDossiers = recipeDraftTarget ? [] : wizardDossiersOfOwner(workspaces, services.ownerKey);
  const wizardSemanticLaneOpen = !!recipeDraftTarget && !!semanticAdoptionHost && !!onOpenSemanticCompanion;
  const documentaryAnswer = documentaryRead?.status === 'readOnly' && documentaryRead.record.format === 'hop-v55-documentary-answer-record-v1'
    ? documentaryRead.record : undefined;
  const propertyAnswer = documentaryRead?.status === 'readOnly' && documentaryRead.record.format === 'hop-v55-documentary-answer-record-v2'
    ? documentaryRead.record : undefined;
  const propertyAnswerV3 = documentaryRead?.status === 'readOnly' && documentaryRead.record.format === 'hop-v55-documentary-answer-record-v3'
    ? documentaryRead.record : undefined;
  const propertyAnswerV4 = documentaryRead?.status === 'readOnly' && documentaryRead.record.format === 'hop-v55-documentary-answer-record-v4'
    ? documentaryRead.record : undefined;
  const displayedV4Raw = displayedV4Identity && displayedV4Identity.ownerKey === services.ownerKey
    && displayedV4Identity.workspaceId === workspace?.id
    ? workspace.documentaryAnswers?.find(row => row.reference === displayedV4Identity.recordReference) : undefined;
  const displayedV4Read = displayedV4Raw && readHopV55DocumentaryAnswerRecord(displayedV4Raw);
  const verifiedDisplayedV4Record = displayedV4Read?.status === 'readOnly' && displayedV4Read.record.format === 'hop-v55-documentary-answer-record-v4'
    && displayedV4Read.record.id === displayedV4Identity?.recordId
    && displayedV4Read.record.sourceReadingReference === displayedV4Identity.sourceReadingReference
    && displayedV4Read.record.ledger.reference === displayedV4Identity.ledgerReference ? displayedV4Read.record : undefined;
  const displayedV4Record = displayedV4Identity ? verifiedDisplayedV4Record : propertyAnswerV4;
  const displayedPropertyAnswer = propertyAnswerV3 ?? propertyAnswer;
  const displayedPropertyIntents = displayedV4Record
    ? displayedV4Record.outcome.kind === 'domainAnswer' ? displayedV4Record.outcome.answerSnapshot.requestSnapshot.propertyIntents : []
    : displayedPropertyAnswer?.answerSnapshot.requestSnapshot.propertyIntents;
  // A reopened reading keeps its own demand; the dossier's latest question stays out of the historical view.
  const keptIntent = readingHistorical && reading ? reading.intent : intent;
  const latestDocumentaryRow = [...(workspace?.documentaryAnswers ?? [])].reverse().find(row => row.sourceReadingReference === readingArchive?.contentReference);
  const documentaryDossiers = (workspace?.documentaryDossiers ?? []).flatMap(row => {
    const read = readHopV55DocumentaryDossierRecord(row);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-dossier-record-v1'
      && read.record.answerRecordReference === documentaryAnswer?.reference ? [read.record.dossierSnapshot] : [];
  });
  const propertyDossiers = (workspace?.documentaryDossiers ?? []).flatMap(row => {
    const read = readHopV55DocumentaryDossierRecord(row);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-dossier-record-v2'
      && read.record.answerRecordReference === propertyAnswer?.reference ? [read.record.dossierSnapshot] : [];
  });
  const propertyDossiersV3 = (workspace?.documentaryDossiers ?? []).flatMap(row => {
    const read = readHopV55DocumentaryDossierRecord(row);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-dossier-record-v3'
      && read.record.answerRecordReference === propertyAnswerV3?.reference ? [read.record.dossierSnapshot] : [];
  });
  const propertyDossiersV4 = (workspace?.documentaryDossiers ?? []).flatMap(row => {
    const read = readHopV55DocumentaryDossierRecord(row);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-dossier-record-v4'
      && read.record.answerRecordReference === propertyAnswerV4?.reference ? [read.record] : [];
  });
  const propertyPreviousV4 = (workspace?.documentaryAnswers ?? []).flatMap(row => {
    const read = readHopV55DocumentaryAnswerRecord(row);
    return read.status === 'readOnly' && read.record.format === 'hop-v55-documentary-answer-record-v4'
      && read.record.originalQuestion === propertyAnswerV4?.originalQuestion ? [read.record] : [];
  });
  const activeCopyReceipt = activeCopy ? workspace?.fullCopyReceipts?.find(row => row.copyId === activeCopy.id) : undefined;
  const activeCopyReadOnly = !!activeCopy && (!activeCopyReceipt || readHopV55FullRecipeCopyReceipt(activeCopyReceipt).status !== 'available');
  const storedCopyHandoff = result ? workspace?.copyRecomputations?.find(row => row.result.reference === result.reference) : undefined;
  const displayedCopyHandoff = storedCopyHandoff ?? (copyHandoff?.result.reference === result?.reference ? copyHandoff : undefined);
  const editingBranch: BrewingScenarioBranchRequest | undefined = result && selectedBranchId === result.baseline.id ?
    { id: `planning-from-source:${result!.scenarioId}:${result!.revision}`, label: 'Nouvel essai depuis la source', assumptions: [] }
    : result?.requestSnapshot.branches.find(row => row.id === selectedBranchId) ?? draftBranch ?? result?.requestSnapshot.branches[0];
  const adoptedReference = workspace ? getHopV55ReferenceProjection(workspace)?.currentReference : null;
  const qualifiedAdviceSetup = useMemo(() => {
    if (!readingArchive || readingArchive.format !== 'hop-v55-decision-reading-v3'
      && readingArchive.format !== 'hop-v55-decision-reading-v4'
      || readingArchive.reading.response?.actionKind !== 'exploreStrategies' || !workspace || !prepared || !context) return undefined;
    try {
      const readingScopes = hopV55DecisionReadingScopesV1(readingArchive);
      const scopes = readingScopes ? new Map(readingScopes.scopeLedger.entries.map(entry => [entry.scopeId, entry.status])) : new Map();
      if (readingScopes?.scopeLedger.sourceScopes.length && [...scopes.values()].every(status => status === 'excluded')) return undefined;
      if (hopDecisionReference(readingArchive.source) !== hopDecisionReference(decisionSource(workspace))) {
        throw Error('Cette étude demande la source exacte de la lecture; réexamine-la avant de préparer un conseil actif.');
      }
      const sourceCurrent = readingArchive.source.kind === 'exploration' || readingArchive.source.kind === 'localFutureDraft'
        ? undefined : prepared.runtime.current;
      const currentProgram = readingArchive.source.kind === 'localFutureDraft'
        ? visibleFutureDraft?.origin.sourceProgram ?? null : sourceCurrent?.program ?? null;
      const drafts = readingArchive.format === 'hop-v55-decision-reading-v4'
        ? projectHopV55SemanticDecisionV1(readingArchive.reading.annotations).drafts : readingArchive.reading.criterionDrafts;
      const baseSituation = buildHopV55DecisionSituation(sourceCurrent, drafts,
        hopV55DecisionReadingMaterialExclusions({ response: readingArchive.reading.response }));
      return { status: 'ready' as const, sourceContext: qualifiedSourceContext(context, prepared, workspace), currentProgram,
        baseSituation, scopeLedgerReference: readingScopes?.scopeLedger.reference };
    } catch (cause) {
      return { status: 'refused' as const, reason: (cause as Error).message };
    }
  }, [readingArchive, workspace, prepared, context, visibleFutureDraft]);
  // C04: a selection change keeps the comparator mounted (no transient J5 view, focus kept); only another snapshot,
  // adopted reference or fine study replaces it, through an explicit loading or error state.
  const [referenceComparisonPending, setReferenceComparisonPending] = useState(false);
  const referenceBasis = useMemo(() => hopV55ReferenceComparisonBasis({ record, displayedSnapshot, workspace, adoptedReference,
    displayingArchive: !!displayingArchive, compareArchiveToCurrentReference: !!compareArchiveToCurrentReference }),
  [record, displayedSnapshot, workspace, adoptedReference, displayingArchive, compareArchiveToCurrentReference]);
  const archivedReferenceComparison = useMemo(() => referenceBasis.mode === 'archive' && workspace && displayedSnapshot
    ? archivedHopV55ReferenceComparison(workspace, displayedSnapshot) : undefined, [referenceBasis.mode, workspace, displayedSnapshot]);
  useHopV55ReferenceComparisonSync({ services, workspace, record, displayedSnapshot, adoptedReference, basis: referenceBasis,
    branchIds, axisIds, selectedBranchId, setReferenceComparison, setPending: setReferenceComparisonPending, setError: setComparisonError,
    onWorkspaceSaved: saved => { if (alive.current) { workspaceRef.current = saved; setWorkspace(saved); } } });
  const copyLabel = (copy: HopV55Copy) => records.flatMap(row => row.snapshots.flatMap(snapshot => snapshot.result.branches))
    .find(branch => branch.reference === copy.branchReference)?.label ?? copy.recipe.name;
  const copyConfirmed = (copy: HopV55Copy) => savedRecipeIds.includes(copy.id) || workspace?.recipeSaveReceipts?.some(row => row.copyId === copy.id);
  const archivedAdviceScopeCoverage = (() => {
    if (!workspace || qualifiedEntry?.kind !== 'advice' || !qualifiedPreparationReference
      || qualifiedEntry.sourceReadingReference !== readingArchive?.contentReference) return undefined;
    const raw = workspace.qualifiedStudyPreparations?.find(row => row.reference === qualifiedPreparationReference);
    const read = raw && readHopV55QualifiedStudyPreparation(raw);
    if (read?.status !== 'available' || read.preparation.format !== 'hop-v55-qualified-study-preparation-v2'
      || read.preparation.kind !== 'advice' || read.preparation.sourceReadingReference !== qualifiedEntry.sourceReadingReference
      || read.preparation.studyReference !== qualifiedEntry.studyReference) return undefined;
    return read.preparation.scopeCoverage;
  })();
  return <div className="hop-v55" data-testid="hop-v55" data-simulation-count={simulations} data-owner-key={services.ownerKey}>
    <header className="hv-top"><div className="hv-titleline">{onClose ? <button aria-label="Fermer l’atelier" onClick={onClose}><ArrowLeft size={16} /></button> : <FlaskConical size={18} />}<h1>Houblons <span>V5.5</span></h1><span className="hv-save-scope">{services.scope === 'fixture' ? 'Fixtures isolées' : 'Dossiers locaux'}</span></div>
      <div className="hv-context"><strong>{context?.recipe?.name ?? 'Explorer sans recette'}</strong><span>{program?.volumeL != null ? `${number(program.volumeL)} L${!prepared?.runtime.current ? ' hypothétiques' : context?.batch ? ' prévus dans la recette' : ''}` : 'Volume inconnu'} · {context?.batch ? 'Brassin · ' : ''}{stageLabel}{activeCopy ? ' · copie locale' : ''}</span></div>
    </header>
    {displayingArchive && result && (view === 'decide' || view === 'history') ? <div className="hv-archive-banner" role="status"><strong>Archive · prévision v{result.revision} · lecture seule</strong><p>Programme consulté : {result.branches.map(row => row.label).join(' / ') || 'Référence'}. La copie active affichée dans « Ma bière » reste distincte.</p>{selected ? <p>Choix antérieur : {selected.label}. Son ancienne prévision reste conservée.</p> : null}<button disabled={busy} onClick={() => void run(() => simulate(structuredClone(result.requestSnapshot.branches), true))}>Réévaluer ces mêmes candidats dans le contexte actif</button></div> : null}
    <nav className="hv-nav" aria-label="Vues de l’atelier">{([{ id: 'beer', label: 'Ma bière' }, { id: 'decide', label: 'Décider' }, { id: 'explore', label: 'Explorer' }, { id: 'history', label: 'Historique' }] as const).map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => { setView(item.id); setNotice(''); setError(''); }}>{item.label}</button>)}</nav>
    <div className="hv-live" aria-live="polite">{busy ? <p role="status">En cours…</p> : notice ? <p role="status">{notice}</p> : null}{error && error !== hostWriteError ? <p role="alert" className="hv-error">{error}</p> : null}</div>
    {propertyV4Recovery && propertyV4Recovery.workspaceId === workspace?.id ? <div className="hv-archive-banner">
      <strong>Une lecture conservée attend sa reprise</strong>
      <p>Le reçu et le geste envoyé restent exacts. La reprise vérifie ce même reçu avant de confirmer son affichage.</p>
      <button disabled={busy} onClick={() => void run(async () => {
        if (propertyV4Recovery.kind === 'revise') await propertyAdviceV4Controller().correct(propertyV4Recovery.request);
        else if (propertyV4Recovery.kind === 'confirmReexamination') await propertyAdviceV4Controller().confirmReexamination(propertyV4Recovery.request);
        else await propertyAdviceV4Controller().reexamine(propertyV4Recovery.request);
      })}>{propertyV4Recovery.kind === 'revise' ? 'Réessayer la même correction'
        : propertyV4Recovery.kind === 'confirmReexamination' ? 'Réessayer la même confirmation' : 'Réessayer la même relecture'}</button>
    </div> : null}
    {pendingPreparationId ? <div className="hv-archive-banner"><strong>Une prévision attend sa finalisation</strong><p>La préparation et ses références restent conservées. La reprise cherche d’abord son reçu exact et termine le rattachement.</p><button disabled={busy} onClick={() => void run(() => resumeScenario(pendingPreparationId))}>Terminer le rattachement sans recalculer</button><button disabled={busy} onClick={() => void run(() => resumeScenario(pendingPreparationId, true))}>Reprendre le calcul si aucun reçu n’existe</button><button disabled={busy} onClick={() => { setPendingPreparationId(undefined); setNotice('La préparation reste dans l’historique. Tu peux préparer un autre essai.'); }}>Conserver cette préparation et préparer un autre essai</button></div> : null}
    {sourceUnavailable ? <div className="hv-archive-banner"><strong>Source indisponible · consultation historique</strong><p>{sourceUnavailable}</p><p>Les calculs et copies demandent la source exacte. Les anciennes prévisions et observations restent conservées.</p><button disabled={busy} onClick={() => void run(async () => { await currentContext(); setNotice('Source exacte retrouvée ; tu peux préparer un nouvel essai.'); })}>Relire la source exacte</button></div> : null}
    {!prepared ? <p role="status">Chargement des références et du dossier local…</p> : <main className="hv-main">
      {view === 'beer' || view === 'decide' ? <section className="hv-question"><h2>Ta question</h2>
        <label className="hv-field"><span className="hv-sr-only">Question au brasseur</span><Textarea aria-label="Question au brasseur" value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ce que tu veux garder, gagner, éviter, comparer… ou un geste précis avec dose et emploi." rows={3} /></label>
        <div className="hv-actions"><button className="hv-primary" disabled={busy || !question.trim()} onClick={() => void run(readQuestion)}>Lire ma question</button><button onClick={() => { setCatalogueOpen(true); setView('explore'); }}><BookOpen size={14} /> Chercher une matière</button>
          {onOpenCompanion ? <button disabled={busy || !question.trim()} onClick={() => onOpenCompanion(question, context!)}>Demander au compagnon</button> : null}</div>
        {onOpenAssistedCompanion && readingArchive && workspace && prepared
          && (readingArchive.format === 'hop-v55-decision-reading-v2' || readingArchive.format === 'hop-v55-decision-reading-v3')
          && ['exploreStrategies', 'understandProducts'].includes(readingArchive.reading.response.actionKind) ? <div className="hv-copy">
            <h3>Faire relire cette lecture au compagnon</h3>
            <p>La question, ses portées et le contexte exact seront attachés à la session. Le ticket local sera conservé avant l’envoi.</p>
            {assistedAdviceParentPolicy ? <p><strong>Périmètre repris du dossier documentaire</strong> · {assistedAdviceParentPolicy.kind === 'explicit'
              ? assistedAdviceParentPolicy.materialIds.length ? assistedAdviceParentPolicy.materialIds.join(', ') : 'Aucune matière choisie'
              : `Exploration documentée · ${assistedAdviceParentPolicy.materialIds.join(', ')}`}</p>
              : renderAssistedMaterialPicker(prepared.runtime.materials)}
            {question !== readingArchive.reading.intent.question ? <p role="status">Le texte a changé. Relis explicitement la question avant d’ouvrir le compagnon.</p> : null}
            <button disabled={busy || !!sourceUnavailable || question !== readingArchive.reading.intent.question}
              onClick={() => void run(openAssistedCompanion)}>Ouvrir le compagnon pour cette lecture</button>
          </div> : null}
        {readingArchive?.format === 'hop-v55-decision-reading-v4' && semanticAdoptionHost && onOpenSemanticCompanion
          && !recipeDraftTarget && workspace && prepared ? <div className="hv-copy" data-testid="semantic-assisted-launch">
            <h3>Faire relire cette lecture au compagnon</h3>
            <p>La question, sa source et le périmètre ci-dessous sont conservés dans un ticket local avant l’envoi. La réponse reste une proposition : rien n’est appliqué à la recette, au stock ou au brassin.</p>
            <p><strong>Source</strong> · {assistedSourceLabels[readingArchive.source.kind]}{context?.recipe?.name ? ` · ${context.recipe.name}` : ''}</p>
            {semanticLinkedPolicy ? <p><strong>Périmètre repris de la réponse documentaire liée</strong> · {semanticLinkedPolicy.materialIds.length
              ? semanticLinkedPolicy.materialIds.map(id => prepared.runtime.materials.find(material => material.id === id)?.name ?? id).join(', ')
              : 'Aucune matière choisie'}</p>
              : renderAssistedMaterialPicker(prepared.runtime.materials)}
            {question !== readingArchive.reading.intent.question ? <p role="status">Le texte a changé. Relis explicitement la question avant d’ouvrir le compagnon.</p> : null}
            <button disabled={busy || !!sourceUnavailable || question !== readingArchive.reading.intent.question}
              onClick={() => void run(openSemanticAssistedCompanion)}>Ouvrir le compagnon pour cette lecture</button>
          </div>
          : readingArchive?.format === 'hop-v55-decision-reading-v4' && wizardSemanticLaneOpen && prepared
            ? <div className="hv-copy" data-testid="wizard-semantic-launch">
              <h3>Faire relire ce brouillon au compagnon</h3>
              <p>Le brouillon tel qu’il est écrit maintenant, valeurs manquantes et non enregistrées comprises, est figé avec cette lecture dans un ticket local avant l’envoi. Aucune recette enregistrée ne le remplace; rien n’est appliqué ni enregistré.</p>
              {activeWizardDossier ? <p><strong>Dossier assisté</strong> · {activeWizardDossier.title} · origine du brouillon conservée</p>
                : <p>Le dossier local actuel garde son historique. Un dossier assisté distinct, lié à ce brouillon, sera ouvert pour cette lecture.</p>}
              {readingArchive.reading.correction || readingArchive.lineage || readingArchive.transition?.kind === 'reviseScopes'
                ? <p role="status">Le compagnon reçoit la lecture de cette question sur le brouillon actuel; les corrections et dispositions de ce dossier local y restent.</p> : null}
              {renderAssistedMaterialPicker(prepared.runtime.materials)}
              <p className="hv-muted">Si une réponse confirmée existe déjà pour la même lecture du brouillon, son périmètre est repris.</p>
              {readingHistorical ? <p role="status">Cette lecture vise une version précédente du brouillon. Relis la question avant de l’envoyer.</p> : null}
              {question !== readingArchive.reading.intent.question ? <p role="status">Le texte a changé. Relis explicitement la question avant d’ouvrir le compagnon.</p> : null}
              <button disabled={busy || !!sourceUnavailable || readingHistorical || question !== readingArchive.reading.intent.question}
                onClick={() => void run(() => openWizardSemanticCompanion(!activeWizardDossier))}>
                {activeWizardDossier ? 'Ouvrir le compagnon pour cette lecture' : 'Ouvrir un dossier assisté pour ce brouillon'}</button>
            </div>
          : readingArchive?.format === 'hop-v55-decision-reading-v4'
            && (onOpenAssistedCompanion || onOpenSemanticCompanion || semanticV4UnavailableReason)
            ? <p role="status">Le conseil assisté n’accepte pas encore cette lecture sémantique V4{semanticV4UnavailableReason
              ? ` ici : ${semanticV4UnavailableReason}` : '.'} Aucun ticket ni requête n’a été créé; ses annotations et son archive restent intactes.</p> : null}
        {keptIntent.question ? <div className="hv-intent"><strong>Demande conservée</strong><p>{keptIntent.question}</p><div className="hv-tags">{displayedPropertyIntents
          ? displayedPropertyIntents.map(item => <span key={item.id}>
            {isHopProcessContextNoteIntent(item) ? 'Contexte'
              : { target: 'Cible', reportedObservation: 'Constat', measurement: 'Mesure', investigation: 'Question', preference: 'Préférence', constraint: 'Garde' }[item.role]} · {item.label}{item.qualification ? ` · ${item.qualification}` : ''}
          </span>)
          : keptIntent.criteria.map(criterion => <span key={criterion.id}>{criterion.direction === 'exclude' ? 'Éviter' : criterion.direction === 'keep' ? 'Garder' : criterion.direction === 'increase' ? 'Rechercher' : criterion.direction === 'decrease' ? 'Réduire' : 'Examiner'} · {criterion.label}</span>)}</div></div> : null}
      </section> : null}
      {view === 'decide' && assistedLiveReceipt && assistedLiveReceipt.ticket.workspaceId === workspace?.id
        && assistedLiveReceipt.ticket.sourceReadingReference === readingArchive?.contentReference ? <>
          {assistedLiveReceipt.ticket.adviceBase?.format === 'hop-v55-documentary-answer-record-v3' ? <div className="hv-archive-banner">
            <strong>Confirmer une suggestion depuis une lecture V3</strong>
            <p>La confirmation conserve d’abord la reprise V4 exacte, puis applique cette suggestion dans une nouvelle version avec le même motif de brasseur.</p>
          </div> : null}
          {!assistedLiveReceipt.ticket.adviceBase ? <p className="hv-archive-banner" role="status">
            Aucun record documentaire V3/V4 exact n’a été capturé comme parent. La proposition reste consultable; aucune confirmation n’est possible.
          </p> : null}
          <Suspense fallback={<p role="status">Ouverture de la réponse assistée…</p>}>
            <AssistedAdvicePanel result={assistedLiveReceipt.record.payload.clientResult}
              question={assistedLiveReceipt.ticket.request.question}
              sourceReadingReference={assistedLiveReceipt.ticket.sourceReadingReference}
              contextCheckAtReception={assistedLiveReceipt.record.payload.contextCheckAtReception}
              readOnly={readingHistorical || !!sourceUnavailable || assistedLiveReceipt.record.payload.clientResult.status !== 'ready'
                || readingArchive?.contentReference !== assistedLiveReceipt.ticket.sourceReadingReference}
              onConfirmSuggestion={assistedLiveReceipt.ticket.adviceBase
                ? async request => { await confirmAssistedSuggestion(assistedLiveReceipt.sessionId, request); } : undefined} />
          </Suspense>
        </> : null}

      {view === 'beer' ? <section className="hv-beer"><div className="hv-section-title"><h2>Programme</h2>{activeCopy ? <button disabled={busy} onClick={() => void run(() => restoreCopy(workspace?.copies.some(copy => copy.id === activeCopy.sourceRecipeId) ? activeCopy.sourceRecipeId : undefined))}><RotateCcw size={14} /> Revenir au programme précédent</button> : null}</div>
        {visibleFutureDraft ? <div className="hv-copy"><h3>Brouillon futur local · révision {visibleFutureDraft.revision}</h3><p>Origine : exploration hypothétique. La formulation et les données manquantes restent à compléter.</p><div className="hv-actions"><button disabled={busy} onClick={() => void run(() => completeFutureDraft(visibleFutureDraft))}>Compléter ce brouillon</button><button disabled={busy} onClick={() => void run(() => restoreFutureDraft())}>Revenir à l’exploration initiale</button></div></div> : null}
        {visibleFutureDraft ? workspace?.futureRecipeMaterializations?.filter(row => row.receipt.draftReference === visibleFutureDraft.contentReference).map(row => {
          const saved = workspace.futureRecipeSaveReceipts?.some(receipt => receipt.recipeId === row.recipe.id && receipt.receiptReference === row.receipt.contentReference);
          return <div className="hv-copy" key={row.receipt.contentReference}><h3>Recette future préparée · {row.recipe.name}</h3><p>{number(row.recipe.volumeL)} L · {row.recipe.hops.map(hop => `${hop.name} ${number(hop.weightG)} g physiques`).join(' · ')}</p><p>{saved ? 'Sauvegarde de recette confirmée' : 'Conservée localement · aucune sauvegarde confirmée'}</p>{onSaveRecipeCopy ? <button disabled={busy || !!saved || row.receipt.readiness.save !== 'readyToSave'} onClick={() => void run(async () => {
            const confirmed = await onSaveRecipeCopy(row.recipe);
            if (confirmed.id !== row.recipe.id) throw Error('La confirmation ne correspond pas à cette nouvelle recette exacte.');
            await saveWorkspace({ futureRecipeSaveReceipts: [...(workspaceRef.current?.futureRecipeSaveReceipts ?? []), { recipeId: confirmed.id, receiptReference: row.receipt.contentReference, confirmedAt: iso() }] });
            setNotice('Sauvegarde de la nouvelle recette confirmée. L’origine hypothétique du brouillon reste conservée.');
          })}>{saved ? 'Recette confirmée' : 'Enregistrer la nouvelle recette'}</button> : null}{saved && onOpenRecipe ? <button onClick={() => onOpenRecipe(row.recipe)}>Ouvrir cette recette enregistrée</button> : null}<details className="hv-details"><summary>Aptitude au brassage et références</summary><p>{row.receipt.readiness.brew === 'ready' ? 'Prête à brasser selon les données déclarées' : 'À compléter avant brassage'}</p>{row.receipt.readiness.missing.map((issue, index) => <p key={index}>{issue.message}</p>)}<small>{row.receipt.contentReference}</small></details></div>;
        }) : null}
        {activeProgramCopy ? <div><p><strong>Copie de programme futur · {activeProgramCopy.label}</strong> · {localDateTime(activeProgramCopy.createdAt)}</p><p className="hv-muted">Les lignes effectuées sont celles du journal source. Cette copie n’enregistre aucun ajout réalisé.</p><button disabled={busy} onClick={() => void run(() => restoreProgramCopy())}>Revenir au journal source</button></div> : null}
        {program ? <><ul className="hv-program">{program.additions.map(addition => { const material = prepared.runtime.materials.find(row => row.id === addition.materialId); return <li key={addition.id}><div><strong>{material?.name ?? addition.materialId}</strong><span>{hopV55Uses.find(row => row.value === addition.use)?.label ?? addition.use} · consigne {addition.use === 'boil' ? `${number(addition.boilMinutes)} min` : `${number(addition.contactHours)} h`} · {number(addition.temperatureC)} °C</span></div><div className="hv-reading"><strong>{number(addition.grams)} g</strong><span>{program.volumeL && addition.grams != null ? `${hopV55DoseReading(addition.grams / program.volumeL)} g/L${context?.batch ? ' · volume prévu' : ''}` : '? g/L'}</span><small>{addition.status === 'performed' ? 'Quantité réalisée consignée' : 'Prévu'}</small></div></li>; })}</ul>
          {program.additions.length ? <details className="hv-details"><summary>Doses · valeurs de calcul complètes</summary>
            <ul>{program.additions.map(addition => <li key={addition.id}>
              {prepared.runtime.materials.find(row => row.id === addition.materialId)?.name ?? addition.materialId} · {hopV55ExactReading(addition.grams)} g ÷ {hopV55ExactReading(program.volumeL)} L = {program.volumeL && addition.grams != null ? hopV55ExactReading(addition.grams / program.volumeL) : '?'} g/L
            </li>)}</ul>
          </details> : null}
          {!program.additions.length ? <p>Programme renseigné sans ajout de houblon.</p> : null}
          {!prepared.runtime.current && visibleFutureDraft ? <p className="hv-muted">Programme futur du brouillon · révision {visibleFutureDraft.revision}. Les masses et conditions ci-dessus sont prévues; le passé réel reste inconnu.</p> : referenceProgram && !prepared.runtime.current ? <p className="hv-muted">Référence hypothétique v{adoptedReference?.version}, distincte du passé inconnu. Les masses et conditions ci-dessus sont supposées.</p> : null}
          <button className="hv-primary" disabled={busy} onClick={() => { setEditorOpen(true); setView('decide'); }}>Régler ou comparer le programme</button>{referenceProgram && !prepared.runtime.current ? <button disabled={busy} onClick={() => void run(() => simulate([]))}>{visibleFutureDraft ? 'Simuler ce brouillon futur' : 'Simuler la référence adoptée'}</button> : null}</> : <p>Aucun programme connu n’a été fourni. L’absence de données n’est pas une référence sans houblon.</p>}
        <details className="hv-details"><summary>Bière réelle, intention et sources du contexte</summary><ul>{prepared.runtime.current?.beerContext?.facts.map(fact => <li key={fact.id}><strong>{fact.field}</strong> · {fact.status === 'target' ? 'Cible' : fact.status === 'observed' ? 'Relevé' : fact.status} · {typeof fact.value === 'number' ? number(fact.value) : String(fact.value ?? '?')} {fact.unit ?? ''}<small>{fact.timepoint ?? ''} {fact.source?.title ?? ''}</small></li>)}</ul>{prepared.limitations.map((line, index) => <p key={index}>{line}</p>)}{prepared.provenance.map((line, index) => <p key={index}>{line}</p>)}</details>
        {activeCopy ? <div className="hv-copy"><h3>Copie locale · {copyLabel(activeCopy)}</h3><p>{activeCopy.recipe.name} · {localDateTime(activeCopy.createdAt)}</p>{activeCopyReadOnly ? <p>Ancienne copie conservée en lecture seule · contenu et prévision finale non scellés. Une nouvelle prévision permet de préparer une copie actuelle.</p> : null}{onSaveRecipeCopy ? <button disabled={busy || activeCopyReadOnly || copyConfirmed(activeCopy)} onClick={() => void run(async () => {
          const confirmed = await onSaveRecipeCopy(activeCopy.recipe); await saveWorkspace({ recipeSaveReceipts: [...(workspaceRef.current?.recipeSaveReceipts ?? []), { copyId: activeCopy.id, recipeId: confirmed.id, confirmedAt: iso() }] });
          setSavedRecipeIds(ids => [...ids, confirmed.id]); setNotice('Sauvegarde de recette confirmée.');
        })}>{copyConfirmed(activeCopy) ? 'Recette confirmée' : 'Enregistrer comme nouvelle recette'}</button> : <span>Relecture locale disponible ; aucun reçu serveur.</span>}{onOpenRecipe && copyConfirmed(activeCopy) ? <button onClick={() => onOpenRecipe(activeCopy.recipe)}>Ouvrir la recette enregistrée</button> : null}</div> : null}
      </section> : null}

      {view === 'decide' ? <section className="hv-decision"><h2>Répondre, puis arbitrer</h2>
        {readingArchive?.format === 'hop-v55-decision-reading-v3' ? <Suspense fallback={<p role="status">Ouverture des portées de cette question…</p>}>
          <QuestionScopePanel key={readingArchive.contentReference} archiveV3={readingArchive}
            readOnly={readingHistorical || busy || !!sourceUnavailable}
            scopeCoverage={qualifiedEntry?.kind === 'advice' && qualifiedEntry.sourceReadingReference === readingArchive.contentReference
              ? projectHopV55QuestionScopeCoverageV1({ ledger: readingArchive.scopeLedger, question: readingArchive.reading.intent.question,
                reading: readingArchive.reading, study: qualifiedEntry.study }) : undefined}
            onConfirm={request => runDocumentaryResult(() => confirmQuestionScopes(request))} />
        </Suspense> : null}
        {readingArchive?.format === 'hop-v55-decision-reading-v4' && readingArchive.scopeLedger
          ? <HopV55SemanticScopeDisposition key={readingArchive.contentReference} archive={readingArchive}
              readOnly={readingHistorical || busy || !!sourceUnavailable}
              onConfirm={request => runDocumentaryResult(() => confirmSemanticQuestionScopes(request))} /> : null}
        {readingArchive?.format === 'hop-v55-decision-reading-v4' && archivedAdviceScopeCoverage
          && qualifiedEntry?.sourceReadingReference === readingArchive.contentReference ? <section className="hv-archive-banner"
            aria-label="Couverture archivée de cette étude">
            <strong>Portées évaluées lors de cette préparation</strong>
            <p>Cette couverture provient du ledger exact et de l’étude conservée. Elle n’est pas recalculée à la relecture.</p>
            <ul>{archivedAdviceScopeCoverage.map(row => <li key={row.scopeId}>
              <strong>{row.sourceSpan.text}</strong>
              <span>{row.coverage === 'bounded' ? 'Couverture bornée' : row.coverage === 'excluded' ? 'Exclue' : 'Non résolue'}</span>
              <p>{row.reason}</p>
              {row.optionIds.length ? <small>Voies enregistrées : {row.optionIds.join(', ')}</small> : null}
              <details><summary>Relations et identifiants exacts</summary><code>{row.scopeId}</code>
                <span>Disposition · {row.disposition}</span>
                <span>Origine · {row.origin === 'brasseur' ? 'brasseur' : 'proposition'}</span>
                {row.materialIds.length ? <span>Matières · {row.materialIds.join(', ')}</span> : null}
                {row.uses.length ? <span>Emplois · {row.uses.join(', ')}</span> : null}
                {row.relatedCriterionIds.length ? <span>Critères · {row.relatedCriterionIds.join(', ')}</span> : null}
                {row.relatedOperationIds.length ? <span>Opérations · {row.relatedOperationIds.join(', ')}</span> : null}
              </details>
            </li>)}</ul>
          </section> : null}
        {qualifiedAdviceStudiesEnabled && qualifiedAdviceSetup && !qualifiedEntry && !readingHistorical
          && (readingArchive?.format === 'hop-v55-decision-reading-v3' || readingArchive?.format === 'hop-v55-decision-reading-v4')
          ? qualifiedAdviceSetup.status === 'ready'
          ? <Suspense fallback={<p role="status">Ouverture de la préparation du conseil qualifié…</p>}>
              <QualifiedAdvicePreparationControls key={readingArchive.contentReference} archive={readingArchive}
                prepared={prepared} baseSituation={qualifiedAdviceSetup.baseSituation} materials={prepared.runtime.materials}
                sourceContext={qualifiedAdviceSetup.sourceContext} currentProgram={qualifiedAdviceSetup.currentProgram}
                readOnly={busy || !!sourceUnavailable} onPrepare={request => runDocumentaryResult(async () => {
                  await prepareQualifiedAdviceForArchive(readingArchive, qualifiedAdviceSetup.scopeLedgerReference, request);
                })} />
            </Suspense>
          : <p className="hv-property-context-notice">{qualifiedAdviceSetup.reason}</p> : null}
        {qualifiedEntry && qualifiedEntry.sourceReadingReference === readingArchive?.contentReference ? <Suspense fallback={<p role="status">Ouverture de l’étude conservée…</p>}>
          <QualifiedStudyPanel key={`${qualifiedEntry.kind}:${qualifiedEntry.studyReference}`} entry={qualifiedEntry}
            onSaveProductStudy={qualifiedProductStudiesEnabled && qualifiedPreparationReference && !qualifiedEntry.readOnly
              ? request => runDocumentaryResult(() => qualifiedStudyController().saveProducts(qualifiedPreparationReference, request)) : undefined}
            onSaveAdviceStudy={qualifiedAdviceStudiesEnabled && qualifiedPreparationReference && !qualifiedEntry.readOnly
              ? request => runDocumentaryResult(() => qualifiedAdviceController().saveAdviceStudy(request)) : undefined}
            onPreferAdvice={qualifiedAdviceStudiesEnabled && !qualifiedEntry.readOnly
              ? request => runDocumentaryResult(async () => {
                const result = await qualifiedAdviceController().preferAdvice(request);
                await getReferenceWorkspace(); return result;
              }) : undefined} />
        </Suspense> : null}
        {propertyAnswerV4 ? <Suspense fallback={<p role="status">Ouverture de la lecture et de ses décisions…</p>}>
          <PropertyAdviceDecisionV4 key={`property-v4:${workspace?.id}`} record={propertyAnswerV4}
            onDisplayedRecordChange={identity => {
              if (identity.ownerKey !== services.ownerKey || identity.workspaceId !== workspaceRef.current?.id) return;
              retainDisplayedV4Identity(identity);
            }}
            previousRecords={propertyPreviousV4} dossiers={propertyDossiersV4} materialChoices={prepared.runtime.materials}
            readOnly={!propertyAdviceV4Enabled || readingHistorical || busy || !!sourceUnavailable || latestDocumentaryRow?.id !== propertyAnswerV4.id}
            onCorrect={request => runDocumentaryResult(() => propertyAdviceV4Controller().correct(request))}
            onSaveDossier={request => runDocumentaryResult(() => propertyAdviceV4Controller().dossier(request))}
            onReexamine={request => runDocumentaryResult(() => propertyAdviceV4Controller().reexamine(request))}
            onSearchMaterials={(query, scope) => propertyAdviceV4Materials(propertyAnswerV4, scope, query)}
            onSelectMaterials={ids => propertyAdviceV4Materials(propertyAnswerV4, ids)} />
        </Suspense> : null}
        {propertyAnswerV4 && displayedV4Identity && !displayedV4Record ? <p className="hv-error" role="alert">
          L’identité de la version affichée n’est plus disponible dans ce dossier. Relis une version exacte avant de la réexaminer.
        </p> : null}
        {propertyAdviceV4Enabled && displayedV4Record && readingHistorical && !sourceUnavailable ? <div className="hv-archive-banner">
          <strong>Réexaminer cette version dans la source active</strong>
          <p>Version visée : {localDateTime(displayedV4Record.transition.recordedAt)} · {displayedV4Record.readingContext.interpretation.origin === 'user' ? 'résumé déclaré' : 'résumé proposé'}.</p>
          <p>{displayedV4Record.readingContext.interpretation.text}</p>
          <details className="hv-details"><summary>Identité de la version visée</summary><small>{displayedV4Record.reference}</small><small>{displayedV4Record.ledger.reference}</small></details>
          <p>Les termes et leurs décisions seront repris dans une nouvelle lecture. Les accès devront être redéclarés.</p>
          <label className="hv-field"><span>Motif du réexamen de cette version</span><Textarea rows={2}
            value={historicalV4Reason} disabled={busy} onChange={event => { setHistoricalV4Reason(event.target.value); historicalV4Command.current = undefined; }} /></label>
          <button disabled={busy || !historicalV4Reason.trim()} onClick={() => void run(async () => {
            const retained = historicalV4Command.current;
            const command = retained?.reference === displayedV4Record.reference && retained.reason === historicalV4Reason
              ? retained : { commandId: uid('annotation-reexamination'), reference: displayedV4Record.reference, reason: historicalV4Reason };
            historicalV4Command.current = command;
            await propertyAdviceV4Controller().reexamine({ commandId: command.commandId,
              expectedRecordReference: displayedV4Record.reference, expectedLedgerReference: displayedV4Record.ledger.reference, reason: command.reason });
          })}>Confirmer le réexamen de cette version</button>
        </div> : null}
        {propertyAdviceV4Enabled && displayedV4Record && !sourceUnavailable ? <Suspense fallback={<p role="status">Ouverture de la préparation d’une nouvelle lecture…</p>}>
          <PropertyAdviceReexaminationPanelV4 key={`requalification:${workspace?.id}:${displayedV4Record.reference}`}
            parentRecord={displayedV4Record} readOnly={readingHistorical || latestDocumentaryRow?.id !== displayedV4Record.id}
            onPrepare={request => runDocumentaryResult(() => propertyAdviceV4Controller().prepareReexamination(request))}
            onConfirm={request => runDocumentaryResult(() => propertyAdviceV4Controller().confirmReexamination(request))} />
        </Suspense> : null}
        {documentaryRead?.status === 'unsupportedReadOnly' ? <div className="hv-archive-banner"><strong>Réponse documentaire conservée · lecture non prise en charge</strong><p>{documentaryRead.reason}</p>
          <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(documentaryRead.snapshot, null, 2)}</pre></details></div> : null}
        {documentaryAnswer ? <Suspense fallback={<p role="status">Ouverture de la réponse documentaire conservée…</p>}>
          <DocumentaryDecision key={documentaryAnswer.reference} answer={documentaryAnswer.answerSnapshot} dossiers={documentaryDossiers}
            readOnly={!documentarySynthesisEnabled || readingHistorical || busy || !!sourceUnavailable || latestDocumentaryRow?.id !== documentaryAnswer.id}
            onReinterpret={request => runDocumentaryResult(() => reinterpretDocumentary(request))}
            onSaveDossier={request => runDocumentaryResult(() => saveDocumentaryDossier(request))}
            onChooseCandidates={chooseDocumentaryCandidates} />
        </Suspense> : null}
        {propertyAdviceEnabled && documentaryAnswer && latestDocumentaryRow?.id === documentaryAnswer.id && !busy ? <button
          onClick={() => void run(async () => { await upgradeDocumentaryAnswer(documentaryAnswer); })}>Reprendre cette lecture avec ses propriétés explicites</button> : null}
        {propertyAdviceV3Enabled && documentaryAnswer && latestDocumentaryRow?.id === documentaryAnswer.id ? <button disabled={busy}
          onClick={() => void run(async () => {
            const intermediate = await upgradeDocumentaryAnswer(documentaryAnswer);
            await propertyAdviceV3Controller().upgrade(intermediate);
            readingHistoricalRef.current = false; setReadingHistorical(false);
            setNotice('Nouvelle lecture conservée avec ses annotations. Les anciennes réponses et leurs choix restent intacts.');
          })}>Actualiser cette lecture avec ses annotations</button> : null}
        {propertyAnswer ? <Suspense fallback={<p role="status">Ouverture des stratégies conservées…</p>}>
          <PropertyAdviceDecision key={propertyAnswer.reference} answer={propertyAnswer.answerSnapshot} answerRecordReference={propertyAnswer.reference}
            dossiers={propertyDossiers} materialChoices={prepared.runtime.materials}
            readOnly={!propertyAdviceEnabled || readingHistorical || busy || !!sourceUnavailable || latestDocumentaryRow?.id !== propertyAnswer.id}
            onReinterpret={request => runDocumentaryResult(() => reinterpretPropertyAdvice(request))}
            onSearchMaterials={(query, scope) => propertyAdviceMaterials(propertyAnswer, scope, query)}
            onSelectMaterials={ids => propertyAdviceMaterials(propertyAnswer, ids)}
            onSaveDossier={request => runDocumentaryResult(() => savePropertyAdviceDossier(request))} />
        </Suspense> : null}
        {propertyAdviceV3Enabled && propertyAnswer && latestDocumentaryRow?.id === propertyAnswer.id ? <button disabled={busy}
          onClick={() => void run(async () => {
            await propertyAdviceV3Controller().upgrade(propertyAnswer);
            readingHistoricalRef.current = false; setReadingHistorical(false);
            setNotice('Nouvelle lecture conservée. La réponse précédente et ses choix restent dans l’historique.');
          })}>Actualiser cette lecture avec ses annotations</button> : null}
        {propertyAnswerV3 ? <Suspense fallback={<p role="status">Ouverture des stratégies conservées…</p>}>
          <PropertyAdviceDecisionV3 key={propertyAnswerV3.reference} answer={propertyAnswerV3.answerSnapshot}
            answerRecordReference={propertyAnswerV3.reference} dossiers={propertyDossiersV3} materialChoices={prepared.runtime.materials}
            renderContextNotice={(entry, canCorrect, openCorrection) => {
              const raw = workspace?.documentaryAnswers?.find(row => row.reference === entry.answerRecordReference);
              const read = raw && readHopV55DocumentaryAnswerRecord(raw);
              if (!read || read.status !== 'readOnly' || read.record.format !== 'hop-v55-documentary-answer-record-v3'
                || read.record.answerReference !== entry.answer.reference) return null;
              const provenance = propertyAdviceContextProvenance(read.record, workspace?.documentaryAnswers ?? []);
              if (provenance.kind === 'initial') return null;
              if (provenance.kind === 'unavailable') return <p className="hv-property-context-notice">
                Origine de ce contexte non disponible dans les réponses chargées. Les valeurs de cette réponse restent figées.
              </p>;
              const labels = { bulkBeer: 'lot de bière', sampling: 'prélèvement', separatePortion: 'portion séparée' };
              return <aside className="hv-property-context-notice" aria-label="Contexte de cette lecture">
                <strong>Contexte relu pour ce réexamen</strong>
                <p>Ta lecture est conservée. Le stade et les accès ci-dessous sont ceux de cette réponse.
                  {provenance.unknownAccesses.length ? ` Accès à préciser pour cette question : ${provenance.unknownAccesses.map(scope => labels[scope]).join(', ')}.` : ''}
                </p>
                {canCorrect && provenance.unknownAccesses.length ? <button type="button" onClick={openCorrection}>
                  Préciser les accès de cette lecture
                </button> : null}
              </aside>;
            }}
            readOnly={!propertyAdviceV3Enabled || readingHistorical || busy || !!sourceUnavailable || latestDocumentaryRow?.id !== propertyAnswerV3.id}
            onReinterpret={request => runDocumentaryResult(() => propertyAdviceV3Controller().reinterpret(request))}
            onSearchMaterials={(query, scope) => propertyAdviceV3Controller().materials(propertyAnswerV3, scope, query)}
            onSelectMaterials={ids => propertyAdviceV3Controller().materials(propertyAnswerV3, ids)}
            onSaveDossier={request => runDocumentaryResult(async () => {
              const dossier = await propertyAdviceV3Controller().dossier(request);
              setNotice('Choix documentaire conservé avec ses références exactes.'); return dossier;
            })} />
        </Suspense> : null}
        {propertyAdviceV4Enabled && propertyAnswerV3 && !readingHistorical && latestDocumentaryRow?.id === propertyAnswerV3.id ? <button disabled={busy}
          onClick={() => void run(async () => {
            await propertyAdviceV4Controller().upgradeV3(propertyAnswerV3.reference, uid('annotation-upgrade'),
              'Reprendre explicitement cette lecture pour conserver les termes retenus, corrigés ou écartés avec leurs motifs.');
          })}>Reprendre les termes proposés et leurs décisions</button> : null}
        {propertyAdviceV3Enabled && propertyAnswerV3 && !readingHistorical && latestDocumentaryRow?.id === propertyAnswerV3.id ? <button disabled={busy}
          onClick={() => void run(async () => {
            const current = prepareBrewingScenarioContext(await currentContext());
            const request = structuredClone(propertyAnswerV3.answerSnapshot.requestSnapshot);
            request.candidatePolicy = { kind: 'discover', materialIds: current.runtime.materials.map(material => material.id),
              basis: 'Recherche explicitement demandée dans les identités exactes du catalogue chargé; ce périmètre ne constitue pas une sélection.' };
            await propertyAdviceV3Controller().reinterpret({ request, expectedAnswerRecordReference: propertyAnswerV3.reference,
              expectedAnswerReference: propertyAnswerV3.answerReference, expectedInterpretationReference: propertyAnswerV3.answerSnapshot.interpretationReference,
              reason: 'Chercher explicitement des options documentées pour les propriétés de cette demande.' });
          })}>Chercher des options dans le catalogue chargé</button> : null}
        {propertyAdviceV3Enabled && propertyAnswerV3 && !busy ? <button onClick={() => void run(async () => {
          await propertyAdviceV3Controller().reexamine(propertyAnswerV3.id, propertyAnswerV3.reference);
        })}>Réexaminer ces annotations dans le contexte actif</button> : null}
        {propertyAdviceEnabled && propertyAnswer && !readingHistorical && latestDocumentaryRow?.id === propertyAnswer.id ? <button disabled={busy}
          onClick={() => void run(async () => {
            const current = prepareBrewingScenarioContext(await currentContext());
            const request = structuredClone(propertyAnswer.answerSnapshot.requestSnapshot);
            request.candidatePolicy = { kind: 'discover', materialIds: current.runtime.materials.map(material => material.id),
              basis: 'Recherche explicitement demandée dans les identités exactes du catalogue chargé. Ce périmètre de découverte ne constitue pas une sélection de matières.' };
            await reinterpretPropertyAdvice({ request, expectedAnswerRecordReference: propertyAnswer.reference,
              expectedAnswerReference: propertyAnswer.answerReference, expectedInterpretationReference: propertyAnswer.answerSnapshot.interpretationReference,
              reason: 'Rechercher explicitement les matières documentées du catalogue pour les propriétés de cette lecture.' });
          })}>Chercher des options dans le catalogue chargé</button> : null}
        {propertyAdviceEnabled && propertyAnswer && !busy ? <button onClick={() => void run(async () => { await reexaminePropertyAdvice(propertyAnswer.id, propertyAnswer.reference); })}>
          Réexaminer ces propriétés dans le contexte actif
        </button> : null}
        {qualifiedProductStudiesEnabled && readingArchive?.reading.response?.actionKind === 'understandProducts'
          && !readingHistorical && !qualifiedEntry ? <button disabled={busy} onClick={() => void run(async () => {
            const response = readingArchive.reading.response;
            if (!response || response.actionKind !== 'understandProducts' || !('products' in response.result)) {
              throw Error('Les fiches exactes de cette lecture produit ne sont plus disponibles.');
            }
            await qualifiedStudyController().prepareProducts(response.result.products.map(product => product.id));
          })}>Préparer une étude de ces fiches produit</button> : null}
        {documentarySynthesisEnabled && readingArchive?.reading.response
          && readingArchive.reading.response.actionKind !== 'understandProducts' && !readingHistorical && !documentaryRow ? <button disabled={busy} onClick={() => void run(async () => {
          const { archive, prep } = await currentDecisionReading(readingArchive.contentReference);
          await prepareDocumentaryAnswer(archive, prep, true);
        })}>Examiner les possibilités, accords et limites documentés</button> : null}
        {reading ? <details className="hv-details" open={!displayedPropertyAnswer && !propertyAnswerV4}><summary>{displayedPropertyAnswer || propertyAnswerV4 ? 'Lecture initiale et préparation du programme' : 'Lecture et préparation de la demande'}</summary>
          <Suspense fallback={<p role="status">Ouverture de la lecture conservée…</p>}><DecisionResponse reading={reading} prepared={prepared} context={context}
          historical={readingHistorical || readingArchive?.format !== 'hop-v55-decision-reading-v4' && (!!displayedPropertyAnswer || !!propertyAnswerV4)} archive={readingArchive}
          program={program} programMaterials={prepared.runtime.materials} onPrepare={prepareStrategy} onExplore={exploreAdvice}
          onPrepareDecision={readingArchive?.format !== 'hop-v55-decision-reading-v4' && reading.response && !displayedPropertyAnswer
            ? request => run(() => correctDecision(request), true) : undefined}
          onPrepareSemanticCorrection={readingArchive?.format === 'hop-v55-decision-reading-v4'
            ? request => run(() => correctSemanticDecision(request), true) : undefined}
          semanticCorrectionSaving={semanticCorrectionSaving || busy} semanticCorrectionError={semanticCorrectionError}
          onPrepareProgram={request => run(() => prepareDecisionProgram(request), true)}
          onCompareProgramPreparation={request => run(() => compareDecisionProgram(request), true)}
          onResumeArchivedProgramPreparation={request => run(() => resumeDecisionProgram(request), true, false)}
          onReread={() => void run(rereadDisplayedQuestion)} /></Suspense></details> : <p>Un geste précis peut être réglé directement. {intent.question ? 'La demande est conservée ; sa première lecture n’est pas archivée dans cette ancienne version.'
            : displayingArchive ? 'Aucune question ni aucun critère ne sont liés à cette ancienne prévision. La demande courante reste dans son dossier.'
              : 'Pour explorer une idée, conserve d’abord ta demande.'}</p>}
        <details open={editorOpen} onToggle={e => setEditorOpen(e.currentTarget.open)} id="hv-program-editor" className="hv-details"><summary>{displayingArchive ? 'Préparer un nouvel essai depuis le programme actif' : 'Régler dose, matière et emploi'}</summary>{displayingArchive ? <p>Ce réglage prépare une nouvelle prévision à partir du programme actif. L’archive consultée reste intacte.</p> : null}<HopV55ProgramEditor key={program ? `${program.id}:${program.revision}:${activeProgramCopy?.id ?? visibleFutureDraft?.contentReference ?? ''}` : 'unknown'} prepared={prepared} referenceProgram={visibleFutureDraft?.hypotheticalBaseline.program ?? referenceProgram} editableProgram={activeProgramCopy?.programAfter} prefill={programPrefill} onCommit={branch => { setDraftBranch(branch); void run(() => simulate([branch])); }} /></details>
        <details className="hv-details" open={planningOpen} onToggle={e => setPlanningOpen(e.currentTarget.open)}><summary>Volume, levure, fermentation, style et objectifs</summary><Suspense fallback={<p role="status">Ouverture des consignes de l’essai…</p>}><PlanningEditor key={`${result?.reference ?? program?.id ?? 'new'}:${stylePrefill?.id ?? ''}`} context={context} prepared={prepared} target={comparisonTarget} stylePrefill={stylePrefill}
          branch={editingBranch}
          onCommit={(branch, target) => { targetRef.current = target; setComparisonTarget(target); setDraftBranch(branch); void run(() => simulate([branch])); }} /></Suspense></details>
        {result ? <><HopV55ReferenceComparisonSlot basis={referenceBasis}
          comparison={referenceBasis.mode === 'archive' ? archivedReferenceComparison : referenceComparison}
          pending={referenceComparisonPending} error={comparisonError} result={result} branchIds={branchIds} axisIds={axisIds}
          showReferenceSeries={showReferenceSeries} mode={mode} onModeChange={setMode} selectableCandidateIds={allBranches.map(branch => branch.id)}
          onToggleCandidate={id => id === HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID ? setShowReferenceSeries(value => !value) : setBranchIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])}
          onToggleAxis={id => setAxisIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])}
          onChooseCandidate={displayingArchive ? undefined : id => { if (id !== HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID) void run(() => choose(id)); }} selectedCandidateId={selectedBranchId}
          renderJ5={() => <HopV55Comparison result={result} branchIds={branchIds} axisIds={axisIds} mode={mode} onModeChange={setMode}
            onToggleBranch={id => setBranchIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])}
            onToggleAxis={id => setAxisIds(ids => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id])}
            onChooseBranch={displayingArchive ? undefined : id => void run(() => choose(id))} selectedBranchId={selectedBranchId} />} />
          {comparisonError ? <p role="alert">La nouvelle comparaison n’a pas été conservée : {comparisonError}</p> : null}
          {displayingArchive && adoptedReference ? <button disabled={busy} onClick={() => setCompareArchiveToCurrentReference(true)}>Comparer ces mêmes candidats à la référence actuelle</button> : null}
          <Biology result={result} selectedBranchId={selectedBranchId} />
          {displayedSnapshot ? <details className="hv-details"><summary>Explorer les nuances fines</summary><Suspense fallback={<p role="status">Ouverture du focus fin…</p>}><NuanceExplorer prepared={prepared} result={result} snapshotReference={displayedSnapshot.reference} workspace={workspace} branchProfile={displayedTrialBranchProfile ?? null} getWorkspace={() => getReferenceWorkspace()} onSave={saveFullWorkspace} /></Suspense></details> : null}
          <details className="hv-details"><summary>Hypothèses et analogues révisables</summary><Suspense fallback={<p role="status">Ouverture des hypothèses…</p>}><HypothesisEditor prepared={prepared} branch={editingBranch}
            onRevise={branch => { setDraftBranch(branch); void run(() => simulate([branch], true)); }} /></Suspense><ul>{(selected ?? result.baseline).assumptions.map(row => <li key={row.id}><strong>{row.label}</strong> · {row.status === 'selected' ? 'Adoptée' : 'Proposée'} · {row.explanation}<small>{row.unit ?? ''} · {(selected ?? result.baseline).usedAssumptionIds.includes(row.id) ? 'Utilisée par le calcul' : 'Non utilisée par le calcul'}</small></li>)}</ul></details>
          <details className="hv-details"><summary>Quantités biologiques, transformation et pertes à comparer</summary><Suspense fallback={<p role="status">Ouverture des entrées biologiques…</p>}><BiologicalInputsEditor prepared={prepared} branch={editingBranch} onRevise={branch => { setDraftBranch(branch); void run(() => simulate([branch], true)); }} /></Suspense></details>
          {selected && !displayingArchive ? <section className="hv-choice"><h3>{selected.label}</h3><p>{statuses[selected.applicability]}</p>{selected.limitations.length ? <details className="hv-details"><summary>Conditions et portée</summary>{selected.limitations.map((line, index) => <p key={index}>{line}</p>)}</details> : null}
            {!context?.recipe && displayedSnapshot && adoptedReference ? <Suspense fallback={<p role="status">Ouverture du brouillon futur…</p>}><FutureRecipeDraftPanel result={result} snapshot={displayedSnapshot} branchId={selectedBranchId!} adoptedReference={visibleFutureDraft?.origin.adoptedReference ?? adoptedReference} intent={intent}
              loadDraftRevision={identity => { if (!workspaceRef.current) throw Error('Le dossier de brouillon n’est pas ouvert.'); return services.loadFutureDraft({ kind: 'localFutureDraft', workspaceId: workspaceRef.current.id, ...identity }); }}
              initialDraft={visibleFutureDraft} getCurrentReferences={futureReferences} onSaveDraft={saveFutureDraft} onMaterialize={saveFutureMaterialization} onExplore={(draft, proposal) => run(() => exploreFutureDraft(draft, proposal), true)} /></Suspense> : context?.batch ? <><div className="hv-actions"><button disabled={busy} onClick={() => void run(makeProgramPreview)}>Prévisualiser le programme futur</button>{programPreview ? <button className="hv-primary" disabled={busy} onClick={() => void run(applyProgramCopy)}>Conserver la copie du programme futur</button> : null}</div>{programPreview ? <ul>{programPreview.programAfter.additions.map(row => <li key={row.id}>{prepared.runtime.materials.find(material => material.id === row.materialId)?.name ?? row.materialId} · {number(row.grams)}g · {row.status === 'performed' ? 'Effectué, inchangé' : 'Prévu dans la copie'}</li>)}</ul> : null}</> :
               recipeDraftTarget ? null :
              <Suspense fallback={<p role="status">Ouverture de la copie de recette…</p>}><RecipeCopyPanel result={result} branchId={selectedBranchId!} context={context!} getContext={loadExactContext} onCopy={saveCompletedRecipeCopy}
                onRecompute={saveRecomputedCandidate} getRecomputeIdentity={recomputeIdentity}
                originAnnex={displayedCopyHandoff?.supersedes} initialPlan={displayedCopyHandoff?.plan} initialAlphaChoices={displayedCopyHandoff?.alphaChoices} /></Suspense>}
          </section> : null}
         {selected && recipeDraftTarget && result ? <section className="hv-choice" aria-label="Application au brouillon de recette">
           {displayingArchive ? <p role="status">Cette prévision d’application vise la version précédente du brouillon. Elle reste visible en lecture seule; la nouvelle source n’a pas repris ce programme.</p> : null}
           <div aria-disabled={displayingArchive} inert={displayingArchive || undefined}>
             <Suspense fallback={<p role="status">Ouverture de l’application au brouillon…</p>}><RecipeProgramApplicationPanel key={`${result.reference}:${selectedBranchId}`}
               target={recipeDraftTarget} servicesOwnerKey={services.ownerKey} workspaceId={workspace?.id ?? null} result={result} branchId={selectedBranchId!}
               materials={prepared?.runtime.materials ?? []} getContext={loadExactContext} onApplied={afterRecipeDraftApplication}
               disabled={busy || displayingArchive || !!sourceUnavailable} /></Suspense>
           </div>
         </section> : null}
          {record?.events.some(event => event.kind === 'observationAppended') ? <details className="hv-details"><summary>Observations du dossier de prévision historique</summary><p>Les nouvelles notes et corrections passent dans le journal de références ci-dessous.</p>{record.events.filter(event => event.kind === 'observationAppended' && event.payload.snapshotReference === displayedSnapshot?.reference).map(event => event.kind === 'observationAppended' ? <p key={event.eventId}><strong>{event.payload.observation.dimension}</strong> · {event.payload.observedAt} · {event.payload.observation.kind === 'qualitative' ? event.payload.observation.reported : JSON.stringify(event.payload.observation.value)}<small>{event.payload.observation.context}</small></p> : null)}</details> : null}
        </> : null}
      </section> : null}

      {view === 'explore' || exploreVisited ? <section hidden={view !== 'explore'}><div className="hv-section-title"><h2>Explorer et composer</h2><button aria-pressed={catalogueOpen} onClick={() => setCatalogueOpen(open => !open)}><BookOpen size={14} /> Catalogues</button></div>
        {catalogueOpen || catalogueVisited ? <div hidden={!catalogueOpen}><Suspense fallback={<p role="status">Ouverture des catalogues…</p>}><Catalogue services={services} onCanonicalRecord={() => void run(async () => { await currentContext(); })} onUseRecord={row => void run(() => useCatalogue(row))} /></Suspense></div> : null}
        <div hidden={catalogueOpen} className="hv-observation-setup"><button disabled={busy || !!sourceUnavailable} aria-expanded={observationSetupOpen}
          onClick={() => void run(async () => { if (!observationSetupOpen) await getReferenceWorkspace(); setObservationSetupOpen(open => !open); })}>
          {observationSetupOpen ? 'Fermer la configuration des observations' : 'Configurer les observations et leurs comparaisons'}</button>
          {observationSetupOpen && workspace ? <Suspense fallback={<p role="status">Ouverture des protocoles et cadres…</p>}>
            <ObservationSupportPanel workspace={workspace} context={context!} prepared={prepared} getWorkspace={() => getReferenceWorkspace()} onSave={saveFullWorkspace}
              disabled={busy || !!sourceUnavailable} />
          </Suspense> : null}
        </div>
        {workspace && activeObservationSupport ? <div hidden={catalogueOpen}><Suspense fallback={<p role="status">Ouverture des observations documentées…</p>}>
          <ObservationWorkbench key={`${workspace.id}:${activeObservationSupport.hopScope.id}`} workspace={workspace} context={context!} prepared={prepared}
            getWorkspace={() => getReferenceWorkspace()} onSave={saveFullWorkspace} support={activeObservationSupport}
            disabled={busy || !!sourceUnavailable || !context?.batch?.id || context.batch.id !== workspace.sourceBatchId}
            onOpenReference={() => setView('beer')} />
        </Suspense></div> : null}
        {!workspace ? <div className="hv-empty-state"><p>Un essai conserve son programme, sa source et son contexte dans un dossier local.</p>
          <button disabled={busy || !context || !prepared || !!sourceUnavailable} onClick={() => void run(async () => {
            const ws = await getReferenceWorkspace();
            setNotice(`Dossier local prêt · ${ws.title}. Les essais resteront séparés de la recette.`);
          })}>Créer un dossier local pour cette exploration</button></div> : null}
        <div hidden={catalogueOpen}><HopV55Explorer prepared={prepared} intent={intent} selectionRequest={selectionRequest}
          program={program ?? null} profiles={workspace?.explorationProfiles}
          readingArchive={readingArchive?.format === 'hop-v55-decision-reading-v4' && !readingHistorical
            && readingArchive.reading.intent.question === intent.question ? readingArchive : undefined}
          originContext={explorationTrialOriginContext ?? null}
          onDeclareProfile={profile => run(() => persistExplorationProfile(profile), true)}
          onPrepareTrial={entry => run(() => prepareExplorationTrial(entry), true)}
          onSelectionHandled={catalogueSelectionHandled} onDeclareReference={openReferenceArea}
          onPendingTrialEntered={pendingTrialEntered} selectionScope={workspace?.id ?? null}
          onCompose={composition => void run(() => compose(composition))} /></div>
      </section> : null}

      {view === 'history' ? <section><h2><Clock3 size={16} /> Dossiers et prévisions</h2><p className="hv-muted">Conservés sur cet appareil. L’ouverture relit les données figées et ne relance aucun calcul.</p>
        {workspace?.propertyAdviceReexaminationCommandStaging?.length ? <details className="hv-details"><summary>Confirmations de nouvelle lecture conservées</summary>
          {workspace.propertyAdviceReexaminationCommandStaging.map((raw, index) => {
            const read = readHopV55PropertyAdviceReexaminationCommandStaging(raw);
            if (read.status !== 'available') return <article key={`future-confirmation-${index}`}>
              <strong>Confirmation conservée · lecture non prise en charge</strong><p>{read.reason}</p>
            </article>;
            const staging = read.staging;
            const lookup = lookupStoredHopV55PropertyAdviceReexaminationCommand({ workspace, confirmation: staging.confirmation });
            return <article key={staging.reference}><strong>{staging.preview.originalQuestion}</strong>
              <p>{localDateTime(staging.confirmedAt)} · {lookup.status === 'committed' ? 'Rattachement confirmé' : 'Rattachement à terminer'} · {staging.confirmation.reason}</p>
              {lookup.status === 'pending' ? <button disabled={busy} onClick={() => void run(async () => {
                const confirmed = await propertyAdviceV4Controller().confirmReexamination(staging.confirmation);
                const saved = workspaceRef.current;
                if (saved && readingArchiveRef.current?.contentReference !== confirmed.sourceReadingReference) {
                  restoreReading(saved, confirmed.sourceReadingReference, true); setDocumentaryRecordId(confirmed.id);
                }
                setView('decide');
              })}>Terminer cette confirmation sans reconstruire le conseil</button> : null}
              <details className="hv-details"><summary>Références de cette confirmation</summary><small>{staging.reference}</small><small>{staging.preparedRecord.reference}</small></details>
            </article>;
          })}
        </details> : null}
        {workspace?.qualifiedStudyPreparations?.length ? <details className="hv-details"><summary>Études produit et conseils qualifiés · {workspace.qualifiedStudyPreparations.length}</summary>
          {workspace.qualifiedStudyPreparations.map((raw, index) => {
            const read = readHopV55QualifiedStudyPreparation(raw);
            if (read.status !== 'available') return <article key={`qualified-future-${index}`}>
              <strong>Étude conservée · version non prise en charge</strong><p>{read.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(read.snapshot, null, 2)}</pre></details>
            </article>;
            const preparation = read.preparation;
            const question = preparation.createCommand.kind === 'products' ? preparation.createCommand.study.request.intent.originalQuestion
              : preparation.createCommand.study.requestSnapshot.intent.originalQuestion;
            const linked = workspace.qualifiedStudyLinks?.some(row => {
              const link = readHopV55QualifiedStudyLink(row);
              return link.status === 'available' && link.link.preparationReference === preparation.reference;
            });
            return <article key={preparation.reference}>
              <strong>{preparation.kind === 'products' ? 'Étude produit' : 'Conseil de stratégies'} · {question}</strong>
              <p>{linked ? 'Dossier local conservé et lié à sa lecture.' : 'Préparation conservée; le dossier attend encore sa confirmation.'}</p>
              <button disabled={busy} onClick={() => void run(() => openQualifiedStudy(preparation.reference, workspace))}>
                Relire cette étude exacte
              </button>
            </article>;
          })}
        </details> : null}
        {workspace?.documentaryAnswers?.length ? <details className="hv-details"><summary>Réponses et dossiers documentaires · {workspace.documentaryAnswers.length}</summary>
          {workspace.documentaryAnswers.map((raw, index) => {
            const read = readHopV55DocumentaryAnswerRecord(raw);
            if (read.status !== 'readOnly') return <article key={`future-documentary-${index}`}><strong>Réponse conservée · lecture non prise en charge</strong><p>{read.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(read.snapshot, null, 2)}</pre></details></article>;
            const entry = read.record;
            if (entry.format === 'hop-v55-documentary-answer-record-v4') return <article key={entry.reference}>
              <strong>{entry.originalQuestion}</strong><p>Lecture conservée · {entry.readingContext.interpretation.text}</p>
              <p>{entry.outcome.kind === 'allRejected' ? 'Aucune annotation retenue dans cette version.' : 'Réponse et corrections conservées avec leur trace.'}</p>
              <details className="hv-details"><summary>Références et trace de cette correction</summary><pre>{JSON.stringify(entry, null, 2)}</pre></details>
              <button disabled={busy} onClick={() => {
                restoreReading(workspace, entry.sourceReadingReference, true); setDocumentaryRecordId(entry.id);
                setRecord(undefined); setResult(undefined); setDisplayedSnapshot(undefined); setEditorOpen(false); setHistoricalView(true); setView('decide');
                setNotice('Correction exacte rouverte en lecture figée. Aucun conseil reconstruit.');
              }}>Relire cette correction documentaire</button>
            </article>;
            return <article key={entry.reference}><strong>{entry.answerSnapshot.requestSnapshot.originalQuestion}</strong><p>{entry.answerSnapshot.requestSnapshot.interpretation.origin === 'user' ? 'Lecture déclarée' : 'Lecture proposée'} · {entry.answerSnapshot.requestSnapshot.interpretation.text}</p>
              {entry.revisionContext ? <p>{localDateTime(entry.revisionContext.recordedAt)} · motif de la révision : {entry.revisionContext.reason}</p> : null}
              {'reexaminationContext' in entry && entry.reexaminationContext ? <p>{localDateTime(entry.reexaminationContext.recordedAt)} · motif du réexamen : {entry.reexaminationContext.reason}</p> : null}
              <p>Réponse documentaire figée · choix et limites conservés</p>
              <button disabled={busy} onClick={() => {
                restoreReading(workspace, entry.sourceReadingReference, true); setDocumentaryRecordId(entry.id);
                setRecord(undefined); setResult(undefined); setDisplayedSnapshot(undefined); setEditorOpen(false); setHistoricalView(true); setView('decide');
                setNotice('Réponse et dossiers exacts rouverts. Aucun conseil ni calcul reconstruit.');
              }}>Relire cette réponse documentaire</button></article>;
          })}
        </details> : null}
        {workspace?.decisionReadings?.length ? <details className="hv-details"><summary>Lectures et préparations de question · {workspace.decisionReadings.length}</summary>
          {workspace.decisionReadings.map((raw, index) => {
            const read = readHopV55DecisionReadingArchive(raw);
            if (read.status !== 'available') return <article key={`unreadable-reading-${index}`}><strong>Lecture conservée · {read.status === 'unsupportedFormat' ? 'format futur' : 'contenu non validé'}</strong>
              <p>{read.status === 'unsupportedFormat' ? 'Consultation des données brutes, aucune conversion ni préparation proposée.' : read.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(raw, null, 2)}</pre></details></article>;
            const archive = read.archive;
            const readingStatus = archive.format === 'hop-v55-decision-reading-v4'
              ? archive.reading.correction ? 'lecture sémantique corrigée' : archive.lineage ? 'réinterprétation sémantique V4' : 'lecture sémantique V4'
              : (archive.format === 'hop-v55-decision-reading-v2' || archive.format === 'hop-v55-decision-reading-v3') && archive.reading.correction
                ? 'lecture corrigée' : 'lecture conservée';
            return <article key={archive.contentReference}><strong>{archive.reading.intent.question}</strong><p>{localDateTime(archive.recordedAt)} · {readingStatus}
              {'programPreparation' in archive && archive.programPreparation ? ' · préparation de programme conservée' : ''}</p>
              <button disabled={busy} onClick={() => {
                restoreReading(workspace, archive.contentReference, true); setRecord(undefined); setResult(undefined); setDisplayedSnapshot(undefined);
                setReferenceComparison(undefined); setHistoricalView(true); setProgramPreview(undefined); setEditorOpen(false); setView('decide');
                setNotice('Lecture et préparation exactes rouvertes. Aucun service de lecture ou calcul relancé.');
              }}>Relire cette lecture</button></article>;
          })}
        </details> : null}
        {workspace?.assistedAdviceRecords?.length ? <details className="hv-details"><summary>Réponses assistées conservées · {workspace.assistedAdviceRecords.length}</summary>
          <p>Chaque réponse reste liée au ticket, au tour et à la lecture d’origine. La relecture ci-dessous n’interroge aucun service de conseil.</p>
          {workspace.assistedAdviceRecords.map((raw, index) => {
            const row = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : undefined;
            const operationId = typeof row?.operationId === 'string' ? row.operationId : undefined;
            const historyRead = readAssistedHistoryReceipt(workspace, raw);
            const archive = historyRead.archiveRead?.status === 'available' ? historyRead.archiveRead : undefined;
            const ticket = archive?.ticket ?? (historyRead.ticketRead?.status === 'readOnly' ? historyRead.ticketRead.ticket : undefined);
            const record = archive?.record;
            const question = ticket?.request.question;
            const receiptReadReason = historyRead.archiveRead && historyRead.archiveRead.status !== 'available'
              ? historyRead.archiveRead.reason : undefined;
            const title = question ?? (historyRead.archiveRead?.status === 'unsupportedReadOnly'
              ? 'Réponse assistée conservée · format futur'
              : historyRead.archiveRead?.status === 'invalid' ? 'Réponse assistée conservée · contenu non validé'
                : 'Réponse assistée conservée · ticket source non reconnu');
            return <article key={operationId ? `${operationId}:${index}` : `opaque-assisted-${index}`}>
              <strong>{title}</strong>
              {ticket ? <p>{record ? <><time>{localDateTimeFromMillis(record.turn.createdAt)}</time> · réponse reçue</>
                : <><time dateTime={ticket.createdAt}>{localDateTime(ticket.createdAt)}</time> · ticket source</>} · {assistedAdviceContextLabel(ticket)}</p>
                : <p>{receiptReadReason ?? 'Question source non lue : référence du ticket absente ou non reconnue.'}</p>}
              {receiptReadReason ? <p>{historyRead.archiveRead?.status === 'unsupportedReadOnly' ? 'Reçu conservé en lecture seule · ' : 'Reçu non validé · '}{receiptReadReason}</p> : null}
              {operationId ? <button disabled={busy} onClick={() => void run(() => openAssistedArchive(operationId))}>Relire cette réponse exacte</button> : null}
              <details className="hv-details"><summary>Identités et références exactes</summary>
                {operationId ? <small>Opération · {operationId}</small> : null}
                {ticket ? assistedHistoryTicketDetails(ticket) : null}
                {record ? <dl><div><dt>Reçu</dt><dd><code>{record.reference}</code></dd></div>
                  <div><dt>Tour</dt><dd><code>{record.turn.id}</code></dd></div></dl> : null}
                {!record ? <pre>{JSON.stringify(historyRead.archiveRead?.status === 'unsupportedReadOnly'
                  ? historyRead.archiveRead.snapshot : raw, null, 2)}</pre> : null}
              </details>
            </article>;
          })}
        </details> : null}
        {onOpenAssistedCompanion && workspace?.assistedAdviceTickets?.length ? <details className="hv-details">
          <summary>Tickets assistés sans réponse archivée · {workspace.assistedAdviceTickets.filter(raw => {
            const operationId = raw && typeof raw === 'object' && 'operationId' in raw && typeof raw.operationId === 'string' ? raw.operationId : undefined;
            return !!operationId && !(workspace.assistedAdviceRecords ?? []).some(record => record && typeof record === 'object'
              && 'operationId' in record && record.operationId === operationId);
          }).length}</summary>
          <p>Réouvre le lancement exact enregistré avant l’envoi. La Page n’analyse pas de nouveau la question et conserve le périmètre enregistré dans son ticket.</p>
          {workspace.assistedAdviceTickets.map((raw, index) => {
            const ticketRead = readHopV55AssistedAdviceTicketV1(raw);
            const operationId = ticketRead.status === 'readOnly' ? ticketRead.ticket.operationId
              : raw && typeof raw === 'object' && 'operationId' in raw && typeof raw.operationId === 'string' ? raw.operationId : undefined;
            const hasReceipt = !!operationId && (workspace.assistedAdviceRecords ?? []).some(record => record && typeof record === 'object'
              && 'operationId' in record && record.operationId === operationId);
            if (!operationId || hasReceipt) return null;
            if (ticketRead.status !== 'readOnly') return <article key={`${operationId}:${index}`}>
              <strong>{ticketRead.status === 'unsupportedReadOnly' ? 'Ticket assisté conservé · format futur' : 'Ticket assisté conservé · contenu non validé'}</strong>
              <p>{ticketRead.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(ticketRead.status === 'unsupportedReadOnly' ? ticketRead.snapshot : raw, null, 2)}</pre></details>
            </article>;
            const ticket = ticketRead.ticket;
            return <article key={`${ticket.reference}:${index}`}>
              <strong>{ticket.request.question}</strong>
              <p><time dateTime={ticket.createdAt}>{localDateTime(ticket.createdAt)}</time> · {assistedAdviceContextLabel(ticket)}</p>
              <button disabled={busy} onClick={() => void run(() => reopenAssistedTicket(ticket.operationId))}>
                Rattacher cette réponse assistée
              </button>
              <details className="hv-details"><summary>Identités et références exactes</summary>
                <small>Opération · {ticket.operationId}</small>{assistedHistoryTicketDetails(ticket)}
              </details>
            </article>;
          })}
        </details> : null}
        {workspace?.assistedSemanticAdviceTickets?.length ? <details className="hv-details" data-testid="semantic-assisted-history">
          <summary>Lectures V4 relues par le compagnon · {workspace.assistedSemanticAdviceTickets.length}</summary>
          <p>Chaque ticket garde la question, la source et le périmètre conservés avant l’envoi. Le rouvrir relit le ticket et sa réponse, sans nouvel envoi.</p>
          {workspace.assistedSemanticAdviceTickets.map((raw, index) => {
            const read = readHopV55AssistedAdviceTicketV2(raw);
            if (read.status !== 'readOnly') return <article key={`semantic-ticket-opaque-${index}`}>
              <strong>{read.status === 'unsupportedReadOnly' ? 'Ticket conservé · format futur'
                : read.status === 'legacyReadOnly' ? 'Ticket conservé · format historique' : 'Ticket conservé · contenu non validé'}</strong>
              <p>{read.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(read.status === 'invalid' ? raw : read.snapshot, null, 2)}</pre></details>
            </article>;
            const ticket = read.ticket;
            const policy = ticket.format === 'hop-v55-assisted-advice-ticket-v3' ? ticket.candidatePolicy : undefined;
            const recordRaw = (workspace.assistedSemanticAdviceRecords ?? []).find(row => !!row && typeof row === 'object'
              && (row as { ticketReference?: unknown }).ticketReference === ticket.reference);
            const recordRead = recordRaw ? readHopV55AssistedAdviceArchiveV2({ ticket, record: recordRaw }) : undefined;
            const answer = !recordRead ? 'sans réponse conservée' : recordRead.status !== 'readOnly'
              ? recordRead.status === 'invalid' ? 'réponse non validée' : 'réponse conservée sans conversion'
              : recordRead.record.semantic.kind === 'verifiedV6' ? 'réponse liée à cette lecture conservée' : 'réponse conservée en lecture seule';
            return <article key={`${ticket.reference}:${index}`}>
              <strong>{ticket.question}</strong>
              <p><time dateTime={ticket.createdAt}>{localDateTime(ticket.createdAt)}</time> · {assistedScopeLabels[ticket.scope.kind]} · {answer}</p>
              {!policy ? <p role="status">Ticket sans périmètre conservé : lecture seule, aucune adoption possible.</p> : null}
              {policy && semanticAdoptionHost && onOpenSemanticCompanion && !recipeDraftTarget ? <button disabled={busy}
                onClick={() => void run(() => reopenSemanticTicket(ticket.operationId))}>Rouvrir ce ticket exact</button> : null}
              <details className="hv-details"><summary>Identités et références exactes</summary><dl>
                <div><dt>Opération</dt><dd><code>{ticket.operationId}</code> · génération {ticket.generation}</dd></div>
                <div><dt>Portée</dt><dd><code>{ticket.scope.kind}:{ticket.scope.id}</code></dd></div>
                <div><dt>Lecture source</dt><dd><code>{ticket.references.sourceReadingReference}</code></dd></div>
                <div><dt>Ticket</dt><dd><code>{ticket.reference}</code></dd></div>
                <div><dt>Wire</dt><dd><code>{ticket.references.wireReference}</code></dd></div>
                {policy ? <div><dt>Périmètre</dt><dd><code>{JSON.stringify(policy)}</code></dd></div> : null}
                {recordRead?.status === 'readOnly' ? <div><dt>Réponse</dt><dd><code>{recordRead.record.reference}</code></dd></div> : null}
                {recordRead?.status === 'readOnly' && recordRead.record.semantic.kind === 'verifiedV6'
                  ? <div><dt>Format de la réponse</dt><dd><code>V6 vérifié</code></dd></div> : null}
              </dl></details>
            </article>;
          })}
        </details> : null}
        {workspace?.semanticAdoptionCommits?.length ? <details className="hv-details" data-testid="semantic-adoption-history">
          <summary>Choix documentaires confirmés · {workspace.semanticAdoptionCommits.length}</summary>
          <p>Chaque reçu garde son instant d’effet et la réponse dont il provient. Aucun n’a modifié recette, brouillon, stock ou brassin.</p>
          {workspace.semanticAdoptionCommits.map((raw, index) => {
            const read = readHopV55SemanticAdoptionCommitV1(raw);
            if (read.status !== 'readOnly') return <article key={`semantic-commit-opaque-${index}`}>
              <strong>{read.status === 'unsupportedReadOnly' ? 'Reçu conservé · format futur' : 'Reçu conservé · contenu non validé'}</strong>
              <p>{read.reason}</p>
              <details className="hv-details"><summary>Données conservées</summary><pre>{JSON.stringify(read.status === 'unsupportedReadOnly' ? read.raw : raw, null, 2)}</pre></details>
            </article>;
            const commit = read.commit;
            const checked = semanticHistory?.workspaceId === workspace.id && semanticHistory.commandId === commit.id ? semanticHistory : undefined;
            return <article key={commit.reference}>
              <strong>{commit.plan.reason}</strong>
              <p>Effectif le <time dateTime={commit.receipt.effectiveAt}>{localDateTime(commit.receipt.effectiveAt)}</time> · {commit.plan.selection
                .map(row => row.activeIntent.label).join(' · ')} · aucun effet sur la recette</p>
              {semanticAdoptionHost ? <div className="hv-actions">
                <button disabled={busy} onClick={() => void run(() => readSemanticAdoption(commit.id, commit.plan.ticket.operationId))}>Relire ce reçu</button>
                <button disabled={busy} onClick={() => void run(() => readSemanticAdoption(commit.id, commit.plan.ticket.operationId, commit.plan))}>
                  Rejouer la même confirmation</button>
              </div> : null}
              {checked ? <p role="status">{checked.mode === 'replay'
                ? 'Rejeu : même reçu et même instant d’effet, aucun second enregistrement.'
                : 'Relecture : reçu, plan et version documentaire concordent.'} <time dateTime={checked.receipt.effectiveAt}>{localDateTime(checked.receipt.effectiveAt)}</time></p> : null}
              <details className="hv-details"><summary>Provenance et références exactes</summary><dl>
                <div><dt>Commande</dt><dd><code>{commit.id}</code></dd></div>
                <div><dt>Reçu</dt><dd><code>{commit.receipt.reference}</code></dd></div>
                <div><dt>Empreinte</dt><dd><code>{commit.receipt.fingerprint}</code></dd></div>
                <div><dt>Version documentaire</dt><dd><code>{commit.receipt.record.id}</code> · <code>{commit.receipt.record.reference}</code></dd></div>
                <div><dt>Tête attendue</dt><dd><code>{semanticHeadText(commit.receipt.expectedHead)}</code></dd></div>
                <div><dt>Demande</dt><dd><code>{commit.plan.requestId}</code></dd></div>
                <div><dt>Ticket</dt><dd><code>{commit.sourceTicketReference}</code></dd></div>
                <div><dt>Réponse source</dt><dd><code>{commit.sourceRecordReference}</code></dd></div>
                <div><dt>Effet recette</dt><dd><code>{commit.receipt.recipeEffect}</code></dd></div>
              </dl></details>
            </article>;
          })}
        </details> : null}
        {recipeDraftTarget && wizardDossiers.length ? renderWizardDossierHistory(wizardDossiers, 'live') : null}
        {assistedHistoryArchive && assistedHistoryArchive.ticket.workspaceId === workspace?.id
          ? <Suspense fallback={<p role="status">Ouverture de la réponse assistée archivée…</p>}>
              <AssistedAdvicePanel result={assistedHistoryArchive.record.payload.clientResult}
                question={assistedHistoryArchive.ticket.request.question}
                sourceReadingReference={assistedHistoryArchive.ticket.sourceReadingReference}
                contextCheckAtReception={assistedHistoryArchive.record.payload.contextCheckAtReception} readOnly />
            </Suspense> : null}
        {workspace?.observationProjections?.length ? <section className="hv-copy-history"><h3>Questions depuis une observation</h3>
          {workspace.observationProjections.map(observationHistoryEntry).map(row => <button key={row.id} disabled={busy} aria-pressed={historicalObservationId === row.id}
            onClick={() => setHistoricalObservationId(row.id)}>{row.label}<small>{row.role} · archive locale</small></button>)}
          {historicalObservationId ? <Suspense fallback={<p role="status">Relecture de la question figée…</p>}>
            <ObservationExplorer currentSelection={{ format: BREWING_OBSERVATION_SELECTION_VERSION, selected: null, candidates: [],
              reasons: ['Consultation historique. La note et l’état de cette question sont relus depuis leur archive.'] }}
              projectionRecords={workspace.observationProjections} selectedProjectionId={historicalObservationId} onSelectProjection={setHistoricalObservationId} />
          </Suspense> : null}
        </section> : null}
        {workspace?.scenarioPreparations?.length ? <details className="hv-details"><summary>Préparations et reprises conservées</summary>{workspace.scenarioPreparations.map(preparation => <article key={preparation.id}><strong>{preparation.intent.question || preparation.request.branches.map(branch => branch.label).join(' / ') || 'Prévision de référence'}</strong><p>{localDateTime(preparation.createdAt)} · références de préparation figées</p><button disabled={busy} onClick={() => void run(() => resumeScenario(preparation.id))}>Relire le reçu et terminer le rattachement</button><button disabled={busy} onClick={() => void run(() => resumeScenario(preparation.id, true))}>Reprendre explicitement si le calcul manque</button></article>)}</details> : null}
        {workspace?.explorationTrialPreparations?.length ? <details className="hv-details">
          <summary>Essais d’exploration composés · {workspace.explorationTrialPreparations.length}</summary>
          {workspace.explorationTrialPreparations.map((raw, index) => {
            const read = readHopV55ExplorationTrialPreparationV1(raw);
            if (read.status !== 'available') return <article key={`trial-opaque-${index}`}>
              <strong>Essai conservé · format non pris en charge</strong>
              <p>Cette archive reste en lecture seule; aucune simulation ni conversion n’est lancée.</p>
              <details className="hv-details"><summary>Référence brute</summary><pre>{JSON.stringify(raw, null, 2)}</pre></details>
            </article>;
            const preparation = read.preparation;
            const receiptRaw = workspace.explorationTrialReceipts?.find(row =>
              (row as { preparationReference?: string } | null)?.preparationReference === preparation.reference);
            const receipt = receiptRaw && readHopV55ExplorationTrialReceiptV1(receiptRaw);
            const origin = preparation.programOrigin.kind === 'physicalSource' ? 'Programme de la source archivée'
              : preparation.programOrigin.kind === 'programCopy' ? 'Copie locale de programme exacte'
                : preparation.programOrigin.kind === 'futureDraft' ? 'Brouillon futur exact' : 'Référence NR adoptée exacte';
            return <article key={preparation.reference}>
              <strong>{preparation.entry.branch.label} · {preparation.entry.preparationInput.intent.question}</strong>
              <p>{localDateTime(preparation.recordedAt)} · {receipt?.status === 'available'
                ? 'J5 et son reçu sont conservés' : 'Préparation scellée · en attente de J5'} · {origin}</p>
              <ul>{preparation.entry.preparationInput.operations.map(operation => <li key={operation.id}>{operation.label}</li>)}</ul>
              <p>J1 : {preparation.entry.preparation.status} · overrides explicites : {preparation.entry.overrides.volumeL !== undefined
                ? `${number(preparation.entry.overrides.volumeL)} L` : 'aucun volume'}{preparation.entry.overrides.yeastId
                  ? ` · ${preparation.entry.overrides.yeastId}` : ''}</p>
              {preparation.entry.profileSnapshot ? <p>Profil lié · v{preparation.entry.profileSnapshot.profile.version} · {preparation.entry.profileSnapshot.profile.reference}</p>
                : <p>Aucun profil lié à cet essai.</p>}
              {preparation.comparisonEvidence ? <p>Comparaison documentaire archivée · {preparation.comparisonEvidence.reference}</p>
                : <p>Aucune comparaison documentaire liée.</p>}
              {receipt?.status === 'invalid' || receipt?.status === 'unsupportedReadOnly' ? <p role="status">Un reçu associé est illisible ou futur; aucun repli n’est autorisé.</p> : null}
              <button disabled={busy || receipt?.status === 'invalid' || receipt?.status === 'unsupportedReadOnly'}
                onClick={() => void run(() => reopenExplorationTrial(preparation.reference), true)}>
                {receipt?.status === 'available' ? 'Relire le résultat J5 exact' : 'Reprendre cet essai exact'}
              </button>
              <details className="hv-details"><summary>Sources, branche J5 et références figées</summary>
                <p>Lecture : {preparation.readingReference ?? 'aucune archive de question liée'}</p>
                <p>Programme J1 : {preparation.programReference} · runtime {preparation.runtimeReference}</p>
                <p>Branche J5 : {preparation.j5Branch.id} · {hopAdviceContentReference('hop-v55-exploration-trial-j5-branch-v1', preparation.j5Branch)}</p>
                {preparation.programCopyRebase ? <p>Rebase de copie : {preparation.programCopyRebase.reference}</p> : null}
                {receipt?.status === 'available' ? <p>Snapshot J5 : {receipt.receipt.snapshotReference}</p> : null}
                <small>Préparation : {preparation.reference}</small>
              </details>
            </article>;
          })}
        </details> : null}
        {onConfirmScenario && displayedSnapshot ? <div className="hv-actions"><button disabled={busy} onClick={() => void run(async () => {
          const receipt = await onConfirmScenario(displayedSnapshot.result);
          if (receipt.scope !== 'serverConfirmed' || receipt.snapshotReference !== displayedSnapshot.reference) throw Error('Le reçu serveur ne confirme pas la prévision sélectionnée.');
          const receipts = workspaceRef.current?.serverScenarioReceipts ?? [];
          const prior = receipts.find(row => row.operationId === receipt.operationId);
          if (prior && (prior.reference !== receipt.reference || prior.snapshotReference !== receipt.snapshotReference || prior.committedAt !== receipt.committedAt || prior.revision !== receipt.revision)) throw Error('Le reçu serveur diffère de la confirmation déjà conservée ; l’historique local est intact.');
          if (!prior) await saveWorkspace({ serverScenarioReceipts: [...receipts, receipt] });
          setNotice('Cette prévision exacte est confirmée sur le serveur. Le journal local reste distinct.');
        })}>Confirmer cette prévision sur le serveur</button><p className="hv-muted">Action explicite ; aucune synchronisation automatique des observations ou des autres versions.</p></div> : null}
        <div className="hv-workspaces">{workspaces.filter(ws => ws.wizardOrigin === undefined).map(ws => <button key={ws.id} disabled={busy} aria-pressed={workspace?.id === ws.id} onClick={() => void run(() => openWorkspace(ws.id))}><strong>{ws.title}</strong><span>{ws.intent.question || 'Exploration sans question'} · {ws.scenarioIds.length} scénario{ws.scenarioIds.length > 1 ? 's' : ''}</span></button>)}</div>
        {workspace?.copies.length ? <div className="hv-copy-history"><h3>Copies distinctes</h3><button disabled={busy} onClick={() => void run(() => restoreCopy())}>Revenir à la recette d’origine</button>{workspace.copies.map(copy => <button key={copy.id} disabled={busy} onClick={() => void run(() => restoreCopy(copy.id))}>{copyLabel(copy)} · {localDateTime(copy.createdAt)}<small>{copy.recipe.hops.map(hop => `${hop.name} ${number(hop.weightG)}g`).join(' · ')}</small></button>)}</div> : null}
        {workspace?.programCopies?.length ? <div className="hv-copy-history"><h3>Programmes futurs locaux</h3><button disabled={busy} onClick={() => void run(() => restoreProgramCopy())}>Relire le journal source</button>{workspace.programCopies.map(copy => <button key={copy.id} disabled={busy} onClick={() => void run(() => restoreProgramCopy(copy.id))}>{copy.label} · {localDateTime(copy.createdAt)}<small>{copy.programAfter.additions.map(row => `${number(row.grams)}g · ${row.status === 'performed' ? 'effectué' : 'prévu'}`).join(' · ')}</small></button>)}</div> : null}
        {workspace?.futureDrafts?.length ? <div className="hv-copy-history"><h3>Brouillons de recette future</h3><button disabled={busy} onClick={() => void run(() => restoreFutureDraft())}>Relire l’exploration initiale</button>{workspace.futureDrafts.map(draft => <button key={draft.contentReference} disabled={busy} onClick={() => void run(() => restoreFutureDraft({ kind: 'localFutureDraft', workspaceId: workspace.id, draftId: draft.draftId, revision: draft.revision, contentReference: draft.contentReference }))}>{draft.declaredFields.name || 'Brouillon futur'} · révision {draft.revision}<small>{draft.additions.map(row => `${row.material.name} ${number(row.addition.grams)} g physiques`).join(' · ')}</small></button>)}</div> : null}
        <div className="hv-history">{records.filter(row => !workspace || workspace.scenarioIds.includes(row.dossier.scenarioId)).map(row => <article key={row.dossier.scenarioId}><h3>{row.currentSnapshot.result.branches.map(branch => branch.label).join(' / ') || 'Référence'}</h3>{row.snapshots.map(snapshot => <div key={snapshot.reference} className="hv-history-row"><span>Archive de prévision v{snapshot.result.revision} · {snapshot.result.branches.length} branche{snapshot.result.branches.length > 1 ? 's' : ''}</span><button disabled={busy} onClick={() => { displaySnapshot(row, snapshot, true); setView('decide'); setNotice('Prévision historique exacte rouverte. Aucun calcul relancé.'); }}>Relire la prévision v{snapshot.result.revision}</button><details className="hv-details"><summary>Date, sources et référence exacte</summary><p>{localDateTime(row.events.find(event => (event.kind === 'resultSaved' || event.kind === 'resultRevised') && event.payload.snapshot.reference === snapshot.reference)?.recordedAt ?? row.dossier.createdAt)}</p><small>{snapshot.reference}</small></details></div>)}<details className="hv-details"><summary>Choix et observations conservés</summary>{row.events.filter(event => event.kind !== 'resultSaved' && event.kind !== 'resultRevised').map(event => <p key={event.eventId}>{event.kind === 'branchPreferred' ? `Préférence : ${row.snapshots.find(snapshot => snapshot.reference === event.payload.snapshotReference)?.result.branches.find(branch => branch.id === event.payload.branchId)?.label ?? event.payload.branchId}` : event.kind === 'observationAppended' ? `${event.payload.observation.dimension} : ${event.payload.observation.kind === 'qualitative' ? event.payload.observation.reported : JSON.stringify(event.payload.observation.value)}` : ''}<small>{localDateTime(event.recordedAt)} · {event.kind === 'observationAppended' ? event.payload.snapshotReference : ''}</small></p>)}</details></article>)}</div>
        {!records.length && !workspaces.length && !workspace ? <p>Aucun dossier conservé. Prépare un réglage ou une question pour commencer.</p> : null}
        {workspace?.serverScenarioReceipts?.map(receipt => <p key={receipt.operationId}>Prévision confirmée au serveur · {localDateTime(receipt.committedAt)}<small>{receipt.snapshotReference}</small></p>)}
      </section> : null}
      {/* Ordinary workshop: assisted draft dossiers stay readable after the creator closed, beside the local dossier. */}
      {!recipeDraftTarget && ownerWizardDossiers.length && (view === 'beer' || view === 'history')
        ? renderWizardDossierHistory(ownerWizardDossiers, 'closed') : null}
      <section ref={referenceAreaRef} className="hv-reference-area" hidden={view === 'explore'}><Suspense fallback={<p role="status">Ouverture du journal de références…</p>}><ReferencePanel workspace={workspace} context={context!} prepared={prepared}
        getWorkspace={() => getReferenceWorkspace()} onSave={saveFullWorkspace} observationDefinitions={activeObservationDefinitions}
        observationScope={activeObservationSupport?.hopScope} /></Suspense></section>
    </main>}
  </div>;
}

/* ---------- Relations between the terms of an archived Wizard answer (history correction panel) ---------- */

/** Edge kinds the V4 ledger guard checks (propertyAdviceRecordsV4): related term, compared observation, observation partner. */
type HopV55WizardLinkViaV1 = 'related' | 'observation' | 'partner';
interface HopV55WizardTermLinkV1 { ownerId: string; targetId: string; via: HopV55WizardLinkViaV1[] }
const wizardLinkViaLabels: Record<HopV55WizardLinkViaV1, string> = {
  related: 'lien', observation: 'constat comparé', partner: 'partenaire d’observation',
};
const wizardLinkKey = (link: Pick<HopV55WizardTermLinkV1, 'ownerId' | 'targetId'>) => JSON.stringify([link.ownerId, link.targetId]);
const wizardViaText = (via: readonly HopV55WizardLinkViaV1[]) => via.map(row => wizardLinkViaLabels[row]).join(', ');
function wizardTermLabel(terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>, id: string, withRole = false): string {
  const term = terms.get(id);
  return term ? `« ${term.label} »${withRole ? ` (${term.role})` : ''}` : 'un terme absent de cette version';
}
/** Outgoing edges of one projection, exactly those the ledger guard checks; an observation partner counts inside the ledger only. */
function wizardIntentLinks(intent: HopPropertyAdviceIntentV3, termIds: ReadonlySet<string>): HopV55WizardTermLinkV1[] {
  const byTarget = new Map<string, HopV55WizardLinkViaV1[]>();
  const note = (targetId: string, via: HopV55WizardLinkViaV1) => {
    const rows = byTarget.get(targetId) ?? [];
    if (!rows.includes(via)) rows.push(via);
    byTarget.set(targetId, rows);
  };
  intent.relatedIntentIds.forEach(id => note(id, 'related'));
  intent.investigation?.observationIntentIds.forEach(id => note(id, 'observation'));
  if (intent.partner?.kind === 'observation' && termIds.has(intent.partner.id)) note(intent.partner.id, 'partner');
  return [...byTarget].map(([targetId, via]) => ({ ownerId: intent.id, targetId, via }));
}
/** Active edges of one exact version. */
function wizardRecordLinks(terms: readonly HopV55WizardAnswerTermV1[]): HopV55WizardTermLinkV1[] {
  const ids = new Set(terms.map(term => term.id));
  return terms.filter(term => term.active).flatMap(term => wizardIntentLinks(term.lastActive, ids));
}
/** What one explicit unlink changes on its owner beyond the link itself, read on the owner's projection being corrected. */
interface HopV55WizardUnlinkEffectV1 { comparison?: 'narrowed' | 'removed'; remaining: string[]; partner: boolean }
function wizardUnlinkEffect(owner: HopPropertyAdviceIntentV3, targetId: string): HopV55WizardUnlinkEffectV1 {
  const compared = owner.investigation?.observationIntentIds ?? [];
  const remaining = compared.filter(id => id !== targetId);
  return { remaining, partner: owner.partner?.kind === 'observation' && owner.partner.id === targetId,
    ...(compared.includes(targetId) ? { comparison: remaining.length ? 'narrowed' as const : 'removed' as const } : {}) };
}
/**
 * Explicit unlink of one target from its owner: the related ID and the compared observation are filtered and an observation
 * partner on that target is dropped; every other field and link of the owner is kept. When the target was the last compared
 * observation, the compensation comparison goes with it: Request3 refuses an investigation without observation
 * (propertyAdviceSchema, Investigation.observationIntentIds non vide) and the question stays open without comparison, as the
 * compensation fix « Garder une question ouverte, sans comparaison » leaves it. This differs on purpose from unlinkV4, which
 * keeps an empty list; no observation and no default value is invented, and the consequence is shown before the gesture.
 */
function wizardUnlinkedIntent(owner: HopPropertyAdviceIntentV3, targetId: string): HopPropertyAdviceIntentV3 {
  const { investigation, partner, ...rest } = owner;
  const effect = wizardUnlinkEffect(owner, targetId);
  return {
    ...rest,
    relatedIntentIds: owner.relatedIntentIds.filter(id => id !== targetId),
    ...(investigation && effect.comparison !== 'removed' ? { investigation: { ...investigation, observationIntentIds: effect.remaining } } : {}),
    ...(partner && !effect.partner ? { partner } : {}),
  };
}
/** Consequence of one unlink, in labels: before the gesture, then as applied; undefined when only the link itself goes. */
function wizardUnlinkEffectText(effect: HopV55WizardUnlinkEffectV1, terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>,
  link: Pick<HopV55WizardTermLinkV1, 'ownerId' | 'targetId'>, applied: boolean): string | undefined {
  const owner = wizardTermLabel(terms, link.ownerId), target = wizardTermLabel(terms, link.targetId);
  const parts = [
    ...(effect.comparison === 'removed' ? [`la comparaison de compensation de ${owner} est retirée, car ${target} en est le dernier constat comparé; ${owner} reste retenu comme question ouverte, sans comparaison`] : []),
    ...(effect.comparison === 'narrowed' ? [`la comparaison de compensation de ${owner} est conservée avec ${effect.remaining.map(id => wizardTermLabel(terms, id)).join(', ')}`] : []),
    ...(effect.partner ? [`le partenaire d’observation ${target} de ${owner} est retiré`] : []),
  ];
  return parts.length ? `${applied ? 'Conséquence de ce déliement' : 'Conséquence si tu délies'} : ${parts.join('; ')}.` : undefined;
}
/** True when a term kept on both sides changed its edges (an explicit unlink). */
function wizardRelinked(before: HopV55WizardAnswerTermV1 | undefined, after: HopV55WizardAnswerTermV1, termIds: ReadonlySet<string>): boolean {
  return !!before?.active && after.active
    && JSON.stringify(wizardIntentLinks(before.lastActive, termIds)) !== JSON.stringify(wizardIntentLinks(after.lastActive, termIds));
}
interface HopV55WizardCorrectionRelationV1 extends HopV55WizardTermLinkV1 {
  ownerActive: boolean; unlinked: boolean; blocking: boolean;
  /** Effect of unlinking this target, on the owner's projection with its other unlinks already applied. */
  effect: HopV55WizardUnlinkEffectV1;
}
interface HopV55WizardCorrectionDraftV1 {
  relations: HopV55WizardCorrectionRelationV1[];
  exclusionBlocks: Array<{ exclusion: HopV55PropertyAdviceAnswerRecordV4ForWizardV1['readingContext']['exclusions'][number]; targetId: string }>;
  blockingCount: number;
  hasChange: boolean;
  actions(motive: string): HopV55PropertyAdviceLedgerActionV4[];
}
/**
 * The brewer's explicit choices on one exact version: terms set aside or restored, owners unlinked from a target. Every edge
 * of an owner kept or being restored is listed; one toward a term set aside blocks until the brewer unlinks it, sets the
 * owner aside too or keeps the target. Nothing is removed on the brewer's behalf and nothing is applied before the save.
 */
function wizardCorrectionDraft(input: { head: HopV55PropertyAdviceAnswerRecordV4ForWizardV1; terms: readonly HopV55WizardAnswerTermV1[];
  selected: readonly string[]; unlinks: Readonly<Record<string, readonly string[]>> }): HopV55WizardCorrectionDraftV1 {
  const { terms, selected, unlinks } = input;
  const byId = new Map(terms.map(term => [term.id, term]));
  const termIds = new Set(byId.keys());
  const activeAfter = (id: string) => { const term = byId.get(id); return !!term && (selected.includes(id) ? !term.active : term.active); };
  const projection = (term: HopV55WizardAnswerTermV1, except?: string) => (unlinks[term.id] ?? []).filter(id => id !== except)
    .reduce((intent, targetId) => wizardUnlinkedIntent(intent, targetId), structuredClone(term.lastActive));
  const relations = terms.filter(term => term.active || selected.includes(term.id))
    .flatMap(term => wizardIntentLinks(term.lastActive, termIds).map(link => {
      const ownerActive = activeAfter(term.id);
      const unlinked = (unlinks[term.id] ?? []).includes(link.targetId);
      return { ...link, ownerActive, unlinked, blocking: ownerActive && !unlinked && !activeAfter(link.targetId),
        effect: wizardUnlinkEffect(projection(term, link.targetId), link.targetId) };
    }));
  const exclusionBlocks = input.head.readingContext.exclusions.flatMap(exclusion => exclusion.intentIds
    .filter(id => !activeAfter(id)).map(targetId => ({ exclusion, targetId })));
  return {
    relations, exclusionBlocks,
    blockingCount: relations.filter(link => link.blocking).length + exclusionBlocks.length,
    hasChange: selected.length > 0 || terms.some(term => term.active && !!unlinks[term.id]?.length),
    actions: motive => terms.flatMap((term): HopV55PropertyAdviceLedgerActionV4[] => {
      if (selected.includes(term.id)) return [term.active ? { kind: 'reject', annotationId: term.id, reason: motive }
        : { kind: 'restore', annotationId: term.id, reason: motive, activeIntent: { ...projection(term), interpretationOrigin: 'user' } }];
      return term.active && unlinks[term.id]?.length ? [{ kind: 'revise', annotationId: term.id, reason: motive,
        activeIntent: { ...projection(term), interpretationOrigin: 'user' } }] : [];
    }),
  };
}
function wizardCorrectionBlockedText(draft: HopV55WizardCorrectionDraftV1, terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>): string {
  const reasons = [...draft.relations.filter(link => link.blocking).map(link =>
    `${wizardTermLabel(terms, link.ownerId)} reste relié à ${wizardTermLabel(terms, link.targetId)} (${wizardViaText(link.via)})`),
  ...draft.exclusionBlocks.map(row => `une exclusion de la lecture cite ${wizardTermLabel(terms, row.targetId)}`)];
  return `Aperçu non préparé : ${reasons.join(' ; ')}. Choisis pour chaque lien ci-dessus; rien n’est retiré à ta place et rien n’est enregistré.`;
}
interface HopV55WizardCorrectionErrorV1 { text: string; detail?: string }
/** Graph refusals of the ledger guard; their raw identifiers stay in the exact diagnostic, labels are shown first. */
const wizardGraphRefusals: Array<{ pattern: RegExp; via: HopV55WizardLinkViaV1 }> = [
  { pattern: /^Lien actif (.+) vers une annotation rejetée ou absente \((.+)\)\.$/u, via: 'related' },
  { pattern: /^Compensation active (.+) vers un constat rejeté ou absent \((.+)\)\.$/u, via: 'observation' },
  { pattern: /^Partenaire observation actif (.+) vers une annotation rejetée \((.+)\)\.$/u, via: 'partner' },
];
/** Readable graph refusal; any other reason (actor, future format, freshness, CAS) is kept exactly as written. */
function wizardCorrectionError(message: string, terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>): HopV55WizardCorrectionErrorV1 {
  for (const { pattern, via } of wizardGraphRefusals) {
    const match = pattern.exec(message);
    if (match) {
      const owner = wizardTermLabel(terms, match[1]), target = wizardTermLabel(terms, match[2]);
      return { detail: message, text: `Aperçu refusé : ${owner} reste relié à ${target} (${wizardLinkViaLabels[via]}), qui serait écarté. Délie ce lien, écarte aussi ${owner} ou garde ${target}. Rien n’est enregistré.` };
    }
  }
  if (message.startsWith('Une exclusion cite une annotation écartée')) {
    return { detail: message, text: 'Aperçu refusé : une exclusion de la lecture cite un terme que tu écartes; cette correction ne modifie pas les exclusions. Garde ce terme. Rien n’est enregistré.' };
  }
  return { text: message };
}
interface HopV55WizardLinkRowV1 { link: HopV55WizardTermLinkV1; before: boolean; after: boolean; ownerKept: boolean }
/** Edges before and after a previewed correction, read from the two sealed versions. */
function wizardLinkRows(before: readonly HopV55WizardAnswerTermV1[], after: readonly HopV55WizardAnswerTermV1[]): HopV55WizardLinkRowV1[] {
  const linksBefore = wizardRecordLinks(before), linksAfter = wizardRecordLinks(after);
  const beforeKeys = new Set(linksBefore.map(wizardLinkKey)), afterKeys = new Set(linksAfter.map(wizardLinkKey));
  return [...new Map([...linksBefore, ...linksAfter].map(link => [wizardLinkKey(link), link])).values()].map(link => ({
    link, before: beforeKeys.has(wizardLinkKey(link)), after: afterKeys.has(wizardLinkKey(link)),
    ownerKept: !!after.find(term => term.id === link.ownerId)?.active,
  }));
}
/** Relations of the version being corrected, with the explicit fixes the brewer may choose. */
function HopV55WizardCorrectionRelationsV1({ terms, draft, disabled, statusRef, onChoose, onUnlink }: {
  terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>;
  draft: HopV55WizardCorrectionDraftV1;
  disabled: boolean;
  statusRef: React.Ref<HTMLParagraphElement>;
  /** Selects or clears a term (set aside or restore) from a relation fix. */
  onChoose(id: string, chosen: boolean): void;
  onUnlink(ownerId: string, targetId: string, unlinked: boolean): void;
}) {
  if (!draft.relations.length && !draft.exclusionBlocks.length) return null;
  const label = (id: string) => wizardTermLabel(terms, id);
  const named = (id: string) => wizardTermLabel(terms, id, true);
  return <fieldset disabled={disabled} data-testid="wizard-answer-correction-relations">
    <legend>Liens entre les termes</legend>
    <p ref={statusRef} tabIndex={-1} role="status">{draft.blockingCount
      ? `À résoudre avant l’aperçu · ${draft.blockingCount}` : 'Aucun lien à résoudre pour cette correction.'}</p>
    <p className="hv-muted">Une correction garde ces liens tels quels. Pour écarter un terme visé, délie-le explicitement, écarte aussi le terme qui s’y rapporte ou garde-le : rien n’est retiré à ta place. Ce qu’un déliement retire en plus est indiqué avant ton geste.</p>
    <ul>
      {draft.relations.map((link, index) => {
        const owner = terms.get(link.ownerId), target = terms.get(link.targetId);
        // The consequence is named before the gesture and stays shown once applied; the button keeps its name.
        const effect = link.ownerActive ? wizardUnlinkEffectText(link.effect, terms, link, link.unlinked) : undefined;
        const effectId = `hv-wizard-unlink-effect-${index}`;
        return <li key={wizardLinkKey(link)}>
          <span>{named(link.ownerId)} → {named(link.targetId)} · {wizardViaText(link.via)}</span>
          <small>{!link.ownerActive ? `retiré avec ${label(link.ownerId)} écarté` : link.unlinked ? 'délié dans cette correction'
            : link.blocking ? `à résoudre : ${label(link.ownerId)} reste relié à ${label(link.targetId)}, ${target?.active ? 'que tu écartes' : 'déjà écarté'}`
              : 'actif'}</small>
          {effect ? <p id={effectId} className="hv-muted">{effect}</p> : null}
          {link.ownerActive ? <div className="hv-actions">
            <button type="button" aria-describedby={effect ? effectId : undefined}
              onClick={() => onUnlink(link.ownerId, link.targetId, !link.unlinked)}>{link.unlinked
              ? `Rétablir le lien de ${label(link.ownerId)} vers ${label(link.targetId)}` : `Délier ${label(link.targetId)} de ${label(link.ownerId)}`}</button>
            {link.blocking && owner ? <button type="button" onClick={() => onChoose(owner.id, owner.active)}>{owner.active
              ? `Écarter aussi ${label(owner.id)}` : `Ne pas restaurer ${label(owner.id)}`}</button> : null}
            {link.blocking && target ? <button type="button" onClick={() => onChoose(target.id, !target.active)}>{target.active
              ? `Ne pas écarter ${label(target.id)}` : `Restaurer aussi ${label(target.id)}`}</button> : null}
          </div> : null}
        </li>;
      })}
      {draft.exclusionBlocks.map(({ exclusion, targetId }) => {
        const target = terms.get(targetId);
        return <li key={`exclusion:${exclusion.id}:${targetId}`}>
          <span>Une exclusion de la lecture cite {named(targetId)}.</span>
          <small>à résoudre : cette correction ne modifie pas les exclusions; garde ce terme. Motif de l’exclusion : {exclusion.reason}</small>
          {target ? <div className="hv-actions"><button type="button" onClick={() => onChoose(target.id, !target.active)}>{target.active
            ? `Ne pas écarter ${label(target.id)}` : `Restaurer aussi ${label(target.id)}`}</button></div> : null}
        </li>;
      })}
    </ul>
  </fieldset>;
}
/** Edges before and after the previewed correction, as an aligned table beside the terms table. */
function HopV55WizardLinkComparisonV1({ rows, terms }: { rows: readonly HopV55WizardLinkRowV1[]; terms: ReadonlyMap<string, HopV55WizardAnswerTermV1> }) {
  if (!rows.length) return null;
  const label = (id: string) => wizardTermLabel(terms, id);
  return <table style={wizardCompareTable}>
    <caption style={wizardCompareCaption}>Liens avant et après</caption>
    <thead><tr><th scope="col" style={wizardCompareHead}>Lien</th><th scope="col" style={wizardCompareHead}>Version actuelle</th>
      <th scope="col" style={wizardCompareHead}>Version corrigée</th></tr></thead>
    <tbody>{rows.map(row => <tr key={wizardLinkKey(row.link)}>
      <th scope="row" style={wizardCompareRow}>{label(row.link.ownerId)} → {label(row.link.targetId)} · {wizardViaText(row.link.via)}</th>
      <td style={wizardCompareCell}>{row.before ? 'actif' : 'absent'}</td>
      <td style={row.before !== row.after ? { ...wizardCompareCell, fontWeight: 600 } : wizardCompareCell}>{row.after
        ? row.before ? 'actif' : 'actif · rétabli' : row.ownerKept ? 'retiré · délié' : `retiré · ${label(row.link.ownerId)} écarté`}</td>
    </tr>)}</tbody>
  </table>;
}
interface HopV55WizardEffectRowV1 { ownerId: string; aspect: 'comparison' | 'partner'; before: HopPropertyAdviceIntentV3; after: HopPropertyAdviceIntentV3 }
/** Compensation comparison and observation partner of each term kept on both sides, when the correction changed them. */
function wizardEffectRows(before: readonly HopV55WizardAnswerTermV1[], after: readonly HopV55WizardAnswerTermV1[]): HopV55WizardEffectRowV1[] {
  const prior = new Map(before.map(term => [term.id, term]));
  return after.flatMap(term => {
    const was = prior.get(term.id);
    if (!was?.active || !term.active) return [];
    const changed = (field: 'investigation' | 'partner') => JSON.stringify(was.lastActive[field]) !== JSON.stringify(term.lastActive[field]);
    return [...(changed('investigation') ? ['comparison' as const] : []), ...(changed('partner') ? ['partner' as const] : [])]
      .map(aspect => ({ ownerId: term.id, aspect, before: was.lastActive, after: term.lastActive }));
  });
}
function wizardComparisonText(intent: HopPropertyAdviceIntentV3, terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>): string {
  const ids = intent.investigation?.observationIntentIds;
  return !ids ? 'aucune' : ids.length ? `avec ${ids.map(id => wizardTermLabel(terms, id)).join(', ')}` : 'sans constat comparé';
}
/** An observation partner outside this answer is named as such, never by its raw identifier. */
function wizardPartnerText(intent: HopPropertyAdviceIntentV3, terms: ReadonlyMap<string, HopV55WizardAnswerTermV1>): string {
  const partner = intent.partner;
  if (!partner) return 'aucun';
  return partner.kind !== 'observation' ? 'autre partenaire' : terms.has(partner.id) ? wizardTermLabel(terms, partner.id) : 'observation hors de cette réponse';
}
/** Effects of the unlinks on the terms kept, before and after the previewed correction. */
function HopV55WizardEffectComparisonV1({ before, after, terms }: { before: readonly HopV55WizardAnswerTermV1[];
  after: readonly HopV55WizardAnswerTermV1[]; terms: ReadonlyMap<string, HopV55WizardAnswerTermV1> }) {
  const rows = wizardEffectRows(before, after);
  if (!rows.length) return null;
  return <table style={wizardCompareTable}>
    <caption style={wizardCompareCaption}>Comparaisons et partenaires avant et après</caption>
    <thead><tr><th scope="col" style={wizardCompareHead}>Terme retenu</th><th scope="col" style={wizardCompareHead}>Version actuelle</th>
      <th scope="col" style={wizardCompareHead}>Version corrigée</th></tr></thead>
    <tbody>{rows.map(row => <tr key={JSON.stringify([row.ownerId, row.aspect])}>
      <th scope="row" style={wizardCompareRow}>{wizardTermLabel(terms, row.ownerId)} · {row.aspect === 'comparison'
        ? 'comparaison de compensation' : 'partenaire d’observation'}</th>
      <td style={wizardCompareCell}>{row.aspect === 'comparison' ? wizardComparisonText(row.before, terms) : wizardPartnerText(row.before, terms)}</td>
      <td style={{ ...wizardCompareCell, fontWeight: 600 }}>{row.aspect === 'comparison'
        ? row.after.investigation ? wizardComparisonText(row.after, terms) : 'retirée · question ouverte sans comparaison'
        : row.after.partner ? wizardPartnerText(row.after, terms) : 'retiré'}</td>
    </tr>)}</tbody>
  </table>;
}

function Biology({ result, selectedBranchId }: { result: BrewingScenarioResult; selectedBranchId?: string }) {
  const branch = [result.baseline, ...result.branches].find(row => row.id === selectedBranchId) ?? result.branches[0] ?? result.baseline;
  return <details className="hv-details"><summary>Levure propre, transformation et transfert</summary>
    <p>L’expression fermentaire propre, la transformation des précurseurs et l’extraction ou la rétention portent des informations différentes.</p>
    {branch.yeastBaselineModel ? <div><h3>Expression propre de la levure · modèle</h3><p className="hv-muted">Projection du modèle sans houblon, distincte d’une mesure du brassin.</p><div className="hv-bio-grid">{Object.entries(branch.yeastBaselineModel.overall.profile).map(([id, estimate]) => <span key={id}>{id} · {estimate.range ? `${number(estimate.range.min)}–${number(estimate.range.max)}` : 'Inconnu'}</span>)}</div></div> : <p>Expression fermentaire propre non quantifiée dans cette projection.</p>}
    {branch.biologicalContributions.map(row => <div key={row.id}><h3>{row.kind === 'yeastOwnProducts' ? 'Produit propre de la levure' : row.kind === 'hopPrecursorTransformation' ? 'Transformation de précurseur' : 'Extraction et rétention'}</h3><p>{row.value ? `${row.value.analyte} · ${number(row.value.range.min)}–${number(row.value.range.max)} ${row.value.unit} · ${row.status}` : 'Quantité inconnue'} · {row.value?.basis ?? ''}</p>{row.conditions.map((line, index) => <p key={index}>{line}</p>)}{row.limitations.map((line, index) => <small key={index}>{line}</small>)}</div>)}
    {!branch.biologicalContributions.length ? <p>Les quantités chimiques restent inconnues ; aucune conversion universelle n’est ajoutée au profil.</p> : null}
    {(branch.biologicalAssessment?.findings ?? []).map(finding => <article key={finding.id}><h3>{finding.title}</h3><p>{finding.statement}</p><p>{finding.statusMeaning}</p>{finding.unknownsThatCouldChangeDecision.map((line, index) => <small key={index}>{line}</small>)}</article>)}
  </details>;
}

/** What the comparator slot of a J5 snapshot shows, derived from immutable identities only. */
export interface HopV55ReferenceComparisonBasis {
  mode: 'none' | 'archive' | 'current';
  snapshotReference?: string;
  referenceContentReference?: string;
  nuanceStudyId?: string;
}

export function hopV55ReferenceComparisonBasis(input: {
  record: BrewingScenarioRecordRead | null | undefined;
  displayedSnapshot: BrewingScenarioSnapshotV1 | null | undefined;
  workspace: HopV55Workspace | null | undefined;
  adoptedReference: BrewingReferenceIdentityV1 | null | undefined;
  displayingArchive: boolean;
  compareArchiveToCurrentReference: boolean;
}): HopV55ReferenceComparisonBasis {
  const { record, displayedSnapshot, workspace } = input;
  if (!record || !displayedSnapshot || !workspace?.referenceJournal) return { mode: 'none' };
  if (input.displayingArchive && !input.compareArchiveToCurrentReference) return { mode: 'archive', snapshotReference: displayedSnapshot.reference };
  if (!input.adoptedReference) return { mode: 'none' };
  const study = [...(workspace.nuanceStudies ?? [])].reverse().find(row => row.snapshotReference === displayedSnapshot.reference);
  return { mode: 'current', snapshotReference: displayedSnapshot.reference,
    referenceContentReference: input.adoptedReference.contentReference, ...(study ? { nuanceStudyId: study.id } : {}) };
}

/** A DTO is shown only for its own snapshot, adopted reference and fine study. A selection change alone keeps it valid:
 * its candidates, definitions and values do not depend on the selection, which the slot applies live. */
export function hopV55ReferenceComparisonMatchesBasis(dto: HopV55ReferenceComparisonDTO, basis: HopV55ReferenceComparisonBasis): boolean {
  if (basis.mode === 'none' || dto.source.snapshotReference !== basis.snapshotReference) return false;
  if (basis.mode === 'archive') return true;
  return dto.reference.contentReference === basis.referenceContentReference && dto.archive.nuanceStudy?.id === basis.nuanceStudyId;
}

/** Comparison archived for a historical snapshot, read exactly as stored; nothing is rebuilt. */
export function archivedHopV55ReferenceComparison(workspace: HopV55Workspace, snapshot: BrewingScenarioSnapshotV1): HopV55ReferenceComparisonDTO | undefined {
  const rows = workspace.referenceComparisons ?? [];
  const originalPreparation = workspace.scenarioPreparations?.find(row => row.scenarioId === snapshot.result.scenarioId && row.request.revision === snapshot.result.revision);
  const originalReference = originalPreparation ? originalPreparation.reference : getHopV55ReferenceProjection(workspace)?.j5ResultLinks.find(row => row.result.snapshotReference === snapshot.reference)?.reference;
  const stored = originalPreparation && !originalReference ? undefined : rows.find(row => row.source.snapshotReference === snapshot.reference &&
    (!originalReference || row.reference.contentReference === originalReference.contentReference));
  const read = stored && readHopV55ReferenceComparison(stored);
  return read?.status === 'available' ? read.dto : undefined;
}

/**
 * Builds and archives the comparison to the current adopted reference for the live selection. The archive policy is
 * unchanged: each new selection appends its immutable DTO. While it is being archived, the previous DTO of the same
 * basis stays displayed (`pending`); a basis change is never served from an older DTO.
 */
export function useHopV55ReferenceComparisonSync(input: {
  services: Pick<HopV55Services, 'ownerKey' | 'workspaces'>;
  workspace: HopV55Workspace | null | undefined;
  record: BrewingScenarioRecordRead | null | undefined;
  displayedSnapshot: BrewingScenarioSnapshotV1 | null | undefined;
  adoptedReference: BrewingReferenceIdentityV1 | null | undefined;
  basis: HopV55ReferenceComparisonBasis;
  branchIds: string[];
  axisIds: string[];
  selectedBranchId?: string;
  setReferenceComparison(value: HopV55ReferenceComparisonDTO | undefined): void;
  setPending(value: boolean): void;
  setError(value: string): void;
  onWorkspaceSaved(saved: HopV55Workspace): void;
}): void {
  const { services, workspace, record, displayedSnapshot, adoptedReference, basis, branchIds, axisIds, selectedBranchId,
    setReferenceComparison, setPending, setError, onWorkspaceSaved } = input;
  useEffect(() => {
    let cancelled = false;
    setError('');
    if (basis.mode === 'none' || !workspace || !record || !displayedSnapshot) { setPending(false); setReferenceComparison(undefined); return; }
    if (basis.mode === 'archive') { setPending(false); setReferenceComparison(archivedHopV55ReferenceComparison(workspace, displayedSnapshot)); return; }
    if (!adoptedReference || !workspace.referenceJournal) { setPending(false); setReferenceComparison(undefined); return; }
    const rows = workspace.referenceComparisons ?? [];
    const currentSnapshot = displayedSnapshot;
    const reference = structuredClone(adoptedReference);
    const journal = workspace.referenceJournal;
    setPending(true);
    const finish = (dto: HopV55ReferenceComparisonDTO) => { if (!cancelled) { setReferenceComparison(dto); setPending(false); } };
    void (async () => {
      const study = [...(workspace.nuanceStudies ?? [])].reverse().find(row => row.snapshotReference === currentSnapshot.reference);
      const dto = createHopV55ReferenceComparison({ scenarioRecord: record, snapshotReference: currentSnapshot.reference,
        referenceJournal: journal, adoptedReference: reference,
        selection: { candidateIds: branchIds, dimensionIds: axisIds, ...(selectedBranchId ? { preferredCandidateId: selectedBranchId } : {}) },
        ...(study ? { nuanceStudy: study } : {}) });
      const found = rows.find(row => row.contentReference === dto.contentReference);
      if (found) { finish(found); return; }
      for (let attempt = 0; attempt < 3; attempt++) {
        if (cancelled) return;
        const latest = await services.workspaces.read(services.ownerKey, workspace.id);
        if (!latest) throw Error('Le dossier de comparaison n’est plus disponible.');
        const currentReference = getHopV55ReferenceProjection(latest)?.currentReference;
        if (currentReference?.contentReference !== reference.contentReference) {
          throw Error('La référence adoptée a changé pendant la préparation de cette comparaison ; rien n’a été conservé pour cette sélection.');
        }
        const existing = latest.referenceComparisons?.find(row => row.contentReference === dto.contentReference);
        if (existing) { finish(existing); return; }
        try {
          const saved = await services.workspaces.save({ ...latest, referenceComparisons: [...(latest.referenceComparisons ?? []), dto], updatedAt: iso() }, latest.revision);
          if (!cancelled) { onWorkspaceSaved(saved); finish(dto); }
          return;
        } catch (err) { if ((err as { code?: string }).code !== 'staleRevision' || attempt === 2) throw err; }
      }
    })().catch(err => { if (!cancelled) { setError((err as Error).message); setPending(false); } });
    return () => { cancelled = true; };
  }, [record?.dossier.reference, displayedSnapshot?.reference, adoptedReference?.contentReference, basis.mode,
    branchIds.join('|'), axisIds.join('|'), selectedBranchId, workspace?.nuanceStudies?.length]);
}

export interface HopV55ReferenceComparisonSlotProps {
  basis: HopV55ReferenceComparisonBasis;
  /** Archived DTO, or the last DTO built for the current reference; checked against the basis before display. */
  comparison: HopV55ReferenceComparisonDTO | undefined;
  pending: boolean;
  error: string;
  result: BrewingScenarioResult;
  branchIds: string[];
  axisIds: string[];
  showReferenceSeries: boolean;
  selectableCandidateIds: string[];
  mode: 'bars' | 'radar';
  onModeChange(mode: 'bars' | 'radar'): void;
  onToggleCandidate(id: string): void;
  onToggleAxis(id: string): void;
  onChooseCandidate?(id: string): void;
  selectedCandidateId?: string;
  renderJ5(): React.ReactNode;
}

/**
 * One stable place for the comparator: the reference comparison stays mounted across selection changes, so the
 * toggled control keeps the keyboard focus. Without a DTO of the current basis, an explicit loading or error state is
 * shown; the J5 comparator appears only without reference, for an archive without stored comparison, or after an error.
 */
export function HopV55ReferenceComparisonSlot(props: HopV55ReferenceComparisonSlotProps) {
  const { basis, comparison, result } = props;
  const shown = comparison && hopV55ReferenceComparisonMatchesBasis(comparison, basis) ? comparison : undefined;
  if (basis.mode === 'none' || basis.mode === 'archive' && !shown) return <>{props.renderJ5()}</>;
  if (!shown) {
    return props.error
      ? <><p className="hv-muted" data-reference-comparison-state="error">La comparaison à la référence adoptée n’a pas pu être préparée ; seuls les profils J5 de cette prévision sont affichés ci-dessous.</p>{props.renderJ5()}</>
      : <section className="hv-reference-comparison" data-reference-comparison-state="loading" aria-busy="true">
        <p aria-live="polite">Préparation de la comparaison à la référence adoptée…</p>
      </section>;
  }
  const historical = basis.mode === 'archive';
  const dimensionIds = historical ? shown.selection.dimensionReferenceIds
    : shown.comparison.dimensions.filter(row => props.axisIds.includes(row.definition.dimension.id)).map(row => row.referenceGroupId);
  return <section className="hv-reference-comparison" data-reference-comparison-state={props.pending ? 'updating' : 'ready'} aria-busy={props.pending || undefined}>
    <p><strong>{historical ? 'Comparaison historique conservée' : 'Comparaison à la référence adoptée'}</strong> · v{shown.reference.version}</p>
    <p className="hv-muted">Les candidats, opérations et quantités restent ceux de la prévision conservée. La référence de comparaison est une série distincte.</p>
    <p className="hv-muted" aria-live="polite">{props.pending ? 'Nouvelle sélection en cours d’enregistrement ; les valeurs affichées restent celles de cette prévision et de cette référence.' : null}</p>
    <Suspense fallback={<p role="status">Ouverture du comparateur de référence…</p>}><SensoryComparison comparison={shown.comparison} result={result}
      candidateIds={[...props.branchIds, ...(props.showReferenceSeries ? [HOP_V55_ADOPTED_REFERENCE_CANDIDATE_ID] : [])]}
      dimensionIds={dimensionIds} mode={props.mode} onModeChange={props.onModeChange}
      selectableCandidateIds={props.selectableCandidateIds}
      onToggleCandidate={props.onToggleCandidate}
      onToggleDimension={groupId => { const id = shown.comparison.dimensions.find(row => row.referenceGroupId === groupId)?.definition.dimension.id; if (id) props.onToggleAxis(id); }}
      onChooseCandidate={props.onChooseCandidate} selectedCandidateId={props.selectedCandidateId} /></Suspense>
    <details className="hv-details"><summary>Programmes et sources de cette comparaison</summary>{shown.series.filter(row => row.role !== 'adoptedReference').map(row => <article key={row.candidateId}><strong>{row.label}</strong><ul>{row.program?.additions.map(addition => <li key={addition.id}>{number(addition.grams)} g physiques · {hopV55Uses.find(use => use.value === addition.use)?.label ?? addition.use} · {addition.status === 'performed' ? 'Effectué' : 'Prévu'}</li>)}</ul></article>)}<small>{shown.contentReference}</small></details>
  </section>;
}
