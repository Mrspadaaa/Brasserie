import type { BrewingStyleGuide, BrewingStyleRef } from '../../../functions/src/brewingStyleSchema';
import type { HopYeast } from '../../../functions/src/hopPredictionSchema';
import { assertHopRecipeInput, type HopRecipeInput } from '../../../functions/src/hopRecipePrediction';
import {
  assertBrewingScenarioRequest,
  assertBrewingScenarioResult,
  brewingScenarioInputReference,
  type BrewingScenarioAssumption,
  type BrewingScenarioRequest,
  type BrewingScenarioResult,
} from '../../domain/brewingScenario';
import { brewingScenarioSnapshotReference, type BrewingScenarioSnapshotV1 } from '../../domain/brewingScenarioDossier';
import { recipeReadiness } from '../../domain/recipeValidation';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import { programFingerprint } from '../../domain/hopDecision/programs';
import type { HopDecisionMaterial, HopDecisionProgram, HopProgramAddition, HopProgramProposal, HopUse } from '../../domain/hopDecision/types';
import type { Fermentable, HopIngredient, Recipe, RecipeStep, YeastSpec } from '../../types';
import type { BrewingReferenceIdentityV1 } from '../../domain/brewingReference';
import type { HopV55Intent } from './contracts';

export const HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT = 'hop-v55-future-recipe-draft-v1' as const;
export const HOP_V55_FUTURE_RECIPE_MATERIALIZATION_FORMAT = 'hop-v55-future-recipe-materialization-v1' as const;
export const HOP_V55_FUTURE_RECIPE_MASS_RECOMPUTE_FORMAT = 'hop-v55-future-recipe-mass-recompute-v1' as const;

export interface HopV55FutureRecipeDraftIdentity {
  draftId: string;
  revision: number;
  predecessor?: { draftId: string; revision: number; contentReference: string };
}

export interface HopV55FutureRecipeAlphaDeclaration {
  value?: number;
  /** A working recipe choice, not a new lot analysis. */
  reason?: string;
}

/** Only human-declared recipe fields belong here. J5 outputs and catalogue facts are not copied into them. */
export interface HopV55FutureRecipeDeclaredFields {
  name?: string;
  style?: string;
  styleRef?: BrewingStyleRef;
  /** Must agree with the exact scenario volume when J5 has one. No hop quantity is rescaled. */
  volumeL?: number;
  boilMin?: number;
  ogTarget?: number | null;
  fgTarget?: number | null;
  abvTarget?: number | null;
  ibuTarget?: number;
  fermentables?: Array<Partial<Fermentable>>;
  /** Narrow declaration: documentary sheets, stock links and old recipe design are never inherited. */
  yeast?: Pick<YeastSpec, 'name' | 'hopIndexId' | 'strain' | 'form' | 'qty' | 'unit' | 'pitchTempC'>;
  fermentation?: Recipe['fermentation'];
  mash?: Recipe['mash'];
  steps?: RecipeStep[];
  notes?: string[];
  /** Explicitly re-plan a source operation marked performed as a future addition. */
  schedulePerformedAdditionIds?: string[];
  /** A scalar required by Recipe is chosen as a working value with a reason, never an inferred assay. */
  alphaChoices?: Record<string, HopV55FutureRecipeAlphaDeclaration>;
  /** User-declared future-program mass for a J5 operation whose mass was unknown; requires a new J5 preview. */
  hopMassChoices?: Record<string, number>;
}

export interface HopV55FutureRecipeSourceMaterialV1 {
  id: string;
  materialReference: string;
  /** Exact J5 material snapshot, including its old stock reading, retained as provenance only. */
  material: HopDecisionMaterial;
}

export interface HopV55FutureRecipeAdditionV1 {
  additionId: string;
  materialId: string;
  materialReference: string;
  material: HopDecisionMaterial;
  /** Exact final J1 choice with `status` set to planned for this future process. */
  addition: HopProgramAddition;
  sourceStatus: 'planned' | 'performed';
}

export interface HopV55FutureRecipeOperationDispositionV1 {
  additionId: string;
  materialId: string;
  sourceStatus: 'planned' | 'performed';
  futureStatus: 'planned' | 'excludedPerformed';
}

export interface HopV55FutureRecipeHypotheticalBaselineV1 {
  kind: 'hypothetical';
  label: string;
  input: HopRecipeInput;
  program: HopDecisionProgram;
  /** Omitted so a new exploration resolves current inventory instead of inheriting stale stock. */
  materials?: { hops: HopDecisionMaterial[] };
}

export interface HopV55FutureRecipeMassRecomputeProposalV1 {
  format: typeof HOP_V55_FUTURE_RECIPE_MASS_RECOMPUTE_FORMAT;
  draftId: string;
  draftRevision: number;
  draftReference: string;
  sourceScenarioReference: string;
  sourceBranchReference: string;
  proposedBaseline: HopV55FutureRecipeHypotheticalBaselineV1;
  changedAdditionIds: string[];
  contentReference: string;
}

export type HopV55FutureRecipeMassRecomputePreparation =
  | { status: 'ready'; proposal: HopV55FutureRecipeMassRecomputeProposalV1 }
  | { status: 'needsCompletion'; issues: Array<{ field: string; message: string }> }
  | { status: 'blocked'; reason: string };

export interface HopV55FutureRecipeDraftV1 {
  format: typeof HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT;
  draftId: string;
  revision: number;
  predecessor: { draftId: string; revision: number; contentReference: string } | null;
  contentReference: string;
  origin: {
    kind: 'hypotheticalScenario';
    baselineKind: 'hypothetical';
    scenarioId: string;
    resultRevision: number;
    snapshotReference: string;
    resultReference: string;
    requestReference: string;
    branchId: string;
    branchReference: string;
    branchApplicability: BrewingScenarioResult['branches'][number]['applicability'];
    adoptedReference: BrewingReferenceIdentityV1;
    intent: HopV55Intent;
    /** Exact scenario request and selected branch facts; no Recipe source is created. */
    request: BrewingScenarioRequest;
    sourceProgram: HopDecisionProgram;
    sourceProgramProposal?: NonNullable<BrewingScenarioResult['branches'][number]['programProposal']>;
    sourceInput: HopRecipeInput;
    sourceProgramReference: string;
    sourceBranchRequestReference: string;
  };
  operationDispositions: HopV55FutureRecipeOperationDispositionV1[];
  additions: HopV55FutureRecipeAdditionV1[];
  sourceMaterials: HopV55FutureRecipeSourceMaterialV1[];
  /** An explicit no-Recipe baseline for a later J5 exploration. */
  hypotheticalBaseline: HopV55FutureRecipeHypotheticalBaselineV1;
  declaredFields: HopV55FutureRecipeDeclaredFields;
}

export interface HopV55FutureRecipeCompletion {
  draft: 'readyToSaveLocally';
  recipeSave: 'notMaterialized' | 'readyToSave' | 'needsCorrection';
  brew: 'notMaterialized' | 'ready' | 'incomplete';
  missing: Array<{ field: string; message: string }>;
  unknownAlphaAdditionIds: string[];
  excludedPerformedAdditionIds: string[];
}

export interface HopV55FutureRecipeDraftPreview {
  kind: 'futureRecipeDraft';
  scenarioLabel: string;
  baselineKind: 'hypothetical';
  volumeL: number | null;
  additions: Array<{
    additionId: string;
    materialId: string;
    materialName: string;
    grams: number | null;
    use: HopUse;
    sourceStatus: 'planned' | 'performed';
    futureStatus: 'planned' | 'excludedPerformed';
    contactHours?: number | null;
    temperatureC?: number | null;
    boilMinutes?: number | null;
  }>;
  recipeName?: string;
  recipeStyle?: string;
  sourceScenarioReference: string;
  sourceBranchReference: string;
  sourceBranchApplicability: BrewingScenarioResult['branches'][number]['applicability'];
  j1Applicability?: HopProgramProposal['applicability'];
  stock?: HopProgramProposal['stock'];
  conditions: string[];
}

export type HopV55FutureRecipeDraftPreparation =
  | { status: 'ready'; draft: HopV55FutureRecipeDraftV1; completion: HopV55FutureRecipeCompletion; preview: HopV55FutureRecipeDraftPreview }
  | { status: 'blocked'; reason: string };

export type HopV55FutureRecipeDraftRead =
  | { status: 'available'; draft: HopV55FutureRecipeDraftV1 }
  | { status: 'invalid'; reason: string };

export type HopV55FutureRecipeDraftInspection =
  | { status: 'available'; draft: HopV55FutureRecipeDraftV1; completion: HopV55FutureRecipeCompletion; preview: HopV55FutureRecipeDraftPreview }
  | { status: 'invalid'; reason: string };

export interface HopV55FutureRecipeCurrentReferences {
  snapshot: BrewingScenarioSnapshotV1;
  adoptedReference: BrewingReferenceIdentityV1 | null;
  materials: HopDecisionMaterial[];
  styles?: BrewingStyleGuide[];
  yeasts?: HopYeast[];
}

export interface HopV55FutureRecipeReadiness {
  /** A local draft is durable independently of Recipe save or immediate brewing readiness. */
  save: 'readyToSave' | 'invalid';
  brew: 'ready' | 'incomplete' | 'invalid';
  recipeStatus: ReturnType<typeof recipeReadiness>['status'];
  invalid: ReturnType<typeof recipeReadiness>['invalid'];
  missing: ReturnType<typeof recipeReadiness>['missing'];
  additionalMissing: Array<{ field: string; message: string }>;
  alphaUnknownAdditionIds: string[];
  excludedPerformedAdditionIds: string[];
}

export interface HopV55FutureRecipeMaterializationReceiptV1 {
  format: typeof HOP_V55_FUTURE_RECIPE_MATERIALIZATION_FORMAT;
  receiptId: string;
  recipeId: string;
  recipeReference: string;
  draftId: string;
  draftRevision: number;
  draftReference: string;
  sourceScenarioId: string;
  sourceSnapshotReference: string;
  sourceResultReference: string;
  sourceBranchId: string;
  sourceBranchReference: string;
  adoptedReference: BrewingReferenceIdentityV1;
  createdAt: string;
  recipe: Recipe;
  readiness: HopV55FutureRecipeReadiness;
  /** Links every Recipe hop row to its selected J1 operation and source material snapshot. */
  hopMappings: Array<{ recipeIndex: number; additionId: string; materialId: string; materialReference: string;
    material: HopDecisionMaterial; addition: HopProgramAddition; sourceStatus: 'planned' | 'performed'; alphaChoice: { value: number; reason: string } }>;
  excludedPerformedAdditionIds: string[];
  contentReference: string;
}

export type HopV55FutureRecipeMaterializationResult =
  | { status: 'ready'; recipe: Recipe; receipt: HopV55FutureRecipeMaterializationReceiptV1 }
  | { status: 'needsCompletion'; completion: HopV55FutureRecipeCompletion; issues: Array<{ field: string; message: string }> }
  | { status: 'blocked'; reason: string };

