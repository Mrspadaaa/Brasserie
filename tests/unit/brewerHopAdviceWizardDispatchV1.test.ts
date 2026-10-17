import {beforeEach,describe,expect,it,vi} from 'vitest';
import {hopAdviceContentReference} from '../../src/domain/hopDecision/adviceContentReference';
import {prepareBrewingScenarioContext} from '../../src/domain/brewingScenarioContext';
import {createBrewerHopAdviceWizardSourceV1,mapBrewerHopAdviceWizardSourceToScopeV1} from '../../functions/src/brewerHopAdviceWizardSourceV1.js';
import {createHopV55DecisionReadingArchiveV4,createHopV55DecisionReadingArchiveV4ForWizardV1,readHopV55QuestionSemanticV1} from '../../src/services/hopV55/brewerHopAdviceSemanticSource4';
import {projectBrewerHopAdviceContext,createBrewerHopAdviceContextLaunchForWizardV1} from '../../functions/src/brewerHopAdviceContextBinding.js';
import {createBrewerHopAdviceRequestV3,createBrewerHopAdviceRequestV3ForWizardV1} from '../../functions/src/brewerHopAdviceSemanticV3.js';
import {buildHopAdviceV1WireV3,buildHopAdviceV1WireV3ForWizardV1,HOP_ADVICE_PROTOCOL_V1,HOP_ADVICE_V1_COLLECTIONS} from '../../functions/src/brewerHopAdviceTransportV1.js';
import {hopAdviceV1InputDigestForWizardV1} from '../../functions/src/brewerHopAdviceLaneV1.js';
import {BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6,readBrewerHopAdviceProposalEnvelopeV6,readBrewerHopAdviceProposalEnvelopeV6ForWizardV1} from '../../functions/src/brewerHopAdviceSemanticV6.js';

