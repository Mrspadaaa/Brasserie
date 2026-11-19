// @vitest-environment jsdom
/**
 * Voie f1, reprise 2 (carnet tour 3) : T3-6, T3-7, E1-2, BE-23, BE-27. Lectures et écritures simulées (Gemini, Drive et Firestore jamais appelés).
 */
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const state = vi.hoisted(() => ({ saved: vi.fn(), scanned: vi.fn(), confirmed: vi.fn(), watched: vi.fn(), transactions: [] as any[] }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => state.transactions, confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: (error: any) => error?.status === 'rejected' }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(),
  savePurchaseWithProofReceipt: async (draft: any) => { await state.saved(draft); return { transactionId: `TX-${draft.submissionId}` }; },
  confirmPurchase: () => state.confirmed(), watchPurchaseConfirmation: (d: any) => state.watched(d), purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.transactions = [];
  for (const m of [state.saved, state.scanned, state.confirmed, state.watched]) m.mockReset();
  state.confirmed.mockResolvedValue(undefined);
  state.scanned.mockResolvedValue({ ok: false, error: 'Lecture indisponible. Saisie manuelle possible.' });
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token');
  vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});

const tape = (label: string, value: string) => { const el = screen.getByLabelText(label); fireEvent.change(el, { target: { value } }); fireEvent.blur(el); };
const unite = (n: number, mot: string) => fireEvent.click(screen.getByRole('group', { name: `Unité à remplir, ligne ${n}` }).querySelector(`[data-val="${mot}"]`)!);

describe('E1-2 : saisie à la main, « pièce » choisie sur les trois lignes', () => {
  it('chaque ligne enregistrée porte l’unité pièce', async () => {
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    tape('Total TTC en CHF', '86.5');
    fireEvent.change(screen.getByLabelText('Pour quoi ?'), { target: { value: 'ZZ TEST — e1 dépense' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ligne' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ligne' }));
    tape('Libellé ligne 2', 'ZZ TEST — l2');
    tape('Libellé ligne 3', 'ZZ TEST — l3');
    for (const n of [1, 2, 3]) unite(n, 'pièce');
    tape('Montant ligne 1', '50');
    tape('Montant ligne 2', '34.1');
    tape('Montant ligne 3', '2.4');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la dépense' }));
    await waitFor(() => expect(state.saved).toHaveBeenCalledOnce());
    const lines = state.saved.mock.calls[0][0].lines.map((l: any) => [l.description, l.quantity, l.unit]);
    expect(lines).toEqual([['ZZ TEST — e1 dépense', 1, 'pièce'], ['ZZ TEST — l2', 1, 'pièce'], ['ZZ TEST — l3', 1, 'pièce']]);
  });
  it('ligne par ligne (unité, montant, puis « Ajouter une ligne ») : les lignes déjà faites gardent leur unité', async () => {
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    tape('Total TTC en CHF', '86.5');
    fireEvent.change(screen.getByLabelText('Pour quoi ?'), { target: { value: 'ZZ TEST — e1 dépense' } });
    fireEvent.click(view.container.querySelector('[data-purchase-lines] > summary')!);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ligne' }));
    unite(1, 'pièce'); tape('Montant ligne 1', '50');
    tape('Libellé ligne 2', 'ZZ TEST — l2'); unite(2, 'pièce'); tape('Montant ligne 2', '34.1');
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ligne' }));
    tape('Libellé ligne 3', 'ZZ TEST — l3'); unite(3, 'pièce'); tape('Montant ligne 3', '2.4');
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la dépense' }));
    await waitFor(() => expect(state.saved).toHaveBeenCalledOnce());
    const lines = state.saved.mock.calls[0][0].lines.map((l: any) => [l.description, l.quantity, l.unit]);
    expect(lines).toEqual([['ZZ TEST — e1 dépense', 1, 'pièce'], ['ZZ TEST — l2', 1, 'pièce'], ['ZZ TEST — l3', 1, 'pièce']]);
  });
});

