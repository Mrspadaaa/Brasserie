import { hopSourceError, validHopRange, type HopRange, type HopSource, type HopVariety } from '../../../functions/src/hopIndexSchema';
import type { HopExtrapolation, HopExperimentalParameter } from '../../../functions/src/hopExtrapolationSchema';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import type {
  BrewingScenarioAnalogy,
  BrewingScenarioAssumption,
  BrewingScenarioBranchRequest,
  BrewingScenarioModelParameter,
  BrewingScenarioModelOverride,
} from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';

const timingNames = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'] as const;
const clone = <T,>(value: T): T => structuredClone(value);

export class HopV55ScenarioHypothesisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HopV55ScenarioHypothesisError';
  }
}

export interface HopV55ScenarioModelOption {
  id: string;
  name: string;
  version: string;
  source: HopSource;
  evidence: HopSource[];
}

export interface HopV55ModelParameterOption {
  modelId: string;
  modelName: string;
  modelVersion: string;
  parameter: BrewingScenarioModelParameter;
  label: string;
  unit: string;
  current: HopExperimentalParameter;
  /** Source of the exact leaf plus sources for its enclosing model. */
  sources: HopSource[];
  note?: string;
  minimum: number;
  strictlyPositive: boolean;
}

export interface HopV55ScenarioHypothesisOptions {
  models: HopV55ScenarioModelOption[];
  ambiguousModels: Array<{ id: string; versions: string[] }>;
  modelParameters: HopV55ModelParameterOption[];
  varieties: HopVariety[];
  yeasts: HopYeast[];
  yeastAnalogyReferences: Array<{ yeast: HopYeast; modelIds: string[]; sources: HopSource[] }>;
}

export interface ReviseHopV55ModelHypothesisInput {
  prepared: PreparedBrewingScenarioContext;
  branch: BrewingScenarioBranchRequest;
  modelId: string;
  parameter: BrewingScenarioModelParameter;
  unit: string;
  value?: number;
  range?: HopRange;
  /** Required for a range wider than a point. The model never invents its midpoint. */
  central?: number;
  explanation: string;
  source?: HopSource;
}

export type HopV55ScenarioAnalogyEdit =
  | { kind: 'hopDescriptions'; targetVarietyId: string; referenceVarietyId: string; explanation: string }
  | { kind: 'yeastProfile'; targetYeastId: string; referenceYeastId: string; explanation: string };

export interface ReviseHopV55AnalogyInput {
  prepared: PreparedBrewingScenarioContext;
  branch: BrewingScenarioBranchRequest;
  edit: HopV55ScenarioAnalogyEdit;
}

function modelInventory(prepared: PreparedBrewingScenarioContext): { models: HopExtrapolation[]; ambiguousModels: Array<{ id: string; versions: string[] }> } {
  const groups = new Map<string, HopExtrapolation[]>();
  for (const row of prepared.runtime.engineData.knowledge) {
    if (row.kind !== 'extrapolation' || !row.enabled) continue;
    groups.set(row.id, [...groups.get(row.id) ?? [], row]);
  }
  return {
    models: [...groups.values()].flatMap(rows => rows.length === 1 ? rows : []),
    ambiguousModels: [...groups.entries()].flatMap(([id, rows]) => rows.length > 1
      ? [{ id, versions: [...new Set(rows.map(row => row.version))] }] : []),
  };
}

function parameterUnit(parameter: BrewingScenarioModelParameter): string {
  if (parameter.kind === 'timing' && parameter.parameter === 'halfSaturationGL') return 'g/L';
  if (parameter.kind === 'timing' && (parameter.parameter === 'extractionHours' || parameter.parameter === 'decayHours')) return 'h';
  return 'sans unité · paramètre interne du modèle';
}

