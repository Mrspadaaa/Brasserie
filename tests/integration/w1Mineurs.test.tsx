// @vitest-environment jsdom
/**
 * Voie w1 (test d'écran 8b9e1732, FN-22 à FN-26 ; constats 22, 24, 25, 26 du jeu de nuit) : un test rouge sur HEAD avant chaque correction.
 * FN-22 : trois mots presque pareils dans Filtres. FN-23 : légende du graphique de la prévision, nom tel quel. FN-24 : nom du projet des cartes
 * « Avec / Sans » sans coupure (ou coupé par la fin, nom entier au toucher). FN-25 : « Limites » dit son horizon. FN-26 : « 750,00 CHF » ne se coupe pas.
 * Constat 22 : « Rien de prévu » par le vrai chemin (service, onglet), pas par une prop.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { PlanSheet } from '../../src/ui/finance/FinanceForms';
import { buildForecast } from '../../src/domain/finance/forecast';
import { construireEscalier, dernierJourInclus } from '../../src/ui/finance/previsions/escalier';
import { mesureDuProjet } from '../../src/ui/finance/previsions/mesureProjet';
import type { FinancialPlan } from '../../src/domain/finance/types';
import { ASOF, atelier, brassin, cuve, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, stocks } from './previsionsFixture';

const read = () => StorageService.getTransactions();
const lots = [brassin()];
function Ecran() {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={lots} stockItems={stocks()} />;
}
function semer(plans: FinancialPlan[], transactions: ReturnType<typeof atelier>[] = [atelier(), loyerNovembre()]) {
  FinanceService.saveProfile({ ...FinanceService.getProfile(), ...profil() } as never);
  FinanceService.saveAsset(cuve());
  for (const p of plans) FinanceService.savePlan(p);
  for (const t of transactions) StorageService.addTransaction(t);
}
const ouvrirPrevisions = () => { render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' })); };

beforeEach(() => {
  cleanup(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'forecast');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('FN-22 : le panneau Filtres ne répète pas trois mots presque pareils', () => {
  it('« Courantes / Tout » (périmètre) et « toutes les dates » restent ; l’état « tous » prend un autre mot', () => {
    render(<TransactionJournal transactions={[]} payments={[]} archives={[]} renderRow={() => <span />} onManageArchives={() => {}} onSale={() => {}} onPrivateMovement={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^Filtres/ }));
    const perimetre = within(screen.getByRole('group', { name: 'Périmètre du journal' })).getAllByRole('button').map(b => b.textContent);
    expect(perimetre).toEqual(['Courantes', 'Tout']);
    const etats = within(screen.getByRole('group', { name: 'État des opérations' })).getAllByRole('button').map(b => (b.textContent ?? '').replace(/\d+$/, '').trim());
    expect(etats.filter(e => /^tout/i.test(e))).toEqual([]);
    expect(etats).toContain('Sans filtre');
    expect(screen.getByText('toutes les dates')).toBeInTheDocument();
  });
});

describe('FN-23 : la légende du graphique de la prévision garde le nom tel quel', () => {
  it('« avec ZZ TEST — Prévision », pas « avec zz test — prévision »', () => {
    render(<PlanSheet onClose={() => {}} />);
    const d = within(screen.getByRole('dialog', { name: 'Prévoir une dépense' }));
    fireEvent.change(d.getByPlaceholderText(/Loyer, commande de malt/), { target: { value: 'ZZ TEST — Prévision' } });
    const legende = document.querySelector('.pvc-fin')!;
    expect(legende.textContent).toContain('avec ZZ TEST — Prévision');
    expect(legende.textContent).not.toContain('zz test');
  });
});

describe('FN-24 : le nom du projet des cartes Avec / Sans n’est pas coupé', () => {
  it('un nom de 25 signes est entier sur les deux cartes', () => {
    semer([loyer, frigo({ title: 'ZZ TEST - Projet materiel' }), planPrevoir(brassin())]);
    ouvrirPrevisions();
    const bascule = within(screen.getByRole('group', { name: /Avec ou sans/ }));
    const [avec, sans] = bascule.getAllByRole('button');
    expect(avec.textContent).toContain('Avec ZZ TEST - Projet materiel');
    expect(sans.textContent).toContain('Sans ZZ TEST - Projet materiel');
    expect(avec.textContent).not.toContain('…');
  });
  it('un nom très long est coupé par la fin, et son nom entier est au toucher (title)', () => {
    const long = 'Fermenteur cylindro-conique inox 300 litres avec double paroi';
    semer([loyer, frigo({ title: long }), planPrevoir(brassin())]);
    ouvrirPrevisions();
    const [avec] = within(screen.getByRole('group', { name: /Avec ou sans/ })).getAllByRole('button');
    expect(avec.textContent).toContain('…');
    expect(avec).toHaveAttribute('title', `Avec ${long}`);
  });
});

describe('FN-25 : « Limites » du projet dit son horizon', () => {
  const fin = dernierJourInclus(ASOF, 90);
  const mesure = (plan: FinancialPlan) => {
    const plans = [loyer, plan, planPrevoir(brassin())], transactions = [atelier(), loyerNovembre()];
    const forecast = buildForecast({ transactions, payments: [], plans, profile: profil(), asOf: ASOF, months: 13, batches: [brassin()], stockItems: stocks(), assets: [cuve()] } as never);
    const escalier = construireEscalier({ departCents: forecast.openingCashCents, items: forecast.items, debut: ASOF, fin });
    return mesureDuProjet({ plan, plans, assets: [cuve()], transactions, forecast, escalier, batches: [brassin()], stockItems: stocks(), profile: profil(), asOf: ASOF, fin, prixBouteilleCents: null });
  };
  it('« aucun mois ne tient le seuil » ne contredit pas « tu restes au-dessus de zéro » : il dit jusqu’où il regarde', () => {
    const m = mesure(fermenteur);
    expect(m.pointBas && m.pointBas.soldeCents >= 0).toBe(true);
    const ligne = m.avertissements.find(a => /aucun mois ne tient/.test(a));
    if (ligne) expect(ligne).toMatch(/au-delà|plus loin|13 mois|jusqu’à/);
    expect(ligne).toBeDefined();
  });
});

describe('FN-26 : « 750,00 CHF » du titre de la fiche ne se coupe pas', () => {
  it('le montant et « CHF » sont liés (espace insécable, bloc sans retour à la ligne)', () => {
    semer([loyer, { ...fermenteur, title: 'Fermenteur supplémentaire' }, planPrevoir(brassin())]);
    ouvrirPrevisions();
    fireEvent.click(screen.getByRole('button', { name: /Fermenteur.*−750,00, 28\.01/ }));
    const titre = within(screen.getByRole('dialog')).getByRole('heading', { name: /Fermenteur supplémentaire/ });
    const nb = titre.querySelector('.prv-nb');
    expect(nb?.textContent).toBe('750,00 CHF');
  });
});

describe('constat 22 : « Rien de prévu » disparaît dès qu’une prévision est enregistrée (service, onglet vivant)', () => {
  it('aucune prévision : la ligne est là ; savePlan d’une dépense de 7,00 aujourd’hui : elle s’efface', async () => {
    semer([], []);
    ouvrirPrevisions();
    expect(screen.getByRole('button', { name: /Rien de prévu/ })).toBeTruthy();
    await act(async () => {
      FinanceService.savePlan({ id: 'ZZ-PREV', title: 'ZZ TEST — Prévision', date: ASOF, amountCents: 700, direction: 'out', category: 'chargesFixes', source: 'manual', status: 'active', costAllocation: 'fixed', createdAt: `${ASOF}T10:00:00Z` } as never);
    });
    expect(screen.queryByRole('button', { name: /Rien de prévu/ })).toBeNull();
  });
});
