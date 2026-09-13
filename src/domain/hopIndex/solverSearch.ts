import { createHopSolverSearch, retainHopSolverCandidate, compareHopSolverCandidates, type HopSolverCandidate, type HopSolverSearchOptions } from './solver';
import type { HopSearchCoverage } from './solverSelection';

export type HopSearchUpdate = {
  coverage: HopSearchCoverage; examined: number; elapsedMs: number; done: boolean; results: HopSolverCandidate[];
};
export const hopCandidateConflicts = (c: HopSolverCandidate) => [...c.checks,...c.recipeChecks].some(k=>k.status==='conflict');

/** CPU only. No Firebase, network, persistence or AI imports in this entry.
 * The time budget also keeps the fallback responsive when Workers are unavailable. */
export async function runHopSolverSearch(input: HopSolverSearchOptions, publish:(u:HopSearchUpdate)=>void, cancelled:()=>boolean) {
  if(cancelled())return;
  const start=performance.now(),engine=createHopSolverSearch(input);
  if(engine.emptyReason)throw Error(engine.emptyReason);
  if(!engine.total)throw Error('Choisis au moins un moment d’ajout.');
  const buckets:HopSolverCandidate[][]=[[],[],[],[]];
  const names=new Map(input.data.varieties.map(v=>[v.id,v.name]));
  const keys=new WeakMap<HopSolverCandidate,string>();
  const key=(c:HopSolverCandidate)=>{
    let k=keys.get(c);
    // Keep the best evaluated timing / dose for each variety–yeast pairing,
    // leaving room for other varieties in the comparison. Published programmes
    // retain their identity even when they use the same hops and yeast.
    if(k===undefined){k=c.trial?.id??JSON.stringify(c.triplets.map(t=>[names.get(t.varietyId??''),t.yeastId]));keys.set(c,k);}
    return k;
  };
  let examined=0,nextPublish=0;
  publish({coverage:engine.coverage,examined:0,elapsedMs:performance.now()-start,done:false,results:[]});
  while(examined<engine.total&&!cancelled()){
    const until=performance.now()+8;
    do {
      const c=engine.evaluateBatch(examined++,1)[0];
      retainHopSolverCandidate(buckets[(c.trial?0:2)+(hopCandidateConflicts(c)?1:0)],c,key,10);
    } while(examined<engine.total&&!cancelled()&&performance.now()<until);
    if(cancelled())return;
    const now=performance.now(),done=examined===engine.total;
    if(done||now>=nextPublish){
      publish({coverage:engine.coverage,examined,elapsedMs:now-start,done,results:buckets.flat().sort(compareHopSolverCandidates)});
      nextPublish=now+250;
    }
    if(!done)await new Promise<void>(resolve=>setTimeout(resolve,0));
  }
}
