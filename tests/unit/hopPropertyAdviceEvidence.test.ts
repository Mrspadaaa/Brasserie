import { describe, expect, it } from 'vitest';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { assertHopDocumentaryCorpus } from '../../src/domain/hopDecision/documentaryAnswerSchema';
import { getHopDocumentaryCorpus, HOP_DOCUMENTARY_CLAIM_IDS } from '../../src/domain/hopDecision/documentaryEvidence';
import {
  getHopPropertyAdviceCorpus,
  PROPERTY_ADVICE_CLAIM_IDS,
  PROPERTY_ADVICE_PRODUCT_PATHS,
} from '../../src/domain/hopDecision/propertyAdviceEvidence';
import { getHopCommercialProduct } from '../../src/domain/hopDecision/products';

describe('corpus documentaire de conseils par propriétés', () => {
  it('étend V1 sans mutation, garde le format structurel et valide les claims/sources', () => {
    const before = getHopDocumentaryCorpus();
    const v1Snapshot = structuredClone(before);
    const propertyCorpus = getHopPropertyAdviceCorpus();

    assertHopDocumentaryCorpus(propertyCorpus);
    expect(propertyCorpus.format).toBe(before.format);
    expect(propertyCorpus.version).not.toBe(before.version);
    expect(propertyCorpus.reference).not.toBe(before.reference);
    expect(propertyCorpus.sources.slice(0, before.sources.length)).toEqual(before.sources);
    expect(propertyCorpus.claims.slice(0, before.claims.length)).toEqual(before.claims);
    expect(getHopDocumentaryCorpus()).toEqual(v1Snapshot);

    const sourceIds = new Set(propertyCorpus.sources.map(row => row.id));
    expect(sourceIds.size).toBe(propertyCorpus.sources.length);
    for (const claim of propertyCorpus.claims) expect(claim.sourceIds.every(id => sourceIds.has(id))).toBe(true);
    const sourceKeys = propertyCorpus.sources.map(row => hopAdviceContentReference('hop-documentary-equality-v1', row.source));
    expect(new Set(sourceKeys).size).toBe(sourceKeys.length);
  });

  it('publie les alias V1 et les claims V2 aux prémisses de propriété attendues', () => {
    expect(PROPERTY_ADVICE_CLAIM_IDS.PERCEPTION_NOT_IBU).toBe(HOP_DOCUMENTARY_CLAIM_IDS.BITTERNESS_PERCEPTION);
    expect(PROPERTY_ADVICE_CLAIM_IDS.CULTURE_PATHWAY).toBe(HOP_DOCUMENTARY_CLAIM_IDS.LF_PRECURSORS);
    expect(PROPERTY_ADVICE_CLAIM_IDS.CULTURE_LIMITS).toBe(HOP_DOCUMENTARY_CLAIM_IDS.CULTURE_CONTEXT);
    expect(PROPERTY_ADVICE_CLAIM_IDS.CHEMISTRY_NOT_SENSORY).toBe(HOP_DOCUMENTARY_CLAIM_IDS.CHEMISTRY_NOT_SENSORY);
    expect(PROPERTY_ADVICE_CLAIM_IDS.BLEND_COMPARISON).toBe(HOP_DOCUMENTARY_CLAIM_IDS.PAIRING_HYPOTHESIS);
    expect(PROPERTY_ADVICE_CLAIM_IDS.LEXICAL_NOT_PROFILE).toBe(HOP_DOCUMENTARY_CLAIM_IDS.LEXICAL_NOT_PAIRING);
    expect(PROPERTY_ADVICE_CLAIM_IDS.SWEETNESS_IS_PERCEPTION).toBe(HOP_DOCUMENTARY_CLAIM_IDS.SWEETNESS_BALANCE);

    const corpus = getHopPropertyAdviceCorpus();
    const byId = new Map(corpus.claims.map(row => [row.id, row]));
    const directAroma = byId.get(PROPERTY_ADVICE_CLAIM_IDS.DIRECT_AROMA_TRANSFER)!;
    const coldBU = byId.get(PROPERTY_ADVICE_CLAIM_IDS.COLD_BITTERNESS)!;
    const acidity = byId.get(PROPERTY_ADVICE_CLAIM_IDS.ACIDITY_NOT_PH)!;
    const material = byId.get(PROPERTY_ADVICE_CLAIM_IDS.MATERIAL_CHARACTERIZATION)!;

    expect(directAroma.sourceIds).toContain('mikyksa-2018-jib494');
    expect(directAroma.sourceIds.some(id => id.includes('lafontaine'))).toBe(false);
    expect(coldBU.sourceIds).toContain('lafontaine-2018-table5-cold-bu');
    expect(coldBU.forbiddenInferences.join(' ')).toMatch(/sensorielle|perçue/i);
    expect(acidity.sourceIds).toEqual(expect.arrayContaining(['m-ph-maye-2018', 'm-ph-schmick-2014']));
    expect(material.role).toBe('context');
    expect(material.forbiddenInferences.join(' ')).toMatch(/intensité|sensoriel/i);
    expect(PROPERTY_ADVICE_CLAIM_IDS).not.toHaveProperty('BANANA');
  });

  it('expose seulement les cinq chemins produit curatés avec les uses produits exacts et qualifications non quantitatives', () => {
    const expected = [
      ['ych-cryo-hops', PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_CRYO],
      ['ych-hyperboost', PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_HYPERBOOST],
      ['hpa-spectrum', PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_SPECTRUM],
      ['hpa-incognito', PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_INCOGNITO],
      ['hpa-lupomax', PROPERTY_ADVICE_CLAIM_IDS.PRODUCT_LUPOMAX],
    ];
    expect(PROPERTY_ADVICE_PRODUCT_PATHS.map(row => [row.id, row.claimIds[0]])).toEqual(expected);

    const corpus = getHopPropertyAdviceCorpus();
    for (const path of PROPERTY_ADVICE_PRODUCT_PATHS) {
      const product = getHopCommercialProduct(path.id);
      expect(product).toBeDefined();
      expect(path.name).toBe(product!.name);
      expect(path.uses).toEqual(product!.supportedUses);
      expect(path.qualification.length).toBeGreaterThan(0);
      const claim = corpus.claims.find(row => row.id === path.claimIds[0]);
      expect(claim).toBeDefined();
      const source = corpus.sources.find(row => row.id === claim!.sourceIds[0]);
      expect(source?.nature).toBe('manufacturerClaim');
      expect(source?.source).toEqual(product!.source);
      expect(`${path.description} ${path.qualification.join(' ')}`).not.toMatch(/\b\d+(?:[.,]\d+)?\s*(?:g\/L|g\/hL|g\/g|mg\/L|g|%)\b/i);
    }
  });
});
