/** Versioned source4 assistant handoff; request2/proposal4 are deliberately untouched. */
import { hopAdviceContentReference } from './hopAdviceContentReference.js';
import { readBrewerHopAdviceSourceViewMetadataV1 } from './brewerHopAdviceSourceViewMetadataV1.js';
import {
  isBrewerHopAdviceContextLaunchClaim,
  type BrewerHopAdviceContextLaunchClaimV1,
} from './brewerHopAdviceContextBinding.js';
// Shared answer/evidence rules take a neutral source: the V5 path never builds a RequestV2 or a ProposalV4.
import {
  assertBrewerHopAdviceStoredAnswer,
  assertBrewerHopAdviceStoredEvidenceContext,
  createBrewerHopAdviceAnswer,
  verifyBrewerHopAdviceAnswerEvidence,
  type BrewerHopAdviceAnswer,
  type BrewerHopAdviceAnswerEvidence,
  type BrewerHopAdviceAnswerSections,
  type BrewerHopAdviceAnswerServerContext,
  type BrewerHopAdviceAnswerSourceV1,
  type BrewerHopAdviceEvidenceReaders,
  type BrewerHopAdviceEvidenceSource,
  type BrewerHopAdviceMaterialMention,
  type BrewerHopAdviceOpenQuestion,
} from './brewerHopAdviceAnswerEvidence.js';
// Closed historical readers, used only to classify a stored RequestV2/ProposalV4 as legacy read-only.
import {
  BREWER_HOP_ADVICE_PROPOSAL_FORMAT,
  BREWER_HOP_ADVICE_REQUEST_FORMAT,
  assertBrewerHopAdviceProposalEnvelope,
  validateBrewerHopAdviceRequest,
  type BrewerHopAdviceRequest,
} from './brewerHopAdviceProposal.js';
import {
  HOP_V55_SEMANTIC_SENSE_RULES,
  HOP_V55_DECISION_READING_FORMAT_V4,
  assertHopV55SemanticQuestionReadingV1,
  hopV55PropertyIntentsFromSemanticReadingV1,
  readHopV55DecisionReadingArchive,
  type HopV55DecisionReadingSource,
  type HopV55DecisionReadingArchiveV4,
  type HopV55SemanticAnnotationV1,
  type HopV55SemanticQuestionReadingV1,
  type HopV55SemanticSenseV1,
  type HopV55SemanticSpanV1,
  type HopV55PropertyAdviceIntentV3,
} from './brewerHopAdviceSemanticSource4.js';

export const BREWER_HOP_ADVICE_REQUEST_FORMAT_V3 = 'brewer-hop-advice-request-v3' as const;
export const BREWER_HOP_ADVICE_PROVIDER_INPUT_FORMAT_V3 = 'brewer-hop-advice-provider-input-v3' as const;
export const BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1 = 'hop-v55-source4-assistance-view-v1' as const;
export const BREWER_HOP_ADVICE_LOCAL_READING_RESPONSE_REFERENCE_V1 = 'hop-v55-source4-reading-response-local-v1' as const;
export const BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3 = 'brewer-hop-advice-source-property-projection-v3' as const;
export const BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5 = 'brewer-hop-advice-proposal-v5' as const;
export const BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5 = 'finish_hop_advice_proposal_v5' as const;

const FINISH_SCHEMA = {
  type: 'OBJECT', additionalProperties: false,
  required: ['annotationReviews', 'propertyIntentProposals', 'semanticRevisionProposals', 'openQuestions', 'materials', 'answer'],
  properties: {
    annotationReviews: { type: 'ARRAY', items: { type: 'OBJECT', additionalProperties: false,
      required: ['annotationId', 'verdict', 'reason'], properties: {
        annotationId: { type: 'STRING' }, verdict: { type: 'STRING', enum: ['consistent', 'revise', 'dispute'] }, reason: { type: 'STRING' },
      } } },
        propertyIntentProposals: { type: 'ARRAY', maxItems: 12, items: { type: 'OBJECT', additionalProperties: false,
      required: ['proposalId', 'kind', 'sourceAnnotationIds', 'intent', 'motive'], properties: {
        proposalId: { type: 'STRING' }, kind: { type: 'STRING', enum: ['revise', 'add'] },
        sourceAnnotationIds: { type: 'ARRAY', items: { type: 'STRING' } }, motive: { type: 'STRING' },
        intent: { type: 'OBJECT', additionalProperties: false,
          required: ['id', 'property', 'label', 'role', 'direction', 'qualification', 'required', 'comparisonBasis', 'metric', 'subject',
            'sourceSpans', 'basis', 'relatedIntentIds'],
          properties: {
            id: { type: 'STRING' }, property: { type: 'STRING' }, label: { type: 'STRING' }, familyId: { type: 'STRING' },
            partner: { type: 'OBJECT', additionalProperties: false, required: ['kind', 'text'], properties: {
              kind: { type: 'STRING', enum: ['freeContext'] }, text: { type: 'STRING' },
            } },
            role: { type: 'STRING', enum: ['target', 'reportedObservation', 'measurement', 'investigation', 'preference', 'constraint'] },
            direction: { type: 'STRING', enum: ['increase', 'decrease', 'keep', 'exclude', 'investigate', 'none'] },
            qualification: { type: ['STRING', 'NULL'] }, required: { type: 'BOOLEAN' },
            comparisonBasis: { type: 'OBJECT', additionalProperties: false, required: ['kind', 'assertionIds'], properties: {
              kind: { type: 'STRING', enum: ['qualitativeTarget', 'current', 'none'] }, assertionIds: { type: 'ARRAY', items: { type: 'STRING' } },
            } },
            metric: { type: 'STRING', enum: ['sensory', 'pH', 'titratableAcidity', 'analyticalBU', 'unspecified'] },
            subject: { type: 'OBJECT', additionalProperties: false, required: ['kind', 'label', 'materialId', 'sensoryContext'], properties: {
              kind: { type: 'STRING', enum: ['beer', 'material', 'culture', 'process', 'unspecified'] }, label: { type: 'STRING' },
              materialId: { type: ['STRING', 'NULL'] }, sensoryContext: { type: 'STRING', enum: ['beer', 'rawHop', 'infusion', 'unspecified'] },
            } },
            sourceSpans: { type: 'ARRAY', items: { type: 'OBJECT', additionalProperties: false, required: ['start', 'end', 'text'], properties: {
              start: { type: 'INTEGER' }, end: { type: 'INTEGER' }, text: { type: 'STRING' },
            } } },
            basis: { type: 'STRING' }, relatedIntentIds: { type: 'ARRAY', items: { type: 'STRING' } },
            investigation: { type: 'OBJECT', additionalProperties: false, required: ['kind', 'observationIntentIds'], properties: {
              kind: { type: 'STRING', enum: ['comparePerceptualCompensation'] },
              observationIntentIds: { type: 'ARRAY', items: { type: 'STRING' } },
            } },
          } },
      } } },
    semanticRevisionProposals: { type: 'ARRAY', maxItems: 12, items: { type: 'OBJECT', additionalProperties: false,
      required: ['proposalId', 'kind', 'sourceAnnotationIds', 'sourceSpans', 'proposedFields', 'motive'], properties: {
        proposalId: { type: 'STRING' }, kind: { type: 'STRING', enum: ['revise', 'reject', 'add'] },
        sourceAnnotationIds: { type: 'ARRAY', maxItems: 20, items: { type: 'STRING' } },
        sourceSpans: { type: 'ARRAY', minItems: 1, maxItems: 10, items: { type: 'OBJECT', additionalProperties: false,
          required: ['start', 'end', 'text'], properties: { start: { type: 'INTEGER' }, end: { type: 'INTEGER' }, text: { type: 'STRING' } } } },
        proposedFields: { type: 'OBJECT', additionalProperties: false, properties: {
          sense: { type: 'STRING', enum: ['qualitativeTarget', 'directedChange', 'guard', 'exclusion', 'reportedObservation', 'investigation', 'nonDecision', 'mention'] },
          term: { type: 'STRING' }, requirement: { type: 'STRING', enum: ['required', 'optional'] },
          direction: { type: ['STRING', 'NULL'], enum: ['increase', 'decrease', 'keep', 'exclude', 'investigate', null] },
          qualification: { type: 'STRING' }, qualifierSource: { type: 'OBJECT' }, note: { type: 'STRING' },
          primitiveConvention: { type: 'STRING', enum: ['targetAsIncrease', 'targetAsInvestigation'] },
          frameSource: { type: 'OBJECT' }, guard: { type: 'STRING', enum: ['preserve', 'noIncrease', 'noDecrease'] },
          inquiry: { type: 'STRING', enum: ['question', 'compensation', 'characterization'] },
          mentionKind: { type: 'STRING', enum: ['partnerPreference', 'contextNote'] },
          subject: { type: 'OBJECT', additionalProperties: false, required: ['kind'], properties: {
            kind: { type: 'STRING', enum: ['beer', 'material', 'unspecified'] }, source: { type: 'OBJECT' },
          } }, instrumentSource: { type: 'OBJECT' }, familyId: { type: 'STRING' }, dimension: { type: 'STRING' },
          reportedProblem: { type: 'STRING' }, lexicon: { type: 'OBJECT' },
          partner: { type: 'OBJECT', additionalProperties: false, required: ['kind', 'text'], properties: {
            kind: { type: 'STRING', enum: ['freeContext'] }, text: { type: 'STRING' },
          } }, relatedAnnotationIds: { type: 'ARRAY', items: { type: 'STRING' } },
        } }, motive: { type: 'STRING' },
      } } },
    openQuestions: { type: 'ARRAY', maxItems: 6, items: { type: 'OBJECT', additionalProperties: false,
      required: ['id', 'kind', 'quotes', 'restatement', 'whyOpen', 'relatedIds'], properties: {
        id: { type: 'STRING' }, kind: { type: 'STRING', enum: ['conditionalRisk', 'alternativeAddition', 'fermentationInteraction', 'processChoice', 'cause', 'other'] },
        quotes: { type: 'ARRAY', minItems: 1, maxItems: 3, items: { type: 'OBJECT', additionalProperties: false, required: ['text'], properties: {
          text: { type: 'STRING' }, occurrence: { type: 'INTEGER' },
        } } }, restatement: { type: 'STRING' }, whyOpen: { type: 'STRING' }, relatedIds: { type: 'ARRAY', items: { type: 'STRING' } },
      } } },
    materials: { type: 'ARRAY', maxItems: 6, items: { type: 'OBJECT', additionalProperties: false,
      required: ['id', 'quote', 'identity', 'note'], properties: {
        id: { type: 'STRING' }, quote: { type: 'OBJECT', additionalProperties: false, required: ['text'], properties: {
          text: { type: 'STRING' }, occurrence: { type: 'INTEGER' },
        } }, identity: { type: 'STRING', enum: ['unconfirmed', 'personalUnidentified'] },
        candidates: { type: 'ARRAY', maxItems: 4, items: { type: 'OBJECT', additionalProperties: false,
          required: ['materialId', 'evidenceId'], properties: { materialId: { type: 'STRING' }, evidenceId: { type: 'STRING' } } } },
        note: { type: 'STRING' },
      } } },
    answer: { type: 'OBJECT', additionalProperties: false,
      required: ['summary', 'readingNote', 'options', 'unknowns', 'program', 'refusals'], properties: {
        summary: { type: 'STRING' }, readingNote: { type: 'STRING' },
        options: { type: 'ARRAY', items: { type: 'OBJECT', additionalProperties: false,
          required: ['id', 'kind', 'title', 'rationale', 'conditions', 'tradeoffs', 'relatedIds', 'evidenceIds'], properties: {
            id: { type: 'STRING' }, kind: { type: 'STRING', enum: ['intervention', 'characterization', 'investigation', 'alternative'] },
            title: { type: 'STRING' }, rationale: { type: 'STRING' }, conditions: { type: 'ARRAY', items: { type: 'STRING' } },
            tradeoffs: { type: 'ARRAY', items: { type: 'STRING' } }, relatedIds: { type: 'ARRAY', items: { type: 'STRING' } },
            evidenceIds: { type: 'ARRAY', items: { type: 'STRING' } },
            computed: { type: 'OBJECT', additionalProperties: false, required: ['evidenceId'], properties: {
              evidenceId: { type: 'STRING' }, branchId: { type: 'STRING' },
              predictionSelection: { type: 'OBJECT', additionalProperties: false, properties: {
                kind: { type: 'STRING', enum: ['alternative', 'recipeOverall', 'recipeAddition'] },
                index: { type: 'INTEGER' }, additionId: { type: 'STRING' },
              } },
            } },
          } } },
        unknowns: { type: 'ARRAY', items: { type: 'OBJECT', additionalProperties: false, required: ['id', 'question', 'changesChoice', 'relatedIds'],
          properties: { id: { type: 'STRING' }, question: { type: 'STRING' }, changesChoice: { type: 'STRING' }, relatedIds: { type: 'ARRAY', items: { type: 'STRING' } } } } },
        program: { type: 'OBJECT', additionalProperties: false, required: ['kind', 'note'], properties: {
          kind: { type: 'STRING', enum: ['none', 'preparedRequest', 'scenarioBranch'] }, evidenceId: { type: 'STRING' }, branchId: { type: 'STRING' }, note: { type: 'STRING' },
        } },
        refusals: { type: 'ARRAY', items: { type: 'OBJECT', additionalProperties: false, required: ['text', 'relatedIds'],
          properties: { text: { type: 'STRING' }, relatedIds: { type: 'ARRAY', items: { type: 'STRING' } } } } },
      } },
  },
} as const;

