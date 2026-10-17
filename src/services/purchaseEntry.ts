import { StorageService } from './storage';
import { FirestoreRepo, isConfirmedWriteRejection } from './firestoreRepo';
import { FinanceService, validateFinancialPayment } from './financeService';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from './financeDocuments';
import { Units } from './units';
import type { FinanceCategory, StockItem, EquipmentItem } from '../types';
import type { FinanceLineKind, FinanceTransaction, FinancialPayment } from '../domain/finance/types';
import { planOccurrences } from '../domain/finance/forecast';
import { isoDate, todayISO } from '../domain/finance/ledger';
import { normalize } from './search';
import { canonicalStockCategory } from './stockLineMatching';

export interface PurchaseLineDraft {
  id:string; description:string; kind:FinanceLineKind|'maintenance'; amount?:number;
  quantity?:number; unit:string;
  stockAction:'none'|'new'|'existing'; stockRef?:string; stockCategory?:string;
  equipmentAction:'none'|'new'|'existing'; equipmentRef?:string; equipmentCategory?:string;
  evidence?:string; sourceReference?:string;
}
export interface PurchaseDraft {
  submissionId:string; date:string; vendor:string; invoiceNumber:string; description:string;
  category:FinanceCategory; amount?:number; lines:PurchaseLineDraft[];
  paymentStatus:'unknown'|'unpaid'|'paid'; paymentMethod:FinancialPayment['method']; paymentDate:string; dueDate:string;
  proofDataUrl?:string; proofFileName?:string; proofType?:string; documentHash?:string;
  sourceCurrency?:string; sourceAmount?:number; sourceVatRate?:number; sourceVatAmount?:number; sourceNetAmount?:number;
  scanModel?:string; duplicateConfirmed?:boolean;
  sourceDocumentType?:string; sourceOrderNumber?:string; sourceTotalBasis?:'printed'|'line_sum';
  planId?:string; occurrenceId?:string;
}
const cents=(n:number)=>Math.round((n+Number.EPSILON)*100);
const isMoney=(n:unknown):n is number=>typeof n==='number' && Number.isFinite(n) && Number.isSafeInteger(cents(n)) && Math.abs(n*100-cents(n))<0.000001;
export function purchaseIsoDate(raw:string):string {
  const match=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(raw);
  if (!match) return '';
  const date=new Date(Date.UTC(+match[3],+match[2]-1,+match[1]));
  return date.getUTCFullYear()===+match[3] && date.getUTCMonth()===+match[2]-1 && date.getUTCDate()===+match[1] ? `${match[3]}-${match[2]}-${match[1]}` : '';
}
const LEGAL_FORMS=new Set(['sa','ag','gmbh','sarl','sagl','snc','sas','srl','spa','ltd','llc','inc','kg','co','cie','ohg','ug','se','bv','nv','plc']);
/** « MALTERIE DU BANC » et « Malterie du Banc SA » désignent le même fournisseur : casse, accents, ponctuation et
 * forme juridique finale ne comptent pas (« Moulin Co Brasserie » garde son « co »). Les initiales séparées (« S.à r.l. »)
 * forment une seule forme juridique. */
export function purchaseVendorKey(vendor:string):string {
  const tokens=normalize(vendor).split(/[^a-z0-9]+/).filter(Boolean);
  const merged=tokens.reduce<string[]>((out,token,index)=>{if(token.length===1&&index>0&&tokens[index-1].length===1)out[out.length-1]+=token;else out.push(token);return out;},[]);
  while(merged.length>1&&LEGAL_FORMS.has(merged[merged.length-1]))merged.pop();
  return merged.join(' ');
}
/** « MB-131 », « mb 131 » et « MB.131 » sont le même numéro de facture ; une lecture « MB-1O1 » vaut « MB-101 ». */
const invoiceKey=(invoice:string|undefined)=>normalize(invoice??'').replace(/[^a-z0-9]/g,'').replace(/o/g,'0').replace(/[il]/g,'1');
/** Deux numéros renseignés et différents : deux factures, donc deux achats (abonnement, commande répétée). */
const otherInvoice=(draft:PurchaseDraft,tx:FinanceTransaction)=>{const mine=invoiceKey(draft.invoiceNumber),theirs=invoiceKey(tx.finance?.invoiceNumber);return Boolean(mine&&theirs&&mine!==theirs);};
const DAY=86_400_000;
const lineReferences=(lines:Array<{sourceReference?:string}>)=>new Set(lines.map(line=>(line.sourceReference??'').toLowerCase().replace(/[^a-z0-9]/g,'')).filter(Boolean));
/** `rank` : même fichier 0, même facture 1, même jour et total 2, même achat vu ailleurs 3. */
interface DuplicateMatch { reasons:string[]; rank:number; gap:number }
/**
 * Pourquoi ce brouillon ressemble à une dépense déjà enregistrée ; rien : achat distinct.
 * Les cas exacts (même fichier, même facture, même jour) restent. S'y ajoute le même achat vu ailleurs, comme la
 * commande en ligne d'une facture : même fournisseur normalisé et même total au centime, avec des références
 * d'articles en commun (le récapitulatif n'a souvent ni date ni numéro) ou, sans elles, des dates proches ; jamais
 * deux factures aux numéros différents. `gap` : écart en jours entre les dates, sinon âge de la dépense.
 */
