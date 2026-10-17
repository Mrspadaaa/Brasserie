import { describe, expect, it } from 'vitest';
import type { HopColdBeerContext } from '../../src/domain/hopDecision/coldIbuContact';
import { assessQualifiedColdHopContact, bindColdHopProgramContact, HOP_COLD_CONTACT_ASSESSMENT_FORMAT } from '../../src/domain/hopDecision/coldIbuContact';
import type { HopQualifiedAssemblyInput } from '../../src/domain/hopDecision/qualifiedDecision';
import { loadHopCatalogueQualificationInput } from '../../src/domain/hopDecision/catalogueLoader';
import { qualifyHopCatalogueVariants } from '../../src/domain/hopDecision/catalogueQualification';
import {
  coldContactBeerContextReference,
  coldContactQualificationReference,
  compareHopColdContactEvidenceSourceV1,
  createHopColdContactEvidenceV1,
  HOP_COLD_CONTACT_EVIDENCE_FORMAT,
  readHopColdContactEvidenceV1,
} from '../../src/domain/hopDecision/coldContactEvidence';
import { coldHopBuReferenceResultReference } from '../../src/domain/hopDecision/coldIbuReference';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import { programFingerprint } from '../../src/domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import type { HopLot } from '../../functions/src/hopIndexSchema';
import { measureBrewerHopAdviceSemanticJsonWire } from '../../functions/src/brewerHopAdviceSemanticV3';
import {
  HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES,
  HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH,
  prepareHopV55QualifiedColdContactEvidence,
  type HopV55QualifiedColdContactAuthorityV1,
  type HopV55QualifiedColdContactSelectionV1,
} from '../../src/services/hopV55/qualifiedColdContactEvidence';
import { adviceAssignment } from '../fixtures/hopAdviceJourney';

type Scope = { kind: 'recipe'; id: string };

function inputFixture() {
  const material: HopDecisionMaterial = { id: 'cold-contact-material-a', name: 'Matière synthétique froide', form: 'cone', availableGrams: 1000 };
  const program: HopDecisionProgram = {
    id: 'cold-program-a', revision: 8, stage: 'conditioning', volumeL: 20, wortGravity: null,
    additions: [{ id: 'cold-addition-a', materialId: material.id, grams: 58.6, use: 'postFermentation', status: 'planned',
      contactHours: 24, temperatureC: 14, dayOffset: 8 }],
  };
  const qualificationInput: HopQualifiedAssemblyInput = { variants: [adviceAssignment(material)] };
  const context: HopColdBeerContext = { volumeBasis: 'beerAtContact', abvPct: 4.75, filteredBeforeContact: true,
    yeastStatus: 'removedBeforeContact', contactMode: 'static', beerDescription: 'Fixture distincte de la publication.' };
  const references = {
    programReference: programFingerprint(program),
    qualificationReference: coldContactQualificationReference(qualificationInput),
    contextReference: coldContactBeerContextReference(context),
  };
  const selection: HopV55QualifiedColdContactSelectionV1 = {
    ...references, additionIds: ['cold-addition-a'], groupingReason: 'Une seule ligne explicitement sélectionnée comme hypothèse de contact.' };
  const scope: Scope = { kind: 'recipe', id: 'recipe-current-a' };
  const source = {
    ownerKey: 'owner-a', scope, scopeReference: 'scope-reference-a', ...references, program, qualificationInput, context,
  };
  const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
    ownerKey: 'owner-a', scope, scopeReference: 'scope-reference-a',
    knownReferences: {
      program: new Set([references.programReference]), qualification: new Set([references.qualificationReference]),
      context: new Set([references.contextReference]),
    },
    resolveCanonicalSource: async input => {
      if (input.ownerKey !== 'owner-a' || input.scopeReference !== 'scope-reference-a') return null;
      return structuredClone(source);
    },
  };
  return { material, program, qualificationInput, context, references, selection, authority, source };
}

