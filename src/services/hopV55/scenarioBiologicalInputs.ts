import { hopSourceError, validHopRange, type HopRange, type HopSource, type HopSourceKind } from '../../../functions/src/hopIndexSchema';
import type {
  BrewingScenarioAssumption,
  BrewingScenarioBiologicalAmount,
  BrewingScenarioBiologicalInput,
  BrewingScenarioBranchRequest,
  BrewingScenarioFactor,
} from '../../domain/brewingScenario';

export type ScenarioBiologicalSourceDraft =
  | {
      kind: 'personalDeclaration';
      title: string;
      author: string;
      locator?: string;
    }
  | {
      kind: 'bibliography';
      sourceKind: Exclude<HopSourceKind, 'judgment' | 'observation'>;
      title: string;
      author: string;
      year: number | null;
      reference: string;
      locator?: string;
    };

export interface ScenarioBiologicalAmountDraft {
  analyte: string;
  unit: string;
  basis: string;
  range: HopRange;
  value?: number;
  central?: number;
  matrixId?: string;
  timepoint?: string;
  explanation: string;
  source: ScenarioBiologicalSourceDraft;
}

export interface ScenarioBiologicalFactorDraft {
  range: HopRange;
  central?: number;
  unit: string;
  fromAnalyte?: string;
  toAnalyte?: string;
  fromUnit?: string;
  toUnit?: string;
  explanation: string;
  source: ScenarioBiologicalSourceDraft;
}

export interface ScenarioBiologicalConversionRatioDraft extends ScenarioBiologicalFactorDraft {
  fromAnalyte: string;
  toAnalyte: string;
  fromUnit: string;
  toUnit: string;
}

export type ScenarioBiologicalInputDraft =
  | {
      kind: 'yeastOwnProducts';
      amount: ScenarioBiologicalAmountDraft;
      conditions: string[];
      limitations: string[];
    }
  | {
      kind: 'hopPrecursorTransformation';
      precursor: ScenarioBiologicalAmountDraft;
      product: {
        analyte: string;
        unit: string;
        basis: string;
        matrixId?: string;
        timepoint?: string;
      };
      conversionFraction: ScenarioBiologicalFactorDraft;
      conversionRatio?: ScenarioBiologicalConversionRatioDraft;
      conditions: string[];
      limitations: string[];
    }
  | {
      kind: 'compoundTransferLoss';
      sourceAmount: ScenarioBiologicalAmountDraft;
      extractionFraction: ScenarioBiologicalFactorDraft;
      retentionFraction: ScenarioBiologicalFactorDraft;
      targetMatrixId: string;
      targetTimepoint: string;
      conditions: string[];
      limitations: string[];
    };

export type ScenarioBiologicalIdPurpose = 'branch' | 'input' | 'factor' | 'assumption';
export type ScenarioBiologicalIdFactory = (purpose: ScenarioBiologicalIdPurpose) => string;

export interface AppendScenarioBiologicalInputOptions {
  createId?: ScenarioBiologicalIdFactory;
  branchLabel?: string;
}

export class ScenarioBiologicalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScenarioBiologicalInputError';
  }
}

const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const optionalText = (value: string | undefined) => value === undefined || isText(value);
const safeId = (value: unknown): value is string => isText(value) && value.length <= 120
  && !/[\/\\]/.test(value) && !/^__.*__$/.test(value)
  && !['.', '..', 'constructor', 'prototype'].includes(value);

function defaultIdFactory(purpose: ScenarioBiologicalIdPurpose): string {
  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `scenario-bio-${purpose}-${token}`;
}

function fail(message: string): never {
  throw new ScenarioBiologicalInputError(message);
}

function requiredText(value: unknown, label: string): asserts value is string {
  if (!isText(value)) fail(`${label} est requis pour déclarer cette hypothèse.`);
}

function assertRange(value: unknown, label: string): asserts value is HopRange {
  if (!validHopRange(value)) fail(`${label} exige deux bornes explicites, dans l’ordre min ≤ max.`);
}

function assertOptionalPoint(value: number | undefined, range: HopRange, label: string): void {
  if (value !== undefined && (!isFiniteNumber(value) || value < range.min || value > range.max)) {
    fail(`${label} doit rester dans la plage saisie.`);
  }
}

function assertSource(draft: ScenarioBiologicalSourceDraft): void {
  requiredText(draft.title, 'Le titre ou libellé de provenance');
  requiredText(draft.author, 'L’auteur de la provenance');
  if (draft.locator !== undefined && !optionalText(draft.locator)) fail('L’emplacement de provenance est invalide.');
  if (draft.kind === 'personalDeclaration') return;
  requiredText(draft.reference, 'La référence bibliographique');
  if (draft.year !== null && (!Number.isInteger(draft.year) || draft.year < 1)) fail('L’année de source doit être explicite ou inconnue.');
}

