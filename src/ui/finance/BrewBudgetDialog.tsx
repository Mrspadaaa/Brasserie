import React from 'react';
import type { Recipe, Batch } from '../../types';
import { useStorageValue } from '../../hooks/useLiveData';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import { BrewBudgetSheet } from './BrewBudgetSheet';
import type { BrewBudgetSnapshot } from '../../domain/finance/brewBudget';
import { annualBrewFixedCosts, brewBudgetDateKey, matchingRecipeBrewPlans } from '../../domain/finance/brewBudget';
import { usureAnnuelleLitre } from '../../domain/finance/materielFutur';
import { isoDate } from '../../domain/finance/ledger';
import { Field, inputClass } from '../FormNav';

const readContext = () => ({ ...FinanceService.snapshot(), transactions: StorageService.getTransactions(), stocks: StorageService.getStocks(), batches: StorageService.getBatches(), config: StorageService.getConfig() });
/** `onOpenForecast` : branché par l'écran Prévisions (hors de ce port). Sans lui, aucun lien n'est affiché ; l'état de navigation est tout de même écrit. */
const AssetSheet=React.lazy(()=>import('./FinanceForms').then(m=>({default:m.AssetSheet})));
const PrixFeuille=React.lazy(()=>import('../prix/PrixEcran').then(m=>({default:m.PrixFeuille})));
/** `onMesures` : la fiche du brassin › Mesures (CP-18 : « Litres nets » y renvoie). Le registre du matériel et le tarif s'ouvrent ici, par-dessus le coût. */
export function BrewBudgetDialog({recipe,batch,onClose,onOpenForecast,onNoteDensity,onMesures}:{recipe?:Recipe;batch?:Batch;onClose:()=>void;onOpenForecast?:(target:{planId:string;batchId?:string})=>void;onNoteDensity?:()=>void;onMesures?:()=>void}) {
  const data=useStorageValue(readContext);
  const [registre,setRegistre]=React.useState(false), [tarif,setTarif]=React.useState(false);
  const [recipePlanChoice,setRecipePlanChoice]=React.useState('');
  const key=batch?.id??recipe?.id??'new';
  const related=data.plans.filter(p=>p.source==='brew'&&p.brewEstimate&&(batch ? (p.brewEstimate as BrewBudgetSnapshot).batchId===batch.id : !!recipe && !(p.brewEstimate as BrewBudgetSnapshot).batchId && (p.brewEstimate as BrewBudgetSnapshot).recipeId===recipe.id));
  const previous=[...related].sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  const annualFixed=annualBrewFixedCosts(data.plans);
  // Usure linéaire d'un matériel compté une seule fois (projet futur ou actif du registre, jamais les deux) ; aucun actif ni projet = inconnu, jamais 0.
  const budgetUsure=React.useCallback((dateKey:string)=>{
    const usure=usureAnnuelleLitre({plans:data.plans,assets:data.assets,transactions:data.transactions,moisReference:dateKey.slice(0,7)});
    if(!usure.lignes.length)return {amountCHF:undefined,warnings:[...usure.avertissements,'Aucun matériel au registre : usure à renseigner.']};
    return {amountCHF:usure.complet?usure.totalCents/100:undefined,warnings:usure.avertissements};
  },[data.plans,data.assets,data.transactions]);
  return <><BrewBudgetSheet open onClose={onClose} onNoteDensity={onNoteDensity} onMesures={onMesures} profile={data.profile} onRegistre={()=>setRegistre(true)} onTarif={batch?()=>setTarif(true):undefined} recipe={recipe} batch={batch} config={data.config} batches={data.batches} stockItems={[...data.stocks.rawMaterials,...data.stocks.cleaning]} transactions={data.transactions}
    savedEstimates={data.plans.filter(p=>p.brewEstimate).map(p=>p.brewEstimate as BrewBudgetSnapshot)} savedEstimate={previous?.brewEstimate as BrewBudgetSnapshot|undefined} settings={{annualVolumeL:data.profile.annualProductionL,annualFixedCHF:annualFixed.amountCHF}} settingsWarnings={annualFixed.warnings} usureForBudgetDate={budgetUsure}
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
      if(addToPlan){StorageService.setUiState('finances_workspace','forecast');onOpenForecast?.({planId:id,batchId:batch?.id});}
    }}/>
    {registre&&<React.Suspense fallback={null}><AssetSheet onClose={()=>setRegistre(false)}/></React.Suspense>}
    {tarif&&batch&&<React.Suspense fallback={null}><PrixFeuille config={data.config} batch={batch} onClose={()=>setTarif(false)}/></React.Suspense>}
  </>
}

export function BrewBudgetButton({recipe,batch,onNoteDensity}:{recipe?:Recipe;batch?:Batch;onNoteDensity?:()=>void}) {
  const [open,setOpen]=React.useState(false);
  return <><button type="button" className="min-h-touch rounded-control border border-cave-700 px-2.5 py-0 my-1 text-sm leading-tight text-ebc-straw font-semibold text-left" onClick={()=>setOpen(true)}>Estimer le budget de ce brassin</button>{open&&<BrewBudgetDialog recipe={recipe} batch={batch} onNoteDensity={onNoteDensity} onClose={()=>setOpen(false)}/>}</>;
}
