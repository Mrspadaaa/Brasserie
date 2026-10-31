import {beforeEach,describe,it,expect,vi} from 'vitest';
// Voie s2-enregistrement : A7 (date de paiement supposée), A11 (prix unitaire gardé), A12 (« Pour quoi ? » proposé par le code).
// Gemini et Drive ne sont jamais appelés : la lecture est une copie simulée des lignes de la facture 372765 (sans nom ni adresse du client).
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[],registered:false}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:state.registered}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(kind:any,item:any)=>state.writes.push(['stock',kind,item]),addEquipment:(item:any)=>state.writes.push(['equipment',item]),updateTransaction:(tx:any)=>state.writes.push(['update',tx])}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:async()=>undefined,adjustNumber:(...args:any[])=>state.writes.push(['increment',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:(tx:any,payment:any)=>{state.writes.push(['transaction',tx],['put','financialPayments',payment.id,payment]);state.transactions.push(tx);}}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string,dataUrl:string,fileName:string,mimeType:string)=>({id,fileName,mimeType,parts:[dataUrl]}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import * as prefill from '../../../../src/services/purchasePrefill';
import type {PurchaseDraft,PurchaseLineDraft} from '../../../../src/services/purchaseEntry';

beforeEach(()=>{state.transactions=[];state.writes=[];state.registered=false;state.stocks={rawMaterials:[],cleaning:[],equipment:[]};});

const scan=(patch:Record<string,unknown>={}):any=>({documentType:'invoice',vendor:'Brau- und Rauchshop GmbH',date:'27.04.2026',currency:'CHF',invoiceNumber:'372765',amountHT:null,amountTTC:86.5,tvaRate:null,tvaAmount:null,category:'brassage',subcategory:'',
  description:'Achat de malts, houblons, levures et suppléments de mouture',paymentEvidence:'paid',
  items:[{id:'line-1',name:'Maris Otter, Kg',kind:'stock',reference:'MA0221',quantity:6,unit:'Kg',price:2.3,amountTTC:13.8,stockCategory:''},
    {id:'line-2',name:'Zuschlag Schrotung',kind:'service',reference:'ISHOP-SCHROT',quantity:6,unit:'Kg',price:0.1,amountTTC:0.6,stockCategory:''}],
  issues:[],review:{status:'checked',findings:[]},...patch});

describe('A7 : la date de paiement non imprimée n’est jamais présentée comme lue',()=>{
  it('le scan marque la date de paiement « supposée = date du document », preuve payée, inconnue ou impayée',()=>{
    expect(prefill.scannedPayment(scan(),'09.09.2026')).toMatchObject({paymentStatus:'paid',paymentDate:'27.04.2026',paymentDateBasis:'document_date'});
    expect(prefill.scannedPayment(scan({paymentEvidence:'unknown'}),'09.09.2026')).toMatchObject({paymentDateBasis:'document_date'});
    expect(prefill.scannedPayment(scan({paymentEvidence:'unpaid'}),'09.09.2026')).toMatchObject({paymentStatus:'unpaid',paymentDateBasis:'document_date'});
  });
  it('sans date lue : pas de base (la clé existe, valeur indéfinie)',()=>{
    const result=prefill.scannedPayment(scan({date:''}),'09.09.2026');
    expect('paymentDateBasis' in result).toBe(true);expect(result.paymentDateBasis).toBeUndefined();
  });
  const paid=(more:Partial<PurchaseDraft>={})=>({date:'31.08.2026',paymentDate:'31.08.2026',paymentStatus:'paid',...more}) as PurchaseDraft;
  it('une date de paiement tapée est marquée « typed » ; celle du scan garde sa base ; la substitution par la date du jour n’est jamais « typed »',()=>{
    expect(prefill.patchPurchaseDraft(paid(),{paymentDate:'02.09.2026'},'09.09.2026').paymentDateBasis).toBe('typed');
    expect(prefill.patchPurchaseDraft(paid(),{...prefill.scannedPayment(scan(),'09.09.2026')},'09.09.2026').paymentDateBasis).toBe('document_date');
    expect(prefill.patchPurchaseDraft(paid({paymentDateBasis:'document_date'}),{paymentStatus:'paid',paymentDate:'09.09.2026'},'09.09.2026').paymentDateBasis).toBeUndefined();
  });
  it('la date de paiement suit la date du document tant qu’elle n’est pas tapée, et se marque « document_date »',()=>{
    const next=prefill.patchPurchaseDraft(paid(),{date:'31.07.2026'},'09.09.2026');
    expect(next).toMatchObject({paymentDate:'31.07.2026',paymentDateBasis:'document_date'});
  });
  it('tapée égale à la date du document, puis la date change : la date tapée reste',()=>{
    const typed=prefill.patchPurchaseDraft(paid(),{paymentDate:'31.08.2026'},'09.09.2026');
    expect(typed.paymentDateBasis).toBe('typed');
    const moved=prefill.patchPurchaseDraft(typed,{date:'31.07.2026'},'09.09.2026');
    expect(moved.paymentDate).toBe('31.08.2026');expect(moved.paymentDateBasis).toBe('typed');
  });
  it('savePurchase écrit la base sur la dépense et la règle sur le paiement ; impayé : rien',()=>{
    const base=(id:string,more:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:id,date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',description:'Achat',category:'brassage',amount:10,
      lines:[{id:'l1',description:'Port',kind:'shipping',amount:10,unit:'',stockAction:'none',equipmentAction:'none'}],paymentStatus:'paid',paymentMethod:'bank',paymentDate:'27.04.2026',dueDate:'',sourceCurrency:'CHF',...more});
    entry.savePurchase(base('a7-supposee-0001',{paymentDateBasis:'document_date'}));
    expect(state.transactions[0].finance.paymentDateBasis).toBe('document_date');
    const payment=state.writes.find(w=>w[0]==='put'&&w[1]==='financialPayments')![3];
    expect(payment.note).toBe(entry.PAYMENT_DATE_ASSUMED_NOTE);
    state.writes=[];state.transactions=[];
    entry.savePurchase(base('a7-tapee-000002',{paymentDateBasis:'typed'}));
    expect(state.transactions[0].finance.paymentDateBasis).toBe('typed');
    expect(state.writes.find(w=>w[0]==='put'&&w[1]==='financialPayments')![3].note).toBeUndefined();
    state.writes=[];state.transactions=[];
    entry.savePurchase(base('a7-impayee-00003',{paymentStatus:'unpaid',paymentDateBasis:'document_date'}));
    expect(state.transactions[0].finance.paymentDateBasis).toBeUndefined();
  });
});

