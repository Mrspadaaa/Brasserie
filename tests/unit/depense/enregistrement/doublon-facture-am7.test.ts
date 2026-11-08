import {beforeEach,describe,it,expect,vi} from 'vitest';
// AM n° 7 (audit métier 08.11) : une facture s'identifie par (fournisseur normalisé, n°) ou par sa référence QR, quel que soit le total ;
// les doublons DÉJÀ au grand livre (B-001 à B-026 « Cmd 686863 », même commande que la facture 372765) sont signalés, jamais supprimés.
const state=vi.hoisted(()=>({stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]}}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>[],getConfig:()=>({fiscal:{isTvaRegistered:false}})}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined}}));
vi.mock('../../../../src/services/financeService',()=>({validateFinancialPayment:()=>undefined,FinanceService:{getPlans:()=>[]}}));
vi.mock('../../../../src/services/financeDocuments',()=>({prepareFinanceDocument:(id:string)=>({id}),saveFinanceDocumentConfirmed:async()=>undefined}));
import * as entry from '../../../../src/services/purchaseEntry';
import type {PurchaseDraft} from '../../../../src/services/purchaseEntry';
import {ledgerDuplicates,ledgerDuplicateIds} from '../../../../src/domain/finance/duplicates';

beforeEach(()=>{state.stocks={rawMaterials:[],cleaning:[],equipment:[]};});

