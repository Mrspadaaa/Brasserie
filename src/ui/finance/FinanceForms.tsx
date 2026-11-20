import { Input, Textarea } from '../Input';
import React, { useEffect, useId, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Sheet } from '../Sheet';
import { NumberInput } from '../NumberInput';
import { ChampNombre } from '../depense/ChampNombre';
import { BORNES_FINANCE } from '../../domain/finance/bornesFinance';
import type { FinanceCategory, Transaction, StockItem } from '../../types';
import type { FinancialProfile, FinancialPlan, FinancialAsset, FinancialClosing, FinancialInventoryLine, FinancialPayment } from '../../domain/finance/types';
import { formatCHF, todayISO, isoDate, transactionAmount, transactionDirection, paymentState } from '../../domain/finance/ledger';
import { parseFiscalYear } from '../../domain/finance/annual';
import { FinanceService } from '../../services/financeService';
import { StorageService } from '../../services/storage';
import { PayerVirement } from './payer/PayerVirement';
import { CATEGORY_LABELS, Field, FormSheet, MoneyInput, idFor } from './prevision/base';
import { PlanSheetC, type SaisieRapide } from './prevision/PlanSheetC';
import { ProfilEffets } from './profil/ProfilEffets';
import { BienCuve } from './bien/BienCuve';

