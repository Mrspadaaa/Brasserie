import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, subtitle, children, footer }: any) => open ? <div role="dialog" aria-label={title}><p>{subtitle}</p>{children}{footer}</div> : null }));
vi.mock('../../src/services/financeDocuments', async importOriginal => ({ ...(await importOriginal<typeof import('../../src/services/financeDocuments')>()), saveFinanceDocumentConfirmed: vi.fn(async () => undefined) }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { saveFinanceDocumentConfirmed } from '../../src/services/financeDocuments';
import { PaymentSheet } from '../../src/ui/finance/FinanceForms';
import { paymentState, todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';
import { poserDate, zoneDate } from '../helpers/poserDate';

const tx = (id: string, description: string, vendor: string | undefined, amountCents: number, dueDate: string, patch: Partial<Transaction> = {}): Transaction => ({
  id, description, date: todayISO(), category: 'chargesFixes', subcategory: '', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents, paymentStatus: 'unpaid', dueDate, vendor, lines: [{ id: 'l', kind: 'ingredient', description, amountCents }] }, ...patch
});
const solde = () => tx('SOLDE', 'Solde atelier · ancienne année', 'Atelier', 6000, '2025-12-20');
const loyer = () => tx('LOYER', 'Loyer de l’atelier', 'Atelier', 40000, '2099-11-25');
const autre = () => tx('AUTRE', 'Malt Müller', 'Müller', 9000, '2025-11-01');
const ouvre = (ouverte: Transaction, onClose = () => {}) => render(<PaymentSheet transaction={ouverte} payments={FinanceService.getPayments()} transactions={StorageService.getTransactions()} onClose={onClose} />);
const montant = (v: string) => fireEvent.change(screen.getByLabelText('Montant du virement (CHF)'), { target: { value: v } });
const payer = () => fireEvent.click(screen.getByRole('button', { name: /^✓ Payer/ }));
const restant = (id: string) => paymentState(StorageService.getTransactions().find(t => t.id === id)!, FinanceService.getPayments(), StorageService.getTransactions()).remainingCents;

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); [solde(), loyer(), autre()].forEach(t => StorageService.addTransaction(t)); vi.mocked(saveFinanceDocumentConfirmed).mockClear(); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('Payer = m5pa-d : un virement, plusieurs pièces', () => {
  it('montre les deux pièces du même fournisseur, la plus ancienne d’abord, sans celle d’un autre', () => {
    ouvre(loyer());
    expect(screen.getByRole('dialog', { name: 'Payer l’Atelier' })).toBeVisible();
    expect(screen.getByText('2 pièces à payer au même fournisseur')).toBeVisible();
    const noms = screen.getAllByRole('checkbox').map(c => c.getAttribute('aria-label'));
    expect(noms).toEqual(['Inclure Solde atelier · ancienne année dans le virement', 'Inclure Loyer de l’atelier dans le virement']);
    expect(screen.queryByText('Malt Müller')).not.toBeInTheDocument();
    expect(screen.getByText('Le plus ancien d’abord')).toBeVisible();
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('460,00');
    expect(screen.getByText('sera joint aux 2 pièces')).toBeVisible();
  });
  it('300 sur 60 + 400 : solde le retard, puis le loyer reste en partie à payer ; un paiement par pièce, même date, même moyen', async () => {
    const fermer = vi.fn();
    ouvre(loyer(), fermer);
    montant('300');
    expect(screen.getByText('sera soldé')).toBeVisible(); // CT4-A-3 : « soldé » seulement après le paiement
    expect(screen.getByText('sur 400,00 · reste 160,00')).toBeVisible();
    expect(screen.getByRole('button', { name: /^✓ Payer 300,00/ })).toBeEnabled();
    payer();
    await waitFor(() => expect(fermer).toHaveBeenCalled());
    const ps = FinanceService.getPayments();
    expect(ps.map(p => [p.transactionId, p.amountCents]).sort()).toEqual([['LOYER', 24000], ['SOLDE', 6000]]);
    expect(new Set(ps.map(p => p.date)).size).toBe(1);
    expect(ps.every(p => p.method === 'bank' && p.direction === 'out' && p.date === todayISO() && !p.proofDocumentId)).toBe(true);
    expect(restant('SOLDE')).toBe(0);
    expect(restant('LOYER')).toBe(16000);
    expect(restant('AUTRE')).toBe(9000);
  });
  it('refuse un virement supérieur au total dû : le bouton reste éteint et rien n’est écrit', () => {
    ouvre(loyer());
    montant('460,01');
    expect(FinanceService.getPayments()).toHaveLength(0);
    montant('450');
    expect(screen.getByRole('button', { name: /^✓ Payer 450,00/ })).toBeEnabled();
    montant('');
    expect(screen.getByRole('alert')).toHaveTextContent(/Indique le montant du virement/);
    expect(screen.getByRole('button', { name: /^✓ Payer/ })).toBeDisabled();
    expect(FinanceService.getPayments()).toHaveLength(0);
  });
  it('q6 points 2 et 3 : au-delà du total, le champ est ramené au total ; champ, barre et bouton disent le même nombre ; le message est une ligne sous le champ', () => {
    ouvre(loyer());
    montant('700');
    const champ = screen.getByLabelText('Montant du virement (CHF)');
    expect(champ).toHaveValue('460,00');
    expect(screen.getByRole('button', { name: /^✓ Payer 460,00/ })).toBeEnabled();
    expect(screen.getByText('retard 60,00')).toBeVisible();
    const message = screen.getByRole('alert');
    expect(message).toHaveTextContent('Ramené à 460,00 CHF : c’est tout ce qui reste à payer.');
    expect(message.tagName).toBe('P');
    expect(champ.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(); // sous le champ, pas à sa droite
    expect(champ.parentElement).not.toContainElement(message);
  });
  it('q6 point 9 : décocher une pièce recale le montant au nouveau total quand il le dépassait', () => {
    ouvre(loyer());
    montant('300');
    expect(screen.getByRole('button', { name: /^✓ Payer 300,00/ })).toBeEnabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /Loyer/ }));
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('60,00');
    expect(screen.getByRole('button', { name: /^✓ Payer 60,00/ })).toBeEnabled();
    expect(screen.queryByRole('alert')).toBeNull();
  });
  it('q6 point 8 : le titre élide l’article devant une voyelle (« Payer l’Atelier ») et garde le nom tel quel sinon', () => {
    ouvre(loyer());
    expect(screen.getByRole('dialog', { name: 'Payer l’Atelier' })).toBeVisible();
    cleanup();
    ouvre(autre());
    expect(screen.getByRole('dialog', { name: 'Payer Müller' })).toBeVisible();
  });
  it('q6 point 7 : « autre » date vide, le bouton dit « Choisis la date » et ne paie rien ; la date posée, il redit le montant', () => {
    ouvre(autre());
    fireEvent.click(screen.getByRole('button', { name: 'autre', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Choisis la date' }));
    expect(FinanceService.getPayments()).toHaveLength(0);
    poserDate('Date réelle du paiement', '2026-01-05');
    expect(screen.getByRole('button', { name: /^✓ Payer 90,00/ })).toBeEnabled();
  });
  it('décocher une pièce l’exclut du virement', async () => {
    const fermer = vi.fn();
    ouvre(loyer(), fermer);
    fireEvent.click(screen.getByRole('checkbox', { name: /Solde atelier/ }));
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('400,00');
    payer();
    await waitFor(() => expect(fermer).toHaveBeenCalled());
    expect(FinanceService.getPayments().map(p => p.transactionId)).toEqual(['LOYER']);
    expect(restant('SOLDE')).toBe(6000);
  });
  it('une pièce seule : la même feuille, une seule rangée, sans case modifiable', async () => {
    const fermer = vi.fn();
    ouvre(autre(), fermer);
    expect(screen.getByText('Une pièce à payer')).toBeVisible();
    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
    expect(screen.getByRole('checkbox')).toBeDisabled();
    expect(screen.queryByText('Le plus ancien d’abord')).not.toBeInTheDocument();
    payer();
    await waitFor(() => expect(fermer).toHaveBeenCalled());
    expect(restant('AUTRE')).toBe(0);
  });
  it('« autre » date et « espèces » : le paiement porte la date et le moyen choisis', async () => {
    const fermer = vi.fn();
    ouvre(autre(), fermer);
    fireEvent.click(screen.getByRole('button', { name: 'autre', exact: true }));
    poserDate('Date réelle du paiement', '2026-01-05');
    fireEvent.click(screen.getByRole('button', { name: 'Autres moyens de paiement' }));
    fireEvent.click(screen.getByRole('button', { name: 'espèces' }));
    payer();
    await waitFor(() => expect(fermer).toHaveBeenCalled());
    expect(FinanceService.getPayments()[0]).toMatchObject({ date: '2026-01-05', method: 'cash', amountCents: 9000 });
  });
  it('un paiement historique inconnu demande la date réelle avant d’écrire', () => {
    StorageService.addTransaction(tx('HIST', 'Achat historique', undefined, 5000, todayISO(), { finance: undefined }));
    ouvre(StorageService.getTransactions().find(t => t.id === 'HIST')!);
    expect(screen.getByText(/paiement historique est inconnu/)).toBeVisible();
    expect(zoneDate('Date réelle du paiement').getAttribute('data-valeur')).toBeNull();
    expect(screen.getByRole('button', { name: 'Choisis la date' })).toHaveAttribute('aria-disabled', 'true'); // q6 point 7 : le bouton dit pourquoi
  });
  it('justificatif : un seul original rangé, lié aux deux paiements ; sans justificatif le paiement s’enregistre quand même', async () => {
    const fermer = vi.fn();
    ouvre(loyer(), fermer);
    const dessus = document.querySelector('input[aria-label="Choisir le fichier du justificatif du virement"]') as HTMLInputElement;
    fireEvent.change(dessus, { target: { files: [new File(['x'], 'preuve.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(screen.getByText('preuve.pdf')).toBeVisible());
    expect(screen.getByText('joint aux 2 pièces')).toBeVisible();
    payer();
    await waitFor(() => expect(fermer).toHaveBeenCalled());
    expect(saveFinanceDocumentConfirmed).toHaveBeenCalledTimes(1);
    const ps = FinanceService.getPayments();
    expect(ps).toHaveLength(2);
    expect(new Set(ps.map(p => p.proofDocumentId)).size).toBe(1);
    expect(ps[0].proofDocumentId).toMatch(/^proof-VIR-/);
    expect(ps.every(p => !!p.proofFileName)).toBe(true);
  });
  it('« Autre montant » (r3) : la feuille s’ouvre sur la bonne pièce ; Annuler n’écrit rien ; Payer inverse le paiement rapide PUIS écrit le nouveau, un lot par étape', async () => {
    const rapide = { id: 'PAI-RAPIDE', transactionId: 'LOYER', date: todayISO(), amountCents: 40000, direction: 'out' as const, method: 'bank' as const, recordedAt: new Date().toISOString() };
    FinanceService.recordPayment(rapide);
    expect(restant('LOYER')).toBe(0);
    const ordre: string[] = [];
    const reel = FinanceService.recordPayment.bind(FinanceService);
    vi.spyOn(FinanceService, 'recordPayment').mockImplementation(p => { ordre.push(p.id); reel(p); });
    const fermer = vi.fn();
    const rendu = () => render(<PaymentSheet transaction={StorageService.getTransactions().find(t => t.id === 'LOYER')!} payments={FinanceService.getPayments()} transactions={StorageService.getTransactions()} remplace={rapide} onClose={fermer} />);
    rendu();
    expect(screen.getByRole('dialog', { name: 'Payer l’Atelier' })).toBeVisible();
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('400,00');
    const cases = screen.getAllByRole('checkbox');
    expect(cases.map(c => c.getAttribute('aria-checked'))).toEqual(['false', 'true']);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(fermer).toHaveBeenCalledTimes(1);
    expect(ordre).toEqual([]);
    expect(FinanceService.getPayments()).toHaveLength(1);
    cleanup();
    rendu();
    montant('250');
    payer();
    await waitFor(() => expect(fermer).toHaveBeenCalledTimes(2));
    expect(ordre).toHaveLength(2);
    expect(ordre[0]).toBe('CONTRE-PAI-RAPIDE');
    const ps = FinanceService.getPayments();
    const contre = ps.find(p => p.id === 'CONTRE-PAI-RAPIDE')!;
    expect(contre).toMatchObject({ reversalOfId: 'PAI-RAPIDE', direction: 'in', amountCents: 40000 });
    const neuf = ps.find(p => p.id === ordre[1])!;
    expect(neuf).toMatchObject({ transactionId: 'LOYER', amountCents: 25000, direction: 'out' });
    expect(ps).toHaveLength(3);
    expect(restant('LOYER')).toBe(15000);
    expect(restant('SOLDE')).toBe(6000);
  });
  it('un format de justificatif refusé se dit et n’empêche pas de payer', () => {
    ouvre(autre());
    const dessus = document.querySelector('input[aria-label="Choisir le fichier du justificatif du virement"]') as HTMLInputElement;
    fireEvent.change(dessus, { target: { files: [new File(['x'], 'preuve.heic', { type: 'image/heic' })] } });
    expect(screen.getByRole('alert')).toHaveTextContent(/Format non pris en charge/);
    expect(screen.getByRole('button', { name: /^✓ Payer/ })).toBeEnabled();
  });
  it('si Drive refuse le justificatif, aucun paiement n’est écrit et l’erreur est dite', async () => {
    vi.mocked(saveFinanceDocumentConfirmed).mockRejectedValueOnce(new Error('Hors connexion : le justificatif n’a pas pu partir.'));
    ouvre(loyer());
    const dessus = document.querySelector('input[aria-label="Choisir le fichier du justificatif du virement"]') as HTMLInputElement;
    fireEvent.change(dessus, { target: { files: [new File(['x'], 'preuve.pdf', { type: 'application/pdf' })] } });
    await waitFor(() => expect(screen.getByText('preuve.pdf')).toBeVisible());
    payer();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/Hors connexion/));
    expect(FinanceService.getPayments()).toHaveLength(0);
  });
});