function parameterLabel(parameter: BrewingScenarioModelParameter, model: HopExtrapolation, note?: string): string {
  switch (parameter.kind) {
    case 'matrix': return 'Matrice';
    case 'gain': return 'Gain global';
    case 'defaultYeastAroma': return 'Arôme par défaut de levure';
    case 'defaultYeastExpression': return 'Expression par défaut de levure';
    case 'axisDoseScale': return `Échelle de dose · ${model.axes.find(row => row.id === parameter.axisId)?.id ?? parameter.axisId}`;
    case 'timing': return `Contact ${parameter.timing} · ${parameter.parameter}`;
    case 'yeastProfile': return `Profil levure · ${note ?? parameter.yeastId} · ${parameter.axisId} · ${parameter.parameter}`;
  }
}

function parameterSources(model: HopExtrapolation, current: HopExperimentalParameter): HopSource[] {
  const byReference = new Map<string, HopSource>();
  for (const source of [current.source, model.source, ...model.evidence]) {
    byReference.set(hopAdviceContentReference('hop-v55-hypothesis-source-v1', source), clone(source));
  }
  return [...byReference.values()];
}

function modelParameterOptions(prepared: PreparedBrewingScenarioContext, models: HopExtrapolation[], yeasts: HopYeast[]): HopV55ModelParameterOption[] {
  const loadedYeastIds = new Set(yeasts.map(row => row.id));
  const options: HopV55ModelParameterOption[] = [];
  const add = (model: HopExtrapolation, parameter: BrewingScenarioModelParameter, current: HopExperimentalParameter,
    note?: string, minimum = 0, strictlyPositive = false) => {
    options.push({ modelId: model.id, modelName: model.name, modelVersion: model.version,
      parameter: clone(parameter), label: parameterLabel(parameter, model, note), unit: parameterUnit(parameter),
      current: clone(current), sources: parameterSources(model, current), ...(note ? { note } : {}), minimum, strictlyPositive });
  };
  for (const model of models) {
    add(model, { kind: 'matrix' }, model.matrix, undefined, 0, true);
    add(model, { kind: 'gain' }, model.gain, undefined, 0, true);
    add(model, { kind: 'defaultYeastAroma' }, model.defaultYeast.aroma);
    add(model, { kind: 'defaultYeastExpression' }, model.defaultYeast.expression);
    for (const timing of timingNames) {
      const row = model.timings[timing];
      add(model, { kind: 'timing', timing, parameter: 'expression' }, row.expression);
      add(model, { kind: 'timing', timing, parameter: 'halfSaturationGL' }, row.halfSaturationGL, undefined, 0, true);
      add(model, { kind: 'timing', timing, parameter: 'extractionHours' }, row.extractionHours, undefined, 0, true);
      if (row.decayHours !== null) add(model, { kind: 'timing', timing, parameter: 'decayHours' }, row.decayHours, undefined, 0, true);
    }
    for (const axis of model.axes) {
      add(model, { kind: 'axisDoseScale', axisId: axis.id }, axis.doseScale, `${axis.id} · ${axis.version}`, 0, true);
      for (const yeast of yeasts) for (const parameter of ['aroma', 'expression'] as const) {
        const profile = model.yeasts.find(row => row.yeastId === yeast.id);
        const current = profile?.[parameter][axis.id]
          ?? (parameter === 'aroma' ? model.defaultYeast.aroma : model.defaultYeast.expression);
        add(model, { kind: 'yeastProfile', yeastId: yeast.id, axisId: axis.id, parameter }, current,
          profile ? yeast.name : `${yeast.name} · départ sur le paramètre par défaut du modèle`);
      }
    }
  }
  return options.filter(option => option.parameter.kind !== 'yeastProfile' || loadedYeastIds.has(option.parameter.yeastId));
}

