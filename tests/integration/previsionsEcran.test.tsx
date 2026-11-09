import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { Previsions, type PrevisionsProps } from '../../src/ui/finance/previsions/Previsions';
import { summarizeLedger } from '../../src/domain/finance/ledger';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ASOF, atelier, brassin, cuve, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, stocks, depense } from './previsionsFixture';

// L'onglet Finances › Prévisions EST p5b. Horloge : seule `Date` est figée au 09.11.2026 (jamais les minuteries : `waitFor` et `saveUpgrade` attendent).
const read = () => StorageService.getTransactions();
const lots = [brassin()];
function Ecran({ onOpenSale }: { onOpenSale?: () => void }) {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={lots} stockItems={stocks()} onOpenSale={onOpenSale} />;
}
function semer(over: { sansSolde?: boolean; plans?: FinancialPlan[]; transactions?: ReturnType<typeof atelier>[] } = {}) {
  const profile = profil();
  FinanceService.saveProfile({ ...FinanceService.getProfile(), ...profile, ...(over.sansSolde ? { openingCash: undefined } : {}) } as never);
  FinanceService.saveAsset(cuve());
  for (const p of over.plans ?? [loyer, frigo(), fermenteur, planPrevoir(brassin())]) FinanceService.savePlan(p);
  for (const t of over.transactions ?? [atelier(), loyerNovembre()]) StorageService.addTransaction(t);
}
const ouvrir = () => { render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' })); };
const prevoir = () => FinanceService.getPlans().find(p => p.id === 'FRIGO')!;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'forecast');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Prévisions : l’escalier aux étiquettes accrochées (p5b)', () => {
  it('rend p5b : titre du mois de fin, horizon, bascule Avec/Sans, étiquettes, légende, plis ; plus l’ancien écran', () => {
    semer(); ouvrir();
    expect(screen.getByRole('heading', { name: 'Fin février' })).toBeVisible();
    const horizon = within(screen.getByRole('group', { name: 'Horizon de prévision' }));
    expect(horizon.getByRole('button', { name: '90 jours' })).toHaveAttribute('aria-pressed', 'true');
    expect(horizon.getAllByRole('button')).toHaveLength(3);
    const bascule = within(screen.getByRole('group', { name: /Avec ou sans/ }));
    expect(bascule.getByRole('button', { name: /Avec frigo/ })).toHaveAttribute('aria-pressed', 'true');
    expect(bascule.getByRole('button', { name: /Avec frigo/ })).toHaveTextContent(/−892,66/);
    expect(bascule.getByRole('button', { name: /Avec frigo/ })).toHaveTextContent('sous zéro 25.01');
    expect(bascule.getByRole('button', { name: /Sans frigo/ })).toHaveTextContent(/2['’\s]?107,34/);
    expect(screen.getByRole('button', { name: /Frigo −3['’\s]?000,00, 15\.11/ })).toBeVisible();
    expect(screen.getByText('À payer').parentElement).toHaveTextContent(/460,00/);
    expect(screen.getByText('Prévu').parentElement).toHaveTextContent(/1['’\s]?550,00/);
    expect(screen.getByRole('button', { name: /10\s+sorties/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Entrées : aucune/ })).toBeVisible();
    for (const ancien of ['Comparer les mois', 'Échéances et estimations à venir', 'Budgets et estimations', 'Factures à régler']) expect(screen.queryByText(ancien)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: /Inclure mes projets de matériel/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Projets de matériel', exact: true })).not.toBeInTheDocument();
  });

  it('la bascule retire le frigo seul : sans = avec + 3 000, le fermenteur reste', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Sans frigo/ }));
    expect(screen.getByRole('button', { name: /Sans frigo/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('button', { name: /Frigo −3/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /\d+\s+sorties?$/ }));
    const liste = within(screen.getByRole('dialog', { name: 'Sorties et entrées prévues' }));
    expect(liste.getByText(/Fermenteur/)).toBeVisible();
    expect(liste.queryByText(/Frigo/)).not.toBeInTheDocument();
  });

  it('la liste de l’annexe : dix sorties, soldes après, brassin à ses quatre dates (domaine d2)', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /10\s+sorties/ }));
    const liste = within(screen.getByRole('dialog', { name: 'Sorties et entrées prévues' }));
    expect(liste.getAllByRole('listitem')).toHaveLength(10);
    expect(liste.getByText(/achats/)).toBeVisible();
    expect(liste.getByText(/impôt sur la bière/)).toBeVisible();
    expect(screen.getByRole('dialog')).toHaveTextContent(/→ 664,18/);
    expect(screen.getByRole('dialog')).toHaveTextContent(/→ −892,66/);
    expect(liste.getByRole('button', { name: /Ajouter une prévision/ })).toBeVisible();
    expect(liste.getByRole('button', { name: /Budget d’un brassin/ })).toBeVisible();
    expect(liste.getByRole('button', { name: /Mes projets de matériel/ })).toBeVisible();
  });

  it('fiche du frigo : usure 600,00 ; 8 ans la porte à 375,00 (un seul enregistrement, double clic compris)', async () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Frigo −3['’\s]?000,00, 15\.11/ }));
    const fiche = within(screen.getByRole('dialog'));
    expect(fiche.getByText('Usure par an').parentElement).toHaveTextContent('600,00');
    expect(fiche.getByRole('button', { name: '5 ans' })).toHaveAttribute('aria-pressed', 'true');
    expect(fiche.getByText('Plus bas').parentElement).toHaveTextContent(/−892,66.*le 30\.01/);
    const ecrire = vi.spyOn(FinanceService, 'saveUpgrade');
    const huit = fiche.getByRole('button', { name: '8 ans' });
    fireEvent.click(huit); fireEvent.click(huit);
    expect(ecrire).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(prevoir().upgrade?.usefulLifeYears).toBe(8));
    await waitFor(() => expect(screen.getByRole('dialog')).toHaveTextContent('375,00'));
  });

  it('Retirer : le projet quitte l’escalier et reste dans ses idées (draft)', async () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Frigo −3['’\s]?000,00, 15\.11/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Retirer/ }));
    await waitFor(() => expect(prevoir().status).toBe('draft'));
    await waitFor(() => expect(screen.queryByRole('button', { name: /Frigo −3/ })).not.toBeInTheDocument());
  });

  it('Déplacer : le mois de paiement change, précision « mois »', async () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Frigo −3['’\s]?000,00, 15\.11/ }));
    const fiche = within(screen.getByRole('dialog'));
    fireEvent.click(fiche.getByRole('button', { name: 'Déplacer' }));
    fireEvent.change(fiche.getByLabelText(/Payer en/), { target: { value: '2026-12' } });
    fireEvent.click(fiche.getByRole('button', { name: 'Valider' }));
    await waitFor(() => expect(prevoir()).toMatchObject({ date: '2026-12-01', upgrade: { datePrecision: 'month' } }));
  });

  it('fiche du brassin : 22,42 + 11,00 + 24,00 + 6,84 = 64,26, chaque ligne dit d’où vient son montant', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /10\s+sorties/ }));
    fireEvent.click(within(screen.getByRole('dialog')).getByText(/impôt sur la bière/));
    const fiche = screen.getByRole('dialog');
    for (const m of ['−22,42', '−11,00', '−24,00', '−6,84', '−64,26']) expect(fiche).toHaveTextContent(m);
    expect(fiche).toHaveTextContent(/densité du brassin/);
    expect(within(fiche).getByRole('button', { name: 'Ouvrir le budget' })).toBeVisible();
  });

  it('prix d’une bouteille : 179 bouteilles pour rester à zéro ; sans prix « à compléter », jamais 0 ni 179', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Frigo −3['’\s]?000,00, 15\.11/ }));
    const fiche = within(screen.getByRole('dialog'));
    expect(fiche.getByText('Pour rester à zéro').parentElement).toHaveTextContent('à compléter');
    expect(fiche.getByText('Pour rester à zéro').parentElement).not.toHaveTextContent('179');
    fireEvent.change(fiche.getByLabelText(/Prix d’une bouteille/), { target: { value: '5,00' } });
    expect(fiche.getByText('Pour rester à zéro').parentElement).toHaveTextContent('179 bouteilles 33 cl à 5,00');
    expect(fiche.getByText('Pour rester à zéro').parentElement).toHaveTextContent('avant coût de production');
  });

  it('une entrée prévue : le pli « Entrées » la dit et le solde de fin la compte', () => {
    semer({ plans: [loyer, frigo(), fermenteur, planPrevoir(brassin()), { id: 'VENTE', title: 'Vente festival', date: '2026-11-25', amountCents: 50_000, direction: 'in', category: 'ventes', source: 'manual', status: 'active', createdAt: '2026-11-01T00:00:00Z' }] }); ouvrir();
    expect(screen.getByRole('button', { name: /Entrées : 500,00/ })).toBeVisible();
    expect(within(screen.getByRole('group', { name: /Avec ou sans/ })).getByRole('button', { name: /Avec frigo/ })).toHaveTextContent(/−392,66/);
  });

  it('une pièce sans échéance : marque au premier plan, qui ouvre les limites', () => {
    semer({ transactions: [atelier(), loyerNovembre(), depense('SANS', 'Réparation', 34_000, '', { dueDate: undefined })] }); ouvrir();
    const marque = screen.getByRole('button', { name: /pièce sans date.*340,00 hors graphe/ });
    fireEvent.click(marque);
    expect(screen.getByRole('dialog', { name: 'Limites de cette prévision' })).toHaveTextContent(/Échéance à préciser/);
  });

  it('solde de départ inconnu : « À compléter », jamais 0,00 dans les cartes ; le solde se renseigne dans les limites', () => {
    semer({ sansSolde: true }); ouvrir();
    const cartes = screen.getByRole('group', { name: /Avec ou sans/ });
    expect(cartes).toHaveTextContent('À compléter');
    expect(cartes).not.toHaveTextContent(/(^|\s)0,00/);
    fireEvent.click(screen.getByRole('button', { name: /Limites/ }));
    expect(screen.getByRole('button', { name: /Renseigner le solde de départ/ })).toBeVisible();
  });

  it('l’horizon se change : 30 jours → « Fin décembre »', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: '30 jours' }));
    expect(screen.getByRole('heading', { name: 'Fin décembre' })).toBeVisible();
  });

  it('le bouton « Vente » appelle la porte une fois ; sans la prop, il n’existe pas', () => {
    semer(); const vente = vi.fn();
    const { unmount } = render(<Ecran onOpenSale={vente} />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
    fireEvent.click(screen.getByRole('button', { name: 'Vente' })); expect(vente).toHaveBeenCalledTimes(1);
    unmount(); render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' }));
    expect(screen.queryByRole('button', { name: 'Vente' })).not.toBeInTheDocument();
  });

  it('un projet arrivé par « projects » ouvre la feuille « Mes projets de matériel »', () => {
    semer(); StorageService.setUiState('finances_workspace', 'projects'); render(<Ecran />);
    expect(screen.getByRole('dialog', { name: 'Mes projets de matériel' })).toBeVisible();
  });
});

