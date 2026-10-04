import type { HopRange, HopSource } from '../../../functions/src/hopIndexSchema';
import type { BrewerContext } from '../../../functions/src/companionTypes';
import { validHopRange } from '../../../functions/src/hopIndexSchema';
import type { BrewingStyle, BrewingStyleGuide, BrewingStyleGuideRevision } from '../../../functions/src/brewingStyleSchema';
import type { HopAxis, HopYeast } from '../../../functions/src/hopPredictionSchema';
import type { HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import {
  type BrewingScenarioAssumption,
  type BrewingScenarioBeerContext,
  type BrewingScenarioBeerFact,
  type BrewingScenarioBranchRequest,
  type BrewingScenarioRequest,
  type BrewingScenarioStyleReference,
} from '../../domain/brewingScenario';
import type { PreparedBrewingScenarioContext } from '../../domain/brewingScenarioContext';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';

export type HopV55PlanningField<T> =
  | { action: 'keep' }
  | { action: 'set'; value: T }
  | { action: 'reset' };

export type HopV55BeerTargetField = 'ogTarget' | 'fgTarget' | 'abvTarget' | 'ibuTarget';
export type HopV55PlanningStage = 'planning' | 'hotSide' | 'fermenting' | 'conditioning' | 'packaged' | 'unknown';
type HopV55InputOverrideValue<K extends 'volumeL' | 'yeastId' | 'pitchTempC' | 'fermentation'> = K extends 'yeastId'
  ? string | null : NonNullable<HopRecipeInput[K]>;

export interface HopV55PlanningStyleSelection {
  name: string;
  reference: BrewingScenarioStyleReference;
}

export interface HopV55PlanningStyleOption {
  guideName: string;
  edition: string;
  guideId: string;
  version: string;
  styleId: string;
  name: string;
  code: string;
  family: string;
  source: HopSource;
  guideSource: HopSource;
  reference: Omit<BrewingScenarioStyleReference, 'role'>;
}

export interface HopV55PlanningEdits {
  volumeL?: HopV55PlanningField<number>;
  yeastId?: HopV55PlanningField<string | null>;
  pitchTempC?: HopV55PlanningField<number>;
  fermentation?: HopV55PlanningField<HopRecipeInput['fermentation']>;
  style?: HopV55PlanningField<HopV55PlanningStyleSelection>;
  beerTargets?: Partial<Record<HopV55BeerTargetField, HopV55PlanningField<number>>>;
  axisTargets?: Record<string, HopV55PlanningField<HopRange>>;
}

export interface ApplyHopV55PlanningEditsInput {
  prepared: PreparedBrewingScenarioContext;
  context?: BrewerContext;
  branch?: BrewingScenarioBranchRequest;
  branchId: string;
  label: string;
  edits: HopV55PlanningEdits;
  target?: BrewingScenarioRequest['target'];
}

export interface HopV55PlanningCommit {
  branch: BrewingScenarioBranchRequest;
  /** Omitted when no axis target changed; otherwise this is the complete preserved map. */
  target?: BrewingScenarioRequest['target'];
}

export class HopV55ScenarioPlanningError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HopV55ScenarioPlanningError';
  }
}

const targetUnits: Record<HopV55BeerTargetField, string> = {
  ogTarget: 'SG', fgTarget: 'SG', abvTarget: '% vol.', ibuTarget: 'IBU',
};
const targetLabels: Record<HopV55BeerTargetField, string> = {
  ogTarget: 'Densité initiale visée', fgTarget: 'Densité finale visée',
  abvTarget: 'Alcool visé', ibuTarget: 'Amertume visée',
};
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const hasText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const isRow = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean =>
  hopAdviceContentReference('hop-v55-planning-equality-v1', left) === hopAdviceContentReference('hop-v55-planning-equality-v1', right);

function stableSuffix(value: unknown): string {
  return hopAdviceContentReference('hop-v55-planning-id-v1', value).slice(-20);
}

function safeBranchId(value: unknown): value is string {
  return hasText(value) && value.length <= 120 && !/[\/\\]/.test(value)
    && !/^__.*__$/.test(value) && !['.', '..', 'constructor', 'prototype'].includes(value);
}

function assumptionId(branchId: string, path: string, value: unknown): string {
  return `plan-${stableSuffix({ branchId, path, value })}`;
}