export const BREWER_HOP_ADVICE_SEMANTIC_FINISH_DECLARATION_V5 = Object.freeze({
  name: BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V5,
  description: 'Termine comme proposition source4 corrigible. La lecture source est immuable; aucune annotation n’est adoptée et aucune opération n’est appliquée.',
  parameters: FINISH_SCHEMA,
} as const);

export type BrewerHopAdviceRequestV3 = {
  format: typeof BREWER_HOP_ADVICE_REQUEST_FORMAT_V3;
  question: string;
  sourceReadingReference: string;
  contextLaunch: BrewerHopAdviceContextLaunchClaimV1;
  sourceView: BrewerHopAdviceSourceViewV1;
};

export type BrewerHopAdviceSourceViewV1 = {
  format: typeof BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1;
  archiveIdentity: {
    archiveFormat: typeof HOP_V55_DECISION_READING_FORMAT_V4;
    id: string;
    ownerKey: string;
    workspaceId: string;
    recordedAt: string;
    source: HopV55DecisionReadingSource;
    runtimeReference: string;
    contentReference: string;
  };
  semantic: {
    sourceFormat: HopV55SemanticQuestionReadingV1['format'];
    intent: HopV55SemanticQuestionReadingV1['intent'];
    annotations: HopV55SemanticAnnotationV1[];
    operationDrafts?: unknown[];
    projectionCoverage: HopV55SemanticQuestionReadingV1['projectionCoverage'];
    correction?: HopV55SemanticQuestionReadingV1['correction'];
    interpretation: string;
    branches: unknown[];
    unresolved: string[];
  };
  scopeLedger?: unknown;
  transition?: unknown;
  lineage?: unknown;
  programPreparation?: unknown;
  localDerivations: {
    readingResponse: { state: 'absent' }
      | { state: 'localOnly'; path: 'reading.response'; reference: string };
  };
  reference: string;
};

export type BrewerHopAdviceProviderInputV3 = {
  format: typeof BREWER_HOP_ADVICE_PROVIDER_INPUT_FORMAT_V3;
  sourceReadingReference: string;
  question: string;
  semanticReading: Omit<BrewerHopAdviceSourceViewV1['semantic'], 'branches' | 'operationDrafts'>;
  archivedReaderOutput?: {
    provenance: 'source4ArchiveOnlyNotCurrentToolEvidenceOrPermission';
    operationDrafts?: unknown[];
    branches: unknown[];
    programPreparation?: unknown;
    readingResponse: BrewerHopAdviceSourceViewV1['localDerivations']['readingResponse'];
  };
};

export type BrewerHopAdviceRequestV3Read =
  | { status: 'readOnly'; request: BrewerHopAdviceRequestV3 }
  | { status: 'legacyReadOnly'; version: 'v2'; request: BrewerHopAdviceRequest }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type BrewerHopAdviceSemanticSourcePropertyProjectionV3 = {
  format: typeof BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3;
  sourceReadingReference: string;
  propertyIntents: HopV55PropertyAdviceIntentV3[];
  reference: string;
};

type JsonPrimitive = null | string | number | boolean;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
type Row = Record<string, unknown>;
const hasOwn = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value)
  && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
const isText = (value: unknown, max = 2000): value is string => typeof value === 'string' && !!value.trim() && value.length <= max;
const clone = <T>(value: T): T => structuredClone(value);
function fail(message: string): never { throw new Error(`Conseil sémantique V3/V5 : ${message}.`); }
function exactKeys(value: Row, keys: readonly string[], label: string): void {
  const extra = Object.keys(value).filter(key => !keys.includes(key));
  if (extra.length) fail(`${label} contient des champs inconnus (${extra.slice(0, 4).join(', ')})`);
}
function assertJson(value: unknown, label: string, ancestors = new Set<object>()): asserts value is JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') { if (!Number.isFinite(value)) fail(`${label} contient un nombre non fini`); return; }
  if (typeof value !== 'object' || value === undefined) fail(`${label} n’est pas JSON`);
  if (ancestors.has(value as object)) fail(`${label} contient un cycle`);
  if (!Array.isArray(value) && !isRow(value)) fail(`${label} contient un objet non JSON`);
  ancestors.add(value as object);
  if (Array.isArray(value)) value.forEach((child, index) => assertJson(child, `${label}[${index}]`, ancestors));
  else for (const [key, child] of Object.entries(value)) {
    if (child === undefined) fail(`${label}.${key} est indéfini`);
    assertJson(child, `${label}.${key}`, ancestors);
  }
  ancestors.delete(value as object);
}
function sameJson(left: unknown, right: unknown): boolean {
  try { return hopAdviceContentReference('brewer-hop-advice-semantic-equality-v1', left) ===
    hopAdviceContentReference('brewer-hop-advice-semantic-equality-v1', right); }
  catch { return false; }
}
function text(value: unknown, label: string, max = 2000): string {
  if (!isText(value, max) || value.trim() !== value) fail(`${label} est invalide`);
  return value;
}
function stringList(value: unknown, label: string, max = 500): string[] {
  if (!Array.isArray(value) || value.length > max || value.some(row => !isText(row, 200))) fail(`${label} est invalide`);
  if (new Set(value as string[]).size !== value.length) fail(`${label} contient des IDs répétés`);
  return value as string[];
}

export function measureBrewerHopAdviceSemanticJsonWire(value: unknown): { utf8Bytes: number; maxDepth: number } {
  assertJson(value, 'wire complet');
  const serialized = JSON.stringify(value);
  if (serialized === undefined) fail('le wire complet n’est pas sérialisable');
  let maxDepth = 0;
  const visit = (row: unknown, depth: number): void => {
    if (!row || typeof row !== 'object') return;
    maxDepth = Math.max(maxDepth, depth + 1);
    if (Array.isArray(row)) row.forEach(child => visit(child, depth + 1));
    else Object.values(row as Row).forEach(child => visit(child, depth + 1));
  };
  visit(value, 0);
  return { utf8Bytes: new TextEncoder().encode(serialized).byteLength, maxDepth };
}

function validatedSourceArchive(value: unknown): HopV55DecisionReadingArchiveV4 {
  assertJson(value, 'sourceArchive');
  const result = readHopV55DecisionReadingArchive(value);
  if (result.status === 'unsupportedFormat') fail(`archive source future conservée sans conversion (${result.format})`);
  if (result.status !== 'available' || result.archive.format !== HOP_V55_DECISION_READING_FORMAT_V4) {
    fail(result.status === 'invalidRecord' ? result.reason : 'une archive source4 V4 exacte est requise');
  }
  const archive = result.archive as HopV55DecisionReadingArchiveV4;
  assertHopV55SemanticQuestionReadingV1(archive.reading);
  return archive;
}

function sourceViewBody(view: BrewerHopAdviceSourceViewV1): Omit<BrewerHopAdviceSourceViewV1, 'reference'> {
  const { reference: _reference, ...body } = view;
  return body;
}

function sourceViewFromValidatedArchive(archive: HopV55DecisionReadingArchiveV4): BrewerHopAdviceSourceViewV1 {
  const { format: sourceFormat, response, ...semantic } = clone(archive.reading);
  const body: Omit<BrewerHopAdviceSourceViewV1, 'reference'> = {
    format: BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1,
    archiveIdentity: {
      archiveFormat: archive.format, id: archive.id, ownerKey: archive.ownerKey, workspaceId: archive.workspaceId,
      recordedAt: archive.recordedAt, source: clone(archive.source), runtimeReference: archive.runtimeReference,
      contentReference: archive.contentReference,
    },
    semantic: { sourceFormat, ...semantic },
    ...(hasOwn(archive, 'scopeLedger') ? { scopeLedger: clone(archive.scopeLedger) } : {}),
    ...(hasOwn(archive, 'transition') ? { transition: clone(archive.transition) } : {}),
    ...(hasOwn(archive, 'lineage') ? { lineage: clone(archive.lineage) } : {}),
    ...(hasOwn(archive, 'programPreparation') ? { programPreparation: clone(archive.programPreparation) } : {}),
    localDerivations: { readingResponse: response === undefined ? { state: 'absent' } : {
      state: 'localOnly', path: 'reading.response',
      reference: hopAdviceContentReference(BREWER_HOP_ADVICE_LOCAL_READING_RESPONSE_REFERENCE_V1, response),
    } },
  };
  return { ...body, reference: hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1, body) };
}

function assertSourceIdentity(value: unknown, label: string): asserts value is HopV55DecisionReadingSource {
  if (!isRow(value)) fail(`${label} illisible`);
  if (value.kind === 'recipe' || value.kind === 'batch') {
    exactKeys(value, ['kind', 'id'], label); text(value.id, `${label}.id`, 200); return;
  }
  if (value.kind === 'exploration') { exactKeys(value, ['kind'], label); return; }
  if (value.kind === 'localRecipeCopy') {
    exactKeys(value, ['kind', 'workspaceId', 'copyId', 'recipeId', 'recipeReference'], label);
    text(value.workspaceId, `${label}.workspaceId`, 200); text(value.copyId, `${label}.copyId`, 200);
    text(value.recipeId, `${label}.recipeId`, 200); text(value.recipeReference, `${label}.recipeReference`, 300); return;
  }
  if (value.kind === 'localFutureDraft') {
    exactKeys(value, ['kind', 'workspaceId', 'draftId', 'revision', 'contentReference'], label);
    text(value.workspaceId, `${label}.workspaceId`, 200); text(value.draftId, `${label}.draftId`, 200);
    if (!Number.isSafeInteger(value.revision) || (value.revision as number) < 1) fail(`${label}.revision invalide`);
    text(value.contentReference, `${label}.contentReference`, 300); return;
  }
  fail(`${label}.kind inconnu`);
}

export function brewerHopAdviceSourceViewReferenceV1(view: BrewerHopAdviceSourceViewV1): string {
  assertBrewerHopAdviceSourceViewV1(view);
  return hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1, sourceViewBody(view));
}

const SEMANTIC_READING_FORMAT_V1 = 'hop-v55-question-semantic-reading-v1' as const;
/** A future format is a different version under the same namespace; any other value stays invalid. */
const isFutureFormat = (value: unknown, prefix: string, current: string): value is string =>
  typeof value === 'string' && value.startsWith(prefix) && value !== current;
const isFutureRequestFormat = (value: unknown) => isFutureFormat(value, 'brewer-hop-advice-request-', BREWER_HOP_ADVICE_REQUEST_FORMAT_V3);
const isFutureViewFormat = (value: unknown) => isFutureFormat(value, 'hop-v55-source4-assistance-view-', BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1);
const isFutureArchiveFormat = (value: unknown) => isFutureFormat(value, 'hop-v55-decision-reading-', HOP_V55_DECISION_READING_FORMAT_V4);
const isFutureReadingFormat = (value: unknown) => isFutureFormat(value, 'hop-v55-question-semantic-reading-', SEMANTIC_READING_FORMAT_V1);

type SourceViewFutureChild = { reason: string; semanticKnown: boolean };

/**
 * Checks every part of a V1 view whose format is known. With `allowFutureChildren`, a future archive
 * identity or semantic reading stays opaque, and is reported only after the known keys, identity,
 * local derivation and exact view reference have been verified.
 */
