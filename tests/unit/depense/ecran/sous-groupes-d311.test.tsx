// @vitest-environment jsdom
/**
 * Voie r4-port-d, reprise 1 (D311, son choix E) : le segment « Plié | Déplié » dans l'en-tête de la feuille, « y aller » vers une ligne d'un groupe replié, et la colonne des
 * quantités sur un montant inconnu (M1). Pièce SIMULÉE (aperçu `renovation`, « Brico Fictif SA ») ; Gemini jamais appelé, Drive jamais touché, aucune écriture.
 * Rouges sur l'arbre d'avant (aucun segment). Le rendu réel : `voies/r4-port-d/capturer-d.mjs`.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const ligne = (id: number, name: string, kind: string, quantity: number | null, unit: string, price: number | null, amountTTC: number | null, stockCategory = '') =>
  ({ id: `line-${id}`, name, kind, quantity, unit, price, amountTTC, reference: '', variant: '', stockCategory, evidence: `${name} (page 1)`, ambiguity: '', vatCode: 'N', alphaPct: null, alphaPctLu: null });
const lire = async (items?: Array<ReturnType<typeof ligne>>) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const result = JSON.parse(JSON.stringify((apercuDepense('renovation').outcome as any).result));
  if (items) { result.items = items; result.printedLineCount = items.length; result.amountTTC = Math.round(items.reduce((a, i) => a + (i.amountTTC ?? 0), 0) * 100) / 100; }
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-travaux.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
type Vue = ReturnType<typeof render>;
const segment = (v: Vue) => v.container.querySelector<HTMLElement>('[data-dp-plier]');
const bouton = (v: Vue, cle: 'plie' | 'deplie') => segment(v)!.querySelector<HTMLButtonElement>(`[data-dp-plier-bouton="${cle}"]`)!;
const allume = (v: Vue) => ['plie', 'deplie'].filter(c => bouton(v, c as 'plie' | 'deplie').getAttribute('aria-pressed') === 'true');
const lignes = (v: Vue, cle = 'renovation') => [...v.container.querySelectorAll<HTMLElement>(`[data-dp-bande="${cle}"] [data-dp-sg-ligne]`)];
const etats = (v: Vue, cle = 'renovation') => lignes(v, cle).map(l => `${l.querySelector('span:nth-child(2)')!.textContent}=${l.getAttribute('aria-expanded')}`);
const groupe = (v: Vue, nom: string) => v.container.querySelector<HTMLElement>(`[data-dp-sg="${nom}"]`)!;
const toucher = (v: Vue, nom: string) => fireEvent.click(groupe(v, nom).querySelector('[data-dp-sg-ligne]')!);

// Six lignes de travaux, dont une sans montant ni unité (rouge) dans « Électricité » : son groupe s'ouvre d'office.
const AVERIFIER = () => [
  ligne(1, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89, 89), ligne(2, 'Visseuse sans fil 18 V', 'equipment', 1, 'Stk', 99, 99),
  ligne(3, 'Mitigeur lavabo chromé', 'equipment', 1, 'Stk', 54, 54), ligne(4, 'Siphon de sol inox', 'equipment', 1, 'Stk', 46, 46),
  ligne(5, 'Interrupteur va-et-vient blanc', 'equipment', 3, 'Stk', 7.8, 23.4), ligne(6, 'Câble 3G1,5 10 m', 'equipment', null, '', null, null),
];

describe('D311 : le segment « Plié | Déplié » de son choix E', () => {
  it('au repos d\'une lecture, il est dans l\'en-tête de la feuille, entre le titre et le justificatif, « Plié » allumé', async () => {
    const v = await lire();
    const s = segment(v)!;
    expect(s.getAttribute('role')).toBe('group'); expect(s.getAttribute('aria-label')).toBe('Sous-groupes');
    const entete = s.closest('header')!;
    expect(entete.textContent).toContain('Nouvelle dépense');
    const ordre = [...entete.children].map(c => c === s ? 'segment' : c.tagName === 'H2' ? 'titre' : 'autre');
    expect(ordre.indexOf('titre')).toBeLessThan(ordre.indexOf('segment'));
    expect(ordre.indexOf('segment')).toBeLessThan(ordre.length - 1);
    expect([...s.querySelectorAll('button')].map(b => b.textContent)).toEqual(['Plié', 'Déplié']);
    expect(allume(v)).toEqual(['plie']);
  });
  it('« Déplié » ouvre tous les groupes et s\'allume seul ; « Plié » les replie et s\'allume seul', async () => {
    const v = await lire();
    fireEvent.click(bouton(v, 'deplie'));
    expect(etats(v).every(x => x.endsWith('=true'))).toBe(true); expect(allume(v)).toEqual(['deplie']);
    fireEvent.click(bouton(v, 'plie'));
    expect(etats(v).every(x => x.endsWith('=false'))).toBe(true); expect(allume(v)).toEqual(['plie']);
  });
  it('un toucher après « Plié » ouvre un groupe et éteint « Plié » (état mêlé : aucun des deux)', async () => {
    const v = await lire();
    fireEvent.click(bouton(v, 'deplie')); fireEvent.click(bouton(v, 'plie'));
    toucher(v, 'Outillage');
    expect(etats(v).filter(x => x.endsWith('=true'))).toEqual(['Outillage=true']);
    expect(allume(v)).toEqual([]);
    toucher(v, 'Outillage');
    expect(allume(v)).toEqual(['plie']); // l'état est celui des groupes : refermé, il redevient « Plié »
  });
  it('« Déplié » puis un toucher replie un groupe : mêlé, et chaque groupe reste libre', async () => {
    const v = await lire();
    fireEvent.click(bouton(v, 'deplie')); toucher(v, 'Peinture et sols');
    expect(etats(v)).toContain('Peinture et sols=false'); expect(allume(v)).toEqual([]);
    toucher(v, 'Peinture et sols'); expect(allume(v)).toEqual(['deplie']);
  });
  it('D333 : « Plié » ferme aussi le groupe à vérifier ; un toucher le rouvre ; « Plié » le referme', async () => {
    const v = await lire(AVERIFIER());
    expect(etats(v)).toEqual(['Outillage=false', 'Électricité=true', 'Plomberie=false']); // au repos : le groupe rouge est ouvert d'office
    expect(allume(v)).toEqual([]); // mêlé
    fireEvent.click(bouton(v, 'deplie'));
    expect(etats(v).every(x => x.endsWith('=true'))).toBe(true);
    fireEvent.click(bouton(v, 'plie'));
    expect(etats(v)).toEqual(['Outillage=false', 'Électricité=false', 'Plomberie=false']); // D333 : tout plié, Électricité aussi
    expect(allume(v)).toEqual(['plie']);
    toucher(v, 'Électricité');
    expect(etats(v)).toEqual(['Outillage=false', 'Électricité=true', 'Plomberie=false']); expect(allume(v)).toEqual([]);
    fireEvent.click(bouton(v, 'plie'));
    expect(etats(v)).toEqual(['Outillage=false', 'Électricité=false', 'Plomberie=false']); expect(allume(v)).toEqual(['plie']);
  });
  it('« Plié » ferme le plateau ouvert d\'une rangée d\'un groupe qu\'il replie (sinon la rangée garderait son groupe ouvert)', async () => {
    const v = await lire(AVERIFIER());
    toucher(v, 'Outillage');
    const d = groupe(v, 'Outillage').querySelector<HTMLDetailsElement>('article details')!;
    d.open = true; fireEvent(d, new Event('toggle'));
    await waitFor(() => expect(allume(v)).toEqual([]));
    fireEvent.click(bouton(v, 'plie'));
    await waitFor(() => expect(etats(v)).toEqual(['Outillage=false', 'Électricité=false', 'Plomberie=false']));
    expect(groupe(v, 'Outillage').querySelector<HTMLDetailsElement>('article details')!.open).toBe(false);
  });
  it('segment absent en vue Papier', async () => {
    const v = await lire();
    expect(segment(v)).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Papier' }));
    expect(segment(v)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Catégorie' }));
    expect(segment(v)).not.toBeNull();
  });
  it('segment absent sur une dépense sans bande à deux sous-familles pliables', async () => {
    const v = await lire([ligne(1, 'Ponceuse excentrique 125 mm', 'equipment', 1, 'Stk', 89, 89), ligne(2, 'Visseuse sans fil 18 V', 'equipment', 1, 'Stk', 99, 99)]);
    expect(segment(v)).toBeNull();
  });
});

describe('« Y aller » vers une ligne d\'un groupe replié (critique r4)', () => {
  it('une erreur sur une ligne d\'un groupe replié rouvre son groupe, la cible est visible et a le focus', async () => {
    const v = await lire(AVERIFIER());
    toucher(v, 'Électricité'); // le brasseur referme le groupe à vérifier : sa rangée rouge est cachée
    expect(groupe(v, 'Électricité').querySelector<HTMLElement>('[data-dp-sg-corps]')!.hidden).toBe(true);
    // Chrome ne donne pas le focus à un élément caché : au moment du `focus()`, la cible ne doit plus être dans un conteneur `hidden` (le groupe s'ouvre AVANT, de façon synchrone).
    const cachee: boolean[] = [];
    const focusOrigine = HTMLElement.prototype.focus;
    vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(function (this: HTMLElement, ...a: any[]) { cachee.push(this.closest('[hidden]') !== null); return focusOrigine.apply(this, a as any); });
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/ }));
    expect(cachee.length).toBeGreaterThan(0);
    expect(cachee).not.toContain(true);
    await waitFor(() => expect(groupe(v, 'Électricité').querySelector<HTMLElement>('[data-dp-sg-ligne]')!.getAttribute('aria-expanded')).toBe('true'));
    const cible = document.activeElement as HTMLElement;
    expect(cible).not.toBe(document.body);
    expect(groupe(v, 'Électricité').contains(cible)).toBe(true);
    expect(cible.closest('[hidden]')).toBeNull();
  });
});
