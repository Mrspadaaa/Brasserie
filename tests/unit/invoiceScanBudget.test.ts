import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../../functions/src/monthlyAiBudget',()=>({runWithMonthlyAiBudget:(model:string,body:any,generate:any)=>{state.monthlyModels.push(model);state.beforeMonthly?.();return generate(body);}}));
const state=vi.hoisted(()=>({docs:new Map<string,any>(),watchers:new Map<string,(snapshot:any)=>void>(),transactions:0,failAfter:0,transactionTail:Promise.resolve() as Promise<unknown>,monthlyModels:[] as string[],beforeMonthly:undefined as undefined|(()=>void),afterTransaction:undefined as undefined|((count:number)=>void)}));
function update(path:string,patch:any){const result=structuredClone(state.docs.get(path));for(const [key,value] of Object.entries(patch)){const parts=key.split('.');let target=result;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)!]=structuredClone(value);}state.docs.set(path,result);}
function doc(path:string):any{return {path,get:async()=>({data:()=>structuredClone(state.docs.get(path))}),update:async(patch:any)=>update(path,patch),onSnapshot:(next:any)=>{state.watchers.set(path,next);next({data:()=>structuredClone(state.docs.get(path))});return ()=>state.watchers.delete(path);}};}
// Firestore transactions serialize conflicting reservations. The in-memory fake must do the same
// or parallel vision readers would observe a lost-update behavior that production does not have.
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js',()=>({getFirestore:()=>({doc,runTransaction:(fn:any)=>{const operation=state.transactionTail.then(async()=>{state.transactions++;const writes:Array<()=>void>=[];const result=await fn({get:(ref:any)=>ref.get(),set:(ref:any,value:any)=>writes.push(()=>state.docs.set(ref.path,structuredClone(value))),update:(ref:any,patch:any)=>writes.push(()=>update(ref.path,patch))});if(state.failAfter===state.transactions)throw Error('Storage unavailable');writes.forEach(write=>write());state.afterTransaction?.(state.transactions);return result;});state.transactionTail=operation.then(()=>undefined,()=>undefined);return operation;}})}));
import {runBudgetedInvoiceScan} from '../../functions/src/invoiceScanBudget';
import {SCAN_MODEL} from '../../functions/src/invoiceScanCore';
import {BrewerBudgetError} from '../../functions/src/brewerLimits';
import {GeminiApiError} from '../../functions/src/geminiErrors';
const file={mimeType:'image/jpeg',data:Buffer.from([255,216,255,217]).toString('base64')};
const request={contents:[{parts:[{text:'Test local'},{inlineData:file}]}]};
const signal=()=>new AbortController().signal;
const daily=()=>[...state.docs.entries()].find(([key])=>key.startsWith('brewerAiUsage/'))?.[1].usage;
beforeEach(()=>{state.docs.clear();state.watchers.clear();state.transactions=0;state.failAfter=0;state.transactionTail=Promise.resolve();state.monthlyModels=[];state.beforeMonthly=undefined;state.afterTransaction=undefined;state.docs.set('brewerAiControls/current',{paused:false});});
describe('Budget scan isolé, fournisseur simulé',()=>{
  it('réserve avant génération, partage le quota global, conserve les jobs du compagnon',async()=>{
    state.docs.set('brewerJobs/chat',{budget:{usage:{calls:7,tokens:321}}});
    const provider=vi.fn(async body=>{expect(daily().calls).toBe(1);expect(daily().tokens).toBeGreaterThan(65000);expect(body.generationConfig.maxOutputTokens).toBe(4500);expect(body.generationConfig.mediaResolution).toBe('MEDIA_RESOLUTION_HIGH');return {usageMetadata:{totalTokenCount:100}};});
    await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {amount:42};},provider);
    expect(daily()).toEqual({calls:1,proCalls:0,tokens:100});expect(state.docs.get('brewerJobs/chat')).toEqual({budget:{usage:{calls:7,tokens:321}}});expect(state.monthlyModels).toEqual([SCAN_MODEL]);expect(SCAN_MODEL).toBe('gemini-3.8-flash');
  });
  it('sert le cache sans nouvel appel même après pause',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    const work=async(gen:any)=>{await gen(request,signal());return {amount:10};};
    await runBudgetedInvoiceScan('u',file,work,provider);state.docs.set('brewerAiControls/current',{paused:true});
    expect(await runBudgetedInvoiceScan('u',file,work,provider)).toMatchObject({cached:true,result:{amount:10}});expect(provider).toHaveBeenCalledOnce();expect(state.monthlyModels).toHaveLength(1);
  });
  it('refuse pause et budget zéro sans appel',async()=>{
    const provider=vi.fn();state.docs.set('brewerAiControls/current',{paused:true});
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toThrow('suspendue');expect(provider).not.toHaveBeenCalled();
    state.docs.set('brewerAiControls/current',{limits:{dailyCalls:0}});
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toThrow('Plafond');expect(provider).not.toHaveBeenCalled();
  });
  it('borne le document à trois générations sans quatrième appel',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:15}}));
    await expect(runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());await gen(request,signal());await gen(request,signal());return gen(request,signal());},provider)).rejects.toThrow('trois');
    expect(provider).toHaveBeenCalledTimes(3);
  });
  it('un échec réseau ne réessaie pas et conserve la réservation',async()=>{
    const provider=vi.fn().mockRejectedValue(Error('timeout'));
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toThrow('timeout');
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toThrow('déjà');
    expect(provider).toHaveBeenCalledOnce();expect(daily().tokens).toBeGreaterThan(65000);
  });
  it('un document simultané est refusé avant un second appel',async()=>{
    let release!:(value:any)=>void;const provider=vi.fn(()=>new Promise(resolve=>{release=resolve;}));
    const first=runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider);
    await vi.waitFor(()=>expect(provider).toHaveBeenCalledOnce());
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toThrow('en cours');
    release({usageMetadata:{totalTokenCount:3}});await first;expect(provider).toHaveBeenCalledOnce();
  });

  it('réserve deux lectures parallèles et comptabilise leur usage réel sans mise à jour perdue',async()=>{
    let release!:()=>void;
    const gate=new Promise<void>(resolve=>{release=resolve;});
    const provider=vi.fn(async()=>{await gate;return {usageMetadata:{totalTokenCount:100}};});
    const scan=runBudgetedInvoiceScan('u',file,gen=>Promise.all([gen(request,signal()),gen(request,signal())]),provider);
    await vi.waitFor(()=>expect(provider).toHaveBeenCalledTimes(2));
    expect(daily().calls).toBe(2);expect(daily().tokens).toBeGreaterThan(130000);
    release();await scan;
    expect(daily()).toEqual({calls:2,proCalls:0,tokens:200});
    const ledger=[...state.docs.entries()].find(([path])=>path.startsWith('invoiceScans/'))![1];
    expect(ledger.calls).toBe(2);expect(Object.values(ledger.reservations)).toHaveLength(2);
    expect(Object.values(ledger.reservations).every((reservation:any)=>reservation.status==='completed'&&reservation.charged===100)).toBe(true);
  });

  it('un signal déjà expiré empêche toute réservation payante',async()=>{
    const abort=new AbortController();abort.abort(Error('Lecture expirée'));
    const provider=vi.fn();
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,abort.signal),provider)).rejects.toThrow('Lecture expirée');
    expect(provider).not.toHaveBeenCalled();expect(state.monthlyModels).toEqual([]);expect(daily()).toBeUndefined();
  });

  it('revérifie le signal immédiatement après la réservation quotidienne',async()=>{
    const abort=new AbortController();
    state.afterTransaction=count=>{if(count===2)abort.abort(Error('Lecture annulée'));};
    const provider=vi.fn();
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,abort.signal),provider)).rejects.toThrow('Lecture annulée');
    expect(provider).not.toHaveBeenCalled();expect(state.monthlyModels).toEqual([]);expect(daily()).toEqual({calls:1,proCalls:0,tokens:0});
  });

  it('revérifie le signal avant le fournisseur même si la réservation mensuelle a commencé',async()=>{
    const abort=new AbortController();state.beforeMonthly=()=>abort.abort(Error('Délai écoulé'));
    const provider=vi.fn();
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,abort.signal),provider)).rejects.toThrow('Délai écoulé');
    expect(provider).not.toHaveBeenCalled();expect(state.monthlyModels).toHaveLength(1);expect(daily()).toEqual({calls:1,proCalls:0,tokens:0});
  });

  it('libère les tokens quotidiens après un rejet certain 429 en conservant le compteur de tentative',async()=>{
    const provider=vi.fn(async()=>{throw new GeminiApiError(429,SCAN_MODEL,'rate-limit');});
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toBeInstanceOf(GeminiApiError);
    expect(provider).toHaveBeenCalledOnce();expect(daily()).toEqual({calls:1,proCalls:0,tokens:0});
  });

  it('libère les tokens quotidiens si la pause refuse la réservation mensuelle',async()=>{
    state.beforeMonthly=()=>{throw new BrewerBudgetError('ai-paused','IA suspendue');};
    const provider=vi.fn();
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).rejects.toMatchObject({code:'ai-paused'});
    expect(provider).not.toHaveBeenCalled();expect(daily()).toEqual({calls:1,proCalls:0,tokens:0});
  });

  it('une pause reste prioritaire quand le travail avale l’erreur de la lecture complémentaire',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    await expect(runBudgetedInvoiceScan('u',file,async gen=>{
      await gen(request,signal());
      state.docs.set('brewerAiControls/current',{paused:true});
      state.watchers.get('brewerAiControls/current')!({data:()=>({paused:true})});
      try {await gen(request,signal());} catch {/* Same deliberate partial-result recovery as the vision handler. */}
      return {amount:10};
    },provider)).rejects.toThrow('suspendue');
    expect(provider).toHaveBeenCalledOnce();
    const ledger=[...state.docs.entries()].find(([path])=>path.startsWith('invoiceScans/'))![1];
    expect(ledger.status).toBe('failed');expect(ledger.result).toBeUndefined();
  });

  it('libère les tokens lorsque le fournisseur confirme explicitement une consommation nulle',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:0}}));
    await runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider);
    expect(daily()).toEqual({calls:1,proCalls:0,tokens:0});
    expect(provider).toHaveBeenCalledOnce();
  });

  it('préserve la réservation si la mise à jour de consommation échoue après le fournisseur',async()=>{
    state.failAfter=3;
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(request,signal()),provider)).resolves.toMatchObject({cached:false});
    expect(provider).toHaveBeenCalledOnce();expect(daily().tokens).toBeGreaterThan(65000);
    const ledger=[...state.docs.entries()].find(([path])=>path.startsWith('invoiceScans/'))![1];
    expect(Object.values(ledger.reservations).map((reservation:any)=>reservation.status)).toEqual(['reserved']);
  });
});
