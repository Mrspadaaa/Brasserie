import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* d2 (09.11) : les contrôles de la pièce (`controlesPiece.ts`, voie c1) branchés au bloc de l'écran Dépense. Chaque rangée dit ses deux valeurs, son verdict et sa pastille-geste ;
   un contrôle non vérifiable n'a pas de rangée (jamais un vert inventé). Lectures SIMULÉES (ticket anonymisé de t1, champs de c1) : Gemini n'est jamais appelé. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[]}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {lectureTicket,lectureRabais} from './depenseTotaux.fixture';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});Element.prototype.scrollIntoView=vi.fn();});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(lecture:any,props:Record<string,unknown>={})=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}} {...props}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
const rangee=(view:{container:HTMLElement},cle:string)=>view.container.querySelector<HTMLElement>(`[data-dp="preuve"] [data-dp-controle-cle="${cle}"]`);
const EAN_VALIDES=(n:number)=>{const base=`76123${String(100000+n*37).padStart(7,'0')}`;const s=[...base].reduce((t,d,i)=>t+Number(d)*(i%2===0?1:3),0);return base+String((10-(s%10))%10);};
/** Le ticket de t1 avec des EAN valides (la fixture a des références sans clé juste). */
const ticketEan=(over:Record<string,unknown>={})=>{const l:any=lectureTicket(over);l.items=l.items.map((it:any,i:number)=>({...it,reference:EAN_VALIDES(i)}));return l;};

