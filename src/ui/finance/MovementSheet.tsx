import { Input } from '../Input';
import React, { useEffect, useRef, useState } from 'react';
import type { Transaction } from '../../types';
import type { FinancialPayment } from '../../domain/finance/types';
import { Sheet } from '../Sheet';
import { Field, MoneyInput, idFor } from './FinanceForms';
import { formatCHF, todayISO, transactionAmount, transactionDirection, validateFinanceTransaction } from '../../domain/finance/ledger';
import { FinanceService, validateFinancialPayment, validateRefundTransaction } from '../../services/financeService';
import { FirestoreRepo, isConfirmedWriteRejection } from '../../services/firestoreRepo';
import { StorageService } from '../../services/storage';

/** Private cash and credit notes never masquerade as sales or new purchases. */
export function MovementSheet({original,onClose,onSaved}:{original?:Transaction;onClose:()=>void;onSaved:()=>void}) {
  const [id]=useState(()=>idFor('MOUV')), [amount,setAmount]=useState<number>(), [date,setDate]=useState(todayISO());
  const [kind,setKind]=useState<'contribution'|'withdrawal'>('contribution'), [note,setNote]=useState('');
  const [application,setApplication]=useState<'cash'|'offset'|''>('');
  const [paid,setPaid]=useState(!original), [method,setMethod]=useState<FinancialPayment['method']>('bank'), [error,setError]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState(false);
  const lock=useRef(false),submitted=useRef(false),mounted=useRef(true),retry=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');try {
    if(!submitted.current){
      if(!amount||amount<=0||!note.trim())throw Error('Indique un montant positif et un motif.');
      if(original&&!application)throw Error('Choisis si l’avoir réduit la facture ou sera remboursé en argent.');
      const txs=StorageService.getTransactions(),currentOriginal=original?txs.find(t=>t.id===original.id):undefined;
      const direction=original?(transactionDirection(currentOriginal??original,txs)==='out'?'in':'out'):(kind==='contribution'?'in':'out');
      const at=new Date().toISOString();
      const tx:Transaction={id,date,description:note.trim(),category:currentOriginal?.category??original?.category??'apports',subcategory:original?'Avoir':kind==='contribution'?'Apport privé':'Prélèvement privé',amountHT:amount/100,amountTTC:amount/100,tvaRate:0,tvaAmount:0,
        finance:{version:1,kind:original?'refund':kind,amountCents:amount,lines:[],refundOfId:original?.id,refundDirection:original?direction:undefined,refundApplication:original?(application as 'cash'|'offset'):undefined,paymentStatus:'unpaid',recordedAt:at,vendor:currentOriginal?.finance?.vendor,notes:note.trim()}};
      validateFinanceTransaction(tx);
      if(original)validateRefundTransaction(tx,txs,FinanceService.getPayments());
      const hasPayment=paid&&(!original||application==='cash');
      const payment:FinancialPayment={id:`PAI-${id}`,transactionId:id,date,amountCents:amount,direction,method,recordedAt:at};
      if(hasPayment)validateFinancialPayment(payment);
      if(retry.current||!txs.some(t=>t.id===id)){if(hasPayment)FinanceService.stageNewTransactionPayment(tx,payment);else StorageService.addTransaction(tx);}
      submitted.current=true;setPending(true);
      retry.current=false;
    }
    await FirestoreRepo.waitForDocument<Transaction>('transactions',id,15000,tx=>tx.finance?.amountCents===amount&&tx.finance.kind===(original?'refund':kind)&&tx.date===date);
    if(mounted.current){onSaved();onClose();}
  }catch(e){if(isConfirmedWriteRejection(e)){submitted.current=false;retry.current=true;if(mounted.current)setPending(false);}if(mounted.current)setError((e as Error).message);}finally{lock.current=false;if(mounted.current)setBusy(false);}};
  return <Sheet open title={original?'Avoir ou remboursement':'Apport ou prélèvement privé'} onClose={onClose} dismissible={!busy} className="finance-sheet" footer={<button type="submit" form="finance-movement" disabled={busy} className="finance-action w-full">{busy?'Confirmation…':pending?'Vérifier la synchronisation':'Enregistrer ce mouvement'}</button>}><form autoComplete="off" id="finance-movement" className="finance-form" onSubmit={save}>
    {error&&<p role="alert" className="finance-error">{error}</p>}
    <fieldset disabled={busy||pending} className="finance-form min-w-0 border-0 p-0 m-0">
    {original?<p className="finance-muted">Pièce liée : {original.description} · {formatCHF(transactionAmount(original))}. Aucun stock n’est modifié par l’avoir ; consigne un retour physique dans l’inventaire.</p>:<><Field label="Mouvement"><select value={kind} onChange={e=>setKind(e.target.value as typeof kind)}><option value="contribution">J’apporte de l’argent à la brasserie</option><option value="withdrawal">Je reprends de l’argent à titre privé</option></select></Field><p className="finance-muted">Ce mouvement change la trésorerie sans modifier le résultat de la brasserie.</p></>}
    {original&&<Field label="Comment appliquer cet avoir ?"><select value={application} onChange={e=>setApplication(e.target.value as typeof application)} required><option value="">Choisir le traitement</option><option value="offset">Déduire de la facture restant à régler</option><option value="cash">Remboursement d’argent, reçu ou attendu</option></select></Field>}
    {original&&application==='offset'&&<p className="finance-notice">L’avoir réduit le montant restant de la facture. Il ne crée aucun encaissement ni paiement.</p>}
    <MoneyInput label="Montant (CHF)" value={amount} onChange={setAmount} required/>
    <Field label="Date"><input type="date" value={date} max={todayISO()} onChange={e=>setDate(e.target.value)} required/></Field>
    <Field label="Motif"><Input value={note} onChange={e=>setNote(e.target.value)} required placeholder={original?'Retour, remise du fournisseur…':'Apport de départ, prélèvement personnel…'}/></Field>
    {original&&application==='cash'&&<label className="finance-check"><input type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)}/>L’argent a réellement été remboursé à cette date.</label>}
    {paid&&(!original||application==='cash')&&<Field label="Moyen de paiement"><select value={method} onChange={e=>setMethod(e.target.value as typeof method)}><option value="bank">Banque</option><option value="cash">Espèces</option><option value="twint">TWINT</option><option value="other">Autre</option></select></Field>}
    </fieldset>
  </form></Sheet>;
}
