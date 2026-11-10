import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
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
import {lecturesLenteur} from '../../src/ui/depense/apercuDev';
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

/* BR-124 (10.11), ses mots : « Et du coup pourquoi là je peux pas avoir un ajout au stock ?? » ; « l'option « ajouter au stock » est toujours disponible, la vue n'est ouvert
   que pour les articles de brasserie.. » ; « Il ya deux comportement très différents sur le même type d'article ? Wtf ». */
const ajouter=(l:HTMLElement)=>Array.from(l.querySelectorAll('button')).find(b=>/^Ajouter au stock/.test(b.getAttribute('aria-label')??b.textContent??''));
const choisirNature=(l:HTMLElement)=>l.querySelector<HTMLElement>('[data-dp-nature-stock]');
const bouton=(l:HTMLElement,mot:string)=>Array.from(l.querySelectorAll('button')).find(b=>b.textContent===mot)!;
describe('BR-124 : « Ajouter au stock » est toujours offert, la vue ne s’ouvre d’office que pour la brasserie',()=>{
  it('Matériel : l’option est là, le panneau fermé ; au toucher le choix de nature, puis la liaison s’ouvre',async()=>{
    const view=await ouvrir(houblon());
    const l=await ouvrirLigne(view);
    fireEvent.click(bouton(l,'Matériel'));
    await waitFor(()=>expect(ligne(view).textContent).toMatch(/hors stock/));
    expect(liaisonStock(ligne(view))).toBe(false);
    expect(ajouter(ligne(view))).toBeTruthy();
    fireEvent.click(ajouter(ligne(view))!);
    const choix=choisirNature(ligne(view));
    expect(choix).not.toBeNull();
    expect(Array.from(choix!.querySelectorAll('button')).map(b=>b.textContent)).toEqual(['Ingrédient','Emballage','Nettoyage']);
    expect(liaisonStock(ligne(view))).toBe(false);
    fireEvent.click(bouton(choix!,'Ingrédient'));
    await waitFor(()=>expect(liaisonStock(ligne(view))).toBe(true));
  });
  it('Service : idem (option offerte, panneau fermé, nature puis liaison)',async()=>{
    const view=await ouvrir(houblon());
    const l=await ouvrirLigne(view);
    fireEvent.click(bouton(l,'Service'));
    await waitFor(()=>expect(ajouter(ligne(view))).toBeTruthy());
    expect(liaisonStock(ligne(view))).toBe(false);
    fireEvent.click(ajouter(ligne(view))!);
    fireEvent.click(bouton(choisirNature(ligne(view))!,'Emballage'));
    await waitFor(()=>expect(liaisonStock(ligne(view))).toBe(true));
  });
  it('hors brassage (pharmacie, Matériel) : idem',async()=>{
    const view=await ouvrir(lecturePharmacie());
    const l=await ouvrirLigne(view);
    expect(liaisonStock(l)).toBe(false);
    expect(ajouter(l)).toBeTruthy();
    fireEvent.click(ajouter(l)!);
    fireEvent.click(bouton(choisirNature(ligne(view))!,'Nettoyage'));
    await waitFor(()=>expect(liaisonStock(ligne(view))).toBe(true));
  });
  it('un ingrédient dont la vue est fermée (Service puis Ingrédient) : l’option est là, un toucher ouvre la liaison sans demander la nature',async()=>{
    const view=await ouvrir(houblon());
    const l=await ouvrirLigne(view);
    fireEvent.click(bouton(l,'Service'));
    await waitFor(()=>expect(ajouter(ligne(view))).toBeTruthy());
    fireEvent.click(bouton(ligne(view),'Ingrédient'));
    await waitFor(()=>expect(ligne(view).textContent).toMatch(/hors stock/));
    expect(liaisonStock(ligne(view))).toBe(false);
    expect(ajouter(ligne(view))).toBeTruthy();
    fireEvent.click(ajouter(ligne(view))!);
    expect(choisirNature(ligne(view))).toBeNull();
    await waitFor(()=>expect(liaisonStock(ligne(view))).toBe(true));
  });
});

/* Deux lignes Matériel d'une même facture, l'une dont le prix est corrigé à la 3e lecture (fixture inspirée de sa facture, SIMULÉE) : même dépliage. */
const deuxLignes=async()=>{
  Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
  const {provisoire,final,jeton}=lecturesLenteur('perdue');
  const modele=provisoire!.items[0];
  const item=(i:number,nom:string,prix:number,rang?:number)=>({...modele,id:`line-${i}`,name:nom,kind:'other',quantity:1,unit:'',price:prix,amountTTC:prix,stockCategory:undefined,variant:'',reference:'',evidence:`${nom} ${prix}`,...(rang===undefined?{}:{rangProvisoire:rang})});
  const commun={documentType:'receipt',paymentMethod:'twint',vendor:'Pharmacie Test',category:'divers',date:'10.11.2026',invoiceNumber:'',tvaAmount:null,amountPaid:undefined,points:[],issues:[],fieldWarnings:[]};
  const controls={lines:{checked:0,failed:0,skipped:2,skippedIds:['line-1','line-2']},sum:{statut:'ok',base:'TTC'},vat:{statut:'non-verifiable',base:'TTC'},totals:{statut:'non-verifiable'}};
  Object.assign(provisoire!,commun,{items:[item(1,'Vaxigrip Tetra',26.68),item(2,'H21 A vaccination',25)],printedLineCount:2,amountTTC:51.68,controls});
  Object.assign(final,commun,{items:[item(1,'Vaxigrip Tetra',26.68,0),item(2,'H21 A vaccination',30,1)],printedLineCount:2,amountTTC:56.68,controls});
  let ouvre!:()=>void;const promesse=new Promise<void>(r=>{ouvre=r;});
  const sortie=(result:any,extra:Record<string,unknown>={})=>({ok:true,model:'rejeu',proofDataUrl:'',fileName:'f.pdf',mimeType:'application/pdf',result,...extra});
  state.scanned.mockImplementation(async(_f:any,_t:any,opts:any)=>{opts?.onProvisoire?.(sortie(provisoire,{jeton}));await promesse;return sortie(final);});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await act(async()=>{ouvre();await promesse;await new Promise(r=>setTimeout(r,0));});
  await waitFor(()=>expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  return view;
};
const ouvrirId=async(view:{container:HTMLElement},id:string)=>{
  const l=()=>view.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`)!;
  if(!l().querySelector('input[aria-label^="Quantité ligne"]'))fireEvent.click(l().querySelector('summary')!);
  await waitFor(()=>expect(l().querySelector('input[aria-label^="Quantité ligne"]')).not.toBeNull());
  return l();
};
describe('BR-124 : un même type d’article se déplie pareil, corrigé ou non',()=>{
  it('deux lignes Matériel : la corrigée montre sa valeur et Garder · Remettre, sans FACTURE = STOCK ; « Ajouter au stock » sur les deux',async()=>{
    const view=await deuxLignes();
    const a=await ouvrirId(view,'line-1'),b=await ouvrirId(view,'line-2');
    expect(b.textContent).toMatch(/Remettre/);
    expect(b.textContent).toMatch(/Garder/);
    expect(a.textContent).not.toMatch(/Remettre/);
    expect(a.querySelector('[data-dp-duel]')).toBeNull();
    expect(b.querySelector('[data-dp-duel]')).toBeNull();
    expect(ajouter(a)).toBeTruthy();
    expect(ajouter(b)).toBeTruthy();
    expect(liaisonStock(a)).toBe(false);
    expect(liaisonStock(b)).toBe(false);
  });
});
