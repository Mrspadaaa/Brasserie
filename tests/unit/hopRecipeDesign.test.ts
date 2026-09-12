import { describe, expect, it } from 'vitest';
import { fullRecipe } from '../fixtures/fullRecipe';
import { analyseHopRecipe, applyHopRecipeAdjustment, createHopRecipeAdjustment, evaluateHopRecipeAdjustment, hopFitsStyle, hopRecipeKey, hopRecipeStyle } from '../../src/domain/hopRecipeDesign';
import type { Recipe } from '../../src/types';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
import { hotBitterness } from '../../src/domain/hopBitterness';
import { readRecipeText, writeRecipeText } from '../../src/domain/recipeTransfer';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign } from '../../src/domain/yeastRecipeDesign';
import { yeastReferences } from '../../src/domain/yeastReferences';

const recipe = (): Recipe => ({ ...structuredClone(fullRecipe), nolo: undefined, yeastDesign: undefined, style: 'Hefeweizen', styleRef: undefined, volumeL: 30, ogTarget: 1.05, boilMin: 60,
  hops: [{ name: 'Test', stage: 'boil', alpha: 12, weightG: 40, timeMin: 60 }],
});
const variety = (id: string, form: HopVariety['form'] = 'pelletT90'): HopVariety => ({ id, name: id, form, aliases: [], analysis: [], descriptions: [] });

