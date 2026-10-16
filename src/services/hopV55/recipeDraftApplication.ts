import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { HopIngredient, Recipe } from '../../types';
import { canonicalizeHopV55RecipeDraft } from './recipeStepContext';
import type { BrewingScenarioResult } from '../../domain/brewingScenario';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { hopDecisionReference } from '../../domain/hopDecision/measurements';
import type { HopRecipeAlphaChoice } from '../../domain/hopDecision/recipePreview';
import { applyHopV55RecipeDraft, previewHopV55Branch, type HopV55BranchPreviewResult, type HopV55ReadyPreview } from './application';

export const HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT = 'hop-v55-recipe-draft-application-v1' as const;
const FORMAT_PREFIX = 'hop-v55-recipe-draft-application-';
/** Fields the canonical J4 recipe adapter is allowed to change; everything else must stay byte-identical. */
const J4_CHANGED_FIELDS = new Set(['hops', 'hopPredictionIds', 'hopTrialId']);

/** Persist hashes of the exact canonical references, not their potentially large serialized bodies. */
export function hopV55RecipeApplicationValueReference(kind: 'sourceRecipe' | 'hops' | 'snapshot' | 'branch' | 'preview' | 'recipePreview', value: unknown): string {
  return hopAdviceContentReference('hop-v55-recipe-application-reference-v1', { kind, value });
}

export interface HopV55RecipeDraftIdentity {
  /** Explicit local account partition of the V5.5 workspace. */
  ownerKey: string;
  /** Stable recipe ID of the wizard draft; it is preserved by the application. */
  draftId: string;
}

/**
 * Small, sealed provenance kept with the recipe. It references the local V5.5
 * work (workspace, scenario, branch, previews) without embedding it.
 */
export interface HopV55RecipeApplicationRecordV1 {
  format: typeof HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT;
  id: string;
  ownerKey: string;
  recipeId: string;
  workspaceId: string | null;
  appliedAt: string;
  scenarioId: string;
  snapshotReference: string;
  branchId: string;
  branchReference: string;
  /** Composite reference of the recipe-copy preview revalidated at application. */
  copyPreviewReference: string;
  /** Reference of the final J4 recipe preview that produced these hops. */
  recipePreviewReference: string;
  /** Draft content the application was proven against. */
  sourceRecipeReference: string;
  /** Exact hop lines written into the draft. */
  hopsReference: string;
  alphaChoices: Record<string, HopRecipeAlphaChoice>;
  assumptions: string[];
  conditions: string[];
  /** Anchors the complete canonical J4 dossier and program application kept in the local scenario. */
  dossierReference?: string;
  programApplicationReference?: string;
  materialReferences?: Array<{ id: string; reference: string }>;
  limits?: string[];
  reference: string;
}

/** A proven hop-only application, handed to the wizard. Nothing is persisted here. */
export interface HopV55RecipeDraftApplicationV1 {
  identity: HopV55RecipeDraftIdentity;
  sourceRecipeReference: string;
  hops: HopIngredient[];
  record: HopV55RecipeApplicationRecordV1;
}

/** Host seam: the wizard owns its draft, its save and its navigation. */
export interface HopV55RecipeDraftTarget extends HopV55RecipeDraftIdentity {
  /** Applies a canonical, freshly revalidated hop application to the wizard draft (never saves it). */
  apply(application: HopV55RecipeDraftApplicationV1): void | Promise<void>;
  onCorrectContext?(step: 'identite' | 'levure' | 'paliers'): void;
}

export type HopV55RecipeDraftApplyResult =
  | { status: 'ready'; application: HopV55RecipeDraftApplicationV1 }
  | { status: 'blocked'; reason: string; recompute: boolean };

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && !!value.trim();
const blocked = (reason: string, recompute = false) => ({ status: 'blocked' as const, reason, recompute });

