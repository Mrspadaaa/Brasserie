import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../../src/services/incomeEntry', () => ({ saveIncomeEntry: (...a: any[]) => state.save(...a), saveIncomeEntryInBackground: async (...a: any[]) => ({ receipt: await state.save(...a), queued: false, confirmed: true }) }));
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null }, storage: {} }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
import { QuickActionModal } from '../../src/components/QuickActionModal';
import { StorageService } from '../../src/services/storage';
import { ReceiptService } from '../../src/services/receiptService';
import { effacerBrouillon } from '../../src/ui/vente/brouillon';
import type { AppConfig, Batch, PricingItem } from '../../src/types';

/** AM-69 dans la caisse : en espèces le total encaissé est arrondi à 5 ct et l'écart se voit ; TWINT garde le montant exact. */
const config = { fiscal: { isTvaRegistered: false, tvaNormalRate: 0.081 }, company: { name: 'Brasserie Test', owner: '', uid: '', iban: 'CH93 0076 2011 6238 5295 7',
  adresse: { rue: 'Rue du Test', numero: '1', npa: '1700', localite: 'Fribourg', pays: 'CH' } }, brewhouses: [] } as unknown as AppConfig;
const batch = { id: 'B1', name: 'Pale Ale', style: 'Pale Ale', status: 'conditionne', brewDate: '2026-09-05', volumeL: 30, volumePackagedL: 27, packaging: { bottles33: 96, bottles75: 24, kegIds: [] } } as unknown as Batch;
const tarif = (product: string, priceHT: number): PricingItem => ({ product, costIngredients: 0, costLabor: 0, costFixed: 0, costTotal: 0, priceHT, marginCHF: 0, marginPercent: 0 });

beforeEach(() => {
  effacerBrouillon(); state.save.mockReset().mockResolvedValue(undefined);
  vi.spyOn(StorageService, 'getConfig').mockReturnValue(config);
  vi.spyOn(StorageService, 'getStocks').mockReturnValue({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] } as any);
  vi.spyOn(StorageService, 'getClients').mockReturnValue([]);
  vi.spyOn(StorageService, 'getBatches').mockReturnValue([batch]);
  vi.spyOn(StorageService, 'getTarifs').mockReturnValue([tarif('Pale Ale 33 cl', 3.96)]);
  vi.spyOn(StorageService, 'getTransactions').mockReturnValue([]);
  vi.spyOn(ReceiptService, 'generateReceiptPdf').mockReturnValue({ doc: { save: vi.fn() } as any, dataUrl: 'data:application/pdf;filename=q.pdf;base64,JVBERg==', fileName: 'Quittance.pdf' });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const ouvrir = () => render(<QuickActionModal isOpen recipes={[]} onClose={vi.fn() as any} onSuccessMessage={vi.fn() as any} initialScreen="quick-sale" />);

describe('Caisse : espèces arrondies à 5 centimes', () => {
  it('3 × 3,96 = 11,88 : TWINT 11,88 sans ligne d\'arrondi ; Espèces 11,90 avec « Arrondi à 5 centimes +0,02 » ; le bouton annonce 11,90', async () => {
    ouvrir();
    for (let i = 0; i < 3; i++) fireEvent.click(screen.getByRole('button', { name: /^33 cl/ }));
    fireEvent.click(screen.getByRole('button', { name: 'TWINT' }));
    expect(screen.getByLabelText('Total')).toHaveTextContent('11,88');
    expect(document.querySelector('[data-arrondi]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Espèces' }));
    expect(screen.getByLabelText('Total')).toHaveTextContent('11,90');
    expect(document.querySelectorAll('[data-arrondi]').length).toBeGreaterThan(0);
    expect(document.querySelector('[data-arrondi]')).toHaveTextContent('Arrondi à 5 centimes+0,02');
    expect(screen.getByRole('button', { name: /^Encaisser/ })).toHaveTextContent('11,90');
    fireEvent.click(screen.getByRole('button', { name: /^Encaisser/ }));
    await waitFor(() => expect(state.save).toHaveBeenCalled());
    const entree = state.save.mock.calls[0][0];
    expect(entree.transaction.finance.amountCents).toBe(1190);
    expect(entree.payment.amountCents).toBe(1190);
  });
});
