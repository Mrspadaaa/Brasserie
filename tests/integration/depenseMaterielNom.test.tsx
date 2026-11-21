import React from 'react';
import {beforeEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
/* F-NOM (D396, G3 et G1, D2) : l'achat de matériel s'ouvre sur un nom posé (projet, sinon catégorie), Entrée passe au total,
   et le prix du dernier achat semblable est PROPOSÉ (un toucher le garde), jamais posé seul. Données « ZZ TEST » simulées. */
const data=vi.hoisted(()=>({equipment:[{ref:'E-ZZ-1',name:'Matériel'}] as Array<{ref:string;name:string}>,transactions:[{id:'T-ZZ-POMPE',date:'2026-01-25',description:'ZZ TEST Pompe de brassage',vendor:'ZZ TEST',category:'materiel',subcategory:'',amountHT:420,amountTTC:420,tvaAmount:0,tvaRate:0,
  finance:{version:1,kind:'expense',amountCents:42000,lines:[{id:'L-ZZ-POMPE',description:'ZZ TEST Pompe de brassage',kind:'equipment',amountCents:42000}],paymentStatus:'paid',paymentDate:'2026-01-25',recordedAt:'2026-01-25T09:00:00.000Z'}}] as unknown[],
  plans:[] as unknown[]}));
vi.mock('../../src/services/storage',()=>({StorageService:{getStocks:()=>({rawMaterials:[],cleaning:[],equipment:data.equipment}),getTransactions:()=>data.transactions,confirmPendingWrites:async()=>{}}}));
vi.mock('../../src/services/financeService',()=>({FinanceService:{getPlans:()=>data.plans}}));
vi.mock('../../src/services/firestoreRepo',()=>({isConfirmedWriteRejection:()=>false}));
import {ExpenseSheet} from '../../src/ui/finance/ExpenseSheet';

const quoi=()=>screen.getByLabelText('Pour quoi ?') as HTMLInputElement;
beforeEach(()=>{cleanup();data.plans=[];data.equipment=[{ref:'E-ZZ-1',name:'Matériel'}];});

describe('Achat de matériel : nom posé, Entrée, prix proposé (F-NOM)',()=>{
  it('« Pour quoi ? » porte le nom de la catégorie, au premier numéro libre ; Entrée passe au total',()=>{
    render(<ExpenseSheet initialIntent="equipment" onClose={()=>{}} onSaved={()=>{}}/>);
    expect(quoi().value).toBe('Matériel 2');
    expect(quoi().getAttribute('enterkeyhint')).toBe('next');
    quoi().focus();
    fireEvent.keyDown(quoi(),{key:'Enter'});
    expect(document.activeElement?.id).toBe('purchase-total');
  });
  it('au nom du projet lié quand il y en a un',()=>{
    data.plans=[{id:'P-ZZ',title:'ZZ TEST Pompe de transfert',status:'active',direction:'out',source:'equipment',vendor:'ZZ TEST'}];
    render(<ExpenseSheet initialIntent="equipment" initialPlanId="P-ZZ" onClose={()=>{}} onSaved={()=>{}}/>);
    expect(quoi().value).toBe('ZZ TEST Pompe de transfert');
  });
  it('une dépense ordinaire reste sans nom posé',()=>{
    render(<ExpenseSheet onClose={()=>{}} onSaved={()=>{}}/>);
    expect(quoi().value).toBe('');
  });
  it('le dernier achat semblable est proposé, le total reste vide tant qu’on ne le garde pas',()=>{
    const view=render(<ExpenseSheet initialIntent="equipment" onClose={()=>{}} onSaved={()=>{}}/>);
    expect(view.container.querySelector('[data-prix-semblable]')).toBeNull(); // « Matériel » : rien de semblable, rien d'inventé
    fireEvent.change(quoi(),{target:{value:'Pompe de brassage'}});
    const puce=view.container.querySelector<HTMLButtonElement>('[data-prix-semblable]')!;
    expect(puce.textContent).toContain('420,00');
    expect(puce.textContent).toContain('ZZ TEST Pompe de brassage 2026');
    expect((document.getElementById('purchase-total') as HTMLInputElement).value).toBe('');
    fireEvent.click(puce);
    expect((document.getElementById('purchase-total') as HTMLInputElement).value).toBe('420,00');
    expect(view.container.querySelector('[data-prix-semblable]')).toBeNull();
    expect(view.container.querySelector('[data-prix-estime]')?.textContent).toContain('estimé');
  });
});
