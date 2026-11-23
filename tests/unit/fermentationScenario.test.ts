import { describe, expect, it } from 'vitest';
import { evaluateFermentationScenario, fermentationDefaultGoal, resolveFermentationYeast } from '../../src/domain/fermentationScenario';
import { guideFermentations, guideYeasts } from '../../src/ui/hopIndex/guideData';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import type { HopKnowledge, HopYeast } from '../../functions/src/hopPredictionSchema';
import type { Recipe } from '../../src/types';
import { fullRecipe } from '../fixtures/fullRecipe';
import { fermentationRangeLabel } from '../../src/ui/fermentationPresentation';
const guides=guideFermentations([]), yeasts=guideYeasts(catalogue as HopKnowledge[]);
const recipe=():Recipe=>({...structuredClone(fullRecipe),ogTarget:1.046,fermentables:[{name:'Pils',kind:'grain' as const,use:'empatage' as const,weightKg:4,potentialPpg:37}],yeast:{name:'LalBrew Diamond',form:'sèche' as const,qty:0,unit:'g'},fermentation:[{name:'Principale',kind:'primaire' as const,tempC:19,days:4},{name:'Froid',kind:'garde' as const,tempC:4,days:2}]});
const identityRow=(id:string,name:string,manufacturer:string,code:string,aliases:string[]):HopYeast&{aliases:string[]}=>{
 const row=structuredClone(yeasts.find(y=>y.id==='lalbrew-diamond')!) as HopYeast&{aliases?:string[]};
 row.id=id;row.name=name;row.catalogue!.manufacturer=manufacturer;row.catalogue!.productCode=code;row.catalogue!.aliases=aliases;row.catalogue!.facts=[];
 return {...row,aliases};
};
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
 it('ne choisit pas au hasard un nom/code partagé et utilise le fabricant seulement s’il concorde',()=>{
  const alpha=identityRow('fixture-alpha','Culture Alpha','Labo Alpha Brewing','AB-12',['Nom partagé']);
  const beta=identityRow('fixture-beta','Culture Bêta','Labo Bêta Brewing','AB-12',['Nom partagé']);
  const r=recipe();r.yeast={name:'Nom partagé',strain:'AB12'};
  expect(resolveFermentationYeast(r,[alpha,beta])).toBeUndefined();
  expect(resolveFermentationYeast(r,[beta,alpha])).toBeUndefined();
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,lab:'Labo Bêta'}},[alpha,beta])?.id).toBe(beta.id);
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,lab:'Labo Fantôme'}},[alpha,beta])).toBeUndefined();
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,lab:'Labo Alpha',strain:'AB-13'}},[alpha,beta])).toBeUndefined();
 });
 it('accepte un fabricant abrégé et un fragment de code imprimé uniquement s’ils concordent',()=>{
  const product=identityRow('fixture-product','Culture Verdant IPA','Labo Verdant Brewing','V-24',['Verdant IPA','V-24']);
  const r=recipe();r.yeast={name:'Verdant IPA',lab:'Labo Verdant',strain:'IPA'};
  expect(resolveFermentationYeast(r,[product])?.id).toBe(product.id);
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,lab:'Autre labo'}},[product])).toBeUndefined();
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,strain:'Lager'}},[product])).toBeUndefined();
 });
 it('identifie hors fixtures par ID fabricant/code, jamais par le productId global',()=>{
  const bootleg=yeasts.find(y=>y.id==='yeast-bootleg-2883')!,bsi=yeasts.find(y=>y.id==='yeast-bsi-2883')!;
  expect(bootleg.catalogue!.productId).toBe(bsi.catalogue!.productId);
  const r=recipe();r.yeast={name:bootleg.name,lab:bootleg.catalogue!.manufacturer,strain:bootleg.catalogue!.productCode!,stockItemRef:'LOT-2883',qty:1,unit:'g'};
  expect(resolveFermentationYeast(r,[bootleg,bsi])?.id).toBe(bootleg.id);
  expect(resolveFermentationYeast(r,[bsi,bootleg])?.id).toBe(bootleg.id);
  expect(resolveFermentationYeast({...r,yeast:{...r.yeast,lab:bsi.catalogue!.manufacturer}},[bootleg,bsi])).toBeUndefined();
  expect(r.yeast.hopIndexId).toBeUndefined();expect(r.yeast.stockItemRef).toBe('LOT-2883');
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
 it('refuse maintenant d’ignorer le lactose et les fruits incomplets de la recette',()=>{
  const r={...recipe(),fermentables:structuredClone(fullRecipe.fermentables)};
  const p=evaluateFermentationScenario(r,yeasts,guides);
  expect(p.fg.range).toBeNull();expect(p.abv.range).toBeNull();
  expect(p.fg.reasons.join(' ')).toContain('manquant');
 });
 it('arrondit les bornes à l’extérieur, y compris un intervalle traversant zéro',()=>{
  expect(fermentationRangeLabel({min:1.00782,max:1.01058},'SG',3)).toBe('1,007–1,011 SG');
  expect(fermentationRangeLabel({min:2.155437,max:2.509763},'mg/L',2)).toBe('2,15–2,51 mg/L');
  expect(fermentationRangeLabel({min:-.001,max:.001},'mg/L',2)).toBe('-0,01–0,01 mg/L');
 });
});
