/**
 * Semantic output V6: the V5 suggestions and answer, plus sealed links from an option to a suggestion and
 * to the option's own typed evidence. RequestV3, SourceViewV1 and the strict V5 reader are unchanged; a
 * link is a declared attachment, never a causal proof, an adoption or an activation of a proposed guard.
 */
import { hopAdviceContentReference } from './hopAdviceContentReference.js';
import {
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5,
  BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5,
  BREWER_HOP_ADVICE_SEMANTIC_PROPOSAL_KEYS_V5,
  assertBrewerHopAdviceRequestV3,
  assertBrewerHopAdviceRequestV3ForWizardV1,
  assertBrewerHopAdviceSemanticEnvelopeV3,
  assertBrewerHopAdviceSemanticEnvelopeV3ForWizardV1,
  assertBrewerHopAdviceSemanticRawInputV3,
  brewerHopAdviceProviderInputV3Reference,
  brewerHopAdviceProviderInputV3ReferenceForWizardV1,
  createBrewerHopAdviceSemanticAnswerV3,
  createBrewerHopAdviceSemanticAnswerV3ForWizardV1,
  createBrewerHopAdviceSemanticSourcePropertyProjectionV3,
  createBrewerHopAdviceSemanticSourcePropertyProjectionV3ForWizardV1,
  normalizeBrewerHopAdviceSemanticSuggestionsV3,
  normalizeBrewerHopAdviceSemanticSuggestionsV3ForWizardV1,
  readBrewerHopAdviceProposalEnvelopeV5,
  readBrewerHopAdviceSemanticEnvelopeV3,
  readBrewerHopAdviceSemanticEnvelopeV3ForWizardV1,
  type BrewerHopAdviceProposalEnvelopeV5,
  type BrewerHopAdviceRequestV3,
  type BrewerHopAdviceSemanticEnvelopeSpecV3,
  type BrewerHopAdviceSemanticProposalV5,
  type BrewerHopAdviceSemanticSourcePropertyProjectionV3,
  type BrewerHopAdviceServerContextV3,
  type BrewerHopAdviceWizardRequestV3,
  type CreateBrewerHopAdviceProposalEnvelopeV5Input,
} from './brewerHopAdviceSemanticV3.js';
import {
  verifyBrewerHopAdviceAnswerEvidence,
  type BrewerHopAdviceEvidenceReaders,
  type BrewerHopAdviceEvidenceSource,
} from './brewerHopAdviceAnswerEvidence.js';

export const BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6 = 'brewer-hop-advice-proposal-v6' as const;
export const BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6 = 'finish_hop_advice_proposal_v6' as const;

const V6_PROPOSAL_KEYS: readonly string[] = [...BREWER_HOP_ADVICE_SEMANTIC_PROPOSAL_KEYS_V5, 'optionProposalLinks'];
const V6_SPEC: BrewerHopAdviceSemanticEnvelopeSpecV3 = {
  format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, label: 'V6', proposalKeys: V6_PROPOSAL_KEYS,
};
const LINK_KEYS = ['optionId', 'proposalId', 'evidenceIds'] as const;
const MAX_LINKS = 24;
const MAX_LINK_EVIDENCE = 12;

const V5_PARAMETERS = BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5.parameters;
const OPTION_PROPOSAL_LINKS_SCHEMA = {
  type: 'ARRAY', maxItems: MAX_LINKS,
  description: 'Rattachements déclarés option → proposition de cette réponse. proposalId est celui d’une propertyIntentProposal ou semanticRevisionProposal (jamais intent.id). evidenceIds reprend seulement des preuves déjà citées ou calculées par cette option; [] pour une hypothèse non calculée présentée comme telle. Un lien n’adopte rien et ne prouve aucune causalité.',
  items: { type: 'OBJECT', additionalProperties: false, required: [...LINK_KEYS], properties: {
    optionId: { type: 'STRING' }, proposalId: { type: 'STRING' },
    evidenceIds: { type: 'ARRAY', maxItems: MAX_LINK_EVIDENCE, items: { type: 'STRING' } },
  } },
} as const;

export const BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V6 = Object.freeze({
  name: BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6,
  description: 'Termine comme proposition source4 corrigible V6. La lecture source est immuable; aucune annotation ou suggestion n’est adoptée, aucune opération n’est appliquée. optionProposalLinks relie une option à une suggestion de cette réponse et à ses propres preuves.',
  parameters: {
    ...V5_PARAMETERS,
    required: [...V5_PARAMETERS.required, 'optionProposalLinks'],
    properties: { ...V5_PARAMETERS.properties, optionProposalLinks: OPTION_PROPOSAL_LINKS_SCHEMA },
  },
});

