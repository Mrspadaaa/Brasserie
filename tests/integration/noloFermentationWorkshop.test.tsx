import React, {useState} from 'react';
import {describe,it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,within} from '@testing-library/react';
import {NoloFermentationWorkshop} from '../../src/ui/NoloFermentationWorkshop';
import {RecipeAutoComplete} from '../../src/ui/RecipeAutoComplete';
import {fruty} from '../fixtures/fruty';
import {StorageService} from '../../src/services/storage';
import {evaluateNoloRecipe} from '../../src/domain/nolo';
import {readIngredientFermentationFacts} from '../../functions/src/ingredientFermentationFacts';
import {readRecipeFields,writeRecipeText,readRecipeText} from '../../src/domain/recipeTransfer';
import {localYeastFacts} from '../../src/domain/localIngredientFacts';

const run=vi.fn();vi.mock('../../src/services/aiClient',()=>({AiClient:{run:(...a:unknown[])=>run(...a)}}));
afterEach(()=>{cleanup();vi.restoreAllMocks();run.mockReset();});
describe('NOLO pendant la création',()=>{
  it('rend immédiatement trois candidates, montre les changements puis applique le programme complet sans persistance',async()=>{
    const write=vi.spyOn(StorageService,'saveHopKnowledge'), learn=vi.fn();let latest=fruty(true);
    function Host(){const [r,setR]=useState(latest);latest=r;return <><RecipeAutoComplete nolo active={false} fermentables={r.fermentables} onFermentables={f=>setR(p=>({...p,fermentables:f}))} hops={r.hops} onHops={h=>setR(p=>({...p,hops:h}))} yeast={r.yeast} onYeast={y=>setR(p=>({...p,yeast:y}))} onLearnIngredient={learn}/><NoloFermentationWorkshop recipe={r} onChange={setR}/></>}
    render(<Host/>);
    const cards=screen.getByLabelText('Propositions NOLO');expect(within(cards).getAllByRole('button')).toHaveLength(3);
    expect(screen.queryByText('Banane · objectif')).not.toBeInTheDocument();
    fireEvent.click(within(cards).getByRole('button',{name:/LA-01/}));
    expect(latest.yeast.name).toContain('US-05');
    expect(screen.getByLabelText('Proposition complète de fermentation')).toHaveTextContent('Empâtage');
    fireEvent.click(screen.getByRole('button',{name:'Appliquer cette proposition'}));
    await waitFor(()=>expect(latest.yeast.hopIndexId).toBe('yeast-fermentis-safbrew-la-01'));
    expect(latest.yeast.qty).toBeCloseTo(15.6,8);
    expect(latest.mash?.steps.map(s=>s.tempC)).toEqual([65,73]);
    expect(evaluateNoloRecipe(latest)?.projection.max).toBeCloseTo(.3964,9);
    expect(write).not.toHaveBeenCalled();expect(run).not.toHaveBeenCalled();expect(learn).not.toHaveBeenCalled();
  });
  it('rejette une proposition périmée et conserve les intentions libres',()=>{
    const r=fruty(true),change=vi.fn(),view=render(<NoloFermentationWorkshop recipe={r} onChange={change}/>);
    fireEvent.click(within(screen.getByLabelText('Propositions NOLO')).getByRole('button',{name:/LA-01/}));
    view.rerender(<NoloFermentationWorkshop recipe={{...r,volumeL:25}} onChange={change}/>);
    expect(screen.getByText(/La recette a changé/)).toBeInTheDocument();expect(screen.queryByRole('button',{name:'Appliquer cette proposition'})).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox',{name:/Profil recherché/}),{target:{value:'framboise ronde'}});
    expect(change.mock.lastCall?.[0].fermentationIntent.aroma).toBe('framboise ronde');
  });
  it('conserve les faits fermentaires sourcés dans un export/import et rejette un coefficient non sourcé',()=>{
    const r=fruty(),facts=localYeastFacts({...r.yeast,name:'LA-01',hopIndexId:'yeast-fermentis-safbrew-la-01'},[])!.fermentation!;
    expect(readIngredientFermentationFacts(facts)).toBeDefined();
    expect(readIngredientFermentationFacts({...facts,source:{}})).toBeUndefined();
    expect(readIngredientFermentationFacts({...facts,pitchGL:{min:-1,max:2}})).toBeUndefined();
    expect(readIngredientFermentationFacts({...facts,strainName:42})).toBeUndefined();
    expect(readIngredientFermentationFacts({...facts,conditions:42})).toBeUndefined();
    expect(readIngredientFermentationFacts({...facts,retrievedAt:'2026-99-99'})).toBeUndefined();
    r.yeast.fermentationFacts=facts;r.fermentationIntent={version:1,aroma:'fruité',fruit:'framboise',acidity:'assemblage'};
    const fields=readRecipeFields(r);expect(fields.yeast?.fermentationFacts).toEqual(facts);
    const text=writeRecipeText(r);expect(text).toContain('Données fermentaires sourcées');
    expect(readRecipeText(text)?.yeast?.fermentationFacts).toEqual(facts);
  });
});