// Explicit in-memory Firebase double. No Auth/Firestore/TaskQueue native service or paid model.
// Actual exported handler bodies, loader, parsers, semantic profiles and harness are exercised.
const state=vi.hoisted(()=>({
  docs:new Map<string,any>(),reads:[] as string[],writes:[] as string[],queue:[] as any[],
  generated:[] as any[],db:null as any,
}));
const clone=<T,>(value:T):T=>value===undefined?value:structuredClone(value);
function snapshot(path:string){
  state.reads.push(path);
  return {id:path.split('/').pop(),exists:state.docs.has(path),ref:ref(path),data:()=>clone(state.docs.get(path))};
}
function set(path:string,value:any,merge=false){
  const next=merge?{...state.docs.get(path),...clone(value)}:clone(value);
  for(const key of Object.keys(next))if(next[key]==='__fixture_delete__')delete next[key];
  state.docs.set(path,next);state.writes.push(path);
}
function ref(path:string):any{return{
  path,id:path.split('/').pop(),get:async()=>snapshot(path),
  update:async(value:any)=>set(path,value,true),set:async(value:any)=>set(path,value),
  create:async(value:any)=>{if(state.docs.has(path))throw Error('fixture duplicate create');set(path,value);},
  delete:async()=>{state.docs.delete(path);state.writes.push(path);},
};}
function query(collection:string,filters:any[]=[],limit=Infinity):any{return{
  where:(key:string,op:string,value:any)=>query(collection,[...filters,[key,op,value]],limit),
  limit:(n:number)=>query(collection,filters,n),orderBy:()=>query(collection,filters,limit),
  doc:(id:string)=>ref(collection+'/'+id),
  get:async()=>{
    const docs=[...state.docs.keys()].filter(p=>p.startsWith(collection+'/')&&!p.slice(collection.length+1).includes('/'))
      .filter(p=>filters.every(([key,op,v])=>op==='in'?v.includes(state.docs.get(p)[key]):state.docs.get(p)[key]===v))
      .slice(0,limit).map(p=>snapshot(p));
    return {docs,size:docs.length,empty:!docs.length};
  },
};}
// Firebase SDKs live only in functions/node_modules: mock the files functions/src resolves, as the other server tests do.
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js',()=>({
  getFirestore:()=>state.db,FieldValue:{delete:()=> '__fixture_delete__',serverTimestamp:()=>1700000000000},
}));
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/functions/index.js',()=>({getFunctions:()=>({taskQueue:()=>({enqueue:async(...a:any[])=>{state.queue.push(a);}})})}));
vi.mock('../../functions/node_modules/firebase-functions/lib/v2/providers/https.js',()=>({
  onCall:(_options:any,callback:any)=>callback,
  HttpsError:class extends Error{constructor(public code:string,message:string,public details?:any){super(message);}},
}));
vi.mock('../../functions/node_modules/firebase-functions/lib/v2/providers/firestore.js',()=>({onDocumentCreated:(_options:any,callback:any)=>callback}));
vi.mock('../../functions/node_modules/firebase-functions/lib/v2/providers/tasks.js',()=>({onTaskDispatched:(_options:any,callback:any)=>callback}));
vi.mock('../../functions/node_modules/firebase-functions/lib/v2/index.js',()=>({logger:{info:vi.fn(),warn:vi.fn(),error:vi.fn()}}));
vi.mock('../../functions/src/brewSession.js',()=>({requireBrewer:(request:any)=>{
  if(!request.auth?.uid)throw Error('fixture authentication missing');return request.auth.uid;
}}));
vi.mock('../../functions/src/ai.js',()=>({GEMINI_API_KEY:{value:()=> 'FIXTURE-NO-REAL-KEY'}}));
vi.mock('../../functions/src/brewerStockContext.js',()=>({readBrewerStockSnapshot:async()=>({stock:{docs:[]},stockReservations:undefined,batchDoc:null})}));
vi.mock('../../functions/src/brewerCatalogueJob.js',()=>({createBrewerCatalogueForJob:()=>({readReceipts:async()=>[],write:()=>{throw Error('fixture no catalogue writer');}})}));
vi.mock('../../functions/src/brewerScenarioJob.js',()=>({createBrewerScenarioForJob:()=>({write:()=>{throw Error('fixture no scenario writer');}})}));
vi.mock('../../functions/src/brewerBudget.js',()=>({budgetedBrewerTransport:(transport:any)=>({...transport,close:()=>{}})}));
vi.mock('../../functions/src/brewerHarness.js',async(importOriginal)=>{
  const actual:any=await importOriginal();
  return {...actual,geminiTransport:()=>({generate:async(model:string,body:any)=>{
    state.generated.push({model,body:clone(body)});
    return body.generationConfig?.responseMimeType==='application/json'
      ?{candidates:[{content:{role:'model',parts:[{text:JSON.stringify({approved:true,proposalApproved:true,issues:[]})}]}}]}
      :{candidates:[{content:{role:'model',parts:[{functionCall:{name:BREWER_HOP_ADVICE_SEMANTIC_FINISH_TOOL_V6,args:finish}}]}}]};
  }})};
});
import {askBrewerHopAdviceV1,retryBrewerHopAdviceQuestionV1,dispatchBrewerHopAdviceV1} from '../../functions/src/brewerHopAdviceJobsV1.js';
import {processBrewerHopAdviceV1} from '../../functions/src/brewerJobs.js';
import {loadBrewerContext} from '../../functions/src/brewerChat.js';

