import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn(), generate: vi.fn(), download: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args) }));
vi.mock('../../src/ui/finance/DriveConnection', () => ({ DriveConnection: () => <p>Drive privé</p> }));
vi.mock('../../src/services/swissQrBill', async importOriginal => ({ ...await importOriginal<any>(), SwissQrBillService: { generateInvoicePdf: (...args: any[]) => state.generate(...args) } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { InvoiceSheet } from '../../src/ui/finance/InvoiceSheet';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { ReceiptService } from '../../src/services/receiptService';
import type { AppConfig, Client } from '../../src/types';
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, brewhouses: [] } as unknown as AppConfig;
const client = { id: 'test-client', name: 'Restaurant local' } as Client;
beforeEach(() => {
  state.save.mockReset(); state.generate.mockReset().mockReturnValue({ dataUrl: 'data:application/pdf;filename=test.pdf;base64,JVBERg==', fileName: 'Facture.pdf', doc: { save: state.download } }); state.download.mockReset();
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function fillInvoice() {
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2026-09-09' } });
  fireEvent.change(screen.getByLabelText('Échéance'), { target: { value: '2026-10-09' } });
  fireEvent.change(screen.getByLabelText('Désignation'), { target: { value: 'Carton Pale Ale' } });
  fireEvent.change(screen.getByLabelText('Prix unitaire (CHF)'), { target: { value: '50' } });
}
describe('Factures et quittances avec originaux privés', () => {
  it('ne ferme ni télécharge la facture avant confirmation et garde le PDF exact au retry', async () => {
    const close = vi.fn(), saved = vi.fn(); state.save.mockRejectedValueOnce(Error('Drive à reconnecter')).mockResolvedValueOnce(undefined);
    render(<InvoiceSheet client={client} config={config} tarifs={[]} onClose={close} onSaved={saved} />);
    fillInvoice(); fireEvent.click(screen.getByRole('button', { name: 'Enregistrer et télécharger' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Drive à reconnecter');
    expect(close).not.toHaveBeenCalled(); expect(saved).not.toHaveBeenCalled(); expect(state.download).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Désignation')).toBeDisabled();
    const first = state.save.mock.calls[0][0]; expect(first.transaction.proofUrl).toBeUndefined(); expect(first.transaction.finance.proofDocumentId).toBe(first.proof.id);
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la confirmation' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(state.generate).toHaveBeenCalledOnce(); expect(state.save.mock.calls[1][0]).toBe(first); expect(state.download).toHaveBeenCalledWith('Facture.pdf');
  });
  it('garde la vente et le paiement identiques après un délai de confirmation', async () => {
    const close = vi.fn(); state.save.mockRejectedValueOnce(Error('Confirmation en attente')).mockResolvedValueOnce(undefined);
    vi.spyOn(ReceiptService, 'createSaleTransactionWithReceipt').mockReturnValue({ id: 'temporary', date: '09.09.2026', description: 'Carton', amountHT: 50, amountTTC: 50, tvaRate: 0, tvaAmount: 0, category: 'recettes', subcategory: 'Vente', proofUrl: 'data:application/pdf;filename=test.pdf;base64,JVBERg==', proofFileName: 'Quittance.pdf' });
    render(<QuickActionModal isOpen recipes={[]} onClose={close} />);
    fireEvent.click(screen.getByText('Encaisser une vente'));
    fireEvent.change(screen.getByLabelText('Montant TTC encaissé'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider l’encaissement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation en attente'); expect(close).not.toHaveBeenCalled();
    const first = state.save.mock.calls[0][0]; expect(first.payment.transactionId).toBe(first.transaction.id); expect(first.transaction.proofUrl).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la confirmation' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce()); expect(state.save.mock.calls[1][0]).toBe(first);
    expect(ReceiptService.createSaleTransactionWithReceipt).toHaveBeenCalledOnce();
  });
});
