import { describe, it, expect } from 'vitest';
import pack from '../../src/data/hopTrialBootstrap.json';
import technical from '../../src/data/hopTechnicalBootstrap.json';
import { assertHopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopTrial } from '../../functions/src/hopTrialSchema';
import { adoptHopTrial, compareHopTrial, withinTrialRange } from '../../src/domain/hopIndex/trials';
import type { Recipe } from '../../src/types';
const trials = pack.hopKnowledge.filter(t => t.kind === 'trial') as unknown as HopTrial[];
const split = trials.find(t => t.id === 'trial-split-verdant-2026')!;
const recipe = (): Recipe => ({ id: 'test', name: 'IPA', style: 'IPA', volumeL: 24, ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5,
  totalGristKg: 5, fermentables: [], hops: [{ name: 'Autre', stage: 'dryHop', alpha: 12, weightG: 10, hopLotId: 'old' }],
  yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet', attenuationPct: 80 }, notes: ['À conserver'], steps: [],
  hopMatrixId: 'old-matrix', hopPredictionIds: ['old-prediction'], fermentation: [{ name: 'Principale', kind: 'primaire', tempC: 19, days: 7 }] } as Recipe);
describe('Programmes documentés et adaptation sans extrapolation chiffrée', () => {
  it('valide chaque essai, condition, observation et note, avec année et provenance', () => {
    [...pack.hopKnowledge, ...technical].forEach(row => expect(() => assertHopKnowledge(row)).not.toThrow());
    for (const trial of trials) {
      const missing = structuredClone(trial); delete missing.hops[0].doseGL.source;
      expect(() => assertHopKnowledge(missing)).toThrow();
      const undated = structuredClone(trial); undated.assessmentSource.year = null;
      expect(() => assertHopKnowledge(undated)).toThrow();
    }
  });
  it('conserve le résultat qualitatif du mélange, sans inventer de marge ni de rendement par variété', () => {
    expect(split.hops.map(h => h.doseGL.range)).toEqual([{ min: 2, max: 2 }, { min: 2, max: 2 }, { min: 4, max: 4 }]);
    expect(split.sensory).toEqual([]);
    expect(trials.find(t => t.id === 'trial-cascade-lafontaine-2018')!.sensory[0]).toMatchObject({ range: { min: 4.2, max: 6.6 }, scale: { min: 0, max: 15 } });
  });
  it('refuse un champ de coefficient ajouté à un essai et une observation hors échelle', () => {
    expect(() => assertHopKnowledge({ ...split, conversionYield: 0.2 })).toThrow();
    const t = structuredClone(trials[0]); t.sensory[0].range.max = 99;
    expect(() => assertHopKnowledge(t)).toThrow();
  });
  it('dimensionne les doses, préserve les autres domaines et efface les anciennes hypothèses de souche/lot/modèle', () => {
    const r = recipe(), before = structuredClone(r), next = adoptHopTrial(r, split);
    expect(next.hops.map(h => h.weightG)).toEqual([48, 48, 96]);
    expect(next.hops.every(h => h.alpha === 0 && h.tempC === undefined && h.timeMin === undefined && !h.hopLotId)).toBe(true);
    expect(next.yeast).toMatchObject({ hopIndexId: 'lalbrew-verdant-ipa', qty: 0 });
    expect(next.yeast.attenuationPct).toBeUndefined(); expect(next.hopMatrixId).toBeUndefined(); expect(next.hopPredictionIds).toBeUndefined();
    expect(next.notes).toEqual(before.notes); expect(next.fermentation).toEqual(before.fermentation);
    expect(r).toEqual(before);
  });
  it('ne choisit pas la moyenne d’une plage ni un volume manquant', () => {
    const t = structuredClone(split); t.hops[0].doseGL.range.max = 3;
    expect(() => adoptHopTrial(recipe(), t)).toThrow(/plage/);
    expect(() => adoptHopTrial({ ...recipe(), volumeL: NaN }, split)).toThrow(/volume/);
    const next = adoptHopTrial(recipe(), trials[0]);
    expect(next.hops[0].aromaTemperatureC).toBeUndefined(); // Published 13.3–15 °C, no midpoint.
  });
  it('repère une souche, dose ou phase différente et ne confond pas plage nominale de levure et palier réel', () => {
    const r = adoptHopTrial(recipe(), split);
    let differences = compareHopTrial(r, split);
    expect(differences.find(d => d.label === 'Fermentation')?.status).toBe('changed');
    expect(differences.find(d => d.label === 'Matrice, lots et forme')?.status).toBe('unknown');
    r.yeast.hopIndexId = 'fermentis-us05'; r.hops[0].weightG *= 2; r.hops[1].stage = 'dryHop'; r.hops[1].dayOffset = 3;
    differences = compareHopTrial(r, split);
    expect(differences.find(d => d.label === 'Souche')?.status).toBe('changed');
    expect(differences.find(d => d.label === 'Dose · Cascade')?.status).toBe('changed');
    expect(differences.find(d => d.label === 'Hallertau Blanc')?.status).toBe('changed');
  });
  it('tolère seulement l’arrondi machine et traite le programme comme un ensemble d’ajouts distincts', () => {
    expect(withinTrialRange(3.86 * 17.2 / 17.2, { min: 3.86, max: 3.86 })).toBe(true);
    expect(withinTrialRange(3.861, { min: 3.86, max: 3.86 })).toBe(false);
    const r = adoptHopTrial(recipe(), split); const original = compareHopTrial(r, split); r.hops.reverse();
    expect(compareHopTrial(r, split)).toEqual(original);
    r.hops.push({ ...r.hops[0] });
    expect(compareHopTrial(r, split).find(d => d.label === 'Nombre d’ajouts')?.status).toBe('changed');
  });
});
