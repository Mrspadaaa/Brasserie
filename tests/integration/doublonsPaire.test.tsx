import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { TransactionJournal } from '../../src/ui/finance/TransactionJournal';
import { TransactionRow } from '../../src/ui/finance/TransactionRow';
import { DELAI_RETABLIR_MS } from '../../src/ui/finance/operations/doublons';
import { FinanceService } from '../../src/services/financeService';
import { StorageService } from '../../src/services/storage';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

/**
 * m1do-a (choix du brasseur, 15.11) : la paire de doublons dans la liste. Un avis (×n), un cadre par groupe (« Même facture · n° … »), les lignes
 * complètes de la liste avec « Annuler celle-ci », « saisies le … », « Ce n’est pas un doublon ». « Annuler celle-ci » barre la ligne (« annulée le … »,
 * « Rétablir ») ; l'écriture (contre-paiement CONTRE-<id> puis annulation de l'écriture) part après 8 s : les règles Firestore interdisent de modifier une
 * écriture annulée, donc « Rétablir » n'existe que dans ce délai. Services simulés : rien n'est écrit.
 */
const today = todayISO();
const facture = (id: string, recu: string): Transaction => ({
  id, description: `Atelier du Houblon · F-${id}`, date: today, category: 'brassage', subcategory: '', amountHT: 94.5, amountTTC: 94.5, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents: 9450, paymentStatus: 'paid', recordedAt: recu, vendor: 'Atelier du Houblon', invoiceNumber: 'F-2024-117', lines: [] },
});
const A = facture('DBL-A', `${today.slice(0, 4)}-01-14T09:00:00Z`);
const B = facture('DBL-B', `${today.slice(0, 4)}-01-15T10:00:00Z`);
const autre: Transaction = { ...facture('SEUL', `${today}T08:00:00Z`), description: 'Autre achat', finance: { ...facture('SEUL', '').finance!, invoiceNumber: 'X-1', vendor: 'Autre fournisseur', recordedAt: `${today}T08:00:00Z` } };
const paiement = (t: Transaction): FinancialPayment => ({ id: `PAY-${t.id}`, transactionId: t.id, date: t.date, amountCents: 9450, direction: 'out', method: 'bank', recordedAt: `${today}T09:00:00Z` });
const toutes = [A, B, autre];
const paiements = toutes.map(paiement);

let recordPayment: ReturnType<typeof vi.spyOn>;
let revertTransaction: ReturnType<typeof vi.spyOn>;
const ordre: string[] = [];

const Journal = () => <TransactionJournal transactions={toutes} payments={paiements} archives={[]} onManageArchives={() => {}} onPrivateMovement={() => {}}
  renderRow={(t, p) => <TransactionRow key={t.id} transaction={t} transactions={toutes} payments={paiements} state={p} onOpen={() => {}}/>}/>;
const ouvrirPaire = () => { render(<Journal/>); fireEvent.click(screen.getByRole('button', { name: /^Doublons/ })); };

beforeEach(() => {
  window.localStorage.removeItem('laffinee.doublons-ecartes');
  ordre.length = 0;
  vi.spyOn(FinanceService, 'getPayments').mockReturnValue(paiements);
  recordPayment = vi.spyOn(FinanceService, 'recordPayment').mockImplementation((p: FinancialPayment) => { ordre.push(`paiement:${p.id}`); });
  revertTransaction = vi.spyOn(StorageService, 'revertTransaction').mockImplementation((id: string) => { ordre.push(`annule:${id}`); return { success: true, message: 'ok' }; });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); window.localStorage.removeItem('laffinee.doublons-ecartes'); });

