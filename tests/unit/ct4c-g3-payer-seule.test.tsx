// @vitest-environment jsdom
/**
 * Critique tour 4 (c), voie g3, CT4C-8 : « Confirmer le paiement » sur la fiche du loyer (400,00) ouvrait « Payer l'Atelier » à 460,00, avec
 * « Solde atelier · ancienne année » (60,00) coché d'office. Le geste ne coche que la pièce touchée ; l'autre dette du même tiers reste proposée,
 * non cochée. Chemin testé ici : Atelier › Tarifs › « Ouvrir la vente » (VenteDeTarifs), qui monte la même fiche et la même feuille que Finances.
 * Argent : aucun arrondi touché ; le test lit le montant avant tout geste de paiement. Fixtures simulées, aucun réseau, aucun Gemini.
 */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, app: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, subtitle, children, footer }: any) => open ? <div role="dialog" aria-label={title}><p>{subtitle}</p>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { VenteDeTarifs } from '../../src/ui/atelier/VenteDeTarifs';
import { todayISO } from '../../src/domain/finance/ledger';
import type { Transaction } from '../../src/types';

const tx = (id: string, description: string, vendor: string, amountCents: number, dueDate: string): Transaction => ({
  id, description, date: todayISO(), category: 'chargesFixes', subcategory: '', amountHT: amountCents / 100, amountTTC: amountCents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind: 'expense', amountCents, paymentStatus: 'unpaid', dueDate, vendor, lines: [{ id: 'l', kind: 'ingredient', description, amountCents }] }
}) as Transaction;
const solde = () => tx('SOLDE', 'Solde atelier · ancienne année', 'Atelier', 6000, '2025-12-20');
const loyer = () => tx('LOYER', 'Loyer de l’atelier', 'Atelier', 40000, '2099-11-25');

beforeEach(() => { window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); [solde(), loyer()].forEach(t => StorageService.addTransaction(t)); });
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.restoreAllMocks(); });

describe('CT4C-8 : « Confirmer le paiement » ne coche que la pièce touchée', () => {
  it('le loyer : la feuille s’ouvre à 400,00 (pas 460,00), le solde ancienne année reste proposé, non coché', () => {
    render(<VenteDeTarifs id="LOYER" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));
    expect(screen.getByRole('dialog', { name: 'Payer l’Atelier' })).toBeVisible();
    // Le montant avant tout paiement : 400,00, la seule pièce touchée.
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('400,00');
    expect(screen.getByRole('checkbox', { name: 'Inclure Loyer de l’atelier dans le virement' })).toHaveAttribute('aria-checked', 'true');
    const autre = screen.getByRole('checkbox', { name: 'Inclure Solde atelier · ancienne année dans le virement' });
    expect(autre).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('pas dans ce virement')).toBeVisible();
    expect(screen.getByRole('button', { name: /^✓ Payer 400,00/ })).toBeEnabled();
    expect(FinanceService.getPayments()).toHaveLength(0);
  });
  it('la dette du même tiers se coche d’un toucher : 460,00, comme avant', () => {
    render(<VenteDeTarifs id="LOYER" onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer le paiement' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Inclure Solde atelier · ancienne année dans le virement' }));
    expect(screen.getByLabelText('Montant du virement (CHF)')).toHaveValue('460,00');
  });
});
