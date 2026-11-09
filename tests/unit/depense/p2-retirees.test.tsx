// @vitest-environment jsdom
/**
 * p2 (jeu en ligne 4, bloquants 1 à 3 et problème 4). Deux tickets lus comme deux pages d'une dépense : les deux premières lectures ont la page 1 et le total 163,85 ; la 3.8 retire la ligne de la page 1,
 * ramène le total à 149,25 (ici : 44,70 sur la lecture de test) et la TVA à 0 ; le terminal affiche toujours le total d'avant. Lecture FICTIVE (`lecturesLenteur`), flux simulé : Gemini jamais appelé.
 * Avant p2 : « Somme = imprimé » vert, « Articles lus = comptés » vert, « Payé · TWINT montant non lu » gris, aucune rangée « retirées », et le total coupé à 390.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], saved: vi.fn(), scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../src/services/firebaseAuth';
import { lecturesLenteur } from '../../../src/ui/depense/apercuDev';

const sortie = (result: any, extra: Record<string, unknown> = {}) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result, ...extra });
const porte = () => { let ouvre!: () => void; const promesse = new Promise<void>(r => { ouvre = r; }); return { promesse, ouvre }; };

/** La pièce : provisoire 46,40 (TVA 0,37) avec Avoine maltée 1,70 ; final 44,70, TVA 0,00, sans Avoine ; terminal TWINT 46,40 aux deux ; dépense « divers » (hors brassage) si demandé. */
async function lire(over: { category?: string; terminal?: number } = {}) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final, jeton } = lecturesLenteur('perdue');
  for (const r of [provisoire!, final]) {
    Object.assign(r, { paymentMethod: 'twint', terminalAmount: over.terminal ?? 46.4, amountPaid: undefined, ...(over.category ? { category: over.category } : {}) });
  }
  Object.assign(provisoire!, { amountTTC: 46.4, tvaAmount: 0.37 });
  Object.assign(final, { amountTTC: 44.7, tvaAmount: 0 });
  const g = porte();
  state.scanned.mockImplementation(async (_f: any, _t: any, opts: any) => {
    opts?.onProvisoire?.(sortie(provisoire, { jeton }));
    await g.promesse;
    return sortie(final);
  });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await act(async () => { g.ouvre(); await g.promesse; await new Promise(r => setTimeout(r, 0)); });
  await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  return view;
}
const rangee = (view: ReturnType<typeof render>, cle: string) => view.container.querySelector<HTMLElement>(`[data-dp="preuve"] [data-dp-controle-cle="${cle}"]`);

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('p2 bloquant 1 : ce que la vérification retire attend sa décision, jamais sous une coche verte', () => {
  it('la ligne retirée (1,70) : rangée rouge « 1 ligne lue puis retirée », « La garder » ; ni « Somme = imprimé » ni « Articles lus = comptés » en vert', async () => {
    const view = await lire();
    const r = rangee(view, 'retirees')!;
    expect(r).not.toBeNull();
    expect(r.textContent).toMatch(/1 ligne lue puis retirée\s*1,70/);
    expect(r.getAttribute('data-dp-ton')).toBe('rouge');
    expect(r.textContent).toMatch(/La garder/);
    const bloc = view.container.querySelector<HTMLElement>('[data-dp="preuve"]')!;
    expect(bloc.querySelector('[data-dp="drapeau"]')!.getAttribute('data-dp-ton')).toBe('rouge');
    for (const cle of ['somme', 'articles']) expect(rangee(view, cle)!.getAttribute('data-dp-verdict')).not.toBe('ok');
    expect(bloc.textContent).not.toMatch(/Somme = imprimé|Articles lus = comptés/);
  });
  it('le total changé (46,40 → 44,70) et la TVA (0,37 → 0,00) ont leur rangée et leur geste « Remettre » ; « Remettre 46,40 » rend le total', async () => {
    const view = await lire();
    expect(rangee(view, 'total-corrige')!.textContent).toMatch(/46,40 → 44,70/);
    expect(rangee(view, 'tva-corrigee')!.textContent).toMatch(/0,37 → 0,00/);
    fireEvent.click(rangee(view, 'total-corrige')!);
    await waitFor(() => expect(rangee(view, 'total-corrige')).toBeNull());
    expect((view.container.querySelector('#purchase-total') as HTMLInputElement).value).toMatch(/46[,.]40/);
  });
  it('« La garder » : la ligne revient dans la dépense, la rangée « retirées » disparaît', async () => {
    const view = await lire();
    fireEvent.click(rangee(view, 'retirees')!);
    await waitFor(() => expect(rangee(view, 'retirees')).toBeNull());
    expect(view.container.querySelector('[data-dp-perdue]')).toBeNull();
    /* le total avait baissé d'exactement cette ligne (46,40 → 44,70 pour 1,70) : il revient avec elle, une seule décision */
    expect((view.container.querySelector('#purchase-total') as HTMLInputElement).value).toMatch(/46[,.]40/);
    expect(rangee(view, 'total-corrige')).toBeNull();
  });
});

