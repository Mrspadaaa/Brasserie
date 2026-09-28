import type { Recipe, YeastSpec } from '../types';
import type { RecipeStepId } from '../domain/recipeValidation';
import type { WaterState } from '../ui/SaltSolver';
import { readYeastDocumentaryBody, readYeastDocumentarySheet, readYeastLocalDocumentary,
  type YeastCandidateDocumentaryFields, type YeastDocumentaryBody, type YeastDocumentarySheet, type YeastLocalDocumentary } from '../../functions/src/yeastDocumentarySheet';
import type { YeastTechnicalSelections } from '../../functions/src/yeastTechnicalFacts';

export type { YeastCandidateDocumentaryFields } from '../../functions/src/yeastDocumentarySheet';

export interface YeastCandidateSheetDraft extends YeastDocumentaryBody {
  /** Stable catalogue identity. Never key a working sheet by the display name. */
  hopIndexId: string;
  /** Local revision for stale lookup-response rejection. */
  revision: number;
}
export type YeastCandidateSheets = Record<string, YeastCandidateSheetDraft>;
export type YeastCandidateSheetUpdate = Omit<YeastCandidateSheetDraft, 'revision'>;

export interface RecipeWizardDraft {
  recipe: Recipe;
  details: Partial<Recipe>;
  step: RecipeStepId;
  water: WaterState;
  volumesEdited: boolean;
  waterProfileAuto: boolean;
  targetBasis: string;
  mashRatioOverride: number | null;
  /** Candidate-local accepted facts, persisted with this browser's recipe draft. */
  candidateSheets?: YeastCandidateSheets;
  /** Ephemeral recovery warning; shown by the Wizard and excluded from local serialization. */
  candidateSheetsReadWarning?: string;
}
export type YeastCandidateSheetAcceptance =
  | { accepted: true; draft: RecipeWizardDraft; hopIndexId: string; revision: number }
  | { accepted: false; reason: 'identity' | 'revision' | 'invalid'; message: string };

const PREFIX = 'laffinee_recipe_draft_v1:';
const MISSING = '__recipe_number_missing__';

/** Strictly read the local candidate cache: only identity, revision and accepted facts are persisted. */
export function readYeastCandidateSheets(value: unknown): YeastCandidateSheets | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const entries = Object.entries(value as Record<string, unknown>);
  const result: YeastCandidateSheets = {};
  for (const [id, row] of entries) {
    if (!id.trim() || id !== id.trim() || id.length > 200 || !row || typeof row !== 'object' || Array.isArray(row)) return undefined;
    const candidate = row as Record<string, unknown>;
    if (candidate.hopIndexId !== id || !Number.isSafeInteger(candidate.revision) || (candidate.revision as number) < 0) return undefined;
    const { hopIndexId: _hopIndexId, revision, ...bodyInput } = candidate;
    const body = readYeastDocumentaryBody(bodyInput);
    if (!body) return undefined;
    result[id] = { hopIndexId: id, revision: revision as number, ...body };
  }
  return result;
}

/** Revision 0 means this stable candidate has not received accepted local edits yet. */
export function yeastCandidateSheetRevision(draft: Pick<RecipeWizardDraft, 'candidateSheets'>, hopIndexId: string): number {
  return draft.candidateSheets?.[hopIndexId]?.revision ?? 0;
}

const owns = (value: object | undefined, key: PropertyKey): boolean => !!value && Object.prototype.hasOwnProperty.call(value, key);
const sameValue = (left: unknown, right: unknown): boolean => JSON.stringify(left) === JSON.stringify(right);
const DOCUMENTARY_SCALAR_KEYS = ['lab', 'strain', 'form', 'fermTempMinC', 'fermTempMaxC', 'flocculation',
  'alcoholTolerancePct', 'fermentDays', 'technicalSource'] as const;

export type YeastDocumentaryScope = 'catalogue' | 'local';
export type YeastDocumentaryIntent = 'documentary' | 'hypothesis' | 'replace-selection';
export interface YeastDocumentaryAction { intent: YeastDocumentaryIntent }
export type YeastDocumentaryRefusalReason = 'invalid' | 'scope-conflict' | 'selection-changed';
export type YeastDocumentaryView<T extends Partial<YeastSpec> = YeastSpec> =
  | { status: 'none'; effectiveYeast: T }
  | { status: 'valid'; scope: YeastDocumentaryScope; body: YeastDocumentaryBody; effectiveYeast: T }
  | { status: 'invalid' | 'conflict'; scope?: YeastDocumentaryScope; message: string; effectiveYeast: T };