describe('m1do-a : la paire de doublons', () => {
  it('l’avis (×2), le cadre « Même facture · n° F-2024-117 », les deux lignes complètes, « saisies le 14 et le 15 janv. », la pièce seule hors de la paire', () => {
    ouvrirPaire();
    const vue = screen.getByTestId('journal-duplicates');
    expect(vue).toHaveTextContent('×2');
    expect(vue).toHaveTextContent('2 pièces peut-être en double');
    expect(vue).toHaveTextContent('Rien n’est supprimé');
    const cadre = within(vue).getByRole('region', { name: /Même facture, n° F-2024-117 · 2 écritures/ });
    expect(within(cadre).getAllByRole('button', { name: 'Annuler cette pièce en double' })).toHaveLength(2);
    expect(within(cadre).getByRole('button', { name: /^Atelier du Houblon · F-DBL-A/ })).toBeInTheDocument(); // la ligne complète de la liste
    expect(cadre).toHaveTextContent(/saisies le 14 et le 15 janv\./);
    expect(within(cadre).getByRole('button', { name: 'Ce n’est pas un doublon' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Autre achat/ })).not.toBeInTheDocument(); // le filtre ne montre que la paire
    // m1do-a : la bande du mois reste (la paire s'ajoute à la liste, elle ne la remplace pas).
    expect(screen.getByRole('button', { name: /^Doublons/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('« Annuler celle-ci » barre la ligne (« annulée le … ») et propose « Rétablir » ; rien n’est écrit tant que le délai court ; « Rétablir » la rend', () => {
    vi.useFakeTimers();
    ouvrirPaire();
    fireEvent.click(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })[0]);
    expect(screen.getByRole('button', { name: 'Rétablir cette pièce' })).toHaveTextContent('Rétablir');
    expect(screen.getByTestId('journal-duplicates')).toHaveTextContent(/annulée le /);
    expect(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })).toHaveLength(1);
    act(() => { vi.advanceTimersByTime(DELAI_RETABLIR_MS - 1000); });
    expect(recordPayment).not.toHaveBeenCalled();
    expect(revertTransaction).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Rétablir cette pièce' }));
    expect(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })).toHaveLength(2);
    expect(screen.getByTestId('journal-duplicates')).not.toHaveTextContent(/annulée le /);
    act(() => { vi.advanceTimersByTime(DELAI_RETABLIR_MS * 2); });
    expect(recordPayment).not.toHaveBeenCalled();
    expect(revertTransaction).not.toHaveBeenCalled();
  });

  it('après 8 s : le contre-paiement CONTRE-<id> du paiement actif, PUIS l’annulation de l’écriture (un lot par étape), une seule fois', async () => {
    vi.useFakeTimers();
    ouvrirPaire();
    fireEvent.click(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })[1]);
    await act(async () => { await vi.advanceTimersByTimeAsync(DELAI_RETABLIR_MS + 50); });
    expect(recordPayment).toHaveBeenCalledTimes(1);
    const contre = recordPayment.mock.calls[0][0] as FinancialPayment;
    expect(contre).toMatchObject({ id: 'CONTRE-PAY-DBL-B', reversalOfId: 'PAY-DBL-B', transactionId: 'DBL-B', amountCents: 9450, direction: 'in' });
    expect(revertTransaction).toHaveBeenCalledTimes(1);
    expect(revertTransaction).toHaveBeenCalledWith('DBL-B');
    expect(ordre).toEqual(['paiement:CONTRE-PAY-DBL-B', 'annule:DBL-B']);
    await act(async () => { await vi.advanceTimersByTimeAsync(DELAI_RETABLIR_MS * 3); });
    expect(revertTransaction).toHaveBeenCalledTimes(1);
  });

  it('un refus (stock consommé, avoir lié…) remet la ligne, dit pourquoi et ne laisse pas croire que c’est annulé', async () => {
    vi.useFakeTimers();
    revertTransaction.mockImplementation(() => ({ success: false, message: 'Le stock de cette écriture est déjà consommé.' }));
    ouvrirPaire();
    fireEvent.click(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })[0]);
    await act(async () => { await vi.advanceTimersByTimeAsync(DELAI_RETABLIR_MS + 50); });
    expect(screen.getByRole('alert')).toHaveTextContent(/stock de cette écriture est déjà consommé/);
    expect(screen.getByRole('alert')).toHaveTextContent(/Déjà écrit : paiement inversé/);
    expect(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: 'Rétablir cette pièce' })).not.toBeInTheDocument();
  });

  it('quitter l’écran pendant le délai écrit l’annulation tout de suite (rien n’est perdu)', async () => {
    vi.useFakeTimers();
    const { unmount } = render(<Journal/>);
    fireEvent.click(screen.getByRole('button', { name: /^Doublons/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Annuler cette pièce en double' })[0]);
    expect(revertTransaction).not.toHaveBeenCalled();
    unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(revertTransaction).toHaveBeenCalledWith('DBL-A');
  });

  it('« Ce n’est pas un doublon » écarte le groupe, ferme la vue (le filtre se referme), sans rien écrire', () => {
    ouvrirPaire();
    fireEvent.click(screen.getByRole('button', { name: 'Ce n’est pas un doublon' }));
    expect(screen.queryByTestId('journal-duplicates')).toBeNull();
    expect(screen.getByRole('button', { name: /^Doublons/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /^Autre achat/ })).toBeInTheDocument(); // la liste entière revient
    expect(JSON.parse(window.localStorage.getItem('laffinee.doublons-ecartes') ?? '[]')).toEqual(['facture|atelier du houblon|f2024117']);
    expect(recordPayment).not.toHaveBeenCalled();
    expect(revertTransaction).not.toHaveBeenCalled();
  });
});
