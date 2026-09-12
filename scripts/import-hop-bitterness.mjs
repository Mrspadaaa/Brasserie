// One knowledge document only. Explicit project, dry-run by default, create-only.
// Existing custom revisions are preserved; no recipe, stock or AI operation.
import {createRequire} from 'node:module';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {assertHopKnowledge} from '../functions/lib/hopPredictionSchema.js';
import {encode,decode} from './yeast-catalogue/import-plan.mjs';
import {canonical} from './fermentation-science/import-plan.mjs';
const project=process.argv.find(a=>a.startsWith('--project='))?.slice(10),apply=process.argv.includes('--apply');
if(!project||!/^[-a-z0-9]+$/.test(project))throw Error('Explicit --project required.');
const rows=JSON.parse(await readFile('src/data/hopBitternessBootstrap.json','utf8'));
if(rows.length!==1)throw Error('Exactly one reviewed reference expected.');
const row=rows[0];assertHopKnowledge(row,row.id);
const require=createRequire(import.meta.url),auth=require('firebase-tools/lib/auth.js');
const account=auth.getProjectDefaultAccount(process.cwd());if(!account)throw Error('Firebase CLI sign-in required.');
const token=await auth.getAccessToken(account.tokens.refresh_token,['https://www.googleapis.com/auth/cloud-platform']);
const parent=`projects/${project}/databases/(default)/documents`,name=parent+'/hopKnowledge/'+row.id,base='https://firestore.googleapis.com/v1/';
const headers={Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'};
const read=async()=>{const r=await fetch(base+name,{headers});if(r.status===404)return null;if(!r.ok)throw Error('Read HTTP '+r.status);return r.json();};
const previous=await read(),out=resolve('.codex-remote-attachments/water-hops-validation');await mkdir(out,{recursive:true});
await writeFile(resolve(out,'bitterness-before.json'),JSON.stringify({project,document:previous},null,2));
const result={project,apply,created:false,preserved:!!previous,verified:false,id:row.id};
if(!previous&&apply){
  const r=await fetch(base+parent+':commit',{method:'POST',headers,body:JSON.stringify({writes:[{update:{name,fields:encode(row).mapValue.fields},currentDocument:{exists:false}}]})});
  if(!r.ok)throw Error('Create HTTP '+r.status+'; no existing document overwritten.');result.created=true;
}
if(apply){const after=await read();result.verified=!!after&&canonical(decode({mapValue:{fields:after.fields}}))===canonical(previous?decode({mapValue:{fields:previous.fields}}):row);if(!result.verified)throw Error('Re-read differs.');}
await writeFile(resolve(out,'bitterness-import.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