/** Offers only exact enabled models, exact loaded identities, and declared leaf sources. */
export function getHopV55ScenarioHypothesisOptions(prepared: PreparedBrewingScenarioContext): HopV55ScenarioHypothesisOptions {
  const inventory = modelInventory(prepared);
  const models = inventory.models;
  const yeasts = prepared.runtime.engineData.knowledge.filter((row): row is HopYeast => row.kind === 'yeast');
  const varieties = prepared.runtime.engineData.varieties;
  const yeastAnalogyReferences = yeasts.flatMap(yeast => {
    const modelIds = models.filter(model => model.yeasts.some(profile => profile.yeastId === yeast.id)).map(model => model.id);
    return modelIds.length ? [{ yeast: clone(yeast), modelIds,
      sources: [...new Map(models.filter(model => modelIds.includes(model.id)).flatMap(model => {
        const profile = model.yeasts.find(row => row.yeastId === yeast.id)!;
        return [profile.source, ...profile.evidence];
      }).map(source => [hopAdviceContentReference('hop-v55-analogy-source-v1', source), clone(source)] as const)).values()] }] : [];
  });
  return {
    models: models.map(model => ({ id: model.id, name: model.name, version: model.version, source: clone(model.source), evidence: clone(model.evidence) })),
    ambiguousModels: clone(inventory.ambiguousModels),
    modelParameters: modelParameterOptions(prepared, models, yeasts), varieties: clone(varieties), yeasts: clone(yeasts), yeastAnalogyReferences,
  };
}

function pathForParameter(parameter: BrewingScenarioModelParameter): string {
  if (parameter.kind === 'matrix' || parameter.kind === 'gain') return `model.${parameter.kind}`;
  if (parameter.kind === 'defaultYeastAroma' || parameter.kind === 'defaultYeastExpression') {
    return `model.defaultYeast.${parameter.kind === 'defaultYeastAroma' ? 'aroma' : 'expression'}`;
  }
  if (parameter.kind === 'axisDoseScale') return `model.axes.${parameter.axisId}.doseScale`;
  if (parameter.kind === 'yeastProfile') return `model.yeasts.${parameter.yeastId}.${parameter.parameter}.${parameter.axisId}`;
  return `model.timings.${parameter.timing}.${parameter.parameter}`;
}

function parameterKey(modelId: string, parameter: BrewingScenarioModelParameter): string {
  return hopAdviceContentReference('hop-v55-model-parameter-key-v1', { modelId, parameter });
}

function newHypothesisId(branchId: string, path: string, content: unknown): string {
  return `hyp-${hopAdviceContentReference('hop-v55-scenario-hypothesis-v1', { branchId, path, content }).slice(-28)}`;
}

function validateBranchIdentity(branch: BrewingScenarioBranchRequest): void {
  if (!branch || typeof branch.id !== 'string' || !branch.id.trim() || branch.id === 'baseline') {
    throw new HopV55ScenarioHypothesisError('La branche à réviser doit garder une identité sélectionnable.');
  }
}

function demoteAssumption(branch: BrewingScenarioBranchRequest, assumptionId: string): void {
  branch.assumptions = branch.assumptions.map(row => row.id === assumptionId && row.status === 'selected'
    ? { ...row, status: 'proposed' as const } : row);
}

function selectOrAppendAssumption(branch: BrewingScenarioBranchRequest, assumption: BrewingScenarioAssumption): void {
  const existing = branch.assumptions.find(row => row.id === assumption.id);
  if (existing) existing.status = 'selected';
  else branch.assumptions.push(assumption);
}

