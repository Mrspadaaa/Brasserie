import { describe, it, expect } from 'vitest';
import { recipe } from '../fixtures/brewCompanion';
import { DEFAULT_WATER_SOURCE, SALT_IDS } from '../../src/domain/water';
import { constrainRo, replanRecipeWater, recipeWaterSummary } from '../../src/domain/recipeWater';
import {
  prepareProposal,
  applyProposal,
  editableFields
} from '../../functions/src/brewerProposals';
import { runBrewerTool } from '../../src/domain/brewerTools';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { Recipe } from '../../src/types';

function context(): BrewerContext {
  const r = { ...recipe(), id: 'water-test' } as Recipe;
  r.waterPlan = {
    ...r.waterPlan!,
    sourceId: DEFAULT_WATER_SOURCE.id,
    sourceSnapshot: DEFAULT_WATER_SOURCE,
    diRatioPct: 80,
    targetProfileId: '18B',
    acid: { id: 'lactique', mash: 0, sparge: 0 }
  };
  r.waterPlan = replanRecipeWater(r).plan;
  return {
    recipe: r,
    now: Date.now(),
    phase: 'Recette',
    inventory: [],
    material: [],
    waterSources: [DEFAULT_WATER_SOURCE],
    provenance: [],
    editableTargets: ['recipe']
  };
}
function propose(c: BrewerContext, values: Record<string, any>) {
  return prepareProposal(c, {
    target: 'recipe',
    title: 'Adapter l’eau',
    changes: Object.entries(values).map(([path, value]) => ({
      path,
      valueJson: JSON.stringify(value),
      reason: 'Demandé par le brasseur.'
    }))
  });
}
const accept = (c: BrewerContext, p: ReturnType<typeof propose>) =>
  applyProposal(
    c,
    p,
    p.changes.map((ch) => ch.id)
  ) as Recipe;

