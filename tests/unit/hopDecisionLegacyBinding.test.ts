import { describe, expect, it } from 'vitest';
import { applyHopScenario } from '../../src/domain/hopIndex/exploration';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import type { HopTriplet, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { Recipe } from '../../src/types';

const variety: HopVariety = { id: 'hop-fixture', name: 'Matière de test', form: 'pelletT90', aliases: [], analysis: [], descriptions: [] };
const yeast: HopYeast = { id: 'yeast-fixture', kind: 'yeast', name: 'Souche de test', betaLyase: 'unknown',
  source: { author: 'Test', title: 'Fixture', kind: 'observation', year: 2026, reference: 'fixture:stock-binding' } };
const triplet: HopTriplet = { varietyId: variety.id, yeastId: yeast.id, timing: 'boil', doseGL: 2, temperatureC: 100, contactHours: 1, matrixId: null };
const recipe = () => ({ volumeL: 20, hops: [{ name: variety.name, hopVarietyId: variety.id, stockItemRef: 'my-owned-stock', weightG: 20, alpha: 8, stage: 'boil', timeMin: 60 }],
  yeast: { name: yeast.name, hopIndexId: yeast.id, form: 'sèche' } } as Recipe);

describe('liaison stock de l’applicateur historique', () => {
  it('préserve le stock de la même matière lorsque seule la dose/conduite change', () => {
    const initial = recipe();
    const result = applyHopScenario(initial, 0, triplet, variety, yeast);
    expect(result.hops[0]).toMatchObject({ stockItemRef: 'my-owned-stock', weightG: 40, alpha: 8 });
    expect(initial.hops[0].weightG).toBe(20);
  });
  it('ne transfère pas le stock ancien à une autre matière', () => {
    const other = { ...variety, id: 'other', name: 'Autre matière' };
    expect(applyHopScenario(recipe(), 0, { ...triplet, varietyId: other.id }, other, yeast).hops[0].stockItemRef).toBeUndefined();
  });
  it('ne transfère pas le lien de stock à un autre lot de la même variété', () => {
    const initial = recipe(); initial.hops[0].hopLotId = 'lot-A';
    const changed = applyHopScenario(initial, 0, { ...triplet, lotId: 'lot-B' }, variety, yeast).hops[0];
    expect(changed.stockItemRef).toBeUndefined();
    expect(changed.alpha).toBe(0); // Existing scalar sentinel for unknown; not a reported zero-alpha lot.
    expect(applyHopScenario(initial, 0, { ...triplet, lotId: 'lot-A' }, variety, yeast).hops[0].stockItemRef).toBe('my-owned-stock');
    expect(applyHopScenario(initial, 0, { ...triplet, lotId: 'lot-A' }, variety, yeast).hops[0].alpha).toBe(8);
  });
});
