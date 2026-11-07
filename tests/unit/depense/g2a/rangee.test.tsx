// @vitest-environment jsdom
/**
 * Voie g2a-ecran, la rangée et son plateau : D330 et D334 (le rouge à sa place : le champ qui manque, nommé, et le focus sous « à remplir »), D328h (deux décimales au repos),
 * D328g (le faux français), D335 (le segment Nature jamais vide). Pièces FICTIVES (aperçu `commande`, quincaillerie « Brico Fictif ») ; Gemini jamais appelé, aucune écriture.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], scanned: vi.fn(), traduire: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
vi.mock('../../../../src/services/nomsFr', async importOriginal => ({ ...await importOriginal<any>(), traduireLignes: (...a: any[]) => state.traduire(...a), retenirNomBrasseur: async () => undefined }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
import { natureDuSegment, decimalesAuRepos } from '../../../../src/ui/depense/rangees';
import { ligne, lirePiece, ligneDe } from './aide';

beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.traduire.mockReset(); state.traduire.mockResolvedValue(new Map()); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

const commande = async () => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const ap = apercuDepense('commande'); state.stocks = ap.stocks as any;
  const v = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}} apercu={ap}/>);
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return v;
};
const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
const ligneN = (n: number) => q(`[data-dp-ligne="line-${n}"]`);

describe('D330, D334 : le champ qui manque porte le rouge et son nom, au plateau', () => {
  it('une ligne sans unité ni prix : « unité à remplir » et « prix à remplir » au plateau, les deux champs marqués inconnu, la quantité qui est là non', async () => {
    await commande();
    // B2 n° 18 : une marque rouge par champ manquant, sur le champ lui-même (son nom dedans) ; plus de puce en double dessous.
    expect(ligneN(13).querySelectorAll('[data-dp-a-remplir]')).toHaveLength(0);
    expect(ligneN(13).querySelector<HTMLInputElement>('[aria-label="Prix ligne 12"]')!.placeholder).toBe('prix');
    const niveau = (nom: string) => ligneN(13).querySelector<HTMLElement>(`[aria-label="${nom} ligne 12"]`)!.closest('[data-dp-niveau]')?.getAttribute('data-dp-niveau') ?? null;
    expect(niveau('Unité')).toBe('inconnu'); expect(niveau('Prix')).toBe('inconnu');
    expect(niveau('Quantité')).toBeNull(); expect(niveau('Montant')).toBeNull();
  });
  it('une ligne qui n’a rien à remplir ne porte aucun mot rouge au plateau', async () => {
    await commande();
    expect(ligneN(6).querySelectorAll('[data-dp-a-remplir]')).toHaveLength(0);
  });
  it('un article relié qu’on n’a pas choisi : « article à choisir », le choix marqué inconnu, et le nom de la rangée aussi', async () => {
    await commande();
    fireEvent.change(screen.getByLabelText('Stock ligne 1'), { target: { value: 'existing' } });
    await waitFor(() => expect(ligneN(1).querySelector('[data-dp-stock] [data-dp-niveau="inconnu"]')).not.toBeNull());
    expect(ligneN(1).querySelector('[data-dp-stock]')!.textContent).toContain('à choisir');
    expect(ligneN(1).querySelector<HTMLElement>('summary [data-dp-nom]')!.getAttribute('data-dp-niveau')).toBe('inconnu');
  });
  it('sous le filtre « à remplir », la rangée s’ouvre et le focus va sur le premier champ qui manque', async () => {
    await commande();
    expect(ligneN(13).querySelector<HTMLDetailsElement>('details')!.open).toBe(false);
    fireEvent.click(q('[data-va="remplir"]'));
    await waitFor(() => expect(ligneN(13).querySelector<HTMLDetailsElement>('details')!.open).toBe(true));
    await waitFor(() => expect(document.activeElement).toBe(ligneN(13).querySelector('[aria-label="Unité ligne 12"]')));
  });
  it('B2 n° 18 : un champ qui manque est un seul marquage, son nom en filigrane ; le toucher sur « à remplir » du bandeau lui donne le focus (test précédent)', async () => {
    await commande();
    const prix = ligneN(13).querySelector<HTMLInputElement>('[aria-label="Prix ligne 12"]')!;
    expect(prix.placeholder).toBe('prix');
    expect(prix.closest('[data-dp-niveau]')?.getAttribute('data-dp-niveau')).toBe('inconnu');
  });
});

describe('D328h : prix et montants à deux décimales au moins, tant que le champ n’a pas le focus', () => {
  const items = () => [ligne(1, 'Rouleau mousse 12 cm', 'equipment', 1, 'Stk', 1.2, 1.2), ligne(2, 'Vis à bois 4 x 40 (200)', 'equipment', 100, 'Stk', 0.098, 9.8), ligne(3, 'Seau 12 L', 'equipment', 2, 'Stk', 9.5, 19)];
  it('« 1,2 » est montré « 1,20 », « 9,5 » « 9,50 », « 0,098 » reste (champs du plateau et cellules de la rangée)', async () => {
    const v = await lirePiece(state.scanned, items());
    const champ = (nom: string, n: number) => (ligneDe(v, n).querySelector(`[aria-label="${nom} ligne ${n}"]`) as HTMLInputElement).value;
    expect(champ('Prix', 1)).toBe('1,20'); expect(champ('Montant', 1)).toBe('1,20');
    expect(champ('Prix', 2)).toBe('0,098'); expect(champ('Montant', 2)).toBe('9,80');
    expect(champ('Prix', 3)).toBe('9,50');
    expect(ligneDe(v, 1).querySelector('[data-dp-prix]')!.textContent).toBe('1,20');
    expect(ligneDe(v, 2).querySelector('[data-dp-prix]')!.textContent).toBe('0,098');
  });
  it('au focus, la valeur est celle qu’il tape (« 1,5 » reste « 1,5 ») ; à la sortie du champ, « 1,50 »', async () => {
    const v = await lirePiece(state.scanned, items());
    const prix = ligneDe(v, 1).querySelector('[aria-label="Prix ligne 1"]') as HTMLInputElement;
    fireEvent.focus(prix); fireEvent.change(prix, { target: { value: '1,5' } });
    expect(prix.value).toBe('1,5');
    fireEvent.blur(prix);
    expect(prix.value).toBe('1,50');
  });
  it('pur : decimalesAuRepos', () => {
    expect([1.2, 9.5, 0.098, 0.0001, 12, undefined].map(decimalesAuRepos)).toEqual([2, 2, 3, 4, 2, 2]);
  });
});

describe('D335 : le segment Nature allume toujours l’un de ses trois mots', () => {
  const NATURES: Array<[string, string | undefined]> = [['ingredient', 'ingredient'], ['equipment', 'equipment'], ['packaging', 'equipment'], ['cleaning', 'equipment'], ['maintenance', 'equipment'], ['other', 'equipment'], ['service', 'service'], ['shipping', 'service'], ['discount', undefined]];
  it('pur : la table des natures', () => {
    for (const [kind, seg] of NATURES) expect(natureDuSegment(kind as any), kind).toBe(seg);
  });
  it.each(NATURES)('une ligne « %s » : exactement un segment pressé (%s)', async (kind, seg) => {
    const v = await lirePiece(state.scanned, [ligne(1, 'Rouleau mousse 12 cm', 'equipment', 1, 'Stk', 3, 3), ligne(2, 'Seau 12 L', 'equipment', 1, 'Stk', 4, 4)]);
    fireEvent.change(screen.getByLabelText('Nature ligne 1'), { target: { value: kind } });
    const groupe = ligneDe(v, 1).querySelector('[data-dp-nature]');
    if (seg === undefined) { expect(groupe).toBeNull(); return; }
    expect(groupe!.querySelectorAll('button')).toHaveLength(3);
    const presses = [...groupe!.querySelectorAll('button[aria-pressed="true"]')].map(b => b.textContent);
    expect(presses).toEqual([{ ingredient: 'Ingrédient', service: 'Service', equipment: 'Matériel' }[seg]]);
  });
  it('toucher le segment déjà allumé ne change rien ; toucher un autre pose ingredient, service ou equipment', async () => {
    const v = await lirePiece(state.scanned, [ligne(1, 'Rouleau mousse 12 cm', 'other', 1, 'Stk', 3, 3), ligne(2, 'Seau 12 L', 'equipment', 1, 'Stk', 4, 4)]);
    const sel = () => (screen.getByLabelText('Nature ligne 1') as HTMLSelectElement).value;
    expect(sel()).toBe('other');
    const bouton = (mot: string) => [...ligneDe(v, 1).querySelectorAll<HTMLButtonElement>('[data-dp-nature] button')].find(b => b.textContent === mot)!;
    fireEvent.click(bouton('Matériel')); expect(sel()).toBe('other');
    fireEvent.click(bouton('Service')); expect(sel()).toBe('service');
    fireEvent.click(bouton('Ingrédient')); expect(sel()).toBe('ingredient');
    fireEvent.click(bouton('Matériel')); expect(sel()).toBe('equipment');
  });
});

describe('D328b (câblage g2a → g2b) : aucun « ? » d’un service ou d’une remise à l’en-tête de bande', () => {
  it('une ligne de service ou de remise sans unité ne met aucun « ? » dans les en-têtes de bande', async () => {
    const v = await lirePiece(state.scanned, [ligne(1, 'Montage étagère', 'service', 2, '', 20, 40), ligne(2, 'Remise fidélité', 'discount', 1, '', null, -5), ligne(3, 'Seau 12 L', 'equipment', 1, 'Stk', 4, 4)]);
    const entetes = [...v.container.querySelectorAll<HTMLElement>('[data-dp-bande-entete]')].map(e => e.textContent ?? '');
    expect(entetes.length).toBeGreaterThan(0);
    for (const t of entetes) expect(t).not.toMatch(/\?/);
  });
});

describe('D2 : sous un filtre, les en-têtes disent ce qui est montré', () => {
  it('« à contrôler » : le montant de chaque bande montrée est la somme de ses rangées montrées, et le compte dit « n/N » (n < N quelque part)', async () => {
    await commande();
    fireEvent.click(q('[data-va="controler"]'));
    await waitFor(() => expect(document.querySelectorAll('[data-dp-bande-compte]')[0]?.textContent).toMatch(/^[0-9]+[/][0-9]+$/));
    let partiel = false;
    for (const b of document.querySelectorAll<HTMLElement>('[data-dp-bande]:not([hidden])')) {
      const [n, N] = b.querySelector('[data-dp-bande-compte]')!.textContent!.split('/').map(Number);
      if (n < N) partiel = true;
      const lignes = [...b.querySelectorAll<HTMLElement>('[data-dp-ligne]:not([hidden])')].filter(l => !l.closest('[hidden]'));
      const somme = lignes.reduce((t, l) => t + Number((l.querySelector('[data-dp-montant]')!.textContent ?? '0').replace(',', '.').replace(/[^0-9.-]/g, '') || 0), 0);
      const entete = b.querySelector('[data-dp-sous-montant]')!.textContent!.replace(' + ?', '').replace(',', '.');
      expect(Number(entete)).toBeCloseTo(somme, 2);
      expect(lignes.length).toBeGreaterThanOrEqual(n);
    }
    expect(partiel).toBe(true);
  });
});
