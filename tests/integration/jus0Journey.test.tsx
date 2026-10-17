/**
 * #105 — contrats du parcours « justificatif → revue → dépense et stock ».
 *
 * Chaque contrat JUS-0 décrit un défaut constaté en vrai rendu sur émulateurs (`scripts/check-invoice-journey-emulator.mjs`) :
 * rouges en JUS-0, verts depuis JUS-1, ils gardent ces défauts corrigés. Les cas JUS-1 et ceux de la correction V3 suivent. Données synthétiques de même forme que les documents réels (« Malterie du
 * Banc », montants inventés) ; aucune valeur réelle.
 */
import React from 'react';
import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
const state=vi.hoisted(()=>({transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},writes:[] as any[],scanned:vi.fn(),proofConfirm:vi.fn()}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,getConfig:()=>({fiscal:{isTvaRegistered:false}}),confirmPendingWrites:async()=>undefined,
  addTransaction:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);},addStockItem:(kind:any,item:any)=>state.writes.push(['stock',kind,item]),addEquipment:(item:any)=>state.writes.push(['equipment',item]),
  updateTransaction:(tx:any)=>{state.writes.push(['update',tx]);state.transactions=state.transactions.map(row=>row.id===tx.id?tx:row);}}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false,FirestoreRepo:{find:()=>undefined,documentWriteState:()=>({status:'unknown'}),waitForDocument:async()=>undefined,
  adjustNumber:(...args:any[])=>state.writes.push(['increment',...args]),put:(...args:any[])=>state.writes.push(['put',...args])}}));
vi.mock('../../src/services/financeService',()=>({validateFinancialPayment:()=>{},FinanceService:{getPlans:()=>[],stageNewTransactionPayment:(tx:any)=>{state.writes.push(['transaction',tx]);state.transactions.push(tx);}}}));
vi.mock('../../src/services/financeDocuments',()=>({prepareFinanceDocument:()=>({id:'proof-banc'}),saveFinanceDocumentConfirmed:(...args:any[])=>state.proofConfirm(...args)}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
import {savePurchase,purchaseDuplicates,type PurchaseDraft} from '../../src/services/purchaseEntry';
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';

const purchase=(id:string,value:Partial<PurchaseDraft>={}):PurchaseDraft=>({submissionId:id,date:'12.03.2026',vendor:'Malterie du Banc SA',invoiceNumber:'MB-1001',description:'Malts et houblons du Banc',category:'brassage',amount:84.6,
  lines:[{id:'l1',description:'Malt pâle du Banc',kind:'ingredient',amount:84.6,quantity:6,unit:'Kg',stockAction:'none',equipmentAction:'none'}],
  paymentStatus:'paid',paymentMethod:'bank',paymentDate:'12.03.2026',dueDate:'',sourceCurrency:'CHF',...value});
const subtle=Object.getOwnPropertyDescriptor(crypto,'subtle');
afterEach(()=>{if(subtle)Object.defineProperty(crypto,'subtle',subtle);});
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.transactions=[];state.writes=[];state.stocks={rawMaterials:[],cleaning:[],equipment:[]};state.scanned.mockReset();state.proofConfirm.mockReset().mockResolvedValue(undefined);
  vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();});

