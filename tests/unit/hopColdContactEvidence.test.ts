import { describe, expect, it } from 'vitest';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import {
  createHopColdContactEvidenceV1,
  compareHopColdContactEvidenceSourceV1,
  readColdHopBuReferenceResultV2,
  readHopColdContactEvidenceV1,
  type HopColdContactEvidenceV1,
} from '../../src/domain/hopDecision/coldContactEvidence';
import { assessQualifiedColdHopContact, bindColdHopProgramContact, type HopColdBeerContext } from '../../src/domain/hopDecision/coldIbuContact';
import { coldHopBuReferenceResultReference, getColdHopBuCalibration, interpolateColdHopBuReference,
  type ColdHopBuCalibration } from '../../src/domain/hopDecision/coldIbuReference';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { adviceAssignment } from '../fixtures/hopAdviceJourney';

function assessmentFixture(input: { massG?: number; volumeL?: number; use?: 'fermentation' | 'postFermentation'; contactHours?: number;
  temperatureC?: number; context?: HopColdBeerContext | null; calibration?: ColdHopBuCalibration } = {}) {
  const material: HopDecisionMaterial = {
    id: 'fixture-cold-material', name: 'Houblon synthétique', form: 'cone', availableGrams: 1000,
  };
  const program: HopDecisionProgram = {
    id: 'fixture-cold-program', revision: 5, stage: 'conditioning', volumeL: input.volumeL ?? 20, wortGravity: null,
    additions: [{ id: 'future-contact', materialId: material.id, grams: input.massG ?? 58.6,
      use: input.use ?? 'postFermentation', status: 'planned',
      contactHours: input.contactHours ?? 24, temperatureC: input.temperatureC ?? 14, dayOffset: 8 }],
  };
  const defaultContext: HopColdBeerContext = {
    volumeBasis: 'beerAtContact', abvPct: 4.75, filteredBeforeContact: true, yeastStatus: 'removedBeforeContact',
    contactMode: 'static', materialPreparation: 'Préparation de fixture non authentifiée.', beerDescription: 'Bière de fixture distincte.',
    initialBitterness: { value: 50, unit: 'BU', origin: 'reported', method: null, source: null,
      timing: 'beforeSelectedContact', includesContactIds: [] },
  };
  const context = input.context === undefined ? defaultContext : input.context;
  const contact = bindColdHopProgramContact({ program, contactId: 'fixture-contact', additionIds: ['future-contact'],
    grouping: { kind: 'singleHomogeneousContact', origin: 'scenarioAssumption', reason: 'Ligne future isolée par l’hypothèse de scénario.' } });
  const assessment = assessQualifiedColdHopContact({ program, contact, qualificationInput: { variants: [adviceAssignment(material)] }, context: context ?? undefined,
    ...(input.calibration ? { calibration: input.calibration } : {}) });
  return { assessment, material, program, context };
}

/** A well-formed reference calibration from another (fixture) publication: same table shape, distinct provenance. */
function alternativeAssessment() {
  const calibration: ColdHopBuCalibration = { ...getColdHopBuCalibration(), calibrationId: 'fixture-alternative-cold-calibration',
    version: 'fixture-alternative-v1',
    source: { title: 'Calibration froide de fixture alternative', author: 'Banc de test L’Affinée', year: 2026, kind: 'research',
      reference: 'https://example.invalid/fixture-cold-calibration', locator: 'Tableau de fixture, sans valeur physique.' },
    limitations: ['Calibration de fixture : aucune conclusion physique sur une bière réelle.'] };
  return assessmentFixture({ calibration });
}

