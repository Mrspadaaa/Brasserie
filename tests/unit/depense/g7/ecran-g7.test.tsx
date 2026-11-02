// @vitest-environment jsdom
/**
 * Voie g7-reste, l'écran : D357 (« Regrouper en une dépense » : un lien discret au bout de la ligne « Détail », réversible), D358 (l'arrondi suisse à 5 centimes est sa propre ligne neutre, le détail égale
 * le total, tout autre écart reste signalé), D334 (sous « à remplir », la rangée s'ouvre, le champ est rouge, nommé, et le focus y est). Pièces INVENTÉES (quincaillerie « Brico Fictif ») ; Gemini jamais appelé.
 * Chaque cas échoue sur 60a8c25f.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { ligne, lirePiece } from '../g2a/aide';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.traduire.mockReset(); state.traduire.mockResolvedValue(new Map()); state.transactions = [];
  state.stocks = { rawMaterials: [], cleaning: [], equipment: [], kegs: [] };
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const q = (sel: string) => document.querySelector<HTMLElement>(sel);
const fin = () => q('[data-dp="fin"]')!;
const deux = [ligne(1, 'Fermenteur 30 L fictif', 'equipment', 1, 'Stk', 100.10, 100.10), ligne(2, 'Brosse plate fictive', 'equipment', 1, 'Stk', 20.11, 20.11)];
/** Le texte « Détail a / b » seul (pas son enveloppe, qui porte aussi le lien « Regrouper »). */
const detailDe = () => [...fin().querySelectorAll<HTMLElement>('span')].find(s => /^Détail/.test(s.textContent ?? '') && !/Regrouper/.test(s.textContent ?? ''))!;
const bouton = (parent: ParentNode, texte: RegExp) => [...parent.querySelectorAll<HTMLButtonElement>('button')].find(b => texte.test(b.textContent ?? ''))!;

describe('D357 — « Regrouper en une dépense » : un lien discret au bout du « Détail », et le retour reste', () => {
  it('il n\'est plus dans la rangée de « + Ajouter une ligne » : sans cadre, texte secondaire, 12 px, cible de 24 px, au bout de la ligne « Détail »', async () => {
    await lirePiece(state.scanned, deux);
    const ajouter = bouton(fin(), /Ajouter une ligne/), regrouper = bouton(fin(), /Regrouper en une dépense/);
    expect(regrouper).toBeTruthy();
    expect(regrouper.parentElement).not.toBe(ajouter.parentElement);
    expect(regrouper.parentElement!.textContent).toMatch(/Détail/);
    const cls = regrouper.className.split(/\s+/);
    expect(cls).toContain('text-xs'); expect(cls).toContain('text-cave-400'); expect(cls).toContain('min-h-6');
    expect(cls.filter(c => /^(border|rounded|bg-)/.test(c))).toEqual([]); // ni cadre, ni fond
  });
  it('toujours réversible : « Regrouper » puis « ↶ Rétablir » rend les deux lignes', async () => {
    await lirePiece(state.scanned, deux);
    expect(document.querySelectorAll('[data-purchase-line]')).toHaveLength(2);
    fireEvent.click(bouton(fin(), /Regrouper en une dépense/));
    await waitFor(() => expect(document.querySelectorAll('[data-purchase-line]')).toHaveLength(1));
    expect(q('[data-dp-retablir]')).not.toBeNull();
    fireEvent.click(q('[data-dp-retablir]')!);
    await waitFor(() => expect(document.querySelectorAll('[data-purchase-line]')).toHaveLength(2));
    expect(bouton(fin(), /Regrouper en une dépense/)).toBeTruthy();
  });
});