describe('T3-6 : la relecture du serveur tarde, la dépense est déjà listée', () => {
  const remplir = () => {
    tape('Total TTC en CHF', '1');
    fireEvent.change(screen.getByLabelText('Pour quoi ?'), { target: { value: 'ZZ TEST — t3-6' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la dépense' }));
  };
  it('la feuille se ferme, sans « Vérifier la synchronisation », et l’accusé est attendu hors d’elle', async () => {
    state.saved.mockImplementation(async (draft: any) => { state.transactions.push({ id: `TX-${draft.submissionId}` }); });
    state.confirmed.mockRejectedValueOnce({ status: 'pending', message: 'Confirmation de cette écriture en attente. Le brouillon est conservé ; vérifie la synchronisation sans la recréer.' });
    const onSaved = vi.fn(), onClose = vi.fn();
    render(<ExpenseSheet onClose={onClose} onSaved={onSaved}/>);
    remplir();
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
    expect(onSaved).toHaveBeenCalledOnce();
    expect(state.watched).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Confirmation de cette écriture en attente/)).toBeNull();
  });
  it('témoin : un refus certain garde la feuille et le brouillon', async () => {
    state.saved.mockImplementation(async (draft: any) => { state.transactions.push({ id: `TX-${draft.submissionId}` }); });
    state.confirmed.mockRejectedValueOnce({ status: 'rejected', message: 'Enregistrement refusé.' });
    const onClose = vi.fn();
    render(<ExpenseSheet onClose={onClose} onSaved={() => {}}/>);
    remplir();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Enregistrement refusé'));
    expect(onClose).not.toHaveBeenCalled();
    expect(state.watched).not.toHaveBeenCalled();
  });
});

import { BoutonMois } from '../../../src/ui/finance/ongletMois/OngletMois';
describe('T3-7 : la pastille « Mon mois » dit le sens de l’argent', () => {
  const effet = (principal: 'depense' | 'entre' | 'materiel', cents: number) => ({ ecart: { principal, principalCents: cents } }) as any;
  it('une dépense de 1,00 dit « −1,00 », jamais « +1,00 »', () => {
    const v = render(<BoutonMois effet={effet('depense', 100)} variante="depense" ouvert={false} onBascule={() => {}}/>);
    expect(v.container.querySelector('em')!.textContent).toBe('−1,00');
    expect(screen.getByRole('button')).toHaveAccessibleName('Mon mois, −1,00 CHF');
  });
  it('du matériel à part aussi ; une vente reste « + »', () => {
    const m = render(<BoutonMois effet={effet('materiel', 25000)} variante="depense" ouvert={false} onBascule={() => {}}/>);
    expect(m.container.querySelector('em')!.textContent).toMatch(/^−250,00$/);
    cleanup();
    const c = render(<BoutonMois effet={effet('entre', 1250)} variante="caisse" ouvert={false} onBascule={() => {}}/>);
    expect(c.container.querySelector('em')!.textContent).toBe('+12,50');
  });
});

describe('BE-23 : « Stk » n’est pas un mot de l’écran', () => {
  it('une ligne au stock sans unité propose g, kg ou pièce, et l’écrit « pièce »', async () => {
    render(<ExpenseSheet initialIntent="equipment" onClose={() => {}} onSaved={() => {}}/>);
    tape('Total TTC en CHF', '20');
    fireEvent.change(screen.getByLabelText('Pour quoi ?'), { target: { value: 'ZZ TEST — matériel' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une ligne' }));
    tape('Libellé ligne 2', 'ZZ TEST — joint');
    fireEvent.click(within(screen.getByRole('group', { name: 'Type d’achat, ligne 2' })).getAllByRole('button')[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au stock, ligne 2' }));
    fireEvent.click(within(screen.getByRole('group', { name: 'Quantité en un toucher, ligne 2' })).getByRole('button', { name: 'ajouter 5' }));
    const mots = screen.getAllByRole('button').map(b => b.textContent?.trim());
    expect(mots).not.toContain('Stk');
    expect(document.body.textContent).not.toMatch(/\bStk\b/);
  });
});
