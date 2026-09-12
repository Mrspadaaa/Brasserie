import React, { useState } from 'react';
import type { Transaction } from '../../types';
import type { FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { Sheet } from '../Sheet';
import { DocumentProofLink } from './DocumentProofLink';
import { Field, MoneyInput, CATEGORY_LABELS } from './FinanceForms';
import { formatCHF, isoDate, todayISO, transactionAmount, transactionKind, transactionVendor, transactionDirection, paymentState } from '../../domain/finance/ledger';
import { planOccurrences } from '../../domain/finance/forecast';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';

export function TransactionDetails({transaction:tx,transactions,payments,plans,onClose,onEdit,onPay,onRefund}: {
  transaction:Transaction; transactions:Transaction[]; payments:FinancialPayment[]; plans:FinancialPlan[];
  onClose:()=>void; onEdit:()=>void; onPay:()=>void; onRefund:()=>void;
}) {
  const [error,setError]=useState(''), [correction,setCorrection]=useState<string|null>(null);
  const state=paymentState(tx,payments,transactions), plan=plans.find(p=>p.id===tx.finance?.planId);
  const outgoing=transactionDirection(tx,transactions)==='out';
  const paymentLabel=state.state==='unknown'?'Paiement à confirmer':state.state==='paid'?'Soldé':`${state.state==='partial'?'Reste à':'À'} ${outgoing?'payer':'encaisser'} : ${formatCHF(state.remainingCents)}`;
  const year=Number((isoDate(tx.date)??todayISO()).slice(0,4));
  const occurrences=plan?.recurrence?planOccurrences(plan,`${year-1}-01-01`,`${year+2}-12-31`):[];
  const apply=(fn:()=>void)=>{try{fn();setError('');setCorrection(null);}catch(e){setError((e as Error).message);}};
  const update=(patch:Partial<NonNullable<Transaction['finance']>>)=>apply(()=>StorageService.updateTransaction({...tx,finance:{version:1,kind:transactionKind(tx),amountCents:transactionAmount(tx),lines:[],...tx.finance,...patch}}));
  return <Sheet open title={tx.description} onClose={onClose} className="finance-sheet" footer={<button className="finance-action secondary w-full" onClick={onClose}>Fermer</button>}>
    <div className="finance-form">
      {error&&<p role="alert" className="finance-error">{error}</p>}
      <div className="finance-summary"><span className="finance-label">{transactionVendor(tx)||CATEGORY_LABELS[tx.category]} · {isoDate(tx.date)??tx.date}</span><strong className="reading">{formatCHF(transactionAmount(tx))}</strong>{tx.finance?.voidedAt?<p className="finance-notice">Écriture annulée. Justificatif et historique conservés.</p>:<div className="mt-3"><p className={`finance-status ${state.state}`}>{paymentLabel}</p>{state.state==='partial'&&state.paidCents>0&&<p className="finance-muted mt-2">{outgoing?'Déjà payé':'Déjà encaissé'} : {formatCHF(state.paidCents)}</p>}{tx.finance?.dueDate&&state.remainingCents>0&&<p className="finance-muted mt-2">Échéance : {new Date(`${tx.finance.dueDate}T12:00:00`).toLocaleDateString('fr-CH')}</p>}</div>}</div>
      {tx.finance?.refundApplication==='offset'?<p className="finance-notice">Cet avoir est imputé sur la facture d’origine. Aucun mouvement d’argent n’est enregistré.</p>:state.appliedCreditCents>0?<p className="finance-notice">Avoirs imputés : {formatCHF(state.appliedCreditCents)}. Reste à régler : {formatCHF(state.remainingCents)}.</p>:null}
      {!tx.finance?.voidedAt&&<>
        {state.overpaidCents>0&&<p className="finance-notice">Paiement en trop : {formatCHF(state.overpaidCents)}. Vérifie l’historique des paiements.</p>}
        <div className="finance-actions">{state.remainingCents>0&&<button className="finance-action" onClick={onPay}>{outgoing?'Noter un paiement':'Noter un encaissement'}</button>}<button className="finance-action secondary" onClick={onEdit}>Modifier les informations</button></div>
        {state.state==='unknown'&&<button className="finance-action secondary" onClick={()=>update({paymentStatus:'unpaid'})}>Confirmer que cette pièce reste à régler</button>}
      </>}
      <DocumentProofLink transaction={tx} className="finance-action secondary"/>
      {tx.finance?.lines.map(line=><div className="finance-row" key={line.id}><span className="finance-row-main">{line.description}<br/><span className="finance-muted">{line.quantity??''} {line.unit??''}{line.kind==='equipment'?' · Matériel':''}</span></span><span>{formatCHF(line.amountCents)}</span></div>)}
      {!tx.finance?.voidedAt&&tx.finance?.lines.some(l=>l.kind==='equipment')&&<details><summary>Traitement annuel du matériel</summary><p className="finance-muted">Confirme le traitement de chaque achat avec tes règles comptables. Aucun seuil d’immobilisation n’est imposé.</p>{tx.finance.lines.filter(l=>l.kind==='equipment').map(line=><Field key={line.id} label={line.description}><select value={line.capitalTreatment??''} onChange={e=>update({lines:tx.finance!.lines.map(l=>l.id===line.id?{...l,capitalTreatment:e.target.value as 'expense'|'asset'||undefined}:l)})}><option value="">À confirmer</option><option value="expense">Passer en charge (petit matériel)</option><option value="asset">Immobiliser et amortir</option></select></Field>)}</details>}
      {!tx.finance?.voidedAt&&<>
        <details><summary>Échéance et prévision{plan?` · ${plan.title}`:''}</summary><div className="finance-form">
        <Field label="Échéance de la facture"><input type="date" value={tx.finance?.dueDate??''} onChange={e=>update({dueDate:e.target.value||undefined})}/></Field>
        <Field label="Rattacher à une prévision"><select value={tx.finance?.planId??''} onChange={e=>update({planId:e.target.value||undefined,occurrenceId:undefined,planAllocatedCents:undefined})}><option value="">Aucune</option>{plans.filter(p=>(p.status==='active'||p.source==='equipment'&&p.status==='draft'||p.id===tx.finance?.planId)&&p.direction===transactionDirection(tx,transactions)).map(p=><option key={p.id} value={p.id}>{p.title} · {formatCHF(p.amountCents)}</option>)}</select></Field>
        {plan&&<MoneyInput label="Montant de cette facture qui remplace la prévision (CHF)" value={tx.finance?.planAllocatedCents} onChange={v=>update({planAllocatedCents:v})}/>}
        {plan?.recurrence&&<Field label="Échéance prévue remplacée par cette facture"><select value={tx.finance?.occurrenceId??''} onChange={e=>update({occurrenceId:e.target.value||undefined})}><option value="">Choisir la période concernée</option>{occurrences.map(o=><option key={o.id} value={o.id}>{o.date}</option>)}</select></Field>}
        </div></details>
        {['expense','income'].includes(transactionKind(tx))&&<button className="finance-link" onClick={onRefund}>Enregistrer un avoir ou remboursement</button>}
      </>}
      <details><summary>Historique des paiements</summary>{payments.filter(p=>p.transactionId===tx.id).map(p=><div className="finance-item-editor" key={p.id}><div className="finance-row"><span className="finance-row-main">{p.date} · {{bank:'Compte bancaire / carte',cash:'Espèces',twint:'TWINT',other:'Autre'}[p.method]}{p.reversalOfId?' · Correction':''}</span><span>{p.direction==='in'?'+':'−'} {formatCHF(p.amountCents)}</span></div>{!p.reversalOfId&&!payments.some(r=>r.reversalOfId===p.id)&&<button className="finance-link" onClick={()=>setCorrection(p.id)}>Corriger ce paiement erroné</button>}</div>)}{!payments.some(p=>p.transactionId===tx.id)&&<p className="finance-muted">Aucun paiement daté enregistré.</p>}</details>
      {!tx.finance?.voidedAt&&<details><summary>Corriger une erreur de saisie</summary><p className="finance-muted">Une annulation conserve la pièce et son historique. Un achat déjà consommé ou lié à un amortissement demande d’abord une correction de ses liens.</p><button className="finance-link" onClick={()=>setCorrection('void')}>Annuler cette écriture</button></details>}
      {correction&&<div className="finance-item-editor"><p>{correction==='void'?'Confirmer l’annulation de cette écriture erronée ?':'Ce paiement a été saisi par erreur. Sa contre-écriture reprendra la date d’origine ; pour un remboursement réel, utilise un avoir.'}</p><div className="finance-actions"><button className="finance-action secondary" onClick={()=>setCorrection(null)}>Garder</button><button className="finance-action danger" onClick={()=>apply(()=>{if(correction==='void'){const result=StorageService.revertTransaction(tx.id);if(!result.success)throw Error(result.message);}else{const p=payments.find(p=>p.id===correction)!;FinanceService.recordPayment({...p,id:`CONTRE-${p.id}`,direction:p.direction==='in'?'out':'in',reversalOfId:p.id,note:'Correction d’un paiement saisi par erreur',recordedAt:new Date().toISOString()});}})}>Confirmer la correction</button></div></div>}
    </div>
  </Sheet>;
}
