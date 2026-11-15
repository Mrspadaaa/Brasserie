import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileCheck2, FileText, Pencil, Undo2, Wheat, X } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { Sheet } from '../Sheet';
import { DocumentProofLink } from './DocumentProofLink';
import { ProofResendPanel } from './ProofUploadNotice';
import { Field, MoneyInput, CATEGORY_LABELS } from './FinanceForms';
import { amountOnly } from './financeFormat';
import { etatDeLigne } from './operations/calculs';
import { GROUPES, groupeDe } from './operations/groupes';
import { FactureLignes } from './fiche/FactureLignes';
import { dateFiche, MODE_COURT } from './fiche/format';
import { dateAffichee, formatCHF, isoDate, todayISO, transactionAmount, transactionKind, transactionVendor, transactionDirection, paymentState } from '../../domain/finance/ledger';
import { planOccurrences } from '../../domain/finance/forecast';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import './fiche/fiche.css';

/**
 * La fiche d'une opération (m5fo-a, 15.11) : la fiche rangée de m2fo-a avec la facture en barre de m2fo-c.
 *   en-tête (carré de catégorie, titre, tiers · date, croix) · montant · état de paiement · justificatif · « Dans la facture » (barre + rangées)
 *   · recette · Modifier, Avoir · Échéance et prévision · Paiements · Corriger une erreur de saisie.
 * Ce que la maquette n'a pas et que l'écran garde : « Noter un paiement » (quand il reste à payer), et sous « … » : confirmer qu'une pièce reste à régler, traitement annuel du matériel.
 * Toute écriture passe par `StorageService` et `FinanceService`, comme avant ; ce composant n'ouvre aucun chemin d'écriture neuf.
 */