type Row = Record<string, unknown>;
const isRow = (value: unknown): value is Row => !!value && typeof value === 'object' && !Array.isArray(value);
const hasText = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clone = <T,>(value: T): T => structuredClone(value);
const same = (left: unknown, right: unknown): boolean => hopAdviceContentReference('hop-v55-future-draft-equality-v1', left)
  === hopAdviceContentReference('hop-v55-future-draft-equality-v1', right);

function onlyKeys(value: unknown, allowed: readonly string[], label: string): void {
  if (!isRow(value) || Object.keys(value).some(key => !allowed.includes(key))) throw Error(`${label} contient un champ inconnu ou une structure invalide.`);
}

function materialIdentityReference(material: HopDecisionMaterial): string {
  const identity = clone(material) as HopDecisionMaterial & { availableGrams?: number };
  delete identity.availableGrams;
  if (identity.lot) {
    const lot = clone(identity.lot) as typeof identity.lot & { stockItemRef?: string };
    delete lot.stockItemRef;
    identity.lot = lot;
  }
  delete identity.stockItemRef;
  return hopAdviceContentReference('hop-v55-future-draft-material-identity-v1', identity);
}

function contentReference(value: Omit<HopV55FutureRecipeDraftV1, 'contentReference'>): string {
  return hopAdviceContentReference(HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT, value);
}

function materializationContentReference(value: Omit<HopV55FutureRecipeMaterializationReceiptV1, 'contentReference'>): string {
  return hopAdviceContentReference(HOP_V55_FUTURE_RECIPE_MATERIALIZATION_FORMAT, value);
}

function validateIntent(value: unknown): asserts value is HopV55Intent {
  onlyKeys(value, ['question', 'criteria'], 'Intention de brassage');
  const intent = value as HopV55Intent;
  if (typeof intent.question !== 'string' || !Array.isArray(intent.criteria)) throw Error('Intention de brassage absente.');
  const ids = new Set<string>();
  for (const criterion of intent.criteria) {
    onlyKeys(criterion, ['id', 'label', 'direction', 'axisId', 'familyId'], 'Critère de brassage');
    if (!hasText(criterion.id) || !hasText(criterion.label) || ids.has(criterion.id)
      || !['increase', 'decrease', 'keep', 'exclude', 'investigate'].includes(criterion.direction)
      || criterion.axisId !== undefined && !hasText(criterion.axisId)
      || criterion.familyId !== undefined && !hasText(criterion.familyId)) throw Error('Critère d’intention invalide ou dupliqué.');
    ids.add(criterion.id);
  }
}

function validateReference(value: unknown): asserts value is BrewingReferenceIdentityV1 {
  onlyKeys(value, ['id', 'version', 'contentReference'], 'Référence adoptée');
  const ref = value as BrewingReferenceIdentityV1;
  if (!hasText(ref.id) || !hasText(ref.version) || !hasText(ref.contentReference)) throw Error('Référence adoptée incomplète.');
}

function declaredFieldsShapeError(value: unknown): string | undefined {
  try {
    onlyKeys(value, ['name', 'style', 'styleRef', 'volumeL', 'boilMin', 'ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget',
      'fermentables', 'yeast', 'fermentation', 'mash', 'steps', 'notes', 'schedulePerformedAdditionIds', 'alphaChoices', 'hopMassChoices'], 'Champs déclarés');
    const fields = value as HopV55FutureRecipeDeclaredFields;
    if (fields.name !== undefined && typeof fields.name !== 'string') throw Error('Nom de recette invalide.');
    if (fields.style !== undefined && typeof fields.style !== 'string') throw Error('Style de recette invalide.');
    if (fields.styleRef !== undefined) {
      onlyKeys(fields.styleRef, ['guideId', 'version', 'styleId'], 'Référence de style');
      if (![fields.styleRef.guideId, fields.styleRef.version, fields.styleRef.styleId].every(hasText)) throw Error('Référence de style incomplète.');
    }
    for (const field of ['volumeL', 'boilMin', 'ibuTarget'] as const) {
      if (fields[field] !== undefined && (!finite(fields[field]) || fields[field]! < 0)) throw Error(`Champ ${field} invalide.`);
    }
    for (const field of ['ogTarget', 'fgTarget', 'abvTarget'] as const) {
      if (fields[field] !== undefined && fields[field] !== null && !finite(fields[field])) throw Error(`Champ ${field} invalide.`);
    }
    if (fields.fermentables !== undefined && (!Array.isArray(fields.fermentables)
      || fields.fermentables.some(item => {
        try {
          onlyKeys(item, ['stockItemRef', 'name', 'weightKg', 'pct', 'kind', 'use', 'colorEbc', 'potentialPpg', 'fermentabilityPct', 'dayOffset'], 'Fermentescible déclaré');
          return item.name !== undefined && typeof item.name !== 'string'
            || item.stockItemRef !== undefined && !hasText(item.stockItemRef)
            || item.weightKg !== undefined && (!finite(item.weightKg) || item.weightKg < 0)
            || item.pct !== undefined && !finite(item.pct)
            || item.kind !== undefined && !['grain', 'sucre', 'extrait', 'fruit', 'lactose'].includes(item.kind)
            || item.use !== undefined && !['empatage', 'ebullition', 'fermentation'].includes(item.use)
            || item.colorEbc !== undefined && !finite(item.colorEbc)
            || item.potentialPpg !== undefined && !finite(item.potentialPpg)
            || item.fermentabilityPct !== undefined && !finite(item.fermentabilityPct)
            || item.dayOffset !== undefined && (!finite(item.dayOffset) || item.dayOffset < 0);
        } catch { return true; }
      }))) throw Error('Formulation des fermentescibles invalide.');
    if (fields.yeast !== undefined) {
      onlyKeys(fields.yeast, ['name', 'hopIndexId', 'strain', 'form', 'qty', 'unit', 'pitchTempC'], 'Déclaration de levure');
      if (fields.yeast.name !== undefined && typeof fields.yeast.name !== 'string') throw Error('Nom de levure invalide.');
      if (fields.yeast.hopIndexId !== undefined && !hasText(fields.yeast.hopIndexId)) throw Error('Identité de levure invalide.');
      if (fields.yeast.strain !== undefined && typeof fields.yeast.strain !== 'string') throw Error('Souche de levure invalide.');
      if (fields.yeast.form !== undefined && !['sèche', 'liquide', 'levain'].includes(fields.yeast.form)) throw Error('Forme de levure invalide.');
      if (fields.yeast.qty !== undefined && (!finite(fields.yeast.qty) || fields.yeast.qty < 0)) throw Error('Quantité de levure invalide.');
      if (fields.yeast.unit !== undefined && typeof fields.yeast.unit !== 'string') throw Error('Unité de levure invalide.');
      if (fields.yeast.pitchTempC !== undefined && !finite(fields.yeast.pitchTempC)) throw Error('Cible d’ensemencement invalide.');
    }
    if (fields.fermentation !== undefined && (!Array.isArray(fields.fermentation) || fields.fermentation.some(step =>
      !isRow(step) || !hasText(step.name) || !finite(step.tempC) || !finite(step.days) || step.days < 0
      || !['primaire', 'reposDiacetyle', 'garde', 'refermentation', 'ajout'].includes(step.kind)))) throw Error('Paliers de fermentation invalides.');
    if (fields.steps !== undefined && (!Array.isArray(fields.steps) || fields.steps.some(step => !isRow(step)
      || typeof step.step !== 'string' || !finite(step.tempC) || !finite(step.durationMin) || typeof step.notes !== 'string'))) {
      throw Error('Étapes de recette invalides.');
    }
    if (fields.notes !== undefined && (!Array.isArray(fields.notes) || fields.notes.some(note => typeof note !== 'string'))) throw Error('Notes de recette invalides.');
    if (fields.schedulePerformedAdditionIds !== undefined && (!Array.isArray(fields.schedulePerformedAdditionIds)
      || fields.schedulePerformedAdditionIds.some(id => !hasText(id)) || new Set(fields.schedulePerformedAdditionIds).size !== fields.schedulePerformedAdditionIds.length)) {
      throw Error('Choix de replanification des ajouts effectués invalide.');
    }
    if (fields.alphaChoices !== undefined) {
      if (!isRow(fields.alphaChoices)) throw Error('Choix alpha invalide.');
      for (const [id, choice] of Object.entries(fields.alphaChoices)) {
        onlyKeys(choice, ['value', 'reason'], 'Choix alpha');
        if (!hasText(id) || choice.value !== undefined && (!finite(choice.value) || choice.value < 0 || choice.value > 100)
          || choice.reason !== undefined && typeof choice.reason !== 'string') throw Error('Choix alpha invalide.');
      }
    }
    if (fields.hopMassChoices !== undefined) {
      if (!isRow(fields.hopMassChoices)) throw Error('Masses de recette déclarées invalides.');
      for (const [id, grams] of Object.entries(fields.hopMassChoices)) {
        if (!hasText(id) || !finite(grams) || grams < 0) throw Error('Une masse de recette doit être un nombre fini positif ou nul.');
      }
    }
    return undefined;
  } catch (error) { return (error as Error).message; }
}

function safeIdentity(identity: HopV55FutureRecipeDraftIdentity): string | undefined {
  if (!hasText(identity.draftId) || identity.draftId.length > 120 || /[\/\\]/.test(identity.draftId)
    || !Number.isSafeInteger(identity.revision) || identity.revision < 1) return 'Identité de brouillon invalide.';
  const previous = identity.predecessor;
  if (previous && (!hasText(previous.draftId) || !Number.isSafeInteger(previous.revision) || previous.revision < 1
    || previous.draftId !== identity.draftId || previous.revision !== identity.revision - 1 || !hasText(previous.contentReference))) {
    return 'La révision doit référencer exactement son prédécesseur immédiat.';
  }
  if (!previous && identity.revision !== 1) return 'Une première révision doit commencer à 1 et ne pas inventer de prédécesseur.';
  return undefined;
}

function sourceAdditionMatchesInput(addition: HopProgramAddition, input: HopRecipeInput, program: HopDecisionProgram): boolean {
  const modeled = input.additions.find(row => row.id === addition.id);
  if (!modeled || modeled.triplet.timing !== addition.use) return false;
  if (program.volumeL !== null && program.volumeL > 0 && addition.grams !== null) {
    const dose = addition.grams / program.volumeL;
    if (modeled.triplet.doseGL === null || Math.abs(modeled.triplet.doseGL - dose) > Math.max(1e-9, Math.abs(dose) * 1e-9)) return false;
  } else if (addition.grams === null && modeled.triplet.doseGL !== null) return false;
  const expectedContact = addition.use === 'boil' && addition.boilMinutes !== null && addition.boilMinutes !== undefined
    ? addition.boilMinutes / 60 : addition.contactHours ?? null;
  if (expectedContact !== null && modeled.triplet.contactHours !== expectedContact
    || expectedContact === null && modeled.triplet.contactHours !== null) return false;
  if (addition.temperatureC !== undefined && modeled.triplet.temperatureC !== addition.temperatureC
    || addition.temperatureC === undefined && modeled.triplet.temperatureC !== null) return false;
  return true;
}