describe('JUS-0 : contrats du parcours justificatif (défauts corrigés en JUS-1)',()=>{
  it('C2 — le récapitulatif en ligne d’une facture déjà enregistrée est signalé comme doublon',()=>{
    // La facture du fournisseur est enregistrée ; sa commande en ligne (même achat) est scannée ensuite, avec la même
    // date saisie. Le fournisseur y est écrit en capitales et sans forme juridique, sans numéro de facture.
    const invoice=savePurchase(purchase('facture-banc-0001',{documentHash:'a'.repeat(64)}));
    expect(invoice).toBe('TX-facture-banc-0001');
    const recap=purchase('recap-banc-0001',{vendor:'MALTERIE DU BANC',invoiceNumber:'',description:'Commande en ligne',documentHash:'b'.repeat(64),sourceDocumentType:'other'});
    expect(purchaseDuplicates(recap,state.transactions).map(tx=>tx.id)).toEqual(['TX-facture-banc-0001']);
  });

  it('C3 — un article créé depuis la lecture prend la catégorie de stock de l’app (Malt, Houblon, Levure)',()=>{
    // La lecture propose des catégories en minuscules ; l'app compare « Houblon », « Malt », « Levure » à l'identique
    // (fiche de stock, levure, brassage).
    savePurchase(purchase('stock-banc-0001',{lines:[
      {id:'h1',description:'Houblon du Banc 9.1%',kind:'ingredient',amount:42.3,quantity:40,unit:'g',stockAction:'new',stockCategory:'houblon',equipmentAction:'none'},
      {id:'m1',description:'Malt pâle du Banc',kind:'ingredient',amount:42.3,quantity:6,unit:'Kg',stockAction:'new',stockCategory:'malt',equipmentAction:'none'}]}));
    const created=state.writes.filter(([kind])=>kind==='stock').map(([,,item])=>item.category);
    expect(created).toEqual(['Houblon','Malt']);
  });

  // Décision 117 (PR MVP) : la feuille ne propose plus d'article de stock (B-V3-4, B-V3-5 ouverts) ; le brasseur
  // choisit ou crée l'article, comme sur `main`.
  it('C3 — une ligne lue qui existe déjà au stock n’est pas rattachée d’office à cet article, sans écriture avant confirmation',async()=>{
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    state.stocks={rawMaterials:[{id:'banc-fume',ref:'banc-fume',name:'Malt fumé du Banc',category:'Malt',unit:'kg',currentStock:2,minStock:0,reorder:false}],cleaning:[],equipment:[]};
    state.scanned.mockResolvedValueOnce({ok:true,model:'rejeu',result:{documentType:'invoice',paymentEvidence:'paid',vendor:'Malterie du Banc SA',date:'12.03.2026',currency:'CHF',invoiceNumber:'MB-1002',
      amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:3.35,category:'brassage',subcategory:'',description:'Malts du Banc',issues:[],fieldWarnings:[],review:{status:'checked',findings:[],readers:2},
      items:[{id:'line-1',name:'MALT FUME DU BANC',kind:'stock',quantity:1,unit:'Kg',amountTTC:1.75,stockCategory:'malt'},{id:'line-2',name:'Concassage',kind:'service',quantity:1,unit:'Kg',amountTTC:1.6}]}});
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    const file=new File(['%PDF-1.4\n'],'facture-banc.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    expect(screen.getByLabelText('Stock ligne 1')).toHaveValue('none');
    expect(screen.queryByRole('combobox',{name:'Article'})).toBeNull();
    expect(state.writes).toEqual([]);
  });

  it('C8 — hors ligne avec justificatif, le message dit en français que la connexion manque et que rien n’est perdu',async()=>{
    // Le SDK Firestore refuse la relecture du serveur ; son message anglais ne doit pas atteindre le brasseur.
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    state.proofConfirm.mockRejectedValueOnce(Object.assign(new Error('Failed to get document because the client is offline.'),{code:'unavailable'}));
    state.scanned.mockResolvedValueOnce({ok:true,model:'rejeu',result:{documentType:'invoice',paymentEvidence:'paid',vendor:'Malterie du Banc SA',date:'12.03.2026',currency:'CHF',invoiceNumber:'MB-1003',
      amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:12.3,category:'brassage',subcategory:'',description:'Concassage du Banc',issues:[],fieldWarnings:[],review:{status:'checked',findings:[],readers:2},
      items:[{id:'line-1',name:'Concassage du Banc',kind:'service',quantity:1,unit:'',amountTTC:12.3}]}});
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    const file=new File(['%PDF-1.4\n'],'facture-banc-hors-ligne.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    const alert=await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/Failed|offline/);
    expect(alert).toHaveTextContent(/connexion|réseau|hors ligne/i);
    expect(state.writes).toEqual([]);
  });
});

/**
 * JUS-1 (#105) — le choix explicite devant un achat déjà enregistré (B1) et la proposition de stock visible (M4).
 */
describe('JUS-1 : achat déjà enregistré et propositions de stock',()=>{
  const recorded=(proof:boolean)=>({id:'TX-facture-banc-0001',date:'12.03.2026',amountTTC:84.6,description:'Malts et houblons du Banc',category:'brassage',
    finance:{kind:'expense',version:1,amountCents:8460,vendor:'Malterie du Banc SA',invoiceNumber:'MB-1001',lines:[],...(proof?{proofDocumentId:'proof-facture-banc'}:{})}});
  const recapScan=()=>({ok:true,model:'rejeu',result:{documentType:'other',paymentEvidence:'paid',vendor:'MALTERIE DU BANC',date:'12.03.2026',currency:'CHF',invoiceNumber:'',
    amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:84.6,category:'brassage',subcategory:'',description:'Commande en ligne',issues:[],fieldWarnings:[],review:{status:'checked',findings:[],readers:2},
    items:[{id:'line-1',name:'MALT FUME DU BANC',kind:'stock',quantity:6,unit:'Kg',amountTTC:84.6,stockCategory:'malt'}]}});
  const openRecap=async(onClose=()=>{},scan=recapScan())=>{
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    state.stocks={rawMaterials:[{id:'banc-fume',ref:'banc-fume',name:'Malt fumé du Banc',category:'Malt',unit:'kg',currentStock:2,minStock:0,reorder:false}],cleaning:[],equipment:[]};
    state.scanned.mockResolvedValueOnce(scan);
    const view=render(<ExpenseSheet onClose={onClose} onSaved={()=>{}}/>);
    const file=new File(['%PDF-1.4\n'],'commande-banc.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    return screen.findByRole('region',{name:'Achat peut-être déjà enregistré'});
  };

  it('montre la dépense existante en tête, refuse l’enregistrement sans choix, et « même achat » ferme sans écriture',async()=>{
    state.transactions=[recorded(true)];
    const onClose=vi.fn();
    const panel=await openRecap(onClose);
    expect(panel).toHaveTextContent('Malts et houblons du Banc');
    expect(panel).toHaveTextContent(/84[.,]60/);
    expect(panel).toHaveTextContent('justificatif joint');
    expect(panel).toHaveTextContent('Même fournisseur et même total');
    // Le n° du document lu à côté de celui de la dépense existante.
    expect(within(panel).getByRole('row',{name:/^Facture/})).toHaveTextContent(/sans n°\s*MB-1001/);
    const same=within(panel).getByRole('button',{name:'Même achat'}),other=within(panel).getByRole('button',{name:'Autre achat'});
    expect(same).toHaveAttribute('aria-pressed','false');expect(other).toHaveAttribute('aria-pressed','false');
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    expect(await screen.findByRole('alert')).toHaveTextContent('doublon');
    expect(same).toHaveFocus();
    // Choisir n'agit pas : rien n'est fermé ni écrit avant l'action du pied, qui dit ce qui va se passer.
    fireEvent.click(same);
    expect(same).toHaveAttribute('aria-pressed','true');expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Fermer sans rien enregistrer'}));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(state.writes).toEqual([]);expect(state.proofConfirm).not.toHaveBeenCalled();
  });

  it('« Autre achat » enregistre une seconde dépense après un choix explicite',async()=>{
    state.transactions=[recorded(true)];
    await openRecap();
    const other=screen.getByRole('button',{name:'Autre achat'});
    fireEvent.click(other);
    expect(other).toHaveAttribute('aria-pressed','true');
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    await waitFor(()=>expect(state.writes.filter(([kind])=>kind==='transaction')).toHaveLength(1));
    expect(state.proofConfirm).toHaveBeenCalledTimes(1);
  });

  it('« Rattacher » joint le justificatif à la dépense sans original, sans nouvelle dépense ni stock',async()=>{
    state.transactions=[recorded(false)];
    const panel=await openRecap();
    expect(panel).toHaveTextContent('sans justificatif');
    fireEvent.click(within(panel).getByRole('button',{name:'Même achat'}));
    expect(state.writes).toEqual([]);expect(state.proofConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Rattacher le justificatif'}));
    expect(await screen.findByRole('status')).toHaveTextContent('Justificatif rattaché à « Malts et houblons du Banc » du 12.03.2026');
    expect(state.writes.map(([kind])=>kind)).toEqual(['update']);
    expect(state.writes[0][1]).toMatchObject({id:'TX-facture-banc-0001',finance:{proofDocumentId:'proof-banc',invoiceNumber:'MB-1001'}});
    expect(screen.getByRole('button',{name:'Terminé'})).toBeVisible();
  });

  it('commande répétée avec un autre n° de facture : aucun panneau, la seconde dépense s’enregistre',async()=>{
    state.transactions=[recorded(false)];
    const scan=recapScan();Object.assign(scan.result,{documentType:'invoice',vendor:'Malterie du Banc SA',invoiceNumber:'MB-1042',date:'14.03.2026',description:'Malts et houblons du Banc'});
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    state.scanned.mockResolvedValueOnce(scan);
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    const file=new File(['%PDF-1.4\n'],'facture-banc-1042.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    expect(screen.queryByRole('region',{name:'Achat peut-être déjà enregistré'})).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    await waitFor(()=>expect(state.writes.filter(([kind])=>kind==='transaction')).toHaveLength(1));
    expect(state.writes.some(([kind])=>kind==='update')).toBe(false);
  });

  it('plusieurs dépenses proches : le panneau montre et rattache la plus proche, pas la première stockée',async()=>{
    const far={...recorded(false),id:'TX-banc-plus-ancien',date:'01.03.2026',description:'Achat du Banc plus ancien',finance:{...recorded(false).finance,invoiceNumber:undefined}};
    state.transactions=[far,{...recorded(false),finance:{...recorded(false).finance,invoiceNumber:undefined}}];
    const panel=await openRecap();
    expect(panel).toHaveTextContent('Malts et houblons du Banc');expect(panel).not.toHaveTextContent('Achat du Banc plus ancien');
    expect(panel).toHaveTextContent('1 autre achat proche');
    fireEvent.click(within(panel).getByRole('button',{name:'Même achat'}));
    fireEvent.click(screen.getByRole('button',{name:'Rattacher le justificatif'}));
    await screen.findByRole('status');
    expect(state.writes.map(([kind,tx])=>[kind,tx.id])).toEqual([['update','TX-facture-banc-0001']]);
  });

  // Décision 117 (PR MVP) : plus de proposition de stock, donc ni marque « proposé : » ni compte au résumé.
  it('ne propose aucun article de stock, ni sur la ligne compacte ni dans le résumé, sans écriture',async()=>{
    state.transactions=[];
    state.stocks={rawMaterials:[],cleaning:[],equipment:[]};
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    state.stocks.rawMaterials.push({id:'banc-fume',ref:'banc-fume',name:'Malt fumé du Banc',category:'Malt',unit:'kg',currentStock:2,minStock:0,reorder:false});
    const scan=recapScan();scan.result.items.push({id:'line-2',name:'Concassage',kind:'service',quantity:1,unit:'',amountTTC:0,stockCategory:''});
    state.scanned.mockResolvedValueOnce(scan);
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    const file=new File(['%PDF-1.4\n'],'commande-banc-2.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    const lines=view.container.querySelectorAll('[data-purchase-line] summary');
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toHaveTextContent('proposé');
    expect(lines[1]).not.toHaveTextContent('proposé');
    expect(screen.getByLabelText('Stock ligne 1')).toHaveValue('none');
    expect(view.container.querySelector('[data-purchase-lines] > summary')).not.toHaveTextContent('proposée par la lecture');
    expect(state.writes).toEqual([]);
  });
});
