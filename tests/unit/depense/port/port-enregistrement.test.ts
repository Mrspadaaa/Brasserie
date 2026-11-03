// Voie port-total, P1 (D249, D258) : le port est une ligne `shipping` de `draft.lines`, puis une entrée `shipping` de `finance.lines`.
// Ces tests ÉPINGLENT ce que l'enregistrement fait déjà : le port n'entre jamais en stock, ne produit ni reçu ni mouvement, ne touche pas à la TVA.
// Ils passent sur HEAD (aucun code n'a été changé). Données fictives ; Gemini et Drive ne sont jamais appelés.
import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[],plans:[] as any[],paymentError:false,registered:false,confirm:vi.fn(),proofConfirm:vi.fn(),writeStatus:{status:'unknown',operationId:undefined as string|undefined}}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:state.registered}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(kind:any,item:any)=>state.writes.push(['stock',kind,item]),addEquipment:(item:any)=>state.writes.push(['equipment',item]),updateTransaction:(tx:any)=>state.writes.push(['update',tx])}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected',FirestoreRepo:{find:()=>undefined,documentWriteState:()=>state.writeStatus,waitForDocument:(...args:any[])=>state.confirm(...args),adjustNumber:(...args:any[])=>state.writes.push(['increment',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>{if(state.paymentError)throw new Error('Paiement invalide');},FinanceService:{getPlans:()=>state.plans,stageNewTransactionPayment:(tx:any,payment:any)=>{state.writes.push(['transaction',tx],['put','financialPayments',payment.id,payment]);state.transactions.push(tx);},recordPayment:()=>{throw new Error('La pièce neuve n’est pas encore présente dans le cache');}}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:()=>({id:'proof-test'}),saveFinanceDocumentConfirmed:(...args:any[])=>state.proofConfirm(...args)}));
import {savePurchase,validatePurchase,type PurchaseDraft,type PurchaseLineDraft} from '../../../../src/services/purchaseEntry';

const malt=(over:Partial<PurchaseLineDraft>={}):PurchaseLineDraft=>({id:'one',description:'Malt',kind:'ingredient',amount:100,quantity:500,unit:'g',stockAction:'existing',stockRef:'MP-001',equipmentAction:'none',...over});
const port=(over:Partial<PurchaseLineDraft>={}):PurchaseLineDraft=>({id:'two',description:'Transport',kind:'shipping',amount:10,unit:'',stockAction:'none',equipmentAction:'none',...over});
const brouillon=(id:string,over:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:id,date:'09.09.2025',vendor:'Brasseur fournisseur',invoiceNumber:'A123',description:'Achat pour la brasserie',category:'brassage',amount:110,lines:[malt(),port()],paymentStatus:'unpaid',paymentDate:'09.09.2025',paymentMethod:'bank',dueDate:'',sourceCurrency:'CHF',sourceVatAmount:8.1,sourceVatRate:.081,sourceNetAmount:101.9,...over});
const recus=()=>state.writes.filter(w=>w[0]==='put'&&w[1]==='movements'&&String(w[2]).startsWith('receipt-'));

beforeEach(()=>{state.transactions=[];state.writes=[];state.plans=[];state.paymentError=false;state.registered=false;state.proofConfirm.mockReset().mockResolvedValue(undefined);state.confirm.mockReset().mockResolvedValue(undefined);state.writeStatus={status:'unknown',operationId:undefined};state.stocks={rawMaterials:[{id:'malt',ref:'MP-001',name:'Malt',unit:'kg',currentStock:2}],cleaning:[],equipment:[{id:'eq',ref:'EQ-001',name:'Pompe'}]};});

describe('P1 n° 1 — une ligne de port s’écrit comme entrée `shipping`, sans stock ni mouvement',()=>{
  it('total 110,00 = malt 100,00 + port 10,00 ; le port n’a ni référence d’article, ni reçu, ni incrément de stock',()=>{
    savePurchase(brouillon('port-total-0001'));
    const finance=state.transactions[0].finance;
    expect(finance.amountCents).toBe(11000);
    expect(finance.lines.reduce((somme:number,l:any)=>somme+l.amountCents,0)).toBe(11000);
    const entrees=finance.lines.filter((l:any)=>l.kind==='shipping');
    expect(entrees).toHaveLength(1);
    expect(entrees[0]).toMatchObject({id:'two',amountCents:1000});
    expect(entrees[0].stockItemRef).toBeUndefined();expect(entrees[0].equipmentRef).toBeUndefined();
    expect(finance.lines.find((l:any)=>l.id==='one').stockItemRef).toBe('MP-001');
    expect(recus().map(w=>w[2])).toEqual(['receipt-port-total-0001-one']);
    expect(state.writes.filter(w=>w[0]==='increment')).toHaveLength(1);
    expect(state.writes.filter(w=>w[0]==='stock'||w[0]==='equipment')).toEqual([]);
  });
});

describe('P1 n° 2 et 3 — le port ne peut demander ni stock ni matériel : refusé, rien n’est écrit',()=>{
  it.each([['new'],['existing']])('stockAction %s sur le port',(action)=>{
    const value=brouillon(`port-stock-${action}-01`,{lines:[malt(),port({stockAction:action as any,stockRef:action==='existing'?'MP-001':undefined,quantity:1,unit:'pce'})]});
    expect(validatePurchase(value,state.stocks).join(' ')).toContain('ne peut pas entrer en stock');
    expect(()=>savePurchase(value)).toThrow('ne peut pas entrer en stock');
    expect(state.writes).toEqual([]);
  });
  it.each([['new'],['existing']])('equipmentAction %s sur le port',(action)=>{
    const value=brouillon(`port-matos-${action}-001`,{lines:[malt(),port({equipmentAction:action as any,equipmentRef:action==='existing'?'EQ-001':undefined})]});
    expect(validatePurchase(value,state.stocks).join(' ')).toContain('sélectionne matériel ou entretien');
    expect(()=>savePurchase(value)).toThrow('sélectionne matériel ou entretien');
    expect(state.writes).toEqual([]);
  });
});