export type BrewerHopAdviceOptionProposalLinkV1 = {
  optionId: string;
  /** ID of a propertyIntentProposal or semanticRevisionProposal of the same envelope. */
  proposalId: string;
  /** Subset of the option's typed references: plain citations, computed contribution, explorations. */
  evidenceIds: string[];
};

export type BrewerHopAdviceSemanticProposalV6 = BrewerHopAdviceSemanticProposalV5 & {
  optionProposalLinks: BrewerHopAdviceOptionProposalLinkV1[];
};

export type BrewerHopAdviceProposalEnvelopeV6 = Omit<BrewerHopAdviceProposalEnvelopeV5, 'format' | 'proposal'> & {
  format: typeof BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6;
  proposal: BrewerHopAdviceSemanticProposalV6;
};

export type CreateBrewerHopAdviceProposalEnvelopeV6Input = CreateBrewerHopAdviceProposalEnvelopeV5Input;

export type BrewerHopAdviceProposalEnvelopeV6Read =
  | { status: 'readOnly'; envelope: BrewerHopAdviceProposalEnvelopeV6 }
  /** An older backend's V5 answer, read under its own strict contract; no link is reconstructed. */
  | { status: 'legacyReadOnly'; version: 'v5'; envelope: BrewerHopAdviceProposalEnvelopeV5 }
  | { status: 'legacyReadOnly'; version: 'v4'; snapshot: unknown }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

type Row = Record<string, unknown>;
type NormalizedOption = BrewerHopAdviceSemanticProposalV5['answer']['options'][number];
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = <T>(value: T): T => structuredClone(value);
function fail(message: string): never { throw new Error(`Conseil sémantique V6 : ${message}.`); }
function text(value: unknown, label: string, max = 160): string {
  if (typeof value !== 'string' || !value.trim() || value.trim() !== value || value.length > max) fail(`${label} est invalide`);
  return value;
}
function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Row)) deepFreeze(child);
  return value;
}
const sameJson = (left: unknown, right: unknown): boolean =>
  hopAdviceContentReference('brewer-hop-advice-semantic-v6-equality', left) === hopAdviceContentReference('brewer-hop-advice-semantic-v6-equality', right);

/**
 * Validated, typed references held by one normalized option: plain citations, the computed contribution
 * (branch or prediction selector, still qualified in the option) and derived explorations. Evidence of
 * another option or of the turn alone is not part of it.
 */
function optionTypedEvidenceIds(option: NormalizedOption): ReadonlySet<string> {
  return new Set([...option.evidenceIds, ...(option.computed ? [option.computed.evidenceId] : []),
    ...(option.exploration ?? []).map((entry) => entry.evidenceId)]);
}

/**
 * Checks links against an already normalized proposal (both ends, pair and reference uniqueness, evidence
 * within the option's own typed references). The links never extend `relatedIds`, so the guard rule of the
 * answer still applies unchanged.
 */
export function assertBrewerHopAdviceOptionProposalLinksV1(value: unknown,
  proposal: BrewerHopAdviceSemanticProposalV5): BrewerHopAdviceOptionProposalLinkV1[] {
  if (!Array.isArray(value) || value.length > MAX_LINKS) fail(`optionProposalLinks doit contenir au plus ${MAX_LINKS} liens`);
  const options = new Map(proposal.answer.options.map((option) => [option.id, option]));
  const proposalIds = new Set([...proposal.propertyIntentProposals.map((row) => row.proposalId),
    ...proposal.semanticRevisionProposals.map((row) => row.proposalId)]);
  const intentIds = new Set(proposal.propertyIntentProposals.map((row) => row.intent.id));
  const pairs = new Set<string>();
  return value.map((row, index) => {
    const label = `optionProposalLinks[${index}]`;
    if (!isRow(row)) fail(`${label} illisible`);
    const extra = Object.keys(row).filter((key) => !(LINK_KEYS as readonly string[]).includes(key));
    if (extra.length) fail(`${label} contient des champs inconnus (${extra.slice(0, 4).join(', ')})`);
    const optionId = text(row.optionId, `${label}.optionId`, 60);
    const option = options.get(optionId);
    if (!option) fail(`${label} vise une option absente de cette réponse (${optionId})`);
    const proposalId = text(row.proposalId, `${label}.proposalId`, 60);
    if (!proposalIds.has(proposalId)) {
      fail(intentIds.has(proposalId)
        ? `${label} cite intent.id ${proposalId}; un lien vise le proposalId de la suggestion`
        : `${label} vise une proposition absente de cette enveloppe (${proposalId})`);
    }
    const pair = `${optionId}\u0000${proposalId}`;
    if (pairs.has(pair)) fail(`${label} répète la paire ${optionId}/${proposalId}`);
    pairs.add(pair);
    if (!Array.isArray(row.evidenceIds) || row.evidenceIds.length > MAX_LINK_EVIDENCE) fail(`${label}.evidenceIds invalide`);
    const evidenceIds = row.evidenceIds.map((id, at) => text(id, `${label}.evidenceIds[${at}]`, 80));
    if (new Set(evidenceIds).size !== evidenceIds.length) fail(`${label}.evidenceIds répète une preuve`);
    const typed = optionTypedEvidenceIds(option);
    const foreign = evidenceIds.find((id) => !typed.has(id));
    if (foreign) fail(`${label} cite ${foreign}, absente des preuves typées de l’option ${optionId}`);
    return { optionId, proposalId, evidenceIds };
  });
}

