// @vitest-environment jsdom
/**
 * Finances, lot 2 (19.11). Ses mots :
 * - FIN-DEUX-PERIODES : « Ces différents en fonction de son je click sur le milieu ou < > ??? » ; filtré « Autres frais », la barre Nettoyage et « 1 opération » restaient.
 * - FIN-FRISE-AGRANDIR : « Parcontre "agrandir" la frize est pas pratique.. » (la poignée tirée au bord sautait jusqu'en 2022).
 * - FIN-FICHE-CONFIRMER : « Je peux pas confirmer le paiement sur cette vue, et la coche justificatif a plus d'effet » ; « SI je la coche il y en a 2,
 *   sans justificatif et payment confirme( ça prends la date du jour) » ; « il faut aussi facilement pour confirmer le paiement ».
 * Données simulées « ZZ TEST », aucune écriture réelle.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children }: any) => open ? <div role="dialog" aria-label={title}>{children}</div> : null }));
import { TransactionJournal, createJournalState, type JournalState } from '../../src/ui/finance/TransactionJournal';
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { Frise } from '../../src/ui/finance/operations/Frise';
import { palierMois, joursEntre0, finDuMois } from '../../src/ui/finance/operations/plage';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const today = todayISO();
const achat = (id: string, description: string, category: Transaction['category'], cents: number): Transaction => ({
  id, description, date: today, category, subcategory: '', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: cents, paymentStatus: 'paid', recordedAt: `${today}T08:00:00Z`, vendor: 'ZZ TEST', lines: [] },
});
const nettoyage = achat('N1', 'ZZ TEST masque gant', 'nettoyage', 2_300);
const paiements: FinancialPayment[] = [{ id: 'PAY-N1', transactionId: 'N1', date: today, amountCents: 2_300, direction: 'out', method: 'bank', recordedAt: `${today}T09:00:00Z` }];
const journal = (state?: JournalState, onStateChange?: (s: JournalState) => void) => <TransactionJournal transactions={[nettoyage]} payments={paiements} archives={[]}
  onManageArchives={() => {}} onPrivateMovement={() => {}} renderRow={t => <p key={t.id} data-testid="ligne">{t.description}</p>} state={state} onStateChange={onStateChange}/>;

describe('FIN-DEUX-PERIODES : un seul choix de période, la frise synchrone, barres et compte suivent le filtre', () => {
  it('Opérations n’a plus sa pastille ‹ › : la période se choisit dans l’en-tête ; la frise est là, sans toucher', () => {
    render(journal());
    expect(screen.queryByRole('button', { name: /^Mois (précédent|suivant)$|jours plus (tôt|tard)$|^Choisir le mois|les jours de/ })).toBeNull();
    expect(screen.getByRole('slider', { name: 'Début' })).toBeTruthy();
    expect(screen.getByTestId('frise').textContent).toMatch(/1\s*opération/);
  });
  it('la frise pose la période de l’app (même état que l’en-tête)', () => {
    const vu: JournalState[] = [];
    const etat = createJournalState({ month: today.slice(0, 7) });
    render(journal(etat, s => vu.push(s)));
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.keyDown(debut, { key: 'ArrowRight' });
    const dernier = vu[vu.length - 1];
    expect(dernier.du).toBe(`${today.slice(0, 7)}-02`);
    expect(dernier.au).toBe(finDuMois(today.slice(0, 7)));
  });
  it('filtré « Autres frais » (aucune opération) : le compte dit 0, Nettoyage s’efface, « Autres 0,00 » se marque', () => {
    render(journal(createJournalState({ month: today.slice(0, 7), category: 'divers' })));
    expect(screen.queryAllByTestId('ligne')).toHaveLength(0);
    expect(screen.getByTestId('frise').textContent).toMatch(/0\s*opération/);
    const autres = screen.getByRole('button', { name: /^Autres 0,00/ });
    expect(autres.getAttribute('aria-pressed')).toBe('true');
    expect(autres.closest('.ops-piles')?.hasAttribute('data-choix')).toBe(true);
    expect(screen.getByRole('button', { name: /^Nettoyage/ }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByLabelText(/^Payé, à payer et dépensé/).textContent).toMatch(/dépensé\s*0,00/);
  });
});

describe('FIN-FRISE-AGRANDIR : au bord, la frise s’étend pas à pas, un mois par palier', () => {
  it('palierMois : au 1er du mois, recule d’un mois ; sinon au 1er ; vers l’avenir, au dernier jour', () => {
    expect(palierMois('2026-10-17', -1)).toBe('2026-10-01');
    expect(palierMois('2026-10-01', -1)).toBe('2026-09-01');
    expect(palierMois('2026-10-17', 1)).toBe('2026-10-31');
    expect(palierMois('2026-10-31', 1)).toBe('2026-11-30');
  });
  it('tirer la poignée gauche au bord pendant 1 s recule de 1 à 3 mois, jamais d’années', () => {
    vi.useFakeTimers();
    const poses: Array<[string, string]> = [];
    const Banc = () => {
      const [p, setP] = React.useState({ du: '2026-10-17', au: '2027-01-28' });
      return <Frise mois="2026-10" plage={p} aujourdhui="2026-11-19" jourMax="2027-11-20" nbOperations={0}
        donnees={{ periodeJour: () => ({ depenseCents: 0, materielCents: 0, entreCents: 0, postes: [] } as any), moisSaisi: () => true }}
        onPlage={(du, au) => { poses.push([du, au]); setP({ du, au }); }} onMois={() => {}}/>;
    };
    render(<Banc/>);
    const debut = screen.getByRole('slider', { name: 'Début' });
    fireEvent.pointerDown(debut, { clientX: 0, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerMove(debut, { clientX: -60, clientY: 10, pointerId: 1 });
    act(() => { vi.advanceTimersByTime(1000); });
    fireEvent.pointerUp(debut, { clientX: -60, clientY: 10, pointerId: 1 });
    const [du, au] = poses[poses.length - 1];
    expect(au).toBe('2027-01-28');
    const recul = joursEntre0(du, '2026-10-17');
    expect(recul).toBeGreaterThanOrEqual(28);
    expect(recul).toBeLessThanOrEqual(92);
  });
  it('poignée tenue : la ligne « n jours · n opération » s’efface sous la bulle', () => {
    render(<Frise mois="2026-10" plage={{ du: '2026-10-17', au: '2026-11-10' }} aujourdhui="2026-11-19" jourMax="2027-11-20" nbOperations={0}
      donnees={{ periodeJour: () => ({ depenseCents: 0, materielCents: 0, entreCents: 0, postes: [] } as any), moisSaisi: () => true }} onPlage={() => {}} onMois={() => {}}/>);
    fireEvent.pointerDown(screen.getByRole('slider', { name: 'Début' }), { clientX: 0, clientY: 10, pointerId: 1, button: 0 });
    expect(screen.getByTestId('frise').hasAttribute('data-tenue')).toBe(true);
  });
});

describe('FIN-FICHE-CONFIRMER : la fiche confirme le paiement au jour même', () => {
  beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); });
  afterEach(() => { FirestoreRepo.stopSync(); vi.restoreAllMocks(); });
  const aConfirmer = (id: string): Transaction => ({
    id, date: '15.11.2026', description: `ZZ TEST — ${id}`, category: 'divers', amountHT: 8, tvaRate: 0, tvaAmount: 0, amountTTC: 8, proofNotes: '',
    finance: { version: 1, kind: 'expense', amountCents: 800, lines: [] },
  } as Transaction);
  const ouvrir = (id: string) => render(<TransactionDetails transaction={StorageService.getTransactions().find(t => t.id === id)!} transactions={StorageService.getTransactions()}
    payments={FinanceService.getPayments()} plans={[]} onClose={vi.fn()} onEdit={vi.fn()} onPay={vi.fn()} onRefund={vi.fn()} />);
  const paiementsDe = (id: string) => FinanceService.getPayments().filter(p => p.transactionId === id);

  it('cocher « c’est normal » : sans justificatif ET payé à la date du jour', () => {
    StorageService.addTransaction(aConfirmer('T-COCHE'));
    ouvrir('T-COCHE');
    fireEvent.click(screen.getByRole('checkbox', { name: /c’est normal/ }));
    expect(StorageService.getTransactions().find(t => t.id === 'T-COCHE')?.finance?.proofNotNeeded).toBe(true);
    const p = paiementsDe('T-COCHE');
    expect(p).toHaveLength(1);
    expect(p[0]).toMatchObject({ date: today, amountCents: 800, direction: 'out' });
  });
  it('« Confirmer le paiement » au premier plan : payé au jour même, le justificatif intact', () => {
    StorageService.addTransaction(aConfirmer('T-BOUTON'));
    ouvrir('T-BOUTON');
    fireEvent.click(screen.getByRole('button', { name: /^Confirmer le paiement/ }));
    expect(paiementsDe('T-BOUTON')[0]).toMatchObject({ date: today, amountCents: 800 });
    expect(StorageService.getTransactions().find(t => t.id === 'T-BOUTON')?.finance?.proofNotNeeded).toBeUndefined();
  });
  it('une pièce déjà payée n’a pas de bouton « Confirmer le paiement »', () => {
    StorageService.addTransaction({ ...aConfirmer('T-PAYE'), finance: { ...aConfirmer('T-PAYE').finance!, paymentStatus: 'unpaid' } } as Transaction);
    ouvrir('T-PAYE');
    expect(screen.queryByRole('button', { name: /^Confirmer le paiement/ })).toBeNull();
  });
});
