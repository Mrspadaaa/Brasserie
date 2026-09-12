import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase',()=>({db:{},functions:{}}));
vi.mock('../../src/ui/Sheet',()=>({Sheet:({open,title,children,footer}:any)=>open?<div role="dialog" aria-label={title}>{children}{footer}</div>:null}));
vi.mock('recharts',()=>({ResponsiveContainer:()=>null,AreaChart:()=>null,Area:()=>null,XAxis:()=>null,YAxis:()=>null,Tooltip:()=>null,CartesianGrid:()=>null}));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { MovementSheet } from '../../src/ui/finance/MovementSheet';
import { PaymentSheet } from '../../src/ui/finance/FinanceForms';
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { todayISO, summarizeLedger } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
const tx=(patch:Partial<Transaction>={}):Transaction=>({id:'T1',description:'Achat mixte',date:todayISO(),category:'divers',subcategory:'',amountHT:150,amountTTC:150,tvaAmount:0,tvaRate:0,finance:{version:1,kind:'expense',amountCents:15000,paymentStatus:'unpaid',lines:[{id:'tool',kind:'equipment',description:'Pompe',amountCents:10000},{id:'malt',kind:'ingredient',description:'Malt',amountCents:5000}]},...patch});
const read=()=>StorageService.getTransactions();
function Workspace(){const transactions=useStorageValue(read);return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={()=>{}}/>;}
beforeEach(()=>{window.history.replaceState({},'', '/?dev-local');FirestoreRepo.startSync();StorageService.setUiState('finances_workspace','costs');});
afterEach(()=>{cleanup();FirestoreRepo.stopSync();vi.restoreAllMocks();});
describe('Comptabilité quotidienne intégrée',()=>{
  it('arrive sur une synthèse commune, distingue les montants connus et conserve la recherche entre les vues',()=>{
    StorageService.addTransaction(tx());
    StorageService.addTransaction(tx({id:'VENTE',description:'Vente festival',amountTTC:50,finance:{version:1,kind:'income',amountCents:5000,paymentStatus:'unpaid',lines:[]}}));
    StorageService.addTransaction(tx({id:'HIST',description:'Achat historique',finance:undefined}));
    render(<Workspace/>);
    expect(screen.getByRole('tab',{name:'Synthèse'})).toHaveAttribute('aria-selected','true');
    const position=within(screen.getByLabelText('Situation financière actuelle'));
    expect(position.getByText('Trésorerie').parentElement).toHaveTextContent('À compléter');
    expect(position.getByText('À payer',{exact:true}).parentElement).toHaveTextContent('150,00');
    expect(position.getByText('À encaisser',{exact:true}).parentElement).toHaveTextContent('50,00');
    expect(screen.getByRole('button',{name:/Confirmer les paiements/})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Voir les factures à payer'}));
    expect(screen.getByRole('button',{name:/^Achat mixte/})).toBeVisible();
    expect(screen.queryByRole('button',{name:/^Vente festival/})).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/^Achat historique/})).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox',{name:'Rechercher une opération'}),{target:{value:'mixte'}});
    fireEvent.click(screen.getByRole('tab',{name:'Prévisions'}));
    fireEvent.click(screen.getByRole('tab',{name:'Opérations'}));
    expect(screen.getByRole('textbox',{name:'Rechercher une opération'})).toHaveValue('mixte');
    expect(screen.getByRole('button',{name:'À payer',exact:true})).toHaveAttribute('aria-pressed','true');
  });
  it('annonce les limites de la prévision avant ses chiffres et ouvre les paiements à confirmer',()=>{
    StorageService.addTransaction(tx({finance:undefined}));
    render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Prévisions'}));
    expect(screen.getByText('Prévision incomplète')).toBeVisible();
    expect(screen.getByText('Sorties renseignées')).toBeVisible();
    expect(screen.getByText('Solde estimé en fin de période').parentElement).toHaveTextContent('À compléter');
    fireEvent.click(screen.getByRole('button',{name:/Confirmer les paiements/}));
    expect(screen.getByRole('tab',{name:'Opérations'})).toHaveAttribute('aria-selected','true');
    expect(screen.getByRole('button',{name:/^Achat mixte/})).toHaveTextContent('Paiement à confirmer');
  });
  it('fait varier les sorties et les soldes mensuels du même montant lorsque le projet de matériel est exclu',async()=>{
    FinanceService.saveProfile({...FinanceService.getProfile(),openingCash:{date:todayISO(),amountCents:100000,confirmed:true}});
    StorageService.addTransaction(tx());
    FinanceService.savePlan({id:'POMPE',title:'Pompe prévue',date:todayISO(),amountCents:20000,direction:'out',category:'materiel',source:'equipment',status:'active',createdAt:new Date().toISOString()});
    render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Prévisions'}));
    const outgoing=()=>screen.getByText(/Sorties (prévues|renseignées)/).parentElement;
    expect(outgoing()).toHaveTextContent('350,00');
    fireEvent.click(screen.getByText('Comparer les mois',{exact:true}));
    const table=within(await screen.findByRole('table',{name:'Prévision mensuelle selon le scénario sélectionné'}));
    expect(table.getAllByRole('row')[1]).toHaveTextContent('350,00 CHF650,00 CHF');
    fireEvent.click(screen.getByRole('checkbox',{name:/Inclure mes projets de matériel/}));
    expect(outgoing()).toHaveTextContent('150,00');
    expect(table.getAllByRole('row')[1]).toHaveTextContent('150,00 CHF850,00 CHF');
    expect(screen.getByText('Factures à régler').parentElement).toHaveTextContent('150,00');
  });
  it('ne redemande pas le solde déjà confirmé lorsque les paiements empêchent de calculer la trésorerie',()=>{
    FinanceService.saveProfile({...FinanceService.getProfile(),openingCash:{date:todayISO(),amountCents:100000,confirmed:true}});
    StorageService.addTransaction(tx({finance:undefined}));
    render(<Workspace/>);
    expect(screen.getByText('Trésorerie').parentElement).toHaveTextContent('À compléter');
    expect(screen.queryByRole('button',{name:/Vérifier le solde de départ/})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Confirmer les paiements/})).toBeVisible();
    fireEvent.click(screen.getByRole('tab',{name:'Prévisions'}));
    expect(screen.getByText('Prévision incomplète')).toBeVisible();
    expect(screen.queryByRole('button',{name:'Renseigner le solde de départ'})).not.toBeInTheDocument();
    expect(screen.getByRole('button',{name:/Confirmer les paiements/})).toBeVisible();
  });
  it('demande une date réelle au paiement historique et propose la date du jour pour une facture suivie',()=>{
    const unknown=tx({finance:undefined});
    const {unmount}=render(<PaymentSheet transaction={unknown} payments={[]} transactions={[unknown]} onClose={()=>{}}/>);
    expect(screen.getByLabelText('Date réelle du paiement')).toHaveValue('');
    expect(screen.getByLabelText('Date réelle du paiement')).toBeRequired();
    unmount();
    render(<PaymentSheet transaction={tx()} payments={[]} transactions={[tx()]} onClose={()=>{}}/>);
    expect(screen.getByLabelText('Date réelle du paiement')).toHaveValue(todayISO());
  });
  it('guide la préparation annuelle du solde vers les opérations de l’exercice',()=>{
    StorageService.addTransaction(tx());
    render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Annuel'}));
    fireEvent.click(screen.getByRole('button',{name:'Renseigner le solde',exact:true}));
    expect(screen.getByRole('dialog',{name:'Solde et paramètres financiers'})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'Annuler',exact:true}));
    act(()=>FinanceService.saveProfile({...FinanceService.getProfile(),openingCash:{date:todayISO(),amountCents:10000,confirmed:true}}));
    fireEvent.click(screen.getByRole('button',{name:'Ouvrir les opérations',exact:true}));
    expect(screen.getByRole('tab',{name:'Opérations'})).toHaveAttribute('aria-selected','true');
    expect(screen.getByRole('button',{name:/^Achat mixte/})).toBeVisible();
  });
  it('montre le solde réellement dû dans le journal puis dans le détail de la facture',()=>{
    FinanceService.stageNewTransactionPayment(tx(),{id:'ACOMPTE',transactionId:'T1',amountCents:5000,direction:'out',method:'bank',date:todayISO(),recordedAt:new Date().toISOString()});
    render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Opérations'}));
    fireEvent.click(screen.getByRole('button',{name:/Achat mixte.*150.*Reste 100/}));
    const dialog=within(screen.getByRole('dialog',{name:'Achat mixte'}));
    expect(dialog.getByText(/Reste à payer : 100/)).toBeVisible();
    expect(dialog.getByText(/Déjà payé : 50/)).toBeVisible();
    expect(dialog.getByLabelText('Échéance de la facture')).not.toBeVisible();
    fireEvent.click(dialog.getByText('Échéance et prévision',{exact:true}));
    expect(dialog.getByLabelText('Échéance de la facture')).toBeVisible();
  });
  it('sépare les factures des budgets et donne accès aux échéances au-delà des six premières',()=>{
    StorageService.addTransaction(tx());
    for(let i=1;i<=8;i++)FinanceService.savePlan({id:`PLAN-${i}`,title:`Achat prévu ${i}`,date:todayISO(),amountCents:1000,direction:'out',category:'divers',source:'manual',status:'active',createdAt:new Date().toISOString()});
    render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Prévisions'}));
    expect(screen.getByText('Factures à régler').parentElement).toHaveTextContent('150,00');
    expect(screen.getByText('Budgets et estimations').parentElement).toHaveTextContent('80,00');
    const due=within(screen.getByRole('heading',{name:'Prochaines échéances'}).closest('section')!);
    expect(due.queryByRole('button',{name:/^Achat prévu 8/})).not.toBeInTheDocument();
    fireEvent.click(due.getByRole('button',{name:'Voir les 3 échéances suivantes'}));
    expect(due.getByRole('button',{name:/^Achat prévu 8/})).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:'30 jours',exact:true}));
    expect(due.queryByRole('button',{name:/^Achat prévu 8/})).not.toBeInTheDocument();
  });
  it('ouvre le registre existant depuis le récapitulatif annuel et signale une valeur non confirmée',()=>{
    FinanceService.saveAsset({id:'CUVE',name:'Cuve 30 L',category:'tanks',acquisitionDate:todayISO(),inServiceDate:todayISO(),acquisitionCents:50000,businessUsePct:100,method:'declining',ratePct:20,openingYear:Number(todayISO().slice(0,4)),openingValueCents:50000,openingConfirmed:false,firstYearFraction:1});
    render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Annuel'}));
    fireEvent.click(screen.getByRole('button',{name:/^Matériel à amortir/}));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const asset=screen.getByRole('button',{name:/Cuve 30 L.*À compléter/});
    expect(asset).toBeVisible();fireEvent.click(asset);
    expect(screen.getByRole('dialog',{name:'Modifier l’amortissement'})).toBeInTheDocument();
  });
  it('affiche exactement 30 jours et douze mois glissants, y compris le dernier mois partiel',()=>{
    vi.useFakeTimers();vi.setSystemTime(new Date('2026-09-09T10:00:00Z'));
    try {
      for(const [id,date] of [['Dans 29 jours','2026-10-08'],['Dans 30 jours','2026-10-09'],['Dernier jour inclus','2027-09-08'],['Anniversaire exclu','2027-09-09']]) FinanceService.savePlan({id,title:id,date,amountCents:1000,direction:'out',category:'divers',source:'manual',status:'active',createdAt:new Date().toISOString()});
      render(<Workspace/>);fireEvent.click(screen.getByRole('tab',{name:'Prévisions'}));
      const due=()=>within(screen.getByRole('heading',{name:'Prochaines échéances'}).closest('section')!);
      fireEvent.click(screen.getByRole('button',{name:'30 jours',exact:true}));
      expect(due().getByRole('button',{name:/^Dans 29 jours/})).toBeInTheDocument();
      expect(due().queryByRole('button',{name:/^Dans 30 jours/})).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button',{name:'12 mois',exact:true}));
      expect(due().getByRole('button',{name:/^Dernier jour inclus/})).toBeInTheDocument();
      expect(due().queryByRole('button',{name:/^Anniversaire exclu/})).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
  it('déduit les avoirs des coûts et permet la navigation au clavier',()=>{
    StorageService.addTransaction(tx({finance:undefined}));
    StorageService.addTransaction(tx({id:'CREDIT',description:'Remise fournisseur',amountHT:20,amountTTC:20,finance:{version:1,kind:'refund',amountCents:2000,refundOfId:'T1',refundDirection:'in',refundApplication:'cash',paymentStatus:'unpaid',lines:[]}}));
    render(<Workspace/>);
    fireEvent.click(screen.getByRole('button',{name:'Coûts',exact:true}));
    expect(screen.getByRole('button',{name:/Autres frais\s*130/})).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('tab',{name:'Synthèse'}),{key:'ArrowRight'});
    expect(screen.getByRole('tab',{name:'Opérations'})).toHaveFocus();
    expect(screen.getByRole('tab',{name:'Opérations'})).toHaveAttribute('aria-selected','true');
  });
  it('ouvre les coûts puis retrouve une facture mixte depuis sa ligne matériel',()=>{
    StorageService.addTransaction(tx());render(<Workspace/>);
    expect(screen.getByRole('tab',{name:'Synthèse'})).toHaveAttribute('aria-selected','true');
    fireEvent.click(screen.getByRole('button',{name:'Coûts',exact:true}));
    fireEvent.click(screen.getByRole('button',{name:/^Matériel\s*100/}));
    expect(screen.getByRole('tab',{name:'Opérations'})).toHaveAttribute('aria-selected','true');
    expect(screen.getByRole('button',{name:/Achat mixte/})).toBeInTheDocument();
  });
  it('conserve une pièce sans date dans l’historique et signale son exclusion du mois',()=>{
    StorageService.addTransaction(tx({date:'inconnue',finance:undefined}));render(<Workspace/>);
    fireEvent.click(screen.getByRole('button',{name:'Coûts',exact:true}));
    // Une seule pièce : le français met le singulier jusqu'à 2 exclu, donc
    // « 1 pièce », jamais « 1 pièce(s) ». Voir `src/services/plural.ts`.
    expect(screen.getByText(/1 pièce avec une date à corriger/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Retrouver ces pièces dans l’historique'}));
    expect(screen.getByRole('button',{name:/Achat mixte/})).toBeInTheDocument();
  });
  it('fait choisir la véritable échéance récurrente remplacée par une facture',()=>{
    const item=tx({date:'01.02.2026'});StorageService.addTransaction(item);
    FinanceService.savePlan({id:'RECUR',title:'Loyer',date:'2026-01-31',amountCents:15000,direction:'out',category:'chargesFixes',source:'recurring',status:'active',recurrence:{frequency:'monthly'},createdAt:new Date().toISOString()});
    const Details=()=>{const transactions=useStorageValue(read);return <TransactionDetails transaction={transactions[0]} transactions={transactions} payments={[]} plans={FinanceService.getPlans()} onClose={()=>{}} onEdit={()=>{}} onPay={()=>{}} onRefund={()=>{}}/>;};render(<Details/>);
    fireEvent.click(screen.getByText('Échéance et prévision',{exact:true}));
    fireEvent.change(screen.getByLabelText('Rattacher à une prévision'),{target:{value:'RECUR'}});
    expect(StorageService.getTransactions()[0].finance?.occurrenceId).toBeUndefined();
    fireEvent.change(screen.getByLabelText('Échéance prévue remplacée par cette facture'),{target:{value:'RECUR:2026-01-31'}});
    expect(StorageService.getTransactions()[0].finance?.occurrenceId).toBe('RECUR:2026-01-31');
    fireEvent.change(screen.getByLabelText('Montant de cette facture qui remplace la prévision (CHF)'),{target:{value:'100'}});
    fireEvent.blur(screen.getByLabelText('Montant de cette facture qui remplace la prévision (CHF)'));
    expect(StorageService.getTransactions()[0].finance?.planAllocatedCents).toBe(10000);
    fireEvent.change(screen.getByLabelText('Rattacher à une prévision'),{target:{value:''}});
    expect(StorageService.getTransactions()[0].finance?.planId).toBeUndefined();
    expect(StorageService.getTransactions()[0].finance?.planAllocatedCents).toBeUndefined();
  });
  it('fige une version annuelle et garde ses chiffres après une nouvelle dépense',async()=>{
    const year=Number(todayISO().slice(0,4));StorageService.addTransaction(tx({finance:undefined}));
    FinanceService.saveClosing({id:'draft',year,createdAt:new Date().toISOString(),inventoriesConfirmed:true,openingInventory:[],closingInventory:[],adjustments:[]});render(<Workspace/>);
    fireEvent.click(screen.getByRole('tab',{name:'Annuel'}));fireEvent.click(screen.getByRole('tab',{name:'Dossier'}));
    fireEvent.click(screen.getByText('Conserver une version de référence'));
    fireEvent.click(screen.getByRole('button',{name:'Figer cette version avec ses points à vérifier'}));
    const saved=FinanceService.getClosings().find(c=>c.report)!;expect(saved.report?.operatingExpensesCents).toBe(15000);
    act(()=>StorageService.addTransaction(tx({id:'T2',finance:undefined})));
    expect(FinanceService.getClosings().find(c=>c.id===saved.id)?.report?.operatingExpensesCents).toBe(15000);
    await waitFor(()=>expect(screen.getByText('Version figée',{exact:true})).toBeInTheDocument());
  });
  it('un apport privé change le solde sans gonfler les ventes',async()=>{
    FinanceService.saveProfile({...FinanceService.getProfile(),openingCash:{date:todayISO(),amountCents:10000,confirmed:true}});
    const onSaved=vi.fn();render(<MovementSheet onSaved={onSaved} onClose={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Montant (CHF)'),{target:{value:'120,50'}});fireEvent.blur(screen.getByLabelText('Montant (CHF)'));
    fireEvent.change(screen.getByLabelText('Motif'),{target:{value:'Fonds pour les prochains brassins'}});
    fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));await waitFor(()=>expect(onSaved).toHaveBeenCalledOnce());
    const summary=summarizeLedger(StorageService.getTransactions(),FinanceService.getPayments(),FinanceService.getProfile());
    expect(summary.cashCents).toBe(22050);expect(summary.incomeCents).toBe(0);expect(summary.contributionCents).toBe(12050);
  });
  it('refuse un avoir supérieur à la pièce sans créer de paiement',async()=>{
    const original=tx();StorageService.addTransaction(original);render(<MovementSheet original={original} onSaved={()=>{}} onClose={()=>{}}/>);
    fireEvent.change(screen.getByLabelText('Comment appliquer cet avoir ?'),{target:{value:'cash'}});
    fireEvent.change(screen.getByLabelText('Montant (CHF)'),{target:{value:'151'}});fireEvent.blur(screen.getByLabelText('Montant (CHF)'));
    fireEvent.change(screen.getByLabelText('Motif'),{target:{value:'Remboursement'}});fireEvent.click(screen.getByRole('button',{name:'Enregistrer ce mouvement'}));
    await waitFor(()=>expect(screen.getByRole('alert')).toHaveTextContent('dépasser'));expect(StorageService.getTransactions()).toHaveLength(1);expect(FinanceService.getPayments()).toHaveLength(0);
  });
});
