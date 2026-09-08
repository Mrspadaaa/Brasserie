import { describe, expect, it } from 'vitest';
import { assertHopKnowledge, type HopKnowledge, type HopYeast } from '../../functions/src/hopPredictionSchema';
import type { FermentationGuide } from '../../functions/src/fermentationGuideSchema';
import { applyFermentationGuide, createFermentationDraft, fermentationDose, fermentationDraftErrors, fermentationDuration, fermentationGuideChanged, readFermentationGuide, replacePrimaryFermentation } from '../../src/domain/fermentationGuide';
import { guideFermentations, guidePredictionKnowledge, guideSolverPolicy, guideYeasts } from '../../src/ui/hopIndex/guideData';
import { findRecipeYeastMatches } from '../../src/domain/hopIndex/recipeGuide';
import { captureHopPrediction } from '../../src/domain/hopIndex/snapshots';
import { writeRecipeText, readRecipeText } from '../../src/domain/recipeTransfer';
import pack from '../../src/data/fermentationGuideBootstrap.json';
import { fullRecipe } from '../fixtures/fullRecipe';

// Regression coverage for the four original Weissbier programmes.
const guides = guideFermentations([]).filter(g => pack.some(p => p.id === g.id));
const munich = guides.find(g => g.yeastId === 'lallemand-munich-classic')!;
const yeastFor = (g: FermentationGuide): HopYeast => { const { aliases: _, ...y } = guideYeasts([]).find(y => y.id === g.yeastId)!; return y; };