const recorded=(finance:Record<string,unknown>={},tx:Record<string,unknown>={})=>({id:'TX-372765',date:'30.04.2026',amountTTC:86.5,description:'Brau- und Rauchshop',
  finance:{version:1,kind:'expense',amountCents:8650,vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',sourceOrderNumber:'Onlinebestellung-686863',recordedAt:'2026-04-30T10:00:00.000Z',lines:[],...finance},...tx}) as any;
const draft=(more:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:'nouvelle-0001',date:'12.06.2026',vendor:'Brau- und Rauchshop GmbH',invoiceNumber:'372765',description:'Achat',category:'brassage',amount:86.5,
  lines:[],paymentStatus:'unpaid',paymentMethod:'bank',paymentDate:'',dueDate:'',sourceCurrency:'CHF',...more});
const legacy=(n:number)=>({id:`B-${String(n).padStart(3,'0')}`,date:'27.04.2026',amountTTC:3.3,description:`Cmd 686863 Brau-Rauchshop article ${n}`,category:'brassage'}) as any;

describe('AM n° 7 : la facture s’identifie par (fournisseur normalisé, n°), pas par le nom brut ni le total',()=>{
  it('même n°, fournisseur écrit autrement (casse, ponctuation, forme juridique), total différent : doublon',()=>{
    const txs=[recorded()];
    expect(entry.purchaseDuplicates(draft({vendor:'BRAU UND RAUCHSHOP',amount:99.9}),txs)).toHaveLength(1);
    expect(entry.purchaseDuplicates(draft({vendor:'Brau-und-Rauchshop AG',date:'',amount:12}),txs)).toHaveLength(1);
    expect(entry.purchaseDuplicates(draft({vendor:'brau- und rauchshop gmbh'}),txs)).toHaveLength(1);
    expect(entry.purchaseDuplicateReasons(draft({vendor:'BRAU UND RAUCHSHOP',amount:99.9}),txs[0])).toEqual(['Même facture n° 372765']);
  });
  it('même n° chez un autre fournisseur, ou autre n° chez le même : pas un doublon',()=>{
    expect(entry.purchaseDuplicates(draft({vendor:'Malterie du Banc'}),[recorded()])).toEqual([]);
    expect(entry.purchaseDuplicates(draft({invoiceNumber:'372766',amount:12}),[recorded()])).toEqual([]);
  });
  it('même référence QR de paiement, fournisseur écrit autrement, n° absent : doublon',()=>{
    const ref='210000000003139471430009017';
    const tx=recorded({invoiceNumber:undefined,paymentReference:ref});
    expect(entry.purchaseDuplicates(draft({invoiceNumber:'',vendor:'Autre nom',paymentReference:ref,amount:5}),[tx])).toHaveLength(1);
    expect(entry.purchaseDuplicates(draft({invoiceNumber:'',vendor:'Autre nom',paymentReference:'210000000003139471430009025',amount:5}),[tx])).toEqual([]);
  });
});

describe('TR-NOTE-1 : une commande déjà saisie à l’ancienne est reconnue à la lecture de sa facture',()=>{
  it('la facture lue porte la commande Onlinebestellung-686863 ; B-001 à B-026 « Cmd 686863 » sont déjà au registre : signalé avec la raison',()=>{
    const anciens=Array.from({length:26},(_,i)=>legacy(i+1));
    const lue=draft({invoiceNumber:'380001',sourceOrderNumber:'Onlinebestellung-686863'});
    const found=entry.purchaseDuplicates(lue,anciens);
    expect(found.map(tx=>tx.id)).toEqual(['B-001']);
    expect(entry.purchaseDuplicateReasons(lue,found[0])[0]).toMatch(/commande 686863/i);
  });
  it('autre commande, ou numéro trop court : rien',()=>{
    expect(entry.purchaseDuplicates(draft({sourceOrderNumber:'Onlinebestellung-111111'}),[legacy(1)])).toEqual([]);
    expect(entry.purchaseDuplicates(draft({sourceOrderNumber:'12'}),[{...legacy(1),description:'Cmd 12 x'}])).toEqual([]);
  });
});

describe('AM n° 7 : le grand livre existant est contrôlé, rien n’est supprimé',()=>{
  const book=()=>[recorded(),...Array.from({length:26},(_,i)=>legacy(i+1))];
  it('B-001 à B-026 « Cmd 686863 » et la facture 372765 (commande Onlinebestellung-686863) : un groupe de 27 écritures',()=>{
    const groups=ledgerDuplicates(book());
    expect(groups).toHaveLength(1);
    expect(groups[0].ids).toHaveLength(27);
    expect(groups[0].reason).toMatch(/commande 686863/);
    expect(ledgerDuplicateIds(book()).has('B-026')).toBe(true);
    expect(ledgerDuplicateIds(book()).has('TX-372765')).toBe(true);
  });
  it('deux dépenses structurées au même (fournisseur normalisé, n°) : signalées, quel que soit le total',()=>{
    const a=recorded(),b=recorded({vendor:'BRAU UND RAUCHSHOP',amountCents:100},{id:'TX-bis',amountTTC:1});
    const groups=ledgerDuplicates([a,b]);
    expect(groups).toHaveLength(1);expect(groups[0].ids.sort()).toEqual(['TX-372765','TX-bis']);expect(groups[0].reason).toMatch(/372765/);
  });
  it('même référence QR : signalées',()=>{
    const ref='210000000003139471430009017';
    const groups=ledgerDuplicates([recorded({invoiceNumber:undefined,sourceOrderNumber:undefined,paymentReference:ref}),recorded({invoiceNumber:undefined,sourceOrderNumber:undefined,vendor:'X',paymentReference:ref},{id:'TX-2'})]);
    expect(groups).toHaveLength(1);expect(groups[0].reason).toMatch(/référence/i);
  });
  it('annulée, vente, autre n°, autre fournisseur, avoir : rien',()=>{
    const a=recorded();
    expect(ledgerDuplicates([a,recorded({voidedAt:'2026-05-01T00:00:00.000Z'},{id:'TX-annulee'})])).toEqual([]);
    expect(ledgerDuplicates([a,recorded({kind:'income'},{id:'TX-vente'})])).toEqual([]);
    expect(ledgerDuplicates([a,recorded({invoiceNumber:'372766'},{id:'TX-autre'})])).toEqual([]);
    expect(ledgerDuplicates([a,recorded({vendor:'Malterie du Banc'},{id:'TX-banc'})])).toEqual([]);
    expect(ledgerDuplicates([a,recorded({sourceDocumentType:'credit_note'},{id:'TX-avoir'})])).toEqual([]);
  });
  it('une commande qui n’apparaît que dans la facture, ou une écriture sans lien : rien ; une écriture annulée n’est pas signalée',()=>{
    expect(ledgerDuplicates([recorded(),{...legacy(1),description:'Cmd 111111 autre'}])).toEqual([]);
    expect(ledgerDuplicates([recorded(),{...legacy(1),finance:{version:1,kind:'expense',amountCents:330,lines:[],voidedAt:'2026-05-01T00:00:00.000Z'}}])).toEqual([]);
    expect(ledgerDuplicates([])).toEqual([]);
  });
});
