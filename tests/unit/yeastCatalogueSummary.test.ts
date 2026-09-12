import { describe, expect, it } from 'vitest';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import type { YeastCatalogueFact } from '../../functions/src/yeastCatalogueSchema';
import { yeastCatalogueBands, yeastCatalogueHeadline } from '../../src/domain/yeastCatalogueSummary';

const source = { title: 'Test', author: 'Fabricant', year: null, kind: 'manufacturer' as const, reference: 'https://example.com' };
const temperature = (reported: string, max = 22): YeastCatalogueFact => ({ key: 'temperature', label: 'Température', reported, source,
  range: { min: 16, max }, unit: '°C', qualifier: 'range' });
describe('yeast catalogue headlines', () => {
  it('signals the different LA-01 observations instead of selecting the first historical point', () => {
    const facts = catalogue.find(row => row.id === 'yeast-fermentis-safbrew-la-01')!.catalogue.facts as YeastCatalogueFact[];
    expect(yeastCatalogueHeadline(facts).find(group => group.key === 'attenuation')?.compare).toBe(true);
    expect(yeastCatalogueHeadline(facts).find(group => group.key === 'temperature')?.compare).toBe(false);
  });
  it('shows two identical temperature observations once and keeps attenuation visible', () => {
    const facts: YeastCatalogueFact[] = [temperature('16–22 °C'), temperature('16-22 °C (61-72 °F)'),
      { key: 'attenuation', label: 'Atténuation', reported: '73–85 %', range: { min: 73, max: 85 }, unit: '%', qualifier: 'range', source }];
    expect(yeastCatalogueHeadline(facts).map(group => [group.key, group.compare])).toEqual([['temperature', false], ['attenuation', false]]);
    expect(yeastCatalogueBands(facts)).toHaveLength(2);
  });
  it('keeps conflicting ranges separate in the visual comparison', () => {
    const facts = [temperature('16–22 °C'), temperature('16–25 °C', 25)];
    expect(yeastCatalogueHeadline(facts)[0].compare).toBe(true);
    expect(yeastCatalogueBands(facts)).toHaveLength(2);
  });
  it('does not invent a range for an empty or only qualitative record', () => {
    expect(yeastCatalogueHeadline([])).toEqual([]);
    const qualitative: YeastCatalogueFact = { key: 'attenuation', label: 'Atténuation', reported: 'High', source };
    expect(yeastCatalogueHeadline([qualitative])[0].fact.range).toBeUndefined();
    expect(yeastCatalogueBands([qualitative])).toEqual([]);
  });
});
