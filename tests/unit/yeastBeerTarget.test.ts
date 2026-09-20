import { describe, expect, it } from 'vitest';
import { applyYeastBeerVariation, prepareYeastBeerVariation, previewYeastBeerTarget, readYeastBeerTarget, yeastBeerTargetStateKey, type YeastBeerTarget, type YeastBeerVariation } from '../../src/domain/yeastBeerTarget';
import { applyYeastRecipeDesign, createYeastRecipeDraft, readYeastRecipeDesign, yeastRecipeDesignChanged } from '../../src/domain/yeastRecipeDesign';
import { projectYeastRecipe, yeastRecipeBoilOg } from '../../src/domain/yeastProjection';
import { yeastReferences } from '../../src/domain/yeastReferences';
import type { Fermentable, Recipe, YeastSpec } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';

const refs = yeastReferences([]);
const malt: Fermentable = { name: 'Pale', kind: 'grain', use: 'empatage', weightKg: 5, pct: 100, potentialPpg: 37 };
const base = (patch: Partial<Recipe> = {}): Recipe => ({ ...structuredClone(fullRecipe), name: 'Témoin', style: 'Pale Ale', volumeL: 20, efficiencyPct: 75,
  ogTarget: 1.05, fgTarget: 1.01, abvTarget: 5.25, ibuTarget: null, totalGristKg: 5, boilMin: 60,
  fermentables: [{ ...malt }], yeast: { name: 'Laboratoire rare R-42', attenuationPct: 80, attenuationBasis: 'recipe' },
  hops: [{ name: 'Magnum', stage: 'boil', weightG: 25, alpha: 10, timeMin: 60 }, { name: 'Citra', stage: 'dryHop', weightG: 80, alpha: 12, dayOffset: 3, aromaContactHours: 48, aromaTemperatureC: 20, aromaTiming: 'fermentation' }],
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }], ...patch });
const draftFor = (recipe: Recipe, target: YeastBeerTarget = {}) => ({ ...createYeastRecipeDraft(recipe, refs), beerTarget: target });
const identity = { fermentableScale: 1, hotHopScale: 1 };
const gravityPoints = (f: Fermentable) => f.potentialPpg! * f.weightKg * 2.2046226 * ((f.kind ?? 'grain') === 'grain' ? .75 : 1) / (20 * .26417205);
// Independent Tinseth statement, not a call to the implementation being tested.
const tinseth = (grams: number, alpha: number, sg: number) => grams * 1000 / 20 * alpha / 100 * 1.65 * Math.pow(.000125, sg - 1) * (1 - Math.exp(-.04 * 60)) / 4.15;

