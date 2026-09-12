import {nuageWater} from './nuageWater';
import {newNoloConfig,noloScience,noloPlanningSource} from '../../src/domain/nolo';
import {replanRecipeWater} from '../../src/domain/recipeWater';
/** Equivalent recipe inputs for repeatable local QA; no production documents. */
export function nuagePilots() {
 const mother=nuageWater(65);
 Object.assign(mother,{id:'qa-nuage-mother',name:'QA Nuage · mère',hops:[{name:'Hallertauer Mittelfrüh',hopVarietyId:'hopsteiner-hal',weightG:28,alpha:4,stage:'boil',timeMin:60}],
  yeast:{name:'LalBrew Munich Classic',hopIndexId:'lallemand-munich-classic',form:'sèche',qty:18,unit:'g'},
  fermentation:[{kind:'primaire',name:'Fermentation complète',tempC:20,days:7}],
  mash:{steps:[{tempC:68,durationMin:55},{tempC:72,durationMin:15}],ratioLPerKg:3.5},
  nolo:{...newNoloConfig(),process:'dealcoholized',orientation:'banana',scienceSnapshot:noloScience(),planning:{version:1,source:noloPlanningSource},
   operations:[{id:'removal',kind:'removal',name:'Retrait supposé',ethanolRemovedPct:{min:94,max:96},finalVolumeL:24,source:'Choix QA de préparation, 2026'}]}});
 mother.waterPlan=replanRecipeWater(mother).plan;
 const limited=structuredClone(mother);limited.id='qa-nuage-la01';limited.name='QA Nuage · limitée';
 limited.yeast={name:'Fermentis SafBrew LA-01',hopIndexId:noloScience()!.la01.yeastId,form:'sèche',qty:18,unit:'g'};
 limited.nolo!.process='restricted';limited.nolo!.operations=[];
 limited.fermentables.forEach(f=>f.weightKg*=.503);
 limited.mash!.steps=[{name:'Saccharification',tempC:65,durationMin:40},{name:'Conversion',tempC:73,durationMin:25}];
 return [mother,limited];
}