const assertStoredLinks = (proposal: BrewerHopAdviceSemanticProposalV5 & Row): void => {
  const links = assertBrewerHopAdviceOptionProposalLinksV1(proposal.optionProposalLinks, proposal);
  if (!sameJson(links, proposal.optionProposalLinks)) fail('optionProposalLinks archivés non canoniques');
};

function suggestionsAndLinks(input: {
  raw: unknown;
  request: BrewerHopAdviceRequestV3;
  sourceProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3;
  evidence: readonly BrewerHopAdviceEvidenceSource[];
  serverContext: BrewerHopAdviceServerContextV3;
  readers?: BrewerHopAdviceEvidenceReaders;
}) {
  assertBrewerHopAdviceRequestV3(input.request);
  assertBrewerHopAdviceSemanticRawInputV3(input.raw, V6_SPEC);
  const answer = createBrewerHopAdviceSemanticAnswerV3({ request: input.request, raw: input.raw, evidence: input.evidence,
    serverContext: input.serverContext, readers: input.readers });
  const suggestions = normalizeBrewerHopAdviceSemanticSuggestionsV3({ spec: V6_SPEC, raw: input.raw, request: input.request,
    sourceProjection: input.sourceProjection, sections: answer });
  const proposal: BrewerHopAdviceSemanticProposalV6 = {
    ...suggestions, optionProposalLinks: assertBrewerHopAdviceOptionProposalLinksV1((input.raw as Row).optionProposalLinks, suggestions),
  };
  return { answer, proposal };
}

export function normalizeBrewerHopAdviceSemanticProposalV6(raw: unknown, request: BrewerHopAdviceRequestV3,
  sourceProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3, evidence: readonly BrewerHopAdviceEvidenceSource[],
  serverContext: BrewerHopAdviceServerContextV3, readers: BrewerHopAdviceEvidenceReaders = {}): BrewerHopAdviceSemanticProposalV6 {
  return suggestionsAndLinks({ raw, request, sourceProjection, evidence, serverContext, readers }).proposal;
}

export function createBrewerHopAdviceProposalEnvelopeV6(input: CreateBrewerHopAdviceProposalEnvelopeV6Input): BrewerHopAdviceProposalEnvelopeV6 {
  assertBrewerHopAdviceRequestV3(input.request);
  assertBrewerHopAdviceSemanticRawInputV3(input.raw, V6_SPEC);
  const sourcePropertyProjection = createBrewerHopAdviceSemanticSourcePropertyProjectionV3({ request: input.request, prepared: input.prepared });
  const { answer, proposal } = suggestionsAndLinks({ raw: input.raw, request: input.request, sourceProjection: sourcePropertyProjection,
    evidence: input.evidence, serverContext: input.serverContext, readers: input.readers });
  const body = {
    format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, status: 'proposal' as const,
    requestSnapshot: clone(input.request), sourcePropertyProjection: clone(sourcePropertyProjection),
    providerInputReference: brewerHopAdviceProviderInputV3Reference(input.request), proposal,
    evidence: clone(answer.evidence), serverContext: clone(answer.serverContext),
  };
  const envelope: BrewerHopAdviceProposalEnvelopeV6 = { ...body,
    reference: hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, body) };
  assertBrewerHopAdviceProposalEnvelopeV6(envelope);
  return deepFreeze(clone(envelope));
}

