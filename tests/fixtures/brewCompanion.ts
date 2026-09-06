import { RecipeSnapshot, BrewDayState, StockItem } from '../../src/types';
import { buildTimeline } from '../../src/services/brewTimer';

export function recipe(over: Partial<RecipeSnapshot> = {}): RecipeSnapshot {
  return {
    name: 'Pale de test',
    style: 'Pale Ale',
    volumeL: 20,
    ogTarget: 1.05,
    fgTarget: 1.01,
    abvTarget: 5,
    totalGristKg: 5,
    capturedAt: '2026-09-06',
    steps: [],
    notes: [],
    fermentables: [
      { name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 5, colorEbc: 6, potentialPpg: 36 }
    ],
    hops: [
      { name: 'Citra', stage: 'boil', weightG: 20, alpha: 12, timeMin: 60 },
      { name: 'Citra', stage: 'boil', weightG: 30, alpha: 12, timeMin: 10 },
      { name: 'Mosaic', stage: 'dryHop', weightG: 40, alpha: 12 }
    ],
    yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' },
    boilMin: 60,
    mash: {
      steps: [
        { name: 'Saccharification', tempC: 67, durationMin: 60 },
        { name: 'Mashout', tempC: 76, durationMin: 10 }
      ],
      spargeType: 'batch'
    },
    waterPlan: {
      sourceId: 'test',
      mashWaterL: 20,
      spargeWaterL: 10,
      targetPh: 5.4,
      diRatioPct: 0,
      startIons: { ca: 30, mg: 2, na: 5, so4: 10, cl: 15, hco3: 120 },
      mash: { epsom: 1, cacl2: 2 },
      sparge: {},
      acid: { id: 'lactique', mash: 1, sparge: 0.5 }
    },
    ...over
  };
}
export function brewState(r = recipe(), over: Partial<BrewDayState> = {}): BrewDayState {
  return { steps: buildTimeline(r), currentIndex: 0, readings: [], ...over };
}
export function malt(name: string, kg = 10, colorEbc = 6, potentialPpg?: number): StockItem {
  return {
    id: name,
    name,
    category: 'Malt',
    currentStock: kg,
    unit: 'kg',
    colorEbc,
    potentialPpg
  } as StockItem;
}
