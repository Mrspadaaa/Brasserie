import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
/* 09.11, ses mots : « une mini recherche pour vérifier qu'un item est bien présent » ; « afficher le total d'items attendu, et le total réellement trouvé, pareil pour les chf, le total, total trouvé,
   total effectif et flaggé si au moins une des combinaisons est pas correct » ; « Lignes 277,60 · total 352,05 · 74,45 de moins : donne aucune info ». Lecture SIMULÉE de son ticket (fixture anonymisée). */
const state=vi.hoisted(()=>({saved:vi.fn(),scanned:vi.fn(),confirmed:vi.fn().mockResolvedValue(undefined)}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:[]}),getTransactions:()=>[],confirmPendingWrites:()=>state.confirmed()}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[]}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
vi.mock('../../src/services/purchaseEntry',async importOriginal=>({...await importOriginal<any>(),savePurchaseWithProofReceipt:async(draft:any)=>{await state.saved(draft);return {transactionId:'TX-test'};},confirmPurchase:async()=>undefined}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../src/services/firebaseAuth';
import {lectureTicket} from './depenseTotaux.fixture';
beforeEach(()=>{cleanup();vi.restoreAllMocks();state.saved.mockReset();state.scanned.mockReset();vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');vi.spyOn(FirebaseAuthService,'prepareGoogleLogin').mockResolvedValue();vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});Element.prototype.scrollIntoView=vi.fn();});
const joindre=(container:HTMLElement)=>{const file=new File(['%PDF-1.4\n'],'Ticket synthétique.pdf',{type:'application/pdf'});Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode('%PDF-1.4\n').buffer});fireEvent.change(container.querySelector('input[type="file"]')!,{target:{files:[file]}});};
const ouvrir=async(over:Record<string,unknown>={})=>{
  state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lectureTicket(over)});
  const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
  joindre(view.container);
  await screen.findByRole('region',{name:'Vérification du justificatif'});
  await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
  return view;
};
const bloc=(view:{container:HTMLElement})=>view.container.querySelector<HTMLElement>('[data-dp="preuve"]')!;
const rang=(view:{container:HTMLElement},cle:RegExp)=>Array.from(bloc(view).querySelectorAll<HTMLElement>('[data-dp="controle"]')).find(e=>cle.test(e.textContent??''))!;
const visibles=(view:{container:HTMLElement})=>Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-ligne]')).filter(e=>!e.closest('[hidden]'));

describe('Dépense : mini recherche dans les lignes lues',()=>{
  it('« serre » montre SERRE-JOINT seul, les groupes s’ouvrent sur la trouvaille',async()=>{
    const view=await ouvrir();
    fireEvent.change(screen.getByLabelText('Chercher dans les lignes lues'),{target:{value:'serre'}});
    await waitFor(()=>expect(visibles(view)).toHaveLength(1));
    expect(visibles(view)[0].textContent).toMatch(/SERRE-JOINT/i);
    expect(view.container.querySelector('[data-dp="recherche-etat"]')!.textContent).toBe('1 ligne sur 29');
  });
  it('« 14,90 » trouve sa ligne (et « 14.90 » aussi)',async()=>{
    const view=await ouvrir();
    const champ=screen.getByLabelText('Chercher dans les lignes lues');
    fireEvent.change(champ,{target:{value:'14,90'}});
    await waitFor(()=>expect(visibles(view).length).toBeGreaterThan(0));
    expect(visibles(view).some(e=>/SERRE-JOINT/i.test(e.textContent??''))).toBe(true);
    fireEvent.change(champ,{target:{value:'14.90'}});
    await waitFor(()=>expect(visibles(view).some(e=>/SERRE-JOINT/i.test(e.textContent??''))).toBe(true));
  });
  it('« marteau » dit que l’article manque ; Échap vide et rend les 29 lignes ; rien n’est écrit dans les données',async()=>{
    const view=await ouvrir();
    const champ=screen.getByLabelText('Chercher dans les lignes lues');
    fireEvent.change(champ,{target:{value:'marteau'}});
    await waitFor(()=>expect(view.container.querySelector('[data-dp="recherche-etat"]')!.textContent).toMatch(/Aucune ligne ne contient « marteau »/));
    expect(visibles(view)).toHaveLength(0);
    fireEvent.keyDown(champ,{key:'Escape'});
    await waitFor(()=>expect((champ as HTMLInputElement).value).toBe(''));
    await waitFor(()=>expect(visibles(view).length).toBeGreaterThan(0));
    expect(bloc(view).querySelectorAll('[data-dp-verdict="ecart"]').length).toBeGreaterThan(0);
  });
});