export type YeastDocumentaryAdoption =
  | { accepted: true; yeast: YeastSpec }
  | { accepted: false; reason: YeastDocumentaryRefusalReason; message: string; yeast: YeastSpec };

function applyYeastDocumentaryBody<T extends Partial<YeastSpec>>(yeast: T, body: YeastDocumentaryBody): T {
  const next = structuredClone(yeast) as T & Partial<YeastSpec>;
  const documentary = body.documentary;
  if (documentary) {
    for (const key of DOCUMENTARY_SCALAR_KEYS) {
      if (owns(documentary, key)) {
        const value = documentary[key];
        (next as unknown as Record<string, unknown>)[key] = value == null ? undefined : value;
      }
    }
  }
  const hypothesis = next.attenuationBasis === 'recipe' || next.attenuationBasis === 'measured';
  const selections = body.technicalSelections;
  const selectionHas = (key: keyof YeastTechnicalSelections) => owns(selections, key);
  if (!hypothesis && owns(documentary, 'declaredAttenuationPct')) {
    next.attenuationPct = documentary?.declaredAttenuationPct ?? undefined;
    next.attenuationBasis = 'declared';
  }
  if (!hypothesis && selectionHas('attenuation') && selections?.attenuation === null) {
    next.attenuationPct = undefined;
    next.attenuationBasis = 'declared';
  }
  if (selectionHas('temperature') && selections?.temperature === null) {
    next.fermTempMinC = undefined;
    next.fermTempMaxC = undefined;
  }
  if (selectionHas('alcoholTolerance') && selections?.alcoholTolerance === null) next.alcoholTolerancePct = undefined;
  if (selectionHas('flocculation') && selections?.flocculation === null) next.flocculation = undefined;
  if (owns(body, 'technicalFacts')) next.technicalFacts = structuredClone(body.technicalFacts!);
  if (owns(body, 'technicalSelections')) next.technicalSelections = structuredClone(body.technicalSelections!);
  if (owns(body, 'documentaryNotes')) next.documentaryNotes = structuredClone(body.documentaryNotes!);
  if (owns(body, 'fermentationFacts')) next.fermentationFacts = structuredClone(body.fermentationFacts!);
  return next;
}

/** One validated, non-writing reader for catalogue and recipe/lot documentary scopes. */
export function readYeastDocumentaryView<T extends Partial<YeastSpec>>(yeast: T): YeastDocumentaryView<T> {
  const original = structuredClone(yeast);
  const hasCatalogue = yeast.adoptedDocumentary !== undefined;
  const hasLocal = yeast.localDocumentary !== undefined;
  if (hasCatalogue && hasLocal) return { status: 'conflict', message: 'Les fiches catalogue et locales coexistent sans portée choisie.', effectiveYeast: original };
  if (!hasCatalogue && !hasLocal) return { status: 'none', effectiveYeast: original };
  if (hasCatalogue) {
    if (!yeast.hopIndexId) return { status: 'invalid', scope: 'catalogue', message: 'La fiche adoptée n’a pas d’identité catalogue.', effectiveYeast: original };
    const sheet = readYeastDocumentarySheet(yeast.adoptedDocumentary, yeast.hopIndexId);
    if (!sheet) return { status: 'invalid', scope: 'catalogue', message: 'La fiche adoptée est invalide ou liée à une autre souche.', effectiveYeast: original };
    const { version: _version, hopIndexId: _hopIndexId, ...body } = sheet;
    return { status: 'valid', scope: 'catalogue', body, effectiveYeast: applyYeastDocumentaryBody(original, body) };
  }
  const local = readYeastLocalDocumentary(yeast.localDocumentary);
  if (!local) return { status: 'invalid', scope: 'local', message: 'La fiche documentaire locale est invalide.', effectiveYeast: original };
  const { version: _version, ...body } = local;
  return { status: 'valid', scope: 'local', body, effectiveYeast: applyYeastDocumentaryBody(original, body) };
}

/** Return only an identity- and version-compatible adopted sheet. */
export function readAdoptedYeastDocumentary(
  yeast: Pick<YeastSpec, 'hopIndexId' | 'adoptedDocumentary' | 'localDocumentary'>
): YeastDocumentarySheet | undefined {
  if (!yeast.hopIndexId || yeast.localDocumentary !== undefined) return undefined;
  return readYeastDocumentarySheet(yeast.adoptedDocumentary, yeast.hopIndexId);
}

