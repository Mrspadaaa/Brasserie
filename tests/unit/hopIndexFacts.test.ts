import { describe, expect, it } from 'vitest';
import { assertHopDocument, hopMeasurementError } from '../../functions/src/hopIndexSchema';
import { resolveHopFacts, searchHopVarieties } from '../../src/domain/hopIndex/facts';
import { hopTestLot, hopTestMeasurement, hopTestVariety } from '../fixtures/hopIndex';

describe('Résolution documentaire de houblon', () => {
  it('résout chaque champ séparément sans mutation et garde la provenance du COA', () => {
    const lot = hopTestLot(), variety = hopTestVariety();
    const before = JSON.stringify({ lot, variety });
    const facts = resolveHopFacts(lot, variety);
    expect(facts.find(f => f.analyte === 'alpha')).toMatchObject({ origin: 'lot', range: { min: 6.8, max: 7.2 }, measurement: { source: { kind: 'coa' } } });
    expect(facts.find(f => f.analyte === 'totalOil')).toMatchObject({ origin: 'variety', range: { min: 1, max: 3 } });
    expect(facts.find(f => f.analyte === '3mhGsh')).toMatchObject({ origin: 'unknown', range: null, confidence: 'low' });
    expect(JSON.stringify({ lot, variety })).toBe(before);
    expect(lot.analysis).toHaveLength(1);
  });
  it('conserve zéro et la non-détection, sans inventer l’incertitude manquante', () => {
    for (const observation of [hopTestMeasurement({ kind: 'point', value: 0, range: undefined }),
      hopTestMeasurement({ kind: 'below', range: undefined })]) {
      expect(resolveHopFacts(hopTestLot({ analysis: [observation] }), hopTestVariety())[0]).toMatchObject({ origin: 'lot', range: null, confidence: 'low' });
    }
    const bounded = hopTestMeasurement({ kind: 'below', range: undefined, limit: 0.5, limitKind: 'loq' });
    expect(resolveHopFacts(hopTestLot({ analysis: [bounded] }), hopTestVariety())[0].range).toEqual({ min: 0, max: 0.5 });
  });
  it('ne tronque pas un COA hors de la plage variétale', () => {
    const fact = resolveHopFacts(hopTestLot({ analysis: [hopTestMeasurement({ range: { min: 12, max: 13 } })] }), hopTestVariety())[0];
    expect(fact.range).toEqual({ min: 12, max: 13 });
    expect(fact.reasons.join(' ')).toContain('hors de la plage');
  });
  it('écarte les formes incompatibles ; une année manquante réduit la confiance sans changer les unités', () => {
    const facts = resolveHopFacts(hopTestLot({ form: 'cryo', analysis: [] }), hopTestVariety());
    expect(facts[0]).toMatchObject({ origin: 'variety', compatible: false, confidence: 'low' });
    const measurement = hopTestMeasurement(); measurement.source = { ...measurement.source, year: null };
    expect(resolveHopFacts(hopTestLot({ analysis: [measurement] }), hopTestVariety())[0]).toMatchObject({ compatible: true, confidence: 'low' });
  });
  it('une mauvaise référence ou une mesure invalide ne fait pas échouer le reste', () => {
    expect(resolveHopFacts(hopTestLot(), hopTestVariety({ id: 'other' })).find(f => f.analyte === 'totalOil')?.origin).toBe('unknown');
    const facts = resolveHopFacts(hopTestLot({ analysis: [hopTestMeasurement({ range: { min: 9, max: 3 } })] }), hopTestVariety());
    expect(facts[0].origin).toBe('variety');
    expect(facts[0].reasons.join(' ')).toContain('inexploitable');
  });
  it('une modification de variété change uniquement les champs hérités', () => {
    const lot = hopTestLot(), changed = hopTestVariety({ analysis: [hopTestMeasurement({ range: { min: 1, max: 2 } }),
      hopTestMeasurement({ analyte: 'totalOil', unit: 'ml100g', range: { min: 2, max: 4 } })] });
    expect(resolveHopFacts(lot, changed)[0].range).toEqual({ min: 6.8, max: 7.2 });
    expect(resolveHopFacts(lot, changed)[2].range).toEqual({ min: 2, max: 4 });
  });
  it('cherche sans accents dans les alias et descriptions, en excluant les archives par défaut', () => {
    const variety = hopTestVariety();
    expect(searchHopVarieties([variety], 'reference ALPHA')).toEqual([variety]);
    expect(searchHopVarieties([variety], 'agrumes')).toEqual([variety]);
    expect(searchHopVarieties([{ ...variety, archived: true }], '')).toEqual([]);
    expect(searchHopVarieties([{ ...variety, archived: true }], '', true)).toHaveLength(1);
  });
});

