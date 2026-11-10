// Voie dp-doublon (01.11) : « on doit voir que ce document est déjà lié à un stock, facture ».
// Une pièce dont le fichier est celui d'une dépense déjà saisie : dit tout de suite, sans lecture, avec ce à quoi elle est liée.
// Même famille que la section « Achat peut-être déjà enregistré » (cadre d'attention, AlertCircle, tableau compact) ; le cube relié de r2b.
import React,{useState} from 'react';
import { AlertCircle,ChevronDown,Wrench } from 'lucide-react';
import { PictoLien } from '../depense/Pictos';
import { lignesDePort } from '../depense/groupes';
import { formatCHF,paymentState } from '../../domain/finance/ledger';
import { purchaseLinks,type PurchaseLinks } from '../../services/purchaseEntry';
import type { FinanceTransaction,FinancialPayment } from '../../domain/finance/types';
import type { EquipmentItem,StockItem } from '../../types';

type Stocks={rawMaterials:StockItem[];cleaning:StockItem[];equipment:EquipmentItem[]};
const cadre='rounded-control border border-attention/50 bg-attention/5 p-2';
const fr=(n:number)=>String(n).replace('.',',');
const quantite=(entry:{quantity?:number;unit?:string})=>entry.quantity!==undefined?`${fr(entry.quantity)}${entry.unit?` ${entry.unit}`:''}`:'';
const nomArticle=(entry:{name?:string})=>entry.name??'article retiré du stock';

/** Le mot court du règlement, celui du journal (TransactionRow) : Payé, À payer, Reste … à payer, Paiement à confirmer. */
export function motReglement(tx:FinanceTransaction,payments:FinancialPayment[],transactions:FinanceTransaction[]):string {
  const state=paymentState(tx,payments,transactions);
  if (state.state==='paid') return 'Payé';
  if (state.state==='partial') return `Reste ${formatCHF(state.remainingCents)} à payer`;
  if (state.state==='unpaid') return 'À payer';
  return tx.finance?.paymentStatus==='paid'?'Payé':'Paiement à confirmer';
}

/** Une ligne : à quoi la dépense déjà enregistrée est liée (sections « peut-être » et « même commande »). Plus de deux articles : leur nombre. */
export function LienDepense({tx,stocks}:{tx:FinanceTransaction;stocks:Stocks}) {
  const links=purchaseLinks(tx,stocks);
  const stock=links.stock.length>2?`${links.stock.length} articles`:links.stock.map(nomArticle).join(', ');
  const materiel=links.equipment.map(entry=>entry.name??'matériel retiré').join(', ');
  const texte=[stock?`Lié au stock : ${stock}`:'',materiel?`${stock?'matériel':'Matériel'} : ${materiel}`:''].filter(Boolean).join(' · ');
  return <div data-dp-lien className="flex min-w-0 items-center gap-1.5 text-xs text-cave-200">
    <PictoLien lien={texte?'relie':'aucun'} size={14}/><span className="truncate">{texte||'Ni stock ni matériel lié'}</span>
  </div>;
}

function Pastilles({links}:{links:PurchaseLinks}) {
  const [toutes,setToutes]=useState(false);
  const montrees=toutes||links.stock.length<=2?links.stock:links.stock.slice(0,2), reste=links.stock.length-montrees.length;
  const pastille='inline-flex min-h-6 max-w-full items-center gap-1 rounded-control border border-cave-700 bg-cave-900/40 px-1.5 text-xs text-cave-50';
  if (!links.stock.length&&!links.equipment.length) return <p data-dp-liens className="flex items-center gap-1.5 text-xs text-cave-400"><PictoLien lien="aucun" size={14}/>Ni stock ni matériel lié à cette dépense</p>;
  return <div data-dp-liens className="space-y-1">
    {links.stock.length?<div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-cave-400 mr-0.5">Lié au stock</span>
      {montrees.map(entry=><span key={entry.ref} data-dp-article className={pastille}><PictoLien lien="relie" size={14}/><span className="truncate">{nomArticle(entry)}</span>{quantite(entry)?<span className="font-mono tabular-nums text-cave-200">{quantite(entry)}</span>:null}</span>)}
      {reste>0?<button type="button" aria-label={`Voir les ${links.stock.length} articles`} onClick={()=>setToutes(true)} className={`${pastille} font-medium`}>+{reste}</button>:null}
    </div>:null}
    {links.equipment.length?<div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-cave-400 mr-0.5">Matériel</span>
      {links.equipment.map(entry=><span key={entry.ref} className={pastille}><Wrench size={13} className="shrink-0 text-cave-200"/><span className="truncate">{entry.name??'matériel retiré'}</span></span>)}
    </div>:null}
  </div>;
}

type Ligne=NonNullable<FinanceTransaction['finance']>['lines'][number];
/**
 * LO-4 (08.11, doc5) : « Ses N lignes » compte comme l'écran de lecture (`Recap`, D249) : le port n'est pas une ligne, il est dit à part. Un seul critère du port,
 * celui de `groupes.ts` (`lignesDePort`). Avant : 26 ici (port compris) contre 25 à la nouvelle lecture de la même pièce.
 */
