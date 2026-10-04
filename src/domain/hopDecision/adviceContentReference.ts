import { sha256 } from '@noble/hashes/sha2.js';

/** A synchronous content fingerprint, never an authorization or authenticity proof. */
export function hopAdviceContentReference(prefix: string, value: unknown): string {
  const canonical = JSON.stringify(value, (_key, item) => {
    if (typeof item === 'number' && !Number.isFinite(item)) throw Error('Une référence ne peut contenir de nombre non fini.');
    if (typeof item === 'bigint' || typeof item === 'function' || typeof item === 'symbol') throw Error('Contenu de référence non sérialisable.');
    return item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item;
  });
  if (canonical === undefined) throw Error('Contenu de référence absent.');
  const digest = sha256(new TextEncoder().encode(canonical));
  return `${prefix}:sha256:${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}`;
}
