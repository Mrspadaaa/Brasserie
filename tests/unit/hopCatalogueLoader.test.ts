import { describe, expect, it } from 'vitest';
import type { HopLot, HopSource, HopVariety } from '../../functions/src/hopIndexSchema';
import { loadHopCatalogueQualificationInput } from '../../src/domain/hopDecision/catalogueLoader';
import { hopCatalogueRecordKey, hopRawObservationReference, qualifyHopCatalogueVariants, type HopBasisEvidence } from '../../src/domain/hopDecision/catalogueQualification';
import { readHopAnalysis } from '../../src/domain/hopDecision/measurements';

const source: HopSource = { title: 'Fixture de chargement', author: 'Tests locaux', year: 2026, kind: 'observation', reference: 'fixture:loader:alpha' };
const variety = (value = 5): HopVariety => ({ id: 'fixture-loader-variety', name: 'Variété de fixture', form: 'cone', aliases: [], descriptions: [],
  analysis: [{ analyte: 'alpha', unit: 'percentMass', basis: 'asIs', kind: 'point', value, source, confidence: 'low' }] });
const lot = (): HopLot => ({ id: 'fixture-loader-lot', varietyId: variety().id, name: 'Lot de fixture', form: 'cone', analysis: [] });
function evidence(variantId: string, raw = variety()): HopBasisEvidence {
  return { evidenceId: 'fixture-explicit-basis', variantId, scope: 'variety', recordId: raw.id, location: 'variety.analysis',
    observationFingerprint: hopRawObservationReference(raw.analysis[0]), basis: 'asIs', denominator: 'productMass',
    sourceReference: source.reference, sourceLocator: 'Déclaration de fixture, pas une analyse réelle.', evidenceType: 'userChoice',
    declarationId: 'fixture-declaration', declaredBy: 'fixture-profile', declaredAt: '2026-10-01T00:00:00Z', reason: 'Base déclarée explicitement dans le test.' };
}

