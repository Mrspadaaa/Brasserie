import {beforeEach,describe,it,expect,vi} from 'vitest';
// Voie s2-enregistrement : S8. Une pro-forma puis sa facture finale (autre n°, même commande, même total) : signalé, jamais bloquant.
// 7 jours (références communes seules) repose sur une seule facture mesurée par d1 (3 jours) : choix du plan, à rejouer sur d'autres factures.
const state=vi.hoisted(()=>({stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]}}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>[],getConfig:()=>({fiscal:{isTvaRegistered:false}})}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[]}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string)=>({id}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import type {PurchaseDraft} from '../../../../src/services/purchaseEntry';

beforeEach(()=>{state.stocks={rawMaterials:[],cleaning:[],equipment:[]};});

const recorded=(finance:Record<string,unknown>={},tx:Record<string,unknown>={})=>({id:'TX-proforma-372765',date:'27.04.2026',amountTTC:86.5,description:'Pro-forma',
  finance:{version:1,kind:'expense',amountCents:8650,vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',sourceOrderNumber:'ORD-5001',recordedAt:new Date().toISOString(),
    lines:[{id:'a',description:'Maris Otter',kind:'ingredient',amountCents:1380,sourceReference:'MA0221'},{id:'b',description:'Pilsner',kind:'ingredient',amountCents:750,sourceReference:'MA0007'}],...finance},...tx}) as any;
const final=(more:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:'finale-380001-0001',date:'30.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'380001',sourceOrderNumber:'ord 5001',description:'Achat',category:'brassage',amount:86.5,
  lines:[{id:'a',description:'Maris Otter',kind:'ingredient',amount:13.8,quantity:6,unit:'Kg',sourceReference:'MA0221',stockAction:'none',equipmentAction:'none'},{id:'b',description:'Pilsner',kind:'ingredient',amount:72.7,quantity:5,unit:'Kg',sourceReference:'MA0007',stockAction:'none',equipmentAction:'none'}],
  paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF',...more});
const noOrder={sourceOrderNumber:undefined};

describe('S8 : une même commande facturée deux fois est signalée avant l’enregistrement',()=>{
  it('facture finale n° 380001 trois jours après la pro-forma n° 372765, même commande : un signal avec ses raisons',()=>{
    const found=entry.purchaseSimilarOrders(final(),[recorded()]);
    expect(found).toHaveLength(1);
    expect(found[0].tx.id).toBe('TX-proforma-372765');expect(found[0].days).toBe(3);
    expect(found[0].reasons).toEqual(['Même commande n° ord 5001','Même fournisseur et même total','Autre n° de facture : 380001 (déjà 372765)','3 jours d’écart']);
  });
  it('ne bloque pas : validatePurchase ne se plaint pas d’un doublon, et purchaseDuplicates ne rend rien',()=>{
    const transactions=[recorded()];
    expect(entry.purchaseDuplicates(final(),transactions)).toEqual([]);
    expect(entry.validatePurchase(final(),state.stocks as any,transactions).some(message=>message.includes('doublon'))).toBe(false);
  });
  it('même commande : 60 jours au plus ; 61 jours, rien',()=>{
    expect(entry.purchaseSimilarOrders(final({date:'26.06.2026'}),[recorded()])).toHaveLength(1);
    expect(entry.purchaseSimilarOrders(final({date:'27.06.2026'}),[recorded()])).toEqual([]);
  });
  it('commande lue d’un seul côté : seules les références communes comptent, 7 jours au plus',()=>{
    expect(entry.purchaseSimilarOrders(final({date:'04.05.2026',...noOrder}),[recorded()])).toHaveLength(1);
    expect(entry.purchaseSimilarOrders(final({date:'05.05.2026',...noOrder}),[recorded()])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final({...noOrder}),[recorded({sourceOrderNumber:undefined})])[0].reasons).toContain('2 références d’article en commun');
  });
  it('garde-fou : ni commande ni références communes (cas B de la sonde, 3 jours, autre n°) : rien',()=>{
    const bare=recorded({sourceOrderNumber:undefined,lines:[{id:'a',description:'Malt',kind:'ingredient',amountCents:8650}]});
    expect(entry.purchaseSimilarOrders(final({...noOrder}),[bare])).toEqual([]);
  });
  it('autre total, autre fournisseur, autre commande sans références, avoir, dépense annulée, vente : rien',()=>{
    expect(entry.purchaseSimilarOrders(final({amount:86.55}),[recorded()])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final({vendor:'Moulin du Banc'}),[recorded()])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final({sourceOrderNumber:'ORD-9999',lines:[{...final().lines[0],sourceReference:'X1'},{...final().lines[1],sourceReference:'X2'}]}),[recorded()])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final({sourceDocumentType:'credit_note'}),[recorded()])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final(),[recorded({voidedAt:'2026-04-28T00:00:00.000Z'})])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final(),[recorded({kind:'income'})])).toEqual([]);
  });
  it('exclut la saisie courante et ce que purchaseDuplicates signale déjà (même numéro de facture, même fichier)',()=>{
    expect(entry.purchaseSimilarOrders(final(),[recorded({},{id:'TX-finale-380001-0001'})])).toEqual([]);
    expect(entry.purchaseDuplicates(final({invoiceNumber:'372765'}),[recorded()])).toHaveLength(1);
    expect(entry.purchaseSimilarOrders(final({invoiceNumber:'372765'}),[recorded()])).toEqual([]);
    expect(entry.purchaseSimilarOrders(final({invoiceNumber:''}),[recorded()])).toEqual([]);
  });
  it('date absente : signalé avec « Date absente » si la dépense a été saisie récemment, jamais si elle est ancienne',()=>{
    const found=entry.purchaseSimilarOrders(final({date:''}),[recorded()]);
    expect(found).toHaveLength(1);expect(found[0].reasons).toContain('Date absente');expect(found[0].days).toBeUndefined();
    const old=recorded({recordedAt:new Date(Date.now()-120*86_400_000).toISOString()},{date:'01.01.2026'});
    expect(entry.purchaseSimilarOrders(final({date:''}),[old])).toEqual([]);
  });
  it('plusieurs dépenses : la plus proche en date d’abord',()=>{
    const far=recorded({},{id:'TX-loin',date:'20.03.2026'}),near=recorded({invoiceNumber:'372000'},{id:'TX-proche',date:'28.04.2026'});
    expect(entry.purchaseSimilarOrders(final(),[far,near]).map(item=>item.tx.id)).toEqual(['TX-proche','TX-loin']);
  });
});
