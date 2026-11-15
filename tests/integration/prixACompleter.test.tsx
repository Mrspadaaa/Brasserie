// @vitest-environment jsdom
/* Voie pc (CP-3, 10.11) : « Je comprends pas les données manquantes, comment je fais pour les entrer, il faudrait un renvoi et une explication ».
   Le bloc « À compléter » de l'écran Prix : une phrase, puis UNE ligne par donnée manquante (ce qui manque, son effet, un toucher qui ouvre l'endroit où la saisir). */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { manquesPrix } from '../../src/ui/prix/donneesPrix';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import type { Batch, PricingItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
vi.mock('../../src/ui/finance/BrewBudgetDialog', () => ({ BrewBudgetDialog: ({ batch }: { batch: Batch }) => <div role="dialog" aria-label="Coût du brassin">{batch.name}</div> }));
vi.mock('../../src/ui/BatchDetailSheet', () => ({ BatchDetailSheet: ({ batch, initialSection, focus }: { batch: Batch; initialSection?: string; focus?: string }) => <div role="dialog" aria-label="Fiche du brassin" data-section={initialSection} data-focus={focus} data-batch={batch.id} /> }));
vi.mock('../../src/ui/finance/FinanceForms', () => ({ ProfileSheet: () => <div role="dialog" aria-label="Solde et paramètres financiers" /> }));

const annee = new Date().getFullYear();
const brassin = (over: Partial<Batch> = {}): Batch => ({ id: 'B1', name: 'Pale Ale de septembre', style: 'Pale Ale', volumeL: 30, brewDate: `15.09.${annee}`, status: 'conditionne',
  packaging: { bottles33: 24, bottles75: 12, kegIds: [] }, recipeSnapshot: { name: 'Pale Ale' } as never, ...over } as Batch);
const snapshot = (over: Record<string, unknown> = {}) => ({ id: 'S-B1', createdAt: '2026-09-01T10:00:00Z', batchId: 'B1', title: 'Pale Ale', brewDate: `15.09.${annee}`, volumeL: 30, netVolumeL: 27, netVolumeSource: 'saisi', lines: [],
  totalCost: 202.77, dejaPaye: 22.41, aPayer: 64.26, annee: 116.1, packagingCost: 24, beerTaxCost: 6.84, complete: true, issues: [], ...over });
const tarif = (over: Partial<PricingItem> = {}): PricingItem => ({ product: 'Pale Ale 33 cl', biere: 'Pale Ale', format: { id: '33cl', volumeL: 0.33 }, priceHT: 5, emballageUnite: 0.3, ...over });

let batches: Batch[] = []; let plans: unknown[] = []; let tarifs: PricingItem[] = []; let profile: Record<string, unknown> = {};
beforeEach(() => {
  vi.spyOn(FinanceService, 'snapshot').mockImplementation(() => ({ profile, plans, payments: [], assets: [], closings: [] }) as never);
  vi.spyOn(StorageService, 'getConfig').mockImplementation(() => defaultConfig as never);
  vi.spyOn(StorageService, 'getBatches').mockImplementation(() => batches);
  vi.spyOn(StorageService, 'getTarifs').mockImplementation(() => tarifs);
  vi.spyOn(StorageService, 'getTransactions').mockImplementation(() => []);
  vi.spyOn(StorageService, 'getStocks').mockImplementation(() => ({ rawMaterials: [], cleaning: [], kegs: [] }) as never);
  StorageService.setUiState('prix_lecture', 'bouteille');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const norm = (el: Element | null): string => (el?.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const ecran = () => render(<PrixEcran config={defaultConfig} tarifs={tarifs} batches={batches} />);
const bloc = () => screen.getByRole('region', { name: 'Données à compléter' });
const ligne = (nom: RegExp) => within(bloc()).getByRole('button', { name: nom });

/** Tout manque : litres conditionnés, deux ingrédients sans prix, densité, 75 cl et fût sans tarif, emballage du 33 cl, un ancien tarif sans format, aucun volume annuel. */
function toutManque() {
  batches = [brassin()];
  plans = [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot({ complete: false, netVolumeL: undefined, netVolumeSource: 'volume-a-brasser', lines: [{ name: 'Cascade', consumedCost: null }, { name: 'Pale malt', consumedCost: null }, { name: 'Levure US-05', consumedCost: 2.4 }] }) }];
  tarifs = [tarif({ emballageUnite: undefined }), { product: 'Amber Ale 50 cl (0 hl)', priceHT: 0 } as PricingItem];
  profile = {};
}

describe('Prix : chaque donnée manquante a son renvoi et son explication (CP-3)', () => {
  it('la phrase dit l\'effet, puis une ligne par manque, dans l\'ordre du calcul', () => {
    toutManque(); ecran();
    expect(norm(bloc())).toContain('Il manque ces données pour savoir ce qu’il te reste');
    const lignes = within(bloc()).getAllByRole('button').filter(b => b.closest('li')).map(b => norm(b));
    expect(lignes).toHaveLength(7);
    const ordre = [/Litres conditionnés/, /Prix de 2 ingrédients/, /Densité/, /Prix du 75 cl/, /Prix du fût/, /Emballage du 33 cl/, /Volume annuel/];
    ordre.forEach((re, i) => expect(lignes[i]).toMatch(re));
    expect(norm(bloc())).not.toMatch(/\b0,00\b/);
  });

  it('litres conditionnés : nomme le brassin, dit « sans eux, pas de coût du litre » et ouvre sa fiche sur Mesures', async () => {
    toutManque(); ecran();
    const l = ligne(/Litres conditionnés/);
    expect(norm(l)).toContain('Pale Ale de septembre');
    expect(norm(l)).toMatch(/Sans eux, pas de coût du litre/);
    fireEvent.click(l);
    const fiche = await screen.findByRole('dialog', { name: 'Fiche du brassin' });
    expect(fiche).toHaveAttribute('data-section', 'measurements'); expect(fiche).toHaveAttribute('data-batch', 'B1');
    expect(fiche).toHaveAttribute('data-focus', 'volume'); // fx2 : le focus sur « Saisir le volume conditionné »
  });

  it('ingrédients sans prix : les noms, l\'effet, et le coût du brassin s\'ouvre', async () => {
    toutManque(); ecran();
    const l = ligne(/Prix de 2 ingrédients/);
    expect(norm(l)).toContain('Cascade'); expect(norm(l)).toContain('Pale malt'); expect(norm(l)).not.toContain('Levure US-05');
    expect(norm(l)).toMatch(/Sans eux, le coût du brassin reste incomplet/);
    fireEvent.click(l);
    expect(await screen.findByRole('dialog', { name: 'Coût du brassin' })).toBeVisible();
  });

  it('densité inconnue : l\'impôt de l\'unité reste inconnu ; la fiche s\'ouvre sur Mesures', async () => {
    toutManque(); ecran();
    const l = ligne(/Densité/);
    expect(norm(l)).toMatch(/impôt bière/);
    fireEvent.click(l);
    expect(await screen.findByRole('dialog', { name: 'Fiche du brassin' })).toHaveAttribute('data-section', 'measurements');
    expect(screen.getByRole('dialog', { name: 'Fiche du brassin' })).toHaveAttribute('data-focus', 'densite');
  });

  it('prix d\'un format absent : « Prix du 75 cl » ouvre « Fixer le prix » sur 75 cl ; le fût de même', async () => {
    toutManque(); ecran();
    const l = ligne(/Prix du 75 cl/);
    expect(norm(l)).toMatch(/Sans prix, pas de reste par bouteille/);
    fireEvent.click(l);
    const feuille = await screen.findByRole('dialog', { name: /Fixer le prix/ });
    expect(within(feuille).getByRole('button', { name: '75 cl' })).toHaveAttribute('aria-pressed', 'true');
    cleanup(); ecran();
    fireEvent.click(ligne(/Prix du fût/));
    const f2 = await screen.findByRole('dialog', { name: /Fixer le prix/ });
    expect(within(f2).getByRole('button', { name: /fût/ })).toHaveAttribute('aria-pressed', 'true');
  });

  it('emballage de l\'unité manquant : une ligne qui ouvre ce tarif (plus de phrase seule)', async () => {
    toutManque(); const { container } = ecran();
    expect(container.querySelector('.prx-aide')).toBeNull();
    const l = ligne(/Emballage du 33 cl/);
    expect(norm(l)).toMatch(/coût de la bouteille est un minimum.*maximum/);
    fireEvent.click(l);
    expect(await screen.findByRole('dialog', { name: /Changer le prix/ })).toBeVisible();
  });

  it('volume annuel : la ligne dit où (paramètres des prévisions) et ouvre le profil financier', async () => {
    toutManque(); ecran();
    const l = ligne(/Volume annuel/);
    expect(norm(l)).toMatch(/par an/);
    fireEvent.click(l);
    expect(await screen.findByRole('dialog', { name: 'Solde et paramètres financiers' })).toBeVisible();
  });

  it('anciens tarifs sans format : l\'explication d\'une ligne, les puces gardées, un toucher ouvre le tarif', async () => {
    toutManque(); ecran();
    expect(norm(bloc())).toMatch(/Sans format, ce prix n’entre pas dans le calcul : choisis 33 cl, 75 cl ou fût/);
    const puces = within(screen.getByRole('group', { name: 'Tarifs à compléter' }));
    fireEvent.click(puces.getByRole('button', { name: /Amber Ale 50 cl · \?/ }));
    expect(await screen.findByRole('dialog', { name: /Changer le prix/ })).toBeVisible();
  });

  it('brassin jamais chiffré : une ligne dit que le coût du brassin manque et l\'ouvre', async () => {
    toutManque(); plans = []; ecran();
    const l = ligne(/Coût du brassin/);
    expect(norm(l)).toMatch(/sans lui, pas de coût du litre/);
    fireEvent.click(l);
    expect(await screen.findByRole('dialog', { name: 'Coût du brassin' })).toBeVisible();
  });

  it('tout connu : aucun bloc, aucune phrase ; seuls les manques réels sont listés', () => {
    batches = [brassin({ volumePackagedL: 27, og: '1.048' })];
    plans = [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot() }];
    tarifs = [tarif(), tarif({ product: 'Pale Ale 75 cl', format: { id: '75cl', volumeL: 0.75 }, priceHT: 10 }), tarif({ product: 'Pale Ale Fût 20 L', format: { id: 'fut', volumeL: 20 }, priceHT: 160 })].map(t => ({ ...t, emballageUnite: 0.3 }));
    profile = { annualProductionL: 1200 };
    ecran();
    expect(screen.queryByRole('region', { name: 'Données à compléter' })).toBeNull();
    expect(screen.queryByText(/Il manque ces données/)).toBeNull();
  });

  it('un seul manque réel (volume annuel) : une seule ligne', () => {
    batches = [brassin({ volumePackagedL: 27, og: '1.048' })];
    plans = [{ createdAt: '2026-09-01T10:00:00Z', brewEstimate: snapshot() }];
    tarifs = [tarif(), tarif({ product: 'Pale Ale 75 cl', format: { id: '75cl', volumeL: 0.75 }, priceHT: 10 }), tarif({ product: 'Pale Ale Fût 20 L', format: { id: 'fut', volumeL: 20 }, priceHT: 160 })].map(t => ({ ...t, emballageUnite: 0.3 }));
    profile = {};
    ecran();
    expect(within(bloc()).getAllByRole('button')).toHaveLength(1);
  });
});

describe('manquesPrix : le calcul pur', () => {
  it('sans brassin : aucun manque de brassin ; seuls les prix de format et le volume annuel', () => {
    const m = manquesPrix({ chiffrage: null, formats: [{ id: '33cl', label: '33 cl', present: true, prixConnu: false, emballageManque: false, tarifExiste: false }], volumeAnnuelManque: true });
    expect(m.map(x => x.cle)).toEqual(['prix-33cl', 'volume-annuel']);
  });
});
