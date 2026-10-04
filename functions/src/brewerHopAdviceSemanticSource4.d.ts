/**
 * Serialized TypeScript boundary for an exact bundled source4 bridge.
 * Runtime readers and builders come only from the frozen public modules via
 * scripts/build-brewerHopAdviceSemanticSource4.mjs; this declaration validates nothing.
 */
export type HopV55SemanticSenseV1 = 'qualitativeTarget' | 'directedChange' | 'guard' | 'exclusion'
  | 'reportedObservation' | 'investigation' | 'nonDecision' | 'mention';
export declare const HOP_V55_SEMANTIC_SENSE_RULES: Record<HopV55SemanticSenseV1, {
  requirement: readonly ('required' | 'optional')[];
  directions: ReadonlyArray<'increase' | 'decrease' | 'keep' | 'exclude' | 'investigate' | null>;
}>;
export declare const HOP_V55_SEMANTIC_QUALIFIER_SENSES: readonly HopV55SemanticSenseV1[];

export interface HopV55SemanticSpanV1 { start: number; end: number; text: string }

export type HopV55SemanticLexiconV1 =
  | { status: 'lexicon'; key?: string }
  | { status: 'proposedAlias'; canonicalTerm: string; key?: string }
  | { status: 'outOfLexicon' | 'notAProperty' };

export interface HopV55SemanticAnnotationV1 {
  id: string;
  sense: HopV55SemanticSenseV1;
  source: HopV55SemanticSpanV1;
  term: string;
  requirement: 'required' | 'optional';
  direction: 'increase' | 'decrease' | 'keep' | 'exclude' | 'investigate' | null;
  qualification?: string;
  qualifierSource?: HopV55SemanticSpanV1;
  note?: string;
  primitiveConvention?: 'targetAsIncrease' | 'targetAsInvestigation';
  frameSource?: HopV55SemanticSpanV1;
  guard?: 'preserve' | 'noIncrease' | 'noDecrease';
  inquiry?: 'question' | 'compensation' | 'characterization';
  mentionKind?: 'partnerPreference' | 'contextNote';
  subject?: { kind: 'beer' | 'material' | 'unspecified'; source?: HopV55SemanticSpanV1 };
  instrumentSource?: HopV55SemanticSpanV1;
  familyId?: string;
  dimension?: string;
  reportedProblem?: string;
  lexicon: HopV55SemanticLexiconV1;
  partner?: { kind: 'freeContext'; text: string };
  relatedAnnotationIds: string[];
  origin: 'parser' | 'brasseur';
  [key: string]: unknown;
}

export interface HopV55SemanticQuestionReadingV1 {
  format: 'hop-v55-question-semantic-reading-v1';
  intent: { question: string; criteria: unknown[] };
  annotations: HopV55SemanticAnnotationV1[];
  operationDrafts?: unknown[];
  projectionCoverage: { version: 'hop-v55-semantic-projection-coverage-v1'; included: string[]; notProjected: unknown[] };
  correction?: unknown;
  interpretation: string;
  response?: unknown;
  branches: unknown[];
  unresolved: string[];
  [key: string]: unknown;
}

export type HopV55DecisionReadingSource =
  | { kind: 'recipe'; id: string }
  | { kind: 'batch'; id: string }
  | { kind: 'exploration' }
  | { kind: 'localRecipeCopy'; workspaceId: string; copyId: string; recipeId: string; recipeReference: string }
  | { kind: 'localFutureDraft'; workspaceId: string; draftId: string; revision: number; contentReference: string };

export interface HopV55DecisionReadingArchiveV4 {
  format: 'hop-v55-decision-reading-v4';
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  reading: HopV55SemanticQuestionReadingV1;
  source: HopV55DecisionReadingSource;
  runtimeReference: string;
  scopeLedger?: unknown;
  transition?: unknown;
  lineage?: unknown;
  programPreparation?: unknown;
  contentReference: string;
  [key: string]: unknown;
}

export type HopV55DecisionReadingArchive = HopV55DecisionReadingArchiveV4 | { format: string; [key: string]: unknown };
export type HopV55DecisionReadingRead =
  | { status: 'available'; archive: HopV55DecisionReadingArchive }
  | { status: 'unsupportedFormat'; format: string; raw: unknown }
  | { status: 'invalidRecord'; reason: string };

export interface HopV55SemanticQuestionReadingCorrectionV1 { [key: string]: unknown }
export interface HopV55QuestionScopeLedgerV1 { [key: string]: unknown }
export interface HopV55QuestionScopeTransitionV1 { [key: string]: unknown }

export interface HopV55PropertyAdviceIntentV3 {
  id: string;
  property: string;
  label: string;
  familyId?: string;
  role: string;
  direction: string | null;
  qualification: string | null;
  required: boolean;
  comparisonBasis: { kind: string; assertionIds: string[] };
  metric: string;
  subject: { kind: string; label: string; materialId: string | null; sensoryContext: string };
  sourceSpans: HopV55SemanticSpanV1[];
  interpretationOrigin: 'user' | 'proposal' | 'fixture';
  basis: string;
  relatedIntentIds: string[];
  investigation?: { kind: 'comparePerceptualCompensation'; observationIntentIds: string[] };
  [key: string]: unknown;
}
export interface HopV55PropertyAdviceRequestV3 {
  format: string;
  id: string;
  originalQuestion: string;
  propertyIntents: HopV55PropertyAdviceIntentV3[];
  [key: string]: unknown;
}

