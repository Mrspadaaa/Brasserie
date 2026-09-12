import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProof:async(draft:any)=>{await state.saved(draft);return 'TX-test';},confirmPurchase:()=>state.confirmed(),purchaseDuplicates:()=>[]}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset().mockResolvedValue({ok:false,error:'Lecture indisponible. Saisie manuelle possible.'});vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();state.confirmed.mockReset().mockResolvedValue(undefined);});
const scannedInvoice=(review?:Record<string,unknown>)=>({vendor:'Fournisseur fictif',date:'09.09.2026',currency:'CHF',invoiceNumber:'TEST-VISION',description:'Fermenteur et entretien',amountHT:508.79,tvaRate:.081,tvaAmount:41.21,amountTTC:550,category:'materiel',subcategory:'Brasserie',issues:[] as string[],review,
  items:[{id:'line-1',name:'Fermenteur 30 L',kind:'equipment',quantity:1,unit:'pièce',amountTTC:500,evidence:'Fermenteur 30 L — CHF 500.00'},{id:'line-2',name:'Entretien de pompe',kind:'maintenance',quantity:1,unit:'pièce',amountTTC:50,evidence:'Entretien de pompe — CHF 50.00'}]});
async function openScannedInvoice(result:ReturnType<typeof scannedInvoice>,cached=false){
  Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
  vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);
  state.scanned.mockResolvedValueOnce({ok:true,result,model:'gemini-3.8-flash',cached});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  const file=new File(['%PDF-1.4\n'],'Facture synthétique.pdf',{type:'application/pdf'});
  Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
  fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  return view;
}