describe('service readonly de preuve froide liée à la source canonique', () => {
  it('résout un contact depuis les IDs, applique lui-même scenarioAssumption et retourne la référence seule', async () => {
    const fixture = inputFixture();
    const result = await prepareHopV55QualifiedColdContactEvidence({ selection: fixture.selection, authority: fixture.authority });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Preuve froide attendue.');
    const assessment = result.evidence.assessment;
    expect(assessment.inputSnapshot.program).toEqual(fixture.program);
    expect(assessment.inputSnapshot.qualificationInput).toEqual(fixture.qualificationInput);
    expect(assessment.inputSnapshot.context).toEqual(fixture.context);
    expect(assessment.inputSnapshot.contact).toMatchObject({
      additionIds: ['cold-addition-a'],
      grouping: { kind: 'singleHomogeneousContact', origin: 'scenarioAssumption', reason: fixture.selection.groupingReason },
    });
    expect(assessment.inputSnapshot.contact.contactId).not.toBe((fixture.selection as unknown as Record<string, unknown>).contactId);
    expect(assessment.programBinding.selectedAdditions).toEqual(fixture.program.additions);
    expect(assessment.referenceResult).toMatchObject({ status: 'interpolation', doseInput: { value: 2.93, unit: 'g/L' }, valueBU: 20.2 });
    expect(assessment.targetAssessment).toMatchObject({ valueBU: null, unit: 'BU', quantity: 'spectrophotometricBU' });
    expect(result.evidence.sourceBinding).toMatchObject({ ownerKey: 'owner-a', scopeReference: 'scope-reference-a', ...fixture.references });
    expect(result.payload.utf8Bytes).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES);
    expect(result.payload.maxDepth).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH);
  });

  it('scelle la qualification du lot public en collision sans undefined et sans changer les empreintes sémantiques', async () => {
    const pack = (await import('../../src/data/hopPublicLotBootstrap.json')).default;
    const publicLot = (pack.hopLots as unknown as HopLot[]).find(row => row.id === 'public-coa-cas-2400');
    if (!publicLot) throw new Error('Le lot public de fixture doit être présent dans son pack canonique.');
    const collidingSavedLot = structuredClone(publicLot);
    const alpha = collidingSavedLot.analysis.find(row => row.analyte === 'alpha');
    if (!alpha || alpha.kind !== 'point' || typeof alpha.value !== 'number') {
      throw new Error('La fixture publique doit porter son analyse alpha ponctuelle attendue.');
    }
    // Derive a competing raw saved record from the real pack row; no observation JSON is hand-authored.
    alpha.value += 0.1;
    const qualificationInput = await loadHopCatalogueQualificationInput({ saved: { lots: [collidingSavedLot] } });
    const qualificationReference = coldContactQualificationReference(qualificationInput);
    const qualification = qualifyHopCatalogueVariants(qualificationInput);
    const group = qualification.groups.find(row => row.scope === 'lot' && row.recordId === publicLot.id);
    expect(group?.status).toBe('collisionNeedsSelection');
    expect(group?.rawVariants).toHaveLength(2);
    expect(group?.rawVariants.map(row => row.origin.kind).sort()).toEqual(['saved', 'seed']);
    expect(group?.observations.length).toBeGreaterThan(1);
    expect(group?.observations.some(row => row.modelCandidate === undefined)).toBe(true);

    const materialId = `lot:${publicLot.id}`;
    const program: HopDecisionProgram = {
      id: 'cold-public-coa-program', revision: 3, stage: 'conditioning', volumeL: 20, wortGravity: null,
      additions: [{ id: 'cold-public-coa-addition', materialId, grams: 58.6, use: 'postFermentation', status: 'planned' }],
    };
    const context: HopColdBeerContext = { volumeBasis: 'beerAtContact', abvPct: 4.75, filteredBeforeContact: true,
      yeastStatus: 'removedBeforeContact', contactMode: 'static' };
    const references = {
      programReference: programFingerprint(program), qualificationReference,
      contextReference: coldContactBeerContextReference(context),
    };
    const selection: HopV55QualifiedColdContactSelectionV1 = { ...references,
      additionIds: ['cold-public-coa-addition'], groupingReason: 'Une ligne du programme est examinée comme scénario de contact.' };
    const scope: Scope = { kind: 'recipe', id: 'recipe-public-coa-cold-fixture' };
    const source = { ownerKey: 'owner-public-coa', scope, scopeReference: 'scope-public-coa-cold', ...references,
      program, qualificationInput, context };
    const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ownerKey: source.ownerKey, scope, scopeReference: source.scopeReference,
      knownReferences: { program: new Set([references.programReference]), qualification: new Set([qualificationReference]),
        context: new Set([references.contextReference]) },
      resolveCanonicalSource: async () => structuredClone(source),
    };

    const grouping = { kind: 'singleHomogeneousContact' as const, origin: 'scenarioAssumption' as const,
      reason: selection.groupingReason };
    const contactId = `cold-contact-selection-v1:${hopAdviceContentReference('hop-cold-contact-selection-v1', {
      programReference: selection.programReference, additionIds: selection.additionIds.slice().sort(),
    })}`;
    const contact = bindColdHopProgramContact({ program, contactId, additionIds: selection.additionIds, grouping });
    const assessment = assessQualifiedColdHopContact({ program, contact, qualificationInput, context });
    const evidence = createHopColdContactEvidenceV1({ assessment, ownerKey: source.ownerKey, scopeReference: source.scopeReference });
    const fullPayload = measureBrewerHopAdviceSemanticJsonWire(evidence);
    const prepared = await prepareHopV55QualifiedColdContactEvidence({ selection, authority });
    expect(prepared.status).toBe('tooLarge');
    if (prepared.status !== 'tooLarge') throw new Error(`La fermeture complète doit rester mesurée sans troncature : ${JSON.stringify(prepared)}`);
    expect(prepared.payload).toEqual(fullPayload);
    expect(prepared.maxBytes).toBe(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES);
    expect(prepared.maxDepth).toBe(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH);
    expect(fullPayload.utf8Bytes).toBeGreaterThan(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES);
    expect(fullPayload.maxDepth).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH);

    const read = readHopColdContactEvidenceV1(evidence);
    expect(read).toMatchObject({ status: 'valid', evidence });
    expect(evidence.assessment.qualificationSnapshot.groups.find(row => row.recordId === publicLot.id)?.rawVariants).toHaveLength(2);
    expect(evidence.sourceBinding).toMatchObject({ ...references, ownerKey: source.ownerKey, scopeReference: source.scopeReference });
    expect(evidence.assessment.referenceResult.reference).toBe(coldHopBuReferenceResultReference(evidence.assessment.referenceResult));
    expect(evidence.assessment.referenceResult).toMatchObject({
      status: 'interpolation', doseInput: { value: 2.93, unit: 'g/L' }, valueBU: 20.2, controlBU: 17,
    });

    const legacySnapshot = structuredClone(evidence.assessment.qualificationSnapshot) as unknown as Record<string, any>;
    for (const group of legacySnapshot.groups) {
      for (const row of group.observations) {
        if (!Object.prototype.hasOwnProperty.call(row, 'calculationMeasurement')) row.calculationMeasurement = undefined;
        if (!Object.prototype.hasOwnProperty.call(row, 'modelCandidate')) row.modelCandidate = undefined;
      }
      for (const material of [group.commonCalculationMaterial, group.commonCalculationProjection?.material]) {
        if (material && !Object.prototype.hasOwnProperty.call(material, 'availableGrams')) material.availableGrams = undefined;
      }
    }
    const { reference: _assessmentReference, ...legacyAssessmentBody } = { ...evidence.assessment, qualificationSnapshot: legacySnapshot };
    expect(evidence.assessment.reference).toBe(hopAdviceContentReference(HOP_COLD_CONTACT_ASSESSMENT_FORMAT, legacyAssessmentBody));
    const { reference: _evidenceReference, ...legacyEvidenceBody } = { ...evidence,
      assessment: { ...evidence.assessment, qualificationSnapshot: legacySnapshot } };
    expect(evidence.reference).toBe(hopAdviceContentReference(HOP_COLD_CONTACT_EVIDENCE_FORMAT, legacyEvidenceBody));

    for (const observation of evidence.assessment.qualificationSnapshot.groups.flatMap(row => row.observations)) {
      expect(Object.entries(observation).filter(([, value]) => value === undefined)).toEqual([]);
    }
    expect(qualificationReference).toBe(coldContactQualificationReference(evidence.assessment.inputSnapshot.qualificationInput));
    expect(evidence.sourceBinding.programReference).toBe(programFingerprint(evidence.assessment.inputSnapshot.program));
    expect(evidence.sourceBinding.qualificationReference).toBe(qualificationReference);
    expect(evidence.assessment.qualificationSnapshot.groups.find(row => row.recordId === publicLot.id)?.observations)
      .toEqual(group?.observations);
  });

  it('refuse sélection vide, IDs répétés et tout champ de masse, dose, programme, owner ou déclaration humaine', async () => {
    const fixture = inputFixture();
    const empty = await prepareHopV55QualifiedColdContactEvidence({ selection: { ...fixture.selection, additionIds: [] }, authority: fixture.authority });
    expect(empty).toMatchObject({ status: 'invalidSelection' });
    const duplicate = await prepareHopV55QualifiedColdContactEvidence({ selection: { ...fixture.selection, additionIds: ['cold-addition-a', 'cold-addition-a'] }, authority: fixture.authority });
    expect(duplicate).toMatchObject({ status: 'invalidSelection' });
    for (const forbidden of [
      { doseGL: 2.93 }, { massesGrams: [58.6] }, { program: fixture.program }, { ownerKey: 'owner-b' },
      { grouping: { kind: 'singleHomogeneousContact', origin: 'userDeclaration', reason: 'non' } },
    ]) {
      const result = await prepareHopV55QualifiedColdContactEvidence({ selection: { ...fixture.selection, ...forbidden }, authority: fixture.authority });
      expect(result).toMatchObject({ status: 'invalidSelection' });
    }
  });

  it('accepte uniquement les références offertes par le host et refuse un ID étranger au programme', async () => {
    const fixture = inputFixture();
    for (const [key, reference] of [
      ['programReference', 'program-unoffered'],
      ['qualificationReference', 'qualification-unoffered'],
      ['contextReference', 'context-unoffered'],
    ] as const) {
      const unknown = await prepareHopV55QualifiedColdContactEvidence({
        selection: { ...fixture.selection, [key]: reference }, authority: fixture.authority,
      });
      expect(unknown).toEqual({ status: 'unknownReference', reference: key === 'programReference' ? 'program'
        : key === 'qualificationReference' ? 'qualification' : 'context' });
    }

    const staleAddition = await prepareHopV55QualifiedColdContactEvidence({
      selection: { ...fixture.selection, additionIds: ['addition-from-another-program'] }, authority: fixture.authority,
    });
    expect(staleAddition).toMatchObject({ status: 'invalidSelection', reason: expect.stringMatching(/ligne.*programme/i) });
  });

  it('refuse une révision de programme différente même si l’ancienne référence A était connue', async () => {
    const fixture = inputFixture();
    const changedProgram = structuredClone(fixture.program);
    changedProgram.revision += 1;
    const changedSource = { ...fixture.source, program: changedProgram };
    const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...fixture.authority,
      resolveCanonicalSource: async () => changedSource,
    };
    const result = await prepareHopV55QualifiedColdContactEvidence({ selection: fixture.selection, authority });
    expect(result).toMatchObject({ status: 'staleSource', mismatches: expect.arrayContaining(['programContent']) });
  });

  it('refuse owner ou scope détachés de l’autorité courante', async () => {
    const fixture = inputFixture();
    for (const changed of [
      { ...fixture.source, ownerKey: 'owner-b' },
      { ...fixture.source, scopeReference: 'scope-reference-b' },
      { ...fixture.source, scope: { kind: 'recipe' as const, id: 'recipe-current-b' } },
    ]) {
      const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
        ...fixture.authority, resolveCanonicalSource: async () => changed,
      };
      expect(await prepareHopV55QualifiedColdContactEvidence({ selection: fixture.selection, authority }))
        .toMatchObject({ status: 'staleSource' });
    }
  });

  it('ne peut remplacer les masses d’origine et garde le vrai dépassement décimal hors domaine', async () => {
    const oneLine = inputFixture();
    oneLine.program.additions[0].grams = 320;
    const oneLineRefs = {
      programReference: programFingerprint(oneLine.program),
      qualificationReference: coldContactQualificationReference(oneLine.qualificationInput),
      contextReference: coldContactBeerContextReference(oneLine.context),
    };
    const oneLineSource = { ...oneLine.source, ...oneLineRefs, program: oneLine.program };
    const oneLineSelection = { ...oneLineRefs, additionIds: ['cold-addition-a'], groupingReason: 'Ligne exacte du programme.' };
    const oneLineAuthority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...oneLine.authority,
      knownReferences: { program: new Set([oneLineRefs.programReference]), qualification: new Set([oneLineRefs.qualificationReference]), context: new Set([oneLineRefs.contextReference]) },
      resolveCanonicalSource: async () => oneLineSource,
    };
    const boundary = await prepareHopV55QualifiedColdContactEvidence({ selection: oneLineSelection, authority: oneLineAuthority });
    expect(boundary.status).toBe('ready');
    if (boundary.status !== 'ready') throw new Error('Référence à la borne attendue.');
    expect(boundary.evidence.assessment.referenceResult).toMatchObject({ status: 'publishedObservation', valueBU: 26,
      doseExactGPerHL: { numerator: '1600', denominator: '1' } });

    const overflow = inputFixture();
    overflow.program.additions[0].grams = 320;
    overflow.program.additions.push({ ...overflow.program.additions[0], id: 'cold-addition-tiny', grams: 1e-20 });
    const overflowRefs = {
      programReference: programFingerprint(overflow.program),
      qualificationReference: coldContactQualificationReference(overflow.qualificationInput),
      contextReference: coldContactBeerContextReference(overflow.context),
    };
    const overflowAuthority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...overflow.authority,
      knownReferences: { program: new Set([overflowRefs.programReference]), qualification: new Set([overflowRefs.qualificationReference]), context: new Set([overflowRefs.contextReference]) },
      resolveCanonicalSource: async () => ({ ...overflow.source, ...overflowRefs, program: overflow.program }),
    };
    const tooMuch = await prepareHopV55QualifiedColdContactEvidence({
      selection: { ...overflowRefs, additionIds: ['cold-addition-a', 'cold-addition-tiny'], groupingReason: 'Deux lignes du même contact.' },
      authority: overflowAuthority,
    });
    expect(tooMuch.status).toBe('ready');
    if (tooMuch.status !== 'ready') throw new Error('La preuve hors domaine reste lisible.');
    expect(tooMuch.evidence.assessment.referenceResult).toMatchObject({ status: 'outOfDomain', valueBU: null, contrastToControlBU: null });
    expect(tooMuch.evidence.assessment.programBinding.selectedAdditions.map(row => row.grams)).toEqual([320, 1e-20]);
  });

  it('préserve dose inconnue et contact composite au lieu de produire une cible', async () => {
    const fixture = inputFixture();
    fixture.program.additions[0].grams = null;
    const unknownRefs = {
      programReference: programFingerprint(fixture.program), qualificationReference: coldContactQualificationReference(fixture.qualificationInput),
      contextReference: coldContactBeerContextReference(fixture.context),
    };
    const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...fixture.authority,
      knownReferences: { program: new Set([unknownRefs.programReference]), qualification: new Set([unknownRefs.qualificationReference]), context: new Set([unknownRefs.contextReference]) },
      resolveCanonicalSource: async () => ({ ...fixture.source, ...unknownRefs, program: fixture.program }),
    };
    const unknown = await prepareHopV55QualifiedColdContactEvidence({
      selection: { ...unknownRefs, additionIds: ['cold-addition-a'], groupingReason: 'Dose de la ligne conservée inconnue.' }, authority,
    });
    expect(unknown.status).toBe('ready');
    if (unknown.status !== 'ready') throw new Error('L’inconnue doit rester une preuve lisible.');
    expect(unknown.evidence.assessment.referenceResult).toMatchObject({ status: 'doseUnknown', valueBU: null });
    expect(unknown.evidence.assessment.programBinding).toMatchObject({ totalMassGrams: null, missingMassAdditionIds: ['cold-addition-a'] });
    expect(unknown.evidence.assessment.targetAssessment.valueBU).toBeNull();

    const composite = inputFixture();
    composite.program.additions.push({ ...composite.program.additions[0], id: 'cold-addition-b', grams: 2, contactHours: 48 });
    const compositeRefs = {
      programReference: programFingerprint(composite.program),
      qualificationReference: coldContactQualificationReference(composite.qualificationInput),
      contextReference: coldContactBeerContextReference(composite.context),
    };
    const compositeAuthority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...composite.authority,
      knownReferences: { program: new Set([compositeRefs.programReference]), qualification: new Set([compositeRefs.qualificationReference]), context: new Set([compositeRefs.contextReference]) },
      resolveCanonicalSource: async () => ({ ...composite.source, ...compositeRefs, program: composite.program }),
    };
    const compositeResult = await prepareHopV55QualifiedColdContactEvidence({
      selection: { ...compositeRefs, additionIds: ['cold-addition-a', 'cold-addition-b'], groupingReason: 'Deux durées distinctes sont conservées comme groupe non homogène.' },
      authority: compositeAuthority,
    });
    expect(compositeResult.status).toBe('ready');
    if (compositeResult.status !== 'ready') throw new Error('Contact composite attendu comme preuve, sans cible.');
    expect(compositeResult.evidence.assessment.programBinding.status).toBe('unsupportedCompositeContact');
    expect(compositeResult.evidence.assessment.referenceResult).toMatchObject({ status: 'doseUnknown', valueBU: null });
    expect(compositeResult.evidence.assessment.targetAssessment.valueBU).toBeNull();
  });

  it('accepte entière une fermeture d’environ 120 Ko, la taille mesurée du Cascade du catalogue réel', async () => {
    // Decision of 2026-10-08 (n°18): 120 339 bytes were refused in the real app for the catalogue Cascade at 100 000.
    const fixture = inputFixture();
    const variants = [adviceAssignment(fixture.material)];
    for (let index = 1; index <= 55; index += 1) {
      variants.push(adviceAssignment({ ...fixture.material, id: `cold-closure-material-${index}`,
        name: `Matière synthétique distincte ${index}` }));
    }
    const qualificationInput: HopQualifiedAssemblyInput = { variants };
    const qualificationReference = coldContactQualificationReference(qualificationInput);
    const selection = { ...fixture.references, qualificationReference, additionIds: ['cold-addition-a'],
      groupingReason: 'La ligne choisie est isolée comme hypothèse de contact.' };
    const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...fixture.authority,
      knownReferences: { ...fixture.authority.knownReferences, qualification: new Set([qualificationReference]) },
      resolveCanonicalSource: async () => ({ ...fixture.source, qualificationReference, qualificationInput }),
    };
    const result = await prepareHopV55QualifiedColdContactEvidence({ selection, authority });
    expect(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES).toBe(200_000);
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error(`Une fermeture sous la borne doit être acceptée entière : ${JSON.stringify(result)}`);
    expect(result.payload.utf8Bytes).toBeGreaterThan(100_000);
    expect(result.payload.utf8Bytes).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES);
    expect(result.evidence.assessment.inputSnapshot.qualificationInput.variants).toHaveLength(56);
  });

  it('refuse une fermeture de source trop volumineuse sans tronquer ses variantes ni relever les bornes', async () => {
    const fixture = inputFixture();
    const variants = [adviceAssignment(fixture.material)];
    for (let index = 1; index <= 300; index += 1) {
      variants.push(adviceAssignment({ ...fixture.material, id: `cold-closure-material-${index}`,
        name: `Matière synthétique distincte ${index}` }));
    }
    const qualificationInput: HopQualifiedAssemblyInput = { variants };
    const qualificationReference = coldContactQualificationReference(qualificationInput);
    const selection = { ...fixture.references, qualificationReference, additionIds: ['cold-addition-a'],
      groupingReason: 'La ligne choisie est isolée comme hypothèse de contact.' };
    const authority: HopV55QualifiedColdContactAuthorityV1<Scope> = {
      ...fixture.authority,
      knownReferences: { ...fixture.authority.knownReferences, qualification: new Set([qualificationReference]) },
      resolveCanonicalSource: async () => ({ ...fixture.source, qualificationReference, qualificationInput }),
    };
    const result = await prepareHopV55QualifiedColdContactEvidence({ selection, authority });
    expect(result.status).toBe('tooLarge');
    if (result.status !== 'tooLarge') throw new Error('Une fermeture dépassant la borne doit être refusée intacte.');
    expect(result.payload.utf8Bytes).toBeGreaterThan(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_BYTES);
    expect(result.payload.maxDepth).toBeLessThanOrEqual(HOP_V55_COLD_CONTACT_MAX_PAYLOAD_DEPTH);
    expect(result).toMatchObject({ maxBytes: 200000, maxDepth: 18 });
    expect(result).not.toHaveProperty('evidence');
  });

  it('rejette les comparaisons runtime périmées A sans resceller A sous la source B', async () => {
    const fixture = inputFixture();
    const result = await prepareHopV55QualifiedColdContactEvidence({ selection: fixture.selection, authority: fixture.authority });
    expect(result.status).toBe('ready');
    if (result.status !== 'ready') throw new Error('Preuve A attendue.');
    const historical = result.evidence;
    const read = readHopColdContactEvidenceV1(historical);
    expect(read.status).toBe('valid');
    if (read.status !== 'valid') throw new Error('Archive A valide attendue.');
    const currentB = { ...read.evidence.sourceBinding, programReference: 'program-B' };
    expect(compareHopColdContactEvidenceSourceV1(read.evidence, currentB))
      .toMatchObject({ status: 'stale', mismatches: ['programReference'] });
    expect(read.evidence.assessment.inputSnapshot.program.revision).toBe(8);
  });
});