export function assertBrewerHopAdviceProposalEnvelopeV6(value: unknown): asserts value is BrewerHopAdviceProposalEnvelopeV6 {
  assertBrewerHopAdviceSemanticEnvelopeV3(value, V6_SPEC, assertStoredLinks);
}

export function brewerHopAdviceProposalEnvelopeV6Reference(envelope: BrewerHopAdviceProposalEnvelopeV6): string {
  assertBrewerHopAdviceProposalEnvelopeV6(envelope);
  const { reference: _reference, ...body } = envelope;
  return hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, body);
}

/** V6 strictly; V5/V4 through the strict V5 reader as legacy; any other proposal format kept raw. */
export function readBrewerHopAdviceProposalEnvelopeV6(value: unknown): BrewerHopAdviceProposalEnvelopeV6Read {
  if (!isRow(value)) return { status: 'invalid', reason: 'enveloppe illisible' };
  if (value.format === BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6) {
    const read = readBrewerHopAdviceSemanticEnvelopeV3(value, V6_SPEC, assertStoredLinks);
    return read.status === 'readOnly' ? { status: 'readOnly', envelope: read.envelope as BrewerHopAdviceProposalEnvelopeV6 } : read;
  }
  const legacy = readBrewerHopAdviceProposalEnvelopeV5(value);
  return legacy.status === 'readOnly' ? { status: 'legacyReadOnly', version: 'v5', envelope: legacy.envelope } : legacy;
}

export function verifyBrewerHopAdviceSemanticEvidenceV6(envelope: BrewerHopAdviceProposalEnvelopeV6,
  turnEvidence: readonly BrewerHopAdviceEvidenceSource[], readers: Omit<BrewerHopAdviceEvidenceReaders, 'resolveEvidence'> = {}): void {
  assertBrewerHopAdviceProposalEnvelopeV6(envelope);
  verifyBrewerHopAdviceAnswerEvidence(envelope.evidence, turnEvidence, readers);
}

export function assertBrewerHopAdviceProposalV6MatchesSource(envelopeValue: unknown,
  requestValue: unknown): asserts envelopeValue is BrewerHopAdviceProposalEnvelopeV6 {
  assertBrewerHopAdviceProposalEnvelopeV6(envelopeValue);
  assertBrewerHopAdviceRequestV3(requestValue);
  if (!sameJson((envelopeValue as BrewerHopAdviceProposalEnvelopeV6).requestSnapshot, requestValue)) {
    fail('proposal V6 ne correspond pas à la RequestV3 exacte du lecteur');
  }
}

// ---------------------------------------------------------------------------------------------
// Explicit Wizard V1 profile of the same V6 output: format, keys, links, requestSnapshot and reference formula
// are those above; only the admitted RequestV3 source differs. The classic V6 entries above refuse it.

/** ProposalV6 whose requestSnapshot is the Wizard RequestV3 it was produced for. */
export type BrewerHopAdviceWizardProposalEnvelopeV6 = Omit<BrewerHopAdviceProposalEnvelopeV6, 'requestSnapshot'> & {
  requestSnapshot: BrewerHopAdviceWizardRequestV3;
};

export type CreateBrewerHopAdviceProposalEnvelopeV6ForWizardV1Input =
  Omit<CreateBrewerHopAdviceProposalEnvelopeV6Input, 'request'> & { request: BrewerHopAdviceWizardRequestV3 };

