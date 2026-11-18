import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* d2, P4 du banc b1 (09.11) : sur l'écran Dépense, un rabais se rattache à l'article du dessus (même bande), s'appelle « Rabais » (jamais le libellé de taxe imprimé) et n'est pas compté comme article.
   Lecture SIMULÉE de Sun Store 2, noms fictifs : 3 articles (matériel, matériel, service) et 2 rabais ; 151,83 − 2,58 = 149,25. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});Element.prototype.scrollIntoView=vi.fn();});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};

const LIGNES:Array<[string,string,number]>=[['VACCIN FICTIF A','equipment',82.33],['NoVatTax - 0%','discount',-1.29],['VACCIN FICTIF B','equipment',19.5],['H21 CONSULTATION','service',50],['NoVatTax - 0%','discount',-1.29]];
const lecture=()=>({
  vendor:'Clinique Fictive SA',date:'02.11.2026',currency:'CHF',invoiceNumber:'',description:'Soins',category:'divers',subcategory:'',amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:79.62,issues:[] as string[],
  items:LIGNES.map(([name,kind,amount],i)=>({id:`line-${i+1}`,name,kind,quantity:1,unit:'pièce',price:amount,amountTTC:amount,reference:'',evidence:`${name} ${amount.toFixed(2)}`})),
  paymentEvidence:'paid',paymentMethod:'twint',printedLineCount:5,countedAmounts:5,review:{status:'checked',findings:[],readers:3},
  controls:{lines:{checked:5,failed:0,skipped:0,skippedIds:[] as string[]},sum:{statut:'ok',base:'TTC'},vat:{statut:'non-verifiable',base:'TTC'},totals:{statut:'non-verifiable'}},
});
const ouvrir=async()=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture()});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBe(5));
  return view;
};
const lignes=(view:{container:HTMLElement})=>Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-ligne]'));
const nom=(e:HTMLElement)=>e.querySelector('[data-dp-nom]')?.textContent??'';

describe('Dépense : un rabais (P4 du banc b1)',()=>{
  it('s’appelle « Rabais », jamais le libellé de taxe imprimé',async()=>{
    const view=await ouvrir();
    const noms=lignes(view).map(nom);
    expect(noms.filter(n=>n==='Rabais')).toHaveLength(2);
    expect(noms.some(n=>/NoVatTax/.test(n))).toBe(false);
  });
  it('se range dans la bande de l’article du dessus : A et son rabais ensemble, B et son rabais (consultation) ensemble',async()=>{
    const view=await ouvrir();
    const par=Object.fromEntries(lignes(view).map((e,i)=>[i,e.getAttribute('data-dp-groupe')]));
    expect(par[1]).toBe(par[0]);
    expect(par[4]).toBe(par[3]);
    expect(par[0]).not.toBe(par[3]);
  });
  it('n’est pas compté comme article : « 3 · 2 rabais » dans les contrôles',async()=>{
    const view=await ouvrir();
    const articles=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp="preuve"] [data-dp="controle"]')).find(e=>/Articles/.test(e.textContent??''))!;
    expect(articles.textContent).toMatch(/3 · 2 rabais/);
  });
  it('ne compte jamais en pièces : l’en-tête de la bande dit 3 pièces (A, B, la consultation), pas 5 ; la rangée n’a ni quantité ni picto d’article',async()=>{
    const view=await ouvrir();
    const entetes=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-bande-entete]')).map(e=>e.textContent??'');
    /* « Matériel de brassage », pastille 3 (A, son rabais, B), puis « 2 pièces » : A et B ; le rabais n'y est pas. Service : 1 pièce (la consultation). */
    expect(entetes[0]).toMatch(/^Matériel de brassage3\s*2 pièces/);
    expect(entetes.join(' | ')).toMatch(/1 pièce/);
    for(const e of lignes(view).filter(l=>nom(l)==='Rabais')){
      expect(e.querySelector('[data-dp-qte]')?.textContent??'').toBe('');
      expect(e.querySelector('[data-dp-lien]')).toBeNull();
      expect(e.getAttribute('data-dp-rabais')).toBe('1');
    }
  });
});
