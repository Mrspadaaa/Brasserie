import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../../functions/src/monthlyAiBudget',()=>({runWithMonthlyAiBudget:(model:string,body:any,generate:any)=>{state.monthlyModels.push(model);state.monthlyBodies.push(body);state.beforeMonthly?.();return generate(body);}}));
const state=vi.hoisted(()=>({docs:new Map<string,any>(),watchers:new Map<string,(snapshot:any)=>void>(),transactions:0,failAfter:0,transactionTail:Promise.resolve() as Promise<unknown>,monthlyModels:[] as string[],monthlyBodies:[] as any[],beforeMonthly:undefined as undefined|(()=>void),afterTransaction:undefined as undefined|((count:number)=>void)}));
function update(path:string,patch:any){const result=structuredClone(state.docs.get(path));for(const [key,value] of Object.entries(patch)){const parts=key.split('.');let target=result;for(const part of parts.slice(0,-1))target=target[part]??={};target[parts.at(-1)!]=structuredClone(value);}state.docs.set(path,result);}
function doc(path:string):any{return {path,get:async()=>({data:()=>structuredClone(state.docs.get(path))}),update:async(patch:any)=>update(path,patch),onSnapshot:(next:any)=>{state.watchers.set(path,next);next({data:()=>structuredClone(state.docs.get(path))});return ()=>state.watchers.delete(path);}};}
// Firestore transactions serialize conflicting reservations. The in-memory fake must do the same
// or parallel vision readers would observe a lost-update behavior that production does not have.
vi.mock('../../functions/node_modules/firebase-admin/lib/esm/firestore/index.js',()=>({getFirestore:()=>({doc,runTransaction:(fn:any)=>{const operation=state.transactionTail.then(async()=>{state.transactions++;const writes:Array<()=>void>=[];const result=await fn({get:(ref:any)=>ref.get(),set:(ref:any,value:any)=>writes.push(()=>state.docs.set(ref.path,structuredClone(value))),update:(ref:any,patch:any)=>writes.push(()=>update(ref.path,patch))});if(state.failAfter===state.transactions)throw Error('Storage unavailable');writes.forEach(write=>write());state.afterTransaction?.(state.transactions);return result;});state.transactionTail=operation.then(()=>undefined,()=>undefined);return operation;}})}));
import {runBudgetedInvoiceScan,RUNNING_STALE_MS} from '../../functions/src/invoiceScanBudget';
import {SCAN_MODEL,SCAN_MAX_OUTPUT,LITE_SCAN_MAX_OUTPUT} from '../../functions/src/invoiceScanCore';
import {GEMINI_LITE_MODEL,GEMINI_MODEL} from '../../functions/src/models';
import {quoteGeminiCost} from '../../functions/src/geminiCosts';
import {BrewerBudgetError} from '../../functions/src/brewerLimits';
import {GeminiApiError} from '../../functions/src/geminiErrors';
const file={mimeType:'image/jpeg',data:Buffer.from([255,216,255,217]).toString('base64')};
const request={contents:[{parts:[{text:'Test local'},{inlineData:file}]}]};
const signal=()=>new AbortController().signal;
const daily=()=>[...state.docs.entries()].find(([key])=>key.startsWith('brewerAiUsage/'))?.[1].usage;
beforeEach(()=>{state.docs.clear();state.watchers.clear();state.transactions=0;state.failAfter=0;state.transactionTail=Promise.resolve();state.monthlyModels=[];state.monthlyBodies=[];state.beforeMonthly=undefined;state.afterTransaction=undefined;state.docs.set('brewerAiControls/current',{paused:false});});
describe('Budget scan isolé, fournisseur simulé',()=>{
  it('réserve avant génération, partage le quota global, conserve les jobs du compagnon',async()=>{
    state.docs.set('brewerJobs/chat',{budget:{usage:{calls:7,tokens:321}}});
    const provider=vi.fn(async body=>{expect(daily().calls).toBe(1);expect(daily().tokens).toBeGreaterThan(65000);expect(body.generationConfig.maxOutputTokens).toBe(SCAN_MAX_OUTPUT);expect(body.generationConfig.mediaResolution).toBe('MEDIA_RESOLUTION_HIGH');return {usageMetadata:{totalTokenCount:100}};});
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
  // l2 (P8) : une lecture coupée n'est pas figée comme complète ; elle peut être relue UNE fois.
  describe('résultat dégradé (lecture coupée)',()=>{
    const ledgerOf=()=>[...state.docs.entries()].find(([path])=>path.startsWith('invoiceScans/'))![1];
    const provider=()=>vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    const options={degraded:(result:any)=>result.coupee===true};
    it('est marqué dégradé, relu une seule fois, puis servi tel quel',async()=>{
      const p=provider();
      const coupe=async(gen:any)=>{await gen(request,signal());return {coupee:true};};
      const first=await runBudgetedInvoiceScan('u',file,coupe,p,options);
      expect(first.cached).toBe(false);expect(ledgerOf().status).toBe('degraded');
      const second=await runBudgetedInvoiceScan('u',file,coupe,p,options);
      expect(second.cached).toBe(false);expect(p).toHaveBeenCalledTimes(2);expect(ledgerOf().status).toBe('completed');
      const third=await runBudgetedInvoiceScan('u',file,coupe,p,options);
      expect(third).toMatchObject({cached:true,result:{coupee:true}});expect(p).toHaveBeenCalledTimes(2);
    });
    it('la relecture qui réussit remplace le résultat dégradé',async()=>{
      const p=provider();
      await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {coupee:true};},p,options);
      const bon=await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {coupee:false,amount:42};},p,options);
      expect(bon).toMatchObject({cached:false,result:{amount:42}});expect(ledgerOf().status).toBe('completed');
      expect(await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {amount:0};},p,options)).toMatchObject({cached:true,result:{amount:42}});
    });
    it('un résultat complet n\'est jamais marqué dégradé',async()=>{
      const p=provider();
      await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {coupee:false};},p,options);
      expect(ledgerOf().status).toBe('completed');
    });
    // Relecture d'un résultat dégradé (relecture l2, point 4) : ce qui était servi n'est jamais perdu.
    const coupe=async(gen:any)=>{await gen(request,signal());return {coupee:true,lectures:1};};
    const degrade=async(p:any)=>{await runBudgetedInvoiceScan('u',file,coupe,p,options);expect(ledgerOf().status).toBe('degraded');};
    it('relecture en échec : le résultat dégradé reste servi, statut « degraded », jamais « completed », pas de troisième passe',async()=>{
      const p=provider();await degrade(p);
      const retry=await runBudgetedInvoiceScan('u',file,async()=>{throw new Error('panne');},p,options);
      expect(retry).toMatchObject({cached:true,result:{coupee:true,lectures:1}});
      expect(ledgerOf()).toMatchObject({status:'degraded',retried:true,result:{coupee:true}});
      const again=await runBudgetedInvoiceScan('u',file,coupe,p,options);
      expect(again).toMatchObject({cached:true,result:{coupee:true}});expect(p).toHaveBeenCalledTimes(1);
    });
    it('relecture bloquée par un plafond : résultat dégradé servi, retried:true gardé à travers « blocked »',async()=>{
      const p=provider();await degrade(p);
      state.docs.set('brewerAiControls/current',{limits:{dailyCalls:0}});
      const retry=await runBudgetedInvoiceScan('u',file,coupe,p,options);
      expect(retry).toMatchObject({cached:true,result:{coupee:true}});
      expect(ledgerOf()).toMatchObject({status:'degraded',retried:true});
      state.docs.set('brewerAiControls/current',{paused:false});
      expect(await runBudgetedInvoiceScan('u',file,coupe,p,options)).toMatchObject({cached:true});expect(p).toHaveBeenCalledTimes(1);
    });
    it('pause globale sur un résultat dégradé : servi sans erreur, sans consommer la relecture permise',async()=>{
      const p=provider();await degrade(p);
      state.docs.set('brewerAiControls/current',{paused:true});
      expect(await runBudgetedInvoiceScan('u',file,coupe,p,options)).toMatchObject({cached:true,result:{coupee:true}});
      expect(ledgerOf()).toMatchObject({status:'degraded',retried:false});
      state.docs.set('brewerAiControls/current',{paused:false});
      const bon=await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {coupee:false,lectures:2};},p,options);
      expect(bon).toMatchObject({cached:false,result:{lectures:2}});expect(ledgerOf().status).toBe('completed');
    });
    // Contre-vérification l2, détail B : une instance qui plante pendant la relecture laisse le document « running » ; passé un délai nommé,
    // le résultat dégradé qu'on servait l'est de nouveau, et une relecture reste possible. Un « running » récent répond toujours « déjà en cours ».
    const planter=(age:number)=>{
      const [path,doc]=[...state.docs.entries()].find(([key])=>key.startsWith('invoiceScans/'))!;
      state.docs.set(path,{uid:'u',fence:'planté',status:'running',calls:1,reservedTokens:1,createdAt:Date.now()-age,retried:true,previousResult:doc.result});
    };
    it('un « running » plus ancien que le délai, avec previousResult, sert le résultat dégradé et laisse la relecture possible',async()=>{
      const p=provider();await degrade(p);planter(RUNNING_STALE_MS+1000);
      const servi=await runBudgetedInvoiceScan('u',file,coupe,p,options);
      expect(servi).toMatchObject({cached:true,result:{coupee:true,lectures:1}});expect(p).toHaveBeenCalledTimes(1);
      expect(ledgerOf()).toMatchObject({status:'degraded',retried:false});
      const bon=await runBudgetedInvoiceScan('u',file,async gen=>{await gen(request,signal());return {coupee:false,lectures:2};},p,options);
      expect(bon).toMatchObject({cached:false,result:{lectures:2}});expect(ledgerOf().status).toBe('completed');
    });
    it('un « running » récent répond toujours « déjà en cours »',async()=>{
      const p=provider();await degrade(p);planter(1000);
      await expect(runBudgetedInvoiceScan('u',file,coupe,p,options)).rejects.toThrow('déjà en cours');expect(p).toHaveBeenCalledTimes(1);
      planter(RUNNING_STALE_MS-1000);
      await expect(runBudgetedInvoiceScan('u',file,coupe,p,options)).rejects.toThrow('déjà en cours');
    });
    it('deux envois simultanés sur un résultat dégradé : une seule relecture, un seul appel',async()=>{
      const p=provider();await degrade(p);
      const bon=async(gen:any)=>{await gen(request,signal());return {coupee:false};};
      const [a,b]=await Promise.allSettled([runBudgetedInvoiceScan('u',file,bon,p,options),runBudgetedInvoiceScan('u',file,bon,p,options)]);
      expect([a.status,b.status].sort()).toEqual(['fulfilled','rejected']);
      expect(p).toHaveBeenCalledTimes(2);
    });
  });
});