const OWNER='owner-dispatch-87',DRAFT='recipe-dispatch-87',WS='workspace-dispatch-87';
const QUESTION='Je veux plus d’arôme agrume dans cette bière.';
const draft={id:DRAFT,name:'Brouillon B',style:'',volumeL:20,ogTarget:null,abvTarget:null,malts:[],hops:[]};
const finish={
  annotationReviews:[],propertyIntentProposals:[],semanticRevisionProposals:[],openQuestions:[],materials:[],
  answer:{summary:'Lecture du brouillon sans calcul.',readingNote:'Fixture de transport explicite.',
    options:[{id:'assist-option-1',kind:'investigation',title:'Préciser la cible',rationale:'Hypothèse non calculée.',
      conditions:[],tradeoffs:[],relatedIds:[],evidenceIds:[]}],
    unknowns:[],program:{kind:'none',note:'Aucun programme préparé.'},refusals:[]},optionProposalLinks:[],
};
const callable=(handler:any,data:any,uid=OWNER)=>handler({auth:{uid},data});
const jobPath=(id:string)=>HOP_ADVICE_V1_COLLECTIONS.jobs+'/'+id;
async function fixture(wizard=true){
  const origin={ownerKey:OWNER,workspaceId:WS,draftId:DRAFT};
  const canonical={recipe:clone(draft),reference:hopAdviceContentReference('hop-v55-recipe-step-draft-context-v1',{ownerKey:OWNER,draftId:DRAFT,recipe:draft})};
  const source=wizard?createBrewerHopAdviceWizardSourceV1({origin,snapshot:canonical}):{kind:'recipe' as const,id:DRAFT};
  const scope=wizard?mapBrewerHopAdviceWizardSourceToScopeV1(source as any):{kind:'recipe' as const,id:DRAFT};
  // Same loader and same data stores as the worker. No better-filled context side argument.
  const context=await loadBrewerContext({scope,draft:canonical.recipe,question:QUESTION,operationId:'fixture-context-87',mode:'auto',phase:'draft'});
  const prepared=prepareBrewingScenarioContext(context),reading=readHopV55QuestionSemanticV1(QUESTION,prepared);
  const archiveInput={
    id:'reading-dispatch-87',ownerKey:OWNER,workspaceId:WS,recordedAt:'2026-10-05T12:00:00.000Z',
    reading,runtimeReference:'runtime-dispatch-87',
  };
  const archive=source.kind==='wizardDraft'
    ?createHopV55DecisionReadingArchiveV4ForWizardV1({...archiveInput,source})
    :createHopV55DecisionReadingArchiveV4({...archiveInput,source});
  const projected=projectBrewerHopAdviceContext({scope,context,runtime:prepared.runtime});
  if(projected.status!=='ready')throw Error(projected.reason);
  const launch=wizard?createBrewerHopAdviceContextLaunchForWizardV1({
    source:source as any,snapshot:canonical,sourceReadingReference:archive.contentReference,
    sourceRuntimeReference:archive.runtimeReference,expected:projected.projection,
  }):{format:'brewer-hop-advice-context-launch-v1' as const,ownerKey:OWNER,workspaceId:WS,source,
    sourceReadingReference:archive.contentReference,sourceRuntimeReference:archive.runtimeReference,scope,expected:projected.projection};
  const request=wizard?createBrewerHopAdviceRequestV3ForWizardV1({sourceArchive:archive,contextLaunch:launch,snapshot:canonical})
    :createBrewerHopAdviceRequestV3({sourceArchive:archive,contextLaunch:launch});
  const entry={operationId:'operation-dispatch-87-0001',question:request.question,scope,analysisMode:'auto' as const,phase:'draft',hopAdvice:request};
  const wire=wizard?buildHopAdviceV1WireV3ForWizardV1({...entry,draft:canonical.recipe} as any):buildHopAdviceV1WireV3(entry as any);
  state.reads=[];state.writes=[];return {wire,canonical,request};
}
beforeEach(()=>{
  state.docs.clear();state.reads=[];state.writes=[];state.queue=[];state.generated=[];
  // Saved A deliberately has IDENTICAL normalized content to B: content checks cannot prove origin I/O.
  state.docs.set('recipes/'+DRAFT,clone(draft));state.docs.set('config/app',{});
  state.db={doc:ref,collection:query,runTransaction:async(callback:any)=>callback({
    get:async(r:any)=>r.get(),create:(r:any,v:any)=>{if(state.docs.has(r.path))throw Error('duplicate');set(r.path,v);},
    set:(r:any,v:any)=>set(r.path,v),update:(r:any,v:any)=>set(r.path,v,true),delete:(r:any)=>state.docs.delete(r.path),
  })};
});
async function dispatch(id:string){
  await (dispatchBrewerHopAdviceV1 as any)({params:{jobId:id},data:{data:()=>clone(state.docs.get(jobPath(id))),ref:ref(jobPath(id))}});
}
describe('Wizard87 callbacks effectifs — doubles mémoire et Generate simulé, pas preuve native',()=>{
  it('émet puis relance la Request Wizard exacte et traite son wire sans lire RecipeA même contenu',async()=>{
    const f=await fixture(),receipt=await callable(askBrewerHopAdviceV1,f.wire),id=receipt.job.id;
    const initial=clone(state.docs.get(jobPath(id)));
    expect(initial.wireInput).toEqual(f.wire);
    await dispatch(id);expect(state.queue).toHaveLength(1);
    // Source failed-but-intact, as required by the existing retry contract.
    state.docs.get(jobPath(id)).status='error';
    const retry=await callable(retryBrewerHopAdviceQuestionV1,{jobId:id,operationId:'operation-dispatch-retry-87',scope:f.wire.scope,generation:0});
    const nextId=retry.job.id,next=state.docs.get(jobPath(nextId));
    expect(next.retryOf).toBe(id);
    expect({...next.wireInput,operationId:f.wire.operationId}).toEqual({...f.wire,generation:0});
    await dispatch(nextId);
    await (processBrewerHopAdviceV1 as any)({data:{jobId:nextId}});
    expect(state.docs.get(jobPath(nextId)).status).toBe('done');
    expect(state.generated.length).toBeGreaterThan(0);
    const turn=state.docs.get(HOP_ADVICE_V1_COLLECTIONS.chats+'/'+nextId);
    expect(readBrewerHopAdviceProposalEnvelopeV6ForWizardV1(turn.hopAdviceProposal).status).toBe('readOnly');
    expect(readBrewerHopAdviceProposalEnvelopeV6(turn.hopAdviceProposal).status).toBe('invalid');
    expect(state.reads.filter(p=>p.startsWith('recipes/'))).toEqual([]);
    expect(state.writes.filter(p=>!p.startsWith('brewerHopAdvice'))).toEqual([]);
  });
  it('préserve le callback classique Request3 et sa vraie lecture Recipe',async()=>{
    const f=await fixture(false),receipt=await callable(askBrewerHopAdviceV1,f.wire);
    await (processBrewerHopAdviceV1 as any)({data:{jobId:receipt.job.id}});
    expect(state.docs.get(jobPath(receipt.job.id)).status).toBe('done');
    const turn=state.docs.get(HOP_ADVICE_V1_COLLECTIONS.chats+'/'+receipt.job.id);
    expect(readBrewerHopAdviceProposalEnvelopeV6(turn.hopAdviceProposal).status).toBe('readOnly');
    expect(state.reads).toContain('recipes/'+DRAFT);
  });
  it('refuse owner, scope ou draft substitué à admission avant écriture/queue/Generate',async()=>{
    const f=await fixture();
    for(const raw of [
      {...clone(f.wire),scope:{kind:'recipe',id:DRAFT}},
      {...clone(f.wire),draft:{...draft,name:'Substitution'}},
    ])await expect(callable(askBrewerHopAdviceV1,raw)).rejects.toThrow();
    await expect(callable(askBrewerHopAdviceV1,f.wire,'owner-other-87')).rejects.toThrow();
    expect(state.writes).toEqual([]);expect(state.queue).toEqual([]);expect(state.generated).toEqual([]);
  });
  it('un digest recalculé ne permet ni retry ni traitement d’un job au draft altéré',async()=>{
    const f=await fixture(),receipt=await callable(askBrewerHopAdviceV1,f.wire),id=receipt.job.id;
    const job=state.docs.get(jobPath(id));
    job.wireInput.draft.name='Altéré';
    // Digest formula alone is deliberately re-sealed, not a validation proof.
    job.inputDigest=hopAdviceV1InputDigestForWizardV1(job.wireInput);
    job.status='error';state.writes=[];
    await expect(callable(retryBrewerHopAdviceQuestionV1,{jobId:id,operationId:'operation-retry-corrupt-87',scope:f.wire.scope,generation:0})).rejects.toThrow();
    job.status='queued';state.generated=[];
    await (processBrewerHopAdviceV1 as any)({data:{jobId:id}});
    expect(state.docs.get(jobPath(id)).status).toBe('error');
    expect(state.docs.get(jobPath(id)).error.code).toBe('invalid-protocol');
    expect(state.generated).toEqual([]);expect(state.queue).toEqual([]);
  });
});
