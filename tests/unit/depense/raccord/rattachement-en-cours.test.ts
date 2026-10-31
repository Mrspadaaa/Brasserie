import {beforeEach,describe,it,expect,vi} from 'vitest';
/**
 * Voie r1-raccord, relecture n° 4 : le texte « en cours » du RATTACHEMENT est celui du vrai code (`attachProofToPurchase`), pas celui d'un mock d'écran.
 * Il nomme le bouton « Rattacher le justificatif » (jamais « Confirmer et enregistrer ») et ne dit rien de faux sur ce qui est enregistré.
 */
const state=vi.hoisted(()=>({transactions:[] as any[],confirm:vi.fn(),waitForDocument:vi.fn()}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),addTransaction:()=>undefined,addStockItem:()=>undefined,addEquipment:()=>undefined,updateTransaction:()=>undefined}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:(...args:any[])=>state.waitForDocument(...args),adjustNumber:()=>undefined,put:()=>undefined}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:()=>undefined}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string,dataUrl:string,fileName:string,mimeType:string)=>({id,fileName,mimeType,parts:[dataUrl]}),
  saveFinanceDocumentConfirmed:(...args:any[])=>state.confirm(...args),loadDriveProofReceipt:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import type {PurchaseDraft} from '../../../../src/services/purchaseEntry';

const draft:PurchaseDraft={submissionId:'r1-rattache-0000001',date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',description:'Achat',category:'brassage',amount:10,
  lines:[{id:'l1',description:'Port',kind:'shipping',amount:10,unit:'',stockAction:'none',equipmentAction:'none'}],paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF',
  proofDataUrl:'data:image/jpeg;base64,AAAA',proofFileName:'Screenshot.jpg',proofType:'image/jpeg',documentHash:'b'.repeat(64)};
const existing={id:'TX-old',date:'27.04.2026',description:'Achat',category:'brassage',amountHT:10,tvaRate:0,tvaAmount:0,amountTTC:10,
  finance:{version:1,kind:'expense',amountCents:1000,vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',lines:[]}};
beforeEach(()=>{state.transactions=[existing];state.confirm.mockReset();state.waitForDocument.mockReset().mockResolvedValue(undefined);});

describe('Rattachement : au-delà de 15 s, « en cours » et non une erreur',()=>{
  it('le message nomme « Rattacher le justificatif », jamais « Confirmer et enregistrer », garde le code, et ne dit pas que rien n’est enregistré',async()=>{
    expect(entry.purchaseProofAttachable(draft,existing as any)).toBe(true);
    state.confirm.mockRejectedValueOnce(Object.assign(Error('Texte neutre de financeDocuments'),{code:'drive/in-progress'}));
    const error:any=await entry.attachProofToPurchase(draft,'TX-old').catch(cause=>cause);
    expect(error.code).toBe('drive/in-progress');
    expect(error.message).toContain('Rattacher le justificatif');
    expect(error.message).not.toContain('Confirmer et enregistrer');
    expect(error.message).not.toContain('Rien n’est enregistré');
    expect(error.message).toMatch(/en cours.*peut encore aboutir/s);
  });
  it('témoin : au même endroit, l’achat garde son texte (« Confirmer et enregistrer »)',async()=>{
    state.transactions=[];
    state.confirm.mockRejectedValueOnce(Object.assign(Error('Texte neutre'),{code:'drive/in-progress'}));
    const error:any=await entry.savePurchaseWithProofReceipt({...draft,submissionId:'r1-achat-en-cours-001'}).catch(cause=>cause);
    expect(error.code).toBe('drive/in-progress');
    expect(error.message).toContain('Confirmer et enregistrer');
  });
});
