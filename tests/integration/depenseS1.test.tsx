import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* s1 (09.11), ses mots : « pas besoin d'avoir tout mes outils et autres, juste ce qui concerne vraiment le brassage, donc pas rénovation » ; « quand je click sur l'unité, ça met 1 dans la quantité » ; « ça m'ouvre pas le clavier sur mobile » ;
   « pièce en premier, et une fois cliqué ça ouvre aussi en grand comme l'unité les nombres, mais sans le rouge ». Lectures SIMULÉES : Gemini n'est jamais appelé. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[]}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {lectureTicket} from './depenseTotaux.fixture';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(lecture:any)=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
const ligne=(view:{container:HTMLElement},id:string)=>view.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`)!;
const ouvrirLigne=async(view:{container:HTMLElement},id:string)=>{
  const d=ligne(view,id).querySelector<HTMLDetailsElement>('details')!;
  if(!d.open)fireEvent.click(d.querySelector('summary')!);
  await waitFor(()=>expect(ligne(view,id).querySelector<HTMLDetailsElement>('details')!.open).toBe(true));
};
const iconeStock=(view:{container:HTMLElement},id:string)=>ligne(view,id).querySelector('summary [data-dp-lien]');
const champQte=(view:{container:HTMLElement},id:string)=>ligne(view,id).querySelector<HTMLInputElement>('input[aria-label^="Quantité ligne"]')!;
const item=(id:string,name:string,over:Record<string,unknown>={})=>({id,name,kind:'other',quantity:1,unit:'pièce',price:8.9,amountTTC:8.9,reference:'',evidence:`${name} 8.90`,...over});
const lectureSans=(items:any[],over:Record<string,unknown>={})=>lectureTicket({items,amountTTC:items.reduce((t,i)=>t+i.amountTTC,0),printedLineCount:items.length,countedAmounts:items.length,countedEans:undefined,controls:undefined,...over});

describe('s1-1 : le stock ne garde que le brassage',()=>{
  it('un ticket de rénovation (outillage, peinture, divers travaux) : aucune icône de stock sur aucune ligne',async()=>{
    const view=await ouvrir(lectureTicket({countedEans:undefined}));
    const lignes=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-ligne]'));
    expect(lignes.length).toBe(29);
    for(const l of lignes)expect(l.querySelector('summary [data-dp-lien]'),`ligne ${l.getAttribute('data-dp-ligne')} : ${l.textContent}`).toBeNull();
  });
  it('une dépense de brassage : le houblon garde son icône, le service n’en a pas',async()=>{
    const view=await ouvrir(lectureSans([
      item('line-1','Houblon Citra 100 g',{kind:'stock',stockCategory:'Houblon',unit:'g',quantity:100,price:0.09,amountTTC:9}),
      item('line-3','Entretien chaudière',{kind:'service',amountTTC:120,price:120}),
    ],{category:'brassage'}));
    expect(iconeStock(view,'line-1')).not.toBeNull();
    expect(iconeStock(view,'line-3')).toBeNull();
  });
  /* VERDICT-EN-LIGNE-2, bloquant 1 : la règle tient à la DÉPENSE (catégorie, but, fournisseur), jamais à la famille que la lecture range ligne par ligne : « CHANTILLES S00 » rangé en Levures, une brosse en Consommables. */
  it.each(['renovation','divers','chargesFixes'])('dépense « %s » : aucune ligne n’a d’icône ni de stock, même rangée en Levures ou en Consommables',async categorie=>{
    const view=await ouvrir(lectureSans([
      item('line-1','CHANTILLES S00',{kind:'stock',stockCategory:'Levure',unit:'sachet',quantity:1,price:4.25,amountTTC:4.25}),
      item('line-2','BROSSE LATTOB GD',{kind:'cleaning',stockCategory:'Consommable',unit:'pièce',quantity:1,price:5.5,amountTTC:5.5}),
      item('line-3','Houblon Citra 100 g',{kind:'stock',stockCategory:'Houblon',unit:'g',quantity:100,price:0.09,amountTTC:9}),
      item('line-4','VACCIN FICTIF',{kind:'other',quantity:1,unit:'pièce',price:26.68,amountTTC:26.68}),
    ],{category:categorie}));
    for(const id of ['line-1','line-2','line-3','line-4'])expect(iconeStock(view,id),`${categorie} ${id}`).toBeNull();
    await ouvrirLigne(view,'line-1');
    expect(ligne(view,'line-1').textContent).not.toMatch(/nouvel article|relié/);
  });
  it('la même lecture dans une dépense de brassage garde ses icônes (le brasseur change la catégorie : elles reviennent)',async()=>{
    const view=await ouvrir(lectureSans([item('line-1','CHANTILLES S00',{kind:'stock',stockCategory:'Levure',unit:'sachet',quantity:1,price:4.25,amountTTC:4.25})],{category:'brassage'}));
    expect(iconeStock(view,'line-1')).not.toBeNull();
  });
  it('l’appartenance au brassage inconnue (« Autres », dépense de brassage) : comportement actuel, l’icône reste (prudent)',async()=>{
    const view=await ouvrir(lectureSans([item('line-1','Objet sans mot connu XQ7',{kind:'other',amountTTC:5,price:5})],{category:'brassage'}));
    expect(iconeStock(view,'line-1')).not.toBeNull();
  });
  it('une ligne de rénovation ouverte ne propose aucun article d’office ; « Ajouter au stock » reste offert à la demande (BR-124)',async()=>{
    const view=await ouvrir(lectureTicket({countedEans:undefined}));
    await ouvrirLigne(view,'line-24');
    expect(ligne(view,'line-24').querySelector('[data-dp-suivre]')).not.toBeNull();
    expect(ligne(view,'line-24').textContent).not.toMatch(/nouvel article|relié/);
  });
});

describe('s1-2 : toucher l’unité d’une quantité vide y met 1, sans clavier',()=>{
  const vide=()=>lectureSans([item('line-1','CRATTE-VITRES',{kind:'equipment',quantity:undefined,unit:'',price:null,amountTTC:8.9})]);
  it('les cinq cases : pièce · g · Kg · L · sachet',async()=>{
    const view=await ouvrir(vide());
    await ouvrirLigne(view,'line-1');
    const cases=Array.from(ligne(view,'line-1').querySelectorAll<HTMLElement>('[data-dp-cases-unite] button')).map(b=>b.getAttribute('data-val'));
    expect(cases).toEqual(['pièce','g','kg','l','sachet']);
  });
  it('« pièce » touchée : la quantité vaut 1, le prix reste 8,90, aucun champ n’a le focus',async()=>{
    const view=await ouvrir(vide());
    await ouvrirLigne(view,'line-1');
    expect(champQte(view,'line-1').value).toBe('');
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-cases-unite] button[data-val="pièce"]')!);
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe('1'));
    expect(ligne(view,'line-1').querySelector<HTMLInputElement>('input[aria-label^="Prix ligne"]')!.value).toBe('8,90');
    expect(document.activeElement?.tagName).not.toBe('INPUT');
    expect(document.activeElement?.tagName).not.toBe('TEXTAREA');
  });
  it('une unité déjà posée, quantité vide : toucher une autre unité y met 1',async()=>{
    const view=await ouvrir(lectureSans([item('line-1','Malt Pilsner',{kind:'stock',stockCategory:'Malt',quantity:undefined,unit:'kg',price:null,amountTTC:12})],{category:'brassage'}));
    await ouvrirLigne(view,'line-1');
    const seg=ligne(view,'line-1').querySelector('[data-dp-unite-segments]');
    expect(seg).not.toBeNull();
    const g=Array.from(seg!.querySelectorAll('button')).find(b=>b.textContent==='g')!;
    fireEvent.click(g);
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe('1'));
    expect(document.activeElement?.tagName).not.toBe('INPUT');
  });
  it('une quantité déjà saisie ne change pas quand on touche l’unité déjà posée',async()=>{
    const view=await ouvrir(lectureSans([item('line-1','Malt Pilsner',{kind:'stock',stockCategory:'Malt',quantity:25,unit:'kg',price:1.2,amountTTC:30})],{category:'brassage'}));
    await ouvrirLigne(view,'line-1');
    const seg=ligne(view,'line-1').querySelector('[data-dp-unite-segments]')!;
    expect(champQte(view,'line-1').value).toBe('25');
    fireEvent.click(Array.from(seg.querySelectorAll('button')).find(b=>b.textContent==='Kg')!);
    expect(champQte(view,'line-1').value).toBe('25');
  });
  /* VERDICT-EN-LIGNE-2, bloquant 2 : VITRIFIC, ligne hors stock dont l'unité n'était que déduite de la quantité : la quantité vidée emportait le segment, plus rien à toucher. */
  it('une quantité vidée garde le segment d’unité (ligne hors stock) ; toucher l’unité remet 1',async()=>{
    const view=await ouvrir(lectureSans([item('line-1','VITRIFIC.P.SGL 5.8KG',{kind:'other',quantity:null,unit:'',price:86.85,amountTTC:86.85})]));
    await ouvrirLigne(view,'line-1');
    expect(ligne(view,'line-1').querySelector('[data-dp-unite-segments]')).not.toBeNull();
    fireEvent.change(champQte(view,'line-1'),{target:{value:''}});fireEvent.blur(champQte(view,'line-1')); /* le toucher sur un bouton fait perdre le focus au champ */
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe(''));
    const seg=ligne(view,'line-1').querySelector('[data-dp-unite-segments]');
    expect(seg,'le segment d’unité a disparu avec la quantité').not.toBeNull();
    fireEvent.click(Array.from(seg!.querySelectorAll('button')).find(b=>/pièce/.test(b.textContent!))!);
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe('1'));
    expect(document.activeElement?.tagName).not.toBe('INPUT');
    expect(document.activeElement?.tagName).not.toBe('TEXTAREA');
  });
  it('une quantité posée par une tuile (5) reste quand on touche une autre unité (L)',async()=>{
    const view=await ouvrir(vide());
    await ouvrirLigne(view,'line-1');
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-cases-unite] button[data-val="pièce"]')!);
    await waitFor(()=>expect(ligne(view,'line-1').querySelector('[data-dp-tuiles-quantite]')).not.toBeNull());
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-tuiles-quantite] button[data-val="5"]')!);
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe('5'));
    const seg=ligne(view,'line-1').querySelector('[data-dp-unite-segments]')!;
    fireEvent.click(Array.from(seg.querySelectorAll('button')).find(b=>b.textContent==='L')!);
    await waitFor(()=>expect(ligne(view,'line-1').querySelector('[data-dp-unite-segments] button[aria-pressed="true"]')!.textContent).toBe('L'));
    expect(champQte(view,'line-1').value).toBe('5');
  });
  it('le clavier ne s’ouvre qu’en touchant la quantité (le champ n’est pas focalisé par l’unité)',async()=>{
    const view=await ouvrir(vide());
    await ouvrirLigne(view,'line-1');
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-cases-unite] button[data-val="g"]')!);
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe('1'));
    expect(document.activeElement).not.toBe(champQte(view,'line-1'));
  });
});

describe('s1-3 : les nombres s’ouvrent en grandes tuiles, sans rouge, 1 déjà choisi',()=>{
  const vide=()=>lectureSans([item('line-1','CRATTE-VITRES',{kind:'equipment',quantity:undefined,unit:'',price:null,amountTTC:8.9})]);
  it('après l’unité : tuiles 1 · 2 · 3 · 5 · 10, 1 choisi, aucune classe d’alerte',async()=>{
    const view=await ouvrir(vide());
    await ouvrirLigne(view,'line-1');
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-cases-unite] button[data-val="pièce"]')!);
    await waitFor(()=>expect(ligne(view,'line-1').querySelector('[data-dp-tuiles-quantite]')).not.toBeNull());
    const t=ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-tuiles-quantite]')!;
    const boutons=Array.from(t.querySelectorAll<HTMLElement>('button[data-val]'));
    expect(boutons.map(b=>b.getAttribute('data-val'))).toEqual(['1','2','3','5','10']);
    expect(boutons.filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.getAttribute('data-val'))).toEqual(['1']);
    expect(t.outerHTML).not.toMatch(/alert/);
    expect(t.getAttribute('data-dp-niveau')).toBeNull();
  });
  it('une tuile pose la quantité (5 : 5, pas 6), le prix et le montant suivent, pas de clavier',async()=>{
    const view=await ouvrir(vide());
    await ouvrirLigne(view,'line-1');
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-cases-unite] button[data-val="pièce"]')!);
    await waitFor(()=>expect(ligne(view,'line-1').querySelector('[data-dp-tuiles-quantite]')).not.toBeNull());
    fireEvent.click(ligne(view,'line-1').querySelector<HTMLElement>('[data-dp-tuiles-quantite] button[data-val="5"]')!);
    await waitFor(()=>expect(champQte(view,'line-1').value).toBe('5'));
    expect(ligne(view,'line-1').querySelector<HTMLInputElement>('input[aria-label^="Montant ligne"]')!.value).toBe('8,90');
    expect(document.activeElement?.tagName).not.toBe('INPUT');
    const actifs=Array.from(ligne(view,'line-1').querySelectorAll<HTMLElement>('[data-dp-tuiles-quantite] button[aria-pressed="true"]')).map(b=>b.getAttribute('data-val'));
    expect(actifs).toEqual(['5']);
  });
});
