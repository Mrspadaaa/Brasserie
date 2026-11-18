import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* s1 (09.11), les 5 problèmes du jeu en ligne (critique/VERDICT-EN-LIGNE.md) : « Qté × prix 0/5 », « TaxeSansTVA - 0% » au lieu de « Rabais », BAUHAUS sans aucune quantité (« 0/29 »), la recherche « peinture » qui ne trouve pas
   le sous-groupe « Peinture et sols », un mot brut (« other ») dans la barre basse. Lectures SIMULÉES, à la forme réelle du serveur (`quantity` null, `price` = montant) : Gemini n'est jamais appelé. */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined),transactions:[] as any[],traduire:vi.fn()}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>state.transactions,confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/nomsFr',async importOriginal=>({...await importOriginal<any>(),traduireLignes:(lignes:any[])=>state.traduire(lignes)}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {makePoint} from '../../functions/src/invoiceControls';
import {PESE_PAR_CODE} from '../../src/domain/finance/invoicePoints';
import {lectureTicket,lectureRabais} from './depenseTotaux.fixture';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();state.traduire.mockReset();state.traduire.mockResolvedValue(new Map());state.transactions=[];vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(lecture:any)=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lecture});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
const rangee=(view:{container:HTMLElement},cle:string)=>view.container.querySelector<HTMLElement>(`[data-dp="preuve"] [data-dp-controle-cle="${cle}"]`);

describe('s1-p1 : « Qté × prix » : une seule règle, les rabais hors du compte, quel que soit l’état de la lecture',()=>{
  /** Sun Store 2 lu en ligne : les trois articles sans prix unitaire (le serveur n'en rend pas), deux rabais, `controls.lines` vide (rien de vérifiable côté serveur). */
  const enLigne=(over:{qtes:number[]})=>{
    const l:any=lectureRabais();
    l.items=l.items.map((it:any,i:number)=>i<3?{...it,price:null,quantity:over.qtes[i]}:it);
    l.controls={...l.controls,lines:{checked:0,failed:0,skipped:0,skippedIds:[]}};
    return l;
  };
  it('articles à 1 pièce (prix unitaire = total) : vérifiables, jamais « 0/5 » ; une prestation à 2 sans prix : dite à part',async()=>{
    const view=await ouvrir(enLigne({qtes:[1,1,2]}));
    const r=rangee(view,'qte')!;
    expect(r.textContent).not.toMatch(/\/5/);
    expect(r.textContent).toMatch(/2\/2/);
    expect(r.textContent).toMatch(/1 sans prix unitaire/);
  });
  it('aucun prix unitaire exploitable (quantités de 2) : le dénominateur est 3 articles, jamais 5 avec les rabais',async()=>{
    const view=await ouvrir(enLigne({qtes:[2,2,2]}));
    const r=rangee(view,'qte')!;
    expect(r.textContent).not.toMatch(/\/5/);
    expect(r.textContent).not.toMatch(/\/4/);
  });
});

describe('s1-p2 : la sous-ligne d’un rabais s’appelle « Rabais », jamais le libellé de taxe traduit',()=>{
  it('la traduction des noms ne touche pas un rabais : « NoVatTax - 0% » ne devient pas « TaxeSansTVA - 0% »',async()=>{
    state.traduire.mockImplementation(async(lignes:any[])=>new Map(lignes.map((l:any,rang:number)=>[rang,l.name==='NoVatTax - 0%'?'TaxeSansTVA - 0%':`Fr ${l.name}`])));
    const view=await ouvrir(lectureRabais());
    await new Promise(r=>setTimeout(r,60));
    const rab=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-rabais]'));
    expect(rab.length).toBe(2);
    for(const r of rab){expect(r.textContent).not.toMatch(/TaxeSansTVA/);expect(r.querySelector('[data-dp-nom]')!.textContent).toBe('Rabais');}
    expect(state.traduire.mock.calls.flatMap((c:any[])=>c[0]).map((l:any)=>l.kind)).not.toContain('discount');
  });
});

