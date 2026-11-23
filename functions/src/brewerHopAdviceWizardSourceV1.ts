import { hopAdviceContentReference } from './hopAdviceContentReference.js';

export const BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1 = 'hop-v55-wizard-source-v1' as const;

const BREWER_HOP_ADVICE_WIZARD_SOURCE_KIND_V1 = 'wizardDraft' as const;
const RECIPE_CONTEXT_REFERENCE_NAMESPACE = 'hop-v55-recipe-step-draft-context-v1';
const WIZARD_ORIGIN_REFERENCE_NAMESPACE = 'hop-v55-wizard-origin-v1';
const SOURCE_KEYS = ['format', 'kind', 'ownerKey', 'workspaceId', 'draftId', 'contentReference'] as const;
const ORIGIN_KEYS = ['ownerKey', 'workspaceId', 'draftId'] as const;
const SNAPSHOT_KEYS = ['recipe', 'reference'] as const;
const CANONICAL_REFERENCE_PATTERN = /^hop-v55-recipe-step-draft-context-v1:sha256:[0-9a-f]{64}$/;

export interface BrewerHopAdviceWizardOriginV1 {
  ownerKey: string;
  workspaceId: string;
  draftId: string;
}

/** The full read-only Recipe projection and its existing canonical reference. */
export interface BrewerHopAdviceWizardCanonicalSnapshotV1 {
  recipe: unknown;
  reference: string;
}

/** Exact six-field source claim. The reference is integrity metadata, not authority. */
export interface BrewerHopAdviceWizardSourceV1 {
  format: typeof BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1;
  kind: typeof BREWER_HOP_ADVICE_WIZARD_SOURCE_KIND_V1;
  ownerKey: string;
  workspaceId: string;
  draftId: string;
  contentReference: string;
}

type BrewerHopAdviceWizardSourceV1Read =
  | { status: 'readOnly'; source: BrewerHopAdviceWizardSourceV1 }
  | { status: 'unsupportedReadOnly'; snapshot: unknown; reason: string }
  | { status: 'invalid'; reason: string };

type UnknownRecord = Record<string, unknown>;

function isPlainRecord(value: unknown): value is UnknownRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactDataRecord(value: unknown, expectedKeys: readonly string[]): value is UnknownRecord {
  if (!isPlainRecord(value)) return false;
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.length !== expectedKeys.length || ownKeys.some(key => typeof key !== 'string'
    || !expectedKeys.includes(key))) return false;
  return expectedKeys.every(key => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return !!descriptor && descriptor.enumerable && Object.prototype.hasOwnProperty.call(descriptor, 'value');
  });
}

function hasStablePart(value: unknown): value is string {
  return typeof value === 'string' && !!value.trim() && value.trim() === value && value.length <= 160
    && !/[\\/\u0000-\u001f]/.test(value);
}

function assertOrigin(value: unknown): asserts value is BrewerHopAdviceWizardOriginV1 {
  if (!exactDataRecord(value, ORIGIN_KEYS)
    || !hasStablePart(value.ownerKey)
    || !hasStablePart(value.workspaceId)
    || !hasStablePart(value.draftId)) {
    throw new Error('Origine de brouillon Wizard invalide.');
  }
}

/**
 * Check that the payload is a canonical-JSON-shaped projection without imposing
 * Recipe completeness rules. Undefined follows JSON serialization semantics;
 * NaN and other non-finite numbers do not belong in the already-canonical snapshot.
 */
