import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[],plans:[] as any[],paymentError:false,registered:false,confirm:vi.fn(),proofConfirm:vi.fn(),writeStatus:{status:'unknown',operationId:undefined as string|undefined}}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:state.registered}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(kind:any,item:any)=>state.writes.push(['stock',kind,item]),addEquipment:(item:any)=>state.writes.push(['equipment',item]),updateTransaction:(tx:any)=>state.writes.push(['update',tx])}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected',FirestoreRepo:{find:()=>undefined,documentWriteState:()=>state.writeStatus,waitForDocument:(...args:any[])=>state.confirm(...args),adjustNumber:(...args:any[])=>state.writes.push(['increment',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../src/services/financeService',()=>({validateFinancialPayment:()=>{if(state.paymentError)throw new Error('Paiement invalide');},FinanceService:{getPlans:()=>state.plans,stageNewTransactionPayment:(tx:any,payment:any)=>{state.writes.push(['transaction',tx],['put','financialPayments',payment.id,payment]);state.transactions.push(tx);},recordPayment:()=>{throw new Error('La pièce neuve n’est pas encore présente dans le cache');}}}));
vi.mock('../../src/services/financeDocuments',()=>({prepareFinanceDocument:()=>({id:'proof-test'}),saveFinanceDocumentConfirmed:(...args:any[])=>state.proofConfirm(...args)}));
import {savePurchase,savePurchaseWithProof,confirmPurchase,validatePurchase,purchaseDuplicates,purchaseDuplicateReasons,purchaseVendorKey,purchaseProofAttachable,attachProofToPurchase,type PurchaseDraft} from '../../src/services/purchaseEntry';
const draft=(id='purchase-test-0001'):PurchaseDraft=>({submissionId:id,date:'09.09.2025',vendor:'Brasseur fournisseur',invoiceNumber:'A123',description:'Achat pour la brasserie',category:'brassage',amount:110,lines:[{id:'one',description:'Malt',kind:'ingredient',amount:100,quantity:500,unit:'g',stockAction:'existing',stockRef:'MP-001',equipmentAction:'none'},{id:'two',description:'Transport',kind:'shipping',amount:10,unit:'',stockAction:'none',equipmentAction:'none'}],paymentStatus:'unpaid',paymentDate:'09.09.2025',paymentMethod:'bank',dueDate:'',sourceCurrency:'CHF',sourceVatAmount:8.1,sourceVatRate:.081,sourceNetAmount:101.9});
beforeEach(()=>{state.transactions=[];state.writes=[];state.plans=[];state.paymentError=false;state.registered=false;state.proofConfirm.mockReset().mockResolvedValue(undefined);state.confirm.mockReset().mockResolvedValue(undefined);state.writeStatus={status:'unknown',operationId:undefined};state.stocks={rawMaterials:[{id:'malt',ref:'MP-001',name:'Malt',unit:'kg',currentStock:2}],cleaning:[],equipment:[{id:'eq',ref:'EQ-001',name:'Pompe'}]};});
describe('Achat confirmé : une écriture et seulement les effets choisis',()=>{
  it('conserve les références et distingue le total calculé du total absent sur le document',()=>{
    const value=draft('purchase-source-metadata');
    Object.assign(value,{sourceDocumentType:'delivery_note',sourceOrderNumber:'ORDER-TEST',sourceTotalBasis:'line_sum',sourceAmount:undefined,scanModel:'gemini-3.8-flash'});
    value.lines[0].sourceReference='MALT-TEST';
    savePurchase(value);
    expect(state.transactions[0].finance).toMatchObject({sourceDocumentType:'delivery_note',sourceOrderNumber:'ORDER-TEST',sourceTotalBasis:'line_sum',sourceAmount:undefined,scanProvenance:{promptVersion:'invoice-v4'}});
    expect(state.transactions[0].finance.lines[0].sourceReference).toBe('MALT-TEST');
  });
  it('valide paiement et projet avant tout envoi Drive',async()=>{
    const value={...draft('purchase-proof-preflight'),proofDataUrl:'synthetic',proofFileName:'f.pdf',proofType:'application/pdf',paymentStatus:'paid' as const};
    state.paymentError=true;
    await expect(savePurchaseWithProof(value)).rejects.toThrow('Paiement invalide');
    state.paymentError=false;value.planId='missing-plan';
    await expect(savePurchaseWithProof(value)).rejects.toThrow('échéance valide');
    expect(state.proofConfirm).not.toHaveBeenCalled();expect(state.writes).toEqual([]);
  });
  it('attend Drive avant toute transaction et ne crée rien si l’envoi échoue',async()=>{
    const value={...draft('purchase-proof-network'),proofDataUrl:'synthetic',proofFileName:'f.pdf',proofType:'application/pdf'};
    state.proofConfirm.mockRejectedValueOnce(Object.assign(Error('Drive indisponible'),{code:'drive/auth-required'}));
    await expect(savePurchaseWithProof(value)).rejects.toThrow('Drive indisponible');
    expect(state.writes).toEqual([]);
    await savePurchaseWithProof(value);
    expect(state.proofConfirm).toHaveBeenCalledTimes(2);expect(state.transactions).toHaveLength(1);
    expect(state.transactions[0].finance.proofDocumentId).toBe('proof-test');
  });
  it('valide toutes les lignes avant la première mutation',()=>{
    const value=draft();value.lines[0].quantity=undefined;
    expect(()=>savePurchase(value)).toThrow('quantité');expect(state.writes).toEqual([]);
  });
  it('refuse unité incompatible et ligne livraison reçue en stock',()=>{
    const value=draft();value.lines[0].unit='sachet';value.lines[1].stockAction='new';
    const errors=validatePurchase(value,state.stocks);expect(errors.join(' ')).toContain('ne se convertit pas');expect(errors.join(' ')).toContain('ne peut pas entrer en stock');
  });
  it('garde le TTC exact sans assujettissement, conserve la TVA source, convertit le stock et ne paie pas une facture impayée',()=>{
    const value=draft('purchase-test-0002');savePurchase(value);
    expect(state.transactions[0]).toMatchObject({amountHT:110,amountTTC:110,tvaAmount:0,finance:{amountCents:11000,paymentStatus:'unpaid',sourceVatRate:.081,sourceVatAmount:8.1}});
    expect(state.writes.filter(w=>w[0]==='payment')).toEqual([]);expect(state.writes).toContainEqual(['increment','stockItems','MP-001','currentStock',.5]);
    expect(state.writes.filter(w=>w[0]==='put'&&w[1]==='movements')).toHaveLength(2);
  });
  it('un deuxième clic ne double ni la transaction ni la réception',()=>{
    const value=draft('purchase-test-0003');savePurchase(value);const count=state.writes.length;savePurchase(value);expect(state.writes).toHaveLength(count);expect(state.transactions).toHaveLength(1);
  });
  it('lie un équipement existant pour entretien sans créer un autre matériel',()=>{
    const value=draft('purchase-test-0004');value.lines=[{id:'repair',description:'Réparation pompe',kind:'maintenance',amount:110,unit:'',stockAction:'none',equipmentAction:'existing',equipmentRef:'EQ-001'}];savePurchase(value);
    expect(state.writes.some(w=>w[0]==='equipment')).toBe(false);expect(state.transactions[0].finance.lines[0]).toMatchObject({kind:'service',equipmentRef:'EQ-001'});
  });
  it('signale les doublons exacts de facture ou de document',()=>{
    const value=draft('purchase-test-0005');value.documentHash='abc';state.transactions=[{id:'old',date:value.date,amountTTC:12,description:'Facture existante',finance:{sourceDocumentHash:'abc'}}];
    expect(purchaseDuplicates(value,state.transactions)).toHaveLength(1);expect(()=>savePurchase(value)).toThrow('doublon');expect(state.writes).toEqual([]);
  });
  it('ne perd pas une remise et refuse une somme qui ne rejoint pas le TTC',()=>{
    const value=draft();value.lines.push({id:'rebate',description:'Rabais',kind:'discount',amount:-5,unit:'',stockAction:'none',equipmentAction:'none'});
    expect(validatePurchase(value,state.stocks).join(' ')).toContain('exactement');value.amount=105;expect(validatePurchase(value,state.stocks)).toEqual([]);
  });
  it('enregistre achat et paiement neuf dans le même lot sans exiger un cache déjà mis à jour',()=>{
    const value=draft('purchase-paid-0001');value.paymentStatus='paid';savePurchase(value);
    expect(state.writes).toContainEqual(['put','financialPayments','PAY-purchase-paid-0001',expect.objectContaining({transactionId:'TX-purchase-paid-0001',amountCents:11000,direction:'out'})]);
    expect(state.transactions[0].finance.paymentStatus).toBe('paid');
  });
  it('un paiement invalide ne laisse ni pièce, ni mouvement ni justificatif partiel',()=>{
    const value=draft('purchase-paid-invalid');value.paymentStatus='paid';value.proofDataUrl='test';state.paymentError=true;
    expect(()=>savePurchase(value)).toThrow('Paiement invalide');expect(state.writes).toEqual([]);
  });
  it('refuse une TVA supérieure au TTC et des fractions de centime',()=>{
    const value=draft('purchase-vat-invalid');state.registered=true;value.sourceVatAmount=120;
    expect(()=>savePurchase(value)).toThrow('TVA');expect(state.writes).toEqual([]);
    value.sourceVatAmount=8.1;value.amount=110.001;expect(validatePurchase(value,state.stocks).join(' ')).toContain('deux décimales');
  });
  it('lie seulement l’échéance réelle d’un plan de dépense actif',()=>{
    const value=draft('purchase-plan-invalid');state.plans=[{id:'loyer',date:'2025-01-31',status:'active',direction:'out',recurrence:{frequency:'monthly'}}];value.planId='loyer';value.occurrenceId='loyer:2025-02-27';
    expect(()=>savePurchase(value)).toThrow('échéance valide');expect(state.writes).toEqual([]);
    value.occurrenceId='loyer:2025-02-28';savePurchase(value);expect(state.transactions[0].finance.occurrenceId).toBe('loyer:2025-02-28');
  });
  it('réémet le même achat après rejet ciblé confirmé, sans rester verrouillé par submitted',async()=>{
    const value=draft('purchase-retry-rejected');savePurchase(value);const count=state.writes.length;
    state.writeStatus={status:'rejected',operationId:'attempt-1'};
    state.confirm.mockRejectedValueOnce({status:'rejected',path:`transactions/TX-${value.submissionId}`,operationId:'attempt-1'});
    await expect(confirmPurchase(value)).rejects.toMatchObject({status:'rejected'});
    state.transactions=[];savePurchase(value);expect(state.writes).toHaveLength(count*2);
    expect(state.transactions[0].id).toBe(`TX-${value.submissionId}`);
  });
  it('ne réémet jamais l’achat quand sa confirmation est seulement incertaine',async()=>{
    const value=draft('purchase-retry-timeout');savePurchase(value);const count=state.writes.length;
    state.confirm.mockRejectedValueOnce({status:'pending',path:`transactions/TX-${value.submissionId}`});await expect(confirmPurchase(value)).rejects.toMatchObject({status:'pending'});
    savePurchase(value);expect(state.writes).toHaveLength(count);
    await confirmPurchase(value);expect(state.confirm.mock.calls[1][0]).toBe('transactions');expect(state.confirm.mock.calls[1][1]).toBe(`TX-${value.submissionId}`);
  });
});

