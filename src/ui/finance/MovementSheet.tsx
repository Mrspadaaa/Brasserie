import { Input } from '../Input';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Transaction } from '../../types';
import type { FinancialPayment } from '../../domain/finance/types';
import { Sheet } from '../Sheet';
import { Field, MoneyInput, idFor } from './FinanceForms';
import { formatCHF, todayISO, transactionAmount, transactionDirection, validateFinanceTransaction, ventilationAvoir } from '../../domain/finance/ledger';
import { FinanceService, validateFinancialPayment, validateRefundTransaction } from '../../services/financeService';
import { FirestoreRepo, isConfirmedWriteRejection } from '../../services/firestoreRepo';
import { StorageService } from '../../services/storage';
import { ApportPoches } from './mouvement/ApportPoches';
import { effetMouvement } from './mouvement/effetMois';
import { lancerEnvoi, lirePiece, placerPiece, preparerEnvoi, retirerDeLaFile, type PieceJointe } from './mouvement/justificatif';

/** Private cash and credit notes never masquerade as sales or new purchases. */
/** `prefill` (dp, 10.11) : le renvoi d'une ligne « pas un achat de brasserie ? » ouvre la feuille sur un prélèvement, montant et motif déjà posés. */
/**
 * Apport ou prélèvement privé = m5ap-a (`mouvement/ApportPoches`), avec son justificatif (la pièce de l'opération, par la file des justificatifs).
 * Un avoir ou remboursement (`original`) garde son formulaire d'avant : la maquette ne le montre pas, rien n'y change.
 */
