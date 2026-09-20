import { describe, expect, it } from 'vitest';
import { assertFermentationGuide, type FermentationGuide } from '../../functions/src/fermentationGuideSchema';
import { documentedDirectPitchProtocol } from '../../functions/src/yeastPitchingProtocol';
import { applyFermentationGuide, createFermentationDraft, fermentationDraftErrors, readFermentationGuide } from '../../src/domain/fermentationGuide';
import { pitchingPlan, pitchTemperatureFeedback } from '../../src/domain/pitchingPlan';
import { YEAST_PRACTICAL_GUIDES } from '../../src/data/yeastPracticalGuides';
import { guideFermentations, guideYeasts } from '../../src/ui/hopIndex/guideData';
import { fullRecipe } from '../fixtures/fullRecipe';

const w68 = () => structuredClone(guideFermentations([]).find(g => g.yeastId === 'fermentis-w68')!);
const yeast = () => { const { aliases: _, ...ref } = guideYeasts([]).find(y => y.id === 'fermentis-w68')!; return ref; };
const warmDraft = (guide: FermentationGuide) => ({ ...createFermentationDraft(guide, guide.plans[0].goal)!, pitchTempC: 28, pitchMethod: 'direct' as const, pitchForm: 'sèche' as const });

describe('Température d’ajout distincte de la fermentation et de la réhydratation', () => {
  it('garde tous les guides historiques valides et une seule source numérique partagée', () => {
    for (const guide of guideFermentations([])) expect(() => assertFermentationGuide(guide)).not.toThrow();
    const protocol = documentedDirectPitchProtocol('fermentis-w68', 'sèche')!;
    expect(protocol.temperatureC).toEqual({ min: 20, max: 32 });
    expect(protocol.source.kind).toBe('manufacturer');
    expect(YEAST_PRACTICAL_GUIDES['fermentis-w68'].directPitchTemperatureC).toEqual(protocol.temperatureC);
    expect(documentedDirectPitchProtocol('fermentis-w68', 'levain')).toBeUndefined();
    expect(documentedDirectPitchProtocol('fermentis-us05', 'sèche')).toBeUndefined();
    expect(documentedDirectPitchProtocol('inconnue', 'sèche')).toBeUndefined();
  });

  it('le serveur exige produit, méthode et forme documentés hors fenêtre et garde les paliers dans leur fenêtre', () => {
    const guide = w68(), plan = guide.plans[0];
    plan.pitchTemperatureC = { ...plan.pitchTemperatureC, central: 28, range: { min: 28, max: 30 } };
    expect(() => assertFermentationGuide(guide)).toThrow(/consigne/);
    plan.pitchMethod = 'direct';
    expect(() => assertFermentationGuide(guide)).toThrow(/forme/);
    plan.pitchForm = 'sèche';
    expect(() => assertFermentationGuide(guide)).not.toThrow();
    plan.phases[0].temperatureC.central = 28;
    plan.phases[0].temperatureC.range.max = 28;
    expect(() => assertFermentationGuide(guide)).toThrow(/consigne/);
  });

  it('aucune réhydratation, forme repiquée ou instruction qualitative ne devient un permis numérique', () => {
    for (const mutate of [
      (g: any) => { g.yeastId = 'fermentis-us05'; },
      (g: any) => { g.plans[0].pitchForm = 'levain'; },
      (g: any) => { g.plans[0].pitchMethod = 'rehydrate'; },
      (g: any) => { g.plans[0].pitchTemperatureC.range.max = 33; },
    ]) {
      const guide = w68();
      Object.assign(guide.plans[0], { pitchMethod: 'direct', pitchForm: 'sèche' });
      guide.plans[0].pitchTemperatureC = { ...guide.plans[0].pitchTemperatureC, central: 28, range: { min: 28, max: 30 } };
      mutate(guide);
      expect(() => assertFermentationGuide(guide)).toThrow();
    }
  });

  it('le brouillon valide l’ajout direct à 28 °C mais ni un maintien à 28 °C ni une méthode implicite', () => {
    const guide = w68(), draft = warmDraft(guide);
    expect(fermentationDraftErrors(guide, draft)).toEqual([]);
    expect(fermentationDraftErrors(guide, { ...draft, pitchMethod: undefined, pitchForm: undefined })).not.toHaveLength(0);
    for (const temperature of [18, 33, NaN, Infinity, undefined])
      expect(fermentationDraftErrors(guide, { ...draft, pitchTempC: temperature })).not.toHaveLength(0);
    expect(fermentationDraftErrors(guide, { ...draft, phases: draft.phases.map((p, i) => i === 0 ? { ...p, tempC: 28 } : p) })).toContain('Palier 1 : renseigne une température dans la fenêtre fabricant et une durée positive.');
  });

  it('l’application vérifie la forme réellement choisie, conserve la source et la conduite du jour la reconnaît', () => {
    const guide = w68(), draft = warmDraft(guide), reference = yeast();
    const recovered = { ...fullRecipe, yeast: { ...fullRecipe.yeast, name: reference.name, hopIndexId: reference.id, form: 'levain' as const } };
    expect(() => applyFermentationGuide(recovered, guide, reference, draft)).toThrow(/forme réelle/);
    const applied = applyFermentationGuide(fullRecipe, guide, reference, draft);
    expect(applied.yeast).toMatchObject({ form: 'sèche', pitchTempC: 28, fermTempMinC: 18, fermTempMaxC: 26 });
    const frozen = readFermentationGuide(applied)!;
    expect(frozen.pitchingProtocol?.source.reference).toBe('https://fermentis.com/en/product/safale-w-68/');
    expect(applied.fermentation![0].note).toContain('Délai de descente');
    expect(pitchingPlan(applied).documentedWarmSelected).toBe(true);
    expect(pitchTemperatureFeedback(applied, 28)).toContain('ajout direct documentée');
    const day = { steps: [], currentIndex: 0, thermalChoices: { pitchingMode: 'at-target' as const, pitchTargetC: 28 } };
    expect(pitchTemperatureFeedback(applied, 28, day)).toContain('ajout direct documentée');
    const changed = { ...applied, yeast: { ...applied.yeast, form: 'levain' as const } };
    expect(pitchingPlan(changed).documentedWarmSelected).toBe(false);
    expect(pitchTemperatureFeedback(changed, 28)).not.toContain('ajout direct documentée');
  });

  it('un nouveau plan explicite transmet son contexte au brouillon sans modifier les anciens', () => {
    const guide = w68(), plan = guide.plans[0];
    Object.assign(plan, { pitchMethod: 'direct', pitchForm: 'sèche' });
    plan.pitchTemperatureC = { ...plan.pitchTemperatureC, central: 28, range: { min: 26, max: 30 } };
    const draft = createFermentationDraft(guide, plan.goal)!;
    expect(draft).toMatchObject({ pitchMethod: 'direct', pitchForm: 'sèche', pitchTempC: 28 });
    expect(fermentationDraftErrors(guide, draft)).toEqual([]);
    expect(createFermentationDraft(w68(), plan.goal)).not.toHaveProperty('pitchMethod');
  });
});
