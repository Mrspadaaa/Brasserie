import { decode } from '../yeast-catalogue/import-plan.mjs';
export const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
/** Whole-file planning; updates require the exact previously reviewed pack, never a guessed baseline. */
export function planFermentationImport(incoming,documents,baseline=[]){
 const old=new Map(documents.map(d=>[d.name.split('/').at(-1),{document:d,data:decode({mapValue:{fields:d.fields}})}]));
 const previous=new Map(baseline.map(d=>[d.id,d])),writes=[],unchanged=[],preserved=[],conflicts=[];
 for(const row of incoming){
  const found=old.get(row.id);
  if(!found){writes.push({id:row.id,data:row,create:true});continue;}
  if(found.data.kind!==row.kind){conflicts.push({id:row.id,reason:'Type différent dans la base'});continue;}
  // Catalogue identities are already curated; never overwrite names, form, capabilities or catalogue here.
  if(row.kind==='yeast'){preserved.push(row.id);continue;}
  if(canonical(found.data)===canonical(row)){unchanged.push(row.id);continue;}
  const before=previous.get(row.id);
  if(!before||canonical(before)!==canonical(found.data)){conflicts.push({id:row.id,reason:'Révision existante différente ; conserver et réconcilier explicitement'});continue;}
  if(!row.version||row.version===before.version){conflicts.push({id:row.id,reason:'Nouvelle version requise'});continue;}
  writes.push({id:row.id,data:row,create:false,updateTime:found.document.updateTime,previous:found.data});
 }
 return {writes,unchanged,preserved,conflicts};
}
