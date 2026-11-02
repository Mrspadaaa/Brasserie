// @vitest-environment jsdom
/**
 * Voie e-finitions (lenteur D) : les retours du critique (VERDICT-e-ecran, majeurs 1 et 2, mineur 2) et les défauts vus au banc Chrome (b-lenteur, défauts 1, 2, 3 et 6).
 * Témoins (a) à (h) du critère 1 de la voie. Lectures FICTIVES (Brauhaus Ouest, `lecturesLenteur` de apercuDev.ts), flux simulé : Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ transactions: [] as any[], saved: vi.fn(), scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }), getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { apercuDepense, lecturesLenteur, type VarianteLenteur } from '../../../../src/ui/depense/apercuDev';
import { appliquerFinale, baseDeBrouillon, brouillonDeLecture, libelleAvant, type Registres } from '../../../../src/ui/depense/finale';
import type { PurchaseDraft, PurchaseLineDraft } from '../../../../src/services/purchaseEntry';

const sortie = (result: any, extra: Record<string, unknown> = {}) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result, ...extra });
const coupe = (error: string) => ({ ok: false, error, proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf' });
const porte = () => { let ouvre!: () => void; const promesse = new Promise<void>(r => { ouvre = r; }); return { promesse, ouvre }; };

interface Options {
  patch?: (r: any, final: boolean) => void; sans?: boolean;
  /** Ce que rend le PREMIER appel une fois la porte ouverte (par défaut : le final). */
  premier?: (final: any) => any;
  /** Ce que rend le N-ième appel (N ≥ 2) : la relance. */
  suite?: (n: number, opts: any, final: any) => any;
}
async function lire(variante: VarianteLenteur, o: Options = {}) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final, jeton } = lecturesLenteur(variante), stocks = apercuDepense(`lenteur-${variante}`).stocks;
  (stocks as any).rawMaterials.forEach((a: any) => { a.currentStock = 1; });
  for (const r of [provisoire, final]) for (const i of r?.items ?? []) if (i.name === 'Sucre candi') i.unit = 'Kg';
  for (const r of [provisoire, final]) if (r) o.patch?.(r, r === final);
  const g = porte();
  state.scanned.mockImplementation(async (_f: any, _t: any, opts: any) => {
    const n = state.scanned.mock.calls.length;
    if (n >= 2) return o.suite ? o.suite(n, opts, final) : sortie(final);
    if (provisoire && !o.sans) opts?.onProvisoire?.(sortie(provisoire, { jeton }));
    await g.promesse;
    return o.premier ? o.premier(final) : sortie(final);
  });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  const arrive = async () => { await act(async () => { g.ouvre(); await g.promesse; await new Promise(r => setTimeout(r, 0)); }); };
  return { view, arrive };
}
const principal = (view: ReturnType<typeof render>) => view.container.querySelector<HTMLButtonElement>('button[data-primary]')!;
const ligne = (view: ReturnType<typeof render>, id: string) => view.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`)!;
const fil = (view: ReturnType<typeof render>) => view.container.querySelector('[data-dp="fil"]');
const rangeePreuve = (view: ReturnType<typeof render>, debut: string) => [...view.container.querySelectorAll<HTMLElement>('[data-dp="preuve"] button')].find(b => b.textContent?.includes(debut))!;
const attendre = async () => screen.findByRole('region', { name: 'Vérification du justificatif' });
const taper = (label: string, valeur: string) => fireEvent.change(screen.getByLabelText(label), { target: { value: valeur } });

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.transactions = [];
  state.traduire.mockResolvedValue(new Map());
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('(a) majeur 1 : « Qté × prix n/n » lit sa frappe, pas le serveur', () => {
  it('(a) il tape 12 dans la quantité de Pilsner pendant l’attente : après le final, « Qté × prix 6/7 », sans coche', async () => {
    const { view, arrive } = await lire('lue');
    await attendre();
    taper('Quantité ligne 1', '12');
    await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    const rangee = rangeePreuve(view, 'Qté × prix');
    expect(rangee.textContent).toMatch(/Qté × prix\s*6\/7/);
    expect(rangee.querySelector('svg')).toBeNull(); // pas de coche : 12 × 2,90 ≠ 14,50
  });
  it('(a’) le même geste sur une lecture ordinaire, sans lenteur : « 7/7 » coché avant, « 6/7 » sans coche après', async () => {
    const { view, arrive } = await lire('sans-38', { sans: true });
    await arrive(); await attendre();
    expect(fil(view)).toBeNull();
    expect(rangeePreuve(view, 'Qté × prix').textContent).toMatch(/Qté × prix\s*7\/7/);
    expect(rangeePreuve(view, 'Qté × prix').querySelector('svg')).not.toBeNull();
    taper('Quantité ligne 1', '12');
    await waitFor(() => expect(rangeePreuve(view, 'Qté × prix').textContent).toMatch(/Qté × prix\s*6\/7/));
    expect(rangeePreuve(view, 'Qté × prix').querySelector('svg')).toBeNull();
  });
});

describe('(a’’) devise étrangère : le récap garde les contrôles de la lecture', () => {
  it('une lecture en EUR à 7 lignes justes : « Qté × prix 7/7 » avec sa coche (les montants de lignes n’existent pas en CHF : jamais « 0/7 »)', async () => {
    const { view, arrive } = await lire('sans-38', { sans: true, patch: r => { r.currency = 'EUR'; } });
    await arrive(); await attendre();
    const rangee = rangeePreuve(view, 'Qté × prix');
    expect(rangee.textContent).toMatch(/Qté × prix\s*7\/7/);
    expect(rangee.querySelector('svg')).not.toBeNull();
  });
});

describe('(b), (c) majeur 2 : une cellule d’en-tête corrigée porte sa marque, ou n’est pas comptée', () => {
  it('(b) une 3.8 qui corrige la TVA seule : la case TVA en bleu, l’ancienne valeur barrée, puce « 1 corrigée »', async () => {
    const { view, arrive } = await lire('entete');
    await attendre();
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull();
    await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    const tuile = view.container.querySelector<HTMLElement>('[data-dp="tuile-tva"]')!;
    expect(tuile.getAttribute('data-dp-corrige')).toBe('1');
    expect(tuile.querySelector('[data-dp-avant]')?.textContent).toBe('3,38');
    expect(tuile.querySelector('s')?.textContent).toBe('3,38'); // barrée
    expect(tuile.textContent).toMatch(/3,48/);
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/1\s*corrigée(?!s)/);
    expect(view.container.querySelector('[data-dp="tuile-paye"]')!.getAttribute('data-dp-corrige')).toBeNull(); // le règlement n'a pas changé
  });
  it('(b’) le règlement corrigé par la 3.8 : sa case en bleu, l’ancien état barré, compté', async () => {
    const { view, arrive } = await lire('entete', { patch: (r, final) => { r.tvaAmount = 3.48; r.paymentEvidence = final ? 'unpaid' : 'paid'; } });
    await attendre(); await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    const tuile = view.container.querySelector<HTMLElement>('[data-dp="tuile-paye"]')!;
    expect(tuile.getAttribute('data-dp-corrige')).toBe('1');
    expect(tuile.querySelector('[data-dp-avant]')?.textContent).toMatch(/Payé/);
    expect(view.container.querySelector('[data-dp="tuile-tva"]')!.getAttribute('data-dp-corrige')).toBeNull();
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/1\s*corrigée(?!s)/);
  });
  it('(c) un champ sans case (n° de facture) corrigé : appliqué, mais pas compté, aucune puce', async () => {
    const { view, arrive } = await lire('entete', { patch: (r, final) => { r.tvaAmount = 3.48; if (final) r.invoiceNumber = 'F-4411'; } });
    await attendre(); await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    expect((view.container.querySelector('#purchase-invoice-number') as HTMLInputElement).value).toBe('F-4411');
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull();
    expect(view.container.querySelector('[data-dp="tuile-tva"]')!.getAttribute('data-dp-corrige')).toBeNull();
  });
});

describe('(d) mineur 2 : le barré ne montre que ce qui a changé', () => {
  it('(d) quantité tapée par lui, seul le prix corrigé : « × 1,45 », jamais « 12 Kg × 1,45 »', async () => {
    const { view, arrive } = await lire('lue');
    await attendre();
    taper('Quantité ligne 1', '12');
    await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    expect(ligne(view, 'line-1').querySelector('[data-dp-avant]')?.textContent).toBe('× 1,45');
  });
  it('(d’) pur : quantité à lui + prix corrigé → « × 1,45 » ; quantité inchangée → « 10 Kg × 1,45 » ; quantité corrigée → l’ancienne', () => {
    const base = { quantity: 10, unit: 'Kg', unitPrice: 1.45 };
    expect(libelleAvant(base, [{ champ: 'unitPrice' }], { quantity: 12, unit: 'Kg' })).toBe('× 1,45');
    expect(libelleAvant(base, [{ champ: 'unitPrice' }], { quantity: 10, unit: 'Kg' })).toBe('10 Kg × 1,45');
    expect(libelleAvant(base, [{ champ: 'unitPrice' }, { champ: 'quantity' }], { quantity: 5, unit: 'Kg' })).toBe('10 Kg × 1,45');
  });
});

describe('(e) hors ligne pendant la 3.8 : relancer une fois au retour du réseau', () => {
  const coupure = () => vi.spyOn(navigator, 'onLine', 'get');
  const evenement = async (nom: 'offline' | 'online') => { await act(async () => { window.dispatchEvent(new Event(nom)); await new Promise(r => setTimeout(r, 0)); }); };
  it('le fil et la roue restent pendant la coupure ; au retour, UN seul second appel, et le final s’applique', async () => {
    const reseau = coupure().mockReturnValue(true);
    const { view, arrive } = await lire('lue', { premier: () => coupe('Le réseau a coupé.') });
    await attendre();
    reseau.mockReturnValue(false); await evenement('offline');
    await arrive();
    expect(fil(view)).not.toBeNull(); expect(principal(view)).toBeDisabled(); expect(state.scanned).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull();
    reseau.mockReturnValue(true); await evenement('online');
    await waitFor(() => expect(fil(view)).toBeNull());
    expect(state.scanned).toHaveBeenCalledTimes(2); // une seule relance
    expect(principal(view)).toBeEnabled();
    expect(view.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/3\s*corrigées/); // le final s'applique
    await evenement('online'); expect(state.scanned).toHaveBeenCalledTimes(2);
  });
  it('la relance échoue : la forme de la 3.8 coupée (« 2 lectures », « Lecture coupée »), et pas de troisième appel', async () => {
    const reseau = coupure().mockReturnValue(true);
    const { view, arrive } = await lire('lue', { premier: () => coupe('Le réseau a coupé.'), suite: () => coupe('Toujours coupé.') });
    await attendre();
    reseau.mockReturnValue(false); await evenement('offline');
    await arrive();
    reseau.mockReturnValue(true); await evenement('online');
    await waitFor(() => expect(fil(view)).toBeNull());
    expect(state.scanned).toHaveBeenCalledTimes(2);
    expect(principal(view)).toBeEnabled();
    expect(view.container.querySelector('[data-dp="preuve"]')!.textContent).toMatch(/2[/]2/); expect(view.container.textContent).toMatch(/Lecture coupée/);
    expect(view.container.querySelector('[data-va="corrigees"]')).toBeNull();
    await evenement('online'); await evenement('online'); expect(state.scanned).toHaveBeenCalledTimes(2);
  });
  it('en ligne, un échec de la 3.8 ne relance rien : la fin de partie est immédiate', async () => {
    coupure().mockReturnValue(true);
    const { view, arrive } = await lire('lue', { premier: () => coupe('Lecture indisponible.') });
    await attendre(); await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    expect(state.scanned).toHaveBeenCalledTimes(1);
  });
});

describe('(f) le message du serveur après un provisoire sans final', () => {
  it('(f) flux fermé sans résultat : la fin de partie dit le message, à côté de « Lecture coupée »', async () => {
    const message = 'Le serveur a fermé la connexion avant la fin de la lecture.';
    const { view, arrive } = await lire('lue', { premier: () => coupe(message) });
    await attendre(); await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    expect(view.container.querySelector('[role="alert"]')?.textContent).toContain(message);
    expect(view.container.textContent).toMatch(/Lecture coupée/);
    expect(principal(view)).toBeEnabled();
  });
});

describe('(g) pièce HT : les deux phrases restent visibles, la plus grave d’abord', () => {
  it('(g) « Les totaux HT + TVA ne correspondent pas… » puis « Lignes imprimées hors taxe, passées au TTC. »', async () => {
    const grave = 'Les totaux HT + TVA ne correspondent pas au TTC du document.', ht = 'Lignes imprimées hors taxe, passées au TTC.';
    const { view, arrive } = await lire('sans-38', { sans: true, patch: r => { r.lignesPasseesAuTtc = true; r.issues = [grave]; } });
    await arrive(); await attendre();
    const indice = view.container.querySelector('#scan-hint-amountTTC')!.textContent ?? '';
    expect(indice).toContain(grave); expect(indice).toContain(ht);
    expect(indice.indexOf(grave)).toBeLessThan(indice.indexOf(ht));
    const preuve = view.container.querySelector('[data-dp="preuve"]')!.textContent ?? '';
    expect(preuve).toContain(ht); expect(preuve).toContain(grave); // visibles à l'écran, pas seulement lues
    expect(preuve.indexOf(grave)).toBeLessThan(preuve.indexOf(ht));
  });
  it('(g’) seule, la phrase HT reste visible', async () => {
    const { view, arrive } = await lire('sans-38', { sans: true, patch: r => { r.lignesPasseesAuTtc = true; } });
    await arrive(); await attendre();
    expect(view.container.querySelector('[data-dp="preuve"]')!.textContent).toContain('Lignes imprimées hors taxe, passées au TTC.');
  });
});

describe('(h) sa saisie, cellule par cellule', () => {
  const renomme = (r: any, final: boolean) => { if (final) r.items[0].name = 'Pilsner Malz'; };
  it('(h) le focus posé dans une rangée sans changer la valeur : la 3.8 corrige toute la rangée (nom et quantité)', async () => {
    const { view, arrive } = await lire('lue', { patch: renomme });
    await attendre();
    const champ = screen.getByLabelText('Quantité ligne 1') as HTMLInputElement;
    act(() => champ.focus()); expect(document.activeElement).toBe(champ);
    await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    const r = ligne(view, 'line-1');
    expect((r.querySelector('[aria-label="Quantité ligne 1"]') as HTMLInputElement).value).toMatch(/^5/);
    expect(r.querySelector('[data-dp-qte]')?.getAttribute('data-dp-corrige')).toBe('1');
    expect(r.querySelector('[data-dp-nom]')?.textContent).toMatch(/Pilsner Malz/);
  });
  it('(h’) la quantité changée : seule la quantité est gardée, le nom et le prix sont corrigés', async () => {
    const { view, arrive } = await lire('lue', { patch: renomme });
    await attendre();
    taper('Quantité ligne 1', '12');
    await arrive();
    await waitFor(() => expect(fil(view)).toBeNull());
    const r = ligne(view, 'line-1');
    expect((r.querySelector('[aria-label="Quantité ligne 1"]') as HTMLInputElement).value).toMatch(/^12/);
    expect(r.querySelector('[data-dp-qte]')?.getAttribute('data-dp-corrige')).toBeNull();
    expect(r.querySelector('[data-dp-prix]')?.getAttribute('data-dp-corrige')).toBe('1');
    expect(r.querySelector('[data-dp-nom]')?.textContent).toMatch(/Pilsner Malz/);
  });
  it('(h’’) pur : `registres.focus` ne rend plus une rangée « touchée »', () => {
    const ligneVide = (): PurchaseLineDraft => ({ id: 'x', description: '', kind: 'ingredient', unit: '', stockAction: 'none', equipmentAction: 'none' });
    const vide = (): PurchaseDraft => ({ submissionId: 'S1', date: '02.11.2026', vendor: '', invoiceNumber: '', description: '', category: 'brassage', lines: [], paymentStatus: 'paid', paymentMethod: 'bank', paymentDate: '02.11.2026', dueDate: '', sourceCurrency: 'CHF' });
    const { provisoire, final } = lecturesLenteur('lue');
    const { draft, propositions } = brouillonDeLecture(vide(), provisoire!, { stockItems: [], today: '02.11.2026', ligneVide });
    const base = baseDeBrouillon(draft, 'jeton-lenteur', propositions, provisoire!.items.length);
    const registres: Registres = { reviewedFields: [], manuallyClassified: new Set(), proposes: new Set(propositions.proposedStock), neufsOffice: new Set(propositions.neufDOffice), reglees: new Set(), focus: 'line-1' };
    const s = appliquerFinale({ base, courant: draft, provisoire: provisoire!, final, stockItems: [], today: '02.11.2026', registres, ligneVide });
    expect(s.draft.lines.find(l => l.id === 'line-1')).toMatchObject({ quantity: 5, unitPrice: 2.9 });
  });
});
