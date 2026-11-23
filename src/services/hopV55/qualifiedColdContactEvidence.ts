import type { HopColdBeerContext, HopColdContactAssessment } from '../../domain/hopDecision/coldIbuContact';
import { assessQualifiedColdHopContact, bindColdHopProgramContact, HopColdContactError } from '../../domain/hopDecision/coldIbuContact';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import {
  coldContactBeerContextReference,
  coldContactQualificationReference,
  createHopColdContactEvidenceV1,
  type HopColdContactEvidenceV1,
} from '../../domain/hopDecision/coldContactEvidence';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { HopQualifiedAssemblyInput } from '../../domain/hopDecision/qualifiedDecision';
import type { HopDecisionProgram } from '../../domain/hopDecision/types';
import { measureBrewerHopAdviceSemanticJsonWire } from '../../../functions/src/brewerHopAdviceSemanticV3';

/** Holds the complete closure of a documented catalogue lot (about 120 KB, never truncated); decision of 2026-10-08. */
export const HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES = 200_000 as const;
export const HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH = 18 as const;

export interface HopV55QualifiedColdContactSelectionV1 {
  /** A known reference, selected from current host-provided context; not a program payload. */
  programReference: string;
  /** A known reference to the exact qualified catalogue input the host can resolve. */
  qualificationReference: string;
  /** A known reference to the exact beer-context snapshot, including explicit null when absent. */
  contextReference: string;
  /** Nonempty IDs from the selected canonical program. */
  additionIds: string[];
  /** Why these selected lines are treated as one scenario contact, not a brewer declaration. */
  groupingReason: string;
}

export interface HopV55QualifiedColdContactCanonicalSourceV1<TScope = unknown> {
  ownerKey: string;
  scope: TScope;
  scopeReference: string;
  programReference: string;
  qualificationReference: string;
  contextReference: string;
  program: HopDecisionProgram;
  qualificationInput: HopQualifiedAssemblyInput;
  context?: HopColdBeerContext;
}

export interface HopV55QualifiedColdContactAuthorityV1<TScope = unknown> {
  /** Supplied by the host, never copied from model arguments. */
  ownerKey: string;
  /** Exact host scope object, passed only to the canonical resolver. */
  scope: TScope;
  /** Stable current reference for the host scope. */
  scopeReference: string;
  /** References actually offered in the current launch; arbitrary model strings are rejected. */
  knownReferences: {
    program: ReadonlySet<string>;
    qualification: ReadonlySet<string>;
    context: ReadonlySet<string>;
  };
  /** Resolves real canonical source records from the host. No fabricated fallback is permitted. */
  resolveCanonicalSource(input: {
    ownerKey: string;
    scope: TScope;
    scopeReference: string;
    programReference: string;
    qualificationReference: string;
    contextReference: string;
  }): HopV55QualifiedColdContactCanonicalSourceV1<TScope> | null | Promise<HopV55QualifiedColdContactCanonicalSourceV1<TScope> | null>;
}

export type HopV55QualifiedColdContactEvidenceResultV1 =
  | { status: 'ready'; evidence: HopColdContactEvidenceV1; payload: { utf8Bytes: number; maxDepth: number } }
  | { status: 'invalidSelection'; reason: string }
  | { status: 'unknownReference'; reference: 'program' | 'qualification' | 'context' }
  | { status: 'unavailable'; reason: string }
  | { status: 'staleSource'; mismatches: string[] }
  | { status: 'invalidCanonicalSource'; reason: string }
  | { status: 'invalidAssessment'; reason: string }
  | { status: 'tooLarge'; payload: { utf8Bytes: number; maxDepth: number }; maxBytes: 200000; maxDepth: 18 };

type Row = Record<string, unknown>;
const isRecord = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim() && value.trim() === value;
const exactKeys = (value: Row, keys: readonly string[]) => Object.keys(value).sort().join('|') === [...keys].sort().join('|');

function readSelection(value: unknown): HopV55QualifiedColdContactSelectionV1 | string {
  const keys = ['programReference', 'qualificationReference', 'contextReference', 'additionIds', 'groupingReason'];
  if (!isRecord(value) || !exactKeys(value, keys)
    || !isText(value.programReference) || !isText(value.qualificationReference) || !isText(value.contextReference)
    || !isText(value.groupingReason) || !Array.isArray(value.additionIds) || value.additionIds.length === 0
    || value.additionIds.some(id => !isText(id)) || new Set(value.additionIds).size !== value.additionIds.length) {
    return 'Choisis des ajouts non vides et des références connues; aucune dose, masse ou déclaration humaine ne peut être fournie par cette demande.';
  }
  return {
    programReference: value.programReference,
    qualificationReference: value.qualificationReference,
    contextReference: value.contextReference,
    additionIds: [...value.additionIds] as string[],
    groupingReason: value.groupingReason,
  };
}

