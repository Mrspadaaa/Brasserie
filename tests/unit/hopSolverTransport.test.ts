import { describe, expect, it, vi } from 'vitest';
import { startHopSolverSearch } from '../../src/ui/hopIndex/hopSolverTransport';
import { guidePredictionKnowledge, guideSolverPolicy } from '../../src/ui/hopIndex/guideData';
import pack from '../../src/data/hopTrialBootstrap.json';
import type { HopSolverSearchOptions } from '../../src/domain/hopIndex/solver';
import type { HopVariety } from '../../functions/src/hopIndexSchema';
const input:HopSolverSearchOptions={data:{varieties:pack.hopVarieties.slice(0,1) as HopVariety[],lots:[],knowledge:guidePredictionKnowledge([])},policy:guideSolverPolicy([])!,
  intent:{styleId:'free',avoid:[],chemistry:{},keepYeast:false,timings:['postFermentation']},target:{}};
class FakeWorker {
  onmessage:any=null;onerror:any=null;onmessageerror:any=null;postMessage=vi.fn();terminate=vi.fn();
}
describe('Transport du solver local',()=>{
  it('arrête le worker et ignore ses réponses tardives',()=>{
    const worker=new FakeWorker(),publish=vi.fn(),error=vi.fn();
    const job=startHopSolverSearch(input,publish,error,()=>worker);
    const late=worker.onmessage;
    expect(worker.postMessage).toHaveBeenCalledWith(input);
    job.cancel();late({data:{kind:'update',update:{done:true}}});
    expect(worker.terminate).toHaveBeenCalledOnce();expect(publish).not.toHaveBeenCalled();expect(error).not.toHaveBeenCalled();
  });
  it('annule le repli avant tout calcul si aucun worker ne peut démarrer',async()=>{
    const publish=vi.fn();
    const job=startHopSolverSearch(input,publish,vi.fn(),()=>{throw Error('Worker indisponible');});
    job.cancel();await new Promise(r=>setTimeout(r,10));expect(publish).not.toHaveBeenCalled();
  });
  it('rend le repli progressif et annule son travail restant',async()=>{
    const updates:any[]=[];let job:ReturnType<typeof startHopSolverSearch>;
    await new Promise<void>((resolve,reject)=>{
      job=startHopSolverSearch(input,u=>{updates.push(u);if(u.results.length){job.cancel();resolve();}},reject,()=>{throw Error('Pas de Worker');});
    });
    const count=updates.length;await new Promise(r=>setTimeout(r,20));
    expect(updates.length).toBe(count);expect(updates.at(-1).examined).toBeGreaterThan(0);
  });
  it('libère le worker dès le résultat final',()=>{
    const worker=new FakeWorker(),publish=vi.fn();
    startHopSolverSearch(input,publish,vi.fn(),()=>worker);
    worker.onmessage({data:{kind:'update',update:{done:true}}});
    expect(publish).toHaveBeenCalledOnce();expect(worker.terminate).toHaveBeenCalledOnce();
  });
});
