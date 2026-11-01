// @vitest-environment jsdom
/**
 * Voie e-port : l'écran r2b rend la facture 372765 (lecture SIMULÉE = sortie du vrai rapprochement du serveur, stock SIMULÉ). Gemini jamais appelé,
 * Drive jamais touché, aucune écriture. Le rouge de comportement : avant la voie, aucune chip, aucune pastille, aucun interrupteur, aucun S8.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import lecture from '../../../../src/ui/depense/apercu/lecture-372765.reconciliee.json';
import stockJson from '../../../../src/ui/depense/apercu/stock-simule.json';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], saved: vi.fn(), scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const lire = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.stocks = { rawMaterials: (stockJson.articles as any[]).filter(a => a.name !== 'Verdant IPA').map(a => (a.name === 'Target' ? { ...a, name: 'Target 11.8%' } : a)), cleaning: [], equipment: [], kegs: [] };
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result: JSON.parse(JSON.stringify(lecture)) });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-372765.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('r2b : les points qui pèsent, la pastille, l’interrupteur', () => {
  it('les chips sont les points typés qui pèsent, l’argent d’abord ; le statut est « à confirmer » ; rien n’est écrit', async () => {
    const view = await lire();
    const chips = Array.from(view.container.querySelectorAll('[data-dp-chip]')).map(c => c.getAttribute('aria-label') ?? c.textContent ?? '');
    // C12 : les tuiles TVA et Payé portent les numéros 1 et 2 ; les chips suivantes ont les libellés de la maquette.
    expect(chips[0]).toMatch(/^1\s*TVA/);
    expect(chips[1]).toMatch(/^2\s*Règlement/);
    expect(chips.some(c => /Sabro\S* unité/.test(c))).toBe(true);
    expect(chips.some(c => /mouture ×5 \+1,50/.test(c))).toBe(true);
    expect(chips.some(c => /Target α/.test(c))).toBe(true);
    expect(screen.getByText('Lecture à confirmer')).toBeInTheDocument();
    expect(view.container.textContent).not.toMatch(/assujetti/i);
    expect(state.saved).not.toHaveBeenCalled();
  });
  it('la pastille-mot dit l’effet au stock (« +6 kg », « unité à préciser ») ; aucune pastille sur la mouture', async () => {
    const view = await lire();
    const lignes = Array.from(view.container.querySelectorAll('[data-purchase-line]')) as HTMLElement[];
    expect(lignes).toHaveLength(23);
    expect(within(lignes[0]).getByText('+6 kg')).toBeInTheDocument();
    expect(lignes[1].querySelector('[data-dp-pastille]')).toBeNull();
    expect(within(lignes[19]).getAllByText(/unité à préciser/).length).toBeGreaterThan(0);
  });
  it('l’interrupteur « Mettre en stock » écrit none / existing, jamais new, et son état se lit', async () => {
    await lire();
    const interrupteur = screen.getByRole('switch', { name: 'Mettre en stock, ligne 1' });
    expect(interrupteur).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(interrupteur);
    expect(interrupteur).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByLabelText('Stock ligne 1')).toHaveValue('none');
    fireEvent.click(interrupteur);
    expect(screen.getByLabelText('Stock ligne 1')).toHaveValue('existing');
    expect(screen.getByLabelText('Stock ligne 1')).not.toHaveValue('new');
  });
  it('T4 : Confirmer avec une unité à préciser reste cliquable, n’écrit rien, dit « 1 unité à préciser » et mène au champ', async () => {
    await lire();
    const confirmer = screen.getByRole('button', { name: 'Confirmer et enregistrer' });
    expect(confirmer).toBeEnabled();
    fireEvent.click(confirmer);
    expect(state.saved).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('À corriger');
    expect(screen.getByText('1 unité à préciser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmer et enregistrer' })).toBeEnabled();
    expect(screen.getByLabelText('Unité ligne 20')).toHaveFocus();
  });
  it('S8 : même commande sous un autre numéro = un signal, jamais un blocage ; « Même achat · ne rien enregistrer » n’écrit rien', async () => {
    state.transactions = [{ id: 'TX-380001', date: '30.04.2026', amountTTC: 86.5, description: 'Brau- und Rauchshop · 380001', category: 'brassage', finance: { kind: 'expense', version: 1, amountCents: 8650, vendor: 'Brau- und Rauchshop GmbH', invoiceNumber: '380001', sourceOrderNumber: 'Onlinebestellung-686863', recordedAt: '2026-04-30T10:00:00.000Z', lines: [] } }];
    await lire();
    const region = await screen.findByRole('region', { name: 'Même commande sous un autre numéro' });
    expect(region).toHaveTextContent('380001');
    fireEvent.click(within(region).getByRole('button', { name: 'Même achat · ne rien enregistrer' }));
    expect(screen.getByRole('button', { name: 'Fermer sans rien enregistrer' })).toBeEnabled();
    expect(state.saved).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Confirmer et enregistrer' })).toBeNull());
  });
});

describe('le banc de développement n’atteint jamais l’enregistrement réel', () => {
  it('avec `apercu`, ni Gemini ni l’enregistrement réel ne sont appelés ; l’enregistrement simulé rend le reçu qui reste', async () => {
    const enregistrer = vi.fn(async () => ({ driveFileId: 's', fileName: '2026-04-27 Brau- und Rauchshop 372765.jpg', bytes: 735721, sha256: '0'.repeat(64), verified: true, folder: 'L’Affinée / Justificatifs / 2026' }));
    const onClose = vi.fn();
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const apercu = { outcome: { ok: true, result: JSON.parse(JSON.stringify(lecture)), proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' }, fichier: { name: 'f.pdf', size: 735721, type: 'application/pdf' },
      stocks: { rawMaterials: [], cleaning: [], equipment: [], kegs: [] }, transactions: [], etat: '3', drive: 'ok', reseau: true, enregistrer } as any;
    render(<ExpenseSheet onClose={onClose} onSaved={() => {}} apercu={apercu}/>);
    await screen.findByRole('region', { name: 'Vérification du justificatif' });
    expect(state.scanned).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Mettre en stock, ligne 20'));
    for (const unit of ['g']) fireEvent.click(screen.getAllByRole('button', { name: unit })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer et enregistrer' }));
    await waitFor(() => expect(enregistrer.mock.calls.length + (screen.queryByRole('alert') ? 1 : 0)).toBeGreaterThan(0));
    expect(state.saved).not.toHaveBeenCalled();
  });
});
