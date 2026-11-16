// @vitest-environment jsdom
/**
 * Voie x2 : constats FN-30, 31, 32, 36, 38, 39, 40, 41, 42 du jeu ZZ TEST du 16.11 et du test d'écran dfe9189e. Pièces « ZZ TEST — … » seulement.
 * (FN-34 : voulu par B2 n° 40, voir RESULTAT.md ; aucun test neuf.)
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, subtitle, children, footer }: any) => open ? <div role="dialog" aria-label={title}><p>{subtitle}</p>{children}{footer}</div> : null }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<typeof import('../../src/services/financeDocuments')>()), saveFinanceDocumentConfirmed: vi.fn(async () => undefined) }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { PaymentSheet } from '../../src/ui/finance/FinanceForms';
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { EditTransactionModal } from '../../src/components/EditTransactionModal';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { ordreDImputation, piecesOuvertesDuTiers } from '../../src/domain/finance/repartition';
import { creanceDeTropPaye } from '../../src/ui/finance/modifier/creance';
import { nomAffiche } from '../../src/ui/finance/operations/calculs';
import { paymentState, todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

const auj = todayISO();
const piece = (id: string, description: string, cents: number, recordedAt: string, finance: any = {}, extra: Partial<Transaction> = {}): Transaction => ({
  id, date: auj, description, category: 'divers', subcategory: '', amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', vendor: 'ZZ TEST — Fournisseur', recordedAt, ...finance }, ...extra
});
const pay = (id: string, transactionId: string, cents: number, extra: Partial<FinancialPayment> = {}): FinancialPayment =>
  ({ id, transactionId, date: auj, amountCents: cents, direction: 'out', method: 'bank', recordedAt: `${auj}T08:00:00.000Z`, ...extra });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe('FN-30 : « Autre montant » de l’avis reçoit le toucher, pas la ligne', () => {
  it('l’avis est au-dessus du ::after de .ops-main (qui couvre toute la ligne) : position et z-index', () => {
    const css = readFileSync('src/ui/finance/operations/paire.css', 'utf8');
    const regle = /\.ops-avis\s*\{([^}]*)\}/.exec(css)![1];
    expect(regle).toMatch(/position:\s*relative/);
    expect(regle).toMatch(/z-index:\s*[1-9]/);
  });
});

describe('FN-31 : à même date, la pièce saisie la première est imputée la première', () => {
  const p = (id: string, saisieLe: string | null) => ({ id, resteCents: 1000, echeance: null, date: auj, saisieLe });
  it('ordreDImputation départage par l’heure de saisie avant l’identifiant', () => {
    expect(ordreDImputation([p('A-id-1', `${auj}T09:00:00Z`), p('Z-id-9', `${auj}T08:00:00Z`)]).map(x => x.id)).toEqual(['Z-id-9', 'A-id-1']);
  });
  it('sans heure de saisie, l’identifiant reste le dernier recours (ordre stable)', () => {
    expect(ordreDImputation([p('B', null), p('A', null)]).map(x => x.id)).toEqual(['A', 'B']);
  });
  it('piecesOuvertesDuTiers lit finance.recordedAt : A (saisie à 08 h, id T-9) avant B (09 h, id T-1)', () => {
    const A = piece('T-9', 'ZZ TEST — pièce A', 1000, `${auj}T08:00:00.000Z`), B = piece('T-1', 'ZZ TEST — pièce B', 1500, `${auj}T09:00:00.000Z`);
    expect(piecesOuvertesDuTiers(B, [A, B], []).map(x => x.id)).toEqual(['T-9', 'T-1']);
  });
});

describe('FN-32 : l’étiquette de la barre ne change pas selon les pièces touchées', () => {
  it('à 8,00 (seule A est touchée), la légende dit « pièce A 8,00 », pas « zz 8,00 »', () => {
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
    const A = piece('T-9', 'ZZ TEST — pièce A', 1000, `${auj}T08:00:00.000Z`), B = piece('T-1', 'ZZ TEST — pièce B', 1500, `${auj}T09:00:00.000Z`);
    [A, B].forEach(t => StorageService.addTransaction(t));
    render(<PaymentSheet transaction={B} payments={FinanceService.getPayments()} transactions={StorageService.getTransactions()} onClose={() => {}} />);
    fireEvent.change(screen.getByLabelText('Montant du virement (CHF)'), { target: { value: '8' } });
    const legende = document.querySelector('.pay-fk')!.textContent!;
    expect(legende).toMatch(/pièce A 8,00/);
    expect(legende).not.toMatch(/zz/);
  });
});

describe('FN-36 : l’aperçu « après » de « J’ai bien payé » dit le trop-payé', () => {
  it('« 2,00 à récupérer » figure dans la rangée « après »', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
    StorageService.addTransaction(piece('T-A', 'ZZ TEST — pièce A', 1000, `${auj}T08:00:00.000Z`, { paymentStatus: 'paid' }));
    FinanceService.recordPayment(pay('PAI-A', 'T-A', 1000));
    render(<EditTransactionModal isOpen transaction={StorageService.getTransactions().find(t => t.id === 'T-A')!} onClose={() => {}} onSave={() => {}} />);
    const champ = screen.getByLabelText('Montant (CHF)');
    fireEvent.focus(champ); fireEvent.change(champ, { target: { value: '8' } }); fireEvent.blur(champ);
    fireEvent.click(screen.getByRole('radio', { name: /J’ai bien payé 10,00/ }));
    const apres = document.querySelector('[data-mot="après"]')!;
    expect(apres.textContent).toMatch(/2,00 à récupérer/);
    // « Erreur de saisie » : rien à récupérer.
    fireEvent.click(screen.getByRole('radio', { name: /Erreur de saisie/ }));
    expect(document.querySelector('[data-mot="après"]')!.textContent).not.toMatch(/à récupérer/);
  });
});

describe('FN-38 : la créance se montre sur la pièce dont elle vient, pas sur son doublon', () => {
  const T = `${auj}T10:00:00.000Z`;
  const A = piece('A', 'ZZ TEST — pièce A', 800, `${auj}T08:00:00.000Z`, { paymentStatus: 'paid' }), A2 = piece('A2', 'ZZ TEST — pièce A', 800, `${auj}T09:00:00.000Z`);
  const creance = creanceDeTropPaye(A, { type: 'avoir', cents: 200, direction: 'in' }, { aujourdhui: auj, maintenant: T }, 'MOUV-1');
  const ouvrir = (tx: Transaction, paiements: FinancialPayment[]) => render(<TransactionDetails transaction={tx} transactions={[A, A2, creance]} payments={paiements} plans={[]}
    onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} onOpenTransaction={vi.fn()} />);
  it('la créance écrite par la correction de A (même instant que sa contre-écriture) : visible sur A, absente de A2', () => {
    const ps = [pay('P1', 'A', 1000), pay('CONTRE-P1', 'A', 1000, { direction: 'in', reversalOfId: 'P1', recordedAt: T }), pay('P2', 'A', 800, { recordedAt: T })];
    ouvrir(A2, ps);
    expect(screen.queryByText(/voir la créance/)).toBeNull();
    cleanup();
    ouvrir(A, ps);
    expect(screen.getByText(/2,00 CHF à récupérer : voir la créance/)).toBeInTheDocument();
  });
  it('sans trace de l’instant : la plus ancienne pièce payée de ce nom, jamais la pièce encore à payer', () => {
    const ps = [pay('P1', 'A', 800, { recordedAt: `${auj}T07:00:00.000Z` })];
    ouvrir(A2, ps);
    expect(screen.queryByText(/voir la créance/)).toBeNull();
    cleanup();
    ouvrir(A, ps);
    expect(screen.getByText(/voir la créance/)).toBeInTheDocument();
  });
});

describe('FN-39 : « Doublons » désactivé dit pourquoi', () => {
  it('sans doublon : nom accessible « aucun doublon » et infobulle', () => {
    const t = piece('SEUL', 'ZZ TEST — seule', 1000, `${auj}T08:00:00.000Z`);
    render(<TransactionJournal transactions={[t]} payments={[]} archives={[]} onManageArchives={() => {}} onPrivateMovement={() => {}}
      renderRow={(x, s) => <TransactionRow key={x.id} transaction={x} transactions={[t]} payments={[]} state={s} onOpen={() => {}} />} />);
    const bouton = screen.getByRole('button', { name: /^Doublons/ });
    expect(bouton).toBeDisabled();
    expect(bouton).toHaveAccessibleName(/aucun doublon/i);
    expect(bouton).toHaveAttribute('title', expect.stringMatching(/aucun doublon/i));
  });
});

describe('FN-40 : l’avis « Opération mise à jour » ne reste pas', () => {
  const read = () => StorageService.getTransactions();
  function Espace() { const transactions = useStorageValue(read); return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" onOpenQuickAction={() => {}} />; }
  const avecAvis = async () => {
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'journal');
    render(<Espace />);
    fireEvent.click(screen.getByRole('button', { name: 'Apport ou prélèvement privé' }));
    const montant = screen.getByLabelText('Montant (CHF)');
    fireEvent.change(montant, { target: { value: '5' } }); fireEvent.blur(montant);
    fireEvent.change(screen.getByLabelText('Motif'), { target: { value: 'ZZ TEST — Apport' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer l’apport' }));
    await waitFor(() => expect(screen.getByText('Mouvement enregistré.')).toBeInTheDocument());
  };
  it('au changement de vue (Archives), l’avis disparaît', async () => {
    await avecAvis();
    fireEvent.click(screen.getByRole('button', { name: 'Archives' }));
    await waitFor(() => expect(screen.queryByText('Mouvement enregistré.')).not.toBeInTheDocument());
  });
  it('seul, il s’efface après quelques secondes (6 s)', async () => {
    await avecAvis();
    expect(screen.getByText('Mouvement enregistré.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Mouvement enregistré.')).not.toBeInTheDocument(), { timeout: 9000 });
  }, 15000);
});

describe('FN-41 : un paiement annulé et sa contre-écriture se replient en une ligne « annulé »', () => {
  it('Payé, Annuler, Payé : une ligne « annulé » sans lien de correction, le paiement vivant garde le sien, « Paiements 2 »', () => {
    const A = piece('A', 'ZZ TEST — pièce A', 1000, `${auj}T08:00:00.000Z`, { paymentStatus: 'paid' });
    const ps = [pay('P1', 'A', 1000), pay('CONTRE-P1', 'A', 1000, { direction: 'in', reversalOfId: 'P1', note: 'Correction d’un paiement saisi par erreur', recordedAt: `${auj}T08:00:05.000Z` }), pay('P2', 'A', 1000, { recordedAt: `${auj}T08:00:09.000Z` })];
    render(<TransactionDetails transaction={A} transactions={[A]} payments={ps} plans={[]} onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} />);
    const resume = document.querySelector('.fiche-hist-corr > summary')!;
    expect(resume.textContent).toMatch(/annulé/);
    expect(resume.textContent).not.toMatch(/corrigé/);
    expect(document.querySelector('.fiche-hist-corr')!.querySelectorAll('button')).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: 'Corriger ce paiement saisi par erreur' })).toHaveLength(1);
    expect(document.querySelector('.fiche-dt-bas > summary em')!.textContent).toBe('2');
  });
});

describe('FN-42 : la ligne d’une créance garde le nom de la pièce à 390', () => {
  const nom = 'À récupérer : trop payé sur « ZZ TEST — pièce B »';
  const creance = piece('C-1', nom, 200, `${auj}T10:00:00.000Z`, { paymentStatus: 'unpaid' }, { subcategory: 'À récupérer' });
  it('nomAffiche : le nom de la pièce d’abord, « trop payé » ensuite ; la donnée écrite ne change pas ; un autre nom reste tel quel', () => {
    expect(nomAffiche(creance)).toBe('ZZ TEST — pièce B · trop payé');
    expect(creance.description).toBe(nom);
    expect(nomAffiche({ ...creance, description: 'Loyer', subcategory: '' })).toBe('Loyer');
  });
  it('la ligne dit le nom court d’abord et « à récupérer 2,00 » en étiquette', () => {
    const p = pay('PC', 'C-1', 200);
    const etat = paymentState(creance, [p], [creance]);
    render(<TransactionRow transaction={creance} transactions={[creance]} payments={[p]} state={etat} onOpen={() => {}} />);
    const ligne = document.querySelector('.ops-row')!;
    expect(ligne.querySelector('.ops-nom')!.textContent).toBe('ZZ TEST — pièce B · trop payé');
    expect(within(ligne as HTMLElement).getByRole('button', { name: /^ZZ TEST — pièce B · trop payé/ })).toBeInTheDocument();
    expect(ligne.querySelector('.ops-tg')!.textContent).toMatch(/^à récupérer 2,00/);
  });
});
