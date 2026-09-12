import type { Recipe } from '../types';
import type { RecipeStepId } from '../domain/recipeValidation';
import type { WaterState } from '../ui/SaltSolver';

export interface RecipeWizardDraft {
  recipe: Recipe;
  details: Partial<Recipe>;
  step: RecipeStepId;
  water: WaterState;
  volumesEdited: boolean;
  waterProfileAuto: boolean;
  targetBasis: string;
  mashRatioOverride: number | null;
}

const PREFIX = 'laffinee_recipe_draft_v1:';
const MISSING = '__recipe_number_missing__';

// NaN is an editor-only missing number. Keep it missing through JSON instead of
// restoring a default or a zero. Validated recipes never contain this marker.
export function serializeRecipeDraft(draft: RecipeWizardDraft): string {
  return JSON.stringify({ version: 1, draft }, (_key, value) =>
    typeof value === 'number' && !Number.isFinite(value) ? { [MISSING]: true } : value);
}

export function readRecipeDraft(key: string | undefined): RecipeWizardDraft | undefined {
  if (!key) return undefined;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const stored = JSON.parse(raw, (_key, value) => value && typeof value === 'object' &&
      Object.keys(value).length === 1 && value[MISSING] === true ? Number.NaN : value);
    const draft = stored?.draft;
    if (stored?.version !== 1 || !draft?.recipe || typeof draft.recipe.id !== 'string' ||
      typeof draft.recipe.name !== 'string' || !draft.details || !draft.water ||
      !['identite', 'fermentescibles', 'houblons', 'levure', 'paliers', 'eau', 'recap'].includes(draft.step)) return undefined;
    return draft;
  } catch { return undefined; }
}

export function writeRecipeDraft(key: string, serialized: string): void {
  localStorage.setItem(PREFIX + key, serialized);
}

export function clearRecipeDraft(key: string | undefined): void {
  if (key) localStorage.removeItem(PREFIX + key);
}
