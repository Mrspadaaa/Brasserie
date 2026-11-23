import {describe,it,expect} from 'vitest';
import {nuageWater} from '../fixtures/nuageWater';
import {replanRecipeWater,recipeWaterSummary,recipeWaterCalculation} from '../../src/domain/recipeWater';
import {readRecipeText,writeRecipeText} from '../../src/domain/recipeTransfer';
import {minimalDilution} from '../../src/domain/water/dilution';
import {raForGrist,raSaltCeilingForGrist} from '../../src/domain/water/mashPh';
import {styleFromTargetIons} from '../../src/domain/waterStyles';
import {waterProfileTarget,waterTreatmentTarget} from '../../src/domain/water/profileTarget';
import {dilute} from '../../src/domain/water/ions';
import {mashPhDiagnostic} from '../../src/domain/water/readiness';
describe('Nuage : proposition d’eau complète et pH séparé',()=>{
  it.each([
    [100,false,{ca:61.3,mg:0,so4:39.8,cl:79}],
    [65,false,{ca:71.9,mg:4.9,so4:31.4,cl:66.5}],
    [65,true,{ca:60.1,mg:18.8,so4:39.7,cl:79.8}]
  ] as const)('%s %% avec tous les sels=%s : ions, pH et rechargement',(pct,all,expected)=>{
    const recipe=nuageWater(pct,all);const out=replanRecipeWater(recipe);
    expect(out.plan.wortIons).toMatchObject(expected);
    const saved={...recipe,waterPlan:out.plan},summary=recipeWaterSummary(saved)!;
    expect(summary.totalRoL).toBeCloseTo(33.6*pct/100,8);
    expect(mashPhDiagnostic(summary.mashPhEstimate,5.4).status).toBe('outside');
    expect(out.warnings.some(w=>w.includes('Consigne hors'))).toBe(true);
    const roundtrip=readRecipeText(writeRecipeText(saved));
    expect(roundtrip.waterPlan?.disabled).toEqual(recipe.waterPlan!.disabled);
    expect(replanRecipeWater(roundtrip).plan).toMatchObject({mash:out.plan.mash,sparge:out.plan.sparge,acid:out.plan.acid,wortIons:out.plan.wortIons});
  });
  it.each([[false,65],[true,35]] as const)('minimum au pas : tous les sels=%s, %s %%',(all,pct)=>{
    const recipe=nuageWater(65,all),{p,source,grains,ratio,band}=recipeWaterCalculation(recipe);
    const style=styleFromTargetIons(p.targetIons!),mash={ceiling:raSaltCeilingForGrist(grains,ratio),target:raForGrist(grains,ratio)};
    const input={...waterProfileTarget(style,dilute(source,65),p.targetIons,.5,false),...waterTreatmentTarget(style,p.targetIons,mash),
      source,totalWaterL:33.6,mashWaterL:18.2,spargeWaterL:15.4,targetRa:band,raCeiling:mash.ceiling,raPreference:mash.target,
      ratio:.5,disabled:p.disabled,allSaltsInMash:false,acid:'lactique' as const,beerVolumeL:24,sourcePh:7.4};
    const result=minimalDilution(input);expect(result.pct).toBe(pct);expect(result.stepPct).toBe(5);expect(result.proposal).toBeDefined();
    const proposed=result.proposal!,applied=replanRecipeWater({...recipe,waterPlan:{...p,diRatioPct:result.pct,...proposed.split}});
    expect(applied.plan.wortIons).toEqual(proposed.treatment.treatedTotal);
    expect(applied.plan.acid).toEqual(proposed.acid);
    const constrained=minimalDilution({...input,saltOverrides:{mash:{gypse:20},sparge:{gypse:0}}});
    expect(constrained.feasible).toBe(false);
  });
  it('les doses conservées et les sels écartés survivent au dosage et à la dilution',()=>{
    const recipe=nuageWater(65);recipe.waterPlan!.saltOverrides={mash:{gypse:2,mgcl2:9},sparge:{gypse:0}};
    for(const pct of [65,100]){recipe.waterPlan!.diRatioPct=pct;const out=replanRecipeWater(recipe).plan;
      expect(out.mash.gypse).toBe(2);expect(out.sparge.gypse??0).toBe(0);expect(out.mash.mgcl2??0).toBe(0);
      expect(out.disabled).toEqual(recipe.waterPlan!.disabled);expect(out.saltOverrides).toEqual(recipe.waterPlan!.saltOverrides);}
  });
});
