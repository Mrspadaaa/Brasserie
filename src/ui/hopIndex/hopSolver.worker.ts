import { runHopSolverSearch } from '../../domain/hopIndex/solverSearch';
import type { HopSolverSearchOptions } from '../../domain/hopIndex/solver';
import { createHopSearchEncoder, type HopSearchMessage } from './hopSolverMessages';

const worker=self as unknown as {
  onmessage:(event:MessageEvent<HopSolverSearchOptions>)=>void;
  postMessage:(message:HopSearchMessage)=>void;
};
// One worker per search. Terminating it cancels preparation and computation.
worker.onmessage=({data})=>{
  const encode=createHopSearchEncoder();
  void runHopSolverSearch(data,update=>worker.postMessage(encode(update)),()=>false)
    .catch(error=>worker.postMessage({kind:'error',message:error instanceof Error?error.message:'Recherche indisponible.'}));
};
