import { describe, expect, it } from 'vitest';
import type { HopEngineData } from '../../functions/src/hopPredictionCore';
import type { HopRange, HopVariety, HopSource } from '../../functions/src/hopIndexSchema';
import type { HopExtrapolation } from '../../functions/src/hopExtrapolationSchema';
import type { HopYeast, HopAxis, HopTriplet } from '../../functions/src/hopPredictionSchema';
import type { HopRecipeInput } from '../../functions/src/hopRecipePrediction';
import {
  assertBrewingScenarioRequest,
  assertBrewingScenarioResult,
  buildBrewingScenarioRequest,
  brewingScenarioCurrentReference,
  brewingScenarioInputReference,
  brewingScenarioResultReference,
  hopRecipeScenarioInputReference,
  simulateBrewingScenario,
  type BrewingScenarioRuntime,
  type BrewingScenarioRuntimeCurrent,
} from '../../src/domain/brewingScenario';
import type { HopDecisionMaterial, HopDecisionProgram } from '../../src/domain/hopDecision/types';
import { applyHopProgramProposal, programFingerprint } from '../../src/domain/hopDecision/programs';
import { hopAdviceContentReference } from '../../src/domain/hopDecision/adviceContentReference';
import modelPack from '../../src/data/hopExtrapolationBootstrap.json';
import definitions from '../../src/data/hopKnowledgeBootstrap.json';

const model = modelPack[0] as HopExtrapolation;
const source: HopSource = { ...model.source, kind: 'manufacturer', year: 2026 };
const axes = definitions.filter(row => row.kind === 'axis') as HopAxis[];
const yeast: HopYeast = { id: 'yeast-scenario-fixture', kind: 'yeast', name: 'Levure de fixture', betaLyase: 'unknown', source };
const variety = (id: string, name = `Houblon ${id}`): HopVariety => ({
  id, name, aliases: [], form: 'pelletT90',
  descriptions: [{ text: 'agrumes résine', context: 'rawHop', source }], analysis: [],
});
const triplet = (varietyId = 'known-hop', patch: Partial<HopTriplet> = {}): HopTriplet => ({
  varietyId, lotId: null, yeastId: yeast.id, timing: 'postFermentation', doseGL: 4,
  temperatureC: 18, contactHours: 24, matrixId: null, ...patch,
});
const input = (varietyId = 'known-hop'): HopRecipeInput => ({ volumeL: 24, yeastId: yeast.id,
  additions: [{ id: 'addition-1', name: 'Ajout témoin', triplet: triplet(varietyId) }], fermentation: [] });
const data = (): HopEngineData => ({ varieties: [variety('known-hop')], lots: [], knowledge: [...structuredClone(axes), structuredClone(yeast), structuredClone(model)] });
const material = (id = 'material-known', hop = variety('known-hop'), availableGrams?: number): HopDecisionMaterial => ({
  id, name: hop.name, form: hop.form, variety: hop, ...(availableGrams === undefined ? {} : { availableGrams }),
});
const runtime = (engineData = data(), materials: HopDecisionMaterial[] = [material()]): BrewingScenarioRuntime => ({ engineData, materials });
const hypotheticalRequest = (baselineInput = input(), extras: { materials?: { hops?: HopDecisionMaterial[]; yeasts?: HopYeast[] }; culture?: { state: 'single' | 'mixed' | 'unknown'; members: Array<{ yeastId?: string; name?: string }>; explanation?: string } } = {}) =>
  buildBrewingScenarioRequest({ scenarioId: 'scenario-fixture', revision: 1, baseline: {
    kind: 'hypothetical', label: 'Fixture synthétique', input: baselineInput,
    ...(extras.materials ? { materials: extras.materials } : {}), ...(extras.culture ? { culture: extras.culture } : {}),
  }, target: { citrus: { min: 60, max: 95 } } });

