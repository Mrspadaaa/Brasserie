// Explicit production import: dry-run by default. No paid AI, no deletes, preconditioned writes.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertHopKnowledge } from '../functions/lib/hopPredictionSchema.js';
import { decode, encode, planCatalogueImport } from './yeast-catalogue/import-plan.mjs';
import { selectImportReferences } from './yeast-catalogue/enrichment.mjs';
const require=createRequire(import.meta.url), auth=require('firebase-tools/lib/auth.js');
const project=process.argv.find(a=>a.startsWith('--project='))?.slice(10);
if(!project||!/^[-a-z0-9]+$/.test(project))throw Error('Explicit --project=<Firebase project> required');
const apply=process.argv.includes('--apply'), folder=resolve('.codex-remote-attachments/yeast-catalogue/db');
await mkdir(folder,{recursive:true});
let incoming=JSON.parse(await readFile('src/data/yeastCatalogueBootstrap.json','utf8'));
const guides=JSON.parse(await readFile('src/data/fermentationGuideBootstrap.json','utf8'));
const solver=JSON.parse(await readFile('src/data/hopSolverBootstrap.json','utf8'));
const ids=new Set(incoming.map(r=>r.id));
for(const row of [...guides,...solver.filter(r=>r.kind==='yeast')])if(!ids.has(row.id)){incoming.push(row);ids.add(row.id);}
// Validate the entire file before authenticating or writing any document.
if(ids.size!==incoming.length)throw Error('Duplicate document id in catalogue');
incoming.forEach(row=>assertHopKnowledge(row,row.id));
const idsFile=process.argv.find(a=>a.startsWith('--ids-file='))?.slice(11);
if(idsFile)incoming=selectImportReferences(incoming,JSON.parse(await readFile(idsFile,'utf8')));
const account=auth.getProjectDefaultAccount(process.cwd());if(!account)throw Error('Firebase CLI sign-in required');
const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
const parent=`projects/${project}/databases/(default)/documents`, base=`https://firestore.googleapis.com/v1/${parent}`;
async function request(url,body){const r=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${token.access_token}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error(`Firestore HTTP ${r.status}`);return r.json();}
const existing=[];let cursor;
do {const result=await request(`${base}/hopKnowledge?pageSize=300${cursor?'&pageToken='+encodeURIComponent(cursor):''}`);existing.push(...(result.documents??[]));cursor=result.nextPageToken;}while(cursor);
const plan=planCatalogueImport(incoming,existing);
plan.writes.forEach(w=>assertHopKnowledge(w.data,w.id));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
await writeFile(resolve(folder,`before-${stamp}.json`),JSON.stringify({project,documents:existing},null,2));
await writeFile(resolve(folder,'last-plan.json'),JSON.stringify({project,apply,...plan},null,2));
const result={project,apply,proposed:plan.writes.length,created:0,updated:0,unchanged:plan.unchanged.length,conflicts:plan.conflicts,verified:0};
console.log(JSON.stringify({...result,conflicts:plan.conflicts.length}));
if(apply){
  for(let start=0;start<plan.writes.length;start+=200){const batch=plan.writes.slice(start,start+200);
    await request(base+':commit',{writes:batch.map(w=>({update:{name:parent+'/hopKnowledge/'+w.id,fields:encode(w.data).mapValue.fields},...(w.create?{}:{updateMask:{fieldPaths:w.fieldPaths??['catalogue']}}),currentDocument:w.create?{exists:false}:{updateTime:w.updateTime}}))});
    result.created+=batch.filter(w=>w.create).length;result.updated+=batch.filter(w=>!w.create).length;
    await writeFile(resolve(folder,'last-result.json'),JSON.stringify(result,null,2));console.log(`Committed ${Math.min(start+200,plan.writes.length)}/${plan.writes.length}`);
  }
  // Re-read the actual remote collection and compare managed content, not just HTTP success.
  const verified=[];cursor=undefined;
  do{const r=await request(`${base}/hopKnowledge?pageSize=300${cursor?'&pageToken='+encodeURIComponent(cursor):''}`);verified.push(...(r.documents??[]));cursor=r.nextPageToken;}while(cursor);
  const actual=new Map(verified.map(d=>[d.name.split('/').at(-1),decode({mapValue:{fields:d.fields}})]));
  for(const w of plan.writes){const d=actual.get(w.id);if(!d||JSON.stringify(d.catalogue??d)!==JSON.stringify(w.data.catalogue??w.data)){
      // Firestore does not preserve map key order.
      const canonical=v=>JSON.stringify(v,(_k,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
      if(canonical(d?.catalogue??d)!==canonical(w.data.catalogue??w.data))throw Error(`Verification mismatch: ${w.id}`);
    }if(w.fieldPaths?.includes('form')&&d.form!==w.data.form)throw Error(`Form verification mismatch: ${w.id}`);result.verified++;}
  result.totalRemoteYeasts=[...actual.values()].filter(d=>d.kind==='yeast').length;
  result.totalRemoteCatalogues=[...actual.values()].filter(d=>d.kind==='yeast'&&d.catalogue).length;
  await writeFile(resolve(folder,'after.json'),JSON.stringify({project,documents:verified},null,2));
}
await writeFile(resolve(folder,'last-result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({...result,conflicts:plan.conflicts.length}));