describe('P1 n° 4 — un port sans montant ou négatif est refusé (le critère de l’écran en tient compte)',()=>{
  it('sans montant : « Chaque ligne doit avoir un libellé et un montant » ; à −10,00 : « Une remise est négative »',()=>{
    const sans=brouillon('port-sans-montant-1',{lines:[malt(),port({amount:undefined})]});
    expect(validatePurchase(sans,state.stocks).join(' ')).toContain('Chaque ligne doit avoir un libellé et un montant');
    const negatif=brouillon('port-negatif-00001',{lines:[malt(),port({amount:-10})],amount:90});
    expect(validatePurchase(negatif,state.stocks).join(' ')).toContain('Une remise est négative');
    expect(()=>savePurchase(sans)).toThrow();expect(state.writes).toEqual([]);
  });
});

describe('P1 n° 5 — la TVA ne dépend pas du port',()=>{
  it('même TTC, TVA et HT que le même brouillon où le port est un service',()=>{
    state.registered=true;
    savePurchase(brouillon('port-tva-shipping-01'));
    const avecPort=state.transactions[0];
    state.transactions=[];state.writes=[];
    savePurchase(brouillon('port-tva-service-001',{lines:[malt(),port({kind:'service'})]}));
    const service=state.transactions[0];
    expect(avecPort).toMatchObject({amountTTC:110,tvaAmount:8.1,amountHT:101.9});
    expect({ttc:avecPort.amountTTC,tva:avecPort.tvaAmount,ht:avecPort.amountHT}).toEqual({ttc:service.amountTTC,tva:service.tvaAmount,ht:service.amountHT});
  });
});

describe('P1 n° 6 — un document réduit à son port s’enregistre',()=>{
  it('une seule ligne `shipping` 12,50 pour un total de 12,50',()=>{
    const value=brouillon('port-seul-00000001',{amount:12.5,lines:[port({id:'port-1',description:'Port',amount:12.5})],sourceVatAmount:undefined,sourceVatRate:undefined,sourceNetAmount:undefined});
    expect(validatePurchase(value,state.stocks)).toEqual([]);
    savePurchase(value);
    expect(state.transactions[0].finance.lines).toHaveLength(1);
    expect(state.transactions[0].finance.lines[0]).toMatchObject({kind:'shipping',amountCents:1250});
  });
});

describe('P1 n° 7 — le port compte au plafond de 35 lignes',()=>{
  const lignes=(n:number)=>Array.from({length:n},(_,i)=>i===n-1?port({id:`l-${i}`,amount:1}):malt({id:`l-${i}`,description:`Article ${i}`,amount:1,quantity:undefined,unit:'',stockAction:'none',stockRef:undefined}));
  it('D379 : 35, 36 et 200 lignes dont le port : acceptées (plus de plafond de 35)',()=>{
    expect(validatePurchase(brouillon('port-plafond-35-001',{amount:35,lines:lignes(35)}),state.stocks)).toEqual([]);
    expect(validatePurchase(brouillon('port-plafond-36-001',{amount:36,lines:lignes(36)}),state.stocks)).toEqual([]);
    expect(validatePurchase(brouillon('port-plafond-200-001',{amount:200,lines:lignes(200)}),state.stocks)).toEqual([]);
  });
});

describe('P1 n° 8 — les centimes sont des entiers',()=>{
  it('0,10 + 0,05 = 0,15 ; 15 centimes écrits, somme des lignes égale au total',()=>{
    const value=brouillon('port-centimes-0001',{amount:0.15,lines:[malt({amount:0.1,quantity:undefined,unit:'',stockAction:'none',stockRef:undefined}),port({amount:0.05})],sourceVatAmount:undefined,sourceVatRate:undefined,sourceNetAmount:undefined});
    expect(validatePurchase(value,state.stocks)).toEqual([]);
    savePurchase(value);
    const finance=state.transactions[0].finance;
    expect(finance.amountCents).toBe(15);
    expect(finance.lines.reduce((somme:number,l:any)=>somme+l.amountCents,0)).toBe(15);
  });
});

describe('P1 n° 9 — un double clic n’écrit qu’une dépense',()=>{
  it('deux appels avec la même saisie : une transaction, un seul reçu',()=>{
    const value=brouillon('port-double-clic-01');
    const premier=savePurchase(value),second=savePurchase(value);
    expect(second).toBe(premier);
    expect(state.transactions).toHaveLength(1);expect(recus()).toHaveLength(1);
  });
});

describe('P1 n° 10 — la forme de l’entrée écrite pour le port (non-régression de `finance.lines`)',()=>{
  it('id, libellé, nature et montant gardés ; ni prix unitaire, ni mouture, ni référence',()=>{
    savePurchase(brouillon('port-forme-00000001'));
    const entree=state.transactions[0].finance.lines.find((l:any)=>l.kind==='shipping');
    expect(entree).toMatchObject({id:'two',description:'Transport',kind:'shipping',amountCents:1000});
    for(const cle of ['unitPriceCents','surchargeOfLineId','stockItemRef','equipmentRef','quantity','unit'])expect(entree[cle]).toBeUndefined();
    expect(state.transactions[0].finance.lines.map((l:any)=>l.id)).toEqual(['one','two']);
  });
});