function planFactId(branchId: string, field: string, value: unknown): string {
  return `plan-fact-${stableSuffix({ branchId, field, value })}`;
}

function planningAssumption(input: {
  branchId: string;
  path: string;
  label: string;
  value?: string | number | boolean | null;
  range?: HopRange;
  unit?: string;
  basis?: string;
  source?: HopSource;
  explanation: string;
}): BrewingScenarioAssumption {
  return {
    id: assumptionId(input.branchId, input.path, { value: input.value, range: input.range, unit: input.unit, basis: input.basis }),
    path: input.path,
    label: input.label,
    status: 'selected',
    origin: 'userHypothesis',
    explanation: input.explanation,
    ...(input.value !== undefined ? { value: input.value } : {}),
    ...(input.range ? { range: clone(input.range) } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    ...(input.basis ? { basis: input.basis } : {}),
    ...(input.source ? { source: clone(input.source) } : {}),
  };
}

function keepSelectedAssumption(branch: BrewingScenarioBranchRequest, selected: BrewingScenarioAssumption): void {
  const assumptions = branch.assumptions ?? [];
  const existing = assumptions.find(row => row.path === selected.path && row.status === 'selected'
    && row.id === selected.id && same({ value: row.value, range: row.range, unit: row.unit, basis: row.basis },
      { value: selected.value, range: selected.range, unit: selected.unit, basis: selected.basis }));
  if (existing) return;
  branch.assumptions = assumptions.map(row => row.path === selected.path && row.status === 'selected'
    ? { ...row, status: 'proposed' } : row);
  const proposed = branch.assumptions.find(row => row.id === selected.id);
  if (proposed) {
    branch.assumptions = branch.assumptions.map(row => row.id === selected.id ? clone(selected) : row);
  } else branch.assumptions.push(clone(selected));
}

function demoteSelectedPath(branch: BrewingScenarioBranchRequest, path: string): void {
  branch.assumptions = (branch.assumptions ?? []).map(row => row.path === path && row.status === 'selected'
    ? { ...row, status: 'proposed' } : row);
}

const previousCulturePath = 'planning.previousCulture';
const previousCulturePrefix = 'plan-culture-prior-';

function rememberPreviousCulture(branch: BrewingScenarioBranchRequest, branchId: string): void {
  if (branch.assumptions.some(row => row.path === previousCulturePath && row.id.startsWith(previousCulturePrefix))) return;
  const value = JSON.stringify(branch.culture ?? null);
  branch.assumptions.push({
    id: `${previousCulturePrefix}${stableSuffix({ branchId, value })}`,
    path: previousCulturePath,
    label: 'Contexte de culture avant ce choix',
    status: 'proposed',
    origin: 'userHypothesis',
    explanation: 'Contexte précédent conservé exactement avant de préparer une projection de souche unique.',
    value,
  });
}

function restorePreviousCulture(branch: BrewingScenarioBranchRequest): void {
  const previous = branch.assumptions.find(row => row.path === previousCulturePath && row.id.startsWith(previousCulturePrefix));
  if (!previous || typeof previous.value !== 'string') return;
  try {
    const value = JSON.parse(previous.value);
    if (value === null) delete branch.culture;
    else branch.culture = clone(value) as NonNullable<BrewingScenarioBranchRequest['culture']>;
  } catch {
    throw new HopV55ScenarioPlanningError('Le contexte de culture précédent ne peut pas être relu sans perte; le branchement reste inchangé.');
  }
}

function applyInputField<K extends 'volumeL' | 'yeastId' | 'pitchTempC' | 'fermentation'>(input: {
  branch: BrewingScenarioBranchRequest;
  branchId: string;
  field: K;
  path: string;
  edit: HopV55PlanningField<HopV55InputOverrideValue<K>> | undefined;
  label: string;
  unit?: string;
  valueDescription(value: HopV55InputOverrideValue<K>): string;
}): void {
  const { branch, branchId, field, path, edit } = input;
  if (!edit || edit.action === 'keep') return;
  const overrides = { ...(branch.inputOverrides ?? {}) };
  if (edit.action === 'reset') {
    delete overrides[field];
    demoteSelectedPath(branch, path);
  } else {
    const value = edit.value;
    (overrides as Record<string, unknown>)[field] = clone(value);
    keepSelectedAssumption(branch, planningAssumption({ branchId, path, label: input.label,
      value: Array.isArray(value) ? JSON.stringify(value) : value as string | number | boolean | null,
      ...(input.unit ? { unit: input.unit } : {}), explanation: input.valueDescription(value) }));
  }
  if (Object.keys(overrides).length) branch.inputOverrides = overrides;
  else delete branch.inputOverrides;
}

function assertExplicitFermentation(value: unknown): asserts value is HopRecipeInput['fermentation'] {
  const kinds = ['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'];
  if (!Array.isArray(value) || value.some(row => !isRow(row)
    || !kinds.includes(String(row.kind)) || !hasText(row.name) || !isFiniteNumber(row.tempC)
    || !isFiniteNumber(row.days) || row.days < 0 || row.note !== undefined && typeof row.note !== 'string')) {
    throw new HopV55ScenarioPlanningError('Chaque palier choisi exige un type, un libellé, une température et une durée explicites.');
  }
}

function stageFromBrewerContext(context?: BrewerContext): HopV55PlanningStage {
  if (!context) return 'unknown';
  const status = context.batch?.status;
  if (status === 'annule') return 'unknown';
  if (status === 'conditionne' || status === 'termine') return 'packaged';
  if (status === 'garde') return 'conditioning';
  if (status === 'fermentation' || Number.isFinite(context.journal?.pitchedAt)) return 'fermenting';
  if (Number.isFinite(context.journal?.startedAt)) return 'hotSide';
  if (!context.batch || status === 'planifie') return context.recipe ? 'planning' : 'unknown';
  return 'unknown';
}

export function getHopV55PlanningStage(prepared: PreparedBrewingScenarioContext, context?: BrewerContext): HopV55PlanningStage {
  const preparedStage = prepared.runtime.current?.program?.stage ?? prepared.binding?.program?.stage;
  const contextStage = stageFromBrewerContext(context);
  if (preparedStage && contextStage !== 'unknown' && preparedStage !== contextStage) return 'unknown';
  return contextStage !== 'unknown' ? contextStage : preparedStage ?? 'unknown';
}

export function getHopV55PlanningYeasts(prepared: PreparedBrewingScenarioContext): HopYeast[] {
  return prepared.runtime.engineData.knowledge.filter((row): row is HopYeast => row.kind === 'yeast').map(clone);
}

export function getHopV55PlanningAxes(prepared: PreparedBrewingScenarioContext): HopAxis[] {
  return prepared.runtime.engineData.knowledge.filter((row): row is HopAxis => row.kind === 'axis').map(clone);
}

function stylesForGuide(guide: BrewingStyleGuide, revision: BrewingStyleGuideRevision | undefined) {
  const version = revision?.version ?? guide.version;
  const edition = revision?.edition ?? guide.edition;
  const source = revision?.source ?? guide.source;
  const styles = revision?.styles ?? guide.styles;
  return styles.map((style: BrewingStyle): HopV55PlanningStyleOption => ({
    guideName: guide.name, edition, guideId: guide.id, version, styleId: style.id,
    name: style.name, code: style.code, family: style.family, source: clone(style.source), guideSource: clone(source),
    reference: { guideId: guide.id, version, styleId: style.id },
  }));
}

export function getHopV55PlanningStyles(context?: BrewerContext): HopV55PlanningStyleOption[] {
  const options = (context?.hopIndex?.knowledge ?? []).flatMap(row => {
    if (row.kind !== 'styleGuide') return [];
    const guide = row as BrewingStyleGuide;
    return [
      ...stylesForGuide(guide, undefined),
      ...(guide.history ?? []).flatMap(revision => stylesForGuide(guide, revision)),
    ];
  });
  return options.sort((left, right) => left.name.localeCompare(right.name)
    || left.guideName.localeCompare(right.guideName) || left.version.localeCompare(right.version));
}

export function resolveHopV55PlanningStyle(
  context: BrewerContext | undefined,
  reference: BrewingScenarioStyleReference,
): HopV55PlanningStyleOption | undefined {
  const matches = getHopV55PlanningStyles(context).filter(option => option.guideId === reference.guideId
    && option.version === reference.version && option.styleId === reference.styleId);
  return matches.length === 1 ? matches[0] : undefined;
}

function currentAxisForEdit(axis: HopAxis, context?: BrewerContext): HopAxis {
  const matches = context?.hopIndex?.knowledge.filter((row): row is HopAxis => row.kind === 'axis' && row.id === axis.id) ?? [];
  if (!matches.length) return axis;
  if (matches.length !== 1 || !same(matches[0], axis)) {
    throw new HopV55ScenarioPlanningError(`La définition source de l’axe ${axis.name} a changé; recharge la branche avant de fixer sa plage.`);
  }
  return matches[0];
}

function baselineBeerContext(prepared: PreparedBrewingScenarioContext): BrewingScenarioBeerContext | undefined {
  return prepared.runtime.current?.beerContext ?? prepared.runtime.beerContext;
}

function beerContextFor(branch: BrewingScenarioBranchRequest, prepared: PreparedBrewingScenarioContext): BrewingScenarioBeerContext {
  return clone(branch.beerContext ?? baselineBeerContext(prepared) ?? { facts: [] });
}

function targetFacts(context: BrewingScenarioBeerContext, field: string): BrewingScenarioBeerFact[] {
  return context.facts.filter(row => row.field === field && (row.status === 'target' || row.status === 'selected'));
}

function applyBeerTarget(input: {
  branch: BrewingScenarioBranchRequest;
  prepared: PreparedBrewingScenarioContext;
  branchId: string;
  field: HopV55BeerTargetField;
  edit: HopV55PlanningField<number> | undefined;
}): void {
  const { branch, prepared, branchId, field, edit } = input;
  if (!edit || edit.action === 'keep') return;
  const baseline = baselineBeerContext(prepared);
  const baselineTargets = baseline ? targetFacts(baseline, field) : [];
  const current = beerContextFor(branch, prepared);
  const baselineIds = new Set(baselineTargets.map(row => row.id));
  const path = `beerContext.target.${field}`;
  if (edit.action === 'reset') {
    const retained = current.facts.flatMap(fact => {
      if (fact.field !== field) return [fact];
      if (baselineIds.has(fact.id)) return [];
      return fact.status === 'target' || fact.status === 'selected' ? [{ ...fact, status: 'proposed' as const }] : [fact];
    });
    current.facts = [...retained, ...baselineTargets.map(clone)];
    branch.beerContext = current;
    demoteSelectedPath(branch, path);
    return;
  }
  if (!isFiniteNumber(edit.value)) throw new HopV55ScenarioPlanningError(`La cible « ${targetLabels[field]} » doit être une valeur exacte.`);
  const retained = current.facts.flatMap(fact => {
    if (fact.field !== field) return [fact];
    if (baselineIds.has(fact.id)) return [];
    return fact.status === 'target' || fact.status === 'selected' ? [{ ...fact, status: 'proposed' as const }] : [fact];
  });
  const reportedBaseline = baselineTargets.map(fact => ({ ...clone(fact), status: 'reported' as const }));
  const targetFact: BrewingScenarioBeerFact = {
    id: planFactId(branchId, field, edit.value), field, status: 'target', origin: 'userHypothesis',
    value: edit.value, unit: targetUnits[field],
  };
  current.facts = [...retained.filter(row => row.id !== targetFact.id), ...reportedBaseline, targetFact];
  branch.beerContext = current;
  keepSelectedAssumption(branch, planningAssumption({ branchId, path, label: targetLabels[field], value: edit.value,
    unit: targetUnits[field], explanation: `Cible saisie explicitement pour cette branche (${targetUnits[field]}). Elle reste distincte de toute estimation du moteur.` }));
}

function styleFact(value: HopV55PlanningStyleOption, branchId: string): BrewingScenarioBeerFact {
  return { id: planFactId(branchId, 'style.name', value.reference), field: 'style.name', status: 'target', origin: 'userHypothesis',
    value: value.name, source: clone(value.source) };
}

function appendHistoricalStyleFacts(
  branch: BrewingScenarioBranchRequest,
  context: BrewingScenarioBeerContext,
  baseline: BrewingScenarioBeerContext | undefined,
): void {
  const baselineStyleIds = new Set((baseline?.facts ?? []).filter(row => row.field === 'style.name').map(row => row.id));
  const retained: BrewingScenarioBeerFact[] = [];
  for (const fact of context.facts) {
    if (fact.field !== 'style.name') { retained.push(fact); continue; }
    if (fact.id.startsWith('plan-fact-')) {
      retained.push(fact.status === 'target' || fact.status === 'selected' ? { ...fact, status: 'proposed' } : fact);
      continue;
    }
    if (baselineStyleIds.has(fact.id)) continue;
    retained.push(fact.status === 'target' || fact.status === 'selected' ? { ...fact, status: 'proposed' } : fact);
  }
  const baselineFacts = (baseline?.facts ?? []).filter(row => row.field === 'style.name');
  context.facts = [...retained, ...baselineFacts.map(clone)];
  if (branch.assumptions.some(row => row.path === 'beerContext.style' && row.status === 'selected')) demoteSelectedPath(branch, 'beerContext.style');
}

function applyStyle(input: {
  branch: BrewingScenarioBranchRequest;
  prepared: PreparedBrewingScenarioContext;
  context?: BrewerContext;
  branchId: string;
  edit: HopV55PlanningField<HopV55PlanningStyleSelection> | undefined;
}): void {
  const { branch, prepared, branchId, edit } = input;
  if (!edit || edit.action === 'keep') return;
  const baseline = baselineBeerContext(prepared);
  const context = beerContextFor(branch, prepared);
  if (edit.action === 'reset') {
    appendHistoricalStyleFacts(branch, context, baseline);
    if (baseline?.style) context.style = clone(baseline.style);
    else delete context.style;
    branch.beerContext = context;
    demoteSelectedPath(branch, 'beerContext.style');
    return;
  }
  const { name, reference } = edit.value;
  if (!hasText(name) || !reference || !['target', 'reference'].includes(reference.role)) {
    throw new HopV55ScenarioPlanningError('Choisis un style chargé et précise son rôle : cible ou référence de comparaison.');
  }
  const resolved = resolveHopV55PlanningStyle(input.context, reference);
  if (!resolved || resolved.name !== name) throw new HopV55ScenarioPlanningError('Le style choisi n’est plus résolu dans le référentiel chargé; aucun style voisin n’est substitué.');
  const nextReference: BrewingScenarioStyleReference = { ...resolved.reference, role: reference.role };
  if (reference.role === 'target') {
    appendHistoricalStyleFacts(branch, context, baseline);
    const oldSourceStyleFacts = context.facts.filter(row => row.field === 'style.name' && (row.status === 'target' || row.status === 'selected'));
    context.facts = context.facts.map(row => oldSourceStyleFacts.some(source => source.id === row.id)
      ? { ...row, status: 'reported' as const } : row);
    context.facts.push(styleFact(resolved, branchId));
  } else appendHistoricalStyleFacts(branch, context, baseline);
  context.style = nextReference;
  branch.beerContext = context;
  keepSelectedAssumption(branch, planningAssumption({ branchId, path: 'beerContext.style', label: reference.role === 'target' ? 'Style cible' : 'Référence comparative de style',
    value: JSON.stringify(nextReference), source: resolved.source,
    explanation: `${resolved.name} · ${resolved.guideName}, ${resolved.edition} · version ${resolved.version}; rôle explicitement choisi « ${reference.role} ».` }));
}

function stageAllowsSet(stage: HopV55PlanningStage, field: 'volumeL' | 'yeastId' | 'pitchTempC' | 'fermentation'): boolean {
  if (field === 'volumeL') return stage === 'planning';
  return stage === 'planning' || stage === 'hotSide';
}

function hasBranchContent(branch: BrewingScenarioBranchRequest): boolean {
  return !!branch.input || Object.keys(branch.inputOverrides ?? {}).length > 0 || Object.keys(branch.programOverrides ?? {}).length > 0
    || !!branch.programChanges?.length || !!branch.materials || !!branch.analogies?.length || !!branch.modelOverrides?.length
    || !!branch.biologicalContext || !!branch.biologicalInputs?.length || !!branch.culture || !!branch.beerContext
    || !!branch.assumptions.length;
}

export function applyHopV55PlanningEdits(input: ApplyHopV55PlanningEditsInput): HopV55PlanningCommit {
  const { prepared, branch: original, branchId, label, edits } = input;
  if (!safeBranchId(branchId) || branchId === 'baseline') throw new HopV55ScenarioPlanningError('L’identifiant de branche est invalide.');
  if (original && original.id !== branchId) throw new HopV55ScenarioPlanningError('La branche a changé pendant la saisie; relis le scénario avant de continuer.');
  if (!hasText(label)) throw new HopV55ScenarioPlanningError('Nomme la branche pour pouvoir la retrouver.');
  const branch: BrewingScenarioBranchRequest = original ? clone(original) : { id: branchId, label: label.trim(), assumptions: [] };
  branch.label = label.trim();
  const currentInput = prepared.runtime.current?.input;
  const currentProgram = prepared.runtime.current?.program ?? prepared.binding?.program;
  const stage = getHopV55PlanningStage(prepared, input.context);
  const hasProgram = !!currentProgram || !!branch.programOverrides || !!branch.programChanges?.length;

  for (const field of ['volumeL', 'yeastId', 'pitchTempC', 'fermentation'] as const) {
    const edit = edits[field] as HopV55PlanningField<HopV55InputOverrideValue<typeof field>> | undefined;
    if (!edit || edit.action === 'keep' || edit.action === 'reset') continue;
    if (!currentInput) throw new HopV55ScenarioPlanningError('Aucune entrée de recette courante n’est liée; ce panneau ne fabrique pas de base de calcul.');
    if (!stageAllowsSet(stage, field)) throw new HopV55ScenarioPlanningError(field === 'volumeL'
      ? 'Le volume ne peut plus être changé après le début du jour de brassage.'
      : 'Ce réglage ne peut plus devenir une conduite future après le début de la fermentation; la comparaison reste disponible.');
    if (field === 'yeastId' && prepared.runtime.current?.culture?.state === 'mixed') {
      throw new HopV55ScenarioPlanningError('La culture est composée; le contrat de branche à souche unique ne peut pas remplacer ses membres. La comparaison reste disponible.');
    }
  }

  if (edits.volumeL?.action === 'set') {
    if (!isFiniteNumber(edits.volumeL.value) || edits.volumeL.value <= 0) throw new HopV55ScenarioPlanningError('Le volume doit être strictement positif et explicite.');
  }
  const yeastEdit = edits.yeastId;
  if (yeastEdit && yeastEdit.action === 'set') {
    const selectedYeastId = yeastEdit.value;
    if (selectedYeastId !== null && !getHopV55PlanningYeasts(prepared).some(row => row.id === selectedYeastId)) {
      throw new HopV55ScenarioPlanningError('La souche choisie n’est pas présente dans le référentiel chargé.');
    }
    if (prepared.runtime.current?.culture?.state === 'mixed' || branch.culture?.state === 'mixed') {
      throw new HopV55ScenarioPlanningError('La culture est composée; le contrat de branche à souche unique ne peut pas remplacer ses membres. La comparaison reste disponible.');
    }
  }
  if (edits.pitchTempC?.action === 'set' && !isFiniteNumber(edits.pitchTempC.value)) {
    throw new HopV55ScenarioPlanningError('La température d’ensemencement doit être une valeur exacte.');
  }
  if (edits.fermentation?.action === 'set') assertExplicitFermentation(edits.fermentation.value);

  applyInputField({ branch, branchId, field: 'volumeL', path: 'recipe.volumeL', edit: edits.volumeL,
    label: 'Volume futur', unit: 'L', valueDescription: value => `Volume final explicitement choisi : ${value} L. Aucune masse ni quantité n’est mise à l’échelle.` });
  if (edits.volumeL && edits.volumeL.action !== 'keep') {
    const programOverrides = { ...(branch.programOverrides ?? {}) };
    if (edits.volumeL.action === 'reset') {
      delete programOverrides.volumeL;
      demoteSelectedPath(branch, 'program.volumeL');
    } else if (hasProgram) {
      programOverrides.volumeL = edits.volumeL.value;
      keepSelectedAssumption(branch, planningAssumption({ branchId, path: 'program.volumeL', label: 'Volume du programme de branche',
        value: edits.volumeL.value, unit: 'L', explanation: `Le même volume explicite est appliqué au programme de scénario; les masses des ajouts restent inchangées.` }));
    }
    if (Object.keys(programOverrides).length) branch.programOverrides = programOverrides;
    else delete branch.programOverrides;
  }
  if (edits.volumeL?.action === 'set' && hasProgram && branch.inputOverrides?.volumeL !== branch.programOverrides?.volumeL) {
    throw new HopV55ScenarioPlanningError('Le volume de l’entrée et du programme doit rester identique.');
  }

  applyInputField({ branch, branchId, field: 'yeastId', path: 'recipe.yeastId', edit: edits.yeastId,
    label: 'Souche du scénario', valueDescription: value => value === null ? 'La souche reste non résolue dans cette projection.' : `Identité de souche choisie explicitement : ${value}.` });
  if (yeastEdit && yeastEdit.action === 'reset') restorePreviousCulture(branch);
  if (yeastEdit && yeastEdit.action === 'set') {
    const selectedYeastId = yeastEdit.value;
    rememberPreviousCulture(branch, branchId);
    const selectedYeast = selectedYeastId === null ? undefined : getHopV55PlanningYeasts(prepared).find(row => row.id === selectedYeastId);
    branch.culture = selectedYeast
      ? { state: 'single', members: [{ yeastId: selectedYeast.id, name: selectedYeast.name, source: clone(selectedYeast.source) }],
          explanation: 'Hypothèse de souche unique pour cette branche; la culture réellement consignée reste inchangée.' }
      : { state: 'unknown', members: [], explanation: 'Souche non résolue explicitement pour cette projection; aucune identité n’est inventée.' };
  }
  applyInputField({ branch, branchId, field: 'pitchTempC', path: 'recipe.pitchTempC', edit: edits.pitchTempC,
    label: 'Température d’ensemencement', unit: '°C', valueDescription: value => `Consigne d’ensemencement future explicitement choisie : ${value} °C.` });
  applyInputField({ branch, branchId, field: 'fermentation', path: 'recipe.fermentation', edit: edits.fermentation,
    label: 'Paliers de fermentation', valueDescription: value => `Paliers explicitement déclarés : ${JSON.stringify(value)}.` });

  for (const field of ['ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget'] as const) {
    applyBeerTarget({ branch, prepared, branchId, field, edit: edits.beerTargets?.[field] });
  }
  applyStyle({ branch, prepared, context: input.context, branchId, edit: edits.style });
  const baseBeerContext = baselineBeerContext(prepared);
  if (baseBeerContext && branch.beerContext && same(branch.beerContext, baseBeerContext)) delete branch.beerContext;

  let nextTarget: BrewingScenarioRequest['target'] | undefined;
  const axisEdits = Object.entries(edits.axisTargets ?? {});
  if (axisEdits.length) {
    const axes = new Map(getHopV55PlanningAxes(prepared).map(axis => [axis.id, axis]));
    const target = clone(input.target ?? {});
    for (const [axisId, edit] of axisEdits) {
      if (edit.action === 'keep') continue;
      const preparedAxis = axes.get(axisId);
      if (!preparedAxis) throw new HopV55ScenarioPlanningError(`L’axe « ${axisId} » n’est plus chargé; relis les définitions avant de modifier sa cible.`);
      const axis = currentAxisForEdit(preparedAxis, input.context);
      const path = `target.${axis.id}`;
      if (edit.action === 'reset') {
        delete target[axisId];
        demoteSelectedPath(branch, path);
        continue;
      }
      const setEdit = edit;
      if (setEdit.action !== 'set') throw new HopV55ScenarioPlanningError('Action de cible inconnue.');
      const range = setEdit.value;
      if (!validHopRange(range) || range.min < axis.scale.min || range.max > axis.scale.max) {
        throw new HopV55ScenarioPlanningError(`La cible de ${axis.name} doit rester dans son échelle ${axis.scale.min}–${axis.scale.max}.`);
      }
      target[axisId] = clone(range);
      keepSelectedAssumption(branch, planningAssumption({ branchId, path, label: `Cible de ${axis.name}`,
        range, unit: 'axisScale', basis: `${axis.id}@${axis.version}`, source: axis.source,
        explanation: `Plage cible explicitement saisie dans l’échelle de ${axis.name}. Aucun point central n’est choisi.` }));
    }
    if (!same(target, input.target ?? {})) nextTarget = target;
  }

  if (!hasBranchContent(branch)) throw new HopV55ScenarioPlanningError('Choisis au moins une consigne, cible ou référence pour créer cette branche.');

  return { branch, ...(nextTarget ? { target: nextTarget } : {}) };
}
