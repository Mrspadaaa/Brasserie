// Neutral answer/evidence boundary shared by closed V2/V4 and semantic V3/V5. Its entries accept a
// neutral answer source derived by each version from its own validated snapshot; they never receive,
// rebuild or fake an older or newer versioned request/envelope. The implementation stays beside the
// historical rules it reuses, so V2/V4 keep their exact behaviour; this module exposes only neutral names.
export {
  assertBrewerHopAdviceStoredAnswer,
  assertBrewerHopAdviceStoredEvidenceContext,
  createBrewerHopAdviceAnswer,
  verifyBrewerHopAdviceAnswerEvidence,
} from './brewerHopAdviceProposal.js';

export type {
  BrewerHopAdviceAnswer,
  BrewerHopAdviceAnswerEvidence,
  BrewerHopAdviceAnswerSections,
  BrewerHopAdviceAnswerServerContext,
  BrewerHopAdviceAnswerSourceV1,
  BrewerHopAdviceEvidenceReaders,
  BrewerHopAdviceEvidenceSource,
  BrewerHopAdviceMaterialMention,
  BrewerHopAdviceOpenQuestion,
  BrewerHopAdviceSealedAnswer,
} from './brewerHopAdviceProposal.js';
