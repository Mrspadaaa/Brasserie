// @vitest-environment jsdom
/**
 * B2-NOTE-2 (07.11, doute du rejeu) : « la pastille +1 n'a pas écrit la quantité ». Rejouée ici sur le vrai écran : une ligne sans quantité montre ses nombres en un toucher (D369),
 * chaque toucher s'ajoute (1 puis 10 : 11), et ✕ remet à vide. Pièce FICTIVE (aperçu rénovation) ; Gemini jamais appelé, aucune écriture.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen } from '@testing-library/react';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: async () => new Map(), retenirNomBrasseur: async () => undefined }));
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { ligne, lirePiece, ligneDe } from './aide';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('B2-NOTE-2 : les nombres en un toucher écrivent la quantité', () => {
  it('« +1 » écrit 1, « +10 » ajoute (11), « ✕ » efface', async () => {
    const v = await lirePiece(state.scanned, [ligne(1, 'Rouleau mousse 12 cm', 'equipment', null, 'Stk', 1.2, null), ligne(2, 'Seau 12 L', 'equipment', 2, 'Stk', 9.5, 19)]);
    const l1 = ligneDe(v, 1);
    const qte = () => (l1.querySelector('[aria-label="Quantité ligne 1"]') as HTMLInputElement).value;
    expect(qte()).toBe('');
    const nombres = l1.querySelector('[data-dp-nombres]')!;
    expect(nombres).not.toBeNull();
    fireEvent.click(nombres.querySelector('[data-val="1"]')!);
    expect(qte()).toBe('1');
    fireEvent.click(l1.querySelector('[data-dp-nombres] [data-val="10"]')!);
    expect(qte()).toBe('11');
    fireEvent.click(screen.getAllByRole('button', { name: 'effacer la quantité' })[0]);
    expect(qte()).toBe('');
  });
});
