import { runHopSolverSearch, type HopSearchUpdate } from '../../domain/hopIndex/solverSearch';
import type { HopSolverSearchOptions } from '../../domain/hopIndex/solver';
export type HopSearchMessage={kind:'update';update:HopSearchUpdate}|{kind:'error';message:string};
type SearchWorker=Pick<Worker,'postMessage'|'terminate'|'onmessage'|'onerror'|'onmessageerror'>;

/** A stopped or replaced search cannot publish stale results. Neither path uses a server. */
export function startHopSolverSearch(input:HopSolverSearchOptions,publish:(update:HopSearchUpdate)=>void,fail:(error:Error)=>void,
  createWorker:()=>SearchWorker=()=>new Worker(new URL('./hopSolver.worker.ts',import.meta.url),{type:'module'})){
  let stopped=false,worker:SearchWorker|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  const stopWorker=()=>{if(worker){worker.onmessage=null;worker.onerror=null;worker.onmessageerror=null;worker.terminate();worker=undefined;}};
  const cancel=()=>{stopped=true;if(timer!==undefined)clearTimeout(timer);stopWorker();};
  const update=(u:HopSearchUpdate)=>{if(stopped)return;publish(u);if(u.done)cancel();};
  const error=(e:Error)=>{if(stopped)return;cancel();fail(e);};
  const fallback=()=>{if(stopped)return;stopWorker();timer=setTimeout(()=>{void runHopSolverSearch(input,update,()=>stopped).catch(error);},0);};
  try{
    worker=createWorker();
    worker.onmessage=event=>{const m=event.data as HopSearchMessage;if(m?.kind==='update')update(m.update);else if(m?.kind==='error')error(new Error(m.message));else error(new Error('Réponse de recherche invalide.'));};
    worker.onerror=event=>{event.preventDefault();fallback();};
    worker.onmessageerror=fallback;
    worker.postMessage(input);
  }catch{fallback();}
  return {cancel};
}