describe('Contrat analytique partagé', () => {
  it('conserve séparément 3SH, son acétate et les esters, sans convertir une unité semi-quantitative', () => {
    const acetate = hopTestMeasurement({ analyte: '3mhaFree', unit: 'ngL', basis: 'beer', kind: 'point', value: 8, range: undefined });
    const ester = hopTestMeasurement({ analyte: '2methylbutylIsobutyrate', unit: 'ugL', basis: 'beer', range: { min: 20, max: 30 } });
    const lactone = hopTestMeasurement({ analyte: 'gammaNonalactone', unit: 'ugLInternalStandardEquivalent', basis: 'beer', range: { min: 40, max: 60 } });
    const result = resolveHopFacts(hopTestLot({ analysis: [acetate, ester, lactone] }), hopTestVariety());
    expect(result.find(f => f.analyte === '3mhaFree')).toMatchObject({ origin: 'lot', range: null, confidence: 'low' });
    expect(result.find(f => f.analyte === '3mhFree')).toMatchObject({ origin: 'unknown', range: null });
    expect(result.find(f => f.analyte === '2methylbutylIsobutyrate')).toMatchObject({ compatible: true, range: { min: 20, max: 30 }, measurement: { unit: 'ugL' } });
    expect(result.find(f => f.analyte === 'gammaNonalactone')).toMatchObject({ compatible: false, measurement: { unit: 'ugLInternalStandardEquivalent' } });
    expect(hopMeasurementError({ ...ester, basis: 'asIs' })).toBeTruthy();
    expect(hopMeasurementError({ ...ester, unit: 'ugKgThiolEquivalent', basis: 'asIs' })).toBeTruthy();
    expect(hopMeasurementError({ ...lactone, unit: 'ugKgThiolEquivalent', basis: 'asIs' })).toBeTruthy();
  });
  it('sépare les équivalents d’étalon, les équivalents thiol libre et les indices', () => {
    const internal = hopTestMeasurement({ analyte: 'geraniol', unit: 'ugLInternalStandardEquivalent', basis: 'beer' });
    expect(hopMeasurementError(internal)).toBeNull();
    const resolved = resolveHopFacts(hopTestLot({ analysis: [internal] }), hopTestVariety()).find(f => f.analyte === 'geraniol')!;
    expect(resolved.compatible).toBe(false); expect(resolved.reasons.join(' ')).toContain('semi-quantitative');
    expect(hopMeasurementError(hopTestMeasurement({ analyte: '3mhCys', unit: 'ugKgThiolEquivalent', basis: 'unknown' }))).toBeNull();
    expect(hopMeasurementError(hopTestMeasurement({ analyte: 'alpha', unit: 'ugKgThiolEquivalent' }))).toBeTruthy();
    expect(hopMeasurementError(hopTestMeasurement({ analyte: 'hsi', unit: 'percentMass' }))).toBeTruthy();
    expect(() => assertHopDocument('hopLots', hopTestLot({ referenceOnly: true, stockItemRef: 'stock-test' }))).toThrow(/documentaire/);
  });
  it('accepte une fiche partielle mais refuse un chiffre sans provenance', () => {
    expect(() => assertHopDocument('hopVarieties', hopTestVariety({ analysis: [] }))).not.toThrow();
    expect(() => assertHopDocument('hopLots', hopTestLot({ analysis: [{ ...hopTestMeasurement(), source: undefined! }] }))).toThrow(/provenance/);
  });
  it.each([
    { kind: 'point', value: 0, range: { min: 1, max: 2 } },
    { range: { min: 9, max: 3 } }, { value: 8 }, { range: { min: 1, max: Infinity } },
    { unit: 'percentOil', basis: 'asIs' }, { kind: 'unknown', value: 0 }, { extraCoefficient: 0.5 }
  ])('refuse la mesure incohérente %j', (over: any) => {
    expect(hopMeasurementError(hopTestMeasurement(over))).toBeTruthy();
  });
});