describe('Dépense : contrôles croisés (le bloc refait)',()=>{
  it('ticket du brasseur : 29 trouvés, lignes 277,60, imprimé 352,05, payé 352,05 ; drapeau levé, écart 74,45 ; Qté × prix ne passe pas au vert',async()=>{
    const view=await ouvrir();
    const articles=rang(view,/Articles/);
    expect(articles.textContent).toMatch(/29/);
    expect(articles.getAttribute('data-dp-verdict')).toBe('ok');
    const somme=rang(view,/Somme/);
    expect(somme.textContent).toContain('277,60');
    expect(somme.textContent).toContain('352,05');
    expect(somme.textContent).toContain('−74,45');
    expect(somme.getAttribute('data-dp-verdict')).toBe('ecart');
    const paye=rang(view,/Payé/);
    expect(paye.textContent).toContain('TWINT');
    expect(paye.textContent).toContain('352,05');
    expect(rang(view,/Qté × prix/).getAttribute('data-dp-verdict')).not.toBe('ok');
    expect(rang(view,/Qté × prix/).textContent).toMatch(/29\/29 justes/); expect(rang(view,/Qté × prix/).textContent).not.toMatch(/incomplet/); // d2, critique 5
    expect(bloc(view).getAttribute('data-dp-drapeau')).toBe('1');
    expect(within(bloc(view)).getByRole('status').textContent).toMatch(/74,45 CHF/);
  });
  it('la phrase « de moins » devient ce qui manque, dit UNE fois dans le bloc ; la bande de gestes (ajouter, photo) n’apparaît qu’une fois la recherche ouverte (d2, critique 4 et 9)',async()=>{
    const view=await ouvrir({countedAmounts:31});
    expect(view.container.textContent).not.toMatch(/74,45 de moins/);
    expect(within(bloc(view)).getByRole('status').textContent).toMatch(/74,45 CHF/);
    expect(view.container.querySelector('[data-dp="fin"]')!.textContent).not.toMatch(/non retrouvés/);
    expect(view.container.querySelector('[data-dp="manque"]')).toBeNull();
    fireEvent.focus(screen.getByLabelText('Chercher dans les lignes lues'));
    await waitFor(()=>expect(view.container.querySelector('[data-dp="manque"]')).not.toBeNull());
    const bande=view.container.querySelector<HTMLElement>('[data-dp="manque"]')!;
    expect(bande.textContent).toMatch(/illisible, cachée ou rabais/);
    expect(within(bande).queryByRole('button',{name:/Chercher/})).toBeNull();
    expect(within(bande).getByRole('button',{name:/Ajouter la ligne/})).toBeTruthy();
  });
  it('compte concordant (29 = 29) : aucune ligne ne manque, donc aucune bande « non retrouvés »',async()=>{
    const view=await ouvrir();
    fireEvent.focus(screen.getByLabelText('Chercher dans les lignes lues'));
    expect(view.container.querySelector('[data-dp="manque"]')).toBeNull();
  });
  it('nombre d’articles imprimé absent : « non imprimé », jamais 0 ni inventé ; payé sans montant : « montant non lu »',async()=>{
    const view=await ouvrir({printedLineCount:null,countedAmounts:null,amountPaid:undefined});
    expect(rang(view,/Articles/).textContent).toMatch(/non imprimé/);
    expect(rang(view,/Articles/).getAttribute('data-dp-verdict')).toBe('inconnu');
    expect(rang(view,/Payé/).textContent).toMatch(/montant non lu/);
    expect(rang(view,/Payé/).getAttribute('data-dp-verdict')).toBe('inconnu');
  });
  it('articles imprimés 31, trouvés 29 : drapeau, écart de 2 articles',async()=>{
    const view=await ouvrir({countedAmounts:31});
    const articles=rang(view,/Articles/);
    expect(articles.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(articles.textContent).toMatch(/29 \/ 31/);
    expect(articles.textContent).toContain('−2');
    expect(within(bloc(view)).getByRole('status').textContent).toMatch(/74,45 CHF · 2 articles/);
  });
  it('tout concorde : pas de drapeau, Qté × prix vert',async()=>{
    // Le total imprimé égal à la somme des lignes (277,60) et le payé aussi.
    const view=await ouvrir({amountTTC:277.6,amountPaid:277.6});
    expect(bloc(view).getAttribute('data-dp-drapeau')).toBeNull();
    expect(rang(view,/Somme/).getAttribute('data-dp-verdict')).toBe('ok');
    expect(rang(view,/Qté × prix/).getAttribute('data-dp-verdict')).toBe('ok');
    expect(view.container.querySelector('[data-dp="manque"]')).toBeNull();
  });
});

describe('Dépense : chaque pastille d’erreur mène à son geste',()=>{
  it('p1 ligne manquante : « Ajouter la ligne manquante » ajoute une ligne neuve, ouverte, nom à saisir, sans toucher à la recherche ; deux manquent (31 comptées pour 29 lues) : montant vide',async()=>{
    const view=await ouvrir({countedAmounts:31});
    const somme=rang(view,/Somme/);
    expect(somme.textContent).toMatch(/Ajouter la ligne manquante/);
    expect(somme.textContent).not.toMatch(/Chercher la ligne manquante/);
    const avant=view.container.querySelectorAll('[data-dp-ligne]').length;
    fireEvent.click(somme);
    await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBe(avant+1));
    await waitFor(()=>expect(document.activeElement).toBe(screen.getByLabelText('Libellé ligne '+(avant+1))));
    expect(document.activeElement).not.toBe(screen.getByLabelText('Chercher dans les lignes lues'));
    expect((screen.getByLabelText('Montant ligne '+(avant+1)) as HTMLInputElement).value).toBe('');
  });
  it('p1 un seul article manque (30 comptées pour 29 lues) : la ligne ajoutée a pour montant le manque, 74,45',async()=>{
    const view=await ouvrir({countedAmounts:30});
    const avant=view.container.querySelectorAll('[data-dp-ligne]').length;
    fireEvent.click(rang(view,/Articles/));
    await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBe(avant+1));
    await waitFor(()=>expect((screen.getByLabelText('Montant ligne '+(avant+1)) as HTMLInputElement).value).toMatch(/^74[,.]45$/));
    expect(document.activeElement).toBe(screen.getByLabelText('Libellé ligne '+(avant+1)));
  });
  it('p1 les totaux faux sont rouges (articles, somme, payé) et l’en-tête aussi ; un autre écart reste ambre',async()=>{
    const view=await ouvrir({countedAmounts:31,amountPaid:300});
    for(const re of [/Articles/,/Somme/,/Payé/])expect(rang(view,re).getAttribute('data-dp-ton'),String(re)).toBe('rouge');
    expect(view.container.querySelector('[data-dp="drapeau"]')!.getAttribute('data-dp-ton')).toBe('rouge');
    expect(view.container.querySelector('[data-dp="drapeau"]')!.className).toMatch(/text-alert/);
    expect(rang(view,/Somme/).className).toMatch(/border-alert/);
    expect(rang(view,/Somme/).className).not.toMatch(/attention/);
  });
  it('ligne en trop : la ligne dont le montant est l’écart s’ouvre pour la modifier ou la retirer',async()=>{
    // Total imprimé 270,60 : les lignes dépassent de 7,00 ; aucune ligne ne vaut 7,00 → la liste ; avec 269,65 : 7,95 (CHARNIERE) est la ligne en trop.
    const view=await ouvrir({amountTTC:269.65,amountPaid:269.65});
    const somme=rang(view,/Somme/);
    expect(somme.getAttribute('data-dp-renvoi')).toBe('fausse');
    fireEvent.click(somme);
    await waitFor(()=>{const l=view.container.querySelector<HTMLElement>('[data-dp-ligne]:has(details[open])');expect(l?.textContent).toMatch(/CHARNIERE/);});
  });
  it('total imprimé douteux (le payé égale les lignes) : la pastille mène au champ du total, dite « rare »',async()=>{
    const view=await ouvrir({amountPaid:277.6});
    const paye=rang(view,/Payé/);
    expect(paye.getAttribute('data-dp-renvoi')).toBe('total');
    expect(paye.textContent).toMatch(/rare/);
    fireEvent.click(paye);
    expect(document.activeElement?.id).toBe('purchase-total');
  });
  it('règlement différent du total : la pastille ouvre le panneau du règlement',async()=>{
    const view=await ouvrir({amountPaid:300});
    const paye=rang(view,/Payé/);
    expect(paye.getAttribute('data-dp-renvoi')).toBe('reglement');
    fireEvent.click(paye);
    await waitFor(()=>expect(view.container.querySelector('[data-dp="panneau-paye"]')).not.toBeNull());
  });
});

