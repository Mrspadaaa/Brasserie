import { HopLot, HopMeasurement, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
/** Synthetic values for verification only. Never used as a production catalogue or coefficient. */
export const hopTestSource: HopSource = { title: 'Fixture synthétique', author: 'Tests locaux', year: 2026,
  kind: 'observation', reference: 'tests/fixtures/hopIndex.ts — aucune donnée réelle' };
export const hopTestMeasurement = (over: Partial<HopMeasurement> = {}): HopMeasurement => ({
  analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'range', range: { min: 5, max: 9 },
  source: hopTestSource, confidence: 'medium', ...over
});
export const hopTestVariety = (over: Partial<HopVariety> = {}): HopVariety => ({
  id: 'test-variety', name: 'Variété témoin', aliases: ['Référence alpha'], form: 'pelletT90',
  descriptions: [{ text: 'Agrumes (fixture)', context: 'rawHop', source: hopTestSource }],
  analysis: [hopTestMeasurement(), hopTestMeasurement({ analyte: 'totalOil', unit: 'ml100g', range: { min: 1, max: 3 } })], ...over
});
export const hopTestLot = (over: Partial<HopLot> = {}): HopLot => ({
  id: 'test-lot', varietyId: 'test-variety', name: 'Lot témoin', form: 'pelletT90',
  analysis: [hopTestMeasurement({ kind: 'point', value: 7, range: { min: 6.8, max: 7.2 }, source: { ...hopTestSource, kind: 'coa' } })], ...over
});