function sourceFor(draft: ScenarioBiologicalSourceDraft, localReference: string): HopSource {
  assertSource(draft);
  const source: HopSource = draft.kind === 'personalDeclaration'
    ? {
        title: draft.title,
        author: draft.author,
        year: null,
        kind: 'judgment',
        reference: `local:scenario-hypothesis:${localReference}`,
        ...(draft.locator !== undefined ? { locator: draft.locator } : {}),
      }
    : {
        title: draft.title,
        author: draft.author,
        year: draft.year,
        kind: draft.sourceKind,
        reference: draft.reference,
        ...(draft.locator !== undefined ? { locator: draft.locator } : {}),
      };
  const sourceError = hopSourceError(source);
  if (sourceError) fail(sourceError);
  return source;
}

function normalizedLines(values: string[], label: string): string[] {
  if (!Array.isArray(values)) fail(`${label} est requis.`);
  const lines = values.map(value => value.trim()).filter(Boolean);
  if (!lines.length) fail(`${label} doit contenir au moins une entrée explicite.`);
  return lines;
}

function collectExistingIds(branch: BrewingScenarioBranchRequest): Set<string> {
  const ids = new Set<string>([branch.id]);
  for (const assumption of branch.assumptions ?? []) ids.add(assumption.id);
  for (const input of branch.biologicalInputs ?? []) {
    ids.add(input.id);
    const parameters = input.kind === 'yeastOwnProducts'
      ? [input.amount]
      : input.kind === 'hopPrecursorTransformation'
        ? [input.precursor, input.conversionFraction, ...(input.conversionRatio ? [input.conversionRatio] : [])]
        : [input.sourceAmount, input.extractionFraction, input.retentionFraction];
    for (const parameter of parameters) {
      if ('id' in parameter) ids.add(parameter.id);
      if (parameter.assumptionId) ids.add(parameter.assumptionId);
    }
  }
  return ids;
}

function makeAllocator(branch: BrewingScenarioBranchRequest, createId: ScenarioBiologicalIdFactory) {
  const used = collectExistingIds(branch);
  return (purpose: ScenarioBiologicalIdPurpose): string => {
    const id = createId(purpose);
    if (!safeId(id) || used.has(id)) fail(`Identifiant de ${purpose} invalide ou déjà utilisé.`);
    used.add(id);
    return id;
  };
}

function amountAndAssumption(
  draft: ScenarioBiologicalAmountDraft,
  inputId: string,
  node: string,
  label: string,
  allocate: (purpose: ScenarioBiologicalIdPurpose) => string,
): { amount: BrewingScenarioBiologicalAmount; assumption: BrewingScenarioAssumption } {
  requiredText(draft.analyte, `${label} : analyte`);
  requiredText(draft.unit, `${label} : unité`);
  requiredText(draft.basis, `${label} : base`);
  assertRange(draft.range, `${label} : plage`);
  assertOptionalPoint(draft.value, draft.range, `${label} : valeur`);
  assertOptionalPoint(draft.central, draft.range, `${label} : point central`);
  if (!optionalText(draft.matrixId) || !optionalText(draft.timepoint)) fail(`${label} : matrice ou point temporel invalide.`);
  requiredText(draft.explanation, `${label} : explication`);
  const assumptionId = allocate('assumption');
  const source = sourceFor(draft.source, `${inputId}:${node}`);
  const amount: BrewingScenarioBiologicalAmount = {
    assumptionId,
    analyte: draft.analyte,
    unit: draft.unit,
    basis: draft.basis,
    range: structuredClone(draft.range),
    ...(draft.value !== undefined ? { value: draft.value } : {}),
    ...(draft.central !== undefined ? { central: draft.central } : {}),
    ...(draft.matrixId !== undefined ? { matrixId: draft.matrixId } : {}),
    ...(draft.timepoint !== undefined ? { timepoint: draft.timepoint } : {}),
    origin: 'userHypothesis',
    sourceRefs: [source],
  };
  const assumption: BrewingScenarioAssumption = {
    id: assumptionId,
    path: `biologicalInputs.${inputId}.${node}`,
    label,
    status: 'selected',
    origin: 'userHypothesis',
    explanation: draft.explanation,
    ...(draft.value !== undefined ? { value: draft.value } : {}),
    range: structuredClone(draft.range),
    ...(draft.central !== undefined ? { central: draft.central } : {}),
    unit: draft.unit,
    basis: draft.basis,
    source,
  };
  return { amount, assumption };
}

