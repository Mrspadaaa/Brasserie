import {describe,it,expect,vi} from 'vitest';
// Voie dp-doublon (01.11) : « on doit voir que ce document est déjà lié à un stock, facture ». Données synthétiques seulement.
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],getConfig:()=>({fiscal:{isTvaRegistered:false}})}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[]}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string)=>({id}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import type {PurchaseDraft} from '../../../../src/services/purchaseEntry';

const HASH='a'.repeat(64);
const stocks={rawMaterials:[{ref:'MP-MO',name:'Maris Otter',unit:'kg'},{ref:'MP-CI',name:'Citra 12.5%',unit:'g'},{ref:'MP-SA',name:'Saaz',unit:'g'}] as any[],cleaning:[{ref:'NE-PAA',name:'Acide peracétique',unit:'L'}] as any[],equipment:[{ref:'EQ-F30',name:'Fermenteur 30 L'}] as any[]};
const enregistree=(finance:Record<string,unknown>={},tx:Record<string,unknown>={})=>({id:'TX-fictive-1',date:'12.10.2026',amountTTC:312.4,description:'Malt et houblons',category:'brassage',
  finance:{version:1,kind:'expense',amountCents:31240,vendor:'Fournisseur fictif SA',invoiceNumber:'F-1001',sourceOrderNumber:'CMD-7001',sourceDocumentHash:HASH,recordedAt:new Date().toISOString(),
    lines:[{id:'l1',description:'Maris Otter 25 kg',kind:'ingredient',amountCents:6000,quantity:25,unit:'kg',stockItemRef:'MP-MO'},{id:'l2',description:'Citra T90',kind:'ingredient',amountCents:3000,quantity:100,unit:'g',stockItemRef:'MP-CI'},{id:'l3',description:'Frais de port',kind:'service',amountCents:22240}],...finance},...tx}) as any;
const brouillon=(more:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:'saisie-0001',date:'14.10.2026',vendor:'Fournisseur Fictif',invoiceNumber:'',sourceOrderNumber:'cmd 7001',description:'Achat',category:'brassage',amount:312.65,
  lines:[{id:'a',description:'Maris Otter',kind:'ingredient',amount:60,quantity:25,unit:'kg',stockAction:'none',equipmentAction:'none'}],paymentStatus:'paid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF',...more});

describe('même fichier : certain, avant toute lecture',()=>{
  it('trouve la dépense dont l’empreinte est celle du fichier',()=>{
    expect(entry.purchaseSameFile(HASH,[enregistree()])?.id).toBe('TX-fictive-1');
  });
  it('rien sans empreinte, autre empreinte, dépense annulée, saisie courante ou ancienne dépense sans empreinte',()=>{
    expect(entry.purchaseSameFile(undefined,[enregistree()])).toBeUndefined();
    expect(entry.purchaseSameFile('b'.repeat(64),[enregistree()])).toBeUndefined();
    expect(entry.purchaseSameFile(HASH,[enregistree({voidedAt:'2026-10-13T00:00:00.000Z'})])).toBeUndefined();
    expect(entry.purchaseSameFile(HASH,[enregistree({},{id:'TX-saisie-0001'})],'saisie-0001')).toBeUndefined();
    expect(entry.purchaseSameFile(HASH,[enregistree({sourceDocumentHash:undefined})])).toBeUndefined();
  });
  it('deux dépenses au même fichier : la dernière saisie d’abord',()=>{
    const vieille=enregistree({recordedAt:'2026-09-01T10:00:00.000Z'},{id:'TX-vieille'}),recente=enregistree({recordedAt:'2026-10-12T10:00:00.000Z'},{id:'TX-recente'});
    expect(entry.purchaseSameFile(HASH,[vieille,recente])?.id).toBe('TX-recente');
  });
});

