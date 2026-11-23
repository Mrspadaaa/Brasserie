import type { HopSearchUpdate } from '../../domain/hopIndex/solverSearch';

export type HopSearchMessage =
  | {kind:'update';update:HopSearchUpdate}
  | {kind:'progress';update:Omit<HopSearchUpdate,'results'>}
  | {kind:'error';message:string};

/** Candidates are immutable within a search. Progress alone must not clone the
 * same profiles, explanations and sources back to the UI four times per second. */
export function createHopSearchEncoder() {
  let previous:HopSearchUpdate['results']|undefined;
  return (update:HopSearchUpdate):HopSearchMessage=>{
    const unchanged=previous?.length===update.results.length&&previous.every((c,i)=>c===update.results[i]);
    previous=update.results;
    if(unchanged&&!update.done){const {results:_results,...progress}=update;return {kind:'progress',update:progress};}
    return {kind:'update',update};
  };
}