function duplicateMatch(draft:PurchaseDraft,tx:FinanceTransaction,today:()=>string):DuplicateMatch|undefined {
  if (tx.id===`TX-${draft.submissionId}` || tx.finance?.voidedAt) return undefined;
  const vendor=draft.vendor.trim().toLowerCase(), invoice=invoiceKey(draft.invoiceNumber);
  const from=purchaseIsoDate(draft.date), to=isoDate(tx.date), days=from&&to?Math.round(Math.abs(Date.parse(from)-Date.parse(to))/DAY):undefined;
  // Sans date lue, l'âge de la dépense (saisie, sinon date) borne le rapprochement : une commande d'il y a un an n'est pas ce récapitulatif.
  const since=(tx.finance?.recordedAt??'').slice(0,10)||to, gap=()=>days??(since?Math.round((Date.parse(today())-Date.parse(since))/DAY):Infinity);
  if (draft.documentHash && tx.finance?.sourceDocumentHash===draft.documentHash) return {reasons:['Même fichier déjà joint'],rank:0,gap:gap()};
  if (invoice && invoiceKey(tx.finance?.invoiceNumber)===invoice && tx.finance?.vendor?.toLowerCase()===vendor) return {reasons:[`Même facture n° ${draft.invoiceNumber.trim()}`],rank:1,gap:gap()};
  if (vendor && tx.date===draft.date && cents(tx.amountTTC)===cents(draft.amount??0) && tx.finance?.vendor?.toLowerCase()===vendor) return {reasons:['Même fournisseur, même date et même total'],rank:2,gap:gap()};
  // Seule une dépense au même total est comparée plus loin : une vente au nom d'un client homonyme n'est pas un achat.
  if (tx.finance?.kind!=='expense' || !isMoney(draft.amount) || draft.amount<=0 || cents(tx.amountTTC)!==cents(draft.amount) || otherInvoice(draft,tx)) return undefined;
  const key=purchaseVendorKey(draft.vendor);
  if (!key || purchaseVendorKey(tx.finance.vendor??'')!==key) return undefined;
  const mine=lineReferences(draft.lines), theirs=lineReferences(tx.finance?.lines??[]), shared=[...mine].filter(ref=>theirs.has(ref)).length;
  const sameItems=shared>0 && shared*2>=Math.min(mine.size,theirs.size);
  if (sameItems ? gap()>60 : days===undefined || days>14) return undefined;
  return {reasons:['Même fournisseur et même total',...(sameItems?[`${shared} référence${shared>1?'s':''} d’article en commun`]:[]),days===undefined?'Date absente':days===0?'Même date':`${days} jour${days>1?'s':''} d’écart`],rank:3,gap:gap()};
}
export function purchaseDuplicateReasons(draft:PurchaseDraft,tx:FinanceTransaction):string[] {
  return duplicateMatch(draft,tx,todayISO)?.reasons??[];
}
/** Dépenses proches, la plus forte d'abord : règle la plus sûre, puis plus petit écart de dates. */
export function purchaseDuplicates(draft:PurchaseDraft,transactions:FinanceTransaction[]):FinanceTransaction[] {
  let day='';
  const today=()=>day||(day=todayISO());
  return transactions.flatMap(tx=>{const match=duplicateMatch(draft,tx,today);return match?[{tx,match}]:[];})
    .sort((a,b)=>a.match.rank-b.match.rank||a.match.gap-b.match.gap).map(entry=>entry.tx);
}
/** Checks every mutation first. No stock/equipment is created during matching. */
export function validatePurchase(draft:PurchaseDraft,stocks:ReturnType<typeof StorageService.getStocks>,transactions:FinanceTransaction[]=[]):string[] {
  const errors:string[]=[];
  if (!/^[A-Za-z0-9-]{8,80}$/.test(draft.submissionId)) errors.push('Identifiant de saisie invalide.');
  if (!purchaseIsoDate(draft.date)) errors.push('Renseigne une date valide.');
  if (!draft.description.trim()) errors.push('Décris cette dépense.');
  if (!isMoney(draft.amount) || draft.amount<=0) errors.push('Renseigne le total payé ou facturé en CHF, avec deux décimales au maximum.');
  if (!draft.lines.length || draft.lines.length>35) errors.push('Prévois entre 1 et 35 lignes.');
  if (new Set(draft.lines.map(line=>line.id)).size!==draft.lines.length || draft.lines.some(line=>!/^[A-Za-z0-9-]{1,80}$/.test(line.id))) errors.push('Les identifiants des lignes sont invalides. Rouvre la saisie.');
  if (draft.lines.some(line=>!line.description.trim() || !isMoney(line.amount))) errors.push('Chaque ligne doit avoir un libellé et un montant avec deux décimales au maximum.');
  if (draft.lines.some(line=>line.kind==='discount' ? line.amount>0 : line.amount<0)) errors.push('Une remise est négative; les autres lignes sont positives.');
  if (cents(draft.amount??0)!==draft.lines.reduce((sum,line)=>sum+cents(line.amount??0),0)) errors.push('Le détail des lignes doit correspondre exactement au total TTC.');
  if (draft.paymentStatus==='paid' && !purchaseIsoDate(draft.paymentDate)) errors.push('Renseigne la date du paiement.');
  if (draft.paymentStatus==='paid' && purchaseIsoDate(draft.paymentDate)>todayISO()) errors.push('Le paiement est futur : utilise « À payer ».');
  if (draft.dueDate && !purchaseIsoDate(draft.dueDate)) errors.push('L’échéance est invalide.');
  if (draft.sourceVatAmount!==undefined && (!isMoney(draft.sourceVatAmount) || draft.sourceVatAmount<0 || (draft.sourceCurrency==='CHF' && draft.sourceVatAmount>(draft.amount??0)))) errors.push('Vérifie le montant de TVA : il doit être positif ou nul et ne pas dépasser le TTC du document.');
  if (draft.sourceVatRate!==undefined && (!Number.isFinite(draft.sourceVatRate) || draft.sourceVatRate<0 || draft.sourceVatRate>1)) errors.push('Vérifie le taux de TVA du document (entre 0 et 100 %).');
  for (const line of draft.lines) {
    if (line.stockAction!=='none') {
      if (!['ingredient','cleaning','packaging'].includes(line.kind)) errors.push(`${line.description} : cette nature ne peut pas entrer en stock.`);
      if (!Number.isFinite(line.quantity) || line.quantity<=0 || !line.unit.trim()) errors.push(`${line.description} : indique la quantité reçue et son unité.`);
      if (line.stockAction==='existing') {
        const target=[...stocks.rawMaterials,...stocks.cleaning].find(item=>item.ref===line.stockRef);
        if (!target) errors.push(`${line.description} : sélectionne l’article de stock.`);
        else if (!Units.areCompatible(line.unit,target.unit)) errors.push(`${line.description} : ${line.unit||'unité absente'} ne se convertit pas en ${target.unit}.`);
      }
    }
    if (line.equipmentAction!=='none' && line.kind!=='equipment' && line.kind!=='maintenance') errors.push(`${line.description} : sélectionne matériel ou entretien pour lier un équipement.`);
    if (line.equipmentAction==='new' && line.kind!=='equipment') errors.push(`${line.description} : un entretien ne crée pas de nouveau matériel.`);
    if (line.equipmentAction==='existing' && !stocks.equipment.some(item=>item.ref===line.equipmentRef)) errors.push(`${line.description} : sélectionne le matériel existant.`);
  }
  if (purchaseDuplicates(draft,transactions).length && !draft.duplicateConfirmed) errors.push('Un achat similaire existe déjà. Vérifie le doublon avant d’enregistrer.');
  return [...new Set(errors)];
}