/** Refuses another owner, another draft, a batch or a missing draft before any engine call. */
export function hopV55RecipeDraftContextError(context: BrewerContext | undefined, identity: HopV55RecipeDraftIdentity,
  servicesOwnerKey: string): string | undefined {
  if (!text(identity.ownerKey) || !text(identity.draftId)) return 'Profil ou identifiant du brouillon absent; l’application est refusée.';
  if (servicesOwnerKey !== identity.ownerKey) return 'Le dossier V5.5 appartient à un autre profil que ce brouillon; l’application est refusée.';
  if (!context) return 'Le contexte courant du brouillon est indisponible; relis-le avant d’appliquer.';
  if (context.batch) return 'Ce contexte contient un brassin; un brouillon de recette ne réécrit jamais un brassin ni son snapshot.';
  const recipe = context.recipe as Recipe | undefined;
  if (!recipe || recipe.id !== identity.draftId) {
    return 'Le contexte relu n’est pas le brouillon ouvert (autre recette ou recette absente); recharge l’étape avant d’appliquer.';
  }
  return undefined;
}

/** First explicit gesture: canonical branch preview recomputed on the current draft context. */
export function previewHopV55RecipeDraftApplication(input: {
  identity: HopV55RecipeDraftIdentity;
  servicesOwnerKey: string;
  result: BrewingScenarioResult;
  branchId: string;
  context: BrewerContext;
  alphaChoices?: Record<string, HopRecipeAlphaChoice>;
}): HopV55BranchPreviewResult {
  const identityError = hopV55RecipeDraftContextError(input.context, input.identity, input.servicesOwnerKey);
  if (identityError) return blocked(identityError, true);
  return previewHopV55Branch({ result: input.result, branchId: input.branchId, context: input.context,
    alphaChoices: structuredClone(input.alphaChoices ?? {}) });
}

function unchangedOutsideHops(before: Recipe, after: Recipe): string | undefined {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (J4_CHANGED_FIELDS.has(key)) continue;
    const left = (before as unknown as Record<string, unknown>)[key];
    const right = (after as unknown as Record<string, unknown>)[key];
    if (hopDecisionReference(left ?? null) !== hopDecisionReference(right ?? null)) return key;
  }
  return undefined;
}

function recordBody(record: Omit<HopV55RecipeApplicationRecordV1, 'reference'> | HopV55RecipeApplicationRecordV1) {
  const { reference: _reference, ...body } = record as HopV55RecipeApplicationRecordV1;
  return body;
}

/**
 * Second explicit gesture. Revalidates the confirmed preview on the fresh draft
 * context through the canonical copy path (recalculation, branch scope, J4
 * apply), then keeps only the hop lines on the same draft identity.
 */
export function applyHopV55RecipeDraftApplication(input: {
  identity: HopV55RecipeDraftIdentity;
  servicesOwnerKey: string;
  preview: HopV55ReadyPreview;
  context: BrewerContext;
  workspaceId: string | null;
  appliedAt: string;
  newId(): string;
}): HopV55RecipeDraftApplyResult {
  const identityError = hopV55RecipeDraftContextError(input.context, input.identity, input.servicesOwnerKey);
  if (identityError) return blocked(identityError, true);
  if (input.preview.sourceRecipeId !== input.identity.draftId) {
    return blocked('L’aperçu a été préparé pour une autre recette que ce brouillon; refais l’aperçu.', true);
  }
  const current = input.context.recipe as Recipe;
  const checked = applyHopV55RecipeDraft({ preview: input.preview, context: input.context });
  if (checked.status === 'blocked') return checked;
  const applied = checked.recipe;
  if (hopDecisionReference(applied) !== hopDecisionReference(input.preview.recipePreview.draft.recipe)) {
    return blocked('Le brouillon recalculé diffère de l’aperçu final confirmé; refais l’aperçu.', true);
  }
  const changedKey = unchangedOutsideHops(current, applied);
  if (changedKey) {
    return blocked(`La proposition modifierait aussi « ${changedKey} »; seule une adoption explicite dans son étape peut le faire.`);
  }
  const hops = structuredClone(applied.hops);
  const dossier = input.preview.recipePreview.draft.dossier;
  const body: Omit<HopV55RecipeApplicationRecordV1, 'reference'> = {
    format: HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT,
    id: `hop-v55-recipe-application:${input.newId()}`,
    ownerKey: input.identity.ownerKey,
    recipeId: input.identity.draftId,
    workspaceId: input.workspaceId,
    appliedAt: input.appliedAt,
    scenarioId: input.preview.scenarioId,
    snapshotReference: hopV55RecipeApplicationValueReference('snapshot', input.preview.snapshotReference),
    branchId: input.preview.branchId,
    branchReference: hopV55RecipeApplicationValueReference('branch', input.preview.branchReference),
    copyPreviewReference: hopV55RecipeApplicationValueReference('preview', input.preview.reference),
    recipePreviewReference: hopV55RecipeApplicationValueReference('recipePreview', input.preview.recipePreview.reference),
    sourceRecipeReference: hopV55RecipeApplicationValueReference('sourceRecipe', input.preview.sourceRecipeReference),
    hopsReference: hopV55RecipeApplicationValueReference('hops', hops),
    alphaChoices: structuredClone(input.preview.recipePreview.alphaChoices),
    assumptions: [...dossier.assumptions],
    conditions: [...new Set([...(input.preview.recipePreview.conditions ?? []), ...(dossier.conditions ?? []),
      ...input.preview.recipePreview.programApplication.proposal.conditions])],
    dossierReference: hopAdviceContentReference('hop-v55-recipe-application-dossier-v1', dossier),
    programApplicationReference: hopAdviceContentReference('hop-v55-recipe-application-program-v1', input.preview.recipePreview.programApplication),
    materialReferences: dossier.materials.filter(material => dossier.after.additions.some(addition => addition.materialId === material.id))
      .map(material => ({ id: material.id, reference: hopAdviceContentReference('hop-v55-recipe-application-material-v1', material) })),
    limits: [...input.preview.recipePreview.analysis.limits],
  };
  const record: HopV55RecipeApplicationRecordV1 = { ...body, reference: hopAdviceContentReference(HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, body) };
  return { status: 'ready', application: { identity: { ...input.identity },
    sourceRecipeReference: input.preview.sourceRecipeReference, hops, record } };
}

