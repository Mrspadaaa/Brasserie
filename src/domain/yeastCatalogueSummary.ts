import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';

const valueKey = (fact: YeastCatalogueFact) => fact.range
  ? JSON.stringify([fact.range.min, fact.range.max, fact.unit, fact.qualifier])
  : fact.reported.trim().toLocaleLowerCase('fr');

/** A headline must not silently prefer an older or a differently conditioned value. */
export function yeastCatalogueHeadline(facts: YeastCatalogueFact[]) {
  return (['temperature', 'attenuation'] as const).flatMap(key => {
    const values = facts.filter(fact => fact.key === key);
    if (!values.length) return [];
    const distinct = new Set(values.map(valueKey));
    return [{ key, label: key === 'temperature' ? 'Température' : 'Atténuation',
      compare: distinct.size > 1, fact: values[0] }];
  });
}

/** Identical numeric ranges from several sources need only one visual band. */
export function yeastCatalogueBands(facts: YeastCatalogueFact[]) {
  return [...new Map(facts.filter(fact => ['temperature', 'attenuation'].includes(fact.key) && fact.range && fact.qualifier === 'range')
    .map(fact => [`${fact.key}:${valueKey(fact)}`, fact])).values()].slice(0, 4);
}