/** Return only a valid recipe/lot-local sheet. */
export function readLocalYeastDocumentary(
  yeast: Pick<YeastSpec, 'localDocumentary'>
): YeastLocalDocumentary | undefined {
  return readYeastLocalDocumentary(yeast.localDocumentary);
}

/** Read an effective yeast view. This is pure and never adopts or writes a sheet. */
export function yeastWithAdoptedDocumentary<T extends Partial<YeastSpec>>(yeast: T): T {
  return readYeastDocumentaryView(yeast).effectiveYeast;
}

function documentaryBodyFromYeast(yeast: YeastSpec): YeastDocumentaryBody | undefined {
  const documentary: YeastCandidateDocumentaryFields = {};
  for (const key of DOCUMENTARY_SCALAR_KEYS) {
    if (!owns(yeast, key) || yeast[key] === undefined) continue;
    const value = yeast[key];
    // Historical free/stock recipes can contain blank strings. They remain
    // untouched on the recipe but do not invalidate another accepted field.
    if (typeof value === 'string' && !value.trim()) continue;
    (documentary as Record<string, unknown>)[key] = value;
  }
  const attenuationUnknown = owns(yeast.technicalSelections, 'attenuation') && yeast.technicalSelections?.attenuation === null;
  if (attenuationUnknown) documentary.declaredAttenuationPct = null;
  else if (yeast.attenuationBasis === 'declared' && yeast.attenuationPct !== undefined)
    documentary.declaredAttenuationPct = yeast.attenuationPct;
  const body: YeastDocumentaryBody = {
    ...(Object.keys(documentary).length ? { documentary } : {}),
    ...(owns(yeast, 'technicalFacts') && yeast.technicalFacts !== undefined ? { technicalFacts: yeast.technicalFacts } : {}),
    ...(owns(yeast, 'technicalSelections') && yeast.technicalSelections !== undefined ? { technicalSelections: yeast.technicalSelections } : {}),
    ...(owns(yeast, 'documentaryNotes') && yeast.documentaryNotes !== undefined ? { documentaryNotes: yeast.documentaryNotes } : {}),
    ...(owns(yeast, 'fermentationFacts') && yeast.fermentationFacts !== undefined ? { fermentationFacts: yeast.fermentationFacts } : {})
  };
  return readYeastDocumentaryBody(body);
}

function refuseYeastDocumentaryAdoption(next: YeastSpec, reason: YeastDocumentaryRefusalReason, message: string): YeastDocumentaryAdoption {
  return { accepted: false, reason, message, yeast: structuredClone(next) };
}

function choiceIdentityMatches(previous: YeastSpec, next: YeastSpec, scope: YeastDocumentaryScope): boolean {
  if (scope === 'catalogue') return previous.hopIndexId === next.hopIndexId && previous.stockItemRef === next.stockItemRef;
  return previous.stockItemRef === next.stockItemRef;
}

