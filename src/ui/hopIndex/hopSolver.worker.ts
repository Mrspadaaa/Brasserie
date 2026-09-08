import { runHopSolverSearch } from '../../domain/hopIndex/solverSearch';
import type { HopSolverSearchOptions } from '../../domain/hopIndex/solver';
import type { HopSearchMessage } from './hopSolverTransport';

const worker=self as unknown as {
  onmessage:(event:MessageEvent<HopSolverSearchOptions>)=>void;
  postMessage:(message:HopSearchMessage)=>void;
};
// One worker per search. Terminating it cancels preparation and computation.
worker.onmessage=({data})=>{
  void runHopSolverSearch(data,update=>worker.postMessage({kind:'update',update}),()=>false)
    .catch(error=>worker.postMessage({kind:'error',message:error instanceof Error?error.message:'Recherche indisponible.'}));
};
