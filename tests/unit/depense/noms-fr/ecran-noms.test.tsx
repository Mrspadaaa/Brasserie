// @vitest-environment jsdom
/**
 * D280 : le français des noms arrive après la lecture, sans l'attendre, et ne s'affiche que sur la rangée.
 * `traduireLignes` est simulé (aucun appel IA) ; la lecture aussi (geminiScanner).
 */
import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
const state=vi.hoisted(()=>({scanned:vi.fn(),traduire:vi.fn(),retenir:vi.fn()}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],confirmPendingWrites:async()=>undefined}}));
vi.mock('../../../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false}));
vi.mock('../../../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../../../src/services/nomsFr',()=>({traduireLignes:(...args:any[])=>state.traduire(...args),retenirNomBrasseur:(...args:any[])=>state.retenir(...args)}));
import {ExpenseSheet} from '../../../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../../../src/services/firebaseAuth';

const lecture={vendor:'Fournisseur fictif',date:'09.09.2026',currency:'CHF',invoiceNumber:'TEST-NOMS',description:'Malts',amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:30,category:'matieres',subcategory:'Malt',issues:[] as string[],
  items:[{id:'line-1',name:'Wiener Malz',kind:'stock',quantity:5,unit:'Kg',amountTTC:20,stockCategory:'malt'},{id:'line-2',name:'Melanoidin Malz',kind:'stock',quantity:2,unit:'Kg',amountTTC:10,stockCategory:'malt'}]};

async function ouvrir(){
  Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
  vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);
  state.scanned.mockResolvedValueOnce({ok:true,result:lecture,model:'gemini-3.8-flash',cached:false});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  const file=new File(['%PDF-1.4\n'],'Facture synthétique.pdf',{type:'application/pdf'});
  Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
  fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  return view;
}
const noms=(view:ReturnType<typeof render>)=>[...view.container.querySelectorAll('[data-dp-nom]')].map(n=>n.textContent);

beforeEach(()=>{cleanup();vi.restoreAllMocks();state.scanned.mockReset();state.traduire.mockReset();state.retenir.mockReset();
  vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();});

describe('D280 — le français des noms sur les rangées',()=>{
  it('part après la lecture avec les noms imprimés, puis remplace le nom de chaque rangée par son rang',async()=>{
    let rendre!:(m:Map<number,string>)=>void;
    state.traduire.mockReturnValueOnce(new Promise(r=>{rendre=r;}));
    const view=await ouvrir();
    expect(noms(view).join('|')).toMatch(/Wiener Malz/u); // la lecture s'affiche sans attendre la traduction
    expect(state.traduire).toHaveBeenCalledTimes(1);
    const [lignes,options]=state.traduire.mock.calls[0];
    expect(lignes.map((l:any)=>l.name)).toEqual(['Wiener Malz','Melanoidin Malz']);
    expect(options).toMatchObject({enLigne:navigator.onLine});
    rendre(new Map([[0,'Malt de Vienne'],[1,'Malt mélanoïdine']]));
    await waitFor(()=>expect(noms(view).join('|')).toMatch(/Malt de Vienne/u));
    expect(noms(view).join('|')).toMatch(/Malt mélanoïdine/u);
    expect(noms(view).join('|')).not.toMatch(/Wiener Malz/u);
  });

  it('une traduction vide ou en échec laisse le nom imprimé',async()=>{
    state.traduire.mockResolvedValueOnce(new Map());
    const view=await ouvrir();
    await waitFor(()=>expect(state.traduire).toHaveBeenCalledTimes(1));
    expect(noms(view).join('|')).toMatch(/Wiener Malz/u);
  });

  it('le nom français passe par le même nettoyage que le nom imprimé (® retiré ; doc14 : « CARABELGE® » revenait)',async()=>{
    state.traduire.mockResolvedValueOnce(new Map([[0,'Malt de Vienne®'],[1,'Malt mélanoïdine']]));
    const view=await ouvrir();
    await waitFor(()=>expect(noms(view).join('|')).toMatch(/Malt de Vienne/u));
    expect(noms(view).join('|')).not.toMatch(/®/u);
  });
});