function resolveNumericEdit(input: ReviseHopV55ModelHypothesisInput, option: HopV55ModelParameterOption) {
  if (input.unit !== option.unit) throw new HopV55ScenarioHypothesisError(`Unité attendue pour ce paramètre : ${option.unit}.`);
  const hasValue = input.value !== undefined;
  const hasRange = input.range !== undefined;
  if (hasValue === hasRange) throw new HopV55ScenarioHypothesisError('Saisis une valeur exacte ou une plage, sans les mélanger.');
  const range = hasValue ? { min: input.value!, max: input.value! } : clone(input.range!);
  if (!validHopRange(range) || range.min < option.minimum || option.strictlyPositive && range.min <= 0) {
    throw new HopV55ScenarioHypothesisError(option.strictlyPositive ? 'La plage doit rester strictement positive.' : 'La plage ne peut pas être négative.');
  }
  let central = input.central;
  if (hasValue) {
    if (!Number.isFinite(input.value)) throw new HopV55ScenarioHypothesisError('La valeur exacte doit être finie.');
    central = input.value;
    if (input.central !== undefined && input.central !== input.value) throw new HopV55ScenarioHypothesisError('Une valeur exacte est son propre central.');
  } else if (range.min === range.max) central ??= range.min;
  else if (central === undefined) throw new HopV55ScenarioHypothesisError('Déclare un central dans la plage; aucun milieu n’est calculé.');
  if (!Number.isFinite(central) || central! < range.min || central! > range.max) {
    throw new HopV55ScenarioHypothesisError('Le central explicite doit rester dans la plage.');
  }
  if (!input.explanation.trim()) throw new HopV55ScenarioHypothesisError('Explique pourquoi tu retiens cette hypothèse.');
  if (input.source && hopSourceError(input.source)) throw new HopV55ScenarioHypothesisError('La source de l’hypothèse est invalide.');
  return { range, central: central!, explanation: input.explanation.trim() };
}

/** Revises only one exact model parameter; every unrelated branch field is cloned unchanged. */
export function reviseHopV55ModelHypothesis(input: ReviseHopV55ModelHypothesisInput): BrewingScenarioBranchRequest {
  validateBranchIdentity(input.branch);
  const branch = clone(input.branch);
  const option = getHopV55ScenarioHypothesisOptions(input.prepared).modelParameters.find(row => row.modelId === input.modelId
    && parameterKey(row.modelId, row.parameter) === parameterKey(input.modelId, input.parameter));
  if (!option) throw new HopV55ScenarioHypothesisError('Ce modèle ou paramètre exact n’est pas chargé et révisable.');
  const numeric = resolveNumericEdit(input, option);
  branch.assumptions ??= [];
  branch.modelOverrides ??= [];
  const overrideKey = parameterKey(input.modelId, input.parameter);
  const prior = branch.modelOverrides.filter(row => parameterKey(row.modelId, row.parameter) === overrideKey);
  for (const row of prior) demoteAssumption(branch, row.assumptionId);
  const path = pathForParameter(input.parameter);
  const source = input.source ? clone(input.source) : undefined;
  const content = { modelId: input.modelId, parameter: input.parameter, range: numeric.range,
    central: numeric.central, unit: option.unit, explanation: numeric.explanation, source: source ?? null };
  const id = newHypothesisId(branch.id, path, content);
  selectOrAppendAssumption(branch, { id, path, label: option.label, status: 'selected', origin: 'userHypothesis',
    explanation: numeric.explanation, range: numeric.range, central: numeric.central, unit: option.unit,
    ...(source ? { source } : {}) });
  branch.modelOverrides = branch.modelOverrides.filter(row => parameterKey(row.modelId, row.parameter) !== overrideKey);
  branch.modelOverrides.push({ modelId: input.modelId, parameter: clone(input.parameter), assumptionId: id });
  return branch;
}

function loadedVariety(prepared: PreparedBrewingScenarioContext, id: string): HopVariety | undefined {
  return prepared.runtime.engineData.varieties.find(row => row.id === id);
}

function loadedYeast(prepared: PreparedBrewingScenarioContext, id: string): HopYeast | undefined {
  return prepared.runtime.engineData.knowledge.find((row): row is HopYeast => row.kind === 'yeast' && row.id === id);
}

function analogyAssumption(input: { branch: BrewingScenarioBranchRequest; path: string; label: string; referenceId: string;
  explanation: string; source?: HopSource }) {
  const explanation = input.explanation.trim();
  if (!explanation) throw new HopV55ScenarioHypothesisError('Explique ce que l’analogie doit aider à examiner.');
  const content = { path: input.path, referenceId: input.referenceId, explanation, source: input.source ?? null };
  return { id: newHypothesisId(input.branch.id, input.path, content), path: input.path, label: input.label,
    status: 'selected' as const, origin: 'analogy' as const, explanation, value: input.referenceId,
    ...(input.source ? { source: clone(input.source) } : {}) };
}