function recipeCompletion(draft: HopV55FutureRecipeDraftV1): HopV55FutureRecipeCompletion {
  const fields = draft.declaredFields;
  const missing: HopV55FutureRecipeCompletion['missing'] = [];
  if (!fields.name?.trim()) missing.push({ field: 'name', message: 'Nom de recette à déclarer.' });
  if (!(fields.volumeL ?? draft.hypotheticalBaseline.program.volumeL) || (fields.volumeL ?? draft.hypotheticalBaseline.program.volumeL)! <= 0) {
    missing.push({ field: 'volumeL', message: 'Volume final absent du programme et du brouillon.' });
  }
  if (fields.style === undefined || !fields.style.trim()) missing.push({ field: 'style', message: 'Style à déclarer; aucun style de scénario n’est appliqué automatiquement.' });
  if (fields.boilMin === undefined) missing.push({ field: 'boilMin', message: 'Durée d’ébullition à choisir; aucune durée standard n’est appliquée.' });
  if (!fields.fermentables) missing.push({ field: 'fermentables', message: 'Formulation à compléter; aucune recette de grains n’est inventée.' });
  if (!fields.yeast?.name?.trim()) missing.push({ field: 'yeast', message: 'Culture à choisir ou déclarer.' });
  if (fields.yeast && (fields.yeast.qty === undefined || fields.yeast.qty === 0 || !fields.yeast.unit?.trim())) {
    missing.push({ field: 'yeast.quantity', message: 'Dose de levure et unité à déclarer.' });
  }
  for (const row of draft.additions) {
    if (row.addition.grams === null) {
      const proposedMass = fields.hopMassChoices?.[row.additionId];
      missing.push({ field: `hops.${row.additionId}.grams`, message: proposedMass === undefined
        ? `Masse J5 inconnue pour ${row.material.name}; déclare une masse avant de préparer le nouveau programme.`
        : `${proposedMass} g est une masse proposée pour ${row.material.name}; relance J5 sur ce programme avant l’export.` });
    }
  }
  const unknownAlphaAdditionIds = draft.additions.filter(row => {
    const choice = fields.alphaChoices?.[row.additionId];
    return choice?.value === undefined || choice.value <= 0 || !choice.reason?.trim();
  }).map(row => row.additionId);
  const excludedPerformedAdditionIds = draft.operationDispositions.filter(row => row.futureStatus === 'excludedPerformed').map(row => row.additionId);
  return { draft: 'readyToSaveLocally', recipeSave: 'notMaterialized', brew: 'notMaterialized', missing,
    unknownAlphaAdditionIds, excludedPerformedAdditionIds };
}

function previewFor(draft: HopV55FutureRecipeDraftV1): HopV55FutureRecipeDraftPreview {
  const nameById = new Map(draft.sourceMaterials.map(row => [row.id, row.material.name]));
  const disposition = new Map(draft.operationDispositions.map(row => [row.additionId, row.futureStatus]));
  const sourceStatus = new Map(draft.operationDispositions.map(row => [row.additionId, row.sourceStatus]));
  const operations = [
    ...draft.additions.map(row => ({ additionId: row.additionId, materialId: row.materialId,
      materialName: row.material.name, grams: row.addition.grams, use: row.addition.use,
      sourceStatus: row.sourceStatus, futureStatus: 'planned' as const,
      ...(row.addition.contactHours !== undefined ? { contactHours: row.addition.contactHours } : {}),
      ...(row.addition.temperatureC !== undefined ? { temperatureC: row.addition.temperatureC } : {}),
      ...(row.addition.boilMinutes !== undefined ? { boilMinutes: row.addition.boilMinutes } : {}) })),
    ...draft.operationDispositions.filter(row => row.futureStatus === 'excludedPerformed').map(row => {
      const material = draft.sourceMaterials.find(source => source.id === row.materialId)?.material;
      const original = draft.origin.sourceProgram.additions.find(addition => addition.id === row.additionId)!;
      return { additionId: row.additionId, materialId: row.materialId,
        materialName: material?.name ?? nameById.get(row.materialId) ?? row.materialId,
        grams: original.grams, use: original.use, sourceStatus: sourceStatus.get(row.additionId)!, futureStatus: disposition.get(row.additionId)!,
        ...(original.contactHours !== undefined ? { contactHours: original.contactHours } : {}),
        ...(original.temperatureC !== undefined ? { temperatureC: original.temperatureC } : {}),
        ...(original.boilMinutes !== undefined ? { boilMinutes: original.boilMinutes } : {}) };
    }),
  ];
  return { kind: 'futureRecipeDraft', scenarioLabel: draft.origin.intent.question || 'Scénario hypothétique choisi',
    baselineKind: 'hypothetical', volumeL: draft.hypotheticalBaseline.program.volumeL,
    additions: operations, ...(draft.declaredFields.name !== undefined ? { recipeName: draft.declaredFields.name } : {}),
    ...(draft.declaredFields.style !== undefined ? { recipeStyle: draft.declaredFields.style } : {}),
    sourceScenarioReference: draft.origin.snapshotReference, sourceBranchReference: draft.origin.branchReference,
    sourceBranchApplicability: draft.origin.branchApplicability,
    ...(draft.origin.sourceProgramProposal ? { j1Applicability: draft.origin.sourceProgramProposal.applicability,
      stock: clone(draft.origin.sourceProgramProposal.stock) } : {}),
    conditions: clone(draft.origin.sourceProgramProposal?.conditions ?? []) };
}

function sealDraft(body: Omit<HopV55FutureRecipeDraftV1, 'contentReference'>): HopV55FutureRecipeDraftV1 {
  return { ...body, contentReference: contentReference(body) };
}

/**
 * Prepare a durable local future-recipe draft from an exact hypothetical J5 branch.
 * No Recipe is made, no source Recipe ID is fabricated, and no engine is called here.
 */
export function prepareHopV55FutureRecipeDraft(input: {
  identity: HopV55FutureRecipeDraftIdentity;
  result: BrewingScenarioResult;
  snapshot: BrewingScenarioSnapshotV1;
  branchId: string;
  adoptedReference: BrewingReferenceIdentityV1;
  intent: HopV55Intent;
  declaredFields?: HopV55FutureRecipeDeclaredFields;
}): HopV55FutureRecipeDraftPreparation {
  try {
    const identityError = safeIdentity(input.identity);
    if (identityError) return { status: 'blocked', reason: identityError };
    assertBrewingScenarioResult(input.result);
    assertBrewingScenarioRequest(input.result.requestSnapshot);
    validateReference(input.adoptedReference);
    validateIntent(input.intent);
    if (input.snapshot.formatVersion !== 1 || brewingScenarioSnapshotReference(input.snapshot) !== input.result.reference
      || input.snapshot.result.reference !== input.result.reference || !same(input.snapshot.result, input.result)) {
      return { status: 'blocked', reason: 'Le snapshot local ne correspond pas exactement au résultat de scénario affiché.' };
    }
    const request = input.result.requestSnapshot;
    if (request.baseline.kind !== 'hypothetical') return { status: 'blocked', reason: 'Un brouillon de future recette exige une base hypothétique explicite, sans recette source.' };
    const requestBranch = request.branches.find(row => row.id === input.branchId);
    const branch = input.result.branches.find(row => row.id === input.branchId);
    if (!requestBranch || !branch || !branch.program || branch.program.stage !== 'planning') {
      return { status: 'blocked', reason: 'La branche retenue ne porte pas de programme futur de brassage lié.' };
    }
    if (branch.programProposal && (programFingerprint(branch.programProposal.program) !== programFingerprint(branch.program)
      || !same(branch.programProposal.changes, requestBranch.programChanges ?? []))) {
      return { status: 'blocked', reason: 'La proposition de programme de la branche ne correspond pas à sa demande J1 exacte.' };
    }
    if ((branch.program.volumeL ?? 0) !== branch.input.volumeL) {
      return { status: 'blocked', reason: 'Le volume du programme diverge de l’entrée de la prévision; un nouveau scénario est nécessaire.' };
    }
    const fields = clone(input.declaredFields ?? {});
    const fieldError = declaredFieldsShapeError(fields);
    if (fieldError) return { status: 'blocked', reason: fieldError };
    if (fields.volumeL !== undefined && branch.program.volumeL !== null && Math.abs(fields.volumeL - branch.program.volumeL) > 1e-9) {
      return { status: 'blocked', reason: 'Le volume déclaré diverge du programme prévisionnel; relance un scénario avec ce volume avant le brouillon.' };
    }
    const additions = branch.program.additions;
    const additionIds = new Set<string>();
    const materialById = new Map(branch.dependencySnapshot.decisionMaterials.map(material => [material.id, material]));
    const referencedMaterialIds = new Set<string>();
    for (const addition of additions) {
      if (!hasText(addition.id) || additionIds.has(addition.id) || !hasText(addition.materialId)
        || addition.grams !== null && (!finite(addition.grams) || addition.grams < 0)) {
        return { status: 'blocked', reason: `L’ajout ${addition.id || 'sans identité'} contient une identité ou une masse invalide.` };
      }
      additionIds.add(addition.id);
      const material = materialById.get(addition.materialId);
      if (!material || ![material.variety, material.lot, material.product].some(Boolean)) {
        return { status: 'blocked', reason: `La matière ${addition.materialId} n’est pas résolue comme référence physique exacte.` };
      }
      if (!sourceAdditionMatchesInput(addition, branch.input, branch.program)) {
        return { status: 'blocked', reason: `L’ajout ${addition.id} diverge de son entrée J5; relance la prévision avant adoption.` };
      }
      const modeled = branch.input.additions.find(row => row.id === addition.id)!;
      if (material.variety && modeled.triplet.varietyId !== material.variety.id
        || material.lot && modeled.triplet.lotId !== material.lot.id) {
        return { status: 'blocked', reason: `La variété ou le lot physique de ${addition.id} diffère de la référence de matière; recharge les références avant adoption.` };
      }
      referencedMaterialIds.add(material.id);
    }
    const inputAdditionIds = branch.input.additions.map(row => row.id);
    if (inputAdditionIds.length !== additionIds.size || inputAdditionIds.some(id => !additionIds.has(id))) {
      return { status: 'blocked', reason: 'Les lignes du programme et celles de l’entrée J5 ne sont pas identiques.' };
    }
    const schedulePerformed = new Set(fields.schedulePerformedAdditionIds ?? []);
    if ([...schedulePerformed].some(id => !additions.some(addition => addition.id === id && addition.status === 'performed'))) {
      return { status: 'blocked', reason: 'Un ajout à replanifier ne correspond pas à une ligne marquée effectuée dans le scénario source.' };
    }
    if (Object.keys(fields.alphaChoices ?? {}).some(id => !additionIds.has(id))) {
      return { status: 'blocked', reason: 'Un alpha déclaré ne correspond à aucune ligne du programme choisi.' };
    }
    if (Object.keys(fields.hopMassChoices ?? {}).some(id => !additionIds.has(id)
      || additions.find(addition => addition.id === id)?.grams !== null)) {
      return { status: 'blocked', reason: 'Une masse de recette ne peut compléter que la masse inconnue d’une opération J5 conservée.' };
    }
    const sourceMaterials = [...referencedMaterialIds].map(id => {
      const material = clone(materialById.get(id)!);
      return { id, materialReference: materialIdentityReference(material), material };
    });
    const operationDispositions = additions.map(addition => ({ additionId: addition.id, materialId: addition.materialId,
      sourceStatus: addition.status,
      futureStatus: addition.status === 'planned' || schedulePerformed.has(addition.id) ? 'planned' as const : 'excludedPerformed' as const }));
    const includedIds = new Set(operationDispositions.filter(row => row.futureStatus === 'planned').map(row => row.additionId));
    const sourceProgramReference = programFingerprint(branch.program);
    const plannedAdditions = additions.filter(addition => includedIds.has(addition.id)).map(addition => {
      const material = materialById.get(addition.materialId)!;
      const additionMaterialReference = materialIdentityReference(material);
      return { additionId: addition.id, materialId: addition.materialId, materialReference: additionMaterialReference,
        material: clone(material), addition: { ...clone(addition), status: 'planned' as const }, sourceStatus: addition.status };
    });
    const program: HopDecisionProgram = {
      ...clone(branch.program), id: input.identity.draftId, revision: input.identity.revision,
      additions: plannedAdditions.map(row => clone(row.addition)),
    };
    programFingerprint(program);
    const selectedInput: HopRecipeInput = { ...clone(branch.input),
      additions: branch.input.additions.filter(row => includedIds.has(row.id)).map(clone) };
    const hypotheticalBaseline: HopV55FutureRecipeHypotheticalBaselineV1 = {
      kind: 'hypothetical', label: `Brouillon futur · ${input.intent.question || branch.label}`,
      input: selectedInput, program,
    };
    const body: Omit<HopV55FutureRecipeDraftV1, 'contentReference'> = {
      format: HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT,
      draftId: input.identity.draftId, revision: input.identity.revision,
      predecessor: input.identity.predecessor ? clone(input.identity.predecessor) : null,
      origin: {
        kind: 'hypotheticalScenario', baselineKind: 'hypothetical', scenarioId: input.result.scenarioId,
        resultRevision: input.result.revision, snapshotReference: input.snapshot.reference,
        resultReference: input.result.reference, requestReference: brewingScenarioInputReference(request),
        branchId: branch.id, branchReference: branch.reference, branchApplicability: branch.applicability,
        adoptedReference: clone(input.adoptedReference), intent: clone(input.intent), request: clone(request),
        sourceProgram: clone(branch.program), ...(branch.programProposal ? { sourceProgramProposal: clone(branch.programProposal) } : {}),
        sourceInput: clone(branch.input), sourceProgramReference,
        sourceBranchRequestReference: hopAdviceContentReference('hop-v55-future-draft-branch-request-v1', requestBranch),
      },
      operationDispositions,
      additions: plannedAdditions,
      sourceMaterials,
      hypotheticalBaseline,
      declaredFields: fields,
    };
    const draft = sealDraft(body);
    const read = readHopV55FutureRecipeDraft(draft);
    if (read.status !== 'available') return { status: 'blocked', reason: `Le brouillon construit ne passe pas sa validation locale : ${read.reason}` };
    return { status: 'ready', draft: read.draft, completion: recipeCompletion(read.draft), preview: previewFor(read.draft) };
  } catch (error) {
    return { status: 'blocked', reason: `Le scénario ne peut pas former un brouillon de future recette sans perte : ${(error as Error).message}` };
  }
}

