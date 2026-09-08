import { catalogueHash } from './parse.mjs';
export function decode(value) {
  if ('mapValue' in value) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([k,v])=>[k,decode(v)]));
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(decode);
  if ('nullValue' in value) return null;
  if ('integerValue' in value) return Number(value.integerValue);
  for (const key of ['stringValue','doubleValue','booleanValue','timestampValue']) if(key in value)return value[key];
  throw Error('Unsupported Firestore value');
}
export function encode(value) {
  if(value===null)return {nullValue:'NULL_VALUE'};
  if(typeof value==='string')return {stringValue:value};
  if(typeof value==='boolean')return {booleanValue:value};
  if(typeof value==='number'&&Number.isFinite(value))return Number.isInteger(value)?{integerValue:String(value)}:{doubleValue:value};
  if(Array.isArray(value))return {arrayValue:{values:value.map(encode)}};
  if(value&&typeof value==='object')return {mapValue:{fields:Object.fromEntries(Object.entries(value).filter(([,v])=>v!==undefined).map(([k,v])=>[k,encode(v)]))}};
  throw Error('Unsupported Firestore value');
}
export function planCatalogueImport(incoming, documents) {
  const old=new Map(documents.map(d=>[d.name.split('/').at(-1),{document:d,data:decode({mapValue:{fields:d.fields}})}]));
  const writes=[], conflicts=[], unchanged=[];
  for(const row of incoming){
    const previous=old.get(row.id);
    if(!previous){writes.push({id:row.id,data:row,create:true});continue;}
    if(previous.data.kind!==row.kind){conflicts.push({id:row.id,reason:'Existing document has another kind'});continue;}
    if(row.kind!=='yeast'||!row.catalogue){unchanged.push(row.id);continue;}
    const prior=previous.data.catalogue;
    if(prior&&catalogueHash(prior)!==prior.contentSha256){conflicts.push({id:row.id,reason:'Catalogue edited locally; automatic replacement skipped'});continue;}
    if(prior?.contentSha256===row.catalogue.contentSha256){unchanged.push(row.id);continue;}
    // Only the managed catalogue block is replaced; names, capabilities and user corrections remain authoritative.
    writes.push({id:row.id,data:{...previous.data,catalogue:row.catalogue},updateTime:previous.document.updateTime,previous:previous.data});
  }
  return {writes,conflicts,unchanged};
}
