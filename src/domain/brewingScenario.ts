import { assertHopDocument, hopMeasurementError, hopSourceError, validHopRange, type HopMeasurement, type HopRange, type HopSource } from '../../functions/src/hopIndexSchema';
import { assertHopKnowledge, type HopAxis, type HopKnowledge, type HopYeast, type HopTriplet } from '../../functions/src/hopPredictionSchema';
import { assertHopExtrapolation, type HopExtrapolation, type HopExperimentalParameter } from '../../functions/src/hopExtrapolationSchema';
import { assertHopRecipeInput, HOP_RECIPE_ENGINE_VERSION, predictHopRecipe, type HopRecipeInput, type HopRecipePrediction } from '../../functions/src/hopRecipePrediction';
import { usableHopKnowledge, type HopEngineData } from '../../functions/src/hopPredictionCore';
import { hopAdviceContentReference } from './hopDecision/adviceContentReference';
import { analyzeHopProgram, compareHopPrograms, type HopProgramAnalysis } from './hopDecision/programAnalysis';
import { previewHopProgramChanges, programFingerprint } from './hopDecision/programs';
import { hopAlphaModelParameterError } from './hopDecision/modelInputs';
import type { HopBiotransformationAssessment, HopBiotransformationInput } from './hopDecision/biotransformation';
import { assessHopBiotransformation } from './hopDecision/biotransformation';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramChange, HopProgramProposal } from './hopDecision/types';
import { HOP_DECISION_VERSION } from './hopDecision/types';

/** Shared deterministic scenario contract for the UI and the brewer-tool adapter. */
export const BREWING_SCENARIO_VERSION = 'brewing-scenario-v1' as const;
export const BREWING_SCENARIO_DEPENDENCY_VERSION = 'brewing-scenario-dependencies-v1' as const;

export type BrewingScenarioOrigin = 'userHypothesis' | 'assistantHypothesis' | 'modelHypothesis' | 'analogy' | 'sourceRange' | 'catalogue' | 'observation' | 'calculation';
export type BrewingScenarioStage = 'planning' | 'hotSide' | 'fermenting' | 'conditioning' | 'packaged';

export interface BrewingScenarioAssumption {
  id: string;
  /** Stable field path, e.g. `additions.dry-hop-1.doseGL` or `model.matrix`. */
  path: string;
  label: string;
  status: 'proposed' | 'selected';
  origin: BrewingScenarioOrigin;
  explanation: string;
  value?: number | string | boolean | null;
  range?: HopRange;
  /** Optional explicit representative; no midpoint is selected by the engine. */
  central?: number;
  unit?: string;
  basis?: string;
  source?: HopSource;
}

export interface BrewingScenarioInputAdditionPatch {
  additionId: string;
  triplet: Partial<Omit<HopTriplet, 'yeastId'>>;
}

export interface BrewingScenarioInputOverrides {
  volumeL?: number;
  yeastId?: string | null;
  pitchTempC?: number;
  yeastTemperature?: HopRecipeInput['yeastTemperature'];
  fermentation?: HopRecipeInput['fermentation'];
  additions?: BrewingScenarioInputAdditionPatch[];
  aromaDomain?: HopRecipeInput['aromaDomain'];
  aromaContext?: HopRecipeInput['aromaContext'];
}

export interface BrewingScenarioProgramOverrides {
  volumeL?: number | null;
  wortGravity?: number | null;
  ibuModelContext?: HopDecisionProgram['ibuModelContext'];
}

export type BrewingScenarioModelParameter =
  | { kind: 'matrix' }
  | { kind: 'gain' }
  | { kind: 'defaultYeastAroma' }
  | { kind: 'defaultYeastExpression' }
  | { kind: 'timing'; timing: HopTriplet['timing']; parameter: 'expression' | 'halfSaturationGL' | 'extractionHours' | 'decayHours' }
  | { kind: 'axisDoseScale'; axisId: string }
  | { kind: 'yeastProfile'; yeastId: string; axisId: string; parameter: 'aroma' | 'expression' };

export interface BrewingScenarioModelOverride {
  modelId: string;
  parameter: BrewingScenarioModelParameter;
  assumptionId: string;
}

export type BrewingScenarioAnalogy =
  | { kind: 'hopDescriptions'; targetVarietyId: string; referenceVarietyId: string; assumptionId: string; explanation: string }
  | { kind: 'yeastProfile'; targetYeastId: string; referenceYeastId: string; assumptionId: string; explanation: string };

/** Scenario-only identities are inputs to one projection and never catalogue writes. */
export interface BrewingScenarioMaterialInputs {
  hops?: HopDecisionMaterial[];
  yeasts?: HopYeast[];
}

export interface BrewingScenarioCultureMember {
  /** An exact loaded yeast ID, when one is known. */
  yeastId?: string;
  name?: string;
  proportion?: HopRange;
  source?: HopSource;
}

export interface BrewingScenarioCultureContext {
  state: 'single' | 'mixed' | 'unknown';
  members: BrewingScenarioCultureMember[];
  /** Label/context is preserved; it never selects a coefficient. */
  explanation?: string;
}

export interface BrewingScenarioBeerFact {
  id: string;
  field: string;
  status: 'observed' | 'reported' | 'target' | 'unknown' | 'proposed' | 'selected';
  origin: BrewingScenarioOrigin;
  value?: number | string | boolean | null;
  range?: HopRange;
  unit?: string;
  basis?: string;
  matrixId?: string;
  timepoint?: string;
  source?: HopSource;
}

export interface BrewingScenarioStyleReference {
  guideId: string;
  version: string;
  styleId: string;
  role: 'reference' | 'target';
}

/** Beer/style context remains typed facts or targets; it is not an implicit coefficient. */
export interface BrewingScenarioBeerContext {
  style?: BrewingScenarioStyleReference;
  matrixId?: string;
  facts: BrewingScenarioBeerFact[];
}

export interface BrewingScenarioFactor {
  id: string;
  assumptionId?: string;
  range: HopRange;
  /** Required when the receiving calculation exposes a central scenario. */
  central?: number;
  unit: string;
  fromAnalyte?: string;
  toAnalyte?: string;
  fromUnit?: string;
  toUnit?: string;
  origin: Extract<BrewingScenarioOrigin, 'sourceRange' | 'analogy' | 'userHypothesis' | 'assistantHypothesis' | 'modelHypothesis' | 'observation'>;
  explanation: string;
  sourceRefs: HopSource[];
}

export interface BrewingScenarioBiologicalAmount {
  assumptionId?: string;
  analyte: string;
  unit: string;
  basis: string;
  range: HopRange;
  value?: number;
  central?: number;
  matrixId?: string;
  timepoint?: string;
  origin: 'observed' | 'sourceRange' | 'analogy' | 'userHypothesis' | 'assistantHypothesis' | 'modelHypothesis' | 'calculated';
  sourceRefs: HopSource[];
}

export type BrewingScenarioBiologicalInput =
  | { id: string; kind: 'yeastOwnProducts'; amount: BrewingScenarioBiologicalAmount; conditions: string[]; limitations: string[] }
  | {
      id: string; kind: 'hopPrecursorTransformation'; precursor: BrewingScenarioBiologicalAmount;
      productAnalyte: string; productUnit: string; productBasis: string;
      conversionFraction: BrewingScenarioFactor;
      /** Dimensioned output-unit / input-unit factor; required for unlike compounds or units. */
      conversionRatio?: BrewingScenarioFactor;
      productMatrixId?: string; productTimepoint?: string;
      conditions: string[]; limitations: string[];
    }
  | {
      id: string; kind: 'compoundTransferLoss'; sourceAmount: BrewingScenarioBiologicalAmount;
      extractionFraction: BrewingScenarioFactor; retentionFraction: BrewingScenarioFactor;
      targetMatrixId?: string; targetTimepoint?: string;
      conditions: string[]; limitations: string[];
    };

export type BrewingScenarioBaseline =
  | { kind: 'recipe'; recipeReference: string; inputReference: string; programReference?: string; contextReference: string }
  | { kind: 'hypothetical'; label: string; input: HopRecipeInput; program?: HopDecisionProgram | null; materials?: BrewingScenarioMaterialInputs; culture?: BrewingScenarioCultureContext; beerContext?: BrewingScenarioBeerContext; biologicalContext?: HopBiotransformationInput };

export interface BrewingScenarioBranchRequest {
  id: string;
  label: string;
  /** A full hypothetical branch input; recipe-backed branches use explicit patches instead. */
  input?: HopRecipeInput;
  inputOverrides?: BrewingScenarioInputOverrides;
  /** Beer/process model context scenario; does not change measurements or a stored programme. */
  programOverrides?: BrewingScenarioProgramOverrides;
  /** J1 changes to future program lines only. */
  programChanges?: HopProgramChange[];
  materials?: BrewingScenarioMaterialInputs;
  assumptions: BrewingScenarioAssumption[];
  analogies?: BrewingScenarioAnalogy[];
  modelOverrides?: BrewingScenarioModelOverride[];
  biologicalContext?: HopBiotransformationInput;
  biologicalInputs?: BrewingScenarioBiologicalInput[];
  culture?: BrewingScenarioCultureContext;
  beerContext?: BrewingScenarioBeerContext;
}

export interface BrewingScenarioRequest {
  version: typeof BREWING_SCENARIO_VERSION;
  scenarioId: string;
  revision: number;
  baseline: BrewingScenarioBaseline;
  target?: Record<string, HopRange>;
  assumptions: BrewingScenarioAssumption[];
  branches: BrewingScenarioBranchRequest[];
}

export interface BrewingScenarioRuntimeCurrent {
  recipeReference: string;
  inputReference: string;
  /** Changes independently from material identity whenever the loaded stock basis changes. */
  stockAvailabilityReference?: string;
  input: HopRecipeInput;
  program?: HopDecisionProgram | null;
  /** Journal operations that are already physical facts even if binding the full program failed. */
  performedAdditionIds?: string[];
  limitations?: string[];
  biologicalContext?: HopBiotransformationInput;
  culture?: BrewingScenarioCultureContext;
  beerContext?: BrewingScenarioBeerContext;
}

/** Engine/catalogue data is a private runtime dependency, never part of request JSON. */
export interface BrewingScenarioRuntime {
  engineData: HopEngineData;
  materials: HopDecisionMaterial[];
  current?: BrewingScenarioRuntimeCurrent;
  biologicalContext?: HopBiotransformationInput;
  beerContext?: BrewingScenarioBeerContext;
  /** Optional outer storage revision supplied by the server-side loader. */
  dataRevision?: string;
}

export interface BrewingScenarioBiologicalContribution {
  id: string;
  kind: BrewingScenarioBiologicalInput['kind'];
  status: 'observed' | 'estimated' | 'conditional' | 'unknown';
  value: BrewingScenarioBiologicalAmount | null;
  assumptionIds: string[];
  conditions: string[];
  limitations: string[];
}

export interface BrewingScenarioComparison {
  beforeBranchId: 'baseline';
  afterBranchId: string;
  profile: Record<string, { range: HopRange | null; unit: 'axisScale'; reasons: string[] }>;
  score: { range: HopRange | null; unit: 'modelFit'; reasons: string[] };
  program?: ReturnType<typeof compareHopPrograms>;
  limits: string[];
}

export interface BrewingScenarioDependencySnapshot {
  version: typeof BREWING_SCENARIO_DEPENDENCY_VERSION;
  reference: string;
  dataRevision?: string;
  /** Exact identities, lots and knowledge used by this branch; not a hash-only pointer. */
  engineData: HopEngineData;
  decisionMaterials: HopDecisionMaterial[];
  program?: HopDecisionProgram | null;
  biologicalContext?: HopBiotransformationInput;
  beerContext?: BrewingScenarioBeerContext;
  scenarioMaterials?: BrewingScenarioMaterialInputs;
  scenarioModelBases: HopExtrapolation[];
  scenarioModelInstances: HopExtrapolation[];
  knowledgeValidationErrors: string[];
}

export interface BrewingScenarioBiologicalAssessment {
  cultureMemberId: string | null;
  cultureMemberLabel?: string;
  assessment: HopBiotransformationAssessment;
}

export interface BrewingScenarioCultureProjection {
  memberId: string | null;
  label: string;
  scope: 'singleMemberProjection';
  hopPrediction: HopRecipePrediction;
  yeastBaselineModel?: HopRecipePrediction;
  limitations: string[];
}

export interface BrewingScenarioBranchResult {
  id: 'baseline' | string;
  label: string;
  reference: string;
  input: HopRecipeInput;
  program?: HopDecisionProgram | null;
  programProposal?: HopProgramProposal;
  programAnalysis?: HopProgramAnalysis;
  /** `hypotheticalOnly` keeps a recipe-bound comparison from being presented as an applicable programme. */
  applicability: 'available' | 'conditional' | 'unavailable' | 'hypotheticalOnly';
  hopPrediction: HopRecipePrediction;
  /** Existing model's zero-hop yeast baseline, not a measured fermentation contribution. */
  yeastBaselineModel?: HopRecipePrediction;
  biologicalAssessment?: HopBiotransformationAssessment;
  biologicalAssessments: BrewingScenarioBiologicalAssessment[];
  cultureProjections: BrewingScenarioCultureProjection[];
  biologicalContributions: BrewingScenarioBiologicalContribution[];
  culture?: BrewingScenarioCultureContext;
  beerContext?: BrewingScenarioBeerContext;
  performedAdditionIds: string[];
  assumptions: BrewingScenarioAssumption[];
  usedAssumptionIds: string[];
  proposedAssumptionIds: string[];
  unappliedAssumptionIds: string[];
  analogies: BrewingScenarioAnalogy[];
  limitations: string[];
  dependencySnapshot: BrewingScenarioDependencySnapshot;
}

export interface BrewingScenarioResult {
  version: typeof BREWING_SCENARIO_VERSION;
  scenarioId: string;
  revision: number;
  requestSnapshot: BrewingScenarioRequest;
  inputReference: string;
  reference: string;
  dataReference: string;
  status: 'quantified' | 'conditional' | 'partiallyQuantified' | 'unknown';
  baseline: BrewingScenarioBranchResult;
  branches: BrewingScenarioBranchResult[];
  comparisons: BrewingScenarioComparison[];
  limitations: string[];
}

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const isText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isFinite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const uniqueText = (rows: unknown[]): rows is string[] => rows.every(isText) && new Set(rows).size === rows.length;
const safeId = (value: unknown): value is string => isText(value) && value.length <= 120 && !/[\/\\]/.test(value)
  && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);
function check(condition: unknown, reason: string): asserts condition { if (!condition) throw Error(reason); }
const onlyKeys = (value: Row, allowed: readonly string[], label: string) => check(Object.keys(value).every(key => allowed.includes(key)), `${label} : champ inconnu.`);
const hopUses = ['firstWort', 'boil', 'whirlpool', 'fermentation', 'postFermentation'] as const;
const hopStages = ['planning', 'hotSide', 'fermenting', 'conditioning', 'packaged'] as const;

function sourceIsValid(source: unknown): boolean {
  return !hopSourceError(source);
}

