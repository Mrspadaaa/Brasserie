import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { introducedHopAmounts, replacementHopDose } from '../../src/domain/hopDecision/calculations';
import { readHopAnalysis } from '../../src/domain/hopDecision/measurements';
import {
  HOP_CATALOGUE_QUALIFICATION_VERSION,
  LEGACY_MECHANICAL_ASIS_RULES,
  hopCatalogueRecordKey,
  hopRawObservationReference,
  qualifyHopCatalogueVariants,
  type HopBasisEvidence,
  type HopCatalogueVariant,
} from '../../src/domain/hopDecision/catalogueQualification';
import { readHopAlphaForModel } from '../../src/domain/hopDecision/modelInputs';
import type { HopCommercialProduct, HopDecisionMaterial } from '../../src/domain/hopDecision/types';

const manufacturerSource: HopSource = {
  title: 'Fiche analytique de démonstration', author: 'Fabricant de test', year: 2026,
  kind: 'manufacturer', reference: 'https://example.test/hops/cascade', locator: 'Tableau 1',
};
const legacySource: HopSource = {
  title: 'Hopsteiner variety page', author: 'Hopsteiner', year: null,
  kind: 'coa', reference: 'https://www.hopsteiner.de/en/varieties/cascade', locator: 'Alpha acids',
};
const pelletProduct: HopCommercialProduct = {
  id: 'pellet-product', name: 'Cascade', manufacturer: 'Test hops', form: 'pelletT90',
  supportedUses: ['boil'], source: manufacturerSource, reviewedOn: '2026-10-01', cautions: [],
};

function alpha(basis: HopMeasurement['basis'] = 'unknown', value = 5): HopMeasurement {
  return { analyte: 'alpha', unit: 'percentMass', basis, kind: 'point', value, confidence: 'medium', source: manufacturerSource };
}

function variety(id = 'cascade', analysis: HopMeasurement[] = [], extra: Partial<HopVariety> = {}): HopVariety {
  return { id, name: 'Cascade', aliases: ['CAS'], form: 'pelletT90', descriptions: [], analysis, ...extra };
}

function material(id = 'variety:cascade', analysis: HopMeasurement[] = [], extra: Partial<HopDecisionMaterial> = {}): HopDecisionMaterial {
  return { id, name: 'Cascade', form: 'pelletT90', variety: variety('cascade', analysis), ...extra };
}

function variant(
  variantId: string,
  sourceMaterial: HopDecisionMaterial,
  options: Partial<Pick<HopCatalogueVariant, 'scope' | 'recordId' | 'origin'>> = {},
): HopCatalogueVariant {
  return {
    variantId,
    scope: options.scope ?? 'variety',
    recordId: options.recordId ?? sourceMaterial.variety?.id ?? sourceMaterial.lot?.id ?? sourceMaterial.id,
    origin: options.origin ?? { kind: 'seed', packPath: 'fixture-seed.json', packSha256: 'fixture-hash' },
    material: sourceMaterial,
  };
}

function groupFor(result: ReturnType<typeof qualifyHopCatalogueVariants>, scope: string, id: string) {
  const found = result.groups.find(group => group.key === hopCatalogueRecordKey(scope as any, id));
  if (!found) throw new Error(`Groupe manquant ${scope}:${id}`);
  return found;
}

function sourceEvidence(row: {
  variantId: string;
  scope: HopBasisEvidence['scope'];
  recordId: string;
  location: HopBasisEvidence['location'];
  measurement: HopMeasurement;
  evidenceType?: HopBasisEvidence['evidenceType'];
}): HopBasisEvidence {
  return {
    evidenceId: `basis:${row.variantId}`,
    variantId: row.variantId,
    scope: row.scope,
    recordId: row.recordId,
    location: row.location,
    observationFingerprint: hopRawObservationReference(row.measurement),
    basis: 'asIs',
    denominator: 'sampleWetMass',
    evidenceType: row.evidenceType ?? 'sourceStatement',
    sourceReference: row.measurement.source.reference,
    sourceLocator: row.measurement.source.locator ?? 'Fiche / tableau 1',
    ...(row.evidenceType === 'userChoice' ? {
      declarationId: `choice:${row.variantId}`, declaredBy: 'brasseur-fixture',
      declaredAt: '2026-10-01T10:00:00Z', reason: 'Choix explicite documenté pour cette observation.',
    } : {}),
  };
}

