import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...args: any[]) => state.save(...args) }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { ReceiptService } from '../../src/services/receiptService';
import { effacerBrouillon } from '../../src/ui/vente/brouillon';
import type { AppConfig } from '../../src/types';

// MV-38 : une vente de 999 999 CHF encaissée au comptoir. TE-55 : « Justificatif conservé dans Drive » dit sans Drive, et « 0 » au départ.
// Repris sur la caisse (v3a) : la vente au comptoir est « Payé ici », la ligne libre « Autre » porte le montant.
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: .081 }, company: { name: 'Brasserie Test' }, brewhouses: [] } as unknown as AppConfig;
beforeEach(() => {
  effacerBrouillon();
  state.save.mockReset().mockResolvedValue(undefined);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
  vi.spyOn(StorageService, 'getClients').mockReturnValue([]);
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([]);
  vi.spyOn(StorageService, 'getTarifs').mockReturnValue([]);
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
  vi.spyOn(ReceiptService, 'generateReceiptPdf').mockReturnValue({ doc: { save: vi.fn() } as any, dataUrl: 'data:application/pdf;filename=q.pdf;base64,JVBERg==', fileName: 'Quittance.pdf' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = (onSuccessMessage?: any, onClose: any = () => {}) => render(<QuickActionModal isOpen recipes={[]} onClose={onClose} onSuccessMessage={onSuccessMessage} initialScreen="quick-sale" />);
const ligne = (quantite: string, prix: string) => {
  fireEvent.click(screen.getByRole('button', { name: /^Autre/ }));
  fireEvent.change(screen.getByPlaceholderText('Consigne, verres…'), { target: { value: 'Carton' } });
  fireEvent.change(screen.getByLabelText('Quantité'), { target: { value: quantite } });
  fireEvent.change(screen.getByLabelText('Prix unitaire'), { target: { value: prix } });
  fireEvent.click(screen.getByRole('button', { name: 'Ajouter la ligne' }));
};
const encaisser = () => { fireEvent.click(screen.getByRole('button', { name: 'TWINT' })); fireEvent.click(screen.getByRole('button', { name: /^Encaisser/ })); };

describe('Vente au comptoir', () => {
  it('un million de CHF : le total dit la borne, le bouton reste éteint, rien n’est enregistré', () => {
    ouvrir(); ligne('10000', '100');
    expect(screen.getByText(/dépasse 50.000 CHF/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    const bouton = screen.getByRole('button', { name: /^Encaisser/ });
    expect((bouton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(bouton);
    expect(state.save).not.toHaveBeenCalled();
  });
  it('une vente à 200 CHF s’encaisse', async () => {
    const close = vi.fn();
    ouvrir(undefined, close); ligne('1', '200');
    expect(screen.queryByText(/dépasse/)).toBeNull();
    encaisser();
    await waitFor(() => expect(state.save).toHaveBeenCalledOnce());
    await waitFor(() => expect(close).toHaveBeenCalled());
  });
  it('rien n’est affiché à 0 avant la première ligne : le total est « — » et le prix de la ligne libre est vide', () => {
    ouvrir();
    expect(screen.getByLabelText('Total')).toHaveTextContent('—');
    fireEvent.click(screen.getByRole('button', { name: /^Autre/ }));
    expect((screen.getByLabelText('Prix unitaire') as HTMLInputElement).value).toBe('');
  });
  it('sans preuve Drive, le message ne dit pas « conservé dans Drive »', async () => {
    const message = vi.fn();
    ouvrir(message); ligne('1', '1'); encaisser();
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
    ouvrir(message); ligne('1', '1'); encaisser();
    await waitFor(() => expect(message).toHaveBeenCalled());
    expect(message.mock.calls[0][0]).toContain('Quittance conservée dans Drive.');
  });
});
