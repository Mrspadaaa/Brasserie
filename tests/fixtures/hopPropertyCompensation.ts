import source from './hopPropertyCompensationSource02.json';
import type { HopPropertyAdviceRequest, HopPropertyAdviceRequestV3 } from '../../src/domain/hopDecision/propertyAdviceSchema';

/** Exact Application export; the V3 annotation below is an explicit fixture revision, not a user confirmation. */
export const hopPropertyCompensationSource = source;
export function makeHopPropertyCompensationRequestV3(): HopPropertyAdviceRequestV3 {
  const input = structuredClone(source.requestSnapshot) as HopPropertyAdviceRequest;
  const observation = input.propertyIntents.find(row => row.role === 'reportedObservation' && row.property === 'sweetness')!;
  const question = input.propertyIntents.find(row => row.role === 'investigation' && row.relatedIntentIds.includes(observation.id))!;
  return { ...input, format: 'hop-documentary-request-v3', id: input.id + '-compensation-v3',
    interpretation: { ...input.interpretation, id: input.interpretation.id + '-compensation-v3',
      version: 'fixture-perceptual-compensation-v3-2' },
    propertyIntents: input.propertyIntents.map(intent => intent.id === question.id
      ? { ...intent, investigation: { kind: 'comparePerceptualCompensation', observationIntentIds: [observation.id] } }
      : intent) };
}
