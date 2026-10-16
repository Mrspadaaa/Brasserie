import type { BrewerContext } from '../../../functions/src/companionTypes';
import type { Batch, Recipe } from '../../types';
import { hopAdviceContentReference } from '../../domain/hopDecision/adviceContentReference';
import { StorageService } from '../storage';
import type { HopV55ContextSource } from './contracts';

/** Numeric unknowns in a read-only recipe-context projection are explicit nulls, never NaN or zero. */
type CanonicalMissingNumbers<T> = T extends number ? number | null
  : T extends Date ? Date
  : T extends readonly (infer Item)[] ? Array<CanonicalMissingNumbers<Item>>
  : T extends object ? { [Key in keyof T]: CanonicalMissingNumbers<T[Key]> }
  : T;

export type HopV55CanonicalRecipeDraft = CanonicalMissingNumbers<Recipe>;

export interface HopV55CanonicalRecipeDraftContext {
  /** A separate, JSON-safe read-only projection; the Wizard keeps its raw NaN sentinels. */
  recipe: HopV55CanonicalRecipeDraft;
  /** Binds owner, draft identity, and canonical Recipe content; not an authorization token. */
  reference: string;
}

export interface HopV55RecipeDraftCanonicalInput {
  ownerKey: string;
  draftId: string;
  draft: Recipe;
}

/** Read-only stores used to complete the draft context; the draft itself never comes from them. */
export interface HopV55RecipeStepStorage {
  getHopVarieties(): NonNullable<BrewerContext['hopIndex']>['varieties'];
  getHopLots(): NonNullable<BrewerContext['hopIndex']>['lots'];
  getHopKnowledge(): NonNullable<BrewerContext['hopIndex']>['knowledge'];
  getStocks(): { rawMaterials: unknown[] };
  getBatches(): Batch[];
}

export interface HopV55RecipeDraftContextOptions {
  /** Explicit local account partition supplied by the host; never parsed from a draft key. */
  ownerKey: string;
  /** Stable identifier of the recipe being written in the wizard. */
  draftId: string;
  /** Latest complete draft built by the wizard, including fields still missing or unsaved. */
  readDraft(): Recipe | undefined;
  /** @internal Deterministic test seam; production reads the local application stores. */
  storage?: HopV55RecipeStepStorage;
  now?(): number;
}

const stablePart = (value: unknown): value is string => typeof value === 'string' && !!value.trim()
  && value.trim() === value && value.length <= 160 && !/[\\/\u0000-\u001f]/.test(value);

export function hopV55RecipeDraftIdentityError(ownerKey: unknown, draftId: unknown): string | undefined {
  if (!stablePart(ownerKey)) return 'Le profil propriétaire de ce brouillon n’est pas fourni explicitement; l’atelier V5.5 reste fermé.';
  if (!stablePart(draftId)) return 'L’identifiant stable de ce brouillon de recette est absent ou invalide.';
  return undefined;
}

function canonicalMissingNumbers(value: unknown, path: string): unknown {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return null;
    if (!Number.isFinite(value)) throw new Error('Nombre infini interdit dans le brouillon V5.5 (' + path + '); seul le sentinelle NaN désigne une donnée manquante.');
    return value;
  }
  if (Array.isArray(value)) return value.map((item, index) => canonicalMissingNumbers(item, path + '[' + index + ']'));
  if (value instanceof Date) return new Date(value.getTime());
  if (!value || typeof value !== 'object') return value;

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('Objet non sérialisable dans le brouillon V5.5 (' + path + ').');
  }
  const result: Record<string, unknown> = Object.create(prototype);
  for (const [key, child] of Object.entries(value)) {
    result[key] = canonicalMissingNumbers(child, path + '.' + key);
  }
  return result;
}

/**
 * The one canonical read-only representation used by the recipe-step context
 * and its callers' source/freshness guards. Missing-number NaN sentinels become
 * null only in the projection; the live Wizard draft remains untouched.
 */
