import {
  readHopV55DecisionReadingArchiveV4MetadataForWizardV1,
  readHopV55DecisionReadingArchiveV4MetadataV1,
  type HopV55WizardDecisionReadingArchiveV4MetadataV1,
} from './brewerHopAdviceSemanticSource4.js';
import { readBrewerHopAdviceWizardSourceForWizardV1 } from './brewerHopAdviceContextBinding.js';
import type { BrewerHopAdviceWizardSourceV1 } from './brewerHopAdviceWizardSourceV1.js';

export type BrewerHopAdviceSourceViewMetadataV1 = {
  archiveIdentity: unknown;
  semantic: unknown;
  scopeLedger?: unknown;
  transition?: unknown;
  lineage?: unknown;
  programPreparation?: unknown;
};

export type BrewerHopAdviceSourceViewMetadataReadV1 =
  | { status: 'readOnly'; metadata: BrewerHopAdviceSourceViewMetadataV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

/** Metadata of a SourceView whose archive identity names the explicit Wizard child. */
export type BrewerHopAdviceWizardSourceViewMetadataV1 = Omit<BrewerHopAdviceSourceViewMetadataV1, 'archiveIdentity'> & {
  archiveIdentity: { source: BrewerHopAdviceWizardSourceV1; [key: string]: unknown };
};

export type BrewerHopAdviceWizardSourceViewMetadataReadV1 =
  | { status: 'readOnly'; metadata: HopV55WizardDecisionReadingArchiveV4MetadataV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

export class BrewerHopAdviceSourceViewMetadataUnsupportedError extends Error {
  readonly status = 'unsupportedReadOnly' as const;
  readonly snapshot: unknown;

  constructor(snapshot: unknown, reason: string) {
    super(reason);
    this.name = 'BrewerHopAdviceSourceViewMetadataUnsupportedError';
    this.snapshot = snapshot;
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const hasOwn = (value: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(value, key);

/** The metadata fields of an API-06 SourceView; the view's own format/derivations/reference stay outside. */
function metadataFields(value: Record<string, unknown>): Record<string, unknown> {
  return {
    archiveIdentity: value.archiveIdentity,
    semantic: value.semantic,
    ...(hasOwn(value, 'scopeLedger') ? { scopeLedger: value.scopeLedger } : {}),
    ...(hasOwn(value, 'transition') ? { transition: value.transition } : {}),
    ...(hasOwn(value, 'lineage') ? { lineage: value.lineage } : {}),
    ...(hasOwn(value, 'programPreparation') ? { programPreparation: value.programPreparation } : {}),
  };
}

/**
 * Project only the metadata fields from an API-06 SourceView and delegate all
 * metadata decisions to the exact source4 archive reader. This does not build
 * a V4 archive or recompute its contentReference.
 */
export function readBrewerHopAdviceSourceViewMetadataV1(value: unknown): BrewerHopAdviceSourceViewMetadataReadV1 {
  if (!isObject(value)) return { status: 'invalid', reason: 'SourceView metadata must be an object.' };
  const metadata = metadataFields(value);
  try {
    return readHopV55DecisionReadingArchiveV4MetadataV1(metadata);
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Source4 metadata is unreadable.' };
  }
}

/** Strict helper for known V1 SourceViews; callers needing future-format handling use the reader result. */
export function assertBrewerHopAdviceSourceViewMetadataV1(
  value: unknown,
): asserts value is BrewerHopAdviceSourceViewMetadataV1 {
  const result = readBrewerHopAdviceSourceViewMetadataV1(value);
  if (result.status === 'readOnly') return;
  if (result.status === 'unsupportedReadOnly') throw new BrewerHopAdviceSourceViewMetadataUnsupportedError(result.snapshot, result.reason);
  throw new Error(result.reason);
}

/**
 * Same projection, delegated to owner67's explicit Wizard V4 metadata reader. A source outside the Wizard
 * namespace is invalid before that reader may classify it; the source contentReference stays a syntactic
 * claim here, verified only where the canonical snapshot itself is present.
 */
export function readBrewerHopAdviceSourceViewMetadataV1ForWizardV1(value: unknown): BrewerHopAdviceWizardSourceViewMetadataReadV1 {
  if (!isObject(value)) return { status: 'invalid', reason: 'SourceView metadata must be an object.' };
  const metadata = metadataFields(value);
  if (isObject(metadata.archiveIdentity)
    && readBrewerHopAdviceWizardSourceForWizardV1(metadata.archiveIdentity.source).status === 'invalid') {
    return { status: 'invalid', reason: 'SourceView Wizard sans source Wizard V1 connue ni future de sa namespace.' };
  }
  try {
    return readHopV55DecisionReadingArchiveV4MetadataForWizardV1(metadata);
  } catch (error) {
    return { status: 'invalid', reason: error instanceof Error ? error.message : 'Source4 Wizard metadata is unreadable.' };
  }
}

export function assertBrewerHopAdviceSourceViewMetadataV1ForWizardV1(
  value: unknown,
): asserts value is BrewerHopAdviceWizardSourceViewMetadataV1 {
  const result = readBrewerHopAdviceSourceViewMetadataV1ForWizardV1(value);
  if (result.status === 'readOnly') return;
  if (result.status === 'unsupportedReadOnly') throw new BrewerHopAdviceSourceViewMetadataUnsupportedError(result.snapshot, result.reason);
  throw new Error(result.reason);
}