export function titreLignesSaisies(lines:readonly Ligne[]):string {
  const port=lignesDePort(lines.map(l=>({id:l.id,kind:l.kind,amount:l.amountCents/100}))), n=lines.filter(l=>!port.has(l.id)).length;
  return `Ses ${n} ligne${n>1?'s':''}${port.size?' et le port':''}`;
}
/** Les lignes de la dépense, chacune sous son libellé (celui de la fiche) ; le cube relié dit le lien au stock, la clé le matériel. */
function Lignes({lines}:{lines:Ligne[]}) {
  return <ul className="pb-1">{lines.map(line=><li key={line.id} className="grid grid-cols-[16px_minmax(0,1fr)_auto_auto] items-center gap-x-1.5 border-t border-cave-800/60 py-0.5">
    {line.stockItemRef?<PictoLien lien="relie" size={14}/>:line.equipmentRef?<Wrench size={13} className="text-cave-200"/>:<PictoLien lien="aucun" size={14}/>}
    <span className={`truncate ${line.stockItemRef||line.equipmentRef?'text-cave-50':'text-cave-400'}`}>{line.description}</span>
    <span className="font-mono tabular-nums text-cave-200">{quantite(line)}</span>
    <span className="w-16 text-right font-mono tabular-nums text-cave-200">{formatCHF(line.amountCents)}</span>
  </li>)}</ul>;
}

/**
 * Le cas certain : le fichier choisi est l'original de `tx`. Rien n'est lu (ni coût ni attente) ; la lecture reste possible (« Lire quand même »).
 * Au premier plan : la dépense (fournisseur, n°, date, total, règlement) et ce qu'elle a fait entrer (articles de stock, matériel) ;
 * ses lignes à un toucher au téléphone, dépliées dans la colonne de droite sur ordinateur (la carte reste à gauche, 440 px, comme la lecture).
 */
export function PieceDejaSaisie({tx,stocks,payments,transactions,onLire}:{tx:FinanceTransaction;stocks:Stocks;payments:FinancialPayment[];transactions:FinanceTransaction[];onLire:()=>void}) {
  const links=purchaseLinks(tx,stocks), lines=tx.finance?.lines??[], reglement=motReglement(tx,payments,transactions);
  const titreLignes=titreLignesSaisies(lines);
  const cellules=[{l:'Facture',v:tx.finance?.invoiceNumber?.trim()||'sans n°',mono:Boolean(tx.finance?.invoiceNumber?.trim())},{l:'Date',v:tx.date,mono:true},{l:'Total',v:formatCHF(Math.round(tx.amountTTC*100)),mono:true},{l:'Règlement',v:reglement,mono:false}];
  return <div className="lg:grid lg:grid-cols-[440px_minmax(0,1fr)] lg:items-start lg:gap-x-5">
  <section id="piece-deja-saisie" aria-label="Pièce déjà enregistrée" className={`${cadre} space-y-1.5`}>
    <div className="flex items-center gap-1.5">
      <AlertCircle size={14} className="shrink-0 text-attention"/>
      <p className="min-w-0 flex-1 text-sm font-medium text-attention">Déjà enregistré</p>
      <span className="shrink-0 rounded-control border border-attention/50 px-1.5 text-xs text-attention">même fichier</span>
    </div>
    <div className="min-w-0 text-[13px]"><p className="truncate font-medium text-cave-50">{tx.description}</p>
      {tx.finance?.vendor?<p className="truncate text-xs text-cave-400">{tx.finance.vendor}</p>:null}</div>
    <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-cave-800 pt-1 text-xs">
      {cellules.map(c=><div key={c.l} className="flex min-w-0 items-baseline gap-1.5"><dt className="w-16 shrink-0 text-cave-400">{c.l}</dt><dd className={`min-w-0 truncate ${c.mono?'font-mono tabular-nums':''} ${c.v==='À payer'||c.v.startsWith('Reste')?'text-attention':'text-cave-50'}`}>{c.v}</dd></div>)}
    </dl>
    <div className="border-t border-cave-800 pt-1"><Pastilles links={links}/></div>
    {lines.length?<details data-dp-lignes className="group border-t border-cave-800 text-xs lg:hidden">
      <summary className="flex min-h-7 cursor-pointer list-none items-center justify-between gap-2 text-cave-200"><span>{titreLignes}</span><ChevronDown size={14} className="shrink-0 transition-transform group-open:rotate-180"/></summary>
      <Lignes lines={lines}/>
    </details>:null}
    <div className="flex items-center gap-2 border-t border-cave-800 pt-1.5">
      <p className="min-w-0 flex-1 text-xs text-cave-400">Ce fichier est celui de cette dépense : il n’est pas relu.</p>
      <button type="button" onClick={onLire} className="min-h-7 shrink-0 rounded-control border border-cave-600 px-2 text-[13px] font-medium text-cave-200">Lire quand même</button>
    </div>
  </section>
  {lines.length?<aside data-dp-lignes-large aria-label={titreLignes} className="hidden text-[13px] lg:block">
    <p className="flex min-h-7 items-center text-xs text-cave-400">{titreLignes}</p>
    <Lignes lines={lines}/>
  </aside>:null}
  </div>;
}