function bodyWithIntent(previousBody: YeastDocumentaryBody, previousEffective: YeastSpec, next: YeastSpec,
  intent: YeastDocumentaryIntent): YeastDocumentaryBody | undefined {
  const body = structuredClone(previousBody);
  if (intent === 'hypothesis') {
    const documentary = { ...(body.documentary ?? {}) };
    const nextIsHypothesis = next.attenuationBasis === 'recipe' || next.attenuationBasis === 'measured';
    if (nextIsHypothesis && previousEffective.attenuationBasis === 'declared' && previousEffective.attenuationPct !== undefined &&
        !owns(documentary, 'declaredAttenuationPct')) {
      documentary.declaredAttenuationPct = previousEffective.attenuationPct;
      if (previousEffective.technicalSource !== undefined && !owns(documentary, 'technicalSource'))
        documentary.technicalSource = previousEffective.technicalSource;
    }
    if (Object.keys(documentary).length) body.documentary = documentary;
    return readYeastDocumentaryBody(body);
  }

  const documentary = { ...(body.documentary ?? {}) };
  for (const key of DOCUMENTARY_SCALAR_KEYS) {
    if (!owns(next, key)) continue;
    const nextValue = (next as unknown as Record<string, unknown>)[key];
    const previousValue = (previousEffective as unknown as Record<string, unknown>)[key];
    if (!sameValue(previousValue, nextValue)) (documentary as Record<string, unknown>)[key] = nextValue == null ? null : nextValue;
  }
  const selectionUnknown = owns(next.technicalSelections, 'attenuation') && next.technicalSelections?.attenuation === null;
  if (selectionUnknown) documentary.declaredAttenuationPct = null;
  else if (next.attenuationBasis === 'declared' && next.attenuationPct !== undefined &&
      (previousEffective.attenuationBasis !== 'declared' || previousEffective.attenuationPct !== next.attenuationPct))
    documentary.declaredAttenuationPct = next.attenuationPct;
  else if (previousEffective.attenuationBasis === 'declared' && previousEffective.attenuationPct !== undefined &&
      next.attenuationPct === undefined && next.attenuationBasis !== 'recipe' && next.attenuationBasis !== 'measured' &&
      !owns(next.technicalSelections, 'attenuation')) documentary.declaredAttenuationPct = null;
  if (Object.keys(documentary).length) body.documentary = documentary;

  if (owns(next, 'technicalFacts') && !sameValue(previousEffective.technicalFacts, next.technicalFacts))
    body.technicalFacts = next.technicalFacts === undefined ? [] : structuredClone(next.technicalFacts);
  if (owns(next, 'technicalSelections') && !sameValue(previousEffective.technicalSelections, next.technicalSelections))
    body.technicalSelections = next.technicalSelections === undefined ? {} : structuredClone(next.technicalSelections);
  if (owns(next, 'documentaryNotes') && !sameValue(previousEffective.documentaryNotes, next.documentaryNotes))
    body.documentaryNotes = next.documentaryNotes === undefined ? [] : structuredClone(next.documentaryNotes);
  if (owns(next, 'fermentationFacts') && !sameValue(previousEffective.fermentationFacts, next.fermentationFacts)) {
    if (next.fermentationFacts === undefined) delete body.fermentationFacts;
    else body.fermentationFacts = structuredClone(next.fermentationFacts);
  }
  return readYeastDocumentaryBody(body);
}

function withYeastDocumentaryScope(yeast: YeastSpec, scope: YeastDocumentaryScope, body: YeastDocumentaryBody): YeastSpec | undefined {
  if (scope === 'catalogue') {
    if (!yeast.hopIndexId || yeast.stockItemRef || yeast.localDocumentary !== undefined) return undefined;
    const sheet = readYeastDocumentarySheet({ version: 1, hopIndexId: yeast.hopIndexId, ...body }, yeast.hopIndexId);
    return sheet ? { ...structuredClone(yeast), adoptedDocumentary: sheet } : undefined;
  }
  if (yeast.adoptedDocumentary !== undefined) return undefined;
  const localDocumentary = readYeastLocalDocumentary({ version: 1, ...body });
  return localDocumentary ? { ...structuredClone(yeast), localDocumentary } : undefined;
}