describe('Cible de bière : intention et variation explicite', () => {
  it.each([
    { label: 'Champagne sucrée', finish: 'sweet', sparkling: true },
    { label: 'Stout amère et chocolatée', accent: 'chocolate' },
    { label: 'Session NEIPA douce, légère et peu amère', finish: 'round' }
  ] as YeastBeerTarget[])('ne traduit pas « $label » en chiffres ou modifications automatiques', target => {
    const recipe = base(), before = structuredClone(recipe), draft = draftFor(recipe, target);
    const result = prepareYeastBeerVariation(recipe, draft, refs);
    expect(result.variation).toEqual(identity);
    expect(result.preview.current).toEqual(result.preview.variant);
    expect(result.preview.targetStatus).toEqual({ abv: 'unset', ibu: 'unset' });
    expect(result.reasons.join(' ')).toContain('Aucune plage numérique choisie');
    expect(result.preview.changes.map(c => c.id)).toEqual(['beer-target']);
    expect(recipe).toEqual(before);
    const saved = applyYeastBeerVariation(recipe, draft, refs);
    const { yeastDesign, ...rest } = saved;
    expect(rest).toEqual(before);
    expect(yeastDesign!.beerTarget).toEqual({ ...target, modelVersion: 'yeast-beer-target-1' });
    expect(createYeastRecipeDraft(JSON.parse(JSON.stringify(saved)), refs).beerTarget).toEqual(yeastDesign!.beerTarget);
  });

  it('rapproche ABV puis IBU, sans modifier le houblon à cru ou choisir une atténuation', () => {
    const recipe = base(), before = structuredClone(recipe), draft = draftFor(recipe, { abv: { min: 2.5, max: 3.5 }, ibu: { min: 10, max: 20 }, finish: 'round' });
    const result = prepareYeastBeerVariation(recipe, draft, refs);
    expect(result.preview.errors).toEqual([]);
    expect(result.variation.fermentableScale).toBeCloseTo(2 / 3, 12);
    expect(result.variation.attenuationPct).toBeUndefined();
    expect(result.preview.variant.projection.og).toBeCloseTo(1 + .05 * 2 / 3, 12);
    expect(result.preview.variant.projection.fg.range!.min).toBeCloseTo(1 + .01 * 2 / 3, 12);
    expect(result.preview.variant.projection.abv.range!.min).toBeCloseTo(3.5, 12);
    expect(result.variation.hotHopScale).toBeCloseTo(20 / tinseth(25, 10, 1 + .05 * 2 / 3), 12);
    expect(result.preview.variant.ibu.total).toBeCloseTo(20, 12);
    expect(result.preview.targetStatus).toEqual({ abv: 'inside', ibu: 'inside' });
    expect(result.preview.warnings.join(' ')).toContain('DF seule ne prédit ni douceur');
    expect(recipe).toEqual(before);
    const saved = applyYeastBeerVariation(recipe, draft, refs, result.variation, result.preview.baseKey);
    expect(saved.fermentables[0].weightKg).toBeCloseTo(10 / 3, 12);
    expect(saved.totalGristKg).toBeCloseTo(10 / 3, 12);
    expect(saved.fermentables[0].pct).toBe(100);
    expect(saved.hops[1]).toEqual(recipe.hops[1]);
    expect(saved.yeast).toEqual(recipe.yeast);
    expect(saved.volumeL).toBe(20); expect(saved.efficiencyPct).toBe(75);
    expect(saved.mash).toEqual(recipe.mash); expect(saved.waterPlan).toEqual(recipe.waterPlan);
    expect(saved.ogTarget).toBeCloseTo(1.033333333333333, 12); expect(saved.fgTarget).toBeCloseTo(1.006666666666667, 12);
    expect(saved.abvTarget).toBeCloseTo(3.5, 12); expect(saved.ibuTarget).toBe(20);
    const reopened = JSON.parse(JSON.stringify(saved)), snapshot = readYeastRecipeDesign(reopened)!;
    expect(snapshot).toBeDefined(); expect(yeastRecipeDesignChanged(reopened, snapshot)).toBe(false);
    expect(projectYeastRecipe(reopened).fg.range!.min).toBeCloseTo(saved.fgTarget!, 12);
    expect(yeastRecipeDesignChanged({ ...reopened, fermentables: [{ ...malt, weightKg: 6 }] }, snapshot)).toBe(true);
  });

  it('une stout 60–80 IBU augmente seulement les ajouts à chaud sans prétendre simuler le chocolat', () => {
    const recipe = base({ style: 'Imperial Stout', ogTarget: 1.1, fermentables: [{ ...malt, name: 'Pale', weightKg: 8, pct: 80 }, { ...malt, name: 'CARAFA 2', weightKg: 2, pct: 20, colorEbc: 1150 }] });
    const result = prepareYeastBeerVariation(recipe, draftFor(recipe, { ibu: { min: 60, max: 80 }, accent: 'chocolate' }), refs);
    expect(result.variation.fermentableScale).toBe(1);
    expect(result.variation.hotHopScale).toBeCloseTo(60 / tinseth(25, 10, 1.1), 12);
    expect(result.preview.variant.projection).toEqual(result.preview.current.projection);
    expect(result.preview.variant.ibu.total).toBeCloseTo(60, 12);
    expect(result.preview.warnings.join(' ')).toContain('aucun score');
  });

  it('maintient toute la plage documentaire, sans midpoint pour forcer une cible étroite', () => {
    const recipe = base({ yeast: { name: 'Rare', technicalFacts: [{ key: 'attenuation', reported: '70–90 %', range: { min: 70, max: 90 }, qualifier: 'range', unit: '%', origin: 'manufacturer' }] } });
    const target = { abv: { min: 3, max: 3.1 } }, draft = draftFor(recipe, target);
    const result = prepareYeastBeerVariation(recipe, draft, refs);
    expect(result.variation).toEqual(identity); expect(result.reasons.join(' ')).toContain('plage d’alcool calculée est trop large');
    expect(result.preview.variant.projection.abv.range!.min).toBeCloseTo(4.59375, 12);
    expect(result.preview.variant.projection.abv.range!.max).toBeCloseTo(5.90625, 12);
    const chosen = prepareYeastBeerVariation(recipe, draft, refs, { ...identity, attenuationPct: 80 });
    expect(chosen.preview.targetStatus.abv).toBe('inside');
    const saved = applyYeastBeerVariation(recipe, draft, refs, chosen.variation);
    expect(saved.yeast).toMatchObject({ attenuationPct: 80, attenuationBasis: 'recipe', technicalFacts: recipe.yeast.technicalFacts });
    const rangeSaved = applyYeastBeerVariation(recipe, draft, refs, { ...identity, fermentableScale: .75 });
    expect(rangeSaved.fgTarget).toBeNull(); expect(rangeSaved.abvTarget).toBeNull();
  });

  it('les réglages non appliqués du brouillon ne se glissent pas dans la variante', () => {
    const recipe = base({ yeast: { name: 'Rare', qty: 0, unit: '', form: '', attenuationPct: 80, attenuationBasis: 'recipe', notes: 'Conserver exactement.' } }), before = structuredClone(recipe);
    const draft = { ...draftFor(recipe, { finish: 'sweet' }), temperatureC: 30, attenuationPct: 90, pressureBar: 2, process: 'mixed-culture' as const, quantityG: 20, viableCellsBillion: 999,
      cultureRoles: [{ name: 'Culture supplémentaire', role: 'acidifying' as const }], programme: [{ name: 'Autre', kind: 'primaire' as const, tempC: 30, days: 50 }] };
    const preview = previewYeastBeerTarget(recipe, draft, refs), saved = applyYeastBeerVariation(recipe, draft, refs);
    expect(preview.variant.projection.abv.range!.min).toBeCloseTo(5.25, 12);
    expect(saved.yeast).toEqual(recipe.yeast); expect(saved.fermentation).toEqual(recipe.fermentation);
    expect(saved.yeastDesign?.process).toBe('unspecified'); expect(saved.yeastDesign?.cultureRoles).toBeUndefined();
    expect(saved.yeastDesign?.viableCellsBillion).toBeUndefined(); expect(saved.yeastDesign?.pressureBar).toBeUndefined();
    const { yeastDesign: _target, ...rest } = saved; expect(rest).toEqual(before);
    expect(readYeastRecipeDesign(saved)).toBeDefined();
  });

  it('conserve les cultures, cellules et phases déjà appliquées et les snapshots sans cible', () => {
    const recipe = base({ style: 'Sour', fermentation: [{ kind: 'primaire', name: 'Principale', tempC: 20, days: 10 }, { kind: 'ajout', name: 'Fruit', tempC: 20, days: 2 }, { kind: 'refermentation', name: 'Bouteille', tempC: 22, days: 14 }] });
    const plan = { ...createYeastRecipeDraft(recipe, refs), process: 'mixed-culture' as const, cultureRoles: [{ name: 'Levure', role: 'alcoholic' as const }, { name: 'Culture acide', role: 'acidifying' as const }], viableCellsBillion: 150, pitchRateMillionPerMlPlato: .8, pressureBar: .2, programme: recipe.fermentation };
    const applied = applyYeastRecipeDesign(recipe, plan, refs), old = readYeastRecipeDesign(applied)!;
    expect(old.beerTarget).toBeUndefined(); expect(old.applied.fermentables).toBeUndefined();
    const saved = applyYeastBeerVariation(applied, draftFor(applied, { finish: 'round' }), refs);
    expect(saved.fermentation).toEqual(applied.fermentation); expect(saved.yeast).toEqual(applied.yeast);
    expect(saved.yeastDesign).toMatchObject({ process: 'mixed-culture', cultureRoles: plan.cultureRoles, viableCellsBillion: 150, pitchRateMillionPerMlPlato: .8, pressureBar: .2, programme: applied.fermentation });
    expect(readYeastRecipeDesign(JSON.parse(JSON.stringify(saved)))).toBeDefined();
    expect(readYeastRecipeDesign(applied)).toEqual(old);
  });

  it('refuse une application périmée, sans mutation partielle', () => {
    const recipe = base(), draft = draftFor(recipe, { abv: { min: 2.5, max: 3.5 } }), result = prepareYeastBeerVariation(recipe, draft, refs);
    const changed = { ...recipe, fermentables: [{ ...malt, weightKg: 4 }] }, before = structuredClone(changed);
    expect(() => applyYeastBeerVariation(changed, draft, refs, result.variation, result.preview.baseKey)).toThrow('recette a changé');
    expect(changed).toEqual(before); expect(yeastBeerTargetStateKey(changed)).not.toBe(result.preview.baseKey);
  });

  it.each([
    { fermentableScale: NaN, hotHopScale: 1 }, { fermentableScale: 0, hotHopScale: 1 }, { fermentableScale: -1, hotHopScale: 1 },
    { fermentableScale: Infinity, hotHopScale: 1 }, { fermentableScale: 1, hotHopScale: -1 }, { fermentableScale: 1, hotHopScale: NaN },
    { fermentableScale: 1, hotHopScale: 1, attenuationPct: NaN }, { fermentableScale: 1, hotHopScale: 1, attenuationPct: 101 }
  ] as YeastBeerVariation[])('rejette les paramètres invalides %j sans écrire', variation => {
    const recipe = base(), before = structuredClone(recipe), draft = draftFor(recipe);
    expect(previewYeastBeerTarget(recipe, draft, refs, variation).errors.length).toBeGreaterThan(0);
    if (Number.isNaN(variation.fermentableScale)) expect(previewYeastBeerTarget(recipe, draft, refs, variation).errors).toEqual(['Facteur de fermentescibles positif et fini requis.']);
    expect(() => applyYeastBeerVariation(recipe, draft, refs, variation)).toThrow(); expect(recipe).toEqual(before);
  });

  it('ne propose aucun nombre pour alpha, masses, volume, rendement, procédé ou atténuation inconnus', () => {
    const recipe = base({ yeast: { name: 'Rare' }, hops: [{ name: 'Lot sans alpha', stage: 'boil', weightG: 25, alpha: 0, timeMin: 60 }] });
    const result = prepareYeastBeerVariation(recipe, draftFor(recipe, { abv: { min: 3, max: 4 }, ibu: { min: 15, max: 20 } }), refs);
    expect(result.variation).toEqual(identity); expect(result.preview.targetStatus).toEqual({ abv: 'unknown', ibu: 'unknown' });
    expect(result.reasons.join(' ')).toContain('compléter alpha');
    for (const patch of [{ volumeL: 0 }, { efficiencyPct: null }, { fermentables: [{ ...malt, weightKg: NaN }] }, { fermentables: [] }]) {
      const invalid = base(patch); expect(previewYeastBeerTarget(invalid, draftFor(invalid), refs, { ...identity, fermentableScale: .5 }).errors.length).toBeGreaterThan(0);
    }
    const sour = base({ style: 'Sour' }); expect(prepareYeastBeerVariation(sour, draftFor(sour, { abv: { min: 3, max: 4 } }), refs).preview.targetStatus.abv).toBe('unknown');
  });

  it('préserve la voie NOLO, même si une cible libre est mémorisée', () => {
    const recipe = base({ nolo: { enabled: true } as Recipe['nolo'] }), draft = draftFor(recipe, { abv: { min: 0, max: .5 } });
    expect(previewYeastBeerTarget(recipe, draft, refs).variant.projection.abv.range).toBeNull();
    expect(() => applyYeastBeerVariation(recipe, draft, refs, { ...identity, fermentableScale: .1 })).toThrow('NOLO');
    expect(applyYeastBeerVariation(recipe, draft, refs).nolo).toEqual(recipe.nolo);
  });

  it('valide les cibles persistées, y compris plages zéro, sans élargir les valeurs', () => {
    expect(readYeastBeerTarget({ abv: { min: 0, max: 0 }, ibu: { min: 0, max: 0 }, sparkling: false })).toEqual({ modelVersion: 'yeast-beer-target-1', abv: { min: 0, max: 0 }, ibu: { min: 0, max: 0 }, sparkling: false });
    for (const target of [{ abv: { min: 4, max: 3 } }, { ibu: { min: -1, max: 5 } }, { abv: { min: 0, max: NaN } }, { abv: { min: 0, max: 101 } }, { finish: 'caramel' }, { sensoryScore: 8 }]) expect(readYeastBeerTarget(target)).toBeUndefined();
    const recipe = base(), saved = applyYeastBeerVariation(recipe, draftFor(recipe, { finish: 'sweet' }), refs);
    expect(readYeastRecipeDesign({ ...saved, yeastDesign: { ...saved.yeastDesign!, beerTarget: { abv: { min: 6, max: 3 } } } })).toBeUndefined();
  });
});

