import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args) }));
vi.mock('../../src/ui/finance/DriveConnection', () => ({ DriveConnection: () => <p>Drive privé</p> }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { GoogleDriveService } from '../../src/services/googleDriveService';
import { ReceiptService } from '../../src/services/receiptService';
import type { AppConfig } from '../../src/types';

// MV-38 : une vente de 999 999 CHF encaissée au comptoir. TE-55 : « Justificatif conservé dans Drive » dit sans Drive, et « 0 » au départ.
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, brewhouses: [] } as unknown as AppConfig;
beforeEach(() => {
  state.save.mockReset().mockResolvedValue(undefined);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [] });
  vi.spyOn(GoogleDriveService, 'isConnected').mockReturnValue(false);
  vi.spyOn(ReceiptService, 'createSaleTransactionWithReceipt').mockReturnValue({ id: 'temporary', date: '09.09.2026', description: 'Carton', amountHT: 50, amountTTC: 1, tvaRate: 0, tvaAmount: 0, category: 'recettes', subcategory: 'Vente', proofUrl: 'data:application/pdf;filename=test.pdf;base64,JVBERg==', proofFileName: 'Quittance.pdf' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('Vente au comptoir', () => {
  it('999 999 CHF : le champ dit la borne, le bouton reste éteint, rien n’est enregistré', () => {
    render(<QuickActionModal isOpen recipes={[]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Encaisser une vente'));
    fireEvent.change(screen.getByLabelText('Montant TTC encaissé'), { target: { value: '999999' } });
    expect(screen.getByText(/dépasse 50.000 CHF/)).toBeTruthy();
    const valider = screen.getByRole('button', { name: 'Valider l’encaissement' });
    expect((valider as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(valider);
    expect(state.save).not.toHaveBeenCalled();
  });
  it('le montant d’une vente à 200 CHF s’encaisse', async () => {
    const close = vi.fn();
    render(<QuickActionModal isOpen recipes={[]} onClose={close} />);
    fireEvent.click(screen.getByText('Encaisser une vente'));
    fireEvent.change(screen.getByLabelText('Montant TTC encaissé'), { target: { value: '200' } });
    expect(screen.queryByText(/dépasse/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Valider l’encaissement' }));
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
  });
  it('le champ montant ne montre pas « 0 » avant la première frappe', () => {
    render(<QuickActionModal isOpen recipes={[]} onClose={() => {}} />);
    fireEvent.click(screen.getByText('Encaisser une vente'));
    expect((screen.getByLabelText('Montant TTC encaissé') as HTMLInputElement).value).toBe('');
  });
  it('sans preuve Drive, le message ne dit pas « conservé dans Drive »', async () => {
    const message = vi.fn();
    render(<QuickActionModal isOpen recipes={[]} onClose={() => {}} onSuccessMessage={message} />);
    fireEvent.click(screen.getByText('Encaisser une vente'));
    fireEvent.change(screen.getByLabelText('Montant TTC encaissé'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider l’encaissement' }));
    await waitFor(() => expect(message).toHaveBeenCalled());
    const texte: string = message.mock.calls[0][0];
    expect(texte).toContain('1,00 CHF');
    expect(texte).not.toContain('1.00');
    expect(texte).not.toMatch(/conservée? dans Drive/);
    expect(texte).toContain('pas dans Drive');
  });
  it('avec une preuve Drive, le message le dit', async () => {
    state.save.mockResolvedValue({ driveFileId: 'abc' });
    const message = vi.fn();
    render(<QuickActionModal isOpen recipes={[]} onClose={() => {}} onSuccessMessage={message} />);
    fireEvent.click(screen.getByText('Encaisser une vente'));
    fireEvent.change(screen.getByLabelText('Montant TTC encaissé'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider l’encaissement' }));
    await waitFor(() => expect(message).toHaveBeenCalled());
    expect(message.mock.calls[0][0]).toContain('Quittance conservée dans Drive.');
  });
});
