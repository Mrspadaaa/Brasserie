import { describe, expect, it } from 'vitest';
import {
  assertBrewingScenarioRequest,
  buildBrewingScenarioRequest,
  simulateBrewingScenario,
  type BrewingScenarioBiologicalInput,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioRuntime,
} from '../../src/domain/brewingScenario';
import {
  appendBrewingScenarioBiologicalInput,
  type ScenarioBiologicalAmountDraft,
  type ScenarioBiologicalFactorDraft,
  type ScenarioBiologicalInputDraft,
  type ScenarioBiologicalIdFactory,
} from '../../src/services/hopV55/scenarioBiologicalInputs';
import { testHopData, testHopTriplet, testHopYeast } from '../fixtures/hopPrediction';

const personal = {
  kind: 'personalDeclaration' as const,
  title: 'Déclaration personnelle de travail',
  author: 'Brasseur de fixture',
};
const bibliographic = {
  kind: 'bibliography' as const,
  sourceKind: 'research' as const,
  title: 'Étude fictive indiquée par le brasseur',
  author: 'Auteur déclaré',
  year: 2024,
  reference: 'https://example.invalid/paper',
  locator: 'tableau 2',
};
const conditions = ['À la température et au pH explicitement déclarés.'];
const limitations = ['Transfert de travail, non mesuré sur le brassin.'];

const amount = (overrides: Partial<ScenarioBiologicalAmountDraft> = {}): ScenarioBiologicalAmountDraft => ({
  analyte: 'composé libre X',
  unit: 'mg/L',
  basis: 'produit de houblon',
  range: { min: 10, max: 20 },
  explanation: 'Quantité de travail issue de la déclaration saisie.',
  source: personal,
  ...overrides,
});

const fraction = (overrides: Partial<ScenarioBiologicalFactorDraft> = {}): ScenarioBiologicalFactorDraft => ({
  range: { min: 0.2, max: 0.4 },
  unit: 'fraction',
  explanation: 'Fraction de travail déclarée explicitement.',
  source: personal,
  ...overrides,
});

const drafts = {
  yeastOwnProducts: (): ScenarioBiologicalInputDraft => ({
    kind: 'yeastOwnProducts',
    amount: amount({ analyte: 'ester produit par la levure', unit: 'mg/L', basis: 'bière conditionnée' }),
    conditions,
    limitations,
  }),
  hopPrecursorTransformation: (includeRatio = true): ScenarioBiologicalInputDraft => ({
    kind: 'hopPrecursorTransformation',
    precursor: amount({ analyte: 'précurseur lié', unit: 'mg/kg', basis: 'produit de houblon', range: { min: 5, max: 10 } }),
    product: { analyte: 'composé libre', unit: 'mg/L', basis: 'bière', matrixId: undefined, timepoint: undefined },
    conversionFraction: fraction({ range: { min: 0.1, max: 0.2 } }),
    ...(includeRatio ? { conversionRatio: {
      ...fraction({ range: { min: 1.5, max: 2 } }),
      unit: 'mg/L par mg/kg',
      fromAnalyte: 'précurseur lié',
      toAnalyte: 'composé libre',
      fromUnit: 'mg/kg',
      toUnit: 'mg/L',
      source: bibliographic,
    } } : {}),
    conditions,
    limitations,
  }),
  compoundTransferLoss: (): ScenarioBiologicalInputDraft => ({
    kind: 'compoundTransferLoss',
    sourceAmount: amount({ range: { min: 20, max: 40 } }),
    extractionFraction: fraction({ range: { min: 0.25, max: 0.5 } }),
    retentionFraction: fraction({ range: { min: 0.5, max: 0.75 } }),
    targetMatrixId: 'biere-conditionnee',
    targetTimepoint: 'après conditionnement',
    conditions,
    limitations,
  }),
};

function nextIds(): ScenarioBiologicalIdFactory {
  let index = 0;
  return purpose => `${purpose}-${++index}`;
}

function requestWithBranch(branch: BrewingScenarioBranchRequest) {
  const request = buildBrewingScenarioRequest({
    scenarioId: 'scenario-biological-inputs',
    revision: 1,
    baseline: {
      kind: 'hypothetical',
      label: 'Base synthétique',
      input: {
        volumeL: 24,
        yeastId: testHopYeast.id,
        additions: [{ id: 'addition-biologique', name: 'Ajout fictif', triplet: structuredClone(testHopTriplet) }],
        fermentation: [{ kind: 'primaire', tempC: 20, days: 7 }],
      },
    },
  });
  request.branches.push(branch);
  return request;
}