describe('JUS-1 : même achat vu ailleurs (B1), rattachement et hors ligne (M6)',()=>{
  // Facture enregistrée, puis son récapitulatif en ligne : fournisseur écrit autrement, sans numéro (données synthétiques).
  const recorded=(value:any={})=>({id:'TX-facture-banc',date:'09.09.2025',amountTTC:110,description:'Facture du Banc',finance:{kind:'expense',version:1,amountCents:11000,vendor:'Malterie du Banc S.à r.l.',invoiceNumber:'MB-77',recordedAt:new Date().toISOString(),lines:[{id:'a',description:'Malt',kind:'ingredient',amountCents:11000,sourceReference:'MB-MALT-01'}]},...value});
  const recap=(value:Partial<PurchaseDraft>={}):PurchaseDraft=>({...draft('recap-banc-0001'),vendor:'MALTERIE DU BANC',invoiceNumber:'',...value});
  const withRef=(reference:string,value:Partial<PurchaseDraft>={})=>recap({lines:[{...draft().lines[0],sourceReference:reference},draft().lines[1]],...value});
  it('normalise casse, accents, ponctuation et forme juridique du fournisseur',()=>{
    expect(['Malterie du Banc S.à r.l.','MALTERIE DU BANC','Maltérie du Banc SA','Malterie-du-Banc GmbH'].map(purchaseVendorKey)).toEqual(Array(4).fill('malterie du banc'));
    expect(purchaseVendorKey('Brasserie A')).toBe('brasserie a');
  });
  it('rapproche le récapitulatif : même total, date proche ou références d’articles communes sans date',()=>{
    state.transactions=[recorded()];
    expect(purchaseDuplicateReasons(recap(),state.transactions[0])).toEqual(['Même fournisseur et même total','Même date']);
    expect(purchaseDuplicateReasons(recap({date:'20.09.2025'}),state.transactions[0])).toEqual(['Même fournisseur et même total','11 jours d’écart']);
    expect(purchaseDuplicateReasons(withRef('mb-malt-01',{date:''}),state.transactions[0])).toEqual(['Même fournisseur et même total','1 référence d’article en commun','Date absente']);
  });
  it('ne rapproche ni un autre total, ni des dates éloignées, ni d’autres articles, ni un autre fournisseur',()=>{
    state.transactions=[recorded()];
    expect(purchaseDuplicates(recap({amount:110.05}),state.transactions)).toEqual([]);
    expect(purchaseDuplicates(recap({date:'30.09.2025'}),state.transactions)).toEqual([]);
    expect(purchaseDuplicates(withRef('MB-AUTRE',{date:''}),state.transactions)).toEqual([]);
    expect(purchaseDuplicates(withRef('MB-MALT-01',{date:'15.12.2025'}),state.transactions)).toEqual([]);
    expect(purchaseDuplicates(recap({vendor:'Moulin du Banc'}),state.transactions)).toEqual([]);
    expect(purchaseDuplicates(recap(),[recorded({finance:{...recorded().finance,voidedAt:'2025-09-10T00:00:00.000Z'}})])).toEqual([]);
    // Une vente au nom d'un client homonyme n'est pas un achat déjà enregistré.
    expect(purchaseDuplicates(recap(),[recorded({finance:{...recorded().finance,kind:'income'}})])).toEqual([]);
  });
  it('rattache le justificatif à la dépense sans original : aucune dépense, aucun stock, aucun paiement',async()=>{
    state.transactions=[recorded()];
    const value=recap({proofDataUrl:'synthetic',proofFileName:'recap.png',proofType:'image/png',documentHash:'f'.repeat(64)});
    await attachProofToPurchase(value,'TX-facture-banc');
    expect(state.proofConfirm).toHaveBeenCalledTimes(1);
    expect(state.writes.map(write=>write[0])).toEqual(['update']);
    expect(state.writes[0][1]).toMatchObject({id:'TX-facture-banc',amountTTC:110,finance:{proofDocumentId:'proof-test',sourceDocumentHash:'f'.repeat(64),invoiceNumber:'MB-77'}});
    expect(state.confirm).toHaveBeenCalledWith('transactions','TX-facture-banc',15000,expect.any(Function));
  });
  it('ne rattache ni un avoir ni un autre total',()=>{
    const proof={proofDataUrl:'synthetic',proofFileName:'recap.png',proofType:'image/png'};
    expect(purchaseProofAttachable(recap(proof),recorded())).toBe(true);
    expect(purchaseProofAttachable(recap({...proof,sourceDocumentType:'credit_note'}),recorded())).toBe(false);
    expect(purchaseProofAttachable(recap({...proof,invoiceNumber:'MB-77',vendor:'Malterie du Banc S.à r.l.',amount:99}),recorded())).toBe(false);
    expect(purchaseProofAttachable(recap(),recorded())).toBe(false);
  });
  it('ne remplace pas un original existant et n’écrit rien hors ligne',async()=>{
    const value=recap({proofDataUrl:'synthetic',proofFileName:'recap.png',proofType:'image/png'});
    state.transactions=[recorded({finance:{...recorded().finance,proofDocumentId:'proof-ancien'}})];
    await expect(attachProofToPurchase(value,'TX-facture-banc')).rejects.toThrow('Rien n’a été rattaché');
    state.transactions=[recorded()];
    state.proofConfirm.mockRejectedValueOnce(Object.assign(Error('Failed to get document because the client is offline.'),{code:'unavailable'}));
    await expect(attachProofToPurchase(value,'TX-facture-banc')).rejects.toThrow('Hors connexion');
    expect(state.proofConfirm).toHaveBeenCalledTimes(1);expect(state.writes).toEqual([]);
  });
  it('M6 : hors ligne, l’achat avec justificatif dit en français que rien n’est enregistré et quoi faire',async()=>{
    const value={...draft('purchase-offline-0001'),proofDataUrl:'synthetic',proofFileName:'f.pdf',proofType:'application/pdf'};
    state.proofConfirm.mockRejectedValueOnce(Object.assign(Error('Failed to get document because the client is offline.'),{code:'unavailable'}));
    await expect(savePurchaseWithProof(value)).rejects.toThrow(/^Hors connexion.*rien n’est enregistré.*réessaie une fois en ligne/);
    expect(state.writes).toEqual([]);
  });
});

