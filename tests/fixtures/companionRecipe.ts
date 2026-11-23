import type { Recipe } from '../../src/types';
import type { BrewerContext } from '../../functions/src/companionTypes';

export const companionRecipe = (): Recipe => ({
  id: 'QA-COMPANION', name: 'QA compagnon — session', style: 'NEIPA', volumeL: 20, efficiencyPct: 75,
  ogTarget: 1.034, fgTarget: 1.00748, abvTarget: 3.48075, ibuTarget: 16, totalGristKg: 2.9, boilMin: 60,
  fermentables: [{ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 2.9, potentialPpg: 37, colorEbc: 5 }],
  hops: [{ name: 'Citra', stage: 'boil', weightG: 20, alpha: 12, timeMin: 15 },
    { name: 'Citra', stage: 'dryHop', weightG: 100, alpha: 12, dayOffset: 5, aromaTiming: 'postFermentation', aromaContactHours: 48, aromaTemperatureC: 19 }],
  yeast: { name: 'Culture liquide personnelle R-125', lab: 'Laboratoire QA', form: 'liquide', qty: .125, unit: 'L',
    attenuationPct: 78, attenuationBasis: 'recipe', pitchTempC: 19,
    technicalFacts: [{ key: 'temperature', reported: '18–24 °C', range: { min: 18, max: 24 }, unit: '°C',
      qualifier: 'range', origin: 'personal', source: 'Carnet synthétique QA' }] },
  mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }] },
  fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: 10 },
    { kind: 'garde', name: 'Maturation', tempC: 20, days: 3, note: 'Contrôler la densité après le dernier ajout à cru.' }],
  steps: [], notes: []
});
export const companionContext = (): BrewerContext => ({ recipe: companionRecipe(), inventory: [], material: [],
  waterSources: [], now: 1790000000000, phase: 'Levure', editableTargets: ['recipe'], provenance: ['Banc QA synthétique'] });
