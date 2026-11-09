import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
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
  it('paiement : un terminal plus grand que le total est dit sous « Payé », sans drapeau',async()=>{
    const view=await ouvrir(ticketEan({amountPaid:undefined,terminalAmount:500}));
    const paye=rangee(view,'paye')!;
    expect(paye.textContent).toMatch(/montant non lu/);
    expect(paye.getAttribute('data-dp-verdict')).toBe('inconnu');
    expect(view.container.querySelector('[data-dp="controle-note"]')!.textContent).toMatch(/terminal affiche 500,00/);
  });
  it('doublon : l’écran a déjà sa section « Achat peut-être déjà enregistré » (même fournisseur, jour, total) : la rangée du contrôle ne la répète pas',async()=>{
    state.transactions=[{id:'tx-deja',date:'02.11.2026',description:'Travaux',amountHT:0,tvaRate:0,tvaAmount:0,amountTTC:352.05,category:'renovation',subcategory:'',finance:{vendor:'Brico Fictif SA',invoiceNumber:''}}];
    const view=await ouvrir(ticketEan());
    await waitFor(()=>expect(screen.getByText(/Achat peut-être déjà enregistré/)).toBeInTheDocument());
    expect(rangee(view,'doublon')).toBeNull();
  });
});