describe('Lecture et vérification visuelle du justificatif',()=>{
  it('préremplit un bordereau synthétique, signale la somme proposée et conserve le mois du paiement',async()=>{
    const result=scannedInvoice({status:'disputed',findings:['Total TTC absent.'],readers:2});
    Object.assign(result,{documentType:'delivery_note',date:'31.08.2020',amountTTC:null,amountHT:null,tvaAmount:null,tvaRate:null,category:'divers',invoiceNumber:'',orderNumber:'COMMANDE-TEST',fieldWarnings:[{field:'amountTTC',message:'Total non imprimé.'}]});
    result.items=result.items.map((item,index)=>({...item,name:`Article fictif ${index+1}`,kind:'other',amountTTC:index?20:40,reference:`REF-TEST-${index+1}`,variant:'Taille test'}));
    const view=await openScannedInvoice(result);
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('60');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveAccessibleDescription(expect.stringContaining('Somme des 2 lignes'));
    fireEvent.focus(screen.getByLabelText('Total TTC en CHF'));fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveAccessibleDescription(expect.stringContaining('Somme des 2 lignes'));
    expect(screen.getByRole('button',{name:'Déjà payé'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText('Payé le 31.08.2020')).toBeVisible();
    const dateSummary=Array.from(view.container.querySelectorAll('summary')).find(node=>node.textContent?.startsWith('Achat du'))!;
    fireEvent.click(dateSummary);
    const datePanel=within(dateSummary.parentElement!);
    expect(datePanel.getByRole('button',{name:'Hier',exact:true})).toBeVisible();
    expect(datePanel.getByRole('button',{name:'Aujourd’hui',exact:true})).toBeVisible();
    expect(datePanel.getByRole('button',{name:'Demain',exact:true})).toBeVisible();
    fireEvent.change(screen.getByLabelText('Mois — Date de l’achat'),{target:{value:'2020-07'}});
    expect(screen.getByLabelText('Date de l’achat')).toHaveValue('2020-07-31');
    expect(screen.getByText('Payé le 31.07.2020')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[0][0]).toMatchObject({amount:60,date:'31.07.2020',paymentDate:'31.07.2020',paymentStatus:'paid',sourceAmount:undefined,sourceTotalBasis:'line_sum',sourceDocumentType:'delivery_note',sourceOrderNumber:'COMMANDE-TEST',lines:[{kind:'other',description:'Article fictif 1 · Taille test',sourceReference:'REF-TEST-1',stockAction:'none',equipmentAction:'none'},{kind:'other',stockAction:'none',equipmentAction:'none'}]});
    expect(state.scanned).toHaveBeenCalledOnce();
  });
  it('respecte la mention à payer et ne crée pas une dépense pour un avoir',async()=>{
    const result=scannedInvoice({status:'checked',findings:[],readers:2});
    Object.assign(result,{documentType:'credit_note',paymentEvidence:'unpaid'});
    await openScannedInvoice(result);
    expect(screen.getByRole('button',{name:'À payer',exact:true})).toHaveAttribute('aria-pressed','true');
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    expect(screen.getByRole('alert')).toHaveTextContent('Ce document est un avoir');
    expect(state.saved).not.toHaveBeenCalled();
  });
  it('conserve un échec de lecture visible même si Drive est déjà connecté',async()=>{
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    const file=new File(['%PDF-test'],'illisible.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-test').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Lecture indisponible'));
    await waitFor(()=>expect(FirebaseAuthService.ensureDriveAccessToken).toHaveBeenCalled());
    expect(screen.getByRole('alert')).toHaveTextContent('Lecture indisponible');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('');
    expect(state.saved).not.toHaveBeenCalled();expect(state.scanned).toHaveBeenCalledOnce();
  });
  it('ne conserve pas les anciens montants si une nouvelle facture reste illisible',async()=>{
    const view=await openScannedInvoice(scannedInvoice({status:'checked',findings:[],readers:2}));
    const file=new File(['%PDF-second'],'autre-facture.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-second').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('');
    expect(screen.getByLabelText('Pour quoi ?')).toHaveValue('');
    expect(state.saved).not.toHaveBeenCalled();
  });
  it.each([
    ['checked','Lecture vérifiée'],['corrected','Corrections proposées'],['disputed','Lecture à confirmer'],['unavailable','Vérification incomplète'],[undefined,'Vérification incomplète']
  ])('présente honnêtement le statut %s sans créer d’achat, de stock ni de matériel',async(status,title)=>{
    await openScannedInvoice(scannedInvoice(status?{status,readers:status==='corrected'?3:2,findings:[],correctedFields:status==='corrected'?['amountTTC','items[1].kind']:[]}:undefined));
    expect(screen.getByText(title!)).toBeInTheDocument();
    expect(screen.getByLabelText('Nature ligne 1')).toHaveValue('equipment');
    expect(screen.getByLabelText('Nature ligne 2')).toHaveValue('maintenance');
    expect(screen.getByLabelText('Matériel ligne 1')).toHaveValue('none');
    expect(screen.getByLabelText('Matériel ligne 2')).toHaveValue('none');
    expect(state.saved).not.toHaveBeenCalled();
    if(status==='corrected')expect(screen.getByLabelText('Total TTC en CHF')).toHaveAccessibleDescription(expect.stringContaining('Valeur corrigée'));
  });
  it('conserve les divergences et ambiguïtés dans la revue, sans répéter les avertissements',async()=>{
    const result=scannedInvoice({status:'disputed',findings:['Le montant de la deuxième ligne reste illisible.'],readers:3});
    result.issues=['Le montant de la deuxième ligne reste illisible.'];
    Object.assign(result.items[1],{ambiguity:'Réparation ou pièce de rechange à confirmer.'});
    await openScannedInvoice(result,true);
    fireEvent.click(screen.getByLabelText('Détails de la lecture'));
    expect(screen.getAllByText('Le montant de la deuxième ligne reste illisible.')).toHaveLength(1);
    expect(screen.getByText('Lecture déjà disponible · aucun nouvel appel IA.')).toBeInTheDocument();
    expect(screen.getByText('Entretien de pompe : Réparation ou pièce de rechange à confirmer.')).toBeVisible();
    expect(screen.getByRole('button',{name:'Confirmer et enregistrer'})).toBeEnabled();
    expect(state.saved).not.toHaveBeenCalled();
  });
  it('lit dès le choix du fichier et attend une confirmation explicite des valeurs corrigées',async()=>{
    await openScannedInvoice(scannedInvoice({status:'checked',findings:[],readers:2}));
    expect(state.scanned).toHaveBeenCalledOnce();expect(state.saved).not.toHaveBeenCalled();
    expect(screen.queryByRole('button',{name:'Remplir depuis le justificatif'})).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'555'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Montant ligne 1'),{target:{value:'505'}});fireEvent.blur(screen.getByLabelText('Montant ligne 1'));
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.scanned).toHaveBeenCalledOnce();
    expect(state.saved.mock.calls[0][0]).toMatchObject({amount:555,proofFileName:'Facture synthétique.pdf',lines:[{kind:'equipment',equipmentAction:'none'},{kind:'maintenance',equipmentAction:'none'}]});
  });
});

describe('Saisie quotidienne et reprise sans doublon',()=>{
  it('ouvre uniquement la TVA fautive et efface le message dès sa correction',()=>{
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'50'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Achat fictif'}});
    const vat=screen.getByLabelText('TVA source (CHF)');
    fireEvent.change(vat,{target:{value:'60'}});fireEvent.blur(vat);
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    expect(screen.getByRole('alert')).toHaveTextContent('Vérifie le montant de TVA');
    expect(vat).toHaveFocus();expect(vat.closest('details')).toHaveAttribute('open');
    expect(view.container.querySelectorAll('details[data-purchase-options][open]')).toHaveLength(0);
    fireEvent.change(vat,{target:{value:'0'}});fireEvent.blur(vat);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();expect(state.saved).not.toHaveBeenCalled();
  });
  it('garde la facture et les montants après révocation Drive, sans relancer la lecture à la reconnexion',async()=>{
    Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
    vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(false);vi.mocked(FirebaseAuthService.ensureDriveAccessToken).mockResolvedValue(null);
    const refresh=vi.spyOn(FirebaseAuthService,'refreshDriveAccess').mockResolvedValue({success:true});
    state.saved.mockRejectedValueOnce(Object.assign(Error('La connexion Google Drive a expiré.'),{code:'drive/auth-required'}));
    const onSaved=vi.fn(),view=render(<ExpenseSheet onClose={()=>{}} onSaved={onSaved}/>);
    const file=new File(['%PDF-1.4\n'],'Facture malt.pdf',{type:'application/pdf'});
    Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});
    fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
    await screen.findByRole('button',{name:'Connecter Drive'});
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'125'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Malt Pale Ale'}});
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    await screen.findByRole('alert');
    expect(onSaved).not.toHaveBeenCalled();expect(refresh).not.toHaveBeenCalled();expect(state.scanned).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Pour quoi ?')).toHaveValue('Malt Pale Ale');
    fireEvent.click(screen.getByRole('button',{name:'Connecter Drive'}));
    await waitFor(()=>expect(refresh).toHaveBeenCalledOnce());
    expect(state.saved).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[1][0]).toMatchObject({amount:125,proofFileName:'Facture malt.pdf',proofDataUrl:'data:application/pdf;base64,JVBERi0xLjQK'});
  });
  it('saisit le matériel une fois et conserve ses valeurs en ajoutant les frais de livraison',async()=>{
    render(<ExpenseSheet initialIntent="equipment" onClose={()=>{}} onSaved={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'500'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Fermenteur 30 L'}});
    expect(screen.queryByLabelText('Libellé ligne 1')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Montant ligne 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Ajouter une ligne'}));
    expect(screen.getByLabelText('Libellé ligne 1')).toHaveValue('Fermenteur 30 L');
    expect(Number((screen.getByLabelText('Montant ligne 1') as HTMLInputElement).value)).toBe(500);
    expect(screen.getByLabelText('Matériel ligne 1')).toHaveValue('new');
    fireEvent.change(screen.getByLabelText('Libellé ligne 2'),{target:{value:'Livraison'}});
    fireEvent.change(screen.getByLabelText('Nature ligne 2'),{target:{value:'shipping'}});
    fireEvent.change(screen.getByLabelText('Montant ligne 2'),{target:{value:'25'}});fireEvent.blur(screen.getByLabelText('Montant ligne 2'));
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'525'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[0][0]).toMatchObject({amount:525,description:'Fermenteur 30 L',lines:[{description:'Fermenteur 30 L',amount:500,kind:'equipment',equipmentAction:'new'},{description:'Livraison',amount:25,kind:'shipping',stockAction:'none'}]});
    expect(state.scanned).not.toHaveBeenCalled();
  });
  it('préclasse un achat simple et conserve le type choisi explicitement par le brasseur',()=>{
    render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Catégorie'),{target:{value:'nettoyage'}});
    expect(screen.getByLabelText('Nature ligne 1')).toHaveValue('cleaning');
    expect(screen.getByLabelText('Stock ligne 1')).toHaveValue('none');
    fireEvent.change(screen.getByLabelText('Nature ligne 1'),{target:{value:'maintenance'}});
    fireEvent.change(screen.getByLabelText('Catégorie'),{target:{value:'materiel'}});
    expect(screen.getByLabelText('Nature ligne 1')).toHaveValue('maintenance');
    expect(screen.getByLabelText('Matériel ligne 1')).toHaveValue('none');
  });
  it('ouvre directement le formulaire, corrige les erreurs sans ouvrir les options et enregistre une seule fois',async()=>{
    const onSaved=vi.fn();render(<React.StrictMode><ExpenseSheet onClose={()=>{}} onSaved={onSaved}/></React.StrictMode>);
    expect(screen.getByLabelText('Total TTC en CHF')).toBeVisible();
    expect(screen.queryByRole('button',{name:'Saisir sans justificatif'})).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    expect(screen.getByRole('alert')).toHaveTextContent('Décris cette dépense');expect(state.saved).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Pour quoi ?')).toHaveFocus();
    expect(document.querySelectorAll('details[data-purchase-options][open]')).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'34,50'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Malt pour le prochain brassin'}});
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(document.querySelectorAll('details[data-purchase-options][open]')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce());
    expect(state.saved).toHaveBeenCalledOnce();expect(state.saved.mock.calls[0][0]).toMatchObject({amount:34.5,paymentStatus:'paid',lines:[{stockAction:'none'}]});expect(state.scanned).not.toHaveBeenCalled();
  });
  it('prépare une fiche équipement seulement quand ce parcours a été demandé',()=>{
    render(<ExpenseSheet initialIntent="equipment" onClose={()=>{}} onSaved={()=>{}}/>);
    expect(screen.getByRole('dialog')).toHaveAccessibleName('Acheter du matériel');expect(screen.getByLabelText('Matériel ligne 1')).toHaveValue('new');expect(state.saved).not.toHaveBeenCalled();expect(state.scanned).not.toHaveBeenCalled();
  });
  it.each(['pending','rejected'])('garde le brouillon après %s et réémet uniquement un refus certain',async(status)=>{
    state.confirmed.mockRejectedValueOnce({status,message:'Confirmation ciblée impossible'});const onSaved=vi.fn();render(<ExpenseSheet onClose={()=>{}} onSaved={onSaved}/>);
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'40'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Malt test reprise'}});fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('Confirmation ciblée'));expect(onSaved).not.toHaveBeenCalled();expect(state.saved).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button',{name:status==='rejected'?'Enregistrer la dépense':'Vérifier la synchronisation'}));await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce());
    expect(state.saved).toHaveBeenCalledTimes(status==='rejected'?2:1);if(status==='rejected')expect(state.saved.mock.calls[1][0]).toEqual(state.saved.mock.calls[0][0]);
  });
});
