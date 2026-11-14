import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* h1 (14.11) : « Un doute ? Relire plus finement ». Le bouton est visible sur toute pièce lue ; un clic puis la confirmation relancent la lecture avec l'option `relecture: 'argon'`
   (un mot, jamais un nom de modèle) et remplacent le résultat ; en échec ou hors ligne la lecture actuelle reste. Lectures SIMULÉES (ticket anonymisé de t1) : Gemini n'est jamais appelé. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[]}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {lectureTicket} from './depenseTotaux.fixture';
const LIBELLE='Un doute ? Relire plus finement';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});Element.prototype.scrollIntoView=vi.fn();});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(lecture:any)=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
const bouton=(view:{container:HTMLElement})=>view.container.querySelector<HTMLButtonElement>('[data-dp-relire]')!;
const relancer=async(view:{container:HTMLElement})=>{fireEvent.click(bouton(view));fireEvent.click(await waitFor(()=>{const oui=view.container.querySelector<HTMLButtonElement>('[data-dp-relire-oui]');expect(oui).not.toBeNull();return oui!;}));};

describe('Dépense : « Un doute ? Relire plus finement » (h1)',()=>{
  it('est visible sur toute pièce lue, même sans rien à signaler, et ne nomme aucun modèle',async()=>{
    const view=await ouvrir(lectureTicket());
    expect(bouton(view).textContent).toContain(LIBELLE);
    expect(bouton(view).disabled).toBe(false);
    expect(view.container.textContent).not.toMatch(/argon|hydrogen|gemini|flash|modèle/i);
    expect(view.container.querySelector('[data-dp="relire-fin"]')!.closest('[aria-label="Vérification du justificatif"]')).not.toBeNull();
  });

  it('un clic demande confirmation (elle remplace la lecture), « Annuler » ne lance rien',async()=>{
    const view=await ouvrir(lectureTicket());
    fireEvent.click(bouton(view));
    expect(view.container.querySelector('[data-dp-etat="confirmer"]')!.textContent).toContain('remplace celle-ci');
    fireEvent.click(view.container.querySelector('[data-dp-relire-non]')!);
    expect(bouton(view)).not.toBeNull();
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });

  it('la confirmation relance la lecture avec relecture:"argon" (jamais un nom de modèle) et remplace le résultat',async()=>{
    const view=await ouvrir(lectureTicket());
    expect(view.container.textContent).toContain('Brico Fictif SA');
    state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lectureTicket({vendor:'Quincaillerie Relue SA'})});
    await relancer(view);
    await waitFor(()=>expect(view.container.textContent).toContain('Quincaillerie Relue SA'));
    expect(state.scanned).toHaveBeenCalledTimes(2);
    const [fichier,palier,options]=state.scanned.mock.calls[1];
    expect(fichier).toBeInstanceOf(File);expect(palier).toBe('fast');
    expect(options.relecture).toBe('argon');
    expect(JSON.stringify({palier,relecture:options.relecture})).not.toMatch(/gemini|hydrogen/i);
    expect(view.container.textContent).not.toContain('Brico Fictif SA');
    // La première lecture n'a pas reçu l'option.
    expect(state.scanned.mock.calls[0][2]?.relecture).toBeUndefined();
    expect(bouton(view)).not.toBeNull();
  });

  it('l’attente se dit, et la lecture actuelle reste affichée jusqu’au résultat',async()=>{
    const view=await ouvrir(lectureTicket());
    let rendre!:(v:unknown)=>void;
    state.scanned.mockReturnValueOnce(new Promise(r=>{rendre=r;}));
    await relancer(view);
    await waitFor(()=>expect(view.container.querySelector('[data-dp-etat="en-cours"]')).not.toBeNull());
    expect(view.container.textContent).toContain('Brico Fictif SA');
    expect(view.container.querySelector('[data-dp-relire]')).toBeNull();
    rendre({ok:true,model:'simule',cached:false,result:lectureTicket({vendor:'Quincaillerie Relue SA'})});
    await waitFor(()=>expect(view.container.textContent).toContain('Quincaillerie Relue SA'));
    expect(view.container.querySelector('[data-dp-etat="en-cours"]')).toBeNull();
  });

  it('échec : message clair sous le bouton, la lecture actuelle reste en place, on peut recommencer',async()=>{
    const view=await ouvrir(lectureTicket());
    state.scanned.mockResolvedValueOnce({ok:false,error:'La relecture plus fine n’a pas abouti. La lecture actuelle reste valable : vérifie-la sur l’original.'});
    await relancer(view);
    const alerte=await waitFor(()=>{const a=view.container.querySelector('[data-dp="relire-fin-erreur"]');expect(a).not.toBeNull();return a!;});
    expect(alerte.textContent).toContain('relecture plus fine n’a pas abouti');
    expect(view.container.textContent).toContain('Brico Fictif SA');
    expect(bouton(view).disabled).toBe(false);
  });

  /* L13 (décision du pilote, 14.11) : une relecture qui rend moins de lignes, ou un statut plus mauvais, ne prend pas la place de la lecture d'avant (longue pièce coupée). Rouge sans `relectureGardee`. */
  it('moins de lignes : la lecture d’avant est gardée, et c’est dit',async()=>{
    const view=await ouvrir(lectureTicket());
    const avant=view.container.querySelectorAll('[data-dp-ligne]').length;
    const courte=lectureTicket({vendor:'Quincaillerie Coupée SA'});courte.items=courte.items.slice(0,5);
    state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:courte});
    await relancer(view);
    const note=await waitFor(()=>{const n=view.container.querySelector('[data-dp="relire-fin-pas-mieux"]');expect(n).not.toBeNull();return n!;});
    expect(note.textContent).toBe('La relecture n’a pas fait mieux : lecture d’avant gardée.');
    expect(view.container.textContent).toContain('Brico Fictif SA');
    expect(view.container.textContent).not.toContain('Quincaillerie Coupée SA');
    expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBe(avant);
    expect(bouton(view).disabled).toBe(false);
  });

  it('statut plus mauvais : la lecture d’avant est gardée, et c’est dit',async()=>{
    const view=await ouvrir(lectureTicket());
    state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lectureTicket({vendor:'Quincaillerie Contestée SA',review:{status:'disputed',findings:[],readers:3}})});
    await relancer(view);
    await waitFor(()=>expect(view.container.querySelector('[data-dp="relire-fin-pas-mieux"]')).not.toBeNull());
    expect(view.container.textContent).toContain('Brico Fictif SA');
    expect(view.container.textContent).not.toContain('Quincaillerie Contestée SA');
  });

  it('hors ligne : le bouton est grisé et dit pourquoi, aucune requête',async()=>{
    const view=await ouvrir(lectureTicket());
    act(()=>{vi.spyOn(navigator,'onLine','get').mockReturnValue(false);window.dispatchEvent(new Event('offline'));});
    await waitFor(()=>expect(bouton(view).disabled).toBe(true));
    expect(bouton(view).title).toContain('Hors ligne');
    fireEvent.click(bouton(view));
    expect(view.container.querySelector('[data-dp-relire-oui]')).toBeNull();
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });
});
