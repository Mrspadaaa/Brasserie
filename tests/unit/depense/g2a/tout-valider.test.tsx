// @vitest-environment jsdom
/**
 * Voie g2a-ecran, D329 (son choix B étendu, D313 : « Tout validé les changements. Mais aussi un à 1 ») : le bandeau au pouce est la file de TOUS les changements de la 3e lecture encore à trancher,
 * dans l'ordre : lignes pas retrouvées, valeurs corrigées, lignes ajoutées, désaccords qui pèsent. Lectures FICTIVES (Brauhaus Ouest, `lecturesLenteur`), flux simulé, Gemini jamais appelé.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const sortie = (result: any, extra: Record<string, unknown> = {}) => ({ ok: true, model: 'rejeu', proofDataUrl: '', fileName: 'f.pdf', mimeType: 'application/pdf', result, ...extra });
const porte = () => { let ouvre!: () => void; const promesse = new Promise<void>(r => { ouvre = r; }); return { promesse, ouvre }; };
const DESACCORD = (champ: string, ligne: number | null = null) => ({ code: 'lectures-divergentes', cle: `k-${champ}`, message: `Les lectures divergent sur ${champ}.`, champ, champs: [champ], ligne, lu: null, calcule: null, ecart: null, unite: 'nombre', gravite: 'ecart', origine: 'lecture', enjeu: 'info', bloque: false, regle: 'r' });

async function lire(variante: VarianteLenteur, patch?: (r: any, final: boolean) => void) {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const { provisoire, final, jeton } = lecturesLenteur(variante), stocks = apercuDepense(`lenteur-${variante}`).stocks;
  (stocks as any).rawMaterials.forEach((a: any) => { a.currentStock = 1; });
  for (const r of [provisoire, final]) for (const i of r?.items ?? []) if (i.name === 'Sucre candi') i.unit = 'Kg';
  for (const r of [provisoire, final]) if (r) patch?.(r, r === final);
  const g = porte();
  state.scanned.mockImplementation(async (_f: any, _t: any, opts: any) => { if (provisoire) opts?.onProvisoire?.(sortie(provisoire, { jeton })); await g.promesse; return sortie(final); });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  if (!provisoire) g.ouvre(); // sans morceau provisoire, l'écran n'arrive qu'avec la lecture entière
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  await act(async () => { g.ouvre(); await g.promesse; await new Promise(r => setTimeout(r, 0)); });
  await waitFor(() => expect(view.container.querySelector('[data-dp="fil"]')).toBeNull());
  return view;
}
type Vue = ReturnType<typeof render>;
const bandeau = (v: Vue) => v.container.querySelector<HTMLElement>('[data-dp="perdues"]');
const geste = (v: Vue, g: string) => bandeau(v)!.querySelector<HTMLButtonElement>(`[data-dp-perdue-geste="${g}"]`)!;
const rang = (v: Vue) => bandeau(v)!.querySelector('[data-dp-perdue-rang]')?.textContent;
const mot = (v: Vue) => bandeau(v)!.querySelector('[data-dp-perdue-mot]')?.textContent ?? '';
const nom = (v: Vue) => bandeau(v)!.querySelector('[data-dp-perdue-nom]')?.textContent ?? '';
const ligne = (v: Vue, id: string) => v.container.querySelector<HTMLElement>(`[data-dp-ligne="${id}"]`);
const champ = (v: Vue, id: string, nomChamp: string, n: number) => (ligne(v, id)!.querySelector(`[aria-label="${nomChamp} ligne ${n}"]`) as HTMLInputElement).value;
const principal = (v: Vue) => v.container.querySelector<HTMLButtonElement>('button[data-primary]')!;

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.traduire.mockReset(); state.traduire.mockResolvedValue(new Map()); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('D329 : les valeurs corrigées passent par le bandeau', () => {
  it('trois corrections, aucune ligne perdue : le bandeau existe, « 2 valeurs corrigées · 1/3 » sur Pilsner, « Tout valider » dès 2 éléments', async () => {
    const v = await lire('lue');
    expect(bandeau(v)).not.toBeNull();
    expect(nom(v)).toBe('Malt Pilsner'); expect(mot(v)).toMatch(/^2 valeurs corrigées/); expect(rang(v)).toBe('1/3');
    expect(geste(v, 'garder')).toBeEnabled(); expect(geste(v, 'annuler')).toBeEnabled(); expect(geste(v, 'tout')).toBeEnabled();
    expect(bandeau(v)!.querySelector('[data-dp-perdue-geste="retirer"]')).toBeNull();
  });
  it('« Garder » : la correction reste (bleu, puce) et le bandeau passe à la suivante (2/3) ; « Annuler » rend la valeur du provisoire et ôte le bleu et un de la puce', async () => {
    const v = await lire('lue');
    fireEvent.click(geste(v, 'garder'));
    await waitFor(() => expect(nom(v)).toBe('Sabro'));
    expect(rang(v)).toBe('2/3'); expect(mot(v)).toMatch(/^quantité corrigée/);
    expect(ligne(v, 'line-1')!.querySelector('[data-dp-qte]')!.getAttribute('data-dp-corrige')).toBe('1'); expect(champ(v, 'line-1', 'Quantité', 1)).toMatch(/^5/);
    expect(v.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/3\s*corrigées/);
    fireEvent.click(geste(v, 'annuler'));
    await waitFor(() => expect(nom(v)).toBe('Citra'));
    expect(ligne(v, 'line-4')!.querySelector('[data-dp-corrige]')).toBeNull(); expect((ligne(v, 'line-4')!.querySelector('[aria-label="Unité ligne 4"]') as HTMLInputElement).value).toBe('');
    expect(v.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/2\s*corrigées/);
    expect(rang(v)).toBe('3/3');
    fireEvent.click(geste(v, 'garder'));
    await waitFor(() => expect(bandeau(v)).toBeNull());
  });
  it('« Annuler » sur Pilsner : quantité et prix du provisoire reviennent (10 Kg × 1,45)', async () => {
    const v = await lire('lue');
    expect(champ(v, 'line-1', 'Quantité', 1)).toMatch(/^5/);
    fireEvent.click(geste(v, 'annuler'));
    await waitFor(() => expect(nom(v)).toBe('Sabro'));
    expect(champ(v, 'line-1', 'Quantité', 1)).toBe('10'); expect(champ(v, 'line-1', 'Prix', 1)).toBe('1,45');
    expect(ligne(v, 'line-1')!.querySelector('[data-dp-avant]')).toBeNull();
  });
  it('« Tout valider » garde tout d’un toucher : le bandeau part, les corrections restent bleues, la puce garde son compte', async () => {
    const v = await lire('lue');
    fireEvent.click(geste(v, 'tout'));
    await waitFor(() => expect(bandeau(v)).toBeNull());
    expect(ligne(v, 'line-1')!.querySelector('[data-dp-qte]')!.getAttribute('data-dp-corrige')).toBe('1');
    expect(v.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/3\s*corrigées/);
  });
  it('« Confirmer » sans trancher : tout est gardé (la quantité corrigée est enregistrée)', async () => {
    const v = await lire('lue');
    fireEvent.click(principal(v));
    await waitFor(() => expect(state.saved).toHaveBeenCalled());
    const l = state.saved.mock.calls[0][0].lines.find((x: any) => x.description === 'Malt Pilsner');
    expect(l.quantity).toBe(5); expect(l.unitPrice).toBe(2.9);
  });
});

describe('D329 : l’ordre — pas retrouvées, corrigées, ajoutées, désaccords', () => {
  it('deux lignes pas retrouvées puis les trois corrections : « 1/5 », « 2/5 », « 3/5 » ; Retirer reste pour une ligne perdue', async () => {
    const v = await lire('perdues-2');
    expect(nom(v)).toBe('Avoine maltée'); expect(mot(v)).toMatch(/pas retrouvée/); expect(rang(v)).toBe('1/5');
    expect(geste(v, 'retirer')).toBeEnabled();
    fireEvent.click(geste(v, 'retirer'));
    await waitFor(() => expect(nom(v)).toBe('Amarillo'));
    expect(rang(v)).toBe('2/5');
    fireEvent.click(geste(v, 'garder'));
    await waitFor(() => expect(mot(v)).toMatch(/corrigé/));
    expect(nom(v)).toBe('Malt Pilsner'); expect(rang(v)).toBe('3/5');
  });
  it('« Tout valider » : les lignes perdues partent, les corrections restent', async () => {
    const v = await lire('perdues-2');
    expect(v.container.querySelectorAll('[data-dp-perdue]')).toHaveLength(2);
    fireEvent.click(geste(v, 'tout'));
    await waitFor(() => expect(bandeau(v)).toBeNull());
    expect(v.container.querySelectorAll('[data-dp-perdue]')).toHaveLength(0);
    expect(ligne(v, 'line-1')!.querySelector('[data-dp-corrige]')).not.toBeNull();
  });
  it('la ligne ajoutée vient après les corrections : « ajoutée », Garder ou Retirer (la ligne et un de la puce partent)', async () => {
    const v = await lire('ajoutee');
    expect(rang(v)).toBe('1/4');
    fireEvent.click(geste(v, 'garder'));
    await waitFor(() => expect(rang(v)).toBe('2/4'));
    fireEvent.click(geste(v, 'garder')); await waitFor(() => expect(rang(v)).toBe('3/4'));
    fireEvent.click(geste(v, 'garder')); await waitFor(() => expect(mot(v)).toMatch(/ajoutée/));
    expect(nom(v)).toBe('Mosaic'); expect(rang(v)).toBe('4/4'); expect(geste(v, 'retirer')).toBeEnabled();
    expect(bandeau(v)!.querySelector('[data-dp-perdue-geste="tout"]')).toBeNull(); // une seule ligne restante : pas de « Tout valider »
    fireEvent.click(geste(v, 'retirer'));
    await waitFor(() => expect(bandeau(v)).toBeNull());
    expect(ligne(v, 'line-8')).toBeNull();
    expect(v.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/3\s*corrigées/);
  });
  it('un désaccord qui pèse vient en dernier ; c’est une valeur reprise : il compte dans « à contrôler » (pas de puce à part) ; « Garder » règle le point et le bandeau part', async () => {
    const v = await lire('sans-38', r => { r.points = [DESACCORD('vendor', null)]; });
    expect(bandeau(v)).not.toBeNull();
    expect(mot(v)).toMatch(/désaccord/); expect(geste(v, 'voir')).toBeEnabled(); expect(geste(v, 'garder')).toBeEnabled();
    const controler = () => Number(v.container.querySelector('[data-va="controler"]')?.textContent?.match(/\d+/)?.[0] ?? 0);
    const avant = controler(); expect(avant).toBeGreaterThanOrEqual(1); // le désaccord y est compté
    expect(v.container.querySelector('[data-va="desaccords"]')).toBeNull(); expect(v.container.querySelector('[data-dp-chip="Désaccord|"]')).toBeNull();
    fireEvent.click(geste(v, 'garder'));
    await waitFor(() => expect(bandeau(v)).toBeNull());
    expect(controler()).toBe(avant - 1);
  });
  it('« Voir » ouvre la rangée du désaccord et le bandeau reste jusqu’à « Garder »', async () => {
    const v = await lire('sans-38', r => { r.points = [DESACCORD('items.2.price', 2)]; });
    expect(ligne(v, 'line-2')!.querySelector<HTMLDetailsElement>('details')!.open).toBe(false);
    fireEvent.click(geste(v, 'voir'));
    await waitFor(() => expect(ligne(v, 'line-2')!.querySelector<HTMLDetailsElement>('details')!.open).toBe(true));
    expect(bandeau(v)).not.toBeNull();
  });
});

describe('B1 (remplace D328g) : une traduction n’est pas une correction', () => {
  it('le français que la 3e lecture rend d’un nom : la rangée le porte seul, sans nom barré, sans bleu, hors de « ↻ corrigées »', async () => {
    const v = await lire('lue', (r, final) => { if (final) r.items.find((i: any) => i.name === 'Sucre candi').nameFr = 'Sucre candi blond'; });
    expect(ligne(v, 'line-7')!.querySelector('[data-dp-nom]')!.textContent).toMatch(/Sucre candi blond/);
    expect(ligne(v, 'line-7')!.querySelector('[data-dp-avant]')).toBeNull(); expect(ligne(v, 'line-7')!.querySelector('[data-dp-corrige]')).toBeNull();
    expect(v.container.querySelector('[data-va="corrigees"]')!.textContent).toMatch(/3\s*corrigées/); // Pilsner, Sabro, Citra seulement
    expect(rang(v)).toBe('1/3');
  });
});