describe('s1-p3 : une lecture sans quantité imprimée (ticket de magasin) : prix unitaire = montant, la quantité est 1',()=>{
  /** La forme du serveur sur un ticket BAUHAUS : `quantity` null, `unit` vide, `price` = `amountTTC` (voir `montantDeLigne`, `invoiceScanCore.ts`). */
  const reel=()=>{
    const l:any=lectureTicket({countedEans:undefined});
    l.items=l.items.map((it:any)=>({...it,quantity:null,unit:''}));
    l.controls={...l.controls,lines:{checked:0,failed:0,skipped:29,skippedIds:l.items.map((i:any)=>i.id)}};
    return l;
  };
  it('« Qté × prix » : 29/29 justes, pas 0/29',async()=>{
    const view=await ouvrir(reel());
    const r=rangee(view,'qte')!;
    expect(r.textContent).toMatch(/29\/29/);
    expect(r.textContent).not.toMatch(/0\/29/);
  });
  it('la fiche d’une ligne montre « 1 » dans la quantité',async()=>{
    const view=await ouvrir(reel());
    const l=view.container.querySelector<HTMLElement>('[data-dp-ligne="line-3"]')!;
    fireEvent.click(l.querySelector('summary')!);
    await waitFor(()=>expect(l.querySelector<HTMLInputElement>('input[aria-label^="Quantité ligne"]')!.value).toBe('1'));
  });
  it('un prix différent du montant et pas de quantité : la quantité reste inconnue (jamais inventée)',async()=>{
    const l:any=reel();
    l.items[2]={...l.items[2],price:2.6,amountTTC:5.2};
    const view=await ouvrir(l);
    const f=view.container.querySelector<HTMLElement>('[data-dp-ligne="line-3"]')!;
    fireEvent.click(f.querySelector('summary')!);
    await waitFor(()=>expect(f.querySelector('input[aria-label^="Quantité ligne"]')).not.toBeNull());
    expect(f.querySelector<HTMLInputElement>('input[aria-label^="Quantité ligne"]')!.value).toBe('');
  });
});

describe('s1-p4 : la recherche trouve aussi le groupe et le sous-groupe d’une ligne',()=>{
  it('« peinture » : les lignes du sous-groupe « Peinture et sols » dont le nom lu est abîmé (OCR) sont trouvées',async()=>{
    const l:any=lectureTicket({countedEans:undefined});
    l.items=l.items.map((it:any,i:number)=>i===5?{...it,name:'PNCEAU PL4T 4OMM',evidence:'PNCEAU PL4T 4OMM'}:it); // « PINCEAU PLAT 40MM » abîmé : « peinture » n'y figure nulle part
    const view=await ouvrir(l);
    fireEvent.change(screen.getByLabelText('Chercher dans les lignes lues'),{target:{value:'peinture'}});
    await waitFor(()=>expect(view.container.querySelector('[data-dp="recherche-etat"]')!.textContent).toMatch(/ligne/));
    expect(view.container.querySelector('[data-dp="recherche-etat"]')!.textContent).not.toMatch(/Aucune ligne/);
    const sg=Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-sg-ligne]')).filter(b=>!b.closest<HTMLElement>('[data-dp-sg]')?.hidden).find(b=>/Peinture et sols/.test(b.textContent!));
    expect(sg).toBeTruthy();
    const m=/^(\d+)\/(\d+)$/.exec(sg!.querySelector('[data-dp-sg-compte]')!.textContent!.trim())!;
    expect(Number(m[1])).toBe(Number(m[2])); // toutes les lignes du sous-groupe sont montrées, pas seulement celles dont le nom dit « peinture »
  });
  it('un mot qui n’est ni dans une ligne ni dans un groupe : « Aucune ligne » (le manque se dit)',async()=>{
    const view=await ouvrir(lectureTicket({countedEans:undefined}));
    fireEvent.change(screen.getByLabelText('Chercher dans les lignes lues'),{target:{value:'zzxqv'}});
    await waitFor(()=>expect(view.container.querySelector('[data-dp="recherche-etat"]')!.textContent).toMatch(/Aucune ligne/));
  });
});

describe('s1-p5 : aucun mot brut du code dans la barre basse',()=>{
  const desaccordNature=()=>{
    const base=makePoint('lectures-divergentes','ecart','items',1,{regle:'lectures divergentes',message:'VITRIFIC.P.SGL 5.8KG — nature : lectures divergentes (other / equipment), vérifier les articles du justificatif.',unite:'texte',enjeu:'info',lu:1,calcule:2,origine:'lecture'});
    return {...base,pese:PESE_PAR_CODE['lectures-divergentes'],champs:['items.1.name'],valeurs:[{lecture:1,valeur:'other',retenue:false},{lecture:2,valeur:'equipment',retenue:false}]};
  };
  it('« other / equipment » se dit « autre / matériel »',async()=>{
    const view=await ouvrir(lectureTicket({review:{status:'disputed',findings:[],readers:3},points:[desaccordNature()],countedEans:undefined}));
    const bande=await waitFor(()=>{const b=view.container.querySelector<HTMLElement>('[data-dp="perdues"]');expect(b).not.toBeNull();return b!;});
    expect(bande.textContent).toMatch(/nature/);
    expect(bande.textContent).not.toMatch(/\b(other|equipment|ingredient|packaging|cleaning|maintenance)\b/);
    expect(bande.textContent).toMatch(/autre \/ matériel/);
  });
});
