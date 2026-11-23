import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { Transaction, BudgetLine, AppConfig, Recipe, Batch, StockItem } from '../../types';
import { depuisJournal, depuisMois, depuisPlageFinances, enJournal, enPeriode, mentionArrondiMois, pourFinances, serialiser, type Periode, type PeriodeEntree } from '../periode/periode';
import type { FinancialAsset, FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { FinancialArchiveService } from '../../services/financialArchiveService';
import { StorageService } from '../../services/storage';
import { useStorageValue, useLiveSelection } from '../../hooks/useLiveData';
import { tvaThresholdStatus } from '../../domain/finance/tvaThreshold';
import { isActiveTransaction, isoDate, todayISO, paymentState, summarizeLedger } from '../../domain/finance/ledger';

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
import { installerModeClavier } from '../../ui/finance/modeClavier';
import { ChoixBrassin } from '../../ui/finance/budget/ChoixBrassin';
import { LienSection } from '../../ui/calendrier/LienSection';

installerModeClavier();

interface FinancesTabProps {
  transactions:Transaction[]; budgetLines:BudgetLine[]; config:AppConfig;
  /** LA période de l'app (m3r-a) : Finances la lit et la règle, il n'en garde aucune à lui. */
  globalTimeFilter:PeriodeEntree; onChangeGlobalTimeFilter?:(p:Periode)=>void;
  recipes?:Recipe[]; batches?:Batch[]; stockItems?:StockItem[];
  openTransactionRequest?:{id:string;at:number;retour?:'calendrier'}|null;
  /** CT4-A-12 : la fiche ouverte « depuis » un autre écran est fermée : on y revient. */
  onRetour?:(vers:'calendrier')=>void;
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
/** Tour 2 (19.11) : l'en-tête change de période : un exercice ouvert (depuis Annuel ou les archives) s'efface, la liste suit l'en-tête. Sans exercice, l'état est rendu tel quel. */
export const journalApresEntete=<T extends {year:string;allDates:boolean}>(s:T):T=>s.year?{...s,year:'',allDates:false}:s;
const ONGLETS_DEMANDES:Record<string,FinanceView>={synthese:'overview',operations:'journal',previsions:'forecast',annuel:'annual'};

export function FinancesTab({transactions,config,globalTimeFilter,onChangeGlobalTimeFilter,recipes=EMPTY,batches=EMPTY,stockItems=EMPTY,openTransactionRequest,onRetour,onOpenStockItem,onOpenRecipe,onOpenSale,ongletRequest}:FinancesTabProps) {
  const data=useStorageValue(readFinance);
  const archives=useStorageValue(FinancialArchiveService.getArchives);
  const [archiveOpen,setArchiveOpen]=useState(false),[journalRequest,setJournalRequest]=useState<JournalRequest>();
  const [journalState,setJournalState]=useState(createJournalState);
  const handledOpenRequest=useRef<string>('');
  /* CT4-A-12 : une fiche ouverte DEPUIS le calendrier (un jalon de Papiers touché) y ramène une fois fermée ; ouverte ici, elle reste ici. */
  const retourVers=useRef<'calendrier'|null>(null);
  const fermerFiche=()=>{const vers=retourVers.current;retourVers.current=null;setSelected(null);if(vers)onRetour?.(vers);};
  const [view,setView]=useState<FinanceView>(initialView);
  const projetsRef=useRef(StorageService.getUiState<string>('finances_workspace','overview')==='projects'),[cible,setCible]=useState<CiblePrevoir|null>(null);
  /* m3r-a : une seule période. Sans réglage venu de l'app (aperçus, tests), l'écran garde la dernière choisie ici, rien de plus. */
  const [choisieIci,setChoisieIci]=useState<Periode|null>(null);
  const periodeApp=onChangeGlobalTimeFilter?enPeriode(globalTimeFilter):(choisieIci??enPeriode(globalTimeFilter));
  const changerPeriode=(p:Periode)=>{if(onChangeGlobalTimeFilter)onChangeGlobalTimeFilter(p);else setChoisieIci(p);};
  const cleP=serialiser(periodeApp);
  const mentionMois=mentionArrondiMois(periodeApp);
  /* Le journal d'Opérations non plus n'a plus de période à lui : mois, plage et « tout » viennent de l'app, et ce qu'il choisit y retourne.
     Un exercice ou les archives (year, scope) gardent leur propre lecture. */
  const suitApp=!journalState.year&&journalState.scope!=='archives';
  const etatJournal=useMemo(()=>suitApp?{...journalState,...enJournal(periodeApp)}:journalState,[journalState,cleP,suitApp]); // eslint-disable-line react-hooks/exhaustive-deps
  const cleVue=useRef(cleP);
  useEffect(()=>{if(cleVue.current===cleP)return;cleVue.current=cleP;setJournalState(journalApresEntete);},[cleP]);
  const changerJournal=(s:typeof journalState)=>{setJournalState(s);if(!s.year&&s.scope!=='archives'){const p=depuisJournal(s);if(serialiser(p)!==cleP)changerPeriode(p);}};
  const {month,allDates,plage}=useMemo(()=>pourFinances(periodeApp),[cleP]); // eslint-disable-line react-hooks/exhaustive-deps
  const [year,setYear]=useState(new Date().getFullYear()),[horizon,setHorizon]=useState<30|90|365>(90);
  const [upgrade,setUpgrade]=useState<FinancialPlan|null|undefined>();
  const [includeEquipmentProjects,setIncludeEquipmentProjects]=useState(true);
  const [movement,setMovement]=useState<Transaction|null|undefined>(undefined),[closingId,setClosingId]=useState('');
  const [profileOpen,setProfileOpen]=useState(false), [profileParams,setProfileParams]=useState(false);
  const [plan,setPlan]=useState<FinancialPlan|null|undefined>(undefined),[asset,setAsset]=useState<FinancialAsset|null|undefined>(undefined),[closingOpen,setClosingOpen]=useState(false);
  const [selected,setSelected]=useLiveSelection(transactions,'id'),[paying,setPaying]=useState<Transaction|null>(null),[remplace,setRemplace]=useState<FinancialPayment|null>(null),[editing,setEditing]=useState<Transaction|null>(null);
  const [budgetPicker,setBudgetPicker]=useState(false),[budget,setBudget]=useState<{recipe?:Recipe;batch?:Batch}|null>(null),[notice,setNotice]=useState('');
  /* v2 (3) : l'avis d'une écriture (« Mouvement enregistré », « Opération mise à jour ») ne survit pas à l'annulation d'une écriture : il parlerait d'une opération retirée. */
  const nbAnnulees=transactions.filter(t=>!isActiveTransaction(t)).length,annuleesVues=useRef(nbAnnulees);
  useEffect(()=>{if(nbAnnulees>annuleesVues.current)setNotice(n=>n==='Mouvement enregistré.'||n==='Opération mise à jour.'?'':n);annuleesVues.current=nbAnnulees;},[nbAnnulees]);
  /* FN-40 : l'avis (« Opération mise à jour. ») s'efface seul après quelques secondes et quand on change de vue (onglet, Archives) : il ne reste pas des minutes en tête d'Opérations. */
  useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),6000);return()=>clearTimeout(t);},[notice]);
  useEffect(()=>{setNotice('');},[view,journalState.scope]);
  /* Le + flottant : « Estimer un brassin » ouvre le choix du brassin (l'ancien + de la ligne du coût du litre). */
  useEffect(()=>{const ouvrir=()=>setBudgetPicker(true);window.addEventListener('finances-estimer',ouvrir);return()=>window.removeEventListener('finances-estimer',ouvrir);},[]);
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
    retourVers.current=openTransactionRequest.retour??null;
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
  const row=(t:Transaction,state?:ReturnType<typeof paymentState>)=><TransactionRow key={t.id} transaction={t} transactions={transactions} payments={data.payments} state={state} onOpen={()=>setSelected(t)} onAddProof={()=>setEditing(t)} onPay={r=>{setRemplace(r??null);setPaying(t);}}/>;
  return <div className="finance">
    <nav className="finance-nav" role="tablist" aria-label="Finances">{views.map(([key,label])=><button type="button" key={key} id={`finance-tab-${key}`} role="tab" tabIndex={view===key?0:-1} aria-selected={view===key} aria-controls={`finance-${key}`} onClick={()=>selectView(key)} onKeyDown={e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const index=views.findIndex(v=>v[0]===key);const next=e.key==='Home'?0:e.key==='End'?views.length-1:(index+(e.key==='ArrowRight'?1:views.length-1))%views.length;selectView(views[next][0]);(e.currentTarget.parentElement?.querySelectorAll('button')[next] as HTMLButtonElement|undefined)?.focus();}}>{label}</button>)}</nav>
    {/* Titre, sous-vue et réglages sur une seule rangée : trois barres empilées
        mangeaient un tiers de l'écran avant la première donnée. */}
    {(view==='overview'||view==='forecast')&&<LienSection section="finances" className="mb-2"/>}
    {notice&&<div className="finance-notice" role="status"><span>{notice}</span>{' '}<button className="finance-link" style={{marginInlineStart:'0.5rem'}} onClick={()=>setNotice('')}>Fermer</button></div>}
    {mentionMois&&view==='overview'&&<p className="finance-muted" data-finance-arrondi style={{margin:'0 0 0.5rem'}}>{mentionMois}</p>}
    <section role="tabpanel" id={`finance-${view}`} aria-labelledby={`finance-tab-${view}`}>
      {view==='overview'&&<FinanceOverview transactions={transactions} payments={data.payments} plans={data.plans} assets={data.assets} batches={batches} recipes={recipes} ledger={ledger} tvaThreshold={tvaThreshold} openingCashReady={openingCashReady} openingCash={data.profile.openingCash}
        month={month} allDates={allDates} onMonth={value=>changerPeriode(depuisMois(value))} onAllDates={()=>changerPeriode({genre:'tout'})} plage={plage} onPlage={value=>{if(value)changerPeriode(depuisPlageFinances(value.du,value.au));}} periode={periodeApp} onPeriode={changerPeriode} assistant={financeAssistant}
        onProfile={()=>setProfileOpen(true)} onJournal={openJournal} onTransaction={id=>setSelected(transactions.find(t=>t.id===id)??null)} onPayment={id=>{setRemplace(null);setPaying(transactions.find(t=>t.id===id)??null);}}
        onOpenBudget={setBudget} onBudgetPicker={()=>setBudgetPicker(true)} onUpgrade={setUpgrade} onBrowseProjects={showProjects} onNotice={setNotice}
        profile={data.profile} stockItems={stockItems} onPrevisions={()=>selectView('forecast')}/>}
      {view==='journal'&&<><TransactionJournal transactions={transactions} payments={data.payments} archives={archives} state={etatJournal} onStateChange={changerJournal} request={journalRequest} renderRow={row} onManageArchives={()=>setArchiveOpen(true)} onPrivateMovement={()=>setMovement(null)} assistant={financeAssistant}/></>}
      {view==='forecast'&&<Previsions asOf={todayISO()} horizon={horizon} onHorizon={setHorizon} transactions={transactions} payments={data.payments} plans={data.plans} profile={data.profile} assets={data.assets} batches={batches} stockItems={stockItems}
        ledger={ledger} openingCashReady={openingCashReady} avecProjets={includeEquipmentProjects} onAvecProjets={setIncludeEquipmentProjects}
        onProfile={()=>setProfileOpen(true)} onPayments={()=>openJournal({scope:'all',allDates:true,filter:'unknown'})} onRegistre={()=>openJournal({scope:'all',allDates:true})} onHistorique={()=>{setProfileParams(true);setProfileOpen(true);}} onOpenTransaction={setSelected} onCorrigerPiece={setEditing} onOpenPlan={openPlan} onOpenUpgrade={setUpgrade}
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
    {paying&&<PaymentSheet transaction={transactions.find(t=>t.id===paying.id)??paying} payments={data.payments} transactions={transactions} remplace={remplace??undefined} seule onClose={()=>{setPaying(null);setRemplace(null);}}/>}
    {editing&&<EditTransactionModal isOpen transaction={transactions.find(t=>t.id===editing.id)??editing} onClose={()=>setEditing(null)} onSave={()=>setNotice('Opération mise à jour.')}/>}
    {movement!==undefined&&<MovementSheet original={movement??undefined} onClose={()=>setMovement(undefined)} onSaved={()=>setNotice('Mouvement enregistré.')}/>}
    {selected&&<TransactionDetails transaction={selected} transactions={transactions} payments={data.payments} plans={data.plans} onClose={fermerFiche} onEdit={()=>{retourVers.current=null;setEditing(selected);setSelected(null);}} onPay={()=>{retourVers.current=null;setRemplace(null);setPaying(selected);setSelected(null);}} onRefund={()=>{retourVers.current=null;setMovement(selected);setSelected(null);}} onOpenStockItem={onOpenStockItem&&(ref=>{retourVers.current=null;setSelected(null);onOpenStockItem(ref);})} onOpenRecipe={onOpenRecipe&&(id=>{retourVers.current=null;setSelected(null);onOpenRecipe(id);})} onOpenTransaction={t=>setSelected(t)}/>}
    {budgetPicker&&<Sheet open title="Quel brassin veux-tu estimer ?" onClose={()=>setBudgetPicker(false)} className="finance-sheet"><ChoixBrassin batches={batches} recipes={recipes} onBatch={b=>{setBudget({batch:b});setBudgetPicker(false);}} onRecipe={r=>{setBudget({recipe:r});setBudgetPicker(false);}}/></Sheet>}
    {budget&&<BrewBudgetDialog {...budget} onClose={()=>setBudget(null)} onOpenForecast={target=>{setBudget(null);selectView('forecast');setCible({...target,at:Date.now()});}}/>}
  </div>;
}
