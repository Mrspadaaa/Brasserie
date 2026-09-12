import type { BrewerChatInput, BrewerScope } from './companionTypes.js';
import { BREWER_APP_SCREENS } from './brewerAppScreens.js';
export const scopeKey = (s: BrewerScope) => `${s.kind}:${s.id}`;
export function validateScope(s: unknown): BrewerScope {
  const v = s as BrewerScope;
  if (
    !v ||
    !['recipe', 'batch', 'draft', 'app'].includes(v.kind) ||
    typeof v.id !== 'string' ||
    !/^[\w-]{1,100}$/.test(v.id) ||
    (v.kind === 'app' && !Object.prototype.hasOwnProperty.call(BREWER_APP_SCREENS, v.id))
  )
    throw new Error('Contexte de conversation invalide.');
  return { kind: v.kind, id: v.id };
}
/** Constrained JSON; reject oversized/deep payloads before allocating model context. */
export function cleanContext(v: unknown, depth = 0): any {
  if (depth > 18) throw new Error('Contexte trop imbriqué.');
  if (v == null || typeof v === 'boolean') return v;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new Error('Nombre non fini.');
    return v;
  }
  if (typeof v === 'string') {
    if (v.length > 12000) throw new Error('Texte de contexte trop long.');
    return v;
  }
  if (Array.isArray(v)) {
    if (v.length > 500) throw new Error('Trop de valeurs.');
    return v.map((x) => cleanContext(x, depth + 1));
  }
  if (typeof v !== 'object') throw new Error('Valeur de contexte invalide.');
  const entries = Object.entries(v);
  if (entries.length > 500) throw new Error('Trop de champs.');
  return Object.fromEntries(
    entries
      .filter(
        ([k, x]) =>
          x !== undefined && !['__proto__', 'prototype', 'constructor', '__docId'].includes(k)
      )
      .map(([k, x]) => [k, cleanContext(x, depth + 1)])
  );
}
export function pick(value: any, keys: string[]) {
  return cleanContext(
    Object.fromEntries(keys.filter((k) => value?.[k] !== undefined).map((k) => [k, value[k]]))
  );
}
export const RECIPE_FIELDS =
  'id name style styleRef fermentationIntent nolo volumeL ogTarget fgTarget abvTarget ibuTarget colorEbc efficiencyPct preBoilL preBoilHotL fermentables malts totalGristKg hops adjuncts yeast boilMin mash waterPlan fermentation instructions steps notes notesCreation carboTarget brewhouse sourceRecipeId capturedAt hopMatrixId hopAromaTarget hopPredictionIds hopTrialId'.split(
    ' '
  );
export const BATCH_FIELDS =
  'id name style nolo status brewDate volumeL volumeBrewedL og fg gravityLog yeast notesCreation notesBrewDay notesTasting brewNotes mashPhTarget mashPhActual carbonation'.split(
    ' '
  );
export function validateChatInput(raw: any): BrewerChatInput {
  const scope = validateScope(raw?.scope);
  if (typeof raw.operationId !== 'string' || !/^[\w-]{16,100}$/.test(raw.operationId))
    throw new Error('Identifiant de message invalide.');
  if (
    typeof raw.question !== 'string' ||
    raw.question.trim().length < 2 ||
    raw.question.length > 3000
  )
    throw new Error('Écris une question de2 à3000 caractères.');
  if (Buffer.byteLength(JSON.stringify(raw)) > 100000) throw new Error('Contexte trop volumineux.');
  if (raw.mode != null && !['fast', 'auto', 'deep'].includes(raw.mode))
    throw new Error('Mode d’analyse invalide.');
  if (raw.generation != null && (!Number.isSafeInteger(raw.generation) || raw.generation < 0))
    throw new Error('Version de conversation invalide.');
  const allowedTargets = scope.kind === 'app' ? [] : scope.kind === 'batch' ? ['journal', 'batch'] : ['recipe'];
  if (
    raw.editableTargets != null &&
    (!Array.isArray(raw.editableTargets) ||
      raw.editableTargets.length > 2 ||
      raw.editableTargets.some((x: string) => !allowedTargets.includes(x)))
  )
    throw new Error('Formulaire de modification invalide.');
  if (
    scope.kind === 'draft' &&
    (!raw.draft || typeof raw.draft !== 'object' || Array.isArray(raw.draft))
  )
    throw new Error('Brouillon manquant.');
  return {
    scope,
    operationId: raw.operationId,
    question: raw.question.trim(),
    // Keep old operation digests compatible when no mode was provided.
    ...(raw.mode != null ? { mode: raw.mode } : {}),
    ...(raw.generation != null ? { generation: raw.generation } : {}),
    ...(raw.editableTargets != null ? { editableTargets: raw.editableTargets } : {}),
    ...(scope.kind === 'draft' ? { draft: pick(raw.draft, RECIPE_FIELDS) } : {}),
    ...(scope.kind === 'batch' && raw.localJournal
      ? { localJournal: cleanContext(raw.localJournal) }
      : {}),
    phase: typeof raw.phase === 'string' ? raw.phase.slice(0, 120) : scope.kind
  };
}
