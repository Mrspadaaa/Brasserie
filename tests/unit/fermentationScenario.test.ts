import { describe, expect, it } from 'vitest';
import { evaluateFermentationScenario, fermentationDefaultGoal, resolveFermentationYeast } from '../../src/domain/fermentationScenario';
import { guideFermentations, guideYeasts } from '../../src/ui/hopIndex/guideData';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { fullRecipe } from '../fixtures/fullRecipe';
import { fermentationRangeLabel } from '../../src/ui/fermentationPresentation';
const guides=guideFermentations([]), yeasts=guideYeasts(catalogue as HopKnowledge[]);
const recipe=()=>({...structuredClone(fullRecipe),ogTarget:1.046,yeast:{name:'LalBrew Diamond',form:'sèche' as const,qty:0,unit:'g'},fermentation:[{name:'Principale',kind:'primaire' as const,tempC:19,days:4},{name:'Froid',kind:'garde' as const,tempC:4,days:2}]});
describe('Scénario levure : identité et données effectivement applicables',()=>{
 it('reconnaît Diamond sans guide et calcule ses bornes fabricant sans inventer un plan',()=>{
  const r=recipe(),before=structuredClone(r),p=evaluateFermentationScenario(r,yeasts,guides);
  expect(p.yeast?.id).toBe('lalbrew-diamond');expect(p.guide).toBeUndefined();
  expect(p.temperature?.range).toEqual({min:10,max:15});
  expect(p.fg.range!.min).toBeCloseTo(1.00782,10);expect(p.fg.range!.max).toBeCloseTo(1.01058,10);
  expect(p.warnings).toHaveLength(1);expect(p.warnings[0]).toContain('19 °C');expect(r).toEqual(before);
 });
 it('n’impose pas un objectif banane à US-05 et suit la souche reconnue',()=>{
  const r=recipe();r.yeast.name='Fermentis Levure SafAle US-05';
  const p=evaluateFermentationScenario(r,yeasts,guides);
  expect(p.yeast?.id).toBe('fermentis-us05');expect(fermentationDefaultGoal(p.guide)).toBe('clean');
  expect(fermentationDefaultGoal(guides.find(g=>g.yeastId==='wyeast-3068'))).toBe('balanced');
 });
 it('laisse une identité ambiguë, une référence absente et des sources contradictoires indéterminées',()=>{
  const r=recipe(),diamond=yeasts.find(y=>y.id==='lalbrew-diamond')!;
  expect(resolveFermentationYeast(r,[diamond,{...diamond,id:'other'}])).toBeUndefined();
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,hopIndexId:'unknown'}},yeasts)).toBeUndefined();
  const conflict=structuredClone(diamond);conflict.catalogue!.facts.push({...conflict.catalogue!.facts.find(f=>f.key==='temperature')!,range:{min:15,max:20}});
  const p=evaluateFermentationScenario(r,[conflict],guides);expect(p.temperature).toBeUndefined();expect(p.fg.range).not.toBeNull();
 });
 it('conserve une température manquante et exclut les faux zéros de durée',()=>{
  const r=recipe();r.fermentation[0].tempC=undefined as any;r.fermentation[0].days=undefined as any;
  const p=evaluateFermentationScenario(r,yeasts,guides);expect(p.warnings.join(' ')).toContain('température inconnue');expect(p.warnings.join(' ')).toContain('durée inconnue');expect(p.fg.range).not.toBeNull();
 });
 it('repère un palier à cru sans inventer l’ajout correspondant',()=>{
  const r=recipe();r.hops=[];r.fermentation.push({name:'Premier houblonnage à cru',kind:'ajout',tempC:19,days:3} as any);
  expect(evaluateFermentationScenario(r,yeasts,guides).warnings.join(' ')).toContain('aucun ajout à cru');
  expect(r.hops).toEqual([]);
 });
 it('arrondit les bornes à l’extérieur, y compris un intervalle traversant zéro',()=>{
  expect(fermentationRangeLabel({min:1.00782,max:1.01058},'SG',3)).toBe('1,007–1,011 SG');
  expect(fermentationRangeLabel({min:2.155437,max:2.509763},'mg/L',2)).toBe('2,15–2,51 mg/L');
  expect(fermentationRangeLabel({min:-.001,max:.001},'mg/L',2)).toBe('-0,01–0,01 mg/L');
 });
});
