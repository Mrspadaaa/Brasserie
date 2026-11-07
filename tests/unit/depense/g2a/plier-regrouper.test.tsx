// @vitest-environment jsdom
/**
 * Voie g2a-ecran, l'état de l'écran : D333 (« Plié » ferme tout, même un groupe à voir ; l'état du segment suit l'état réel) et D332 (« ↶ Rétablir les N lignes » rend les lignes et leurs retouches).
 * Pièce FICTIVE (quincaillerie « Brico Fictif », aperçu `renovation`) ; Gemini jamais appelé, aucune écriture. Le rendu (couleurs, rognures) se mesure dans Chrome (g1), pas ici.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { ligne, lirePiece, type Vue } from './aide';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.traduire.mockReset(); state.traduire.mockResolvedValue(new Map()); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

// Six lignes de travaux, dont une sans montant ni unité (à voir) dans « Électricité » : ce groupe s'ouvre d'office avant tout geste.
const AVERIFIER = () => [
  ligne(1, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89, 89), ligne(2, 'Visseuse sans fil 18 V', 'equipment', 1, 'Stk', 99, 99),
  ligne(3, 'Mitigeur lavabo chromé', 'equipment', 1, 'Stk', 54, 54), ligne(4, 'Siphon de sol inox', 'equipment', 1, 'Stk', 46, 46),
  ligne(5, 'Interrupteur va-et-vient blanc', 'equipment', 3, 'Stk', 7.8, 23.4), ligne(6, 'Câble 3G1,5 10 m', 'equipment', null, '', null, null),
];
const bouton = (v: Vue, cle: 'plie' | 'deplie') => v.container.querySelector<HTMLButtonElement>(`[data-dp-plier-bouton="${cle}"]`)!;
const allume = (v: Vue) => ['plie', 'deplie'].filter(c => bouton(v, c as 'plie' | 'deplie').getAttribute('aria-pressed') === 'true');
const entetes = (v: Vue) => [...v.container.querySelectorAll<HTMLElement>('[data-dp-bande="renovation"] [data-dp-sg-ligne]')];
const etats = (v: Vue) => entetes(v).map(l => `${l.querySelector('span:nth-child(2)')!.textContent}=${l.getAttribute('aria-expanded')}`);
const groupe = (v: Vue, nom: string) => v.container.querySelector<HTMLElement>(`[data-dp-sg="${nom}"]`)!;

describe('D333 : « Plié » plie tout, « Déplié » déplie tout, un toucher bascule un groupe, le segment suit', () => {
  it('« Plié » ferme aussi le groupe qui porte une ligne à voir (son en-tête garde son compte) ; « Déplié » ouvre tout ; un toucher seul : état mêlé ; le groupe refermé redonne « Plié »', async () => {
    const v = await lirePiece(state.scanned, AVERIFIER());
    expect(etats(v)).toEqual(['Outillage=true', 'Électricité=true', 'Plomberie=true']); // avant tout geste (B2 n° 10, D378) : tout est ouvert
    fireEvent.click(bouton(v, 'plie'));
    expect(etats(v)).toEqual(['Outillage=false', 'Électricité=false', 'Plomberie=false']);
    expect(allume(v)).toEqual(['plie']);
    expect(groupe(v, 'Électricité').querySelector('[data-dp-sg-compte]')!.textContent).toBe('2');
    fireEvent.click(bouton(v, 'deplie'));
    expect(etats(v).every(x => x.endsWith('=true'))).toBe(true); expect(allume(v)).toEqual(['deplie']);
    fireEvent.click(groupe(v, 'Outillage').querySelector('[data-dp-sg-ligne]')!);
    expect(allume(v)).toEqual([]);
    fireEvent.click(groupe(v, 'Outillage').querySelector('[data-dp-sg-ligne]')!);
    expect(allume(v)).toEqual(['deplie']);
    fireEvent.click(bouton(v, 'plie'));
    expect(allume(v)).toEqual(['plie']);
  });
  it('« Plié » ferme le plateau ouvert d’une rangée de tout groupe qu’il replie', async () => {
    const v = await lirePiece(state.scanned, AVERIFIER());
    const d = groupe(v, 'Électricité').querySelector<HTMLDetailsElement>('article details')!;
    d.open = true; fireEvent(d, new Event('toggle'));
    fireEvent.click(bouton(v, 'plie'));
    await waitFor(() => expect(etats(v)).toEqual(['Outillage=false', 'Électricité=false', 'Plomberie=false']));
    expect(groupe(v, 'Électricité').querySelector<HTMLDetailsElement>('article details')!.open).toBe(false);
  });
});

describe('D332 : « Regrouper en une dépense » a son retour', () => {
  const rangees = (v: Vue) => v.container.querySelectorAll('[data-purchase-line]').length;
  it('« ↶ Rétablir les N lignes » rend les lignes et leurs retouches, et le geste « Regrouper » revient', async () => {
    const v = await lirePiece(state.scanned, AVERIFIER());
    const avant = rangees(v);
    fireEvent.change(screen.getByLabelText('Quantité ligne 2'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Regrouper en une dépense' }));
    await waitFor(() => expect(rangees(v)).toBe(1));
    expect(screen.queryByRole('button', { name: 'Regrouper en une dépense' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `↶ Rétablir les ${avant} lignes` }));
    await waitFor(() => expect(rangees(v)).toBe(avant));
    expect((screen.getByLabelText('Quantité ligne 2') as HTMLInputElement).value).toBe('7');
    expect(screen.queryByRole('button', { name: /Rétablir/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Regrouper en une dépense' })).toBeEnabled();
  });
});
