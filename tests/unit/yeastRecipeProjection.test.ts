import { describe, expect, it } from 'vitest';
import { projectYeastRecipe, resolveYeastDossier, yeastRecipeComputedOg, yeastRecipeBoilOg } from '../../src/domain/yeastProjection';
import { applyYeastRecipeDesign, createYeastRecipeDraft, evaluateYeastRecipeDesign, readYeastRecipeDesign, yeastRecipeDesignChanged, proposeYeastGoalSettings } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { brewingStyles } from '../../src/domain/brewingStyles';
import type { Recipe, Fermentable } from '../../src/types';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import type { IngredientFermentationFacts } from '../../functions/src/ingredientFermentationFacts';
import { noloScience } from '../../src/domain/noloScience';
import { refreshCompanionRecipe } from '../../src/domain/brewerRecipeRefresh';
import { yeastCultureComposition } from '../../src/domain/yeastStyleEvidence';
import { BrewingMath } from '../../src/services/brewingMath';
import { fullRecipe } from '../fixtures/fullRecipe';

const refs = yeastReferences([]);
const malt = (kg: number): Fermentable => ({ name: 'Pale', kind: 'grain', use: 'empatage', weightKg: kg, potentialPpg: 37 });
const base = (patch: Partial<Recipe> = {}): Recipe => ({ ...structuredClone(fullRecipe), name: 'Recette témoin', style: 'Pale Ale', volumeL: 20, efficiencyPct: 75,
  ogTarget: null, fgTarget: null, abvTarget: null, fermentables: [malt(5)], hops: [], adjuncts: [],
  yeast: { name: 'Laboratoire rare R-123', qty: 125, unit: 'mL', attenuationPct: 78 },
  fermentation: [{ name: 'Primaire', kind: 'primaire', tempC: 20, days: 10 }], ...patch });
const points = (kg: number, ppg: number, grain = false) => ppg * kg * 2.2046226 * (grain ? .75 : 1) / (20 * .26417205);
const attenuation = (min: number, max = min, qualifier: YeastTechnicalFact['qualifier'] = min === max ? 'reportedPoint' : 'range'): YeastTechnicalFact => ({
  key: 'attenuation', reported: `${min}–${max} %`, range: { min, max }, unit: '%', qualifier, origin: 'manufacturer', source: 'Fiche du produit', sourceUrl: 'https://example.org/fiche'
});
const sugarFacts = (sugars: IngredientFermentationFacts['sugars'], hydrolysis: IngredientFermentationFacts['hydrolysis'] = 'unknown'): IngredientFermentationFacts => ({
  version: 1, strainName: 'Culture documentée', sugars, hydrolysis, pof: 'unknown', retrievedAt: '2026-09-20', conditions: 'Fiche du produit ; conditions à vérifier sur le moût.',
  source: { author: 'Laboratoire', title: 'Assimilation publiée', reference: 'https://example.org/sucres', kind: 'manufacturer', year: 2026 }
});

