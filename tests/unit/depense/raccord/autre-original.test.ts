import {beforeEach,describe,it,expect,vi} from 'vitest';
/**
 * Voie r2-details, détail 7 (revue de conception n° 2) : deux fichiers différents sous le même `submissionId` (donc le même `proof-<id>` dans Drive)
 * ne mènent jamais à une écriture. `financeDocuments` refuse « un autre original » ; le vrai `savePurchaseWithProofReceipt` s'arrête avant toute
 * écriture locale (aucune dépense, aucun mouvement de stock, aucun ajustement). Drive et Firestore simulés.
 */
const state=vi.hoisted(()=>({transactions:[] as any[],writes:[] as any[],confirm:vi.fn()}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(...a:any[])=>{state.writes.push(['stock',...a]);},addEquipment:(...a:any[])=>{state.writes.push(['equipment',...a]);},updateTransaction:(...a:any[])=>{state.writes.push(['update',...a]);}}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:async()=>undefined,adjustNumber:(...a:any[])=>state.writes.push(['adjust',...a]),put:(...a:any[])=>state.writes.push(['put',...a])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:(tx:any)=>{state.writes.push(['transaction',tx]);}}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string,dataUrl:string,fileName:string,mimeType:string)=>({id,fileName,mimeType,parts:[dataUrl]}),
  saveFinanceDocumentConfirmed:(...a:any[])=>state.confirm(...a),loadDriveProofReceipt:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import type {PurchaseDraft} from '../../../../src/services/purchaseEntry';

const OTHER='Un autre original utilise cet identifiant. Aucun fichier n’a été remplacé.';
const base:PurchaseDraft={submissionId:'r2-autre-original-01',date:'27.04.2026',vendor:'Fournisseur A',invoiceNumber:'MB-1',description:'Achat',category:'brassage',amount:10,
  lines:[{id:'l1',description:'Port',kind:'shipping',amount:10,unit:'',stockAction:'none',equipmentAction:'none'}],paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF',
  proofDataUrl:'data:image/jpeg;base64,AAAA',proofFileName:'a.jpg',proofType:'image/jpeg',documentHash:'a'.repeat(64)};
beforeEach(()=>{state.transactions=[];state.writes=[];state.confirm.mockReset();});

describe('un autre original sous le même identifiant : un refus, jamais une écriture',()=>{
  it('le premier fichier part, le second (autre contenu, même saisie) est refusé par Drive : rien n’est écrit',async()=>{
    state.confirm.mockRejectedValueOnce(Object.assign(Error('Texte neutre'),{code:'drive/in-progress'}));
    state.confirm.mockRejectedValueOnce(Error(OTHER));
    const first:any=await entry.savePurchaseWithProofReceipt(base).catch(cause=>cause);
    expect(first.code).toBe('drive/in-progress');
    const second:any=await entry.savePurchaseWithProofReceipt({...base,proofDataUrl:'data:image/jpeg;base64,BBBB',proofFileName:'b.jpg',documentHash:'b'.repeat(64)}).catch(cause=>cause);
    expect(second.message).toBe(OTHER);
    expect(state.confirm).toHaveBeenCalledTimes(2);
    expect(state.writes).toEqual([]);
    expect(state.transactions).toEqual([]);
  });
  it('un rejet de Drive avant tout enregistrement : aucune dépense, aucun mouvement, aucun ajustement',async()=>{
    state.confirm.mockRejectedValueOnce(Error(OTHER));
    await expect(entry.savePurchaseWithProofReceipt(base)).rejects.toThrow('Un autre original');
    expect(state.writes.filter(w=>['put','adjust','transaction','stock','equipment','update'].includes(w[0]))).toEqual([]);
  });
});
