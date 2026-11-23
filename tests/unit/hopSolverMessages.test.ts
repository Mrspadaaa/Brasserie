import {describe,it,expect} from 'vitest';
import {createHopSearchEncoder} from '../../src/ui/hopIndex/hopSolverMessages';
import type {HopSearchUpdate} from '../../src/domain/hopIndex/solverSearch';
import type {HopSolverCandidate} from '../../src/domain/hopIndex/solver';

describe('Messages progressifs du solver',()=>{
  it('envoie les détails au premier résultat et lors d’un changement, avec une fin complète',()=>{
    const encode=createHopSearchEncoder(),candidate={id:'same-id'} as HopSolverCandidate;
    const update={coverage:{mode:'exhaustive'},examined:1,elapsedMs:0,done:false,results:[candidate]} as HopSearchUpdate;
    expect(encode(update)).toEqual({kind:'update',update});
    const progress=encode({...update,examined:100,results:[candidate]});
    expect(progress.kind).toBe('progress');expect(progress).not.toHaveProperty('update.results');
    // The same ID may acquire a different dose or prediction: identity alone is insufficient.
    expect(encode({...update,results:[{...candidate}]}).kind).toBe('update');
    const last={...update,done:true};expect(encode(last)).toEqual({kind:'update',update:last});
  });
  it('un nouveau worker repart avec ses propres détails',()=>{
    const update={coverage:{mode:'quick'},examined:0,elapsedMs:0,done:false,results:[]} as HopSearchUpdate;
    const first=createHopSearchEncoder();first(update);expect(first(update).kind).toBe('progress');
    expect(createHopSearchEncoder()(update).kind).toBe('update');
  });
});