// Voie fn-csv8 (D247) : le modèle se décide PAR APPEL. Deux Flash-Lite (8 192 jetons) puis la 3.8 (8 192 depuis le 02.11, D325) partagent le même registre de trois lectures.
describe('Budget scan : un modèle par appel (C★v8)',()=>{
  const config=(max:number)=>({...request,generationConfig:{maxOutputTokens:max}});
  it('sans modèle donné, l\'appel reste celui de la 3.8 (comportement d\'avant)',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    await runBudgetedInvoiceScan('u',file,async gen=>{await gen(config(5100),signal());},provider);
    expect(state.monthlyModels).toEqual([GEMINI_MODEL]);expect(provider.mock.calls[0][2]).toBe(GEMINI_MODEL);
  });
  it('chaque appel est réservé, envoyé et réglé au modèle demandé',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    await runBudgetedInvoiceScan('u',file,async gen=>{await Promise.all([gen(config(8192),signal(),GEMINI_LITE_MODEL),gen(config(8192),signal(),GEMINI_LITE_MODEL)]);await gen(config(5100),signal(),SCAN_MODEL);},provider);
    expect(state.monthlyModels).toEqual([GEMINI_LITE_MODEL,GEMINI_LITE_MODEL,SCAN_MODEL]);
    expect(provider.mock.calls.map(call=>call[2])).toEqual([GEMINI_LITE_MODEL,GEMINI_LITE_MODEL,SCAN_MODEL]);
    const ledger=[...state.docs.entries()].find(([path])=>path.startsWith('invoiceScans/'))![1];
    expect(ledger.calls).toBe(3);expect(Object.values(ledger.reservations).every((r:any)=>r.status==='completed')).toBe(true);
  });
  it('le plafond de sortie suit le modèle : 8 192 pour la Flash-Lite, 8 192 pour la 3.8 (D325), jamais plus',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    await runBudgetedInvoiceScan('u',file,async gen=>{
      await gen(config(8192),signal(),GEMINI_LITE_MODEL);await gen(config(20000),signal(),SCAN_MODEL);await gen(config(20000),signal(),GEMINI_LITE_MODEL);
    },provider);
    expect(provider.mock.calls.map((call:any)=>call[0].generationConfig.maxOutputTokens)).toEqual([LITE_SCAN_MAX_OUTPUT,SCAN_MAX_OUTPUT,LITE_SCAN_MAX_OUTPUT]);
    expect([LITE_SCAN_MAX_OUTPUT,SCAN_MAX_OUTPUT]).toEqual([8192,8192]);
  });
  it('le coût réservé est celui du modèle de l\'appel : une Flash-Lite coûte moins cher que la 3.8, à plafond de sortie plus haut',async()=>{
    const provider=vi.fn(async()=>({usageMetadata:{totalTokenCount:10}}));
    await runBudgetedInvoiceScan('u',file,async gen=>{await gen(config(8192),signal(),GEMINI_LITE_MODEL);await gen(config(5100),signal(),SCAN_MODEL);},provider);
    const [lite,strong]=state.monthlyModels.map((model,index)=>quoteGeminiCost(model,state.monthlyBodies[index]));
    expect([lite.model,strong.model]).toEqual([GEMINI_LITE_MODEL,GEMINI_MODEL]);
    expect([lite.outputTokens,strong.outputTokens]).toEqual([8192,5100]);
    expect(lite.reservedMicroChf).toBeLessThan(strong.reservedMicroChf);
    // Contrôle contre la tarification de la 3.8 appliquée par erreur à la Flash-Lite : le même corps coûte plus au tarif 3.8.
    expect(quoteGeminiCost(GEMINI_MODEL,state.monthlyBodies[0]).reservedMicroChf).toBeGreaterThan(lite.reservedMicroChf);
  });
  it('un modèle hors liste blanche est refusé avant toute réservation',async()=>{
    const provider=vi.fn();
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(config(5100),signal(),'gemini-3.1-pro-preview'),provider)).rejects.toThrow('Modèle Gemini refusé');
    expect(provider).not.toHaveBeenCalled();expect(state.monthlyModels).toEqual([]);expect(daily()).toBeUndefined();
  });
  it('une pause globale arrête aussi la Flash-Lite : aucun appel',async()=>{
    const provider=vi.fn();state.docs.set('brewerAiControls/current',{paused:true});
    await expect(runBudgetedInvoiceScan('u',file,gen=>gen(config(8192),signal(),GEMINI_LITE_MODEL),provider)).rejects.toThrow('suspendue');
    expect(provider).not.toHaveBeenCalled();
  });
});
