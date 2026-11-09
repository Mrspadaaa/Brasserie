import React, { useEffect, useMemo, useRef, useState } from 'react';
import { compte } from '../../services/plural';
import { Plus, ChevronRight, Settings2, CalendarDays, Wheat, Wrench, Check, X } from 'lucide-react';
import type { Transaction, BudgetLine, AppConfig, TimeFilterPeriod, Recipe, Batch, StockItem } from '../../types';
import type { FinancialAsset, FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { StorageService } from '../../services/storage';
import { useStorageValue, useLiveSelection } from '../../hooks/useLiveData';
import { tvaThresholdStatus } from '../../domain/finance/tvaThreshold';
import { formatCHF, isoDate, todayISO, transactionAmount, transactionKind, transactionDirection, transactionVendor, isActiveTransaction, paymentState, summarizeLedger } from '../../domain/finance/ledger';

import { buildAnnualReport } from '../../domain/finance/annual';
import { TaxWorkspace } from '../../ui/finance/TaxWorkspace';
import type { BrewBudgetSnapshot } from '../../domain/finance/brewBudget';
import { Sheet } from '../../ui/Sheet';
import { ProfileSheet, PlanSheet, AssetSheet, ClosingSheet, PaymentSheet, Field, ExerciceField, CATEGORY_LABELS, idFor } from '../../ui/finance/FinanceForms';
import { BrewBudgetDialog } from '../../ui/finance/BrewBudgetDialog';
import { TransactionDetails } from '../../ui/finance/TransactionDetails';
import { MovementSheet } from '../../ui/finance/MovementSheet';
import { ArchiveManagerSheet } from '../../ui/finance/ArchiveManagerSheet';
import { TransactionJournal, createJournalState, type JournalRequest } from '../../ui/finance/TransactionJournal';
import { TransactionRow } from '../../ui/finance/TransactionRow';
import { CostComposition } from '../../ui/finance/CostComposition';
import { FinancePeriodBar, MonthStepper } from '../../ui/finance/FinancePeriod';
import { monthLabel, shortDate } from '../../ui/finance/financeFormat';
import { FinanceOverview } from '../../ui/finance/FinanceOverview';
import { FinanceAssistant } from '../../ui/finance/FinanceAssistant';
import { UpgradeAnalytics } from '../../ui/finance/UpgradeWorkspace';
import { Previsions, type CiblePrevoir } from '../../ui/finance/previsions/Previsions';
import { UpgradeSheet } from '../../ui/finance/UpgradeSheet';
import { isUpgradePlan } from '../../domain/finance/upgrades';
import { EditTransactionModal } from '../EditTransactionModal';
import '../../ui/finance/finance.css';
import { nombreFr } from '../../domain/nombreAffiche';

interface FinancesTabProps {
  transactions:Transaction[]; budgetLines:BudgetLine[]; config:AppConfig; globalTimeFilter:TimeFilterPeriod;
  recipes?:Recipe[]; batches?:Batch[]; stockItems?:StockItem[];
  openTransactionRequest?:{id:string;at:number}|null;
  /** Renvoi vers l’article acheté, depuis le détail d’une opération. */
  onOpenStockItem?:(ref:string)=>void;
  /** Renvoi vers la recette estimée par un budget de brassin. */
  onOpenRecipe?:(recipeId:string)=>void;
  /** Bouton « Vente » de l’écran Prévisions : la porte unique vers la saisie de vente (câblée par App). Absent : le bouton n’est pas affiché. */
  onOpenSale?:()=>void;
}
const readFinance=()=>FinanceService.snapshot();
const views=[['overview','Synthèse'],['journal','Opérations'],['forecast','Prévisions'],['annual','Annuel']] as const;
type FinanceView = typeof views[number][0];
const initialView = (): FinanceView => {
  const saved = StorageService.getUiState<string>('finances_workspace', 'overview');
  if (saved === 'projects') return 'forecast';
  return views.some(([key]) => key === saved) ? saved as FinanceView : 'overview';
};
const EMPTY: never[]=[];

export function FinancesTab({transactions,config,recipes=EMPTY,batches=EMPTY,stockItems=EMPTY,openTransactionRequest,onOpenStockItem,onOpenRecipe,onOpenSale}:FinancesTabProps) {
  const data=useStorageValue(readFinance);
  const archives=useStorageValue(FinancialArchiveService.getArchives);
  const [archiveOpen,setArchiveOpen]=useState(false),[journalRequest,setJournalRequest]=useState<JournalRequest>();
  const [journalState,setJournalState]=useState(createJournalState);
  const handledOpenRequest=useRef<string>('');
  const [view,setView]=useState<FinanceView>(initialView);
  const [overviewPart,setOverviewPart]=useState<'situation'|'costs'>('situation');
  const projetsRef=useRef(StorageService.getUiState<string>('finances_workspace','overview')==='projects'),[cible,setCible]=useState<CiblePrevoir|null>(null);
  const [month,setMonth]=useState(todayISO().slice(0,7)),[allDates,setAllDates]=useState(false);
  const [year,setYear]=useState(new Date().getFullYear()),[horizon,setHorizon]=useState<30|90|365>(90);
  const [upgrade,setUpgrade]=useState<FinancialPlan|null|undefined>();
  const [includeEquipmentProjects,setIncludeEquipmentProjects]=useState(true);
  const [movement,setMovement]=useState<Transaction|null|undefined>(undefined),[closingId,setClosingId]=useState('');
  const [profileOpen,setProfileOpen]=useState(false);
  const [plan,setPlan]=useState<FinancialPlan|null|undefined>(undefined),[asset,setAsset]=useState<FinancialAsset|null|undefined>(undefined),[closingOpen,setClosingOpen]=useState(false);
  const [selected,setSelected]=useLiveSelection(transactions,'id'),[paying,setPaying]=useState<Transaction|null>(null),[editing,setEditing]=useState<Transaction|null>(null);
  const [budgetPicker,setBudgetPicker]=useState(false),[budget,setBudget]=useState<{recipe?:Recipe;batch?:Batch}|null>(null),[notice,setNotice]=useState('');
  const ledger=useMemo(()=>summarizeLedger(transactions,data.payments,data.profile,undefined,{includeScheduled:true}),[transactions,data.payments,data.profile]);
  /* AM n° 10 : le seuil d'assujettissement à la TVA (100 000 CHF sur 12 mois glissants) est surveillé tant que l'app est non assujettie. */
  const tvaThreshold=useMemo(()=>tvaThresholdStatus(transactions,todayISO(),config.fiscal.tvaThresholdTurnover,config.fiscal.isTvaRegistered||!!data.profile.vatRegistered),[transactions,config.fiscal.tvaThresholdTurnover,config.fiscal.isTvaRegistered,data.profile.vatRegistered]);
  const openingCashReady=!!(data.profile.openingCash?.confirmed && isoDate(data.profile.openingCash.date) && isoDate(data.profile.openingCash.date)!<=todayISO() && Number.isSafeInteger(data.profile.openingCash.amountCents));
  const active=useMemo(()=>transactions.filter(isActiveTransaction),[transactions]);
  const undated=useMemo(()=>active.filter(t=>!isoDate(t.date)),[active]);
  const period=useMemo(()=>active.filter(t=>allDates||isoDate(t.date)?.startsWith(month)),[active,allDates,month]);
  const isCost=(t:Transaction)=>transactionKind(t)==='expense'||transactionKind(t)==='refund'&&transactionDirection(t,transactions)==='in';
  const costSign=(t:Transaction)=>transactionKind(t)==='refund'?-1:1;
  const expenses=useMemo(()=>period.filter(isCost),[period]);
  const totals=useMemo(()=>{const sums=new Map<string,number>();for(const t of expenses){if(t.finance?.lines.length){for(const l of t.finance.lines){const cat=l.category??(l.kind==='equipment'?'materiel':l.kind==='cleaning'?'nettoyage':['ingredient','packaging'].includes(l.kind)?'brassage':t.category);sums.set(cat,(sums.get(cat)??0)+costSign(t)*l.amountCents);}}else sums.set(t.category,(sums.get(t.category)??0)+costSign(t)*transactionAmount(t));}return [...sums.entries()].sort((a,b)=>b[1]-a[1]);},[expenses]);
  const sum=useMemo(()=>expenses.reduce((n,t)=>n+costSign(t)*transactionAmount(t),0),[expenses]);
  const vendors=useMemo(()=>{const sums=new Map<string,number>();expenses.forEach(t=>{const v=transactionVendor(t)||'Fournisseur à compléter';sums.set(v,(sums.get(v)??0)+costSign(t)*transactionAmount(t));});return [...sums.entries()].sort((a,b)=>b[1]-a[1]);},[expenses]);
  const previousMonth=new Date(Number(month.slice(0,4)),Number(month.slice(5))-2,1);const previousKey=`${previousMonth.getFullYear()}-${String(previousMonth.getMonth()+1).padStart(2,'0')}`;
  const previousTotal=useMemo(()=>active.reduce((n,t)=>isCost(t)&&isoDate(t.date)?.startsWith(previousKey)?n+costSign(t)*transactionAmount(t):n,0),[active,previousKey]);
  const openPlan=(p:FinancialPlan)=>{if(isUpgradePlan(p))setUpgrade(p);else setPlan(p);};
  const yearClosings=data.closings.filter(c=>c.year===year);
  const latestClosing=yearClosings.find(c=>c.id===closingId)??yearClosings[0];
  const annual=useMemo(()=>latestClosing?.report??buildAnnualReport({year,transactions,payments:data.payments,assets:data.assets,profile:{...data.profile,vatRegistered:data.profile.vatRegistered||config.fiscal.isTvaRegistered},closing:latestClosing}),[year,transactions,data,latestClosing,config.fiscal.isTvaRegistered]);
  const snapshots=useMemo(()=>{const seen=new Set<string>();return data.plans.filter(p=>p.brewEstimate).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(p=>{const s=p.brewEstimate as BrewBudgetSnapshot,key=s.batchId??s.recipeId??p.id;if(seen.has(key))return false;seen.add(key);return true;});},[data.plans]);
  const selectView=(v:FinanceView)=>{setView(v);StorageService.setUiState('finances_workspace',v);};
  const showProjects=()=>{projetsRef.current=true;selectView('forecast');};
  const openJournal=(request:Omit<JournalRequest,'key'>)=>{setJournalRequest({...request,key:crypto.randomUUID()});selectView('journal');};
  useEffect(()=>{
    if(!openTransactionRequest)return;
    const key=`${openTransactionRequest.id}:${openTransactionRequest.at}`;
    if(handledOpenRequest.current===key)return;
    const transaction=transactions.find(t=>t.id===openTransactionRequest.id);
    if(!transaction)return;
    handledOpenRequest.current=key;
    setSelected(transaction);
    setView('journal');StorageService.setUiState('finances_workspace','journal');
    setJournalRequest({key,scope:'all',query:transaction.id,allDates:true});
  },[openTransactionRequest,transactions]);
  const assistantView=view==='overview'?'costs':view;
  const financeAssistant=<FinanceAssistant view={assistantView} month={month} allDates={allDates} year={year} horizon={horizon} includeEquipmentProjects={includeEquipmentProjects}/>;
  const row=(t:Transaction,state?:ReturnType<typeof paymentState>)=><TransactionRow key={t.id} transaction={t} transactions={transactions} payments={data.payments} state={state} onOpen={()=>setSelected(t)}/>;
  return <div className="finance">
    <nav className="finance-nav" role="tablist" aria-label="Finances">{views.map(([key,label])=><button type="button" key={key} id={`finance-tab-${key}`} role="tab" tabIndex={view===key?0:-1} aria-selected={view===key} aria-controls={`finance-${key}`} onClick={()=>selectView(key)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=views.findIndex(v=>v[0]===key);const next=e.key==='Home'?0:e.key==='End'?views.length-1:(index+(e.key==='ArrowRight'?1:views.length-1))%views.length;selectView(views[next][0]);(e.currentTarget.parentElement?.querySelectorAll('button')[next] as HTMLButtonElement|undefined)?.focus();}}>{label}</button>)}</nav>
    {/* Titre, sous-vue et réglages sur une seule rangée : trois barres empilées
        mangeaient un tiers de l'écran avant la première donnée. */}
    {view!=='forecast'&&<div className="finance-bar">
      <h2>{views.find(([key])=>key===view)?.[1]}</h2>
      {view==='overview'&&<div className="finance-subnav" role="group" aria-label="Lecture de la synthèse"><button type="button" aria-pressed={overviewPart==='situation'} onClick={()=>setOverviewPart('situation')}>Situation</button><button type="button" aria-pressed={overviewPart==='costs'} onClick={()=>setOverviewPart('costs')}>Coûts</button></div>}
      {/* Achat et vente vivent dans le bouton d'action flottant, sur tous les écrans. */}
      <button type="button" className="finance-icon-action" aria-label="Solde et paramètres financiers" onClick={()=>setProfileOpen(true)}><Settings2 size={16}/></button>
    </div>}
    {notice&&<div className="finance-notice" role="status"><span>{notice}</span>{' '}<button className="finance-link" style={{marginInlineStart:'0.5rem'}} onClick={()=>setNotice('')}>Fermer</button></div>}
    <section role="tabpanel" id={`finance-${view}`} aria-labelledby={`finance-tab-${view}`}>
      {view==='overview'&&overviewPart==='situation'&&<><FinanceOverview ledger={ledger} tvaThreshold={tvaThreshold} openingCashReady={openingCashReady} openingCash={data.profile.openingCash} undatedCount={undated.length} onProfile={()=>setProfileOpen(true)} onJournal={openJournal} onTransaction={id=>setSelected(transactions.find(t=>t.id===id)??null)} onPayment={id=>setPaying(transactions.find(t=>t.id===id)??null)}/>{financeAssistant}</>}
      {view==='overview'&&overviewPart==='costs'&&<>
        {/* La période commande, son total répond : les deux sur la même rangée. */}
        <FinancePeriodBar lead total={formatCHF(sum)} totalLabel="Dépenses nettes enregistrées sur la période"
          count="Dépenses nettes"
          context={!allDates&&previousTotal>0?`${sum>=previousTotal?'+':'−'}${formatCHF(Math.abs(sum-previousTotal))} sur ${monthLabel(previousKey)}${month===todayISO().slice(0,7)?' · mois en cours':''}`:allDates?'Tout l’historique':undefined}>
          <MonthStepper label="Période des coûts" month={month} disabled={allDates} onMonth={value=>{setMonth(value);setAllDates(false);}}/>
          <button type="button" className="journal-chip" aria-pressed={allDates} onClick={()=>setAllDates(!allDates)}>{allDates?<Check size={13} aria-hidden="true"/>:<CalendarDays size={13} aria-hidden="true"/>}Tout l’historique</button>
        </FinancePeriodBar>
        {undated.length>0&&<p className="finance-notice">{compte(undated.length, 'pièce')} avec une date à corriger. <button className="finance-link" onClick={()=>openJournal({scope:'all',allDates:true,filter:'review'})}>Retrouver ces pièces dans l’historique</button></p>}
        <div className="finance-columns"><section className="finance-section"><div className="finance-heading"><h3>Répartition des dépenses</h3></div>{totals.length?<CostComposition parts={totals.map(([cat,amount])=>({key:cat,label:CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]??cat,amountCents:amount}))} onSelect={cat=>openJournal({scope:'all',category:cat,month,allDates})}/>:<div className="finance-empty"><Wheat className="mx-auto"/><h3>Aucune dépense sur cette période</h3><p>Le bouton + enregistre un achat ; ses coûts apparaîtront ici.</p></div>}</section>
        <section className="finance-section"><div className="finance-heading"><h3>Coût des brassins</h3></div>{snapshots.length?<div className="finance-list">{snapshots.slice(0,6).map(p=>{const s=p.brewEstimate as BrewBudgetSnapshot;return <button className="finance-row" key={p.id} onClick={()=>{const batch=batches.find(b=>b.id===s.batchId),recipe=recipes.find(r=>r.id===s.recipeId);if(batch||recipe)setBudget({batch,recipe});else setNotice('La recette de ce budget est absente. Le budget enregistré reste conservé.');}}><div className="finance-row-main"><strong>{s.title}</strong><span className="finance-muted">{nombreFr(s.netVolumeL, 1)} L · {s.complete?'Estimation enregistrée':'Estimation partielle'}</span></div><span className="finance-money">{s.costPerL!=null?`${formatCHF(Math.round(s.costPerL*100))}/L`:'À compléter'}</span><ChevronRight size={16}/></button>;})}</div>:<p className="finance-muted">Estime un brassin pour connaître son coût par litre et les achats nécessaires.</p>}<button className="finance-link" onClick={()=>setBudgetPicker(true)}><Plus size={18}/>Estimer un brassin</button></section></div>
        {!!vendors.length&&<section className="finance-section"><h3>Principaux fournisseurs</h3><div className="finance-list">{vendors.slice(0,5).map(([name,amount])=><button key={name} className="finance-row finance-row-tight" onClick={()=>openJournal({scope:'all',query:name==='Fournisseur à compléter'?'':name,month,allDates})}><span className="finance-row-main">{name}</span><span className="finance-money">{formatCHF(amount)}</span><ChevronRight size={15}/></button>)}</div></section>}
        <details className="finance-disclosure"><summary>Investissements et matériel</summary><UpgradeAnalytics plans={data.plans} transactions={transactions} payments={data.payments} onOpen={setUpgrade} onBrowse={showProjects}/><p className="finance-muted"><Wrench size={15} className="inline align-text-bottom mr-1"/>Un achat de matériel s’enregistre comme une facture, depuis le bouton +.</p></details>
        {financeAssistant}
      </>}
      {view==='journal'&&<><TransactionJournal transactions={transactions} payments={data.payments} archives={archives} state={journalState} onStateChange={setJournalState} request={journalRequest} renderRow={row} onManageArchives={()=>setArchiveOpen(true)} onPrivateMovement={()=>setMovement(null)}/>{financeAssistant}</>}
      {view==='forecast'&&<Previsions asOf={todayISO()} horizon={horizon} onHorizon={setHorizon} transactions={transactions} payments={data.payments} plans={data.plans} profile={data.profile} assets={data.assets} batches={batches} stockItems={stockItems}
        ledger={ledger} openingCashReady={openingCashReady} avecProjets={includeEquipmentProjects} onAvecProjets={setIncludeEquipmentProjects}
        onProfile={()=>setProfileOpen(true)} onPayments={()=>openJournal({scope:'all',allDates:true,filter:'unknown'})} onOpenTransaction={setSelected} onOpenPlan={openPlan} onOpenUpgrade={setUpgrade}
        onAddPlan={()=>setPlan(null)} onBudgetPicker={()=>setBudgetPicker(true)} onOpenBudget={b=>setBudget({batch:b})} onNotice={setNotice} onSale={onOpenSale}
        cible={cible} onCibleTraitee={()=>setCible(null)} projetsOuverts={projetsRef.current}>{financeAssistant}</Previsions>}
      {view==='annual'&&<>
        <div className="finance-period-toolbar"><ExerciceField year={year} onYear={value=>{setYear(value);setClosingId('');}}/></div>
        {!!yearClosings.length&&<Field label="Version de l’année"><select value={latestClosing?.id??''} onChange={e=>setClosingId(e.target.value)}>{yearClosings.map(c=><option key={c.id} value={c.id}>{c.report?'Version figée':'Brouillon'} · {new Date(c.createdAt).toLocaleString('fr-CH')}</option>)}</select></Field>}
        <TaxWorkspace key={year} report={annual} closing={latestClosing} transactions={transactions} assets={data.assets} profile={data.profile} companyName={config.company.name} onProfile={()=>setProfileOpen(true)} onInventories={()=>setClosingOpen(true)} onAsset={setAsset} onVersion={setClosingId} onOperations={()=>openJournal({scope:'all',year:String(year),allDates:true,filter:'review'})}/>
        <button className="finance-link" onClick={()=>setArchiveOpen(true)}>Gérer les archives par année<ChevronRight size={16}/></button>
        {financeAssistant}
      </>}
    </section>
    {archiveOpen&&<ArchiveManagerSheet transactions={transactions} payments={data.payments} archives={archives} closings={data.closings} onClose={()=>setArchiveOpen(false)} onSaved={setNotice} onBrowse={(year,archived)=>{setArchiveOpen(false);openJournal(archived?{scope:'archives',archiveYear:String(year),allDates:true}:{scope:'all',year:String(year),allDates:true});}}/>}
    {profileOpen&&<ProfileSheet profile={data.profile} onClose={()=>setProfileOpen(false)}/>}
    {upgrade!==undefined&&<UpgradeSheet plan={upgrade??undefined} onClose={()=>setUpgrade(undefined)} onOpenTransaction={tx=>{setUpgrade(undefined);setSelected(tx);}}/>}
    {plan!==undefined&&<PlanSheet plan={plan??undefined} onClose={()=>setPlan(undefined)}/>}
    {asset!==undefined&&<AssetSheet asset={asset??undefined} onClose={()=>setAsset(undefined)}/>}
    {closingOpen&&<ClosingSheet year={year} closing={latestClosing?.report?{...latestClosing,id:idFor(`CLOTURE-${year}`),createdAt:new Date().toISOString(),report:undefined}:latestClosing} stockItems={stockItems} onClose={()=>{setClosingOpen(false);setClosingId('');}}/>}
    {paying&&<PaymentSheet transaction={transactions.find(t=>t.id===paying.id)??paying} payments={data.payments} transactions={transactions} onClose={()=>setPaying(null)}/>}
    {editing&&<EditTransactionModal isOpen transaction={transactions.find(t=>t.id===editing.id)??editing} onClose={()=>setEditing(null)} onSave={()=>setNotice('Opération mise à jour.')}/>}
    {movement!==undefined&&<MovementSheet original={movement??undefined} onClose={()=>setMovement(undefined)} onSaved={()=>setNotice('Mouvement enregistré.')}/>}
    {selected&&<TransactionDetails transaction={selected} transactions={transactions} payments={data.payments} plans={data.plans} onClose={()=>setSelected(null)} onEdit={()=>{setEditing(selected);setSelected(null);}} onPay={()=>{setPaying(selected);setSelected(null);}} onRefund={()=>{setMovement(selected);setSelected(null);}} onOpenStockItem={onOpenStockItem&&(ref=>{setSelected(null);onOpenStockItem(ref);})} onOpenRecipe={onOpenRecipe&&(id=>{setSelected(null);onOpenRecipe(id);})}/>}
    {budgetPicker&&<Sheet open title="Quel brassin veux-tu estimer ?" onClose={()=>setBudgetPicker(false)} className="finance-sheet"><div className="finance-list">{batches.filter(b=>b.status==='planifie').map(b=><button key={b.id} className="finance-row" onClick={()=>{setBudget({batch:b});setBudgetPicker(false);}}><span className="finance-row-main"><strong>{b.name}</strong><span className="finance-muted">{b.id} · {nombreFr(b.volumeL, 1)} L</span></span><ChevronRight size={18}/></button>)}{recipes.map(r=><button key={r.id} className="finance-row" onClick={()=>{setBudget({recipe:r});setBudgetPicker(false);}}><span className="finance-row-main"><strong>{r.name}</strong><span className="finance-muted">Recette · {nombreFr(r.volumeL, 1)} L</span></span><ChevronRight size={18}/></button>)}{!recipes.length&&!batches.some(b=>b.status==='planifie')&&<p className="finance-notice">Crée d’abord une recette dans Brassins pour calculer ses besoins.</p>}</div></Sheet>}
    {budget&&<BrewBudgetDialog {...budget} onClose={()=>setBudget(null)} onOpenForecast={target=>{setBudget(null);selectView('forecast');setCible({...target,at:Date.now()});}}/>}
  </div>;
}
