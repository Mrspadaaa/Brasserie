// @vitest-environment jsdom
/* Outil de banc de la voie g2 : écrit le HTML de l'écran Prix « coût du litre connu » (fixture de prixEcran.test) dans un dossier temporaire,
   pour le capturer dans Chrome avec les vraies feuilles de style. Inerte sans G2_RENDU (le chemin du dossier). */
import React from 'react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));

const sortie = process.env.G2_RENDU;
const annee = new Date().getFullYear();
const brassin = { id: 'B1', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, volumePackagedL: 27, brewDate: `15.09.${annee}`, status: 'conditionne', og: '1.048', abv: '4,8%',
  packaging: { bottles33: 81, bottles75: 0, kegIds: [] }, recipeSnapshot: { name: 'Pale Ale', ogTarget: 1.048 } as never } as unknown as Batch;
const snapshot = { id: 'S-B1', createdAt: '2026-09-01T10:00:00Z', batchId: 'B1', title: 'Pale Ale', brewDate: `15.09.${annee}`, volumeL: 30, netVolumeL: 27, netVolumeSource: 'saisi', lines: [],
  totalCost: 202.77, dejaPaye: 22.41, aPayer: 64.26, annee: 116.1, packagingCost: 24, beerTaxCost: 6.84, complete: true, issues: [] };
const tarif: PricingItem = { product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 }, priceHT: 5, emballageUnite: 0.3 };

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe.skipIf(!sortie)('rendu de banc (g2)', () => {
  it('écrit le HTML', () => {
    vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile: { annualProductionL: 1200 }, plans: [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot }], payments: [], assets: [], closings: [] }) as never);
    vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
    vi.spyOn(StorageService, 'getBatches').mockImplementation(() => [brassin]);
    vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => [tarif]);
    vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
    vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
    const { container } = render(<PrixEcran config={defaultConfig} tarifs={[tarif]} batches={[brassin]} />);
    expect(container.querySelector('svg.prx-g:not(.prx-g-inconnu)')).not.toBeNull();
    mkdirSync(sortie!, { recursive: true });
    writeFileSync(`${sortie}/connu.html`, container.innerHTML);
  });
});
