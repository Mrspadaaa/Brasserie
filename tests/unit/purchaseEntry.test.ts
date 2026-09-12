import {beforeEach,describe,it,expect,vi} from 'vitest';
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[],plans:[] as any[],paymentError:false,registered:false,confirm:vi.fn(),proofConfirm:vi.fn(),writeStatus:{status:'unknown',operationId:undefined as string|undefined}}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:state.registered}}),addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(kind:any,item:any)=>state.writes.push(['stock',kind,item]),addEquipment:(item:any)=>state.writes.push(['equipment',item])}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected',FirestoreRepo:{find:()=>undefined,documentWriteState:()=>state.writeStatus,waitForDocument:(...args:any[])=>state.confirm(...args),adjustNumber:(...args:any[])=>state.writes.push(['increment',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../src/services/financeService',()=>({validateFinancialPayment:()=>{if(state.paymentError)throw new Error('Paiement invalide');},FinanceService:{getPlans:()=>state.plans,stageNewTransactionPayment:(tx:any,payment:any)=>{state.writes.push(['transaction',tx],['put','financialPayments',payment.id,payment]);state.transactions.push(tx);},recordPayment:()=>{throw new Error('La pièce neuve n’est pas encore présente dans le cache');}}}));
vi.mock('../../src/services/financeDocuments',()=>({prepareFinanceDocument:()=>({id:'proof-test'}),saveFinanceDocumentConfirmed:(...args:any[])=>state.proofConfirm(...args)}));
import {savePurchase,savePurchaseWithProof,confirmPurchase,validatePurchase,purchaseDuplicates,type PurchaseDraft} from '../../src/services/purchaseEntry';
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