describe('Scénario de brassage pur et versionné', () => {
  it('calcule une combinaison inédite avec le modèle d’extrapolation, sans créer une identité catalogue', () => {
    const d = data();
    const before = structuredClone(d);
    const newVariety = variety('novel-hop-id', 'Identité nouvelle');
    const newMaterial = material('material-new', newVariety);
    const request = hypotheticalRequest(input(), { materials: { hops: [newMaterial] } });
    request.branches.push({ id: 'new-identity', label: 'Explorer la nouvelle identité', input: input(newVariety.id), assumptions: [] });

    const result = simulateBrewingScenario(request, runtime(d));
    const branch = result.branches[0];
    expect(branch.hopPrediction.overall.profile.citrus.range).not.toBeNull();
    expect(branch.hopPrediction.overall.extrapolatedAxes).toContain('citrus');
    expect(branch.applicability).toBe('hypotheticalOnly');
    expect(branch.dependencySnapshot.engineData.varieties.map(row => row.id)).toContain(newVariety.id);
    expect(d).toEqual(before);
    expect(result.comparisons[0].profile.citrus.range).not.toBeNull();
    expect(result.reference).toMatch(/^brewing-scenario-result-v1:sha256:[a-f0-9]{64}$/);
    expect(() => assertBrewingScenarioResult(result)).not.toThrow();
  });

  it('une hypothèse modèle sélectionnée change une vraie sortie; une proposition seule ne calcule rien', () => {
    const request = hypotheticalRequest();
    request.branches.push({ id: 'matrix-change', label: 'Sensibilité du facteur de matrice', assumptions: [{
      id: 'matrix-hypothesis', path: 'model.matrix', label: 'Facteur de matrice', status: 'selected', origin: 'assistantHypothesis',
      explanation: 'Valeur de travail explicite pour cette sensibilité.', range: { min: 0.2, max: 0.2 }, central: 0.2, unit: 'sans unité',
    }], modelOverrides: [{ modelId: model.id, parameter: { kind: 'matrix' }, assumptionId: 'matrix-hypothesis' }] });
    request.branches.push({ id: 'proposal-only', label: 'Hypothèse proposée non sélectionnée', assumptions: [{
      id: 'proposed-matrix', path: 'model.matrix', label: 'Autre facteur', status: 'proposed', origin: 'assistantHypothesis',
      explanation: 'Proposition lisible, non appliquée.', range: { min: 0.2, max: 0.2 }, central: 0.2, unit: 'sans unité',
    }] });

    const result = simulateBrewingScenario(request, runtime());
    const selected = result.branches[0], proposal = result.branches[1];
    expect(selected.hopPrediction.overall.profile.citrus.range).not.toEqual(result.baseline.hopPrediction.overall.profile.citrus.range);
    expect(selected.usedAssumptionIds).toContain('matrix-hypothesis');
    const scenarioModel = selected.dependencySnapshot.scenarioModelInstances[0];
    const executedModel = selected.dependencySnapshot.engineData.knowledge.find(row => row.id === scenarioModel.id)! as HopExtrapolation;
    expect(scenarioModel.matrix.source.kind).toBe('judgment');
    expect(scenarioModel.matrix.source.year).toBeNull();
    expect(scenarioModel.matrix.source.reference).toContain(':matrix-hypothesis');
    expect(executedModel.matrix.source).toEqual(scenarioModel.matrix.source);
    expect(proposal.proposedAssumptionIds).toContain('proposed-matrix');
    expect(proposal.usedAssumptionIds).not.toContain('proposed-matrix');
    expect(proposal.hopPrediction.overall.profile.citrus.range).toEqual(result.baseline.hopPrediction.overall.profile.citrus.range);
    expect(result.comparisons[0].profile.citrus.range).not.toBeNull();
  });

  it('ne déclare utilisés que les feuilles de modèle consultées par les souches et emplois évalués', () => {
    const d = data();
    const alternativeYeast: HopYeast = { id: 'strain-alternative', kind: 'yeast', name: 'Souche alternative', betaLyase: 'unknown', source };
    d.knowledge.push(alternativeYeast);
    const request = hypotheticalRequest();
    const culture = { state: 'mixed' as const, members: [{ yeastId: yeast.id }, { yeastId: alternativeYeast.id }] };
    const strainParameter = model.defaultYeast.aroma;
    const strainAssumption = (id: string) => ({ id, path: `model.yeasts.${alternativeYeast.id}.aroma.citrus`, label: 'Profil aromatique de souche',
      status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Plage de travail égale au prior du modèle, sans changement numérique demandé.',
      range: structuredClone(strainParameter.range), central: strainParameter.central, unit: 'axisScale' });
    const strainOverride = (assumptionId: string) => ({ modelId: model.id,
      parameter: { kind: 'yeastProfile' as const, yeastId: alternativeYeast.id, axisId: 'citrus', parameter: 'aroma' as const }, assumptionId });
    const timingParameter = model.timings.boil.expression;
    const timingAssumption = { id: 'unused-boil-timing', path: 'model.timings.boil.expression', label: 'Expression à ébullition',
      status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Paramètre de phase sélectionné.',
      range: structuredClone(timingParameter.range), central: timingParameter.central, unit: 'sans unité' };
    const timingOverride = { modelId: model.id, parameter: { kind: 'timing' as const, timing: 'boil' as const, parameter: 'expression' as const }, assumptionId: timingAssumption.id };
    const boilInput = structuredClone(input());
    boilInput.additions[0].triplet = { ...boilInput.additions[0].triplet, timing: 'boil', temperatureC: 100, contactHours: 1 };

    request.branches.push({ id: 'unused-strain', label: 'Profil d’une autre souche non projetée', assumptions: [strainAssumption('unused-strain-profile')],
      modelOverrides: [strainOverride('unused-strain-profile')] });
    request.branches.push({ id: 'culture-without-override', label: 'Culture projetée sans override', assumptions: [], culture });
    request.branches.push({ id: 'culture-strain-used', label: 'Culture avec projection de l’autre souche', culture,
      assumptions: [strainAssumption('used-strain-profile')], modelOverrides: [strainOverride('used-strain-profile')] });
    request.branches.push({ id: 'unused-timing', label: 'Timing absent de la recette', assumptions: [timingAssumption], modelOverrides: [timingOverride] });
    request.branches.push({ id: 'boil-without-override', label: 'Ajout à ébullition sans override', input: boilInput, assumptions: [] });
    request.branches.push({ id: 'timing-used', label: 'Timing présent dans la recette', input: boilInput,
      assumptions: [{ ...timingAssumption, id: 'used-boil-timing' }], modelOverrides: [{ ...timingOverride, assumptionId: 'used-boil-timing' }] });

    const result = simulateBrewingScenario(request, runtime(d));
    const branches = new Map(result.branches.map(branch => [branch.id, branch]));
    expect(branches.get('unused-strain')!.usedAssumptionIds).not.toContain('unused-strain-profile');
    expect(branches.get('unused-strain')!.unappliedAssumptionIds).toContain('unused-strain-profile');
    expect(branches.get('unused-timing')!.usedAssumptionIds).not.toContain('unused-boil-timing');
    expect(branches.get('unused-timing')!.unappliedAssumptionIds).toContain('unused-boil-timing');
    expect(branches.get('culture-strain-used')!.cultureProjections.map(row => row.memberId)).toContain(alternativeYeast.id);
    expect(branches.get('culture-strain-used')!.usedAssumptionIds).toContain('used-strain-profile');
    expect(branches.get('culture-strain-used')!.cultureProjections[1].hopPrediction.overall.profile.citrus.range)
      .toEqual(branches.get('culture-without-override')!.cultureProjections[1].hopPrediction.overall.profile.citrus.range);
    expect(branches.get('timing-used')!.usedAssumptionIds).toContain('used-boil-timing');
    expect(branches.get('timing-used')!.hopPrediction.overall.profile.citrus.range)
      .toEqual(branches.get('boil-without-override')!.hopPrediction.overall.profile.citrus.range);
  });

  it('suit la branche cinétique réellement choisie et ignore les taux sans contact', () => {
    expect(model.timings.boil.decayHours).not.toBeNull();
    const request = hypotheticalRequest();
    const boil = structuredClone(input());
    boil.additions[0].triplet = { ...boil.additions[0].triplet, timing: 'boil', temperatureC: 100, contactHours: 1 };
    const boilUnknownContact = structuredClone(boil);
    boilUnknownContact.additions[0].triplet.contactHours = null;
    const assumptionFor = (id: string, parameter: 'decayHours' | 'extractionHours') => {
      const selected = model.timings.boil[parameter]!;
      return { id, path: `model.timings.boil.${parameter}`, label: parameter, status: 'selected' as const,
        origin: 'userHypothesis' as const, explanation: 'Même plage et central que le paramètre courant, pour mesurer sa consultation.',
        range: structuredClone(selected.range), central: selected.central, unit: 'h' };
    };
    const overrideFor = (id: string, parameter: 'decayHours' | 'extractionHours') => ({ modelId: model.id,
      parameter: { kind: 'timing' as const, timing: 'boil' as const, parameter }, assumptionId: id });
    request.branches.push({ id: 'extraction-shadowed', label: 'Extraction masquée par une décroissance définie', input: boil, assumptions: [assumptionFor('extraction-shadowed-choice', 'extractionHours')],
      modelOverrides: [overrideFor('extraction-shadowed-choice', 'extractionHours')] });
    request.branches.push({ id: 'decay-contact-known', label: 'Décroissance lue au contact connu', input: boil, assumptions: [assumptionFor('decay-known-choice', 'decayHours')],
      modelOverrides: [overrideFor('decay-known-choice', 'decayHours')] });
    request.branches.push({ id: 'decay-contact-unknown', label: 'Aucune constante lue si le contact est inconnu', input: boilUnknownContact,
      assumptions: [assumptionFor('decay-unknown-choice', 'decayHours')], modelOverrides: [overrideFor('decay-unknown-choice', 'decayHours')] });
    request.branches.push({ id: 'decay-contact-control', label: 'Contrôle du contact inconnu', input: boilUnknownContact, assumptions: [] });

    const result = simulateBrewingScenario(request, runtime());
    const branches = new Map(result.branches.map(branch => [branch.id, branch]));
    expect(branches.get('extraction-shadowed')!.usedAssumptionIds).not.toContain('extraction-shadowed-choice');
    expect(branches.get('extraction-shadowed')!.unappliedAssumptionIds).toContain('extraction-shadowed-choice');
    expect(branches.get('decay-contact-known')!.usedAssumptionIds).toContain('decay-known-choice');
    expect(branches.get('decay-contact-unknown')!.usedAssumptionIds).not.toContain('decay-unknown-choice');
    expect(branches.get('decay-contact-unknown')!.unappliedAssumptionIds).toContain('decay-unknown-choice');
    expect(branches.get('decay-contact-known')!.hopPrediction.overall.profile.citrus.range)
      .toEqual(branches.get('extraction-shadowed')!.hopPrediction.overall.profile.citrus.range);
    expect(branches.get('decay-contact-unknown')!.hopPrediction.overall.profile.citrus.range)
      .toEqual(branches.get('decay-contact-control')!.hopPrediction.overall.profile.citrus.range);
  });

  it('refuse une hypothèse scalaire qui ne correspond pas à la dose réellement simulée ou à son unité', () => {
    const requestWithDoseAssumption = (assumption: { value?: number; range?: HopRange; central?: number; unit?: string }) => {
      const request = hypotheticalRequest();
      request.branches.push({ id: 'dose-override', label: 'Dose explicitement choisie', assumptions: [{
        id: 'dose-choice', path: 'additions.addition-1.doseGL', label: 'Dose choisie', status: 'selected', origin: 'userHypothesis',
        explanation: 'Valeur liée au paramètre réellement transmis.', ...assumption,
      }], inputOverrides: { additions: [{ additionId: 'addition-1', triplet: { doseGL: 5 } }] } });
      return request;
    };

    expect(() => assertBrewingScenarioRequest(requestWithDoseAssumption({ value: 3, unit: 'g/L' }))).toThrow(/ne couvre pas/);
    expect(() => assertBrewingScenarioRequest(requestWithDoseAssumption({ value: 5, unit: 'mL/L' }))).toThrow(/unité/);
    const valid = requestWithDoseAssumption({ range: { min: 4, max: 6 }, central: 5, unit: 'g/L' });
    expect(() => assertBrewingScenarioRequest(valid)).not.toThrow();
    const result = simulateBrewingScenario(valid, runtime());
    expect(result.branches[0].input.additions[0].triplet.doseGL).toBe(5);
  });

  it('garde une analogie descriptive locale et distingue sa provenance de celle de la variété de référence', () => {
    const d = data();
    const reference = variety('reference-hop', 'Référence descriptive');
    reference.descriptions = [{ text: 'fruits tropicaux ananas', context: 'rawHop', source }];
    d.varieties.push(reference);
    const before = structuredClone(d);
    const request = hypotheticalRequest();
    request.branches.push({ id: 'descriptive-analogy', label: 'Explorer une analogie descriptive', assumptions: [{
      id: 'description-link', path: 'analogy.hop', label: 'Référence descriptive', status: 'selected', origin: 'analogy',
      explanation: 'Le brasseur demande une analogie lexicale, sans transférer d’analyse.', value: 'reference-hop',
    }], analogies: [{ kind: 'hopDescriptions', targetVarietyId: 'known-hop', referenceVarietyId: reference.id,
      assumptionId: 'description-link', explanation: 'Comparer les descripteurs comme piste, pas comme COA.' }] });

    const result = simulateBrewingScenario(request, runtime(d));
    const localTarget = result.branches[0].dependencySnapshot.engineData.varieties.find(row => row.id === 'known-hop')!;
    const copied = localTarget.descriptions.find(row => row.text === 'fruits tropicaux ananas')!;
    const snapReference = result.branches[0].dependencySnapshot.engineData.varieties.find(row => row.id === reference.id)!;
    expect(copied.source.kind).toBe('judgment');
    expect(copied.source.year).toBeNull();
    expect(snapReference.descriptions[0].source).toEqual(source);
    expect(d).toEqual(before);
    expect(result.branches[0].usedAssumptionIds).toContain('description-link');
    expect(result.branches[0].dependencySnapshot.engineData.varieties.map(row => row.id)).toContain(reference.id);
  });

  it('calcule seulement les contributions biologiques dont les conversions sont explicitement renseignées', () => {
    const assumptions = [
      { id: 'extract', path: 'bio.extraction', label: 'Extraction', status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Hypothèse de travail.', range: { min: 0.5, max: 0.6 }, unit: 'fraction' },
      { id: 'retain', path: 'bio.retention', label: 'Rétention', status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Hypothèse de travail.', range: { min: 0.25, max: 0.5 }, unit: 'fraction' },
      { id: 'convert', path: 'bio.conversion', label: 'Conversion', status: 'selected' as const, origin: 'userHypothesis' as const, explanation: 'Hypothèse de travail.', range: { min: 0.1, max: 0.2 }, unit: 'fraction' },
    ];
    const request = hypotheticalRequest();
    request.branches.push({ id: 'bio-sidecar', label: 'Contributions séparées', assumptions, biologicalInputs: [
      { id: 'transfer-known', kind: 'compoundTransferLoss', sourceAmount: { analyte: 'compound-a', unit: 'mg', basis: 'hop-product', range: { min: 10, max: 20 }, origin: 'observed', sourceRefs: [source] },
        extractionFraction: { id: 'extraction', assumptionId: 'extract', range: { min: 0.5, max: 0.6 }, unit: 'fraction', origin: 'userHypothesis', explanation: 'Hypothèse sélectionnée.', sourceRefs: [] },
        retentionFraction: { id: 'retention', assumptionId: 'retain', range: { min: 0.25, max: 0.5 }, unit: 'fraction', origin: 'userHypothesis', explanation: 'Hypothèse sélectionnée.', sourceRefs: [] },
        targetMatrixId: 'beer-fixture', targetTimepoint: 'packaged', conditions: [], limitations: [] },
      { id: 'conversion-unknown', kind: 'hopPrecursorTransformation', precursor: { analyte: 'precursor-a', unit: 'mg', basis: 'hop-product', range: { min: 5, max: 10 }, origin: 'observed', sourceRefs: [source] },
        productAnalyte: 'compound-b', productUnit: 'mg', productBasis: 'beer',
        conversionFraction: { id: 'conversion', assumptionId: 'convert', range: { min: 0.1, max: 0.2 }, unit: 'fraction', origin: 'userHypothesis', explanation: 'Hypothèse sélectionnée.', sourceRefs: [] },
        productMatrixId: 'beer-fixture', productTimepoint: 'packaged', conditions: [], limitations: [] },
    ] });

    const result = simulateBrewingScenario(request, runtime());
    const contributions = result.branches[0].biologicalContributions;
    expect(contributions[0].status).toBe('estimated');
    expect(contributions[0].value?.range).toEqual({ min: 1.25, max: 6 });
    expect(contributions[1].status).toBe('unknown');
    expect(contributions[1].value).toBeNull();
    expect(result.branches[0].hopPrediction.overall.profile.citrus.range).not.toBeNull();
  });

  it('ne transmet pas les scalaires bruts dans un transfert et lie les facteurs bio à leurs hypothèses', () => {
    const requestWithTransfer = (options: {
      sourceAmount?: { value?: number; central?: number };
      fraction: HopRange;
      assumption: { value?: number; range?: HopRange; central?: number; unit?: string };
    }) => {
      const request = hypotheticalRequest();
      request.branches.push({ id: 'transfer', label: 'Transfert documenté par fractions', assumptions: [{
        id: 'extract', path: 'bio.extraction', label: 'Fraction d’extraction', status: 'selected', origin: 'userHypothesis',
        explanation: 'Fraction liée au calcul reçu.', ...options.assumption,
      }], biologicalInputs: [{
        id: 'transfer-result', kind: 'compoundTransferLoss',
        sourceAmount: { analyte: 'compound-source', unit: 'mg', basis: 'hop-product', range: { min: 100, max: 100 },
          origin: 'observed', sourceRefs: [source], ...options.sourceAmount },
        extractionFraction: { id: 'extraction', assumptionId: 'extract', range: options.fraction, unit: 'fraction',
          origin: 'userHypothesis', explanation: 'Fraction sélectionnée.', sourceRefs: [] },
        retentionFraction: { id: 'retention', range: { min: 1, max: 1 }, unit: 'fraction', origin: 'observation',
          explanation: 'Rétention unitaire de fixture.', sourceRefs: [source] },
        targetMatrixId: 'beer-fixture', targetTimepoint: 'packaged', conditions: [], limitations: [],
      }] });
      return request;
    };

    const reported = simulateBrewingScenario(requestWithTransfer({ sourceAmount: { value: 100 }, fraction: { min: 0.2, max: 0.4 },
      assumption: { range: { min: 0.2, max: 0.4 } } }), runtime());
    const reportedValue = reported.branches[0].biologicalContributions[0].value!;
    expect(reportedValue.range).toEqual({ min: 20, max: 40 });
    expect(reportedValue.value).toBeUndefined();
    expect(reportedValue.central).toBeUndefined();

    const centralOnly = simulateBrewingScenario(requestWithTransfer({ sourceAmount: { central: 100 }, fraction: { min: 0.2, max: 0.4 },
      assumption: { range: { min: 0.2, max: 0.4 } } }), runtime());
    expect(centralOnly.branches[0].biologicalContributions[0].value?.central).toBeUndefined();

    const pointRequest = requestWithTransfer({ sourceAmount: { value: 100 }, fraction: { min: 0.2, max: 0.2 },
      assumption: { value: 0.2 } });
    const point = simulateBrewingScenario(pointRequest, runtime());
    expect(point.branches[0].biologicalContributions[0].value?.value).toBe(20);
    expect(point.branches[0].usedAssumptionIds).toContain('extract');

    for (const mismatch of [
      requestWithTransfer({ fraction: { min: 0.8, max: 0.8 }, assumption: { value: 0.2 } }),
      requestWithTransfer({ fraction: { min: 0.8, max: 0.8 }, assumption: { range: { min: 0.2, max: 0.4 } } }),
      requestWithTransfer({ fraction: { min: 0.2, max: 0.2 }, assumption: { value: 0.2, unit: 'mL/L' } }),
    ]) expect(() => simulateBrewingScenario(mismatch, runtime())).toThrow(/hypothèse biologique|hypothèse sélectionnée|plage biologique|point calculé/i);

    // Recreate a structurally valid old snapshot whose request and output came
    // from the former unchecked .8/.2 pair. Historical reads keep those bytes;
    // only new requests receive the current binding check.
    const archived = structuredClone(point);
    const oldBioInput = archived.requestSnapshot.branches[0].biologicalInputs![0];
    if (oldBioInput.kind !== 'compoundTransferLoss') throw Error('Fixture de transfert attendue.');
    oldBioInput.extractionFraction.range = { min: 0.8, max: 0.8 };
    const archivedBranch = archived.branches[0];
    const contribution = archivedBranch.biologicalContributions[0];
    if (contribution.value) contribution.value = { ...contribution.value, range: { min: 80, max: 80 }, value: 80, central: 80 };
    const { reference: _oldBranchReference, ...branchBody } = archivedBranch;
    archivedBranch.reference = hopAdviceContentReference('brewing-scenario-branch-v1', branchBody);
    archived.inputReference = brewingScenarioInputReference(archived.requestSnapshot);
    archived.reference = brewingScenarioResultReference(archived);
    const preservedBytes = structuredClone(archived);
    expect(() => assertBrewingScenarioResult(archived)).not.toThrow();
    expect(archived).toEqual(preservedBytes);
  });

  it('garde les projections de culture mixte séparées par membre, sans moyenne', () => {
    const request = hypotheticalRequest(input(), { culture: { state: 'mixed', members: [{ yeastId: yeast.id }, { yeastId: 'unloaded-yeast', name: 'Souche non chargée' }] } });
    const result = simulateBrewingScenario(request, runtime());
    expect(result.baseline.cultureProjections).toHaveLength(2);
    expect(result.baseline.cultureProjections.map(row => row.memberId)).toEqual([yeast.id, 'unloaded-yeast']);
    expect(result.baseline.cultureProjections.every(row => row.scope === 'singleMemberProjection')).toBe(true);
    expect(result.baseline.limitations.join(' ')).toContain('aucune moyenne');
    expect(result.baseline.cultureProjections[1].hopPrediction.overall.profile.citrus.range).toBeNull();
  });

  it('applique les gardes J1 aux ajouts futurs et rejette un reçu obsolète du journal/culture', () => {
    const d = data();
    const hop = d.varieties[0];
    const usedMaterial = material('material-known', hop, 150);
    const recipeInput: HopRecipeInput = { volumeL: 24, yeastId: yeast.id,
      additions: [{ id: 'performed-boil', name: hop.name, triplet: triplet(hop.id, { timing: 'boil', doseGL: 4, temperatureC: 100, contactHours: 1 }) }],
      fermentation: [] };
    const program: HopDecisionProgram = { id: 'program-1', revision: 3, stage: 'hotSide', volumeL: 24, wortGravity: 1.05,
      additions: [{ id: 'performed-boil', materialId: usedMaterial.id, grams: 96, use: 'boil', status: 'performed', boilMinutes: 60, temperatureC: 100 }] };
    const current: BrewingScenarioRuntimeCurrent = { recipeReference: 'recipe-r3', inputReference: hopRecipeScenarioInputReference(recipeInput),
      input: recipeInput, program, performedAdditionIds: ['performed-boil'], culture: { state: 'single', members: [{ yeastId: yeast.id }] } };
    const r = runtime(d, [usedMaterial]); r.current = current;
    const request = buildBrewingScenarioRequest({ scenarioId: 'recipe-scenario', revision: 5, baseline: {
      kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
      contextReference: brewingScenarioCurrentReference(current),
    } });
    request.branches.push({ id: 'future-dry-hop', label: 'Ajouter un houblonnage futur', assumptions: [{
      id: 'future-addition', path: 'program.changes', label: 'Ajout futur', status: 'selected', origin: 'userHypothesis',
      explanation: 'Scénario J1 à prévisualiser.', value: 'append',
    }], programChanges: [{ kind: 'append', addition: { id: 'future-hop', materialId: usedMaterial.id, grams: 24,
      use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 18 } }] });

    const beforeData = structuredClone(d), beforeCurrent = structuredClone(current), beforeRequest = structuredClone(request);
    const result = simulateBrewingScenario(request, r);
    expect(result.branches[0].programProposal?.program.additions.find(row => row.id === 'future-hop')).toBeDefined();
    expect(result.branches[0].program?.additions.find(row => row.id === 'performed-boil')).toEqual(program.additions[0]);
    expect(result.branches[0].performedAdditionIds).toEqual(['performed-boil']);
    expect(result.branches[0].programAnalysis).toBeDefined();
    expect(d).toEqual(beforeData);
    expect(current).toEqual(beforeCurrent);
    expect(request).toEqual(beforeRequest);
    expect(() => assertBrewingScenarioResult(structuredClone(result))).not.toThrow();

    const changed = structuredClone(r);
    changed.current!.culture = { state: 'unknown', members: [] };
    expect(() => simulateBrewingScenario(request, changed)).toThrow(/culture/);
  });

  it('sépare un retrait applicable d’une projection qui change la souche historique ou le volume de base', () => {
    const d = data();
    const originalYeast: HopYeast = { id: 'strain-original', kind: 'yeast', name: 'Souche réelle', betaLyase: 'unknown', source };
    const alternativeYeast: HopYeast = { id: 'strain-alternative', kind: 'yeast', name: 'Souche hypothétique', betaLyase: 'unknown', source };
    d.knowledge = [...structuredClone(axes), originalYeast, alternativeYeast];
    const usedMaterial = material('astra-material', d.varieties[0], 100);
    const recipeInput: HopRecipeInput = { volumeL: 20, yeastId: originalYeast.id,
      additions: [
        { id: 'already-done', name: 'already-done', triplet: triplet('known-hop', { yeastId: originalYeast.id, doseGL: 0.25, temperatureC: 20, contactHours: 24, matrixId: 'fixture-matrix' }) },
        { id: 'future', name: 'future', triplet: triplet('known-hop', { yeastId: originalYeast.id, doseGL: 0.5, temperatureC: 20, contactHours: 24, matrixId: 'fixture-matrix' }) },
      ], fermentation: [] };
    const program: HopDecisionProgram = { id: 'astra-program', revision: 3, stage: 'conditioning', volumeL: 20, wortGravity: null,
      additions: [
        { id: 'already-done', materialId: usedMaterial.id, grams: 5, use: 'postFermentation', status: 'performed', contactHours: 24, temperatureC: 20 },
        { id: 'future', materialId: usedMaterial.id, grams: 10, use: 'postFermentation', status: 'planned', contactHours: 24, temperatureC: 20 },
      ] };
    const current: BrewingScenarioRuntimeCurrent = { recipeReference: 'fixture-recipe', inputReference: hopRecipeScenarioInputReference(recipeInput),
      input: recipeInput, program, performedAdditionIds: ['already-done'] };
    const rt = runtime(d, [usedMaterial]); rt.current = current;
    const createRequest = () => buildBrewingScenarioRequest({ scenarioId: 'applicability-guard', revision: 1, baseline: {
      kind: 'recipe', recipeReference: current.recipeReference, input: current.input, program: current.program,
      contextReference: brewingScenarioCurrentReference(current),
    } });
    const remove = { kind: 'remove' as const, additionId: 'future' };
    const removalAssumption = { id: 'remove-future', path: 'program.changes', label: 'Retrait futur', status: 'selected' as const,
      origin: 'userHypothesis' as const, value: 'remove', explanation: 'Retirer le seul ajout encore planifié.' };

    const yeastRequest = createRequest();
    yeastRequest.branches.push({ id: 'remove-and-change-yeast', label: 'Retrait et autre souche',
      assumptions: [removalAssumption, { id: 'yeast-change', path: 'recipe.yeastId', label: 'Souche hypothétique', status: 'selected',
        origin: 'userHypothesis', value: alternativeYeast.id, explanation: 'Cette souche n’a pas fermenté les ajouts déjà effectués.' }],
      programChanges: [remove], inputOverrides: { yeastId: alternativeYeast.id } });
    const yeastResult = simulateBrewingScenario(yeastRequest, rt);
    const yeastBranch = yeastResult.branches[0];
    expect(yeastBranch.applicability).toBe('hypotheticalOnly');
    expect(yeastBranch.programProposal?.baseline).toBe(programFingerprint(current.program!));
    expect(yeastBranch.programProposal?.changes).toEqual([remove]);
    expect(yeastBranch.programProposal?.applicability).toBe('available');
    expect(yeastBranch.input.yeastId).toBe(alternativeYeast.id);
    expect(yeastBranch.program?.additions).toEqual([program.additions[0]]);
    expect(yeastBranch.performedAdditionIds).toEqual(['already-done']);
    expect(yeastBranch.limitations.join(' ')).toContain('ne requalifie pas leur fermentation passée');
    const removalOnly = applyHopProgramProposal(current.program!, yeastBranch.programProposal!, rt.materials);
    expect(removalOnly.after.additions).toEqual([program.additions[0]]);
    expect(current.program).toEqual(program);

    const volumeRequest = createRequest();
    volumeRequest.branches.push({ id: 'remove-and-change-volume', label: 'Retrait et volume hypothétique',
      assumptions: [removalAssumption, { id: 'volume-change', path: 'program.volumeL', label: 'Volume de scénario', status: 'selected',
        origin: 'userHypothesis', value: 30, unit: 'L', explanation: 'Volume hypothétique différent du programme courant.' }],
      programChanges: [remove], programOverrides: { volumeL: 30 } });
    const volumeResult = simulateBrewingScenario(volumeRequest, rt);
    const volumeBranch = volumeResult.branches[0];
    expect(volumeBranch.applicability).toBe('hypotheticalOnly');
    expect(volumeBranch.programProposal?.baseline).not.toBe(programFingerprint(current.program!));
    expect(volumeBranch.program?.volumeL).toBe(30);
    expect(volumeBranch.program?.additions).toEqual([program.additions[0]]);
    expect(() => applyHopProgramProposal(current.program!, volumeBranch.programProposal!, rt.materials)).toThrow(/programme a changé/);
    expect(current.program).toEqual(program);
    expect(() => assertBrewingScenarioResult(yeastResult)).not.toThrow();
    expect(() => assertBrewingScenarioResult(volumeResult)).not.toThrow();
  });
});
