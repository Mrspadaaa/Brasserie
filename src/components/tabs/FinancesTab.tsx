import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NumberInput } from '../../ui/NumberInput';
import { compte } from '../../services/plural';
import { Plus, ChevronRight, Settings2, CalendarDays, Wheat, Wrench, Check } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { Transaction, BudgetLine, AppConfig, TimeFilterPeriod, Recipe, Batch, StockItem } from '../../types';
import type { FinancialAsset, FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { StorageService } from '../../services/storage';
import { useStorageValue, useLiveSelection } from '../../hooks/useLiveData';
import { formatCHF, isoDate, todayISO, transactionAmount, transactionKind, transactionDirection, transactionVendor, isActiveTransaction, paymentState, summarizeLedger } from '../../domain/finance/ledger';
import { buildForecast, forecastHorizonEnd, type ForecastItem } from '../../domain/finance/forecast';
import { buildAnnualReport } from '../../domain/finance/annual';
import { TaxWorkspace } from '../../ui/finance/TaxWorkspace';
import type { BrewBudgetSnapshot } from '../../domain/finance/brewBudget';
import { Sheet } from '../../ui/Sheet';
import { ProfileSheet, PlanSheet, AssetSheet, ClosingSheet, PaymentSheet, Field, CATEGORY_LABELS, idFor } from '../../ui/finance/FinanceForms';
import { ExpenseSheet } from '../../ui/finance/ExpenseSheet';
import { BrewBudgetDialog } from '../../ui/finance/BrewBudgetDialog';
import { TransactionDetails } from '../../ui/finance/TransactionDetails';
import { MovementSheet } from '../../ui/finance/MovementSheet';
import { ArchiveManagerSheet } from '../../ui/finance/ArchiveManagerSheet';
import { TransactionJournal, createJournalState, type JournalRequest } from '../../ui/finance/TransactionJournal';
import { FinanceOverview } from '../../ui/finance/FinanceOverview';
import { FinanceForecastSummary } from '../../ui/finance/FinanceForecastSummary';
import { FinanceAssistant } from '../../ui/finance/FinanceAssistant';
import { UpgradeWorkspace, UpgradeAnalytics, upgradeDateLabel } from '../../ui/finance/UpgradeWorkspace';
import { UpgradeSheet } from '../../ui/finance/UpgradeSheet';
import { isUpgradePlan } from '../../domain/finance/upgrades';
import { EditTransactionModal } from '../EditTransactionModal';
import { QuickActionModal } from '../QuickActionModal';
import '../../ui/finance/finance.css';

interface FinancesTabProps {
  transactions:Transaction[]; budgetLines:BudgetLine[]; config:AppConfig; globalTimeFilter:TimeFilterPeriod;
  onOpenQuickAction:()=>void; recipes?:Recipe[]; batches?:Batch[]; stockItems?:StockItem[];
  openTransactionRequest?:{id:string;at:number}|null;
}
const readFinance=()=>FinanceService.snapshot();
const views=[['overview','Synthèse'],['journal','Opérations'],['forecast','Prévisions'],['annual','Annuel']] as const;
type FinanceView = typeof views[number][0];
const initialView = (): FinanceView => {
  const saved = StorageService.getUiState<string>('finances_workspace', 'overview');
  if (saved === 'projects') return 'forecast';
  return views.some(([key]) => key === saved) ? saved as FinanceView : 'overview';
};
const labels={paid:'Payé',partial:'Partiellement payé',unpaid:'À payer',unknown:'Paiement à confirmer'};
const shortDate=(date?:string)=>{const d=isoDate(date);return d?new Date(`${d}T12:00:00`).toLocaleDateString('fr-CH',{day:'numeric',month:'short',year:d.slice(0,4)===todayISO().slice(0,4)?undefined:'numeric'}):'Date à vérifier';};
const monthLabel=(month:string)=>new Date(`${month}-01T12:00:00`).toLocaleDateString('fr-CH',{month:'long',year:'numeric'});
const EMPTY: never[]=[];

export function FinancesTab({transactions,config,recipes=EMPTY,batches=EMPTY,stockItems=EMPTY,openTransactionRequest}:FinancesTabProps) {
  const data=useStorageValue(readFinance);
  const archives=useStorageValue(FinancialArchiveService.getArchives);
  const [archiveOpen,setArchiveOpen]=useState(false),[journalRequest,setJournalRequest]=useState<JournalRequest>();
  const [journalState,setJournalState]=useState(createJournalState);
  const handledOpenRequest=useRef<string>('');
  const [view,setView]=useState<FinanceView>(initialView);
  const [overviewPart,setOverviewPart]=useState<'situation'|'costs'>('situation');
  const [forecastPart,setForecastPart]=useState<'timeline'|'projects'>(()=>StorageService.getUiState<string>('finances_workspace','overview')==='projects'?'projects':'timeline');
  const [saleOpen,setSaleOpen]=useState(false);
  const [month,setMonth]=useState(todayISO().slice(0,7)),[allDates,setAllDates]=useState(false);
  const [year,setYear]=useState(new Date().getFullYear()),[horizon,setHorizon]=useState<30|90|365>(90);
  const [upgrade,setUpgrade]=useState<FinancialPlan|null|undefined>();
  const [includeEquipmentProjects,setIncludeEquipmentProjects]=useState(true);
  const [upcomingLimit,setUpcomingLimit]=useState(6),[chartOpen,setChartOpen]=useState(false);
  const [movement,setMovement]=useState<Transaction|null|undefined>(undefined),[closingId,setClosingId]=useState('');
  const [profileOpen,setProfileOpen]=useState(false),[expenseOpen,setExpenseOpen]=useState(false),[newEquipment,setNewEquipment]=useState(false);
  const [plan,setPlan]=useState<FinancialPlan|null|undefined>(undefined),[asset,setAsset]=useState<FinancialAsset|null|undefined>(undefined),[closingOpen,setClosingOpen]=useState(false);
  const [selected,setSelected]=useLiveSelection(transactions,'id'),[paying,setPaying]=useState<Transaction|null>(null),[editing,setEditing]=useState<Transaction|null>(null);
  const [budgetPicker,setBudgetPicker]=useState(false),[budget,setBudget]=useState<{recipe?:Recipe;batch?:Batch}|null>(null),[notice,setNotice]=useState('');
  const ledger=useMemo(()=>summarizeLedger(transactions,data.payments,data.profile),[transactions,data.payments,data.profile]);
  const openingCashReady=!!(data.profile.openingCash?.confirmed && isoDate(data.profile.openingCash.date) && isoDate(data.profile.openingCash.date)!<=todayISO() && Number.isSafeInteger(data.profile.openingCash.amountCents));
  const active=useMemo(()=>transactions.filter(isActiveTransaction),[transactions]);
  const undated=active.filter(t=>!isoDate(t.date));
  const period=useMemo(()=>active.filter(t=>allDates||isoDate(t.date)?.startsWith(month)),[active,allDates,month]);
  const isCost=(t:Transaction)=>transactionKind(t)==='expense'||transactionKind(t)==='refund'&&transactionDirection(t,transactions)==='in';
  const costSign=(t:Transaction)=>transactionKind(t)==='refund'?-1:1;
  const expenses=useMemo(()=>period.filter(isCost),[period]);
  const totals=useMemo(()=>{const sums=new Map<string,number>();for(const t of expenses){if(t.finance?.lines.length){for(const l of t.finance.lines){const cat=l.category??(l.kind==='equipment'?'materiel':l.kind==='cleaning'?'nettoyage':['ingredient','packaging'].includes(l.kind)?'brassage':t.category);sums.set(cat,(sums.get(cat)??0)+costSign(t)*l.amountCents);}}else sums.set(t.category,(sums.get(t.category)??0)+costSign(t)*transactionAmount(t));}return [...sums.entries()].sort((a,b)=>b[1]-a[1]);},[expenses]);
  const sum=expenses.reduce((n,t)=>n+costSign(t)*transactionAmount(t),0);
  const vendors=useMemo(()=>{const sums=new Map<string,number>();expenses.forEach(t=>{const v=transactionVendor(t)||'Fournisseur à compléter';sums.set(v,(sums.get(v)??0)+costSign(t)*transactionAmount(t));});return [...sums.entries()].sort((a,b)=>b[1]-a[1]);},[expenses]);
  const previousMonth=new Date(Number(month.slice(0,4)),Number(month.slice(5))-2,1);const previousKey=`${previousMonth.getFullYear()}-${String(previousMonth.getMonth()+1).padStart(2,'0')}`;
  const previousTotal=active.filter(t=>isCost(t)&&isoDate(t.date)?.startsWith(previousKey)).reduce((n,t)=>n+costSign(t)*transactionAmount(t),0);
  const forecastWithProjects=useMemo(()=>buildForecast({transactions,payments:data.payments,plans:data.plans,profile:data.profile,months:13}),[transactions,data]);
  const forecast=useMemo(()=>includeEquipmentProjects?forecastWithProjects:buildForecast({transactions,payments:data.payments,plans:data.plans,profile:data.profile,months:13,includeEquipmentProjects:false}),[transactions,data,forecastWithProjects,includeEquipmentProjects]);
  const endKey=forecastHorizonEnd(todayISO(),horizon);
  const upcoming=forecast.items.filter(i=>i.date<endKey);
  const projectOut=forecastWithProjects.items.filter(i=>i.source==='equipment'&&i.date<endKey).reduce((sum,item)=>sum+item.amountCents,0);
  const openPlan=(p:FinancialPlan)=>{if(isUpgradePlan(p))setUpgrade(p);else setPlan(p);};
  const invoiceOut=upcoming.filter(i=>i.direction==='out'&&i.source==='invoice').reduce((s,i)=>s+i.amountCents,0);
  const estimatedOut=upcoming.filter(i=>i.direction==='out'&&i.source!=='invoice').reduce((s,i)=>s+i.amountCents,0);
  let projectedCash=ledger.cashComplete?ledger.cashCents:null;
  const forecastChart=forecast.months.filter(m=>m.month<endKey.slice(0,7)||(m.month===endKey.slice(0,7)&&endKey.slice(8)!=='01')).map(m=>{const rows=upcoming.filter(i=>i.date.startsWith(m.month));const out=rows.filter(i=>i.direction==='out').reduce((sum,i)=>sum+i.amountCents,0),income=rows.filter(i=>i.direction==='in').reduce((sum,i)=>sum+i.amountCents,0);if(projectedCash!=null)projectedCash+=income-out;return {label:monthLabel(m.month),expense:out/100,balance:projectedCash==null?null:projectedCash/100};});
  const yearClosings=data.closings.filter(c=>c.year===year);
  const latestClosing=yearClosings.find(c=>c.id===closingId)??yearClosings[0];
  const annual=useMemo(()=>latestClosing?.report??buildAnnualReport({year,transactions,payments:data.payments,assets:data.assets,profile:{...data.profile,vatRegistered:data.profile.vatRegistered||config.fiscal.isTvaRegistered},closing:latestClosing}),[year,transactions,data,latestClosing,config.fiscal.isTvaRegistered]);
  const snapshots=useMemo(()=>{const seen=new Set<string>();return data.plans.filter(p=>p.brewEstimate).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)).filter(p=>{const s=p.brewEstimate as BrewBudgetSnapshot,key=s.batchId??s.recipeId??p.id;if(seen.has(key))return false;seen.add(key);return true;});},[data.plans]);
  const selectView=(v:FinanceView)=>{setView(v);StorageService.setUiState('finances_workspace',v);};
  const showProjects=()=>{setForecastPart('projects');selectView('forecast');};
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
  const assistantView=view==='overview'?'costs':view==='forecast'&&forecastPart==='projects'?'projects':view;
  const financeAssistant=<FinanceAssistant view={assistantView} month={month} allDates={allDates} year={year} horizon={horizon} includeEquipmentProjects={includeEquipmentProjects}/>;
  const row=(t:Transaction)=>{const state=paymentState(t,data.payments,transactions,todayISO()),incoming=transactionDirection(t,transactions)==='in';return <button key={t.id} className="finance-row" onClick={()=>setSelected(t)}><div className="finance-row-main"><strong>{t.description}</strong><span className="finance-muted">{shortDate(t.date)} · {transactionVendor(t)||CATEGORY_LABELS[t.category]}</span></div><div className="finance-row-tail"><span className="finance-money">{incoming?'+ ':''}{formatCHF(transactionAmount(t))}</span><br/><span className={`finance-status ${state.overpaidCents>0?'alert':state.state}`}>{t.finance?.voidedAt?'Annulé':t.finance?.refundApplication==='offset'?'Imputé':state.overpaidCents>0?'Paiement à vérifier':state.state==='paid'&&state.appliedCreditCents>0?'Soldé':state.state==='partial'?<>Reste {formatCHF(state.remainingCents)}<br/>à {incoming?'encaisser':'payer'}</>:incoming&&state.state==='unpaid'?'À encaisser':incoming&&state.state==='paid'?'Encaissé':labels[state.state]}</span></div><ChevronRight size={16} className="shrink-0 text-cave-400"/></button>;};
  const forecastRow=(item:ForecastItem)=>{
    const invoice=item.source==='invoice'?transactions.find(t=>`invoice:${t.id}`===item.id):undefined;
    const linkedPlan=item.planId?data.plans.find(p=>p.id===item.planId):undefined;
    const due=isoDate(invoice?.finance?.dueDate);
    const when=invoice?!due?'Date à préciser':due<todayISO()?`En retard · ${shortDate(due)}`:shortDate(due):shortDate(item.date);
    const origin=item.source==='equipment'?'Projet de matériel':item.source==='trend'?'Estimation historique':item.source==='invoice'?'Facture':item.source==='brew'?(linkedPlan?.brewEstimate as BrewBudgetSnapshot|undefined)?.complete===false?'Brassin · à compléter':'Brassin':'Planifié';
    const title=item.source==='trend'?`Dépenses courantes · ${CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]??item.category}`:item.label;
    return <button className="finance-row" key={item.id} onClick={()=>{
      if(invoice)setSelected(invoice);
      else if(linkedPlan)openPlan(linkedPlan);
      else setNotice('Tendance calculée sur les dépenses courantes des mois complets, hors investissements et dépenses déjà planifiées.');
    }}><div className="finance-row-main"><strong>{title}</strong><span className="finance-muted">{item.source==='equipment'&&linkedPlan?upgradeDateLabel(linkedPlan):when} · {origin}</span></div><span className="finance-money">{item.direction==='in'?'+ ':''}{formatCHF(item.amountCents)}</span><ChevronRight size={16}/></button>;
  };
  return <div className="finance">
    <nav className="finance-nav" role="tablist" aria-label="Finances">{views.map(([key,label])=><button type="button" key={key} id={`finance-tab-${key}`} role="tab" tabIndex={view===key?0:-1} aria-selected={view===key} aria-controls={`finance-${key}`} onClick={()=>selectView(key)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=views.findIndex(v=>v[0]===key);const next=e.key==='Home'?0:e.key==='End'?views.length-1:(index+(e.key==='ArrowRight'?1:views.length-1))%views.length;selectView(views[next][0]);(e.currentTarget.parentElement?.querySelectorAll('button')[next] as HTMLButtonElement|undefined)?.focus();}}>{label}</button>)}</nav>
    <div className="finance-page-heading">
      <h2>{view==='overview'?'Situation financière':view==='journal'?'Mes opérations':view==='forecast'?'Anticiper les dépenses':'Bilan et impôts'}</h2>
      {(view==='overview'||view==='journal')&&<div className="finance-entry-actions"><button type="button" className="finance-action" aria-label="Ajouter une dépense" onClick={()=>setExpenseOpen(true)}><Plus size={15}/>Achat</button><button type="button" className="finance-action secondary" aria-label="Enregistrer une vente" onClick={()=>setSaleOpen(true)}>Vente</button></div>}
      <button type="button" className="finance-icon-action" aria-label="Solde et paramètres financiers" onClick={()=>setProfileOpen(true)}><Settings2 size={16}/></button>
    </div>
    {notice&&<div className="finance-notice" role="status">{notice}<button className="finance-link" onClick={()=>setNotice('')}>Fermer</button></div>}
    <section role="tabpanel" id={`finance-${view}`} aria-labelledby={`finance-tab-${view}`}>
      {view==='overview'&&<div className="finance-subnav" role="group" aria-label="Lecture de la synthèse"><button type="button" aria-pressed={overviewPart==='situation'} onClick={()=>setOverviewPart('situation')}>Situation</button><button type="button" aria-pressed={overviewPart==='costs'} onClick={()=>setOverviewPart('costs')}>Coûts</button></div>}
      {view==='overview'&&overviewPart==='situation'&&<><FinanceOverview ledger={ledger} openingCashReady={openingCashReady} undatedCount={undated.length} onProfile={()=>setProfileOpen(true)} onJournal={openJournal} onTransaction={id=>setSelected(transactions.find(t=>t.id===id)??null)} onPayment={id=>setPaying(transactions.find(t=>t.id===id)??null)}/>{financeAssistant}</>}
      {view==='overview'&&overviewPart==='costs'&&<>
        <div className="finance-period-toolbar"><Field label="Période des coûts"><input type="month" value={month} onChange={e=>{if(e.target.value){setMonth(e.target.value);setAllDates(false);}}}/></Field><button type="button" className="finance-link" aria-pressed={allDates} onClick={()=>setAllDates(!allDates)}>{allDates?<Check size={14}/>:<CalendarDays size={14}/>}Tout l’historique</button></div>
        {undated.length>0&&<p className="finance-notice">{compte(undated.length, 'pièce')} avec une date à corriger. <button className="finance-link" onClick={()=>openJournal({scope:'all',allDates:true,filter:'review'})}>Retrouver ces pièces dans l’historique</button></p>}
        <div className="finance-cost-total"><div><span className="finance-label">Dépenses nettes enregistrées</span><small className="finance-muted">{allDates?'Tout l’historique':monthLabel(month)}</small></div><strong className="finance-money">{formatCHF(sum)}</strong></div>
        {!allDates&&previousTotal>0&&<p className="finance-muted">{sum>=previousTotal?'+':'−'}{formatCHF(Math.abs(sum-previousTotal))} par rapport à {monthLabel(previousKey)}{month===todayISO().slice(0,7)?' · mois en cours':''}</p>}
        <div className="finance-columns"><section className="finance-section"><div className="finance-heading"><h3>Répartition des dépenses</h3></div>{totals.length?<div className="finance-bars">{totals.map(([cat,amount])=><button className="finance-bar" key={cat} onClick={()=>openJournal({scope:'all',category:cat,month,allDates})}><span>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]??cat}</span><span className="finance-bar-track"><span className="finance-bar-fill" style={{display:'block',width:`${Math.min(100,Math.max(0,amount/Math.max(1,sum)*100))}%`}}/></span><span className="finance-money">{formatCHF(amount)}</span></button>)}</div>:<div className="finance-empty"><Wheat className="mx-auto"/><h3>Aucune dépense sur cette période</h3><p>Ajoute un achat pour retrouver ici les coûts de ta brasserie.</p><button className="finance-link mx-auto" onClick={()=>setExpenseOpen(true)}>Ajouter une dépense</button></div>}</section>
        <section className="finance-section"><div className="finance-heading"><h3>Coût des brassins</h3></div>{snapshots.length?<div className="finance-list">{snapshots.slice(0,6).map(p=>{const s=p.brewEstimate as BrewBudgetSnapshot;return <button className="finance-row" key={p.id} onClick={()=>{const batch=batches.find(b=>b.id===s.batchId),recipe=recipes.find(r=>r.id===s.recipeId);if(batch||recipe)setBudget({batch,recipe});else setNotice('La recette de ce budget est absente. Le budget enregistré reste conservé.');}}><div className="finance-row-main"><strong>{s.title}</strong><span className="finance-muted">{s.netVolumeL} L · {s.complete?'Estimation enregistrée':'Estimation partielle'}</span></div><span className="finance-money">{s.costPerL!=null?`${formatCHF(Math.round(s.costPerL*100))}/L`:'À compléter'}</span><ChevronRight size={16}/></button>;})}</div>:<p className="finance-muted">Estime un brassin pour connaître son coût par litre et les achats nécessaires.</p>}<button className="finance-link" onClick={()=>setBudgetPicker(true)}><Plus size={18}/>Estimer un brassin</button></section></div>
        {!!vendors.length&&<section className="finance-section"><h3>Principaux fournisseurs</h3><div className="finance-list">{vendors.slice(0,5).map(([name,amount])=><button key={name} className="finance-row" onClick={()=>openJournal({scope:'all',query:name==='Fournisseur à compléter'?'':name,month,allDates})}><span className="finance-row-main">{name}</span><span className="finance-money">{formatCHF(amount)}</span><ChevronRight size={16}/></button>)}</div></section>}
        <details className="finance-disclosure"><summary>Investissements et matériel</summary><UpgradeAnalytics plans={data.plans} transactions={transactions} payments={data.payments} onOpen={setUpgrade} onBrowse={showProjects}/><button type="button" className="finance-link" onClick={()=>{setNewEquipment(true);setExpenseOpen(true);}}><Wrench size={15}/>Enregistrer un achat de matériel</button></details>
        {financeAssistant}
      </>}
      {view==='journal'&&<><TransactionJournal transactions={transactions} payments={data.payments} archives={archives} state={journalState} onStateChange={setJournalState} request={journalRequest} renderRow={row} onManageArchives={()=>setArchiveOpen(true)} onSale={()=>setSaleOpen(true)} onPrivateMovement={()=>setMovement(null)}/>{financeAssistant}</>}
      {view==='forecast'&&<div className="finance-subnav" role="group" aria-label="Prévisions et projets"><button type="button" aria-pressed={forecastPart==='timeline'} onClick={()=>setForecastPart('timeline')}>Échéances</button><button type="button" aria-pressed={forecastPart==='projects'} onClick={()=>setForecastPart('projects')}>Projets de matériel</button></div>}
      {view==='forecast'&&forecastPart==='timeline'&&<>
        <div className="finance-filter" role="group" aria-label="Horizon de prévision">{[[30,'30 jours'],[90,'90 jours'],[365,'12 mois']].map(([value,label])=><button key={value} aria-pressed={horizon===value} onClick={()=>{setHorizon(Number(value) as 30|90|365);setUpcomingLimit(6);}}>{label}</button>)}</div>
        <FinanceForecastSummary ledger={ledger} openingCashReady={openingCashReady} warnings={forecast.warnings} invoiceOut={invoiceOut} estimatedOut={estimatedOut} incoming={upcoming.filter(item=>item.direction==='in').reduce((total,item)=>total+item.amountCents,0)} projectedCash={projectedCash} horizonLabel={horizon===365?'12 mois':`${horizon} jours`} onProfile={()=>setProfileOpen(true)} onPayments={()=>openJournal({scope:'all',allDates:true,filter:'unknown'})}/>
        {projectOut>0&&<div className="upgrade-forecast-impact"><label className="finance-check"><input type="checkbox" checked={includeEquipmentProjects} onChange={e=>setIncludeEquipmentProjects(e.target.checked)}/>Inclure mes projets de matériel · {formatCHF(projectOut)}</label><p className="finance-muted">Les factures restent incluses, même sans les projets.</p></div>}

        <div className="finance-actions finance-section"><button type="button" className="finance-action" onClick={()=>setPlan(null)}><Plus size={15}/>Ajouter une prévision</button><button type="button" className="finance-action secondary" onClick={()=>setBudgetPicker(true)}><Wheat size={15}/>Budget d’un brassin</button></div>
        <details className="finance-disclosure" onToggle={e=>setChartOpen(e.currentTarget.open)}><summary>Comparer les mois</summary>{chartOpen&&<>
          <p className="finance-muted">Sorties en bleu · solde en pointillé, en CHF. {forecast.warnings.length>0?'Scénario limité aux données renseignées.':''}</p>
          <div className="finance-chart" role="img" aria-label="Évolution mensuelle, montants exacts dans le tableau suivant"><ResponsiveContainer width="100%" height="100%"><AreaChart data={forecastChart} margin={{top:8,right:12,left:0,bottom:0}}><CartesianGrid stroke="#3D342E" vertical={false}/><XAxis dataKey="label" tick={{fill:'#D8CEC5',fontSize:12}} tickFormatter={v=>v.split(' ')[0].slice(0,4)} minTickGap={28}/><YAxis width={48} tick={{fill:'#D8CEC5',fontSize:12}}/><Tooltip contentStyle={{background:'#221D19',border:'1px solid #574A42',borderRadius:8}} formatter={(v:number,name:string)=>[formatCHF(Math.round(v*100)),name==='expense'?'Sorties prévues':'Trésorerie']}/><Area type="linear" dataKey="expense" stroke="#86B9E6" fill="#86B9E6" fillOpacity={.08} isAnimationActive={false}/>{ledger.cashComplete&&ledger.cashCents!=null&&<Area type="linear" dataKey="balance" stroke="#D8CEC5" strokeDasharray="5 4" fill="transparent" isAnimationActive={false}/>}</AreaChart></ResponsiveContainer></div>
          <table className="finance-table"><caption className="sr-only">Prévision mensuelle selon le scénario sélectionné</caption><thead><tr><th scope="col">Mois</th><th scope="col">Sorties</th><th scope="col">Solde estimé</th></tr></thead><tbody>{forecastChart.map(item=><tr key={item.label}><th scope="row">{item.label}</th><td className="finance-money">{formatCHF(Math.round(item.expense*100))}</td><td className="finance-money">{item.balance==null?'À compléter':formatCHF(Math.round(item.balance*100))}</td></tr>)}</tbody></table>
        </>}</details>
        <section className="finance-section"><h3>Prochaines échéances</h3><div className="finance-list">{upcoming.slice(0,upcomingLimit).map(forecastRow)}</div>{upcoming.length>upcomingLimit&&<button className="finance-link" onClick={()=>setUpcomingLimit(limit=>limit+6)}>Voir les {Math.min(6,upcoming.length-upcomingLimit)} échéances suivantes<ChevronRight size={16}/></button>}{!upcoming.length&&<p className="finance-empty-inline">Aucune échéance renseignée sur cette période. Ajoute une prévision ou le budget d’un brassin.</p>}</section>
        <details className="finance-section"><summary className="finance-link">Toutes mes prévisions ({data.plans.filter(p=>p.status!=='draft'&&!isUpgradePlan(p)).length})</summary>{data.plans.filter(p=>p.status!=='draft'&&!isUpgradePlan(p)).map(p=><button key={p.id} className="finance-row" onClick={()=>setPlan(p)}><span className="finance-row-main">{p.title}<br/><span className="finance-muted">{p.status==='active'?'À venir':p.status==='cancelled'?'Annulée':'Terminée'}</span></span><span>{formatCHF(p.amountCents)}</span><ChevronRight size={16}/></button>)}</details>
        {financeAssistant}
      </>}
      {view==='forecast'&&forecastPart==='projects'&&<><UpgradeWorkspace onOpenProject={setUpgrade}/>{financeAssistant}</>}
      {view==='annual'&&<>
        <div className="finance-period-toolbar"><Field label="Exercice"><NumberInput integer min={1900} max={2200} value={year} className="finance-year-input" onValue={value=>{setYear(value);setClosingId('');}}/></Field></div>
        {!!yearClosings.length&&<Field label="Version de l’année"><select value={latestClosing?.id??''} onChange={e=>setClosingId(e.target.value)}>{yearClosings.map(c=><option key={c.id} value={c.id}>{c.report?'Version figée':'Brouillon'} · {new Date(c.createdAt).toLocaleString('fr-CH')}</option>)}</select></Field>}
        <TaxWorkspace key={year} report={annual} closing={latestClosing} transactions={transactions} assets={data.assets} profile={data.profile} companyName={config.company.name} onProfile={()=>setProfileOpen(true)} onInventories={()=>setClosingOpen(true)} onAsset={setAsset} onVersion={setClosingId} onOperations={()=>openJournal({scope:'all',year:String(year),allDates:true,filter:'review'})}/>
        <button className="finance-link" onClick={()=>setArchiveOpen(true)}>Gérer les archives par année<ChevronRight size={16}/></button>
        {financeAssistant}
      </>}
    </section>
    {archiveOpen&&<ArchiveManagerSheet transactions={transactions} payments={data.payments} archives={archives} closings={data.closings} onClose={()=>setArchiveOpen(false)} onSaved={setNotice} onBrowse={(year,archived)=>{setArchiveOpen(false);openJournal(archived?{scope:'archives',archiveYear:String(year),allDates:true}:{scope:'all',year:String(year),allDates:true});}}/>}
    {profileOpen&&<ProfileSheet profile={data.profile} onClose={()=>setProfileOpen(false)}/>}
    {saleOpen&&<QuickActionModal isOpen initialScreen="quick-sale" recipes={recipes} onClose={()=>setSaleOpen(false)} onSuccessMessage={setNotice}/>}
    {expenseOpen&&<ExpenseSheet initialIntent={newEquipment?'equipment':'expense'} onClose={()=>{setExpenseOpen(false);setNewEquipment(false);}} onSaved={()=>setNotice('Dépense enregistrée.')}/>}
    {upgrade!==undefined&&<UpgradeSheet plan={upgrade??undefined} onClose={()=>setUpgrade(undefined)} onOpenTransaction={tx=>{setUpgrade(undefined);setSelected(tx);}}/>}
    {plan!==undefined&&<PlanSheet plan={plan??undefined} onClose={()=>setPlan(undefined)}/>}
    {asset!==undefined&&<AssetSheet asset={asset??undefined} onClose={()=>setAsset(undefined)}/>}
    {closingOpen&&<ClosingSheet year={year} closing={latestClosing?.report?{...latestClosing,id:idFor(`CLOTURE-${year}`),createdAt:new Date().toISOString(),report:undefined}:latestClosing} stockItems={stockItems} onClose={()=>{setClosingOpen(false);setClosingId('');}}/>}
    {paying&&<PaymentSheet transaction={transactions.find(t=>t.id===paying.id)??paying} payments={data.payments} transactions={transactions} onClose={()=>setPaying(null)}/>}
    {editing&&<EditTransactionModal isOpen transaction={transactions.find(t=>t.id===editing.id)??editing} onClose={()=>setEditing(null)} onSave={()=>setNotice('Opération mise à jour.')}/>}
    {movement!==undefined&&<MovementSheet original={movement??undefined} onClose={()=>setMovement(undefined)} onSaved={()=>setNotice('Mouvement enregistré.')}/>}
    {selected&&<TransactionDetails transaction={selected} transactions={transactions} payments={data.payments} plans={data.plans} onClose={()=>setSelected(null)} onEdit={()=>{setEditing(selected);setSelected(null);}} onPay={()=>{setPaying(selected);setSelected(null);}} onRefund={()=>{setMovement(selected);setSelected(null);}}/>}
    {budgetPicker&&<Sheet open title="Quel brassin veux-tu estimer ?" onClose={()=>setBudgetPicker(false)} className="finance-sheet"><div className="finance-list">{batches.filter(b=>b.status==='planifie').map(b=><button key={b.id} className="finance-row" onClick={()=>{setBudget({batch:b});setBudgetPicker(false);}}><span className="finance-row-main"><strong>{b.name}</strong><span className="finance-muted">{b.id} · {b.volumeL} L</span></span><ChevronRight size={18}/></button>)}{recipes.map(r=><button key={r.id} className="finance-row" onClick={()=>{setBudget({recipe:r});setBudgetPicker(false);}}><span className="finance-row-main"><strong>{r.name}</strong><span className="finance-muted">Recette · {r.volumeL} L</span></span><ChevronRight size={18}/></button>)}{!recipes.length&&!batches.some(b=>b.status==='planifie')&&<p className="finance-notice">Crée d’abord une recette dans Brassins pour calculer ses besoins.</p>}</div></Sheet>}
    {budget&&<BrewBudgetDialog {...budget} onClose={()=>setBudget(null)}/>}
  </div>;
}
