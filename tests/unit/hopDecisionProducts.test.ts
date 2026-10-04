import { describe, expect, it } from 'vitest';
import { HOP_COMMERCIAL_PRODUCTS, getHopCommercialProduct } from '../../src/domain/hopDecision/products';

const product = (id: string) => {
  const result = getHopCommercialProduct(id);
  if (!result) throw new Error(`Produit fabricant absent: ${id}`);
  return result;
};

describe('Référentiel sourcé des produits houblonnés commerciaux', () => {
  it('conserve une identité, une forme, des usages et une source primaire datée de revue pour chaque produit', () => {
    expect(new Set(HOP_COMMERCIAL_PRODUCTS.map(row => row.id))).toEqual(new Set([
      'ych-cryo-hops', 'ych-hyperboost', 'hpa-spectrum', 'hpa-incognito', 'hpa-lupomax', 'hopsteiner-co2-extract',
    ]));
    expect(new Set(HOP_COMMERCIAL_PRODUCTS.map(row => row.id)).size).toBe(HOP_COMMERCIAL_PRODUCTS.length);
    for (const row of HOP_COMMERCIAL_PRODUCTS) {
      expect(row.name.trim()).not.toBe('');
      expect(row.manufacturer.trim()).not.toBe('');
      expect(row.reviewedOn).toBe('2026-09-30');
      expect(row.source.kind).toBe('manufacturer');
      expect(row.source.author).toBe(row.manufacturer);
      expect(() => new URL(row.source.reference)).not.toThrow();
      expect(row.supportedUses.length).toBeGreaterThan(0);
      expect(row.cautions.length).toBeGreaterThan(0);
      if (row.replacement) {
        expect(() => new URL(row.replacement!.source.reference)).not.toThrow();
        expect(row.replacement.uses.every(use => row.supportedUses.includes(use))).toBe(true);
        expect(row.replacement.gramsPerGram.min).toBeGreaterThan(0);
        expect(row.replacement.gramsPerGram.min).toBeLessThanOrEqual(row.replacement.gramsPerGram.max);
        if (row.replacement.maxEquivalentFraction !== undefined) {
          expect(row.replacement.maxEquivalentFraction).toBeGreaterThan(0);
          expect(row.replacement.maxEquivalentFraction).toBeLessThanOrEqual(1);
        }
        if (row.replacement.maxDoseGL !== undefined) expect(row.replacement.maxDoseGL).toBeGreaterThan(0);
      }
    }
  });

  it('garde la proportion Cryo distincte des extraits et pellets enrichis', () => {
    expect(product('ych-cryo-hops')).toMatchObject({
      form: 'cryo',
      replacement: { referenceForm: 'pelletT90', uses: ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'], gramsPerGram: { min: 0.4, max: 0.5 } },
    });
    expect(product('hpa-lupomax').form).toBe('unknown');
    expect(product('hpa-lupomax').form).not.toBe(product('ych-cryo-hops').form);
  });

  it('borne HyperBoost au dry-hop documenté et n’applique pas son ratio au whirlpool', () => {
    const hyperBoost = product('ych-hyperboost');
    expect(hyperBoost).toMatchObject({
      form: 'extract',
      supportedUses: ['fermentation', 'whirlpool'],
      replacement: {
        referenceForm: 'pelletT90', uses: ['fermentation'], basis: 'manufacturerMassRatio',
        gramsPerGram: { min: 0.008, max: 0.01 }, maxEquivalentFraction: 0.5,
      },
    });
    expect(hyperBoost.cautions.length).toBeGreaterThan(0);
  });

  it('garde les repères SPECTRUM, leur limite de dose et le désaccord publié 70/80 %', () => {
    const spectrum = product('hpa-spectrum');
    expect(spectrum).toMatchObject({
      form: 'extract',
      replacement: {
        referenceForm: 'pelletT90', uses: ['fermentation'], gramsPerGram: { min: 1 / 8, max: 1 / 5 },
        maxEquivalentFraction: 0.7, maxDoseGL: 1,
      },
    });
    expect(spectrum.cautions.length).toBeGreaterThan(0);
  });

  it('sépare le repère massique INCOGNITO du résultat IBU du whirlpool', () => {
    expect(product('hpa-incognito')).toMatchObject({
      form: 'extract', supportedUses: ['whirlpool'],
      replacement: { uses: ['whirlpool'], gramsPerGram: { min: 1 / 6, max: 1 / 5 } },
    });
    expect(product('hpa-incognito').cautions.length).toBeGreaterThan(0);
  });

  it('ne crée pas de ratio de masse générique pour le CO₂ extract Hopsteiner', () => {
    const co2 = product('hopsteiner-co2-extract');
    expect(co2).toMatchObject({ form: 'extract', supportedUses: ['boil'] });
    expect(co2.replacement).toBeUndefined();
    expect(co2.source.year).toBeNull();
    expect(co2.cautions.length).toBeGreaterThan(0);
    expect(getHopCommercialProduct('unknown-product')).toBeUndefined();
  });
});