describe('« Prévoir » de c3a amène à l’étiquette', () => {
  function Hote(props: Partial<PrevisionsProps> & { cible: NonNullable<PrevisionsProps['cible']> }) {
    const [horizon, setHorizon] = React.useState<30 | 90 | 365>(props.horizon ?? 90);
    const donnees = { transactions: [atelier(), loyerNovembre()], payments: [], plans: [loyer, frigo(), fermenteur, planPrevoir(brassin())], profile: profil(), assets: [cuve()], batches: lots, stockItems: stocks() };
    const ledger = summarizeLedger(donnees.transactions as never, [], donnees.profile, ASOF, { includeScheduled: true });
    return <Previsions asOf={ASOF} horizon={horizon} onHorizon={setHorizon} {...donnees} ledger={ledger} openingCashReady avecProjets onAvecProjets={() => {}} onProfile={() => {}} onPayments={() => {}} onOpenTransaction={() => {}} onOpenPlan={() => {}}
      onOpenUpgrade={() => {}} onAddPlan={() => {}} onBudgetPicker={() => {}} onOpenBudget={() => {}} onNotice={() => {}} {...props} />;
  }
  it('lot planifié : la fiche du brassin s’ouvre, une seule fois', () => {
    const fait = vi.fn(); render(<Hote cible={{ planId: 'P-B1', batchId: 'B1', at: 1 }} onCibleTraitee={fait} />);
    expect(screen.getByRole('dialog', { name: /Pale Ale, brassin prévu/ })).toBeVisible();
    expect(fait).toHaveBeenCalledTimes(1);
  });
  it('budget de recette sans lot : l’étiquette du plan est ouverte par son identifiant', () => {
    const onOpenPlan = vi.fn(); render(<Hote cible={{ planId: 'LOYER', at: 2 }} onOpenPlan={onOpenPlan} plans={[loyer, planPrevoir({ ...brassin(), id: 'B9' } as never)]} />);
    expect(screen.getByRole('status')).toHaveTextContent(/Ajouté aux prévisions|Ce brassin/);
  });
  it('lot sans sortie prévue : le dit', () => {
    render(<Hote cible={{ planId: 'LOYER', batchId: 'B2', at: 3 }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Ce brassin n’a plus de sortie prévue.');
  });
  it('lot hors de l’horizon : l’horizon s’élargit', async () => {
    const tard = brassin({ id: 'B3', plannedBrewDate: '15.04.2027' } as never);
    const onHorizon = vi.fn(); render(<Hote horizon={30} cible={{ planId: 'P-B3', batchId: 'B3', at: 4 }} batches={[tard]} plans={[loyer, planPrevoir(tard)]} onHorizon={onHorizon} />);
    await waitFor(() => expect(onHorizon).toHaveBeenCalledWith(365));
  });
});
