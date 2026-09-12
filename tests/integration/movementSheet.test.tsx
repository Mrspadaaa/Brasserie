import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const state=vi.hoisted(()=>({transactions:[] as any[],payments:[] as any[],saved:vi.fn(),put:vi.fn(),confirmed:vi.fn()}));
vi.mock('../../src/ui/Sheet',()=>({Sheet:({children,footer}:any)=><div role="dialog">{children}{footer}</div>}));
vi.mock('../../src/services/storage',()=>({StorageService:{getTransactions:()=>state.transactions,addTransaction:(tx:any)=>{state.transactions.push(tx);state.saved(tx);},confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected',FirestoreRepo:{documentWriteState:()=>({status:'unknown'}),waitForDocument:()=>state.confirmed(),all:(name:string)=>name==='financialPayments'?state.payments:[],put:(...args:any[])=>state.put(...args)}}));
import {MovementSheet} from '../../src/ui/finance/MovementSheet';
const original=()=>({id:'TX-ORIGINAL',date:'2026-01-01',description:'Commande malt',category:'brassage',subcategory:'Malt',amountHT:100,amountTTC:100,tvaAmount:0,tvaRate:0,finance:{version:1,kind:'expense',amountCents:10000,lines:[],paymentStatus:'unpaid'}} as any);
beforeEach(()=>{cleanup();state.transactions=[original()];state.payments=[];state.saved.mockReset();state.put.mockReset();state.confirmed.mockReset().mockResolvedValue(undefined);});
const enter=(application='offset')=>{
  fireEvent.change(screen.getByLabelText('Comment appliquer cet avoir ?'),{target:{value:application}});
  fireEvent.change(screen.getByLabelText('Montant (CHF)'),{target:{value:'80'}});fireEvent.blur(screen.getByLabelText('Montant (CHF)'));
  fireEvent.change(screen.getByLabelText('Motif'),{target:{value:'Avoir fournisseur'}});
};
describe('Avoir : contrôle courant et confirmation de synchronisation',()=>{
  it('ne recrée pas l’avoir après timeout et ne lui ajoute aucun paiement fictif',async()=>{
    state.confirmed.mockRejectedValueOnce(new Error('Confirmation serveur en attente'));
    const onSaved=vi.fn();render(<React.StrictMode><MovementSheet original={state.transactions[0]} onClose={()=>{}} onSaved={onSaved}/></React.StrictMode>);enter();
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Confirmation serveur'));
    expect(state.saved).toHaveBeenCalledOnce();expect(state.saved.mock.calls[0][0].finance).toMatchObject({refundApplication:'offset',amountCents:8000});expect(state.put).not.toHaveBeenCalled();expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Vérifier la synchronisation'}));await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce());expect(state.saved).toHaveBeenCalledOnce();
  });
  it('relit l’original au moment d’enregistrer et refuse celui annulé pendant la saisie',async()=>{
    render(<MovementSheet original={state.transactions[0]} onClose={()=>{}} onSaved={()=>{}}/>);enter();state.transactions=[{...original(),finance:{...original().finance,voidedAt:'2026-01-02T00:00:00Z'}}];
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('existante et active'));
    expect(state.saved).not.toHaveBeenCalled();expect(state.put).not.toHaveBeenCalled();
  });
  it('enregistre un paiement uniquement si le remboursement d’argent est confirmé',async()=>{
    render(<MovementSheet original={state.transactions[0]} onClose={()=>{}} onSaved={()=>{}}/>);enter('cash');
    fireEvent.click(screen.getByLabelText('L’argent a réellement été remboursé à cette date.'));
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.put).toHaveBeenCalledExactlyOnceWith('financialPayments',expect.any(String),expect.objectContaining({direction:'in',amountCents:8000}));
  });
  it('permet de reprendre le même avoir après un vrai refus du serveur',async()=>{
    state.confirmed.mockRejectedValueOnce({status:'rejected',message:'Écriture refusée et absente du serveur'});
    const onSaved=vi.fn();render(<MovementSheet original={state.transactions[0]} onClose={()=>{}} onSaved={onSaved}/>);enter();fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('refusée'));expect(onSaved).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce());expect(state.saved).toHaveBeenCalledTimes(2);expect(state.saved.mock.calls[1][0].id).toBe(state.saved.mock.calls[0][0].id);
  });
});