describe('ce à quoi la dépense est liée',()=>{
  it('ses articles de stock par leur nom, avec la quantité, et son matériel',()=>{
    const tx=enregistree({lines:[...enregistree().finance.lines,{id:'l4',description:'Fermenteur',kind:'equipment',amountCents:10000,equipmentRef:'EQ-F30'}]});
    expect(entry.purchaseLinks(tx,stocks)).toEqual({stock:[{ref:'MP-MO',name:'Maris Otter',quantity:25,unit:'kg'},{ref:'MP-CI',name:'Citra 12.5%',quantity:100,unit:'g'}],equipment:[{ref:'EQ-F30',name:'Fermenteur 30 L'}]});
  });
  it('deux lignes du même article : un seul article, quantités additionnées à unité égale ; unités différentes : sans quantité',()=>{
    const meme=enregistree({lines:[{id:'x',description:'MO',kind:'ingredient',amountCents:1,quantity:25,unit:'kg',stockItemRef:'MP-MO'},{id:'y',description:'MO',kind:'ingredient',amountCents:1,quantity:5,unit:'kg',stockItemRef:'MP-MO'}]});
    expect(entry.purchaseLinks(meme,stocks).stock).toEqual([{ref:'MP-MO',name:'Maris Otter',quantity:30,unit:'kg'}]);
    const autre=enregistree({lines:[{id:'x',description:'MO',kind:'ingredient',amountCents:1,quantity:25,unit:'kg',stockItemRef:'MP-MO'},{id:'y',description:'MO',kind:'ingredient',amountCents:1,quantity:500,unit:'g',stockItemRef:'MP-MO'}]});
    expect(entry.purchaseLinks(autre,stocks).stock).toEqual([{ref:'MP-MO',name:'Maris Otter',quantity:undefined,unit:'kg'}]);
  });
  it('un article de nettoyage compte ; un article disparu du stock garde sa place sans nom',()=>{
    const tx=enregistree({lines:[{id:'x',description:'PAA',kind:'cleaning',amountCents:1,stockItemRef:'NE-PAA'},{id:'y',description:'?',kind:'ingredient',amountCents:1,stockItemRef:'MP-DISPARU'}]});
    expect(entry.purchaseLinks(tx,stocks).stock.map(item=>item.name)).toEqual(['Acide peracétique',undefined]);
  });
});

describe('même commande, totaux différents : la facture PDF et la page web',()=>{
  it('même fournisseur, même n° de commande, page sans n° de facture, 0,25 d’écart : un signal, les deux totaux',()=>{
    const found=entry.purchaseSameOrder(brouillon(),[enregistree()]);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({gapCents:25,days:2});
    expect(found[0].reasons).toEqual(['Même commande n° cmd 7001','Même fournisseur','Autre total','Ce document sans n° de facture','2 jours d’écart']);
    expect(entry.purchaseSimilarOrders(brouillon(),[enregistree()])).toEqual([]);
  });
  it('jamais un blocage : validatePurchase ne parle pas de doublon',()=>{
    expect(entry.validatePurchase(brouillon(),stocks as any,[enregistree()]).some(message=>message.includes('doublon'))).toBe(false);
  });
  it('sans n° de commande lu (d’un côté ou de l’autre) : rien de neuf',()=>{
    expect(entry.purchaseSameOrder(brouillon({sourceOrderNumber:undefined}),[enregistree()])).toEqual([]);
    expect(entry.purchaseSameOrder(brouillon(),[enregistree({sourceOrderNumber:undefined})])).toEqual([]);
  });
  it('autre commande, autre fournisseur, plus de 60 jours, avoir, dépense annulée : rien',()=>{
    expect(entry.purchaseSameOrder(brouillon({sourceOrderNumber:'CMD-7002'}),[enregistree()])).toEqual([]);
    expect(entry.purchaseSameOrder(brouillon({vendor:'Autre Malterie'}),[enregistree()])).toEqual([]);
    expect(entry.purchaseSameOrder(brouillon({date:'12.12.2026'}),[enregistree()])).toEqual([]);
    expect(entry.purchaseSameOrder(brouillon({date:'11.12.2026'}),[enregistree()])).toHaveLength(1);
    expect(entry.purchaseSameOrder(brouillon({sourceDocumentType:'credit_note'}),[enregistree()])).toEqual([]);
    expect(entry.purchaseSameOrder(brouillon(),[enregistree({voidedAt:'2026-10-13T00:00:00.000Z'})])).toEqual([]);
  });
  it('ce que les règles existantes signalent déjà n’est pas répété (même fichier, autre n° au même total)',()=>{
    expect(entry.purchaseSameOrder(brouillon({documentHash:HASH}),[enregistree()])).toEqual([]);
    const proforma=brouillon({invoiceNumber:'F-2002',amount:312.4});
    expect(entry.purchaseSimilarOrders(proforma,[enregistree()])).toHaveLength(1);
    expect(entry.purchaseSameOrder(proforma,[enregistree()])).toEqual([]);
  });
});