function checkSourceViewV1(value: unknown, allowFutureChildren: boolean): SourceViewFutureChild | undefined {
  assertJson(value, 'sourceView');
  if (!isRow(value)) fail('sourceView illisible');
  exactKeys(value, ['format', 'archiveIdentity', 'semantic', 'scopeLedger', 'transition', 'lineage', 'programPreparation', 'localDerivations', 'reference'], 'sourceView');
  if (value.format !== BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1) fail('format sourceView différent de V1');
  const identity = value.archiveIdentity;
  if (!isRow(identity)) fail('archiveIdentity absent');
  exactKeys(identity, ['archiveFormat', 'id', 'ownerKey', 'workspaceId', 'recordedAt', 'source', 'runtimeReference', 'contentReference'], 'archiveIdentity');
  const futureArchive = identity.archiveFormat !== HOP_V55_DECISION_READING_FORMAT_V4;
  if (futureArchive && !(allowFutureChildren && isFutureArchiveFormat(identity.archiveFormat))) fail('archive sourceView doit identifier V4');
  text(identity.id, 'archiveIdentity.id', 200); text(identity.ownerKey, 'archiveIdentity.ownerKey', 200);
  text(identity.workspaceId, 'archiveIdentity.workspaceId', 200); text(identity.recordedAt, 'archiveIdentity.recordedAt', 100);
  if (!Number.isFinite(Date.parse(identity.recordedAt as string))) fail('archiveIdentity.recordedAt invalide');
  assertSourceIdentity(identity.source, 'archiveIdentity.source');
  text(identity.runtimeReference, 'archiveIdentity.runtimeReference', 300); text(identity.contentReference, 'archiveIdentity.contentReference', 300);

  const semantic = value.semantic;
  if (!isRow(semantic)) fail('sourceView.semantic absent');
  const futureSemantic = semantic.sourceFormat !== SEMANTIC_READING_FORMAT_V1;
  if (futureSemantic) {
    if (!(allowFutureChildren && isFutureReadingFormat(semantic.sourceFormat))) fail('sourceView semantic sourceFormat inconnu');
  } else {
    exactKeys(semantic, ['sourceFormat', 'intent', 'annotations', 'operationDrafts', 'projectionCoverage', 'correction', 'interpretation', 'branches', 'unresolved'], 'sourceView.semantic');
    const reading: Row = {
      format: semantic.sourceFormat, intent: clone(semantic.intent), annotations: clone(semantic.annotations),
      ...(semantic.operationDrafts === undefined ? {} : { operationDrafts: clone(semantic.operationDrafts) }),
      projectionCoverage: clone(semantic.projectionCoverage), ...(semantic.correction === undefined ? {} : { correction: clone(semantic.correction) }),
      interpretation: semantic.interpretation, branches: clone(semantic.branches), unresolved: clone(semantic.unresolved),
    };
    // The exact source4 reader validates all carried reading fields. Only the original response is absent here.
    assertHopV55SemanticQuestionReadingV1(reading);
  }
  const derivations = value.localDerivations;
  if (!isRow(derivations)) fail('localDerivations absent');
  exactKeys(derivations, ['readingResponse'], 'localDerivations');
  const response = derivations.readingResponse;
  if (!isRow(response)) fail('localDerivations.readingResponse absent');
  if (response.state === 'absent') exactKeys(response, ['state'], 'localDerivations.readingResponse');
  else if (response.state === 'localOnly') {
    exactKeys(response, ['state', 'path', 'reference'], 'localDerivations.readingResponse');
    if (response.path !== 'reading.response') fail('local response path inconnu');
    const reference = text(response.reference, 'localDerivations.readingResponse.reference', 180);
    if (!reference.startsWith(`${BREWER_HOP_ADVICE_LOCAL_READING_RESPONSE_REFERENCE_V1}:sha256:`)
      || !/^[a-f0-9]{64}$/.test(reference.slice(reference.lastIndexOf(':') + 1))) fail('référence de réponse locale mal formée');
  } else fail('état de lecture response inconnu');
  text(value.reference, 'sourceView.reference', 180);
  if (value.reference !== hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1, sourceViewBody(value as BrewerHopAdviceSourceViewV1))) {
    fail('sourceView.reference ne correspond pas au contenu exact de la vue');
  }
  // The exact shared metadata reader checks schemas and links, never the absent archive body.
  // A future metadata child is classified only after the known view integrity above.
  const metadata = readBrewerHopAdviceSourceViewMetadataV1(value);
  if (metadata.status === 'invalid') fail(metadata.reason);
  if (metadata.status === 'unsupportedReadOnly' && !allowFutureChildren) fail(metadata.reason);
  if (futureSemantic) return { reason: `Lecture source imbriquée future/inconnue : ${String(semantic.sourceFormat)}`, semanticKnown: false };
  if (futureArchive) return { reason: `Archive identifiée future/inconnue : ${String(identity.archiveFormat)}`, semanticKnown: true };
  if (metadata.status === 'unsupportedReadOnly') return { reason: metadata.reason, semanticKnown: true };
  return undefined;
}

export function assertBrewerHopAdviceSourceViewV1(value: unknown): asserts value is BrewerHopAdviceSourceViewV1 {
  checkSourceViewV1(value, false);
}

export function createBrewerHopAdviceSourceViewV1(sourceArchive: unknown): BrewerHopAdviceSourceViewV1 {
  return deepFreeze(sourceViewFromValidatedArchive(validatedSourceArchive(sourceArchive)));
}

export function assertBrewerHopAdviceSourceViewMatchesArchiveV1(sourceView: unknown, sourceArchive: unknown): void {
  assertBrewerHopAdviceSourceViewV1(sourceView);
  const projected = sourceViewFromValidatedArchive(validatedSourceArchive(sourceArchive));
  if (!sameJson(sourceView, projected)) fail('sourceView ne correspond pas à la projection exacte de l’archive locale complète');
}

export function createBrewerHopAdviceRequestV3(input: { sourceArchive: unknown; contextLaunch: unknown }): BrewerHopAdviceRequestV3 {
  const sourceArchive = validatedSourceArchive(input.sourceArchive);
  if (!isBrewerHopAdviceContextLaunchClaim(input.contextLaunch)) fail('contextLaunch V1 invalide');
  const contextLaunch = clone(input.contextLaunch);
  const request: BrewerHopAdviceRequestV3 = {
    format: BREWER_HOP_ADVICE_REQUEST_FORMAT_V3,
    question: sourceArchive.reading.intent.question,
    sourceReadingReference: sourceArchive.contentReference,
    contextLaunch,
    sourceView: sourceViewFromValidatedArchive(sourceArchive),
  };
  assertBrewerHopAdviceRequestV3(request);
  return deepFreeze(request);
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value as Row)) deepFreeze(child);
  return value;
}

/**
 * Checks every known part of a RequestV3. With `allowFutureChildren`, a future view, archive identity or
 * semantic reading is reported only after the outer request and each relation it can still be checked
 * against hold; corruption of a known part is never classified as future compatibility.
 */
function checkRequestV3(value: unknown, allowFutureChildren: boolean): string | undefined {
  if (!isRow(value)) fail('request illisible');
  exactKeys(value, ['format', 'question', 'sourceReadingReference', 'contextLaunch', 'sourceView'], 'RequestV3');
  if (value.format !== BREWER_HOP_ADVICE_REQUEST_FORMAT_V3) fail('format request différent de V3');
  text(value.question, 'question', 12000);
  text(value.sourceReadingReference, 'sourceReadingReference', 200);
  if (!isBrewerHopAdviceContextLaunchClaim(value.contextLaunch)) fail('contextLaunch V1 invalide');
  const launch = value.contextLaunch;
  const divergent = 'question/sourceView/contextLaunch owner/workspace/source/runtime/reference divergent';
  if (launch.sourceReadingReference !== value.sourceReadingReference) fail(divergent);
  if (allowFutureChildren && isRow(value.sourceView) && isFutureViewFormat(value.sourceView.format)) {
    assertJson(value.sourceView, 'sourceView');
    return `SourceView imbriquée future/inconnue : ${String(value.sourceView.format)}`;
  }
  const future = checkSourceViewV1(value.sourceView, allowFutureChildren);
  const view = value.sourceView as BrewerHopAdviceSourceViewV1;
  if (value.sourceReadingReference !== view.archiveIdentity.contentReference
    || launch.ownerKey !== view.archiveIdentity.ownerKey || launch.workspaceId !== view.archiveIdentity.workspaceId
    || launch.sourceRuntimeReference !== view.archiveIdentity.runtimeReference || !sameJson(launch.source, view.archiveIdentity.source)) {
    fail(divergent);
  }
  if ((!future || future.semanticKnown) && value.question !== view.semantic.intent.question) fail(divergent);
  return future?.reason;
}

export function assertBrewerHopAdviceRequestV3(value: unknown): asserts value is BrewerHopAdviceRequestV3 {
  checkRequestV3(value, false);
}

/** Declared future child of a known RequestV3, from its nested formats only; integrity is checked separately. */
function requestV3HasFutureChild(value: Row): boolean {
  const view = value.sourceView;
  if (!isRow(view)) return false;
  if (isFutureViewFormat(view.format)) return true;
  return view.format === BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1
    && (isRow(view.semantic) && isFutureReadingFormat(view.semantic.sourceFormat)
      || isRow(view.archiveIdentity) && isFutureArchiveFormat(view.archiveIdentity.archiveFormat)
      || readBrewerHopAdviceSourceViewMetadataV1(view).status === 'unsupportedReadOnly');
}

