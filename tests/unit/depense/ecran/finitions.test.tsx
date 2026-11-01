// @vitest-environment jsdom
/**
 * Voie p3c-port-b : les finitions du verdict du critique (points 4 et 6 à 9) sur l'écran rendu (facture 372765 SIMULÉE, banc apercuDev, aucun appel, aucune écriture)
 * et les deux fonctions pures qu'elles ajoutent (`sansAlphaDoublon`, `pastilleConversion`). Ce que jsdom ne voit pas (la ligne unique, le pixel) est mesuré par capturer-p3c.mjs.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], saved: vi.fn(), scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/purchaseEntry', async importOriginal => ({ ...await importOriginal<any>(), savePurchaseWithProofReceipt: async (d: any) => { state.saved(structuredClone(d)); return { transactionId: 'TX-test' }; }, confirmPurchase: async () => undefined, purchaseDuplicates: () => [] }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
import { pastilleConversion, sansAlphaDoublon } from '../../../../src/ui/depense/etat';

const ouvrir = async (etat: string) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={apercuDepense(etat)}/>);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const q = (sel: string) => document.querySelector(sel) as HTMLElement;
const qa = (sel: string) => Array.from(document.querySelectorAll(sel)) as HTMLElement[];
const ligneDe = (nom: RegExp) => qa('[data-dp-ligne]').find(l => nom.test(l.querySelector('[data-dp-nom]')?.textContent ?? ''))!;
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.saved.mockReset(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true);
});
afterEach(cleanup);

describe('sansAlphaDoublon : le pourcentage d’α dit deux fois (verdict, point 6)', () => {
  it('retire le pourcentage égal à l’α affiché, quelle que soit sa graphie, et lui seul', () => {
    expect(sansAlphaDoublon('Nelson Sauvin 9.6%', '9,6')).toBe('Nelson Sauvin');
    expect(sansAlphaDoublon('Sabro 13,4 %', '13,4')).toBe('Sabro');
    expect(sansAlphaDoublon('Motueka (8.1%) CH', '8,1')).toBe('Motueka CH');
    expect(sansAlphaDoublon('Target 11.8%', '11,3')).toBe('Target 11.8%'); // un AUTRE pourcentage n'est pas un doublon
    expect(sansAlphaDoublon('Nelson Sauvin 9.6%', undefined)).toBe('Nelson Sauvin 9.6%'); // pas d'α posé : le nom reste entier
    expect(sansAlphaDoublon('9.6%', '9,6')).toBe('9.6%'); // jamais un nom vide
  });
});
describe('pastilleConversion : « = 2 sachets » (verdict, point 7)', () => {
  it('garde l’équivalent seul, au pluriel quand il le faut ; une conversion d’unité reste entière', () => {
    expect(pastilleConversion('2 Stk = 2 sachet')).toBe('= 2 sachets');
    expect(pastilleConversion('1 Stk = 1 sachet')).toBe('= 1 sachet');
    expect(pastilleConversion('25 kg → 25 000 g')).toBe('25 kg → 25 000 g');
    expect(pastilleConversion('6 sachet')).toBe('= 6 sachet');
  });
});

describe('finitions sur l’écran rendu (372765)', () => {
  it('point 6 : « Nelson Sauvin » ne répète plus 9.6 % : le nom et « α 9,6 », l’imprimé entier reste au plateau', async () => {
    await ouvrir('3');
    const l = ligneDe(/Nelson Sauvin/);
    expect(l.querySelector('[data-dp-nom]')!.textContent).toBe('Nelson Sauvin');
    expect(l.querySelector('[data-dp-alpha]')!.textContent).toBe('α 9,6');
    expect(l.querySelector('summary')!.textContent).not.toMatch(/9[.,]6\s*%/);
    expect(l.textContent).toMatch(/Nelson Sauvin 9[.,]6\s*%/); // le nom imprimé, dans le plateau (dans le DOM, fermé)
    for (const li of qa('[data-dp-ligne]')) { // aucune rangée ne dit deux fois son α
      const a = li.querySelector('[data-dp-alpha]')?.textContent?.replace('α ', '');
      if (a) expect(li.querySelector('[data-dp-nom]')!.textContent).not.toMatch(new RegExp(`${a.replace(',', '[.,]')}\\s*%`));
    }
  });
  it('point 7 : les levures disent « = n sachets » au pluriel, dans le même bloc que leur nom', async () => {
    await ouvrir('3');
    const conv = qa('[data-dp-bande="levure"] [data-dp-conversion]');
    expect(conv.length).toBeGreaterThan(0);
    for (const c of conv) {
      expect(c.textContent).toMatch(/^= \d+ sachets?$/);
      expect(c.className).toMatch(/whitespace-nowrap/);
      expect(c.parentElement).toBe(c.closest('[data-dp-ligne]')!.querySelector('[data-dp-nom]')!.parentElement); // pastille et nom : un seul bloc, elle ne passe pas sous le nom
    }
    expect(conv.some(c => /^= [2-9]\d* sachets$/.test(c.textContent ?? ''))).toBe(true); // « 2 sachets », pas « 2 sachet »
  });
  it('point 9 (D275, voie f3) : « 300 g » dans le sous-total de la bande Houblons (Sabro « 30 » prend le g de ses voisines, sûr : deux l’impriment) ; les prix au gramme ont trois décimales', async () => {
    await ouvrir('3');
    const sq = q('[data-dp-bande="houblon"] [data-dp-sous-qte]');
    expect(sq.textContent).toBe('300 g'); // HEAD : « 270 g + 30 ? » ; jamais « ? » quand l'unité se déduit
    expect(sq.querySelector('[data-dp-niveau]')).toBeNull();
    const prix = qa('[data-dp-bande="houblon"] [data-dp-prix]').map(p => p.textContent!).filter(t => /^0,/.test(t));
    expect(prix.length).toBeGreaterThan(0);
    for (const p of prix) expect(p).toMatch(/^0,\d{3,}$/); // 0,040 · 0,080 · 0,045 : la colonne reste homogène
    expect(prix).not.toContain('0,04');
  });
  it('point 9 (prix) : un prix de 2,30 garde ses deux décimales, le prix imprimé n’est jamais arrondi', async () => {
    await ouvrir('3');
    const prixMalt = qa('[data-dp-bande="malt"] [data-dp-prix]').map(p => p.textContent!);
    expect(prixMalt).toContain('2,30');
  });
  it('critique 2 (tête compacte) : seuls les comptes non nuls sont affichés (pas de « 0 nouveau »), et la tuile Règlement tient sur deux lignes (« supposée » dans la ligne du titre)', async () => {
    await ouvrir('3');
    for (const b of qa('[data-dp="compte-liens"] button')) {
      const n = Number(b.querySelector('b')!.textContent);
      expect(n > 0 || b.querySelector('[data-dp-rond]')).toBeTruthy();
    }
    expect(q('[data-dp="compte-liens"]').textContent).not.toMatch(/\b0 nouveau/);
    const tuile = q('[data-dp="tuile-paye"]');
    expect(tuile.querySelectorAll(':scope > span.flex, :scope > span.block')).toHaveLength(2); // le titre (avec « supposée ») et la valeur : deux lignes (le rond ① est posé en absolu)
    expect(tuile.querySelector(':scope > span.flex')!.textContent).toMatch(/Règlement.*supposée/);
    expect(tuile.querySelector(':scope > span.block')!.textContent).toMatch(/^Payé le \d{2}\.\d{2}\.\d{4}$/);
  });
  // VERDICT-f3-p2, majeur 1 (D277) : HEAD lisait « [data-dp="propositions"] » (la phrase « n proposées… ») dans la preuve ; le signal est désormais la pastille « n proposé » des comptes du récap.
  it('point 2 : les propositions de la lecture vivent au récap (pastille « proposé » des comptes), plus au-dessus des bandes', async () => {
    await ouvrir('3');
    const p = q('[data-dp="compte-liens"] [data-va="propose"]');
    expect(p).not.toBeNull();
    expect(q('[data-dp="liste"]').parentElement!.contains(p)).toBe(false);
  });
});
