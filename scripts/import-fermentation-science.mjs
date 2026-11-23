// Explicit DB import, dry-run by default. No deletes, paid AI, or credential logging.
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertHopKnowledge } from '../functions/lib/hopPredictionSchema.js';
import { decode, encode } from './yeast-catalogue/import-plan.mjs';
import { canonical, planFermentationImport } from './fermentation-science/import-plan.mjs';
const require=createRequire(import.meta.url),auth=require('firebase-tools/lib/auth.js');
const project=process.argv.find(a=>a.startsWith('--project='))?.slice(10);
if(!project||!/^[-a-z0-9]+$/.test(project))throw Error('Explicit --project=<Firebase project> required');
const apply=process.argv.includes('--apply'),priorPath=process.argv.find(a=>a.startsWith('--previous='))?.slice(11);
const pack=process.argv.find(a=>a.startsWith('--pack='))?.slice(7)??'fermentation';
if(!['fermentation','nolo-styles'].includes(pack))throw Error('Pack inconnu.');
const incoming=pack==='nolo-styles'
 ? (await Promise.all(['src/data/noloBootstrap.json','src/data/brewingStylesBootstrap.json'].map(async p=>JSON.parse(await readFile(p,'utf8'))))).flat()
 : JSON.parse(await readFile('src/data/fermentationScienceBootstrap.json','utf8'));
const prior=priorPath?JSON.parse(await readFile(priorPath,'utf8')):[];
for(const rows of [incoming,prior]){
 if(!Array.isArray(rows)||new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Pack invalide ou IDs dupliqués');
 rows.forEach(r=>assertHopKnowledge(r,r.id));
}
const folder=resolve('.codex-remote-attachments/'+(pack==='nolo-styles'?'nolo-styles':'fermentation-science')+'/db');await mkdir(folder,{recursive:true});
const account=auth.getProjectDefaultAccount(process.cwd());if(!account)throw Error('Firebase CLI sign-in required');
const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
const parent='projects/'+project+'/databases/(default)/documents',base='https://firestore.googleapis.com/v1/'+parent;
async function request(url,body){
 const response=await fetch(url,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
 if(!response.ok)throw Error('Firestore HTTP '+response.status);return response.json();
}
async function readAll(){const docs=[];let cursor;do{const r=await request(base+'/hopKnowledge?pageSize=300'+(cursor?'&pageToken='+encodeURIComponent(cursor):''));docs.push(...(r.documents??[]));cursor=r.nextPageToken;}while(cursor);return docs;}
const existing=await readAll(),plan=planFermentationImport(incoming,existing,prior);
plan.writes.forEach(w=>assertHopKnowledge(w.data,w.id));
const stamp=new Date().toISOString().replace(/[:.]/g,'-');
await writeFile(resolve(folder,'before-'+stamp+'.json'),JSON.stringify({project,documents:existing},null,2));
await writeFile(resolve(folder,'plan-'+stamp+'.json'),JSON.stringify({project,apply,...plan},null,2));
const result={project,apply,proposed:plan.writes.length,unchanged:plan.unchanged.length,preserved:plan.preserved.length,conflicts:plan.conflicts,committed:0,verified:0};
console.log(JSON.stringify({...result,conflicts:plan.conflicts.length}));
if(apply&&plan.conflicts.length)throw Error('Résoudre les conflits du plan avant tout écrit.');
if(apply){
 for(let offset=0;offset<plan.writes.length;offset+=200){
  const batch=plan.writes.slice(offset,offset+200);
  await request(base+':commit',{writes:batch.map(w=>({update:{name:parent+'/hopKnowledge/'+w.id,fields:encode(w.data).mapValue.fields},currentDocument:w.create?{exists:false}:{updateTime:w.updateTime}}))});
  result.committed+=batch.length;
  await writeFile(resolve(folder,'last-result.json'),JSON.stringify(result,null,2));
 }
 const after=await readAll(),actual=new Map(after.map(d=>[d.name.split('/').at(-1),decode({mapValue:{fields:d.fields}})]));
 for(const w of plan.writes){if(canonical(actual.get(w.id))!==canonical(w.data))throw Error('Relecture différente : '+w.id);result.verified++;}
 // Verify both idempotence and preservation of all unrelated remote documents.
 const changed=new Set(plan.writes.map(w=>w.id));
 for(const d of existing){const id=d.name.split('/').at(-1);if(!changed.has(id)&&canonical(actual.get(id))!==canonical(decode({mapValue:{fields:d.fields}})))throw Error('Document distant modifié pendant l’import : '+id);}
 const second=planFermentationImport(incoming,after,prior);
 if(second.writes.length||second.conflicts.length)throw Error('Import non idempotent ou révision concurrente.');
 result.totalGuides=[...actual.values()].filter(d=>d.kind==='fermentation').length;
 result.totalScience=[...actual.values()].filter(d=>d.kind==='fermentationScience').length;
 result.totalNoloScience=[...actual.values()].filter(d=>d.kind==='noloScience').length;
 result.totalStyleEntries=[...actual.values()].filter(d=>d.kind==='styleGuide').reduce((n,d)=>n+d.styles.length,0);
 result.totalCataloguedYeasts=[...actual.values()].filter(d=>d.kind==='yeast'&&d.catalogue).length;
 await writeFile(resolve(folder,'after-'+stamp+'.json'),JSON.stringify({project,documents:after},null,2));
}
await writeFile(resolve(folder,'last-result.json'),JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,conflicts:plan.conflicts.length}));
