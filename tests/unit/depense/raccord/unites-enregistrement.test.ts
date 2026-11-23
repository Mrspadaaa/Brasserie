import {beforeEach,describe,it,expect,vi} from 'vitest';
/**
 * Voie r1-raccord, R5 à R7 : ce que l'appariement de s1 relie s'enregistre, avec la même table d'unités.
 * D213 : l'unité imprimée reste celle de la ligne de la dépense ; le mouvement de stock s'écrit dans l'unité de l'article.
 * D214 : une unité illisible n'entre jamais en stock. Drive et Firestore simulés, aucune donnée réelle.
 */
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[]}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(type:string,item:any)=>{state.writes.push(['stock',type,item]);},addEquipment:()=>undefined,updateTransaction:()=>undefined}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:async()=>undefined,adjustNumber:(...args:any[])=>state.writes.push(['adjust',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[],stageNewTransactionPayment:(tx:any)=>{state.writes.push(['transaction',tx]);}}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string)=>({id}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import {matchStockLine,formatUnitLink} from '../../../../src/services/stockLineMatching';
import lignes372765 from '../stock/fixtures/lignes-372765.json';
import type {PurchaseDraft,PurchaseLineDraft} from '../../../../src/services/purchaseEntry';

const item=(ref:string,name:string,category:string|undefined,unit:string)=>({id:ref,ref,name,category,unit,currentStock:10,minStock:0,reorder:false}) as any;
const line=(id:string,more:Partial<PurchaseLineDraft>):PurchaseLineDraft=>({id,description:id,kind:'ingredient',amount:1,quantity:1,unit:'Kg',stockAction:'existing',equipmentAction:'none',...more});
let counter=0;
const draft=(lines:PurchaseLineDraft[]):PurchaseDraft=>({submissionId:`r1-unites-${String(++counter).padStart(5,'0')}`,date:'27.04.2026',vendor:'F',invoiceNumber:'1',description:'Achat',category:'brassage',amount:Math.round(lines.reduce((sum,entryLine)=>sum+(entryLine.amount??0)*100,0))/100,lines,paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF'});
const receipts=()=>state.writes.filter(w=>w[0]==='put'&&w[3]?.type==='receipt').map(w=>w[3]);
const adjusts=()=>state.writes.filter(w=>w[0]==='adjust');
const savedLines=()=>state.writes.find(w=>w[0]==='transaction')![1].finance.lines;
beforeEach(()=>{state.transactions=[];state.writes=[];state.stocks={rawMaterials:[],cleaning:[],equipment:[]};});
const withStock=(...items:any[])=>{state.stocks={rawMaterials:items,cleaning:[],equipment:[]};};

describe('R5 : Stk face à un sachet de levure, 1 pour 1',()=>{
  const stk=(lignes372765 as any).lignes.filter((l:any)=>l.unite==='Stk');
  it('la facture 372765 : ses 4 lignes « Stk » (Windsor, BE-256, US-05, Verdant) s’enregistrent en sachets, jamais en grammes',()=>{
    expect(stk.map((l:any)=>l.libelle)).toHaveLength(4);
    withStock(...stk.map((l:any,i:number)=>item(`Y${i}`,`Levure ${i}`,'Levure','sachet')));
    const lines=stk.map((l:any,i:number)=>line(`s${i}`,{description:l.libelle,quantity:l.quantite,unit:l.unite,stockRef:`Y${i}`}));
    const value=draft(lines);
    expect(entry.validatePurchase(value,state.stocks as any)).toEqual([]);
    entry.savePurchase(value);
    expect(receipts().map(r=>[r.quantity,r.unit])).toEqual(stk.map((l:any)=>[l.quantite,'sachet']));
    expect(adjusts().map(a=>[a[3],a[4]])).toEqual(stk.map((l:any)=>['currentStock',l.quantite]));
    expect(savedLines().map((l:any)=>[l.unit,l.quantity])).toEqual(stk.map((l:any)=>['Stk',l.quantite]));
  });
  it('Stk face à un malt en kg, un houblon en g ou un malt en sachets : refus',()=>{
    withStock(item('M','Maris Otter','Malt','kg'),item('H','Cascade','Houblon','g'),item('S','Pilsner','Malt','sachet'));
    for(const ref of ['M','H','S']) expect(entry.validatePurchase(draft([line('a',{description:'Produit',unit:'Stk',quantity:2,stockRef:ref})]),state.stocks as any).join(' '),ref).toContain('ne se convertit pas');
  });
  it('« Sachets » face à « sachet », et « Stk » face à « pce »',()=>{
    withStock(item('Y','Levure','Levure','sachet'),item('P','Etiquettes','Emballage','pce'));
    expect(entry.validatePurchase(draft([line('a',{description:'Levure',unit:'Sachets',quantity:3,stockRef:'Y',kind:'ingredient'})]),state.stocks as any)).toEqual([]);
    expect(entry.validatePurchase(draft([line('b',{description:'Etiquettes',unit:'Stk',quantity:3,stockRef:'P',kind:'packaging'})]),state.stocks as any)).toEqual([]);
  });
  it('une levure en grammes face à un article en sachets : refus comme aujourd’hui, jamais convertie',()=>{
    withStock(item('Y','Safale US-05','Levure','sachet'));
    expect(entry.validatePurchase(draft([line('a',{description:'Safale US-05',unit:'g',quantity:500,stockRef:'Y'})]),state.stocks as any).join(' ')).toContain('ne se convertit pas');
  });
  it('un article sans catégorie : Stk face à un sachet refusé',()=>{
    withStock(item('Y','Safale US-05',undefined,'sachet'));
    expect(entry.validatePurchase(draft([line('a',{description:'Safale US-05',unit:'Stk',quantity:2,stockRef:'Y'})]),state.stocks as any).join(' ')).toContain('ne se convertit pas');
  });
  it('poids du libellé : « Safale US-05 500 g » 2 Stk refusé, « 11,5 g » accepté, un poids différent de celui de l’article refusé',()=>{
    withStock(item('Y','Safale US-05','Levure','sachet'),item('Z','Safale US-05 11 g','Levure','sachet'));
    const errors=(description:string,ref:string)=>entry.validatePurchase(draft([line('a',{description,unit:'Stk',quantity:2,stockRef:ref})]),state.stocks as any);
    expect(errors('Safale US-05 500 g','Y').join(' ')).toContain('ne se convertit pas');
    expect(errors('Safale US-05 11,5 g','Y')).toEqual([]);
    expect(errors('Safale US-05 11,5 g','Z').join(' ')).toContain('ne se convertit pas');
    expect(errors('Safale US-05 11 g','Z')).toEqual([]);
    expect(()=>entry.savePurchase(draft([line('a',{description:'Safale US-05 500 g',unit:'Stk',quantity:2,stockRef:'Y'})]))).toThrow();
    expect(state.writes).toEqual([]);
  });
});

describe('R6 : les écritures d’unité de s1 (linkUnit) s’enregistrent, la quantité convertie est exacte',()=>{
  it.each([
    ['Maris Otter','Malt','g','Kilo',6,6000],
    ['Cascade','Houblon','kg','Kg.',2,2],
    ['Gerstenflocken','Malt','g','Kilogramm',1,1000],
    ['Sirop','Sucre','ml','Liter',3,3000],
    ['Acide','Additif','L','litres',2,2],
    ['Acide','Additif','L','Litre',2,2],
    ['Malt','Malt','g','Kilo',1.15,1150],
    ['Malt','Malt','g','Kilo',0.001,1],
    ['Malt','Malt','kg','g',1,0.001]
  ])('%s (%s, article en %s) : %s × %s → %s',(name,category,itemUnit,lineUnit,quantity,expected)=>{
    withStock(item('A',name,category,itemUnit));
    const value=draft([line('a',{description:name,unit:lineUnit,quantity,stockRef:'A'})]);
    expect(entry.validatePurchase(value,state.stocks as any)).toEqual([]);
    entry.savePurchase(value);
    expect(receipts()[0].quantity).toBe(expected);expect(receipts()[0].unit).toBe(itemUnit);
    expect(adjusts()[0][4]).toBe(expected);
    expect(savedLines()[0].unit).toBe(lineUnit);expect(savedLines()[0].quantity).toBe(quantity);
  });
  it('une autre famille reste refusée : litre face à un grain en g, Stk face à un houblon en g, kg face à un sachet',()=>{
    withStock(item('G','Malt','Malt','g'),item('H','Cascade','Houblon','g'),item('S','Levure','Levure','sachet'));
    const refused=(unit:string,ref:string)=>entry.validatePurchase(draft([line('a',{description:'Produit',unit,quantity:2,stockRef:ref})]),state.stocks as any).join(' ');
    expect(refused('Liter','G')).toContain('ne se convertit pas');
    expect(refused('Stk','H')).toContain('ne se convertit pas');
    expect(refused('kg','S')).toContain('ne se convertit pas');
  });
  it('un nouvel article « 6 Kilo » prend l’unité kg ; la ligne de la dépense garde « Kilo » (D213)',()=>{
    const value=draft([line('a',{description:'Maris Otter',unit:'Kilo',quantity:6,stockAction:'new'})]);
    expect(entry.validatePurchase(value,state.stocks as any)).toEqual([]);
    entry.savePurchase(value);
    const created=state.writes.find(w=>w[0]==='stock')![2];
    expect([created.unit,created.currentStock]).toEqual(['kg',6]);
    expect(savedLines()[0].unit).toBe('Kilo');
  });
  it('un nouvel article garde une unité lisible telle quelle (« Kg », « L », « Stk », « sachet »)',()=>{
    for(const unit of ['Kg','L','Stk','sachet']){
      state.writes=[];state.transactions=[];
      entry.savePurchase(draft([line(`n${unit}`,{description:'Produit',unit,quantity:2,stockAction:'new'})]));
      expect(state.writes.find(w=>w[0]==='stock')![2].unit,unit).toBe(unit);
    }
  });
  it('parité : l’écran dit (formatUnitLink) la quantité que l’enregistrement écrit (stockQuantityFor)',()=>{
    const cases:Array<[string,number,string,string,string]>=[['Kilo',6,'g','Malt','Maris Otter'],['Kg.',2,'kg','Houblon','Cascade'],['Kilogramm',1,'g','Malt','Gerstenflocken'],['Liter',3,'ml','Additif','Sirop'],['litres',2,'L','Additif','Acide'],['Kilo',1.15,'g','Malt','Malt'],['Stk',2,'sachet','Levure','Safale US-05'],['Sachets',3,'sachet','Levure','Safale US-05']];
    for(const [unit,quantity,itemUnit,category,name] of cases){
      const result=entry.stockQuantityFor({description:name,quantity,unit},{name,unit:itemUnit,category}) as any;
      expect(result.ok,`${quantity} ${unit}`).toBe(true);
      const said=formatUnitLink(quantity,unit,itemUnit,category);
      if(said===undefined){expect(result.quantity).toBe(quantity);continue;}
      const right=said.split(/ [→=] /)[1].split(' ').slice(0,-1).join('').replace(',','.');
      expect(Number(right),said).toBe(result.quantity);
    }
  });
});

describe('R7 : D214, une unité illisible n’entre jamais en stock',()=>{
  it.each(['','-','n/a'])('une ligne proposée par matchStockLine avec l’unité « %s » : « unité à préciser », le nom de la ligne, aucune écriture',unit=>{
    const maris=item('MO','Maris Otter','Malt','kg');
    const match=matchStockLine({description:'Maris Otter',unit,quantity:6,vendor:''},[maris]);
    expect(match?.item.ref).toBe('MO');expect(match?.unitMissing).toBe(true);
    withStock(maris);
    const value=draft([line('a',{description:'Maris Otter',unit,quantity:6,stockRef:match!.item.ref})]);
    const errors=entry.validatePurchase(value,state.stocks as any);
    expect(errors.some(message=>message.includes('Maris Otter')&&message.includes('unité à préciser'))).toBe(true);
    expect(errors.join(' ')).not.toContain('ne se convertit pas');
    expect(errors.filter(message=>message.includes('Maris Otter'))).toHaveLength(1);
    expect(()=>entry.savePurchase(value)).toThrow('unité à préciser');
    expect(state.writes).toEqual([]);
  });
  it('un nouvel article à l’unité illisible est refusé aussi (son unité serait « - »)',()=>{
    for(const unit of ['','-','n/a','?']){
      const errors=entry.validatePurchase(draft([line('a',{description:'Produit',unit,quantity:2,stockAction:'new'})]),state.stocks as any);
      expect(errors.join(' '),`« ${unit} »`).toContain('unité à préciser');
    }
  });
  it('une quantité absente garde son message d’aujourd’hui',()=>{
    withStock(item('MO','Maris Otter','Malt','kg'));
    expect(entry.validatePurchase(draft([line('a',{description:'Maris Otter',unit:'kg',quantity:undefined,stockRef:'MO'})]),state.stocks as any).join(' ')).toContain('quantité');
  });
  it('le prix unitaire n’est rattaché à aucune unité illisible ; un prix à l’unité lisible est écrit en centimes',()=>{
    entry.savePurchase(draft([line('a',{stockAction:'none',description:'Malt',unit:'Kg',quantity:6,amount:13.8,unitPrice:2.3}),line('b',{stockAction:'none',description:'Truc',unit:'-',quantity:2,amount:4.6,unitPrice:2.3})]));
    expect(savedLines().map((l:any)=>l.unitPriceCents)).toEqual([230,undefined]);
  });
});

describe('stockQuantityFor : la règle commune',()=>{
  const q=(unit:string,quantity:number,target:{unit:string;category?:string;name?:string},description='Produit')=>entry.stockQuantityFor({description,quantity,unit},{name:target.name??'Article',unit:target.unit,category:target.category}) as any;
  it('même unité : aucune conversion ; conversion exacte ; pièce 1 pour 1 ; illisible ; incompatible',()=>{
    expect(q('kg',6,{unit:'kg'})).toMatchObject({ok:true,quantity:6,via:'same'});
    expect(q('Kilo',6,{unit:'g'})).toMatchObject({ok:true,quantity:6000,via:'conversion'});
    expect(q('Stk',2,{unit:'sachet',category:'levure'})).toMatchObject({ok:true,quantity:2,via:'piece'});
    expect(q('-',2,{unit:'g'})).toEqual({ok:false,reason:'unreadable'});
    expect(q('Stk',2,{unit:'g',category:'Houblon'})).toEqual({ok:false,reason:'incompatible'});
  });
  it('une quantité positive ne tombe jamais à zéro (1 mg → 0,000001 kg, 1 g → 0,001 kg)',()=>{
    expect(q('mg',1,{unit:'kg'})).toMatchObject({ok:true,quantity:0.000001});
    expect(q('g',1,{unit:'kg'})).toMatchObject({ok:true,quantity:0.001});
  });
});

describe('R5, relecture n° 1 à 3 : dans le doute, Stk face à un sachet est refusé',()=>{
  const errors=(description:string,itemName:string,quantity=2)=>{
    withStock(item('Y',itemName,'Levure','sachet'));
    return entry.validatePurchase(draft([line('a',{description,unit:'Stk',quantity,stockRef:'Y'})]),state.stocks as any);
  };
  const refused=(description:string,itemName='Safale US-05',quantity=2)=>expect(errors(description,itemName,quantity).join(' '),description).toContain('ne se convertit pas');
  it('n° 1 : une mesure en kg dans le libellé (« 0,5 kg », « 1 kg ») n’est pas un poids de sachet : refus',()=>{
    refused('Safale US-05 0,5 kg');refused('Safale US-05 1 kg');refused('Safale US-05 1kg');refused('Safale US-05 0.5 l');
  });
  it('n° 2 : un conditionnement multiple (« 10 x 11,5 g », « 11,5 g x10 ») n’est pas 1 pour 1 : refus',()=>{
    refused('Safale US-05 10 x 11,5 g',undefined,1);refused('Safale US-05 11,5 g x10',undefined,1);refused('Safale US-05 10x11,5g',undefined,1);refused('Safale US-05 11,5 g × 10',undefined,1);
  });
  it('témoins : « 11,5 g », « 11g » et un libellé sans mesure restent acceptés',()=>{
    expect(errors('Safale US-05 11,5 g','Safale US-05')).toEqual([]);
    expect(errors('LALLEMAND Windsor 11g','Windsor')).toEqual([]);
    expect(errors('Safale US-05','Safale US-05')).toEqual([]);
    expect(errors('Safale US-05 (Abbaye) BE-256','Safale US-05')).toEqual([]);
  });
  it('n° 3 : une ligne sans poids face à un article au poids connu : refus (même règle que l’appariement, stockLineMatching.ts:193-201)',()=>{
    refused('Safale US-05','Safale US-05 500 g');
    refused('Safale US-05','Safale US-05 11,5 g');
    expect(errors('Safale US-05 11,5 g','Safale US-05 11,5 g')).toEqual([]);
  });
  it('le refus empêche toute écriture',()=>{
    withStock(item('Y','Safale US-05','Levure','sachet'));
    expect(()=>entry.savePurchase(draft([line('a',{description:'Safale US-05 0,5 kg',unit:'Stk',quantity:2,stockRef:'Y'})]))).toThrow('ne se convertit pas');
    expect(state.writes).toEqual([]);
  });
});