const submitted=new Set<string>();
const replayable=new Set<string>();
const confirmedProofs=new WeakMap<PurchaseDraft,{dataUrl:string;fileName?:string;mimeType?:string}>();
function purchasePayment(draft:PurchaseDraft, at=new Date().toISOString()):FinancialPayment|undefined {
  return draft.paymentStatus==='paid'?{id:`PAY-${draft.submissionId}`,transactionId:`TX-${draft.submissionId}`,date:purchaseIsoDate(draft.paymentDate),amountCents:cents(draft.amount!),direction:'out',method:draft.paymentMethod,recordedAt:at}:undefined;
}
/** The same preflight runs before Drive and immediately before local mutations. */
function validatePurchaseCommit(draft:PurchaseDraft) {
  const txId=`TX-${draft.submissionId}`, retry=replayable.has(draft.submissionId);
  const operationId=`purchase-${draft.documentHash&&!draft.duplicateConfirmed?draft.documentHash:draft.submissionId}`;
  const marker=FirestoreRepo.find<{id?:string;transactionId?:string}>('movements',operationId);
  if(marker && !(retry && marker.transactionId===txId && FirestoreRepo.documentWriteState('movements',operationId).status==='rejected'))throw new Error('Ce justificatif est déjà enregistré. Ouvre l’achat existant.');
  const stocks=StorageService.getStocks(), errors=validatePurchase(draft,stocks,StorageService.getTransactions());
  if(draft.planId){
    const plan=FinanceService.getPlans().find(plan=>plan.id===draft.planId&&(plan.status==='active'||plan.source==='equipment'&&plan.status==='draft')&&plan.direction==='out');
    const occurrenceDate=draft.occurrenceId?.slice(-10);
    if(!plan || (plan.recurrence && (!occurrenceDate || !planOccurrences(plan,occurrenceDate,occurrenceDate).some(item=>item.id===draft.occurrenceId)))) errors.push('Sélectionne une échéance valide de la dépense prévue.');
  } else if(draft.occurrenceId) errors.push('Rattache l’échéance à sa dépense prévue.');
  if(errors.length)throw Error(errors.join('\n'));
  const payment=purchasePayment(draft);
  if(payment)validateFinancialPayment(payment);
  return stocks;
}
/** The original is confirmed on Drive before the atomic purchase/stock/payment batch. */
export async function savePurchaseWithProof(draft:PurchaseDraft):Promise<string> {
  const txId=`TX-${draft.submissionId}`;
  if(!replayable.has(draft.submissionId)&&(submitted.has(draft.submissionId)||StorageService.getTransactions().some(tx=>tx.id===txId)))return txId;
  validatePurchaseCommit(draft);
  if(draft.proofDataUrl) {
    const proof=prepareFinanceDocument(`proof-${draft.submissionId}`,draft.proofDataUrl,draft.proofFileName||'Justificatif',draft.proofType||'application/pdf');
    await confirmProof(proof,+purchaseIsoDate(draft.date).slice(0,4));
    confirmedProofs.set(draft,{dataUrl:draft.proofDataUrl,fileName:draft.proofFileName,mimeType:draft.proofType});
  }
  return savePurchase(draft);
}
/** Sans réseau, le SDK répond en anglais (« client is offline ») : le brasseur doit lire ce qui s'est passé et quoi faire. */
async function confirmProof(proof:ReturnType<typeof prepareFinanceDocument>,year:number) {
  try { await saveFinanceDocumentConfirmed(proof,year); }
  catch(error) {
    // `financeDocuments` marque déjà ainsi l'échec réseau de Drive ; le SDK, lui, répond « unavailable ».
    if((error as {code?:string})?.code!=='unavailable') throw error;
    throw Object.assign(Error('Hors connexion : le justificatif n’a pas pu être envoyé sur ton Drive, donc rien n’est enregistré. Ta saisie reste ouverte : réessaie une fois en ligne.'),{code:'unavailable'});
  }
}
const acceptsProof=(tx:FinanceTransaction)=>tx.finance?.kind==='expense' && !tx.finance.voidedAt && !tx.finance.proofDocumentId && !tx.proofUrl;
/** Le justificatif lu peut rejoindre cette dépense : même achat au même total, dépense sans original, pas un avoir et
 * pas une autre facture (numéros différents). */
