// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { ChaineArgent } from '../../src/ui/prix/ChaineArgent';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: (p: { initialQuestion?: string }) => <div data-testid="chat">{p.initialQuestion}</div> }));

/** Fixture de c3a (d1) : 202,77 = 22,41 + 64,26 + 116,10 ; 27 L nets ; emballage 24,00 ; impôt 6,84 ; 81 bouteilles de 33 cl ; 1 200 L par an. Les attendus sont calculés à la main. */
const annee = new Date().getFullYear();
const brassin = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, volumePackagedL: 27, brewDate: `15.09.${annee}`, status: 'conditionne', og: '1.048', abv: '4,8%',
  packaging: { bottles33: 81, bottles75: 0, kegIds: [] }, recipeSnapshot: { name: 'Pale Ale', ogTarget: 1.048 } as never, ...over } as Batch);
const snapshot = (batchId: string, over: Record<string, unknown> = {}) => ({ id: `S-${batchId}`, createdAt: '2026-09-01T10:00:00Z', batchId, title: 'Pale Ale', brewDate: `15.09.${annee}`, volumeL: 30, netVolumeL: 27, netVolumeSource: 'saisi', lines: [],
  totalCost: 202.77, dejaPaye: 22.41, aPayer: 64.26, annee: 116.1, packagingCost: 24, beerTaxCost: 6.84, complete: true, issues: [], ...over });
const tarif = (over: Partial<PricingItem> = {}): PricingItem => ({ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 }, priceHT: 5, emballageUnite: 0.3, ...over });

let batches: Batch[] = []; let plans: unknown[] = []; let tarifs: PricingItem[] = [];
beforeEach(() => {
  batches = [brassin()]; plans = [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot('B1') }]; tarifs = [tarif()];
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: { annualProductionL: 1200 }, plans, payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
  vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  StorageService.setUiState('prix_lecture', 'bouteille');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const norm = (el: Element | null): string => { const out: string[] = []; const w = document.createTreeWalker(el!, NodeFilter.SHOW_TEXT); while (w.nextNode()) out.push(w.currentNode.textContent ?? ''); return out.join(' ').replace(/[\u202f\u00a0]/g, ' ').replace(/\s+/g, ' ').trim(); };
const ecran = () => render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);

