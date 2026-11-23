import {
  assertHopPropertyAdviceAnswer,
  assertHopPropertyAdviceAnswerV3,
  HOP_PROPERTY_ADVICE_VIEW_VERSION,
  HOP_PROPERTY_ADVICE_VIEW_V3_VERSION,
  type HopPropertyAdviceAnswer,
  type HopPropertyAdviceAnswerV3,
  type HopPropertyAdviceAnswerViewModel,
  type HopPropertyAdviceAnswerViewModelV3,
} from './propertyAdviceSchema';

/** Structured display projection of the archived V2 snapshot; it never rebuilds advice or permission. */
export function hopPropertyAdviceViewModel(answer: HopPropertyAdviceAnswer): HopPropertyAdviceAnswerViewModel {
  assertHopPropertyAdviceAnswer(answer);
  const { format: _format, reference, ...content } = structuredClone(answer);
  return { ...content, format: HOP_PROPERTY_ADVICE_VIEW_VERSION, answerReference: reference };
}

/** Structured projection of a V3 archived answer; it never rebuilds advice or permission. */
export function hopPropertyAdviceViewModelV3(answer: HopPropertyAdviceAnswerV3): HopPropertyAdviceAnswerViewModelV3 {
  assertHopPropertyAdviceAnswerV3(answer);
  const { format: _format, reference, ...content } = structuredClone(answer);
  return { ...content, format: HOP_PROPERTY_ADVICE_VIEW_V3_VERSION, answerReference: reference };
}
