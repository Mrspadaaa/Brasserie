import React,{useState} from 'react';
import {it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {RecipeDisclosure,RecipeWaterVolumes} from '../../src/ui/RecipeDisclosure';
import {SaltSolver,type WaterState} from '../../src/ui/SaltSolver';
import {nuageWater} from '../fixtures/nuageWater';
afterEach(cleanup);
it('laisse les litres visibles et ouvre plusieurs étapes indépendamment ; une erreur ouvre son étape',async()=>{
  const view=render(<><RecipeWaterVolumes totalL={33.6} roL={21.84}/><RecipeDisclosure title="Grain" summary="5,2 kg"><input aria-label="Grain" defaultValue="5.2" required/></RecipeDisclosure><RecipeDisclosure title="Eau"><p>Doses</p></RecipeDisclosure></>);
  expect(view.container.querySelectorAll('details[open]')).toHaveLength(0);
  expect(screen.getByLabelText('Eaux à préparer')).toBeVisible();expect(screen.getByText('21,8 L')).toBeVisible();
  fireEvent.click(screen.getByText('Grain',{selector:'summary span span'}));fireEvent.click(screen.getByText('Eau'));
  expect(view.container.querySelectorAll('details[open]')).toHaveLength(2);
  fireEvent.click(screen.getByText('Grain',{selector:'summary span span'}));
  fireEvent.invalid(screen.getByLabelText('Grain'));
  await waitFor(()=>expect(view.container.querySelector('[data-recipe-section="Grain"]')).toHaveAttribute('open'));
  expect(screen.getByLabelText('Grain')).toHaveValue('5.2');
});
it('applique la proposition minimale entière puis Doser garde exactement doses et répartition',async()=>{
  const recipe=nuageWater(100),p=recipe.waterPlan!;let latest:WaterState;
  function Host(){const [state,set]=useState<WaterState>({diRatioPct:100,styleCode:'—',customTarget:{name:'Douce',ions:p.targetIons!},doses:{},disabled:p.disabled!,allSaltsInMash:false,
    acidId:'lactique',mashWaterL:18.2,spargeWaterL:15.4});
    latest=state;return <SaltSolver source={p.sourceSnapshot!} onSourceChange={()=>{}} beerEbc={9.1} beerVolumeL={24}
      brew={{grist:recipe.fermentables,totalGristKg:5.2,targetPh:5.4}} state={state} onChange={set} noSparge={false} onNoSpargeChange={()=>{}}/>;}
  const view=render(<Host/>);
  expect(screen.getByText('Valeurs de départ, à remplacer par l’analyse du distributeur.')).toBeVisible();
  expect(view.container.querySelector('details')).not.toHaveAttribute('open');
  const minimum=screen.getByRole('button',{name:/Minimum trouvé d’osmosée/});await waitFor(()=>expect(minimum).not.toBeDisabled());
  fireEvent.click(minimum);expect(latest!.diRatioPct).toBe(65);
  const proposal=structuredClone(latest!);expect(Object.values(proposal.doses).some(v=>v!>0)).toBe(true);expect(proposal.saltSplit).toBeDefined();
  fireEvent.click(screen.getByRole('button',{name:'Proposer les doses'}));
  expect(latest!.doses).toEqual(proposal.doses);expect(latest!.saltSplit).toEqual(proposal.saltSplit);
  expect(latest!.disabled).toEqual(p.disabled);
  expect(view.container.querySelector('[data-mash-diagnostic="outside"]')).not.toBeNull();
});
