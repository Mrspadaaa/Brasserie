import { describe, expect, it } from 'vitest';
import { assertHopRecipeInput, predictHopRecipe, type HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import { assertHopKnowledge, type HopAxis, type HopRiskPolicy, type HopTriplet, type HopYeast } from '../../functions/src/hopPredictionSchema';
import { predictHopTriplet, type HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopMeasurement, HopRange, HopVariety } from '../../functions/src/hopIndexSchema';
import modelPack from '../../src/data/hopExtrapolationBootstrap.json';
import aggregation from '../../src/data/hopRecipeAggregationBootstrap.json';
import yeastCatalogue from '../../src/data/yeastCatalogueBootstrap.json';
import definitions from '../../src/data/hopKnowledgeBootstrap.json';
import { testHopData, testHopModel, testHopPolicy, testHopTriplet } from '../fixtures/hopPrediction';

const model = modelPack[0] as HopExtrapolation;
const source = { ...model.source, kind: 'manufacturer' as const, year: 2026 };
const axes = definitions.filter(v => v.kind === 'axis') as HopAxis[];
const variety: HopVariety = { id: 'documented-hop', name: 'Test documenté', aliases: [], form: 'pelletT90', analysis: [], descriptions: [{ text: 'citrus floral', context: 'rawHop', source }] };
const yeast: HopYeast = { id: 'lalbrew-verdant-ipa', kind: 'yeast', name: 'Verdant', betaLyase: 'unknown', source };
const data = (): HopEngineData => structuredClone({ varieties: [variety], lots: [], knowledge: [...axes, yeast, model] });
const triplet = (patch: Partial<HopTriplet> = {}): HopTriplet => ({ varietyId: variety.id, yeastId: yeast.id, timing: 'postFermentation', doseGL: 4, temperatureC: 18, contactHours: 24, matrixId: null, ...patch });
const input = (ts: HopTriplet[] = [triplet()]): HopRecipeInput => ({ volumeL: 24, yeastId: yeast.id, additions: ts.map((t, i) => ({ id: `hop-${i}`, name: 'Houblon', triplet: t })), fermentation: [{ kind: 'primaire', tempC: 20, days: 7 }] });
const close = (a: HopRange | null, b: HopRange | null) => { expect(a).not.toBeNull(); expect(b).not.toBeNull(); expect(a!.min).toBeCloseTo(b!.min, 10); expect(a!.max).toBeCloseTo(b!.max, 10); };
const contains = (a: HopRange, b: HopRange) => { expect(a.min).toBeLessThanOrEqual(b.min + 1e-9); expect(a.max).toBeGreaterThanOrEqual(b.max - 1e-9); };
const fact = (analyte: HopMeasurement['analyte'], unit: HopMeasurement['unit'], values: Partial<HopMeasurement>): HopMeasurement => ({ analyte, unit, basis: 'asIs', kind: 'range', range: { min: 5, max: 7 }, source, confidence: 'medium', ...values });

describe('Recette entière : contextes, cumul conditionnel et provenance', () => {
  it('retrouve le calcul individuel quand la seule dose manque, au lieu d’oublier aussi son contact', () => {
    const d = data(), t = triplet({ doseGL: null, timing: 'boil', contactHours: 1, temperatureC: 100 });
    const one = predictHopTriplet(t, {}, d), p = predictHopRecipe(input([t]), {}, d);
    const legacy = predictHopRecipe(input([t]), {}, d, 'hop-recipe-experimental-v1');
    for (const axis of axes) {
      close(p.overall.profile[axis.id].range, one.profile[axis.id].range);
      contains(legacy.overall.profile[axis.id].range!, p.overall.profile[axis.id].range!);
    }
    expect(p.overall.profile.citrus.range!.max).toBeLessThan(legacy.overall.profile.citrus.range!.max);
    expect(p.overall.profile.citrus.central).toBeUndefined();
    expect(p.overall.profile.citrus.confidence).toBe('low');
    expect(p.engineVersion).toBe('hop-recipe-experimental-v4');
    expect(legacy.engineVersion).toBe('hop-recipe-experimental-v1');
  });
  it('les doses inconnues couvrent les répartitions concrètes, y compris zéro et une très forte dose', () => {
    const d = data();
    const partial = input([triplet({ doseGL: 2, contactHours: 1 }), triplet({ doseGL: null, contactHours: 2 }), triplet({ doseGL: null, contactHours: 3 })]);
    const bounded = predictHopRecipe(partial, {}, d), legacy = predictHopRecipe(partial, {}, d, 'hop-recipe-experimental-v1');
    for (const axis of axes) contains(legacy.overall.profile[axis.id].range!, bounded.overall.profile[axis.id].range!);
    for (const first of [0, .01, 1, 8, 16, 1e6]) for (const second of [0, .1, 4, 100]) {
      const concrete = structuredClone(partial);
      concrete.additions[1].triplet.doseGL = first; concrete.additions[2].triplet.doseGL = second;
      const p = predictHopRecipe(concrete, {}, d);
      for (const axis of axes) contains(bounded.overall.profile[axis.id].range!, p.overall.profile[axis.id].range!);
    }
    const allMissing = input([triplet({ doseGL: null }), triplet({ doseGL: null })]);
    const zero = predictHopRecipe(input([]), {}, d);
    const unknown = predictHopRecipe(allMissing, {}, d);
    for (const axis of axes) contains(unknown.overall.profile[axis.id].range!, zero.overall.profile[axis.id].range!);
  });
  it('ne change aucune plage connue et rejette une version de calcul non reconnue', () => {
    const r = input([triplet(), triplet({ doseGL: 1, timing: 'whirlpool', contactHours: .3, temperatureC: 80 })]);
    const current = predictHopRecipe(r, {}, data()), legacy = predictHopRecipe(r, {}, data(), 'hop-recipe-experimental-v1');
    expect({ ...current, engineVersion: legacy.engineVersion, warnings: legacy.warnings }).toEqual(legacy);
    expect(() => predictHopRecipe(r, {}, data(), 'imaginary' as any)).toThrow('Version');
  });
  it('valide la convention modifiable et exige sa provenance datée', () => {
    expect(model.aggregation).toEqual(aggregation);
    expect(() => assertHopKnowledge(model)).not.toThrow();
    for (const patch of [{ source: { ...model.aggregation!.source, year: null } }, { limitations: [] }, { version: '' }]) {
      expect(() => assertHopKnowledge({ ...model, aggregation: { ...model.aggregation, ...patch } })).toThrow();
    }
    const d = data(); (d.knowledge.find(k => k.kind === 'extrapolation') as HopExtrapolation).aggregation = undefined;
    const p = predictHopRecipe(input([triplet(), triplet()]), {}, d);
    expect(p.overall.profile.citrus.range).toBeNull(); expect(p.additions[0].profile.citrus.range).not.toBeNull();
  });
  it('contrat de persistance strict, inconnues autorisées et souche unique', () => {
    expect(() => assertHopRecipeInput(input())).not.toThrow();
    expect(() => assertHopRecipeInput({ ...input(), volumeL: 0, fermentation: [{}] })).not.toThrow();
    for (const patch of [{ volumeL: NaN }, { extra: 1 }, { yeastId: 'another' }, { additions: [input().additions[0], input().additions[0]] }, { fermentation: [{ days: -1 }] }]) {
      expect(() => assertHopRecipeInput({ ...input(), ...patch })).toThrow();
    }
  });
  it('un ajout retrouve les bornes du modèle individuel ; fond levure compté une fois', () => {
    const d = data(), one = predictHopTriplet(triplet(), {}, d), recipe = predictHopRecipe(input(), {}, d);
    for (const a of axes) close(recipe.overall.profile[a.id].range, one.profile[a.id].range);
    expect(recipe.overall.conditionalEnvelope).toBe(true); expect(recipe.overall.interactionsNonQuantifiees).toBe(false);
    const zero = predictHopRecipe(input([]), {}, d), oldZero = predictHopTriplet(triplet({ doseGL: 0 }), {}, d);
    for (const a of axes) close(zero.overall.profile[a.id].range, oldZero.profile[a.id].range);
  });
  it('scinder une ligne, permuter les ajouts, renommer les événements ou ajouter zéro ne change pas les bornes', () => {
    const d = data(), base = predictHopRecipe(input(), {}, d);
    const splitInput = input([triplet({ doseGL: 2 }), triplet({ doseGL: 2 }), triplet({ doseGL: 0, varietyId: null, timing: null })]);
    splitInput.additions.reverse(); splitInput.additions[1].id = 'autre-identifiant'; splitInput.additions[1].name = 'Autre libellé';
    const split = predictHopRecipe(splitInput, {}, d);
    for (const a of axes) close(split.overall.profile[a.id].range, base.overall.profile[a.id].range);
    expect(split.overall.profile.citrus.central).toBeCloseTo(base.overall.profile.citrus.central!, 10);
  });
  it('un ajout à cru de zéro gramme ne crée aucun risque de recette ni ne valide un faux programme à cru', () => {
    // Synthetic threshold: tests branching only, never a proposed chemical limit.
    const risk: HopRiskPolicy = { id: 'test-precursors', kind: 'risk', risk: 'precursors', name: 'Test exclusivement', enabled: true, source, advice: 'Fixture synthétique.',
      matrixId: 'test-risk', analyte: '3mhCys', unit: 'ugKg', basis: 'asIs', threshold: { range: { min: 10, max: 20 }, source } };
    const d = data(); d.knowledge.push(risk);
    d.varieties[0].analysis = [fact('3mhCys', 'ugKg', { range: { min: 1, max: 2 } })];
    d.varieties.push({ ...variety, id: 'autre-hop', name: 'Autre houblon' });
    const r = input([triplet({ timing: 'whirlpool', temperatureC: 80, contactHours: 1 / 3, matrixId: 'test-risk' })]);
    r.fermentation.push({ kind: 'ajout', name: 'Ajout à cru annoncé', days: 3 });
    const baseline = predictHopRecipe(r, {}, d);
    r.additions.push({ id: 'zero', name: 'Zéro', triplet: triplet({ varietyId: 'autre-hop', doseGL: 0, matrixId: 'test-risk' }) });
    const p = predictHopRecipe(r, {}, d);
    expect(p.overall.risks).toEqual(baseline.overall.risks);
    expect(p.warnings).toEqual(baseline.warnings);
    expect(baseline.overall.risks).toHaveLength(0);
    expect(p.additions[1].risks.some(r => r.code === 'precursors' && r.status === 'unknown')).toBe(true);
  });
  it('préserve J7/J12 et les contacts sans bonus numérique inventé pour l’espacement', () => {
    const r = input([triplet({ doseGL: 2, contactHours: 12 }), triplet({ doseGL: 2, contactHours: 48 })]);
    r.additions[0].dayOffset = 7; r.additions[1].dayOffset = 12;
    const before = structuredClone(r), a = predictHopRecipe(r, {}, data());
    expect(r).toEqual(before); expect(a.input.additions.map(h => h.dayOffset)).toEqual([7, 12]);
    expect(a.additions.map(p => p.triplet.contactHours)).toEqual([12, 48]);
    const shifted = structuredClone(r); shifted.additions[1].dayOffset = 13;
    close(predictHopRecipe(shifted, {}, data()).overall.profile.citrus.range, a.overall.profile.citrus.range);
    const contact = structuredClone(r); contact.additions[1].triplet.contactHours = 1;
    expect(predictHopRecipe(contact, {}, data()).overall.profile.citrus.range).not.toEqual(a.overall.profile.citrus.range);
  });
  it('une inconnue de dose, contact ou description élargit les plages sans moyenne imputée', () => {
    const r = input([triplet({ doseGL: 2 }), triplet({ doseGL: 3, timing: 'whirlpool', temperatureC: 80, contactHours: 1 / 3 })]);
    const d = data(), known = predictHopRecipe(r, {}, d);
    for (const field of ['doseGL', 'contactHours', 'timing'] as const) {
      const missing = structuredClone(r); missing.additions[0].triplet[field] = null;
      const p = predictHopRecipe(missing, {}, d);
      for (const a of axes) contains(p.overall.profile[a.id].range!, known.overall.profile[a.id].range!);
      expect(p.overall.profile.citrus.central).toBeUndefined();
    }
    d.varieties[0].descriptions = [];
    for (const a of axes) contains(predictHopRecipe(r, {}, d).overall.profile[a.id].range!, known.overall.profile[a.id].range!);
  });
  it('un contexte absent ne devient pas une intensité moyenne : domaine entier ou sortie inconnue', () => {
    const r = input([triplet({ timing: null })]), p = predictHopRecipe(r, {}, data());
    expect(p.overall.profile.citrus.range).toEqual({ min: 0, max: 100 }); expect(p.overall.profile.citrus.central).toBeUndefined();
    const noYeast = { ...input(), yeastId: null };
    expect(predictHopRecipe(noYeast, {}, data()).overall.profile.citrus.range).toBeNull();
    const unknownStrain = data(); unknownStrain.knowledge.push({ ...yeast, id: 'uncharacterized', name: 'Non caractérisée' });
    expect(predictHopRecipe({ ...input(), yeastId: 'uncharacterized' }, {}, unknownStrain).overall.profile.citrus.central).toBeUndefined();
  });
  it('conserve paramètres partagés et sources répétées sans réduction par le nombre de lignes', () => {
    const r = input(Array.from({ length: 20 }, () => triplet({ doseGL: .2 }))), d = data();
    d.varieties[0].descriptions.push(...d.varieties[0].descriptions);
    const p = predictHopRecipe(r, {}, d), one = predictHopRecipe(input(), {}, data());
    for (const a of axes) close(p.overall.profile[a.id].range, one.overall.profile[a.id].range);
    expect(p.overall.profile.citrus.confidence).toBe('low');
    expect(p.overall.profile.citrus.reasons.join(' ')).toContain('aucun taux de couverture');
  });
  it('ne fait pas de somme de modèles de bière étalonnés, qui incluent déjà leur fond fermentaire', () => {
    const d = testHopData(), m = d.knowledge.find(v => v.kind === 'model') as ReturnType<typeof testHopModel>;
    m.outputs.push({ target: 'beer:4mmpFree', envelope: { range: { min: 2, max: 3 }, source } });
    const r = { ...input([testHopTriplet]), yeastId: testHopTriplet.yeastId };
    const single = predictHopRecipe(r, {}, d);
    expect(single.chemistry.final['4mmpFree'].range).toEqual({ min: 2, max: 3 }); expect(single.chemistry.final['4mmpFree'].unit).toBe('ngL');
    const multiple = predictHopRecipe({ ...r, additions: [...r.additions, { ...r.additions[0], id: 'second' }] }, {}, d);
    expect(multiple.overall.profile.citrus.range).toBeNull(); expect(multiple.chemistry.final['4mmpFree'].range).toBeNull();
  });
  it('tient compte du programme réel et normalise explicitement une référence de souche contradictoire', () => {
    const r = input([triplet({ timing: 'whirlpool' })]); r.additions[0].triplet.yeastId = 'autre'; r.fermentation.push({ kind: 'ajout', name: 'Dry hop', tempC: 19, days: 3 });
    const p = predictHopRecipe(r, {}, data()); expect(p.input.additions[0].triplet.yeastId).toBe(yeast.id);
    expect(p.warnings.join(' ')).toContain('référence de souche différente'); expect(p.warnings.join(' ')).toContain('aucun ajout à cru');
  });
  it('contrôle Diamond avec le catalogue réellement disponible même sans guide de fermentation', () => {
    const diamond = yeastCatalogue.find(y => y.id === 'lalbrew-diamond') as HopYeast;
    const d = data(); d.knowledge.push(diamond);
    const r = { ...input(), yeastId: diamond.id, fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 19, days: 4 }, { name: 'Froid', kind: 'garde', tempC: 4, days: 2 }] };
    const p = predictHopRecipe(r, {}, d);
    expect(p.warnings.join(' ')).toContain('19 °C, hors de la fenêtre fabricant (10–15 °C)');
    expect(p.warnings.join(' ')).not.toContain('Froid :');
    const legacy = predictHopRecipe({ ...r, fermentation: [{ name: 'Ancien palier', tempC: 19 }] }, {}, d);
    expect(legacy.warnings.join(' ')).toContain('phase inconnue');
    expect(legacy.warnings.join(' ')).not.toContain('hors de la fenêtre');
  });
  it('ne crée aucune moyenne ou union de températures fabricant contradictoires ou qualifiées', () => {
    const diamond = structuredClone(yeastCatalogue.find(y => y.id === 'lalbrew-diamond')) as HopYeast;
    const temperature = diamond.catalogue!.facts.find(f => f.key === 'temperature')!;
    diamond.catalogue!.facts.push({ ...temperature, reported: 'Autre condition', range: { min: 18, max: 22 } });
    const d = data(); d.knowledge.push(diamond);
    const r = { ...input(), yeastId: diamond.id, fermentation: [{ kind: 'primaire', tempC: 19 }] };
    expect(predictHopRecipe(r, {}, d).warnings.join(' ')).toContain('sources non concordantes');
    expect(predictHopRecipe(r, {}, d).warnings.join(' ')).not.toContain('10–22');
  });
  it('reste un calcul direct borné à vingt ajouts sans exploration combinatoire', () => {
    const r = input(Array.from({ length: 20 }, (_, i) => triplet({ doseGL: .2, contactHours: 12 + i })));
    const started = performance.now(), p = predictHopRecipe(r, {}, data());
    expect(p.additions).toHaveLength(20); expect(Object.keys(p.overall.profile)).toHaveLength(axes.length);
    // Regression budget only; deliberately loose for slower CI hosts, never a chemistry coefficient.
    expect(performance.now() - started).toBeLessThan(1000);
  });
});