function workingAlpha(value: number) {
  return {
    analyte: 'alpha' as const, unit: 'percentAlpha' as const, kind: 'point' as const, value,
    analyticalBasis: 'unknown' as const, origin: 'workingHypothesis' as const, source: manufacturerSource,
    selectionReason: 'Hypothèse explicitement choisie pour le modèle.',
  };
}

describe('qualification pure des variantes du catalogue houblon', () => {
  it('garde un seed corrigé lisible et distinct du candidat alpha modèle non choisi', () => {
    const rawAlpha: HopMeasurement = { ...alpha('unknown'), kind: 'range', value: undefined, range: { min: 4.5, max: 7 } };
    const result = qualifyHopCatalogueVariants({ variants: [variant('seed-cascade', material('variety:cascade', [rawAlpha]))] });
    const group = groupFor(result, 'variety', 'cascade');

    expect(result.version).toBe(HOP_CATALOGUE_QUALIFICATION_VERSION);
    expect(group.status).toBe('ready');
    expect(group.selectedVariantId).toBe('seed-cascade');
    expect(group.rawVariants[0].material.variety?.analysis[0]).toEqual(rawAlpha);
    expect(group.calculationMaterial?.variety?.analysis[0]).toMatchObject({ basis: 'unknown', range: { min: 4.5, max: 7 } });
    expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams.status).toBe('unknown');
    expect(result.modelCandidates).toMatchObject([{ selected: false, requiresSelection: true, rawRange: { min: 4.5, max: 7 } }]);
    expect(readHopAlphaForModel(group.calculationMaterial!).selectedParameter).toBeNull();
  });

  it('reconnaît seulement une attribution mécanique asIs avec empreintes exactes et conserve le brut', () => {
    const raw = { ...alpha('asIs'), source: legacySource };
    const fingerprint = hopRawObservationReference(raw);
    const rule = LEGACY_MECHANICAL_ASIS_RULES[0];
    const imported = variant('old-import', material('variety:cascade', [raw]), {
      origin: {
        kind: 'saved',
        importFingerprint: {
          packPath: rule.packPath, packSha256: rule.packSha256,
          importerPath: rule.importerPath, importerSha256: rule.importerSha256,
          recordId: 'cascade', observationFingerprints: [fingerprint],
        },
      },
    });
    const group = groupFor(qualifyHopCatalogueVariants({ variants: [imported] }), 'variety', 'cascade');

    expect(group.observations[0]).toMatchObject({ qualification: 'legacyMechanicalDefault', raw: { basis: 'asIs' } });
    expect(group.calculationMaterial?.variety?.analysis[0]).toMatchObject({ basis: 'unknown', value: 5 });
    expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams.status).toBe('unknown');

    const wrongFingerprint = variant('old-import-wrong-pack', material('variety:cascade', [raw]), {
      origin: { kind: 'saved', importFingerprint: {
        packPath: rule.packPath, packSha256: 'wrong-pack-hash', importerPath: rule.importerPath,
        importerSha256: rule.importerSha256, recordId: 'cascade', observationFingerprints: [fingerprint],
      } },
    });
    expect(groupFor(qualifyHopCatalogueVariants({ variants: [wrongFingerprint] }), 'variety', 'cascade').observations[0].qualification)
      .toBe('unqualifiedAsIs');
  });

  it('ne déduit pas une ancienne attribution depuis la copie identique, kind coa ou le mot attesté', () => {
    const raw = { ...alpha('asIs'), source: legacySource } as HopMeasurement;
    raw.note = 'valeur attestée';
    const oldCopy = variant('copie-sauvegardee', material('variety:cascade', [raw]), { origin: { kind: 'saved' } });
    const group = groupFor(qualifyHopCatalogueVariants({ variants: [oldCopy] }), 'variety', 'cascade');

    expect(group.observations[0].qualification).toBe('unqualifiedAsIs');
    expect(group.rawVariants[0].material.variety?.analysis[0]).toEqual(raw);
    expect(group.calculationMaterial?.variety?.analysis[0]).toMatchObject({ basis: 'unknown', value: 5 });
    expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams.status).toBe('unknown');
  });

  it.each([
    ['sourceStatement', 'unknown'],
    ['userChoice', 'asIs'],
  ] as const)('préserve une qualification explicite de type %s attachée à l’observation exacte', (evidenceType, rawBasis) => {
    const raw = alpha(rawBasis as HopMeasurement['basis']);
    const v = variant(`explicit-${evidenceType}`, material('variety:cascade', [raw]));
    const evidence = sourceEvidence({
      variantId: v.variantId, scope: 'variety', recordId: 'cascade', location: 'variety.analysis',
      measurement: raw, evidenceType,
    });
    const group = groupFor(qualifyHopCatalogueVariants({ variants: [v], basisEvidence: [evidence] }), 'variety', 'cascade');

    expect(group.observations[0]).toMatchObject({ qualification: 'qualifiedPhysical', effectiveBasis: 'asIs' });
    expect(group.observations[0].evidence).toEqual([evidence]);
    expect(group.calculationMaterial?.variety?.analysis[0]).toMatchObject({ basis: 'asIs', value: 5 });
    expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams).toMatchObject({ status: 'nominal', value: 1 });
  });

  it('préserve une édition utilisateur explicitement choisie même si ses chiffres copient le seed', () => {
    const seed = variant('seed', material('variety:cascade', [alpha('unknown', 5)]));
    const editedObservation = alpha('asIs', 5);
    const saved = variant('saved-explicit-edit', material('variety:cascade', [editedObservation]), { origin: { kind: 'saved' } });
    const evidence = sourceEvidence({
      variantId: saved.variantId, scope: 'variety', recordId: 'cascade', location: 'variety.analysis',
      measurement: editedObservation, evidenceType: 'userChoice',
    });
    const group = groupFor(qualifyHopCatalogueVariants({
      variants: [seed, saved], basisEvidence: [evidence],
      selectedVariantByRecord: { [hopCatalogueRecordKey('variety', 'cascade')]: saved.variantId },
    }), 'variety', 'cascade');

    expect(group.status).toBe('ready');
    expect(group.observations.map(row => row.qualification)).toEqual(['unknownBasis', 'qualifiedPhysical']);
    expect(group.calculationMaterial?.variety?.analysis[0]).toMatchObject({ basis: 'asIs', value: 5 });
    expect(group.calculationVariants.map(row => row.disposition)).toEqual(['conditional', 'selected']);
    expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams).toMatchObject({ status: 'nominal', value: 1 });
    expect(group.rawVariants.map(row => row.variantId)).toEqual(['seed', 'saved-explicit-edit']);
  });

  it('garde une observation invalide en brut sans la publier comme candidat calculable', () => {
    const invalid = { ...alpha('asIs'), source: { ...manufacturerSource, inventedMetadata: true } } as unknown as HopMeasurement;
    const result = qualifyHopCatalogueVariants({ variants: [variant('invalid-source-row', material('variety:cascade', [invalid]))] });
    const group = groupFor(result, 'variety', 'cascade');

    expect(group.observations[0]).toMatchObject({ qualification: 'invalidObservation', raw: invalid, calculationMeasurement: undefined });
    expect(group.rawVariants[0].material.variety?.analysis[0]).toEqual(invalid);
    expect(group.calculationMaterial?.variety?.analysis).toEqual([]);
    expect(result.modelCandidates).toEqual([]);
  });

  it.each(['invalid-range', 'valid-but-not-projectable'] as const)(
    'bloque le repli vers la variété si l’alpha de lot %s est écarté', caseId => {
      const lotAlpha: HopMeasurement = caseId === 'invalid-range'
        ? { ...alpha('asIs', 0), kind: 'range', value: undefined, range: { min: 8, max: 4 } }
        : { ...alpha('oil', 0), unit: 'percentOil', basis: 'oil', kind: 'point', value: 5 };
      const varietyAlpha = alpha('asIs', 7);
      const lotBeta: HopMeasurement = { ...alpha('asIs', 3), analyte: 'beta' };
      const variantId = `lot-block-${caseId}`;
      const workingHypothesis = {
        analyte: 'alpha' as const, unit: 'percentAlpha' as const, kind: 'point' as const, value: 6,
        analyticalBasis: 'unknown' as const, origin: 'workingHypothesis' as const, source: manufacturerSource,
        selectionReason: 'Hypothèse de modèle choisie séparément de l’analyse physique.',
      };
      const raw = material('stock:cascade', [], {
        variety: variety('cascade', [varietyAlpha]),
        lot: { id: 'lot-2025', varietyId: 'cascade', name: 'Cascade lot', form: 'pelletT90', analysis: [lotAlpha, lotBeta] },
        alphaForModel: workingHypothesis,
      });
      const v = variant(variantId, raw, { scope: 'lot', recordId: 'lot-2025' });
      const evidence = sourceEvidence({
        variantId, scope: 'variety', recordId: 'cascade', location: 'variety.analysis', measurement: varietyAlpha,
      });
      expect(readHopAnalysis(raw, 'alpha').status).toBe('unknown');
      const unsafeAfterOmission = { ...raw, lot: { ...raw.lot!, analysis: [] } };
      expect(readHopAnalysis(unsafeAfterOmission, 'alpha')).toMatchObject({ status: 'nominal', value: 7, scope: 'variety' });

      const group = groupFor(qualifyHopCatalogueVariants({ variants: [v], basisEvidence: [evidence] }), 'lot', 'lot-2025');
      expect(group.calculationProjection?.fallbackBlockedAnalytes).toContain('alpha');
      expect(group.fallbackBlockedAnalytes).toContain('alpha');
      expect(group.calculationMaterial?.lot?.analysis).toEqual([{ ...lotBeta, basis: 'unknown' }]);
      expect(group.calculationMaterial?.variety?.analysis).toEqual([]);
      expect(readHopAnalysis(group.calculationMaterial!, 'alpha').status).toBe('unknown');
      expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams.status).toBe('unknown');
      expect(group.calculationMaterial?.alphaForModel).toEqual(workingHypothesis);
      expect(readHopAlphaForModel(group.calculationMaterial!).value).toBe(6);
      expect(group.fallbackBlockReasons[0]).toMatchObject({ analyte: 'alpha', location: 'lot.analysis' });
      expect(group.observations.find(row => row.location === 'lot.analysis')?.raw).toEqual(lotAlpha);
    },
  );

  it('ne bloque pas un lot prioritaire à cause d’une observation variétale invalide plus basse', () => {
    const lotAlpha = alpha('asIs', 7);
    const invalidVarietyAlpha: HopMeasurement = { ...alpha('asIs', 0), kind: 'range', value: undefined, range: { min: 9, max: 3 } };
    const variantId = 'lot-priority';
    const raw = material('stock:cascade', [], {
      variety: variety('cascade', [invalidVarietyAlpha]),
      lot: { id: 'lot-2025', varietyId: 'cascade', name: 'Cascade lot', form: 'pelletT90', analysis: [lotAlpha] },
    });
    const evidence = sourceEvidence({
      variantId, scope: 'lot', recordId: 'lot-2025', location: 'lot.analysis', measurement: lotAlpha,
    });
    const group = groupFor(qualifyHopCatalogueVariants({
      variants: [variant(variantId, raw, { scope: 'lot', recordId: 'lot-2025' })], basisEvidence: [evidence],
    }), 'lot', 'lot-2025');

    expect(readHopAnalysis(raw, 'alpha')).toMatchObject({ status: 'nominal', value: 7 });
    expect(group.calculationMaterial?.lot?.analysis[0]).toMatchObject({ basis: 'asIs', value: 7 });
    expect(group.calculationMaterial?.variety?.analysis).toEqual([]);
    expect(group.fallbackBlockedAnalytes).toEqual([]);
    expect(introducedHopAmounts(group.calculationMaterial!, 20).alphaGrams).toMatchObject({ status: 'nominal', value: 1.4 });
  });

  it('préserve un alpha de lot commun quand les variétés divergent plus bas dans la hiérarchie', () => {
    const lotAlpha = alpha('asIs', 7);
    const invalidVarietyAlpha: HopMeasurement = { ...alpha('asIs', 0), kind: 'range', value: undefined, range: { min: 9, max: 3 } };
    const lowerVarietyAlpha = alpha('unknown', 4);
    const makeVariant = (variantId: string, varietyAnalysis: HopMeasurement[]) => variant(variantId, material('stock:cascade', [], {
      variety: variety('cascade', varietyAnalysis),
      lot: { id: 'lot-2025', varietyId: 'cascade', name: 'Cascade lot', form: 'pelletT90', analysis: [lotAlpha] },
    }), { scope: 'lot', recordId: 'lot-2025' });
    const variants = [makeVariant('lot-a', [invalidVarietyAlpha]), makeVariant('lot-b', [lowerVarietyAlpha])];
    const evidence = variants.map(row => sourceEvidence({
      variantId: row.variantId, scope: 'lot', recordId: 'lot-2025', location: 'lot.analysis', measurement: lotAlpha,
    }));
    const group = groupFor(qualifyHopCatalogueVariants({ variants, basisEvidence: evidence }), 'lot', 'lot-2025');

    expect(group.status).toBe('collisionNeedsSelection');
    expect(group.commonCalculationProjection?.fallbackBlockedAnalytes).toEqual([]);
    expect(group.commonCalculationMaterial?.lot?.analysis[0]).toMatchObject({ basis: 'asIs', value: 7 });
    expect(readHopAnalysis(group.commonCalculationMaterial!, 'alpha')).toMatchObject({ status: 'nominal', value: 7, scope: 'lot' });
  });

  it('ne choisit pas une hypothèse de modèle différente entre variantes communes', () => {
    const first = variant('hypothesis-a', material('variety:cascade', [alpha('unknown', 5)], { alphaForModel: workingAlpha(4.5) }));
    const second = variant('hypothesis-b', material('variety:cascade', [alpha('unknown', 5)], { alphaForModel: workingAlpha(6) }), { origin: { kind: 'saved' } });
    const group = groupFor(qualifyHopCatalogueVariants({ variants: [first, second] }), 'variety', 'cascade');

    expect(group.commonCalculationMaterial?.alphaForModel).toBeUndefined();
    expect(group.commonCalculationReasons.join(' ')).toMatch(/alphaForModel diffèrent/);
    expect(group.calculationVariants.map(row => row.material.alphaForModel?.value)).toEqual([4.5, 6]);
  });

  it.each(['supportedUses', 'maxDoseGL', 'maxEquivalentFraction', 'gramsPerGram'] as const)(
    'refuse une vue commune quand les contraintes produit divergent sur %s', constraint => {
      const product = (value: number, supportedUses: HopCommercialProduct['supportedUses'] = ['boil']): HopCommercialProduct => ({
        id: 'commercial:extract', name: 'Extrait', manufacturer: 'Fabricant', form: 'extract', supportedUses,
        source: manufacturerSource, reviewedOn: '2026-10-01', cautions: [], replacement: {
          referenceForm: 'pelletT90', uses: ['boil'], basis: 'manufacturerMassRatio',
          gramsPerGram: constraint === 'gramsPerGram' ? { min: value, max: value } : { min: 1, max: 1 },
          source: manufacturerSource, limitations: [],
          ...(constraint === 'maxDoseGL' ? { maxDoseGL: value } : {}),
          ...(constraint === 'maxEquivalentFraction' ? { maxEquivalentFraction: value } : {}),
        },
      });
      const assigned = (variantId: string, item: HopCommercialProduct) => variant(variantId,
        material('assignment:extract', [], { form: 'extract', product: item }), { scope: 'assignment', recordId: 'assignment:extract' });
      const variants = constraint === 'supportedUses'
        ? [assigned('supported-boil', product(1, ['boil'])), assigned('supported-fermentation', product(1, ['postFermentation']))]
        : [assigned('constraint-a', product(1)), assigned('constraint-b', product(2))];
      const group = groupFor(qualifyHopCatalogueVariants({ variants }), 'assignment', 'assignment:extract');

      expect(group.status).toBe('collisionNeedsSelection');
      expect(group.commonCalculationMaterial).toBeNull();
      expect(group.commonCalculationReasons.join(' ')).toMatch(/usages, précautions, ratios ou plafonds/);
      expect(group.calculationVariants.every(row => !!row.material.product?.replacement)).toBe(true);
    });

  it('signale un conflit de libellé/source produit sans fabriquer un produit commun', () => {
    const product = (name: string, source: HopSource): HopCommercialProduct => ({
      id: 'commercial:extract', name, manufacturer: 'Fabricant', form: 'extract', supportedUses: ['boil'],
      source, reviewedOn: '2026-10-01', cautions: [], replacement: {
        referenceForm: 'pelletT90', uses: ['boil'], basis: 'manufacturerMassRatio', gramsPerGram: { min: 1, max: 1 },
        source: manufacturerSource, limitations: [], maxDoseGL: 0.5,
      },
    });
    const assigned = (variantId: string, item: HopCommercialProduct) => variant(variantId,
      material('assignment:extract', [], { form: 'extract', product: item }), { scope: 'assignment', recordId: 'assignment:extract' });
    const variants = [
      assigned('label-a', product('Extrait A', manufacturerSource)),
      assigned('label-b', product('Extrait B', { ...manufacturerSource, reference: 'https://example.test/other-source' })),
    ];
    const group = groupFor(qualifyHopCatalogueVariants({ variants }), 'assignment', 'assignment:extract');

    expect(group.commonCalculationMaterial).toBeNull();
    expect(group.commonCalculationReasons.join(' ')).toMatch(/libellés ou provenances/);
    expect(group.calculationVariants.map(row => row.material.product?.name)).toEqual(['Extrait A', 'Extrait B']);
  });

  it('conserve les restrictions d’un produit identique dans la vue commune', () => {
    const product: HopCommercialProduct = {
      id: 'commercial:extract', name: 'Extrait', manufacturer: 'Fabricant', form: 'extract', supportedUses: ['boil'],
      source: manufacturerSource, reviewedOn: '2026-10-01', cautions: ['Dose publiée limitée'], replacement: {
        referenceForm: 'pelletT90', uses: ['boil'], basis: 'manufacturerMassRatio', gramsPerGram: { min: 1, max: 1.2 },
        source: manufacturerSource, limitations: ['Plafond d’emploi documenté'], maxEquivalentFraction: 0.5, maxDoseGL: 0.3,
      },
    };
    const variants = ['product-seed', 'product-saved'].map(variantId => variant(variantId,
      material('assignment:extract', [], { form: 'extract', product }), { scope: 'assignment', recordId: 'assignment:extract' }));
    const group = groupFor(qualifyHopCatalogueVariants({ variants }), 'assignment', 'assignment:extract');

    expect(group.status).toBe('equivalentVariants');
    expect(group.commonCalculationMaterial?.product).toEqual(product);
    expect(group.commonCalculationMaterial?.product?.supportedUses).toEqual(['boil']);
    expect(group.commonCalculationMaterial?.product?.replacement).toMatchObject({
      gramsPerGram: { min: 1, max: 1.2 }, maxEquivalentFraction: 0.5, maxDoseGL: 0.3,
    });
  });

  it.each(['declaredAnalysis', 'lot.analysis', 'variety.analysis'] as const)(
    'bloque asIs non qualifié dans la voie physique %s sans effacer sa valeur brute', location => {
      const raw = alpha('asIs', 8);
      const base = material('stock:cascade', []);
      const sourceMaterial: HopDecisionMaterial = location === 'declaredAnalysis'
        ? { ...base, declaredAnalysis: [raw] }
        : location === 'lot.analysis'
          ? { ...base, lot: { id: 'lot-2025', varietyId: 'cascade', name: 'Cascade lot', form: 'pelletT90', analysis: [raw] } }
          : { ...base, variety: variety('cascade', [raw]) };
      const v = variant(`as-is-${location}`, sourceMaterial);
      const group = groupFor(qualifyHopCatalogueVariants({ variants: [v] }), 'variety', 'cascade');

      const pathRaw = location === 'declaredAnalysis' ? group.rawVariants[0].material.declaredAnalysis?.[0]
        : location === 'lot.analysis' ? group.rawVariants[0].material.lot?.analysis[0]
          : group.rawVariants[0].material.variety?.analysis[0];
      expect(pathRaw).toMatchObject({ basis: 'asIs', value: 8 });
      const calc = group.calculationMaterial!;
      const pathCalc = location === 'declaredAnalysis' ? calc.declaredAnalysis?.[0]
        : location === 'lot.analysis' ? calc.lot?.analysis[0]
          : calc.variety?.analysis[0];
      expect(pathCalc?.basis).toBe('unknown');
      expect(introducedHopAmounts(calc, 20).alphaGrams.status).toBe('unknown');
    },
  );

  it('conserve toutes les variantes d’un ID en collision et ne dépend pas de leur ordre', () => {
    const sharedWorkingHypothesis = workingAlpha(4.8);
    const seed = variant('seed', material('variety:cascade', [alpha('unknown', 5)], { alphaForModel: sharedWorkingHypothesis }));
    const saved = variant('saved', material('variety:cascade', [alpha('asIs', 5)], { alphaForModel: sharedWorkingHypothesis }), { origin: { kind: 'saved' } });
    const forward = groupFor(qualifyHopCatalogueVariants({ variants: [seed, saved] }), 'variety', 'cascade');
    const reversed = groupFor(qualifyHopCatalogueVariants({ variants: [saved, seed] }), 'variety', 'cascade');

    expect(forward.status).toBe('collisionNeedsSelection');
    expect(reversed.status).toBe('collisionNeedsSelection');
    expect(forward.selectedVariantId).toBeNull();
    expect(forward.calculationMaterial).toBeNull();
    expect(forward.rawVariants.map(v => v.variantId)).toEqual(['seed', 'saved']);
    expect(reversed.rawVariants.map(v => v.variantId)).toEqual(['saved', 'seed']);
    expect(forward.calculationVariants.map(v => v.variantId).sort()).toEqual(['saved', 'seed']);
    expect(forward.commonCalculationMaterial?.variety?.analysis).toEqual([]);
    expect(forward.commonCalculationMaterial?.alphaForModel).toEqual(sharedWorkingHypothesis);
    expect(replacementHopDose({
      from: material('source:hop', [alpha('asIs', 7)]), to: forward.commonCalculationMaterial!,
      grams: 20, basis: 'sameMass', use: 'boil',
    })).toMatchObject({ status: 'nominal', value: 20 });
    expect(introducedHopAmounts(forward.commonCalculationMaterial!, 20).alphaGrams.status).toBe('unknown');

    const selected = groupFor(qualifyHopCatalogueVariants({
      variants: [saved, seed], selectedVariantByRecord: { [hopCatalogueRecordKey('variety', 'cascade')]: 'saved' },
    }), 'variety', 'cascade');
    expect(selected.status).toBe('ready');
    expect(selected.selectedVariantId).toBe('saved');
    expect(selected.calculationMaterial?.variety?.analysis[0]).toMatchObject({ basis: 'unknown', value: 5 });
    expect(selected.calculationVariants.map(row => [row.variantId, row.disposition])).toEqual([
      ['saved', 'selected'], ['seed', 'conditional'],
    ]);
    expect(selected.rawVariants).toHaveLength(2);
  });

  it('ne laisse pas une analyse de lot divergente révéler un alpha variétal commun par repli', () => {
    const varietyAlpha = alpha('unknown', 4.5);
    const makeLotVersion = (variantId: string, lotAlpha: HopMeasurement) => variant(variantId, material('stock:cascade', [], {
      variety: variety('cascade', [varietyAlpha]),
      lot: { id: 'lot-2025', varietyId: 'cascade', name: 'Cascade lot', form: 'pelletT90', analysis: [lotAlpha] },
    }));
    const result = qualifyHopCatalogueVariants({ variants: [makeLotVersion('lot-view-a', alpha('asIs', 5)), makeLotVersion('lot-view-b', alpha('asIs', 7))] });
    const group = groupFor(result, 'variety', 'cascade');
    const common = group.commonCalculationMaterial!;

    expect(group.status).toBe('collisionNeedsSelection');
    expect(common.lot?.analysis).toEqual([]);
    expect(common.variety?.analysis).toEqual([]);
    expect(group.commonCalculationProjection?.fallbackBlockedAnalytes).toContain('alpha');
    expect(group.commonCalculationProjection?.fallbackBlockReasons[0]).toMatchObject({ analyte: 'alpha', location: 'lot.analysis' });
    expect(introducedHopAmounts(common, 20).alphaGrams.status).toBe('unknown');
    expect(replacementHopDose({
      from: material('source:hop', [alpha('asIs', 7)]), to: common, grams: 20, basis: 'sameMass', use: 'boil',
    })).toMatchObject({ status: 'nominal', value: 20 });
    expect(group.calculationVariants.map(row => row.material.lot?.analysis[0].value)).toEqual([5, 7]);
  });

  it('propage le blocage d’un lot invalide jusque dans la vue commune équivalente', () => {
    const invalidLotAlpha: HopMeasurement = { ...alpha('asIs', 0), kind: 'range', value: undefined, range: { min: 8, max: 4 } };
    const varietyAlpha = alpha('asIs', 7);
    const makeVariant = (variantId: string) => variant(variantId, material('stock:cascade', [], {
      variety: variety('cascade', [varietyAlpha]),
      lot: { id: 'lot-2025', varietyId: 'cascade', name: 'Cascade lot', form: 'pelletT90', analysis: [invalidLotAlpha] },
    }), { scope: 'lot', recordId: 'lot-2025' });
    const variants = [makeVariant('invalid-lot-a'), makeVariant('invalid-lot-b')];
    const evidence = variants.map(row => sourceEvidence({
      variantId: row.variantId, scope: 'variety', recordId: 'cascade', location: 'variety.analysis', measurement: varietyAlpha,
    }));
    const group = groupFor(qualifyHopCatalogueVariants({ variants, basisEvidence: evidence }), 'lot', 'lot-2025');

    expect(group.status).toBe('equivalentVariants');
    expect(group.commonCalculationProjection?.fallbackBlockedAnalytes).toContain('alpha');
    expect(group.commonCalculationMaterial?.lot?.analysis).toEqual([]);
    expect(group.commonCalculationMaterial?.variety?.analysis).toEqual([]);
    expect(introducedHopAmounts(group.commonCalculationMaterial!, 20).alphaGrams.status).toBe('unknown');
    expect(group.rawVariants.every(row => row.material.lot?.analysis[0].range?.min === 8)).toBe(true);
  });

  it('regroupe sans choix arbitraire les variantes strictement équivalentes en faits et qualification', () => {
    const same = material('variety:cascade', [alpha('unknown', 5)]);
    const seed = variant('seed-copy', same);
    const saved = variant('saved-copy', same, { origin: { kind: 'saved' } });
    const group = groupFor(qualifyHopCatalogueVariants({ variants: [saved, seed] }), 'variety', 'cascade');

    expect(group.status).toBe('equivalentVariants');
    expect(group.selectedVariantId).toBeNull();
    expect(group.equivalentVariantIds).toEqual(['saved-copy', 'seed-copy']);
    expect(group.calculationMaterial?.variety?.analysis).toEqual([alpha('unknown', 5)]);
    expect(group.rawVariants).toHaveLength(2);
  });

  it('ne laisse pas un état archivé être réactivé par le seed du même ID', () => {
    const seed = variant('seed-active', material('variety:cascade', [alpha('unknown', 5)]));
    const archived = variant('saved-archive', material('variety:cascade', [alpha('asIs', 5)], { variety: variety('cascade', [alpha('asIs', 5)], { archived: true }) }), { origin: { kind: 'saved' } });
    const group = groupFor(qualifyHopCatalogueVariants({ variants: [seed, archived] }), 'variety', 'cascade');

    expect(group.status).toBe('archivedTombstone');
    expect(group.calculationMaterial).toBeNull();
    expect(group.selectedVariantId).toBeNull();
    expect(group.rawVariants.map(v => v.variantId)).toEqual(['seed-active', 'saved-archive']);
    expect(group.blockers[0]).toMatch(/état archivé/i);
  });

  it('garde variété, lots, produit et stocks distincts même si leurs noms concordent', () => {
    const sameName = 'Cascade';
    const rows: HopCatalogueVariant[] = [
      variant('variety', material('variety:cascade', [], { name: sameName }), { scope: 'variety', recordId: 'cascade' }),
      variant('lot-a', material('lot-a', [], { name: sameName, lot: { id: 'lot-a', varietyId: 'cascade', name: sameName, form: 'pelletT90', analysis: [] } }), { scope: 'lot', recordId: 'lot-a' }),
      variant('lot-b', material('lot-b', [], { name: sameName, lot: { id: 'lot-b', varietyId: 'cascade', name: sameName, form: 'pelletT90', analysis: [] } }), { scope: 'lot', recordId: 'lot-b' }),
      variant('product', material('product:pellet', [], { name: sameName, product: pelletProduct }), { scope: 'product', recordId: 'pellet-product' }),
      variant('stock-a', material('stock-a', [], { name: sameName, stockItemRef: 'stock-a' }), { scope: 'assignment', recordId: 'stock-a' }),
      variant('stock-b', material('stock-b', [], { name: sameName, stockItemRef: 'stock-b' }), { scope: 'assignment', recordId: 'stock-b' }),
    ];
    const result = qualifyHopCatalogueVariants({ variants: rows });

    expect(result.groups).toHaveLength(6);
    expect(result.groups.every(group => group.status === 'ready')).toBe(true);
    expect(result.groups.map(group => group.key)).toEqual([
      hopCatalogueRecordKey('variety', 'cascade'), hopCatalogueRecordKey('lot', 'lot-a'),
      hopCatalogueRecordKey('lot', 'lot-b'), hopCatalogueRecordKey('product', 'pellet-product'),
      hopCatalogueRecordKey('assignment', 'stock-a'), hopCatalogueRecordKey('assignment', 'stock-b'),
    ]);
    expect(() => qualifyHopCatalogueVariants({ variants: [variant('wrong-scope', material('variety:cascade'), { scope: 'product', recordId: 'cascade' })] }))
      .toThrow(/Identité\/scope invalide/);
  });
});