describe('Correction V3 n° 1 : commande répétée, candidate la plus forte, fournisseur (B-V3-1, m-c)',()=>{
  // La malterie livre deux fois le même sac au même prix : deux factures, donc deux achats (données synthétiques).
  const swiss=(daysAgo:number)=>new Date(Date.now()-daysAgo*86_400_000).toISOString().slice(0,10).split('-').reverse().join('.');
  const bag=(sourceReference?:string)=>({id:'l1',description:'Malt Pils du Banc 25 kg',kind:'ingredient' as const,amount:84.6,quantity:25,unit:'kg',stockAction:'none' as const,equipmentAction:'none' as const,sourceReference});
  const order=(value:Partial<PurchaseDraft>={}):PurchaseDraft=>({...draft('commande-banc-0131'),date:'14.10.2025',vendor:'Malterie du Banc SA',invoiceNumber:'MB-131',description:'Commande du Banc',amount:84.6,lines:[bag('PIL-25')],proofDataUrl:'synthetic',proofFileName:'f.pdf',proofType:'application/pdf',documentHash:'b'.repeat(64),...value});
  const earlier=(value:any={},finance:any={})=>({id:'TX-commande-septembre',date:'15.09.2025',amountTTC:84.6,description:'Commande du Banc (septembre)',...value,
    finance:{kind:'expense',version:1,amountCents:8460,vendor:'Malterie du Banc SA',invoiceNumber:'MB-100',recordedAt:new Date().toISOString(),lines:[{id:'a',description:'Malt Pils du Banc',kind:'ingredient',amountCents:8460,sourceReference:'PIL-25'}],...finance}});
  it('deux n° de facture différents : ni rapprochement ni rattachement (cas A, B et C de la sonde)',()=>{
    expect(purchaseDuplicateReasons(order(),earlier())).toEqual([]);
    expect(purchaseProofAttachable(order(),earlier())).toBe(false);
    const noReference=earlier({date:'11.10.2025'},{lines:[{id:'a',description:'Malt',kind:'ingredient',amountCents:8460}]});
    expect(purchaseDuplicateReasons(order({lines:[bag()]}),noReference)).toEqual([]);
    // Cas C : la dépense de septembre a son original ; seul l'autre n° compte.
    expect(purchaseDuplicates(order(),[earlier({},{proofDocumentId:'proof-ancien'})])).toEqual([]);
    expect(validatePurchase(order(),state.stocks,[earlier()]).some(message=>message.includes('doublon'))).toBe(false);
  });
  it('n° égaux à la casse et à la ponctuation près, ou absent d’un côté : rapproché',()=>{
    expect(purchaseDuplicateReasons(order({invoiceNumber:'mb 100'}),earlier())).toEqual(['Même facture n° mb 100']);
    // Lecture « 1O0 » pour « 100 » : même n°, donc jamais un veto.
    expect(purchaseDuplicateReasons(order({invoiceNumber:'MB-1O0'}),earlier())).toEqual(['Même facture n° MB-1O0']);
    expect(purchaseDuplicateReasons(order({invoiceNumber:'MB.100',vendor:'MALTERIE DU BANC'}),earlier())).toEqual(['Même fournisseur et même total','1 référence d’article en commun','29 jours d’écart']);
    expect(purchaseDuplicateReasons(order({invoiceNumber:''}),earlier())).toEqual(['Même fournisseur et même total','1 référence d’article en commun','29 jours d’écart']);
    expect(purchaseDuplicateReasons(order(),earlier({},{invoiceNumber:undefined}))).toHaveLength(3);
    expect(purchaseProofAttachable(order(),earlier({},{invoiceNumber:undefined}))).toBe(true);
  });
  it('même fournisseur, même jour et même total mais autre n° : signalé, jamais rattachable',()=>{
    const sameDay=earlier({date:'14.10.2025'},{lines:[]});
    expect(purchaseDuplicateReasons(order(),sameDay)).toEqual(['Même fournisseur, même date et même total']);
    expect(purchaseProofAttachable(order(),sameDay)).toBe(false);
  });
  it('date absente avec références communes : seulement une dépense saisie ou datée depuis 60 jours au plus',()=>{
    const recap=order({invoiceNumber:'',date:''});
    expect(purchaseDuplicateReasons(recap,earlier())).toEqual(['Même fournisseur et même total','1 référence d’article en commun','Date absente']);
    expect(purchaseDuplicateReasons(recap,earlier({},{recordedAt:new Date(Date.now()-61*86_400_000).toISOString()}))).toEqual([]);
    // Sans heure de saisie (écriture ancienne), la date de la dépense fait foi.
    expect(purchaseDuplicateReasons(recap,earlier({},{recordedAt:undefined}))).toEqual([]);
    expect(purchaseDuplicateReasons(recap,earlier({date:swiss(10)},{recordedAt:undefined}))).toHaveLength(3);
  });
  it('plusieurs candidates : règle exacte d’abord, puis la plus proche en date (cas D)',()=>{
    const far=earlier({id:'TX-a-loin',date:'20.08.2025'}),near=earlier({id:'TX-b-proche',date:'13.10.2025'},{invoiceNumber:undefined});
    expect(purchaseDuplicates(order({invoiceNumber:''}),[far,near]).map(tx=>tx.id)).toEqual(['TX-b-proche','TX-a-loin']);
    const exact=earlier({id:'TX-c-meme-numero',date:'01.08.2025'},{invoiceNumber:'MB-131'});
    expect(purchaseDuplicates(order(),[near,exact]).map(tx=>tx.id)).toEqual(['TX-c-meme-numero','TX-b-proche']);
    // Entre règles exactes, la plus sûre d'abord : le même n° passe devant le même jour et total.
    const sameDay=earlier({id:'TX-d-meme-jour',date:'14.10.2025'},{invoiceNumber:'MB-120',lines:[]}),sameNumber=earlier({id:'TX-e-meme-numero',date:'10.10.2025'},{invoiceNumber:'MB-131'});
    expect(purchaseDuplicates(order(),[sameDay,sameNumber]).map(tx=>tx.id)).toEqual(['TX-e-meme-numero','TX-d-meme-jour']);
  });
  it('m-c : forme juridique retirée seulement en fin de nom',()=>{
    expect(purchaseVendorKey('Moulin Co Brasserie')).toBe('moulin co brasserie');
    expect(purchaseVendorKey('Malterie du Banc GmbH & Co. KG')).toBe('malterie du banc');
    expect(purchaseVendorKey('Hop & Co')).toBe('hop');
  });
});
