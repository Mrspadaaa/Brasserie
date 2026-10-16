import { sha256 } from '@noble/hashes/sha2.js';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';

/**
 * Explicit validation scope for one qualified-study operation.
 *
 * `capture` deep-clones a value, deep-freezes that private clone and validates
 * the frozen clone with the canonical strict validator supplied by the caller,
 * or proves it equal to an immutable snapshot already validated by that kind.
 * `has` recognises only the identity of a frozen clone created by this scope.
 * `validateCopy` proves fresh plain data equal to a private validated snapshot;
 * any changed/exotic value is strictly validated. All proofs end at `close()`.
 * This operation scope has no process-wide cache and never marks mutable input.
 *
 * `kind` must be a module-private symbol owned by the module that also owns the
 * canonical validator, so that no other caller can register a value under that
 * kind with a weaker validator.
 */
export class HopV55OperationValidationScope {
  private readonly validated = new Map<symbol, WeakSet<object>>();
  private readonly snapshots = new Map<symbol, unknown[]>();
  private open = true;

  capture<T>(kind: symbol, value: unknown, validate: (frozen: unknown) => void): T {
    if (!this.open) throw Error('Portée de validation fermée; recommencer une opération explicite.');
    let snapshot: unknown;
    try { snapshot = structuredClone(value); }
    catch (error) {
      // A non-clonable value keeps the canonical validator's own refusal.
      validate(value);
      throw error;
    }
    const immutable = deepFreeze(snapshot);
    const known = this.sameValidatedContent(kind, snapshot);
    if (!known) validate(snapshot);
    if (immutable && snapshot !== null && typeof snapshot === 'object') {
      this.kind(kind).add(snapshot);
      if (!known) this.remember(kind, snapshot);
    }
    return snapshot as T;
  }

  /**
   * Proves a freshly read copy by exact plain-data equality with a private,
   * immutable strictly validated snapshot. It never marks the mutable input.
   * Scope/owner/source/CAS checks still belong to the caller on every fresh read.
   */
  validateCopy(kind: symbol, value: unknown, validate: (value: unknown) => void): void {
    if (this.open && this.sameValidatedContent(kind, value)) return;
    validate(value);
    if (!this.open) return;
    try {
      const snapshot = structuredClone(value);
      if (deepFreeze(snapshot) && sameCanonicalData(value, snapshot)) this.remember(kind, snapshot);
    } catch { /* Non-plain/non-clonable data always keeps the strict path. */ }
  }

  /** True only for a frozen clone captured and validated by this still-open scope. */
  has(kind: symbol, value: unknown): boolean {
    return this.open && value !== null && typeof value === 'object' && Object.isFrozen(value)
      && (this.validated.get(kind)?.has(value) ?? false);
  }

  close(): void {
    this.open = false;
    this.validated.clear();
    this.snapshots.clear();
  }

  private sameValidatedContent(kind: symbol, value: unknown): boolean {
    try { return this.snapshots.get(kind)?.some(snapshot => sameCanonicalData(value, snapshot)) ?? false; }
    catch { return false; }
  }

  private remember(kind: symbol, snapshot: unknown): void {
    const rows = this.snapshots.get(kind) ?? [];
    if (!rows.includes(snapshot)) rows.push(snapshot);
    this.snapshots.set(kind, rows);
  }

  private kind(kind: symbol): WeakSet<object> {
    let rows = this.validated.get(kind);
    if (!rows) { rows = new WeakSet<object>(); this.validated.set(kind, rows); }
    return rows;
  }
}

/** Freezes plain data deeply; returns false when a value cannot be made immutable. */
function deepFreeze(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== 'object') return true;
  if (seen.has(value)) return true;
  seen.add(value);
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer || value instanceof Map
    || value instanceof Set || value instanceof Date) return false;
  let immutable = true;
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && 'value' in descriptor && !deepFreeze(descriptor.value, seen)) immutable = false;
  }
  Object.freeze(value);
  return immutable;
}

