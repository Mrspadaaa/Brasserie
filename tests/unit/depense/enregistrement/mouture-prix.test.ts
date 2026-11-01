import {beforeEach,describe,it,expect,vi} from 'vitest';
// Voie s2-enregistrement : S5 (la mouture est proposée, puis rattachée au geste du brasseur) et S7 (le prix du malt suit les lignes liées).
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[]}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(kind:any,item:any)=>state.writes.push(['stock',kind,item]),addEquipment:(item:any)=>state.writes.push(['equipment',item]),updateTransaction:(tx:any)=>state.writes.push(['update',tx])}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:async()=>undefined,adjustNumber:(...args:any[])=>state.writes.push(['increment',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:()=>undefined}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string)=>({id}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import {latestBrewPrices,weightedBrewPrices} from '../../../../src/domain/finance/brewBudget';
import type {PurchaseDraft,PurchaseLineDraft} from '../../../../src/services/purchaseEntry';

beforeEach(()=>{state.transactions=[];state.writes=[];state.stocks={rawMaterials:[{id:'malt',ref:'MP-001',name:'Maris Otter',unit:'kg',currentStock:10,category:'Malt'}],cleaning:[],equipment:[]};});

const line=(id:string,more:Partial<PurchaseLineDraft>):PurchaseLineDraft=>({id,description:id,kind:'ingredient',amount:1,quantity:1,unit:'Kg',stockAction:'none',equipmentAction:'none',...more});
const malt=(more:Partial<PurchaseLineDraft>={})=>line('l1',{description:'Maris Otter, Kg',amount:13.8,quantity:6,unit:'Kg',stockAction:'existing',stockRef:'MP-001',unitPrice:2.3,...more});
const mouture=(more:Partial<PurchaseLineDraft>={})=>line('l2',{description:'Zuschlag Schrotung',kind:'service',amount:0.6,quantity:6,unit:'Kg',sourceReference:'ISHOP-SCHROT',...more});
const draft=(id:string,lines:PurchaseLineDraft[]):PurchaseDraft=>({submissionId:id,date:'27.04.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',description:'Achat',
  category:'brassage',amount:Math.round(lines.reduce((sum,item)=>sum+item.amount*100,0))/100,lines,paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF'});

describe('S5 : la mouture est proposée au malt juste au-dessus, jamais liée sans geste',()=>{
  it('propose le lien, sans toucher aux lignes ; le geste du brasseur le pose',()=>{
    const lines=[malt(),mouture()];const copy=JSON.stringify(lines);
    expect(entry.proposeMillingSurcharges(lines)).toEqual([{lineId:'l2',parentId:'l1'}]);
    expect(JSON.stringify(lines)).toBe(copy);
    const confirmed=entry.confirmMillingSurcharge(lines,'l2');
    expect(confirmed[1].surchargeOf).toBe('l1');expect(confirmed[0].surchargeOf).toBeUndefined();
    expect(entry.confirmMillingSurcharge(lines,'l1')).toEqual(lines);
  });
  it('lit les trois paires de la facture (6 Kg, 1 Kg, 5 Kg) et laisse le malt sans mouture tranquille',()=>{
    const lines=[malt(),mouture(),line('l3',{description:'Gerstenflocken',quantity:1,amount:2.4}),line('l4',{description:'Röstgerste',quantity:1,amount:1.8}),
      line('l5',{description:'Zuschlag Schrotung',kind:'service',quantity:1,amount:0.1,sourceReference:'ISHOP-SCHROT'})];
    expect(entry.proposeMillingSurcharges(lines)).toEqual([{lineId:'l2',parentId:'l1'},{lineId:'l5',parentId:'l4'}]);
  });
  it('aucun lien : mot de mouture absent, autre quantité, autre unité, quantité absente, ligne entre les deux, première ligne, deuxième mouture',()=>{
    expect(entry.proposeMillingSurcharges([malt(),mouture({description:'Zuschlag Transport',sourceReference:undefined})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt(),mouture({quantity:5})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt(),mouture({unit:'g'})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt({quantity:undefined}),mouture({quantity:undefined})])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt(),line('rem',{kind:'discount',amount:-1,quantity:undefined}),mouture()])).toEqual([]);
    expect(entry.proposeMillingSurcharges([mouture(),malt()])).toEqual([]);
    expect(entry.proposeMillingSurcharges([malt(),mouture(),mouture({id:'l3'})])).toEqual([{lineId:'l2',parentId:'l1'}]);
    expect(entry.proposeMillingSurcharges([line('p',{kind:'packaging',quantity:6,unit:'Kg'}),mouture()])).toEqual([]);
  });
  it('reconnaît le mot de mouture en français, allemand et anglais, sans accent ni casse',()=>{
    for(const description of ['Mouture','Moulage du malt','Schrotung','schroten','Crushing service','Milling']) expect(entry.isMillingSurcharge({kind:'service',description})).toBe(true);
    expect(entry.isMillingSurcharge({kind:'service',description:'Frais de port'})).toBe(false);
    expect(entry.isMillingSurcharge({kind:'shipping',description:'Mouture'})).toBe(false);
  });
  it('enregistrée avec le lien confirmé : la mouture ne crée ni article ni mouvement de stock',()=>{
    const lines=entry.confirmMillingSurcharge([malt(),mouture()],'l2');
    entry.savePurchase(draft('s5-mouture-00001',lines));
    expect(state.writes.filter(w=>w[0]==='stock')).toEqual([]);
    expect(state.writes.filter(w=>w[0]==='put'&&String(w[2]).includes('-l2'))).toEqual([]);
    expect(state.writes.filter(w=>w[0]==='increment')).toHaveLength(1);
    const saved=state.transactions[0].finance.lines;
    expect(saved[1]).toMatchObject({kind:'service',amountCents:60,surchargeOfLineId:'l1'});expect(saved[1].stockItemRef).toBeUndefined();
  });
  it('sans geste, rien n’est écrit sur la dépense ; un lien rompu après coup (quantité changée) n’est pas écrit',()=>{
    entry.savePurchase(draft('s5-sans-geste-001',[malt(),mouture()]));
    expect(state.transactions[0].finance.lines.some((item:any)=>item.surchargeOfLineId)).toBe(false);
    state.transactions=[];state.writes=[];
    const rompu=entry.confirmMillingSurcharge([malt(),mouture()],'l2');rompu[0]={...rompu[0],quantity:7,amount:16.1,unitPrice:2.3};
    entry.savePurchase(draft('s5-rompu-0000001',rompu));
    expect(state.transactions[0].finance.lines.some((item:any)=>item.surchargeOfLineId)).toBe(false);
  });
});

describe('S7 : le prix d’un article suit les lignes liées, mouture comprise, rien d’inventé',()=>{
  const prices=(lines:PurchaseLineDraft[],id:string)=>{entry.savePurchase(draft(id,lines));return latestBrewPrices(state.transactions);};
  it('Maris Otter : 14,40 CHF pour 6 kg avec la mouture confirmée (2,40 CHF/kg), 13,80 sans (2,30 CHF/kg)',()=>{
    const sans=prices([malt(),mouture()],'s7-sans-lien-0001');
    expect(sans['MP-001']).toMatchObject({amount:13.8,quantity:6,unit:'Kg'});expect(sans['MP-001'].note).not.toContain('mouture');
    state.transactions=[];state.writes=[];
    const avec=prices(entry.confirmMillingSurcharge([malt(),mouture()],'l2'),'s7-avec-lien-0001');
    expect(avec['MP-001']).toMatchObject({amount:14.4,quantity:6,unit:'Kg'});
    expect(avec['MP-001'].amount/avec['MP-001'].quantity).toBeCloseTo(2.4,10);
    expect(avec['MP-001'].note).toContain('mouture comprise');
  });
  it('pas de prix pour une ligne sans lien : mouture sans parent lié, parent non lié à un article, service seul',()=>{
    expect(prices(entry.confirmMillingSurcharge([malt({stockAction:'none',stockRef:undefined}),mouture()],'l2'),'s7-parent-non-lie-1')).toEqual({});
    state.transactions=[];state.writes=[];
    expect(prices([mouture(),line('l3',{description:'Port',kind:'shipping',quantity:undefined,amount:5})],'s7-service-seul-001')).toEqual({});
  });
  it('ignore un lien écrit à la main qui ne tient pas : autre quantité, autre unité, montant nul, pas un service',()=>{
    const tx=(second:Record<string,unknown>)=>({id:'TX-x',date:'27.04.2026',amountTTC:14.4,tvaRate:0,finance:{version:1,kind:'expense',amountCents:1440,vendor:'F',lines:[
      {id:'l1',description:'Malt',kind:'ingredient',amountCents:1380,quantity:6,unit:'Kg',stockItemRef:'MP-001'},{id:'l2',description:'Zuschlag Schrotung',kind:'service',amountCents:60,quantity:6,unit:'Kg',surchargeOfLineId:'l1',...second}]}}) as any;
    for(const cas of [{quantity:5},{unit:'g'},{amountCents:0},{kind:'shipping'}]) expect(latestBrewPrices([tx(cas)])['MP-001'].amount).toBe(13.8);
    expect(latestBrewPrices([tx({})])['MP-001'].amount).toBe(14.4);
  });
  it('la moyenne pondérée de la valeur de stock compte aussi la mouture liée',()=>{
    entry.savePurchase(draft('s7-pondere-000001',entry.confirmMillingSurcharge([malt(),mouture()],'l2')));
    const weighted=weightedBrewPrices(state.transactions,state.stocks.rawMaterials as any);
    expect(weighted['MP-001']).toMatchObject({amount:14.4,quantity:6});
  });
  it('garde-fou : une dépense écrite avant la correction (aucun champ nouveau) garde exactement son prix',()=>{
    const old={id:'TX-ancien',date:'01.09.2026',amountTTC:60,tvaRate:0,finance:{version:1,kind:'expense',amountCents:6000,lines:[{id:'a',description:'Pils',kind:'ingredient',amountCents:6000,quantity:25,unit:'kg',stockItemRef:'MP-001'}]}} as any;
    expect(latestBrewPrices([old])['MP-001']).toMatchObject({amount:60,quantity:25,unit:'kg'});
  });
});
