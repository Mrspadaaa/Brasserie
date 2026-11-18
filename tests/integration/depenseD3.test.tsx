import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* d3 (09.11) : les 7 problèmes de critique/VERDICT-2.md. Lectures SIMULÉES (fixture anonymisée de t1) : Gemini n'est jamais appelé. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[]}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {makePoint} from '../../functions/src/invoiceControls';
import {PESE_PAR_CODE} from '../../src/domain/finance/invoicePoints';
import {lectureTicket,lectureRabais} from './depenseTotaux.fixture';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});});
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
/** Un désaccord de lecture, tel que le banc et le serveur le posent (code `lectures-divergentes`, valeurs en concurrence). */
const desaccord=(rang:number,origine:'lecture'|'controle'='lecture')=>{
  const base=makePoint('lectures-divergentes','ecart','items',rang,{regle:'lectures divergentes',message:`nom : lectures divergentes (ligne ${rang})`,unite:'texte',enjeu:'info',lu:1,calcule:2,origine});
  return {...base,pese:PESE_PAR_CODE['lectures-divergentes'],champs:[`items.${rang}.name`],valeurs:[{lecture:1,valeur:'a',retenue:false},{lecture:2,valeur:'b',retenue:false}]};
};

describe('d3-1 : une seule vérité pour l’accord des lectures',()=>{
  it('des désaccords posés par le banc (origine « contrôle ») : jamais « d’accord » quand la barre du bas dit « désaccord »',async()=>{
    const view=await ouvrir(lectureTicket({review:{status:'disputed',findings:[],readers:3},points:[desaccord(1,'controle'),desaccord(2,'controle')]}));
    const r=rangee(view,'lectures')!;
    expect(r.textContent).not.toMatch(/d.accord/);
    expect(r.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(r.textContent).toMatch(/2 désaccords/);
    expect(view.container.textContent).toMatch(/désaccord/);
  });
  it('lectures réelles (origine « lecture ») : même compte que la barre',async()=>{
    const view=await ouvrir(lectureTicket({review:{status:'disputed',findings:[],readers:3},points:[desaccord(1)]}));
    const r=rangee(view,'lectures')!;
    expect(r.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(r.textContent).toMatch(/1 désaccord(?!s)/);
  });
  it('sans désaccord : « d’accord » reste vrai',async()=>{
    const view=await ouvrir(lectureTicket());
    expect(rangee(view,'lectures')!.textContent).toMatch(/3\/3 d.accord/);
  });
});

const ligne=(view:{container:HTMLElement},id:string)=>view.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`)!;
const ouverte=(view:{container:HTMLElement},id:string)=>ligne(view,id)?.querySelector<HTMLDetailsElement>('details')?.open===true;
const grosse=(l:any)=>{l.items.push({id:'line-30',name:'Peinture fictive Z99',kind:'other',quantity:1,unit:'pièce',price:370.92,amountTTC:370.92,reference:'',evidence:'Peinture fictive Z99 370,92'});return l;};

describe('d3-2 : « Voir la ligne en trop » ne reste jamais muet',()=>{
  it('aucun montant n’égale l’écart (la pièce manque aussi d’autres lignes) : la ligne désignée par « hors articles » s’ouvre',async()=>{
    const l:any=lectureTicket({countedEans:undefined});
    l.items.push({id:'line-30',name:'Montant en EUR',kind:'other',quantity:1,unit:'pièce',price:370.92,amountTTC:370.92,reference:'',evidence:'Montant en EUR 370,92'});
    const view=await ouvrir(l);
    const r=rangee(view,'articles')!;
    expect(r.textContent).toMatch(/Voir la ligne en trop/);
    expect(ouverte(view,'line-30')).toBe(false);
    fireEvent.click(r);
    await waitFor(()=>expect(ouverte(view,'line-30')).toBe(true));
  });
  it('sans ligne hors article : la plus grosse ligne s’ouvre',async()=>{
    const view=await ouvrir(grosse(lectureTicket({countedEans:undefined})));
    const r=rangee(view,'articles')!;
    expect(r.textContent).toMatch(/Voir la ligne en trop/);
    fireEvent.click(r);
    await waitFor(()=>expect(ouverte(view,'line-30')).toBe(true));
  });
  it('la pastille « Somme ≠ imprimé » (surplus) mène aussi à une ligne',async()=>{
    const view=await ouvrir(grosse(lectureTicket({countedEans:undefined})));
    const r=rangee(view,'somme')!;
    expect(r.textContent).toMatch(/en trop/);
    fireEvent.click(r);
    await waitFor(()=>expect(ouverte(view,'line-30')).toBe(true));
  });
});

describe('d3-4 : « Qté × prix » ne compte que les lignes vérifiables',()=>{
  it('Sun Store 2 (2 rabais, 1 prestation sans prix unitaire) : « 2/2 justes », jamais « 2/5 »',async()=>{
    const l:any=lectureRabais();
    l.items[1]={...l.items[1],quantity:2,price:null}; // « Prestation » : deux pièces, pas de prix unitaire imprimé
    const view=await ouvrir(l);
    const r=rangee(view,'qte')!;
    expect(r.textContent).not.toMatch(/\/5/);
    const m=/(\d+)\/(\d+)/.exec(r.textContent!)!;
    expect(m[1]).toBe(m[2]);
    expect(r.textContent).toMatch(/1 sans prix unitaire/);
    expect(r.querySelector('svg')).toBeNull();
  });
});

describe('d3-5 : la fiche d’un rabais n’a que son montant',()=>{
  it('ni quantité, ni prix, ni boutons +1 +2 : le montant, l’imprimé, supprimer',async()=>{
    const view=await ouvrir(lectureRabais());
    const rab=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-rabais]'));
    expect(rab.length).toBeGreaterThan(0);
    const fiche=rab[0];
    expect(fiche.querySelector('[aria-label^="Montant ligne"]')).not.toBeNull();
    expect(fiche.querySelector('[aria-label^="Quantité ligne"]')).toBeNull();
    expect(fiche.querySelector('[aria-label^="Prix ligne"]')).toBeNull();
    expect(fiche.textContent).not.toMatch(/\+10/);
    expect(fiche.querySelector('[aria-label^="Retirer la ligne"]')).not.toBeNull();
  });
});

describe('d3-3 : en recherche, un sous-groupe somme ses lignes montrées (jamais 0,00)',()=>{
  it.each(['serre','14,90','peinture','brosse'])('« %s » : chaque sous-groupe montré dit un montant, pas 0,00',async mot=>{
    const view=await ouvrir(lectureTicket({countedEans:undefined}));
    fireEvent.change(screen.getByLabelText('Chercher dans les lignes lues'),{target:{value:mot}});
    await waitFor(()=>expect(view.container.querySelector('[data-dp="recherche-etat"]')!.textContent).toMatch(/ligne/));
    const sgs=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-sg-ligne]')).filter(b=>!b.closest<HTMLElement>('[data-dp-sg]')?.hidden);
    for(const b of sgs){
      const compte=b.querySelector('[data-dp-sg-compte]')!.textContent!;
      const m=/^(\d+)\/(\d+)$/.exec(compte.trim());
      if(m&&Number(m[1])>0)expect(b.querySelector('[data-dp-sg-montant]')!.textContent,`${mot} : ${b.textContent}`).not.toMatch(/^\s*0,00\s*$/);
    }
  });
});
