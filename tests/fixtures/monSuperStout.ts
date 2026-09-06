import { Recipe } from '../../src/types';

/** Reproduces the reported water/grist quantities; identifying metadata omitted. */
export const monSuperStout: Recipe = {
  id: 'regression-stout',
  name: 'Stout — régression HCO₃',
  style: 'Imperial stout',
  volumeL: 30,
  ogTarget: 1.069,
  fgTarget: 1.014,
  abvTarget: 7.2,
  ibuTarget: 53,
  boilMin: 75,
  totalGristKg: 9.1,
  fermentables: [
    { name: 'Malt Maris Otter', weightKg: 8.1, kind: 'grain', use: 'empatage', colorEbc: 5, potentialPpg: 37, fermentabilityPct: 100 },
    { name: 'Röstgerste', weightKg: 1, kind: 'grain', use: 'empatage', colorEbc: 1150, potentialPpg: 30, fermentabilityPct: 100 }
  ],
  hops: [{ name: 'Nuget', weightG: 60, alpha: 13, stage: 'boil', timeMin: 75 }],
  yeast: {
    name: 'Levure Safale US-05', lab: 'Fermentis', form: 'sèche', qty: 5, unit: 'sachet',
    pitchTempC: 26.5, fermTempMinC: 12, fermTempMaxC: 22, attenuationPct: 81,
    notes: 'Floculation moyenne · Fermentis — Fiche technique SafAle US-05'
  },
  mash: {
    ratioLPerKg: 5, mashoutTempC: 76, spargeTempC: 76, spargeType: 'batch',
    steps: [{ name: 'Saccharification', tempC: 67, durationMin: 75 }]
  },
  waterPlan: {
    sourceId: 'reseau',
    sourceSnapshot: {
      id: 'reseau', name: 'Eau calcaire de test', ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250,
      ph: 7.4
    },
    treatmentVersion: 2, diRatioPct: 20, targetProfileId: '—',
    startIons: { ca: 68, mg: 11.2, na: 6.4, so4: 22.4, cl: 17.6, hco3: 200 },
    wortIons: { ca: 95, mg: 17, na: 6.4, so4: 87.3, cl: 79.3, hco3: 101.3 },
    mashWaterL: 45.5, spargeWaterL: 0.1, allSaltsInMash: true,
    mash: { gypse: 5.3, mgcl2: 2.2, kcl: 4.3 }, sparge: {},
    acid: { id: 'lactique', mash: 7.5, sparge: 0 }, acidOverride: { mash: 7.5, sparge: 0 },
    disabled: [], targetPh: 5.4
  },
  fermentation: [
    { kind: 'primaire', name: 'Fermentation primaire', tempC: 20, days: 21 },
    { kind: 'garde', name: 'Garde longue', tempC: 8, days: 60, note: 'Elle s’améliore pendant des mois.' }
  ],
  steps: [], notes: []
};

/** Second report: the same grist, entirely RO, with 11 L of sparge water. */
export const monSuperStoutRo: Recipe = {
  ...monSuperStout,
  mash: { ...monSuperStout.mash!, ratioLPerKg: 34.6 / 9.1 },
  waterPlan: {
    ...monSuperStout.waterPlan!,
    diRatioPct: 100, targetProfileId: '20C',
    startIons: { ca: 0, mg: 0, na: 0, so4: 0, cl: 0, hco3: 0 },
    wortIons: { ca: 92, mg: 0, na: 23.4, so4: 50.2, cl: 125.9, hco3: 62.1 },
    mashWaterL: 34.6, spargeWaterL: 11,
    mash: { gypse: 4.1, cacl2: 11.9, nahco3: 3.9 }, sparge: {},
    acid: { id: 'lactique', mash: 0, sparge: 0 }, acidOverride: undefined
  }
};