function sourceMismatches<TScope>(selection: HopV55QualifiedColdContactSelectionV1,
  authority: HopV55QualifiedColdContactAuthorityV1<TScope>, source: HopV55QualifiedColdContactCanonicalSourceV1<TScope>): string[] {
  const mismatches: string[] = [];
  if (source.ownerKey !== authority.ownerKey) mismatches.push('ownerKey');
  if (source.scopeReference !== authority.scopeReference) mismatches.push('scopeReference');
  try {
    if (hopAdviceContentReference('hop-cold-contact-scope-equality-v1', source.scope)
      !== hopAdviceContentReference('hop-cold-contact-scope-equality-v1', authority.scope)) mismatches.push('scope');
  } catch {
    mismatches.push('scope');
  }
  if (source.programReference !== selection.programReference) mismatches.push('programReference');
  if (source.qualificationReference !== selection.qualificationReference) mismatches.push('qualificationReference');
  if (source.contextReference !== selection.contextReference) mismatches.push('contextReference');
  try {
    if (programFingerprint(source.program) !== source.programReference) mismatches.push('programContent');
  } catch {
    mismatches.push('programContent');
  }
  try {
    if (coldContactQualificationReference(source.qualificationInput) !== source.qualificationReference) mismatches.push('qualificationContent');
  } catch {
    mismatches.push('qualificationContent');
  }
  try {
    if (coldContactBeerContextReference(source.context) !== source.contextReference) mismatches.push('contextContent');
  } catch {
    mismatches.push('contextContent');
  }
  return mismatches;
}

/**
 * Read-only host seam for a model-selected grouping. It resolves the real source through the host,
 * derives the contact ID locally, and never accepts model-supplied programme/dose/owner/declaration.
 */
export async function prepareHopV55QualifiedColdContactEvidence<TScope>(input: {
  selection: unknown;
  authority: HopV55QualifiedColdContactAuthorityV1<TScope>;
}): Promise<HopV55QualifiedColdContactEvidenceResultV1> {
  const selection = readSelection(input.selection);
  if (typeof selection === 'string') return { status: 'invalidSelection', reason: selection };
  const { authority } = input;
  if (!isText(authority.ownerKey) || !isText(authority.scopeReference)
    || !authority.knownReferences.program.has(selection.programReference)) return { status: 'unknownReference', reference: 'program' };
  if (!authority.knownReferences.qualification.has(selection.qualificationReference)) return { status: 'unknownReference', reference: 'qualification' };
  if (!authority.knownReferences.context.has(selection.contextReference)) return { status: 'unknownReference', reference: 'context' };

  let source: HopV55QualifiedColdContactCanonicalSourceV1<TScope> | null;
  try {
    source = await authority.resolveCanonicalSource({ ownerKey: authority.ownerKey, scope: authority.scope,
      scopeReference: authority.scopeReference, programReference: selection.programReference,
      qualificationReference: selection.qualificationReference, contextReference: selection.contextReference });
  } catch {
    return { status: 'unavailable', reason: 'La source canonique courante du contact est indisponible.' };
  }
  if (!source) return { status: 'unavailable', reason: 'La source canonique courante du contact est indisponible.' };
  const mismatches = sourceMismatches(selection, authority, source);
  if (mismatches.length) return { status: 'staleSource', mismatches };

  let contact: ReturnType<typeof bindColdHopProgramContact>;
  try {
    const grouping = { kind: 'singleHomogeneousContact' as const, origin: 'scenarioAssumption' as const, reason: selection.groupingReason };
    const contactId = `cold-contact-selection-v1:${hopAdviceContentReference('hop-cold-contact-selection-v1', {
      programReference: selection.programReference, additionIds: selection.additionIds.slice().sort(),
    })}`;
    contact = bindColdHopProgramContact({ program: source.program, contactId, additionIds: selection.additionIds, grouping });
  } catch (error) {
    return { status: 'invalidSelection', reason: error instanceof HopColdContactError ? error.message
      : error instanceof Error ? error.message : 'Les IDs ne correspondent pas au programme canonique.' };
  }

  let assessment: HopColdContactAssessment;
  try {
    assessment = assessQualifiedColdHopContact({ program: source.program, contact, qualificationInput: source.qualificationInput,
      ...(source.context !== undefined ? { context: source.context } : {}) });
  } catch (error) {
    return { status: 'invalidAssessment', reason: error instanceof Error ? error.message : 'Le contact canonique n’a pas pu être évalué.' };
  }
  if (assessment.targetAssessment.valueBU !== null) {
    return { status: 'invalidAssessment', reason: 'La voie froide liée ne peut produire de BU cible.' };
  }

  let evidence: HopColdContactEvidenceV1;
  let payload: { utf8Bytes: number; maxDepth: number };
  try {
    evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: authority.ownerKey, scopeReference: authority.scopeReference });
    payload = measureBrewerHopAdviceSemanticJsonWire(evidence);
  } catch (error) {
    return { status: 'invalidAssessment', reason: error instanceof Error ? error.message : 'La preuve froide canonique est invalide.' };
  }
  if (payload.utf8Bytes > HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES || payload.maxDepth > HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH) {
    return { status: 'tooLarge', payload, maxBytes: HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES, maxDepth: HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH };
  }
  return { status: 'ready', evidence, payload };
}