// Les 23 lignes de la facture (diagnostic/d1/verite-facture-372765.json) : [libellé, quantité, unité, prix lu, montant, nature].
const LIGNES:Array<[string,number,string,number,number,'ingredient'|'service']>=[
  ['Maris Otter, Kg',6,'Kg',2.3,13.8,'ingredient'],['Zuschlag Schrotung',6,'Kg',0.1,0.6,'service'],['Gerstenflocken, 1 Kg',1,'Kg',2.4,2.4,'ingredient'],
  ['Röstgerste, Kg',1,'Kg',1.8,1.8,'ingredient'],['Zuschlag Schrotung',1,'Kg',0.1,0.1,'service'],['CARAMÜNCH® Typ 2 Kg',1,'Kg',1.75,1.75,'ingredient'],
  ['Zuschlag Schrotung',1,'Kg',0.1,0.1,'service'],['Target 11.3%',40,'g',0.04,1.6,'ingredient'],['Goldings East Kent 5.5%',20,'g',0.04,0.8,'ingredient'],
  ['LALLEMAND Windsor 11g',2,'Stk',4.5,9,'ingredient'],['Safale BE-256 (Abbaye) 11.5 g',1,'Stk',4.4,4.4,'ingredient'],['Safale US-05 11,5g',2,'Stk',3.4,6.8,'ingredient'],
  ['Pilsner Malz, Kg',5,'Kg',1.5,7.5,'ingredient'],['Zuschlag Schrotung',5,'Kg',0.1,0.5,'service'],['Weizenmalz hell, Kg',2,'Kg',1.55,3.1,'ingredient'],
  ['Zuschlag Schrotung',2,'Kg',0.1,0.2,'service'],['Haferflocken, 1 Kg',2,'Kg',2.5,5,'ingredient'],['Galaxy 17.2%',60,'g',0.08,4.8,'ingredient'],
  ['Nelson Sauvin ™ 9.6%',100,'g',0.08,8,'ingredient'],['Sabro® 13.4%',30,'g',0.07,2.1,'ingredient'],['LALLEMAND Verdant IPA 11g',2,'Stk',4.7,9.4,'ingredient'],
  ['Hallertauer Blanc 9.5% CH',30,'g',0.045,1.35,'ingredient'],['Motueka ™ 8.1%',20,'g',0.07,1.4,'ingredient']];
