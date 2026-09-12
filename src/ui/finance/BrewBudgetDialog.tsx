import React from 'react';
import type { Recipe, Batch } from '../../types';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { BrewBudgetSheet } from './BrewBudgetSheet';
import type { BrewBudgetSnapshot } from '../../domain/finance/brewBudget';
import { annualBrewFixedCosts, brewBudgetDateKey, matchingRecipeBrewPlans } from '../../domain/finance/brewBudget';
import { depreciationForYear } from '../../domain/finance/annual';
import { isoDate } from '../../domain/finance/ledger';
import { Field, inputClass } from '../FormNav';

const readContext = () => ({ ...FinanceService.snapshot(), transactions: StorageService.getTransactions(), stocks: StorageService.getStocks(), batches: StorageService.getBatches(), config: StorageService.getConfig() });
export function BrewBudgetDialog({recipe,batch,onClose}:{recipe?:Recipe;batch?:Batch;onClose:()=>void}) {
  const data=useStorageValue(readContext);
  const [recipePlanChoice,setRecipePlanChoice]=React.useState('');
  const key=batch?.id??recipe?.id??'new';
  const related=data.plans.filter(p=>p.source==='brew'&&p.brewEstimate&&(batch ? (p.brewEstimate as BrewBudgetSnapshot).batchId===batch.id : !!recipe && !(p.brewEstimate as BrewBudgetSnapshot).batchId && (p.brewEstimate as BrewBudgetSnapshot).recipeId===recipe.id));
  const previous=[...related].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const annualFixed=annualBrewFixedCosts(data.plans);
  const budgetDepreciation=React.useCallback((year:number)=>{
    const rows=data.assets.map(asset=>depreciationForYear(asset,year));
    const warnings=rows.flatMap(row=>row.missing);
    return {amountCHF:rows.length&&!warnings.length?rows.reduce((sum,row)=>sum+row.depreciationCents,0)/100:undefined,warnings};
  },[data.assets]);
  return <BrewBudgetSheet open onClose={onClose} recipe={recipe} batch={batch} config={data.config} batches={data.batches} stockItems={[...data.stocks.rawMaterials,...data.stocks.cleaning]} transactions={data.transactions}
    savedEstimates={data.plans.filter(p=>p.brewEstimate).map(p=>p.brewEstimate as BrewBudgetSnapshot)} savedEstimate={previous?.brewEstimate as BrewBudgetSnapshot|undefined} settings={{annualVolumeL:data.profile.annualProductionL,annualFixedCHF:annualFixed.amountCHF}} settingsWarnings={annualFixed.warnings} depreciationForBudgetYear={budgetDepreciation}
    canPlan={snapshot=>{const candidates=matchingRecipeBrewPlans(data.plans,snapshot);return !candidates.length||recipePlanChoice==='separate'||candidates.some(p=>p.id===recipePlanChoice);}}
    renderPlanReconciliation={snapshot=>{
      const candidates=matchingRecipeBrewPlans(data.plans,snapshot);
      if(!candidates.length)return null;
      return <section className="brew-budget-section"><h3>Un budget existe déjà pour cette recette</h3><p className="brew-budget-hint">Même recette, même date et même volume. Rattache le budget déjà prévu à ce brassin pour ne compter ses achats qu’une fois.</p><Field label="Budget à rattacher"><select aria-label="Budget à rattacher" className={inputClass} value={recipePlanChoice} onChange={event=>setRecipePlanChoice(event.target.value)}><option value="">Choisir le lien avec le budget existant</option>{candidates.map(plan=><option key={plan.id} value={plan.id}>Rattacher {plan.title} · {(plan.amountCents/100).toLocaleString('fr-CH')} CHF</option>)}<option value="separate">Autre brassin : garder les deux budgets</option></select></Field></section>;
    }}
    onSave={(snapshot,addToPlan)=>{
      const id=`BUDGET-${encodeURIComponent(key)}-${crypto.randomUUID()}`;
      const candidates=matchingRecipeBrewPlans(data.plans,snapshot);
      const matched=candidates.find(p=>p.id===recipePlanChoice);
      if(addToPlan&&candidates.length&&!matched&&recipePlanChoice!=='separate')throw new Error('Choisis le lien avec le budget de recette déjà prévu.');
      // Keep every accepted snapshot. Retire the old intention so a revision isn't counted twice.
      if(addToPlan)related.filter(p=>p.status==='active').forEach(p=>FinanceService.savePlan({...p,status:'completed'}));
      if(addToPlan&&matched)FinanceService.savePlan({...matched,status:'completed'});
      FinanceService.savePlan({id,title:snapshot.title,date:brewBudgetDateKey(snapshot.brewDate)??isoDate(batch?.brewDate)!,amountCents:Math.round(snapshot.cashRequiredTTC*100),direction:'out',category:'brassage',source:'brew',status:addToPlan?'active':'draft',batchId:batch?.id,brewEstimate:snapshot,createdAt:new Date().toISOString()});
    }}/>
}

export function BrewBudgetButton({recipe,batch}:{recipe?:Recipe;batch?:Batch}) {
  const [open,setOpen]=React.useState(false);
  return <><button type="button" className="min-h-touch w-full rounded-control border border-cave-700 text-ebc-straw font-semibold px-3 py-3 my-3 text-left" onClick={()=>setOpen(true)}>Estimer le budget de ce brassin</button>{open&&<BrewBudgetDialog recipe={recipe} batch={batch} onClose={()=>setOpen(false)}/>}</>;
}
