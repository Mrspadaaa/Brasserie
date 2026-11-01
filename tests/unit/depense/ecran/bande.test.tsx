// @vitest-environment jsdom
/**
 * Voie b1-bande (D233) : « y aller » va toujours quelque part, et le point « Date » se règle. Lecture SIMULÉE (état `date` du banc : la facture sans date,
 * un seul point `date-absente` de la forme du serveur). Gemini jamais appelé, Drive jamais touché, aucune écriture.
 * Le sautillement de la bande (position dans le flux) ne se voit qu'au vrai rendu : `voies/b1-bande/controle-bande.mjs`.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { apercuDepense } from '../../../../src/ui/depense/apercuDev';
import { makePoint } from '../../../../functions/src/invoiceControls';

const state = vi.hoisted(() => ({ stocks: { rawMaterials: [] as any[], cleaning: [] as any[], equipment: [] as any[], kegs: [] as any[] }, transactions: [] as any[], scanned: vi.fn() }));
vi.mock('../../../../src/services/storage', () => ({ StorageService: { getStocks: () => state.stocks, getTransactions: () => state.transactions, getConfig: () => ({ fiscal: { isTvaRegistered: false } }), confirmPendingWrites: async () => undefined } }));
vi.mock('../../../../src/services/financeService', () => ({ FinanceService: { getPlans: () => [] } }));
vi.mock('../../../../src/services/firestoreRepo', () => ({ isConfirmedWriteRejection: () => false }));
vi.mock('../../../../src/services/geminiScanner', () => ({ GeminiScannerService: { scanDocument: (...a: any[]) => state.scanned(...a), fileToDataUrl: async () => 'data:application/pdf;base64,JVBERi0xLjQK', normalizeMimeType: () => 'application/pdf' } }));
import { ExpenseSheet } from '../../../../src/ui/finance/ExpenseSheet';
import { FirebaseAuthService } from '../../../../src/services/firebaseAuth';

const lire = async (ajout?: (result: any) => void) => {
  Object.defineProperty(crypto, 'subtle', { configurable: true, value: webcrypto.subtle });
  const result = JSON.parse(JSON.stringify((apercuDepense('date').outcome as any).result));
  ajout?.(result);
  state.scanned.mockResolvedValueOnce({ ok: true, model: 'rejeu', result });
  const view = render(<ExpenseSheet onClose={() => {}} onSaved={() => {}}/>);
  const file = new File(['%PDF-1.4\n'], 'facture-date.pdf', { type: 'application/pdf' });
  Object.defineProperty(file, 'arrayBuffer', { value: async () => new TextEncoder().encode('%PDF-1.4\n').buffer });
  fireEvent.change(view.container.querySelector('input[type="file"]')!, { target: { files: [file] } });
  await screen.findByRole('region', { name: 'Vérification du justificatif' });
  return view;
};
const chip = (view: { container: HTMLElement }, id: string) => view.container.querySelector<HTMLElement>(`[data-dp-chip="${id}"]`)!;
beforeEach(() => {
  cleanup(); vi.restoreAllMocks(); state.scanned.mockReset(); state.transactions = [];
  vi.spyOn(FirebaseAuthService, 'ensureDriveAccessToken').mockResolvedValue('synthetic-token'); vi.spyOn(FirebaseAuthService, 'hasDriveAccess').mockReturnValue(true); vi.spyOn(FirebaseAuthService, 'prepareGoogleLogin').mockResolvedValue();
});
afterEach(cleanup);

describe('D233 : « y aller » va toujours quelque part', () => {
  it('le banc `date` porte un seul point, `date-absente`, qui pèse, et la chip « Date » apparaît seule', async () => {
    const view = await lire();
    const chips = Array.from(view.container.querySelectorAll('[data-dp="chips"] [data-dp-chip]')).map(c => c.getAttribute('aria-label'));
    expect(chips).toEqual(['1 Date']);
  });

  it('la chip « Date » ouvre le bloc de la date et y met le focus', async () => {
    const view = await lire();
    const bloc = view.container.querySelector<HTMLDetailsElement>('[data-purchase-date]')!;
    bloc.open = false;
    fireEvent.click(chip(view, 'Date|'));
    expect(bloc.open).toBe(true);
    const champ = bloc.querySelector<HTMLInputElement>('input[type="date"]')!;
    expect(document.activeElement).toBe(champ);
  });

  it('une date posée règle le point : la chip est barrée', async () => {
    const view = await lire();
    expect(chip(view, 'Date|').getAttribute('aria-label')).toBe('1 Date');
    const bloc = view.container.querySelector<HTMLDetailsElement>('[data-purchase-date]')!;
    bloc.open = true;
    fireEvent.click(Array.from(bloc.querySelectorAll('button')).find(b => /^Aujourd/.test(b.textContent ?? ''))!);
    await waitFor(() => expect(chip(view, 'Date|').getAttribute('aria-label')).toBe('1 Date réglé'));
    expect(view.container.textContent).toMatch(/points revus/);
  });

  it('une date effacée après coup rouvre le point (jamais réglé sans date valide)', async () => {
    const view = await lire();
    const bloc = view.container.querySelector<HTMLDetailsElement>('[data-purchase-date]')!;
    bloc.open = true;
    fireEvent.change(bloc.querySelector('input[type="date"]')!, { target: { value: '2026-04-27' } });
    await waitFor(() => expect(chip(view, 'Date|').getAttribute('aria-label')).toBe('1 Date réglé'));
    fireEvent.change(view.container.querySelector<HTMLDetailsElement>('[data-purchase-date]')!.querySelector('input[type="date"]')!, { target: { value: '' } });
    await waitFor(() => expect(chip(view, 'Date|').getAttribute('aria-label')).toBe('1 Date'));
  });

  it('une seule date par défaut : la date du paiement n’est pas un champ avant « Autre date » ; le moyen de paiement reste là', async () => {
    const view = await lire();
    const panneau = view.container.querySelector<HTMLElement>('[data-purchase-payment]')!;
    expect(panneau.querySelector('input[type="date"]')).toBeNull();
    expect(panneau.querySelector('select')).not.toBeNull();
    expect(panneau.textContent).toMatch(/Payé le/);
    fireEvent.click(Array.from(panneau.querySelectorAll('button')).find(b => b.textContent === 'Autre date')!);
    expect(panneau.querySelector('input[type="date"]')).not.toBeNull();
  });

  it('« y aller » sur Date, panneau Règlement ouvert : le focus va dans la date de l’achat, jamais dans le paiement', async () => {
    const view = await lire();
    fireEvent.click(view.container.querySelector('[data-dp="tuile-paye"]')!);
    fireEvent.click(chip(view, 'Date|'));
    const actif = document.activeElement as HTMLElement;
    expect(actif.closest('[data-purchase-date]')).not.toBeNull();
    expect(actif.closest('[data-purchase-payment]')).toBeNull();
  });

  it('un point sans cible propre ouvre la preuve (jamais un « y aller » sans effet)', async () => {
    const view = await lire(result => {
      result.points.push({ ...makePoint('lecture-coupee', 'inverifiable', 'documentType' as any, null, { regle: 'test', message: 'Lecture coupée.', unite: 'texte', enjeu: 'info' }), source: 'contrôle', pese: true });
    });
    const preuve = () => view.container.querySelector<HTMLElement>('[data-dp="preuve"]')!;
    expect(preuve().className).not.toMatch(/(^|\s)hidden(\s|$)/); // p3c-3 : la preuve est ouverte d'office, avant le toucher
    const sansCible = Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-chip]')).find(c => /Lecture coupée/.test(c.getAttribute('aria-label') ?? ''))!;
    expect(sansCible).toBeTruthy();
    const vise = vi.fn(), avant = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView'); // D5 : restauré, il ne pollue pas les tests suivants
    (Element.prototype as any).scrollIntoView = vise;
    try {
      fireEvent.click(sansCible);
      // « y aller » va toujours quelque part : la preuve est amenée à l'écran et surlignée un instant.
      expect(vise.mock.contexts.some(c => c === preuve())).toBe(true);
      expect(preuve().getAttribute('data-dp-visee')).toBe('1');
    } finally {
      if (avant) Object.defineProperty(Element.prototype, 'scrollIntoView', avant); else delete (Element.prototype as any).scrollIntoView;
    }
  });

  // D8 : ces trois points parlent des LIGNES de la lecture ; leur chip mène à la liste (`[data-dp="liste"]`), plus à `[data-purchase-lines]` qui n'existe plus dans la disposition lecture.
  it.each(['lignes-perdues', 'lignes-annoncees', 'lignes-non-rapprochees'])('D8 : la chip du point « %s » amène à la liste des lignes', async code => {
    const view = await lire(result => {
      result.points.push({ ...makePoint(code, 'inverifiable', 'items' as any, null, { regle: 'test', message: `Point ${code}.`, unite: 'texte', enjeu: 'info' }), source: 'contrôle', pese: true });
    });
    const sansLigne = Array.from(view.container.querySelectorAll<HTMLElement>('[data-dp-chip]')).find(c => /^\d+ Lignes$/.test(c.getAttribute('aria-label') ?? '')); // le nom de la chip des trois codes (etat.ts NOMS)
    expect(sansLigne, 'la chip du point existe').toBeTruthy();
    expect(view.container.querySelector('[data-purchase-lines]')).toBeNull(); // la cible d'avant n'existe plus
    const vise = vi.fn(), avant = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollIntoView');
    (Element.prototype as any).scrollIntoView = vise;
    try {
      fireEvent.click(sansLigne!);
      expect(vise.mock.contexts.some(c => (c as HTMLElement).getAttribute?.('data-dp') === 'liste')).toBe(true);
      expect(vise.mock.contexts.some(c => (c as HTMLElement).getAttribute?.('data-dp') === 'preuve')).toBe(false); // pas le repli sur la preuve
    } finally {
      if (avant) Object.defineProperty(Element.prototype, 'scrollIntoView', avant); else delete (Element.prototype as any).scrollIntoView;
    }
  });
});
