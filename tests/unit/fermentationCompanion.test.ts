import { describe, expect, it, vi } from 'vitest';
import catalogue from '../../src/data/yeastCatalogueBootstrap.json';
import pack from '../../src/data/fermentationScienceBootstrap.json';
import { publicHopData } from '../fixtures/hopPublicPacks';
import { recipe } from '../fixtures/brewCompanion';
import type { BrewerContext } from '../../functions/src/companionTypes';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
import { runBrewerTool } from '../../src/domain/brewerTools';
import { brewerContextForPrompt, brewerContextForStorage } from '../../functions/src/hopCompanionContext';
import { prepareProposal, applyProposal } from '../../functions/src/brewerProposals';
import { runBrewerHarness } from '../../functions/src/brewerHarness';
const context=():BrewerContext=>({
 recipe:recipe(),now:1788868800000,phase:'Planification',provenance:[],inventory:[],material:[],waterSources:[],editableTargets:['recipe'],
 hopIndex:{...publicHopData(),knowledge:[...new Map([...publicHopData().knowledge,...pack,...catalogue].map(k=>[k.id,k])).values()] as HopKnowledge[],predictions:[],tastings:[],truncated:[]}
});
describe('Conseils de fermentation du compagnon, appels simulés seulement',()=>{
 it('cherche une souche au-delà de 400 fiches sans dépendre des identités de l’aperçu',()=>{
  const c=context(),target=catalogue.find(y=>y.id==='yeast-omega-9188919542014')!,before=JSON.stringify(c);
  const data=runBrewerTool('lookup_yeast_reference',{query:target.id},c).data as any;
  expect(data.yeasts[0].catalogue.facts.length).toBeGreaterThan(0);
  const prompt=brewerContextForPrompt(c);
  expect(prompt.hopIndex!.yeastCatalogue.references).toBeGreaterThan(1700);
  expect(prompt.hopIndex!.knowledge.filter(k=>k.kind==='yeast')).toHaveLength(20);
  expect(JSON.stringify(prompt)).not.toContain('rawContentSha256');
  expect(Buffer.byteLength(JSON.stringify(prompt))).toBeLessThan(150_000);
  expect(JSON.stringify(c)).toBe(before);
 });
 it('donne des conseils et alternatives même sans recette, sans concentrations inventées',()=>{
  const c=context();delete c.recipe;
  const data=runBrewerTool('fermentation_advice',{goal:'banana',yeastId:'yeast-omega-9188919542014'},c).data as any;
  expect(data.guides).toHaveLength(1);expect(data.guides[0].aroma.pof).toBe('negative');
  expect(data.levers.some((l:any)=>l.id==='banana-no-clove')).toBe(true);
  expect(data.finalGravity.range).toBeNull();expect(data.doses[0].estimate).toBeNull();
  expect(data.compounds.some((c:any)=>c.id==='diacetyl')).toBe(true);
  expect(data).not.toHaveProperty('intensity');
 });
 it('garde les plages de dose/DF/repos et ne présente pas l’OG prévue comme mesurée',()=>{
  const c=context();c.recipe!.yeast.hopIndexId='yeast-fermentis-saflager-w-34-70';
  const result=runBrewerTool('fermentation_advice',{goal:'clean',og:1.05,sg:1.022},c).data as any;
  expect(result.finalGravity.range.min).toBeCloseTo(1.008,6);
  expect(result.lagerRest.trigger.range.min).toBeCloseTo(1.0185,6);
  expect(result.doses[0].estimate.confidence).toBe('low');
  const fallback=runBrewerTool('fermentation_advice',{goal:'clean'},c).data as any;
  expect(fallback.gravityContext.origin).toContain('pas mesure');
 });
 it('rejoue le changement de levure avec le seul catalogue utile et sous la limite Firestore',()=>{
  const c=context(),id='yeast-omega-9188919542014',target=c.hopIndex!.knowledge.find(k=>k.id===id)!;
  const proposal=prepareProposal(c,{target:'recipe',title:'Choisir la levure banane',changes:[
   {path:'yeast.hopIndexId',valueJson:JSON.stringify(id),reason:'Référence choisie'},
   {path:'yeast.name',valueJson:JSON.stringify(target.name),reason:'Nom du produit choisi'}
  ]});
  const compact=brewerContextForStorage(c,proposal);
  expect(Buffer.byteLength(JSON.stringify(compact))).toBeLessThan(650_000);
  const ids=compact.hopIndex!.knowledge.filter(k=>k.kind==='yeast');
  expect(ids.some(k=>k.id===id)).toBe(true);expect(ids.every(k=>!('catalogue' in k))).toBe(true);
  expect(applyProposal(compact,proposal,proposal.changes.map(ch=>ch.id)).yeast.hopIndexId).toBe(id);
 });
 it('charge les données à la demande pour les deux nouveaux outils sans vrai appel IA',async()=>{
  const c=context(),index=c.hopIndex;delete c.hopIndex;delete c.recipe;
  const call=(name:string,args:unknown)=>({candidates:[{content:{role:'model',parts:[{functionCall:{name,args}}]}}]});
  const generate=vi.fn().mockResolvedValueOnce(call('lookup_yeast_reference',{query:'Bananza'}))
   .mockResolvedValueOnce(call('fermentation_advice',{goal:'banana',yeastId:'yeast-omega-9188919542014'}))
   .mockResolvedValueOnce(call('finish_advice',{level:'info',summary:'Bananza est documentée pour la banane.',action:'Vérifier la conduite proposée.',why:'Profil fabricant.',watch:'Confiance faible pour la bière.',question:'',evidenceIds:['E1','E2']}))
   .mockResolvedValueOnce({candidates:[{content:{role:'model',parts:[{text:JSON.stringify({approved:true,proposalApproved:true,issues:[]})}]}}]});
  const loadHopIndex=vi.fn().mockResolvedValue(index);
  const output=await runBrewerHarness(c,'Quelle levure pour la banane sans girofle ?',[],generate,{loadHopIndex});
  expect(loadHopIndex).toHaveBeenCalledOnce();expect(output.trace.filter(t=>t.error)).toEqual([]);
  expect(JSON.stringify(generate.mock.calls[0][1])).toContain('FERMENTATION');
 });
});