describe('Eau cohérente de la proposition au formulaire', () => {
  it('10 L au total remplace seulement de l’osmosée par du réseau et recalcule toutes les doses, sans écrire', () => {
    const c = context(),
      before = structuredClone(c);
    const p = propose(c, { 'waterPlan.roLimitL': 10 });
    const next = accept(c, p);
    expect(c).toEqual(before);
    expect(recipeWaterSummary(next)).toMatchObject({ totalRoL: 10, tapL: 20, availableRoL: 10 });
    expect(next.volumeL).toBe(c.recipe.volumeL);
    expect(next.fermentables.map((f) => f.weightKg)).toEqual(
      c.recipe.fermentables.map((f) => f.weightKg)
    );
    expect(next.waterPlan).toMatchObject({ mashWaterL: 20, spargeWaterL: 10, autoTreatment: true });
    expect(next.waterPlan!.mash).not.toEqual(c.recipe.waterPlan.mash);
    expect(next.waterPlan!.acid).not.toEqual(c.recipe.waterPlan.acid);
    expect(next.waterPlan!.saltOverrides).toBeUndefined();
    expect(next.waterPlan!.acidOverride).toBeUndefined();
    expect(p.changes.map((ch) => ch.path)).toEqual(
      expect.arrayContaining([
        'waterPlan.roLimitL',
        'waterPlan.diRatioPct',
        'waterPlan.mash',
        'waterPlan.acid'
      ])
    );
    expect(p.changes.every((ch) => ch.group === 'water')).toBe(true);
    expect(next.mash!.ratioLPerKg).toBe(4);
    expect(replanRecipeWater(next).plan).toEqual(next.waterPlan);
  });
  it('empêche la validation d’un plafond sans ses doses mais permet un nom indépendant', () => {
    const c = context(),
      p = propose(c, { name: 'Pale 10 L RO', 'waterPlan.roLimitL': 10 });
    const limit = p.changes.find((ch) => ch.path === 'waterPlan.roLimitL')!;
    expect(() => applyProposal(c, p, [limit.id])).toThrow(/ensemble/);
    const name = p.changes.find((ch) => ch.path === 'name')!;
    expect(applyProposal(c, p, [name.id]).waterPlan).toMatchObject({ diRatioPct: 80 });
  });
  it('respecte un rinçage délié et le plafond après augmentation des volumes', () => {
    const c = context();
    c.recipe.waterPlan.spargeDiRatioPct = 100;
    const next = accept(c, propose(c, { 'waterPlan.roLimitL': 10 }));
    expect(next.waterPlan!.spargeDiRatioPct).toBeGreaterThan(next.waterPlan!.diRatioPct);
    const larger = accept(
      { ...c, recipe: next },
      propose({ ...c, recipe: next }, { 'waterPlan.mashWaterL': 30 })
    );
    expect(recipeWaterSummary(larger)!.totalRoL).toBeCloseTo(10, 10);
    expect(larger.waterPlan!.mashWaterL).toBe(30);
    expect(larger.mash!.ratioLPerKg).toBe(6);
  });
  it('accepte zéro, sans rinçage, sans gaspiller un stock supérieur au besoin', () => {
    const c = context();
    c.recipe.waterPlan.spargeWaterL = 0;
    const zero = accept(c, propose(c, { 'waterPlan.roLimitL': 0 }));
    expect(recipeWaterSummary(zero)!.totalRoL).toBe(0);
    expect(zero.waterPlan!.acid!.sparge).toBe(0);
    expect(Object.values(zero.waterPlan!.sparge).every((g) => g === 0)).toBe(true);
    expect(constrainRo({ ...c.recipe.waterPlan, roLimitL: 100 }).diRatioPct).toBe(80);
  });
  it('ne transforme pas les calculs en doses manuelles mais conserve une exception explicite', () => {
    const c = context();
    const next = accept(
      c,
      propose(c, {
        'waterPlan.roLimitL': 10,
        'waterPlan.mash.gypse': 1.2,
        'waterPlan.acid.mash': 0.5
      })
    );
    expect(next.waterPlan).toMatchObject({
      mash: { gypse: 1.2 },
      saltOverrides: { mash: { gypse: 1.2 } },
      acid: { mash: 0.5 },
      acidOverride: { mash: 0.5 }
    });
    const changed = { ...c, recipe: next };
    const after = accept(changed, propose(changed, { 'waterPlan.diRatioPct': 0 }));
    expect(after.waterPlan!.mash.gypse).toBe(1.2);
    expect(after.waterPlan!.acid!.mash).toBe(0.5);
    const cleared = accept(
      { ...c, recipe: after },
      propose(
        { ...c, recipe: after },
        {
          'waterPlan.saltOverrides': null,
          'waterPlan.acidOverride': null
        }
      )
    );
    expect(cleared.waterPlan!.saltOverrides).toBeUndefined();
    expect(cleared.waterPlan!.acidOverride).toBeUndefined();
  });
  it('tous les sels, acidifiants et additifs sont éditables, avec validation fermée', () => {
    const c = context();
    const fields = editableFields(c, 'recipe');
    for (const id of SALT_IDS) expect(fields[`waterPlan.mash.${id}`]).toBeDefined();
    for (const key of [
      'waterPlan.acid',
      'waterPlan.disabled',
      'adjuncts',
      'mash.heatingRateCPerMin',
      'waterPlan.targetIons'
    ])
      expect(fields[key]).toBeDefined();
    expect(() => propose(c, { 'waterPlan.mash': { poison: 5 } })).toThrow(/autorisé/);
    expect(() => propose(c, { 'waterPlan.autoTreatment': 'true' })).toThrow();
    expect(() => propose(c, { 'waterPlan.roLimitL': -1 })).toThrow();
    expect(() => propose(c, { 'waterPlan.acid': { id: 'inconnu', mash: 1, sparge: 0 } })).toThrow();
  });
  it('ne dose pas sur une analyse manquante ou un ancien journal', () => {
    const c = context();
    delete c.recipe.waterPlan.sourceSnapshot;
    c.waterSources = [];
    expect(() => propose(c, { 'waterPlan.roLimitL': 10 })).toThrow(/Analyse/);
    const started = context();
    started.journal = { startedAt: Date.now() };
    expect(() => runBrewerTool('plan_recipe_water', { availableRoL: 10 }, started)).toThrow(
      /commencé/
    );
  });
  it('le calculateur retourne le même résultat que la proposition et garde les sels écartés', () => {
    const c = context();
    c.recipe.waterPlan.disabled = ['gypse', 'chaux'];
    const evidence = runBrewerTool('plan_recipe_water', { availableRoL: 10 }, c).data as any;
    const next = accept(c, propose(c, { 'waterPlan.roLimitL': 10 }));
    expect(next.waterPlan).toEqual(evidence.plan);
    expect(next.waterPlan!.mash.gypse ?? 0).toBe(0);
    expect(evidence.totalRoL).toBe(10);
  });
  it('actualise les pourcentages du grain sans un champ Gemini supplémentaire', () => {
    const c = context();
    c.recipe.fermentables.push({
      ...c.recipe.fermentables[0],
      name: 'Autre malt',
      weightKg: 1,
      pct: 999
    });
    const next = accept(c, propose(c, { 'fermentables.0.weightKg': 3 }));
    expect(next.fermentables.map((f) => f.pct)).toEqual([75, 25]);
    expect(next.totalGristKg).toBe(4);
    expect(next.mash!.ratioLPerKg).toBe(5);
  });
  it('un rapport eau/grain demandé recalcule les deux volumes en conservant leur somme', () => {
    const c = context(),
      p = propose(c, { 'mash.ratioLPerKg': 3 });
    const next = accept(c, p);
    expect(next.waterPlan).toMatchObject({ mashWaterL: 15, spargeWaterL: 15 });
    expect(next.mash!.ratioLPerKg).toBe(3);
    expect(p.changes.find((ch) => ch.path === 'mash.ratioLPerKg')?.group).toBe('water');
  });
  it('écarter un sel le retire même s’il était fixé à la main', () => {
    const c = context();
    c.recipe.waterPlan.saltOverrides = { mash: { gypse: 2 } };
    const next = accept(c, propose(c, { 'waterPlan.disabled': ['gypse'] }));
    expect(next.waterPlan!.mash.gypse ?? 0).toBe(0);
    expect(() => propose({ ...c, recipe: next }, { 'waterPlan.mash.gypse': 3 })).toThrow(/écarté/);
  });
});