describe('Prévision unique du moût, indépendante du catalogue', () => {
  it.each([0, .01])('garde la DI dérivée complète avec %s kg de malt et un kilo de sucre tardif', kg => {
    const sugar: Fermentable = { name: 'Saccharose', kind: 'sucre', use: 'fermentation', weightKg: 1, potentialPpg: 46, fermentabilityPct: 100, dayOffset: 4 };
    const recipe = base({ fermentables: [...(kg ? [malt(kg)] : []), sugar] });
    const computedOg = yeastRecipeComputedOg(recipe);
    expect(computedOg).toBeCloseTo(1 + (points(kg, 37, true) + points(1, 46)) / 1000, 14);
    const projected = projectYeastRecipe(recipe, { og: computedOg });
    expect(projected.fg.range!.min).toBeCloseTo(1 + points(kg, 37, true) * .22 / 1000, 13);
    expect(projected.abv.range!.min).toBeCloseTo((points(kg, 37, true) * .78 + points(1, 46)) / 1000 * 131.25, 12);
    expect(yeastRecipeBoilOg(recipe, projected).og).toBeCloseTo(1 + points(kg, 37, true) / 1000, 13);
    const rounded = BrewingMath.calculateOg(recipe.fermentables, 20, 75)!;
    expect(rounded).not.toBe(computedOg);
    // The same decimals could be an actual supplied value. No tolerance silently
    // replaces it with a different OG; the caller must retain computed precision.
    const supplied = projectYeastRecipe({ ...recipe, ogTarget: rounded });
    expect(supplied.og).toBe(rounded); expect(supplied.fg.range).toBeNull();
    expect(yeastRecipeBoilOg(recipe, supplied).og).toBeNull();
  });
  it('CBC-1 conserve son assimilation publiée sans référence, y compris au rafraîchissement de recette', () => {
    const reference = refs.find(r => r.id === 'lalbrew-cbc-1')!;
    const recipe = base({ ogTarget: 1.06, fermentables: [malt(4), { name: 'Maltotriose', kind: 'sucre', use: 'ebullition', weightKg: .5, potentialPpg: 40 }] });
    const draft = { ...createYeastRecipeDraft(recipe, refs, undefined, reference.id), attenuationPct: 75, attenuationBasis: 'recipe' as const, temperatureC: 20 };
    const saved = JSON.parse(JSON.stringify(applyYeastRecipeDesign(recipe, draft, refs))) as Recipe;
    const withReference = projectYeastRecipe(saved, { reference }), frozen = projectYeastRecipe(saved), expectedFg = 1 + (points(.5, 40) + (60 - points(.5, 40)) * .25) / 1000;
    expect(withReference.fg.range!.min).toBeCloseTo(expectedFg, 12);
    expect(frozen.fg.range).toEqual(withReference.fg.range); expect(frozen.abv.range).toEqual(withReference.abv.range);
    expect(refreshCompanionRecipe(saved)).toMatchObject({ fgTarget: frozen.fg.range!.min, abvTarget: frozen.abv.range!.min });
    // Imported dossiers can lose portable catalogue IDs but keep official URLs.
    const portable = { ...saved, yeast: { ...saved.yeast, hopIndexId: undefined } };
    expect(projectYeastRecipe(portable).fg.range).toEqual(frozen.fg.range);
  });
  it.each(['Oenococcus oeni', 'Lacticaseibacillus casei', 'Lactoplantibacillus plantarum'])('reconnaît aussi la bactérie personnelle %s dans la classification partagée', species => {
    const facts: YeastTechnicalFact[] = [{ key: 'species', reported: species, origin: 'personal' }], recipe = base({ style: 'Specialty Beer', ogTarget: 1.04, yeast: { name: 'Culture locale', attenuationPct: 80, attenuationBasis: 'recipe', technicalFacts: facts } });
    expect(yeastCultureComposition(facts)).toMatchObject({ culture: 'bacteria', acidifying: true });
    expect(projectYeastRecipe(recipe, { process: 'preacidified' }).abv.range).toBeNull();
  });
  it.each(['Saccharomyces cerevisiae (sans Lactobacillus)', 'Saccharomyces cerevisiae without Oenococcus', 'Lactobacillus-free Saccharomyces cerevisiae', 'Saccharomyces cerevisiae, without Lachancea thermotolerans'])('ne lit pas une négation comme une culture ajoutée : %s', species => {
    const facts: YeastTechnicalFact[] = [{ key: 'species', reported: species, origin: 'personal' }], recipe = base({ style: 'Specialty Beer', ogTarget: 1.04, yeast: { name: 'Culture locale', attenuationPct: 80, attenuationBasis: 'recipe', technicalFacts: facts } });
    expect(yeastCultureComposition(facts)).toMatchObject({ culture: 'yeast', acidifying: false });
    expect(projectYeastRecipe(recipe, { process: 'preacidified' }).abv.range!.min).toBeCloseTo(4.2, 12);
  });
  it('Sourvisiae et Philly restent acidifiantes pour tous les produits documentés et dossiers gelés', () => {
    const references = refs.filter(r => /sourvisiae|philly sour/i.test(r.name));
    expect(references.length).toBeGreaterThanOrEqual(8);
    for (const reference of references) {
      const facts = resolveYeastDossier({ name: reference.name }, reference).facts;
      const recipe = base({ style: 'Specialty Beer', ogTarget: 1.05, yeast: { name: reference.name, hopIndexId: reference.id, attenuationPct: 80, attenuationBasis: 'recipe', technicalFacts: facts } });
      for (const ref of [reference, undefined]) {
        const p = projectYeastRecipe(recipe, { reference: ref, process: 'preacidified' });
        expect(p.fg.range!.min, reference.id).toBeCloseTo(1.01, 12); expect(p.abv.range, reference.id).toBeNull();
        expect(p.warnings.join(' '), reference.id).toContain('ne garantit pas une fermentation uniquement alcoolique');
        expect(p.abv.sources.some(s => /lallemandbrewing\.com/.test(s.reference))).toBe(true);
      }
      if (facts.length) expect(projectYeastRecipe({ ...recipe, yeast: { ...recipe.yeast, hopIndexId: undefined } }, { process: 'preacidified' }).abv.range, reference.id).toBeNull();
    }
    const personal = base({ style: 'Specialty Beer', ogTarget: 1.05, yeast: { name: 'Ma culture sour maison', attenuationPct: 80, attenuationBasis: 'recipe' } });
    expect(projectYeastRecipe(personal, { process: 'preacidified' }).abv.range!.min).toBeCloseTo(5.25, 12);
  });
  it('l’acidification déclarée a un sens positif, pas une négation ou un score tiré du nom', () => {
    const recipe = base({ style: 'Specialty Beer', ogTarget: 1.05 });
    for (const reported of ['This culture produces lactic acid and alcohol.', 'Levure acidifiante', 'Lactic-acid producing yeast']) {
      const p = projectYeastRecipe({ ...recipe, yeast: { ...recipe.yeast, technicalFacts: [{ key: 'application', reported, origin: 'personal' }] } }, { process: 'preacidified' });
      expect(p.abv.range, reported).toBeNull();
    }
    for (const reported of ['Does not produce lactic acid.', 'Produces no lactic acid.']) {
      const p = projectYeastRecipe({ ...recipe, yeast: { ...recipe.yeast, technicalFacts: [{ key: 'application', reported, origin: 'personal' }] } }, { process: 'preacidified' });
      expect(p.abv.range, reported).not.toBeNull();
    }
  });
  it('une fermentabilité globale d’extrait n’est pas multipliée une seconde fois par l’atténuation apparente', () => {
    const r = base({ fermentables: [{ name: 'Extrait', kind: 'extrait', use: 'ebullition', weightKg: 3, potentialPpg: 36, fermentabilityPct: 75 }] });
    const p = projectYeastRecipe(r);
    expect(p.og).toBeCloseTo(1 + points(3, 36) / 1000, 12);
    expect(p.fg.range!.min).toBeCloseTo(1 + points(3, 36) * .22 / 1000, 12);
    expect(p.fg.reasons.join(' ')).toContain('ne sont pas multipliées');
    expect(r.fermentables[0].fermentabilityPct).toBe(75);
  });
  it('une atténuation apparente mesurée concerne la DI entière, sucre et lactose compris', () => {
    const r = base({ ogTarget: 1.085644713, fermentables: [malt(5), { name: 'Saccharose', kind: 'sucre', use: 'fermentation', weightKg: 1, potentialPpg: 46, fermentabilityPct: 100 }, { name: 'Lactose', kind: 'lactose', use: 'ebullition', weightKg: .5, potentialPpg: 35, fermentabilityPct: 0 }], yeast: { name: 'Rare', attenuationPct: 75, attenuationBasis: 'measured' } });
    const p = projectYeastRecipe(r);
    expect(p.fg.range!.min).toBeCloseTo(1.02141117825, 12);
    expect(p.abv.range!.min).toBeCloseTo((1.085644713 - 1.02141117825) * 131.25, 12);
    expect((p.og! - p.fg.range!.min) / (p.og! - 1) * 100).toBeCloseTo(75, 12);
    expect(p.fg.reasons.join(' ')).toContain('sans seconde correction');
    expect(p.warnings.join(' ')).toContain('densité apparente dépend aussi de l’alcool');
    const missingSpecial = projectYeastRecipe({ ...r, fermentables: [{ name: 'Fruit ajouté', kind: 'fruit', use: 'fermentation', weightKg: 1 }] });
    expect(missingSpecial.fg.range).toEqual(p.fg.range);
    expect(missingSpecial.fg.reasons.join(' ')).toContain('comparables au brassin mesuré');
  });
  it('ne transfère pas une atténuation Champagne/conditionnement au malt sans hypothèse explicite', () => {
    const references = refs.filter(y => /WLP715|EC[ -]?1118|CBC[ -]?1/i.test(y.name));
    expect(references.some(y => /WLP715/.test(y.name))).toBe(true);
    expect(references.some(y => /EC[ -]?1118/.test(y.name))).toBe(true);
    expect(references.some(y => /CBC[ -]?1/.test(y.name))).toBe(true);
    for (const reference of references) {
      const recipe = base({ yeast: { name: reference.name, hopIndexId: reference.id, attenuationBasis: 'declared' } }), before = structuredClone(reference);
      const p = projectYeastRecipe(recipe, { reference });
      expect(p.fg.range, reference.name).toBeNull(); expect(p.abv.range, reference.name).toBeNull();
      const chosen = projectYeastRecipe({ ...recipe, yeast: { ...recipe.yeast, attenuationPct: 80, attenuationBasis: 'recipe' } }, { reference });
      expect(chosen.fg.range!.min).toBeCloseTo(1 + points(5, 37, true) * .2 / 1000, 12);
      expect(chosen.warnings.join(' ')).toMatch(/hypothèse|Assimilation du malt limitée/);
      expect(chosen.fg.reasons.join(' ')).not.toMatch(/Champagne.*maltose.*non/);
      expect(reference).toEqual(before);
    }
  });
  it('une donnée personnelle explicitement sur moût est distinguée de l’usage vin de la même souche', () => {
    const r = base({ yeast: { name: 'Champagne R-42', technicalFacts: [{ ...attenuation(75), context: 'Moût' }] } });
    const p = projectYeastRecipe(r);
    expect(p.fg.range!.min).toBeCloseTo(1 + points(5, 37, true) * .25 / 1000, 12);
    expect(p.attenuation?.basis).toBe('declared');
  });
  it('la non-assimilation d’un sucre est lue et une fraction contradictoire ne l’écrase pas', () => {
    const f: Fermentable = { name: 'Saccharose', kind: 'sucre', use: 'fermentation', weightKg: 1, potentialPpg: 46 };
    const r = base({ fermentables: [malt(5), f], yeast: { name: 'Rare', attenuationPct: 80, attenuationBasis: 'recipe', fermentationFacts: sugarFacts({ sucrose: 'no', glucose: 'yes', fructose: 'yes', maltose: 'yes', maltotriose: 'yes' }) } });
    const no = projectYeastRecipe(r), yes = projectYeastRecipe({ ...r, yeast: { ...r.yeast, fermentationFacts: sugarFacts({ sucrose: 'yes', glucose: 'yes', fructose: 'yes', maltose: 'yes', maltotriose: 'yes' }) } });
    expect(no.fg.range!.min).toBeCloseTo(1 + (points(5, 37, true) * .2 + points(1, 46)) / 1000, 12);
    expect(yes.fg.range!.min).toBeCloseTo(1 + points(5, 37, true) * .2 / 1000, 12);
    expect(no.abv.range!.min).toBeLessThan(yes.abv.range!.min);
    expect(no.fg.reasons.join(' ')).toContain('non assimilé');
    const conflict = projectYeastRecipe({ ...r, fermentables: [malt(5), { ...f, fermentabilityPct: 100 }] });
    expect(conflict.fg.range).toBeNull(); expect(conflict.fg.reasons.join(' ')).toContain('incompatible');
    const unknown = projectYeastRecipe({ ...r, yeast: { ...r.yeast, fermentationFacts: sugarFacts({ sucrose: 'unknown' }) } });
    expect(unknown.fg.range).toBeNull(); expect(unknown.fg.reasons.join(' ')).toContain('assimilation de sucrose inconnue');
  });
  it('aucun sucre assimilé ne reçoit une atténuation positive, et la maltodextrine n’est pas du saccharose', () => {
    const p = projectYeastRecipe(base({ yeast: { name: 'Rare', attenuationPct: 80, attenuationBasis: 'recipe', fermentationFacts: sugarFacts({ glucose: 'no', fructose: 'no', sucrose: 'no', maltose: 'no', maltotriose: 'no' }) } }));
    expect(p.fg.range).toBeNull(); expect(p.fg.reasons.join(' ')).toContain('contradictoire');
    const dextrin: Fermentable = { name: 'Maltodextrine', kind: 'sucre', use: 'ebullition', weightKg: 1, potentialPpg: 40 };
    const missing = projectYeastRecipe(base({ fermentables: [malt(5), dextrin] }));
    expect(missing.fg.range).toBeNull(); expect(missing.fg.reasons.join(' ')).toContain('ne signifie pas 100 %');
    const hydrolytic = projectYeastRecipe(base({ fermentables: [malt(5), { ...dextrin, fermentabilityPct: 0 }], yeast: { name: 'Rare', attenuationPct: 80, attenuationBasis: 'recipe', fermentationFacts: sugarFacts({ glucose: 'yes' }, 'positive') } }));
    expect(hydrolytic.fg.range).toBeNull(); expect(hydrolytic.fg.reasons.join(' ')).toContain('hydrolyse documentée');
  });
  it('les capacités documentaires NOLO limitent le transfert sans activer ni modifier le modèle NOLO', () => {
    const strain = noloScience()!.strains.find(s => s.sugars.maltose === 'no' && s.source.kind === 'manufacturer')!;
    expect(strain).toBeDefined();
    const recipe = base({ yeast: { name: strain.name, hopIndexId: strain.yeastId, attenuationPct: 80, attenuationBasis: 'declared' } });
    const p = projectYeastRecipe(recipe);
    expect(p.fg.range).toBeNull(); expect(p.fg.reasons.join(' ')).toContain('Assimilation du malt limitée');
    const hypothesis = projectYeastRecipe({ ...recipe, yeast: { ...recipe.yeast, attenuationBasis: 'recipe' } });
    expect(hypothesis.fg.range).not.toBeNull(); expect(hypothesis.warnings.join(' ')).toContain('aucune capacité supplémentaire');
    expect(recipe.nolo).toBeUndefined();
  });
  it.each(['Lactobacillus plantarum', 'Lactiplantibacillus plantarum', 'Pediococcus damnosus', 'Saccharomyces cerevisiae + Lactobacillus plantarum'])('la culture personnelle %s reste acidifiante sans référence catalogue', species => {
    const recipe = base({ style: 'Specialty Beer', ogTarget: 1.04, yeast: { name: 'Culture locale', attenuationPct: 75, technicalFacts: [{ key: 'species', reported: species, origin: 'personal' }] } });
    for (const process of ['unspecified', 'preacidified'] as const) {
      const p = projectYeastRecipe(recipe, { process });
      expect(p.fg.range!.min).toBeCloseTo(1.01, 12); expect(p.abv.range).toBeNull(); expect(p.warnings.length).toBeGreaterThan(0);
    }
  });
  it('ne remplace pas NaN ou un procédé inconnu par des conditions ordinaires', () => {
    expect(projectYeastRecipe(base({ ogTarget: NaN })).fg.range).toBeNull();
    expect(projectYeastRecipe(base({ yeast: { name: 'Rare', attenuationPct: Infinity } })).fg.range).toBeNull();
    expect(projectYeastRecipe(base(), { og: null }).fg.range).toBeNull();
    const p = projectYeastRecipe(base(), { process: 'inconnu' as 'unspecified' });
    expect(p.fg.range).not.toBeNull(); expect(p.abv.range).toBeNull(); expect(p.warnings.join(' ')).toContain('Procédé non reconnu');
  });
  it('un rôle acidifiant appliqué reste actif même si le moût a été pré-acidifié', () => {
    const recipe = base({ style: 'Sour' }), draft = { ...createYeastRecipeDraft(recipe, refs), process: 'preacidified' as const, cultureRoles: [{ name: 'Culture locale', role: 'acidifying' as const }] };
    const preview = evaluateYeastRecipeDesign(recipe, draft, refs);
    expect(preview.abv.range).toBeNull();
    const saved = applyYeastRecipeDesign(recipe, draft, refs), p = projectYeastRecipe(saved);
    expect(p.fg.range).not.toBeNull(); expect(p.abv.range).toBeNull();
    expect(p.warnings.join(' ')).toContain('ne garantit pas une fermentation uniquement alcoolique');
  });
  it('reconnaît les unités de tolérance en volume sans convertir une borne « au moins » en plafond', () => {
    for (const unit of ['%', '%vol', '% vol', '% v/v', '% VOL.']) {
      const fact: YeastTechnicalFact = { key: 'alcoholTolerance', reported: `≥ 12.5 ${unit}`, range: { min: 12.5, max: 12.5 }, unit, qualifier: 'atLeast', origin: 'manufacturer', source: 'Fiche du laboratoire rare' };
      const r = base({ style: 'Barleywine', ogTarget: 1.16, yeast: { name: 'Culture rare', attenuationPct: 80, alcoholTolerancePct: 12.5, technicalFacts: [fact] } });
      const before = structuredClone(r), p = projectYeastRecipe(r);
      expect(p.dossier.alcoholTolerance).toMatchObject({ range: { min: 12.5, max: 12.5 }, qualifier: 'atLeast' });
      expect(p.dossier.facts[0]).toEqual(fact);
      expect(p.abv.range!.min).toBeCloseTo(16.8, 12);
      expect(p.warnings.join(' ')).toContain('au moins');
      expect(p.warnings.join(' ')).toContain('la limite supérieure reste inconnue');
      expect(p.warnings.join(' ')).not.toContain('non renseignée');
      expect(r).toEqual(before);
    }
    const unsupported = base({ ogTarget: 1.16, yeast: { name: 'Culture rare', attenuationPct: 80, alcoholTolerancePct: 12.5, technicalFacts: [{ key: 'alcoholTolerance', reported: '12.5 % w/w', range: { min: 12.5, max: 12.5 }, unit: '% w/w', qualifier: 'reportedPoint', origin: 'manufacturer' }] } });
    expect(projectYeastRecipe(unsupported).dossier.alcoholTolerance).toBeUndefined();
    expect(projectYeastRecipe(unsupported).warnings.join(' ')).toContain('données absentes, conditionnelles ou non concordantes');
  });
  it('Imperial Stout : conserve tout le lactose dans la DF et ne lui attribue pas d’alcool', () => {
    const r = base({ style: 'Imperial Stout', fermentables: [malt(9), { name: 'Lactose', kind: 'lactose', use: 'ebullition', weightKg: 1, potentialPpg: 41, fermentabilityPct: 0 }] });
    const before = structuredClone(r), p = projectYeastRecipe(r);
    expect(p.og).toBeCloseTo(1 + (points(9, 37, true) + points(1, 41)) / 1000, 12);
    expect(p.fg.range!.min).toBeCloseTo(1 + (points(1, 41) + points(9, 37, true) * .22) / 1000, 12);
    expect(p.abv.range!.min).toBeCloseTo(points(9, 37, true) * .78 / 1000 * 131.25, 12);
    expect(p.extract!.unfermentablePoints).toBeCloseTo(points(1, 41), 12);
    expect(r).toEqual(before);
  });
  it('Barleywine : le sucre tardif fermente selon sa part déclarée et la tolérance ne plafonne pas la projection', () => {
    const reference = refs.find(y => y.id === 'fermentis-us05')!;
    const r = base({ style: 'English Barleywine', yeast: { name: reference.name, hopIndexId: reference.id, attenuationPct: 80 },
      fermentables: [malt(10), { name: 'Saccharose', kind: 'sucre', use: 'fermentation', dayOffset: 3, weightKg: 1, potentialPpg: 46, fermentabilityPct: 100 }] });
    const p = projectYeastRecipe(r, { reference });
    expect(p.fg.range!.min).toBeCloseTo(1 + points(10, 37, true) * .2 / 1000, 12);
    expect(p.abv.range!.max).toBeCloseTo((points(10, 37, true) * .8 + points(1, 46)) / 1000 * 131.25, 12);
    expect(p.abv.range!.max).toBeGreaterThan(11);
    expect(p.warnings.join(' ')).toContain('tolérance');
    expect(p.extract!.lateAdditionPoints).toBeCloseTo(points(1, 46), 12);
    expect(p.fg.reasons.join(' ')).toContain('avant ces ajouts');
  });
  it('une levure liquide rare et sa forme inconnue donnent le même aperçu avec une atténuation choisie', () => {
    const r = base({ ogTarget: 1.06 }), unknown = projectYeastRecipe(r), liquid = projectYeastRecipe({ ...r, yeast: { ...r.yeast, form: 'liquide' } });
    expect(unknown.fg.range).toEqual(liquid.fg.range);
    expect(unknown.fg.range!.min).toBeCloseTo(1.0132, 12);
    expect(unknown.abv.range!.min).toBeCloseTo(6.1425, 12);
    expect(unknown.attenuation?.basis).toBe('recipe');
    expect(unknown.fg.sources).toEqual([]);
  });
  it('une plage documentaire reste une plage et une hypothèse explicite la remplace sans perdre la source', () => {
    const r = base({ ogTarget: 1.06, yeast: { name: 'R-123', technicalFacts: [attenuation(72, 84)], attenuationBasis: 'declared' } });
    const range = projectYeastRecipe(r), chosen = projectYeastRecipe({ ...r, yeast: { ...r.yeast, attenuationPct: 77, attenuationBasis: 'recipe' } });
    expect(range.fg.range!.min).toBeCloseTo(1.0096, 12); expect(range.fg.range!.max).toBeCloseTo(1.0168, 12);
    expect(chosen.fg.range!.min).toBeCloseTo(1.0138, 12);
    expect(chosen.fg.range!.min).toBe(chosen.fg.range!.max);
    expect(chosen.dossier.documentedAttenuation?.range).toEqual({ min: 72, max: 84 });
    expect(chosen.dossier.facts[0].sourceUrl).toBe('https://example.org/fiche');
  });
  it('ne transforme ni une borne seule, ni des sources contradictoires en intervalle calculable', () => {
    for (const facts of [[attenuation(80, 80, 'upTo')], [attenuation(70, 80), attenuation(75, 85)]]) {
      const p = projectYeastRecipe(base({ yeast: { name: 'R-123', attenuationPct: 75, attenuationBasis: 'declared', technicalFacts: facts } }));
      expect(p.fg.range).toBeNull(); expect(p.abv.range).toBeNull();
    }
    expect(projectYeastRecipe(base({ yeast: { name: 'R-123', technicalFacts: [attenuation(78)] } })).fg.range).not.toBeNull();
  });
  it('la température d’empâtage ne crée pas une correction chiffrée sans modèle de ce moût', () => {
    const r = base(), a = projectYeastRecipe({ ...r, mash: { steps: [{ name: 'Palier', tempC: 63, durationMin: 60 }] } }), b = projectYeastRecipe({ ...r, mash: { steps: [{ name: 'Palier', tempC: 70, durationMin: 60 }] } });
    expect(a.fg).toEqual(b.fg); expect(a.abv).toEqual(b.abv);
  });
  it('préserve les données absentes et refuse de soustraire un lactose ou fruit non quantifié', () => {
    for (const extra of [{ name: 'Lactose', kind: 'lactose', use: 'ebullition', weightKg: 1 }, { name: 'Fruit', kind: 'fruit', use: 'fermentation', weightKg: 1, potentialPpg: 12 }] as Fermentable[]) {
      expect(projectYeastRecipe(base({ ogTarget: 1.06, fermentables: [malt(5), extra] })).fg.range).toBeNull();
    }
    expect(projectYeastRecipe(base({ yeast: { name: 'R-123' } })).fg.range).toBeNull();
    expect(projectYeastRecipe(base({ yeast: { name: 'R-123', attenuationPct: 0 } })).abv.range).toEqual({ min: 0, max: 0 });
  });
  it('une donnée réservée à un autre milieu reste consultable et ne devient pas un fait de brassage', () => {
    const r = base({ yeast: { name: 'Culture', technicalFacts: [{ ...attenuation(80), context: 'Wine' }] } });
    expect(resolveYeastDossier(r.yeast).facts[0].context).toBe('Wine');
    expect(projectYeastRecipe(r).fg.range).toBeNull();
  });
  it('la voie NOLO reste séparée', () => {
    const p = projectYeastRecipe(base({ nolo: { enabled: true } as Recipe['nolo'] }));
    expect(p.fg.range).toBeNull(); expect(p.abv.range).toBeNull(); expect(p.fg.reasons.join(' ')).toContain('NOLO');
  });
});

