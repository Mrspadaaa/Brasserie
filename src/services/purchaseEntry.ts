import { StorageService } from './storage';
import { FirestoreRepo, isConfirmedWriteRejection } from './firestoreRepo';
import { FinanceService, validateFinancialPayment } from './financeService';
import { prepareFinanceDocument, saveFinanceDocumentConfirmed } from './financeDocuments';
import { Units } from './units';
import type { FinanceCategory, StockItem, EquipmentItem } from '../types';
import type { FinanceLineKind, FinanceTransaction, FinancialPayment } from '../domain/finance/types';
import { planOccurrences } from '../domain/finance/forecast';
import { todayISO } from '../domain/finance/ledger';

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
export function purchaseDuplicates(draft:PurchaseDraft,transactions:FinanceTransaction[]):FinanceTransaction[] {
  return transactions.filter(tx=>tx.id!==`TX-${draft.submissionId}` && !tx.finance?.voidedAt && (
    (draft.documentHash && tx.finance?.sourceDocumentHash===draft.documentHash) ||
    (draft.invoiceNumber.trim() && tx.finance?.invoiceNumber?.toLowerCase()===draft.invoiceNumber.trim().toLowerCase() && tx.finance?.vendor?.toLowerCase()===draft.vendor.trim().toLowerCase()) ||
    (draft.vendor.trim() && tx.date===draft.date && cents(tx.amountTTC)===cents(draft.amount??0) && tx.finance?.vendor?.toLowerCase()===draft.vendor.trim().toLowerCase())
  ));
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
    await saveFinanceDocumentConfirmed(proof,+purchaseIsoDate(draft.date).slice(0,4));
    confirmedProofs.set(draft,{dataUrl:draft.proofDataUrl,fileName:draft.proofFileName,mimeType:draft.proofType});
  }
  return savePurchase(draft);
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
      newStocks.push({ type,item:{id:stockRef,ref:stockRef,name:line.description.trim(),category:line.stockCategory?.trim()||(line.kind==='packaging'?'Emballage':line.kind==='cleaning'?'Consommable':'Divers'),unit:line.unit.trim(),currentStock:line.quantity,minStock:0,reorder:false,supplier:draft.vendor.trim()||undefined} });
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
