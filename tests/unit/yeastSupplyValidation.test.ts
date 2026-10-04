import { describe, expect, it } from 'vitest';
import supplyBootstrap from '../../src/data/yeastSupplyBootstrap.json';
import { evaluateYeastPitching, yeastOfferState, yeastPlannedInFormat } from '../../src/domain/yeastPitching';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { readYeastSupply, yeastSourceDateIsFuture, type YeastOffer, type YeastProduct } from '../../functions/src/yeastSupplySchema';
import type { Recipe } from '../../src/types';

const observedDate = '2026-09-27';
const now = Date.parse('2026-09-27T12:00:00.000Z');

function loadSupply() {
  const supply = readYeastSupply(supplyBootstrap);
  expect(supply).toBeDefined();
  return supply!;
}

function productFor(supply: ReturnType<typeof loadSupply>, offer: YeastOffer): YeastProduct {
  const product = supply.products.find(candidate => candidate.id === offer.productId);
  expect(product).toBeDefined();
  return product!;
}

function liquidRecipe(product: YeastProduct): Parameters<typeof evaluateYeastPitching>[0] {
  return {
    yeast: {
      name: product.label,
      hopIndexId: product.referenceId,
      form: product.form,
      qty: 1,
      unit: 'pack',
      pitching: {
        version: 1,
        product: structuredClone(product),
        rate: { value: 1, source: product.source, conditions: 'Hypothèse de test explicite; aucun taux universel.' },
        wort: { volumeL: 25, sg: 1.05, basis: 'measured' }
      }
    },
    volumeL: 25,
    fermentables: [],
    efficiencyPct: 70
  } as Recipe;
}

