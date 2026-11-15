import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn(), generate: vi.fn(), download: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args), saveIncomeEntryInBackground: async (...args: any[]) => ({ receipt: await state.save(...args), queued: false, confirmed: true }) }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('../../src/services/swissQrBill', async importOriginal => {
  const o = await importOriginal<any>();
  /* Pas de canvas dans jsdom : le rendu PNG est remplacé par un PNG factice, le reste de la QR-facture (swissqrbill) est réel. */
  return { ...o, preparerQrFacture: (e: any) => o.preparerQrFacture({ ...e, rasteriser: async () => `data:image/png;base64,${'A'.repeat(1500)}` }), SwissQrBillService: { generateInvoicePdf: (...args: any[]) => state.generate(...args) } };
});
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { Caisse } from '../../src/ui/vente/Caisse';
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { ReceiptService } from '../../src/services/receiptService';
import { effacerBrouillon } from '../../src/ui/vente/brouillon';
import type { AppConfig, Client } from '../../src/types';

// Les originaux privés des factures et des quittances : le brouillon préparé est conservé à l'identique pendant la confirmation (repris sur la caisse).
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, company: { name: 'Brasserie Test', iban: 'CH93 0076 2011 6238 5295 7', adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, brewhouses: [] } as unknown as AppConfig;
const client: Client = { id: 'test-client', name: 'Restaurant local', type: 'Pro', contact: '', phone: '', email: '', adresse: { rue: 'Rue du Lac', numero: '5', npa: '1700', localite: 'Fribourg', pays: 'CH' } };
beforeEach(() => {
  effacerBrouillon();
  state.save.mockReset(); state.generate.mockReset().mockReturnValue({ dataUrl: 'data:application/pdf;filename=test.pdf;base64,JVBERg==', fileName: 'Facture.pdf', doc: { save: state.download }, totals: {} }); state.download.mockReset();
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
  vi.spyOn(StorageService, 'getClients').mockReturnValue([client]);
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'getTarifs').mockReturnValue([]);
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const ligne50 = () => {
  fireEvent.click(screen.getByRole('button', { name: /^Autre/ }));
  fireEvent.change(screen.getByPlaceholderText('Consigne, verres…'), { target: { value: 'Carton Pale Ale' } });
  fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: '50' } });
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
};

describe('Factures et quittances avec originaux privés', () => {
  it('ne ferme ni ne télécharge la facture avant confirmation et garde le PDF exact au retry', async () => {
    const close = vi.fn(), saved = vi.fn(); state.save.mockRejectedValueOnce(Error('Drive à reconnecter')).mockResolvedValueOnce(undefined);
    render(<Caisse clientIdInitial="test-client" onClose={close} onSaved={saved} />);
    ligne50(); fireEvent.click(screen.getByRole('button', { name: /^Facturer/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Drive à reconnecter');
    expect(close).not.toHaveBeenCalled(); expect(saved).not.toHaveBeenCalled(); expect(state.download).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /^Autre/ })).toBeDisabled();
    const first = state.save.mock.calls[0][0]; expect(first.transaction.proofUrl).toBeUndefined(); expect(first.transaction.finance.proofDocumentId).toBe(first.proof.id);
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la confirmation' }));
    await waitFor(() => expect(saved).toHaveBeenCalledOnce());
    expect(state.generate).toHaveBeenCalledOnce(); expect(state.save.mock.calls[1][0]).toBe(first);
    expect(state.download).not.toHaveBeenCalled(); // le PDF ne part qu'à « Envoyer le PDF »
  });
  it('garde la vente et le paiement identiques après un délai de confirmation', async () => {
    const close = vi.fn(); state.save.mockRejectedValueOnce(Error('Confirmation en attente')).mockResolvedValueOnce(undefined);
    const recu = vi.spyOn(ReceiptService, 'generateReceiptPdf').mockReturnValue({ doc: { save: vi.fn() } as any, dataUrl: 'data:application/pdf;filename=q.pdf;base64,JVBERg==', fileName: 'Quittance.pdf' });
    render(<QuickActionModal isOpen recipes={[]} onClose={close} initialScreen="quick-sale" />);
    ligne50(); fireEvent.click(screen.getByRole('button', { name: 'TWINT' })); fireEvent.click(screen.getByRole('button', { name: /^Encaisser/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirmation en attente'); expect(close).not.toHaveBeenCalled();
    const first = state.save.mock.calls[0][0]; expect(first.payment.transactionId).toBe(first.transaction.id); expect(first.transaction.proofUrl).toBeUndefined();
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre la confirmation' }));
    await waitFor(() => expect(close).toHaveBeenCalledOnce()); expect(state.save.mock.calls[1][0]).toBe(first);
    expect(recu).toHaveBeenCalledOnce();
  });
});
