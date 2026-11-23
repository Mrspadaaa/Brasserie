import { describe, expect, it } from 'vitest';
import type { HopMeasurement, HopSource } from '../../functions/src/hopIndexSchema';
import { answerQualifiedHopDecision, type HopQualifiedAssemblyInput } from '../../src/domain/hopDecision/qualifiedDecision';
import { captureHopDecisionQualifiedRecipePreparationEvent, captureHopDecisionQualifiedSelectionEvent } from '../../src/domain/hopDecision/dossierAdapter';
import { hopCatalogueRecordKey, hopRawObservationReference, type HopBasisEvidence, type HopCatalogueVariant } from '../../src/domain/hopDecision/catalogueQualification';
import { previewHopPlannedRecipe } from '../../src/domain/hopDecision/plannerRecipe';
import { selectHopReplacementPath } from '../../src/domain/hopDecision/planner';
import type { HopAssembledCatalogueInput } from '../../src/domain/hopDecision/catalogueLoader';
import { makeHopDossierJourneyFixture } from '../fixtures/hopDecisionDossierJourney';
import {
  applyHopDecisionEventV2, assertHopDecisionSupersedesFormatCompatible, createHopDecisionDossierV2, createHopDecisionEvent, createHopDecisionEventV2,
  hopDecisionEventContentReference, readHopDecisionDossier, readHopDecisionEvent,
  type HopDecisionStudySnapshotV2,
} from '../../src/domain/hopDecision/dossier';
import type { HopDecisionAction } from '../../src/domain/hopDecision/service';
import type { HopCommercialProduct, HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';

const source: HopSource = { kind: 'observation', title: 'Fixture qualification houblon', author: 'Tests J3', year: 2026,
  reference: 'fixture:qualified-decision', locator: 'Valeurs synthétiques; aucune donnée réelle.' };
type Assert<T extends true> = T;
type LoaderInputFitsQualifiedFacade = Assert<HopAssembledCatalogueInput extends HopQualifiedAssemblyInput ? true : false>;
const _loaderContractCheck: LoaderInputFitsQualifiedFacade = true;

function alpha(basis: HopMeasurement['basis'] = 'asIs', value = 5): HopMeasurement {
  return { analyte: 'alpha', unit: 'percentMass', kind: 'point', value, basis, confidence: 'medium', source };
}

function workingAlpha() {
  return { analyte: 'alpha' as const, unit: 'percentAlpha' as const, kind: 'point' as const, value: 7,
    analyticalBasis: 'unknown' as const, origin: 'workingHypothesis' as const, source,
    selectionReason: 'Hypothèse explicitement conservée pour le modèle de fixture.' };
}

function product(maxDoseGL = 0.1): HopCommercialProduct {
  return { id: 'product-limited', name: 'Produit documentaire limité', manufacturer: 'Fixture', form: 'pelletT90',
    supportedUses: ['boil'], source, reviewedOn: '2026-10-01', cautions: [], replacement: {
      referenceForm: 'pelletT90', uses: ['boil'], basis: 'manufacturerMassRatio', gramsPerGram: { min: 1, max: 1 },
      source, limitations: ['Contrat de dose de fixture.'], maxDoseGL,
    } };
}

function material(id: string, options: { measurement?: HopMeasurement; archived?: boolean; product?: HopCommercialProduct; stock?: number | null } = {}): HopDecisionMaterial {
  return {
    id, name: `Fixture ${id}`, form: 'pelletT90', alphaForModel: workingAlpha(),
    availableGrams: options.stock ?? 100, declaredAnalysis: options.measurement ? [structuredClone(options.measurement)] : [],
    variety: { id: `variety:${id}`, name: `Fixture ${id}`, aliases: [], form: 'pelletT90', descriptions: [], analysis: [],
      ...(options.archived ? { archived: true } : {}) },
    lot: { id: `lot:${id}`, varietyId: `variety:${id}`, name: `Fixture ${id}`, form: 'pelletT90', analysis: [] },
    ...(options.product ? { product: options.product } : {}),
  };
}

function variant(variantId: string, value: HopDecisionMaterial, recordId = value.id): HopCatalogueVariant {
  return { variantId, scope: 'assignment', recordId, origin: { kind: 'assignment', recordedAt: '2026-10-01T08:00:00.000Z' }, material: value };
}

function fixtureInput<A extends HopDecisionAction>(action: A, variants: HopCatalogueVariant[], extra: Partial<HopQualifiedAssemblyInput> = {}) {
  return { intent: { originalQuestion: 'Comparer des faits de fixture sans en faire une recommandation sensorielle.',
    interpretation: 'Demande déterministe de test.' }, action,
    qualificationInput: { variants, ...extra } };
}

function program(materialId: string, overrides: Partial<HopDecisionProgram> = {}): HopDecisionProgram {
  return { id: 'fixture-program', revision: 4, stage: 'planning', volumeL: 20, wortGravity: 1.05, additions: [
    { id: 'addition:boil', materialId, grams: 10, use: 'boil', status: 'planned', boilMinutes: 60 },
  ], ...overrides };
}

function basisEvidence(variantId: string, measurement: HopMeasurement): HopBasisEvidence {
  return { evidenceId: `evidence:${variantId}`, variantId, scope: 'declaration', recordId: `material:${variantId}`,
    location: 'declaredAnalysis', observationFingerprint: hopRawObservationReference(measurement), basis: 'asIs', denominator: 'sampleWetMass',
    evidenceType: 'userChoice', sourceReference: measurement.source.reference, sourceLocator: measurement.source.locator!,
    declarationId: `declaration:${variantId}`, declaredBy: 'brasseur-fixture', declaredAt: '2026-10-01T09:00:00.000Z',
    reason: 'Choix explicite de base pour cette observation exacte.' };
}

describe('raccord qualification de catalogue → décision J1', () => {
  it('retire asIs non qualifié de la charge physique tout en conservant une hypothèse alpha indépendante', () => {
    const raw = alpha('asIs', 5);
    const sourceMaterial = { ...material('material:legacy', { measurement: raw }), id: 'material:legacy' };
    const study = answerQualifiedHopDecision(fixtureInput({ kind: 'assessProgram', program: program(sourceMaterial.id) }, [variant('legacy-v1', sourceMaterial)]));

    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Fixture attendue calculée.');
    const safe = study.calculationInput.materials.find(row => row.id === sourceMaterial.id)!;
    expect(safe.declaredAnalysis?.[0].basis).toBe('unknown');
    expect(study.responseSnapshot.result.analysis.additions[0].alphaGrams.status).toBe('unknown');
    expect(study.responseSnapshot.result.analysis.additions[0].boilIbu.status).toBe('nominal');
    expect(study.responseSnapshot.result.analysis.additions[0].boilIbu.reasons.join(' ')).toMatch(/aucune base.*déduite|hypothèse/i);
    expect(safe.alphaForModel).toEqual(sourceMaterial.alphaForModel);
  });

  it('une preuve structurée restaure seulement la charge de cette observation liée', () => {
    const raw = alpha('asIs', 5);
    const row = { ...material('material:declared', { measurement: raw }), id: 'material:declared' };
    const evidence = basisEvidence('declared-v1', raw);
    evidence.recordId = row.id;
    const study = answerQualifiedHopDecision(fixtureInput({ kind: 'assessProgram', program: program(row.id) }, [variant('declared-v1', row)], { basisEvidence: [evidence] }));

    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('Fixture attendue calculée.');
    expect(study.calculationInput.materials[0].declaredAnalysis?.[0].basis).toBe('asIs');
    expect(study.responseSnapshot.result.analysis.additions[0].alphaGrams).toMatchObject({ status: 'nominal', value: 0.5, unit: 'g alpha' });
    expect(study.request.qualificationInput.basisEvidence).toEqual([evidence]);
  });

  it('le choix explicite d’une variante est indépendant de l’ordre; sélection invalide et archive ne font pas de fallback', () => {
    const first = variant('variant-a', material('material:collision', { measurement: alpha('unknown', 4) }));
    const selected = variant('variant-b', material('material:collision', { measurement: alpha('unknown', 8) }));
    const secondId = 'material:reference';
    const reference = variant('reference', material(secondId, { measurement: alpha('unknown', 6) }));
    const key = hopCatalogueRecordKey('assignment', 'material:collision');
    const compare: Extract<HopDecisionAction, { kind: 'compareMaterials' }> = { kind: 'compareMaterials', leftId: 'material:collision', rightId: secondId };
    const forward = answerQualifiedHopDecision(fixtureInput(compare, [first, selected, reference], { selectedVariantByRecord: { [key]: 'variant-b' } }));
    const reversed = answerQualifiedHopDecision(fixtureInput(compare, [reference, selected, first], { selectedVariantByRecord: { [key]: 'variant-b' } }));
    expect(forward.kind).toBe('calculated');
    expect(reversed.kind).toBe('calculated');
    if (forward.kind !== 'calculated' || reversed.kind !== 'calculated') throw Error('Variante explicitement choisie attendue.');
    expect(forward.calculationInput.materials.find(row => row.id === 'material:collision')?.declaredAnalysis?.[0].value).toBe(8);
    expect(reversed.calculationInput.materials.find(row => row.id === 'material:collision')?.declaredAnalysis?.[0].value).toBe(8);
    expect(forward.request.qualificationInput.variants).toEqual([first, selected, reference]);

    const invalid = answerQualifiedHopDecision(fixtureInput(compare, [first, selected, reference], { selectedVariantByRecord: { [key]: 'absent-variant' } }));
    expect(invalid.kind).toBe('resolutionRequired');
    expect(invalid.responseSnapshot).toBeNull();
    expect(invalid.calculationInput).toBeNull();
    expect(invalid.blockingIssues[0]).toMatchObject({ code: 'requiredMaterialUnresolved', materialId: 'material:collision' });

    const archived = variant('archived-v1', material('material:collision', { archived: true, measurement: alpha('unknown', 3) }));
    const archivedStudy = answerQualifiedHopDecision(fixtureInput(compare, [archived, reference]));
    expect(archivedStudy.kind).toBe('resolutionRequired');
    expect(archivedStudy.skippedCandidates[0].disposition).toBe('archivedTombstone');
  });

  it('ignore un groupe collisionnel hors du périmètre et garde les candidats non évalués comme couverture partielle', () => {
    const left = variant('left', material('left', { measurement: alpha('unknown', 4) }));
    const right = variant('right', material('right', { measurement: alpha('unknown', 6) }));
    const otherA = variant('other-a', material('other', { measurement: alpha('unknown', 2) }));
    const otherB = variant('other-b', material('other', { measurement: alpha('unknown', 11) }));
    const comparison = answerQualifiedHopDecision(fixtureInput({ kind: 'compareMaterials', leftId: 'left', rightId: 'right' }, [left, right, otherA, otherB]));
    expect(comparison.kind).toBe('calculated');
    expect(comparison.evaluatedRecords.map(row => row.recordKey)).not.toContain(hopCatalogueRecordKey('assignment', 'other'));
    expect(comparison.resolutionCoverage).toBe('complete');

    const sourceMaterial = material('source', { stock: 0 });
    const viableCandidate = material('candidate', { stock: 100, product: product() });
    const archivedCandidate = material('archived-candidate', { archived: true });
    const action: Extract<HopDecisionAction, { kind: 'substitute' }> = { kind: 'substitute', program: program('source'), additionId: 'addition:boil',
      candidateIds: ['candidate', 'archived-candidate'], basis: 'sameMass' };
    const plan = answerQualifiedHopDecision(fixtureInput(action, [variant('source-v1', sourceMaterial), variant('candidate-v1', viableCandidate), variant('archived-v1', archivedCandidate)]));
    expect(plan.kind).toBe('calculated');
    if (plan.kind !== 'calculated') throw Error('Les candidats sûrs doivent rester évalués.');
    expect(plan.resolutionCoverage).toBe('partial');
    expect(plan.skippedCandidates).toContainEqual(expect.objectContaining({ materialId: 'archived-candidate', disposition: 'archivedTombstone' }));
    expect(plan.calculationInput.action.kind).toBe('substitute');
    if (plan.calculationInput.action.kind !== 'substitute') throw Error('Action fixture incorrecte.');
    expect(plan.calculationInput.action.candidateIds).toEqual(['candidate']);
    expect(plan.responseSnapshot.result.searchedMaterialIds).toEqual(['candidate']);
    expect(plan.responseSnapshot.result.options[0].applicability).toBe('blocked');
    expect(plan.responseSnapshot.result.options[0].reasons.join(' ')).toMatch(/dose planifiée cumulée.*au-delà du maximum documenté/i);
  });

  it('sameMass sans alpha reste calculable et respecte le plafond cumulatif réel de J1', () => {
    const sourceMaterial = material('source', { stock: 0 });
    const candidate = material('limited', { stock: 100, product: product(0.1), measurement: alpha('unknown', 5) });
    const action: Extract<HopDecisionAction, { kind: 'planReplacement' }> = {
      kind: 'planReplacement', program: program('source'), unavailable: { materialId: 'source', reason: 'Fixture', origin: 'user' },
      basisByUse: { boil: 'sameMass' }, candidateMaterialIds: ['limited'],
      limits: { maxCandidateMaterials: 5, maxAssignments: 20, maxPrograms: 10 },
    };
    const study = answerQualifiedHopDecision(fixtureInput(action, [variant('source', sourceMaterial), variant('limited', candidate)]));
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('sameMass doit s’évaluer sans alpha physique.');
    expect(study.responseSnapshot.result.plan.paths.some(path => path.assignments.some(assignment => assignment.candidateMaterialId === 'limited'))).toBe(true);
    const target = study.responseSnapshot.result.plan.paths.find(path => path.assignments.some(assignment => assignment.candidateMaterialId === 'limited'))!;
    expect(target.applicability).toBe('unavailable');
    expect(target.conditions.join(' ')).toMatch(/dose planifiée cumulée.*au-delà du maximum documenté/i);
    expect(study.calculationInput.materials.find(row => row.id === 'limited')?.declaredAnalysis?.[0].basis).toBe('unknown');
  });

  it('expose les notices assembly pertinentes, ignore les notices d’une version inconnue et dérive les produits qualifiés', () => {
    const row = material('material:lot', { measurement: alpha('unknown', 5) });
    const known: HopQualifiedAssemblyInput = { variants: [variant('lot-v1', row)], assembly: {
      version: 'hop-catalogue-assembly-v1', sources: [], links: [], evidenceBindings: [], limitations: [],
      notices: [{ materialId: row.id, relatedRecordKey: 'lot:lot-reference', reason: 'Variante variété non associée; ses faits propres restent conservés.' }],
    } };
    const action = { kind: 'assessProgram', program: program(row.id) } satisfies HopDecisionAction;
    const study = answerQualifiedHopDecision(fixtureInput(action, known.variants, { assembly: known.assembly }));
    expect(study.kind).toBe('calculated');
    expect(study.reasons).toContain('Variante variété non associée; ses faits propres restent conservés.');
    expect(study.partialRecordKeys).toContain('lot:lot-reference');

    const futureAssembly = { ...known, assembly: { version: 'hop-catalogue-assembly-v99', notices: [{ materialId: row.id, relatedRecordKey: 'secret', reason: 'Ne pas interpréter.' }] } };
    const suspended = answerQualifiedHopDecision(fixtureInput(action, futureAssembly.variants, { assembly: futureAssembly.assembly }));
    expect(suspended.kind).toBe('resolutionRequired');
    expect(suspended.reasons.join(' ')).not.toContain('Ne pas interpréter.');
    expect(suspended.blockingIssues).toContainEqual(expect.objectContaining({ code: 'assemblyVersionUnknown' }));

    const commercial = product();
    const productMaterial = material('product-material', { product: commercial });
    productMaterial.product = { ...commercial, id: 'fixture-product' };
    const productVariant: HopCatalogueVariant = { variantId: 'product-v1', scope: 'product', recordId: 'fixture-product',
      origin: { kind: 'seed' }, material: productMaterial };
    const productStudy = answerQualifiedHopDecision(fixtureInput({ kind: 'understandProducts', productIds: ['fixture-product'] }, [productVariant]));
    expect(productStudy.kind).toBe('calculated');
    if (productStudy.kind !== 'calculated') throw Error('Le produit qualifié doit rester exposable.');
    expect(productStudy.calculationInput.products).toEqual([{ ...commercial, id: 'fixture-product' }]);
    expect(productStudy.responseSnapshot.result.products.map(item => item.id)).toEqual(['fixture-product']);
  });

  it('archive le reçu v2 intégralement, conserve les anciennes versions en lecture seule et versionne les événements', () => {
    const row = material('material:archive', { measurement: alpha('unknown', 5) });
    const study = answerQualifiedHopDecision(fixtureInput({ kind: 'compareMaterials', leftId: row.id, rightId: row.id }, [variant('archive-v1', row)]));
    if (study.kind !== 'calculated') throw Error('Étude calculée attendue.');
    const created = createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: 'qualified-01', eventId: 'saved-01',
      recordedAt: '2026-10-01T10:00:00.000Z', study });
    expect(created.dossier.formatVersion).toBe(2);
    expect(created.event).toMatchObject({ eventFormatVersion: 2, kind: 'studySaved', payload: { snapshotFormatVersion: 2 } });
    expect(readHopDecisionDossier(created.dossier)).toEqual(created.dossier);

    const unknownQualification = structuredClone(created.dossier);
    (unknownQualification.study as any).qualificationSnapshot.version = 'hop-catalogue-qualification-v99';
    const rawQualification = readHopDecisionDossier(unknownQualification);
    expect(rawQualification).toMatchObject({ status: 'unsupportedFormat', reason: 'qualificationVersion', raw: unknownQualification });
    const unknownAssembly = structuredClone(created.dossier);
    (unknownAssembly.study as any).request.qualificationInput.assembly = { version: 'hop-catalogue-assembly-v9', notices: ['future'] };
    expect(readHopDecisionDossier(unknownAssembly)).toMatchObject({ status: 'unsupportedFormat', reason: 'assemblyVersion', raw: unknownAssembly });
    const unknownCalculation = structuredClone(created.dossier);
    (unknownCalculation.study as any).responseSnapshot.version = 'hop-decision-v99';
    expect(readHopDecisionDossier(unknownCalculation)).toMatchObject({ status: 'unsupportedFormat', reason: 'calculationVersion', raw: unknownCalculation });

    const command = { ownerKey: 'fixture-owner', dossierId: 'qualified-01', eventId: 'event-same', expectedRevision: 1,
      recordedAt: '2026-10-01T10:01:00.000Z', kind: 'supersededBy' as const,
      payload: { successorDossierId: 'successor', reason: 'Fixture.' } };
    const eventV1 = createHopDecisionEvent(command);
    const eventV2 = createHopDecisionEventV2(command);
    expect(readHopDecisionEvent(eventV1)).toEqual(eventV1);
    expect(readHopDecisionEvent(eventV2)).toEqual(eventV2);
    expect(hopDecisionEventContentReference(eventV1)).not.toBe(hopDecisionEventContentReference(eventV2));
  });

  it('autorise un successeur v2 d’origine v1/v2 et refuse le downgrade v1 d’une étude qualifiée', () => {
    expect(() => assertHopDecisionSupersedesFormatCompatible(2, 1)).not.toThrow();
    expect(() => assertHopDecisionSupersedesFormatCompatible(2, 2)).not.toThrow();
    expect(() => assertHopDecisionSupersedesFormatCompatible(1, 1)).not.toThrow();
    expect(() => assertHopDecisionSupersedesFormatCompatible(1, 2)).toThrow(/ne peut pas remplacer.*v2/i);
  });

  it('refuse la rétention sur resolutionRequired jusque dans le reducer v2', () => {
    const first = variant('first', material('shared', { measurement: alpha('unknown', 4) }));
    const second = variant('second', material('shared', { measurement: alpha('unknown', 9) }));
    const study = answerQualifiedHopDecision(fixtureInput({ kind: 'compareMaterials', leftId: 'shared', rightId: 'shared' }, [first, second], {
      selectedVariantByRecord: { [hopCatalogueRecordKey('assignment', 'shared')]: 'missing' },
    }));
    expect(study.kind).toBe('resolutionRequired');
    const created = createHopDecisionDossierV2({ ownerKey: 'fixture-owner', dossierId: 'needs-resolution', eventId: 'saved-needs-resolution',
      recordedAt: '2026-10-01T10:00:00.000Z', study: study as HopDecisionStudySnapshotV2 });
    const event = createHopDecisionEventV2({ ownerKey: 'fixture-owner', dossierId: 'needs-resolution', eventId: 'retention-attempt',
      expectedRevision: 1, recordedAt: '2026-10-01T10:01:00.000Z', kind: 'optionRetained',
      payload: { decisionId: 'decision', optionId: 'path', selection: {} as any, reason: 'Fixture.' } });
    expect(() => applyHopDecisionEventV2(created.dossier, event, [created.event])).toThrow(/exigent une étude v2 réellement calculée/i);
  });

  it('garde les gardes J1 lors de la rétention et du reçu complet de préparation qualifiés v2', () => {
    const journey = makeHopDossierJourneyFixture();
    const variants = journey.input.materials.map(row => ({ variantId: `assigned:${row.id}`, scope: 'assignment' as const,
      recordId: row.id, origin: { kind: 'assignment' as const }, material: row }));
    const study = answerQualifiedHopDecision({ intent: journey.input.intent, action: journey.input.action,
      qualificationInput: { variants } });
    expect(study.kind).toBe('calculated');
    if (study.kind !== 'calculated') throw Error('La fixture de parcours J1 doit fournir ses matières obligatoires.');
    const request = study.responseSnapshot.result.request;
    const path = study.responseSnapshot.result.plan.paths.find(candidate => candidate.complete && candidate.assignments.length === 2
      && candidate.assignments.every(assignment => assignment.candidateMaterialId === 'petal'))!;
    const selection = selectHopReplacementPath({ request, plan: study.responseSnapshot.result.plan, pathId: path.pathId });
    const event = captureHopDecisionQualifiedSelectionEvent({ identity: { ownerKey: 'fixture-owner', dossierId: 'qualified-plan',
      eventId: 'retain-plan', expectedRevision: 1, recordedAt: '2026-10-01T11:00:00.000Z' },
      study, currentStudy: study, decisionId: 'decision-v2', selection, reason: 'Choix explicite de fixture.' });
    expect(event).toMatchObject({ eventFormatVersion: 2, kind: 'optionRetained', payload: { optionId: selection.pathId } });

    const preview = previewHopPlannedRecipe({ request, selection, recipe: journey.recipe, binding: journey.binding,
      alphaChoices: journey.preview.recipePreview.alphaChoices });
    expect(preview.status).toBe('ready');
    const prepared = captureHopDecisionQualifiedRecipePreparationEvent({ identity: { ownerKey: 'fixture-owner', dossierId: 'qualified-plan',
      eventId: 'prepare-plan', expectedRevision: 2, recordedAt: '2026-10-01T11:01:00.000Z' },
      study, currentStudy: study, decisionId: 'decision-v2', preparationId: 'preparation-v2',
      recipe: journey.recipe, binding: journey.binding, preview });
    expect(prepared).toMatchObject({ eventFormatVersion: 2, kind: 'programPrepared', payload: {
      optionId: selection.pathId, preview: { format: 'hop-planned-recipe-v1', status: 'ready', recipePreview: { alphaChoices: journey.preview.recipePreview.alphaChoices } },
    } });
  });
});