/** Explicit adoption result for UI callers that need to show a refusal. */
export function tryAdoptYeastDocumentary(previous: YeastSpec | undefined, next: YeastSpec,
  action: YeastDocumentaryAction): YeastDocumentaryAdoption {
  const nextCopy = structuredClone(next);
  const nextView = readYeastDocumentaryView(next);
  if (nextView.status === 'invalid' || nextView.status === 'conflict')
    return refuseYeastDocumentaryAdoption(next, nextView.status === 'conflict' ? 'scope-conflict' : 'invalid', nextView.message);
  const previousView = previous ? readYeastDocumentaryView(previous) : undefined;
  if (action.intent !== 'replace-selection' && previousView && (previousView.status === 'invalid' || previousView.status === 'conflict'))
    return refuseYeastDocumentaryAdoption(next, previousView.status === 'conflict' ? 'scope-conflict' : 'invalid', previousView.message);

  if (action.intent === 'replace-selection') {
    if (previous && previousView?.status === 'valid' && nextView.status === 'valid' &&
        previousView.scope === 'local' && nextView.scope === 'local' && sameValue(previousView.body, nextView.body) &&
        previous.stockItemRef === next.stockItemRef && previous.name.trim().toLocaleLowerCase('fr') === next.name.trim().toLocaleLowerCase('fr'))
      return refuseYeastDocumentaryAdoption(next, 'selection-changed', 'Le nouveau choix reprend la fiche locale du choix précédent. Recrée sa fiche avant de le retenir.');
    if (nextView.status === 'valid') return { accepted: true, yeast: nextCopy };
    const scope: YeastDocumentaryScope = next.localDocumentary !== undefined || next.stockItemRef || !next.hopIndexId ? 'local' : 'catalogue';
    const body = documentaryBodyFromYeast(next);
    if (!body || !Object.keys(body).length) return { accepted: true, yeast: nextCopy };
    const scoped = withYeastDocumentaryScope(nextCopy, scope, body);
    return scoped ? { accepted: true, yeast: scoped }
      : refuseYeastDocumentaryAdoption(next, 'invalid', 'La nouvelle fiche documentaire ne correspond pas à la portée du choix.');
  }

  if (previous && !choiceIdentityMatches(previous, next, previousView?.status === 'valid' ? previousView.scope :
      nextView.status === 'valid' ? nextView.scope : next.stockItemRef || !next.hopIndexId ? 'local' : 'catalogue'))
    return refuseYeastDocumentaryAdoption(next, 'selection-changed', 'La levure ou le lot a changé. Choisis de nouveau la portée documentaire avant de modifier la fiche.');
  if (previousView?.status === 'valid' && nextView.status === 'valid' && previousView.scope !== nextView.scope)
    return refuseYeastDocumentaryAdoption(next, 'scope-conflict', 'Les portées locale et catalogue ne sont pas fusionnées. Choisis explicitement la nouvelle portée.');

  const scope: YeastDocumentaryScope = previousView?.status === 'valid' ? previousView.scope :
    nextView.status === 'valid' ? nextView.scope : next.localDocumentary !== undefined || next.stockItemRef || !next.hopIndexId ? 'local' : 'catalogue';
  const base = previousView?.status === 'valid' ? previousView.body : nextView.status === 'valid' ? nextView.body :
    documentaryBodyFromYeast(previous ?? next);
  if (!base) return refuseYeastDocumentaryAdoption(next, 'invalid', 'Les données documentaires ne peuvent pas être validées. Rien n’a été retenu.');
  const previousEffective = previousView?.status === 'valid' ? previousView.effectiveYeast : previous ?? next;
  const body = bodyWithIntent(base, previousEffective, next, action.intent);
  if (!body) return refuseYeastDocumentaryAdoption(next, 'invalid', 'La correction documentaire est invalide. Les données précédentes sont conservées.');
  if (!Object.keys(body).length && previousView?.status !== 'valid' && nextView.status !== 'valid')
    return { accepted: true, yeast: nextCopy };
  const scoped = withYeastDocumentaryScope(nextCopy, scope, body);
  return scoped ? { accepted: true, yeast: scoped }
    : refuseYeastDocumentaryAdoption(next, 'invalid', 'La fiche documentaire ne peut pas être liée à cette portée.');
}

/** Compatibility wrapper. New UI paths should call tryAdopt... to display a refusal. */
export function adoptYeastDocumentary(previous: YeastSpec | undefined, next: YeastSpec,
  action: YeastDocumentaryAction = { intent: 'hypothesis' }): YeastSpec {
  return tryAdoptYeastDocumentary(previous, next, action).yeast;
}

/** Map a durable adopted sheet into the draft-local versioned book. */
export function candidateSheetFromAdoptedDocumentary(value: unknown, revision = 0): YeastCandidateSheetDraft | undefined {
  if (!Number.isSafeInteger(revision) || revision < 0) return undefined;
  const sheet = readYeastDocumentarySheet(value);
  if (!sheet) return undefined;
  const { version: _version, ...body } = sheet;
  return readYeastCandidateSheets({ [sheet.hopIndexId]: { ...body, revision } })?.[sheet.hopIndexId];
}

/** Remove the book-only revision when adopting a candidate sheet into a recipe. */
export function adoptedDocumentaryFromCandidateSheet(value: unknown): YeastDocumentarySheet | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const draft = value as YeastCandidateSheetDraft;
  const validated = readYeastCandidateSheets({ [draft.hopIndexId]: draft })?.[draft.hopIndexId];
  if (!validated) return undefined;
  const { revision: _revision, ...body } = validated;
  return readYeastDocumentarySheet({ version: 1, ...body }, validated.hopIndexId);
}