function assertCanonicalJsonValue(value: unknown, ancestors = new Set<object>()): void {
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Snapshot Wizard non canonique.');
    return;
  }
  if (typeof value === 'bigint' || typeof value === 'function' || typeof value === 'symbol') {
    throw new Error('Snapshot Wizard non sérialisable.');
  }
  if (typeof value !== 'object') throw new Error('Snapshot Wizard non sérialisable.');
  if (ancestors.has(value)) throw new Error('Snapshot Wizard cyclique.');

  if (value instanceof Date) {
    if (Object.getPrototypeOf(value) !== Date.prototype || Reflect.ownKeys(value).length !== 0) {
      throw new Error('Snapshot Wizard non canonique.');
    }
    return;
  }

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      const ownKeys = Reflect.ownKeys(value).filter(key => key !== 'length');
      if (ownKeys.some(key => typeof key !== 'string' || !/^(0|[1-9]\d*)$/.test(key)
        || Number(key) >= value.length)) throw new Error('Snapshot Wizard non canonique.');
      for (let index = 0; index < value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
        if (!descriptor) continue;
        if (!descriptor.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
          throw new Error('Snapshot Wizard non canonique.');
        }
        assertCanonicalJsonValue(descriptor.value, ancestors);
      }
      return;
    }

    if (!isPlainRecord(value)) throw new Error('Snapshot Wizard non canonique.');
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some(key => typeof key !== 'string')) throw new Error('Snapshot Wizard non canonique.');
    for (const key of ownKeys as string[]) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (!descriptor || !descriptor.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, 'value')) {
        throw new Error('Snapshot Wizard non canonique.');
      }
      assertCanonicalJsonValue(descriptor.value, ancestors);
    }
  } finally {
    ancestors.delete(value);
  }
}

function assertSnapshot(value: unknown, origin: BrewerHopAdviceWizardOriginV1): asserts value is BrewerHopAdviceWizardCanonicalSnapshotV1 {
  if (!exactDataRecord(value, SNAPSHOT_KEYS) || typeof value.reference !== 'string'
    || !isPlainRecord(value.recipe) || value.recipe.id !== origin.draftId) {
    throw new Error('Snapshot canonique Wizard invalide ou étranger au brouillon.');
  }
  assertCanonicalJsonValue(value.recipe);

  let expectedReference: string;
  try {
    expectedReference = hopAdviceContentReference(RECIPE_CONTEXT_REFERENCE_NAMESPACE, {
      ownerKey: origin.ownerKey,
      draftId: origin.draftId,
      recipe: value.recipe,
    });
  } catch {
    throw new Error('Référence du snapshot canonique Wizard impossible à vérifier.');
  }
  if (value.reference !== expectedReference) {
    throw new Error('La référence ne correspond pas au snapshot canonique Wizard.');
  }
}

function assertKnownSource(value: unknown): asserts value is BrewerHopAdviceWizardSourceV1 {
  if (!exactDataRecord(value, SOURCE_KEYS)
    || value.format !== BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1
    || value.kind !== BREWER_HOP_ADVICE_WIZARD_SOURCE_KIND_V1
    || !hasStablePart(value.ownerKey)
    || !hasStablePart(value.workspaceId)
    || !hasStablePart(value.draftId)
    || typeof value.contentReference !== 'string'
    || !CANONICAL_REFERENCE_PATTERN.test(value.contentReference)) {
    throw new Error('Source Wizard V1 invalide.');
  }
}

function futureKnownFieldsAreValid(value: UnknownRecord): boolean {
  for (const key of ['ownerKey', 'workspaceId', 'draftId'] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && (!descriptor.enumerable || !Object.prototype.hasOwnProperty.call(descriptor, 'value')
      || !hasStablePart(descriptor.value))) return false;
  }
  const kind = Object.getOwnPropertyDescriptor(value, 'kind');
  if (kind && (!kind.enumerable || !Object.prototype.hasOwnProperty.call(kind, 'value')
    || kind.value !== BREWER_HOP_ADVICE_WIZARD_SOURCE_KIND_V1)) return false;
  const contentReference = Object.getOwnPropertyDescriptor(value, 'contentReference');
  if (contentReference && (!contentReference.enumerable
    || !Object.prototype.hasOwnProperty.call(contentReference, 'value')
    || typeof contentReference.value !== 'string'
    || !CANONICAL_REFERENCE_PATTERN.test(contentReference.value))) return false;
  return true;
}