export function TransactionDetails({transaction:tx,transactions,payments,plans,onClose,onEdit,onPay,onRefund,onOpenStockItem,onOpenRecipe}: {
  transaction:Transaction; transactions:Transaction[]; payments:FinancialPayment[]; plans:FinancialPlan[];
  onClose:()=>void; onEdit:()=>void; onPay:()=>void; onRefund:()=>void;
  /** Renvoi vers l'article acheté, quand la ligne sait de quel article il s'agit (segment de la barre comme rangée). */
  onOpenStockItem?:(ref:string)=>void;
  /** Renvoi vers la recette estimée par le budget auquel cette facture se rattache. */
  onOpenRecipe?:(recipeId:string)=>void;
}) {
  const [error,setError]=useState(''), [correction,setCorrection]=useState<string|null>(null);
  const state=paymentState(tx,payments,transactions), plan=plans.find(p=>p.id===tx.finance?.planId);
  const estimate=plan?.brewEstimate as {recipeId?:string;title?:string}|undefined;
  const brewRecipeId=estimate?.recipeId, brewTitle=estimate?.title;
  const outgoing=transactionDirection(tx,transactions)==='out';
  const voided=!!tx.finance?.voidedAt;
  const etat=etatDeLigne(tx,state,!outgoing,payments,todayISO());
  /* Payé : le texte de la maquette (✓ payé 9 nov. · banque). Ouvert : les mots que cette fiche a toujours dits (« Reste à payer : 100,00 CHF »), l'échéance en dessous ; la couleur (hachure, rouge) vient de l'état. */
  const ouvert=state.state==='unpaid'||state.state==='partial';
  const pastille=ouvert?`${state.state==='partial'?'Reste à':'À'} ${outgoing?'payer':'encaisser'} : ${formatCHF(state.remainingCents)}`:etat.texte;
  const year=Number((isoDate(tx.date)??todayISO()).slice(0,4));
  const occurrences=plan?.recurrence?planOccurrences(plan,`${year-1}-01-01`,`${year+2}-12-31`):[];
  const apply=(fn:()=>void)=>{try{fn();setError('');setCorrection(null);}catch(e){setError((e as Error).message);}};
  const update=(patch:Partial<NonNullable<Transaction['finance']>>)=>apply(()=>StorageService.updateTransaction({...tx,finance:{version:1,kind:transactionKind(tx),amountCents:transactionAmount(tx),lines:[],...tx.finance,...patch}}));
  const groupe=GROUPES[groupeDe(tx,{retardHorsMois:false})];
  const lines=tx.finance?.lines??[];
  const equipement=!voided&&lines.some(l=>l.kind==='equipment');
  const aConfirmer=!voided&&state.state==='unknown';
  const plus=aConfirmer||equipement;
  const aJustificatif=!!tx.proofUrl||!!tx.finance?.proofDocumentId;
  const paiements=payments.filter(p=>p.transactionId===tx.id);
  const tiers=[CATEGORY_LABELS[tx.category]??tx.category,transactionVendor(tx),dateFiche(tx.date)].filter(Boolean).join(' · ');
  const nomPiece=tx.proofFileName||tx.finance?.invoiceNumber;
  return <Sheet open title={tx.description} subtitle={tiers} onClose={onClose} className="finance-sheet fiche-sheet">
    <div className="fiche">
      <div className="fiche-hd">
        <span className="fiche-sq" style={{background:groupe.fond}} aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={groupe.trait} strokeWidth="2.8"><path d={groupe.chemin}/></svg></span>
        <span className="fiche-t"><b>{tx.description}</b><span>{tiers}</span></span>
        <button type="button" className="fiche-x" aria-label="Fermer" onClick={onClose}><X size={18} aria-hidden="true"/></button>
      </div>
      {error&&<p role="alert" className="fiche-erreur">{error}</p>}
      <div className="fiche-sum"><strong className="fiche-amt fiche-m reading">{amountOnly(transactionAmount(tx))}</strong><span className="fiche-cur">CHF</span>{!voided&&<span className={`fiche-tg fiche-tg-${etat.ton}`}>{pastille}</span>}</div>
      {voided&&<p className="fiche-note">Écriture annulée. Justificatif et historique conservés.</p>}
      {!voided&&tx.finance?.dueDate&&state.remainingCents>0&&<p className="fiche-note">Échéance : {new Date(`${tx.finance.dueDate}T12:00:00`).toLocaleDateString('fr-CH')}</p>}
      {!voided&&state.state==='partial'&&state.paidCents>0&&<p className="fiche-note">{outgoing?'Déjà payé':'Déjà encaissé'} : {formatCHF(state.paidCents)}</p>}
      {tx.finance?.refundApplication==='offset'?<p className="fiche-note">Cet avoir est imputé sur la facture d’origine. Aucun mouvement d’argent n’est enregistré.</p>:state.appliedCreditCents>0?<p className="fiche-note">Avoirs imputés : {formatCHF(state.appliedCreditCents)}. Reste à régler : {formatCHF(state.remainingCents)}.</p>:null}
      {!voided&&state.overpaidCents>0&&<p className="fiche-note">Paiement en trop : {formatCHF(state.overpaidCents)}. Vérifie l’historique des paiements.</p>}
      <ProofResendPanel transaction={tx}/>
      {aJustificatif
        ? <div className="fiche-pj"><FileCheck2 size={18} aria-hidden="true"/><span>{tx.finance?.sourceDocumentType==='receipt'?'ticket':tx.finance?.sourceDocumentType==='credit_note'?'avoir':'facture'}{nomPiece&&<> · <em>{nomPiece}</em></>}</span><DocumentProofLink transaction={tx} className="fiche-voir"/></div>
        : !tx.finance?.proofUpload&&<div className="fiche-pj fiche-pj-sans"><FileText size={18} aria-hidden="true" strokeDasharray="3 2.4"/><span>Sans justificatif</span></div>}
      {/* ⚠️ Le détail d'un achat est l'endroit où le brasseur se demande « il m'en reste combien ? ». Le segment ou la rangée qui sait de quel
          article elle parle y renvoie directement : sans ce lien il fallait retenir le nom, changer d'onglet et le rechercher dans l'inventaire. */}
      <FactureLignes lines={lines} onOpenStockItem={onOpenStockItem}/>
      {brewRecipeId&&onOpenRecipe&&<button type="button" className="fiche-rec" onClick={()=>onOpenRecipe(brewRecipeId)}>
        <Wheat size={17} aria-hidden="true"/>Recette{brewTitle?` · ${brewTitle}`:''}<ChevronRight size={14} aria-hidden="true"/></button>}
      {!voided&&state.remainingCents>0&&<button type="button" className="fiche-b1" onClick={onPay}>{outgoing?'Noter un paiement':'Noter un encaissement'}</button>}
      {!voided&&<div className="fiche-acts" style={{marginTop:state.remainingCents>0?8:4}}>
        <button type="button" className="fiche-b2" onClick={onEdit}><Pencil size={15} aria-hidden="true"/>Modifier</button>
        {['expense','income'].includes(transactionKind(tx))&&<button type="button" className="fiche-b2" onClick={onRefund}><Undo2 size={15} aria-hidden="true"/>Avoir ou remboursement</button>}
      </div>}
      {plus&&<details className="fiche-plus"><summary aria-label="Plus d’actions">… <span className="finance-muted">Plus d’actions</span></summary><div>
        {aConfirmer&&<button type="button" className="fiche-b2" onClick={()=>update({paymentStatus:'unpaid'})}>Confirmer que cette pièce reste à régler</button>}
        {equipement&&<div><p className="fiche-note"><strong>Traitement annuel du matériel</strong><br/>Confirme le traitement de chaque achat avec tes règles comptables. Aucun seuil d’immobilisation n’est imposé.</p>{lines.filter(l=>l.kind==='equipment').map(line=><Field key={line.id} label={line.description}><select value={line.capitalTreatment??''} onChange={e=>update({lines:tx.finance!.lines.map(l=>l.id===line.id?{...l,capitalTreatment:e.target.value as 'expense'|'asset'||undefined}:l)})}><option value="">À confirmer</option><option value="expense">Passer en charge (petit matériel)</option><option value="asset">Immobiliser et amortir</option></select></Field>)}</div>}
      </div></details>}
      {!voided&&<details className="fiche-dt"><summary><span>Échéance et prévision</span>{plan&&<em>{plan.title}</em>}<ChevronRight size={16} aria-hidden="true"/></summary><div className="fiche-corps">
        <Field label="Échéance de la facture"><input type="date" value={tx.finance?.dueDate??''} onChange={e=>update({dueDate:e.target.value||undefined})}/></Field>
        <Field label="Rattacher à une prévision"><select value={tx.finance?.planId??''} onChange={e=>update({planId:e.target.value||undefined,occurrenceId:undefined,planAllocatedCents:undefined})}><option value="">Aucune</option>{plans.filter(p=>(p.status==='active'||p.source==='equipment'&&p.status==='draft'||p.id===tx.finance?.planId)&&p.direction===transactionDirection(tx,transactions)).map(p=><option key={p.id} value={p.id}>{p.title} · {formatCHF(p.amountCents)}</option>)}</select></Field>
        {plan&&<MoneyInput label="Montant de cette facture qui remplace la prévision (CHF)" value={tx.finance?.planAllocatedCents} onChange={v=>update({planAllocatedCents:v})}/>}
        {plan?.recurrence&&<Field label="Échéance prévue remplacée par cette facture"><select value={tx.finance?.occurrenceId??''} onChange={e=>update({occurrenceId:e.target.value||undefined})}><option value="">Choisir la période concernée</option>{occurrences.map(o=><option key={o.id} value={o.id}>{dateAffichee(o.date)}</option>)}</select></Field>}
      </div></details>}
      <details className="fiche-dt fiche-dt-bas" open={paiements.length>0}><summary><span>Paiements</span><em>{paiements.length||''}</em><ChevronDown size={16} aria-hidden="true"/></summary>
        {paiements.map(p=><div className="fiche-hist" key={p.id}><div><span>{dateFiche(p.date)} · {MODE_COURT[p.method]??p.method}{p.reversalOfId?' · correction':''}</span><span className="fiche-m">{p.direction==='in'?'+':'−'}{amountOnly(p.amountCents)}</span></div>
          {/* m5pa-d : un virement a un seul justificatif, lié à chaque paiement qu'il a réglé ; il se montre sur la ligne de ce paiement, distinct du justificatif de la pièce. */}
          {p.proofDocumentId&&<div className="fiche-hist-pj"><FileCheck2 size={14} aria-hidden="true"/><span>{p.proofFileName||'justificatif du virement'}</span><DocumentProofLink transaction={tx} document={{id:p.proofDocumentId,fileName:p.proofFileName}}/></div>}
          {!p.reversalOfId&&!payments.some(r=>r.reversalOfId===p.id)&&<button type="button" onClick={()=>setCorrection(p.id)}>Corriger ce paiement saisi par erreur</button>}</div>)}
        {!paiements.length&&<p className="fiche-note">Aucun paiement daté enregistré.</p>}
      </details>
      {!voided&&<details className="fiche-dt"><summary><span>Corriger une erreur de saisie</span><ChevronRight size={16} aria-hidden="true"/></summary><div className="fiche-corps"><p className="fiche-note">Une annulation conserve la pièce et son historique. Un achat déjà consommé ou lié à un amortissement demande d’abord une correction de ses liens.</p><button type="button" className="fiche-b2" onClick={()=>setCorrection('void')}>Annuler cette écriture</button></div></details>}
      {correction&&<div className="fiche-corriger"><p>{correction==='void'?'Confirmer l’annulation de cette écriture erronée ?':'Ce paiement a été saisi par erreur. Sa contre-écriture reprendra la date d’origine ; pour un remboursement réel, utilise un avoir.'}</p><div className="finance-actions"><button type="button" className="finance-action secondary" onClick={()=>setCorrection(null)}>Garder</button><button type="button" className="finance-action danger" onClick={()=>apply(()=>{if(correction==='void'){const result=StorageService.revertTransaction(tx.id);if(!result.success)throw Error(result.message);}else{const p=payments.find(p=>p.id===correction)!;FinanceService.recordPayment({...p,id:`CONTRE-${p.id}`,direction:p.direction==='in'?'out':'in',reversalOfId:p.id,note:'Correction d’un paiement saisi par erreur',recordedAt:new Date().toISOString()});}})}>Confirmer la correction</button></div></div>}
    </div>
  </Sheet>;
}