export type BrewerHopAdviceWizardProposalEnvelopeV6Read =
  | { status: 'readOnly'; envelope: BrewerHopAdviceWizardProposalEnvelopeV6 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

function wizardSuggestionsAndLinks(input: Omit<Parameters<typeof suggestionsAndLinks>[0], 'request'> & {
  request: BrewerHopAdviceWizardRequestV3;
}) {
  assertBrewerHopAdviceRequestV3ForWizardV1(input.request);
  assertBrewerHopAdviceSemanticRawInputV3(input.raw, V6_SPEC);
  const answer = createBrewerHopAdviceSemanticAnswerV3ForWizardV1({ request: input.request, raw: input.raw, evidence: input.evidence,
    serverContext: input.serverContext, readers: input.readers });
  const suggestions = normalizeBrewerHopAdviceSemanticSuggestionsV3ForWizardV1({ spec: V6_SPEC, raw: input.raw, request: input.request,
    sourceProjection: input.sourceProjection, sections: answer });
  const proposal: BrewerHopAdviceSemanticProposalV6 = {
    ...suggestions, optionProposalLinks: assertBrewerHopAdviceOptionProposalLinksV1((input.raw as Row).optionProposalLinks, suggestions),
  };
  return { answer, proposal };
}

export function createBrewerHopAdviceProposalEnvelopeV6ForWizardV1(
  input: CreateBrewerHopAdviceProposalEnvelopeV6ForWizardV1Input,
): BrewerHopAdviceWizardProposalEnvelopeV6 {
  assertBrewerHopAdviceRequestV3ForWizardV1(input.request);
  assertBrewerHopAdviceSemanticRawInputV3(input.raw, V6_SPEC);
  const sourcePropertyProjection = createBrewerHopAdviceSemanticSourcePropertyProjectionV3ForWizardV1({
    request: input.request, prepared: input.prepared,
  });
  const { answer, proposal } = wizardSuggestionsAndLinks({ raw: input.raw, request: input.request, sourceProjection: sourcePropertyProjection,
    evidence: input.evidence, serverContext: input.serverContext, readers: input.readers });
  const body = {
    format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, status: 'proposal' as const,
    requestSnapshot: clone(input.request), sourcePropertyProjection: clone(sourcePropertyProjection),
    providerInputReference: brewerHopAdviceProviderInputV3ReferenceForWizardV1(input.request), proposal,
    evidence: clone(answer.evidence), serverContext: clone(answer.serverContext),
  };
  const envelope: BrewerHopAdviceWizardProposalEnvelopeV6 = { ...body,
    reference: hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, body) };
  assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1(envelope);
  return deepFreeze(clone(envelope));
}

export function assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1(value: unknown): asserts value is BrewerHopAdviceWizardProposalEnvelopeV6 {
  assertBrewerHopAdviceSemanticEnvelopeV3ForWizardV1(value, V6_SPEC, assertStoredLinks);
}

export function brewerHopAdviceProposalEnvelopeV6ReferenceForWizardV1(envelope: BrewerHopAdviceWizardProposalEnvelopeV6): string {
  assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1(envelope);
  const { reference: _reference, ...body } = envelope;
  return hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6, body);
}

/**
 * Wizard V6 strictly. ProposalV5/V4 never carry a Wizard request and are invalid here (no legacy promotion);
 * a later proposal format stays raw, without being declared Wizard.
 */
export function readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(value: unknown): BrewerHopAdviceWizardProposalEnvelopeV6Read {
  if (!isRow(value)) return { status: 'invalid', reason: 'enveloppe illisible' };
  if (value.format === BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V6) {
    const read = readBrewerHopAdviceSemanticEnvelopeV3ForWizardV1(value, V6_SPEC, assertStoredLinks);
    return read.status === 'readOnly' ? { status: 'readOnly', envelope: read.envelope as BrewerHopAdviceWizardProposalEnvelopeV6 } : read;
  }
  if (value.format === BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5 || value.format === 'brewer-hop-advice-proposal-v4') {
    return { status: 'invalid', reason: 'Mélange connu refusé : ProposalV5/V4 restent des sorties de sources classiques.' };
  }
  return typeof value.format === 'string' && value.format.startsWith('brewer-hop-advice-proposal-')
    ? { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Format proposal futur/inconnu : ${value.format}` }
    : { status: 'invalid', reason: 'format proposal absent/inconnu' };
}

export function verifyBrewerHopAdviceSemanticEvidenceV6ForWizardV1(envelope: BrewerHopAdviceWizardProposalEnvelopeV6,
  turnEvidence: readonly BrewerHopAdviceEvidenceSource[], readers: Omit<BrewerHopAdviceEvidenceReaders, 'resolveEvidence'> = {}): void {
  assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1(envelope);
  verifyBrewerHopAdviceAnswerEvidence(envelope.evidence, turnEvidence, readers);
}

export function assertBrewerHopAdviceProposalV6MatchesSourceForWizardV1(envelopeValue: unknown,
  requestValue: unknown): asserts envelopeValue is BrewerHopAdviceWizardProposalEnvelopeV6 {
  assertBrewerHopAdviceProposalEnvelopeV6ForWizardV1(envelopeValue);
  assertBrewerHopAdviceRequestV3ForWizardV1(requestValue);
  if (!sameJson((envelopeValue as BrewerHopAdviceWizardProposalEnvelopeV6).requestSnapshot, requestValue)) {
    fail('proposal V6 Wizard ne correspond pas à la RequestV3 Wizard exacte du lecteur');
  }
}