/** Create a new immutable revision without recalculating the saved J5 snapshot. */
export function reviseHopV55FutureRecipeDraft(previousValue: unknown, input: {
  revision: number;
  declaredFields: HopV55FutureRecipeDeclaredFields;
}): HopV55FutureRecipeDraftPreparation {
  const prior = readHopV55FutureRecipeDraft(previousValue);
  if (prior.status !== 'available') return { status: 'blocked', reason: `Le brouillon précédent est illisible : ${prior.reason}` };
  const fieldError = declaredFieldsShapeError(input.declaredFields);
  if (fieldError) return { status: 'blocked', reason: fieldError };
  if (!Number.isSafeInteger(input.revision) || input.revision !== prior.draft.revision + 1) {
    return { status: 'blocked', reason: 'La correction doit créer la révision suivante sans réécrire le brouillon précédent.' };
  }
  const fields: HopV55FutureRecipeDeclaredFields = { ...clone(prior.draft.declaredFields), ...clone(input.declaredFields),
    ...(input.declaredFields.alphaChoices !== undefined ? { alphaChoices: clone(input.declaredFields.alphaChoices) } : {}) };
  if (fields.volumeL !== undefined && prior.draft.origin.sourceProgram.volumeL !== null
    && Math.abs(fields.volumeL - prior.draft.origin.sourceProgram.volumeL) > 1e-9) {
    return { status: 'blocked', reason: 'Le volume corrigé diverge du programme prévisionnel. Explore à nouveau ce volume avant une nouvelle version.' };
  }
  const sourceAdditionIds = new Set(prior.draft.origin.sourceProgram.additions.map(row => row.id));
  const sourceAdditionsById = new Map(prior.draft.origin.sourceProgram.additions.map(row => [row.id, row]));
  if ([...(fields.schedulePerformedAdditionIds ?? [])].some(id => !prior.draft.operationDispositions.some(row =>
    row.additionId === id && row.sourceStatus === 'performed'))) {
    return { status: 'blocked', reason: 'Le choix de replanifier un ajout effectué ne correspond pas à la source conservée.' };
  }
  if (Object.keys(fields.alphaChoices ?? {}).some(id => !sourceAdditionIds.has(id))) return { status: 'blocked', reason: 'Un choix alpha vise un ajout absent de la source conservée.' };
  if (Object.keys(fields.hopMassChoices ?? {}).some(id => !sourceAdditionIds.has(id) || sourceAdditionsById.get(id)?.grams !== null)) {
    return { status: 'blocked', reason: 'Une masse déclarée doit compléter une opération d’origine dont la masse est inconnue.' };
  }
  const dispositions = prior.draft.operationDispositions.map(row => ({ ...row,
    futureStatus: row.sourceStatus === 'planned' || (fields.schedulePerformedAdditionIds ?? []).includes(row.additionId)
      ? 'planned' as const : 'excludedPerformed' as const }));
  const addsById = new Map(prior.draft.origin.sourceProgram.additions.map(row => [row.id, row]));
  const selected = dispositions.filter(row => row.futureStatus === 'planned');
  const additions = selected.map(disposition => {
    const existing = prior.draft.sourceMaterials.find(row => row.id === disposition.materialId);
    const sourceAddition = addsById.get(disposition.additionId);
    if (!existing || !sourceAddition) throw Error('Une ligne d’origine manque dans le brouillon archivé.');
    return { additionId: disposition.additionId, materialId: disposition.materialId,
      materialReference: existing.materialReference, material: clone(existing.material),
      addition: { ...clone(sourceAddition), status: 'planned' as const }, sourceStatus: disposition.sourceStatus };
  });
  const program: HopDecisionProgram = { ...clone(prior.draft.hypotheticalBaseline.program), revision: input.revision,
    additions: additions.map(row => clone(row.addition)) };
  const inputIds = new Set(program.additions.map(row => row.id));
  const hypotheticalBaseline = { ...clone(prior.draft.hypotheticalBaseline), program,
    input: { ...clone(prior.draft.origin.sourceInput), additions: prior.draft.origin.sourceInput.additions.filter(row => inputIds.has(row.id)) } };
  const { contentReference: _previousReference, ...priorBody } = clone(prior.draft);
  const draft = sealDraft({ ...priorBody, revision: input.revision,
    predecessor: { draftId: prior.draft.draftId, revision: prior.draft.revision, contentReference: prior.draft.contentReference },
    additions, operationDispositions: dispositions, declaredFields: fields, hypotheticalBaseline });
  const read = readHopV55FutureRecipeDraft(draft);
  if (read.status !== 'available') return { status: 'blocked', reason: `La nouvelle révision ne passe pas sa validation locale : ${read.reason}` };
  return { status: 'ready', draft: read.draft, completion: recipeCompletion(read.draft), preview: previewFor(read.draft) };
}