export interface HopV55PropertyAdviceRequestDraftV3 {
  format: 'hop-v55-property-advice-request-draft-v3';
  id: string;
  ownerKey: string;
  workspaceId: string;
  sourceReadingReference: string;
  preparedReference: string;
  requestSnapshot: { propertyIntents: HopV55PropertyAdviceIntentV3[]; [key: string]: unknown };
  reference: string;
  [key: string]: unknown;
}

export interface PrepareHopV55PropertyAdviceFromSemanticReadingV1Input {
  reading: HopV55SemanticQuestionReadingV1;
  prepared: unknown;
  sourceReadingReference: string;
  requestId: string;
  ownerKey: string;
  workspaceId: string;
  candidatePolicy: unknown;
}

export declare const HOP_V55_DECISION_READING_FORMAT_V4: 'hop-v55-decision-reading-v4';
export declare const HOP_V55_QUESTION_SEMANTIC_READING_V1_FORMAT: 'hop-v55-question-semantic-reading-v1';
export declare function readHopV55DecisionReadingArchive(value: unknown): HopV55DecisionReadingRead;
export declare function createHopV55DecisionReadingArchiveV4(input: unknown): HopV55DecisionReadingArchiveV4;
export declare function assertHopV55SemanticAnnotationsV1(value: unknown, question: string): asserts value is HopV55SemanticAnnotationV1[];
export declare function assertHopV55SemanticQuestionReadingV1(value: unknown): asserts value is HopV55SemanticQuestionReadingV1;
export declare function readHopV55QuestionSemanticV1(question: string, prepared: unknown): HopV55SemanticQuestionReadingV1;
export declare function hopV55DecisionReadingViewV1(archive: HopV55DecisionReadingArchive): unknown;
export declare function hopV55DecisionReadingScopesV1(archive: HopV55DecisionReadingArchive): unknown;
export declare function hopV55DecisionReadingActiveScopesV1(archive: HopV55DecisionReadingArchive): unknown;
export declare function hopV55DecisionReadingReferenceViewV1(archive: HopV55DecisionReadingArchive): unknown;
export declare function hopV55SuccessorPreservesParentV1(successor: HopV55DecisionReadingArchive, parent: HopV55DecisionReadingArchive): boolean;
export declare function createHopV55SemanticCorrectionArchiveV1(input: unknown): HopV55DecisionReadingArchiveV4;
export declare function createHopV55SemanticReinterpretationArchiveV1(input: unknown): HopV55DecisionReadingArchiveV4;
export declare function assertHopV55QuestionScopeLedgerV1(value: unknown, question: string, reading: HopV55SemanticQuestionReadingV1): asserts value is HopV55QuestionScopeLedgerV1;
export declare function hopV55QuestionScopeLedgerReferenceV1(value: HopV55QuestionScopeLedgerV1): string;
export declare function hopV55PropertyIntentsFromSemanticReadingV1(reading: HopV55SemanticQuestionReadingV1, prepared: unknown): HopV55PropertyAdviceIntentV3[];
export declare function assertHopPropertyAdviceRequestV3(value: unknown): asserts value is HopV55PropertyAdviceRequestV3;
export declare function prepareHopV55PropertyAdviceFromSemanticReadingV1(input: PrepareHopV55PropertyAdviceFromSemanticReadingV1Input): HopV55PropertyAdviceRequestDraftV3;

export interface HopV55DecisionReadingArchiveV4MetadataIdentityV1 {
  archiveFormat: 'hop-v55-decision-reading-v4';
  id: string;
  ownerKey: string;
  workspaceId: string;
  recordedAt: string;
  source: HopV55DecisionReadingArchiveV4['source'];
  runtimeReference: string;
  contentReference: string;
}
export type HopV55DecisionReadingArchiveV4SemanticMetadataV1 =
  Omit<HopV55SemanticQuestionReadingV1, 'format' | 'response'>
  & { sourceFormat: 'hop-v55-question-semantic-reading-v1' };
export interface HopV55DecisionReadingArchiveV4MetadataV1 {
  archiveIdentity: HopV55DecisionReadingArchiveV4MetadataIdentityV1;
  semantic: HopV55DecisionReadingArchiveV4SemanticMetadataV1;
  scopeLedger?: HopV55QuestionScopeLedgerV1;
  transition?: HopV55QuestionScopeTransitionV1;
  lineage?: HopV55DecisionReadingArchiveV4['lineage'];
  programPreparation?: HopV55DecisionReadingArchiveV4['programPreparation'];
}
export type HopV55DecisionReadingArchiveV4MetadataReadV1 =
  | { status: 'readOnly'; metadata: HopV55DecisionReadingArchiveV4MetadataV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };
export declare function readHopV55DecisionReadingArchiveV4MetadataV1(value: unknown): HopV55DecisionReadingArchiveV4MetadataReadV1;
