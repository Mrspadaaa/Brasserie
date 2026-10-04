import {
  assertHopDocumentaryAnswer,
  type HopDocumentaryAnswer,
} from './documentaryAnswerSchema';

export interface HopDocumentaryAnswerViewModel extends Omit<HopDocumentaryAnswer, 'format' | 'reference'> {
  format: 'hop-documentary-answer-view-v1';
  answerReference: string;
}

/** Structured display projection only; it does not infer permission or rebuild evidence. */
export function hopDocumentaryAnswerViewModel(answer: HopDocumentaryAnswer): HopDocumentaryAnswerViewModel {
  assertHopDocumentaryAnswer(answer);
  const { format: _format, reference, ...content } = structuredClone(answer);
  return { ...content, format: 'hop-documentary-answer-view-v1', answerReference: reference };
}
