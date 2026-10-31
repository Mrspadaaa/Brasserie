import {beforeEach,describe,it,expect,vi} from 'vitest';
// Voie s2-enregistrement, exigence D213 (« oui attention au unités ») : un prix se lit pour l'unité imprimée de sa ligne, gardée avec lui,
// et ne se compare jamais à un prix d'une autre unité ; la mouture ne se rattache qu'à une quantité et une unité identiques.
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[]}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:()=>undefined,addEquipment:()=>undefined,updateTransaction:()=>undefined}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:async()=>undefined,adjustNumber:()=>undefined,put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:()=>undefined}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string)=>({id}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import {latestBrewPrices} from '../../../../src/domain/finance/brewBudget';
import type {PurchaseDraft,PurchaseLineDraft} from '../../../../src/services/purchaseEntry';

beforeEach(()=>{state.transactions=[];state.writes=[];state.stocks={rawMaterials:[{id:'malt',ref:'MP-001',name:'Maris Otter',unit:'kg',currentStock:10,category:'Malt'}],cleaning:[],equipment:[]};});
const line=(id:string,more:Partial<PurchaseLineDraft>):PurchaseLineDraft=>({id,description:id,kind:'ingredient',amount:1,quantity:1,unit:'Kg',stockAction:'none',equipmentAction:'none',...more});
const draft=(id:string,lines:PurchaseLineDraft[]):PurchaseDraft=>({submissionId:id,date:'27.04.2026',vendor:'F',invoiceNumber:'1',description:'Achat',category:'brassage',amount:Math.round(lines.reduce((sum,item)=>sum+item.amount*100,0))/100,lines,paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF'});

describe('D213 : le prix garde l’unité imprimée de sa ligne',()=>{
  it('la ligne enregistrée garde « Kg » et « g » tels qu’imprimés, avec le prix pour cette unité ; aucune conversion en silence',()=>{
    entry.savePurchase(draft('unit-imprimee-001',[line('a',{description:'Maris Otter',quantity:6,unit:'Kg',amount:13.8,unitPrice:2.3}),line('b',{description:'Target',quantity:40,unit:'g',amount:1.6,unitPrice:0.04}),line('c',{description:'Safale',quantity:2,unit:'Stk',amount:6.8,unitPrice:3.4})]));
    const lines=state.transactions[0].finance.lines;
    expect(lines.map((item:any)=>[item.unit,item.quantity,item.unitPriceCents])).toEqual([['Kg',6,230],['g',40,4],['Stk',2,340]]);
  });
  it('un prix sans unité lisible n’est rattaché à rien',()=>{
    entry.savePurchase(draft('unit-absente-0001',[line('a',{quantity:6,unit:'',amount:13.8,unitPrice:2.3})]));
    expect(state.transactions[0].finance.lines[0].unitPriceCents).toBeUndefined();
  });
});

describe('D213 : mouture et prix, quantité et unité identiques sinon rien',()=>{
  const malt=line('l1',{description:'Maris Otter',quantity:6,unit:'Kg',amount:13.8,stockAction:'existing',stockRef:'MP-001'});
  const mouture=(more:Partial<PurchaseLineDraft>={})=>line('l2',{description:'Zuschlag Schrotung',kind:'service',quantity:6,unit:'Kg',amount:0.6,...more});
  it('6 Kg et 6000 g, ou 6 Kg et 6 g : aucune proposition (la conversion n’est pas une identité)',()=>{
    expect(entry.proposeMillingSurcharges([malt,mouture({quantity:6000,unit:'g'})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt,mouture({unit:'g'})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt,mouture({unit:''})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt,mouture({unit:'kg'})])).toEqual([{lineId:'l2',parentId:'l1'}]);
  });
  it('un lien écrit avec une autre unité est ignoré par le prix : le malt garde son unité imprimée « Kg »',()=>{
    const tx=(unit:string,quantity:number)=>({id:'TX-u',date:'27.04.2026',amountTTC:14.4,tvaRate:0,finance:{version:1,kind:'expense',amountCents:1440,lines:[
      {id:'l1',description:'Malt',kind:'ingredient',amountCents:1380,quantity:6,unit:'Kg',stockItemRef:'MP-001'},{id:'l2',description:'Schrotung',kind:'service',amountCents:60,quantity,unit,surchargeOfLineId:'l1'}]}}) as any;
    expect(latestBrewPrices([tx('g',6000)])['MP-001']).toMatchObject({amount:13.8,quantity:6,unit:'Kg'});
    expect(latestBrewPrices([tx('Kg',6)])['MP-001']).toMatchObject({amount:14.4,quantity:6,unit:'Kg'});
  });
  it('garde-fou : deux achats du même article en kg puis en g restent chacun dans leur unité, jamais mélangés',()=>{
    const buy=(id:string,date:string,cents:number,quantity:number,unit:string)=>({id,date,amountTTC:cents/100,tvaRate:0,finance:{version:1,kind:'expense',amountCents:cents,lines:[{id:'a',description:'Malt',kind:'ingredient',amountCents:cents,quantity,unit,stockItemRef:'MP-001'}]}}) as any;
    const prices=latestBrewPrices([buy('TX-1','01.03.2026',6000,25,'kg'),buy('TX-2','01.04.2026',500,500,'g')]);
    expect(prices['MP-001']).toMatchObject({amount:5,quantity:500,unit:'g'});
  });
});