function factorAndAssumption(
  draft: ScenarioBiologicalFactorDraft,
  inputId: string,
  node: string,
  label: string,
  allocate: (purpose: ScenarioBiologicalIdPurpose) => string,
  fraction = false,
  scope?: Pick<BrewingScenarioFactor, 'fromAnalyte' | 'toAnalyte' | 'fromUnit' | 'toUnit'>,
): { factor: BrewingScenarioFactor; assumption: BrewingScenarioAssumption } {
  assertRange(draft.range, `${label} : plage`);
  if (!isFiniteNumber(draft.range.min) || draft.range.min < 0) fail(`${label} ne peut pas être négatif.`);
  if (fraction && (draft.range.max > 1 || !['fraction', '1'].includes(draft.unit))) {
    fail(`${label} doit rester entre 0 et 1 et utiliser l’unité fractionnaire « fraction » ou « 1 ».`);
  }
  assertOptionalPoint(draft.central, draft.range, `${label} : point central`);
  requiredText(draft.unit, `${label} : unité`);
  requiredText(draft.explanation, `${label} : explication`);
  if (scope) {
    for (const field of ['fromAnalyte', 'toAnalyte', 'fromUnit', 'toUnit'] as const) {
      if (!isText(scope[field])) fail(`${label} : portée analyte/unité ${field} absente.`);
      if (draft[field] !== undefined && draft[field] !== scope[field]) {
        fail(`${label} : ${field} doit correspondre exactement à la quantité déclarée.`);
      }
    }
  }
  const factorId = allocate('factor');
  const assumptionId = allocate('assumption');
  const source = sourceFor(draft.source, `${inputId}:${node}`);
  const factor: BrewingScenarioFactor = {
    id: factorId,
    assumptionId,
    range: structuredClone(draft.range),
    ...(draft.central !== undefined ? { central: draft.central } : {}),
    unit: draft.unit,
    ...((scope?.fromAnalyte ?? draft.fromAnalyte) !== undefined ? { fromAnalyte: scope?.fromAnalyte ?? draft.fromAnalyte } : {}),
    ...((scope?.toAnalyte ?? draft.toAnalyte) !== undefined ? { toAnalyte: scope?.toAnalyte ?? draft.toAnalyte } : {}),
    ...((scope?.fromUnit ?? draft.fromUnit) !== undefined ? { fromUnit: scope?.fromUnit ?? draft.fromUnit } : {}),
    ...((scope?.toUnit ?? draft.toUnit) !== undefined ? { toUnit: scope?.toUnit ?? draft.toUnit } : {}),
    origin: 'userHypothesis',
    explanation: draft.explanation,
    sourceRefs: [source],
  };
  const assumption: BrewingScenarioAssumption = {
    id: assumptionId,
    path: `biologicalInputs.${inputId}.${node}`,
    label,
    status: 'selected',
    origin: 'userHypothesis',
    explanation: draft.explanation,
    range: structuredClone(draft.range),
    ...(draft.central !== undefined ? { central: draft.central } : {}),
    unit: draft.unit,
    source,
  };
  return { factor, assumption };
}

function assertConversionRatioMatches(
  ratio: ScenarioBiologicalConversionRatioDraft,
  precursor: BrewingScenarioBiologicalAmount,
  product: { analyte: string; unit: string },
): void {
  if (ratio.fromAnalyte !== precursor.analyte || ratio.fromUnit !== precursor.unit
    || ratio.toAnalyte !== product.analyte || ratio.toUnit !== product.unit) {
    fail('Le rapport de conversion doit reprendre exactement l’analyte et l’unité du précurseur vers le produit déclaré.');
  }
}

/**
 * Adds one explicit biological hypothesis to a branch without changing its
 * existing program, overrides, sources, comparisons or earlier declarations.
 * With no branch, it starts a new comparison-only branch for the caller to
 * recalculate and snapshot through the normal J5 callback.
 */