export function readBrewerHopAdviceRequestV3(value: unknown): BrewerHopAdviceRequestV3Read {
  if (!isRow(value)) return { status: 'invalid', reason: 'request illisible' };
  if (value.format === BREWER_HOP_ADVICE_REQUEST_FORMAT) {
    try { return { status: 'legacyReadOnly', version: 'v2', request: validateBrewerHopAdviceRequest(value) }; }
    catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'RequestV2 invalide' }; }
  }
  if (value.format !== BREWER_HOP_ADVICE_REQUEST_FORMAT_V3) {
    return isFutureRequestFormat(value.format)
      ? { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Format de request futur/inconnu : ${String(value.format)}` }
      : { status: 'invalid', reason: 'format request absent/inconnu' };
  }
  try {
    // Known outer integrity first: a future child is classified only once everything around it holds.
    const future = checkRequestV3(value, true);
    if (future !== undefined) return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: future };
    return { status: 'readOnly', request: deepFreeze(clone(value)) as BrewerHopAdviceRequestV3 };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'RequestV3 invalide' };
  }
}

export function brewerHopAdviceRequestV3Reference(requestValue: BrewerHopAdviceRequestV3): string {
  assertBrewerHopAdviceRequestV3(requestValue);
  return hopAdviceContentReference(BREWER_HOP_ADVICE_REQUEST_FORMAT_V3, requestValue);
}

export function brewerHopAdviceProviderInputV3(requestValue: BrewerHopAdviceRequestV3): BrewerHopAdviceProviderInputV3 {
  assertBrewerHopAdviceRequestV3(requestValue);
  return providerInputFromKnownView(requestValue.question, requestValue.sourceReadingReference, requestValue.sourceView);
}

function providerInputFromKnownView(question: string, sourceReadingReference: string,
  sourceView: Pick<BrewerHopAdviceSourceViewV1, 'semantic' | 'programPreparation' | 'localDerivations'>): BrewerHopAdviceProviderInputV3 {
  const { branches, operationDrafts, ...semanticReading } = clone(sourceView.semantic);
  const archivedReaderOutput = {
    provenance: 'source4ArchiveOnlyNotCurrentToolEvidenceOrPermission' as const,
    ...(operationDrafts === undefined ? {} : { operationDrafts: clone(operationDrafts) }),
    branches: clone(branches),
    ...(sourceView.programPreparation === undefined ? {} : { programPreparation: clone(sourceView.programPreparation) }),
    readingResponse: clone(sourceView.localDerivations.readingResponse),
  };
  return deepFreeze({ format: BREWER_HOP_ADVICE_PROVIDER_INPUT_FORMAT_V3,
    sourceReadingReference, question,
    semanticReading, archivedReaderOutput });
}

export function brewerHopAdviceProviderInputV3Reference(requestValue: BrewerHopAdviceRequestV3): string {
  return hopAdviceContentReference(BREWER_HOP_ADVICE_PROVIDER_INPUT_FORMAT_V3, brewerHopAdviceProviderInputV3(requestValue));
}

function semanticReadingForProjection(view: BrewerHopAdviceSourceViewV1): HopV55SemanticQuestionReadingV1 {
  return {
    format: view.semantic.sourceFormat, intent: clone(view.semantic.intent), annotations: clone(view.semantic.annotations),
    ...(view.semantic.operationDrafts === undefined ? {} : { operationDrafts: clone(view.semantic.operationDrafts) }),
    projectionCoverage: clone(view.semantic.projectionCoverage), ...(view.semantic.correction === undefined ? {} : { correction: clone(view.semantic.correction) }),
    interpretation: view.semantic.interpretation, branches: clone(view.semantic.branches), unresolved: clone(view.semantic.unresolved),
  };
}

function assertProjectedPropertyIntent(value: unknown, annotation: HopV55SemanticAnnotationV1, allIds: ReadonlySet<string>, label: string): asserts value is HopV55PropertyAdviceIntentV3 {
  if (!isRow(value)) fail(`${label} illisible`);
  exactKeys(value, ['id', 'property', 'label', 'familyId', 'partner', 'role', 'direction', 'qualification', 'required', 'comparisonBasis',
    'metric', 'subject', 'sourceSpans', 'interpretationOrigin', 'basis', 'relatedIntentIds', 'investigation'], label);
  if (value.id !== annotation.id || value.label !== annotation.term || value.interpretationOrigin !== (annotation.origin === 'brasseur' ? 'user' : 'proposal')) {
    fail(`${label} n’est pas la projection du même identifiant/terme/origine sémantique`);
  }
  if (value.familyId !== annotation.familyId) fail(`${label}.familyId diverge de la source4`);
  if (annotation.partner
    ? !sameJson(value.partner, { kind: 'freeContext', text: annotation.partner.text })
    : value.partner !== undefined) fail(`${label}.partner diverge de la source4`);
  if (!Array.isArray(value.sourceSpans) || !sameJson(value.sourceSpans, [annotation.source])) fail(`${label}.sourceSpans ne garde pas le fragment source exact`);
  if (!Array.isArray(value.relatedIntentIds) || !sameJson(value.relatedIntentIds, annotation.relatedAnnotationIds)) fail(`${label}.relatedIntentIds diverge des relations source4`);
  if (!['aroma', 'bitterness', 'sweetness', 'acidity', 'bioContribution', 'materialCharacter', 'unresolved'].includes(String(value.property))) fail(`${label}.property inconnu`);
  if (!['target', 'reportedObservation', 'measurement', 'investigation', 'preference', 'constraint'].includes(String(value.role))) fail(`${label}.role inconnu`);
  if (value.direction !== null && !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(value.direction))) fail(`${label}.direction inconnue`);
  if (value.qualification !== null && typeof value.qualification !== 'string') fail(`${label}.qualification invalide`);
  if (typeof value.required !== 'boolean' || !isRow(value.comparisonBasis)) fail(`${label}.engagement/base invalide`);
  exactKeys(value.comparisonBasis, ['kind', 'assertionIds'], `${label}.comparisonBasis`);
  if (!['qualitativeTarget', 'current', 'none'].includes(String(value.comparisonBasis.kind))) fail(`${label}.comparisonBasis.kind inconnu`);
  stringList(value.comparisonBasis.assertionIds, `${label}.comparisonBasis.assertionIds`, 80);
  if (!['sensory', 'pH', 'titratableAcidity', 'analyticalBU', 'unspecified'].includes(String(value.metric))) fail(`${label}.metric inconnue`);
  if (!isRow(value.subject)) fail(`${label}.subject absent`);
  exactKeys(value.subject, ['kind', 'label', 'materialId', 'sensoryContext'], `${label}.subject`);
  if (!['beer', 'material', 'culture', 'process', 'unspecified'].includes(String(value.subject.kind))
    || !isText(value.subject.label) || !(value.subject.materialId === null || isText(value.subject.materialId))
    || !['beer', 'rawHop', 'infusion', 'unspecified'].includes(String(value.subject.sensoryContext))) fail(`${label}.subject invalide`);
  if (value.subject.kind !== 'material' && value.subject.materialId !== null) fail(`${label}.subject.materialId incohérent`);
  const relatedIntentIds = stringList(value.relatedIntentIds, `${label}.relatedIntentIds`, 100);
  if ((value.role === 'investigation') !== (value.direction === 'investigate')) fail(`${label} investigation/direction incohérentes`);
  if (['reportedObservation', 'measurement'].includes(String(value.role)) && value.direction !== null) fail(`${label} observation/mesure porte une direction`);
  if (['keep', 'decrease'].includes(String(value.direction)) && value.comparisonBasis.kind !== 'current') fail(`${label} garde/baisse sans base current`);
  text(value.basis, `${label}.basis`, 500);
  if (value.investigation !== undefined) {
    if (!isRow(value.investigation)) fail(`${label}.investigation illisible`);
    exactKeys(value.investigation, ['kind', 'observationIntentIds'], `${label}.investigation`);
    if (value.investigation.kind !== 'comparePerceptualCompensation'
      || value.role !== 'investigation' || value.direction !== 'investigate'
      || !['sensory', 'unspecified'].includes(String(value.metric))) fail(`${label}.investigation perceptive incompatible`);
    const observations = stringList(value.investigation.observationIntentIds, `${label}.investigation.observationIntentIds`, 80);
    if (observations.some(id => !relatedIntentIds.includes(id) || !allIds.has(id))) fail(`${label}.investigation référence un constat non lié`);
  }
}

function sourceProjectionBody(value: BrewerHopAdviceSemanticSourcePropertyProjectionV3): Omit<BrewerHopAdviceSemanticSourcePropertyProjectionV3, 'reference'> {
  const { reference: _reference, ...body } = value;
  return body;
}

export function brewerHopAdviceSemanticSourcePropertyProjectionReferenceV3(value: BrewerHopAdviceSemanticSourcePropertyProjectionV3): string {
  assertBrewerHopAdviceSemanticSourcePropertyProjectionV3(value);
  return hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3, sourceProjectionBody(value));
}

function assertProjectionMatchesKnownSemantics(
  projection: Pick<BrewerHopAdviceSemanticSourcePropertyProjectionV3, 'sourceReadingReference' | 'propertyIntents'>,
  sourceReadingReference: string, annotations: readonly HopV55SemanticAnnotationV1[],
): void {
  if (projection.sourceReadingReference !== sourceReadingReference) fail('projection source détachée du sourceReadingReference RequestV3');
  const intents = projection.propertyIntents;
  if (intents.length !== annotations.length || intents.some((intent, index) => intent?.id !== annotations[index].id)) {
    fail('projection source doit conserver chaque annotation source4 exactement dans l’ordre');
  }
  const byId = new Map(intents.map(intent => [intent.id, intent]));
  for (let index = 0; index < intents.length; index++) assertProjectedPropertyIntent(intents[index], annotations[index], new Set(byId.keys()), `projection.propertyIntents[${index}]`);
  for (const intent of intents) for (const related of intent.relatedIntentIds) if (!byId.has(related)) fail(`projection relation orpheline ${related}`);
}

export function assertBrewerHopAdviceSemanticSourcePropertyProjectionV3(value: unknown, requestValue?: BrewerHopAdviceRequestV3): asserts value is BrewerHopAdviceSemanticSourcePropertyProjectionV3 {
  assertJson(value, 'projection source PropertyV3');
  if (!isRow(value)) fail('projection source PropertyV3 illisible');
  exactKeys(value, ['format', 'sourceReadingReference', 'propertyIntents', 'reference'], 'projection source PropertyV3');
  if (value.format !== BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3) fail('format de projection source inconnu');
  const sourceReadingReference = text(value.sourceReadingReference, 'projection.sourceReadingReference', 200);
  if (!Array.isArray(value.propertyIntents) || value.propertyIntents.length > 100) fail('projection.propertyIntents invalide');
  const intents = value.propertyIntents as HopV55PropertyAdviceIntentV3[];
  const ids = new Set(intents.map((intent) => intent?.id));
  if (ids.size !== intents.length || [...ids].some(id => !isText(id, 160))) fail('projection propriété: IDs absents ou répétés');
  if (requestValue) {
    assertBrewerHopAdviceRequestV3(requestValue);
    assertProjectionMatchesKnownSemantics({ sourceReadingReference, propertyIntents: intents },
      requestValue.sourceReadingReference, requestValue.sourceView.semantic.annotations);
  }
  text(value.reference, 'projection.reference', 180);
  if (value.reference !== hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3,
    sourceProjectionBody(value as BrewerHopAdviceSemanticSourcePropertyProjectionV3))) fail('référence de projection source altérée');
}

export function createBrewerHopAdviceSemanticSourcePropertyProjectionV3(input: {
  request: BrewerHopAdviceRequestV3;
  prepared: unknown;
}): BrewerHopAdviceSemanticSourcePropertyProjectionV3 {
  assertBrewerHopAdviceRequestV3(input.request);
  const reading = semanticReadingForProjection(input.request.sourceView);
  const propertyIntents = hopV55PropertyIntentsFromSemanticReadingV1(reading, input.prepared);
  const body = { format: BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3,
    sourceReadingReference: input.request.sourceReadingReference, propertyIntents };
  const projection = { ...body, reference: hopAdviceContentReference(BREWER_HOP_ADVICE_SOURCE_PROPERTY_PROJECTION_FORMAT_V3, body) };
  assertBrewerHopAdviceSemanticSourcePropertyProjectionV3(projection, input.request);
  return deepFreeze(clone(projection));
}

export type BrewerHopAdviceAnnotationReviewV5 = {
  annotationId: string;
  verdict: 'consistent' | 'revise' | 'dispute';
  reason: string;
};

export type BrewerHopAdvicePropertyIntentProposalV5 = {
  proposalId: string;
  kind: 'revise' | 'add';
  sourceAnnotationIds: string[];
  intent: HopV55PropertyAdviceIntentV3;
  motive: string;
  provenance: 'proposal';
  qualificationStatus: 'pendingLocalQualification';
};

export type BrewerHopAdviceSemanticRevisionProposalV5 = {
  proposalId: string;
  kind: 'revise' | 'reject' | 'add';
  sourceAnnotationIds: string[];
  sourceSpans: HopV55SemanticSpanV1[];
  proposedFields: Partial<Omit<HopV55SemanticAnnotationV1, 'id' | 'source' | 'origin'>>;
  motive: string;
  provenance: 'proposal';
};

export type BrewerHopAdviceSemanticProposalV5 = {
  annotationReviews: BrewerHopAdviceAnnotationReviewV5[];
  propertyIntentProposals: BrewerHopAdvicePropertyIntentProposalV5[];
  semanticRevisionProposals: BrewerHopAdviceSemanticRevisionProposalV5[];
  openQuestions: BrewerHopAdviceOpenQuestion[];
  materials: BrewerHopAdviceMaterialMention[];
  answer: BrewerHopAdviceAnswer;
};

export type BrewerHopAdviceServerContextV3 = BrewerHopAdviceAnswerServerContext;
export type BrewerHopAdviceEvidenceV5 = BrewerHopAdviceAnswerEvidence;

export type BrewerHopAdviceProposalEnvelopeV5 = {
  format: typeof BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5;
  status: 'proposal';
  requestSnapshot: BrewerHopAdviceRequestV3;
  sourcePropertyProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3;
  providerInputReference: string;
  proposal: BrewerHopAdviceSemanticProposalV5;
  evidence: BrewerHopAdviceEvidenceV5;
  serverContext: BrewerHopAdviceServerContextV3;
  reference: string;
};

export type BrewerHopAdviceProposalEnvelopeV5Read =
  | { status: 'readOnly'; envelope: BrewerHopAdviceProposalEnvelopeV5 }
  | { status: 'legacyReadOnly'; version: 'v4'; snapshot: unknown }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export type CreateBrewerHopAdviceProposalEnvelopeV5Input = {
  request: BrewerHopAdviceRequestV3;
  prepared: unknown;
  raw: unknown;
  evidence: readonly BrewerHopAdviceEvidenceSource[];
  serverContext: BrewerHopAdviceServerContextV3;
  readers?: BrewerHopAdviceEvidenceReaders;
};

const ASSIST_ID = /^assist-[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
const V5_PROPOSAL_KEYS = ['annotationReviews', 'propertyIntentProposals', 'semanticRevisionProposals', 'openQuestions', 'materials', 'answer'] as const;
const V5_INTENT_KEYS = ['id', 'property', 'label', 'familyId', 'partner', 'role', 'direction', 'qualification', 'required',
  'comparisonBasis', 'metric', 'subject', 'sourceSpans', 'basis', 'relatedIntentIds', 'investigation'] as const;
const SEMANTIC_ANNOTATION_PROPOSAL_KEYS = ['sense', 'term', 'requirement', 'direction', 'qualification', 'qualifierSource', 'note',
  'primitiveConvention', 'frameSource', 'guard', 'inquiry', 'mentionKind', 'subject', 'instrumentSource', 'familyId', 'dimension',
  'reportedProblem', 'lexicon', 'partner', 'relatedAnnotationIds'] as const;

/** Only these already validated semantic fields are needed, even if an archive version is future. */
type SemanticValidationSourceV1 = Pick<BrewerHopAdviceRequestV3, 'question' | 'contextLaunch'> & {
  sourceView: Pick<BrewerHopAdviceSourceViewV1, 'semantic'>;
};

function v5SourceAnnotations(request: SemanticValidationSourceV1): Map<string, HopV55SemanticAnnotationV1> {
  return new Map(request.sourceView.semantic.annotations.map(annotation => [annotation.id, annotation]));
}

/**
 * Neutral answer source of a validated RequestV3: exact question, every source4 annotation ID, the
 * guard/exclusion senses of source4 itself and the sealed launch scope. Nothing is projected to V2.
 */
function v5AnswerSource(request: SemanticValidationSourceV1): BrewerHopAdviceAnswerSourceV1 {
  const annotations = request.sourceView.semantic.annotations;
  return {
    question: request.question,
    relatedSourceIds: annotations.map(annotation => annotation.id),
    guardIds: annotations.filter(annotation => annotation.sense === 'guard' || annotation.sense === 'exclusion').map(annotation => annotation.id),
    launchScope: request.contextLaunch.expected.scope,
  };
}

function createV5Answer(input: Omit<CreateBrewerHopAdviceProposalEnvelopeV5Input, 'prepared'>): BrewerHopAdviceAnswerSections & {
  evidence: BrewerHopAdviceEvidenceV5; serverContext: BrewerHopAdviceServerContextV3;
} {
  return createBrewerHopAdviceAnswer({
    source: v5AnswerSource(input.request), raw: input.raw, relationKey: 'relatedIds', evidence: input.evidence,
    readers: input.readers ?? {}, serverContext: input.serverContext,
  });
}

function assertV5AncillaryInput(value: unknown): asserts value is Row {
  assertJson(value, 'arguments du finish V5');
  if (!isRow(value)) fail('Proposition sémantique V5 illisible');
  exactKeys(value, V5_PROPOSAL_KEYS, 'Proposition sémantique V5');
  if (!Array.isArray(value.openQuestions) || value.openQuestions.length > 6) fail('openQuestions doit contenir au plus six éléments');
  value.openQuestions.forEach((raw, index) => {
    const label = `openQuestions[${index}]`;
    if (!isRow(raw)) fail(`${label} illisible`);
    exactKeys(raw, ['id', 'kind', 'quotes', 'restatement', 'whyOpen', 'relatedIds'], label);
    if (!Array.isArray(raw.quotes) || raw.quotes.length < 1 || raw.quotes.length > 3) fail(`${label}.quotes invalide`);
    raw.quotes.forEach((quote, at) => { if (!isRow(quote)) fail(`${label}.quotes[${at}] illisible`); exactKeys(quote, ['text', 'occurrence'], `${label}.quotes[${at}]`); });
    stringList(raw.relatedIds, `${label}.relatedIds`, 20);
  });
  if (!Array.isArray(value.materials) || value.materials.length > 6) fail('materials doit contenir au plus six éléments');
  value.materials.forEach((raw, index) => {
    const label = `materials[${index}]`;
    if (!isRow(raw)) fail(`${label} illisible`);
    exactKeys(raw, ['id', 'quote', 'identity', 'candidates', 'note'], label);
    if (!isRow(raw.quote)) fail(`${label}.quote absent`);
    exactKeys(raw.quote, ['text', 'occurrence'], `${label}.quote`);
    if (!Array.isArray(raw.candidates) || raw.candidates.length > 4) fail(`${label}.candidates invalide`);
    raw.candidates.forEach((candidate, at) => { if (!isRow(candidate)) fail(`${label}.candidates[${at}] illisible`); exactKeys(candidate, ['materialId', 'evidenceId'], `${label}.candidates[${at}]`); });
  });
  if (!isRow(value.answer)) fail('answer absent');
  const answer = value.answer;
  exactKeys(answer, ['summary', 'readingNote', 'options', 'unknowns', 'program', 'refusals'], 'answer');
  if (!Array.isArray(answer.options) || answer.options.length < 1 || answer.options.length > 5) fail('answer.options invalide');
  answer.options.forEach((option, index) => {
    const label = `answer.options[${index}]`;
    if (!isRow(option)) fail(`${label} illisible`);
    exactKeys(option, ['id', 'kind', 'title', 'rationale', 'conditions', 'tradeoffs', 'relatedIds', 'evidenceIds', 'computed'], label);
    stringList(option.relatedIds, `${label}.relatedIds`, 12); stringList(option.evidenceIds, `${label}.evidenceIds`, 12);
  });
  if (!Array.isArray(answer.unknowns) || answer.unknowns.length > 3) fail('answer.unknowns invalide');
  answer.unknowns.forEach((unknown, index) => {
    const label = `answer.unknowns[${index}]`;
    if (!isRow(unknown)) fail(`${label} illisible`);
    exactKeys(unknown, ['id', 'question', 'changesChoice', 'relatedIds'], label);
    stringList(unknown.relatedIds, `${label}.relatedIds`, 12);
  });
  if (!isRow(answer.program)) fail('answer.program absent');
  exactKeys(answer.program, ['kind', 'evidenceId', 'branchId', 'note'], 'answer.program');
  if (!Array.isArray(answer.refusals) || answer.refusals.length > 4) fail('answer.refusals invalide');
  answer.refusals.forEach((refusal, index) => {
    const label = `answer.refusals[${index}]`;
    if (!isRow(refusal)) fail(`${label} illisible`);
    exactKeys(refusal, ['text', 'relatedIds'], label); stringList(refusal.relatedIds, `${label}.relatedIds`, 12);
  });
}

function exactSpan(value: unknown, question: string, label: string): HopV55SemanticSpanV1 {
  if (!isRow(value)) fail(`${label} absent`);
  exactKeys(value, ['start', 'end', 'text'], label);
  if (!Number.isSafeInteger(value.start) || !Number.isSafeInteger(value.end) || (value.start as number) < 0
    || (value.end as number) <= (value.start as number) || typeof value.text !== 'string'
    || question.slice(value.start as number, value.end as number) !== value.text) fail(`${label} n’est pas un span UTF-16 exact de la question`);
  return { start: value.start as number, end: value.end as number, text: value.text };
}

function allSourceSpans(annotation: HopV55SemanticAnnotationV1): HopV55SemanticSpanV1[] {
  return [annotation.source, annotation.qualifierSource, annotation.frameSource, annotation.subject?.source, annotation.instrumentSource]
    .filter((span): span is HopV55SemanticSpanV1 => span !== undefined);
}

function assertPropertyIntentProposalInput(value: unknown, sourceAnnotationIds: readonly string[], request: SemanticValidationSourceV1,
  sourceProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3, allProposedIds: ReadonlySet<string>, label: string): HopV55PropertyAdviceIntentV3 {
  if (!isRow(value)) fail(`${label} absent`);
  exactKeys(value, V5_INTENT_KEYS, label);
  const question = request.question;
  const sourceAnnotations = v5SourceAnnotations(request);
  const linkedAnnotations = sourceAnnotationIds.map(id => sourceAnnotations.get(id)!).filter(Boolean);
  const baselineById = new Map(sourceProjection.propertyIntents.map(intent => [intent.id, intent]));
  const allowedSpans = linkedAnnotations.flatMap(allSourceSpans);
  const spans = Array.isArray(value.sourceSpans) ? value.sourceSpans.map((span, index) => exactSpan(span, question, `${label}.sourceSpans[${index}]`)) : fail(`${label}.sourceSpans absent`);
  if (!spans.length || spans.length > 10) fail(`${label}.sourceSpans doit contenir de 1 à 10 fragments exacts`);
  if (linkedAnnotations.length && spans.some(span => !allowedSpans.some(allowed => sameJson(allowed, span)))) {
    fail(`${label}.sourceSpans doit rester dans les fragments des annotations liées`);
  }
  if (typeof value.id !== 'string' || !ASSIST_ID.test(value.id) || baselineById.has(value.id) || !allProposedIds.has(value.id)) {
    fail(`${label}.id doit être un ID proposal assist- unique, distinct des IDs source`);
  }
  if (!['aroma', 'bitterness', 'sweetness', 'acidity', 'bioContribution', 'materialCharacter', 'unresolved'].includes(String(value.property))) fail(`${label}.property invalide`);
  if (typeof value.label !== 'string' || !value.label.trim() || value.label.length > 300
    || (linkedAnnotations.length ? !linkedAnnotations.some(annotation => annotation.term === value.label) : !spans.some(span => span.text === value.label))) {
    fail(`${label}.label doit citer le terme source exact, sans libellé inféré`);
  }
  if (value.familyId !== undefined && (!isText(value.familyId, 120) || !linkedAnnotations.some(annotation => annotation.familyId === value.familyId))) {
    fail(`${label}.familyId doit provenir d’une annotation source liée`);
  }
  if (value.partner !== undefined) {
    if (!isRow(value.partner)) fail(`${label}.partner invalide`);
    const partner = value.partner as Row;
    exactKeys(partner, ['kind', 'text'], `${label}.partner`);
    const partnerText = text(partner.text, `${label}.partner.text`, 300);
    if (partner.kind !== 'freeContext' || !question.includes(partnerText)
      || (linkedAnnotations.length && !linkedAnnotations.some(annotation => annotation.partner?.text === partnerText))) {
      fail(`${label}.partner doit reprendre le contexte libre exact de l’annotation source`);
    }
    value.partner = { kind: 'freeContext', text: partnerText };
  }
  if (!['target', 'reportedObservation', 'measurement', 'investigation', 'preference', 'constraint'].includes(String(value.role))) fail(`${label}.role invalide`);
  if (value.direction !== null && !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(value.direction))) fail(`${label}.direction invalide`);
  if ((value.role === 'investigation') !== (value.direction === 'investigate')) fail(`${label} role/direction investigation incohérents`);
  if (['reportedObservation', 'measurement'].includes(String(value.role)) && value.direction !== null) fail(`${label} observation/mesure ne porte pas de direction`);
  if (value.role === 'measurement' && !linkedAnnotations.some(annotation => {
    const sourceIntent = baselineById.get(annotation.id);
    return sourceIntent?.role === 'measurement' && sourceIntent.metric === value.metric;
  })) fail(`${label} ne peut pas introduire une mesure absente de la projection source; qualification complète réservée au client`);
  if ((value.direction === 'keep' || value.direction === 'decrease') && !isRow(value.comparisonBasis)) fail(`${label} garde/baisse sans comparaisonBasis`);
  if (value.qualification !== undefined && value.qualification !== null && (typeof value.qualification !== 'string' || value.qualification.length > 300
    || !linkedAnnotations.some(annotation => annotation.qualification === value.qualification || annotation.qualifierSource?.text === value.qualification)
      && !spans.some(span => span.text === value.qualification))) fail(`${label}.qualification doit rester un qualificatif textuel source exact`);
  if (typeof value.required !== 'boolean') fail(`${label}.required invalide`);
  if (!isRow(value.comparisonBasis)) fail(`${label}.comparisonBasis absent`);
  exactKeys(value.comparisonBasis, ['kind', 'assertionIds'], `${label}.comparisonBasis`);
  if (!['qualitativeTarget', 'current', 'none'].includes(String(value.comparisonBasis.kind))) fail(`${label}.comparisonBasis.kind inconnu`);
  const assertionIds = stringList(value.comparisonBasis.assertionIds, `${label}.comparisonBasis.assertionIds`, 80);
  const knownAssertions = new Set(sourceProjection.propertyIntents.flatMap(intent => intent.comparisonBasis.assertionIds));
  if (assertionIds.some(id => !knownAssertions.has(id))) fail(`${label}.comparisonBasis ne peut introduire une assertion inconnue`);
  if (value.comparisonBasis.kind !== 'current' && assertionIds.length) fail(`${label}.comparisonBasis cible/none ne porte pas d’assertion`);
  if ((value.direction === 'keep' || value.direction === 'decrease') && value.comparisonBasis.kind !== 'current') fail(`${label} garde/baisse exige current`);
  if (!['sensory', 'pH', 'titratableAcidity', 'analyticalBU', 'unspecified'].includes(String(value.metric))) fail(`${label}.metric invalide`);
  if (!isRow(value.subject)) fail(`${label}.subject absent`);
  exactKeys(value.subject, ['kind', 'label', 'materialId', 'sensoryContext'], `${label}.subject`);
  if (!['beer', 'material', 'culture', 'process', 'unspecified'].includes(String(value.subject.kind)) || !isText(value.subject.label, 300)
    || !(value.subject.materialId === null || isText(value.subject.materialId, 200))
    || !['beer', 'rawHop', 'infusion', 'unspecified'].includes(String(value.subject.sensoryContext))) fail(`${label}.subject invalide`);
  const knownMaterials = new Set(sourceProjection.propertyIntents.map(intent => intent.subject.materialId).filter((id): id is string => !!id));
  if (value.subject.materialId !== null && !knownMaterials.has(value.subject.materialId as string)) fail(`${label}.subject.materialId absent de la projection locale`);
  if (value.subject.kind !== 'material' && value.subject.materialId !== null) fail(`${label}.subject.materialId incompatible`);
  if (typeof value.basis !== 'string' || !value.basis.trim() || value.basis.length > 500) fail(`${label}.basis invalide`);
  const relatedIntentIds = stringList(value.relatedIntentIds, `${label}.relatedIntentIds`, 100);
  if (relatedIntentIds.includes(value.id as string)) fail(`${label} ne peut se relier à elle-même`);
  const availableIntentIds = new Set([...baselineById.keys(), ...allProposedIds]);
  if (relatedIntentIds.some(id => !availableIntentIds.has(id))) fail(`${label}.relatedIntentIds contient un ID inconnu`);
  if (value.investigation !== undefined) {
    if (!isRow(value.investigation)) fail(`${label}.investigation illisible`);
    exactKeys(value.investigation, ['kind', 'observationIntentIds'], `${label}.investigation`);
    if (value.investigation.kind !== 'comparePerceptualCompensation' || value.role !== 'investigation' || value.direction !== 'investigate'
      || !['sensory', 'unspecified'].includes(String(value.metric))) fail(`${label}.investigation incompatible`);
    const observations = stringList(value.investigation.observationIntentIds, `${label}.investigation.observationIntentIds`, 80);
    for (const id of observations) {
      if (!relatedIntentIds.includes(id)) fail(`${label}.investigation observation doit aussi être liée`);
      const sourceIntent = baselineById.get(id);
      if (sourceIntent && (sourceIntent.role !== 'reportedObservation' || sourceIntent.metric !== 'sensory')) fail(`${label}.investigation référence un constat source non perceptif`);
    }
  }
  return { ...clone(value), sourceSpans: spans, relatedIntentIds, interpretationOrigin: 'proposal' } as unknown as HopV55PropertyAdviceIntentV3;
}

function assertSemanticProposedFields(value: unknown, kind: 'revise' | 'reject' | 'add', sourceIds: readonly string[],
  spans: readonly HopV55SemanticSpanV1[], request: SemanticValidationSourceV1, label: string): Partial<Omit<HopV55SemanticAnnotationV1, 'id' | 'source' | 'origin'>> {
  if (!isRow(value)) fail(`${label} absent`);
  exactKeys(value, SEMANTIC_ANNOTATION_PROPOSAL_KEYS, label);
  const sources = v5SourceAnnotations(request);
  const linked = sourceIds.map(id => sources.get(id)!).filter(Boolean);
  if (kind === 'reject') {
    if (Object.keys(value).length) fail(`${label} de rejet doit rester vide; le rejet est une suggestion, sans nouvelle annotation`);
    return {};
  }
  if (!Object.keys(value).length) fail(`${label} doit proposer au moins un champ`);

  const exactParts = linked.flatMap(allSourceSpans);
  if (linked.length && spans.some(span => !exactParts.some(part => sameJson(part, span)))) {
    fail(`${label} sourceSpans sort des champs source de l’annotation liée`);
  }
  const out: Row = {};
  if (value.sense !== undefined) {
    if (!['qualitativeTarget', 'directedChange', 'guard', 'exclusion', 'reportedObservation', 'investigation', 'nonDecision', 'mention'].includes(String(value.sense))) fail(`${label}.sense inconnu`);
    out.sense = value.sense;
  }
  if (value.term !== undefined) {
    const term = text(value.term, `${label}.term`, 200);
    if (linked.length ? !linked.some(annotation => annotation.term === term) : !spans.some(span => span.text === term)) {
      fail(`${label}.term doit citer le terme source exact`);
    }
    out.term = term;
  }
  if (value.requirement !== undefined) {
    if (!['required', 'optional'].includes(String(value.requirement))) fail(`${label}.requirement invalide`);
    out.requirement = value.requirement;
  }
  if (value.direction !== undefined) {
    if (value.direction !== null && !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(String(value.direction))) fail(`${label}.direction invalide`);
    out.direction = value.direction;
  }
  for (const key of ['qualification', 'note', 'reportedProblem'] as const) {
    if (value[key] !== undefined) {
      if (typeof value[key] !== 'string' || value[key].length > (key === 'qualification' ? 300 : 500)) fail(`${label}.${key} invalide`);
      out[key] = value[key];
    }
  }
  if (value.qualification !== undefined && value.qualification !== null
    && !linked.some(annotation => annotation.qualification === value.qualification || annotation.qualifierSource?.text === value.qualification)
    && !spans.some(span => span.text === value.qualification)) {
    fail(`${label}.qualification doit citer un qualificatif source exact`);
  }
  for (const key of ['qualifierSource', 'frameSource', 'instrumentSource'] as const) {
    if (value[key] !== undefined) {
      const parsed = exactSpan(value[key], request.question, `${label}.${key}`);
      if (linked.length && !exactParts.some(part => sameJson(part, parsed))) fail(`${label}.${key} doit rester dans un fragment source lié`);
      if (!linked.length && !spans.some(span => sameJson(span, parsed))) fail(`${label}.${key} doit être couvert par ses spans exacts`);
      out[key] = parsed;
    }
  }
  if (value.primitiveConvention !== undefined) {
    if (!['targetAsIncrease', 'targetAsInvestigation'].includes(String(value.primitiveConvention))) fail(`${label}.primitiveConvention inconnue`);
    out.primitiveConvention = value.primitiveConvention;
  }
  if (value.guard !== undefined) {
    if (!['preserve', 'noIncrease', 'noDecrease'].includes(String(value.guard))) fail(`${label}.guard invalide`);
    out.guard = value.guard;
  }
  if (value.inquiry !== undefined) {
    if (!['question', 'compensation', 'characterization'].includes(String(value.inquiry))) fail(`${label}.inquiry invalide`);
    out.inquiry = value.inquiry;
  }
  if (value.mentionKind !== undefined) {
    if (!['partnerPreference', 'contextNote'].includes(String(value.mentionKind))) fail(`${label}.mentionKind invalide`);
    out.mentionKind = value.mentionKind;
  }
  if (value.subject !== undefined) {
    if (!isRow(value.subject)) fail(`${label}.subject invalide`);
    exactKeys(value.subject, ['kind', 'source'], `${label}.subject`);
    if (!['beer', 'material', 'unspecified'].includes(String(value.subject.kind))) fail(`${label}.subject.kind invalide`);
    const subject: Row = { kind: value.subject.kind };
    if (value.subject.source !== undefined) {
      const span = exactSpan(value.subject.source, request.question, `${label}.subject.source`);
      if (linked.length && !exactParts.some(part => sameJson(part, span))) fail(`${label}.subject.source doit rester dans les fragments source liés`);
      if (!linked.length && !spans.some(part => sameJson(part, span))) fail(`${label}.subject.source doit être couvert par ses spans exacts`);
      subject.source = span;
    }
    out.subject = subject;
  }
  if (value.familyId !== undefined) out.familyId = text(value.familyId, `${label}.familyId`, 120);
  if (value.dimension !== undefined) out.dimension = text(value.dimension, `${label}.dimension`, 120);
  if (value.lexicon !== undefined) {
    if (!isRow(value.lexicon)) fail(`${label}.lexicon absent`);
    if (value.lexicon.status === 'lexicon') {
      exactKeys(value.lexicon, ['status', 'key'], `${label}.lexicon`);
      out.lexicon = { status: 'lexicon', ...(value.lexicon.key === undefined ? {} : { key: text(value.lexicon.key, `${label}.lexicon.key`, 100) }) };
    } else if (value.lexicon.status === 'proposedAlias') {
      exactKeys(value.lexicon, ['status', 'canonicalTerm', 'key'], `${label}.lexicon`);
      out.lexicon = { status: 'proposedAlias', canonicalTerm: text(value.lexicon.canonicalTerm, `${label}.lexicon.canonicalTerm`, 200),
        ...(value.lexicon.key === undefined ? {} : { key: text(value.lexicon.key, `${label}.lexicon.key`, 100) }) };
    } else if (value.lexicon.status === 'outOfLexicon' || value.lexicon.status === 'notAProperty') {
      exactKeys(value.lexicon, ['status'], `${label}.lexicon`); out.lexicon = { status: value.lexicon.status };
    } else fail(`${label}.lexicon.status invalide`);
  }
  if (value.partner !== undefined) {
    if (!isRow(value.partner)) fail(`${label}.partner invalide`);
    const partner = value.partner as Row;
    exactKeys(partner, ['kind', 'text'], `${label}.partner`);
    const partnerText = text(partner.text, `${label}.partner.text`, 300);
    if (partner.kind !== 'freeContext' || !request.question.includes(partnerText)
      || linked.length && !linked.some(annotation => annotation.partner?.text === partnerText)) fail(`${label}.partner n’est pas un contexte exact source`);
    out.partner = { kind: 'freeContext', text: partnerText };
  }
  if (value.relatedAnnotationIds !== undefined) {
    const related = stringList(value.relatedAnnotationIds, `${label}.relatedAnnotationIds`, 40);
    if (related.some(id => !sources.has(id) || id === sourceIds[0])) fail(`${label}.relatedAnnotationIds contient une annotation inconnue ou soi-même`);
    out.relatedAnnotationIds = related;
  }

  const effectiveSense = out.sense ?? (linked.length === 1 ? linked[0].sense : undefined);
  const effectiveRequirement = out.requirement ?? (linked.length === 1 ? linked[0].requirement : undefined);
  const effectiveDirection = out.direction !== undefined ? out.direction : (linked.length === 1 ? linked[0].direction : undefined);
  if (kind === 'add' && (effectiveSense === undefined || effectiveRequirement === undefined || effectiveDirection === undefined || out.term === undefined)) {
    fail(`${label} d’ajout doit préciser term, sense, requirement et direction`);
  }
  if (effectiveSense !== undefined && effectiveRequirement !== undefined && effectiveDirection !== undefined) {
    const rule = HOP_V55_SEMANTIC_SENSE_RULES[effectiveSense as HopV55SemanticSenseV1];
    if (!rule || !rule.requirement.includes(effectiveRequirement as 'required' | 'optional')
      || !rule.directions.includes(effectiveDirection as 'increase' | 'decrease' | 'keep' | 'exclude' | 'investigate' | null)) {
      fail(`${label} requirement/direction incompatibles avec son sense`);
    }
  }
  const candidateSense = effectiveSense;
  if ((candidateSense === 'guard') !== (out.guard !== undefined || linked.length === 1 && linked[0].guard !== undefined)) fail(`${label}.guard doit suivre le sense guard`);
  if ((candidateSense === 'investigation') !== (out.inquiry !== undefined || linked.length === 1 && linked[0].inquiry !== undefined)) fail(`${label}.inquiry doit suivre le sense investigation`);
  if (out.primitiveConvention !== undefined && candidateSense !== 'qualitativeTarget') fail(`${label}.primitiveConvention réservée à qualitativeTarget`);
  if (out.mentionKind !== undefined && candidateSense !== 'mention') fail(`${label}.mentionKind réservée à mention`);
  return out as Partial<Omit<HopV55SemanticAnnotationV1, 'id' | 'source' | 'origin'>>;
}

function normalizeSemanticProposalWithAnswer(rawValue: unknown, request: BrewerHopAdviceRequestV3,
  sourceProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3, sections: BrewerHopAdviceAnswerSections): BrewerHopAdviceSemanticProposalV5 {
  assertV5AncillaryInput(rawValue);
  assertBrewerHopAdviceRequestV3(request);
  assertBrewerHopAdviceSemanticSourcePropertyProjectionV3(sourceProjection, request);
  const sourceAnnotations = v5SourceAnnotations(request);
  const annotationReviews = (value: unknown): BrewerHopAdviceAnnotationReviewV5[] => {
    if (!Array.isArray(value) || value.length > 40) fail('annotationReviews doit contenir au plus 40 éléments');
    const seen = new Set<string>();
    return value.map((row, index) => {
      const label = `annotationReviews[${index}]`;
      if (!isRow(row)) fail(`${label} illisible`);
      exactKeys(row, ['annotationId', 'verdict', 'reason'], label);
      const annotationId = text(row.annotationId, `${label}.annotationId`, 160);
      if (!sourceAnnotations.has(annotationId) || seen.has(annotationId)) fail(`${label} vise un ID source4 absent ou répété`);
      seen.add(annotationId);
      if (!['consistent', 'revise', 'dispute'].includes(String(row.verdict))) fail(`${label}.verdict invalide`);
      return { annotationId, verdict: row.verdict as BrewerHopAdviceAnnotationReviewV5['verdict'], reason: text(row.reason, `${label}.reason`, 300) };
    });
  };
  if (!Array.isArray(rawValue.propertyIntentProposals) || rawValue.propertyIntentProposals.length > 12) fail('propertyIntentProposals invalide');
  const propertyRows = rawValue.propertyIntentProposals.map((row, index) => {
    const label = `propertyIntentProposals[${index}]`;
    if (!isRow(row)) fail(`${label} illisible`);
    exactKeys(row, ['proposalId', 'kind', 'sourceAnnotationIds', 'intent', 'motive'], label);
    const proposalId = text(row.proposalId, `${label}.proposalId`, 60);
    if (!ASSIST_ID.test(proposalId)) fail(`${label}.proposalId doit être assist-…`);
    if (!['revise', 'add'].includes(String(row.kind))) fail(`${label}.kind invalide`);
    const sourceAnnotationIds = stringList(row.sourceAnnotationIds, `${label}.sourceAnnotationIds`, 20);
    if (sourceAnnotationIds.some(id => !sourceAnnotations.has(id))) fail(`${label} référence une annotation source absente`);
    if (row.kind === 'revise' && !sourceAnnotationIds.length) fail(`${label} revise doit viser une annotation source`);
    if (isRow(row.intent) && hasOwn(row.intent, 'interpretationOrigin')) fail(`${label}.intent ne peut pas fournir interpretationOrigin`);
    const intentId = isRow(row.intent) ? row.intent.id : undefined;
    if (typeof intentId !== 'string' || !ASSIST_ID.test(intentId) || intentId === proposalId) fail(`${label}.intent.id doit être un ID proposal distinct`);
    return { label, row, proposalId, intentId, sourceAnnotationIds };
  });
  const rawRevisionProposals = rawValue.semanticRevisionProposals;
  if (!Array.isArray(rawRevisionProposals) || rawRevisionProposals.length > 12) fail('semanticRevisionProposals invalide');
  const semanticRows = rawRevisionProposals.map((row, index) => {
    const label = `semanticRevisionProposals[${index}]`;
    if (!isRow(row)) fail(`${label} illisible`);
    exactKeys(row, ['proposalId', 'kind', 'sourceAnnotationIds', 'sourceSpans', 'proposedFields', 'motive'], label);
    const proposalId = text(row.proposalId, `${label}.proposalId`, 60);
    if (!ASSIST_ID.test(proposalId)) fail(`${label}.proposalId doit être assist-…`);
    if (!['revise', 'reject', 'add'].includes(String(row.kind))) fail(`${label}.kind invalide`);
    const sourceAnnotationIds = stringList(row.sourceAnnotationIds, `${label}.sourceAnnotationIds`, 20);
    if (sourceAnnotationIds.some(id => !sourceAnnotations.has(id))) fail(`${label} référence une annotation source absente`);
    if (row.kind !== 'add' && !sourceAnnotationIds.length) fail(`${label}.kind ${String(row.kind)} doit viser une annotation source`);
    const sourceSpans = Array.isArray(row.sourceSpans) ? row.sourceSpans.map((span, at) => exactSpan(span, request.question, `${label}.sourceSpans[${at}]`)) : fail(`${label}.sourceSpans absent`);
    if (!sourceSpans.length || sourceSpans.length > 10) fail(`${label}.sourceSpans doit contenir 1 à 10 fragments exacts`);
    const linked = sourceAnnotationIds.map(id => sourceAnnotations.get(id)!);
    const allowed = linked.flatMap(allSourceSpans);
    if (linked.length && sourceSpans.some(span => !allowed.some(part => sameJson(part, span)))) fail(`${label}.sourceSpans sort des fragments des annotations liées`);
    const proposedFields = assertSemanticProposedFields(row.proposedFields, row.kind as 'revise' | 'reject' | 'add', sourceAnnotationIds, sourceSpans, request, `${label}.proposedFields`);
    return { label, row, proposalId, sourceAnnotationIds, sourceSpans, proposedFields };
  });
  assertV5OwnedIdsUnique([...propertyRows.flatMap(row => [row.proposalId, row.intentId as string]), ...semanticRows.map(row => row.proposalId)], sections);
  for (const id of [...propertyRows.map(row => row.proposalId), ...propertyRows.map(row => row.intentId!), ...semanticRows.map(row => row.proposalId)]) {
    if (!ASSIST_ID.test(id)) fail(`Identifiant de proposition invalide (${id})`);
  }
  const allPropertyProposalIntentIds = new Set(propertyRows.map(row => row.intentId!));
  const propertyIntentProposals = propertyRows.map(({ label, row, proposalId, sourceAnnotationIds }) => {
    const intent = assertPropertyIntentProposalInput(row.intent, sourceAnnotationIds, request, sourceProjection, allPropertyProposalIntentIds, `${label}.intent`);
    return { proposalId, kind: row.kind as 'revise' | 'add', sourceAnnotationIds, intent,
      motive: text(row.motive, `${label}.motive`, 500), provenance: 'proposal' as const,
      qualificationStatus: 'pendingLocalQualification' as const };
  });
  const semanticRevisionProposals = semanticRows.map(({ label, row, proposalId, sourceAnnotationIds, sourceSpans, proposedFields }) => ({
    proposalId, kind: row.kind as 'revise' | 'reject' | 'add', sourceAnnotationIds, sourceSpans, proposedFields,
    motive: text(row.motive, `${label}.motive`, 500), provenance: 'proposal' as const,
  }));
  for (const review of annotationReviews(rawValue.annotationReviews)) {
    if (review.verdict === 'revise' && !semanticRevisionProposals.some(proposal => proposal.kind === 'revise'
      && proposal.sourceAnnotationIds.includes(review.annotationId))) {
      fail(`annotationReviews ${review.annotationId} demande revise sans semanticRevisionProposal lié`);
    }
  }
  return {
    annotationReviews: annotationReviews(rawValue.annotationReviews), propertyIntentProposals, semanticRevisionProposals,
    openQuestions: clone(sections.openQuestions), materials: clone(sections.materials),
    answer: clone(sections.answer),
  };
}

/** Suggestion IDs and answer IDs share one namespace, at creation and on re-reading. */
function assertV5OwnedIdsUnique(suggestionIds: readonly string[], sections: BrewerHopAdviceAnswerSections): void {
  const allOwnedIds = [...suggestionIds,
    ...sections.openQuestions.map(row => row.id), ...sections.materials.map(row => row.id),
    ...sections.answer.options.map(row => row.id), ...sections.answer.unknowns.map(row => row.id)];
  if (new Set(allOwnedIds).size !== allOwnedIds.length) fail('Identifiant de proposition V5 répété entre réponses et révisions');
}

export function normalizeBrewerHopAdviceSemanticProposalV5(raw: unknown, request: BrewerHopAdviceRequestV3,
  sourceProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3, evidence: readonly BrewerHopAdviceEvidenceSource[],
  serverContext: BrewerHopAdviceServerContextV3, readers: BrewerHopAdviceEvidenceReaders = {}): BrewerHopAdviceSemanticProposalV5 {
  assertV5AncillaryInput(raw);
  assertBrewerHopAdviceRequestV3(request);
  const answer = createV5Answer({ request, raw, evidence, serverContext, readers });
  return normalizeSemanticProposalWithAnswer(raw, request, sourceProjection, answer);
}

function assertStoredSemanticProposalV5(value: unknown, request: SemanticValidationSourceV1,
  sourceProjection: BrewerHopAdviceSemanticSourcePropertyProjectionV3, evidence: unknown,
  serverContext: unknown): asserts value is BrewerHopAdviceSemanticProposalV5 {
  if (!isRow(value)) fail('proposal V5 archivée absente');
  exactKeys(value, V5_PROPOSAL_KEYS, 'proposal V5 archivée');
  const annotations = v5SourceAnnotations(request);
  if (!Array.isArray(value.annotationReviews) || value.annotationReviews.length > 40) fail('annotationReviews archivées invalides');
  const reviewed = new Set<string>();
  for (const [index, raw] of value.annotationReviews.entries()) {
    if (!isRow(raw)) fail(`annotationReviews[${index}] archivée illisible`);
    exactKeys(raw, ['annotationId', 'verdict', 'reason'], `annotationReviews[${index}]`);
    const id = text(raw.annotationId, `annotationReviews[${index}].annotationId`, 160);
    if (!annotations.has(id) || reviewed.has(id)) fail(`annotationReviews[${index}] vise un ID source absent ou répété`);
    reviewed.add(id);
    if (!['consistent', 'revise', 'dispute'].includes(String(raw.verdict))) fail(`annotationReviews[${index}].verdict invalide`);
    text(raw.reason, `annotationReviews[${index}].reason`, 300);
  }
  if (!Array.isArray(value.propertyIntentProposals) || value.propertyIntentProposals.length > 12) fail('propertyIntentProposals archivées invalides');
  const propRows = value.propertyIntentProposals.map((raw, index) => {
    const label = `propertyIntentProposals[${index}]`;
    if (!isRow(raw)) fail(`${label} archivée illisible`);
    exactKeys(raw, ['proposalId', 'kind', 'sourceAnnotationIds', 'intent', 'motive', 'provenance', 'qualificationStatus'], label);
    const proposalId = text(raw.proposalId, `${label}.proposalId`, 60);
    if (!ASSIST_ID.test(proposalId) || !['revise', 'add'].includes(String(raw.kind)) || raw.provenance !== 'proposal'
      || raw.qualificationStatus !== 'pendingLocalQualification') fail(`${label} provenance/état invalide`);
    const sourceAnnotationIds = stringList(raw.sourceAnnotationIds, `${label}.sourceAnnotationIds`, 20);
    if (sourceAnnotationIds.some(id => !annotations.has(id)) || raw.kind === 'revise' && !sourceAnnotationIds.length) fail(`${label} source annotation invalide`);
    if (!isRow(raw.intent)) fail(`${label}.intent archivée absente`);
    if (raw.intent.interpretationOrigin !== 'proposal') fail(`${label}.intent doit rester interpretationOrigin=proposal`);
    const { interpretationOrigin: _origin, ...inputIntent } = raw.intent;
    const intent = assertPropertyIntentProposalInput(inputIntent, sourceAnnotationIds, request, sourceProjection,
      new Set((value.propertyIntentProposals as unknown[]).flatMap(candidate => isRow(candidate) && isRow(candidate.intent) && typeof candidate.intent.id === 'string' ? [candidate.intent.id] : [])), `${label}.intent`);
    if (!sameJson(intent, raw.intent)) fail(`${label}.intent non canonique`);
    text(raw.motive, `${label}.motive`, 500);
    return { proposalId, intentId: intent.id };
  });
  if (!Array.isArray(value.semanticRevisionProposals) || value.semanticRevisionProposals.length > 12) fail('semanticRevisionProposals archivées invalides');
  const sourceRows = value.semanticRevisionProposals.map((raw, index) => {
    const label = `semanticRevisionProposals[${index}]`;
    if (!isRow(raw)) fail(`${label} archivée illisible`);
    exactKeys(raw, ['proposalId', 'kind', 'sourceAnnotationIds', 'sourceSpans', 'proposedFields', 'motive', 'provenance'], label);
    const proposalId = text(raw.proposalId, `${label}.proposalId`, 60);
    if (!ASSIST_ID.test(proposalId) || !['revise', 'reject', 'add'].includes(String(raw.kind)) || raw.provenance !== 'proposal') fail(`${label} provenance/format invalide`);
    const sourceAnnotationIds = stringList(raw.sourceAnnotationIds, `${label}.sourceAnnotationIds`, 20);
    if (sourceAnnotationIds.some(id => !annotations.has(id)) || raw.kind !== 'add' && !sourceAnnotationIds.length) fail(`${label} source annotation invalide`);
    if (!Array.isArray(raw.sourceSpans) || raw.sourceSpans.length === 0 || raw.sourceSpans.length > 10) fail(`${label}.sourceSpans invalide`);
    const sourceSpans = raw.sourceSpans.map((span, at) => exactSpan(span, request.question, `${label}.sourceSpans[${at}]`));
    const linked = sourceAnnotationIds.map(id => annotations.get(id)!);
    if (linked.length && sourceSpans.some(span => !linked.flatMap(allSourceSpans).some(part => sameJson(part, span)))) fail(`${label}.sourceSpans source invalide`);
    const proposedFields = assertSemanticProposedFields(raw.proposedFields, raw.kind as 'revise' | 'reject' | 'add', sourceAnnotationIds, sourceSpans, request, `${label}.proposedFields`);
    if (!sameJson(proposedFields, raw.proposedFields)) fail(`${label}.proposedFields non canonique`);
    text(raw.motive, `${label}.motive`, 500);
    return { proposalId };
  });
  const reviewedIds = new Set((value.annotationReviews as unknown[]).filter(isRow)
    .filter(row => row.verdict === 'revise').map(row => row.annotationId).filter((id): id is string => typeof id === 'string'));
  for (const annotationId of reviewedIds) {
    if (!sourceRows.some(row => {
      const raw = (value.semanticRevisionProposals as unknown[]).find(candidate => isRow(candidate) && candidate.proposalId === row.proposalId);
      return isRow(raw) && raw.kind === 'revise' && Array.isArray(raw.sourceAnnotationIds) && raw.sourceAnnotationIds.includes(annotationId);
    })) fail(`annotationReview ${annotationId} revise sans semanticRevisionProposal archivés`);
  }
  // Same neutral answer/evidence rules as at creation, against this RequestV3's own source.
  assertBrewerHopAdviceStoredAnswer({ openQuestions: value.openQuestions, materials: value.materials, answer: value.answer,
    evidence, serverContext }, v5AnswerSource(request));
  const semanticIds = [...propRows.flatMap(row => [row.proposalId, row.intentId]), ...sourceRows.map(row => row.proposalId)];
  if (new Set(semanticIds).size !== semanticIds.length) fail('IDs de propositions V5 répétés');
  assertV5OwnedIdsUnique(semanticIds, value as unknown as BrewerHopAdviceAnswerSections);
}

function envelopeV5Body(envelope: BrewerHopAdviceProposalEnvelopeV5): Omit<BrewerHopAdviceProposalEnvelopeV5, 'reference'> {
  const { reference: _reference, ...body } = envelope;
  return body;
}

export function brewerHopAdviceProposalEnvelopeV5Reference(envelope: BrewerHopAdviceProposalEnvelopeV5): string {
  assertBrewerHopAdviceProposalEnvelopeV5(envelope);
  return hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, envelopeV5Body(envelope));
}

export function createBrewerHopAdviceProposalEnvelopeV5(input: CreateBrewerHopAdviceProposalEnvelopeV5Input): BrewerHopAdviceProposalEnvelopeV5 {
  assertBrewerHopAdviceRequestV3(input.request);
  assertV5AncillaryInput(input.raw);
  const sourcePropertyProjection = createBrewerHopAdviceSemanticSourcePropertyProjectionV3({ request: input.request, prepared: input.prepared });
  const answer = createV5Answer({ request: input.request, raw: input.raw, evidence: input.evidence,
    serverContext: input.serverContext, readers: input.readers });
  const proposal = normalizeSemanticProposalWithAnswer(input.raw, input.request, sourcePropertyProjection, answer);
  const body = {
    format: BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, status: 'proposal' as const,
    requestSnapshot: clone(input.request), sourcePropertyProjection: clone(sourcePropertyProjection),
    providerInputReference: brewerHopAdviceProviderInputV3Reference(input.request), proposal,
    evidence: clone(answer.evidence), serverContext: clone(answer.serverContext),
  };
  const envelope: BrewerHopAdviceProposalEnvelopeV5 = { ...body,
    reference: hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5, body) };
  assertBrewerHopAdviceProposalEnvelopeV5(envelope);
  return deepFreeze(clone(envelope));
}

const V5_ENVELOPE_KEYS = ['format', 'status', 'requestSnapshot', 'sourcePropertyProjection', 'providerInputReference', 'proposal',
  'evidence', 'serverContext', 'reference'] as const;
const isContentReference = (value: unknown, namespace: string): boolean => typeof value === 'string'
  && value.startsWith(`${namespace}:sha256:`) && /^[a-f0-9]{64}$/.test(value.slice(namespace.length + ':sha256:'.length));

/** Keys, status and exact reference of a V5 envelope: known integrity whatever its nested request holds. */
function assertProposalEnvelopeV5Outer(value: unknown): asserts value is Row {
  assertJson(value, 'enveloppe proposal V5');
  if (!isRow(value)) fail('enveloppe proposal V5 illisible');
  exactKeys(value, V5_ENVELOPE_KEYS, 'enveloppe proposal V5');
  if (value.format !== BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5 || value.status !== 'proposal') fail('format/statut proposal V5 invalide');
  text(value.reference, 'proposalV5.reference', 180);
  if (value.reference !== hopAdviceContentReference(BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5,
    envelopeV5Body(value as unknown as BrewerHopAdviceProposalEnvelopeV5))) fail('reference proposal V5 altérée');
}

export function assertBrewerHopAdviceProposalEnvelopeV5(value: unknown): asserts value is BrewerHopAdviceProposalEnvelopeV5 {
  assertProposalEnvelopeV5Outer(value);
  assertBrewerHopAdviceRequestV3(value.requestSnapshot);
  assertBrewerHopAdviceSemanticSourcePropertyProjectionV3(value.sourcePropertyProjection, value.requestSnapshot);
  if (value.providerInputReference !== brewerHopAdviceProviderInputV3Reference(value.requestSnapshot)) fail('providerInputReference détachée de RequestV3');
  if (!isRow(value.serverContext)) fail('serverContext absent');
  assertStoredSemanticProposalV5(value.proposal, value.requestSnapshot, value.sourcePropertyProjection, value.evidence, value.serverContext);
}

/** Whether the nested request of a V5 envelope declares a future format, or carries a future child. */
function proposalV5HasFutureRequestChild(value: Row): boolean {
  const request = value.requestSnapshot;
  return isRow(request) && (isFutureRequestFormat(request.format)
    || request.format === BREWER_HOP_ADVICE_REQUEST_FORMAT_V3 && requestV3HasFutureChild(request));
}

/**
 * Known integrity around a future nested request child: envelope keys/reference, source projection and its
 * reference, provider-input reference form, proposal keys, evidence and server context, plus every relation
 * to the known outer request. Proposal content and provider input depend on the future child and stay opaque.
 */
function assertProposalEnvelopeV5AroundFutureChild(value: unknown): string {
  assertProposalEnvelopeV5Outer(value);
  const projection = value.sourcePropertyProjection;
  assertBrewerHopAdviceSemanticSourcePropertyProjectionV3(projection);
  if (!isContentReference(value.providerInputReference, BREWER_HOP_ADVICE_PROVIDER_INPUT_FORMAT_V3)) fail('providerInputReference mal formée');
  if (!isRow(value.proposal)) fail('proposal V5 archivée absente');
  exactKeys(value.proposal, V5_PROPOSAL_KEYS, 'proposal V5 archivée');
  const request = value.requestSnapshot as Row;
  let reason = `Request imbriquée future/inconnue : ${String(request.format)}`;
  let launch: { scope: unknown } | null = null;
  if (request.format === BREWER_HOP_ADVICE_REQUEST_FORMAT_V3) {
    const future = checkRequestV3(request, true);
    if (future === undefined) fail('RequestV3 imbriquée sans enfant futur confirmé');
    reason = future;
    if (projection.sourceReadingReference !== request.sourceReadingReference) fail('projection source détachée du sourceReadingReference RequestV3');
    launch = { scope: (request.contextLaunch as BrewerHopAdviceContextLaunchClaimV1).expected.scope };
  }
  assertBrewerHopAdviceStoredEvidenceContext({ evidence: value.evidence, serverContext: value.serverContext }, launch);
  const view = request.sourceView;
  if (request.format === BREWER_HOP_ADVICE_REQUEST_FORMAT_V3 && isRow(view)
    && view.format === BREWER_HOP_ADVICE_SOURCE_VIEW_FORMAT_V1 && isRow(view.semantic)
    && view.semantic.sourceFormat === SEMANTIC_READING_FORMAT_V1) {
    // checkRequestV3 already validated these fields. A future archive/ledger does not
    // make the current semantic reading, projection or proposal rules unknowable.
    const source: SemanticValidationSourceV1 = {
      question: request.question as string,
      contextLaunch: request.contextLaunch as BrewerHopAdviceContextLaunchClaimV1,
      sourceView: { semantic: view.semantic as BrewerHopAdviceSourceViewV1['semantic'] },
    };
    assertProjectionMatchesKnownSemantics(projection, request.sourceReadingReference as string, source.sourceView.semantic.annotations);
    const providerInput = providerInputFromKnownView(source.question, request.sourceReadingReference as string, {
      semantic: source.sourceView.semantic,
      localDerivations: view.localDerivations as BrewerHopAdviceSourceViewV1['localDerivations'],
      ...(view.programPreparation === undefined ? {} : { programPreparation: view.programPreparation }),
    });
    if (value.providerInputReference !== hopAdviceContentReference(BREWER_HOP_ADVICE_PROVIDER_INPUT_FORMAT_V3, providerInput)) {
      fail('providerInputReference détachée des champs connus de RequestV3');
    }
    assertStoredSemanticProposalV5(value.proposal, source, projection, value.evidence, value.serverContext);
  }
  return reason;
}

export function readBrewerHopAdviceProposalEnvelopeV5(value: unknown): BrewerHopAdviceProposalEnvelopeV5Read {
  if (!isRow(value)) return { status: 'invalid', reason: 'enveloppe illisible' };
  if (value.format === BREWER_HOP_ADVICE_PROPOSAL_FORMAT) {
    try { assertBrewerHopAdviceProposalEnvelope(value); return { status: 'legacyReadOnly', version: 'v4', snapshot: clone(value) }; }
    catch (error) { return { status: 'invalid', reason: error instanceof Error ? error.message : 'ProposalV4 invalide' }; }
  }
  if (value.format !== BREWER_HOP_ADVICE_PROPOSAL_FORMAT_V5) {
    return typeof value.format === 'string' && value.format.startsWith('brewer-hop-advice-proposal-')
      ? { status: 'unsupportedReadOnly', snapshot: clone(value), reason: `Format proposal futur/inconnu : ${value.format}` }
      : { status: 'invalid', reason: 'format proposal absent/inconnu' };
  }
  const request = value.requestSnapshot;
  if (isRow(request) && request.format === BREWER_HOP_ADVICE_REQUEST_FORMAT) {
    return { status: 'invalid', reason: 'Mélange connu refusé : une enveloppe ProposalV5 ne peut pas contenir RequestV2.' };
  }
  try {
    // Known outer integrity first: a future nested child never shields an altered known envelope.
    if (proposalV5HasFutureRequestChild(value)) {
      return { status: 'unsupportedReadOnly', snapshot: clone(value), reason: assertProposalEnvelopeV5AroundFutureChild(value) };
    }
    assertBrewerHopAdviceProposalEnvelopeV5(value);
    return { status: 'readOnly', envelope: deepFreeze(clone(value)) };
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'ProposalV5 invalide' };
  }
}

export function verifyBrewerHopAdviceSemanticEvidenceV5(envelope: BrewerHopAdviceProposalEnvelopeV5,
  turnEvidence: readonly BrewerHopAdviceEvidenceSource[], readers: Omit<BrewerHopAdviceEvidenceReaders, 'resolveEvidence'> = {}): void {
  assertBrewerHopAdviceProposalEnvelopeV5(envelope);
  verifyBrewerHopAdviceAnswerEvidence(envelope.evidence, turnEvidence, readers);
}

export function assertBrewerHopAdviceProposalV5MatchesSource(envelopeValue: unknown,
  requestValue: unknown): asserts envelopeValue is BrewerHopAdviceProposalEnvelopeV5 {
  assertBrewerHopAdviceProposalEnvelopeV5(envelopeValue);
  assertBrewerHopAdviceRequestV3(requestValue);
  const envelope = envelopeValue as BrewerHopAdviceProposalEnvelopeV5;
  if (!sameJson(envelope.requestSnapshot, requestValue)) fail('proposal V5 ne correspond pas à la RequestV3 exacte du lecteur');
}