/** Extract only the accepted documentary part of a selected yeast. */
export function extractYeastCandidateSheet(yeast: Pick<YeastSpec, 'hopIndexId' | 'stockItemRef' | 'localDocumentary' | 'adoptedDocumentary' | 'technicalFacts' | 'documentaryNotes' | 'technicalSelections' | 'fermentationFacts' | 'lab' | 'strain' | 'form' | 'attenuationPct' | 'attenuationBasis' | 'fermTempMinC' | 'fermTempMaxC' | 'flocculation' | 'alcoholTolerancePct' | 'fermentDays' | 'technicalSource'>): YeastCandidateSheetUpdate | undefined {
  if (yeast.localDocumentary !== undefined || yeast.stockItemRef !== undefined) return undefined;
  const documentaryView = readYeastDocumentaryView(yeast);
  if (documentaryView.status === 'invalid' || documentaryView.status === 'conflict' ||
      documentaryView.status === 'valid' && documentaryView.scope === 'local') return undefined;
  const effective = yeastWithAdoptedDocumentary(yeast);
  const hopIndexId = effective.hopIndexId?.trim();
  if (!hopIndexId || hopIndexId.length > 200) return undefined;
  const selectionUnknown = (key: keyof YeastTechnicalSelections) => !!effective.technicalSelections &&
    Object.prototype.hasOwnProperty.call(effective.technicalSelections, key) && effective.technicalSelections[key] === null;
  const candidateDocumentary: YeastCandidateDocumentaryFields = {
    ...(effective.lab !== undefined ? { lab: effective.lab } : {}), ...(effective.strain !== undefined ? { strain: effective.strain } : {}),
    ...(effective.form !== undefined ? { form: effective.form } : {}),
    ...(effective.attenuationBasis === 'declared' && effective.attenuationPct !== undefined && !selectionUnknown('attenuation') ? { declaredAttenuationPct: effective.attenuationPct } : {}),
    ...(effective.fermTempMinC !== undefined && !selectionUnknown('temperature') ? { fermTempMinC: effective.fermTempMinC } : {}),
    ...(effective.fermTempMaxC !== undefined && !selectionUnknown('temperature') ? { fermTempMaxC: effective.fermTempMaxC } : {}),
    ...(effective.flocculation !== undefined ? { flocculation: effective.flocculation } : {}),
    ...(effective.alcoholTolerancePct !== undefined && !selectionUnknown('alcoholTolerance') ? { alcoholTolerancePct: effective.alcoholTolerancePct } : {}),
    ...(effective.fermentDays !== undefined ? { fermentDays: effective.fermentDays } : {}),
    ...(effective.technicalSource !== undefined ? { technicalSource: effective.technicalSource } : {})
  };
  const adopted = readAdoptedYeastDocumentary(effective);
  if (adopted?.documentary) Object.assign(candidateDocumentary, adopted.documentary);
  if (selectionUnknown('attenuation')) candidateDocumentary.declaredAttenuationPct = null;
  if (selectionUnknown('temperature')) { candidateDocumentary.fermTempMinC = null; candidateDocumentary.fermTempMaxC = null; }
  if (selectionUnknown('alcoholTolerance')) candidateDocumentary.alcoholTolerancePct = null;
  if (selectionUnknown('flocculation')) candidateDocumentary.flocculation = null;
  const body = readYeastDocumentaryBody({
    ...(effective.technicalFacts !== undefined ? { technicalFacts: effective.technicalFacts } : {}),
    ...(effective.technicalSelections !== undefined ? { technicalSelections: effective.technicalSelections } : {}),
    ...(effective.documentaryNotes !== undefined ? { documentaryNotes: effective.documentaryNotes } : {}),
    ...(effective.fermentationFacts !== undefined ? { fermentationFacts: effective.fermentationFacts } : {}),
    ...(Object.keys(candidateDocumentary).length ? { documentary: candidateDocumentary } : {})
  });
  return body ? { hopIndexId, ...body } : undefined;
}