describe('D358 — l\'arrondi suisse à 5 centimes est sa propre ligne neutre', () => {
  it('lignes 120,21, total imprimé 120,20 : une ligne « Arrondi à 5 centimes −0,01 » à la fin, le détail égale le total, aucune couleur d\'alerte', async () => {
    await lirePiece(state.scanned, deux, r => { r.amountTTC = 120.2; });
    const arrondi = q('[data-dp-arrondi]')!;
    expect(arrondi).not.toBeNull();
    expect(arrondi.textContent).toMatch(/Arrondi à 5 centimes/); expect(arrondi.textContent).toMatch(/−0,01/);
    const detail = detailDe();
    expect(detail.textContent!.replace(/\s+/g, ' ')).toBe('Détail 120,20 / 120,20');
    expect(detail.className).not.toMatch(/attention|alert/);
    expect(arrondi.className).not.toMatch(/attention|alert/);
    // à la fin des lignes : après la dernière rangée
    const dernier = [...document.querySelectorAll('[data-purchase-line]')].pop()!;
    expect(dernier.compareDocumentPosition(arrondi) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it('lignes 124,48, total 124,50 : « +0,02 » (le sens suit l\'écart)', async () => {
    await lirePiece(state.scanned, [ligne(1, 'Fermenteur 30 L fictif', 'equipment', 1, 'Stk', 100, 100), ligne(2, 'Brosse plate fictive', 'equipment', 1, 'Stk', 24.48, 24.48)], r => { r.amountTTC = 124.5; });
    expect(q('[data-dp-arrondi]')!.textContent).toMatch(/\+0,02/);
  });
  it('tout autre écart reste signalé : 120,21 pour 121,20 : aucune ligne d\'arrondi, le détail garde l\'écart et la couleur d\'attention', async () => {
    await lirePiece(state.scanned, deux, r => { r.amountTTC = 121.2; });
    expect(q('[data-dp-arrondi]')).toBeNull();
    const detail = detailDe();
    expect(detail.textContent!.replace(/\s+/g, ' ')).toBe('Détail 120,21 / 121,20');
    expect(detail.className).toMatch(/text-attention/);
  });
  it('une somme exacte n\'a aucune ligne d\'arrondi', async () => {
    await lirePiece(state.scanned, deux, r => { r.amountTTC = 120.21; });
    expect(q('[data-dp-arrondi]')).toBeNull();
  });
});

describe('D334, M11 — « ⇄ Choisir un autre article » sur un nettoyant, sans choisir', () => {
  it('la puce « 1 à remplir » existe ; elle ouvre la rangée, le champ « Article » est rouge, nommé, et le focus y est', async () => {
    state.stocks.cleaning = [{ id: 's1', ref: 'CL-1', name: 'Détartrant liquide fictif', category: 'Détergent', unit: 'Stk', currentStock: 3, minStock: 1 }]; // un article déjà au stock : « ⇄ » est offert
    await lirePiece(state.scanned, [ligne(1, 'Détartrant liquide fictif', 'stock', 2, 'Stk', 6.5, 13), ligne(2, 'Fermenteur 30 L fictif', 'equipment', 1, 'Stk', 89, 89)]);
    expect(q('[data-va="remplir"]')).toBeNull(); // rien à remplir tant qu'il n'a rien touché
    const rangee = q('[data-dp-ligne="line-1"]')!;
    fireEvent.click(rangee.querySelector('[aria-label="Choisir un autre article"]')!);
    await waitFor(() => expect(q('[data-va="remplir"]')).not.toBeNull());
    expect(q('[data-va="remplir"]')!.textContent).toMatch(/1\s*à remplir/);
    fireEvent.click(q('[data-va="remplir"]')!);
    await waitFor(() => expect(rangee.querySelector<HTMLDetailsElement>('details')!.open).toBe(true));
    const champ = rangee.querySelector<HTMLInputElement>('[data-dp-stock] [aria-label="Article"]')!;
    expect(champ.closest('[data-dp-niveau="inconnu"]')).not.toBeNull(); // marqué (cadre rouge pointillé)
    expect(rangee.querySelector('[data-dp-stock]')!.textContent).toMatch(/à choisir/); // nommé
    await waitFor(() => expect(document.activeElement).toBe(champ)); // le focus y est
  });
});
