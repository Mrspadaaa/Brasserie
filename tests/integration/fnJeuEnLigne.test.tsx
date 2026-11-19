// @vitest-environment jsdom
/**
 * Voie s4 : correctifs du jeu en ligne du 15.11 (FN-3 à FN-12). Fiche rendue sur des pièces ZZ TEST ; plans et étiquettes en fonctions pures ;
 * Modifier sur les vrais services en `?dev-local`.
 */
import React, { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<typeof import('../../src/services/financeDocuments')>()), saveFinanceDocumentConfirmed: vi.fn(async () => undefined) }));
import { TransactionDetails } from '../../src/ui/finance/TransactionDetails';
import { EditTransactionModal } from '../../src/components/EditTransactionModal';
import { StorageService } from '../../src/services/storage';
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { FinanceService } from '../../src/services/financeService';
import { couleursPieces, etiquettesPieces } from '../../src/ui/finance/payer/etiquettes';
import { avoirDeTropPaye, effetCorrection, planCorrection } from '../../src/domain/finance/correctionMontant';
import type { Transaction } from '../../src/types';
import type { FinancialPayment } from '../../src/domain/finance/types';

const piece = (id: string, cents: number, extra: Partial<Transaction> = {}, finance: any = {}): Transaction => ({
  id, date: '2026-11-10', description: 'ZZ TEST — pièce A', category: 'divers', subcategory: '', amountHT: cents / 100, tvaRate: 0, tvaAmount: 0, amountTTC: cents / 100, proofNotes: '',
  finance: { version: 1, kind: 'expense', amountCents: cents, lines: [], paymentStatus: 'unpaid', ...finance }, ...extra
});
const pay = (id: string, transactionId: string, cents: number, extra: Partial<FinancialPayment> = {}): FinancialPayment =>
  ({ id, transactionId, date: '2026-11-12', amountCents: cents, direction: 'out', method: 'bank', recordedAt: '2026-11-12T08:00:00.000Z', ...extra });
const fiche = (tx: Transaction, payments: FinancialPayment[] = []) => render(createElement(TransactionDetails, {
  transaction: tx, transactions: [tx], payments, plans: [], onClose: vi.fn(), onEdit: vi.fn(), onPay: vi.fn(), onRefund: vi.fn() }));

afterEach(cleanup);

describe('FN-3, FN-4 : une couleur et un nom court par pièce', () => {
  it('deux pièces au même début de nom se distinguent par ce qui les sépare, pas par « zz »', () => {
    expect(etiquettesPieces(['ZZ TEST — pièce A', 'ZZ TEST — pièce B'])).toEqual(['pièce A', 'pièce B']);
  });
  it('des premiers mots distincts restent le premier mot en minuscules (maquette m5pa-d : « loyer »)', () => {
    expect(etiquettesPieces(['Loyer de l’atelier', 'Solde atelier · ancienne année'])).toEqual(['loyer', 'solde']);
  });
  it('deux noms identiques reçoivent un rang', () => {
    expect(etiquettesPieces(['Loyer', 'Loyer'])).toEqual(['Loyer 1', 'Loyer 2']);
  });
  it('la même teinte de catégorie est variée pour la deuxième pièce ; une teinte différente reste telle quelle', () => {
    const c = couleursPieces(['gris', 'gris', 'violet']);
    expect(c[0]).toBe('gris');
    expect(c[1]).not.toBe('gris');
    expect(c[1]).toContain('color-mix');
    expect(c[2]).toBe('violet');
    expect(new Set(c).size).toBe(3);
  });
});

describe('FN-10 : le plan « j’ai bien payé »', () => {
  const p = piece('T-1', 1000);
  const paiements = [pay('PAI-1', 'T-1', 1000)];
  it('sous le payé, « avoir » ajoute un avoir à recevoir de l’excédent après le paiement au nouveau montant', () => {
    const plan = planCorrection(p, paiements, 900, 'avoir');
    expect(plan).toEqual([
      { type: 'contre', paiementId: 'PAI-1' },
      { type: 'montant', cents: 900 },
      { type: 'paiement', cents: 900, direction: 'out', method: 'bank', date: '2026-11-12' },
      { type: 'avoir', cents: 100, direction: 'in' }
    ]);
    expect(effetCorrection(p, paiements, plan)).toMatchObject({ montantCents: 900, payeCents: 900, resteCents: 0, avoirCents: 100 });
  });
  it('« suit » (erreur de saisie) n’écrit aucun avoir', () => {
    expect(planCorrection(p, paiements, 900, 'suit').some(e => e.type === 'avoir')).toBe(false);
  });
  it('l’avoir est un refund lié à la pièce, à recevoir, non encaissé', () => {
    const corrigee = piece('T-1', 900, {}, { vendor: 'ZZ TEST — Fournisseur' });
    const a = avoirDeTropPaye(corrigee, { type: 'avoir', cents: 100, direction: 'in' }, { aujourdhui: '2026-11-15', maintenant: '2026-11-15T09:00:00.000Z' }, 'MOUV-1');
    expect(a.finance).toMatchObject({ kind: 'refund', refundOfId: 'T-1', refundDirection: 'in', refundApplication: 'cash', amountCents: 100, paymentStatus: 'unpaid', vendor: 'ZZ TEST — Fournisseur' });
    expect(a.amountTTC).toBe(1);
  });
});

