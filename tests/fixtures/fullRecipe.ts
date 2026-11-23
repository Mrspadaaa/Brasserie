import { Recipe } from '../../src/types';

export const fullRecipe: Recipe = {
  id: 'private-id',
  batchRef: 'private-batch',
  favorite: true,
  name: 'Hazy : « Chêne / 2 »',
  style: 'Hazy IPA',
  volumeL: 19.75,
  brewDate: '2026-09-08',
  boilMin: 0,
  ogTarget: 1.0647,
  fgTarget: 1.0153,
  abvTarget: 6.49,
  ibuTarget: 0,
  colorEbc: 11.75,
  efficiencyPct: 71.5,
  preBoilL: 24.125,
  carboTarget: '2.35 vol',
  totalGristKg: 4.12345,
  fermentables: [
    {
      name: 'Pilsner : édition "spéciale"',
      weightKg: 4.12345,
      pct: 100,
      kind: 'grain',
      use: 'empatage',
      colorEbc: 3.75,
      potentialPpg: 37.1,
      fermentabilityPct: 80,
      dayOffset: 0
    },
    {
      name: 'Lactose',
      weightKg: 0.12345,
      kind: 'lactose',
      use: 'ebullition',
      fermentabilityPct: 0,
      colorEbc: 0
    },
    { name: 'Purée de mangue', weightKg: 0.5, kind: 'fruit', use: 'fermentation', dayOffset: 4 }
  ],
  hops: [
    {
      name: 'Citra',
      weightG: 0.125,
      alpha: 12.25,
      stage: 'whirlpool',
      timeMin: 0,
      tempC: 78.5,
      dayOffset: 0,
      step: 'Flameout'
    },
    {
      name: 'Citra',
      weightG: 56.75,
      alpha: 0,
      stage: 'dryHop',
      tempC: 0,
      timeMin: 2880,
      dayOffset: 0
    }
  ],
  adjuncts: [
    {
      name: 'Whirlfloc',
      amount: 0.5,
      unit: 'pastille',
      step: 'Ébullition',
      notes: 'Écraser\nAjouter à T−10.'
    }
  ],
  yeast: {
    name: 'Verdant',
    lab: 'Lallemand',
    strain: 'IPA',
    form: 'sèche',
    qty: 1.5,
    unit: 'sachet',
    pitchTempC: 18.5,
    fermTempMinC: 18,
    fermTempMaxC: 23,
    attenuationPct: 77.5,
    fermentDays: 8,
    notes: 'Réhydrater : 15 min\nNe pas secouer. '
  },
  mash: {
    ratioLPerKg: 4,
    mashoutTempC: 77.5,
    spargeTempC: 75.5,
    spargeType: 'fly',
    steps: [
      { name: 'Bêta', tempC: 64.5, durationMin: 75.5 },
      { name: 'Mash-out', tempC: 77.5, durationMin: 0 }
    ]
  },
  waterPlan: {
    sourceId: 'source-importee',
    sourceSnapshot: {
      id: 'source-importee',
      name: 'Analyse du puits',
      ca: 56.5,
      mg: 0.8,
      na: 0,
      so4: 2.5,
      cl: 0.9,
      hco3: 197.6,
      ph: 7.8,
      note: 'Échantillon septembre',
      updatedAt: '2026-09-01'
    },
    treatmentVersion: 2,
    diRatioPct: 80.5,
    spargeDiRatioPct: 100,
    targetProfileId: '~',
    targetName: 'Ronde',
    targetIons: { ca: 80, mg: 5, na: 12, so4: 75, cl: 150, hco3: 0 },
    mashWaterL: 16.4938,
    spargeWaterL: 8.875,
    allSaltsInMash: false,
    mash: { gypse: 1.237, cacl2: 3.25, epsom: 0.575, nahco3: 0, kcl: 0.315 },
    sparge: { gypse: 0.163, cacl2: 0.75, epsom: 0.225, kcl: 0.185 },
    acid: { id: 'phosphorique', mash: 0.325, sparge: 0 },
    acidOverride: { mash: 0.325, sparge: 0 },
    disabled: ['caco3'],
    targetPh: 5.35,
    measuredPh: 5.4,
    measuredSpargePh: 5.8
  },
  fermentation: [
    { kind: 'primaire', name: 'Libre', tempC: 20.5, days: 9, note: 'Mesurer J3.' },
    { kind: 'garde', name: 'Froid', tempC: -1, days: 0, note: '' }
  ],
  instructions: 'Préparer l’eau.\n\n  Puis concasser : 1 mm.\nFIN DE RECETTE\n',
  steps: [{ step: 'Conditionnement', tempC: 20, durationMin: 30, notes: 'Purger au CO₂.' }],
  notes: ['Note : houblons frais', '', 'Deux lignes\n  - avec indentation'],
  notesCreation: 'Auteur : Gaëtan\nSource originale\n\n'
};