export function purchaseProofAttachable(draft:PurchaseDraft,tx:FinanceTransaction):boolean {
  return Boolean(draft.proofDataUrl) && draft.sourceDocumentType!=='credit_note' && acceptsProof(tx) && isMoney(draft.amount) && cents(draft.amount)===cents(tx.amountTTC) && !otherInvoice(draft,tx) && purchaseDuplicateReasons(draft,tx).length>0;
}
/**
 * Le même achat est déjà enregistré sans original : le justificatif lu lui est joint. Aucune nouvelle dépense, aucun
 * stock, aucun paiement. L'original est confirmé sur Drive avant le lien, comme pour un nouvel achat.
 */
export async function attachProofToPurchase(draft:PurchaseDraft,transactionId:string):Promise<void> {
  const tx=StorageService.getTransactions().find(item=>item.id===transactionId);
  if(!tx || !purchaseProofAttachable(draft,tx)) throw Error('Ce justificatif ne peut pas rejoindre cette dépense (original déjà joint, autre total ou avoir). Rien n’a été rattaché.');
  const proof=prepareFinanceDocument(`proof-${draft.submissionId}`,draft.proofDataUrl!,draft.proofFileName||'Justificatif',draft.proofType||'application/pdf');
  await confirmProof(proof,+(isoDate(tx.date)??todayISO()).slice(0,4));
  // L'envoi prend du temps : la dépense relue est celle qu'on complète, jamais l'instantané d'avant l'envoi.
  const current=StorageService.getTransactions().find(item=>item.id===transactionId);
  if(!current?.finance || !purchaseProofAttachable(draft,current)) throw Error('Cette dépense a changé pendant l’envoi. Rien n’a été rattaché ; rouvre-la pour vérifier.');
  StorageService.updateTransaction({...current,proofFileName:proof.fileName,proofType:proof.mimeType,finance:{...current.finance,proofDocumentId:proof.id,sourceDocumentHash:current.finance.sourceDocumentHash??draft.documentHash}});
  await FirestoreRepo.waitForDocument<FinanceTransaction>('transactions',current.id,15000,saved=>saved.finance?.proofDocumentId===proof.id);
}
/** A timeout only resumes readback. Replay is released by a proven rejection + absent server document. */
export async function confirmPurchase(draft:PurchaseDraft):Promise<void> {
  const id=`TX-${draft.submissionId}`;
  try {
    await FirestoreRepo.waitForDocument<FinanceTransaction>('transactions',id,15000,tx=>
      tx.finance?.kind==='expense' && tx.finance?.version===1 && tx.finance.amountCents===cents(draft.amount!) &&
      tx.date===draft.date && (!draft.documentHash || tx.finance.sourceDocumentHash===draft.documentHash));
    replayable.delete(draft.submissionId);
  } catch(error) {
    if(isConfirmedWriteRejection(error) && error.path===`transactions/${id}` && error.operationId===FirestoreRepo.documentWriteState('transactions',id).operationId) {
      submitted.delete(draft.submissionId);
      replayable.add(draft.submissionId);
    }
    throw error;
  }
}
export function savePurchase(draft:PurchaseDraft):string {
  const txId=`TX-${draft.submissionId}`;
  const retry=replayable.has(draft.submissionId);
  if (!retry && (submitted.has(draft.submissionId) || StorageService.getTransactions().some(tx=>tx.id===txId))) return txId;
  const operationId=`purchase-${draft.documentHash&&!draft.duplicateConfirmed?draft.documentHash:draft.submissionId}`;
  const stocks=validatePurchaseCommit(draft);
  const at=new Date().toISOString(), newStocks:Array<{item:StockItem;type:'rawMaterials'|'cleaning'}>=[], newEquipment:EquipmentItem[]=[], receipts:Array<{ref:string;qty:number;unit:string;lineId:string;type:string}>=[];
  const proof=draft.proofDataUrl?prepareFinanceDocument(`proof-${draft.submissionId}`,draft.proofDataUrl,draft.proofFileName||'Justificatif',draft.proofType||'application/pdf'):undefined;
  const confirmed=confirmedProofs.get(draft);
  if(proof && (!confirmed || confirmed.dataUrl!==draft.proofDataUrl || confirmed.fileName!==draft.proofFileName || confirmed.mimeType!==draft.proofType))throw Error('Confirme d’abord l’envoi du justificatif sur Drive. Aucun achat n’a été enregistré.');
  const lines=draft.lines.map((line,index)=>{
    let stockRef=line.stockRef,equipmentRef=line.equipmentRef;
    if (line.stockAction==='new') {
      stockRef=`MP-${draft.submissionId}-${index}`;
      const type=line.kind==='cleaning'?'cleaning' as const:'rawMaterials' as const;
      newStocks.push({ type,item:{id:stockRef,ref:stockRef,name:line.description.trim(),category:canonicalStockCategory(line.stockCategory)||(line.kind==='packaging'?'Emballage':line.kind==='cleaning'?'Consommable':'Divers'),unit:line.unit.trim(),currentStock:line.quantity,minStock:0,reorder:false,supplier:draft.vendor.trim()||undefined} });
      receipts.push({ref:stockRef,qty:line.quantity,unit:line.unit,lineId:line.id,type});
    } else if (line.stockAction==='existing') {
      const item=[...stocks.rawMaterials,...stocks.cleaning].find(item=>item.ref===line.stockRef)!;
      receipts.push({ref:item.ref,qty:Units.convert(line.quantity,line.unit,item.unit)!,unit:item.unit,lineId:line.id,type:stocks.cleaning.some(s=>s.ref===item.ref)?'cleaning':'rawMaterials'});
    }
    if (line.equipmentAction==='new') {
      equipmentRef=`EQ-${draft.submissionId}-${index}`;
      newEquipment.push({id:equipmentRef,ref:equipmentRef,name:line.description.trim(),category:line.equipmentCategory||'Brassage',state:'Neuf',purchaseDate:draft.date,purchasePrice:line.amount});
    }
    return {id:line.id,description:line.description.trim(),kind:(line.kind==='maintenance'?'service':line.kind) as FinanceLineKind,amountCents:cents(line.amount),quantity:line.quantity,unit:line.unit||undefined,sourceReference:line.sourceReference?.slice(0,70)||undefined,stockItemRef:line.stockAction==='none'?undefined:stockRef,equipmentRef:line.equipmentAction==='none'?undefined:equipmentRef};
  });
  const amount=draft.amount!,registered=StorageService.getConfig().fiscal.isTvaRegistered;
  const vat=registered && draft.sourceCurrency==='CHF' && Number.isFinite(draft.sourceVatAmount) ? draft.sourceVatAmount : 0;
  const tx:FinanceTransaction={id:txId,date:draft.date,description:draft.description.trim(),category:draft.category,subcategory:draft.lines.some(line=>line.kind==='maintenance')?'Entretien':'',amountHT:cents(amount-vat)/100,tvaRate:registered?(draft.sourceVatRate??0):0,tvaAmount:vat,amountTTC:amount,proofFileName:draft.proofFileName,proofType:draft.proofType,
    finance:{version:1,kind:'expense',amountCents:cents(amount),lines,vendor:draft.vendor.trim()||undefined,invoiceNumber:draft.invoiceNumber.trim()||undefined,dueDate:purchaseIsoDate(draft.dueDate)||undefined,paymentStatus:draft.paymentStatus,recordedAt:at,planId:draft.planId,occurrenceId:draft.occurrenceId,sourceCurrency:draft.sourceCurrency,sourceAmount:draft.sourceAmount,sourceDocumentType:draft.sourceDocumentType,sourceOrderNumber:draft.sourceOrderNumber?.slice(0,70)||undefined,sourceTotalBasis:draft.sourceTotalBasis,sourceVatRate:draft.sourceVatRate,sourceVatAmount:draft.sourceVatAmount,sourceNetAmount:draft.sourceNetAmount,sourceDocumentHash:draft.documentHash,proofDocumentId:proof?.id,scanProvenance:draft.scanModel?{model:draft.scanModel,scannedAt:at,promptVersion:'invoice-v4'}:undefined}}
  const payment=purchasePayment(draft,at);
  // All validation and material preparation above precede the first synchronous write.
  if (payment) FinanceService.stageNewTransactionPayment(tx,payment);
  // Immutable marker makes two devices saving the same receipt race safely:
  // one complete batch wins; the other batch cannot duplicate stock/payments.
  FirestoreRepo.put('movements',operationId,{id:operationId,type:'purchase-confirmation',transactionId:txId,createdAt:at});
  if (!payment) StorageService.addTransaction(tx);
  for (const entry of newStocks) StorageService.addStockItem(entry.type,entry.item);
  for (const item of newEquipment) StorageService.addEquipment(item);
  for (const receipt of receipts) {
    if (!newStocks.some(entry=>entry.item.ref===receipt.ref)) FirestoreRepo.adjustNumber('stockItems',receipt.ref,'currentStock',receipt.qty);
    FirestoreRepo.put('movements',`receipt-${draft.submissionId}-${receipt.lineId}`,{id:`receipt-${draft.submissionId}-${receipt.lineId}`,type:'receipt',stockItemRef:receipt.ref,stockKind:receipt.type,quantity:receipt.qty,unit:receipt.unit,transactionId:txId,date:purchaseIsoDate(draft.date),createdAt:at});
  }
  submitted.add(draft.submissionId);
  replayable.delete(draft.submissionId);
  return txId;
}