describe('Prix (c7c) : les nombres de la chaîne, lus du domaine', () => {
  it('S1 : il te reste 2,52 par bouteille (50 %), coût 2,48, 7,51 CHF/L, 41 paient le brassin, 40 pour toi', () => {
    const { container } = ecran();
    expect(norm(container.querySelector('.prx-ans')!)).toMatch(/Il te reste 2,52 CHF par bouteille 50 % du prix/);
    expect(norm(container.querySelector('.prx-g')!)).toContain('coût 2,48');
    expect(norm(container.querySelector('.prx-cout')!)).toContain('7,51 CHF/L');
    expect(norm(container.querySelector('.prx-br')!)).toMatch(/27 L nets.*41 paient le brassin.*40 pour toi/);
    expect(container.querySelector('.prx-det')).toBeNull();
    expect(container.querySelector('.prx-pli')).toBeNull();
    expect(screen.queryByText(/Comprendre le calcul/)).toBeNull();
    expect(screen.getByRole('button', { name: /9.162,72 par an/ })).toBeVisible();
  });

  it('la bascule échange le chiffre de tête : 9 162,72 par an (si 1 200 L en 33 cl, estimé) ; 2,52 par bouteille passe dessous', () => {
    const { container } = ecran();
    fireEvent.click(container.querySelector<HTMLButtonElement>('.prx-swap')!);
    expect(norm(container.querySelector('.prx-ans')!)).toMatch(/Il te resterait 9 162,72 CHF par an/);
    expect(norm(container.querySelector('.prx-swap')!)).toContain('2,52 par bouteille');
    expect(norm(container.querySelector('.prx-hyp')!)).toBe('si 1 200 L en 33 cl estimé');
    expect(norm(container.querySelector('.prx-g')!)).toContain('+363,60 /an');
  });

  it('tuiles ≤ : 75 cl et fût sans tarif disent « prix ? » ; avec un tarif et sans emballage saisi, le reste est un plafond (≤ 5,03 ; ≤ 27,58)', () => {
    const { container } = ecran();
    const tuiles = container.querySelectorAll('.prx-tuile');
    expect(norm(tuiles[0])).toContain('prix ?'); expect(norm(tuiles[1])).toContain('prix ?');
    cleanup();
    tarifs = [tarif(), tarif({ product: 'Pale Ale 75 cl', format: { id: '75cl', volumeL: 0.75 }, priceHT: 10, emballageUnite: undefined }), tarif({ product: 'Pale Ale Fût 20 L', format: { id: 'fut', volumeL: 20 }, priceHT: 160, emballageUnite: undefined })];
    const r = ecran();
    const t = r.container.querySelectorAll('.prx-tuile');
    expect(norm(t[0])).toMatch(/10,00.*≤ 5,03/); expect(norm(t[1])).toMatch(/160,00.*≤ 27,58/);
  });

  it('emballage de l\'unité vide : le coût est un plancher (≥) et le reste un plafond (≤), jamais exact ni 0', () => {
    tarifs = [tarif({ emballageUnite: undefined })];
    const { container } = ecran();
    expect(norm(container.querySelector('.prx-ans')!)).toMatch(/Il te reste ≤ 2,82/);
    expect(norm(container.querySelector('.prx-g')!)).toContain('coût ≥ 2,18');
  });

  it('sans tarif : « Pas encore de prix » et « Fixer le prix » ; coût du litre incomplet : « coût ? », aucun 0,00', () => {
    tarifs = [];
    ecran();
    expect(screen.getByText('Pas encore de prix')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Fixer le prix' })).toBeVisible();
    cleanup();
    plans = []; tarifs = [tarif()];
    const { container } = ecran();
    expect(norm(container)).toContain('coût ?');
    expect(norm(container)).not.toMatch(/0,00/);
  });

  it('deux brassins de même recette : le coût suit celui d\'où l\'on vient ; un brassin non chiffré dit « ? »', () => {
    batches = [brassin({ id: 'B2', name: 'Pale Ale d\'octobre', brewDate: `15.10.${annee}`, volumePackaged: undefined, volumePackagedL: 27 } as never), brassin()];
    plans = [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot('B1') }, { createdAt: '2026-10-01T10:00:00Z', brewEstimate: snapshot('B2', { totalCost: 162.18, dejaPaye: 10, aPayer: 36.08, annee: 116.1 }) }];
    const dOctobre = render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} batchId="B2" />);
    expect(norm(dOctobre.container.querySelector('.prx-g')!)).toContain('coût 1,99'); // (162,18 − 24,00 − 6,84) ÷ 27 × 0,33 + 0,30 + 0,0836 = 1,9888
    cleanup();
    const dSept = render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} batchId="B1" />);
    expect(norm(dSept.container.querySelector('.prx-g')!)).toContain('coût 2,48');
  });

  it('« Proposer » prépare la question avec le coût, le prix et le reste, sans l\'envoyer (Gemini simulé)', async () => {
    ecran();
    fireEvent.click(screen.getByRole('button', { name: 'Proposer' }));
    const chat = await screen.findByTestId('chat');
    expect(norm(chat)).toMatch(/33 cl à 5,00 CHF HT.*Coût du bouteille : 2,48 CHF.*Il me reste 2,52 CHF \(50 % du prix\)/);
  });

  it('un seul bouton primaire, aucun type="number"', () => {
    const { container } = ecran();
    expect(container.querySelectorAll('.prx-pri')).toHaveLength(1);
    expect(container.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });
});

describe('Argent (e3a) : les six marches', () => {
  it('conditionné : ① 7,51 ② impôt ③ coûte 2,48 ④ 5,00 ⑤ 2,52 · 50 % ⑥ 202,23 ; chaque nombre vient du domaine', () => {
    const { container } = render(<ChaineArgent batch={batches[0]} config={defaultConfig} />);
    const t = norm(container);
    expect(t).toContain('7,51 CHF/L'); expect(t).toContain('payé 0,83'); expect(t).toContain('à payer 2,38'); expect(t).toContain('année 4,30');
    expect(t).toMatch(/0,08 \/ 33 cl/); expect(t).toContain('coûte'); expect(t).toContain('2,48');
    expect(t).toMatch(/5,00 CHF/); expect(t).toMatch(/2,52 \/ 33 cl/); expect(t).toContain('202,23'); expect(t).toContain('41 paient');
    expect(container.querySelectorAll('.arg-ax i')).toHaveLength(6);
    for (const nom of ['Coût du litre', 'Impôt sur la bière', 'Prix de vente', 'Brassin']) expect(screen.getByRole('button', { name: nom })).toBeVisible();
  });

  it('planifié : le coût manque en partie, les marches disent ≥, ≤ et « ? » (jamais 0)', () => {
    plans = [];
    const { container } = render(<ChaineArgent batch={brassin({ status: 'planifie', volumePackagedL: undefined, packaging: undefined, og: undefined })} config={defaultConfig} />);
    const t = norm(container);
    expect(t).toContain('?'); expect(t).not.toMatch(/ 0,00/);
  });

  it('toucher la marche ④ ouvre l\'écran Prix en entier, sur ce brassin', async () => {
    render(<ChaineArgent batch={batches[0]} config={defaultConfig} />);
    fireEvent.click(screen.getByRole('button', { name: 'Prix de vente' }));
    const feuille = await screen.findByRole('dialog', { name: /Prix/ });
    await waitFor(() => expect(within(feuille).getByRole('button', { name: 'Changer le prix' })).toBeVisible());
    expect(norm(feuille)).toMatch(/Il te reste 2,52/);
  });
});
