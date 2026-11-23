import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { Recipe } from '../../src/types';
import { HopSolverPanel } from '../../src/ui/hopIndex/HopSolverPanel';
import { StorageService } from '../../src/services/storage';
import { ensureGuideReferences, guidePredictionKnowledge } from '../../src/ui/hopIndex/guideData';
import legacy from '../../src/data/hopExtrapolationLegacyBootstrap.json';
import current from '../../src/data/hopExtrapolationBootstrap.json';

// Only the network/persistence boundary is replaced. The real guide, catalogues,
// matching, documentary ranking, source validation and import path stay in use.
const memory = vi.hoisted(() => ({
  docs: new Map<string, any>(), listeners: new Set<() => void>(),
  writes: vi.fn(), attempts: vi.fn(), failure: null as Error | null, delay: null as Promise<void> | null,
}));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/'))
    .map(([key, value]) => ({ ...structuredClone(value), __docId: key.split('/')[1] })),
  isReady: () => true,
  subscribe: (callback: () => void) => { memory.listeners.add(callback); return () => memory.listeners.delete(callback); },
  put: (name: string, id: string, value: any) => {
    if (memory.failure) throw memory.failure;
    memory.writes(name, id, value); memory.docs.set(`${name}/${id}`, structuredClone(value));
    memory.listeners.forEach(callback => callback());
  },
  bulkWrite: async (entries: any[]) => {
    memory.attempts(entries);
    if (memory.delay) await memory.delay;
    if (memory.failure) throw memory.failure;
    for (const { name, id, data } of entries) {
      memory.writes(name, id, data); memory.docs.set(`${name}/${id}`, structuredClone(data));
    }
    memory.listeners.forEach(callback => callback());
  },
} }));

const initial: Recipe = { id:'solver-ui',name:'Recette existante',style:'Libre',volumeL:20,ogTarget:1.05,fgTarget:1.01,abvTarget:5,totalGristKg:5,
  fermentables:[],hops:[{name:'Cascade',alpha:6.5,weightG:14,stage:'boil',timeMin:60}],steps:[],notes:[],
  yeast:{name:'LalBrew Verdant IPA',form:'sèche',qty:1,unit:'sachet'},
  hopSolverIntent:{styleId:'free',avoid:[],chemistry:{},keepYeast:true,timings:['postFermentation']} };
