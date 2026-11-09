import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* 09.11, ses mots : « il y a des cas de figure où je peux pas annuler » ; « si je change je ltype à ingrédients, ça le fait changer de catégorie et surtout on perd du coup le focus sur l'item ». */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:()=>state.confirmed(),purchaseDuplicates:()=>[]}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Facture synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};

describe('Dépense : fermer et changer le type sans perdre la ligne',()=>{
  it('le × ferme même pendant la lecture',async()=>{
    state.scanned.mockReturnValue(new Promise(()=>{}));
    const onClose=vi.fn();
    const view=render(<ExpenseSheet onClose={onClose} onSaved={()=>{}}/>);
    joindre(view.container);
    await waitFor(()=>expect(state.scanned).toHaveBeenCalled());
    const fermer=screen.getByRole('button',{name:'Fermer'});
    expect(fermer).not.toBeDisabled();
    fireEvent.click(fermer);
    const abandon=view.container.querySelector('[data-dp-abandon-oui]') as HTMLElement|null;
    if(abandon)fireEvent.click(abandon);
    expect(onClose).toHaveBeenCalledOnce();
  });
  it('changer le type garde la ligne ouverte et le focus dessus',async()=>{
    state.scanned.mockResolvedValueOnce({ok:true,model:'gemini-3.8-flash',cached:false,result:{vendor:'Poste fictive',date:'09.11.2026',currency:'CHF',invoiceNumber:'T-1',description:'Envoi',amountHT:6.29,tvaRate:.081,tvaAmount:.51,amountTTC:6.8,category:'divers',subcategory:'Envois',issues:[] as string[],
      items:[{id:'line-1',name:'Recommandé fictif',kind:'service',quantity:1,unit:'pièce',amountTTC:6.8,evidence:'Recommandé fictif 6.80'}],review:{status:'checked',findings:[],readers:2}}});
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    joindre(view.container);
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    const ligne=()=>view.container.querySelector<HTMLElement>('[data-dp-ligne]')!;
    const id=ligne().getAttribute('data-dp-ligne');
    const plateau=ligne().querySelector('details')!;
    if(!plateau.open)fireEvent.click(plateau.querySelector('summary')!);
    const groupeAvant=ligne().getAttribute('data-dp-groupe');
    fireEvent.click(within(ligne().querySelector<HTMLElement>('[data-dp-nature]')!).getByRole('button',{name:'Ingrédient'}));
    await waitFor(()=>expect(ligne().getAttribute('data-dp-groupe')).not.toBe(groupeAvant));
    const apres=view.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`)!;
    await waitFor(()=>expect(apres.contains(document.activeElement)).toBe(true));
    expect(apres.querySelector('details')!.open).toBe(true);
    expect(within(apres.querySelector<HTMLElement>('[data-dp-nature]')!).getByRole('button',{name:'Ingrédient'})).toHaveAttribute('aria-pressed','true');
  });
});