/** Read and validate a local draft without prediction, persistence or catalogue access. */
export function readHopV55FutureRecipeDraft(value: unknown): HopV55FutureRecipeDraftRead {
  try {
    onlyKeys(value, ['format', 'draftId', 'revision', 'predecessor', 'contentReference', 'origin', 'operationDispositions',
      'additions', 'sourceMaterials', 'hypotheticalBaseline', 'declaredFields'], 'Brouillon de future recette');
    const raw = value as HopV55FutureRecipeDraftV1;
    if (raw.format !== HOP_V55_FUTURE_RECIPE_DRAFT_FORMAT || !hasText(raw.draftId) || raw.draftId.length > 120
      || !Number.isSafeInteger(raw.revision) || raw.revision < 1 || !hasText(raw.contentReference)) {
      throw Error('Version ou identité du brouillon invalide.');
    }
    if (raw.predecessor !== null) {
      onlyKeys(raw.predecessor, ['draftId', 'revision', 'contentReference'], 'Prédécesseur du brouillon');
      if (raw.predecessor.draftId !== raw.draftId || raw.predecessor.revision !== raw.revision - 1
        || raw.revision <= 1 || !hasText(raw.predecessor.contentReference)) throw Error('Révision de brouillon sans prédécesseur exact.');
    } else if (raw.revision !== 1) throw Error('Un brouillon sans prédécesseur doit être à sa première révision.');
    onlyKeys(raw.origin, ['kind', 'baselineKind', 'scenarioId', 'resultRevision', 'snapshotReference', 'resultReference',
      'requestReference', 'branchId', 'branchReference', 'branchApplicability', 'adoptedReference', 'intent', 'request',
      'sourceProgram', 'sourceProgramProposal', 'sourceInput', 'sourceProgramReference', 'sourceBranchRequestReference'], 'Origine J5 du brouillon');
    if (raw.origin.kind !== 'hypotheticalScenario' || raw.origin.baselineKind !== 'hypothetical'
      || !hasText(raw.origin.scenarioId) || !Number.isSafeInteger(raw.origin.resultRevision) || raw.origin.resultRevision < 0
      || !hasText(raw.origin.snapshotReference) || !hasText(raw.origin.resultReference) || !hasText(raw.origin.requestReference)
      || !hasText(raw.origin.branchId) || !hasText(raw.origin.branchReference)
      || !['available', 'conditional', 'unavailable', 'hypotheticalOnly'].includes(raw.origin.branchApplicability)
      || raw.origin.resultReference !== raw.origin.snapshotReference) throw Error('Références d’origine hypothétique invalides.');
    validateReference(raw.origin.adoptedReference);
    validateIntent(raw.origin.intent);
    assertBrewingScenarioRequest(raw.origin.request);
    if (raw.origin.request.baseline.kind !== 'hypothetical' || raw.origin.request.scenarioId !== raw.origin.scenarioId
      || raw.origin.request.revision !== raw.origin.resultRevision
      || raw.origin.request.branches.find(row => row.id === raw.origin.branchId) === undefined
      || brewingScenarioInputReference(raw.origin.request) !== raw.origin.requestReference) throw Error('La demande d’origine ne correspond pas aux références du brouillon.');
    const requestBranch = raw.origin.request.branches.find(row => row.id === raw.origin.branchId)!;
    if (hopAdviceContentReference('hop-v55-future-draft-branch-request-v1', requestBranch) !== raw.origin.sourceBranchRequestReference) {
      throw Error('La branche de requête conservée ne correspond pas à sa référence.');
    }
    assertHopRecipeInput(raw.origin.sourceInput);
    if (programFingerprint(raw.origin.sourceProgram) !== raw.origin.sourceProgramReference
      || raw.origin.sourceProgram.stage !== 'planning'
      || (raw.origin.sourceProgram.volumeL ?? 0) !== raw.origin.sourceInput.volumeL
      || raw.origin.sourceProgram.additions.length !== raw.origin.sourceInput.additions.length
      || raw.origin.sourceProgram.additions.some(addition => !sourceAdditionMatchesInput(addition, raw.origin.sourceInput, raw.origin.sourceProgram))) {
      throw Error('Le programme J1 d’origine est invalide, hors stade de recette ou désaligné de son entrée.');
    }
    if (raw.origin.sourceProgramProposal) {
      onlyKeys(raw.origin.sourceProgramProposal, ['version', 'baseline', 'materialReferences', 'program', 'changes', 'applicability', 'stock', 'conditions'], 'Proposition J1 conservée');
      if (raw.origin.sourceProgramProposal.version !== 'hop-decision-v1' || !hasText(raw.origin.sourceProgramProposal.baseline)
        || !['available', 'conditional', 'unavailable'].includes(raw.origin.sourceProgramProposal.applicability)
        || !isRow(raw.origin.sourceProgramProposal.materialReferences)
        || Object.values(raw.origin.sourceProgramProposal.materialReferences).some(reference => !hasText(reference))
        || !Array.isArray(raw.origin.sourceProgramProposal.changes)
        || !Array.isArray(raw.origin.sourceProgramProposal.conditions) || raw.origin.sourceProgramProposal.conditions.some(condition => typeof condition !== 'string')
        || !Array.isArray(raw.origin.sourceProgramProposal.stock) || raw.origin.sourceProgramProposal.stock.some(row => {
          try {
            onlyKeys(row, ['materialId', 'materialIds', 'stockItemRef', 'neededGrams', 'availableGrams', 'status'], 'État de stock J1');
            return !hasText(row.materialId) || row.materialIds !== undefined && (!Array.isArray(row.materialIds) || row.materialIds.some(id => !hasText(id)))
              || row.stockItemRef !== undefined && !hasText(row.stockItemRef)
              || row.neededGrams !== null && (!finite(row.neededGrams) || row.neededGrams < 0)
              || row.availableGrams !== null && (!finite(row.availableGrams) || row.availableGrams < 0)
              || !['available', 'unknown', 'insufficient', 'referenceOnly'].includes(row.status);
          } catch { return true; }
        }) || programFingerprint(raw.origin.sourceProgramProposal.program) !== raw.origin.sourceProgramReference
        || !same(raw.origin.sourceProgramProposal.changes, requestBranch.programChanges ?? [])) {
        throw Error('La proposition J1 conservée ne correspond pas à la branche source.');
      }
    }
    if (!Array.isArray(raw.sourceMaterials) || raw.sourceMaterials.some(row => {
      try {
        onlyKeys(row, ['id', 'materialReference', 'material'], 'Référence matière du brouillon');
        onlyKeys(row.material, ['id', 'name', 'form', 'variety', 'lot', 'product', 'declaredAnalysis', 'alphaForModel', 'stockItemRef', 'availableGrams'], 'Matière source');
        if (row.id !== row.material.id || !hasText(row.material.name) || !hasText(row.material.form)
          || row.materialReference !== materialIdentityReference(row.material)
          || ![row.material.variety, row.material.lot, row.material.product].some(Boolean)) return true;
        return false;
      } catch { return true; }
    })) throw Error('Instantanés de matière du brouillon invalides.');
    const sourceMaterialsById = new Map(raw.sourceMaterials.map(row => [row.id, row]));
    if (new Set(raw.sourceMaterials.map(row => row.id)).size !== raw.sourceMaterials.length) throw Error('Matière source dupliquée.');
    if (!Array.isArray(raw.operationDispositions) || raw.operationDispositions.length !== raw.origin.sourceProgram.additions.length) {
      throw Error('La portée d’adoption des opérations ne correspond pas au programme d’origine.');
    }
    const dispositionById = new Map<string, HopV55FutureRecipeOperationDispositionV1>();
    for (const disposition of raw.operationDispositions) {
      onlyKeys(disposition, ['additionId', 'materialId', 'sourceStatus', 'futureStatus'], 'Portée d’opération');
      if (!hasText(disposition.additionId) || !hasText(disposition.materialId)
        || !['planned', 'performed'].includes(disposition.sourceStatus)
        || !['planned', 'excludedPerformed'].includes(disposition.futureStatus)
        || disposition.sourceStatus === 'planned' && disposition.futureStatus !== 'planned'
        || disposition.sourceStatus === 'performed' && disposition.futureStatus === 'planned'
          && !(raw.declaredFields.schedulePerformedAdditionIds ?? []).includes(disposition.additionId)
        || dispositionById.has(disposition.additionId)) throw Error('Portée de replanification d’ajout invalide.');
      dispositionById.set(disposition.additionId, disposition);
    }
    for (const sourceAddition of raw.origin.sourceProgram.additions) {
      const disposition = dispositionById.get(sourceAddition.id);
      if (!disposition || disposition.materialId !== sourceAddition.materialId || disposition.sourceStatus !== sourceAddition.status
        || !sourceMaterialsById.has(sourceAddition.materialId)) throw Error('Une ligne J1 ou sa matière source manque dans la portée scellée.');
    }
    if (!Array.isArray(raw.additions) || raw.additions.length !== [...dispositionById.values()].filter(row => row.futureStatus === 'planned').length) {
      throw Error('Les ajouts futurs ne correspondent pas aux choix d’adoption scellés.');
    }
    const futureIds = new Set<string>();
    for (const row of raw.additions) {
      onlyKeys(row, ['additionId', 'materialId', 'materialReference', 'material', 'addition', 'sourceStatus'], 'Ajout futur');
      onlyKeys(row.addition, ['id', 'materialId', 'grams', 'use', 'status', 'alphaForModel', 'boilMinutes', 'contactHours', 'temperatureC', 'dayOffset'], 'Programme futur');
      const sourceMaterial = sourceMaterialsById.get(row.materialId);
      const disposition = dispositionById.get(row.additionId);
      const sourceAddition = raw.origin.sourceProgram.additions.find(addition => addition.id === row.additionId);
      const expectedFutureAddition = sourceAddition ? { ...clone(sourceAddition), status: 'planned' as const } : undefined;
      if (!sourceMaterial || !disposition || disposition.futureStatus !== 'planned' || row.addition.id !== row.additionId
        || row.addition.materialId !== row.materialId || row.addition.status !== 'planned'
        || row.sourceStatus !== disposition.sourceStatus || row.materialReference !== sourceMaterial.materialReference
        || !same(row.material, sourceMaterial.material) || row.materialReference !== materialIdentityReference(row.material)
        || !expectedFutureAddition || !same(row.addition, expectedFutureAddition)
        || row.addition.grams !== null && (!finite(row.addition.grams) || row.addition.grams < 0)
        || futureIds.has(row.additionId)) throw Error('Ajout futur incohérent avec son opération J1 et sa matière d’origine.');
      futureIds.add(row.additionId);
    }
    const fieldError = declaredFieldsShapeError(raw.declaredFields);
    if (fieldError) throw Error(fieldError);
    const sourceOperationsById = new Map(raw.origin.sourceProgram.additions.map(addition => [addition.id, addition]));
    if (Object.keys(raw.declaredFields.hopMassChoices ?? {}).some(id =>
      sourceOperationsById.get(id)?.grams !== null)) {
      throw Error('Une masse de recette doit rester liée à une opération source dont la masse J5 est inconnue.');
    }
    if (raw.hypotheticalBaseline.kind !== 'hypothetical') throw Error('Le brouillon doit rester une base hypothétique explicite.');
    onlyKeys(raw.hypotheticalBaseline, ['kind', 'label', 'input', 'program', 'materials'], 'Base future hypothétique');
    assertHopRecipeInput(raw.hypotheticalBaseline.input);
    programFingerprint(raw.hypotheticalBaseline.program);
    if (raw.hypotheticalBaseline.program.id !== raw.draftId || raw.hypotheticalBaseline.program.revision !== raw.revision
      || raw.hypotheticalBaseline.program.stage !== 'planning'
      || raw.hypotheticalBaseline.program.additions.length !== raw.additions.length
      || raw.hypotheticalBaseline.program.additions.some(addition => !raw.additions.some(row => same(row.addition, addition)))
      || raw.hypotheticalBaseline.input.additions.length !== raw.additions.length
      || raw.hypotheticalBaseline.input.additions.some(input => !raw.additions.some(row => row.additionId === input.id))
      || raw.hypotheticalBaseline.program.volumeL !== raw.origin.sourceProgram.volumeL
      || raw.hypotheticalBaseline.input.volumeL !== raw.origin.sourceInput.volumeL) {
      throw Error('Le baseline explicite du brouillon ne correspond pas à son programme J1 retenu.');
    }
    const expectedBaselineInput: HopRecipeInput = { ...clone(raw.origin.sourceInput),
      additions: raw.origin.sourceInput.additions.filter(row => futureIds.has(row.id)) };
    if (!same(raw.hypotheticalBaseline.input, expectedBaselineInput)) throw Error('L’entrée du baseline futur diverge de l’entrée J5 retenue.');
    if (raw.hypotheticalBaseline.materials !== undefined) {
      onlyKeys(raw.hypotheticalBaseline.materials, ['hops'], 'Matières de la base future');
      if (!Array.isArray(raw.hypotheticalBaseline.materials.hops)
        || raw.hypotheticalBaseline.materials.hops.some(material => material.availableGrams !== undefined || material.stockItemRef !== undefined
          || material.lot?.stockItemRef !== undefined || sourceMaterialsById.get(material.id) === undefined
          || materialIdentityReference(material) !== sourceMaterialsById.get(material.id)!.materialReference)) {
        throw Error('La base future ne doit pas recopier disponibilité ou liens de stock, et doit garder les matières exactes.');
      }
      const expectedHypothesisMaterials = [...new Set(raw.additions.map(row => row.materialId))];
      if (raw.hypotheticalBaseline.materials.hops.length !== expectedHypothesisMaterials.length
        || raw.hypotheticalBaseline.materials.hops.some(material => !expectedHypothesisMaterials.includes(material.id))) {
        throw Error('Les matières du baseline futur ne correspondent pas aux opérations choisies.');
      }
    }
    const { contentReference: supplied, ...body } = raw;
    if (contentReference(body) !== supplied) throw Error('Le brouillon a été modifié après sa sauvegarde locale.');
    return { status: 'available', draft: clone(raw) };
  } catch (error) {
    return { status: 'invalid', reason: (error as Error).message || 'Brouillon de future recette illisible.' };
  }
}

