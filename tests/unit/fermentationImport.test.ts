import {describe,it,expect} from 'vitest';
import pack from '../../src/data/fermentationScienceBootstrap.json';
import {planFermentationImport} from '../../scripts/fermentation-science/import-plan.mjs';
import {encode} from '../../scripts/yeast-catalogue/import-plan.mjs';
const document=(data:any)=>({name:'projects/test/databases/(default)/documents/hopKnowledge/'+data.id,fields:encode(data).mapValue.fields,updateTime:'2026-09-08T00:00:00Z'});
describe('Import science versionné et non destructif',()=>{
 it('crée les manquants puis ne propose aucun deuxième écrit',()=>{
  expect(planFermentationImport(pack,[]).writes).toHaveLength(pack.length);
  const second=planFermentationImport(pack,pack.map(document));
  expect(second.writes).toEqual([]);expect(second.conflicts).toEqual([]);
 });
 it('conserve les corrections et capacités des levures existantes',()=>{
  const yeast=pack.find(r=>r.kind==='yeast')!;
  const plan=planFermentationImport([yeast],[document({...yeast,name:'Nom personnel',betaLyase:'positive',catalogue:{user:'data'}})]);
  expect(plan.writes).toEqual([]);expect(plan.preserved).toEqual([yeast.id]);
 });
 it('bloque une révision différente sans son exact précédent et exige une nouvelle version',()=>{
  const before=pack[0],edited={...before,name:'Connaissance modifiée'},next={...edited,version:'new'};
  expect(planFermentationImport([next],[document(before)]).conflicts).toHaveLength(1);
  expect(planFermentationImport([edited],[document(before)],[before]).conflicts).toHaveLength(1);
  const plan=planFermentationImport([next],[document(before)],[before]);
  expect(plan.writes[0].updateTime).toBe('2026-09-08T00:00:00Z');
  expect(planFermentationImport([next],[document(edited)],[before]).conflicts).toHaveLength(1);
 });
});