describe('Houblonnage par style et scénarios de recette', () => {
  it('carries a resolved guide identity and actual bitterness into the yeast step', () => {
    const r = { ...recipe(), ibuTarget: 12, styleRef: { styleId: 'ba-969', guideId: 'styles-ba-2026', version: '2026-09-09.1' } };
    const refs = yeastReferences([]), d = createYeastRecipeDraft(r, refs);
    expect(hopRecipeStyle(r).family).toBe('weissbier'); expect(d.styleId).toBe('weissbier');
    const effect = evaluateYeastRecipeDesign(r, d, refs).effects.find(e => e.id === 'style-hops');
    expect(effect?.detail).toContain('IBU calculés à chaud : 36,906'); expect(effect?.detail).toContain('cible saisie : 12');
  });
  it('uses the exact style range and keeps wheat variants and unknown styles distinct', () => {
    expect(hopRecipeStyle(recipe()).ibu).toEqual({ min: 8, max: 15 });
    expect(hopRecipeStyle({ ...recipe(), style: 'Dunkelweizen' }).ibu).toEqual({ min: 10, max: 18 });
    expect(hopRecipeStyle({ ...recipe(), style: 'German Pils' }).ibu).toEqual({ min: 22, max: 40 });
    expect(hopRecipeStyle({ ...recipe(), style: 'Lager personnelle' }).ibu).toBeUndefined();
    expect(hopRecipeStyle({ ...recipe(), style: 'Berliner Weisse' }).family).not.toBe('weissbier');
    expect(hopFitsStyle('Citra', 'weissbier')).toBe(false);
    expect(hopFitsStyle('Citra®', 'hazy-ipa')).toBe(true);
    expect(hopFitsStyle('Hallertauer Mittelfrüh', 'weissbier')).toBe(true);
  });
  it('solves an independently calculated 12 IBU wheat example without mutating the input', () => {
    const original = recipe(), saved = structuredClone(original);
    const draft = { ...createHopRecipeAdjustment(original), alpha: 4, targetIbu: 12 };
    const preview = evaluateHopRecipeAdjustment(original, draft);
    expect(preview.errors).toEqual([]); expect(preview.afterGrams).toBeCloseTo(39.018, 2); expect(preview.afterIbu).toBeCloseTo(12, 8);
    expect(original).toEqual(saved);
    const next = applyHopRecipeAdjustment(original, draft, hopRecipeKey(original));
    expect(next.hops[0].weightG).toBeCloseTo(39.018, 2); expect(next.yeast).toEqual(original.yeast);
    expect(next.mash).toEqual(original.mash); expect(next.fermentation).toEqual(original.fermentation);
  });
  it('moves 60 to 10 minutes at same mass, then solves equal IBU without a sensory percentage', () => {
    const r = recipe(), draft = { ...createHopRecipeAdjustment(r, 0, 'move'), timeMin: 10 };
    const sameMass = evaluateHopRecipeAdjustment(r, draft);
    expect(sameMass.beforeIbu).toBeCloseTo(36.906, 2); expect(sameMass.afterIbu).toBeCloseTo(13.381, 2);
    const equalIbu = evaluateHopRecipeAdjustment(r, { ...draft, keepIbu: true });
    expect(equalIbu.afterGrams).toBeCloseTo(110.323, 2); expect(equalIbu.afterIbu).toBeCloseTo(sameMass.beforeIbu!, 8);
    expect(equalIbu.notes.join(' ')).toMatch(/ne calcule pas un gain/);
  });
  it('holds all other additions constant and refuses a target already exceeded by them', () => {
    const r = recipe(); r.hops.push({ ...r.hops[0], weightG: 10, timeMin: 10 });
    const draft = { ...createHopRecipeAdjustment(r), targetIbu: 20 };
    const next = applyHopRecipeAdjustment(r, draft, hopRecipeKey(r));
    expect(next.hops[1]).toEqual(r.hops[1]); expect(hotBitterness(next.hops,30,1.05,60).total).toBeCloseTo(20, 9);
    expect(evaluateHopRecipeAdjustment(r, { ...draft, targetIbu: 0 }).errors.join(' ')).toMatch(/autres ajouts dépassent/);
  });
  it('can prepare the first addition and does not invent alpha or density', () => {
    const r = { ...recipe(), hops: [] };
    const draft = { ...createHopRecipeAdjustment(r), name: 'Tettnanger', targetIbu: 12 };
    expect(evaluateHopRecipeAdjustment(r, draft).errors.join(' ')).toMatch(/alpha/);
    const ready = { ...draft, alpha: 4 };
    expect(applyHopRecipeAdjustment(r, ready, hopRecipeKey(r)).hops).toHaveLength(1);
    expect(evaluateHopRecipeAdjustment({ ...r, ogTarget: null }, ready).errors.join(' ')).toMatch(/densité initiale/);
    expect(evaluateHopRecipeAdjustment({ ...r, volumeL: 0 }, ready).nextHop).toBeUndefined();
  });
  it('does not solve positive bitterness with zero contact or overlong boil', () => {
    const r=recipe(), draft={...createHopRecipeAdjustment(r),targetIbu:12,timeMin:0};
    expect(evaluateHopRecipeAdjustment(r,draft).errors.join(' ')).toMatch(/aucune amertume/);
    expect(evaluateHopRecipeAdjustment(r,{...draft,timeMin:70}).errors.join(' ')).toMatch(/supérieur/);
    expect(evaluateHopRecipeAdjustment(r,{...draft,timeMin:20,alpha:NaN}).nextHop).toBeUndefined();
  });
  it('matches alpha potency only with documented or explicitly confirmed identical product forms', () => {
    const r=recipe(), refs=[variety('replacement')];
    const draft={...createHopRecipeAdjustment(r,0,'replace'),name:'replacement',varietyId:'replacement',alpha:6};
    expect(evaluateHopRecipeAdjustment(r,draft,refs).errors.join(' ')).toMatch(/de même forme/);
    const equal=evaluateHopRecipeAdjustment(r,{...draft,originalForm:'pelletT90'},refs);
    expect(equal.afterGrams).toBeCloseTo(80,8); expect(equal.afterIbu).toBeCloseTo(equal.beforeIbu!,8);
    expect(evaluateHopRecipeAdjustment(r,{...draft,originalForm:'cone'},refs).nextHop).toBeUndefined();
    expect(evaluateHopRecipeAdjustment(r,{...draft,originalForm:'pelletT90'},[variety('replacement','cryo')]).nextHop).toBeUndefined();
  });
  it('clears obsolete stock and COA identity on substitution but preserves ingredient-independent state', () => {
    const r=recipe();Object.assign(r.hops[0],{hopVarietyId:'old',hopLotId:'lot-old',stockItemRef:'stock-old'});
    r.hopTrialId='trial';r.hopMatrixId='matrix';r.hopPredictionIds=['prediction'];
    const draft={...createHopRecipeAdjustment(r,0,'replace'),name:'new',varietyId:'new',alpha:6};
    const next=applyHopRecipeAdjustment(r,draft,hopRecipeKey(r),[variety('old'),variety('new')]);
    expect(next.hops[0]).toMatchObject({name:'new',hopVarietyId:'new'}); expect(next.hops[0].weightG).toBeCloseTo(80,8);
    expect(next.hops[0].hopLotId).toBeUndefined(); expect(next.hops[0].stockItemRef).toBeUndefined();expect(next.hopTrialId).toBeUndefined();expect(next.hopPredictionIds).toBeUndefined();
  });
  it('sets biological phase, temperature and contact on a dry hop, retaining other additions through export', () => {
    const r=recipe(),draft={...createHopRecipeAdjustment(r,-1,'dryHop'),name:'Mosaic',doseGL:4,phase:'postFermentation' as const,contactHours:48,tempC:16,dayOffset:8};
    const preview=evaluateHopRecipeAdjustment(r,draft);expect(preview.afterGrams).toBe(120);expect(preview.afterDryGL).toBe(4);
    const next=applyHopRecipeAdjustment(r,draft,hopRecipeKey(r));expect(next.hops[0]).toEqual(r.hops[0]);
    expect(next.hops[1]).toMatchObject({stage:'dryHop',aromaTiming:'postFermentation',aromaContactHours:48,aromaTemperatureC:16,dayOffset:8});
    expect(analyseHopRecipe(next).warnings.join(' ')).toMatch(/densité.*diacétyle/);
    const roundTrip=readRecipeText(writeRecipeText(next))!;expect(roundTrip.hops[1]).toMatchObject({aromaTiming:'postFermentation',aromaTemperatureC:16,aromaContactHours:48});
  });
  it('does not infer active fermentation from a day and does not treat missing doses as zero', () => {
    const r=recipe();r.hops.push({name:'Citra',stage:'dryHop',weightG:NaN,alpha:0,dayOffset:3});
    const analysis=analyseHopRecipe(r);expect(analysis.dry.doseGL).toBeUndefined();expect(analysis.dry.unknownCount).toBe(1);
    expect(analysis.warnings.join(' ')).toMatch(/jour prévu/);
    const draft={...createHopRecipeAdjustment(r,1,'dryHop'),doseGL:4,tempC:18,contactHours:48};
    expect(evaluateHopRecipeAdjustment(r,draft).errors.join(' ')).toMatch(/phase biologique/);
  });
  it('refuses stale scenarios after quantity, wort, yeast or fermentation changes', () => {
    const r=recipe(),key=hopRecipeKey(r),draft={...createHopRecipeAdjustment(r),targetIbu:12};
    for(const changed of [{...r,volumeL:20},{...r,ogTarget:1.07},{...r,yeast:{...r.yeast,name:'changed'}},{...r,fermentation:[]}]){
      expect(()=>applyHopRecipeAdjustment(changed,draft,key)).toThrow(/recette a changé/);
    }
    expect(evaluateHopRecipeAdjustment(r,{...draft,index:100}).nextHop).toBeUndefined();
  });
  it('uses calculated IBU for a wheat warning even when the saved target is low',()=>{
    const r={...recipe(),ibuTarget:8};expect(analyseHopRecipe(r).warnings.join(' ')).toMatch(/calculée dépasse/);
  });
});