/* Banc b1 (09.11), lectures rejouées ANONYMISÉES : P2 le faux vert des articles, P3 les lignes d’une seule lecture, P4 les rabais. */
import {lectureTacheFinale,lectureTacheProvisoire,lectureRabais} from './depenseTotaux.fixture';
describe('Dépense : défauts du banc réel (b1)',()=>{
  it('P2 : tache, 23 lignes lues et 23 annoncées : « Articles lus » n’est pas vert, dit « annoncé par la lecture »',async()=>{
    state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lectureTacheFinale()});
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    joindre(view.container);
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
    const articles=rang(view,/Articles/);
    expect(articles.getAttribute('data-dp-verdict')).not.toBe('ok');
    expect(articles.textContent).toMatch(/23/);
    expect(articles.parentElement!.nextElementSibling!.textContent).toMatch(/annoncé par la lecture/);
    expect(articles.textContent).not.toMatch(/annoncé/); // p1 : la valeur reste courte, « annoncé » est la note sous la rangée (jamais sur le libellé à 390)
    expect(rang(view,/Somme/).textContent).toContain('−117,65');
  });
  it('P2 : avec un nombre d’articles imprimé lu (29), les 23 lignes lèvent l’écart de 6 articles',async()=>{
    state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lectureTacheFinale({countedAmounts:29})});
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    joindre(view.container);
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
    const articles=rang(view,/Articles/);
    expect(articles.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(articles.textContent).toMatch(/23 \/ 29/);
    expect(articles.textContent).toContain('−6');
  });
  it('P4 : sunstore-2 : 3 articles et 2 rabais (5 lignes annoncées) : « 3 · 2 rabais », aucun écart sur les articles ni sur les CHF',async()=>{
    state.scanned.mockResolvedValueOnce({ok:true,model:'simule',cached:false,result:lectureRabais()});
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    joindre(view.container);
    await screen.findByRole('region',{name:'Vérification du justificatif'});
    await waitFor(()=>expect(view.container.querySelectorAll('[data-dp-ligne]').length).toBeGreaterThan(0));
    const articles=rang(view,/Articles/);
    expect(articles.textContent).toMatch(/3 · 2 rabais/);
    expect(articles.getAttribute('data-dp-verdict')).not.toBe('ecart');
    expect(rang(view,/Somme/).getAttribute('data-dp-verdict')).toBe('ok');
    expect(bloc(view).getAttribute('data-dp-drapeau')).toBeNull();
  });
  it('P3 : tache, une lecture avait 28 lignes : les 5 lignes en plus (34,30) s’affichent à part ; « Les garder » les rend à la liste et à la somme',async()=>{
    const prov=lectureTacheProvisoire(),fin:any=lectureTacheFinale({provisoireJeton:'jeton-b1'});
    fin.items=fin.items.map((it:any,i:number)=>({...it,rangProvisoire:i}));
    state.scanned.mockImplementation(async(_f:any,_t:any,opts:any)=>{
      opts?.onProvisoire?.({ok:true,model:'simule',cached:false,result:prov,proofDataUrl:'',fileName:'f.pdf',mimeType:'application/pdf',jeton:'jeton-b1'});
      await new Promise(r=>setTimeout(r,30));
      return {ok:true,model:'simule',cached:false,result:fin,proofDataUrl:'',fileName:'f.pdf',mimeType:'application/pdf'};
    });
    const view=render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    joindre(view.container);
    await waitFor(()=>expect(view.container.querySelector('[data-dp-controle-cle="une-lecture"]')).not.toBeNull(),{timeout:4000});
    const r=view.container.querySelector<HTMLElement>('[data-dp-controle-cle="une-lecture"]')!;
    expect(r.textContent).toMatch(/Vues par une seule lecture/);
    expect(r.textContent).toContain('5 · +34,30');
    expect(r.getAttribute('data-dp-renvoi')).toBe('perdues');
    fireEvent.click(r);
    await waitFor(()=>expect(rang(view,/Somme/).textContent).toContain('268,70'));
    expect(view.container.querySelector('[data-dp-controle-cle="une-lecture"]')).toBeNull();
  });
});
