import { describe, expect, it } from 'vitest';
import pack from '../../src/data/fermentationScienceBootstrap.json';
import { assertHopKnowledge, type HopKnowledge } from '../../functions/src/hopPredictionSchema';
import type { FermentationScience } from '../../functions/src/fermentationScienceSchema';
import { activeFermentationScience, fermentationFinalGravity, fermentationLagerRest, fermentationLevers, fermentationProgramWarnings, fitPhenolStudy, predictStudyPhenols, suggestFermentationGoals } from '../../functions/src/fermentationScienceCore';
import { guideFermentationScience, guideFermentations, guideYeasts } from '../../src/ui/hopIndex/guideData';
import { createFermentationDraft, fermentationDraftErrors } from '../../src/domain/fermentationGuide';
const science=pack[0] as unknown as FermentationScience,study=science.phenolStudy!;
const input=()=>({yeastId:study.yeastId,protocolMatched:true,wortPlato:11,pitchMillionCellsMl:8,wheatPct:45,mashInC:44,boilMin:90,fermentC:18});
describe('Science de fermentation et domaines de calcul',()=>{
 it('valide le pack entier et chaque conduite avec ses plages sourcées',()=>{
  pack.forEach(p=>expect(()=>assertHopKnowledge(p)).not.toThrow());
  const guides=guideFermentations([]);expect(guides).toHaveLength(13);
  for(const g of guides){
   expect(guideYeasts([]).find(y=>y.id===g.yeastId)?.form).toBeDefined();
   for(const plan of g.plans)expect(fermentationDraftErrors(g,createFermentationDraft(g,plan.goal)!)).toEqual([]);
  }
  expect(new Set(guides.flatMap(g=>g.plans.map(p=>p.goal))).size).toBe(6);
 });
 it('ne remplace pas une révision désactivée ou invalide par le bootstrap',()=>{
  expect(guideFermentationScience([{...science,enabled:false}])).toEqual([]);
  expect(guideFermentationScience([{...science,levers:null} as any])).toEqual([]);
  expect(activeFermentationScience([null,{}])).toEqual([]);
  const edited=structuredClone(science);edited.lagerRest.progressPct={min:50,max:60};
  expect(guideFermentationScience([edited])[0].lagerRest.progressPct.min).toBe(50);
 });
 it('rejette les sources manquantes, valeurs infinies et degrés de liberté faux',()=>{
  for(const mutate of [
   (s:any)=>{delete s.levers[0].source;},(s:any)=>{s.lagerRest.progressPct.max=110;},
   (s:any)=>{s.phenolStudy.observations[0].vgMgL=Infinity;},(s:any)=>{s.phenolStudy.prediction.df=28;},
   (s:any)=>{s.goals.push(s.goals[0]);},(s:any)=>{s.phenolStudy.levels.mashInC=[44,37,52];}
  ]){const invalid=structuredClone(science);mutate(invalid);expect(()=>assertHopKnowledge(invalid)).toThrow();}
 });
 it('associe les termes français et ne transpose pas le levier propre à Munich sur 3068',()=>{
  expect(suggestFermentationGoals(science,'PÊCHE').map(g=>g.id)).toEqual(['fruit']);
  expect(suggestFermentationGoals(science,'tyol').map(g=>g.id)).toEqual(['thiols']);
  const selected=fermentationLevers(science,'banana','wyeast-3068');
  expect(selected.some(l=>l.id==='banana-3068')).toBe(true);
  expect(selected.some(l=>l.id==='banana-munich')).toBe(false);
  expect(fermentationLevers(science,'banana').every(l=>!l.yeastIds.length)).toBe(true);
 });
 it('calcule la DF documentaire et le repos en fraction du chemin attendu',()=>{
  const lager=guideFermentations([]).find(g=>g.yeastId===science.lagerRest.yeastIds[0])!;
  const fg=fermentationFinalGravity(lager,1.050);
  expect(fg.range!.min).toBeCloseTo(1.008,6);expect(fg.range!.max).toBeCloseTo(1.010,6);
  const r=fermentationLagerRest(science,lager,1.050,1.022);
  expect(r.trigger.range!.min).toBeCloseTo(1.0185,6);expect(r.trigger.range!.max).toBeCloseTo(1.024,6);
  expect(r.progress.range!.min).toBeCloseTo(66.6666667,5);expect(r.progress.range!.max).toBeCloseTo(70,6);
  expect(r.trigger.confidence).toBe('low');
  expect(fermentationLagerRest(science,lager,1.050,1.004).progress.range!.min).toBeGreaterThan(100);
  for(const sg of [0,-1,NaN,Infinity,1.060])expect(fermentationLagerRest(science,lager,1.050,sg).progress.range).toBeNull();
  expect(fermentationLagerRest(science,lager,undefined).trigger.range).toBeNull();
  const revised=structuredClone(science);revised.lagerRest.progressPct={min:50,max:60};
  expect(fermentationLagerRest(revised,lager,1.050).trigger.range).not.toEqual(r.trigger.range);
 });
 it('laisse les inconnues ouvertes et exclut la garde froide des alertes de fermentation',()=>{
  const g=guideFermentations([]).find(g=>g.yeastId==='lalbrew-pomona')!;
  for(const og of [0,1,NaN,Infinity,undefined])expect(fermentationFinalGravity(g,og).range).toBeNull();
  expect(fermentationFinalGravity(undefined,1.050).range).toBeNull();
  expect(fermentationLagerRest(science,g,1.050).trigger.range).toBeNull();
  expect(fermentationProgramWarnings(g,[{kind:'garde',tempC:2},{kind:'primaire',tempC:20}])).toEqual([]);
  expect(fermentationProgramWarnings(g,[{kind:'primaire',tempC:30}])).toHaveLength(1);
 });
 it('reconstruit les statistiques publiées et les bornes vérifiées indépendamment avec numpy',()=>{
  const fit=fitPhenolStudy(study);
  expect(fit.n).toBe(29);expect(fit.parameters).toBe(15);expect(fit.df).toBe(14);
  expect(fit.vg.mse).toBeCloseTo(.005684716666667,12);expect(fit.vp.mse).toBeCloseTo(.005571541666667,12);
  expect(fit.vg.r2).toBeCloseTo(.915273890716345,12);
  const pred=predictStudyPhenols(study,input());
  expect(pred.vg.range!.min).toBeCloseTo(2.1554372832633786,10);
  expect(pred.vg.range!.max).toBeCloseTo(2.509762716736619,10);
  expect(pred.vp.range!.min).toBeCloseTo(1.155609683858401,10);
  expect(pred.diagnostics!.leverage).toBeCloseTo(.2,12);
  // A future observation PI must be wider than a mean-response CI.
  expect(pred.vg.range!.max-pred.vg.range!.min).toBeGreaterThan(2*study.prediction.criticalT*Math.sqrt(fit.vg.mse*.2));
 });
 it('reproduit le point de validation sans le confondre avec un essai individuel',()=>{
  const v=study.validation,p=predictStudyPhenols(study,{...input(),wheatPct:v.wheatPct,mashInC:v.mashInC,boilMin:v.boilMin,fermentC:v.fermentC});
  expect(p.vg.range!.min).toBeCloseTo(2.2385634952727957,10);expect(p.vg.range!.max).toBeCloseTo(2.6209721713938676,10);
  expect(p.vp.range!.min).toBeCloseTo(1.246701144214976,10);expect(p.vp.range!.max).toBeCloseTo(1.625284064118356,10);
 });
 it('refuse souche différente, protocole incomplet, mash-in interpolé et coins non étudiés',()=>{
  for(const change of [{yeastId:'wyeast-3068'},{protocolMatched:false},{wortPlato:12},{pitchMillionCellsMl:9},{mashInC:45},{fermentC:null},{wheatPct:40,mashInC:37,boilMin:70,fermentC:16}]){
   const p=predictStudyPhenols(study,{...input(),...change});expect(p.vg.range).toBeNull();expect(p.vp.range).toBeNull();
  }
  const duplicate=structuredClone(study);duplicate.observations=duplicate.observations.map(o=>({...o,coded:[0,0,0,0]}));
  expect(predictStudyPhenols(duplicate,input()).vg.range).toBeNull();
 });
 it('recalcule depuis une révision des observations, sans pente biologique en dur',()=>{
  const changed=structuredClone(study);changed.observations=changed.observations.map(o=>({...o,vgMgL:o.vgMgL+1}));
  const a=predictStudyPhenols(study,input()),b=predictStudyPhenols(changed,input());
  expect(b.vg.range!.min-a.vg.range!.min).toBeCloseTo(1,10);
  expect(b.vp.range).toEqual(a.vp.range);
 });
});
