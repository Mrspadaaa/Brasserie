import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* BR-123 (10.11) : le panneau stock de la Nouvelle dépense. Lecture SIMULÉE (Gemini jamais appelé), aucune écriture. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[],traduire:vi.fn()}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/nomsFr',async importOriginal=>({...await importOriginal<any>(),traduireLignes:(lignes:any[])=>state.traduire(lignes)}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.traduire.mockReset();state.traduire.mockResolvedValue(new Map());state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});Object.defineProperty(window,'crypto',{value:webcrypto,configurable:true});});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(lecture:any)=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
/** La pièce de sa capture : une ligne de médicament, 13,40, sans quantité, unité ni prix unitaire lus (`price` null : « quantité VIDE, prix unitaire VIDE »), rangée « Autres ». */
const lecturePharmacie=(ligne:Record<string,unknown>={},piece:Record<string,unknown>={})=>({
  vendor:'BENU Matran',date:'10.11.2026',currency:'CHF',invoiceNumber:'',description:'Pharmacie',category:'divers',subcategory:'',amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:13.4,issues:[] as string[],
  items:[{id:'line-1',name:'MEFENACIDE cpr pell 500 mg sécables 30 pce',kind:'other',quantity:null,unit:'',price:null,amountTTC:13.4,reference:'',evidence:'MEFENACIDE cpr pell 500 mg sécables 30 pce 13.40',...ligne}],
  paymentEvidence:'paid',paymentMethod:'twint',amountPaid:13.4,printedLineCount:1,
  review:{status:'checked',findings:[],readers:3},
  controls:{lines:{checked:0,failed:0,skipped:1,skippedIds:['line-1']},sum:{statut:'ok',base:'TTC'},vat:{statut:'non-verifiable',base:'TTC'},totals:{statut:'non-verifiable'}},
  ...piece,
});
/** La ligne se remonte dans une autre bande quand sa nature change : on la cherche toujours à neuf. */
const ligne=(view:{container:HTMLElement})=>view.container.querySelector<HTMLElement>('[data-dp-ligne="line-1"]')!;
const ouvrirLigne=async(view:{container:HTMLElement})=>{
  if(!ligne(view).querySelector('input[aria-label^="Quantité ligne"]'))fireEvent.click(ligne(view).querySelector('summary')!);
  await waitFor(()=>expect(ligne(view).querySelector('input[aria-label^="Quantité ligne"]')).not.toBeNull());
  return ligne(view);
};
/** Une ligne lue « stock » dans une pièce de brassage : la lecture de sa capture avant qu'il choisisse « Matériel ». */
const enStockDeBrassage=()=>lecturePharmacie({kind:'stock'},{category:'brassage'});
const liaisonStock=(l:HTMLElement)=>/nouvel article|relié|à choisir/.test(l.textContent??'')||l.querySelector('[data-dp-sortie],[role="combobox"],[role="listbox"],[aria-label="Article"]')!==null;

/* BR-123 (10.11), ses mots relayés : « Oui ou si c'est vraiment un changement de stock genre ajoute de houblons, malt ou autre ??? ».
   Le panneau stock s'ouvre sur demande, ou d'office seulement quand la ligne fait vraiment entrer du stock (ingrédient : houblon, malt, levure…) ;
   jamais sur une ligne Service, Matériel ou hors stock. */
const houblon=()=>lecturePharmacie({name:'Houblon Citra T90 1 kg',kind:'stock',quantity:1,unit:'kg',price:38,amountTTC:38,evidence:'Houblon Citra T90 1 kg 38.00'},{vendor:'Brau- und Rauchshop',description:'Houblons',category:'brassage',amountTTC:38,amountPaid:38});
const malt=()=>lecturePharmacie({name:'Pilsner Malz 25 kg',kind:'stock',quantity:25,unit:'kg',price:1.2,amountTTC:30,evidence:'Pilsner Malz 25 kg 30.00'},{vendor:'Brau- und Rauchshop',description:'Malt',category:'brassage',amountTTC:30,amountPaid:30});
describe('BR-123 : le panneau stock s’ouvre seulement pour un vrai changement de stock',()=>{
  it('un houblon acheté pour le brassage : la ligne propose d’office son article (entrée en stock)',async()=>{
    const view=await ouvrir(houblon());
    const l=await ouvrirLigne(view);
    expect(liaisonStock(l)).toBe(true);
  });
  it('un malt acheté pour le brassage : idem',async()=>{
    const view=await ouvrir(malt());
    const l=await ouvrirLigne(view);
    expect(liaisonStock(l)).toBe(true);
  });
  it('la même ligne passée en « Service » : aucune liaison, rien à choisir',async()=>{
    const view=await ouvrir(houblon());
    const l=await ouvrirLigne(view);
    fireEvent.click(Array.from(l.querySelectorAll('button')).find(b=>b.textContent==='Service')!);
    await waitFor(()=>expect(liaisonStock(ligne(view))).toBe(false));
  });
  it('la même ligne passée en « Matériel » : « hors stock », aucune liaison',async()=>{
    const view=await ouvrir(houblon());
    const l=await ouvrirLigne(view);
    fireEvent.click(Array.from(l.querySelectorAll('button')).find(b=>b.textContent==='Matériel')!);
    await waitFor(()=>expect(ligne(view).textContent).toMatch(/hors stock/));
    expect(liaisonStock(ligne(view))).toBe(false);
  });
  it('un achat hors brassage (pharmacie, « divers ») : aucune liaison au chargement',async()=>{
    const view=await ouvrir(lecturePharmacie());
    const l=await ouvrirLigne(view);
    expect(liaisonStock(l)).toBe(false);
  });
});