export type HopV55RecipeApplicationRead =
  | { status: 'current'; record: HopV55RecipeApplicationRecordV1 }
  | { status: 'unsupported'; format: string; raw: unknown }
  | { status: 'invalid'; reason: string; raw: unknown };

/** Reads one stored provenance row exactly; a future or altered row stays raw and read-only. */
export function readHopV55RecipeApplication(value: unknown): HopV55RecipeApplicationRead {
  if (!isRecord(value)) return { status: 'invalid', reason: 'Trace V5.5 illisible.', raw: value };
  if (typeof value.format === 'string' && value.format.startsWith(FORMAT_PREFIX) && value.format !== HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT) {
    return { status: 'unsupported', format: value.format, raw: value };
  }
  if (value.format !== HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT) return { status: 'invalid', reason: 'Trace V5.5 de format inconnu.', raw: value };
  const allowed = ['format', 'id', 'ownerKey', 'recipeId', 'workspaceId', 'appliedAt', 'scenarioId', 'snapshotReference', 'branchId',
    'branchReference', 'copyPreviewReference', 'recipePreviewReference', 'sourceRecipeReference', 'hopsReference', 'alphaChoices',
    'assumptions', 'conditions', 'dossierReference', 'programApplicationReference', 'materialReferences', 'limits', 'reference'];
  if (Object.keys(value).some(key => !allowed.includes(key))
    || !['id', 'ownerKey', 'recipeId', 'appliedAt', 'scenarioId', 'snapshotReference', 'branchId', 'branchReference',
      'copyPreviewReference', 'recipePreviewReference', 'sourceRecipeReference', 'hopsReference', 'reference'].every(key => text(value[key]))
    || !(value.workspaceId === null || text(value.workspaceId)) || !Number.isFinite(Date.parse(value.appliedAt as string))
    || !isRecord(value.alphaChoices) || Object.values(value.alphaChoices).some(choice => !isRecord(choice)
      || typeof choice.value !== 'number' || !Number.isFinite(choice.value) || !text(choice.reason))
    || !Array.isArray(value.assumptions) || !value.assumptions.every(row => typeof row === 'string')
    || !Array.isArray(value.conditions) || !value.conditions.every(row => typeof row === 'string')
    || value.dossierReference !== undefined && !text(value.dossierReference)
    || value.programApplicationReference !== undefined && !text(value.programApplicationReference)
    || value.materialReferences !== undefined && (!Array.isArray(value.materialReferences)
      || !value.materialReferences.every(row => isRecord(row) && text(row.id) && text(row.reference) && Object.keys(row).every(key => key === 'id' || key === 'reference')))
    || value.limits !== undefined && (!Array.isArray(value.limits) || !value.limits.every(row => typeof row === 'string'))) {
    return { status: 'invalid', reason: 'Trace V5.5 incomplète; elle reste conservée sans être réinterprétée.', raw: value };
  }
  const record = value as unknown as HopV55RecipeApplicationRecordV1;
  if (hopAdviceContentReference(HOP_V55_RECIPE_DRAFT_APPLICATION_FORMAT, recordBody(record)) !== record.reference) {
    return { status: 'invalid', reason: 'Trace V5.5 altérée : son empreinte ne correspond plus à son contenu.', raw: value };
  }
  return { status: 'current', record: structuredClone(record) };
}