/** Hydrate documentary candidate facts onto a fresh candidate spec, preserving only this recipe's explicit recipe/measured attenuation. */
export function mergeYeastCandidateSheet(baseCandidate: YeastSpec, sheet: YeastCandidateSheetDraft): YeastSpec | undefined {
  if (!baseCandidate.hopIndexId || baseCandidate.hopIndexId !== sheet.hopIndexId || baseCandidate.localDocumentary !== undefined) return undefined;
  const validated = readYeastCandidateSheets({ [sheet.hopIndexId]: sheet })?.[sheet.hopIndexId];
  if (!validated) return undefined;
  const documentary = validated.documentary;
  const owns = (value: object | undefined, key: PropertyKey) => !!value && Object.prototype.hasOwnProperty.call(value, key);
  const explicitHypothesis = baseCandidate.attenuationBasis === 'recipe' || baseCandidate.attenuationBasis === 'measured';
  const attenuationUnknown = owns(validated.technicalSelections, 'attenuation') && validated.technicalSelections?.attenuation === null;
  const temperatureUnknown = owns(validated.technicalSelections, 'temperature') && validated.technicalSelections?.temperature === null;
  const alcoholToleranceUnknown = owns(validated.technicalSelections, 'alcoholTolerance') && validated.technicalSelections?.alcoholTolerance === null;
  const flocculationSelected = owns(validated.technicalSelections, 'flocculation');
  const flocculationUnknown = flocculationSelected && validated.technicalSelections?.flocculation === null;
  const selectedFlocculation = flocculationSelected ? validated.technicalSelections?.flocculation?.reported : undefined;
  const effectiveFacts = validated.technicalFacts ?? baseCandidate.technicalFacts;
  const flocculationFacts = (effectiveFacts ?? []).filter(fact => fact.key === 'flocculation');
  const distinctFlocculation = new Set(flocculationFacts.map(fact => fact.reported.trim().toLocaleLowerCase('fr')));
  const factFlocculation = flocculationFacts.length && distinctFlocculation.size === 1 ? flocculationFacts[0].reported : undefined;
  const flocculationFromFactsUnknown = flocculationFacts.length > 0 && distinctFlocculation.size !== 1;
  const documentaryValue = (key: keyof YeastCandidateDocumentaryFields, fallback: unknown): unknown =>
    owns(documentary, key) ? documentary?.[key] ?? undefined : fallback;
  const declaredAttenuation = attenuationUnknown ? undefined : documentary?.declaredAttenuationPct ??
    (owns(documentary, 'declaredAttenuationPct') ? undefined : baseCandidate.attenuationBasis === 'declared' ? baseCandidate.attenuationPct : undefined);
  return {
    ...baseCandidate,
    lab: documentaryValue('lab', baseCandidate.lab) as string | undefined,
    strain: documentaryValue('strain', baseCandidate.strain) as string | undefined,
    form: documentaryValue('form', baseCandidate.form) as YeastSpec['form'],
    attenuationPct: explicitHypothesis ? baseCandidate.attenuationPct : declaredAttenuation,
    attenuationBasis: explicitHypothesis ? baseCandidate.attenuationBasis : declaredAttenuation !== undefined ? 'declared' : undefined,
    fermTempMinC: temperatureUnknown ? undefined : documentaryValue('fermTempMinC', baseCandidate.fermTempMinC) as number | undefined,
    fermTempMaxC: temperatureUnknown ? undefined : documentaryValue('fermTempMaxC', baseCandidate.fermTempMaxC) as number | undefined,
    flocculation: (flocculationUnknown || flocculationFromFactsUnknown ? undefined
      : flocculationSelected ? selectedFlocculation : factFlocculation ?? documentaryValue('flocculation', baseCandidate.flocculation)) as string | undefined,
    alcoholTolerancePct: alcoholToleranceUnknown ? undefined : documentaryValue('alcoholTolerancePct', baseCandidate.alcoholTolerancePct) as number | undefined,
    fermentDays: documentaryValue('fermentDays', baseCandidate.fermentDays) as number | undefined,
    technicalSource: documentaryValue('technicalSource', baseCandidate.technicalSource) as string | undefined,
    ...(effectiveFacts !== undefined ? { technicalFacts: structuredClone(effectiveFacts) } : {}),
    ...(Object.prototype.hasOwnProperty.call(validated, 'documentaryNotes') ? { documentaryNotes: structuredClone(validated.documentaryNotes!) }
      : baseCandidate.documentaryNotes !== undefined ? { documentaryNotes: structuredClone(baseCandidate.documentaryNotes) } : {}),
    ...(Object.prototype.hasOwnProperty.call(validated, 'technicalSelections') ? { technicalSelections: structuredClone(validated.technicalSelections!) }
      : baseCandidate.technicalSelections !== undefined ? { technicalSelections: structuredClone(baseCandidate.technicalSelections) } : {}),
    ...(Object.prototype.hasOwnProperty.call(validated, 'fermentationFacts') ? { fermentationFacts: structuredClone(validated.fermentationFacts!) }
      : baseCandidate.fermentationFacts !== undefined ? { fermentationFacts: structuredClone(baseCandidate.fermentationFacts) } : {})
  };
}

