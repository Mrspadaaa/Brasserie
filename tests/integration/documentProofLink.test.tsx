import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const state=vi.hoisted(()=>({load:vi.fn()}));
vi.mock('../../src/services/financeDocuments',()=>({loadFinanceDocument:(id:string)=>state.load(id)}));
vi.mock('../../src/ui/Sheet',()=>({Sheet:({children,footer}:any)=><div role="dialog">{children}{footer}</div>}));
import {DocumentProofLink} from '../../src/ui/finance/DocumentProofLink';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
const tx=(id:string)=>({id,finance:{proofDocumentId:`proof-${id}`}} as any);
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.load.mockReset();});
describe('Consultation des originaux de dépense',()=>{
  it('propose de reconnecter Drive uniquement pour une erreur d’authentification et recharge après le clic',async()=>{
    const refresh=vi.spyOn(FirebaseAuthService,'refreshDriveAccess').mockResolvedValue({success:true});
    vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(false);vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue(null);vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();
    state.load.mockRejectedValueOnce(Object.assign(Error('Reconnecte Drive.'),{code:'drive/auth-required'})).mockResolvedValue({dataUrl:'https://example.test/proof.pdf',fileName:'Original.pdf',mimeType:'application/pdf'});
    render(<DocumentProofLink transaction={tx('reconnect')}/>);
    fireEvent.click(screen.getByRole('button',{name:'Justificatif'}));
    await screen.findByRole('alert');
    expect(refresh).not.toHaveBeenCalled();
    await waitFor(()=>expect(screen.getByRole('button',{name:'Connecter Drive'})).toBeEnabled());fireEvent.click(screen.getByRole('button',{name:'Connecter Drive'}));
    await screen.findByTitle('Original.pdf');
    expect(refresh).toHaveBeenCalledOnce();expect(state.load).toHaveBeenCalledTimes(2);
  });
  it('n’invite pas à reconnecter Google pour une intégrité invalide ou un ancien fichier manquant',async()=>{
    state.load.mockRejectedValue(Object.assign(Error('Le contenu ne correspond plus à l’original.'),{code:'drive/integrity'}));
    render(<DocumentProofLink transaction={tx('modified')}/>);
    fireEvent.click(screen.getByRole('button',{name:'Justificatif'}));
    await screen.findByRole('alert');
    expect(screen.queryByRole('button',{name:/Connecter Drive|Renouveler la connexion Drive/})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:'Réessayer le chargement'})).toBeInTheDocument();
  });
  it('ne charge le justificatif qu’à la demande et garde son téléchargement disponible',async()=>{
    state.load.mockResolvedValue({dataUrl:'https://example.test/receipt.pdf',fileName:'Facture malt.pdf',mimeType:'application/pdf'});
    render(<DocumentProofLink transaction={tx('malt')}/>);expect(state.load).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Justificatif'}));
    await waitFor(()=>expect(screen.getByTitle('Facture malt.pdf')).toHaveAttribute('src','https://example.test/receipt.pdf'));
    expect(screen.getByRole('link',{name:'Ouvrir ou télécharger'})).toHaveAttribute('download','Facture malt.pdf');
    expect(state.load).toHaveBeenCalledExactlyOnceWith('proof-malt');
  });
  it('ne montre pas le document précédent si l’achat change pendant son chargement',async()=>{
    let finish:(value:any)=>void=()=>{};
    state.load.mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;})).mockResolvedValue({dataUrl:'https://example.test/new.pdf',fileName:'Nouvel achat.pdf',mimeType:'application/pdf'});
    const view=render(<DocumentProofLink transaction={tx('old')}/>);
    fireEvent.click(screen.getByRole('button',{name:'Justificatif'}));view.rerender(<DocumentProofLink transaction={tx('new')}/>);
    fireEvent.click(screen.getByRole('button',{name:'Justificatif'}));
    await waitFor(()=>expect(screen.getByTitle('Nouvel achat.pdf')).toBeInTheDocument());
    finish({dataUrl:'https://example.test/old.pdf',fileName:'Ancien achat.pdf',mimeType:'application/pdf'});
    await waitFor(()=>expect(screen.queryByTitle('Ancien achat.pdf')).not.toBeInTheDocument());
  });
});