export function MovementSheet({original,onClose,onSaved,prefill}:{original?:Transaction;onClose:()=>void;onSaved:()=>void;prefill?:{kind:'contribution'|'withdrawal';amountCents:number;note:string;date?:string}}) {
  const [id]=useState(()=>idFor('MOUV')), [amount,setAmount]=useState<number|undefined>(prefill?.amountCents), [date,setDate]=useState(prefill?.date&&prefill.date<=todayISO()?prefill.date:todayISO());
  const [kind,setKind]=useState<'contribution'|'withdrawal'>(prefill?.kind??'contribution'), [note,setNote]=useState(prefill?.note??'');
  const [application,setApplication]=useState<'cash'|'offset'|''>('');
  const [paid,setPaid]=useState(!original), [method,setMethod]=useState<FinancialPayment['method']>('bank'), [error,setError]=useState(''),[busy,setBusy]=useState(false),[pending,setPending]=useState(false);
  const [piece,setPiece]=useState<PieceJointe|null>(null),[pieceError,setPieceError]=useState('');
  const lock=useRef(false),submitted=useRef(false),mounted=useRef(true),retry=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const choisirPiece=async(file:File|null)=>{setPieceError('');if(!file){setPiece(null);return;}try{setPiece(await lirePiece(file));}catch(e){setPiece(null);setPieceError((e as Error).message);}};
  /* L'effet se lit du registre à chaque changement de montant, de date ou de sens (jamais 0 pour un inconnu : la caisse sans solde de départ confirmé reste `null`). */
  const effet=useMemo(()=>original?null:effetMouvement({transactions:StorageService.getTransactions(),payments:FinanceService.getPayments(),profile:FinanceService.getProfile(),date,sens:kind==='contribution'?'in':'out',amountCents:amount}),[original,date,kind,amount]);
  const save=async(e:React.FormEvent)=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');let queuedId:string|undefined;try {
    if(!submitted.current){
      if(!amount||amount<=0||!note.trim())throw Error('Indique un montant positif et un motif.');
      if(original&&!application)throw Error('Choisis si l’avoir réduit la facture ou sera remboursé en argent.');
      const txs=StorageService.getTransactions(),currentOriginal=original?txs.find(t=>t.id===original.id):undefined;
      const direction=original?(transactionDirection(currentOriginal??original,txs)==='out'?'in':'out'):(kind==='contribution'?'in':'out');
      const at=new Date().toISOString();
      /* AM-64 : un avoir reprend la ventilation de TVA de sa facture (au prorata) ; HT = TTC effaçait la TVA à récupérer ou à reverser. Un apport ou prélèvement privé n'a pas de TVA. */
      const ventile=original?ventilationAvoir(currentOriginal??original,amount):{amountHT:amount/100,tvaRate:0,tvaAmount:0};
      const tx:Transaction={id,date,description:note.trim(),category:currentOriginal?.category??original?.category??'apports',subcategory:original?'Avoir':kind==='contribution'?'Apport privé':'Prélèvement privé',amountHT:ventile.amountHT,amountTTC:amount/100,tvaRate:ventile.tvaRate,tvaAmount:ventile.tvaAmount,
        finance:{version:1,kind:original?'refund':kind,amountCents:amount,lines:[],refundOfId:original?.id,refundDirection:original?direction:undefined,refundApplication:original?(application as 'cash'|'offset'):undefined,paymentStatus:'unpaid',recordedAt:at,vendor:currentOriginal?.finance?.vendor,notes:note.trim()}};
      validateFinanceTransaction(tx);
      if(original)validateRefundTransaction(tx,txs,FinanceService.getPayments());
      const hasPayment=paid&&(!original||application==='cash');
      const payment:FinancialPayment={id:`PAI-${id}`,transactionId:id,date,amountCents:amount,direction,method,recordedAt:at};
      if(hasPayment)validateFinancialPayment(payment);
      let written:Transaction=tx;
      if(!original&&piece){
        /* Le justificatif est la pièce de l'opération : contrôlé et mis à l'abri AVANT l'écriture (file locale, ou Drive confirmé sans file). Une erreur ici n'écrit rien. */
        const envoi=await preparerEnvoi(piece,id,date,kind==='contribution'?'Apport privé':'Prélèvement privé');
        const place=await placerPiece(envoi,id);
        if(place.voie==='file')queuedId=id;
        written={...tx,proofFileName:envoi.driveName,proofType:envoi.mime,finance:{...tx.finance!,proofOriginalFileName:envoi.originalName,...(place.voie==='file'?{proofUpload:{state:'queued' as const,uid:place.uid,at}}:{proofDocumentId:envoi.proof.id})}};
      }
      if(retry.current||!txs.some(t=>t.id===id)){if(hasPayment)FinanceService.stageNewTransactionPayment(written,payment);else StorageService.addTransaction(written);}
      queuedId=undefined;
      submitted.current=true;setPending(true);
      retry.current=false;
      if(!original&&piece)lancerEnvoi();
    }
    await FirestoreRepo.waitForDocument<Transaction>('transactions',id,15000,tx=>tx.finance?.amountCents===amount&&tx.finance.kind===(original?'refund':kind)&&tx.date===date);
    if(mounted.current){onSaved();onClose();}
  }catch(e){if(queuedId)await retirerDeLaFile(queuedId);if(isConfirmedWriteRejection(e)){submitted.current=false;retry.current=true;if(mounted.current)setPending(false);}if(mounted.current)setError((e as Error).message);}finally{lock.current=false;if(mounted.current)setBusy(false);}};
  const titre=original?'Avoir ou remboursement':kind==='contribution'?'De ta poche à la brasserie':'De la brasserie à ta poche';
  const libelleBouton=busy?'Confirmation…':pending?'Vérifier la synchronisation':original?'Enregistrer ce mouvement':kind==='contribution'?'Enregistrer l’apport':'Enregistrer le prélèvement';
  return <Sheet open title={titre} onClose={onClose} dismissible={!busy} className={original?'finance-sheet':'finance-sheet mvt-feuille'} footer={<button type="submit" form="finance-movement" disabled={busy} className={original?'finance-action w-full':'finance-action mvt-cta w-full'}>{libelleBouton}</button>}><form autoComplete="off" id="finance-movement" className="finance-form" onSubmit={save}>
    {error&&<p role="alert" className="finance-error">{error}</p>}
    <fieldset disabled={busy||pending} className="finance-form min-w-0 border-0 p-0 m-0">
    {!original&&effet&&<ApportPoches kind={kind} onKind={setKind} amount={amount} onAmount={setAmount} date={date} onDate={setDate} method={method} onMethod={setMethod} note={note} onNote={setNote} piece={piece} onPiece={choisirPiece} pieceError={pieceError} effet={effet}/>}
    {original&&<>
    <p className="finance-muted">Pièce liée : {original.description} · {formatCHF(transactionAmount(original))}. Aucun stock n’est modifié par l’avoir ; consigne un retour physique dans l’inventaire.</p>
    <Field label="Comment appliquer cet avoir ?"><select value={application} onChange={e=>setApplication(e.target.value as typeof application)} required><option value="">Choisir le traitement</option><option value="offset">Déduire de la facture restant à régler</option><option value="cash">Remboursement d’argent, reçu ou attendu</option></select></Field>
    {application==='offset'&&<p className="finance-notice">L’avoir réduit le montant restant de la facture. Il ne crée aucun encaissement ni paiement.</p>}
    <MoneyInput label="Montant (CHF)" value={amount} onChange={setAmount} required/>
    <Field label="Date"><input type="date" value={date} max={todayISO()} onChange={e=>setDate(e.target.value)} required/></Field>
    <Field label="Motif"><Input value={note} onChange={e=>setNote(e.target.value)} required placeholder="Retour, remise du fournisseur…"/></Field>
    {application==='cash'&&<label className="finance-check"><input type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)}/>L’argent a réellement été remboursé à cette date.</label>}
    {paid&&application==='cash'&&<Field label="Moyen de paiement"><select value={method} onChange={e=>setMethod(e.target.value as typeof method)}><option value="bank">Banque</option><option value="cash">Espèces</option><option value="twint">TWINT</option><option value="other">Autre</option></select></Field>}
    </>}
    </fieldset>
  </form></Sheet>;
}