export function canonicalizeHopV55RecipeDraft(input: HopV55RecipeDraftCanonicalInput): HopV55CanonicalRecipeDraftContext {
  const identityError = hopV55RecipeDraftIdentityError(input?.ownerKey, input?.draftId);
  if (identityError) throw new Error(identityError);
  if (!input.draft || typeof input.draft !== 'object' || input.draft.id !== input.draftId) {
    throw new Error('Le brouillon actif ne correspond pas à son identifiant; aucun contenu enregistré ne le remplace.');
  }

  const recipe = canonicalMissingNumbers(input.draft, 'recipe') as HopV55CanonicalRecipeDraft;
  const reference = hopAdviceContentReference('hop-v55-recipe-step-draft-context-v1', {
    ownerKey: input.ownerKey, draftId: input.draftId, recipe,
  });
  return { recipe, reference };
}

/**
 * Context provider for the V5.5 runtime mounted inside the recipe wizard.
 *
 * The draft being written is the only recipe source: an explicit recipe source
 * with this draft ID resolves to the live draft, never to the saved recipe of
 * the same ID. Any other recipe or batch source is refused instead of being
 * substituted from storage.
 */
export function createHopV55RecipeDraftContextSource(options: HopV55RecipeDraftContextOptions) {
  const identityError = hopV55RecipeDraftIdentityError(options.ownerKey, options.draftId);
  if (identityError) throw new Error(identityError);
  const storage: HopV55RecipeStepStorage = options.storage ?? StorageService;
  const now = options.now ?? (() => Date.now());

  const shared = (): Omit<BrewerContext, 'recipe' | 'phase' | 'provenance'> => {
    const batches = storage.getBatches();
    return {
      hopIndex: { varieties: storage.getHopVarieties(), lots: storage.getHopLots(), knowledge: storage.getHopKnowledge(),
        predictions: [], tastings: [], truncated: [] },
      inventory: storage.getStocks().rawMaterials,
      stockReservations: { complete: false, batches: batches.map(row => ({ ...row, stockConsumption: row.stockConsumption ?? null })), source: 'localCache' },
      material: [], waterSources: [], now: now(), editableTargets: [],
    };
  };

  return async (source?: HopV55ContextSource): Promise<BrewerContext> => {
    if (source?.kind === 'exploration') {
      return { ...shared(), phase: 'Exploration sans recette ni brassin source',
        provenance: ['Exploration explicitement ouverte depuis le créateur de recette; le brouillon n’est pas repris.'] };
    }
    if (source?.kind === 'batch') {
      throw new Error('Le créateur de recette n’ouvre aucun brassin (« ' + source.batchId + ' »); aucun brassin ni journal n’est substitué.');
    }
    if (source && source.kind !== 'recipe') {
      throw new Error('Source V5.5 non prise en charge par l’étape Houblons du créateur de recette.');
    }
    if (source?.kind === 'recipe' && source.recipeId !== options.draftId) {
      throw new Error('La recette « ' + source.recipeId + ' » n’est pas le brouillon ouvert (« ' + options.draftId + ' »); aucune recette enregistrée n’est substituée.');
    }
    const draft = options.readDraft();
    if (!draft || typeof draft !== 'object' || draft.id !== options.draftId) {
      throw new Error('Le brouillon actif ne correspond plus à son identifiant; recharge l’étape avant de continuer. Aucune recette enregistrée n’est substituée.');
    }
    const canonical = canonicalizeHopV55RecipeDraft({ ownerKey: options.ownerKey, draftId: options.draftId, draft });
    return {
      ...shared(),
      recipe: canonical.recipe,
      phase: 'Brouillon de recette en cours d’écriture',
      provenance: [
        'Brouillon exact du créateur de recette : ' + options.draftId + '; référence ' + canonical.reference + '.',
        'La projection read-only représente les sentinelles numériques manquantes par null; le brouillon Wizard garde ses valeurs brutes.',
        'Aucune recette enregistrée du même identifiant, aucun brassin et aucun journal ne remplacent ce brouillon.',
      ],
    };
  };
}