import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* Voie dp (10.11), capture en ligne du brasseur : le ticket d'une pharmacie (« BENU Matran »), une ligne « MEFENACIDE … 30 pce » à 13,40. Trois mots : « Pas flaggé ??? », « Aucune unité rien ? »,
   « Et ça m'avait ouvert la liaison stock ?? ». Lecture SIMULÉE à la forme du serveur (`quantity` null, `unit` vide, `price` = montant) : Gemini n'est jamais appelé, aucune écriture, aucune donnée réelle d'autre. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[],traduire:vi.fn()}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/nomsFr',async importOriginal=>({...await importOriginal<any>(),traduireLignes:(lignes:any[])=>state.traduire(lignes)}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.traduire.mockReset();state.traduire.mockResolvedValue(new Map());state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(globalThis,'crypto',{value:webcrypto,configurable:true});Object.defineProperty(window,'crypto',{value:webcrypto,configurable:true});});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(lecture:any)=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
/** La pièce de sa capture : une ligne de médicament, 13,40, sans quantité, unité ni prix unitaire lus (`price` null : « quantité VIDE, prix unitaire VIDE »), rangée « Autres ». */
const lecturePharmacie=(ligne:Record<string,unknown>={},piece:Record<string,unknown>={})=>({
  vendor:'BENU Matran',date:'10.11.2026',currency:'CHF',invoiceNumber:'',description:'Pharmacie',category:'divers',subcategory:'',amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:13.4,issues:[] as string[],
  items:[{id:'line-1',name:'MEFENACIDE cpr pell 500 mg sécables 30 pce',kind:'other',quantity:null,unit:'',price:null,amountTTC:13.4,reference:'',evidence:'MEFENACIDE cpr pell 500 mg sécables 30 pce 13.40',...ligne}],
  paymentEvidence:'paid',paymentMethod:'twint',amountPaid:13.4,printedLineCount:1,
  review:{status:'checked',findings:[],readers:3},
  controls:{lines:{checked:0,failed:0,skipped:1,skippedIds:['line-1']},sum:{statut:'ok',base:'TTC'},vat:{statut:'non-verifiable',base:'TTC'},totals:{statut:'non-verifiable'}},
  ...piece,
});
/** La ligne se remonte dans une autre bande quand sa nature change : on la cherche toujours à neuf. */
const ligne=(view:{container:HTMLElement})=>view.container.querySelector<HTMLElement>('[data-dp-ligne="line-1"]')!;
const ouvrirLigne=async(view:{container:HTMLElement})=>{
  if(!ligne(view).querySelector('input[aria-label^="Quantité ligne"]'))fireEvent.click(ligne(view).querySelector('summary')!);
  await waitFor(()=>expect(ligne(view).querySelector('input[aria-label^="Quantité ligne"]')).not.toBeNull());
  return ligne(view);
};
/** Une ligne lue « stock » dans une pièce de brassage : la lecture de sa capture avant qu'il choisisse « Matériel ». */
const enStockDeBrassage=()=>lecturePharmacie({kind:'stock'},{category:'brassage'});
const liaisonStock=(l:HTMLElement)=>/nouvel article|relié|à choisir/.test(l.textContent??'')||l.querySelector('[data-dp-sortie],[role="combobox"],[role="listbox"],[aria-label="Article"]')!==null;

describe('dp-1 : un médicament de pharmacie n’est pas un achat de brasserie : la ligne est à contrôler, avec sa raison et son renvoi',()=>{
  it('la ligne porte son drapeau « à contrôler » et dit « pas un achat de brasserie ? »',async()=>{
    const view=await ouvrir(lecturePharmacie());
    const l=ligne(view);
    expect(l.textContent).toMatch(/pas un achat de brasserie/i);
    expect(l.querySelector('[data-dp-niveau="repris"],[data-dp-niveau="inconnu"]')).not.toBeNull();
  });
  it('le renvoi mène au geste existant : « Apport ou prélèvement privé » (feuille préremplie : motif, montant, retrait)',async()=>{
    const view=await ouvrir(lecturePharmacie());
    const l=await ouvrirLigne(view);
    const renvoi=l.querySelector<HTMLElement>('[data-dp-renvoi-prive]');
    expect(renvoi).not.toBeNull();
    expect(renvoi!.textContent).toMatch(/privé/i);
    fireEvent.click(renvoi!);
    await screen.findByRole('heading',{name:'Apport ou prélèvement privé'});
    expect((screen.getByLabelText('Montant (CHF)') as HTMLInputElement).value).toMatch(/13[,.]40?/);
    expect((screen.getByLabelText('Motif') as HTMLInputElement).value).toMatch(/BENU Matran/);
  });
  it('une dépense de brassage dont la ligne est reconnue n’est pas signalée (pas de faux drapeau)',async()=>{
    const view=await ouvrir(lecturePharmacie({name:'Houblon Citra 100g',kind:'stock'},{category:'brassage'}));
    expect(ligne(view).textContent).not.toMatch(/pas un achat de brasserie/i);
  });
});

