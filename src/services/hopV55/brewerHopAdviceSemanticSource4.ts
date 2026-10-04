/**
 * Portable source4 seam for the semantic assistant. Implementations stay in
 * the frozen V5.5 readers/preparation modules beside this file; this module is
 * only their narrow public bridge plus the existing PropertyAdviceV3 assert.
 */
export {
  HOP_V55_DECISION_READING_FORMAT_V4,
  createHopV55DecisionReadingArchiveV4,
  readHopV55DecisionReadingArchive,
  readHopV55DecisionReadingArchiveV4MetadataV1,
} from './decisionArchive.js';

export {
  HOP_V55_SEMANTIC_QUALIFIER_SENSES,
  HOP_V55_SEMANTIC_SENSE_RULES,
  assertHopV55SemanticAnnotationsV1,
  assertHopV55SemanticQuestionReadingV1,
  projectHopV55SemanticDecisionV1,
} from './decisionSemanticProjection.js';

export {
  HOP_V55_QUESTION_SEMANTIC_READING_V1_FORMAT,
  readHopV55QuestionSemanticV1,
} from './questionSemanticReading.js';

export {
  hopV55DecisionReadingViewV1,
  hopV55DecisionReadingScopesV1,
  hopV55DecisionReadingActiveScopesV1,
  hopV55DecisionReadingReferenceViewV1,
  hopV55SuccessorPreservesParentV1,
  createHopV55SemanticCorrectionArchiveV1,
  createHopV55SemanticReinterpretationArchiveV1,
} from './decisionReadingAccessors.js';

export {
  assertHopV55QuestionScopeLedgerV1,
  hopV55QuestionScopeLedgerReferenceV1,
} from './questionScopeReading.js';

export {
  hopV55PropertyIntentsFromSemanticReadingV1,
  prepareHopV55PropertyAdviceFromSemanticReadingV1,
} from './propertyAdviceSemanticPreparationV3.js';

export { assertHopPropertyAdviceRequestV3 } from '../../domain/hopDecision/propertyAdviceSchema.js';

export type {
  HopV55DecisionReadingArchiveV4,
  HopV55DecisionReadingArchive,
  HopV55DecisionReadingRead,
  HopV55DecisionReadingSource,
  HopV55DecisionReadingArchiveV4MetadataIdentityV1,
  HopV55DecisionReadingArchiveV4SemanticMetadataV1,
  HopV55DecisionReadingArchiveV4MetadataV1,
  HopV55DecisionReadingArchiveV4MetadataReadV1,
} from './decisionArchive.js';
export type {
  HopV55SemanticAnnotationV1,
  HopV55SemanticQuestionReadingV1,
  HopV55SemanticSpanV1,
  HopV55SemanticSenseV1,
} from './questionSemanticReading.js';
export type {
  HopV55QuestionScopeLedgerV1,
  HopV55QuestionScopeTransitionV1,
} from './questionScopeReading.js';
export type {
  PrepareHopV55PropertyAdviceFromSemanticReadingV1Input,
} from './propertyAdviceSemanticPreparationV3.js';
export type { HopV55PropertyAdviceRequestDraftV3 } from './propertyAdvicePreparationV3.js';
export type { HopPropertyAdviceIntentV3 as HopV55PropertyAdviceIntentV3 } from '../../domain/hopDecision/propertyAdviceSchema.js';
