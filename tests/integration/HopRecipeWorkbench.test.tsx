import React, { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { HopRecipeWorkbench, type HopRecipeWorkbenchSession } from '../../src/ui/hopIndex/HopRecipeWorkbench';
import { HopIngredientPicker } from '../../src/ui/hopIndex/HopIngredientPicker';
import { YeastRecipeWorkbench } from '../../src/ui/YeastRecipeWorkbench';
import { fullRecipe } from '../fixtures/fullRecipe';
import type { Recipe } from '../../src/types';
import type { YeastRecipeGoal } from '../../src/domain/yeastRecipeDesign';

const mocks = vi.hoisted(() => ({ knowledge: [], ensure: vi.fn(async () => {}), varieties: [
  { id:'mittelfruh',name:'Hallertauer Mittelfrüh',aliases:[],form:'pelletT90',descriptions:[],analysis:[] },
  { id:'tettnanger',name:'Tettnanger',aliases:[],form:'pelletT90',descriptions:[],analysis:[] },
  { id:'citra',name:'Citra',aliases:[],form:'pelletT90',descriptions:[],analysis:[] },
  { id:'mosaic',name:'Mosaic',aliases:[],form:'pelletT90',descriptions:[],analysis:[] },
] }));
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => mocks.knowledge }));
vi.mock('../../src/ui/hopIndex/useHopCatalogue', () => ({ useHopCatalogue: () => ({ varieties:mocks.varieties,loading:false,error:'' }) }));
vi.mock('../../src/ui/hopIndex/guideData',async importOriginal=>({ ...await importOriginal<any>(),ensureGuideReferences:mocks.ensure }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
const wheat = (): Recipe => ({ ...structuredClone(fullRecipe), style:'Hefeweizen',styleRef:undefined,nolo:undefined,yeastDesign:undefined,
  volumeL:20,ogTarget:1.05,boilMin:60,
  yeast:{name:'Wyeast 3068',hopIndexId:'wyeast-3068',form:'liquide',qty:100,unit:'mL',pitchTempC:20},
  fermentation:[{kind:'primaire',name:'Primaire',tempC:20,days:10}],
  mash:{steps:[{name:'Saccharification',tempC:66,durationMin:60}]},
  hops:[{name:'Hallertauer Mittelfrüh',hopVarietyId:'mittelfruh',weightG:20,alpha:4,stage:'boil',timeMin:60}],
});
const change=(label:string,value:string)=>{const field=screen.getByLabelText(label);fireEvent.change(field,{target:{value}});fireEvent.blur(field);};
const tab=(name:string)=>fireEvent.click(screen.getByRole('tab',{name}));
function Host({changed}:{changed:(r:Recipe)=>void}){
 const [r,setR]=useState(wheat());return <HopRecipeWorkbench recipe={r} onChange={next=>{setR(next as Recipe);changed(next as Recipe);}} />;
}
describe('Atelier houblons : décisions et application',()=>{
 it('reads historical snapshots with unknown style and yeast, including the flavor view',()=>{
  const legacy={...wheat(),name:'Brassin historique',style:undefined,yeast:undefined,fermentation:undefined,mash:undefined};
  const {rerender}=render(<HopRecipeWorkbench recipe={legacy}/>);
  expect(screen.getByRole('heading',{name:'Style à préciser'})).toBeInTheDocument();
  tab('Goût / levure');expect(screen.getByText(/Aucune famille de levure n’est supposée/)).toBeInTheDocument();
  rerender(<HopRecipeWorkbench recipe={{...legacy,style:'Hefeweizen'}}/>);
  expect(screen.getByText(/Actuelle : à choisir/)).toBeInTheDocument();
  expect(screen.queryByRole('button',{name:'Appliquer cet ajout'})).not.toBeInTheDocument();
 });
 it('leads with actual style, useful metrics and a keyboard-accessible view choice',()=>{
  render(<HopRecipeWorkbench recipe={wheat()} />);
  expect(screen.getByRole('heading',{name:'Weissbier'})).toBeInTheDocument();expect(screen.getByText('Repère du style : 8–15 IBU')).toBeInTheDocument();
  expect(screen.getByLabelText('Répartition des houblons par phase')).toHaveTextContent('20 g · 1 g/L');
  const selected=screen.getByRole('tab',{name:'Bilan'});fireEvent.keyDown(selected,{key:'ArrowRight'});
  expect(screen.getByRole('tab',{name:'Simuler'})).toHaveFocus();expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby',screen.getByRole('tab',{name:'Simuler'}).id);
 });
 it('calculates and explicitly applies one bittering dose, without writing during exploration',async()=>{
  const changed=vi.fn();render(<Host changed={changed} />);
  fireEvent.click(screen.getByRole('button',{name:'Calculer ma dose amère'}));change('Cible totale à chaud','12');
  expect(screen.getByLabelText('Comparaison actuel et scénario')).toHaveTextContent(/20 g.*26/);
  expect(changed).not.toHaveBeenCalled();expect(mocks.ensure).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Appliquer cet ajout'}));await waitFor(()=>expect(changed).toHaveBeenCalledTimes(1));
  expect(changed.mock.calls[0][0].hops[0].weightG).toBeCloseTo(26.012,2);expect(changed.mock.calls[0][0].yeast.hopIndexId).toBe('wyeast-3068');
  expect(screen.getByRole('status')).toHaveTextContent('Ajout repris');
 });
 it('retains an incomplete value visibly and allows correction',()=>{
  render(<HopRecipeWorkbench recipe={wheat()} onChange={vi.fn()} />);tab('Simuler');change('Cible totale à chaud','12');change('Alpha du lot à simuler','');
  expect(screen.getByRole('button',{name:'Appliquer cet ajout'})).toBeDisabled();expect(screen.getByText(/alpha du lot/)).toBeInTheDocument();
  expect(screen.getByLabelText('Alpha du lot à simuler')).toHaveAttribute('aria-invalid','true');
  expect(screen.getByLabelText('Alpha du lot à simuler')).toHaveAccessibleDescription(/alpha du lot/);
  change('Alpha du lot à simuler','4,5');expect(screen.getByRole('button',{name:'Appliquer cet ajout'})).toBeEnabled();
 });
 it('preserves an unapplied hop draft across step unmounts, separately from recipe data',()=>{
  const session:{current:HopRecipeWorkbenchSession|undefined}={current:undefined}, r=wheat(), onChange=vi.fn();
  const view=render(<HopRecipeWorkbench recipe={r} session={session} onChange={onChange}/>);
  tab('Simuler');change('Cible totale à chaud','25');view.unmount();
  render(<HopRecipeWorkbench recipe={r} session={session} onChange={onChange}/>);
  expect(screen.getByRole('tab',{name:'Simuler'})).toHaveAttribute('aria-selected','true');
  expect(screen.getByLabelText('Cible totale à chaud')).toHaveValue('25');expect(onChange).not.toHaveBeenCalled();
  expect(r.hops[0].weightG).toBe(20);expect(mocks.ensure).not.toHaveBeenCalled();
 });
 it('refuses a preview after a recipe change and resets from current values',()=>{
  const r=wheat(),onChange=vi.fn(),view=render(<HopRecipeWorkbench recipe={r} onChange={onChange}/>);tab('Simuler');change('Cible totale à chaud','12');
  view.rerender(<HopRecipeWorkbench recipe={{...r,volumeL:30}} onChange={onChange}/>);
  expect(screen.getByRole('alert')).toHaveTextContent('recette a changé');expect(screen.getByRole('button',{name:'Appliquer cet ajout'})).toBeDisabled();
  fireEvent.click(screen.getByRole('button',{name:'Reprendre les données actuelles'}));expect(screen.queryByRole('alert')).not.toBeInTheDocument();
 });
 it('locks an applying scenario and rechecks the recipe after the reference save',async()=>{
  let release!:()=>void;
  mocks.ensure.mockImplementationOnce(()=>new Promise<void>(resolve=>{release=resolve;}));
  const r=wheat(),onChange=vi.fn(),view=render(<HopRecipeWorkbench recipe={r} onChange={onChange}/>);
  tab('Simuler');change('Cible totale à chaud','12');fireEvent.click(screen.getByRole('button',{name:'Appliquer cet ajout'}));
  expect(screen.getByLabelText('Cible totale à chaud')).toBeDisabled();expect(screen.getByRole('tab',{name:'Bilan'})).toBeDisabled();
  view.rerender(<HopRecipeWorkbench recipe={{...r,volumeL:30}} onChange={onChange}/>);
  await act(async()=>{release();});
  expect(onChange).not.toHaveBeenCalled();expect(screen.getAllByRole('alert').some(e=>e.textContent?.includes('recette a changé'))).toBe(true);
 });
 it('routes clove and a cross-laboratory alternative to a local yeast scenario',()=>{
  const onChange=vi.fn();
  function Journey(){const [focus,setFocus]=useState<{goal:YeastRecipeGoal;yeastId?:string}>();return focus
   ? <YeastRecipeWorkbench recipe={wheat()} initialGoal={focus.goal} initialYeastId={focus.yeastId} onChange={onChange}/>
   : <HopRecipeWorkbench recipe={wheat()} onChange={onChange} onPlanYeast={(goal,yeastId)=>setFocus({goal,yeastId})}/>;}
  render(<Journey/>);tab('Goût / levure');fireEvent.click(screen.getByRole('radio',{name:'Girofle'}));
  fireEvent.click(screen.getByText(/Alternatives de levure/));const alternatives=screen.getByText('WLP380 · Hefeweizen IV · White Labs').closest('li')!;
  fireEvent.click(within(alternatives).getByRole('button',{name:'Comparer cette souche'}));
  expect(screen.getByRole('radio',{name:'Girofle · épices'})).toBeChecked();expect(screen.getByRole('radio',{name:'Comparer WLP380 · Hefeweizen IV'})).toBeChecked();
  expect(screen.getByRole('region',{name:'Scénario de levure'})).toHaveTextContent('WLP380');expect(onChange).not.toHaveBeenCalled();
 });
 it('prepares an IPA dry hop with a biological phase and preserves its conditions',async()=>{
  const onChange=vi.fn(),r={...wheat(),style:'NEIPA',hops:[]};render(<HopRecipeWorkbench recipe={r} onChange={onChange}/>);
  fireEvent.click(screen.getByRole('button',{name:'Préparer le dry hop'}));
  fireEvent.click(screen.getByRole('combobox',{name:'Houblon du scénario'}));fireEvent.click(screen.getByRole('option',{name:/Citra/}));
  change('Dose de cet ajout à cru','4');change('Température du contact à cru','16');change('Durée de contact à cru','48');
  expect(screen.getByRole('button',{name:'Appliquer cet ajout'})).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Phase du dry hop'),{target:{value:'postFermentation'}});
  expect(screen.getByLabelText('Comparaison actuel et scénario')).toHaveTextContent('80 g');
  fireEvent.click(screen.getByRole('button',{name:'Appliquer cet ajout'}));await waitFor(()=>expect(onChange).toHaveBeenCalledTimes(1));
  expect(onChange.mock.calls[0][0].hops[0]).toMatchObject({name:'Citra',weightG:80,aromaTiming:'postFermentation',aromaContactHours:48,aromaTemperatureC:16});
 });
 it('keeps a finished recipe simulation read-only',()=>{
  render(<HopRecipeWorkbench recipe={wheat()}/>);tab('Simuler');change('Cible totale à chaud','12');
  expect(screen.queryByRole('button',{name:'Appliquer cet ajout'})).not.toBeInTheDocument();expect(mocks.ensure).not.toHaveBeenCalled();
 });
 it('filters the ingredient catalogue by style with an explicit way to include others',()=>{
  render(<HopIngredientPicker recipe={wheat()} items={[]} onChange={vi.fn()} onReference={vi.fn()} onCreate={vi.fn()} placeholder="Houblon" ariaLabel="Catalogue houblons" />);
  fireEvent.click(screen.getByRole('combobox',{name:'Catalogue houblons'}));expect(screen.getByRole('option',{name:/Tettnanger/})).toBeInTheDocument();expect(screen.queryByRole('option',{name:/Citra/})).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox',{name:/Tous les styles/}));fireEvent.click(screen.getByRole('combobox',{name:'Catalogue houblons'}));
  expect(screen.getByRole('option',{name:/Citra/})).toBeInTheDocument();
 });
});