beforeEach(()=>{memory.docs.clear();memory.listeners.clear();memory.writes.mockClear();memory.attempts.mockClear();memory.delay=null;memory.failure=null});
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function mount(onBusyChange?:(busy:boolean)=>void, seed: Recipe = initial) {
  let current=structuredClone(seed);const changes=vi.fn();
  function Host(){const[r,setR]=useState(current);current=r;return <HopSolverPanel recipe={r} target={r.hopAromaTarget??{}} onBusyChange={onBusyChange} onTargetChange={t=>setR({...r,hopAromaTarget:t})} onChange={next=>{changes(next);setR(next as Recipe)}}/>}
  render(<Host/>);return{current:()=>current,changes};
}
const runSearch=async()=>{
  await waitFor(()=>expect(screen.getByRole('button',{name:'Trouver mes combinaisons'})).toBeEnabled());
  fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
  await screen.findByLabelText('Programme proposé par le solver',{}, {timeout:15000});
};
const chooseHop=async(name:string)=>{
  const field=screen.getByRole('combobox',{name:'Ajouter un houblon à comparer'});
  await waitFor(()=>expect(field).toBeEnabled());
  fireEvent.focus(field);fireEvent.change(field,{target:{value:name}});
  const options=await screen.findAllByRole('option');
  const option=options.find(element=>element.getAttribute('aria-label')?.startsWith(name+' · '));
  expect(option,`Le catalogue doit proposer ${name}`).toBeDefined();
  fireEvent.click(option!);
};
describe('Solver dans une recette existante',()=>{
  it('propose le catalogue par usage de style, transmet les choix et invalide une recherche après changement',async()=>{
    const workers:any[]=[];
    class LocalWorker {onmessage:any=null;onerror:any=null;onmessageerror:any=null;postMessage=vi.fn();terminate=vi.fn();constructor(){workers.push(this);}}
    vi.stubGlobal('Worker',LocalWorker);
    const host=mount(undefined,{...initial,style:'Double IPA',hopSolverIntent:undefined});
    const picker=await screen.findByRole('group',{name:'Houblons à comparer'});
    await chooseHop('Lotus');await chooseHop('Galaxy');
    fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
    const namesOf=(input:any)=>input.varietyIds.map((id:string)=>input.data.varieties.find((v:any)=>v.id===id).name);
    expect(namesOf(workers[0].postMessage.mock.calls[0][0])).toEqual(['Lotus','Galaxy']);
    expect(workers[0].postMessage.mock.calls[0][0].intent.keepYeast).toBe(true);
    const old=workers[0].onmessage;
    await chooseHop('Idaho 7');
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    act(()=>old({data:{kind:'error',message:'Ancienne sélection'}}));
    expect(screen.queryByText('Ancienne sélection')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
    expect(namesOf(workers[1].postMessage.mock.calls[0][0])).toEqual(['Lotus','Galaxy','Idaho 7']);
    fireEvent.change(screen.getByLabelText('Point de départ par style'),{target:{value:'free'}});
    expect(workers[1].terminate).toHaveBeenCalledOnce();
    expect(within(picker).getByRole('button',{name:'Automatique'})).toHaveAttribute('aria-pressed','true');
    expect(within(picker).queryByRole('button',{name:'Galaxy'})).not.toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled();expect(host.changes).not.toHaveBeenCalled();
  });
  it('compare Citra puis applique seulement cet ajout en conservant la recette et la levure',async()=>{
    const host=mount(undefined,{...initial,style:'Double IPA',hopSolverIntent:undefined});
    await chooseHop('Citra');
    await runSearch();
    const programme=screen.getByLabelText('Programme proposé par le solver');
    expect(programme).toHaveTextContent('Citra');expect(programme).not.toHaveTextContent('Idaho 7');
    expect(memory.writes).not.toHaveBeenCalled();expect(host.changes).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Ajouter ce programme à ma recette'}));
    await waitFor(()=>expect(host.current().hops).toHaveLength(2));
    expect(host.current().hops[0]).toEqual(initial.hops[0]);
    expect(host.current().hops[1]).toMatchObject({name:'Citra',hopVarietyId:'ych-citra'});
    expect(host.current().yeast.name).toContain('Verdant');expect(host.current().yeast.qty).toBe(initial.yeast.qty);
  },20000);
  it('garde les critères et la navigation libres, annule et rejette les réponses périmées',async()=>{
    const workers:any[]=[];
    class LocalWorker {onmessage:any=null;onerror:any=null;onmessageerror:any=null;postMessage=vi.fn();terminate=vi.fn();constructor(){workers.push(this);}}
    vi.stubGlobal('Worker',LocalWorker);
    const busy=vi.fn(),host=mount(busy);
    await waitFor(()=>expect(screen.getByRole('button',{name:'Trouver mes combinaisons'})).toBeEnabled());
    fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
    expect(screen.getByLabelText('Point de départ par style')).toBeEnabled();
    expect(screen.getByLabelText('Étendue de la recherche')).toBeEnabled();
    expect(busy).not.toHaveBeenCalledWith(true);
    act(()=>memory.listeners.forEach(f=>f()));
    expect(workers[0].terminate).not.toHaveBeenCalled();
    const old=workers[0].onmessage;
    fireEvent.click(screen.getByRole('button',{name:'Arrêter la recherche'}));
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
    act(()=>old({data:{kind:'error',message:'Erreur périmée'}}));
    expect(screen.queryByText('Erreur périmée')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Étendue de la recherche'),{target:{value:'exhaustive'}});
    expect(workers[1].terminate).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button',{name:'Arrêter la recherche'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
    memory.docs.set('hopKnowledge/'+current[0].id,{...structuredClone(current[0]),enabled:false});
    act(()=>memory.listeners.forEach(f=>f()));
    expect(workers[2].terminate).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button',{name:'Arrêter la recherche'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Trouver mes combinaisons'}));
    cleanup();expect(workers[3].terminate).toHaveBeenCalledOnce();
    expect(memory.writes).not.toHaveBeenCalled();expect(host.changes).not.toHaveBeenCalled();
  });
  it('préremplit le contact, ne modifie rien en recherche et attend la persistance avant ajout',async()=>{
    const host=mount();await runSearch();
    expect(screen.getByLabelText('Contact (°C) · ajout 1')).toHaveValue('18');
    expect(screen.getByLabelText('Durée (h) · ajout 1')).toHaveValue('24');
    expect(memory.writes).not.toHaveBeenCalled();expect(host.changes).not.toHaveBeenCalled();
    let release!:()=>void;memory.delay=new Promise<void>(r=>{release=r});
    fireEvent.click(screen.getByRole('button',{name:'Ajouter ce programme à ma recette'}));
    await waitFor(()=>expect(memory.attempts).toHaveBeenCalledOnce());expect(host.current().hops).toHaveLength(1);
    await act(async()=>{release();await memory.delay});memory.delay=null;
    await waitFor(()=>expect(host.current().hops).toHaveLength(2));
    expect(host.current().hops[0]).toEqual(initial.hops[0]);
    expect(host.current().yeast.qty).toBe(1);expect(host.current().hopSolverIntent).toEqual(initial.hopSolverIntent);
  },20000);
  it('explique une contradiction chimique et empêche son application même si un graphe existe',async()=>{
    mount();
    fireEvent.change(screen.getByLabelText('Phénols de levure · girofle, épices'),{target:{value:'seek'}});
    await runSearch();
    expect(screen.getByRole('button',{name:'Ajouter ce programme à ma recette'})).toBeDisabled();
    expect(screen.getByLabelText('Programme proposé par le solver')).toHaveTextContent('phénolique négatif');
    expect(memory.writes).not.toHaveBeenCalled();
  },20000);
  it('met à jour une seule fois le défaut intact et conserve ensuite toute personnalisation',async()=>{
    memory.docs.set('hopKnowledge/'+legacy[0].id,structuredClone(legacy[0]));
    const proposed=guidePredictionKnowledge(StorageService.getHopKnowledge()).filter(k=>k.kind==='extrapolation');
    await ensureGuideReferences({knowledge:proposed});
    expect(StorageService.getHopKnowledge().find(k=>k.id===legacy[0].id)).toEqual(current[0]);
    memory.writes.mockClear();await ensureGuideReferences({knowledge:proposed});expect(memory.writes).not.toHaveBeenCalled();
    const custom={...structuredClone(current[0]),enabled:false};
    memory.docs.set('hopKnowledge/'+custom.id,custom);
    await ensureGuideReferences({knowledge:proposed});
    expect(StorageService.getHopKnowledge().find(k=>k.id===custom.id)).toEqual(custom);expect(memory.writes).not.toHaveBeenCalled();
  });
});
