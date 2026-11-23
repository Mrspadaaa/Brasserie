import { describe, expect, it } from 'vitest';
import pack from '../../src/data/hopExtrapolationBootstrap.json';
import catalogue from '../../src/data/hopManufacturerBootstrap.json';
import { assertHopKnowledge, HOP_TIMINGS, type HopTriplet, type HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { guidePredictionKnowledge, guideYeasts } from '../../src/ui/hopIndex/guideData';
import { predictHopTriplet, rankHopTriplets } from '../../functions/src/hopPredictionCore';
import { captureHopPrediction } from '../../src/domain/hopIndex/snapshots';
import { assertHopPredictionSnapshot } from '../../functions/src/hopPredictionValidation';
import { applyHopScenario, recipeHopScenario } from '../../src/domain/hopIndex/exploration';
import type { Recipe } from '../../src/types';

const varieties = catalogue.hopVarieties as HopVariety[];
const knowledge = guidePredictionKnowledge([]);
const base = { varieties, lots: [], knowledge };
const model = pack[0] as HopExtrapolation;
const triplet: HopTriplet = { varietyId: 'hopsteiner-cas', yeastId: 'fermentis-us05', timing: 'postFermentation', doseGL: 4, temperatureC: 18, contactHours: 24, matrixId: null };
const target = { citrus: { min: 66, max: 100 } };
const predict = (t = triplet, data = base) => predictHopTriplet(t, target, data);
const contains = (outer: any, inner: any) => {
  if (inner === null) { expect(outer).toBeNull(); return; }
  expect(outer.min).toBeLessThanOrEqual(inner.min + 1e-10);
  expect(outer.max).toBeGreaterThanOrEqual(inner.max - 1e-10);
};
const withModel = (m: HopExtrapolation) => ({ ...base, knowledge: [...knowledge.filter(k => k.id !== m.id), m] });

describe('Extrapolation expérimentale, intervalles et provenance', () => {
  it('valide les paramètres et refuse une valeur sans provenance ou année', () => {
    expect(() => assertHopKnowledge(model)).not.toThrow();
    const visit = (x: any, path: string[] = []) => {
      if (!x || typeof x !== 'object') return;
      if (x.range && x.source) {
        for (const missing of ['year', 'reference'] as const) {
          const clone: any = structuredClone(model); let p = clone;
          for (const key of path) p = p[key]; delete p.source[missing];
          expect(() => assertHopKnowledge(clone), path.join('.')).toThrow();
        }
      }
      Object.entries(x).forEach(([key, value]) => visit(value, [...path, key]));
    }; visit(model);
    const narrowed = structuredClone(model); narrowed.descriptor.unmentioned.range.max = .4; narrowed.descriptor.unmentioned.central = .2;
    expect(() => assertHopKnowledge(narrowed)).toThrow(/non mentionné/);
  });
  it('produit une plage sourcée pour chaque combinaison des références chargées, sans inventer de concentration', () => {
    const engineYeasts = knowledge.filter(k => k.kind === 'yeast');
    const combinations = varieties.flatMap(v => engineYeasts.flatMap(y => HOP_TIMINGS.map(timing => ({ ...triplet, varietyId: v.id, yeastId: y.id, timing }))));
    const predictions = rankHopTriplets(combinations, target, base);
    expect(predictions.length).toBeGreaterThan(3500);
    for (const p of predictions) {
      expect(p.extrapolatedAxes).toHaveLength(12);
      expect(p.compounds['4mmpFree'].range).toBeNull();
      for (const id of p.extrapolatedAxes!) {
        const e = p.profile[id];
        expect(Number.isFinite(e.range!.min) && Number.isFinite(e.range!.max)).toBe(true);
        expect(e.range!.min).toBeGreaterThanOrEqual(0); expect(e.range!.max).toBeLessThanOrEqual(100);
        expect(e.confidence).toBe('low'); expect(e.sources.some(s => s.kind === 'judgment' && s.year === 2026)).toBe(true);
      }
    }
  }, 30000);
  it('laisse les axes inconnus pour une identité consultable mais absente des données du moteur', () => {
    const engineIds = new Set(knowledge.filter(k => k.kind === 'yeast').map(k => k.id));
    const unselected = guideYeasts([]).find(y => !engineIds.has(y.id))!;
    expect(unselected).toBeDefined();
    const result = predict({ ...triplet, yeastId: unselected.id });
    expect(result.extrapolatedAxes).toBeUndefined();
    expect(result.score.range).toBeNull();
    expect(Object.values(result.profile).every(axis => axis.range === null)).toBe(true);
    expect(result.compounds['4mmpFree'].range).toBeNull();
  });
  it('retirer une condition, une description ou le profil de souche ne resserre jamais la plage', () => {
    const current = predict();
    const cases = ['doseGL', 'temperatureC', 'contactHours'].map(key => predict({ ...triplet, [key]: null }));
    const noStrain = structuredClone(model); noStrain.yeasts = [];
    cases.push(predict(triplet, withModel(noStrain)));
    cases.push(predict(triplet, { ...base, varieties: varieties.map(v => v.id === triplet.varietyId ? { ...v, descriptions: [] } : v) }));
    cases.push(predict(triplet, { ...base, varieties: varieties.map(v => ({ ...v, descriptions: v.descriptions.map(d => ({ ...d, source: { ...d.source, year: null } })) })) }));
    for (const result of cases) for (const id of Object.keys(current.profile)) contains(result.profile[id].range, current.profile[id].range);
  });
  it('dose nulle annule le houblon, conserve la levure, et les très grandes doses restent finies', () => {
    const zero = predict({ ...triplet, doseGL: 0, yeastId: 'lalbrew-verdant-ipa' });
    const other = predict({ ...triplet, varietyId: 'hopsteiner-adm', doseGL: 0, yeastId: 'lalbrew-verdant-ipa' });
    expect(zero.profile.stoneFruit.range).toEqual(other.profile.stoneFruit.range);
    expect(zero.profile.stoneFruit.range!.min).toBeGreaterThan(0);
    for (const dose of [0, Number.MIN_VALUE, 1, 4, 16, Number.MAX_VALUE]) {
      const result = predict({ ...triplet, doseGL: dose });
      expect(Number.isFinite(result.profile.citrus.range!.max)).toBe(true);
      expect(result.profile.citrus.confidence).toBe('low');
    }
    expect(predict({ ...triplet, doseGL: 16 }).profile.citrus.range!.max).toBeGreaterThan(66);
  });
  it('ne confond pas durée et phase, ni description répétée et nouvelle intensité', () => {
    const late = predict({ ...triplet, timing: 'boil', temperatureC: 100, contactHours: 5 / 60 });
    const early = predict({ ...triplet, timing: 'boil', temperatureC: 100, contactHours: 95 / 60 });
    expect(late.profile.citrus.range!.max).toBeGreaterThan(early.profile.citrus.range!.max);
    const duplicate = predict(triplet, { ...base, varieties: varieties.map(v => ({ ...v, descriptions: [...v.descriptions, ...v.descriptions] })) });
    expect(duplicate.profile.citrus.range).toEqual(predict().profile.citrus.range);
  });
  it('un COA non utilisé ne modifie ni le résultat ni la confiance', () => {
    const v = varieties.find(v => v.id === triplet.varietyId)!;
    const withCoa = { ...base, lots: [{ id: 'coa', name: 'Lot partiel', varietyId: v.id, form: v.form, analysis: v.analysis.filter(a => a.analyte === 'alpha') }] };
    const measured = predictHopTriplet({ ...triplet, lotId: 'coa' }, target, withCoa);
    for (const id of Object.keys(measured.profile)) {
      expect(measured.profile[id].range).toEqual(predict().profile[id].range);
      expect(measured.profile[id].confidence).toBe('low');
    }
  });
  it('les extrêmes ponctuels des paramètres restent contenus dans l’enveloppe', () => {
    const envelope = predict();
    // Deterministic points throughout the parameter box, including vertices.
    for (const fraction of [0, .25, .5, .75, 1]) {
      const m = structuredClone(model);
      const visit = (x: any) => {
        if (!x || typeof x !== 'object') return;
        if (x.range && x.source) { const n = x.range.min + fraction * (x.range.max - x.range.min); x.range = { min: n, max: n }; x.central = n; }
        Object.values(x).forEach(visit);
      }; visit(m);
      // Domains and structural requirements are not uncertain point parameters.
      m.descriptor.unknown = model.descriptor.unknown; m.descriptor.unmentioned = model.descriptor.unmentioned;
      m.defaultYeast = model.defaultYeast; m.residual = model.residual;
      for (const t of HOP_TIMINGS) m.timings[t].temperatureC = model.timings[t].temperatureC;
      const point = predict(triplet, withModel(m));
      for (const id of Object.keys(envelope.profile)) contains(envelope.profile[id].range, point.profile[id].range);
    }
  });
  it('une révision sauvegardée ou désactivée prime sans redéploiement ; une révision invalide ne réactive pas le défaut', () => {
    const changed = structuredClone(model); changed.version = 'review-2'; changed.gain.range = { min: .5, max: 1 }; changed.gain.central = .75;
    const result = predict(triplet, { ...base, knowledge: guidePredictionKnowledge([changed]) });
    expect(result.modelRefs).toContainEqual({ id: changed.id, version: changed.version });
    expect(result.profile.citrus.range!.max).toBeLessThan(predict().profile.citrus.range!.max);
    changed.enabled = false;
    expect(predict(triplet, { ...base, knowledge: guidePredictionKnowledge([changed]) }).profile.citrus.range).toBeNull();
    const invalid: any = structuredClone(changed); delete invalid.gain.source;
    expect(predict(triplet, { ...base, knowledge: guidePredictionKnowledge([invalid]) }).profile.citrus.range).toBeNull();
  });
  it('fige les hypothèses, rejoue exactement le calcul et refuse une plage ou un statut falsifié', () => {
    const s = captureHopPrediction(triplet, target, base, { id: 's1', name: 'Cascade libre', createdAt: '2026-09-08T15:00:00Z' });
    expect(s.engineVersion).toBe('hop-experimental-v4'); expect(() => assertHopPredictionSnapshot(s)).not.toThrow();
    const forged = structuredClone(s); forged.prediction.profile.citrus.range!.min += 1;
    expect(() => assertHopPredictionSnapshot(forged)).toThrow(/plage différente/);
    const hidden = structuredClone(s); delete hidden.prediction.extrapolatedAxes;
    expect(() => assertHopPredictionSnapshot(hidden)).toThrow();
    const shifted = structuredClone(s); shifted.prediction.profile.citrus.central! += 1;
    expect(() => assertHopPredictionSnapshot(shifted)).toThrow(/central différent/);
  });
});

describe('Scénario et recette', () => {
  const recipe = (): Recipe => ({ id: 'r', name: 'Test', volumeL: 24, hops: [{ name: 'Houblon Cascade 6.5%', alpha: 6.5, weightG: 20, stage: 'dryHop', dayOffset: 3 }], yeast: { name: 'Fermentis Levure Safale US-05', form: 'sèche', qty: 1, unit: 'sachet' }, notes: [], fermentation: [{ name: 'Primaire', tempC: 19, days: 7, kind: 'primaire' }] } as Recipe);
  it('reconnaît Cascade et US-05 en lecture, explicite la phase hypothétique et ne modifie rien', () => {
    const r = recipe(), before = structuredClone(r);
    const preview = recipeHopScenario(r, 0, varieties, guideYeasts([]))!;
    expect(preview.triplet.varietyId).toBe('hopsteiner-cas'); expect(preview.triplet.yeastId).toBe('fermentis-us05');
    expect(preview.proposed.join(' ')).toContain('Phase à cru non renseignée'); expect(r).toEqual(before);
  });
  it('applique seulement le scénario choisi, conserve les autres ingrédients et ne transfère pas les alpha à un autre houblon', () => {
    const r = recipe(); r.hops.push({ name: 'Autre', alpha: 10, weightG: 14, stage: 'boil', timeMin: 60 });
    const t = { ...triplet, varietyId: 'hopsteiner-adm', yeastId: 'lalbrew-verdant-ipa', doseGL: 3 };
    const next = applyHopScenario(r, 0, t, varieties.find(v => v.id === t.varietyId)!, guideYeasts([]).find(y => y.id === t.yeastId)!);
    expect(next.hops[0].weightG).toBe(72); expect(next.hops[0].alpha).toBe(0); expect(next.hops[1]).toEqual(r.hops[1]);
    expect(next.yeast.qty).toBe(0); expect(next.fermentation).toEqual(r.fermentation); expect(r.hops[0].weightG).toBe(20);
    expect(() => applyHopScenario(r, 0, { ...t, doseGL: null }, varieties[0], guideYeasts([])[0])).toThrow();
  });
});
