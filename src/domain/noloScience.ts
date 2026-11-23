import pack from '../data/noloBootstrap.json';
import scenarioPack from '../data/noloScenarioBootstrap.json';
import { assertNoloScience, type NoloScience } from '../../functions/src/noloSchema';
import type { HopKnowledge } from '../../functions/src/hopPredictionSchema';
export function noloScience(saved: HopKnowledge[] = []): NoloScience | undefined {
  const canonical=(r:unknown)=>JSON.stringify(r,(_key,item)=>item&&typeof item==='object'&&!Array.isArray(item)?Object.fromEntries(Object.keys(item).filter(k=>k!=='__docId').sort().map(k=>[k,item[k]])):item);
  const rows = [...new Map([...pack,...scenarioPack,...saved.map(r=>{
    const old=pack.find(p=>p.id===r.id);
    return old&&canonical(old)===canonical(r)?scenarioPack.find(p=>p.id===r.id)??r:r;
  })].map(r=>[r.id,r])).values()];
  return rows.find((r): r is NoloScience => { if(r.kind!=='noloScience')return false;try{assertNoloScience(r);return r.enabled;}catch{return false;} });
}
