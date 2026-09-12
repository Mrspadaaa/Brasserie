import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import { CreativePricing } from '../../src/ui/finance/CreativePricing';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';
import { todayISO } from '../../src/domain/finance/ledger';
import type { FinancialPlan } from '../../src/domain/finance/types';

const read = () => StorageService.getTransactions();
function Finances() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={() => {}}/>; }
const change = (label: string, value: string) => { const input = screen.getByLabelText(label); fireEvent.change(input, { target: { value } }); fireEvent.blur(input); };
const saved = () => waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
const hotte = (): FinancialPlan => ({ id: 'HOTTE', title: 'Hotte de brassage', date: todayISO(), amountCents: 120000, direction: 'out', category: 'materiel', source: 'equipment', status: 'active', createdAt: new Date().toISOString(), upgrade: { version: 1, timing: 'soon', stage: 'quote', budgetKnown: true, datePrecision: 'month', estimateSource: 'quote', purchaseCents: 100000, deliveryCents: 5000, installationCents: 15000 } });
beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'projects'); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Projets de matériel, du besoin à l’achat', () => {
  it('consomme une seule fois l’ajout rapide R&D sans le rouvrir après un changement de rubrique', () => {
    function Navigation() {
      const [request,setRequest] = React.useState<{kind:string;at:number}|null>({ kind: 'newIdea', at: 42 });
      const [atelier,setAtelier] = React.useState(true);
      return <><button onClick={()=>setAtelier(!atelier)}>Changer d’espace</button>{atelier&&<CreativeLabTab createRequest={request} onCreateRequestHandled={()=>setRequest(null)}/>}</>;
    }
    render(<Navigation/>);
    expect(screen.getByRole('dialog', { name: 'Prévoir du matériel' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annuler', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Bières', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Matériel', exact: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Changer d’espace', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Changer d’espace', exact: true }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  it('conserve une idée sans estimation, puis la chiffre et l’inclut sans créer de dépense réelle', async () => {
    render(<Finances/>);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un projet' }));
    change('Matériel ou aménagement', 'Nouvelle cuverie');
    change('À quoi va-t-il servir ?', 'Augmenter le volume quand la demande le justifie');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' })); await saved();
    const idea = FinanceService.getPlans()[0];
    expect(idea).toMatchObject({ status: 'draft', date: '', upgrade: { budgetKnown: false, timing: 'later' } });
    expect(screen.getByRole('button', { name: /Nouvelle cuverie.*À estimer/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Nouvelle cuverie.*À estimer/ }));
    change('Prix estimé TTC (CHF)', '2000.50'); fireEvent.input(screen.getByLabelText('Paiement prévu en'), { target: { value: todayISO().slice(0, 7) } });
    fireEvent.click(screen.getByRole('button', { name: 'Ensuite', exact: true }));
    fireEvent.click(screen.getByText('Livraison, installation et devis', { exact: true }));
    change('Livraison TTC (CHF)', '49.50'); change('Installation TTC (CHF)', '100');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' })); await saved();
    expect(FinanceService.getPlans()).toHaveLength(1);
    expect(FinanceService.getPlans()[0]).toMatchObject({ id: idea.id, status: 'active', amountCents: 215000, upgrade: { budgetKnown: true, timing: 'next' } });
    expect(StorageService.getTransactions()).toHaveLength(0);
    expect(StorageService.getStocks().equipment).toHaveLength(0);
    fireEvent.click(screen.getByRole('tab', { name: 'Prévoir' }));
    expect(screen.getByRole('checkbox', { name: /Inclure mes projets de matériel/ })).toBeChecked();
    expect(screen.getByRole('button', { name: /Nouvelle cuverie.*Projet de matériel/ })).toBeVisible();
    fireEvent.click(screen.getByRole('checkbox', { name: /Inclure mes projets de matériel/ }));
    expect(screen.queryByRole('button', { name: /Nouvelle cuverie.*Projet de matériel/ })).not.toBeInTheDocument();
    expect(FinanceService.getPlans()[0].status).toBe('active'); // simulation temporaire
  });

  it('reprend les idées R&D, archive sans résurrection et restaure les notes', async () => {
    const legacy = { id: 'OLD-HOTTE', type: 'equipment' as const, title: 'Hotte historique', status: 'quote' as const, estimatedCost: 750, description: 'Évacuer la vapeur', notes: 'Devis fournisseur conservé' };
    StorageService.addCreativeItem(legacy); render(<UpgradeWorkspace/>);
    expect(FirestoreRepo.all('financialPlans')).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: /Hotte historique.*750/ }));
    expect(screen.getByLabelText('À quoi va-t-il servir ?')).toHaveValue('Évacuer la vapeur');
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ce projet' })); await saved();
    expect(screen.queryByRole('button', { name: /Hotte historique.*750/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /Hotte historique.*750/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre ce projet' })); await saved();
    fireEvent.click(screen.getByRole('button', { name: 'À venir', exact: true }));
    expect(screen.getAllByRole('button', { name: /Hotte historique.*750/ })).toHaveLength(1);
    expect(FinanceService.getPlans()[0]).toMatchObject({ status: 'draft', notes: legacy.notes });
    expect(StorageService.getCreativeItems()).toEqual([legacy]);
  });

  it('prépare l’achat avec son lien mais exige le vrai montant puis remplace la prévision', async () => {
    FinanceService.saveProfile({ ...FinanceService.getProfile(), openingCash: { date: todayISO(), amountCents: 400000, confirmed: true } });
    FinanceService.savePlan(hotte()); render(<Finances/>);
    fireEvent.click(screen.getByRole('button', { name: 'Noter l’achat' }));
    expect(screen.getByRole('dialog', { name: 'Acheter du matériel' })).toBeInTheDocument();
    expect(screen.getByLabelText('Dépense prévue')).toHaveValue('HOTTE');
    expect(screen.getByLabelText('Pour quoi ?')).toHaveValue('Hotte de brassage');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('');
    expect(screen.getByLabelText('Matériel ligne 1')).toHaveValue('new');
    change('Total TTC en CHF', '800');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la dépense' }));
     await saved();
    expect(StorageService.getTransactions()[0]).toMatchObject({ amountTTC: 800, finance: { planId: 'HOTTE', amountCents: 80000, paymentStatus: 'unpaid' } });
    expect(StorageService.getStocks().equipment[0]).toMatchObject({ name: 'Hotte de brassage', purchasePrice: 800 });
    fireEvent.click(screen.getByRole('tab', { name: 'Prévoir' }));
    const due = within(screen.getByRole('heading', { name: 'Prochaines échéances' }).closest('section')!);
    expect(due.getByRole('button', { name: /Hotte de brassage.*Projet de matériel.*400/ })).toBeVisible();
    expect(screen.getByText('Solde estimé en fin de période').parentElement).toHaveTextContent(/2[\s'’]?800\.00/);
    fireEvent.click(screen.getByRole('checkbox', { name: /Inclure mes projets de matériel/ }));
    expect(screen.getByText('Factures à régler').parentElement).toHaveTextContent('800.00');
    expect(screen.getByText('Solde estimé en fin de période').parentElement).toHaveTextContent(/3[\s'’]?200\.00/);
    fireEvent.click(screen.getByRole('tab', { name: 'Coûts' }));
    fireEvent.click(screen.getByRole('button', { name: /Hotte de brassage.*Depuis le début du projet/ }));
    fireEvent.click(screen.getByText(/Achats liés ·/));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Hotte de brassage.*Part du projet/ }));
    expect(screen.getByRole('dialog', { name: 'Hotte de brassage' })).toBeInTheDocument();
  });

  it('retire un projet des prévisions et garde sa facture dans les analyses et les échéances', async () => {
    const plan = hotte(); FinanceService.savePlan(plan);
    StorageService.addTransaction({ id: 'BILL', description: 'Acompte facturé pour la hotte', date: todayISO(), category: 'materiel', subcategory: '', amountHT: 300, amountTTC: 300, tvaRate: 0, tvaAmount: 0, finance: { version: 1, kind: 'expense', amountCents: 30000, paymentStatus: 'unpaid', planId: plan.id, lines: [] } });
    render(<Finances/>);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure Hotte de brassage dans les prévisions' }));
    await waitFor(() => expect(FinanceService.getPlans()[0].status).toBe('draft'));
    fireEvent.click(screen.getByRole('tab', { name: 'Prévoir' }));
    expect(screen.getByText('Factures à régler').parentElement).toHaveTextContent('300.00');
    expect(screen.queryByRole('checkbox', { name: /Inclure mes projets de matériel/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Coûts' }));
    expect(screen.getByRole('button', { name: /Hotte de brassage.*1 facture.*300/ })).toBeVisible();
  });

  it('garde le formulaire et son identifiant après une erreur d’enregistrement', async () => {
    const save = vi.spyOn(FinanceService, 'saveUpgrade').mockRejectedValueOnce(Error('Connexion interrompue'));
    render(<UpgradeWorkspace/>); fireEvent.click(screen.getByRole('button', { name: 'Ajouter un projet' }));
    change('Matériel ou aménagement', 'Fermenteur pour la saison');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion interrompue'));
    expect(screen.getByLabelText('Matériel ou aménagement')).toHaveValue('Fermenteur pour la saison');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' })); await saved();
    expect(save.mock.calls[1][0].id).toBe(save.mock.calls[0][0].id);
    expect(FinanceService.getPlans()).toHaveLength(1);
  });

  it.each([false, true])('le tarif R&D utilise des montants saisis et le statut TVA %s', registered => {
    StorageService.saveConfig({ ...defaultConfig, fiscal: { ...defaultConfig.fiscal, isTvaRegistered: registered, tvaNormalRate: 0.081 } });
    render(<CreativePricing/>); expect(screen.getByText('À renseigner')).toBeVisible();
    change('Prix de vente TTC (CHF)', '10.81'); change('Coût de revient de ce format (CHF)', '6');
    expect(screen.getByText('Marge unitaire estimée').parentElement).toHaveTextContent(registered ? '4.00' : '4.81');
    expect(FinanceService.getPlans()).toHaveLength(0);
  });
});