export function readHopV55RecipeApplications(value: unknown): {
  records: HopV55RecipeApplicationRecordV1[];
  unreadable: Array<Exclude<HopV55RecipeApplicationRead, { status: 'current' }>>;
} {
  if (value === undefined) return { records: [], unreadable: [] };
  if (!Array.isArray(value)) return { records: [], unreadable: [{ status: 'invalid', reason: 'Historique V5.5 de la recette illisible; conservé tel quel.', raw: value }] };
  const reads = value.map(readHopV55RecipeApplication);
  return {
    records: reads.flatMap(read => read.status === 'current' ? [read.record] : []),
    unreadable: reads.filter((read): read is Exclude<HopV55RecipeApplicationRead, { status: 'current' }> => read.status !== 'current'),
  };
}

/** Append-only: existing rows, including future or unreadable ones, are kept verbatim. */
export function appendHopV55RecipeApplication(existing: unknown, record: HopV55RecipeApplicationRecordV1): unknown[] {
  if (existing !== undefined && !Array.isArray(existing)) {
    throw new Error('L’historique V5.5 de cette recette est illisible; il est conservé tel quel et aucune application n’y est ajoutée.');
  }
  const read = readHopV55RecipeApplication(record);
  if (read.status !== 'current') throw new Error('La trace d’application V5.5 à conserver est invalide.');
  const rows = Array.isArray(existing) ? existing : [];
  const previous = rows.find(row => isRecord(row) && row.id === record.id);
  if (previous !== undefined) {
    const previousRead = readHopV55RecipeApplication(previous);
    if (previousRead.status !== 'current' || previousRead.record.reference !== record.reference)
      throw new Error('Cet identifiant d’application est déjà lié à une autre trace; aucune donnée n’est remplacée.');
    return structuredClone(rows);
  }
  return [...structuredClone(rows), structuredClone(record)];
}

/**
 * Wizard-side guard at the moment of writing: same owner, same draft, and the
 * draft content the application was proven against. A later edit makes it stale.
 */
export function assertHopV55RecipeDraftApplicationTarget(application: HopV55RecipeDraftApplicationV1,
  current: Recipe, identity: HopV55RecipeDraftIdentity): void {
  if (application.identity.ownerKey !== identity.ownerKey || application.record.ownerKey !== identity.ownerKey) {
    throw new Error('Cette application vient d’un autre profil; le brouillon n’est pas modifié.');
  }
  if (application.identity.draftId !== identity.draftId || application.record.recipeId !== identity.draftId || current.id !== identity.draftId) {
    throw new Error('Cette application vise un autre brouillon; le brouillon courant n’est pas modifié.');
  }
  const canonical = canonicalizeHopV55RecipeDraft({ ...identity, draft: current });
  if (hopDecisionReference(canonical.recipe) !== application.sourceRecipeReference) {
    throw new Error('Le brouillon a changé depuis l’aperçu; refais l’aperçu avant d’appliquer.');
  }
  if (hopV55RecipeApplicationValueReference('hops', application.hops) !== application.record.hopsReference
    || hopV55RecipeApplicationValueReference('sourceRecipe', application.sourceRecipeReference) !== application.record.sourceRecipeReference
    || readHopV55RecipeApplication(application.record).status !== 'current') {
    throw new Error('L’application reçue ne correspond plus à sa trace scellée; le brouillon n’est pas modifié.');
  }
}