export function prepareFutureRecipeDraft(input: Parameters<typeof prepareHopV55FutureRecipeDraft>[0]): HopV55FutureRecipeDraftPreparation {
  return prepareHopV55FutureRecipeDraft(input);
}

export function inspectHopV55FutureRecipeDraft(value: unknown): HopV55FutureRecipeDraftInspection {
  const read = readHopV55FutureRecipeDraft(value);
  if (read.status !== 'available') return read;
  return { status: 'available', draft: read.draft, completion: recipeCompletion(read.draft), preview: previewFor(read.draft) };
}

/** Build a proposed hypothetical J5 input from user-declared masses; this performs no prediction. */
export function prepareHopV55FutureRecipeMassRecomputeProposal(value: unknown): HopV55FutureRecipeMassRecomputePreparation {
  const read = readHopV55FutureRecipeDraft(value);
  if (read.status !== 'available') return { status: 'blocked', reason: `Brouillon invalide : ${read.reason}` };
  const draft = read.draft;
  const massChoices = draft.declaredFields.hopMassChoices ?? {};
  const includedById = new Map(draft.additions.map(row => [row.additionId, row]));
  const unmapped = Object.keys(massChoices).filter(id => !includedById.has(id));
  if (unmapped.length) return { status: 'blocked', reason: 'Une masse déclarée vise un ajout qui n’est pas inclus dans le futur programme; replanifie-le explicitement avant J5.' };
  const missing = draft.additions.filter(row => row.addition.grams === null && massChoices[row.additionId] === undefined);
  if (missing.length) return { status: 'needsCompletion', issues: missing.map(row => ({ field: `hops.${row.additionId}.grams`,
    message: `Déclare une masse pour ${row.material.name} avant de préparer une nouvelle prévision J5.` })) };
  const proposedProgram = clone(draft.hypotheticalBaseline.program);
  const proposedInput = clone(draft.hypotheticalBaseline.input);
  const changedAdditionIds: string[] = [];
  proposedProgram.additions = proposedProgram.additions.map(addition => {
    const draftRow = includedById.get(addition.id);
    if (!draftRow) throw Error('Une opération du programme explicite ne correspond plus au brouillon scellé.');
    const selectedMass = draftRow.addition.grams === null ? massChoices[addition.id] : draftRow.addition.grams;
    if (selectedMass === undefined || !finite(selectedMass) || selectedMass < 0) throw Error('La masse de programme doit être déclarée en grammes avant J5.');
    if (draftRow.addition.grams === null) changedAdditionIds.push(addition.id);
    return { ...clone(addition), grams: selectedMass };
  });
  proposedInput.additions = proposedInput.additions.map(inputAddition => {
    const proposedAddition = proposedProgram.additions.find(addition => addition.id === inputAddition.id);
    if (!proposedAddition) throw Error('Une entrée du baseline ne correspond plus au programme hypothétique.');
    const volumeL = proposedProgram.volumeL;
    return { ...clone(inputAddition), triplet: { ...clone(inputAddition.triplet),
      doseGL: volumeL !== null && volumeL > 0 ? proposedAddition.grams! / volumeL : null } };
  });
  for (const addition of proposedProgram.additions) {
    if (!sourceAdditionMatchesInput(addition, proposedInput, proposedProgram)) throw Error(`Le programme proposé diverge de l’entrée J5 ${addition.id}.`);
  }
  programFingerprint(proposedProgram);
  const proposedBaseline: HopV55FutureRecipeHypotheticalBaselineV1 = {
    kind: 'hypothetical', label: `${draft.hypotheticalBaseline.label} · masses déclarées à prévoir`,
    input: proposedInput, program: proposedProgram,
  };
  const body: Omit<HopV55FutureRecipeMassRecomputeProposalV1, 'contentReference'> = {
    format: HOP_V55_FUTURE_RECIPE_MASS_RECOMPUTE_FORMAT,
    draftId: draft.draftId, draftRevision: draft.revision, draftReference: draft.contentReference,
    sourceScenarioReference: draft.origin.snapshotReference, sourceBranchReference: draft.origin.branchReference,
    proposedBaseline, changedAdditionIds,
  };
  return { status: 'ready', proposal: { ...body,
    contentReference: hopAdviceContentReference(HOP_V55_FUTURE_RECIPE_MASS_RECOMPUTE_FORMAT, body) } };
}

function additionalMissing(draft: HopV55FutureRecipeDraftV1, recipe: Recipe): HopV55FutureRecipeReadiness['additionalMissing'] {
  const missing: HopV55FutureRecipeReadiness['additionalMissing'] = [];
  if (!recipe.style.trim()) missing.push({ field: 'style', message: 'Style non déclaré; aucun style du scénario n’a été appliqué par défaut.' });
  if (!draft.declaredFields.fermentables) missing.push({ field: 'fermentables', message: 'Formulation des fermentescibles non déclarée.' });
  if (!draft.declaredFields.yeast?.name?.trim()) missing.push({ field: 'yeast', message: 'Culture de levure non déclarée.' });
  for (const row of draft.additions) {
    if (row.addition.grams === null) {
      const proposedMass = draft.declaredFields.hopMassChoices?.[row.additionId];
      missing.push({ field: `hops.${row.additionId}.grams`, message: proposedMass === undefined
        ? `Masse J5 inconnue pour ${row.material.name}; déclare une masse avant de préparer le nouveau programme.`
        : `${proposedMass} g est une masse proposée pour ${row.material.name}; relance J5 sur ce programme avant l’export.` });
    }
    const alpha = draft.declaredFields.alphaChoices?.[row.additionId];
    if (alpha?.value === undefined || alpha.value <= 0 || !alpha.reason?.trim()) missing.push({ field: `hops.${row.additionId}.alpha`,
      message: 'Alpha de recette non choisi. Choisis un nominal et justifie-le; le brouillon ne crée pas d’analyse du lot.' });
  }
  return missing;
}

function readinessFor(draft: HopV55FutureRecipeDraftV1, recipe: Recipe): HopV55FutureRecipeReadiness {
  const check = recipeReadiness(recipe);
  const extra = additionalMissing(draft, recipe);
  return { save: check.invalid.length ? 'invalid' : 'readyToSave', brew: check.invalid.length ? 'invalid'
      : check.missing.length || extra.length ? 'incomplete' : 'ready', recipeStatus: check.status,
    invalid: clone(check.invalid), missing: clone(check.missing), additionalMissing: extra,
    alphaUnknownAdditionIds: draft.additions.filter(row => {
      const alpha = draft.declaredFields.alphaChoices?.[row.additionId];
      return alpha?.value === undefined || alpha.value <= 0 || !alpha.reason?.trim();
    }).map(row => row.additionId),
    excludedPerformedAdditionIds: draft.operationDispositions.filter(row => row.futureStatus === 'excludedPerformed').map(row => row.additionId) };
}

function exactStyleExists(reference: BrewingStyleRef, styles: BrewingStyleGuide[] | undefined): boolean {
  return !!styles?.some(guide => guide.id === reference.guideId
    && (guide.version === reference.version && guide.styles.some(style => style.id === reference.styleId)
      || guide.history?.some(version => version.version === reference.version && version.styles.some(style => style.id === reference.styleId))));
}

function hopIngredient(use: HopUse, material: HopDecisionMaterial, grams: number, alpha: number, addition: HopProgramAddition): HopIngredient {
  const dry = use === 'fermentation' || use === 'postFermentation';
  const lot = material.lot;
  return {
    name: material.name,
    alpha,
    weightG: grams,
    stage: dry ? 'dryHop' : use as HopIngredient['stage'],
    ...(use === 'boil' && addition.boilMinutes != null ? { timeMin: addition.boilMinutes } : {}),
    ...(use === 'whirlpool' && addition.contactHours != null ? { timeMin: addition.contactHours * 60 } : {}),
    ...(use === 'whirlpool' && addition.temperatureC != null ? { tempC: addition.temperatureC } : {}),
    ...(dry ? { aromaTiming: use, ...(addition.dayOffset != null ? { dayOffset: addition.dayOffset } : {}) } : {}),
    ...(addition.contactHours != null ? { aromaContactHours: addition.contactHours } : {}),
    ...(addition.temperatureC != null ? { aromaTemperatureC: addition.temperatureC } : {}),
    ...(material.variety?.id ? { hopVarietyId: material.variety.id } : lot?.varietyId ? { hopVarietyId: lot.varietyId } : {}),
  };
}