const lignes=():PurchaseLineDraft[]=>LIGNES.map(([description,quantity,unit,unitPrice,amount,kind],index)=>({id:`line-${index+1}`,description,kind,amount,quantity,unit,unitPrice,stockAction:'none',equipmentAction:'none'}));
const facture=(id:string,lines=lignes()):PurchaseDraft=>({submissionId:id,date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',description:'Achat',category:'brassage',amount:86.5,lines,
  paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF'});

describe('A11 : le prix unitaire lu reste sur la ligne de la dépense',()=>{
  it('23 lignes de la facture : 22 prix gardés en centimes entiers, la ligne à 0,045 CHF/g (pas un nombre entier de centimes) sans prix',()=>{
    entry.savePurchase(facture('a11-facture-0001'));
    const prix=state.transactions[0].finance.lines.map((line:any)=>line.unitPriceCents);
    expect(prix).toEqual([230,10,240,180,10,175,10,4,4,450,440,340,150,10,155,10,250,8,8,7,470,undefined,7]);
    expect(prix.filter((value:unknown)=>value!==undefined)).toHaveLength(22);
  });
  it('ne garde jamais un prix qui contredit le montant, ni sans quantité, ni sur une remise',()=>{
    const lines:PurchaseLineDraft[]=[{id:'a',description:'Contredit',kind:'ingredient',amount:20,quantity:6,unit:'Kg',unitPrice:2.3,stockAction:'none',equipmentAction:'none'},
      {id:'b',description:'Sans quantité',kind:'ingredient',amount:5,unit:'Kg',unitPrice:2.5,stockAction:'none',equipmentAction:'none'},
      {id:'c',description:'Rabais',kind:'discount',amount:-5,quantity:1,unit:'',unitPrice:5,stockAction:'none',equipmentAction:'none'},
      {id:'d',description:'Juste',kind:'ingredient',amount:5,quantity:2,unit:'Kg',unitPrice:2.5,stockAction:'none',equipmentAction:'none'}];
    entry.savePurchase({...facture('a11-contredit-0001',lines),amount:25});
    expect(state.transactions[0].finance.lines.map((line:any)=>line.unitPriceCents)).toEqual([undefined,undefined,undefined,250]);
  });
});

describe('A12 : « Pour quoi ? » est proposé par le code, sans la prose du modèle',()=>{
  it('lecture simulée (aucune catégorie de stock lue) : fournisseur · n° · ingrédients, la mouture n’ajoute pas « services »',()=>{
    expect(prefill.invoicePurchaseDescription(scan())).toBe('Brau- und Rauchshop GmbH · 372765 · ingrédients');
  });
  it('familles uniques, dans l’ordre de première apparition, quand la catégorie est lue',()=>{
    const items=['Malt','Houblon','Levure','Malt'].map((stockCategory,index)=>({id:`l${index}`,name:`Article ${index}`,kind:'stock',quantity:1,unit:'Kg',amountTTC:1,stockCategory}));
    expect(prefill.invoicePurchaseDescription(scan({items}))).toBe('Brau- und Rauchshop GmbH · 372765 · malts, houblons, levures');
  });
  it('60 caractères au plus : retire les familles en commençant par la dernière, puis coupe le fournisseur à un mot',()=>{
    const items=['Malt','Houblon','Levure'].map((stockCategory,index)=>({id:`l${index}`,name:`A${index}`,kind:'stock',quantity:1,unit:'Kg',amountTTC:1,stockCategory}));
    const long=prefill.invoicePurchaseDescription(scan({vendor:'Brau- und Rauchshop GmbH Densbüren Spezialgeschäft',invoiceNumber:'372765',items}));
    expect(long.length).toBeLessThanOrEqual(60);expect(long).toContain('372765');
    const huge=prefill.invoicePurchaseDescription(scan({vendor:'Une très longue raison sociale '.repeat(5),invoiceNumber:'372765'}));
    expect(huge.length).toBeLessThanOrEqual(60);expect(huge.endsWith('372765')||huge.includes('372765')).toBe(true);
  });
  it('ne reprend pas la prose du modèle, ni n’invente un fournisseur absent',()=>{
    expect(prefill.invoicePurchaseDescription(scan())).not.toContain('Achat de malts');
    expect(prefill.invoicePurchaseDescription(scan({vendor:'',invoiceNumber:''}))).toBe('ingrédients');
    expect(prefill.invoicePurchaseDescription(scan({vendor:'',invoiceNumber:'',items:[]}))).toBe('');
  });
  const draft=(more:Partial<PurchaseDraft>)=>({date:'27.04.2026',paymentDate:'',paymentStatus:'paid',description:'',...more}) as PurchaseDraft;
  it('une description tapée n’est jamais remplacée par le scan ; vide ou venue d’un scan, elle est remplacée',()=>{
    const proposed=prefill.applyScannedDescription(draft({description:'Mon texte',descriptionSource:'typed'}),scan());
    expect(proposed).toEqual({});
    expect(prefill.applyScannedDescription(draft({description:'Ancien scan',descriptionSource:'scan'}),scan())).toEqual({description:'Brau- und Rauchshop GmbH · 372765 · ingrédients',descriptionSource:'scan'});
    expect(prefill.applyScannedDescription(draft({description:''}),scan())).toMatchObject({descriptionSource:'scan'});
    expect(prefill.applyScannedDescription(draft({description:'Titre du plan'}),scan())).toEqual({});
  });
  it('une description donnée sans source est « typed » ; une source donnée est gardée',()=>{
    expect(prefill.patchPurchaseDraft(draft({}),{description:'Houblons pour la saison'},'09.09.2026').descriptionSource).toBe('typed');
    expect(prefill.patchPurchaseDraft(draft({}),{description:'Proposé',descriptionSource:'scan'},'09.09.2026').descriptionSource).toBe('scan');
  });
});

// Correction de la relecture (n° 3) : même règle que la description, pour la date de paiement. Le patch passe par `patchPurchaseDraft`, comme à l'écran.
describe('A7 : un second scan n’écrase jamais une date de paiement tapée (applyScannedPayment)',()=>{
  const TODAY='09.09.2026';
  const draft=(more:Partial<PurchaseDraft>):PurchaseDraft=>({date:'27.04.2026',paymentDate:'',paymentStatus:'paid',...more}) as PurchaseDraft;
  const rescan=(previous:PurchaseDraft,date:string)=>prefill.patchPurchaseDraft(previous,prefill.applyScannedPayment(previous,scan({date}),TODAY),TODAY);
  it('tapée, puis un scan : la date tapée et sa base « typed » restent',()=>{
    const previous=draft({paymentDate:'02.09.2026',paymentDateBasis:'typed'});
    expect(prefill.applyScannedPayment(previous,scan({date:'31.08.2026'}),TODAY)).not.toHaveProperty('paymentDate');
    expect(rescan(previous,'31.08.2026')).toMatchObject({paymentDate:'02.09.2026',paymentDateBasis:'typed',paymentStatus:'paid'});
  });
  it('scan, puis un second scan : la date suit le nouveau document, marquée « document_date »',()=>{
    const previous=draft({paymentDate:'27.04.2026',paymentDateBasis:'document_date'});
    expect(rescan(previous,'30.04.2026')).toMatchObject({paymentDate:'30.04.2026',paymentDateBasis:'document_date'});
  });
  it('vide (ou date du jour par défaut, d’origine inconnue), puis un scan : la date du document est proposée',()=>{
    expect(rescan(draft({paymentDate:''}),'27.04.2026')).toMatchObject({paymentDate:'27.04.2026',paymentDateBasis:'document_date'});
    expect(rescan(draft({paymentDate:'09.09.2026'}),'27.04.2026')).toMatchObject({paymentDate:'27.04.2026',paymentDateBasis:'document_date'});
  });
});