describe('Procédé choisi, hypothèses conservées et application explicite', () => {
  it('la référence de style acidulé décide du procédé requis, même sous un nom personnel', () => {
    const style = brewingStyles().find(s => s.id === 'berliner-weisse')!;
    expect(style).toBeDefined();
    const r = base({ style: 'Ma rouge', styleRef: style.ref, ogTarget: 1.05, yeast: { name: 'R-123', attenuationPct: 80 } });
    const draft = createYeastRecipeDraft(r, refs), preview = evaluateYeastRecipeDesign(r, draft, refs);
    expect(draft.styleId).toBe('sour');
    expect(projectYeastRecipe(r).fg.range!.min).toBeCloseTo(1.01, 12);
    expect(projectYeastRecipe(r).abv.range).toBeNull(); expect(preview.abv.range).toBeNull();
    expect(preview.warnings.join(' ')).toContain('Procédé acidulé à préciser');
    const preacidified = projectYeastRecipe(r, { process: 'preacidified' });
    expect(preacidified.abv.range!.min).toBeCloseTo(5.25, 12);
    // An explicit ordinary style also wins over a misleading personal display label.
    const ordinary = brewingStyles().find(s => s.id === 'american-ipa')!;
    expect(ordinary).toBeDefined();
    expect(projectYeastRecipe({ ...r, style: 'Sour du mois', styleRef: ordinary.ref }).abv.range).not.toBeNull();
  });
  it('le dossier personnel sert aussi aux effets, aux propositions et à l’application', () => {
    const reference = refs.find(y => y.id === 'fermentis-us05')!, catalogue = structuredClone(reference.catalogue);
    const r = base({ yeast: { name: reference.name, hopIndexId: reference.id, form: 'sèche', attenuationPct: 80, technicalFacts: [{ key: 'temperature', reported: '18–30 °C', range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range', origin: 'personal', source: 'Mes essais R-12' }] } });
    const draft = { ...createYeastRecipeDraft(r, refs), temperatureC: 28 }, preview = evaluateYeastRecipeDesign(r, draft, refs);
    expect(preview.projection.dossier.temperature!.range).toEqual({ min: 18, max: 30 });
    expect(preview.effects.find(e => e.id === 'temperature')?.impact).toBe('28 °C · dans la fenêtre');
    expect(preview.errors).toEqual([]); expect(preview.warnings.join(' ')).not.toContain('hors de la');
    const applied = applyYeastRecipeDesign(r, draft, refs);
    expect(applied.fermentation![0].tempC).toBe(28); expect(applied.yeast.technicalFacts).toEqual(r.yeast.technicalFacts);
    expect(proposeYeastGoalSettings(r, { ...draft, goal: 'banana', temperatureC: undefined }, refs)?.patch.temperatureC).toBe(24);
    expect(proposeYeastGoalSettings(r, { ...draft, goal: 'banana' }, refs)?.rationale).toBe('Aucun réglage de température documenté pour cet objectif. Consigne actuelle conservée : 28 °C.');
    const outside = evaluateYeastRecipeDesign(r, { ...draft, temperatureC: 31 }, refs);
    expect(outside.errors).toEqual([]); expect(outside.warnings.join(' ')).toContain('hors de la plage de conduite retenue (18–30 °C)');
    expect(reference.catalogue).toEqual(catalogue);
  });
  it('Sour : distingue moût pré-acidifié et cultures acidifiantes, avec DF et alcool indépendants', () => {
    const r = base({ style: 'Sour' }), ordinary = projectYeastRecipe(r, { process: 'preacidified' });
    expect(ordinary.fg.range).not.toBeNull(); expect(ordinary.abv.range).not.toBeNull();
    for (const process of ['unspecified', 'acidifying-yeast', 'mixed-culture'] as const) {
      const p = projectYeastRecipe(r, { process });
      expect(p.fg.range).toEqual(ordinary.fg.range); expect(p.abv.range).toBeNull();
    }
  });
  it('une espèce acidifiante documentée ne reçoit pas un calcul d’alcool ordinaire sous un autre style', () => {
    const r = base({ style: 'Pale Ale', yeast: { name: 'Culture rare', attenuationPct: 76, technicalFacts: [{ key: 'species', reported: 'Lachancea thermotolerans', origin: 'manufacturer', source: 'Fiche du laboratoire' }] } });
    const p = projectYeastRecipe(r);
    expect(p.fg.range).not.toBeNull(); expect(p.abv.range).toBeNull();
    expect(p.warnings.join(' ')).toContain('rôle des cultures');
    const preacidified = projectYeastRecipe(r, { process: 'preacidified' });
    expect(preacidified.fg.range).toEqual(p.fg.range); expect(preacidified.abv.range).toBeNull();
    expect(preacidified.warnings.join(' ')).toContain('ne garantit pas une fermentation uniquement alcoolique');
    // Positive control: an ordinary alcoholic yeast on that pre-acidified wort can still be estimated.
    const ordinary = projectYeastRecipe({ ...r, yeast: { name: 'Ale ordinaire', attenuationPct: 76 } }, { process: 'preacidified' });
    expect(ordinary.abv.range).not.toBeNull();
  });
  it('une fiche personnelle sans source garde une alerte de température sans inventer de référence', () => {
    const r = base({ yeast: { name: 'R-123', form: 'liquide', attenuationPct: 78, fermTempMinC: 18, fermTempMaxC: 24 } });
    const draft = { ...createYeastRecipeDraft(r, refs), temperatureC: 30 }, p = evaluateYeastRecipeDesign(r, draft, refs);
    expect(p.errors).toEqual([]); expect(p.warnings.join(' ')).toContain('hors de la plage de conduite retenue (18–24 °C)');
    expect(p.effects.find(e => e.id === 'temperature')?.source).toBeUndefined();
    expect(p.projection.dossier.temperature?.sources).toEqual([]);
    expect(applyYeastRecipeDesign(r, draft, refs).fermentation![0].tempC).toBe(30);
  });
  it('la déclaration non-diastatique est reconnue, y compris pour une fiche personnelle', () => {
    const r = base({ yeast: { name: 'R-123', attenuationPct: 78, technicalFacts: [{ key: 'diastatic', reported: 'Non-Diastatic', origin: 'manufacturer', source: 'Fiche du laboratoire' }] } });
    const p = evaluateYeastRecipeDesign(r, createYeastRecipeDraft(r, refs), refs);
    expect(p.effects.find(e => e.id === 'diastatic')?.impact).toContain('non diastatique');
    expect(p.warnings.join(' ')).not.toContain('Statut diastatique');
  });
  it('enregistre une souche personnelle sans catalogue, le procédé, les rôles et les cellules', () => {
    const r = base({ style: 'Sour' }), original = structuredClone(r);
    const draft = { ...createYeastRecipeDraft(r, refs), process: 'mixed-culture' as const, cultureRoles: [{ name: 'R-123', role: 'alcoholic' as const }, { name: 'Culture acide personnelle', role: 'acidifying' as const }], pitchRateMillionPerMlPlato: 1.1, viableCellsBillion: 230, attenuationPct: 81, attenuationBasis: 'recipe' as const };
    const preview = evaluateYeastRecipeDesign(r, draft, refs);
    expect(preview.errors).toEqual([]); expect(preview.fg.range).not.toBeNull(); expect(preview.abv.range).toBeNull(); expect(r).toEqual(original);
    const saved = JSON.parse(JSON.stringify(applyYeastRecipeDesign(r, draft, refs))) as Recipe;
    expect(saved.yeast).toMatchObject({ name: 'Laboratoire rare R-123', qty: 125, unit: 'mL', attenuationPct: 81, attenuationBasis: 'recipe' });
    expect(saved.yeast.form).toBeUndefined();
    expect(readYeastRecipeDesign(saved)).toMatchObject({ modelVersion: 'yeast-recipe-2', yeastId: '', process: 'mixed-culture', cultureRoles: draft.cultureRoles, pitchRateMillionPerMlPlato: 1.1, viableCellsBillion: 230 });
    expect(createYeastRecipeDraft(saved, refs)).toMatchObject({ process: 'mixed-culture', cultureRoles: draft.cultureRoles, pitchRateMillionPerMlPlato: 1.1, viableCellsBillion: 230 });
    expect(yeastRecipeDesignChanged(saved, readYeastRecipeDesign(saved)!)).toBe(false);
  });
  it('NEIPA : avertit du contact actif à une autre température, conserve par défaut, aligne seulement sur demande', () => {
    const r = base({ style: 'NEIPA', hops: [{ name: 'Citra', stage: 'dryHop', alpha: 12, weightG: 100, aromaTiming: 'fermentation', aromaTemperatureC: 19, aromaContactHours: 48, dayOffset: 2 }, { name: 'Mosaic', stage: 'dryHop', alpha: 12, weightG: 50, aromaTiming: 'postFermentation', aromaTemperatureC: 16, aromaContactHours: 24, dayOffset: 8 }] });
    const draft = { ...createYeastRecipeDraft(r, refs), temperatureC: 23, goal: 'fruit' as const }, before = structuredClone(r);
    const preview = evaluateYeastRecipeDesign(r, draft, refs);
    expect(preview.hops.doseGL).toBe(7.5); expect(preview.activeHopTemperatureConflicts).toHaveLength(1); expect(preview.warnings.join(' ')).toContain('conserver ces consignes');
    expect(applyYeastRecipeDesign(r, draft, refs).hops).toEqual(r.hops);
    const aligned = applyYeastRecipeDesign(r, { ...draft, alignActiveHopTemperature: true }, refs);
    expect(aligned.hops[0].aromaTemperatureC).toBe(23); expect(aligned.hops[1].aromaTemperatureC).toBe(16);
    expect(evaluateYeastRecipeDesign(r, { ...draft, alignActiveHopTemperature: true }, refs).changes.some(c => c.id === 'hop-temperature-0')).toBe(true);
    expect(r).toEqual(before);
    expect(yeastRecipeDesignChanged({ ...aligned, hops: r.hops }, readYeastRecipeDesign(aligned)!)).toBe(true);
  });
  it('un objectif sans relation thermique documentée explique la limite et ne déplace pas la consigne', () => {
    const r = base(), d = { ...createYeastRecipeDraft(r, refs), goal: 'fruit' as const };
    const proposal = proposeYeastGoalSettings(r, d, refs)!;
    expect(proposal.patch).toEqual({}); expect(proposal.rationale).toContain('20 °C'); expect(proposal.source).toBeUndefined();
  });
  it('un nouveau produit de forme inconnue se sélectionne sans inventer de dose ou conditionnement', () => {
    const known = refs.find(y => y.id === 'lalbrew-verdant-ipa')!, reference = { ...known, id: 'forme-inconnue', form: undefined };
    const r = base(), d = createYeastRecipeDraft(r, [reference], undefined, reference.id);
    const next = applyYeastRecipeDesign(r, d, [reference], 'strain');
    expect(next.yeast.form).toBeUndefined(); expect(next.yeast.qty).toBeUndefined(); expect(next.yeast.unit).toBeUndefined();
    expect(readYeastRecipeDesign(next)).toBeDefined();
  });
  it('rejette les faits malformés dans un snapshot v2 sans perdre la lecture de v1', () => {
    const r = applyYeastRecipeDesign(base(), createYeastRecipeDraft(base(), refs), refs), s = readYeastRecipeDesign(r)!;
    expect(readYeastRecipeDesign({ ...r, yeastDesign: { ...s, applied: { ...s.applied, yeast: { ...s.applied.yeast, technicalFacts: [{ ...attenuation(80), range: { min: 90, max: 20 } }] } } } })).toBeUndefined();
    const reference = refs.find(y => y.id === 'lalbrew-verdant-ipa')!, old = applyYeastRecipeDesign(base(), createYeastRecipeDraft(base(), refs, undefined, reference.id), refs, 'strain');
    expect(readYeastRecipeDesign({ ...old, yeastDesign: { ...old.yeastDesign!, modelVersion: 'yeast-recipe-1' } })).toBeDefined();
  });
});