describe('dp-2 : « Aucune unité rien ? » : un seul total lu donne 1 × total, une unité lisible, jamais un champ vide muet',()=>{
  it('quantité 1, prix unitaire 13,40, une unité allumée, les deux unités séparées (« pièce | L », pas « pièce L »)',async()=>{
    const view=await ouvrir(lecturePharmacie());
    const l=await ouvrirLigne(view);
    expect(l.querySelector<HTMLInputElement>('input[aria-label^="Quantité ligne"]')!.value).toBe('1');
    expect(l.querySelector<HTMLInputElement>('input[aria-label^="Prix ligne"]')!.value).toMatch(/^13[,.]40?$/);
    const seg=l.querySelector<HTMLElement>('[data-dp-unite-segments]')!;
    expect(seg.querySelectorAll('button[aria-pressed="true"]').length).toBe(1);
    expect(seg.className).toMatch(/divide-x/);
  });
  it('choisir « Service » sur une ligne lue sans quantité garde le total : quantité 1, prix 13,40 (jamais deux champs vides muets)',async()=>{
    const view=await ouvrir(enStockDeBrassage());
    const l=await ouvrirLigne(view);
    fireEvent.click(Array.from(l.querySelectorAll('button')).find(b=>b.textContent==='Service')!);
    await waitFor(()=>expect(ligne(view).textContent).toMatch(/hors stock/));
    const m=ligne(view);
    expect(m.querySelector<HTMLInputElement>('input[aria-label^="Quantité ligne"]')!.value).toBe('1');
    expect(m.querySelector<HTMLInputElement>('input[aria-label^="Prix ligne"]')!.value).toMatch(/^13[,.]40?$/);
  });
  it('choisir « Matériel » : la quantité à remplir est dite en rouge avec ses cases d’unité (« unité à remplir »), jamais muette',async()=>{
    const view=await ouvrir(enStockDeBrassage());
    const l=await ouvrirLigne(view);
    fireEvent.click(Array.from(l.querySelectorAll('button')).find(b=>b.textContent==='Matériel')!);
    await waitFor(()=>expect(ligne(view).textContent).toMatch(/hors stock/));
    const m=ligne(view);
    const q=m.querySelector<HTMLInputElement>('input[aria-label^="Quantité ligne"]')!;
    expect(q.value==='1'||m.querySelector('[data-dp-cases-unite]')!==null).toBe(true);
  });
});

describe('dp-3 : la liaison au stock ne s’ouvre que sur son geste, jamais pour une ligne hors stock (Matériel, Service, Autres)',()=>{
  it('la pièce de sa capture (ligne « Autres », dépense « divers ») : aucune liaison au chargement',async()=>{
    const view=await ouvrir(lecturePharmacie());
    const l=await ouvrirLigne(view);
    expect(liaisonStock(l)).toBe(false);
  });
  it('après « Matériel » : « hors stock », aucune liaison ouverte, pas de « ⇄ Choisir un autre article »',async()=>{
    const view=await ouvrir(enStockDeBrassage());
    const l=await ouvrirLigne(view);
    fireEvent.click(Array.from(l.querySelectorAll('button')).find(b=>b.textContent==='Matériel')!);
    await waitFor(()=>expect(ligne(view).textContent).toMatch(/hors stock/));
    expect(liaisonStock(ligne(view))).toBe(false);
    expect(ligne(view).querySelector('[aria-label="Choisir un autre article"]')).toBeNull();
  });
});


