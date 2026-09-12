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
  it('préremplit une simulation avec les candidates du procédé puis applique le programme sans persistance externe',async()=>{
    const write=vi.spyOn(StorageService,'saveHopKnowledge'), learn=vi.fn();let latest=fruty(true);
    function Host(){const [r,setR]=useState(latest);latest=r;return <><RecipeAutoComplete nolo active={false} fermentables={r.fermentables} onFermentables={f=>setR(p=>({...p,fermentables:f}))} hops={r.hops} onHops={h=>setR(p=>({...p,hops:h}))} yeast={r.yeast} onYeast={y=>setR(p=>({...p,yeast:y}))} onLearnIngredient={learn}/><NoloFermentationWorkshop recipe={r} onChange={setR}/></>}
    render(<Host/>);
    const candidates=screen.getByLabelText('Levure de la simulation');expect(within(candidates).getAllByRole('option').length).toBeGreaterThan(3);
    expect(screen.queryByText('Banane · objectif')).not.toBeInTheDocument();
    fireEvent.change(candidates,{target:{value:'yeast-fermentis-safbrew-la-01'}});
    expect(latest.yeast.name).toContain('US-05');
    expect(screen.getByLabelText('Changements proposés dans la recette NOLO')).toHaveTextContent('Empâtage');
    const projected=Number(screen.getByLabelText('Résultat de la simulation NOLO').getAttribute('data-nolo-max'));
    fireEvent.click(screen.getByRole('button',{name:'Appliquer à la recette'}));
    await waitFor(()=>expect(latest.yeast.hopIndexId).toBe('yeast-fermentis-safbrew-la-01'));
    expect(latest.yeast.qty).toBeCloseTo(15.6,8);
    expect(latest.mash?.steps.map(s=>s.tempC)).toEqual([65,73]);
    expect(evaluateNoloRecipe(latest)?.projection.max).toBeCloseTo(projected,9);
    expect(write).not.toHaveBeenCalled();expect(run).not.toHaveBeenCalled();expect(learn).not.toHaveBeenCalled();
  });
  it('rejette une proposition périmée et conserve les intentions libres',()=>{
    const r=fruty(true),change=vi.fn(),view=render(<NoloFermentationWorkshop recipe={r} onChange={change}/>);
    fireEvent.change(screen.getByLabelText('Variation de l’extrait'),{target:{value:'10'}});
    view.rerender(<NoloFermentationWorkshop recipe={{...r,volumeL:25}} onChange={change}/>);
    expect(screen.getByText(/La recette a changé/)).toBeInTheDocument();expect(screen.getByRole('button',{name:'Appliquer à la recette'})).toBeDisabled();
    fireEvent.click(screen.getByText('Profil aromatique, fruit et acidité'));
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
