// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { ChaineArgent } from '../../src/ui/prix/ChaineArgent';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { echelles } from '../../src/ui/prix/geometrie';
import { prixReels } from '../../src/ui/prix/donneesPrix';
import type { Batch, PricingItem, Transaction } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: (p: { initialQuestion?: string }) => <div data-testid="chat">{p.initialQuestion}</div> }));

/** Fixture de c3a : 202,77 ; 27 L nets ; 81 bouteilles de 33 cl ; 1 200 L par an ; tarif 5,00. Les ventes sont simulées (fixture), jamais des données réelles. */
const annee = new Date().getFullYear();
const brassin = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, volumePackagedL: 27, brewDate: `15.09.${annee}`, status: 'conditionne', og: '1.048', abv: '4,8%',
  packaging: { bottles33: 81, bottles75: 0, kegIds: [] }, recipeSnapshot: { name: 'Pale Ale', ogTarget: 1.048 } as never, ...over } as Batch);
const snapshot = (batchId: string) => ({ id: `S-${batchId}`, createdAt: '2026-09-01T10:00:00Z', batchId, title: 'Pale Ale', brewDate: `15.09.${annee}`, volumeL: 30, netVolumeL: 27, netVolumeSource: 'saisi', lines: [],
  totalCost: 202.77, dejaPaye: 22.41, aPayer: 64.26, annee: 116.1, packagingCost: 24, beerTaxCost: 6.84, complete: true, issues: [] });
const tarif33: PricingItem = { product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 }, priceHT: 5, emballageUnite: 0.3 };
const vente = (id: string, date: string, quantite: number, totalCents: number): Transaction => ({ id, date, description: 'Vente simulée', category: 'ventes', amount: totalCents / 100,
  finance: { kind: 'income', amountCents: totalCents, lines: [{ id: `${id}-l`, description: 'Pale Ale 33 cl', kind: 'other', amountCents: totalCents, quantity: quantite, sourceReference: 'vente:B1:33cl:0.33' }] } } as unknown as Transaction);

let batches: Batch[] = []; let plans: unknown[] = []; let tarifs: PricingItem[] = []; let transactions: Transaction[] = [];
beforeEach(() => {
  batches = [brassin()]; plans = [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot('B1') }]; tarifs = [tarif33]; transactions = [];
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: { annualProductionL: 1200 }, plans, payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
  vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => transactions);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  StorageService.setUiState('prix_lecture', 'bouteille');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const norm = (el: Element | null): string => (el?.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();

describe('fz · Prix : l\'axe et les crans de la règle', () => {
  it('l\'axe des prix va de 0 à 7 (5,00 × 1,4), un cran par franc ; le reste du bord droit vaut 4,52 et finit dans l\'angle', () => {
    const e = echelles(2.48, 5, 3636);
    expect(e.xMax).toBe(7);
    expect(e.xCrans).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(e.yMax).toBe(4.52);
    expect(e.anCrans.slice(0, 4)).toEqual([0, 5000, 10000, 15000]);
  });
  it('les crans sont les prix réellement vendus (deux au plus, le prix du tarif exclu) ; jamais 4,50 ni 6,00 en dur', () => {
    const t = [vente('V1', '2026-10-01', 24, 10800), vente('V2', '2026-10-02', 6, 3600), vente('V3', '2026-10-03', 10, 5000)];
    expect(prixReels(t, '33cl', 5, false)).toEqual([4.5, 6]);
    expect(prixReels([], '33cl', 5, false)).toEqual([]);
    expect(prixReels(t, '33cl', 5, true)).toEqual([]);
  });
  it('avec deux ventes à 4,50 et 6,00, la courbe pose leurs restes 2,02 et 3,52 (data-cran)', () => {
    transactions = [vente('V1', '2026-10-01', 24, 10800), vente('V2', '2026-10-02', 6, 3600)];
    const { container } = render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);
    const crans = [...container.querySelectorAll('[data-cran]')];
    expect(crans.map(c => c.getAttribute('data-cran'))).toEqual(['4.5', '6']);
    expect(norm(crans[0])).toContain('2,02'); expect(norm(crans[1])).toContain('3,52');
  });
  it('sans vente : aucun cran inventé', () => {
    const { container } = render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);
    expect(container.querySelectorAll('[data-cran]').length).toBe(0);
  });
  it('deux tarifs pour un même format : la tuile dit « 2 prix », pas « prix ? »', () => {
    tarifs = [tarif33, { product: 'Pale Ale Fût 20 L', biere: 'Pale Ale', format: { id: 'fut', volumeL: 20 }, priceHT: 160 }, { product: 'Pale Ale Fût 20 L (ancien)', priceHT: 150 }];
    const { container } = render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);
    expect(norm(container.querySelector('.prx-fo'))).toContain('2 prix');
  });
});

describe('fz · Argent : Prévisions sans zéro inventé, Proposer, litres visés', () => {
  const planifie = (): Batch => ({ id: 'B2', name: 'Pale Ale de novembre', style: 'Pale Ale', volumeL: 30, plannedBrewDate: new Date(Date.now() + 40 * 864e5).toISOString().slice(0, 10), status: 'planifie', recipeSnapshot: { name: 'Pale Ale', ogTarget: 1.048 } as never } as Batch);
  it('brassin planifié sans prix ni litres nets : « ? » dans Prévisions, jamais « 0,00 » ; « 30 L visés » à côté de « ? L nets »', () => {
    const b = planifie(); batches = [b];
    const { container } = render(<ChaineArgent batch={b} config={defaultConfig} />);
    const prev = container.querySelector('.arg-prev');
    expect(prev).not.toBeNull();
    expect(norm(prev)).not.toMatch(/0,00/); expect(norm(prev)).toMatch(/\? avant le \d+ /);
    const t = norm(container);
    expect(t).toContain('? L nets'); expect(t).toContain('30 L visés');
  });
  it('« Proposer » (le compteur de la fiche monte) ouvre le compagnon avec une question sur CE brassin, sans rien envoyer', async () => {
    const { rerender } = render(<ChaineArgent batch={batches[0]} config={defaultConfig} proposer={0} />);
    expect(screen.queryByTestId('chat')).toBeNull();
    rerender(<ChaineArgent batch={batches[0]} config={defaultConfig} proposer={1} />);
    const chat = await waitFor(() => screen.getByTestId('chat'));
    expect(chat.textContent).toContain('Pale Ale de septembre');
    expect(chat.textContent).toContain('Quel prix me conseilles-tu');
  });
});