describe('loader de variantes avant qualification', () => {
  it('charge les références hors ligne sans prétendre lire des sauvegardes ou des stocks', async () => {
    const input = await loadHopCatalogueQualificationInput();
    expect(input.assembly.version).toBe('hop-catalogue-assembly-v1');
    expect(input.variants.filter(row => row.scope === 'variety')).toHaveLength(142);
    expect(input.variants.filter(row => row.scope === 'lot')).toHaveLength(10);
    expect(input.variants.filter(row => row.scope === 'product')).toHaveLength(6);
    expect(input.variants.every(row => row.material.availableGrams === undefined)).toBe(true);
    expect(input.variants.every(row => row.origin.packSha256 === undefined && row.origin.importerSha256 === undefined)).toBe(true);
    expect(new Set(input.variants.map(row => row.variantId)).size).toBe(input.variants.length);
  });

  it('conserve les versions de même ID, les doublons et des identités de contenu stables après permutation', async () => {
    const a = variety(5), b = variety(9);
    const forward = await loadHopCatalogueQualificationInput({ saved: { varieties: [a, b, a] } });
    const reverse = await loadHopCatalogueQualificationInput({ saved: { varieties: [a, a, b] } });
    const versions = (input: typeof forward) => input.variants.filter(row => row.scope === 'variety' && row.recordId === a.id);
    expect(versions(forward)).toHaveLength(3);
    expect(versions(forward).map(row => row.variantId).sort()).toEqual(versions(reverse).map(row => row.variantId).sort());
    expect(versions(forward).map(row => row.material.variety)).toEqual([a, b, a]);
    expect(qualifyHopCatalogueVariants(forward).groups.find(group => group.recordId === a.id)?.status).toBe('collisionNeedsSelection');
  });

  it('réutilise une assertion acceptée du même fait dans le lot lié, sans créer un second geste humain', async () => {
    const saved = { varieties: [variety()], lots: [lot()] };
    const first = await loadHopCatalogueQualificationInput({ saved });
    const varVersion = first.variants.find(row => row.scope === 'variety' && row.recordId === variety().id)!;
    const proof = evidence(varVersion.variantId), original = structuredClone(proof);
    const loaded = await loadHopCatalogueQualificationInput({ saved, basisEvidence: [proof] });
    const group = qualifyHopCatalogueVariants(loaded).groups.find(row => row.scope === 'lot' && row.recordId === lot().id)!;
    expect(readHopAnalysis(group.calculationMaterial!, 'alpha')).toMatchObject({ status: 'nominal', value: 5, scope: 'variety' });
    expect(loaded.assembly.evidenceBindings).toHaveLength(1);
    const binding = loaded.assembly.evidenceBindings[0];
    expect(binding).toMatchObject({ originalEvidenceId: proof.evidenceId, fromVariantId: proof.variantId, recordId: proof.recordId });
    expect(loaded.basisEvidence!.find(row => row.evidenceId === binding.evidenceId)).toMatchObject({ declarationId: proof.declarationId, declaredBy: proof.declaredBy, declaredAt: proof.declaredAt });
    expect(proof).toEqual(original);
  });

  it('ne résout pas une association variétale divergente par ordre et conserve ses raisons', async () => {
    const saved = { varieties: [variety(5), variety(9)], lots: [lot()] };
    const loaded = await loadHopCatalogueQualificationInput({ saved });
    const version = loaded.variants.find(row => row.scope === 'lot' && row.recordId === lot().id)!;
    expect(version.material.variety).toBeUndefined();
    expect(loaded.assembly.notices).toContainEqual(expect.objectContaining({ materialId: version.material.id,
      relatedRecordKey: hopCatalogueRecordKey('variety', variety().id), reason: expect.stringContaining('collisionNeedsSelection') }));
    const selectedVar = loaded.variants.find(row => row.scope === 'variety' && row.recordId === variety().id && row.material.variety!.analysis[0].value === 9)!;
    const selected = await loadHopCatalogueQualificationInput({ saved,
      selectedVariantByRecord: { [hopCatalogueRecordKey('variety', variety().id)]: selectedVar.variantId }, basisEvidence: [evidence(selectedVar.variantId, variety(9))] });
    expect(selected.assembly.links.find(link => link.materialId === version.material.id)?.kind).toBe('selected');
    expect(readHopAnalysis(qualifyHopCatalogueVariants(selected).groups.find(row => row.scope === 'lot' && row.recordId === lot().id)!.calculationMaterial!, 'alpha').value).toBe(9);
  });

  it('ne propage pas une preuve invalide ni un alpha variétal derrière un lot invalide', async () => {
    const invalidLot = lot(); invalidLot.analysis = [{ ...variety().analysis[0], kind: 'range', range: { min: 9, max: 2 } }];
    delete invalidLot.analysis[0].value;
    const saved = { varieties: [variety()], lots: [invalidLot] };
    const first = await loadHopCatalogueQualificationInput({ saved });
    const varVersion = first.variants.find(row => row.scope === 'variety' && row.recordId === variety().id)!;
    const proof = evidence(varVersion.variantId);
    const qualified = qualifyHopCatalogueVariants(await loadHopCatalogueQualificationInput({ saved, basisEvidence: [proof] }));
    const lotGroup = qualified.groups.find(row => row.scope === 'lot' && row.recordId === lot().id)!;
    expect(lotGroup.fallbackBlockedAnalytes).toContain('alpha');
    expect(readHopAnalysis(lotGroup.calculationMaterial!, 'alpha').status).toBe('unknown');
    for (const denominator of ['alphaAcids', 'sampleMass'] as const) {
      const brokenProof = { ...proof, denominator };
      const invalid = await loadHopCatalogueQualificationInput({ saved: { varieties: [variety()], lots: [lot()] }, basisEvidence: [brokenProof] });
      expect(invalid.assembly.evidenceBindings).toHaveLength(0);
      expect(readHopAnalysis(qualifyHopCatalogueVariants(invalid).groups.find(row => row.scope === 'lot' && row.recordId === lot().id)!.calculationMaterial!, 'alpha').status).toBe('unknown');
      expect(invalid.basisEvidence).toContainEqual(brokenProof);
    }
  });

  it('ne ressuscite pas une référence archivée par une association au seed', async () => {
    const archived = variety(); archived.archived = true;
    const loaded = await loadHopCatalogueQualificationInput({ saved: { varieties: [variety(), archived], lots: [lot()] } });
    const group = qualifyHopCatalogueVariants(loaded).groups.find(row => row.scope === 'variety' && row.recordId === archived.id)!;
    expect(group.status).toBe('archivedTombstone'); expect(group.calculationMaterial).toBeNull();
    expect(loaded.variants.find(row => row.scope === 'lot' && row.recordId === lot().id)!.material.variety).toBeUndefined();
    expect(loaded.assembly.notices.some(row => row.reason.includes('archivedTombstone'))).toBe(true);
  });
});