describe('Dépense : contrôles de la pièce dans le bloc (d2)',()=>{
  it('rien n’est inventé : une lecture qui ne porte aucun champ de c1 n’a ni rangée EAN, ni photo, ni TVA',async()=>{
    const view=await ouvrir(ticketEan({countedEans:undefined,countedAmounts:undefined}));
    for(const cle of ['comptage-ean','photo-incomplete','tva-par-taux','hors-articles','prix-plausible','doublon'])expect(rangee(view,cle),cle).toBeNull();
  });
  it('codes EAN : non fiables tant que la lecture n’est pas mesurée (b1 : 21 codes invalides sur 25) : ni rangée, ni drapeau, même avec 31 imprimés pour 29 lus et un code faux',async()=>{
    const l:any=ticketEan({countedEans:31});
    const bon=l.items[6].reference;
    l.items[6].reference=bon.slice(0,12)+String((Number(bon[12])+1)%10);
    const view=await ouvrir(l);
    expect(rangee(view,'comptage-ean')).toBeNull();
    expect(rangee(view,'cle-ean')).toBeNull();
    expect(view.container.querySelector('[data-dp="preuve"]')!.getAttribute('data-dp-drapeau')).toBe('1'); // le drapeau vient du CHF (74,45), pas des codes
    expect(Array.from(view.container.querySelectorAll('[data-dp="preuve"] [data-dp-verdict="ecart"]')).map(e=>e.getAttribute('data-dp-controle-cle'))).toEqual(['somme']);
  });
  it('ligne hors article (« Montant en EUR ») dans les lignes : pastille, la ligne est ouverte au toucher',async()=>{
    const l:any=ticketEan({countedEans:undefined});
    l.items.push({id:'line-30',name:'Montant en EUR',kind:'other',quantity:1,unit:'pièce',price:370.92,amountTTC:370.92,reference:'',evidence:'Montant en EUR 370,92'});
    const view=await ouvrir(l);
    const r=rangee(view,'hors-articles')!;
    expect(r.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(r.textContent).toContain('1 ligne');
    expect(r.textContent).toMatch(/Montant en EUR/);
    fireEvent.click(r);
    await waitFor(()=>expect(view.container.querySelector<HTMLDetailsElement>('[data-dp-ligne="line-30"] details')!.open).toBe(true));
  });
  it('photo incomplète lue : pastille qui mène à la photo ; non lue : aucune rangée',async()=>{
    const view=await ouvrir(ticketEan({photoIncomplete:true,photoIncompleteNote:'bas du ticket taché'}));
    const r=rangee(view,'photo-incomplete')!;
    expect(r.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(r.getAttribute('data-dp-renvoi')).toBe('photo');
    expect(r.textContent).toMatch(/bas du ticket taché/);
  });
  it('TVA : le taux et le montant imprimé se recoupent (concorde) ou non (pastille, relire le pied)',async()=>{
    const ok=await ouvrir(ticketEan({vat:[{code:'A',rate:0.081,base:325.67,amount:26.38}]}));
    expect(rangee(ok,'tva-par-taux')!.getAttribute('data-dp-verdict')).toBe('ok');
    expect(rangee(ok,'tva-par-taux')!.textContent).toContain('26,38 / 26,38');
    cleanup();
    const ko=await ouvrir(ticketEan({vat:[{code:'A',rate:0.081,base:325.67,amount:20}]}));
    expect(rangee(ko,'tva-par-taux')!.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(rangee(ko,'tva-par-taux')!.getAttribute('data-dp-renvoi')).toBe('photo');
  });
  it('rabais : « Brut − rabais » dit les deux valeurs (149,25 / 149,25) ; sans rabais, la rangée n’existe pas',async()=>{
    const l:any=lectureRabais();
    const view=await ouvrir({...l,amountPaid:149.25});
    expect(rangee(view,'brut-rabais')).not.toBeNull();
    expect(rangee(view,'brut-rabais')!.textContent).toContain('149,25 / 149,25');
    expect(rangee(view,'brut-rabais')!.getAttribute('data-dp-verdict')).toBe('ok');
    cleanup();
    const sans=await ouvrir(ticketEan());
    expect(rangee(sans,'brut-rabais')).toBeNull();
  });
  it('paiement (p2, jeu en ligne 4 : changé exprès) : un terminal plus grand que le total, sans autre dépense qui l’explique, est un « Payé ≠ imprimé » rouge, plus « montant non lu » en gris',async()=>{
    const view=await ouvrir(ticketEan({amountPaid:undefined,terminalAmount:500}));
    const paye=rangee(view,'paye')!;
    expect(paye.textContent).not.toMatch(/montant non lu/);
    expect(paye.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(paye.getAttribute('data-dp-ton')).toBe('rouge');
    expect(view.container.querySelector('[data-dp="controle-note"]')!.textContent).toMatch(/terminal affiche 500,00/);
  });
  it('payé effectif : sans reçu imprimé, le terminal égal au total vaut paiement (ticket de caisse) ; sur une facture il reste « montant non lu »',async()=>{
    const caisse=await ouvrir(ticketEan({amountPaid:undefined,terminalAmount:352.05,documentType:'receipt'}));
    expect(rangee(caisse,'paye')!.textContent).toContain('352,05');
    expect(rangee(caisse,'paye')!.textContent).not.toMatch(/montant non lu/);
    cleanup();
    const facture=await ouvrir(ticketEan({amountPaid:undefined,terminalAmount:352.05,documentType:'invoice'}));
    expect(rangee(facture,'paye')!.textContent).toMatch(/montant non lu/);
  });
  it('comptage des montants : 31 comptés pour 29 lus, non confirmé par la 3.8 : « Articles » ne lève pas le drapeau seul ; confirmé : pastille',async()=>{
    const non=await ouvrir(ticketEan({countedAmounts:31,amountTTC:277.6,amountPaid:277.6,printedLineCount:undefined}));
    expect(rangee(non,'articles')!.getAttribute('data-dp-verdict')).not.toBe('ecart');
    cleanup();
    const oui=await ouvrir(ticketEan({countedAmounts:31,countedAmountsConfirmed:true,amountTTC:277.6,amountPaid:277.6,printedLineCount:undefined}));
    expect(rangee(oui,'articles')!.getAttribute('data-dp-verdict')).toBe('ecart');
  });
  it('p1 : le compte concorde (29 = 29), la somme non, aucune ligne suspecte : « Comparer à la photo » ouvre le justificatif, jamais la plus grosse ligne ni la recherche ; en rouge',async()=>{
    const view=await ouvrir(ticketEan({amountTTC:400,amountPaid:400}));
    const s=rangee(view,'somme')!;
    expect(s.textContent).toMatch(/Comparer à la photo/);
    expect(s.textContent).not.toMatch(/Vérifier les montants|plus gros/);
    expect(s.getAttribute('data-dp-renvoi')).toBe('photo');
    expect(s.getAttribute('data-dp-ton')).toBe('rouge');
    expect(view.container.querySelector('[data-dp="justificatif"]')!.className).toMatch(/hidden/);
    fireEvent.click(s);
    await waitFor(()=>expect(view.container.querySelector('[data-dp="justificatif"]')!.className).toMatch(/block/));
    expect(view.container.querySelector('[data-dp-ligne] details[open]')).toBeNull();
    expect(document.activeElement).not.toBe(screen.getByLabelText('Chercher dans les lignes lues'));
    expect(['INPUT','TEXTAREA']).not.toContain(document.activeElement?.tagName);
  });
  it('critique 12 : les contrôles « rien à signaler » tiennent sur une petite ligne, pas une rangée pleine',async()=>{
    const view=await ouvrir(ticketEan({ignoredLines:[]}));
    const d=view.container.querySelector('[data-dp="preuve"] [data-dp="controle-discret"]')!;
    expect(d.textContent).toMatch(/Lignes hors articles : rien à signaler/);
    expect(d.tagName).toBe('P');
  });
  it('critique 3 : la tuile Règlement dit « date supposée » (la date, pas le montant payé, qui est lu)',async()=>{
    const view=await ouvrir(ticketEan());
    const tuile=view.container.querySelector('[data-dp="tuile-paye"]')!.textContent??'';
    expect(tuile).toMatch(/date supposée/);
    expect(tuile).not.toMatch(/Règlement\s*supposée/);
  });
  it('critique 10 : « Ajouter la ligne » (bande) met le focus sur le libellé de la ligne neuve',async()=>{
    const view=await ouvrir(ticketEan({countedAmounts:31}));
    fireEvent.focus(screen.getByLabelText('Chercher dans les lignes lues'));
    await waitFor(()=>expect(view.container.querySelector('[data-dp="manque"]')).not.toBeNull());
    const avant=view.container.querySelectorAll('[data-dp-ligne]').length;
    fireEvent.click(within(view.container.querySelector<HTMLElement>('[data-dp="manque"]')!).getByRole('button',{name:/Ajouter la ligne/}));
    await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBe(avant+1));
    await waitFor(()=>expect(document.activeElement?.getAttribute('aria-label')).toBe('Libellé ligne '+(avant+1)));
    /* p1 : 31 comptées pour 29 lues = deux articles manquent : aucun montant deviné, le champ reste vide (l'inconnu n'est jamais 0). */
    expect((screen.getByLabelText('Montant ligne '+(avant+1)) as HTMLInputElement).value).toBe('');
  });
  it('doublon : l’écran a déjà sa section « Achat peut-être déjà enregistré » (même fournisseur, jour, total) : la rangée du contrôle ne la répète pas',async()=>{
    state.transactions=[{id:'tx-deja',date:'02.11.2026',description:'Travaux',amountHT:0,tvaRate:0,tvaAmount:0,amountTTC:352.05,category:'renovation',subcategory:'',finance:{vendor:'Brico Fictif SA',invoiceNumber:''}}];
    const view=await ouvrir(ticketEan());
    await waitFor(()=>expect(screen.getByText(/Achat peut-être déjà enregistré/)).toBeInTheDocument());
    expect(rangee(view,'doublon')).toBeNull();
  });
});
