import { describe, expect, it } from 'vitest';
import { assertHopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { assertYeastCatalogue } from '../../functions/src/yeastCatalogueSchema';
import { agreedFermentationFact } from '../../functions/src/fermentationContext';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import core from '../../src/data/yeastCoreReferences.json';
import recipes from '../../src/data/yeastRecipeReferences.json';
import mangrove from '../../docs/research/yeast-enrichment/mangrove.json';
import nolo from '../../docs/research/yeast-enrichment/nolo.json';
import escarpment from '../../docs/research/yeast-enrichment/escarpment.json';
import styles from '../../docs/research/yeast-style-enrichment-supplement.json';
import { canonical, enrichYeastDataset, enrichYeastReference, selectImportReferences, validateSupplements } from '../../scripts/yeast-catalogue/enrichment.mjs';
import { catalogueHash } from '../../scripts/yeast-catalogue/parse.mjs';
import { encode, planCatalogueImport } from '../../scripts/yeast-catalogue/import-plan.mjs';

const packs = [mangrove, nolo, escarpment, styles];
const row = () => structuredClone(catalogue.find(y => y.id === 'yeast-fermentis-safbrew-la-01')!) as HopYeast;
const item = () => structuredClone(nolo.items.find(y => y.id === row().id)!);
const document = (data: HopYeast) => ({ name: `projects/test/databases/(default)/documents/hopKnowledge/${data.id}`,
  fields: encode(data).mapValue.fields, updateTime: '2026-09-12T00:00:00Z' });

describe('documentary yeast catalogue enrichment', () => {
  it('ships valid primary observations in every matching active data layer', () => {
    expect(() => validateSupplements(packs, catalogue, assertYeastCatalogue)).not.toThrow();
    for (const dataset of [catalogue, core, recipes]) {
      dataset.forEach(value => assertHopKnowledge(value, value.id));
      for (const addition of packs.flatMap(pack => pack.items)) {
        const active = dataset.find(value => value.id === addition.id);
        if (active) for (const fact of addition.facts) expect(active.catalogue.facts).toContainEqual(fact);
      }
    }
  });

  it('is idempotent across catalogue, core and recipe references', () => {
    for (const dataset of [catalogue, core, recipes]) {
      const result = enrichYeastDataset(dataset, packs);
      expect(result.changed).toEqual([]);
      expect(canonical(result.rows)).toBe(canonical(dataset));
    }
  });

  it('preserves personal fields and old observations without resolving a real contradiction', () => {
    const before = row(); before.name = 'Ma référence'; before.form = 'levain'; before.betaLyase = 'positive';
    const addition = item(), temperature = addition.facts.find(fact => fact.key === 'temperature')!;
    before.catalogue!.facts = [{ ...temperature, reported: '10–12 °C', range: { min: 10, max: 12 } } as any];
    const snapshot = structuredClone(before), merged = enrichYeastReference(before, addition);
    expect(before).toEqual(snapshot);
    expect(merged).toMatchObject({ name: 'Ma référence', form: 'levain', betaLyase: 'positive', source: before.source });
    expect(merged.catalogue.facts).toContainEqual(before.catalogue!.facts[0]);
    expect(merged.catalogue.facts).toContainEqual(temperature);
    expect(merged.catalogue.contentSha256).toBe(catalogueHash(merged.catalogue));
    expect(agreedFermentationFact(merged, 'temperature', '°C')).toBeUndefined();
  });

  it('rejects an uncollected source, invalid range, duplicate or unknown identity before integration', () => {
    const pack = () => ({ version: 1, collectedAt: nolo.collectedAt, items: [item()], gaps: [] });
    const noReceipt = pack(); noReceipt.items[0].facts[0].source.reference = 'https://example.com/uncollected';
    expect(() => validateSupplements([noReceipt], catalogue, assertYeastCatalogue)).toThrow(/collected primary source/);
    const invalid = pack(); invalid.items[0].facts.find(fact => fact.key === 'temperature')!.range = { min: 900, max: 1000 };
    expect(() => validateSupplements([invalid], catalogue, assertYeastCatalogue)).toThrow();
    const duplicate = pack(); duplicate.items.push(item());
    expect(() => validateSupplements([duplicate], catalogue, assertYeastCatalogue)).toThrow(/duplicate/);
    const unknown = pack(); unknown.items[0].id = 'not-a-catalogue-reference';
    expect(() => validateSupplements([unknown], catalogue, assertYeastCatalogue)).toThrow(/Unknown/);
  });

  it('rejects stale or ambiguous import selections instead of broadening the write scope', () => {
    const id = row().id;
    expect(selectImportReferences(catalogue, [id]).map(value => value.id)).toEqual([id]);
    for (const invalid of [[], [id, id], ['unknown-id'], [null]]) expect(() => selectImportReferences(catalogue, invalid)).toThrow();
  });

  it('fills a missing remote form even for an identical catalogue, preserving personal identity and preconditions', () => {
    const incoming = row(), previous = row(); delete previous.form; previous.name = 'Nom personnel';
    const old = document(previous), write = planCatalogueImport([incoming], [old]).writes[0];
    expect(write.fieldPaths).toEqual(['catalogue', 'form']);
    expect(write.updateTime).toBe(old.updateTime);
    expect(write.data).toMatchObject({ name: 'Nom personnel', form: 'sèche' });
    previous.form = 'levain';
    expect(planCatalogueImport([incoming], [document(previous)]).writes).toEqual([]);
  });

  it('skips a corrected remote catalogue and produces no second write after a valid import', () => {
    const incoming = row(), previous = row(); previous.catalogue!.facts[0].reported = 'Ma correction';
    const conflict = planCatalogueImport([incoming], [document(previous)]);
    expect(conflict.writes).toEqual([]); expect(conflict.conflicts).toHaveLength(1);
    delete previous.catalogue;
    const first = planCatalogueImport([incoming], [document(previous)]);
    expect(first.writes).toHaveLength(1);
    const second = planCatalogueImport([incoming], [document(first.writes[0].data)]);
    expect(second.writes).toEqual([]); expect(second.conflicts).toEqual([]);
    expect(second.unchanged).toEqual([incoming.id]);
  });
});
