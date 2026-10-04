import { describe, expect, it } from 'vitest';
import supplyBootstrap from '../../src/data/yeastSupplyBootstrap.json';
import { compareYeastSupply } from '../../src/domain/yeastSupplyComparison';
import { readYeastSupply, type YeastSupply } from '../../functions/src/yeastSupplySchema';
import type { YeastPitchingWort } from '../../functions/src/yeastSupplySchema';

const now = Date.parse('2026-09-27T12:00:00.000Z');
const commonWort: YeastPitchingWort = {
  volumeL: 40,
  sg: 1.05,
  basis: 'measured',
  note: 'Même mesure de moût transmise à toutes les références.'
};

function loadSupply(): YeastSupply {
  const supply = readYeastSupply(supplyBootstrap);
  expect(supply).toBeDefined();
  return supply!;
}

function rowFor(result: ReturnType<typeof compareYeastSupply>, referenceId: string) {
  const row = result.rows.find(candidate => candidate.referenceId === referenceId);
  expect(row).toBeDefined();
  return row!;
}

describe('Comparaison d’approvisionnement levure sous un moût commun', () => {
  it('compare les produits et formats sourcés sans fusionner les offres du même sachet', () => {
    const supply = loadSupply();
    const result = compareYeastSupply({
      supply,
      referenceId: 'fermentis-us05',
      alternativeReferenceIds: ['lalbrew-verdant-ipa'],
      wort: commonWort,
      now
    });
    const selected = rowFor(result, 'fermentis-us05');
    const alternative = rowFor(result, 'lalbrew-verdant-ipa');

    expect(result.wort).toEqual(commonWort);
    expect(result.wort).not.toBe(commonWort);
    expect(selected.referenceRole).toBe('selected-reference');
    expect(alternative.referenceRole).toBe('alternative-reference');
    expect(selected.product.format?.source.url).toBe(selected.product.source.url);
    expect(selected.product.format).toMatchObject({ amount: 11.5, unit: 'g' });
    expect(selected.pitching.range).toBeDefined();
    expect(alternative.pitching.range).toBeDefined();
    expect(selected.pitching.range).not.toEqual(alternative.pitching.range);
    expect(selected.pitching.source?.url).toBe(selected.product.dose?.source.url);
    expect(alternative.pitching.source?.url).toBe(alternative.product.dose?.source.url);
    expect(selected.pitching).not.toHaveProperty('plannedPacks');
    expect(selected.pitching).not.toHaveProperty('packsToBuy');

    const countries = new Set(selected.offers.map(item => item.offer.sellerCountry));
    expect(countries.has('CH')).toBe(true);
    expect(countries.has('DE')).toBe(true);
    expect(selected.offers.every(item => item.offer.productId === selected.productId)).toBe(true);
  });

  it('laisse inconnus les packs liquides sans format exact et les taux cellulaires non communs', () => {
    const result = compareYeastSupply({
      supply: loadSupply(),
      referenceId: 'fermentis-us05',
      alternativeReferenceIds: ['wyeast-1084', 'wyeast-1056'],
      wort: commonWort,
      now
    });
    const xl = rowFor(result, 'wyeast-1084');
    const activator = rowFor(result, 'wyeast-1056');

    expect(xl.product.format).toBeUndefined();
    expect(xl.pitching.packs).toBeUndefined();
    expect(xl.pitching.packsToBuy).toBeUndefined();
    expect(xl.pitching.method).toBe('unknown');
    expect(xl.offers.find(item => item.offer.sellerCountry === 'CH')?.state.buyable).toBe(true);

    expect(activator.product.format).toMatchObject({ unit: 'mL' });
    expect(activator.product.directPitch).toBeDefined();
    expect(activator.preparationProtocol?.id).toBe(activator.product.starter?.id);
    expect(activator.pitching.method).toBe('unknown');
    expect(activator.pitching.packs).toBeUndefined();
    expect(activator.pitching.reasons.join(' ')).toMatch(/taux cellulaire justifié requis/);
  });

  it('n’applique pas un format connu à une autre variante liquide', () => {
    const result = compareYeastSupply({
      supply: loadSupply(),
      referenceId: 'wyeast-1056',
      alternativeReferenceIds: ['wyeast-1084'],
      wort: commonWort,
      now
    });
    const activator = rowFor(result, 'wyeast-1056');
    const xl = rowFor(result, 'wyeast-1084');

    expect(activator.product.format?.source.url).toBe(activator.offers.find(item => item.offer.sellerCountry === 'NL')?.offer.url);
    expect(activator.product.format?.amount).toBe(125);
    expect(xl.product.format).toBeUndefined();
    expect(xl.product.starter).toBeUndefined();
    expect(xl.preparationProtocol).toBeUndefined();
  });

  it('conserve les offres non livrables ou périmées avec leur état propre', () => {
    const supply = structuredClone(loadSupply());
    const blocked = supply.offers.find(offer => offer.shipping?.status === 'no');
    const stale = supply.offers.find(offer => offer.sellerCountry === 'DE' && offer.stock.status === 'in-stock');
    expect(blocked).toBeDefined();
    expect(stale).toBeDefined();
    stale!.stock.source = { ...stale!.stock.source, checkedAt: '2026-09-24' };

    const blockedProduct = supply.products.find(product => product.id === blocked!.productId)!;
    const staleProduct = supply.products.find(product => product.id === stale!.productId)!;
    const result = compareYeastSupply({
      supply,
      referenceId: blockedProduct.referenceId,
      alternativeReferenceIds: staleProduct.referenceId === blockedProduct.referenceId ? [] : [staleProduct.referenceId],
      wort: commonWort,
      now
    });
    const includedOffers = result.rows.flatMap(row => row.offers);
    const blockedState = includedOffers.find(item => item.offer.id === blocked!.id)?.state;
    const staleState = includedOffers.find(item => item.offer.id === stale!.id)?.state;

    expect(blockedState).toBeDefined();
    expect(blockedState!.shipping).toBe('no');
    expect(blockedState!.buyable).toBe(false);
    expect(staleState).toBeDefined();
    expect(staleState!.status).toBe('stale');
    expect(staleState!.buyable).toBe(false);
  });
});
