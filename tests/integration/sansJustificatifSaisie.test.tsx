// @vitest-environment jsdom
import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:()=>state.confirmed(),purchaseDuplicates:()=>[]}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
/* Brasseur, 18.11 : « cette coche peut être utilisé lors que l'entrée d'une facture à la main aussi ». */
beforeEach(()=>{cleanup();state.saved.mockReset();state.confirmed.mockReset().mockResolvedValue(undefined);});
describe('Saisie à la main : « Sans justificatif, c’est normal »',()=>{
  it('la coche part avec la dépense saisie sans document',async()=>{
    render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    const coche=screen.getByRole('checkbox',{name:/Sans justificatif, c’est normal/});
    expect(coche).not.toBeChecked();
    fireEvent.click(coche);
    expect(coche).toBeChecked();
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'12,50'}});
    fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    const pourQuoi=screen.getByLabelText('Pour quoi ?');
    if(pourQuoi.getAttribute('contenteditable')){pourQuoi.textContent='ZZ TEST — parking';fireEvent.input(pourQuoi);}else fireEvent.change(pourQuoi,{target:{value:'ZZ TEST — parking'}});
    fireEvent.click(screen.getAllByRole('button',{name:/^(Enregistrer|Enregistrer la dépense|Confirmer et enregistrer)$/}).at(-1)!);
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[0][0]).toMatchObject({proofNotNeeded:true});
  });
});
