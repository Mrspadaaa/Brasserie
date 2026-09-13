import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import packedCatalogue from '../data/yeastCatalogueLibrary.json';

type PackedValue = null | boolean | number | string | PackedValue[];
type PackedCatalogue = {
  version: number; sourceSha256: string; entryCount: number;
  shapes: string[][]; nodes: PackedValue[]; root: PackedValue;
};
let cached: readonly HopYeast[] | undefined;

/** The full documentary catalogue, shared by client and server. Decode and
 * validate once, on demand. Nested sources are shared and frozen: copy a record
 * before editing it. Reading this library never imports records into storage. */
export function yeastCatalogueLibrary(): readonly HopYeast[] {
  if (cached) return cached;
  const pack = packedCatalogue as PackedCatalogue;
  const invalid = () => { throw Error('Bibliothèque de levures invalide : régénérer le catalogue.'); };
  if (pack.version !== 1 || !/^[a-f0-9]{64}$/.test(pack.sourceSha256)
    || !Number.isSafeInteger(pack.entryCount) || pack.entryCount < 0
    || !Array.isArray(pack.shapes) || !Array.isArray(pack.nodes)) invalid();
  for (const shape of pack.shapes) {
    if (!Array.isArray(shape) || shape.some(key => typeof key !== 'string') || new Set(shape).size !== shape.length) invalid();
  }
  const values: unknown[] = [];
  const decode = (node: PackedValue): unknown => {
    if (typeof node === 'number') {
      // The topological order excludes forward references and cycles.
      if (!Number.isSafeInteger(node) || node < 0 || node >= values.length) invalid();
      return values[node];
    }
    if (Array.isArray(node)) {
      const tag = node[0];
      if (tag === 0) return Object.freeze(node.slice(1).map(decode));
      if (tag === 1 && node.length === 2 && typeof node[1] === 'number' && Number.isFinite(node[1])) return node[1];
      if (tag === 2 && node.length === 1) return -0;
      const shape = typeof tag === 'number' && Number.isSafeInteger(tag) && tag >= 3 ? pack.shapes[tag - 3] : undefined;
      if (!shape || shape.length !== node.length - 1) invalid();
      return Object.freeze(Object.fromEntries(shape.map((key, index) => [key, decode(node[index + 1])])));
    }
    if (node !== null && typeof node !== 'string' && typeof node !== 'boolean') invalid();
    return node;
  };
  for (const node of pack.nodes) values.push(decode(node));
  const references = decode(pack.root);
  if (!Array.isArray(references) || references.length !== pack.entryCount) invalid();
  const ids = new Set<string>();
  for (const reference of references as unknown[]) {
    assertHopKnowledge(reference);
    if (reference.kind !== 'yeast' || ids.has(reference.id)) invalid();
    ids.add(reference.id);
  }
  cached = references as readonly HopYeast[];
  return cached;
}
