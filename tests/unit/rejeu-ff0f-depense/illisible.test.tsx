// @vitest-environment jsdom
/**
 * Rejeu en ligne ff0f822e, B2-17 et LL-5 : une photo illisible (illisible.jpg du banc : floue, sombre) rend une lecture « ok » sans rien d'exploitable.
 * Avant : « Lignes de la facture · 1 » avec une ligne « Achat » vide fabriquée, et des « À confirmer » champ par champ, aucune issue.
 * Attendu : « document illisible » dit UNE fois, avec les deux issues (meilleure photo, saisie à la main), aucune ligne fabriquée ; une lecture qui porte au moins
 * une valeur (un fournisseur, un total) reste une lecture. Gemini simulé (la réponse vide d'une pièce illisible), aucune donnée réelle.
 */
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ scanned: vi.fn() }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [] }), getTransactions: () => [], getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';
import { DOCUMENT_ILLISIBLE, lectureSansRien, illisibleSiVide } from '../../../src/services/lectureIllisible';

/** La réponse d'un serveur devant une photo illisible : le gabarit de la lecture, rien dedans, des avertissements qui disent « illisible » champ par champ. */
const vide = (items: any[] = []) => ({ documentType: 'other', paymentEvidence: 'unknown', vendor: '', date: '', currency: '', invoiceNumber: '', orderNumber: '',
  amountHT: null, tvaRate: null, tvaAmount: null, amountTTC: null, category: 'divers', subcategory: '', description: '', issues: [],
  fieldWarnings: [{ field: 'vendor', message: 'Fournisseur illisible.' }, { field: 'date', message: 'Date illisible.' }, { field: 'amountTTC', message: 'Total TTC illisible.' }],
  review: { status: 'checked', findings: [], readers: 2 }, items });
const ouvrir = async (result: any) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result });
  const view = render(createElement(ExpenseSheet, { onClose: () => {}, onSaved: () => {} }));
  const file = new File(['%PDF-1.4\nun'], 'un.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\nun').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  // La lecture est posée : soit le plateau de vérification (lecture exploitable), soit le formulaire manuel et son résumé de lignes (lecture non aboutie).
  await waitFor(() => expect(screen.queryByRole('region', { name: 'Vérification du justificatif' }) ?? view.container.querySelector('details[data-purchase-lines] > summary')).toBeTruthy());
  return view;
};
const resume = (v: ReturnType<typeof render>) => v.container.querySelector('details[data-purchase-lines] > summary')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset();
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('LL-5, B2-17 : une lecture sans rien d\'exploitable est un document illisible', () => {
  it('lectureSansRien : vide ou lignes toutes vides oui ; une seule valeur lue (fournisseur, total, ligne nommée) non', () => {
    expect(lectureSansRien(vide() as any)).toBe(true);
    expect(lectureSansRien(vide([{ id: 'line-1', name: '', quantity: null, unit: '', price: null, amountTTC: null }]) as any)).toBe(true);
    expect(lectureSansRien({ ...vide(), vendor: 'Droguerie du Pont' } as any)).toBe(false);
    expect(lectureSansRien({ ...vide(), amountTTC: 0 } as any)).toBe(false); // un total lu à 0 est une valeur lue, pas un champ absent
    expect(lectureSansRien(vide([{ id: 'line-1', name: 'Eponges (5)', quantity: null, unit: '', price: null, amountTTC: null }]) as any)).toBe(false);
    expect(lectureSansRien(undefined)).toBe(false);
  });
  it('illisibleSiVide : une lecture vide devient non aboutie (pièce gardée), une lecture échouée ou pleine passe telle quelle', () => {
    const base = { proofDataUrl: 'data:x', fileName: 'illisible.jpg', mimeType: 'image/jpeg' };
    const vue = illisibleSiVide({ ...base, ok: true, result: vide() as any });
    expect(vue).toMatchObject({ ok: false, error: DOCUMENT_ILLISIBLE, proofDataUrl: 'data:x' });
    expect(vue.result).toBeUndefined();
    const pleine = { ...base, ok: true, result: { ...vide(), vendor: 'Droguerie du Pont' } as any };
    expect(illisibleSiVide(pleine)).toBe(pleine);
    const echec = { ...base, ok: false, error: 'Lecture indisponible.' };
    expect(illisibleSiVide(echec)).toBe(echec);
  });
  it.each([['aucune ligne', []], ['une ligne toute vide', [{ id: 'line-1', name: '', kind: 'unknown', quantity: null, unit: '', price: null, amountTTC: null }]]])(
    'l\'écran (%s) : « illisible » une fois, les deux issues, aucune ligne fabriquée, aucun « À confirmer » champ par champ', async (_nom, items) => {
      const v = await ouvrir(vide(items as any[]));
      const alertes = screen.getAllByRole('alert').map(n => n.textContent ?? '');
      expect(alertes.filter(t => /illisible/i.test(t))).toHaveLength(1);
      expect(alertes.join(' ')).toContain('photo plus nette');
      expect(alertes.join(' ')).toContain('à la main');
      expect(document.body.textContent).not.toMatch(/À confirmer/);
      expect(document.body.textContent).not.toMatch(/Date illisible|Fournisseur illisible|Total TTC illisible/);
      // Aucune ligne fabriquée : pas de plateau de vérification à confirmer, ni « Lignes de la facture · 1 », ni compte d'articles, ni la ligne « Achat ».
      expect(screen.queryByRole('region', { name: 'Vérification du justificatif' })).toBeNull();
      expect(resume(v)).toMatch(/Articles, stock et matériel/); // le formulaire manuel est là (le résumé existe : les « absent » plus bas ne sont pas vrais pour rien)
      expect(resume(v)).not.toMatch(/Lignes de la facture/);
      expect(resume(v)).not.toMatch(/·\s*\d/);
      expect([...v.container.querySelectorAll<HTMLInputElement>('[aria-label^="Libellé ligne"]')].map(i => i.value)).not.toContain('Achat');
    });
  it('contrôle : une lecture qui porte un fournisseur et un total reste une lecture (pas « illisible »)', async () => {
    const v = await ouvrir({ ...vide(), vendor: 'Droguerie du Pont', amountTTC: 25.9 });
    expect(screen.queryAllByRole('alert').map(n => n.textContent ?? '').join(' ')).not.toMatch(/Document illisible/);
    expect(screen.getByRole('region', { name: 'Vérification du justificatif' })).toBeTruthy();
  });
});