describe('FN-12, FN-11 : un apport n’est jamais une créance', () => {
  const apport = piece('A-1', 100, { description: 'ZZ TEST — apport', category: 'apports' }, { kind: 'contribution' });
  it('hausse : le paiement suit même quand « reste à payer » est demandé', () => {
    const plan = planCorrection(apport, [pay('PAI-A', 'A-1', 100, { direction: 'in' })], 300, 'reste');
    expect(plan).toEqual([{ type: 'montant', cents: 300 }, { type: 'paiement', cents: 200, direction: 'in', method: 'bank' }]);
  });
  it('baisse sous le payé : jamais d’avoir sur un apport', () => {
    const plan = planCorrection(apport, [pay('PAI-A', 'A-1', 100, { direction: 'in' })], 50, 'avoir');
    expect(plan.some(e => e.type === 'avoir')).toBe(false);
  });
  it('sa fiche : ni « Noter un encaissement », ni « Échéance et prévision », ni « À encaisser », ni correction d’un paiement isolé', () => {
    fiche(apport, [pay('PAI-A', 'A-1', 100, { direction: 'in' }), pay('CONTRE-PAI-A', 'A-1', 100, { direction: 'out', reversalOfId: 'PAI-A' })]);
    expect(screen.queryByText('Noter un encaissement')).toBeNull();
    expect(screen.queryByText('Noter un paiement')).toBeNull();
    expect(screen.queryByText('Échéance et prévision')).toBeNull();
    expect(document.body.textContent).not.toMatch(/À encaisser/);
    expect(screen.getByText(/Apport : aucun paiement noté/)).toBeInTheDocument();
  });
  it('une dépense à payer garde « Confirmer le paiement » et son échéance', () => {
    fiche(piece('T-2', 1500, {}, { dueDate: '2026-11-16' }));
    expect(screen.getByText('Confirmer le paiement')).toBeInTheDocument();
    expect(screen.getByText('Échéance et prévision')).toBeInTheDocument();
  });
});

describe('FN-6, FN-7 : les paiements de la fiche', () => {
  it('une paire paiement / contre-paiement se replie en une ligne « corrigé », détail à un toucher', () => {
    const tx = piece('T-3', 900, {}, { paymentStatus: 'paid' });
    fiche(tx, [pay('PAI-1', 'T-3', 1000), pay('CONTRE-PAI-1', 'T-3', 1000, { direction: 'in', reversalOfId: 'PAI-1' }), pay('PAI-2', 'T-3', 900, { note: 'Paiement après correction du montant de la pièce' })]);
    const resumes = document.querySelectorAll('.fiche-hist-corr > summary');
    expect(resumes).toHaveLength(1);
    expect(resumes[0].textContent).toMatch(/corrigé/);
    expect(document.querySelectorAll('.fiche-hist-corr > div')).toHaveLength(2); // les deux écritures, repliées
    expect(document.querySelectorAll('.fiche-hist')).toHaveLength(2); // la paire repliée + le paiement de 9,00
    expect(document.querySelectorAll('.fiche-hist-corr > div')[1].textContent).toMatch(/correction/); // la contre-écriture n'est lisible que dans le détail
    fireEvent.click(resumes[0]);
  });
  it('un paiement issu d’un virement dit « virement de 12,00 · 2 pièces »', () => {
    const tx = piece('T-4', 1500, {}, { paymentStatus: 'partial' });
    fiche(tx, [pay('PAI-V', 'T-4', 200, { note: 'Virement de CHF 12.00 réparti sur 2 pièces' })]);
    expect(screen.getByText(/virement de 12,00 · 2 pièces/)).toBeInTheDocument();
  });
});

describe('FN-5 : la pastille « Autres frais » se dessine', () => {
  it('le trait des trois points est arrondi : un point de longueur nulle devient visible', () => {
    fiche(piece('T-5', 1000));
    expect(document.querySelector('.fiche-sq svg')).toHaveAttribute('stroke-linecap', 'round');
  });
});

describe('FN-8, FN-9 : Modifier ne cache pas le fournisseur et ne remplit pas « Précision »', () => {
  const vivante = () => StorageService.getTransactions().find(t => t.id === 'T-6')!;
  const ouvrir = () => render(<EditTransactionModal isOpen transaction={vivante()} onClose={vi.fn()} onSave={vi.fn()} />);
  beforeEach(() => {
    window.history.replaceState({}, '', '/?dev-local');
    FirestoreRepo.startSync();
    StorageService.addTransaction(piece('T-6', 1000, {}, { vendor: 'ZZ TEST — Fournisseur', invoiceNumber: 'N-77' }));
  });
  afterEach(() => { FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

  it('le champ montre le fournisseur et le n° de la pièce', () => {
    ouvrir();
    expect(screen.getByLabelText(/Fournisseur, n° de pièce/)).toHaveValue('ZZ TEST — Fournisseur · N-77');
  });
  it('enregistré sans rien saisir : « Précision » reste vide, proofNotes reste vide, le fournisseur est intact', async () => {
    ouvrir();
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(StorageService.getTransactions().find(t => t.id === 'T-6')).toBeTruthy());
    await vi.waitFor(() => expect(vivante().subcategory).toBe(''));
    expect(vivante().proofNotes).toBe('');
    expect(vivante().finance?.vendor).toBe('ZZ TEST — Fournisseur');
    expect(vivante().finance?.invoiceNumber).toBe('N-77');
  });
  it('un fournisseur retapé met à jour le fournisseur et le n° de la pièce', async () => {
    ouvrir();
    fireEvent.change(screen.getByLabelText(/Fournisseur, n° de pièce/), { target: { value: 'ZZ TEST — Autre · N-78' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await vi.waitFor(() => expect(vivante().finance?.vendor).toBe('ZZ TEST — Autre'));
    expect(vivante().finance?.invoiceNumber).toBe('N-78');
    expect(vivante().proofNotes).toBe('');
  });
});
