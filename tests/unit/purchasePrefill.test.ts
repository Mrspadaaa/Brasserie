import { describe, expect, it } from 'vitest';
import { invoiceFieldHints, invoiceTotalProposal, invoicePurchaseDescription, patchPurchaseDraft, scannedPayment } from '../../src/services/purchasePrefill';
import { changeSwissMonth, shiftSwissMonth } from '../../src/ui/DateField';
import type { ScannedInvoiceResult } from '../../src/services/geminiScanner';
import type { PurchaseDraft } from '../../src/services/purchaseEntry';

// Synthetic transcription only; the real photo/Flash check is an explicit, separate integration run.
const scan = (patch: Partial<ScannedInvoiceResult> = {}): ScannedInvoiceResult => ({
  documentType: 'delivery_note', vendor: 'Fournisseur fictif', date: '31.08.2026', currency: 'CHF', invoiceNumber: '',
  amountHT: null, amountTTC: null, tvaRate: null, tvaAmount: null, category: 'divers', subcategory: '', description: 'Achat test',
  items: [{ id: 'line-1', name: 'Article A', kind: 'other', quantity: 1, unit: '', amountTTC: 24.9 },
    { id: 'line-2', name: 'Article B', kind: 'other', quantity: 2, unit: '', amountTTC: 18.5 }],
  issues: [], review: { status: 'checked', findings: [] }, ...patch
});
const draft = { date: '31.08.2026', paymentDate: '31.08.2026', paymentStatus: 'paid' } as PurchaseDraft;

describe('Propositions de saisie, sans inventer les valeurs imprimées', () => {
  it('garde le libellé centré sur les achats et conserve les descriptions déjà précises', () => {
    expect(invoicePurchaseDescription(scan({ description: 'Facture Fournisseur fictif pour malt et houblon' }))).toBe('Malt et houblon');
    expect(invoicePurchaseDescription(scan({ description: 'Pompe pour le circuit de nettoyage' }))).toBe('Pompe pour le circuit de nettoyage');
  });
  it('propose la somme au centime et distingue cette proposition du total source absent', () => {
    const result = scan();
    expect(invoiceTotalProposal(result)).toEqual({ amount: 43.4, calculated: true });
    expect(result.amountTTC).toBeNull();
    expect(invoiceFieldHints(result).amountTTC).toContain('Somme des 2 lignes');
  });
  it('préserve un total imprimé divergent et demande de le confirmer', () => {
    const result = scan({ amountTTC: 50, issues: ['La somme des lignes ne correspond pas au total TTC.'] });
    expect(invoiceTotalProposal(result)).toEqual({ amount: 50, calculated: false });
    expect(invoiceFieldHints(result).amountTTC).toContain('ne correspond pas');
  });
  it('ne convertit pas une devise étrangère et ne somme pas un détail incomplet', () => {
    expect(invoiceTotalProposal(scan({ currency: 'EUR' })).amount).toBeUndefined();
    expect(invoiceTotalProposal(scan({ issues: ['Plus de 35 lignes : compléter le détail manuellement.'] })).amount).toBeUndefined();
    const result = scan(); result.items[1].amountTTC = null;
    expect(invoiceTotalProposal(result).amount).toBeUndefined();
  });
  it('inclut la remise et ne transforme pas un avoir en dépense positive', () => {
    const result = scan(); result.items.push({ ...result.items[0], kind: 'discount', amountTTC: -3.4 });
    expect(invoiceTotalProposal(result).amount).toBe(40);
    expect(invoiceTotalProposal(scan({ amountTTC: -43.4 })).amount).toBe(-43.4);
  });
  it('signale les champs corrigés, absents et les vérifications indisponibles', () => {
    expect(invoiceFieldHints(scan({ date: '', fieldWarnings: [{ field: 'vendor', message: 'Nom peu lisible.' }], review: { status: 'unavailable', findings: [] } }))).toMatchObject({ date: expect.stringContaining('Date absente'), vendor: 'Nom peu lisible.' });
    expect(invoiceFieldHints(scan({ review: { status: 'corrected', findings: [], correctedFields: ['amountTTC', 'items.0.variant'] } })).items).toContain('corrigée');
  });
});

describe('Date de l’achat et paiement quotidien', () => {
  it('propose payé à la date du document, sauf indication contraire ou achat futur', () => {
    expect(scannedPayment(scan(), '09.09.2026')).toEqual({ paymentStatus: 'paid', paymentDate: '31.08.2026' });
    expect(scannedPayment(scan({ paymentEvidence: 'unpaid' }), '09.09.2026').paymentStatus).toBe('unpaid');
    expect(scannedPayment(scan({ date: '10.09.2026' }), '09.09.2026').paymentStatus).toBe('unpaid');
    expect(scannedPayment(scan({ documentType: 'quote' }), '09.09.2026').paymentStatus).toBe('unpaid');
  });
  it('déplace ensemble achat et paiement, et préserve une date de paiement distincte', () => {
    expect(patchPurchaseDraft(draft, { date: '31.07.2026' }, '09.09.2026').paymentDate).toBe('31.07.2026');
    expect(patchPurchaseDraft({ ...draft, paymentDate: '02.09.2026' }, { date: '31.07.2026' }, '09.09.2026').paymentDate).toBe('02.09.2026');
    expect(patchPurchaseDraft(draft, { date: '10.09.2026' }, '09.09.2026').paymentStatus).toBe('unpaid');
  });
  it('change le mois sans perdre le jour, avec fins de mois et changements d’année', () => {
    expect(changeSwissMonth('18.08.2026', '2025-02')).toBe('18.02.2025');
    expect(changeSwissMonth('31.01.2026', '2026-02')).toBe('28.02.2026');
    expect(changeSwissMonth('31.01.2024', '2024-02')).toBe('29.02.2024');
    expect(shiftSwissMonth('31.12.2026', 1)).toBe('31.01.2027');
    expect(shiftSwissMonth('18.01.2026', -1)).toBe('18.12.2025');
  });
});