export { CATEGORY_LABELS, idFor, MoneyInput };
/** Exercice fiscal : une année entière de quatre chiffres. Une saisie invalide est refusée sur place avec un message ; l'écran ne la reçoit jamais (BE-60). */
export function ExerciceField({year,onYear}:{year:number;onYear:(year:number)=>void}) {
  const [draft,setDraft]=useState(String(year)),[error,setError]=useState('');
  const messageId=useId();
  useEffect(()=>{setDraft(String(year));},[year]);
  const push=(text:string)=>{
    setDraft(text);
    const t=text.trim();
    // Frappe en cours (« 2 », « 20 », « 202 ») : on attend les quatre chiffres sans rien dire.
    if(/^\d{0,3}$/.test(t)){setError('');return;}
    const parsed=parseFiscalYear(text);
    if('error' in parsed){setError(parsed.error);return;}
    setError('');
    if(parsed.year!==year)onYear(parsed.year);
  };
  const leave=()=>{
    const parsed=parseFiscalYear(draft);
    if('error' in parsed){setError(parsed.error);setDraft(String(year));return;}
    setError('');setDraft(String(parsed.year));
  };
  return <div className="finance-year-field"><Field label="Exercice"><Input value={draft} inputMode="numeric" maxLength={6} className="finance-year-input" aria-invalid={error?true:undefined} aria-describedby={error?messageId:undefined} onFocus={e=>e.currentTarget.select()} onChange={e=>push(e.target.value)} onBlur={leave}/></Field>{error&&<p id={messageId} className="finance-error" role="alert">{error}</p>}</div>;
}
export { Field, FormSheet };
/** Solde et paramètres = m4pf-c (voie s2c) : la feuille vit dans `profil/`. `parametres` : le renvoi « Tendance à calculer » ou « Production annuelle » amène sur les cartes des réglages. */
export function ProfileSheet(props:{profile:FinancialProfile;onClose:()=>void;parametres?:boolean}) { return <ProfilEffets {...props}/>; }
/** Ajouter une prévision = m3pr-c (voie s2) : la feuille vit dans `prevision/`. */
/** `categorie` (facultative) : la catégorie d'une prévision neuve, ouverte depuis une rangée du Calendrier (Achats → Brassage, Travaux → Local et travaux, Papiers → Charges fixes ; CRITIQUE-5 n° 3, D-68). Sans elle, rien ne change. */
export function PlanSheet(props:{plan?:FinancialPlan;onClose:()=>void;date?:string;categorie?:FinanceCategory;saisie?:SaisieRapide}) { return <PlanSheetC {...props}/>; }
/** Bien amorti = m3im-c (voie s2c) : la feuille vit dans `bien/`. `initial` : préremplissage d'un matériel neuf (l'achat que l'Annuel propose de passer au registre) ; rien n'est enregistré sans le geste du brasseur. */
export function AssetSheet(props:{asset?:FinancialAsset;initial?:Partial<FinancialAsset>;onClose:()=>void}) { return <BienCuve {...props}/>; }
/** Une ligne d'inventaire dont la valeur n'est pas encore saisie n'a PAS de valeur (jamais 0 pour un inconnu) : le champ reste vide, l'enregistrement la refuse. `propositions` : valeurs estimées (dernière facture), offertes par « Utiliser », jamais écrites seules. */
export type PropositionInventaire={stockItemRef:string;valueCents:number;note:string};
const lignesDuStock=(stockItems:StockItem[]):FinancialInventoryLine[]=>stockItems.map(s=>({id:idFor('INV'),name:s.name,kind:s.category==='Emballage'?'packaging' as const:'raw' as const,quantity:s.currentStock,unit:s.unit,valueCents:0,stockItemRef:s.ref,note:'Copié du stock actuel : quantité et valeur à vérifier.'}));
/** CP-10 : nature visée par une case de l'étape 3 de l'Annuel. */
export type NatureVisee='malt'|'houblons'|'emballages'|'biere';
const natureDeLigneSaisie=(l:FinancialInventoryLine,stockItems:StockItem[]):NatureVisee|'autres'=>{
  if(l.kind==='packaging')return 'emballages';
  if(l.kind==='work-in-progress'||l.kind==='finished')return 'biere';
  const categorie=(stockItems.find(s=>s.ref===l.stockItemRef)?.category??'').toLowerCase();
  return categorie.includes('malt')?'malt':categorie.includes('houblon')?'houblons':'autres';
};
const KIND_DE_NATURE:Record<NatureVisee,FinancialInventoryLine['kind']>={malt:'raw',houblons:'raw',emballages:'packaging',biere:'finished'};
export function ClosingSheet({closing,year,onClose,stockItems,cote,proposer,propositions=[],nature}:{closing?:FinancialClosing;year:number;onClose:()=>void;stockItems:StockItem[];cote?:'openingInventory'|'closingInventory';proposer?:boolean;propositions?:PropositionInventaire[];/** Nature visée : seules ses lignes du stock sont proposées (0 exclus) ; sans proposition, une ligne vide de cette nature est prête. */nature?:NatureVisee}) {
  const [side,setSide]=useState<'openingInventory'|'closingInventory'>(cote??'closingInventory');
  const [init]=useState(()=>{
    const base:FinancialClosing=closing??{id:`CLOTURE-${year}`,year,createdAt:new Date().toISOString(),openingInventory:[],closingInventory:[],inventoriesConfirmed:false,adjustments:[]};
    if(nature){
      if(base[side].some(l=>natureDeLigneSaisie(l,stockItems)===nature))return {draft:base,absent:new Set<string>()};
      const proposees=proposer?lignesDuStock(stockItems).filter(l=>(l.quantity??0)>0&&natureDeLigneSaisie(l,stockItems)===nature):[];
      const lignes=proposees.length?proposees:[{id:idFor('INV'),name:'',kind:KIND_DE_NATURE[nature],quantity:0,unit:nature==='biere'?'L':nature==='malt'?'kg':nature==='houblons'?'g':'pièce',valueCents:0}];
      return {draft:{...base,[side]:[...base[side],...lignes],inventoriesConfirmed:false},absent:new Set(lignes.map(l=>l.id))};
    }
    if(!proposer||base[side].length)return {draft:base,absent:new Set<string>()};
    const lignes=lignesDuStock(stockItems);
    return {draft:{...base,[side]:lignes,inventoriesConfirmed:false},absent:new Set(lignes.map(l=>l.id))};
  });
  const [absent,setAbsent]=useState<Set<string>>(init.absent);
  const [draft,setDraft]=useState<FinancialClosing>(init.draft);
  const update=(index:number,patch:Partial<FinancialInventoryLine>)=>setDraft({...draft,[side]:draft[side].map((l,i)=>i===index?{...l,...patch}:l),inventoriesConfirmed:false});
  const add=()=>{const ligne:FinancialInventoryLine={id:idFor('INV'),name:'',kind:'raw',quantity:0,unit:'kg',valueCents:0};setAbsent(new Set(absent).add(ligne.id));setDraft({...draft,[side]:[...draft[side],ligne],inventoriesConfirmed:false});};
  const saisir=(id:string)=>{if(absent.has(id)){const n=new Set(absent);n.delete(id);setAbsent(n);}};
  return <FormSheet title={`Inventaire et clôture ${year}`} onClose={onClose} onSave={()=>{if([...draft.openingInventory,...draft.closingInventory].some(l=>!l.name.trim()))throw Error('Nomme chaque ligne d’inventaire.');if([...draft.openingInventory,...draft.closingInventory].some(l=>absent.has(l.id)))throw Error('Saisis la valeur de chaque ligne ou retire-la : une valeur inconnue n’est pas zéro.');FinanceService.saveClosing(draft);}} saveLabel="Conserver le brouillon">
    <p className="finance-muted">Renseigne les quantités et valeurs aux dates de l’exercice, y compris la bière en fermentation et conditionnée. Le stock actuel ne représente pas automatiquement le stock du 31 décembre.</p>
    <Field label="Inventaire"><select value={side} onChange={e=>setSide(e.target.value as typeof side)}><option value="openingInventory">Ouverture au 1er janvier {year}</option><option value="closingInventory">Clôture au 31 décembre {year}</option></select></Field>
    {!draft[side].length&&<button type="button" className="finance-action secondary" onClick={()=>{const lignes=lignesDuStock(stockItems);setAbsent(new Set([...absent,...lignes.map(l=>l.id)]));setDraft({...draft,[side]:lignes,inventoriesConfirmed:false});}}>Reprendre les articles actuels à vérifier</button>}
    {draft[side].map((line,i)=><div className="finance-item-editor" key={line.id}><Field label="Article ou brassin"><Input value={line.name} onChange={e=>update(i,{name:e.target.value})} required/></Field><Field label="Nature"><select value={line.kind} onChange={e=>update(i,{kind:e.target.value as FinancialInventoryLine['kind']})}><option value="raw">Matières</option><option value="packaging">Emballages</option><option value="cleaning">Nettoyage</option><option value="work-in-progress">Bière en cours</option><option value="finished">Bière conditionnée</option></select></Field><div className="finance-form-grid"><Field label="Quantité"><NumberInput value={line.quantity} onValue={v=>update(i,{quantity:v??0})} min={0}/></Field><Field label="Unité"><Input value={line.unit} onChange={e=>update(i,{unit:e.target.value})}/></Field></div><MoneyInput label="Valeur totale de cette ligne (CHF)" value={absent.has(line.id)?undefined:line.valueCents} onChange={v=>{if(v!=null)saisir(line.id);else setAbsent(new Set(absent).add(line.id));update(i,{valueCents:v??0});}}/>{(()=>{const p=line.stockItemRef?propositions.find(x=>x.stockItemRef===line.stockItemRef):undefined;return p&&absent.has(line.id)?<button type="button" className="finance-link" onClick={()=>{saisir(line.id);update(i,{valueCents:p.valueCents,note:p.note});}}>Utiliser {formatCHF(p.valueCents)} (estimé, dernière facture)</button>:null;})()}<button type="button" className="finance-link" onClick={()=>setDraft({...draft,[side]:draft[side].filter((_,n)=>n!==i),inventoriesConfirmed:false})}><Trash2 size={16}/>Retirer cette ligne</button></div>)}
    <button type="button" className="finance-action secondary" onClick={add}><Plus size={18}/>Ajouter une ligne</button>
    <label className="finance-check"><input type="checkbox" checked={draft.inventoriesConfirmed} onChange={e=>setDraft({...draft,inventoriesConfirmed:e.target.checked})}/>J’ai vérifié les deux inventaires, leurs quantités et leurs valeurs aux dates indiquées.</label>
    <details><summary>Ajustements annuels documentés</summary><div className="finance-form">{draft.adjustments.map((a,i)=><div className="finance-item-editor" key={a.id}><Field label="Motif"><Input value={a.label} onChange={e=>setDraft({...draft,adjustments:draft.adjustments.map((v,n)=>n===i?{...v,label:e.target.value}:v)})}/></Field><Field label="Effet sur le résultat (CHF, signé)"><NumberInput value={a.amountCents/100} onValue={v=>setDraft({...draft,adjustments:draft.adjustments.map((a,n)=>n===i?{...a,amountCents:Math.round((v??0)*100)}:a)})}/></Field><Field label="Justification"><Textarea value={a.note} onChange={e=>setDraft({...draft,adjustments:draft.adjustments.map((a,n)=>n===i?{...a,note:e.target.value}:a)})}/></Field></div>)}<button type="button" className="finance-action secondary" onClick={()=>setDraft({...draft,adjustments:[...draft.adjustments,{id:idFor('AJ'),label:'',amountCents:0,note:''}]})}>Ajouter un ajustement</button></div></details>
    <Field label="Notes de clôture"><Textarea rows={2} value={draft.notes??''} onChange={e=>setDraft({...draft,notes:e.target.value})}/></Field>
  </FormSheet>;
}
/** Payer = m5pa-d (voie q1) : un virement, plusieurs pièces du même tiers, un justificatif. La feuille vit dans `payer/`. */
export function PaymentSheet(props:{transaction:Transaction;payments:FinancialPayment[];transactions:Transaction[];onClose:()=>void;remplace?:FinancialPayment;seule?:boolean}) { return <PayerVirement {...props}/>; }