const runtime: BrewingScenarioRuntime = { engineData: testHopData(), materials: [] };

describe('déclarations biologiques dans une branche J5', () => {
  it('déclare les trois types avec les hypothèses liées, sans central, matrice ou temps inventés', () => {
    const createId = nextIds();
    let branch: BrewingScenarioBranchRequest | undefined;
    branch = appendBrewingScenarioBiologicalInput(branch, drafts.yeastOwnProducts(), { createId });
    branch = appendBrewingScenarioBiologicalInput(branch, drafts.hopPrecursorTransformation(), { createId });
    branch = appendBrewingScenarioBiologicalInput(branch, drafts.compoundTransferLoss(), { createId });

    expect(branch.biologicalInputs?.map(row => row.kind)).toEqual([
      'yeastOwnProducts', 'hopPrecursorTransformation', 'compoundTransferLoss',
    ]);
    expect(branch.biologicalInputs?.[0]).toMatchObject({
      kind: 'yeastOwnProducts',
      amount: {
        origin: 'userHypothesis',
        analyte: 'ester produit par la levure',
        unit: 'mg/L',
        basis: 'bière conditionnée',
        range: { min: 10, max: 20 },
      },
    });
    if (branch.biologicalInputs?.[0]?.kind === 'yeastOwnProducts') {
      for (const key of ['matrixId', 'timepoint', 'value', 'central']) expect(branch.biologicalInputs[0].amount).not.toHaveProperty(key);
    }
    expect(branch.biologicalInputs?.[0]?.kind === 'yeastOwnProducts'
      ? branch.biologicalInputs[0].amount.sourceRefs[0]
      : null).toMatchObject({ kind: 'judgment', year: null, reference: expect.stringContaining('local:scenario-hypothesis:') });

    const request = requestWithBranch(branch);
    expect(() => assertBrewingScenarioRequest(request)).not.toThrow();
    const result = simulateBrewingScenario(request, structuredClone(runtime));
    const contributions = result.branches[0].biologicalContributions;
    expect(contributions.map(row => row.status)).toEqual(['estimated', 'estimated', 'estimated']);
    expect(contributions[0].value).toMatchObject({ range: { min: 10, max: 20 } });
    expect(contributions[1].value).toMatchObject({ analyte: 'composé libre', unit: 'mg/L', range: { min: 0.75, max: 4 } });
    expect(contributions[2].value).toMatchObject({ range: { min: 2.5, max: 15 } });
    for (const row of contributions) {
      expect(row.value).not.toHaveProperty('central');
      expect(row.value).not.toHaveProperty('value');
    }
    expect(contributions[1].value?.matrixId).toBeUndefined();
    expect(contributions[1].value?.timepoint).toBeUndefined();
    const transform = branch.biologicalInputs?.[1];
    expect(transform?.kind === 'hopPrecursorTransformation' ? transform.conversionFraction : null).toMatchObject({
      fromAnalyte: 'précurseur lié', toAnalyte: 'composé libre', fromUnit: 'mg/kg', toUnit: 'mg/L',
    });
    expect(transform?.kind === 'hopPrecursorTransformation' ? transform.conversionRatio?.sourceRefs[0] : null).toMatchObject({
      title: bibliographic.title, author: bibliographic.author, year: bibliographic.year,
      kind: bibliographic.sourceKind, reference: bibliographic.reference, locator: bibliographic.locator,
    });
    const transfer = branch.biologicalInputs?.[2];
    expect(transfer?.kind === 'compoundTransferLoss' ? transfer.extractionFraction : null).toMatchObject({
      fromAnalyte: 'composé libre X', toAnalyte: 'composé libre X', fromUnit: 'mg/L', toUnit: 'mg/L',
    });
    expect(transfer?.kind === 'compoundTransferLoss' ? transfer.retentionFraction : null).toMatchObject({
      fromAnalyte: 'composé libre X', toAnalyte: 'composé libre X', fromUnit: 'mg/L', toUnit: 'mg/L',
    });
    expect(result.branches[0].usedAssumptionIds).toHaveLength(7);
  });

  it('keeps an undeclared conversion ratio unknown instead of substituting zero or one', () => {
    const branch = appendBrewingScenarioBiologicalInput(undefined, drafts.hopPrecursorTransformation(false), { createId: nextIds() });
    const request = requestWithBranch(branch);
    expect(() => assertBrewingScenarioRequest(request)).not.toThrow();
    const contribution = simulateBrewingScenario(request, structuredClone(runtime)).branches[0].biologicalContributions[0];
    expect(contribution.status).toBe('unknown');
    expect(contribution.value).toBeNull();
    expect(contribution.limitations.join(' ')).toMatch(/conversion d’unité\/rapport molaire explicite/i);
  });

  it('clones the old branch, appends the new entry and leaves its unrelated edits and prior entries intact', () => {
    const previousInput = {
      id: 'bio-previous', kind: 'yeastOwnProducts',
      amount: { analyte: 'ancien composé', unit: 'mg/L', basis: 'bière', range: { min: 1, max: 2 }, origin: 'userHypothesis', assumptionId: 'old-assumption', sourceRefs: [] },
      conditions: ['Condition précédente.'], limitations: ['Limite précédente.'],
    } as unknown as BrewingScenarioBiologicalInput;
    const original: BrewingScenarioBranchRequest = {
      id: 'branch-existing', label: 'Branche existante', assumptions: [{
        id: 'old-assumption', path: 'biologicalInputs.bio-previous.amount', label: 'Ancienne quantité',
        status: 'selected', origin: 'userHypothesis', explanation: 'Conservée.',
        range: { min: 1, max: 2 }, unit: 'mg/L', basis: 'bière',
      }],
      inputOverrides: { pitchTempC: 19 },
      programOverrides: { volumeL: 22 },
      programChanges: [],
      materials: { hops: [] },
      biologicalInputs: [previousInput],
      beerContext: { facts: [{ id: 'fact-existing', field: 'ibuTarget', status: 'target', origin: 'userHypothesis', value: 20, unit: 'IBU' }] },
    };
    const before = structuredClone(original);
    const revised = appendBrewingScenarioBiologicalInput(original, drafts.yeastOwnProducts(), { createId: nextIds() });

    expect(original).toEqual(before);
    expect(revised).not.toBe(original);
    expect(revised).toMatchObject({
      id: original.id,
      label: original.label,
      inputOverrides: original.inputOverrides,
      programOverrides: original.programOverrides,
      programChanges: original.programChanges,
      materials: original.materials,
      beerContext: original.beerContext,
    });
    expect(revised.biologicalInputs?.[0]).toEqual(previousInput);
    expect(revised.biologicalInputs).toHaveLength(2);
    expect(revised.assumptions).toHaveLength(2);
  });

  it('refuses missing ranges, mismatched conversion dimensions, fractions outside 0–1 and empty conditions/limitations', () => {
    const valid = drafts.hopPrecursorTransformation() as Extract<ScenarioBiologicalInputDraft, { kind: 'hopPrecursorTransformation' }>;
    const badRange = { ...valid, precursor: { ...valid.precursor, range: { min: 12, max: 10 } } };
    const badUnit = { ...valid, conversionRatio: { ...valid.conversionRatio!, fromUnit: 'g/kg' } };
    const badAnalyte = { ...valid, conversionRatio: { ...valid.conversionRatio!, toAnalyte: 'autre produit' } };
    const badFraction = { ...valid, conversionFraction: { ...valid.conversionFraction, range: { min: 0.8, max: 1.1 } } };
    const noBasis = { ...valid, precursor: { ...valid.precursor, basis: ' ' } };
    const noUnit = { ...valid, product: { ...valid.product, unit: '' } };
    const noCentralRange = { ...drafts.yeastOwnProducts(), amount: { ...drafts.yeastOwnProducts().amount, value: 21 } };
    const noConditions = { ...drafts.compoundTransferLoss(), conditions: [] };
    const noLimitations = { ...drafts.compoundTransferLoss(), limitations: ['  '] };

    for (const invalid of [badRange, badUnit, badAnalyte, badFraction, noBasis, noUnit, noCentralRange, noConditions, noLimitations]) {
      expect(() => appendBrewingScenarioBiologicalInput(undefined, invalid as ScenarioBiologicalInputDraft, { createId: nextIds() })).toThrow();
    }
  });
});
