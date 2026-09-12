import { catalogueHash } from './parse.mjs';

export const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const unique = values => [...new Map(values.map(value => [canonical(value), value])).values()];

/** Append reviewed documentary observations. Personal names/capabilities and old facts stay intact. */
export function enrichYeastReference(row, supplement) {
  if (row.id !== supplement.id || row.kind !== 'yeast' || !row.catalogue) throw Error(`Unknown catalogue identity: ${supplement.id}`);
  if (supplement.form && !['sèche', 'liquide'].includes(supplement.form)) throw Error(`Invalid yeast form: ${row.id}`);
  const facts = unique([...row.catalogue.facts, ...supplement.facts]);
  const catalogue = { ...row.catalogue, facts,
    documents: unique([...row.catalogue.documents, ...supplement.documents]),
    retrievals: unique([...row.catalogue.retrievals, ...supplement.retrievals]),
    // Only remove precise absence notices disproven by the additional observations.
    // Other limits and historical collection failures remain documented.
    gaps: row.catalogue.gaps.filter(gap =>
      !(gap === 'Statut POF non documenté dans les champs extraits.' && facts.some(fact => fact.key === 'pof')) &&
      !(gap === 'Température de fermentation non documentée dans les champs extraits.' && facts.some(fact => fact.key === 'temperature')))
  };
  catalogue.contentSha256 = catalogueHash(catalogue);
  return { ...row, ...(!row.form && supplement.form ? { form: supplement.form } : {}), catalogue };
}

/** All identities/provenance are checked before returning any proposed mutation. */
export function validateSupplements(supplements, references, assertCatalogue) {
  const known = new Map(references.map(row => [row.id, row])), ids = new Set();
  for (const supplement of supplements) {
    if (supplement?.version !== 1 || !Number.isFinite(Date.parse(supplement.collectedAt)) || !Array.isArray(supplement.items) || !Array.isArray(supplement.gaps)) throw Error('Invalid supplement envelope');
    const localIds = new Set();
    for (const item of supplement.items) {
      if (!known.has(item.id) || localIds.has(item.id)) throw Error(`Unknown or duplicate supplement identity: ${item.id}`);
      localIds.add(item.id); ids.add(item.id);
      if (!Array.isArray(item.facts) || !item.facts.length || !Array.isArray(item.documents) || !Array.isArray(item.retrievals) || !item.retrievals.length || typeof item.notes !== 'string' || !item.notes.trim()) throw Error(`Incomplete supplement: ${item.id}`);
      const fetched = new Set(item.retrievals.map(receipt => receipt.url));
      for (const fact of item.facts) {
        if (fact.source?.kind !== 'manufacturer' || !fetched.has(fact.source.reference)) throw Error(`Fact without a collected primary source: ${item.id}/${fact.key}`);
      }
      assertCatalogue(enrichYeastReference(known.get(item.id), item).catalogue);
    }
  }
  return ids;
}

export function enrichYeastDataset(references, supplements) {
  const byId = new Map();
  for (const supplement of supplements) for (const item of supplement.items) {
    byId.set(item.id, [...(byId.get(item.id) ?? []), item]);
  }
  const changed = [], rows = references.map(row => {
    const next = (byId.get(row.id) ?? []).reduce(enrichYeastReference, row);
    if (canonical(next) !== canonical(row)) changed.push({ id: row.id, factsAdded: next.catalogue.facts.length - row.catalogue.facts.length,
      formAdded: !row.form && !!next.form });
    return next;
  });
  return { rows, changed };
}

/** A typo or stale selection must fail before accessing the remote service. */
export function selectImportReferences(references, requestedIds) {
  if (!Array.isArray(requestedIds) || !requestedIds.length || requestedIds.some(id => typeof id !== 'string') || new Set(requestedIds).size !== requestedIds.length) throw Error('Non-empty unique import IDs required');
  const known = new Set(references.map(row => row.id));
  for (const id of requestedIds) if (!known.has(id)) throw Error(`Unknown import ID: ${id}`);
  const wanted = new Set(requestedIds);
  return references.filter(row => wanted.has(row.id));
}