function referenceStaleReason(draft: HopV55FutureRecipeDraftV1, refs: HopV55FutureRecipeCurrentReferences): string | undefined {
  const snapshot = refs.snapshot;
  if (!snapshot || snapshot.formatVersion !== 1 || snapshot.reference !== draft.origin.snapshotReference
    || snapshot.result.reference !== draft.origin.resultReference || snapshot.result.scenarioId !== draft.origin.scenarioId
    || snapshot.result.revision !== draft.origin.resultRevision) return 'Le scénario source a changé ou le snapshot exact n’est plus disponible; relance une exploration depuis le brouillon.';
  try { assertBrewingScenarioResult(snapshot.result); }
  catch (error) { return `Le snapshot courant ne passe pas sa validation de domaine : ${(error as Error).message}`; }
  if (brewingScenarioInputReference(snapshot.result.requestSnapshot) !== draft.origin.requestReference
    || !same(snapshot.result.requestSnapshot, draft.origin.request)) return 'La demande J5 conservée ne correspond plus au snapshot exact.';
  const branch = snapshot.result.branches.find(row => row.id === draft.origin.branchId);
  if (!branch || branch.reference !== draft.origin.branchReference || !branch.program
    || programFingerprint(branch.program) !== draft.origin.sourceProgramReference
    || !same(branch.input, draft.origin.sourceInput)) return 'La branche, son entrée ou le programme source ne correspond plus au brouillon.';
  const requestBranch = snapshot.result.requestSnapshot.branches.find(row => row.id === draft.origin.branchId);
  if (!requestBranch || hopAdviceContentReference('hop-v55-future-draft-branch-request-v1', requestBranch)
    !== draft.origin.sourceBranchRequestReference) return 'La branche J5 n’est plus la demande exacte conservée par le brouillon.';
  if (!refs.adoptedReference || !same(refs.adoptedReference, draft.origin.adoptedReference)) return 'La référence adoptée a changé; adopte-la ou revois le scénario avant la matérialisation.';
  const currentMaterials = new Map(refs.materials.map(material => [material.id, material]));
  for (const source of draft.sourceMaterials) {
    const current = currentMaterials.get(source.id);
    if (!current || materialIdentityReference(current) !== source.materialReference) return `La matière ${source.id} a changé ou n’est plus résolue; l’identité exacte doit être requalifiée.`;
  }
  return undefined;
}

/**
 * Materialize only declared fields over the exact future program. It never allocates an ID before
 * Recipe save validation, never scales hops, and never turns J5 output into a target.
 */
export function materializeHopV55FutureRecipe(draftValue: unknown, selections: HopV55FutureRecipeDeclaredFields,
  currentRefs: HopV55FutureRecipeCurrentReferences, ids: { createRecipeId(): string; createReceiptId(): string; createdAt: string }): HopV55FutureRecipeMaterializationResult {
  const read = readHopV55FutureRecipeDraft(draftValue);
  if (read.status !== 'available') return { status: 'blocked', reason: `Brouillon invalide : ${read.reason}` };
  const draft = read.draft;
  const stale = referenceStaleReason(draft, currentRefs);
  if (stale) return { status: 'blocked', reason: stale };
  const selectionIssue = declaredFieldsShapeError(selections);
  if (selectionIssue) return { status: 'blocked', reason: selectionIssue };
  const merged: HopV55FutureRecipeDeclaredFields = { ...clone(draft.declaredFields), ...clone(selections),
    ...(draft.declaredFields.alphaChoices || selections.alphaChoices
      ? { alphaChoices: { ...draft.declaredFields.alphaChoices, ...selections.alphaChoices } } : {}),
    ...(draft.declaredFields.hopMassChoices || selections.hopMassChoices
      ? { hopMassChoices: { ...draft.declaredFields.hopMassChoices, ...selections.hopMassChoices } } : {}) };
  if (merged.schedulePerformedAdditionIds !== undefined && merged.schedulePerformedAdditionIds.some(id =>
    !draft.operationDispositions.some(row => row.additionId === id && row.sourceStatus === 'performed'))) {
    return { status: 'blocked', reason: 'Un ajout replanifié ne correspond pas à l’origine conservée.' };
  }
  const sourceOperationsById = new Map(draft.origin.sourceProgram.additions.map(addition => [addition.id, addition]));
  if (Object.keys(merged.hopMassChoices ?? {}).some(id => sourceOperationsById.get(id)?.grams !== null)) {
    return { status: 'blocked', reason: 'Une masse déclarée doit compléter une opération source dont la masse J5 est inconnue.' };
  }
  const branch = currentRefs.snapshot.result.branches.find(row => row.id === draft.origin.branchId)!;
  const exactVolume = draft.origin.sourceProgram.volumeL;
  const volumeL = merged.volumeL ?? exactVolume;
  if (volumeL == null || !finite(volumeL) || volumeL < 1) {
    const completion = recipeCompletion({ ...draft, declaredFields: merged });
    return { status: 'needsCompletion', completion, issues: [...completion.missing, { field: 'volumeL', message: 'Choisis un volume dans une nouvelle prévision J5 avant la recette finale.' }] };
  }
  if (exactVolume !== null && Math.abs(volumeL - exactVolume) > 1e-9) {
    return { status: 'blocked', reason: 'Le volume final diverge du programme prévisionnel. Relance une exploration avec ce volume; aucune dose ne sera mise à l’échelle.' };
  }
  if ((merged.yeast?.hopIndexId ?? null) !== branch.input.yeastId) {
    return { status: 'blocked', reason: 'La culture de recette diffère de l’entrée J5. Choisis la même culture ou relance une exploration depuis le brouillon.' };
  }
  if (merged.yeast?.pitchTempC !== branch.input.pitchTempC) {
    return { status: 'blocked', reason: 'La cible d’ensemencement diffère de l’entrée J5. Relance une exploration avant la matérialisation.' };
  }
  if (merged.yeast?.hopIndexId && !currentRefs.yeasts?.some(yeast => yeast.id === merged.yeast!.hopIndexId)) {
    return { status: 'blocked', reason: `La culture ${merged.yeast.hopIndexId} n’est plus résolue dans les références courantes.` };
  }
  if (merged.styleRef && !exactStyleExists(merged.styleRef, currentRefs.styles)) {
    return { status: 'blocked', reason: 'La référence de style exacte n’est plus présente dans les guides chargés.' };
  }
  const selectedFermentation = (merged.fermentation ?? []).map(step => ({ kind: step.kind, name: step.name,
    tempC: step.tempC, days: step.days, ...(step.note !== undefined ? { note: step.note } : {}) }));
  if (!same(selectedFermentation, branch.input.fermentation)) {
    return { status: 'blocked', reason: 'Les phases choisies diffèrent de l’entrée J5. Reprends exactement ces phases ou relance une exploration.' };
  }
  const noScenarioVolume = draft.origin.sourceProgram.volumeL === null;
  if (noScenarioVolume) {
    return { status: 'needsCompletion', completion: recipeCompletion({ ...draft, declaredFields: merged }),
      issues: [{ field: 'volumeL', message: 'Un volume déclaré exige une nouvelle prévision pour relier les masses aux entrées J5.' }] };
  }
  const alphaChoices = merged.alphaChoices ?? {};
  const missingAlpha = draft.additions.filter(row => {
    const choice = alphaChoices[row.additionId];
    return choice?.value === undefined || choice.value <= 0 || !choice.reason?.trim();
  });
  const missingHopMasses = draft.additions.filter(row => row.addition.grams === null);
  if (missingHopMasses.length) {
    const completion = recipeCompletion({ ...draft, declaredFields: merged });
    return { status: 'needsCompletion', completion, issues: [
      ...missingHopMasses.map(row => ({ field: `hops.${row.additionId}.grams`, message: merged.hopMassChoices?.[row.additionId] === undefined
        ? `Masse J5 inconnue pour ${row.material.name}; déclare une masse puis relance J5 avant l’export.`
        : `${merged.hopMassChoices[row.additionId]} g est une masse proposée pour ${row.material.name}; relance J5 sur ce programme avant l’export.` })),
      ...missingAlpha.map(row => ({ field: `hops.${row.additionId}.alpha`, message:
        `Déclare un alpha de travail supérieur à 0 % et son motif pour ${row.material.name}. Ce choix ne crée pas une analyse du lot.` })),
    ] };
  }
  if (merged.fermentables === undefined) {
    const completion = recipeCompletion({ ...draft, declaredFields: merged });
    return { status: 'needsCompletion', completion, issues: [
      ...completion.missing.map(issue => ({ field: issue.field, message: issue.message })),
      ...missingAlpha.map(row => ({ field: `hops.${row.additionId}.alpha`,
        message: `Déclare un alpha de travail supérieur à 0 % et son motif pour ${row.material.name}. Ce choix ne crée pas une analyse du lot.` })),
    ] };
  }
  const hops = draft.additions.map(row => {
    const currentMaterial = currentRefs.materials.find(material => material.id === row.materialId)!;
    // 0 is used only inside this unreturned candidate while readiness is checked. A Recipe is
    // never returned or identified until a positive, reasoned working alpha is declared.
    const alpha = alphaChoices[row.additionId]?.value ?? 0;
    const grams = row.addition.grams;
    if (grams === null) throw Error('Une masse J5 inconnue exige une nouvelle prévision avant la construction de la recette.');
    return hopIngredient(row.addition.use, currentMaterial, grams, alpha, row.addition);
  });
  const fermentableDrafts = merged.fermentables;
  const incompleteFermentables = fermentableDrafts.flatMap((row, index) => [
    ...(!hasText(row.name) ? [{ field: `fermentables.${index}.name`, message: `Nom du fermentescible ${index + 1} à déclarer.` }] : []),
    ...(!finite(row.weightKg) ? [{ field: `fermentables.${index}.weightKg`, message: `Masse du fermentescible ${index + 1} à déclarer en kg.` }] : []),
    ...(!row.kind ? [{ field: `fermentables.${index}.kind`, message: `Type du fermentescible ${index + 1} à choisir.` }] : []),
    ...(!row.use ? [{ field: `fermentables.${index}.use`, message: `Emploi du fermentescible ${index + 1} à choisir.` }] : []),
  ]);
  if (incompleteFermentables.length) return { status: 'needsCompletion',
    completion: recipeCompletion({ ...draft, declaredFields: merged }), issues: incompleteFermentables };
  const fermentables = fermentableDrafts as Fermentable[];
  const yeast: YeastSpec = merged.yeast ? {
    name: merged.yeast.name ?? '',
    ...(merged.yeast.hopIndexId ? { hopIndexId: merged.yeast.hopIndexId } : {}),
    ...(merged.yeast.strain !== undefined ? { strain: merged.yeast.strain } : {}),
    ...(merged.yeast.form !== undefined ? { form: merged.yeast.form } : {}),
    ...(merged.yeast.qty !== undefined ? { qty: merged.yeast.qty } : {}),
    ...(merged.yeast.unit !== undefined ? { unit: merged.yeast.unit } : {}),
    ...(merged.yeast.pitchTempC !== undefined ? { pitchTempC: merged.yeast.pitchTempC } : {}),
  } : { name: '' };
  const recipe: Recipe = {
    id: '', name: merged.name ?? '', style: merged.style ?? '', volumeL,
    ogTarget: merged.ogTarget ?? null, fgTarget: merged.fgTarget ?? null, abvTarget: merged.abvTarget ?? null,
    ...(merged.ibuTarget !== undefined ? { ibuTarget: merged.ibuTarget } : {}),
    fermentables, totalGristKg: fermentables.filter(row => row.kind === 'grain').reduce((total, row) => total + row.weightKg, 0),
    hops, yeast, steps: clone(merged.steps ?? []), notes: clone(merged.notes ?? []),
    ...(merged.boilMin !== undefined ? { boilMin: merged.boilMin } : {}),
    ...(merged.fermentation !== undefined ? { fermentation: clone(merged.fermentation) } : {}),
    ...(merged.mash !== undefined ? { mash: clone(merged.mash) } : {}),
    ...(merged.styleRef !== undefined ? { styleRef: clone(merged.styleRef) } : {}),
  };
  const readiness = recipeReadiness(recipe);
  if (readiness.invalid.length || missingAlpha.length) {
    const completion = recipeCompletion({ ...draft, declaredFields: merged });
    return { status: 'needsCompletion', completion, issues: [
      ...readiness.invalid.map(issue => ({ field: issue.field, message: issue.message })),
      ...missingAlpha.map(row => ({ field: `hops.${row.additionId}.alpha`,
        message: `Déclare un alpha de travail supérieur à 0 % et son motif pour ${row.material.name}. Ce choix ne crée pas une analyse du lot.` })),
    ] };
  }
  const recipeId = ids.createRecipeId();
  if (!hasText(recipeId) || recipeId === draft.origin.scenarioId || recipeId === draft.draftId) {
    return { status: 'blocked', reason: 'L’hôte doit attribuer un identifiant de recette neuf, distinct du scénario et du brouillon.' };
  }
  recipe.id = recipeId;
  const mappedRows = draft.additions.map((row, recipeIndex) => ({ row, recipeIndex }));
  const receiptBody: Omit<HopV55FutureRecipeMaterializationReceiptV1, 'contentReference'> = {
    format: HOP_V55_FUTURE_RECIPE_MATERIALIZATION_FORMAT,
    receiptId: ids.createReceiptId(), recipeId, recipeReference: hopDecisionReference(recipe),
    draftId: draft.draftId, draftRevision: draft.revision, draftReference: draft.contentReference,
    sourceScenarioId: draft.origin.scenarioId, sourceSnapshotReference: draft.origin.snapshotReference,
    sourceResultReference: draft.origin.resultReference, sourceBranchId: draft.origin.branchId,
    sourceBranchReference: draft.origin.branchReference, adoptedReference: clone(draft.origin.adoptedReference),
    createdAt: ids.createdAt, recipe: clone(recipe),
    readiness: { save: 'readyToSave', brew: readiness.status === 'invalid' ? 'invalid' : readiness.status === 'incomplete' ? 'incomplete' : 'ready',
      recipeStatus: readiness.status, invalid: clone(readiness.invalid), missing: clone(readiness.missing),
      additionalMissing: additionalMissing({ ...draft, declaredFields: merged }, recipe),
      alphaUnknownAdditionIds: [],
      excludedPerformedAdditionIds: draft.operationDispositions.filter(row => row.futureStatus === 'excludedPerformed').map(row => row.additionId) },
    hopMappings: mappedRows.map(({ row, recipeIndex }) => ({ recipeIndex, additionId: row.additionId,
      materialId: row.materialId, materialReference: row.materialReference, sourceStatus: row.sourceStatus,
      material: clone(row.material), addition: clone(row.addition),
      alphaChoice: clone(alphaChoices[row.additionId]) as { value: number; reason: string } })),
    excludedPerformedAdditionIds: draft.operationDispositions.filter(row => row.futureStatus === 'excludedPerformed').map(row => row.additionId),
  };
  if (!hasText(receiptBody.receiptId) || !/^\d{4}-\d{2}-\d{2}T/.test(receiptBody.createdAt)
    || !Number.isFinite(Date.parse(receiptBody.createdAt))) return { status: 'blocked', reason: 'Identité ou date du reçu de matérialisation invalide.' };
  const receipt = { ...receiptBody, contentReference: materializationContentReference(receiptBody) };
  const readReceipt = readHopV55FutureRecipeMaterializationReceipt(receipt);
  if (readReceipt.status !== 'available') return { status: 'blocked', reason: `Le reçu de matérialisation n’est pas valide : ${readReceipt.reason}` };
  return { status: 'ready', recipe, receipt: readReceipt.receipt };
}

