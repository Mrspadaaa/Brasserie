// @vitest-environment jsdom
/**
 * Lot fin, tour 3 (19.11) : T2-3 (le compte de la période dit la même chose que la liste) et T2-4 (la fiche d'une opération à payer :
 * « Confirmer le paiement », « Retirer cette écriture »). Fixtures « ZZ TEST », services simulés, aucun réseau, aucun Gemini.
 */
import React, { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('recharts', () => ({ ResponsiveContainer: () => null, AreaChart: () => null, Area: () => null, XAxis: () => null, YAxis: () => null, Tooltip: () => null, CartesianGrid: () => null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<typeof import('../../src/services/financeDocuments')>()), saveFinanceDocumentConfirmed: vi.fn(async () => undefined) }));
import type { Transaction } from '../../src/types';
import type { Periode } from '../../src/components/periode/periode';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';

const piece = (id: string, cents: number, extra: Partial<Transaction> = {}, finance: any = {}): Transaction => ({
  id, date: '2026-11-19', description: 'ZZ TEST — à payer', category: 'divers', subcategory: '', amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', ...finance }, ...extra,
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-11-19T10:00:00'));
  localStorage.clear();
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('T2-3 : le compte de la période dit ce que la liste montre', () => {
  const OCT: Periode = { genre: 'mois', annee: 2026, mois: 10 };
  const NOV: Periode = { genre: 'mois', annee: 2026, mois: 11 };
  const aPayer = piece('ZZ-AP', 4200, {}, { dueDate: '2026-12-10' });
  const payee = piece('ZZ-OK', 1500, { date: '2026-10-08', description: 'ZZ TEST — payée octobre' }, { paymentStatus: 'paid' });
  const ouvre = (periode: Periode, jeu: Transaction[]) => {
    StorageService.setUiState('finances_workspace', 'journal');
    render(<FinancesTab transactions={jeu} config={defaultConfig} budgetLines={[]} globalTimeFilter={periode} onChangeGlobalTimeFilter={() => undefined}/>);
    return screen.getByTestId('frise');
  };

  it('octobre : la liste garde l’opération à payer du 19.11 ; le compte dit « 0 opération · 1 à payer », pas « 0 opération » seul', () => {
    const frise = ouvre(OCT, [aPayer]);
    expect(screen.getAllByText(/ZZ TEST — à payer/).length).toBeGreaterThan(0);
    expect(frise.textContent).toMatch(/31\s*jours\s*·\s*0\s*opération\s*·\s*1\s*à payer/);
  });
  it('octobre avec une opération payée en octobre : « 1 opération · 1 à payer » ; la payée ne s’ajoute pas au « à payer »', () => {
    const frise = ouvre(OCT, [aPayer, payee]);
    expect(frise.textContent).toMatch(/1\s*opération\s*·\s*1\s*à payer/);
  });
  it('novembre : l’opération est dans la période, elle se compte, aucun « à payer » en plus', () => {
    const frise = ouvre(NOV, [aPayer]);
    expect(frise.textContent).toMatch(/30\s*jours\s*·\s*1\s*opération/);
    expect(frise.textContent).not.toMatch(/à payer/);
  });
});

describe('T2-4 : la fiche d’une opération à payer', () => {
  const fiche = (tx: Transaction, props: any = {}, payments: any[] = []) => render(createElement(TransactionDetails, {
    transaction: tx, transactions: [tx], payments, plans: [], onClose: vi.fn(), onEdit: vi.fn(), onPay: vi.fn(), onRefund: vi.fn(), ...props }));

  it('le bouton principal dit « Confirmer le paiement » (le verbe de la liste) et ouvre la même feuille que « Noter un paiement » avant', () => {
    const onPay = vi.fn();
    fiche(piece('T-1', 1500, {}, { dueDate: '2026-11-25' }), { onPay });
    expect(screen.queryByRole('button', { name: /Noter un paiement/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));
    expect(onPay).toHaveBeenCalledTimes(1);
  });
  it('un seul bouton « Confirmer le paiement » sur la fiche (pas de doublon avec la confirmation d’un état « à confirmer »)', () => {
    fiche(piece('T-1b', 1500));
    expect(screen.getAllByRole('button', { name: /^Confirmer le paiement/ })).toHaveLength(1);
  });
  it('un état « à confirmer » garde son geste propre (paiement du jour, en banque), sans second « Confirmer le paiement »', () => {
    const onPay = vi.fn();
    fiche(piece('T-1c', 1500, {}, { paymentStatus: 'unknown' }), { onPay });
    expect(screen.getAllByRole('button', { name: /^Confirmer le paiement/ })).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Noter un paiement/ })).toBeTruthy();
  });
  it('une écriture à payer saisie par erreur se retire : « Retirer cette écriture », même chemin que pour une payée (aucun paiement à inverser)', async () => {
    const libre = piece('T-2', 1500);
    vi.spyOn(StorageService, 'getTransactions').mockReturnValue([libre]);
    const revert = vi.spyOn(StorageService, 'revertTransaction').mockReturnValue({ success: true, message: '' });
    const reg = vi.spyOn(FinanceService, 'recordPayment').mockImplementation(() => undefined as never);
    fiche(libre);
    fireEvent.click(screen.getByText('Corriger une erreur de saisie'));
    expect(screen.queryByRole('button', { name: 'Annuler cette écriture' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Retirer cette écriture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le retrait' }));
    await waitFor(() => expect(revert).toHaveBeenCalledWith('T-2'));
    expect(reg).not.toHaveBeenCalled();
  });
  it('une opération à payer liée à un avoir ne se retire pas : le motif est dit, rien n’est annulé ni perdu', async () => {
    const liee = piece('T-3', 1500);
    const avoir = piece('T-3-AV', 500, { description: 'ZZ TEST — avoir' }, { kind: 'expense', refundOfId: 'T-3', paymentStatus: 'unpaid' });
    vi.spyOn(StorageService, 'getTransactions').mockReturnValue([liee, avoir]);
    const revert = vi.spyOn(StorageService, 'revertTransaction').mockReturnValue({ success: true, message: '' });
    fiche(liee);
    fireEvent.click(screen.getByText('Corriger une erreur de saisie'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer cette écriture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le retrait' }));
    await waitFor(() => expect(screen.getByText(/Un avoir est lié à cette pièce/)).toBeTruthy());
    expect(revert).not.toHaveBeenCalled();
  });
  it('une opération à payer liée au stock : le refus de l’annulation (stock consommé) remonte tel quel, la pièce reste', async () => {
    const stock = piece('T-4', 2000, { stockImpact: [{ itemRef: 'S-X', itemName: 'ZZ Malt', addedQty: 5, unit: 'kg' }] as never });
    vi.spyOn(StorageService, 'getTransactions').mockReturnValue([stock]);
    const revert = vi.spyOn(StorageService, 'revertTransaction').mockReturnValue({ success: false, message: 'Le stock de cet achat a été consommé ou corrigé. Vérifie l’inventaire avant d’annuler ; aucune quantité ne sera effacée.' });
    fiche(stock);
    fireEvent.click(screen.getByText('Corriger une erreur de saisie'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer cette écriture' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le retrait' }));
    await waitFor(() => expect(screen.getByText(/Le stock de cet achat a été consommé/)).toBeTruthy());
    expect(revert).toHaveBeenCalledWith('T-4');
  });
  it('une opération payée garde « Retirer cette écriture » (inversion du paiement puis annulation) : rien ne change pour elle', () => {
    const payee = piece('T-5', 1500, {}, { paymentStatus: 'paid' });
    fiche(payee, {}, [{ id: 'P1', transactionId: 'T-5', date: '2026-11-19', amountCents: 1500, direction: 'out', method: 'bank', recordedAt: '2026-11-19T08:00:00Z' }]);
    fireEvent.click(screen.getByText('Corriger une erreur de saisie'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer cette écriture' }));
    expect(within(document.body).getByText(/Son paiement de .* est d’abord inversé/)).toBeTruthy();
  });
});