function assertAssumption(value: unknown): asserts value is BrewingScenarioAssumption {
  check(isRow(value), 'Hypothèse de scénario invalide.');
  onlyKeys(value, ['id', 'path', 'label', 'status', 'origin', 'explanation', 'value', 'range', 'central', 'unit', 'basis', 'source'], 'Hypothèse de scénario');
  check(safeId(value.id) && isText(value.path) && isText(value.label) && isText(value.explanation), 'Identité ou explication d’hypothèse absente.');
  check(['proposed', 'selected'].includes(value.status as string), 'État de sélection d’hypothèse inconnu.');
  check(['userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'analogy', 'sourceRange', 'catalogue', 'observation', 'calculation'].includes(value.origin as string), 'Origine d’hypothèse inconnue.');
  check(value.value === undefined || value.value === null || ['string', 'boolean'].includes(typeof value.value) || isFinite(value.value), 'Valeur d’hypothèse invalide.');
  check(value.range === undefined || validHopRange(value.range), 'Plage d’hypothèse invalide.');
  check(value.value !== undefined || value.range !== undefined, 'Une hypothèse doit porter une valeur ou une plage explicite.');
  const range = value.range as HopRange | undefined;
  check(value.central === undefined || isFinite(value.central) && !!range && range.min <= value.central && value.central <= range.max,
    'Le point central doit être explicitement fourni dans la plage d’hypothèse.');
  check(value.unit === undefined || isText(value.unit), 'Unité d’hypothèse invalide.');
  check(value.basis === undefined || isText(value.basis), 'Base d’hypothèse invalide.');
  check(value.source === undefined || sourceIsValid(value.source), 'Source d’hypothèse invalide.');
  if (['sourceRange', 'catalogue', 'observation'].includes(value.origin as string)) check(value.source !== undefined, 'Une hypothèse documentaire/observée requiert sa source.');
}

function assertScenarioMaterial(value: unknown): asserts value is HopDecisionMaterial {
  check(isRow(value) && safeId(value.id) && isText(value.name)
    && ['pelletT90', 'pelletT45', 'cryo', 'cone', 'extract', 'unknown'].includes(value.form as string), 'Matière hypothétique invalide.');
  onlyKeys(value, ['id', 'name', 'form', 'variety', 'lot', 'product', 'declaredAnalysis', 'alphaForModel', 'stockItemRef', 'availableGrams'], 'Matière de scénario');
  if (value.variety !== undefined) assertHopDocument('hopVarieties', value.variety);
  if (value.lot !== undefined) assertHopDocument('hopLots', value.lot);
  if (value.declaredAnalysis !== undefined) {
    check(Array.isArray(value.declaredAnalysis), 'Déclarations analytiques de scénario invalides.');
    for (const row of value.declaredAnalysis) check(!hopMeasurementError(row), 'Mesure déclarée de scénario invalide.');
  }
  if (value.alphaForModel !== undefined) check(!hopAlphaModelParameterError(value.alphaForModel as NonNullable<HopDecisionMaterial['alphaForModel']>), 'Alpha de modèle hypothétique invalide.');
  if (value.availableGrams !== undefined) check(value.availableGrams === null || isFinite(value.availableGrams) && value.availableGrams >= 0, 'Stock hypothétique invalide.');
  if (value.stockItemRef !== undefined) check(isText(value.stockItemRef), 'Référence de stock hypothétique invalide.');
}

function assertScenarioYeast(value: unknown): asserts value is HopYeast {
  check(isRow(value) && value.kind === 'yeast', 'Levure hypothétique invalide.');
  assertHopKnowledge(value);
}

function assertScenarioMaterials(value: unknown): asserts value is BrewingScenarioMaterialInputs {
  check(isRow(value), 'Identités de scénario invalides.');
  onlyKeys(value, ['hops', 'yeasts'], 'Identités de scénario');
  for (const [field, validator] of [['hops', assertScenarioMaterial], ['yeasts', assertScenarioYeast]] as const) {
    if (value[field] === undefined) continue;
    check(Array.isArray(value[field]), `Identités ${field} invalides.`);
    const ids = new Set<string>();
    for (const row of value[field] as unknown[]) {
      validator(row);
      const id = (row as { id: string }).id;
      check(!ids.has(id), `Identité ${field} dupliquée : ${id}.`); ids.add(id);
    }
  }
}

function assertCulture(value: unknown): asserts value is BrewingScenarioCultureContext {
  check(isRow(value), 'Contexte de culture invalide.');
  onlyKeys(value, ['state', 'members', 'explanation'], 'Contexte de culture');
  check(['single', 'mixed', 'unknown'].includes(value.state as string) && Array.isArray(value.members), 'État ou membres de culture invalides.');
  check(value.state === 'mixed' ? value.members.length > 1 : value.state === 'single' ? value.members.length === 1 : true,
    'Le nombre de membres ne correspond pas à l’état de culture.');
  if (value.explanation !== undefined) check(isText(value.explanation), 'Explication de culture invalide.');
  const ids = new Set<string>();
  for (const member of value.members) {
    check(isRow(member), 'Membre de culture invalide.');
    onlyKeys(member, ['yeastId', 'name', 'proportion', 'source'], 'Membre de culture');
    const yeastId = member.yeastId;
    check(yeastId === undefined || typeof yeastId === 'string' && safeId(yeastId), 'Identifiant de levure de culture invalide.');
    check(member.name === undefined || isText(member.name), 'Nom de membre de culture invalide.');
    check(member.yeastId !== undefined || member.name !== undefined, 'Membre de culture sans identité.');
    if (typeof yeastId === 'string' && yeastId) { check(!ids.has(yeastId), 'Levure de culture dupliquée.'); ids.add(yeastId); }
    check(member.proportion === undefined || validHopRange(member.proportion) && (member.proportion as HopRange).min >= 0 && (member.proportion as HopRange).max <= 1, 'Proportion de culture invalide.');
    check(member.source === undefined || sourceIsValid(member.source), 'Source de membre de culture invalide.');
  }
}

function assertBeerContext(value: unknown): asserts value is BrewingScenarioBeerContext {
  check(isRow(value), 'Contexte bière invalide.');
  onlyKeys(value, ['style', 'matrixId', 'facts'], 'Contexte bière');
  check(value.matrixId === undefined || safeId(value.matrixId), 'Matrice de bière invalide.');
  if (value.style !== undefined) {
    check(isRow(value.style), 'Référence de style invalide.');
    onlyKeys(value.style, ['guideId', 'version', 'styleId', 'role'], 'Référence de style');
    check(safeId(value.style.guideId) && isText(value.style.version) && safeId(value.style.styleId)
      && ['reference', 'target'].includes(value.style.role as string), 'Référence de style invalide.');
  }
  check(Array.isArray(value.facts), 'Faits de bière absents.');
  const ids = new Set<string>();
  for (const fact of value.facts) {
    check(isRow(fact), 'Fait de bière invalide.');
    onlyKeys(fact, ['id', 'field', 'status', 'origin', 'value', 'range', 'unit', 'basis', 'matrixId', 'timepoint', 'source'], 'Fait de bière');
    check(safeId(fact.id) && isText(fact.field) && !ids.has(fact.id as string), 'Identité de fait bière absente ou dupliquée.'); ids.add(fact.id as string);
    check(['observed', 'reported', 'target', 'unknown', 'proposed', 'selected'].includes(fact.status as string), 'État de fait bière invalide.');
    check(['userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'analogy', 'sourceRange', 'catalogue', 'observation', 'calculation'].includes(fact.origin as string), 'Origine de fait bière invalide.');
    check(fact.value === undefined || fact.value === null || ['string', 'boolean'].includes(typeof fact.value) || isFinite(fact.value), 'Valeur de fait bière invalide.');
    check(fact.range === undefined || validHopRange(fact.range), 'Plage de fait bière invalide.');
    if (isFinite(fact.value) && fact.range) check((fact.range as HopRange).min <= fact.value && fact.value <= (fact.range as HopRange).max, 'Valeur de fait bière hors plage.');
    if (fact.status === 'unknown') check(fact.value === undefined || fact.value === null, 'Un fait inconnu ne peut pas contenir une valeur assertée.');
    check(fact.unit === undefined || isText(fact.unit), 'Unité de fait bière invalide.');
    check(fact.basis === undefined || isText(fact.basis), 'Base de fait bière invalide.');
    check(fact.matrixId === undefined || safeId(fact.matrixId), 'Matrice de fait bière invalide.');
    check(fact.timepoint === undefined || isText(fact.timepoint), 'Point temporel de fait bière invalide.');
    check(fact.source === undefined || sourceIsValid(fact.source), 'Source de fait bière invalide.');
    if (fact.origin === 'observation' || fact.origin === 'sourceRange' || fact.origin === 'catalogue') check(fact.source !== undefined, 'Un fait source/catalogue/observé requiert sa provenance.');
    if (fact.status === 'selected') check(fact.origin === 'userHypothesis' || fact.origin === 'assistantHypothesis' || fact.origin === 'modelHypothesis' || fact.origin === 'analogy' || fact.origin === 'sourceRange', 'Un fait sélectionné doit garder son origine de travail.');
  }
}

function assertBiologicalAmount(value: unknown): asserts value is BrewingScenarioBiologicalAmount {
  check(isRow(value), 'Quantité biologique de scénario invalide.');
  onlyKeys(value, ['assumptionId', 'analyte', 'unit', 'basis', 'range', 'value', 'central', 'matrixId', 'timepoint', 'origin', 'sourceRefs'], 'Quantité biologique');
  check(value.assumptionId === undefined || safeId(value.assumptionId), 'Référence d’hypothèse de quantité invalide.');
  check(isText(value.analyte) && isText(value.unit) && isText(value.basis) && validHopRange(value.range), 'Analyte, unité, base et plage sont requis pour une quantité biologique.');
  check(value.value === undefined || isFinite(value.value) && value.range.min <= value.value && value.value <= value.range.max, 'Valeur rapportée hors de la plage biologique.');
  check(value.central === undefined || isFinite(value.central) && value.range.min <= value.central && value.central <= value.range.max, 'Point central biologique hors plage.');
  check(value.matrixId === undefined || isText(value.matrixId), 'Matrice biologique invalide.');
  check(value.timepoint === undefined || isText(value.timepoint), 'Point temporel biologique invalide.');
  check(['observed', 'sourceRange', 'analogy', 'userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'calculated'].includes(value.origin as string), 'Origine biologique inconnue.');
  check(Array.isArray(value.sourceRefs) && value.sourceRefs.every(sourceIsValid), 'Sources biologiques invalides.');
  if (value.origin === 'observed' || value.origin === 'sourceRange') check((value.sourceRefs as HopSource[]).length > 0, 'Une mesure/plage observée requiert sa source.');
  if (['analogy', 'userHypothesis', 'assistantHypothesis', 'modelHypothesis'].includes(value.origin as string)) check(safeId(value.assumptionId), 'Une quantité biologique hypothétique doit référencer une hypothèse sélectionnable.');
}

function assertFactor(value: unknown, fraction = false): asserts value is BrewingScenarioFactor {
  check(isRow(value), 'Facteur de scénario invalide.');
  onlyKeys(value, ['id', 'assumptionId', 'range', 'central', 'unit', 'fromAnalyte', 'toAnalyte', 'fromUnit', 'toUnit', 'origin', 'explanation', 'sourceRefs'], 'Facteur de scénario');
  check(safeId(value.id) && validHopRange(value.range) && isText(value.unit) && isText(value.explanation), 'Identité, unité, explication ou plage de facteur absente.');
  check(value.assumptionId === undefined || safeId(value.assumptionId), 'Référence d’hypothèse de facteur invalide.');
  check(value.range.min >= 0, 'Un facteur de transfert/conversion ne peut pas être négatif.');
  if (fraction) check(value.range.min >= 0 && value.range.max <= 1 && (value.unit === 'fraction' || value.unit === '1'), 'La fraction doit rester dans [0,1].');
  check(value.central === undefined || isFinite(value.central) && value.range.min <= value.central && value.central <= value.range.max, 'Point central de facteur hors plage.');
  check(['sourceRange', 'analogy', 'userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'observation'].includes(value.origin as string), 'Origine du facteur inconnue.');
  for (const field of ['fromAnalyte', 'toAnalyte', 'fromUnit', 'toUnit']) if (value[field] !== undefined) check(isText(value[field]), `Portée du facteur invalide : ${field}.`);
  check(Array.isArray(value.sourceRefs) && value.sourceRefs.every(sourceIsValid), 'Sources du facteur invalides.');
  if (value.origin === 'sourceRange' || value.origin === 'observation') check((value.sourceRefs as HopSource[]).length > 0, 'Un facteur source/observation requiert sa source.');
  if (['analogy', 'userHypothesis', 'assistantHypothesis', 'modelHypothesis'].includes(value.origin as string)) check(safeId(value.assumptionId), 'Un facteur hypothétique doit référencer une hypothèse sélectionnable.');
}

function assertBiologicalInput(value: unknown): asserts value is BrewingScenarioBiologicalInput {
  check(isRow(value) && safeId(value.id) && isText(value.kind), 'Entrée de contribution biologique invalide.');
  if (value.kind === 'yeastOwnProducts') {
    onlyKeys(value, ['id', 'kind', 'amount', 'conditions', 'limitations'], 'Contribution propre de levure');
    assertBiologicalAmount(value.amount);
  } else if (value.kind === 'hopPrecursorTransformation') {
    onlyKeys(value, ['id', 'kind', 'precursor', 'productAnalyte', 'productUnit', 'productBasis', 'conversionFraction', 'conversionRatio', 'productMatrixId', 'productTimepoint', 'conditions', 'limitations'], 'Transformation de précurseur');
    assertBiologicalAmount(value.precursor);
    check(isText(value.productAnalyte) && isText(value.productUnit) && isText(value.productBasis), 'Produit biologique incomplet.');
    assertFactor(value.conversionFraction, true);
    if (value.conversionRatio !== undefined) {
      assertFactor(value.conversionRatio);
      check(value.conversionRatio.fromAnalyte === value.precursor.analyte && value.conversionRatio.toAnalyte === value.productAnalyte
        && value.conversionRatio.fromUnit === value.precursor.unit && value.conversionRatio.toUnit === value.productUnit,
      'Le rapport de conversion doit nommer les deux analytes et unités exacts.');
    }
    if (value.productMatrixId !== undefined) check(isText(value.productMatrixId), 'Matrice de produit biologique invalide.');
    if (value.productTimepoint !== undefined) check(isText(value.productTimepoint), 'Point temporel de produit biologique invalide.');
  } else if (value.kind === 'compoundTransferLoss') {
    onlyKeys(value, ['id', 'kind', 'sourceAmount', 'extractionFraction', 'retentionFraction', 'targetMatrixId', 'targetTimepoint', 'conditions', 'limitations'], 'Transfert ou perte de composé');
    assertBiologicalAmount(value.sourceAmount);
    assertFactor(value.extractionFraction, true); assertFactor(value.retentionFraction, true);
    check(isText(value.targetMatrixId) && isText(value.targetTimepoint), 'Matrice et point temporel cibles explicitement requis.');
  } else throw Error('Type de contribution biologique inconnu.');
  check(Array.isArray(value.conditions) && value.conditions.every(isText) && Array.isArray(value.limitations) && value.limitations.every(isText), 'Conditions ou limites biologiques invalides.');
}

function expectedOverridePaths(overrides: BrewingScenarioInputOverrides | undefined): string[] {
  if (!overrides) return [];
  const paths: string[] = [];
  for (const field of ['volumeL', 'yeastId', 'pitchTempC', 'yeastTemperature', 'fermentation', 'aromaDomain', 'aromaContext'] as const) {
    if (Object.prototype.hasOwnProperty.call(overrides, field)) paths.push(`recipe.${field}`);
  }
  for (const addition of overrides.additions ?? []) {
    for (const field of Object.keys(addition.triplet)) paths.push(`additions.${addition.additionId}.${field}`);
  }
  return paths;
}

function expectedProgramOverridePaths(overrides: BrewingScenarioProgramOverrides | undefined): string[] {
  if (!overrides) return [];
  return (['volumeL', 'wortGravity', 'ibuModelContext'] as const)
    .filter(field => Object.prototype.hasOwnProperty.call(overrides, field))
    .map(field => `program.${field}`);
}

function hasUncoveredRecipeContextOverride(input: HopRecipeInput, overrides: BrewingScenarioInputOverrides | undefined): boolean {
  if (!overrides) return false;
  return (['yeastId', 'pitchTempC', 'yeastTemperature', 'fermentation', 'aromaDomain', 'aromaContext'] as const)
    .some(field => Object.prototype.hasOwnProperty.call(overrides, field) && !sameJson(input[field], overrides[field]));
}

function scalarOverrideFacts(overrides: BrewingScenarioInputOverrides | undefined): Array<{ path: string; value: unknown }> {
  if (!overrides) return [];
  const facts: Array<{ path: string; value: unknown }> = [];
  for (const field of ['volumeL', 'yeastId', 'pitchTempC', 'yeastTemperature', 'fermentation', 'aromaDomain', 'aromaContext'] as const) {
    if (Object.prototype.hasOwnProperty.call(overrides, field)) facts.push({ path: `recipe.${field}`, value: overrides[field] });
  }
  for (const row of overrides.additions ?? []) for (const [field, value] of Object.entries(row.triplet)) {
    facts.push({ path: `additions.${row.additionId}.${field}`, value });
  }
  return facts;
}

function scalarProgramOverrideFacts(overrides: BrewingScenarioProgramOverrides | undefined): Array<{ path: string; value: unknown }> {
  if (!overrides) return [];
  return (['volumeL', 'wortGravity', 'ibuModelContext'] as const)
    .filter(field => Object.prototype.hasOwnProperty.call(overrides, field))
    .map(field => ({ path: `program.${field}`, value: overrides[field] }));
}

function expectedUnitForOverride(path: string): string | undefined {
  if (path === 'recipe.volumeL' || path === 'program.volumeL') return 'L';
  if (path === 'recipe.pitchTempC' || /^additions\..+\.temperatureC$/.test(path)) return '°C';
  if (/^additions\..+\.doseGL$/.test(path)) return 'g/L';
  if (/^additions\..+\.contactHours$/.test(path)) return 'h';
  if (path === 'program.wortGravity') return 'SG';
  return undefined;
}

function assertOverrideAssumptionValue(
  path: string,
  value: unknown,
  assumption: BrewingScenarioAssumption,
): void {
  if (isFinite(value)) {
    const pointMatches = assumption.value === undefined || assumption.value === value;
    const rangeMatches = assumption.range === undefined || assumption.range.min <= value && value <= assumption.range.max;
    check((assumption.value !== undefined || assumption.range !== undefined) && pointMatches && rangeMatches,
      `La valeur d’hypothèse « ${assumption.label} » ne couvre pas ${path}=${value}.`);
    const expectedUnit = expectedUnitForOverride(path);
    check(!expectedUnit || assumption.unit === undefined || assumption.unit === expectedUnit,
      `L’unité de l’hypothèse « ${assumption.label} » ne correspond pas à ${path} (${expectedUnit}).`);
    return;
  }
  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    check(assumption.value === value && assumption.range === undefined,
      `La valeur d’hypothèse « ${assumption.label} » ne correspond pas à ${path}.`);
    const expectedUnit = expectedUnitForOverride(path);
    check(!expectedUnit || assumption.unit === undefined || assumption.unit === expectedUnit,
      `L’unité de l’hypothèse « ${assumption.label} » ne correspond pas à ${path} (${expectedUnit}).`);
  }
}

export function brewingScenarioInputReference(request: BrewingScenarioRequest): string {
  return hopAdviceContentReference('brewing-scenario-input-v1', request);
}

function assertBrewingScenarioRequestShape(value: unknown, validateCurrentBindings: boolean): asserts value is BrewingScenarioRequest {
  check(isRow(value), 'Requête de scénario invalide.');
  onlyKeys(value, ['version', 'scenarioId', 'revision', 'baseline', 'target', 'assumptions', 'branches'], 'Requête de scénario');
  check(value.version === BREWING_SCENARIO_VERSION && safeId(value.scenarioId) && Number.isSafeInteger(value.revision) && (value.revision as number) >= 0,
    'Version, identité ou révision de scénario invalide.');
  check(isRow(value.baseline), 'Référence de scénario absente.');
  if (value.baseline.kind === 'recipe') {
    onlyKeys(value.baseline, ['kind', 'recipeReference', 'inputReference', 'programReference', 'contextReference'], 'Base recette');
    check(isText(value.baseline.recipeReference) && isText(value.baseline.inputReference) && isText(value.baseline.contextReference), 'Références de recette et de contexte requises.');
    check(value.baseline.programReference === undefined || isText(value.baseline.programReference), 'Référence de programme invalide.');
    check(value.baseline.contextReference === undefined || isText(value.baseline.contextReference), 'Référence de contexte bière invalide.');
  } else if (value.baseline.kind === 'hypothetical') {
    onlyKeys(value.baseline, ['kind', 'label', 'input', 'program', 'materials', 'culture', 'beerContext', 'biologicalContext'], 'Base hypothétique');
    check(isText(value.baseline.label), 'Nom du scénario hypothétique absent.');
    assertHopRecipeInput(value.baseline.input);
    if (value.baseline.program !== undefined && value.baseline.program !== null) programFingerprint(value.baseline.program as HopDecisionProgram);
    if (value.baseline.materials !== undefined) assertScenarioMaterials(value.baseline.materials);
    if (value.baseline.culture !== undefined) assertCulture(value.baseline.culture);
    if (value.baseline.beerContext !== undefined) assertBeerContext(value.baseline.beerContext);
    if (value.baseline.biologicalContext !== undefined) assertBiotransformationInput(value.baseline.biologicalContext);
  } else throw Error('Mode de base inconnu.');
  check(value.target === undefined || isRow(value.target) && Object.entries(value.target).every(([id, range]) => isText(id) && validHopRange(range)), 'Cible de scénario invalide.');
  check(Array.isArray(value.assumptions), 'Hypothèses de base absentes.');
  const assumptionIds = new Set<string>();
  for (const assumption of value.assumptions) { assertAssumption(assumption); check(!assumptionIds.has(assumption.id), 'Hypothèse de base dupliquée.'); assumptionIds.add(assumption.id); }
  check(Array.isArray(value.branches), 'Branches de scénario absentes.');
  const branchIds = new Set<string>();
  for (const branch of value.branches) {
    check(isRow(branch), 'Branche de scénario invalide.');
    onlyKeys(branch, ['id', 'label', 'input', 'inputOverrides', 'programOverrides', 'programChanges', 'materials', 'assumptions', 'analogies', 'modelOverrides', 'biologicalContext', 'biologicalInputs', 'culture', 'beerContext'], 'Branche de scénario');
    check(safeId(branch.id) && branch.id !== 'baseline' && isText(branch.label) && !branchIds.has(branch.id as string), 'Identité de branche invalide ou dupliquée.'); branchIds.add(branch.id as string);
    check(branch.input === undefined || value.baseline.kind === 'hypothetical', 'Une recette réelle ne peut pas remplacer son entrée par un triplet libre; déclarer une branche de programme ou un patch explicite.');
    check(!(branch.input !== undefined && branch.programChanges !== undefined), 'Une branche ne peut pas combiner un input complet et des changements de programme.');
    if (branch.input !== undefined) assertHopRecipeInput(branch.input);
    if (branch.inputOverrides !== undefined) assertInputOverrides(branch.inputOverrides);
    if (branch.programOverrides !== undefined) assertProgramOverrides(branch.programOverrides);
    check(branch.programChanges === undefined || Array.isArray(branch.programChanges) && branch.programChanges.length > 0, 'Changements de programme invalides.');
    if (branch.materials !== undefined) assertScenarioMaterials(branch.materials);
    check(Array.isArray(branch.assumptions), 'Hypothèses de branche absentes.');
    const localAssumptions = new Set<string>();
    for (const assumption of branch.assumptions) { assertAssumption(assumption); check(!localAssumptions.has(assumption.id) && !assumptionIds.has(assumption.id), 'ID d’hypothèse dupliqué.'); localAssumptions.add(assumption.id); }
    const scenarioAssumptions = [...value.assumptions as BrewingScenarioAssumption[], ...branch.assumptions as BrewingScenarioAssumption[]];
    const selectedAssumptions = scenarioAssumptions.filter(row => row.status === 'selected');
    const selectedPaths = new Set(selectedAssumptions.map(row => row.path));
    const inputOverridePaths = expectedOverridePaths(branch.inputOverrides as BrewingScenarioInputOverrides | undefined);
    const programOverridePaths = expectedProgramOverridePaths(branch.programOverrides as BrewingScenarioProgramOverrides | undefined);
    for (const path of inputOverridePaths) check(selectedPaths.has(path), `L’entrée modifiée ${path} n’a pas d’hypothèse sélectionnée/provenance.`);
    for (const path of programOverridePaths) check(selectedPaths.has(path), `Le contexte modifié ${path} n’a pas d’hypothèse sélectionnée/provenance.`);
    if (branch.programChanges !== undefined) check(selectedPaths.has('program.changes'), 'Un changement de programme doit garder sa raison de scénario/J1 sélectionnée.');
    if (validateCurrentBindings) for (const fact of [...scalarOverrideFacts(branch.inputOverrides as BrewingScenarioInputOverrides | undefined), ...scalarProgramOverrideFacts(branch.programOverrides as BrewingScenarioProgramOverrides | undefined)]) {
      const matching = selectedAssumptions.filter(row => row.path === fact.path);
      check(matching.length === 1, `Une seule hypothèse sélectionnée doit lier la valeur réelle ${fact.path}.`);
      assertOverrideAssumptionValue(fact.path, fact.value, matching[0]);
    }
    for (const listName of ['analogies', 'modelOverrides', 'biologicalInputs'] as const) {
      if (branch[listName] === undefined) continue;
      check(Array.isArray(branch[listName]), `Liste ${listName} invalide.`);
    }
    for (const analogy of (branch.analogies ?? []) as unknown[]) assertAnalogy(analogy);
    for (const analogy of (branch.analogies ?? []) as BrewingScenarioAnalogy[]) {
      const assumption = scenarioAssumptions.find(row => row.id === analogy.assumptionId);
      check(assumption && assumption.status === 'selected' && assumption.origin === 'analogy', 'Une analogie exige une hypothèse explicitement sélectionnée.');
    }
    for (const override of (branch.modelOverrides ?? []) as unknown[]) assertModelOverride(override, [...value.assumptions as BrewingScenarioAssumption[], ...branch.assumptions as BrewingScenarioAssumption[]]);
    for (const bio of (branch.biologicalInputs ?? []) as unknown[]) assertBiologicalInput(bio);
    if (branch.biologicalContext !== undefined) assertBiotransformationInput(branch.biologicalContext);
    assertBiologicalSelections((branch.biologicalInputs ?? []) as BrewingScenarioBiologicalInput[], scenarioAssumptions, validateCurrentBindings);
    if (branch.culture !== undefined) assertCulture(branch.culture);
    if (branch.beerContext !== undefined) assertBeerContext(branch.beerContext);
  }
}

export function assertBrewingScenarioRequest(value: unknown): asserts value is BrewingScenarioRequest {
  assertBrewingScenarioRequestShape(value, true);
}

function assertBrewingScenarioRequestSnapshot(value: unknown): asserts value is BrewingScenarioRequest {
  // Archived v1 results are structural snapshots. Their original assumptions
  // and outputs remain readable without retroactively applying new binding rules.
  assertBrewingScenarioRequestShape(value, false);
}

function assertInputOverrides(value: unknown): asserts value is BrewingScenarioInputOverrides {
  check(isRow(value), 'Patch de HopRecipeInput invalide.');
  onlyKeys(value, ['volumeL', 'yeastId', 'pitchTempC', 'yeastTemperature', 'fermentation', 'additions', 'aromaDomain', 'aromaContext'], 'Patch de recette');
  check(value.volumeL === undefined || isFinite(value.volumeL) && value.volumeL >= 0, 'Volume de scénario invalide.');
  check(value.yeastId === undefined || value.yeastId === null || safeId(value.yeastId), 'Levure de scénario invalide.');
  check(value.pitchTempC === undefined || isFinite(value.pitchTempC), 'Température d’ensemencement invalide.');
  check(value.fermentation === undefined || Array.isArray(value.fermentation), 'Paliers de scénario invalides.');
  check(value.additions === undefined || Array.isArray(value.additions), 'Ajouts de scénario invalides.');
  const additionIds = new Set<string>();
  for (const row of (value.additions ?? []) as unknown[]) {
    check(isRow(row) && safeId(row.additionId) && isRow(row.triplet), 'Patch d’ajout invalide.');
    onlyKeys(row, ['additionId', 'triplet'], 'Patch d’ajout');
    onlyKeys(row.triplet, ['varietyId', 'lotId', 'timing', 'doseGL', 'temperatureC', 'contactHours', 'matrixId'], 'Patch de triplet');
    check(!additionIds.has(row.additionId as string), 'Patch d’ajout dupliqué.'); additionIds.add(row.additionId as string);
  }
}

function assertProgramOverrides(value: unknown): asserts value is BrewingScenarioProgramOverrides {
  check(isRow(value), 'Patch de programme invalide.');
  onlyKeys(value, ['volumeL', 'wortGravity', 'ibuModelContext'], 'Patch de programme');
  check(value.volumeL === undefined || value.volumeL === null || isFinite(value.volumeL) && value.volumeL > 0, 'Volume de programme invalide.');
  check(value.wortGravity === undefined || value.wortGravity === null || isFinite(value.wortGravity) && value.wortGravity >= 1, 'Gravité de programme invalide.');
  if (value.ibuModelContext !== undefined) {
    check(isRow(value.ibuModelContext), 'Convention IBU invalide.');
    const context = value.ibuModelContext;
    onlyKeys(context, ['variant', 'volumeL', 'volumeReference', 'gravity', 'gravityReference', 'explanation'], 'Convention IBU');
    check(['tinseth-original', 'tinseth-declared-variant'].includes(context.variant as string)
      && isFinite(context.volumeL) && context.volumeL > 0 && isFinite(context.gravity) && context.gravity >= 1
      && ['finishedBeer', 'fermenter', 'kettleHot', 'kettleCold'].includes(context.volumeReference as string)
      && ['averageBoil', 'atAddition', 'originalGravity'].includes(context.gravityReference as string)
      && isText(context.explanation), 'Convention IBU incomplète.');
  }
}

function assertAnalogy(value: unknown): asserts value is BrewingScenarioAnalogy {
  check(isRow(value), 'Analogie de scénario invalide.');
  if (value.kind === 'hopDescriptions') {
    onlyKeys(value, ['kind', 'targetVarietyId', 'referenceVarietyId', 'assumptionId', 'explanation'], 'Analogie de variété');
    check(safeId(value.targetVarietyId) && safeId(value.referenceVarietyId) && safeId(value.assumptionId) && isText(value.explanation), 'Lien d’analogie de variété invalide.');
  } else if (value.kind === 'yeastProfile') {
    onlyKeys(value, ['kind', 'targetYeastId', 'referenceYeastId', 'assumptionId', 'explanation'], 'Analogie de souche');
    check(safeId(value.targetYeastId) && safeId(value.referenceYeastId) && safeId(value.assumptionId) && isText(value.explanation), 'Lien d’analogie de souche invalide.');
  } else throw Error('Type d’analogie inconnu.');
}

function modelParameterPath(parameter: BrewingScenarioModelParameter): string {
  if (parameter.kind === 'matrix' || parameter.kind === 'gain') return `model.${parameter.kind}`;
  if (parameter.kind === 'defaultYeastAroma' || parameter.kind === 'defaultYeastExpression') return `model.defaultYeast.${parameter.kind === 'defaultYeastAroma' ? 'aroma' : 'expression'}`;
  if (parameter.kind === 'axisDoseScale') return `model.axes.${parameter.axisId}.doseScale`;
  if (parameter.kind === 'yeastProfile') return `model.yeasts.${parameter.yeastId}.${parameter.parameter}.${parameter.axisId}`;
  return `model.timings.${parameter.timing}.${parameter.parameter}`;
}

function assertModelOverride(value: unknown, assumptions: BrewingScenarioAssumption[]): asserts value is BrewingScenarioModelOverride {
  check(isRow(value), 'Override d’extrapolation invalide.');
  onlyKeys(value, ['modelId', 'parameter', 'assumptionId'], 'Override d’extrapolation');
  check(safeId(value.modelId) && safeId(value.assumptionId) && isRow(value.parameter), 'Référence d’override invalide.');
  const parameter = value.parameter as Row;
  if (parameter.kind === 'matrix' || parameter.kind === 'gain' || parameter.kind === 'defaultYeastAroma' || parameter.kind === 'defaultYeastExpression') {
    onlyKeys(parameter, ['kind'], 'Paramètre d’extrapolation');
  } else if (parameter.kind === 'axisDoseScale') {
    onlyKeys(parameter, ['kind', 'axisId'], 'Paramètre d’extrapolation'); check(isText(parameter.axisId), 'Axe d’extrapolation invalide.');
  } else if (parameter.kind === 'yeastProfile') {
    onlyKeys(parameter, ['kind', 'yeastId', 'axisId', 'parameter'], 'Paramètre d’extrapolation');
    check(safeId(parameter.yeastId) && isText(parameter.axisId) && ['aroma', 'expression'].includes(parameter.parameter as string), 'Profil de souche d’extrapolation invalide.');
  } else if (parameter.kind === 'timing') {
    onlyKeys(parameter, ['kind', 'timing', 'parameter'], 'Paramètre d’extrapolation');
    check(hopUses.includes(parameter.timing as typeof hopUses[number]) && ['expression', 'halfSaturationGL', 'extractionHours', 'decayHours'].includes(parameter.parameter as string), 'Paramètre de timing invalide.');
  } else throw Error('Paramètre d’extrapolation inconnu.');
  const assumption = assumptions.find(row => row.id === value.assumptionId);
  check(assumption && assumption.path === modelParameterPath(parameter as unknown as BrewingScenarioModelParameter), 'Override sans hypothèse de modèle correspondante.');
  check(assumption.status === 'selected' && (assumption.origin === 'userHypothesis' || assumption.origin === 'assistantHypothesis'
    || assumption.origin === 'modelHypothesis' || assumption.origin === 'analogy' || assumption.origin === 'sourceRange'), 'Override de modèle sans hypothèse/analogie sélectionnée.');
  check(assumption.range !== undefined || isFinite(assumption.value), 'Override de modèle sans plage/valeur numérique.');
  check(assumption.range === undefined || assumption.range.min >= 0, 'Une plage de modèle ne peut pas être négative.');
  check(!isFinite(assumption.value) || assumption.value >= 0, 'Un facteur de modèle ne peut pas être négatif.');
}

function assertBiotransformationInput(value: unknown): asserts value is HopBiotransformationInput {
  check(isRow(value), 'Contexte bio de scénario invalide.');
  // Reuse the exact strict runtime contract by invoking the public assessment on a clone only later.
  const allowed = ['subjectLabel', 'hopMeasurements', 'yeast', 'fermentation', 'additions', 'stage', 'hopDextrinEnzymeActivity', 'hopDextrinEnzymeSource', 'fermentableDextrins', 'fermentableDextrinsSource', 'geraniolPrecursorEvidence', 'geraniolPrecursorSource'];
  onlyKeys(value, allowed, 'Contexte bio');
  if (value.subjectLabel !== undefined) check(isText(value.subjectLabel), 'Étiquette bio invalide.');
  if (value.hopMeasurements !== undefined) {
    check(Array.isArray(value.hopMeasurements), 'Mesures bio invalides.');
    for (const measurement of value.hopMeasurements as HopMeasurement[]) check(!hopMeasurementError(measurement), 'Mesure bio invalide.');
  }
  if (value.yeast !== undefined) {
    check(isRow(value.yeast), 'Contexte de souche invalide.'); onlyKeys(value.yeast, ['betaLyase', 'source'], 'Contexte de souche');
    check(value.yeast.betaLyase === undefined || ['positive', 'negative', 'unknown'].includes(value.yeast.betaLyase as string), 'État β-lyase invalide.');
    check(value.yeast.source === undefined || sourceIsValid(value.yeast.source), 'Source de levure invalide.');
  }
  if (value.fermentation !== undefined) {
    check(isRow(value.fermentation), 'Fermentation bio invalide.'); onlyKeys(value.fermentation, ['state', 'temperatureC'], 'Fermentation bio');
    check(value.fermentation.state === undefined || ['active', 'finished', 'noViableYeast', 'unknown'].includes(value.fermentation.state as string), 'État fermentaire invalide.');
    check(value.fermentation.temperatureC === undefined || value.fermentation.temperatureC === null || isFinite(value.fermentation.temperatureC), 'Température bio invalide.');
  }
  if (value.additions !== undefined) {
    check(Array.isArray(value.additions), 'Ajouts bio invalides.');
    for (const addition of value.additions as unknown[]) {
      check(isRow(addition), 'Ajout bio invalide.'); onlyKeys(addition, ['kind', 'state', 'contactHours', 'temperatureC'], 'Ajout bio');
      check(['mash', 'boil', 'whirlpool', 'fermentation', 'dryHop', 'postFermentation', 'other', 'unknown'].includes(addition.kind as string)
        && ['planned', 'completed', 'unknown'].includes(addition.state as string), 'État ou emploi bio invalide.');
      check(addition.contactHours === undefined || addition.contactHours === null || isFinite(addition.contactHours) && addition.contactHours >= 0, 'Contact bio invalide.');
      check(addition.temperatureC === undefined || addition.temperatureC === null || isFinite(addition.temperatureC), 'Température bio invalide.');
    }
  }
  if (value.stage !== undefined) check(['fermentation', 'conditioning', 'packaged', 'other', 'unknown'].includes(value.stage as string), 'Stade bio invalide.');
  if (value.hopDextrinEnzymeActivity !== undefined) check(['positive', 'negative', 'unknown'].includes(value.hopDextrinEnzymeActivity as string), 'État enzymatique bio invalide.');
  for (const field of ['fermentableDextrins', 'geraniolPrecursorEvidence']) if (value[field] !== undefined)
    check(['documented', 'notDetected', 'unknown'].includes(value[field] as string), `État bio invalide : ${field}.`);
  for (const field of ['hopDextrinEnzymeSource', 'fermentableDextrinsSource', 'geraniolPrecursorSource']) {
    if (value[field] !== undefined) check(sourceIsValid(value[field]), `Source bio invalide : ${field}.`);
  }
}

function assertBiologicalParameterBinding(
  parameter: BrewingScenarioBiologicalAmount | BrewingScenarioFactor,
  assumptions: BrewingScenarioAssumption[],
): void {
  if (!parameter.assumptionId) return;
  const assumption = assumptions.find(row => row.id === parameter.assumptionId);
  check(assumption?.status === 'selected', 'Une contribution bio référence une hypothèse non sélectionnée.');
  const expectedOrigin = parameter.origin === 'observed' ? 'observation'
    : parameter.origin === 'calculated' ? 'calculation' : parameter.origin;
  check(assumption.origin === expectedOrigin, 'L’origine de l’hypothèse biologique ne correspond pas au paramètre calculé.');
  check(assumption.unit === undefined || assumption.unit === parameter.unit, 'L’unité de l’hypothèse biologique ne correspond pas au paramètre calculé.');
  if ('basis' in parameter) check(assumption.basis === undefined || assumption.basis === parameter.basis, 'La base biologique de l’hypothèse ne correspond pas au paramètre calculé.');
  else check(assumption.basis === undefined, 'Une base chimique ne peut pas être attachée à un facteur sans base déclarée.');
  if (assumption.range !== undefined) {
    check(assumption.range.min === parameter.range.min && assumption.range.max === parameter.range.max,
      'La plage de l’hypothèse biologique diffère de la plage utilisée par le calcul.');
  } else if (parameter.range.min !== parameter.range.max) {
    check(false, 'Une plage biologique non ponctuelle exige la même plage dans l’hypothèse sélectionnée.');
  }
  if ('value' in parameter && parameter.value !== undefined) {
    check(assumption.value === parameter.value, 'La valeur biologique rapportée diffère de l’hypothèse sélectionnée.');
  } else if (assumption.value !== undefined) {
    const selectedPoint = parameter.central ?? (parameter.range.min === parameter.range.max ? parameter.range.min : undefined);
    check(typeof assumption.value === 'number' && selectedPoint === assumption.value,
      'La valeur scalaire de l’hypothèse biologique ne correspond pas au point calculé.');
  }
  if (assumption.central !== undefined) check(parameter.central === assumption.central, 'Le central de l’hypothèse biologique diffère du central utilisé.');
  else if (parameter.central !== undefined && assumption.value !== parameter.central) {
    check(false, 'Un central biologique utilisé doit être lié à l’hypothèse sélectionnée.');
  }
  if (assumption.source !== undefined) check(parameter.sourceRefs.some(source => sameJson(source, assumption.source)),
    'La source de l’hypothèse biologique n’est pas conservée dans le paramètre.');
}

function assertBiologicalSelections(
  inputs: BrewingScenarioBiologicalInput[],
  assumptions: BrewingScenarioAssumption[],
  validateBindings = true,
): void {
  const selected = new Set(assumptions.filter(row => row.status === 'selected').map(row => row.id));
  const requireSelection = (parameter: BrewingScenarioBiologicalAmount | BrewingScenarioFactor) => {
    const id = parameter.assumptionId;
    if (['userHypothesis', 'assistantHypothesis', 'modelHypothesis', 'analogy'].includes(parameter.origin)) {
      check(id !== undefined && selected.has(id), 'Une contribution bio hypothétique/proxy ne peut calculer qu’après sélection explicite de son paramètre.');
    }
    if (id !== undefined) {
      check(selected.has(id), 'Une contribution bio référence une hypothèse non sélectionnée.');
      if (validateBindings) assertBiologicalParameterBinding(parameter, assumptions);
    }
  };
  for (const contribution of inputs) {
    if (contribution.kind === 'yeastOwnProducts') requireSelection(contribution.amount);
    else if (contribution.kind === 'hopPrecursorTransformation') {
      requireSelection(contribution.precursor);
      requireSelection(contribution.conversionFraction);
      if (contribution.conversionRatio) requireSelection(contribution.conversionRatio);
    } else {
      requireSelection(contribution.sourceAmount);
      requireSelection(contribution.extractionFraction);
      requireSelection(contribution.retentionFraction);
    }
  }
}

export function hopRecipeScenarioInputReference(input: HopRecipeInput): string {
  assertHopRecipeInput(input);
  return hopAdviceContentReference('brewing-scenario-hop-input-v1', input);
}

export function buildBrewingScenarioRequest(input: {
  scenarioId: string;
  revision: number;
  baseline:
    | { kind: 'recipe'; recipeReference: string; input: HopRecipeInput; program?: HopDecisionProgram | null; contextReference: string }
    | { kind: 'hypothetical'; label: string; input: HopRecipeInput; program?: HopDecisionProgram | null; materials?: BrewingScenarioMaterialInputs; culture?: BrewingScenarioCultureContext; beerContext?: BrewingScenarioBeerContext; biologicalContext?: HopBiotransformationInput };
  target?: Record<string, HopRange>;
  assumptions?: BrewingScenarioAssumption[];
}): BrewingScenarioRequest {
  assertHopRecipeInput(input.baseline.input);
  const baseline: BrewingScenarioBaseline = input.baseline.kind === 'recipe'
    ? { kind: 'recipe', recipeReference: input.baseline.recipeReference, inputReference: hopRecipeScenarioInputReference(input.baseline.input),
      ...(input.baseline.program ? { programReference: programFingerprint(input.baseline.program) } : {}),
      contextReference: input.baseline.contextReference }
    : { kind: 'hypothetical', label: input.baseline.label, input: structuredClone(input.baseline.input),
      ...(input.baseline.program !== undefined ? { program: structuredClone(input.baseline.program) } : {}),
      ...(input.baseline.materials ? { materials: structuredClone(input.baseline.materials) } : {}),
      ...(input.baseline.culture ? { culture: structuredClone(input.baseline.culture) } : {}),
      ...(input.baseline.beerContext ? { beerContext: structuredClone(input.baseline.beerContext) } : {}),
      ...(input.baseline.biologicalContext ? { biologicalContext: structuredClone(input.baseline.biologicalContext) } : {}) };
  const request: BrewingScenarioRequest = {
    version: BREWING_SCENARIO_VERSION, scenarioId: input.scenarioId, revision: input.revision, baseline,
    ...(input.target ? { target: structuredClone(input.target) } : {}), assumptions: structuredClone(input.assumptions ?? []), branches: [],
  };
  assertBrewingScenarioRequest(request);
  return request;
}

function scenarioSource(assumption: BrewingScenarioAssumption, scenarioId: string, branchId: string): HopSource {
  return {
    title: `Hypothèse de scénario · ${assumption.label}`,
    author: assumption.origin === 'userHypothesis' ? 'Entrée explicite du scénario'
      : assumption.origin === 'assistantHypothesis' ? 'Hypothèse proposée par l’assistant et sélectionnée'
        : assumption.origin === 'modelHypothesis' ? 'Hypothèse proposée depuis un modèle et sélectionnée' : 'Hypothèse de scénario',
    year: null,
    kind: 'judgment',
    reference: `brewing-scenario-hypothesis-v1:${encodeURIComponent(scenarioId)}:${encodeURIComponent(branchId)}:${encodeURIComponent(assumption.id)}`,
    locator: assumption.explanation,
  };
}

function multiplyRanges(...ranges: HopRange[]): HopRange {
  return { min: ranges.reduce((result, row) => result * row.min, 1), max: ranges.reduce((result, row) => result * row.max, 1) };
}

function amountCentral(amount: BrewingScenarioBiologicalAmount): number | undefined {
  return amount.central ?? amount.value ?? (amount.range.min === amount.range.max ? amount.range.min : undefined);
}

function factorCentral(factor: BrewingScenarioFactor): number | undefined {
  return factor.central ?? (factor.range.min === factor.range.max ? factor.range.min : undefined);
}

function derivedOrigin(origins: Array<BrewingScenarioBiologicalAmount['origin'] | BrewingScenarioFactor['origin']>): BrewingScenarioBiologicalAmount['origin'] {
  if (origins.includes('analogy')) return 'analogy';
  if (origins.includes('assistantHypothesis')) return 'assistantHypothesis';
  if (origins.includes('modelHypothesis')) return 'modelHypothesis';
  if (origins.includes('userHypothesis')) return 'userHypothesis';
  if (origins.includes('observed') || origins.includes('observation')) return 'calculated';
  return 'calculated';
}

function projectBiologicalInput(input: BrewingScenarioBiologicalInput): BrewingScenarioBiologicalContribution {
  if (input.kind === 'yeastOwnProducts') {
    const status: BrewingScenarioBiologicalContribution['status'] = input.amount.origin === 'observed' ? 'observed'
      : input.amount.origin === 'analogy' ? 'conditional' : 'estimated';
    return { id: input.id, kind: input.kind, status, value: structuredClone(input.amount), assumptionIds: input.amount.assumptionId ? [input.amount.assumptionId] : [],
      conditions: [...input.conditions], limitations: [...input.limitations,
        'Contribution propre conservée comme sortie distincte; elle n’est pas additionnée aux axes d’arôme du houblon.'] };
  }
  if (input.kind === 'hopPrecursorTransformation') {
    const ratio = input.conversionRatio;
    if (!ratio || ratio.range.min < 0 || ratio.fromAnalyte !== input.precursor.analyte || ratio.toAnalyte !== input.productAnalyte
      || ratio.fromUnit !== input.precursor.unit || ratio.toUnit !== input.productUnit) {
      return { id: input.id, kind: input.kind, status: 'unknown', value: null,
        assumptionIds: [input.conversionFraction.id, ...(ratio ? [ratio.id] : [])], conditions: [...input.conditions],
        limitations: [...input.limitations, 'Précurseur et produit diffèrent : une conversion d’unité/rapport molaire explicite entre analytes compatibles manque.'] };
    }
    const range = multiplyRanges(input.precursor.range, input.conversionFraction.range, ratio.range);
    if (!validHopRange(range)) return { id: input.id, kind: input.kind, status: 'unknown', value: null,
      assumptionIds: [input.precursor.assumptionId, input.conversionFraction.assumptionId, ratio.assumptionId].filter((id): id is string => !!id),
      conditions: [...input.conditions], limitations: [...input.limitations, 'Produit numérique hors domaine fini; vérifier les unités ou plages d’entrée.'] };
    const centralInputs = [amountCentral(input.precursor), factorCentral(input.conversionFraction), factorCentral(ratio)];
    const central = centralInputs.every((value): value is number => value !== undefined)
      ? centralInputs.reduce((value, factor) => value * factor, 1) : undefined;
    const sourceRefs = [...input.precursor.sourceRefs, ...input.conversionFraction.sourceRefs, ...ratio.sourceRefs];
    const origin = derivedOrigin([input.precursor.origin, input.conversionFraction.origin, ratio.origin]);
    return { id: input.id, kind: input.kind, status: origin === 'analogy' ? 'conditional' : 'estimated',
      value: { analyte: input.productAnalyte, unit: input.productUnit, basis: input.productBasis,
        range, ...(range.min === range.max ? { value: range.min } : {}), ...(central !== undefined ? { central } : {}),
        ...(input.productMatrixId ? { matrixId: input.productMatrixId } : {}), ...(input.productTimepoint ? { timepoint: input.productTimepoint } : {}),
        origin, sourceRefs },
      assumptionIds: [input.precursor.assumptionId, input.conversionFraction.assumptionId, ratio.assumptionId].filter((id): id is string => !!id), conditions: [...input.conditions],
      limitations: [...input.limitations, 'Projection arithmétique sous les fractions et le rapport analyte/unité explicitement fournis; aucune conversion universelle ni intensité sensorielle n’est inférée.'] };
  }
  if (input.sourceAmount.basis.toLocaleLowerCase('fr').includes('beer') || input.sourceAmount.basis.toLocaleLowerCase('fr').includes('bière')) {
    return { id: input.id, kind: input.kind, status: 'unknown', value: null,
      assumptionIds: [input.sourceAmount.assumptionId, input.extractionFraction.assumptionId, input.retentionFraction.assumptionId].filter((id): id is string => !!id), conditions: [...input.conditions],
      limitations: [...input.limitations, 'La quantité fournie est déjà sur une base bière; appliquer extraction/rétention risquerait de compter deux fois le transfert.'] };
  }
  const range = multiplyRanges(input.sourceAmount.range, input.extractionFraction.range, input.retentionFraction.range);
  if (!validHopRange(range)) return { id: input.id, kind: input.kind, status: 'unknown', value: null,
    assumptionIds: [input.sourceAmount.assumptionId, input.extractionFraction.assumptionId, input.retentionFraction.assumptionId].filter((id): id is string => !!id),
    conditions: [...input.conditions], limitations: [...input.limitations, 'Produit numérique hors domaine fini; vérifier les unités ou plages d’entrée.'] };
  const centralInputs = [amountCentral(input.sourceAmount), factorCentral(input.extractionFraction), factorCentral(input.retentionFraction)];
  const central = centralInputs.every((value): value is number => value !== undefined)
    ? centralInputs.reduce((value, factor) => value * factor, 1) : undefined;
  const factors = [input.sourceAmount.origin, input.extractionFraction.origin, input.retentionFraction.origin];
  const origin = derivedOrigin(factors);
  const { assumptionId: _sourceAssumptionId, value: _sourceValue, central: _sourceCentral, ...sourceQuantity } = input.sourceAmount;
  return { id: input.id, kind: input.kind, status: origin === 'analogy' ? 'conditional' : 'estimated',
    value: { ...structuredClone(sourceQuantity), range, ...(range.min === range.max ? { value: range.min } : {}),
      ...(central !== undefined ? { central } : {}), basis: `scenario-transfer:${input.targetMatrixId}:${input.targetTimepoint}`,
      matrixId: input.targetMatrixId, timepoint: input.targetTimepoint, origin,
      sourceRefs: [...input.sourceAmount.sourceRefs, ...input.extractionFraction.sourceRefs, ...input.retentionFraction.sourceRefs] },
    assumptionIds: [input.sourceAmount.assumptionId, input.extractionFraction.assumptionId, input.retentionFraction.assumptionId].filter((id): id is string => !!id), conditions: [...input.conditions],
    limitations: [...input.limitations, 'Projection d’une quantité déjà exprimée dans son unité, sous fractions d’extraction et rétention explicitement fournies; aucun rendement ni intensité universels.'] };
}

function applyInputOverrides(input: HopRecipeInput, overrides?: BrewingScenarioInputOverrides): HopRecipeInput {
  if (!overrides) return structuredClone(input);
  const next: HopRecipeInput = structuredClone(input);
  if (overrides.volumeL !== undefined) next.volumeL = overrides.volumeL;
  if (overrides.yeastId !== undefined) {
    next.yeastId = overrides.yeastId;
    next.additions = next.additions.map(addition => ({ ...addition, triplet: { ...addition.triplet, yeastId: overrides.yeastId! } }));
  }
  if (overrides.pitchTempC !== undefined) next.pitchTempC = overrides.pitchTempC;
  if (overrides.yeastTemperature !== undefined) next.yeastTemperature = structuredClone(overrides.yeastTemperature);
  if (overrides.fermentation !== undefined) next.fermentation = structuredClone(overrides.fermentation);
  if (overrides.aromaDomain !== undefined) next.aromaDomain = overrides.aromaDomain;
  if (overrides.aromaContext !== undefined) next.aromaContext = structuredClone(overrides.aromaContext);
  for (const row of overrides.additions ?? []) {
    const index = next.additions.findIndex(addition => addition.id === row.additionId);
    check(index >= 0, `Ajout de scénario introuvable : ${row.additionId}.`);
    next.additions[index] = { ...next.additions[index], triplet: { ...next.additions[index].triplet, ...structuredClone(row.triplet), yeastId: next.yeastId } };
  }
  assertHopRecipeInput(next);
  return next;
}

function sameJson(left: unknown, right: unknown): boolean {
  return hopAdviceContentReference('brewing-scenario-compare-v1', left) === hopAdviceContentReference('brewing-scenario-compare-v1', right);
}

function assertAlignedInput(input: HopRecipeInput, program: HopDecisionProgram, materials: HopDecisionMaterial[]): void {
  check(input.volumeL === (program.volumeL ?? 0), 'Le volume du modèle ne correspond pas au programme courant.');
  check(input.additions.length === program.additions.length, 'Le nombre d’ajouts du modèle ne correspond pas au programme courant.');
  const materialById = new Map(materials.map(material => [material.id, material]));
  for (const addition of program.additions) {
    const modeled = input.additions.find(row => row.id === addition.id);
    check(modeled, `Ajout ${addition.id} absent de l’entrée de simulation.`);
    check(modeled.triplet.timing === addition.use, `Le timing modèle de ${addition.id} ne correspond pas au programme.`);
    check(modeled.triplet.yeastId === input.yeastId, `La levure modèle de ${addition.id} diffère de la levure commune.`);
    const material = materialById.get(addition.materialId);
    if (material?.variety && modeled.triplet.varietyId !== null) check(modeled.triplet.varietyId === material.variety.id, `La variété de ${addition.id} ne correspond pas à sa matière.`);
    if (material?.lot && modeled.triplet.lotId !== null && modeled.triplet.lotId !== undefined) check(modeled.triplet.lotId === material.lot.id, `Le lot de ${addition.id} ne correspond pas à sa matière.`);
    if (program.volumeL !== null && program.volumeL > 0 && addition.grams !== null) {
      const expectedDose = addition.grams / program.volumeL;
      check(modeled.triplet.doseGL !== null && Math.abs(modeled.triplet.doseGL - expectedDose) <= Math.max(1e-9, Math.abs(expectedDose) * 1e-9),
        `La dose g/L de ${addition.id} ne correspond pas à masse/volume du programme.`);
    } else if (addition.grams === null) check(modeled.triplet.doseGL === null, `Une masse inconnue de ${addition.id} ne peut pas porter une dose g/L non justifiée.`);
    if (addition.use === 'boil' && addition.boilMinutes !== null && addition.boilMinutes !== undefined) {
      check(modeled.triplet.contactHours === null || Math.abs(modeled.triplet.contactHours - addition.boilMinutes / 60) <= 1e-9,
        `Le contact d’ébullition de ${addition.id} ne correspond pas au programme.`);
    }
  }
}

function sharedMatrixId(input: HopRecipeInput): string | null {
  const ids = [...new Set(input.additions.map(row => row.triplet.matrixId).filter((id): id is string => !!id))];
  return ids.length === 1 ? ids[0] : null;
}

function inputFromProgram(
  baseInput: HopRecipeInput,
  before: HopDecisionProgram,
  program: HopDecisionProgram,
  materials: HopDecisionMaterial[],
): HopRecipeInput {
  const byMaterial = new Map(materials.map(material => [material.id, material]));
  const beforeAdditions = new Map(before.additions.map(addition => [addition.id, addition]));
  const oldInput = new Map(baseInput.additions.map(addition => [addition.id, addition]));
  const commonMatrix = sharedMatrixId(baseInput);
  const additions = program.additions.map(addition => {
    const previousProgram = beforeAdditions.get(addition.id);
    const previousInput = oldInput.get(addition.id);
    const unchangedLine = !!previousProgram && sameJson(previousProgram, addition);
    const material = byMaterial.get(addition.materialId);
    const varietyId = material?.variety?.id ?? (unchangedLine ? previousInput?.triplet.varietyId : null) ?? null;
    const lotId = material?.lot?.id ?? (unchangedLine ? previousInput?.triplet.lotId : null) ?? null;
    const doseGL = addition.grams === null || program.volumeL === null || program.volumeL <= 0 ? null : addition.grams / program.volumeL;
    const contactHours = addition.use === 'boil' && addition.boilMinutes != null
      ? addition.boilMinutes / 60 : addition.contactHours ?? (unchangedLine ? previousInput?.triplet.contactHours ?? null : null);
    const temperatureC = addition.temperatureC ?? (unchangedLine ? previousInput?.triplet.temperatureC ?? null : null);
    return {
      id: addition.id,
      name: material?.name ?? (unchangedLine ? previousInput?.name : undefined) ?? addition.materialId,
      ...(unchangedLine && previousInput?.dayOffset !== undefined ? { dayOffset: previousInput.dayOffset } : addition.dayOffset !== undefined ? { dayOffset: addition.dayOffset } : {}),
      triplet: { varietyId, lotId, yeastId: baseInput.yeastId, timing: addition.use,
        doseGL, temperatureC, contactHours, matrixId: unchangedLine ? previousInput?.triplet.matrixId ?? commonMatrix : commonMatrix },
    };
  });
  const result: HopRecipeInput = { ...structuredClone(baseInput), volumeL: program.volumeL ?? 0, additions };
  assertHopRecipeInput(result);
  assertAlignedInput(result, program, materials);
  return result;
}

function assertRuntime(runtime: BrewingScenarioRuntime): void {
  check(isRow(runtime) && isRow(runtime.engineData) && Array.isArray(runtime.engineData.varieties)
    && Array.isArray(runtime.engineData.lots) && Array.isArray(runtime.engineData.knowledge), 'Données serveur du moteur absentes.');
  check(Array.isArray(runtime.materials) && new Set(runtime.materials.map(material => material.id)).size === runtime.materials.length, 'Identités de matériaux runtime invalides.');
  if (runtime.current) {
    check(isText(runtime.current.recipeReference) && isText(runtime.current.inputReference), 'Références de recette runtime absentes.');
    check(runtime.current.stockAvailabilityReference === undefined || isText(runtime.current.stockAvailabilityReference), 'Référence de disponibilité runtime invalide.');
    assertHopRecipeInput(runtime.current.input);
    check(runtime.current.inputReference === hopRecipeScenarioInputReference(runtime.current.input), 'L’entrée runtime ne correspond pas à sa référence.');
    if (runtime.current.program) {
      programFingerprint(runtime.current.program);
      assertAlignedInput(runtime.current.input, runtime.current.program, runtime.materials);
    }
    check(runtime.current.performedAdditionIds === undefined || uniqueText(runtime.current.performedAdditionIds), 'IDs d’ajouts effectués runtime invalides.');
    check(runtime.current.limitations === undefined || Array.isArray(runtime.current.limitations) && runtime.current.limitations.every(isText), 'Limites runtime invalides.');
    if (runtime.current.culture !== undefined) assertCulture(runtime.current.culture);
    if (runtime.current.beerContext !== undefined) assertBeerContext(runtime.current.beerContext);
  }
  if (runtime.biologicalContext !== undefined) assertBiotransformationInput(runtime.biologicalContext);
  if (runtime.beerContext !== undefined) assertBeerContext(runtime.beerContext);
}

function mergeMaterials(base: HopDecisionMaterial[], extra?: BrewingScenarioMaterialInputs): HopDecisionMaterial[] {
  const result = structuredClone(base), ids = new Set(result.map(material => material.id));
  for (const material of extra?.hops ?? []) {
    assertScenarioMaterial(material);
    const existing = result.find(row => row.id === material.id);
    if (existing) {
      check(sameJson(existing, material), `Une matière de scénario ne peut pas remplacer une identité runtime : ${material.id}.`);
      continue;
    }
    ids.add(material.id); result.push(structuredClone(material));
  }
  return result;
}

function combineScenarioMaterials(...sets: Array<BrewingScenarioMaterialInputs | undefined>): BrewingScenarioMaterialInputs | undefined {
  const hops = new Map<string, HopDecisionMaterial>(), yeasts = new Map<string, HopYeast>();
  for (const set of sets) {
    for (const material of set?.hops ?? []) {
      const previous = hops.get(material.id);
      check(!previous || sameJson(previous, material), `Entrées de scénario contradictoires pour la matière ${material.id}.`);
      hops.set(material.id, structuredClone(material));
    }
    for (const yeast of set?.yeasts ?? []) {
      const previous = yeasts.get(yeast.id);
      check(!previous || sameJson(previous, yeast), `Entrées de scénario contradictoires pour la levure ${yeast.id}.`);
      yeasts.set(yeast.id, structuredClone(yeast));
    }
  }
  if (!hops.size && !yeasts.size) return undefined;
  return { ...(hops.size ? { hops: [...hops.values()] } : {}), ...(yeasts.size ? { yeasts: [...yeasts.values()] } : {}) };
}

function mergeEngineData(base: HopEngineData, materials: HopDecisionMaterial[], extra?: BrewingScenarioMaterialInputs): HopEngineData {
  const data: HopEngineData = structuredClone(base);
  const varietyIds = new Set(data.varieties.map(variety => variety.id));
  for (const material of extra?.hops ?? []) {
    if (material.variety) {
      const existing = data.varieties.find(row => row.id === material.variety!.id);
      if (existing) check(sameJson(existing, material.variety), `Une variété de scénario ne peut pas remplacer une identité runtime : ${material.variety.id}.`);
      else { assertHopDocument('hopVarieties', material.variety); varietyIds.add(material.variety.id); data.varieties.push(structuredClone(material.variety)); }
    } else {
      // Explicitly scenario-local identity with no analysis/descriptors; it can use only generic extrapolation.
      const varietyId = material.id;
      check(!varietyIds.has(varietyId), `Une identité de scénario ne peut pas remplacer une variété runtime : ${varietyId}.`);
      const variety = { id: varietyId, name: material.name, aliases: [], form: material.form, descriptions: [], analysis: [] };
      assertHopDocument('hopVarieties', variety); varietyIds.add(varietyId); data.varieties.push(variety);
    }
    if (material.lot) {
      const existing = data.lots.find(row => row.id === material.lot!.id);
      if (existing) check(sameJson(existing, material.lot), `Un lot de scénario ne peut pas remplacer une identité runtime : ${material.lot.id}.`);
      else { assertHopDocument('hopLots', material.lot); data.lots.push(structuredClone(material.lot)); }
    }
  }
  for (const yeast of extra?.yeasts ?? []) {
    assertScenarioYeast(yeast);
    const existing = data.knowledge.find(row => row.id === yeast.id);
    if (existing) check(sameJson(existing, yeast), `Une levure de scénario ne peut pas remplacer une identité runtime : ${yeast.id}.`);
    else data.knowledge.push(structuredClone(yeast));
  }
  return data;
}

interface ScenarioModelProjection {
  engineData: HopEngineData;
  bases: HopExtrapolation[];
  instances: HopExtrapolation[];
  assumptionUses: ScenarioModelAssumptionUse[];
  hiddenCentral: boolean;
  limitations: string[];
}

type ScenarioModelAssumptionUse = {
  scenarioModelId: string;
  assumptionId: string;
  effect: { kind: 'parameter'; parameter: BrewingScenarioModelParameter }
    | { kind: 'yeastAnalogy'; targetYeastId: string };
};

function scenarioParameter(
  current: HopExperimentalParameter,
  assumption: BrewingScenarioAssumption,
  source: HopSource,
): HopExperimentalParameter {
  const range = assumption.range ? structuredClone(assumption.range)
    : isFinite(assumption.value) ? { min: assumption.value, max: assumption.value } : null;
  check(range && validHopRange(range) && range.min >= 0, `Plage de l’hypothèse ${assumption.id} invalide pour le modèle.`);
  const explicitCentral = assumption.central ?? (assumption.range === undefined && isFinite(assumption.value) ? assumption.value : undefined);
  const central = explicitCentral ?? (current.central >= range.min && current.central <= range.max ? current.central : undefined);
  check(central !== undefined, `L’hypothèse ${assumption.id} ne contient pas le centre du modèle; saisir un central explicite, aucun milieu n’est choisi.`);
  return { range, central, source };
}

function defaultYeastProfile(model: HopExtrapolation, yeastId: string, source: HopSource, explanation: string) {
  return {
    yeastId, source, evidence: [source],
    aroma: Object.fromEntries(model.axes.map(axis => [axis.id, structuredClone(model.defaultYeast.aroma)])),
    expression: Object.fromEntries(model.axes.map(axis => [axis.id, structuredClone(model.defaultYeast.expression)])),
    otherAroma: structuredClone(model.defaultYeast.aroma), otherExpression: structuredClone(model.defaultYeast.expression),
    notes: [`Profil de levure hypothétique propre au scénario : ${explanation}`, 'Ce profil de saillance ne représente pas une concentration chimique ni un taux de conversion.'],
  };
}

function setScenarioModelParameter(
  model: HopExtrapolation,
  parameter: BrewingScenarioModelParameter,
  assumption: BrewingScenarioAssumption,
  source: HopSource,
): void {
  const valueAt = (current: HopExperimentalParameter) => scenarioParameter(current, assumption, source);
  if (parameter.kind === 'matrix') { model.matrix = valueAt(model.matrix); return; }
  if (parameter.kind === 'gain') { model.gain = valueAt(model.gain); return; }
  if (parameter.kind === 'defaultYeastAroma') { model.defaultYeast.aroma = valueAt(model.defaultYeast.aroma); return; }
  if (parameter.kind === 'defaultYeastExpression') { model.defaultYeast.expression = valueAt(model.defaultYeast.expression); return; }
  if (parameter.kind === 'axisDoseScale') {
    const axis = model.axes.find(row => row.id === parameter.axisId);
    check(axis, `Axe modèle introuvable pour l’hypothèse ${assumption.id}.`);
    axis.doseScale = valueAt(axis.doseScale); return;
  }
  if (parameter.kind === 'timing') {
    const timing = model.timings[parameter.timing];
    if (parameter.parameter === 'decayHours') {
      check(timing.decayHours !== null, `Le modèle ne définit pas une décroissance pour ${parameter.timing}; aucune courbe n’est inventée.`);
      timing.decayHours = valueAt(timing.decayHours);
    } else timing[parameter.parameter] = valueAt(timing[parameter.parameter]);
    return;
  }
  let profile = model.yeasts.find(row => row.yeastId === parameter.yeastId);
  if (!profile) {
    profile = defaultYeastProfile(model, parameter.yeastId, source, assumption.explanation);
    model.yeasts.push(profile);
  }
  const axisProfile = profile[parameter.parameter];
  const existing = axisProfile[parameter.axisId];
  if (existing === undefined) throw Error(`Axe ${parameter.axisId} absent du profil de levure du modèle.`);
  axisProfile[parameter.axisId] = valueAt(existing);
  profile.evidence = [...new Map([...profile.evidence, source].map(item => [JSON.stringify(item), item])).values()];
  profile.notes = [...new Set([...profile.notes, `Hypothèse sélectionnée pour ${parameter.yeastId}/${parameter.axisId} : ${assumption.explanation}`])];
}

function applyScenarioModelInputs(
  sourceData: HopEngineData,
  branch: BrewingScenarioBranchRequest,
  assumptions: BrewingScenarioAssumption[],
  scenarioId: string,
): ScenarioModelProjection {
  const overrides = branch.modelOverrides ?? [];
  const yeastAnalogies = (branch.analogies ?? []).filter((row): row is Extract<BrewingScenarioAnalogy, { kind: 'yeastProfile' }> => row.kind === 'yeastProfile');
  const targetModelIds = new Set(overrides.map(row => row.modelId));
  if (yeastAnalogies.length) for (const model of sourceData.knowledge) {
    if (model.kind !== 'extrapolation' || !model.enabled) continue;
    if (yeastAnalogies.some(analogy => model.yeasts.some(profile => profile.yeastId === analogy.referenceYeastId))) targetModelIds.add(model.id);
  }
  const baseModels = [...targetModelIds].map(id => {
    const model = sourceData.knowledge.find(row => row.id === id && row.kind === 'extrapolation');
    check(model?.kind === 'extrapolation' && model.enabled, `Modèle d’extrapolation activé introuvable : ${id}.`);
    return structuredClone(model);
  });
  if (!baseModels.length) return { engineData: structuredClone(sourceData), bases: [], instances: [], assumptionUses: [], hiddenCentral: false, limitations: [] };

  const engineData = structuredClone(sourceData);
  const bases: HopExtrapolation[] = [], instances: HopExtrapolation[] = [];
  const assumptionUses: ScenarioModelAssumptionUse[] = [];
  let hiddenCentral = false;
  const limitations: string[] = [];
  for (const base of baseModels) {
    const modelOverrides = overrides.filter(row => row.modelId === base.id);
    const applicableYeastAnalogies = yeastAnalogies.filter(row => base.yeasts.some(profile => profile.yeastId === row.referenceYeastId));
    const sourceEvidence: HopSource[] = [];
    const usesForInstance: Array<Omit<ScenarioModelAssumptionUse, 'scenarioModelId'>> = [];
    const clone = structuredClone(base);
    for (const row of modelOverrides) {
      const parameter = row.parameter;
      const assumption = assumptions.find(item => item.id === row.assumptionId)!;
      const source = scenarioSource(assumption, scenarioId, branch.id);
      const oldParameter = parameter.kind === 'matrix' ? base.matrix
        : parameter.kind === 'gain' ? base.gain
          : parameter.kind === 'defaultYeastAroma' ? base.defaultYeast.aroma
            : parameter.kind === 'defaultYeastExpression' ? base.defaultYeast.expression
              : parameter.kind === 'axisDoseScale' ? base.axes.find(axis => axis.id === parameter.axisId)?.doseScale
                : parameter.kind === 'timing' ? base.timings[parameter.timing][parameter.parameter]
                  : base.yeasts.find(profile => profile.yeastId === parameter.yeastId)?.[parameter.parameter][parameter.axisId];
      if (parameter.kind === 'yeastProfile' && !oldParameter) {
        const axisExists = base.axes.some(axis => axis.id === parameter.axisId);
        check(axisExists, `Axe absent du modèle : ${parameter.axisId}.`);
        const defaults = parameter.parameter === 'aroma' ? base.defaultYeast.aroma : base.defaultYeast.expression;
        const newValue = scenarioParameter(defaults, assumption, source);
        const existingProfile = clone.yeasts.find(profile => profile.yeastId === parameter.yeastId);
        const profile = existingProfile ?? defaultYeastProfile(clone, parameter.yeastId, defaults.source, assumption.explanation);
        if (!existingProfile) clone.yeasts.push(profile);
        profile[parameter.parameter][parameter.axisId] = newValue;
        profile.evidence = [...new Map([...profile.evidence, source, ...(assumption.source ? [assumption.source] : [])].map(item => [JSON.stringify(item), item])).values()];
        profile.notes = [...new Set([...profile.notes, `Hypothèse sélectionnée : ${assumption.explanation}`])];
      } else {
        check(oldParameter, `Paramètre absent du modèle ${base.id}.`);
        setScenarioModelParameter(clone, parameter, assumption, source);
      }
      sourceEvidence.push(source, ...(assumption.source ? [assumption.source] : []), ...(oldParameter ? [oldParameter.source] : []));
      usesForInstance.push({ assumptionId: assumption.id, effect: { kind: 'parameter', parameter: structuredClone(parameter) } });
      if (assumption.range && assumption.central === undefined && !isFinite(assumption.value)) hiddenCentral = true;
    }
    for (const analogy of applicableYeastAnalogies) {
      const assumption = assumptions.find(item => item.id === analogy.assumptionId)!;
      const existingTarget = clone.yeasts.find(profile => profile.yeastId === analogy.targetYeastId);
      if (existingTarget) {
        limitations.push(`Analogie de levure ${analogy.targetYeastId} non utilisée pour ${base.id} : un profil explicite est déjà disponible.`);
        continue;
      }
      const reference = base.yeasts.find(profile => profile.yeastId === analogy.referenceYeastId);
      if (!reference) continue;
      const source = scenarioSource(assumption, scenarioId, branch.id);
      const analogicalProfile = { ...structuredClone(reference), yeastId: analogy.targetYeastId,
        aroma: Object.fromEntries(Object.entries(reference.aroma).map(([id, parameter]) => [id, { ...structuredClone(parameter), source }])),
        expression: Object.fromEntries(Object.entries(reference.expression).map(([id, parameter]) => [id, { ...structuredClone(parameter), source }])),
        otherAroma: { ...structuredClone(reference.otherAroma), source }, otherExpression: { ...structuredClone(reference.otherExpression), source },
        evidence: [...new Map([...reference.evidence, source, ...(assumption.source ? [assumption.source] : [])].map(item => [JSON.stringify(item), item])).values()],
        notes: [...new Set([...reference.notes, `Analogie choisie vers ${analogy.referenceYeastId} : ${analogy.explanation}; ce profil n’est pas une mesure de ${analogy.targetYeastId}.`])] };
      clone.yeasts.push(analogicalProfile);
      sourceEvidence.push(source, ...(assumption.source ? [assumption.source] : []), reference.source, ...reference.evidence);
      usesForInstance.push({ assumptionId: assumption.id, effect: { kind: 'yeastAnalogy', targetYeastId: analogy.targetYeastId } });
    }
    const digest = hopAdviceContentReference('brewing-scenario-model-instance-v1', { scenarioId, branchId: branch.id, baseId: base.id,
      overrides: modelOverrides, analogies: applicableYeastAnalogies, assumptions: assumptions.filter(item => [...modelOverrides.map(row => row.assumptionId), ...applicableYeastAnalogies.map(row => row.assumptionId)].includes(item.id)) });
    clone.id = `scenario-model-${digest.slice(-20)}`;
    clone.version = `${base.version}+scenario-${digest.slice(-12)}`;
    clone.evidence = [...new Map([...clone.evidence, ...sourceEvidence].map(item => [JSON.stringify(item), item])).values()];
    clone.limitations = [...new Set([...clone.limitations, 'Instance locale de scénario : seules les hypothèses choisies dans cette branche modifient ces paramètres; elle n’écrit pas le modèle de catalogue.'])];
    // This strict validator now permits only linked, non-dated scenario judgment
    // sources; leaf values stay attributed to their selected hypothesis.
    assertHopExtrapolation(clone);
    bases.push(base); instances.push(clone);
    for (const use of usesForInstance) assumptionUses.push({ ...use, scenarioModelId: clone.id });
    const index = engineData.knowledge.findIndex(row => row.id === base.id && row.kind === 'extrapolation');
    if (index >= 0) engineData.knowledge[index] = { ...base, enabled: false };
    engineData.knowledge.push(clone);
  }
  return { engineData, bases, instances, assumptionUses, hiddenCentral, limitations };
}

function applyHopDescriptionAnalogies(
  data: HopEngineData,
  analogies: BrewingScenarioAnalogy[],
  assumptions: BrewingScenarioAssumption[],
): { appliedIds: string[]; limitations: string[] } {
  const appliedIds: string[] = [], limitations: string[] = [];
  for (const analogy of analogies) {
    if (analogy.kind !== 'hopDescriptions') continue;
    const target = data.varieties.find(row => row.id === analogy.targetVarietyId);
    const reference = data.varieties.find(row => row.id === analogy.referenceVarietyId && !row.archived);
    const assumption = assumptions.find(row => row.id === analogy.assumptionId);
    check(target && reference && assumption?.status === 'selected', 'Référence de variété ou hypothèse d’analogie sélectionnée introuvable.');
    if (target.id === reference.id) throw Error('Une analogie doit relier deux identités distinctes.');
    const existing = new Set(target.descriptions.map(description => JSON.stringify(description)));
    const analogySource: HopSource = {
      title: `Descripteurs analogiques pour ${target.name}`,
      author: 'Projection de scénario sélectionnée; provenance originale conservée avec la variété de référence',
      year: null,
      kind: 'judgment',
      reference: `brewing-scenario:${assumption.id}`,
      locator: `${assumption.explanation}; variété de référence ${reference.id}`,
    };
    const transferred = reference.descriptions.filter(description => !existing.has(JSON.stringify(description))).map(description => ({
      ...structuredClone(description),
      source: structuredClone(analogySource),
    }));
    if (transferred.length) {
      target.descriptions.push(...transferred);
      appliedIds.push(assumption.id);
      limitations.push(`${target.name} : descripteurs repris localement à titre d’analogie depuis ${reference.name}; ils portent une provenance de jugement, tandis que le texte et sa provenance d’origine restent dans la variété de référence. Aucune analyse, identité variétale ou mesure sensorielle n’est transférée.`);
    } else limitations.push(`${target.name} : l’analogie vers ${reference.name} n’ajoute aucun descripteur non déjà présent.`);
  }
  return { appliedIds, limitations };
}

/** Reference for every runtime fact that can change a recipe-backed scenario's meaning. */
export function brewingScenarioCurrentReference(current: BrewingScenarioRuntimeCurrent): string {
  assertHopRecipeInput(current.input);
  return hopAdviceContentReference('brewing-scenario-current-v1', {
    recipeReference: current.recipeReference,
    inputReference: current.inputReference,
    ...(current.stockAvailabilityReference ? { stockAvailabilityReference: current.stockAvailabilityReference } : {}),
    program: current.program ?? null,
    performedAdditionIds: current.performedAdditionIds ?? [],
    limitations: current.limitations ?? [],
    biologicalContext: current.biologicalContext ?? null,
    culture: current.culture ?? null,
    beerContext: current.beerContext ?? null,
  });
}

export function brewingScenarioResultReference(value: BrewingScenarioResult | Omit<BrewingScenarioResult, 'reference'>): string {
  const { reference: _reference, ...body } = value as BrewingScenarioResult;
  return hopAdviceContentReference('brewing-scenario-result-v1', body);
}

function dependencySnapshotReference(value: BrewingScenarioDependencySnapshot): string {
  const { reference: _reference, ...body } = value;
  return hopAdviceContentReference('brewing-scenario-dependencies-v1', body);
}

function branchResultReference(value: BrewingScenarioBranchResult): string {
  const { reference: _reference, ...body } = value;
  return hopAdviceContentReference('brewing-scenario-branch-v1', body);
}

function predictionRefs(prediction: HopRecipePrediction): Array<{ id: string; version: string }> {
  return [...prediction.overall.modelRefs, ...prediction.additions.flatMap(row => row.modelRefs)];
}

function refsIncludeModel(refs: Array<{ id: string; version: string }>, model: HopExtrapolation): boolean {
  return refs.some(ref => ref.id === model.id && ref.version === model.version);
}

function scenarioModelAssumptionWasConsulted(
  use: ScenarioModelAssumptionUse,
  model: HopExtrapolation,
  predictions: HopRecipePrediction[],
  data: HopEngineData,
): boolean {
  const valid = usableHopKnowledge(data.knowledge).valid;
  const validYeastIds = new Set(valid.filter((row): row is HopYeast => row.kind === 'yeast').map(row => row.id));
  const validAxes = valid.filter((row): row is HopAxis => row.kind === 'axis');
  const modelAxisIds = new Set(model.axes.filter(definition => validAxes.some(axis => axis.id === definition.id && axis.version === definition.version)).map(row => row.id));
  type Context = { yeastId: string | null; axisIds: Set<string>; timings: Set<HopTriplet['timing']>;
    contactKnownTimings: Set<HopTriplet['timing']>; aggregate: boolean };
  const contexts: Context[] = [];
  for (const prediction of predictions) {
    if (prediction.input.aromaDomain === 'nolo') continue;
    const activeAdditions = prediction.input.additions.filter(addition => addition.triplet.doseGL !== 0);
    const aggregateHasUnknownTiming = activeAdditions.some(addition => !addition.triplet.timing);
    const aggregateUsed = model.aggregation?.version === 'hop-recipe-experimental-v1'
      && prediction.input.yeastId !== null && validYeastIds.has(prediction.input.yeastId)
      && refsIncludeModel(prediction.overall.modelRefs, model) && modelAxisIds.size > 0 && !aggregateHasUnknownTiming;
    if (aggregateUsed) contexts.push({ yeastId: prediction.input.yeastId, axisIds: new Set(modelAxisIds),
      timings: new Set(activeAdditions.map(addition => addition.triplet.timing)),
      contactKnownTimings: new Set(activeAdditions.filter(addition => isFinite(addition.triplet.contactHours) && addition.triplet.contactHours >= 0)
        .map(addition => addition.triplet.timing)), aggregate: true });
    for (let index = 0; index < prediction.additions.length; index++) {
      const output = prediction.additions[index];
      const axesUsed = (output.extrapolatedAxes ?? []).filter(axisId => modelAxisIds.has(axisId));
      if (!refsIncludeModel(output.modelRefs, model) || axesUsed.length === 0) continue;
      contexts.push({ yeastId: output.triplet.yeastId, axisIds: new Set(axesUsed),
        timings: new Set([output.triplet.timing]),
        contactKnownTimings: isFinite(output.triplet.contactHours) && output.triplet.contactHours >= 0
          ? new Set([output.triplet.timing]) : new Set(), aggregate: false });
    }
  }
  if (!contexts.length) return false;
  if (use.effect.kind === 'yeastAnalogy') {
    const targetYeastId = use.effect.targetYeastId;
    return contexts.some(context => context.yeastId === targetYeastId && context.axisIds.size > 0);
  }
  const parameter = use.effect.parameter;
  if (parameter.kind === 'yeastProfile') {
    return contexts.some(context => context.yeastId === parameter.yeastId && context.axisIds.has(parameter.axisId));
  }
  if (parameter.kind === 'axisDoseScale') {
    return contexts.some(context => context.axisIds.has(parameter.axisId)
      && (!context.aggregate || context.timings.size > 0));
  }
  if (parameter.kind === 'timing') {
    if (parameter.parameter === 'decayHours' || parameter.parameter === 'extractionHours') {
      const decayIsSelected = model.timings[parameter.timing].decayHours !== null;
      const parameterIsSelected = parameter.parameter === 'decayHours' ? decayIsSelected : !decayIsSelected;
      return parameterIsSelected && contexts.some(context => context.timings.has(parameter.timing)
        && context.contactKnownTimings.has(parameter.timing));
    }
    return contexts.some(context => context.timings.has(parameter.timing));
  }
  if (parameter.kind === 'defaultYeastAroma' || parameter.kind === 'defaultYeastExpression') {
    return contexts.some(context => !!context.yeastId && context.axisIds.size > 0
      && !model.yeasts.some(profile => profile.yeastId === context.yeastId));
  }
  return contexts.some(context => context.axisIds.size > 0);
}

/** Shared trace for derived projections; numerical equality is not an usage test. */
export function isBrewingScenarioModelParameterUsed(
  parameter: BrewingScenarioModelParameter,
  model: HopExtrapolation,
  predictions: HopRecipePrediction[],
  data: HopEngineData,
): boolean {
  return scenarioModelAssumptionWasConsulted({ assumptionId: 'parameter-usage', scenarioModelId: model.id,
    effect: { kind: 'parameter', parameter } }, model, predictions, data);
}

function allPredictions(branch: BrewingScenarioBranchResult): HopRecipePrediction[] {
  return [branch.hopPrediction, ...(branch.yeastBaselineModel ? [branch.yeastBaselineModel] : []),
    ...branch.cultureProjections.flatMap(row => [row.hopPrediction, ...(row.yeastBaselineModel ? [row.yeastBaselineModel] : [])])];
}

function captureDependencySnapshot(input: {
  data: HopEngineData;
  dataRevision?: string;
  input: HopRecipeInput;
  program?: HopDecisionProgram | null;
  materials: HopDecisionMaterial[];
  scenarioMaterials?: BrewingScenarioMaterialInputs;
  analogies?: BrewingScenarioAnalogy[];
  modelProjection: ScenarioModelProjection;
  predictions: HopRecipePrediction[];
  biologicalContext?: HopBiotransformationInput;
  beerContext?: BrewingScenarioBeerContext;
  target: Record<string, HopRange>;
}): BrewingScenarioDependencySnapshot {
  const { data, input: recipeInput, program, materials, scenarioMaterials, modelProjection, predictions } = input;
  const triplets = predictions.flatMap(prediction => prediction.input.additions.map(row => row.triplet));
  const varietyIds = new Set([
    ...triplets.map(row => row.varietyId).filter((id): id is string => !!id),
    ...(input.analogies ?? []).flatMap(row => row.kind === 'hopDescriptions' ? [row.targetVarietyId, row.referenceVarietyId] : []),
  ]);
  const lotIds = new Set(triplets.map(row => row.lotId).filter((id): id is string => !!id));
  const yeastIds = new Set(triplets.map(row => row.yeastId).filter((id): id is string => !!id));
  if (recipeInput.yeastId) yeastIds.add(recipeInput.yeastId);
  const modelRefMap = new Map<string, string>();
  for (const prediction of predictions) for (const ref of predictionRefs(prediction)) modelRefMap.set(`${ref.id}\u0000${ref.version}`, ref.version);
  const referencedModelIds = new Set([...modelRefMap.keys()].map(key => key.slice(0, key.indexOf('\u0000'))));
  const validKnowledge = usableHopKnowledge(data.knowledge).valid;
  const knowledge = validKnowledge.filter(row => {
    if (row.kind === 'axis' || row.kind === 'confidence' || row.kind === 'risk') return true;
    if (row.kind === 'yeast') return yeastIds.has(row.id);
    if (row.kind === 'fermentation') return yeastIds.has(row.yeastId);
    if (row.kind === 'styleGuide') return input.beerContext?.style?.guideId === row.id && input.beerContext.style.version === row.version;
    if (row.kind === 'model' || row.kind === 'extrapolation') return referencedModelIds.has(row.id);
    return false;
  });
  const usedMaterialIds = new Set(program?.additions.map(row => row.materialId) ?? []);
  const relevantMaterials = materials.filter(material => {
    if (usedMaterialIds.has(material.id)) return true;
    return !!material.variety && varietyIds.has(material.variety.id) || !!material.lot && lotIds.has(material.lot.id);
  });
  const scenarioModelIds = new Set(modelProjection.instances.filter(model => referencedModelIds.has(model.id)).map(model => model.id));
  const snapshot: BrewingScenarioDependencySnapshot = {
    version: BREWING_SCENARIO_DEPENDENCY_VERSION,
    reference: '',
    ...(input.dataRevision ? { dataRevision: input.dataRevision } : {}),
    engineData: {
      varieties: data.varieties.filter(row => varietyIds.has(row.id)).map(row => structuredClone(row)),
      lots: data.lots.filter(row => lotIds.has(row.id)).map(row => structuredClone(row)),
      knowledge: knowledge.map(row => structuredClone(row)),
    },
    decisionMaterials: relevantMaterials.map(row => structuredClone(row)),
    ...(program !== undefined ? { program: program ? structuredClone(program) : null } : {}),
    ...(input.biologicalContext ? { biologicalContext: structuredClone(input.biologicalContext) } : {}),
    ...(input.beerContext ? { beerContext: structuredClone(input.beerContext) } : {}),
    ...(scenarioMaterials ? { scenarioMaterials: structuredClone(scenarioMaterials) } : {}),
    scenarioModelBases: modelProjection.bases.filter(base => modelProjection.instances.some(instance => scenarioModelIds.has(instance.id) && instance.version.startsWith(`${base.version}+scenario-`))).map(row => structuredClone(row)),
    scenarioModelInstances: modelProjection.instances.filter(row => scenarioModelIds.has(row.id)).map(row => structuredClone(row)),
    knowledgeValidationErrors: usableHopKnowledge(data.knowledge).errors,
  };
  snapshot.reference = dependencySnapshotReference(snapshot);
  return snapshot;
}

function assertRecipeContextMatches(request: BrewingScenarioRequest, runtime: BrewingScenarioRuntime): void {
  if (request.baseline.kind !== 'recipe') return;
  const current = runtime.current;
  check(current, 'Le scénario référence une recette, mais aucun contexte courant n’est chargé.');
  check(request.baseline.recipeReference === current.recipeReference && request.baseline.inputReference === current.inputReference
    && current.inputReference === hopRecipeScenarioInputReference(current.input), 'La recette ou son entrée a changé depuis la préparation du scénario.');
  const expectedProgramReference = current.program ? programFingerprint(current.program) : undefined;
  check(request.baseline.programReference === expectedProgramReference, 'Le programme ou son état de liaison a changé depuis la préparation du scénario.');
  check(request.baseline.contextReference === brewingScenarioCurrentReference(current), 'Le journal, la culture, le contexte de bière ou les faits effectués ont changé depuis la préparation du scénario.');
}

function assertPerformedInputUntouched(
  beforeInput: HopRecipeInput,
  afterInput: HopRecipeInput,
  performedIds: string[],
  branch: BrewingScenarioBranchRequest,
  hasProgram: boolean,
): void {
  const byId = new Map(beforeInput.additions.map(row => [row.id, row]));
  const patchedIds = new Set((branch.inputOverrides?.additions ?? []).map(row => row.additionId));
  for (const id of performedIds) {
    check(!patchedIds.has(id), `L’ajout déjà effectué ${id} ne peut pas être modifié dans une branche de recette.`);
    const before = byId.get(id), after = afterInput.additions.find(row => row.id === id);
    check(before && after, `L’ajout effectué ${id} doit rester présent dans le scénario.`);
    if (!hasProgram) check(sameJson(before, after), `L’ajout effectué ${id} est figé, faute de programme courant à valider.`);
  }
}

function collectCultureProjections(
  input: HopRecipeInput,
  culture: BrewingScenarioCultureContext | undefined,
  target: Record<string, HopRange>,
  data: HopEngineData,
): { projections: BrewingScenarioCultureProjection[]; limitations: string[] } {
  if (!culture || culture.state === 'unknown') return { projections: [], limitations: culture?.state === 'unknown' ? ['La culture reste inconnue; aucune moyenne ou identité de souche n’est choisie.'] : [] };
  const projections: BrewingScenarioCultureProjection[] = [], limitations: string[] = [];
  for (const [index, member] of culture.members.entries()) {
    if (!member.yeastId) {
      limitations.push(`Membre ${member.name ?? index + 1} : identité de souche non résolue; aucune projection mono-souche.`);
      continue;
    }
    const memberInput: HopRecipeInput = {
      ...structuredClone(input), yeastId: member.yeastId,
      additions: input.additions.map(row => ({ ...structuredClone(row), triplet: { ...structuredClone(row.triplet), yeastId: member.yeastId! } })),
    };
    const hopPrediction = predictHopRecipe(memberInput, target, data);
    const yeastBaselineInput = { ...structuredClone(memberInput), additions: [] };
    const yeastBaselineModel = predictHopRecipe(yeastBaselineInput, target, data);
    projections.push({ memberId: member.yeastId, label: member.name ?? member.yeastId, scope: 'singleMemberProjection', hopPrediction, yeastBaselineModel,
      limitations: [culture.state === 'mixed' ? 'Projection par souche, sans somme ni moyenne de culture mixte.' : 'Projection pour le membre déclaré; ne crée pas une mesure de bière.'] });
  }
  return { projections, limitations };
}

function branchStatus(result: BrewingScenarioBranchResult): BrewingScenarioResult['status'] {
  const prediction = result.hopPrediction;
  const estimates = Object.values(prediction.overall.profile);
  const anyKnown = estimates.some(row => row.range !== null);
  if (!anyKnown) return 'unknown';
  if (estimates.some(row => row.range === null)) return 'partiallyQuantified';
  if (prediction.overall.extrapolatedAxes?.length || result.usedAssumptionIds.length > 0
    || result.applicability === 'conditional' || result.applicability === 'hypotheticalOnly') return 'conditional';
  return 'quantified';
}

function scenarioComparison(before: BrewingScenarioBranchResult, after: BrewingScenarioBranchResult, materials: HopDecisionMaterial[]): BrewingScenarioComparison {
  const axes = new Set([...Object.keys(before.hopPrediction.overall.profile), ...Object.keys(after.hopPrediction.overall.profile)]);
  const difference = (a: HopRange | null, b: HopRange | null): HopRange | null => a && b ? { min: b.min - a.max, max: b.max - a.min } : null;
  const profile = Object.fromEntries([...axes].map(id => [id, {
    range: difference(before.hopPrediction.overall.profile[id]?.range ?? null, after.hopPrediction.overall.profile[id]?.range ?? null),
    unit: 'axisScale' as const,
    reasons: ['Différence arithmétique de plages du modèle entre branches; pas une intensité ni une probabilité.'],
  }]));
  const score = { range: difference(before.hopPrediction.overall.score.range, after.hopPrediction.overall.score.range), unit: 'modelFit' as const,
    reasons: ['Écart de score de distance à la cible du modèle, si calculable; pas une mesure sensorielle.'] };
  const program = before.program && after.program ? compareHopPrograms(before.program, after.program, materials) : undefined;
  return { beforeBranchId: 'baseline', afterBranchId: after.id, profile, score, ...(program ? { program } : {}),
    limits: [...new Set([...before.hopPrediction.warnings, ...after.hopPrediction.warnings])].slice(0, 40) };
}

function evaluateBranch(input: {
  request: BrewingScenarioRequest;
  runtime: BrewingScenarioRuntime;
  id: 'baseline' | string;
  label: string;
  modelInput: HopRecipeInput;
  program?: HopDecisionProgram | null;
  programProposal?: HopProgramProposal;
  applicability: BrewingScenarioBranchResult['applicability'];
  originalInput: HopRecipeInput;
  performedIds: string[];
  assumptions: BrewingScenarioAssumption[];
  scenarioMaterials?: BrewingScenarioMaterialInputs;
  analogies?: BrewingScenarioAnalogy[];
  modelOverrides?: BrewingScenarioModelOverride[];
  biologicalContext?: HopBiotransformationInput;
  biologicalInputs?: BrewingScenarioBiologicalInput[];
  culture?: BrewingScenarioCultureContext;
  beerContext?: BrewingScenarioBeerContext;
  sourceBranch?: BrewingScenarioBranchRequest;
}): BrewingScenarioBranchResult {
  const target = input.request.target ?? {};
  const materials = mergeMaterials(input.runtime.materials, input.scenarioMaterials);
  let data = mergeEngineData(input.runtime.engineData, materials, input.scenarioMaterials);
  const localBranch: BrewingScenarioBranchRequest = input.sourceBranch ?? {
    id: input.id === 'baseline' ? 'baseline' : input.id, label: input.label, assumptions: input.assumptions,
    ...(input.scenarioMaterials ? { materials: input.scenarioMaterials } : {}),
    ...(input.analogies ? { analogies: input.analogies } : {}), ...(input.modelOverrides ? { modelOverrides: input.modelOverrides } : {}),
  };
  const modelProjection = applyScenarioModelInputs(data, localBranch, input.assumptions, input.request.scenarioId);
  data = modelProjection.engineData;
  const hopAnalogies = applyHopDescriptionAnalogies(data, input.analogies ?? [], input.assumptions);
  const hopPrediction = predictHopRecipe(input.modelInput, target, data);
  const yeastBaselineModel = input.modelInput.yeastId
    ? predictHopRecipe({ ...structuredClone(input.modelInput), additions: [] }, target, data) : undefined;
  const cultureResult = collectCultureProjections(input.modelInput, input.culture, target, data);
  const biologicalContributions = (input.biologicalInputs ?? []).map(projectBiologicalInput);
  let biologicalAssessment: HopBiotransformationAssessment | undefined;
  const biologicalAssessments: BrewingScenarioBiologicalAssessment[] = [];
  const limitations = [
    ...(input.runtime.current?.limitations ?? []), ...modelProjection.limitations, ...hopAnalogies.limitations,
    ...cultureResult.limitations, ...hopPrediction.warnings,
    ...hopPrediction.overall.reasons,
    ...modelProjection.hiddenCentral ? ['Une hypothèse d’intervalle ne fournit aucun central explicite; le moteur conserve les bornes et n’affiche pas de point central inventé.'] : [],
  ];
  if (input.culture?.state === 'mixed') limitations.push('Le moteur houblon accepte une souche par projection; chaque membre est présenté séparément, aucune moyenne de culture n’est calculée.');
  if (input.applicability === 'hypotheticalOnly') limitations.push('Cette branche est une projection de scénario; aucune opération future validée n’est attachée à un programme applicable.');
  const recipeContextChanged = input.request.baseline.kind === 'recipe' && hasUncoveredRecipeContextOverride(input.originalInput, input.sourceBranch?.inputOverrides);
  if (recipeContextChanged) {
    limitations.push('La branche change un contexte de recette que la proposition J1 ne contient pas; le résultat complet est contrefactuel et ne peut pas être présenté comme l’application de cette seule proposition.');
    if (input.originalInput.yeastId !== input.modelInput.yeastId && input.performedIds.length) {
      limitations.push('La projection mono-souche réévalue aussi des lignes historiques sous la souche hypothétique; le programme et ses lignes effectuées conservent leur contexte réel, et cette sortie ne requalifie pas leur fermentation passée.');
    }
  }
  if (input.request.baseline.kind === 'recipe' && input.programProposal
    && input.programProposal.baseline !== input.request.baseline.programReference) {
    limitations.push('L’aperçu J1 a pour base un programme de scénario différent du programme courant; il ne peut pas être appliqué à la recette réelle.');
  }
  if (input.biologicalContext) {
    try {
      biologicalAssessment = assessHopBiotransformation(structuredClone(input.biologicalContext));
      biologicalAssessments.push({ cultureMemberId: null, assessment: biologicalAssessment });
    } catch (error) {
      limitations.push(`Évaluation biologique documentaire indisponible pour cette entrée : ${(error as Error).message}`);
    }
  }
  for (const contribution of biologicalContributions) limitations.push(...contribution.limitations);
  const predictionRows = [hopPrediction, ...(yeastBaselineModel ? [yeastBaselineModel] : []),
    ...cultureResult.projections.flatMap(row => [row.hopPrediction, ...(row.yeastBaselineModel ? [row.yeastBaselineModel] : [])])];
  const usedModelIds = new Set(predictionRows.flatMap(predictionRefs).map(ref => ref.id));
  const usedScenarioModelIds = new Set(modelProjection.instances.filter(model => usedModelIds.has(model.id)).map(model => model.id));
  if (modelProjection.instances.length && !usedScenarioModelIds.size) limitations.push('Les paramètres sélectionnés ne s’appliquent à aucune sortie de cette entrée; ils sont conservés mais ne modifient pas ce résultat.');
  const assumptionIds = new Set<string>();
  for (const assumption of input.assumptions.filter(row => row.status === 'selected')) {
    if (input.sourceBranch?.inputOverrides && expectedOverridePaths(input.sourceBranch.inputOverrides).includes(assumption.path)) assumptionIds.add(assumption.id);
    if (input.sourceBranch?.programOverrides && expectedProgramOverridePaths(input.sourceBranch.programOverrides).includes(assumption.path)) assumptionIds.add(assumption.id);
    if (input.sourceBranch?.programChanges && assumption.path === 'program.changes') assumptionIds.add(assumption.id);
  }
  const scenarioModels = new Map(modelProjection.instances.map(model => [model.id, model]));
  for (const use of modelProjection.assumptionUses) {
    const model = scenarioModels.get(use.scenarioModelId);
    if (model && scenarioModelAssumptionWasConsulted(use, model, predictionRows, data)) assumptionIds.add(use.assumptionId);
    else {
      const assumption = input.assumptions.find(row => row.id === use.assumptionId);
      const parameter = use.effect.kind === 'parameter' ? modelParameterPath(use.effect.parameter) : `analogie de levure vers ${use.effect.targetYeastId}`;
      limitations.push(`Hypothèse « ${assumption?.label ?? use.assumptionId} » installée dans le modèle mais non consultée pour ${parameter} par les axes, souches ou emplois de cette branche.`);
    }
  }
  for (const id of hopAnalogies.appliedIds) assumptionIds.add(id);
  for (const contribution of biologicalContributions) if (contribution.status !== 'unknown') contribution.assumptionIds.forEach(id => assumptionIds.add(id));
  const allPredictionsForDependencies = predictionRows;
  const dependencySnapshot = captureDependencySnapshot({ data, dataRevision: input.runtime.dataRevision, input: input.modelInput,
    program: input.program, materials, scenarioMaterials: input.scenarioMaterials, analogies: input.analogies, modelProjection: {
      ...modelProjection,
      bases: modelProjection.bases.filter(base => modelProjection.instances.some(instance => usedScenarioModelIds.has(instance.id) && instance.version.startsWith(`${base.version}+scenario-`))),
      instances: modelProjection.instances.filter(instance => usedScenarioModelIds.has(instance.id)),
    }, predictions: allPredictionsForDependencies, biologicalContext: input.biologicalContext, beerContext: input.beerContext, target });
  const branch: BrewingScenarioBranchResult = {
    id: input.id, label: input.label, reference: '', input: structuredClone(input.modelInput),
    ...(input.program !== undefined ? { program: input.program ? structuredClone(input.program) : null } : {}),
    ...(input.programProposal ? { programProposal: structuredClone(input.programProposal) } : {}),
    ...(input.program ? { programAnalysis: analyzeHopProgram(input.program, materials) } : {}),
    applicability: input.applicability, hopPrediction, ...(yeastBaselineModel ? { yeastBaselineModel } : {}),
    ...(biologicalAssessment ? { biologicalAssessment } : {}), biologicalAssessments, cultureProjections: cultureResult.projections, biologicalContributions,
    ...(input.culture ? { culture: structuredClone(input.culture) } : {}), ...(input.beerContext ? { beerContext: structuredClone(input.beerContext) } : {}),
    performedAdditionIds: [...input.performedIds], assumptions: structuredClone(input.assumptions), usedAssumptionIds: [...assumptionIds],
    proposedAssumptionIds: input.assumptions.filter(row => row.status === 'proposed').map(row => row.id),
    unappliedAssumptionIds: input.assumptions.filter(row => row.status === 'selected' && !assumptionIds.has(row.id)).map(row => row.id),
    analogies: structuredClone(input.analogies ?? []), limitations: [...new Set(limitations)], dependencySnapshot,
  };
  branch.reference = branchResultReference(branch);
  return branch;
}

/** Build one comparable baseline plus explicit branches. This is an in-memory projection only. */
export function simulateBrewingScenario(request: BrewingScenarioRequest, runtime: BrewingScenarioRuntime): BrewingScenarioResult {
  assertBrewingScenarioRequest(request);
  assertRuntime(runtime);
  assertRecipeContextMatches(request, runtime);
  const hypothetical = request.baseline.kind === 'hypothetical' ? request.baseline : undefined;
  const current = runtime.current;
  const baselineInput = hypothetical?.input ?? current!.input;
  const baselineProgram = hypothetical?.program ?? (hypothetical ? undefined : current!.program);
  const baselineMaterials = hypothetical?.materials;
  const baselineCulture = hypothetical?.culture ?? current?.culture;
  const baselineBeerContext = hypothetical?.beerContext ?? current?.beerContext ?? runtime.beerContext;
  const baselineBio = hypothetical?.biologicalContext ?? current?.biologicalContext ?? runtime.biologicalContext;
  const baselinePerformed = baselineProgram?.additions.filter(row => row.status === 'performed').map(row => row.id)
    ?? (!hypothetical ? current?.performedAdditionIds ?? [] : []);
  const baseline = evaluateBranch({
    request, runtime, id: 'baseline', label: hypothetical?.label ?? 'État courant', modelInput: baselineInput,
    ...(baselineProgram !== undefined ? { program: baselineProgram } : {}), applicability: baselineProgram || hypothetical ? 'available' : 'hypotheticalOnly',
    originalInput: baselineInput, performedIds: baselinePerformed, assumptions: request.assumptions,
    scenarioMaterials: baselineMaterials, biologicalContext: baselineBio, culture: baselineCulture, beerContext: baselineBeerContext,
  });
  const branches: BrewingScenarioBranchResult[] = request.branches.map(branchRequest => {
    const sourceInput = branchRequest.input ?? baselineInput;
    let program = baselineProgram ? structuredClone(baselineProgram) : undefined;
    if (branchRequest.programOverrides) {
      check(program, 'Un override de programme exige un programme hypothétique/courant explicite.');
      program = { ...program, ...structuredClone(branchRequest.programOverrides) };
    }
    const programBase = program ? structuredClone(program) : undefined;
    const scenarioMaterials = combineScenarioMaterials(baselineMaterials, branchRequest.materials);
    const materials = mergeMaterials(runtime.materials, scenarioMaterials);
    let programProposal: HopProgramProposal | undefined;
    let applicability: BrewingScenarioBranchResult['applicability'] = 'hypotheticalOnly';
    let modelInput = structuredClone(sourceInput);
    const isRecipeBaseline = request.baseline.kind === 'recipe';
    if (branchRequest.programChanges) {
      check(program && programBase, 'Des changements J1 exigent un programme courant ou hypothétique.');
      programProposal = previewHopProgramChanges(programBase, structuredClone(branchRequest.programChanges), materials);
      program = structuredClone(programProposal.program);
      modelInput = inputFromProgram(baselineInput, programBase, program, materials);
      applicability = programProposal.applicability;
    } else if (program && programBase && branchRequest.programOverrides) {
      modelInput = inputFromProgram(baselineInput, baselineProgram ?? programBase, programBase, materials);
      applicability = isRecipeBaseline ? 'hypotheticalOnly' : 'conditional';
    } else if (program && !branchRequest.input && !branchRequest.inputOverrides) {
      modelInput = structuredClone(baselineInput);
      applicability = isRecipeBaseline ? 'available' : 'conditional';
    }
    if (branchRequest.input) modelInput = structuredClone(branchRequest.input);
    if (branchRequest.inputOverrides) {
      const performed = programBase?.additions.filter(row => row.status === 'performed').map(row => row.id) ?? baselinePerformed;
      check(!(program && branchRequest.inputOverrides.additions?.length), 'Les ajouts d’un programme se modifient par changements J1, pas par un patch parallèle de triplets.');
      assertPerformedInputUntouched(sourceInput, sourceInput, performed, branchRequest, !!program);
      modelInput = applyInputOverrides(modelInput, branchRequest.inputOverrides);
      if (program && programProposal) check(!branchRequest.inputOverrides.volumeL || branchRequest.inputOverrides.volumeL === program.volumeL,
        'Le volume de HopRecipeInput doit correspondre au volume du programme simulé.');
    }
    if (program) assertAlignedInput(modelInput, program, materials);
    const performedIds = program?.additions.filter(row => row.status === 'performed').map(row => row.id) ?? baselinePerformed;
    assertPerformedInputUntouched(baselineInput, modelInput, performedIds, branchRequest, !!program);
    const programBaseDiffersFromCurrent = isRecipeBaseline && !!programBase && !!baselineProgram && !sameJson(programBase, baselineProgram);
    const recipeContextDiffersFromCurrent = isRecipeBaseline && hasUncoveredRecipeContextOverride(baselineInput, branchRequest.inputOverrides);
    if (programBaseDiffersFromCurrent || recipeContextDiffersFromCurrent) applicability = 'hypotheticalOnly';
    const assumptions = [...request.assumptions, ...branchRequest.assumptions];
    const branch = evaluateBranch({ request, runtime, id: branchRequest.id, label: branchRequest.label, modelInput,
      ...(program !== undefined ? { program } : {}), ...(programProposal ? { programProposal } : {}), applicability,
      originalInput: baselineInput, performedIds, assumptions, scenarioMaterials,
      analogies: branchRequest.analogies, modelOverrides: branchRequest.modelOverrides,
      biologicalContext: branchRequest.biologicalContext ?? baselineBio, biologicalInputs: branchRequest.biologicalInputs,
      culture: branchRequest.culture ?? baselineCulture, beerContext: branchRequest.beerContext ?? baselineBeerContext,
      sourceBranch: branchRequest });
    return branch;
  });
  const materialsForComparison = mergeMaterials(runtime.materials, baselineMaterials);
  const comparisons = branches.map(branch => scenarioComparison(baseline, branch, materialsForComparison));
  const dependencyRefs = [baseline, ...branches].map(row => row.dependencySnapshot.reference);
  const allStatuses = [branchStatus(baseline), ...branches.map(branchStatus)];
  const status: BrewingScenarioResult['status'] = allStatuses.every(value => value === 'unknown') ? 'unknown'
    : allStatuses.some(value => value === 'partiallyQuantified') ? 'partiallyQuantified'
      : allStatuses.some(value => value === 'conditional') ? 'conditional' : 'quantified';
  const result: BrewingScenarioResult = {
    version: BREWING_SCENARIO_VERSION, scenarioId: request.scenarioId, revision: request.revision,
    requestSnapshot: structuredClone(request), inputReference: brewingScenarioInputReference(request), reference: '',
    dataReference: hopAdviceContentReference('brewing-scenario-data-v1', { dataRevision: runtime.dataRevision ?? null, dependencyRefs }),
    status, baseline, branches, comparisons,
    limitations: [...new Set([...(current?.limitations ?? []), ...[baseline, ...branches].flatMap(row => row.limitations)])],
  };
  result.reference = brewingScenarioResultReference(result);
  assertBrewingScenarioResult(result);
  return result;
}

/** Structural validation for persisted/re-read scenario snapshots; it never reruns prediction code. */
export function assertBrewingScenarioResult(value: unknown): asserts value is BrewingScenarioResult {
  if (!isRow(value)) throw Error('Résultat de scénario invalide.');
  const result = value;
  onlyKeys(result, ['version', 'scenarioId', 'revision', 'requestSnapshot', 'inputReference', 'reference', 'dataReference', 'status', 'baseline', 'branches', 'comparisons', 'limitations'], 'Résultat de scénario');
  check(result.version === BREWING_SCENARIO_VERSION && safeId(result.scenarioId) && Number.isSafeInteger(result.revision) && (result.revision as number) >= 0,
    'Version, identité ou révision du résultat invalides.');
  assertBrewingScenarioRequestSnapshot(result.requestSnapshot);
  const requestSnapshot = result.requestSnapshot as BrewingScenarioRequest;
  check(result.scenarioId === requestSnapshot.scenarioId && result.revision === requestSnapshot.revision
    && result.inputReference === brewingScenarioInputReference(requestSnapshot), 'Le résultat ne correspond pas à sa requête figée.');
  check(isText(result.reference) && result.reference === brewingScenarioResultReference(result as unknown as BrewingScenarioResult)
    && isText(result.dataReference) && ['quantified', 'conditional', 'partiallyQuantified', 'unknown'].includes(result.status as string),
  'Référence ou état de résultat invalide.');
  check(Array.isArray(result.branches) && Array.isArray(result.comparisons) && Array.isArray(result.limitations) && result.limitations.every(isText), 'Branches, écarts ou limites absents.');
  function assertBranch(candidate: unknown, label: string): asserts candidate is BrewingScenarioBranchResult {
    if (!isRow(candidate)) throw Error(`Branche ${label} invalide.`);
    const raw = candidate;
    onlyKeys(raw, ['id', 'label', 'reference', 'input', 'program', 'programProposal', 'programAnalysis', 'applicability', 'hopPrediction', 'yeastBaselineModel', 'biologicalAssessment', 'biologicalAssessments', 'cultureProjections', 'biologicalContributions', 'culture', 'beerContext', 'performedAdditionIds', 'assumptions', 'usedAssumptionIds', 'proposedAssumptionIds', 'unappliedAssumptionIds', 'analogies', 'limitations', 'dependencySnapshot'], `Branche ${label}`);
    const branch = raw as unknown as BrewingScenarioBranchResult;
    check((branch.id === 'baseline' && label === 'baseline' || safeId(branch.id) && branch.id !== 'baseline' && label === 'option') && isText(branch.label)
      && isText(branch.reference) && branch.reference === branchResultReference(branch)
      && ['available', 'conditional', 'unavailable', 'hypotheticalOnly'].includes(branch.applicability), `Identité ou applicabilité de branche ${label} invalide.`);
    assertHopRecipeInput(branch.input);
    if (branch.program !== undefined && branch.program !== null) programFingerprint(branch.program);
    if (branch.programProposal !== undefined) {
      check(isText(branch.programProposal.baseline) && ['available', 'conditional', 'unavailable'].includes(branch.programProposal.applicability), `Aperçu J1 de ${label} invalide.`);
      programFingerprint(branch.programProposal.program);
      if (branch.program) check(programFingerprint(branch.program) === programFingerprint(branch.programProposal.program), `Le programme de ${label} diffère de son aperçu J1.`);
    }
    function assertPrediction(prediction: unknown): asserts prediction is HopRecipePrediction {
      if (!isRow(prediction)) throw Error(`Sortie du moteur hop de ${label} invalide.`);
      check([HOP_RECIPE_ENGINE_VERSION, 'hop-recipe-experimental-v1', 'hop-recipe-experimental-v2', 'hop-recipe-experimental-v3', 'hop-recipe-experimental-v4'].includes(prediction.engineVersion as string)
        && Array.isArray(prediction.additions) && isRow(prediction.overall), `Sortie du moteur hop de ${label} invalide.`);
      assertHopRecipeInput(prediction.input as HopRecipeInput);
    }
    assertPrediction(branch.hopPrediction);
    if (branch.yeastBaselineModel !== undefined) assertPrediction(branch.yeastBaselineModel);
    check(Array.isArray(branch.biologicalAssessments) && Array.isArray(branch.cultureProjections) && Array.isArray(branch.biologicalContributions)
      && uniqueText(branch.performedAdditionIds) && Array.isArray(branch.assumptions) && Array.isArray(branch.analogies)
      && uniqueText(branch.usedAssumptionIds) && uniqueText(branch.proposedAssumptionIds) && uniqueText(branch.unappliedAssumptionIds)
      && Array.isArray(branch.limitations) && branch.limitations.every(isText), `Contexte/limites de branche ${label} invalides.`);
    branch.assumptions.forEach(assertAssumption);
    if (branch.culture !== undefined) assertCulture(branch.culture);
    if (branch.beerContext !== undefined) assertBeerContext(branch.beerContext);
    for (const projection of branch.cultureProjections) {
      check(isText(projection.label) && projection.scope === 'singleMemberProjection' && Array.isArray(projection.limitations), `Projection de culture ${label} invalide.`);
      assertPrediction(projection.hopPrediction);
      if (projection.yeastBaselineModel !== undefined) assertPrediction(projection.yeastBaselineModel);
    }
    const snapshot = branch.dependencySnapshot;
    const snapshotRow = snapshot as unknown as Row;
    onlyKeys(snapshotRow, ['version', 'reference', 'dataRevision', 'engineData', 'decisionMaterials', 'program', 'biologicalContext', 'beerContext', 'scenarioMaterials', 'scenarioModelBases', 'scenarioModelInstances', 'knowledgeValidationErrors'], `Dépendances de ${label}`);
    check(snapshot.version === BREWING_SCENARIO_DEPENDENCY_VERSION && isText(snapshot.reference) && snapshot.reference === dependencySnapshotReference(snapshot)
      && Array.isArray(snapshot.engineData.varieties) && Array.isArray(snapshot.engineData.lots) && Array.isArray(snapshot.engineData.knowledge)
      && Array.isArray(snapshot.decisionMaterials) && Array.isArray(snapshot.scenarioModelBases) && Array.isArray(snapshot.scenarioModelInstances)
      && Array.isArray(snapshot.knowledgeValidationErrors) && snapshot.knowledgeValidationErrors.every(isText), `Instantané de dépendances ${label} invalide.`);
    snapshot.engineData.varieties.forEach(item => assertHopDocument('hopVarieties', item));
    snapshot.engineData.lots.forEach(item => assertHopDocument('hopLots', item));
    snapshot.engineData.knowledge.forEach(item => assertHopKnowledge(item));
    snapshot.decisionMaterials.forEach(assertScenarioMaterial);
    snapshot.scenarioModelBases.forEach(item => assertHopExtrapolation(item));
    snapshot.scenarioModelInstances.forEach(item => assertHopExtrapolation(item));
    const selectedScenarioRefs = new Set(branch.assumptions.filter(item => item.status === 'selected').map(item =>
      `brewing-scenario-hypothesis-v1:${encodeURIComponent((requestSnapshot as BrewingScenarioRequest).scenarioId)}:${encodeURIComponent(branch.id)}:${encodeURIComponent(item.id)}`));
    const assertSelectedScenarioSources = (node: unknown): void => {
      if (Array.isArray(node)) { node.forEach(assertSelectedScenarioSources); return; }
      if (!isRow(node)) return;
      for (const [key, child] of Object.entries(node)) {
        if (key === 'source' && isRow(child) && child.kind === 'judgment' && child.year === null) {
          check(typeof child.reference === 'string' && selectedScenarioRefs.has(child.reference), `Hypothèse de source non sélectionnée dans ${label}.`);
        } else assertSelectedScenarioSources(child);
      }
    };
    snapshot.scenarioModelInstances.forEach(assertSelectedScenarioSources);
    if (snapshot.program !== undefined && snapshot.program !== null) programFingerprint(snapshot.program);
    if (snapshot.scenarioMaterials !== undefined) assertScenarioMaterials(snapshot.scenarioMaterials);
  }
  const baseline = result.baseline as unknown;
  assertBranch(baseline, 'baseline');
  const branches = result.branches as unknown[];
  check((baseline as BrewingScenarioBranchResult).id === 'baseline' && branches.every(row => isRow(row) && row.id !== 'baseline'), 'Une seule base est permise.');
  branches.forEach(row => assertBranch(row, 'option'));
  const typedBranches = branches as BrewingScenarioBranchResult[];
  const ids = typedBranches.map(row => row.id);
  check(uniqueText(ids) && ids.length === requestSnapshot.branches.length && ids.every(id => requestSnapshot.branches.some(branch => branch.id === id)), 'Les branches du résultat ne correspondent pas à la demande.');
  const comparisons = result.comparisons as unknown[];
  check(comparisons.length === typedBranches.length && comparisons.every((row, index) => isRow(row) && row.beforeBranchId === 'baseline' && row.afterBranchId === ids[index]), 'Comparaisons de scénario désalignées.');
}