/** Adds/revises an analogy only between distinct, exactly loaded identities. */
export function reviseHopV55Analogy(input: ReviseHopV55AnalogyInput): BrewingScenarioBranchRequest {
  validateBranchIdentity(input.branch);
  const branch = clone(input.branch);
  branch.assumptions ??= [];
  branch.analogies ??= [];
  if (input.edit.kind === 'hopDescriptions') {
    const target = loadedVariety(input.prepared, input.edit.targetVarietyId);
    const reference = loadedVariety(input.prepared, input.edit.referenceVarietyId);
    if (!target || !reference || target.id === reference.id || reference.archived) {
      throw new HopV55ScenarioHypothesisError('Choisis deux variétés distinctes et chargées; la référence ne doit pas être archivée.');
    }
    if (!reference.descriptions.length) throw new HopV55ScenarioHypothesisError('La variété de référence ne porte aucun descripteur sourcé à reprendre.');
    const targetDescriptions = new Set(target.descriptions.map(row => JSON.stringify(row)));
    if (!reference.descriptions.some(row => !targetDescriptions.has(JSON.stringify(row)))) {
      throw new HopV55ScenarioHypothesisError('Cette analogie n’ajouterait aucun descripteur à la cible.');
    }
    const path = `analogy.hopDescriptions.${target.id}`;
    const oldRows = branch.analogies.filter((row): row is Extract<BrewingScenarioAnalogy, { kind: 'hopDescriptions' }> =>
      row.kind === 'hopDescriptions' && row.targetVarietyId === target.id);
    const assumption = analogyAssumption({ branch, path, label: `Analogie descriptive · ${target.name} ← ${reference.name}`,
      referenceId: reference.id, explanation: input.edit.explanation, source: reference.descriptions[0].source });
    for (const row of oldRows) demoteAssumption(branch, row.assumptionId);
    branch.analogies = branch.analogies.filter(row => row.kind !== 'hopDescriptions' || row.targetVarietyId !== target.id);
    selectOrAppendAssumption(branch, assumption);
    branch.analogies.push({ kind: 'hopDescriptions', targetVarietyId: target.id, referenceVarietyId: reference.id,
      assumptionId: assumption.id, explanation: assumption.explanation });
    return branch;
  }

  const target = loadedYeast(input.prepared, input.edit.targetYeastId);
  const reference = loadedYeast(input.prepared, input.edit.referenceYeastId);
  if (!target || !reference || target.id === reference.id) {
    throw new HopV55ScenarioHypothesisError('Choisis deux identités de levure distinctes et chargées.');
  }
  const applicableModels = modelInventory(input.prepared).models.filter(model => model.yeasts.some(row => row.yeastId === reference.id)
    && !model.yeasts.some(row => row.yeastId === target.id));
  if (!applicableModels.length) {
    throw new HopV55ScenarioHypothesisError('Aucun modèle chargé n’a un profil source utilisable sans déjà avoir un profil explicite pour la cible.');
  }
  const path = `analogy.yeastProfile.${target.id}`;
  const oldRows = branch.analogies.filter((row): row is Extract<BrewingScenarioAnalogy, { kind: 'yeastProfile' }> =>
    row.kind === 'yeastProfile' && row.targetYeastId === target.id);
  const assumption = analogyAssumption({ branch, path, label: `Analogie de profil · ${target.name} ← ${reference.name}`,
    referenceId: reference.id, explanation: input.edit.explanation, source: reference.source });
  for (const row of oldRows) demoteAssumption(branch, row.assumptionId);
  branch.analogies = branch.analogies.filter(row => row.kind !== 'yeastProfile' || row.targetYeastId !== target.id);
  selectOrAppendAssumption(branch, assumption);
  branch.analogies.push({ kind: 'yeastProfile', targetYeastId: target.id, referenceYeastId: reference.id,
    assumptionId: assumption.id, explanation: assumption.explanation });
  return branch;
}