const isPlainObject = (value: object): boolean => {
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Exact equality restricted to JSON-like plain data. When it returns true, both
 * values have the same canonical JSON and therefore the same content
 * fingerprint and the same verdict from any content-only validator. `undefined`
 * is accepted only in the same position on both sides. Anything else (key
 * present on one side only, non-finite number, Date, Map, class instance,
 * accessor, array hole, function) returns false so that callers fall back to
 * their strict path.
 */
export function sameCanonicalData(left: unknown, right: unknown): boolean {
  if (typeof left !== typeof right) return false;
  switch (typeof left) {
    case 'undefined':
      return true;
    case 'string':
    case 'boolean':
      return left === right;
    case 'number':
      return Number.isFinite(left) && left === right;
    case 'object':
      break;
    default:
      return false;
  }
  if (left === null || right === null) return left === right;
  const a = left as object, b = right as object;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || Object.getPrototypeOf(a) !== Array.prototype
      || Object.getPrototypeOf(b) !== Array.prototype || a.length !== b.length) return false;
    for (let index = 0; index < a.length; index++) {
      const da = Object.getOwnPropertyDescriptor(a, index), db = Object.getOwnPropertyDescriptor(b, index);
      if (!da || !db || !('value' in da) || !('value' in db) || !sameCanonicalData(da.value, db.value)) return false;
    }
    return true;
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const leftKeys = Object.keys(a), rightKeys = Object.keys(b);
  if (leftKeys.length !== rightKeys.length) return false;
  for (const key of leftKeys) {
    const da = Object.getOwnPropertyDescriptor(a, key), db = Object.getOwnPropertyDescriptor(b, key);
    if (!da || !db || !db.enumerable || !('value' in da) || !('value' in db) || !sameCanonicalData(da.value, db.value)) return false;
  }
  return true;
}

/**
 * The existing canonical JSON and SHA-256, with fewer temporary objects for
 * large Q09 seals. A descriptor-only preflight first requires plain data;
 * exotic inputs retain the original canonical serializer and its refusals,
 * without observing their getters or toJSON during a speculative clone.
 * Memoized strings live only during this single serialization. References are
 * merely lookup hints: repeated subtrees are reused only after exact equality.
 */
function isPlainCanonicalData(value: unknown, active = new WeakSet<object>(), checked = new WeakSet<object>()): boolean {
  if (value === null || value === undefined || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value !== 'object') return false;
  if (active.has(value)) return false;
  if (checked.has(value)) return true;
  if (Array.isArray(value) ? Object.getPrototypeOf(value) !== Array.prototype : !isPlainObject(value)) return false;
  active.add(value);
  const keys = Array.isArray(value) ? Array.from({ length: value.length }, (_, index) => String(index)) : Object.keys(value);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || !('value' in descriptor) || !isPlainCanonicalData(descriptor.value, active, checked)) return false;
  }
  active.delete(value);
  checked.add(value);
  return true;
}

export function hopV55QualifiedContentReference(prefix: string, value: unknown): string {
  const unsupported = Symbol('not-plain-canonical-data');
  try {
    if (!isPlainCanonicalData(value)) throw unsupported;
    const references = new Map<string, Array<{ value: object; canonical: string }>>();
    const active = new WeakSet<object>();
    const arrayIndex = (key: string) => {
      const number = Number(key);
      return Number.isInteger(number) && number >= 0 && number < 4294967295 && String(number) === key;
    };
    const canonical = (item: unknown): string | undefined => {
      if (item === undefined) return undefined;
      if (item === null || typeof item === 'string' || typeof item === 'boolean'
        || typeof item === 'number' && Number.isFinite(item)) return JSON.stringify(item);
      if (typeof item !== 'object') throw unsupported;
      for (let prototype: object | null = item; prototype; prototype = Object.getPrototypeOf(prototype)) {
        const descriptor = Object.getOwnPropertyDescriptor(prototype, 'toJSON');
        if (descriptor && (!('value' in descriptor) || typeof descriptor.value === 'function')) throw unsupported;
      }
      if (active.has(item)) throw unsupported;
      const referenceDescriptor = !Array.isArray(item) ? Object.getOwnPropertyDescriptor(item, 'reference') : undefined;
      const reference = typeof referenceDescriptor?.value === 'string' ? referenceDescriptor.value as string : undefined;
      const prior = reference ? references.get(reference)?.find(row => sameCanonicalData(item, row.value)) : undefined;
      if (prior) return prior.canonical;
      active.add(item);
      let serialized: string;
      if (Array.isArray(item)) {
        serialized = '[' + item.map(row => canonical(row) ?? 'null').join(',') + ']';
      } else {
        const keys = Object.keys(item).sort();
        // Object.fromEntries in the original serializer promotes array-index
        // keys to numeric order before JSON.stringify, even after lexical sort.
        const indices = keys.filter(arrayIndex).sort((a, b) => Number(a) - Number(b));
        const others = keys.filter(key => !arrayIndex(key));
        const fields: string[] = [];
        for (const key of [...indices, ...others]) {
          const encoded = canonical((item as Record<string, unknown>)[key]);
          if (encoded !== undefined) fields.push(JSON.stringify(key) + ':' + encoded);
        }
        serialized = '{' + fields.join(',') + '}';
      }
      active.delete(item);
      if (reference) {
        const rows = references.get(reference) ?? [];
        rows.push({ value: item, canonical: serialized });
        references.set(reference, rows);
      }
      return serialized;
    };
    const serialized = canonical(value);
    if (serialized === undefined) throw unsupported;
    const digest = sha256(new TextEncoder().encode(serialized));
    return `${prefix}:sha256:${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  } catch { return hopAdviceContentReference(prefix, value); }
}
