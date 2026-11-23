import {beforeEach,describe,it,expect,vi} from 'vitest';
// Voie s2-enregistrement : DR5 (nom lisible dans Drive, nom d'origine gardé), DR1 (la preuve Drive remonte à l'appelant), DR4 (message).
// `financeDocuments` est simulé : Drive n'est jamais touché.
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[],confirm:vi.fn(),reload:vi.fn(),waitForDocument:vi.fn()}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:()=>undefined,addEquipment:()=>undefined,updateTransaction:(tx:any)=>{state.writes.push(['update',tx]);}}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:(...args:any[])=>state.waitForDocument(...args),adjustNumber:()=>undefined,put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:()=>undefined}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string,dataUrl:string,fileName:string,mimeType:string)=>({id,fileName,mimeType,parts:[dataUrl]}),
  saveFinanceDocumentConfirmed:(...args:any[])=>state.confirm(...args),loadDriveProofReceipt:(...args:any[])=>state.reload(...args)}));
import * as entry from '../../../../src/services/purchaseEntry';
import type {PurchaseDraft} from '../../../../src/services/purchaseEntry';

const PROOF='data:image/jpeg;base64,AAAA';
const receipt=(more:Record<string,unknown>={})=>({driveFileId:'drive-1',fileName:'2026-04-27 Brau- und Rauchshop GmbH 372765.jpg',bytes:735721,sha256:'a'.repeat(64),verified:true,folder:'L’Affinée / Justificatifs / 2026',webViewLink:'https://drive.google.com/file/d/drive-1/view',...more});
const draft=(id:string,more:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:id,date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',description:'Achat',category:'brassage',amount:10,
  lines:[{id:'l1',description:'Port',kind:'shipping',amount:10,unit:'',stockAction:'none',equipmentAction:'none'}],paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF',
  proofDataUrl:PROOF,proofFileName:'Screenshot_2026-04-27.jpg',proofType:'image/jpeg',documentHash:'b'.repeat(64),...more});
beforeEach(()=>{state.transactions=[];state.writes=[];state.confirm.mockReset().mockResolvedValue(receipt());state.reload.mockReset();state.waitForDocument.mockReset().mockResolvedValue(undefined);});