function evidenceFixture(): HopColdContactEvidenceV1 {
  const { assessment } = assessmentFixture();
  return createHopColdContactEvidenceV1({ assessment, ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
}

function sealAssessment(evidence: HopColdContactEvidenceV1): void {
  const { reference: _assessmentReference, ...assessmentBody } = evidence.assessment;
  evidence.assessment.reference = hopAdviceContentReference('hop-cold-contact-assessment-v1', assessmentBody);
}

function sealEvidence(evidence: HopColdContactEvidenceV1): void {
  const { reference: _evidenceReference, ...body } = evidence;
  evidence.reference = hopAdviceContentReference('hop-cold-contact-evidence-v1', body);
}

function resealReferenceResult(evidence: HopColdContactEvidenceV1,
  patch: Partial<HopColdContactEvidenceV1['assessment']['referenceResult']>): void {
  const { reference: _resultReference, ...resultBody } = evidence.assessment.referenceResult;
  const updated = { ...resultBody, ...patch };
  evidence.assessment.referenceResult = { ...updated, reference: coldHopBuReferenceResultReference(updated) };
  sealAssessment(evidence);
  sealEvidence(evidence);
}

function futureResultEvidence(): HopColdContactEvidenceV1 {
  const evidence = structuredClone(evidenceFixture());
  evidence.assessment.referenceResult = {
    ...evidence.assessment.referenceResult,
    format: 'cold-hop-bu-reference-result-v3',
    version: 'hop-cold-bu-reference-v3',
    futureFields: { kept: true },
  } as unknown as typeof evidence.assessment.referenceResult;
  sealAssessment(evidence);
  sealEvidence(evidence);
  return evidence;
}

describe('enveloppe durable de preuve froide', () => {
  it('scelle l’évaluation exacte et le supplément de protocole sans créer de BU cible', () => {
    const { assessment } = assessmentFixture();
    const evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    expect(evidence.assessment).toEqual(assessment);
    expect(evidence.assessment.referenceResult.valueBU).toBeCloseTo(20.2, 12);
    expect(evidence.assessment.targetAssessment).toMatchObject({ quantity: 'spectrophotometricBU', unit: 'BU', valueBU: null });
    expect(evidence.protocolSupplement).toMatchObject({
      format: 'cold-bu-protocol-supplement-v1',
      calibrationReference: assessment.referenceResult.calibrationReference,
      source: assessment.referenceResult.source,
      sourceReadingLevel: 'primaryFullText',
      hopStorage: { subject: 'hops', atmosphere: 'nitrogen', temperatureC: -20, durationHours: null },
      beerSampling: { subject: 'filteredBeer', stage: 'beforeSampling', dissolvedOxygen: { relation: 'lessThan', value: 110, unit: 'µg/L' } },
    });
    expect(evidence.protocolSupplement.reference).toMatch(/^cold-bu-protocol-supplement-v1:sha256:/);
    expect(readHopColdContactEvidenceV1(evidence)).toEqual({ status: 'valid', evidence });
  });

  it('réutilise le lecteur historique v2 sans recalculer ni réécrire le résultat', () => {
    const result = interpolateColdHopBuReference({ dose: { value: 2.93, unit: 'g/L' } });
    const read = readColdHopBuReferenceResultV2(result);
    expect(read).toEqual({ status: 'recognized', result });
    expect(result).toMatchObject({ format: 'cold-hop-bu-reference-result-v1', version: 'hop-cold-bu-reference-v2', valueBU: 20.2 });

    const future = { format: 'cold-hop-bu-reference-result-v9', version: 'future-v9', payload: { kept: [1, 2] } };
    expect(readColdHopBuReferenceResultV2(future)).toEqual({ status: 'unsupportedFormat', format: future.format, version: future.version, raw: future });
    const corrupt = { ...result, valueBU: 21 };
    expect(readColdHopBuReferenceResultV2(corrupt)).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/invalide|incohérent|Empreinte/) });
  });

  it('relit le contraste exact du producteur à 17,625 g / 21 L avec contexte bière inconnu', () => {
    const { assessment } = assessmentFixture({ massG: 17.625, volumeL: 21, use: 'fermentation',
      contactHours: 72, temperatureC: 18, context: null });
    const evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    expect(evidence.assessment.inputSnapshot.context).toBeNull();
    expect(evidence.assessment.inputSnapshot.program).toMatchObject({ volumeL: 21,
      additions: [{ grams: 17.625, use: 'fermentation', contactHours: 72, temperatureC: 18 }] });
    expect(evidence.assessment.referenceResult).toMatchObject({ status: 'interpolation',
      doseExactGPerHL: { numerator: '1175', denominator: '14' }, valueBU: 18.007142857142856,
      contrastToControlBU: 1.0071428571428571, nodesUsed: [{ doseGPerHL: 0, valueBU: 17 }, { doseGPerHL: 200, valueBU: 19.4 }] });
    expect(evidence.assessment.targetAssessment.valueBU).toBeNull();
    expect(readHopColdContactEvidenceV1(evidence)).toEqual({ status: 'valid', evidence });

    const node = createHopColdContactEvidenceV1({
      assessment: assessmentFixture({ massG: 40, volumeL: 20, context: null }).assessment,
      ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    expect(node.assessment.referenceResult).toMatchObject({ status: 'publishedObservation', valueBU: 19.4,
      doseExactGPerHL: { numerator: '200', denominator: '1' } });
    expect(readHopColdContactEvidenceV1(node)).toEqual({ status: 'valid', evidence: node });

    const outside = createHopColdContactEvidenceV1({
      assessment: assessmentFixture({ massG: 400, volumeL: 20, context: null }).assessment,
      ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    expect(outside.assessment.referenceResult).toMatchObject({ status: 'outOfDomain', valueBU: null,
      contrastToControlBU: null, doseInput: { value: 20, unit: 'g/L' } });
    expect(outside.assessment.targetAssessment.valueBU).toBeNull();
    expect(readHopColdContactEvidenceV1(outside)).toEqual({ status: 'valid', evidence: outside });
  });

  it('distingue la corruption connue du format futur et conserve le futur brut', () => {
    const valid = evidenceFixture();
    const corrupt = structuredClone(valid);
    Object.assign(corrupt.protocolSupplement.hopStorage, { temperatureC: -18 });
    expect(readHopColdContactEvidenceV1(corrupt)).toMatchObject({ status: 'invalid' });

    const future = { ...valid, format: 'hop-cold-contact-evidence-v2', futurePayload: { kept: true } };
    expect(readHopColdContactEvidenceV1(future)).toEqual({
      status: 'unsupportedFormat', format: 'hop-cold-contact-evidence-v2', raw: future,
      reason: 'Format de preuve froide futur conservé en lecture seule.',
    });

    const futureSupplement = structuredClone(valid);
    futureSupplement.protocolSupplement = { ...futureSupplement.protocolSupplement, format: 'cold-bu-protocol-supplement-v2', extra: 'opaque' } as typeof valid.protocolSupplement;
    sealEvidence(futureSupplement);
    expect(readHopColdContactEvidenceV1(futureSupplement)).toMatchObject({ status: 'unsupportedFormat', raw: futureSupplement });
  });

  it('vérifie hash connu, assessment et liaison avant de préserver un enfant futur', () => {
    const validFuture = futureResultEvidence();
    expect(readHopColdContactEvidenceV1(validFuture)).toMatchObject({ status: 'unsupportedFormat', raw: validFuture });

    const corruptAssessment = futureResultEvidence();
    corruptAssessment.assessment.reference = 'assessment-reference-corrompue';
    expect(readHopColdContactEvidenceV1(corruptAssessment)).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/évaluation froide invalide/) });

    const corruptBinding = futureResultEvidence();
    corruptBinding.sourceBinding.programReference = 'program-reference-corrompue';
    sealEvidence(corruptBinding);
    expect(readHopColdContactEvidenceV1(corruptBinding)).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/Références de source détachées/) });

    const corruptKnownSupplement = futureResultEvidence();
    Object.assign(corruptKnownSupplement.protocolSupplement.hopStorage, { temperatureC: -18 });
    sealEvidence(corruptKnownSupplement);
    expect(readHopColdContactEvidenceV1(corruptKnownSupplement)).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/métadonnées connues/) });

    const corruptEnvelopeHash = futureResultEvidence();
    corruptEnvelopeHash.reference = 'envelope-reference-corrompue';
    expect(readHopColdContactEvidenceV1(corruptEnvelopeHash)).toMatchObject({ status: 'invalid', reason: 'Empreinte de la preuve froide invalide.' });

    const corruptSupplementFuture = structuredClone(evidenceFixture());
    corruptSupplementFuture.protocolSupplement = { ...corruptSupplementFuture.protocolSupplement,
      format: 'cold-bu-protocol-supplement-v2', extra: 'future but envelope seal is stale' } as typeof corruptSupplementFuture.protocolSupplement;
    expect(readHopColdContactEvidenceV1(corruptSupplementFuture)).toMatchObject({ status: 'invalid', reason: 'Empreinte de la preuve froide invalide.' });
  });

  it('lit A comme intégrité historique seulement et marque son association à B comme périmée', () => {
    const evidence = evidenceFixture();
    const read = readHopColdContactEvidenceV1(evidence);
    expect(read.status).toBe('valid');
    expect(read).not.toHaveProperty('current');
    if (read.status !== 'valid') throw new Error('Preuve historique attendue.');
    expect(compareHopColdContactEvidenceSourceV1(read.evidence, read.evidence.sourceBinding)).toEqual({ status: 'matched' });
    expect(compareHopColdContactEvidenceSourceV1(read.evidence, { ...read.evidence.sourceBinding, programReference: 'program-B' }))
      .toEqual({ status: 'stale', mismatches: ['programReference'] });
    expect(read.evidence.assessment.inputSnapshot.program.id).toBe('fixture-cold-program');
  });

  it('COLD-03-R01 : une calibration alternative valide ne reçoit pas le supplément de protocole Lafontaine', () => {
    const { assessment } = alternativeAssessment();
    expect(assessment.referenceResult.source.title).toBe('Calibration froide de fixture alternative');
    const evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    expect(evidence.protocolSupplement).toBeNull();
    expect(readHopColdContactEvidenceV1(evidence)).toEqual({ status: 'valid', evidence });
  });

  it('COLD-03-R01 : la calibration Lafontaine par défaut garde son supplément de protocole', () => {
    const evidence = evidenceFixture();
    expect(evidence.assessment.referenceResult.source.author).toBe('S. R. Lafontaine; Thomas H. Shellhammer');
    expect(evidence.protocolSupplement).toMatchObject({ calibrationReference: evidence.assessment.referenceResult.calibrationReference,
      hopStorage: { atmosphere: 'nitrogen', temperatureC: -20 }, beerSampling: { dissolvedOxygen: { value: 110, unit: 'µg/L' } } });
    expect(readHopColdContactEvidenceV1(evidence)).toEqual({ status: 'valid', evidence });
  });

  it('COLD-03-R01 : refuse un supplément Lafontaine greffé sur une autre calibration et un supplément retiré de la calibration Lafontaine', () => {
    const alternative = createHopColdContactEvidenceV1({ assessment: alternativeAssessment().assessment,
      ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    const grafted = structuredClone(alternative) as HopColdContactEvidenceV1;
    const result = grafted.assessment.referenceResult;
    const body = { format: 'cold-bu-protocol-supplement-v1' as const, calibrationReference: result.calibrationReference,
      source: structuredClone(result.source), sourceReadingLevel: 'primaryFullText' as const,
      hopStorage: { subject: 'hops' as const, atmosphere: 'nitrogen' as const, temperatureC: -20 as const, durationHours: null },
      beerSampling: { subject: 'filteredBeer' as const, stage: 'beforeSampling' as const,
        dissolvedOxygen: { relation: 'lessThan' as const, value: 110 as const, unit: 'µg/L' as const } },
      limitations: [...evidenceFixture().protocolSupplement!.limitations] };
    grafted.protocolSupplement = { ...body, reference: hopAdviceContentReference('cold-bu-protocol-supplement-v1', body) };
    sealEvidence(grafted);
    expect(readHopColdContactEvidenceV1(grafted)).toMatchObject({ status: 'invalid',
      reason: expect.stringMatching(/supplément de protocole/i) });

    const stripped = structuredClone(evidenceFixture()) as HopColdContactEvidenceV1;
    stripped.protocolSupplement = null;
    sealEvidence(stripped);
    expect(readHopColdContactEvidenceV1(stripped)).toMatchObject({ status: 'invalid' });

    const corrupt = structuredClone(evidenceFixture());
    Object.assign(corrupt.protocolSupplement!.hopStorage, { temperatureC: -18 });
    sealEvidence(corrupt);
    expect(readHopColdContactEvidenceV1(corrupt)).toMatchObject({ status: 'invalid' });
  });

  it('ne confond pas une corruption du résultat v2 embarqué avec une nouvelle calibration', () => {
    const evidence = evidenceFixture();
    const corrupt = structuredClone(evidence);
    corrupt.assessment.referenceResult.domainGPerHL.max += 1;
    const { reference: _reference, ...assessmentBody } = corrupt.assessment;
    corrupt.assessment.reference = hopAdviceContentReference('hop-cold-contact-assessment-v1', assessmentBody);
    const { reference: _evidenceReference, ...evidenceBody } = corrupt;
    corrupt.reference = hopAdviceContentReference('hop-cold-contact-evidence-v1', evidenceBody);
    expect(readHopColdContactEvidenceV1(corrupt)).toMatchObject({ status: 'invalid', reason: expect.stringMatching(/Résultat BU imbriqué invalide/) });

    const exact = createHopColdContactEvidenceV1({
      assessment: assessmentFixture({ massG: 17.625, volumeL: 21, use: 'fermentation',
        contactHours: 72, temperatureC: 18, context: null }).assessment,
      ownerKey: 'owner-fixture-a', scopeReference: 'scope-fixture-a' });
    const changedContrast = structuredClone(exact);
    resealReferenceResult(changedContrast, { contrastToControlBU: exact.assessment.referenceResult.contrastToControlBU! + 0.01 });
    expect(readHopColdContactEvidenceV1(changedContrast)).toMatchObject({ status: 'invalid',
      reason: expect.stringMatching(/Contraste au témoin incohérent avec la valeur BU/) });
    const changedValue = structuredClone(exact);
    resealReferenceResult(changedValue, { valueBU: exact.assessment.referenceResult.valueBU! + 0.01 });
    expect(readHopColdContactEvidenceV1(changedValue)).toMatchObject({ status: 'invalid',
      reason: expect.stringMatching(/Valeur BU incohérente avec la dose exacte/) });
  });
});
