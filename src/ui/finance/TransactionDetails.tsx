import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileCheck2, FileText, Pencil, Undo2, Wheat, X } from 'lucide-react';
import type { Transaction } from '../../types';
import type { FinancialPayment, FinancialPlan } from '../../domain/finance/types';
import { Sheet } from '../Sheet';
import { DocumentProofLink } from './DocumentProofLink';
import { ProofResendPanel } from './ProofUploadNotice';
import { Field, MoneyInput, CATEGORY_LABELS } from './FinanceForms';
import { amountOnly } from './financeFormat';
import { etatDeLigne, paiementRapide } from './operations/calculs';
import { idFor } from './FinanceForms';
import { GROUPES, groupeDe } from './operations/groupes';
import { FactureLignes } from './fiche/FactureLignes';
import { dateFiche, MODE_COURT } from './fiche/format';
import { dateAffichee, formatCHF, isActiveTransaction, isoDate, todayISO, transactionAmount, transactionKind, transactionVendor, transactionDirection, paymentState } from '../../domain/finance/ledger';
import { planOccurrences } from '../../domain/finance/forecast';
import { ecrituresLieesDans, phraseDuRetrait } from '../../domain/finance/retraitEcriture';
import { estMouvementPrive, paiementsVivants } from '../../domain/finance/correctionMontant';
import { retirerEcriture } from './modifier/retirerEcriture';
import { libelleEcriture } from '../../domain/finance/libelleEcriture';
import { origineDeCreance } from './modifier/origineCreance';
import { StorageService } from '../../services/storage';
import { FinanceService } from '../../services/financeService';
import './fiche/fiche.css';
import { ChoixDate } from '../ChoixDate';

/**
 * La fiche d'une opération (m5fo-a, 15.11) : la fiche rangée de m2fo-a avec la facture en barre de m2fo-c.
 *   en-tête (carré de catégorie, titre, tiers · date, croix) · montant · état de paiement · justificatif · « Dans la facture » (barre + rangées)
 *   · recette · Modifier, Avoir · Échéance et prévision · Paiements · Corriger une erreur de saisie.
 * Ce que la maquette n'a pas et que l'écran garde : « Noter un paiement » (quand il reste à payer), et sous « … » : confirmer qu'une pièce reste à régler, traitement annuel du matériel.
 * Toute écriture passe par `StorageService` et `FinanceService`, comme avant ; ce composant n'ouvre aucun chemin d'écriture neuf.
 */
/** FN-41 : la note de la contre-écriture d'un paiement annulé d'un toucher (« Annuler » de la ligne) ou par « Corriger ce paiement saisi par erreur » : la paire se lit « annulé », pas « corrigé » (qui reste le mot d'un montant changé). */
const NOTE_ANNULATION='Correction d’un paiement saisi par erreur';
/** FN-7 : la note d'un paiement issu d'un virement sur plusieurs pièces (« Virement de 12.00 CHF réparti sur 2 pièces ») se lit « virement de 12,00 · 2 pièces ». Une autre note ne dit rien. */
function lienVirement(p:FinancialPayment):string{
  const m=/Virement de\s+(.+?)\s+réparti sur\s+(\d+)\s+pièces?/i.exec(p.note??'');
  if(!m) return '';
  const nombre=Number(m[1].replace(/[^\d.,]/g,'').replace(',','.'));
  return Number.isFinite(nombre)&&nombre>0?`virement de ${amountOnly(Math.round(nombre*100))} · ${m[2]} pièces`:'';
}

