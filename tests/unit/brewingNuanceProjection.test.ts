import { describe, expect, it, vi } from 'vitest';
import { adoptBrewingNuancePlan, proposeBrewingNuancePlans, projectBrewingNuances, reviseBrewingNuancePlan,
  readBrewingNuanceProjection, brewingNuanceViewModel } from '../../src/domain/brewingNuanceProjection';
import type { BrewingSensoryDimension } from '../../src/domain/brewingSensory';
import type { HopAxis, HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import * as predictor from '../../functions/src/hopRecipePrediction';
import { hopTestSource, hopTestVariety } from '../fixtures/hopIndex';
import { testHopYeast, testHopPolicy, testHopTriplet } from '../fixtures/hopPrediction';
import bootstrap from '../../src/data/hopKnowledgeBootstrap.json';
import extrapolations from '../../src/data/hopExtrapolationBootstrap.json';

const when = '2026-10-02T06:00:00.000Z', actor = { origin: 'user' as const, name: 'Fixture explicite' };
const dimensions: BrewingSensoryDimension[] = [
  { id: 'pear-fixture', version: '1', name: 'Poire', definition: 'Nuance fine de poire, distincte de la famille.', terms: ['pear', 'poire'],
    sourceRefs: [hopTestSource], familyRefs: [{ family: { id: 'pomeFruit', version: 'local-1' }, relation: 'memberOf', sourceRefs: [hopTestSource] }] },
  { id: 'apple-fixture', version: '1', name: 'Pomme', definition: 'Nuance fine de pomme, distincte de la famille.', terms: ['apple', 'pomme'],
    sourceRefs: [hopTestSource], familyRefs: [{ family: { id: 'pomeFruit', version: 'local-1' }, relation: 'memberOf', sourceRefs: [hopTestSource] }] }
];
function setup() {
  const pear = { ...hopTestVariety(), id: 'pear-hop', descriptions: [{ text: 'pear', context: 'rawHop' as const, source: hopTestSource }] };
  const apple = { ...hopTestVariety(), id: 'apple-hop', descriptions: [{ text: 'apple', context: 'rawHop' as const, source: hopTestSource }] };
  const model = structuredClone(extrapolations[0]) as HopExtrapolation;
  const axes = structuredClone(bootstrap.filter(row => row.kind === 'axis')) as HopAxis[];
  const data: HopEngineData = { varieties: [pear, apple], lots: [], knowledge: [...axes, testHopYeast, testHopPolicy, model] as HopKnowledge[] };
  const candidates = [pear, apple].map(variety => ({ id: variety.id, name: variety.id,
    input: { volumeL: 20, yeastId: testHopYeast.id, additions: [{ id: 'future', name: variety.id,
      triplet: { ...testHopTriplet, varietyId: variety.id, timing: 'postFermentation' as const, contactHours: 24, temperatureC: 15 } }], fermentation: [] } }));
  const plans = proposeBrewingNuancePlans({ planId: 'fixture-nuances', dimensions, sourceModel: model, axes,
    proposedAt: when, proposedBy: { origin: 'model', name: 'Proposition du modèle' } });
  const adopted = adoptBrewingNuancePlan(plans[1], { adoptedAt: when, adoptedBy: actor, reason: 'Comparer explicitement le scénario aux centrales déclarées.' });
  return { model, axes, data, candidates, plans, adopted };
}

describe('Projection numérique fine explicitement hypothétique', () => {
  it('propose des conventions existantes, exige adoption et conserve tous les originaux', () => {
    const fixture = setup(), before = structuredClone(fixture);
    expect(fixture.plans).toHaveLength(4);
    expect(() => projectBrewingNuances(fixture.plans[0], fixture.candidates, fixture.data)).toThrow(/Adopter/);
    const result = projectBrewingNuances(fixture.adopted, fixture.candidates, fixture.data);
    expect(result.candidates[0].values[0].status).toBe('hypothetical');
    expect(result.candidates[0].values[0].estimate?.range).not.toBeNull();
    const fullPlan = adoptBrewingNuancePlan(fixture.plans[0], { adoptedAt: when, adoptedBy: actor, reason: 'Garder toute l’enveloppe des priors.' });
    const full = projectBrewingNuances(fullPlan, fixture.candidates, fixture.data).candidates[0].values[0].estimate!;
    expect(full.range).toEqual({ min: 0, max: 100 });
    expect(full.central).toBeUndefined();
    expect(fixture).toEqual(before);
  });
  it('distingue deux nuances sans recopier la sortie commune de leur famille', () => {
    const f = setup();
    const broad = f.candidates.map(candidate => predictor.predictHopRecipe(candidate.input, {}, f.data).overall.profile.pomeFruit);
    expect(broad[0].range).toEqual(broad[1].range);
    const result = projectBrewingNuances(f.adopted, f.candidates, f.data);
    const pearInPear = result.candidates[0].values[0].estimate!, pearInApple = result.candidates[1].values[0].estimate!;
    expect(pearInPear.central).not.toBe(pearInApple.central);
    expect(pearInPear).not.toEqual(broad[0]);
    expect(result.candidates[0].modelSnapshot.doseReferences).toBeUndefined();
  });
  it('garde une non-mention dans le domaine incertain plutôt que la transformer en zéro', () => {
    const f = setup(); f.data.varieties.forEach(row => { row.descriptions = [{ text: 'not pear; no apple', context: 'rawHop', source: hopTestSource }]; });
    const envelope = adoptBrewingNuancePlan(f.plans[0], { adoptedAt: when, adoptedBy: actor, reason: 'Conserver les plages génériques sans les fixer aux centrales.' });
    const result = projectBrewingNuances(envelope, f.candidates, f.data);
    const estimate = result.candidates[0].values[0].estimate!;
    expect(estimate.range!.min).toBe(0);
    expect(estimate.range!.max).toBeGreaterThan(0);
    expect(estimate.reasons.join(' ')).toMatch(/inconn|renseign|document/i);
  });
  it('révise une hypothèse de matrice sans retoucher les coefficients de la source', () => {
    const f = setup(), sourceBefore = structuredClone(f.model);
    const original = projectBrewingNuances(f.adopted, f.candidates, f.data);
    const revised = reviseBrewingNuancePlan(f.adopted, { proposedAt: when, proposedBy: actor, explanation: 'Sensibilité sous autre matrice hypothétique.',
      parameterChoices: [...f.adopted.parameterChoices, { id: 'matrix-lower', target: { kind: 'matrix' }, range: { min: 0.2, max: 0.2 }, central: 0.2,
        origin: 'userHypothesis', explanation: 'Facteur de matrice explicitement choisi pour ce scénario.', sourceRefs: [] }] });
    const next = adoptBrewingNuancePlan(revised, { adoptedAt: when, adoptedBy: actor, reason: 'Explorer cette sensibilité.' });
    const result = projectBrewingNuances(next, f.candidates, f.data);
    expect(result.candidates[0].values[0].estimate!.central).toBeLessThan(original.candidates[0].values[0].estimate!.central!);
    expect(result.candidates[0].usedParameterChoiceIds).toContain('matrix-lower');
    expect(revised.previousReference).toBe(f.adopted.reference);
    expect(f.model).toEqual(sourceBefore);
  });
  it('réutilise le suivi des paramètres réellement lus, y compris la cinétique masquée', () => {
    const f = setup(); f.candidates.forEach(candidate => { candidate.input.additions[0].triplet.timing = 'boil' as any; candidate.input.additions[0].triplet.temperatureC = 100; });
    const revised = reviseBrewingNuancePlan(f.adopted, { proposedAt: when, proposedBy: actor, explanation: 'Contrôle de paramètres temporels.',
      parameterChoices: [...f.adopted.parameterChoices,
        { id: 'unused-extraction', target: { kind: 'timing', timing: 'boil', parameter: 'extractionHours' },
          range: f.model.timings.boil.extractionHours.range, central: f.model.timings.boil.extractionHours.central, origin: 'userHypothesis', explanation: 'Paramètre masqué par la décroissance.', sourceRefs: [] },
        { id: 'used-decay', target: { kind: 'timing', timing: 'boil', parameter: 'decayHours' },
          range: f.model.timings.boil.decayHours!.range, central: f.model.timings.boil.decayHours!.central, origin: 'userHypothesis', explanation: 'Paramètre de la formule réellement choisie.', sourceRefs: [] }
      ] });
    const plan = adoptBrewingNuancePlan(revised, { adoptedAt: when, adoptedBy: actor, reason: 'Contrôle fictif.' });
    const result = projectBrewingNuances(plan, f.candidates, f.data);
    expect(result.candidates[0].usedParameterChoiceIds).toContain('used-decay');
    expect(result.candidates[0].usedParameterChoiceIds).not.toContain('unused-extraction');
    expect(result.candidates[0].unappliedParameterChoiceIds).toEqual(['unused-extraction']);
    f.candidates[0].input.additions[0].triplet.contactHours = null as any;
    const unknownContact = projectBrewingNuances(plan, f.candidates, f.data).candidates[0];
    expect(unknownContact.usedParameterChoiceIds).not.toContain('used-decay');
    expect(unknownContact.usedParameterChoiceIds).not.toContain('unused-extraction');
  });
  it('donne un DTO commun sans changement de valeur/échelle et relit sans moteur', () => {
    const f = setup(), result = projectBrewingNuances(f.adopted, f.candidates, f.data);
    const spy = vi.spyOn(predictor, 'predictHopRecipe').mockImplementation(() => { throw Error('Le lecteur ne calcule pas.'); });
    try {
      expect(readBrewingNuanceProjection(result)).toEqual(result);
      const view = brewingNuanceViewModel(result, {
        context: { id: 'fixture-context', version: '1', kind: 'hypothesis', contentReference: 'fixture-context-ref', label: 'Contexte déclaré', sourceRefs: [] },
        reference: { id: 'fixture-reference', version: '1', kind: 'adoptedHypothesis', contentReference: f.adopted.reference, sourceRefs: [] }
      });
      expect(view.dimensions[0].definition).toEqual(result.planSnapshot.definitions[0]);
      expect(view.dimensions[0].values[0]).toMatchObject({ range: result.candidates[0].values[0].estimate!.range, status: 'hypothetical' });
      const altered = structuredClone(result); altered.candidates[0].name = 'altéré';
      expect(() => readBrewingNuanceProjection(altered)).toThrow(/Empreinte/);
      expect(readBrewingNuanceProjection({ ...result, version: 'brewing-nuance-projection-vNext' })).toHaveProperty('status', 'unsupportedFormat');
    } finally { spy.mockRestore(); }
  });
  it('refuse une source changée ou un plan modifié sans révision', () => {
    const f = setup(), changed = structuredClone(f.data);
    (changed.knowledge.find(row => row.kind === 'extrapolation') as HopExtrapolation).matrix.central = 0.9;
    expect(() => projectBrewingNuances(f.adopted, f.candidates, changed)).toThrow(/changé/);
    const altered = structuredClone(f.adopted); altered.explanation = 'autre';
    expect(() => projectBrewingNuances(altered, f.candidates, f.data)).toThrow(/adoption|Empreinte/i);
  });
  it('refuse les identités incompatibles avec la comparaison avant tout calcul, sans les renommer', () => {
    const f = setup();
    const spy = vi.spyOn(predictor, 'predictHopRecipe');
    try {
      for (const id of ['constructor', '__proto__', 'external/candidate']) {
        f.candidates[0].id = id;
        expect(() => projectBrewingNuances(f.adopted, f.candidates, f.data, {})).toThrow(/Candidat sensoriel invalide/);
        expect(f.candidates[0].id).toBe(id);
      }
      expect(spy).not.toHaveBeenCalled();
    } finally { spy.mockRestore(); }
  });
  it('refuse des contenus contradictoires sous la même version de dimension dès la proposition', () => {
    const f = setup();
    const conflicting = [dimensions[0], { ...dimensions[0], definition: 'Une autre signification sous le même identifiant.', terms: ['pineapple'] }];
    expect(() => proposeBrewingNuancePlans({ planId: 'conflicting-dimensions', dimensions: conflicting,
      sourceModel: f.model, axes: f.axes, proposedAt: when, proposedBy: actor })).toThrow(/version de dimension/);
  });
  it('conserve deux versions légitimes d’une dimension jusque dans le DTO', () => {
    const f = setup();
    // Allowed opaque IDs may still name inherited properties of candidateData.
    f.candidates[0].id = 'toString'; f.candidates[1].id = 'valueOf';
    const twoVersions = [dimensions[0], { ...dimensions[0], version: '2', definition: 'Nuance définie autrement dans la version deux.', terms: ['apple'] }];
    const plans = proposeBrewingNuancePlans({ planId: 'versioned-dimensions', dimensions: twoVersions,
      sourceModel: f.model, axes: f.axes, proposedAt: when, proposedBy: actor });
    const adopted = adoptBrewingNuancePlan(plans[1], { adoptedAt: when, adoptedBy: actor, reason: 'Comparer deux définitions versionnées distinctes.' });
    const result = projectBrewingNuances(adopted, f.candidates, f.data, {});
    const view = brewingNuanceViewModel(result, {
      context: { id: 'fixture-context', version: '1', kind: 'hypothesis', contentReference: 'fixture-context-ref', label: 'Contexte déclaré', sourceRefs: [] },
      reference: { id: 'fixture-reference', version: '1', kind: 'adoptedHypothesis', contentReference: adopted.reference, sourceRefs: [] }
    });
    expect(view.dimensions.map(row => row.definition.dimension.version)).toEqual(['1', '2']);
    expect(view.candidateOrder).toEqual(f.candidates.map(candidate => candidate.id));
    expect(view.dimensions[0].values[0]).toMatchObject({ range: result.candidates[0].values[0].estimate!.range });
  });
});