describe('Conduites de levure documentées', () => {
  it('valide toutes les sources, plages et propositions avant leur utilisation', () => {
    pack.forEach(p => expect(() => assertHopKnowledge(p)).not.toThrow());
    expect(guides).toHaveLength(4);
    for (const guide of guides) {
      expect(yeastFor(guide).betaLyase).toBe('unknown');
      for (const plan of guide.plans) {
        expect(fermentationDraftErrors(guide, createFermentationDraft(guide, plan.goal)!)).toEqual([]);
        expect(fermentationDuration(plan)).toEqual({ min: 6, max: 10 });
      }
    }
  });
  it('rejette un coefficient sans provenance, des paliers impossibles et des objectifs dupliqués', () => {
    const invalid = [
      (g: any) => { g.plans[0].phases[0].days.source.year = null; },
      (g: any) => { delete g.temperatureC.source; },
      (g: any) => { g.plans[0].phases[0].temperatureC.central = Infinity; },
      (g: any) => { g.plans[0].phases[0].days.range.min = 0; },
      (g: any) => { g.plans[0].phases[0].temperatureC.range.max = 100; },
      (g: any) => { g.plans.push(g.plans[0]); },
      (g: any) => { g.aroma.pof = 'probably'; }
    ];
    invalid.forEach(mutate => { const g = structuredClone(munich); mutate(g); expect(() => assertHopKnowledge(g)).toThrow(); });
  });
  it('convertit la dose sans inventer sachets ou viabilité et laisse un volume manquant inconnu', () => {
    expect(fermentationDose(munich, 24)).toMatchObject({ range: { min: 12, max: 24 }, confidence: 'low' });
    for (const volume of [0, -1, NaN, Infinity, undefined]) expect(fermentationDose(munich, volume as number)).toBeUndefined();
    expect(fermentationDose(guides[0], 24)).toBeUndefined();
    const edited = { ...munich, dryPitchGHL: { ...munich.dryPitchGHL!, range: { min: 60, max: 90 } } };
    expect(fermentationDose(edited, 10)?.range).toEqual({ min: 6, max: 9 });
  });
  it('distingue un champ effacé de zéro et permet de choisir la souche sans imposer un programme', () => {
    const d = createFermentationDraft(munich, 'banana')!;
    d.phases[0].days = undefined;
    expect(fermentationDraftErrors(munich, d)).not.toHaveLength(0);
    expect(() => applyFermentationGuide(fullRecipe, munich, yeastFor(munich), d)).toThrow(/Palier/);
    const r = applyFermentationGuide(fullRecipe, munich, yeastFor(munich), d, false);
    expect(r.fermentation).toEqual(fullRecipe.fermentation);
    expect(r.yeast.pitchTempC).toBeUndefined();
    expect(r.yeast.attenuationPct).toBeUndefined();
    expect(r.yeast.qty).toBe(0);
  });
  it('préserve grain, houblons, eau, garde et ajouts et invalide le contexte aromatique précédent', () => {
    const original = structuredClone({ ...fullRecipe, hopPredictionIds: ['old'], hopMatrixId: 'old', hopTrialId: 'old', fermentation: [
      { kind: 'primaire' as const, name: 'Ancienne primaire', tempC: 18, days: 10 },
      { kind: 'ajout' as const, name: 'Fruits', tempC: 20, days: 0, note: 'Fruits de la recette' },
      { kind: 'garde' as const, name: 'Garde prévue', tempC: 5, days: 4 }
    ] });
    const before = structuredClone(original), d = createFermentationDraft(munich, 'banana')!;
    d.quantityG = 12; d.phases[0].days = 6;
    const r = applyFermentationGuide(original, munich, yeastFor(munich), d);
    expect(original).toEqual(before);
    expect(r.hops).toEqual(original.hops); expect(r.fermentables).toEqual(original.fermentables); expect(r.waterPlan).toEqual(original.waterPlan);
    expect(r.fermentation?.slice(2)).toEqual(original.fermentation.slice(1));
    expect(r.yeast).toMatchObject({ qty: 12, unit: 'g', pitchTempC: 20, fermentDays: 9, fermTempMinC: 20, fermTempMaxC: 21 });
    expect(r.hopMatrixId).toBeUndefined(); expect(r.hopPredictionIds).toBeUndefined(); expect(r.hopTrialId).toBeUndefined();
    expect(r.yeast.attenuationPct).toBeUndefined();
    expect(r.yeastGuide?.guide).toEqual(munich); expect(r.yeastGuide?.guide).not.toBe(munich);
    expect(fermentationGuideChanged(r, r.yeastGuide!)).toBe(false);
    expect(applyFermentationGuide(r, munich, yeastFor(munich), d)).toEqual(r);
  });
  it('conserve une quantité déjà saisie pour la même souche et reconnaît les écritures fabricant', () => {
    const r = { ...fullRecipe, yeast: { ...yeastFor(munich), hopIndexId: munich.yeastId, form: 'sèche' as const, qty: 18, unit: 'g', attenuationPct: 78 } };
    expect(applyFermentationGuide(r, munich, yeastFor(munich), createFermentationDraft(munich, 'banana')!).yeast).toMatchObject({ qty: 18, attenuationPct: 78 });
    for (const [label, id] of [['Munich Classic', munich.yeastId], ['WLP300', 'white-labs-wlp300'], ['SafAle W-68', 'fermentis-w68'], ['Wyeast 3068', 'wyeast-3068']]) {
      expect(findRecipeYeastMatches(label, guideYeasts([])).some(m => m.item.id === id)).toBe(true);
    }
  });
  it('ne remplace pas une révision désactivée ou invalide par le guide initial', () => {
    for (const patch of [{ enabled: false }, { plans: [] }]) expect(guideFermentations([{ ...munich, ...patch } as FermentationGuide]).some(g => g.id === munich.id)).toBe(false);
    const edited = structuredClone(munich); edited.version = 'personal'; edited.plans[0].phases[0].temperatureC.central = 19;
    expect(createFermentationDraft(guideFermentations([edited]).find(g => g.id === munich.id)!, 'banana')?.phases[0].tempC).toBe(19);
  });
  it('fige les références et rend visibles les changements ultérieurs de souche, volume et température', () => {
    const r = applyFermentationGuide(fullRecipe, munich, yeastFor(munich), createFermentationDraft(munich, 'banana')!);
    expect(readFermentationGuide(r)).toEqual(r.yeastGuide);
    expect(fermentationGuideChanged({ ...r, volumeL: r.volumeL + 1 }, r.yeastGuide!)).toBe(true);
    expect(fermentationGuideChanged({ ...r, yeast: { ...r.yeast, fermTempMaxC: 30 } }, r.yeastGuide!)).toBe(true);
    expect(fermentationGuideChanged({ ...r, fermentation: [] }, r.yeastGuide!)).toBe(true);
    const corrupt = { ...r, yeastGuide: { guide: {} } } as any;
    expect(readFermentationGuide(corrupt)).toBeUndefined();
  });
  it('garde les étapes concrètes à la copie sans exporter des identifiants locaux', () => {
    const r = applyFermentationGuide(fullRecipe, munich, yeastFor(munich), createFermentationDraft(munich, 'banana')!);
    const restored = readRecipeText(writeRecipeText(r));
    expect(restored?.fermentation).toEqual(r.fermentation);
    expect(restored).not.toHaveProperty('yeastGuide');
    expect(restored?.yeast.name).toBe(r.yeast.name);
  });
  it('partage les capacités POF et fenêtres avec le solver sans créer une prédiction de thiols', () => {
    const policy = guideSolverPolicy([])!;
    expect(() => assertHopKnowledge(policy)).not.toThrow();
    expect(policy.yeastPhenols.find(p => p.yeastId === munich.yeastId)?.status).toBe('positive');
    expect(policy.yeastConditions?.find(p => p.yeastId === 'fermentis-w68')?.temperatureC).toEqual({ min: 18, max: 26 });
    const snapshot = captureHopPrediction({ varietyId: null, yeastId: munich.yeastId, timing: 'fermentation', doseGL: null, temperatureC: null, contactHours: null, matrixId: null }, {},
      { varieties: [], lots: [], knowledge: [...guidePredictionKnowledge([]), ...guides] }, { id: 'test', createdAt: '2026-09-08T00:00:00Z', name: 'Test' });
    expect(snapshot.evidence.knowledge.some(k => k.kind === 'fermentation')).toBe(false);
  });
  it('rejette une autre souche ou un programme désactivé avant toute modification', () => {
    const draft = createFermentationDraft(munich, 'banana')!;
    expect(() => applyFermentationGuide(fullRecipe, munich, yeastFor(guides[0]), draft)).toThrow(/correspond/);
    expect(() => applyFermentationGuide(fullRecipe, { ...munich, enabled: false }, yeastFor(munich), draft)).toThrow(/disponible/);
    const events = [{ kind: 'ajout' as const, name: 'Sucre', tempC: 20, days: 0 }];
    expect(replacePrimaryFermentation(events, [])).toEqual(events);
  });
});