describe('DR5 : le justificatif est nommé AAAA-MM-JJ Fournisseur Numéro.ext',()=>{
  const name=entry.driveProofFileName;
  it('la facture 372765 donne 2026-04-27 Brau- und Rauchshop GmbH 372765.jpg (forme juridique gardée)',()=>{
    expect(name({date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',mimeType:'image/jpeg',originalName:'Screenshot_2026.jpg'})).toBe('2026-04-27 Brau- und Rauchshop GmbH 372765.jpg');
  });
  it('retire les caractères interdits, compacte les espaces, omet le numéro ou le fournisseur absent',()=>{
    expect(name({date:'27.04.2026',vendor:' Malterie / du:Banc  ',invoiceNumber:'MB*77?',mimeType:'application/pdf',originalName:'x.pdf'})).toBe('2026-04-27 Malterie duBanc MB77.pdf');
    expect(name({date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'',mimeType:'image/png',originalName:'x'})).toBe('2026-04-27 Brau- und Rauchshop GmbH.png');
    expect(name({date:'27.04.2026',vendor:'',invoiceNumber:'',mimeType:'image/webp',originalName:'x'})).toBe('2026-04-27 Justificatif.webp');
  });
  it('l’extension vient du type du contenu, jamais du nom d’origine ; 120 caractères au total, coupés avant l’extension',()=>{
    expect(name({date:'27.04.2026',vendor:'F',invoiceNumber:'1',mimeType:'image/jpeg',originalName:'photo.png'})).toBe('2026-04-27 F 1.jpg');
    const long=name({date:'27.04.2026',vendor:'Fournisseur '.repeat(20),invoiceNumber:'372765',mimeType:'application/pdf',originalName:'x.pdf'});
    expect(long.length).toBeLessThanOrEqual(120);expect(long.endsWith('.pdf')).toBe(true);expect(long.startsWith('2026-04-27 Fournisseur')).toBe(true);
  });
  it('date illisible : le nom d’origine nettoyé, sans inventer une date',()=>{
    expect(name({date:'',vendor:'F',invoiceNumber:'1',mimeType:'image/jpeg',originalName:'Scan:du/jour.jpg'})).toBe('Scandujour.jpg');
  });
  it('l’envoi à Drive porte le nom lisible ; la dépense garde le nom d’origine à part',async()=>{
    await entry.savePurchaseWithProofReceipt(draft('dr5-nom-lisible-01'));
    const [prepared,year]=state.confirm.mock.calls[0];
    expect(prepared.fileName).toBe('2026-04-27 Brau- und Rauchshop GmbH 372765.jpg');expect(year).toBe(2026);
    expect(state.transactions[0].proofFileName).toBe('2026-04-27 Brau- und Rauchshop GmbH 372765.jpg');
    expect(state.transactions[0].finance.proofOriginalFileName).toBe('Screenshot_2026-04-27.jpg');
  });
  // Correction de la relecture (n° 2) : l'ancien test exigeait qu'un échec hors ligne fige le nom ; il consacrait le défaut.
  it.each(['unavailable','drive/auth-required'])('un échec avant tout envoi (%s) ne fige aucun nom : le nom suit le fournisseur et le numéro corrigés',async code=>{
    const value=draft(`dr5-avant-envoi-${code.length}`,{vendor:'Brau',invoiceNumber:''});
    state.confirm.mockRejectedValueOnce(Object.assign(Error('rien n’est parti'),{code}));
    await expect(entry.savePurchaseWithProofReceipt(value)).rejects.toThrow();
    expect(state.confirm.mock.calls[0][0].fileName).toBe('2026-04-27 Brau.jpg');
    await entry.savePurchaseWithProofReceipt({...value,invoiceNumber:'372765'});
    expect(state.confirm.mock.calls[1][0].fileName).toBe('2026-04-27 Brau 372765.jpg');
    expect(state.transactions[0].invoiceNumber??state.transactions[0].finance.invoiceNumber).toBe('372765');
  });
  it('le nom de la dépense et du reçu est celui que Drive rend, même quand la saisie courante dirait autre chose',async()=>{
    state.confirm.mockResolvedValueOnce(receipt({fileName:'2026-04-27 Brau- und Rauchshop GmbH 111.jpg'}));
    const done=await entry.savePurchaseWithProofReceipt(draft('dr5-nom-de-drive-01',{invoiceNumber:'222'}));
    expect(state.confirm.mock.calls[0][0].fileName).toBe('2026-04-27 Brau- und Rauchshop GmbH 222.jpg');
    expect(done.proof!.fileName).toBe('2026-04-27 Brau- und Rauchshop GmbH 111.jpg');
    expect(state.transactions[0].proofFileName).toBe('2026-04-27 Brau- und Rauchshop GmbH 111.jpg');
  });
  it('Drive ne rend pas le nom : le reçu n’en a pas, et la dépense garde le nom d’origine, jamais un nom déduit de la saisie',async()=>{
    const {fileName:_,...withoutName}=receipt();
    state.confirm.mockResolvedValueOnce(withoutName);
    const done=await entry.savePurchaseWithProofReceipt(draft('dr5-nom-absent-0001'));
    expect(done.proof).not.toHaveProperty('fileName');
    expect(state.transactions[0].proofFileName).toBe('Screenshot_2026-04-27.jpg');
  });
  it('le nom lu sur Drive est mémorisé dès que le reçu existe : une demande suivante pour la même saisie reprend ce nom',async()=>{
    state.confirm.mockResolvedValueOnce(receipt({fileName:'Nom sur Drive.jpg'}));
    const value=draft('dr5-memo-recu-00001');
    await entry.savePurchaseWithProofReceipt(value);
    state.transactions=[{id:'TX-ancien',date:'27.04.2026',amountTTC:10,description:'Pro-forma',finance:{version:1,kind:'expense',amountCents:1000,vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',recordedAt:new Date().toISOString(),lines:[]}}];
    await entry.attachProofToPurchase(value,'TX-ancien');
    expect(state.confirm.mock.calls[1][0].fileName).toBe('Nom sur Drive.jpg');
  });
  it('l’attache à une dépense existante nomme le fichier avec cette dépense, et rend le reçu',async()=>{
    state.transactions=[{id:'TX-ancien',date:'27.04.2026',amountTTC:10,description:'Pro-forma',finance:{version:1,kind:'expense',amountCents:1000,vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',recordedAt:new Date().toISOString(),lines:[]}}];
    const value=draft('dr5-attache-0000001',{vendor:'BRAU- UND RAUCHSHOP',invoiceNumber:'',date:'28.04.2026'});
    const result=await entry.attachProofToPurchase(value,'TX-ancien');
    expect(state.confirm.mock.calls[0][0].fileName).toBe('2026-04-27 Brau- und Rauchshop GmbH 372765.jpg');
    expect(result).toMatchObject({fileName:'2026-04-27 Brau- und Rauchshop GmbH 372765.jpg',originalFileName:'Screenshot_2026-04-27.jpg'});
    expect(state.writes.find(w=>w[0]==='update')![1]).toMatchObject({proofFileName:'2026-04-27 Brau- und Rauchshop GmbH 372765.jpg',finance:{proofOriginalFileName:'Screenshot_2026-04-27.jpg'}});
  });
});

describe('DR1 : la preuve Drive remonte jusqu’à l’appelant',()=>{
  it('savePurchaseWithProofReceipt rend dossier, nom, octets, empreinte vérifiée et webViewLink ; savePurchaseWithProof rend toujours la chaîne',async()=>{
    const done=await entry.savePurchaseWithProofReceipt(draft('dr1-preuve-0000001'));
    expect(done.transactionId).toBe('TX-dr1-preuve-0000001');
    expect(done.proof).toMatchObject({folder:'L’Affinée / Justificatifs / 2026',fileName:'2026-04-27 Brau- und Rauchshop GmbH 372765.jpg',bytes:735721,verified:true,webViewLink:'https://drive.google.com/file/d/drive-1/view',originalFileName:'Screenshot_2026-04-27.jpg'});
    expect(done.proof!.sha256).toMatch(/^[a-f0-9]{64}$/);
    state.transactions=[];
    expect(await entry.savePurchaseWithProof(draft('dr1-chaine-0000001'))).toBe('TX-dr1-chaine-0000001');
  });
  it('le second appel (déjà enregistré) rend le même reçu sans renvoyer le fichier ; le reçu se relit par purchaseProofReceipt',async()=>{
    const value=draft('dr1-second-appel-01');
    const first=await entry.savePurchaseWithProofReceipt(value),second=await entry.savePurchaseWithProofReceipt(value);
    expect(second.proof).toEqual(first.proof);expect(state.confirm).toHaveBeenCalledTimes(1);
    expect(await entry.purchaseProofReceipt('dr1-second-appel-01')).toEqual(first.proof);
  });
  it('après rechargement : lu dans le document de l’original et Drive ; sans reçu possible (hors ligne, sans jeton) : undefined, jamais un faux reçu',async()=>{
    state.reload.mockResolvedValueOnce(receipt()).mockResolvedValueOnce(undefined);
    expect(await entry.purchaseProofReceipt('dr1-rechargement-01')).toMatchObject({folder:'L’Affinée / Justificatifs / 2026',verified:true});
    expect(state.reload).toHaveBeenCalledWith('proof-dr1-rechargement-01');
    expect(await entry.purchaseProofReceipt('dr1-hors-ligne-0001')).toBeUndefined();
  });
  it('sans justificatif ou en copie locale (aucun reçu Drive), pas de reçu',async()=>{
    expect((await entry.savePurchaseWithProofReceipt(draft('dr1-sans-preuve-001',{proofDataUrl:undefined,proofFileName:undefined,proofType:undefined,documentHash:undefined}))).proof).toBeUndefined();
    state.transactions=[];state.confirm.mockResolvedValueOnce(undefined);
    expect((await entry.savePurchaseWithProofReceipt(draft('dr1-copie-locale-001'))).proof).toBeUndefined();
  });
});

describe('DR4 : au-delà de 15 s, « en cours » et non une erreur',()=>{
  it('le message d’achat dit que l’envoi peut encore aboutir et garde le code',async()=>{
    state.confirm.mockRejectedValueOnce(Object.assign(Error('Texte neutre de financeDocuments'),{code:'drive/in-progress'}));
    const error:any=await entry.savePurchaseWithProofReceipt(draft('dr4-en-cours-00001')).catch(cause=>cause);
    expect(error.message).toMatch(/en cours.*peut encore aboutir/s);
    expect(error.message).not.toMatch(/réessaie lorsque la connexion/);
    expect(error.code).toBe('drive/in-progress');
    expect(state.transactions).toEqual([]);
  });
});