describe('Bilan des quantités introduites : aucune concentration finale inventée', () => {
  it('plafonne chaque source : jugement, année absente, communauté et politique modifiable', () => {
    const d = data(); d.knowledge.push(structuredClone(testHopPolicy));
    const measurement = fact('alpha', 'percentMass', { confidence: 'high', source: { ...source, kind: 'coa' } });
    d.varieties[0].analysis = [measurement];
    const recipe = input([triplet({ doseGL: 1 })]);
    expect(predictHopRecipe(recipe, {}, d).chemistry.introduced.alpha.confidence).toBe('high');
    for (const patch of [{ kind: 'judgment' as const }, { year: null }, { kind: 'community' as const }]) {
      measurement.source = { ...source, kind: 'coa', ...patch };
      const result = predictHopRecipe(recipe, {}, d).chemistry.introduced.alpha;
      expect(result.confidence).toBe('low'); expect(result.range).toEqual({ min: 1200, max: 1680 });
      expect(result.sources).toContainEqual(testHopPolicy.source);
    }
    measurement.source = { ...source, kind: 'coa' };
    d.varieties.push({ ...variety, id: 'judgment-hop', analysis: [{ ...measurement, source: { ...source, kind: 'judgment' } }] });
    recipe.additions.push({ id: 'judgment', name: 'Jugement', triplet: triplet({ varietyId: 'judgment-hop', doseGL: 1 }) });
    expect(predictHopRecipe(recipe, {}, d).chemistry.introduced.alpha.confidence).toBe('low');
    (d.knowledge.find(k => k.kind === 'confidence') as typeof testHopPolicy).caps.coa = 'medium';
    expect(predictHopRecipe(input([triplet({ doseGL: 1 })]), {}, d).chemistry.introduced.alpha.confidence).toBe('medium');
  });
  it('une somme non finie reste inconnue avec confiance faible, même si chaque borne était finie', () => {
    const d = data(); d.knowledge.push(testHopPolicy);
    d.varieties[0].analysis = [fact('alpha', 'percentMass', { confidence: 'high', source: { ...source, kind: 'coa' } })];
    const recipe = { ...input(Array.from({ length: 4 }, () => triplet({ doseGL: 1e306 }))), volumeL: 1 };
    const amount = predictHopRecipe(recipe, {}, d).chemistry.introduced.alpha;
    expect(amount.coverage.knownAdditions).toBe(4); expect(amount.range).toBeNull(); expect(amount.confidence).toBe('low');
    expect(amount.reasons.join(' ')).toContain('Somme hors du domaine numérique fini');
  });
  it('convertit les seules unités massiques compatibles et préserve les marges publiées', () => {
    const d = data(); d.varieties[0].analysis = [fact('alpha', 'percentMass', {}), fact('3mhFree', 'ugKg', { range: { min: 100, max: 200 } }), fact('totalOil', 'ml100g', { range: { min: 1, max: 2 } })];
    const p = predictHopRecipe(input([triplet({ doseGL: 1 })]), {}, d).chemistry;
    expect(p.introduced.alpha.range).toEqual({ min: 1200, max: 1680 }); expect(p.introduced.alpha.unit).toBe('mg');
    close(p.introduced['3mhFree'].range, { min: 2.4, max: 4.8 }); expect(p.introduced['3mhFree'].unit).toBe('ug');
    expect(p.introduced.totalOil.range).toEqual({ min: .24, max: .48 }); expect(p.introduced.totalOil.unit).toBe('mL');
    expect(p.final['4mmpFree'].range).toBeNull();
  });
  it('un COA ponctuel sans marge donne un nominal distinct, jamais une bande artificielle', () => {
    const d = data(); d.varieties[0].analysis = [fact('alpha', 'percentMass', { kind: 'point', value: 6, range: undefined })];
    const p = predictHopRecipe(input([triplet({ doseGL: 1 })]), {}, d).chemistry.introduced.alpha;
    expect(p.range).toBeNull(); expect(p.reported).toBe(1440); expect(p.confidence).toBe('low');
    expect(p.reasons.join(' ')).toContain('marge analytique non publiée');
  });
  it('une analyse manquante conserve un sous-total explicitement partiel', () => {
    const d = data(); d.varieties[0].analysis = [fact('alpha', 'percentMass', {})];
    d.varieties.push({ ...variety, id: 'missing', analysis: [] });
    const p = predictHopRecipe(input([triplet({ doseGL: 1 }), triplet({ varietyId: 'missing', doseGL: 1 })]), {}, d).chemistry.introduced.alpha;
    expect(p.range).toBeNull(); expect(p.partialRange).toEqual({ min: 1200, max: 1680 }); expect(p.coverage).toEqual({ knownAdditions: 1, totalAdditions: 2 });
    expect(p.reported).toBeUndefined();
  });
  it('ne convertit pas les % huile, matière sèche sans humidité, équivalents de thiol ou HSI', () => {
    const d = data(); d.varieties[0].analysis = [fact('geraniol', 'percentOil', { basis: 'oil' }), fact('alpha', 'percentMass', { basis: 'dryMatter' }), fact('3mhGsh', 'ugKgThiolEquivalent', {}), fact('hsi', 'index', {})];
    const p = predictHopRecipe(input(), {}, d).chemistry.introduced;
    for (const key of ['geraniol', 'alpha', '3mhGsh', 'hsi']) { expect(p[key].range).toBeNull(); expect(p[key].reported).toBeUndefined(); }
  });
  it('le même lot scindé garde la même incertitude et un mauvais lien de lot reste inconnu', () => {
    const d = data(); d.lots.push({ id: 'lot', varietyId: variety.id, name: 'Lot mesuré', form: 'pelletT90', analysis: [fact('alpha', 'percentMass', { range: { min: 6, max: 7 } })] });
    const a = predictHopRecipe(input([triplet({ doseGL: 4, lotId: 'lot' })]), {}, d);
    const b = predictHopRecipe(input([triplet({ doseGL: 2, lotId: 'lot' }), triplet({ doseGL: 2, lotId: 'lot' })]), {}, d);
    close(a.chemistry.introduced.alpha.range, b.chemistry.introduced.alpha.range);
    d.lots[0].varietyId = 'different';
    expect(predictHopRecipe(input([triplet({ lotId: 'lot' })]), {}, d).chemistry.introduced.alpha.range).toBeNull();
  });
});
