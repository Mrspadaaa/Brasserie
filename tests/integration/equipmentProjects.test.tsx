import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null, ConfirmSheet: ({ open, title }: any) => open ? <div role="dialog" aria-label={title} /> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { defaultConfig, StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { UpgradeWorkspace } from '../../src/ui/finance/UpgradeWorkspace';
import { CreativeLabTab } from '../../src/components/CreativeLabTab';
import { todayISO } from '../../src/domain/finance/ledger';
import type { FinancialPlan } from '../../src/domain/finance/types';

const read = () => StorageService.getTransactions();
function Finances() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={() => {}}/>; }
const change = (label: string, value: string) => { const input = screen.getByLabelText(label); fireEvent.change(input, { target: { value } }); fireEvent.blur(input); };
// La feuille « Mes projets de matériel » (liste, second plan de Prévisions) reste ouverte sous les feuilles de saisie : seules celles-ci doivent se fermer.
const saved = () => waitFor(() => expect(screen.queryByRole('dialog', { name: /^(Mon projet de matériel|Prévoir du matériel|Acheter du matériel)$/ })).not.toBeInTheDocument());
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
    // ks4 (15.11) : Bières est un filtre du Carnet.
    fireEvent.click(screen.getByRole('button', { name: 'Carnet', exact: true }));
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
    fireEvent.click(screen.getByRole('button', { name: /^À étudier/ })); // m3pm-d : la piste, station « À étudier » (livraison et pose)
    change('Livraison TTC (CHF)', '49.50'); change('Installation TTC (CHF)', '100');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure dans mes prévisions', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' })); await saved();
    expect(FinanceService.getPlans()).toHaveLength(1);
    expect(FinanceService.getPlans()[0]).toMatchObject({ id: idea.id, status: 'active', amountCents: 215000, upgrade: { budgetKnown: true, timing: 'next' } });
    expect(StorageService.getTransactions()).toHaveLength(0);
    expect(StorageService.getStocks().equipment).toHaveLength(0);
    fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
    expect(screen.getByRole('button', { name: /Nouvelle cuverie −2['’\s]?150,00/ })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Sans Nouvelle cuverie/ }));
    expect(screen.queryByRole('button', { name: /Nouvelle cuverie −/ })).not.toBeInTheDocument();
    expect(FinanceService.getPlans()[0].status).toBe('active'); // simulation temporaire
  });

  it('TE-36 : la case des prévisions garde le même mot, cochée ou non', async () => {
    await FinanceService.saveUpgrade(hotte()); render(<UpgradeWorkspace/>);
    // kh1r : l'interrupteur vit dans la fiche du projet (touche le titre de la carte « Prochain achat »), même mot allumé ou éteint
    fireEvent.click(screen.getByRole('button', { name: 'Hotte de brassage' }));
    const case_ = screen.getByRole('switch', { name: 'Dans mes prévisions' });
    expect(case_).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(case_);
    await waitFor(() => expect(screen.getByRole('switch', { name: 'Dans mes prévisions' })).toHaveAttribute('aria-checked', 'false'));
    expect(screen.getByRole('switch', { name: 'Dans mes prévisions' })).toHaveTextContent('Dans mes prévisions');
  });
  it('reprend les idées R&D, archive sans résurrection et restaure les notes', async () => {
    const legacy = { id: 'OLD-HOTTE', type: 'equipment' as const, title: 'Hotte historique', status: 'quote' as const, estimatedCost: 750, description: 'Évacuer la vapeur', notes: 'Devis fournisseur conservé' };
    StorageService.addCreativeItem(legacy); render(<UpgradeWorkspace/>);
    expect(FirestoreRepo.all('financialPlans')).toHaveLength(0);
    // kyh1 : toute ligne chiffrée porte son crayon (la ligne sans prix porte « à estimer ») ; le titre ouvre la fiche, dont « Modifier » ouvre la feuille d'édition
    expect(screen.getByRole('button', { name: 'Modifier Hotte historique' })).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hotte historique')); fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(screen.getByLabelText('À quoi va-t-il servir ?')).toHaveValue('Évacuer la vapeur');
    fireEvent.click(screen.getByRole('button', { name: 'Archiver ce projet' })); // u2 (27) et fix-materiel : une confirmation sur place d'abord
    fireEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Oui, archiver' })); await saved();
    expect(screen.queryByRole('button', { name: /Hotte historique.*750/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: /Hotte historique.*750/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre ce projet' })); await saved();
    fireEvent.click(screen.getByRole('button', { name: 'À venir', exact: true }));
    // fix-materiel (constat 7) : seul projet à venir, il est le « prochain achat » même non posé ; une seule fois à l'écran
    const hero = screen.getByRole('region', { name: 'Prochain achat' });
    expect(within(hero).getByText('Hotte historique')).toBeVisible(); expect(hero).toHaveTextContent('750');
    expect(screen.getAllByText('Hotte historique')).toHaveLength(1);
    expect(FinanceService.getPlans()[0]).toMatchObject({ status: 'draft', notes: legacy.notes });
    expect(StorageService.getCreativeItems()).toEqual([legacy]);
  });

  it.each(['paid', 'unpaid'] as const)('prépare l’achat %s avec son lien, exige le vrai montant puis remplace la prévision', async paymentStatus => {
    FinanceService.saveProfile({ ...FinanceService.getProfile(), openingCash: { date: todayISO(), amountCents: 400000, confirmed: true } });
    FinanceService.savePlan(hotte()); render(<Finances/>);
    fireEvent.click(screen.getByRole('button', { name: 'Noter l’achat' }));
    expect(screen.getByRole('dialog', { name: 'Acheter du matériel' })).toBeInTheDocument();
    expect(screen.getByLabelText('Dépense prévue')).toHaveValue('HOTTE');
    expect(screen.getByLabelText('Pour quoi ?')).toHaveValue('Hotte de brassage');
    expect(screen.getByLabelText('Total TTC en CHF')).toHaveValue('');
    expect(screen.getByLabelText('Matériel ligne 1')).toHaveValue('new');
    expect(screen.getByRole('button', { name: 'Déjà payé', exact: true })).toHaveAttribute('aria-pressed', 'true');
    if (paymentStatus === 'unpaid') fireEvent.click(screen.getByRole('button', { name: 'À payer', exact: true }));
    change('Total TTC en CHF', '800');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la dépense' }));
     await saved();
    expect(StorageService.getTransactions()[0]).toMatchObject({ amountTTC: 800, finance: { planId: 'HOTTE', amountCents: 80000, paymentStatus } });
    expect(StorageService.getStocks().equipment[0]).toMatchObject({ name: 'Hotte de brassage', purchasePrice: 800 });
    fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' })); // la feuille « Mes projets de matériel »
    // TA4 : la facture « à payer » saisie sans échéance ne remplace plus la prévision (qui reste entière) et se dit à part, « sans date », hors graphe.
    if (paymentStatus === 'paid') expect(screen.getByRole('button', { name: /Hotte de brassage −400,00/ })).toBeVisible();
    else {
      expect(screen.getByRole('button', { name: /Hotte de brassage −1['’\s]?200,00/ })).toBeVisible();
      expect(screen.getByRole('button', { name: /1 pièce sans date.*800,00 hors graphe/ })).toBeVisible();
    }
    const bascule = within(screen.getByRole('group', { name: /Avec ou sans/ }));
    expect(bascule.getByRole('button', { name: /Avec Hotte de brassage/ })).toHaveTextContent(/2['’\s]?800,00/);
    expect(bascule.getByRole('button', { name: /Sans Hotte de brassage/ })).toHaveTextContent(paymentStatus === 'paid' ? /3['’\s]?200,00/ : /4['’\s]?000,00/);
    fireEvent.click(screen.getByRole('tab', { name: 'Synthèse' }));
    fireEvent.click(screen.getByRole('button', { name: /Fournisseurs, matériel/ }));
    fireEvent.click(screen.getByRole('button', { name: /Hotte de brassage.*Depuis le début du projet/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Acheté/ })); // m3pm-d : station « Acheté · n achat lié »
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Hotte de brassage.*part du projet/ }));
    expect(screen.getByRole('dialog', { name: 'Hotte de brassage' })).toBeInTheDocument();
  });

  it('retire un projet des prévisions et garde sa facture dans les analyses et les échéances', async () => {
    const plan = hotte(); FinanceService.savePlan(plan);
    StorageService.addTransaction({ id: 'BILL', description: 'Acompte facturé pour la hotte', date: todayISO(), category: 'materiel', subcategory: '', amountHT: 300, amountTTC: 300, tvaRate: 0, tvaAmount: 0, finance: { version: 1, kind: 'expense', amountCents: 30000, paymentStatus: 'unpaid', dueDate: todayISO(), planId: plan.id, lines: [] } });
    render(<Finances/>);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure Hotte de brassage dans les prévisions' }));
    await waitFor(() => expect(FinanceService.getPlans()[0].status).toBe('draft'));
    fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
    expect(screen.getByText('À payer').parentElement).toHaveTextContent('300,00');
    expect(screen.queryByRole('group', { name: /Avec ou sans/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Synthèse' }));
    fireEvent.click(screen.getByRole('button', { name: /Fournisseurs, matériel/ }));
    expect(screen.getByRole('button', { name: /Hotte de brassage.*1 facture.*300/ })).toBeVisible();
  });

  it('garde le formulaire et son identifiant après une erreur d’enregistrement', async () => {
    const save = vi.spyOn(FinanceService, 'saveUpgrade').mockRejectedValueOnce(Error('Connexion interrompue'));
    render(<UpgradeWorkspace/>); fireEvent.click(screen.getByRole('button', { name: 'Ajouter un besoin' }));
    change('Matériel ou aménagement', 'Fermenteur pour la saison');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Connexion interrompue'));
    expect(screen.getByLabelText('Matériel ou aménagement')).toHaveValue('Fermenteur pour la saison');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le projet' })); await saved();
    expect(save.mock.calls[1][0].id).toBe(save.mock.calls[0][0].id);
    expect(FinanceService.getPlans()).toHaveLength(1);
  });

  // ka4 : Archives = la carte de l'argent mis de côté ; À venir sans projet = la carte en pointillés.
  describe('ka4 : Archives en carte et état vide', () => {
    const archive = (id: string, title: string, cents: number | null, stage: 'idea' | 'research' | 'quote' | 'ready' = 'quote', purpose?: string): FinancialPlan => ({ id, title, date: '2026-02-01', amountCents: cents ?? 0, direction: 'out', category: 'materiel', source: 'equipment', status: 'cancelled', createdAt: '2026-01-01T10:00:00.000Z',
      upgrade: { version: 1, timing: 'later', stage, budgetKnown: cents != null, datePrecision: 'month', estimateSource: 'estimate', ...(cents != null ? { purchaseCents: cents } : {}), ...(purpose ? { purpose } : {}) } });
    const ouvrirArchives = () => { render(<UpgradeWorkspace/>); fireEvent.click(screen.getByRole('button', { name: 'Archives', exact: true })); };

    it('À venir sans projet : la carte vide, sa légende, et « Premier besoin » ouvre le même geste que « + Besoin »', () => {
      render(<UpgradeWorkspace/>);
      expect(screen.getByRole('group', { name: 'Ta carte de l’argent, vide' })).toBeVisible();
      expect(screen.getByText('Chaque besoin y prend la place de son prix.')).toBeVisible();
      ['Prêt', 'Devis', 'Idée', 'sans prix : hors carte'].forEach(t => expect(screen.getByText(t)).toBeVisible());
      expect(screen.getByRole('button', { name: 'Ajouter un besoin' })).toBeVisible(); // « + Besoin » reste en ligne
      fireEvent.click(screen.getByRole('button', { name: 'Premier besoin' }));
      expect(screen.getByRole('dialog', { name: 'Prévoir du matériel' })).toBeInTheDocument();
    });

    it('Archives : total des prix connus, une case par projet chiffré, le sans-prix hors carte, la légende', () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000)); FinanceService.savePlan(archive('A-MOULIN', 'Moulin à malt', 65000, 'research')); FinanceService.savePlan(archive('A-TIREUSE', 'Tireuse mobile', null, 'idea'));
      ouvrirArchives();
      expect(screen.getByText(/3[\s  ’']?050 CHF/)).toBeVisible();
      expect(screen.getByText(/au moins · mis de côté · 2 prix connus sur 3/)).toBeVisible();
      expect(screen.getByRole('button', { name: /Chambre froide 2 m³.*2[\s  ’']?400/ })).toBeVisible();
      expect(screen.getByRole('button', { name: /Moulin à malt.*arrêté à l’étude.*650/ })).toBeVisible();
      expect(screen.getByText(/hors carte : prix à estimer · févr\. 26/)).toBeVisible();
      expect(screen.getByRole('button', { name: /^Tireuse mobile/ })).toBeVisible();
      expect(screen.queryByText(/Tireuse mobile.*0 CHF/)).not.toBeInTheDocument(); // jamais une case à zéro
      expect(screen.getByText('surface = prix prévu')).toBeVisible();
      expect(screen.queryByText('hors carte : prix à estimer', { selector: '.ak-chip' })).not.toBeInTheDocument(); // dit une fois, sur sa ligne pointillée
      expect(screen.queryByText('déjà payé')).not.toBeInTheDocument(); // aucun achat lié : pas de bande, pas de légende
      expect(screen.queryByText('démo')).not.toBeInTheDocument(); // ids réels : pas de marque démo
      expect(document.querySelectorAll('input[type=number]')).toHaveLength(0);
    });

    it('une petite case n’agrandit pas la carte : hauteur de la maquette, case mini sans bouton, le projet se lit et se reprend dans « petits montants »', () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000)); FinanceService.savePlan(archive('A-MOULIN', 'Moulin à malt', 65000)); FinanceService.savePlan(archive('A-REFRAC', 'Réfractomètre', 4500, 'research'));
      ouvrirArchives();
      expect(document.querySelector('.ak-map')).toHaveStyle({ height: '250px' });
      const mini = document.querySelector('.ak-mi') as HTMLElement;
      expect(mini).toBeTruthy(); expect(mini.querySelector('button')).toBeNull(); expect(mini).not.toHaveTextContent('45'); expect(screen.getByText(/45 CHF/)).toBeVisible(); // trop étroite pour le montant : la liste le porte
      expect(screen.getByRole('button', { name: /^Réfractomètre/ })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Reprendre Réfractomètre' })).toBeVisible();
      expect(screen.getAllByText(/Réfractomètre/).length).toBeGreaterThan(0);
    });

    it('la raison du projet reste entière dans la case basse (« févr. 26 · malt acheté concassé »)', () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000)); FinanceService.savePlan(archive('A-MOULIN', 'Moulin à malt', 65000, 'research', 'malt acheté concassé'));
      ouvrirArchives();
      expect(screen.getByText('févr. 26 · malt acheté concassé')).toBeVisible();
    });

    it('une seule archive chiffrée : son montant n’est écrit qu’une fois (pas de total en double)', () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000)); ouvrirArchives();
      expect(screen.getAllByText(/2[s  ’']?400/)).toHaveLength(1);
      expect(screen.getByText('Mis de côté')).toBeVisible();
    });

    it('un projet d’exemple (DEMO-…) est marqué « démo »', () => {
      FinanceService.savePlan(archive('DEMO-FROID', 'Chambre froide', 240000)); ouvrirArchives();
      expect(screen.getByText('démo')).toBeVisible();
    });

    it('« Reprendre » remet le projet en brouillon dans À venir, l’avis le dit et « Voir » y mène', async () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000)); FinanceService.savePlan(archive('A-MOULIN', 'Moulin à malt', 65000));
      ouvrirArchives();
      fireEvent.click(screen.getByRole('button', { name: 'Reprendre Moulin à malt' }));
      await waitFor(() => expect(FinanceService.getPlans().find(p => p.id === 'A-MOULIN')).toMatchObject({ status: 'draft' }));
      expect(FinanceService.getPlans().find(p => p.id === 'A-FROID')).toMatchObject({ status: 'cancelled' });
      expect(screen.getByRole('status')).toHaveTextContent('Moulin à malt · de retour dans À venir');
      expect(screen.queryByRole('button', { name: 'Reprendre Moulin à malt' })).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Voir' }));
      expect(screen.getByRole('button', { name: /^Moulin à malt/ })).toBeVisible();
    });

    it('toucher une case ouvre le projet (« Reprendre ce projet » reste dans sa feuille)', () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000)); ouvrirArchives();
      fireEvent.click(screen.getByRole('button', { name: /Chambre froide 2 m³.*2[\s  ’']?400/ }));
      expect(screen.getByRole('button', { name: 'Reprendre ce projet' })).toBeVisible();
    });

    it('l’acompte déjà payé (achat lié) paraît en bande dans sa case, la légende « déjà payé » avec lui', () => {
      FinanceService.savePlan(archive('A-FROID', 'Chambre froide 2 m³', 240000));
      StorageService.addTransaction({ id: 'T-ACOMPTE', description: 'Acompte chambre froide', date: '2026-02-10', category: 'materiel', subcategory: '', amountHT: 200, amountTTC: 200, tvaRate: 0, tvaAmount: 0,
        finance: { version: 1, kind: 'expense', amountCents: 20000, planId: 'A-FROID', paymentStatus: 'paid', lines: [{ id: 'T-ACOMPTE-0', description: 'Acompte', kind: 'equipment', quantity: 1, amountCents: 20000 }] } } as never);
      FirestoreRepo.put('financialPayments', 'P-ACOMPTE', { id: 'P-ACOMPTE', transactionId: 'T-ACOMPTE', date: '2026-02-10', amountCents: 20000, direction: 'out', method: 'bank' }); // un « payé » sans paiement enregistré resterait inconnu
      ouvrirArchives();
      expect(screen.getByRole('img', { name: /Déjà payé : 200 sur 2[\s  ’']?400 CHF/ })).toBeInTheDocument();
      expect(screen.getByText(/acompte payé/)).toBeVisible();
      expect(screen.getByText('déjà payé')).toBeVisible();
    });
  });

});