export function appendBrewingScenarioBiologicalInput(
  existingBranch: BrewingScenarioBranchRequest | undefined,
  draft: ScenarioBiologicalInputDraft,
  options: AppendScenarioBiologicalInputOptions = {},
): BrewingScenarioBranchRequest {
  const createId = options.createId ?? defaultIdFactory;
  const branch: BrewingScenarioBranchRequest = existingBranch
    ? structuredClone(existingBranch)
    : { id: createId('branch'), label: options.branchLabel ?? 'Hypothèse biologique', assumptions: [] };
  if (!safeId(branch.id) || branch.id === 'baseline' || !isText(branch.label)) fail('Branche de comparaison invalide.');
  if (!Array.isArray(branch.assumptions)) fail('La branche doit conserver ses hypothèses existantes.');
  const allocate = makeAllocator(branch, createId);
  const inputId = allocate('input');
  const newAssumptions: BrewingScenarioAssumption[] = [];
  let input: BrewingScenarioBiologicalInput;

  if (draft.kind === 'yeastOwnProducts') {
    const amount = amountAndAssumption(draft.amount, inputId, 'amount', 'Produit propre de la levure', allocate);
    newAssumptions.push(amount.assumption);
    input = {
      id: inputId,
      kind: draft.kind,
      amount: amount.amount,
      conditions: normalizedLines(draft.conditions, 'Les conditions'),
      limitations: normalizedLines(draft.limitations, 'Les limites'),
    };
  } else if (draft.kind === 'hopPrecursorTransformation') {
    requiredText(draft.product.analyte, 'Produit transformé : analyte');
    requiredText(draft.product.unit, 'Produit transformé : unité');
    requiredText(draft.product.basis, 'Produit transformé : base');
    if (!optionalText(draft.product.matrixId) || !optionalText(draft.product.timepoint)) fail('Produit transformé : matrice ou point temporel invalide.');
    const precursor = amountAndAssumption(draft.precursor, inputId, 'precursor', 'Précurseur', allocate);
    const conversionScope = {
      fromAnalyte: precursor.amount.analyte,
      toAnalyte: draft.product.analyte,
      fromUnit: precursor.amount.unit,
      toUnit: draft.product.unit,
    };
    const conversionFraction = factorAndAssumption(draft.conversionFraction, inputId, 'conversionFraction', 'Fraction de conversion', allocate, true, conversionScope);
    newAssumptions.push(precursor.assumption, conversionFraction.assumption);
    let conversionRatio: BrewingScenarioFactor | undefined;
    if (draft.conversionRatio !== undefined) {
      assertConversionRatioMatches(draft.conversionRatio, precursor.amount, draft.product);
      const ratio = factorAndAssumption(draft.conversionRatio, inputId, 'conversionRatio', 'Rapport de conversion analyte/unité', allocate);
      conversionRatio = ratio.factor;
      newAssumptions.push(ratio.assumption);
    }
    input = {
      id: inputId,
      kind: draft.kind,
      precursor: precursor.amount,
      productAnalyte: draft.product.analyte,
      productUnit: draft.product.unit,
      productBasis: draft.product.basis,
      conversionFraction: conversionFraction.factor,
      ...(conversionRatio ? { conversionRatio } : {}),
      ...(draft.product.matrixId !== undefined ? { productMatrixId: draft.product.matrixId } : {}),
      ...(draft.product.timepoint !== undefined ? { productTimepoint: draft.product.timepoint } : {}),
      conditions: normalizedLines(draft.conditions, 'Les conditions'),
      limitations: normalizedLines(draft.limitations, 'Les limites'),
    };
  } else if (draft.kind === 'compoundTransferLoss') {
    requiredText(draft.targetMatrixId, 'Matrice cible');
    requiredText(draft.targetTimepoint, 'Point temporel cible');
    const sourceAmount = amountAndAssumption(draft.sourceAmount, inputId, 'sourceAmount', 'Quantité à transférer', allocate);
    const transferScope = {
      fromAnalyte: sourceAmount.amount.analyte,
      toAnalyte: sourceAmount.amount.analyte,
      fromUnit: sourceAmount.amount.unit,
      toUnit: sourceAmount.amount.unit,
    };
    const extraction = factorAndAssumption(draft.extractionFraction, inputId, 'extractionFraction', 'Fraction d’extraction', allocate, true, transferScope);
    const retention = factorAndAssumption(draft.retentionFraction, inputId, 'retentionFraction', 'Fraction de rétention', allocate, true, transferScope);
    newAssumptions.push(sourceAmount.assumption, extraction.assumption, retention.assumption);
    input = {
      id: inputId,
      kind: draft.kind,
      sourceAmount: sourceAmount.amount,
      extractionFraction: extraction.factor,
      retentionFraction: retention.factor,
      targetMatrixId: draft.targetMatrixId,
      targetTimepoint: draft.targetTimepoint,
      conditions: normalizedLines(draft.conditions, 'Les conditions'),
      limitations: normalizedLines(draft.limitations, 'Les limites'),
    };
  } else {
    return fail('Type de contribution biologique inconnu.');
  }

  branch.assumptions = [...branch.assumptions, ...newAssumptions];
  branch.biologicalInputs = [...(branch.biologicalInputs ?? []), input];
  return branch;
}
