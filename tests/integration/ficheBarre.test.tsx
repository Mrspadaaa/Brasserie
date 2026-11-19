// @vitest-environment jsdom
/**
 * Voie q3, m5fo-a : la fiche rangée avec la facture en barre. La barre est proportionnelle aux lignes (centimes), un segment ouvre l'article
 * de sa ligne, une pièce sans ligne n'a pas de barre, une pièce sans justificatif a son pointillé, et les actions actuelles restent atteignables.
 */
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';

vi.mock('../../src/services/storage', () => ({ StorageService: {
  getTransactions: () => [], isReady: () => false, revertTransaction: () => ({ success: true }), updateTransaction: vi.fn(),
  getStocks: () => ({ rawMaterials: [
    { ref: 'S-PILS', name: 'Pilsner', category: 'Malt' }, { ref: 'S-MUN', name: 'Munich', category: 'Malt' },
    { ref: 'S-CIT', name: 'Citra', category: 'Houblon' }, { ref: 'S-CAS', name: 'Cascade', category: 'Houblon' }], cleaning: [], equipment: [], kegs: [] }) } }));
vi.mock('../../src/services/financeService', () => ({ FinanceService: { recordPayment: vi.fn() } }));
vi.mock('../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false, FirestoreRepo: { subscribe: () => () => undefined } }));
vi.mock('../../src/services/financeDocuments', () => ({ prepareFinanceDocument: vi.fn(), saveFinanceDocumentConfirmed: vi.fn(), loadFinanceDocument: vi.fn() }));
vi.mock('../../src/services/purchaseEntry', () => ({ resendProof: vi.fn() }));
vi.mock('../../src/services/firebaseAuth', () => ({ FirebaseAuthService: { getCurrentUser: () => ({ uid: 'u1' }), ensureDriveAccessToken: async () => 'jeton', prepareGoogleLogin: async () => undefined, refreshDriveAccess: async () => ({ success: true }), hasDriveAccess: () => true } }));
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { colorerLignes, segmentsBarre, resumeLignes } from '../../src/ui/finance/fiche/barre';

const ligne = (id: string, description: string, amountCents: number, ref?: string, extra: any = {}) => ({ id, description, kind: 'ingredient', amountCents, quantity: 1, unit: 'kg', stockItemRef: ref, ...extra });
const LIGNES = [ligne('a', 'Malt Pilsner', 7250, 'S-PILS'), ligne('b', 'Malt Munich', 3840, 'S-MUN'), ligne('c', 'Houblon Citra', 4890, 'S-CIT'), ligne('d', 'Houblon Cascade', 2700, 'S-CAS')];
const facture = (finance: any = {}, extra: any = {}) => ({ id: 'TX-1', date: '2026-11-07', description: 'Malt et houblons · Pale Ale', category: 'brassage', amountHT: 186.8, tvaRate: 0, tvaAmount: 0, amountTTC: 186.8,
  finance: { version: 1, kind: 'expense', amountCents: 18680, vendor: 'Comptoir du brasseur', lines: LIGNES, paymentStatus: 'unpaid', ...finance }, ...extra });
const ouvre = (tx: any, props: any = {}, payments: any[] = []) => render(createElement(TransactionDetails, { transaction: tx, transactions: [tx], payments, plans: [], onClose: vi.fn(), onEdit: vi.fn(), onPay: vi.fn(), onRefund: vi.fn(), ...props }));
afterEach(cleanup);

describe('barre : calcul en centimes', () => {
  it('une part par ligne, la somme fait 100 % et les largeurs suivent les montants', () => {
    const s = segmentsBarre(colorerLignes(LIGNES as any));
    expect(s.map(x => x.widthPct)).toEqual([38.81, 20.56, 26.18, 14.45]);
    expect(s.map(x => x.leftPct)).toEqual([0, 38.81, 59.37, 85.55]);
    expect(s.reduce((t, x) => t + x.widthPct, 0)).toBeCloseTo(100, 5);
    expect(new Set(s.map(x => x.couleur)).size).toBe(4);
  });
  it('une remise (montant négatif) et une ligne à zéro ne prennent pas de place ; sans part positive, pas de segment', () => {
    const l = [ligne('x', 'Remise', -500), ligne('y', 'Port', 0)];
    expect(segmentsBarre(colorerLignes(l as any))).toEqual([]);
    expect(segmentsBarre(colorerLignes([...l, ligne('z', 'Malt', 1000)] as any)).map(x => x.id)).toEqual(['z']);
  });
  it('le résumé dit « au stock » seulement pour ce qui y mène', () => {
    expect(resumeLignes(LIGNES as any, 4)).toBe('4 lignes · au stock');
    expect(resumeLignes(LIGNES as any, 2)).toBe('4 lignes · 2 au stock');
    expect(resumeLignes(LIGNES as any, 0)).toBe('4 lignes');
  });
});

describe('fiche m5fo-a', () => {
  it('la barre a un segment par ligne, à la largeur de sa part ; un segment ouvre l’article du stock', () => {
    const onOpenStockItem = vi.fn();
    ouvre(facture(), { onOpenStockItem });
    const barre = screen.getByTestId('fiche-barre');
    const segs = [...barre.querySelectorAll<HTMLElement>('.fiche-fseg')];
    expect(segs.map(s => s.style.width)).toEqual(['38.81%', '20.56%', '26.18%', '14.45%']);
    fireEvent.click(within(barre).getByRole('button', { name: /Houblon Citra 48,90/ }));
    expect(onOpenStockItem).toHaveBeenCalledWith('S-CIT');
    fireEvent.click(screen.getByRole('button', { name: /Malt Pilsner · .* voir cet article dans les stocks/ }));
    expect(onOpenStockItem).toHaveBeenLastCalledWith('S-PILS');
    expect(screen.getByText('4 lignes · au stock')).toBeTruthy();
  });
  it('sans renvoi vers le stock, les segments ne sont pas des boutons mais se lisent', () => {
    ouvre(facture());
    const barre = screen.getByTestId('fiche-barre');
    expect(within(barre).queryAllByRole('button')).toHaveLength(0);
    expect(within(barre).getAllByRole('img')).toHaveLength(4);
  });
  it('une pièce sans ligne n’a pas de barre ni de « Dans la facture »', () => {
    ouvre(facture({ lines: [] }));
    expect(screen.queryByTestId('fiche-barre')).toBeNull();
    expect(screen.queryByText('Dans la facture')).toBeNull();
    expect(screen.getByText('Modifier')).toBeTruthy();
  });
  it('sans justificatif : le pointillé ; avec : « facture · nom » et le bouton du justificatif', () => {
    ouvre(facture());
    expect(document.querySelector('.fiche-pj-sans')?.textContent).toContain('Sans justificatif');
    cleanup();
    ouvre(facture({ proofDocumentId: 'p1' }, { proofFileName: 'comptoir-1187.pdf' }));
    expect(document.querySelector('.fiche-pj-sans')).toBeNull();
    expect(document.querySelector('.fiche-pj')?.textContent).toContain('facture · comptoir-1187.pdf');
    expect(screen.getByRole('button', { name: /Justificatif/ })).toBeTruthy();
  });
  it('les actions restent atteignables : Noter un paiement, Modifier, Avoir, recette, Échéance, Annuler l’écriture', () => {
    const p = { onPay: vi.fn(), onEdit: vi.fn(), onRefund: vi.fn(), onOpenRecipe: vi.fn() };
    ouvre(facture({}, {}), p);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' })); expect(p.onPay).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /^Modifier$/ })); expect(p.onEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Avoir ou remboursement/ })); expect(p.onRefund).toHaveBeenCalled();
    expect(screen.getByText('Échéance et prévision')).toBeTruthy();
    fireEvent.click(screen.getByText('Corriger une erreur de saisie'));
    expect(screen.getByRole('button', { name: 'Retirer cette écriture' })).toBeTruthy();
  });
  it('payée : l’état dit la date et le mode, plus de « Noter un paiement » ; le paiement se corrige par une contre-écriture', async () => {
    const { FinanceService } = await import('../../src/services/financeService');
    const pay = { id: 'P1', transactionId: 'TX-1', date: '2026-11-09', amountCents: 18680, direction: 'out', method: 'bank', recordedAt: '2026-11-09T10:00:00Z' };
    ouvre(facture({ paymentStatus: 'paid' }), {}, [pay]);
    expect(screen.getByText(/✓ payé .*banque/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Noter un paiement' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Corriger ce paiement saisi par erreur' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer la correction' }));
    expect(FinanceService.recordPayment).toHaveBeenCalledWith(expect.objectContaining({ id: 'CONTRE-P1', reversalOfId: 'P1', amountCents: 18680, direction: 'in' }));
  });
  it('un état à confirmer range sa confirmation sous « … »', () => {
    ouvre(facture({ paymentStatus: 'unknown' }));
    fireEvent.click(screen.getByLabelText('Plus d’actions'));
    expect(screen.getByRole('button', { name: /Confirmer que cette pièce reste à régler/ })).toBeTruthy();
  });
});
