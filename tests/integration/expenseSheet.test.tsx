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
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset().mockResolvedValue({ok:false,error:'Lecture indisponible. Saisie manuelle possible.'});vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();state.confirmed.mockReset().mockResolvedValue(undefined);});
const scannedInvoice=(review?:Record<string,unknown>)=>({vendor:'Fournisseur fictif',date:'09.09.2026',currency:'CHF',invoiceNumber:'TEST-VISION',description:'Fermenteur et entretien',amountHT:508.79,tvaRate:.081,tvaAmount:41.21,amountTTC:550,category:'materiel',subcategory:'Brasserie',issues:[] as string[],review,
  items:[{id:'line-1',name:'Fermenteur 30 L',kind:'equipment',quantity:1,unit:'pièce',amountTTC:500,evidence:'Fermenteur 30 L — CHF 500.00'},{id:'line-2',name:'Entretien de pompe',kind:'maintenance',quantity:1,unit:'pièce',amountTTC:50,evidence:'Entretien de pompe — CHF 50.00'}]});
/** La nature allumée d'une ligne : le mot pressé du segment « Type d’achat, ligne n » (D335). */
const nature=(n:number)=>within(screen.getByRole('group',{name:`Type d’achat, ligne ${n}`})).getAllByRole('button').find(b=>b.getAttribute('aria-pressed')==='true')?.textContent;
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
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('60,00');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveAccessibleDescription(expect.stringContaining('Somme des 2 lignes'));
    fireEvent.focus(screen.getByLabelText('Total TTC en CHF'));fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveAccessibleDescription(expect.stringContaining('Somme des 2 lignes'));
    expect(screen.getByRole('button',{name:'Déjà payé'})).toHaveAttribute('aria-pressed','true');
    expect(screen.getByText('Payé le 31.08.2020')).toBeVisible();
    const dateSummary=view.container.querySelector('[data-purchase-date] summary')!; // la rubrique « Date de l’achat » (p3c-3)
    fireEvent.click(dateSummary);
    const datePanel=within(dateSummary.parentElement!);
    // D262b : « Aujourd'hui · Mois passé · Mois suivant », dans cet ordre ; ni « Hier » ni « Demain ».
    expect(datePanel.getAllByRole('button').filter(b=>['Aujourd’hui','Mois passé','Mois suivant','Hier','Demain'].includes(b.textContent??'')).map(b=>b.textContent)).toEqual(['Aujourd’hui','Mois passé','Mois suivant']);
    fireEvent.change(screen.getByLabelText('Mois — Date de l’achat'),{target:{value:'2020-07'}});
    expect(screen.getByLabelText('Date de l’achat')).toHaveValue('2020-07-31');
    expect(screen.getByText('Payé le 31.07.2020')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[0][0]).toMatchObject({amount:60,date:'31.07.2020',paymentDate:'31.07.2020',paymentStatus:'paid',sourceAmount:undefined,sourceTotalBasis:'line_sum',sourceDocumentType:'delivery_note',sourceOrderNumber:'COMMANDE-TEST',lines:[{kind:'other',description:'Article fictif 1 · Taille test',sourceReference:'REF-TEST-1',stockAction:'none',equipmentAction:'none'},{kind:'other',stockAction:'none',equipmentAction:'none'}]});
    expect(state.scanned).toHaveBeenCalledOnce();
  });
  it('AM-73 : un paiement daté avant la pièce avertit, il ne refuse pas (un acompte est légitime)',async()=>{
    const view=await openScannedInvoice(scannedInvoice({status:'checked',findings:[],readers:2}));
    expect(view.container.querySelector('[data-dp="paye-avant"]')).toBeNull();
    fireEvent.click(screen.getByRole('button',{name:'Autre date'}));
    fireEvent.change(screen.getByLabelText('Date du paiement'),{target:{value:'2026-09-01'}});
    const avertissement=view.container.querySelector('[data-dp="paye-avant"]');
    expect(avertissement).not.toBeNull();expect(avertissement).toHaveTextContent('acompte');
    fireEvent.click(screen.getByRole('button',{name:'Confirmer et enregistrer'}));
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[0][0]).toMatchObject({date:'09.09.2026',paymentDate:'01.09.2026',paymentStatus:'paid'});
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
  /* T1 : une lecture SANS `points` (ancien format, cache d'avant le déploiement) n'est jamais « vérifiée » : c'est le plancher de l2, « à confirmer ».
     Seul le nouveau format (points + controls) peut dire « Lecture vérifiée » ou « Corrections proposées » (cas ci-dessous). */
  it.each([
    ['checked','Lecture à confirmer'],['corrected','Lecture à confirmer'],['disputed','Lecture à confirmer'],['unavailable','Vérification incomplète'],[undefined,'Vérification incomplète']
  ])('présente honnêtement le statut %s sans créer d’achat, de stock ni de matériel',async(status,title)=>{
    await openScannedInvoice(scannedInvoice(status?{status,readers:status==='corrected'?3:2,findings:[],correctedFields:status==='corrected'?['amountTTC','items[1].kind']:[]}:undefined));
    expect(screen.getByRole('button',{name:new RegExp('^'+title)})).toBeInTheDocument();
    /* D335, D350 : la nature n'est plus un menu mais un segment « Ingrédient | Service | Matériel » ; l'entretien se range sous « Matériel ». Le lien matériel n'a plus de menu :
       rien n'est lié ni créé tant que le brasseur n'a rien choisi, et c'est l'enregistrement qui le prouve. */
    expect(nature(1)).toBe('Matériel');
    expect(nature(2)).toBe('Matériel');
    expect(state.saved).not.toHaveBeenCalled();
    if(status==='corrected')expect(screen.getByLabelText('Total TTC en CHF')).toHaveAccessibleDescription(expect.stringContaining('Valeur corrigée'));
  });
  const controls={lines:{checked:2,failed:0,skipped:0,skippedIds:[] as string[]},sum:{statut:'ok',base:'TTC'},vat:{statut:'ok',base:null},totals:{statut:'ok'}};
  it('nouveau format : aucun point qui pèse donne « Lecture vérifiée » ; un point qui pèse donne « Lecture à confirmer » (T1)',async()=>{
    await openScannedInvoice(Object.assign(scannedInvoice({status:'checked',findings:[],readers:2}),{points:[],controls}) as any);
    expect(screen.getByRole('button',{name:/^Lecture vérifiée/})).toBeInTheDocument();
    cleanup();
    const point={code:'tva-incoherente',gravite:'ecart',origine:'controle',enjeu:'info',bloque:false,champ:'vat',champs:[],ligne:null,cle:'tva-incoherente:-:vat',regle:'',lu:null,calcule:null,ecart:null,unite:'texte',message:'TVA incohérente'};
    await openScannedInvoice(Object.assign(scannedInvoice({status:'checked',findings:[],readers:2}),{points:[point],controls}) as any);
    expect(screen.getByRole('button',{name:/^Lecture à confirmer/})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:/^1\s*TVA/})).toBeInTheDocument();
  });
  it('conserve les divergences et ambiguïtés dans la revue, sans répéter les avertissements',async()=>{
    const result=scannedInvoice({status:'disputed',findings:['Le montant de la deuxième ligne reste illisible.'],readers:3});
    result.issues=['Le montant de la deuxième ligne reste illisible.'];
    Object.assign(result.items[1],{ambiguity:'Réparation ou pièce de rechange à confirmer.'});
    const view=await openScannedInvoice(result,true);
    /* Le mot « Lecture déjà disponible » n'est plus une ligne de texte : c'est l'infobulle du « Détail » du pied (maquette p3c-3, A4), toujours là tant que la lecture vient du cache. */
    const cache=()=>view.container.querySelector('[title="Lecture déjà disponible · aucun nouvel appel IA"]');
    /* p3c-3 : la preuve est ouverte d'office (rien à ouvrir) ; le toucher de la pastille « Lecture à confirmer, n lignes » AMÈNE à la liste (D7 : le geste a un effet vérifié). */
    expect(cache()).not.toBeNull();
    const vise=vi.fn(),avant=Object.getOwnPropertyDescriptor(Element.prototype,'scrollIntoView');
    (Element.prototype as any).scrollIntoView=vise;
    try{
      fireEvent.click(screen.getByRole('button',{name:/^Lecture à confirmer/}));
      expect(vise.mock.contexts.some(c=>(c as HTMLElement).getAttribute?.('data-dp')==='liste')).toBe(true);
    }finally{
      if(avant)Object.defineProperty(Element.prototype,'scrollIntoView',avant);else delete (Element.prototype as any).scrollIntoView;
    }
    expect(screen.getAllByText('Le montant de la deuxième ligne reste illisible.')).toHaveLength(1);
    expect(cache()).not.toBeNull();
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
    /* B2 n° 39 : au-delà du TTC, le champ TVA refuse la frappe en le disant (alerte sur le champ, valeur d'avant gardée). */
    fireEvent.focus(vat);fireEvent.change(vat,{target:{value:'60'}});
    expect(vat).toHaveAttribute('aria-invalid','true');
    expect(screen.getByRole('alert')).toHaveTextContent('au plus 50');
    fireEvent.blur(vat);expect(vat).toHaveValue('');
    /* La TVA reste fautive si c'est le TTC qui baisse après coup : l'enregistrement la refuse alors, ouvre sa seule rubrique et y met le focus. */
    fireEvent.change(vat,{target:{value:'40'}});fireEvent.blur(vat);
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'30'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
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
    const view=render(<ExpenseSheet initialIntent="equipment" onClose={()=>{}} onSaved={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'500'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Fermenteur 30 L'}});
    expect(screen.queryByLabelText('Libellé ligne 1')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Montant ligne 1')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Ajouter une ligne'}));
    /* p3c-3 : la ligne reprise du formulaire simple est une rangée à plateau (son nom en titre, pas de champ « Libellé » tant qu'il est rempli) ; la nouvelle ligne, vide, s'ouvre sur son libellé. */
    expect(view.container.querySelectorAll('[data-dp-nom]')[0]).toHaveTextContent('Fermenteur 30 L');
    expect(screen.getByLabelText('Montant ligne 1')).toHaveValue('500,00'); // TE-23 : à la virgule
    expect(nature(1)).toBe('Matériel');
    fireEvent.change(screen.getByLabelText('Libellé ligne 2'),{target:{value:'Livraison'}});
    /* D335 : le segment n'offre plus « Livraison » : les frais de port se rangent sous « Service » (kind service, hors stock). */
    fireEvent.click(within(screen.getByRole('group',{name:'Type d’achat, ligne 2'})).getByRole('button',{name:'Service'}));
    fireEvent.change(screen.getByLabelText('Montant ligne 2'),{target:{value:'25'}});fireEvent.blur(screen.getByLabelText('Montant ligne 2'));
    fireEvent.change(screen.getByLabelText('Total TTC en CHF'),{target:{value:'525'}});fireEvent.blur(screen.getByLabelText('Total TTC en CHF'));
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer la dépense'}));
    await waitFor(()=>expect(state.saved).toHaveBeenCalledOnce());
    expect(state.saved.mock.calls[0][0]).toMatchObject({amount:525,description:'Fermenteur 30 L',lines:[{description:'Fermenteur 30 L',amount:500,kind:'equipment',equipmentAction:'new'},{description:'Livraison',amount:25,kind:'service',stockAction:'none'}]});
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
  it('B2-NOTE-6 : recharger la page avec une saisie remplie demande confirmation ; une feuille vide ne demande rien',()=>{
    const unload=()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;};
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    expect(unload()).toBe(false);
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Malt pour le prochain brassin'}});
    expect(unload()).toBe(true);
    view.unmount();
    expect(unload()).toBe(false); // la garde part avec la feuille
  });
  it('B2-NOTE-12 : le × du formulaire manuel est son « Annuler » : vide, il ferme ; rempli, il demande « Abandonner cette saisie ? » (comme BX-1)',()=>{
    const onClose=vi.fn();render(<ExpenseSheet onClose={onClose} onSaved={()=>{}}/>);
    fireEvent.click(screen.getByRole('button',{name:'Fermer'}));
    expect(onClose).toHaveBeenCalledTimes(1);
    onClose.mockClear();cleanup();
    render(<ExpenseSheet onClose={onClose} onSaved={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Pour quoi ?'),{target:{value:'Malt pour le prochain brassin'}});
    fireEvent.click(screen.getByRole('button',{name:'Fermer'}));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Abandonner cette saisie ?');expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button',{name:'Continuer la saisie'}));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();expect(screen.getByLabelText('Pour quoi ?')).toHaveValue('Malt pour le prochain brassin');
    fireEvent.click(screen.getByRole('button',{name:'Fermer'}));fireEvent.click(screen.getByRole('button',{name:'Abandonner'}));
    expect(onClose).toHaveBeenCalledTimes(1);
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