/** Accept candidate facts only against the identity/revision captured before lookup or editing. */
export function tryAcceptYeastCandidateSheet(
  draft: RecipeWizardDraft,
  update: YeastCandidateSheetUpdate,
  expectedRevision: number
): YeastCandidateSheetAcceptance {
  const { hopIndexId } = update;
  if (!hopIndexId.trim() || hopIndexId !== hopIndexId.trim() || hopIndexId.length > 200)
    return { accepted: false, reason: 'identity', message: 'Identité de souche absente ou invalide. Sélectionnez de nouveau le candidat avant d’enregistrer ses faits.' };
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)
    return { accepted: false, reason: 'revision', message: 'Révision de fiche candidate invalide. Rouvrez la fiche actuelle avant de réessayer.' };
  const currentSheets = draft.candidateSheets ?? {};
  if (draft.candidateSheets !== undefined && !readYeastCandidateSheets(draft.candidateSheets))
    return { accepted: false, reason: 'invalid', message: 'Les fiches candidates du brouillon sont invalides. Récupérez-les ou corrigez-les avant de remplacer une fiche.' };
  const current = currentSheets[hopIndexId];
  if ((current?.revision ?? 0) !== expectedRevision)
    return { accepted: false, reason: 'revision', message: 'Cette fiche candidate a changé depuis la demande. Rouvrez sa version actuelle et acceptez une réponse correspondante.' };
  const normalized = readYeastCandidateSheets({
    [hopIndexId]: { ...update, revision: expectedRevision + 1 }
  });
  if (!normalized)
    return { accepted: false, reason: 'invalid', message: 'Les faits candidats sont invalides. Vérifiez identité, unités, observations et sélections avant de réessayer.' };
  const next = { ...draft, candidateSheets: { ...currentSheets, [hopIndexId]: normalized[hopIndexId] }, candidateSheetsReadWarning: undefined };
  return { accepted: true, draft: next, hopIndexId, revision: normalized[hopIndexId].revision };
}

/** Backward-compatible draft-only helper for callers that need no refusal message. */
export function acceptYeastCandidateSheet(
  draft: RecipeWizardDraft,
  update: YeastCandidateSheetUpdate,
  expectedRevision: number
): RecipeWizardDraft | undefined {
  const result = tryAcceptYeastCandidateSheet(draft, update, expectedRevision);
  return result.accepted ? result.draft : undefined;
}

// NaN is an editor-only missing number. Keep it missing through JSON instead of
// restoring a default or a zero. Validated recipes never contain this marker.
export function serializeRecipeDraft(draft: RecipeWizardDraft): string {
  const { candidateSheetsReadWarning: _warning, ...persistedDraft } = draft;
  return JSON.stringify({ version: 1, draft: persistedDraft }, (_key, value) =>
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
    const candidateSheets = draft?.candidateSheets === undefined ? undefined : readYeastCandidateSheets(draft.candidateSheets);
    if (stored?.version !== 1 || !draft?.recipe || typeof draft.recipe.id !== 'string' ||
      typeof draft.recipe.name !== 'string' || !draft.details || !draft.water ||
      !['identite', 'fermentescibles', 'houblons', 'levure', 'paliers', 'eau', 'recap'].includes(draft.step)) return undefined;
    const { candidateSheets: _unreadCandidateSheets, candidateSheetsReadWarning: _oldWarning, ...recoverableDraft } = draft;
    const candidateSheetsInvalid = draft.candidateSheets !== undefined && !candidateSheets;
    return { ...recoverableDraft, ...(candidateSheets ? { candidateSheets } : {}),
      ...(candidateSheetsInvalid ? { candidateSheetsReadWarning: 'Les fiches candidates de ce brouillon sont invalides et n’ont pas été restaurées. La recette et les autres étapes sont conservées; rechargez ou corrigez ces fiches avant de les réutiliser.' } : {}) };
  } catch { return undefined; }
}

export function writeRecipeDraft(key: string, serialized: string): void {
  localStorage.setItem(PREFIX + key, serialized);
}

export function clearRecipeDraft(key: string | undefined): void {
  if (key) localStorage.removeItem(PREFIX + key);
}