export function readHopV55FutureRecipeMaterializationReceipt(value: unknown):
  | { status: 'available'; receipt: HopV55FutureRecipeMaterializationReceiptV1 }
  | { status: 'invalid'; reason: string } {
  try {
    onlyKeys(value, ['format', 'receiptId', 'recipeId', 'recipeReference', 'draftId', 'draftRevision', 'draftReference',
      'sourceScenarioId', 'sourceSnapshotReference', 'sourceResultReference', 'sourceBranchId', 'sourceBranchReference',
      'adoptedReference', 'createdAt', 'recipe', 'readiness', 'hopMappings', 'excludedPerformedAdditionIds', 'contentReference'], 'Reçu de matérialisation');
    const receipt = value as HopV55FutureRecipeMaterializationReceiptV1;
    if (receipt.format !== HOP_V55_FUTURE_RECIPE_MATERIALIZATION_FORMAT || !hasText(receipt.receiptId)
      || !hasText(receipt.recipeId) || receipt.recipe.id !== receipt.recipeId || !hasText(receipt.recipeReference)
      || receipt.recipeReference !== hopDecisionReference(receipt.recipe) || !hasText(receipt.draftId)
      || !Number.isSafeInteger(receipt.draftRevision) || receipt.draftRevision < 1 || !hasText(receipt.draftReference)
      || !hasText(receipt.sourceScenarioId) || !hasText(receipt.sourceSnapshotReference) || !hasText(receipt.sourceResultReference)
      || !hasText(receipt.sourceBranchId) || !hasText(receipt.sourceBranchReference)
      || !/^\d{4}-\d{2}-\d{2}T/.test(receipt.createdAt) || !Number.isFinite(Date.parse(receipt.createdAt))) {
      throw Error('Identité ou références du reçu de matérialisation invalides.');
    }
    validateReference(receipt.adoptedReference);
    onlyKeys(receipt.recipe, ['id', 'name', 'style', 'styleRef', 'volumeL', 'ogTarget', 'fgTarget', 'abvTarget', 'ibuTarget',
      'fermentables', 'totalGristKg', 'hops', 'yeast', 'steps', 'notes', 'boilMin', 'fermentation', 'mash'], 'Nouvelle recette');
    if (receipt.recipe.id === receipt.draftId || receipt.recipe.id === receipt.sourceScenarioId
      || Object.prototype.hasOwnProperty.call(receipt.recipe, 'parentRecipeId')
      || Object.prototype.hasOwnProperty.call(receipt.recipe, 'sourceRecipeId')) throw Error('La nouvelle recette ne doit pas emprunter l’identité d’une source.');
    if (!Array.isArray(receipt.excludedPerformedAdditionIds) || receipt.excludedPerformedAdditionIds.some(id => !hasText(id))
      || new Set(receipt.excludedPerformedAdditionIds).size !== receipt.excludedPerformedAdditionIds.length) throw Error('Annexe des ajouts effectués invalide.');
    onlyKeys(receipt.readiness, ['save', 'brew', 'recipeStatus', 'invalid', 'missing', 'additionalMissing',
      'alphaUnknownAdditionIds', 'excludedPerformedAdditionIds'], 'Complétude de recette');
    const readiness = recipeReadiness(receipt.recipe);
    if (readiness.status !== receipt.readiness.recipeStatus || readiness.invalid.length !== receipt.readiness.invalid.length
      || !same(readiness.invalid, receipt.readiness.invalid) || !same(readiness.missing, receipt.readiness.missing)
      || readiness.invalid.length !== 0 || receipt.readiness.save !== 'readyToSave'
      || receipt.readiness.brew !== (readiness.status === 'invalid' ? 'invalid' : readiness.status === 'incomplete' ? 'incomplete' : 'ready')
      || !Array.isArray(receipt.readiness.additionalMissing) || !Array.isArray(receipt.readiness.alphaUnknownAdditionIds)
      || receipt.readiness.alphaUnknownAdditionIds.length !== 0
      || !same(receipt.readiness.excludedPerformedAdditionIds, receipt.excludedPerformedAdditionIds)
      || !Array.isArray(receipt.recipe.hops) || !Array.isArray(receipt.hopMappings)
      || receipt.recipe.hops.length !== receipt.hopMappings.length || receipt.hopMappings.some((mapping, index) => {
        try {
          onlyKeys(mapping, ['recipeIndex', 'additionId', 'materialId', 'materialReference', 'material', 'addition', 'sourceStatus', 'alphaChoice'], 'Correspondance de houblon');
          onlyKeys(mapping.addition, ['id', 'materialId', 'grams', 'use', 'status', 'alphaForModel', 'boilMinutes', 'contactHours', 'temperatureC', 'dayOffset'], 'Opération matérialisée');
          onlyKeys(mapping.material, ['id', 'name', 'form', 'variety', 'lot', 'product', 'declaredAnalysis', 'alphaForModel', 'stockItemRef', 'availableGrams'], 'Matière matérialisée');
          const sourceStatusValid = ['planned', 'performed'].includes(mapping.sourceStatus);
          const expectedHop = mapping.addition.grams === null ? undefined : hopIngredient(mapping.addition.use, mapping.material,
            mapping.addition.grams, mapping.alphaChoice.value, mapping.addition);
          return mapping.recipeIndex !== index || !hasText(mapping.additionId) || !hasText(mapping.materialId)
            || !hasText(mapping.materialReference) || !['planned', 'performed'].includes(mapping.sourceStatus)
            || !sourceStatusValid || mapping.addition.id !== mapping.additionId || mapping.addition.materialId !== mapping.materialId
            || mapping.addition.status !== 'planned' || mapping.material.id !== mapping.materialId
            || mapping.materialReference !== materialIdentityReference(mapping.material)
            || mapping.addition.grams === null || !finite(mapping.addition.grams) || mapping.addition.grams < 0
            || !expectedHop || !same(receipt.recipe.hops[index], expectedHop)
            || !isRow(mapping.alphaChoice) || !finite(mapping.alphaChoice.value) || mapping.alphaChoice.value <= 0
            || mapping.alphaChoice.value > 100 || !hasText(mapping.alphaChoice.reason);
        } catch { return true; }
      })) throw Error('État de complétion ou correspondances de houblon du reçu incohérents.');
    const { contentReference: supplied, ...body } = receipt;
    if (!hasText(supplied) || materializationContentReference(body) !== supplied) throw Error('Le reçu de matérialisation a changé après sa création.');
    return { status: 'available', receipt: clone(receipt) };
  } catch (error) { return { status: 'invalid', reason: (error as Error).message || 'Reçu de matérialisation invalide.' }; }
}

export const reviseFutureRecipeDraft = reviseHopV55FutureRecipeDraft;
export const materializeFutureRecipe = materializeHopV55FutureRecipe;
export const readFutureRecipeMaterializationReceipt = readHopV55FutureRecipeMaterializationReceipt;
