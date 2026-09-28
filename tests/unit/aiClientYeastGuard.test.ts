import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocked=vi.hoisted(()=>({call:vi.fn()}));
vi.mock('firebase/functions',()=>({httpsCallable:()=>mocked.call}));
vi.mock('../../src/services/firebase',()=>({functions:{}}));
import {AiClient} from '../../src/services/aiClient';
const data=(sourceUrl:string)=>({found:true,source:'Notice produit',sourceUrl,technicalFacts:[
 {key:'species',reported:'Saccharomyces cerevisiae',origin:'ai',source:'Notice produit',sourceUrl} ]});
beforeEach(()=>mocked.call.mockReset());
describe('Autocomplétion Levure : réponse encore non retenue',()=>{
 it('refuse la racine seule même si le serveur ancien annonce ok, sans exposer ni appliquer la réponse',async()=>{
  mocked.call.mockResolvedValue({data:{ok:true,data:data('https://example.invalid/')}});
  const result=await AiClient.run({task:'lookupIngredient',tier:'fast',context:{kind:'levure'}});
  expect(result.ok).toBe(false);expect(result.data).toBeUndefined();expect(result.error).toMatch(/source/i);
  expect(mocked.call).toHaveBeenCalledTimes(1);
 });
 it.each(['https://example.invalid/products/strain','https://example.invalid/?product=123','https://example.invalid/#/products/123'])('conserve la ressource syntaxiquement localisée %s',async(url)=>{
  const expected=data(url);mocked.call.mockResolvedValue({data:{ok:true,data:expected}});
  const result=await AiClient.run({task:'lookupIngredient',tier:'fast',context:{kind:'levure'}});
  expect(result).toEqual({ok:true,data:expected});
 });
 it('conserve found:false et ne durcit pas les autres ingrédients',async()=>{
  mocked.call.mockResolvedValue({data:{ok:true,data:{found:false}}});
  expect((await AiClient.run({task:'lookupIngredient',tier:'fast',context:{kind:'levure'}})).data).toEqual({found:false});
  mocked.call.mockResolvedValue({data:{ok:true,data:{found:true,name:'Malt de contrôle'}}});
  expect((await AiClient.run({task:'lookupIngredient',tier:'fast',context:{kind:'malt'}})).ok).toBe(true);
 });
});