/* CP-20 (10.11) : « 2 endroit qui ne font pas le lien sur la date d'achat ??? » ; le sélecteur de mois s'écrivait « November 2026 ». */
import {patchPurchaseDraft} from '../../src/services/purchasePrefill';
import {DateField,MOIS_FR} from '../../src/ui/DateField';
describe('dp-4 : la date du paiement suit la date de l’achat tant qu’elle n’est pas choisie',()=>{
  const base:any={date:'10.11.2026',paymentDate:'10.11.2026',paymentStatus:'paid'};
  it('une date de paiement supposée (lue du document) suit la date de l’achat, même si elle en différait',()=>{
    const p=patchPurchaseDraft({...base,paymentDate:'31.08.2026',paymentDateBasis:'document_date'},{date:'05.11.2026'},'10.11.2026');
    expect(p.paymentDate).toBe('05.11.2026');
    expect(p.paymentDateBasis).toBe('document_date');
  });
  it('une date de paiement égale à l’achat (sans base) le suit aussi',()=>{
    expect(patchPurchaseDraft(base,{date:'05.11.2026'},'10.11.2026').paymentDate).toBe('05.11.2026');
  });
  it('une date choisie à part (typed) rompt le lien : l’achat change, le paiement reste',()=>{
    const choisi=patchPurchaseDraft(base,{paymentDate:'12.11.2026'},'12.11.2026');
    expect(choisi.paymentDateBasis).toBe('typed');
    expect(patchPurchaseDraft(choisi,{date:'05.11.2026'},'12.11.2026').paymentDate).toBe('12.11.2026');
  });
  it('la feuille le dit en une ligne quand la date de paiement est choisie à part',async()=>{
    const view=await ouvrir(lecturePharmacie({},{date:'05.11.2026'}));
    fireEvent.click(view.container.querySelector<HTMLElement>('[data-dp="tuile-paye"]')!);
    fireEvent.click(await screen.findByRole('button',{name:'Autre date'}));
    const champ=await screen.findByLabelText('Date du paiement');
    fireEvent.change(champ,{target:{value:'2026-11-08'}});
    await waitFor(()=>expect(view.container.querySelector('[data-dp="paye-autre-jour"]')!.textContent).toMatch(/payé le 08\.11\.2026, autre jour que l’achat/));
  });
});
describe('fx2 : « Autre date » montre le champ et la petite ligne ; « C’est la date » remet le lien',()=>{
  it('Autre date : le champ « Date du paiement » et la ligne dès le toucher ; une autre date : « autre jour » ; « C’est la date » rend le lien',async()=>{
    const view=await ouvrir(lecturePharmacie({},{date:'05.11.2026'}));
    fireEvent.click(view.container.querySelector<HTMLElement>('[data-dp="tuile-paye"]')!);
    expect(view.container.querySelector('[data-dp="paye-meme-jour"]')).toBeNull();
    fireEvent.click(await screen.findByRole('button',{name:'Autre date'}));
    await screen.findByLabelText('Date du paiement');
    expect(view.container.querySelector('[data-dp="paye-meme-jour"]')!.textContent).toMatch(/payé le 05\.11\.2026, même jour que l’achat/);
    fireEvent.change(screen.getByLabelText('Date du paiement'),{target:{value:'2026-11-08'}});
    await waitFor(()=>expect(view.container.querySelector('[data-dp="paye-autre-jour"]')!.textContent).toMatch(/payé le 08\.11\.2026, autre jour que l’achat \(05\.11\.2026\)/));
    fireEvent.click(screen.getByRole('button',{name:'C’est la date'}));
    await waitFor(()=>expect(screen.queryByLabelText('Date du paiement')).toBeNull());
    expect(view.container.querySelector('[data-dp="paye-autre-jour"]')).toBeNull();
    expect(view.container.querySelector('[data-dp="paye-suit"]')!.textContent).toMatch(/Payé le 05\.11\.2026/);
  });
});
describe('dp-5 : le sélecteur « Changer le mois » est en français',()=>{
  it('les mois s’écrivent en français et le choix garde le jour',()=>{
    const onChange=vi.fn();
    render(<DateField label="Date de l’achat" value="10.11.2026" onChange={onChange} monthShortcuts/>);
    const sel=screen.getByLabelText('Mois — Date de l’achat') as HTMLSelectElement;
    expect(Array.from(sel.options).map(o=>o.textContent)).toEqual([...MOIS_FR]);
    expect(sel.options[sel.selectedIndex].textContent).toBe('novembre');
    expect(document.body.textContent).not.toMatch(/November|January/);
    fireEvent.change(sel,{target:{value:'02'}});
    expect(onChange).toHaveBeenLastCalledWith('10.02.2026');
  });
});