function isFutureWizardSourceFormat(value: string): boolean {
  return value !== BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1
    && /^hop-v55-wizard-source-v[1-9][0-9]*$/.test(value);
}

/** Create a V1 source only from the canonical full recipe snapshot. */
export function createBrewerHopAdviceWizardSourceV1(input: {
  origin: BrewerHopAdviceWizardOriginV1;
  snapshot: BrewerHopAdviceWizardCanonicalSnapshotV1;
}): BrewerHopAdviceWizardSourceV1 {
  if (!exactDataRecord(input, ['origin', 'snapshot'])) throw new Error('Entrée de création Wizard invalide.');
  assertOrigin(input.origin);
  assertSnapshot(input.snapshot, input.origin);
  return {
    format: BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1,
    kind: BREWER_HOP_ADVICE_WIZARD_SOURCE_KIND_V1,
    ownerKey: input.origin.ownerKey,
    workspaceId: input.origin.workspaceId,
    draftId: input.origin.draftId,
    contentReference: input.snapshot.reference,
  };
}

/** Strictly read the known format; preserve a sound unknown future object untouched. */
export function readBrewerHopAdviceWizardSourceV1(raw: unknown): BrewerHopAdviceWizardSourceV1Read {
  try {
    if (!isPlainRecord(raw)) return { status: 'invalid', reason: 'Source Wizard absente ou non objet.' };
    const format = Object.getOwnPropertyDescriptor(raw, 'format');
    if (!format || !format.enumerable || !Object.prototype.hasOwnProperty.call(format, 'value')
      || !hasStablePart(format.value)) {
      return { status: 'invalid', reason: 'Format Wizard absent ou invalide.' };
    }
    if (format.value === BREWER_HOP_ADVICE_WIZARD_SOURCE_FORMAT_V1) {
      assertKnownSource(raw);
      return { status: 'readOnly', source: raw };
    }
    if (!isFutureWizardSourceFormat(format.value) || !futureKnownFieldsAreValid(raw)) {
      return { status: 'invalid', reason: 'Format Wizard étranger ou champ de liaison connu invalide.' };
    }
    return {
      status: 'unsupportedReadOnly',
      snapshot: raw,
      reason: 'Format Wizard futur conservé sans interprétation.',
    };
  } catch {
    return { status: 'invalid', reason: 'Source Wizard mal formée.' };
  }
}

/** Assert the exact six-field V1 shape and its canonical reference syntax. */
export function assertBrewerHopAdviceWizardSourceV1(raw: unknown): asserts raw is BrewerHopAdviceWizardSourceV1 {
  assertKnownSource(raw);
}

export function brewerHopAdviceWizardOriginV1(source: BrewerHopAdviceWizardSourceV1): BrewerHopAdviceWizardOriginV1 {
  assertKnownSource(source);
  return { ownerKey: source.ownerKey, workspaceId: source.workspaceId, draftId: source.draftId };
}

export function assertBrewerHopAdviceWizardSourceMatchesSnapshotV1(
  source: BrewerHopAdviceWizardSourceV1,
  snapshot: BrewerHopAdviceWizardCanonicalSnapshotV1,
): void {
  assertKnownSource(source);
  const origin = brewerHopAdviceWizardOriginV1(source);
  assertSnapshot(snapshot, origin);
  if (source.contentReference !== snapshot.reference) {
    throw new Error('La source Wizard ne correspond pas au snapshot canonique.');
  }
}

/** Stable draft scope follows the origin tuple, never the changing recipe content. */
export function mapBrewerHopAdviceWizardSourceToScopeV1(
  source: BrewerHopAdviceWizardSourceV1,
): { kind: 'draft'; id: string } {
  const origin = brewerHopAdviceWizardOriginV1(source);
  const reference = hopAdviceContentReference(WIZARD_ORIGIN_REFERENCE_NAMESPACE, origin);
  const digest = reference.slice(reference.lastIndexOf(':') + 1);
  return { kind: 'draft', id: `hop-v55-wizard-${digest}` };
}