describe('Approvisionnement levure — intégrité du bootstrap et état daté des offres', () => {
  it('traite une date seule comme jour suisse à minuit sans accepter demain ni avancer un horodatage', () => {
    const swissMidnight = Date.parse('2026-09-27T22:12:00.000Z'); // 28.09, 00:12 à Zurich
    expect(yeastSourceDateIsFuture('2026-09-28', swissMidnight)).toBe(false);
    expect(yeastSourceDateIsFuture('2026-09-29', swissMidnight)).toBe(true);
    expect(yeastSourceDateIsFuture('2026-09-28T00:00:00.000Z', swissMidnight)).toBe(true);
    expect(yeastSourceDateIsFuture('2026-09-27T22:11:00.000Z', swissMidnight)).toBe(false);
  });

  it('résout chaque offre vers un produit lié à une référence documentée', () => {
    const supply = loadSupply();
    const references = new Set(yeastReferences([]).map(reference => reference.id));

    expect(supply.products.every(product => references.has(product.referenceId))).toBe(true);
    expect(supply.offers.every(offer => supply.products.some(product => product.id === offer.productId))).toBe(true);
  });

  it('garde une même variante US-05 11,5 g entre ses vendeurs suisse et allemand', () => {
    const supply = loadSupply();
    const product = supply.products.find(candidate => candidate.referenceId === 'fermentis-us05');
    expect(product).toBeDefined();
    expect(product!.format).toMatchObject({ amount: 11.5, unit: 'g' });

    const offers = supply.offers.filter(offer => offer.productId === product!.id);
    const swiss = offers.find(offer => offer.sellerCountry === 'CH');
    const german = offers.find(offer => offer.sellerCountry === 'DE');
    expect(swiss).toBeDefined();
    expect(german).toBeDefined();
    expect(swiss!.productId).toBe(german!.productId);
    expect(swiss!.sku).not.toBe(german!.sku);
    expect(product!.format!.source.url).toBe(product!.source.url);
  });

  it('sépare le Wyeast 1056 Activator documenté du Wyeast suisse étiqueté XL', () => {
    const supply = loadSupply();
    const netherlandsOffer = supply.offers.find(offer => offer.sellerCountry === 'NL' && supply.products.some(product =>
      product.id === offer.productId && product.referenceId === 'wyeast-1056'));
    expect(netherlandsOffer).toBeDefined();
    const activator = productFor(supply, netherlandsOffer!);
    expect(activator.format).toMatchObject({ amount: 125, unit: 'mL' });
    expect(activator.format!.source.url).toBe(netherlandsOffer!.url);
    expect(activator.starter).toBeDefined();
    expect(activator.cellsPerPack).toBeUndefined();

    const swissXL = supply.offers.find(offer => offer.sellerCountry === 'CH' && offer.stock.status === 'in-stock' &&
      supply.products.some(product => product.id === offer.productId && product.form === 'liquide' && /\bXL\b/.test(product.label)));
    expect(swissXL).toBeDefined();
    const xlProduct = productFor(supply, swissXL!);
    expect(xlProduct.referenceId).not.toBe(activator.referenceId);
    expect(xlProduct.format).toBeUndefined();
    expect(xlProduct.directPitch).toBeUndefined();
    expect(xlProduct.starter).toBeUndefined();
    expect(xlProduct.cellsPerPack).toBeUndefined();
  });

  it('date séparément chaque observation et ancre prix et stock à la fiche exacte', () => {
    const supply = loadSupply();

    for (const product of supply.products) {
      expect(product.source.checkedAt).toBe(observedDate);
      if (product.format) {
        expect(product.format.source.checkedAt).toBe(observedDate);
        const formatSourceIsExact = product.format.source.url === product.source.url || supply.offers.some(offer =>
          offer.productId === product.id && offer.url === product.format!.source.url);
        expect(formatSourceIsExact).toBe(true);
      }
    }

    for (const offer of supply.offers) {
      expect(offer.stock.source.checkedAt).toBe(observedDate);
      expect(offer.stock.source.url).toBe(offer.url);
      if (offer.sellerCountry) {
        expect(offer.sellerSource?.checkedAt).toBe(observedDate);
        expect(offer.sellerSource?.url).not.toBe(offer.url);
      }
      if (offer.shipping) expect(offer.shipping.source.checkedAt).toBe(observedDate);
      if (offer.price) {
        expect(offer.price.amount).toBeGreaterThanOrEqual(0);
        expect(offer.price.packs).toBeGreaterThan(0);
        expect(['CHF', 'EUR']).toContain(offer.price.currency);
        expect(offer.price.source.checkedAt).toBe(observedDate);
        expect(offer.price.source.url).toBe(offer.url);
      }
    }
  });

  it('n’assimile pas une présence en stock à une livraison CH possible', () => {
    const supply = loadSupply();
    const blocked = supply.offers.find(offer => offer.shipping?.status === 'no');
    expect(blocked).toBeDefined();
    const blockedState = yeastOfferState(blocked!, now);
    expect(blockedState.status).toBe(blocked!.stock.status);
    expect(blockedState.status).toBe('in-stock');
    expect(blockedState.shipping).toBe('no');
    expect(blockedState.buyable).toBe(false);

    const unknownDestination = supply.offers.find(offer => offer.shipping?.status === 'unknown');
    expect(unknownDestination).toBeDefined();
    expect(yeastOfferState(unknownDestination!, now).buyable).toBe(false);

    const outOfStock = supply.offers.find(offer => offer.stock.status === 'out-of-stock');
    expect(outOfStock).toBeDefined();
    expect(yeastOfferState(outOfStock!, now).buyable).toBe(false);
  });

  it('marque séparément comme périmés les stocks et conditions de livraison anciennes', () => {
    const supply = loadSupply();
    const current = supply.offers.find(offer => offer.stock.status === 'in-stock' && offer.shipping?.status === 'yes');
    expect(current).toBeDefined();

    const oldStock = structuredClone(current!);
    oldStock.stock.source = { ...oldStock.stock.source, checkedAt: '2026-09-24' };
    const oldStockState = yeastOfferState(oldStock, now);
    expect(oldStockState.status).toBe('stale');
    expect(oldStockState.fresh).toBe(false);
    expect(oldStockState.buyable).toBe(false);

    const oldShipping = structuredClone(current!);
    oldShipping.shipping!.source = { ...oldShipping.shipping!.source, checkedAt: '2026-08-27' };
    const oldShippingState = yeastOfferState(oldShipping, now);
    expect(oldShippingState.status).toBe('in-stock');
    expect(oldShippingState.shippingFresh).toBe(false);
    expect(oldShippingState.buyable).toBe(false);
  });

  it('garde l’achat possible si stock/livraison sont frais, mais date un prix ancien à revérifier', () => {
    const supply = loadSupply();
    const current = supply.offers.find(offer => offer.stock.status === 'in-stock' && offer.shipping?.status === 'yes' && offer.price);
    expect(current).toBeDefined();

    const oldPrice = structuredClone(current!);
    oldPrice.price!.source = { ...oldPrice.price!.source, checkedAt: '2026-09-24' };
    const state = yeastOfferState(oldPrice, now);

    expect(state.fresh).toBe(true);
    expect(state.shippingFresh).toBe(true);
    expect(state.status).toBe('in-stock');
    expect(state.buyable).toBe(true);
    expect(state.priceFresh).toBe(false);
    expect(state.priceLabel).toBe('Prix à revérifier');
  });

  it('laisse inconnus les packs quand le produit liquide n’a ni format ni cellules viables sourcées', () => {
    const supply = loadSupply();
    const product = supply.products.find(candidate => candidate.form === 'liquide' && !candidate.format);
    expect(product).toBeDefined();
    expect(product!.cellsPerPack).toBeUndefined();
    expect(yeastPlannedInFormat({ qty: 1, unit: 'pack' }, product)).toBeUndefined();

    const advice = evaluateYeastPitching(liquidRecipe(product!));
    expect(advice.method).toBe('viable-cells');
    expect(advice.plannedPacks).toBeUndefined();
    expect(advice.packs).toBeUndefined();
    expect(advice.packsToBuy).toBeUndefined();
    expect(advice.reasons.join(' ')).toMatch(/Cellules viables par pack inconnues/);
  });
});
