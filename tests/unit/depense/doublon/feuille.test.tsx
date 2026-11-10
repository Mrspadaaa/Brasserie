// @vitest-environment jsdom
import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup,within} from '@testing-library/react';
import {webcrypto} from 'node:crypto';
// Voie dp-doublon : la feuille « Nouvelle dépense » devant une pièce déjà saisie. Gemini jamais appelé : `scanDocument` simulé et compté.
const state=vi.hoisted(()=>({scanned:vi.fn(),transactions:[] as any[],stocks:{rawMaterials:[] as any[],cleaning:[] as any[],equipment:[] as any[]},payments:[] as any[]}));
vi.mock('../../../../src/services/storage',()=>({StorageService:{getStocks:()=>state.stocks,getTransactions:()=>state.transactions,confirmPendingWrites:async()=>undefined}}));
vi.mock('../../../../src/services/financeService',()=>({FinanceService:{getPlans:()=>[],getPayments:()=>state.payments}}));
vi.mock('../../../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:(error:any)=>error?.status==='rejected'}));
vi.mock('../../../../src/services/geminiScanner',()=>({GeminiScannerService:{scanDocument:(...args:any[])=>state.scanned(...args),fileToDataUrl:async()=>'data:application/pdf;base64,JVBERi0xLjQK',normalizeMimeType:()=>'application/pdf'}}));
import {ExpenseSheet} from '../../../../src/ui/finance/ExpenseSheet';
import {FirebaseAuthService} from '../../../../src/services/firebaseAuth';

const OCTETS='%PDF-1.4\nfacture fictive F-1001\n';
const empreinte=async(texte:string)=>Array.from(new Uint8Array(await webcrypto.subtle.digest('SHA-256',new TextEncoder().encode(texte))),b=>b.toString(16).padStart(2,'0')).join('');
const enregistree=(finance:Record<string,unknown>={})=>({id:'TX-fictive-1',date:'12.10.2026',amountTTC:312.4,description:'Malt et houblons',category:'brassage',
  finance:{version:1,kind:'expense',amountCents:31240,vendor:'Fournisseur fictif SA',invoiceNumber:'F-1001',sourceOrderNumber:'CMD-7001',paymentStatus:'unpaid',recordedAt:new Date().toISOString(),
    lines:[{id:'l1',description:'Maris Otter 25 kg',kind:'ingredient',amountCents:6000,quantity:25,unit:'kg',stockItemRef:'MP-MO'},{id:'l2',description:'Citra T90',kind:'ingredient',amountCents:3000,quantity:100,unit:'g',stockItemRef:'MP-CI'},{id:'l3',description:'Frais de port',kind:'service',amountCents:22240}],...finance}}) as any;
const lecture=(more:Record<string,unknown>={})=>({ok:true,model:'simule',cached:false,result:{vendor:'Fournisseur Fictif',date:'14.10.2026',currency:'CHF',invoiceNumber:'',orderNumber:'CMD-7001',description:'Commande en ligne',amountHT:null,tvaRate:null,tvaAmount:null,amountTTC:312.65,category:'brassage',subcategory:'Matières premières',issues:[],documentType:'order_confirmation',
  items:[{id:'i1',name:'Maris Otter',kind:'stock',quantity:25,unit:'kg',amountTTC:60,evidence:'Maris Otter 25 kg'}],...more}});

beforeEach(()=>{
  cleanup();vi.restoreAllMocks();
  Object.defineProperty(crypto,'subtle',{configurable:true,value:webcrypto.subtle});
  state.scanned.mockReset().mockResolvedValue(lecture());
  state.stocks={rawMaterials:[{ref:'MP-MO',name:'Maris Otter',unit:'kg',currentStock:25,category:'Malt'},{ref:'MP-CI',name:'Citra 12.5%',unit:'g',currentStock:100,category:'Houblon'}],cleaning:[],equipment:[]};
  state.payments=[];
  vi.spyOn(FirebaseAuthService,'ensureDriveAccessToken').mockResolvedValue('synthetic-token');
  vi.spyOn(FirebaseAuthService,'hasDriveAccess').mockReturnValue(true);
});
async function joindre(texte=OCTETS,props:{onClose?:()=>void;onOpenExpense?:(id:string)=>void}={}){
  const view=render(<ExpenseSheet onClose={props.onClose??(()=>{})} onSaved={()=>{}} onOpenExpense={props.onOpenExpense}/>);
  const file=new File([texte],'commande-7001.pdf',{type:'application/pdf'});
  Object.defineProperty(file,'arrayBuffer',{value:async()=>new TextEncoder().encode(texte).buffer});
  fireEvent.change(view.container.querySelector('input[type="file"]')!,{target:{files:[file]}});
  return view;
}

describe('le même fichier qu’une dépense saisie',()=>{
  it('se dit tout de suite, sans lecture : « Déjà enregistré », la facture, le règlement et les articles de stock par leur nom',async()=>{
    state.transactions=[enregistree({sourceDocumentHash:await empreinte(OCTETS)})];
    await joindre();
    const carte=await screen.findByRole('region',{name:'Pièce déjà enregistrée'});
    expect(state.scanned).not.toHaveBeenCalled();
    expect(within(carte).getByText('Déjà enregistré')).toBeVisible();
    expect(carte).toHaveTextContent('F-1001');expect(carte).toHaveTextContent('12.10.2026');expect(carte).toHaveTextContent('312,40 CHF');
    expect(carte).toHaveTextContent('À payer');
    const liens=carte.querySelector<HTMLElement>('[data-dp-liens]')!;expect(within(liens).getByText('Maris Otter')).toBeVisible();expect(within(liens).getByText('Citra 12.5%')).toBeVisible();expect(liens).toHaveTextContent('25 kg');
    expect(carte.textContent).not.toMatch(/empreinte|hash|peut-être/i);
    expect([...carte.querySelectorAll('[data-dp-lignes] li')].map(li=>(li.textContent??'').replace(/\s/g,' '))).toEqual(['Maris Otter 25 kg25 kg60,00 CHF','Citra T90100 g30,00 CHF','Frais de port222,40 CHF']);
    expect(screen.queryByRole('button',{name:/Enregistrer|Confirmer/})).toBeNull();
    expect(screen.getByRole('button',{name:'Fermer sans rien enregistrer'})).toBeVisible();
    expect(screen.queryByLabelText('Total TTC en CHF')).toBeNull();
  });
  it('« Ouvrir la dépense » : la feuille se ferme, puis la fiche de la dépense existante s’ouvre',async()=>{
    state.transactions=[enregistree({sourceDocumentHash:await empreinte(OCTETS)})];
    const ordre:string[]=[];
    await joindre(OCTETS,{onClose:()=>ordre.push('fermer'),onOpenExpense:id=>ordre.push('ouvrir '+id)});
    fireEvent.click(await screen.findByRole('button',{name:'Ouvrir la dépense'}));
    expect(ordre).toEqual(['fermer','ouvrir TX-fictive-1']);
    expect(state.scanned).not.toHaveBeenCalled();
  });
  it('plus de deux articles : leur nombre au repos, les noms à un toucher',async()=>{
    state.stocks.rawMaterials.push({ref:'MP-SA',name:'Saaz',unit:'g'},{ref:'MP-PI',name:'Pilsner',unit:'kg'});
    const base=enregistree();
    state.transactions=[enregistree({sourceDocumentHash:await empreinte(OCTETS),lines:[...base.finance.lines,{id:'l4',description:'Saaz',kind:'ingredient',amountCents:900,stockItemRef:'MP-SA'},{id:'l5',description:'Pilsner',kind:'ingredient',amountCents:900,stockItemRef:'MP-PI'}]})];
    await joindre();
    const carte=await screen.findByRole('region',{name:'Pièce déjà enregistrée'});
    expect(carte.querySelector('[data-dp-liens]')).not.toHaveTextContent('Saaz');
    fireEvent.click(within(carte).getByRole('button',{name:'Voir les 4 articles'}));
    expect(carte.querySelector('[data-dp-liens]')).toHaveTextContent('Saaz');expect(carte.querySelector('[data-dp-liens]')).toHaveTextContent('Pilsner');
  });
  it('« Lire quand même » : la lecture part une fois, puis la section actuelle dit le lien au stock',async()=>{
    state.transactions=[enregistree({sourceDocumentHash:await empreinte(OCTETS)})];
    state.scanned.mockResolvedValue(lecture({invoiceNumber:'F-1001',amountTTC:312.4,orderNumber:'CMD-7001',documentType:'invoice'}));
    await joindre();
    fireEvent.click(await screen.findByRole('button',{name:'Lire quand même'}));
    await waitFor(()=>expect(state.scanned).toHaveBeenCalledOnce());
    const section=await screen.findByRole('region',{name:'Achat déjà enregistré · même fichier'});
    expect(section).toHaveTextContent('Même fichier déjà joint');
    expect(section.textContent).not.toMatch(/peut-être/);
    expect(section.querySelector('[data-dp-lien]')).toHaveTextContent('Lié au stock : Maris Otter, Citra 12.5%');
    expect(screen.queryByRole('region',{name:'Pièce déjà enregistrée'})).toBeNull();
  });
  it('une ancienne dépense sans empreinte : inchangé, la lecture part',async()=>{
    state.transactions=[enregistree()];
    await joindre();
    await waitFor(()=>expect(state.scanned).toHaveBeenCalledOnce());
    expect(screen.queryByRole('region',{name:'Pièce déjà enregistrée'})).toBeNull();
  });
});

describe('la même commande, deux totaux',()=>{
  it('la page web sans n° de facture et 0,25 d’écart : signal, les deux totaux, l’écart, le lien au stock',async()=>{
    state.transactions=[enregistree()];
    await joindre('%PDF-1.4\npage web\n');
    const section=await screen.findByRole('region',{name:'Même commande sous un autre numéro'});
    expect(state.scanned).toHaveBeenCalledOnce();
    expect(section).toHaveTextContent('Même commande 7001, autre total');
    expect(section.querySelector('[data-dp-jours]')).toHaveTextContent('+2 j');expect(section.textContent).not.toMatch(/j d’écart/);
    expect(section).toHaveTextContent('312,65 CHF');expect(section).toHaveTextContent('312,40 CHF');
    expect(section.querySelector('[data-dp-ecart]')).toHaveTextContent('+0,25');
    expect(section.querySelector('[data-dp-lien]')).toHaveTextContent('Lié au stock : Maris Otter, Citra 12.5%');
    expect(screen.getByRole('button',{name:'Confirmer et enregistrer'})).toBeEnabled();
  });
  it('sans n° de commande lu : rien de neuf',async()=>{
    state.transactions=[enregistree()];
    state.scanned.mockResolvedValue(lecture({orderNumber:null}));
    await joindre('%PDF-1.4\npage web\n');
    await screen.findByRole('button',{name:'Confirmer et enregistrer'});
    expect(screen.queryByRole('region',{name:'Même commande sous un autre numéro'})).toBeNull();
    expect(screen.queryByRole('region',{name:'Achat peut-être déjà enregistré'})).toBeNull();
  });
});