export function TransactionDetails({transaction:tx,transactions,payments,plans,onClose,onEdit,onPay,onRefund,onOpenStockItem,onOpenRecipe,onOpenTransaction}: {
  transaction:Transaction; transactions:Transaction[]; payments:FinancialPayment[]; plans:FinancialPlan[];
  onClose:()=>void; onEdit:()=>void; onPay:()=>void; onRefund:()=>void;
  /** Renvoi vers l'article acheté, quand la ligne sait de quel article il s'agit (segment de la barre comme rangée). */
  onOpenStockItem?:(ref:string)=>void;
  /** Renvoi vers la recette estimée par le budget auquel cette facture se rattache. */
  onOpenRecipe?:(recipeId:string)=>void;
  /** t3 (A2) : renvoi vers une autre opération (la créance « À récupérer » née d'un trop-payé sur cette pièce). */
  onOpenTransaction?:(transaction:Transaction)=>void;
}) {
  const [error,setError]=useState(''), [correction,setCorrection]=useState<string|null>(null), [occupe,setOccupe]=useState(false);
  const state=paymentState(tx,payments,transactions), plan=plans.find(p=>p.id===tx.finance?.planId);
  const estimate=plan?.brewEstimate as {recipeId?:string;title?:string}|undefined;
  const brewRecipeId=estimate?.recipeId, brewTitle=estimate?.title;
  const outgoing=transactionDirection(tx,transactions)==='out';
  const voided=!!tx.finance?.voidedAt;
  /* t3 (A2) : le franc de trop payé a une adresse. La créance écrite par la correction porte « « <pièce> » » dans son motif (`creanceDeTropPaye`) ; la pièce la montre et y renvoie. */
  const creances=transactions.filter(c=>c.id!==tx.id&&isActiveTransaction(c)&&(c.subcategory==='À récupérer'||c.subcategory==='À rembourser')&&origineDeCreance(c,transactions,payments)?.id===tx.id);
  const etat=etatDeLigne(tx,state,!outgoing,payments,todayISO());
  /* Payé : le texte de la maquette (✓ payé 9 nov. · banque). Ouvert : les mots que cette fiche a toujours dits (« Reste à payer : 100,00 CHF »), l'échéance en dessous ; la couleur (hachure, rouge) vient de l'état. */
  const ouvert=state.state==='unpaid'||state.state==='partial';
  /* FN-12 : un apport ou un prélèvement n'est jamais une créance : jamais « À encaisser », jamais « Noter un encaissement », pas d'échéance (FN-11) ; son paiement se corrige par Modifier, par « Corriger ce paiement » (u1, constat 19 : sans lui l'apport ne se retirait pas) ou par « Retirer cette écriture ». */
  const prive=estMouvementPrive(tx);
  const pastille=ouvert&&prive?`${transactionKind(tx)==='contribution'?'Apport':'Prélèvement'} : aucun paiement noté`:ouvert?`${state.state==='partial'?'Reste à':'À'} ${outgoing?'payer':'encaisser'} : ${formatCHF(state.remainingCents)}`:etat.texte;
  const year=Number((isoDate(tx.date)??todayISO()).slice(0,4));
  const occurrences=plan?.recurrence?planOccurrences(plan,`${year-1}-01-01`,`${year+2}-12-31`):[];
  const apply=(fn:()=>void)=>{try{fn();setError('');setCorrection(null);}catch(e){setError((e as Error).message);}};
  const ecrire=(patch:Partial<NonNullable<Transaction['finance']>>)=>StorageService.updateTransaction({...tx,finance:{version:1,kind:transactionKind(tx),amountCents:transactionAmount(tx),lines:[],...tx.finance,...patch}});
  const update=(patch:Partial<NonNullable<Transaction['finance']>>)=>apply(()=>ecrire(patch));
  /* FIN-FICHE-CONFIRMER (19.11, « Je peux pas confirmer le paiement sur cette vue ») : un paiement « à confirmer » se confirme payé au jour même, en
     banque, par le paiement rapide de la ligne (`paiementRapide`, `FinanceService.recordPayment`) ; une autre date ou un autre montant passe par « Noter un paiement ». */
  const confirmerPaye=()=>{const p=paiementRapide(tx,{...state,state:'unpaid'},outgoing?'out':'in',todayISO(),idFor('PAI'),new Date().toISOString());if(!p)throw new Error('Rien à confirmer sur cette pièce.');FinanceService.recordPayment(p);};
  /* « SI je la coche il y en a 2, sans justificatif et payment confirmé (ça prend la date du jour) » : sur une pièce à confirmer, la coche fait les deux. */
  const cocherNormal=(oui:boolean)=>apply(()=>{ecrire({proofNotNeeded:oui});if(oui&&!voided&&state.state==='unknown')confirmerPaye();});
  const groupe=GROUPES[groupeDe(tx,{retardHorsMois:false})];
  const lines=tx.finance?.lines??[];
  const equipement=!voided&&lines.some(l=>l.kind==='equipment');
  const aConfirmer=!voided&&state.state==='unknown';
  const plus=aConfirmer||equipement;
  const aJustificatif=!!tx.proofUrl||!!tx.finance?.proofDocumentId;
  const paiements=payments.filter(p=>p.transactionId===tx.id);
  const enVigueur=paiementsVivants(tx,payments);
  /* FN-41 : le compte et les lignes sont ceux qu'on voit : une contre-écriture se replie avec son paiement, elle ne compte pas à part. */
  const lignesPaiements=paiements.filter(p=>!(p.reversalOfId&&paiements.some(o=>o.id===p.reversalOfId)));
  /* u1 (20) : une pièce payée se retire en un geste (contre-paiements, puis annulation) ; les règles interdisent de supprimer, la confirmation le dit. */
  const retirer=async()=>{setOccupe(true);try{await retirerEcriture(tx.id,payments,{aujourdhui:todayISO(),maintenant:new Date().toISOString()});setError('');setCorrection(null);}catch(e){setError((e as Error).message);}finally{setOccupe(false);}};
  /* E41-1 : les remboursements liés se retirent avec la pièce ; la confirmation le dit, et un refus s'écrit sous le bouton touché (jamais seulement en haut de la fiche). */
  /* E44-2 : les mêmes écritures liées que celles que le retrait emporte (le registre, pas la liste affichée, qui ne montre pas les avoirs) ; la liste reçue complète le registre. */
  const liees=ecrituresLieesDans(tx.id,[...StorageService.getTransactions(),...transactions.filter(c=>!StorageService.getTransactions().some(r=>r.id===c.id))]);
  const tiers=[libelleEcriture(tx,CATEGORY_LABELS[tx.category]??tx.category),transactionVendor(tx),dateFiche(tx.date)].filter(Boolean).join(' · ');
  const nomPiece=tx.proofFileName||tx.finance?.invoiceNumber;
  return <Sheet open title={tx.description} subtitle={tiers} onClose={onClose} className="finance-sheet fiche-sheet">
    <div className="fiche">
      <div className="fiche-hd">
        <span className="fiche-sq" style={{background:groupe.fond}} aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={groupe.trait} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d={groupe.chemin}/></svg></span>
        <span className="fiche-t"><b>{tx.description}</b><span>{tiers}</span></span>
        <button type="button" className="fiche-x" aria-label="Fermer" onClick={onClose}><X size={18} aria-hidden="true"/></button>
      </div>
      {error&&correction!=='retrait'&&<p role="alert" className="fiche-erreur">{error}</p>}
      <div className="fiche-sum"><strong className="fiche-amt fiche-m reading">{amountOnly(transactionAmount(tx))}</strong><span className="fiche-cur">CHF</span>{!voided&&<span className={`fiche-tg fiche-tg-${etat.ton}`}>{pastille}</span>}</div>
      {!voided&&creances.map(c=><button type="button" key={c.id} className="fiche-rec" disabled={!onOpenTransaction} onClick={()=>onOpenTransaction?.(c)}>{amountOnly(c.finance?.amountCents??0)} CHF {c.subcategory==='À récupérer'?'à récupérer':'à rembourser'} : voir la créance<ChevronRight size={16} aria-hidden="true"/></button>)}
      {voided&&<p className="fiche-note">Écriture annulée. Justificatif et historique conservés.</p>}
      {!voided&&!prive&&tx.finance?.dueDate&&state.remainingCents>0&&<p className="fiche-note">Échéance : {new Date(`${tx.finance.dueDate}T12:00:00`).toLocaleDateString('fr-CH')}</p>}
      {!voided&&state.state==='partial'&&state.paidCents>0&&<p className="fiche-note">{outgoing?'Déjà payé':'Déjà encaissé'} : {formatCHF(state.paidCents)}</p>}
      {tx.finance?.refundApplication==='offset'?<p className="fiche-note">Cet avoir est imputé sur la facture d’origine. Aucun mouvement d’argent n’est enregistré.</p>:state.appliedCreditCents>0?<p className="fiche-note">Avoirs imputés : {formatCHF(state.appliedCreditCents)}. Reste à régler : {formatCHF(state.remainingCents)}.</p>:null}
      {!voided&&state.overpaidCents>0&&<p className="fiche-note">Paiement en trop : {formatCHF(state.overpaidCents)}. Vérifie l’historique des paiements.</p>}
      {aConfirmer&&<button type="button" className="fiche-b1 fiche-confirmer" onClick={()=>apply(confirmerPaye)}>Confirmer le paiement<span>{outgoing?'payé':'reçu'} aujourd’hui · banque</span></button>}
      <ProofResendPanel transaction={tx}/>
      {aJustificatif
        ? <div className="fiche-pj"><FileCheck2 size={18} aria-hidden="true"/><span>{tx.finance?.sourceDocumentType==='receipt'?'ticket':tx.finance?.sourceDocumentType==='credit_note'?'avoir':'facture'}{nomPiece&&<> · <em>{nomPiece}</em></>}</span><DocumentProofLink transaction={tx} className="fiche-voir"/></div>
        : !tx.finance?.proofUpload&&<div className="fiche-pj fiche-pj-sans"><FileText size={18} aria-hidden="true" strokeDasharray="3 2.4"/><span>Sans justificatif</span>{!voided&&<label className="fiche-pj-normal"><input type="checkbox" checked={!!tx.finance?.proofNotNeeded} onChange={e=>cocherNormal(e.target.checked)}/>c’est normal</label>}</div>}
      {/* ⚠️ Le détail d'un achat est l'endroit où le brasseur se demande « il m'en reste combien ? ». Le segment ou la rangée qui sait de quel
          article elle parle y renvoie directement : sans ce lien il fallait retenir le nom, changer d'onglet et le rechercher dans l'inventaire. */}
      <FactureLignes lines={lines} onOpenStockItem={onOpenStockItem}/>
      {brewRecipeId&&onOpenRecipe&&<button type="button" className="fiche-rec" onClick={()=>onOpenRecipe(brewRecipeId)}>
        <Wheat size={17} aria-hidden="true"/>Recette{brewTitle?` · ${brewTitle}`:''}<ChevronRight size={14} aria-hidden="true"/></button>}
      {!voided&&!prive&&state.remainingCents>0&&<button type="button" className={aConfirmer?'fiche-b2':'fiche-b1'} onClick={onPay}>{outgoing?(aConfirmer?'Noter un paiement':'Confirmer le paiement'):'Noter un encaissement'}</button>}
      {!voided&&<div className="fiche-acts" style={{marginTop:state.remainingCents>0&&!prive?8:4}}>
        <button type="button" className="fiche-b2" onClick={onEdit}><Pencil size={15} aria-hidden="true"/>Modifier</button>
        {['expense','income'].includes(transactionKind(tx))&&<button type="button" className="fiche-b2" onClick={onRefund}><Undo2 size={15} aria-hidden="true"/>Avoir ou remboursement</button>}
      </div>}
      {plus&&<details className="fiche-plus"><summary aria-label="Plus d’actions">… <span className="finance-muted">Plus d’actions</span></summary><div>
        {aConfirmer&&<button type="button" className="fiche-b2" onClick={()=>update({paymentStatus:'unpaid'})}>Confirmer que cette pièce reste à régler</button>}
        {equipement&&<div><p className="fiche-note"><strong>Traitement annuel du matériel</strong><br/>Confirme le traitement de chaque achat avec tes règles comptables. Aucun seuil d’immobilisation n’est imposé.</p>{lines.filter(l=>l.kind==='equipment').map(line=><Field key={line.id} label={line.description}><select value={line.capitalTreatment??''} onChange={e=>update({lines:tx.finance!.lines.map(l=>l.id===line.id?{...l,capitalTreatment:e.target.value as 'expense'|'asset'||undefined}:l)})}><option value="">À confirmer</option><option value="expense">Passer en charge (petit matériel)</option><option value="asset">Immobiliser et amortir</option></select></Field>)}</div>}
      </div></details>}
      {!voided&&!prive&&<details className="fiche-dt"><summary><span>Échéance et prévision</span>{plan&&<em>{plan.title}</em>}<ChevronRight size={16} aria-hidden="true"/></summary><div className="fiche-corps">
        <Field label="Échéance de la facture"><ChoixDate label="Échéance de la facture" valeur={tx.finance?.dueDate??''} onChange={d=>update({dueDate:d||undefined})}/></Field>
        <Field label="Rattacher à une prévision"><select value={tx.finance?.planId??''} onChange={e=>update({planId:e.target.value||undefined,occurrenceId:undefined,planAllocatedCents:undefined})}><option value="">Aucune</option>{plans.filter(p=>(p.status==='active'||p.source==='equipment'&&p.status==='draft'||p.id===tx.finance?.planId)&&p.direction===transactionDirection(tx,transactions)).map(p=><option key={p.id} value={p.id}>{p.title} · {formatCHF(p.amountCents)}</option>)}</select></Field>
        {plan&&<MoneyInput label="Montant de cette facture qui remplace la prévision (CHF)" value={tx.finance?.planAllocatedCents} onChange={v=>update({planAllocatedCents:v})}/>}
        {plan?.recurrence&&<Field label="Échéance prévue remplacée par cette facture"><select value={tx.finance?.occurrenceId??''} onChange={e=>update({occurrenceId:e.target.value||undefined})}><option value="">Choisir la période concernée</option>{occurrences.map(o=><option key={o.id} value={o.id}>{dateAffichee(o.date)}</option>)}</select></Field>}
      </div></details>}
      <details className="fiche-dt fiche-dt-bas" open={paiements.length>0}><summary><span>Paiements</span><em>{lignesPaiements.length||''}</em><ChevronDown size={16} aria-hidden="true"/></summary>
        {lignesPaiements.map(p=>{
          const contre=paiements.find(r=>r.reversalOfId===p.id);
          const ligne=(q:FinancialPayment)=><div key={q.id}><span>{dateFiche(q.date)} · {MODE_COURT[q.method]??q.method}{q.reversalOfId?' · correction':''}{!q.reversalOfId&&lienVirement(q)?` · ${lienVirement(q)}`:''}</span><span className="fiche-m">{q.direction==='in'?'+':'−'}{amountOnly(q.amountCents)}</span></div>;
          const preuve=(q:FinancialPayment)=>q.proofDocumentId&&<div className="fiche-hist-pj"><FileCheck2 size={14} aria-hidden="true"/><span>{q.proofFileName||'justificatif du virement'}</span><DocumentProofLink transaction={tx} document={{id:q.proofDocumentId,fileName:q.proofFileName}}/></div>;
          /* FN-6 : une paire paiement / contre-paiement se replie en une ligne « corrigé » ; le détail (les deux écritures) s'ouvre d'un toucher. */
          if(contre) return <details className="fiche-hist fiche-hist-corr" key={p.id}><summary><span>{dateFiche(p.date)} · {MODE_COURT[p.method]??p.method} · {contre.note===NOTE_ANNULATION?'annulé':'corrigé'}</span><span className="fiche-m fiche-m-barre">{amountOnly(p.amountCents)}</span><ChevronDown size={14} aria-hidden="true"/></summary>
            {ligne(p)}{preuve(p)}{ligne(contre)}</details>;
          return <div className="fiche-hist" key={p.id}>{ligne(p)}
          {/* m5pa-d : un virement a un seul justificatif, lié à chaque paiement qu'il a réglé ; il se montre sur la ligne de ce paiement, distinct du justificatif de la pièce. */}
          {preuve(p)}
          {!p.reversalOfId&&<button type="button" onClick={()=>setCorrection(p.id)}>Corriger ce paiement saisi par erreur</button>}</div>;})}
        {!paiements.length&&<p className="fiche-note">Aucun paiement daté enregistré.</p>}
      </details>
      {!voided&&<details className="fiche-dt"><summary><span>Corriger une erreur de saisie</span><ChevronRight size={16} aria-hidden="true"/></summary><div className="fiche-corps"><p className="fiche-note">Une annulation conserve la pièce et son historique. Un achat déjà consommé ou lié à un amortissement demande d’abord une correction de ses liens.</p><button type="button" className="fiche-b2" onClick={()=>setCorrection('retrait')}>Retirer cette écriture</button></div></details>}
      {correction==='retrait'&&<div className="fiche-corriger"><p>{phraseDuRetrait(enVigueur.reduce((n,p)=>n+p.amountCents,0),liees)}</p><div className="finance-actions"><button type="button" className="finance-action secondary" disabled={occupe} onClick={()=>{setError('');setCorrection(null);}}>Garder</button><button type="button" className="finance-action danger" disabled={occupe} onClick={retirer}>Confirmer le retrait</button></div>{error&&<p role="alert" className="fiche-erreur">{error}</p>}</div>}
      {correction&&correction!=='retrait'&&<div className="fiche-corriger"><p>{correction==='void'?'Confirmer l’annulation de cette écriture erronée ?':'Ce paiement a été saisi par erreur. Sa contre-écriture reprendra la date d’origine ; pour un remboursement réel, utilise un avoir.'}</p><div className="finance-actions"><button type="button" className="finance-action secondary" onClick={()=>setCorrection(null)}>Garder</button><button type="button" className="finance-action danger" onClick={()=>apply(()=>{if(correction==='void'){const result=StorageService.revertTransaction(tx.id);if(!result.success)throw Error(result.message);}else{const p=payments.find(p=>p.id===correction)!;FinanceService.recordPayment({...p,id:`CONTRE-${p.id}`,direction:p.direction==='in'?'out':'in',reversalOfId:p.id,note:'Correction d’un paiement saisi par erreur',recordedAt:new Date().toISOString()});}})}>Confirmer la correction</button></div></div>}
    </div>
  </Sheet>;
}
