import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Transaction, BudgetLine, AppConfig, TimeFilterPeriod, Recipe, Batch, StockItem } from '../../types';
import type { FinancialAsset, FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { StorageService } from '../../services/storage';
import { useStorageValue, useLiveSelection } from '../../hooks/useLiveData';
import { tvaThresholdStatus } from '../../domain/finance/tvaThreshold';
import { isoDate, todayISO, paymentState, summarizeLedger } from '../../domain/finance/ledger';

import { buildAnnualReport } from '../../domain/finance/annual';
import { TaxWorkspace } from '../../ui/finance/TaxWorkspace';
import { Sheet } from '../../ui/Sheet';
import { ProfileSheet, PlanSheet, AssetSheet, ClosingSheet, PaymentSheet, idFor } from '../../ui/finance/FinanceForms';
import type { OuvertureInventaire } from '../../ui/finance/annuel/ctx';
import { BrewBudgetDialog } from '../../ui/finance/BrewBudgetDialog';
import { TransactionDetails } from '../../ui/finance/TransactionDetails';
import { MovementSheet } from '../../ui/finance/MovementSheet';
import { ArchiveManagerSheet } from '../../ui/finance/ArchiveManagerSheet';
import { TransactionJournal, createJournalState, type JournalRequest } from '../../ui/finance/TransactionJournal';
import { TransactionRow } from '../../ui/finance/TransactionRow';
import { FinanceOverview } from '../../ui/finance/FinanceOverview';
import { FinanceAssistant } from '../../ui/finance/FinanceAssistant';
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
  /** CP-13 : `affinee:ouvrir-finances` (App) demande un sous-onglet par son nom : synthese, operations, previsions, annuel. `at` distingue deux demandes. */
  ongletRequest?:{onglet:string;at:number}|null;
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
const ONGLETS_DEMANDES:Record<string,FinanceView>={synthese:'overview',operations:'journal',previsions:'forecast',annuel:'annual'};

export function FinancesTab({transactions,config,recipes=EMPTY,batches=EMPTY,stockItems=EMPTY,openTransactionRequest,onOpenStockItem,onOpenRecipe,onOpenSale,ongletRequest}:FinancesTabProps) {
  const data=useStorageValue(readFinance);
  const archives=useStorageValue(FinancialArchiveService.getArchives);
  const [archiveOpen,setArchiveOpen]=useState(false),[journalRequest,setJournalRequest]=useState<JournalRequest>();
  const [journalState,setJournalState]=useState(createJournalState);
  const handledOpenRequest=useRef<string>('');
  const [view,setView]=useState<FinanceView>(initialView);
  const projetsRef=useRef(StorageService.getUiState<string>('finances_workspace','overview')==='projects'),[cible,setCible]=useState<CiblePrevoir|null>(null);
  const [month,setMonth]=useState(todayISO().slice(0,7)),[allDates,setAllDates]=useState(false);
  const [year,setYear]=useState(new Date().getFullYear()),[horizon,setHorizon]=useState<30|90|365>(90);
  const [upgrade,setUpgrade]=useState<FinancialPlan|null|undefined>();
  const [includeEquipmentProjects,setIncludeEquipmentProjects]=useState(true);
  const [movement,setMovement]=useState<Transaction|null|undefined>(undefined),[closingId,setClosingId]=useState('');
  const [profileOpen,setProfileOpen]=useState(false), [profileParams,setProfileParams]=useState(false);
  const [plan,setPlan]=useState<FinancialPlan|null|undefined>(undefined),[asset,setAsset]=useState<FinancialAsset|null|undefined>(undefined),[closingOpen,setClosingOpen]=useState(false);
  const [selected,setSelected]=useLiveSelection(transactions,'id'),[paying,setPaying]=useState<Transaction|null>(null),[editing,setEditing]=useState<Transaction|null>(null);
  const [budgetPicker,setBudgetPicker]=useState(false),[budget,setBudget]=useState<{recipe?:Recipe;batch?:Batch}|null>(null),[notice,setNotice]=useState('');
  const [closingOpts,setClosingOpts]=useState<OuvertureInventaire>({}),[assetInitial,setAssetInitial]=useState<Partial<FinancialAsset>>();
  const ledger=useMemo(()=>summarizeLedger(transactions,data.payments,data.profile,undefined,{includeScheduled:true}),[transactions,data.payments,data.profile]);
  /* AM n° 10 : le seuil d'assujettissement à la TVA (100 000 CHF sur 12 mois glissants) est surveillé tant que l'app est non assujettie. */
  const tvaThreshold=useMemo(()=>tvaThresholdStatus(transactions,todayISO(),config.fiscal.tvaThresholdTurnover,config.fiscal.isTvaRegistered||!!data.profile.vatRegistered),[transactions,config.fiscal.tvaThresholdTurnover,config.fiscal.isTvaRegistered,data.profile.vatRegistered]);
  const openingCashReady=!!(data.profile.openingCash?.confirmed && isoDate(data.profile.openingCash.date) && isoDate(data.profile.openingCash.date)!<=todayISO() && Number.isSafeInteger(data.profile.openingCash.amountCents));
  const openPlan=(p:FinancialPlan)=>{if(isUpgradePlan(p))setUpgrade(p);else setPlan(p);};
  const yearClosings=data.closings.filter(c=>c.year===year);
  const latestClosing=yearClosings.find(c=>c.id===closingId)??yearClosings[0];
  const annual=useMemo(()=>latestClosing?.report??buildAnnualReport({year,transactions,payments:data.payments,assets:data.assets,profile:{...data.profile,vatRegistered:data.profile.vatRegistered||config.fiscal.isTvaRegistered},closing:latestClosing}),[year,transactions,data,latestClosing,config.fiscal.isTvaRegistered]);
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
  const ongletTraite=useRef(0);
  useEffect(()=>{
    if(!ongletRequest||ongletTraite.current===ongletRequest.at)return;
    ongletTraite.current=ongletRequest.at;
    const cible=Object.prototype.hasOwnProperty.call(ONGLETS_DEMANDES,ongletRequest.onglet)?ONGLETS_DEMANDES[ongletRequest.onglet]:undefined;
    if(cible){setView(cible);StorageService.setUiState('finances_workspace',cible);}
  },[ongletRequest]);
  const assistantView=view==='overview'?'costs':view;
  const financeAssistant=<FinanceAssistant view={assistantView} month={month} allDates={allDates} year={year} horizon={horizon} includeEquipmentProjects={includeEquipmentProjects}/>;
  const row=(t:Transaction,state?:ReturnType<typeof paymentState>)=><TransactionRow key={t.id} transaction={t} transactions={transactions} payments={data.payments} state={state} onOpen={()=>setSelected(t)} onAddProof={()=>setEditing(t)} onPay={()=>setPaying(t)}/>;
  return <div className="finance">
    <nav className="finance-nav" role="tablist" aria-label="Finances">{views.map(([key,label])=><button type="button" key={key} id={`finance-tab-${key}`} role="tab" tabIndex={view===key?0:-1} aria-selected={view===key} aria-controls={`finance-${key}`} onClick={()=>selectView(key)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=views.findIndex(v=>v[0]===key);const next=e.key==='Home'?0:e.key==='End'?views.length-1:(index+(e.key==='ArrowRight'?1:views.length-1))%views.length;selectView(views[next][0]);(e.currentTarget.parentElement?.querySelectorAll('button')[next] as HTMLButtonElement|undefined)?.focus();}}>{label}</button>)}</nav>
    {/* Titre, sous-vue et réglages sur une seule rangée : trois barres empilées
        mangeaient un tiers de l'écran avant la première donnée. */}
    {notice&&<div className="finance-notice" role="status"><span>{notice}</span>{' '}<button className="finance-link" style={{marginInlineStart:'0.5rem'}} onClick={()=>setNotice('')}>Fermer</button></div>}
    <section role="tabpanel" id={`finance-${view}`} aria-labelledby={`finance-tab-${view}`}>
      {view==='overview'&&<FinanceOverview transactions={transactions} payments={data.payments} plans={data.plans} assets={data.assets} batches={batches} recipes={recipes} ledger={ledger} tvaThreshold={tvaThreshold} openingCashReady={openingCashReady} openingCash={data.profile.openingCash}
        month={month} allDates={allDates} onMonth={value=>{setMonth(value);setAllDates(false);}} onAllDates={()=>setAllDates(true)} assistant={financeAssistant}
        onProfile={()=>setProfileOpen(true)} onJournal={openJournal} onTransaction={id=>setSelected(transactions.find(t=>t.id===id)??null)} onPayment={id=>setPaying(transactions.find(t=>t.id===id)??null)}
        onOpenBudget={setBudget} onBudgetPicker={()=>setBudgetPicker(true)} onUpgrade={setUpgrade} onBrowseProjects={showProjects} onNotice={setNotice}/>}
      {view==='journal'&&<><TransactionJournal transactions={transactions} payments={data.payments} archives={archives} state={journalState} onStateChange={setJournalState} request={journalRequest} renderRow={row} onManageArchives={()=>setArchiveOpen(true)} onPrivateMovement={()=>setMovement(null)} assistant={financeAssistant}/></>}
      {view==='forecast'&&<Previsions asOf={todayISO()} horizon={horizon} onHorizon={setHorizon} transactions={transactions} payments={data.payments} plans={data.plans} profile={data.profile} assets={data.assets} batches={batches} stockItems={stockItems}
        ledger={ledger} openingCashReady={openingCashReady} avecProjets={includeEquipmentProjects} onAvecProjets={setIncludeEquipmentProjects}
        onProfile={()=>setProfileOpen(true)} onPayments={()=>openJournal({scope:'all',allDates:true,filter:'unknown'})} onRegistre={()=>openJournal({scope:'all',allDates:true})} onHistorique={()=>{setProfileParams(true);setProfileOpen(true);}} onOpenTransaction={setSelected} onOpenPlan={openPlan} onOpenUpgrade={setUpgrade}
        onAddPlan={()=>setPlan(null)} onBudgetPicker={()=>setBudgetPicker(true)} onOpenBudget={b=>setBudget({batch:b})} onNotice={setNotice} onSale={onOpenSale}
        cible={cible} onCibleTraitee={()=>setCible(null)} projetsOuverts={projetsRef.current}>{financeAssistant}</Previsions>}
      {view==='annual'&&<TaxWorkspace key={year} report={annual} closing={latestClosing} closings={yearClosings} year={year} onYear={value=>{setYear(value);setClosingId('');}} transactions={transactions} payments={data.payments} assets={data.assets} plans={data.plans} stockItems={stockItems} batches={batches} profile={data.profile} tvaThreshold={tvaThreshold} companyName={config.company.name}
        onProfile={()=>setProfileOpen(true)} onInventories={ouverture=>{setClosingOpts(ouverture??{});setClosingOpen(true);}} onAsset={(a,initial)=>{setAssetInitial(initial);setAsset(a);}} onVersion={setClosingId} onOperations={openJournal} onArchives={()=>setArchiveOpen(true)}/>}
    </section>
    {archiveOpen&&<ArchiveManagerSheet transactions={transactions} payments={data.payments} archives={archives} closings={data.closings} onClose={()=>setArchiveOpen(false)} onSaved={setNotice} onBrowse={(year,archived)=>{setArchiveOpen(false);openJournal(archived?{scope:'archives',archiveYear:String(year),allDates:true}:{scope:'all',year:String(year),allDates:true});}}/>}
    {profileOpen&&<ProfileSheet profile={data.profile} parametres={profileParams} onClose={()=>{setProfileOpen(false);setProfileParams(false);}}/>}
    {upgrade!==undefined&&<UpgradeSheet plan={upgrade??undefined} onClose={()=>setUpgrade(undefined)} onOpenTransaction={tx=>{setUpgrade(undefined);setSelected(tx);}}/>}
    {plan!==undefined&&<PlanSheet plan={plan??undefined} onClose={()=>setPlan(undefined)}/>}
    {asset!==undefined&&<AssetSheet asset={asset??undefined} initial={assetInitial} onClose={()=>{setAsset(undefined);setAssetInitial(undefined);}}/>}
    {closingOpen&&<ClosingSheet year={year} closing={latestClosing?.report?{...latestClosing,id:idFor(`CLOTURE-${year}`),createdAt:new Date().toISOString(),report:undefined}:latestClosing} stockItems={stockItems} cote={closingOpts.cote} proposer={closingOpts.proposer} propositions={closingOpts.propositions} nature={closingOpts.nature} onClose={()=>{setClosingOpen(false);setClosingOpts({});setClosingId('');}}/>}
    {paying&&<PaymentSheet transaction={transactions.find(t=>t.id===paying.id)??paying} payments={data.payments} transactions={transactions} onClose={()=>setPaying(null)}/>}
    {editing&&<EditTransactionModal isOpen transaction={transactions.find(t=>t.id===editing.id)??editing} onClose={()=>setEditing(null)} onSave={()=>setNotice('Opération mise à jour.')}/>}
    {movement!==undefined&&<MovementSheet original={movement??undefined} onClose={()=>setMovement(undefined)} onSaved={()=>setNotice('Mouvement enregistré.')}/>}
    {selected&&<TransactionDetails transaction={selected} transactions={transactions} payments={data.payments} plans={data.plans} onClose={()=>setSelected(null)} onEdit={()=>{setEditing(selected);setSelected(null);}} onPay={()=>{setPaying(selected);setSelected(null);}} onRefund={()=>{setMovement(selected);setSelected(null);}} onOpenStockItem={onOpenStockItem&&(ref=>{setSelected(null);onOpenStockItem(ref);})} onOpenRecipe={onOpenRecipe&&(id=>{setSelected(null);onOpenRecipe(id);})}/>}
    {budgetPicker&&<Sheet open title="Quel brassin veux-tu estimer ?" onClose={()=>setBudgetPicker(false)} className="finance-sheet"><div className="finance-list">{batches.filter(b=>b.status==='planifie').map(b=><button key={b.id} className="finance-row" onClick={()=>{setBudget({batch:b});setBudgetPicker(false);}}><span className="finance-row-main"><strong>{b.name}</strong><span className="finance-muted">{b.id} · {nombreFr(b.volumeL, 1)} L</span></span><ChevronRight size={18}/></button>)}{recipes.map(r=><button key={r.id} className="finance-row" onClick={()=>{setBudget({recipe:r});setBudgetPicker(false);}}><span className="finance-row-main"><strong>{r.name}</strong><span className="finance-muted">Recette · {nombreFr(r.volumeL, 1)} L</span></span><ChevronRight size={18}/></button>)}{!recipes.length&&!batches.some(b=>b.status==='planifie')&&<p className="finance-notice">Crée d’abord une recette dans Brassins pour calculer ses besoins.</p>}</div></Sheet>}
    {budget&&<BrewBudgetDialog {...budget} onClose={()=>setBudget(null)} onOpenForecast={target=>{setBudget(null);selectView('forecast');setCible({...target,at:Date.now()});}}/>}
  </div>;
}