describe('p2 bloquant 2 : le terminal qui diffère du total est un « Payé ≠ imprimé » rouge', () => {
  it('terminal 46,40 pour un total de 44,70 : rangée rouge, écart +1,70, geste « Les garder · 1,70 retirés » (le manque est la ligne retirée)', async () => {
    const view = await lire();
    const p = rangee(view, 'paye')!;
    expect(p.getAttribute('data-dp-verdict')).toBe('ecart');
    expect(p.getAttribute('data-dp-ton')).toBe('rouge');
    expect(p.textContent).toMatch(/≠ imprimé\s*46,40 \/ 44,70\+1,70/);
    expect(p.textContent).not.toMatch(/montant non lu/);
    expect(p.textContent).toMatch(/Les garder · 1,70 retirés/);
  });
  it('terminal sans lien avec les lignes retirées : rouge aussi, « Comparer à la photo »', async () => {
    const view = await lire({ terminal: 60 });
    const p = rangee(view, 'paye')!;
    expect(p.getAttribute('data-dp-ton')).toBe('rouge');
    expect(p.textContent).toMatch(/Comparer à la photo/);
  });
});

describe('p2 problème 4 : aucune icône de stock hors brassage, lignes barrées comprises', () => {
  it('dépense « divers » : la ligne barrée n’a pas d’icône de stock ; en brassage, elle l’a toujours', async () => {
    const hors = await lire({ category: 'divers' });
    const perdue = hors.container.querySelector('[data-dp-perdue]')!;
    expect(perdue).not.toBeNull();
    expect(perdue.querySelector('svg, [data-dp-lien]')).toBeNull();
    cleanup();
    const brasse = await lire({ category: 'brassage' });
    expect(brasse.container.querySelector('[data-dp-perdue] svg')).not.toBeNull();
  });
});

describe('p2 bloquant 3 : le total ne se coupe jamais (« 149,; » à 390)', () => {
  it('le total ne rétrécit pas et la valeur barrée est sur sa propre ligne, hors de la rangée du total (la mesure scrollWidth se fait au banc Chrome)', async () => {
    const view = await lire();
    const total = view.container.querySelector<HTMLElement>('[data-dp="total-niveau"]')!;
    expect(total.className).toMatch(/\bshrink-0\b/);
    expect(total.className).not.toMatch(/\bmin-w-0\b/);
    const barre = view.container.querySelector<HTMLElement>('[data-dp="total-avant"]')!;
    expect(barre.textContent).toBe('46,40');
    expect(total.parentElement!.contains(barre)).toBe(false);
    expect(total.parentElement!.className).toMatch(/flex-wrap/);
  });
});

describe('p2 1b côté client : un résultat servi du cache garde la trace de ce que la 3.8 a retiré', () => {
  it('sans flux provisoire, `retirees` du serveur refait les lignes barrées, le total et la TVA changés, et les rangées rouges du bloc', async () => {
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
    const { provisoire, final } = lecturesLenteur('perdue');
    const avoine = provisoire!.items.find(i => i.name === 'Avoine maltée')!;
    Object.assign(final, { paymentMethod: 'twint', terminalAmount: 46.4, amountPaid: undefined, amountTTC: 44.7, tvaAmount: 0 });
    delete (final as any).provisoireJeton; // servi du cache : aucun jeton de flux
    for (const i of final.items) delete (i as any).rangProvisoire;
    (final as any).retirees = { lignes: [{ rang: provisoire!.items.indexOf(avoine), ligne: avoine }], amountTTC: 46.4, tvaAmount: 0.37 };
    state.scanned.mockImplementation(async () => sortie(final));
    const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
    const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
    fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
    await waitFor(() => expect(view.container.querySelector('[data-dp-perdue]')).not.toBeNull());
    await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
    expect(rangee(view, 'retirees')!.textContent).toMatch(/1 ligne lue puis retirée\s*1,70/);
    expect(rangee(view, 'total-corrige')!.textContent).toMatch(/46,40 → 44,70/);
    expect(rangee(view, 'somme')!.getAttribute('data-dp-verdict')).not.toBe('ok');
    expect(rangee(view, 'paye')!.getAttribute('data-dp-ton')).toBe('rouge');
  });
});