describe('Base d’ébullition et croisements de recettes', () => {
  it('retire le sucre tardif pour Tinseth et recalcule cette base avec la variation', () => {
    const sugar: Fermentable = { name: 'Saccharose', kind: 'sucre', use: 'fermentation', weightKg: 1, potentialPpg: 46, fermentabilityPct: 100, dayOffset: 4 };
    const recipe = base({ ogTarget: null, fermentables: [{ ...malt }, sugar] }), projection = projectYeastRecipe(recipe);
    const boilOg = 1 + gravityPoints(malt) / 1000;
    expect(yeastRecipeBoilOg(recipe, projection).og).toBeCloseTo(boilOg, 12);
    const preview = previewYeastBeerTarget(recipe, draftFor(recipe), refs, { ...identity, fermentableScale: .5 });
    expect(preview.current.ibu.total).toBeCloseTo(tinseth(25, 10, boilOg), 12);
    expect(preview.variant.boilOg).toBeCloseTo(1 + (boilOg - 1) / 2, 12);
    expect(preview.variant.ibu.total).toBeCloseTo(tinseth(25, 10, 1 + (boilOg - 1) / 2), 12);
    expect(preview.variant.ibu.total!).toBeGreaterThan(preview.current.ibu.total!);
    const unknown = { ...recipe, fermentables: [{ ...sugar, potentialPpg: undefined }] };
    expect(yeastRecipeBoilOg(unknown, { og: 1.06 }).og).toBeNull();
    expect(yeastRecipeBoilOg(recipe, { og: 1.005 }).og).toBeNull();
    expect(yeastRecipeBoilOg({ ...recipe, fermentables: undefined } as unknown as Recipe, { og: 1.05 }).og).toBe(1.05);
  });

  const matrices: [string, Fermentable[]][] = [
    ['malt', [{ ...malt }]],
    ['extrait', [{ name: 'Extrait sec', kind: 'extrait', use: 'ebullition', weightKg: 3, potentialPpg: 44, fermentabilityPct: 75 }]],
    ['stout lactose', [{ ...malt }, { name: 'Lactose', kind: 'lactose', use: 'ebullition', weightKg: .5, potentialPpg: 35, fermentabilityPct: 0 }]],
    ['barleywine sucre tardif', [{ ...malt }, { name: 'Saccharose', kind: 'sucre', use: 'fermentation', weightKg: .5, potentialPpg: 46, fermentabilityPct: 100 }]]
  ];
  const yeasts: [string, YeastSpec][] = [
    ['rare sans forme', { name: 'Culture R-42', attenuationPct: 80, attenuationBasis: 'recipe' }],
    ['rare liquide', { name: 'Culture R-42', form: 'liquide', attenuationPct: 80, attenuationBasis: 'recipe' }],
    ['US-05', { name: 'SafAle US-05', hopIndexId: 'fermentis-us05', attenuationPct: 80, attenuationBasis: 'recipe' }],
    ['Champagne sous hypothèse', { name: 'Champagne R-42', attenuationPct: 80, attenuationBasis: 'recipe' }]
  ];
  it.each(matrices.flatMap(([matrix, fermentables]) => yeasts.map(([strain, yeast]) => ({ matrix, strain, fermentables, yeast }))))('$matrix × $strain : quantité, alcool et DF selon une base indépendante', ({ fermentables, yeast }) => {
    const recipe = base({ ogTarget: null, fermentables, yeast }), preview = previewYeastBeerTarget(recipe, draftFor(recipe), refs, { ...identity, fermentableScale: .5 });
    const total = fermentables.reduce((s, f) => s + gravityPoints(f), 0), nonfermentable = fermentables.filter(f => f.kind === 'lactose').reduce((s, f) => s + gravityPoints(f), 0), simple = fermentables.filter(f => f.kind === 'sucre').reduce((s, f) => s + gravityPoints(f), 0);
    const residual = nonfermentable + (total - simple - nonfermentable) * .2;
    expect(preview.errors).toEqual([]);
    expect(preview.variant.projection.og).toBeCloseTo(1 + total / 2000, 12);
    expect(preview.variant.projection.fg.range!.min).toBeCloseTo(1 + residual / 2000, 12);
    expect(preview.variant.projection.abv.range!.min).toBeCloseTo((total - residual) / 2000 * 131.25, 12);
  });
});
