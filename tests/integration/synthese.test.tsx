import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: ({ initialQuestion }: any) => <div role="dialog" aria-label="Compagnon">{initialQuestion}</div> }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { LigneLitre, litreDuBrassin } from '../../src/ui/finance/synthese/Lignes';
import type { Transaction } from '../../src/types';

// Fixture = la démo de la maquette g3a, date fixée au 9 novembre 2026 (L12, B10 de la revue).
const tx = (id: string, description: string, cents: number, category: string, finance: any = {}, patch: Partial<Transaction> = {}): Transaction => ({
  id, description, date: '2026-11-05', category: category as never, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: category === 'recettes' ? 'income' : 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', vendor: undefined, ...finance }, ...patch,
});
const paye = (t: Transaction) => FinanceService.recordPayment({ id: `PAI-${t.id}`, transactionId: t.id, date: t.date, amountCents: t.finance!.amountCents, direction: t.finance!.kind === 'income' ? 'in' : 'out', method: 'bank', recordedAt: `${t.date}T10:00:00Z` });
function demo({ soldeConfirme = false }: { soldeConfirme?: boolean } = {}) {
  const lignes = [
    tx('V', 'Vente au marché', 72000, 'recettes', { vendor: 'Marché du village' }), tx('N', 'Nettoyant alcalin', 4200, 'nettoyage', { vendor: 'Comptoir du brasseur' }),
    tx('B', 'Malt et houblons', 18680, 'brassage', { vendor: 'Comptoir du brasseur', lines: [{ id: 'malt', kind: 'ingredient', description: 'Pilsner', amountCents: 18680 }] }),
    tx('E', 'Électricité', 6800, 'chargesFixes', { vendor: 'Énergie' }), tx('J', 'Joints de la cuve', 2860, 'materiel', { vendor: 'Inox & Co' }),
  ];
  lignes.forEach(t => { StorageService.addTransaction(t); paye(t); });
  StorageService.addTransaction(tx('L', 'Loyer de l’atelier', 40000, 'chargesFixes', { dueDate: '2026-11-25', vendor: 'Atelier' }));
  StorageService.addTransaction(tx('H', 'Petits achats courants', 2800, 'divers', {}, { date: '2026-10-05' })); paye(tx('H', '', 2800, 'divers', {}, { date: '2026-10-05' }));
  if (soldeConfirme) FinanceService.saveProfile({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-11-01', amountCents: 100000, confirmed: true } });
}
const read = () => StorageService.getTransactions();
function Ecran() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" />; }

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-09T10:00:00Z'));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
  StorageService.setUiState('finances_workspace', 'overview');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('Synthèse g3a : la maquette remplace l’écran', () => {
  it('T2 démo : entré 720,00, dépensé 696,80, +23,20 gagnés, matériel 28,60 à part, le loyer hachuré « à payer 25 nov. »', () => {
    demo(); const { container } = render(<Ecran/>);
    expect(screen.getByRole('heading', { level: 2, name: 'Novembre' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('720,00');
    expect(screen.getByText('Dépensé').parentElement).toHaveTextContent('696,80');
    expect(container.querySelector('.syn-gb')).toHaveTextContent('+23,20');
    expect(screen.getByText('CHF gagnés')).toBeVisible();
    expect(screen.getByRole('button', { name: /Matériel 28,60.*à part/ })).toBeVisible();
    expect(screen.getByRole('button', { name: /Loyer de l’atelier 400,00.*à payer 25 nov/ })).toBeVisible();
    const legende = screen.getByText('payé').closest('.syn-leg')!;
    expect(legende).toHaveTextContent('à payer');
  });
  it('T19 aucun résidu de l’ancien écran : ni Situation, ni Coûts, ni Règlements à suivre, ni Dépenses nettes, un seul titre', () => {
    demo(); const { container } = render(<Ecran/>);
    for (const mot of ['Situation', 'Coûts', 'Règlements à suivre', 'Dépenses nettes', 'Répartition des dépenses', 'Principaux fournisseurs']) expect(screen.queryByText(mot)).not.toBeInTheDocument();
    expect(container.querySelector('.finance-subnav')).toBeNull();
    expect(container.querySelector('.finance-bar')).toBeNull();
    expect(container.querySelectorAll('h2')).toHaveLength(1);
  });
  it('T13 période : octobre sans vente = Entré 0,00 et « Perdu » ; « tout » somme tout ; le segment suit', () => {
    demo(); const { container } = render(<Ecran/>);
    const segment = within(screen.getByRole('group', { name: 'Période' }));
    expect(segment.getByRole('button', { name: 'nov.' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(segment.getByRole('button', { name: 'oct.' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Octobre' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('0,00');
    expect(screen.getByText('Dépensé').parentElement).toHaveTextContent('28,00');
    expect(container.querySelector('.syn-gb')).toHaveTextContent('Perdu');
    expect(container.querySelector('.syn-gb')).toHaveTextContent('28,00');
    fireEvent.click(segment.getByRole('button', { name: 'tout' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Tout l’historique' })).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('720,00');
    expect(segment.getByRole('button', { name: 'tout' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('mois sans aucune écriture : zéros écrits et une ligne qui le dit', () => {
    render(<Ecran/>);
    expect(screen.getByText('Aucune écriture sur cette période.')).toBeVisible();
    expect(screen.getByText('Entré').parentElement).toHaveTextContent('0,00');
  });
  it('T17 « ✦ Pourquoi ? » : phrase calculée sur la fixture, parts = 100 %, source dite, pas de « exemple »', () => {
    demo(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: /Pourquoi \?/ }));
    const feuille = within(screen.getByRole('dialog', { name: 'Pourquoi si peu ?' }));
    expect(feuille.getByText(/Ce qui est entré \(720,00.*CHF\) est parti surtout dans « Charges fixes » : 468,00.*CHF, soit 65 % de l’entré/)).toBeVisible();
    expect(feuille.getByText(/« Brassage » en prend 26 %/)).toBeVisible();
    expect(feuille.getByText(/Il en reste 23,20/)).toBeVisible();
    expect(feuille.getByText(/Source : Opérations de novembre \(6 lignes\)\. Calcul fait ici, sans IA\./)).toBeVisible();
    expect(screen.queryByText('exemple')).not.toBeInTheDocument();
    const parts = feuille.getByRole('img', { name: /Parts de l’entré/ }).getAttribute('aria-label')!;
    expect([...parts.matchAll(/(\d+) %/g)].reduce((n, m) => n + Number(m[1]), 0)).toBe(100);
  });
  it('T11 caisse : 1 394,60 en caisse, libre 994,60, à payer 400,00 ; « Voir les factures à payer » ouvre Opérations', () => {
    demo({ soldeConfirme: true }); render(<Ecran/>);
    expect(screen.getByRole('button', { name: 'Solde et paramètres financiers' })).toHaveTextContent(/1\s?394,60/);
    expect(screen.getByText(/^libre/)).toHaveTextContent(/994,60/);
    fireEvent.click(screen.getByRole('button', { name: 'Voir les factures à payer' }));
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
  });
  it('T12 chip du loyer : « Payer » ouvre la feuille de paiement', () => {
    demo({ soldeConfirme: true }); render(<Ecran/>);
    expect(screen.getByRole('button', { name: 'Ouvrir Loyer de l’atelier' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Noter le paiement de Loyer de l’atelier' }));
    expect(screen.getByRole('dialog')).toBeVisible();
  });
  it('T10 solde inconnu : « À compléter », jamais « 0,00 » ; l’à-payer reste cliquable', () => {
    demo(); render(<Ecran/>);
    const caisse = screen.getByRole('button', { name: 'Solde et paramètres financiers' });
    expect(caisse).toHaveTextContent('À compléter');
    expect(caisse).not.toHaveTextContent('0,00');
    expect(screen.getByRole('button', { name: 'Voir les factures à payer' })).toHaveTextContent('400,00');
    expect(screen.getByText('Solde de départ à renseigner')).toBeVisible();
  });
  it('T14 un segment de catégorie ouvre Opérations ; le matériel aussi', () => {
    demo(); render(<Ecran/>);
    fireEvent.click(screen.getByRole('button', { name: /Brassage 186,80.*[Vv]oir ces opérations/ }));
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
  });
  it('T16 « Fournisseurs, matériel » : repliée, puis les fournisseurs du mois', () => {
    demo(); render(<Ecran/>);
    const ligne = screen.getByRole('button', { name: /Fournisseurs, matériel/ });
    expect(ligne).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('list', { name: 'Principaux fournisseurs' })).not.toBeInTheDocument();
    fireEvent.click(ligne);
    expect(within(screen.getByRole('list', { name: 'Principaux fournisseurs' })).getByText('Comptoir du brasseur')).toBeVisible();
  });
  it('T18 le compagnon : la ligne de l’assistant, question préparée, jamais envoyée seule', () => {
    demo(); render(<Ecran/>);
    fireEvent.click(screen.getByText('Compagnon brasseur'));
    expect(screen.getByRole('dialog', { name: 'Compagnon' })).toHaveTextContent(/dépenses/);
  });
  it('« À vérifier » : la démo n’y met que « Matériel sans registre » (US-2) ; un paiement inconnu ajoute sa rangée, visible sans geste', () => {
    demo({ soldeConfirme: true }); const { unmount } = render(<Ecran/>);
    const bloc = within(screen.getByLabelText('À vérifier'));
    expect(bloc.getByText('Matériel sans registre')).toBeVisible();
    expect(bloc.queryByText('Confirmer les paiements')).not.toBeInTheDocument();
    unmount();
    StorageService.addTransaction(tx('X', 'Avant l’app', 9000, 'divers', { paymentStatus: undefined }));
    render(<Ecran/>);
    expect(screen.getByRole('button', { name: /Confirmer les paiements/ })).toBeVisible();
    expect(screen.getByText(/1 à confirmer/)).toBeVisible();
  });
  it('solde confirmé et rien à signaler : pas de ligne « À vérifier » (l’écran est celui de la maquette)', () => {
    FinanceService.saveProfile({ id: 'current', canton: 'FR', legalForm: 'sole-proprietor', vatRegistered: false, accounting: 'simplified', openingCash: { date: '2026-11-01', amountCents: 100000, confirmed: true } });
    render(<Ecran/>);
    expect(screen.queryByLabelText('À vérifier')).not.toBeInTheDocument();
  });
  it('T21 seuil de TVA franchi : alerte visible hors repli, lien vers les ventes', () => {
    for (let i = 0; i < 3; i++) StorageService.addTransaction(tx(`G${i}`, `Grosse vente ${i}`, 4_000_000, 'recettes', {}, { date: `2026-0${i + 6}-10` }));
    render(<Ecran/>);
    const alerte = screen.getByRole('alert', { name: 'Seuil de TVA' });
    expect(alerte).toBeVisible();
    fireEvent.click(within(alerte).getByRole('button', { name: /Voir les ventes/ }));
    expect(screen.getByRole('tab', { name: 'Opérations' })).toHaveAttribute('aria-selected', 'true');
  });
});

describe('T15 le litre : les trois appels de domaine, jamais de 0 inventé', () => {
  const snapshot = { dejaPaye: 22.41, aPayer: 64.26, annee: 116.1, totalCost: 202.77, lines: [], complete: true, netVolumeL: 27, netVolumeSource: 'saisi', packagingCost: 24, beerTaxCost: 6.84, costPerL: 7.51, title: 'Pale Ale', batchId: 'B1' } as any;
  const plan = (brewEstimate: any) => [{ id: 'P1', title: 'Pale Ale', createdAt: '2026-11-01T10:00:00Z', brewEstimate }] as any;
  it('chiffre exact et litres nets', () => {
    expect(litreDuBrassin(snapshot)).toMatchObject({ litres: 27, chfParL: 7.51 });
  });
  it('estimation ancienne (sans les trois notions) ou litres non saisis : null, jamais 0', () => {
    const ancien = { ...snapshot, dejaPaye: undefined };
    expect(litreDuBrassin(ancien).chfParL).toBeNull();
    expect(litreDuBrassin({ ...snapshot, netVolumeSource: 'volume-a-brasser' }).chfParL).toBeNull();
  });
  it('la ligne : « Pale Ale · 27 L nets · tout compris · estimé » et « 7,51 CHF/L » ; « + » ouvre le choix', () => {
    const picker = vi.fn();
    render(<LigneLitre plans={plan(snapshot)} batches={[]} recipes={[]} onOpenBudget={() => {}} onAbsent={() => {}} onPicker={picker}/>);
    const ligne = screen.getByText('Pale Ale').closest('[data-ligne="litre"]') as HTMLElement;
    expect(ligne).toHaveTextContent(/27 L nets.*tout compris.*estimé/);
    expect(ligne).toHaveTextContent(/7,51.*\/L/);
    fireEvent.click(screen.getByRole('button', { name: 'Coût d’un autre brassin' }));
    expect(picker).toHaveBeenCalled();
  });
  it('estimation ancienne : « À compléter », aucun « 0,00 »', () => {
    render(<LigneLitre plans={plan({ ...snapshot, dejaPaye: undefined })} batches={[]} recipes={[]} onOpenBudget={() => {}} onAbsent={() => {}} onPicker={() => {}}/>);
    expect(screen.getByText('À compléter')).toBeVisible();
    expect(screen.queryByText(/0,00/)).not.toBeInTheDocument();
  });
  it('aucune estimation : « Estimer un brassin »', () => {
    render(<LigneLitre plans={[]} batches={[]} recipes={[]} onOpenBudget={() => {}} onAbsent={() => {}} onPicker={() => {}}/>);
    expect(screen.getByRole('button', { name: 'Estimer un brassin' })).toBeVisible();
  });
});
