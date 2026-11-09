// @vitest-environment jsdom
/**
 * D-b (verdict final) : dans la bande Malts, le badge « Rattacher les 4 » prenait la place du compte (« 7 +4 ↳ ») : tronqué en « R… » à 320 px. Il reste DANS la rangée de l'en-tête, après le nom et le compte, sans rétrécir
 * (`shrink-0`, plus de `truncate`), et sous 360 px son mot cède la place à « ↳ n » ; son nom accessible reste la phrase entière. Pièce simulée 372765 ; Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
const state = vi.hoisted(() => ({ scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: async () => new Map(), retenirNomBrasseur: async () => undefined }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
beforeEach(() => { cleanup(); Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle }); });
afterEach(cleanup);

describe('D-b : « Rattacher les n » reste dans la rangée de la bande Malts', () => {
  it('même ligne que le nom et le compte, sans tronquer, nom accessible entier', async () => {
    const ap = apercuDepense('3'); (state as any).stocks = ap.stocks;
    render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={ap}/>);
    const bouton = await screen.findByRole('button', { name: /^Rattacher les \d+ moutures$/ });
    const entete = bouton.parentElement!;
    expect(entete.hasAttribute('data-dp-bande-entete')).toBe(true);
    expect(entete.querySelector('strong')).toHaveTextContent('Malts');
    const compte = entete.querySelector('[data-dp-bande-compte]')!;
    expect(compte.compareDocumentPosition(bouton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy(); // après le compte, jamais par-dessus
    expect(bouton.className).toMatch(/shrink-0/);
    expect(bouton.className).not.toMatch(/truncate/);
    expect(bouton.textContent).toMatch(/Rattacher les/); expect(bouton.textContent).toMatch(/\d+$/); // les deux mots sont dans le DOM, le CSS n'en montre qu'un selon la largeur
  });
});
