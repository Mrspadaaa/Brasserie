import {
  assertBrewerHopAdviceProposalV6MatchesSource,
  readBrewerHopAdviceProposalEnvelopeV6,
  verifyBrewerHopAdviceSemanticEvidenceV6,
  type BrewerHopAdviceOptionProposalLinkV1,
  type BrewerHopAdviceProposalEnvelopeV6,
} from '../../../functions/src/brewerHopAdviceSemanticV6';
import { BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5 } from '../../../functions/src/brewerHopAdviceSemanticV3';
import {
  receiveHopV55AssistedSemanticAdviceProposalV5,
  receiveHopV55AssistedSemanticEnvelopeV1,
  type HopV55SemanticEnvelopeCodecV1,
  type ReceiveHopV55AssistedSemanticAdviceProposalV5Input,
  type ReceiveHopV55AssistedSemanticAdviceProposalV5Result,
  type ReceiveHopV55AssistedSemanticEnvelopeResultV1,
} from './assistedSemanticAdviceContextV4';

const V6_CODEC: HopV55SemanticEnvelopeCodecV1<BrewerHopAdviceProposalEnvelopeV6> = {
  label: 'V6',
  read(value) {
    const read = readBrewerHopAdviceProposalEnvelopeV6(value);
    if (read.status !== 'legacyReadOnly') return read;
    return read.version === 'v5'
      ? { status: 'legacyReadOnly', format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, snapshot: read.envelope }
      : { status: 'legacyReadOnly', format: 'brewer-hop-advice-proposal-v4', snapshot: read.snapshot };
  },
  matchesSource: (envelope, request) => assertBrewerHopAdviceProposalV6MatchesSource(envelope, request),
  verify: (envelope, turnEvidence) => verifyBrewerHopAdviceSemanticEvidenceV6(envelope, turnEvidence),
};

type V6Base = ReceiveHopV55AssistedSemanticEnvelopeResultV1<BrewerHopAdviceProposalEnvelopeV6>;

export type ReceiveHopV55AssistedSemanticAdviceProposalV6Result =
  /** Links stay a separate, immutable review input: neither an adoption nor a new proof. */
  | (Extract<V6Base, { status: 'readOnly' }> & { optionProposalLinks: BrewerHopAdviceOptionProposalLinkV1[] })
  /** An older backend's V5 answer keeps its own strict reception, without reconstructed links. */
  | (Extract<V6Base, { status: 'legacyReadOnly' }> & { legacyV5?: ReceiveHopV55AssistedSemanticAdviceProposalV5Result })
  | Extract<V6Base, { status: 'unsupportedReadOnly' | 'invalid' }>;

/**
 * Read and qualify one V6 reply against its exact RequestV3, archive4 and immutable launch, with the
 * same checks as V5 (source view, ticket request, turn evidence, launch A versus fresh Page). A valid
 * historical reply stays readable when Page shows B; its applicability is reported, never assumed.
 */
export function receiveHopV55AssistedSemanticAdviceProposalV6(
  input: ReceiveHopV55AssistedSemanticAdviceProposalV5Input,
): ReceiveHopV55AssistedSemanticAdviceProposalV6Result {
  const result = receiveHopV55AssistedSemanticEnvelopeV1(input, V6_CODEC);
  if (result.status === 'readOnly') {
    return { ...result, optionProposalLinks: structuredClone(result.envelope.proposal.optionProposalLinks) };
  }
  if (result.status === 'legacyReadOnly' && result.format === BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5) {
    return { ...result, legacyV5: receiveHopV55AssistedSemanticAdviceProposalV5(input) };
  }
  return result;
}
